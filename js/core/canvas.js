// Canvas-based Background Animations
class SpaceBackground {
    constructor() {
        this.backgroundCanvas = document.getElementById('background-canvas');
        this.rocketCanvas = document.getElementById('rocket-canvas');

        this.init();
    }

    init() {
        this.setupCanvases();
        this.createStars();
        this.setupRocket();
        this.startAnimations();
        this.setupEventListeners();
    }

    setupCanvases() {
        // Set canvas dimensions
        this.backgroundCanvas.width = window.innerWidth;
        this.backgroundCanvas.height = window.innerHeight;
        this.rocketCanvas.width = window.innerWidth;
        this.rocketCanvas.height = window.innerHeight;

        // Get contexts
        this.bgCtx = this.backgroundCanvas.getContext('2d');
        this.rocketCtx = this.rocketCanvas.getContext('2d');

        // Set canvas styles
        this.backgroundCanvas.style.width = '100%';
        this.backgroundCanvas.style.height = '100%';
        this.rocketCanvas.style.width = '100%';
        this.rocketCanvas.style.height = '100%';
    }

    createStars() {
        this.stars = [];
        const starCount = Math.min(200, Math.floor((window.innerWidth * window.innerHeight) / 2000));

        for (let i = 0; i < starCount; i++) {
            this.stars.push({
                x: Math.random() * this.backgroundCanvas.width,
                y: Math.random() * this.backgroundCanvas.height,
                radius: Math.random() * 1.5 + 0.5,
                opacity: Math.random() * 0.8 + 0.2,
                speed: 0.05 + Math.random() * 0.1,
                twinkleSpeed: Math.random() * 0.02 + 0.01,
                twinkleOffset: Math.random() * Math.PI * 2
            });
        }

        // Create some larger "special" stars
        for (let i = 0; i < 5; i++) {
            this.stars.push({
                x: Math.random() * this.backgroundCanvas.width,
                y: Math.random() * this.backgroundCanvas.height,
                radius: Math.random() * 2 + 2,
                opacity: Math.random() * 0.9 + 0.1,
                speed: 0.02 + Math.random() * 0.03,
                twinkleSpeed: Math.random() * 0.01 + 0.005,
                twinkleOffset: Math.random() * Math.PI * 2,
                isSpecial: true
            });
        }
    }

    setupRocket() {
        this.rockets = [];
        this.particles = [];
        this.animations = [];
    }

    startAnimations() {
        this.animationRunning = true;
        this.lastFrameTime = performance.now();

        this.animateBackground();
        this.animateRockets();
    }

    animateBackground() {
        if (!this.animationRunning) return;

        requestAnimationFrame(() => this.animateBackground());

        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;

        // Clear background
        this.bgCtx.fillStyle = 'rgba(0, 4, 40, 0.1)';
        this.bgCtx.fillRect(0, 0, this.backgroundCanvas.width, this.backgroundCanvas.height);

        // Draw stars
        this.stars.forEach(star => {
            // Update star position
            star.y += star.speed;
            if (star.y > this.backgroundCanvas.height) {
                star.y = 0;
                star.x = Math.random() * this.backgroundCanvas.width;
            }

            // Twinkle effect
            const twinkle = Math.sin(currentTime * 0.001 * star.twinkleSpeed + star.twinkleOffset) * 0.3 + 0.7;
            const currentOpacity = star.opacity * twinkle;

            // Draw star
            this.bgCtx.beginPath();
            this.bgCtx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);

            if (star.isSpecial) {
                // Create glow effect for special stars
                const gradient = this.bgCtx.createRadialGradient(
                    star.x, star.y, 0,
                    star.x, star.y, star.radius * 3
                );
                gradient.addColorStop(0, `rgba(255, 255, 255, ${currentOpacity})`);
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                this.bgCtx.fillStyle = gradient;
            } else {
                this.bgCtx.fillStyle = `rgba(255, 255, 255, ${currentOpacity})`;
            }

            this.bgCtx.fill();
        });

        // Draw nebula effects occasionally
        if (Math.random() < 0.002) {
            this.drawNebula();
        }
    }

    drawNebula() {
        const x = Math.random() * this.backgroundCanvas.width;
        const y = Math.random() * this.backgroundCanvas.height;
        const radius = Math.random() * 100 + 50;

        const gradient = this.bgCtx.createRadialGradient(x, y, 0, x, y, radius);
        const colors = [
            'rgba(58, 134, 255, 0.1)',
            'rgba(0, 180, 216, 0.05)',
            'rgba(255, 84, 0, 0.03)',
            'rgba(155, 89, 182, 0.02)'
        ];

        colors.forEach((color, index) => {
            gradient.addColorStop(index / colors.length, color);
        });

        this.bgCtx.fillStyle = gradient;
        this.bgCtx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }

    animateRockets() {
        if (!this.animationRunning) return;

        requestAnimationFrame(() => this.animateRockets());

        // Clear rocket canvas
        this.rocketCtx.clearRect(0, 0, this.rocketCanvas.width, this.rocketCanvas.height);

        // Update and draw particles
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.life -= 0.02;

            if (particle.life <= 0) return false;

            this.rocketCtx.globalAlpha = particle.life;
            this.rocketCtx.fillStyle = particle.color;
            this.rocketCtx.fillRect(particle.x, particle.y, particle.size, particle.size);

            return true;
        });

        this.rocketCtx.globalAlpha = 1;

        // Draw active rockets
        this.rockets.forEach(rocket => {
            this.drawRocket(rocket);
        });

        // Update animations
        this.animations = this.animations.filter(animation => {
            const progress = (Date.now() - animation.startTime) / animation.duration;

            if (progress >= 1) {
                if (animation.onComplete) animation.onComplete();
                return false;
            }

            animation.update(progress);
            return true;
        });
    }

    drawRocket(rocket) {
        const ctx = this.rocketCtx;
        const size = 20;

        ctx.save();
        ctx.translate(rocket.x, rocket.y);

        // Rocket body
        ctx.fillStyle = rocket.color || '#ffffff';
        ctx.fillRect(-size/2, -size, size, size * 2);

        // Rocket nose
        ctx.beginPath();
        ctx.moveTo(-size/2, -size);
        ctx.lineTo(size/2, -size);
        ctx.lineTo(0, -size * 1.5);
        ctx.closePath();
        ctx.fill();

        // Rocket fins
        ctx.fillStyle = '#cccccc';
        ctx.fillRect(-size/2 - 5, size - 10, 5, 15);
        ctx.fillRect(size/2, size - 10, 5, 15);

        // Rocket window
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.arc(0, -size/2, 4, 0, Math.PI * 2);
        ctx.fill();

        // Engine glow
        if (rocket.engineOn) {
            const gradient = ctx.createLinearGradient(0, size, 0, size + 30);
            gradient.addColorStop(0, '#ff5400');
            gradient.addColorStop(0.5, '#f39c12');
            gradient.addColorStop(1, 'transparent');

            ctx.fillStyle = gradient;
            ctx.fillRect(-size/4, size, size/2, 30);

            // Add particles for engine
            if (Math.random() < 0.7) {
                this.addParticle({
                    x: rocket.x + (Math.random() - 0.5) * 10,
                    y: rocket.y + size,
                    vx: (Math.random() - 0.5) * 2,
                    vy: Math.random() * 3 + 2,
                    color: ['#ff5400', '#f39c12', '#f1c40f'][Math.floor(Math.random() * 3)],
                    size: Math.random() * 3 + 1,
                    life: 1
                });
            }
        }

        ctx.restore();
    }

    addParticle(particle) {
        this.particles.push(particle);
    }

    launchRocket(missionType) {
        const rocket = {
            x: this.rocketCanvas.width / 2,
            y: this.rocketCanvas.height + 50,
            color: '#ffffff',
            engineOn: true
        };

        this.rockets.push(rocket);

        // Create launch animation
        const animation = {
            startTime: Date.now(),
            duration: 3000,
            update: (progress) => {
                rocket.y = this.rocketCanvas.height + 50 - progress * (this.rocketCanvas.height + 100);
                rocket.x = this.rocketCanvas.width / 2 + Math.sin(progress * Math.PI) * 100;

                // Add smoke trail
                if (Math.random() < 0.8) {
                    this.addParticle({
                        x: rocket.x + (Math.random() - 0.5) * 20,
                        y: rocket.y + 40,
                        vx: (Math.random() - 0.5) * 3,
                        vy: Math.random() * 2 + 1,
                        color: '#95a5a6',
                        size: Math.random() * 4 + 2,
                        life: 0.8
                    });
                }
            },
            onComplete: () => {
                this.rockets = this.rockets.filter(r => r !== rocket);

                // Show mission-specific animation
                this.showMissionAnimation(missionType);
            }
        };

        this.animations.push(animation);
    }

    showMissionAnimation(missionType) {
        const animations = {
            orbital: () => this.showOrbitalAnimation(),
            lunar: () => this.showLunarAnimation(),
            interplanetary: () => this.showInterplanetaryAnimation(),
            satellite: () => this.showSatelliteAnimation(),
            crewed: () => this.showCrewedAnimation()
        };

        if (animations[missionType]) {
            animations[missionType]();
        }
    }

    showOrbitalAnimation() {
        // Create orbital path
        const centerX = this.rocketCanvas.width / 2;
        const centerY = this.rocketCanvas.height / 2;
        const radius = 100;

        const satellite = {
            x: centerX + radius,
            y: centerY,
            angle: 0
        };

        this.rockets.push(satellite);

        const animation = {
            startTime: Date.now(),
            duration: 5000,
            update: (progress) => {
                satellite.angle = progress * Math.PI * 2;
                satellite.x = centerX + Math.cos(satellite.angle) * radius;
                satellite.y = centerY + Math.sin(satellite.angle) * radius;

                // Add occasional sparkle
                if (Math.random() < 0.1) {
                    this.addParticle({
                        x: satellite.x,
                        y: satellite.y,
                        vx: (Math.random() - 0.5) * 0.5,
                        vy: (Math.random() - 0.5) * 0.5,
                        color: '#3498db',
                        size: Math.random() * 2 + 1,
                        life: 0.5
                    });
                }
            },
            onComplete: () => {
                this.rockets = this.rockets.filter(r => r !== satellite);
            }
        };

        this.animations.push(animation);
    }

    showLunarAnimation() {
        // Create moon and rocket approaching it
        const moon = {
            x: this.rocketCanvas.width - 100,
            y: 100,
            radius: 40
        };

        const rocket = {
            x: 100,
            y: this.rocketCanvas.height - 100,
            color: '#ffffff',
            engineOn: true
        };

        this.rockets.push(rocket);

        // Draw moon
        this.rocketCtx.fillStyle = '#bdc3c7';
        this.rocketCtx.beginPath();
        this.rocketCtx.arc(moon.x, moon.y, moon.radius, 0, Math.PI * 2);
        this.rocketCtx.fill();

        const animation = {
            startTime: Date.now(),
            duration: 4000,
            update: (progress) => {
                rocket.x = 100 + progress * (moon.x - 100 - 60);
                rocket.y = this.rocketCanvas.height - 100 - progress * (this.rocketCanvas.height - 200);

                // Point rocket towards moon
                const angle = Math.atan2(moon.y - rocket.y, moon.x - rocket.x);
                // This would require more complex rotation logic
            },
            onComplete: () => {
                this.rockets = this.rockets.filter(r => r !== rocket);

                // Show success particles
                for (let i = 0; i < 50; i++) {
                    this.addParticle({
                        x: rocket.x,
                        y: rocket.y,
                        vx: (Math.random() - 0.5) * 10,
                        vy: (Math.random() - 0.5) * 10,
                        color: '#f1c40f',
                        size: Math.random() * 3 + 1,
                        life: 1
                    });
                }
            }
        };

        this.animations.push(animation);
    }

    setupEventListeners() {
        // Handle window resize
        window.addEventListener('resize', () => {
            this.backgroundCanvas.width = window.innerWidth;
            this.backgroundCanvas.height = window.innerHeight;
            this.rocketCanvas.width = window.innerWidth;
            this.rocketCanvas.height = window.innerHeight;
            this.createStars();
        });

        // Handle visibility change
        document.addEventListener('visibilitychange', () => {
            this.animationRunning = !document.hidden;
            if (this.animationRunning) {
                this.lastFrameTime = performance.now();
                this.animateBackground();
                this.animateRockets();
            }
        });
    }

    // Public method to trigger rocket launch from game
    triggerLaunch(missionType) {
        this.launchRocket(missionType);
    }

    // Cleanup
    destroy() {
        this.animationRunning = false;
        this.bgCtx.clearRect(0, 0, this.backgroundCanvas.width, this.backgroundCanvas.height);
        this.rocketCtx.clearRect(0, 0, this.rocketCanvas.width, this.rocketCanvas.height);
    }
}

// Initialize space background
let spaceBackground;

document.addEventListener('DOMContentLoaded', () => {
    spaceBackground = new SpaceBackground();
});

// Export for use in game
window.spaceBackground = spaceBackground;