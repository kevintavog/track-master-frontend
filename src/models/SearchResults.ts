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
    timezoneInfo: SearchTimezoneInfo
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
    siteNames: [],
    path: '',
    startTime: Date(),
    endTime: Date(),
    timezoneInfo: {
        id: '',
        tag: '',
    },
} as SearchTrack


export interface TrackManagerErrorResponse {
    error: string
    reason: string
}
