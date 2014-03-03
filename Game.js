/* global Player, Projectile, Zombie, Explosion, ObjectPoolMaker */

(function () {
  'use strict';

  var Game = {
    // Current game difficulty
    difficulty: 0.01,

    // Max difficulty that Game can reach at any given time
    // It represents the chance percentage of spawning a new Zombie
    maxDifficulty: 0.2,

    // How much difficulty increases after its cooldown elapsed
    difficultyIncrement: 0.005,

    // How long it takes (in seconds) to difficulty to increase
    difficultyCooldown: 3,

    // Last time difficulty was increased
    lastDifficultyIncrease: 0,

    // Time elapsed since Game began
    gameTime: 0,

    // Maps which keys as currently pressed by e.keyCode
    keysDown: {},

    // Last time a projectile was shot by the player
    lastProjectileTime: 0,

    // How long it takes (in ms) for another projectile to be fired
    projectileCooldown: 100,

    init: function () {
      Game.createCanvas();
      Game.loadBackground();

      Game.player = new Player(
        Game.canvas.width / 2 - Player.width / 2,
        Game.canvas.height / 2 - Player.height / 2
      );

      Game.zombiePool = new ObjectPoolMaker(Zombie, 100);
      Game.projectilePool = new ObjectPoolMaker(Projectile, 100);
      Game.explosions = [];

      Game.bind();
    },

    bind: function () {
      document.addEventListener('keydown', function (e) {
        Game.keysDown[e.keyCode] = true;
      }, false);

      document.addEventListener('keyup', function (e) {
        delete Game.keysDown[e.keyCode];
      }, false);
    },

    createCanvas: function () {
      Game.canvas = document.createElement('canvas');
      Game.context = Game.canvas.getContext('2d');

      Game.canvas.width = 512;
      Game.canvas.height = 480;

      document.body.appendChild(Game.canvas);
    },

    loadBackground: function () {
      Game.backgroundReady = false;

      Game.backgroundImg = new Image();
      Game.backgroundImg.src = 'public/images/background.png';

      Game.backgroundImg.onload = function () {
        Game.backgroundReady = true;
      };
    },

    update: function (modifier) {
      var verticalBoundary = 35,
          horizontalBoundary = 5,
          i,
          j,
          zombie,
          projectile,
          now = Date.now();

      Game.gameTime += modifier;

      // UP
      if (Game.keysDown[38] && Game.player.y > verticalBoundary) {
        Game.player.setY(Game.player.y - (Game.player.speed * modifier));
      }

      // DOWN
      if (Game.keysDown[40] && Game.player.y < Game.canvas.height - verticalBoundary - Player.height) {
        Game.player.setY(Game.player.y + (Game.player.speed * modifier));
      }

      // RIGHT
      if (Game.keysDown[39] && Game.player.x < Game.canvas.width - horizontalBoundary - Player.width) {
        Game.player.setX(Game.player.x + (Game.player.speed * modifier));
      }

      // LEFT
      if (Game.keysDown[37] && Game.player.x > horizontalBoundary) {
        Game.player.setX(Game.player.x - (Game.player.speed * modifier));
      }

      // update all projectiles
      for (i = 0; i < Game.projectilePool.size(); i++) {
        projectile = Game.projectilePool.objectPool()[i];

        projectile.setX(projectile.x + (projectile.speed * modifier));

        // delete projectile if out of the scene
        if (projectile.x > Game.canvas.width) {
          Game.projectilePool.destroy(projectile);
          i--;
        }
        else {
          // kill zombies!
          for (j = 0; j < Game.zombiePool.size(); j++) {
            zombie = Game.zombiePool.objectPool()[j];
            if (projectile.isCollided(zombie)) {
              Game.explosions.push(new Explosion(zombie.x, zombie.y));

              Game.projectilePool.destroy(projectile);
              i--;
              Game.zombiePool.destroy(zombie);
              j--;

              break;
            }
          }
        }

      }

      // SPACE - shoot!
      if (Game.keysDown[32]) {
        // prevent spamming projectiles
        if (now - Game.lastProjectileTime > Game.projectileCooldown) {
          Game.projectilePool.create(Game.player.x, Game.player.y + (Player.height / 2) - (Projectile.height / 2));
          Game.lastProjectileTime = now;
        }
      }

      // update all enemies
      for (i = 0; i < Game.zombiePool.size(); i++) {
        zombie = Game.zombiePool.objectPool()[i];
        zombie.update(now);
        zombie.setX(zombie.x - (zombie.speed * modifier));

        // delete zombie if out of the scene
        if (zombie.x + Zombie.width < 0) {
          Game.zombiePool.destroy(zombie);
          i--;
        }
      }

      // Create some enemies
      // It gets harder as time goes by..
      if (Game.difficulty < Game.maxDifficulty &&
          Game.gameTime - Game.lastDifficultyIncrease > Game.difficultyCooldown) {
        Game.difficulty += Game.difficultyIncrement;
        Game.lastDifficultyIncrease = Game.gameTime;
      }

      if (Math.random() < Game.difficulty) {
        Game.zombiePool.create(
          Game.canvas.width,
          Math.random() * (Game.canvas.height - Zombie.height - (2 * verticalBoundary)) + verticalBoundary
        );
      }

      for (i = 0; i < Game.explosions.length; ++i) {
        Game.explosions[i].update();
        if (Game.explosions[i].currentFrame >= Explosion.framesPosition.length - 1) {
          Game.explosions.splice(i--, 1);
        }
      }
    },

    render: function () {
      var i;

      if (Game.backgroundReady) {
        Game.context.drawImage(Game.backgroundImg, 0, 0);
      }

      for (i = 0; i < Game.projectilePool.size(); ++i) {
        Game.projectilePool.objectPool()[i].render(Game.context);
      }

      for (i = 0; i < Game.explosions.length; ++i) {
        Game.explosions[i].render(Game.context);
      }

      for (i = 0; i < Game.zombiePool.size(); ++i) {
        Game.zombiePool.objectPool()[i].render(Game.context);
      }

      Game.player.render(Game.context);
    }
  };

  // expose Game globally
  window.Game = Game;
}());
