# Geo War

A fast-paced, top-down roguelike action game inspired by games like Vampire Survivors and Geometry Wars. Battle through waves of enemies, collect power-ups, and defeat challenging bosses as you try to survive as long as possible.

## How to Play

1. Open `index.html` in a modern web browser (Chrome, Firefox, Edge, etc.)
2. Select your character:
   - **Knight**: High health, slow movement, melee specialist with a sword
   - **Archer**: Moderate health, fast movement, ranged attacks with a bow
   - **Mage**: Low health, moderate movement, powerful magic attacks with a wand
3. Click "Start Game" to begin
4. Use arrow keys or WASD to move your character
5. Automatically attack nearby enemies with your weapon
6. Collect experience gems to level up and items to enhance your character
7. Survive as long as possible!
8. Defeat powerful bosses that spawn periodically and an ultimate boss wave at the end

## Game Features

### Characters
Each character has unique stats and starts with a different weapon:
- **Knight**: High health (50), slow movement speed (0.45), medium pickup range (20)
- **Archer**: Medium health (35), high movement speed (1.3), large pickup range (25)
- **Mage**: Low health (25), medium movement speed (1.1), very large pickup range (30)

### Progression System
- Level up by collecting experience gems from defeated enemies
- Automatic stat improvements when leveling up
- Stat caps prevent overpowered builds (max health: 1000, speed: 5, damage: 10x, etc.)

### Weapons
- **Sword**: Basic melee weapon with short range
- **Spinning Axe**: Rotates around the player, damaging enemies in its path
- **Auto Bow**: Automatically fires arrows at nearby enemies
- **Magic Wand**: Shoots magical bolts that can pierce through multiple enemies
- **Laser Gun**: Fires a continuous laser beam at the closest enemy

### Items
- **Speed Boots**: Increases movement speed
- **Shield**: Reduces damage taken
- **Amulet of Power**: Increases damage dealt
- **Experience Magnet**: Attracts experience gems from further away
- **Ring of Haste**: Increases attack speed
- **Crown of Experience**: Increases experience gained
- **Health Potion**: Restores health

### Boss System
The game features a challenging boss system:
- Bosses spawn 5 levels above the player's level
- Bosses are 2x larger with impressive auras and visual effects
- Boss health is 5x higher than standard bosses
- Six unique boss types with special abilities:
  - **Necromancer**: Summons zombie minions and fires death bolts
  - **Death Knight**: Performs whirlwind attacks and charges at the player
  - **Vampire Lord**: Transforms into bats and drains health from the player
  - **Lich**: Casts frost nova and summons skeleton warriors
  - **Demon**: Breathes fire and smashes the ground, creating shockwaves
  - **Assassin Lord**: Creates shadow clones, teleports around the arena, and becomes invisible
- Each boss has unique mechanics and attack patterns
- A final boss wave spawns all bosses simultaneously with doubled stats

### Enemy Types
- **Zombie**: Slow movement, high health
- **Skeleton**: Medium movement, medium health
- **Ghost**: Fast movement
- **Bat**: Very fast movement, low health
- **Vampire**
- **Archer**: Ranged, shoots arrows
- **Mage**: Stationary, shoots fireballs
- **Multiplier**: Splits into more copies if not killed quickly
- **Assassin**: Stealths and unstealths when attacking
- **Berserker**: Gets stronger as its health drops
- **Bomber**: Rushes the player and explodes

## Technical Details

The game is built using vanilla JavaScript and HTML5 Canvas, with no external dependencies. It features:

- Object-oriented design pattern
- Sprite-based rendering system
- Efficient collision detection
- Particle effects and visual feedback
- Dynamic difficulty scaling
- Boss AI with unique attack patterns
- Balanced character progression

## Recent Updates

- **Character Balance**: Adjusted base stats and growth rates for all characters
- **Stat Caps**: Implemented maximum values for health, damage, speed, and other stats
- **Boss Improvements**: Bosses now have glowing auras, larger size, and increased health
- **New Boss**: Added the Assassin Lord with stealth mechanics and shadow clones
- **Final Wave**: Enhanced the final boss wave to include all boss types
- **Visual Improvements**: Added more visual effects, boss name displays, and health bars

## Customization

The game draws simple coloured circles as placeholder sprites. They are generated on an offscreen canvas by `createSprite` in `js/sprites.js`; there is no image loading yet, so replace those definitions to change the look.

### Controls
- WASD / arrow keys: move (touch joystick on phones)
- Space: pause / resume
- F9: toggle debug mode
- R (debug mode only): reset player stats

## Getting Started (Development)

1. Clone this repository
2. Open `index.html` in your browser to run the game
3. Modify the JavaScript files in the `js` folder to customize the game

## License

This project is open source and available under the MIT License. 