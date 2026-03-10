import re
import io

file_path = 'src/components/dispatch/calltracking.tsx'
with io.open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

def safe_replace(pattern, repl, text):
    while True:
        match = re.search(pattern, text)
        if not match: break
        text = text[:match.start()] + repl + text[match.end():]
    return text

team_pattern = r'\{\(\(\) => \{\s*const availableTeams = event\.staff\.filter\(\(team: Staff\) => \{\s*const notAssignedToThisCall = !call\.assignedTeam\?\.includes\(team\.team\);\s*const notAssignedToAnyActiveCall = !event\.calls\?\.some\(\(c: Call\) =>\s*c\.assignedTeam\?\.includes\(team\.team\) &&\s*!\['\''Resolved'\'', '\''Delivered'\'', '\''Refusal'\'', '\''NMM'\'', '\''Rolled'\''\]\.includes\(c\.status\)\s*\);\s*return notAssignedToThisCall && notAssignedToAnyActiveCall && team\.status === '\''Available'\'';\s*\}\);\s*const inactiveTeams = event\.staff\.filter\(\(team: Staff\) => \{\s*const notAssignedToThisCall = !call\.assignedTeam\?\.includes\(team\.team\);\s*const notAssignedToAnyActiveCall = !event\.calls\?\.some\(\(c: Call\) =>\s*c\.assignedTeam\?\.includes\(team\.team\) &&\s*!\['\''Resolved'\'', '\''Delivered'\'', '\''Refusal'\'', '\''NMM'\'', '\''Rolled'\''\]\.includes\(c\.status\)\s*\);\s*return notAssignedToThisCall && notAssignedToAnyActiveCall && \['\''In Clinic'\'', '\''On Break'\''\]\.includes\(team\.status\);\s*\}\);\s*return \[\s*\.\.\.availableTeams\.map\(\(team: Staff\) => \(\s*<DropdownMenuItem\s*key=\{`equip-team-\$\{team\.team\}`\}\s*className="text-surface-light hover:bg-surface-liner focus:bg-surface-liner cursor-pointer"\s*onClick=\{[^}]*\}\s*>\s*\{team\.team\}\s*</DropdownMenuItem>\s*\)\),\s*\.\.\.inactiveTeams\.map\(\(team: Staff\) => \(\s*<DropdownMenuItem\s*key=\{`equip-team-inactive-\$\{team\.team\}`\}\s*className="text-surface-light hover:bg-surface-liner focus:bg-surface-liner cursor-pointer bg-status-blue/20"\s*onClick=\{[^}]*\}\s*>\s*\{team\.team\}\s*</DropdownMenuItem>\s*\)\)\s*\];\s*\}\)\(\)\}'

team_repl = r'''{event.staff?.filter((team: Staff) => !call.assignedTeam?.includes(team.team) && !isTeamOnActiveCall(event.calls, team.team) && team.status === 'Available').map((team: Staff) => (
                                              <DropdownMenuItem
                                                key={`equip-team-${team.team}`}
                                                className="text-surface-light hover:bg-surface-liner focus:bg-surface-liner cursor-pointer"
                                                onClick={() => assignEquipmentToCall(event, call, equipment, team.team, false, callDisplayNumberMap, updateEvent)}
                                              >
                                                {team.team}
                                              </DropdownMenuItem>
                                            ))}
                                            {event.staff?.filter((team: Staff) => !call.assignedTeam?.includes(team.team) && !isTeamOnActiveCall(event.calls, team.team) && ['In Clinic', 'On Break'].includes(team.status)).map((team: Staff) => (
                                              <DropdownMenuItem
                                                key={`equip-team-inactive-${team.team}`}
                                                className="text-surface-light hover:bg-surface-liner focus:bg-surface-liner cursor-pointer bg-status-blue/20"
                                                onClick={() => assignEquipmentToCall(event, call, equipment, team.team, false, callDisplayNumberMap, updateEvent)}
                                              >
                                                {team.team}
                                              </DropdownMenuItem>
                                            ))}'''


sup_pattern = r'\{\(\(\) => \{\s*const availableSupervisors = event\.supervisor\?\.filter\(\(sup: Supervisor\) => \{\s*const notAssignedToThisCall = !call\.assignedTeam\?\.includes\(sup\.team\);\s*const notAssignedToAnyActiveCall = !event\.calls\?\.some\(\(c: Call\) =>\s*c\.assignedTeam\?\.includes\(sup\.team\) &&\s*!\['\''Resolved'\'', '\''Delivered'\'', '\''Refusal'\'', '\''NMM'\'', '\''Rolled'\''\]\.includes\(c\.status\)\s*\);\s*return notAssignedToThisCall && notAssignedToAnyActiveCall && sup\.status === '\''Available'\'';\s*\}\) \|\| \[\];\s*const inactiveSupervisors = event\.supervisor\?\.filter\(\(sup: Supervisor\) => \{\s*const notAssignedToThisCall = !call\.assignedTeam\?\.includes\(sup\.team\);\s*const notAssignedToAnyActiveCall = !event\.calls\?\.some\(\(c: Call\) =>\s*c\.assignedTeam\?\.includes\(sup\.team\) &&\s*!\['\''Resolved'\'', '\''Delivered'\'', '\''Refusal'\'', '\''NMM'\'', '\''Rolled'\''\]\.includes\(c\.status\)\s*\);\s*return notAssignedToThisCall && notAssignedToAnyActiveCall && \['\''In Clinic'\'', '\''On Break'\''\]\.includes\(sup\.status\);\s*\}\) \|\| \[\];\s*return \[\s*\.\.\.availableSupervisors\.map\(\(supervisor: Supervisor\) => \(\s*<DropdownMenuItem\s*key=\{`equip-supervisor-\$\{supervisor\.team\}`\}\s*className="text-surface-light hover:bg-surface-liner focus:bg-surface-liner cursor-pointer"\s*onClick=\{[^}]*\}\s*>\s*\{supervisor\.team\}\s*</DropdownMenuItem>\s*\)\),\s*\.\.\.inactiveSupervisors\.map\(\(supervisor: Supervisor\) => \(\s*<DropdownMenuItem\s*key=\{`equip-supervisor-inactive-\$\{supervisor\.team\}`\}\s*className="text-surface-light hover:bg-surface-liner focus:bg-surface-liner cursor-pointer bg-status-blue/20"\s*onClick=\{[^}]*\}\s*>\s*\{supervisor\.team\}\s*</DropdownMenuItem>\s*\)\)\s*\];\s*\}\)\(\)\}'

sup_repl = r'''{event.supervisor?.filter((sup: Supervisor) => !call.assignedTeam?.includes(sup.team) && !isTeamOnActiveCall(event.calls, sup.team) && sup.status === 'Available').map((supervisor: Supervisor) => (
                                              <DropdownMenuItem
                                                key={`equip-supervisor-${supervisor.team}`}
                                                className="text-surface-light hover:bg-surface-liner focus:bg-surface-liner cursor-pointer"
                                                onClick={() => assignEquipmentToCall(event, call, equipment, supervisor.team, true, callDisplayNumberMap, updateEvent)}
                                              >
                                                {supervisor.team}
                                              </DropdownMenuItem>
                                            ))}
                                            {event.supervisor?.filter((sup: Supervisor) => !call.assignedTeam?.includes(sup.team) && !isTeamOnActiveCall(event.calls, sup.team) && ['In Clinic', 'On Break'].includes(sup.status)).map((supervisor: Supervisor) => (
                                              <DropdownMenuItem
                                                key={`equip-supervisor-inactive-${supervisor.team}`}
                                                className="text-surface-light hover:bg-surface-liner focus:bg-surface-liner cursor-pointer bg-status-blue/20"
                                                onClick={() => assignEquipmentToCall(event, call, equipment, supervisor.team, true, callDisplayNumberMap, updateEvent)}
                                              >
                                                {supervisor.team}
                                              </DropdownMenuItem>
                                            ))}'''

content = safe_replace(team_pattern, team_repl, content)
content = safe_replace(sup_pattern, sup_repl, content)

with io.open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
