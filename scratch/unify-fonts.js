const fs = require('fs');
const path = require('path');

const targetDirs = ['app', 'components', 'constants'];
const rootDir = path.resolve(__dirname, '..');

const fontRegex = /Alexandria-(Regular|Bold|SemiBold|Black|Light|Thin)/g;

function walkSync(dir, filelist = []) {
  if (!fs.existsSync(dir)) return filelist;
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (dirFile.endsWith('.ts') || dirFile.endsWith('.tsx')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
}

let changedFiles = 0;

targetDirs.forEach(dir => {
  const fullPath = path.join(rootDir, dir);
  const files = walkSync(fullPath);
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    if (fontRegex.test(content)) {
      const newContent = content.replace(fontRegex, 'Alexandria-Medium');
      fs.writeFileSync(file, newContent, 'utf8');
      console.log(`Updated fonts in: ${file.replace(rootDir, '')}`);
      changedFiles++;
    }
  });
});

console.log(`\nFinished updating fonts. Modified ${changedFiles} files.`);
