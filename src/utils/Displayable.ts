import { SearchTimezoneInfo, SearchTrack } from '@/models/SearchResults'
import { DateTime } from 'luxon'

export class Displayable {
  public duration(track: SearchTrack): string {
    const end = DateTime.fromISO(track.endTime)
    const start = DateTime.fromISO(track.startTime)
    const diff = end.diff(start, ['hours', 'minutes', 'seconds']).toObject()
    return `${diff.hours}:${diff.minutes}:${diff.seconds}`
  }

  public dayOfWeek(date: string): string {
    return DateTime.fromISO(date).weekdayLong
  }

  public date(date: string): string {
    return new Date(date).toLocaleDateString()
  }

  public longDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
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
