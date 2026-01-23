import SunCalc from 'suncalc';
import { LocalMoonData } from '../types';

/**
 * Calculates local moon data (Rise, Set, Azimuth, Altitude) for a specific user location.
 * Wrapper around 'suncalc' library.
 * 
 * @param date The date to calculate for
 * @param lat Latitude in decimal degrees
 * @param lon Longitude in decimal degrees
 * @returns LocalMoonData object
 */
export const getLocalMoonData = (date: Date, lat: number, lon: number): LocalMoonData => {
  // SunCalc.getMoonPosition returns radians.
  const position = SunCalc.getMoonPosition(date, lat, lon);
  
  // SunCalc.getMoonTimes returns times for the given date.
  const times = SunCalc.getMoonTimes(date, lat, lon);

  // Convert Azimuth from SunCalc format (0=South, increasing West) to Standard Compass (0=North, increasing East)
  // SunCalc: 0=S (180), PI/2=W (270), PI=N (0), -PI/2=E (90)
  // Formula: (SunCalcDegrees + 180) % 360
  const azimuthRad = position.azimuth;
  const azimuthDeg = (azimuthRad * 180) / Math.PI;
  const standardAzimuth = (azimuthDeg + 180) % 360;

  // Altitude is radians above horizon
  const altitudeDeg = (position.altitude * 180) / Math.PI;

  // Parallactic angle
  const parallacticDeg = (position.parallacticAngle * 180) / Math.PI;

  return {
    azimuth: standardAzimuth, 
    altitude: altitudeDeg,
    distance: position.distance,
    parallacticAngle: parallacticDeg,
    rise: times.rise,
    set: times.set,
    alwaysUp: times.alwaysUp,
    alwaysDown: times.alwaysDown
  };
};