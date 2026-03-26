/** Low-level HTTP client for Canada Post REST API */

const getBaseUrl = () => process.env.CANADAPOST_BASE_URL || 'https://ct.soa-gw.canadapost.ca'
const getAuth = () => {
  const user = process.env.CANADAPOST_API_USER!
  const pass = process.env.CANADAPOST_API_PASSWORD!
  return 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64')
}

export async function cpFetch(
  path: string,
  options: {
    method?: string
    body?: string
    accept?: string
    contentType?: string
  } = {}
): Promise<{ status: number; text: string }> {
  const url = `${getBaseUrl()}${path}`
  const method = options.method || 'POST'

  const headers: Record<string, string> = {
    Authorization: getAuth(),
    Accept: options.accept || 'application/vnd.cpc.ship.rate-v4+xml',
  }

  if (options.contentType) {
    headers['Content-Type'] = options.contentType
  }

  const res = await fetch(url, {
    method,
    headers,
    body: options.body,
  })

  const text = await res.text()
  return { status: res.status, text }
}
