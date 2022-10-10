import { MoosyncExtensionTemplate, Playlist } from '@moosync/moosync-types'
import { RadioBrowserWrapper } from './api/radioBrowser'

export class MyExtension implements MoosyncExtensionTemplate {
  private radioApi = new RadioBrowserWrapper()

  async onStarted() {
    console.info('Extension started')
    this.registerEvents()
  }

  async onStopped() {
    console.info('Extension stopped')
  }

  private async registerEvents() {
    api.on('requestedPlaylists', async () => {
      return {
        playlists: this.RadioPlaylists
      }
    })

    api.on('requestedPlaylistSongs', async (playlistId) => {
      if (playlistId === this.RadioPlaylists[0].playlist_id) {
        const stations = await this.radioApi.fetchTopRadioStations()
        return { songs: stations }
      }
    })

    api.on('requestedSearchResult', async (term: string) => {
      const stations = await this.radioApi.searchRadioStation(term)
      return {
        songs: stations,
        playlists: [],
        artists: [],
        albums: []
      }
    })
    api.registerSearchProvider('Radio')

    api.on('requestedSongFromURL', async (url) => {
      const station = await this.radioApi.searchRadioStationsByUrl(url)
      if (station.length > 0) {
        return {
          song: station[0]
        }
      }
    })
  }

  private get RadioPlaylists(): Playlist[] {
    return [
      {
        playlist_id: 'top-radio-stations',
        playlist_name: 'Top Radio Stations',
        playlist_coverPath: undefined
      }
    ]
  }
}
