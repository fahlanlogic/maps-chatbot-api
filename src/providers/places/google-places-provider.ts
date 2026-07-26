import { config } from "../../config";
import type { Place, PlacesProvider } from "./places-provider";

interface GooglePlacesTextSearchResponse {
  places?: GooglePlace[];
  error?: { message: string };
}

interface GooglePlace {
  id: string;
  displayName: { text: string };
  formattedAddress: string;
  rating: number;
  location: { latitude: number; longitude: number };
  googleMapsUri: string;
}

export class GooglePlacesProvider implements PlacesProvider {
  private readonly apiKey: string;

  constructor() {
    this.apiKey = config.googleMapsApiKey;
  }

  async searchPlaces(query: string): Promise<Place[]> {
    if (!this.apiKey) {
      throw new Error("GOOGLE_MAPS_API_KEY is not configured");
    }

    const url = new URL("https://places.googleapis.com/v1/places:searchText");

    const res = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": this.apiKey,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.rating,places.location,places.googleMapsUri",
      },
      body: JSON.stringify({ textQuery: query }),
      signal: AbortSignal.timeout(5_000),
    });

    if (!res.ok) {
      throw new Error(
        `Google Places API error: ${res.status} ${res.statusText}`
      );
    }

    const data = (await res.json()) as GooglePlacesTextSearchResponse;

    if (data.error) {
      throw new Error(`Google Places API error: ${data.error.message}`);
    }

    if (!data.places || data.places.length === 0) {
      return [];
    }

    return data.places.map(normalizePlace);
  }
}

function normalizePlace(place: GooglePlace): Place {
  return {
    id: place.id,
    name: place.displayName.text,
    address: place.formattedAddress,
    rating: place.rating,
    location: {
      lat: place.location.latitude,
      lng: place.location.longitude,
    },
    mapsUrl: place.googleMapsUri,
  };
}
