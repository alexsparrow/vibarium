// Class to handle all input-related functionality
export class InputManager {
    constructor(simulation) {
        this.simulation = simulation;
        this.keys = {
            w: false,
            a: false,
            s: false,
            d: false,
            f: false,
            m: false
        };
        
        // Add event listeners
        window.addEventListener('keydown', this.onKeyDown.bind(this));
        window.addEventListener('keyup', this.onKeyUp.bind(this));
        
        // Debug mode
        this.debugMode = false;
        
        // Initialize debug controls
        this.initializeDebugControls();
    }
    
    // Initialize debug controls
    initializeDebugControls() {
        // Create debug menu button
        const infoElement = document.getElementById('info');
        const debugMenuButton = document.createElement('button');
        debugMenuButton.id = 'debug-menu-button';
        debugMenuButton.textContent = 'Debug Menu';
        debugMenuButton.style.display = 'none'; // Hidden by default
        
        // Create debug controls container
        const debugControls = document.createElement('div');
        debugControls.className = 'debug-controls';
        debugControls.id = 'debug-controls';
        debugControls.style.display = 'none'; // Hidden by default
        
        // Create force collision button
        const forceCollisionButton = document.createElement('button');
        forceCollisionButton.id = 'force-collision';
        forceCollisionButton.textContent = 'Force Collision';
        debugControls.appendChild(forceCollisionButton);
        
        // Add event listener for force collision button
        forceCollisionButton.addEventListener('click', () => {
            // Ensure both characters have at least one pot
            if (this.simulation.levelManager.playerScore === 0) {
                this.simulation.levelManager.updatePlayerScore(1);
            }
            if (this.simulation.levelManager.computerScore === 0) {
                this.simulation.levelManager.updateComputerScore(1);
            }
            
            // Get player position
            const playerPos = this.simulation.player.getPosition();
            
            // Directly call handleCharacterCollision
            this.simulation.levelManager.handleCharacterCollision(playerPos, this.simulation.environment);
        });
        
        // Add debug menu button to info element
        const audioControls = document.querySelector('.audio-controls');
        if (audioControls) {
            audioControls.after(debugMenuButton);
            audioControls.after(debugControls);
        } else {
            infoElement.appendChild(debugMenuButton);
            infoElement.appendChild(debugControls);
        }
        
        // Add event listener for debug menu button
        debugMenuButton.addEventListener('click', () => {
            // Toggle debug controls
            const debugControls = document.getElementById('debug-controls');
            if (debugControls) {
                debugControls.style.display = debugControls.style.display === 'none' ? 'block' : 'none';
            }
        });
        
        // Add event listener for backtick key to toggle debug mode
        document.addEventListener('keydown', (event) => {
            if (event.key === '`') {
                this.debugMode = !this.debugMode;
                debugMenuButton.style.display = this.debugMode ? 'block' : 'none';
                debugControls.style.display = 'none'; // Always hide controls when toggling debug mode
            }
        });
    }
    
    onKeyDown(event) {
        // Update key states
        switch(event.key.toLowerCase()) {
            case 'w':
                this.keys.w = true;
                break;
            case 'a':
                this.keys.a = true;
                break;
            case 's':
                this.keys.s = true;
                break;
            case 'd':
                this.keys.d = true;
                break;
            case 'f':
                // Toggle camera follow mode
                this.simulation.cameraFollowPlayer = !this.simulation.cameraFollowPlayer;
                break;
            case 'm':
                // Toggle music
                this.simulation.audioManager.toggleMusic();
                break;
        }
    }
    
    onKeyUp(event) {
        // Update key states
        switch(event.key.toLowerCase()) {
            case 'w':
                this.keys.w = false;
                break;
            case 'a':
                this.keys.a = false;
                break;
            case 's':
                this.keys.s = false;
                break;
            case 'd':
                this.keys.d = false;
                break;
        }
    }
    
    // Get the current movement direction based on key states
    getMovementDirection() {
        let moveX = 0;
        let moveZ = 0;
        
        if (this.keys.w) moveZ -= 1;
        if (this.keys.s) moveZ += 1;
        if (this.keys.a) moveX -= 1;
        if (this.keys.d) moveX += 1;
        
        return { x: moveX, z: moveZ };
    }
}
