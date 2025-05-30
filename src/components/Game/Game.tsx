import React, { useEffect, useRef } from "react";
import Phaser from "phaser";
import { gameConfig } from "../../utils/gameConfig";
import styled from "styled-components";

const GameContainer = styled.div`
	width: 100%;
	height: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
	background-color: #f0f0f0;
`;

const GameCanvas = styled.div`
	width: 800px;
	height: 600px;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	border-radius: 10px;
	overflow: hidden;
	background-color: #fff;
`;

const Game: React.FC = () => {
	const gameRef = useRef<Phaser.Game | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (containerRef.current && !gameRef.current) {
			gameRef.current = new Phaser.Game({
				...gameConfig,
				parent: containerRef.current,
				width: 800,
				height: 600,
				scale: {
					mode: Phaser.Scale.FIT,
					autoCenter: Phaser.Scale.CENTER_BOTH,
					parent: containerRef.current,
				},
			});
		}

		return () => {
			if (gameRef.current) {
				gameRef.current.destroy(true);
				gameRef.current = null;
			}
		};
	}, []);

	return (
		<GameContainer>
			<GameCanvas ref={containerRef} id="game-container" />
		</GameContainer>
	);
};

export default Game;
