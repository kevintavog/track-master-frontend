import { GpsPoint } from '@/models/Gps'
import { GpxPoint } from '@/models/Gpx'

export class Geo {
  static get earthRadiusMeters() {
    return 6372.8 * 1000
  }

  public static normalizeDegrees(degrees: number): number {
    if (degrees >= 0 && degrees <= 360) {
      return degrees
    }
    if (degrees > 360) {
      return degrees - 360
    }
    if (degrees < 0) {
      return degrees + 360
    }
    return degrees
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

  public static toDegrees(n: number) {
    return n * 180 / Math.PI
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

  public static pointAlongBearing(lat: number, lon: number, bearing: number, distanceMeters: number) {
    const bearingRadians = this.toRad(bearing)
    const angularDistance = distanceMeters / this.earthRadiusMeters
    const latRadians = this.toRad(lat)
    const lonRadians = this.toRad(lon)

    const sinNewLat = Math.sin(latRadians) * Math.cos(angularDistance)
      + Math.cos(latRadians) * Math.sin(angularDistance) * Math.cos(bearingRadians)
    const newLat = Math.asin(sinNewLat)
    const y = Math.sin(bearingRadians) * Math.sin(angularDistance) * Math.cos(latRadians)
    const x = Math.cos(angularDistance) - Math.sin(latRadians) * sinNewLat
    const newLon = lonRadians + Math.atan2(y, x)
    return { lat: this.toDegrees(newLat), lon: this.toDegrees(newLon) }
  }
}
