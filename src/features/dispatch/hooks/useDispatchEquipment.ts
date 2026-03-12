import { useCallback } from 'react';
import { Event, EquipmentItem, EventEquipment, EquipmentStatus } from '@/app/types';
import { toast } from 'react-toastify';

export function useDispatchEquipment({
    event,
    updateEvent,
    callDisplayNumberMap
}: {
    event: Event | undefined;
    updateEvent: (updateInput: Partial<Event> | ((current: Event) => Partial<Event>)) => Promise<void>;
    callDisplayNumberMap: Map<string, number>;
}) {

    const getEquipmentItems = useCallback((): EquipmentItem[] => {
        if (!event) return [];
        const items: EquipmentItem[] = [];

        const equipmentSource = (event.eventEquipment && event.eventEquipment.length > 0)
            ? event.eventEquipment
            : (event?.venue?.equipment || []);

        equipmentSource.forEach(eq => {
            const eqName = typeof eq === 'string' ? eq : eq.name;
            const eventEq = event.eventEquipment?.find(e => e.name === eqName);

            const stagingLocation = eventEq?.defaultLocation ||
                (typeof eq !== 'string' && eq.location) ||
                'Staging';

            const activeCall = event.calls?.find(c =>
                c.equipment?.includes(eqName) &&
                !['Resolved', 'Delivered', 'Refusal', 'NMM'].includes(c.status)
            );

            const deliveryTeam = activeCall?.equipmentTeams?.[0];

            let currentLocation = eventEq?.location;

            if (activeCall && activeCall.status === 'Delivered Eq') {
                currentLocation = activeCall.assignedTeam[0];
            }

            const inClinic = currentLocation === 'In Clinic' || eventEq?.status === 'In Clinic';

            let status: string;
            if (activeCall) {
                const callNum = callDisplayNumberMap.get(activeCall.id) || activeCall.order;
                status = `Call ${callNum}`;
            } else if (inClinic) {
                status = 'In Clinic';
            } else {
                status = eventEq?.status || 'Available';
            }

            items.push({
                name: eqName,
                stagingLocation: stagingLocation,
                currentLocation: currentLocation || stagingLocation,
                status: status,
                callId: activeCall?.id,
                deliveryTeam: deliveryTeam,
                needsRefresh: inClinic && !activeCall,
                notes: eventEq?.notes,
            });
        });

        return items;
    }, [event, callDisplayNumberMap]);

    const handleEquipmentStatusChange = useCallback(async (equipmentName: string, newStatus: string) => {
        if (!event) return;

        try {
            const existing = (event.eventEquipment || []).find(eq => eq.name === equipmentName);
            let updatedEventEquipment: EventEquipment[] = event.eventEquipment ? [...event.eventEquipment] : [];

            if (existing) {
                updatedEventEquipment = updatedEventEquipment.map(eq =>
                    eq.name === equipmentName ? { ...eq, status: newStatus as EquipmentStatus } : eq
                );
            } else {
                const venueEq = (event.venue?.equipment || []).find(v => (typeof v === 'string' ? v : v.name) === equipmentName);
                const derivedLocation = typeof venueEq === 'string' ? '' : (venueEq && (venueEq as { location?: string }).location) || '';
                const newItem: EventEquipment = {
                    id: `eq_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`,
                    name: equipmentName,
                    status: newStatus as EquipmentStatus,
                    location: derivedLocation,
                    assignedTeam: null,
                } as EventEquipment;
                updatedEventEquipment.push(newItem);
            }

            await updateEvent({ eventEquipment: updatedEventEquipment });
        } catch (error) {
            console.error('Error updating equipment status:', error);
            toast.error('Failed to update equipment status');
        }
    }, [event, updateEvent]);

    const handleEquipmentLocationChange = useCallback(async (equipmentName: string, newLocation: string) => {
        if (!event) return;
        const existing = event.eventEquipment?.find(e => e.name === equipmentName);
        const updatedEquipment = existing
            ? (event.eventEquipment || []).map(e => e.name === equipmentName ? { ...e, location: newLocation } : e)
            : [...(event.eventEquipment || []), {
                id: `eq_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`,
                name: equipmentName,
                status: 'Available' as EquipmentStatus,
                location: newLocation,
                assignedTeam: null,
            } as EventEquipment];
        await updateEvent({ eventEquipment: updatedEquipment });
    }, [event, updateEvent]);

    const handleEquipmentMarkReady = useCallback(async (equipmentName: string) => {
        if (!event) return;
        const eqItem = event.venue?.equipment?.find(e => (typeof e === 'string' ? e : e.name) === equipmentName);
        const stagingLocation = typeof eqItem === 'string' ? '' : eqItem?.location || 'Not Set';
        const updatedEquipment = (event.eventEquipment || []).map(e =>
            e.name === equipmentName ? { ...e, location: stagingLocation } : e
        );
        await updateEvent({ eventEquipment: updatedEquipment });
    }, [event, updateEvent]);

    const handleEquipmentDelete = useCallback(async (equipmentName: string) => {
        if (!event) return;
        const confirmDelete = window.confirm(`Delete equipment "${equipmentName}" from this event?`);
        if (!confirmDelete) return;

        try {
            const updatedEventEquipment = (event.eventEquipment || []).filter(
                eq => eq.name !== equipmentName
            );
            await updateEvent({ eventEquipment: updatedEventEquipment });
            toast.success(`Deleted equipment: ${equipmentName}`);
        } catch (error) {
            console.error('Error deleting equipment:', error);
            toast.error('Failed to delete equipment');
        }
    }, [event, updateEvent]);

    const handleResetEquipmentLocations = useCallback(async () => {
        if (!event) return;

        const updatedEventEquipment = (event.eventEquipment || []).map(eq => {
            const venueEq = (event.venue?.equipment || []).find(v =>
                (typeof v === 'string' ? v : v.name) === eq.name
            );
            const defaultLocation = typeof venueEq === 'string' ? 'Staging' : (venueEq?.location || 'Staging');

            return {
                ...eq,
                location: eq.defaultLocation || defaultLocation,
                status: 'Available' as EquipmentStatus
            };
        });

        await updateEvent({ eventEquipment: updatedEventEquipment });
        toast.success('Equipment locations reset to defaults');
    }, [event, updateEvent]);

    const handleAddVenueEquipment = useCallback(async (equipmentName: string) => {
        if (!event) return;

        const venueEq = (event.venue?.equipment || []).find(v =>
            (typeof v === 'string' ? v : v.name) === equipmentName
        );
        if (!venueEq) return;

        const name = typeof venueEq === 'string' ? venueEq : venueEq.name;
        const defaultLocation = typeof venueEq === 'string' ? 'Staging' : (venueEq.location || 'Staging');

        const newEquipment: EventEquipment = {
            id: `eq_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`,
            name: name,
            status: 'Available' as EquipmentStatus,
            location: defaultLocation,
            defaultLocation: defaultLocation,
            assignedTeam: null,
        };

        await updateEvent({
            eventEquipment: [...(event.eventEquipment || []), newEquipment]
        });
        toast.success(`Added equipment: ${name}`);
    }, [event, updateEvent]);

    const getAvailableVenueEquipment = useCallback(() => {
        if (!event?.venue?.equipment) return [];
        const currentEquipmentNames = new Set((event.eventEquipment || []).map(eq => eq.name));
        return (event.venue.equipment || [])
            .map(eq => typeof eq === 'string' ? eq : eq.name)
            .filter(name => !currentEquipmentNames.has(name));
    }, [event]);

    return {
        getEquipmentItems,
        handleEquipmentStatusChange,
        handleEquipmentLocationChange,
        handleEquipmentMarkReady,
        handleEquipmentDelete,
        handleResetEquipmentLocations,
        handleAddVenueEquipment,
        getAvailableVenueEquipment
    };
}
