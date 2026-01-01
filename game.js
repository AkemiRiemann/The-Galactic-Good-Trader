// =====================================================
// Random Walk Price Engine
// =====================================================
class RandomWalkEngine {
    constructor() {
        this.prices = {
            PLASMA: 12.5,
            ORE: 75.0,
            SPICE: 260.0,
            CRYSTAL: 540.0
        };

        this.config = {
            PLASMA: { volatility: 0.03, min: 1, max: 100 },
            ORE: { volatility: 0.025, min: 10, max: 500 },
            SPICE: { volatility: 0.02, min: 50, max: 1000 },
            CRYSTAL: { volatility: 0.015, min: 100, max: 2000 }
        };

        // Track initial prices for change calculation
        this.initialPrices = { ...this.prices };
        this.previousPrices = { ...this.prices };

        // Price history for charts (last 100 data points)
        this.priceHistory = {};
        this.timestamps = [];
        for (const resource of Object.keys(this.prices)) {
            this.priceHistory[resource] = [];
        }
    }

    tick() {
        // Store previous prices
        this.previousPrices = { ...this.prices };

        for (const [resource, price] of Object.entries(this.prices)) {
            const cfg = this.config[resource];
            const z = this.randomNormal();
            const change = cfg.volatility * z;
            let newPrice = price * (1 + change);

            // Clamp to bounds
            newPrice = Math.max(cfg.min, Math.min(cfg.max, newPrice));
            this.prices[resource] = Math.round(newPrice * 100) / 100;
        }

        // Update price history
        const now = Date.now();
        this.timestamps.push(now);
        for (const [resource, price] of Object.entries(this.prices)) {
            this.priceHistory[resource].push(price);
        }

        // Keep only last 100 data points
        if (this.timestamps.length > 100) {
            this.timestamps.shift();
            for (const resource of Object.keys(this.prices)) {
                this.priceHistory[resource].shift();
            }
        }

        return { ...this.prices };
    }

    randomNormal() {
        // Box-Muller transform for normal distribution
        const u1 = Math.random();
        const u2 = Math.random();
        return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    }
}

// =====================================================
// Demo Portfolio Manager
// =====================================================
class DemoPortfolio {
    constructor(userId) {
        this.userId = userId;
        this.storageKey = `stonk_demo_${userId}`;
        this.load();
    }

    load() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.credits = data.credits || 10000;
                this.cargo = data.cargo || {};
            } catch (e) {
                this.reset();
            }
        } else {
            this.reset();
        }
    }

    save() {
        const data = {
            credits: this.credits,
            cargo: this.cargo,
            savedAt: Date.now()
        };
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    reset() {
        this.credits = 10000;
        this.cargo = {};
        this.save();
    }

    executeTrade(action, resource, quantity, price) {
        const total = quantity * price;

        if (action === 'LOAD') {
            if (this.credits < total) {
                throw new Error('Insufficient credits');
            }
            this.credits -= total;
            this.credits = Math.round(this.credits * 100) / 100;
            this.cargo[resource] = (this.cargo[resource] || 0) + quantity;
        } else { // OFFLOAD
            if ((this.cargo[resource] || 0) < quantity) {
                throw new Error('Insufficient cargo');
            }
            this.credits += total;
            this.credits = Math.round(this.credits * 100) / 100;
            this.cargo[resource] -= quantity;
            if (this.cargo[resource] === 0) {
                delete this.cargo[resource];
            }
        }

        this.save();
        return true;
    }

    calculateNetWorth(prices) {
        let cargoValue = 0;
        for (const [resource, qty] of Object.entries(this.cargo)) {
            cargoValue += qty * (prices[resource] || 0);
        }
        return this.credits + cargoValue;
    }
}

// =====================================================
// Demo Event Engine
// =====================================================
class DemoEventEngine {
    constructor() {
        this.eventChance = 0.03; // ~3% per tick (adjusted for 3s interval)
        this.events = [
            { title: 'Plasma Surge', message: 'Hub demand spike!', resource: 'PLASMA', multiplier: 1.3 },
            { title: 'Ore Shortage', message: 'Supply disrupted!', resource: 'ORE', multiplier: 1.4 },
            { title: 'Spice Glut', message: 'Market oversupply!', resource: 'SPICE', multiplier: 0.7 },
            { title: 'Crystal Boom', message: 'New deposits found!', resource: 'CRYSTAL', multiplier: 0.8 }
        ];
    }

    checkEvent() {
        if (Math.random() < this.eventChance) {
            return this.events[Math.floor(Math.random() * this.events.length)];
        }
        return null;
    }

    applyEvent(event, priceEngine) {
        const current = priceEngine.prices[event.resource];
        priceEngine.prices[event.resource] = current * event.multiplier;
        return event;
    }
}

// =====================================================
// Bot AI
// =====================================================
class BotPlayer {
    constructor(name, strategy) {
        this.name = name;
        this.strategy = strategy; // 'aggressive', 'conservative', 'random'
        this.credits = 10000;
        this.cargo = {};
        this.lastTradeTime = 0;
    }

    calculateNetWorth(prices) {
        let cargoValue = 0;
        for (const [resource, qty] of Object.entries(this.cargo)) {
            cargoValue += qty * (prices[resource] || 0);
        }
        return this.credits + cargoValue;
    }

    tick(prices, priceEngine) {
        const now = Date.now();
        // Trade every 2-5 seconds randomly
        const tradeInterval = 2000 + Math.random() * 3000;

        if (now - this.lastTradeTime < tradeInterval) {
            return;
        }

        this.lastTradeTime = now;

        // Bot trading logic based on strategy
        const resources = Object.keys(prices);
        const resource = resources[Math.floor(Math.random() * resources.length)];
        const price = prices[resource];
        const initialPrice = priceEngine.initialPrices[resource];
        const priceChange = (price - initialPrice) / initialPrice;

        let shouldBuy = false;
        let shouldSell = false;

        switch (this.strategy) {
            case 'aggressive':
                // Buy when price is rising, sell when falling
                shouldBuy = priceChange > -0.05 && this.credits > price * 10;
                shouldSell = priceChange < -0.03 && (this.cargo[resource] || 0) > 5;
                break;

            case 'conservative':
                // Buy low, sell high
                shouldBuy = priceChange < -0.1 && this.credits > price * 10;
                shouldSell = priceChange > 0.1 && (this.cargo[resource] || 0) > 5;
                break;

            case 'random':
                // Random trading
                shouldBuy = Math.random() < 0.3 && this.credits > price * 10;
                shouldSell = Math.random() < 0.3 && (this.cargo[resource] || 0) > 5;
                break;
        }

        // Execute trade
        if (shouldBuy) {
            const maxQty = Math.floor(this.credits / price);
            const qty = Math.min(Math.floor(Math.random() * 20) + 10, maxQty);
            if (qty > 0) {
                this.credits -= qty * price;
                this.cargo[resource] = (this.cargo[resource] || 0) + qty;
            }
        } else if (shouldSell) {
            const qty = Math.min(Math.floor(Math.random() * 10) + 5, this.cargo[resource] || 0);
            if (qty > 0) {
                this.credits += qty * price;
                this.cargo[resource] -= qty;
                if (this.cargo[resource] === 0) {
                    delete this.cargo[resource];
                }
            }
        }
    }
}

// =====================================================
// Demo Game Loop
// =====================================================
class DemoGame {
    constructor(userId) {
        this.userId = userId;
        this.priceEngine = new RandomWalkEngine();
        this.portfolio = new DemoPortfolio(userId);
        this.eventEngine = new DemoEventEngine();
        this.running = false;
        this.tickInterval = 3000; // 3000ms = 3 seconds

        // Initialize bots
        this.bots = [
            new BotPlayer('Captain Nova', 'aggressive'),
            new BotPlayer('Trader Zara', 'conservative'),
            new BotPlayer('Bot Alpha', 'random'),
            new BotPlayer('Merchant Kane', 'conservative'),
        ];
    }

    start() {
        this.running = true;
        log('Demo mode started');
        this.loop();
    }

    stop() {
        this.running = false;
    }

    loop() {
        if (!this.running) return;

        // Update prices
        const prices = this.priceEngine.tick();

        // Check for random events
        const event = this.eventEngine.checkEvent();
        if (event) {
            this.eventEngine.applyEvent(event, this.priceEngine);
            log(`Event: ${event.title} - ${event.message} (${event.resource})`, 'event');
        }

        // Update bots
        for (const bot of this.bots) {
            bot.tick(prices, this.priceEngine);
        }

        // Render UI
        this.render(prices);

        // Next tick
        setTimeout(() => this.loop(), this.tickInterval);
    }

    render(prices) {
        updatePrices(prices);
        renderPortfolio(this.portfolio);
        renderStats(this.portfolio, prices);
        renderLeaderboard(this.portfolio, this.bots, prices);

        // Update charts every 1 second (throttled)
        if (!this.lastChartUpdate || Date.now() - this.lastChartUpdate > 1000) {
            updateCharts();
            this.lastChartUpdate = Date.now();
        }
    }
}

// =====================================================
// Global State
// =====================================================
let game = null;
let tradingContext = { action: '', resource: '', price: 0 };
let priceCardsInitialized = false;
let charts = {}; // uPlot chart instances
let modalUpdateInterval = null;

// =====================================================
// Initialization & Auth Check
// =====================================================
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE = isLocal ? 'http://localhost:8080' : window.location.origin;

async function checkAuth() {
    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            credentials: 'include'
        });

        if (!response.ok) {
            console.log('User not logged in, proceeding as Guest for Demo Mode.');
            return null;
        }

        const user = await response.json();
        return user;
    } catch (error) {
        console.error('Auth check failed:', error);
        return null;
    }
}

window.addEventListener('DOMContentLoaded', async () => {
    // Check if user is logged in
    // const user = await checkAuth();

    // Use actual user ID if available, otherwise generate guest ID
    let userId = 'guest_' + Math.floor(Math.random() * 10000);
    let username = 'Guest Trader';

    // if (user) {
    //     userId = user.id;
    //     username = user.username;
    //     log(`Welcome back, Captain ${username}!`);
    // } else {
    //     userId = 'guest_' + Math.floor(Math.random() * 10000);
    //     username = 'Guest Trader';
    //     log('Welcome, Guest Trader! (Demo Mode)');
    // }

    game = new DemoGame(userId);
    game.start();

    // Initialize charts
    initCharts();
});

// =====================================================
// UI Functions
// =====================================================
function updatePrices(prices) {
    const marketEl = document.getElementById('marketPrices');
    const entries = Object.entries(prices);

    // Initial render - build HTML structure once
    if (!priceCardsInitialized) {
        marketEl.innerHTML = entries.map(([asset, price]) => `
            <div class="p-4 flex items-center justify-between border-b border-white/5 last:border-0 hover:bg-white/5 transition" id="card-${asset}">
                <div>
                    <div class="text-sm text-slate-400 font-display tracking-wide">${asset}</div>
                    <div class="flex items-baseline space-x-2">
                        <div class="text-xl font-bold text-cyan-300 font-display filter drop-shadow-[0_0_5px_rgba(103,232,249,0.5)]" id="price-${asset}">${price.toFixed(2)} Cr</div>
                        <div class="text-xs font-semibold" id="change-${asset}"></div>
                    </div>
                </div>
                <div class="flex space-x-2">
                    <button onclick="openTradeModal('LOAD', '${asset}', ${price})" id="btn-load-${asset}" class="px-4 py-1.5 text-xs font-bold uppercase tracking-wider bg-cyan-600/80 hover:bg-cyan-500 text-white rounded backdrop-blur-sm transition shadow-[0_0_10px_rgba(8,145,178,0.4)]">Muat</button>
                    <button onclick="openTradeModal('OFFLOAD', '${asset}', ${price})" id="btn-offload-${asset}" class="px-4 py-1.5 text-xs font-bold uppercase tracking-wider bg-pink-600/80 hover:bg-pink-500 text-white rounded backdrop-blur-sm transition shadow-[0_0_10px_rgba(219,39,119,0.4)]">Bongkar</button>
                </div>
            </div>
        `).join('');
        priceCardsInitialized = true;
    }

    // Subsequent updates - only update price text and change indicators
    for (const [asset, price] of entries) {
        const priceEl = document.getElementById(`price-${asset}`);
        const changeEl = document.getElementById(`change-${asset}`);
        const btnLoad = document.getElementById(`btn-load-${asset}`);
        const btnOffload = document.getElementById(`btn-offload-${asset}`);

        if (priceEl) {
            priceEl.textContent = `${price.toFixed(2)} Cr`;
        }

        // Update button onclick with current price
        if (btnLoad) {
            btnLoad.setAttribute('onclick', `openTradeModal('LOAD', '${asset}', ${price})`);
        }
        if (btnOffload) {
            btnOffload.setAttribute('onclick', `openTradeModal('OFFLOAD', '${asset}', ${price})`);
        }

        // Calculate and display price change
        if (changeEl && game && game.priceEngine) {
            const initialPrice = game.priceEngine.initialPrices[asset];
            const changePercent = ((price - initialPrice) / initialPrice) * 100;

            if (Math.abs(changePercent) < 0.01) {
                changeEl.textContent = '';
                changeEl.className = 'text-xs font-semibold';
            } else {
                const arrow = changePercent > 0 ? '↑' : '↓';
                const colorClass = changePercent > 0 ? 'text-green-400' : 'text-red-400';
                changeEl.textContent = `${arrow} ${Math.abs(changePercent).toFixed(1)}%`;
                changeEl.className = `text-xs font-semibold ${colorClass}`;
            }
        }
    }
}

function renderPortfolio(portfolio) {
    const portfolioEl = document.getElementById('portfolio');
    const entries = Object.entries(portfolio.cargo || {});

    if (!entries.length) {
        portfolioEl.innerHTML = '<p class="text-slate-400 text-sm text-center py-8">Belum ada kargo dimuat</p>';
        return;
    }

    const rows = entries.map(([asset, qty]) => {
        return `<div class="flex items-center justify-between py-2 text-sm">
            <span class="text-slate-200">${asset}</span>
            <span class="text-cyan-300 font-semibold">${qty}</span>
        </div>`;
    }).join('');

    portfolioEl.innerHTML = rows;
}

function renderStats(portfolio, prices) {
    const netWorth = portfolio.calculateNetWorth(prices);
    const cargoValue = netWorth - portfolio.credits;

    document.getElementById('cashBalance').textContent = `${formatNumber(portfolio.credits)} Cr`;
    document.getElementById('portfolioValue').textContent = `${formatNumber(Math.max(cargoValue, 0))} Cr`;
    document.getElementById('netWorth').textContent = `${formatNumber(netWorth)} Cr`;
}

function formatNumber(num) {
    return Number(num || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
}

function renderLeaderboard(playerPortfolio, bots, prices) {
    const leaderboardEl = document.getElementById('leaderboard');

    // Collect all players
    const players = [
        {
            name: 'You',
            netWorth: playerPortfolio.calculateNetWorth(prices),
            isPlayer: true
        },
        ...bots.map(bot => ({
            name: bot.name,
            netWorth: bot.calculateNetWorth(prices),
            isPlayer: false
        }))
    ];

    // Sort by net worth descending
    players.sort((a, b) => b.netWorth - a.netWorth);

    // Render leaderboard
    const rows = players.map((player, index) => {
        const rank = index + 1;
        const bgClass = player.isPlayer ? 'bg-cyan-500/10' : '';
        const textClass = player.isPlayer ? 'text-cyan-300 font-bold' : 'text-slate-200';
        const medalEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';

        return `
            <div class="flex items-center justify-between py-2 px-2 rounded ${bgClass}">
                <div class="flex items-center space-x-2">
                    <span class="text-xs font-bold ${textClass} w-8">${medalEmoji || `#${rank}`}</span>
                    <span class="text-sm ${textClass}">${player.name}</span>
                </div>
                <span class="text-sm font-semibold text-yellow-400">${formatNumber(player.netWorth)} Cr</span>
            </div>
        `;
    }).join('');

    leaderboardEl.innerHTML = rows;
}

function log(message, type = 'info') {
    const logEl = document.getElementById('activityLog');
    const timestamp = new Date().toLocaleTimeString();
    const colorClass = type === 'error' ? 'text-red-400' : type === 'event' ? 'text-yellow-400' : 'text-slate-400';

    const entry = document.createElement('div');
    entry.className = colorClass;
    entry.textContent = `[${timestamp}] ${message}`;

    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;
}

// =====================================================
// Price Charts
// =====================================================
function initCharts() {
    const resources = ['PLASMA', 'ORE', 'SPICE', 'CRYSTAL'];

    for (const resource of resources) {
        const el = document.getElementById(`chart-${resource}`);
        if (!el) continue;

        const opts = {
            width: el.offsetWidth,
            height: 150,
            scales: {
                x: { time: false },
                y: { auto: true }
            },
            series: [
                {},
                {
                    label: resource,
                    stroke: resource === 'PLASMA' ? '#06b6d4' : resource === 'ORE' ? '#f59e0b' : resource === 'SPICE' ? '#8b5cf6' : '#10b981',
                    width: 2,
                    fill: resource === 'PLASMA' ? 'rgba(6,182,212,0.1)' : resource === 'ORE' ? 'rgba(245,158,11,0.1)' : resource === 'SPICE' ? 'rgba(139,92,246,0.1)' : 'rgba(16,185,129,0.1)'
                }
            ]
        };

        const data = [
            [],
            []
        ];

        charts[resource] = new uPlot(opts, data, el);
    }
}

function updateCharts() {
    if (!game || !game.priceEngine) return;

    const resources = ['PLASMA', 'ORE', 'SPICE', 'CRYSTAL'];

    for (const resource of resources) {
        const chart = charts[resource];
        if (!chart) continue;

        const history = game.priceEngine.priceHistory[resource] || [];
        const timestamps = game.priceEngine.timestamps || [];

        if (history.length === 0) continue;

        // Convert timestamps to seconds (normalized to start at 0)
        const startTime = timestamps[0] || Date.now();
        const timeData = timestamps.map(t => (t - startTime) / 1000);

        chart.setData([
            timeData,
            history
        ]);
    }
}

// =====================================================
// Trading Functions
// =====================================================
function openTradeModal(action, resource, price) {
    tradingContext = { action, resource, price };
    const modal = document.getElementById('tradingModal');
    const actionText = action === 'LOAD' ? 'Muat' : 'Bongkar';

    document.getElementById('modalTitle').textContent = `${actionText} ${resource}`;
    document.getElementById('modalResource').value = resource;
    document.getElementById('modalPrice').value = `${price.toFixed(2)} Cr`;
    document.getElementById('modalQuantity').value = '10';

    updateTotalCost();

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // Start real-time price update
    if (modalUpdateInterval) clearInterval(modalUpdateInterval);
    modalUpdateInterval = setInterval(() => {
        if (game && game.priceEngine) {
            const currentPrice = game.priceEngine.prices[tradingContext.resource];
            tradingContext.price = currentPrice;
            document.getElementById('modalPrice').value = `${currentPrice.toFixed(2)} Cr`;
            updateTotalCost();
        }
    }, 1000);
}

function closeModal() {
    const modal = document.getElementById('tradingModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');

    // Stop real-time price update
    if (modalUpdateInterval) {
        clearInterval(modalUpdateInterval);
        modalUpdateInterval = null;
    }
}

function updateTotalCost() {
    const quantity = parseFloat(document.getElementById('modalQuantity').value) || 0;
    const total = quantity * tradingContext.price;
    const actionText = tradingContext.action === 'LOAD' ? 'Biaya' : 'Hasil';
    const colorClass = tradingContext.action === 'LOAD' ? 'text-red-400' : 'text-green-400';

    const totalEl = document.getElementById('modalTotalCost');
    totalEl.textContent = `${total.toFixed(2)} Cr`;
    totalEl.className = `w-full px-4 py-3 bg-slate-900 rounded font-bold text-lg border ${colorClass} border-yellow-500/30`;

    // Update label
    const label = document.querySelector('#totalCostSection label');
    if (label) {
        label.textContent = actionText;
    }
}

function executeTrade() {
    const quantity = parseFloat(document.getElementById('modalQuantity').value);

    if (!quantity || quantity <= 0) {
        alert('Jumlah harus lebih dari 0');
        return;
    }

    try {
        game.portfolio.executeTrade(
            tradingContext.action,
            tradingContext.resource,
            quantity,
            tradingContext.price
        );

        const actionText = tradingContext.action === 'LOAD' ? 'Loaded' : 'Offloaded';
        log(`${actionText} ${quantity} ${tradingContext.resource} @ ${tradingContext.price.toFixed(2)} Cr`);

        closeModal();
    } catch (error) {
        log(error.message, 'error');
        alert(error.message);
    }
}

function resetDemo() {
    if (confirm('Reset portfolio demo Anda? Ini tidak dapat dibatalkan.')) {
        game.portfolio.reset();
        log('Portfolio reset to 10,000 Cr');
        location.reload();
    }
}
