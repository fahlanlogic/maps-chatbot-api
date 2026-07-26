export interface PlaceLocation {
  lat: number
  lng: number
}

export interface Place {
  id: string
  name: string
  address: string
  rating: number
  location: PlaceLocation
  mapsUrl: string
}

export interface PlacesProvider {
  searchPlaces(query: string): Promise<Place[]>
}
