
import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { HandGesture } from '../types';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const { t, tGesture, language, setLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState<'intro' | 'gestures' | 'trouble'>('intro');

  if (!isOpen) return null;

  const gesturesList = [
      { id: HandGesture.OPEN_PALM, icon: "🖐" },
      { id: HandGesture.CLOSED_FIST, icon: "✊" },
      { id: HandGesture.POINTING, icon: "☝" },
      { id: HandGesture.PINCH, icon: "🤏" },
      { id: HandGesture.SWORD, icon: "☯️" },
      { id: HandGesture.LOVE, icon: "🤟" },
      { id: HandGesture.VULCAN, icon: "🖖" },
      { id: HandGesture.ROCK, icon: "🤘" },
      { id: HandGesture.OK_SIGN, icon: "👌" },
      { id: HandGesture.CLAW, icon: "🔮" },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl bg-[#0f172a] border border-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700 bg-gray-900/50">
            <h2 className="text-2xl font-serif font-bold text-white">{t('help')}</h2>
            <div className="flex items-center gap-4">
                {/* Language Switcher */}
                <div className="flex bg-gray-800 rounded-lg p-1">
                    <button 
                        onClick={() => setLanguage('en')}
                        className={`px-3 py-1 rounded text-xs font-bold transition-colors ${language === 'en' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        EN
                    </button>
                    <button 
                         onClick={() => setLanguage('zh')}
                        className={`px-3 py-1 rounded text-xs font-bold transition-colors ${language === 'zh' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        中文
                    </button>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 bg-gray-900/30">
            <button 
                onClick={() => setActiveTab('intro')}
                className={`flex-1 py-3 text-sm font-medium tracking-wide transition-colors ${activeTab === 'intro' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
                {t('helpTabs').intro}
            </button>
            <button 
                onClick={() => setActiveTab('gestures')}
                className={`flex-1 py-3 text-sm font-medium tracking-wide transition-colors ${activeTab === 'gestures' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
                {t('helpTabs').gestures}
            </button>
            <button 
                onClick={() => setActiveTab('trouble')}
                className={`flex-1 py-3 text-sm font-medium tracking-wide transition-colors ${activeTab === 'trouble' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
                {t('helpTabs').trouble}
            </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
            {activeTab === 'intro' && (
                <div className="space-y-4">
                    <p className="text-gray-300 leading-relaxed text-lg">
                        {t('introText')}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                            <h3 className="text-indigo-300 font-bold mb-2">AI Oracle</h3>
                            <p className="text-sm text-gray-400">Powered by Gemini 2.5, receive philosophical insights based on the active Trigram.</p>
                        </div>
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                            <h3 className="text-emerald-300 font-bold mb-2">Particle Physics</h3>
                            <p className="text-sm text-gray-400">7,000 particles react to your hand's position, gesture, and the elemental nature of the Bagua.</p>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'gestures' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {gesturesList.map(g => (
                        <div key={g.id} className="p-3 bg-gray-800/50 rounded-lg border border-gray-700 flex flex-col items-center text-center hover:border-indigo-500/50 transition-colors">
                            <span className="text-3xl mb-2">{g.icon}</span>
                            <span className="text-xs font-bold text-gray-300">{tGesture(g.id)}</span>
                        </div>
                    ))}
                    <div className="col-span-full mt-4 p-3 bg-gray-800/30 rounded border border-gray-700/50 text-center">
                        <span className="text-xs text-gray-500 uppercase tracking-widest">+ Many more secret gestures to discover</span>
                    </div>
                </div>
            )}

            {activeTab === 'trouble' && (
                <div className="space-y-4">
                    <ul className="space-y-2">
                        {(t('troubleSteps') as unknown as string[]).map((step, i) => (
                            <li key={i} className="flex items-start gap-3 text-gray-300">
                                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-xs text-white mt-0.5">{i + 1}</span>
                                {step}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-800 flex justify-end">
            <button 
                onClick={onClose}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium transition-colors"
            >
                Close
            </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
