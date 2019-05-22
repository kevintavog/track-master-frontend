<template>
  <div class="search">
    <b-field grouped class="horz-margins">
      <b-input placeholder="Search..." type="search" icon="magnify" autocapitalize="none" autofocus expanded>
      </b-input>
      <p class="control">
        <button class="button is-primary">Search</button>
      </p>
    </b-field>

    <br>
    <b-table 
      :data="searchResults.matches"
      :opened-detailed="openedDetails"
      :show-detail-icon="true"
      detailed
      detail-key="id">
      <template slot-scope="props">

        <b-table-column field="startTime" label="Date" centered>
          <span >
          {{ new Date(props.row.startTime).toLocaleDateString() }}
          </span>
        </b-table-column>

        <b-table-column field="flatCountries" label="Countries">
          {{ props.row.flatCountries }}
        </b-table-column>

        <b-table-column field="flatStates" label="States">
          {{ props.row.flatStates }}
        </b-table-column>

        <b-table-column field="flatCities" label="Cities">
          {{ firstFew(props.row.flatCities) }}
        </b-table-column>

        <b-table-column field="flatSites" label="Sites">
          {{ firstFew(props.row.flatSites) }}
        </b-table-column>

      </template>

      <template slot="detail" slot-scope="props">
        <div>
          From {{ new Date(props.row.startTime).toLocaleTimeString('en-US', { timeZone: 'UTC' }) }}
          to {{ new Date(props.row.endTime).toLocaleTimeString('en-US', { timeZone: 'UTC' }) }} (UTC)
        </div>
        <div>
          Duration: {{ duration(props.row)  }} 
        </div>
        <div>
          Cities: {{props.row.flatCities}}
        </div>
        <div>
          Sites: {{props.row.flatSites}}
        </div>

      </template>

    </b-table>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { searchService } from '@/services/SearchService'
import { SearchResults, SearchTrack } from '@/models/SearchResults'
import { DateTime } from 'luxon'


@Component({})
export default class Search extends Vue {
  private searchResults: SearchResults = { matches: [], totalMatches: 0 }
  private openedDetails: number[] = []

  private mounted() {
    this.searchResults = { matches: [], totalMatches: 0 }
    searchService.list(1, 30)
      .then((results) => {
        this.searchResults = results
      })
  }

  private duration(track: SearchTrack): string {
    const end = DateTime.fromISO(track.endTime)
    const start = DateTime.fromISO(track.startTime)
    const diff = end.diff(start, ['hours', 'minutes', 'seconds']).toObject()
    return `${diff.hours}:${diff.minutes}:${diff.seconds}`
  }

  private firstFew(str: string): string {
    if (!str) {
      return ''
    }
    const tokens = str.split(',')
    let few = tokens.slice(0, 2).join(', ')
    if (tokens.length > 2) {
      few += ', ...'
    }
    return few
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

</style>
