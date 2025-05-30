import React, { useEffect, useRef, useState } from "react";
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
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
`;

const GameCanvas = styled.div<{ isLandscape: boolean }>`
	width: ${props => (props.isLandscape ? "100%" : "auto")};
	height: ${props => (props.isLandscape ? "auto" : "100%")};
	max-width: 100%;
	max-height: 100%;
	aspect-ratio: 4/3;
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	border-radius: 10px;
	overflow: hidden;
	background-color: #fff;
`;

const Game: React.FC = () => {
	const gameRef = useRef<Phaser.Game | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	const [isLandscape, setIsLandscape] = useState(window.innerWidth > window.innerHeight);

	useEffect(() => {
		const handleOrientationChange = () => {
			setIsLandscape(window.innerWidth > window.innerHeight);
		};

		window.addEventListener("resize", handleOrientationChange);
		window.addEventListener("orientationchange", handleOrientationChange);

		return () => {
			window.removeEventListener("resize", handleOrientationChange);
			window.removeEventListener("orientationchange", handleOrientationChange);
		};
	}, []);

	useEffect(() => {
		if (containerRef.current && !gameRef.current) {
			const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
			const container = containerRef.current;

			// Use fixed game dimensions
			const gameWidth = 800;
			const gameHeight = 600;

			gameRef.current = new Phaser.Game({
				...gameConfig,
				parent: container,
				width: gameWidth,
				height: gameHeight,
				scale: {
					mode: Phaser.Scale.FIT,
					autoCenter: Phaser.Scale.CENTER_BOTH,
					parent: container,
					width: gameWidth,
					height: gameHeight,
				},
			});
		}

		return () => {
			if (gameRef.current) {
				gameRef.current.destroy(true);
				gameRef.current = null;
			}
		};
	}, [isLandscape]);

	return (
		<GameContainer>
			<GameCanvas ref={containerRef} id="game-container" isLandscape={isLandscape} />
		</GameContainer>
	);
};

export default Game;
