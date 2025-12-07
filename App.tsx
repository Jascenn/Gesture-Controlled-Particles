
import React, { useState } from 'react';
import { InteractionProvider } from './context/InteractionContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import HandController from './components/HandController';
import Scene from './components/ParticleScene';
import Oracle from './components/Oracle';
import TutorialOverlay from './components/TutorialOverlay';
import HelpModal from './components/HelpModal';
import AdminPanel from './components/AdminPanel';

// Separate component to use hooks inside providers
const MainLayout: React.FC = () => {
    const { t } = useLanguage();
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [isAdminOpen, setIsAdminOpen] = useState(false);

    return (
        <main className="relative w-full h-screen bg-[#050505] overflow-hidden text-white font-sans selection:bg-indigo-500/30">
            {/* 3D Visualization Layer */}
            <div className="absolute inset-0 z-0">
                <Scene />
            </div>

            {/* Top Right Menu */}
            <div className="absolute top-4 right-4 z-50 flex gap-2">
                 <button 
                    onClick={() => setIsAdminOpen(true)}
                    className="p-2 bg-black/40 backdrop-blur-md border border-gray-700 rounded-lg hover:bg-gray-800/50 transition-colors text-gray-400 hover:text-rose-400"
                    title={t('adminPanel')}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                </button>
                <button 
                    onClick={() => setIsHelpOpen(true)}
                    className="p-2 bg-black/40 backdrop-blur-md border border-gray-700 rounded-lg hover:bg-gray-800/50 transition-colors text-gray-300"
                    title={t('help')}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                </button>
            </div>

            {/* Interaction Layer */}
            <div className="absolute inset-0 z-10 pointer-events-none">
                <div className="w-full h-full relative">
                    <div className="pointer-events-auto">
                        <HandController />
                    </div>
                    <div className="pointer-events-auto">
                        <Oracle />
                    </div>
                    <div className="pointer-events-auto">
                        <TutorialOverlay />
                    </div>
                </div>
            </div>

            {/* Modals */}
            <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
            <AdminPanel isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />

            {/* Instructional Footer - Scrolling Marquee */}
            <div className="absolute bottom-6 w-full pointer-events-none z-20 overflow-hidden">
                <div className="bg-black/40 backdrop-blur-sm border-y border-white/5 py-2">
                    <div className="whitespace-nowrap animate-[marquee_20s_linear_infinite]">
                        <span className="text-gray-400 text-[10px] sm:text-xs tracking-[0.25em] uppercase font-medium mx-4">
                            {t('footerMarquee')}
                        </span>
                        <span className="text-gray-400 text-[10px] sm:text-xs tracking-[0.25em] uppercase font-medium mx-4">
                            {t('footerMarquee')}
                        </span>
                    </div>
                </div>
            </div>
            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}</style>
        </main>
    );
}

const App: React.FC = () => {
  return (
    <LanguageProvider>
        <InteractionProvider>
            <MainLayout />
        </InteractionProvider>
    </LanguageProvider>
  );
};

export default App;
