const { Specialite } = require('./models');

async function testApi() {
    try {
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'password123' })
        });
        const loginData = await loginRes.json();
        const token = loginData.token;

        const payload = {
            title: 'الأشغال الجيوتقنية',
            content: '<p>Testing additionalIds 3</p>',
            contentFr: '',
            additionalIds: [706, 707]
        };

        console.log("Sending PUT request with payload:", payload);
        const res = await fetch('http://localhost:5000/api/specialties/705', {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(payload)
        });
        
        const responseData = await res.json();
        console.log("PUT Response status:", res.status, responseData);

        // Wait a bit
        await new Promise(r => setTimeout(r, 1000));
        
        const specs = await Specialite.findAll({ where: { id: [705, 706, 707] } });
        console.log("DB check:", specs.map(s => ({ id: s.id, content: s.content })));

    } catch (e) {
        console.error("Error:", e);
    }
}
testApi();
