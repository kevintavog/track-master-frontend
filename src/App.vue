<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script lang="ts">
import { Component, Inject, Provide, Vue } from 'vue-property-decorator'

// import { SearchService } from '@/services/SearchService'
import { StaticService } from '@/services/StaticService'
import { TrackMasterServer } from '@/services/TrackMasterServer'

@Component
export default class App extends Vue {
  @Provide('trackMaster') private trackMaster: TrackMasterServer = new StaticService()
}
</script>

<style>
.leaflet-fake-icon-image-2x {
  background-image: url(../node_modules/leaflet/dist/images/marker-icon-2x.png);
}
.leaflet-fake-icon-shadow {
  background-image: url(../node_modules/leaflet/dist/images/marker-shadow.png);
}
@import "../node_modules/leaflet/dist/leaflet.css";

.main-html {
  height: 100vh;
  margin: 0;
  background-color: #202020;
}

body {
  height: 100vh;
  margin: 0;
}

a {
  color: white !important;
}

a:visited {
  color: white !important;
}

a:hover {
  color: white !important;
}

a:link {
  color: white !important;
}

.overrideHoverColor a:hover {
  color: rgb(206, 206, 206) !important;
}

#app {
  width: 100vw;
  height: 100%;
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: white;
}
</style>
