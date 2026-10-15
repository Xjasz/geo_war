// Boss system for the game

// Boss types
const BOSS_TYPES = {
    NECROMANCER: 'necromancer',
    DEATH_KNIGHT: 'deathKnight',
    VAMPIRE_LORD: 'vampireLord',
    LICH: 'lich',
    DEMON: 'demon',
    ASSASSIN_LORD: 'assassinLord'
};

// Boss definitions
const BOSSES = {
    [BOSS_TYPES.NECROMANCER]: {
        name: 'Necromancer',
        health: 1500,
        damage: 20,
        moveSpeed: 1.2,
        experienceValue: 200,
        sprite: 'necromancer',
        size: 1.5,
        abilities: ['summonMinions', 'deathBolt'],
        summonCooldown: 5000, // ms
        attackCooldown: 2000, // ms
        description: 'Summons undead minions and fires death bolts'
    },
    [BOSS_TYPES.DEATH_KNIGHT]: {
        name: 'Death Knight',
        health: 125,
        damage: 20,
        moveSpeed: 1.4,
        experienceValue: 250,
        sprite: 'deathKnight',
        size: 1.6,
        abilities: ['whirlwind', 'charge'],
        whirlwindCooldown: 8000, // ms
        chargeCooldown: 5000, // ms
        description: 'Performs devastating whirlwind attacks and charges at the player'
    },
    [BOSS_TYPES.VAMPIRE_LORD]: {
        name: 'Vampire Lord',
        health: 220,
        damage: 25,
        moveSpeed: 1.7,
        experienceValue: 300,
        sprite: 'vampireLord',
        size: 1.4,
        abilities: ['batForm', 'bloodDrain'],
        batFormCooldown: 10000, // ms
        bloodDrainCooldown: 6000, // ms
        description: 'Transforms into bats and drains health from the player'
    },
    [BOSS_TYPES.LICH]: {
        name: 'Lich',
        health: 900,
        damage: 35,
        moveSpeed: 1.3,
        experienceValue: 350,
        sprite: 'lich',
        size: 1.5,
        abilities: ['frostNova', 'summonSkeletons'],
        frostNovaCooldown: 7000, // ms
        summonCooldown: 9000, // ms
        description: 'Casts powerful frost spells and summons skeleton warriors'
    },
    [BOSS_TYPES.DEMON]: {
        name: 'Demon',
        health: 2000,
        damage: 40,
        moveSpeed: 1.5,
        experienceValue: 400,
        sprite: 'demon',
        size: 1.8,
        abilities: ['fireBreath', 'groundSmash'],
        fireBreathCooldown: 6000, // ms
        groundSmashCooldown: 8000, // ms
        description: 'Breathes fire and smashes the ground, creating shockwaves'
    },
    [BOSS_TYPES.ASSASSIN_LORD]: {
        name: 'Assassin Lord',
        health: 1800,
        damage: 35,
        moveSpeed: 1.8,
        experienceValue: 375,
        sprite: 'assassinlord',
        size: 2.0,
        abilities: ['stealth', 'shadowClone', 'blink'],
        stealthCooldown: 10000, // ms
        cloneSpawnCooldown: 15000, // ms
        blinkCooldown: 5000, // ms
        description: 'Master of stealth who creates shadow clones and teleports around'
    }
};

// Boss ID counter
let bossIdCounter = 1;

// Boss progression - when each boss can appear
const BOSS_PROGRESSION = {
    [BOSS_TYPES.NECROMANCER]: 10 * 60 / 3, // ~3.33 minutes (previously 10 minutes)
    [BOSS_TYPES.DEATH_KNIGHT]: 10 * 60 / 3, // ~3.33 minutes (previously 10 minutes)
    [BOSS_TYPES.VAMPIRE_LORD]: 10 * 60 / 3, // ~3.33 minutes (previously 10 minutes)
    [BOSS_TYPES.LICH]: 10 * 60 / 3, // ~3.33 minutes (previously 10 minutes)
    [BOSS_TYPES.DEMON]: 10 * 60 / 3, // ~3.33 minutes (previously 10 minutes)
    [BOSS_TYPES.ASSASSIN_LORD]: 10 * 60 / 3 // ~3.33 minutes (previously 10 minutes)
};

// Create a boss
function createBoss(type, x, y, level = 1) {
    const bossDef = BOSSES[type];
    if (!bossDef) {
        console.error(`Unknown boss type: ${type}`);
        return null;
    }
    
    // Scale stats based on level
    const levelMultiplier = 1 + (level - 1) * 0.2;
    
    // Additional scaling based on game time (minutes)
    const timeMultiplier = 1 + (gameTime / 60) * 0.5; // 50% increase per minute
    
    // Get size multiplier from boss definition or default to 1.5, then double it (2x larger)
    const baseSizeMultiplier = bossDef.size || 1.5;
    const sizeMultiplier = baseSizeMultiplier * 2; // Make bosses 2x larger
    
    const boss = {
        id: bossIdCounter++,
        type,
        name: bossDef.name,
        x,
        y,
        width: SPRITE_SIZE * sizeMultiplier,
        height: SPRITE_SIZE * sizeMultiplier,
        // Multiply health by 5x as requested
        health: bossDef.health * levelMultiplier * timeMultiplier * 5,
        maxHealth: bossDef.health * levelMultiplier * timeMultiplier * 5,
        damage: bossDef.damage * levelMultiplier * (1 + (gameTime / 60) * 0.3), // 30% increase per minute
        moveSpeed: bossDef.moveSpeed * (1 + (gameTime / 60) * 0.2), // 20% increase per minute
        experienceValue: Math.floor(bossDef.experienceValue * levelMultiplier * timeMultiplier * 1.5), // 1.5x more XP to compensate for higher health
        sprite: bossDef.sprite,
        level,
        active: true,
        isBoss: true,
        isPlayer: false,
        stunned: false,
        stunnedTime: 0,
        flashTime: 0,
        abilities: bossDef.abilities || [],
        lastAbilityTime: { initialized: false },
        phasing: bossDef.phasing || false,
        
        update(deltaTime, player, enemies) {
            if (!this.active) return;
            
            // Skip update if stunned
            if (this.stunned) {
                this.stunnedTime -= deltaTime;
                if (this.stunnedTime <= 0) {
                    this.stunned = false;
                }
                return;
            }
            
            // Move towards player (slower than regular enemies)
            const angle = getAngle(this.x, this.y, player.x, player.y);
            this.x += Math.cos(angle) * this.moveSpeed * 0.7;
            this.y += Math.sin(angle) * this.moveSpeed * 0.7;
            
            // Check collision with player
            const dist = distance(this.x, this.y, player.x, player.y);
            const collisionDist = (this.width + player.width) / 2 * 0.7;
            
            if (dist < collisionDist) {
                // Deal damage to player
                player.takeDamage(this.damage);
                
                // Knockback player
                player.x += Math.cos(angle) * 30;
                player.y += Math.sin(angle) * 30;
                
                // Stun boss briefly
                this.stunned = true;
                this.stunnedTime = 300; // 0.3 seconds
            }
            
            // Use abilities based on boss type
            this.useAbilities(player, enemies, deltaTime);
        },
        
        useAbilities(player, enemies, deltaTime) {
            const now = Date.now();
            
            // Initialize ability timers if not set
            if (!this.lastAbilityTime.initialized) {
                this.abilities.forEach(ability => {
                    this.lastAbilityTime[ability] = now;
                });
                this.lastAbilityTime.initialized = true;
                return;
            }
            
            // Use abilities based on boss type
            switch (this.type) {
                case BOSS_TYPES.NECROMANCER:
                    // Summon minions
                    if (this.abilities.includes('summonMinions') && 
                        now - this.lastAbilityTime.summonMinions > BOSSES[BOSS_TYPES.NECROMANCER].summonCooldown) {
                        this.summonMinions(enemies);
                        this.lastAbilityTime.summonMinions = now;
                    }
                    
                    // Death bolt
                    if (this.abilities.includes('deathBolt') && 
                        now - this.lastAbilityTime.deathBolt > BOSSES[BOSS_TYPES.NECROMANCER].attackCooldown) {
                        this.fireDeathBolt(player);
                        this.lastAbilityTime.deathBolt = now;
                    }
                    break;
                    
                case BOSS_TYPES.DEATH_KNIGHT:
                    // Whirlwind
                    if (this.abilities.includes('whirlwind') && 
                        now - this.lastAbilityTime.whirlwind > BOSSES[BOSS_TYPES.DEATH_KNIGHT].whirlwindCooldown) {
                        this.performWhirlwind(player);
                        this.lastAbilityTime.whirlwind = now;
                    }
                    
                    // Charge
                    if (this.abilities.includes('charge') && 
                        now - this.lastAbilityTime.charge > BOSSES[BOSS_TYPES.DEATH_KNIGHT].chargeCooldown) {
                        this.chargeAtPlayer(player);
                        this.lastAbilityTime.charge = now;
                    }
                    break;
                    
                case BOSS_TYPES.VAMPIRE_LORD:
                    // Bat form
                    if (this.abilities.includes('batForm') && 
                        now - this.lastAbilityTime.batForm > BOSSES[BOSS_TYPES.VAMPIRE_LORD].batFormCooldown) {
                        this.transformToBats(enemies);
                        this.lastAbilityTime.batForm = now;
                    }
                    
                    // Blood drain
                    if (this.abilities.includes('bloodDrain') && 
                        now - this.lastAbilityTime.bloodDrain > BOSSES[BOSS_TYPES.VAMPIRE_LORD].bloodDrainCooldown) {
                        this.drainBlood(player);
                        this.lastAbilityTime.bloodDrain = now;
                    }
                    break;
                    
                case BOSS_TYPES.LICH:
                    // Frost nova
                    if (this.abilities.includes('frostNova') && 
                        now - this.lastAbilityTime.frostNova > BOSSES[BOSS_TYPES.LICH].frostNovaCooldown) {
                        this.castFrostNova(player);
                        this.lastAbilityTime.frostNova = now;
                    }
                    
                    // Summon skeletons
                    if (this.abilities.includes('summonSkeletons') && 
                        now - this.lastAbilityTime.summonSkeletons > BOSSES[BOSS_TYPES.LICH].summonCooldown) {
                        this.summonSkeletons(enemies);
                        this.lastAbilityTime.summonSkeletons = now;
                    }
                    break;
                    
                case BOSS_TYPES.DEMON:
                    // Fire breath
                    if (this.abilities.includes('fireBreath') && 
                        now - this.lastAbilityTime.fireBreath > BOSSES[BOSS_TYPES.DEMON].fireBreathCooldown) {
                        this.breatheFire(player);
                        this.lastAbilityTime.fireBreath = now;
                    }
                    
                    // Ground smash
                    if (this.abilities.includes('groundSmash') && 
                        now - this.lastAbilityTime.groundSmash > BOSSES[BOSS_TYPES.DEMON].groundSmashCooldown) {
                        this.smashGround(player);
                        this.lastAbilityTime.groundSmash = now;
                    }
                    break;
            }
        },
        
        // Necromancer abilities
        summonMinions(enemies) {
            console.log(`${this.name} summons undead minions!`);
            
            // Always summon 5 zombies
            const minionCount = 5;
            
            console.log(`Summoning ${minionCount} zombies`);
            
            // Visual effect
            try {
                if (typeof addAnimatedEffect === 'function') {
                    addAnimatedEffect('explosion', this.x, this.y, 500);
                }
            } catch (e) {
                console.error('Error creating summon effect:', e);
            }
            
            // Find the highest level enemy currently in the game
            let highestLevel = 1;
            if (enemies && enemies.length > 0) {
                highestLevel = enemies.reduce((max, enemy) => Math.max(max, enemy.level || 1), 1);
            }
            
            // Double the highest level for the zombies
            const zombieLevel = highestLevel * 2;
            console.log(`Summoning zombies at level ${zombieLevel} (double the highest enemy level ${highestLevel})`);
            
            // Spawn zombies in a pentagram pattern
            for (let i = 0; i < minionCount; i++) {
                const angle = (Math.PI * 2 / minionCount) * i;
                const distance = 100;
                const x = this.x + Math.cos(angle) * distance;
                const y = this.y + Math.sin(angle) * distance;
                
                // Create zombie with double level
                const minion = createEnemy(ENEMY_TYPES.ZOMBIE, x, y, zombieLevel);
                
                if (minion) {
                    // Make minions stronger
                    minion.damage *= 2;
                    minion.health *= 2;
                    
                    // Visual indicator that these are necromancer's minions
                    minion.color = '#00ff00'; // Bright green
                    
                    // Add puddle creation ability
                    minion.lastPuddleTime = Date.now();
                    minion.puddleInterval = 1000; // Create puddle every second
                    
                    // Store original update method
                    const originalUpdate = minion.update;
                    
                    // Override update method to add puddle creation
                    minion.update = function(deltaTime, player) {
                        // Call original update
                        originalUpdate.call(this, deltaTime, player);
                        
                        // Create toxic puddles as the zombie moves
                        const now = Date.now();
                        if (now - this.lastPuddleTime > this.puddleInterval) {
                            // Create a toxic puddle at the zombie's position
                            if (typeof window.addToxicPuddle === 'function') {
                                window.addToxicPuddle(this.x, this.y, this.damage * 0.5, 5000);
                            }
                            this.lastPuddleTime = now;
                        }
                        
                        // Check for player collision
                        const playerDist = window.distance(this.x, this.y, player.x, player.y);
                        if (playerDist < 30) {
                            // Heal the necromancer if it's still active
                            if (this.active) {
                                const healAmount = this.damage * 0.3;
                                const necromancer = bosses.find(b => b.type === BOSS_TYPES.NECROMANCER && b.active);
                                if (necromancer) {
                                    necromancer.health = Math.min(necromancer.health + healAmount, necromancer.maxHealth);
                                }
                            }
                        }
                    };
                    
                    // Add to enemies array
                    enemies.push(minion);
                }
            }
        },
        
        fireDeathBolt(player) {
            console.log(`${this.name} fires a death bolt!`);
            
            // Create multiple death bolts in a spread pattern
            const boltCount = 5;
            const spreadAngle = Math.PI / 4; // 45-degree spread
            
            // Calculate base angle towards player
            const baseAngle = getAngle(this.x, this.y, player.x, player.y);
            
            for (let i = 0; i < boltCount; i++) {
                // Calculate angle for this bolt
                const angleOffset = spreadAngle * (i / (boltCount - 1) - 0.5);
                const angle = baseAngle + angleOffset;
                
                // Create projectile
                const bolt = new Projectile(
                    this.x,
                    this.y,
                    angle,
                    5, // Speed
                    500, // Range
                    this.damage * 0.7, // Damage
                    'fireball', // Sprite
                    this,
                    10 // Knockback
                );
                
                // Add life-stealing effect
                bolt.onHit = (target) => {
                    if (this.active) {
                        const healAmount = bolt.damage * 0.5;
                        this.health = Math.min(this.health + healAmount, this.maxHealth);
                    }
                };
                
                // Add to projectiles array
                projectiles.push(bolt);
            }
            
            // Visual effect
            try {
                if (typeof addAnimatedEffect === 'function') {
                    addAnimatedEffect('explosion', this.x, this.y, 300);
                }
            } catch (e) {
                console.error('Error creating death bolt effect:', e);
            }
        },
        
        // Death Knight abilities
        performWhirlwind(player) {
            console.log(`${this.name} performs a whirlwind attack!`);
            
            // Visual effect
            try {
                if (typeof addAnimatedEffect === 'function') {
                    // Create initial whirlwind effect
                    addAnimatedEffect('explosion', this.x, this.y, 500);
                    
                    // Create echoing whirlwind effects that expand outward
                    for (let i = 1; i <= 3; i++) {
                        setTimeout(() => {
                            if (this.active) {
                                // Calculate the range for this echo
                                const echoRange = 100 + i * 50; // 150, 200, 250 range
                                
                                // Create a ring effect by spawning multiple explosion effects in a circle
                                const numPoints = 8;
                                for (let j = 0; j < numPoints; j++) {
                                    const angle = (j / numPoints) * Math.PI * 2;
                                    const echoX = this.x + Math.cos(angle) * echoRange;
                                    const echoY = this.y + Math.sin(angle) * echoRange;
                                    
                                    // Create the echo effect at the calculated position
                                    const echoEffect = addAnimatedEffect('explosion', echoX, echoY, 500);
                                    if (echoEffect) {
                                        // Make each echo larger
                                        echoEffect.scale = 1 + i * 0.5; // 1.5x, 2x, 2.5x size
                                    }
                                }
                                
                                // Check for player collision with this echo ring
                                const playerDist = distance(this.x, this.y, player.x, player.y);
                                if (playerDist < echoRange + 50 && playerDist > echoRange - 50) {
                                    // Damage decreases with each echo
                                    const echoDamage = this.damage * (1.5 - i * 0.3); // 1.5x, 1.2x, 0.9x damage
                                    player.takeDamage(echoDamage);
                                    
                                    // Knockback player
                                    const angle = getAngle(this.x, this.y, player.x, player.y);
                                    const knockbackPower = 50 - i * 10; // 40, 30, 20 knockback
                                    player.x += Math.cos(angle) * knockbackPower;
                                    player.y += Math.sin(angle) * knockbackPower;
                                }
                            }
                        }, i * 300); // Delay each echo by 300ms
                    }
                }
            } catch (e) {
                console.error('Error creating whirlwind effect:', e);
            }
            
            // Deal damage if player is in range (initial hit)
            const dist = distance(this.x, this.y, player.x, player.y);
            if (dist < 100) {
                player.takeDamage(this.damage * 1.5);
                
                // Knockback player
                const angle = getAngle(this.x, this.y, player.x, player.y);
                player.x += Math.cos(angle) * 50;
                player.y += Math.sin(angle) * 50;
            }
        },
        
        chargeAtPlayer(player) {
            console.log(`${this.name} charges at the player!`);
            
            // Store target position
            this.chargeTarget = {
                x: player.x,
                y: player.y
            };
            
            // Increase speed temporarily
            this.moveSpeed *= 3;
            
            // Reset speed after 1 second
            setTimeout(() => {
                if (this.active) {
                    this.moveSpeed = BOSSES[BOSS_TYPES.DEATH_KNIGHT].moveSpeed;
                }
            }, 1000);
            
            // Visual effect
            try {
                if (typeof addAnimatedEffect === 'function') {
                    addAnimatedEffect('explosion', this.x, this.y, 300);
                }
            } catch (e) {
                console.error('Error creating charge effect:', e);
            }
        },
        
        // Vampire Lord abilities
        transformToBats(enemies) {
            console.log(`${this.name} transforms into a swarm of bats!`);
            
            // Calculate number of bats based on enemies on screen
            const baseCount = 3; // Base number of bats
            const enemyCount = enemies.filter(e => e.active).length;
            const batCount = baseCount + Math.min(5, Math.floor(enemyCount / 5)); // Add 1 bat per 5 enemies, up to 5 extra
            
            console.log(`Spawning ${batCount} bats (${enemyCount} enemies on screen)`);
            
            // Visual effect
            try {
                if (typeof addAnimatedEffect === 'function') {
                    addAnimatedEffect('explosion', this.x, this.y, 500);
                }
            } catch (e) {
                console.error('Error creating bat transformation effect:', e);
            }
            
            // Get current game time from the global scope
            const currentGameTime = window.gameTime || 0;
            
            // Spawn bats
            for (let i = 0; i < batCount; i++) {
                const angle = (Math.PI * 2 / batCount) * i;
                const distanceFromBoss = 50 + Math.random() * 50;
                const x = this.x + Math.cos(angle) * distanceFromBoss;
                const y = this.y + Math.sin(angle) * distanceFromBoss;
                
                // Create a bat enemy
                const bat = createEnemy(ENEMY_TYPES.BAT, x, y, Math.max(1, Math.floor(currentGameTime / 60)));
                if (bat) {
                    // Make bats faster and stronger based on game time
                    const timeBonus = 1 + (currentGameTime / 60) * 0.3; // 30% increase per minute
                    bat.moveSpeed *= timeBonus;
                    bat.damage *= timeBonus;
                    
                    // Store reference to the vampire lord
                    const vampireLord = this;
                    
                    // Add vampire lord's influence - bats heal the boss when they hit the player
                    const originalUpdate = bat.update;
                    bat.update = function(deltaTime, player) {
                        originalUpdate.call(this, deltaTime, player);
                        
                        // Check if bat is hitting player
                        // Use the global distance function explicitly
                        const dist = window.distance(this.x, this.y, player.x, player.y);
                        const collisionDist = (this.width + player.width) / 2 * 0.8;
                        
                        if (dist < collisionDist && this.active) {
                            // Heal the vampire lord if it's still active
                            if (vampireLord && vampireLord.active) {
                                const healAmount = this.damage * 0.5;
                                vampireLord.health = Math.min(vampireLord.health + healAmount, vampireLord.maxHealth);
                            }
                        }
                    };
                    
                    enemies.push(bat);
                }
            }
            
            // Make boss temporarily invulnerable
            this.invulnerable = true;
            setTimeout(() => {
                if (this.active) {
                    this.invulnerable = false;
                }
            }, 3000);
        },
        
        drainBlood(player) {
            console.log(`${this.name} drains blood from the player!`);
            
            // Visual effect
            try {
                if (typeof addAnimatedEffect === 'function') {
                    const angle = getAngle(player.x, player.y, this.x, this.y);
                    for (let i = 0; i < 5; i++) {
                        const distance = i * 40;
                        const x = player.x + Math.cos(angle) * distance;
                        const y = player.y + Math.sin(angle) * distance;
                        addAnimatedEffect('sparkle', x, y, 500);
                    }
                }
            } catch (e) {
                console.error('Error creating blood drain effect:', e);
            }
            
            // Deal damage and heal boss if player is in range
            const dist = distance(this.x, this.y, player.x, player.y);
            if (dist < 150) {
                player.takeDamage(this.damage * 0.8);
                this.health = Math.min(this.health + this.damage, this.maxHealth);
            }
        },
        
        // Lich abilities
        castFrostNova(player) {
            console.log(`${this.name} casts ground circles of doom!`);
            
            // Create 4 circles on the ground that will explode
            const circleCount = 4;
            const positions = [];
            
            // Calculate positions for the circles
            // One near the player, others at random positions
            positions.push({
                x: player.x + (Math.random() * 100 - 50),
                y: player.y + (Math.random() * 100 - 50)
            });
            
            // Add 3 more random positions
            for (let i = 1; i < circleCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = 100 + Math.random() * 300;
                positions.push({
                    x: player.x + Math.cos(angle) * distance,
                    y: player.y + Math.sin(angle) * distance
                });
            }
            
            // Create the circles
            for (let i = 0; i < positions.length; i++) {
                const pos = positions[i];
                
                // Create initial circle effect
                const initialEffect = addAnimatedEffect('explosion', pos.x, pos.y, 5000);
                if (initialEffect) {
                    initialEffect.scale = 3.0;
                    initialEffect.type = 'explosion';
                    initialEffect.tint = '#ffff00'; // Start with yellow
                    
                    // Store the position for the explosion
                    initialEffect.circleX = pos.x;
                    initialEffect.circleY = pos.y;
                    
                    // Change color over time
                    setTimeout(() => {
                        if (initialEffect.isActive) initialEffect.tint = '#ffa500'; // Orange
                    }, 1500);
                    
                    setTimeout(() => {
                        if (initialEffect.isActive) initialEffect.tint = '#ff5500'; // Orange-red
                    }, 3000);
                    
                    setTimeout(() => {
                        if (initialEffect.isActive) initialEffect.tint = '#ff0000'; // Red
                    }, 4500);
                    
                    // Explode after 5 seconds
                    setTimeout(() => {
                        if (!this.active) return;
                        
                        // Create explosion effect
                        const explosion = addAnimatedEffect('explosion', pos.x, pos.y, 1000);
                        if (explosion) {
                            explosion.scale = 4.0;
                        }
                        
                        // Shoot fireballs in all directions
                        const fireballCount = 8;
                        for (let j = 0; j < fireballCount; j++) {
                            const angle = (Math.PI * 2 / fireballCount) * j;
                            const distance = 100;
                            const x = pos.x + Math.cos(angle) * distance;
                            const y = pos.y + Math.sin(angle) * distance;
                            
                            // Create fireball effect
                            const fireball = addAnimatedEffect('fireball', x, y, 800);
                            if (fireball) {
                                fireball.scale = 1.5;
                                fireball.angle = angle;
                                fireball.speed = 3;
                                fireball.damage = this.damage * 0.5;
                                
                                // Make the fireball move
                                const originalUpdate = fireball.update;
                                fireball.update = function() {
                                    // Move in the direction of angle
                                    this.x += Math.cos(this.angle) * this.speed;
                                    this.y += Math.sin(this.angle) * this.speed;
                                    
                                    // Check for player collision
                                    const playerDist = window.distance(this.x, this.y, player.x, player.y);
                                    if (playerDist < 30) {
                                        player.takeDamage(this.damage);
                                        this.isActive = false;
                                    }
                                    
                                    return originalUpdate.call(this);
                                };
                            }
                        }
                        
                        // Check for player in explosion range
                        const playerDist = distance(pos.x, pos.y, player.x, player.y);
                        if (playerDist < 100) {
                            // Damage player
                            player.takeDamage(this.damage);
                        }
                    }, 5000);
                }
            }
        },
        
        summonSkeletons(enemies) {
            console.log(`${this.name} summons skeleton warriors!`);
            
            // Calculate number of skeletons based on enemies on screen
            const baseSkeletonCount = 3;
            const enemyCount = enemies.length;
            const additionalSkeletons = Math.floor(enemyCount / 5); // 1 extra skeleton per 5 enemies
            const skeletonCount = Math.min(baseSkeletonCount + additionalSkeletons, 9); // Cap at 9 skeletons
            
            console.log(`Summoning ${skeletonCount} skeletons (base: ${baseSkeletonCount}, additional: ${additionalSkeletons} from ${enemyCount} enemies)`);
            
            // Create a circle of ice pillars that turn into skeletons
            const radius = 150;
            
            // First, create ice pillar effects
            for (let i = 0; i < skeletonCount; i++) {
                const angle = (Math.PI * 2 / skeletonCount) * i;
                const x = this.x + Math.cos(angle) * radius;
                const y = this.y + Math.sin(angle) * radius;
                
                // Create ice pillar effect
                const effect = addAnimatedEffect('explosion', x, y, 1000);
                if (effect) {
                    effect.scale = 2.0;
                    effect.type = 'fireball';
                    effect.tint = '#00ffff';
                }
                
                // Spawn skeleton after effect
                setTimeout(() => {
                    if (!this.active) return;
                    
                    const skeleton = createEnemy(ENEMY_TYPES.SKELETON, x, y, Math.max(1, Math.floor(window.gameTime / 60)));
                    if (skeleton) {
                        // Enhanced skeleton
                        skeleton.health *= 2;
                        skeleton.damage *= 1.5;
                        skeleton.moveSpeed *= 1.2;
                        skeleton.color = '#00ffff';
                        
                        // Ice armor - reduces damage taken
                        const originalTakeDamage = skeleton.takeDamage;
                        skeleton.takeDamage = function(amount) {
                            // Reduce damage by 30%
                            originalTakeDamage.call(this, amount * 0.7);
                            
                            // Create ice particle effect when hit
                            addAnimatedEffect('explosion', this.x, this.y, 300);
                        };
                        enemies.push(skeleton);
                    }
                }, 1000);
            }
        },
        
        // Demon abilities
        breatheFire(player) {
            console.log(`${this.name} breathes fire!`);
            
            // Calculate angle to player
            const angle = getAngle(this.x, this.y, player.x, player.y);
            
            // Store original movement speed and temporarily stop movement
            const originalMoveSpeed = this.moveSpeed;
            this.moveSpeed = 0;
            
            // Visual indicator that demon is preparing to breathe fire
            this.color = '#ff6600';
            
            // Create a sweeping cone of fire
            const totalDuration = 3000; // 3 seconds of fire breathing
            const startAngle = angle - Math.PI / 3; // Start 60 degrees to the left
            const endAngle = angle + Math.PI / 3; // End 60 degrees to the right
            const fireballsPerSecond = 30;
            const totalFireballs = (totalDuration / 1000) * fireballsPerSecond;
            
            // Start the fire breath
            let fireballCount = 0;
            const breathInterval = setInterval(() => {
                if (!this.active) {
                    clearInterval(breathInterval);
                    return;
                }
                
                // Calculate current angle based on progress
                const progress = fireballCount / totalFireballs;
                const currentAngle = startAngle + (endAngle - startAngle) * (0.5 - 0.5 * Math.cos(progress * Math.PI * 2));
                
                // Create multiple fireballs in a cone
                const fireballsPerBurst = 3;
                const boss = this;
                for (let i = 0; i < fireballsPerBurst; i++) {
                    // Vary the angle slightly for each fireball in the burst
                    const angleVariation = (Math.random() - 0.5) * Math.PI / 12; // ±15 degrees
                    const fireballAngle = currentAngle + angleVariation;
                    
                    // Calculate distance based on index
                    const distance = 50 + i * 30 + Math.random() * 20;
                    
                    // Calculate position
                    const x = this.x + Math.cos(fireballAngle) * distance;
                    const y = this.y + Math.sin(fireballAngle) * distance;
                    
                    // Create fire effect
                    const effect = addAnimatedEffect('explosion', x, y, 800);
                    if (effect) {
                        effect.scale = 1.2 + Math.random() * 0.5;
                        effect.type = 'fireball';
                        effect.tint = '#ff' + Math.floor(Math.random() * 3 + 3).toString(16) + '00'; // Vary the red/orange color
                        
                        // Make the fireball move
                        const originalUpdate = effect.update;
                        effect.update = function() {
                            // Move in the direction of angle
                            this.x += Math.cos(fireballAngle) * 3;
                            this.y += Math.sin(fireballAngle) * 3;
                            
                            // Check for player collision
                            const playerDist = window.distance(this.x, this.y, player.x, player.y);
                            if (playerDist < 40) {
                                // Damage player
                                player.takeDamage(boss.damage * 0.2);
                                
                                // Apply burning effect - damage over time
                                if (!player.burningEffect) {
                                    player.burningEffect = {
                                        damage: boss.damage * 0.05,
                                        duration: 3000,
                                        interval: 500,
                                        lastDamageTime: Date.now(),
                                        startTime: Date.now()
                                    };
                                } else {
                                    // Refresh duration
                                    player.burningEffect.duration = 3000;
                                    player.burningEffect.startTime = Date.now();
                                }
                                
                                // Visual indicator
                                player.color = '#ff6600';
                                
                                this.isActive = false;
                            }
                            
                            return originalUpdate.call(this);
                        };
                    }
                }
                
                fireballCount++;
                
                // End the breath after the duration
                if (fireballCount >= totalFireballs) {
                    clearInterval(breathInterval);
                    
                    // Restore movement speed after a short delay
                    setTimeout(() => {
                        if (this.active) {
                            this.moveSpeed = originalMoveSpeed;
                            this.color = null;
                        }
                    }, 500);
                }
            }, totalDuration / totalFireballs);
        },
        
        smashGround(player) {
            console.log(`${this.name} smashes the ground!`);
            
            // Create expanding shockwave rings
            const ringCount = 3;
            
            // First, create a charging effect
            const chargeEffect = addAnimatedEffect('explosion', this.x, this.y, 1000);
            if (chargeEffect) {
                chargeEffect.scale = 2.0;
            }
            
            // Then, after a delay, create the shockwaves
            setTimeout(() => {
                if (!this.active) return;
                
                // Create a large impact effect
                const impactEffect = addAnimatedEffect('explosion', this.x, this.y, 500);
                if (impactEffect) {
                    impactEffect.scale = 3.0;
                }
                
                // Create expanding rings
                for (let i = 0; i < ringCount; i++) {
                    setTimeout(() => {
                        if (!this.active) return;
                        
                        const radius = 100 + (i * 150);
                        const pointCount = 16 + (i * 8);
                        
                        // Create shockwave particles in a circle
                        for (let j = 0; j < pointCount; j++) {
                            const angle = (Math.PI * 2 / pointCount) * j;
                            const x = this.x + Math.cos(angle) * radius;
                            const y = this.y + Math.sin(angle) * radius;
                            
                            // Create effect
                            const effect = addAnimatedEffect('explosion', x, y, 500);
                            if (effect) {
                                effect.scale = 1.5;
                            }
                            
                            // Create falling debris
                            if (j % 4 === 0) {
                                // Create a projectile that looks like falling rock
                                const debris = new Projectile(
                                    x,
                                    y,
                                    Math.random() * Math.PI * 2, // Random angle
                                    2 + Math.random() * 2, // Random speed
                                    200, // Range
                                    this.damage * 0.3, // Damage
                                    'explosion', // Sprite
                                    this,
                                    5 // Knockback
                                );
                                
                                // Add to projectiles array
                                projectiles.push(debris);
                            }
                        }
                        
                        // Check for player in shockwave range
                        const playerDist = distance(this.x, this.y, player.x, player.y);
                        if (playerDist < radius + 50 && playerDist > radius - 50) {
                            // Damage player
                            player.takeDamage(this.damage);
                            
                            // Knockback player
                            const knockbackPower = 100 - (i * 20); // Decreasing knockback with each ring
                            const angle = getAngle(this.x, this.y, player.x, player.y);
                            player.x += Math.cos(angle) * knockbackPower;
                            player.y += Math.sin(angle) * knockbackPower;
                        }
                    }, i * 500); // Delay between rings
                }
            }, 1000); // Delay before impact
        },
        
        draw(ctx) {
            if (!this.active) return;
            
            // Draw boss with flash effect when taking damage
            if (this.flashTime > 0) {
                ctx.globalAlpha = 0.7;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(
                    this.x - this.width / 2,
                    this.y - this.height / 2,
                    this.width,
                    this.height
                );
                ctx.globalAlpha = 1;
                this.flashTime -= 16; // Approximate for 60fps
            }
            
            // Draw glowing aura around boss
            const now = Date.now();
            const pulseRate = Math.sin(now * 0.003) * 0.2 + 0.8; // Pulsing effect
            
            // Choose aura color based on boss type
            let auraColor;
            switch (this.type) {
                case BOSS_TYPES.SKELETON_KING:
                    auraColor = 'rgba(255, 165, 0, 0.3)'; // Orange for Skeleton King
                    break;
                case BOSS_TYPES.NECROMANCER:
                    auraColor = 'rgba(0, 128, 0, 0.3)'; // Green for Necromancer
                    break;
                case BOSS_TYPES.DEMON_LORD:
                    auraColor = 'rgba(255, 0, 0, 0.3)'; // Red for Demon Lord
                    break;
                case BOSS_TYPES.ASSASSIN_LORD:
                    auraColor = 'rgba(102, 0, 102, 0.3)'; // Purple for Assassin Lord
                    break;
                default:
                    auraColor = 'rgba(255, 255, 0, 0.3)'; // Yellow default
                    break;
            }
            
            ctx.globalAlpha = 0.7 * pulseRate;
            ctx.fillStyle = auraColor;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width * 0.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            
            // Draw boss sprite
            drawSprite(
                ctx,
                sprites[this.sprite],
                this.x - this.width / 2,
                this.y - this.height / 2,
                this.width,
                this.height
            );
            
            // Draw boss name and level with outline for better visibility
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            
            // Draw text outline
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.strokeText(`${this.name} (Level ${this.level})`, this.x, this.y - this.height / 2 - 35);
            
            // Draw text
            ctx.fillStyle = '#ffffff';
            ctx.fillText(`${this.name} (Level ${this.level})`, this.x, this.y - this.height / 2 - 35);
            
            // Draw health bar
            const healthPercentage = this.health / this.maxHealth;
            const barWidth = this.width * 1.2;
            const barHeight = 10; // Slightly larger health bar
            
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(
                this.x - barWidth / 2,
                this.y - this.height / 2 - 15,
                barWidth,
                barHeight
            );
            
            // Health bar color based on percentage
            ctx.fillStyle = healthPercentage > 0.5 ? '#33ff33' : healthPercentage > 0.25 ? '#ffff33' : '#ff3333';
            ctx.fillRect(
                this.x - barWidth / 2,
                this.y - this.height / 2 - 15,
                barWidth * healthPercentage,
                barHeight
            );
        },
        
        takeDamage(amount) {
            if (!this.active || this.invulnerable) return;
            
            // Ensure amount is a number
            const damage = Number(amount) || 0;
            if (damage <= 0) {
                console.warn(`Invalid damage amount: ${amount}`);
                return;
            }
            
            // Bosses take reduced damage
            const actualDamage = damage * 0.7;
            
            this.health -= actualDamage;
            console.log(`Health after: ${this.health}`);
            
            // Visual feedback - flash the boss
            this.flashTime = 200; // milliseconds
            
            // Check if dead
            if (this.health <= 0) {
                console.log(`Boss ${this.id} died`);
                this.die();
            }
        },
        
        die() {
            this.active = false;
            
            // Create death effect
            try {
                if (typeof addAnimatedEffect === 'function') {
                    // Create multiple explosion effects
                    for (let i = 0; i < 8; i++) {
                        const offsetX = (Math.random() - 0.5) * this.width;
                        const offsetY = (Math.random() - 0.5) * this.height;
                        addAnimatedEffect('explosion', this.x + offsetX, this.y + offsetY, 1000);
                    }
                }
            } catch (e) {
                console.error('Error creating death effect:', e);
            }
            
            // Drop special item with high probability
            if (Math.random() < 0.8) {
                // Determine which item to drop based on boss type
                let itemType;
                switch (this.type) {
                    case BOSS_TYPES.NECROMANCER:
                        itemType = 'wand';
                        break;
                    case BOSS_TYPES.DEATH_KNIGHT:
                        itemType = 'axe';
                        break;
                    case BOSS_TYPES.VAMPIRE_LORD:
                        itemType = 'amulet';
                        break;
                    case BOSS_TYPES.LICH:
                        itemType = 'crown';
                        break;
                    case BOSS_TYPES.DEMON:
                        itemType = 'laserGun';
                        break;
                    default:
                        itemType = 'shield';
                }
                
                // Create the pickup
                const pickup = createPickup(itemType, this.x, this.y);
                if (pickup && typeof pickups !== 'undefined') {
                    pickups.push(pickup);
                }
            }
            
            // Return experience value for the player
            return this.experienceValue;
        }
    };
    
    return boss;
}

// Spawn a boss based on game time
function spawnBoss(gameTime, gameWidth, gameHeight, player) {
    // Calculate boss level based on player's level + 5
    const bossLevel = player.level + 5;
    
    // Determine which boss to spawn based on the interval count
    // Every 20 seconds we spawn a boss, so divide by 20 to get the "interval index"
    const bossIndex = Math.floor(gameTime / 20) % Object.keys(BOSS_TYPES).length;
    
    // Get the boss type directly from the BOSS_TYPES values array
    const bossTypes = Object.values(BOSS_TYPES);
    const bossType = bossTypes[bossIndex];
    
    console.log(`Spawning boss of type: ${bossType}, based on index: ${bossIndex}, level: ${bossLevel} (gameTime: ${gameTime.toFixed(1)}s)`);
    
    // Determine spawn position (outside screen but not too far)
    const margin = 100;
    const spawnDistance = 200 + Math.random() * 100;
    const angle = Math.random() * Math.PI * 2;
    
    const x = player.x + Math.cos(angle) * spawnDistance;
    const y = player.y + Math.sin(angle) * spawnDistance;
    
    // Ensure boss is within game bounds
    const clampedX = clamp(x, margin, gameWidth - margin);
    const clampedY = clamp(y, margin, gameHeight - margin);
    
    // Create the boss
    const boss = createBoss(bossType, clampedX, clampedY, bossLevel);
    
    // Announce boss spawn
    if (boss) {
        console.log(`Boss spawned: ${boss.name} (Level ${bossLevel})`);
        
        // Create visual effect
        try {
            if (typeof addAnimatedEffect === 'function') {
                for (let i = 0; i < 12; i++) {
                    const effectAngle = i * Math.PI / 6;
                    const effectX = boss.x + Math.cos(effectAngle) * 80;
                    const effectY = boss.y + Math.sin(effectAngle) * 80;
                    addAnimatedEffect('explosion', effectX, effectY, 1000);
                }
            }
        } catch (e) {
            console.error('Error creating boss spawn effect:', e);
        }
    }
    
    return boss;
}

// Create Assassin Lord boss
function createAssassinLordBoss(x, y) {
    const level = Math.max(1, Math.floor(gameTime / 60) + 1);
    
    // Get the boss definition
    const bossDef = BOSSES[BOSS_TYPES.ASSASSIN_LORD];
    
    // Scale stats based on level
    const levelMultiplier = 1 + (level - 1) * 0.2;
    
    // Additional scaling based on game time (minutes)
    const timeMultiplier = 1 + (gameTime / 60) * 0.5; // 50% increase per minute
    
    // Create base boss object
    const boss = {
        type: BOSS_TYPES.ASSASSIN_LORD,
        name: bossDef.name,
        x: x,
        y: y,
        width: SPRITE_SIZE * bossDef.size,
        height: SPRITE_SIZE * bossDef.size,
        health: bossDef.health * levelMultiplier * timeMultiplier,
        maxHealth: bossDef.health * levelMultiplier * timeMultiplier,
        damage: bossDef.damage * levelMultiplier * (1 + (gameTime / 60) * 0.3),
        moveSpeed: bossDef.moveSpeed * (1 + (gameTime / 60) * 0.2),
        experienceValue: Math.floor(bossDef.experienceValue * levelMultiplier * timeMultiplier),
        active: true,
        phasing: true, // Can move through obstacles
        lastAttackTime: 0,
        level: level,
        isPlayer: false,
        
        // Assassin Lord specific properties
        stealthed: true,
        stealthCooldown: bossDef.stealthCooldown || 3000,
        lastStealthTime: 0,
        stealthAlpha: 0.2, // Almost invisible when stealthed
        
        // Shadow clones
        clones: [],
        maxClones: 3,
        cloneHealth: bossDef.health * 0.1, // Clones have 10% of boss health
        cloneSpawnCooldown: bossDef.cloneSpawnCooldown || 15000,
        lastCloneSpawnTime: 0,
        
        // Special abilities
        blinkCooldown: bossDef.blinkCooldown || 5000, // Teleport ability
        lastBlinkTime: 0,
        blinkDistance: 250,
        
        // Phase tracking
        phase: 1, // Start in phase 1
        phaseThresholds: [0.7, 0.4, 0.2], // Phase changes at 70%, 40%, and 20% health
        
        update(deltaTime) {
            if (!this.active) return;
            
            // Calculate health percentage
            const healthPercentage = this.health / this.maxHealth;
            
            // Phase progression based on health
            if (this.phase < 4) { // Max phase is 4
                for (let i = 0; i < this.phaseThresholds.length; i++) {
                    if (this.phase === i + 1 && healthPercentage < this.phaseThresholds[i]) {
                        // Enter next phase
                        this.phase++;
                        console.log(`Assassin Lord entering phase ${this.phase}!`);
                        
                        // Visual effect for phase change
                        addAnimatedEffect('explosion', this.x, this.y, 1000);
                        
                        // Immediately stealth when changing phases
                        this.stealthed = true;
                        this.lastStealthTime = Date.now();
                        
                        // Spawn clones on phase change
                        this.spawnClones();
                        
                        // Bonus healing at phase change
                        const healAmount = this.maxHealth * 0.05; // 5% heal on phase change
                        this.health = Math.min(this.maxHealth, this.health + healAmount);
                        
                        // Movement speed increases in later phases
                        this.moveSpeed += 0.2;
                        
                        // Create temporary ring effect to indicate phase change
                        addAnimatedEffect('explosion', this.x, this.y, 1000);
                    }
                }
            }
            
            // Update clones
            this.updateClones(deltaTime);
            
            // Check if it's time to spawn more clones
            const now = Date.now();
            if (now - this.lastCloneSpawnTime >= this.cloneSpawnCooldown && this.clones.length < this.maxClones) {
                this.spawnClones();
                this.lastCloneSpawnTime = now;
            }
            
            // Blink ability (teleport) - more frequent in later phases
            const blinkCooldownAdjusted = this.blinkCooldown - ((this.phase - 1) * 1000); // Reduce cooldown in later phases
            if (now - this.lastBlinkTime >= blinkCooldownAdjusted && player && player.active) {
                // Calculate distance to player
                const distToPlayer = distance(this.x, this.y, player.x, player.y);
                
                // Only blink if player is far away or we're in a later phase
                if (distToPlayer > 200 || this.phase > 2) {
                    this.blink();
                    this.lastBlinkTime = now;
                }
            }
            
            // Stealth mechanics - toggle stealth on cooldown
            if (now - this.lastStealthTime >= this.stealthCooldown) {
                this.stealthed = !this.stealthed;
                this.lastStealthTime = now;
                
                if (this.stealthed) {
                    console.log('Assassin Lord entering stealth');
                } else {
                    console.log('Assassin Lord revealing self');
                    // Visual effect when leaving stealth
                    addAnimatedEffect('explosion', this.x, this.y, 500);
                }
            }
            
            // Move towards player if not in attack range
            if (player && player.active) {
                const distToPlayer = distance(this.x, this.y, player.x, player.y);
                const attackRange = 60;
                
                if (distToPlayer > attackRange) {
                    // Move towards player - faster when stealthed
                    const angle = Math.atan2(player.y - this.y, player.x - this.x);
                    const speedMultiplier = this.stealthed ? 1.5 : 1.0;
                    
                    this.x += Math.cos(angle) * this.moveSpeed * speedMultiplier * (deltaTime / 16);
                    this.y += Math.sin(angle) * this.moveSpeed * speedMultiplier * (deltaTime / 16);
                } else {
                    // Attack if in range
                    if (now - this.lastAttackTime >= 800) { // Attack every 0.8 seconds
                        this.attack();
                        this.lastAttackTime = now;
                        
                        // Break stealth when attacking
                        if (this.stealthed) {
                            this.stealthed = false;
                            this.lastStealthTime = now;
                            addAnimatedEffect('explosion', this.x, this.y, 300);
                        }
                    }
                }
            }
            
            // Apply boundary restrictions
            const margin = 50;
            this.x = Math.max(margin, Math.min(gameWidth - margin, this.x));
            this.y = Math.max(margin, Math.min(gameHeight - margin, this.y));
        },
        
        // Spawn shadow clones
        spawnClones() {
            // Calculate how many clones to spawn
            const clonesToSpawn = this.maxClones - this.clones.length;
            
            if (clonesToSpawn <= 0) return;
            
            console.log(`Spawning ${clonesToSpawn} shadow clones`);
            
            for (let i = 0; i < clonesToSpawn; i++) {
                // Calculate spawn position around the boss
                const angle = Math.random() * Math.PI * 2;
                const distance = 100 + Math.random() * 100;
                
                const x = this.x + Math.cos(angle) * distance;
                const y = this.y + Math.sin(angle) * distance;
                
                // Ensure clone is within game boundaries
                const margin = 50;
                const cloneX = Math.max(margin, Math.min(gameWidth - margin, x));
                const cloneY = Math.max(margin, Math.min(gameHeight - margin, y));
                
                // Create clone
                const clone = {
                    x: cloneX,
                    y: cloneY,
                    width: this.width * 0.7,
                    height: this.height * 0.7,
                    health: this.cloneHealth,
                    maxHealth: this.cloneHealth,
                    damage: this.damage * 0.5,
                    moveSpeed: this.moveSpeed * 1.2,
                    active: true,
                    stealthed: true,
                    lastAttackTime: 0,
                    
                    update(deltaTime) {
                        if (!this.active) return;
                        
                        // Move towards player
                        if (player && player.active) {
                            const distToPlayer = distance(this.x, this.y, player.x, player.y);
                            const attackRange = 50;
                            
                            if (distToPlayer > attackRange) {
                                // Move towards player
                                const angle = Math.atan2(player.y - this.y, player.x - this.x);
                                this.x += Math.cos(angle) * this.moveSpeed * (deltaTime / 16);
                                this.y += Math.sin(angle) * this.moveSpeed * (deltaTime / 16);
                            } else {
                                // Attack if in range
                                const now = Date.now();
                                if (now - this.lastAttackTime >= 1000) { // Attack once per second
                                    // Deal damage to player
                                    player.takeDamage(this.damage);
                                    this.lastAttackTime = now;
                                    
                                    // Break stealth when attacking
                                    if (this.stealthed) {
                                        this.stealthed = false;
                                        addAnimatedEffect('hit', this.x, this.y, 300);
                                    }
                                }
                            }
                        }
                        
                        // Apply boundary restrictions
                        const margin = 20;
                        this.x = Math.max(margin, Math.min(gameWidth - margin, this.x));
                        this.y = Math.max(margin, Math.min(gameHeight - margin, this.y));
                    },
                    
                    draw(ctx) {
                        if (!this.active) return;
                        
                        // Save context state
                        ctx.save();
                        
                        // Apply stealth transparency effect
                        if (this.stealthed) {
                            ctx.globalAlpha = 0.3;
                        }
                        
                        // Draw clone
                        ctx.fillStyle = '#660066'; // Purple for assassin clones
                        ctx.beginPath();
                        ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // Restore context state
                        ctx.restore();
                        
                        // Draw health bar
                        const healthPercentage = this.health / this.maxHealth;
                        const barWidth = this.width * 0.8;
                        const barHeight = 4;
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
                        this.health -= amount;
                        
                        // Break stealth when taking damage
                        if (this.stealthed) {
                            this.stealthed = false;
                            addAnimatedEffect('hit', this.x, this.y, 300);
                        }
                        
                        if (this.health <= 0) {
                            this.active = false;
                            addAnimatedEffect('explosion', this.x, this.y, 500);
                        }
                    }
                };
                
                // Add clone to array
                this.clones.push(clone);
                
                // Visual effect for clone spawning
                addAnimatedEffect('sparkle', clone.x, clone.y, 500);
            }
            
            // Update last spawn time
            this.lastCloneSpawnTime = Date.now();
        },
        
        // Update all clones
        updateClones(deltaTime) {
            for (let i = this.clones.length - 1; i >= 0; i--) {
                const clone = this.clones[i];
                
                if (!clone.active) {
                    // Remove inactive clones
                    this.clones.splice(i, 1);
                    continue;
                }
                
                // Update clone
                clone.update(deltaTime);
            }
        },
        
        // Blink (teleport) ability
        blink() {
            if (!player || !player.active) return;
            
            console.log('Assassin Lord using blink ability');
            
            // Visual effect at original position
            addAnimatedEffect('sparkle', this.x, this.y, 500);
            
            // Calculate position to teleport to
            let targetX, targetY;
            
            // In earlier phases, blink away from player when low health
            if (this.phase < 3 && this.health / this.maxHealth < 0.3) {
                // Blink away from player
                const angle = Math.atan2(this.y - player.y, this.x - player.x);
                targetX = this.x + Math.cos(angle) * this.blinkDistance;
                targetY = this.y + Math.sin(angle) * this.blinkDistance;
            } else {
                // Calculate position near player
                const angle = Math.random() * Math.PI * 2;
                const blinkDistance = this.blinkDistance * 0.7; // Blink closer to player
                
                targetX = player.x + Math.cos(angle) * blinkDistance;
                targetY = player.y + Math.sin(angle) * blinkDistance;
            }
            
            // Apply boundary restrictions
            const margin = 50;
            this.x = Math.max(margin, Math.min(gameWidth - margin, targetX));
            this.y = Math.max(margin, Math.min(gameHeight - margin, targetY));
            
            // Visual effect at new position
            addAnimatedEffect('sparkle', this.x, this.y, 500);
            
            // Enter stealth after blinking
            this.stealthed = true;
            this.lastStealthTime = Date.now();
        },
        
        // Attack the player
        attack() {
            if (!player || !player.active) return;
            
            console.log('Assassin Lord attacking player');
            
            // Apply damage to player
            player.takeDamage(this.damage);
            
            // Visual effect
            addAnimatedEffect('hit', player.x, player.y, 300);
            
            // Phase-based special attacks
            if (this.phase >= 2) {
                // Phase 2+: Multiple rapid strikes
                setTimeout(() => {
                    if (this.active && player && player.active) {
                        // Second strike
                        player.takeDamage(this.damage * 0.5);
                        addAnimatedEffect('hit', player.x, player.y, 300);
                    }
                }, 200);
            }
            
            if (this.phase >= 3) {
                // Phase 3+: Apply bleeding effect (DOT)
                if (typeof player.applyBleedingEffect === 'function') {
                    player.applyBleedingEffect(5, 5000); // 5 damage over 5 seconds
                }
            }
            
            if (this.phase >= 4) {
                // Phase 4: Summon additional clone on attack
                if (Math.random() < 0.3 && this.clones.length < this.maxClones) { // 30% chance
                    this.spawnClones();
                }
            }
        },
        
        draw(ctx) {
            if (!this.active) return;
            
            // Draw clones first (behind boss)
            this.clones.forEach(clone => clone.draw(ctx));
            
            // Save context state
            ctx.save();
            
            // Apply stealth transparency effect
            if (this.stealthed) {
                ctx.globalAlpha = this.stealthAlpha;
            }
            
            // Draw phase-based visual effects
            if (this.phase >= 2) {
                // Glowing aura for higher phases
                const now = Date.now();
                const pulseRate = Math.sin(now * 0.005) * 0.2 + 0.8;
                
                ctx.globalAlpha = (this.stealthed ? this.stealthAlpha : 0.7) * pulseRate;
                ctx.fillStyle = `rgba(102, 0, 102, 0.3)`; // Purple aura
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.width * 0.8, 0, Math.PI * 2);
                ctx.fill();
                
                // Return to normal alpha
                ctx.globalAlpha = this.stealthed ? this.stealthAlpha : 1;
            }
            
            // Draw boss sprite
            // Check if sprite exists first
            const sprite = sprites['assassinLord'] || sprites['assassin'];
            if (sprite) {
                ctx.drawImage(
                    sprite,
                    this.x - this.width / 2,
                    this.y - this.height / 2,
                    this.width,
                    this.height
                );
            } else {
                // Fallback if sprite is not found
                ctx.fillStyle = '#660066'; // Purple for assassin
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw a symbol to indicate it's a boss
                ctx.fillStyle = '#FF00FF';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.width / 4, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Restore context state
            ctx.restore();
            
            // Draw health bar
            const barWidth = this.width * 1.2;
            const barHeight = 10; // Increased height to match base boss
            const barX = this.x - barWidth / 2;
            const barY = this.y - this.height / 2 - 20;
            
            // Health bar background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // Health bar
            const healthPercentage = this.health / this.maxHealth;
            
            // Multi-colored health bar based on phase
            if (this.phase === 1) {
                ctx.fillStyle = '#00ff00'; // Green for phase 1
            } else if (this.phase === 2) {
                ctx.fillStyle = '#ffff00'; // Yellow for phase 2
            } else if (this.phase === 3) {
                ctx.fillStyle = '#ff9900'; // Orange for phase 3
            } else {
                ctx.fillStyle = '#ff0000'; // Red for phase 4
            }
            
            ctx.fillRect(barX, barY, barWidth * healthPercentage, barHeight);
            
            // Phase indicators below health bar
            const phaseSize = 6;
            const phasePadding = 3;
            const phaseY = barY + barHeight + phasePadding;
            const totalPhaseWidth = (this.phaseThresholds.length + 1) * phaseSize + 
                                   this.phaseThresholds.length * phasePadding;
            const phaseStartX = this.x - totalPhaseWidth / 2 + phaseSize / 2;
            
            for (let i = 0; i < this.phaseThresholds.length + 1; i++) {
                const phaseX = phaseStartX + i * (phaseSize + phasePadding);
                
                ctx.fillStyle = i < this.phase ? '#ff00ff' : '#666666';
                ctx.beginPath();
                ctx.arc(phaseX, phaseY, phaseSize / 2, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Boss name and level with outline for better visibility
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            
            // Draw text outline
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 3;
            ctx.strokeText(`${this.name} (Level ${this.level})`, this.x, barY - 10);
            
            // Draw text
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(`${this.name} (Level ${this.level})`, this.x, barY - 10);
        },
        
        takeDamage(amount) {
            // Reduce damage when stealthed
            const actualDamage = this.stealthed ? amount * 0.6 : amount;
            this.health -= actualDamage;
            
            // Break stealth when taking damage
            if (this.stealthed) {
                this.stealthed = false;
                this.lastStealthTime = Date.now();
                addAnimatedEffect('hit', this.x, this.y, 300);
            }
            
            // Check if boss is defeated
            if (this.health <= 0) {
                this.die();
            }
            
            return actualDamage;
        },
        
        die() {
            this.active = false;
            
            // Kill all clones
            this.clones.forEach(clone => {
                clone.active = false;
                addAnimatedEffect('explosion', clone.x, clone.y, 500);
            });
            
            // Create death explosion effect
            addAnimatedEffect('explosion', this.x, this.y, 1000);
            
            // Spawn multiple explosions around the boss
            for (let i = 0; i < 10; i++) {
                const distance = Math.random() * 100 + 50;
                const angle = Math.random() * Math.PI * 2;
                const x = this.x + Math.cos(angle) * distance;
                const y = this.y + Math.sin(angle) * distance;
                
                setTimeout(() => {
                    addAnimatedEffect('explosion', x, y, 800);
                }, i * 100);
            }
            
            // Award experience and notify about boss defeat
            console.log(`${this.name} has been defeated!`);
            showBossDefeatMessage(this.name);
            
            return this.experienceValue;
        }
    };
    
    return boss;
} 