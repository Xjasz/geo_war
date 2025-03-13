// Main entry point for the game

// DOM elements
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const startGameButton = document.getElementById('start-game');
const playAgainButton = document.getElementById('play-again');
const characterElements = document.querySelectorAll('.character');

// Game loop variables
let lastTime = 0;
let animationFrameId = null;
let selectedCharacter = 'knight'; // Default character
let lastFrameTime = 0;
let hasPlayedBefore = false;

// Global variable to track resume buffer state
let resumeBufferActive = false;
let resumeBufferTime = 0;
const RESUME_BUFFER_DURATION = 1000; // 1 second buffer

// Initialize the application
async function init() {
    console.log('Initializing game...');
    
    // Make sure GAME_STATE is defined
    if (typeof GAME_STATE === 'undefined') {
        console.log('GAME_STATE not defined yet, waiting for game.js to load');
        // Wait a moment for game.js to load and define GAME_STATE
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check again
        if (typeof GAME_STATE === 'undefined') {
            console.error('GAME_STATE is still not defined. Make sure game.js is loaded before main.js');
            // Define a fallback
            window.GAME_STATE = {
                MENU: 'menu',
                PLAYING: 'playing',
                PAUSED: 'paused',
                GAME_OVER: 'gameOver',
                LEVEL_UP: 'levelUp'
            };
        }
    }
    
    // Initialize game state
    gameState = GAME_STATE.MENU;
    
    // Initialize keys object (don't reassign the constant)
    // Clear any existing keys
    Object.keys(keys).forEach(key => delete keys[key]);
    
    // Add directional properties
    keys.up = false;
    keys.down = false;
    keys.left = false;
    keys.right = false;
    
    // Initialize debug mode
    window.DEBUG_MODE = false;
    
    // Load sprites
    try {
        await loadAllSprites();
        console.log('Placeholder sprites initialized');
    } catch (error) {
        console.error('Failed to initialize sprites:', error);
        // Continue anyway since we're using placeholder sprites
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Show start screen
    showStartScreen();
    
    console.log('Game initialized successfully');
}

// Helper function to toggle pause state
function togglePauseState() {
    if (!gameRunning) return;
    
    if (!gamePaused) {
        // Game is currently running, pause it immediately
        gamePaused = true;
        
        // Show pause indicator
        const pauseIndicator = document.querySelector('.pause-indicator') || document.createElement('div');
        pauseIndicator.className = 'pause-indicator';
        pauseIndicator.textContent = 'PAUSED';
        if (!pauseIndicator.parentNode) {
            document.querySelector('.game-container').appendChild(pauseIndicator);
        }
        
        console.log('Game paused');
    } else {
        // Game is currently paused, start the resume buffer
        resumeBufferActive = true;
        resumeBufferTime = 0;
        
        // Show a countdown message
        const pauseIndicator = document.querySelector('.pause-indicator') || document.createElement('div');
        pauseIndicator.className = 'pause-indicator';
        pauseIndicator.textContent = 'Resuming in 1...';
        if (!pauseIndicator.parentNode) {
            document.querySelector('.game-container').appendChild(pauseIndicator);
        }
        
        console.log('Starting resume buffer countdown');
    }
}

// Set up event listeners
function setupEventListeners() {
    // Character selection
    const characters = document.querySelectorAll('.character');
    characters.forEach(char => {
        char.addEventListener('click', () => {
            characters.forEach(c => c.classList.remove('selected'));
            char.classList.add('selected');
            selectedCharacter = char.dataset.character;
        });
    });
    
    // Start game button
    document.getElementById('start-game').addEventListener('click', () => {
        if (selectedCharacter) {
            startGame();
        } else {
            alert('Please select a character first!');
        }
    });
    
    // Play again button
    document.getElementById('play-again').addEventListener('click', () => {
        // Hide game over screen
        document.getElementById('game-over-screen').classList.add('hidden');
        
        // Start a new game directly instead of showing the start screen
        startGame();
    });
    
    // Debug toggle
    const debugToggle = document.getElementById('debug-toggle');
    debugToggle.addEventListener('change', () => {
        window.DEBUG_MODE = debugToggle.checked;
        console.log(`Debug mode ${window.DEBUG_MODE ? 'enabled' : 'disabled'}`);
    });
    
    // Keyboard controls
    window.addEventListener('keydown', (e) => {
        keys[e.key] = true;
        
        // Update directional keys
        updateDirectionalKeys();
        
        // Toggle pause with space bar
        if (e.key === ' ' && gameRunning) {
            // Prevent default space bar behavior (scrolling)
            e.preventDefault();
            
            // Toggle pause state
            togglePauseState();
        }
        
        // Toggle debug mode with F9 key
        if (e.key === 'F9') {
            window.DEBUG_MODE = !window.DEBUG_MODE;
            console.log(`Debug mode ${window.DEBUG_MODE ? 'enabled' : 'disabled'}`);
            
            // Update checkbox
            const debugToggle = document.getElementById('debug-toggle');
            if (debugToggle) {
                debugToggle.checked = window.DEBUG_MODE;
            }
        }
        
        // Reset player stats with R key (only in debug mode)
        if ((e.key === 'r' || e.key === 'R') && window.DEBUG_MODE && player) {
            console.log('Manual stats reset triggered');
            player.resetStats();
        }
    });
    
    window.addEventListener('keyup', (e) => {
        keys[e.key] = false;
        
        // Update directional keys
        updateDirectionalKeys();
    });
    
    // Helper function to update directional keys
    function updateDirectionalKeys() {
        keys.up = keys['ArrowUp'] || keys['w'] || keys['W'];
        keys.down = keys['ArrowDown'] || keys['s'] || keys['S'];
        keys.left = keys['ArrowLeft'] || keys['a'] || keys['A'];
        keys.right = keys['ArrowRight'] || keys['d'] || keys['D'];
    }
    
    // Touch controls for mobile devices
    if (isMobileDevice()) {
        const joystickArea = document.getElementById('joystick-area');
        const joystick = document.getElementById('joystick');
        const pauseButton = document.getElementById('pause-button');
        const gameCanvas = document.getElementById('gameCanvas');
        
        // Show touch controls on mobile
        document.getElementById('touch-controls').style.display = 'block';
        
        // Variables to track joystick state
        let joystickActive = false;
        let joystickStartX = 0;
        let joystickStartY = 0;
        let joystickCurrentX = 0;
        let joystickCurrentY = 0;
        let touchStartX = 0;
        let touchStartY = 0;
        
        // Add specific touch handler for the joystick area itself
        joystickArea.addEventListener('touchstart', function(e) {
            // Don't activate joystick if level up screen is active
            if (gameState === GAME_STATE.LEVEL_UP || levelUpActive) {
                return;
            }
            
            e.preventDefault();
            
            joystickActive = true;
            
            // Get the touch position
            const touch = e.touches[0];
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            
            // Set the joystick center position
            joystickStartX = touchStartX;
            joystickStartY = touchStartY;
            joystickCurrentX = touchStartX;
            joystickCurrentY = touchStartY;
            
            // Reset joystick position
            joystick.style.transform = 'translate(-50%, -50%)';
            
            // Make joystick fully visible
            joystickArea.style.opacity = '0.7';
        });
        
        // Allow touch anywhere on the game canvas for movement
        gameCanvas.addEventListener('touchstart', function(e) {
            // Don't activate joystick if level up screen is active
            if (gameState === GAME_STATE.LEVEL_UP || levelUpActive) {
                // Allow the touch to pass through for item selection
                return;
            }
            
            e.preventDefault();
            
            // Don't activate if touching the pause button
            const touch = e.touches[0];
            const pauseRect = pauseButton.getBoundingClientRect();
            if (touch.clientX >= pauseRect.left && touch.clientX <= pauseRect.right &&
                touch.clientY >= pauseRect.top && touch.clientY <= pauseRect.bottom) {
                return;
            }
            
            // Don't activate if we're already handling a touch on the joystick area
            if (joystickActive) {
                return;
            }
            
            joystickActive = true;
            
            // Store the initial touch position
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            
            // Move the joystick to the touch position
            const joystickAreaRect = joystickArea.getBoundingClientRect();
            joystickArea.style.left = (touchStartX - joystickAreaRect.width / 2) + 'px';
            joystickArea.style.bottom = (window.innerHeight - touchStartY - joystickAreaRect.height / 2) + 'px';
            
            // Set the joystick center position
            joystickStartX = touchStartX;
            joystickStartY = touchStartY;
            joystickCurrentX = touchStartX;
            joystickCurrentY = touchStartY;
            
            // Reset joystick position
            joystick.style.transform = 'translate(-50%, -50%)';
            
            // Make joystick visible
            joystickArea.style.opacity = '0.7';
        });
        
        // Joystick touch move
        document.addEventListener('touchmove', function(e) {
            // Don't process touch movement if level up screen is active
            if (gameState === GAME_STATE.LEVEL_UP || levelUpActive) {
                return;
            }
            
            if (!joystickActive) return;
            e.preventDefault();
            
            const touch = e.touches[0];
            joystickCurrentX = touch.clientX;
            joystickCurrentY = touch.clientY;
            
            // Update joystick position
            updateJoystickPosition();
            
            // Update movement keys based on joystick position
            updateMovementFromJoystick();
        });
        
        // Joystick touch end
        document.addEventListener('touchend', function(e) {
            if (!joystickActive) return;
            
            joystickActive = false;
            
            // Make joystick semi-transparent but still visible
            joystickArea.style.opacity = '0.3';
            
            // Reset joystick position
            joystick.style.transform = 'translate(-50%, -50%)';
            
            // Reset movement keys
            keys.up = false;
            keys.down = false;
            keys.left = false;
            keys.right = false;
            
            // Reset player movement intensity
            if (player) {
                player.movementIntensity = 0;
            }
        });
        
        // Pause button touch
        pauseButton.addEventListener('touchstart', function(e) {
            e.preventDefault();
            
            // Toggle pause state
            togglePauseState();
        });
        
        // Helper function to update joystick position
        function updateJoystickPosition() {
            // Calculate distance from center
            let dx = joystickCurrentX - joystickStartX;
            let dy = joystickCurrentY - joystickStartY;
            
            // Limit joystick movement to the area radius
            const maxDistance = joystickArea.clientWidth / 2 - joystick.offsetWidth / 2;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > maxDistance) {
                const angle = Math.atan2(dy, dx);
                dx = Math.cos(angle) * maxDistance;
                dy = Math.sin(angle) * maxDistance;
            }
            
            // Update joystick position
            joystick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        }
        
        // Helper function to update movement keys based on joystick position
        function updateMovementFromJoystick() {
            // Calculate distance from center
            const dx = joystickCurrentX - joystickStartX;
            const dy = joystickCurrentY - joystickStartY;
            
            // Increase sensitivity for smaller joystick
            const threshold = 5; // Reduced threshold for more sensitivity
            
            // Update movement keys based on joystick position
            keys.up = dy < -threshold;
            keys.down = dy > threshold;
            keys.left = dx < -threshold;
            keys.right = dx > threshold;
            
            // Calculate movement intensity for analog-like control
            if (player) {
                // Normalize the joystick values to create an intensity factor (0-1)
                const maxDistance = joystickArea.clientWidth / 2;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Reduce the intensity for mobile to make movement slower
                // Apply a scaling factor of 0.7 to make movement more manageable
                const intensity = Math.min(distance / maxDistance, 1) * 0.7;
                
                // Store the intensity for use in player movement
                player.movementIntensity = intensity;
                
                // Store the angle for player facing direction
                if (distance > threshold) {
                    player.facingAngle = Math.atan2(dy, dx);
                }
            }
        }
    }
    
    // Level up item selection
    const gameCanvas = document.getElementById('gameCanvas');
    if (gameCanvas) {
        // Mouse click for level up
        gameCanvas.addEventListener('click', (e) => {
            if (levelUpActive || gameState === GAME_STATE.LEVEL_UP) {
                const rect = gameCanvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                handleLevelUpClick(x, y);
            }
        });
        
        // Touch for level up (separate from joystick controls)
        gameCanvas.addEventListener('touchend', (e) => {
            if (levelUpActive || gameState === GAME_STATE.LEVEL_UP) {
                e.preventDefault();
                const rect = gameCanvas.getBoundingClientRect();
                const touch = e.changedTouches[0];
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;
                console.log(`Level up touch at (${x}, ${y})`);
                handleLevelUpClick(x, y);
            }
        });
    }
    
    // Handle window resize
    window.addEventListener('resize', handleResize);
    handleResize();
}

// Handle window resize
function handleResize() {
    const gameContainer = document.querySelector('.game-container');
    const canvas = document.getElementById('gameCanvas');
    
    if (!gameContainer || !canvas) return;
    
    // Get the dimensions of the game container
    const containerWidth = gameContainer.clientWidth;
    const containerHeight = gameContainer.clientHeight;
    
    // Set canvas dimensions to match container
    canvas.width = containerWidth;
    canvas.height = containerHeight;
    
    // Update game dimensions
    gameWidth = canvas.width;
    gameHeight = canvas.height;
    
    // Update global window variables
    window.gameWidth = gameWidth;
    window.gameHeight = gameHeight;
    
    // Update enemy boundaries
    if (typeof updateEnemyBoundaries === 'function') {
        updateEnemyBoundaries(gameWidth, gameHeight);
    }
    
    // Scale player size for mobile
    if (isMobileDevice()) {
        // Scale down player size by 20% for better mobile experience
        if (player) {
            player.width = SPRITE_SIZE * 0.8;
            player.height = SPRITE_SIZE * 0.8;
            
            // Increase pickup range by 20% for easier item collection on mobile
            player.pickupRange = 100 * 1.2;
            
            // Reduce movement speed by 15% for better control on mobile
            if (!player.mobileSpeedAdjusted) {
                player.moveSpeed = player.moveSpeed * 0.85;
                player.mobileSpeedAdjusted = true;
            }
        }
    }
    
    console.log(`Canvas resized to ${gameWidth}x${gameHeight}`);
}

// Helper function to detect mobile devices
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Show the start screen
function showStartScreen() {
    // Hide other screens
    document.getElementById('game-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    
    // Show start screen
    document.getElementById('start-screen').classList.remove('hidden');
    
    // Reset game state
    gameState = GAME_STATE.MENU;
    
    // Select default character
    characterElements.forEach(el => {
        if (el.dataset.character === selectedCharacter) {
            el.classList.add('selected');
        }
    });
}

// Start the game
function startGame() {
    // Hide start screen
    document.getElementById('start-screen').classList.add('hidden');
    
    // Show game screen
    document.getElementById('game-screen').classList.remove('hidden');
    
    // Get selected character
    const selectedCharacter = document.querySelector('.character.selected').dataset.character;
    console.log(`Starting game with character: ${selectedCharacter}`);
    
    // Initialize game
    initGame(selectedCharacter);
    
    // Set game state
    gameState = GAME_STATE.PLAYING;
    gameRunning = true;
    
    // Get canvas and context
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    // Handle initial resize
    handleResize();
    
    // Ensure enemy boundaries are updated
    if (typeof updateEnemyBoundaries === 'function') {
        updateEnemyBoundaries(gameWidth, gameHeight);
    }
    
    // Start game loop
    lastFrameTime = performance.now();
    requestAnimationFrame(gameLoop);
    
    // Show touch controls on mobile
    if (isMobileDevice()) {
        document.getElementById('touch-controls').style.display = 'block';
    }
    
    // Track that the player has played before
    hasPlayedBefore = true;
}

// Game loop
function gameLoop(timestamp) {
    // Calculate delta time
    const deltaTime = timestamp - lastFrameTime;
    lastFrameTime = timestamp;
    
    // Handle resume buffer countdown if active
    if (resumeBufferActive) {
        resumeBufferTime += deltaTime;
        
        // Update countdown display
        const pauseIndicator = document.querySelector('.pause-indicator');
        if (pauseIndicator) {
            const remainingTime = Math.ceil((RESUME_BUFFER_DURATION - resumeBufferTime) / 1000);
            pauseIndicator.textContent = `Resuming in ${remainingTime}...`;
        }
        
        // Check if buffer time has elapsed
        if (resumeBufferTime >= RESUME_BUFFER_DURATION) {
            resumeBufferActive = false;
            gamePaused = false;
            
            // Remove pause indicator
            if (pauseIndicator && pauseIndicator.parentNode) {
                pauseIndicator.parentNode.removeChild(pauseIndicator);
            }
            
            console.log('Game resumed after buffer');
        }
        
        // Continue the game loop
        requestAnimationFrame(gameLoop);
        return;
    }
    
    // Skip update if game is paused
    if (gamePaused) {
        requestAnimationFrame(gameLoop);
        return;
    }
    
    // Update game state
    if (gameState === GAME_STATE.PLAYING) {
        // Update game
        updateGame(deltaTime);
        
        // Render game
        renderGame(ctx);
    }
    
    // Continue game loop
    window.gameLoopId = requestAnimationFrame(gameLoop);
}

// Initialize the game when the page loads
window.addEventListener('load', init); 