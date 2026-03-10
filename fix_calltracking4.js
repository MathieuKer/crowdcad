const fs = require('fs');
let content = fs.readFileSync('src/components/dispatch/calltracking.tsx', 'utf-8');
let lines = content.split('\n');

const applySplice = (startLine, endLine, newContentStr) => {
    const newLines = newContentStr.split('\n');
    lines.splice(startLine - 1, (endLine - startLine) + 1, ...newLines);
};

const addTeamContent = \`                                  <DropdownMenuSubContent className="bg-surface-deep border-surface-liner">
                                    {event.staff?.filter(s => s.status === 'Available' && !isTeamOnActiveCall(event.calls, s.team)).map(s => (
                                      <DropdownMenuItem
                                        key={s.team}
                                        className="text-surface-light hover:bg-surface-liner focus:bg-surface-liner cursor-pointer"
                                        onClick={() => handleAddTeamToCall(call.id, s.team)}
                                      >
                                        {s.team}
                                      </DropdownMenuItem>
                                    ))}
                                    {event.staff?.filter(s => ['In Clinic', 'On Break'].includes(s.status) && !isTeamOnActiveCall(event.calls, s.team)).map(s => (
                                      <DropdownMenuItem
                                        key={s.team}
                                        className="text-surface-light hover:bg-surface-liner focus:bg-surface-liner cursor-pointer bg-status-blue/20"
                                        onClick={() => handleAddTeamToCall(call.id, s.team)}
                                      >
                                        {s.team}
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuSubContent>\`;

applySplice(451, 494, addTeamContent); // Replace Add Team Menu

const helpers = \`
const assignSupervisorToCall = async (
  event: Event,
  call: Call,
  supervisor: Supervisor,
  callDisplayNumberMap: Map<string, number>,
  updateEvent: (updates: Partial<Event>) => Promise<void>
) => {
  const now = new Date();
  const hhmm = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0');
  const match = supervisor.member.match(/^(.+?)\\\\s\\\\[(.+?)\\\\]/);
  const memberName = match ? match[1] : supervisor.member;

  const callLogEntry = {
    timestamp: now.getTime(),
    message: \\\`\${hhmm} - Supervisor \${memberName} (\${supervisor.team}) assigned to call.\\\`
  };
  const teamLogEntry = {
    timestamp: now.getTime(),
    message: \\\`\${hhmm} - responding to call #\${callDisplayNumberMap.get(call.id)} (supervisor support)\\\`
  };

  const updatedCall = {
    ...call,
    assignedTeam: [...(call.assignedTeam || []), supervisor.team],
    status: call.assignedTeam?.length ? call.status : 'Assigned',
    log: [...(call.log || []), callLogEntry]
  };

  const updatedSupervisor = event.supervisor?.map((s: Supervisor) =>
    s.team === supervisor.team
      ? {
          ...s,
          status: 'En Route',
          location: call.location,
          originalPost: s.location || 'Unknown',
          log: [...(s.log || []), teamLogEntry]
        }
      : s
  );

  const updatedCalls = event.calls.map((c: Call) => (c.id === call.id ? updatedCall : c));

  await updateEvent({
    calls: updatedCalls,
    supervisor: updatedSupervisor
  });
};

const assignEquipmentToCall = async (
  event: Event,
  call: Call,
  equipment: Equipment,
  teamName: string,
  isSupervisor: boolean,
  callDisplayNumberMap: Map<string, number>,
  updateEvent: (updates: Partial<Event>) => Promise<void>
) => {
  const now = new Date();
  const hhmm = now.getHours().toString().padStart(2, '0') + now.getMinutes().toString().padStart(2, '0');

  const updatedEquipment = event.eventEquipment?.map((eq: Equipment) =>
    eq.id === equipment.id
      ? {
          ...eq,
          status: 'In Use' as EquipmentStatus,
          assignedTeam: teamName,
          location: call.location
        }
      : eq
  );

  let memberName = teamName;
  if (isSupervisor) {
    const sup = event.supervisor?.find(s => s.team === teamName);
    if (sup) {
        const match = sup.member.match(/^(.+?)\\\\s\\\\[(.+?)\\\\]/);
      memberName = \\\`Supervisor \${match ? match[1] : sup.member} (\${teamName})\\\`;
    }
  }

  const callLogEntry = {
    timestamp: now.getTime(),
    message: \\\`\${hhmm} - \${equipment.name} assigned to \${memberName} for this call.\\\`
  };

  const teamLogEntry = {
    timestamp: now.getTime(),
    message: \\\`\${hhmm} - responding to call #\${callDisplayNumberMap.get(call.id)} with \${equipment.name}\\\`
  };

  const updatedCall = {
    ...call,
    assignedTeam: [...(call.assignedTeam || []), teamName],
    equipment: [...(call.equipment || []), equipment.name],
    equipmentTeams: [...(call.equipmentTeams || []), teamName],
    status: 'Assigned',
    log: [...(call.log || []), callLogEntry]
  };

  const updatedCalls = event.calls.map((c: Call) => c.id === call.id ? updatedCall : c);

  if (isSupervisor) {
    const updatedSupervisor = event.supervisor?.map((s: Supervisor) =>
      s.team === teamName
        ? {
            ...s,
            status: 'En Route Eq',
            location: call.location,
            originalPost: s.location || 'Unknown',
            log: [...(s.log || []), teamLogEntry]
          }
        : s
    );

    await updateEvent({
      calls: updatedCalls,
      supervisor: updatedSupervisor,
      eventEquipment: updatedEquipment
    });
  } else {
    const updatedStaff = event.staff.map((t: Staff) =>
      t.team === teamName
        ? {
            ...t,
            status: 'En Route Eq',
            location: call.location,
            originalPost: t.location || 'Unknown',
            log: [...(t.log || []), teamLogEntry]
          }
        : t
    );

    await updateEvent({
      calls: updatedCalls,
      staff: updatedStaff,
      eventEquipment: updatedEquipment
    });
  }
};

const isTeamOnActiveCall = (calls: Call[] | undefined, team: string) => {
  if (!calls) return false;
  return calls.some(
    (c: Call) =>
      c.assignedTeam?.includes(team) &&
      !['Resolved', 'Delivered', 'Refusal', 'NMM', 'Rolled'].includes(c.status)
  );
};

export const CallTrackingTable: React.FC<CallTrackingTableProps> = ({
\`;

applySplice(147, 147, helpers); // Inject helpers directly at Line 147

let finalContent = lines.join('\\n');
fs.writeFileSync('src/components/dispatch/calltracking.tsx', finalContent);
