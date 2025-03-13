// Sprites and asset management

// Default sprite size
const SPRITE_SIZE = 32;

// Create a placeholder sprite with the given color and size
function createSprite(color, width, height) {
    // Create an offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    // Draw a circle instead of a rectangle
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, Math.PI * 2);
    ctx.fill();
    
    return canvas;
}

// Placeholder sprites for development
const placeholderSprites = {
    // Characters
    knight: createSprite('#8888ff', SPRITE_SIZE, SPRITE_SIZE),
    archer: createSprite('#88ff88', SPRITE_SIZE, SPRITE_SIZE),
    mage: createSprite('#ff88ff', SPRITE_SIZE, SPRITE_SIZE),
    
    // Enemies
    zombie: createSprite('#88aa88', SPRITE_SIZE, SPRITE_SIZE),
    skeleton: createSprite('#aaaaaa', SPRITE_SIZE, SPRITE_SIZE),
    vampire: createSprite('#aa0000', SPRITE_SIZE, SPRITE_SIZE),
    bat: createSprite('#550000', SPRITE_SIZE * 0.7, SPRITE_SIZE * 0.7),
    ghost: createSprite('#aaaaff', SPRITE_SIZE, SPRITE_SIZE),
    assassin: createSprite('#660066', SPRITE_SIZE * 0.9, SPRITE_SIZE * 0.9),
    berserker: createSprite('#ff3300', SPRITE_SIZE * 1.3, SPRITE_SIZE * 1.3),
    bomber: createSprite('#ff5500', SPRITE_SIZE * 0.8, SPRITE_SIZE * 0.8),
    
    // Bosses
    necromancer: createSprite('#800080', SPRITE_SIZE * 1.5, SPRITE_SIZE * 1.5),
    deathKnight: createSprite('#4a4a4a', SPRITE_SIZE * 1.6, SPRITE_SIZE * 1.6),
    vampireLord: createSprite('#8b0000', SPRITE_SIZE * 1.4, SPRITE_SIZE * 1.4),
    lich: createSprite('#00bfff', SPRITE_SIZE * 1.5, SPRITE_SIZE * 1.5),
    demon: createSprite('#ff4500', SPRITE_SIZE * 1.8, SPRITE_SIZE * 1.8),
    assassinLord: createSprite('#9900cc', SPRITE_SIZE * 2.0, SPRITE_SIZE * 2.0),
    
    // Items
    healthPotion: createSprite('#ff0000', SPRITE_SIZE * 0.5, SPRITE_SIZE * 0.5),
    magnet: createSprite('#ffff00', SPRITE_SIZE * 0.5, SPRITE_SIZE * 0.5),
    
    // Weapons
    sword: createSprite('#cccccc', SPRITE_SIZE * 0.8, SPRITE_SIZE * 0.3),
    bow: createSprite('#aa8800', SPRITE_SIZE * 0.7, SPRITE_SIZE * 0.7),
    wand: createSprite('#ff00ff', SPRITE_SIZE * 0.8, SPRITE_SIZE * 0.2),
    axe: createSprite('#aaaaaa', SPRITE_SIZE * 0.6, SPRITE_SIZE * 0.6),
    fireball: createSprite('#ff8800', SPRITE_SIZE * 0.4, SPRITE_SIZE * 0.4),
    arrow: createSprite('#aa8800', SPRITE_SIZE * 0.5, SPRITE_SIZE * 0.1),
    
    // Passive items
    boots: createSprite('#aa8866', SPRITE_SIZE * 0.5, SPRITE_SIZE * 0.5),
    shield: createSprite('#0000aa', SPRITE_SIZE * 0.5, SPRITE_SIZE * 0.7),
    amulet: createSprite('#ffaa00', SPRITE_SIZE * 0.4, SPRITE_SIZE * 0.4),
    ring: createSprite('#ffff88', SPRITE_SIZE * 0.3, SPRITE_SIZE * 0.3),
    crown: createSprite('#ffff00', SPRITE_SIZE * 0.5, SPRITE_SIZE * 0.4),
    
    // Projectiles
    laserBeam: createSprite('#ff0000', SPRITE_SIZE * 2, SPRITE_SIZE * 0.2),
    
    // Environment
    grass: createSprite('#005500', SPRITE_SIZE, SPRITE_SIZE),
    stone: createSprite('#555555', SPRITE_SIZE, SPRITE_SIZE),
    tree: createSprite('#007700', SPRITE_SIZE, SPRITE_SIZE * 1.5),
    
    // Effects
    explosion: createSprite('#ff8800', SPRITE_SIZE, SPRITE_SIZE),
    sparkle: createSprite('#ffffff', SPRITE_SIZE * 0.5, SPRITE_SIZE * 0.5),
    hit: createSprite('#ff0000', SPRITE_SIZE * 0.5, SPRITE_SIZE * 0.5),
    heal: createSprite('#00ff00', SPRITE_SIZE * 0.5, SPRITE_SIZE * 0.5)
};

// Paths to actual sprite images (to be loaded later)
const spriteImagePaths = {
    // Characters
    knight: 'assets/knight.png',
    archer: 'assets/archer.png',
    mage: 'assets/mage.png',
    
    // Enemies
    zombie: 'assets/zombie.png',
    skeleton: 'assets/skeleton.png',
    vampire: 'assets/vampire.png',
    bat: 'assets/bat.png',
    ghost: 'assets/ghost.png',
    
    // Bosses
    necromancer: 'assets/necromancer.png',
    deathKnight: 'assets/death_knight.png',
    vampireLord: 'assets/vampire_lord.png',
    lich: 'assets/lich.png',
    demon: 'assets/demon.png',
    
    // Items and weapons
    healthPotion: 'assets/health_potion.png',
    magnet: 'assets/magnet.png',
    sword: 'assets/sword.png',
    bow: 'assets/bow.png',
    wand: 'assets/wand.png',
    axe: 'assets/axe.png',
    fireball: 'assets/fireball.png',
    arrow: 'assets/arrow.png',
    
    // Passive items
    boots: 'assets/boots.png',
    shield: 'assets/shield.png',
    amulet: 'assets/amulet.png',
    ring: 'assets/ring.png',
    crown: 'assets/crown.png',
    
    // Environment
    grass: 'assets/grass.png',
    stone: 'assets/stone.png',
    tree: 'assets/tree.png',
    
    // New enemy types
    assassin: 'assets/assassin.png',
    berserker: 'assets/berserker.png',
    bomber: 'assets/bomber.png',
    
    // New boss types
    assassinLord: 'assets/assassin_lord.png'
};

// Actual sprite images (will be populated after loading)
const sprites = { 
    ...placeholderSprites,
    
    // Add missing sprites
    experienceGem: createSprite('#00ffff', SPRITE_SIZE * 0.5, SPRITE_SIZE * 0.5),
    laserGun: createSprite('#ff6666', SPRITE_SIZE * 0.6, SPRITE_SIZE * 0.6),
    speedBoots: createSprite('#55aaff', SPRITE_SIZE * 0.5, SPRITE_SIZE * 0.5),
    
    // Ensure these exist with proper naming
    archer: createSprite('#88aa88', SPRITE_SIZE, SPRITE_SIZE),
    mage: createSprite('#aa88aa', SPRITE_SIZE, SPRITE_SIZE),
    deathknight: createSprite('#4a4a4a', SPRITE_SIZE * 1.6, SPRITE_SIZE * 1.6),
    vampirelord: createSprite('#8b0000', SPRITE_SIZE * 1.4, SPRITE_SIZE * 1.4),
    assassinlord: createSprite('#9900cc', SPRITE_SIZE * 2.0, SPRITE_SIZE * 2.0)
};

// Load all sprites
async function loadAllSprites() {
    // Simply return true since we're using placeholder sprites only
    console.log('Using placeholder sprites only');
    return true;
}

// Draw a sprite with rotation
function drawSprite(ctx, sprite, x, y, width, height, rotation = 0) {
    // Get the sprite image if a string was passed
    let spriteImage = sprite;
    if (typeof sprite === 'string') {
        spriteImage = sprites[sprite];
        if (!spriteImage) {
            console.warn(`Sprite not found: ${sprite}`);
            // Draw a placeholder for missing sprites
            ctx.save();
            ctx.translate(x + width / 2, y + height / 2);
            ctx.rotate(rotation);
            ctx.fillStyle = '#FF00FF'; // Magenta for missing sprites
            
            // Draw a circle
            const radius = Math.min(width, height) / 2;
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
            return;
        }
    }
    
    // Check if the sprite is a valid image
    if (!spriteImage || typeof spriteImage.width !== 'number') {
        console.warn('Invalid sprite image:', sprite);
        
        // Draw a placeholder circle instead of a rectangle
        ctx.save();
        ctx.translate(x + width / 2, y + height / 2);
        ctx.rotate(rotation);
        ctx.fillStyle = '#FF00FF'; // Magenta for missing sprites
        
        // Draw a circle
        const radius = Math.min(width, height) / 2;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        return;
    }
    
    // Draw the sprite
    ctx.save();
    ctx.translate(x + width / 2, y + height / 2);
    ctx.rotate(rotation);
    ctx.drawImage(spriteImage, -width / 2, -height / 2, width, height);
    ctx.restore();
}

// Create a simple animated sprite effect
function createAnimatedEffect(type, x, y, duration = 500) {
    return {
        type,
        x,
        y,
        startTime: Date.now(),
        duration,
        isActive: true,
        update() {
            const elapsed = Date.now() - this.startTime;
            if (elapsed >= this.duration) {
                this.isActive = false;
            }
            return this.isActive;
        },
        draw(ctx) {
            const elapsed = Date.now() - this.startTime;
            const progress = elapsed / this.duration;
            const size = SPRITE_SIZE * (1 - progress);
            
            ctx.globalAlpha = 1 - progress;
            
            // Use a placeholder circle if the sprite doesn't exist
            const sprite = sprites[type];
            if (!sprite) {
                ctx.fillStyle = '#FF00FF';
                ctx.beginPath();
                ctx.arc(this.x, this.y, size/2, 0, Math.PI * 2);
                ctx.fill();
            } else {
                drawSprite(ctx, sprite, this.x - size / 2, this.y - size / 2, size, size);
            }
            
            ctx.globalAlpha = 1;
        }
    };
} 