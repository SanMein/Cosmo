// ======= CANVAS SETUP & ANIMATION =======
let animationRunning = true;
const MAX_STARS = 30;
const targetFPS = 30;
const frameInterval = 1000 / targetFPS;

backgroundCanvas.width = window.innerWidth * 0.5;
backgroundCanvas.height = window.innerHeight * 0.5;
rocketCanvas.width = window.innerWidth * 0.5;
rocketCanvas.height = window.innerHeight * 0.5;

backgroundCanvas.style.width = '100%';
backgroundCanvas.style.height = '100%';
rocketCanvas.style.width = '100%';
rocketCanvas.style.height = '100%';

const bgCtx = backgroundCanvas.getContext('2d');
const rocketCtx = rocketCanvas.getContext('2d');

let stars = [];
for (let i = 0; i < MAX_STARS; i++) {
    stars.push({
        x: Math.random() * backgroundCanvas.width,
        y: Math.random() * backgroundCanvas.height,
        radius: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.8 + 0.2,
        speed: 0.05 + Math.random() * 0.1
    });
}

let rocket = {
    x: -50,
    y: window.innerHeight * 0.5 - 100,
    speed: 2,
    visible: false
};

let lastFrameTime = 0;

function animateBackground(timestamp) {
    if (!animationRunning || timestamp - lastFrameTime < frameInterval) {
        requestAnimationFrame(animateBackground);
        return;
    }
    lastFrameTime = timestamp;

    bgCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    bgCtx.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);

    stars.forEach(star => {
        bgCtx.beginPath();
        bgCtx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        bgCtx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        bgCtx.fill();
        star.x -= star.speed;
        if (star.x < 0) star.x = backgroundCanvas.width;
    });

    requestAnimationFrame(animateBackground);
}

function animateRocket(timestamp) {
    if (!animationRunning || timestamp - lastFrameTime < frameInterval) {
        requestAnimationFrame(animateRocket);
        return;
    }

    rocketCtx.clearRect(0, 0, rocketCanvas.width, rocketCanvas.height);

    if (rocket.visible) {
        rocket.x += rocket.speed;
        if (rocket.x > rocketCanvas.width + 50) {
            rocket.x = -50;
            rocket.visible = false;
        }

        // Корпус ракеты
        rocketCtx.beginPath();
        rocketCtx.moveTo(rocket.x, rocket.y);
        rocketCtx.lineTo(rocket.x - 10, rocket.y + 20);
        rocketCtx.lineTo(rocket.x + 10, rocket.y + 20);
        rocketCtx.closePath();
        rocketCtx.fillStyle = '#ff4500';
        rocketCtx.fill();
        rocketCtx.strokeStyle = '#ffffff';
        rocketCtx.lineWidth = 2;
        rocketCtx.stroke();

        // Пламя с частицами
        for (let i = 0; i < 3; i++) {
            rocketCtx.beginPath();
            rocketCtx.arc(
                rocket.x - 12 + Math.random() * 8,
                rocket.y + 25 + Math.random() * 5,
                1 + Math.random() * 2,
                0, Math.PI * 2
            );
            rocketCtx.fillStyle = `rgba(255, ${100 + Math.random() * 155}, 0, ${0.5 + Math.random() * 0.5})`;
            rocketCtx.fill();
        }
    }

    requestAnimationFrame(animateRocket);
}

// ======= ANIMATION CONTROL =======
document.addEventListener('visibilitychange', () => {
    animationRunning = !document.hidden;
    if (animationRunning) {
        lastFrameTime = performance.now();
        animateBackground();
        animateRocket();
    }
});

window.addEventListener('beforeunload', () => {
    animationRunning = false;
    bgCtx.clearRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);
    rocketCtx.clearRect(0, 0, rocketCanvas.width, rocketCanvas.height);
});