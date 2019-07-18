import axios from 'axios'
import { SearchResults, SearchTrack, TrackManagerErrorResponse } from '@/models/SearchResults'
import { TrackMasterServer } from '@/services/TrackMasterServer'

export class StaticService implements TrackMasterServer {
    public list(first: number, count: number): Promise<SearchResults> {
        // TODO: Handle paging
        const url = 'data/list.json'
        return new Promise((resolve, reject) => {
            axios.get(url)
            .then((response) => {
                const searchResults = response.data as SearchResults
                searchResults.matches = searchResults.matches.slice(first, first + count)
              resolve(searchResults)
            }, (err) => {
              reject(this.getErrorMessage(err))
            })
        })
    }

    public getTrack(id: string): Promise<SearchTrack> {
        const localId = decodeURI(id)
            .replace(new RegExp('%2F', 'g'), '')
            .replace(new RegExp('-', 'g'), '')
            + '.json'
        const url = `data/documents/${localId}`

        return new Promise((resolve, reject) => {
            axios.get(url)
            .then((response) => {
                resolve(response.data as SearchTrack)
            }, (err) => {
                reject(this.getErrorMessage(err))
            })
        })
  }

    public loadTrack(id: string): Promise<string> {
        const localId = decodeURI(id)
            .replace(new RegExp('%2F', 'g'), '')
            .replace(new RegExp('-', 'g'), '')
            + '.json'
        const url = `data/raw/${localId}`
        return new Promise((resolve, reject) => {
            axios.get(url)
              .then((response) => {
                resolve(response.data as string)
              }, (err) => {
                reject(this.getErrorMessage(err))
              })
          })
    }

    public loadOriginalTrack(id: string): Promise<string> {
        return new Promise((resolve, reject) => {
            reject(`loadOriginalTrack is not supported currently`)
        })
    }

    private getErrorMessage(error: any) {
        let message = error.message
        if (error.response != null) {
            message = `${error.response.status}: ${error.message}`
        }
        return message
    }
}
