import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MoonDataResponse, LocalMoonData } from './types';
import { fetchMoonData } from './services/moonApi';
import { fetchJPLDistance } from './services/jplApi';
import { getLocalMoonData } from './services/sunCalcApi';
import MoonDisplay from './components/MoonDisplay';
import DataGrid from './components/DataGrid';
import ControlPanel from './components/ControlPanel';
import { useGeolocation } from './hooks/useGeolocation';
import { calculateTopocentricDistance } from './utils/astronomy';
import { Moon, Sun, Info, Compass, Maximize2, Minimize2, ArrowDown, History, MapPin, Radio } from 'lucide-react';

// Default start date (current date)
const INITIAL_DATE = new Date();

function App() {
  const [currentDate, setCurrentDate] = useState<Date>(INITIAL_DATE);
  const [data, setData] = useState<MoonDataResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSouthUp, setIsSouthUp] = useState<boolean>(false);
  const [isHighRes, setIsHighRes] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // JPL Data State
  const [jplDistance, setJplDistance] = useState<number | null>(null);
  const [loadingJPL, setLoadingJPL] = useState(false);

  // Geolocation for accurate distance
  const { latitude, longitude, altitude, error: geoError } = useGeolocation(30000); // 30s update

  // Animation frame reference for playback
  const playbackRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const PLAYBACK_SPEED_MS = 100; // Time between updates in playback mode

  // Fetch data function (NASA API)
  const loadData = useCallback(async (date: Date) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchMoonData(date);
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch moon data');
      if (isPlaying) setIsPlaying(false);
    } finally {
      setLoading(false);
    }
  }, [isPlaying]);

  // Initial load
  useEffect(() => {
    loadData(currentDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch JPL Data when location or time changes
  useEffect(() => {
      const fetchJPL = async () => {
          if (latitude !== null && longitude !== null && altitude !== null) {
              setLoadingJPL(true);
              const dist = await fetchJPLDistance(currentDate, latitude, longitude, altitude);
              if (dist) {
                  setJplDistance(dist);
              }
              setLoadingJPL(false);
          }
      };
      
      // Debounce slightly to avoid rapid firing during play
      const timeout = setTimeout(fetchJPL, 500);
      return () => clearTimeout(timeout);
  }, [latitude, longitude, altitude, currentDate]);

  // Calculate Local Data (SunCalc) in Parallel
  // This runs synchronously but is separated from the network calls
  const localMoonData = useMemo<LocalMoonData | null>(() => {
    if (latitude === null || longitude === null) return null;
    return getLocalMoonData(currentDate, latitude, longitude);
  }, [currentDate, latitude, longitude]);

  // Playback Loop
  useEffect(() => {
    if (!isPlaying) {
      if (playbackRef.current) {
        cancelAnimationFrame(playbackRef.current);
        playbackRef.current = null;
      }
      return;
    }

    const animate = (timestamp: number) => {
      if (timestamp - lastFrameTimeRef.current >= PLAYBACK_SPEED_MS) {
        setCurrentDate(prev => {
          const next = new Date(prev);
          next.setHours(next.getHours() + 1);
          return next;
        });
        lastFrameTimeRef.current = timestamp;
      }
      playbackRef.current = requestAnimationFrame(animate);
    };

    playbackRef.current = requestAnimationFrame(animate);

    return () => {
      if (playbackRef.current) cancelAnimationFrame(playbackRef.current);
    };
  }, [isPlaying]);

  // React to date changes
  useEffect(() => {
    if (isPlaying && loading) return; 
    loadData(currentDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  const handleAdjustTime = (amount: number, unit: 'hours' | 'days') => {
    const newDate = new Date(currentDate);
    if (unit === 'hours') newDate.setHours(newDate.getHours() + amount);
    if (unit === 'days') newDate.setDate(newDate.getDate() + amount);
    setCurrentDate(newDate);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Determine Distance Source and Value
  const distanceInfo = useMemo(() => {
      if (jplDistance) {
          return { value: jplDistance, source: 'JPL' as const };
      }
      // Fallback to local calculation if JPL fails/loading but we have coords
      if (data && latitude !== null && longitude !== null) {
          const calc = calculateTopocentricDistance(
            data.distance,
            data.j2000_ra,
            data.j2000_dec,
            latitude,
            longitude,
            altitude || 0,
            currentDate
          );
          return { value: calc, source: 'Calc' as const };
      }
      return { value: data?.distance, source: 'Geo' as const };
  }, [jplDistance, data, latitude, longitude, altitude, currentDate]);

  return (
    <div className={`min-h-screen w-full transition-colors duration-500 overflow-x-hidden relative selection:bg-blue-500/30 ${theme === 'dark' ? 'bg-moon-dark text-slate-200 bg-[url("https://www.transparenttextures.com/patterns/stardust.png")]' : 'bg-moon-light text-slate-800'}`}>
      
      {/* Background Stars (Dark Mode Only) */}
      {theme === 'dark' && (
        <div className="fixed inset-0 bg-stars opacity-30 pointer-events-none animate-[pulse_8s_infinite]"></div>
      )}

      {/* Header - Fixed & Minimal */}
      <header className="fixed top-0 w-full z-50 px-6 py-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto backdrop-blur-md bg-black/10 p-2 rounded-full border border-white/5">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-indigo-600 text-white'}`}>
            <Moon className="w-5 h-5 fill-current" />
          </div>
          <h1 className={`font-display text-lg font-bold tracking-tight pr-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
            Lunar<span className={theme === 'dark' ? 'text-blue-400' : 'text-indigo-600'}>Chronos</span>
          </h1>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
            {latitude !== null && (
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md border transition-colors duration-500 ${
                    loadingJPL 
                    ? (theme === 'dark' ? 'bg-yellow-900/30 border-yellow-800 text-yellow-200' : 'bg-yellow-100/50 border-yellow-200 text-yellow-700')
                    : (theme === 'dark' ? 'bg-blue-900/30 border-blue-800 text-blue-200' : 'bg-indigo-100/50 border-indigo-200 text-indigo-700')
                }`}>
                    {loadingJPL ? <Radio className="w-3 h-3 animate-ping" /> : <MapPin className="w-3 h-3" />}
                    <span className="hidden md:inline">{loadingJPL ? 'JPL SYNC...' : 'LOC ACTIVE'}</span>
                </div>
            )}
            <button 
                onClick={toggleTheme}
                className={`p-2 rounded-full transition-all backdrop-blur-md border ${theme === 'dark' ? 'bg-slate-900/50 border-slate-700 text-yellow-300 hover:bg-slate-800' : 'bg-white/50 border-white/50 text-slate-600 hover:bg-white'}`}
            >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
        </div>
      </header>

      {/* LUNAR THEATER - Fixed Background Layer */}
      {/* Increased max-width and height to make Moon significantly bigger. Reduced top padding slightly to utilize space. */}
      <div className="fixed inset-0 z-0 flex flex-col items-center pt-20 md:pt-24 pointer-events-none">
         <div className="w-full max-w-2xl h-[55vh] md:h-[65vh] px-4 relative flex items-center justify-center">
            <MoonDisplay 
                data={data}
                loading={loading}
                isSouthUp={isSouthUp}
                isHighRes={isHighRes}
                theme={theme}
            />
         </div>
      </div>

      {/* MISSION CONTROL - Scrollable Content Layer */}
      <div className="relative z-10 w-full flex flex-col min-h-screen">
          
          {/* Spacer increased dramatically to ensure panel starts well below the larger moon */}
          <div className="h-[65vh] md:h-[75vh] w-full shrink-0" />

          {/* Glassmorphism Dashboard Panel */}
          <div className={`
             flex-1 w-full rounded-t-[2.5rem] shadow-[0_-20px_60px_-15px_rgba(0,0,0,0.3)] border-t backdrop-blur-2xl
             transition-all duration-500
             ${theme === 'dark' 
                ? 'bg-slate-950/80 border-slate-800 shadow-black/50' 
                : 'bg-white/80 border-white/50 shadow-indigo-100/50'}
          `}>
              <div className="max-w-5xl mx-auto px-6 py-6 md:py-8 flex flex-col gap-8 min-h-[60vh]">
                  
                  {/* Dashboard Header: Title, Time, Visual Toggles */}
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-dashed border-opacity-20 border-gray-400">
                      <div className="text-center md:text-left">
                           <div className="flex items-baseline gap-3 justify-center md:justify-start">
                                <h2 className={`font-display text-4xl md:text-5xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                                    {data ? `${data.phase.toFixed(1)}%` : '--%'}
                                </h2>
                                <span className={`text-sm font-medium uppercase tracking-widest ${theme === 'dark' ? 'text-blue-400' : 'text-indigo-500'}`}>
                                    Illumination
                                </span>
                           </div>
                           <p className={`mt-1 text-lg font-mono ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                                {data?.time 
                                    ? new Date(data.time + (data.time.endsWith('Z') ? '' : 'Z')).toLocaleString([], { 
                                        year: 'numeric', 
                                        month: 'short', 
                                        day: 'numeric', 
                                        hour: 'numeric', 
                                        minute: '2-digit', 
                                        hour12: true, 
                                        timeZoneName: 'short' 
                                      }) 
                                    : 'Synchronizing...'}
                           </p>
                      </div>

                      {/* View Controls */}
                      <div className="flex items-center gap-3">
                           <button
                              onClick={() => setIsSouthUp(!isSouthUp)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                  theme === 'dark' 
                                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' 
                                  : 'bg-white hover:bg-slate-50 text-slate-700 shadow-sm border border-gray-200'
                              }`}
                           >
                              <Compass className={`w-4 h-4 transition-transform duration-500 ${isSouthUp ? 'rotate-180 text-blue-400' : ''}`} />
                              <span>{isSouthUp ? 'South Up' : 'North Up'}</span>
                           </button>
                           <button
                              onClick={() => setIsHighRes(!isHighRes)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                  theme === 'dark' 
                                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' 
                                  : 'bg-white hover:bg-slate-50 text-slate-700 shadow-sm border border-gray-200'
                              }`}
                           >
                              {isHighRes ? <Minimize2 className="w-4 h-4 text-blue-400" /> : <Maximize2 className="w-4 h-4" />}
                              <span>{isHighRes ? 'SD' : 'HD'}</span>
                           </button>
                      </div>
                  </div>

                  {/* Error Display */}
                  {error && (
                    <div className="w-full p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-center font-medium backdrop-blur-sm">
                        ⚠️ {error}
                    </div>
                  )}

                  {/* Scientific Data Grid */}
                  <div className="space-y-4">
                      <div className="flex items-center gap-2 opacity-60">
                          <Info className="w-4 h-4" />
                          <h3 className="text-xs font-bold uppercase tracking-wider">Telemetry</h3>
                      </div>
                      <DataGrid 
                        data={data} 
                        localData={localMoonData}
                        theme={theme} 
                        topocentricDistance={distanceInfo.value}
                        distanceSource={distanceInfo.source}
                        userLocation={latitude && longitude ? { lat: latitude, lon: longitude } : null}
                      />
                  </div>

                   {/* Main Control Panel */}
                   <div className="space-y-4">
                       <div className="flex items-center gap-2 opacity-60">
                          <History className="w-4 h-4" />
                          <h3 className="text-xs font-bold uppercase tracking-wider">Time Travel</h3>
                      </div>
                      <ControlPanel 
                          currentDate={currentDate}
                          isPlaying={isPlaying}
                          theme={theme}
                          onDateChange={setCurrentDate}
                          onTogglePlay={() => setIsPlaying(p => !p)}
                          onAdjustTime={handleAdjustTime}
                      />
                   </div>

                  {/* Footer */}
                  <footer className={`pt-8 pb-8 text-center text-xs opacity-50 hover:opacity-100 transition-opacity ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                      <p>NASA Dial-A-Moon API • Scientific Visualization Studio</p>
                      <p className="mt-1">Goddard Space Flight Center • JPL Horizons On-Line Ephemeris System • SunCalc</p>
                  </footer>

              </div>
          </div>
      </div>
    </div>
  );
}

export default App;