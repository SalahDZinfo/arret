const { Specialite, Subject, Exam, sequelize } = require('./models');

async function cleanContent() {
    try {
        await sequelize.authenticate();
        console.log("Database connected.");

        // We clean the content of Specialties, Subjects, and Exams
        const processContent = (html) => {
            if (!html) return html;
            // 1. Remove all zero-width spaces, thin spaces, etc.
            let text = html.replace(/&nbsp;/g, ' ');
            
            // 2. We split by <p> tags, clean the inner text, and reconstruct
            // Regex to match <p>...</p> tags
            const regex = /<p[^>]*>(.*?)<\/p>/gs;
            let match;
            let result = '';
            let lastIndex = 0;

            while ((match = regex.exec(text)) !== null) {
                result += text.substring(lastIndex, match.index); // Append text before <p>
                let innerContent = match[1];
                
                // Strip HTML tags temporarily just to clean text if needed, 
                // but actually we just want to remove leading symbols: *, -, •, _ and spaces
                // We'll replace leading symbols ignoring any <span> or styling at the very beginning
                // The easiest way is to strip leading symbols on the raw inner html text
                // Let's strip leading spaces, *, -, •, _, 1., 2., etc.
                
                // Remove any starting span tags temporarily to check the first real character
                // Actually, the simplest regex on the innerHTML:
                // Remove leading spaces, &nbsp;, *, -, •, _, and numbers followed by dot/dash
                let cleanedInner = innerContent.replace(/^((<[^>]+>)*)([\s\*\-\•\_]+|(\d+[\.\-\)]\s*))+/g, '$1');
                
                // Also trim starting and trailing whitespace
                cleanedInner = cleanedInner.trim();

                if (cleanedInner) {
                    // Rebuild the <p> tag
                    // We only rebuild if it's not empty
                    result += `<p>${cleanedInner}</p>`;
                }
                
                lastIndex = regex.lastIndex;
            }
            result += text.substring(lastIndex); // Append remaining text

            // Also remove dangling symbols if no <p> tags are used (e.g. plain text)
            if (result === text && !result.includes('<p>')) {
                 result = result.replace(/^([\s\*\-\•\_]+|(\d+[\.\-\)]\s*))+/g, '').trim();
                 if (result) result = `<p>${result}</p>`;
            }

            return result;
        };

        let count = 0;

        // Clean Specialties
        const specialties = await Specialite.findAll();
        for (let s of specialties) {
            if (s.content) {
                const cleaned = processContent(s.content);
                if (cleaned !== s.content) {
                    s.content = cleaned;
                    await s.save();
                    count++;
                }
            }
        }

        // Clean Subjects
        const subjects = await Subject.findAll();
        for (let s of subjects) {
            if (s.content) {
                const cleaned = processContent(s.content);
                if (cleaned !== s.content) {
                    s.content = cleaned;
                    await s.save();
                    count++;
                }
            }
        }

        // Clean Exams
        const exams = await Exam.findAll();
        for (let s of exams) {
            if (s.content) {
                const cleaned = processContent(s.content);
                if (cleaned !== s.content) {
                    s.content = cleaned;
                    await s.save();
                    count++;
                }
            }
        }
        
        console.log(`Cleaned contents of ${count} records successfully!`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

cleanContent();
