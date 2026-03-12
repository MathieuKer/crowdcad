import { useState, useCallback } from 'react';
import { Event, Call, CallLogEntry, Staff, TeamLogEntry, EquipmentStatus, PostAssignment } from '@/app/types';

export function useDispatchCallsAdvanced({
    event,
    updateEvent,
    callDisplayNumberMap
}: {
    event: Event | undefined;
    updateEvent: (updateInput: Partial<Event> | ((current: Event) => Partial<Event>)) => Promise<void>;
    callDisplayNumberMap: Map<string, number>;
}) {
    // --- State --- //
    const [selectedDuplicateCallId, setSelectedDuplicateCallId] = useState<string | null>(null);
    const [showDuplicateModal, setShowDuplicateModal] = useState(false);

    // Type definition from page.tsx
    type EditableCallField = keyof Call | 'ageSex';
    const [editingCell, setEditingCell] = useState<{ callId: string; field: EditableCallField } | null>(null);
    const [editValue, setEditValue] = useState<string>("");

    // --- Computed Values --- //
    const computeCallStatus = useCallback((call: Call): string => {
        if (!Array.isArray(call.assignedTeam)) return call.status || 'Pending';
        if (!event) return call.status || 'Pending';

        if (!call.assignedTeam || call.assignedTeam.length === 0) {
            return call.status || 'Pending';
        }

        const teamStatuses = call.assignedTeam
            .map(teamName => event.staff.find(t => t.team === teamName)?.status)
            .filter(Boolean) as string[];

        if (teamStatuses.includes('Transporting')) return 'Transporting';
        if (teamStatuses.includes('On Scene')) return 'On Scene';
        if (teamStatuses.includes('En Route')) return 'En Route';

        return call.status || 'Assigned';
    }, [event]);

    // --- Handlers --- //

    // Add team to call
    const handleAddTeamToCall = useCallback(async (callId: string, team: string, postAssignments: PostAssignment) => {
        if (!team || !event) return;
        const call = event.calls.find(c => c.id === callId);
        if (!call) return;

        const now = new Date();
        const hhmm = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0');

        const callLogEntry: CallLogEntry = {
            timestamp: now.getTime(),
            message: `${hhmm} - ${team} assigned and en route.`
        };

        const teamLogEntry: TeamLogEntry = {
            timestamp: now.getTime(),
            message: `${hhmm} - responding to call #${callDisplayNumberMap.get(callId)} (${callId})`
        };

        const updatedCall: Call = {
            ...call,
            assignedTeam: [...(call.assignedTeam || []), team],
            status: 'Assigned',
            log: [...(call.log || []), callLogEntry]
        };

        const updatedStaff = event.staff.map(t =>
            t.team === team
                ? {
                    ...t,
                    status: 'En Route',
                    location: call.location,
                    originalPost: t.location || 'Unknown',
                    log: [...(t.log || []), teamLogEntry]
                }
                : t
        );

        const updatedCalls = event.calls.map(c => c.id === callId ? updatedCall : c);

        let updatedEquipment = event.eventEquipment || [];
        try {
            const callEquipmentNames = new Set(
                (call.equipment || []).map((n: unknown) => (typeof n === 'string' ? n : (n as { name?: string }).name || ''))
            );
            updatedEquipment = (event.eventEquipment || []).map(eq => {
                const eqName = eq.name;
                const isListedOnCall = callEquipmentNames.has(eqName);
                const isCurrentlyAssignedToTeam = eq.assignedTeam === team;
                if (isListedOnCall || isCurrentlyAssignedToTeam) {
                    return {
                        ...eq,
                        assignedTeam: team,
                        status: 'In Use' as EquipmentStatus,
                        location: call.location || eq.location || team
                    };
                }
                return eq;
            });
        } catch (e) {
            console.error('Error updating equipment on team add:', e);
        }

        await updateEvent({
            calls: updatedCalls,
            staff: updatedStaff,
            postAssignments, // Requires passing this from component state
            eventEquipment: updatedEquipment
        });

    }, [event, callDisplayNumberMap, updateEvent]);


    // Remove team from call
    const handleRemoveTeamFromCall = useCallback(async (callId: string, teamToRemove: string, postAssignments: PostAssignment) => {
        if (!event) return;

        const call = event.calls.find(c => c.id === callId);
        const team = event.staff.find(t => t.team === teamToRemove);

        if (!call || !team) return;

        const now = new Date();
        const hhmm = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0');

        const callLogEntry: CallLogEntry = {
            timestamp: now.getTime(),
            message: `${hhmm} - ${teamToRemove} detached from call.`
        };

        const teamLogEntry: TeamLogEntry = {
            timestamp: now.getTime(),
            message: `${hhmm} - detached from call #${callDisplayNumberMap.get(callId)} (${callId}); back to post at ${team.location}`
        };

        const updatedCall: Call = {
            ...call,
            assignedTeam: (call.assignedTeam || []).filter(t => t !== teamToRemove),
            status: (call.assignedTeam || []).length <= 1 ? 'Pending' : call.status,
            log: [...(call.log || []), callLogEntry]
        };

        const updatedTeam: Staff = {
            ...team,
            status: 'Available',
            log: [...(team.log || []), teamLogEntry]
        };

        const updatedCalls = event.calls.map(c => c.id === callId ? updatedCall : c);
        const updatedStaff = event.staff.map(t => t.team === teamToRemove ? updatedTeam : t);

        await updateEvent({
            calls: updatedCalls,
            staff: updatedStaff,
            postAssignments
        });
    }, [event, callDisplayNumberMap, updateEvent]);


    // Duplicate Calls Logic
    const handleMarkDuplicate = useCallback(async (callId: string) => {
        setSelectedDuplicateCallId(callId);
        setShowDuplicateModal(true);
    }, []);

    const handleResolveDuplicate = useCallback(async (duplicateCallId: string, originalCallId: string, postAssignments: PostAssignment) => {
        const duplicateCall = event?.calls.find(c => c.id === duplicateCallId);
        if (!duplicateCall) return;

        const now = new Date();
        const hhmm = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0');
        const originalCallNumber = callDisplayNumberMap.get(originalCallId);

        const newLogEntry: CallLogEntry = {
            timestamp: now.getTime(),
            message: `${hhmm} - Resolved, duplicate to call #${originalCallNumber}`
        };

        const updatedCall: Call = {
            ...duplicateCall,
            duplicate: true,
            duplicateOf: originalCallId,
            status: 'Resolved',
            assignedTeam: [],
            log: [...(duplicateCall.log || []), newLogEntry]
        };

        if (duplicateCall.assignedTeam && duplicateCall.assignedTeam.length > 0) {
            const updatedStaff = event?.staff.map(staff => {
                if (duplicateCall.assignedTeam?.includes(staff.team)) {
                    const teamLogEntry: TeamLogEntry = {
                        timestamp: now.getTime(),
                        message: `${hhmm} - freed from duplicate call #${callDisplayNumberMap.get(duplicateCallId)}, back to post`
                    };
                    return {
                        ...staff,
                        status: 'Available',
                        location: staff.originalPost || staff.location || 'Unknown',
                        log: [...(staff.log || []), teamLogEntry]
                    };
                }
                return staff;
            });

            const updatedCalls = event?.calls.map(c => c.id === duplicateCallId ? updatedCall : c);
            await updateEvent({ calls: updatedCalls, staff: updatedStaff, postAssignments });
        } else {
            const updatedCalls = event?.calls.map(c => c.id === duplicateCallId ? updatedCall : c);
            await updateEvent({ calls: updatedCalls });
        }

        setShowDuplicateModal(false);
        setSelectedDuplicateCallId(null);
    }, [event, callDisplayNumberMap, updateEvent]);


    // Cell Editing Logic
    const handleCellClick = useCallback(<K extends keyof Call>(callId: string, field: K, value?: Call[K]) => {
        setEditingCell({ callId, field });
        let newValue = "";
        if (typeof value === "string") {
            newValue = value;
        } else if (value !== undefined && value !== null) {
            newValue = String(value);
        }
        setEditValue(newValue);
    }, []);

    const camelCaseToTitle = (str: string) => {
        return str
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, s => s.toUpperCase());
    };

    const handleCellBlur = useCallback(async <K extends keyof Call>(callId: string, field: K) => {
        const call = event?.calls.find(c => c.id === callId);
        if (!call) return;

        const prevValue = call[field];
        const newValue = editValue;

        if (prevValue !== newValue) {
            const now = new Date();
            const hhmm = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0');
            const action = (prevValue === undefined || prevValue === "" || prevValue === null) ? "set" : "changed";
            const logMessage = `${hhmm} - ${camelCaseToTitle(field)} ${action} to ${newValue}.`;

            const updatedCall = {
                ...call,
                [field]: newValue,
                log: [...(call.log || []), { timestamp: now.getTime(), message: logMessage }]
            };

            const updatedCalls = event?.calls.map(c => c.id === callId ? updatedCall : c);
            await updateEvent({ calls: updatedCalls });
        }
        setEditingCell(null);
    }, [event, editValue, updateEvent]);


    return {
        // State
        selectedDuplicateCallId, setSelectedDuplicateCallId,
        showDuplicateModal, setShowDuplicateModal,
        editingCell, setEditingCell,
        editValue, setEditValue,

        // Computed
        computeCallStatus,

        // Handlers
        handleAddTeamToCall,
        handleRemoveTeamFromCall,
        handleMarkDuplicate,
        handleResolveDuplicate,
        handleCellClick,
        handleCellBlur
    };
}
