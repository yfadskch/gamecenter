// 游戏变量
let balance = 1000;
let currentBet = 10;
let isSpinning = false;
let isAutoSpinning = false;
let autoSpinCount = 0;
let autoSpinRemaining = 0;
let spinSpeed = 3; // 旋转速度，单位为秒
let redPacketActive = false; // 红包雨激活状态
let freeSpinActive = false; // 免费游戏激活状态
let freeSpinCount = 0; // 免费游戏次数
let freeSpinRemaining = 0; // 剩余免费游戏次数
let freeGameSelectionActive = false; // 免费游戏选择界面激活状态
let consecutiveLosses = 0; // 连续失败计数器

// 音频元素
const backgroundMusic = new Audio('audio/background.mp3');
let spinSound = new Audio('audio/spin.mp3');
const winSound = new Audio('audio/win.mp3');

// 当DOM加载完成时初始化游戏
document.addEventListener('DOMContentLoaded', function() {
    // 初始化游戏
    initGame();
});

// 设置背景音乐循环播放
backgroundMusic.loop = true;
backgroundMusic.volume = 0.5; // 设置音量为50%

// DOM元素
let balanceEl;
let currentBetEl;
let resultEl;
let spinBtn;
let betLessBtn;
let betMoreBtn;
let autoSpinBtn;
let stopAutoSpinBtn;
let autoSpinCountEl;
let freeSpinsCountEl;
let reels = [];
let redPacketContainer;

// 符号及其赔率
const symbols = ['🍒', '🍋', '🍊', '🍇', '🍉', '💎', '7️⃣', '🎟️', '🧧'];
const payouts = {
    '🍒': 10,
    '🍋': 15,
    '🍊': 20,
    '🍇': 25,
    '🍉': 30,
    '💎': 50,
    '7️⃣': 100,
    '🎟️': 5, // 免费游戏符号，基础赔率较低
    '🧧': 20  // 红包符号，基础赔率
};

// 初始化游戏
function initGame() {
    // 获取DOM元素
    balanceEl = document.getElementById('balance');
    currentBetEl = document.getElementById('current-bet');
    resultEl = document.getElementById('result');
    spinBtn = document.getElementById('spin');
    betLessBtn = document.getElementById('bet-less');
    betMoreBtn = document.getElementById('bet-more');
    autoSpinBtn = document.getElementById('auto-spin');
    stopAutoSpinBtn = document.getElementById('stop-auto-spin');
    autoSpinCountEl = document.getElementById('auto-spin-count');
    freeSpinsCountEl = document.getElementById('free-spins-count');
    reels = [
        document.getElementById('reel1').querySelector('.symbols'),
        document.getElementById('reel2').querySelector('.symbols'),
        document.getElementById('reel3').querySelector('.symbols')
    ];
    redPacketContainer = document.getElementById('red-packet-container');
    
    // 初始化UI
    updateUI();
    
    // 添加事件监听器
    betLessBtn.addEventListener('click', decreaseBet);
    betMoreBtn.addEventListener('click', increaseBet);
    spinBtn.addEventListener('click', spin);
    autoSpinBtn.addEventListener('click', startAutoSpin);
    stopAutoSpinBtn.addEventListener('click', stopAutoSpin);
    
    // 初始化投注控制
    initBettingControls();
    
    // 初始化赔率表控制
    initPaytableControl();
    
    // 创建音频控制面板
    createMusicControl();
    
    // 播放背景音乐
    playBackgroundMusic();
    
    // 初始化转轮
    initReels();
}

// 初始化转轮
function initReels() {
    // 为每个转轮设置初始位置
    reels.forEach(reel => {
        // 随机设置初始位置
        const randomPosition = -Math.floor(Math.random() * symbols.length) * 150;
        reel.style.transform = `translateY(${randomPosition}px)`;
    });
}

// 初始化投注控制
function initBettingControls() {
    // 获取投注相关元素
    const betSlider = document.getElementById('bet-slider');
    const betMin = document.getElementById('bet-min');
    const betMax = document.getElementById('bet-max');
    
    // 设置滑块初始值
    betSlider.value = currentBet;
    
    // 滑块事件
    betSlider.addEventListener('input', function() {
        currentBet = parseInt(this.value);
        updateUI();
    });
    
    // 最小投注按钮
    betMin.addEventListener('click', function() {
        if (!isSpinning && !isAutoSpinning && !freeSpinActive) {
            currentBet = 5;
            betSlider.value = currentBet;
            updateUI();
        }
    });
    
    // 最大投注按钮
    betMax.addEventListener('click', function() {
        if (!isSpinning && !isAutoSpinning && !freeSpinActive) {
            // 设置最大投注，但不超过余额或100
            currentBet = Math.min(100, Math.floor(balance / 5) * 5);
            betSlider.value = currentBet;
            updateUI();
        }
    });
}

// 初始化赔率表控制
function initPaytableControl() {
    const infoButton = document.getElementById('info-button');
    const paytableModal = document.getElementById('paytable-modal');
    const closePaytableBtn = document.getElementById('close-paytable');
    
    if (infoButton && paytableModal) {
        // 点击信息按钮打开赔率表
        infoButton.addEventListener('click', function() {
            paytableModal.classList.add('show');
        });
        
        // 点击关闭按钮关闭赔率表
        if (closePaytableBtn) {
            closePaytableBtn.addEventListener('click', function() {
                paytableModal.classList.remove('show');
            });
        }
        
        // 点击模态框背景区域关闭赔率表
        paytableModal.addEventListener('click', function(event) {
            if (event.target === paytableModal) {
                paytableModal.classList.remove('show');
            }
        });
    }
}

// 播放背景音乐
function playBackgroundMusic() {
    // 尝试播放背景音乐
    backgroundMusic.play().catch(error => {
        console.log('自动播放被阻止:', error);
        // 显示提示信息
        const audioTip = document.createElement('div');
        audioTip.className = 'audio-tip';
        audioTip.innerHTML = `
            <div class="tip-content">
                <p>🎵 点击任意位置启用游戏声音</p>
            </div>
        `;
        document.body.appendChild(audioTip);

        // 添加点击事件监听器来播放音乐
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

// 创建音频控制功能
function createMusicControl() {
    // 创建音频控制面板
    const audioControls = document.createElement('div');
    audioControls.className = 'audio-controls';
    
    // 背景音乐切换按钮
    const musicBtn = document.createElement('div');
    musicBtn.className = 'audio-btn';
    musicBtn.innerHTML = '🎵';
    musicBtn.title = '背景音乐';
    
    // 音效切换按钮
    const soundBtn = document.createElement('div');
    soundBtn.className = 'audio-btn';
    soundBtn.innerHTML = '🔊';
    soundBtn.title = '音效';
    
    // 添加点击事件
    musicBtn.addEventListener('click', function() {
        if (backgroundMusic.muted) {
            backgroundMusic.muted = false;
            this.classList.remove('muted');
        } else {
            backgroundMusic.muted = true;
            this.classList.add('muted');
        }
    });
    
    soundBtn.addEventListener('click', function() {
        if (spinSound.muted) {
            spinSound.muted = false;
            winSound.muted = false;
            this.classList.remove('muted');
        } else {
            spinSound.muted = true;
            winSound.muted = true;
            this.classList.add('muted');
        }
    });
    
    // 添加到控制面板
    audioControls.appendChild(musicBtn);
    audioControls.appendChild(soundBtn);
    
    // 添加到页面
    document.body.appendChild(audioControls);
}

// 更新UI
function updateUI() {
    // 更新余额和投注显示
    balanceEl.textContent = balance;
    currentBetEl.textContent = currentBet;
    
    // 更新免费游戏次数显示
    if (freeSpinsCountEl) {
        freeSpinsCountEl.textContent = freeSpinRemaining;
    }
    
    // 更新自动旋转次数显示
    if (autoSpinCountEl) {
        autoSpinCountEl.textContent = autoSpinRemaining;
    }
    
    // 更新按钮状态
    if (isSpinning) {
        spinBtn.disabled = true;
        betLessBtn.disabled = true;
        betMoreBtn.disabled = true;
        autoSpinBtn.disabled = true;
    } else {
        spinBtn.disabled = false;
        
        // 如果是免费游戏或自动旋转中，禁用投注按钮
        const betControlsDisabled = freeSpinActive || isAutoSpinning;
        betLessBtn.disabled = betControlsDisabled;
        betMoreBtn.disabled = betControlsDisabled;
        
        // 如果是免费游戏或自动旋转中，禁用自动旋转按钮
        autoSpinBtn.disabled = freeSpinActive || isAutoSpinning;
    }
    
    // 显示/隐藏停止自动旋转按钮
    if (stopAutoSpinBtn) {
        stopAutoSpinBtn.style.display = isAutoSpinning ? 'inline-block' : 'none';
    }
}

// 减少投注
function decreaseBet() {
    if (currentBet > 5 && !isSpinning && !isAutoSpinning && !freeSpinActive) {
        currentBet -= 5;
        document.getElementById('bet-slider').value = currentBet;
        updateUI();
    }
}

// 增加投注
function increaseBet() {
    if (currentBet < 100 && currentBet < balance && !isSpinning && !isAutoSpinning && !freeSpinActive) {
        currentBet += 5;
        document.getElementById('bet-slider').value = currentBet;
        updateUI();
    }
}

// 开始自动旋转
function startAutoSpin() {
    if (isSpinning || isAutoSpinning || freeSpinActive) return;
    
    // 设置自动旋转次数
    autoSpinCount = 10; // 默认10次
    autoSpinRemaining = autoSpinCount;
    isAutoSpinning = true;
    
    updateUI();
    spin(); // 开始第一次旋转
}

// 停止自动旋转
function stopAutoSpin() {
    isAutoSpinning = false;
    autoSpinRemaining = 0;
    updateUI();
}

// 检查是否获胜
function checkWin(results) {
    // 检查是否所有符号都相同（三连）
    if (results[0] === results[1] && results[1] === results[2]) {
        const symbol = results[0];
        const baseWin = payouts[symbol] * currentBet;
        
        // 显示获胜信息
        resultEl.textContent = `恭喜！三个${symbol}，赢得${baseWin}！`;
        resultEl.classList.add('win');
        
        // 播放获胜音效
        winSound.currentTime = 0;
        winSound.play();
        
        // 更新余额
        balance += baseWin;
        
        // 重置连续失败计数
        consecutiveLosses = 0;
        
        // 检查特殊符号
        if (symbol === '🎟️') {
            // 触发免费游戏
            triggerFreeSpins();
        } else if (symbol === '🧧') {
            // 触发红包雨
            triggerRedPacketRain();
        }
        
        return true;
    }
    // 检查是否有两个相同符号（二连）
    else if (results[0] === results[1] || results[1] === results[2] || results[0] === results[2]) {
        let symbol;
        if (results[0] === results[1]) symbol = results[0];
        else if (results[1] === results[2]) symbol = results[1];
        else symbol = results[0]; // results[0] === results[2]
        
        const baseWin = Math.floor(payouts[symbol] * currentBet * 0.5); // 二连赔率为三连的一半
        
        // 显示获胜信息
        resultEl.textContent = `不错！两个${symbol}，赢得${baseWin}！`;
        resultEl.classList.add('win');
        
        // 播放获胜音效
        winSound.currentTime = 0;
        winSound.play();
        
        // 更新余额
        balance += baseWin;
        
        // 重置连续失败计数
        consecutiveLosses = 0;
        
        return true;
    } else {
        // 未获胜
        resultEl.textContent = '未中奖，再试一次！';
        resultEl.classList.remove('win');
        
        // 增加连续失败计数
        consecutiveLosses++;
        
        return false;
    }
}

// 触发免费游戏
function triggerFreeSpins() {
    // 设置免费游戏次数
    freeSpinCount = 5;
    freeSpinRemaining = freeSpinCount;
    freeSpinActive = true;
    
    // 显示免费游戏信息
    resultEl.textContent = `恭喜！获得${freeSpinCount}次免费游戏！`;
    
    // 更新UI
    updateUI();
    
    // 延迟一段时间后自动开始第一次免费游戏
    setTimeout(() => {
        if (freeSpinActive && freeSpinRemaining > 0) {
            spin();
        }
    }, 2000);
}

// 触发红包雨
function triggerRedPacketRain() {
    // 激活红包雨
    redPacketActive = true;
    
    // 显示红包雨容器
    redPacketContainer.style.display = 'block';
    
    // 创建红包
    for (let i = 0; i < 20; i++) {
        createRedPacket();
    }
    
    // 5秒后结束红包雨
    setTimeout(() => {
        endRedPacketRain();
    }, 5000);
}

// 创建红包
function createRedPacket() {
    const redPacket = document.createElement('div');
    redPacket.className = 'red-packet';
    redPacket.innerHTML = '🧧';
    
    // 随机位置
    const left = Math.random() * 100;
    redPacket.style.left = `${left}%`;
    
    // 随机下落速度
    const duration = 3 + Math.random() * 3;
    redPacket.style.animationDuration = `${duration}s`;
    
    // 点击红包获得奖励
    redPacket.addEventListener('click', function() {
        // 随机奖励金额
        const reward = Math.floor(Math.random() * 5 + 1) * 10;
        balance += reward;
        
        // 显示奖励
        this.innerHTML = `+${reward}`;
        this.style.fontSize = '16px';
        this.style.background = 'gold';
        this.style.color = '#cc0000';
        
        // 更新UI
        updateUI();
        
        // 移除点击事件
        this.style.pointerEvents = 'none';
        
        // 淡出效果
        setTimeout(() => {
            this.style.opacity = '0';
            setTimeout(() => {
                this.remove();
            }, 500);
        }, 500);
    });
    
    // 添加到容器
    redPacketContainer.appendChild(redPacket);
    
    // 动画结束后移除
    redPacket.addEventListener('animationend', function() {
        this.remove();
    });
}

// 结束红包雨
function endRedPacketRain() {
    redPacketActive = false;
    
    // 隐藏红包雨容器
    redPacketContainer.style.display = 'none';
    
    // 清空容器
    redPacketContainer.innerHTML = '';
    
    // 如果在自动旋转中，继续下一次旋转
    if (isAutoSpinning && autoSpinRemaining > 0) {
        setTimeout(() => {
            spin();
        }, 1000);
    }
}

// 旋转功能
function spin() {
    if ((balance < currentBet && !freeSpinActive) || isSpinning) return;
    
    // 播放旋转音效
    spinSound.currentTime = 0; // 重置音频播放位置
    spinSound.play();
    
    // 如果不是免费游戏，扣除投注金额
    if (!freeSpinActive) {
        balance -= currentBet;
    } else {
        freeSpinRemaining--;
    }
    
    isSpinning = true;
    updateUI();
    
    // 重置结果显示
    resultEl.textContent = '旋转中...';
    resultEl.classList.remove('win');
    
    // 为每个转轮生成随机旋转
    const spinResults = [];
    const spinPromises = [];
    
    // 如果已经连续两次失败，确保这次必须赢
    const guaranteeWin = consecutiveLosses >= 2;
    
    if (guaranteeWin) {
        // 随机选择一个符号作为获胜符号
        const winSymbolIndex = Math.floor(Math.random() * symbols.length);
        const winSymbol = symbols[winSymbolIndex];
        
        // 所有转轮显示相同符号
        for (let i = 0; i < 3; i++) {
            spinResults.push(winSymbol);
        }
    }
    
    reels.forEach((reel, index) => {
        // 随机决定旋转圈数和最终位置
        const fullRotations = 5 + Math.floor(Math.random() * 3); // 5-7圈
        let finalSymbolIndex;
        
        if (guaranteeWin) {
            // 如果保证获胜，使用预定的符号索引
            finalSymbolIndex = symbols.indexOf(spinResults[index]);
        } else {
            // 正常随机旋转
            const extraSteps = Math.floor(Math.random() * symbols.length);
            finalSymbolIndex = (symbols.length - extraSteps) % symbols.length;
            
            // 只有在不保证获胜时才添加结果
            if (spinResults.length < 3) {
                spinResults.push(symbols[finalSymbolIndex]);
            }
        }
        
        // 优化旋转步数计算，减少不必要的大位移
        const totalSteps = (fullRotations * symbols.length + finalSymbolIndex) % (symbols.length * 2);
        
        // 创建旋转动画Promise
        const spinPromise = new Promise(resolve => {
            // 获取当前位置，避免每次都从0开始
            const currentPosition = parseInt(reel.style.transform.replace('translateY(', '').replace('px)', '') || 0);
            
            // 计算实际符号索引位置
            const actualSymbolIndex = symbols.indexOf(spinResults[index]);
            const finalPosition = -actualSymbolIndex * 150;
            
            // 计算总旋转圈数，确保至少旋转指定圈数
            const rotations = fullRotations * symbols.length * 150;
            
            // 计算最终位置，使其平滑过渡到正确的符号位置
            // 通过计算当前位置到最终位置需要旋转的距离，加上完整旋转圈数
            const distance = Math.abs(finalPosition - currentPosition);
            const targetPosition = currentPosition - rotations - distance;
            
            setTimeout(() => {
                // 设置过渡动画，使用更平滑的缓动函数
                reel.style.transition = `transform ${spinSpeed}s cubic-bezier(0.16, 1, 0.3, 1)`;
                reel.style.transform = `translateY(${finalPosition}px)`;
                
                // 旋转结束后解析Promise
                setTimeout(() => {
                    resolve();
                }, spinSpeed * 1000);
            }, index * 300); // 减少延迟时间，提高响应速度
        });
        
        spinPromises.push(spinPromise);
    });
    
    // 所有转轮停止后检查结果
    Promise.all(spinPromises).then(() => {
        const isWin = checkWin(spinResults);
        isSpinning = false;
        updateUI(); // 更新UI状态，确保按钮可用
        
        // 如果自动旋转中，继续下一次旋转
        if (isAutoSpinning && autoSpinRemaining > 0) {
            autoSpinRemaining--;
            updateUI();
            
            // 如果余额不足或完成所有自动旋转，停止自动旋转
            if (balance < currentBet || autoSpinRemaining === 0) {
                stopAutoSpin();
                return;
            }
            
            // 如果触发了红包雨或免费游戏选择，暂时不继续自动旋转
            // 这些特殊事件会在结束后自动继续旋转
            if (redPacketActive || freeGameSelectionActive) {
                console.log('特殊事件激活，暂停自动旋转');
                return;
            }
            
            // 延迟一段时间后进行下一次旋转
            setTimeout(() => {
                if (isAutoSpinning && !redPacketActive && !freeGameSelectionActive && balance >= currentBet) {
                    console.log('继续自动旋转，剩余次数:', autoSpinRemaining);
                    spin();
                }
            }, 1500); // 使用统一的延迟时间，确保获胜后继续旋转
        }
        
        // 如果是免费游戏且还有剩余次数，继续下一次免费游戏
        if (freeSpinActive && freeSpinRemaining > 0) {
            setTimeout(() => {
                spin();
            }, 1500);
        } else if (freeSpinActive && freeSpinRemaining === 0) {
            // 免费游戏结束
            freeSpinActive = false;
            resultEl.textContent = '免费游戏结束！';
            
            // 如果在自动旋转中，继续下一次旋转
            if (isAutoSpinning && autoSpinRemaining > 0) {
                setTimeout(() => {
                    spin();
                }, 1500);
            }
        }
        
        // 确保旋转结束后再次更新UI状态，无论是否获胜
        setTimeout(() => {
            updateUI();
        }, 100);
    });
} results[0]; // results[0] === results[2]