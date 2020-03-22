import { Geo } from '@/utils/Geo'
import * as xml2js from 'xml2js'
import { Timezone } from '@/utils/Timezone'
import { DateTime } from 'luxon'
import { GeoPoint } from '@/models/Gps'

/*
<gpx [many attributes] >
    <metadata />
    <wpt .../>
    <wpt .../>
    <trk>
        <name>-- name goes here --</name>
        <trkseg>
            <trkpt lat="47.644548" lon="-122.326897">
                <ele>4.46</ele>
                <time>2009-10-17T18:37:26Z</time>
            </trkpt>
        </trkseg>
    </trk>
</gpx>
*/

export interface Gpx {
    waypoints: GpxWaypoint[]
    tracks: GpxTrack[]
    bounds: GpxBounds
    name: string
    startDate: DateTime
    endDate: DateTime
    kilometers: number
    seconds: number
    timezoneName: string
    rangic?: GpxRangicExtension
}

export interface GpxRangicExtension {
    kilometers: number
    seconds: number
    movingSeconds: number
    timezoneInfo: GpxRangicTimezoneInfo
    countries: string[]
    countryCodes: string[]
    stateNames: string[]
    cityNames: string[]
    siteNames: string[]
    sites: GpxRangicPlacenameSite[]
    siteToLocation: {[key: string]: GeoPoint}
}

export interface GpxRangicPlacenameSite {
    names: string[]
    latitude: number
    longitude: number
}

export interface GpxWaypoint {
    latitude: number
    longitude: number
    timestamp: DateTime
    seconds: number
    name: string
    timezoneName: string
    rangic?: GpxRangicWaypointExtension
}

export interface GpxRangicWaypointExtension {
    stopType: string
    beginLatitude: number
    beginLongitude: number
    beginTime: DateTime
    finishLatitude: number
    finishLongitude: number
    finishTime: DateTime
    seconds: number
    bounds: GpxBounds
}

export interface GpxTrack {
    segments: GpxSegment[]
    kilometers: number
    rangic?: GpxRangicTrackExtension
}

export interface GpxRangicTrackExtension {
    kilometers: number
    seconds: number
    bounds: GpxBounds
}

export interface GpxSegment {
    points: GpxPoint[]
    kilometers: number
    seconds: number
    timezoneName: string
    rangic?: GpxRangicSegmentExtension
}

export interface GpxRangicSegmentExtension {
    kilometers: number
    kmh: number
    bounds: GpxBounds
    transportationTypes: GpxRangicTransportationType[]
}

export interface GpxPoint {
    latitude: number
    longitude: number
    timestamp: DateTime
    calculatedMeters: number
    calculatedSpeedKmh: number
    rangic?: GpxRangicPointExtension
}

export interface GpxRangicPointExtension {
    calculatedMeters: number
    calculatedSeconds: number
    calculatedSpeedKmh: number
    transportationTypes: GpxRangicTransportationType[]
}


export interface GpxBounds {
    minLat: number
    minLon: number
    maxLat: number
    maxLon: number
}

export interface GpxRangicTimezoneInfo {
    tag: string
    id: string
}

export interface GpxRangicTransportationType {
    mode: string
    probability: number
}


export class GpxParser {

    public static isGpx(o: Gpx | GpxSegment | GpxWaypoint): o is Gpx {
        return (o as Gpx).tracks !== undefined
    }

    public static isSegment(o: Gpx | GpxSegment | GpxWaypoint): o is GpxSegment {
        return (o as GpxSegment).points !== undefined
    }

    public static isWaypoint(o: Gpx | GpxSegment | GpxWaypoint): o is GpxWaypoint {
        return (o as GpxWaypoint).name !== undefined
    }

    private minLat: number = 0
    private maxLat: number = 0
    private minLon: number = 0
    private maxLon: number = 0

    public parse(name: string, xml: string): Promise<Gpx> {
        return new Promise((resolve, reject) => {
            xml2js.parseString(xml, {explicitArray: false}, (error, result) => {
                if (error) {
                    reject(error)
                }

                const trackList: GpxTrack[] = []
                if (Array.isArray(result.gpx.trk)) {
                    for (const track of result.gpx.trk) {
                        trackList.push(this.processTrack(track))
                    }
                } else {
                    // There's a single track, process its segments
                    trackList.push(this.processTrack(result.gpx.trk))
                }

                const timezoneName = trackList[0].segments[0].timezoneName
                const wayPointList: GpxWaypoint[] = []
                if (Array.isArray(result.gpx.wpt)) {
                    for (const wayPoint of result.gpx.wpt) {
                        wayPointList.push(this.processWaypoint(wayPoint, timezoneName))
                    }
                } else if (result.gpx.wpt) {
                    // There's a single waypoint
                    wayPointList.push(this.processWaypoint(result.gpx.wpt, timezoneName))
                }

                const bounds = {
                    maxLat: this.maxLat,
                    minLat: this.minLat,
                    maxLon: this.maxLon,
                    minLon: this.minLon,
                }

                const startDate = trackList[0].segments[0].points[0].timestamp
                const endDate = trackList.slice(-1)[0].segments.slice(-1)[0].points.slice(-1)[0].timestamp
                const x  = {
                    waypoints: wayPointList,
                    tracks: trackList,
                    bounds,
                    name,
                    startDate,
                    endDate,
                    seconds: endDate.diff(startDate).valueOf() / 1000,
                    kilometers: trackList.map( (t) => t.kilometers).reduce( (l, r) => l + r),
                    timezoneName,
                } as Gpx

                if (result.gpx.extensions && result.gpx.extensions.rangic) {
                    const rangicXml = result.gpx.extensions.rangic
                    const placenames = this.processPlacenames(rangicXml.sites)
                    const siteToLocation: {[key: string]: GeoPoint} = {}
                    const siteNames: string[] = []
                    for (const p of placenames) {
                        for (const n of p.names) {
                            siteToLocation[n] = { lat: p.latitude, lon: p.longitude }
                            siteNames.push(n)
                        }
                    }

                    x.rangic = {
                        kilometers: rangicXml.kilometers,
                        seconds: rangicXml.seconds,
                        movingSeconds: rangicXml.movingSeconds,
                        timezoneInfo: this.processTimezoneInfo(rangicXml.timezoneInfo),
                        countries: rangicXml.countries,
                        countryCodes: rangicXml.countryCodes,
                        stateNames: rangicXml.stateNames,
                        cityNames: rangicXml.cityNames,
                        sites: placenames,
                        siteNames,
                        siteToLocation,
                    }
                }

                resolve(x)
            })
        })
    }

    private processWaypoint(waypoint: any, timezoneName: string): GpxWaypoint {
        const wp = {
            latitude: waypoint.$.lat,
            longitude: waypoint.$.lon,
            timestamp: DateTime.fromISO(waypoint.time),
            seconds: 0,
            name: waypoint.name,
            timezoneName,
        } as GpxWaypoint

        if (waypoint.extensions && waypoint.extensions.rangic) {
            const rangicXml = waypoint.extensions.rangic
            const beginTime = DateTime.fromISO(rangicXml.begin.$.time)
            const finishTime = DateTime.fromISO(rangicXml.finish.$.time)
            const bounds = {
                minLat: rangicXml.begin.$.lat,
                minLon: rangicXml.begin.$.lon,
                maxLat: rangicXml.finish.$.lat,
                maxLon: rangicXml.finish.$.lon,
            } as GpxBounds
            wp.rangic = {
                stopType: rangicXml.$.stopType,
                beginLatitude: rangicXml.begin.$.lat,
                beginLongitude: rangicXml.begin.$.lon,
                beginTime,
                finishLatitude: rangicXml.finish.$.lat,
                finishLongitude: rangicXml.finish.$.lon,
                finishTime,
                seconds: finishTime.diff(beginTime).valueOf() / 1000,
                bounds,
            }
            wp.seconds = wp.rangic.seconds
        }

        return wp
    }

    private processTrack(track: any): GpxTrack {
        let segmentList: GpxSegment[] = []
        if (Array.isArray(track.trkseg)) {
            for (const segment of track.trkseg) {
                segmentList = segmentList.concat(this.processSegment(segment))
            }
        } else {
            segmentList = segmentList.concat(this.processSegment(track.trkseg))
        }

        const t = {
            segments: segmentList,
            kilometers: segmentList.map( (p) => p.kilometers).reduce( (l, r) => l + r),
        } as GpxTrack

        if (track.extensions && track.extensions.rangic) {
            const rangicXml = track.extensions.rangic
            t.rangic = {
                kilometers: rangicXml.kilometers,
                seconds: rangicXml.seconds,
                bounds: this.processBounds(rangicXml.bounds),
            }
        }

        return t
    }

    private processSegment(segment: any): GpxSegment[] {
        const segments: GpxSegment[] = []
        let pointList: GpxPoint[] = []
        let meters = 0.0
        let prevPt: GpxPoint | null = null

        let rangicSegment: GpxRangicSegmentExtension | undefined
        if (segment.extensions && segment.extensions.rangic) {
            const rangicXml = segment.extensions.rangic
            rangicSegment = {
                kilometers: rangicXml.kilometers,
                kmh: rangicXml.kmh,
                bounds: this.processBounds(rangicXml.bounds),
                transportationTypes: this.processTransportationTypes(rangicXml.transportationTypes),
            } as GpxRangicSegmentExtension
        }

        if (Array.isArray(segment.trkpt)) {
            for (const trkpt of segment.trkpt) {
                const gpxPt = this.processPoint(trkpt)
                if (this.minLat === 0) {
                    this.minLat = gpxPt.latitude
                    this.maxLat = gpxPt.latitude
                    this.minLon = gpxPt.longitude
                    this.maxLon = gpxPt.longitude
                } else {
                    this.minLat = Math.min(gpxPt.latitude, this.minLat)
                    this.maxLat = Math.max(gpxPt.latitude, this.maxLat)
                    this.minLon = Math.min(gpxPt.longitude, this.minLon)
                    this.maxLon = Math.max(gpxPt.longitude, this.maxLon)
                }

                if (prevPt) {
                    const secondsDiff = gpxPt.timestamp.diff(prevPt.timestamp).valueOf() / 1000
                    if (secondsDiff > 30) {
                        if (pointList.length > 1) {
                            const timezoneName = Timezone.fromGpx(pointList[0])
                            const s = {
                                points: pointList,
                                kilometers: meters / 1000,
                                seconds: pointList.slice(-1)[0].timestamp.diff(pointList[0].timestamp).valueOf() / 1000,
                                timezoneName,
                            } as GpxSegment
                            if (rangicSegment) {
                                s.rangic = rangicSegment
                            }
                            segments.push(s)
                            meters = 0.0
                        }
                        pointList = []
                    } else {
                        const metersPrevPt = Geo.distanceGpx(prevPt, gpxPt)
                        gpxPt.calculatedMeters = metersPrevPt
                        gpxPt.calculatedSpeedKmh = (metersPrevPt / 1000) / (secondsDiff / (60 * 60))
                        meters += metersPrevPt
                    }
                }

                pointList.push(gpxPt)
                prevPt = gpxPt
            }
        } else {
            const gpxPt = this.processPoint(segment.trkpt)
            if (this.minLat === 0) {
                this.minLat = gpxPt.latitude
                this.maxLat = gpxPt.latitude
                this.minLon = gpxPt.longitude
                this.maxLon = gpxPt.longitude
            }
            pointList.push(gpxPt)
        }

        if (pointList.length > 0) {
            const timezoneName = Timezone.fromGpx(pointList[0])
            const s = {
                points: pointList,
                kilometers: meters / 1000,
                seconds: pointList.slice(-1)[0].timestamp.diff(pointList[0].timestamp).valueOf() / 1000,
                timezoneName,
            } as GpxSegment
            if (rangicSegment) {
                s.rangic = rangicSegment
            }
            segments.push(s)
        }

        return segments
    }

    private processPoint(trkpt: any): GpxPoint {
        const pt = {
            latitude: trkpt.$.lat,
            longitude: trkpt.$.lon,
            timestamp: DateTime.fromISO(trkpt.time),
            calculatedMeters: 0,
            calculatedSpeedKmh: 0,
        } as GpxPoint

        if (trkpt.extensions && trkpt.extensions.rangic) {
            const rangicXml = trkpt.extensions.rangic
            pt.rangic = {
                calculatedMeters: rangicXml.calculatedMeters,
                calculatedSeconds: rangicXml.calculatedSeconds,
                calculatedSpeedKmh: rangicXml.calculatedSpeedKmh,
                transportationTypes: [],
            } as GpxRangicPointExtension

            if (rangicXml.transportationTypes) {
                pt.rangic.transportationTypes = this.processTransportationTypes(rangicXml.transportationTypes)
            }
        }
        return pt
    }

    private processPlacenames(placenames: any): GpxRangicPlacenameSite[] {
        const placeList: GpxRangicPlacenameSite[] = []
        if (placenames.site) {
            for (const p of placenames.site) {
                placeList.push({
                    latitude: p.$.lat,
                    longitude: p.$.lon,
                    names: p.name,
                })
            }
        }
        return placeList
    }

    private processTransportationTypes(transportationTypes: any): GpxRangicTransportationType[] {
        const tt: GpxRangicTransportationType[] = []
        if (Array.isArray(transportationTypes.transportationType)) {
            for (const trans of transportationTypes.transportationType) {
                tt.push(this.processOneTransportationType(trans))
            }
        } else {
            tt.push(this.processOneTransportationType(transportationTypes.transportationType))
        }

        return tt
    }

    private processOneTransportationType(transportationType: any): GpxRangicTransportationType {
        return {
            mode: transportationType.$.mode,
            probability: transportationType.$.probability,
        }
    }

    private processTimezoneInfo(timezoneInfo: any): GpxRangicTimezoneInfo {
        return {
            tag: timezoneInfo.$.tag,
            id: timezoneInfo.$.id,
        }
    }

    private processBounds(bounds: any): GpxBounds {
        return {
            minLat: bounds.$.minLat,
            minLon: bounds.$.minLon,
            maxLat: bounds.$.maxLat,
            maxLon: bounds.$.maxLon,
        }
    }
}
