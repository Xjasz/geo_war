// Main game logic

// Game state
const GAME_STATE = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameOver',
    LEVEL_UP: 'levelUp'
};

// Global game variables
let gameWidth = 800;
let gameHeight = 600;
let gameState = GAME_STATE.MENU;
let gameTime = 0;
let enemiesDefeated = 0;
let canvas;
let ctx;
let player;
let enemies = [];
let projectiles = [];
let pickups = [];
let effects = [];
let lastEnemySpawnTime = 0;
let lastPickupSpawnTime = 0;
let levelUpActive = false;
let levelUpChoices = [];
let gamePaused = false; // Game pause state
let gameRunning = false; // Game running state

// Item selection for level up
let itemChoices = [];

// Input handling
const keys = {};

// Add boss-related variables
let bosses = [];
let lastBossSpawnTime = 0;
const BOSS_SPAWN_INTERVAL = 20; // Changed from 60 to 20 seconds

// Boss tracking
let defeatedBosses = [];
let allBossesDefeated = false;
let finalBossesSpawned = false;
let gameCompleted = false;

// Debug mode
window.DEBUG_MODE = false; // Set to true to enable debug features

// Expose important game variables to the global scope
window.gameWidth = gameWidth;
window.gameHeight = gameHeight;
window.gameTime = gameTime;
window.GAME_STATE = GAME_STATE;

// Global variables for enemy spawning
let enemySpawnTimer = 0;
let lastWaveTime = 0;

// Main game update loop
function updateGame(deltaTime) {
    if (gameState !== GAME_STATE.PLAYING) return;
    
    // Skip updates if game is paused
    if (gamePaused) return;
    
    // Update game time
    gameTime += deltaTime / 1000;
    window.gameTime = gameTime; // Update the global reference
    
    // Handle boss spawning
    handleBossSpawning(gameTime);
    
    // Update player
    if (player) {
        player.update(deltaTime, keys);
    }
    
    // Update weapons
    updateWeapons(deltaTime);
    
    // Update projectiles
    updateProjectiles(deltaTime);
    
    // Update bosses
    updateBosses(deltaTime);
    
    // Update enemies
    updateEnemies(deltaTime);
    
    // Update pickups
    updatePickups(deltaTime);
    
    // Update effects
    updateEffects(deltaTime);
    
    // Update toxic puddles
    updateToxicPuddles(deltaTime);
    
    // Handle enemy spawning
    handleEnemySpawning(deltaTime);
    
    // Handle pickup spawning
    handlePickupSpawning(deltaTime);
    
    // Check if player is dead
    if (!player.active) {
        gameOver();
    }
    
    // Debug info
    if (gameTime % 5 < 0.1) { // Log every ~5 seconds
        console.log(`Game state: ${gameTime.toFixed(1)}s, ${enemies.length} enemies, ${projectiles.length} projectiles, ${player.weapons.length} weapons`);
    }
}

// Update all weapons
function updateWeapons(deltaTime) {
    if (!player || !player.weapons) return;
    
    if (window.DEBUG_MODE) {
        console.log(`Updating ${player.weapons.length} weapons`);
    }
    
    for (let i = player.weapons.length - 1; i >= 0; i--) {
        const weapon = player.weapons[i];
        
        if (!weapon) {
            console.error(`Invalid weapon at index ${i}`);
            player.weapons.splice(i, 1);
            continue;
        }
        
        if (!weapon.active) {
            player.weapons.splice(i, 1);
            continue;
        }
        
        if (window.DEBUG_MODE) {
            console.log(`Updating weapon: ${weapon.sprite || 'unknown'}, active: ${weapon.active}`);
        }
        
        // Update weapon with both enemies and bosses for collision detection
        if (weapon.update) {
            weapon.update(deltaTime, [...enemies, ...bosses]);
        }
        
        // Create projectiles if weapon has attack method
        if (weapon.attack) {
            const projectile = weapon.attack();
            if (projectile) {
                projectiles.push(projectile);
            }
        }
    }
}

// Update all projectiles
function updateProjectiles(deltaTime) {
    if (projectiles.length > 0 && window.DEBUG_MODE) {
        console.log(`Updating ${projectiles.length} projectiles`);
    }
    
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const projectile = projectiles[i];
        
        if (!projectile) {
            console.error(`Invalid projectile at index ${i}`);
            projectiles.splice(i, 1);
            continue;
        }
        
        if (!projectile.update) {
            console.error(`Projectile at index ${i} has no update method`);
            projectiles.splice(i, 1);
            continue;
        }
        
        // Update projectile with both enemies and bosses for collision detection
        projectile.update(deltaTime, [...enemies, ...bosses]);
        
        // Check for collision with player for enemy projectiles
        if (!projectile.isPlayer && projectile.active && player.active && !player.invulnerable) {
            const projectileHitbox = {
                x: projectile.x - projectile.width / 2,
                y: projectile.y - projectile.height / 2,
                width: projectile.width,
                height: projectile.height
            };
            
            const playerHitbox = {
                x: player.x - player.width / 2,
                y: player.y - player.height / 2,
                width: player.width,
                height: player.height
            };
            
            if (checkCollision(projectileHitbox, playerHitbox)) {
                console.log(`Player hit by enemy projectile for ${projectile.damage} damage`);
                
                // Apply damage to player
                player.takeDamage(projectile.damage);
                
                // Apply knockback to player
                if (projectile.knockback > 0) {
                    const knockbackAngle = projectile.angle;
                    player.x += Math.cos(knockbackAngle) * projectile.knockback;
                    player.y += Math.sin(knockbackAngle) * projectile.knockback;
                }
                
                // Create hit effect
                try {
                    if (typeof addAnimatedEffect === 'function') {
                        addAnimatedEffect('hit', player.x, player.y, 300);
                    }
                } catch (e) {
                    console.error('Error creating hit effect:', e);
                }
                
                // Deactivate projectile
                projectile.active = false;
            }
        }
        
        // Remove inactive projectiles
        if (!projectile.active) {
            projectiles.splice(i, 1);
        }
    }
}

// Update all enemies
function updateEnemies(deltaTime) {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        
        // Skip if enemy is already inactive
        if (!enemy.active) {
            
            // Drop experience gem with reduced probability (50% chance)
            const expValue = enemy.experienceValue || 0;
            if (expValue > 0 && Math.random() < 0.5) {
                const expGem = createExperienceGem(enemy.x, enemy.y, expValue);
                if (expGem) {
                    pickups.push(expGem);
                }
            }
            
            enemies.splice(i, 1);
            
            // Reduced chance to drop an item (5% instead of 10%)
            if (Math.random() < 0.05) { // 5% chance
                spawnRandomPickup(enemy.x, enemy.y);
            }
            continue;
        }
        
        // Update active enemies
        enemy.update(deltaTime, player);
        
        // Check for direct collisions with player for melee enemies
        if (player && player.active && !player.invulnerable) {
            // Skip collision checks for certain enemy types that handle attacks differently
            // (e.g., archer, mage use projectiles; assassin, bomber have built-in collision detection)
            const skipCollisionTypes = [
                ENEMY_TYPES.ARCHER, 
                ENEMY_TYPES.MAGE, 
                ENEMY_TYPES.ASSASSIN, 
                ENEMY_TYPES.BOMBER
            ];
            
            // Only perform collision check for melee enemy types
            if (!skipCollisionTypes.includes(enemy.type)) {
                // Calculate distance between enemy and player
                const dist = distance(enemy.x, enemy.y, player.x, player.y);
                const collisionDistance = (enemy.width + player.width) / 2 * 0.7; // 70% of combined radius
                
                // Check if close enough to damage player
                if (dist < collisionDistance) {
                    // Only damage player every second
                    const now = Date.now();
                    if (!enemy.lastAttackTime || now - enemy.lastAttackTime > 1000) {
                        console.log(`Enemy ${enemy.type} collided with player and dealt ${enemy.damage} damage`);
                        player.takeDamage(enemy.damage);
                        enemy.lastAttackTime = now;
                        
                        // Visual effect for hit
                        addAnimatedEffect('hit', player.x, player.y, 300);
                    }
                }
            }
        }
    }
}

// Update all pickups
function updatePickups(deltaTime) {
    for (let i = pickups.length - 1; i >= 0; i--) {
        const pickup = pickups[i];
        const collected = pickup.update(player, deltaTime);
        
        // Remove collected pickups
        if (collected) {
            player.addItem(pickup.item);
            pickups.splice(i, 1);
        }
    }
}

// Update all effects
function updateEffects(deltaTime) {
    for (let i = effects.length - 1; i >= 0; i--) {
        const effect = effects[i];
        const active = effect.update(deltaTime);
        
        // Remove inactive effects
        if (!active) {
            effects.splice(i, 1);
        }
    }
}

// Handle enemy spawning based on time
function handleEnemySpawning(deltaTime) {
    // Spawn timer-based waves of enemies every 2 seconds
    
    // Update spawn timer
    enemySpawnTimer += deltaTime;
    
    // Calculate how many enemies to spawn based on game time
    // Start with 10 enemies every 2 seconds, increase by 5 every 10 seconds
    const baseWaveSize = 10;
    const waveTimeInterval = 2000; // 2 seconds
    const difficultyIncreaseInterval = 10; // 10 seconds
    const additionalEnemiesPerInterval = 5;
    
    // Calculate current wave size based on game time
    const timeBasedIncrease = Math.floor(gameTime / difficultyIncreaseInterval) * additionalEnemiesPerInterval;
    const currentWaveSize = baseWaveSize + timeBasedIncrease;
    
    // If it's time for a new wave, spawn enemies
    if (enemySpawnTimer >= waveTimeInterval) {
        enemySpawnTimer = 0; // Reset timer
        
        // Log the wave for debugging
        const waveNumber = Math.floor(gameTime / waveTimeInterval);
        console.log(`Spawning wave ${waveNumber} with ${currentWaveSize} enemies (gameTime: ${gameTime.toFixed(1)}s)`);
        
        // Calculate enemy level based on time
        const enemyLevel = Math.max(1, Math.floor(gameTime / 60) + 1);
        
        // Spawn a wave of enemies
        const newEnemies = spawnEnemyWave(currentWaveSize, gameWidth, gameHeight, player, enemyLevel);
        enemies.push(...newEnemies);
        
        // Update the last wave time
        lastWaveTime = gameTime;
    }
    
    // Occasionally spawn an additional surprise enemy
    const surpriseSpawnChance = 0.0005 * (deltaTime / 1000) * (1 + gameTime / 120);
    if (Math.random() < surpriseSpawnChance) {
        const enemyLevel = Math.max(1, Math.floor(gameTime / 60) + 1);
        const enemy = spawnRandomEnemy(gameWidth, gameHeight, player, enemyLevel);
        if (enemy) {
            enemies.push(enemy);
        }
    }
}

// Handle pickup spawning
function handlePickupSpawning(deltaTime) {
    // Occasionally spawn random pickups in the game world
    const spawnChance = 0.05 * (deltaTime / 1000); // 5% chance per second
    
    if (Math.random() < spawnChance) {
        const pos = getRandomPosition(gameWidth, gameHeight);
        spawnRandomPickup(pos.x, pos.y);
    }
}

// Spawn a random pickup
function spawnRandomPickup(x, y) {
    // Possible pickup types
    const pickupTypes = [
        'healthPotion',
        'speedBoots',
        'shield',
        'amulet',
        'magnet',
        'ring',
        'crown'
    ];
    
    // Weapons are rarer
    if (Math.random() < 0.2) { // 20% chance for a weapon
        pickupTypes.push('sword', 'axe', 'bow', 'wand', 'laserGun');
    }
    
    const randomType = pickupTypes[Math.floor(Math.random() * pickupTypes.length)];
    const pickup = createPickup(randomType, x, y);
    
    if (pickup) {
        pickups.push(pickup);
    }
}

// Show level up screen with item choices
function showLevelUpScreen() {
    console.log("Player leveled up - auto-increasing stats");
    
    // Instead of showing level-up screen, automatically improve player stats
    autoImprovePlayerStats();
    
    // Resume gameplay immediately
    gameState = GAME_STATE.PLAYING;
    levelUpActive = false;
}

// Automatically improve player stats instead of showing item selection
function autoImprovePlayerStats() {
    // Determine which stat to improve based on character type and random chance
    const statImprovements = {
        health: 0,
        moveSpeed: 0,
        damage: 0,
        attackSpeed: 0,
        pickupRange: 0
    };
    
    // Base improvements - reduced from 10% to 5%
    statImprovements.health = player.maxHealth * 0.05; // 5% health increase (was 10%)
    
    // Character-specific improvements - reduced by approximately half
    switch(player.type) {
        case 'knight':
            // Knight gets more health and damage
            statImprovements.health += player.maxHealth * 0.02; // Extra 2% health (was 5%)
            statImprovements.damage = 0.05; // 5% damage increase (was 10%)
            break;
        case 'archer':
            // Archer gets more attack speed and move speed
            statImprovements.attackSpeed = 0.05; // 5% attack speed increase (was 10%)
            statImprovements.moveSpeed = 0.02; // 2% move speed increase (was 5%)
            break;
        case 'mage':
            // Mage gets more damage and pickup range
            statImprovements.damage = 0.07; // 7% damage increase (was 15%)
            statImprovements.pickupRange = 2; // +2 pickup range (was 5)
            break;
    }
    
    // Every 5 levels, give an additional bonus - reduced by approximately half
    if (player.level % 5 === 0) {
        statImprovements.health += player.maxHealth * 0.05; // Extra 5% health (was 10%)
        statImprovements.damage += 0.05; // Extra 5% damage (was 10%)
        statImprovements.attackSpeed += 0.05; // Extra 5% attack speed (was 10%)
    }
    
    // Apply improvements
    player.maxHealth += statImprovements.health;
    // Heal 5% of max health instead of full heal
    player.health += player.maxHealth * 0.05;
    // Cap health at max health
    if (player.health > player.maxHealth) {
        player.health = player.maxHealth;
    }
    player.baseStats.health = player.maxHealth;
    
    if (statImprovements.moveSpeed > 0) {
        player.baseStats.moveSpeed *= (1 + statImprovements.moveSpeed);
        player.moveSpeed = player.baseStats.moveSpeed * player.moveSpeedMultiplier;
    }
    
    if (statImprovements.damage > 0) {
        player.damageMultiplier *= (1 + statImprovements.damage);
    }
    
    if (statImprovements.attackSpeed > 0) {
        player.attackSpeedMultiplier *= (1 + statImprovements.attackSpeed);
        player.updateWeaponSpeeds();
    }
    
    if (statImprovements.pickupRange > 0) {
        player.baseStats.pickupRange += statImprovements.pickupRange;
        player.pickupRange = player.baseStats.pickupRange;
    }
    
    // Apply stat caps after improvements
    if (typeof player.capStats === 'function') {
        player.capStats();
    }
    
    console.log(`Applied auto-improvements to player stats:`, statImprovements);
    console.log(`Healed 5% of max health: +${(player.maxHealth * 0.05).toFixed(1)} HP`);
    
    // Update UI
    updateHtmlUI();
}

// Select an item from the level up screen - this function won't be used anymore
// but we'll keep it for compatibility
function selectLevelUpItem(itemIndex) {
    // Resume gameplay immediately
    gameState = GAME_STATE.PLAYING;
    levelUpActive = false;
    
    // Hide level up screen
    const levelUpScreen = document.getElementById('level-up-screen');
    if (levelUpScreen) {
        levelUpScreen.style.display = 'none';
    }
    
    // Show joystick again on mobile
    const joystickArea = document.getElementById('joystick-area');
    if (joystickArea) {
        joystickArea.style.opacity = '0.3';
    }
    
    // ... existing code ...
}

// Game over
function gameOver() {
    gameState = GAME_STATE.GAME_OVER;
    gameRunning = false; // Set game as not running
    
    // Update UI with final stats
    document.getElementById('final-time').textContent = formatTime(gameTime);
    document.getElementById('final-level').textContent = player.level;
    document.getElementById('enemies-defeated').textContent = enemiesDefeated;
    
    // Show game over screen
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.remove('hidden');
}

// Render the game
function renderGame(ctx) {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    drawBackground(ctx);
    
    // Draw toxic puddles (below everything else)
    drawToxicPuddles(ctx);
    
    // Draw pickups
    for (const pickup of pickups) {
        pickup.draw(ctx);
    }
    
    // Draw projectiles
    for (const projectile of projectiles) {
        projectile.draw(ctx);
    }
    
    // Draw enemies
    for (const enemy of enemies) {
        enemy.draw(ctx);
    }
    
    // Draw bosses
    for (const boss of bosses) {
        boss.draw(ctx);
    }
    
    // Draw player (which also draws weapons)
    if (player) {
        player.draw(ctx);
    }
    
    // Draw effects
    for (const effect of effects) {
        effect.draw(ctx);
    }
    
    // Draw UI
    drawUI(ctx);
    
    // Draw level up screen if active
    if (levelUpActive) {
        drawLevelUpScreen(ctx);
    }
    
    // Draw boss announcement if active
    if (bossAnnouncement) {
        drawBossAnnouncement(ctx);
    }
    
    // Draw game completed message if active
    if (gameCompletedMessage) {
        drawGameCompletedMessage(ctx);
    }
    
    // Draw debug info if enabled
    if (window.DEBUG_MODE) {
        drawDebugInfo(ctx);
    }
    
    // Draw pause overlay if game is paused
    if (gamePaused) {
        drawPauseOverlay(ctx);
    }
}

// Draw the game background
function drawBackground(ctx) {
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, gameWidth, gameHeight);
    
    // Draw a simple grid
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 1;
    
    const gridSize = 50;
    
    ctx.beginPath();
    for (let x = 0; x < gameWidth; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, gameHeight);
    }
    
    for (let y = 0; y < gameHeight; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(gameWidth, y);
    }
    ctx.stroke();
}

// Draw the game UI
function drawUI(ctx) {
    // Update HTML UI elements instead of drawing on canvas
    updateHtmlUI();
    
    // Draw items
    const itemSize = 40;
    const itemPadding = 10;
    const itemsPerRow = 5;
    const startX = gameWidth - (itemSize + itemPadding) * itemsPerRow;
    const startY = 20;
    
    // Draw items
    player.items.forEach((item, index) => {
        const row = Math.floor(index / itemsPerRow);
        const col = index % itemsPerRow;
        const x = startX + col * (itemSize + itemPadding);
        const y = startY + row * (itemSize + itemPadding);
        
        // Draw item background
        ctx.fillStyle = getItemColor(item);
        ctx.fillRect(x, y, itemSize, itemSize);
        
        // Draw item sprite if available
        if (item.sprite) {
            try {
                drawSprite(ctx, item.sprite, x, y, itemSize, itemSize);
            } catch (error) {
                console.warn(`Error drawing sprite for item ${item.name}:`, error);
                // Draw item letter as fallback
                ctx.fillStyle = '#ffffff';
                ctx.font = '20px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(item.name.charAt(0), x + itemSize / 2, y + itemSize / 2);
            }
        } else {
            // Draw item letter if no sprite
            ctx.fillStyle = '#ffffff';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.name.charAt(0), x + itemSize / 2, y + itemSize / 2);
        }
        
        // Draw item border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, itemSize, itemSize);
        
        // Draw item count if more than 1
        if (item.count && item.count > 1) {
            // Draw count background
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.beginPath();
            ctx.arc(x + itemSize - 8, y + itemSize - 8, 12, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw count text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.count, x + itemSize - 8, y + itemSize - 8);
        }
        
        // Add item name below the item icon
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        
        // Create shortened name if necessary
        let displayName = item.name;
        if (displayName.length > 10) {
            displayName = displayName.substring(0, 8) + '..';
        }
        
        ctx.fillText(displayName, x + itemSize / 2, y + itemSize + 2);
    });
    
    // Draw level and enemies defeated in the corner
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`Enemies Defeated: ${enemiesDefeated}`, 20, 70);
}

// Update HTML UI elements
function updateHtmlUI() {
    // Update health bar
    const healthPercentage = player.getHealthPercentage();
    const healthFill = document.querySelector('.health-fill');
    if (healthFill) {
        healthFill.style.width = `${healthPercentage * 100}%`;
        
        // Change color based on health
        if (healthPercentage > 0.5) {
            healthFill.style.backgroundColor = '#00ff00';
        } else if (healthPercentage > 0.25) {
            healthFill.style.backgroundColor = '#ffff00';
        } else {
            healthFill.style.backgroundColor = '#ff0000';
        }
    }
    
    // Update XP bar
    const xpPercentage = player.getExperiencePercentage();
    const xpFill = document.querySelector('.xp-fill');
    if (xpFill) {
        xpFill.style.width = `${xpPercentage * 100}%`;
    }
    
    // Update level
    const levelElement = document.getElementById('level');
    if (levelElement) {
        levelElement.textContent = player.level;
    }
    
    // Update time
    const timeElement = document.getElementById('time');
    if (timeElement) {
        timeElement.textContent = formatTime(gameTime);
    }
}

// Draw debug information
function drawDebugInfo(ctx) {
    ctx.font = '12px Courier New';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, canvas.height - 220, 350, 210);
    ctx.fillStyle = '#ffffff';
    
    // Display player info
    ctx.fillText(`Player: x=${Math.round(player.x)}, y=${Math.round(player.y)}, health=${player.health}/${player.maxHealth}`, 20, canvas.height - 200);
    
    // Display detailed speed and multiplier info
    ctx.fillText(`Base moveSpeed: ${player.baseStats?.moveSpeed || 'N/A'}`, 20, canvas.height - 180);
    ctx.fillText(`Current moveSpeed: ${player.moveSpeed}`, 20, canvas.height - 165);
    ctx.fillText(`moveSpeedMultiplier: ${player.moveSpeedMultiplier?.toFixed(3) || 'N/A'}`, 20, canvas.height - 150);
    ctx.fillText(`attackSpeedMultiplier: ${player.attackSpeedMultiplier?.toFixed(3) || 'N/A'}`, 20, canvas.height - 135);
    ctx.fillText(`damageMultiplier: ${player.damageMultiplier?.toFixed(3) || 'N/A'}`, 20, canvas.height - 120);
    ctx.fillText(`expMultiplier: ${player.expMultiplier?.toFixed(3) || 'N/A'}`, 20, canvas.height - 105);
    
    // Display weapons info
    ctx.fillText(`Weapons: ${player.weapons.length}`, 20, canvas.height - 85);
    
    player.weapons.forEach((weapon, index) => {
        if (index > 2) return; // Limit to 3 weapons to avoid overflow
        
        let weaponInfo = `- ${weapon.name || 'unknown'}: `;
        
        if (weapon instanceof SpinningWeapon) {
            weaponInfo += `rot=${weapon.rotationSpeed.toFixed(3)}, baseRot=${weapon.baseRotationSpeed?.toFixed(3) || 'N/A'}`;
        } else {
            weaponInfo += `speed=${weapon.attackSpeed?.toFixed(3) || 'N/A'}, baseSpeed=${weapon.baseAttackSpeed?.toFixed(3) || 'N/A'}`;
        }
        
        ctx.fillText(weaponInfo, 30, canvas.height - 65 + index * 15);
    });
    
    // Display entity counts
    ctx.fillText(`Entities: ${enemies.length} enemies, ${bosses.length} bosses, ${projectiles.length} projectiles`, 20, canvas.height - 20);
    
    // Display game time
    ctx.fillText(`Game time: ${formatTime(gameTime)}`, 20, canvas.height - 35);
}

// Get color for item display
function getItemColor(item) {
    switch (item.rarity) {
        case ITEM_RARITY.COMMON:
            return '#aaaaaa';
        case ITEM_RARITY.UNCOMMON:
            return '#00aa00';
        case ITEM_RARITY.RARE:
            return '#0000aa';
        case ITEM_RARITY.EPIC:
            return '#aa00aa';
        case ITEM_RARITY.LEGENDARY:
            return '#aaaa00';
        default:
            return '#ffffff';
    }
}

// Draw the level up screen
function drawLevelUpScreen(ctx) {
    // Darken the background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, gameWidth, gameHeight);
    
    // Draw level up text
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL UP!', gameWidth / 2, gameHeight / 4);
    
    ctx.font = '24px Arial';
    ctx.fillText('Choose an item:', gameWidth / 2, gameHeight / 4 + 50);
    
    // Draw item choices
    const itemWidth = 150;
    const itemHeight = 200;
    const spacing = 30;
    const totalWidth = itemChoices.length * itemWidth + (itemChoices.length - 1) * spacing;
    let startX = (gameWidth - totalWidth) / 2;
    
    for (let i = 0; i < itemChoices.length; i++) {
        const item = itemChoices[i];
        const x = startX + i * (itemWidth + spacing);
        const y = gameHeight / 2 - itemHeight / 2;
        
        // Store the rect for click detection
        item.rect = {
            x: x,
            y: y,
            width: itemWidth,
            height: itemHeight,
            index: i
        };
        
        // Draw item background
        ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
        ctx.fillRect(x, y, itemWidth, itemHeight);
        
        // Draw item border
        ctx.strokeStyle = getItemColor(item);
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, itemWidth, itemHeight);
        
        // Draw item name
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(item.name, x + itemWidth / 2, y + 30);
        
        // Draw item sprite or letter
        if (item.sprite && sprites[item.sprite]) {
            try {
                drawSprite(ctx, item.sprite, x + itemWidth / 2 - 25, y + 60, 50, 50);
            } catch (error) {
                console.warn(`Error drawing sprite for item ${item.name}:`, error);
                // Draw item letter as fallback
                ctx.fillStyle = '#ffffff';
                ctx.font = '36px Arial';
                ctx.fillText(item.name.charAt(0), x + itemWidth / 2, y + 85);
            }
        } else {
            ctx.fillStyle = '#ffffff';
            ctx.font = '36px Arial';
            ctx.fillText(item.name.charAt(0), x + itemWidth / 2, y + 85);
        }
        
        // Draw item description
        ctx.fillStyle = '#ccc';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        
        // Split description into multiple lines if needed
        const maxLineWidth = itemWidth - 20;
        const words = item.description.split(' ');
        let line = '';
        let lineY = y + 120;
        
        for (const word of words) {
            const testLine = line + (line ? ' ' : '') + word;
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxLineWidth && line !== '') {
                ctx.fillText(line, x + itemWidth / 2, lineY);
                line = word;
                lineY += 20;
            } else {
                line = testLine;
            }
        }
        
        ctx.fillText(line, x + itemWidth / 2, lineY);
        
        // Draw item rarity
        ctx.fillStyle = getItemColor(item);
        ctx.font = 'bold 16px Arial';
        ctx.fillText(item.rarity.toUpperCase(), x + itemWidth / 2, y + itemHeight - 20);
    }
}

// Handle mouse click on level up screen
function handleLevelUpClick(x, y) {
    if (gameState !== GAME_STATE.LEVEL_UP) {
        console.log("Ignoring click - not in level up state");
        return;
    }
    
    console.log(`Checking click at (${x}, ${y}) against ${itemChoices.length} items`);
    
    let itemClicked = false;
    for (const item of itemChoices) {
        if (item.rect && 
            x >= item.rect.x && 
            x <= item.rect.x + item.rect.width && 
            y >= item.rect.y && 
            y <= item.rect.y + item.rect.height) {
            
            console.log(`Item clicked: ${item.name} at index ${item.rect.index}`);
            selectLevelUpItem(item.rect.index);
            itemClicked = true;
            break;
        }
    }
    
    if (!itemClicked) {
        console.log("No item was clicked");
    }
}

// Create an animated effect and add it to the game
function addAnimatedEffect(type, x, y, duration = 500) {
    try {
        // Create a new effect object directly
        const effect = {
            type,
            x,
            y,
            startTime: Date.now(),
            duration,
            isActive: true,
            scale: 1.0, // Default scale
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
                const size = SPRITE_SIZE * this.scale * (1 - progress);
                
                ctx.globalAlpha = 1 - progress;
                drawSprite(ctx, sprites[this.type], this.x - size / 2, this.y - size / 2, size, size);
                ctx.globalAlpha = 1;
            }
        };
        
        effects.push(effect);
        return effect;
    } catch (error) {
        console.error('Error creating animated effect:', error);
        return null;
    }
}

// Handle boss spawning based on game time
function handleBossSpawning(currentGameTime) {
    // Don't spawn bosses during level up or if game is over
    if (gameState !== GAME_STATE.PLAYING) return;
    
    // Check if we've completed the game
    if (gameCompleted) return;
    
    // NEW SYSTEM: Spawn a boss every 20 seconds
    const BOSS_SPAWN_INTERVAL = 20; // Changed from 60 to 20 seconds
    const WARNING_TIME = 5; // Changed from 10 to 5 seconds
    
    // Pre-announce final boss wave at around 3 minutes (180 seconds)
    if (currentGameTime >= 180 && currentGameTime < 181 && !window.finalBossPreAnnounced) {
        console.log("3 minutes reached! Pre-announcing final boss wave!");
        window.finalBossPreAnnounced = true;
        spawnFinalBossWave(); // This now includes a warning delay
        return;
    }
    
    // If we've already spawned the final boss wave and all bosses are defeated
    if (finalBossesSpawned && bosses.length === 0 && !gameCompleted) {
        console.log("CONGRATULATIONS! You've completed the map!");
        showGameCompletedMessage();
        gameCompleted = true;
        return;
    }
    
    // Calculate current time interval (every 20 seconds)
    const currentInterval = Math.floor(currentGameTime / BOSS_SPAWN_INTERVAL);
    const secondsIntoInterval = currentGameTime % BOSS_SPAWN_INTERVAL;
    
    // Check if we should pre-announce a boss (5 seconds before spawn)
    const shouldPreAnnounce = currentInterval > 0 && 
                             currentInterval > lastBossSpawnTime &&
                             secondsIntoInterval >= (BOSS_SPAWN_INTERVAL - WARNING_TIME) && 
                             !window.bossPreAnnounced &&
                             currentGameTime < 180; // Stop regular spawns before final wave
    
    if (shouldPreAnnounce) {
        console.log(`Pre-announcing boss at ${currentGameTime.toFixed(1)} seconds`);
        window.bossPreAnnounced = true;
        
        // Get the boss type that will spawn
        const bossIndex = (currentInterval - 1) % Object.keys(BOSS_TYPES).length;
        const bossType = Object.values(BOSS_TYPES)[bossIndex];
        const bossName = BOSSES[bossType].name;
        
        // Show pre-announcement with 5-second warning
        showBossWarning(bossName);
    }
    
    // Spawn a boss every 20 seconds starting at interval 1
    const shouldSpawnBoss = currentInterval > 0 && 
                           currentInterval > lastBossSpawnTime &&
                           secondsIntoInterval < 1 && // Spawn at the start of the interval
                           currentGameTime < 180;     // Stop before final wave
    
    if (shouldSpawnBoss) {
        console.log(`Time to spawn a boss! Current game time: ${currentGameTime.toFixed(1)} seconds`);
        lastBossSpawnTime = currentInterval;
        window.bossPreAnnounced = false; // Reset pre-announcement state
        
        // Spawn a boss
        const boss = spawnBoss(currentGameTime, canvas.width, canvas.height, player);
        if (boss) {
            bosses.push(boss);
            showBossAnnouncement(boss.name);
        }
    }
}

// Spawn the final boss wave with all boss types
function spawnFinalBossWave() {
    // Set flag for final bosses
    finalBossesSpawned = true;
    
    // Pre-announce the wave
    showBossAnnouncement("ALL BOSSES", true);
    
    // Spawn the bosses after a delay (to give player time to prepare)
    setTimeout(() => {
        if (!gameRunning || !finalBossesSpawned) return;
        // Clear any remaining enemies to give the player a clean slate
        enemies = [];
        
        // Show announcement
        const bossMessage = document.createElement('div');
        bossMessage.className = 'boss-message final-boss-message';
        bossMessage.textContent = 'FINAL CHALLENGE: All bosses have appeared!';
        document.body.appendChild(bossMessage);
        
        // Fade out the message after 5 seconds
        setTimeout(() => {
            bossMessage.style.opacity = 0;
            setTimeout(() => {
                if (bossMessage.parentNode) {
                    bossMessage.parentNode.removeChild(bossMessage);
                }
            }, 1000);
        }, 5000);
        
        // Calculate positions for the bosses
        const positions = [];
        const numberOfBosses = Object.keys(BOSS_TYPES).length; // Get the actual count of boss types
        
        for (let i = 0; i < numberOfBosses; i++) {
            const angle = (i * Math.PI * 2) / numberOfBosses;
            const spawnDistance = 300; // Increased distance to spread them out
            
            const pos = {
                x: player.x + Math.cos(angle) * spawnDistance,
                y: player.y + Math.sin(angle) * spawnDistance
            };
            
            // Ensure boss is within game bounds
            pos.x = Math.max(100, Math.min(gameWidth - 100, pos.x));
            pos.y = Math.max(100, Math.min(gameHeight - 100, pos.y));
            
            positions.push(pos);
        }
        
        // Spawn all boss types around the player
        let index = 0;
        
        // Iterate through all boss types to ensure they all spawn
        for (const bossType in BOSS_TYPES) {
            if (index >= positions.length) break;
            
            const pos = positions[index];
            const boss = createBoss(BOSS_TYPES[bossType], pos.x, pos.y, Math.floor(gameTime / 60) + 2);
            
            if (boss) {
                // Double all boss stats for the final challenge
                boss.health *= 2;
                boss.maxHealth *= 2;
                boss.damage *= 2;
                boss.moveSpeed *= 1.5; // Only 1.5x speed to keep it manageable
                boss.experienceValue *= 2;
                
                console.log(`Final wave: Spawned boss ${boss.name} with DOUBLED stats!`);
                console.log(`Health: ${boss.health}, Damage: ${boss.damage}, Speed: ${boss.moveSpeed}`);
                
                bosses.push(boss);
                
                // Visual effect
                addAnimatedEffect('explosion', pos.x, pos.y, 1000);
            } else {
                console.error(`Failed to create boss of type ${bossType}`);
            }
            
            index++;
        }
        
        // Add a special message
        console.log("FINAL CHALLENGE: All bosses have DOUBLED stats! Good luck!");
    }, 5000); // 5-second warning instead of 10
}

// Show a warning that a boss is approaching in 5 seconds
function showBossWarning(bossName) {
    // Create a boss warning element
    const warning = document.createElement('div');
    warning.className = 'boss-announcement warning';
    warning.innerHTML = `<h2>WARNING!</h2><p>${bossName} APPROACHING!</p><p>5 seconds remaining!</p>`;
    
    // Add to game screen
    const gameScreen = document.getElementById('game-screen');
    if (gameScreen) {
        gameScreen.appendChild(warning);
        
        // Add countdown
        let countdown = 5; // Changed from 10 to 5 seconds
        const countdownElement = document.createElement('div');
        countdownElement.className = 'countdown';
        countdownElement.textContent = countdown;
        warning.appendChild(countdownElement);
        
        // Track the last time we updated the countdown
        let lastUpdateTime = Date.now();
        
        // Update countdown only when game is not paused
        const countdownInterval = setInterval(() => {
            // Only update countdown if game is not paused
            if (!gamePaused) {
                const now = Date.now();
                const elapsed = now - lastUpdateTime;
                
                // If approximately 1 second has passed while not paused
                if (elapsed >= 1000) {
                    countdown--;
                    lastUpdateTime = now;
                    
                    if (countdown <= 0) {
                        clearInterval(countdownInterval);
                    } else {
                        countdownElement.textContent = countdown;
                    }
                }
            } else {
                // If game is paused, update the last update time to now
                // This prevents the countdown from jumping ahead when unpaused
                lastUpdateTime = Date.now();
            }
        }, 100); // Check more frequently to be responsive to pause state
        
        // Remove after 5 seconds of actual gameplay (not counting pause time)
        let remainingTime = 5000; // Changed from 10000 to 5000
        let lastCheckTime = Date.now();
        
        const removalInterval = setInterval(() => {
            const now = Date.now();
            
            // Only count down time if game is not paused
            if (!gamePaused) {
                const elapsed = now - lastCheckTime;
                remainingTime -= elapsed;
            }
            
            lastCheckTime = now;
            
            if (remainingTime <= 0) {
                clearInterval(countdownInterval);
                clearInterval(removalInterval);
                if (warning.parentNode) {
                    warning.parentNode.removeChild(warning);
                }
            }
        }, 100);
    }
}

// Show game completed message and end the game
function showGameCompletedMessage() {
    // Pause the game
    const previousState = gameState;
    gameState = GAME_STATE.PAUSED;
    
    // Create a summary of player's weapons and items
    let weaponsSummary = player.weapons.map(w => w.name || "Unknown weapon").join(", ");
    let itemsSummary = player.items
        .filter(i => i.type === ITEM_TYPES.PASSIVE)
        .map(i => `${i.name}${i.count > 1 ? ` x${i.count}` : ''}`)
        .join(", ");
    
    const messageElement = document.createElement('div');
    messageElement.className = 'game-completed-message';
    messageElement.innerHTML = `
        <h2>MAP COMPLETED!</h2>
        <p>Congratulations! You've defeated all the bosses!</p>
        <p>Time survived: ${formatTime(gameTime)}</p>
        <p>Level reached: ${player.level}</p>
        <p>Enemies defeated: ${enemiesDefeated}</p>
        <p>Weapons: ${weaponsSummary}</p>
        <p>Items: ${itemsSummary}</p>
        <button id="return-to-menu" class="game-over-button">Return to Menu</button>
    `;
    
    document.body.appendChild(messageElement);
    
    // Add event listener to the button
    document.getElementById('return-to-menu').addEventListener('click', () => {
        // Remove the message
        if (messageElement.parentNode) {
            messageElement.parentNode.removeChild(messageElement);
        }
        
        // Return to menu
        gameOver();
    });
}

// Update bosses
function updateBosses(deltaTime) {
    for (let i = bosses.length - 1; i >= 0; i--) {
        const boss = bosses[i];
        
        if (boss.active) {
            boss.update(deltaTime, player, enemies);
        } else {
            // Track defeated bosses
            if (!defeatedBosses.includes(boss.type)) {
                defeatedBosses.push(boss.type);
                console.log(`Boss ${boss.name} defeated! (${defeatedBosses.length}/${Object.keys(BOSS_TYPES).length})`);
            }
            
            // Remove inactive bosses
            bosses.splice(i, 1);
        }
    }
}

function showBossAnnouncement(bossName, preAnnounce = false) {
    // Create a boss announcement element
    const announcement = document.createElement('div');
    announcement.className = 'boss-announcement';
    announcement.innerHTML = `<h2>BOSS APPROACHING</h2><p>${bossName}</p>`;
    
    // Add to game screen
    const gameScreen = document.getElementById('game-screen');
    if (gameScreen) {
        gameScreen.appendChild(announcement);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (announcement.parentNode) {
                announcement.parentNode.removeChild(announcement);
            }
        }, 3000);
    }
}

// Game variables
let toxicPuddles = []; // Array to store toxic puddles
let bossAnnouncement = null;
let gameCompletedMessage = null;

// Initialize game
function initGame(playerType) {
    // Reset game state
    player = createPlayer(playerType);
    enemies = [];
    bosses = [];
    projectiles = [];
    pickups = [];
    effects = [];
    toxicPuddles = []; // Reset toxic puddles
    gameTime = 0;
    enemiesDefeated = 0;
    gameRunning = true;
    gamePaused = false; // Ensure game starts unpaused
    levelUpActive = false;
    itemChoices = [];
    bossAnnouncement = null;
    gameCompletedMessage = null;
    lastBossSpawnTime = 0;
    defeatedBosses = [];
    finalBossesSpawned = false;
    gameCompleted = false;
    enemySpawnTimer = 0;
    window.bossPreAnnounced = false;
    window.finalBossPreAnnounced = false;
    
    // Initialize player
    if (player && typeof player.init === 'function') {
        player.init();
    }
    
    // Set the player's onLevelUp callback to show the level up screen
    if (player) {
        player.onLevelUp = showLevelUpScreen;
        console.log("Set player's onLevelUp callback to showLevelUpScreen");
    }
    
    // Make game variables available globally for debugging
    window.player = player;
    window.enemies = enemies;
    window.bosses = bosses;
    window.projectiles = projectiles;
    window.pickups = pickups;
    window.effects = effects;
    window.toxicPuddles = toxicPuddles;
    window.gameTime = gameTime;
}

// Function to add a toxic puddle
function addToxicPuddle(x, y, damage, duration) {
    toxicPuddles.push({
        x,
        y,
        damage,
        radius: 30,
        creationTime: Date.now(),
        duration,
        alpha: 0.7, // Start with high opacity
        active: true
    });
}

// Make the function available globally
window.addToxicPuddle = addToxicPuddle;

// Update toxic puddles
function updateToxicPuddles(deltaTime) {
    for (let i = toxicPuddles.length - 1; i >= 0; i--) {
        const puddle = toxicPuddles[i];
        
        // Check if puddle has expired
        const age = Date.now() - puddle.creationTime;
        if (age >= puddle.duration) {
            toxicPuddles.splice(i, 1);
            continue;
        }
        
        // Fade out puddle over time
        puddle.alpha = 0.7 * (1 - age / puddle.duration);
        
        // Check for player collision with puddle
        if (player && player.active && !player.invulnerable) {
            const dist = distance(player.x, player.y, puddle.x, puddle.y);
            if (dist < puddle.radius + player.width / 4) {
                // Apply damage every 500ms while in puddle
                const now = Date.now();
                if (!puddle.lastDamageTime || now - puddle.lastDamageTime > 500) {
                    player.takeDamage(puddle.damage);
                    puddle.lastDamageTime = now;
                    
                    // Visual effect
                    try {
                        if (typeof addAnimatedEffect === 'function') {
                            addAnimatedEffect('hit', player.x, player.y, 300);
                        }
                    } catch (e) {
                        console.error('Error creating toxic hit effect:', e);
                    }
                }
            }
        }
    }
}

// Draw toxic puddles
function drawToxicPuddles(ctx) {
    for (const puddle of toxicPuddles) {
        ctx.save();
        ctx.globalAlpha = puddle.alpha;
        ctx.fillStyle = '#00ff00';
        ctx.beginPath();
        ctx.arc(puddle.x, puddle.y, puddle.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // Add some texture to the puddle
        ctx.globalAlpha = puddle.alpha * 0.5;
        ctx.fillStyle = '#33ff33';
        for (let i = 0; i < 5; i++) {
            const bubbleX = puddle.x + (Math.random() - 0.5) * puddle.radius * 1.5;
            const bubbleY = puddle.y + (Math.random() - 0.5) * puddle.radius * 1.5;
            const bubbleSize = 5 + Math.random() * 8;
            ctx.beginPath();
            ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}

// Draw pause overlay
function drawPauseOverlay(ctx) {
    // Semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Pause text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2 - 40);
    
    // Instructions
    ctx.font = '24px Arial';
    
    // Check if we're on mobile
    if (typeof isMobileDevice === 'function' && isMobileDevice()) {
        ctx.fillText('Tap the pause button to resume', canvas.width / 2, canvas.height / 2 + 40);
    } else {
        ctx.fillText('Press SPACE to resume', canvas.width / 2, canvas.height / 2 + 40);
    }
} 