// Astronomical Constants
const RE_EQ = 6378.137; // Earth Equatorial Radius (km)
const FLATTENING = 1 / 298.257223563; // WGS84 Flattening

/**
 * Calculates the topocentric distance to the moon based on observer's location.
 * Applies parallax correction to the geocentric data provided by NASA.
 * 
 * @param geoDistKm Geocentric distance to Moon (km)
 * @param raHours Right Ascension (J2000) in Hours
 * @param decDeg Declination (J2000) in Degrees
 * @param latDeg Observer's Latitude
 * @param lonDeg Observer's Longitude
 * @param altMeters Observer's Altitude
 * @param date Target Date
 */
export function calculateTopocentricDistance(
  geoDistKm: number,
  raHours: number,
  decDeg: number,
  latDeg: number,
  lonDeg: number,
  altMeters: number,
  date: Date
): number {
  // Convert Geocentric Spherical (RA/Dec/Dist) to Cartesian (ECI J2000)
  // Note: Assuming RA/Dec are J2000. 
  const raRad = (raHours * 15 * Math.PI) / 180;
  const decRad = (decDeg * Math.PI) / 180;

  const x_moon = geoDistKm * Math.cos(decRad) * Math.cos(raRad);
  const y_moon = geoDistKm * Math.cos(decRad) * Math.sin(raRad);
  const z_moon = geoDistKm * Math.sin(decRad);

  // Convert Observer Geodetic (Lat/Lon/Alt) to Geocentric Cartesian (ECI J2000)
  // 1. Calculate Local Sidereal Time (LST)
  // LST = GMST + Lon
  const jd = getJulianDate(date);
  const gmstDeg = calculateGMST(jd);
  const lstDeg = gmstDeg + lonDeg;
  const lstRad = (lstDeg * Math.PI) / 180;

  // 2. Earth Figure (WGS84)
  const latRad = (latDeg * Math.PI) / 180;
  const sinLat = Math.sin(latRad);
  const cosLat = Math.cos(latRad);
  
  // Prime vertical radius of curvature
  const N = RE_EQ / Math.sqrt(cosLat * cosLat + (1 - FLATTENING) * (1 - FLATTENING) * sinLat * sinLat);
  
  const altKm = altMeters / 1000;
  const r_cos_phi = (N + altKm) * cosLat;
  const r_sin_phi = (N * (1 - FLATTENING) * (1 - FLATTENING) + altKm) * sinLat;

  // 3. Observer Position in ECI (approximate, ignoring precession/nutation for J2000 alignment)
  // For 'most accurate' without external ephemeris, this is the standard first-order correction.
  const x_obs = r_cos_phi * Math.cos(lstRad);
  const y_obs = r_cos_phi * Math.sin(lstRad);
  const z_obs = r_sin_phi;

  // Vector Difference
  const dx = x_moon - x_obs;
  const dy = y_moon - y_obs;
  const dz = z_moon - z_obs;

  return Math.sqrt(dx*dx + dy*dy + dz*dz);
}

function getJulianDate(date: Date): number {
  return (date.getTime() / 86400000.0) + 2440587.5;
}

function calculateGMST(jd: number): number {
  const t = (jd - 2451545.0) / 36525.0;
  let gmst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * t * t - (t * t * t) / 38710000.0;
  // Normalize to 0-360
  gmst = gmst % 360;
  if (gmst < 0) gmst += 360;
  return gmst;
}