import React from 'react';
import { 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  SkipBack, 
  SkipForward,
  Calendar
} from 'lucide-react';
import { AppState } from '../types';

interface ControlPanelProps {
  currentDate: Date;
  isPlaying: boolean;
  theme: 'dark' | 'light';
  onDateChange: (date: Date) => void;
  onTogglePlay: () => void;
  onAdjustTime: (amount: number, unit: 'hours' | 'days') => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  currentDate,
  isPlaying,
  theme,
  onDateChange,
  onTogglePlay,
  onAdjustTime
}) => {

  // Helper to format date for input (YYYY-MM-DDTHH:MM) in LOCAL time
  const toInputFormat = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if(!val) return;
    // Parse as local time string (default behavior of new Date() with ISO-like without Z)
    const d = new Date(val);
    onDateChange(d);
  };

  const btnBase = `p-3 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center`;
  const btnTheme = theme === 'dark' 
    ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700' 
    : 'bg-white text-slate-700 hover:bg-gray-50 hover:text-indigo-600 border border-gray-200 shadow-sm';
  const btnPrimary = theme === 'dark'
    ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_15px_-3px_rgba(37,99,235,0.4)]'
    : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-200';

  return (
    <div className={`w-full p-4 md:p-6 rounded-2xl backdrop-blur-xl border ${theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white/60 border-white shadow-xl shadow-slate-200/50'}`}>
      
      {/* Top Row: Date Picker & Main Label */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4 md:mb-6">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Calendar className={`w-5 h-5 ${theme === 'dark' ? 'text-blue-400' : 'text-indigo-500'}`} />
          <div className="flex flex-col">
            <label className={`text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Target Time (Device Local)</label>
            <input
              type="datetime-local"
              value={toInputFormat(currentDate)}
              onChange={handleInputChange}
              className={`bg-transparent font-display text-xl font-bold outline-none cursor-pointer ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
            <span className={`text-xs font-mono text-right ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
                {currentDate.toLocaleString([], { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric', 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true,
                    timeZoneName: 'short'
                })}
            </span>
        </div>
      </div>

      {/* Bottom Row: Playback Controls */}
      <div className="flex items-center justify-between gap-2 md:gap-4">
        
        {/* Step Backward Group */}
        <div className="flex gap-2">
          <button 
            className={`${btnBase} ${btnTheme}`} 
            onClick={() => onAdjustTime(-1, 'days')}
            title="-1 Day"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button 
            className={`${btnBase} ${btnTheme}`} 
            onClick={() => onAdjustTime(-1, 'hours')}
            title="-1 Hour"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Play/Pause Main Action */}
        <button 
          className={`${btnBase} ${btnPrimary} w-16 h-16 rounded-full !p-0`}
          onClick={onTogglePlay}
        >
          {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
        </button>

        {/* Step Forward Group */}
        <div className="flex gap-2">
          <button 
            className={`${btnBase} ${btnTheme}`} 
            onClick={() => onAdjustTime(1, 'hours')}
            title="+1 Hour"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button 
            className={`${btnBase} ${btnTheme}`} 
            onClick={() => onAdjustTime(1, 'days')}
            title="+1 Day"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default ControlPanel;