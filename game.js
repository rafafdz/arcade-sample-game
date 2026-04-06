// Platanus Hack 26: Street Fighters Turbo Remix
// 2-Player Fighting Game

// =============================================================================
// ARCADE BUTTON MAPPING
// =============================================================================
const ARCADE_CONTROLS = {
  // Player 1 - Left side
  P1U: ['w'], // Jump
  P1D: ['s'], // Block
  P1L: ['a'], // Move Left
  P1R: ['d'], // Move Right
  P1A: ['u'], // Punch
  P1B: ['i'], // Kick
  P1C: ['o'], // Special
  START1: ['Enter'],
  COIN1: ['1'],

  // Player 2 - Right side
  P2U: ['ArrowUp'], // Jump
  P2D: ['ArrowDown'], // Block
  P2L: ['ArrowLeft'], // Move Left
  P2R: ['ArrowRight'], // Move Right
  P2A: ['r'], // Punch
  P2B: ['t'], // Kick
  P2C: ['y'], // Special
  START2: ['2'],
  COIN2: ['3'],
};

const KEYBOARD_TO_ARCADE = {};
for (const [arcadeCode, keyboardKeys] of Object.entries(ARCADE_CONTROLS)) {
  if (keyboardKeys) {
    const keys = Array.isArray(keyboardKeys) ? keyboardKeys : [keyboardKeys];
    keys.forEach((key) => {
      KEYBOARD_TO_ARCADE[key] = arcadeCode;
    });
  }
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-root',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 600,
  },
  backgroundColor: '#070b1a',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 1200 },
      debug: false,
    },
  },
  scene: {
    create: create,
    update: update,
  },
};

const _game = new Phaser.Game(config);

// Game state
let p1, p2;
let p1Health = 100,
  p2Health = 100;
let p1HealthBar, p2HealthBar;
let ground;
let gameOver = false;
let winnerText;
let p1Score = 0,
  p2Score = 0;
let scoreText;
let graphics;
let keys = {};
let roundStarted = false;
let p1SpecialActive = false;
let p2SpecialActive = false;
let p1SpecialX = 0;
let p2SpecialX = 0;

// Fighter properties
const FIGHTER = {
  speed: 200,
  jumpVelocity: -450,
  width: 40,
  height: 70,
  punchDamage: 5,
  kickDamage: 10,
  specialDamage: 20,
  punchRange: 50,
  kickRange: 60,
  specialRange: 80,
};

function create() {
  const scene = this;
  graphics = this.add.graphics();

  // Neon cyberpunk background
  this.add.rectangle(400, 300, 800, 600, 0x070b1a);
  this.add.rectangle(400, 90, 800, 180, 0x120a2f, 0.9);
  this.add.rectangle(400, 260, 800, 220, 0x0a1633, 0.92);
  this.add.circle(650, 110, 90, 0xff3cac, 0.22);
  this.add.circle(650, 110, 52, 0xff3cac, 0.48);
  this.add.circle(180, 95, 72, 0x32f6ff, 0.14);
  this.add.circle(180, 95, 38, 0x32f6ff, 0.28);

  const backBuildings = [
    [60, 330, 70, 180],
    [150, 315, 55, 210],
    [230, 345, 65, 150],
    [320, 300, 90, 240],
    [430, 335, 70, 170],
    [525, 305, 80, 230],
    [625, 340, 70, 160],
    [720, 320, 75, 200],
  ];

  const frontBuildings = [
    [95, 385, 95, 140],
    [210, 390, 85, 130],
    [355, 370, 110, 170],
    [520, 380, 90, 140],
    [680, 375, 115, 150],
  ];

  backBuildings.forEach(([x, y, width, height]) => {
    this.add.rectangle(x, y, width, height, 0x11182d, 0.95);
  });

  frontBuildings.forEach(([x, y, width, height]) => {
    this.add.rectangle(x, y, width, height, 0x0d1224, 0.98);
  });

  const neonWindows = [
    [70, 270, 10, 18, 0x32f6ff],
    [90, 300, 10, 18, 0xff3cac],
    [150, 260, 10, 18, 0x32f6ff],
    [170, 290, 10, 18, 0xffb703],
    [230, 300, 10, 18, 0x32f6ff],
    [250, 325, 10, 18, 0xff3cac],
    [320, 245, 12, 20, 0xff3cac],
    [345, 275, 12, 20, 0x32f6ff],
    [430, 295, 10, 18, 0xffb703],
    [455, 265, 10, 18, 0x32f6ff],
    [525, 255, 12, 20, 0xff3cac],
    [555, 290, 12, 20, 0x32f6ff],
    [625, 305, 10, 18, 0xffb703],
    [650, 275, 10, 18, 0xff3cac],
    [715, 280, 10, 18, 0x32f6ff],
    [740, 310, 10, 18, 0xffb703],
  ];

  neonWindows.forEach(([x, y, width, height, color]) => {
    this.add.rectangle(x, y, width, height, color, 0.8);
  });

  this.add.rectangle(400, 515, 800, 6, 0xff3cac, 0.55);
  this.add.rectangle(400, 521, 800, 2, 0x32f6ff, 0.6);

  // Create ground
  ground = this.physics.add.staticGroup();
  const groundY = 550;
  const groundRect = this.add.rectangle(400, groundY, 800, 100, 0x151b2f);
  ground.add(groundRect);
  this.add.rectangle(400, 505, 800, 10, 0x1d2748, 0.95);
  this.add.rectangle(400, 505, 800, 3, 0x32f6ff, 0.45);

  // Player 1 - Trump (left side)
  p1 = this.physics.add.sprite(200, 400, null);
  p1.setSize(FIGHTER.width, FIGHTER.height);
  p1.setCollideWorldBounds(true);
  p1.setBounce(0);
  p1.suitColor = 0x1a1a3e;
  p1.skinColor = 0xffa500;
  p1.hairColor = 0xffd700;
  p1.tieColor = 0xff0000;
  p1.facing = 1; // 1 = right, -1 = left
  p1.attacking = false;
  p1.attackCooldown = 0;
  p1.blocking = false;
  p1.canSpecial = true;

  // Player 2 - Petro (right side)
  p2 = this.physics.add.sprite(600, 400, null);
  p2.setSize(FIGHTER.width, FIGHTER.height);
  p2.setCollideWorldBounds(true);
  p2.setBounce(0);
  p2.suitColor = 0x2d2d2d;
  p2.skinColor = 0xd4a574;
  p2.hairColor = 0x808080;
  p2.glassesColor = 0x000000;
  p2.facing = -1;
  p2.attacking = false;
  p2.attackCooldown = 0;
  p2.blocking = false;
  p2.canSpecial = true;

  // Enable collisions
  this.physics.add.collider(p1, ground);
  this.physics.add.collider(p2, ground);

  // Health bars background
  this.add.rectangle(150, 40, 280, 30, 0x000000);
  this.add.rectangle(650, 40, 280, 30, 0x000000);

  // Health bars
  p1HealthBar = this.add.rectangle(150, 40, 270, 20, 0x00ff00);
  p2HealthBar = this.add.rectangle(650, 40, 270, 20, 0x00ff00);

  // Player labels
  this.add.text(50, 25, 'TRUMP', {
    fontSize: '20px',
    fontFamily: 'Arial',
    color: '#ffd700',
    fontStyle: 'bold',
  });
  this.add.text(690, 25, 'PETRO', {
    fontSize: '20px',
    fontFamily: 'Arial',
    color: '#808080',
    fontStyle: 'bold',
  });

  // Score
  scoreText = this.add
    .text(400, 25, '0 - 0', {
      fontSize: '32px',
      fontFamily: 'Arial',
      color: '#ffffff',
      fontStyle: 'bold',
    })
    .setOrigin(0.5);

  // Instructions
  const _instructions = this.add
    .text(
      400,
      580,
      'U/R=Punch I/T=Kick | O=B2 Bomber Y=Narco Strike | S/Down=Block',
      {
        fontSize: '14px',
        fontFamily: 'Arial',
        color: '#888888',
      },
    )
    .setOrigin(0.5);

  // Countdown to start
  const countText = this.add
    .text(400, 300, 'FIGHT!', {
      fontSize: '64px',
      fontFamily: 'Arial',
      color: '#ffff00',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    })
    .setOrigin(0.5);

  this.tweens.add({
    targets: countText,
    scale: { from: 2, to: 0 },
    alpha: { from: 1, to: 0 },
    duration: 1000,
    onComplete: () => {
      roundStarted = true;
    },
  });

  // Input handling
  this.input.keyboard.on('keydown', (event) => {
    const key = KEYBOARD_TO_ARCADE[event.key] || event.key;
    keys[key] = true;

    // Restart on game over
    if (gameOver && (key === 'START1' || key === 'START2')) {
      restartRound(scene);
    }
  });

  this.input.keyboard.on('keyup', (event) => {
    const key = KEYBOARD_TO_ARCADE[event.key] || event.key;
    keys[key] = false;
  });

}

function update(_time, delta) {
  if (!roundStarted || gameOver) return;

  // Update cooldowns
  if (p1.attackCooldown > 0) p1.attackCooldown -= delta;
  if (p2.attackCooldown > 0) p2.attackCooldown -= delta;

  // Player 1 controls
  handleMovement(p1, 'P1L', 'P1R', 'P1U', 'P1D');
  handleAttacks(p1, p2, 'P1A', 'P1B', 'P1C', this);

  // Player 2 controls
  handleMovement(p2, 'P2L', 'P2R', 'P2U', 'P2D');
  handleAttacks(p2, p1, 'P2A', 'P2B', 'P2C', this);

  // Update facing direction
  if (p1.x < p2.x) p1.facing = 1;
  else p1.facing = -1;

  if (p2.x < p1.x) p2.facing = 1;
  else p2.facing = -1;

  // Update special attack animations
  if (p1SpecialActive) {
    p1SpecialX += 12; // B2 bomber flies across
  }
  if (p2SpecialActive) {
    p2SpecialX += 0.8; // Narco packages fall
  }

  // Check health
  if (p1Health <= 0) endRound(this, 2);
  if (p2Health <= 0) endRound(this, 1);

  // Draw fighters
  drawFighters();
}

function handleMovement(fighter, leftKey, rightKey, jumpKey, blockKey) {
  fighter.blocking = keys[blockKey];

  if (fighter.blocking) {
    fighter.setVelocityX(0);
    return;
  }

  // Horizontal movement
  if (keys[leftKey]) {
    fighter.setVelocityX(-FIGHTER.speed);
  } else if (keys[rightKey]) {
    fighter.setVelocityX(FIGHTER.speed);
  } else {
    fighter.setVelocityX(0);
  }

  // Jump
  if (keys[jumpKey] && fighter.body.touching.down) {
    fighter.setVelocityY(FIGHTER.jumpVelocity);
    keys[jumpKey] = false; // Prevent double jump
  }
}

function handleAttacks(
  attacker,
  defender,
  punchKey,
  kickKey,
  specialKey,
  scene,
) {
  if (attacker.attackCooldown > 0 || attacker.blocking) return;

  let damage = 0;
  let range = 0;
  let _attackType = '';

  // Check attack buttons
  if (keys[punchKey]) {
    damage = FIGHTER.punchDamage;
    range = FIGHTER.punchRange;
    _attackType = 'punch';
    attacker.attackCooldown = 300;
  } else if (keys[kickKey]) {
    damage = FIGHTER.kickDamage;
    range = FIGHTER.kickRange;
    _attackType = 'kick';
    attacker.attackCooldown = 500;
  } else if (keys[specialKey] && attacker.canSpecial) {
    damage = FIGHTER.specialDamage;
    range = FIGHTER.specialRange;
    _attackType = 'special';
    attacker.attackCooldown = 1000;
    attacker.canSpecial = false;
    setTimeout(() => {
      attacker.canSpecial = true;
    }, 3000);

    // Trigger special animations
    if (attacker === p1) {
      p1SpecialActive = true;
      p1SpecialX = -100; // Start off-screen
      playTone(scene, 100, 0.3);
      setTimeout(() => {
        p1SpecialActive = false;
      }, 1500);
    } else {
      p2SpecialActive = true;
      p2SpecialX = 0;
      playTone(scene, 80, 0.4);
      setTimeout(() => {
        p2SpecialActive = false;
      }, 1500);
    }
  }

  if (damage > 0) {
    attacker.attacking = true;
    setTimeout(() => {
      attacker.attacking = false;
    }, 200);

    // Check if hit landed
    const distance = Math.abs(attacker.x - defender.x);
    const verticalDiff = Math.abs(attacker.y - defender.y);

    if (distance < range && verticalDiff < 60) {
      // Hit landed!
      if (defender.blocking) {
        damage *= 0.3; // Block reduces damage
        playTone(scene, 200, 0.1);
      } else {
        playTone(scene, 150, 0.2);
        // Knockback
        const knockback = attacker.facing * 100;
        defender.setVelocityX(knockback);
      }

      if (defender === p1) {
        p1Health = Math.max(0, p1Health - damage);
        updateHealthBar(p1HealthBar, p1Health);
      } else {
        p2Health = Math.max(0, p2Health - damage);
        updateHealthBar(p2HealthBar, p2Health);
      }
    } else {
      // Miss
      playTone(scene, 300, 0.05);
    }

    // Clear key to prevent repeat
    keys[punchKey] = false;
    keys[kickKey] = false;
    keys[specialKey] = false;
  }
}

function updateHealthBar(healthBar, health) {
  const width = (health / 100) * 270;
  healthBar.width = width;

  // Change color based on health
  if (health > 60) {
    healthBar.fillColor = 0x00ff00;
  } else if (health > 30) {
    healthBar.fillColor = 0xffff00;
  } else {
    healthBar.fillColor = 0xff0000;
  }
}

function drawFighters() {
  graphics.clear();

  // Draw Trump (P1)
  const p1Alpha = p1.blocking ? 0.6 : 1;
  const p1X = p1.x;
  const p1Y = p1.y;

  // Body (suit)
  graphics.fillStyle(p1.suitColor, p1Alpha);
  graphics.fillRect(p1X - 15, p1Y - 10, 30, 40);

  // Head (orange skin)
  graphics.fillStyle(p1.skinColor, p1Alpha);
  graphics.fillCircle(p1X, p1Y - 25, 12);

  // Hair (blonde swoosh)
  graphics.fillStyle(p1.hairColor, p1Alpha);
  graphics.fillRect(p1X - 12, p1Y - 35, 20, 8);
  graphics.fillTriangle(
    p1X + 8,
    p1Y - 35,
    p1X + 15,
    p1Y - 38,
    p1X + 12,
    p1Y - 27,
  );

  // Red tie
  graphics.fillStyle(p1.tieColor, p1Alpha);
  graphics.fillRect(p1X - 3, p1Y - 8, 6, 18);

  // Eyes
  graphics.fillStyle(0x000000, p1Alpha);
  const p1EyeDir = p1.facing * 3;
  graphics.fillRect(p1X - 5 + p1EyeDir, p1Y - 28, 3, 3);
  graphics.fillRect(p1X + 2 + p1EyeDir, p1Y - 28, 3, 3);

  // Legs
  graphics.fillStyle(p1.suitColor, p1Alpha);
  graphics.fillRect(p1X - 10, p1Y + 30, 8, 20);
  graphics.fillRect(p1X + 2, p1Y + 30, 8, 20);

  // P1 attack indicator
  if (p1.attacking) {
    graphics.fillStyle(0xffff00, 0.5);
    const attackX = p1X + p1.facing * FIGHTER.punchRange;
    graphics.fillCircle(attackX, p1Y, 20);
  }

  // Draw Petro (P2)
  const p2Alpha = p2.blocking ? 0.6 : 1;
  const p2X = p2.x;
  const p2Y = p2.y;

  // Body (suit)
  graphics.fillStyle(p2.suitColor, p2Alpha);
  graphics.fillRect(p2X - 15, p2Y - 10, 30, 40);

  // Head (skin)
  graphics.fillStyle(p2.skinColor, p2Alpha);
  graphics.fillCircle(p2X, p2Y - 25, 12);

  // Gray hair
  graphics.fillStyle(p2.hairColor, p2Alpha);
  graphics.fillRect(p2X - 12, p2Y - 35, 24, 8);

  // Glasses
  graphics.fillStyle(p2.glassesColor, p2Alpha);
  graphics.strokeRect(p2X - 10, p2Y - 28, 8, 6);
  graphics.strokeRect(p2X + 2, p2Y - 28, 8, 6);
  graphics.lineStyle(2, p2.glassesColor, p2Alpha);
  graphics.lineBetween(p2X - 2, p2Y - 25, p2X + 2, p2Y - 25);

  // Eyes behind glasses
  graphics.fillStyle(0x000000, p2Alpha);
  const p2EyeDir = p2.facing * 2;
  graphics.fillRect(p2X - 8 + p2EyeDir, p2Y - 26, 2, 2);
  graphics.fillRect(p2X + 4 + p2EyeDir, p2Y - 26, 2, 2);

  // Shirt collar
  graphics.fillStyle(0xffffff, p2Alpha);
  graphics.fillTriangle(p2X - 8, p2Y - 10, p2X - 12, p2Y - 5, p2X - 8, p2Y - 5);
  graphics.fillTriangle(p2X + 8, p2Y - 10, p2X + 12, p2Y - 5, p2X + 8, p2Y - 5);

  // Legs
  graphics.fillStyle(p2.suitColor, p2Alpha);
  graphics.fillRect(p2X - 10, p2Y + 30, 8, 20);
  graphics.fillRect(p2X + 2, p2Y + 30, 8, 20);

  // P2 attack indicator
  if (p2.attacking) {
    graphics.fillStyle(0xffff00, 0.5);
    const attackX = p2X + p2.facing * FIGHTER.punchRange;
    graphics.fillCircle(attackX, p2Y, 20);
  }

  // SPECIAL ATTACKS

  // Trump's B2 Spirit Bomber
  if (p1SpecialActive) {
    const b2Y = 80;
    const b2X = p1SpecialX;

    // Bomber body (dark gray stealth)
    graphics.fillStyle(0x404040, 0.9);

    // Main wing (wide delta wing)
    graphics.fillTriangle(b2X, b2Y, b2X - 60, b2Y + 15, b2X + 60, b2Y + 15);

    // Rear wing edge
    graphics.fillTriangle(
      b2X - 40,
      b2Y + 15,
      b2X + 40,
      b2Y + 15,
      b2X,
      b2Y + 25,
    );

    // Cockpit
    graphics.fillStyle(0x202020, 0.9);
    graphics.fillCircle(b2X, b2Y + 8, 6);

    // Engine exhausts
    graphics.fillStyle(0xff4400, 0.7);
    graphics.fillRect(b2X - 15, b2Y + 12, 4, 3);
    graphics.fillRect(b2X + 11, b2Y + 12, 4, 3);

    // USA star decal
    graphics.fillStyle(0xffffff, 0.8);
    graphics.fillCircle(b2X - 25, b2Y + 10, 4);
    graphics.fillStyle(0x0033aa, 0.8);
    graphics.fillCircle(b2X - 25, b2Y + 10, 3);

    // Bombs dropping
    if (p1SpecialX > 200 && p1SpecialX < 600) {
      const bombY = b2Y + 30 + (p1SpecialX - 200) * 0.8;
      graphics.fillStyle(0x333333, 0.9);
      graphics.fillRect(b2X - 2, bombY, 4, 12);
      graphics.fillTriangle(
        b2X - 2,
        bombY + 12,
        b2X + 2,
        bombY + 12,
        b2X,
        bombY + 16,
      );

      // Explosion effect if bomb reaches ground
      if (bombY > 480) {
        graphics.fillStyle(0xff6600, 0.7);
        graphics.fillCircle(b2X, 500, 30);
        graphics.fillStyle(0xffff00, 0.6);
        graphics.fillCircle(b2X, 500, 20);
        graphics.fillStyle(0xff0000, 0.5);
        graphics.fillCircle(b2X, 500, 10);
      }
    }
  }

  // Petro's Narco Cartel Attack
  if (p2SpecialActive) {
    const numPackages = 5;

    for (let i = 0; i < numPackages; i++) {
      const packageX = 100 + i * 150;
      const packageY = 100 + p2SpecialX * 2 + i * 40;

      if (packageY < 520) {
        // White brick package
        graphics.fillStyle(0xeeeeee, 0.9);
        graphics.fillRect(packageX, packageY, 20, 15);

        // Tape cross
        graphics.fillStyle(0x8b4513, 0.9);
        graphics.fillRect(packageX + 8, packageY, 4, 15);
        graphics.fillRect(packageX, packageY + 6, 20, 3);

        // Dollar sign
        graphics.fillStyle(0x00aa00, 0.8);
        graphics.fillCircle(packageX + 10, packageY + 7, 3);

        // Shadow
        graphics.fillStyle(0x000000, 0.2);
        graphics.fillEllipse(packageX + 10, 530, 12, 4);
      } else {
        // Impact splash
        graphics.fillStyle(0xffffff, 0.5);
        graphics.fillCircle(packageX + 10, 520, 15);
        graphics.fillStyle(0x00aa00, 0.3);
        graphics.fillCircle(packageX + 10, 520, 10);
      }
    }

    // Money bills flying around
    for (let i = 0; i < 8; i++) {
      const billX = 150 + i * 80 + Math.sin(p2SpecialX + i) * 20;
      const billY = 150 + p2SpecialX * 3 + i * 30;

      if (billY < 550) {
        graphics.fillStyle(0x00aa00, 0.7);
        graphics.fillRect(billX, billY, 15, 8);
        graphics.fillStyle(0x006600, 0.7);
        graphics.fillRect(billX + 1, billY + 1, 13, 6);
      }
    }
  }
}

function endRound(scene, winner) {
  if (gameOver) return;
  gameOver = true;
  roundStarted = false;

  if (winner === 1) {
    p1Score++;
  } else {
    p2Score++;
  }

  scoreText.setText(`${p1Score} - ${p2Score}`);

  playTone(scene, 880, 0.5);

  // Overlay
  const overlay = scene.add.graphics();
  overlay.fillStyle(0x000000, 0.8);
  overlay.fillRect(0, 0, 800, 600);

  // Winner announcement
  const winName = winner === 1 ? 'TRUMP' : 'PETRO';
  const winColor = winner === 1 ? '#ffd700' : '#808080';
  winnerText = scene.add
    .text(400, 250, `${winName} WINS!`, {
      fontSize: '64px',
      fontFamily: 'Arial',
      color: winColor,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 8,
    })
    .setOrigin(0.5);

  scene.tweens.add({
    targets: winnerText,
    scale: { from: 0.5, to: 1.2 },
    duration: 500,
    yoyo: true,
    repeat: -1,
  });

  // Next round text
  const nextText = scene.add
    .text(400, 350, 'Press START for Next Round', {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffff00',
    })
    .setOrigin(0.5);

  scene.tweens.add({
    targets: nextText,
    alpha: { from: 1, to: 0.3 },
    duration: 600,
    yoyo: true,
    repeat: -1,
  });
}

function restartRound(scene) {
  // Reset health
  p1Health = 100;
  p2Health = 100;
  updateHealthBar(p1HealthBar, 100);
  updateHealthBar(p2HealthBar, 100);

  // Reset positions
  p1.setPosition(200, 400);
  p2.setPosition(600, 400);
  p1.setVelocity(0, 0);
  p2.setVelocity(0, 0);

  // Reset states
  p1.attacking = false;
  p2.attacking = false;
  p1.blocking = false;
  p2.blocking = false;
  p1.canSpecial = true;
  p2.canSpecial = true;

  // Reset special attacks
  p1SpecialActive = false;
  p2SpecialActive = false;
  p1SpecialX = 0;
  p2SpecialX = 0;

  gameOver = false;
  keys = {};

  scene.scene.restart();
}

function playTone(scene, frequency, duration) {
  const audioContext = scene.sound?.context;
  if (!audioContext || audioContext.state !== 'running') {
    return;
  }

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = 'square';

  gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.01,
    audioContext.currentTime + duration,
  );

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}
