// 数据库模块 - 用于存储用户账号信息
const fs = require('fs');
const path = require('path');

// 数据文件路径
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const GAME_DATA_FILE = path.join(DATA_DIR, 'game_data.json');

// 确保数据目录存在
function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
}

// 确保用户数据文件存在
function ensureUsersFile() {
    ensureDataDir();
    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, JSON.stringify({
            users: {}
        }));
    }
}

// 确保游戏数据文件存在
function ensureGameDataFile() {
    ensureDataDir();
    if (!fs.existsSync(GAME_DATA_FILE)) {
        fs.writeFileSync(GAME_DATA_FILE, JSON.stringify({
            playerData: {}
        }));
    }
}

// 读取所有用户
function getAllUsers() {
    ensureUsersFile();
    const data = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(data).users;
}

// 保存所有用户
function saveAllUsers(users) {
    ensureDataDir();
    fs.writeFileSync(USERS_FILE, JSON.stringify({ users }, null, 2));
}

// 获取用户
function getUser(username) {
    const users = getAllUsers();
    return users[username];
}

// 创建用户
function createUser(username, password) {
    const users = getAllUsers();
    
    // 检查用户名是否已存在
    if (users[username]) {
        return { success: false, message: '用户名已存在' };
    }
    
    // 创建新用户
    users[username] = {
        username,
        password, // 注意：实际应用中应该对密码进行哈希处理
        createdAt: new Date().toISOString(),
        lastLogin: null
    };
    
    // 保存用户数据
    saveAllUsers(users);
    
    // 初始化用户游戏数据
    initPlayerData(username);
    
    return { success: true, message: '用户创建成功' };
}

// 验证用户
function validateUser(username, password) {
    const user = getUser(username);
    
    if (!user) {
        return { success: false, message: '用户不存在' };
    }
    
    if (user.password !== password) { // 实际应用中应该比较哈希值
        return { success: false, message: '密码错误' };
    }
    
    // 更新最后登录时间
    const users = getAllUsers();
    users[username].lastLogin = new Date().toISOString();
    saveAllUsers(users);
    
    return { success: true, message: '登录成功', user };
}

// 读取所有玩家游戏数据
function getAllPlayerData() {
    ensureGameDataFile();
    const data = fs.readFileSync(GAME_DATA_FILE, 'utf8');
    return JSON.parse(data).playerData;
}

// 保存所有玩家游戏数据
function saveAllPlayerData(playerData) {
    ensureDataDir();
    fs.writeFileSync(GAME_DATA_FILE, JSON.stringify({ playerData }, null, 2));
}

// 获取玩家游戏数据
function getPlayerData(username) {
    const playerData = getAllPlayerData();
    return playerData[username] || null;
}

// 初始化玩家游戏数据
function initPlayerData(username) {
    const playerData = getAllPlayerData();
    
    // 如果玩家数据不存在，则创建初始数据
    if (!playerData[username]) {
        playerData[username] = {
            balance: 1000, // 初始金币
            wins: [],      // 获胜记录
            lastPlayed: null,
            totalBets: 0,
            totalWins: 0
        };
        saveAllPlayerData(playerData);
    }
    
    return playerData[username];
}

// 更新玩家余额
function updatePlayerBalance(username, amount) {
    const playerData = getAllPlayerData();
    
    if (!playerData[username]) {
        return { success: false, message: '玩家数据不存在' };
    }
    
    playerData[username].balance += amount;
    playerData[username].lastPlayed = new Date().toISOString();
    
    if (amount > 0) {
        playerData[username].totalWins += amount;
    } else {
        playerData[username].totalBets += Math.abs(amount);
    }
    
    saveAllPlayerData(playerData);
    
    return { 
        success: true, 
        message: '余额已更新',
        balance: playerData[username].balance 
    };
}

// 记录玩家获胜
function recordPlayerWin(username, amount, symbols) {
    const playerData = getAllPlayerData();
    
    if (!playerData[username]) {
        return { success: false, message: '玩家数据不存在' };
    }
    
    // 添加获胜记录
    playerData[username].wins.unshift({
        amount,
        symbols,
        timestamp: new Date().toISOString()
    });
    
    // 只保留最近10条记录
    if (playerData[username].wins.length > 10) {
        playerData[username].wins.pop();
    }
    
    saveAllPlayerData(playerData);
    
    return { success: true, message: '获胜记录已添加' };
}

module.exports = {
    createUser,
    validateUser,
    getUser,
    getAllUsers,
    getPlayerData,
    updatePlayerBalance,
    recordPlayerWin,
    initPlayerData,
    ensureDataDir
};