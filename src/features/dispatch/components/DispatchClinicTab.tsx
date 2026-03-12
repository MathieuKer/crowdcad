import React from 'react';
import { Button, Tooltip } from '@heroui/react';
import { Plus } from 'lucide-react';
import { Event, Call, ClinicOutcome } from '@/app/types';
import ClinicTrackingCard from './clinictrackingcard';

interface DispatchClinicTabProps {
    event: Event;
    updateEvent: (updates: Partial<Event> | ((current: Event) => Partial<Event>)) => Promise<void>;
    callDisplayNumberMap: Map<string, number>;
    showResolvedClinicCalls: boolean;
    setShowResolvedClinicCalls: React.Dispatch<React.SetStateAction<boolean>>;
    setShowQuickClinicCallForm: React.Dispatch<React.SetStateAction<boolean>>;
    handleDeleteCall: (callId: string) => void;
    getCallRowClass: (call: Call) => string;
    formatAgeSex: (age?: string | number, gender?: string) => string;
    parseAgeSex: (val: string) => { age: string; gender: string };
}

export function DispatchClinicTab({
    event,
    updateEvent,
    callDisplayNumberMap,
    showResolvedClinicCalls,
    setShowResolvedClinicCalls,
    setShowQuickClinicCallForm,
    handleDeleteCall,
    getCallRowClass,
    formatAgeSex,
    parseAgeSex
}: DispatchClinicTabProps) {

    const handleLocationChange = async (callId: string, newLocation: string) => {
        const callToUpdate = event.calls?.find(c => c.id === callId);
        if (!callToUpdate) return;

        const now = new Date();
        const hhmm = `0${now.getHours()}`.slice(-2) + `0${now.getMinutes()}`.slice(-2);
        const updatedCall: Call = {
            ...callToUpdate,
            location: newLocation,
            log: [...(callToUpdate.log || []), { timestamp: now.getTime(), message: `${hhmm} - Location changed to ${newLocation}.` }]
        };
        const updatedCalls = event.calls.map(c => c.id === callId ? updatedCall : c);
        await updateEvent({ calls: updatedCalls });
    };

    const handleAgeSexChange = async (callId: string, ageSexValue: string) => {
        const callToUpdate = event.calls?.find(c => c.id === callId);
        if (!callToUpdate) return;

        const { age, gender } = parseAgeSex(ageSexValue);
        const newAge = age || '';
        const newGender = gender || '';

        const now = new Date();
        const hhmm = `0${now.getHours()}`.slice(-2) + `0${now.getMinutes()}`.slice(-2);
        const updatedCall: Call = {
            ...callToUpdate,
            age: newAge,
            gender: newGender,
            log: [...(callToUpdate.log || []), { timestamp: now.getTime(), message: `${hhmm} - Age/Sex set to ${formatAgeSex(newAge, newGender) || 'N/A'}.` }]
        };
        const updatedCalls = event.calls.map(c => c.id === callId ? updatedCall : c);
        await updateEvent({ calls: updatedCalls });
    };

    const handleChiefComplaintChange = async (callId: string, newChiefComplaint: string) => {
        const callToUpdate = event.calls?.find(c => c.id === callId);
        if (!callToUpdate) return;

        const now = new Date();
        const hhmm = `0${now.getHours()}`.slice(-2) + `0${now.getMinutes()}`.slice(-2);
        const updatedCall: Call = {
            ...callToUpdate,
            chiefComplaint: newChiefComplaint,
            log: [...(callToUpdate.log || []), { timestamp: now.getTime(), message: `${hhmm} - Chief Complaint changed to ${newChiefComplaint}.` }]
        };
        const updatedCalls = event.calls.map(c => c.id === callId ? updatedCall : c);
        await updateEvent({ calls: updatedCalls });
    };

    const handleOutcomeChange = async (callId: string, outcome: string) => {
        const callToUpdate = event.calls?.find(c => c.id === callId);
        if (!callToUpdate) return;

        const now = new Date();
        const hhmm = `0${now.getHours()}`.slice(-2) + `0${now.getMinutes()}`.slice(-2);
        const updatedCall: Call = {
            ...callToUpdate,
            outcome: outcome === 'In Clinic' ? undefined : outcome as ClinicOutcome,
            log: [...(callToUpdate.log || []), { timestamp: now.getTime(), message: `${hhmm} - Clinic Status: ${outcome}` }]
        };
        const updatedCalls = event.calls.map(c => c.id === callId ? updatedCall : c);
        await updateEvent({ calls: updatedCalls });
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold text-surface-light">
                    Clinic ({(event.calls || []).filter((c: Call) => c.status === 'Delivered' && !c.outcome).length})
                </h2>
                <div className="flex items-center gap-2">
                    <Tooltip content="Add clinic walk-up" placement="top">
                        <div>
                            <Button
                                isIconOnly
                                size="md"
                                variant="flat"
                                aria-label="Add Clinic Call"
                                onPress={() => setShowQuickClinicCallForm(true)}
                            >
                                <Plus className="h-5 w-5" />
                            </Button>
                        </div>
                    </Tooltip>
                </div>
            </div>
            <div className="space-y-3">
                {[
                    // Unresolved clinic (Delivered with no outcome)
                    ...(event.calls || [])
                        .filter((c: Call) => c.status === 'Delivered' && !c.outcome)
                        .sort((a: Call, b: Call) => parseInt(a.id) - parseInt(b.id)),
                    // Resolved clinic (Delivered with an outcome) when toggled on
                    ...(showResolvedClinicCalls
                        ? (event.calls || [])
                            .filter((c: Call) => c.status === 'Delivered' && !!c.outcome)
                            .sort((a: Call, b: Call) => parseInt(a.id) - parseInt(b.id))
                        : [])
                ].map((call: Call) => (
                    <ClinicTrackingCard
                        key={call.id}
                        call={call}
                        callDisplayNumber={callDisplayNumberMap.get(call.id) || 0}
                        event={event}
                        onLocationChange={handleLocationChange}
                        onAgeSexChange={handleAgeSexChange}
                        onChiefComplaintChange={handleChiefComplaintChange}
                        onOutcomeChange={handleOutcomeChange}
                        handleDeleteCall={handleDeleteCall}
                        getCallRowClass={getCallRowClass}
                        formatAgeSex={formatAgeSex}
                        updateEvent={updateEvent}
                    />
                ))}
                {(!event.calls || event.calls.filter((c: Call) => c.status === 'Delivered').length === 0) && (
                    <div className="text-center text-surface-light/50 py-8">
                        No clinic calls
                    </div>
                )}
            </div>
            <div className="flex justify-center pt-3">
                <button
                    onClick={() => setShowResolvedClinicCalls(prev => !prev)}
                    className="text-surface-faint text-base hover:text-surface-light"
                    aria-label="Toggle resolved clinic calls"
                >
                    {showResolvedClinicCalls ? 'Hide Resolved Clinic Calls' : 'Show Resolved Clinic Calls'}
                </button>
            </div>
        </div>
    );
}

export default DispatchClinicTab;
