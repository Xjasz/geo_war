// Enemies system for the game

// Reference to game dimensions - using references to global variables
// instead of redeclaring them to avoid conflicts

// Update game dimensions - called from main.js when canvas is resized
function updateEnemyBoundaries(width, height) {
    // We'll use the global gameWidth and gameHeight variables
    // This function will be called to ensure enemies respect boundaries
    console.log(`Enemy boundaries updated to ${width}x${height}`);
    
    // Apply boundaries to all existing enemies
    if (typeof enemies !== 'undefined' && Array.isArray(enemies)) {
        const enemyCount = enemies.length;
        let adjustedCount = 0;
        
        enemies.forEach(enemy => {
            if (enemy && enemy.active) {
                const oldX = enemy.x;
                const oldY = enemy.y;
                const margin = 20;
                
                // Apply boundary restrictions using global variables
                enemy.x = Math.max(margin, Math.min(width - margin, enemy.x));
                enemy.y = Math.max(margin, Math.min(height - margin, enemy.y));
                
                // Check if position was adjusted
                if (oldX !== enemy.x || oldY !== enemy.y) {
                    adjustedCount++;
                }
            }
        });
        
        if (adjustedCount > 0) {
            console.log(`Adjusted positions of ${adjustedCount} out of ${enemyCount} enemies to keep them within boundaries`);
        }
    }
}

// Enemy types
const ENEMY_TYPES = {
    ZOMBIE: 'zombie',
    SKELETON: 'skeleton',
    VAMPIRE: 'vampire',
    BAT: 'bat',
    GHOST: 'ghost',
    ARCHER: 'archer',     // New ranged enemy that shoots arrows
    MAGE: 'mage',         // New stationary enemy that shoots fireballs
    MULTIPLIER: 'multiplier', // New enemy that multiplies if not killed quickly
    ASSASSIN: 'assassin',  // New enemy that can stealth and unstealth when attacking
    BERSERKER: 'berserker', // New enemy that gets stronger as health decreases
    BOMBER: 'bomber'      // New enemy that rushes at player and explodes
};

// Enemy definitions
const ENEMIES = {
    [ENEMY_TYPES.ZOMBIE]: {
        name: 'Zombie',
        health: 30,
        damage: 10,
        moveSpeed: 1,
        experienceValue: 10,
        sprite: 'zombie',
        size: 1.0
    },
    [ENEMY_TYPES.SKELETON]: {
        name: 'Skeleton',
        health: 20,
        damage: 15,
        moveSpeed: 1.5,
        experienceValue: 15,
        sprite: 'skeleton',
        size: 0.9
    },
    [ENEMY_TYPES.VAMPIRE]: {
        name: 'Vampire',
        health: 50,
        damage: 20,
        moveSpeed: 1.8,
        experienceValue: 25,
        sprite: 'vampire',
        size: 1.1
    },
    [ENEMY_TYPES.BAT]: {
        name: 'Bat',
        health: 10,
        damage: 5,
        moveSpeed: 2.5,
        experienceValue: 8,
        sprite: 'bat',
        size: 0.7
    },
    [ENEMY_TYPES.GHOST]: {
        name: 'Ghost',
        health: 15,
        damage: 10,
        moveSpeed: 1.2,
        experienceValue: 12,
        sprite: 'ghost',
        size: 0.9,
        phasing: true // Can move through obstacles
    },
    [ENEMY_TYPES.ARCHER]: {
        health: 25,
        damage: 20,
        moveSpeed: 0.8,
        experienceValue: 20,
        sprite: 'archer',
        size: 0.9,
        attackRange: 1200,
        attackCooldown: 2000 // ms
    },
    [ENEMY_TYPES.MAGE]: {
        health: 20,
        damage: 35,
        moveSpeed: 0, // Completely stationary
        experienceValue: 30,
        sprite: 'mage',
        size: 0.9,
        attackRange: 700,
        attackCooldown: 3000 // ms
    },
    [ENEMY_TYPES.MULTIPLIER]: {
        health: 60,
        damage: 12,
        moveSpeed: 0.7,
        experienceValue: 40,
        sprite: 'multiplier',
        size: 1.2,
        multiplyTime: 10000, // Time before multiplying (ms)
        lastMultiplyTime: 0
    },
    [ENEMY_TYPES.ASSASSIN]: {
        name: 'Assassin',
        health: 45,
        damage: 18,
        moveSpeed: 1.5, // Faster than other enemies
        experienceValue: 25,
        sprite: 'assassin',
        size: 0.9,
        stealthed: true, // Starts stealthed
        stealthAttackCooldown: 3000, // ms between stealth attacks
        lastStealthAttackTime: 0,
        stealthAlpha: 0.3 // Opacity when stealthed
    },
    [ENEMY_TYPES.BERSERKER]: {
        name: 'Berserker',
        health: 80,
        damage: 15,
        moveSpeed: 0.9,
        experienceValue: 30,
        sprite: 'berserker',
        size: 1.3,
        enrageThreshold: 0.5, // Becomes enraged at 50% health
        enraged: false,
        damageMultiplier: 1.8, // Damage multiplier when enraged
        speedMultiplier: 1.5   // Speed multiplier when enraged
    },
    [ENEMY_TYPES.BOMBER]: {
        name: 'Bomber',
        health: 30,
        damage: 25,
        moveSpeed: 2.2, // Fast to reach the player
        experienceValue: 20,
        sprite: 'bomber',
        size: 0.8,
        explosionRadius: 100, // Radius of explosion in pixels
        explosionDamage: 30,  // Base damage of explosion
        fuseTime: 1000        // Milliseconds before exploding once in range
    }
};

// Enemy progression - when each enemy type starts appearing
const ENEMY_PROGRESSION = {
    [ENEMY_TYPES.BAT]: 0,          // Available from the start
    [ENEMY_TYPES.ZOMBIE]: 30,       // After 30 seconds
    [ENEMY_TYPES.SKELETON]: 60,     // After 1 minute
    [ENEMY_TYPES.GHOST]: 120,       // After 2 minutes
    [ENEMY_TYPES.ARCHER]: 180,      // After 3 minutes
    [ENEMY_TYPES.VAMPIRE]: 240,     // After 4 minutes
    [ENEMY_TYPES.MAGE]: 280,        // After 5 minutes
    [ENEMY_TYPES.MULTIPLIER]: 360,   // After 6 minutes
    [ENEMY_TYPES.ASSASSIN]: 150,     // After 2.5 minutes
    [ENEMY_TYPES.BERSERKER]: 200,     // After 3.33 minutes
    [ENEMY_TYPES.BOMBER]: 240         // After 4 minutes
};

// Enemy ID counter
let enemyIdCounter = 0;

// Create an enemy
function createEnemy(type, x, y, level = 1) {
    try {
        // Get enemy definition
        const enemyDef = ENEMIES[type];
        if (!enemyDef) {
            console.error(`Unknown enemy type: ${type}`);
            return null;
        }
        
        // Scale stats based on level
        const levelMultiplier = 1 + (level - 1) * 0.3;
        
        // Get size multiplier from enemy definition or default to 1.0
        const sizeMultiplier = enemyDef.size || 1.0;
        
        // Create enemy object
        const enemy = {
            id: enemyIdCounter++,
            type,
            name: enemyDef.name || type,
            x,
            y,
            width: SPRITE_SIZE * sizeMultiplier,
            height: SPRITE_SIZE * sizeMultiplier,
            health: enemyDef.health * (1 + (level - 1) * 0.2), // 20% more health per level
            maxHealth: enemyDef.health * (1 + (level - 1) * 0.2),
            damage: enemyDef.damage * (1 + (level - 1) * 0.1), // 10% more damage per level
            moveSpeed: enemyDef.moveSpeed,
            experienceValue: enemyDef.experienceValue * level,
            sprite: enemyDef.sprite,
            level,
            active: true,
            lastAttackTime: 0,
            phasing: enemyDef.phasing || false,
            isPlayer: false, // Flag to identify as non-player for collision logic
            stunned: false,
            stunnedTime: 0,
            flashTime: 0, // For damage visual feedback
            color: null, // For tinting
            // Assassin specific properties
            stealthed: enemyDef.stealthed || false,
            stealthAttackCooldown: enemyDef.stealthAttackCooldown || 0,
            lastStealthAttackTime: 0,
            stealthAlpha: enemyDef.stealthAlpha || 1.0,
            // Berserker specific properties
            enrageThreshold: enemyDef.enrageThreshold || 0,
            enraged: enemyDef.enraged || false,
            damageMultiplier: enemyDef.damageMultiplier || 1,
            speedMultiplier: enemyDef.speedMultiplier || 1,
            // Bomber specific properties
            explosionRadius: enemyDef.explosionRadius || 0,
            explosionDamage: enemyDef.explosionDamage || 0,
            fuseTime: enemyDef.fuseTime || 0,
            fuseActive: false,
            fuseStartTime: 0,
            
            update(deltaTime, player) {
                if (!this.active || !player || !player.active) return;
                
                // Handle stunned state
                if (this.stunned) {
                    this.stunnedTime -= deltaTime;
                    if (this.stunnedTime <= 0) {
                        this.stunned = false;
                    }
                    return;
                }
                
                // Update flash effect (for damage visualization)
                if (this.flashTime > 0) {
                    this.flashTime -= deltaTime;
                }
                
                // Special behavior based on enemy type
                switch (this.type) {
                    case ENEMY_TYPES.ARCHER:
                        this.updateArcher(deltaTime, player);
                        break;
                    case ENEMY_TYPES.MAGE:
                        this.updateMage(deltaTime, player);
                        break;
                    case ENEMY_TYPES.MULTIPLIER:
                        this.updateMultiplier(deltaTime, player);
                        break;
                    case ENEMY_TYPES.ASSASSIN:
                        this.updateAssassin(deltaTime, player);
                        break;
                    case ENEMY_TYPES.BERSERKER:
                        this.updateBerserker(deltaTime, player);
                        break;
                    case ENEMY_TYPES.BOMBER:
                        this.updateBomber(deltaTime, player);
                        break;
                    default:
                        this.updateDefault(deltaTime, player);
                        break;
                }
                
                // Apply boundary restrictions to keep enemies on screen
                const margin = 20; // Margin from edge of screen
                const width = window.gameWidth || 800;
                const height = window.gameHeight || 600;
                this.x = Math.max(margin, Math.min(width - margin, this.x));
                this.y = Math.max(margin, Math.min(height - margin, this.y));
                
                // Update animation frame
                this.frameTime += deltaTime;
                if (this.frameTime >= this.frameDuration) {
                    this.frameTime = 0;
                    this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
                }
            },
            
            // Default enemy behavior - move towards player
            updateDefault(deltaTime, player) {
                // Move towards player
                const angle = getAngle(this.x, this.y, player.x, player.y);
                this.x += Math.cos(angle) * this.moveSpeed * deltaTime / 16;
                this.y += Math.sin(angle) * this.moveSpeed * deltaTime / 16;
                
                // Apply boundary restrictions immediately to prevent going off-screen
                const margin = 20; // Margin from edge of screen
                const width = window.gameWidth || 800;
                const height = window.gameHeight || 600;
                this.x = Math.max(margin, Math.min(width - margin, this.x));
                this.y = Math.max(margin, Math.min(height - margin, this.y));
            },
            
            // Archer behavior - keep distance and shoot arrows
            updateArcher(deltaTime, player) {
                const dist = distance(this.x, this.y, player.x, player.y);
                const angle = getAngle(this.x, this.y, player.x, player.y);
                
                // Try to maintain optimal distance (400-600 units) - increased to match the doubled attack range
                if (dist < 400) {
                    // Too close, move away quickly
                    this.x -= Math.cos(angle) * this.moveSpeed * 2.0 * deltaTime / 16;
                    this.y -= Math.sin(angle) * this.moveSpeed * 2.0 * deltaTime / 16;
                } else if (dist > 600) {
                    // Too far, move closer slowly
                    this.x += Math.cos(angle) * this.moveSpeed * 0.7 * deltaTime / 16;
                    this.y += Math.sin(angle) * this.moveSpeed * 0.7 * deltaTime / 16;
                } else {
                    // At good distance, strafe perpendicular to player
                    const perpAngle = angle + Math.PI / 2 * (Math.random() > 0.5 ? 1 : -1);
                    this.x += Math.cos(perpAngle) * this.moveSpeed * 0.8 * deltaTime / 16;
                    this.y += Math.sin(perpAngle) * this.moveSpeed * 0.8 * deltaTime / 16;
                }
                
                // Apply boundary restrictions immediately to prevent going off-screen
                const margin = 20; // Margin from edge of screen
                const width = window.gameWidth || 800;
                const height = window.gameHeight || 600;
                this.x = Math.max(margin, Math.min(width - margin, this.x));
                this.y = Math.max(margin, Math.min(height - margin, this.y));
                
                // Shoot arrow at player if cooldown elapsed
                const now = Date.now();
                if (now - this.lastAttackTime > enemyDef.attackCooldown && dist < enemyDef.attackRange) {
                    this.shootArrow(player);
                    this.lastAttackTime = now;
                }
            },
            
            // Mage behavior - stay completely still and cast fireballs
            updateMage(deltaTime, player) {
                // Don't move at all - completely stationary
                
                // Apply boundary restrictions to ensure mage is on screen
                const margin = 20; // Margin from edge of screen
                const width = window.gameWidth || 800;
                const height = window.gameHeight || 600;
                this.x = Math.max(margin, Math.min(width - margin, this.x));
                this.y = Math.max(margin, Math.min(height - margin, this.y));
                
                // Cast fireball at player if cooldown elapsed
                const now = Date.now();
                const dist = distance(this.x, this.y, player.x, player.y);
                if (now - this.lastAttackTime > enemyDef.attackCooldown && dist < enemyDef.attackRange) {
                    this.castFireball(player);
                    this.lastAttackTime = now;
                }
            },
            
            // Multiplier behavior - multiply if not killed quickly
            updateMultiplier(deltaTime, player) {
                // Move towards player (slower than other enemies)
                const angle = getAngle(this.x, this.y, player.x, player.y);
                this.x += Math.cos(angle) * this.moveSpeed * deltaTime / 16;
                this.y += Math.sin(angle) * this.moveSpeed * deltaTime / 16;
                
                // Apply boundary restrictions immediately to prevent going off-screen
                const margin = 20; // Margin from edge of screen
                const width = window.gameWidth || 800;
                const height = window.gameHeight || 600;
                this.x = Math.max(margin, Math.min(width - margin, this.x));
                this.y = Math.max(margin, Math.min(height - margin, this.y));
                
                // Check if it's time to multiply
                const now = Date.now();
                if (!this.lastMultiplyTime) {
                    this.lastMultiplyTime = now;
                }
                
                if (now - this.lastMultiplyTime > enemyDef.multiplyTime) {
                    this.multiply();
                    this.lastMultiplyTime = now;
                }
                
                // Pulse effect as it gets closer to multiplying
                const multiplyProgress = (now - this.lastMultiplyTime) / enemyDef.multiplyTime;
                if (multiplyProgress > 0.8) {
                    // Pulse color between normal and red
                    const pulseRate = Math.sin(now / 100) * 0.5 + 0.5;
                    this.color = `rgba(255, ${Math.floor(100 * (1 - pulseRate))}, ${Math.floor(100 * (1 - pulseRate))}, 1)`;
                }
            },
            
            // Assassin-specific update logic
            updateAssassin(deltaTime, player) {
                // Check distance to player
                const distToPlayer = Math.sqrt(
                    Math.pow(this.x - player.x, 2) + 
                    Math.pow(this.y - player.y, 2)
                );
                
                // Assassin attack range is slightly shorter
                const attackRange = 50;
                const stealthBreakDistance = 120; // Distance at which assassin breaks stealth to attack
                
                // Handle stealth mechanics
                if (this.stealthed) {
                    // Move faster while stealthed
                    const stealthSpeedBonus = 1.5;
                    
                    // If we're close enough to the player, prepare to attack
                    if (distToPlayer <= stealthBreakDistance) {
                        // Break stealth to attack
                        this.stealthed = false;
                        addAnimatedEffect('explosion', this.x, this.y, 300); // Visual effect for unstealth
                        console.log('Assassin breaking stealth to attack!');
                    }
                    
                    // Move toward player while stealthed
                    if (distToPlayer > attackRange && !this.stunned) {
                        // Calculate direction to player
                        const dx = player.x - this.x;
                        const dy = player.y - this.y;
                        const length = Math.sqrt(dx * dx + dy * dy);
                        
                        // Move toward player
                        if (length > 0) {
                            this.x += (dx / length) * this.moveSpeed * stealthSpeedBonus * (deltaTime / 16);
                            this.y += (dy / length) * this.moveSpeed * stealthSpeedBonus * (deltaTime / 16);
                        }
                    }
                } else {
                    // Attack if in range and not stealthed
                    if (distToPlayer <= attackRange) {
                        const now = Date.now();
                        if (now - this.lastAttackTime >= 1000) { // Attack once per second
                            // Deal damage to player
                            if (typeof player.takeDamage === 'function') {
                                player.takeDamage(this.damage);
                            }
                            this.lastAttackTime = now;
                            
                            // After an attack, sometimes return to stealth
                            if (now - this.lastStealthAttackTime >= this.stealthAttackCooldown) {
                                this.stealthed = true;
                                this.lastStealthAttackTime = now;
                                console.log('Assassin returning to stealth after attack');
                            }
                        }
                    } else {
                        // Move toward player when not in attack range and not stealthed
                        // Calculate direction to player
                        const dx = player.x - this.x;
                        const dy = player.y - this.y;
                        const length = Math.sqrt(dx * dx + dy * dy);
                        
                        // Move toward player
                        if (length > 0) {
                            this.x += (dx / length) * this.moveSpeed * (deltaTime / 16);
                            this.y += (dy / length) * this.moveSpeed * (deltaTime / 16);
                        }
                    }
                }
            },
            
            // Archer shoots an arrow
            shootArrow(player) {
                // Ensure player is valid
                if (!player || !player.active) {
                    console.warn('Cannot shoot arrow: invalid player target');
                    return;
                }
                
                // Calculate angle to player with slight lead
                const playerSpeed = Math.sqrt(player.velocityX * player.velocityX + player.velocityY * player.velocityY);
                const leadFactor = 0.5; // How much to lead the target
                
                const leadX = player.x + player.velocityX * leadFactor;
                const leadY = player.y + player.velocityY * leadFactor;
                const angle = getAngle(this.x, this.y, leadX, leadY);
                
                // Create arrow projectile
                const arrow = new Projectile(
                    this.x,
                    this.y,
                    angle,
                    6, // Speed
                    1000, // Range
                    this.damage,
                    'arrow', // Sprite
                    this,
                    5 // Knockback
                );
                
                // Add to projectiles array
                projectiles.push(arrow);
                
                // Visual effect
                addAnimatedEffect('explosion', this.x, this.y, 300);
            },
            
            // Mage casts a fireball
            castFireball(player) {
                // Ensure player is valid
                if (!player || !player.active) {
                    console.warn('Cannot cast fireball: invalid player target');
                    return;
                }
                
                // Calculate angle to player
                const angle = getAngle(this.x, this.y, player.x, player.y);
                
                // Create fireball projectile
                const fireball = new Projectile(
                    this.x,
                    this.y,
                    angle,
                    4, // Speed
                    1000, // Range - can go across the entire map
                    this.damage * 1.5,
                    'fireball', // Sprite
                    this,
                    10 // Knockback
                );
                
                // Add to projectiles array
                projectiles.push(fireball);
                
                // Visual effect
                addAnimatedEffect('explosion', this.x, this.y, 500);
            },
            
            // Multiplier splits into two smaller enemies
            multiply() {
                // Only multiply if health is above 30% to prevent endless multiplication
                if (this.health / this.maxHealth < 0.3) return;
                
                console.log("Multiplier enemy is splitting!");
                
                // Create two new multipliers with reduced stats
                for (let i = 0; i < 2; i++) {
                    const offset = (i === 0) ? -30 : 30;
                    let newX = this.x + offset;
                    let newY = this.y + offset;
                    
                    // Ensure new multipliers are within game boundaries
                    const margin = 20;
                    const width = window.gameWidth || 800;
                    const height = window.gameHeight || 600;
                    newX = Math.max(margin, Math.min(width - margin, newX));
                    newY = Math.max(margin, Math.min(height - margin, newY));
                    
                    // Create a new multiplier with reduced stats
                    const newMultiplier = createEnemy(ENEMY_TYPES.MULTIPLIER, newX, newY, this.level);
                    if (newMultiplier) {
                        // Reduce stats for balance
                        newMultiplier.health = this.health * 0.6;
                        newMultiplier.maxHealth = this.maxHealth * 0.6;
                        newMultiplier.damage = this.damage * 0.8;
                        newMultiplier.width = this.width * 0.8;
                        newMultiplier.height = this.height * 0.8;
                        
                        // Add to enemies array
                        enemies.push(newMultiplier);
                        
                        // Visual effect
                        addAnimatedEffect('explosion', newX, newY, 500);
                    }
                }
            },
            
            // Berserker-specific update logic
            updateBerserker(deltaTime, player) {
                // Check if berserker should enter enraged state
                if (!this.enraged && (this.health / this.maxHealth) <= this.enrageThreshold) {
                    this.enraged = true;
                    console.log('Berserker has become enraged!');
                    
                    // Visual effect for enrage
                    addAnimatedEffect('explosion', this.x, this.y, 500);
                    
                    // Apply visual change - red tint
                    this.color = 0; // Red hue
                }
                
                // Calculate distance to player
                const distToPlayer = Math.sqrt(
                    Math.pow(this.x - player.x, 2) + 
                    Math.pow(this.y - player.y, 2)
                );
                
                // Attack range
                const attackRange = 60;
                
                // Attack if in range
                if (distToPlayer <= attackRange) {
                    const now = Date.now();
                    if (now - this.lastAttackTime >= 1000) { // Attack once per second
                        // Calculate damage based on enrage state
                        let damage = this.damage;
                        if (this.enraged) {
                            damage *= this.damageMultiplier;
                        }
                        
                        // Deal damage to player
                        if (typeof player.takeDamage === 'function') {
                            player.takeDamage(damage);
                        }
                        
                        this.lastAttackTime = now;
                        
                        // Visual effect for attack
                        addAnimatedEffect('hit', 
                            player.x, 
                            player.y, 
                            300
                        );
                    }
                } else {
                    // Move toward player
                    // Calculate direction to player
                    const dx = player.x - this.x;
                    const dy = player.y - this.y;
                    const length = Math.sqrt(dx * dx + dy * dy);
                    
                    // Calculate move speed based on enrage state
                    let moveSpeed = this.moveSpeed;
                    if (this.enraged) {
                        moveSpeed *= this.speedMultiplier;
                    }
                    
                    // Move toward player
                    if (length > 0) {
                        this.x += (dx / length) * moveSpeed * (deltaTime / 16);
                        this.y += (dy / length) * moveSpeed * (deltaTime / 16);
                    }
                }
            },
            
            // Bomber-specific update logic
            updateBomber(deltaTime, player) {
                // Calculate distance to player
                const distToPlayer = Math.sqrt(
                    Math.pow(this.x - player.x, 2) + 
                    Math.pow(this.y - player.y, 2)
                );
                
                // Explosion trigger range
                const explosionRange = this.explosionRadius * 0.7;
                
                // Check if we're close enough to start the fuse
                if (!this.fuseActive && distToPlayer <= explosionRange) {
                    this.fuseActive = true;
                    this.fuseStartTime = Date.now();
                    console.log('Bomber fuse activated!');
                    
                    // Visual effect for fuse activation
                    addAnimatedEffect('sparkle', this.x, this.y, 300);
                }
                
                // If fuse is active, check if it's time to explode
                if (this.fuseActive) {
                    const now = Date.now();
                    const fuseElapsed = now - this.fuseStartTime;
                    
                    // Visual pulsing effect as it's about to explode
                    const pulseFrequency = Math.min(10, (fuseElapsed / this.fuseTime) * 10); // Increase pulse frequency as time goes on
                    const pulseValue = Math.sin(fuseElapsed * 0.01 * pulseFrequency);
                    this.color = pulseValue > 0 ? '#ff0000' : '#ff8800'; // Alternate between red and orange
                    
                    // Check if it's time to explode
                    if (fuseElapsed >= this.fuseTime) {
                        this.explode(player);
                        return;
                    }
                } else {
                    // Rush toward player when not in explosion range
                    // Calculate direction to player
                    const dx = player.x - this.x;
                    const dy = player.y - this.y;
                    const length = Math.sqrt(dx * dx + dy * dy);
                    
                    // Move toward player rapidly
                    if (length > 0) {
                        this.x += (dx / length) * this.moveSpeed * (deltaTime / 16);
                        this.y += (dy / length) * this.moveSpeed * (deltaTime / 16);
                    }
                }
            },
            
            // Bomber explosion method
            explode(player) {
                console.log('Bomber exploding!');
                
                // Create explosion effect
                addAnimatedEffect('explosion', this.x, this.y, 800);
                
                // Deal damage to player if within explosion radius
                const distToPlayer = Math.sqrt(
                    Math.pow(this.x - player.x, 2) + 
                    Math.pow(this.y - player.y, 2)
                );
                
                if (distToPlayer <= this.explosionRadius) {
                    // Calculate damage based on distance (more damage the closer they are)
                    const damageMultiplier = 1 - (distToPlayer / this.explosionRadius);
                    const damage = this.explosionDamage * damageMultiplier;
                    
                    // Deal damage to player
                    player.takeDamage(damage);
                    
                    // Apply knockback to player
                    const knockbackForce = 10 * damageMultiplier;
                    const angle = Math.atan2(player.y - this.y, player.x - this.x);
                    
                    player.velocityX += Math.cos(angle) * knockbackForce;
                    player.velocityY += Math.sin(angle) * knockbackForce;
                }
                
                // Deal damage to other enemies in radius (friendly fire)
                for (const otherEnemy of enemies) {
                    if (otherEnemy === this || !otherEnemy.active) continue;
                    
                    const distToEnemy = Math.sqrt(
                        Math.pow(this.x - otherEnemy.x, 2) + 
                        Math.pow(this.y - otherEnemy.y, 2)
                    );
                    
                    if (distToEnemy <= this.explosionRadius) {
                        // Less damage to other enemies
                        const damageMultiplier = (1 - (distToEnemy / this.explosionRadius)) * 0.5;
                        const damage = this.explosionDamage * damageMultiplier;
                        
                        otherEnemy.takeDamage(damage);
                        
                        // Knockback other enemies
                        const knockbackAngle = Math.atan2(otherEnemy.y - this.y, otherEnemy.x - this.x);
                        const knockbackDistance = 5 * damageMultiplier;
                        
                        otherEnemy.x += Math.cos(knockbackAngle) * knockbackDistance;
                        otherEnemy.y += Math.sin(knockbackAngle) * knockbackDistance;
                    }
                }
                
                // Kill self
                this.die();
            },
            
            draw(ctx) {
                if (!this.active) return;
                
                // Get sprite properties
                const sprite = sprites[this.sprite];
                if (!sprite) {
                    // Draw a placeholder circle
                    ctx.save();
                    // Apply stealth transparency if assassin
                    if (this.stealthed && this.type === ENEMY_TYPES.ASSASSIN) {
                        ctx.globalAlpha = this.stealthAlpha;
                    }
                    
                    // Apply color based on enemy type
                    let fillColor;
                    switch(this.type) {
                        case ENEMY_TYPES.ZOMBIE: fillColor = '#88aa88'; break;
                        case ENEMY_TYPES.SKELETON: fillColor = '#aaaaaa'; break;
                        case ENEMY_TYPES.VAMPIRE: fillColor = '#aa0000'; break;
                        case ENEMY_TYPES.BAT: fillColor = '#550000'; break;
                        case ENEMY_TYPES.GHOST: fillColor = '#aaaaff'; break;
                        case ENEMY_TYPES.ASSASSIN: fillColor = '#660066'; break;
                        case ENEMY_TYPES.BERSERKER: fillColor = '#ff3300'; break;
                        case ENEMY_TYPES.BOMBER: fillColor = '#ff5500'; break;
                        default: fillColor = '#FF00FF'; break;
                    }
                    
                    // Override color if enemy has custom color
                    if (this.color && typeof this.color === 'string') {
                        fillColor = this.color;
                    }
                    
                    ctx.fillStyle = fillColor;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.width/2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                    
                    // Draw health bar if enemy is damaged
                    if (this.health < this.maxHealth) {
                        this.drawHealthBar(ctx);
                    }
                    
                    return;
                }
                
                // Save context state
                ctx.save();
                
                // Check if we need to apply flash effect (when taking damage)
                if (this.flashTime > 0) {
                    ctx.globalAlpha = 0.7 + Math.sin(this.flashTime * 0.1) * 0.3;
                    ctx.filter = 'brightness(200%)';
                } else if (this.stealthed && this.type === ENEMY_TYPES.ASSASSIN) {
                    // Apply stealth transparency effect for assassin
                    ctx.globalAlpha = this.stealthAlpha;
                }
                
                // Check if enemy has a custom color
                if (this.color) {
                    if (typeof this.color === 'string') {
                        // If color is a string (hex/rgb), use it directly
                        ctx.fillStyle = this.color;
                    } else {
                        // If color is a number, use hue-rotate filter
                        ctx.filter = `hue-rotate(${this.color}deg)`;
                    }
                }
                
                // Draw the sprite
                try {
                    ctx.drawImage(
                        sprite.image || sprite,
                        sprite.offsetX || 0, sprite.offsetY || 0, 
                        sprite.width || sprite.width || SPRITE_SIZE, 
                        sprite.height || sprite.height || SPRITE_SIZE,
                        this.x - this.width / 2, this.y - this.height / 2, 
                        this.width, this.height
                    );
                } catch (error) {
                    // Fallback to a circle if drawImage fails
                    console.warn(`Failed to draw sprite for ${this.type}:`, error);
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.width/2, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // Restore context state
                ctx.restore();
                
                // Draw health bar if enemy is damaged
                if (this.health < this.maxHealth) {
                    this.drawHealthBar(ctx);
                }
                
                // Draw debug info if enabled
                if (DEBUG_MODE) {
                    // Draw hit box
                    ctx.strokeStyle = 'red';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
                    
                    // Draw enemy info
                    ctx.fillStyle = 'white';
                    ctx.font = '10px Arial';
                    ctx.fillText(`${this.name} (Lv ${this.level})`, this.x - 20, this.y - this.height / 2 - 15);
                    ctx.fillText(`HP: ${Math.floor(this.health)}/${Math.floor(this.maxHealth)}`, this.x - 20, this.y - this.height / 2 - 25);
                }
                
                // Handle berserker's enraged state visual cues
                if (this.type === ENEMY_TYPES.BERSERKER && this.enraged) {
                    // Add visual cues for enraged state (pulsing, particle effects)
                    ctx.save();
                    const pulseRate = Date.now() % 1000 / 1000;
                    const pulseScale = 1 + pulseRate * 0.2;
                    
                    // Draw pulsing aura around berserker
                    ctx.globalAlpha = 0.3 + pulseRate * 0.2;
                    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.width * pulseScale / 1.5, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
                
                // Add fuse visualization for bomber
                if (this.type === ENEMY_TYPES.BOMBER && this.fuseActive) {
                    ctx.save();
                    
                    // Draw explosion radius indicator
                    const now = Date.now();
                    const fuseElapsed = now - this.fuseStartTime;
                    const fuseProgress = fuseElapsed / this.fuseTime;
                    
                    // Pulsing circle showing explosion radius
                    const pulseRate = Math.sin(now * 0.01) * 0.2 + 0.8;
                    ctx.globalAlpha = 0.2 + (fuseProgress * 0.3);
                    ctx.fillStyle = `rgba(255, ${Math.floor(100 - fuseProgress * 100)}, 0, 0.3)`;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.explosionRadius * pulseRate, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // Timer indicator
                    ctx.globalAlpha = 1;
                    ctx.fillStyle = 'white';
                    ctx.font = '10px Arial';
                    ctx.textAlign = 'center';
                    const timeLeft = ((this.fuseTime - fuseElapsed) / 1000).toFixed(1);
                    ctx.fillText(timeLeft + 's', this.x, this.y - this.height / 2 - 15);
                    
                    ctx.restore();
                }
            },
            
            // Helper method to draw health bar
            drawHealthBar(ctx) {
                const healthPercentage = this.health / this.maxHealth;
                const barWidth = this.width * 0.8;
                const barHeight = 5;
                const barX = this.x - barWidth / 2;
                const barY = this.y - this.height / 2 - 10;
                
                // Background
                ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                ctx.fillRect(barX, barY, barWidth, barHeight);
                
                // Health
                ctx.fillStyle = healthPercentage > 0.5 ? 'green' : healthPercentage > 0.25 ? 'orange' : 'red';
                ctx.fillRect(barX, barY, barWidth * healthPercentage, barHeight);
            },
            
            takeDamage(amount) {
                if (!this.active) return;
                
                // If this is an assassin, make it unstealth when hit
                if (this.type === ENEMY_TYPES.ASSASSIN && this.stealthed) {
                    this.stealthed = false;
                    console.log('Assassin unstealthed from taking damage!');
                    addAnimatedEffect('explosion', this.x, this.y, 300); // Visual effect for unstealth
                }
                
                // Apply damage
                this.health -= amount;
                
                // Apply flash effect for damage visualization
                this.flashTime = 200;
                
                // Check if enemy died
                if (this.health <= 0) {
                    this.die();
                }
            },
            
            die() {
                this.active = false;
                enemiesDefeated++;
                
                // Create death effect
                try {
                    if (typeof addAnimatedEffect === 'function') {
                        addAnimatedEffect('explosion', this.x, this.y, 500);
                    }
                } catch (e) {
                    console.error('Error creating death effect:', e);
                }
                
                // Return experience value for the player
                return this.experienceValue;
            }
        };
        
        return enemy;
    } catch (error) {
        console.error('Error creating enemy:', error);
        return null;
    }
}

// Spawn a random enemy based on game time
function spawnRandomEnemy(gameWidth, gameHeight, player, level) {
    try {
        // Get available enemy types based on game time
        const availableTypes = [];
        const currentGameTime = window.gameTime || 0;
        
        for (const [type, unlockTime] of Object.entries(ENEMY_PROGRESSION)) {
            if (currentGameTime >= unlockTime) {
                availableTypes.push(type);
            }
        }
        
        if (availableTypes.length === 0) {
            console.error('No enemy types available');
            return null;
        }
        
        // Select random enemy type from available types
        const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
        
        // Determine spawn method - 50% chance for random screen position, 50% chance for circle around player
        const useRandomPosition = Math.random() < 0.5;
        let x, y;
        
        if (useRandomPosition) {
            // Random position on screen
            const margin = 50;
            x = margin + Math.random() * (gameWidth - margin * 2);
            y = margin + Math.random() * (gameHeight - margin * 2);
        } else {
            // Original method - spawning in a circle around the player
            const angle = Math.random() * Math.PI * 2;
            const baseSpawnDistance = 200;
            const timeBonus = Math.min(300, currentGameTime); // Cap at 5 minutes (300 seconds)
            
            // Special handling for archers and mages - spawn them farther away
            let spawnDistance;
            if (randomType === ENEMY_TYPES.ARCHER || randomType === ENEMY_TYPES.MAGE) {
                // Spawn ranged enemies much farther away
                spawnDistance = baseSpawnDistance * 2 + (timeBonus / 2) + Math.random() * 100;
            } else {
                // Normal spawn distance for melee enemies
                spawnDistance = baseSpawnDistance + (timeBonus / 3) + Math.random() * 50;
            }
            
            x = player.x + Math.cos(angle) * spawnDistance;
            y = player.y + Math.sin(angle) * spawnDistance;
        }
        
        // Clamp to game bounds with margin
        const margin = 50;
        x = clamp(x, margin, gameWidth - margin);
        y = clamp(y, margin, gameHeight - margin);
        
        // Randomize enemy level based on player level
        let enemyLevel;
        if (player && player.level) {
            // Generate a random level within 5 levels of the player's level (higher or lower)
            const levelVariation = Math.floor(Math.random() * 11) - 5; // -5 to +5
            enemyLevel = Math.max(1, player.level + levelVariation); // Ensure minimum level is 1
            console.log(`Spawning ${randomType} at level ${enemyLevel} (player level: ${player.level}, variation: ${levelVariation})`);
        } else {
            // Fallback to the provided level if player level not available
            enemyLevel = level || 1;
        }
        
        // Create enemy with the randomized level
        const enemy = createEnemy(randomType, x, y, enemyLevel);
        
        // If it's a bat, create a second bat nearby
        if (randomType === ENEMY_TYPES.BAT && enemy) {
            // Create a second bat at a slightly different position
            const offsetX = (Math.random() * 80) - 40; // -40 to +40 pixels
            const offsetY = (Math.random() * 80) - 40; // -40 to +40 pixels
            
            const x2 = clamp(x + offsetX, margin, gameWidth - margin);
            const y2 = clamp(y + offsetY, margin, gameHeight - margin);
            
            // Create the second bat and add it to the enemies array
            const secondBat = createEnemy(ENEMY_TYPES.BAT, x2, y2, enemyLevel);
            if (secondBat && typeof enemies !== 'undefined' && Array.isArray(enemies)) {
                enemies.push(secondBat);
                console.log('Spawned additional bat');
            }
        }
        
        return enemy;
    } catch (error) {
        console.error('Error spawning random enemy:', error);
        return null;
    }
}

// Spawn a wave of enemies
function spawnEnemyWave(count, gameWidth, gameHeight, player, level) {
    const enemies = [];
    
    for (let i = 0; i < count; i++) {
        const enemy = spawnRandomEnemy(gameWidth, gameHeight, player, level);
        if (enemy) {
            enemies.push(enemy);
        }
    }
    
    // Add extra bats to each wave
    const batCount = Math.floor(count / 2); // Add 50% more bats to each wave
    for (let i = 0; i < batCount; i++) {
        // Calculate spawn position for the extra bat
        const angle = Math.random() * Math.PI * 2;
        const spawnDistance = 200 + Math.random() * 50;
        
        let x = player.x + Math.cos(angle) * spawnDistance;
        let y = player.y + Math.sin(angle) * spawnDistance;
        
        // Clamp to game bounds with margin
        const margin = 50;
        x = clamp(x, margin, gameWidth - margin);
        y = clamp(y, margin, gameHeight - margin);
        
        // Create bat enemy
        const bat = createEnemy(ENEMY_TYPES.BAT, x, y, level);
        if (bat) {
            enemies.push(bat);
            console.log('Added extra bat to wave');
        }
    }
    
    return enemies;
} 