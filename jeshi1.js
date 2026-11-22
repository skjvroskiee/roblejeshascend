const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const coverCanvas = document.getElementById("coverCharacter");
const coverCtx = coverCanvas.getContext("2d");

const WIDTH = 800;
const HEIGHT = 500;

ctx.imageSmoothingEnabled = false;
coverCtx.imageSmoothingEnabled = false;

let gameRunning = false;
let paused = false;
let animationId;
let lastTime = 0;

let score = 0;
let hearts = 3;
let cameraY = 0;
let highestScore = 0;
let invulnerable = 0;

let lastLevel = 0;
let levelBanner = 0;

const FINISH_SCORE = 1500;
const FINISH_Y = 460 + 180 - FINISH_SCORE * 10;

// Each level = 250 score = 2500 world pixels
const LEVEL_SCORE = 250;
const LEVEL_HEIGHT = LEVEL_SCORE * 10;
const MAX_LEVEL = 5;
const HEARTS_PER_LEVEL = 2;

let player;

let platforms = [];
let obstacles = [];
let collectibles = [];
let heartSpots = [];

let keys = {
    left: false,
    right: false
};

let dragActive = false;
let dragX = null;


/* =================================
   DIFFICULTY LEVELS
================================= */

function getLevel() {

    return Math.min(MAX_LEVEL, Math.floor(score / LEVEL_SCORE));

}

// Which level a world height (y) belongs to
function levelAtY(y) {

    let level = Math.floor((460 - y) / LEVEL_HEIGHT);

    return Math.max(0, Math.min(MAX_LEVEL, level));

}

function getDifficultyName() {

    const names = [
        "1 - EASY",
        "2 - EASY",
        "3 - MEDIUM",
        "4 - HARD",
        "5 - HARD",
        "6 - VERY HARD"
    ];

    return names[getLevel()];

}

function updateDifficulty() {

    document.getElementById("level").textContent =
        getDifficultyName();

}

// All the numbers that change as the level goes up
function getLevelSettings(level) {

    return {

        platformWidth: 125 - level * 10,          // 125 -> 75

        horizontalRange: 60 + level * 8,          // wider jumps sideways

        verticalMinimum: 70 + level * 5,          // taller gaps (max jump is ~132)

        movingChance: 0.10 + level * 0.05,
        disappearingChance: 0.06 + level * 0.04,

        movingRange: 22 + level * 6,
        movingSpeed: 1.1 + level * 0.3,

        disappearTime: 0.65 - level * 0.07,

        obstacleChance: 0.10 + level * 0.07,
        secondObstacleChance: level >= 3 ? 0.15 + (level - 3) * 0.1 : 0,

        enemySpeed: 1 + level * 0.25,
        enemyRange: 35 + level * 8

    };

}


/* =================================
   HEART SPOTS (2 PER LEVEL)
================================= */

function createHeartSpots() {

    heartSpots = [];

    for (let level = 0; level <= MAX_LEVEL; level++) {

        let levelStart = 460 - level * LEVEL_HEIGHT;

        // First heart: somewhere in the first half of the level
        let first = levelStart -
            (0.15 + Math.random() * 0.30) * LEVEL_HEIGHT;

        // Second heart: somewhere in the second half of the level
        let second = levelStart -
            (0.55 + Math.random() * 0.35) * LEVEL_HEIGHT;

        heartSpots.push({ y: first, spawned: false });
        heartSpots.push({ y: second, spawned: false });

    }

}

// Called for every new platform. Places a heart when we pass a heart spot.
function maybeSpawnHeart(platform) {

    for (let i = 0; i < heartSpots.length; i++) {

        let spot = heartSpots[i];

        if (!spot.spawned && platform.y <= spot.y) {

            spot.spawned = true;

            collectibles.push({

                x: platform.x + platform.width / 2 - 11,
                y: platform.y - 65,

                collected: false,

                phase: Math.random() * 6

            });

            return;

        }

    }

}



function drawCharacter(context, x, y, scale = 1.3) {

    context.save();

    context.translate(x, y);
    context.scale(scale, scale);

    context.fillStyle = "#000000";

    context.fillRect(7, 0, 18, 3);
    context.fillRect(4, 3, 24, 3);
    context.fillRect(2, 6, 28, 3);
    context.fillRect(1, 9, 30, 18);
    context.fillRect(4, 25, 24, 4);

    context.fillStyle = "#b5224d";

    context.fillRect(7, 1, 18, 2);
    context.fillRect(4, 4, 24, 3);
    context.fillRect(2, 7, 28, 17);
    context.fillRect(4, 24, 24, 3);


    context.fillStyle = "#f2c4a9";

    context.fillRect(7, 13, 18, 12);
    context.fillRect(5, 15, 22, 9);

    context.fillStyle = "#b5224d";

    context.fillRect(7, 9, 18, 5);
    context.fillRect(7, 12, 4, 3);
    context.fillRect(22, 12, 3, 3);


    context.fillStyle = "#000000";

    context.fillRect(9, 16, 3, 5);
    context.fillRect(20, 16, 3, 5);


    context.fillStyle = "#e99a9c";

    context.fillRect(7, 22, 3, 1);
    context.fillRect(22, 22, 3, 1);

    context.fillStyle = "#f2c4a9";
    context.fillRect(13, 25, 6, 3);


    context.fillStyle = "#000000";
    context.fillRect(5, 27, 22, 12);


    context.fillStyle = "#ffffff";
    context.fillRect(8, 28, 16, 9);

    context.fillStyle = "#e8c6b4";
    context.fillRect(13, 28, 6, 3);

    context.fillStyle = "#d95791";
    context.fillRect(7, 37, 18, 8);


    context.fillStyle = "#000000";

    context.fillRect(0, 29, 8, 7);
    context.fillRect(24, 29, 8, 7);


    context.fillStyle = "#f2c4a9";

    context.fillRect(2, 30, 6, 4);
    context.fillRect(24, 30, 6, 4);


    context.fillStyle = "#000000";

    context.fillRect(10, 44, 4, 4);
    context.fillRect(19, 44, 4, 4);

    context.fillStyle = "#f2c4a9";

    context.fillRect(11, 44, 2, 3);
    context.fillRect(20, 44, 2, 3);


    context.fillStyle = "#000000";

    context.fillRect(7, 47, 8, 2);
    context.fillRect(18, 47, 8, 2);

    context.restore();

}


drawCharacter(coverCtx, 43, 20, 1.3);




function startGame() {

    document.getElementById("coverPage").style.display = "none";

    document.getElementById("gameSection").style.display = "block";

    cancelAnimationFrame(animationId);

    score = 0;
    hearts = 3;
    cameraY = 0;
    highestScore = 0;
    invulnerable = 0;
    lastTime = 0;

    lastLevel = 0;
    levelBanner = 0;

    paused = false;
    document.getElementById("pauseOverlay").style.display = "none";

    dragActive = false;
    dragX = null;

    keys.left = false;
    keys.right = false;

    player = {

        x: 379,
        y: 396,

        width: 42,
        height: 64,

        vx: 0,
        vy: -9.5

    };

    platforms = [];
    obstacles = [];
    collectibles = [];

    createHeartSpots();
    createPlatforms();

    document.getElementById("gameOverlay").style.display = "none";

    document.getElementById("overlayTitle").textContent = "GAME OVER!";

    document.getElementById("overlayMessage").textContent =
        "Oh no! Jesh couldn't reach the clouds.";

    document.getElementById("restartButton").style.display = "inline-block";

    updateHearts();
    updateScore();
    updateDifficulty();

    gameRunning = true;

    animationId = requestAnimationFrame(gameLoop);

}


/* =================================
   HOME BUTTON
================================= */

function goHome() {

    gameRunning = false;

    paused = false;
    document.getElementById("pauseOverlay").style.display = "none";

    cancelAnimationFrame(animationId);

    keys.left = false;
    keys.right = false;

    dragActive = false;
    dragX = null;

    document.getElementById("gameSection").style.display = "none";

    document.getElementById("coverPage").style.display = "flex";

}


/* =================================
   QUIT BUTTON
================================= */

function quitGame() {

    if (!gameRunning && !paused) return;

    let confirmQuit = confirm(
        "Are you sure you want to quit the game?"
    );

    if (confirmQuit) {

        gameRunning = false;
        paused = false;

        cancelAnimationFrame(animationId);

        document.getElementById("pauseOverlay").style.display = "none";

        document.getElementById("gameOverlay").style.display = "flex";

        document.getElementById("overlayTitle").textContent = "GAME EXITED";

        document.getElementById("overlayMessage").textContent =
            "Thanks for playing Roble Jeshascend!";

        document.getElementById("finalScore").textContent = score;

        document.getElementById("restartButton").style.display = "none";

        keys.left = false;
        keys.right = false;

        dragActive = false;
        dragX = null;

    }

}


/* =================================
   PAUSE / RESUME
================================= */

function pauseGame() {

    if (!gameRunning) return;

    gameRunning = false;
    paused = true;

    cancelAnimationFrame(animationId);

    keys.left = false;
    keys.right = false;

    dragActive = false;
    dragX = null;

    document.getElementById("pauseOverlay").style.display = "flex";

}

function resumeGame() {

    if (!paused) return;

    paused = false;
    gameRunning = true;
    lastTime = 0;

    document.getElementById("pauseOverlay").style.display = "none";

    animationId = requestAnimationFrame(gameLoop);

}


/* =================================
   CREATE FIRST PLATFORMS
================================= */

function createPlatforms() {

    let settings = getLevelSettings(0);

    // Starting platform (always safe and normal)
    platforms.push({

        x: 338,
        y: 460,

        width: 125,
        height: 15,

        type: "normal",

        baseX: 338,
        range: 0,
        speed: 0,
        phase: 0,

        active: true,
        timer: 0

    });


    let previousX = 338;

    for (let i = 1; i < 12; i++) {

        let y = 460 - i * 84;

        let difference = Math.random() * 120 - 60;

        let x = previousX + difference;

        x = Math.max(15, Math.min(660, x));

        let chance = Math.random();

        let type = "normal";

        if (chance < 0.12) {

            type = "moving";

        } else if (chance < 0.20) {

            type = "disappearing";

        }

        let platform = {

            x: x,
            y: y,

            width: 125,
            height: 15,

            type: type,

            baseX: x,

            range: type === "moving" ? settings.movingRange : 0,

            speed: settings.movingSpeed,

            phase: Math.random() * 6,

            active: true,
            timer: 0

        };

        platforms.push(platform);

        maybeSpawnHeart(platform);

        previousX = x;

    }

}



/* =================================
   GENERATE PLATFORMS (HARDER BY LEVEL)
================================= */

function generatePlatforms() {

    let top = Math.min(...platforms.map(p => p.y));

    while (top > cameraY - 200) {

        let previous = platforms.reduce((a, b) =>
            a.y < b.y ? a : b
        );

        // Difficulty is decided by how high this part of the map is
        let level = levelAtY(previous.y);

        let s = getLevelSettings(level);


        let difference =
            Math.random() * s.horizontalRange * 2 - s.horizontalRange;

        let width = s.platformWidth;

        let x = previous.x + difference;

        x = Math.max(15, Math.min(WIDTH - width - 15, x));


        let verticalGap =
            s.verticalMinimum + Math.random() * 6;

        let y = previous.y - verticalGap;


        let chance = Math.random();

        let type = "normal";

        if (chance < s.movingChance) {

            type = "moving";

        } else if (
            chance < s.movingChance + s.disappearingChance
        ) {

            type = "disappearing";

        }


        let platform = {

            x: x,
            y: y,

            width: width,
            height: 15,

            type: type,

            baseX: x,

            range: type === "moving" ? s.movingRange : 0,

            speed: s.movingSpeed,

            phase: Math.random() * 6,

            active: true,
            timer: 0,

            disappearTime: s.disappearTime

        };

        platforms.push(platform);


        // First obstacle
        if (Math.random() < s.obstacleChance) {

            addObstacle(platform, s);

        }

        // Second obstacle (only on higher levels)
        if (Math.random() < s.secondObstacleChance) {

            addObstacle(platform, s);

        }


        // Restoration heart (exactly 2 per level)
        maybeSpawnHeart(platform);

        top = y;

    }

}

function addObstacle(platform, s) {

    let obstacleX = platform.x +
        (Math.random() < 0.5 ? -35 : platform.width + 5);

    obstacleX = Math.max(
        5,
        Math.min(765, obstacleX)
    );

    let obstacleType =
        Math.random() < 0.5 ? "spike" : "enemy";

    obstacles.push({

        x: obstacleX,
        baseX: obstacleX,

        y: platform.y - 35 - Math.random() * 25,

        width: 30,
        height: 30,

        type: obstacleType,

        phase: Math.random() * 6,

        speed: s.enemySpeed,
        range: s.enemyRange

    });

}


/* =================================
   BACKGROUND
================================= */

function drawBackground() {

    let gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);

    gradient.addColorStop(0, "#a9d9e8");
    gradient.addColorStop(0.45, "#d8eafa");
    gradient.addColorStop(1, "#d8c8f5");

    ctx.fillStyle = gradient;

    ctx.fillRect(0, 0, WIDTH, HEIGHT);



    for (let i = 0; i < 55; i++) {

        let x = (i * 137 + 25) % WIDTH;

        let y = (i * 83 + cameraY * 0.3) % HEIGHT;

        ctx.fillStyle = i % 2 === 0
            ? "#fff2bf"
            : "#ffffff";

        ctx.fillRect(x, y, 4, 4);

    }


    for (let i = 0; i < 9; i++) {

        let x = (i * 115 + 15) % WIDTH;

        let y = (i * 91 + cameraY * 0.4) % HEIGHT;

        ctx.fillStyle = "#ffffff";

        ctx.fillRect(x, y, 65, 13);

        ctx.fillRect(x + 12, y - 12, 30, 13);

        ctx.fillRect(x + 38, y - 7, 22, 9);

        ctx.fillStyle = "#d9e5f8";

        ctx.fillRect(x + 8, y + 10, 48, 4);

    }


    for (let i = 0; i < 7; i++) {

        let x = (i * 109 + 50) % WIDTH;

        let y = (i * 127 + cameraY * 0.6) % HEIGHT;

        ctx.fillStyle = "#f4a8c8";

        ctx.fillRect(x + 4, y, 5, 5);

        ctx.fillRect(x, y + 4, 5, 5);

        ctx.fillRect(x + 8, y + 4, 5, 5);

        ctx.fillRect(x + 4, y + 8, 5, 5);

        ctx.fillStyle = "#f8d98e";

        ctx.fillRect(x + 4, y + 4, 5, 5);

    }

}


/* =================================
   DRAW PLATFORMS
================================= */

function drawPlatforms() {

    platforms.forEach(p => {

        if (!p.active) return;

        let y = p.y - cameraY;

        if (y < -30 || y > HEIGHT + 30) return;


        if (p.type === "normal") {

            ctx.fillStyle = "#79a88c";

            ctx.fillRect(p.x, y, p.width, p.height);

            ctx.fillStyle = "#b8e5aa";

            ctx.fillRect(p.x, y, p.width, 5);

        }

        else if (p.type === "moving") {

            ctx.fillStyle = "#827fc0";

            ctx.fillRect(p.x, y, p.width, p.height);

            ctx.fillStyle = "#cbb8f7";

            ctx.fillRect(p.x, y, p.width, 5);

            ctx.fillStyle = "#ffffff";

            ctx.fillRect(p.x + 12, y + 8, 10, 3);

            ctx.fillRect(p.x + p.width - 22, y + 8, 10, 3);

        }

        else {

            ctx.fillStyle = "#dc91b4";

            ctx.fillRect(p.x, y, p.width, p.height);

            ctx.fillStyle = "#ffcee0";

            ctx.fillRect(p.x, y, p.width, 5);

            ctx.fillStyle = "#ffffff";

            ctx.fillRect(p.x + 12, y + 8, 10, 3);

        }

    });

}


/* =================================
   DRAW FINISH LINE
================================= */

function drawFinishLine() {

    let y = FINISH_Y - cameraY;

    if (y < -30 || y > HEIGHT + 30) return;


    for (let i = 0; i < WIDTH / 20; i++) {

        ctx.fillStyle = i % 2 === 0 ? "#000000" : "#ffffff";

        ctx.fillRect(i * 20, y, 20, 10);

        ctx.fillStyle = i % 2 === 0 ? "#ffffff" : "#000000";

        ctx.fillRect(i * 20, y + 10, 20, 10);

    }

    ctx.fillStyle = "#b34f81";

    ctx.font = "bold 18px 'Courier New', monospace";

    ctx.textAlign = "center";

    ctx.fillText("★ FINISH ★", WIDTH / 2, y - 8);

    ctx.textAlign = "left";

}


/* =================================
   DRAW OBSTACLES
================================= */

function drawObstacles() {

    obstacles.forEach(o => {

        let y = o.y - cameraY;


        if (o.type === "spike") {

            ctx.fillStyle = "#ed7293";

            ctx.fillRect(o.x + 3, y + 10, 25, 18);

            ctx.fillRect(o.x + 7, y + 5, 17, 5);

            ctx.fillRect(o.x + 12, y, 7, 5);

            ctx.fillStyle = "#ffc0d4";

            ctx.fillRect(o.x + 11, y + 11, 5, 8);

        }

        else {

            // Flying enemy
            ctx.fillStyle = "#665487";

            ctx.fillRect(o.x + 5, y + 7, 21, 17);

            ctx.fillStyle = "#a38bce";

            ctx.fillRect(o.x, y + 4, 8, 8);

            ctx.fillRect(o.x + 23, y + 4, 8, 8);

            ctx.fillStyle = "#ffffff";

            ctx.fillRect(o.x + 9, y + 11, 5, 5);

            ctx.fillRect(o.x + 18, y + 11, 5, 5);

            ctx.fillStyle = "#342a46";

            ctx.fillRect(o.x + 11, y + 12, 2, 3);

            ctx.fillRect(o.x + 20, y + 12, 2, 3);

        }

    });

}


/* =================================
   DRAW COLLECTIBLE HEART
================================= */

function drawHeart(x, y) {

    ctx.fillStyle = "#f26e9b";

    ctx.fillRect(x + 4, y, 6, 6);

    ctx.fillRect(x + 12, y, 6, 6);

    ctx.fillRect(x, y + 6, 22, 6);

    ctx.fillRect(x + 4, y + 12, 14, 6);

    ctx.fillRect(x + 8, y + 18, 7, 5);

    ctx.fillStyle = "#ffc5d9";

    ctx.fillRect(x + 5, y + 2, 4, 3);

}


/* =================================
   LEVEL UP BANNER
================================= */

function drawLevelBanner() {

    if (levelBanner <= 0) return;

    ctx.save();

    ctx.globalAlpha = Math.min(1, levelBanner);

    ctx.fillStyle = "#fffaff";

    ctx.fillRect(WIDTH / 2 - 150, 70, 300, 56);

    ctx.strokeStyle = "#8069a5";

    ctx.lineWidth = 4;

    ctx.strokeRect(WIDTH / 2 - 150, 70, 300, 56);

    ctx.fillStyle = "#b34f81";

    ctx.font = "bold 22px 'Courier New', monospace";

    ctx.textAlign = "center";

    ctx.fillText("LEVEL " + (getLevel() + 1), WIDTH / 2, 95);

    ctx.fillStyle = "#8268ac";

    ctx.font = "bold 13px 'Courier New', monospace";

    ctx.fillText(
        getDifficultyName().split(" - ")[1] + " - IT GETS HARDER!",
        WIDTH / 2,
        115
    );

    ctx.textAlign = "left";

    ctx.restore();

}


/* =================================
   UPDATE HEALTH AND SCORE
================================= */

function updateHearts() {

    let html = "";

    for (let i = 0; i < 3; i++) {

        if (i < hearts) {

            html += "♥ ";

        } else {

            html += '<span class="empty-heart">♥</span> ';

        }

    }

    document.getElementById("hearts").innerHTML = html;

}


function updateScore() {

    document.getElementById("score").textContent = score;

    updateDifficulty();

}


/* =================================
   COLLISION DETECTION
================================= */

function collision(a, b) {

    return (

        a.x < b.x + b.width &&

        a.x + a.width > b.x &&

        a.y < b.y + b.height &&

        a.y + a.height > b.y

    );

}


/* =================================
   LOSE HEART
================================= */

function loseHeart() {

    if (invulnerable > 0 || hearts <= 0) return;

    hearts--;

    updateHearts();

    invulnerable = 1.5;

    player.vy = -6;

    if (hearts <= 0) {

        endGame();

    }

}


/* =================================
   COLLECT HEART
================================= */

function collectHeart() {

    if (hearts < 3) {

        hearts++;

        updateHearts();

    }

}


/* =================================
   UPDATE GAME
================================= */

function update(delta) {

    let dt = Math.min(delta / 16.67, 2);


    // Damage protection
    if (invulnerable > 0) {

        invulnerable -= delta / 1000;

    }

    // Level banner timer
    if (levelBanner > 0) {

        levelBanner -= delta / 1000;

    }


    // PLAYER MOVEMENT
    if (keys.left) {

        player.vx = -5;

    }

    else if (keys.right) {

        player.vx = 5;

    }

    else if (dragActive && dragX !== null) {

        let center = player.x + player.width / 2;

        let difference = dragX - center;

        player.vx = Math.max(
            -7,
            Math.min(7, difference * 0.2)
        );

    }

    else {

        player.vx *= 0.82;

    }


    // Horizontal movement
    player.x += player.vx * dt;

    player.x = Math.max(
        0,
        Math.min(WIDTH - player.width, player.x)
    );


    // Gravity
    player.vy += 0.34 * dt;

    if (player.vy > 9) {

        player.vy = 9;

    }


    let previousBottom = player.y + player.height;

    player.y += player.vy * dt;


    // MOVING PLATFORMS
    platforms.forEach(p => {

        if (p.type === "moving" && p.active) {

            p.x = p.baseX +

                Math.sin(
                    Date.now() / 650 * p.speed + p.phase
                ) * p.range;

        }

    });


    // PLATFORM LANDING
    if (player.vy > 0) {

        platforms.forEach(p => {

            if (!p.active) return;

            if (

                player.x + player.width - 5 > p.x &&

                player.x + 5 < p.x + p.width &&

                previousBottom <= p.y &&

                player.y + player.height >= p.y

            ) {

                player.y = p.y - player.height;

                player.vy = -9.5;


                if (p.type === "disappearing" && p.timer <= 0) {

                    p.timer = p.disappearTime || 0.65;

                }

            }

        });

    }


    // DISAPPEARING PLATFORMS
    platforms.forEach(p => {

        if (p.timer > 0) {

            p.timer -= delta / 1000;

            if (p.timer <= 0) {

                p.active = false;

            }

        }

    });


    // CAMERA
    let targetCamera = player.y - 180;

    if (targetCamera < cameraY) {

        cameraY = targetCamera;

    }


    // SCORE
    let currentScore = Math.max(
        0,
        Math.floor((460 - cameraY) / 10)
    );

    if (currentScore > highestScore) {

        highestScore = currentScore;

        score = highestScore;

        updateScore();

    }


    // LEVEL UP
    let currentLevel = getLevel();

    if (currentLevel !== lastLevel) {

        lastLevel = currentLevel;

        levelBanner = 2;

    }


    // FINISH LINE
    if (score >= FINISH_SCORE) {

        winGame();

        return;

    }


    // GENERATE PLATFORMS
    generatePlatforms();


    // REMOVE OLD OBJECTS
    platforms = platforms.filter(
        p => p.y - cameraY < HEIGHT + 100
    );

    obstacles = obstacles.filter(
        o => o.y - cameraY < HEIGHT + 100
    );

    collectibles = collectibles.filter(
        h => !h.collected && h.y - cameraY < HEIGHT + 100
    );


    // OBSTACLE COLLISION
    obstacles.forEach(o => {

        if (o.type === "enemy") {

            o.x = o.baseX +

                Math.sin(
                    Date.now() / 350 * o.speed + o.phase
                ) * o.range;

        }

        let obstacleBox = {

            x: o.x + 3,

            y: o.y - cameraY + 3,

            width: o.width - 6,

            height: o.height - 6

        };

        let playerBox = {

            x: player.x + 7,

            y: player.y - cameraY + 5,

            width: player.width - 14,

            height: player.height - 10

        };

        if (collision(playerBox, obstacleBox)) {

            loseHeart();

        }

    });


    // COLLECTIBLE HEART COLLISION
    collectibles.forEach(h => {

        let floating = Math.sin(
            Date.now() / 250 + h.phase
        ) * 5;

        let heartBox = {

            x: h.x,

            y: h.y + floating - cameraY,

            width: 24,

            height: 25

        };

        let playerBox = {

            x: player.x + 7,

            y: player.y - cameraY + 5,

            width: player.width - 14,

            height: player.height - 10

        };

        if (

            !h.collected &&

            collision(playerBox, heartBox)

        ) {

            h.collected = true;

            collectHeart();

        }

    });


    // FALLING
    if (player.y - cameraY > HEIGHT + 100) {

        loseHeart();

        if (hearts > 0) {

            player.y = cameraY + 180;

            player.vy = -7;

        }

    }

}


/* =================================
   DRAW EVERYTHING
================================= */

function draw() {

    drawBackground();

    drawPlatforms();

    drawFinishLine();

    drawObstacles();


    // Collectible hearts
    collectibles.forEach(h => {

        let floating = Math.sin(
            Date.now() / 250 + h.phase
        ) * 5;

        drawHeart(
            h.x,
            h.y - cameraY + floating
        );

    });


    // Pixel girl
    if (

        invulnerable <= 0 ||

        Math.floor(Date.now() / 100) % 2 === 0

    ) {

        drawCharacter(

            ctx,

            Math.floor(player.x),

            Math.floor(player.y - cameraY),

            1.3

        );

    }

    drawLevelBanner();

}


/* =================================
   GAME LOOP
================================= */

function gameLoop(timestamp) {

    if (!gameRunning) return;

    let delta = lastTime
        ? timestamp - lastTime
        : 16.67;

    lastTime = timestamp;

    update(delta);

    draw();

    if (gameRunning) {

        animationId = requestAnimationFrame(gameLoop);

    }

}


/* =================================
   GAME OVER
================================= */

function endGame() {

    gameRunning = false;

    document.getElementById("finalScore").textContent = score;

    document.getElementById("overlayTitle").textContent = "GAME OVER!";

    document.getElementById("overlayMessage").textContent =
        "Oh no! Jesh couldn't reach the clouds.";

    document.getElementById("restartButton").style.display = "inline-block";

    document.getElementById("gameOverlay").style.display = "flex";

}


/* =================================
   WIN GAME
================================= */

function winGame() {

    gameRunning = false;

    cancelAnimationFrame(animationId);

    // Draw the final frame so the finish line is visible
    draw();

    document.getElementById("finalScore").textContent = score;

    document.getElementById("overlayTitle").textContent = "YOU WIN!";

    document.getElementById("overlayMessage").textContent =
        "Amazing! Jesh reached the finish line!";

    document.getElementById("restartButton").style.display = "inline-block";

    document.getElementById("gameOverlay").style.display = "flex";

}


/* =================================
   KEYBOARD CONTROLS
================================= */

document.addEventListener("keydown", function(e) {

    if (
        ["ArrowLeft", "ArrowRight"].includes(e.key)
    ) {

        e.preventDefault();

    }


    if (

        e.key === "ArrowLeft" ||

        e.key.toLowerCase() === "a"

    ) {

        keys.left = true;

        dragActive = false;

    }


    if (

        e.key === "ArrowRight" ||

        e.key.toLowerCase() === "d"

    ) {

        keys.right = true;

        dragActive = false;

    }

});


document.addEventListener("keyup", function(e) {

    if (

        e.key === "ArrowLeft" ||

        e.key.toLowerCase() === "a"

    ) {

        keys.left = false;

    }


    if (

        e.key === "ArrowRight" ||

        e.key.toLowerCase() === "d"

    ) {

        keys.right = false;

    }

});


/* =================================
   MOUSE AND PHONE CONTROLS
================================= */

function getCanvasPosition(e) {

    let rect = canvas.getBoundingClientRect();

    let scaleX = WIDTH / rect.width;

    return (e.clientX - rect.left) * scaleX;

}


// Disable right-click menu
canvas.addEventListener("contextmenu", function(e) {

    e.preventDefault();

});


// Start dragging
canvas.addEventListener("pointerdown", function(e) {

    if (

        e.pointerType === "touch" ||

        (e.pointerType === "mouse" && e.button === 2)

    ) {

        e.preventDefault();

        dragActive = true;

        dragX = getCanvasPosition(e);

        canvas.setPointerCapture(e.pointerId);

    }

});


// Move while holding
canvas.addEventListener("pointermove", function(e) {

    if (!dragActive) return;

    if (

        e.pointerType === "touch" ||

        (e.pointerType === "mouse" && (e.buttons & 2))

    ) {

        e.preventDefault();

        dragX = getCanvasPosition(e);

    }

});



canvas.addEventListener("pointerup", function() {

    dragActive = false;

    dragX = null;

});

canvas.addEventListener("pointercancel", function() {

    dragActive = false;

    dragX = null;

});

document.addEventListener("visibilitychange", function() {

    if (document.hidden) {

        keys.left = false;

        keys.right = false;

        dragActive = false;

        dragX = null;

    }

});