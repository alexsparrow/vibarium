import * as THREE from 'three';
import { 
    CHARACTER_WATER_HEIGHT_OFFSET, 
    CHARACTER_STATIONARY_WATER_HEIGHT_OFFSET, 
    CHARACTER_SWIMMING_TILT_ANGLE,
    CHARACTER_WATER_BOB_AMPLITUDE,
    CHARACTER_WATER_BOB_FREQUENCY
} from './constants.js';

// Base class for characters (player and computer-controlled)
export class Character {
    constructor(scene, isPlayer = true) {
        this.scene = scene;
        this.isPlayer = isPlayer;
        this.mesh = new THREE.Group();
        this.radius = 0.5; // Collision radius
        this.legAnimationTime = 0;
        
        // Initialize water state tracking
        this.wasInWater = false;
        this.lastSwimmingYRotation = 0;
        
        // Create the character mesh
        this.createMesh();
        
        // Add to scene
        this.scene.add(this.mesh);
    }
    
    createMesh() {
        // Create fabric-like material for the tunic - different color based on player/computer
        const fabricColor = this.isPlayer ? 0xE8C39E : 0xE84C3E; // Beige for player, red for computer
        const fabricMaterial = new THREE.MeshStandardMaterial({
            color: fabricColor,
            roughness: 0.7,
            metalness: 0.1
        });
        
        // Create skin-like material
        const skinMaterial = new THREE.MeshStandardMaterial({
            color: 0xD2A678, // Tan skin color
            roughness: 0.5,
            metalness: 0.1
        });
        
        // Create hair material
        const hairMaterial = new THREE.MeshStandardMaterial({
            color: 0x3B2417, // Dark brown
            roughness: 0.8,
            metalness: 0.1
        });
        
        // Create body (tunic)
        const bodyGeometry = new THREE.CylinderGeometry(0.4, 0.5, 2, 8);
        this.body = new THREE.Mesh(bodyGeometry, fabricMaterial);
        this.body.position.y = 1.5;
        this.body.castShadow = true;
        this.mesh.add(this.body);
        
        // Create head
        const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        this.head = new THREE.Mesh(headGeometry, skinMaterial);
        this.head.position.y = 3;
        this.head.castShadow = true;
        this.mesh.add(this.head);
        
        // Create hair (simple cap)
        const hairGeometry = new THREE.SphereGeometry(0.42, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        this.hair = new THREE.Mesh(hairGeometry, hairMaterial);
        this.hair.position.y = 3.05;
        this.hair.castShadow = true;
        this.mesh.add(this.hair);
        
        // Create arms
        const armGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.5, 8);
        
        // Left arm
        this.leftArm = new THREE.Mesh(armGeometry, skinMaterial);
        this.leftArm.position.set(-0.5, 2, 0);
        this.leftArm.rotation.z = Math.PI / 6; // Angle slightly outward
        this.leftArm.castShadow = true;
        this.mesh.add(this.leftArm);
        
        // Right arm
        this.rightArm = new THREE.Mesh(armGeometry, skinMaterial);
        this.rightArm.position.set(0.5, 2, 0);
        this.rightArm.rotation.z = -Math.PI / 6; // Angle slightly outward
        this.rightArm.castShadow = true;
        this.mesh.add(this.rightArm);
        
        // Create legs
        const legGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.5, 8);
        
        // Left leg
        this.leftLeg = new THREE.Mesh(legGeometry, skinMaterial);
        this.leftLeg.position.set(-0.25, 0.5, 0);
        this.leftLeg.castShadow = true;
        this.mesh.add(this.leftLeg);
        
        // Right leg
        this.rightLeg = new THREE.Mesh(legGeometry, skinMaterial);
        this.rightLeg.position.set(0.25, 0.5, 0);
        this.rightLeg.castShadow = true;
        this.mesh.add(this.rightLeg);
        
        // Add a water jug to carry for the player character
        if (this.isPlayer) {
            const jugGeometry = new THREE.CylinderGeometry(0.2, 0.3, 0.6, 8);
            const jugMaterial = new THREE.MeshStandardMaterial({
                color: 0xC35A38, // Terracotta color
                roughness: 0.8,
                metalness: 0.1
            });
            const jug = new THREE.Mesh(jugGeometry, jugMaterial);
            jug.position.set(-0.8, 2, 0.3);
            jug.rotation.z = Math.PI / 3; // Tilt the jug
            jug.castShadow = true;
            this.mesh.add(jug);
        }
    }
    
    // Set the character's position
    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }
    
    // Get the character's position
    getPosition() {
        return this.mesh.position.clone();
    }
    
    // Update the character's animation based on movement and water status
    updateAnimation(delta, isMoving, inWater, moveDirection = { x: 0, z: 0 }) {
        // Update animation time
        this.legAnimationTime += delta * (inWater ? 1.5 : 3); // Slower animation in water
        
        // Reset rotations of body parts to default
        this.leftLeg.rotation.set(0, 0, 0);
        this.rightLeg.rotation.set(0, 0, 0);
        this.leftArm.rotation.set(0, 0, 0);
        this.rightArm.rotation.set(0, 0, 0);
        this.head.rotation.set(0, 0, 0);
        
        // Only reset mesh rotation if in water or not moving
        // This allows the rotation set in the update method to persist when walking on land
        if (inWater || !isMoving) {
            // Store the current Y rotation so we can preserve it if needed
            const currentYRotation = this.mesh.rotation.y;
            
            // Reset mesh rotation
            this.mesh.rotation.set(0, 0, 0);
            
            // If not moving on land, preserve the Y rotation so the character keeps facing the same direction
            if (!inWater && !isMoving) {
                this.mesh.rotation.y = currentYRotation;
            }
        }
        
        // Apply animations based on water status
        if (inWater) {
            // Swimming animation - legs and arms move in sync
            // Apply animation even when not moving (treading water)
            const swimAngle = Math.sin(this.legAnimationTime) * 0.8; // Increased amplitude for more noticeable movement
            const animationIntensity = isMoving ? 1.0 : 0.7; // Increased intensity when not moving
            
            // For swimming, we need to handle the orientation differently
            
            // Set the direction the character is facing (based on movement)
            if (moveDirection.x !== 0 || moveDirection.z !== 0) {
                // Calculate the target rotation based on movement direction
                const targetRotationY = Math.atan2(moveDirection.x, moveDirection.z);
                
                // When swimming, we want the character to be horizontal with head pointing
                // in the direction of motion and legs opposite to the direction of motion
                
                // First, reset the rotation
                this.mesh.rotation.set(0, 0, 0);
                
                // Step 1: Rotate the character to face the direction of travel in the XZ plane
                this.mesh.rotation.y = targetRotationY;
                
                // Step 2: Apply a tilt rotation around the local X axis 
                // to make the character horizontal with a slight upward tilt (head higher than legs)
                const rotationMatrix = new THREE.Matrix4();
                rotationMatrix.makeRotationX(CHARACTER_SWIMMING_TILT_ANGLE);
                
                // Apply the local rotation to the mesh
                this.mesh.updateMatrix(); // Update the mesh's matrix to include the Y rotation
                this.mesh.matrix.multiply(rotationMatrix); // Apply the X rotation in local space
                this.mesh.rotation.setFromRotationMatrix(this.mesh.matrix); // Update rotation from matrix
                
                // Store the current Y rotation for use when transitioning to land
                this.lastSwimmingYRotation = targetRotationY;
            } else {
                // If not moving, rotate back to vertical position
                this.mesh.rotation.x = 0; // Vertical position when not moving in water
            }
            
            // Apply swimming animation to limbs
            // Legs kick together in swimming - more exaggerated
            this.leftLeg.rotation.z = swimAngle * animationIntensity; // Changed from x to z rotation
            this.rightLeg.rotation.z = swimAngle * animationIntensity; // Changed from x to z rotation
            
            // Position legs more horizontally for swimming - more exaggerated
            this.leftLeg.rotation.x = -0.3; // Adjusted for new orientation
            this.rightLeg.rotation.x = 0.3; // Adjusted for new orientation
            
            // Arms do breaststroke-like motion - more exaggerated
            this.leftArm.rotation.z = swimAngle * animationIntensity + 0.7; // Changed from x to z rotation
            this.rightArm.rotation.z = swimAngle * animationIntensity + 0.7; // Changed from x to z rotation
            this.leftArm.rotation.x = Math.PI / 3; // Adjusted for new orientation
            this.rightArm.rotation.x = -Math.PI / 3; // Adjusted for new orientation
            
            // Adjust head position to look forward while swimming
            this.head.rotation.x = 0.5; // Adjusted for new orientation
        } else if (isMoving) {
            // Walking animation - only when moving and not in water
            const legSwing = Math.sin(this.legAnimationTime) * 0.3;
            
            // Apply walking animation
            this.leftLeg.rotation.x = legSwing;
            this.rightLeg.rotation.x = -legSwing;
            
            // Reset leg rotation for walking
            this.leftLeg.rotation.z = 0;
            this.rightLeg.rotation.z = 0;
            
            // Reset arm positions for walking
            this.leftArm.rotation.x = 0;
            this.rightArm.rotation.x = 0;
            this.leftArm.rotation.z = Math.PI / 6; // Default angle
            this.rightArm.rotation.z = -Math.PI / 6; // Default angle
            
            // Reset body and head rotation for walking
            this.mesh.rotation.x = 0;
            this.head.rotation.x = 0; // Reset head rotation
        } else {
            // Standing still on land - reset to default pose
            this.leftLeg.rotation.x = 0;
            this.rightLeg.rotation.x = 0;
            this.leftLeg.rotation.z = 0;
            this.rightLeg.rotation.z = 0;
            this.leftArm.rotation.x = 0;
            this.rightArm.rotation.x = 0;
            this.leftArm.rotation.z = Math.PI / 6; // Default angle
            this.rightArm.rotation.z = -Math.PI / 6; // Default angle
            this.mesh.rotation.x = 0;
        }
    }
}

// Player-controlled character class
export class PlayerCharacter extends Character {
    constructor(scene) {
        super(scene, true);
    }
    
    // Update the player character based on input direction
    update(delta, moveDirection, checkCollision, isInWater, getHeightAtPosition) {
        // Check if character is in water
        const waterStatus = isInWater(this.mesh.position.x, this.mesh.position.z);
        const inWater = waterStatus.inWater;
        
        // Check for water-to-land transition
        if (this.wasInWater && !inWater) {
            // Reset rotation completely when transitioning from water to land
            this.mesh.rotation.set(0, this.lastSwimmingYRotation || 0, 0);
        }
        
        // Store current water state for next frame
        this.wasInWater = inWater;
        
        // Movement speed - slower in water
        const baseSpeed = inWater ? 2 : 5; // Slower in water
        const moveSpeed = baseSpeed * delta; // Units per second
        
        // Initialize movement variables
        let moveX = 0;
        let moveZ = 0;
        let isMoving = false;
        
        // Apply movement direction
        if (moveDirection.x !== 0 || moveDirection.z !== 0) {
            moveX = moveDirection.x * moveSpeed;
            moveZ = moveDirection.z * moveSpeed;
            isMoving = true;
        }
        
        // If moving, update position and rotation
        if (isMoving) {
            // Calculate new position
            const newX = this.mesh.position.x + moveX;
            const newZ = this.mesh.position.z + moveZ;
            
            // Check for boundary - limit to the area with baths (-50 to 50 in x and z)
            const boundaryLimit = 50;
            const isWithinBoundary = 
                newX >= -boundaryLimit && 
                newX <= boundaryLimit && 
                newZ >= -boundaryLimit && 
                newZ <= boundaryLimit;
            
            // Check for collisions before moving
            if (!checkCollision(newX, newZ) && isWithinBoundary) {
                // Update character position
                this.mesh.position.x = newX;
                this.mesh.position.z = newZ;
                
                // If not in water, rotate the character to face the direction of travel
                if (!inWater && (moveDirection.x !== 0 || moveDirection.z !== 0)) {
                    // Calculate the target rotation based on movement direction
                    // In THREE.js, rotation.y is the rotation around the Y axis (vertical axis)
                    // A rotation of 0 means facing negative Z (north in our game)
                    // We need to calculate the angle between the movement vector and the negative Z axis
                    
                    // Add PI to make the character face the direction of travel
                    // This is because the character model is initially facing the negative Z direction
                    const targetRotationY = Math.atan2(moveDirection.x, moveDirection.z);
                    
                    // Apply the rotation directly to the mesh
                    this.mesh.rotation.y = targetRotationY;
                    
                    // Skip the normal animation update to prevent it from overriding our rotation
                    // Instead, manually update the limbs for walking animation
                    const legSwing = Math.sin(this.legAnimationTime) * 0.3;
                    this.leftLeg.rotation.x = legSwing;
                    this.rightLeg.rotation.x = -legSwing;
                    this.leftLeg.rotation.z = 0;
                    this.rightLeg.rotation.z = 0;
                    this.leftArm.rotation.x = 0;
                    this.rightArm.rotation.x = 0;
                    this.leftArm.rotation.z = Math.PI / 6; // Default angle
                    this.rightArm.rotation.z = -Math.PI / 6; // Default angle
                    this.head.rotation.x = 0;
                    
                    // Debug log to check rotation values
                    console.log(`Player rotation: ${this.mesh.rotation.y.toFixed(2)}, moveDirection: ${moveDirection.x.toFixed(2)}, ${moveDirection.z.toFixed(2)}`);
                }
            }
        }
        
        // Always update animation - this ensures swimming animation plays even when not moving
        // Make sure animation is more noticeable by increasing the intensity
        const animationDirection = { x: moveX, z: moveZ };
        if (inWater) {
            // Increase animation intensity for swimming to make it more visible
            this.legAnimationTime += delta * 2; // Additional animation time boost for swimming
        }
        this.updateAnimation(delta, isMoving, inWater, animationDirection);
        
        // Determine target height
        let targetHeight;
        
        if (inWater) {
            // Use different height offsets based on whether the character is moving or not
            let baseOffset;
            if (isMoving) {
                // Use regular offset when moving in water
                baseOffset = CHARACTER_WATER_HEIGHT_OFFSET;
            } else {
                // Use deeper offset when stationary in water
                baseOffset = CHARACTER_STATIONARY_WATER_HEIGHT_OFFSET;
            }
            
            // Add bobbing motion in water
            const bobOffset = Math.sin(this.legAnimationTime * CHARACTER_WATER_BOB_FREQUENCY) * CHARACTER_WATER_BOB_AMPLITUDE;
            targetHeight = waterStatus.waterHeight + baseOffset + bobOffset;
        } else {
            // Use height map when not in water
            targetHeight = getHeightAtPosition(this.mesh.position.x, this.mesh.position.z);
        }
        
        // Smoothly interpolate height
        this.mesh.position.y += (targetHeight - this.mesh.position.y) * 0.1;
        
        return isMoving;
    }
}

// Computer-controlled character class
export class ComputerCharacter extends Character {
    constructor(scene) {
        super(scene, false);
        
        // AI settings
        this.targetPot = null;
        this.targetPotTimeout = 0;
        this.maxTargetTime = 10; // Max time to pursue a single pot before switching
        this.pathfindingTimer = 0;
        this.pathfindingInterval = 0.5; // How often to update pathfinding (seconds)
        this.wanderAngle = Math.random() * Math.PI * 2; // Random initial wander angle
        this.wanderChangeTimer = 0;
        this.wanderChangeInterval = 2; // How often to change wander direction (seconds)
        
        // Stuck detection
        this.lastPosition = new THREE.Vector3();
        this.stuckTimer = 0;
        this.stuckThreshold = 3; // Time in seconds to consider character stuck
        this.minMovementThreshold = 0.5; // Minimum distance to consider as movement
        
        // Position memory to avoid going back and forth
        this.recentPositions = [];
        this.maxPositionMemory = 10; // Number of recent positions to remember
        this.positionUpdateInterval = 1; // How often to record position (seconds)
        this.positionUpdateTimer = 0;
        
        // Obstacle avoidance
        this.obstacleAvoidanceAngle = Math.PI * (0.5 + Math.random() * 0.5); // Between 90 and 180 degrees
        this.consecutiveCollisions = 0;
        this.maxConsecutiveCollisions = 3; // After this many collisions, take more drastic action
    }
    
    // Update the computer character AI
    update(delta, goldPots, checkCollision, isInWater, getHeightAtPosition) {
        // Check if character is in water
        const waterStatus = isInWater(this.mesh.position.x, this.mesh.position.z);
        const inWater = waterStatus.inWater;
        
        // Check for water-to-land transition
        if (this.wasInWater && !inWater) {
            // Reset rotation completely when transitioning from water to land
            this.mesh.rotation.set(0, this.lastSwimmingYRotation || 0, 0);
        }
        
        // Store current water state for next frame
        this.wasInWater = inWater;
        
        // Movement speed - slower in water
        const baseSpeed = inWater ? 1.8 : 4.5; // Slightly slower than player
        const moveSpeed = baseSpeed * delta; // Units per second
        
        // Update timers
        this.pathfindingTimer += delta;
        this.wanderChangeTimer += delta;
        this.positionUpdateTimer += delta;
        
        // Update stuck detection
        this.updateStuckDetection(delta);
        
        // Update position memory
        if (this.positionUpdateTimer >= this.positionUpdateInterval) {
            this.positionUpdateTimer = 0;
            this.updatePositionMemory();
        }
        
        // Update target pot timeout if we have a target
        if (this.targetPot && !this.targetPot.collected) {
            this.targetPotTimeout += delta;
            if (this.targetPotTimeout > this.maxTargetTime) {
                // Been chasing this pot too long, find a new one
                this.targetPot = null;
                this.targetPotTimeout = 0;
            }
        }
        
        // Find a target pot if we don't have one or need to update
        if (this.pathfindingTimer >= this.pathfindingInterval || !this.targetPot || this.targetPot.collected) {
            this.pathfindingTimer = 0;
            this.findTargetPot(goldPots);
            if (this.targetPot) {
                this.targetPotTimeout = 0; // Reset timeout for new target
            }
        }
        
        // Initialize movement direction
        let moveX = 0;
        let moveZ = 0;
        let isMoving = false;
        
        // If we're stuck, take evasive action
        if (this.isStuck()) {
            // Take more drastic evasive action
            this.wanderAngle = Math.random() * Math.PI * 2; // Completely random new direction
            this.stuckTimer = 0; // Reset stuck timer
            
            // Move in the new random direction
            moveX = Math.sin(this.wanderAngle) * moveSpeed * 1.5; // Move faster to escape
            moveZ = Math.cos(this.wanderAngle) * moveSpeed * 1.5;
            isMoving = true;
        }
        // If we have a target pot, move towards it
        else if (this.targetPot && !this.targetPot.collected) {
            // Calculate direction to target
            const dirX = this.targetPot.position.x - this.mesh.position.x;
            const dirZ = this.targetPot.position.z - this.mesh.position.z;
            
            // Normalize direction
            const length = Math.sqrt(dirX * dirX + dirZ * dirZ);
            
            if (length > 0) {
                moveX = (dirX / length) * moveSpeed;
                moveZ = (dirZ / length) * moveSpeed;
                isMoving = true;
            }
        } else {
            // No target pot, wander around
            if (this.wanderChangeTimer >= this.wanderChangeInterval) {
                this.wanderChangeTimer = 0;
                this.wanderAngle += (Math.random() - 0.5) * Math.PI; // Change direction randomly
            }
            
            // Move in the wander direction
            moveX = Math.sin(this.wanderAngle) * moveSpeed;
            moveZ = Math.cos(this.wanderAngle) * moveSpeed;
            isMoving = true;
        }
        
        // If moving, update position and rotation
        if (isMoving) {
            // Calculate new position
            const newX = this.mesh.position.x + moveX;
            const newZ = this.mesh.position.z + moveZ;
            
            // Check if the new position is too close to a recent position (to avoid loops)
            const isTooCloseToRecent = this.isTooCloseToRecentPositions(newX, newZ);
            
            // Check for boundary - limit to the area with baths (-50 to 50 in x and z)
            const boundaryLimit = 50;
            const isWithinBoundary = 
                newX >= -boundaryLimit && 
                newX <= boundaryLimit && 
                newZ >= -boundaryLimit && 
                newZ <= boundaryLimit;
            
            // Check for collisions before moving
            if (!checkCollision(newX, newZ) && !isTooCloseToRecent && isWithinBoundary) {
                // Update character position
                this.mesh.position.x = newX;
                this.mesh.position.z = newZ;
                
                // If not in water, rotate the character to face the direction of travel
                if (!inWater && (moveX !== 0 || moveZ !== 0)) {
                    // Calculate the target rotation based on movement direction
                    // In THREE.js, rotation.y is the rotation around the Y axis (vertical axis)
                    // A rotation of 0 means facing negative Z (north in our game)
                    // We need to calculate the angle between the movement vector and the negative Z axis
                    
                    // Calculate the target rotation based on movement direction
                    const targetRotationY = Math.atan2(moveX, moveZ);
                    
                    // Apply the rotation directly to the mesh
                    this.mesh.rotation.y = targetRotationY;
                    
                    // Skip the normal animation update to prevent it from overriding our rotation
                    // Instead, manually update the limbs for walking animation
                    const legSwing = Math.sin(this.legAnimationTime) * 0.3;
                    this.leftLeg.rotation.x = legSwing;
                    this.rightLeg.rotation.x = -legSwing;
                    this.leftLeg.rotation.z = 0;
                    this.rightLeg.rotation.z = 0;
                    this.leftArm.rotation.x = 0;
                    this.rightArm.rotation.x = 0;
                    this.leftArm.rotation.z = Math.PI / 6; // Default angle
                    this.rightArm.rotation.z = -Math.PI / 6; // Default angle
                    this.head.rotation.x = 0;
                    
                    // Debug log to check rotation values
                    console.log(`Computer rotation: ${this.mesh.rotation.y.toFixed(2)}, moveX: ${moveX.toFixed(2)}, moveZ: ${moveZ.toFixed(2)}`);
                }
                
                // Reset consecutive collisions counter
                this.consecutiveCollisions = 0;
            } else {
                // Hit an obstacle or would go back to a recent position
                this.consecutiveCollisions++;
                
                // Change direction more drastically if we've had multiple collisions
                if (this.consecutiveCollisions >= this.maxConsecutiveCollisions) {
                    // After several collisions, make a big change
                    this.wanderAngle = Math.random() * Math.PI * 2; // Completely random new direction
                    this.consecutiveCollisions = 0; // Reset counter
                } else {
                    // Normal collision, turn by a variable amount
                    const turnAmount = this.obstacleAvoidanceAngle + (Math.random() - 0.5) * Math.PI * 0.5;
                    this.wanderAngle += turnAmount;
                }
                
                // If we have a target pot and keep hitting obstacles, maybe it's unreachable
                if (this.targetPot && this.consecutiveCollisions > this.maxConsecutiveCollisions / 2) {
                    this.targetPot = null; // Give up on this pot
                }
            }
        }
        
        // Always update animation - this ensures swimming animation plays even when not moving
        // Make sure animation is more noticeable by increasing the intensity
        const animationDirection = { x: moveX, z: moveZ };
        if (inWater) {
            // Increase animation intensity for swimming to make it more visible
            this.legAnimationTime += delta * 2; // Additional animation time boost for swimming
        }
        this.updateAnimation(delta, isMoving, inWater, animationDirection);
        
        // Determine target height
        let targetHeight;
        
        if (inWater) {
            // Use different height offsets based on whether the character is moving or not
            let baseOffset;
            if (isMoving) {
                // Use regular offset when moving in water
                baseOffset = CHARACTER_WATER_HEIGHT_OFFSET;
            } else {
                // Use deeper offset when stationary in water
                baseOffset = CHARACTER_STATIONARY_WATER_HEIGHT_OFFSET;
            }
            
            // Add bobbing motion in water
            const bobOffset = Math.sin(this.legAnimationTime * CHARACTER_WATER_BOB_FREQUENCY) * CHARACTER_WATER_BOB_AMPLITUDE;
            targetHeight = waterStatus.waterHeight + baseOffset + bobOffset;
        } else {
            // Use height map when not in water
            targetHeight = getHeightAtPosition(this.mesh.position.x, this.mesh.position.z);
        }
        
        // Smoothly interpolate height
        this.mesh.position.y += (targetHeight - this.mesh.position.y) * 0.1;
        
        return isMoving;
    }
    
    // Check if the character is stuck
    isStuck() {
        return this.stuckTimer > this.stuckThreshold;
    }
    
    // Update stuck detection
    updateStuckDetection(delta) {
        if (!this.lastPosition.equals(this.mesh.position)) {
            // Calculate distance moved
            const distance = this.lastPosition.distanceTo(this.mesh.position);
            
            // If we've moved a significant distance, reset the stuck timer
            if (distance > this.minMovementThreshold) {
                this.stuckTimer = 0;
            } else {
                // We've moved, but not enough to consider it significant
                this.stuckTimer += delta;
            }
            
            // Update last position
            this.lastPosition.copy(this.mesh.position);
        } else {
            // We haven't moved at all
            this.stuckTimer += delta;
        }
    }
    
    // Update position memory
    updatePositionMemory() {
        // Add current position to memory
        this.recentPositions.push(new THREE.Vector3().copy(this.mesh.position));
        
        // Keep only the most recent positions
        if (this.recentPositions.length > this.maxPositionMemory) {
            this.recentPositions.shift(); // Remove oldest position
        }
    }
    
    // Check if a position is too close to recent positions
    isTooCloseToRecentPositions(x, z) {
        // Skip the most recent position (which is our current position)
        for (let i = 0; i < this.recentPositions.length - 1; i++) {
            const pos = this.recentPositions[i];
            const dx = x - pos.x;
            const dz = z - pos.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            // If we're too close to a position we've been in recently, avoid it
            if (distance < this.minMovementThreshold) {
                return true;
            }
        }
        
        return false;
    }
    
    // Find the closest uncollected pot
    findTargetPot(goldPots) {
        let closestPot = null;
        let closestDistance = Infinity;
        
        // Find the closest uncollected pot
        for (const pot of goldPots) {
            if (!pot.collected) {
                const dx = pot.position.x - this.mesh.position.x;
                const dz = pot.position.z - this.mesh.position.z;
                const distance = Math.sqrt(dx * dx + dz * dz);
                
                // Add some randomness to pot selection to avoid multiple characters targeting the same pot
                const randomFactor = Math.random() * 0.3 + 0.85; // 0.85 to 1.15
                const adjustedDistance = distance * randomFactor;
                
                if (adjustedDistance < closestDistance) {
                    closestDistance = adjustedDistance;
                    closestPot = pot;
                }
            }
        }
        
        this.targetPot = closestPot;
    }
    
    // Check for gold pot collection
    checkPotCollection(goldPots, collectionRadius, onCollect) {
        // Check each pot
        for (const pot of goldPots) {
            if (!pot.collected) {
                const dx = pot.position.x - this.mesh.position.x;
                const dz = pot.position.z - this.mesh.position.z;
                const distance = Math.sqrt(dx * dx + dz * dz);
                
                // Check if computer is close enough to collect
                if (distance < collectionRadius) {
                    pot.collect();
                    onCollect(); // Callback for scoring
                    
                    // Clear target pot if it was collected
                    if (this.targetPot === pot) {
                        this.targetPot = null;
                    }
                    
                    return true;
                }
            }
        }
        
        return false;
    }
}
