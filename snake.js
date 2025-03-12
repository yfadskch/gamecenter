document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const gameBoard = document.getElementById('game-board');
    const scoreElement = document.getElementById('score');
    const highScoreElement = document.getElementById('high-score');
    const finalScoreElement = document.getElementById('final-score');
    const startButton = document.getElementById('start-button');
    const pauseButton = document.getElementById('pause-button');
    const menuButton = document.getElementById('menu-button');
    const gameOverElement = document.querySelector('.game-over');
    const backgroundMusic = document.getElementById('background-music');
    const eatSound = document.getElementById('eat-sound');
    const gameOverSound = document.getElementById('game-over-sound');
    
    // 游戏配置
    const gridSize = 20; // 每个格子的大小
    const boardWidth = 400;
    const boardHeight = 400;
    const gridWidth = boardWidth / gridSize;
    const gridHeight = boardHeight / gridSize;
    
    // 游戏状态
    let snake = [];
    let food = {};
    let direction = 'right';
    let nextDirection = 'right';
    let gameInterval;
    let score = 0;
    let highScore = ScoreManager.getHighScore('snake');
    let gameSpeed = 150; // 初始游戏速度，毫秒
    let isPaused = false;
    let isGameOver = false;
    
    // 从中央分数系统获取初始分数
    score = ScoreManager.transferScoreToGame('snake');
    
    // 初始化游戏
    function initGame() {
        // 显示最高分
        highScoreElement.textContent = highScore;
        
        // 显示从中央系统获取的初始分数
        scoreElement.textContent = score;
        
        // 添加事件监听器
        startButton.addEventListener('click', startGame);
        pauseButton.addEventListener('click', togglePause);
        menuButton.addEventListener('click', () => {
            // 将当前分数返回到中央系统
            ScoreManager.returnScoreFromGame('snake', score);
            // 保存游戏会话状态
            saveGameSession();
            window.location.href = 'menu.html';
        });
        
        // 添加键盘控制
        document.addEventListener('keydown', handleKeyPress);
        
        // 添加音乐控制
        document.addEventListener('click', () => {
            if (backgroundMusic.paused) {
                backgroundMusic.play();
            }
        }, { once: true });
        
        // 尝试恢复游戏会话
        restoreGameSession();
    }
    
    // 保存游戏会话状态
    function saveGameSession() {
        // 只有在游戏已经开始且未结束时保存
        if (snake.length > 0 && !isGameOver) {
            const sessionData = {
                snake: snake,
                food: food,
                direction: direction,
                nextDirection: nextDirection,
                score: score,
                gameSpeed: gameSpeed,
                isPaused: isPaused,
                savedAt: new Date().toISOString()
            };
            
            ScoreManager.saveGameSession('snake', sessionData);
        }
    }
    
    // 恢复游戏会话状态
    function restoreGameSession() {
        const sessionData = ScoreManager.getGameSession('snake');
        
        if (sessionData && !isGameOver) {
            // 如果有保存的会话且游戏未结束，询问用户是否恢复
            const shouldRestore = confirm('发现上次游戏进度，是否恢复？');
            
            if (shouldRestore) {
                // 恢复游戏状态
                snake = sessionData.snake;
                food = sessionData.food;
                direction = sessionData.direction;
                nextDirection = sessionData.nextDirection;
                score = sessionData.score;
                gameSpeed = sessionData.gameSpeed;
                isPaused = sessionData.isPaused;
                
                // 更新分数显示
                scoreElement.textContent = score;
                
                // 清空游戏板
                while (gameBoard.firstChild) {
                    if (!gameBoard.firstChild.classList.contains('game-over')) {
                        gameBoard.removeChild(gameBoard.firstChild);
                    }
                }
                
                // 绘制蛇和食物
                drawSnake();
                createFoodElement();
                
                // 更新按钮状态
                startButton.disabled = true;
                pauseButton.disabled = false;
                pauseButton.textContent = isPaused ? '继续' : '暂停';
                gameOverElement.style.display = 'none';
                
                // 如果游戏未暂停，开始游戏循环
                if (!isPaused) {
                    gameInterval = setInterval(gameLoop, gameSpeed);
                }
            } else {
                // 如果用户选择不恢复，清除保存的会话
                ScoreManager.clearGameSession('snake');
            }
        }
    }
    
    // 创建食物元素
    function createFoodElement() {
        // 移除现有的食物
        const existingFood = document.querySelector('.food');
        if (existingFood) {
            gameBoard.removeChild(existingFood);
        }
        
        // 创建食物元素
        const foodElement = document.createElement('div');
        foodElement.className = 'food';
        foodElement.style.left = `${food.x * gridSize}px`;
        foodElement.style.top = `${food.y * gridSize}px`;
        gameBoard.appendChild(foodElement);
    }
    
    // 开始游戏
    function startGame() {
        if (gameInterval) clearInterval(gameInterval);
        
        // 重置游戏状态
        snake = [
            {x: 5, y: 10},
            {x: 4, y: 10},
            {x: 3, y: 10}
        ];
        score = 0;
        direction = 'right';
        nextDirection = 'right';
        gameSpeed = 150;
        isPaused = false;
        isGameOver = false;
        
        // 更新UI
        scoreElement.textContent = score;
        gameOverElement.style.display = 'none';
        startButton.disabled = true;
        pauseButton.disabled = false;
        
        // 清空游戏板
        while (gameBoard.firstChild) {
            if (!gameBoard.firstChild.classList.contains('game-over')) {
                gameBoard.removeChild(gameBoard.firstChild);
            }
        }
        
        // 创建食物
        createFood();
        
        // 创建蛇
        drawSnake();
        
        // 开始游戏循环
        gameInterval = setInterval(gameLoop, gameSpeed);
        
        // 清除之前保存的会话
        ScoreManager.clearGameSession('snake');
    }
    
    // 游戏主循环
    function gameLoop() {
        if (isPaused || isGameOver) return;
        
        // 更新蛇的方向
        direction = nextDirection;
        
        // 移动蛇
        moveSnake();
        
        // 检查碰撞
        if (checkCollision()) {
            gameOver();
            return;
        }
        
        // 检查是否吃到食物
        if (snake[0].x === food.x && snake[0].y === food.y) {
            eatFood();
        } else {
            // 如果没有吃到食物，移除蛇尾
            snake.pop();
        }
        
        // 重新绘制蛇
        drawSnake();
        
        // 保存游戏状态
        saveGameSession();
    }
    
    // 移动蛇
    function moveSnake() {
        const head = {x: snake[0].x, y: snake[0].y};
        
        // 根据方向移动蛇头
        switch(direction) {
            case 'up':
                head.y--;
                break;
            case 'down':
                head.y++;
                break;
            case 'left':
                head.x--;
                break;
            case 'right':
                head.x++;
                break;
        }
        
        // 将新的头部添加到蛇的前面
        snake.unshift(head);
    }
    
    // 绘制蛇
    function drawSnake() {
        // 清除现有的蛇
        const existingSnakeParts = document.querySelectorAll('.snake-part');
        existingSnakeParts.forEach(part => {
            gameBoard.removeChild(part);
        });
        
        // 绘制新的蛇
        snake.forEach((part, index) => {
            const snakePart = document.createElement('div');
            snakePart.className = 'snake-part';
            if (index === 0) snakePart.classList.add('snake-head');
            snakePart.style.left = `${part.x * gridSize}px`;
            snakePart.style.top = `${part.y * gridSize}px`;
            gameBoard.appendChild(snakePart);
        });
    }
    
    // 创建食物
    function createFood() {
        // 移除现有的食物
        const existingFood = document.querySelector('.food');
        if (existingFood) {
            gameBoard.removeChild(existingFood);
        }
        
        // 随机生成食物位置，确保不在蛇身上
        let foodPosition;
        do {
            foodPosition = {
                x: Math.floor(Math.random() * gridWidth),
                y: Math.floor(Math.random() * gridHeight)
            };
        } while (snake.some(part => part.x === foodPosition.x && part.y === foodPosition.y));
        
        food = foodPosition;
        
        // 创建食物元素
        createFoodElement();
    }
    
    // 吃到食物
    function eatFood() {
        // 播放吃食物音效
        eatSound.currentTime = 0;
        eatSound.play();
        
        // 增加分数
        score += 10;
        scoreElement.textContent = score;
        
        // 更新最高分
        if (score > highScore) {
            highScore = score;
            highScoreElement.textContent = highScore;
            ScoreManager.updateHighScore('snake', score);
        }
        
        // 创建新的食物
        createFood();
        
        // 加快游戏速度
        if (score % 50 === 0 && gameSpeed > 50) {
            gameSpeed -= 10;
            clearInterval(gameInterval);
            gameInterval = setInterval(gameLoop, gameSpeed);
        }
        
        // 保存游戏状态
        saveGameSession();
    }
    
    // 检查碰撞
    function checkCollision() {
        const head = snake[0];
        
        // 检查是否撞墙
        if (head.x < 0 || head.x >= gridWidth || head.y < 0 || head.y >= gridHeight) {
            return true;
        }
        
        // 检查是否撞到自己（从第二个身体部分开始检查）
        for (let i = 1; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                return true;
            }
        }
        
        return false;
    }
    
    // 游戏结束
    function gameOver() {
        isGameOver = true;
        clearInterval(gameInterval);
        
        // 播放游戏结束音效
        gameOverSound.currentTime = 0;
        gameOverSound.play();
        
        // 保存分数记录
        ScoreManager.saveScore('snake', score);
        
        // 将最终分数返回到中央系统
        ScoreManager.returnScoreFromGame('snake', score);
        
        // 显示游戏结束界面
        finalScoreElement.textContent = score;
        gameOverElement.style.display = 'flex';
        
        // 更新按钮状态
        startButton.disabled = false;
        startButton.textContent = '重新开始';
        pauseButton.disabled = true;
        
        // 清除游戏会话
        ScoreManager.clearGameSession('snake');
    }
    
    // 暂停/继续游戏
    function togglePause() {
        if (isGameOver) return;
        
        isPaused = !isPaused;
        pauseButton.textContent = isPaused ? '继续' : '暂停';
        
        if (isPaused) {
            clearInterval(gameInterval);
        } else {
            gameInterval = setInterval(gameLoop, gameSpeed);
        }
        
        // 保存游戏状态
        saveGameSession();
    }
    
    // 处理键盘按键
    function handleKeyPress(event) {
        // 如果游戏结束或暂停，不处理方向键
        if (isGameOver) return;
        
        switch(event.key) {
            case 'ArrowUp':
                if (direction !== 'down') nextDirection = 'up';
                break;
            case 'ArrowDown':
                if (direction !== 'up') nextDirection = 'down';
                break;
            case 'ArrowLeft':
                if (direction !== 'right') nextDirection = 'left';
                break;
            case 'ArrowRight':
                if (direction !== 'left') nextDirection = 'right';
                break;
            case ' ': // 空格键暂停/继续
                togglePause();
                break;
        }
    }
    
    // 初始化游戏
    initGame();
});