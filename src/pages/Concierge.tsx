import React, { useState } from 'react';
import { StarkButton, StarkInput } from '../components/common/StarkComponents';

export const Concierge = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  const toggleVoice = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setTranscript('Listening for instructions...');
      setTimeout(() => setTranscript('Where is the nearest step-free gate?'), 2000);
    } else {
      setTranscript('');
    }
  };

  return (
    <section className="flex flex-col h-full">
      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Concierge</h1>
        <p className="text-on-surface-variant font-bold text-xs tracking-widest uppercase">
          Voice & Linguistic Support
        </p>
      </div>

      <div className="flex-grow flex flex-col items-center justify-center gap-8 mb-8">
        <div 
          className={`w-48 h-48 rounded-none border-4 flex items-center justify-center transition-all ${
            isListening ? 'border-primary bg-primary-fixed animate-pulse text-primary' : 'border-outline-variant text-outline'
          }`}
        >
          <span className="material-symbols-outlined normal-case text-6xl" style={{fontVariationSettings: "'FILL' 1"}}>mic</span>
        </div>

        <div className="text-center h-16 px-4">
          <p className="font-bold text-lg">{transcript}</p>
        </div>
      </div>

      <div className="mt-auto space-y-4 border-t-[1px] border-outline-variant pt-8">
        <StarkInput 
          label="Manual Query" 
          placeholder="Ask for directions or assistance..."
        />
        <StarkButton fullWidth onClick={toggleVoice} variant={isListening ? 'secondary' : 'primary'}>
          {isListening ? 'Stop Listening' : 'Hold to Speak'}
        </StarkButton>
      </div>
    </section>
  );
};

export default Concierge;
