// 斗地主游戏核心逻辑 - 优化版

// 花色和牌值的精美显示
const CARD_DISPLAY = {
    suits: {
        '♠': { symbol: '♠', name: 'spade', color: 'black' },
        '♥': { symbol: '♥', name: 'heart', color: 'red' },
        '♣': { symbol: '♣', name: 'club', color: 'black' },
        '♦': { symbol: '♦', name: 'diamond', color: 'red' }
    },
    values: {
        '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', '10': '10',
        'J': 'J', 'Q': 'Q', 'K': 'K', 'A': 'A', '2': '2',
        'joker_small': '小王',
        'joker_big': '大王'
    }
};

// 音效管理器
class AudioManager {
    constructor() {
        this.musicEnabled = true;
        this.soundEnabled = true;
        this.audioContext = null;
        this.musicInterval = null;
        this.init();
    }

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }

    // 播放经典斗地主背景音乐（使用 Web Audio API 生成）
    playBackgroundMusic() {
        if (!this.musicEnabled || !this.audioContext) return;
        
        this.stopBackgroundMusic();
        
        const ctx = this.audioContext;
        
        // 经典斗地主旋律（简化版）
        const melody = [
            { note: 'E5', duration: 0.4 }, { note: 'G5', duration: 0.4 },
            { note: 'A5', duration: 0.4 }, { note: 'G5', duration: 0.4 },
            { note: 'E5', duration: 0.4 }, { note: 'D5', duration: 0.4 },
            { note: 'E5', duration: 0.8 },
            { note: 'G5', duration: 0.4 }, { note: 'A5', duration: 0.4 },
            { note: 'B5', duration: 0.4 }, { note: 'A5', duration: 0.4 },
            { note: 'G5', duration: 0.4 }, { note: 'E5', duration: 0.4 },
            { note: 'D5', duration: 0.8 }
        ];
        
        const bassline = [
            { note: 'C3', duration: 0.8 }, { note: 'G3', duration: 0.8 },
            { note: 'A3', duration: 0.8 }, { note: 'E3', duration: 0.8 }
        ];
        
        const noteToFreq = (note) => {
            const notes = { 'C3': 131, 'E3': 165, 'G3': 196, 'A3': 220,
                           'D5': 587, 'E5': 659, 'G5': 784, 'A5': 880, 'B5': 988 };
            return notes[note] || 440;
        };
        
        let time = ctx.currentTime;
        let melodyIndex = 0;
        let bassIndex = 0;
        
        const playNote = (freq, startTime, duration, volume = 0.1, type = 'sine') => {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            oscillator.frequency.value = freq;
            oscillator.type = type;
            
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.02);
            gainNode.gain.linearRampToValueAtTime(volume * 0.7, startTime + duration * 0.7);
            gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        };
        
        const playLoop = () => {
            if (!this.musicEnabled) return;
            
            // 主旋律
            const melodyNote = melody[melodyIndex % melody.length];
            playNote(noteToFreq(melodyNote.note), time, melodyNote.duration, 0.08, 'triangle');
            
            // 低音伴奏（每两个旋律音符播放一个低音）
            if (melodyIndex % 2 === 0) {
                const bassNote = bassline[bassIndex % bassline.length];
                playNote(noteToFreq(bassNote.note), time, bassNote.duration, 0.05, 'sine');
                bassIndex++;
            }
            
            time += melodyNote.duration;
            melodyIndex++;
            
            this.musicInterval = setTimeout(playLoop, melodyNote.duration * 1000);
        };
        
        playLoop();
    }

    stopBackgroundMusic() {
        if (this.musicInterval) {
            clearTimeout(this.musicInterval);
            this.musicInterval = null;
        }
    }

    // 生成音效
    playSound(type) {
        if (!this.soundEnabled || !this.audioContext) return;
        
        const ctx = this.audioContext;
        const time = ctx.currentTime;
        
        switch(type) {
            case 'click':
                this.playTone(800, time, 0.1, 0.1);
                break;
            case 'play':
                this.playTone(523, time, 0.1, 0.15);
                this.playTone(659, time + 0.1, 0.1, 0.12);
                break;
            case 'bomb':
                for (let i = 0; i < 5; i++) {
                    this.playTone(100 + Math.random() * 50, time + i * 0.05, 0.2, 0.2 - i * 0.03, 'sawtooth');
                }
                break;
            case 'win':
                const winNotes = [523, 659, 784, 1047];
                winNotes.forEach((freq, i) => {
                    this.playTone(freq, time + i * 0.15, 0.3, 0.15);
                });
                break;
            case 'lose':
                this.playTone(300, time, 0.5, 0.15, 'sawtooth');
                this.playTone(200, time + 0.2, 0.5, 0.12, 'sawtooth');
                break;
            case 'pass':
                this.playTone(400, time, 0.1, 0.08);
                this.playTone(300, time + 0.1, 0.15, 0.06);
                break;
            case 'deal':
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        this.playTone(1000 + Math.random() * 200, ctx.currentTime, 0.05, 0.08);
                    }, i * 50);
                }
                break;
        }
    }

    playTone(frequency, startTime, duration, volume, type = 'sine') {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    }

    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (this.musicEnabled) {
            this.playBackgroundMusic();
        } else {
            this.stopBackgroundMusic();
        }
        return this.musicEnabled;
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        return this.soundEnabled;
    }

    resumeContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
}

// 牌值定义
const CARD_VALUES = {
    '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 11, 'Q': 12, 'K': 13, 'A': 14, '2': 15, 'joker_small': 16, 'joker_big': 17
};

// 花色定义
const SUITS = ['♠', '♥', '♣', '♦'];

// 牌型
const CARD_TYPES = {
    SINGLE: 'single',
    PAIR: 'pair',
    TRIPLE: 'triple',
    TRIPLE_ONE: 'triple_one',
    TRIPLE_TWO: 'triple_two',
    STRAIGHT: 'straight',
    STRAIGHT_PAIR: 'straight_pair',
    PLANE: 'plane',
    PLANE_SINGLE: 'plane_single',
    PLANE_PAIR: 'plane_pair',
    FOUR_TWO: 'four_two',
    FOUR_TWO_PAIR: 'four_two_pair',
    BOMB: 'bomb',
    ROCKET: 'rocket'
};

class Card {
    constructor(value, suit) {
        this.value = value;
        this.suit = suit;
        this.weight = CARD_VALUES[value];
        this.id = `${value}_${suit}`;
    }

    isJoker() {
        return this.value === 'joker_small' || this.value === 'joker_big';
    }

    isRed() {
        if (this.isJoker()) {
            return this.value === 'joker_big';
        }
        return this.suit === '♥' || this.suit === '♦';
    }

    getDisplayValue() {
        if (this.value === 'joker_small') return '小';
        if (this.value === 'joker_big') return '大';
        return this.value;
    }

    getDisplaySuit() {
        if (this.value === 'joker_small') return '🃏';
        if (this.value === 'joker_big') return '👑';
        return this.suit;
    }

    render(showBack = false) {
        if (showBack) {
            return '<div class="card-back"></div>';
        }

        let className = 'card';
        if (this.isJoker()) {
            className += this.value === 'joker_big' ? ' joker-red' : ' joker-black';
        } else {
            className += this.isRed() ? ' red' : ' black';
        }

        const displayValue = this.getDisplayValue();
        const displaySuit = this.getDisplaySuit();

        return `
            <div class="${className}" data-card-id="${this.id}">
                <div class="card-value">${displayValue}</div>
                <div class="card-suit">${displaySuit}</div>
                <div class="card-value-bottom">${displayValue}</div>
                <div class="card-suit-bottom">${displaySuit}</div>
            </div>
        `;
    }
}

class Deck {
    constructor() {
        this.cards = [];
        this.init();
    }

    init() {
        this.cards = [];
        for (const suit of SUITS) {
            for (const value of ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2']) {
                this.cards.push(new Card(value, suit));
            }
        }
        this.cards.push(new Card('joker_small', 'none'));
        this.cards.push(new Card('joker_big', 'none'));
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    deal() {
        const player1 = this.cards.slice(0, 17);
        const player2 = this.cards.slice(17, 34);
        const player3 = this.cards.slice(34, 51);
        const dipai = this.cards.slice(51, 54);
        return { player1, player2, player3, dipai };
    }
}

class HandAnalyzer {
    static sortCards(cards) {
        return [...cards].sort((a, b) => b.weight - a.weight);
    }

    static getWeightCount(cards) {
        const count = {};
        for (const card of cards) {
            count[card.weight] = (count[card.weight] || 0) + 1;
        }
        return count;
    }

    static isStraight(cards) {
        if (cards.length < 5) return false;
        const sorted = this.sortCards(cards);
        if (sorted[0].weight > 14) return false;
        for (let i = 0; i < sorted.length - 1; i++) {
            if (sorted[i].weight - sorted[i + 1].weight !== 1) return false;
        }
        return true;
    }

    static isStraightPair(cards) {
        if (cards.length < 6 || cards.length % 2 !== 0) return false;
        const weightCount = this.getWeightCount(cards);
        const weights = Object.keys(weightCount).map(Number).sort((a, b) => b - a);
        if (weights.some(w => weightCount[w] !== 2)) return false;
        if (weights.length < 3) return false;
        if (weights[0] > 14) return false;
        for (let i = 0; i < weights.length - 1; i++) {
            if (weights[i] - weights[i + 1] !== 1) return false;
        }
        return true;
    }

    static analyze(cards) {
        const sorted = this.sortCards(cards);
        const weightCount = this.getWeightCount(cards);
        const counts = Object.values(weightCount).sort((a, b) => b - a);
        const weights = Object.keys(weightCount).map(Number).sort((a, b) => b - a);

        if (cards.length === 2) {
            if (cards[0].isJoker() && cards[1].isJoker()) {
                return { type: CARD_TYPES.ROCKET, value: 100, cards: sorted };
            }
            if (counts[0] === 2) {
                return { type: CARD_TYPES.PAIR, value: weights[0], cards: sorted };
            }
        }

        if (cards.length === 1) {
            return { type: CARD_TYPES.SINGLE, value: sorted[0].weight, cards: sorted };
        }

        if (counts[0] === 4) {
            if (cards.length === 4) {
                return { type: CARD_TYPES.BOMB, value: weights[0], cards: sorted };
            }
            if (cards.length === 6) {
                const otherCounts = counts.filter(c => c !== 4);
                if (otherCounts.length === 2 && otherCounts[0] === 1 && otherCounts[1] === 1) {
                    return { type: CARD_TYPES.FOUR_TWO, value: weights[0], cards: sorted };
                }
            }
            if (cards.length === 8) {
                const otherCounts = counts.filter(c => c !== 4);
                if (otherCounts.length === 2 && otherCounts[0] === 2 && otherCounts[1] === 2) {
                    return { type: CARD_TYPES.FOUR_TWO_PAIR, value: weights[0], cards: sorted };
                }
            }
        }

        if (counts[0] === 3) {
            if (cards.length === 3) {
                return { type: CARD_TYPES.TRIPLE, value: weights[0], cards: sorted };
            }
            if (cards.length === 4) {
                return { type: CARD_TYPES.TRIPLE_ONE, value: weights[0], cards: sorted };
            }
            if (cards.length === 5 && counts[1] === 2) {
                return { type: CARD_TYPES.TRIPLE_TWO, value: weights[0], cards: sorted };
            }
        }

        if (this.isStraight(cards)) {
            return { type: CARD_TYPES.STRAIGHT, value: sorted[0].weight, cards: sorted };
        }

        if (this.isStraightPair(cards)) {
            return { type: CARD_TYPES.STRAIGHT_PAIR, value: sorted[0].weight, cards: sorted };
        }

        return null;
    }

    static canBeat(myCards, lastCards) {
        if (!lastCards) return true;
        if (!myCards) return false;

        const myType = this.analyze(myCards);
        const lastType = this.analyze(lastCards);

        if (!myType) return false;

        if (myType.type === CARD_TYPES.ROCKET) return true;
        if (lastType.type === CARD_TYPES.ROCKET) return false;

        if (myType.type === CARD_TYPES.BOMB && lastType.type !== CARD_TYPES.BOMB) return true;
        if (myType.type !== CARD_TYPES.BOMB && lastType.type === CARD_TYPES.BOMB) return false;

        if (myType.type !== lastType.type) return false;
        if (myType.cards.length !== lastType.cards.length) return false;

        return myType.value > lastType.value;
    }
}

class Player {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        this.cards = [];
        this.isLandlord = false;
        this.score = 0;
    }

    addCards(cards) {
        this.cards = HandAnalyzer.sortCards([...this.cards, ...cards]);
    }

    removeCards(cards) {
        const cardIds = cards.map(c => c.id);
        this.cards = this.cards.filter(c => !cardIds.includes(c.id));
    }

    hasCards() {
        return this.cards.length > 0;
    }
}

class AIPlayer extends Player {
    constructor(id, name) {
        super(id, name);
    }

    chooseCallLandlord(baseScore) {
        const hasJokerBig = this.cards.some(c => c.value === 'joker_big');
        const hasJokerSmall = this.cards.some(c => c.value === 'joker_small');
        const has2 = this.cards.filter(c => c.value === '2').length;
        const weightCount = HandAnalyzer.getWeightCount(this.cards);
        const bombCount = Object.values(weightCount).filter(c => c === 4).length;

        let score = 0;
        if (hasJokerBig) score += 5;
        if (hasJokerSmall) score += 3;
        score += has2 * 2;
        score += bombCount * 4;

        return score >= 8;
    }

    playCards(lastCards, mustPlay = false) {
        const validPlays = this.findValidPlays(lastCards);
        
        if (validPlays.length === 0) {
            return mustPlay ? this.findSmallestPlay() : null;
        }

        return this.chooseBestPlay(validPlays, lastCards);
    }

    findValidPlays(lastCards) {
        const plays = [];
        
        if (!lastCards) {
            plays.push(...this.findAllPlays());
            return plays;
        }

        const lastType = HandAnalyzer.analyze(lastCards);
        if (!lastType) return [];

        if (lastType.type !== CARD_TYPES.ROCKET && lastType.type !== CARD_TYPES.BOMB) {
            const bombs = this.findBombs();
            plays.push(...bombs);
        }

        if (lastType.type !== CARD_TYPES.ROCKET) {
            const rockets = this.findRocket();
            plays.push(...rockets);
        }

        plays.push(...this.findPlaysOfType(lastType, lastCards.length));
        return plays.filter(play => HandAnalyzer.canBeat(play, lastCards));
    }

    findAllPlays() {
        const plays = [];
        
        for (const card of this.cards) {
            plays.push([card]);
        }

        const weightCount = HandAnalyzer.getWeightCount(this.cards);
        for (const weight of Object.keys(weightCount)) {
            const cards = this.cards.filter(c => c.weight === Number(weight));
            if (cards.length >= 2) {
                plays.push(cards.slice(0, 2));
            }
            if (cards.length >= 3) {
                plays.push(cards.slice(0, 3));
            }
            if (cards.length === 4) {
                plays.push(cards);
            }
        }

        const rocket = this.findRocket();
        plays.push(...rocket);

        return plays;
    }

    findBombs() {
        const bombs = [];
        const weightCount = HandAnalyzer.getWeightCount(this.cards);
        for (const weight of Object.keys(weightCount)) {
            if (weightCount[weight] === 4) {
                bombs.push(this.cards.filter(c => c.weight === Number(weight)));
            }
        }
        return bombs;
    }

    findRocket() {
        const jokerBig = this.cards.find(c => c.value === 'joker_big');
        const jokerSmall = this.cards.find(c => c.value === 'joker_small');
        if (jokerBig && jokerSmall) {
            return [[jokerBig, jokerSmall]];
        }
        return [];
    }

    findPlaysOfType(lastType, length) {
        const plays = [];
        const weightCount = HandAnalyzer.getWeightCount(this.cards);

        switch (lastType.type) {
            case CARD_TYPES.SINGLE:
                for (const card of this.cards) {
                    plays.push([card]);
                }
                break;
            case CARD_TYPES.PAIR:
                for (const weight of Object.keys(weightCount)) {
                    if (weightCount[weight] >= 2) {
                        plays.push(this.cards.filter(c => c.weight === Number(weight)).slice(0, 2));
                    }
                }
                break;
            case CARD_TYPES.TRIPLE:
                for (const weight of Object.keys(weightCount)) {
                    if (weightCount[weight] >= 3) {
                        plays.push(this.cards.filter(c => c.weight === Number(weight)).slice(0, 3));
                    }
                }
                break;
        }

        return plays;
    }

    findSmallestPlay() {
        const sorted = [...this.cards].sort((a, b) => a.weight - b.weight);
        return [sorted[0]];
    }

    chooseBestPlay(validPlays, lastCards) {
        if (validPlays.length === 0) return null;

        const sorted = validPlays.sort((a, b) => {
            const typeA = HandAnalyzer.analyze(a);
            const typeB = HandAnalyzer.analyze(b);
            
            if (typeA.type !== typeB.type) {
                if (typeA.type === CARD_TYPES.BOMB) return 1;
                if (typeB.type === CARD_TYPES.BOMB) return -1;
            }
            
            return typeA.value - typeB.value;
        });

        return sorted[0];
    }
}

class Game {
    constructor() {
        this.audioManager = new AudioManager();
        this.players = [
            new Player(0, '我'),
            new AIPlayer(1, '电脑1'),
            new AIPlayer(2, '电脑2')
        ];
        this.deck = new Deck();
        this.dipai = [];
        this.currentPlayer = 0;
        this.landlord = -1;
        this.lastPlayedCards = null;
        this.lastPlayedPlayer = -1;
        this.baseScore = 0;
        this.multiplier = 1;
        this.gamePhase = 'waiting';
        this.passCount = 0;
        this.selectedCards = [];

        this.init();
    }

    init() {
        this.bindEvents();
        this.updateUI();
    }

    bindEvents() {
        document.getElementById('start-btn').addEventListener('click', () => this.startGame());
        document.getElementById('btn-call').addEventListener('click', () => this.handleCallLandlord(true));
        document.getElementById('btn-no-call').addEventListener('click', () => this.handleCallLandlord(false));
        document.getElementById('btn-play').addEventListener('click', () => this.handlePlay());
        document.getElementById('btn-pass').addEventListener('click', () => this.handlePass());
        document.getElementById('btn-hint').addEventListener('click', () => this.handleHint());
        document.getElementById('btn-restart').addEventListener('click', () => this.restartGame());
        document.getElementById('music-btn').addEventListener('click', () => this.toggleMusic());
        document.getElementById('sound-btn').addEventListener('click', () => this.toggleSound());

        document.addEventListener('click', () => this.audioManager.resumeContext(), { once: true });
    }

    toggleMusic() {
        const enabled = this.audioManager.toggleMusic();
        const btn = document.getElementById('music-btn');
        btn.textContent = enabled ? '🎵' : '🔇';
        btn.classList.toggle('muted', !enabled);
        this.audioManager.playSound('click');
    }

    toggleSound() {
        const enabled = this.audioManager.toggleSound();
        const btn = document.getElementById('sound-btn');
        btn.textContent = enabled ? '🔔' : '🔕';
        btn.classList.toggle('muted', !enabled);
        this.audioManager.playSound('click');
    }

    startGame() {
        this.audioManager.playBackgroundMusic();
        this.audioManager.playSound('click');
        
        this.deck = new Deck();
        this.deck.shuffle();
        const { player1, player2, player3, dipai } = this.deck.deal();

        this.players[0].cards = HandAnalyzer.sortCards(player1);
        this.players[1].cards = HandAnalyzer.sortCards(player2);
        this.players[2].cards = HandAnalyzer.sortCards(player3);
        this.dipai = dipai;

        this.currentPlayer = Math.floor(Math.random() * 3);
        this.landlord = -1;
        this.lastPlayedCards = null;
        this.lastPlayedPlayer = -1;
        this.baseScore = 0;
        this.multiplier = 1;
        this.gamePhase = 'calling';
        this.passCount = 0;
        this.selectedCards = [];

        this.players.forEach(p => p.isLandlord = false);

        this.updateUI();
        this.audioManager.playSound('deal');

        if (this.currentPlayer !== 0) {
            setTimeout(() => this.aiTurn(), 1000);
        }
    }

    handleCallLandlord(call) {
        if (this.gamePhase !== 'calling' || this.currentPlayer !== 0) return;

        this.audioManager.playSound('click');

        if (call) {
            this.baseScore = Math.min(this.baseScore + 1, 3);
            this.landlord = 0;
            this.finishCalling();
        } else {
            this.passCount++;
            if (this.passCount >= 3) {
                this.startGame();
                return;
            }
            this.currentPlayer = (this.currentPlayer + 1) % 3;
            this.updateUI();
            setTimeout(() => this.aiTurn(), 1000);
        }
    }

    finishCalling() {
        if (this.landlord === -1) {
            this.landlord = this.currentPlayer;
        }

        this.players[this.landlord].isLandlord = true;
        this.players[this.landlord].addCards(this.dipai);
        this.multiplier = Math.pow(2, this.baseScore);

        this.gamePhase = 'playing';
        this.currentPlayer = this.landlord;
        this.lastPlayedCards = null;
        this.lastPlayedPlayer = -1;
        this.passCount = 0;

        this.updateUI();

        if (this.currentPlayer !== 0) {
            setTimeout(() => this.aiTurn(), 1000);
        }
    }

    aiTurn() {
        if (this.gamePhase === 'calling') {
            this.aiCallLandlord();
        } else if (this.gamePhase === 'playing') {
            this.aiPlay();
        }
    }

    aiCallLandlord() {
        const player = this.players[this.currentPlayer];
        const shouldCall = player.chooseCallLandlord(this.baseScore);

        this.audioManager.playSound('click');

        if (shouldCall) {
            this.baseScore = Math.min(this.baseScore + 1, 3);
            this.landlord = this.currentPlayer;
            this.finishCalling();
        } else {
            this.passCount++;
            if (this.passCount >= 3) {
                this.startGame();
                return;
            }
            this.currentPlayer = (this.currentPlayer + 1) % 3;
            this.updateUI();
            setTimeout(() => this.aiTurn(), 1000);
        }
    }

    aiPlay() {
        const player = this.players[this.currentPlayer];
        const mustPlay = this.lastPlayedPlayer === this.currentPlayer || this.lastPlayedPlayer === -1;
        const cards = player.playCards(this.lastPlayedCards, mustPlay);

        if (cards) {
            this.playCards(cards);
        } else {
            this.pass();
        }
    }

    handleCardClick(cardId) {
        if (this.gamePhase !== 'playing' || this.currentPlayer !== 0) return;

        const card = this.players[0].cards.find(c => c.id === cardId);
        if (!card) return;

        const index = this.selectedCards.findIndex(c => c.id === cardId);
        if (index >= 0) {
            this.selectedCards.splice(index, 1);
        } else {
            this.selectedCards.push(card);
        }

        this.audioManager.playSound('click');
        this.updateUI();
    }

    handlePlay() {
        if (this.gamePhase !== 'playing' || this.currentPlayer !== 0) return;
        if (this.selectedCards.length === 0) return;

        const playType = HandAnalyzer.analyze(this.selectedCards);
        if (!playType) {
            alert('无效的牌型！');
            return;
        }

        if (this.lastPlayedCards && !HandAnalyzer.canBeat(this.selectedCards, this.lastPlayedCards)) {
            alert('打不过上家的牌！');
            return;
        }

        this.playCards(this.selectedCards);
        this.selectedCards = [];
    }

    handlePass() {
        if (this.gamePhase !== 'playing' || this.currentPlayer !== 0) return;
        if (!this.lastPlayedCards || this.lastPlayedPlayer === 0) return;

        this.pass();
    }

    handleHint() {
        if (this.gamePhase !== 'playing' || this.currentPlayer !== 0) return;

        const player = this.players[0];
        const ai = new AIPlayer(0, 'hint');
        ai.cards = [...player.cards];
        const mustPlay = this.lastPlayedPlayer === 0 || this.lastPlayedPlayer === -1;
        const hintCards = ai.playCards(this.lastPlayedCards, mustPlay);

        if (hintCards) {
            this.selectedCards = hintCards;
            this.audioManager.playSound('click');
            this.updateUI();
        }
    }

    playCards(cards) {
        const player = this.players[this.currentPlayer];
        player.removeCards(cards);

        this.lastPlayedCards = cards;
        this.lastPlayedPlayer = this.currentPlayer;
        this.passCount = 0;

        const playType = HandAnalyzer.analyze(cards);
        if (playType.type === CARD_TYPES.BOMB || playType.type === CARD_TYPES.ROCKET) {
            this.multiplier *= 2;
            this.audioManager.playSound('bomb');
        } else {
            this.audioManager.playSound('play');
        }

        this.updateUI();

        if (!player.hasCards()) {
            this.endGame(this.currentPlayer);
            return;
        }

        this.currentPlayer = (this.currentPlayer + 1) % 3;
        this.updateUI();

        if (this.currentPlayer !== 0) {
            setTimeout(() => this.aiTurn(), 1500);
        }
    }

    pass() {
        this.passCount++;
        this.audioManager.playSound('pass');

        if (this.passCount >= 2) {
            this.lastPlayedCards = null;
            this.lastPlayedPlayer = -1;
            this.passCount = 0;
        }

        this.updateUI();

        this.currentPlayer = (this.currentPlayer + 1) % 3;
        this.updateUI();

        if (this.currentPlayer !== 0) {
            setTimeout(() => this.aiTurn(), 1000);
        }
    }

    endGame(winner) {
        this.gamePhase = 'ended';
        this.audioManager.stopBackgroundMusic();

        const landlordWin = winner === this.landlord;
        const playerWin = (winner === 0) || (!landlordWin && this.landlord !== 0);

        if (playerWin) {
            this.audioManager.playSound('win');
        } else {
            this.audioManager.playSound('lose');
        }

        const score = this.baseScore * this.multiplier;

        if (landlordWin) {
            for (let i = 0; i < 3; i++) {
                if (i === this.landlord) this.players[i].score += score * 2;
                else this.players[i].score -= score;
            }
        } else {
            for (let i = 0; i < 3; i++) {
                if (i === this.landlord) this.players[i].score -= score * 2;
                else this.players[i].score += score;
            }
        }

        document.getElementById('game-result').textContent = playerWin ? '🎉 你赢了！' : '😢 你输了！';
        document.getElementById('game-score').textContent = `积分变化: ${playerWin ? '+' : ''}${this.players[0].score}`;
        document.getElementById('game-over-modal').style.display = 'flex';
    }

    restartGame() {
        document.getElementById('game-over-modal').style.display = 'none';
        this.startGame();
    }

    updateUI() {
        document.getElementById('base-score').textContent = this.baseScore;
        document.getElementById('multiplier').textContent = this.multiplier;

        this.renderPlayerCards();
        this.renderOpponentCards();
        this.renderDipai();
        this.renderPlayedCards();
        this.updateActionButtons();
        this.updatePlayerScores();
    }

    renderPlayerCards() {
        const container = document.getElementById('player-cards');
        container.innerHTML = '';

        for (const card of this.players[0].cards) {
            const el = this.createCardElement(card, true);
            const isSelected = this.selectedCards.some(c => c.id === card.id);
            if (isSelected) el.classList.add('selected');
            el.addEventListener('click', () => this.handleCardClick(card.id));
            container.appendChild(el);
        }
    }

    renderOpponentCards() {
        const opp1Cards = document.getElementById('opponent1-cards');
        const opp2Cards = document.getElementById('opponent2-cards');
        opp1Cards.innerHTML = '';
        opp2Cards.innerHTML = '';

        for (let i = 0; i < this.players[1].cards.length; i++) {
            const back = document.createElement('div');
            back.className = 'card-back';
            opp1Cards.appendChild(back);
        }

        for (let i = 0; i < this.players[2].cards.length; i++) {
            const back = document.createElement('div');
            back.className = 'card-back';
            opp2Cards.appendChild(back);
        }
    }

    renderDipai() {
        const container = document.getElementById('dipai-cards');
        container.innerHTML = '';

        if (this.gamePhase === 'playing') {
            for (const card of this.dipai) {
                container.appendChild(this.createCardElement(card, false));
            }
        } else if (this.gamePhase === 'calling') {
            for (let i = 0; i < 3; i++) {
                const back = document.createElement('div');
                back.className = 'card-back';
                container.appendChild(back);
            }
        }
    }

    renderPlayedCards() {
        const playerPlayed = document.getElementById('player-played');
        const opp1Played = document.getElementById('opponent1-played');
        const opp2Played = document.getElementById('opponent2-played');

        playerPlayed.innerHTML = '';
        opp1Played.innerHTML = '';
        opp2Played.innerHTML = '';

        if (this.lastPlayedCards && this.lastPlayedPlayer >= 0) {
            const containers = [playerPlayed, opp1Played, opp2Played];
            const container = containers[this.lastPlayedPlayer];
            
            for (const card of this.lastPlayedCards) {
                container.appendChild(this.createCardElement(card, false));
            }
        }
    }

    createCardElement(card, interactive) {
        const el = document.createElement('div');
        
        if (card.value === 'joker_small') {
            el.className = 'card joker-black';
            el.innerHTML = `
                <div class="card-value">小</div>
                <div class="card-suit">🃏</div>
                <div class="card-value-bottom">小</div>
                <div class="card-suit-bottom">🃏</div>
            `;
        } else if (card.value === 'joker_big') {
            el.className = 'card joker-red';
            el.innerHTML = `
                <div class="card-value">大</div>
                <div class="card-suit">👑</div>
                <div class="card-value-bottom">大</div>
                <div class="card-suit-bottom">👑</div>
            `;
        } else {
            el.className = 'card ' + (card.isRed() ? 'red' : 'black');
            el.innerHTML = `
                <div class="card-value">${card.value}</div>
                <div class="card-suit">${card.suit}</div>
                <div class="card-value-bottom">${card.value}</div>
                <div class="card-suit-bottom">${card.suit}</div>
            `;
        }
        
        el.dataset.cardId = card.id;
        return el;
    }

    updateActionButtons() {
        const callBtns = document.getElementById('call-btns');
        const playBtns = document.getElementById('play-btns');
        const startBtn = document.getElementById('start-btn');
        const btnPass = document.getElementById('btn-pass');

        startBtn.style.display = this.gamePhase === 'waiting' ? 'inline-block' : 'none';
        callBtns.style.display = (this.gamePhase === 'calling' && this.currentPlayer === 0) ? 'flex' : 'none';
        playBtns.style.display = (this.gamePhase === 'playing' && this.currentPlayer === 0) ? 'flex' : 'none';
        
        if (btnPass) {
            btnPass.style.display = (this.lastPlayedCards && this.lastPlayedPlayer !== 0 && this.lastPlayedPlayer !== -1) ? 'inline-block' : 'none';
        }
    }

    updatePlayerScores() {
        const scoreElements = document.querySelectorAll('.player-score');
        this.players.forEach((player, index) => {
            if (scoreElements[index]) {
                scoreElements[index].textContent = `积分: ${player.score}`;
            }
        });
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
