import { SearchTimezoneInfo, SearchTrack } from '@/models/SearchResults'
import { DateTime } from 'luxon'

export class Displayable {
  public static kilometersPerMile = 0.6213712
  public static yardsPerMile = 1760
  public static feetPerMile = 5280

  public duration(track: SearchTrack): string {
    const end = DateTime.fromISO(track.endTime)
    const start = DateTime.fromISO(track.startTime)
    const diff = end.diff(start, ['hours', 'minutes', 'seconds']).toObject()
    return `${diff.hours}:${this.pad(diff.minutes || 0, 2)}:${this.pad(diff.seconds || 0, 2)}`
  }

  public durationSeconds(seconds: number): string {
    if (seconds < 60) {
      return `0:${this.pad(seconds, 2)}`
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

  public trackDistance(track: SearchTrack): string {
    if (!track.kilometers) {
      return '--'
    }
    return this.distance(track.kilometers)
  }

  public distance(km: number): string {
    return this.distanceAsMiles(km)
    // return this.distanceAsKilometers(km)
  }

  public pad(num: number, padding: number): string {
    return num.toString().padStart(padding, '0')
  }

  public speed(seconds: number, kilometers: number): string {
      const kmh = kilometers / (seconds / (60 * 60))
      return this.speedFromKmh(kmh)
  }

  public speedFromKmh(kmh: number): string {
    // return this.speedAsKmh(kmh)
    return this.speedAsMph(kmh)
  }

  public longDate(date: DateTime, zoneName: string): string {
    return this.dateTime(date, zoneName).toLocaleString(DateTime.DATE_FULL)
  }

  public time(date: string | DateTime, zoneName: string): string {
    return this.dateTime(date, zoneName).toFormat('HH:mm:ss\xa0a')
  }

  public dayOfWeek(date: string | DateTime, zoneName: string): string {
    return this.dateTime(date, zoneName).weekdayLong
  }

  public date(date: string | DateTime, zoneName: string): string {
    return this.dateTime(date, zoneName).toLocaleString({ locale: 'en-US' })
  }

  public timeWithSeconds(date: string | DateTime, zoneName: string): string {
    return this.dateTime(date, zoneName).toFormat('HH:mm:ss')
  }

  public shortTime(date: string | DateTime, zoneName: string): string {
    return this.dateTime(date, zoneName).toFormat('HH:mm\xa0a')
  }

  public shortTimezoneName(zoneName: string): string {
    return DateTime.utc().setZone(zoneName).offsetNameShort
  }

  public dateTime(date: string | DateTime, zoneName: string): DateTime {
    let iso: string
    if (date instanceof DateTime) {
      iso = (date as DateTime).toISO()
    } else {
      iso = date.toString()
    }
    const zone = zoneName === '' ? 'UTC' : zoneName
    return DateTime.fromISO(iso, { zone })
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

  private speedAsKmh(kmh: number): string {
    return `${Math.round(10 * kmh) / 10} km/h`
  }

  private speedAsMph(kmh: number): string {
    const mph = kmh * Displayable.kilometersPerMile
    return `${Math.round(10 * mph) / 10} mph`
  }

  private distanceAsMiles(km: number): string {
    const miles = km *  Displayable.kilometersPerMile
    if (miles < 0.0017) {
      return `${Math.round(miles * Displayable.feetPerMile)} feet`
    }
    if (miles < 1.0) {
      if (miles < 0.010) {
        return `${Math.round(miles * Displayable.yardsPerMile * 10) / 10} yards`
      }
      return `${Math.round(miles * Displayable.yardsPerMile)} yards`
    }
    return `${Math.round(100 * miles) / 100} miles`
  }

  private distanceAsKilometers(km: number): string {
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
}

export const displayable = new Displayable()
