const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // 1. Unify all font families to "Alexandria-Medium"
    // Matches patterns like: fontFamily: "Tajawal-Bold" or fontFamily: 'LamaSans-Regular'
    content = content.replace(/fontFamily:\s*['"`][^'"`]+['"`]/g, 'fontFamily: "Alexandria-Medium"');

    // 2. Unify normalize.font sizes
    // Matches normalize.font(16) or normalize.font(16, 0.5)
    content = content.replace(/normalize\.font\((\d+)([^)]*)\)/g, (match, sizeStr, extra) => {
        const size = parseInt(sizeStr, 10);
        if (size >= 13) {
            return `normalize.font(14${extra})`;
        } else {
            return `normalize.font(8${extra})`;
        }
    });

    // 3. Unify moderateScale sizes
    content = content.replace(/moderateScale\((\d+)([^)]*)\)/g, (match, sizeStr, extra) => {
        const size = parseInt(sizeStr, 10);
        if (size >= 13) {
            return `moderateScale(14${extra})`;
        } else {
            return `moderateScale(8${extra})`;
        }
    });

    // 4. Unify scale sizes
    content = content.replace(/scale\((\d+)\)/g, (match, sizeStr) => {
        const size = parseInt(sizeStr, 10);
        if (size >= 13) {
            return `scale(14)`;
        } else {
            return `scale(8)`;
        }
    });

    // 5. Unify raw font sizes
    // Matches patterns like: fontSize: 16, or fontSize: 12
    // We make sure it doesn't match nested function calls we already processed.
    content = content.replace(/fontSize:\s*(\d+)\b/g, (match, sizeStr) => {
        const size = parseInt(sizeStr, 10);
        if (size >= 13) {
            return `fontSize: 14`;
        } else {
            return `fontSize: 8`;
        }
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Unified fonts and sizes in: ${filePath}`);
    }
}

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            // Exclude theme.ts itself to avoid resetting its base variables unexpectedly
            if (!fullPath.endsWith('theme.ts')) {
                processFile(fullPath);
            }
        }
    });
}

const appDir = path.join(__dirname, '../app');
const componentsDir = path.join(__dirname, '../components');

console.log('Starting super unification of fonts and sizes...');
processDirectory(appDir);
processDirectory(componentsDir);
console.log('Super unification completed successfully!');
