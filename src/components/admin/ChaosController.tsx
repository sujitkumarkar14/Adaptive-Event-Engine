import React, { useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { StarkCard, StarkButton } from '../common/StarkComponents';
import { useEntryStore } from '../../store/entryStore';
import { useTranslation } from '../../hooks/useTranslation';
import { DEMO_ROLE_STORAGE_KEY } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { ROUTING_POLICY_COLLECTION, ROUTING_POLICY_DOC_ID } from '../../lib/constants';

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
    const [emergencyVehicleActive, setEmergencyVehicleActive] = useState(false);
    const [demoRole, setDemoRole] = useState(() =>
        typeof localStorage !== 'undefined' ? localStorage.getItem(DEMO_ROLE_STORAGE_KEY) : null
    );

    const routingPolicyRef = useMemo(
        () => doc(db, ROUTING_POLICY_COLLECTION, ROUTING_POLICY_DOC_ID),
        []
    );

    useEffect(() => {
        const unsub = onSnapshot(routingPolicyRef, (snap) => {
            const v = snap.data()?.emergency_vehicle_active;
            setEmergencyVehicleActive(v === true);
        });
        return () => unsub();
    }, [routingPolicyRef]);

    const setDemoRoleOverride = (r: 'admin' | 'staff' | 'user' | 'vip' | null) => {
        if (r === null) {
            localStorage.removeItem(DEMO_ROLE_STORAGE_KEY);
            setDemoRole(null);
        } else {
            localStorage.setItem(DEMO_ROLE_STORAGE_KEY, r);
            setDemoRole(r);
        }
        window.dispatchEvent(new Event('demo-role-changed'));
    };

    const toggleAmbulanceIngress = async () => {
        await setDoc(
            routingPolicyRef,
            { emergency_vehicle_active: !emergencyVehicleActive },
            { merge: true }
        );
    };

    const handleVipArrival = () => {
        setDemoRoleOverride('vip');
    };

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
        <StarkCard
            title="DEMO: CHAOS SIMULATOR"
            subtitle="Hard-Trigger Edge States"
            className="border-t-4 border-t-black mb-6 bg-surface-container-highest"
        >
            <div className="border border-outline p-4 mb-4 space-y-3" role="group" aria-label="Demo role override">
                <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                    Role switcher (local demo)
                </p>
                <div className="flex flex-wrap gap-2">
                    <StarkButton
                        variant={demoRole === 'admin' ? 'primary' : 'secondary'}
                        className="text-xs"
                        type="button"
                        onClick={() => setDemoRoleOverride('admin')}
                        aria-pressed={demoRole === 'admin'}
                    >
                        Admin
                    </StarkButton>
                    <StarkButton
                        variant={demoRole === 'staff' ? 'primary' : 'secondary'}
                        className="text-xs"
                        type="button"
                        onClick={() => setDemoRoleOverride('staff')}
                        aria-pressed={demoRole === 'staff'}
                    >
                        Staff
                    </StarkButton>
                    <StarkButton
                        variant={demoRole === 'user' ? 'primary' : 'secondary'}
                        className="text-xs"
                        type="button"
                        onClick={() => setDemoRoleOverride('user')}
                        aria-pressed={demoRole === 'user'}
                    >
                        User
                    </StarkButton>
                    <StarkButton variant="tertiary" className="text-xs" type="button" onClick={() => setDemoRoleOverride(null)} aria-pressed={demoRole === null}>
                        Use token
                    </StarkButton>
                </div>
            </div>

            <div
                className="border border-black bg-black p-4 mb-4 space-y-3"
                role="group"
                aria-label="Priority mesh operations"
            >
                <p className="text-[10px] font-black uppercase tracking-widest text-[#FFD54F]">
                    Priority Ops
                </p>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => void toggleAmbulanceIngress()}
                        aria-pressed={emergencyVehicleActive}
                        className="px-4 py-2 text-xs font-black uppercase tracking-widest bg-[#b71c1c] text-white border-2 border-white hover:bg-red-900"
                    >
                        {emergencyVehicleActive ? 'Ambulance ingress — ON' : 'Ambulance ingress — OFF'}
                    </button>
                    <button
                        type="button"
                        onClick={handleVipArrival}
                        aria-pressed={demoRole === 'vip'}
                        className="px-4 py-2 text-xs font-black uppercase tracking-widest bg-[#9a7b0a] text-black border-2 border-[#FFD54F] hover:bg-[#c9a227]"
                    >
                        VIP arrival
                    </button>
                </div>
            </div>
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
