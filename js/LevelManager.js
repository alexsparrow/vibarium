import * as THREE from 'three';
import { GoldPot } from './GoldPot.js';
import { LevelLoader } from './LevelLoader.js';

// Class to handle level management, scoring, and UI
export class LevelManager {
    constructor(scene, audioManager) {
        this.scene = scene;
        this.audioManager = audioManager;
        this.level = 1;
        this.playerScore = 0;
        this.computerScore = 0;
        this.goldPots = [];
        this.gameOver = false;
        this.levelLoader = new LevelLoader();
        
        // Get UI elements
        this.scoreElement = document.getElementById('score');
        
        // Create level UI elements
        this.createLevelUI();
        
        // Initialize level loader
        this.initializeLevelLoader();
    }
    
    // Initialize the level loader
    async initializeLevelLoader() {
        try {
            await this.levelLoader.loadLevelData('data/level.json');
            console.log("Level data loaded in LevelManager");
        } catch (error) {
            console.error("Failed to load level data in LevelManager:", error);
        }
    }
    
    // Create UI elements for level display and level completion
    createLevelUI() {
        // Create level display
        const infoElement = document.getElementById('info');
        
        // Create level display container
        const levelDisplay = document.createElement('div');
        levelDisplay.className = 'level-display';
        
        // Create level text
        const levelText = document.createElement('h2');
        levelText.textContent = `Level: ${this.level}`;
        levelText.id = 'level-text';
        levelDisplay.appendChild(levelText);
        
        // Create pots counter
        const potsCounter = document.createElement('div');
        potsCounter.className = 'pots-counter';
        potsCounter.id = 'pots-counter';
        potsCounter.textContent = 'Pots: 0/0';
        levelDisplay.appendChild(potsCounter);
        
        // Add to info panel
        infoElement.appendChild(levelDisplay);
        
        // Update score display to show both player and computer scores
        const scoreDisplay = document.querySelector('.score-display');
        scoreDisplay.innerHTML = ''; // Clear existing content
        
        const scoreTitle = document.createElement('h2');
        scoreTitle.textContent = 'Score:';
        scoreDisplay.appendChild(scoreTitle);
        
        const scoreContainer = document.createElement('div');
        scoreContainer.className = 'score-container';
        
        // Player score
        const playerScoreDiv = document.createElement('div');
        playerScoreDiv.className = 'player-score';
        playerScoreDiv.innerHTML = `<span>You: </span><span id="player-score">0</span>`;
        scoreContainer.appendChild(playerScoreDiv);
        
        // Computer score
        const computerScoreDiv = document.createElement('div');
        computerScoreDiv.className = 'computer-score';
        computerScoreDiv.innerHTML = `<span>Cousin Lydia: </span><span id="computer-score">0</span>`;
        scoreContainer.appendChild(computerScoreDiv);
        
        scoreDisplay.appendChild(scoreContainer);
        
        // Update references to score elements
        this.playerScoreElement = document.getElementById('player-score');
        this.computerScoreElement = document.getElementById('computer-score');
        
        // Create level completion message
        const levelCompleteContainer = document.createElement('div');
        levelCompleteContainer.className = 'level-complete';
        levelCompleteContainer.id = 'level-complete';
        levelCompleteContainer.style.display = 'none';
        
        // Create message
        const levelCompleteMessage = document.createElement('h2');
        levelCompleteMessage.id = 'level-complete-message';
        levelCompleteContainer.appendChild(levelCompleteMessage);
        
        // Create continue button
        const continueButton = document.createElement('button');
        continueButton.id = 'continue-button';
        continueButton.textContent = 'Continue to Next Level';
        continueButton.addEventListener('click', () => {
            this.startNextLevel();
        });
        levelCompleteContainer.appendChild(continueButton);
        
        // Add to body
        document.body.appendChild(levelCompleteContainer);
        
        // Add some CSS for the score display and pots counter
        const style = document.createElement('style');
        style.textContent = `
            .score-container {
                display: flex;
                justify-content: space-between;
                margin-top: 5px;
            }
            .player-score, .computer-score {
                padding: 3px 8px;
                border-radius: 3px;
            }
            .player-score {
                background-color: rgba(0, 100, 0, 0.5);
                margin-right: 5px;
            }
            .computer-score {
                background-color: rgba(139, 0, 0, 0.5);
            }
            #player-score, #computer-score {
                font-weight: bold;
                font-size: 1.1em;
            }
            .pots-counter {
                background-color: rgba(218, 165, 32, 0.5);
                padding: 3px 8px;
                border-radius: 3px;
                margin-top: 5px;
                font-weight: bold;
                text-align: center;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Initialize gold pots for the current level
    initializeGoldPots(heightMap) {
        // Clear any existing gold pots
        this.goldPots.forEach(pot => {
            if (!pot.collected) {
                pot.collect(); // Remove any remaining pots
            }
        });
        this.goldPots = [];
        
        // Number of pots increases with level
        const basePots = 15;
        const potsPerLevel = 5;
        const numPots = basePots + (this.level - 1) * potsPerLevel;
        
        // Get pot areas from level data
        const potAreas = this.levelLoader.getGoldPotAreas()
            .filter(area => {
                // Filter out the mainArea which is too large
                // Only include areas that are within our play boundary (-50 to 50)
                if (area.name === 'mainArea') return false;
                
                const bounds = area.bounds;
                return bounds.x1 >= -50 && bounds.x2 <= 50 && 
                       bounds.z1 >= -50 && bounds.z2 <= 50;
            })
            .map(area => area.bounds);
        
        // Create a height map object for the gold pots
        const goldPotHeightMap = {
            getHeightAtPosition: (x, z) => heightMap.getHeightAtPosition(x, z)
        };
        
        // Place some pots near the starting position for easier collection (fewer in higher levels)
        const startingPots = Math.max(1, 5 - Math.floor(this.level / 2));
        
        // Get starting position from level data
        const startingPosition = this.levelLoader.getStartingPosition(this.level % 5);
        const startX = startingPosition.x;
        const startZ = startingPosition.z;
        
        // Place pots near the starting position
        for (let i = 0; i < startingPots; i++) {
            // Place pots in a semi-circle in front of the starting position
            const angle = (Math.PI / startingPots) * i - Math.PI/2;
            const distance = 3 + Math.random() * 2; // 3-5 units away
            const x = startX + Math.cos(angle) * distance;
            const z = startZ + Math.sin(angle) * distance;
            
            // Create a new gold pot
            const pot = new GoldPot(this.scene, { x, z }, goldPotHeightMap);
            this.goldPots.push(pot);
        }
        
        // Place remaining pots randomly
        for (let i = 0; i < numPots - startingPots; i++) {
            // In higher levels, increase probability of pots in water/harder locations
            const mainAreaProb = Math.max(0.3, 0.7 - (this.level - 1) * 0.05);
            
            // Select a random area (with probability based on level)
            const areaIndex = Math.random() < mainAreaProb ? 0 : Math.floor(1 + Math.random() * (potAreas.length - 1));
            const area = potAreas[areaIndex];
            
            // Generate a random position within the area
            const x = area.x1 + Math.random() * (area.x2 - area.x1);
            const z = area.z1 + Math.random() * (area.z2 - area.z1);
            
            // Create a new gold pot
            const pot = new GoldPot(this.scene, { x, z }, goldPotHeightMap);
            this.goldPots.push(pot);
        }
        
        // Update level display
        document.getElementById('level-text').textContent = `Level: ${this.level}`;
        
        // Update pots counter
        this.updatePotsCounter();
        
        // Reset game over flag
        this.gameOver = false;
        
        return startingPosition;
    }
    
    // Update the player score
    updatePlayerScore(points) {
        this.playerScore += points;
        // Ensure score doesn't go below 0
        if (this.playerScore < 0) this.playerScore = 0;
        this.playerScoreElement.textContent = this.playerScore;
        this.updatePotsCounter();
    }
    
    // Update the computer score
    updateComputerScore(points) {
        this.computerScore += points;
        // Ensure score doesn't go below 0
        if (this.computerScore < 0) this.computerScore = 0;
        this.computerScoreElement.textContent = this.computerScore;
        this.updatePotsCounter();
    }
    
    // Handle collision between player and computer
    handleCharacterCollision(collisionPosition, environment) {
        // Play collision sound
        this.audioManager.playCollisionSound();
        
        // Determine how many pots each character loses (up to 3)
        const playerPotsLost = Math.min(3, this.playerScore);
        const computerPotsLost = Math.min(3, this.computerScore);
        
        // Update scores
        if (playerPotsLost > 0) this.updatePlayerScore(-playerPotsLost);
        if (computerPotsLost > 0) this.updateComputerScore(-computerPotsLost);
        
        // Create a height map object for the gold pots
        const goldPotHeightMap = {
            getHeightAtPosition: (x, z) => environment.getHeightAtPosition(x, z)
        };
        
        // Create new gold pots in a radius around the collision
        const totalPotsToCreate = playerPotsLost + computerPotsLost;
        const radius = 5; // Radius around collision point to scatter pots
        
        for (let i = 0; i < totalPotsToCreate; i++) {
            // Calculate random position in a circle around the collision
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * radius;
            const x = collisionPosition.x + Math.cos(angle) * distance;
            const z = collisionPosition.z + Math.sin(angle) * distance;
            
            // Create a new gold pot
            const pot = new GoldPot(this.scene, { x, z }, goldPotHeightMap);
            this.goldPots.push(pot);
        }
        
        // Update the pots counter
        this.updatePotsCounter();
        
        // Create a visual effect at the collision point
        this.createCollisionEffect(collisionPosition);
        
        return totalPotsToCreate;
    }
    
    // Create a visual effect at the collision point
    createCollisionEffect(position) {
        // Create a simple particle effect
        const numParticles = 20;
        const particles = [];
        
        for (let i = 0; i < numParticles; i++) {
            // Create a small sphere
            const geometry = new THREE.SphereGeometry(0.1, 8, 8);
            const material = new THREE.MeshBasicMaterial({ 
                color: Math.random() < 0.5 ? 0xFFD700 : 0xFF0000,
                transparent: true,
                opacity: 0.8
            });
            const particle = new THREE.Mesh(geometry, material);
            
            // Set initial position
            particle.position.set(position.x, 1, position.z);
            
            // Add to scene
            this.scene.add(particle);
            particles.push(particle);
            
            // Animate the particle
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.05 + Math.random() * 0.1;
            const dx = Math.cos(angle) * speed;
            const dy = 0.1 + Math.random() * 0.1;
            const dz = Math.sin(angle) * speed;
            
            // Animation function
            const animate = () => {
                // Move particle
                particle.position.x += dx;
                particle.position.y += dy;
                particle.position.z += dz;
                
                // Reduce opacity
                material.opacity -= 0.02;
                
                if (material.opacity > 0) {
                    // Continue animation
                    requestAnimationFrame(animate);
                } else {
                    // Remove particle
                    this.scene.remove(particle);
                    geometry.dispose();
                    material.dispose();
                }
            };
            
            // Start animation
            animate();
        }
    }
    
    // Update the pots counter
    updatePotsCounter() {
        const totalPots = this.goldPots.length;
        const collectedPots = this.playerScore + this.computerScore;
        const potsCounter = document.getElementById('pots-counter');
        if (potsCounter) {
            potsCounter.textContent = `Pots: ${collectedPots}/${totalPots}`;
        }
    }
    
    // Check if all gold pots have been collected
    checkLevelCompletion() {
        // Count uncollected pots
        const remainingPots = this.goldPots.filter(pot => !pot.collected).length;
        
        // If all pots are collected, show level completion message
        if (remainingPots === 0 && !this.gameOver) {
            this.gameOver = true;
            this.showLevelCompleteMessage();
            return true;
        }
        
        return false;
    }
    
    // Show level completion message
    showLevelCompleteMessage() {
        // Get level complete elements
        const levelCompleteElement = document.getElementById('level-complete');
        const levelCompleteMessage = document.getElementById('level-complete-message');
        const continueButton = document.getElementById('continue-button');
        
        // Determine the winner
        const totalPots = this.goldPots.length;
        let message;
        if (this.playerScore > this.computerScore) {
            message = `Game Over! You win! ${this.playerScore} - ${this.computerScore} (${totalPots} pots total)`;
        } else if (this.computerScore > this.playerScore) {
            message = `Game Over! Cousin Lydia wins! ${this.computerScore} - ${this.playerScore} (${totalPots} pots total)`;
        } else {
            message = `Game Over! It's a tie! ${this.playerScore} - ${this.computerScore} (${totalPots} pots total)`;
        }
        
        // Set message
        levelCompleteMessage.textContent = message;
        
        // Update continue button text
        continueButton.textContent = 'Restart Game';
        
        // Show message
        levelCompleteElement.style.display = 'block';
        
        // Play victory sound
        this.audioManager.playVictorySound();
    }
    
    // Start the next level
    startNextLevel() {
        // Hide level complete message
        document.getElementById('level-complete').style.display = 'none';
        
        // Increment level
        this.level++;
        
        // Reset scores for the new level
        this.playerScore = 0;
        this.computerScore = 0;
        this.updatePlayerScore(0);
        this.updateComputerScore(0);
        
        // Play level start sound
        this.audioManager.playLevelStartSound();
        
        // Notify that a new level has started (will be handled by the main simulation)
        const newLevelEvent = new CustomEvent('newLevel');
        window.dispatchEvent(newLevelEvent);
    }
}
