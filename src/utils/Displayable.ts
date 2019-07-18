import { SearchTimezoneInfo, SearchTrack } from '@/models/SearchResults'
import { DateTime } from 'luxon'

export class Displayable {
  public duration(track: SearchTrack): string {
    const end = DateTime.fromISO(track.endTime)
    const start = DateTime.fromISO(track.startTime)
    const diff = end.diff(start, ['hours', 'minutes', 'seconds']).toObject()
    return `${diff.hours}:${this.pad(diff.minutes || 0, 2)}:${this.pad(diff.seconds || 0, 2)}`
  }

  public durationSeconds(seconds: number): string {
    if (seconds < 60) {
      return `${seconds} seconds`
    }
    if (seconds < 60 * 60) {
      const m = Math.floor(seconds / 60)
      const s = seconds - (m * 60)
      return `${m}:${this.pad(s, 2)}`
    }

    const hours = Math.floor(seconds / (60 * 60))
    const hourSeconds = hours * 60 * 60
    const minutes = Math.floor((seconds - hourSeconds) / 60)
    const minuteSeconds = minutes * 60
    const sec = seconds - hourSeconds - minuteSeconds
    return `${hours}:${this.pad(minutes, 2)}:${this.pad(sec, 2)}`
  }

  public distance(track: SearchTrack): string {
    if (!track.distanceKilometers) {
      return '--'
    }
    return this.distanceKilometers(track.distanceKilometers)
  }

  public distanceMeters(meters: number): string {
    return this.distanceKilometers(meters / 1000.0)
  }

  public distanceKilometers(km: number): string {
      if (km < 0.001) {
        return `${Math.round(km * 1000 * 100) / 100} meters`
      }
      if (km < 1.0) {
        if (km < 0.010) {
          return `${Math.round(km * 1000 * 10) / 10} meters`
        }
        return `${Math.round(km * 1000)} meters`
      }
      return `${Math.round(100 * km) / 100} km`
  }

  public pad(num: number, padding: number): string {
    return num.toString().padStart(padding, '0')
  }

  public speed(seconds: number, kilometers: number): string {
      const kmh = kilometers / (seconds / (60 * 60))
      return `${Math.round(10 * kmh) / 10} km/h`
  }

  public speedKmh(kmh: number): string {
    return `${Math.round(10 * kmh) / 10} km/h`
  }

  public dayOfWeek(date: string | Date, tzInfo?: SearchTimezoneInfo): string {
    let tzId = 'UTC'
    if (tzInfo && tzInfo.id) {
        tzId = tzInfo.id
    }
    return DateTime.fromISO(date.toString()).setZone(tzId).weekdayLong
  }

  public date(date: string | Date, tzInfo?: SearchTimezoneInfo): string {
    let tzId = 'UTC'
    if (tzInfo && tzInfo.id) {
        tzId = tzInfo.id
    }
    return new Date(date.toString()).toLocaleDateString('en-US', { timeZone: tzId })
  }

  public longDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  public shortTime(date: string, tzInfo?: SearchTimezoneInfo): string {
    const ds = this.time(date, tzInfo)
    const ampm = ds.substr(ds.length - 2)
    const t = ds.substring(0, 5)
    if (t.endsWith(':')) {
      return t.substring(0, 4) + '\xa0' + ampm
    }
    return t + '\xa0' + ampm
  }

  public time(date: string, tzInfo?: SearchTimezoneInfo): string {
    let tzId = 'UTC'
    if (tzInfo && tzInfo.id) {
        tzId = tzInfo.id
    }
    return new Date(date).toLocaleTimeString('en-US', { timeZone: tzId })
  }

  public join(list: string[]): string {
      return list.join(', ')
  }

  public firstFew(list: string[]): string {
    if (!list) {
      return ''
    }
    let few = list.slice(0, 2).join(', ')
    if (list.length > 2) {
      few += ', ...'
    }
    return few
  }
}

export const displayable = new Displayable()
