import React, { createContext, useContext, useState, ReactNode } from 'react';
import { HandState, HandGesture } from '../types';

interface InteractionContextType {
  handState: HandState;
  setHandState: (state: HandState) => void;
  activeTrigramIndex: number;
  setActiveTrigramIndex: (index: number) => void;
  lastComboTime: number;
  triggerCombo: () => void;
  lastAuraTime: number;
  triggerAura: () => void;
}

const InteractionContext = createContext<InteractionContextType | undefined>(undefined);

interface InteractionProviderProps {
  children: ReactNode;
}

export const InteractionProvider: React.FC<InteractionProviderProps> = ({ children }) => {
  const [handState, setHandState] = useState<HandState>({
    detected: false,
    x: 0.5,
    y: 0.5,
    gesture: HandGesture.NONE,
  });

  const [activeTrigramIndex, setActiveTrigramIndex] = useState<number>(0);
  const [lastComboTime, setLastComboTime] = useState<number>(0);
  const [lastAuraTime, setLastAuraTime] = useState<number>(0);

  const triggerCombo = () => {
    setLastComboTime(Date.now());
  };

  const triggerAura = () => {
    setLastAuraTime(Date.now());
  };

  return (
    <InteractionContext.Provider value={{ 
      handState, 
      setHandState, 
      activeTrigramIndex, 
      setActiveTrigramIndex,
      lastComboTime,
      triggerCombo,
      lastAuraTime,
      triggerAura
    }}>
      {children}
    </InteractionContext.Provider>
  );
};

export const useInteraction = () => {
  const context = useContext(InteractionContext);
  if (!context) {
    throw new Error('useInteraction must be used within an InteractionProvider');
  }
  return context;
};