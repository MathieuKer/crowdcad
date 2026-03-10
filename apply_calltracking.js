const fs = require('fs');
const path = require('path');

const file = 'src/components/dispatch/calltracking.tsx';
let lines = fs.readFileSync(file, 'utf-8').split('\n');

const reps = JSON.parse(fs.readFileSync('replacements.json', 'utf-8'));

const applySplice = (start, end, content) => {
    lines.splice(start - 1, (end - start) + 1, ...content.split('\n'));
};

applySplice(1171, 1225, reps.eqSupClick);
applySplice(1103, 1157, reps.eqSupClick);
applySplice(1012, 1066, reps.eqTeamClick);
applySplice(948, 1003, reps.eqTeamClick);
applySplice(851, 905, reps.eqSupClick);
applySplice(783, 837, reps.eqSupClick);
applySplice(692, 746, reps.eqTeamClick);
applySplice(628, 683, reps.eqTeamClick);
applySplice(502, 578, reps.addSup);
applySplice(451, 494, reps.addTeam);

let text = lines.join('\n');
text = text.replace('export const CallTrackingTable: React.FC<CallTrackingTableProps> = ({\r', reps.helpers);
text = text.replace('  DropdownItem,\r\n  DropdownItem,', '  DropdownItem,');

fs.writeFileSync(file, text);
