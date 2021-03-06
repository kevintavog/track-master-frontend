<template>
  <div class="search">
    <b-notification v-for="m in messages" v-bind:key="m" type="is-danger" role="alert">
      {{ m }}
    </b-notification>

    <!-- <b-field grouped class="horz-margins">
      <b-input placeholder="Search..." type="search" icon="magnify" autocapitalize="none" autofocus expanded>
      </b-input>
      <p class="control">
        <button class="button is-primary">Search</button>
      </p>
    </b-field> -->

    <b-pagination
      :total="searchResults.totalMatches"
      :current.sync="currentPage"
      :per-page="pageSize"
      :rounded="true"
      icon-pack="fas"
      order="is-centered"
      aria-next-label="Next page"
      aria-previous-label="Previous page"
      aria-page-label="Page"
      aria-current-label="Current page">
    </b-pagination>
    <br>
    <b-table 
      :data="searchResults.matches"
      :opened-detailed="openedDetails"
      :show-detail-icon="true"
      ref="tracksTable"
      detailed
      detail-key="id" >
      <template slot-scope="props">

        <b-table-column field="start" label="Date" centered class="pointer-cursor" 
            @click.native.stop="toggleDetails(props.row)">
          <span class="has-text-weight-semibold	" >
            {{ displayable.dayOfWeek(props.row.startTime, props.row.timezoneInfo.id) }},
            {{ displayable.date(props.row.startTime, props.row.timezoneInfo.id) }}
          </span>
        </b-table-column>

        <b-table-column field="start" label="Time" centered class="pointer-cursor" 
            @click.native.stop="toggleDetails(props.row)" >
          <span >
            {{ displayable.shortTime(props.row.startTime, props.row.timezoneInfo.id) }} -
            {{ displayable.shortTime(props.row.endTime, props.row.timezoneInfo.id) }}
          </span>
        </b-table-column>

        <b-table-column field="duration" label="Duration" class="pointer-cursor" 
            @click.native.stop="toggleDetails(props.row)" >
          {{ displayable.trackDistance(props.row) }}, {{ displayable.duration(props.row) }}
        </b-table-column>

        <b-table-column field="countryNames" label="Countries" class="pointer-cursor has-background-map" 
            @click.native.stop="showMap(props.row)" >
          {{ displayable.firstFew(props.row.countryNames) }}
        </b-table-column>

        <b-table-column field="cityNames" label="Cities" class="pointer-cursor has-background-map" 
            @click.native.stop="showMap(props.row)" >
          {{ displayable.firstFew(props.row.cityNames) }}
        </b-table-column>

        <b-table-column field="siteNames" label="Sites" class="pointer-cursor has-background-map" 
            @click.native.stop="showMap(props.row)" >
          {{ displayable.firstFew(props.row.siteNames) }}
        </b-table-column>

        <b-table-column field="map" label="" class="pointer-cursor has-background-map" 
            @click.native.stop="showMap(props.row)" >
          <b-icon icon="map" size="is-medium"/>
        </b-table-column>

      </template>

      <template slot="detail" slot-scope="props">
        <div>
          From {{ displayable.time(props.row.startTime, props.row.timezoneInfo.id) }}
          to {{ displayable.time(props.row.endTime, props.row.timezoneInfo.id) }} 
          ( {{ displayable.shortTimezoneName(props.row.timezoneInfo.id) }} )
        </div>
        <div>
          Path: {{ props.row.path }}
        </div>
        <div>
          Distance: {{ displayable.trackDistance(props.row) }}
        </div>
        <div>
          Duration: {{ displayable.duration(props.row)  }} 
        </div>
        <div v-if="hasEntries(props.row.stateNames)">
          States: {{ displayable.join(props.row.stateNames) }}
        </div>
        <div v-if="hasEntries(props.row.cityNames)">
          Cities: {{ displayable.join(props.row.cityNames) }}
        </div>
        <div v-if="hasEntries(props.row.siteNames)">
          Sites: {{ displayable.join(props.row.siteNames) }}
        </div>
      </template>

    </b-table>
    <br>
    <b-pagination
      :total="searchResults.totalMatches"
      :current.sync="currentPage"
      :per-page="pageSize"
      :rounded="true"
      icon-pack="fas"
      order="is-centered"
      aria-next-label="Next page"
      aria-previous-label="Previous page"
      aria-page-label="Page"
      aria-current-label="Current page">
    </b-pagination>

  </div>
</template>

<script lang="ts">
import { Component, Inject, Vue, Watch } from 'vue-property-decorator'
import { SearchResults, SearchResultsHelper, SearchTrack } from '@/models/SearchResults'
import { displayable } from '@/utils/Displayable'
import { TrackMasterServer } from '@/services/TrackMasterServer'


@Component({})
export default class Search extends Vue {
  @Inject('trackMaster') private trackMaster!: TrackMasterServer
  private messages: string[] = []
  private searchResults: SearchResults = { matches: [], totalMatches: 0 }
  private openedDetails: number[] = []
  private currentPage: number = 1
  private pageSize: number = 30
  private displayable = displayable

  private mounted() {
    this.searchResults = { matches: [], totalMatches: 0 }
    this.invokeSearch(this.$route.query)
  }

  @Watch('$route')
  private onRouteChanged(to: any, from: any) {
    this.invokeSearch(to.query)
  }

  private hasEntries(data: string[]): boolean {
    return data.length > 0 && data[0].length > 0
  }

  private invokeSearch(query: any): void {
    let page = 1
    if ('page' in query) {
        page = +query.page
    }
    this.currentPage = page

    this.trackMaster.list((page - 1) * this.pageSize, this.pageSize)
      .then((results) => {
        this.searchResults = results
        for (const sr of this.searchResults.matches) {
          SearchResultsHelper.augment(sr)
        }
      })
      .catch((err) => {
        this.messages.push(`Search failed: ` + err)
      })
  }

  private toggleDetails(row: object) {
    this.$refs.tracksTable.toggleDetails(row)
  }

  private showMap(row: object) {
      this.$router.push( { path: 'map', query: { id: `${row.id}` } }).catch( (err) => {})

  }

  @Watch('currentPage')
  private pageChanged(to: any, from: any) {
    if (to !== from) {
      this.$router.push( { path: 'search', query: { page: `${this.currentPage}` } }).catch( (err) => {})
    }
  }
}

</script>

<style>

.table thead th {
  background-color: #303030 !important;
  color: white !important;
}

.table {
  background-color: #303030 !important;
  color: white !important;
}

.b-table .table tr.detail {
  background-color: #606060 !important;
  color: white !important;
}

</style>

<style scoped>
.search {
  margin-top: 0.5em;
}

.horz-margins {
  padding-left: 0.5em;
  padding-right: 0.5em;
}

.pointer-cursor {
  cursor: pointer;
}

.has-background-map {
  background-color: hsl(204, 76%, 23%);
}

</style>
