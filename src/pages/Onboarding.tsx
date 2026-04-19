import React from 'react';
import { useEntryStore, TransportMode } from '../store/entryStore';
import { StarkButton } from '../components/common/StarkComponents';
import { useNavigate } from 'react-router-dom';

export const Onboarding = () => {
  const { state, dispatch } = useEntryStore();
  const navigate = useNavigate();

  const handleTransportSelect = (mode: TransportMode) => {
    dispatch({ type: 'SET_TRANSPORT_MODE', payload: mode });
  };

  const toggleAccessibility = (pref: keyof typeof state.accessibility) => {
    dispatch({ type: 'TOGGLE_ACCESSIBILITY_PREF', payload: pref });
  };

  return (
    <section className="flex flex-col h-full max-w-lg mx-auto">
      {/* Hero Branding Section */}
      <div className="mb-12">
        <h1 className="text-5xl font-black tracking-tighter uppercase mb-4 leading-none">
          Travel <br/> Defined.
        </h1>
        <p className="text-on-surface-variant font-body text-lg leading-relaxed max-w-[80%]">
          Configure your transit environment for high-performance accessibility.
        </p>
      </div>

      {/* Transport Mode Segmented Control */}
      <div className="mb-10">
        <label className="font-['Inter'] font-bold uppercase tracking-widest text-xs text-outline mb-4 block">
          Transport Mode
        </label>
        <div className="grid grid-cols-3 border-2 border-outline-variant">
          <button 
            onClick={() => handleTransportSelect('Car')}
            className={`py-4 flex flex-col items-center gap-2 border-r-2 border-outline-variant transition-colors ${state.transportMode === 'Car' ? 'bg-primary-container text-on-primary-container font-bold' : 'text-on-surface hover:bg-surface-container-low'}`}
          >
            <span className={`material-symbols-outlined normal-case ${state.transportMode === 'Car' ? 'text-white' : ''}`} style={{fontVariationSettings: "'FILL' 0"}}>directions_car</span>
            <span className={`text-[10px] tracking-widest uppercase ${state.transportMode === 'Car' ? 'text-white' : ''}`}>Car</span>
          </button>
          <button 
            onClick={() => handleTransportSelect('Metro')}
            className={`py-4 flex flex-col items-center gap-2 border-r-2 border-outline-variant transition-colors ${state.transportMode === 'Metro' ? 'bg-primary-container text-on-primary-container font-bold' : 'text-on-surface hover:bg-surface-container-low'}`}
          >
            <span className={`material-symbols-outlined normal-case ${state.transportMode === 'Metro' ? 'text-white' : ''}`} style={{fontVariationSettings: "'FILL' 0"}}>subway</span>
            <span className={`text-[10px] tracking-widest uppercase ${state.transportMode === 'Metro' ? 'text-white' : ''}`}>Metro</span>
          </button>
          <button 
            onClick={() => handleTransportSelect('Shuttle')}
            className={`py-4 flex flex-col items-center gap-2 transition-colors ${state.transportMode === 'Shuttle' ? 'bg-primary-container text-on-primary-container font-bold' : 'text-on-surface hover:bg-surface-container-low'}`}
          >
            <span className={`material-symbols-outlined normal-case ${state.transportMode === 'Shuttle' ? 'text-white' : ''}`} style={{fontVariationSettings: "'FILL' 0"}}>airport_shuttle</span>
            <span className={`text-[10px] tracking-widest uppercase ${state.transportMode === 'Shuttle' ? 'text-white' : ''}`}>Shuttle</span>
          </button>
        </div>
      </div>

      {/* Accessibility Preferences Toggle List */}
      <div className="mb-12 space-y-4">
        <label className="font-['Inter'] font-bold uppercase tracking-widest text-xs text-outline mb-2 block">
          Accessibility Preferences
        </label>
        
        {/* Preference Item 1 */}
        <div 
          onClick={() => toggleAccessibility('stepFree')}
          className={`cursor-pointer flex items-center justify-between p-5 border-l-4 transition-colors ${state.accessibility.stepFree ? 'bg-surface-container-lowest border-primary-container text-on-surface' : 'bg-surface-container-lowest border-outline-variant text-on-surface'}`}
        >
          <div className="flex flex-col">
            <span className="font-bold text-sm uppercase tracking-tight">Step-free access</span>
            <span className="text-xs text-on-surface-variant">Prioritize elevators and ramps</span>
          </div>
          <div className={`w-12 h-6 relative flex items-center px-1 transition-colors ${state.accessibility.stepFree ? 'bg-primary-container justify-end' : 'bg-outline-variant justify-start'}`}>
            <div className="w-4 h-4 bg-white"></div>
          </div>
        </div>

        {/* Preference Item 2 */}
        <div 
          onClick={() => toggleAccessibility('lowSensory')}
          className={`cursor-pointer flex items-center justify-between p-5 border-l-4 transition-colors ${state.accessibility.lowSensory ? 'bg-surface-container-lowest border-primary-container text-on-surface' : 'bg-surface-container-lowest border-outline-variant text-on-surface'}`}
        >
          <div className="flex flex-col">
            <span className="font-bold text-sm uppercase tracking-tight">Low-sensory environments</span>
            <span className="text-xs text-on-surface-variant">Routes with reduced noise and light</span>
          </div>
          <div className={`w-12 h-6 relative flex items-center px-1 transition-colors ${state.accessibility.lowSensory ? 'bg-primary-container justify-end' : 'bg-outline-variant justify-start'}`}>
            <div className="w-4 h-4 bg-white"></div>
          </div>
        </div>

        {/* Preference Item 3 - High Contrast active example */}
        <div 
          onClick={() => toggleAccessibility('visualAid')}
          className={`cursor-pointer flex items-center justify-between p-5 border-l-4 transition-colors ${state.accessibility.visualAid ? 'bg-inverse-surface border-primary-container text-inverse-on-surface' : 'bg-surface-container-lowest border-outline-variant text-on-surface'}`}
        >
          <div className="flex flex-col">
            <span className="font-bold text-sm uppercase tracking-tight">Visual aid support</span>
            <span className={`text-xs ${state.accessibility.visualAid ? 'text-inverse-on-surface opacity-80' : 'text-on-surface-variant'}`}>High-contrast UI and audio cues</span>
          </div>
          <div className={`w-12 h-6 relative flex items-center px-1 transition-colors ${state.accessibility.visualAid ? 'bg-primary-container justify-end' : 'bg-outline-variant justify-start'}`}>
            <div className="w-4 h-4 bg-white"></div>
          </div>
        </div>
      </div>

      {/* Visual Anchor Image */}
      <div className="w-full h-48 mb-12 border-[1px] border-[#727785] overflow-hidden">
        <img 
          alt="Clean public transport interior" 
          className="w-full h-full object-cover grayscale brightness-110 contrast-125" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAG7gMqh_b3DNv8ZzCapvwhCS-7auNnYXGM-lXKRDJUQOEKTIuLpKTrDCS35Tesss-jcnczzRnaTxHLlOWJXRP-1I7zWH3e67rzndiLUgJ0TJObxpaDZKAJRh1THcr6OmM6Cx6vykRL2r8B0ItonE14vQ_q-0UxFKCROHc7yFtC6brLMVjqCq5TDIodzu1mrP02N9TfY13yZDCUcf8SlttwzPn5St_24ntR9iIHl92RoGlmXFUPb75pSEznhQ9O_G_Spa9ss9wkvKzN"
        />
      </div>

      {/* Primary CTA */}
      <div className="mt-auto">
        <StarkButton 
          fullWidth 
          icon="arrow_forward"
          onClick={() => {
            dispatch({ type: 'SET_PHASE', payload: 'IN_JOURNEY' });
            navigate('/dashboard');
          }}
        >
          Initialize System
        </StarkButton>
        <button 
          onClick={() => navigate('/dashboard')}
          className="w-full py-4 text-outline font-bold uppercase tracking-widest text-[10px] mt-2 block text-center"
        >
            Skip configuration
        </button>
      </div>
    </section>
  );
};

export default Onboarding;
