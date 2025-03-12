/**
 * 游戏中心分数管理模块
 * 用于管理统一的游戏分数系统，提供分数存储、读取、导出等功能
 */

const ScoreManager = {
    // 中央分数系统
    centralScore: 0,
    
    // 初始化中央分数
    initCentralScore: function() {
        // 从localStorage获取中央分数，如果不存在则设为0
        this.centralScore = parseInt(localStorage.getItem('centralScore')) || 0;
        return this.centralScore;
    },
    
    // 获取中央分数
    getCentralScore: function() {
        if (this.centralScore === undefined) {
            this.initCentralScore();
        }
        return this.centralScore;
    },
    
    // 更新中央分数
    updateCentralScore: function(score) {
        this.centralScore = score;
        localStorage.setItem('centralScore', score);
        return this.centralScore;
    },
    
    // 增加中央分数
    addCentralScore: function(points) {
        const currentScore = this.getCentralScore();
        const newScore = currentScore + points;
        return this.updateCentralScore(newScore);
    },
    
    // 将中央分数传递给游戏
    transferScoreToGame: function(gameType) {
        // 获取当前中央分数
        const currentScore = this.getCentralScore();
        
        // 创建游戏会话，包含初始分数
        const sessionData = {
            initialScore: currentScore,
            currentScore: currentScore,
            gameType: gameType,
            startedAt: new Date().toISOString()
        };
        
        // 保存游戏会话
        this.saveGameSession(gameType, sessionData);
        
        return currentScore;
    },
    
    // 从游戏返回分数到中央系统
    returnScoreFromGame: function(gameType, gameScore) {
        // 获取游戏会话
        const session = this.getGameSession(gameType);
        
        if (session) {
            // 计算游戏中获得的分数差值
            const scoreDifference = gameScore - session.initialScore;
            
            // 如果有正的分数增长，则添加到中央分数
            if (scoreDifference > 0) {
                this.addCentralScore(scoreDifference);
            }
            
            // 清除游戏会话
            this.clearGameSession(gameType);
            
            return this.getCentralScore();
        }
        
        return this.getCentralScore();
    },
    
    // 存储游戏分数记录（用于排行榜）
    saveScore: function(gameType, score, playerName = '玩家') {
        // 获取现有分数记录
        const scores = this.getScores(gameType);
        
        // 添加新分数记录，包含时间戳
        const newScore = {
            player: playerName,
            score: score,
            date: new Date().toISOString()
        };
        
        scores.push(newScore);
        
        // 按分数从高到低排序
        scores.sort((a, b) => b.score - a.score);
        
        // 只保留前10个最高分
        const topScores = scores.slice(0, 10);
        
        // 保存到localStorage
        localStorage.setItem(`${gameType}Scores`, JSON.stringify(topScores));
        
        // 更新最高分
        this.updateHighScore(gameType, score);
        
        return topScores;
    },
    
    // 获取某个游戏的所有分数记录
    getScores: function(gameType) {
        const scoresJson = localStorage.getItem(`${gameType}Scores`);
        return scoresJson ? JSON.parse(scoresJson) : [];
    },
    
    // 获取某个游戏的最高分
    getHighScore: function(gameType) {
        return localStorage.getItem(`${gameType}HighScore`) || 0;
    },
    
    // 更新最高分
    updateHighScore: function(gameType, score) {
        const currentHighScore = this.getHighScore(gameType);
        if (score > currentHighScore) {
            localStorage.setItem(`${gameType}HighScore`, score);
            return true;
        }
        return false;
    },
    
    // 获取所有游戏的最高分
    getAllHighScores: function() {
        return {
            slotMachine: this.getHighScore('slotMachine'),
            snake: this.getHighScore('snake')
            // 可以在这里添加更多游戏
        };
    },
    
    // 获取所有游戏的总分数（现在直接返回中央分数）
    getTotalScore: function() {
        return this.getCentralScore();
    },
    
    // 保存游戏会话状态
    saveGameSession: function(gameType, sessionData) {
        localStorage.setItem(`${gameType}Session`, JSON.stringify(sessionData));
    },
    
    // 获取游戏会话状态
    getGameSession: function(gameType) {
        const sessionJson = localStorage.getItem(`${gameType}Session`);
        return sessionJson ? JSON.parse(sessionJson) : null;
    },
    
    // 清除游戏会话状态
    clearGameSession: function(gameType) {
        localStorage.removeItem(`${gameType}Session`);
    },
    
    // 导出所有分数数据为JSON字符串
    exportScores: function() {
        const exportData = {
            centralScore: this.getCentralScore(),
            slotMachine: this.getScores('slotMachine'),
            snake: this.getScores('snake'),
            highScores: this.getAllHighScores(),
            gameSessions: {
                slotMachine: this.getGameSession('slotMachine'),
                snake: this.getGameSession('snake')
            },
            exportDate: new Date().toISOString()
        };
        
        return JSON.stringify(exportData, null, 2);
    },
    
    // 导入分数数据
    importScores: function(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            // 导入中央分数
            if (data.centralScore !== undefined) {
                this.updateCentralScore(data.centralScore);
            }
            
            // 导入各游戏分数
            if (data.slotMachine) {
                localStorage.setItem('slotMachineScores', JSON.stringify(data.slotMachine));
            }
            
            if (data.snake) {
                localStorage.setItem('snakeScores', JSON.stringify(data.snake));
            }
            
            // 导入最高分
            if (data.highScores) {
                for (const [game, score] of Object.entries(data.highScores)) {
                    localStorage.setItem(`${game}HighScore`, score);
                }
            }
            
            // 导入游戏会话
            if (data.gameSessions) {
                for (const [game, session] of Object.entries(data.gameSessions)) {
                    if (session) {
                        localStorage.setItem(`${game}Session`, JSON.stringify(session));
                    }
                }
            }
            
            return true;
        } catch (error) {
            console.error('导入分数数据失败:', error);
            return false;
        }
    },
    
    // 下载分数数据为JSON文件
    downloadScores: function() {
        const data = this.exportScores();
        const blob = new Blob([data], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'gamecenter_scores.json';
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 0);
    }
};