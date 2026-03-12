import { useState, useCallback, useMemo } from 'react';
import { Event, Call } from '@/app/types';

export function useDispatchCalls({
    event,
    updateEvent,
}: {
    event: Event | undefined;
    updateEvent: (updateInput: Partial<Event> | ((current: Event) => Partial<Event>)) => Promise<void>;
}) {
    const [teamToAdd, setTeamToAdd] = useState<{ [callId: string]: string }>({});
    const [teamStatusMap, setTeamStatusMap] = useState<{ [callId: string]: { [team: string]: string } }>({});

    // Call selection map for duplicate resolution
    const [selectedDuplicateCallId, setSelectedDuplicateCallId] = useState<string | null>(null);

    // Editing State (Cell/Values)
    const [editingCell, setEditingCell] = useState<{ callId: string; field: keyof Call | 'ageSex' } | null>(null);
    const [editValue, setEditValue] = useState<string>('');

    const callDisplayNumberMap = useMemo(() => {
        if (!event?.calls) return new Map<string, number>();

        let counter = 1;
        const sorted = [...event.calls].sort((a, b) => parseInt(a.id) - parseInt(b.id));
        const map = new Map<string, number>();
        sorted.forEach(c => map.set(c.id, counter++));
        return map;
    }, [event?.calls]);

    const handleCallUpdate = useCallback(async (callId: string, updates: Partial<Call>) => {
        if (!event?.calls) return;
        const updatedCalls = event.calls.map(call =>
            call.id === callId ? { ...call, ...updates } : call
        );
        await updateEvent({ calls: updatedCalls });
    }, [event, updateEvent]);

    const handleDeleteCall = useCallback(async (callId: string) => {
        if (!event) return;
        const confirmDelete = window.confirm(`Are you sure you want to delete call #${callDisplayNumberMap.get(callId)}? This action cannot be undone.`);
        if (!confirmDelete) return;

        const callToDelete = event.calls.find(c => c.id === callId);
        if (!callToDelete) return;

        let updatedStaff = event.staff || [];

        if (callToDelete.assignedTeam && callToDelete.assignedTeam.length > 0) {
            updatedStaff = updatedStaff.map(staff => {
                if (callToDelete.assignedTeam!.includes(staff.team)) {
                    return {
                        ...staff,
                        status: 'Available',
                        location: staff.originalPost || 'Unknown',
                        log: [
                            ...(staff.log || []),
                            { timestamp: Date.now(), message: `Call #${callDisplayNumberMap.get(callId)} deleted. Back to post.` }
                        ]
                    };
                }
                return staff;
            });
        }

        const remainingCalls = event.calls.filter(c => c.id !== callId);

        await updateEvent({
            calls: remainingCalls,
            staff: updatedStaff
        });
    }, [event, updateEvent, callDisplayNumberMap]);

    return {
        teamToAdd, setTeamToAdd,
        teamStatusMap, setTeamStatusMap,
        selectedDuplicateCallId, setSelectedDuplicateCallId,
        editingCell, setEditingCell,
        editValue, setEditValue,
        callDisplayNumberMap,
        handleCallUpdate,
        handleDeleteCall,
    };
}
