import axios from 'axios'
import { SearchResults, SearchTrack, TrackManagerErrorResponse } from '@/models/SearchResults'

class SearchService {
  // private static baseServerUrl = process.env.NODE_ENV === 'production' ? 'http://jupiter/findaphoto/' : '/'
  private static baseServerUrl = process.env.NODE_ENV !== 'production' ? 'http://localhost:8080/' : '/'

  public list(first: number, count: number): Promise<SearchResults> {
    const url = SearchService.baseServerUrl + 'api/tracks?'
        + '&first=' + first
        + '&count=' + count
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
    const url = SearchService.baseServerUrl + `api/tracks/${id}`
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
    const url = SearchService.baseServerUrl + `api/tracks/${id}/raw`
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
    const url = SearchService.baseServerUrl + `api/tracks/${id}/original`
    return new Promise((resolve, reject) => {
      axios.get(url)
        .then((response) => {
          resolve(response.data as string)
        }, (err) => {
          reject(this.getErrorMessage(err))
        })
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

export const searchService = new SearchService()
