import { SearchTimezoneInfo } from '@/models/SearchResults'

export interface Gps {
    tracks: GpsTrack[]
    stops: GpsPoint[]
    timezoneInfo: SearchTimezoneInfo
    startTime: Date
    endTime: Date
    bounds: GpsBounds
}

export interface GpsBounds {
    min: GeoPoint
    max: GeoPoint
}

export interface GeoPoint {
    lat: number
    lon: number
}

export interface GpsTrack {
    runs: GpsRun[]
    bounds: GpsBounds
    durationSeconds: number
    distanceKilometers: number
}

export interface GpsRun {
    points: GpsPoint[]
    bounds: GpsBounds
    kilometers: number
    seconds: number
    secondsIntoTrack: number
    kilometersIntoTrack: number
    transportationTypes: GpsTransportationType[]
}

export interface GpsPoint {
    latitude: number
    longitude: number
    time: string
    elevation: number
    course: number
    speedMs: number
    speedKmH: number
    transportationTypes: GpsTransportationType[]
    metersFromPrevious: number
    kilometersIntoRun: number
    secondsIntoRun: number
    calculatedSpeedKmHFromPrevious: number
}

export const emptyGpsPoint: GpsPoint = {
    latitude: 0,
    longitude: 0,
    time: '',
    elevation: 0,
    course: 0,
    speedMs: 0,
    speedKmH: 0,
    transportationTypes: [],
    metersFromPrevious: 0,
    kilometersIntoRun: 0,
    secondsIntoRun: 0,
    calculatedSpeedKmHFromPrevious: 0,
} as GpsPoint

export interface GpsTransportationType {
    probability: number
    mode: string
}
