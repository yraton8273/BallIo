const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Initialize game state
let gameState = {
    players: [],
    ball: { x: 400, y: 300, attachedTo: null },
    scores: { team1: 0, team2: 0 },
    time: 0 // Timer in seconds
};

// Serve static files (e.g., game.js, HTML, etc.)
app.use(express.static('public'));

// Handle incoming connections
io.on('connection', (socket) => {
    console.log('New client connected');
    
    // Add a new player to the game
    gameState.players.push({ id: socket.id, x: 200, y: 200, hasBall: false, team: 'team1' });

    // Broadcast the initial game state
    socket.emit('state', gameState);

    // Listen for player movement and update their position
    socket.on('move', (movement) => {
        const player = gameState.players.find(p => p.id === socket.id);
        if (player) {
            player.x += movement.vx;
            player.y += movement.vy;
        }
    });

    // Listen for ball movement (throwing)
    socket.on('moveBall', (movement) => {
        gameState.ball.x += movement.dx;
        gameState.ball.y += movement.dy;
    });

    // Check if the ball has crossed a goal line
    const checkGoal = () => {
        // Goal dimensions
        const goalWidth = 50;
        const goalDepth = 10;

        // Team 1 goal (left side)
        if (gameState.ball.x <= 0 && gameState.ball.y > 300 - goalDepth && gameState.ball.y < 300 + goalDepth) {
            gameState.scores.team2 += 1;  // Team 2 scores
            resetBall();
        }

        // Team 2 goal (right side)
        if (gameState.ball.x >= 800 && gameState.ball.y > 300 - goalDepth && gameState.ball.y < 300 + goalDepth) {
            gameState.scores.team1 += 1;  // Team 1 scores
            resetBall();
        }
    };

    // Reset the ball position to the center after a goal
    const resetBall = () => {
        gameState.ball.x = 400;
        gameState.ball.y = 300;
        gameState.ball.attachedTo = null;
    };

    // Game loop: send the updated game state every second
    const gameLoop = setInterval(() => {
        gameState.time += 1; // Increment time (every second)

        // Check if a goal has been scored
        checkGoal();

        io.emit('state', gameState); // Broadcast updated game state to all clients
    }, 1000);

    // Clean up when a client disconnects
    socket.on('disconnect', () => {
        console.log('Client disconnected');
        gameState.players = gameState.players.filter(p => p.id !== socket.id);
        clearInterval(gameLoop); // Stop the game loop for the disconnected client
    });
});

// Start the server
server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
