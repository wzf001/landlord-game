// 斗地主游戏核心逻辑

// 音效管理器
class AudioManager {
    constructor() {
        this.musicEnabled = true;
        this.soundEnabled = true;
        this.audioContext = null;
        this.init();
    }

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }

    // 生成背景音乐（使用 Web Audio API 生成简单的循环旋律）
    playBackgroundMusic() {
        if (!this.musicEnabled || !this.audioContext) return;
        
        this.stopBackgroundMusic();
        
        // 创建一个简单的背景音乐循环
        const playNote = (frequency, startTime, duration, volume = 0.1) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.05);
            gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
            
            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        };
        
        // 简单的旋律
        const melody = [262, 294, 330, 349, 392, 440, 494, 523];
        const bass = [131, 147, 165, 175, 196, 220, 247, 262];
        
        let time = this.audioContext.currentTime;
        let noteIndex = 0;
        
        const playLoop = () => {
            if (!this.musicEnabled) return;
            
            // 主旋律
            playNote(melody[noteIndex % melody.length], time, 0.4, 0.08);
            // 低音伴奏
            playNote(bass[Math.floor(noteIndex / 2) % bass.length], time, 0.6, 0.05);
            
            noteIndex++;
            time += 0.5;
            
            if (this.musicEnabled) {
                setTimeout(playLoop, 500);
            }
        };
        
        playLoop();
        this.musicPlaying = true;
    }

    stopBackgroundMusic() {
        this.musicPlaying = false;
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
                // 炸弹音效 - 低沉的爆炸声
                for (let i = 0; i < 5; i++) {
                    this.playTone(100 + Math.random() * 50, time + i * 0.05, 0.2, 0.2 - i * 0.03, 'sawtooth');
                }
                break;
            case 'win':
                // 胜利音效
                const winNotes = [523, 659, 784, 1047];
                winNotes.forEach((freq, i) => {
                    this.playTone(freq, time + i * 0.15, 0.3, 0.15);
                });
                break;
            case 'lose':
                // 失败音效
                this.playTone(300, time, 0.5, 0.15, 'sawtooth');
                this.playTone(200, time + 0.2, 0.5, 0.12, 'sawtooth');
                break;
            case 'pass':
                this.playTone(400, time, 0.1, 0.08);
                this.playTone(300, time + 0.1, 0.15, 0.06);
                break;
            case 'deal':
                // 发牌音效
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

    toString() {
        if (this.value === 'joker_small') return '小王';
        if (this.value === 'joker_big') return '大王';
        return `${this.suit}${this.value}`;
    }

    isRed() {
        return this.suit === '♥' || this.suit === '♦' || this.value === 'joker_big';
    }
}

class Deck {
    constructor() {
        this.cards = [];
        this.init();
    }

    init() {
        this.cards = [];
        // 普通牌
        for (const suit of SUITS) {
            for (const value of ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2']) {
                this.cards.push(new Card(value, suit));
            }
        }
        // 大小王
        this.cards.push(new Card('joker_small', '🃏'));
        this.cards.push(new Card('joker_big', '🃏'));
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

class CardAnalyzer {
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

    static analyze(cards) {
        if (!cards || cards.length === 0) return null;
        
        const sorted = this.sortCards(cards);
        const weightCount = this.getWeightCount(sorted);
        const weights = Object.keys(weightCount).map(Number).sort((a, b) => a - b);
        
        // 王炸
        if (cards.length === 2 && sorted[0].weight === 17 && sorted[1].weight === 16) {
            return { type: CARD_TYPES.ROCKET, weight: 17, cards: sorted };
        }
        
        // 炸弹
        if (cards.length === 4 && weightCount[weights[0]] === 4) {
            return { type: CARD_TYPES.BOMB, weight: weights[0], cards: sorted };
        }
        
        // 单张
        if (cards.length === 1) {
            return { type: CARD_TYPES.SINGLE, weight: sorted[0].weight, cards: sorted };
        }
        
        // 对子
        if (cards.length === 2 && weightCount[weights[0]] === 2) {
            return { type: CARD_TYPES.PAIR, weight: sorted[0].weight, cards: sorted };
        }
        
        // 三张
        if (cards.length === 3 && weightCount[weights[0]] === 3) {
            return { type: CARD_TYPES.TRIPLE, weight: weights[0], cards: sorted };
        }
        
        // 三带一
        if (cards.length === 4) {
            for (const w of weights) {
                if (weightCount[w] === 3) {
                    return { type: CARD_TYPES.TRIPLE_ONE, weight: w, cards: sorted };
                }
            }
        }
        
        // 三带二
        if (cards.length === 5) {
            let tripleWeight = null;
            let pairWeight = null;
            for (const w of weights) {
                if (weightCount[w] === 3) tripleWeight = w;
                else if (weightCount[w] === 2) pairWeight = w;
            }
            if (tripleWeight !== null && pairWeight !== null) {
                return { type: CARD_TYPES.TRIPLE_TWO, weight: tripleWeight, cards: sorted };
            }
        }
        
        // 顺子
        if (cards.length >= 5 && weights.length === cards.length) {
            let isStraight = true;
            for (let i = 1; i < weights.length; i++) {
                if (weights[i] - weights[i-1] !== 1) {
                    isStraight = false;
                    break;
                }
            }
            if (isStraight && weights[weights.length-1] <= 14) {
                return { type: CARD_TYPES.STRAIGHT, weight: weights[weights.length-1], length: weights.length, cards: sorted };
            }
        }
        
        // 连对
        if (cards.length >= 6 && cards.length % 2 === 0 && weights.length === cards.length / 2) {
            let isDoubleStraight = true;
            for (const w of weights) {
                if (weightCount[w] !== 2) {
                    isDoubleStraight = false;
                    break;
                }
            }
            if (isDoubleStraight) {
                for (let i = 1; i < weights.length; i++) {
                    if (weights[i] - weights[i-1] !== 1) {
                        isDoubleStraight = false;
                        break;
                    }
                }
            }
            if (isDoubleStraight && weights[weights.length-1] <= 14) {
                return { type: CARD_TYPES.STRAIGHT_PAIR, weight: weights[weights.length-1], length: weights.length, cards: sorted };
            }
        }
        
        // 四带二
        if (cards.length === 6) {
            let fourWeight = null;
            for (const w of weights) {
                if (weightCount[w] === 4) fourWeight = w;
            }
            if (fourWeight !== null) {
                return { type: CARD_TYPES.FOUR_TWO, weight: fourWeight, cards: sorted };
            }
        }
        
        // 四带两对
        if (cards.length === 8) {
            let fourWeight = null;
            let pairCount = 0;
            for (const w of weights) {
                if (weightCount[w] === 4) fourWeight = w;
                else if (weightCount[w] === 2) pairCount++;
            }
            if (fourWeight !== null && pairCount === 2) {
                return { type: CARD_TYPES.FOUR_TWO_PAIR, weight: fourWeight, cards: sorted };
            }
        }
        
        return null;
    }

    static canBeat(cards, lastCards) {
        const current = this.analyze(cards);
        const last = this.analyze(lastCards);
        
        if (!current) return false;
        if (!last) return true;
        
        // 王炸最大
        if (current.type === CARD_TYPES.ROCKET) return true;
        if (last.type === CARD_TYPES.ROCKET) return false;
        
        // 炸弹打非炸弹
        if (current.type === CARD_TYPES.BOMB && last.type !== CARD_TYPES.BOMB) return true;
        if (last.type === CARD_TYPES.BOMB && current.type !== CARD_TYPES.BOMB) return false;
        
        // 同牌型比较
        if (current.type === last.type) {
            if (current.length && last.length && current.length !== last.length) return false;
            return current.weight > last.weight;
        }
        
        return false;
    }

    static findAllCombinations(cards) {
        const combinations = [];
        const sorted = this.sortCards(cards);
        const weightCount = this.getWeightCount(sorted);
        const weights = Object.keys(weightCount).map(Number).sort((a, b) => a - b);
        
        // 单张
        for (const card of sorted) {
            combinations.push([card]);
        }
        
        // 对子
        for (const w of weights) {
            if (weightCount[w] >= 2) {
                const pairCards = sorted.filter(c => c.weight === w).slice(0, 2);
                combinations.push(pairCards);
            }
        }
        
        // 三张
        for (const w of weights) {
            if (weightCount[w] >= 3) {
                const tripleCards = sorted.filter(c => c.weight === w).slice(0, 3);
                combinations.push(tripleCards);
            }
        }
        
        // 炸弹
        for (const w of weights) {
            if (weightCount[w] === 4) {
                combinations.push(sorted.filter(c => c.weight === w));
            }
        }
        
        // 王炸
        const smallJoker = sorted.find(c => c.weight === 16);
        const bigJoker = sorted.find(c => c.weight === 17);
        if (smallJoker && bigJoker) {
            combinations.push([smallJoker, bigJoker]);
        }
        
        // 三带一
        for (const w of weights) {
            if (weightCount[w] >= 3) {
                const tripleCards = sorted.filter(c => c.weight === w).slice(0, 3);
                for (const card of sorted) {
                    if (card.weight !== w) {
                        combinations.push([...tripleCards, card]);
                    }
                }
            }
        }
        
        // 三带二
        for (const w1 of weights) {
            if (weightCount[w1] >= 3) {
                const tripleCards = sorted.filter(c => c.weight === w1).slice(0, 3);
                for (const w2 of weights) {
                    if (w1 !== w2 && weightCount[w2] >= 2) {
                        const pairCards = sorted.filter(c => c.weight === w2).slice(0, 2);
                        combinations.push([...tripleCards, ...pairCards]);
                    }
                }
            }
        }
        
        // 顺子 (5-12张)
        for (let len = 5; len <= 12; len++) {
            for (let start = 0; start <= weights.length - len; start++) {
                let valid = true;
                const seqWeights = [];
                for (let i = 0; i < len; i++) {
                    const expected = weights[start] + i;
                    if (weights[start + i] !== expected || expected > 14) {
                        valid = false;
                        break;
                    }
                    seqWeights.push(expected);
                }
                if (valid) {
                    const straight = [];
                    for (const w of seqWeights) {
                        straight.push(sorted.find(c => c.weight === w));
                    }
                    combinations.push(straight);
                }
            }
        }
        
        // 连对 (3-10对)
        for (let len = 3; len <= 10; len++) {
            for (let start = 0; start <= weights.length - len; start++) {
                let valid = true;
                const seqWeights = [];
                for (let i = 0; i < len; i++) {
                    const expected = weights[start] + i;
                    if (weights[start + i] !== expected || expected > 14 || weightCount[expected] < 2) {
                        valid = false;
                        break;
                    }
                    seqWeights.push(expected);
                }
                if (valid) {
                    const doubleStraight = [];
                    for (const w of seqWeights) {
                        doubleStraight.push(...sorted.filter(c => c.weight === w).slice(0, 2));
                    }
                    combinations.push(doubleStraight);
                }
            }
        }
        
        return combinations;
    }

    static findHint(cards, lastCards) {
        if (!lastCards || lastCards.length === 0) {
            const allCombos = this.findAllCombinations(cards);
            if (allCombos.length === 0) return null;
            allCombos.sort((a, b) => {
                const typeOrder = { rocket: 0, bomb: 1, single: 2, pair: 3, triple: 4 };
                const aType = this.analyze(a).type;
                const bType = this.analyze(b).type;
                const orderA = typeOrder[aType] || 100;
                const orderB = typeOrder[bType] || 100;
                if (orderA !== orderB) return orderA - orderB;
                return this.analyze(a).weight - this.analyze(b).weight;
            });
            return allCombos[0];
        }
        
        const allCombos = this.findAllCombinations(cards);
        const validCombos = allCombos.filter(combo => this.canBeat(combo, lastCards));
        if (validCombos.length === 0) return null;
        
        validCombos.sort((a, b) => {
            const aAnalysis = this.analyze(a);
            const bAnalysis = this.analyze(b);
            if (aAnalysis.type === 'bomb' && bAnalysis.type !== 'bomb') return 1;
            if (aAnalysis.type !== 'bomb' && bAnalysis.type === 'bomb') return -1;
            if (aAnalysis.type === 'rocket' && bAnalysis.type !== 'rocket') return 1;
            if (aAnalysis.type !== 'rocket' && bAnalysis.type === 'rocket') return -1;
            return aAnalysis.weight - bAnalysis.weight;
        });
        
        return validCombos[0];
    }
}

class AIPlayer {
    constructor(cards, playerId) {
        this.cards = CardAnalyzer.sortCards(cards);
        this.playerId = playerId;
    }

    addDipai(dipai) {
        this.cards = CardAnalyzer.sortCards([...this.cards, ...dipai]);
    }

    decideCall(lastCall, canCall) {
        const bigCards = this.cards.filter(c => c.weight >= 15).length;
        const bombs = this.countBombs();
        const score = bigCards * 2 + bombs * 3;
        
        if (!canCall) return false;
        if (lastCall && score < 8) return false;
        return score >= 6 + (lastCall ? 2 : 0) + Math.random() * 3;
    }

    countBombs() {
        const weightCount = CardAnalyzer.getWeightCount(this.cards);
        let bombs = 0;
        for (const w in weightCount) {
            if (weightCount[w] === 4) bombs++;
        }
        if (this.cards.find(c => c.weight === 16) && this.cards.find(c => c.weight === 17)) {
            bombs++;
        }
        return bombs;
    }

    play(lastPlayed) {
        const hint = CardAnalyzer.findHint(this.cards, lastPlayed);
        if (!hint) return null;
        
        if (lastPlayed && Math.random() < 0.3) {
            const allValid = CardAnalyzer.findAllCombinations(this.cards)
                .filter(c => CardAnalyzer.canBeat(c, lastPlayed));
            if (allValid.length > 1) {
                return allValid[Math.floor(Math.random() * allValid.length)];
            }
        }
        
        return hint;
    }

    removeCards(cards) {
        for (const card of cards) {
            const idx = this.cards.findIndex(c => c.id === card.id);
            if (idx !== -1) this.cards.splice(idx, 1);
        }
    }
}

class Game {
    constructor() {
        this.deck = null;
        this.players = [];
        this.dipai = [];
        this.landlord = -1;
        this.currentPlayer = 0;
        this.lastPlayed = null;
        this.lastPlayer = -1;
        this.phase = 'waiting';
        this.scores = [0, 0, 0];
        this.baseScore = 0;
        this.multiplier = 1;
        this.passCount = 0;
        this.callPhase = { current: 0, lastCall: -1, canCall: true };
        this.audio = new AudioManager();
        
        this.initUI();
        this.bindEvents();
    }

    initUI() {
        this.ui = {
            startBtn: document.getElementById('start-btn'),
            musicBtn: document.getElementById('music-btn'),
            soundBtn: document.getElementById('sound-btn'),
            baseScore: document.getElementById('base-score'),
            multiplier: document.getElementById('multiplier'),
            playerCards: document.getElementById('player-cards'),
            opponent1Cards: document.getElementById('opponent1-cards'),
            opponent2Cards: document.getElementById('opponent2-cards'),
            dipaiCards: document.getElementById('dipai-cards'),
            playerPlayed: document.getElementById('player-played'),
            opponent1Played: document.getElementById('opponent1-played'),
            opponent2Played: document.getElementById('opponent2-played'),
            callBtns: document.getElementById('call-btns'),
            playBtns: document.getElementById('play-btns'),
            btnNoCall: document.getElementById('btn-no-call'),
            btnCall: document.getElementById('btn-call'),
            btnHint: document.getElementById('btn-hint'),
            btnPass: document.getElementById('btn-pass'),
            btnPlay: document.getElementById('btn-play'),
            gameOverModal: document.getElementById('game-over-modal'),
            gameResult: document.getElementById('game-result'),
            gameScore: document.getElementById('game-score'),
            btnRestart: document.getElementById('btn-restart')
        };
    }

    bindEvents() {
        this.ui.startBtn.addEventListener('click', () => {
            this.audio.resumeContext();
            this.audio.playSound('click');
            this.startGame();
        });
        this.ui.musicBtn.addEventListener('click', () => {
            this.audio.resumeContext();
            const enabled = this.audio.toggleMusic();
            this.ui.musicBtn.textContent = enabled ? '🔊' : '🔇';
            this.ui.musicBtn.classList.toggle('muted', !enabled);
            this.audio.playSound('click');
        });
        this.ui.soundBtn.addEventListener('click', () => {
            this.audio.resumeContext();
            const enabled = this.audio.toggleSound();
            this.ui.soundBtn.textContent = enabled ? '🔔' : '🔕';
            this.ui.soundBtn.classList.toggle('muted', !enabled);
            this.audio.playSound('click');
        });
        this.ui.btnNoCall.addEventListener('click', () => {
            this.audio.playSound('click');
            this.handleCall(false);
        });
        this.ui.btnCall.addEventListener('click', () => {
            this.audio.playSound('click');
            this.handleCall(true);
        });
        this.ui.btnHint.addEventListener('click', () => {
            this.audio.playSound('click');
            this.handleHint();
        });
        this.ui.btnPass.addEventListener('click', () => {
            this.audio.playSound('pass');
            this.handlePass();
        });
        this.ui.btnPlay.addEventListener('click', () => {
            this.audio.playSound('click');
            this.handlePlay();
        });
        this.ui.btnRestart.addEventListener('click', () => {
            this.audio.playSound('click');
            this.restartGame();
        });
    }

    startGame() {
        this.audio.playBackgroundMusic();
        this.audio.playSound('deal');
        
        this.deck = new Deck();
        this.deck.shuffle();
        const deal = this.deck.deal();
        
        this.players = [
            { cards: CardAnalyzer.sortCards(deal.player1), isAI: false },
            { cards: CardAnalyzer.sortCards(deal.player2), isAI: true },
            { cards: CardAnalyzer.sortCards(deal.player3), isAI: true }
        ];
        this.aiPlayers = [
            null,
            new AIPlayer(deal.player2, 1),
            new AIPlayer(deal.player3, 2)
        ];
        
        this.dipai = deal.dipai;
        this.landlord = -1;
        this.currentPlayer = Math.floor(Math.random() * 3);
        this.lastPlayed = null;
        this.lastPlayer = -1;
        this.baseScore = 0;
        this.multiplier = 1;
        this.passCount = 0;
        this.callPhase = { current: this.currentPlayer, lastCall: -1, canCall: true };
        this.phase = 'calling';
        this.selectedCards = [];
        
        this.renderDipai(false);
        this.renderPlayerCards();
        this.renderOpponentCards();
        this.clearPlayedCards();
        this.ui.startBtn.style.display = 'none';
        
        this.updateScoreDisplay();
        this.nextCall();
    }

    nextCall() {
        if (this.callPhase.canCall === false && this.callPhase.lastCall === -1) {
            this.startGame();
            return;
        }
        
        if (this.callPhase.current === this.callPhase.lastCall || 
            (this.callPhase.current === (this.callPhase.lastCall + 1) % 3 && !this.callPhase.canCall)) {
            this.startPlayPhase();
            return;
        }
        
        if (this.players[this.callPhase.current].isAI) {
            setTimeout(() => {
                const ai = this.aiPlayers[this.callPhase.current];
                const willCall = ai.decideCall(this.callPhase.lastCall !== -1, this.callPhase.canCall);
                if (willCall) {
                    this.landlord = this.callPhase.current;
                    this.baseScore = this.callPhase.lastCall === -1 ? 1 : Math.min(this.baseScore + 1, 3);
                    this.callPhase.lastCall = this.callPhase.current;
                    this.callPhase.canCall = true;
                } else {
                    this.callPhase.canCall = this.callPhase.lastCall !== -1;
                }
                this.callPhase.current = (this.callPhase.current + 1) % 3;
                this.updateScoreDisplay();
                this.nextCall();
            }, 1000);
        } else {
            this.ui.callBtns.style.display = 'flex';
            this.ui.btnCall.textContent = this.callPhase.lastCall === -1 ? '叫地主' : '抢地主';
        }
    }

    handleCall(willCall) {
        this.ui.callBtns.style.display = 'none';
        
        if (willCall) {
            this.landlord = this.callPhase.current;
            this.baseScore = this.callPhase.lastCall === -1 ? 1 : Math.min(this.baseScore + 1, 3);
            this.callPhase.lastCall = this.callPhase.current;
            this.callPhase.canCall = true;
        } else {
            this.callPhase.canCall = this.callPhase.lastCall !== -1;
        }
        
        this.callPhase.current = (this.callPhase.current + 1) % 3;
        this.updateScoreDisplay();
        this.nextCall();
    }

    startPlayPhase() {
        this.players[this.landlord].cards = CardAnalyzer.sortCards(
            [...this.players[this.landlord].cards, ...this.dipai]
        );
        if (this.aiPlayers[this.landlord]) {
            this.aiPlayers[this.landlord].addDipai(this.dipai);
        }
        
        this.phase = 'playing';
        this.currentPlayer = this.landlord;
        this.lastPlayed = null;
        this.lastPlayer = -1;
        this.passCount = 0;
        
        this.renderDipai(true);
        this.renderPlayerCards();
        this.renderOpponentCards();
        
        this.nextTurn();
    }

    nextTurn() {
        if (this.checkWin()) return;
        
        if (this.players[this.currentPlayer].isAI) {
            setTimeout(() => {
                const ai = this.aiPlayers[this.currentPlayer];
                let played = ai.play(this.lastPlayed);
                
                if (played) {
                    if (this.lastPlayed !== null && this.lastPlayer !== -1) {
                        if (CardAnalyzer.analyze(played).type === 'bomb' && Math.random() < 0.3) {
                            played = null;
                        }
                    }
                }
                
                if (played) {
                    this.lastPlayed = played;
                    this.lastPlayer = this.currentPlayer;
                    this.passCount = 0;
                    ai.removeCards(played);
                    this.players[this.currentPlayer].cards = ai.cards;
                    
                    const analysis = CardAnalyzer.analyze(played);
                    if (analysis.type === 'bomb' || analysis.type === 'rocket') {
                        this.multiplier *= 2;
                        this.updateScoreDisplay();
                    }
                    
                    this.renderPlayedCards(this.currentPlayer, played);
                    this.renderOpponentCards();
                } else {
                    this.passCount++;
                    this.renderPass(this.currentPlayer);
                }
                
                if (this.passCount >= 2) {
                    this.lastPlayed = null;
                    this.lastPlayer = -1;
                    this.passCount = 0;
                    this.clearPlayedCards();
                }
                
                this.currentPlayer = (this.currentPlayer + 1) % 3;
                this.nextTurn();
            }, 1500);
        } else {
            this.ui.playBtns.style.display = 'flex';
            this.ui.btnPass.style.display = this.lastPlayed && this.lastPlayer !== -1 ? 'inline-block' : 'none';
        }
    }

    handleHint() {
        const hint = CardAnalyzer.findHint(this.players[0].cards, this.lastPlayed);
        if (hint) {
            this.selectedCards = hint;
            this.highlightSelectedCards();
        }
    }

    handlePass() {
        this.ui.playBtns.style.display = 'none';
        this.selectedCards = [];
        this.passCount++;
        this.renderPass(0);
        
        if (this.passCount >= 2) {
            this.lastPlayed = null;
            this.lastPlayer = -1;
            this.passCount = 0;
            this.clearPlayedCards();
        }
        
        this.currentPlayer = (this.currentPlayer + 1) % 3;
        this.nextTurn();
    }

    handlePlay() {
        if (this.selectedCards.length === 0) return;
        
        const analysis = CardAnalyzer.analyze(this.selectedCards);
        if (!analysis) {
            alert('无效的牌型！');
            return;
        }
        
        if (this.lastPlayed && this.lastPlayer !== -1) {
            if (!CardAnalyzer.canBeat(this.selectedCards, this.lastPlayed)) {
                alert('打不过上家的牌！');
                return;
            }
        }
        
        this.ui.playBtns.style.display = 'none';
        
        this.lastPlayed = this.selectedCards;
        this.lastPlayer = 0;
        this.passCount = 0;
        
        for (const card of this.selectedCards) {
            const idx = this.players[0].cards.findIndex(c => c.id === card.id);
            if (idx !== -1) this.players[0].cards.splice(idx, 1);
        }
        
        if (analysis.type === 'bomb' || analysis.type === 'rocket') {
            this.multiplier *= 2;
            this.updateScoreDisplay();
            this.audio.playSound('bomb');
        } else {
            this.audio.playSound('play');
        }
        
        this.renderPlayedCards(0, this.selectedCards);
        this.selectedCards = [];
        this.renderPlayerCards();
        
        this.currentPlayer = (this.currentPlayer + 1) % 3;
        this.nextTurn();
    }

    checkWin() {
        for (let i = 0; i < 3; i++) {
            if (this.players[i].cards.length === 0) {
                this.endGame(i);
                return true;
            }
        }
        return false;
    }

    endGame(winner) {
        this.phase = 'ended';
        
        this.audio.stopBackgroundMusic();
        
        const landlordWin = winner === this.landlord;
        const playerWin = (winner === 0) || (!landlordWin && this.landlord !== 0);
        
        if (playerWin) {
            this.audio.playSound('win');
        } else {
            this.audio.playSound('lose');
        }
        
        const score = this.baseScore * this.multiplier;
        
        if (landlordWin) {
            for (let i = 0; i < 3; i++) {
                if (i === this.landlord) this.scores[i] += score * 2;
                else this.scores[i] -= score;
            }
        } else {
            for (let i = 0; i < 3; i++) {
                if (i === this.landlord) this.scores[i] -= score * 2;
                else this.scores[i] += score;
            }
        }
        
        this.ui.gameResult.textContent = playerWin ? '🎉 你赢了！' : '😢 你输了！';
        this.ui.gameScore.textContent = `积分变化: ${playerWin ? '+' : ''}${this.scores[0]}`;
        this.ui.gameOverModal.style.display = 'flex';
    }

    restartGame() {
        this.ui.gameOverModal.style.display = 'none';
        this.ui.startBtn.style.display = 'inline-block';
        this.ui.callBtns.style.display = 'none';
        this.ui.playBtns.style.display = 'none';
        this.clearPlayedCards();
        this.ui.playerCards.innerHTML = '';
        this.ui.opponent1Cards.innerHTML = '';
        this.ui.opponent2Cards.innerHTML = '';
        this.ui.dipaiCards.innerHTML = '';
    }

    renderDipai(show) {
        this.ui.dipaiCards.innerHTML = '';
        if (show) {
            for (const card of this.dipai) {
                this.ui.dipaiCards.appendChild(this.createCardElement(card, false));
            }
        } else {
            for (let i = 0; i < 3; i++) {
                const back = document.createElement('div');
                back.className = 'card-back';
                this.ui.dipaiCards.appendChild(back);
            }
        }
    }

    renderPlayerCards() {
        this.ui.playerCards.innerHTML = '';
        this.selectedCards = [];
        
        for (const card of this.players[0].cards) {
            const el = this.createCardElement(card, true);
            el.addEventListener('click', () => this.toggleCardSelection(card, el));
            this.ui.playerCards.appendChild(el);
        }
    }

    renderOpponentCards() {
        this.ui.opponent1Cards.innerHTML = '';
        this.ui.opponent2Cards.innerHTML = '';
        
        for (let i = 0; i < this.players[1].cards.length; i++) {
            const back = document.createElement('div');
            back.className = 'card-back';
            this.ui.opponent1Cards.appendChild(back);
        }
        
        for (let i = 0; i < this.players[2].cards.length; i++) {
            const back = document.createElement('div');
            back.className = 'card-back';
            this.ui.opponent2Cards.appendChild(back);
        }
    }

    createCardElement(card, interactive) {
        const el = document.createElement('div');
        el.className = 'card';
        
        if (card.value === 'joker_small') {
            el.classList.add('joker-black');
            el.innerHTML = `
                <div class="card-value" style="font-size:14px">小</div>
                <div class="card-suit">🃏</div>
            `;
        } else if (card.value === 'joker_big') {
            el.classList.add('joker-red');
            el.innerHTML = `
                <div class="card-value" style="font-size:14px">大</div>
                <div class="card-suit">🃏</div>
            `;
        } else {
            if (card.isRed()) el.classList.add('red');
            else el.classList.add('black');
            
            el.innerHTML = `
                <div class="card-value">${card.value}</div>
                <div class="card-suit">${card.suit}</div>
            `;
        }
        
        el.dataset.cardId = card.id;
        return el;
    }

    toggleCardSelection(card, element) {
        const idx = this.selectedCards.findIndex(c => c.id === card.id);
        if (idx !== -1) {
            this.selectedCards.splice(idx, 1);
            element.classList.remove('selected');
        } else {
            this.selectedCards.push(card);
            element.classList.add('selected');
        }
    }

    highlightSelectedCards() {
        const elements = this.ui.playerCards.querySelectorAll('.card');
        elements.forEach(el => el.classList.remove('selected'));
        
        for (const card of this.selectedCards) {
            const el = this.ui.playerCards.querySelector(`[data-card-id="${card.id}"]`);
            if (el) el.classList.add('selected');
        }
    }

    renderPlayedCards(player, cards) {
        const containers = [this.ui.playerPlayed, this.ui.opponent1Played, this.ui.opponent2Played];
        containers.forEach(c => c.innerHTML = '');
        
        const container = containers[player];
        for (const card of cards) {
            container.appendChild(this.createCardElement(card, false));
        }
    }

    renderPass(player) {
        const containers = [this.ui.playerPlayed, this.ui.opponent1Played, this.ui.opponent2Played];
        containers[player].innerHTML = '<div class="pass-text">不出</div>';
    }

    clearPlayedCards() {
        this.ui.playerPlayed.innerHTML = '';
        this.ui.opponent1Played.innerHTML = '';
        this.ui.opponent2Played.innerHTML = '';
    }

    updateScoreDisplay() {
        this.ui.baseScore.textContent = this.baseScore;
        this.ui.multiplier.textContent = this.multiplier;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new Game();
});