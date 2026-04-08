/** Canada Post Tracking API — look up parcel status by tracking PIN */

import { XMLParser } from 'fast-xml-parser'
import { cpFetch } from './client'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
})

export interface TrackingEvent {
  date: string           // YYYY-MM-DD
  time: string           // HH:MM:SS
  timeZone: string
  description: string
  location: string       // "City, Province"
}

export interface TrackingResult {
  found: boolean
  pin: string
  serviceName?: string
  expectedDeliveryDate?: string | null
  latestStatus?: string
  latestLocation?: string
  latestDate?: string
  events?: TrackingEvent[]
  error?: string
}

/**
 * Fetch tracking details from Canada Post for a given tracking PIN.
 * Returns parsed tracking info with event history.
 */
export async function getTracking(trackingPin: string): Promise<TrackingResult> {
  try {
    const cleanPin = trackingPin.replace(/\s/g, '')

    const { status, text } = await cpFetch(
      `/vis/track/pin/${cleanPin}/detail`,
      {
        method: 'GET',
        accept: 'application/vnd.cpc.track-v2+xml',
      }
    )

    if (status !== 200) {
      console.error(`[Canada Post] Tracking API ${status}:`, text)
      return { found: false, pin: cleanPin, error: `Canada Post returned status ${status}` }
    }

    // Check for error messages in response
    const parsed = parser.parse(text)
    if (parsed.messages?.message) {
      const msgs = Array.isArray(parsed.messages.message)
        ? parsed.messages.message
        : [parsed.messages.message]
      const desc = msgs.map((m: any) => m.description || '').join('; ')
      return { found: false, pin: cleanPin, error: desc || 'No tracking results found' }
    }

    const detail = parsed['tracking-detail']
    if (!detail) {
      return { found: false, pin: cleanPin, error: 'No tracking data in response' }
    }

    // Parse events
    const rawEvents = detail['significant-events']?.occurrence
    const eventsArr = Array.isArray(rawEvents) ? rawEvents : rawEvents ? [rawEvents] : []

    const events: TrackingEvent[] = eventsArr.map((e: any) => ({
      date: String(e['event-date'] || ''),
      time: String(e['event-time'] || ''),
      timeZone: String(e['event-time-zone'] || ''),
      description: String(e['event-description'] || ''),
      location: [e['event-site'], e['event-province']].filter(Boolean).join(', '),
    }))

    // Latest event is first in the array
    const latest = events[0]

    // Use changed expected date if available, otherwise original
    const expectedDate = detail['changed-expected-date'] || detail['expected-delivery-date'] || null

    return {
      found: true,
      pin: cleanPin,
      serviceName: detail['service-name'] || undefined,
      expectedDeliveryDate: expectedDate ? String(expectedDate) : null,
      latestStatus: latest?.description || undefined,
      latestLocation: latest?.location || undefined,
      latestDate: latest ? `${latest.date} ${latest.time} ${latest.timeZone}` : undefined,
      events: events.slice(0, 5), // Last 5 events for the bot
    }
  } catch (err) {
    console.error('[Canada Post] Tracking error:', err)
    return { found: false, pin: trackingPin, error: 'Could not fetch tracking info at this time.' }
  }
}
