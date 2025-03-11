// Game variables
let balance = 1000;
let currentBet = 10;
let isSpinning = false;
let isAutoSpinning = false;
let autoSpinCount = 0;
let autoSpinRemaining = 0;
let spinSpeed = 3; // Spin speed in seconds
let redPacketActive = false; // Red packet rain active status
let freeSpinActive = false; // Free game active status
let freeSpinCount = 0; // Free game count
let freeSpinRemaining = 0; // Remaining free game count
let freeGameSelectionActive = false; // Free game selection interface active status
let consecutiveLosses = 0; // Consecutive losses counter

// Audio elements
const backgroundMusic = new Audio('audio/background.mp3');
let spinSound = new Audio('audio/spin.mp3');
const winSound = new Audio('audio/win.mp3');

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize game
    initGame();
});

// Sound selector initialization (moved to avoid null reference)
function initSoundSelector() {
    const spinSoundSelector = document.getElementById('spin-sound-selector');
    if (spinSoundSelector) {
        spinSoundSelector.addEventListener('change', function() {
            // Save current volume
            const currentVolume = spinSound.volume;
            const isMuted = spinSound.muted;
            
            // Update sound effect
            spinSound = new Audio(`audio/${this.value}`);
            
            // Restore volume settings
            spinSound.volume = currentVolume;
            spinSound.muted = isMuted;
        });
    }
}

// Set background music to loop
backgroundMusic.loop = true;
backgroundMusic.volume = 0.5; // Set volume to 50%

// DOM elements
const balanceEl = document.getElementById('balance');
const currentBetEl = document.getElementById('current-bet');
const resultEl = document.getElementById('result');
const spinBtn = document.getElementById('spin');
const betLessBtn = document.getElementById('bet-less');
const betMoreBtn = document.getElementById('bet-more');
const autoSpinBtn = document.getElementById('auto-spin');
const stopAutoSpinBtn = document.getElementById('stop-auto-spin');
const autoSpinCountEl = document.getElementById('auto-spin-count');
const freeSpinsCountEl = document.getElementById('free-spins-count'); // Add free game count element
const reels = [
    document.getElementById('reel1').querySelector('.symbols'),
    document.getElementById('reel2').querySelector('.symbols'),
    document.getElementById('reel3').querySelector('.symbols')
];
const redPacketContainer = document.getElementById('red-packet-container');

// Symbols and their payouts
const symbols = ['🍒', '🍋', '🍊', '🍇', '🍉', '💎', '7️⃣', '🎟️', '🧧'];
const payouts = {
    '🍒': 10,
    '🍋': 15,
    '🍊': 20,
    '🍇': 25,
    '🍉': 30,
    '💎': 50,
    '7️⃣': 100,
    '🎟️': 5, // Free game symbol, lower base payout
    '🧧': 20  // Red packet symbol, base payout
};

// Initialize game
function initGame() {
    updateUI();
    betLessBtn.addEventListener('click', decreaseBet);
    betMoreBtn.addEventListener('click', increaseBet);
    spinBtn.addEventListener('click', spin);
    autoSpinBtn.addEventListener('click', startAutoSpin);
    stopAutoSpinBtn.addEventListener('click', stopAutoSpin);
    
    // Initialize betting controls
    initBettingControls();
    
    // Initialize paytable control
    initPaytableControl();
    
    // Initialize sound selector
    initSoundSelector();
    
    // Create audio control panel
    createMusicControl();
    
    // Play background music
    playBackgroundMusic();
}

// Initialize betting controls
function initBettingControls() {
    // Get betting related elements
    const betSlider = document.getElementById('bet-slider');
    const betMin = document.getElementById('bet-min');
    const betMax = document.getElementById('bet-max');
    
    // Set slider initial value
    betSlider.value = currentBet;
    
    // Slider event
    betSlider.addEventListener('input', function() {
        currentBet = parseInt(this.value);
        updateUI();
    });
    
    // Minimum bet button
    betMin.addEventListener('click', function() {
        if (!isSpinning && !isAutoSpinning && !freeSpinActive) {
            currentBet = 5;
            betSlider.value = currentBet;
            updateUI();
        }
    });
    
    // Maximum bet button
    betMax.addEventListener('click', function() {
        if (!isSpinning && !isAutoSpinning && !freeSpinActive) {
            // Set maximum bet, but not exceeding balance or 100
            currentBet = Math.min(100, Math.floor(balance / 5) * 5);
            betSlider.value = currentBet;
            updateUI();
        }
    });
}

// Initialize paytable control
function initPaytableControl() {
    const infoButton = document.getElementById('info-button');
    const paytableModal = document.getElementById('paytable-modal');
    const closePaytableBtn = document.getElementById('close-paytable');
    
    if (infoButton && paytableModal) {
        // Click info button to open paytable
        infoButton.addEventListener('click', function() {
            paytableModal.classList.add('show');
        });
        
        // Click close button to close paytable
        if (closePaytableBtn) {
            closePaytableBtn.addEventListener('click', function() {
                paytableModal.classList.remove('show');
            });
        }
        
        // Click modal background area to close paytable
        paytableModal.addEventListener('click', function(event) {
            if (event.target === paytableModal) {
                paytableModal.classList.remove('show');
            }
        });
    }
}

// Play background music
function playBackgroundMusic() {
    // Try to play background music
    backgroundMusic.play().catch(error => {
        console.log('Autoplay blocked:', error);
        // Show tip message
        const audioTip = document.createElement('div');
        audioTip.className = 'audio-tip';
        audioTip.innerHTML = `
            <div class="tip-content">
                <p>🎵 Click anywhere to enable game sounds</p>
            </div>
        `;
        document.body.appendChild(audioTip);

        // Add click event listener to play music
        const handleClick = () => {
            backgroundMusic.play();
            spinSound.load();
            winSound.load();
            audioTip.remove();
            document.removeEventListener('click', handleClick);
        };
        document.addEventListener('click', handleClick);
    });
}

// Create audio control functionality
function createMusicControl() {
    // Background music toggle
    const bgmToggle = document.getElementById('bgm-toggle');
    bgmToggle.addEventListener('click', function() {
        if (backgroundMusic.paused) {
            backgroundMusic.play();
            this.textContent = '🔊';
            this.classList.add('active');
        } else {
            backgroundMusic.pause();
            this.textContent = '🔇';
            this.classList.remove('active');
        }
    });
    
    // Sound effects toggle
    const sfxToggle = document.getElementById('sfx-toggle');
    sfxToggle.addEventListener('click', function() {
        const isMuted = spinSound.muted;
        spinSound.muted = !isMuted;
        winSound.muted = !isMuted;
        this.textContent = isMuted ? '🎵' : '🔇';
        this.classList.toggle('active');
    });
    
    // Spin speed control
    const speedSelector = document.getElementById('spin-speed-selector');
    speedSelector.addEventListener('change', function() {
        spinSpeed = parseFloat(this.value);
    });
}

// Update UI display
function updateUI() {
    balanceEl.textContent = balance;
    currentBetEl.textContent = currentBet;
    freeSpinsCountEl.textContent = freeSpinRemaining; // Update free game count display
    
    // Disable buttons if balance is insufficient or spinning or in free game
    // Modified: Only disable controls during actual spinning, not when showing results
    // Allow continue spinning or auto spinning after winning
    const disableControls = isSpinning; // Only disable controls during actual spinning
    
    // Fix: Ensure spin button is available when there's enough balance and not spinning
    spinBtn.disabled = (balance < currentBet && !freeSpinActive) || isSpinning; // Only disable during actual spinning
    
    // Ensure bet buttons are available under appropriate conditions
    betLessBtn.disabled = currentBet <= 5 || disableControls || isAutoSpinning || freeSpinActive;
    betMoreBtn.disabled = currentBet >= 100 || balance < currentBet + 5 || disableControls || isAutoSpinning || freeSpinActive;
    
    // Ensure auto spin buttons are available under appropriate conditions
    autoSpinBtn.disabled = balance < currentBet || isSpinning || isAutoSpinning || freeSpinActive;
    stopAutoSpinBtn.disabled = !isAutoSpinning;
    
    // Force update DOM to ensure button states are correctly reflected
    setTimeout(() => {
        spinBtn.disabled = (balance < currentBet && !freeSpinActive) || isSpinning;
    }, 0);
    
    // If auto spinning, show remaining count
    if (isAutoSpinning) {
        resultEl.textContent = `Auto spinning... Remaining: ${autoSpinRemaining}`;
    }
    
    // If in free game, show remaining count
    if (freeSpinActive && !isSpinning) {
        resultEl.textContent = `Free game... Remaining: ${freeSpinRemaining}`;
    }
    
    // Debug output to help troubleshoot issues
    console.log(`UI update: isSpinning=${isSpinning}, spinBtn.disabled=${spinBtn.disabled}, balance=${balance}, currentBet=${currentBet}`);
}

// Decrease bet
function decreaseBet() {
    if (currentBet > 5 && !isSpinning) {
        currentBet -= 5;
        // Sync update slider value
        document.getElementById('bet-slider').value = currentBet;
        updateUI();
    }
}

// Increase bet
function increaseBet() {
    if (currentBet < 100 && balance >= currentBet + 5 && !isSpinning) {
        currentBet += 5;
        // Sync update slider value
        document.getElementById('bet-slider').value = currentBet;
        updateUI();
    }
}

// Spin the slot machine
function spin() {
    if ((balance < currentBet && !freeSpinActive) || isSpinning) return;
    
    // Play spin sound effect
    spinSound.currentTime = 0; // Reset audio playback position
    spinSound.play();
    
    // If not free game, deduct bet amount
    if (!freeSpinActive) {
        balance -= currentBet;
    } else {
        freeSpinRemaining--;
    }
    
    isSpinning = true;
    updateUI();
    
    // Reset result display
    resultEl.textContent = 'Spinning...';
    resultEl.classList.remove('win');
    
    // Generate random spin for each reel
    const spinResults = [];
    const spinPromises = [];
    
    // If already two consecutive losses, ensure this time must win
    const guaranteeWin = consecutiveLosses >= 2;
    
    if (guaranteeWin) {
        // Randomly select a symbol as winning symbol
        const winSymbolIndex = Math.floor(Math.random() * symbols.length);
        const winSymbol = symbols[winSymbolIndex];
        
        // All reels display the same symbol
        for (let i = 0; i < 3; i++) {
            spinResults.push(winSymbol);
        }
    }
    
    reels.forEach((reel, index) => {
        // Randomly decide the number of rotations and final position
        const fullRotations = 5 + Math.floor(Math.random() * 3); // 5-7 circles
        let finalSymbolIndex;
        
        if (guaranteeWin) {
            // If guarantee win, use predetermined symbol index
            finalSymbolIndex = symbols.indexOf(spinResults[index]);
        } else {
            // Normal random spin
            const extraSteps = Math.floor(Math.random() * symbols.length);
            finalSymbolIndex = (symbols.length - extraSteps) % symbols.length;
            
            // Only add results when not guaranteeing win
            if (spinResults.length < 3) {
                spinResults.push(symbols[finalSymbolIndex]);
            }
        }
        
        // Optimize rotation steps calculation, reduce unnecessary large displacement
        const totalSteps = (fullRotations * symbols.length + finalSymbolIndex) % (symbols.length * 2);
        
        // Create rotation animation Promise
        const spinPromise = new Promise(resolve => {
            // Get current position, avoid starting from 0 every time
            const currentPosition = parseInt(reel.style.transform.replace('translateY(', '').replace('px)', '') || 0);
            
            // Calculate actual symbol index position
            const actualSymbolIndex = symbols.indexOf(spinResults[index]);
            const finalPosition = -actualSymbolIndex * 150;
            
            // Calculate total number of rotations, ensure at least rotate specified number of circles
            const rotations = fullRotations * symbols.length * 150;
            
            // Calculate final position, make it smoothly transition to correct symbol position
            // By calculating the distance from current position to final position needed to rotate, plus complete rotation circles
            const distance = Math.abs(finalPosition - currentPosition);
            const targetPosition = currentPosition - rotations - distance;
            
            setTimeout(() => {
                // Set transition animation, use smoother easing function
                reel.style.transition = `transform ${spinSpeed}s cubic-bezier(0.16, 1, 0.3, 1)`;
                reel.style.transform = `translateY(${finalPosition}px)`;
                
                // Resolve Promise after rotation ends
                setTimeout(() => {
                    resolve();
                }, spinSpeed * 1000);
            }, index * 300); // Reduce delay time, improve response speed
        });

        
        spinPromises.push(spinPromise);
    });
    
    // Check results after all reels stop
    Promise.all(spinPromises).then(() => {
        const isWin = checkWin(spinResults);
        isSpinning = false;
        updateUI(); // Update UI status, ensure buttons are available
        
        // If auto spinning, continue next spin
        if (isAutoSpinning && autoSpinRemaining > 0) {
            autoSpinRemaining--;
            updateUI();
            
            // If balance insufficient or completed all auto spins, stop auto spinning
            if (balance < currentBet || autoSpinRemaining === 0) {
                stopAutoSpin();
                return;
            }
            
            // If triggered red packet rain or free game selection, temporarily don't continue auto spinning
            // These special events will automatically continue spinning after they end
            if (redPacketActive || freeGameSelectionActive) {
                console.log('Special event activated, pause auto spinning');
                return;
            }
            
            // Delay some time before next spin
            setTimeout(() => {
                if (isAutoSpinning && !redPacketActive && !freeGameSelectionActive && balance >= currentBet) {
                    console.log('Continue auto spinning, remaining count:', autoSpinRemaining);
                    spin();
                }
            }, 1500); // Use unified delay time, ensure continue spinning after winning
        }
        
        // Ensure update UI status again after spinning ends, whether win or not
        setTimeout(() => {
            updateUI();
        }, 100);
    });
}

// Start auto spinning
function startAutoSpin() {
    if (balance < currentBet || isSpinning || isAutoSpinning) return;
    
    // Get auto spin count from input
    autoSpinCount = parseInt(autoSpinCountEl.value);
    
    // Validate input
    if (isNaN(autoSpinCount) || autoSpinCount < 1) {
        autoSpinCount = 1;
        autoSpinCountEl.value = 1;
    } else if (autoSpinCount > 100) {
        autoSpinCount = 100;
        autoSpinCountEl.value = 100;
    }
    
    // Set auto spinning status
    isAutoSpinning = true;
    autoSpinRemaining = autoSpinCount;
    updateUI();
    
    // Start first spin
    spin();
}

// Stop auto spinning
function stopAutoSpin() {
    isAutoSpinning = false;
    autoSpinRemaining = 0;
    updateUI();
}

// Check win
function checkWin(results) {
    // Check if got three free game symbols
    if (results[0] === '🎟️' && results[1] === '🎟️' && results[2] === '🎟️') {
        // Play win sound effect
        winSound.currentTime = 0;
        winSound.play();
        
        // Show free game selection interface
        showFreeGameSelection();
        // Reset consecutive losses counter
        consecutiveLosses = 0;
        return true;
    }
    
    // Check if got three red packet symbols, trigger red packet rain
    if (results[0] === '🧧' && results[1] === '🧧' && results[2] === '🧧') {
        // Play win sound effect
        winSound.currentTime = 0;
        winSound.play();
        
        // Update balance and display
        const winAmount = currentBet * payouts['🧧'];
        balance += winAmount;
        resultEl.textContent = `Congratulations! You won ${winAmount} coins! (🧧🧧🧧) Red Packet Rain!`;
        resultEl.classList.add('win');
        
        // Create and show current spin win amount
        showSpinWinAmount(winAmount);
        
        // Trigger red packet rain
        createRedPacketRain(currentBet);
        
        // Reset consecutive losses counter
        consecutiveLosses = 0;
        return true;
    }
    
    // Check if all symbols are the same
    if (results[0] === results[1] && results[1] === results[2]) {
        const winSymbol = results[0];
        const multiplier = payouts[winSymbol];
        const winAmount = currentBet * multiplier;
        
        // Play win sound effect
        winSound.currentTime = 0; // Reset audio playback position
        winSound.play();
        
        // Update balance and display
        balance += winAmount;
        resultEl.textContent = `Congratulations! You won ${winAmount} coins! (${winSymbol}${winSymbol}${winSymbol})`;
        resultEl.classList.add('win');
        
        // Create and show current spin win amount
        showSpinWinAmount(winAmount);
        
        // Reset consecutive losses counter
        consecutiveLosses = 0;
        
        // If in auto spinning, ensure continue auto spinning after winning
        if (isAutoSpinning && autoSpinRemaining > 0 && balance >= currentBet) {
            console.log('Normal win, continue auto spinning, remaining count:', autoSpinRemaining);
            // No need to call spin() here, as it's already handled in the spin function
        }
        
        return true;
    } else {
        // Increase consecutive losses count
        consecutiveLosses++;
        console.log(`Consecutive losses: ${consecutiveLosses}`);
        
        if (freeSpinActive) {
            resultEl.textContent = `Free game... Remaining: ${freeSpinRemaining}`;
        } else {
            resultEl.textContent = 'Try again!';
        }
    }
    
    // If free game ends, reset status
    if (freeSpinActive && freeSpinRemaining <= 0) {
        freeSpinActive = false;
        resultEl.textContent = 'Free game ended!';
        
        // If was auto spinning before triggering free game, continue auto spinning after free game ends
        if (isAutoSpinning && autoSpinRemaining > 0 && balance >= currentBet && !redPacketActive) {
            setTimeout(() => {
                if (isAutoSpinning && !redPacketActive && !freeGameSelectionActive && balance >= currentBet) {
                    console.log('Continue auto spinning after free game ends, remaining count:', autoSpinRemaining);
                    spin();
                }
            }, 1500);
        }
    }
    
    updateUI();
    
    // If in free game and has remaining count, automatically continue spinning
    if (freeSpinActive && freeSpinRemaining > 0 && !isSpinning && !redPacketActive && !freeGameSelectionActive) {
        setTimeout(() => {
            spin();
        }, 1500);
    }
    
    return false;
}

// Show free game selection interface
function showFreeGameSelection() {
    freeGameSelectionActive = true;
    
    // Create free game selection container
    const freeGameContainer = document.createElement('div');
    freeGameContainer.className = 'free-game-container';
    freeGameContainer.innerHTML = `
        <div class="free-game-content">
            <h3>Free Game Bonus!</h3>
            <p>Choose a surprise box to reveal your free spins!</p>
            <div class="surprise-box-container">
                <div class="surprise-box" data-spins="5">
                    <div class="box-lid">
                        <div class="box-lid-top"></div>
                        <div class="box-lid-front"></div>
                    </div>
                    <div class="box-body">
                        <div class="box-body-front"></div>
                        <div class="box-body-back"></div>
                        <div class="box-body-left"></div>
                        <div class="box-body-right"></div>
                        <div class="box-body-bottom"></div>
                        <div class="box-icon">?</div>
                    </div>
                </div>
                <div class="surprise-box" data-spins="10">
                    <div class="box-lid">
                        <div class="box-lid-top"></div>
                        <div class="box-lid-front"></div>
                    </div>
                    <div class="box-body">
                        <div class="box-body-front"></div>
                        <div class="box-body-back"></div>
                        <div class="box-body-left"></div>
                        <div class="box-body-right"></div>
                        <div class="box-body-bottom"></div>
                        <div class="box-icon">?</div>
                    </div>
                </div>
                <div class="surprise-box" data-spins="15">
                    <div class="box-lid">
                        <div class="box-lid-top"></div>
                        <div class="box-lid-front"></div>
                    </div>
                    <div class="box-body">
                        <div class="box-body-front"></div>
                        <div class="box-body-back"></div>
                        <div class="box-body-left"></div>
                        <div class="box-body-right"></div>
                        <div class="box-body-bottom"></div>
                        <div class="box-icon">?</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(freeGameContainer);
    
    // Add click event to surprise boxes
    const surpriseBoxes = document.querySelectorAll('.surprise-box');
    surpriseBoxes.forEach(box => {
        box.addEventListener('click', function() {
            if (!this.classList.contains('opening')) {
                // Get free spins count from data attribute
                const spins = parseInt(this.dataset.spins);
                
                // Mark box as opening
                this.classList.add('opening');
                
                // Open box animation
                const boxLid = this.querySelector('.box-lid');
                boxLid.style.transform = 'rotateX(-180deg)';
                
                // Show free spins count
                const boxIcon = this.querySelector('.box-icon');
                setTimeout(() => {
                    boxIcon.textContent = spins;
                    boxIcon.classList.add('revealed');
                    
                    // Set free spins
                    freeSpinCount = spins;
                    freeSpinRemaining = spins;
                    freeSpinActive = true;
                    
                    // Update UI
                    updateUI();
                    
                    // Close free game selection interface after delay
                    setTimeout(() => {
                        freeGameContainer.remove();
                        freeGameSelectionActive = false;
                        
                        // Start free spins after selection
                        setTimeout(() => {
                            if (!isSpinning && !redPacketActive) {
                                spin();
                            }
                        }, 500);
                        
                        // If was auto spinning before triggering free game, continue auto spinning after free game ends
                        if (isAutoSpinning && autoSpinRemaining > 0) {
                            console.log('Free game will start, auto spinning will continue after free game ends');
                        }
                    }, 2000);
                }, 1000);
                
                // Disable other boxes
                surpriseBoxes.forEach(otherBox => {
                    if (otherBox !== this) {
                        otherBox.style.opacity = '0.5';
                        otherBox.style.pointerEvents = 'none';
                    }
                });
            }
        });
    });
}

// Create red packet rain
function createRedPacketRain(betAmount) {
    redPacketActive = true;
    
    // Calculate number of red packets based on bet amount
    const packetCount = Math.min(50, Math.max(20, betAmount / 2));
    
    // Create red packets
    for (let i = 0; i < packetCount; i++) {
        setTimeout(() => {
            const redPacket = document.createElement('div');
            redPacket.className = 'red-packet';
            redPacket.innerHTML = '🧧';
            
            // Random position and animation duration
            const left = Math.random() * 100;
            const animDuration = 3 + Math.random() * 4;
            const delay = Math.random() * 0.5;
            const rotation = -30 + Math.random() * 60;
            
            redPacket.style.left = `${left}%`;
            redPacket.style.animationDuration = `${animDuration}s`;
            redPacket.style.animationDelay = `${delay}s`;
            redPacket.style.transform = `rotate(${rotation}deg)`;
            
            redPacketContainer.appendChild(redPacket);
            
            // Remove red packet after animation
            setTimeout(() => {
                redPacket.remove();
            }, animDuration * 1000);
        }, i * 100);
    }
    
    // End red packet rain after all packets have fallen
    setTimeout(() => {
        redPacketActive = false;
        
        // If was auto spinning, continue after red packet rain
        if (isAutoSpinning && autoSpinRemaining > 0 && balance >= currentBet) {
            setTimeout(() => {
                if (isAutoSpinning && !redPacketActive && !freeGameSelectionActive && balance >= currentBet) {
                    console.log('Continue auto spinning after red packet rain, remaining count:', autoSpinRemaining);
                    spin();
                }
            }, 1000);
        }
    }, packetCount * 100 + 5000);
}

// Show spin win amount
function showSpinWinAmount(amount) {
    const winAmount = document.createElement('div');
    winAmount.className = 'spin-win-amount';
    winAmount.textContent = `+${amount}`;
    
    document.querySelector('.reels-container').appendChild(winAmount);
    
    // Remove after animation
    setTimeout(() => {
        winAmount.remove();
    }, 2000);
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', initGame);