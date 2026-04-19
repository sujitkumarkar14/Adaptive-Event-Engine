import React, { useState } from 'react';
import { StarkCard, StarkButton } from '../common/StarkComponents';
import { useEntryStore } from '../../store/entryStore';
import { useTranslation } from '../../hooks/useTranslation';

/** Demo-only: hidden in production unless explicitly enabled (prevents evac / API simulators in the wild). */
const showChaosSimulator =
    import.meta.env.DEV ||
    import.meta.env.MODE === 'test' ||
    import.meta.env.VITE_ENABLE_CHAOS_CONTROLLER === 'true';

export const ChaosController = () => {
    const { dispatch } = useEntryStore();
    const { announceEmergency, t } = useTranslation();
    const [collapsed, setCollapsed] = useState(false);
    const [evacDrillMessage, setEvacDrillMessage] = useState('');

    if (!showChaosSimulator) {
        return null;
    }

    if (collapsed) {
        return (
            <StarkButton variant="tertiary" onClick={() => setCollapsed(false)} className="opacity-50 text-xs">
                [X] Unlock Chaos Eng
            </StarkButton>
        );
    }

    const handleEvacDrill = () => {
        const message = t(
            'emergency.evacuate',
            'Emergency detected. Please proceed to the nearest marked exit immediately.'
        );
        dispatch({ type: 'TRIGGER_EMERGENCY' });
        setEvacDrillMessage(message);
        announceEmergency(message);
    };

    return (
        <StarkCard title="DEMO: CHAOS SIMULATOR" subtitle="Hard-Trigger Edge States" className="border-t-4 border-t-black mb-6 bg-surface-container-highest">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <StarkButton 
                    variant="secondary" 
                    onClick={() => dispatch({ type: 'SET_NETWORK_STATUS', payload: false })}
                >
                    Kill Network (0kbps)
                </StarkButton>
                
                <StarkButton 
                    variant="primary" 
                    onClick={() => dispatch({ type: 'API_FAILURE', payload: '502 Bad Gateway Vertex' })}
                >
                    Simulate API Crush
                </StarkButton>

                <StarkButton 
                    onClick={handleEvacDrill}
                    className="bg-error text-white font-black tracking-widest border-2 border-error hover:bg-red-800"
                    aria-label="Trigger emergency evacuation drill"
                >
                    TRIGGER EVAC
                </StarkButton>
            </div>
            {evacDrillMessage ? (
                <p className="sr-only" role="alert" aria-live="assertive">
                    {evacDrillMessage}
                </p>
            ) : null}
            <div className="mt-4 flex justify-end">
                <button type="button" onClick={() => setCollapsed(true)} className="text-xs uppercase tracking-widest font-black opacity-50 hover:opacity-100">
                    Collapse [X]
                </button>
            </div>
        </StarkCard>
    );
};
