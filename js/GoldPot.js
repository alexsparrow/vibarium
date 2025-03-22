import * as THREE from 'three';

// Class for the collectible gold pots
export class GoldPot {
    constructor(scene, position, heightMap) {
        this.scene = scene;
        this.position = position;
        this.heightMap = heightMap;
        this.collected = false;
        this.floatOffset = Math.random() * Math.PI * 2; // Random starting phase
        this.floatSpeed = 0.5 + Math.random() * 0.5; // Random float speed
        this.floatHeight = 0.2 + Math.random() * 0.2; // Increased float height for better visibility
        
        // Create the gold pot mesh
        this.createMesh();
        
        // Set the initial position
        this.updatePosition();
    }
    
    createMesh() {
        // Create a group to hold the pot parts
        this.mesh = new THREE.Group();
        
        // Enhanced gold material with stronger emissive for better visibility
        const goldMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFD700,
            metalness: 0.9,
            roughness: 0.1,
            emissive: 0xFFAA00,
            emissiveIntensity: 0.5
        });
        
        // Create pot body - slightly larger
        const bodyGeometry = new THREE.CylinderGeometry(0.4, 0.5, 0.8, 16);
        this.body = new THREE.Mesh(bodyGeometry, goldMaterial);
        this.body.position.y = 0.4;
        this.body.castShadow = true;
        this.mesh.add(this.body);
        
        // Create pot neck
        const neckGeometry = new THREE.CylinderGeometry(0.35, 0.4, 0.3, 16);
        this.neck = new THREE.Mesh(neckGeometry, goldMaterial);
        this.neck.position.y = 0.95;
        this.neck.castShadow = true;
        this.mesh.add(this.neck);
        
        // Create pot rim
        const rimGeometry = new THREE.CylinderGeometry(0.4, 0.35, 0.15, 16);
        this.rim = new THREE.Mesh(rimGeometry, goldMaterial);
        this.rim.position.y = 1.175;
        this.rim.castShadow = true;
        this.mesh.add(this.rim);
        
        // Add a glowing halo effect
        const haloGeometry = new THREE.SphereGeometry(0.8, 16, 16);
        const haloMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFF00,
            transparent: true,
            opacity: 0.15,
            side: THREE.BackSide
        });
        this.halo = new THREE.Mesh(haloGeometry, haloMaterial);
        this.halo.position.y = 0.7;
        this.mesh.add(this.halo);
        
        // Add to scene
        this.scene.add(this.mesh);
    }
    
    updatePosition() {
        if (this.collected) return;
        
        // Get the base height from the height map
        const baseHeight = this.heightMap.getHeightAtPosition(this.position.x, this.position.z);
        
        // Add a small offset to float above the ground/water
        const floatOffset = 0.5;
        
        // Add a sine wave to create a floating effect
        const time = Date.now() * 0.001;
        const floatY = Math.sin(time * this.floatSpeed + this.floatOffset) * this.floatHeight;
        
        // Update the mesh position
        this.mesh.position.set(
            this.position.x,
            baseHeight + floatOffset + floatY,
            this.position.z
        );
        
        // Add a gentle rotation
        this.mesh.rotation.y += 0.01;
    }
    
    checkCollection(playerPosition, collectionRadius) {
        if (this.collected) return false;
        
        // Calculate distance to player
        const dx = this.position.x - playerPosition.x;
        const dz = this.position.z - playerPosition.z;
        const distance = Math.sqrt(dx * dx + dz * dz);
        
        // Check if player is close enough to collect
        if (distance < collectionRadius) {
            this.collect();
            return true;
        }
        
        return false;
    }
    
    collect() {
        this.collected = true;
        this.scene.remove(this.mesh);
    }
}
