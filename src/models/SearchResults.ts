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
    siteNames: string[]
    path: string
    startTime: string
    endTime: string

    flatCountries: string
    flatStates: string
    flatCities: string
    flatSites: string
}

/*
export const emptySearchTrack: SearchTrack = {
    id: '',
    cityNames: [],
    countryCodes: [],
    countryNames: [],
    stateNames: [],
    siteNames: [],
    path: string,
    startTime: Date,
    endTime: Date,
} as SearchTrack
*/

export interface TrackManagerErrorResponse {
    error: string
    reason: string
}
