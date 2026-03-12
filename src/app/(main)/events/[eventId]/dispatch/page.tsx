'use client';
import { useEffect, useMemo, useState, useRef, useCallback, ReactNode, RefObject, use } from 'react';
import PostingScheduleModal from '@/features/events/components/modals/postingschedulemodal';
import VenueMapModal from '@/features/events/components/modals/venuemapmodal';
import EndEventModal from '@/features/events/components/modals/endeventmodal';
import QuickCallModal from "@/features/events/components/modals/quickcallmodal";
import ClinicWalkupModal from "@/features/dispatch/components/clinicwalkupmodal";
import AddTeamModal from "@/features/teams/components/modals/addteammodal";
import AddSupervisorModal from "@/features/teams/components/modals/addsupervisormodal";
import React from 'react';
import { doc, onSnapshot, runTransaction } from 'firebase/firestore';
import { db } from '@/app/firebase';
import { Event as EventData, Staff, Supervisor, Call, EquipmentStatus, CallLogEntry, TeamLogEntry } from '@/app/types';
import { toast, Slide } from 'react-toastify';
import { useRouter } from 'next/navigation';
import isEqual from 'lodash.isequal';
import { useAuth } from '@/hooks/useauth';
import { Plus, RotateCw, ArrowDownWideNarrow, Rows2, Rows4 } from "lucide-react";
import TeamCard from '@/features/dispatch/components/teamcard';
import TeamCardCondensed from '@/features/dispatch/components/teamcard-condensed';
import { CallTrackingTable } from '@/features/dispatch/components/calltracking';
import ClinicTrackingTable from '@/features/dispatch/components/clinictracking';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import DebugModal from '@/components/modals/debugmodal';
import { ShieldAlert } from 'lucide-react';
import { Select, SelectItem, Tabs, Tab, Button, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Tooltip } from "@heroui/react"
import { DispatchEquipmentTab } from '@/features/dispatch/components/DispatchEquipmentTab';
import LoadingScreen from '@/components/ui/loading-screen';

import { useDispatchSchedule } from '@/features/dispatch/hooks/useDispatchSchedule';
import { useDispatchCallsAdvanced } from '@/features/dispatch/hooks/useDispatchCallsAdvanced';
import { useDispatchEquipment } from '@/features/dispatch/hooks/useDispatchEquipment';
import DispatchCallsTab from '@/features/dispatch/components/DispatchCallsTab';
import DispatchClinicTab from '@/features/dispatch/components/DispatchClinicTab';


interface DispatchPageProps {
  params: Promise<{ eventId: string }>
}

import ReactDOM from 'react-dom';

interface PortalDropdownProps {
  anchorRef: RefObject<HTMLElement>;
  isOpen: boolean;
  children: ReactNode;
  widthClass?: string;
  onClose?: () => void;
}

function PortalDropdown({
  anchorRef,
  isOpen,
  children,
  widthClass = 'w-auto',
  onClose,
}: PortalDropdownProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleDown(e: MouseEvent) {
      const t = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(t) &&
        anchorRef.current &&
        !anchorRef.current.contains(t)
      ) {
        onClose?.();
      }
    }
    document.addEventListener('mousedown', handleDown);
    return () => document.removeEventListener('mousedown', handleDown);
  }, [onClose, anchorRef]);

  if (!isOpen || !anchorRef.current) return null;

  const rect = anchorRef.current.getBoundingClientRect();
  const dropdownStyle: React.CSSProperties = {
    position: 'fixed',
    top: rect.bottom + 4,
    left: rect.left,
    zIndex: 9999,
  };

  return ReactDOM.createPortal(
    <div
      ref={menuRef}
      style={dropdownStyle}
      className={`inline-block bg-surface-deepest border border-surface-liner rounded shadow-lg ${widthClass} max-h-[60vh] overflow-auto whitespace-nowrap`}
    >
      {children}
    </div>,
    document.body
  );
}



interface TeamWidgetProps {
  staff: Staff;
  event: EventData;
  callDisplayNumberMap: Map<string, number>;
  teamTimers: { [team: string]: number };
  onStatusChange: (staff: Staff, newStatus: string) => void;
  onLocationChange: (staff: Staff, newLocation: string) => void;
  onEditTeam?: (staff: Staff) => void;
  onDeleteTeam?: (team: string) => void;
  onRefreshTeamPost?: (team: string) => void;
  updateEvent: (updates: Partial<EventData>) => Promise<void>;
  cardViewMode?: 'normal' | 'condensed';
}


const TeamWidget = React.memo(function TeamWidget(props: TeamWidgetProps) {
  const {
    staff,
    event,
    teamTimers,
    onStatusChange,
    onLocationChange,
    onEditTeam,
    onDeleteTeam,
    onRefreshTeamPost,
    updateEvent,
    cardViewMode = 'normal',
  } = props;

  const CardComponent = cardViewMode === 'condensed' ? TeamCardCondensed : TeamCard;

  return (
    <CardComponent
      staff={staff}
      event={event}
      sinceMs={teamTimers?.[staff.team]}
      onStatusChange={onStatusChange}
      onLocationChange={onLocationChange}
      onEdit={onEditTeam}
      onDelete={onDeleteTeam}
      onRefreshPost={onRefreshTeamPost}
      updateEvent={updateEvent}
    />
  );
});



const removeUndefined = <T,>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => removeUndefined(item)) as unknown as T;
  }

  const cleaned = {} as Record<string, unknown>;
  const record = obj as Record<string, unknown>;

  Object.keys(record).forEach((key) => {
    const val = removeUndefined(record[key]);
    if (val !== undefined) cleaned[key] = val;
  });

  return cleaned as unknown as T;
};

export default function DispatchPage({ params }: DispatchPageProps) {
  const [event, setEvent] = useState<EventData | undefined>(undefined);
  const { eventId } = use(params);
  const { user, ready } = useAuth();
  const router = useRouter();
  const [openCallId, setOpenCallId] = useState<string | null>(null);
  const [openClinicCallId, setOpenClinicCallId] = useState<string | null>(null);
  const [teamStatusMap, setTeamStatusMap] = useState<Record<string, Record<string, string>>>({});
  const [showQuickCallForm, setShowQuickCallForm] = useState(false);
  const quickCallRef = useRef<HTMLFormElement>(null);

  const updateEvent = useCallback(async (
    updateInput: Partial<EventData> | ((current: EventData) => Partial<EventData>)
  ) => {
    if (!eventId) return;
    try {
      await runTransaction(db, async (transaction) => {
        const eventRef = doc(db, "events", eventId as string);
        const eventDoc = await transaction.get(eventRef);
        if (!eventDoc.exists()) throw new Error("Event does not exist");

        const currentEvent = eventDoc.data() as EventData;

        let updates: Partial<EventData>;
        if (typeof updateInput === 'function') {
          updates = updateInput(currentEvent);
        } else {
          updates = updateInput;
        }

        transaction.update(eventRef, removeUndefined(updates));
      });
    } catch (error) {
      console.error("Update failed:", error);
      toast.error("Failed to save changes. Please try again.");
    }
  }, [eventId]);

  const {
    postAssignments,
    getCurrentActiveTime,
    handlePostAssignment,
    handleBulkPostAssignment,
    handleClearAllPostAssignments,
    handleUpdatePostingTime,
    refreshAllPostsFromSchedule,
    refreshTeamFromSchedule,
  } = useDispatchSchedule({ event, updateEvent });

  const callDisplayNumberMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!event?.calls) return map;
    [...event.calls]
      .sort((a, b) => parseInt(a.id) - parseInt(b.id))
      .forEach((call, index) => map.set(call.id, index + 1));
    return map;
  }, [event?.calls]);

  const {
    getEquipmentItems,
    handleEquipmentStatusChange,
    handleEquipmentLocationChange,
    handleEquipmentMarkReady,
    handleEquipmentDelete,
    handleResetEquipmentLocations,
    handleAddVenueEquipment,
    getAvailableVenueEquipment
  } = useDispatchEquipment({ event, updateEvent, callDisplayNumberMap });

  const {
    selectedDuplicateCallId,
    setSelectedDuplicateCallId,
    showDuplicateModal,
    setShowDuplicateModal,
    editingCell,
    setEditingCell,
    editValue,
    setEditValue,
    computeCallStatus,
    handleAddTeamToCall,
    handleRemoveTeamFromCall,
    handleMarkDuplicate,
    handleResolveDuplicate,
    handleCellClick,
    handleCellBlur
  } = useDispatchCallsAdvanced({ event, updateEvent, callDisplayNumberMap });
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [showEditTeamModal, setShowEditTeamModal] = useState(false);
  const [quickCall, setQuickCall] = useState({
    location: '',
    source: '',
    age: '',
    gender: '',
    chiefComplaint: '',
    assignedTeam: '',
  });
  const [clinicCall, setClinicCall] = useState({
    age: '',
    gender: '',
    chiefComplaint: '',
  });
  const [teamName, setTeamName] = useState('');
  const [memberName, setMemberName] = useState('');
  const [memberCert, setMemberCert] = useState('');
  const [isTeamLead, setIsTeamLead] = useState(false);
  const [currentMembers, setCurrentMembers] = useState<{ name: string, cert: string, lead: boolean }[]>([]);
  const [editTeamOriginalName, setEditTeamOriginalName] = useState<string | null>(null);
  const LICENSES = ['CPR', 'EMT-B', 'EMT-A', 'EMT-P', 'RN', 'MD/DO'];
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    callId: string;
  } | null>(null);

  const [showResolvedClinicCalls, setShowResolvedClinicCalls] = useState(false);

  const [showAddSupervisorModal, setShowAddSupervisorModal] = useState(false);
  const [showEditSupervisorModal, setShowEditSupervisorModal] = useState(false);
  const [editSupervisorOriginalName, setEditSupervisorOriginalName] = useState<string | null>(null);
  const [showQuickClinicCallForm, setShowQuickClinicCallForm] = useState(false);
  const [showDebugModal, setShowDebugModal] = useState(false);

  // Configure admin emails here or load from environment / Firestore for your deployment.
  // eslint-disable-next-line sonarjs/no-empty-collection
  const ADMIN_EMAILS: string[] = [];
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);




  // --- Admin Action Handlers ---

  const handlePopulateTestData = useCallback(async () => {
    if (!event) return;
    const now = Date.now();
    const testTeams: Staff[] = [
      { team: 'Alpha', members: ['Test User [EMT]'], status: 'Available', location: 'Roaming', log: [{ timestamp: now, message: 'Test data populated' }], originalPost: 'Roaming' },
      { team: 'Bravo', members: ['Test User [Paramedic]'], status: 'Available', location: 'Roaming', log: [{ timestamp: now, message: 'Test data populated' }], originalPost: 'Roaming' },
      { team: 'Charlie', members: ['Test User [RN]'], status: 'Available', location: 'Roaming', log: [{ timestamp: now, message: 'Test data populated' }], originalPost: 'Roaming' }
    ];

    const currentTeamNames = new Set((event.staff || []).map((s: Staff) => s.team));
    const teamsToAdd = testTeams.filter(t => !currentTeamNames.has(t.team));

    if (teamsToAdd.length === 0) {
      toast.info("Test teams (Alpha, Bravo, Charlie) already exist.");
      return;
    }

    await updateEvent({ staff: [...(event.staff || []), ...teamsToAdd] });
    toast.success(`Added ${teamsToAdd.length} test teams.`);
  }, [event, updateEvent]);

  const handleResetAllStatuses = useCallback(async () => {
    if (!event) return;
    const now = Date.now();
    const hhmm = new Date().getHours().toString().padStart(2, '0') + new Date().getMinutes().toString().padStart(2, '0');

    const updatedStaff = (event.staff || []).map((s: Staff) => ({
      ...s,
      status: 'Available',
      location: 'Roaming',
      log: [...(s.log || []), { timestamp: now, message: `${hhmm} - Admin Reset: Status set to Available` }]
    }));

    await updateEvent({ staff: updatedStaff });
    toast.success("All staff statuses reset to Available/Roaming.");
  }, [event, updateEvent]);

  const handleNuclearClear = useCallback(async () => {
    if (!event) return;
    if (!window.confirm("WARNING: This will delete ALL calls and reset ALL logs. Staff will be kept but history wiped. Continue?")) return;

    const now = Date.now();
    const updatedStaff = (event.staff || []).map((s: Staff) => ({
      ...s,
      log: [{ timestamp: now, message: 'System logs cleared by Admin' }],
      status: 'Available',
      location: 'Roaming'
    }));

    const updatedSupervisors = (event.supervisor || []).map(s => ({
      ...s,
      log: [{ timestamp: now, message: 'System logs cleared by Admin' }],
      status: 'Available',
      location: 'Roaming'
    }));

    await updateEvent({
      calls: [],
      staff: updatedStaff,
      supervisor: updatedSupervisors
    });
    toast.error("System Nuke Executed: All calls deleted and logs reset.");
  }, [event, updateEvent]);

  function isDuplicateTeamName(teamName: string, existingStaff: Staff[]): boolean {
    if (!teamName || !existingStaff || existingStaff.length === 0) return false;

    const normalizedName = teamName.toLowerCase().trim();

    console.log('Checking for duplicate team name:', normalizedName);
    console.log('Existing teams:', existingStaff.map(s => s.team.toLowerCase().trim()));

    return existingStaff.some(staff => {
      const existingName = staff.team.toLowerCase().trim();
      const isDuplicate = existingName === normalizedName;
      if (isDuplicate) {
        console.log(`Found duplicate: "${existingName}" matches "${normalizedName}"`);
      }
      return isDuplicate;
    });
  }

  const addMember = () => {
    if (memberName.trim() && memberCert) {
      setCurrentMembers(prev => [...prev, { name: memberName.trim(), cert: memberCert, lead: isTeamLead }]);
      setMemberName('');
      setMemberCert('');
      setIsTeamLead(false);
    }
  };
  const removeMember = (index: number) => {
    setCurrentMembers(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddNewTeam = useCallback(() => {
    setTeamName('');
    setCurrentMembers([]);
    setMemberName('');
    setMemberCert('');
    setIsTeamLead(false);
    setShowAddTeamModal(true);
  }, []);

  const handleAddNewSupervisor = useCallback(() => {
    // Reset only what the 3-field supervisor form needs
    setTeamName('');        // Call Sign
    setMemberName('');      // Supervisor Name (optional)
    setMemberCert('');      // Certification (required)

    // Do NOT touch currentMembers / isTeamLead; those are for teams
    setShowAddSupervisorModal(true);
  }, []);

  // at top of the component (with other hooks)
  const [, setShowAddMenu] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setShowAddMenu(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowAddMenu(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);


  const handleSaveNewSupervisor = useCallback(async () => {
    if (!event) return;

    const callSign = teamName.trim();
    const cert = memberCert.trim();
    // name is optional
    const name = memberName.trim();

    if (!callSign || !cert) {
      alert('Supervisor Call Sign and Certification are required.');
      return;
    }

    // Prevent duplicate call signs
    if (event.supervisor?.some(s => s.team.toLowerCase().trim() === callSign.toLowerCase())) {
      alert(`A supervisor with the call sign "${callSign}" already exists.`);
      return;
    }

    // Build the single-line member string (name may be empty)
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

      // clear fields + close
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

    // Parse "Name [CERT]" into fields
    const match = supervisor.member?.match(/^(.+?)\s\[(.+?)\]$/);
    const name = match ? match[1].trim() : (supervisor.member || '').trim();
    const cert = match ? match[2].trim() : '';

    setMemberName(name);     // optional
    setMemberCert(cert);     // required

    // keep team fields for teams untouched
    setEditSupervisorOriginalName(supervisor.team);
    setShowEditSupervisorModal(true);
  }, []);

  const handleSaveEditedSupervisor = useCallback(async () => {
    if (!event || !editSupervisorOriginalName) return;

    const newCallSign = teamName.trim();
    const cert = memberCert.trim();
    const name = memberName.trim(); // optional

    if (!newCallSign || !cert) {
      alert('Supervisor Call Sign and Certification are required.');
      return;
    }

    // if call sign changed, prevent duplicates
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

    const updatedSupervisor = (event.supervisor || []).map((s: Supervisor) => {
      if (s.team !== editSupervisorOriginalName) return s;
      let msg = `${hhmm} - supervisor edited`;
      if (editSupervisorOriginalName !== newCallSign) {
        msg += ` (renamed from ${editSupervisorOriginalName})`;
      }

      return {
        ...s,
        team: newCallSign,
        member: memberString,
        log: [
          ...(s.log || []),
          {
            timestamp: now.getTime(),
            message: msg,
          },
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

    await updateEvent({
      supervisor: remainingSupervisor
    });
  }, [event, updateEvent]);

  const handleSaveNewTeam = useCallback(async () => {
    if (!teamName || currentMembers.length === 0) {
      alert('Please enter a team name and add at least one member.');
      return;
    }

    const trimmedName = teamName.trim();

    // Pass a function to updateEvent to get the LATEST 'event' from server
    await updateEvent((currentEvent) => {
      // Check for duplicates using the FRESH currentEvent
      if (isDuplicateTeamName(trimmedName, currentEvent.staff || [])) {
        throw new Error(`A team with the name "${trimmedName}" already exists.`);
        // Note: Throwing here cancels the transaction
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

    // UI resets (only runs if transaction didn't throw)
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

    console.log('Attempting to save edited team:', oldName, '->', newName);
    console.log('Current event staff:', event.staff);

    if (oldName !== newName && isDuplicateTeamName(newName, event.staff || [])) {
      alert(`A team with the name "${newName}" already exists. Please choose a different name.`);
      return;
    }

    const membersStrings = currentMembers.map(m => `${m.name} [${m.cert}]${m.lead ? ' (Lead)' : ''}`);

    const now = new Date();
    const hhmm = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0');

    const updatedStaff = (event.staff || []).map((s: Staff) => {
      if (s.team !== oldName) return s;
      let msg = `${hhmm} - team edited`;
      if (oldName !== newName) {
        msg += ` (renamed from ${oldName})`;
      }
      return {
        ...s,
        team: newName,
        members: membersStrings,
        log: [
          ...(s.log || []),
          { timestamp: now.getTime(), message: msg }
        ]
      };
    });

    const updatedCalls = oldName !== newName ? (event.calls || []).map((c: Call) => {
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

    const remainingStaff = (event.staff || []).filter((s: Staff) => s.team !== teamNameToDelete);

    const updatedCalls = (event.calls || []).map((c: Call) => {
      if (!c.assignedTeam?.includes(teamNameToDelete)) return c;

      const newAssigned = (c.assignedTeam || []).filter((t: string) => t !== teamNameToDelete);
      const newStatus =
        newAssigned.length === 0
          ? 'Pending'
          : c.status;

      const log: CallLogEntry = {
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



  const getCallRowClass = (call: Call) => {
    if (!Array.isArray(call.assignedTeam)) return 'bg-surface-deep';

    if (!event) return 'bg-surface-deep';

    const statuses = call.assignedTeam
      .map((t: string) => event?.staff.find((s: Staff) => s.team === t)?.status)
      .filter((status: string | undefined): status is string => status !== undefined);

    if (statuses.some(status => ['En Route', 'On Scene', 'Transporting'].includes(status))) {
      return 'bg-status-red/10';
    }

    return 'bg-surface-deep';
  };






  async function handleAgeSexBlur(callId: string) {
    const call = event?.calls.find(c => c.id === callId);
    if (!call) return;

    const { age, gender } = parseAgeSex(editValue);
    const newAge = age || '';
    const newGender = gender || '';

    const hasChange = (call.age || '') !== newAge || (call.gender || '') !== newGender;
    if (hasChange) {
      const now = new Date();
      const hhmm = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0');
      const updatedCall = {
        ...call,
        age: newAge,
        gender: newGender,
        log: [...(call.log || []), { timestamp: now.getTime(), message: `${hhmm} - Age/Sex set to ${formatAgeSex(newAge, newGender) || 'N/A'}.` }]
      };
      const updated = event!.calls.map(c => c.id === callId ? updatedCall : c);
      await updateEvent({ calls: updated });
    }
    setEditingCell(null);
  }

  const formatAgeSex = (age?: string | number, gender?: string) => {
    return [
      typeof age === 'number' ? String(age) : age?.trim(),
      gender?.trim()
    ]
      .filter(Boolean)
      .join('/');
  };

  const parseAgeSex = (val: string): { age: string; gender: string } => {
    // Don't remove all spaces - keep the original formatting
    // Only capitalize letters that immediately follow numbers
    let processed = val;

    // Replace pattern: digit followed optionally by space(s) followed by lowercase letter
    // Capitalize only the letter that immediately follows the number (with optional space)
    processed = processed.replace(/(\d)\s*([a-z])/g, (match, digit, letter) => {
      return digit + letter.toUpperCase();
    });

    // Now parse the result
    const parts = processed.split(/[,\-\/]/).filter(Boolean);

    let age = '', gender = '';
    if (parts.length === 1) {
      if (/\d/.test(parts[0])) {
        age = parts[0];
      } else {
        gender = parts[0];
      }
    } else if (parts.length >= 2) {
      for (const p of parts) {
        if (!age && /\d/.test(p)) {
          age = p;
        } else if (!gender) {
          gender = p;
        }
      }
    }
    return { age, gender };
  };

  const handleStatusChange = useCallback(async (staff: Staff, newStatus: string) => {
    const updatedStaff = event?.staff?.map(s =>
      s.team === staff.team
        ? {
          ...s,
          status: newStatus,
          log: [
            ...(s.log || []),
            {
              timestamp: Date.now(),
              message: `${new Date().getHours().toString().padStart(2, '0')}${new Date().getMinutes().toString().padStart(2, '0')} - status changed to ${newStatus}`
            }
          ]
        }
        : s
    );
    await updateEvent({
      staff: updatedStaff,
      postAssignments
    });
  }, [event, updateEvent, postAssignments]);

  const handleLocationChange = useCallback(async (staff: Staff, newLocation: string) => {
    const updatedStaff = event?.staff?.map(s =>
      s.team === staff.team
        ? {
          ...s,
          location: newLocation,
          status: newLocation === 'Clinic' && s.status === 'Available' ? 'In Clinic' : s.status,
          log: [
            ...(s.log || []),
            {
              timestamp: Date.now(),
              message: `${new Date().getHours().toString().padStart(2, '0')}${new Date().getMinutes().toString().padStart(2, '0')} - Post changed to ${newLocation}`
            }
          ]
        }
        : s
    );
    await updateEvent({
      staff: updatedStaff,
      postAssignments
    });
  }, [event, updateEvent, postAssignments]);

  const handleSupervisorStatusChange = useCallback((supervisor: Staff, newStatus: string) => {
    const updatedSupervisors = (event?.supervisor || []).map(s =>
      s.team === supervisor.team
        ? {
          ...s,
          status: newStatus,
          log: [
            ...(s.log || []),
            {
              timestamp: Date.now(),
              message: `${new Date().getHours().toString().padStart(2, '0')}${new Date().getMinutes().toString().padStart(2, '0')} - status changed to ${newStatus}`
            }
          ]
        }
        : s
    );
    updateEvent({
      supervisor: updatedSupervisors,
      postAssignments
    });
  }, [event, updateEvent, postAssignments]);

  const handleSupervisorLocationChange = useCallback(async (supervisor: Staff, newLocation: string) => {
    const updatedSupervisors = event?.supervisor.map(s =>
      s.team === supervisor.team
        ? {
          ...s,
          location: newLocation,
          status: newLocation === 'Clinic' && s.status === 'Available' ? 'In Clinic' : s.status, // Changed from 'Available'
          log: [
            ...(s.log || []),
            {
              timestamp: Date.now(),
              message: `${new Date().getHours().toString().padStart(2, '0')}${new Date().getMinutes().toString().padStart(2, '0')} - Post changed to ${newLocation}`
            }
          ]
        }
        : s
    );
    await updateEvent({
      supervisor: updatedSupervisors,
      postAssignments
    });
  }, [event, updateEvent, postAssignments]);



  const handleTogglePriorityFromMenu = useCallback(async (callId: string) => {
    if (!event) return;
    const callToUpdate = event.calls.find(c => c.id === callId);
    if (!callToUpdate) return;
    const newPriority = !callToUpdate.priority;
    const now = new Date();
    const hhmm = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0');
    const updatedCall = {
      ...callToUpdate,
      priority: newPriority,
      log: [...(callToUpdate.log || []), { timestamp: now.getTime(), message: `${hhmm} - Priority marked as ${newPriority ? 'High' : 'Normal'}.` }]
    };
    const updatedCalls = event.calls.map(c => c.id === callId ? updatedCall : c);
    await updateEvent({ calls: updatedCalls });
  }, [event, updateEvent]);

  const getUpdatedCallForStatusChange = (
    c: Call,
    targetCallId: string,
    team: string,
    newStatus: string,
    isEqDetaching: boolean,
    logMessage: string,
    eventData: EventData | null | undefined,
    statusMap: Record<string, Record<string, string>>
  ): Call => {
    if (c.id !== targetCallId) return c;

    const isDetaching = ['Delivered', 'Refusal', 'Unable to Locate', 'NMM', 'Detached', 'Delivering', 'Rolled from Scene'].includes(newStatus);
    const updatedLog = [...(c.log || []), { timestamp: Date.now(), message: logMessage }];

    let updatedAssignedTeam = c.assignedTeam || [];
    let updatedEquipmentTeams = c.equipmentTeams || [];
    const updatedDetachedTeams = [...(c.detachedTeams || [])];

    let newCallStatus = c.status;

    if (isEqDetaching) {
      updatedAssignedTeam = updatedAssignedTeam.filter(t => t !== team);
      updatedEquipmentTeams = updatedEquipmentTeams.filter(t => t !== team);

      if (!updatedDetachedTeams.some(t => t.team === team)) {
        updatedDetachedTeams.push({
          team,
          reason: newStatus === 'Delivered Eq' ? 'Delivered Eq' : 'Detached'
        });
      }
    } else if (isDetaching) {
      updatedAssignedTeam = updatedAssignedTeam.filter(t => t !== team);
      updatedEquipmentTeams = updatedEquipmentTeams.filter(t => t !== team);

      if (!updatedDetachedTeams.some(t => t.team === team)) {
        updatedDetachedTeams.push({ team, reason: newStatus });
      }

      if (['Delivered', 'Refusal', 'NMM'].includes(newStatus)) {
        const supervisorsOnCall = eventData?.supervisor?.filter(s =>
          c.assignedTeam?.includes(s.team)
        ) || [];

        supervisorsOnCall.forEach(supervisor => {
          if (!updatedDetachedTeams.some(t => t.team === supervisor.team)) {
            updatedDetachedTeams.push({ team: supervisor.team, reason: 'Auto-detached' });
          }
        });

        updatedAssignedTeam = updatedAssignedTeam.filter(teamName =>
          !eventData?.supervisor?.some(s => s.team === teamName)
        );
      }

      if (updatedAssignedTeam.length === 0) {
        if (['Delivered', 'NMM', 'Unable to Locate', 'Refusal'].includes(newStatus)) {
          newCallStatus = newStatus;
        } else {
          newCallStatus = 'Resolved';
        }
      } else {
        const remainingStatuses = Object.entries(statusMap[targetCallId] || {})
          .filter(([teamName]) => updatedAssignedTeam.includes(teamName))
          .map(([, status]) => status as string);

        if (remainingStatuses.includes('Transporting')) newCallStatus = 'Transporting';
        else if (remainingStatuses.includes('On Scene')) newCallStatus = 'On Scene';
        else if (remainingStatuses.includes('En Route')) newCallStatus = 'En Route';
      }
    } else if (['On Scene', 'Transporting'].includes(newStatus)) {
      newCallStatus = newStatus;
    }

    const clinicFlag = (newStatus === 'Delivered' || newCallStatus === 'Delivered') ? true : (c.clinic ?? false);
    const displayStatus = newCallStatus === 'Resolved' && newStatus === 'Ambulance' ? 'Rolled' : newCallStatus;

    return {
      ...c,
      status: displayStatus,
      clinic: clinicFlag,
      log: updatedLog,
      assignedTeam: updatedAssignedTeam,
      equipmentTeams: updatedEquipmentTeams,
      detachedTeams: updatedDetachedTeams
    };
  };

  const handleTeamStatusChange = (callId: string, team: string, newStatus: string) => {
    console.log("FUNCTION CALLED", { callId, team, newStatus });
    setTeamStatusMap(prev => {
      const updatedStatusMap = { ...prev };
      if (['Delivered', 'Refusal', 'NMM', 'Detached', 'Delivering', 'Delivered Eq'].includes(newStatus)) {
        // Remove team's status from this call in teamStatusMap when detaching
        if (updatedStatusMap[callId]) {
          delete updatedStatusMap[callId][team];
        }
      } else {
        // Normal update for non-detaching statuses
        updatedStatusMap[callId] = {
          ...(updatedStatusMap[callId] || {}),
          [team]: newStatus
        };
      }
      return updatedStatusMap;
    });

    const latestCall = event?.calls.find(c => c.id === callId);
    if (!latestCall) return;

    const now = new Date();
    const hhmm = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0');
    const logMessage = `${hhmm} - ${team} set to ${newStatus}`;

    // DECLARE newCallStatus here with proper initialization
    const newCallStatus = latestCall.status; // Initialize with current status

    const isEqDetaching = ['Delivered Eq'].includes(newStatus);

    const updatedCalls = (event?.calls || []).map(c => getUpdatedCallForStatusChange(
      c, callId, team, newStatus, isEqDetaching, logMessage, event, teamStatusMap
    ));

    // Rest of the function continues as before...
    const updatedStaff = event?.staff.map(t => {
      console.log('idk')
      if (t.team !== team) return t;

      let updatedLocation = t.location;
      let updatedStatus = newStatus;

      // Handle equipment detachment statuses
      if (['Delivered Eq', 'Detached', 'Refusal', 'NMM', 'Unable to Locate', 'Rolled from Scene'].includes(newStatus)) {
        updatedLocation = t.originalPost || 'Unknown';
        updatedStatus = 'Available';
      } else if (['Delivered', 'In Clinic'].includes(newStatus)) {
        updatedLocation = 'Clinic';
        updatedStatus = 'In Clinic';
      } else if (['En Route', 'On Scene', 'Transporting', 'En Route Eq', 'Assisting'].includes(newStatus)) {
        updatedLocation = latestCall.location;
        updatedStatus = newStatus;
      }

      return {
        ...t,
        status: updatedStatus,
        location: updatedLocation,
      };
    });

    // Handle supervisor status updates when call is complete
    let updatedSupervisor = event?.supervisor;
    if (['Delivered', 'Refusal', 'NMM', 'Rolled'].includes(newCallStatus)) {
      const supervisorsOnCall = event?.supervisor?.filter(s =>
        latestCall.assignedTeam?.includes(s.team)
      ) || [];

      if (supervisorsOnCall.length > 0) {
        updatedSupervisor = event?.supervisor?.map(s => {
          if (supervisorsOnCall.some(supervisor => supervisor.team === s.team)) {
            const teamLogEntry: TeamLogEntry = {
              timestamp: now.getTime(),
              message: `${hhmm} - auto-detached from completed call, status set to Available at Roaming`
            };

            return {
              ...s,
              status: 'Available',
              location: 'Roaming',
              log: [...(s.log || []), teamLogEntry]
            };
          }
          return s;
        });
      }
    }

    // Handle equipment status updates when call / team status changes
    let updatedEquipment = event?.eventEquipment;

    // Determine the call after updates and equipment listed on that call
    const callAfterUpdate = (updatedCalls || event?.calls || []).find(c => c.id === callId);
    const callEquipmentNames = new Set(
      (callAfterUpdate?.equipment || []).map((n: unknown) => (typeof n === 'string' ? n : (n as { name?: string }).name || ''))
    );

    // Equipment currently held by the team that just changed status OR listed on the call
    const teamEquipment = (event?.eventEquipment || []).filter(eq => eq.assignedTeam === team || callEquipmentNames.has(eq.name));

    if (teamEquipment.length > 0) {
      const callAfterUpdate = (updatedCalls || event?.calls || []).find(c => c.id === callId);

      if (isEqDetaching) {
        // Delivered Eq: transfer to patient care team
        updatedEquipment = event?.eventEquipment?.map(eq =>
          eq.assignedTeam === team
            ? {
              ...eq,
              assignedTeam: null,
              status: 'Available',
              location: callAfterUpdate?.assignedTeam?.[0] || 'Clinic'
            }
            : eq
        );
      } else if (newStatus === 'Assisting') {
        // Assisting: keep with assisting team
        updatedEquipment = event?.eventEquipment?.map(eq =>
          eq.assignedTeam === team
            ? {
              ...eq,
              location: team
            }
            : eq
        );
      } else {
        // Case A: Call has no remaining assigned teams → resolve equipment to Clinic
        const noTeamsRemain = !callAfterUpdate?.assignedTeam || callAfterUpdate.assignedTeam.length === 0;
        const callResolvedLike = ['Resolved', 'Delivered', 'Refusal', 'NMM', 'Unable to Locate', 'Rolled'].includes(
          callAfterUpdate?.status || newCallStatus
        );

        if (noTeamsRemain && callResolvedLike) {
          // If the call was Delivered to clinic, mark equipment as In Clinic
          // but keep the same team recorded as the assignedTeam (they delivered it).
          const resolvedStatus = callAfterUpdate?.status || newCallStatus;
          if (resolvedStatus === 'Delivered') {
            updatedEquipment = event?.eventEquipment?.map(eq =>
              eq.assignedTeam === team
                ? {
                  ...eq,
                  // keep assignedTeam so history shows who delivered it
                  assignedTeam: team,
                  status: 'In Clinic' as EquipmentStatus,
                  location: 'Clinic'
                }
                : eq
            );
          } else {
            updatedEquipment = event?.eventEquipment?.map(eq =>
              eq.assignedTeam === team
                ? {
                  ...eq,
                  assignedTeam: null,
                  status: 'Available' as EquipmentStatus,
                  location: 'Clinic'
                }
                : eq
            );
          }
        } else {
          // Other teams remain on the call or the call is still active.
          // Keep equipment marked as In Use and preserve/transfer assignment appropriately.
          let newAssigned = team;
          if (callAfterUpdate?.assignedTeam && callAfterUpdate.assignedTeam.length > 0) {
            newAssigned = callAfterUpdate.assignedTeam.includes(team) ? team : callAfterUpdate.assignedTeam[0];
          }

          updatedEquipment = event?.eventEquipment?.map(eq =>
            eq.assignedTeam === team
              ? {
                ...eq,
                assignedTeam: newAssigned,
                status: 'In Use' as EquipmentStatus,
                location: callAfterUpdate?.location || eq.location || newAssigned || 'Roaming'
              }
              : eq
          );
        }
      }
    }

    // Update the event with all changes
    updateEvent({
      calls: updatedCalls,
      staff: updatedStaff,
      postAssignments,
      ...(updatedSupervisor && { supervisor: updatedSupervisor }),
      ...(updatedEquipment && { eventEquipment: updatedEquipment })
    });
  };

  const [showResolvedCalls, setShowResolvedCalls] = useState(false);

  const [teamSortMode, setTeamSortMode] = useState<'availability' | 'asc' | 'desc'>('availability');
  const [cardViewMode, setCardViewMode] = useState<'normal' | 'condensed'>('normal');

  const getTeamSortValue = (a: Staff, b: Staff, mode: 'availability' | 'asc' | 'desc') => {
    const statusRank = (status: string) => {
      if (status === 'Available') return 0;
      if (['In Clinic', 'On Break'].includes(status)) return 1;
      if (['En Route', 'On Scene', 'Transporting'].includes(status)) return 2;
      return 3;
    };
    if (mode === 'availability') {
      const rA = statusRank(a.status), rB = statusRank(b.status);
      return rA !== rB ? rA - rB : a.team.localeCompare(b.team, undefined, { numeric: true });
    }
    if (mode === 'asc') return a.team.localeCompare(b.team, undefined, { numeric: true });
    if (mode === 'desc') return b.team.localeCompare(a.team, undefined, { numeric: true });
    return 0;
  };

  const [selectedLeftTab, setSelectedLeftTab] = useState<string>('teams');



  useEffect(() => {
    const handleHotkey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        setShowQuickCallForm(true);
        setTimeout(() => {
          (document.querySelector('input[name="callLocation"]') as HTMLInputElement | null)?.focus();
        }, 10);
      }
      if (e.key === 'Escape') {
        setShowQuickCallForm(false);
      }
    };
    window.addEventListener('keydown', handleHotkey);
    return () => window.removeEventListener('keydown', handleHotkey);
  }, []);

  useEffect(() => {
    if (!eventId) {
      console.error('eventId is undefined or null, skipping Firestore subscription');
      return;
    }

    if (!user) {
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'events', eventId), (doc) => {
      if (doc.exists()) {
        const eventData = doc.data() as EventData;
        // Debug: log event document contents to diagnose missing postingTimes

        console.log('Firestore snapshot - eventData:', {
          id: doc.id,
          postingTimes: eventData.postingTimes,
          postAssignments: eventData.postAssignments,
          eventDataSample: {
            id: eventData.id,
            name: eventData.name,
            date: eventData.date,
            eventPostsLength: (eventData.eventPosts || []).length,
            staffLength: (eventData.staff || []).length,
          }
        });

        const userEmail = user.email?.toLowerCase();
        const isSharedUser = eventData.sharedWith?.some((email: string) => email.toLowerCase() === userEmail);

        if (eventData.userId && eventData.userId !== user.uid && !isAdmin && !isSharedUser) {
          console.error('Unauthorized access to event');
          sessionStorage.setItem('redirectPath', `/events/${eventId}/dispatch`);
          router.push('/?login=true&error=unauthorized');
          return;
        }
        setEvent((prev: EventData | undefined) => {
          if (!isEqual(prev, eventData)) {
            return eventData;
          }
          return prev;
        });
      } else {
        setEvent(undefined);
        router.push('/venues/selection');
      }
    }, (error) => {
      console.error('Error fetching event:', error);
      // Handle permission errors
      if (error.code === 'permission-denied') {
        sessionStorage.setItem('redirectPath', `/events/${eventId}/dispatch`);
        router.push('/?login=true&error=unauthorized');
      }
    });

    return () => unsubscribe();
  }, [eventId, user, router, isAdmin]);


  // Close menu when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    const handleScroll = () => setContextMenu(null);

    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('scroll', handleScroll, true);
      return () => {
        document.removeEventListener('click', handleClickOutside);
        document.removeEventListener('scroll', handleScroll, true);
      };
    }
  }, [contextMenu]);



  // Tracks when a team entered its current status, in ms since epoch
  const [teamTimers, setTeamTimers] = useState<{ [team: string]: number }>({});
  // Cache last known status per team so we only update on true status changes
  const lastTeamStatus = useRef<{ [team: string]: string }>({});
  // Cache last known "status since" per team derived from logs to avoid using Date.now() except on true status change
  const lastStatusSince = useRef<{ [team: string]: number }>({});

  // Helper: derive the most recent timestamp when this team entered its current status from its log
  // Helper: derive most recent timestamp when this team entered current status OR location
  function deriveStatusSinceFromLog(team: Staff): number | null {
    if (!team?.log?.length) return null;
    const currentStatus = team.status;
    const currentLocation = team.location;

    for (let i = team.log.length - 1; i >= 0; i--) {
      const entry = team.log[i];
      const msg = entry.message || '';

      // Case 1: Status change matches current status
      if (
        msg.includes('status changed to') &&
        msg.toLowerCase().includes(currentStatus.toLowerCase())
      ) {
        return entry.timestamp || null;
      }

      // Case 2: Post/location change matches current post
      if (
        msg.includes('Post changed to') &&
        msg.toLowerCase().includes(currentLocation.toLowerCase())
      ) {
        return entry.timestamp || null;
      }
    }
    return null;
  }

  const staffSignature = useMemo(() => {
    if (!event?.staff) return '';
    return event.staff
      .map(t => `${t.team}|${t.status}|${t.location}`)
      .join(',');
  }, [event?.staff]);

  function deriveStatusSinceFromLogSupervisor(supervisor: Supervisor): number | null {
    if (!supervisor?.log?.length) return null;

    const currentStatus = supervisor.status;
    const currentLocation = supervisor.location;

    for (let i = supervisor.log.length - 1; i >= 0; i--) {
      const entry = supervisor.log[i];
      const msg = entry.message;

      // Case 1: Status change matches current status
      if (msg.includes('status changed to') && msg.toLowerCase().includes(currentStatus.toLowerCase())) {
        return entry.timestamp;
      }

      // Case 2: Post/location change matches current post
      if (msg.includes('Post changed to') && msg.toLowerCase().includes(currentLocation.toLowerCase())) {
        return entry.timestamp;
      }
    }

    return null;
  }

  useEffect(() => {
    if (!event?.staff && !event?.supervisor) return;

    setTeamTimers(prev => {
      const updated: { [team: string]: number } = { ...prev };
      const currentTeamNames = [
        ...(event.staff?.map(t => t.team) || []),
        ...(event.supervisor?.map(s => s.team) || [])
      ];

      // Handle regular teams
      event.staff?.forEach(team => {
        const key = team.team;
        const status = team.status;
        const location = team.location;
        const hadEntry = key in lastTeamStatus.current;
        const lastKey = lastTeamStatus.current[key];
        const combinedKey = `${status}|${location}`;

        if (!hadEntry) {
          lastTeamStatus.current[key] = combinedKey;
          const fromLog = deriveStatusSinceFromLog(team);
          let seeded = Date.now();
          if (typeof fromLog === 'number') {
            seeded = fromLog;
          } else if (typeof updated[key] === 'number') {
            seeded = updated[key];
          }
          updated[key] = seeded;
          lastStatusSince.current[key] = seeded;
          return;
        }

        if (lastKey !== combinedKey) {
          lastTeamStatus.current[key] = combinedKey;
          const fromLog = deriveStatusSinceFromLog(team);
          const newSince = typeof fromLog === 'number' ? fromLog : Date.now();
          updated[key] = newSince;
          lastStatusSince.current[key] = newSince;
        } else {
          const cached = lastStatusSince.current[key];
          if (typeof cached === 'number') {
            updated[key] = cached;
          }
        }
      });

      // Handle supervisors
      event.supervisor?.forEach(supervisor => {
        const key = supervisor.team;
        const status = supervisor.status;
        const location = supervisor.location;
        const hadEntry = key in lastTeamStatus.current;
        const lastKey = lastTeamStatus.current[key];
        const combinedKey = `${status}|${location}`;

        if (!hadEntry) {
          lastTeamStatus.current[key] = combinedKey;
          const fromLog = deriveStatusSinceFromLogSupervisor(supervisor);
          let seeded = Date.now();
          if (typeof fromLog === 'number') {
            seeded = fromLog;
          } else if (typeof updated[key] === 'number') {
            seeded = updated[key];
          }
          updated[key] = seeded;
          lastStatusSince.current[key] = seeded;
          return;
        }

        if (lastKey !== combinedKey) {
          lastTeamStatus.current[key] = combinedKey;
          const fromLog = deriveStatusSinceFromLogSupervisor(supervisor);
          const newSince = typeof fromLog === 'number' ? fromLog : Date.now();
          updated[key] = newSince;
          lastStatusSince.current[key] = newSince;
        } else {
          const cached = lastStatusSince.current[key];
          if (typeof cached === 'number') {
            updated[key] = cached;
          }
        }
      });

      // Clean up removed teams/supervisors
      Object.keys(updated).forEach(teamKey => {
        if (!currentTeamNames.includes(teamKey)) {
          delete updated[teamKey];
          delete lastTeamStatus.current[teamKey];
          delete lastStatusSince.current[teamKey];
        }
      });

      return updated;
    });
  }, [event?.staff, event?.supervisor, staffSignature]);



  function notifyPostAssignmentChange(reason: string, details: Record<string, unknown>) {
    console.log("Post Assignment Change Notification Triggered", new Date().toLocaleTimeString(), "Reason:", reason, details);
    // Play sound
    const audio = new Audio('/alert.mp3'); // or use a URL
    audio.play();

    // Show toast notification
    toast.info("Reminder: Post Assignments are changing.", {
      position: "top-right",
      autoClose: 10000, // 10 seconds, or set as desired
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      transition: Slide,
    });
  }
  const [showVenueMap, setShowVenueMap] = useState(false);
  const [showPostingSchedule, setShowPostingSchedule] = useState(false);
  const [showEndEvent, setShowEndEvent] = useState(false);

  useEffect(() => {
    const openVenue = () => setShowVenueMap(true);
    const openPosting = () => setShowPostingSchedule(true);
    const openEnd = () => setShowEndEvent(true);

    window.addEventListener('open-venue-map', openVenue);
    window.addEventListener('open-posting-schedule', openPosting);
    window.addEventListener('open-end-event', openEnd);

    return () => {
      window.removeEventListener('open-venue-map', openVenue);
      window.removeEventListener('open-posting-schedule', openPosting);
      window.removeEventListener('open-end-event', openEnd);
    };
  }, []);

  // Tab cycling for left sidebar tabs
  useEffect(() => {
    const tabs = ['teams', 'supervisors', 'equipment'];
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        const activeElement = document.activeElement;
        if (activeElement && ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(activeElement.tagName)) {
          return; // Let normal tab behavior happen
        }
        event.preventDefault();
        const currentIndex = tabs.indexOf(selectedLeftTab);
        const nextIndex = (currentIndex + 1) % tabs.length;
        setSelectedLeftTab(tabs[nextIndex]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedLeftTab]);

  useEffect(() => {
    if (ready && !user) {
      // Store the current path for redirect after login
      sessionStorage.setItem('redirectPath', `/events/${eventId}/dispatch`);
      router.push('/?login=true&error=auth');
    }
  }, [user, ready, router, eventId]);

  // Return early if auth is not ready or user is not authenticated
  if (!ready) {
    return <LoadingScreen label="Loading…" />;
  }

  if (!user) {
    return (
      <div className="w-full bg-surface-deepest min-h-[calc(100vh-72px)] flex items-center justify-center">
        <div className="text-surface-light">Redirecting...</div>
      </div>
    );
  }

  const handleRowClick = (e: React.MouseEvent, id: string) => {
    const target = e.target as HTMLElement;
    if (target.closest('input, textarea, select, Button, a, [contenteditable="true"]')) return;
    setOpenCallId(openCallId === id ? null : id);
  };





  if (!event) return <LoadingScreen label="Loading event…" />;

  const COLW = {
    CALLNO: '5rem',   // Call #
    CC: '10rem',  // Chief Complaint
    AS: '4rem',   // A/S
    STATUS: '9rem',   // Status
    LOC: '10rem',  // Location
  };

  function TableColGroup() {
    return (
      <colgroup>
        <col style={{ width: COLW.CALLNO }} />
        <col style={{ width: COLW.CC }} />
        <col style={{ width: COLW.AS }} />
        <col style={{ width: COLW.STATUS }} />
        <col style={{ width: COLW.LOC }} />
        <col />
      </colgroup>
    );
  }

  const handleDeleteCall = async (callId: string) => {
    if (!event) return;

    // Filter out the call to delete it
    const updatedCalls = event.calls.filter(call => call.id !== callId);

    await updateEvent({ calls: updatedCalls });
    setContextMenu(null);
  };

  let addTooltip = 'Add Equipment';
  if (selectedLeftTab === 'teams') addTooltip = 'Add Team';
  else if (selectedLeftTab === 'supervisors') addTooltip = 'Add Supervisor';

  return (
    <>
      {/* All your modals first - unchanged */}
      <QuickCallModal
        isOpen={showQuickCallForm}
        onClose={() => setShowQuickCallForm(false)}
        event={event}
        updateEvent={updateEvent}
        quickCall={quickCall}
        setQuickCall={setQuickCall}
        formatAgeSex={formatAgeSex}
        parseAgeSex={parseAgeSex}
        quickCallRef={quickCallRef}
      />
      <ClinicWalkupModal
        isOpen={showQuickClinicCallForm}
        onClose={() => setShowQuickClinicCallForm(false)}
        event={event}
        updateEvent={updateEvent}
        clinicCall={clinicCall}
        setClinicCall={setClinicCall}
        formatAgeSex={formatAgeSex}
        parseAgeSex={parseAgeSex}
      />
      <AddTeamModal
        isOpen={showAddTeamModal}
        onClose={() => setShowAddTeamModal(false)}
        mode="create"
        onSubmit={handleSaveNewTeam}
        teamName={teamName}
        setTeamName={setTeamName}
        memberName={memberName}
        setMemberName={setMemberName}
        memberCert={memberCert}
        setMemberCert={setMemberCert}
        isTeamLead={isTeamLead}
        setIsTeamLead={setIsTeamLead}
        addMember={addMember}
        currentMembers={currentMembers}
        removeMember={removeMember}
        LICENSES={LICENSES}
      />
      <AddTeamModal
        isOpen={showEditTeamModal}
        onClose={() => setShowEditTeamModal(false)}
        mode="edit"
        onSubmit={handleSaveEditedTeam}
        teamName={teamName}
        setTeamName={setTeamName}
        memberName={memberName}
        setMemberName={setMemberName}
        memberCert={memberCert}
        setMemberCert={setMemberCert}
        isTeamLead={isTeamLead}
        setIsTeamLead={setIsTeamLead}
        addMember={addMember}
        currentMembers={currentMembers}
        removeMember={removeMember}
        LICENSES={LICENSES}
      />
      <AddSupervisorModal
        isOpen={showAddSupervisorModal}
        onClose={() => setShowAddSupervisorModal(false)}
        mode="create"
        onSubmit={handleSaveNewSupervisor}
        teamName={teamName}
        setTeamName={setTeamName}
        memberName={memberName}
        setMemberName={setMemberName}
        memberCert={memberCert}
        setMemberCert={setMemberCert}
        LICENSES={LICENSES}
      />
      <AddSupervisorModal
        isOpen={showEditSupervisorModal}
        onClose={() => setShowEditSupervisorModal(false)}
        mode="edit"
        onSubmit={handleSaveEditedSupervisor}
        teamName={teamName}
        setTeamName={setTeamName}
        memberName={memberName}
        setMemberName={setMemberName}
        memberCert={memberCert}
        setMemberCert={setMemberCert}
        LICENSES={LICENSES}
      />
      <DebugModal
        isOpen={showDebugModal}
        onClose={() => setShowDebugModal(false)}
        onPopulate={handlePopulateTestData}
        onReset={handleResetAllStatuses}
        onClear={handleNuclearClear}
        event={event}
      />
      {/* Main Layout */}
      <div className="w-full bg-surface-deepest h-[calc(100vh-72px)]">
        <div className="max-w-[1750px] mx-auto px-3 sm:px-4 h-full">
          {isAdmin && (
            <button
              onClick={() => setShowDebugModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/50 rounded hover:bg-red-500 hover:text-white transition-all text-sm font-bold"
            >
              <ShieldAlert className="w-4 h-4" />
              Debug View
            </button>
          )}

          {/* Desktop Layout - Left Sidebar with Select, Right Side with Calls & Clinic */}
          <div className="hidden lg:block h-full">
            <ResizablePanelGroup direction="horizontal" className="gap-2 h-full">

              {/* LEFT SIDEBAR - Select for Teams/Supervisors/Equipment */}
              <ResizablePanel defaultSize={25} minSize={20} maxSize={37}>
                <div className="h-full rounded-xl pb-16">
                  {/* Header with Select and Action Buttons */}
                  <div className="flex justify-between items-center px-4 pt-2 pb-2 border-b border-surface-liner">
                    <Select
                      selectedKeys={[selectedLeftTab]}
                      onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        setSelectedLeftTab(selected);
                      }}
                      aria-label="Select section"
                      className="max-w-[140px]"
                      classNames={{
                        trigger: "bg-surface-deep hover:bg-surface-liner h-10 min-h-10",
                        value: "text-surface-lightest",
                        popoverContent: "bg-surface-deep border-surface-liner",
                      }}
                    >
                      <SelectItem key="teams">Teams</SelectItem>
                      <SelectItem key="supervisors">Supervisors</SelectItem>
                      <SelectItem key="equipment">Equipment</SelectItem>
                    </Select>


                    <div className="flex items-center gap-2">
                      <Tooltip
                        content={addTooltip}
                        placement="top"
                      >
                        <div>
                          <Dropdown>
                            <DropdownTrigger>
                              <Button
                                isIconOnly
                                size="md"
                                variant="flat"
                                className="bg-surface-deep hover:bg-surface-liner"
                                aria-label="Add Team or Supervisor"
                              >
                                <Plus className="h-5 w-5" />
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                              aria-label="Team Actions"
                              onAction={(key) => {
                                if (key === "team") {
                                  handleAddNewTeam();
                                } else if (key === "supervisor") {
                                  handleAddNewSupervisor();
                                }
                              }}
                            >
                              <DropdownItem key="team">Add Team</DropdownItem>
                              <DropdownItem key="supervisor">Add Supervisor</DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        </div>
                      </Tooltip>
                      <Tooltip
                        content={selectedLeftTab === 'teams' ? 'Refresh all team posts from schedule' : 'Update all locations'}
                        placement="top"
                      >
                        <div>
                          <Button
                            isIconOnly
                            size="md"
                            variant="flat"
                            className="bg-surface-deep hover:bg-surface-liner"
                            onPress={refreshAllPostsFromSchedule}
                            aria-label="Update all posts"
                            isDisabled={selectedLeftTab === 'supervisors' || selectedLeftTab === 'equipment'}
                          >
                            <RotateCw className="h-5 w-5" />
                          </Button>
                        </div>
                      </Tooltip>
                      <Tooltip content="Sort and view options" placement="top">
                        <div>
                          <Dropdown
                            classNames={{
                              content: "min-w-[140px] w-[140px] max-w-[140px]", // Adjust dropdown width here
                            }}
                          >
                            <DropdownTrigger>
                              <Button
                                isIconOnly
                                size="md"
                                variant="flat"
                                className="bg-surface-deep hover:bg-surface-liner"
                                aria-label="Sort teams"
                              >
                                <ArrowDownWideNarrow className="h-5 w-5" />
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                              aria-label="Sort and view options"
                            >
                              <DropdownItem
                                key="view-toggle"
                                isReadOnly
                                className="cursor-default hover:bg-transparent px-0 py-0"
                                textValue="View toggle"
                              >
                                <Tabs
                                  selectedKey={cardViewMode}
                                  onSelectionChange={(key) => setCardViewMode(key as 'normal' | 'condensed')}
                                  size="sm"
                                  fullWidth
                                  classNames={{
                                    tabList: "gap-0 w-full bg-surface-deep p-0.5 rounded-lg",
                                    tab: "h-7 data-[selected=true]:text-surface-light data-[hover=true]:opacity-100 transition-colors",
                                    cursor: "bg-surface-liner",
                                  }}
                                >
                                  <Tab
                                    key="normal"
                                    title={
                                      <Tooltip content="Standard card view with full details" placement="top">
                                        <div className="flex items-center gap-1 pointer-events-none">
                                          <Rows2 className="h-4 w-4" />
                                        </div>
                                      </Tooltip>
                                    }
                                  />
                                  <Tab
                                    key="condensed"
                                    title={
                                      <Tooltip content="Compact card view for more teams on screen" placement="top">
                                        <div className="flex items-center gap-1 pointer-events-none">
                                          <Rows4 className="h-4 w-4" />
                                        </div>
                                      </Tooltip>
                                    }
                                  />
                                </Tabs>
                              </DropdownItem>
                              <DropdownItem
                                key="divider"
                                isReadOnly
                                className="p-0 m-0 h-px bg-surface-liner cursor-default"
                                textValue="divider"
                              >
                                <div className="h-px" />
                              </DropdownItem>
                              <DropdownItem
                                key="availability"
                                onClick={() => setTeamSortMode('availability')}
                                className={teamSortMode === 'availability' ? 'bg-surface-liner' : ''}
                              >
                                Availability
                              </DropdownItem>
                              <DropdownItem
                                key="asc"
                                onClick={() => setTeamSortMode('asc')}
                                className={teamSortMode === 'asc' ? 'bg-surface-liner' : ''}
                              >
                                Ascending
                              </DropdownItem>
                              <DropdownItem
                                key="desc"
                                onClick={() => setTeamSortMode('desc')}
                                className={teamSortMode === 'desc' ? 'bg-surface-liner' : ''}
                              >
                                Descending
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        </div>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Content with ScrollShadow */}
                  <div className="h-full overflow-auto scrollbar-hide">
                    <div className="p-4">

                      {/* TEAMS CONTENT */}
                      {selectedLeftTab === 'teams' && (
                        <div className={cardViewMode === 'condensed' ? 'space-y-1.5' : 'space-y-3'}>
                          {[...(event?.staff || [])]
                            .sort((a, b) => getTeamSortValue(a, b, teamSortMode))
                            .map(staff => (
                              <TeamWidget
                                key={staff.team}
                                staff={staff}
                                event={event}
                                callDisplayNumberMap={callDisplayNumberMap}
                                teamTimers={teamTimers}
                                onStatusChange={handleStatusChange}
                                onLocationChange={handleLocationChange}
                                onEditTeam={handleEditTeam}
                                onDeleteTeam={handleDeleteTeam}
                                onRefreshTeamPost={refreshTeamFromSchedule}
                                updateEvent={updateEvent}
                                cardViewMode={cardViewMode}
                              />
                            ))}
                          {(!event?.staff || event.staff.length === 0) && (
                            <div className="text-center text-surface-light/50 py-8">
                              No teams available
                            </div>
                          )}
                        </div>
                      )}

                      {/* SUPERVISORS CONTENT */}
                      {selectedLeftTab === 'supervisors' && (
                        <div className={cardViewMode === 'condensed' ? 'space-y-1.5' : 'space-y-3'}>
                          {event?.supervisor && event.supervisor.length > 0 ? (
                            event.supervisor
                              .sort((a, b) => a.team.localeCompare(b.team, undefined, { numeric: true }))
                              .map(supervisor => {
                                const supervisorAsStaff: Staff = {
                                  team: supervisor.team,
                                  location: supervisor.location,
                                  status: supervisor.status,
                                  members: [supervisor.member],
                                  log: supervisor.log,
                                  originalPost: supervisor.originalPost
                                };

                                return (
                                  <TeamWidget
                                    key={supervisor.team}
                                    staff={supervisorAsStaff}
                                    event={event}
                                    callDisplayNumberMap={callDisplayNumberMap}
                                    teamTimers={teamTimers}
                                    onStatusChange={handleSupervisorStatusChange}
                                    onLocationChange={handleSupervisorLocationChange}
                                    onEditTeam={(staff) => {
                                      const correspondingSupervisor = event.supervisor?.find(s => s.team === staff.team);
                                      if (correspondingSupervisor) {
                                        handleEditSupervisor(correspondingSupervisor);
                                      }
                                    }}
                                    onDeleteTeam={handleDeleteSupervisor}
                                    onRefreshTeamPost={refreshTeamFromSchedule}
                                    updateEvent={updateEvent}
                                    cardViewMode={cardViewMode}
                                  />
                                );
                              })
                          ) : (
                            <div className="text-center text-surface-light/50 py-8">
                              No supervisors assigned
                            </div>
                          )}
                        </div>
                      )}

                      {/* EQUIPMENT CONTENT */}
                      {selectedLeftTab === 'equipment' && (
                        <DispatchEquipmentTab
                          event={event!}
                          teamSortMode={teamSortMode}
                          setTeamSortMode={setTeamSortMode}
                          handleAddVenueEquipment={handleAddVenueEquipment}
                          getAvailableVenueEquipment={getAvailableVenueEquipment}
                          handleResetEquipmentLocations={handleResetEquipmentLocations}
                          getEquipmentItems={getEquipmentItems}
                          handleEquipmentStatusChange={handleEquipmentStatusChange}
                          handleEquipmentLocationChange={handleEquipmentLocationChange}
                          handleEquipmentMarkReady={handleEquipmentMarkReady}
                          handleEquipmentDelete={handleEquipmentDelete}
                          updateEvent={updateEvent}
                          showHeader={false}
                        />
                      )}

                    </div>
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              {/* RIGHT SIDE - Calls and Clinic Stacked */}
              <ResizablePanel defaultSize={75} minSize={50}>
                <div className="h-full overflow-auto scrollbar-hide pt-2 pb-2">
                  <div className="">
                    {/* Call Tracking */}
                    <div className="rounded-xl overflow-hidden">
                      <CallTrackingTable
                        event={event}
                        callDisplayNumberMap={callDisplayNumberMap}
                        showResolvedCalls={showResolvedCalls}
                        setShowResolvedCalls={setShowResolvedCalls}
                        setShowQuickCallForm={setShowQuickCallForm}
                        openCallId={openCallId}
                        setOpenCallId={setOpenCallId}
                        editingCell={editingCell}
                        setEditingCell={setEditingCell}
                        editValue={editValue}
                        setEditValue={setEditValue}
                        teamStatusMap={teamStatusMap}
                        updateEvent={updateEvent}
                        handleCellClick={handleCellClick}
                        handleCellBlur={handleCellBlur}
                        handleAgeSexBlur={handleAgeSexBlur}
                        handleRowClick={handleRowClick}
                        handleMarkDuplicate={handleMarkDuplicate}
                        handleTogglePriorityFromMenu={handleTogglePriorityFromMenu}
                        handleDeleteCall={handleDeleteCall}
                        handleTeamStatusChange={handleTeamStatusChange}
                        handleRemoveTeamFromCall={(callId, team) => handleRemoveTeamFromCall(callId, team, postAssignments)}
                        handleAddTeamToCall={(callId, team) => handleAddTeamToCall(callId, team, postAssignments)}
                        getCallRowClass={getCallRowClass}
                        computeCallStatus={computeCallStatus}
                        formatAgeSex={formatAgeSex}
                        TableColGroup={TableColGroup}
                        PortalDropdown={PortalDropdown as unknown as React.ComponentType<unknown>}
                      />
                    </div>

                    {/* Clinic Tracking */}
                    <div className="rounded-xl overflow-hidden">
                      <ClinicTrackingTable
                        event={event}
                        callDisplayNumberMap={callDisplayNumberMap}
                        showResolvedClinicCalls={showResolvedClinicCalls}
                        setShowResolvedClinicCalls={setShowResolvedClinicCalls}
                        setShowQuickClinicCallForm={setShowQuickClinicCallForm}
                        openClinicCallId={openClinicCallId}
                        setOpenClinicCallId={setOpenClinicCallId}
                        editingCell={editingCell}
                        setEditingCell={setEditingCell}
                        editValue={editValue}
                        setEditValue={setEditValue}
                        updateEvent={updateEvent}
                        handleCellClick={handleCellClick}
                        handleCellBlur={handleCellBlur}
                        handleAgeSexBlur={handleAgeSexBlur}
                        getCallRowClass={getCallRowClass}
                        formatAgeSex={formatAgeSex}
                      />
                    </div>
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>

          {/* Mobile/Tablet Layout - Bottom Tabs */}
          <div className="lg:hidden">
            {/* Background rectangle to cover bottom radius space */}
            <div className="fixed bottom-0 left-0 right-0 h-5 bg-surface-deep z-40"></div>
            <Tabs
              aria-label="Dispatch sections"
              placement="bottom"
              radius="full"
              classNames={{
                base: "w-full",
                tabList: "fixed bottom-0 left-0 right-0 w-full bg-surface-deep border-t border-surface-light/10 z-50",
                cursor: "bg-blue-600",
                tab: "h-10",
                tabContent: "text-lg text-surface-light group-data-[selected=true]:text-surface-lightest"
              }}
            >
              {/* TEAMS TAB */}
              <Tab key="teams" title="Staff">
                <div className="space-y-6 pb-20">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h2 className="text-xl font-bold text-surface-light">Teams</h2>
                      <div className="flex items-center gap-2">
                        <Tooltip content="Add Team or Supervisor" placement="top">
                          <div>
                            <Dropdown>
                              <DropdownTrigger>
                                <Button isIconOnly size="md" variant="flat" aria-label="Add Team or Supervisor">
                                  <Plus className="h-5 w-5" />
                                </Button>
                              </DropdownTrigger>
                              <DropdownMenu
                                aria-label="Team Actions"
                                onAction={(key) => {
                                  if (key === "team") handleAddNewTeam();
                                  else if (key === "supervisor") handleAddNewSupervisor();
                                }}
                              >
                                <DropdownItem key="team">Add Team</DropdownItem>
                                <DropdownItem key="supervisor">Add Supervisor</DropdownItem>
                              </DropdownMenu>
                            </Dropdown>
                          </div>
                        </Tooltip>
                        <Tooltip content="Refresh all team posts from schedule" placement="top">
                          <div>
                            <Button isIconOnly size="md" variant="flat" onPress={refreshAllPostsFromSchedule}>
                              <RotateCw className="h-5 w-5" />
                            </Button>
                          </div>
                        </Tooltip>
                        <Tooltip content="Sort and view options" placement="top">
                          <div>
                            <Dropdown
                              classNames={{
                                content: "min-w-[140px] w-[140px] max-w-[140px]", // Adjust dropdown width here
                              }}
                            >
                              <DropdownTrigger>
                                <Button isIconOnly size="md" variant="flat" aria-label="Sort teams">
                                  <ArrowDownWideNarrow className="h-5 w-5" />
                                </Button>
                              </DropdownTrigger>
                              <DropdownMenu
                                aria-label="Sort and view options"
                              >
                                <DropdownItem
                                  key="view-toggle"
                                  isReadOnly
                                  className="cursor-default hover:bg-transparent px-2 py-1"
                                  textValue="View toggle"
                                >
                                  <Tabs
                                    selectedKey={cardViewMode}
                                    onSelectionChange={(key) => setCardViewMode(key as 'normal' | 'condensed')}
                                    size="sm"
                                    fullWidth
                                    disableAnimation
                                    classNames={{
                                      tabList: "gap-0 w-full bg-surface-deep p-0.5 rounded-lg",
                                      tab: "h-7 px-2 data-[selected=true]:bg-surface-liner data-[selected=true]:text-surface-light data-[hover=true]:opacity-100 transition-colors",
                                      cursor: "bg-surface-liner",
                                    }}
                                  >
                                    <Tab
                                      key="normal"
                                      title={
                                        <Tooltip content="Standard card view with full details" placement="top">
                                          <div className="flex items-center gap-1 pointer-events-none">
                                            <Rows2 className="h-4 w-4" />
                                          </div>
                                        </Tooltip>
                                      }
                                    />
                                    <Tab
                                      key="condensed"
                                      title={
                                        <Tooltip content="Compact card view for more teams on screen" placement="top">
                                          <div className="flex items-center gap-1 pointer-events-none">
                                            <Rows4 className="h-4 w-4" />
                                          </div>
                                        </Tooltip>
                                      }
                                    />
                                  </Tabs>
                                </DropdownItem>
                                <DropdownItem
                                  key="divider"
                                  isReadOnly
                                  className="p-0 m-0 h-px bg-surface-liner cursor-default"
                                  textValue="divider"
                                >
                                  <div className="h-px" />
                                </DropdownItem>
                                <DropdownItem
                                  key="availability"
                                  onClick={() => setTeamSortMode('availability')}
                                  className={teamSortMode === 'availability' ? 'bg-surface-liner' : ''}
                                >
                                  Availability
                                </DropdownItem>
                                <DropdownItem
                                  key="asc"
                                  onClick={() => setTeamSortMode('asc')}
                                  className={teamSortMode === 'asc' ? 'bg-surface-liner' : ''}
                                >
                                  Ascending
                                </DropdownItem>
                                <DropdownItem
                                  key="desc"
                                  onClick={() => setTeamSortMode('desc')}
                                  className={teamSortMode === 'desc' ? 'bg-surface-liner' : ''}
                                >
                                  Descending
                                </DropdownItem>
                              </DropdownMenu>
                            </Dropdown>
                          </div>
                        </Tooltip>
                      </div>
                    </div>
                    <div className={cardViewMode === 'condensed' ? 'space-y-1.5' : 'space-y-3'}>
                      <div className="grid grid-cols-1 gap-3">
                        {[...(event?.staff || [])]
                          .sort((a, b) => getTeamSortValue(a, b, teamSortMode))
                          .map(staff => (
                            <TeamWidget
                              key={staff.team}
                              staff={staff}
                              event={event}
                              callDisplayNumberMap={callDisplayNumberMap}
                              teamTimers={teamTimers}
                              onStatusChange={handleStatusChange}
                              onLocationChange={handleLocationChange}
                              onEditTeam={handleEditTeam}
                              onDeleteTeam={handleDeleteTeam}
                              onRefreshTeamPost={refreshTeamFromSchedule}
                              updateEvent={updateEvent}
                              cardViewMode={cardViewMode}
                            />
                          ))}
                      </div>
                    </div>
                  </div>

                  {event?.supervisor && event.supervisor.length > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h2 className="text-xl font-bold text-surface-light">Supervisors</h2>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {event.supervisor
                          ?.sort((a, b) => a.team.localeCompare(b.team, undefined, { numeric: true }))
                          .map(supervisor => {
                            const supervisorAsStaff: Staff = {
                              team: supervisor.team,
                              location: supervisor.location,
                              status: supervisor.status,
                              members: [supervisor.member],
                              log: supervisor.log,
                              originalPost: supervisor.originalPost
                            };
                            return (
                              <TeamWidget
                                key={supervisor.team}
                                staff={supervisorAsStaff}
                                event={event}
                                callDisplayNumberMap={callDisplayNumberMap}
                                teamTimers={teamTimers}
                                onStatusChange={handleStatusChange}
                                onLocationChange={handleLocationChange}
                                onEditTeam={(staff) => {
                                  const correspondingSupervisor = event.supervisor?.find(s => s.team === staff.team);
                                  if (correspondingSupervisor) handleEditSupervisor(correspondingSupervisor);
                                }}
                                onDeleteTeam={handleDeleteSupervisor}
                                onRefreshTeamPost={refreshTeamFromSchedule}
                                updateEvent={updateEvent}
                                cardViewMode={cardViewMode}
                              />
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              </Tab>

              {/* EQUIPMENT TAB */}
              <Tab key="equipment" title="Equipment">
                <div className="space-y-6 pb-20">
                  <DispatchEquipmentTab
                    event={event!}
                    teamSortMode={teamSortMode}
                    setTeamSortMode={setTeamSortMode}
                    handleAddVenueEquipment={handleAddVenueEquipment}
                    getAvailableVenueEquipment={getAvailableVenueEquipment}
                    handleResetEquipmentLocations={handleResetEquipmentLocations}
                    getEquipmentItems={getEquipmentItems}
                    handleEquipmentStatusChange={handleEquipmentStatusChange}
                    handleEquipmentLocationChange={handleEquipmentLocationChange}
                    handleEquipmentMarkReady={handleEquipmentMarkReady}
                    handleEquipmentDelete={handleEquipmentDelete}
                    updateEvent={updateEvent}
                    showHeader={true}
                  />
                </div>
              </Tab>

              <Tab key="calls" title="Calls">
                <div className="space-y-6 pb-20">
                  <DispatchCallsTab
                    event={event!}
                    updateEvent={updateEvent}
                    callDisplayNumberMap={callDisplayNumberMap}
                    showResolvedCalls={showResolvedCalls}
                    setShowResolvedCalls={setShowResolvedCalls}
                    setShowQuickCallForm={setShowQuickCallForm}
                    handleRemoveTeamFromCall={(callId, team) => handleRemoveTeamFromCall(callId, team, postAssignments)}
                    handleAddTeamToCall={(callId, team) => handleAddTeamToCall(callId, team, postAssignments)}
                    handleTeamStatusChange={handleTeamStatusChange}
                    handleMarkDuplicate={handleMarkDuplicate}
                    handleTogglePriorityFromMenu={handleTogglePriorityFromMenu}
                    handleDeleteCall={handleDeleteCall}
                    formatAgeSex={formatAgeSex}
                    parseAgeSex={parseAgeSex}
                  />
                </div>
              </Tab>

              {/* CLINIC TAB */}
              <Tab key="clinic" title="Clinic">
                <div className="space-y-6 pb-20">
                  <DispatchClinicTab
                    event={event!}
                    updateEvent={updateEvent}
                    callDisplayNumberMap={callDisplayNumberMap}
                    showResolvedClinicCalls={showResolvedClinicCalls}
                    setShowResolvedClinicCalls={setShowResolvedClinicCalls}
                    setShowQuickClinicCallForm={setShowQuickClinicCallForm}
                    handleDeleteCall={handleDeleteCall}
                    getCallRowClass={getCallRowClass}
                    formatAgeSex={formatAgeSex}
                    parseAgeSex={parseAgeSex}
                  />
                </div>
              </Tab>
            </Tabs>
          </div>
        </div>
      </div>

      {/* All your existing modals - unchanged */}
      {event?.venue && (
        <VenueMapModal
          isOpen={showVenueMap}
          onClose={() => setShowVenueMap(false)}
          layers={
            event.venue.layers && event.venue.layers.length
              ? event.venue.layers
              : [
                {
                  id:
                    typeof crypto !== 'undefined' && 'randomUUID' in crypto
                      ? (crypto as unknown as { randomUUID?: () => string }).randomUUID?.() ?? `layer-${Date.now()}`
                      : `layer-${Date.now()}`,
                  name: event.venue.name || 'Main Floor',
                  posts: event.eventPosts || [],
                  mapUrl: event.venue.mapUrl,
                },
              ]
          }
          staff={event.staff || []}
          equipment={event.eventEquipment || []}
          teamTimers={teamTimers}
        />
      )}

      <PostingScheduleModal
        isOpen={showPostingSchedule}
        onClose={() => setShowPostingSchedule(false)}
        event={event}
        postAssignments={postAssignments}
        onPostAssignment={handlePostAssignment}
        onBulkPostAssignment={handleBulkPostAssignment}
        onClearAllPostAssignments={handleClearAllPostAssignments}
        onUpdatePostingTime={handleUpdatePostingTime}
        getCurrentActiveTime={getCurrentActiveTime}
        updateEvent={updateEvent}
        notifyPostAssignmentChange={notifyPostAssignmentChange}
      />

      <EndEventModal
        open={showEndEvent}
        onClose={() => setShowEndEvent(false)}
        onEndNoSummary={async () => { }}
        onQuickSummary={async () => router.push(`/events/${event.id}/summary`)}
      />

      {showDuplicateModal && selectedDuplicateCallId && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[100] flex items-center justify-center" onClick={() => setShowDuplicateModal(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-surface-deepest border border-surface-liner text-surface-light rounded-2xl p-6 w-full max-w-2xl shadow-xl space-y-4"
          >
            <h2 className="text-2xl font-bold text-surface mb-4">Select Original Call</h2>
            <p className="text-surface-light mb-4">
              Call #{callDisplayNumberMap.get(selectedDuplicateCallId)} is a duplicate of which call?
            </p>
            <div className="max-h-80 overflow-y-auto border border-surface-liner rounded">
              <table className="w-full text-sm">
                <thead className="bg-surface-deep sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-surface-light">Call #</th>
                    <th className="px-3 py-2 text-left text-surface-light">Chief Complaint</th>
                    <th className="px-3 py-2 text-left text-surface-light">Age</th>
                    <th className="px-3 py-2 text-left text-surface-light">Sex</th>
                    <th className="px-3 py-2 text-left text-surface-light">Location</th>
                    <th className="px-3 py-2 text-left text-surface-light">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {event?.calls
                    .filter(call => call.id !== selectedDuplicateCallId && !["Delivered", "Refusal", "NMM", "Resolved"].includes(call.status))
                    .sort((a, b) => parseInt(a.id) - parseInt(b.id))
                    .map(call => (
                      <tr key={call.id} className="border-b border-surface-liner hover:bg-surface-deep">
                        <td className="px-3 py-2">{callDisplayNumberMap.get(call.id)}</td>
                        <td className="px-3 py-2">{call.chiefComplaint || 'N/A'}</td>
                        <td className="px-3 py-2">{call.age || 'N/A'}</td>
                        <td className="px-3 py-2">{call.gender || 'N/A'}</td>
                        <td className="px-3 py-2">{call.location || 'N/A'}</td>
                        <td className="px-3 py-2">
                          <Button
                            onClick={() => handleResolveDuplicate(selectedDuplicateCallId, call.id, postAssignments)}
                            className="px-3 py-1 bg-status-red hover:bg-status-red/80 text-white rounded text-sm"
                          >
                            Select
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {event?.calls.filter(call => call.id !== selectedDuplicateCallId && !["Delivered", "Refusal", "NMM", "Resolved"].includes(call.status)).length === 0 && (
              <p className="text-surface-light text-center py-4">No active calls available to mark as original.</p>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <Button
                onClick={() => setShowDuplicateModal(false)}
                className="px-4 py-2 rounded bg-surface-deep hover:bg-surface-liner text-surface-light"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}