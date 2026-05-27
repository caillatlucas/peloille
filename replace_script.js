const fs = require('fs');
const path = require('path');

const extensions = ['.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.css', '.html', '.mjs', '.yml', '.yaml'];
const excludeDirs = ['node_modules', '.git', '.next', 'out_prefix', 'artifacts'];

function walkDir(dir) {
    fs.readdirSync(dir).forEach(f => {
        const dirPath = path.join(dir, f);
        if (fs.statSync(dirPath).isDirectory()) {
            if (!excludeDirs.includes(f)) walkDir(dirPath);
        } else {
            if (extensions.includes(path.extname(f))) {
                let content = fs.readFileSync(dirPath, 'utf8');
                let initial = content;
                
                content = content.replaceAll("Lola Peloille", "Lola Peloille");
                content = content.replaceAll("Lola Peloille", "Lola Peloille");
                content = content.replaceAll("Lola", "Lola");
                content = content.replaceAll("lola", "lola");
                content = content.replaceAll("PELOILLE", "PELOILLE");
                content = content.replaceAll("peloille", "peloille");
                content = content.replaceAll("Artiste peintre", "Artiste peintre");
                content = content.replaceAll("Artiste peintre", "Artiste peintre");
                content = content.replaceAll("lolapeloille@gmail.com", "lolapeloille@gmail.com");
                content = content.replaceAll("lolapeloille@gmail.com", "lolapeloille@gmail.com");
                content = content.replaceAll("#606c38", "#606c38");
                content = content.replaceAll("primary-green", "primary-green");
                content = content.replaceAll("primary-green", "primary-green");
                content = content.replaceAll("shadow-primary-green", "shadow-primary-green");
                content = content.replaceAll("hover:text-primary-green", "hover:text-primary-green");
                
                // Fix the email issue for login
                content = content.replaceAll("caillatlucas2304@gmail.com", "caillatlucas2304@gmail.com");
                content = content.replaceAll("caillatlucas2304@gmail.com", "caillatlucas2304@gmail.com");

                if (content !== initial) {
                    fs.writeFileSync(dirPath, content, 'utf8');
                    console.log(`Updated ${dirPath}`);
                }
            }
        }
    });
}

walkDir("c:\\Users\\32\\Downloads\\Peloille");
