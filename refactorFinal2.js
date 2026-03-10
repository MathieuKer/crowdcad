const fs = require('fs');
let fileContent = fs.readFileSync('src/components/dispatch/calltracking.tsx', 'utf-8');

const replaceBlock = (str, startStr, endStr, newBlock) => {
    let startIndex = str.indexOf(startStr);
    if (startIndex === -1) return str;
    let endIndex = str.indexOf(endStr, startIndex);
    if (endIndex === -1) return str;
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

const addTeamStart = '<DropdownMenuSubContent className="bg-surface-deep border-surface-liner">\\n                                    {(() => {\\n                                      const allTeams';
const addTeamEnd = '];\\n                                    })()}\\n                                  </DropdownMenuSubContent>';

const addTeamReplace =
    '<DropdownMenuSubContent className="bg-surface-deep border-surface-liner">\\n' +
    '                                  {event.staff?.filter(s => s.status === \\'Available\\' && !isTeamOnActiveCall(event.calls, s.team)).map(s => (\\n' +
        '                                    <DropdownMenuItem\\n' +
        '                                      key={s.team}\\n' +
        '                                      className="text-surface-light hover:bg-surface-liner focus:bg-surface-liner cursor-pointer"\\n' +
        '                                      onClick={() => handleAddTeamToCall(call.id, s.team)}\\n' +
        '                                    >\\n' +
        '                                      {s.team}\\n' +
        '                                    </DropdownMenuItem>\\n' +
        '                                  ))}\\n' +
        '                                  {event.staff?.filter(s => [\\'In Clinic\\', \\'On Break\\'].includes(s.status) && !isTeamOnActiveCall(event.calls, s.team)).map(s => (\\n' +
            '                                    <DropdownMenuItem\\n' +
            '                                      key={s.team}\\n' +
            '                                      className="text-surface-light hover:bg-surface-liner focus:bg-surface-liner cursor-pointer bg-status-blue/20"\\n' +
            '                                      onClick={() => handleAddTeamToCall(call.id, s.team)}\\n' +
            '                                    >\\n' +
            '                                      {s.team}\\n' +
            '                                    </DropdownMenuItem>\\n' +
            '                                  ))}\\n' +
            '                                </DropdownMenuSubContent>';

const addSupStart = '<DropdownMenuSubContent className="bg-surface-deep border-surface-liner">\\n                                  {event.supervisor';
const addSupEnd = 'No supervisors available\\n                                      </DropdownMenuItem>\\n                                    )}\\n                                </DropdownMenuSubContent>';

const addSupReplace =
    '<DropdownMenuSubContent className="bg-surface-deep border-surface-liner">\\n' +
    '                                  {event.supervisor\\n' +
    '                                    ?.filter((supervisor: Supervisor) => {\\n' +
    '                                      const notAssignedToThisCall = !call.assignedTeam?.includes(supervisor.team);\\n' +
    '                                      const notAssignedToAnyActiveCall = !isTeamOnActiveCall(event.calls, supervisor.team);\\n' +
    '                                      const hasValidStatus = [\\'Available\\', \\'In Clinic\\', \\'On Break\\'].includes(supervisor.status);\\n' +
        '                                      return notAssignedToThisCall && notAssignedToAnyActiveCall && hasValidStatus;\\n' +
        '                                    })\\n' +
        '                                    .map((supervisor: Supervisor) => {\\n' +
        '                                      const match = supervisor.member.match(/^(.+?)\\\\s\\\\[(.+?)\\\\]/);\\n' +
        '                                      const memberName = match ? match[1] : supervisor.member;\\n' +
        '                                      const isInactive = [\\'In Clinic\\', \\'On Break\\'].includes(supervisor.status);\\n' +
            '                                      return (\\n' +
            '                                        <DropdownMenuItem\\n' +
            '                                          key={`supervisor-\\${supervisor.team}`}\\n' +
            '                                          className={`text-surface-light hover:bg-surface-liner focus:bg-surface-liner cursor-pointer \\${isInactive ? \\'bg - status - blue / 20\\' : \\'\\'}`}\\n' +
                '                                          onClick={() => assignSupervisorToCall(event, call, supervisor, callDisplayNumberMap, updateEvent)}\\n' +
                '                                        >\\n' +
                '                                          {memberName} ({supervisor.team})\\n' +
                '                                        </DropdownMenuItem>\\n' +
                '                                      );\\n' +
                '                                    })}\\n' +
                '                                  {(!event.supervisor || event.supervisor.filter((supervisor: Supervisor) => {\\n' +
                '                                    const notAssignedToThisCall = !call.assignedTeam?.includes(supervisor.team);\\n' +
                '                                    const isAvailable = supervisor.status === \\'Available\\' || !isTeamOnActiveCall(event.calls, supervisor.team);\\n' +
                    '                                    return notAssignedToThisCall && isAvailable;\\n' +
                    '                                  }).length === 0) && (\\n' +
                    '                                      <DropdownMenuItem disabled className="text-surface-light/50">\\n' +
                    '                                        No supervisors available\\n' +
                    '                                      </DropdownMenuItem>\\n' +
                    '                                    )}\\n' +
                    '                                </DropdownMenuSubContent>';

const eqSupClickStart1 = 'onClick={async () => {\\n                                                        const now = new Date();';
const eqSupClickEnd1 = 'await updateEvent({\\n                                                          calls: updatedCalls,\\n                                                          supervisor: updatedSupervisor,\\n                                                          eventEquipment: updatedEquipment\\n                                                        });\\n                                                      }}';
const eqSupClickRep1 = 'onClick={() => assignEquipmentToCall(event, call, equipment, supervisor.team, true, callDisplayNumberMap, updateEvent)}';

const eqTeamClickStart2 = 'onClick={async () => {\\n                                                      const now = new Date();';
const eqTeamClickEnd2 = 'await updateEvent({\\n                                                        calls: updatedCalls,\\n                                                        staff: updatedStaff,\\n                                                        eventEquipment: updatedEquipment\\n                                                      });\\n                                                    }}';
const eqTeamClickRep2 = 'onClick={() => assignEquipmentToCall(event, call, equipment, team.team, false, callDisplayNumberMap, updateEvent)}';

const helpers =
    '\\nconst assignSupervisorToCall = async (\\n' +
    '  event: Event,\\n' +
    '  call: Call,\\n' +
    '  supervisor: Supervisor,\\n' +
    '  callDisplayNumberMap: Map<string, number>,\\n' +
    '  updateEvent: (updates: Partial<Event>) => Promise<void>\\n' +
    ') => {\\n' +
    '  const now = new Date();\\n' +
    '  const hhmm = now.getHours().toString().padStart(2, \\'0\\') + now.getMinutes().toString().padStart(2, \\'0\\');\\n' +
        '  const match = supervisor.member.match(/^(.+?)\\\\s\\\\[(.+?)\\\\]/);\\n' +
        '  const memberName = match ? match[1] : supervisor.member;\\n' +
        '\\n' +
        '  const callLogEntry = {\\n' +
        '    timestamp: now.getTime(),\\n' +
        '    message: `\\${hhmm} - Supervisor \\${memberName} (\\${supervisor.team}) assigned to call.`\\n' +
        '  };\\n' +
        '  const teamLogEntry = {\\n' +
        '    timestamp: now.getTime(),\\n' +
        '    message: `\\${hhmm} - responding to call #\\${callDisplayNumberMap.get(call.id)} (supervisor support)`\\n' +
        '  };\\n' +
        '\\n' +
        '  const updatedCall = {\\n' +
        '    ...call,\\n' +
        '    assignedTeam: [...(call.assignedTeam || []), supervisor.team],\\n' +
        '    status: call.assignedTeam?.length ? call.status : \\'Assigned\\',\\n' +
            '    log: [...(call.log || []), callLogEntry]\\n' +
            '  };\\n' +
            '\\n' +
            '  const updatedSupervisor = event.supervisor?.map((s: Supervisor) =>\\n' +
            '    s.team === supervisor.team\\n' +
            '      ? {\\n' +
            '          ...s,\\n' +
            '          status: \\'En Route\\',\\n' +
                '          location: call.location,\\n' +
                '          originalPost: s.location || \\'Unknown\\',\\n' +
                    '          log: [...(s.log || []), teamLogEntry]\\n' +
                    '        }\\n' +
                    '      : s\\n' +
                    '  );\\n' +
                    '\\n' +
                    '  const updatedCalls = event.calls.map((c: Call) => (c.id === call.id ? updatedCall : c));\\n' +
                    '\\n' +
                    '  await updateEvent({\\n' +
                    '    calls: updatedCalls,\\n' +
                    '    supervisor: updatedSupervisor\\n' +
                    '  });\\n' +
                    '};\\n' +
                    '\\n' +
                    'const assignEquipmentToCall = async (\\n' +
                    '  event: Event,\\n' +
                    '  call: Call,\\n' +
                    '  equipment: Equipment,\\n' +
                    '  teamName: string,\\n' +
                    '  isSupervisor: boolean,\\n' +
                    '  callDisplayNumberMap: Map<string, number>,\\n' +
                    '  updateEvent: (updates: Partial<Event>) => Promise<void>\\n' +
                    ') => {\\n' +
                    '  const now = new Date();\\n' +
                    '  const hhmm = now.getHours().toString().padStart(2, \\'0\\') + now.getMinutes().toString().padStart(2, \\'0\\');\\n' +
                        '\\n' +
                        '  const updatedEquipment = event.eventEquipment?.map((eq: Equipment) =>\\n' +
                        '    eq.id === equipment.id\\n' +
                        '      ? {\\n' +
                        '          ...eq,\\n' +
                        '          status: \\'In Use\\' as EquipmentStatus,\\n' +
                            '          assignedTeam: teamName,\\n' +
                            '          location: call.location\\n' +
                            '        }\\n' +
                            '      : eq\\n' +
                            '  );\\n' +
                            '\\n' +
                            '  let memberName = teamName;\\n' +
                            '  if (isSupervisor) {\\n' +
                            '    const sup = event.supervisor?.find(s => s.team === teamName);\\n' +
                            '    if (sup) {\\n' +
                            '      const match = sup.member.match(/^(.+?)\\\\s\\\\[(.+?)\\\\]/);\\n' +
                            '      memberName = `Supervisor \\${match ? match[1] : sup.member} (\\${teamName})`;\\n' +
                            '    }\\n' +
                            '  }\\n' +
                            '\\n' +
                            '  const callLogEntry = {\\n' +
                            '    timestamp: now.getTime(),\\n' +
                            '    message: `\\${hhmm} - \\${equipment.name} assigned to \\${memberName} for this call.`\\n' +
                            '  };\\n' +
                            '\\n' +
                            '  const teamLogEntry = {\\n' +
                            '    timestamp: now.getTime(),\\n' +
                            '    message: `\\${hhmm} - responding to call #\\${callDisplayNumberMap.get(call.id)} with \\${equipment.name}`\\n' +
                            '  };\\n' +
                            '\\n' +
                            '  const updatedCall = {\\n' +
                            '    ...call,\\n' +
                            '    assignedTeam: [...(call.assignedTeam || []), teamName],\\n' +
                            '    equipment: [...(call.equipment || []), equipment.name],\\n' +
                            '    equipmentTeams: [...(call.equipmentTeams || []), teamName],\\n' +
                            '    status: \\'Assigned\\',\\n' +
                                '    log: [...(call.log || []), callLogEntry]\\n' +
                                '  };\\n' +
                                '\\n' +
                                '  const updatedCalls = event.calls.map((c: Call) => c.id === call.id ? updatedCall : c);\\n' +
                                '\\n' +
                                '  if (isSupervisor) {\\n' +
                                '    const updatedSupervisor = event.supervisor?.map((s: Supervisor) =>\\n' +
                                '      s.team === teamName\\n' +
                                '        ? {\\n' +
                                '            ...s,\\n' +
                                '            status: \\'En Route Eq\\',\\n' +
                                    '            location: call.location,\\n' +
                                    '            originalPost: s.location || \\'Unknown\\',\\n' +
                                        '            log: [...(s.log || []), teamLogEntry]\\n' +
                                        '          }\\n' +
                                        '        : s\\n' +
                                        '    );\\n' +
                                        '\\n' +
                                        '    await updateEvent({\\n' +
                                        '      calls: updatedCalls,\\n' +
                                        '      supervisor: updatedSupervisor,\\n' +
                                        '      eventEquipment: updatedEquipment\\n' +
                                        '    });\\n' +
                                        '  } else {\\n' +
                                        '    const updatedStaff = event.staff.map((t: Staff) =>\\n' +
                                        '      t.team === teamName\\n' +
                                        '        ? {\\n' +
                                        '            ...t,\\n' +
                                        '            status: \\'En Route Eq\\',\\n' +
                                            '            location: call.location,\\n' +
                                            '            originalPost: t.location || \\'Unknown\\',\\n' +
                                                '            log: [...(t.log || []), teamLogEntry]\\n' +
                                                '          }\\n' +
                                                '        : t\\n' +
                                                '    );\\n' +
                                                '\\n' +
                                                '    await updateEvent({\\n' +
                                                '      calls: updatedCalls,\\n' +
                                                '      staff: updatedStaff,\\n' +
                                                '      eventEquipment: updatedEquipment\\n' +
                                                '    });\\n' +
                                                '  }\\n' +
                                                '};\\n' +
                                                '\\n' +
                                                'const isTeamOnActiveCall = (calls: Call[] | undefined, team: string) => {\\n' +
                                                '  if (!calls) return false;\\n' +
                                                '  return calls.some(\\n' +
                                                '    (c: Call) =>\\n' +
                                                '      c.assignedTeam?.includes(team) &&\\n' +
                                                '      ![\\'Resolved\\', \\'Delivered\\', \\'Refusal\\', \\'NMM\\', \\'Rolled\\'].includes(c.status)\\n' +
                                                    '  );\\n' +
                                                    '};\\n' +
                                                    '\\n' +
                                                    'export const CallTrackingTable: React.FC<CallTrackingTableProps> = ({';

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
