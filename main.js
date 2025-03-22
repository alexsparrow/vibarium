import { RomanBathsSimulation } from './js/main.js';
import * as THREE from 'three';

// Initialize the simulation when the page loads
window.addEventListener('DOMContentLoaded', async () => {
    // Set up loading manager to track progress
    const loadingManager = new THREE.LoadingManager();
    const progressBar = document.getElementById('progress-bar');
    const loadingText = document.getElementById('loading-text');
    const loadingScreen = document.getElementById('loading-screen');
    
    // Track loading progress
    loadingManager.onProgress = function(url, itemsLoaded, itemsTotal) {
        const progress = (itemsLoaded / itemsTotal) * 100;
        progressBar.style.width = progress + '%';
        loadingText.textContent = `Loading assets... ${Math.round(progress)}%`;
    };
    
    // Hide loading screen when complete
    loadingManager.onLoad = function() {
        loadingText.textContent = 'Loading complete!';
        setTimeout(() => {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }, 500);
    };
    
    // Create simulation with loading manager
    const simulation = new RomanBathsSimulation(loadingManager);
    
    // Update loading text
    loadingText.textContent = 'Initializing environment...';
    
    // Wait for environment to initialize
    const initialized = await simulation.initializeEnvironment();
    
    if (initialized) {
        // If we're here and the loading manager hasn't triggered onLoad yet,
        // force it to complete (in case there were no textures to load)
        if (progressBar.style.width !== '100%') {
            progressBar.style.width = '100%';
            loadingManager.onLoad();
        }
    } else {
        // Handle initialization failure
        loadingText.textContent = 'Failed to initialize environment. Please refresh the page.';
        progressBar.style.backgroundColor = '#B22222'; // Red color for error
    }
    
    // Add event listener for force collision button
    const forceCollisionButton = document.getElementById('force-collision');
    if (forceCollisionButton) {
        forceCollisionButton.addEventListener('click', () => {
            console.log("Force collision button clicked");
            
            // Ensure both characters have at least one pot
            if (simulation.levelManager.playerScore === 0) {
                simulation.levelManager.updatePlayerScore(1);
            }
            if (simulation.levelManager.computerScore === 0) {
                simulation.levelManager.updateComputerScore(1);
            }
            
            // Get player position
            const playerPos = simulation.player.getPosition();
            
            // Directly call handleCharacterCollision
            simulation.levelManager.handleCharacterCollision(playerPos, simulation.environment);
        });
    }
});
