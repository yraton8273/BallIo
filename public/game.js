const socket = io();

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let state = { players: [], ball: {}, scores: [] };
let teamName = "";

socket.on("team_assigned", (name) => {
    teamName = name;
    console.log(`Assigned to team: ${teamName}`);
});

socket.on("state", (newState) => {
    state = newState;
});

window.addEventListener("keydown", (e) => {
    if (e.code === "Tab") {
        e.preventDefault();
        socket.emit("switch_control");
    }
});

window.addEventListener("keydown", (e) => {
    if (e.code === "ArrowUp") socket.emit("move", { vx: 0, vy: -100 });
    if (e.code === "ArrowDown") socket.emit("move", { vx: 0, vy: 100 });
    if (e.code === "ArrowLeft") socket.emit("move", { vx: -100, vy: 0 });
    if (e.code === "ArrowRight") socket.emit("move", { vx: 100, vy: 0 });
});

// basic render loop
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw players
    for (const p of state.players) {
        ctx.fillStyle = p.hasBall ? "yellow" : "white";
        ctx.fillRect(p.x - 10, p.y - 10, 20, 20);
    }

    // Draw ball
    if (state.ball) {
        ctx.fillStyle = "orange";
        ctx.beginPath();
        ctx.arc(state.ball.x, state.ball.y, 8, 0, 2 * Math.PI);
        ctx.fill();
    }

    // Draw scores
    ctx.fillStyle = "white";
    ctx.fillText(`${state.scores[0]?.name || ""}: ${state.scores[0]?.score || 0}`, 10, 20);
    ctx.fillText(`${state.scores[1]?.name || ""}: ${state.scores[1]?.score || 0}`, 10, 40);

    requestAnimationFrame(draw);
}
draw();
