const { Annexe } = require('./models');

async function check() {
    const count = await Annexe.count();
    console.log(`Annexes count: ${count}`);
    process.exit(0);
}
check();
