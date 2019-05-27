<template>
  <div class="map box">
    <div class="map-content" id="map" >
    </div>
    <div class="is-pulled-left is-size-5 pointer-cursor" aria-controls="info-content-id" @click="infoVisible = !infoVisible">
      <p class="is-pulled-left has-text-white">Info</p>
      <a class="is-pulled-left left-padding">
        <b-icon :icon="infoVisible ? 'caret-down' : 'caret-up'" />
      </a>
    </div>
    <b-collapse :open="infoVisible" class="info-content" aria-id="info-content-id">
      <b-tabs v-model="activeInfoTab">

        <b-tab-item label="Meta" class="is-pulled-left" >
          <div>
            {{ displayable.dayOfWeek(track.startTime) }},
            {{ displayable.longDate(track.startTime) }}
            <br>
            {{ displayable.time(track.startTime, track.timezoneInfo) }}
            to {{ displayable.time(track.endTime, track.timezoneInfo) }} ({{track.timezoneInfo.tag}})
          </div>
          <div>
            Duration: {{ displayable.duration(track) }} 
          </div>
          <div>
            Countries: {{displayable.join(track.countryNames)}}
          </div>
          <div>
            States: {{displayable.join(track.stateNames)}}
          </div>
          <div>
            Cities: {{displayable.join(track.cityNames)}}
          </div>
          <div>
            Sites: {{displayable.join(track.siteNames)}}
          </div>
        </b-tab-item>

        <b-tab-item label="Speed">
          <apexchart height="200" type="line" :options="speedOptions" :series="speedSeries"></apexchart>
        </b-tab-item>

        <b-tab-item label="Distance">
          Distance!
        </b-tab-item>

      </b-tabs>
    </b-collapse>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import L from 'leaflet'
import { GpxParser, GpxSegment } from '@/models/Gpx'
import { emptyGpsPoint, Gps, GpsBounds, GpsPoint, GpsRun, GpsTrack } from '@/models/Gps'
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
  private infoVisible = true
  private activeInfoTab = 0
  private speedSeries = [{
    name: 'Speed',
    data: [{ x: '1', y: 3.1, pt: emptyGpsPoint }],
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
/*
  private chartClick(event: any, chartContext: any, config: any) {
console.log('clicked', event, config)
  }
*/

  private formatXTooltip(value: string): string {
    return this.displayable.time(value, this.track.timezoneInfo)
  }

  private loadTrack(id: string) {
    this.speedSeries[0].data = []
    searchService.loadTrack(id)
      .then((results) => {
        // This is silly - `results` is supposed to be a string already, but isn't.
        const gps: Gps = (results as unknown) as Gps
        this.map!.fitBounds([
          [gps.bounds.min.lat, gps.bounds.min.lon],
          [gps.bounds.max.lat, gps.bounds.max.lon]],
          undefined)

        let trackNumber = 1
        for (const track of gps.tracks) {
          let runNumber = 1
          for (const run of track.runs) {
            this.addRun(gps, track, run, `T ${trackNumber}, Run #${runNumber}`)
            runNumber += 1
          }
          trackNumber += 1
        }
      })
  }

  private addRun(gps: Gps, track: GpsTrack, run: GpsRun, trackId: string) {
    const runLatLngList = run.points.map( (p) => {
      this.speedSeries[0].data.push({ x: p.time, y: p.speedKmH, pt: p })
      return new L.LatLng(p.latitude, p.longitude)
    })

    const runLine = new L.Polyline(
      runLatLngList,
      { color: 'purple', weight: 3, dashArray: '', opacity: 1.0 })

    const runLayer = new GpxFeatureGroup([runLine])
    runLayer.addTo(this.map as L.Map)
    this.addToMapLayersControl(runLayer, `${trackId}`)
  }

  private addToMapLayersControl(layer: L.FeatureGroup, name: string) {
    if (this.mapLayersControl == null) {
      this.mapLayersControl = L.control.layers(
          undefined, { [name]: layer }, { position: 'topright', collapsed: false }).addTo(this.map as L.Map)
    } else {
      this.mapLayersControl.addOverlay(layer, name)
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

