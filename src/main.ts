import { GameScene } from './scenes/GameScene.js';

const canvas = document.querySelector<HTMLCanvasElement>('#game');

if (!canvas) {
  throw new Error('Game canvas was not found.');
}

new GameScene(canvas).start();
