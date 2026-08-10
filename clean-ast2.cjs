const fs = require('fs');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const srcPath = 'src/palto-jeongbok-v10.jsx';
let content = fs.readFileSync(srcPath, 'utf8');

const importBackup = [];
content = content.replace(/^import\s+.*?from\s+['"].*?['"];?/gm, (match) => {
  importBackup.push(match);
  return '/* IMPORT_PLACEHOLDER */';
});

const ast = parser.parse(content, {
  sourceType: 'module',
  plugins: ['jsx']
});

const componentsToRemove = new Set([
  'fetchDestinations', 'verifyReceipt', 'verifyGps',
  'DieFace', 'DicePips', 'Dice3D',
  'Envelope', 'VerifyFlow', 'ResultOverlay',
  'Splash', 'SplashArt', 'RankScreen',
  'MainScreen', 'MapScreen', 'MyScreen',
  'Stat', 'Section', 'Row', 'Chk', 'Meta'
]);

const nodesToRemove = [];
traverse(ast, {
  FunctionDeclaration(path) {
    if (componentsToRemove.has(path.node.id?.name)) {
      nodesToRemove.push(path.node);
    }
  },
  VariableDeclarator(path) {
    if (componentsToRemove.has(path.node.id?.name)) {
      if (path.parent.type === 'VariableDeclaration') {
        nodesToRemove.push(path.parent);
      }
    }
  }
});

nodesToRemove.sort((a, b) => b.start - a.start);

let newContent = content;
for (const node of nodesToRemove) {
  newContent = newContent.slice(0, node.start) + newContent.slice(node.end);
}

newContent = newContent.replace(/\/\* IMPORT_PLACEHOLDER \*\//g, () => importBackup.shift());

fs.writeFileSync(srcPath, newContent, 'utf8');
console.log('Successfully cleaned AST');
