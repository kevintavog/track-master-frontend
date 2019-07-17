import { SearchResults, SearchTrack } from '@/models/SearchResults'

export interface TrackMasterServer {
    list(first: number, count: number): Promise<SearchResults>
    getTrack(id: string): Promise<SearchTrack>
    loadTrack(id: string): Promise<string>
    loadOriginalTrack(id: string): Promise<string>
}
