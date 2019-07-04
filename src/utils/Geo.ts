import { GpsPoint } from '@/models/Gps'
import { GpxPoint } from '@/models/Gpx'

export class Geo {

    static get earthRadiusMeters() {
      return 6372.8 * 1000
    }

    // Returns the distance in meters
    public static distanceGps(start: GpsPoint, end: GpsPoint) {
        return this.distanceLL(start.latitude, start.longitude, end.latitude, end.longitude)
    }

    // Returns the distance in meters
    public static distanceGpx(start: GpxPoint, end: GpxPoint) {
        return this.distanceLL(start.latitude, start.longitude, end.latitude, end.longitude)
    }

    // Returns the distance in meters
    public static distanceLL(lat1: number, lon1: number, lat2: number, lon2: number) {
      const latDelta = this.toRad(lat2 - lat1)
      const lonDelta = this.toRad(lon2 - lon1)
      const lat1Rad = this.toRad(lat1)
      const lat2Rad = this.toRad(lat2)
      const a = Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
        Math.sin(lonDelta / 2) * Math.sin(lonDelta / 2) *
        Math.cos(lat1Rad) * Math.cos(lat2Rad)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

      return this.earthRadiusMeters * c
    }

    public static toRad(n: number) {
      return n * Math.PI / 180
    }

    public static closestPoint(points: GpsPoint[], lat: number, lon: number): GpsPoint {
      let closestPoint = points[0]
      let closest = this.distanceLL(points[0].latitude, points[0].longitude, lat, lon)
      points.forEach( (p) => {
        const d = this.distanceLL(p.latitude, p.longitude, lat, lon)
        if (d < closest) {
          closest = d
          closestPoint = p
        }
      })
      return closestPoint
    }
}
