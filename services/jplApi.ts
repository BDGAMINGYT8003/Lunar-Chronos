/**
 * Service to interact with NASA JPL Horizons API.
 * Documentation: https://ssd.jpl.nasa.gov/api/horizons.api
 */

const BASE_URL = 'https://ssd.jpl.nasa.gov/api/horizons.api';

// List of proxies to try in sequence to bypass CORS
const PROXIES = [
  // Primary: corsproxy.io - fast, reliable, handles large payloads
  (target: string) => `https://corsproxy.io/?${encodeURIComponent(target)}`,
  // Secondary: allorigins - good fallback, supports raw output via 'raw' endpoint
  (target: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`,
  // Tertiary: thingproxy - another backup
  (target: string) => `https://thingproxy.freeboard.io/fetch/${encodeURIComponent(target)}`
];

interface JPLResponse {
  result: string;
  signature: {
    source: string;
    version: string;
  };
}

/**
 * Fetches the precise topocentric distance (User -> Moon) from JPL Horizons.
 * 
 * @param date Target date
 * @param lat Latitude (decimal degrees)
 * @param lon Longitude (decimal degrees, East positive)
 * @param alt Altitude (meters)
 * @returns Distance in Kilometers
 */
export const fetchJPLDistance = async (
  date: Date, 
  lat: number, 
  lon: number, 
  alt: number
): Promise<number | null> => {
  
  // Format time for Horizons: YYYY-MM-DD HH:MM
  // Note: Horizons accepts UT.
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  
  const startTime = `${year}-${month}-${day} ${hours}:${minutes}`;
  
  // Create a stop time 1 minute later to ensure we get a valid step
  const nextMinDate = new Date(date.getTime() + 60000);
  const nextYear = nextMinDate.getUTCFullYear();
  const nextMonth = String(nextMinDate.getUTCMonth() + 1).padStart(2, '0');
  const nextDay = String(nextMinDate.getUTCDate()).padStart(2, '0');
  const nextHours = String(nextMinDate.getUTCHours()).padStart(2, '0');
  const nextMinutes = String(nextMinDate.getUTCMinutes()).padStart(2, '0');
  const stopTime = `${nextYear}-${nextMonth}-${nextDay} ${nextHours}:${nextMinutes}`;

  // Construct Query Parameters based on provided documentation
  const params = new URLSearchParams();
  
  params.append('format', 'json');
  params.append('COMMAND', "'301'"); // 301 is the ID for the Moon
  params.append('OBJ_DATA', "'NO'"); // Don't need object summary
  params.append('MAKE_EPHEM', "'YES'");
  params.append('EPHEM_TYPE', "'OBSERVER'");
  params.append('CENTER', "'coord'"); // Use user coordinates
  params.append('COORD_TYPE', "'GEODETIC'");
  // SITE_COORD: 'lon,lat,alt' (East-Longitude positive, km)
  params.append('SITE_COORD', `'${lon},${lat},${alt / 1000}'`); 
  
  params.append('START_TIME', `'${startTime}'`);
  params.append('STOP_TIME', `'${stopTime}'`);
  params.append('STEP_SIZE', "'1 m'"); // 1 minute steps
  
  // QUANTITIES='20' -> Target range (delta) and range-rate (deldot)
  params.append('QUANTITIES', "'20'"); 
  params.append('RANGE_UNITS', "'KM'"); // Force Output in KM
  params.append('CSV_FORMAT', "'NO'"); // We will parse the text block manually

  const queryString = params.toString();
  const targetUrl = `${BASE_URL}?${queryString}`;

  // Attempt to fetch using the defined proxies in order
  for (const proxyFn of PROXIES) {
    try {
      const url = proxyFn(targetUrl);
      const response = await fetch(url);
      
      // If network error or status not OK, try next proxy
      if (!response.ok) {
        console.warn(`JPL Proxy failed (${response.status}): ${url}`);
        continue; 
      }

      const data: JPLResponse = await response.json();
      
      // Parse the 'result' text block for the data between $$SOE and $$EOE
      // Format is fixed width usually, but with quantities=20 it looks like:
      // Date__(UT)__HR:MN     R.A._(ICRF)_DEC   APmag  S-brt            delta      deldot
      // OR if we just asked for 20:
      // Date__(UT)__HR:MN        Range      Range-Rate
      
      // Regex to find the data block
      const match = data.result.match(/\$\$SOE([\s\S]*?)\$\$EOE/);
      if (match && match[1]) {
        const lines = match[1].trim().split('\n');
        if (lines.length > 0) {
          // The line will contain the date, then the range, then the range-rate.
          // Example: 2023-May-04 12:00  3.9481239123E+05  -1.23123
          // We split by whitespace and look for the first numeric value after the date.
          // The date takes up the first 2 columns (YYYY-MMM-DD HH:MM)
          
          const parts = lines[0].trim().split(/\s+/);
          // Index 0: Date
          // Index 1: Time
          // Index 2: Range (Delta)
          // Index 3: Range Rate (Deldot)
          
          const range = parseFloat(parts[2]);
          if (!isNaN(range)) {
              return range;
          }
        }
      }
      
      // If we got a valid response structure but no data match, it might be an API error (e.g. target not found), 
      // not a proxy error. Return null.
      return null;

    } catch (error) {
      console.warn("Failed to fetch from JPL Horizons via proxy:", error);
      // Continue to next proxy in the list
    }
  }

  // All proxies failed
  return null;
};