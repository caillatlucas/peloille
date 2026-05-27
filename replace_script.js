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
                
                content = content.replaceAll("Lucas Caillat", "Lola Peloille");
                content = content.replaceAll("lucas caillat", "Lola Peloille");
                content = content.replaceAll("Lucas", "Lola");
                content = content.replaceAll("lucas", "lola");
                content = content.replaceAll("CAILLAT", "PELOILLE");
                content = content.replaceAll("caillat", "peloille");
                content = content.replaceAll("Freelance Informatique", "Artiste peintre");
                content = content.replaceAll("Freelance informatique", "Artiste peintre");
                content = content.replaceAll("contact@lolapeloille.fr", "lolapeloille@gmail.com");
                content = content.replaceAll("hello@lolapeloille.fr", "lolapeloille@gmail.com");
                content = content.replaceAll("#ff3131", "#606c38");
                content = content.replaceAll("red-600", "primary-green");
                content = content.replaceAll("red-500", "primary-green");
                content = content.replaceAll("shadow-red", "shadow-primary-green");
                content = content.replaceAll("hover:text-red", "hover:text-primary-green");
                
                // Fix the email issue for login
                content = content.replaceAll("peloillelola2304@gmail.com", "caillatlucas2304@gmail.com");
                content = content.replaceAll("lolapeloille2304@gmail.com", "caillatlucas2304@gmail.com");

                if (content !== initial) {
                    fs.writeFileSync(dirPath, content, 'utf8');
                    console.log(`Updated ${dirPath}`);
                }
            }
        }
    });
}

walkDir("c:\\Users\\32\\Downloads\\Peloille");
