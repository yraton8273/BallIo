const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const Game = require('./game/Game');  // Make sure this path is correct based on your folder structure

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

app.use(express.static('public'));  // Serve static files (client-side)

const game = new Game();  // Create a new game instance

// Handle socket connections
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    
    const team = game.addUser(socket.id);  // Add the user to the game
    if (!team) {
        socket.emit('full');
        socket.disconnect();
        return;
    }

    socket.emit('team_assigned', team.name);  // Notify player of their team

    // Handle player movement
    socket.on('move', ({ vx, vy }) => {
        const player = team.getControlledPlayer();
        if (player) {
            player.vx = vx;
            player.vy = vy;
        }
    });

    // Switch player control
    socket.on('switch_control', () => {
        team.switchControl();
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        game.removeUser(socket.id);
    });
});

// Game loop (update every frame)
const TICK_RATE = 60;
setInterval(() => {
    const dt = 1 / TICK_RATE;
    game.update(dt);  // Update game state

    // Broadcast game state to all connected clients
    io.emit('state', {
        players: Object.values(game.players).map(p => ({
            id: p.id, x: p.x, y: p.y, hasBall: p.hasBall
        })),
        ball: {
            x: game.ball.x,
            y: game.ball.y,
            attachedTo: game.ball.attachedTo
        },
        scores: game.teams.map(t => ({ name: t.name, score: t.score })),
    });
}, 1000 / TICK_RATE);  // Run at 60 FPS

// Start the server
server.listen(PORT, () => {
    console.log(`⚽ Server running on http://localhost:${PORT}`);
});
