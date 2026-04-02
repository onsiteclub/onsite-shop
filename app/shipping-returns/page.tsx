import { Navbar } from '@/components/shop/Navbar';
import { Footer } from '@/components/shop/Footer';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping & Returns',
  description: 'Shipping information and return policy for OnSite Club Shop. We ship across Canada via Canada Post.',
};

export default function ShippingReturnsPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-[72px]">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <span className="font-display text-[11px] font-bold tracking-[0.2em] uppercase text-warm-400 block mb-3">Policies</span>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-text-primary mb-10">
            Shipping &amp; Returns
          </h1>

          <div className="prose-section">
            <h2>Shipping</h2>
            <p>
              All orders are shipped via <strong>Canada Post</strong> from Ontario, Canada. We ship to all Canadian provinces and territories.
            </p>

            <h3>Processing Time</h3>
            <p>
              Orders are processed within <strong>1–3 business days</strong> after payment is confirmed. You will receive an email notification with tracking information once your order has shipped.
            </p>

            <h3>Delivery Times</h3>
            <table>
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Estimated Delivery</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Expedited Parcel</td>
                  <td>3–7 business days</td>
                </tr>
                <tr>
                  <td>Xpresspost</td>
                  <td>2–3 business days</td>
                </tr>
                <tr>
                  <td>Regular Parcel</td>
                  <td>5–10 business days</td>
                </tr>
              </tbody>
            </table>
            <p>
              Delivery times are estimates provided by Canada Post and may vary depending on your location, weather, and other factors outside our control.
            </p>

            <h3>Shipping Costs</h3>
            <p>
              Shipping rates are calculated at checkout based on your location and order weight. Free shipping is available on qualifying orders and for promotional offers.
            </p>

            <h3>Tracking</h3>
            <p>
              A tracking number will be emailed to you once your order ships. You can track your package on the <a href="https://www.canadapost-postescanada.ca/track-reperage/en" target="_blank" rel="noopener noreferrer">Canada Post website</a>.
            </p>

            <hr />

            <h2>Returns &amp; Exchanges</h2>

            <h3>Return Policy</h3>
            <p>
              We accept returns within <strong>30 days</strong> of delivery for items that are unused, unwashed, and in their original condition with all tags attached.
            </p>

            <h3>Non-Returnable Items</h3>
            <ul>
              <li>Stickers and sticker kits (sealed products)</li>
              <li>Items that have been worn, washed, or altered</li>
              <li>Items purchased with promotional codes at 50% off or more</li>
            </ul>

            <h3>How to Initiate a Return</h3>
            <ol>
              <li>Email us at <a href="mailto:contact@onsiteclub.ca">contact@onsiteclub.ca</a> with your order number and reason for return.</li>
              <li>We will provide return shipping instructions within 1–2 business days.</li>
              <li>Ship the item(s) back in their original packaging.</li>
              <li>Once received and inspected, your refund will be processed within 5–7 business days.</li>
            </ol>

            <h3>Return Shipping</h3>
            <p>
              Return shipping costs are the responsibility of the customer unless the return is due to a defect or error on our part.
            </p>

            <h3>Exchanges</h3>
            <p>
              To exchange an item for a different size or color, please initiate a return and place a new order. This ensures the fastest processing time.
            </p>

            <h3>Refunds</h3>
            <p>
              Refunds are issued to the original payment method. Please allow 5–10 business days for the refund to appear on your statement after we process it.
            </p>

            <hr />

            <h2>Damaged or Defective Items</h2>
            <p>
              If you receive a damaged or defective item, please contact us within <strong>7 days</strong> of delivery with photos of the issue. We will arrange a replacement or full refund at no additional cost to you.
            </p>

            <h2>Contact Us</h2>
            <p>
              For questions about shipping or returns, email us at{' '}
              <a href="mailto:contact@onsiteclub.ca">contact@onsiteclub.ca</a>.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
