// 服务器端代码 - 支持老虎机游戏的多用户同步
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const bodyParser = require('body-parser');
const db = require('./db'); // 引入数据库模块

// 创建Express应用
const app = express();
const server = http.createServer(app);

// 使用中间件解析请求体
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 设置WebSocket服务器
const wss = new WebSocket.Server({ server, path: '/' });

// 游戏状态数据
let gameState = {
    activeUsers: 0,
    lastWinner: null,
    jackpot: 5000,  // 初始奖池金额
    recentWins: []  // 最近的获胜记录
};

// 存储用户会话信息
const userSessions = new Map(); // 用于存储WebSocket连接与用户名的映射关系

// 存储所有连接的客户端
const clients = new Set();

// 处理WebSocket连接
wss.on('connection', (ws) => {
    // 添加新客户端到集合
    clients.add(ws);
    gameState.activeUsers = clients.size;
    
    // 发送当前游戏状态给新连接的客户端
    ws.send(JSON.stringify({
        type: 'gameState',
        data: gameState
    }));
    
    // 向所有客户端广播用户数量更新
    broadcastGameState();
    
    // 处理来自客户端的消息
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            // 处理不同类型的消息
            switch(data.type) {
                case 'login':
                    // 处理用户登录
                    handleLogin(data, ws);
                    break;
                case 'register':
                    // 处理用户注册
                    handleRegister(data, ws);
                    break;
                case 'userInfo':
                    // 处理用户信息更新
                    handleUserInfo(data, ws);
                    break;
                case 'spin':
                    // 处理玩家旋转消息
                    handleSpin(data, ws);
                    break;
                case 'win':
                    // 处理玩家获胜消息
                    handleWin(data, ws);
                    break;
                case 'jackpotContribution':
                    // 处理奖池贡献
                    gameState.jackpot += data.amount;
                    broadcastGameState();
                    break;
                case 'getBalance':
                    // 获取用户余额
                    handleGetBalance(data, ws);
                    break;
            }
        } catch (error) {
            console.error('消息处理错误:', error);
        }
    });
    
    // 处理连接关闭
    ws.on('close', () => {
        clients.delete(ws);
        gameState.activeUsers = clients.size;
        broadcastGameState();
    });
});

// 处理玩家旋转
function handleSpin(data, ws) {
    // 这里可以添加服务器端验证逻辑
    // 例如，验证玩家余额是否足够等
    
    // 向其他玩家广播有人在玩游戏
    broadcastToOthers(ws, {
        type: 'playerActivity',
        data: {
            action: 'spin',
            betAmount: data.betAmount
        }
    });
}

// 处理玩家获胜
function handleWin(data, ws) {
    // 获取用户名
    const username = userSessions.get(ws) || data.username || '匿名玩家';
    
    // 更新最近获胜记录
    gameState.lastWinner = username;
    gameState.recentWins.unshift({
        username: username,
        amount: data.amount,
        symbols: data.symbols,
        timestamp: new Date().toISOString()
    });
    
    // 只保留最近10条记录
    if (gameState.recentWins.length > 10) {
        gameState.recentWins.pop();
    }
    
    // 如果用户已登录，更新用户余额和记录获胜
    if (userSessions.has(ws)) {
        db.updatePlayerBalance(username, data.amount);
        db.recordPlayerWin(username, data.amount, data.symbols);
        
        // 发送余额更新给用户
        const playerData = db.getPlayerData(username);
        if (playerData) {
            ws.send(JSON.stringify({
                type: 'balanceUpdate',
                balance: playerData.balance
            }));
        }
    }
    
    // 广播游戏状态更新
    broadcastGameState();
}

// 向所有客户端广播游戏状态
function broadcastGameState() {
    const message = JSON.stringify({
        type: 'gameState',
        data: gameState
    });
    
    for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    }
}

// 向除特定客户端外的所有客户端广播消息
function broadcastToOthers(ws, data) {
    const message = JSON.stringify(data);
    
    for (const client of clients) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    }
}

// 处理用户注册
function handleRegister(data, ws) {
    const { username, password } = data;
    
    // 验证用户名和密码
    if (!username || !password) {
        ws.send(JSON.stringify({
            type: 'registerResponse',
            success: false,
            message: '用户名和密码不能为空'
        }));
        return;
    }
    
    // 创建用户
    const result = db.createUser(username, password);
    
    // 发送注册结果
    ws.send(JSON.stringify({
        type: 'registerResponse',
        success: result.success,
        message: result.message
    }));
    
    // 如果注册成功，自动登录
    if (result.success) {
        handleLogin(data, ws);
    }
}

// 处理用户登录
function handleLogin(data, ws) {
    const { username, password } = data;
    
    // 验证用户名和密码
    if (!username || !password) {
        ws.send(JSON.stringify({
            type: 'loginResponse',
            success: false,
            message: '用户名和密码不能为空'
        }));
        return;
    }
    
    // 验证用户
    const result = db.validateUser(username, password);
    
    // 发送登录结果
    ws.send(JSON.stringify({
        type: 'loginResponse',
        success: result.success,
        message: result.message,
        username: result.success ? username : null
    }));
    
    // 如果登录成功，保存会话信息并发送用户数据
    if (result.success) {
        userSessions.set(ws, username);
        
        // 获取玩家数据
        const playerData = db.getPlayerData(username);
        
        // 发送玩家数据
        ws.send(JSON.stringify({
            type: 'playerData',
            data: playerData
        }));
    }
}

// 处理用户信息更新
function handleUserInfo(data, ws) {
    const { username } = data;
    
    // 更新会话信息
    if (username) {
        userSessions.set(ws, username);
    }
}

// 处理获取余额请求
function handleGetBalance(data, ws) {
    const username = userSessions.get(ws);
    
    if (!username) {
        ws.send(JSON.stringify({
            type: 'balanceResponse',
            success: false,
            message: '用户未登录'
        }));
        return;
    }
    
    // 获取玩家数据
    const playerData = db.getPlayerData(username);
    
    if (!playerData) {
        ws.send(JSON.stringify({
            type: 'balanceResponse',
            success: false,
            message: '玩家数据不存在'
        }));
        return;
    }
    
    // 发送余额信息
    ws.send(JSON.stringify({
        type: 'balanceResponse',
        success: true,
        balance: playerData.balance
    }));
}

// 提供静态文件
app.use(express.static(path.join(__dirname)));

// 获取命令行参数中的端口，默认为3002
const port = process.argv.find(arg => arg.startsWith('--port=')) ? 
    parseInt(process.argv.find(arg => arg.startsWith('--port=')).split('=')[1]) : 
    process.argv.indexOf('--port') !== -1 ? 
    parseInt(process.argv[process.argv.indexOf('--port') + 1]) : 
    process.env.PORT || 3002;

// 启动服务器
server.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
    console.log(`WebSocket服务器运行在 ws://localhost:${port}`);
});

// 确保数据目录存在
db.ensureDataDir();