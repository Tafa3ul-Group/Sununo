const fs = require('fs');
const path = require('path');

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            processDirectory(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = false;

            // normalize.font(16) -> normalize.font(14)
            if (content.includes('normalize.font(16)')) {
                content = content.replace(/normalize\.font\(16\)/g, 'normalize.font(14)');
                modified = true;
            }
            // normalize.font(10) -> normalize.font(8)
            if (content.includes('normalize.font(10)')) {
                content = content.replace(/normalize\.font\(10\)/g, 'normalize.font(8)');
                modified = true;
            }
            // fontSize: 16 -> fontSize: 14
            if (content.match(/fontSize:\s*16\b/)) {
                content = content.replace(/fontSize:\s*16\b/g, 'fontSize: 14');
                modified = true;
            }
            // fontSize: 10 -> fontSize: 8
            if (content.match(/fontSize:\s*10\b/)) {
                content = content.replace(/fontSize:\s*10\b/g, 'fontSize: 8');
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(fullPath, content, 'utf8');
                console.log(`Updated sizes in: ${fullPath}`);
            }
        }
    });
}

processDirectory(path.join(__dirname, '../app'));
processDirectory(path.join(__dirname, '../components'));
processDirectory(path.join(__dirname, '../constants'));
console.log('Font sizes replaced successfully!');
