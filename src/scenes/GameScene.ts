import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
	private plate!: Phaser.Physics.Arcade.Sprite;
	private ingredients!: Phaser.Physics.Arcade.Group;
	private score: number = 0;
	private burgerCount: number = 0;
	private scoreText!: Phaser.GameObjects.Text;
	private burgerCountText!: Phaser.GameObjects.Text;
	private isMobile: boolean;
	private isIOS: boolean;
	private isPortrait: boolean;
	private tiltInstructionText!: Phaser.GameObjects.Text;
	private lastSpawnTime: number = 0;
	private activeIngredients: number = 0;
	private currentBurger: Array<{ type: string; sprite: Phaser.Physics.Arcade.Sprite; points: number }> = [];
	private difficulty: number = 1;
	private isGameOver: boolean = false;
	private isPaused: boolean = false;
	private fallingIngredients: Phaser.Physics.Arcade.Sprite[] = [];
	private isDragging: boolean = false;
	private dragStartX: number = 0;
	private dragStartY: number = 0;
	private currentX: number = 0;
	private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

	// Game configuration
	private readonly PLATE_SPEED = 500;
	private readonly INITIAL_FALL_SPEED = 15;
	private readonly SPEED_INCREMENT = 2;
	private readonly MAX_FALL_SPEED = 80;
	private readonly MAX_INGREDIENTS_PER_BURGER = 8;
	private readonly SPAWN_INTERVAL = 2000;
	private readonly MAX_SIMULTANEOUS_INGREDIENTS = 3;
	private readonly POINTS = {
		patty: 50,
		cheese: 30,
		lettuce: 20,
		tomato: 25,
		onion: 20,
		pickle: 25,
		egg: 40,
		ham: 35,
		olives: 15,
		tomatoSauce: 10,
		completeBurger: 250,
	};

	constructor() {
		super({ key: "GameScene" });
		this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
		this.isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
		this.isPortrait = window.innerHeight > window.innerWidth;
	}

	preload() {
		// Load background
		this.load.image("background", "assets/background.png");
		this.load.image("table", "assets/table.svg");

		// Load ingredients
		this.load.image("plate", "assets/burger plate.png");
		this.load.image("top-bun", "assets/burger top.png");
		this.load.image("patty1", "assets/patty-1.png");
		this.load.image("patty2", "assets/patty-2.svg");
		this.load.image("cheese", "assets/cheese.svg");
		this.load.image("lettuce", "assets/salad.png");
		this.load.image("tomato", "assets/tomato.png");
		this.load.image("onion", "assets/onion.png");
		this.load.image("pickle", "assets/pickle.png");
		this.load.image("egg", "assets/egg.svg");
		this.load.image("ham", "assets/ham.svg");
		this.load.image("olives", "assets/olives.svg");
		this.load.image("tomatoSauce", "assets/tomato-sauce.svg");
	}

	create() {
		// Add background
		const background = this.add.image(0, 0, "background");
		background.setOrigin(0, 0);
		background.setDisplaySize(this.cameras.main.width, this.cameras.main.height);
		background.setDepth(0);

		// Add table - moved lower
		const table = this.add.image(this.cameras.main.width / 2, this.cameras.main.height + 50, "table");
		table.setScale(0.5);
		table.setDepth(1);

		// Create plate - adjusted position to be above the table
		this.plate = this.physics.add.sprite(this.cameras.main.width / 2, this.cameras.main.height - 50, "plate");
		this.plate.setCollideWorldBounds(true);
		this.plate.setImmovable(true);
		this.plate.setScale(0.5);
		this.plate.setDepth(2);

		// Create ingredients group
		this.ingredients = this.physics.add.group({
			classType: Phaser.Physics.Arcade.Sprite,
		});

		// Set up collisions with proper type casting
		this.physics.add.collider(
			this.plate,
			this.ingredients,
			(object1, object2) => {
				if (object1 instanceof Phaser.Physics.Arcade.Sprite && object2 instanceof Phaser.Physics.Arcade.Sprite) {
					this.handleIngredientCatch(object1, object2);
				}
			},
			undefined,
			this,
		);

		// Add touch/mouse input handlers
		if (this.isMobile) {
			this.input.on("pointerdown", this.handlePointerDown, this);
			this.input.on("pointermove", this.handlePointerMove, this);
			this.input.on("pointerup", this.handlePointerUp, this);
		} else {
			// Keep existing keyboard controls for desktop
			if (this.input.keyboard) {
				this.cursors = this.input.keyboard.createCursorKeys();
			}
		}

		// Set up score text
		this.scoreText = this.add.text(16, 16, "Score: 0", {
			fontSize: "32px",
			color: "#000",
			backgroundColor: "#fff",
			padding: { x: 10, y: 5 },
		});

		// Set up burger counter text
		this.burgerCountText = this.add.text(16, 60, "Burgers: 0", {
			fontSize: "32px",
			color: "#000",
			backgroundColor: "#fff",
			padding: { x: 10, y: 5 },
		});

		// Add tilt instruction for mobile portrait mode
		if (this.isMobile && this.isPortrait) {
			const instructionText = this.isIOS ? "For iOS: Open in Safari and allow motion access" : "Tilt your device to play!";

			this.tiltInstructionText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 - 30, instructionText, {
				fontSize: "24px",
				color: "#000",
				backgroundColor: "#fff",
				padding: { x: 10, y: 5 },
				align: "center",
			});
			this.tiltInstructionText.setOrigin(0.5);
			this.tiltInstructionText.setDepth(10);

			// Add iOS-specific instructions
			if (this.isIOS) {
				const iosInstructions = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + 20, "1. Open in Safari\n2. Add to Home Screen\n3. Launch from Home Screen", {
					fontSize: "18px",
					color: "#000",
					backgroundColor: "#fff",
					padding: { x: 10, y: 5 },
					align: "center",
				});
				iosInstructions.setOrigin(0.5);
				iosInstructions.setDepth(10);
			}

			// Request device orientation permission
			if (typeof DeviceOrientationEvent !== "undefined") {
				const button = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2 + (this.isIOS ? 100 : 50), this.isIOS ? "Enable Motion Access" : "Enable Tilt Controls", {
					fontSize: "20px",
					color: "#fff",
					backgroundColor: "#4CAF50",
					padding: { x: 15, y: 10 },
					align: "center",
				});
				button.setOrigin(0.5);
				button.setInteractive();

				button.on("pointerdown", async () => {
					console.log("Tilt control button clicked");

					// For iOS, check if we're in Safari
					if (this.isIOS && !/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
						this.tiltInstructionText.setText("Please open in Safari browser");
						return;
					}

					try {
						const hasPermission = await this.requestIOSPermission();

						if (hasPermission) {
							console.log("Permission granted, setting up tilt controls");
							this.setupTiltControls();
							button.destroy();
							this.tiltInstructionText.destroy();

							if (this.isIOS) {
								const iosTip = this.add.text(this.cameras.main.width / 2, 50, "Tip: For best experience, add to Home Screen", {
									fontSize: "16px",
									color: "#000",
									backgroundColor: "#fff",
									padding: { x: 10, y: 5 },
									align: "center",
								});
								iosTip.setOrigin(0.5);
								iosTip.setDepth(10);
							}
						} else {
							console.log("Permission denied or not available");
							this.tiltInstructionText.setText(this.isIOS ? "Motion access denied - using touch controls" : "Tilt controls not available - using touch controls");
							this.fallbackToTouchControls();
						}
					} catch (error) {
						console.error("Error with tilt controls:", error);
						this.tiltInstructionText.setText("Switching to touch controls");
						this.fallbackToTouchControls();
					}
				});
			} else {
				console.log("DeviceOrientationEvent not supported");
				this.tiltInstructionText.setText("Using touch controls");
				this.fallbackToTouchControls();
			}
		} else if (this.isMobile) {
			this.fallbackToTouchControls();
		}

		// Start spawning ingredients
		this.time.addEvent({
			delay: this.SPAWN_INTERVAL,
			callback: this.spawnIngredient,
			callbackScope: this,
			loop: true,
		});
	}

	update() {
		if (this.isGameOver || this.isPaused) {
			if (this.isPaused) {
				this.ingredients.getChildren().forEach((ingredient: Phaser.GameObjects.GameObject) => {
					if (ingredient instanceof Phaser.Physics.Arcade.Sprite) {
						ingredient.setVelocityY(0);
					}
				});
			}
			return;
		}

		if (!this.isMobile) {
			// Existing keyboard controls for desktop
			if (this.cursors.left?.isDown) {
				this.plate.setVelocityX(-300);
			} else if (this.cursors.right?.isDown) {
				this.plate.setVelocityX(300);
			} else {
				this.plate.setVelocityX(0);
			}
		}

		this.currentBurger.forEach((ingredient, index) => {
			const yOffset = -index * 10;
			ingredient.sprite.x = this.plate.x;
			ingredient.sprite.y = this.plate.y + yOffset;
		});

		this.ingredients.getChildren().forEach((ingredient: Phaser.GameObjects.GameObject) => {
			if (ingredient instanceof Phaser.Physics.Arcade.Sprite) {
				if (ingredient.y > this.cameras.main.height) {
					ingredient.destroy();
					this.activeIngredients--;
				}
			}
		});
	}

	private spawnIngredient() {
		if (this.activeIngredients >= this.MAX_SIMULTANEOUS_INGREDIENTS || this.isPaused) return;

		const ingredientTypes = ["patty1", "patty2", "cheese", "lettuce", "tomato", "onion", "pickle", "egg", "ham", "olives", "tomatoSauce"];

		const randomType = ingredientTypes[Math.floor(Math.random() * ingredientTypes.length)];
		const x = Phaser.Math.Between(50, this.cameras.main.width - 50);
		const ingredient = this.ingredients.create(x, 0, randomType) as Phaser.Physics.Arcade.Sprite;

		ingredient.setScale(0.5);
		ingredient.setData("type", randomType);
		ingredient.setData("points", this.POINTS[randomType as keyof typeof this.POINTS] || 10);

		// Calculate current fall speed based on burger count
		const currentFallSpeed = Math.min(this.INITIAL_FALL_SPEED + this.burgerCount * this.SPEED_INCREMENT, this.MAX_FALL_SPEED);
		ingredient.setVelocityY(currentFallSpeed);

		this.activeIngredients++;
	}

	private handleIngredientCatch(plate: Phaser.Physics.Arcade.Sprite, ingredient: Phaser.Physics.Arcade.Sprite) {
		const type = ingredient.getData("type");
		const points = ingredient.getData("points");

		ingredient.setVelocity(0, 0);
		if (ingredient.body) {
			ingredient.body.enable = false;
		}

		// Reduced spacing for first ingredient and subsequent ingredients
		const yOffset = this.currentBurger.length === 0 ? -40 : -15 - this.currentBurger.length * 10;
		ingredient.x = plate.x;
		ingredient.y = plate.y + yOffset;
		ingredient.setDepth(3 + this.currentBurger.length);

		this.currentBurger.push({
			type,
			sprite: ingredient,
			points,
		});

		this.score += points;
		this.scoreText.setText(`Score: ${this.score}`);

		if (this.currentBurger.length >= this.MAX_INGREDIENTS_PER_BURGER) {
			this.completeBurger();
		}

		this.activeIngredients--;
	}

	private completeBurger() {
		this.isPaused = true;

		this.score += this.POINTS.completeBurger;
		this.scoreText.setText(`Score: ${this.score}`);
		this.burgerCount++;
		this.burgerCountText.setText(`Burgers: ${this.burgerCount}`);

		const lastIngredient = this.currentBurger[this.currentBurger.length - 1].sprite;
		const topBun = this.physics.add.sprite(this.plate.x, lastIngredient.y - 10, "top-bun");
		topBun.setScale(0.5);
		topBun.setDepth(4 + this.currentBurger.length);
		if (topBun.body) {
			topBun.body.enable = false;
		}

		// Add top bun to the currentBurger array
		this.currentBurger.push({
			type: "top-bun",
			sprite: topBun,
			points: 0,
		});

		const particles = this.add.particles(0, 0, "top-bun", {
			speed: { min: 30, max: 60 },
			angle: { min: 0, max: 360 },
			scale: { start: 0.2, end: 0 },
			blendMode: "ADD",
			lifespan: 1000,
			quantity: 1,
			frequency: 50,
			emitting: true,
			x: this.plate.x,
			y: lastIngredient.y - 10,
			tint: [0xffff00, 0xff0000, 0x00ff00, 0x0000ff],
		});
		particles.setDepth(5);

		this.time.delayedCall(1000, () => {
			particles.emitting = false;
			this.time.delayedCall(500, () => {
				particles.destroy();
				this.currentBurger.forEach((ingredient, index) => {
					this.tweens.add({
						targets: ingredient.sprite,
						y: -200,
						alpha: 0,
						duration: 500,
						delay: index * 50,
						ease: "Power2",
						onComplete: () => {
							ingredient.sprite.destroy();
						},
					});
				});

				this.time.delayedCall(600, () => {
					this.currentBurger = [];
					if (this.burgerCount % 3 === 0) {
						this.difficulty = Math.min(this.difficulty + 1, 10);
					}
					this.isPaused = false;
				});
			});
		});
	}

	private handlePointerDown(pointer: Phaser.Input.Pointer) {
		this.isDragging = true;
		this.dragStartX = pointer.x;
		this.dragStartY = pointer.y;
		this.currentX = this.plate.x;
	}

	private handlePointerMove(pointer: Phaser.Input.Pointer) {
		if (!this.isDragging) return;

		const deltaX = pointer.x - this.dragStartX;
		this.currentX = Phaser.Math.Clamp(this.currentX + deltaX, this.plate.width / 2, this.cameras.main.width - this.plate.width / 2);
		this.plate.x = this.currentX;
		this.dragStartX = pointer.x;
	}

	private handlePointerUp() {
		this.isDragging = false;
	}

	private setupTiltControls() {
		if (this.isMobile) {
			// Remove any existing listeners first
			window.removeEventListener("deviceorientation", this.handleDeviceOrientation.bind(this));

			// Check if device orientation is supported
			if (!window.DeviceOrientationEvent) {
				console.log("Device orientation not supported");
				this.fallbackToTouchControls();
				return;
			}

			// Add new listener with error handling
			try {
				const orientationHandler = (event: DeviceOrientationEvent) => {
					if (!event) {
						console.log("No orientation event received");
						this.fallbackToTouchControls();
						return;
					}
					this.handleDeviceOrientation(event);
				};

				window.addEventListener("deviceorientation", orientationHandler, true);
				console.log("Tilt controls enabled successfully");
			} catch (error) {
				console.error("Error setting up tilt controls:", error);
				this.fallbackToTouchControls();
			}
		}
	}

	private fallbackToTouchControls() {
		console.log("Falling back to touch controls");
		if (this.tiltInstructionText) {
			this.tiltInstructionText.setText("Using touch controls instead");
			this.tiltInstructionText.setStyle({ backgroundColor: "#ffeb3b" });
		}

		// Set up touch controls
		this.input.on("pointerdown", this.handlePointerDown, this);
		this.input.on("pointermove", this.handlePointerMove, this);
		this.input.on("pointerup", this.handlePointerUp, this);
	}

	private handleDeviceOrientation(event: DeviceOrientationEvent) {
		console.log("Handling orientation:", {
			beta: event.beta,
			gamma: event.gamma,
			alpha: event.alpha,
		});

		// Check if we have valid orientation data
		if (event.beta === null || event.gamma === null) {
			console.log("No valid orientation data available");
			return;
		}

		// Use gamma for left/right tilt (more natural for mobile games)
		const tilt = event.gamma;
		console.log("Raw tilt value:", tilt);

		// Adjust sensitivity and deadzone for better control
		const deadzone = 5;
		const sensitivity = 0.5; // Increased sensitivity
		const maxTilt = 30; // Reduced max tilt for better control

		// Apply deadzone
		let adjustedTilt = Math.abs(tilt) < deadzone ? 0 : tilt;
		console.log("Adjusted tilt after deadzone:", adjustedTilt);

		// Normalize and apply sensitivity
		const normalizedTilt = Phaser.Math.Clamp(adjustedTilt * sensitivity, -maxTilt, maxTilt);
		const moveSpeed = (normalizedTilt / maxTilt) * this.PLATE_SPEED;
		console.log("Final move speed:", moveSpeed);

		// Apply movement
		this.plate.setVelocityX(moveSpeed);
	}

	private async requestIOSPermission(): Promise<boolean> {
		if (!this.isIOS) return true;

		if (typeof (DeviceOrientationEvent as any).requestPermission !== "function") {
			console.log("DeviceOrientationEvent.requestPermission not available");
			return false;
		}

		try {
			const permission = await (DeviceOrientationEvent as any).requestPermission();
			console.log("iOS permission result:", permission);
			return permission === "granted";
		} catch (error) {
			console.error("iOS permission error:", error);
			return false;
		}
	}
}
