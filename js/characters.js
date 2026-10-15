// Character classes for the game

// Character types
const CHARACTER_TYPES = {
    KNIGHT: 'knight',
    ARCHER: 'archer',
    MAGE: 'mage'
};

// Character base stats
const CHARACTER_STATS = {
    [CHARACTER_TYPES.KNIGHT]: {
        health: 50,
        moveSpeed: 0.45,
        startingWeapon: 'sword',
        pickupRange: 20,
        description: 'High health, melee specialist'
    },
    [CHARACTER_TYPES.ARCHER]: {
        health: 35,
        moveSpeed: 1.3,
        startingWeapon: 'bow',
        pickupRange: 25,
        description: 'Fast movement, ranged attacks'
    },
    [CHARACTER_TYPES.MAGE]: {
        health: 25,
        moveSpeed: 1.1,
        startingWeapon: 'wand',
        pickupRange: 30,
        description: 'Low health, powerful magic attacks'
    }
};

// Stat caps to prevent values from becoming too high
const STAT_CAPS = {
    maxHealth: 1000,       // Maximum player health
    moveSpeed: 5,          // Maximum movement speed
    damageMultiplier: 10,  // Maximum damage multiplier
    attackSpeedMultiplier: 5, // Maximum attack speed multiplier
    pickupRange: 200       // Maximum pickup range
};

// Create a player character
function createPlayer(type) {
    console.log(`Creating player of type: ${type}`);
    
    try {
        // Get character stats from CHARACTERS object
        const charDef = CHARACTER_STATS[type] || CHARACTER_STATS[CHARACTER_TYPES.KNIGHT];
        
        // Create player object with explicitly reset multipliers
        const player = {
            type,
            sprite: type,
            x: gameWidth / 2,
            y: gameHeight / 2,
            width: SPRITE_SIZE,
            height: SPRITE_SIZE,
            moveSpeed: charDef.moveSpeed,
            health: charDef.health,
            maxHealth: charDef.health,
            level: 1,
            experience: 0,
            experienceToNextLevel: 100,
            items: [],
            weapons: [],
            // Explicitly reset all multipliers
            damageMultiplier: 1.0,
            attackSpeedMultiplier: 1.0,
            moveSpeedMultiplier: 1.0,
            expMultiplier: 1.0,
            pickupRange: charDef.pickupRange || 80,
            active: true,
            invulnerable: false,
            invulnerableTime: 0,
            velocityX: 0,
            velocityY: 0,
            isPlayer: true, // Flag to identify this as a player for collision detection
            // Store base stats for reference when applying passive items
            baseStats: {
                moveSpeed: charDef.moveSpeed,
                health: charDef.health,
                pickupRange: charDef.pickupRange || 80,
                attackSpeed: 1.0
            },
            
            // Function to cap stats to prevent them from becoming too high
            capStats() {
                // Cap health and max health
                if (this.maxHealth > STAT_CAPS.maxHealth) {
                    console.log(`Capping maxHealth from ${this.maxHealth} to ${STAT_CAPS.maxHealth}`);
                    this.maxHealth = STAT_CAPS.maxHealth;
                    if (this.health > this.maxHealth) {
                        this.health = this.maxHealth;
                    }
                }
                
                // Cap damage multiplier
                if (this.damageMultiplier > STAT_CAPS.damageMultiplier) {
                    console.log(`Capping damageMultiplier from ${this.damageMultiplier.toFixed(2)} to ${STAT_CAPS.damageMultiplier}`);
                    this.damageMultiplier = STAT_CAPS.damageMultiplier;
                }
                
                // Cap attack speed multiplier
                if (this.attackSpeedMultiplier > STAT_CAPS.attackSpeedMultiplier) {
                    console.log(`Capping attackSpeedMultiplier from ${this.attackSpeedMultiplier.toFixed(2)} to ${STAT_CAPS.attackSpeedMultiplier}`);
                    this.attackSpeedMultiplier = STAT_CAPS.attackSpeedMultiplier;
                    this.updateWeaponSpeeds();
                }
                
                // Cap move speed and its multiplier
                if (this.moveSpeed > STAT_CAPS.moveSpeed) {
                    console.log(`Capping moveSpeed from ${this.moveSpeed.toFixed(2)} to ${STAT_CAPS.moveSpeed}`);
                    this.moveSpeed = STAT_CAPS.moveSpeed;
                    // Recalculate the moveSpeedMultiplier based on capped move speed
                    this.moveSpeedMultiplier = this.moveSpeed / this.baseStats.moveSpeed;
                }
                
                // Cap pickup range
                if (this.pickupRange > STAT_CAPS.pickupRange) {
                    console.log(`Capping pickupRange from ${this.pickupRange} to ${STAT_CAPS.pickupRange}`);
                    this.pickupRange = STAT_CAPS.pickupRange;
                }
            },
            
            init() {
                console.log(`Initializing player: ${this.type}`);
                
                // Initialize properties
                this.direction = { x: 0, y: 0 };
                this.lastDirection = { x: 1, y: 0 };
                
                // Ensure multipliers are reset
                this.damageMultiplier = 1.0;
                this.attackSpeedMultiplier = 1.0;
                this.moveSpeedMultiplier = 1.0;
                this.expMultiplier = 1.0;
                
                // Add starting weapon based on character type
                let startingWeapon;
                
                switch (this.type) {
                    case 'knight':
                        startingWeapon = ITEMS.sword;
                        break;
                    case 'archer':
                        startingWeapon = ITEMS.bow;
                        break;
                    case 'mage':
                        startingWeapon = ITEMS.wand;
                        break;
                    default:
                        startingWeapon = ITEMS.sword;
                }
                
                console.log(`Adding starting weapon: ${startingWeapon.name}`);
                this.addItem(startingWeapon);
                
                console.log(`Player initialized with ${this.weapons.length} weapons`);
            },
            
            update(deltaTime, keys) {
                // Skip if not active
                if (!this.active) return;
                
                // Update invulnerability timer
                if (this.invulnerable) {
                    this.invulnerableTime -= deltaTime;
                    if (this.invulnerableTime <= 0) {
                        this.invulnerable = false;
                        this.invulnerableTime = 0;
                    }
                }
                
                // Ensure stats are within limits
                this.capStats();
                
                // Handle movement
                let dx = 0;
                let dy = 0;
                
                // Support both arrow keys and WASD
                if (keys.ArrowUp || keys.w || keys.W || keys.up) dy -= 1;
                if (keys.ArrowDown || keys.s || keys.S || keys.down) dy += 1;
                if (keys.ArrowLeft || keys.a || keys.A || keys.left) dx -= 1;
                if (keys.ArrowRight || keys.d || keys.D || keys.right) dx += 1;
                
                // Normalize diagonal movement
                if (dx !== 0 && dy !== 0) {
                    const length = Math.sqrt(dx * dx + dy * dy);
                    dx /= length;
                    dy /= length;
                }
                
                // Apply movement speed with multiplier
                // Ensure multiplier is always a valid number and capped at 3.0
                if (typeof this.moveSpeedMultiplier !== 'number' || isNaN(this.moveSpeedMultiplier)) {
                    console.warn(`Invalid moveSpeedMultiplier: ${this.moveSpeedMultiplier}, resetting to 1.0`);
                    this.moveSpeedMultiplier = 1.0;
                }
                
                // Cap the movement speed multiplier at 3.0
                const cappedMoveSpeedMultiplier = Math.min(this.moveSpeedMultiplier, 3.0);
                if (cappedMoveSpeedMultiplier < this.moveSpeedMultiplier) {
                    console.log(`Capped moveSpeedMultiplier from ${this.moveSpeedMultiplier.toFixed(2)} to 3.0`);
                }
                
                // Apply movement intensity for analog-like control on mobile
                const intensity = this.movementIntensity !== undefined ? this.movementIntensity : 1.0;
                
                dx *= this.moveSpeed * cappedMoveSpeedMultiplier * intensity;
                dy *= this.moveSpeed * cappedMoveSpeedMultiplier * intensity;
                
                // Store velocity for other calculations
                this.velocityX = dx;
                this.velocityY = dy;
                
                // Update player's facing angle based on movement direction
                if (dx !== 0 || dy !== 0) {
                    this.angle = Math.atan2(dy, dx);
                }
                
                // Update position
                this.x += dx;
                this.y += dy;
                
                // Keep player in bounds
                const margin = 20;
                this.x = clamp(this.x, margin, gameWidth - margin);
                this.y = clamp(this.y, margin, gameHeight - margin);
                
                // If not moving, face the closest enemy for weapon targeting
                if (dx === 0 && dy === 0) {
                    const activeEntities = [...enemies, ...bosses].filter(e => e.active);
                    if (activeEntities.length > 0) {
                        const closest = findClosestEntity(this.x, this.y, activeEntities);
                        if (closest) {
                            this.angle = getAngle(this.x, this.y, closest.entity.x, closest.entity.y);
                        }
                    }
                }
                
                // Update weapons
                for (const weapon of this.weapons) {
                    weapon.update(deltaTime, [...enemies, ...bosses]);
                }
                
                // Handle burning effect (from Demon's fire breath)
                if (this.burningEffect) {
                    const now = Date.now();
                    
                    // Apply damage at intervals
                    if (now - this.burningEffect.lastDamageTime >= this.burningEffect.interval) {
                        this.takeDamage(this.burningEffect.damage);
                        this.burningEffect.lastDamageTime = now;
                        
                        // Visual effect
                        addAnimatedEffect('explosion', this.x, this.y, 300);
                    }
                    
                    // Check if burning effect has expired
                    if (now - this.burningEffect.startTime >= this.burningEffect.duration) {
                        this.burningEffect = null;
                        this.color = null;
                    }
                }
            },
            
            draw(ctx) {
                if (!this.active) return;
                
                // Draw player with flash effect when invulnerable
                if (this.invulnerable) {
                    ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 100) * 0.5;
                }
                
                // Draw player sprite
                drawSprite(
                    ctx,
                    sprites[this.sprite],
                    this.x - this.width / 2,
                    this.y - this.height / 2,
                    this.width,
                    this.height
                );
                
                // Reset alpha
                ctx.globalAlpha = 1;
                
                // Draw weapons
                for (const weapon of this.weapons) {
                    if (weapon && weapon.draw) {
                        weapon.draw(ctx);
                    }
                }
                
                // Draw debug info
                if (window.DEBUG_MODE) {
                    // Draw hitbox
                    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
                    ctx.strokeRect(
                        this.x - this.width / 2,
                        this.y - this.height / 2,
                        this.width,
                        this.height
                    );
                    
                    // Draw pickup range
                    ctx.strokeStyle = 'rgba(0, 255, 0, 0.2)';
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.pickupRange || 100, 0, Math.PI * 2);
                    ctx.stroke();
                }
            },
            
            takeDamage(amount) {
                if (!this.active) return;
                
                // Check invulnerability
                if (this.invulnerable) {
                    console.log(`Player is invulnerable for ${this.invulnerableTime}ms, ignoring ${amount} damage`);
                    return;
                }
                
                console.log(`Player taking ${amount} damage`);
                
                // Apply damage reduction
                const damageReduction = this.damageReduction || 0;
                const actualDamage = amount * (1 - damageReduction);
                
                this.health -= actualDamage;
                console.log(`Player health: ${this.health}/${this.maxHealth}`);
                
                // Make player invulnerable briefly
                this.invulnerable = true;
                this.invulnerableTime = 500; // 500ms of invulnerability
                
                // Add visual effect for taking damage
                if (typeof addAnimatedEffect === 'function') {
                    // Red flash effect around player
                    for (let i = 0; i < 8; i++) {
                        const angle = i * Math.PI / 4;
                        const effectX = this.x + Math.cos(angle) * 30;
                        const effectY = this.y + Math.sin(angle) * 30;
                        addAnimatedEffect('hit', effectX, effectY, 30, 'red');
                    }
                }
                
                // Check if player is dead
                if (this.health <= 0) {
                    this.health = 0;
                    this.active = false;
                    console.log("Player has died!");
                    
                    // Trigger game over
                    if (typeof gameOver === 'function') {
                        gameOver();
                    }
                }
            },
            
            die() {
                this.active = false;
                // Game over logic handled by game.js
            },
            
            addExperience(amount) {
                if (!amount || isNaN(amount)) {
                    console.warn(`Invalid experience amount: ${amount}`);
                    return;
                }
                
                // Apply level-based reduction for high levels
                let levelReduction = 1.0;
                if (this.level > 20) {
                    // Gradually reduce XP gain starting at level 20
                    // At level 30, XP gain is reduced by 50%
                    // At level 40, XP gain is reduced by 75%
                    levelReduction = Math.max(0.1, 1.0 - ((this.level - 20) * 0.05));
                    console.log(`Level-based XP reduction: ${levelReduction.toFixed(2)} (level ${this.level})`);
                }
                
                const expMultiplier = this.expMultiplier || 1;
                const actualAmount = amount * expMultiplier * levelReduction;
                
                console.log(`Adding ${actualAmount.toFixed(1)} experience (base: ${amount}, multiplier: ${expMultiplier}, level reduction: ${levelReduction.toFixed(2)})`);
                this.experience += actualAmount;
                
                console.log(`Player experience: ${this.experience}/${this.experienceToNextLevel}`);
                
                // Check for level up
                while (this.experience >= this.experienceToNextLevel) {
                    this.levelUp();
                }
            },
            
            levelUp() {
                this.level++;
                this.experience -= this.experienceToNextLevel;
                this.experienceToNextLevel = Math.floor(this.experienceToNextLevel * 1.2);
                
                console.log(`Player leveled up to level ${this.level}`);
                console.log(`New experience threshold: ${this.experienceToNextLevel}`);
                
                // Increase max health but don't heal to full - reduced from 10 to 5
                const oldMaxHealth = this.maxHealth;
                this.maxHealth += 5; // Reduced from 10
                
                // Cap stats after level up
                this.capStats();
                
                console.log(`Max health increased from ${oldMaxHealth} to ${this.maxHealth}`);
                
                // Trigger level up event (handled by game.js)
                if (typeof this.onLevelUp === 'function') {
                    console.log('Calling onLevelUp callback');
                    this.onLevelUp();
                } else {
                    console.warn('onLevelUp callback is not defined');
                }
            },
            
            addItem(item) {
                if (!item) return false;
                
                console.log(`Adding item: ${item.name}, type: ${item.type}`);
                
                // Check if item already exists in inventory
                const existingItem = this.items.find(i => i.name === item.name);
                
                if (existingItem) {
                    // Check if item is at max count
                    if (item.maxCount && existingItem.count >= item.maxCount) {
                        console.log(`${item.name} is already at maximum count (${item.maxCount})`);
                        return false;
                    }
                    
                    // Increment count for existing item
                    existingItem.count = (existingItem.count || 1) + 1;
                    console.log(`Increased count of ${item.name} to ${existingItem.count}`);
                    
                    // Special handling for Spinning Axe - max 5 axes
                    if (item.name === 'Spinning Axe') {
                        // Update the spinning axes
                        this.updateSpinningAxes();
                        return true;
                    }
                    
                    // If it's a weapon, update its damage
                    if (item.type === ITEM_TYPES.WEAPON) {
                        // Find the corresponding weapon object
                        const weapon = this.weapons.find(w => w.name === item.name);
                        if (weapon) {
                            // Increase damage by 20% of base damage for each additional copy
                            const baseDamage = item.damage * this.damageMultiplier;
                            const damageIncrease = baseDamage * 0.2;
                            weapon.damage += damageIncrease;
                            console.log(`Increased ${weapon.name} damage to ${weapon.damage}`);
                        }
                    }
                    
                    // Apply passive item effects (stacking the effects)
                    if (item.type === ITEM_TYPES.PASSIVE) {
                        applyPassiveItems(this);
                        
                        // Update all weapons with new attack speed
                        this.updateWeaponSpeeds();
                    }
                    
                    // Use consumable immediately
                    if (item.type === ITEM_TYPES.CONSUMABLE) {
                        useConsumable(this, item);
                    }
                    
                    // After applying passive effects, cap stats
                    if (item.type === ITEM_TYPES.PASSIVE) {
                        this.capStats();
                    }
                    
                    return true;
                }
                
                // Add new item to inventory with count of 1
                const newItem = { ...item, count: 1 };
                this.items.push(newItem);
                
                // Add weapon to player's weapons
                if (item.type === ITEM_TYPES.WEAPON) {
                    const weapon = createWeapon(this, item);
                    if (weapon) {
                        // Special handling for first Spinning Axe
                        if (item.name === 'Spinning Axe') {
                            this.weapons.push(weapon);
                            console.log(`Added new weapon: ${item.name}`);
                            return true;
                        }
                        
                        this.weapons.push(weapon);
                        console.log(`Added new weapon: ${item.name}`);
                    }
                }
                
                // Apply passive item effects
                if (item.type === ITEM_TYPES.PASSIVE) {
                    applyPassiveItems(this);
                    
                    // Update all weapons with new attack speed
                    this.updateWeaponSpeeds();
                }
                
                // Use consumable immediately
                if (item.type === ITEM_TYPES.CONSUMABLE) {
                    useConsumable(this, item);
                }
                
                // After applying passive effects, cap stats
                if (item.type === ITEM_TYPES.PASSIVE) {
                    this.capStats();
                }
                
                return true;
            },
            
            // New method to update spinning axes based on count
            updateSpinningAxes() {
                // Find the Spinning Axe item
                const axeItem = this.items.find(i => i.name === 'Spinning Axe');
                if (!axeItem) return;
                
                // Get the count of axes
                const axeCount = axeItem.count;
                console.log(`Updating spinning axes, count: ${axeCount}`);
                
                // Remove all existing spinning axes
                this.weapons = this.weapons.filter(w => w.name !== 'Spinning Axe');
                
                // Create new spinning axes with evenly distributed starting angles
                for (let i = 0; i < axeCount; i++) {
                    // Calculate starting angle for this axe (evenly distributed)
                    const startAngle = (Math.PI * 2 / axeCount) * i;
                    
                    // Create a new axe with this starting angle
                    const weapon = createWeapon(this, axeItem, startAngle);
                    if (weapon) {
                        this.weapons.push(weapon);
                    }
                }
                
                console.log(`Created ${axeCount} spinning axes with distributed angles`);
            },
            
            // Update all weapons with current attack speed multiplier
            updateWeaponSpeeds() {
                console.log(`Updating weapon speeds with attack speed multiplier: ${this.attackSpeedMultiplier}`);
                
                if (!this.weapons || !this.weapons.length) {
                    console.log('No weapons to update');
                    return;
                }
                
                this.weapons.forEach(weapon => {
                    if (weapon instanceof SpinningWeapon) {
                        // Update spinning weapon rotation speed
                        weapon.updateRotationSpeed(this.attackSpeedMultiplier);
                    } else if (weapon.updateAttackSpeed) {
                        // Use updateAttackSpeed method if available
                        weapon.updateAttackSpeed(this.attackSpeedMultiplier);
                    } else if (weapon.attackSpeed) {
                        // Find the base item to get the base attack speed
                        const baseItem = ITEMS[weapon.name.toLowerCase().replace(/\s+/g, '')] || 
                                         Object.values(ITEMS).find(item => item.name === weapon.name);
                        
                        if (baseItem) {
                            const oldAttackSpeed = weapon.attackSpeed;
                            weapon.attackSpeed = baseItem.attackSpeed * this.attackSpeedMultiplier;
                            console.log(`Updated ${weapon.name} attack speed: ${oldAttackSpeed.toFixed(2)} -> ${weapon.attackSpeed.toFixed(2)}`);
                        } else {
                            console.warn(`Could not find base item for weapon: ${weapon.name}`);
                        }
                    }
                });
            },
            
            getHealthPercentage() {
                return this.health / this.maxHealth;
            },
            
            getExperiencePercentage() {
                return this.experience / this.experienceToNextLevel;
            },
            
            resetStats() {
                console.log('Explicitly resetting player stats to base values');
                
                // Get the original character definition
                const charDef = CHARACTER_STATS[this.type] || CHARACTER_STATS[CHARACTER_TYPES.KNIGHT];
                
                // Reset movement speed to base value
                this.moveSpeed = charDef.moveSpeed;
                
                // Reset all multipliers
                this.moveSpeedMultiplier = 1.0;
                this.attackSpeedMultiplier = 1.0;
                this.damageMultiplier = 1.0;
                this.expMultiplier = 1.0;
                
                // Reset other stats
                this.damageReduction = 0;
                this.pickupRange = charDef.pickupRange || 80;
                
                // Ensure baseStats are correct
                this.baseStats = {
                    moveSpeed: charDef.moveSpeed,
                    health: charDef.health,
                    pickupRange: charDef.pickupRange || 80,
                    attackSpeed: 1.0
                };
                
                console.log(`Reset stats - moveSpeed: ${this.moveSpeed}, multiplier: ${this.moveSpeedMultiplier}`);
                
                // Update weapon speeds with reset multipliers
                if (this.weapons && this.weapons.length > 0) {
                    this.updateWeaponSpeeds();
                }
            }
        };
        
        return player;
    } catch (error) {
        console.error(`Error creating player: ${error.message}`);
        return null;
    }
} 