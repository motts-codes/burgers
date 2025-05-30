import { Types } from "phaser";
import GameScene from "../scenes/GameScene";

// Use fixed game dimensions
const gameWidth = 800;
const gameHeight = 600;

export const gameConfig: Types.Core.GameConfig = {
	type: Phaser.AUTO,
	parent: "game-container",
	width: gameWidth,
	height: gameHeight,
	physics: {
		default: "arcade",
		arcade: {
			gravity: { x: 0, y: 300 },
			debug: false,
		},
	},
	scene: [GameScene],
	scale: {
		mode: Phaser.Scale.FIT,
		autoCenter: Phaser.Scale.CENTER_BOTH,
		width: gameWidth,
		height: gameHeight,
	},
	backgroundColor: "#ffffff",
};
