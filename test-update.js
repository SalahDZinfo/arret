const { Specialite } = require('./models');

async function testUpdate() {
    const ids = [703, 704]; // مسيّر الأشغال العمومية, التركيب الصحي، التدفئة والتكييف
    const content = '<ul><li>Test shared content</li></ul>';
    
    console.log("Before update:");
    const before = await Specialite.findAll({ where: { id: ids } });
    console.log(before.map(s => ({ id: s.id, content: s.content })));

    console.log("Running update...");
    const updated = await Specialite.update(
        { content: content, contentFr: '' },
        { where: { id: ids } }
    );
    console.log("Update result:", updated); // [2]

    console.log("After update:");
    const after = await Specialite.findAll({ where: { id: ids } });
    console.log(after.map(s => ({ id: s.id, content: s.content })));

    process.exit(0);
}

testUpdate();
