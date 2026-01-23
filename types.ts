
export interface MoonImage {
  url: string;
  filename: string;
  media_type: string;
  alt_text: string;
  width: number;
  height: number;
  pixels: number;
}

export interface MoonDataResponse {
  image: MoonImage;
  image_highres: MoonImage;
  su_image?: MoonImage; // South-up image
  su_image_highres?: MoonImage; // South-up high res
  time: string; // ISO-like string from API
  phase: number; // 0.00 to 100.00
  obscuration: number;
  age: number; // days
  diameter: number; // arcseconds
  distance: number; // km
  j2000_ra: number;
  j2000_dec: number;
  subsolar_lon: number;
  subsolar_lat: number;
  subearth_lon: number;
  subearth_lat: number;
  posangle: number;
}

export interface LocalMoonData {
  azimuth: number; // degrees (Standard Compass: 0=N, 90=E)
  altitude: number; // degrees
  distance: number; // km
  parallacticAngle: number; // degrees
  rise: Date | undefined;
  set: Date | undefined;
  alwaysUp?: boolean;
  alwaysDown?: boolean;
}

export interface AppState {
  currentDate: Date;
  loading: boolean;
  error: string | null;
  data: MoonDataResponse | null;
  isPlaying: boolean;
  isSouthUp: boolean;
  isHighRes: boolean;
  playbackSpeed: number; // ms delay between frames
  theme: 'dark' | 'light';
}

export type ViewMode = 'standard' | 'scientific';
