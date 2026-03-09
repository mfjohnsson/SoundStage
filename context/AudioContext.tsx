'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AudioContextType {
  activeTrackId: string | null;
  setActiveTrackId: (id: string | null) => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null);

  return (
    <AudioContext.Provider value={{ activeTrackId, setActiveTrackId }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
