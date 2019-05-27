<template>
  <div class="search">
    <b-field grouped class="horz-margins">
      <b-input placeholder="Search..." type="search" icon="magnify" autocapitalize="none" autofocus expanded>
      </b-input>
      <p class="control">
        <button class="button is-primary">Search</button>
      </p>
    </b-field>

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
      detailed
      detail-key="id">
      <template slot-scope="props">

        <b-table-column field="startTime" label="Date" centered>
          <span >
          {{ displayable.date(props.row.startTime) }}
          </span>
        </b-table-column>

        <b-table-column field="countryNames" label="Countries">
          {{ displayable.firstFew(props.row.countryNames) }}
        </b-table-column>

        <b-table-column field="stateNames" label="States">
          {{ displayable.firstFew(props.row.stateNames) }}
        </b-table-column>

        <b-table-column field="cityNames" label="Cities">
          {{ displayable.firstFew(props.row.cityNames) }}
        </b-table-column>

        <b-table-column field="siteNames" label="Sites">
          {{ displayable.firstFew(props.row.siteNames) }}
        </b-table-column>

        <b-table-column field="siteNames" label="">
          <router-link :to="{ path: 'map', query: {id: props.row.id} }">
            <b-icon icon="map" size="is-medium"/>
          </router-link>
        </b-table-column>

      </template>

      <template slot="detail" slot-scope="props">
        <div>
          From {{ displayable.time(props.row.startTime, props.row.timezoneInfo) }}
          to {{ displayable.time(props.row.endTime, props.row.timezoneInfo) }} ( {{props.row.timezoneInfo.tag}} )
        </div>
        <div>
          Duration: {{ displayable.duration(props.row)  }} 
        </div>
        <div>
          Cities: {{ displayable.join(props.row.cityNames) }}
        </div>
        <div>
          Sites: {{ displayable.join(props.row.siteNames) }}
        </div>
      </template>

    </b-table>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from 'vue-property-decorator'
import { searchService } from '@/services/SearchService'
import { SearchResults, SearchTrack } from '@/models/SearchResults'
import { displayable } from '@/utils/Displayable'


@Component({})
export default class Search extends Vue {
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

  private invokeSearch(query: any): void {
    let page = 1
    if ('page' in query) {
        page = +query.page
    }
    this.currentPage = page

    searchService.list((page - 1) * this.pageSize, this.pageSize)
      .then((results) => {
        this.searchResults = results
      })
      .catch((err) => {
        console.log(err)
      })
  }

  @Watch('currentPage')
  private pageChanged(to: any, from: any) {
    if (to !== from) {
      this.$router.push( { path: 'search', query: { page: `${this.currentPage}` } })
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

</style>
