const http = require('http');

http.get('http://localhost:5000/api/annexes', (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Headers: ${JSON.stringify(res.headers)}`);
        console.log(`Data length: ${data.length}`);
        if (data.length > 500) {
            console.log(`Data starts with: ${data.substring(0, 100)}...`);
        } else {
            console.log(`Data: ${data}`);
        }
        process.exit(0);
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
    process.exit(1);
});
