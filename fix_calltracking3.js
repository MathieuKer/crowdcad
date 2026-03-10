const fs = require('fs');

let content = fs.readFileSync('src/components/dispatch/calltracking.tsx', 'utf-8');
let lines = content.split('\n');

const applySplice = (startLine, endLine, newContentStr) => {
    const newLines = newContentStr.split('\n');
    lines.splice(startLine - 1, (endLine - startLine) + 1, ...newLines);
};

// Replace onClicks bottom-up
applySplice(1171, 1225, `                                                      onClick={() => assignEquipmentToCall(event, call, equipment, supervisor.team, true, callDisplayNumberMap, updateEvent)}`);
applySplice(1103, 1157, `                                                      onClick={() => assignEquipmentToCall(event, call, equipment, supervisor.team, true, callDisplayNumberMap, updateEvent)}`);
applySplice(1012, 1066, `                                                    onClick={() => assignEquipmentToCall(event, call, equipment, team.team, false, callDisplayNumberMap, updateEvent)}`);
applySplice(948, 1003, `                                                    onClick={() => assignEquipmentToCall(event, call, equipment, team.team, false, callDisplayNumberMap, updateEvent)}`);
applySplice(851, 905, `                                                      onClick={() => assignEquipmentToCall(event, call, equipment, supervisor.team, true, callDisplayNumberMap, updateEvent)}`);
applySplice(783, 837, `                                                      onClick={() => assignEquipmentToCall(event, call, equipment, supervisor.team, true, callDisplayNumberMap, updateEvent)}`);
applySplice(692, 746, `                                                    onClick={() => assignEquipmentToCall(event, call, equipment, team.team, false, callDisplayNumberMap, updateEvent)}`);
applySplice(628, 683, `                                                    onClick={() => assignEquipmentToCall(event, call, equipment, team.team, false, callDisplayNumberMap, updateEvent)}`);
applySplice(521, 559, `                                            onClick={() => assignSupervisorToCall(event, call, supervisor, callDisplayNumberMap, updateEvent)}`);

// Create SubContent for Add Supervisor since it's above the onClick
const addSupervisorContent = `                                  <DropdownMenuSubContent className="bg-surface-deep border-surface-liner">
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
                                  </DropdownMenuSubContent>`;
// Line 502 to 578 -> Replaces from SubContent to /SubContent.
// But wait! We already spliced lines inside 502-578 (521-559)!
// Because we mutated the array from bottom up, by the time we arrive at 502 it is different.
// So let's NOT splice 521-559 earlier, but just splice 502-578 right now!
applySplice(502, 578 - (559 - 521), addSupervisorContent); // adjust endline due to inner splice! Wait, 521-559 removed 38 lines.

// Actually, let's just use the original content and do string replace!
let finalContent = lines.join('\\n');
fs.writeFileSync('src/components/dispatch/calltracking.tsx', finalContent);
