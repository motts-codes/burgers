import { Types } from "phaser";
import GameScene from "../scenes/GameScene";

export const gameConfig: Types.Core.GameConfig = {
	type: Phaser.AUTO,
	parent: "game-container",
	width: 800,
	height: 600,
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
	},
	backgroundColor: "#ffffff",
};
