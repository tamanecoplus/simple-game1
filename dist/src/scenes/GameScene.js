import { ENEMY_SPEED, GAME_HEIGHT, GAME_WIDTH, PLAYER_ATTACK_COOLDOWN_MS, PLAYER_ATTACK_RANGE, PLAYER_INVULNERABLE_MS, PLAYER_MAX_HP, PLAYER_SPEED, } from '../core/constants.js';
import { normalizeMovement } from '../input/movement.js';
const ATTACK_KEYS = ['Space'];
const MENU_KEYS = ['Escape'];
const NUMPAD_KEYS = {
    up: ['Numpad8', 'Numpad7', 'Numpad9'],
    down: ['Numpad2', 'Numpad1', 'Numpad3'],
    left: ['Numpad4', 'Numpad7', 'Numpad1'],
    right: ['Numpad6', 'Numpad9', 'Numpad3'],
};
export class GameScene {
    ctx;
    pressedKeys = new Set();
    player = { x: 150, y: 392, width: 28, height: 34 };
    enemies = [
        { x: 486, y: 244, width: 30, height: 30, hp: 2, maxHp: 2, speed: ENEMY_SPEED, color: '#ef4444', label: 'Slime' },
        { x: 620, y: 322, width: 30, height: 30, hp: 2, maxHp: 2, speed: ENEMY_SPEED, color: '#f97316', label: 'Bat' },
        { x: 770, y: 156, width: 52, height: 52, hp: 6, maxHp: 6, speed: ENEMY_SPEED * 0.7, color: '#a855f7', label: 'Boss' },
    ];
    state = 'playing';
    playerHp = PLAYER_MAX_HP;
    lastFrameAt = 0;
    lastAttackAt = -PLAYER_ATTACK_COOLDOWN_MS;
    invulnerableUntil = 0;
    attackEffectUntil = 0;
    statusText = '敵を倒してボス部屋へ進もう';
    constructor(canvas) {
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Canvas 2D context is required.');
        }
        this.ctx = context;
        this.bindInput();
    }
    start() {
        requestAnimationFrame(this.tick);
    }
    tick = (time) => {
        const deltaSeconds = Math.min((time - this.lastFrameAt) / 1000 || 0, 0.033);
        this.lastFrameAt = time;
        if (this.state === 'playing') {
            this.update(deltaSeconds, time);
        }
        this.render(time);
        requestAnimationFrame(this.tick);
    };
    bindInput() {
        window.addEventListener('keydown', (event) => {
            if ([...ATTACK_KEYS, ...MENU_KEYS].includes(event.code) || event.code.startsWith('Numpad')) {
                event.preventDefault();
            }
            if (MENU_KEYS.includes(event.code)) {
                this.toggleMenu();
                return;
            }
            if (ATTACK_KEYS.includes(event.code) && !event.repeat && this.state === 'playing') {
                this.attack(performance.now());
            }
            this.pressedKeys.add(event.code);
        });
        window.addEventListener('keyup', (event) => {
            this.pressedKeys.delete(event.code);
        });
    }
    update(deltaSeconds, time) {
        this.updatePlayer(deltaSeconds);
        this.updateEnemies(deltaSeconds);
        this.resolveCollisions(time);
    }
    updatePlayer(deltaSeconds) {
        const movement = normalizeMovement(this.getMovementKeys());
        this.player.x = clamp(this.player.x + movement.x * PLAYER_SPEED * deltaSeconds, 58, GAME_WIDTH - 58 - this.player.width);
        this.player.y = clamp(this.player.y + movement.y * PLAYER_SPEED * deltaSeconds, 92, GAME_HEIGHT - 58 - this.player.height);
    }
    updateEnemies(deltaSeconds) {
        for (const enemy of this.enemies) {
            const enemyCenter = centerOf(enemy);
            const playerCenter = centerOf(this.player);
            const dx = playerCenter.x - enemyCenter.x;
            const dy = playerCenter.y - enemyCenter.y;
            const distance = Math.hypot(dx, dy);
            if (distance > 8 && distance < 370) {
                enemy.x += (dx / distance) * enemy.speed * deltaSeconds;
                enemy.y += (dy / distance) * enemy.speed * deltaSeconds;
            }
        }
    }
    resolveCollisions(time) {
        if (time < this.invulnerableUntil) {
            return;
        }
        const hit = this.enemies.some((enemy) => intersects(this.player, enemy));
        if (!hit) {
            return;
        }
        this.playerHp -= 1;
        this.invulnerableUntil = time + PLAYER_INVULNERABLE_MS;
        this.statusText = this.playerHp > 0 ? 'ダメージ！ 距離を取ってSpaceで反撃' : 'ゲームオーバー: 再読み込みで再挑戦';
        if (this.playerHp <= 0) {
            this.state = 'gameover';
        }
    }
    attack(time) {
        if (time - this.lastAttackAt < PLAYER_ATTACK_COOLDOWN_MS) {
            return;
        }
        this.lastAttackAt = time;
        this.attackEffectUntil = time + 140;
        const playerCenter = centerOf(this.player);
        let hitCount = 0;
        this.enemies = this.enemies.filter((enemy) => {
            const enemyCenter = centerOf(enemy);
            const distance = Math.hypot(playerCenter.x - enemyCenter.x, playerCenter.y - enemyCenter.y);
            if (distance > PLAYER_ATTACK_RANGE) {
                return true;
            }
            enemy.hp -= 1;
            hitCount += 1;
            return enemy.hp > 0;
        });
        if (this.enemies.length === 0) {
            this.state = 'clear';
            this.statusText = 'クリア！ 最小デモ完了';
        }
        else if (hitCount > 0) {
            this.statusText = '命中！ 残りの敵を倒そう';
        }
        else {
            this.statusText = '空振り。近づいてSpaceで攻撃';
        }
    }
    toggleMenu() {
        if (this.state === 'gameover' || this.state === 'clear') {
            return;
        }
        this.state = this.state === 'menu' ? 'playing' : 'menu';
    }
    getMovementKeys() {
        return {
            up: this.hasAnyKey(['KeyW', ...NUMPAD_KEYS.up]),
            down: this.hasAnyKey(['KeyS', ...NUMPAD_KEYS.down]),
            left: this.hasAnyKey(['KeyA', ...NUMPAD_KEYS.left]),
            right: this.hasAnyKey(['KeyD', ...NUMPAD_KEYS.right]),
        };
    }
    hasAnyKey(keys) {
        return keys.some((key) => this.pressedKeys.has(key));
    }
    render(time) {
        this.ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        this.drawArena();
        this.drawTreasure();
        this.drawEnemies();
        this.drawPlayer(time);
        this.drawAttackEffect(time);
        this.drawHud();
        if (this.state === 'menu') {
            this.drawMenu();
        }
        if (this.state === 'gameover' || this.state === 'clear') {
            this.drawEndPanel();
        }
    }
    drawArena() {
        this.ctx.fillStyle = '#1d2b22';
        this.ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        this.drawPanel(50, 88, 860, 390, '#243a2d', '#6b8f71');
        this.drawPanel(112, 234, 150, 70, '#2f4f3c', '#8fb996');
        this.drawPanel(690, 144, 170, 74, '#2f4f3c', '#8fb996');
        this.drawText('草むら', 126, 260, '#b7f7c2', 14);
        this.drawText('ボス部屋', 716, 170, '#f5d0fe', 14);
    }
    drawTreasure() {
        this.drawPanel(458, 430, 24, 20, '#facc15', '#fef3c7');
        this.drawText('宝箱（演出のみ）', 432, 466, '#fde68a', 13);
    }
    drawEnemies() {
        for (const enemy of this.enemies) {
            this.drawPanel(enemy.x, enemy.y, enemy.width, enemy.height, enemy.color, '#fee2e2');
            this.drawText(enemy.label, enemy.x - 8, enemy.y - 8, '#fee2e2', 12);
            this.drawHealthBar(enemy.x, enemy.y + enemy.height + 6, enemy.width, enemy.hp / enemy.maxHp, '#fb7185');
        }
    }
    drawPlayer(time) {
        const isInvulnerable = time < this.invulnerableUntil;
        const color = isInvulnerable && Math.floor(time / 90) % 2 === 0 ? '#fca5a5' : '#5eead4';
        this.drawPanel(this.player.x, this.player.y, this.player.width, this.player.height, color, '#ecfeff');
    }
    drawAttackEffect(time) {
        if (time > this.attackEffectUntil) {
            return;
        }
        const progress = 1 - (this.attackEffectUntil - time) / 140;
        const playerCenter = centerOf(this.player);
        this.ctx.beginPath();
        this.ctx.arc(playerCenter.x, playerCenter.y, PLAYER_ATTACK_RANGE * (0.85 + progress * 0.18), 0, Math.PI * 2);
        this.ctx.fillStyle = `rgb(254 243 199 / ${0.22 * (1 - progress)})`;
        this.ctx.fill();
        this.ctx.strokeStyle = `rgb(250 204 21 / ${0.9 * (1 - progress)})`;
        this.ctx.lineWidth = 4;
        this.ctx.stroke();
    }
    drawHud() {
        this.drawText('Simple Game 1', 24, 32, '#fef3c7', 24, 'bold');
        this.drawText('移動: テンキー / WASD    攻撃: Space    メニュー: Esc', 24, 62, '#d1fae5', 16);
        this.drawText(`HP: ${'♥'.repeat(Math.max(this.playerHp, 0))}${'♡'.repeat(Math.max(PLAYER_MAX_HP - this.playerHp, 0))}`, 24, 516, '#fecaca', 20, 'bold');
        this.drawText(this.statusText, 592, 516, '#e0f2fe', 16);
    }
    drawMenu() {
        this.drawOverlayPanel('メニュー / ポーズ', ['Escでゲームに戻る', 'Space: 通常攻撃', 'テンキー/WASD: 移動']);
    }
    drawEndPanel() {
        const lines = this.state === 'clear' ? ['最小デモ完了！', 'リロードで再プレイ'] : ['ゲームオーバー', 'リロードで再挑戦'];
        this.drawOverlayPanel(this.state === 'clear' ? 'CLEAR' : 'GAME OVER', lines);
    }
    drawOverlayPanel(title, lines) {
        this.ctx.fillStyle = 'rgb(15 23 42 / 0.88)';
        this.ctx.fillRect(300, 178, 360, 190);
        this.ctx.strokeStyle = '#93c5fd';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(300, 178, 360, 190);
        this.drawText(title, 330, 226, '#bfdbfe', 24, 'bold');
        lines.forEach((line, index) => this.drawText(line, 330, 270 + index * 30, '#f8fafc', 18));
    }
    drawPanel(x, y, width, height, fill, stroke) {
        this.ctx.fillStyle = fill;
        this.ctx.fillRect(x, y, width, height);
        this.ctx.strokeStyle = stroke;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(x, y, width, height);
    }
    drawHealthBar(x, y, width, ratio, color) {
        this.ctx.fillStyle = '#450a0a';
        this.ctx.fillRect(x, y, width, 5);
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, width * ratio, 5);
    }
    drawText(text, x, y, color, size, weight = '400') {
        this.ctx.fillStyle = color;
        this.ctx.font = `${weight} ${size}px system-ui, sans-serif`;
        this.ctx.fillText(text, x, y);
    }
}
function centerOf(rect) {
    return {
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2,
    };
}
function intersects(a, b) {
    return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}
function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
