<template>
  <div class="map box">
    <div class="map-content" id="map" >
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import L from 'leaflet'
import { GpxParser, GpxSegment } from '@/models/Gpx'
import { searchService } from '../services/SearchService'
import { GpxFeatureGroup } from '@/utils/GpxFeatureGroup.ts'

@Component({})
export default class Map extends Vue {
  private map?: L.Map
  private mapLayersControl: L.Control.Layers | null = null

  private mounted() {
    this.initializeMap()

    const props = this.$route.query
    if ('id' in props) {
      this.loadTrack(props.id as string)
    }
  }

  private loadTrack(id: string) {
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
  flex-grow: 1;
  height: 100%;
}

</style>

