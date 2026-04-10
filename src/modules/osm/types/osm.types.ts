export interface OsmAddress {
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  country?: string;
  country_code?: string;
  state?: string;
  postcode?: string;
}

export interface OsmSearchItem {
  osm_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: OsmAddress;
}
