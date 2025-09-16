// @ts-nocheck
// Snake game logic ported from existing Snake (1).js for React mounting.

export default class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.gridSize = 20;
        this.snake = [{x: 5, y: 5}];
        this.food = {x: 0, y: 0, type: 'normal'};
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        const storedHighScore = localStorage.getItem('snakeHighScore');
        const storedHighScoreTitle = localStorage.getItem('snakeHighScoreTitle');
        this.highScore = storedHighScore ? parseInt(storedHighScore) : 0;
        this.highScoreTitle = storedHighScoreTitle || '新手';
        const storedCoins = localStorage.getItem('snakeCoins');
        this.coins = storedCoins && !isNaN(parseInt(storedCoins)) ? parseInt(storedCoins) : 0;
        const storedRate = localStorage.getItem('coinConversionRate');
        this.coinConversionRate = storedRate ? parseFloat(storedRate) : 1;
        const storedMultiplier = localStorage.getItem('scoreMultiplier');
        this.scoreMultiplier = storedMultiplier && !isNaN(parseInt(storedMultiplier)) ? parseInt(storedMultiplier) : 1;
        this.baseCoinConversionCost = 500;
        this.coinConversionCost = this.getCoinConversionCost();
        this.baseScoreMultiplierCost = 500;
        this.scoreMultiplierCost = this.getScoreMultiplierCost();
        this.gameActive = false;
        this.gamePaused = false;
        this.gameLoop = null;
        this.baseSpeed = 100;
        this.speedEffectTimer = null;
        this.gameStartTime = 0;
        this.upgradeLevels = {
            normal: parseInt(localStorage.getItem('normalUpgradeLevel')) || 0,
            fast: parseInt(localStorage.getItem('fastUpgradeLevel')) || 0,
            slow: parseInt(localStorage.getItem('slowUpgradeLevel')) || 0,
            bonus: parseInt(localStorage.getItem('bonusUpgradeLevel')) || 0,
            normalChance: parseInt(localStorage.getItem('normalChanceLevel')) || 0,
            fastChance: parseInt(localStorage.getItem('fastChanceLevel')) || 0,
            slowChance: parseInt(localStorage.getItem('slowChanceLevel')) || 0,
            bonusChance: parseInt(localStorage.getItem('bonusChanceLevel')) || 0
        };
        this.snakeColors = {
            0: '#4ecdc4',
            100: '#06d6a0',
            300: '#118ab2',
            500: '#8338ec',
            1000: '#ffd166',
            2000: '#ef476f'
        };
        this.titles = {
            0: '新手',
            100: '初學者',
            300: '熟練者',
            500: '高手',
            1000: '大師',
            2000: '傳奇'
        };
        this.foodTypes = {
            normal: {
                basePoints: 10,
                baseSpeed: 0,
                baseChance: 0.6,
                upgradeCost: 50,
                chanceUpgradeCost: 200,
                color: '#ff6b6b',
                colorName: '紅色'
            },
            fast: {
                basePoints: 25,
                baseSpeed: -40,
                baseChance: 0.15,
                upgradeCost: 100,
                chanceUpgradeCost: 200,
                color: '#ffd166',
                colorName: '黃色'
            },
            slow: {
                basePoints: 20,
                baseSpeed: 10,
                baseChance: 0.15,
                upgradeCost: 75,
                chanceUpgradeCost: 200,
                color: '#06d6a0',
                colorName: '綠色'
            },
            bonus: {
                basePoints: 25,
                baseMultiplier: 1.1,
                baseSpeed: 0,
                baseChance: 0.1,
                upgradeCost: 200,
                chanceUpgradeCost: 200,
                color: '#118ab2',
                colorName: '藍色'
            }
        };
        this.foodChanceLevels = {
            normal: parseInt(localStorage.getItem('normalChanceLevel')) || 0,
            fast: parseInt(localStorage.getItem('fastChanceLevel')) || 0,
            slow: parseInt(localStorage.getItem('slowChanceLevel')) || 0,
            bonus: parseInt(localStorage.getItem('bonusChanceLevel')) || 0
        };
        const storedNormalChance = localStorage.getItem('normalChance');
        const storedFastChance = localStorage.getItem('fastChance');
        const storedSlowChance = localStorage.getItem('slowChance');
        const storedBonusChance = localStorage.getItem('bonusChance');
        if (storedNormalChance && !isNaN(parseFloat(storedNormalChance))) {
            this.foodTypes.normal.baseChance = parseFloat(storedNormalChance);
        }
        if (storedFastChance && !isNaN(parseFloat(storedFastChance))) {
            this.foodTypes.fast.baseChance = parseFloat(storedFastChance);
        }
        if (storedSlowChance && !isNaN(parseFloat(storedSlowChance))) {
            this.foodTypes.slow.baseChance = parseFloat(storedSlowChance);
        }
        if (storedBonusChance && !isNaN(parseFloat(storedBonusChance))) {
            this.foodTypes.bonus.baseChance = parseFloat(storedBonusChance);
        }
        this.foodUpgradeLevels = {
            normal: parseInt(localStorage.getItem('normalFoodLevel')) || 0,
            fast: parseInt(localStorage.getItem('fastFoodLevel')) || 0,
            slow: parseInt(localStorage.getItem('slowFoodLevel')) || 0,
            bonus: parseInt(localStorage.getItem('bonusFoodLevel')) || 0
        };
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('high-score');
        this.titleElement = document.getElementById('title');
        this.highScoreTitleElement = document.getElementById('high-score-title');
        this.coinsElement = document.getElementById('coins');
        this.earnedCoinsElement = document.getElementById('earned-coins');
        this.startBtn = document.getElementById('start-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.upgradeBtn = document.getElementById('upgrade-btn');
        this.gameOverScreen = document.getElementById('game-over');
        this.upgradeScreen = document.getElementById('upgrade-screen');
        this.finalScoreElement = document.getElementById('final-score');
        this.finalTitleElement = document.getElementById('final-title');
        this.restartBtn = document.getElementById('restart-btn');
        this.closeUpgradeBtn = document.getElementById('close-upgrade');
        this.speedStatusElement = document.getElementById('speed-status');
        if (!this.coinsElement || !this.earnedCoinsElement) {
            console.error('Required DOM elements not found');
            return;
        }
        this.startBtn.addEventListener('click', () => this.startGame());
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.restartBtn.addEventListener('click', () => this.restartGame());
        this.upgradeBtn.addEventListener('click', () => this.showUpgradeScreen());
        this.closeUpgradeBtn.addEventListener('click', () => this.hideUpgradeScreen());
        document.getElementById('upgrade-after-game').addEventListener('click', () => {
            this.hideGameOver();
            this.showUpgradeScreen();
        });
        document.getElementById('upgrade-coin-rate').addEventListener('click', () => this.upgradeCoinConversion());
        document.getElementById('reroll-chances').addEventListener('click', () => this.rerollChances());
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
        document.getElementById('upgrade-food').addEventListener('click', () => this.upgradeFood(1));
        document.getElementById('upgrade-food-multi').addEventListener('click', () => this.upgradeFood(5));
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        this.updateScore();
        this.updateCoins();
        this.updateUpgradeDisplays();
        this.draw();
        this.clearAllData = () => {
            localStorage.clear();
            this.highScore = 0;
            this.highScoreTitle = '新手';
            this.coins = 0;
            this.coinConversionRate = 1;
            this.scoreMultiplier = 1;
            this.upgradeLevels = { normal: 0, fast: 0, slow: 0, bonus: 0 };
            this.foodTypes.normal.baseChance = 0.6;
            this.foodTypes.fast.baseChance = 0.15;
            this.foodTypes.slow.baseChance = 0.15;
            this.foodTypes.bonus.baseChance = 0.1;
            this.updateScore();
            this.updateCoins();
            this.updateUpgradeDisplays();
            alert('所有遊戲數據已清除！');
        };
        const clearDataBtn = document.getElementById('clear-data');
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', this.clearAllData);
        }
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', () => this.handleTouchEnd());
        this.touchStartX = 0;
        this.touchStartY = 0;
        this.touchEndX = 0;
        this.touchEndY = 0;
        this.touchThreshold = 30;
    }
    stop() {
        this.gameActive = false;
        this.gamePaused = true;
        if (this.gameLoop) {
            clearInterval(this.gameLoop);
            this.gameLoop = null;
        }
        if (this.speedEffectTimer) {
            clearTimeout(this.speedEffectTimer);
            this.speedEffectTimer = null;
        }
    }
    getFoodPoints(type) {
        const foodType = this.foodTypes[type];
        const level = this.foodUpgradeLevels[type];
        return Math.floor(foodType.basePoints * (1 + level * 0.3));
    }
    getFoodChance(type) {
        const foodType = this.foodTypes[type];
        return foodType.baseChance;
    }
    getUpgradeCost(type) {
        const level = this.upgradeLevels[type];
        return Math.floor(50 * Math.pow(1.5, level));
    }
    getAverageUpgradeCost() {
        const types = ['normal', 'fast', 'slow', 'bonus'];
        let totalCost = 0;
        types.forEach(type => { totalCost += this.getUpgradeCost(type); });
        return Math.floor(totalCost / types.length);
    }
    getCoinConversionCost() {
        return Math.floor(400 * Math.pow(1.6, this.coinConversionRate - 1));
    }
    getScoreMultiplierCost() {
        return Math.floor(this.baseScoreMultiplierCost * Math.pow(1.2, this.scoreMultiplier - 1));
    }
    updateUpgradeDisplays() {
        document.getElementById('current-coin-rate').textContent = this.coinConversionRate.toFixed(1);
        document.getElementById('next-coin-rate').textContent = (this.coinConversionRate * 1.2).toFixed(1);
        document.getElementById('upgrade-coin-rate').textContent = `升級 (${this.getCoinConversionCost()}金幣)`;
        document.getElementById('normal-food-points').textContent = this.getFoodPoints('normal');
        document.getElementById('fast-food-points').textContent = this.getFoodPoints('fast');
        document.getElementById('slow-food-points').textContent = this.getFoodPoints('slow');
        document.getElementById('bonus-food-points').textContent = this.getFoodPoints('bonus');
        const singleUpgradeCost = this.calculateFoodUpgradeCost();
        let multiUpgradeCost = 0;
        for (let i = 0; i < 5; i++) {
            multiUpgradeCost += this.calculateFoodUpgradeCost(this.foodUpgradeLevels[Object.keys(this.foodUpgradeLevels)[0]] + i);
        }
        document.getElementById('upgrade-food').textContent = `升級食物 (${singleUpgradeCost}金幣)`;
        document.getElementById('upgrade-food-multi').textContent = `升級食物 x5 (${multiUpgradeCost}金幣)`;
        document.getElementById('normal-food-chance').textContent = `${Math.round(this.getFoodChance('normal') * 100)}%`;
        document.getElementById('fast-food-chance').textContent = `${Math.round(this.getFoodChance('fast') * 100)}%`;
        document.getElementById('slow-food-chance').textContent = `${Math.round(this.getFoodChance('slow') * 100)}%`;
        document.getElementById('bonus-food-chance').textContent = `${Math.round(this.getFoodChance('bonus') * 100)}%`;
        document.getElementById('upgrade-screen-coins').textContent = this.coins;
        document.getElementById('coin-rate').textContent = this.coinConversionRate.toFixed(1);
    }
    upgradeFood(levels = 1) {
        let totalCost = 0;
        for (let i = 0; i < levels; i++) {
            totalCost += this.calculateFoodUpgradeCost(this.foodUpgradeLevels[Object.keys(this.foodUpgradeLevels)[0]] + i);
        }
        if (this.coins < totalCost) { alert('金幣不足！'); return; }
        const foodTypes = ['normal', 'fast', 'slow', 'bonus'];
        const selectedType = foodTypes[Math.floor(Math.random() * foodTypes.length)];
        this.foodUpgradeLevels[selectedType] += levels;
        this.coins -= totalCost;
        localStorage.setItem(`${selectedType}FoodLevel`, this.foodUpgradeLevels[selectedType]);
        localStorage.setItem('snakeCoins', this.coins);
        this.updateUpgradeDisplays();
        this.updateCoins();
        alert(`成功升級${this.foodTypes[selectedType].colorName}食物 ${levels} 級！`);
    }
    calculateFoodUpgradeCost() {
        const normalPoints = this.foodTypes.normal.basePoints * (1 + this.foodUpgradeLevels.normal * 0.1);
        const fastPoints = this.foodTypes.fast.basePoints * (1 + this.foodUpgradeLevels.fast * 0.1);
        const slowPoints = this.foodTypes.slow.basePoints * (1 + this.foodUpgradeLevels.slow * 0.1);
        const bonusPoints = this.foodTypes.bonus.basePoints * (1 + this.foodUpgradeLevels.bonus * 0.1);
        const product = normalPoints * fastPoints * slowPoints * bonusPoints;
        return Math.floor(30 + product * 0.0001);
    }
    showUpgradeScreen() { this.upgradeScreen.style.display = 'flex'; this.updateUpgradeDisplays(); }
    hideUpgradeScreen() { this.upgradeScreen.style.display = 'none'; }
    updateCoins() {
        if (this.coinsElement) { this.coinsElement.textContent = this.coins; }
        localStorage.setItem('snakeCoins', this.coins.toString());
    }
    resizeCanvas() {
        const gameArea = document.querySelector('.game-area');
        this.canvas.width = gameArea.clientWidth;
        this.canvas.height = gameArea.clientHeight;
        this.gridSize = Math.min(
            Math.floor(this.canvas.width / 30),
            Math.floor(this.canvas.height / 20)
        );
        this.draw();
    }
    startGame() {
        this.clearGame();
        this.gameActive = true;
        this.gameStartTime = Date.now();
        this.updateScore();
        this.generateFood();
        this.gameOverScreen.style.display = 'none';
        this.startBtn.textContent = '重新開始';
        clearInterval(this.gameLoop);
        this.gameLoop = setInterval(() => {
            if (this.gameActive && !this.gamePaused) {
                this.update();
            }
        }, this.baseSpeed);
    }
    restartGame() {
        if (this.gameLoop) { clearInterval(this.gameLoop); this.gameLoop = null; }
        if (this.speedEffectTimer) { clearTimeout(this.speedEffectTimer); this.speedEffectTimer = null; }
        this.snake = [{x: 5, y: 5}];
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.gameActive = false;
        this.gamePaused = false;
        this.gameStartTime = 0;
        this.speedStatusElement.textContent = '';
        this.speedStatusElement.className = 'speed-status';
        clearInterval(this.gameLoop);
        this.gameLoop = setInterval(() => {
            if (this.gameActive && !this.gamePaused) { this.update(); }
        }, this.baseSpeed);
        this.updateScore();
        this.highScoreElement.textContent = this.highScore;
        this.highScoreTitleElement.textContent = this.highScoreTitle;
        this.coinsElement.textContent = this.coins;
        document.getElementById('coin-rate').textContent = this.coinConversionRate;
        this.draw();
        this.startGame();
    }
    togglePause() {
        if (!this.gameActive) return;
        this.gamePaused = !this.gamePaused;
        this.pauseBtn.textContent = this.gamePaused ? '繼續' : '暫停';
        if (this.gamePaused) { clearInterval(this.gameLoop); }
        else { this.gameLoop = setInterval(() => this.update(), this.baseSpeed); }
    }
    handleKeyPress(e) {
        if (!this.gameActive || this.gamePaused) return;
        const key = e.key.toLowerCase();
        const directions = {
            'arrowup': 'up', 'arrowdown': 'down', 'arrowleft': 'left', 'arrowright': 'right',
            'w': 'up', 's': 'down', 'a': 'left', 'd': 'right'
        };
        if (directions[key]) {
            const newDirection = directions[key];
            const opposites = { 'up': 'down', 'down': 'up', 'left': 'right', 'right': 'left' };
            if (opposites[newDirection] !== this.direction) { this.nextDirection = newDirection; }
        }
    }
    update() {
        if (!this.gameActive || this.gamePaused) return;
        this.direction = this.nextDirection;
        const head = {...this.snake[0]};
        switch (this.direction) {
            case 'up': head.y--; break;
            case 'down': head.y++; break;
            case 'left': head.x--; break;
            case 'right': head.x++; break;
        }
        if (this.checkCollision(head)) { this.gameOver(); return; }
        this.snake.unshift(head);
        if (head.x === this.food.x && head.y === this.food.y) { this.eatFood(); }
        else { this.snake.pop(); }
        this.draw();
    }
    eatFood() {
        const points = this.getFoodPoints(this.food.type);
        this.score += points;
        if (this.speedEffectTimer) {
            clearTimeout(this.speedEffectTimer);
            this.speedEffectTimer = null;
            clearInterval(this.gameLoop);
            this.updateScore();
            this.speedStatusElement.textContent = '';
            this.speedStatusElement.className = 'speed-status';
        }
        let speedEffect = 0;
        let statusText = '';
        switch(this.food.type) {
            case 'fast': {
                let speedReduction = 0;
                if (this.score >= 2000) speedReduction = 50; else if (this.score >= 1000) speedReduction = 40; else if (this.score >= 500) speedReduction = 30; else if (this.score >= 300) speedReduction = 20; else if (this.score >= 100) speedReduction = 10;
                const currentBaseSpeed = Math.max(50, this.baseSpeed - speedReduction);
                speedEffect = -Math.floor(currentBaseSpeed * 0.4);
                statusText = '加速中';
                break;
            }
            case 'slow':
                speedEffect = 10; statusText = '減速中'; break;
        }
        if (speedEffect !== 0) {
            let speedReduction = 0;
            if (this.score >= 2000) speedReduction = 50; else if (this.score >= 1000) speedReduction = 40; else if (this.score >= 500) speedReduction = 30; else if (this.score >= 300) speedReduction = 20; else if (this.score >= 100) speedReduction = 10;
            const currentBaseSpeed = Math.max(50, this.baseSpeed - speedReduction);
            const effectSpeed = currentBaseSpeed + speedEffect;
            clearInterval(this.gameLoop);
            this.gameLoop = setInterval(() => { if (this.gameActive && !this.gamePaused) { this.update(); } }, effectSpeed);
            this.speedStatusElement.textContent = statusText;
            this.speedStatusElement.className = 'speed-status ' + (speedEffect < 0 ? 'fast' : 'slow');
            this.speedEffectTimer = setTimeout(() => {
                if (this.gameActive) {
                    clearInterval(this.gameLoop);
                    let speedReduction = 0;
                    if (this.score >= 2000) speedReduction = 50; else if (this.score >= 1000) speedReduction = 40; else if (this.score >= 500) speedReduction = 30; else if (this.score >= 300) speedReduction = 20; else if (this.score >= 100) speedReduction = 10;
                    const currentSpeed = Math.max(50, this.baseSpeed - speedReduction);
                    this.gameLoop = setInterval(() => { if (this.gameActive && !this.gamePaused) { this.update(); } }, currentSpeed);
                    this.speedStatusElement.textContent = '';
                    this.speedStatusElement.className = 'speed-status';
                    this.speedEffectTimer = null;
                }
            }, 3000);
        }
        this.updateScore();
        this.generateFood();
    }
    checkCollision(head) {
        const maxX = Math.floor(this.canvas.width / this.gridSize) - 1;
        const maxY = Math.floor(this.canvas.height / this.gridSize) - 1;
        if (head.x < 0 || head.x > maxX || head.y < 0 || head.y > maxY) {
            return !this.ghostMode;
        }
        if (!this.ghostMode) {
            return this.snake.some(segment => segment.x === head.x && segment.y === head.y);
        }
        return false;
    }
    generateFood() {
        const maxX = Math.floor(this.canvas.width / this.gridSize) - 1;
        const maxY = Math.floor(this.canvas.height / this.gridSize) - 1;
        let newFood;
        do {
            newFood = { x: Math.floor(Math.random() * maxX), y: Math.floor(Math.random() * maxY), type: this.getRandomFoodType() };
        } while (this.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
        this.food = newFood;
    }
    getRandomFoodType() {
        const types = Object.keys(this.foodTypes);
        const chances = types.map(type => this.getFoodChance(type));
        const total = chances.reduce((a, b) => a + b, 0);
        const normalizedChances = chances.map(chance => chance / total);
        const random = Math.random();
        let sum = 0;
        for (let i = 0; i < normalizedChances.length; i++) {
            sum += normalizedChances[i];
            if (random <= sum) { return types[i]; }
        }
        return 'normal';
    }
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const snakeColor = this.getSnakeColor();
        this.snake.forEach((segment) => {
            this.ctx.fillStyle = snakeColor;
            this.ctx.fillRect(
                segment.x * this.gridSize,
                segment.y * this.gridSize,
                this.gridSize - 1,
                this.gridSize - 1
            );
        });
        const foodType = this.foodTypes[this.food.type];
        this.ctx.save();
        this.ctx.shadowColor = foodType.color;
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = foodType.color;
        this.ctx.beginPath();
        this.ctx.arc(
            (this.food.x + 0.5) * this.gridSize,
            (this.food.y + 0.5) * this.gridSize,
            this.gridSize / 2 - 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();
        this.ctx.restore();
    }
    updateScore() {
        this.scoreElement.textContent = this.score;
        let currentTitle = '新手';
        if (this.score >= 2000) currentTitle = '傳奇'; else if (this.score >= 1000) currentTitle = '大師'; else if (this.score >= 500) currentTitle = '高手'; else if (this.score >= 300) currentTitle = '熟練者'; else if (this.score >= 100) currentTitle = '初學者';
        this.titleElement.textContent = currentTitle;
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.highScoreTitle = currentTitle;
            this.highScoreElement.textContent = this.highScore;
            this.highScoreTitleElement.textContent = this.highScoreTitle;
            localStorage.setItem('snakeHighScore', this.highScore);
            localStorage.setItem('snakeHighScoreTitle', this.highScoreTitle);
        }
        let speedReduction = 0;
        if (this.score >= 2000) speedReduction = 50; else if (this.score >= 1000) speedReduction = 40; else if (this.score >= 500) speedReduction = 30; else if (this.score >= 300) speedReduction = 20; else if (this.score >= 100) speedReduction = 10;
        const currentSpeed = Math.max(50, this.baseSpeed - speedReduction);
        if (!this.speedEffectTimer) {
            clearInterval(this.gameLoop);
            this.gameLoop = setInterval(() => { if (this.gameActive && !this.gamePaused) { this.update(); } }, currentSpeed);
        }
    }
    getSnakeColor() {
        let color = this.snakeColors[0];
        for (const [threshold, snakeColor] of Object.entries(this.snakeColors)) {
            if (this.score >= parseInt(threshold)) { color = snakeColor; }
        }
        return color;
    }
    clearGame() {
        if (this.gameLoop) { clearInterval(this.gameLoop); this.gameLoop = null; }
        if (this.speedEffectTimer) { clearTimeout(this.speedEffectTimer); this.speedEffectTimer = null; }
        this.snake = [{x: 5, y: 5}];
        this.direction = 'right';
        this.nextDirection = 'right';
        this.score = 0;
        this.gameActive = false;
        this.gamePaused = false;
        this.gameStartTime = 0;
        this.speedStatusElement.textContent = '';
        this.speedStatusElement.className = 'speed-status';
        clearInterval(this.gameLoop);
        this.gameLoop = setInterval(() => { if (this.gameActive && !this.gamePaused) { this.update(); } }, this.baseSpeed);
        this.updateScore();
        this.highScoreElement.textContent = this.highScore;
        this.highScoreTitleElement.textContent = this.highScoreTitle;
        this.coinsElement.textContent = this.coins;
        document.getElementById('coin-rate').textContent = this.coinConversionRate;
        this.draw();
    }
    gameOver() {
        this.gameActive = false;
        if (this.gameLoop) { clearInterval(this.gameLoop); this.gameLoop = null; }
        if (this.speedEffectTimer) { clearTimeout(this.speedEffectTimer); this.speedEffectTimer = null; }
        this.speedStatusElement.textContent = '';
        this.speedStatusElement.className = 'speed-status';
        this.finalScoreElement.textContent = this.score;
        this.finalTitleElement.textContent = this.titleElement.textContent;
        const earnedCoins = Math.floor(this.score * this.coinConversionRate);
        this.coins += earnedCoins;
        this.earnedCoinsElement.textContent = earnedCoins;
        this.updateCoins();
        this.gameOverScreen.style.display = 'flex';
    }
    hideGameOver() { this.gameOverScreen.style.display = 'none'; }
    upgradeCoinConversion() {
        const cost = this.getCoinConversionCost();
        if (this.coins >= cost) {
            this.coins -= cost;
            this.coinConversionRate = Math.round((this.coinConversionRate * 1.2) * 10) / 10;
            this.coinConversionCost = this.getCoinConversionCost();
            localStorage.setItem('coinConversionRate', this.coinConversionRate.toString());
            this.updateCoins();
            this.updateUpgradeDisplays();
            alert(`升級成功！現在每1分可以獲得 ${this.coinConversionRate} 金幣`);
        } else { alert('金幣不足！'); }
    }
    rerollChances() {
        const cost = 200;
        if (this.coins < cost) { alert('金幣不足！'); return; }
        this.coins -= cost;
        const types = ['normal', 'fast', 'slow', 'bonus'];
        let remainingChance = 1;
        for (let i = 1; i < types.length; i++) {
            const minChance = 0.1;
            const maxChance = 0.2;
            const newChance = Math.random() * (maxChance - minChance) + minChance;
            this.foodTypes[types[i]].baseChance = newChance;
            remainingChance -= newChance;
            localStorage.setItem(`${types[i]}Chance`, this.foodTypes[types[i]].baseChance.toString());
        }
        this.foodTypes[types[0]].baseChance = remainingChance;
        localStorage.setItem(`${types[0]}Chance`, this.foodTypes[types[0]].baseChance.toString());
        this.updateCoins();
        this.updateUpgradeDisplays();
        alert('機率重新抽取成功！');
    }
    upgradeScoreMultiplier() {
        const cost = this.getScoreMultiplierCost();
        if (this.coins >= cost) {
            this.coins -= cost;
            this.scoreMultiplier++;
            this.scoreMultiplierCost = this.getScoreMultiplierCost();
            localStorage.setItem('scoreMultiplier', this.scoreMultiplier.toString());
            this.updateCoins();
            this.updateUpgradeDisplays();
            alert(`升級成功！現在分數獲得 ${this.scoreMultiplier} 倍`);
        } else { alert('金幣不足！'); }
    }
    handleTouchStart(e) { e.preventDefault(); const t = e.touches[0]; this.touchStartX = t.clientX; this.touchStartY = t.clientY; }
    handleTouchMove(e) { e.preventDefault(); const t = e.touches[0]; this.touchEndX = t.clientX; this.touchEndY = t.clientY; }
    handleTouchEnd() {
        const deltaX = this.touchEndX - this.touchStartX;
        const deltaY = this.touchEndY - this.touchStartY;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (Math.abs(deltaX) > this.touchThreshold) { this.nextDirection = deltaX > 0 ? 'right' : 'left'; }
        } else {
            if (Math.abs(deltaY) > this.touchThreshold) { this.nextDirection = deltaY > 0 ? 'down' : 'up'; }
        }
    }
}


