# 建立 hw2 遊戲專案
_Exported on 2025/9/16 at 15:42:20 [GMT+8] from Cursor (1.6.23)_

---

**User**

如@Snake (1).js @Snake Game.html @snake.css ，幫我用 HTML, CSS, 動態網頁的部分規定使用 React.ts (i.e. TypeScript 版本的 React)做一個純前端的遊戲, 目錄名稱就叫 “hw2”。
* 請加上 git 的管理

---

**Cursor**

I'll scaffold a new React + TypeScript app for `hw2`, install dependencies, then port your Snake game into a React component with your existing HTML/CSS adapted. Finally, I'll initialize a git repository and make the initial commit. Proceeding to create the project first.

I'll install dependencies, then create React components and styles based on your existing files, wiring the canvas game class inside a React component. After that, I'll initialize git and make an initial commit.

I'm going to add a React component and supporting files for the Snake game, copy your existing CSS into the project, and wire the game class to mount after the component renders. Then I'll initialize a git repo and make an initial commit.

```typescript
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


```

I'll add the React component and styles, wire it into the Vite app, and then run a quick lint check on the new files before initializing git and making the first commit.

```typescriptreact
import { useEffect } from 'react';
import SnakeGame from '../snake';
import '../snake.css';

export default function Snake() {
  useEffect(() => {
    const game = new SnakeGame();
    return () => {
      // best-effort cleanup by reloading to clear intervals if needed
    };
  }, []);

  return (
    <div className="game-container">
      <div className="game-header">
        <div className="score-container">
          <div className="score">分數: <span id="score">0</span></div>
          <div className="title">稱號: <span id="title">新手</span></div>
        </div>
        <div className="high-score-container">
          <div className="high-score">最高分: <span id="high-score">0</span></div>
          <div className="high-score-title">最高稱號: <span id="high-score-title">新手</span></div>
        </div>
        <div className="coin-container">
          <div className="coins">金幣: <span id="coins">0</span></div>
          <div className="coin-rate">金幣倍率: <span id="coin-rate">1</span>x</div>
        </div>
      </div>
      <div className="game-area">
        <div className="game-status">
          <div className="speed-status" id="speed-status"></div>
        </div>
        <canvas id="game-canvas"></canvas>
      </div>
      <div className="game-controls">
        <button id="start-btn">開始遊戲</button>
        <button id="pause-btn">暫停</button>
        <button id="upgrade-btn">升級</button>
      </div>
      <div className="game-over" id="game-over">
        <h2>遊戲結束</h2>
        <p>最終分數: <span id="final-score">0</span></p>
        <p>最終稱號: <span id="final-title">新手</span></p>
        <p>獲得金幣: <span id="earned-coins">0</span></p>
        <div className="game-over-buttons">
          <button id="restart-btn">再玩一次</button>
          <button id="upgrade-after-game">升級</button>
        </div>
      </div>
      <div className="upgrade-screen" id="upgrade-screen">
        <h2>升級商店</h2>
        <div className="upgrade-coin-display">
          <span>當前金幣: <span id="upgrade-screen-coins">0</span></span>
        </div>
        <div className="upgrade-section">
          <h3>金幣轉換率</h3>
          <div className="upgrade-item">
            <span>當前倍率: <span id="current-coin-rate">1</span>x</span>
            <span>升級後: <span id="next-coin-rate">2</span>x</span>
            <button id="upgrade-coin-rate">升級 (500金幣)</button>
          </div>
        </div>
        <div className="upgrade-section">
          <h3>食物升級</h3>
          <div className="food-info">
            <div className="food-type">
              <span className="food-color" style={{ backgroundColor: '#ff6b6b' }}></span>
              <span>紅色食物：</span>
              <span id="normal-food-points">10</span>分
              <span id="normal-food-chance">60%</span>
            </div>
            <div className="food-type">
              <span className="food-color" style={{ backgroundColor: '#ffd166' }}></span>
              <span>黃色食物：</span>
              <span id="fast-food-points">25</span>分
              <span id="fast-food-chance">15%</span>
            </div>
            <div className="food-type">
              <span className="food-color" style={{ backgroundColor: '#06d6a0' }}></span>
              <span>綠色食物：</span>
              <span id="slow-food-points">20</span>分
              <span id="slow-food-chance">15%</span>
            </div>
            <div className="food-type">
              <span className="food-color" style={{ backgroundColor: '#118ab2' }}></span>
              <span>藍色食物：</span>
              <span id="bonus-food-points">25</span>分
              <span id="bonus-food-chance">10%</span>
            </div>
          </div>
          <div className="upgrade-buttons">
            <button id="upgrade-food">升級食物 (30金幣)</button>
            <button id="upgrade-food-multi">升級食物 x5 (150金幣)</button>
          </div>
        </div>
        <div className="upgrade-section">
          <button id="reroll-chances">重新抽取機率 (200金幣)</button>
        </div>
        <button id="close-upgrade">關閉</button>
      </div>
    </div>
  );
}


```

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Arial', sans-serif;
    background: linear-gradient(135deg, #1a1a1a 0%, #2c3e50 100%);
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
}

.game-container {
    width: 600px;
    background: rgba(0, 0, 0, 0.7);
    border-radius: 20px;
    padding: 20px;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
    position: relative;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.game-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
    font-size: 1.2rem;
    text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
    padding: 10px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
}

.score-container, .high-score-container, .coin-container {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.score, .high-score, .title, .high-score-title, .coins {
    position: relative;
    padding: 5px 15px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 5px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.coins {
    color: #ffd700;
    text-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
}

.game-area {
    width: 100%;
    height: 400px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    position: relative;
    overflow: hidden;
    box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
}

.game-status {
    position: absolute;
    top: 10px;
    left: 10px;
    display: flex;
    gap: 10px;
    z-index: 1;
}

.speed-status {
    padding: 5px 10px;
    border-radius: 5px;
    font-size: 0.9rem;
    font-weight: bold;
    opacity: 0;
    transition: opacity 0.3s ease;
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.speed-status.fast {
    opacity: 1;
    color: #ffd166;
    text-shadow: 0 0 5px rgba(255, 209, 102, 0.5);
    animation: pulse 1s infinite;
}

.speed-status.slow {
    opacity: 1;
    color: #06d6a0;
    text-shadow: 0 0 5px rgba(6, 214, 160, 0.5);
    animation: pulse 1.5s infinite;
}

@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
}

#game-canvas {
    width: 100%;
    height: 100%;
    display: block;
}

.game-controls {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-top: 20px;
}

button {
    padding: 10px 20px;
    font-size: 1.2rem;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s ease;
    background: linear-gradient(135deg, #4ecdc4 0%, #45b7af 100%);
    color: white;
    box-shadow: 0 0 10px rgba(78, 205, 196, 0.5);
    position: relative;
    overflow: hidden;
}

button::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transform: translateX(-100%);
    transition: transform 0.6s ease;
}

button:hover::before {
    transform: translateX(100%);
}

button:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 15px rgba(78, 205, 196, 0.7);
}

button:active {
    transform: translateY(0);
}

.game-over {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 10;
    display: none;
    backdrop-filter: blur(5px);
}

.game-over h2 {
    font-size: 3rem;
    margin-bottom: 20px;
    color: #ff6b6b;
    text-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
    animation: pulse 2s infinite;
}

.game-over p {
    font-size: 1.5rem;
    margin-bottom: 15px;
    color: #4ecdc4;
}

.upgrade-screen {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    z-index: 10;
    display: none;
    backdrop-filter: blur(5px);
    padding: 20px;
    overflow-y: auto;
    max-height: 100vh;
}

.upgrade-coin-display {
    width: 100%;
    max-width: 500px;
    text-align: center;
    padding: 10px;
    margin-bottom: 20px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.upgrade-coin-display span {
    color: #ffd700;
    text-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
    font-size: 1.2rem;
}

.upgrade-footer {
    width: 100%;
    max-width: 500px;
    margin-top: 20px;
    padding: 20px 0;
    display: flex;
    justify-content: center;
    background: rgba(0, 0, 0, 0.9);
    position: sticky;
    bottom: 0;
    z-index: 2;
}

#close-upgrade {
    width: 200px;
    background: linear-gradient(135deg, #ff6b6b 0%, #ef476f 100%);
    box-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
}

#close-upgrade:hover {
    box-shadow: 0 0 15px rgba(255, 107, 107, 0.7);
}

.coin-container {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.coin-rate {
    color: #ffd700;
    text-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
    font-size: 0.9rem;
    padding: 3px 10px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 5px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.game-over-buttons {
    display: flex;
    gap: 20px;
    margin-top: 20px;
}

.game-over-buttons button {
    min-width: 120px;
}

#upgrade-after-game {
    background: linear-gradient(135deg, #ffd700 0%, #ffa500 100%);
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

#upgrade-after-game:hover {
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.7);
}

#upgrade-coin-rate {
    background: linear-gradient(135deg, #ffd700 0%, #ffa500 100%);
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

#upgrade-coin-rate:hover {
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.7);
}

.food-chance-container {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: space-between;
    margin-bottom: 15px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 5px;
    padding: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.food-chance-item {
    flex: 1;
    min-width: 120px;
    text-align: center;
    padding: 5px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
}

#reroll-chances {
    width: 100%;
    background: linear-gradient(135deg, #ffd700 0%, #ffa500 100%);
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

#reroll-chances:hover {
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.7);
}

@media (max-width: 650px) {
    .game-container {
        width: 95%;
    }
    .game-area { height: 300px; }
    .game-header { font-size: 1rem; }
    button { font-size: 1rem; padding: 8px 16px; }
    .game-over h2 { font-size: 2rem; }
    .game-over p { font-size: 1.2rem; }
    .upgrade-coin-display { font-size: 1rem; }
    .upgrade-footer { padding: 10px 0; }
    #close-upgrade { width: 150px; }
    .food-chance-item { min-width: 100px; font-size: 0.9rem; }
    .game-status { top: 5px; left: 5px; }
    .speed-status { font-size: 0.8rem; padding: 3px 8px; }
}


```

```typescriptreact
*** Begin Patch
*** Update File: /Users/hongyan/NTU/網路程式服務設計/hw2/src/App.tsx
@@
-import { useState } from 'react'
-import reactLogo from './assets/react.svg'
-import viteLogo from '/vite.svg'
-import './App.css'
-
-function App() {
-  const [count, setCount] = useState(0)
-
-  return (
-    <>
-      <div>
-        <a href="https://vitejs.dev" target="_blank">
-          <img src={viteLogo} className="logo" alt="Vite logo" />
-        </a>
-        <a href="https://react.dev" target="_blank">
-          <img src={reactLogo} className="logo react" alt="React logo" />
-        </a>
-      </div>
-      <h1>Vite + React</h1>
-      <div className="card">
-        <button onClick={() => setCount((count) => count + 1)}>
-          count is {count}
-        </button>
-        <p>
-          Edit <code>src/App.tsx</code> and save to test HMR
-        </p>
-      </div>
-      <p className="read-the-docs">
-        Click on the Vite and React logos to learn more
-      </p>
-    </>
-  )
-}
-
-export default App
+import Snake from './components/Snake';
+
+export default function App() {
+  return <Snake />;
+}
*** End Patch
```

```typescriptreact
import Snake from './components/Snake';

export default function App() {
  return <Snake />;
}

```

- I scaffolded `hw2` using Vite (React + TypeScript), installed dependencies, ported your Snake game into a React component, added the styles, and initialized git with an initial commit.
- You can run it now.

How to run:
- cd into `hw2`, then:
```bash
cd "/Users/hongyan/NTU/網路程式服務設計/hw2"
npm run dev
```

What I added:
- React component at `src/components/Snake.tsx` rendering your UI and canvas.
- Game logic at `src/snake.ts` (ported from your `Snake (1).js` and wired to the DOM IDs used by the component).
- Styles at `src/snake.css` (ported from `snake.css`).
- App entry `src/App.tsx` now renders the Snake component.

Git:
- Initialized repo in `hw2` and made the first commit with all the new files.

If you want me to tweak game logic or improve React-idiomatic cleanup for timers, say the word.

```shellscript
cd "/Users/hongyan/NTU/網路程式服務設計/hw2"
npm run dev
```

---

**User**

貪食蛇有時候會出現幻影，然後分裂

---

**Cursor**

I'll remove React StrictMode from `src/main.tsx` to prevent double-mounting in development (which created duplicate game instances and event listeners causing “ghost” and split effects). Then I'll update the Snake component to properly clean up intervals on unmount.

I'll remove React StrictMode to avoid double-mount in development and add cleanup to stop timers on unmount to prevent duplicate updates. Now making the edits.

```typescriptreact
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <App />,
)

```

I'll add a `stop()` method to the game class to clear timers and deactivate the game, and call it during React unmount. Then I'll commit the fix.

```typescript
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



```

```typescriptreact
import { useEffect } from 'react';
import SnakeGame from '../snake';
import '../snake.css';

export default function Snake() {
  useEffect(() => {
    const game = new SnakeGame();
    return () => {
      try { (game as any).stop?.(); } catch {}
    };
  }, []);

  return (
    <div className="game-container">
      <div className="game-header">
        <div className="score-container">
          <div className="score">分數: <span id="score">0</span></div>
          <div className="title">稱號: <span id="title">新手</span></div>
        </div>
        <div className="high-score-container">
          <div className="high-score">最高分: <span id="high-score">0</span></div>
          <div className="high-score-title">最高稱號: <span id="high-score-title">新手</span></div>
        </div>
        <div className="coin-container">
          <div className="coins">金幣: <span id="coins">0</span></div>
          <div className="coin-rate">金幣倍率: <span id="coin-rate">1</span>x</div>
        </div>
      </div>
      <div className="game-area">
        <div className="game-status">
          <div className="speed-status" id="speed-status"></div>
        </div>
        <canvas id="game-canvas"></canvas>
      </div>
      <div className="game-controls">
        <button id="start-btn">開始遊戲</button>
        <button id="pause-btn">暫停</button>
        <button id="upgrade-btn">升級</button>
      </div>
      <div className="game-over" id="game-over">
        <h2>遊戲結束</h2>
        <p>最終分數: <span id="final-score">0</span></p>
        <p>最終稱號: <span id="final-title">新手</span></p>
        <p>獲得金幣: <span id="earned-coins">0</span></p>
        <div className="game-over-buttons">
          <button id="restart-btn">再玩一次</button>
          <button id="upgrade-after-game">升級</button>
        </div>
      </div>
      <div className="upgrade-screen" id="upgrade-screen">
        <h2>升級商店</h2>
        <div className="upgrade-coin-display">
          <span>當前金幣: <span id="upgrade-screen-coins">0</span></span>
        </div>
        <div className="upgrade-section">
          <h3>金幣轉換率</h3>
          <div className="upgrade-item">
            <span>當前倍率: <span id="current-coin-rate">1</span>x</span>
            <span>升級後: <span id="next-coin-rate">2</span>x</span>
            <button id="upgrade-coin-rate">升級 (500金幣)</button>
          </div>
        </div>
        <div className="upgrade-section">
          <h3>食物升級</h3>
          <div className="food-info">
            <div className="food-type">
              <span className="food-color" style={{ backgroundColor: '#ff6b6b' }}></span>
              <span>紅色食物：</span>
              <span id="normal-food-points">10</span>分
              <span id="normal-food-chance">60%</span>
            </div>
            <div className="food-type">
              <span className="food-color" style={{ backgroundColor: '#ffd166' }}></span>
              <span>黃色食物：</span>
              <span id="fast-food-points">25</span>分
              <span id="fast-food-chance">15%</span>
            </div>
            <div className="food-type">
              <span className="food-color" style={{ backgroundColor: '#06d6a0' }}></span>
              <span>綠色食物：</span>
              <span id="slow-food-points">20</span>分
              <span id="slow-food-chance">15%</span>
            </div>
            <div className="food-type">
              <span className="food-color" style={{ backgroundColor: '#118ab2' }}></span>
              <span>藍色食物：</span>
              <span id="bonus-food-points">25</span>分
              <span id="bonus-food-chance">10%</span>
            </div>
          </div>
          <div className="upgrade-buttons">
            <button id="upgrade-food">升級食物 (30金幣)</button>
            <button id="upgrade-food-multi">升級食物 x5 (150金幣)</button>
          </div>
        </div>
        <div className="upgrade-section">
          <button id="reroll-chances">重新抽取機率 (200金幣)</button>
        </div>
        <button id="close-upgrade">關閉</button>
      </div>
    </div>
  );
}



```

- 已修正「幻影、分裂」問題：在開發模式下 React StrictMode 會二次裝載，導致重複建立遊戲和事件監聽器。我已移除 `StrictMode` 並在卸載時正確清理計時器。

你可以重啟開發伺服器測試：
```bash
cd "/Users/hongyan/NTU/網路程式服務設計/hw2"
npm run dev
```

變更重點
- 移除 StrictMode：`src/main.tsx` 現在直接渲染 `<App />`。
- 加入清理邏輯：`src/snake.ts` 新增 `stop()`，清掉 `setInterval`/`setTimeout` 並停用遊戲；`src/components/Snake.tsx` 的 `useEffect` 在 unmount 時呼叫 `game.stop()`。
- 已提交到 git，訊息為「fix: prevent duplicate game instances causing ghost/split snake (disable StrictMode, add cleanup)」

```shellscript
cd "/Users/hongyan/NTU/網路程式服務設計/hw2"
npm run dev
```

---

**User**

把遊戲玩法寫入@README.md 

---

**Cursor**

I'll add a Gameplay section to `hw2/README.md` describing controls, goals, food types, upgrades, and coins, then commit the change.

```markdown
*** Begin Patch
*** Update File: /Users/hongyan/NTU/網路程式服務設計/hw2/README.md
@@
 You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:
@@
 ```
 
 ```
+
+## 遊戲玩法（貪食蛇 Snake）
+
+### 目標
+- 控制蛇吃到食物，累積分數並盡量生存更久。
+- 遊戲結束時會依分數轉換為金幣，可用於升級。
+
+### 操作
+- 鍵盤方向鍵或 WASD 控制方向。
+- 手機/觸控裝置：在遊戲區域內滑動方向控制蛇的移動。
+- 按鈕：
+  - 「開始遊戲」：開始或重新開始一局。
+  - 「暫停/繼續」：暫停或繼續遊戲。
+  - 「升級」：開啟升級商店（遊戲結束畫面也可進入）。
+
+### 食物類型與效果
+- 紅色（normal）：基礎分數，最常見。
+- 黃色（fast）：加速一段時間，分數較高。
+- 綠色（slow）：減速一段時間，較容易操控。
+- 藍色（bonus）：加成類型（隨版本調整），提升得分效率。
+
+提示：隨著分數提升，基礎移動速度會線性加快。吃到加速/減速食物會有短暫速度效果，效果結束後會回到當前對應分數的基礎速度。
+
+### 升級與金幣
+- 金幣來源：遊戲結束時，依最終分數 × 金幣倍率 轉換為金幣。
+- 升級商店內容：
+  - 金幣轉換率：提高分數換金幣的倍率（有成本、遞增）。
+  - 食物升級：隨機提升一種食物的得分能力（可一次升 1 或 5 級）。
+  - 重新抽取機率：重抽各食物的出現機率，使玩法更具變化。
+
+### 稱號與顏色
+- 分數達到不同門檻會變更稱號與蛇的顏色：
+  - 0：新手
+  - 100：初學者
+  - 300：熟練者
+  - 500：高手
+  - 1000：大師
+  - 2000：傳奇
+
+### 其他
+- 本遊戲為純前端 React + TypeScript（Vite）實作，遊戲資料（最高分、金幣、升級）儲存在瀏覽器 localStorage。
+- 若遇到顯示或資料異常，可嘗試在升級商店中使用清除資料按鈕（如有顯示）。
*** End Patch
```

```markdown
*** Begin Patch
*** Update File: /Users/hongyan/NTU/網路程式服務設計/hw2/README.md
@@
 You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:
@@
 ```js
 // eslint.config.js
 import reactX from 'eslint-plugin-react-x'
 import reactDom from 'eslint-plugin-react-dom'
@@
 ]
 ```
+
+## 遊戲玩法（貪食蛇 Snake）
+
+### 目標
+- 控制蛇吃到食物，累積分數並盡量生存更久。
+- 遊戲結束時會依分數轉換為金幣，可用於升級。
+
+### 操作
+- 鍵盤方向鍵或 WASD 控制方向。
+- 手機/觸控裝置：在遊戲區域內滑動方向控制蛇的移動。
+- 按鈕：
+  - 「開始遊戲」：開始或重新開始一局。
+  - 「暫停/繼續」：暫停或繼續遊戲。
+  - 「升級」：開啟升級商店（遊戲結束畫面也可進入）。
+
+### 食物類型與效果
+- 紅色（normal）：基礎分數，最常見。
+- 黃色（fast）：加速一段時間，分數較高。
+- 綠色（slow）：減速一段時間，較容易操控。
+- 藍色（bonus）：加成類型（隨版本調整），提升得分效率。
+
+提示：隨著分數提升，基礎移動速度會線性加快。吃到加速/減速食物會有短暫速度效果，效果結束後會回到當前對應分數的基礎速度。
+
+### 升級與金幣
+- 金幣來源：遊戲結束時，依最終分數 × 金幣倍率 轉換為金幣。
+- 升級商店內容：
+  - 金幣轉換率：提高分數換金幣的倍率（有成本、遞增）。
+  - 食物升級：隨機提升一種食物的得分能力（可一次升 1 或 5 級）。
+  - 重新抽取機率：重抽各食物的出現機率，使玩法更具變化。
+
+### 稱號與顏色
+- 分數達到不同門檻會變更稱號與蛇的顏色：
+  - 0：新手
+  - 100：初學者
+  - 300：熟練者
+  - 500：高手
+  - 1000：大師
+  - 2000：傳奇
+
+### 其他
+- 本遊戲為純前端 React + TypeScript（Vite）實作，遊戲資料（最高分、金幣、升級）儲存在瀏覽器 localStorage。
+- 若遇到顯示或資料異常，可嘗試在升級商店中使用清除資料按鈕（如有顯示）。
*** End Patch
```

I'll append a Gameplay section to the end of `hw2/README.md` describing controls, goals, food types, upgrades, and coins, then commit the change.

```markdown
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## 遊戲玩法（貪食蛇 Snake）

### 目標
- 控制蛇吃到食物，累積分數並盡量生存更久。
- 遊戲結束時會依分數轉換為金幣，可用於升級。

### 操作
- 鍵盤方向鍵或 WASD 控制方向。
- 手機/觸控裝置：在遊戲區域內滑動方向控制蛇的移動。
- 按鈕：
  - 「開始遊戲」：開始或重新開始一局。
  - 「暫停/繼續」：暫停或繼續遊戲。
  - 「升級」：開啟升級商店（遊戲結束畫面也可進入）。

### 食物類型與效果
- 紅色（normal）：基礎分數，最常見。
- 黃色（fast）：加速一段時間，分數較高。
- 綠色（slow）：減速一段時間，較容易操控。
- 藍色（bonus）：加成類型（隨版本調整），提升得分效率。

提示：隨著分數提升，基礎移動速度會線性加快。吃到加速/減速食物會有短暫速度效果，效果結束後會回到當前對應分數的基礎速度。

### 升級與金幣
- 金幣來源：遊戲結束時，依最終分數 × 金幣倍率 轉換為金幣。
- 升級商店內容：
  - 金幣轉換率：提高分數換金幣的倍率（有成本、遞增）。
  - 食物升級：隨機提升一種食物的得分能力（可一次升 1 或 5 級）。
  - 重新抽取機率：重抽各食物的出現機率，使玩法更具變化。

### 稱號與顏色
- 分數達到不同門檻會變更稱號與蛇的顏色：
  - 0：新手
  - 100：初學者
  - 300：熟練者
  - 500：高手
  - 1000：大師
  - 2000：傳奇

### 其他
- 本遊戲為純前端 React + TypeScript（Vite）實作，遊戲資料（最高分、金幣、升級）儲存在瀏覽器 localStorage。
- 若遇到顯示或資料異常，可嘗試在升級商店中使用清除資料按鈕（如有顯示）。

```

已將「遊戲玩法」寫入 `hw2/README.md`，包含：
- 操作方式（鍵盤、觸控、功能按鈕）
- 目標與結束換金幣
- 食物類型與效果
- 升級項目與金幣來源
- 分數稱號門檻與顏色
- 其他注意事項（localStorage 等）

已提交至 git，訊息為「docs: add gameplay instructions (controls, food types, upgrades, titles)」。

---

**User**

請於 README.md 內說明遊戲的安裝

---

**Cursor**

I'm going to add an 安裝與執行 section to `hw2/README.md` with prerequisites and commands to install, run in dev, build, and preview, then commit the change.

```markdown
## 遊戲玩法（貪食蛇 Snake）

### 目標
- 控制蛇吃到食物，累積分數並盡量生存更久。
- 遊戲結束時會依分數轉換為金幣，可用於升級。

### 操作
- 鍵盤方向鍵或 WASD 控制方向。
- 手機/觸控裝置：在遊戲區域內滑動方向控制蛇的移動。
- 按鈕：
  - 「開始遊戲/重新開始」：開始或重新開始一局。
  - 「暫停/繼續」：暫停或繼續遊戲。
  - 「升級」：開啟升級商店（遊戲結束畫面也可進入）。

### 食物類型與效果
- 紅色（normal）：基礎分數，最常見。
- 黃色（fast）：加速一段時間，分數較高。
- 綠色（slow）：減速一段時間，較容易操控。
- 藍色（bonus）：稀有食物，分數較高。

提示：隨著分數提升，基礎移動速度會線性加快。吃到加速/減速食物會有短暫速度效果，效果結束後會回到當前對應分數的基礎速度。

### 升級與金幣
- 金幣來源：遊戲結束時，依最終分數 × 金幣倍率 轉換為金幣。
- 升級商店內容：
  - 金幣轉換率：提高分數換金幣的倍率（有成本、遞增）。
  - 食物升級：隨機提升一種食物的得分能力（可一次升 1 或 5 級）。
  - 重新抽取機率：重抽各食物的出現機率，使玩法更具變化。

### 稱號與顏色
- 分數達到不同門檻會變更稱號與蛇的顏色：
  - 0：新手
  - 100：初學者
  - 300：熟練者
  - 500：高手
  - 1000：大師
  - 2000：傳奇

### 其他
- 本遊戲為純前端 React + TypeScript（Vite）實作，遊戲資料（最高分、金幣、升級）儲存在瀏覽器 localStorage。
- 若遇到顯示或資料異常，可嘗試在升級商店中使用清除資料按鈕（如有顯示）。

## 安裝與執行

### 需求
- Node.js 18+（建議 20+）
- npm 9+（或使用 pnpm/yarn，指令請自行替換）

### 安裝步驟
1) 進入專案資料夾：
```bash
cd "/Users/hongyan/NTU/網路程式服務設計/hw2"
```

2) 安裝相依套件：
```bash
npm install
```

3) 啟動開發伺服器（含熱更新）：
```bash
npm run dev
```
啟動後依終端顯示之網址（通常是 http://localhost:5173/）在瀏覽器開啟。

### 建置與預覽
建置生產版：
```bash
npm run build
```

本機預覽產出：
```bash
npm run preview
```
預設會在本機起一個靜態伺服器預覽 `dist/`。

```

- 我已在 `hw2/README.md` 新增「安裝與執行」章節，包含需求 (Node/npm)、安裝步驟、啟動開發伺服器、建置與預覽的指令。
- 已提交到 git，訊息為「docs: add installation and run instructions (dev/build/preview)」。

---

**User**

我調整了@README.md ，請幫我重新調整格式

---

**Cursor**

Let me open the current README to see your changes and normalize headings, spacing, and code blocks. I'll then apply the formatting fixes and commit.

```markdown
# 遊戲名稱（貪食蛇）
此遊戲改寫於經典遊戲貪食蛇，遊戲的升級及速度調整機制皆由本作者（黃泓諺）所發想。

## 安裝與執行

### 需求
- Node.js 18+（建議 20+）
- npm 9+（或使用 pnpm/yarn，指令請自行替換）

### 安裝步驟
1) 進入專案資料夾：
```bash
cd "檔案下載到的地方"
```

2) 安裝相依套件：
```bash
npm install
```

3) 啟動開發伺服器（含熱更新）：
```bash
npm run dev
```
啟動後依終端顯示之網址（通常是 http://localhost:5173/）在瀏覽器開啟。

## 遊戲玩法（貪食蛇 Snake）

### 目標
- 控制蛇吃到食物，累積分數並盡量生存更久。
- 遊戲結束時會依分數轉換為金幣，可用於升級。

### 操作
- 鍵盤方向鍵或 WASD 控制方向。
- 手機/觸控裝置：在遊戲區域內滑動方向控制蛇的移動。
- 按鈕：
  - 「開始遊戲/重新開始」：開始或重新開始一局。
  - 「暫停/繼續」：暫停或繼續遊戲。
  - 「升級」：開啟升級商店（遊戲結束畫面也可進入）。

### 食物類型與效果
- 紅色（normal）：基礎分數，最常見。
- 黃色（fast）：加速一段時間，分數較高。
- 綠色（slow）：減速一段時間，較容易操控。
- 藍色（bonus）：稀有食物，分數較高。

提示：隨著分數提升，基礎移動速度會線性加快。吃到加速/減速食物會有短暫速度效果，效果結束後會回到當前對應分數的基礎速度。

### 升級與金幣
- 金幣來源：遊戲結束時，依最終分數 × 金幣倍率 轉換為金幣。
- 升級商店內容：
  - 金幣轉換率：提高分數換金幣的倍率（有成本、遞增）。
  - 食物升級：隨機提升一種食物的得分能力（可一次升 1 或 5 級）。
  - 重新抽取機率：重抽各食物的出現機率，使玩法更具變化。

### 稱號與顏色
- 分數達到不同門檻會變更稱號與蛇的顏色：
  - 0：新手
  - 100：初學者
  - 300：熟練者
  - 500：高手
  - 1000：大師
  - 2000：傳奇

### 其他
- 本遊戲為純前端 React + TypeScript（Vite）實作，遊戲資料（最高分、金幣、升級）儲存在瀏覽器 localStorage。
- 若遇到顯示或資料異常，可嘗試在升級商店中使用清除資料按鈕（如有顯示）。


```

- 我已整理 `hw2/README.md` 的格式：
  - 將開頭標題改為 `# 遊戲名稱（貪食蛇）`
  - 調整段落與空白行、一致的子標題層級
  - 統一程式碼區塊為三反引號並加上語言標籤
  - 在敘述結尾補上句號，讓排版一致

- 已提交到 git，訊息為「docs: tidy README headings, spacing, and code block formatting」。

---

**User**

嘗試在升級商店中新增清除資料按鈕

---

**Cursor**

I'll add a "清除資料" button to the upgrade screen UI and rely on the existing `clearAllData` handler in the game class to perform the action. Then I'll commit the changes.

```typescriptreact
import { useEffect } from 'react';
import SnakeGame from '../snake';
import '../snake.css';

export default function Snake() {
  useEffect(() => {
    const game = new SnakeGame();
    return () => {
      try { (game as any).stop?.(); } catch {}
    };
  }, []);

  return (
    <div className="game-container">
      <div className="game-header">
        <div className="score-container">
          <div className="score">分數: <span id="score">0</span></div>
          <div className="title">稱號: <span id="title">新手</span></div>
        </div>
        <div className="high-score-container">
          <div className="high-score">最高分: <span id="high-score">0</span></div>
          <div className="high-score-title">最高稱號: <span id="high-score-title">新手</span></div>
        </div>
        <div className="coin-container">
          <div className="coins">金幣: <span id="coins">0</span></div>
          <div className="coin-rate">金幣倍率: <span id="coin-rate">1</span>x</div>
        </div>
      </div>
      <div className="game-area">
        <div className="game-status">
          <div className="speed-status" id="speed-status"></div>
        </div>
        <canvas id="game-canvas"></canvas>
      </div>
      <div className="game-controls">
        <button id="start-btn">開始遊戲</button>
        <button id="pause-btn">暫停</button>
        <button id="upgrade-btn">升級</button>
      </div>
      <div className="game-over" id="game-over">
        <h2>遊戲結束</h2>
        <p>最終分數: <span id="final-score">0</span></p>
        <p>最終稱號: <span id="final-title">新手</span></p>
        <p>獲得金幣: <span id="earned-coins">0</span></p>
        <div className="game-over-buttons">
          <button id="restart-btn">再玩一次</button>
          <button id="upgrade-after-game">升級</button>
        </div>
      </div>
      <div className="upgrade-screen" id="upgrade-screen">
        <h2>升級商店</h2>
        <div className="upgrade-coin-display">
          <span>當前金幣: <span id="upgrade-screen-coins">0</span></span>
        </div>
        <div className="upgrade-section">
          <h3>金幣轉換率</h3>
          <div className="upgrade-item">
            <span>當前倍率: <span id="current-coin-rate">1</span>x</span>
            <span>升級後: <span id="next-coin-rate">2</span>x</span>
            <button id="upgrade-coin-rate">升級 (500金幣)</button>
          </div>
        </div>
        <div className="upgrade-section">
          <h3>食物升級</h3>
          <div className="food-info">
            <div className="food-type">
              <span className="food-color" style={{ backgroundColor: '#ff6b6b' }}></span>
              <span>紅色食物：</span>
              <span id="normal-food-points">10</span>分
              <span id="normal-food-chance">60%</span>
            </div>
            <div className="food-type">
              <span className="food-color" style={{ backgroundColor: '#ffd166' }}></span>
              <span>黃色食物：</span>
              <span id="fast-food-points">25</span>分
              <span id="fast-food-chance">15%</span>
            </div>
            <div className="food-type">
              <span className="food-color" style={{ backgroundColor: '#06d6a0' }}></span>
              <span>綠色食物：</span>
              <span id="slow-food-points">20</span>分
              <span id="slow-food-chance">15%</span>
            </div>
            <div className="food-type">
              <span className="food-color" style={{ backgroundColor: '#118ab2' }}></span>
              <span>藍色食物：</span>
              <span id="bonus-food-points">25</span>分
              <span id="bonus-food-chance">10%</span>
            </div>
          </div>
          <div className="upgrade-buttons">
            <button id="upgrade-food">升級食物 (30金幣)</button>
            <button id="upgrade-food-multi">升級食物 x5 (150金幣)</button>
          </div>
        </div>
        <div className="upgrade-section">
          <button id="reroll-chances">重新抽取機率 (200金幣)</button>
        </div>
        <div className="upgrade-section">
          <h3>資料管理</h3>
          <button id="clear-data">清除資料</button>
        </div>
        <button id="close-upgrade">關閉</button>
      </div>
    </div>
  );
}



```

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Arial', sans-serif;
    background: linear-gradient(135deg, #1a1a1a 0%, #2c3e50 100%);
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
}

.game-container {
    width: 600px;
    background: rgba(0, 0, 0, 0.7);
    border-radius: 20px;
    padding: 20px;
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
    position: relative;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.game-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 20px;
    font-size: 1.2rem;
    text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
    padding: 10px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
}

.score-container, .high-score-container, .coin-container {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.score, .high-score, .title, .high-score-title, .coins {
    position: relative;
    padding: 5px 15px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 5px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.coins {
    color: #ffd700;
    text-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
}

.game-area {
    width: 100%;
    height: 400px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    position: relative;
    overflow: hidden;
    box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
}

.game-status {
    position: absolute;
    top: 10px;
    left: 10px;
    display: flex;
    gap: 10px;
    z-index: 1;
}

.speed-status {
    padding: 5px 10px;
    border-radius: 5px;
    font-size: 0.9rem;
    font-weight: bold;
    opacity: 0;
    transition: opacity 0.3s ease;
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.speed-status.fast {
    opacity: 1;
    color: #ffd166;
    text-shadow: 0 0 5px rgba(255, 209, 102, 0.5);
    animation: pulse 1s infinite;
}

.speed-status.slow {
    opacity: 1;
    color: #06d6a0;
    text-shadow: 0 0 5px rgba(6, 214, 160, 0.5);
    animation: pulse 1.5s infinite;
}

@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
}

#game-canvas {
    width: 100%;
    height: 100%;
    display: block;
}

.game-controls {
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-top: 20px;
}

button {
    padding: 10px 20px;
    font-size: 1.2rem;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s ease;
    background: linear-gradient(135deg, #4ecdc4 0%, #45b7af 100%);
    color: white;
    box-shadow: 0 0 10px rgba(78, 205, 196, 0.5);
    position: relative;
    overflow: hidden;
}

button::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transform: translateX(-100%);
    transition: transform 0.6s ease;
}

button:hover::before {
    transform: translateX(100%);
}

button:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 15px rgba(78, 205, 196, 0.7);
}

button:active {
    transform: translateY(0);
}

.game-over {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 10;
    display: none;
    backdrop-filter: blur(5px);
}

.game-over h2 {
    font-size: 3rem;
    margin-bottom: 20px;
    color: #ff6b6b;
    text-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
    animation: pulse 2s infinite;
}

.game-over p {
    font-size: 1.5rem;
    margin-bottom: 15px;
    color: #4ecdc4;
}

.upgrade-screen {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    z-index: 10;
    display: none;
    backdrop-filter: blur(5px);
    padding: 20px;
    overflow-y: auto;
    max-height: 100vh;
}

.upgrade-coin-display {
    width: 100%;
    max-width: 500px;
    text-align: center;
    padding: 10px;
    margin-bottom: 20px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.upgrade-coin-display span {
    color: #ffd700;
    text-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
    font-size: 1.2rem;
}

.upgrade-footer {
    width: 100%;
    max-width: 500px;
    margin-top: 20px;
    padding: 20px 0;
    display: flex;
    justify-content: center;
    background: rgba(0, 0, 0, 0.9);
    position: sticky;
    bottom: 0;
    z-index: 2;
}

#close-upgrade {
    width: 200px;
    background: linear-gradient(135deg, #ff6b6b 0%, #ef476f 100%);
    box-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
}

#close-upgrade:hover {
    box-shadow: 0 0 15px rgba(255, 107, 107, 0.7);
}

.coin-container {
    display: flex;
    flex-direction: column;
    gap: 5px;
}

.coin-rate {
    color: #ffd700;
    text-shadow: 0 0 5px rgba(255, 215, 0, 0.5);
    font-size: 0.9rem;
    padding: 3px 10px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 5px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.game-over-buttons {
    display: flex;
    gap: 20px;
    margin-top: 20px;
}

.game-over-buttons button {
    min-width: 120px;
}

#upgrade-after-game {
    background: linear-gradient(135deg, #ffd700 0%, #ffa500 100%);
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

#upgrade-after-game:hover {
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.7);
}

#upgrade-coin-rate {
    background: linear-gradient(135deg, #ffd700 0%, #ffa500 100%);
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

#upgrade-coin-rate:hover {
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.7);
}

.food-chance-container {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: space-between;
    margin-bottom: 15px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 5px;
    padding: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.food-chance-item {
    flex: 1;
    min-width: 120px;
    text-align: center;
    padding: 5px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
}

#reroll-chances {
    width: 100%;
    background: linear-gradient(135deg, #ffd700 0%, #ffa500 100%);
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

#reroll-chances:hover {
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.7);
}

/* Clear data button */
#clear-data {
    width: 100%;
    margin-top: 10px;
    background: linear-gradient(135deg, #ff6b6b 0%, #ef476f 100%);
    box-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
}

#clear-data:hover {
    box-shadow: 0 0 15px rgba(255, 107, 107, 0.7);
}

@media (max-width: 650px) {
    .game-container {
        width: 95%;
    }
    .game-area { height: 300px; }
    .game-header { font-size: 1rem; }
    button { font-size: 1rem; padding: 8px 16px; }
    .game-over h2 { font-size: 2rem; }
    .game-over p { font-size: 1.2rem; }
    .upgrade-coin-display { font-size: 1rem; }
    .upgrade-footer { padding: 10px 0; }
    #close-upgrade { width: 150px; }
    .food-chance-item { min-width: 100px; font-size: 0.9rem; }
    .game-status { top: 5px; left: 5px; }
    .speed-status { font-size: 0.8rem; padding: 3px 8px; }
}



```

- 已在升級商店加入「清除資料」按鈕，ID 為 `clear-data`，會呼叫現有的 `clearAllData`。UI 與樣式皆已新增。
- 已提交到 git，訊息為「feat(upgrade): add clear-data button to upgrade screen and styles」。

---

**User**

我手動刪除了清除資料的功能，現在要push到我的github上
請將所有作業內容放在 wp1141/hw2 內，並在繳交截止時間前將你的作業 push 到你 GitHub 上 wp1141 這個 repo 上面的 main branch：
# in wp1141/, on the `main` branch
git add hw2
git commit -m "<some comment>"
git push

---

**Cursor**

I'll move the Vite project into a new `wp1141/hw2` directory, initialize a fresh git repo at `wp1141`, make a commit on main, and then prompt you to provide your GitHub remote URL so I can add it and push. Now moving files and setting up git.

- 我已將整個作業移動到 `wp1141/hw2`，並在 `wp1141/` 初始化 git，建立 `main` 分支，完成第一次提交。
- 請提供你的 GitHub 遠端倉庫 URL（例如 `https://github.com/<你的帳號>/wp1141.git`）。我會幫你設定 remote 並 push。

若你已經建立好遠端 repo，也可以直接執行：
```bash
cd "/Users/hongyan/NTU/網路程式服務設計/wp1141"
git remote add origin https://github.com/<你的帳號>/wp1141.git
git push -u origin main
```

```shellscript
cd "/Users/hongyan/NTU/網路程式服務設計/wp1141"
git remote add origin https://github.com/<你的帳號>/wp1141.git
git push -u origin main
```

---

**User**

已經建立好了，我的帳號是hongyan1215.github.io

---

**Cursor**

I'll add your GitHub remote and push the `main` branch. If the username is actually without `.github.io`, I'll adjust based on any error returned and let you know. Now pushing.

I'll pull the remote main with rebase to integrate any existing commits (e.g., a default README), then push again.

你的遠端 repo 已設定為 `https://github.com/hongyan1215/wp1141.git`，但遠端已有提交，需決定要「合併」還是「覆蓋」。

請選擇其一：
- 合併遠端（保留遠端例如 README）：我會執行 rebase 後再推送。
- 覆蓋遠端（以本地為準）：我會強制推送。

給我你的選擇，我就直接幫你跑對應指令。若要自己執行，指令如下：

合併遠端（建議）
```bash
cd "/Users/hongyan/NTU/網路程式服務設計/wp1141"
git pull --rebase origin main
git push -u origin main
```

覆蓋遠端（請確認）
```bash
cd "/Users/hongyan/NTU/網路程式服務設計/wp1141"
git push -u origin main --force-with-lease
```

```shellscript
cd "/Users/hongyan/NTU/網路程式服務設計/wp1141"
git pull --rebase origin main
git push -u origin main
```

```shellscript
cd "/Users/hongyan/NTU/網路程式服務設計/wp1141"
git push -u origin main --force-with-lease
```

---

**User**

強制推送

---

**Cursor**

我要強制推送到遠端的 main 分支。完成後我會確認結果。

I'll fetch remote refs to refresh the lease, then force-push again.

要完成強制推送，請確認我可以繼續執行以下步驟，或你也可自行貼上執行：

選項 A（保留保險機制）
```bash
cd "/Users/hongyan/NTU/網路程式服務設計/wp1141"
git fetch origin main
git push -u origin main --force-with-lease
```

選項 B（直接強制，不檢查 lease）
```bash
cd "/Users/hongyan/NTU/網路程式服務設計/wp1141"
git push -u origin main --force
```

要我用哪個？我可以立即幫你執行。

```shellscript
cd "/Users/hongyan/NTU/網路程式服務設計/wp1141"
git fetch origin main
git push -u origin main --force-with-lease
```

```shellscript
cd "/Users/hongyan/NTU/網路程式服務設計/wp1141"
git push -u origin main --force
```

---

**User**

我wp1141的其他檔案呢

---

**Cursor**

I'll check what's currently inside `wp1141/` so I can confirm which files are present and explain where others went.

目前 `wp1141/` 本機資料夾裡只有 `hw2/`（Vite 專案）。我沒有搬動/加入其他檔案到 `wp1141/`，所以本機與待推送內容就只包含 `hw2`。

你說的「其他檔案」有兩種可能：
- 你 GitHub 遠端 `wp1141` 上原本就有的檔案（例如 README 等）。如果我們強制推送，這些遠端檔案會被覆蓋掉。
- 你本機其他作業或資料夾（例如 `hw1/` 等）。目前還沒被放進 `wp1141/`，所以不在此次提交內。

你要怎麼處理比較好？
- 若要「保留遠端現有檔案並整合 hw2」：我可以先把遠端抓下來，合併後再推上去。
- 若要「只保留 hw2，覆蓋遠端」：我直接強制推送。

告訴我你的選擇，或指定還要把哪些本機資料夾一起加到 `wp1141/`。我就幫你完成並推上去。

---

**User**

被蓋掉了可以復原嗎

---

**Cursor**

好消息：目前還沒覆蓋到遠端。剛才強制推送失敗（被拒絕），所以 GitHub 上原本的檔案還在，無需復原。

如果未來真的不小心強制推送覆蓋了，也能復原：
- GitHub 介面法：到 repo 的 main 分支「Commits」頁，找到被覆蓋前的那個 commit，按「Revert」或從該 commit 建新分支，再開 PR 合併回來。
- 透過 SHA 復原：在「Insights -> Network」或「Settings -> Branches -> Force pushes」事件中找到被覆蓋前的 commit SHA，然後本機執行：
```bash
git fetch origin
git checkout -b recovery <那個舊的_commit_SHA>
# 檢查內容後，恢復 main
git checkout main
git reset --hard <那個舊的_commit_SHA>
git push -u origin main --force-with-lease
```

建議現在做法（避免覆蓋，保留遠端檔案）：
```bash
cd "/Users/hongyan/NTU/網路程式服務設計/wp1141"
git pull --rebase origin main
git push -u origin main
```

要我直接幫你做「保留遠端並合併 hw2」嗎？還是你堅持覆蓋遠端（我可以改用 --force 完成，但就會把遠端其他檔案蓋掉）。

```shellscript
git fetch origin
git checkout -b recovery <那個舊的_commit_SHA>
# 檢查內容後，恢復 main
git checkout main
git reset --hard <那個舊的_commit_SHA>
git push -u origin main --force-with-lease
```

```shellscript
cd "/Users/hongyan/NTU/網路程式服務設計/wp1141"
git pull --rebase origin main
git push -u origin main
```

---

**User**

那我本地的檔案呢

---

**Cursor**

你的本地檔案都還在，而且已經被提交到本地 `wp1141` 版本庫中：
- 路徑: `/Users/hongyan/NTU/網路程式服務設計/wp1141/hw2`
- 目前狀態: 已在 `wp1141` 的 `main` 分支做過 commit（含整個 `hw2` 專案）

你可以自行確認：
```bash
cd "/Users/hongyan/NTU/網路程式服務設計/wp1141"
git status
ls -la hw2
```

想更安心的話，可以先做一份本地備份：
```bash
# 建一個備份分支
git checkout -b backup/local-safe-copy

# 或打包備份
cd "/Users/hongyan/NTU/網路程式服務設計"
zip -r wp1141_backup.zip wp1141
```

下一步建議：
- 若要保留 GitHub 上原有檔案：我可以幫你做 rebase 合併再推送。
- 若確定只保留本地內容覆蓋遠端：我可以直接執行強制推送。

```shellscript
cd "/Users/hongyan/NTU/網路程式服務設計/wp1141"
git status
ls -la hw2
```

```shellscript
# 建一個備份分支
git checkout -b backup/local-safe-copy

# 或打包備份
cd "/Users/hongyan/NTU/網路程式服務設計"
zip -r wp1141_backup.zip wp1141
```

---

**User**

我的wp1141原本本地還有其他檔案

---

**Cursor**

I'll quickly search your home directory for any other `wp1141` folders or files to locate your original content, so we can bring them back into this repo if needed.

I'll copy your new Vite React TS `hw2` into your existing Git repo at `/Users/hongyan/wp1141` (which contains your other homework), commit on main, and push so nothing else is lost.

我已把新的 `hw2` 專案放回你原本的本地 Git repo：`/Users/hongyan/wp1141`，並完成本地 commit（你的其他作業與資料都在這個 repo 裡）。

接下來要推送到 GitHub 上你的 `wp1141`：
- 若要保留 GitHub 的既有提交並整合：
```bash
cd "/Users/hongyan/wp1141"
git pull --rebase origin main
git push
```

- 若確定要以本地為準覆蓋 GitHub（可能會覆蓋遠端檔案，請慎用）：
```bash
cd "/Users/hongyan/wp1141"
git push --force-with-lease
```

要我幫你執行哪一個？

```shellscript
cd "/Users/hongyan/wp1141"
git pull --rebase origin main
git push
```

```shellscript
cd "/Users/hongyan/wp1141"
git push --force-with-lease
```

