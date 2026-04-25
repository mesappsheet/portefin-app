const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 9090;
const root = 'c:\\MES PROJETS\\Maquette Prospects et CREDIT';

const server = http.createServer((req, res) => {
    let decodedUrl = decodeURIComponent(req.url);
    
    // Logic for redirects (matching netlify.toml)
    if (decodedUrl === '/' || decodedUrl === '/login') {
        decodedUrl = '/login.html';
    } else if (decodedUrl === '/app') {
        decodedUrl = '/MAQUETTE_COMPLETE.html';
    } else if (decodedUrl === '/mobile') {
        decodedUrl = '/maquette-app/index.html';
    } else if (decodedUrl === '/mobile/login') {
        decodedUrl = '/maquette-app/login.html';
    }

    let filePath = path.join(root, decodedUrl);
    
    // Safety check: ensure the file is within the root
    if (!filePath.startsWith(root)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Not Found');
            return;
        }
        
        const ext = path.extname(filePath);
        let contentType = 'text/html';
        if (ext === '.css') contentType = 'text/css';
        if (ext === '.js') contentType = 'text/javascript';
        if (ext === '.png') contentType = 'image/png';
        if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
        if (ext === '.svg') contentType = 'image/svg+xml';
        if (ext === '.json') contentType = 'application/json';

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
    console.log(`- App PC: http://localhost:${port}/app`);
    console.log(`- App Mobile: http://localhost:${port}/mobile`);
});
