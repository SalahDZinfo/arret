const app = require('../server.js');

module.exports = (req, res) => {
    // Vercel might strip /api from the URL. We put it back so Express routing matches.
    if (!req.url.startsWith('/api')) {
        req.url = '/api' + (req.url === '/' ? '' : req.url);
    }
    return app(req, res);
};
