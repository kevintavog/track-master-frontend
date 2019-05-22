
export class SearchRequest {
    public static defaultItemsPerPage: number = 50

    public searchType: string = ''

    public properties: string = ''
    public first: number = 1
    public pageCount: number = SearchRequest.defaultItemsPerPage

    // A text search, the most common search
    public searchText: string = ''

    // A nearby search
    public latitude: number = -1
    public longitude: number = -1
    public maxKilometers: number = -1

    public isEquivalent(other: SearchRequest): boolean {
      if (this.searchType !== other.searchType) {
          return false
      }
      switch (this.searchType) {
        case 's':
          return this.searchText === other.searchText
        case 'l':
          return this.latitude === other.latitude && this.longitude === other.latitude
      }
      return false
    }
}
