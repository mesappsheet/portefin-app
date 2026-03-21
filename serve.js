const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 8080;
const root = 'c:\\MES PROJETS\\Maquette Prospects et CREDIT';

const server = http.createServer((req, res) => {
    let decodedUrl = decodeURIComponent(req.url);
    let filePath = path.join(root, decodedUrl === '/' ? 'MAQUETTE_COMPLETE.html' : decodedUrl);
    
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

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

server.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
