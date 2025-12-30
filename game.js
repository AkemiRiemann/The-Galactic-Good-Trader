// ===== CONFIGURATION =====
const GAME_DURATION = 300; // 5 minutes in seconds
const TICK_INTERVAL = 2000; // Update prices every 2 seconds
const BOT_ACTION_INTERVAL = 4000; // Bots act every 4 seconds
const INITIAL_CREDITS = 10000;

// ===== ASSET DEFINITIONS =====
const ASSETS = {
    DOGE: {
        name: "Kristal Dilithium",
        ticker: "DOGE",
        description: "Kristal energi murni dari tambang asteroid",
        price: 100.0,
        volatility: 0.025, // 2.5% per tick
        drift: 0.0001,
        min: 10.0,
        max: 1000.0,
        icon: "💎",
        engine: "Random Walk"
    },
    GME: {
        name: "Komponen Quantum",
        ticker: "GME",
        description: "Suku cadang mesin warp drive langka",
        price: 500.0,
        volatility: 0.02, // 2% per tick
        drift: 0.0,
        min: 100.0,
        max: 2000.0,
        icon: "⚙️",
        engine: "Random Walk"
    },
    TECH: {
        name: "Inti Fusi",
        ticker: "TECH",
        description: "Reaktor fusi portabel untuk kapal luar angkasa",
        price: 800.0,
        volatility: 0.018, // 1.8% per tick
        drift: 0.0002,
        min: 200.0,
        max: 3000.0,
        icon: "⚡",
        engine: "Random Walk"
    },
    GOLD: {
        name: "Debu Bintang",
        ticker: "GOLD",
        description: "Partikel kosmik bernilai tinggi untuk penelitian",
        price: 1000.0,
        volatility: 0.01, // 1% per tick
        drift: 0.0,
        min: 500.0,
        max: 1500.0,
        icon: "✨",
        engine: "Random Walk"
    }
};

// ===== GAME STATE =====
let gameState = {
    timeLeft: GAME_DURATION,
    isRunning: true,
    prices: {},
    previousPrices: {},
    player: {
        name: "Anda",
        credits: INITIAL_CREDITS,
        cargo: {},
        totalAssetValue: INITIAL_CREDITS
    },
    bots: []
};

// ===== RANDOM NUMBER GENERATOR =====
// Box-Muller transform for normal distribution
function randomNormal() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// ===== PRICE ENGINE =====
function initializePrices() {
    for (const ticker in ASSETS) {
        const asset = ASSETS[ticker];
        gameState.prices[ticker] = asset.price;
        gameState.previousPrices[ticker] = asset.price;
    }
}

function updatePrices() {
    for (const ticker in ASSETS) {
        const asset = ASSETS[ticker];
        const currentPrice = gameState.prices[ticker];
        
        // Random Walk: ΔP = μ + σ * Z, where Z ~ N(0,1)
        const z = randomNormal();
        const delta = asset.drift + asset.volatility * z;
        
        // Apply percentage change
        const newPrice = currentPrice * (1 + delta);
        
        // Store previous price for change indicator
        gameState.previousPrices[ticker] = currentPrice;
        
        // Clamp to bounds
        gameState.prices[ticker] = clamp(newPrice, asset.min, asset.max);
    }
}

// ===== BOT SYSTEM =====
const BOT_STRATEGIES = {
    RANDOM: "Random Trader",
    MOMENTUM: "Momentum Trader",
    MEAN_REVERT: "Mean Reverter",
    HODL: "HODL Master"
};

function createBot(name, strategy, credits = INITIAL_CREDITS) {
    return {
        name,
        strategy,
        credits,
        cargo: {},
        totalAssetValue: credits,
        isBot: true
    };
}

function initializeBots() {
    gameState.bots = [
        createBot("Bot Alpha", BOT_STRATEGIES.RANDOM),
        createBot("Bot Beta", BOT_STRATEGIES.MOMENTUM),
        createBot("Bot Gamma", BOT_STRATEGIES.MEAN_REVERT),
        createBot("Bot Delta", BOT_STRATEGIES.HODL)
    ];
}

function botAction(bot) {
    if (!gameState.isRunning) return;
    
    const tickers = Object.keys(ASSETS);
    const ticker = tickers[Math.floor(Math.random() * tickers.length)];
    const asset = ASSETS[ticker];
    const currentPrice = gameState.prices[ticker];
    const previousPrice = gameState.previousPrices[ticker];
    
    let shouldBuy = false;
    let shouldSell = false;
    
    // Strategy-based decision
    switch (bot.strategy) {
        case BOT_STRATEGIES.RANDOM:
            // 20% chance to buy, 20% chance to sell
            const rand = Math.random();
            shouldBuy = rand < 0.2;
            shouldSell = !shouldBuy && rand < 0.4;
            break;
            
        case BOT_STRATEGIES.MOMENTUM:
            // Buy if price is rising, sell if falling
            if (currentPrice > previousPrice * 1.01) shouldBuy = true;
            if (currentPrice < previousPrice * 0.99) shouldSell = true;
            break;
            
        case BOT_STRATEGIES.MEAN_REVERT:
            // Buy if price is low, sell if high (compared to initial price)
            if (currentPrice < asset.price * 0.95) shouldBuy = true;
            if (currentPrice > asset.price * 1.05) shouldSell = true;
            break;
            
        case BOT_STRATEGIES.HODL:
            // Mostly buy and hold, rarely sell
            shouldBuy = Math.random() < 0.3;
            shouldSell = Math.random() < 0.05;
            break;
    }
    
    // Execute action
    const quantity = Math.random() * 1.5 + 0.5; // 0.5 to 2.0 units
    
    if (shouldBuy) {
        executeTrade(bot, ticker, 'BUY', quantity);
    } else if (shouldSell) {
        executeTrade(bot, ticker, 'SELL', quantity);
    }
}

// ===== TRADING SYSTEM =====
function executeTrade(trader, ticker, action, quantity) {
    const price = gameState.prices[ticker];
    const cost = price * quantity;
    
    if (action === 'BUY') {
        if (trader.credits >= cost) {
            trader.credits -= cost;
            trader.cargo[ticker] = (trader.cargo[ticker] || 0) + quantity;
        }
    } else if (action === 'SELL') {
        if (trader.cargo[ticker] && trader.cargo[ticker] >= quantity) {
            trader.credits += cost;
            trader.cargo[ticker] -= quantity;
            if (trader.cargo[ticker] <= 0.01) {
                delete trader.cargo[ticker];
            }
        }
    }
    
    updateTraderValue(trader);
}

function updateTraderValue(trader) {
    let cargoValue = 0;
    for (const ticker in trader.cargo) {
        cargoValue += trader.cargo[ticker] * gameState.prices[ticker];
    }
    trader.totalAssetValue = trader.credits + cargoValue;
}

// ===== PLAYER ACTIONS =====
function buyAsset(ticker) {
    const quantity = 1.0; // Fixed quantity for simplicity
    executeTrade(gameState.player, ticker, 'BUY', quantity);
    updateUI();
}

function sellAsset(ticker) {
    const quantity = 1.0; // Fixed quantity for simplicity
    executeTrade(gameState.player, ticker, 'SELL', quantity);
    updateUI();
}

// ===== UI RENDERING =====
function formatNumber(num) {
    return Number(num || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function formatCurrency(num) {
    return `${formatNumber(num)} Cr`;
}

function renderMarketPrices() {
    const container = document.getElementById('marketPrices');
    container.innerHTML = '';
    
    for (const ticker in ASSETS) {
        const asset = ASSETS[ticker];
        const currentPrice = gameState.prices[ticker];
        const previousPrice = gameState.previousPrices[ticker];
        const priceChange = ((currentPrice - previousPrice) / previousPrice) * 100;
        const changeClass = priceChange > 0 ? 'up' : priceChange < 0 ? 'down' : '';
        const changeIcon = priceChange > 0 ? '↗' : priceChange < 0 ? '↘' : '→';
        
        const canBuy = gameState.player.credits >= currentPrice;
        const canSell = gameState.player.cargo[ticker] && gameState.player.cargo[ticker] >= 1.0;
        
        const card = document.createElement('div');
        card.className = 'asset-card';
        card.innerHTML = `
            <div class="asset-header">
                <div class="asset-icon">${asset.icon}</div>
                <div class="asset-info">
                    <div class="asset-name">${asset.name}</div>
                    <div class="asset-ticker">${ticker}</div>
                </div>
                <div>
                    <div class="asset-price">${formatCurrency(currentPrice)}</div>
                    <div class="price-change ${changeClass}">
                        ${changeIcon} ${Math.abs(priceChange).toFixed(2)}%
                    </div>
                </div>
            </div>
            <div class="asset-actions">
                <button class="btn btn-buy" onclick="buyAsset('${ticker}')" ${!canBuy ? 'disabled' : ''}>
                    Muat (1.0)
                </button>
                <button class="btn btn-sell" onclick="sellAsset('${ticker}')" ${!canSell ? 'disabled' : ''}>
                    Bongkar (1.0)
                </button>
            </div>
        `;
        container.appendChild(card);
    }
}

function renderStats() {
    document.getElementById('cashBalance').textContent = formatCurrency(gameState.player.credits);
    
    let cargoValue = 0;
    for (const ticker in gameState.player.cargo) {
        cargoValue += gameState.player.cargo[ticker] * gameState.prices[ticker];
    }
    document.getElementById('portfolioValue').textContent = formatCurrency(cargoValue);
    document.getElementById('netWorth').textContent = formatCurrency(gameState.player.totalAssetValue);
    
    // Update rank
    const allTraders = [gameState.player, ...gameState.bots];
    allTraders.sort((a, b) => b.totalAssetValue - a.totalAssetValue);
    const rank = allTraders.findIndex(t => t === gameState.player) + 1;
    document.getElementById('rank').textContent = `#${rank}`;
}

function renderPortfolio() {
    const container = document.getElementById('portfolio');
    const entries = Object.entries(gameState.player.cargo);
    
    if (entries.length === 0) {
        container.innerHTML = '<p class="empty-state">Belum ada kargo dimuat</p>';
        return;
    }
    
    container.innerHTML = '';
    for (const [ticker, quantity] of entries) {
        const asset = ASSETS[ticker];
        const item = document.createElement('div');
        item.className = 'portfolio-item';
        item.innerHTML = `
            <div class="portfolio-asset">
                <div class="portfolio-icon">${asset.icon}</div>
                <div class="portfolio-name">${asset.name}</div>
            </div>
            <div class="portfolio-quantity">${formatNumber(quantity)}</div>
        `;
        container.appendChild(item);
    }
}

function renderLeaderboard() {
    const container = document.getElementById('leaderboard');
    const allTraders = [gameState.player, ...gameState.bots];
    allTraders.sort((a, b) => b.totalAssetValue - a.totalAssetValue);
    
    container.innerHTML = '';
    allTraders.slice(0, 5).forEach((trader, index) => {
        const item = document.createElement('div');
        item.className = `leaderboard-item ${trader === gameState.player ? 'player' : ''}`;
        item.innerHTML = `
            <div class="leaderboard-rank">${index + 1}</div>
            <div class="leaderboard-info">
                <div class="leaderboard-name">${trader.name}</div>
                <div class="leaderboard-score">${formatCurrency(trader.totalAssetValue)}</div>
            </div>
        `;
        container.appendChild(item);
    });
}

function renderTimer() {
    const minutes = Math.floor(gameState.timeLeft / 60);
    const seconds = gameState.timeLeft % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.querySelector('.timer-value').textContent = timeString;
}

function updateUI() {
    renderMarketPrices();
    renderStats();
    renderPortfolio();
    renderLeaderboard();
    renderTimer();
}

// ===== GAME OVER =====
function showGameOver() {
    gameState.isRunning = false;
    
    // Calculate final ranking
    const allTraders = [gameState.player, ...gameState.bots];
    allTraders.sort((a, b) => b.totalAssetValue - a.totalAssetValue);
    const playerRank = allTraders.findIndex(t => t === gameState.player) + 1;
    
    // Update final stats
    document.getElementById('finalNetWorth').textContent = formatCurrency(gameState.player.totalAssetValue);
    document.getElementById('finalRank').textContent = `#${playerRank}`;
    
    // Render final leaderboard
    const container = document.getElementById('finalLeaderboard');
    container.innerHTML = '';
    allTraders.forEach((trader, index) => {
        const item = document.createElement('div');
        item.className = `leaderboard-item ${trader === gameState.player ? 'player' : ''}`;
        item.innerHTML = `
            <div class="leaderboard-rank">${index + 1}</div>
            <div class="leaderboard-info">
                <div class="leaderboard-name">${trader.name}</div>
                <div class="leaderboard-score">${formatCurrency(trader.totalAssetValue)}</div>
            </div>
        `;
        container.appendChild(item);
    });
    
    // Show game over screen
    document.getElementById('gameOverScreen').style.display = 'flex';
}

function restartGame() {
    // Hide game over screen
    document.getElementById('gameOverScreen').style.display = 'none';
    
    // Reset game state
    gameState = {
        timeLeft: GAME_DURATION,
        isRunning: true,
        prices: {},
        previousPrices: {},
        player: {
            name: "Anda",
            credits: INITIAL_CREDITS,
            cargo: {},
            totalAssetValue: INITIAL_CREDITS
        },
        bots: []
    };
    
    // Reinitialize
    initializePrices();
    initializeBots();
    updateUI();
    
    // Restart game loops
    startGameLoops();
}

// ===== GAME LOOPS =====
let priceTickInterval;
let botActionInterval;
let timerInterval;

function startGameLoops() {
    // Clear any existing intervals
    clearInterval(priceTickInterval);
    clearInterval(botActionInterval);
    clearInterval(timerInterval);
    
    // Price update loop
    priceTickInterval = setInterval(() => {
        if (gameState.isRunning) {
            updatePrices();
            updateTraderValue(gameState.player);
            gameState.bots.forEach(updateTraderValue);
            updateUI();
        }
    }, TICK_INTERVAL);
    
    // Bot action loop
    botActionInterval = setInterval(() => {
        if (gameState.isRunning) {
            gameState.bots.forEach(botAction);
            updateUI();
        }
    }, BOT_ACTION_INTERVAL);
    
    // Timer countdown
    timerInterval = setInterval(() => {
        if (gameState.isRunning) {
            gameState.timeLeft--;
            renderTimer();
            
            if (gameState.timeLeft <= 0) {
                clearInterval(priceTickInterval);
                clearInterval(botActionInterval);
                clearInterval(timerInterval);
                showGameOver();
            }
        }
    }, 1000);
}

// ===== INITIALIZATION =====
function init() {
    console.log('🚀 The Galactic Goods Trader - Demo Mode');
    console.log('Initializing game...');
    
    initializePrices();
    initializeBots();
    updateUI();
    startGameLoops();
    
    console.log('✅ Game started! Good luck, trader!');
}

// Start game when page loads
window.addEventListener('DOMContentLoaded', init);
