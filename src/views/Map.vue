<template>
  <div class="map box">
    <div class="map-content" id="map" >
      <div class="leaflet-top leaflet-left has-text-black">
        <b-dropdown aria-role="list" class="has-text-black" >
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
    </div>
    <b-collapse :open="infoVisible" class="info-content" aria-id="info-content-id">
      <b-tabs v-model="activeInfoTab">

        <b-tab-item label="Meta" class="is-pulled-left" >
          <div class="has-text-weight-bold">
            {{ displayable.dayOfWeek(track.startTime) }},
            {{ displayable.longDate(track.startTime) }}
            <span class="has-text-weight-light">
              ({{ track.path }})
            </span>
            <br>
            {{ displayable.time(track.startTime, track.timezoneInfo) }}
            to {{ displayable.time(track.endTime, track.timezoneInfo) }} ({{track.timezoneInfo.tag}})
          </div>
          <div>
            Distance: <span class="has-text-weight-semibold"> {{ displayable.distanceKilometers(track.distanceKilometers) }} </span>
          </div>
          <div>
            Duration total: <span class="has-text-weight-semibold"> {{ displayable.durationSeconds(track.durationSeconds) }} </span>,
              moving: <span class="has-text-weight-semibold"> {{ displayable.durationSeconds(track.movingSeconds) }} </span>
          </div>
          <div>
            Speed: <span class="has-text-weight-semibold"> {{ displayable.speed(track.movingSeconds, track.distanceKilometers) }} </span>
          </div>
          <div>
            Sites: {{displayable.join(track.siteNames)}}
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

        <!-- <b-tab-item label="Speed">
          <apexchart height="200" type="line" :options="speedOptions" :series="speedSeries"></apexchart>
        </b-tab-item> -->

        <b-tab-item label="Runs">
          <b-table :data="allRuns" :selected.sync="selectedRun">
            <template slot-scope="props">
              <b-table-column field="${index}" label="Index" centered>
                {{ props.index + 1 }}
              </b-table-column>
              <b-table-column field="startTime" label="Time" centered>
                <span >
                  {{ displayable.date(props.row.points[0].time) }}, 
                  {{ displayable.time(props.row.points[0].time, track.timezoneInfo) }} - 
                  {{ displayable.time(props.row.points[props.row.points.length - 1].time, track.timezoneInfo) }}
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
                  {{ displayable.distanceKilometers(props.row.kilometers) }}
                </span>
              </b-table-column>
              <b-table-column field="transportation" label="Transportation" centered>
                <span >
                  {{ props.row.transportationTypes.filter(i => i.probability >= 0.33).map(i => i.mode).join(', ')  }}
                </span>
              </b-table-column>
            </template>
          </b-table>
          
        </b-tab-item>

        <b-tab-item label="Stops">
          <b-table :data="stops" :selected.sync="selectedStop">
            <template slot-scope="props">
              <b-table-column field="${index}" label="Index" centered>
                {{ props.index + 1 }}
              </b-table-column>
              <b-table-column field="start" label="Start" centered>
                <span >
                  {{ displayable.time(props.row.startTime, track.timezoneInfo) }}
                </span> -
                <span >
                  {{ displayable.time(props.row.endTime, track.timezoneInfo) }}
                </span>
              </b-table-column>
              <b-table-column field="duration" label="Duration" centered>
                <span >
                  {{ displayable.durationSeconds(props.row.seconds) }}
                </span>
              </b-table-column>
              <b-table-column field="count" label="# Points" centered>
                <span >
                  {{ props.row.countPoints }}
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
import { Component, Vue, Watch } from 'vue-property-decorator'
import L from 'leaflet'
import LP from 'leaflet-polylinedecorator'
import { GpxParser, GpxSegment, GpxPoint } from '@/models/Gpx'
import { Geo } from '@/utils/Geo'
import { emptyGpsPoint, Gps, GpsBounds, GpsPoint, GpsRun, GpsStop, GpsTrack } from '@/models/Gps'
import { searchService } from '@/services/SearchService'
import { emptySearchTrack, SearchTrack } from '@/models/SearchResults'
import { GpxFeatureGroup } from '@/utils/GpxFeatureGroup.ts'
import { displayable } from '@/utils/Displayable'
import { DateTime } from 'luxon'

interface StringMapPath {
  [key: string]: L.Path
}

@Component({})
export default class Map extends Vue {
  private displayable = displayable
  private messages: string[] = []
  private map?: L.Map
  private mapLayersControl: L.Control.Layers | null = null
  private track: SearchTrack = emptySearchTrack
  private allRuns: GpsRun[] = []
  private stops: GpsStop[] = []
  private selectedPath?: L.Path
  private selectedOptions = {}
  private selectedInfoText = ''
  private selectedPoint?: L.Circle
  private infoVisible = false
  private activeInfoTab = 0
  private selectedRun = Object()
  private selectedStop = Object()
  private skipFitBounds = false
  private stopPolyMap: StringMapPath = { }
  private stopSelectionOptions = {
    radius: 8, weight: 6, color: 'red', opacity: 0.8, fillColor: 'red', fillOpacity: 0.4 }
  private shortStopSelctionOptions = {
    radius: 5, weight: 3, color: '#990000', opacity: 0.5, fillColor: 'orange', fillOpacity: 0.9 }
  private runPolyMap: StringMapPath = { }
  private runSelectionOptions = { color: '#0000FF', weight: 5, dashArray: '', opacity: 0.6 }
  private badRunOptions = { color: '#003300', weight: 6, dashArray: '20 20', opacity: 0.7 }
  private originalGpxLoaded = false
  private speedSeries = [{
    name: 'Speed',
    data: [{ x: '1', y: 3.1 }],
  }]
  private speedOptions = {
    chart: {
      toolbar: {
        show: false,
      },
      // events: {
      //   click: this.chartClick,
      // },
    },
    grid: {
      strokeDashArray: 7,
    },
    legend: {
     show: false,
    },
    tooltip: {
      theme: 'dark',
      x: {
        formatter: this.formatXTooltip,
      },
      y: {
        formatter: (value: number) => `${Math.round(10 * value) / 10} km/h`,
      },
    },
    xaxis: {
      labels: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        show: false,
      },
    },
  }

  private mounted() {
    this.initializeMap()

    const props = this.$route.query
    if ('id' in props) {
      searchService.getTrack(props.id as string)
        .then((result) => { this.track = result })
        .catch((err) => { this.messages.push(`Failed retrieving track`, err) })
      this.loadTrack(props.id as string)
    }
  }

  private formatXTooltip(value: string): string {
    return this.displayable.time(value, this.track.timezoneInfo)
  }

  private loadTrack(id: string) {
    this.speedSeries[0].data = []
    this.allRuns = []
    searchService.loadTrack(id)
      .then((results) => {
        // This is silly - `results` is supposed to be a string already, but isn't.
        const gps = (results as unknown) as Gps
        this.map!.fitBounds([
          [gps.bounds.min.lat, gps.bounds.min.lon],
          [gps.bounds.max.lat, gps.bounds.max.lon]],
          undefined)

        for (const track of gps.tracks) {
          for (const run of track.runs) {
            this.allRuns.push(run)
          }
        }

        this.addRuns(this.allRuns, 'Runs', true, this.runSelectionOptions)
        this.addRuns(gps.removedRuns, 'Bad runs', false, this.badRunOptions)
        this.addStops(gps)
      })
  }

  private fitBounds(bounds: GpsBounds) {
    const zoom = this.map!.getZoom()
    this.map!.fitBounds([
        [bounds.min.lat, bounds.min.lon],
        [bounds.max.lat, bounds.max.lon],
      ],
      { maxZoom: zoom, padding: [5, 5] })
  }

  private addStops(gps: Gps) {
    if (!gps.stops) {
      this.stops = []
      return
    }

    this.stops = gps.stops
    let index = 1
    const stops = gps.stops.map((s) => {
      const options = this.stopOptions(s)
      const l = new L.Circle([
        s.bounds.min.lat + ((s.bounds.max.lat - s.bounds.min.lat) / 2),
        s.bounds.min.lon + ((s.bounds.max.lon - s.bounds.min.lon) / 2),
      ], options)
      const stopIndex = index
      l.on('click', (e) => {
        this.setSelection(e, l, options, this.stopSelectionMessage(index, s))
        this.skipFitBounds = true
        this.selectedStop = s
      })
      index += 1
      this.stopPolyMap[s.startTime.toString()] = l
      return l
    })
    let stopLayer = new GpxFeatureGroup(stops)
    stopLayer.addTo(this.map as L.Map)
    this.addToMapLayersControl(stopLayer, `Stops`)

    const stopOutlines = gps.stops.map((s) => {
      const l = new L.Rectangle([
        [s.bounds.min.lat, s.bounds.min.lon],
        [s.bounds.max.lat, s.bounds.max.lon],
      ],
      { color: '#002200', fill: false})
      return l
    })
    stopLayer = new GpxFeatureGroup(stopOutlines)
    stopLayer.addTo(this.map as L.Map)
  }

  private addRuns(runs: GpsRun[], label: string, addToMap: boolean, options: object) {
    let index = 1
    const runLines = runs.map((r) => {
        const runIndex = index
        const runLatLngList = r.points.map( (p) => {
          this.speedSeries[0].data.push({ x: p.time, y: p.calculatedSpeedKmHFromPrevious })
          return new L.LatLng(p.latitude, p.longitude)
        })

        const line = new L.Polyline(runLatLngList, options)
        line.on('click', (e) => {
          const message = this.runSelectionMessage(runIndex, r)
          this.setSelection(e, line, options, message)
          this.skipFitBounds = true
          this.selectedRun = r

          const me = e as L.LeafletMouseEvent
          const closestPoint = Geo.closestPoint(r.points, me.latlng.lat, me.latlng.lng)
          const m = `; [ ${this.time(closestPoint.time)}, ` +
            `${this.displayable.speedKmh(closestPoint.movingAverageKmH)} ]`
          this.setSelectedMessage(message + m)
          this.selectPoint(closestPoint)
        })
        index += 1
        this.runPolyMap[r.points[0].time] = line
        return line
    })

    L.polylineDecorator(runLines[0], {
      patterns: [{
        offset: '35%',
        repeat: '35%',
        symbol: L.Symbol.arrowHead({pixelSize: 10, pathOptions: {fillOpacity: 1, weight: 5}}),
      }]
    }).addTo(this.map!)
    

    const runLayer = new GpxFeatureGroup(runLines)
    if (addToMap) {
      runLayer.addTo(this.map!)
    }
    this.addToMapLayersControl(runLayer, label)

    // const arrowPoints = runs.flatMap( (r) => this.getArrowPoints(r)).filter( (a) => !!a )
    // const arrowIcons = arrowPoints.map( (pt) => {
    //   return this.createDirectionMarker(pt.latitude, pt.longitude, pt.calculatedCourseFromPrevious)
    // })
    // const mLayer = new GpxFeatureGroup(arrowIcons)
    // mLayer.addTo(this.map!)
  }

  private createDirectionMarker(lat: number, lon: number, headingDegrees: number): L.Marker {
    return new L.Marker(
      [lat, lon],
      { icon: new L.DivIcon({
          className : 'arrowIcon',
          iconSize: new L.Point(30, 30),
          iconAnchor: new L.Point(15, 15),
          html : `<div style = 'font-size: 20px; -webkit-transform: rotate(${headingDegrees} deg)'> ▲ </div>`,
        }),
      },
    )
  }

  private getArrowPoints(run: GpsRun): GpsPoint[] {
    if (run.points.length < 300) {
      return [run.points[run.points.length / 2]]
    }

    let prevPoint = run.points[10]
    return run.points.filter( (p) => {
      if ((DateTime.fromISO(p.time).toSeconds() - DateTime.fromISO(prevPoint.time).toSeconds()) > 300) {
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
    this.selectedInfoText = message
  }

  private selectPoint(point: GpsPoint) {
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

  private stopSelectionMessage(index: number, stop: GpsStop): string {
    return `Stop #${index}: ${this.time(stop.startTime.toString())} - ` +
      `${this.time(stop.endTime.toString())}, ` +
      `(${this.displayable.durationSeconds(stop.seconds)}), ` +
      `${stop.countPoints} points`
  }

  private runSelectionMessage(index: number, run: GpsRun): string {
    return `Run #${index}: ${this.time(run.points[0].time)}, ` +
      `${displayable.distanceKilometers(run.kilometers)}, ` +
      `${this.displayable.durationSeconds(run.seconds)}, ` +
      `${this.displayable.speed(run.seconds, run.kilometers)}, ` +
      `${run.points.length} pts`
  }

  private stopOptions(stop: GpsStop) {
    return stop.seconds >= 2 * 60 ? this.stopSelectionOptions : this.shortStopSelctionOptions
  }

  @Watch('selectedStop')
  private onStopSelectionChanged(to: any, from: any) {
    const stop = this.selectedStop as GpsStop
    let index = 0
    for (const s of this.stops) {
      index += 1
      if (s.startTime === stop.startTime) { break }
    }
    const path = this.stopPolyMap[stop.startTime.toString()]
    this.setSelection(null, path, this.stopOptions(stop), this.stopSelectionMessage(index, stop))
    if (!this.skipFitBounds) {
      this.fitBounds(stop.bounds)
    }
    this.skipFitBounds = false
  }

  @Watch('selectedRun')
  private onRunSelectionChanged(to: any, from: any) {
    const run = this.selectedRun as GpsRun
    let index = 0
    for (const r of this.allRuns) {
      index += 1
      if (r.points[0].time === run.points[0].time) { break }
    }
    const line = this.runPolyMap[run.points[0].time]
    this.setSelection(null, line, this.runSelectionOptions, this.runSelectionMessage(index, run))

    if (!this.skipFitBounds) {
      this.fitBounds(run.bounds)
    }
    this.skipFitBounds = false
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

    L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
    }).addTo(this.map)

    L.control.scale({ position: 'bottomright' }).addTo(this.map)

    this.map.on('click', (e) => {
      const me = e as any
      if (me.originalEvent && me.originalEvent._gpxHandled) { return }
      this.clearSelection()
    })

  }

  private time(time: string): string {
    return this.displayable.time(time, this.track.timezoneInfo)
  }

  private loadOriginalGpx() {
    if (this.originalGpxLoaded) {
      this.messages.push(`Original GPX already loaded`)
      return
    }
    this.setSelectedMessage(`Loading original GPX...`)
    searchService.loadOriginalTrack(this.track.id)
      .then((results) => {
        new GpxParser().parse(results)
          .then((gpxFile) => {
            this.originalGpxLoaded = true
            let trackNumber = 1
            for (const track of gpxFile.tracks) {
              for (const segment of track.segments) {
                this.addGpxSegment(segment, trackNumber)
                trackNumber += 1
              }
            }
          })
          .catch((err) => {
            this.messages.push(`GPX parse error`, err)
          })
          .finally( () => {
            this.setSelectedMessage(``)
          })
      })
      .catch((err) => {
        this.messages.push(`GPX load error`, err)
        this.setSelectedMessage(``)
      })
  }

  private addGpxSegment(segment: GpxSegment, trackNumber: number) {
    const runLatLngList = segment.points.map( (p) => {
      return new L.LatLng(p.latitude, p.longitude)
    })
    const runLine = new L.Polyline(
      runLatLngList,
      { color: '#00FF00', weight: 3, dashArray: '', opacity: 1.0 })

    const runPoints = []
    for (let idx = 0; idx < segment.points.length; ++idx) {
      const p = segment.points[idx]
      const options = { radius: 1, weight: 1, color: '#009900', fillColor: '#007700', fillOpacity: 0.5 }
      const circle = new L.Circle(new L.LatLng(p.latitude, p.longitude), options)
      circle.on('click', (e) => {
        const time = displayable.time(p.timestamp.toISOString(), this.track.timezoneInfo)
        let message = `#${idx + 1}: ${time}`
        if (idx > 0) {
          const prev = segment.points[idx - 1]
          const distanceMeters = Geo.distanceGpx(prev, p)
          const meters = displayable.distanceMeters(distanceMeters)
          const seconds = (p.timestamp.getTime() - prev.timestamp.getTime()) / 1000
          const speed = displayable.speed(seconds, distanceMeters / 1000)
          message += `; ${meters}; ${speed}`
        }
        // this.setSelectedMessage(message)
        this.setSelection(e, circle, options, message)
      })
      runPoints.push(circle)
    }
    const runLayer = new GpxFeatureGroup([runLine, ...runPoints])
    runLayer.addTo(this.map as L.Map)
    this.addToMapLayersControl(runLayer, `GPX #${trackNumber}`)
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

.info-content {
  flex: 0 1 auto;
  text-align: left;
}

.left-padding {
  padding-left: 1em;
}

.pointer-cursor {
  cursor: pointer;
}

.has-pointer-events {
  pointer-events: auto;
}

</style>

