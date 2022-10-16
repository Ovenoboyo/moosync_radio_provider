import dns from 'dns'
import { CacheHandler } from '../cacheHandler'
import { Song } from '@moosync/moosync-types'
import { makeRequest } from './utils'
import { URL } from 'url'
export class RadioBrowserWrapper {
  private cacheHandler = new CacheHandler('./radio_browser_cache', false)

  private async _get<T>(url: string): Promise<T> {
    const cache = await this.cacheHandler.getCache(url)
    if (cache) {
      console.log('from cache')
      return JSON.parse(cache)
    }

    const BASE_URL = await this.getRandomBaseURL()
    const resp = await makeRequest(`${BASE_URL}/json${url}`)

    await this.cacheHandler.addToCache(url, JSON.stringify(resp))
    return resp as T
  }

  /**
   * Get a list of base urls of all available radio-browser servers
   * Returns: array of strings - base urls of radio-browser servers
   */
  private async getBaseURLs(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      dns.resolveSrv('_api._tcp.radio-browser.info', (err, addresses) => {
        if (err !== null) {
          reject(err)
        }
        resolve(addresses.sort().map((host) => 'https://' + host.name))
      })
    })
  }

  /**
   * Get a random available radio-browser server.
   * Returns: string - base url for radio-browser api
   */
  private async getRandomBaseURL() {
    const hosts = await this.getBaseURLs()
    var item = hosts[Math.floor(Math.random() * hosts.length)]
    return item
  }

  private isUrlValid(url: string) {
    try {
      new URL(url)
      return true
    } catch {}
    return false
  }

  private parseRadioStations(...stations: StationStruct[]) {
    const songList: Song[] = []
    for (const s of stations) {
      if (s.url_resolved && this.isUrlValid(s.url_resolved)) {
        songList.push({
          _id: s.stationuuid,
          title: s.name,
          duration: -1,
          song_coverPath_high: s.favicon,
          type: s.hls ? 'HLS' : 'URL',
          bitrate: s.bitrate,
          codec: s.codec,
          genre: s.tags.split(','),
          playbackUrl: s.url_resolved,
          url: s.url,
          date_added: Date.parse(s.lastchangetime_iso8601)
        })
      }
    }

    return songList
  }

  public async fetchTopRadioStations(limit = 100) {
    const resp = await this._get<StationStruct[]>(`/stations/topclick?limit=${limit}&order=votes&hideBroken=true`)
    return this.parseRadioStations(...resp)
  }

  private parseSearchPrefix(term: string): [string, string] {
    const match = term.match(/(tag|codec|state|country|name|language):/g)
    if (match && match.length > 0) {
      return [match[0].replace(':', ''), term.replace(match[0], '')]
    }

    return ['name', term]
  }

  public async searchRadioStation(term: string, limit = 100) {
    const prefix = this.parseSearchPrefix(term)
    const resp = await this._get<StationStruct[]>(
      `/stations/by${prefix[0]}/${prefix[1]}?limit=${limit}&order=votes&hideBroken=true`
    )

    return this.parseRadioStations(...resp)
  }

  public async searchRadioStationsByUrl(url: string) {
    const resp = await this._get<StationStruct[]>(`/stations/byurl?url=${url}`)
    return this.parseRadioStations(...resp)
  }
}

// new RadioBrowserWrapper().fetchTopRadioStations().then((val) => console.log(val.length))
