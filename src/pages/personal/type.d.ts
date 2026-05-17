export interface CheckedAirport {
  name: string;
  lat: number;
  lng: number;
  type: 'airport';
  description: string;
}

export interface AirportBounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface AirportMarkerPosition {
  left: number;
  top: number;
}

export interface AirportCountryGroup {
  countryName: string;
  airports: CheckedAirport[];
}

export interface MapCoordinate {
  lat: number;
  lng: number;
}

export interface MapLandmass {
  name: string;
  points: MapCoordinate[];
}

export interface MapRegionLabel {
  name: string;
  coordinate: MapCoordinate;
}

export interface MapRoute {
  name: string;
  start: MapCoordinate;
  end: MapCoordinate;
}
