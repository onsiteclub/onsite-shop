import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createShipment, downloadLabel } from '@/lib/canada-post/shipment'
import { calculatePackage } from '@/lib/stripe-config'
import type { ShipmentAddress } from '@/lib/canada-post/types'

/**
 * POST /api/shipping/create-label
 * Creates a Canada Post shipment, downloads the PDF label,
 * uploads it to Supabase Storage, and updates the order.
 *
 * Body: { orderId, serviceCode }
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Auth check — admin only
    const cookieStore = cookies()
    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value },
          set() {},
          remove() {},
        },
      }
    )

    const { data: { user } } = await authClient.auth.getUser()
    if (!user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: admin } = await authClient
      .from('admin_users')
      .select('email')
      .eq('email', user.email)
      .single()

    if (!admin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    // 2. Parse request
    const { orderId, serviceCode } = await req.json()
    if (!orderId || !serviceCode) {
      return NextResponse.json({ error: 'Missing orderId or serviceCode' }, { status: 400 })
    }

    // 3. Fetch the order
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: order, error: orderError } = await serviceClient
      .from('app_shop_orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const shippingAddr = order.shipping_address
    if (!shippingAddr?.name || !shippingAddr?.street || !shippingAddr?.city || !shippingAddr?.province || !shippingAddr?.postal_code) {
      return NextResponse.json({ error: 'Order missing shipping address' }, { status: 400 })
    }

    // 4. Build sender from env vars
    const sender: ShipmentAddress = {
      name: process.env.CANADAPOST_SENDER_NAME || 'Onsite Club',
      company: process.env.CANADAPOST_SENDER_COMPANY || 'Onsite Club',
      phone: process.env.CANADAPOST_SENDER_PHONE || '000-000-0000',
      addressLine1: process.env.CANADAPOST_SENDER_ADDRESS!,
      city: process.env.CANADAPOST_SENDER_CITY!,
      province: process.env.CANADAPOST_SENDER_PROVINCE!,
      postalCode: process.env.CANADAPOST_ORIGIN_POSTAL!,
    }

    if (!sender.addressLine1 || !sender.city || !sender.province) {
      return NextResponse.json({ error: 'Sender address not configured (check CANADAPOST_SENDER_* env vars)' }, { status: 500 })
    }

    // 5. Build destination
    const destination: ShipmentAddress = {
      name: shippingAddr.name,
      addressLine1: shippingAddr.street,
      addressLine2: shippingAddr.apartment || undefined,
      city: shippingAddr.city,
      province: shippingAddr.province,
      postalCode: shippingAddr.postal_code,
      country: shippingAddr.country || 'CA',
    }

    // 6. Calculate package from order items
    const items = Array.isArray(order.items) ? order.items : []
    const pkg = calculatePackage(
      items.map((i: any) => ({ productKey: i.sku || '', quantity: i.qty || 1 }))
    )

    // 7. Create the shipment
    const shipmentResult = await createShipment({
      serviceCode,
      sender,
      destination,
      weight: pkg.weight,
      dimensions: { length: pkg.length, width: pkg.width, height: pkg.height },
      customerEmail: order.email || undefined,
      orderNumber: order.order_number,
    })

    if (shipmentResult.error) {
      return NextResponse.json({ error: shipmentResult.error }, { status: 502 })
    }

    // 8. Download the PDF label
    const { pdf, error: labelError } = await downloadLabel(shipmentResult.labelUrl)
    if (labelError || !pdf.length) {
      // Still save tracking even if label download fails
      await serviceClient
        .from('app_shop_orders')
        .update({ tracking_code: shipmentResult.trackingPin })
        .eq('id', orderId)

      return NextResponse.json({
        trackingPin: shipmentResult.trackingPin,
        error: `Shipment created but label download failed: ${labelError}`,
      }, { status: 207 })
    }

    // 9. Upload PDF to Supabase Storage
    const fileName = `${order.order_number}-${Date.now()}.pdf`
    const { error: uploadError } = await serviceClient.storage
      .from('shipping-labels')
      .upload(fileName, pdf, { contentType: 'application/pdf' })

    if (uploadError) {
      console.error('[create-label] Storage upload error:', uploadError)
      return NextResponse.json({
        trackingPin: shipmentResult.trackingPin,
        error: `Shipment created but label upload failed: ${uploadError.message}`,
      }, { status: 207 })
    }

    const { data: urlData } = serviceClient.storage
      .from('shipping-labels')
      .getPublicUrl(fileName)

    const labelUrl = urlData.publicUrl

    // 10. Update order with tracking + label
    await serviceClient
      .from('app_shop_orders')
      .update({
        tracking_code: shipmentResult.trackingPin,
        label_url: labelUrl,
      })
      .eq('id', orderId)

    return NextResponse.json({
      trackingPin: shipmentResult.trackingPin,
      labelUrl,
      shipmentId: shipmentResult.shipmentId,
    })
  } catch (error: any) {
    console.error('[create-label] Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to create label' }, { status: 500 })
  }
}
