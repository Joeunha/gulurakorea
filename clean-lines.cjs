const fs = require('fs');
const path = 'src/palto-jeongbok-v10.jsx';
const lines = fs.readFileSync(path, 'utf8').split('\n');

let constantsStart = -1;
let constantsEnd = -1;
let stylesStart = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const SAMPLE_POOL = [')) constantsStart = i;
  if (lines[i].includes('const NATIONAL_ROOMS = [')) {
    for (let j = i; j < lines.length; j++) {
      if (lines[j].includes('];')) {
        constantsEnd = j;
        break;
      }
    }
  }
  if (lines[i].includes('const S = {')) stylesStart = i;
}

if (constantsStart !== -1 && constantsEnd !== -1 && stylesStart !== -1) {
  // Wait, in my original split.js, I included `const methodFor` which is between BOARD and NATIONAL_ROOMS.
  // We will just remove everything from constantsStart to constantsEnd.
  const importConstants = "import { SAMPLE_POOL, THEME_LABELS, THEME_LIST, DIST_STEPS, DURATIONS, BUDGETS, EVENT_CARDS, SIDO_ORDER, SIDO_TINT, ME, FRIEND_POOL, TOLL, SIDO_FULL, SIDO_ACCENT, BOARD, methodFor, NATIONAL_ROOMS } from './constants';";
  const importStyles = "import { S, CSS } from './styles';";
  
  // Reconstruct palto-jeongbok-v10.jsx
  const newLines = [
    ...lines.slice(0, constantsStart),
    importConstants,
    ...lines.slice(constantsEnd + 1, stylesStart),
    importStyles
  ];
  
  fs.writeFileSync(path, newLines.join('\n'), 'utf8');
  console.log('Successfully split the file!');
} else {
  console.log('Could not find boundaries.', { constantsStart, constantsEnd, stylesStart });
}
