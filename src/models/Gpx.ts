
import * as xml2js from 'xml2js'

/*
<gpx [many attributes] >
    <metadata />
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

export interface GpxFile {
    tracks: GpxTrack[]
    bounds: GpxTrackBounds
}

export interface GpxTrack {
    segments: GpxSegment[]
}

export interface GpxTrackBounds {
    minLat: number
    minLon: number
    maxLat: number
    maxLon: number
}

export interface GpxSegment {
    points: GpxPoint[]
}

export interface GpxPoint {
    latitude: number
    longitude: number
    timestamp: Date
}

export class GpxParser {

/*
    public dates(gpxFile: GpxFile): [Date, Date] {
        let earliestSet = false
        let earliest = new Date()
        let latest = new Date()
        for (const track of gpxFile.tracks) {
            for (const segment of track.segments) {
                if (!earliestSet) {
                    earliest = segment.points[0].timestamp
                    earliestSet = true
                }
                latest = segment.points[segment.points.length - 1].timestamp
            }
        }
        return [earliest, latest]
    }
*/

    public parse(xml: string): Promise<GpxFile> {
        return new Promise((resolve, reject) => {
            xml2js.parseString(xml, {explicitArray: false}, (error, result) => {
                if (error) {
                    reject(error)
                }

                // Grab bounds: result.gpx.bounds.$.minlat, minlon & so on
                const bounds = {
                    maxLat: Number(result.gpx.bounds.$.maxlat),
                    minLat: Number(result.gpx.bounds.$.minlat),
                    maxLon: Number(result.gpx.bounds.$.maxlon),
                    minLon: Number(result.gpx.bounds.$.minlon),
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

                resolve({ tracks: trackList, bounds })
            })
        })
    }

    private processTrack(track: any): GpxTrack {
        const segmentList: GpxSegment[] = []
        if (Array.isArray(track.trkseg)) {
            for (const segment of track.trkseg) {
                segmentList.push(this.processSegment(segment))
            }
        } else {
            segmentList.push(this.processSegment(track.trkseg))
        }
        return { segments: segmentList }
    }

    private processSegment(segment: any): GpxSegment {
        const pointList: GpxPoint[] = []
        for (const trkpt of segment.trkpt) {
            const gpxPt = { latitude: trkpt.$.lat, longitude: trkpt.$.lon, timestamp: new Date(trkpt.time) } as GpxPoint
            pointList.push(gpxPt)
        }
        return { points: pointList }
    }
}
