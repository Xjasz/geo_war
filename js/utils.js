// Utility functions for the game

// Calculate distance between two points
function distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

// Expose utility functions to the global scope
window.distance = distance;
window.getAngle = getAngle;

// Get angle between two points in radians
function getAngle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

// Format time as MM:SS
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Random integer between min and max (inclusive)
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Check collision between two rectangles
function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

// Find the closest entity from a list to a given position
function findClosestEntity(x, y, entities) {
    if (entities.length === 0) return null;
    
    let closest = entities[0];
    let closestDistance = distance(x, y, closest.x, closest.y);
    
    for (let i = 1; i < entities.length; i++) {
        const entity = entities[i];
        const dist = distance(x, y, entity.x, entity.y);
        
        if (dist < closestDistance) {
            closest = entity;
            closestDistance = dist;
        }
    }
    
    return { entity: closest, distance: closestDistance };
}

// Create a simple sprite
function createSprite(color, width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    // Draw a circle instead of a rectangle for character sprites
    ctx.fillStyle = color;
    
    // Draw a circle that fits within the sprite dimensions
    const radius = Math.min(width, height) / 2;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
    ctx.fill();
    
    return canvas;
}

// Load an image and return a promise
function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = (e) => {
            console.warn(`Failed to load image: ${src}`);
            // Create a colored circle as fallback
            const canvas = document.createElement('canvas');
            canvas.width = SPRITE_SIZE;
            canvas.height = SPRITE_SIZE;
            const ctx = canvas.getContext('2d');
            
            // Generate a color based on the filename
            const hash = src.split('/').pop().split('.')[0].split('').reduce((a, b) => {
                a = ((a << 5) - a) + b.charCodeAt(0);
                return a & a;
            }, 0);
            
            const color = `hsl(${Math.abs(hash) % 360}, 70%, 50%)`;
            ctx.fillStyle = color;
            
            // Draw a circle instead of a rectangle
            const radius = SPRITE_SIZE / 2;
            ctx.beginPath();
            ctx.arc(SPRITE_SIZE / 2, SPRITE_SIZE / 2, radius, 0, Math.PI * 2);
            ctx.fill();
            
            // Add a label
            ctx.fillStyle = 'white';
            ctx.font = '8px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(src.split('/').pop().split('.')[0], SPRITE_SIZE/2, SPRITE_SIZE/2);
            
            resolve(canvas);
        };
        img.src = src;
    });
}

// Preload multiple images and return a promise
function preloadImages(sources) {
    const promises = sources.map(src => loadImage(src));
    return Promise.all(promises);
}

// Clamp a value between min and max
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

// Get a random position within the game bounds
function getRandomPosition(gameWidth, gameHeight, margin = 50) {
    return {
        x: randomInt(margin, gameWidth - margin),
        y: randomInt(margin, gameHeight - margin)
    };
}

// Ease in out function for smooth animations
function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

// Lerp (linear interpolation) between two values
function lerp(start, end, t) {
    return start * (1 - t) + end * t;
} 