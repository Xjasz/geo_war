// Weapons system for the game

// Weapon types
const WEAPON_TYPES = {
    MELEE: 'melee',
    RANGED: 'ranged',
    MAGIC: 'magic',
    SPECIAL: 'special'
};

// Projectile class
class Projectile {
    constructor(x, y, angle, speed, range, damage, sprite, owner, knockback = 0) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed;
        this.range = range;
        this.damage = damage;
        this.sprite = sprite;
        this.owner = owner;
        this.knockback = knockback;
        this.width = 16;
        this.height = 16;
        this.active = true;
        this.distanceTraveled = 0;
        this.hitEnemies = new Set(); // Track which enemies have been hit
        this.piercing = false; // Set to true for piercing projectiles
        this.isPlayer = owner && owner.isPlayer === true; // Set isPlayer flag based on owner
        
        console.log(`Projectile created: damage=${damage}, speed=${speed}, range=${range}`);
    }
    
    update(deltaTime, entities) {
        if (!this.active) return;
        
        // Move projectile
        const dx = Math.cos(this.angle) * this.speed;
        const dy = Math.sin(this.angle) * this.speed;
        this.x += dx;
        this.y += dy;
        
        // Update distance traveled
        this.distanceTraveled += Math.sqrt(dx * dx + dy * dy);
        
        // Check if projectile has reached its range
        if (this.distanceTraveled >= this.range) {
            this.active = false;
            return;
        }
        
        // Check for collisions with entities
        if (entities && entities.length > 0) {
            for (const entity of entities) {
                // Skip inactive entities
                if (!entity.active) continue;
                
                // Skip if this projectile was fired by the player and the entity is also the player
                if (this.isPlayer && entity.isPlayer) continue;
                
                // Skip if this projectile was fired by an enemy and the entity is also an enemy
                if (!this.isPlayer && !entity.isPlayer) continue;
                
                // Skip if this projectile was fired by this entity
                if (this.owner && this.owner.id === entity.id) continue;
                
                // Skip if this entity has already been hit by this projectile
                if (this.hitEnemies.has(entity.id)) continue;
                
                const hitbox = {
                    x: this.x - this.width / 2,
                    y: this.y - this.height / 2,
                    width: this.width,
                    height: this.height
                };
                
                const entityHitbox = {
                    x: entity.x - entity.width / 2,
                    y: entity.y - entity.height / 2,
                    width: entity.width,
                    height: entity.height
                };
                
                if (checkCollision(hitbox, entityHitbox)) {
                    const entityType = entity.isBoss ? 'boss' : 'enemy';
                    console.log(`Projectile hit ${entityType} ${entity.id} (${entity.name}) with damage: ${this.damage}`);
                    
                    // Apply damage
                    entity.takeDamage(this.damage);
                    
                    // Apply knockback (less for bosses)
                    if (this.knockback > 0) {
                        const knockbackAmount = entity.isBoss ? this.knockback * 0.3 : this.knockback;
                        const knockbackAngle = this.angle;
                        entity.x += Math.cos(knockbackAngle) * knockbackAmount;
                        entity.y += Math.sin(knockbackAngle) * knockbackAmount;
                    }
                    
                    // Mark as hit
                    this.hitEnemies.add(entity.id);
                    
                    // Create hit effect
                    try {
                        if (typeof addAnimatedEffect === 'function') {
                            addAnimatedEffect('hit', this.x, this.y, 300);
                        }
                    } catch (e) {
                        console.error('Error creating hit effect:', e);
                    }
                    
                    // Call onHit callback if defined
                    if (typeof this.onHit === 'function') {
                        this.onHit(entity);
                    }
                    
                    // Deactivate projectile if not piercing
                    if (!this.piercing) {
                        this.active = false;
                        break;
                    }
                }
            }
        }
    }
    
    draw(ctx) {
        if (!this.active) return;
        
        // Save context for color tinting
        ctx.save();
        
        // Apply orange tint for enemy projectiles (archer and mage)
        if (!this.isPlayer) {
            ctx.filter = 'sepia(100%) hue-rotate(0deg) saturate(500%)'; // Orange tint
        }
        
        // Draw projectile
        drawSprite(
            ctx,
            sprites[this.sprite] || sprites.fireball,
            this.x - this.width / 2,
            this.y - this.height / 2,
            this.width,
            this.height,
            this.angle
        );
        
        // Restore context
        ctx.restore();
    }
}

// Spinning weapon (like axe)
class SpinningWeapon {
    constructor(owner, damage, range, sprite, rotationSpeed, attackSpeed, startAngle = 0) {
        this.owner = owner;
        this.damage = damage;
        this.range = range;
        this.sprite = sprite;
        this.baseRotationSpeed = rotationSpeed || 0.03; // Default rotation speed if not provided
        this.attackSpeed = attackSpeed;
        this.maxRotationSpeed = 0.12; // Maximum rotation speed cap (4x the base speed)
        // Scale rotation speed with attack speed, but cap it
        this.rotationSpeed = Math.min(this.baseRotationSpeed * (this.attackSpeed / 1.0), this.maxRotationSpeed);
        this.width = 24;
        this.height = 24;
        this.x = owner.x;
        this.y = owner.y;
        this.angle = startAngle; // Use the provided start angle instead of always 0
        this.lastAttackTime = Date.now();
        this.hitEnemies = new Set();
        this.active = true;
        this.name = 'Spinning Axe'; // Set the name for identification
        
        console.log(`SpinningWeapon created: damage=${damage}, range=${range}, baseRotationSpeed=${this.baseRotationSpeed}, scaledRotationSpeed=${this.rotationSpeed}, startAngle=${startAngle}, maxSpeed=${this.maxRotationSpeed}`);
    }
    
    // Update rotation speed based on attack speed multiplier
    updateRotationSpeed(attackSpeedMultiplier) {
        const oldRotationSpeed = this.rotationSpeed;
        this.attackSpeed = this.owner.baseStats.attackSpeed * attackSpeedMultiplier;
        // Calculate new rotation speed but cap it at the maximum
        this.rotationSpeed = Math.min(this.baseRotationSpeed * (this.attackSpeed / 1.0), this.maxRotationSpeed);
        console.log(`Updated SpinningWeapon rotation speed: ${oldRotationSpeed.toFixed(4)} -> ${this.rotationSpeed.toFixed(4)} (max: ${this.maxRotationSpeed.toFixed(4)})`);
    }
    
    update(deltaTime, entities) {
        if (!this.active) return;
        
        // Update angle
        this.angle += this.rotationSpeed;
        
        // Calculate position around player
        this.x = this.owner.x + Math.cos(this.angle) * this.range;
        this.y = this.owner.y + Math.sin(this.angle) * this.range;
        
        // Reset hit enemies every attack cycle
        const now = Date.now();
        if (now - this.lastAttackTime > 1000 / this.attackSpeed) {
            this.hitEnemies.clear();
            this.lastAttackTime = now;
            
            if (window.DEBUG_MODE) {
                console.log(`SpinningWeapon attack cycle reset, cleared hit enemies`);
            }
        }
        
        // Check for collisions with entities (enemies and bosses)
        if (!entities || entities.length === 0) return;
        
        for (const entity of entities) {
            // Skip if already hit this entity in this attack cycle or entity is not active
            if (this.hitEnemies.has(entity.id) || !entity.active) continue;
            
            const hitbox = {
                x: this.x - this.width / 2,
                y: this.y - this.height / 2,
                width: this.width,
                height: this.height
            };
            
            const entityHitbox = {
                x: entity.x - entity.width / 2,
                y: entity.y - entity.height / 2,
                width: entity.width,
                height: entity.height
            };
            
            if (checkCollision(hitbox, entityHitbox)) {
                const entityType = entity.isBoss ? 'boss' : 'enemy';
                console.log(`SpinningWeapon hit ${entityType} ${entity.id} (${entity.name || entity.type}) with damage: ${this.damage}`);
                
                // Apply damage
                entity.takeDamage(this.damage);
                
                // Apply knockback (less for bosses)
                const knockbackAmount = entity.isBoss ? 5 : 15;
                const knockbackAngle = getAngle(this.owner.x, this.owner.y, entity.x, entity.y);
                entity.x += Math.cos(knockbackAngle) * knockbackAmount;
                entity.y += Math.sin(knockbackAngle) * knockbackAmount;
                
                // Mark as hit
                this.hitEnemies.add(entity.id);
                
                // Create hit effect
                try {
                    if (typeof addAnimatedEffect === 'function') {
                        addAnimatedEffect('sparkle', entity.x, entity.y, 300);
                    }
                } catch (e) {
                    console.error('Error creating hit effect:', e);
                }
            }
        }
    }
    
    draw(ctx) {
        if (!this.active) return;
        
        // Draw spinning weapon
        drawSprite(
            ctx,
            sprites[this.sprite] || sprites.axe,
            this.x - this.width / 2,
            this.y - this.height / 2,
            this.width,
            this.height,
            this.angle
        );
        
        // Debug: Draw a line from player to weapon
        if (window.DEBUG_MODE) {
            ctx.beginPath();
            ctx.moveTo(this.owner.x, this.owner.y);
            ctx.lineTo(this.x, this.y);
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.stroke();
            
            // Draw hitbox
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
            ctx.strokeRect(
                this.x - this.width / 2,
                this.y - this.height / 2,
                this.width,
                this.height
            );
        }
    }
}

// Laser beam weapon
class LaserBeam {
    constructor(owner, damage, range, sprite, attackSpeed) {
        this.owner = owner;
        this.damage = damage;
        this.range = range;
        this.sprite = sprite;
        this.baseAttackSpeed = attackSpeed;
        this.attackSpeed = attackSpeed;
        this.width = 10;
        this.height = range;
        this.angle = 0;
        this.active = false;
        this.target = null;
        this.lastAttackTime = 0;
        this.hitEnemies = new Set();
        
        console.log(`LaserBeam created: damage=${damage}, range=${range}, attackSpeed=${attackSpeed}`);
    }
    
    // Update attack speed based on multiplier
    updateAttackSpeed(attackSpeedMultiplier) {
        const oldAttackSpeed = this.attackSpeed;
        this.attackSpeed = this.baseAttackSpeed * attackSpeedMultiplier;
        console.log(`Updated LaserBeam attack speed: ${oldAttackSpeed.toFixed(2)} -> ${this.attackSpeed.toFixed(2)}`);
    }
    
    update(deltaTime, entities) {
        if (!this.active) return;
        
        // Find closest entity if no target or target is dead
        if (!this.target || !this.target.active) {
            const activeEntities = entities.filter(e => e.active);
            if (activeEntities.length === 0) {
                this.active = false;
                return;
            }
            
            const closest = findClosestEntity(this.owner.x, this.owner.y, activeEntities);
            if (closest && closest.distance <= this.range) {
                this.target = closest.entity;
                this.active = true;
            } else {
                this.active = false;
                return;
            }
        }
        
        // Update angle to face target
        this.angle = getAngle(this.owner.x, this.owner.y, this.target.x, this.target.y);
        
        // Reset hit entities every attack cycle
        const now = Date.now();
        if (now - this.lastAttackTime > 1000 / this.attackSpeed) {
            this.hitEnemies.clear();
            this.lastAttackTime = now;
        }
        
        // Check for collisions with entities in the laser's path
        for (const entity of entities) {
            // Skip if already hit this entity in this attack cycle or entity is not active
            if (this.hitEnemies.has(entity.id) || !entity.active) continue;
            
            // Check if entity is in the laser's path
            const distToEntity = distance(this.owner.x, this.owner.y, entity.x, entity.y);
            if (distToEntity > this.range) continue;
            
            // Calculate angle to entity
            const angleToEntity = getAngle(this.owner.x, this.owner.y, entity.x, entity.y);
            
            // Check if entity is within the laser's angle (with some tolerance)
            const angleDiff = Math.abs(this.angle - angleToEntity);
            const tolerance = 0.2; // Radians
            
            if (angleDiff < tolerance || angleDiff > Math.PI * 2 - tolerance) {
                const entityType = entity.isBoss ? 'boss' : 'enemy';
                console.log(`LaserBeam hit ${entityType} ${entity.id} (${entity.name}) with damage: ${this.damage}`);
                
                // Apply damage
                entity.takeDamage(this.damage);
                
                // Mark as hit
                this.hitEnemies.add(entity.id);
                
                // Create hit effect
                try {
                    if (typeof addAnimatedEffect === 'function') {
                        addAnimatedEffect('sparkle', entity.x, entity.y, 300);
                    }
                } catch (e) {
                    console.error('Error creating hit effect:', e);
                }
            }
        }
    }
    
    draw(ctx) {
        if (!this.active || !this.target) return;
        
        // Draw laser beam
        ctx.save();
        ctx.translate(this.owner.x, this.owner.y);
        ctx.rotate(this.angle);
        
        // Draw laser line
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(this.range, 0);
        ctx.stroke();
        
        // Draw laser particles
        for (let i = 0; i < 10; i++) {
            const x = Math.random() * this.range;
            const y = (Math.random() - 0.5) * 10;
            const size = Math.random() * 5 + 2;
            
            ctx.fillStyle = '#ff6666';
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

// Create a weapon based on item type
function createWeapon(player, item, startAngle = 0) {
    if (!item) {
        console.error('Cannot create weapon: item is null or undefined');
        return null;
    }
    
    if (item.type !== ITEM_TYPES.WEAPON) {
        console.error(`Cannot create weapon: item type is ${item.type}, not ${ITEM_TYPES.WEAPON}`);
        return null;
    }
    
    console.log(`Creating weapon from item: ${item.name}, damage: ${item.damage}, attackSpeed: ${item.attackSpeed}`);
    
    const damage = item.damage * (player.damageMultiplier || 1);
    const attackSpeed = item.attackSpeed * (player.attackSpeedMultiplier || 1);
    
    console.log(`Calculated damage: ${damage}, attackSpeed: ${attackSpeed}`);
    
    let weapon = null;
    
    switch (item.name) {
        case 'Sword':
            // Create a sword with arc attack
            weapon = {
                owner: player,
                damage: damage,
                range: item.range,
                sprite: item.sprite,
                baseAttackSpeed: attackSpeed,
                attackSpeed: attackSpeed,
                knockback: item.knockback || 0,
                width: 24,
                height: 24,
                angle: 0,
                lastAttackTime: Date.now(),
                active: true,
                name: item.name,
                arcAngle: item.arcAngle || Math.PI / 2, // 90 degrees in radians
                swinging: false,
                swingStartTime: 0,
                swingDuration: 300, // ms
                hitEntities: new Set(), // Track entities hit during current swing
                
                // Update attack speed based on multiplier
                updateAttackSpeed(attackSpeedMultiplier) {
                    const oldAttackSpeed = this.attackSpeed;
                    this.attackSpeed = this.baseAttackSpeed * attackSpeedMultiplier;
                    console.log(`Updated ${this.name} attack speed: ${oldAttackSpeed.toFixed(2)} -> ${this.attackSpeed.toFixed(2)}`);
                },
                
                // This method is called by the game loop
                update(deltaTime, entities) {
                    // Check if we're currently swinging
                    if (this.swinging) {
                        const now = Date.now();
                        const swingElapsed = now - this.swingStartTime;
                        
                        // If swing is complete, reset
                        if (swingElapsed >= this.swingDuration) {
                            this.swinging = false;
                            this.hitEntities.clear();
                            return;
                        }
                        
                        // Check for hits during the swing
                        this.checkArcHits(entities);
                    }
                },
                
                // Check for hits in the arc
                checkArcHits(entities) {
                    if (!entities || entities.length === 0) return;
                    
                    // Find active entities within range
                    const activeEntities = entities.filter(e => e.active);
                    if (activeEntities.length === 0) return;
                    
                    // Always find the closest enemy to determine attack direction
                    const closest = findClosestEntity(this.owner.x, this.owner.y, activeEntities);
                    if (!closest) return;
                    
                    // Set facing angle toward the closest enemy
                    const facingAngle = getAngle(this.owner.x, this.owner.y, closest.entity.x, closest.entity.y);
                    
                    // Store the attack angle for drawing
                    this.attackAngle = facingAngle;
                    
                    // Check each entity to see if it's in the arc
                    for (const entity of activeEntities) {
                        // Skip if already hit during this swing
                        if (this.hitEntities.has(entity.id)) continue;
                        
                        // Calculate distance and angle to entity
                        const dist = distance(this.owner.x, this.owner.y, entity.x, entity.y);
                        
                        // Skip if out of range
                        if (dist > this.range) continue;
                        
                        // Calculate angle to entity
                        const angleToEntity = getAngle(this.owner.x, this.owner.y, entity.x, entity.y);
                        
                        // Calculate angle difference (accounting for wrapping)
                        let angleDiff = Math.abs(angleToEntity - facingAngle);
                        if (angleDiff > Math.PI) {
                            angleDiff = 2 * Math.PI - angleDiff;
                        }
                        
                        // Check if entity is within the arc angle
                        if (angleDiff <= this.arcAngle / 2) {
                            console.log(`Sword hit ${entity.name || 'enemy'} in arc attack!`);
                            
                            // Apply damage
                            entity.takeDamage(this.damage);
                            
                            // Apply knockback
                            if (this.knockback > 0) {
                                const knockbackAngle = angleToEntity;
                                entity.x += Math.cos(knockbackAngle) * this.knockback;
                                entity.y += Math.sin(knockbackAngle) * this.knockback;
                            }
                            
                            // Mark as hit so we don't hit it again in this swing
                            this.hitEntities.add(entity.id);
                            
                            // Create hit effect
                            try {
                                if (typeof addAnimatedEffect === 'function') {
                                    addAnimatedEffect('hit', entity.x, entity.y, 300);
                                }
                            } catch (e) {
                                console.error('Error creating hit effect:', e);
                            }
                        }
                    }
                },
                
                // This method is called by the game loop to attack
                attack() {
                    const now = Date.now();
                    if (now - this.lastAttackTime < 1000 / this.attackSpeed) return null;
                    
                    // Find active entities
                    const activeEntities = [...enemies, ...bosses].filter(e => e.active);
                    if (activeEntities.length === 0) return null;
                    
                    // Find closest entity to determine if we should attack
                    const closest = findClosestEntity(this.owner.x, this.owner.y, activeEntities);
                    if (!closest || closest.distance > this.range * 1.5) return null; // Allow slightly longer detection range
                    
                    // Start a new swing
                    this.swinging = true;
                    this.swingStartTime = now;
                    this.hitEntities.clear();
                    this.lastAttackTime = now;
                    
                    // Set initial attack angle toward closest enemy
                    this.attackAngle = getAngle(this.owner.x, this.owner.y, closest.entity.x, closest.entity.y);
                    
                    // Immediately check for hits
                    this.checkArcHits([...enemies, ...bosses]);
                    
                    // Return null since we're not creating a projectile
                    return null;
                },
                
                draw(ctx) {
                    // Only draw the sword arc when swinging
                    if (!this.swinging) return;
                    
                    const now = Date.now();
                    const swingProgress = (now - this.swingStartTime) / this.swingDuration;
                    
                    // Use the stored attack angle that points to the closest enemy
                    const facingAngle = this.attackAngle || 0;
                    
                    // Draw arc
                    ctx.beginPath();
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                    ctx.lineWidth = 3;
                    
                    // Calculate arc angles
                    const startAngle = facingAngle - this.arcAngle / 2;
                    const endAngle = facingAngle + this.arcAngle / 2;
                    
                    // Draw the arc
                    ctx.beginPath();
                    ctx.arc(this.owner.x, this.owner.y, this.range, startAngle, endAngle);
                    ctx.stroke();
                    
                    // Draw the sword blade
                    const swordLength = this.range * 0.8;
                    const swordWidth = 10;
                    
                    // Calculate swing animation angle
                    const swingAngle = startAngle + (this.arcAngle * swingProgress);
                    
                    // Draw the sword
                    ctx.save();
                    ctx.translate(this.owner.x, this.owner.y);
                    ctx.rotate(swingAngle);
                    
                    // Draw blade
                    ctx.fillStyle = '#cccccc';
                    ctx.fillRect(0, -swordWidth/2, swordLength, swordWidth);
                    
                    // Draw handle
                    ctx.fillStyle = '#8B4513'; // Brown
                    ctx.fillRect(-10, -swordWidth/2, 10, swordWidth);
                    
                    ctx.restore();
                }
            };
            console.log(`Created sword with arc attack: range ${item.range}, arc angle ${item.arcAngle} radians`);
            break;
            
        case 'Spinning Axe':
            console.log(`Creating SpinningWeapon with rotationSpeed: ${item.rotationSpeed}, startAngle: ${startAngle}`);
            weapon = new SpinningWeapon(
                player,
                damage,
                item.range,
                item.sprite,
                item.rotationSpeed, // Pass the rotation speed from the item
                attackSpeed,
                startAngle // Pass the start angle
            );
            console.log(`Created spinning weapon: ${item.name} with rotation speed: ${item.rotationSpeed}`);
            break;
            
        case 'Laser Gun':
            weapon = new LaserBeam(
                player,
                damage,
                item.range,
                item.sprite,
                attackSpeed
            );
            console.log(`Created laser beam: ${item.name}`);
            break;
            
        default:
            // Standard weapon (bow, wand, etc.)
            weapon = {
                owner: player,
                damage: damage,
                range: item.range,
                sprite: item.sprite,
                baseAttackSpeed: attackSpeed,
                attackSpeed: attackSpeed,
                projectileSpeed: item.projectileSpeed || 5,
                projectileSprite: item.projectileSprite,
                knockback: item.knockback || 0,
                width: 24,
                height: 24,
                angle: 0,
                lastAttackTime: Date.now(),
                active: true,
                name: item.name,
                
                // Update attack speed based on multiplier
                updateAttackSpeed(attackSpeedMultiplier) {
                    const oldAttackSpeed = this.attackSpeed;
                    this.attackSpeed = this.baseAttackSpeed * attackSpeedMultiplier;
                    console.log(`Updated ${this.name} attack speed: ${oldAttackSpeed.toFixed(2)} -> ${this.attackSpeed.toFixed(2)}`);
                    
                    // For wand and auto bow, also increase projectile speed based on count
                    if (this.name === 'Magic Wand' || this.name === 'Auto Bow') {
                        // Find the item in player's inventory to get the count
                        const item = this.owner.items.find(i => i.name === this.name);
                        if (item && item.count) {
                            // Increase projectile speed by 10% per level (after the first)
                            const baseSpeed = this.name === 'Magic Wand' ? 4 : 5; // Base speeds from items.js
                            const speedMultiplier = 1 + ((item.count - 1) * 0.1);
                            this.projectileSpeed = baseSpeed * speedMultiplier;
                            console.log(`Updated ${this.name} projectile speed: ${baseSpeed} -> ${this.projectileSpeed.toFixed(2)} (level ${item.count})`);
                        }
                    }
                },
                
                // This method is called by the game loop
                update(deltaTime, entities) {
                    // No direct updates needed for standard weapons
                },
                
                // This method is called by the game loop to create projectiles
                attack() {
                    const now = Date.now();
                    if (now - this.lastAttackTime < 1000 / this.attackSpeed) return null;
                    
                    // Find closest entity
                    const activeEntities = [...enemies, ...bosses].filter(e => e.active);
                    if (activeEntities.length === 0) return null;
                    
                    const closest = findClosestEntity(this.owner.x, this.owner.y, activeEntities);
                    if (!closest || closest.distance > this.range) return null;
                    
                    // Create projectile
                    const angle = getAngle(this.owner.x, this.owner.y, closest.entity.x, closest.entity.y);
                    console.log(`Creating projectile with damage: ${this.damage}, angle: ${angle}`);
                    const projectile = new Projectile(
                        this.owner.x,
                        this.owner.y,
                        angle,
                        this.projectileSpeed,
                        this.range,
                        this.damage,
                        this.projectileSprite,
                        this.owner,
                        this.knockback
                    );
                    
                    this.lastAttackTime = now;
                    return projectile;
                },
                
                draw(ctx) {
                    // Weapons are drawn on the player or as projectiles
                }
            };
            console.log(`Created standard weapon: ${item.name}`);
    }
    
    return weapon;
} 