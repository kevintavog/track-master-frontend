<template>
  <div class="map box">
    <div class="map-content" id="map" >
    </div>
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
            Duration: <span class="has-text-weight-semibold"> {{ displayable.duration(track) }} </span>
          </div>
          <div>
            Speed: <span class="has-text-weight-semibold"> {{ displayable.speed(track.durationSeconds, track.distanceKilometers) }} </span>
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

        <b-tab-item label="Speed">
          <apexchart height="200" type="line" :options="speedOptions" :series="speedSeries"></apexchart>
        </b-tab-item>

        <b-tab-item label="Runs">
          <b-table 
            :data="allRuns">
            <template slot-scope="props">
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

        <b-tab-item label="Clusters">
          <b-table 
            :data="clusters">
            <template slot-scope="props">
              <b-table-column field="start" label="start" centered>
                <span >
                  {{ displayable.time(props.row.startTime, track.timezoneInfo) }}
                </span>
              </b-table-column>
              <b-table-column field="duration" label="Duration" centered>
                <span >
                  {{ displayable.durationSeconds(props.row.seconds) }}
                </span>
              </b-table-column>
              <b-table-column field="count" label="# Stops" centered>
                <span >
                  {{ props.row.countStops }}
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
import { GpxParser, GpxSegment } from '@/models/Gpx'
import { emptyGpsPoint, Gps, GpsBounds, GpsClusterStop, GpsPoint, GpsRun, GpsTrack } from '@/models/Gps'
import { searchService } from '@/services/SearchService'
import { emptySearchTrack, SearchTrack } from '@/models/SearchResults'
import { GpxFeatureGroup } from '@/utils/GpxFeatureGroup.ts'
import { displayable } from '@/utils/Displayable'

@Component({})
export default class Map extends Vue {
  private displayable = displayable
  private map?: L.Map
  private mapLayersControl: L.Control.Layers | null = null
  private track: SearchTrack = emptySearchTrack
  private allRuns: GpsRun[] = []
  private clusters: GpsClusterStop[] = []
  private selectedPath?: L.Path
  private selectedOptions = {}
  private selectedInfoText = ''
  private infoVisible = false
  private activeInfoTab = 0
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
        .catch((err) => { console.log(err) })
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

        let trackNumber = 1
        for (const track of gps.tracks) {
          for (const run of track.runs) {
            this.allRuns.push(run)
          }
        }

        this.addClusters(gps)
        this.addRuns(this.allRuns, 'Runs')
        this.addStops(gps)
      })
  }

  private addClusters(gps: Gps) {
    if (!gps.clusters) {
      this.clusters = []
      return
    }

    const options = { color: 'red', fillOpacity: 0.7 }
    this.clusters = gps.clusters
    let index = 1
    const l = gps.clusters.map(c => {
      const clusterIndex = index
      let l = new L.Rectangle([[c.bounds.min.lat, c.bounds.min.lon], [c.bounds.max.lat, c.bounds.max.lon]], options)
      l.on('click', e => {
        const m = `Cluster #${clusterIndex}, ${this.displayable.durationSeconds(c.seconds)}, ` +
          `${c.countStops} stops, starting ${this.time(c.startTime.toString())}`
        this.setSelection(e, l, options, m)
      })
      index += 1
      return l
    })
    const layer = new GpxFeatureGroup(l)
    layer.addTo(this.map as L.Map)
    this.addToMapLayersControl(layer, `Clusters`)
  }

  private addStops(gps: Gps) {
    if (!gps.stops) {
      return
    }

    const options = { radius: 5, color: 'red', opacity: 0.6, fillColor: 'orange', fillOpacity: 0.9 }
    let index = 1
    const stops = gps.stops.map(s => {
        let l = new L.Circle([s.latitude, s.longitude], options)
        const stopIndex = index
        l.on('click', e => {
          let me = e as L.LeafletMouseEvent
          const m = `stop #${stopIndex}, at ${this.time(s.time)}`
          this.setSelection(e, l, options, m)
        })
        index += 1
        return l
    })
    const stopLayer = new GpxFeatureGroup(stops)
    stopLayer.addTo(this.map as L.Map)
    this.addToMapLayersControl(stopLayer, `Stops`)
  }

  private addRuns(runs: GpsRun[], label: string) {
    const options = { color: '#0000FF', weight: 5, dashArray: '', opacity: 0.6 }
    let index = 1
    const runLines = runs.map(r => {
        const runIndex = index
        const runLatLngList = r.points.map( (p) => {
          this.speedSeries[0].data.push({ x: p.time, y: p.calculatedSpeedKmHFromPrevious })
          return new L.LatLng(p.latitude, p.longitude)
        })

        const line = new L.Polyline(runLatLngList, options)
        line.on('click', e => {
          const m = `run #${runIndex}, ${displayable.distanceKilometers(r.kilometers)} in ` +
            `${this.displayable.durationSeconds(r.seconds)}, ` +
            `${this.displayable.speed(r.seconds, r.kilometers)}, ` +
            `${r.points.length} points, starting ${this.time(r.points[0].time)}`
          this.setSelection(e, line, options, m)
        })
        index += 1
        return line
    })

    const runLayer = new GpxFeatureGroup(runLines)
    runLayer.addTo(this.map as L.Map)
    this.addToMapLayersControl(runLayer, label)
  }

  private addToMapLayersControl(layer: L.FeatureGroup, name: string) {
    if (this.mapLayersControl == null) {
      this.mapLayersControl = L.control.layers(
          undefined, { [name]: layer }, { position: 'topright', collapsed: false }).addTo(this.map as L.Map)
    } else {
      this.mapLayersControl.addOverlay(layer, name)
    }
  }

  private setSelection(e: any, path: L.Path, options: {}, message: string) {
    e.originalEvent._gpxHandled = true
    e.originalEvent.stopImmediatePropagation()

    this.clearSelection()
    this.selectedInfoText = message
    this.selectedPath = path
    this.selectedOptions = options
    path.setStyle({color: '#FF33FF', weight: 7, opacity: 0.8})
  }

  private clearSelection() {
    if (this.selectedPath){
      this.selectedInfoText = ''
      this.selectedPath.setStyle(this.selectedOptions)
      this.selectedPath = undefined
    }
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

    this.map.on('click', e => {
      let me = e as any
      if (me.originalEvent && me.originalEvent._gpxHandled) { return }
      this.clearSelection()
    })

  }

  private time(time: string): string {
    return this.displayable.time(time, this.track.timezoneInfo)
  }

  private loadGpxTrack(id: string) {
    searchService.loadTrack(id)
      .then((results) => {
        new GpxParser().parse(results)
          .then((gpxFile) => {
            let trackNumber = 1
            for (const track of gpxFile.tracks) {
              for (const segment of track.segments) {
                this.addGpxSegment(segment, trackNumber)
                trackNumber += 1
              }
            }

            this.map!.fitBounds([
              [gpxFile.bounds.minLat, gpxFile.bounds.minLon],
              [gpxFile.bounds.maxLat, gpxFile.bounds.maxLon]],
              undefined)
          })
          .catch((err) => {
            console.log('parse err: ', err)
          })
      })
      .catch((err) => {
        console.log('load err:', err)
      })
  }

  private addGpxSegment(segment: GpxSegment, trackNumber: number) {
    const runLatLngList = segment.points.map( (p) => {
      return new L.LatLng(p.latitude, p.longitude)
    })
    const runLine = new L.Polyline(
      runLatLngList,
      { color: 'purple', weight: 3, dashArray: '', opacity: 1.0 })

    const runLayer = new GpxFeatureGroup([runLine])
    // (runLayer as any).gpxLayer = true
    runLayer.addTo(this.map as L.Map)
    this.addToMapLayersControl(runLayer, `#${trackNumber} runs`)
  }
}

</script>

<style>
.leaflet-bar, .leaflet-bar a {
  background-color: #666;
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

</style>

