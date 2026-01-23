import React from 'react';
import { MoonDataResponse, LocalMoonData } from '../types';
import { 
  Ruler, 
  Orbit, 
  Circle, 
  Clock, 
  Globe2, 
  Sun,
  MapPin,
  Move,
  Compass,
  Navigation,
  Database,
  Eye,
  Activity,
  ArrowUpCircle,
  ArrowDownCircle,
  RotateCw
} from 'lucide-react';

interface DataGridProps {
  data: MoonDataResponse | null;
  localData: LocalMoonData | null;
  theme: 'dark' | 'light';
  topocentricDistance?: number | null;
  userLocation?: { lat: number, lon: number } | null;
  distanceSource?: 'JPL' | 'Calc' | 'Geo';
}

interface DataCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  theme: 'dark' | 'light';
  subtext?: string;
  highlight?: boolean;
  className?: string; // Allow custom grid spanning
}

const DataCard: React.FC<DataCardProps> = ({ 
  label, 
  value, 
  unit, 
  icon, 
  theme, 
  subtext, 
  highlight,
  className = ""
}) => {
  return (
    <div className={`
      relative overflow-hidden flex flex-col justify-between
      rounded-[1.5rem] border backdrop-blur-xl transition-all duration-300 group
      ${theme === 'dark' 
         ? 'bg-slate-900/40 border-slate-800/60 hover:bg-slate-800/60 shadow-lg shadow-black/20' 
         : 'bg-white/60 border-white/50 shadow-sm hover:bg-white/80 hover:shadow-md hover:shadow-indigo-100'}
      ${highlight ? (theme === 'dark' ? 'ring-1 ring-blue-500/40 bg-blue-900/10' : 'ring-1 ring-indigo-500/40 bg-indigo-50/60') : ''}
      p-4 md:p-5 gap-4
      ${className}
    `}>
      
      {/* Ambient Glow for Highlighted Cards */}
      {highlight && (
        <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl opacity-20 pointer-events-none transition-opacity duration-500 group-hover:opacity-30 ${theme === 'dark' ? 'bg-blue-400' : 'bg-indigo-400'}`} />
      )}

      {/* Header: Icon & Category Badge */}
      <div className="flex items-start justify-between mb-1 gap-2">
          <div className={`
            p-2.5 rounded-2xl transition-colors duration-300 shrink-0
            ${theme === 'dark' 
              ? 'bg-slate-800 text-blue-400 group-hover:bg-slate-700' 
              : 'bg-white text-indigo-500 shadow-sm group-hover:text-indigo-600'}
          `}>
            {React.cloneElement(icon as React.ReactElement, { size: 18, strokeWidth: 2 })}
          </div>
          
          {subtext && (
             <div className={`
               text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg whitespace-nowrap
               ${theme === 'dark' 
                 ? 'text-slate-400 bg-slate-800/50' 
                 : 'text-slate-500 bg-slate-100/80 border border-slate-200/50'}
             `}>
                {subtext}
             </div>
          )}
      </div>

      {/* Main Value Display */}
      <div className="flex flex-col z-10">
         <div className={`
           font-display font-bold tracking-tight tabular-nums leading-none break-all
           ${typeof value === 'string' && value.length > 8 ? 'text-xl md:text-2xl' : 'text-3xl md:text-4xl'}
           ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}
         `}>
            {typeof value === 'number' ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : value}
            {unit && <span className="text-base font-medium opacity-50 ml-1 align-baseline">{unit}</span>}
         </div>
      </div>

      {/* Footer: Detailed Description - No truncation */}
      <div className={`
        text-xs leading-relaxed font-medium
        ${theme === 'dark' ? 'text-slate-500 group-hover:text-slate-400' : 'text-slate-500 group-hover:text-slate-600'}
      `}>
        {label}
      </div>
    </div>
  );
};

const DataGrid: React.FC<DataGridProps> = ({ data, localData, theme, topocentricDistance, userLocation, distanceSource }) => {
  if (!data) return null;

  // Use topocentric distance if available, otherwise fall back to geocentric
  const distanceValue = topocentricDistance || data.distance;
  
  let distLabel = "Distance from Earth's center to Moon";
  let distSub = "Range";
  
  if (distanceSource === 'JPL') {
      distLabel = "Exact distance between you and the Moon";
      distSub = "Real-time";
  } else if (distanceSource === 'Calc') {
      distLabel = "Estimated distance between you and the Moon";
      distSub = "Topocentric";
  }

  // Format Time Helper - Strict 12h AM/PM
  const formatTime = (date?: Date) => {
    if (!date) return '--:--';
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 w-full">
      
      {/* --- 1. HERO: ILLUMINATION (Full Width on Mobile) --- */}
      <DataCard 
        className="col-span-2"
        label="Percentage of the lunar surface currently illuminated by the Sun" 
        value={data.phase.toFixed(2)} 
        unit="%" 
        icon={<Circle />} 
        theme={theme}
        subtext="Phase"
        highlight
      />

      {/* --- 2. PRIORITY: DISTANCE (Full Width on Mobile) --- */}
      <DataCard 
        className="col-span-2 md:col-span-1"
        label={distLabel}
        value={distanceValue.toFixed(1)} 
        unit="km" 
        icon={<Orbit />} 
        theme={theme}
        subtext={distSub}
        highlight={distanceSource === 'JPL'}
      />

      {/* --- 3. LOCAL OBSERVATIONAL DATA --- */}
      {localData && (
        <>
            <DataCard 
              label="Time the Moon appears above the horizon"
              value={localData.alwaysUp ? "Always Up" : localData.alwaysDown ? "Down" : formatTime(localData.rise)}
              icon={<ArrowUpCircle />}
              theme={theme}
              subtext="Moonrise"
              highlight={true}
            />
            
            <DataCard 
              label="Time the Moon disappears below the horizon"
              value={localData.alwaysUp ? "Always Up" : localData.alwaysDown ? "Down" : formatTime(localData.set)}
              icon={<ArrowDownCircle />}
              theme={theme}
              subtext="Moonset"
              highlight={true}
            />

            <DataCard 
              label="Compass direction (0°=N, 90°=E)"
              value={localData.azimuth.toFixed(1)}
              unit="°"
              icon={<Compass />}
              theme={theme}
              subtext="Azimuth"
              highlight={true}
            />

            <DataCard 
              label="Vertical height above the horizon"
              value={localData.altitude.toFixed(1)}
              unit="°"
              icon={<Navigation />}
              theme={theme}
              subtext="Altitude"
              highlight={true}
            />

            <DataCard 
              label="Angle of the Moon's disk relative to horizon"
              value={localData.parallacticAngle.toFixed(1)}
              unit="°"
              icon={<RotateCw />}
              theme={theme}
              subtext="Parallactic"
            />
        </>
      )}

      {/* --- 4. PHYSICAL PROPERTIES --- */}
      <DataCard 
        label="Your current coordinates" 
        value={userLocation ? `${userLocation.lat.toFixed(2)}°, ${userLocation.lon.toFixed(2)}°` : 'Geocentric'} 
        icon={<MapPin />} 
        theme={theme}
        subtext={userLocation ? "GPS" : "Ref"}
      />
      
      <DataCard 
        label="Angular size in sky" 
        value={data.diameter.toFixed(2)} 
        unit="″" 
        icon={<Ruler />} 
        theme={theme}
        subtext="Diameter"
      />
      
      <DataCard 
        label="Days since New Moon" 
        value={data.age.toFixed(2)} 
        unit="d" 
        icon={<Clock />} 
        theme={theme}
        subtext="Age"
      />

      <DataCard 
        label="Subsolar Point" 
        value={`${data.subsolar_lat.toFixed(1)}°, ${data.subsolar_lon.toFixed(1)}°`} 
        icon={<Sun />} 
        theme={theme}
        subtext="Subsolar"
      />

      <DataCard 
        label="North Pole Position Angle" 
        value={data.posangle.toFixed(1)} 
        unit="°" 
        icon={<Compass />} 
        theme={theme}
        subtext="Tilt"
      />

       <DataCard 
        label="RA / Dec (J2000)" 
        value={`${data.j2000_ra.toFixed(1)}h ${data.j2000_dec.toFixed(1)}°`} 
        icon={<Move />} 
        theme={theme}
        subtext="Celestial"
      />

      <DataCard 
        label="Libration (Wobble)" 
        value={`${data.subearth_lat.toFixed(1)}°, ${data.subearth_lon.toFixed(1)}°`} 
        icon={<Activity />} 
        theme={theme}
        subtext="Libration"
      />

      <DataCard 
        label="Umbral Obscuration" 
        value={`${(data.obscuration * 100).toFixed(1)}%`} 
        icon={<Eye />} 
        theme={theme}
        subtext="Eclipse"
      />
    </div>
  );
};

export default DataGrid;