// Items system for the game

// Item types
const ITEM_TYPES = {
    WEAPON: 'weapon',
    PASSIVE: 'passive',
    CONSUMABLE: 'consumable'
};

// Item rarity
const ITEM_RARITY = {
    COMMON: 'common',
    UNCOMMON: 'uncommon',
    RARE: 'rare',
    EPIC: 'epic',
    LEGENDARY: 'legendary'
};

// Item definitions
const ITEMS = {
    // Weapons
    sword: {
        name: 'Sword',
        description: 'A melee weapon that strikes in a wide arc',
        type: ITEM_TYPES.WEAPON,
        rarity: ITEM_RARITY.COMMON,
        sprite: 'sword',
        damage: 10,
        attackSpeed: 1.5,
        range: 80,
        knockback: 5,
        arcAttack: true,
        arcAngle: Math.PI / 2
    },
    
    axe: {
        name: 'Spinning Axe',
        description: 'Spins around the player, damaging enemies',
        type: ITEM_TYPES.WEAPON,
        rarity: ITEM_RARITY.EPIC,
        sprite: 'axe',
        damage: 15,
        attackSpeed: 1.0,
        range: 80,
        knockback: 10,
        rotationSpeed: 0.03, // Reduced from 0.1 to make it spin slower
        maxCount: 5 // Maximum number of this item the player can have
    },
    
    bow: {
        name: 'Auto Bow',
        description: 'Automatically fires arrows at nearby enemies',
        type: ITEM_TYPES.WEAPON,
        rarity: ITEM_RARITY.UNCOMMON,
        sprite: 'bow',
        damage: 8,
        attackSpeed: 1.2,
        range: 300,
        knockback: 3,
        projectileSpeed: 5,
        projectileSprite: 'arrow',
        maxCount: 5 // Maximum number of this item the player can have
    },
    
    wand: {
        name: 'Magic Wand',
        description: 'Fires magical bolts at enemies',
        type: ITEM_TYPES.WEAPON,
        rarity: ITEM_RARITY.UNCOMMON,
        sprite: 'wand',
        damage: 12,
        attackSpeed: 1.0,
        range: 200,
        knockback: 2,
        projectileSpeed: 4,
        projectileSprite: 'fireball',
        maxCount: 5 // Maximum number of this item the player can have
    },
    
    laserGun: {
        name: 'Laser Gun',
        description: 'Fires a continuous laser beam at nearby enemies',
        type: ITEM_TYPES.WEAPON,
        rarity: ITEM_RARITY.UNCOMMON,
        sprite: 'laserBeam',
        damage: 5,
        attackSpeed: 0.3,
        range: 250,
        knockback: 1,
        continuous: true
    },
    
    // Passive items
    speedBoots: {
        name: 'Speed Boots',
        description: 'Increases movement speed',
        type: ITEM_TYPES.PASSIVE,
        rarity: ITEM_RARITY.COMMON,
        sprite: 'boots',
        effect: {
            moveSpeed: 1.1
        }
    },
    
    shield: {
        name: 'Shield',
        description: 'Reduces damage taken',
        type: ITEM_TYPES.PASSIVE,
        rarity: ITEM_RARITY.UNCOMMON,
        sprite: 'shield',
        maxCount: 5, // Maximum of 5 shields can be collected
        effect: {
            damageReduction: 0.075 // Reduced from 0.15 to 0.075 (half)
        }
    },
    
    amulet: {
        name: 'Amulet of Power',
        description: 'Increases damage dealt',
        type: ITEM_TYPES.PASSIVE,
        rarity: ITEM_RARITY.UNCOMMON,
        sprite: 'amulet',
        effect: {
            damageMult: 1.2
        }
    },
    
    magnet: {
        name: 'Experience Magnet',
        description: 'Attracts experience gems from further away',
        type: ITEM_TYPES.PASSIVE,
        rarity: ITEM_RARITY.UNCOMMON,
        sprite: 'magnet',
        effect: {
            pickupRange: 1.5
        }
    },
    
    ring: {
        name: 'Ring of Haste',
        description: 'Increases attack speed',
        type: ITEM_TYPES.PASSIVE,
        rarity: ITEM_RARITY.EPIC,
        sprite: 'ring',
        effect: {
            attackSpeedMult: 1.25
        }
    },
    
    crown: {
        name: 'Crown of Experience',
        description: 'Increases experience gained',
        type: ITEM_TYPES.PASSIVE,
        rarity: ITEM_RARITY.RARE,
        sprite: 'crown',
        effect: {
            expMult: 1.3
        }
    },
    
    // Consumables
    healthPotion: {
        name: 'Health Potion',
        description: 'Restores 20% of max health',
        type: ITEM_TYPES.CONSUMABLE,
        rarity: ITEM_RARITY.COMMON,
        sprite: 'healthPotion',
        effect: {
            healthRestorePercent: 0.2 // 20% of max health
        }
    },
    
    // Experience gem
    experienceGem: {
        name: 'Experience Gem',
        description: 'Grants experience',
        type: ITEM_TYPES.CONSUMABLE,
        rarity: ITEM_RARITY.COMMON,
        sprite: 'experienceGem',
        effect: {
            experience: 5 // Base experience value
        }
    }
};

// Create a pickup item in the game world
function createPickup(type, x, y, value = null) {
    const item = ITEMS[type];
    if (!item) return null;
    
    // Create a copy of the item
    const itemCopy = { ...item };
    
    // If a value is provided and it's an experience gem, update its value
    if (type === 'experienceGem' && value !== null) {
        itemCopy.effect = { ...itemCopy.effect, experience: value };
    }
    
    return {
        type,
        x,
        y,
        width: type === 'experienceGem' ? SPRITE_SIZE * 0.35 : SPRITE_SIZE * 0.7,
        height: type === 'experienceGem' ? SPRITE_SIZE * 0.35 : SPRITE_SIZE * 0.7,
        item: itemCopy,
        collected: false,
        
        update(player, deltaTime) {
            // Check if player is close enough to pick up
            if (!player) return false;
            
            // Ensure pickupRange has a default value
            const pickupRange = (player.pickupRange !== undefined) ? player.pickupRange : 50;
            const dist = distance(player.x, player.y, this.x, this.y);
            
            // Determine attraction range based on item type
            let attractionRange = pickupRange * 2;
            let attractionSpeed = 2;
            
            // Experience gems have a smaller attraction range to make them more challenging to collect
            if (this.type === 'experienceGem') {
                attractionRange = pickupRange * 1.2; // Reduced from 2x to 1.2x
                attractionSpeed = 1.5; // Slightly slower movement
            }
            
            // Magnet effect - move towards player if within range
            if (dist < attractionRange) {
                const angle = getAngle(this.x, this.y, player.x, player.y);
                const speed = attractionSpeed + (attractionRange - dist) / 20;
                
                this.x += Math.cos(angle) * speed;
                this.y += Math.sin(angle) * speed;
            }
            
            // Check for collision with player
            if (dist < pickupRange * 0.5) {
                this.collected = true;
                return true;
            }
            
            return false;
        },
        
        draw(ctx) {
            if (this.collected) return;
            
            // Draw pickup sprite
            const sprite = sprites[this.item.sprite] || sprites.healthPotion;
            
            // Special case for experience gems - use a different color
            if (this.type === 'experienceGem') {
                ctx.fillStyle = '#55aaff';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
                ctx.fill();
                
                // Add a glow effect
                ctx.fillStyle = 'rgba(85, 170, 255, 0.3)';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.width * 0.8, 0, Math.PI * 2);
                ctx.fill();
                
                return;
            }
            
            drawSprite(
                ctx,
                sprite,
                this.x - this.width / 2,
                this.y - this.height / 2,
                this.width,
                this.height
            );
        }
    };
}

// Create an experience gem pickup
function createExperienceGem(x, y, value) {
    return createPickup('experienceGem', x, y, value);
}

// Apply passive item effects to player
function applyPassiveItems(player) {
    console.log('Applying passive item effects');
    
    // Log initial stats
    console.log(`BEFORE applying effects - moveSpeed: ${player.moveSpeed}, moveSpeedMultiplier: ${player.moveSpeedMultiplier}, attackSpeedMultiplier: ${player.attackSpeedMultiplier}`);
    
    // Initialize base stats if not defined
    if (!player.baseStats) {
        console.error('Player baseStats is undefined, initializing default values');
        player.baseStats = {
            moveSpeed: player.moveSpeed || 3,
            pickupRange: player.pickupRange || 50,
            health: player.maxHealth || 100,
            attackSpeed: 1.0 // Add default attack speed
        };
    }
    
    // Store old multipliers to detect changes
    const oldAttackSpeedMultiplier = player.attackSpeedMultiplier || 1;
    const oldMoveSpeedMultiplier = player.moveSpeedMultiplier || 1;
    
    // Reset to base stats with fallbacks
    player.moveSpeed = player.baseStats.moveSpeed || 3;
    player.moveSpeedMultiplier = 1.0; // Reset move speed multiplier
    player.damageMultiplier = 1.0;
    player.attackSpeedMultiplier = 1.0;
    player.damageReduction = 0;
    player.pickupRange = player.baseStats.pickupRange || 50;
    player.expMultiplier = 1.0;
    
    console.log(`AFTER RESET - moveSpeed: ${player.moveSpeed}, moveSpeedMultiplier: ${player.moveSpeedMultiplier}, attackSpeedMultiplier: ${player.attackSpeedMultiplier}`);
    
    // Apply effects from all passive items
    if (player.items && Array.isArray(player.items)) {
        player.items.forEach(item => {
            if (item && item.type === ITEM_TYPES.PASSIVE && item.effect) {
                // Get the count (default to 1 if not specified)
                const count = item.count || 1;
                console.log(`Applying effect from ${item.name} (count: ${count})`);
                
                // Apply effects based on count
                if (item.effect.moveSpeed) {
                    const oldMoveSpeed = player.moveSpeedMultiplier;
                    // For multiplicative effects, apply multiple times
                    for (let i = 0; i < count; i++) {
                        player.moveSpeedMultiplier *= item.effect.moveSpeed;
                    }
                    console.log(`Applied moveSpeed effect: ${oldMoveSpeed.toFixed(3)} -> ${player.moveSpeedMultiplier.toFixed(3)} (${item.effect.moveSpeed} x ${count})`);
                }
                
                if (item.effect.damageMult) {
                    // For multiplicative effects, apply multiple times
                    for (let i = 0; i < count; i++) {
                        player.damageMultiplier *= item.effect.damageMult;
                    }
                }
                
                if (item.effect.attackSpeedMult) {
                    // For multiplicative effects, apply multiple times
                    for (let i = 0; i < count; i++) {
                        player.attackSpeedMultiplier *= item.effect.attackSpeedMult;
                    }
                }
                
                if (item.effect.damageReduction) {
                    // For additive effects, multiply by count
                    player.damageReduction += item.effect.damageReduction * count;
                }
                
                if (item.effect.pickupRange) {
                    // For multiplicative effects, apply multiple times
                    for (let i = 0; i < count; i++) {
                        player.pickupRange *= item.effect.pickupRange;
                    }
                }
                
                if (item.effect.expMult) {
                    // For multiplicative effects, apply multiple times
                    for (let i = 0; i < count; i++) {
                        player.expMultiplier *= item.effect.expMult;
                    }
                }
            }
        });
    }
    
    // Cap damage reduction at 37.5% (5 shields at 7.5% each)
    player.damageReduction = Math.min(player.damageReduction, 0.375);
    
    // If attack speed changed, update all weapons
    if (player.attackSpeedMultiplier !== oldAttackSpeedMultiplier && typeof player.updateWeaponSpeeds === 'function') {
        console.log(`Attack speed multiplier changed: ${oldAttackSpeedMultiplier} -> ${player.attackSpeedMultiplier}`);
        player.updateWeaponSpeeds();
    }
}

// Apply consumable item effect
function useConsumable(player, item) {
    if (!player || !item || item.type !== ITEM_TYPES.CONSUMABLE) {
        console.warn('Invalid consumable item');
        return;
    }
    
    console.log(`Using consumable: ${item.name}`);
    
    if (item.effect) {
        // Health restoration
        if (item.effect.healthRestorePercent) {
            const amount = player.maxHealth * item.effect.healthRestorePercent;
            player.health = Math.min(player.health + amount, player.maxHealth);
            console.log(`Restored ${amount} health. Player health: ${player.health}/${player.maxHealth}`);
            
            // Create healing effect
            try {
                if (typeof addAnimatedEffect === 'function') {
                    addAnimatedEffect('heal', player.x, player.y, 500);
                }
            } catch (e) {
                console.error('Error creating healing effect:', e);
            }
        }
        
        // Experience gain
        if (item.effect.experience) {
            const amount = item.effect.experience;
            player.addExperience(amount);
            console.log(`Gained ${amount} experience from gem`);
            
            // Create experience effect
            try {
                if (typeof addAnimatedEffect === 'function') {
                    addAnimatedEffect('sparkle', player.x, player.y, 300);
                }
            } catch (e) {
                console.error('Error creating experience effect:', e);
            }
        }
    }
} 