import * as THREE from 'three';

// Class for a wandering cat
export class Cat {
    constructor(scene, environment) {
        this.scene = scene;
        this.environment = environment;
        this.mesh = new THREE.Group();
        this.radius = 0.3; // Collision radius (smaller than characters)
        this.animationTime = 0;
        
        // Movement parameters
        this.speed = 1.5; // Base speed (slower than characters)
        this.wanderAngle = Math.random() * Math.PI * 2; // Random initial direction
        this.wanderChangeTimer = 0;
        this.wanderChangeInterval = 3; // How often to change direction (seconds)
        this.restTimer = 0;
        this.restInterval = 10; // How often to rest (seconds)
        this.isResting = false;
        this.restDuration = 5; // How long to rest (seconds)
        
        // Create the cat mesh
        this.createMesh();
        
        // Add to scene
        this.scene.add(this.mesh);
        
        // Set initial position
        this.setRandomPosition();
    }
    
    createMesh() {
        // Create materials
        const furMaterial = new THREE.MeshStandardMaterial({
            color: 0x111111, // Black fur
            roughness: 0.9,
            metalness: 0.1
        });
        
        const darkFurMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000, // Pure black for stripes/spots
            roughness: 0.9,
            metalness: 0.1
        });
        
        const pinkMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFAEC9, // Pink for nose and inner ears
            roughness: 0.7,
            metalness: 0.1
        });
        
        const eyeMaterial = new THREE.MeshStandardMaterial({
            color: 0x44FF00, // Green eyes
            roughness: 0.5,
            metalness: 0.2,
            emissive: 0x225500,
            emissiveIntensity: 0.2
        });
        
        // Create body
        const bodyGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        bodyGeometry.scale(1.2, 0.8, 1.5); // Elongate the body
        this.body = new THREE.Mesh(bodyGeometry, furMaterial);
        this.body.position.y = 0.3;
        this.body.castShadow = true;
        this.mesh.add(this.body);
        
        // Create head
        const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
        this.head = new THREE.Mesh(headGeometry, furMaterial);
        this.head.position.set(0, 0.5, 0.5);
        this.head.castShadow = true;
        this.mesh.add(this.head);
        
        // Create ears
        const earGeometry = new THREE.ConeGeometry(0.1, 0.15, 4);
        
        // Left ear
        this.leftEar = new THREE.Mesh(earGeometry, furMaterial);
        this.leftEar.position.set(-0.15, 0.7, 0.5);
        this.leftEar.rotation.x = -Math.PI / 4;
        this.leftEar.rotation.z = -Math.PI / 4;
        this.leftEar.castShadow = true;
        this.mesh.add(this.leftEar);
        
        // Right ear
        this.rightEar = new THREE.Mesh(earGeometry, furMaterial);
        this.rightEar.position.set(0.15, 0.7, 0.5);
        this.rightEar.rotation.x = -Math.PI / 4;
        this.rightEar.rotation.z = Math.PI / 4;
        this.rightEar.castShadow = true;
        this.mesh.add(this.rightEar);
        
        // Create inner ears
        const innerEarGeometry = new THREE.ConeGeometry(0.06, 0.1, 4);
        
        // Left inner ear
        this.leftInnerEar = new THREE.Mesh(innerEarGeometry, pinkMaterial);
        this.leftInnerEar.position.set(-0.15, 0.7, 0.5);
        this.leftInnerEar.position.y += 0.02;
        this.leftInnerEar.position.z += 0.02;
        this.leftInnerEar.rotation.x = -Math.PI / 4;
        this.leftInnerEar.rotation.z = -Math.PI / 4;
        this.mesh.add(this.leftInnerEar);
        
        // Right inner ear
        this.rightInnerEar = new THREE.Mesh(innerEarGeometry, pinkMaterial);
        this.rightInnerEar.position.set(0.15, 0.7, 0.5);
        this.rightInnerEar.position.y += 0.02;
        this.rightInnerEar.position.z += 0.02;
        this.rightInnerEar.rotation.x = -Math.PI / 4;
        this.rightInnerEar.rotation.z = Math.PI / 4;
        this.mesh.add(this.rightInnerEar);
        
        // Create eyes
        const eyeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        
        // Left eye
        this.leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        this.leftEye.position.set(-0.12, 0.55, 0.7);
        this.mesh.add(this.leftEye);
        
        // Right eye
        this.rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        this.rightEye.position.set(0.12, 0.55, 0.7);
        this.mesh.add(this.rightEye);
        
        // Create nose
        const noseGeometry = new THREE.ConeGeometry(0.05, 0.05, 4);
        this.nose = new THREE.Mesh(noseGeometry, pinkMaterial);
        this.nose.position.set(0, 0.45, 0.75);
        this.nose.rotation.x = Math.PI / 2;
        this.mesh.add(this.nose);
        
        // Create tail
        const tailGeometry = new THREE.CylinderGeometry(0.05, 0.02, 0.6, 8);
        tailGeometry.translate(0, 0.3, 0); // Move pivot to bottom
        this.tail = new THREE.Mesh(tailGeometry, furMaterial);
        this.tail.position.set(0, 0.3, -0.6);
        this.tail.rotation.x = Math.PI / 4; // Angle up
        this.tail.castShadow = true;
        this.mesh.add(this.tail);
        
        // Create legs
        const legGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.3, 8);
        
        // Front left leg
        this.frontLeftLeg = new THREE.Mesh(legGeometry, furMaterial);
        this.frontLeftLeg.position.set(-0.2, 0.15, 0.3);
        this.frontLeftLeg.castShadow = true;
        this.mesh.add(this.frontLeftLeg);
        
        // Front right leg
        this.frontRightLeg = new THREE.Mesh(legGeometry, furMaterial);
        this.frontRightLeg.position.set(0.2, 0.15, 0.3);
        this.frontRightLeg.castShadow = true;
        this.mesh.add(this.frontRightLeg);
        
        // Back left leg
        this.backLeftLeg = new THREE.Mesh(legGeometry, furMaterial);
        this.backLeftLeg.position.set(-0.2, 0.15, -0.3);
        this.backLeftLeg.castShadow = true;
        this.mesh.add(this.backLeftLeg);
        
        // Back right leg
        this.backRightLeg = new THREE.Mesh(legGeometry, furMaterial);
        this.backRightLeg.position.set(0.2, 0.15, -0.3);
        this.backRightLeg.castShadow = true;
        this.mesh.add(this.backRightLeg);
        
        // Add some spots/stripes for variety
        const spot1Geometry = new THREE.SphereGeometry(0.1, 8, 8);
        const spot1 = new THREE.Mesh(spot1Geometry, darkFurMaterial);
        spot1.position.set(0.15, 0.3, 0);
        spot1.scale.set(1, 0.5, 1);
        this.body.add(spot1);
        
        const spot2Geometry = new THREE.SphereGeometry(0.12, 8, 8);
        const spot2 = new THREE.Mesh(spot2Geometry, darkFurMaterial);
        spot2.position.set(-0.1, 0.25, -0.2);
        spot2.scale.set(1, 0.5, 1);
        this.body.add(spot2);
        
        // Scale the entire cat
        this.mesh.scale.set(0.7, 0.7, 0.7); // Make the cat smaller than characters
    }
    
    // Set the cat's position
    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }
    
    // Get the cat's position
    getPosition() {
        return this.mesh.position.clone();
    }
    
    // Set a random position for the cat
    setRandomPosition() {
        // Define areas where the cat can be placed
        const catAreas = [
            // Main area
            { x1: -30, z1: -30, x2: 30, z2: 30 },
            // Inside baths (fewer cats)
            { x1: -5, z1: -3, x2: 5, z2: 3 }, // Main bath
            { x1: -33, z1: -2, x2: -27, z2: 2 }, // Tepidarium
            { x1: 26, z1: -3, x2: 34, z2: 3 }, // Frigidarium
        ];
        
        // Select a random area
        const areaIndex = Math.floor(Math.random() * catAreas.length);
        const area = catAreas[areaIndex];
        
        // Generate a random position within the area
        const x = area.x1 + Math.random() * (area.x2 - area.x1);
        const z = area.z1 + Math.random() * (area.z2 - area.z1);
        
        // Set the position
        const y = this.environment.getHeightAtPosition(x, z);
        this.setPosition(x, y, z);
    }
    
    // Update the cat's animation and movement
    update(delta, characters) {
        // Update animation time
        this.animationTime += delta * 3;
        
        // Update timers
        this.wanderChangeTimer += delta;
        this.restTimer += delta;
        
        // Check if it's time to rest or move
        if (!this.isResting && this.restTimer >= this.restInterval) {
            this.isResting = true;
            this.restTimer = 0;
        } else if (this.isResting && this.restTimer >= this.restDuration) {
            this.isResting = false;
            this.restTimer = 0;
            // Change direction when starting to move again
            this.wanderAngle = Math.random() * Math.PI * 2;
        }
        
        // If resting, just update animation
        if (this.isResting) {
            this.updateRestingAnimation(delta);
            return;
        }
        
        // Check if it's time to change direction
        if (this.wanderChangeTimer >= this.wanderChangeInterval) {
            this.wanderChangeTimer = 0;
            // Change direction randomly, but not too drastically
            this.wanderAngle += (Math.random() - 0.5) * Math.PI;
        }
        
        // Calculate movement
        const moveSpeed = this.speed * delta;
        const moveX = Math.sin(this.wanderAngle) * moveSpeed;
        const moveZ = Math.cos(this.wanderAngle) * moveSpeed;
        
        // Calculate new position
        const newX = this.mesh.position.x + moveX;
        const newZ = this.mesh.position.z + moveZ;
        
        // Check for collisions with environment
        if (!this.environment.checkCollision(newX, newZ)) {
            // Check for collisions with characters
            let collisionWithCharacter = false;
            
            for (const character of characters) {
                const characterPos = character.getPosition();
                const dx = newX - characterPos.x;
                const dz = newZ - characterPos.z;
                const distance = Math.sqrt(dx * dx + dz * dz);
                
                // Check if cat is close enough to collide
                const collisionDistance = this.radius + character.radius;
                if (distance < collisionDistance) {
                    collisionWithCharacter = true;
                    
                    // Change direction away from character
                    this.wanderAngle = Math.atan2(dx, dz);
                    break;
                }
            }
            
            if (!collisionWithCharacter) {
                // Update cat position
                this.mesh.position.x = newX;
                this.mesh.position.z = newZ;
                
                // Update cat rotation to face direction of movement
                this.mesh.rotation.y = Math.atan2(moveX, moveZ);
                
                // Update height based on terrain
                const targetHeight = this.environment.getHeightAtPosition(newX, newZ);
                this.mesh.position.y += (targetHeight - this.mesh.position.y) * 0.1;
                
                // Update walking animation
                this.updateWalkingAnimation(delta);
            }
        } else {
            // Hit an obstacle, change direction
            this.wanderAngle += Math.PI / 2 + (Math.random() - 0.5) * Math.PI / 2;
        }
    }
    
    // Update the cat's walking animation
    updateWalkingAnimation(delta) {
        // Walking animation for legs
        const legSwing = Math.sin(this.animationTime) * 0.2;
        
        // Front legs move opposite to back legs
        this.frontLeftLeg.rotation.x = legSwing;
        this.backLeftLeg.rotation.x = -legSwing;
        this.frontRightLeg.rotation.x = -legSwing;
        this.backRightLeg.rotation.x = legSwing;
        
        // Tail sways side to side
        this.tail.rotation.z = Math.sin(this.animationTime * 0.5) * 0.2;
        
        // Head bobs slightly
        this.head.position.y = 0.5 + Math.sin(this.animationTime * 2) * 0.02;
    }
    
    // Update the cat's resting animation
    updateRestingAnimation(delta) {
        // Reset leg positions
        this.frontLeftLeg.rotation.x = 0;
        this.backLeftLeg.rotation.x = 0;
        this.frontRightLeg.rotation.x = 0;
        this.backRightLeg.rotation.x = 0;
        
        // Tail sways more slowly
        this.tail.rotation.z = Math.sin(this.animationTime * 0.2) * 0.1;
        
        // Breathing animation
        const breathe = Math.sin(this.animationTime * 0.5) * 0.05;
        this.body.scale.y = 0.8 + breathe;
        
        // Occasionally blink
        if (Math.sin(this.animationTime * 0.3) > 0.95) {
            this.leftEye.scale.y = 0.1;
            this.rightEye.scale.y = 0.1;
        } else {
            this.leftEye.scale.y = 1;
            this.rightEye.scale.y = 1;
        }
    }
}
