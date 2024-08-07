// server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const port = 3000;

let players = [];
let board = Array(9).fill(null);

wss.on('connection', (ws) => {
    if (players.length >= 2) {
        ws.send(JSON.stringify({ type: 'full' }));
        ws.close();
        return;
    }

    players.push(ws);
    ws.send(JSON.stringify({ type: 'welcome', player: players.length }));

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        if (data.type === 'move' && board[data.index] === null) {
            board[data.index] = data.player;
            broadcast({ type: 'update', board });

            if (checkWin(data.player)) {
                broadcast({ type: 'win', player: data.player });
                resetGame();
            } else if (board.every(cell => cell !== null)) {
                broadcast({ type: 'draw' });
                resetGame();
            }
        }
    });

    ws.on('close', () => {
        players = players.filter(player => player !== ws);
        if (players.length === 0) resetGame();
    });
});

function broadcast(message) {
    players.forEach(player => player.send(JSON.stringify(message)));
}

function checkWin(player) {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];
    return winPatterns.some(pattern =>
        pattern.every(index => board[index] === player)
    );
}

function resetGame() {
    board = Array(9).fill(null);
}

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
