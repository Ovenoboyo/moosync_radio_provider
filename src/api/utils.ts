import http from 'http'
import https from 'https'
import { URL } from 'url'

export function makeRequest(url: string, method: 'GET' | 'POST' | 'OPTIONS' = 'GET') {
  const parsedUrl = new URL(url)
  const requester = parsedUrl.protocol === 'https:' ? https : http
  return new Promise<unknown>((resolve, reject) => {
    let data = ''

    requester
      .request(
        {
          hostname: parsedUrl.hostname,
          path: parsedUrl.pathname + parsedUrl.search,
          method,
          protocol: parsedUrl.protocol
        },
        (res) => {
          res.on('data', (chunk) => {
            data += chunk
          })

          res.on('end', () => {
            try {
              const parsed = JSON.parse(data)
              resolve(parsed)
            } catch (e) {
              console.warn('Unable to parse data as JSON')
              resolve(data)
            }
          })
        }
      )
      .on('error', reject)
      .end()
  })
}
