import { useState, useCallback } from 'react';
import { Event, Staff, Supervisor } from '@/app/types';

export function useDispatchTeams({
    event,
    updateEvent,
}: {
    event: Event | undefined;
    updateEvent: (updateInput: Partial<Event> | ((current: Event) => Partial<Event>)) => Promise<void>;
}) {
    // Add Team State
    const [showAddTeamModal, setShowAddTeamModal] = useState(false);
    const [showEditTeamModal, setShowEditTeamModal] = useState(false);
    const [teamName, setTeamName] = useState('');
    const [memberName, setMemberName] = useState('');
    const [memberCert, setMemberCert] = useState('');
    const [isTeamLead, setIsTeamLead] = useState(false);
    const [currentMembers, setCurrentMembers] = useState<{ name: string, cert: string, lead: boolean }[]>([]);
    const [editTeamOriginalName, setEditTeamOriginalName] = useState<string | null>(null);

    // Supervisor State
    const [showAddSupervisorModal, setShowAddSupervisorModal] = useState(false);
    const [showEditSupervisorModal, setShowEditSupervisorModal] = useState(false);
    const [editSupervisorOriginalName, setEditSupervisorOriginalName] = useState<string | null>(null);

    // Common logic for duplicate checking
    function isDuplicateTeamName(name: string, existingStaff: Staff[]): boolean {
        if (!name || !existingStaff || existingStaff.length === 0) return false;
        const normalizedName = name.toLowerCase().trim();
        return existingStaff.some(staff => staff.team.toLowerCase().trim() === normalizedName);
    }

    // --- Teams Handlers --- //
    const handleAddNewTeam = useCallback(() => {
        setTeamName('');
        setCurrentMembers([]);
        setMemberName('');
        setMemberCert('');
        setIsTeamLead(false);
        setShowAddTeamModal(true);
    }, []);

    const handleSaveNewTeam = useCallback(async () => {
        if (!teamName || currentMembers.length === 0) {
            alert('Please enter a team name and add at least one member.');
            return;
        }

        const trimmedName = teamName.trim();

        await updateEvent((currentEvent) => {
            if (isDuplicateTeamName(trimmedName, currentEvent.staff || [])) {
                throw new Error(`A team with the name "${trimmedName}" already exists.`);
            }

            const membersStrings = currentMembers.map(m => `${m.name} [${m.cert}]${m.lead ? ' (Lead)' : ''}`);

            const staffEntry: Staff = {
                team: trimmedName,
                members: membersStrings,
                status: 'Available',
                location: '',
                log: [{ timestamp: Date.now(), message: 'Team created' }]
            };

            return { staff: [...(currentEvent.staff || []), staffEntry] };
        });

        setTeamName('');
        setCurrentMembers([]);
        setShowAddTeamModal(false);
    }, [teamName, currentMembers, updateEvent]);

    const handleEditTeam = useCallback((staff: Staff) => {
        setTeamName(staff.team);
        const parsed = (staff.members || []).map((m) => {
            const lead = m.includes('(Lead)');
            const nameCertMatch = m.match(/^(.+?)\s\[(.+?)\]/);
            const name = nameCertMatch ? nameCertMatch[1].trim() : m.trim();
            const cert = nameCertMatch ? nameCertMatch[2].trim() : '';
            return { name, cert, lead };
        });
        setCurrentMembers(parsed);
        setMemberName('');
        setMemberCert('');
        setIsTeamLead(false);
        setEditTeamOriginalName(staff.team);
        setShowEditTeamModal(true);
    }, []);

    const handleSaveEditedTeam = useCallback(async () => {
        if (!teamName || currentMembers.length === 0 || !event || !editTeamOriginalName) {
            alert('Please enter a team name and add at least one member.');
            return;
        }

        const newName = teamName.trim();
        const oldName = editTeamOriginalName;

        if (oldName !== newName && isDuplicateTeamName(newName, event.staff || [])) {
            alert(`A team with the name "${newName}" already exists. Please choose a different name.`);
            return;
        }

        const membersStrings = currentMembers.map(m => `${m.name} [${m.cert}]${m.lead ? ' (Lead)' : ''}`);
        const now = new Date();
        const hhmm = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0');

        const updatedStaff = (event.staff || []).map(s => {
            if (s.team !== oldName) return s;
            return {
                ...s,
                team: newName,
                members: membersStrings,
                log: [
                    ...(s.log || []),
                    { timestamp: now.getTime(), message: `${hhmm} - team edited` + (oldName !== newName ? ` (renamed from ${oldName})` : '') }
                ]
            };
        });

        const updatedCalls = oldName !== newName ? (event.calls || []).map(c => {
            let assignedTeam = c.assignedTeam || [];
            let detachedTeams = c.detachedTeams || [];

            if (assignedTeam.includes(oldName)) {
                assignedTeam = assignedTeam.map(t => (t === oldName ? newName : t));
            }
            if (detachedTeams.length) {
                detachedTeams = detachedTeams.map(dt => dt.team === oldName ? { ...dt, team: newName } : dt);
            }

            return (assignedTeam !== c.assignedTeam || detachedTeams !== c.detachedTeams)
                ? { ...c, assignedTeam, detachedTeams }
                : c;
        }) : event.calls;

        try {
            await updateEvent({ staff: updatedStaff, calls: updatedCalls });

            setTeamName('');
            setCurrentMembers([]);
            setEditTeamOriginalName(null);
            setShowEditTeamModal(false);
        } catch (error) {
            console.error('Error saving team changes:', error);
            alert('Error saving team changes. Please try again.');
        }
    }, [teamName, currentMembers, event, editTeamOriginalName, updateEvent]);


    const handleDeleteTeam = useCallback(async (teamNameToDelete: string) => {
        if (!event) return;

        const now = new Date();
        const hhmm = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0');

        const remainingStaff = (event.staff || []).filter(s => s.team !== teamNameToDelete);

        const updatedCalls = (event.calls || []).map(c => {
            if (!c.assignedTeam?.includes(teamNameToDelete)) return c;

            const newAssigned = (c.assignedTeam || []).filter(t => t !== teamNameToDelete);
            const newStatus = newAssigned.length === 0 ? 'Pending' : c.status;

            const log = {
                timestamp: now.getTime(),
                message: `${hhmm} - ${teamNameToDelete} removed (team deleted).`
            };

            return {
                ...c,
                assignedTeam: newAssigned,
                status: newStatus,
                log: [...(c.log || []), log]
            };
        });

        await updateEvent({
            staff: remainingStaff,
            calls: updatedCalls
        });
    }, [event, updateEvent]);

    // --- Supervisor Handlers --- //
    const handleAddNewSupervisor = useCallback(() => {
        setTeamName('');
        setMemberName('');
        setMemberCert('');
        setShowAddSupervisorModal(true);
    }, []);

    const handleSaveNewSupervisor = useCallback(async () => {
        if (!event) return;

        const callSign = teamName.trim();
        const cert = memberCert.trim();
        const name = memberName.trim();

        if (!callSign || !cert) {
            alert('Supervisor Call Sign and Certification are required.');
            return;
        }

        if (event.supervisor?.some(s => s.team.toLowerCase().trim() === callSign.toLowerCase())) {
            alert(`A supervisor with the call sign "${callSign}" already exists.`);
            return;
        }

        const memberString = `${name || 'Supervisor'} [${cert}]`;
        const now = new Date();
        const hhmm = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0');

        const newSupervisor: Supervisor = {
            team: callSign,
            member: memberString,
            status: 'Available',
            location: 'Roaming',
            log: [{ timestamp: now.getTime(), message: `${hhmm} - supervisor created` }],
            originalPost: 'Roaming',
        };

        try {
            await updateEvent({
                supervisor: [...(event.supervisor || []), newSupervisor],
            });

            setTeamName('');
            setMemberName('');
            setMemberCert('');
            setShowAddSupervisorModal(false);
        } catch (error) {
            console.error('Error saving supervisor:', error);
            alert('Error saving supervisor. Please try again.');
        }
    }, [event, teamName, memberName, memberCert, updateEvent]);

    const handleEditSupervisor = useCallback((supervisor: Supervisor) => {
        setTeamName(supervisor.team);

        const match = supervisor.member?.match(/^(.+?)\s\[(.+?)\]$/);
        const name = match ? match[1].trim() : (supervisor.member || '').trim();
        const cert = match ? match[2].trim() : '';

        setMemberName(name);
        setMemberCert(cert);
        setEditSupervisorOriginalName(supervisor.team);
        setShowEditSupervisorModal(true);
    }, []);

    const handleSaveEditedSupervisor = useCallback(async () => {
        if (!event || !editSupervisorOriginalName) return;

        const newCallSign = teamName.trim();
        const cert = memberCert.trim();
        const name = memberName.trim();

        if (!newCallSign || !cert) {
            alert('Supervisor Call Sign and Certification are required.');
            return;
        }

        if (
            editSupervisorOriginalName !== newCallSign &&
            event.supervisor?.some(s => s.team.toLowerCase().trim() === newCallSign.toLowerCase())
        ) {
            alert(`A supervisor with the call sign "${newCallSign}" already exists.`);
            return;
        }

        const memberString = `${name || 'Supervisor'} [${cert}]`;
        const now = new Date();
        const hhmm = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0');

        const updatedSupervisor = (event.supervisor || []).map(s => {
            if (s.team !== editSupervisorOriginalName) return s;
            return {
                ...s,
                team: newCallSign,
                member: memberString,
                log: [
                    ...(s.log || []),
                    { timestamp: now.getTime(), message: `${hhmm} - supervisor edited` + (editSupervisorOriginalName !== newCallSign ? ` (renamed from ${editSupervisorOriginalName})` : '') },
                ],
            };
        });

        try {
            await updateEvent({ supervisor: updatedSupervisor });

            setTeamName('');
            setMemberName('');
            setMemberCert('');
            setEditSupervisorOriginalName(null);
            setShowEditSupervisorModal(false);
        } catch (error) {
            console.error('Error saving supervisor changes:', error);
            alert('Error saving supervisor changes. Please try again.');
        }
    }, [event, teamName, memberName, memberCert, editSupervisorOriginalName, updateEvent]);

    const handleDeleteSupervisor = useCallback(async (supervisorNameToDelete: string) => {
        if (!event) return;

        const remainingSupervisor = (event.supervisor || []).filter(s => s.team !== supervisorNameToDelete);
        await updateEvent({ supervisor: remainingSupervisor });
    }, [event, updateEvent]);


    return {
        // Teams State
        showAddTeamModal, setShowAddTeamModal,
        showEditTeamModal, setShowEditTeamModal,
        teamName, setTeamName,
        memberName, setMemberName,
        memberCert, setMemberCert,
        isTeamLead, setIsTeamLead,
        currentMembers, setCurrentMembers,

        // Supervisor State
        showAddSupervisorModal, setShowAddSupervisorModal,
        showEditSupervisorModal, setShowEditSupervisorModal,

        // Handlers
        handleAddNewTeam, handleSaveNewTeam,
        handleEditTeam, handleSaveEditedTeam, handleDeleteTeam,
        handleAddNewSupervisor, handleSaveNewSupervisor,
        handleEditSupervisor, handleSaveEditedSupervisor, handleDeleteSupervisor,
    };
}
