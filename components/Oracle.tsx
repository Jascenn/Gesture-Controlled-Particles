
import React, { useState } from 'react';
import { useInteraction } from '../context/InteractionContext';
import { useLanguage } from '../context/LanguageContext';
import { TRIGRAMS } from '../types';
import { getTrigramInterpretation } from '../services/geminiService';

const Oracle: React.FC = () => {
  const { activeTrigramIndex } = useInteraction();
  const { t } = useLanguage();
  const [reading, setReading] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  // Ensure index is valid and positive
  const safeIndex = Math.abs(activeTrigramIndex % 8);
  const currentTrigram = TRIGRAMS[safeIndex] || TRIGRAMS[0];

  const handleDivination = async () => {
    setLoading(true);
    setReading(null);
    try {
      const result = await getTrigramInterpretation(currentTrigram);
      setReading(result);
    } catch (error) {
      setReading(t('oraclePlaceholder'));
    }
    setLoading(false);
  };

  return (
    <>
      {/* Toggle Button (Visible when closed) */}
      <div 
        className={`absolute left-0 top-1/2 -translate-y-1/2 z-40 transition-all duration-500 ${!isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="bg-black/40 hover:bg-indigo-900/40 text-white p-3 rounded-r-xl border border-l-0 border-gray-700 backdrop-blur-sm transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)] group"
        >
          <span className="block text-xl group-hover:translate-x-0.5 transition-transform">›</span>
        </button>
      </div>

      {/* Main Oracle Panel */}
      <div 
        className={`absolute left-4 top-1/2 -translate-y-1/2 w-80 max-w-[calc(100vw-2rem)] transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) z-40 ${
          isOpen ? 'translate-x-0 opacity-100' : '-translate-x-[120%] opacity-0'
        }`}
      >
        <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-gray-800 p-6 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
          
          {/* Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

          {/* Close Button */}
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors p-1 rounded-full hover:bg-white/5"
            aria-label="Close Oracle"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>

          {/* Header Section */}
          <div className="relative z-10 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-5xl font-bold text-white tracking-widest font-serif drop-shadow-md mb-1">
                  {currentTrigram.chinese}
                </h2>
                <h3 className="text-lg text-indigo-300 font-medium tracking-wide">{currentTrigram.name}</h3>
              </div>
              <div className="flex flex-col items-end pt-1 gap-1">
                 <span className="text-[10px] text-gray-500 uppercase tracking-widest">{t('energy')}</span>
                 <div className="flex gap-2 text-xs">
                    <span 
                        className="font-medium px-2 py-1 bg-white/5 rounded border border-white/5"
                        style={{ color: currentTrigram.color }}
                    >
                        {currentTrigram.element}
                    </span>
                    <span className="text-gray-400 px-2 py-1 bg-white/5 rounded border border-white/5">
                        {currentTrigram.animal}
                    </span>
                 </div>
              </div>
            </div>
          </div>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent mb-5" />

          {/* Content Section */}
          <div className="relative z-10 space-y-5">
            <div className="min-h-[3rem] flex items-center justify-center">
              <p className="text-gray-300 italic text-sm text-center leading-relaxed">
                "{currentTrigram.meaning}"
              </p>
            </div>
            
            <button
              onClick={handleDivination}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-900/80 to-purple-900/80 hover:from-indigo-800 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 text-white rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-indigo-500/20 group"
            >
               {loading ? (
                   <div className="flex items-center gap-1.5">
                     <span className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-[bounce_1s_infinite_0ms]"></span>
                     <span className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-[bounce_1s_infinite_200ms]"></span>
                     <span className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-[bounce_1s_infinite_400ms]"></span>
                   </div>
               ) : (
                   <>
                      <span className="font-medium tracking-wide text-sm">{t('consult')}</span>
                      <svg className="w-4 h-4 text-indigo-300 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                   </>
               )}
            </button>

            {/* Reading Result */}
            {reading && (
              <div className="mt-4 p-4 bg-black/40 rounded-lg border border-indigo-500/20 shadow-inner animate-[fadeIn_0.5s_ease-out]">
                <p className="text-sm text-indigo-100 font-serif leading-7 border-l-2 border-indigo-500 pl-3 italic">
                  {reading}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Oracle;
