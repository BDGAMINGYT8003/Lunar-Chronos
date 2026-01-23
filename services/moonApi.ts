import { MoonDataResponse } from '../types';

const BASE_URL = 'https://svs.gsfc.nasa.gov/api/dialamoon';

/**
 * Fetches moon data for a specific date.
 * The API expects ISO-like format: YYYY-MM-DDTHH:MM
 * Note: The API only supports dates from Jan 1, 2011 to the end of the current year.
 */
export const fetchMoonData = async (date: Date): Promise<MoonDataResponse> => {
  // Format date to YYYY-MM-DDTHH:MM (UTC)
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');

  const timestamp = `${year}-${month}-${day}T${hours}:${minutes}`;
  const url = `${BASE_URL}/${timestamp}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
        if(response.status === 404) {
             throw new Error("Date out of range or data unavailable for this specific timestamp.");
        }
      throw new Error(`API Error: ${response.statusText}`);
    }
    const data = await response.json();
    return data as MoonDataResponse;
  } catch (error) {
    console.error("Failed to fetch moon data:", error);
    throw error;
  }
};
