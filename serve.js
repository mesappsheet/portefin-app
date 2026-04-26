const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 9090;
const root = __dirname; 

const server = http.createServer((req, res) => {
    let decodedUrl = decodeURIComponent(req.url);
    
    // 1. Raccourcis pratiques
    if (decodedUrl === '/' || decodedUrl === '/login') {
        decodedUrl = '/login.html';
    } else if (decodedUrl === '/app') {
        decodedUrl = '/MAQUETTE_COMPLETE.html';
    } else if (decodedUrl === '/mobile') {
        decodedUrl = '/maquette-app/index.html';
    }
    
    // 2. Gestion automatique des dossiers (si on oublie index.html)
    if (decodedUrl === '/maquette-app' || decodedUrl === '/maquette-app/') {
        decodedUrl = '/maquette-app/index.html';
    }

    let filePath = path.join(root, decodedUrl);

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end('Fichier Introuvable : ' + decodedUrl);
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
    console.log(`\x1b[32m%s\x1b[0m`, `--- SERVEUR PORTEFIN ACTIF ---`);
    console.log(`PC :     http://localhost:${port}/app`);
    console.log(`MOBILE : http://localhost:${port}/mobile`);
    console.log(`------------------------------`);
});
