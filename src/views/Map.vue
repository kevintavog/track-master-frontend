<template>
  <div class="map box">
    <div class="map-content" id="map" >
      <div class="leaflet-top leaflet-left has-text-black">
        <router-link class="has-background-black-bis has-text-primary home-button" :to="{ path: 'search' }">
          <b-icon icon="home" />
        </router-link>
        <b-dropdown v-if="isGpxLoadingSupported" aria-role="list" class="has-text-black" >
          <button class="button is-small is-text has-background-black-bis has-text-primary has-pointer-events" slot="trigger">
              <b-icon icon="align-justify" />
          </button>
          <b-dropdown-item aria-role="listitem" @click="loadOriginalGpx">
              <b-icon icon="map-marked" />
              <span> Load original GPX </span>
          </b-dropdown-item>
        </b-dropdown>
      </div>
    </div>

    <b-notification v-for="m in messages" v-bind:key="m" type="is-danger" role="alert">
      {{ m }}
    </b-notification>

    <div class="is-pulled-left is-size-5 pointer-cursor" aria-controls="info-content-id" @click="infoVisible = !infoVisible">
      <p class="is-pulled-left has-text-white">Info</p>
      <a class="is-pulled-left left-padding">
        <b-icon :icon="infoVisible ? 'caret-down' : 'caret-up'" />
        <span class="left-padding">
          {{ selectedInfoText }}
        </span>
      </a>
      <span class="is-pulled-right">
        <b-button class="button has-background-black-ter has-text-info has-pointer-events" type="is-link"
            @click.native.stop="onPrevious" >
          <b-icon icon="angle-left" />
        </b-button>
        <b-button class="button has-background-black-ter has-text-info has-pointer-events" type="is-link"
            @click.native.stop="onNext" >
          <b-icon icon="angle-right" />
        </b-button>
      </span>
    </div>
    <b-collapse :open="infoVisible" class="info-content" aria-id="info-content-id">
      <b-tabs v-model="activeInfoTab">

        <b-tab-item label="Meta" class="is-pulled-left" >
          <div class="has-text-weight-bold">
            {{ displayable.dayOfWeek(track.startTime, track.timezoneInfo.id) }},
            {{ displayable.longDate(track.startTime, track.timezoneInfo.id) }}
            <span class="has-text-weight-light">
              ({{ track.path }})
            </span>
            <br>
            {{ displayable.time(track.startTime, track.timezoneInfo.id) }}
            to {{ displayable.time(track.endTime, track.timezoneInfo.id) }} ({{track.timezoneInfo.tag}})
          </div>
          <div>
            Distance: <span class="has-text-weight-semibold"> {{ displayable.distance(track.kilometers) }} </span>
          </div>
          <div>
            Duration total: <span class="has-text-weight-semibold"> {{ displayable.durationSeconds(track.seconds) }} </span>,
              moving: <span class="has-text-weight-semibold"> {{ displayable.durationSeconds(track.movingSeconds) }} </span>
          </div>
          <div>
            Speed: <span class="has-text-weight-semibold"> {{ displayable.speed(track.movingSeconds, track.kilometers) }} </span>
          </div>
          <div>
            Sites:
            <b-button v-for="b in track.siteNames" v-bind:key="b" rounded type="is-info"
                class="small-margin" @click="onSiteClicked(b)">
              {{b}}
            </b-button>
          </div>
          <div>
            Cities: {{displayable.join(track.cityNames)}}
          </div>
          <div>
            States: {{displayable.join(track.stateNames)}}
          </div>
          <div>
            Countries: {{displayable.join(track.countryNames)}}
          </div>
        </b-tab-item>

        <b-tab-item label="Segments">
          <b-table :data="allSegments" :selected.sync="selectedSegment">
            <template slot-scope="props">
              <b-table-column field="${index}" label="Index" centered>
                {{ props.index + 1 }}
              </b-table-column>
              <b-table-column field="startTime" label="Time" centered>
                <span >
                  {{ displayable.time(props.row.points[0].timestamp, track.timezoneInfo.id) }} - 
                  {{ displayable.time(props.row.points[props.row.points.length - 1].timestamp, track.timezoneInfo.id) }}
                </span>
              </b-table-column>
              <b-table-column field="speed" label="Speed" centered>
                <span >
                  {{ displayable.speed(props.row.seconds, props.row.kilometers) }}
                </span>
              </b-table-column>
              <b-table-column field="duration" label="Duration" centered>
                <span >
                  {{ displayable.durationSeconds(props.row.seconds) }}
                </span>
              </b-table-column>
              <b-table-column field="distance" label="Distance" centered>
                <span >
                  {{ displayable.distance(props.row.kilometers) }}
                </span>
              </b-table-column>
              <b-table-column field="transportation" label="Transportation" centered>
                <span v-if="props.row.rangic">
                  {{ props.row.rangic.transportationTypes.filter(i => i.probability >= 0.33).map(i => i.mode).join(', ')  }}
                </span>
              </b-table-column>
            </template>
          </b-table>
          
        </b-tab-item>

        <b-tab-item label="Stops">
          <b-table :data="waypoints" :selected.sync="selectedWaypoint">
            <template slot-scope="props">
              <b-table-column field="${index}" label="Index" centered>
                {{ props.index + 1 }}
              </b-table-column>
              <b-table-column field="time" label="Time" centered>
                <span >
                  {{ displayable.time(props.row.timestamp, track.timezoneInfo.id) }}
                </span> -
                <span >
                  {{ displayable.time(
                    props.row.rangic ? props.row.rangic.finishTime : props.row.timestamp,
                    track.timezoneInfo.id) }}
                </span>
              </b-table-column>
              <b-table-column field="duration" label="Duration" centered>
                <span >
                  {{ displayable.durationSeconds(props.row.seconds) }}
                </span>
              </b-table-column>
            </template>
          </b-table>
          
        </b-tab-item>

      </b-tabs>
    </b-collapse>
  </div>
</template>

<script lang="ts">
import { Component, Inject, Vue, Watch } from 'vue-property-decorator'
import L from 'leaflet'
import { Gpx, GpxBounds, GpxParser, GpxSegment, GpxPoint, GpxWaypoint } from '@/models/Gpx'
import { Geo } from '@/utils/Geo'
import { TrackMasterServer } from '@/services/TrackMasterServer'
import { emptySearchTrack, SearchResultsHelper, SearchTrack } from '@/models/SearchResults'
import { GpxFeatureGroup } from '@/utils/GpxFeatureGroup.ts'
import { displayable } from '@/utils/Displayable'
import { DateTime } from 'luxon'

interface StringMapPath {
  [key: string]: L.Path
}

// The object (segment or waypoint) and the index of that type
interface IndexAndObject {
  nativeIndex: number
  object: GpxWaypoint | GpxSegment
}

@Component({})
export default class Map extends Vue {
  @Inject('trackMaster') private trackMaster!: TrackMasterServer
  private isGpxLoadingSupported = process.env.NODE_ENV !== 'production'
  // private showStopBoundingBoxes = process.env.NODE_ENV !== 'production'
  private displayable = displayable
  private messages: string[] = []
  private map?: L.Map
  private mapLayersControl: L.Control.Layers | null = null
  private track: SearchTrack = emptySearchTrack
  private allSegments: GpxSegment[] = []
  private waypoints: GpxWaypoint[] = []
  private defaultInfoText = ''
  private sitePopup = L.popup()
  private selectedPath?: L.Path
  private selectedOptions = {}
  private selectedInfoText = ''
  private selectedPoint?: L.Circle
  private infoVisible = false
  private activeInfoTab = 0

  private selectedSegment = Object()
  private selectedWaypoint = Object()
  private selectedIndex = -1
  private indexObject: IndexAndObject[] = []

  private skipFitBounds = false
  private waypointPolyMap: StringMapPath = { }
  private waypointSelectionOptions = {
    radius: 8, weight: 6, color: 'red', opacity: 0.8, fillColor: 'red', fillOpacity: 0.4 }
  private shortWaypointSelectionOptions = {
    radius: 5, weight: 3, color: '#990000', opacity: 0.5, fillColor: 'orange', fillOpacity: 0.9 }
  private segmentPolyMap: StringMapPath = { }
  private segmentSelectionOptions = { color: '#0000FF', weight: 5, dashArray: '', opacity: 0.6 }
  private originalGpxLoaded = false

  private mounted() {
    this.initializeMap()

    const props = this.$route.query
    if ('id' in props) {
      this.trackMaster.getTrack(props.id as string)
        .then((result) => { this.track = SearchResultsHelper.augment(result) })
        .catch((err) => { this.messages.push(`Failed retrieving track: ` + err) })
      this.loadTrack(props.id as string)
    }
  }

  private onPrevious() {
    this.selectByIndex(this.selectedIndex - 1)
  }

  private onNext() {
    this.selectByIndex(this.selectedIndex + 1)
  }

  private selectByIndex(newIndex: number) {
    if (this.indexObject.length < 1) {
      return
    }
    if (newIndex < 0) {
      newIndex = this.indexObject.length - 1
    } else if (newIndex >= this.indexObject.length) {
      newIndex = 0
    }
    this.selectedIndex = newIndex
    const indexAndObject = this.indexObject[this.selectedIndex]

    if (GpxParser.isWaypoint(indexAndObject.object)) {
      this.selectedWaypoint = indexAndObject.object as GpxWaypoint
      this.selectWaypoint(indexAndObject.object as GpxWaypoint)
    } else if (GpxParser.isSegment(indexAndObject.object)) {
      this.selectedSegment = indexAndObject.object as GpxSegment
      this.selectSegment(indexAndObject.object as GpxSegment)
    }
  }

  private selectByObject(object: GpxWaypoint | GpxSegment) {
    for (let index = 0; index < this.indexObject.length; ++index) {
      if (this.indexObject[index].object === object) {
        this.selectByIndex(index)
        break
      }
    }
  }

  @Watch('selectedSegment')
  private onSegmentSelectionChanged(to: any, from: any) {
    const segment = this.selectedSegment as GpxSegment
    if (!segment) {
      return
    }
    this.selectByObject(segment)
  }

  private selectSegment(segment: GpxSegment) {
    let index = 0
    for (const s of this.allSegments) {
      index += 1
      if (s.points[0].timestamp === segment.points[0].timestamp) { break }
    }
    const line = this.segmentPolyMap[segment.points[0].timestamp.toISO()]
    this.setSelection(null, line, this.segmentSelectionOptions, this.segmentSelectionMessage(index, segment))

    if (!this.skipFitBounds && segment.rangic) {
      this.fitBounds(segment.rangic!.bounds)
    }
    this.skipFitBounds = false
  }

  @Watch('selectedWaypoint')
  private onWaypointSelectionChanged(to: any, from: any) {
    const waypoint = this.selectedWaypoint as GpxWaypoint
    if (!waypoint) {
      return
    }
    this.selectByObject(waypoint)
  }

  private selectWaypoint(waypoint: GpxWaypoint) {
    let index = 0
    for (const s of this.waypoints) {
      index += 1
      if (s.timestamp === waypoint.timestamp) { break }
    }
    const path = this.waypointPolyMap[waypoint.timestamp.toISO()]
    this.setSelection(null, path, this.waypointOptions(waypoint), this.waypointSelectionMessage(index, waypoint))
    if (!this.skipFitBounds) {
      if (waypoint.rangic) {
        this.fitBounds(waypoint.rangic!.bounds, false)
      }
    }
    this.skipFitBounds = false
  }

  private onSiteClicked(name: string) {
    const p = this.track.sitesToLocation[name]
    this.showSitePopup(name, p.lat, p.lon)
  }

  private showSitePopup(name: string, latitude: number, longitude: number) {
    const wikiUrl = `https://en.wikipedia.org/wiki/Special:Nearby#/coord/${latitude},${longitude}`
    this.sitePopup.
      setLatLng(L.latLng(latitude, longitude)).
      setContent(
        `<p style="font-size:1.3em;">${name}</p>` +
        `<a style="color:yellow !important; text-decoration:underline; font-size:1.3em;" href="${wikiUrl}" > Nearby on Wikipedia </a>`)
      .addTo(this.map!)
  }

  private loadTrack(id: string) {
    this.allSegments = []
    this.trackMaster.loadTrack(id)
      .then((results: string) => {
        new GpxParser().parse(id, results)
          .then((gpx) => {
            this.fitBounds(gpx.bounds, true)

            for (const track of gpx.tracks) {
              for (const segment of track.segments) {
                this.allSegments.push(segment)
              }
            }

            this.defaultInfoText = `${displayable.dayOfWeek(gpx.startDate, gpx.timezoneName)}, `
              + `${displayable.date(gpx.startDate, gpx.timezoneName)}; `
              + `${displayable.distance(gpx.kilometers)}, `
              + `${displayable.durationSeconds(gpx.seconds)}`
            this.setSelectedMessage(this.defaultInfoText)

            this.addSegments(this.allSegments, 'Segments', true, this.segmentSelectionOptions)
            this.addWaypoints(gpx)
            this.buildIndexObject()
          })
          .catch((err) => { this.errorMessage(`Failed adding analyzed track to map`, err) })
      })
      .catch((err) => { this.messages.push(`Failed retrieving analyzed track: ` + err) })
  }

  private buildIndexObject() {
    this.indexObject = []
    let waypointIndex = 0
    let segmentIndex = 0

    while (waypointIndex < this.waypoints.length || segmentIndex < this.allSegments.length) {
      let wp: GpxWaypoint | undefined
      let seg: GpxSegment | undefined

      if (waypointIndex < this.waypoints.length) {
        wp = this.waypoints[waypointIndex]
      }
      if (segmentIndex < this.allSegments.length) {
        seg = this.allSegments[segmentIndex]
      }
      if (wp && (!seg || wp.timestamp < seg.points[0].timestamp)) {
        this.indexObject.push( { nativeIndex: waypointIndex, object: wp })
        waypointIndex += 1
      }
      if (seg && (!wp || seg.points[0].timestamp < wp.timestamp)) {
        this.indexObject.push( { nativeIndex: segmentIndex, object: seg })
        segmentIndex += 1
      }
    }
  }

  private errorMessage(message: string, err: Error) {
    this.messages.push(message + ': ' + err.message)
    if (err.stack) {
      this.messages.push(err.stack)
    }
  }

  private fitBounds(bounds: GpxBounds, changeZoom: boolean = false) {
    const mapBounds = [
        [bounds.minLat, bounds.minLon],
        [bounds.maxLat, bounds.maxLon],
      ] as L.LatLngBoundsExpression
    if (changeZoom) {
      this.map!.fitBounds(mapBounds, undefined)
    } else {
      const zoom = this.map!.getZoom()
      this.map!.fitBounds(mapBounds, { maxZoom: zoom, padding: [5, 5] })
    }
  }

  private addWaypoints(gpx: Gpx) {
    if (!gpx.waypoints) {
      this.waypoints = []
      return
    }

    this.waypoints = gpx.waypoints
    let index = 1
    const wpPoly = gpx.waypoints.map((w) => {
      const options = this.waypointOptions(w)
      const l = new L.Circle([w.latitude, w.longitude], options)
      const stopIndex = index
      l.on('click', (e) => {
        this.setSelection(e, l, options, this.waypointSelectionMessage(stopIndex, w))
        this.skipFitBounds = true
        this.selectByObject(w)
      })
      index += 1
      this.waypointPolyMap[w.timestamp.toISO()] = l
      return l
    })
    const waypointLayer = new GpxFeatureGroup(wpPoly)
    waypointLayer.addTo(this.map as L.Map)
    this.addToMapLayersControl(waypointLayer, `Waypoints`)
  }

  private addSegments(segments: GpxSegment[], label: string, addToMap: boolean, options: object) {
    let index = 1
    const segmentLines = segments.map( (s) => {
        const segmentLatLngList = s.points.map( (p) => {
          return new L.LatLng(p.latitude, p.longitude)
        })

        const line = new L.Polyline(segmentLatLngList, options)
        const segmentIndex = index
        line.on('click', (e) => {
          const message = this.segmentSelectionMessage(segmentIndex, s)
          this.setSelection(e, line, options, message)
          this.skipFitBounds = true
          this.selectByObject(s)

          const me = e as L.LeafletMouseEvent
          const closestPoint = Geo.closestPoint(s.points, me.latlng.lat, me.latlng.lng)
          const m = `; [ ${this.time(closestPoint.timestamp)}, ` +
            `${this.displayable.speedFromKmh(
              closestPoint.rangic?.calculatedSpeedKmh ?? closestPoint.calculatedSpeedKmh)} ]`
          this.setSelectedMessage(message + m)
          this.selectPoint(closestPoint)
        })
        index += 1
        this.segmentPolyMap[s.points[0].timestamp.toISO()] = line
        return line
    })

    // const arrowOptions: L.PolylineOptions = Object.assign({}, options)
    // arrowOptions.color = '#330066'
    // arrowOptions.weight = 5
    // const arrowPoints = segments.flatMap( (s) => this.getArrowPoints(s)).filter( (a) => !!a )
    // const arrowLines = arrowPoints.map( (pt) => {
    //   return this.createArrowLine(pt.latitude, pt.longitude, pt.calculatedCourseFromPrevious, arrowOptions)
    // })
    // const segmentLayer = new GpxFeatureGroup(segmentLines.concat(arrowLines))
    const segmentLayer = new GpxFeatureGroup(segmentLines)
    if (addToMap) {
      segmentLayer.addTo(this.map!)
    }
    this.addToMapLayersControl(segmentLayer, label)
  }

  private createArrowLine(lat: number, lon: number, headingDegrees: number, options: object): L.Polyline {
    const left = Geo.pointAlongBearing(lat, lon, Geo.normalizeDegrees(headingDegrees + 150), 20)
    const right = Geo.pointAlongBearing(lat, lon, Geo.normalizeDegrees(headingDegrees - 150), 20)
    return new L.Polyline([
      [left.lat, left.lon],
      [lat, lon],
      [right.lat, right.lon],
    ],
    options)
  }

  private getArrowPoints(segment: GpxSegment): GpxPoint[] {
    const len = segment.points.length
    if (len < 7 * 60) {
      return [segment.points[Math.floor(len / 2)]]
    }
    if (len < 15 * 60) {
      return [segment.points[Math.floor(len / 3)], segment.points[Math.floor(len * 2 / 3)]]
    }

    let prevPoint = segment.points[10]
    return segment.points.filter( (p) => {
      if ((p.timestamp.toSeconds() - prevPoint.timestamp.toSeconds()) > 300) {
        prevPoint = p
        return true
      }
      return false
    })
  }

  private addToMapLayersControl(layer: L.FeatureGroup, name: string) {
    if (this.mapLayersControl == null) {
      this.mapLayersControl = L.control.layers(
          undefined, { [name]: layer }, { position: 'topright', collapsed: false }).addTo(this.map as L.Map)
    } else {
      this.mapLayersControl.addOverlay(layer, name)
    }
  }

  private setSelectedMessage(message: string) {
    if (!message || message === '') {
      this.selectedInfoText = this.defaultInfoText
    } else {
      this.selectedInfoText = message
    }
  }

  private selectPoint(point: GpxPoint) {
    if (this.selectedPoint) {
      this.selectedPoint
        .setLatLng([point.latitude, point.longitude])
        .addTo(this.map!)
    } else {
      this.selectedPoint = new L.Circle(
        [point.latitude, point.longitude],
        { color: '#000033', radius: 1.5 })
        .addTo(this.map!)
    }
  }

  private setSelection(e: any, path: L.Path, options: {}, message: string) {
    if (e) {
      e.originalEvent._gpxHandled = true
      e.originalEvent.stopImmediatePropagation()
    }

    if (this.selectedPoint) {
      this.selectedPoint.removeFrom(this.map!)
    }

    if (path !== this.selectedPath) {
      this.clearSelection()
      this.selectedPath = path
      this.selectedOptions = options
      path.setStyle({color: '#FF33FF', weight: 10, opacity: 0.8})
    }
    this.setSelectedMessage(message)
  }

  private clearSelection() {
    if (this.selectedPoint) {
      this.selectedPoint.removeFrom(this.map!)
    }
    if (this.selectedPath) {
      this.setSelectedMessage('')
      this.selectedPath.setStyle(this.selectedOptions)
      this.selectedPath = undefined
    }
  }

  private waypointSelectionMessage(index: number, waypoint: GpxWaypoint): string {
    const day = this.displayable.dayOfWeek(waypoint.timestamp, this.track.timezoneInfo.id)
    const year = this.displayable.date(waypoint.timestamp, this.track.timezoneInfo.id)
    return `Waypoint #${index}: ${day}, ${year} - ${this.time(waypoint.timestamp)} - ` +
      `${this.time(waypoint.rangic?.finishTime ?? waypoint.timestamp)}, ` +
      `(${this.displayable.durationSeconds(waypoint.rangic?.seconds ?? 0)})`
  }

  private segmentSelectionMessage(index: number, segment: GpxSegment): string {
    const timestamp = segment.points[0].timestamp
    const day = this.displayable.dayOfWeek(timestamp, this.track.timezoneInfo.id)
    const year = this.displayable.date(timestamp, this.track.timezoneInfo.id)
    return `Segment #${index}: ` +
      `${day}, ${year} - ` +
      `${this.time(segment.points[0].timestamp)}, ` +
      `${displayable.distance(segment.rangic?.kilometers ?? 0)}, ` +
      `${this.displayable.durationSeconds(segment.seconds)}, ` +
      `${this.displayable.speed(segment.seconds, segment.rangic?.kilometers ?? 0)}`
  }

  private waypointOptions(waypoint: GpxWaypoint) {
    const seconds = waypoint.rangic?.seconds ?? 0
    return seconds >= 2 * 60 ? this.waypointSelectionOptions : this.shortWaypointSelectionOptions
  }

  private initializeMap() {
    if (this.map) { return }

    this.map = L.map('map', {
        center: [20, 0],
        zoom: 2,
        minZoom: 2,
        zoomControl: false,
    })

    L.control.zoom({ position: 'topright' }).addTo(this.map)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxNativeZoom: 19,
        maxZoom: 22,
        attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
    }).addTo(this.map)

    L.control.scale({ position: 'bottomright', maxWidth: 300 }).addTo(this.map)

    this.map.on('click', (e) => {
      const me = e as any
      if (me.originalEvent && me.originalEvent._gpxHandled) { return }
      this.clearSelection()
    })

    this.map.on('contextmenu', (e) => {
      const leafletEvent = e as L.LeafletMouseEvent
      this.showSitePopup('', leafletEvent.latlng.lat, leafletEvent.latlng.lng)
    })

  }

  private time(time: DateTime): string {
    return this.displayable.time(time, this.track.timezoneInfo.id)
  }

  private loadOriginalGpx() {
    if (this.originalGpxLoaded) {
      this.messages.push(`Original GPX already loaded`)
      return
    }
    this.setSelectedMessage(`Loading original GPX...`)
    this.trackMaster.loadOriginalTrack(this.track.id)
      .then((results) => {
        new GpxParser().parse(this.track.id, results)
          .then((gpx) => {
            this.originalGpxLoaded = true
            for (const track of gpx.tracks) {
              this.addGpxSegments(track.segments)
            }
          })
          .catch((err) => {
            this.messages.push(`GPX parse error ` + err)
          })
          .finally( () => {
            this.setSelectedMessage(``)
          })
      })
      .catch((err) => {
        this.messages.push(`GPX load error ` + err)
        this.setSelectedMessage(``)
      })
  }

  private addGpxSegments(segments: GpxSegment[]) {
    const options = { color: '#FF00FF', weight: 5, dashArray: '', opacity: 1.0 }
    const segmentLines = segments.map( (s) => {
        const segmentLatLngList = s.points.map( (p) => {
          return new L.LatLng(p.latitude, p.longitude)
        })

        const line = new L.Polyline(segmentLatLngList, options)
        return line
    })

    const segmentLayer = new GpxFeatureGroup(segmentLines)
    segmentLayer.addTo(this.map as L.Map)
    this.addToMapLayersControl(segmentLayer, `Original`)
  }
}

</script>

<style>
.leaflet-bar, .leaflet-bar a {
  background-color: #666;
}

.tab-content {
  max-height: 16em;
  overflow: auto !important;
}

.dropdown-menu, .dropdown-content {
  background: #444444;
}

.leaflet-control-attribution > a {
  color: black !important;
}

a {
  /* color: black !important; */
  pointer-events: auto;
}

a:visited {
  /* color: black !important; */
  pointer-events: auto;
}

a:hover {
  /* color: black !important; */
  pointer-events: auto;
}

a:link {
  /* color: black !important; */
  pointer-events: auto;
}

.leaflet-popup-content-wrapper {
  background-color: #222;
  color: white;
}

.leaflet-popup-content-wrapper .leaflet-popup-content {
  background-color: #222;
  color: white;
}

</style>

<style scoped>
.box {
  background-color: #222;
  color: white;
  flex-grow: 1;
  display: flex;
  flex-flow: column;
  height: 100%;
  padding: 0.1em 0.3em 0.3em 0.3em;
}

.map-content {
  flex: 1 1 auto;
  height: 100%;
}

.home-button {
  padding: 6px 3px 6px 3px;
  margin: 10px 5px 10px 3px;
}

.info-content {
  flex: 0 1 auto;
  text-align: left;
}

.left-padding {
  padding-left: 1em;
}

.small-margin {
  margin-right: 0.6em;
  margin-bottom: 0.4em;
}

.pointer-cursor {
  cursor: pointer;
}

.has-pointer-events {
  pointer-events: auto;
}

</style>

