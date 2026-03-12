import React from 'react';
import { Button, Tooltip } from '@heroui/react';
import { Plus } from 'lucide-react';
import { Event, Call } from '@/app/types';
import CallTrackingCard from './calltrackingcard';

interface DispatchCallsTabProps {
    event: Event;
    updateEvent: (updates: Partial<Event> | ((current: Event) => Partial<Event>)) => Promise<void>;
    callDisplayNumberMap: Map<string, number>;
    showResolvedCalls: boolean;
    setShowResolvedCalls: React.Dispatch<React.SetStateAction<boolean>>;
    setShowQuickCallForm: React.Dispatch<React.SetStateAction<boolean>>;
    handleRemoveTeamFromCall: (callId: string, team: string) => Promise<void>;
    handleAddTeamToCall: (callId: string, team: string) => Promise<void>;
    handleTeamStatusChange: (callId: string, team: string, newStatus: string) => void;
    handleMarkDuplicate: (callId: string) => void;
    handleTogglePriorityFromMenu: (callId: string) => Promise<void>;
    handleDeleteCall: (callId: string) => void;
    formatAgeSex: (age?: string | number, gender?: string) => string;
    parseAgeSex: (val: string) => { age: string; gender: string };
}

export function DispatchCallsTab({
    event,
    updateEvent,
    callDisplayNumberMap,
    showResolvedCalls,
    setShowResolvedCalls,
    setShowQuickCallForm,
    handleRemoveTeamFromCall,
    handleAddTeamToCall,
    handleTeamStatusChange,
    handleMarkDuplicate,
    handleTogglePriorityFromMenu,
    handleDeleteCall,
    formatAgeSex,
    parseAgeSex
}: DispatchCallsTabProps) {

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

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold text-surface-light">Calls</h2>
                <div className="flex items-center gap-2">
                    <Tooltip content="Add new call" placement="top">
                        <div>
                            <Button
                                isIconOnly
                                size="md"
                                variant="flat"
                                aria-label="Add Call"
                                onPress={() => setShowQuickCallForm(true)}
                            >
                                <Plus className="h-5 w-5" />
                            </Button>
                        </div>
                    </Tooltip>
                </div>
            </div>
            <div className="space-y-3">
                {[
                    // Active calls first
                    ...(event.calls || [])
                        .filter((call: Call) => !['Delivered', 'Refusal', 'NMM', 'Rolled', 'Resolved', 'Unable to Locate'].includes(call.status))
                        .sort((a: Call, b: Call) => parseInt(a.id) - parseInt(b.id)),
                    // Show resolved calls when showResolvedCalls is true
                    ...(showResolvedCalls
                        ? (event.calls || [])
                            .filter((c: Call) => ['Delivered', 'Refusal', 'NMM', 'Rolled', 'Resolved', 'Unable to Locate'].includes(c.status))
                            .sort((a: Call, b: Call) => parseInt(a.id) - parseInt(b.id))
                        : [])
                ].map((call: Call) => (
                    <CallTrackingCard
                        key={call.id}
                        call={call}
                        callDisplayNumber={callDisplayNumberMap.get(call.id) || 0}
                        event={event}
                        onLocationChange={handleLocationChange}
                        onAgeSexChange={handleAgeSexChange}
                        onChiefComplaintChange={handleChiefComplaintChange}
                        onRemoveTeamFromCall={handleRemoveTeamFromCall}
                        onAddTeamToCall={handleAddTeamToCall}
                        handleTeamStatusChange={handleTeamStatusChange}
                        handleMarkDuplicate={handleMarkDuplicate}
                        handleTogglePriority={handleTogglePriorityFromMenu}
                        handleDeleteCall={handleDeleteCall}
                        formatAgeSex={formatAgeSex}
                        updateEvent={updateEvent}
                    />
                ))}
                {(!event.calls || event.calls.length === 0) && (
                    <div className="text-center text-surface-light/50 py-8">
                        No calls
                    </div>
                )}
            </div>
            <div className="flex justify-center pt-3">
                <button
                    onClick={() => setShowResolvedCalls(prev => !prev)}
                    className="text-surface-faint text-base hover:text-surface-light"
                    aria-label="Toggle resolved calls"
                >
                    {showResolvedCalls ? 'Hide Resolved Calls' : 'Show Resolved Calls'}
                </button>
            </div>
        </div>
    );
}

export default DispatchCallsTab;
