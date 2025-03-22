import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { AudioManager } from './AudioManager.js';
import { Environment } from './Environment.js';
import { PlayerCharacter, ComputerCharacter } from './Character.js';
import { LevelManager } from './LevelManager.js';
import { InputManager } from './InputManager.js';
import { Cat } from './Cat.js';
import { Minimap } from './Minimap.js';

// Main class for our Roman Baths simulation
export class RomanBathsSimulation {
    constructor(loadingManager) {
        // Store loading manager
        this.loadingManager = loadingManager || new THREE.LoadingManager();
        // Get the container element
        this.container = document.getElementById('scene-container');
        
        // Set up the scene
        this.scene = new THREE.Scene();
        
        // Initialize clock for frame-independent animation
        this.clock = new THREE.Clock();
        
        // Set up the camera
        this.camera = new THREE.PerspectiveCamera(
            45, // Field of view
            window.innerWidth / window.innerHeight, // Aspect ratio
            0.1, // Near clipping plane
            1000 // Far clipping plane
        );
        this.camera.position.set(-30, 30, 50);
        this.camera.lookAt(0, 0, 0);
        
        // Set up the renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);
        
        // Set up controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true; // Add smooth damping effect
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 10;
        this.controls.maxDistance = 100;
        this.controls.maxPolarAngle = Math.PI / 2 - 0.1; // Prevent going below ground
        
        // Initialize audio
        this.audioManager = new AudioManager();
        
        // Initialize environment with loading manager
        this.environment = new Environment(this.scene, this.loadingManager);
        
        // Initialize level manager
        this.levelManager = new LevelManager(this.scene, this.audioManager);
        
        // Camera follow settings
        this.cameraFollowPlayer = true;
        this.cameraOffset = new THREE.Vector3(0, 15, 20); // Offset from player
        
        // Initialize input manager
        this.inputManager = new InputManager(this);
        
        // Add event listeners
        window.addEventListener('resize', this.onWindowResize.bind(this));
        window.addEventListener('newLevel', this.onNewLevel.bind(this));
    }
    
    // Initialize the environment and start the simulation
    async initializeEnvironment() {
        try {
            // Initialize environment
            await this.environment.initialize();
            
            // Initialize characters, cat, and minimap
            this.initializeCharacters();
            this.initializeCat();
            this.initializeMinimap();
            
            // Start the animation loop
            this.animate();
            
            console.log("Environment initialized successfully");
            return true;
        } catch (error) {
            console.error("Failed to initialize environment:", error);
            return false;
        }
    }
    
    // Initialize player and computer characters
    initializeCharacters() {
        // Initialize gold pots for the current level
        const startingPosition = this.levelManager.initializeGoldPots(this.environment);
        
        // Create player character
        this.player = new PlayerCharacter(this.scene);
        this.player.setPosition(startingPosition.x, 0, startingPosition.z);
        
        // Create computer character (antagonist)
        this.computer = new ComputerCharacter(this.scene);
        // Start the computer at a different position
        this.computer.setPosition(startingPosition.x + 5, 0, startingPosition.z + 5);
    }
    
    // Initialize the cat
    initializeCat() {
        // Create a fluffy cat
        this.cat = new Cat(this.scene, this.environment);
    }
    
    // Initialize the minimap
    initializeMinimap() {
        // Create a minimap
        this.minimap = new Minimap(this.scene, this.environment);
    }
    
    onWindowResize() {
        // Update camera aspect ratio and projection matrix
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        
        // Update renderer size
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    
    // Handle new level event
    onNewLevel() {
        // Reinitialize characters and gold pots for the new level
        const startingPosition = this.levelManager.initializeGoldPots(this.environment);
        
        // Reset player position
        this.player.setPosition(startingPosition.x, 0, startingPosition.z);
        
        // Reset computer position
        this.computer.setPosition(startingPosition.x + 5, 0, startingPosition.z + 5);
        
        // Reset cat position
        this.cat.setRandomPosition();
    }
    
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        // Get the time elapsed since the last frame
        const delta = this.clock.getDelta();
        
        // Update controls
        this.controls.update();
        
        // Update environment animations
        this.environment.update(delta);
        
        // Get movement direction from input manager
        const moveDirection = this.inputManager.getMovementDirection();
        
        // Update player character
        const playerIsMoving = this.player.update(
            delta, 
            moveDirection,
            this.environment.checkCollision.bind(this.environment),
            this.environment.isInWater.bind(this.environment),
            this.environment.getHeightAtPosition.bind(this.environment)
        );
        
        // Update computer character - make it actively seek gold pots
        this.computer.update(
            delta,
            this.levelManager.goldPots,
            this.environment.checkCollision.bind(this.environment),
            this.environment.isInWater.bind(this.environment),
            this.environment.getHeightAtPosition.bind(this.environment)
        );
        
        // Check for gold pot collection by player
        this.checkPlayerPotCollection();
        
        // Check for gold pot collection by computer
        this.computer.checkPotCollection(
            this.levelManager.goldPots, 
            this.player.radius * 4, // Collection radius
            () => {
                // Play collection sound
                this.audioManager.playCollectionSound();
                
                // Update computer score
                this.levelManager.updateComputerScore(1);
                
                // Check if all pots are collected
                this.levelManager.checkLevelCompletion();
            }
        );
        
        // Check for collision between player and computer
        this.checkCharacterCollision();
        
        // Update cat
        this.cat.update(delta, [this.player, this.computer]);
        
        // Update minimap
        this.minimap.update(this.player, this.computer, this.cat, this.levelManager.goldPots);
        
        // Update camera position if following is enabled
        if (this.cameraFollowPlayer) {
            // Calculate camera position based on player position and offset
            const targetCameraPosition = new THREE.Vector3(
                this.player.mesh.position.x + this.cameraOffset.x,
                this.player.mesh.position.y + this.cameraOffset.y,
                this.player.mesh.position.z + this.cameraOffset.z
            );
            
            // Smoothly interpolate camera position
            this.camera.position.lerp(targetCameraPosition, 0.05);
            
            // Make camera look at player
            this.controls.target.set(
                this.player.mesh.position.x,
                this.player.mesh.position.y + 2, // Look at upper body
                this.player.mesh.position.z
            );
        }
        
        // Render the scene
        this.renderer.render(this.scene, this.camera);
    }
    
    // Check for collision between player and computer
    checkCharacterCollision() {
        // Only check if at least one character has collected a pot
        if (this.levelManager.playerScore === 0 && this.levelManager.computerScore === 0) {
            return false;
        }
        
        // Get positions
        const playerPos = this.player.getPosition();
        const computerPos = this.computer.getPosition();
        
        // Calculate distance between characters
        const dx = computerPos.x - playerPos.x;
        const dz = computerPos.z - playerPos.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        // Check if characters are close enough to collide
        // Increase collision distance to make it easier to collide
        const collisionDistance = (this.player.radius + this.computer.radius) * 2;
        
        // Add a cooldown to prevent multiple collisions in quick succession
        if (!this.lastCollisionTime) this.lastCollisionTime = 0;
        const now = Date.now();
        const collisionCooldown = 2000; // 2 seconds cooldown
        
        // Debug collision detection (removed for production)
        
        if (distance < collisionDistance && now - this.lastCollisionTime > collisionCooldown) {
            // Collision detected (removed log for production)
            // Calculate collision position (midpoint between characters)
            const collisionPosition = {
                x: (playerPos.x + computerPos.x) / 2,
                z: (playerPos.z + computerPos.z) / 2
            };
            
            // Handle the collision
            const potsCreated = this.levelManager.handleCharacterCollision(collisionPosition, this.environment);
            
            // Update last collision time
            this.lastCollisionTime = now;
            
            // Push characters away from each other
            const pushDistance = collisionDistance * 1.5;
            const pushX = (dx / distance) * pushDistance;
            const pushZ = (dz / distance) * pushDistance;
            
            // Push player away
            this.player.setPosition(
                playerPos.x - pushX / 2,
                playerPos.y,
                playerPos.z - pushZ / 2
            );
            
            // Push computer away
            this.computer.setPosition(
                computerPos.x + pushX / 2,
                computerPos.y,
                computerPos.z + pushZ / 2
            );
            
            return true;
        }
        
        return false;
    }
    
    // Check for gold pot collection by player
    checkPlayerPotCollection() {
        // Collection radius - much larger than the player's radius for easier collection
        const collectionRadius = this.player.radius * 4;
        
        // Check each pot
        for (const pot of this.levelManager.goldPots) {
            if (!pot.collected) {
                const playerPos = this.player.getPosition();
                const dx = pot.position.x - playerPos.x;
                const dz = pot.position.z - playerPos.z;
                const distance = Math.sqrt(dx * dx + dz * dz);
                
                // Check if player is close enough to collect
                if (distance < collectionRadius) {
                    pot.collect();
                    
                    // Play collection sound
                    this.audioManager.playCollectionSound();
                    
                    // Update score
                    this.levelManager.updatePlayerScore(1);
                    
                    // Check if all pots are collected
                    this.levelManager.checkLevelCompletion();
                    
                    return true;
                }
            }
        }
        
        return false;
    }
}
