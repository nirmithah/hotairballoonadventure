// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const levelCompleteElement = document.getElementById('levelComplete');
const gameOverPopup = document.getElementById('gameOverPopup');
const playAgainBtn = document.getElementById('playAgainBtn');
const continueBtn = document.getElementById('continueBtn');
const notEnoughCoinsElement = document.getElementById('notEnoughCoins');
const levelInfoElement = document.getElementById('levelInfo');
const progressElement = document.getElementById('progress');
const coinsElement = document.getElementById('coins');
const totalCoinsElement = document.getElementById('totalCoins');
const levelSelectionElement = document.getElementById('levelSelection');
const gameScreenElement = document.getElementById('gameScreen');
const levelButtonsElement = document.getElementById('levelButtons');
const backToMenuButton = document.getElementById('backToMenu');

// Level definitions
const levels = [
    {
        name: "Level 1",
        pipeSpeed: 2,
        pipeGap: 180,
        pipeSpawnInterval: 140,
        totalPipes: 5,
        description: "Easy - Pass 5 pipes"
    },
    {
        name: "Level 2",
        pipeSpeed: 2.5,
        pipeGap: 160,
        pipeSpawnInterval: 130,
        totalPipes: 8,
        description: "Medium - Pass 8 pipes"
    },
    {
        name: "Level 3",
        pipeSpeed: 3,
        pipeGap: 150,
        pipeSpawnInterval: 120,
        totalPipes: 12,
        description: "Hard - Pass 12 pipes"
    },
    {
        name: "Level 4",
        pipeSpeed: 3.5,
        pipeGap: 140,
        pipeSpawnInterval: 110,
        totalPipes: 18,
        description: "Very Hard - Pass 18 pipes"
    },
    {
        name: "Level 5",
        pipeSpeed: 4,
        pipeGap: 130,
        pipeSpawnInterval: 100,
        totalPipes: 25,
        description: "Expert - Pass 25 pipes"
    },
    {
        name: "Level 6",
        pipeSpeed: 4.5,
        pipeGap: 120,
        pipeSpawnInterval: 90,
        totalPipes: 35,
        description: "Master - Pass 35 pipes"
    }
];

// Game state
let gameState = 'menu'; // 'menu', 'playing', 'gameOver', 'levelComplete'
let score = 0;
let currentLevel = null;
let currentLevelIndex = 0;

// Level settings (will be set based on selected level)
let pipeWidth = 60;
let pipeGap = 150;
let pipeSpeed = 3;
let pipeSpawnInterval = 120;
let totalPipes = 0;
let pipesSpawned = 0;
let finishLineX = null;

// Bird properties
const bird = {
    x: 50,
    y: canvas.height / 2,
    width: 30,
    height: 30,
    velocity: 0,
    gravity: 0.25,
    jumpStrength: -5,
    color: '#FFD700'
};

// Pipes array
const pipes = [];
let pipeSpawnTimer = 0;

// Coins array
const coins = [];
let coinSpawnTimer = 0;
const coinSpawnInterval = 80; // Spawn coins more frequently than pipes

// LocalStorage functions
function getUnlockedLevels() {
    const unlocked = localStorage.getItem('unlockedLevels');
    return unlocked ? JSON.parse(unlocked) : [0]; // Level 0 (first level) is always unlocked
}

function unlockLevel(levelIndex) {
    const unlocked = getUnlockedLevels();
    if (!unlocked.includes(levelIndex) && levelIndex < levels.length) {
        unlocked.push(levelIndex);
        localStorage.setItem('unlockedLevels', JSON.stringify(unlocked));
    }
}

function isLevelUnlocked(levelIndex) {
    return getUnlockedLevels().includes(levelIndex);
}

function markLevelCompleted(levelIndex) {
    const completed = getCompletedLevels();
    if (!completed.includes(levelIndex)) {
        completed.push(levelIndex);
        localStorage.setItem('completedLevels', JSON.stringify(completed));
    }
}

function getCompletedLevels() {
    const completed = localStorage.getItem('completedLevels');
    return completed ? JSON.parse(completed) : [];
}

function isLevelCompleted(levelIndex) {
    return getCompletedLevels().includes(levelIndex);
}

// Coin functions
function getCoins() {
    const coins = localStorage.getItem('totalCoins');
    return coins ? parseInt(coins) : 0;
}

function addCoin() {
    const currentCoins = getCoins();
    localStorage.setItem('totalCoins', (currentCoins + 1).toString());
    updateCoinDisplay();
}

function spendCoins(amount) {
    const currentCoins = getCoins();
    if (currentCoins >= amount) {
        localStorage.setItem('totalCoins', (currentCoins - amount).toString());
        updateCoinDisplay();
        return true;
    }
    return false;
}

function updateCoinDisplay() {
    const totalCoins = getCoins();
    if (totalCoinsElement) {
        totalCoinsElement.textContent = totalCoins;
    }
    if (coinsElement) {
        coinsElement.textContent = `💰 Coins: ${totalCoins}`;
    }
}

// Initialize level selection screen
function initLevelSelection() {
    levelButtonsElement.innerHTML = '';
    updateCoinDisplay(); // Update coin display when showing menu
    
    levels.forEach((level, index) => {
        const button = document.createElement('button');
        button.className = 'level-button';
        button.textContent = index + 1;
        button.title = level.description;
        
        if (!isLevelUnlocked(index)) {
            button.classList.add('locked');
        } else if (isLevelCompleted(index)) {
            button.classList.add('completed');
        }
        
        if (isLevelUnlocked(index)) {
            button.addEventListener('click', () => startLevel(index));
        }
        
        levelButtonsElement.appendChild(button);
    });
}

// Start a level
function startLevel(levelIndex) {
    currentLevelIndex = levelIndex;
    currentLevel = levels[levelIndex];
    
    // Set level-specific settings
    pipeSpeed = currentLevel.pipeSpeed;
    pipeGap = currentLevel.pipeGap;
    pipeSpawnInterval = currentLevel.pipeSpawnInterval;
    totalPipes = currentLevel.totalPipes;
    
    // Reset game state
    gameState = 'playing';
    score = 0;
    pipesSpawned = 0;
    finishLineX = null;
    scoreElement.textContent = `Score: ${score}`;
    levelInfoElement.textContent = `Level: ${levelIndex + 1}`;
    progressElement.textContent = `Progress: ${score} / ${totalPipes}`;
    gameOverPopup.classList.add('hidden');
    levelCompleteElement.classList.add('hidden');
    
    // Reset bird
    bird.y = canvas.height / 2;
    bird.velocity = 0;
    
    // Reset pipes
    pipes.length = 0;
    pipeSpawnTimer = 0;
    createPipe();
    pipesSpawned = 1;
    
    // Reset coins
    coins.length = 0;
    coinSpawnTimer = 0;
    
    // Update coin display
    updateCoinDisplay();
    
    // Show game screen, hide level selection
    levelSelectionElement.classList.add('hidden');
    gameScreenElement.classList.remove('hidden');
}

// Initialize first pipe
function createPipe() {
    const minHeight = 50;
    const maxHeight = canvas.height - pipeGap - minHeight;
    const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
    
    pipes.push({
        x: canvas.width,
        topHeight: topHeight,
        bottomY: topHeight + pipeGap,
        passed: false
    });
}

// Create coin
function createCoin() {
    // Find a safe Y position that avoids pipes
    const coinSize = 20;
    let coinY;
    let attempts = 0;
    let safePosition = false;
    
    // Try to find a safe position
    while (!safePosition && attempts < 10) {
        coinY = 50 + Math.random() * (canvas.height - 100); // Random Y, avoiding top/bottom edges
        
        // Check if this position would overlap with any nearby pipes
        let tooCloseToPipe = false;
        pipes.forEach(pipe => {
            const distance = Math.abs(pipe.x - canvas.width);
            // Only check pipes that are close to spawn point
            if (distance < 100) {
                // Check if coin would be in pipe area
                if (coinY < pipe.topHeight || coinY + coinSize > pipe.bottomY) {
                    tooCloseToPipe = true;
                }
            }
        });
        
        if (!tooCloseToPipe) {
            safePosition = true;
        }
        attempts++;
    }
    
    // If we couldn't find a safe position, use center
    if (!safePosition) {
        coinY = canvas.height / 2;
    }
    
    coins.push({
        x: canvas.width,
        y: coinY,
        size: coinSize,
        collected: false,
        rotation: 0
    });
}

// Draw finish line
function drawFinishLine() {
    if (finishLineX === null) return;
    
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 5;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    ctx.moveTo(finishLineX, 0);
    ctx.lineTo(finishLineX, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw "FINISH" text
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('FINISH', finishLineX, canvas.height / 2);
    ctx.textAlign = 'left';
}

// Draw bird
function drawBird() {
    ctx.fillStyle = bird.color;
    ctx.beginPath();
    ctx.arc(bird.x + bird.width/2, bird.y + bird.height/2, bird.width/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw eye
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(bird.x + bird.width/2 + 5, bird.y + bird.height/2 - 5, 5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(bird.x + bird.width/2 + 6, bird.y + bird.height/2 - 5, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw beak
    ctx.fillStyle = '#FF8C00';
    ctx.beginPath();
    ctx.moveTo(bird.x + bird.width, bird.y + bird.height/2);
    ctx.lineTo(bird.x + bird.width + 8, bird.y + bird.height/2 - 3);
    ctx.lineTo(bird.x + bird.width + 8, bird.y + bird.height/2 + 3);
    ctx.closePath();
    ctx.fill();
}

// Draw pipes
function drawPipes() {
    ctx.fillStyle = '#228B22';
    
    pipes.forEach(pipe => {
        // Top pipe
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.topHeight);
        ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, pipeWidth + 10, 20);
        
        // Bottom pipe
        ctx.fillRect(pipe.x, pipe.bottomY, pipeWidth, canvas.height - pipe.bottomY);
        ctx.fillRect(pipe.x - 5, pipe.bottomY, pipeWidth + 10, 20);
    });
}

// Draw coins
function drawCoins() {
    coins.forEach(coin => {
        if (!coin.collected) {
            ctx.save();
            ctx.translate(coin.x + coin.size / 2, coin.y + coin.size / 2);
            coin.rotation += 0.1;
            ctx.rotate(coin.rotation);
            
            // Draw coin (golden circle)
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(0, 0, coin.size / 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Draw coin border
            ctx.strokeStyle = '#FFA500';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Draw $ symbol
            ctx.fillStyle = '#FF8C00';
            ctx.font = `${coin.size * 0.6}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('$', 0, 0);
            
            ctx.restore();
        }
    });
}

// Update bird
function updateBird() {
    if (gameState === 'playing') {
        bird.velocity += bird.gravity;
        bird.y += bird.velocity;
        
        // Check boundaries
        if (bird.y + bird.height > canvas.height) {
            bird.y = canvas.height - bird.height;
            gameOver();
        }
        if (bird.y < 0) {
            bird.y = 0;
            bird.velocity = 0;
        }
    }
}

// Update pipes
function updatePipes() {
    if (gameState === 'playing') {
        // Spawn new pipes until we reach the total
        if (pipesSpawned < totalPipes) {
            pipeSpawnTimer++;
            if (pipeSpawnTimer >= pipeSpawnInterval) {
                createPipe();
                pipesSpawned++;
                pipeSpawnTimer = 0;
            }
        }
        
        // Show finish line when all pipes are passed
        if (score >= totalPipes && finishLineX === null) {
            // Find the rightmost pipe position and place finish line after it
            let rightmostX = bird.x + 200; // Default position ahead of bird
            if (pipes.length > 0) {
                pipes.forEach(pipe => {
                    if (pipe.x + pipeWidth > rightmostX) {
                        rightmostX = pipe.x + pipeWidth;
                    }
                });
                finishLineX = rightmostX + 150;
            } else {
                // If no pipes left, place finish line ahead of bird
                finishLineX = bird.x + 200;
            }
        }
        
        // Move pipes
        pipes.forEach(pipe => {
            pipe.x -= pipeSpeed;
            
            // Check if bird passed the pipe
            if (!pipe.passed && pipe.x + pipeWidth < bird.x) {
                pipe.passed = true;
                score++;
                scoreElement.textContent = `Score: ${score}`;
                progressElement.textContent = `Progress: ${score} / ${totalPipes}`;
                
                // Check if all pipes are passed - complete level immediately
                if (score >= totalPipes) {
                    completeLevel();
                }
            }
        });
        
        // Move finish line (visual indicator only)
        if (finishLineX !== null) {
            finishLineX -= pipeSpeed;
        }
        
        // Remove off-screen pipes
        while (pipes.length > 0 && pipes[0].x + pipeWidth < 0) {
            pipes.shift();
        }
    }
}

// Update coins
function updateCoins() {
    if (gameState === 'playing') {
        // Spawn coins periodically
        coinSpawnTimer++;
        if (coinSpawnTimer >= coinSpawnInterval) {
            // Only spawn coins if we haven't reached the pipe limit
            if (pipesSpawned < totalPipes || pipes.length > 0) {
                createCoin();
            }
            coinSpawnTimer = 0;
        }
        
        // Move coins
        coins.forEach(coin => {
            if (!coin.collected) {
                coin.x -= pipeSpeed;
            }
        });
        
        // Remove off-screen or collected coins
        for (let i = coins.length - 1; i >= 0; i--) {
            if (coins[i].collected || coins[i].x + coins[i].size < 0) {
                coins.splice(i, 1);
            }
        }
    }
}

// Collision detection
function checkCollisions() {
    if (gameState !== 'playing') return;
    
    // Check pipe collisions
    pipes.forEach(pipe => {
        // Check collision with top pipe
        if (bird.x < pipe.x + pipeWidth &&
            bird.x + bird.width > pipe.x &&
            bird.y < pipe.topHeight) {
            gameOver();
        }
        
        // Check collision with bottom pipe
        if (bird.x < pipe.x + pipeWidth &&
            bird.x + bird.width > pipe.x &&
            bird.y + bird.height > pipe.bottomY) {
            gameOver();
        }
    });
    
    // Check coin collisions
    coins.forEach(coin => {
        if (!coin.collected) {
            const coinCenterX = coin.x + coin.size / 2;
            const coinCenterY = coin.y + coin.size / 2;
            const birdCenterX = bird.x + bird.width / 2;
            const birdCenterY = bird.y + bird.height / 2;
            
            const distance = Math.sqrt(
                Math.pow(coinCenterX - birdCenterX, 2) + 
                Math.pow(coinCenterY - birdCenterY, 2)
            );
            
            // Check if bird is close enough to collect coin
            if (distance < (coin.size / 2 + bird.width / 2)) {
                coin.collected = true;
                addCoin();
            }
        }
    });
}

// Game over
function gameOver() {
    if (gameState === 'playing') {
        gameState = 'gameOver';
        gameOverPopup.classList.remove('hidden');
        gameOverPopup.style.display = 'flex'; // Ensure popup is visible
        notEnoughCoinsElement.classList.add('hidden');
        
        // Update continue button based on available coins
        const hasEnoughCoins = getCoins() >= 10;
        continueBtn.disabled = !hasEnoughCoins;
        if (!hasEnoughCoins) {
            continueBtn.style.opacity = '0.5';
            continueBtn.style.cursor = 'not-allowed';
        } else {
            continueBtn.style.opacity = '1';
            continueBtn.style.cursor = 'pointer';
        }
    }
}

// Complete level
function completeLevel() {
    if (gameState === 'playing') {
        gameState = 'levelComplete';
        levelCompleteElement.classList.remove('hidden');
        gameOverPopup.classList.add('hidden');
        
        // Mark level as completed
        markLevelCompleted(currentLevelIndex);
        
        // Unlock next level
        if (currentLevelIndex + 1 < levels.length) {
            unlockLevel(currentLevelIndex + 1);
        }
    }
}

// Continue game (revive)
function continueGame() {
    if (gameState === 'gameOver') {
        // Check if user has enough coins
        if (!spendCoins(10)) {
            notEnoughCoinsElement.classList.remove('hidden');
            return;
        }
        
        // Remove next 2-3 pipes and move them to the back
        const pipesToRemove = Math.min(3, pipes.length);
        const removedPipes = [];
        
        // Remove pipes that are ahead of the bird
        for (let i = pipes.length - 1; i >= 0; i--) {
            if (pipes[i].x > bird.x && removedPipes.length < pipesToRemove) {
                removedPipes.push(pipes.splice(i, 1)[0]);
            }
        }
        
        // Move removed pipes to the back (far right)
        removedPipes.forEach(pipe => {
            pipe.x = canvas.width + 200 + Math.random() * 200; // Place them far ahead
            pipe.passed = false; // Reset passed status
            pipes.push(pipe);
        });
        
        // Sort pipes by x position to maintain order
        pipes.sort((a, b) => a.x - b.x);
        
        // Reset bird to middle of screen
        bird.y = canvas.height / 2;
        bird.velocity = 0;
        
        // Clear collected coins that are off-screen
        coins.forEach(coin => {
            if (coin.x < bird.x - 100) {
                coin.collected = true;
            }
        });
        
        // Resume game
        gameState = 'playing';
        gameOverPopup.classList.add('hidden');
        notEnoughCoinsElement.classList.add('hidden');
        
        // Ensure game screen is visible
        if (gameScreenElement) {
            gameScreenElement.classList.remove('hidden');
        }
        
        // Force hide popup with inline style as backup
        if (gameOverPopup) {
            gameOverPopup.style.display = 'none';
        }
    }
}

// Reset game (play again)
function resetGame() {
    if (gameState === 'gameOver' || gameState === 'levelComplete') {
        gameState = 'playing';
        score = 0;
        pipesSpawned = 0;
        finishLineX = null;
        scoreElement.textContent = `Score: ${score}`;
        progressElement.textContent = `Progress: ${score} / ${totalPipes}`;
        gameOverPopup.classList.add('hidden');
        levelCompleteElement.classList.add('hidden');
        
        bird.y = canvas.height / 2;
        bird.velocity = 0;
        
        pipes.length = 0;
        pipeSpawnTimer = 0;
        createPipe();
        pipesSpawned = 1;
        
        // Reset coins
        coins.length = 0;
        coinSpawnTimer = 0;
    }
}

// Return to menu
function returnToMenu() {
    gameState = 'menu';
    levelSelectionElement.classList.remove('hidden');
    gameScreenElement.classList.add('hidden');
    gameOverPopup.classList.add('hidden'); // Hide popup when returning to menu
    notEnoughCoinsElement.classList.add('hidden');
    initLevelSelection(); // Refresh to show newly unlocked levels
}

// Jump function
function jump() {
    if (gameState === 'playing') {
        bird.velocity = bird.jumpStrength;
    } else if (gameState === 'levelComplete') {
        returnToMenu();
    }
    // Game over now uses popup buttons, not space key
}

// Keyboard input
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        jump();
    }
});

// Mouse/touch input
canvas.addEventListener('click', jump);
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    jump();
});

// Back to menu button
backToMenuButton.addEventListener('click', returnToMenu);

// Game over popup buttons
playAgainBtn.addEventListener('click', resetGame);
continueBtn.addEventListener('click', continueGame);

// Game loop
function gameLoop() {
    if (gameState !== 'menu') {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw background
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(0.7, '#87CEEB');
        gradient.addColorStop(0.7, '#90EE90');
        gradient.addColorStop(1, '#90EE90');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw
        updateBird();
        updatePipes();
        updateCoins();
        checkCollisions();
        
        drawPipes();
        drawCoins();
        drawFinishLine();
        drawBird();
    }
    
    requestAnimationFrame(gameLoop);
}

// Initialize game
updateCoinDisplay(); // Initialize coin display
gameOverPopup.classList.add('hidden'); // Ensure popup is hidden on startup
notEnoughCoinsElement.classList.add('hidden');
initLevelSelection();
gameLoop();
