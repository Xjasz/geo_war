// Create hit effect
try {
    if (typeof addAnimatedEffect === 'function') {
        addAnimatedEffect('sparkle', enemy.x, enemy.y);
    } else {
        console.warn('addAnimatedEffect is not a function');
    }
} catch (e) {
    console.error('Error creating hit effect:', e);
} 