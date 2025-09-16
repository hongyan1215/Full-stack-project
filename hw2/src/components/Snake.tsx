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


