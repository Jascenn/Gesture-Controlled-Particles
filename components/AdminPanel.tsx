
import React from 'react';
import { useInteraction } from '../context/InteractionContext';
import { useLanguage } from '../context/LanguageContext';
import { HandGesture } from '../types';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const { t, tGesture } = useLanguage();
  const { setHandState } = useInteraction();

  if (!isOpen) return null;

  const forceGesture = (g: HandGesture) => {
    setHandState({
        detected: true,
        x: 0.5,
        y: 0.5,
        gesture: g
    });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-end pointer-events-none">
        <div className="w-80 h-full bg-[#111] border-l border-gray-800 shadow-2xl pointer-events-auto overflow-y-auto transform transition-transform duration-300 ease-out">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                <h2 className="text-lg font-mono font-bold text-rose-500 flex items-center gap-2">
                    <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
                    {t('adminPanel')}
                </h2>
                <button onClick={onClose} className="text-gray-500 hover:text-white">&times;</button>
            </div>

            <div className="p-4 space-y-6">
                {/* Section 1: God Mode */}
                <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">{t('forceGesture')}</h3>
                    <div className="grid grid-cols-2 gap-2">
                        {Object.values(HandGesture).filter(g => g !== 'NONE').map((g) => (
                            <button
                                key={g}
                                onClick={() => forceGesture(g)}
                                className="px-2 py-1.5 bg-gray-800 hover:bg-rose-900/30 border border-gray-700 hover:border-rose-500/50 rounded text-[10px] text-gray-300 text-left transition-colors"
                            >
                                {tGesture(g)}
                            </button>
                        ))}
                         <button
                                onClick={() => setHandState({ detected: false, x:0, y:0, gesture: HandGesture.NONE })}
                                className="col-span-2 px-2 py-1.5 bg-red-900/20 hover:bg-red-900/40 border border-red-800/50 rounded text-[10px] text-red-300 text-center uppercase font-bold transition-colors"
                            >
                                RESET STATE
                        </button>
                    </div>
                </div>

                {/* Section 2: Stats (Mockup for now) */}
                <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">System Stats</h3>
                    <div className="space-y-2 font-mono text-xs text-gray-400">
                        <div className="flex justify-between">
                            <span>Particles:</span>
                            <span className="text-white">7000</span>
                        </div>
                         <div className="flex justify-between">
                            <span>Resolution:</span>
                            <span className="text-white">{window.innerWidth}x{window.innerHeight}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>WebGL:</span>
                            <span className="text-green-400">Active</span>
                        </div>
                    </div>
                </div>

                 <div className="pt-4 border-t border-gray-800">
                    <p className="text-[10px] text-gray-600 text-center">
                        EtherBagua DevBuild v1.0.4
                    </p>
                 </div>
            </div>
        </div>
    </div>
  );
};

export default AdminPanel;
