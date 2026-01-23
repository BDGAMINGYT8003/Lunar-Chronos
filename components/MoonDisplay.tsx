import React, { useState, useEffect } from 'react';
import { MoonDataResponse } from '../types';
import { Loader2 } from 'lucide-react';

interface MoonDisplayProps {
  data: MoonDataResponse | null;
  loading: boolean;
  isSouthUp: boolean;
  isHighRes: boolean;
  theme: 'dark' | 'light';
}

const MoonDisplay: React.FC<MoonDisplayProps> = ({
  data,
  loading,
  isSouthUp,
  isHighRes,
  theme
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Determine which image URL to use
  const getImageUrl = () => {
    if (!data) return '';
    if (isSouthUp) {
      return isHighRes && data.su_image_highres ? data.su_image_highres.url : data.su_image?.url || data.image.url;
    }
    return isHighRes && data.image_highres ? data.image_highres.url : data.image.url;
  };

  const currentUrl = getImageUrl();

  // Reset loaded state when URL changes
  useEffect(() => {
    setImageLoaded(false);
  }, [currentUrl]);

  return (
    <div className={`relative w-full h-full flex items-center justify-center`}>
      
      {/* Loading Spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <Loader2 className={`w-12 h-12 animate-spin ${theme === 'dark' ? 'text-blue-400' : 'text-slate-600'}`} />
        </div>
      )}

      {/* The Moon Image */}
      {data && (
        <img
          src={currentUrl}
          alt={data.image.alt_text}
          style={{
             // Mask the image to a circle to hide the black square corners of the JPEG.
             // This removes the "container" box effect while preserving the moon itself.
             WebkitMaskImage: 'radial-gradient(circle, black 49%, transparent 50%)',
             maskImage: 'radial-gradient(circle, black 49%, transparent 50%)',
          }}
          className={`
            relative z-0 max-w-full max-h-full object-contain transition-all duration-700
            ${theme === 'dark' ? 'mix-blend-screen' : ''} 
            ${loading ? 'opacity-50 blur-sm scale-95' : 'opacity-100 blur-0 scale-100'}
          `}
          onLoad={() => setImageLoaded(true)}
        />
      )}
    </div>
  );
};

export default MoonDisplay;