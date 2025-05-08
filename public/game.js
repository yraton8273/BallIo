const socket = io();  // Connect to the server

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size (full screen with field dimensions)
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Game state variables
let players = [];
let ball = { x: 0, y: 0, attachedTo: null };
let scores = { team1: 0, team2: 0 };
let gameTime = 0;

// Handle server broadcast of game state
socket.on('state', (gameState) => {
    players = gameState.players;
    ball = gameState.ball;
    scores = gameState.scores;
    gameTime = gameState.time;

    renderGame();
});

// Handle player movement
document.addEventListener('keydown', (event) => {
    let movement = { vx: 0, vy: 0 };

    if (event.key === 'ArrowUp') {
        movement.vy = -5;
    } else if (event.key === 'ArrowDown') {
        movement.vy = 5;
    } else if (event.key === 'ArrowLeft') {
        movement.vx = -5;
    } else if (event.key === 'ArrowRight') {
        movement.vx = 5;
    }

    // Send movement data to the server
    if (movement.vx !== 0 || movement.vy !== 0) {
        socket.emit('move', movement);
    }
});

// Handle ball throw
canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    if (ball.attachedTo === 'player') {
        const directionX = mouseX - ball.x;
        const directionY = mouseY - ball.y;
        const speed = 5;

        // Send ball throw data to the server
        socket.emit('moveBall', { dx: directionX * speed, dy: directionY * speed });
    }
});

// Render the game state to the canvas
function renderGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);  // Clear previous frame

    // Field dimensions (3/4 of screen height and full width minus borders)
    const fieldWidth = canvas.width - 40;
    const fieldHeight = canvas.height * 0.75;
    const fieldX = 20;
    const fieldY = (canvas.height - fieldHeight) / 2;

    // Draw the field
    ctx.fillStyle = '#d3d3d3';
    ctx.fillRect(fieldX, fieldY, fieldWidth, fieldHeight);

    // Draw center line
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, fieldY);
    ctx.lineTo(canvas.width / 2, fieldY + fieldHeight);
    ctx.stroke();

    // Draw goals
    ctx.fillStyle = 'green';
    const goalWidth = 50;
    const goalDepth = 10;

    // Team 1 goal (left side)
    ctx.fillRect(fieldX - goalWidth, fieldY + fieldHeight / 2 - goalDepth / 2, goalWidth, goalDepth);

    // Team 2 goal (right side)
    ctx.fillRect(fieldX + fieldWidth, fieldY + fieldHeight / 2 - goalDepth / 2, goalWidth, goalDepth);

    // Draw players
    players.forEach((player) => {
        ctx.fillStyle = player.team === 'team1' ? 'blue' : 'red';
        ctx.fillRect(player.x, player.y, 30, 30); // Draw player as a 30x30 square
    });

    // Draw ball
    ctx.fillStyle = 'yellow';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, 10, 0, Math.PI * 2); // Draw ball as a circle
    ctx.fill();

    // Draw the scores and timer above the field
    ctx.fillStyle = 'black';
    ctx.font = '24px Arial';
    const scoreText = `Blue Team: ${scores.team1} | ${gameTime}s | ${scores.team2} : Team Red`;
    ctx.fillText(scoreText, canvas.width / 2 - ctx.measureText(scoreText).width / 2, 30);  // Center the score text

    // Optional: Draw a boundary or goal lines (can be added based on your design)
}
