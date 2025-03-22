import * as THREE from 'three';

// Class to handle the minimap display
export class Minimap {
    constructor(scene, environment) {
        this.scene = scene;
        this.environment = environment;
        
        // Minimap settings
        this.size = 150; // Size in pixels
        this.mapScale = 1.0; // Scale factor (higher = more zoomed out, lower = more zoomed in)
        this.borderWidth = 2;
        
        // Playable area bounds (from level.json)
        // Adjusted to focus more on the central playable area with the baths
        this.bounds = {
            minX: -30,
            maxX: 30,
            minZ: -30,
            maxZ: 30
        };
        
        // Create the minimap container
        this.createMinimapContainer();
        
        // Create the minimap canvas
        this.createMinimapCanvas();
        
        // Initialize markers
        this.markers = {
            player: { color: '#00FF00', position: { x: 0, z: 0 }, size: 5 },
            computer: { color: '#FF0000', position: { x: 0, z: 0 }, size: 5 },
            cat: { color: '#FFFFFF', position: { x: 0, z: 0 }, size: 3 },
            pots: []
        };
    }
    
    // Create the minimap container
    createMinimapContainer() {
        // Create container
        this.container = document.createElement('div');
        this.container.className = 'minimap-container';
        this.container.style.position = 'absolute';
        this.container.style.bottom = '20px';
        this.container.style.right = '20px';
        this.container.style.width = `${this.size}px`;
        this.container.style.height = `${this.size}px`;
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.container.style.border = `${this.borderWidth}px solid #8B4513`;
        this.container.style.borderRadius = '5px';
        this.container.style.overflow = 'hidden';
        this.container.style.zIndex = '1000';
        
        // Add title
        const title = document.createElement('div');
        title.className = 'minimap-title';
        title.textContent = 'Map';
        title.style.position = 'absolute';
        title.style.top = '5px';
        title.style.left = '10px';
        title.style.color = '#FFFFFF';
        title.style.fontSize = '12px';
        title.style.fontWeight = 'bold';
        this.container.appendChild(title);
        
        // Add legend
        this.createLegend();
        
        // Add to document
        document.body.appendChild(this.container);
    }
    
    // Create a legend for the minimap
    createLegend() {
        const legend = document.createElement('div');
        legend.className = 'minimap-legend';
        legend.style.position = 'absolute';
        legend.style.bottom = '5px';
        legend.style.left = '5px';
        legend.style.right = '5px';
        legend.style.display = 'flex';
        legend.style.flexDirection = 'column';
        legend.style.fontSize = '8px';
        legend.style.color = '#FFFFFF';
        legend.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        legend.style.padding = '3px';
        legend.style.borderRadius = '3px';
        
        // Create legend items
        const items = [
            { color: '#00FF00', label: 'You' },
            { color: '#FF0000', label: 'Cousin Lydia' },
            { color: '#FFFFFF', label: 'Cat' },
            { color: '#FFD700', label: 'Gold Pots' }
        ];
        
        // Add each item to the legend
        items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.style.display = 'flex';
            itemDiv.style.alignItems = 'center';
            itemDiv.style.marginBottom = '2px';
            
            // Create color dot
            const dot = document.createElement('div');
            dot.style.width = '6px';
            dot.style.height = '6px';
            dot.style.borderRadius = '50%';
            dot.style.backgroundColor = item.color;
            dot.style.marginRight = '4px';
            
            // Create label
            const label = document.createElement('span');
            label.textContent = item.label;
            
            // Add to item
            itemDiv.appendChild(dot);
            itemDiv.appendChild(label);
            
            // Add to legend
            legend.appendChild(itemDiv);
        });
        
        // Add to container
        this.container.appendChild(legend);
    }
    
    // Create the minimap canvas
    createMinimapCanvas() {
        // Create canvas
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.size;
        this.canvas.height = this.size;
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.container.appendChild(this.canvas);
        
        // Get context
        this.ctx = this.canvas.getContext('2d');
    }
    
    // Update the minimap with new positions
    update(player, computer, cat, goldPots) {
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.size, this.size);
        
        // Draw background (simplified map)
        this.drawBackground();
        
        // Update marker positions
        this.markers.player.position = player.getPosition();
        this.markers.computer.position = computer.getPosition();
        this.markers.cat.position = cat.getPosition();
        
        // Update gold pots
        this.markers.pots = [];
        for (const pot of goldPots) {
            if (!pot.collected) {
                this.markers.pots.push({
                    color: '#FFD700', // Gold color
                    position: pot.position,
                    size: 3
                });
            }
        }
        
        // Draw all markers
        this.drawMarkers();
    }
    
    // Draw the background (simplified map)
    drawBackground() {
        // Draw main area
        this.ctx.fillStyle = '#8B7355'; // Tan color for ground
        this.ctx.fillRect(0, 0, this.size, this.size);
        
        // Draw water areas from level data
        this.drawWaterAreas();
        
        // Draw grid lines
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 0.5;
        
        // Vertical grid lines - adjusted to match playable area bounds
        for (let x = this.bounds.minX; x <= this.bounds.maxX; x += 10) {
            const screenX = this.worldToScreenX(x);
            this.ctx.beginPath();
            this.ctx.moveTo(screenX, 0);
            this.ctx.lineTo(screenX, this.size);
            this.ctx.stroke();
        }
        
        // Horizontal grid lines - adjusted to match playable area bounds
        for (let z = this.bounds.minZ; z <= this.bounds.maxZ; z += 10) {
            const screenY = this.worldToScreenY(z);
            this.ctx.beginPath();
            this.ctx.moveTo(0, screenY);
            this.ctx.lineTo(this.size, screenY);
            this.ctx.stroke();
        }
    }
    
    // Draw a rectangle on the map (in world coordinates)
    drawMapRect(x, z, width, height) {
        const screenX = this.worldToScreenX(x);
        const screenY = this.worldToScreenY(z);
        const screenWidth = width / this.mapScale;
        const screenHeight = height / this.mapScale;
        this.ctx.fillRect(screenX, screenY, screenWidth, screenHeight);
    }
    
    // Draw all markers
    drawMarkers() {
        // Draw player marker
        this.drawMarker(
            this.markers.player.position.x,
            this.markers.player.position.z,
            this.markers.player.color,
            this.markers.player.size
        );
        
        // Draw computer marker
        this.drawMarker(
            this.markers.computer.position.x,
            this.markers.computer.position.z,
            this.markers.computer.color,
            this.markers.computer.size
        );
        
        // Draw cat marker
        this.drawMarker(
            this.markers.cat.position.x,
            this.markers.cat.position.z,
            this.markers.cat.color,
            this.markers.cat.size
        );
        
        // Draw pot markers
        for (const pot of this.markers.pots) {
            this.drawMarker(
                pot.position.x,
                pot.position.z,
                pot.color,
                pot.size
            );
        }
    }
    
    // Draw a marker at the specified position
    drawMarker(x, z, color, size) {
        const screenX = this.worldToScreenX(x);
        const screenY = this.worldToScreenY(z);
        
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    // Convert world X coordinate to screen X coordinate
    worldToScreenX(x) {
        // Map world coordinates to screen coordinates based on bounds
        const worldWidth = this.bounds.maxX - this.bounds.minX;
        const centerX = (this.bounds.minX + this.bounds.maxX) / 2;
        return this.size / 2 + ((x - centerX) / this.mapScale);
    }
    
    // Convert world Z coordinate to screen Y coordinate
    worldToScreenY(z) {
        // Map world coordinates to screen coordinates based on bounds
        const worldHeight = this.bounds.maxZ - this.bounds.minZ;
        const centerZ = (this.bounds.minZ + this.bounds.maxZ) / 2;
        return this.size / 2 + ((z - centerZ) / this.mapScale);
    }
    
    // Draw water areas from level data
    drawWaterAreas() {
        // Get water areas from environment
        if (!this.environment || !this.environment.levelLoader || !this.environment.levelLoader.levelData) {
            return;
        }
        
        // Get baths from level data
        const baths = this.environment.levelLoader.getBaths();
        
        // Draw each bath with appropriate color
        baths.forEach(bath => {
            // Set color based on water temperature
            let waterColor;
            switch (bath.water.temperature) {
                case 'hot':
                    waterColor = '#0077be'; // Darker blue for hot water
                    break;
                case 'warm':
                    waterColor = '#4ca6ff'; // Medium blue for warm water
                    break;
                case 'cold':
                    waterColor = '#8cdfff'; // Light blue for cold water
                    break;
                default:
                    waterColor = '#4682B4'; // Default steel blue
            }
            
            this.ctx.fillStyle = waterColor;
            
            // Calculate bath dimensions
            const x = bath.position.x - bath.dimensions.innerWidth / 2;
            const z = bath.position.z - bath.dimensions.innerLength / 2;
            const width = bath.dimensions.innerWidth;
            const height = bath.dimensions.innerLength;
            
            // Draw bath on minimap
            this.drawMapRect(x, z, width, height);
        });
    }
}
