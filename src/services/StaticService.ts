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
              resolve(response.data as SearchResults)
            }, (err) => {
              reject(this.getErrorMessage(err))
            })
            })
    }

    public getTrack(id: string): Promise<SearchTrack> {
        const localId = decodeURI(id)
            .replace(new RegExp('%2F', 'g'), '')
            .replace(new RegExp('-', 'g'), '')
            .replace('.', '')
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
            .replace('.', '')
            .substring(4)
            .replace('gpx', '')
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
            reject(`loadOriginalTrack not done yet`)
        })
    }

    private getErrorMessage(error: any) {
        let message = error.message
        if (error.response != null) {
            if (error.response.data != null) {
            const jsonError = error.response.data as TrackManagerErrorResponse
            message = jsonError.error + ': ' + jsonError.reason
            } else {
            message = `${error.response.status}: ${error.message}`
            }
        }
        return message
    }
}
