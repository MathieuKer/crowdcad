const fs = require('fs');
let c = fs.readFileSync('src/components/dispatch/calltracking.tsx', 'utf-8');

// Replace Add Team IIFE
const addTeamSearch = /<DropdownMenuSubContent className="bg-surface-deep border-surface-liner">\\s*\{\(\(\) => \{\\s*const allTeams = event\.staff \? event\.staff\.map\(s => s\.team\) : \[\];[\s\S]*?\}\)\(\)\}\\s*<\/DropdownMenuSubContent>/;
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
                                
c = c.replace(addTeamSearch, addTeamReplace);

// Replace Add Supervisor IIFE and huge onClick
const addSupSearch1 = /!event\.calls\?\.some\(\(c: Call\) =>\\s*c\.assignedTeam\?\.includes\(supervisor\.team\) &&\\s*!\['Resolved', 'Delivered', 'Refusal', 'NMM', 'Rolled'\]\.includes\(c\.status\)\\s*\);/g;
c = c.replace(addSupSearch1, '!isTeamOnActiveCall(event.calls, supervisor.team);');

const addSupClickSearch = /onClick=\{async \(\) => \{[\s\S]*?await updateEvent\(\{[\s\S]*?\}\);\s*\}\}/g;
// We actually need to differentiate supervisor clicks vs equipment clicks.
// Supervisor clicks have `const callLogEntry = { ...message: \`\${hhmm} - Supervisor \\${memberName} (\\${supervisor.team}) assigned to call.\` ...`
// Equipment clicks have `const updatedEquipment = event.eventEquipment?.map(...)`
// Let's manually replace all 6 onClick handlers in Add Equipment / Add Supervisor.

// 1. Add Supervisor click
const supervisorClickSearch = /onClick=\{async \(\) => \{\\s*const now = new Date\(\);[\s\S]*?message: \`\\$\\{hhmm\\} - Supervisor \\$\\{memberName\\} \(\\$\\{supervisor\.team\\}\) assigned to call\.\`[\s\S]*?\}\}/g;
c = c.replace(supervisorClickSearch, 'onClick={() => assignSupervisorToCall(event, call, supervisor, callDisplayNumberMap, updateEvent)}');

// 2. Equipment to Team (Available Equipment -> Team)
const eqToTeamSearch = /onClick=\{async \(\) => \{\\s*const now = new Date\(\);[\s\S]*?assignedTeam: team\.team,[\s\S]*?location: call\.location[\s\S]*?message: \`\\$\\{hhmm\\} - \\$\\{equipment\.name\\} assigned to \\$\\{team\.team\\} for this call\.\`[\s\S]*?await updateEvent\(\{[\s\S]*?staff:[\s\S]*?\}\);\s*\}\}/g;
c = c.replace(eqToTeamSearch, 'onClick={() => assignEquipmentToCall(event, call, equipment, team.team, false, callDisplayNumberMap, updateEvent)}');

// 3. Equipment to Team (In Clinic Equipment -> Team)
const eqToTeamClinicSearch = /onClick=\{async \(\) => \{\\s*const now = new Date\(\);[\s\S]*?assignedTeam: team\.team,[\s\S]*?location: team\.team[\s\S]*?message: \`\\$\\{hhmm\\} - \\$\\{equipment\.name\\} assigned to \\$\\{team\.team\\} for this call\.\`[\s\S]*?await updateEvent\(\{[\s\S]*?staff:[\s\S]*?\}\);\s*\}\}/g;
c = c.replace(eqToTeamClinicSearch, 'onClick={() => assignEquipmentToCall(event, call, equipment, team.team, false, callDisplayNumberMap, updateEvent)}');

// 4. Equipment to Supervisor (Available Equipment -> Supervisor & In Clinic Equipment -> Supervisor)
const eqToSupSearch = /onClick=\{async \(\) => \{\\s*const now = new Date\(\);[\s\S]*?status: 'In Use' as EquipmentStatus,[\s\S]*?assignedTeam: supervisor\.team,[\s\S]*?location: call\.location[\s\S]*?message: \`\\$\\{hhmm\\} - \\$\\{equipment\.name\\} assigned to Supervisor \\$\\{memberName\\} \(\\$\\{supervisor\.team\\}\) for this call\.\`[\s\S]*?await updateEvent\(\{[\s\S]*?supervisor:[\s\S]*?\}\);\s*\}\}/g;
c = c.replace(eqToSupSearch, 'onClick={() => assignEquipmentToCall(event, call, equipment, supervisor.team, true, callDisplayNumberMap, updateEvent)}');

fs.writeFileSync('src/components/dispatch/calltracking.tsx', c);
