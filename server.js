const express = require('express');
const cors = require('cors');

const server = express();
const PORT = process.env.PORT || 3000;

server.use(cors());

server.all('/', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.write('Paste the above text in https://uptimerobot.com');
    res.end();
});

function keepAlive() {
    server.listen(PORT, (err) => {
        if (err) {
            console.error("Server failed to start:", err);
            return;
        }
        console.log(`Server is online on port ${PORT}!`);
    });
}

module.exports = keepAlive;
