const fs = require('fs');
let fileContent = fs.readFileSync('src/components/dispatch/calltracking.tsx', 'utf-8');

const replaceBlock = (str, startStr, endStr, newBlock) => {
    let startIndex = str.indexOf(startStr);
    if (startIndex === -1) {
        console.error('Failed to find start:', startStr.substring(0, 40));
        return str;
    }
    let endIndex = str.indexOf(endStr, startIndex);
    if (endIndex === -1) {
        console.error('Failed to find end:', endStr.substring(0, 40));
        return str;
    }
    endIndex += endStr.length;
    return str.substring(0, startIndex) + newBlock + str.substring(endIndex);
};

const replaceAllBlocks = (str, startStr, endStr, newBlock) => {
    let modified = str;
    let safety = 0;
    while (modified.indexOf(startStr) !== -1 && safety < 20) {
        safety++;
        let nextStr = replaceBlock(modified, startStr, endStr, newBlock);
        if (nextStr === modified) break;
        modified = nextStr;
    }
    return modified;
};

const addTeamStart = '<DropdownMenuSubContent className="bg-surface-deep border-surface-liner">\\r\\n                                    {(() => {\\r\\n                                      const allTeams';
const addTeamEnd = '];\\r\\n                                    })()}\\r\\n                                  </DropdownMenuSubContent>';

const addTeamReplace = \`<DropdownMenuSubContent className="bg-surface-deep border-surface-liner">
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

const addSupStart = '<DropdownMenuSubContent className="bg-surface-deep border-surface-liner">\\r\\n                                  {event.supervisor';
const addSupEnd = 'No supervisors available\\r\\n                                      </DropdownMenuItem>\\r\\n                                    )}\\r\\n                                </DropdownMenuSubContent>';

const addSupReplace = \`<DropdownMenuSubContent className="bg-surface-deep border-surface-liner">
                                  {event.supervisor
                                    ?.filter((supervisor: Supervisor) => {
                                      const notAssignedToThisCall = !call.assignedTeam?.includes(supervisor.team);
                                      const notAssignedToAnyActiveCall = !isTeamOnActiveCall(event.calls, supervisor.team);
                                      const hasValidStatus = ['Available', 'In Clinic', 'On Break'].includes(supervisor.status);
                                      return notAssignedToThisCall && notAssignedToAnyActiveCall && hasValidStatus;
                                    })
                                    .map((supervisor: Supervisor) => {
                                      const match = supervisor.member.match(/^(.+?)\\s\\[(.+?)\\]/);
                                      const memberName = match ? match[1] : supervisor.member;
                                      const isInactive = ['In Clinic', 'On Break'].includes(supervisor.status);
                                      return (
                                        <DropdownMenuItem
                                          key={\`supervisor-\${supervisor.team}\`}
                                          className={\`text-surface-light hover:bg-surface-liner focus:bg-surface-liner cursor-pointer \${isInactive ? 'bg-status-blue/20' : ''}\`}
                                          onClick={() => assignSupervisorToCall(event, call, supervisor, callDisplayNumberMap, updateEvent)}
                                        >
                                          {memberName} ({supervisor.team})
                                        </DropdownMenuItem>
                                      );
                                    })}
                                  {(!event.supervisor || event.supervisor.filter((supervisor: Supervisor) => {
                                    const notAssignedToThisCall = !call.assignedTeam?.includes(supervisor.team);
                                    const isAvailable = supervisor.status === 'Available' || !isTeamOnActiveCall(event.calls, supervisor.team);
                                    return notAssignedToThisCall && isAvailable;
                                  }).length === 0) && (
                                      <DropdownMenuItem disabled className="text-surface-light/50">
                                        No supervisors available
                                      </DropdownMenuItem>
                                    )}
                                </DropdownMenuSubContent>\`;


const eqSupClickStart1 = 'onClick={async () => {\\r\\n                                                        const now = new Date();';
const eqSupClickEnd1 =   'await updateEvent({\\r\\n                                                          calls: updatedCalls,\\r\\n                                                          supervisor: updatedSupervisor,\\r\\n                                                          eventEquipment: updatedEquipment\\r\\n                                                        });\\r\\n                                                      }}';
const eqSupClickRep1 = 'onClick={() => assignEquipmentToCall(event, call, equipment, supervisor.team, true, callDisplayNumberMap, updateEvent)}';

const eqTeamClickStart2 = 'onClick={async () => {\\r\\n                                                      const now = new Date();';
const eqTeamClickEnd2 =   'await updateEvent({\\r\\n                                                        calls: updatedCalls,\\r\\n                                                        staff: updatedStaff,\\r\\n                                                        eventEquipment: updatedEquipment\\r\\n                                                      });\\r\\n                                                    }}';
const eqTeamClickRep2 = 'onClick={() => assignEquipmentToCall(event, call, equipment, team.team, false, callDisplayNumberMap, updateEvent)}';


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
  const match = supervisor.member.match(/^(.+?)\\s\\[(.+?)\\]/);
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
      const match = sup.member.match(/^(.+?)\\s\\[(.+?)\\]/);
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

export const CallTrackingTable: React.FC<CallTrackingTableProps> = ({\`;


// Since the file uses \r\n, to make it cross-platform robust for the search strings:
fileContent = fileContent.replace(/\\r\\n/g, '\\n');

const addTeamStartN = addTeamStart.replace(/\\r\\n/g, '\\n');
const addTeamEndN = addTeamEnd.replace(/\\r\\n/g, '\\n');
fileContent = replaceBlock(fileContent, addTeamStartN, addTeamEndN, addTeamReplace);

const addSupStartN = addSupStart.replace(/\\r\\n/g, '\\n');
const addSupEndN = addSupEnd.replace(/\\r\\n/g, '\\n');
fileContent = replaceBlock(fileContent, addSupStartN, addSupEndN, addSupReplace);

const eqSupClickStart1N = eqSupClickStart1.replace(/\\r\\n/g, '\\n');
const eqSupClickEnd1N = eqSupClickEnd1.replace(/\\r\\n/g, '\\n');
fileContent = replaceAllBlocks(fileContent, eqSupClickStart1N, eqSupClickEnd1N, eqSupClickRep1);

const eqTeamClickStart2N = eqTeamClickStart2.replace(/\\r\\n/g, '\\n');
const eqTeamClickEnd2N = eqTeamClickEnd2.replace(/\\r\\n/g, '\\n');
fileContent = replaceAllBlocks(fileContent, eqTeamClickStart2N, eqTeamClickEnd2N, eqTeamClickRep2);

fileContent = fileContent.replace('export const CallTrackingTable: React.FC<CallTrackingTableProps> = ({', helpers);
fileContent = fileContent.replace('  DropdownItem,\\n  DropdownItem,', '  DropdownItem,');

fs.writeFileSync('src/components/dispatch/calltracking.tsx', fileContent);
