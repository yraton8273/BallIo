const socket = io();  // Connect to the server

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const CLOSE_DISTANCE = 50;  // Distance to interact with the ball (for player action)

// Responsive canvas size: 100% width, 75% height
function resizeCanvas() {
    canvas.width = window.innerWidth * 0.9;   // 90% width (5% margin left & right)
    canvas.height = window.innerHeight * 0.75; // 75% height
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();  // Initial call

// Game state variables
let players = [];
let ball = { x: 0, y: 0, attachedTo: null };
let scores = { team1: 0, team2: 0 };
let teamName = '';

// Handle server broadcast of game state
socket.on('state', (gameState) => {
    players = gameState.players;
    ball = gameState.ball;
    scores = gameState.scores;

    renderGame();
});

// Notify server of player movement
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp') {
        socket.emit('move', { vx: 0, vy: -1 });
    } else if (event.key === 'ArrowDown') {
        socket.emit('move', { vx: 0, vy: 1 });
    } else if (event.key === 'ArrowLeft') {
        socket.emit('move', { vx: -1, vy: 0 });
    } else if (event.key === 'ArrowRight') {
        socket.emit('move', { vx: 1, vy: 0 });
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

        socket.emit('moveBall', { dx: directionX * speed, dy: directionY * speed });
    }
});

// Render the game state to the canvas
function renderGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);  // Clear previous frame

    // Draw players
    players.forEach((player) => {
        ctx.fillStyle = player.hasBall ? 'red' : 'blue';
        ctx.fillRect(player.x, player.y, 30, 30);
    });

    // Draw ball
    ctx.fillStyle = 'yellow';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, 10, 0, Math.PI * 2);
    ctx.fill();

    // Draw scores
    ctx.fillStyle = 'black';
    ctx.font = '24px Arial';
    ctx.fillText(`Team 1: ${scores.team1}`, 10, 30);
    ctx.fillText(`Team 2: ${scores.team2}`, canvas.width - 100, 30);
}
