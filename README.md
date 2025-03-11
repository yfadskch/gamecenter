# 多人在线游戏中心

这是一个包含多种游戏的在线游戏中心，目前包括老虎机游戏和贪吃蛇游戏。

## 功能特点

- 多用户在线游戏系统
- 用户注册和登录功能
- 游戏中心界面，展示所有可用游戏
- 老虎机游戏
- 贪吃蛇游戏
- 实时在线用户统计
- 游戏奖池系统

## 技术栈

- 前端：HTML, CSS, JavaScript
- 后端：Node.js, Express
- 实时通信：WebSocket

## 安装和运行

```bash
# 安装依赖
npm install

# 启动服务器
npm start
```

服务器启动后，访问 http://localhost:3000 即可打开游戏中心。

## 项目结构

- `server.js` - 主服务器文件
- `db.js` - 数据库操作
- `game-center.html` - 游戏中心页面
- `slot-game.html` - 老虎机游戏页面
- `snake-game.html` - 贪吃蛇游戏页面
- 其他CSS和JavaScript文件用于游戏逻辑和样式