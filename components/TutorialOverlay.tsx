import React, { useState, useEffect } from 'react';

const TutorialOverlay: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem('etherbagua_tutorial_seen');
    if (!hasSeen) {
      setShouldRender(true);
      setTimeout(() => setIsVisible(true), 100);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('etherbagua_tutorial_seen', 'true');
    setTimeout(() => setShouldRender(false), 500);
  };

  if (!shouldRender) return null;

  return (
    <div 
      className={`absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      <style>{`
        @keyframes pan-hand { 0%, 100% { transform: translateX(-25%); } 50% { transform: translateX(25%); } }
        @keyframes swirl-hand { from { transform: rotate(0deg) translateX(4px) rotate(0deg); } to { transform: rotate(360deg) translateX(4px) rotate(-360deg); } }
        @keyframes ripple-out { 0% { transform: scale(0.8); opacity: 0.8; border-width: 2px; } 100% { transform: scale(1.6); opacity: 0; border-width: 0px; } }
        @keyframes ripple-in { 0% { transform: scale(1.6); opacity: 0; border-width: 0px; } 100% { transform: scale(0.8); opacity: 0.8; border-width: 2px; } }
      `}</style>
      <div className="max-w-4xl w-full mx-4 relative">
        <div className="bg-[#0a0a0a] border border-gray-800 rounded-2xl p-8 shadow-[0_0_50px_rgba(79,70,229,0.15)] overflow-hidden relative">
            
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-rose-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="text-center mb-8 relative z-10">
                <h1 className="text-3xl md:text-4xl font-serif text-white mb-2 tracking-wide">
                    Ether<span className="text-indigo-400">Bagua</span>
                </h1>
                <p className="text-gray-400 text-sm md:text-base font-light tracking-wide">
                    Master the elements through gesture control
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 relative z-10">
                <GestureCard type="rotate" title="Pan & Rotate" description="Move hand to rotate." color="text-emerald-400" borderColor="border-emerald-500/20" />
                <GestureCard type="swirl" title="Swirl" description="Point to create flow." color="text-cyan-400" borderColor="border-cyan-500/20" />
                <GestureCard type="expand" title="Expand" description="Open palm to scatter." color="text-blue-400" borderColor="border-blue-500/20" />
                <GestureCard type="focus" title="Focus" description="Fist to condense." color="text-rose-400" borderColor="border-rose-500/20" />
            </div>

            <div className="flex justify-center relative z-10">
                <button 
                    onClick={handleDismiss}
                    className="group relative px-8 py-3 bg-white text-black font-medium text-sm tracking-widest uppercase rounded hover:bg-gray-200 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                >
                    Enter the Void
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

interface GestureCardProps {
    type: 'rotate' | 'swirl' | 'expand' | 'focus';
    title: string;
    description: string;
    color: string;
    borderColor: string;
}

const GestureCard: React.FC<GestureCardProps> = ({ type, title, description, color, borderColor }) => (
    <div className={`flex items-start gap-4 p-4 rounded-xl bg-white/5 border ${borderColor} hover:bg-white/10 transition-colors`}>
        <div className="bg-black/30 w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-lg shadow-inner overflow-hidden">
            <GestureVisual type={type} color={color} />
        </div>
        <div>
            <h3 className={`font-bold text-sm uppercase tracking-wider mb-1 ${color}`}>
                {title}
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed">
                {description}
            </p>
        </div>
    </div>
);

const GestureVisual: React.FC<{ type: string; color: string }> = ({ type, color }) => {
    const borderClass = color.replace('text', 'border');
    switch (type) {
        case 'rotate': return (<div className="relative w-full h-full flex items-center justify-center"><div className="text-2xl animate-[pan-hand_2s_ease-in-out_infinite] select-none">👋</div></div>);
        case 'swirl': return (<div className="relative w-full h-full flex items-center justify-center"><div className="text-2xl animate-[swirl-hand_2s_linear_infinite] select-none origin-center">☝</div></div>);
        case 'expand': return (<div className="relative w-full h-full flex items-center justify-center"><div className={`absolute inset-0 m-auto w-8 h-8 rounded-full border-2 ${borderClass} animate-[ripple-out_2s_ease-out_infinite]`} /><div className="text-2xl relative z-10 select-none">🖐</div></div>);
        case 'focus': return (<div className="relative w-full h-full flex items-center justify-center"><div className={`absolute inset-0 m-auto w-8 h-8 rounded-full border-2 ${borderClass} animate-[ripple-in_2s_ease-out_infinite]`} /><div className="text-2xl relative z-10 select-none">✊</div></div>);
        default: return null;
    }
};

export default TutorialOverlay;