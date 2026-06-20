const { Specialite, sequelize } = require('./models');

async function cleanSpecialties() {
    try {
        await sequelize.authenticate();
        console.log("Database connected.");

        const specialties = await Specialite.findAll();
        let updatedCount = 0;

        for (let s of specialties) {
            if (s.content) {
                let newContent = s.content;
                const string1 = '<p>يتمحور هذا الاختبار حول مجموعة من المواد التقنية، بحيث تعكس مدى تمكن المترشح من تخصصه.</p>';
                const string2 = '<p>يمكن للقائمين على تحضير الاختبار تناول بعض من المواد التالية:</p>';
                const string3 = 'يتمحور هذا الاختبار حول مجموعة من المواد التقنية، بحيث تعكس مدى تمكن المترشح من تخصصه.';
                const string4 = 'يمكن للقائمين على تحضير الاختبار تناول بعض من المواد التالية:';
                
                if (newContent.includes(string1) || newContent.includes(string2) || newContent.includes(string3) || newContent.includes(string4)) {
                    newContent = newContent.replace(new RegExp(string1, 'g'), '');
                    newContent = newContent.replace(new RegExp(string2, 'g'), '');
                    newContent = newContent.replace(new RegExp(string3, 'g'), '');
                    newContent = newContent.replace(new RegExp(string4, 'g'), '');
                    
                    // clean up empty p tags just in case
                    newContent = newContent.replace(/<p><\/p>/g, '');
                    newContent = newContent.replace(/<p>\s*<\/p>/g, '');

                    s.content = newContent;
                    await s.save();
                    updatedCount++;
                }
            }
        }
        
        console.log(`Cleaned ${updatedCount} specialties successfully!`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

cleanSpecialties();
