// 贪吃蛇游戏 JavaScript 实现

// 游戏变量
let canvas, ctx;
let snake = [];
let food = {};
let direction = 'right';
let newDirection = 'right';
let score = 0;
let gameSpeed = 100; // 初始游戏速度，数值越小速度越快
let gameLoop;
let isPaused = false;
let isGameOver = false;
let highScore = localStorage.getItem('snakeHighScore') || 0;

// 颜色配置
const colors = {
    background: '#121212',
    snake: '#bb86fc',
    snakeHead: '#03dac6',
    food: '#cf6679',
    text: '#ffffff',
    grid: '#333333'
};

// 游戏配置
const config = {
    gridSize: 20, // 网格大小
    initialSnakeLength: 3, // 初始蛇长度
    speedIncrease: 0.95, // 每吃一个食物速度增加的比例（乘以当前速度）
    minSpeed: 50 // 最小速度限制
};

// 音效
let eatSound = new Audio('audio/win.mp3'); // 复用现有音效
let gameOverSound = new Audio('audio/spin.mp3'); // 复用现有音效
let backgroundMusic = new Audio('audio/background.mp3'); // 复用现有音效
backgroundMusic.loop = true;
backgroundMusic.volume = 0.5;

// 当DOM加载完成时初始化游戏
document.addEventListener('DOMContentLoaded', function() {
    // 初始化游戏
    initGame();
});

// 初始化游戏
function initGame() {
    // 获取画布和上下文
    canvas = document.getElementById('game-canvas');
    ctx = canvas.getContext('2d');
    
    // 设置画布大小
    resizeCanvas();
    
    // 初始化蛇
    initSnake();
    
    // 生成第一个食物
    generateFood();
    
    // 添加键盘事件监听
    document.addEventListener('keydown', handleKeyPress);
    
    // 添加触摸事件监听（移动设备支持）
    addTouchControls();
    
    // 添加按钮事件监听
    document.getElementById('pause-btn').addEventListener('click', togglePause);
    document.getElementById('restart-btn').addEventListener('click', restartGame);
    document.getElementById('restart-btn-over').addEventListener('click', restartGame);
    
    // 添加音频控制
    createMusicControl();
    
    // 尝试播放背景音乐
    playBackgroundMusic();
    
    // 开始游戏循环
    startGameLoop();
    
    // 窗口大小改变时调整画布大小
    window.addEventListener('resize', resizeCanvas);
}

// 调整画布大小
function resizeCanvas() {
    // 获取容器大小
    const container = document.querySelector('.game-container');
    const containerWidth = container.clientWidth - 40; // 减去内边距
    
    // 计算画布大小，确保是网格大小的整数倍
    const size = Math.floor(containerWidth / config.gridSize) * config.gridSize;
    
    // 设置画布大小
    canvas.width = size;
    canvas.height = size;
    
    // 如果游戏已经开始，重新绘制
    if (snake.length > 0) {
        drawGame();
    }
}

// 初始化蛇
function initSnake() {
    snake = [];
    
    // 计算起始位置（画布中央）
    const centerX = Math.floor(canvas.width / config.gridSize / 2) * config.gridSize;
    const centerY = Math.floor(canvas.height / config.gridSize / 2) * config.gridSize;
    
    // 创建初始蛇身
    for (let i = 0; i < config.initialSnakeLength; i++) {
        snake.push({x: centerX - i * config.gridSize, y: centerY});
    }
}

// 生成食物
function generateFood() {
    // 计算可用位置
    const availablePositions = [];
    
    // 遍历整个画布
    for (let x = 0; x < canvas.width; x += config.gridSize) {
        for (let y = 0; y < canvas.height; y += config.gridSize) {
            // 检查该位置是否被蛇占用
            let isOccupied = false;
            for (let i = 0; i < snake.length; i++) {
                if (snake[i].x === x && snake[i].y === y) {
                    isOccupied = true;
                    break;
                }
            }
            
            // 如果未被占用，添加到可用位置
            if (!isOccupied) {
                availablePositions.push({x, y});
            }
        }
    }
    
    // 随机选择一个可用位置
    if (availablePositions.length > 0) {
        const randomIndex = Math.floor(Math.random() * availablePositions.length);
        food = availablePositions[randomIndex];
    }
}

// 处理键盘按键
function handleKeyPress(e) {
    // 如果游戏结束，忽略按键
    if (isGameOver) return;
    
    // 根据按键设置新方向
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            if (direction !== 'down') newDirection = 'up';
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (direction !== 'up') newDirection = 'down';
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            if (direction !== 'right') newDirection = 'left';
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            if (direction !== 'left') newDirection = 'right';
            break;
        case ' ':
        case 'p':
        case 'P':
            togglePause();
            break;
        case 'r':
        case 'R':
            restartGame();
            break;
    }
}

// 添加触摸控制（移动设备支持）
function addTouchControls() {
    const touchControls = document.querySelector('.touch-controls');
    if (!touchControls) return;
    
    // 上下左右按钮事件
    document.getElementById('up-btn').addEventListener('click', () => {
        if (direction !== 'down') newDirection = 'up';
    });
    
    document.getElementById('down-btn').addEventListener('click', () => {
        if (direction !== 'up') newDirection = 'down';
    });
    
    document.getElementById('left-btn').addEventListener('click', () => {
        if (direction !== 'right') newDirection = 'left';
    });
    
    document.getElementById('right-btn').addEventListener('click', () => {
        if (direction !== 'left') newDirection = 'right';
    });
    
    // 滑动控制
    let touchStartX = 0;
    let touchStartY = 0;
    
    canvas.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        e.preventDefault();
    }, false);
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, false);
    
    canvas.addEventListener('touchend', (e) => {
        if (isGameOver) return;
        
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;
        
        // 确定滑动方向
        if (Math.abs(dx) > Math.abs(dy)) {
            // 水平滑动
            if (dx > 0 && direction !== 'left') {
                newDirection = 'right';
            } else if (dx < 0 && direction !== 'right') {
                newDirection = 'left';
            }
        } else {
            // 垂直滑动
            if (dy > 0 && direction !== 'up') {
                newDirection = 'down';
            } else if (dy < 0 && direction !== 'down') {
                newDirection = 'up';
            }
        }
        
        e.preventDefault();
    }, false);
}

// 开始游戏循环
function startGameLoop() {
    if (gameLoop) clearInterval(gameLoop);
    
    gameLoop = setInterval(() => {
        if (!isPaused && !isGameOver) {
            updateGame();
            drawGame();
        }
    }, gameSpeed);
}

// 更新游戏状态
function updateGame() {
    // 更新方向
    direction = newDirection;
    
    // 获取蛇头位置
    const head = {x: snake[0].x, y: snake[0].y};
    
    // 根据方向移动蛇头
    switch (direction) {
        case 'up':
            head.y -= config.gridSize;
            break;
        case 'down':
            head.y += config.gridSize;
            break;
        case 'left':
            head.x -= config.gridSize;
            break;
        case 'right':
            head.x += config.gridSize;
            break;
    }
    
    // 检查是否撞墙
    if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
        gameOver();
        return;
    }
    
    // 检查是否撞到自己
    for (let i = 0; i < snake.length; i++) {
        if (snake[i].x === head.x && snake[i].y === head.y) {
            gameOver();
            return;
        }
    }
    
    // 将新头部添加到蛇身
    snake.unshift(head);
    
    // 检查是否吃到食物
    if (head.x === food.x && head.y === food.y) {
        // 增加分数
        score += 10;
        updateScore();
        
        // 播放吃食物音效
        eatSound.currentTime = 0;
        eatSound.play().catch(err => console.log('音频播放失败:', err));
        
        // 生成新食物
        generateFood();
        
        // 增加游戏速度
        if (gameSpeed > config.minSpeed) {
            gameSpeed *= config.speedIncrease;
            clearInterval(gameLoop);
            startGameLoop();
        }
    } else {
        // 如果没有吃到食物，移除尾部
        snake.pop();
    }
}

// 绘制游戏
function drawGame() {
    // 清空画布
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制网格
    drawGrid();
    
    // 绘制蛇
    drawSnake();
    
    // 绘制食物
    drawFood();
    
    // 如果游戏结束，显示游戏结束信息
    if (isGameOver) {
        drawGameOver();
    }
    
    // 如果游戏暂停，显示暂停信息
    if (isPaused && !isGameOver) {
        drawPaused();
    }
}

// 绘制网格
function drawGrid() {
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 0.5;
    
    // 绘制垂直线
    for (let x = 0; x <= canvas.width; x += config.gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    // 绘制水平线
    for (let y = 0; y <= canvas.height; y += config.gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

// 绘制蛇
function drawSnake() {
    // 绘制蛇身
    for (let i = 1; i < snake.length; i++) {
        ctx.fillStyle = colors.snake;
        ctx.fillRect(snake[i].x, snake[i].y, config.gridSize, config.gridSize);
        
        // 添加内边框效果
        ctx.strokeStyle = '#ffffff20';
        ctx.lineWidth = 1;
        ctx.strokeRect(snake[i].x + 1, snake[i].y + 1, config.gridSize - 2, config.gridSize - 2);
    }
    
    // 绘制蛇头（使用不同颜色）
    ctx.fillStyle = colors.snakeHead;
    ctx.fillRect(snake[0].x, snake[0].y, config.gridSize, config.gridSize);
    
    // 添加蛇头内边框效果
    ctx.strokeStyle = '#ffffff40';
    ctx.lineWidth = 2;
    ctx.strokeRect(snake[0].x + 2, snake[0].y + 2, config.gridSize - 4, config.gridSize - 4);
    
    // 绘制蛇眼睛
    const eyeSize = config.gridSize / 6;
    const eyeOffset = config.gridSize / 4;
    
    ctx.fillStyle = '#ffffff';
    
    // 根据方向绘制眼睛
    switch (direction) {
        case 'right':
            // 右侧眼睛
            ctx.fillRect(snake[0].x + config.gridSize - eyeOffset, snake[0].y + eyeOffset, eyeSize, eyeSize);
            ctx.fillRect(snake[0].x + config.gridSize - eyeOffset, snake[0].y + config.gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);
            break;
        case 'left':
            // 左侧眼睛
            ctx.fillRect(snake[0].x + eyeOffset - eyeSize, snake[0].y + eyeOffset, eyeSize, eyeSize);
            ctx.fillRect(snake[0].x + eyeOffset - eyeSize, snake[0].y + config.gridSize - eyeOffset - eyeSize, eyeSize, eyeSize);
            break;
        case 'up':
            // 上方眼睛
            ctx.fillRect(snake[0].x + eyeOffset, snake[0].y + eyeOffset - eyeSize, eyeSize, eyeSize);
            ctx.fillRect(snake[0].x + config.gridSize - eyeOffset - eyeSize, snake[0].y + eyeOffset - eyeSize, eyeSize, eyeSize);
            break;
        case 'down':
            // 下方眼睛
            ctx.fillRect(snake[0].x + eyeOffset, snake[0].y + config.gridSize - eyeOffset, eyeSize, eyeSize);
            ctx.fillRect(snake[0].x + config.gridSize - eyeOffset - eyeSize, snake[0].y + config.gridSize - eyeOffset, eyeSize, eyeSize);
            break;
    }
}

// 绘制食物
function drawFood() {
    // 绘制食物背景
    ctx.fillStyle = colors.food;
    ctx.fillRect(food.x, food.y, config.gridSize, config.gridSize);
    
    // 添加食物内边框效果
    ctx.strokeStyle = '#ffffff40';
    ctx.lineWidth = 1;
    ctx.strokeRect(food.x + 2, food.y + 2, config.gridSize - 4, config.gridSize - 4);
    
    // 添加食物闪烁动画
    const time = new Date().getTime();
    const glowSize = 2 + Math.sin(time / 200) * 2;
    
    ctx.fillStyle = '#ffffff80';
    ctx.fillRect(food.x + config.gridSize/2 - glowSize/2, food.y + config.gridSize/2 - glowSize/2, glowSize, glowSize);
}

// 绘制游戏暂停信息
function drawPaused() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = colors.text;
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('游戏暂停', canvas.width / 2, canvas.height / 2);
    ctx.font = '16px Arial';
    ctx.fillText('按空格键或P键继续', canvas.width / 2, canvas.height / 2 + 40);
}

// 绘制游戏结束信息
function drawGameOver() {
    // 显示游戏结束界面
    document.getElementById('game-over').style.display = 'flex';
    document.getElementById('final-score').textContent = score;
}

// 更新分数
function updateScore() {
    document.getElementById('score').textContent = score;
    
    // 更新最高分
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        document.getElementById('high-score').textContent = highScore;
    }
}

// 游戏结束
function gameOver() {
    isGameOver = true;
    clearInterval(gameLoop);
    
    // 播放游戏结束音效
    gameOverSound.currentTime = 0;
    gameOverSound.play().catch(err => console.log('音频播放失败:', err));
    
    // 绘制游戏结束界面
    drawGameOver();
    
    // 更新最高分
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('snakeHighScore', highScore);
        document.getElementById('high-score').textContent = highScore;
        
        // 提交分数到排行榜
        submitScoreToLeaderboard(score);
    }
}

// 提交分数到排行榜
function submitScoreToLeaderboard(score) {
    // 检查WebSocket连接和登录状态
    if (socket && socket.readyState === WebSocket.OPEN) {
        // 发送分数到服务器
        sendMessage({
            type: 'submitScore',
            gameType: 'snake',
            score: score,
            username: isLoggedIn ? username : '游客' + Math.floor(Math.random() * 1000)
        });
        
        console.log('分数已提交到排行榜:', score);
    } else {
        console.warn('WebSocket未连接，无法提交分数到排行榜');
    }
}

// 重新开始游戏
function restartGame() {
    // 重置游戏状态
    score = 0;
    direction = 'right';
    newDirection = 'right';
    gameSpeed = 100;
    isPaused = false;
    isGameOver = false;
    
    // 隐藏游戏结束界面
    document.getElementById('game-over').style.display = 'none';
    
    // 更新分数显示
    updateScore();
    
    // 初始化蛇和食物
    initSnake();
    generateFood();
    
    // 重新开始游戏循环
    startGameLoop();
}

// 切换游戏暂停状态
function togglePause() {
    if (isGameOver) return;
    
    isPaused = !isPaused;
    drawGame();
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
            eatSound.load();
            gameOverSound.load();
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
        if (eatSound.muted) {
            eatSound.muted = false;
            gameOverSound.muted = false;
            this.classList.remove('muted');
        } else {
            eatSound.muted = true;
            gameOverSound.muted = true;
            this.classList.add('muted');
        }
    });
    
    // 添加到控制面板
    audioControls.appendChild(musicBtn);
    audioControls.appendChild(soundBtn);
    
    // 添加到页面
    document.body.appendChild(audioControls);
}