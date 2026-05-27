const fs = require('fs');
const path = require('path');

const filesToUpdate = [
    {
        file: 'supabase_schema.sql',
        replacements: [
            {
                search: "    OR (auth.jwt() ->> 'email') = 'caillatlucas2304@gmail.com'",
                replace: "    OR (auth.jwt() ->> 'email') IN ('caillatlucas2304@gmail.com', 'lolapeloille@gmail.com')"
            }
        ]
    },
    {
        file: 'src/app/admin/login/page.tsx',
        replacements: [
            {
                search: '    if (email === "caillatlucas2304@gmail.com" && password === "admin32") {',
                replace: '    if ((email === "caillatlucas2304@gmail.com" || email === "lolapeloille@gmail.com") && password === "admin32") {'
            }
        ]
    },
    {
        file: 'src/app/admin/page.tsx',
        replacements: [
            {
                search: "        if (session.user.email !== 'caillatlucas2304@gmail.com') {",
                replace: "        if (session.user.email !== 'caillatlucas2304@gmail.com' && session.user.email !== 'lolapeloille@gmail.com') {"
            },
            {
                search: "                              {comment.user_email === 'caillatlucas2304@gmail.com' && (",
                replace: "                              {['caillatlucas2304@gmail.com', 'lolapeloille@gmail.com'].includes(comment.user_email) && ("
            }
        ]
    },
    {
        file: 'src/app/page.tsx',
        replacements: [
            {
                search: "          if (user.email === 'caillatlucas2304@gmail.com') {",
                replace: "          if (['caillatlucas2304@gmail.com', 'lolapeloille@gmail.com'].includes(user.email)) {"
            },
            {
                search: "          {user?.email === 'caillatlucas2304@gmail.com' && (",
                replace: "          {['caillatlucas2304@gmail.com', 'lolapeloille@gmail.com'].includes(user?.email) && ("
            },
            {
                search: "                        if (user.email === 'caillatlucas2304@gmail.com') {",
                replace: "                        if (['caillatlucas2304@gmail.com', 'lolapeloille@gmail.com'].includes(user.email)) {"
            },
            {
                search: "                  {user.email === 'caillatlucas2304@gmail.com' && (",
                replace: "                  {['caillatlucas2304@gmail.com', 'lolapeloille@gmail.com'].includes(user.email) && ("
            },
            {
                search: "                        const isAdmin = user?.email === 'caillatlucas2304@gmail.com';",
                replace: "                        const isAdmin = ['caillatlucas2304@gmail.com', 'lolapeloille@gmail.com'].includes(user?.email);"
            },
            {
                search: "                                          {comment.user_email === 'caillatlucas2304@gmail.com' && (",
                replace: "                                          {['caillatlucas2304@gmail.com', 'lolapeloille@gmail.com'].includes(comment.user_email) && ("
            },
            {
                search: "                                              {reply.user_email === 'caillatlucas2304@gmail.com' && (",
                replace: "                                              {['caillatlucas2304@gmail.com', 'lolapeloille@gmail.com'].includes(reply.user_email) && ("
            }
        ]
    }
];

filesToUpdate.forEach(({ file, replacements }) => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        replacements.forEach(({ search, replace }) => {
            if (content.includes(search)) {
                content = content.replace(search, replace);
                modified = true;
            } else {
                console.log(`Could not find search string in ${file}:\n${search}`);
            }
        });
        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated ${file}`);
        }
    } else {
        console.log(`File not found: ${filePath}`);
    }
});
