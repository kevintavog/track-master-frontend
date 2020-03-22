import { GeoPoint } from '@/models/Gps'

export class SearchResultsHelper {
    public static augment(track: SearchTrack): SearchTrack {
        const siteToLocation: {[key: string]: GeoPoint} = {}
        for (const s of track.sites) {
            for (const n of s.names) {
                siteToLocation[n] = { lat: s.latitude, lon: s.longitude }
            }
        }
        track.sitesToLocation = siteToLocation
        track.siteNames = Object.keys(siteToLocation)
        return track
    }
}

export interface SearchResults {
    matches: SearchTrack[]
    totalMatches: number
}

export interface SearchTrack {
    id: string
    cityNames: string[]
    countryCodes: string[]
    countryNames: string[]
    stateNames: string[]
    sites: SearchPlacenameSite[]
    sitesToLocation: {[key: string]: GeoPoint}
    siteNames: string[]
    path: string
    startTime: string
    endTime: string
    timezoneInfo: SearchTimezoneInfo
    kilometers: number
    movingSeconds: number
    seconds: number
}

export interface SearchPlacenameSite {
    names: string[]
    latitude: number
    longitude: number
}

export interface SearchTimezoneInfo {
    id: string
    tag: string
}

export const emptySearchTrack: SearchTrack = {
    id: '',
    cityNames: [],
    countryCodes: [],
    countryNames: [],
    stateNames: [],
    sites: [],
    sitesToLocation: {},
    siteNames: [],
    path: '',
    startTime: Date(),
    endTime: Date(),
    timezoneInfo: {
        id: '',
        tag: '',
    },
    kilometers: 0,
    movingSeconds: 0,
    seconds: 0,
} as SearchTrack


export interface TrackManagerErrorResponse {
    error: string
    reason: string
}
