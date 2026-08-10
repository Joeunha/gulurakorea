const fs = require('fs');
const path = require('path');

const fileContent = fs.readFileSync('palto-jeongbok-v12.jsx', 'utf8');

const constantsStart = fileContent.indexOf('const SAMPLE_POOL = [');
const constantsEndStr = 'const NATIONAL_ROOMS = [';
const constantsEndBlock = fileContent.indexOf(constantsEndStr);
let constantsEnd = fileContent.indexOf('];', constantsEndBlock) + 2;

const stylesStart = fileContent.indexOf('const S = {');
let stylesEnd = fileContent.indexOf('export default function App()', stylesStart);
if (stylesEnd === -1) {
  stylesEnd = fileContent.length;
}

const constantsStr = fileContent.slice(constantsStart, constantsEnd);
const constantsExport = constantsStr.replace(/const (SAMPLE_POOL|THEME_LABELS|THEME_LIST|DIST_STEPS|DURATIONS|BUDGETS|EVENT_CARDS|SIDO_ORDER|SIDO_TINT|ME|FRIEND_POOL|TOLL|SIDO_FULL|SIDO_ACCENT|BOARD|methodFor|NATIONAL_ROOMS) /g, 'export const $1 ');
fs.writeFileSync('src/constants.js', constantsExport, 'utf8');

let cssStart = fileContent.indexOf('const CSS = `');
let cssEnd = fileContent.indexOf('`;', cssStart) + 2;
let cssStr = fileContent.slice(cssStart, cssEnd);
let sStr = fileContent.slice(stylesStart, stylesEnd);

const stylesExport = sStr.replace('const S =', 'export const S =') + '\n' + cssStr.replace('const CSS =', 'export const CSS =');
fs.writeFileSync('src/styles.js', stylesExport, 'utf8');

const importConstants = "import { SAMPLE_POOL, THEME_LABELS, THEME_LIST, DIST_STEPS, DURATIONS, BUDGETS, EVENT_CARDS, SIDO_ORDER, SIDO_TINT, ME, FRIEND_POOL, TOLL, SIDO_FULL, SIDO_ACCENT, BOARD, methodFor, NATIONAL_ROOMS } from './constants';\n";
const importStyles = "import { S, CSS } from './styles';\n";

let newFile = fileContent.slice(0, constantsStart) + importConstants + 
              fileContent.slice(constantsEnd, stylesStart) + importStyles + 
              fileContent.slice(stylesEnd);

let newCssStart = newFile.indexOf('const CSS = `');
let newCssEnd = newFile.indexOf('`;', newCssStart) + 2;
if (newCssStart !== -1) {
  newFile = newFile.slice(0, newCssStart) + newFile.slice(newCssEnd);
}

fs.writeFileSync('src/palto-jeongbok-v12.jsx', newFile, 'utf8');
console.log('Successfully split v12!');
