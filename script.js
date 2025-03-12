document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const reels = document.querySelectorAll('.reel');
    const spinButton = document.getElementById('spin-button');
    const balanceElement = document.getElementById('balance');
    const betAmountElement = document.getElementById('bet-amount');
    const decreaseBetButton = document.getElementById('decrease-bet');
    const increaseBetButton = document.getElementById('increase-bet');
    const messageElement = document.getElementById('message');
    const backgroundMusic = document.getElementById('background-music');
    const spinSound = document.getElementById('spin-sound');
    const winSound = document.getElementById('win-sound');
    
    // 游戏状态
    let balance = 1000;
    let betAmount = 10;
    let isSpinning = false;
    let highScore = ScoreManager.getHighScore('slotMachine') || 1000;
    
    // 从中央分数系统获取初始分数
    balance = ScoreManager.transferScoreToGame('slotMachine');
    
    // 获取URL参数，确定游戏模式
    const urlParams = new URLSearchParams(window.location.search);
    const gameMode = urlParams.get('mode');
    
    // 可能的符号
    let symbols = ['🍒', '🍋', '🍊', '🍇', '🍉', '🍓', '7️⃣', '💰'];
    
    // 根据游戏模式设置游戏参数
    function setupGameMode() {
        const title = document.querySelector('h1');
        
        switch(gameMode) {
            case 'high_risk':
                // 高风险模式：更高的赌注和奖励
                balance = 500;
                betAmount = 20;
                title.textContent = '老虎机游戏 - 高风险模式';
                break;
                
            case 'fruits':
                // 水果主题：只使用水果符号
                symbols = ['🍒', '🍋', '🍊', '🍇', '🍉', '🍓', '🍎', '🍍'];
                title.textContent = '老虎机游戏 - 水果主题';
                break;
                
            case 'lucky':
                // 幸运模式：更高的中奖概率
                // 通过减少符号种类来提高匹配概率
                symbols = ['🍒', '🍋', '🍊', '🍇', '7️⃣'];
                balance = 800;
                title.textContent = '老虎机游戏 - 幸运模式';
                break;
                
            default:
                title.textContent = '老虎机游戏 - 经典模式';
                break;
        }
    }
    
    // 初始化游戏
    function initGame() {
        // 设置游戏模式
        setupGameMode();
        
        // 尝试恢复游戏会话
        restoreGameSession();
        
        updateBalance(balance);
        updateBetAmount(betAmount);
        
        // 添加事件监听器
        spinButton.addEventListener('click', spin);
        decreaseBetButton.addEventListener('click', decreaseBet);
        increaseBetButton.addEventListener('click', increaseBet);
        
        // 添加音乐控制
        document.addEventListener('click', () => {
            if (backgroundMusic.paused) {
                backgroundMusic.play();
            }
        }, { once: true });
        
        // 添加返回菜单按钮
        addMenuButton();
    }
    
    // 添加返回菜单按钮
    function addMenuButton() {
        const controlsDiv = document.querySelector('.controls');
        
        // 创建返回菜单按钮
        const menuButton = document.createElement('button');
        menuButton.textContent = '返回菜单';
        menuButton.style.backgroundColor = '#4CAF50';
        menuButton.style.marginTop = '10px';
        
        // 添加点击事件
        menuButton.addEventListener('click', () => {
            // 将当前分数返回到中央系统
            ScoreManager.returnScoreFromGame('slotMachine', balance);
            // 保存游戏会话状态
            saveGameSession();
            window.location.href = 'menu.html';
        });
        
        // 添加到控制区域
        controlsDiv.appendChild(menuButton);
    }
    
    // 保存游戏会话状态
    function saveGameSession() {
        const sessionData = {
            balance: balance,
            betAmount: betAmount,
            gameMode: gameMode,
            symbols: symbols,
            reelSymbols: Array.from(reels).map(reel => reel.querySelector('.symbol').textContent),
            savedAt: new Date().toISOString()
        };
        
        ScoreManager.saveGameSession('slotMachine', sessionData);
    }
    
    // 恢复游戏会话状态
    function restoreGameSession() {
        const sessionData = ScoreManager.getGameSession('slotMachine');
        
        if (sessionData && sessionData.gameMode === gameMode) {
            balance = sessionData.balance;
            betAmount = sessionData.betAmount;
            
            // 恢复轮盘符号
            if (sessionData.reelSymbols && sessionData.reelSymbols.length === reels.length) {
                reels.forEach((reel, index) => {
                    reel.querySelector('.symbol').textContent = sessionData.reelSymbols[index];
                });
            }
        }
    }
    
    // 更新余额显示
    function updateBalance(value) {
        balance = value;
        balanceElement.textContent = balance;
    }
    
    // 更新下注金额显示
    function updateBetAmount(value) {
        betAmount = value;
        betAmountElement.textContent = betAmount;
    }
    
    // 减少下注金额
    function decreaseBet() {
        if (isSpinning) return;
        if (betAmount > 10) {
            updateBetAmount(betAmount - 10);
        }
    }
    
    // 增加下注金额
    function increaseBet() {
        if (isSpinning) return;
        if (betAmount < 100 && betAmount + 10 <= balance) {
            updateBetAmount(betAmount + 10);
        }
    }
    
    // 旋转老虎机
    function spin() {
        if (isSpinning) return;
        
        // 检查余额是否足够
        if (balance < betAmount) {
            messageElement.textContent = '余额不足!';
            return;
        }
        
        // 扣除下注金额
        updateBalance(balance - betAmount);
        
        // 更新状态
        isSpinning = true;
        spinButton.disabled = true;
        messageElement.textContent = '';
        
        // 播放旋转音效
        spinSound.currentTime = 0;
        spinSound.play();
        
        // 为每个轮盘添加旋转动画
        reels.forEach(reel => {
            reel.classList.add('spinning');
        });
        
        // 设置随机停止时间
        const stopTimes = [1000, 1500, 2000]; // 每个轮盘停止的时间
        const results = []; // 存储每个轮盘的结果
        
        // 逐个停止轮盘
        reels.forEach((reel, index) => {
            setTimeout(() => {
                // 停止动画
                reel.classList.remove('spinning');
                
                // 随机选择一个符号
                const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
                reel.querySelector('.symbol').textContent = randomSymbol;
                results.push(randomSymbol);
                
                // 如果是最后一个轮盘，检查结果
                if (index === reels.length - 1) {
                    setTimeout(() => {
                        checkResult(results);
                    }, 300);
                }
            }, stopTimes[index]);
        });
    }
    
    // 检查结果
    function checkResult(results) {
        // 计算每个符号出现的次数
        const counts = {};
        results.forEach(symbol => {
            counts[symbol] = (counts[symbol] || 0) + 1;
        });
        
        // 找出出现次数最多的符号
        let maxCount = 0;
        for (const symbol in counts) {
            if (counts[symbol] > maxCount) {
                maxCount = counts[symbol];
            }
        }
        
        // 根据匹配数量计算奖励
        let winAmount = 0;
        let message = '';
        
        // 根据游戏模式调整奖励倍数
        let jackpotMultiplier = 10; // 默认三个相同的倍数
        let matchTwoMultiplier = 2; // 默认两个相同的倍数
        
        if (gameMode === 'high_risk') {
            jackpotMultiplier = 20; // 高风险模式下，三个相同的倍数更高
            matchTwoMultiplier = 3; // 高风险模式下，两个相同的倍数也更高
        }
        
        if (maxCount === 3) { // 三个相同
            winAmount = betAmount * jackpotMultiplier;
            message = `恭喜! 三个相同符号! 赢得 ${winAmount} 金币!`;
            // 添加获胜动画
            reels.forEach(reel => reel.classList.add('win-animation'));
            // 播放获胜音效
            winSound.currentTime = 0;
            winSound.play();
        } else if (maxCount === 2) { // 两个相同
            winAmount = betAmount * matchTwoMultiplier;
            message = `不错! 两个相同符号! 赢得 ${winAmount} 金币!`;
            // 播放获胜音效
            winSound.currentTime = 0;
            winSound.play();
        } else { // 没有匹配
            message = '没有匹配，再试一次!';
        }
        
        // 更新余额和消息
        if (winAmount > 0) {
            updateBalance(balance + winAmount);
        }
        messageElement.textContent = message;
        
        // 重置游戏状态
        setTimeout(() => {
            isSpinning = false;
            spinButton.disabled = false;
            reels.forEach(reel => reel.classList.remove('win-animation'));
            
            // 检查是否创造了新的最高余额
            if (balance > highScore) {
                highScore = balance;
                ScoreManager.updateHighScore('slotMachine', balance);
                messageElement.textContent += ' 新的最高余额记录!';
            }
            
            // 检查游戏是否结束
            if (balance <= 0) {
                messageElement.textContent = '游戏结束! 刷新页面重新开始。';
                spinButton.disabled = true;
                
                // 保存最终分数
                ScoreManager.saveScore('slotMachine', balance);
                
                // 将最终分数返回到中央系统
                ScoreManager.returnScoreFromGame('slotMachine', balance);
            }
            
            // 保存当前游戏状态
            saveGameSession();
        }, 1500);
    }
    
    // 初始化游戏
    initGame();
});