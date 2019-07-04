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
            reject(err)
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
            reject(err)
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
          reject(err)
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
          reject(err)
        })
    })
  }
/*
  public search(request: SearchRequest) {
    // store.commit('startSearch')
    // store.commit('updateRequest', request)
    axios.get(this.buildSearchUrl(request))
      .then((response) => {
        const results = response.data as SearchResults
        // store.commit('setServerResults', [this.patchServerUrls(results), request ])
      })
      .catch((error) => {
          console.log(this.getErrorMessage(error))
        // store.commit('setServerError', this.getErrorMessage(error))
      })
  }
*/

  private getErrorMessage(error: any) {
    let message = error.toString()
    if (error.response != null && error.response.data != null) {
      const jsonError = error.response.data as TrackManagerErrorResponse
      message = jsonError.error + ': ' + jsonError.reason
    }
    return message
  }
/*
  private buildSearchUrl(request: SearchRequest) {
    switch (request.searchType) {
      case 's':
        let surl = SearchService.baseServerUrl + 'api/search?' + this.buildQueryParams(request)
          + '&first=' + request.first + '&count='
          + request.pageCount + '&properties='
          + request.properties + '&categories=keywords,tags,placename,date'
        return surl

      case 'd':
        let durl = SearchService.baseServerUrl + 'api/by-day?' + this.buildQueryParams(request)
          + '&first=' + request.first + '&count=' + request.pageCount + '&properties='
          + request.properties + '&categories=keywords,tags,placename,year'
        if (request.drilldown !== undefined && request.drilldown.length > 0) {
          durl += '&drilldown=' + request.drilldown
        }
        return durl

      case 'l':
        let lurl = SearchService.baseServerUrl + 'api/nearby?' + this.buildQueryParams(request)
          + '&first=' + request.first + '&count=' + request.pageCount + '&properties='
          + request.properties + '&categories=keywords,tags,date'
        if (request.maxKilometers > 0) {
          lurl += '&maxKilometers=' + request.maxKilometers
        }
        if (request.drilldown !== undefined && request.drilldown.length > 0) {
          lurl += '&drilldown=' + request.drilldown
        }
        return lurl
    }

    throw new Error('Unhandled searchType: ' + request.searchType)
  }
*/
/*
  private patchServerUrls(results: SearchResults): SearchResults {
    if (SearchService.baseServerUrl === '/') {
      return results
    }

    for (const g of results.groups) {
      for (const i of g.items) {
        if (i.mediaUrl) {
          i.mediaUrl = SearchService.baseServerUrl + i.mediaUrl.slice(1)
        }
        if (i.slideUrl) {
          i.slideUrl = SearchService.baseServerUrl + i.slideUrl.slice(1)
        }
        if (i.thumbUrl) {
          i.thumbUrl = SearchService.baseServerUrl + i.thumbUrl.slice(1)
        }
      }
    }
    return results
  }
*/
}

export const searchService = new SearchService()
