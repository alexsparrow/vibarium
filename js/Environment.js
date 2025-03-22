import * as THREE from 'three';
import { Water } from 'three/addons/objects/Water.js';
import { LevelLoader } from './LevelLoader.js';
import { TextureGenerator } from './TextureGenerator.js';

// Class to handle environment creation and management
export class Environment {
    constructor(scene, loadingManager) {
        this.scene = scene;
        this.loadingManager = loadingManager || new THREE.LoadingManager();
        this.collisionObjects = [];
        this.heightAreas = [];
        this.torchPositions = [];
        this.waters = [];
        this.steamParticles = [];
        this.flames = [];
        this.levelLoader = new LevelLoader();
        this.levelDataLoaded = false;
    }
    
    // Initialize the environment
    async initialize() {
        try {
            // Load level data
            await this.levelLoader.loadLevelData('data/level.json');
            this.levelDataLoaded = true;
            
            // Add skybox
            this.addSkybox();
            
            // Set up lighting
            this.setupLights();
            
            // Create the Roman baths model
            this.createBathsModel();
            
            // Load height areas from level data
            this.heightAreas = this.levelLoader.getHeightAreas();
            
            return true;
        } catch (error) {
            console.error("Failed to initialize environment:", error);
            return false;
        }
    }
    
    // Add a skybox to the scene
    addSkybox() {
        // Create a simple sky gradient instead of using textures
        const skyColor = new THREE.Color(0x87CEEB); // Sky blue
        this.scene.background = skyColor;
        
        // Add a sun sphere
        const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffff80, 
            transparent: true,
            opacity: 0.8
        });
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        sun.position.set(50, 100, -50); // Position high in the sky
        this.scene.add(sun);
        
        // Add a subtle glow effect around the sun
        const sunLightGeometry = new THREE.SphereGeometry(8, 32, 32);
        const sunLightMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffcc, 
            transparent: true,
            opacity: 0.3
        });
        const sunLight = new THREE.Mesh(sunLightGeometry, sunLightMaterial);
        sunLight.position.copy(sun.position);
        this.scene.add(sunLight);
    }
    
    // Set up scene lighting
    setupLights() {
        // Ambient light for general illumination
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(ambientLight);
        
        // Directional light to simulate sunlight
        const sunLight = new THREE.DirectionalLight(0xffd580, 1); // Warmer light color
        sunLight.position.set(50, 50, 50);
        sunLight.castShadow = true;
        
        // Adjust shadow properties for better quality
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.near = 0.5;
        sunLight.shadow.camera.far = 500;
        sunLight.shadow.camera.left = -50;
        sunLight.shadow.camera.right = 50;
        sunLight.shadow.camera.top = 50;
        sunLight.shadow.camera.bottom = -50;
        
        this.scene.add(sunLight);
    }
    
    // Create the Roman baths model
    createBathsModel() {
        // Create textured ground
        const groundSize = 150;
        const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
        
        // Create procedurally generated stone material for ground
        const groundMaterial = TextureGenerator.createStoneMaterial({
            stoneType: 'cobblestone',
            baseColor: { r: 180, g: 180, b: 180 },
            darkColor: { r: 120, g: 120, b: 120 },
            lightColor: { r: 210, g: 210, b: 210 },
            roughness: 0.8,
            bumpiness: 0.5,
            crackDensity: 0.2,
            tileScale: 15 // Large scale to cover the ground
        });
        
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Add boundary walls to indicate play area limits
        this.createBoundaryWalls();
        
        // Create baths from level data
        this.createBathsFromLevelData();
        
        // Create walkways from level data
        this.createWalkwaysFromLevelData();
        
        // Add torches from level data
        this.createTorchesFromLevelData();
        
        // Create decorative elements from level data
        this.createDecorativeElementsFromLevelData();
    }
    
    // Create baths from level data
    createBathsFromLevelData() {
        const baths = this.levelLoader.getBaths();
        
        baths.forEach(bath => {
            this.createBathStructure(bath);
            
            // Create stairs for this bath if defined
            if (bath.stairs) {
                const stairs = bath.stairs;
                this.createSteps(
                    { x: (stairs.x1 + stairs.x2) / 2, y: 0, z: (stairs.z1 + stairs.z2) / 2 },
                    Math.abs(stairs.x2 - stairs.x1), // width
                    Math.ceil(stairs.height / 0.5), // number of steps (height / step height)
                    stairs.z1 < stairs.z2 ? 0 : Math.PI // rotation based on direction
                );
            }
            
            // Create platform for elevated bath if defined
            if (bath.platform) {
                const platformGeometry = new THREE.BoxGeometry(
                    bath.platform.width, 
                    bath.platform.height, 
                    bath.platform.length
                );
                
                // Create procedurally generated stone material for platform
                const platformMaterial = TextureGenerator.createStoneMaterial({
                    stoneType: 'marble',
                    baseColor: { r: 235, g: 235, b: 235 },
                    darkColor: { r: 190, g: 190, b: 190 },
                    lightColor: { r: 250, g: 250, b: 250 },
                    roughness: 0.3,
                    bumpiness: 0.15,
                    marbling: 0.2,
                    crackDensity: 0.1
                });
                
                const platform = new THREE.Mesh(platformGeometry, platformMaterial);
                platform.position.set(
                    bath.position.x, 
                    bath.platform.height / 2, 
                    bath.position.z
                );
                platform.castShadow = true;
                platform.receiveShadow = true;
                this.scene.add(platform);
            }
        });
    }
    
    // Create walkways from level data
    createWalkwaysFromLevelData() {
        const walkways = this.levelLoader.getWalkways();
        
        // Create procedurally generated stone material for walkways
        const walkwayMaterial = TextureGenerator.createStoneMaterial({
            stoneType: 'limestone',
            baseColor: { r: 225, g: 225, b: 225 },
            darkColor: { r: 180, g: 180, b: 180 },
            lightColor: { r: 245, g: 245, b: 245 },
            roughness: 0.4,
            bumpiness: 0.2,
            crackDensity: 0.15
        });
        
        walkways.forEach(walkway => {
            // Create walkway
            const walkwayGeometry = new THREE.BoxGeometry(
                walkway.dimensions.width, 
                walkway.dimensions.height, 
                walkway.dimensions.length
            );
            
            const walkwayMesh = new THREE.Mesh(walkwayGeometry, walkwayMaterial);
            walkwayMesh.position.set(
                walkway.position.x, 
                walkway.position.y, 
                walkway.position.z
            );
            walkwayMesh.rotation.y = walkway.rotation;
            walkwayMesh.receiveShadow = true;
            this.scene.add(walkwayMesh);
            
            // Add railings
            this.addRailings(
                [walkway.position.x, walkway.position.y + 0.5, walkway.position.z],
                [walkway.dimensions.width, 1, 0.2],
                walkway.rotation
            );
        });
    }
    
    // Create torches from level data
    createTorchesFromLevelData() {
        const torches = this.levelLoader.getTorches();
        
        torches.forEach(torch => {
            this.createTorch([torch.position.x, torch.position.y, torch.position.z]);
            
            // Add torch position to collision objects
            this.collisionObjects.push({
                x: torch.position.x,
                z: torch.position.z,
                radius: 0.5 // Collision radius
            });
        });
    }
    
    // Create decorative elements from level data
    createDecorativeElementsFromLevelData() {
        // Create decorative pots
        this.createDecorativePotsFromLevelData();
        
        // Create statues
        this.createStatuesFromLevelData();
    }
    
    // Create decorative pots from level data
    createDecorativePotsFromLevelData() {
        const decorativePots = this.levelLoader.getDecorativePots();
        const potTypes = this.levelLoader.getPotTypes();
        
        // Create procedurally generated terracotta material for pots
        const terracottaMaterial = TextureGenerator.createStoneMaterial({
            stoneType: 'terracotta',
            baseColor: { r: 195, g: 90, b: 56 },
            darkColor: { r: 150, g: 70, b: 40 },
            lightColor: { r: 220, g: 120, b: 80 },
            roughness: 0.8,
            bumpiness: 0.4,
            crackDensity: 0.3
        });
        
        decorativePots.forEach(pot => {
            const potType = potTypes.find(type => type.id === pot.type);
            
            if (potType) {
                // Create pot body
                const bodyGeometry = new THREE.CylinderGeometry(
                    potType.dimensions.bodyRadius.top,
                    potType.dimensions.bodyRadius.bottom,
                    potType.dimensions.bodyRadius.height,
                    16
                );
                
                const body = new THREE.Mesh(bodyGeometry, terracottaMaterial);
                body.position.set(
                    pot.position.x, 
                    pot.position.y + potType.offsets.body, 
                    pot.position.z
                );
                body.castShadow = true;
                body.receiveShadow = true;
                this.scene.add(body);
                
                // Create pot neck
                const neckGeometry = new THREE.CylinderGeometry(
                    potType.dimensions.neckRadius.top,
                    potType.dimensions.neckRadius.bottom,
                    potType.dimensions.neckRadius.height,
                    16
                );
                
                const neck = new THREE.Mesh(neckGeometry, terracottaMaterial);
                neck.position.set(
                    pot.position.x, 
                    pot.position.y + potType.offsets.neck, 
                    pot.position.z
                );
                neck.castShadow = true;
                neck.receiveShadow = true;
                this.scene.add(neck);
                
                // Create pot rim
                const rimGeometry = new THREE.CylinderGeometry(
                    potType.dimensions.rimRadius.top,
                    potType.dimensions.rimRadius.bottom,
                    potType.dimensions.rimRadius.height,
                    16
                );
                
                const rim = new THREE.Mesh(rimGeometry, terracottaMaterial);
                rim.position.set(
                    pot.position.x, 
                    pot.position.y + potType.offsets.rim, 
                    pot.position.z
                );
                rim.castShadow = true;
                rim.receiveShadow = true;
                this.scene.add(rim);
                
                // Add some random rotation for variety
                const rotation = Math.random() * Math.PI * 2;
                body.rotation.y = rotation;
                neck.rotation.y = rotation;
                rim.rotation.y = rotation;
                
                // Add pot as collision object
                this.collisionObjects.push({
                    x: pot.position.x,
                    z: pot.position.z,
                    radius: potType.collisionRadius
                });
            }
        });
    }
    
    // Create statues from level data
    createStatuesFromLevelData() {
        const statues = this.levelLoader.getStatues();
        
        // Create procedurally generated stone material for statues
        const statueMaterial = TextureGenerator.createStoneMaterial({
            stoneType: 'marble',
            baseColor: { r: 245, g: 245, b: 245 },
            darkColor: { r: 200, g: 200, b: 200 },
            lightColor: { r: 255, g: 255, b: 255 },
            roughness: 0.2,
            bumpiness: 0.1,
            marbling: 0.05,
            crackDensity: 0.02
        });
        
        statues.forEach(statue => {
            // Create statue base
            const baseGeometry = new THREE.BoxGeometry(1.5, 0.5, 1.5);
            const base = new THREE.Mesh(baseGeometry, statueMaterial);
            base.position.set(
                statue.position.x, 
                statue.position.y + 0.25, 
                statue.position.z
            );
            base.castShadow = true;
            base.receiveShadow = true;
            this.scene.add(base);
            
            // Create statue body
            const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
            const body = new THREE.Mesh(bodyGeometry, statueMaterial);
            body.position.set(
                statue.position.x, 
                statue.position.y + 2, 
                statue.position.z
            );
            body.castShadow = true;
            body.receiveShadow = true;
            this.scene.add(body);
            
            // Create statue head
            const headGeometry = new THREE.SphereGeometry(0.5, 16, 16);
            const head = new THREE.Mesh(headGeometry, statueMaterial);
            head.position.set(
                statue.position.x, 
                statue.position.y + 3.75, 
                statue.position.z
            );
            head.castShadow = true;
            head.receiveShadow = true;
            this.scene.add(head);
            
            // Add statue as collision object
            this.collisionObjects.push({
                x: statue.position.x,
                z: statue.position.z,
                radius: 0.8 // Collision radius for the statue
            });
        });
    }
    
    // Add railings to walkways
    addRailings(position, size, rotation) {
        // Create procedurally generated stone material for railings
        const railingMaterial = TextureGenerator.createStoneMaterial({
            stoneType: 'marble',
            baseColor: { r: 235, g: 235, b: 235 },
            darkColor: { r: 190, g: 190, b: 190 },
            lightColor: { r: 250, g: 250, b: 250 },
            roughness: 0.3,
            bumpiness: 0.1,
            marbling: 0.05,
            crackDensity: 0.05
        });
        
        // Create two railings for each walkway
        const railing1Geometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
        const railing1 = new THREE.Mesh(railing1Geometry, railingMaterial);
        railing1.position.set(position[0], position[1], position[2] + 2);
        railing1.rotation.y = rotation;
        railing1.castShadow = true;
        this.scene.add(railing1);
        
        const railing2Geometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
        const railing2 = new THREE.Mesh(railing2Geometry, railingMaterial);
        railing2.position.set(position[0], position[1], position[2] - 2);
        railing2.rotation.y = rotation;
        railing2.castShadow = true;
        this.scene.add(railing2);
    }
    
    // Create steps for a staircase
    createSteps(position, width, numSteps, rotation) {
        // Create procedurally generated stone material for steps
        const stepMaterial = TextureGenerator.createStoneMaterial({
            stoneType: 'limestone',
            baseColor: { r: 220, g: 220, b: 220 },
            darkColor: { r: 170, g: 170, b: 170 },
            lightColor: { r: 240, g: 240, b: 240 },
            roughness: 0.5,
            bumpiness: 0.3,
            crackDensity: 0.1
        });
        
        const stepGroup = new THREE.Group();
        
        // Create steps
        for (let i = 0; i < numSteps; i++) {
            const stepWidth = width;
            const stepDepth = 1;
            const stepHeight = 0.5;
            
            const stepGeometry = new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth);
            const step = new THREE.Mesh(stepGeometry, stepMaterial);
            
            // Position steps
            const offset = (i + 1) * stepDepth / 2;
            step.position.set(0, i * stepHeight, offset);
            step.castShadow = true;
            step.receiveShadow = true;
            
            stepGroup.add(step);
        }
        
        // Position and rotate the entire staircase
        stepGroup.position.set(position.x, position.y, position.z);
        stepGroup.rotation.y = rotation;
        
        this.scene.add(stepGroup);
    }
    
    // Create a decorative column
    createColumn(x, y, z) {
        // Create procedurally generated stone material for columns
        const columnMaterial = TextureGenerator.createStoneMaterial({
            stoneType: 'marble',
            baseColor: { r: 240, g: 240, b: 240 },
            darkColor: { r: 190, g: 190, b: 190 },
            lightColor: { r: 255, g: 255, b: 255 },
            roughness: 0.3,
            bumpiness: 0.15,
            marbling: 0.1,
            crackDensity: 0.05
        });
        
        // Create column
        const columnGeometry = new THREE.CylinderGeometry(0.5, 0.5, 6, 16);
        const column = new THREE.Mesh(columnGeometry, columnMaterial);
        column.position.set(x, y + 3, z);
        column.castShadow = true;
        column.receiveShadow = true;
        this.scene.add(column);
        
        // Add column capital (top decoration)
        const capitalGeometry = new THREE.BoxGeometry(1.5, 0.5, 1.5);
        const capital = new THREE.Mesh(capitalGeometry, columnMaterial);
        capital.position.set(x, y + 6.25, z);
        capital.castShadow = true;
        capital.receiveShadow = true;
        this.scene.add(capital);
        
        // Add column base
        const baseGeometry = new THREE.BoxGeometry(1.5, 0.5, 1.5);
        const base = new THREE.Mesh(baseGeometry, columnMaterial);
        base.position.set(x, y + 0.25, z);
        base.castShadow = true;
        base.receiveShadow = true;
        this.scene.add(base);
        
        // Add column as collision object
        this.collisionObjects.push({
            x: x,
            z: z,
            radius: 0.7 // Slightly larger than the column radius for better collision
        });
        
        return column;
    }
    
    // Create boundary walls to indicate play area limits
    createBoundaryWalls() {
        // Create a material for the boundary walls
        const boundaryMaterial = TextureGenerator.createStoneMaterial({
            stoneType: 'marble',
            baseColor: { r: 200, g: 200, b: 200 },
            darkColor: { r: 150, g: 150, b: 150 },
            lightColor: { r: 220, g: 220, b: 220 },
            roughness: 0.5,
            bumpiness: 0.3,
            crackDensity: 0.1
        });
        
        // Define the boundary size
        const boundarySize = 50;
        const wallHeight = 10; // Increased wall height from 5 to 10
        const wallThickness = 2;
        
        // Create the four boundary walls
        
        // North wall (positive z)
        const northWallGeometry = new THREE.BoxGeometry(boundarySize * 2, wallHeight, wallThickness);
        const northWall = new THREE.Mesh(northWallGeometry, boundaryMaterial);
        northWall.position.set(0, wallHeight / 2, boundarySize);
        northWall.castShadow = true;
        northWall.receiveShadow = true;
        this.scene.add(northWall);
        
        // South wall (negative z)
        const southWallGeometry = new THREE.BoxGeometry(boundarySize * 2, wallHeight, wallThickness);
        const southWall = new THREE.Mesh(southWallGeometry, boundaryMaterial);
        southWall.position.set(0, wallHeight / 2, -boundarySize);
        southWall.castShadow = true;
        southWall.receiveShadow = true;
        this.scene.add(southWall);
        
        // East wall (positive x)
        const eastWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, boundarySize * 2);
        const eastWall = new THREE.Mesh(eastWallGeometry, boundaryMaterial);
        eastWall.position.set(boundarySize, wallHeight / 2, 0);
        eastWall.castShadow = true;
        eastWall.receiveShadow = true;
        this.scene.add(eastWall);
        
        // West wall (negative x)
        const westWallGeometry = new THREE.BoxGeometry(wallThickness, wallHeight, boundarySize * 2);
        const westWall = new THREE.Mesh(westWallGeometry, boundaryMaterial);
        westWall.position.set(-boundarySize, wallHeight / 2, 0);
        westWall.castShadow = true;
        westWall.receiveShadow = true;
        this.scene.add(westWall);
        
        // Add walls to collision objects
        this.collisionObjects.push(
            // North wall
            { x: 0, z: boundarySize, radius: wallThickness / 2 },
            // South wall
            { x: 0, z: -boundarySize, radius: wallThickness / 2 },
            // East wall
            { x: boundarySize, z: 0, radius: wallThickness / 2 },
            // West wall
            { x: -boundarySize, z: 0, radius: wallThickness / 2 }
        );
        
        // Add advertising boards to the walls
        this.loadAdvertisements().then(advertisementsMap => {
            // Create advertising boards for each wall with position keys
            const northPositions = ['north1', 'north2'];
            const southPositions = ['south1', 'south2'];
            const eastPositions = ['east1', 'east2'];
            const westPositions = ['west1', 'west2'];
            
            // Create advertising boards for each wall
            this.createAdvertisingBoards(northWall, northPositions, 'north', advertisementsMap);
            this.createAdvertisingBoards(southWall, southPositions, 'south', advertisementsMap);
            this.createAdvertisingBoards(eastWall, eastPositions, 'east', advertisementsMap);
            this.createAdvertisingBoards(westWall, westPositions, 'west', advertisementsMap);
        }).catch(error => {
            console.error("Failed to load advertisements:", error);
        });
    }
    
    // Load advertisements from JSON file and convert to a map by position
    async loadAdvertisements() {
        try {
            const response = await fetch('data/advertisements.json');
            const data = await response.json();
            
            // Convert array to map indexed by position
            const advertisementsMap = {};
            data.advertisements.forEach(ad => {
                advertisementsMap[ad.position] = ad;
            });
            
            return advertisementsMap;
        } catch (error) {
            console.error("Error loading advertisements:", error);
            return {};
        }
    }
    
    // Create advertising boards on a wall
    createAdvertisingBoards(wall, positionKeys, wallSide, advertisementsMap) {
        if (!positionKeys || positionKeys.length === 0) {
            return;
        }
        
        // Create a material for the advertising board frame
        const frameMaterial = TextureGenerator.createWoodMaterial({
            baseColor: { r: 139, g: 69, b: 19 },
            darkColor: { r: 100, g: 50, b: 10 },
            lightColor: { r: 160, g: 90, b: 30 },
            roughness: 0.8,
            bumpiness: 0.5,
            grainSize: 0.2
        });
        
        // Create a default material for the advertisement
        const defaultAdMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xf5deb3,
            side: THREE.DoubleSide
        });
        
        // Board dimensions
        const boardWidth = 15;
        const boardHeight = 7;
        const boardDepth = 0.5;
        const frameThickness = 0.5;
        
        // Spacing between boards
        const spacing = 25;
        
        // Position offset based on wall side and rotation to face inward
        let xOffset = 0;
        let zOffset = 0;
        let rotation = 0;
        
        switch (wallSide) {
            case 'north':
                zOffset = -1.5; // Slightly in front of the wall (towards inside)
                rotation = Math.PI; // Rotate to face inside (south)
                break;
            case 'south':
                zOffset = 1.5; // Slightly in front of the wall (towards inside)
                rotation = 0; // Rotate to face inside (north)
                break;
            case 'east':
                xOffset = -1.5; // Slightly in front of the wall (towards inside)
                rotation = -Math.PI / 2; // Rotate to face inside (west)
                break;
            case 'west':
                xOffset = 1.5; // Slightly in front of the wall (towards inside)
                rotation = Math.PI / 2; // Rotate to face inside (east)
                break;
        }
        
        // Create boards for each position key
        positionKeys.forEach((positionKey, index) => {
            // Get advertisement for this position if it exists
            const ad = advertisementsMap[positionKey];
            
            // Calculate position
            let x = 0;
            let z = 0;
            
            if (wallSide === 'north' || wallSide === 'south') {
                // For north and south walls, vary the x position
                x = -spacing + index * spacing;
            } else {
                // For east and west walls, vary the z position
                z = -spacing + index * spacing;
            }
            
            // Create board frame
            const frameGeometry = new THREE.BoxGeometry(
                boardWidth + frameThickness * 2, 
                boardHeight + frameThickness * 2, 
                boardDepth
            );
            const frame = new THREE.Mesh(frameGeometry, frameMaterial);
            
            // Create advertisement board
            const boardGeometry = new THREE.PlaneGeometry(boardWidth, boardHeight);
            const board = new THREE.Mesh(boardGeometry, defaultAdMaterial);
            
            // Position the board slightly in front of the frame
            board.position.z = boardDepth / 2 + 0.01;
            
            // Create a group for the board and frame
            const boardGroup = new THREE.Group();
            boardGroup.add(frame);
            boardGroup.add(board);
            
            // Position and rotate the board group
            const wallPosition = wall.position.clone();
            boardGroup.position.set(
                wallPosition.x + x + xOffset,
                wallPosition.y, // Center vertically on the wall
                wallPosition.z + z + zOffset
            );
            boardGroup.rotation.y = rotation;
            
            // Add to scene
            this.scene.add(boardGroup);
            
            // If we have an advertisement for this position, load its image
            if (ad) {
                // Try to load the advertisement image
                const textureLoader = new THREE.TextureLoader(this.loadingManager);
                
                // Log the image path for debugging
                console.log(`Loading advertisement image: ${ad.image} for ad ${ad.id} (${ad.name}) at position ${positionKey}`);
                
                // Set up the loading manager to handle errors
                this.loadingManager.onError = (url) => {
                    console.error(`Error loading texture: ${url}`);
                };
                
                textureLoader.load(
                    ad.image,
                    (texture) => {
                        console.log(`Successfully loaded texture for ad ${ad.id}: ${ad.image}`);
                        
                        // Ensure texture is properly configured
                        texture.flipY = true; // Set flipY to true to fix upside-down images
                        texture.needsUpdate = true;
                        
                        // Create material with loaded texture
                        const material = new THREE.MeshBasicMaterial({
                            map: texture,
                            side: THREE.DoubleSide
                        });
                        
                        // Apply the material to the board
                        board.material = material;
                        
                        // Force an update
                        board.material.needsUpdate = true;
                    },
                    // Progress callback
                    (xhr) => {
                        console.log(`${ad.id} texture: ${(xhr.loaded / xhr.total * 100)}% loaded`);
                    },
                    // Error callback
                    (error) => {
                        console.warn(`Failed to load texture for ad ${ad.id} (${ad.name}):`, error);
                        this.createPlaceholderAd(board);
                    }
                );
            } else {
                // No advertisement for this position, create a placeholder
                this.createPlaceholderAd(board);
            }
        });
    }
    
    // Create a placeholder advertisement with "Your ad here" text
    createPlaceholderAd(board) {
        // Create a canvas with "Your ad here" text
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Fill background with a solid color (no patterns)
        ctx.fillStyle = '#f5deb3'; // Wheat color
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add border
        ctx.strokeStyle = '#8b4513'; // SaddleBrown color
        ctx.lineWidth = 10;
        ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
        
        // Add text
        ctx.fillStyle = '#8b4513'; // SaddleBrown color
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle'; // Center text vertically
        ctx.font = 'bold 48px Arial, sans-serif'; // Use a web-safe font
        ctx.fillText("Your ad here", canvas.width / 2, canvas.height / 2);
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        board.material = new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide
        });
        
        // Force an update
        board.material.needsUpdate = true;
    }
    
    // Create a bath structure
    createBathStructure(bath) {
        // Create procedurally generated stone material for the bath
        const bathMaterial = TextureGenerator.createStoneMaterial({
            stoneType: 'marble',
            baseColor: { r: 230, g: 230, b: 230 },
            darkColor: { r: 180, g: 180, b: 180 },
            lightColor: { r: 245, g: 245, b: 245 },
            roughness: 0.4,
            bumpiness: 0.2,
            marbling: 0.3,
            crackDensity: 0.2
        });
        
        // Bath dimensions
        const outerWidth = bath.dimensions.outerWidth;
        const outerLength = bath.dimensions.outerLength;
        const innerWidth = bath.dimensions.innerWidth;
        const innerLength = bath.dimensions.innerLength;
        const wallThickness = (outerWidth - innerWidth) / 2;
        const bathHeight = bath.dimensions.height;
        const bathDepth = bath.dimensions.depth;
        
        // Position
        const posX = bath.position.x;
        const posY = bath.position.y;
        const posZ = bath.position.z;
        
        // Create the bath floor
        const floorGeometry = new THREE.BoxGeometry(outerWidth, 0.5, outerLength);
        const floor = new THREE.Mesh(floorGeometry, bathMaterial);
        floor.position.set(posX, posY + 0.25, posZ); // Half of floor height
        floor.receiveShadow = true;
        this.scene.add(floor);
        
        // Create the bath walls (4 separate walls to create a hollow center)
        
        // Front wall
        const frontWallGeometry = new THREE.BoxGeometry(outerWidth, bathHeight, wallThickness);
        const frontWall = new THREE.Mesh(frontWallGeometry, bathMaterial);
        frontWall.position.set(posX, posY + bathHeight/2 + 0.5, posZ + outerLength/2 - wallThickness/2);
        frontWall.castShadow = true;
        frontWall.receiveShadow = true;
        this.scene.add(frontWall);
        
        // Back wall
        const backWallGeometry = new THREE.BoxGeometry(outerWidth, bathHeight, wallThickness);
        const backWall = new THREE.Mesh(backWallGeometry, bathMaterial);
        backWall.position.set(posX, posY + bathHeight/2 + 0.5, posZ - outerLength/2 + wallThickness/2);
        backWall.castShadow = true;
        backWall.receiveShadow = true;
        this.scene.add(backWall);
        
        // Left wall
        const leftWallGeometry = new THREE.BoxGeometry(wallThickness, bathHeight, outerLength - 2 * wallThickness);
        const leftWall = new THREE.Mesh(leftWallGeometry, bathMaterial);
        leftWall.position.set(posX - outerWidth/2 + wallThickness/2, posY + bathHeight/2 + 0.5, posZ);
        leftWall.castShadow = true;
        leftWall.receiveShadow = true;
        this.scene.add(leftWall);
        
        // Right wall
        const rightWallGeometry = new THREE.BoxGeometry(wallThickness, bathHeight, outerLength - 2 * wallThickness);
        const rightWall = new THREE.Mesh(rightWallGeometry, bathMaterial);
        rightWall.position.set(posX + outerWidth/2 - wallThickness/2, posY + bathHeight/2 + 0.5, posZ);
        rightWall.castShadow = true;
        rightWall.receiveShadow = true;
        this.scene.add(rightWall);
        
        // Create the inner bath floor (bottom of the pool)
        const innerFloorGeometry = new THREE.BoxGeometry(innerWidth, 0.5, innerLength);
        
        // Create procedurally generated stone material for the inner floor
        const innerFloorMaterial = TextureGenerator.createStoneMaterial({
            stoneType: 'sandstone',
            baseColor: { r: 200, g: 200, b: 200 },
            darkColor: { r: 150, g: 150, b: 150 },
            lightColor: { r: 220, g: 220, b: 220 },
            roughness: 0.7,
            bumpiness: 0.1,
            crackDensity: 0.05
        });
        
        const innerFloor = new THREE.Mesh(innerFloorGeometry, innerFloorMaterial);
        innerFloor.position.set(posX, posY + bathHeight - bathDepth + 0.25, posZ); // Position at the bottom of the pool
        innerFloor.receiveShadow = true;
        this.scene.add(innerFloor);
        
        // Add water to this bath
        this.addWaterToBath({
            position: { x: posX, y: posY, z: posZ },
            dimensions: {
                width: innerWidth - 0.2,
                length: innerLength - 0.2,
                waterLevel: bathHeight - 0.2
            },
            waterColor: parseInt(bath.water.color, 16),
            waterTemp: bath.water.temperature
        });
        
        // Add columns if specified
        if (bath.hasColumns) {
            this.addColumnsToBath(posX, posY, posZ, outerWidth, outerLength);
        }
    }
    
    // Add columns to a bath
    addColumnsToBath(posX, posY, posZ, width, length) {
        // Calculate column positions around the bath
        const columnPositions = [
            // Front corners
            [posX - width/2 + 1, posY, posZ + length/2 - 1],
            [posX + width/2 - 1, posY, posZ + length/2 - 1],
            // Back corners
            [posX - width/2 + 1, posY, posZ - length/2 + 1],
            [posX + width/2 - 1, posY, posZ - length/2 + 1],
            // Front midpoints (if bath is wide enough)
            [posX, posY, posZ + length/2 - 1]
        ];
        
        // Add columns at each position
        columnPositions.forEach(position => {
            this.createColumn(position[0], position[1], position[2]);
        });
    }
    
    // Create a torch
    createTorch(position) {
        // Create torch holder
        const holderGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.8, 8);
        const holderMaterial = TextureGenerator.createWoodMaterial({
            baseColor: { r: 139, g: 69, b: 19 },
            darkColor: { r: 100, g: 50, b: 10 },
            lightColor: { r: 160, g: 90, b: 30 },
            roughness: 0.8,
            bumpiness: 0.5,
            grainSize: 0.2
        });
        const holder = new THREE.Mesh(holderGeometry, holderMaterial);
        holder.position.set(position[0], position[1], position[2]);
        this.scene.add(holder);
        
        // Create flame effect
        const flameGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const flameMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff6a00,
            transparent: true,
            opacity: 0.9
        });
        const flame = new THREE.Mesh(flameGeometry, flameMaterial);
        flame.position.set(position[0], position[1] + 0.5, position[2]);
        flame.scale.y = 1.5; // Elongate the flame
        this.scene.add(flame);
        
        // Store the flame for animation
        this.flames.push(flame);
        
        // Add a point light for the torch
        const torchLight = new THREE.PointLight(0xff6a00, 1, 15);
        torchLight.position.set(position[0], position[1] + 0.5, position[2]);
        this.scene.add(torchLight);
    }
    
    // Add water to a bath
    addWaterToBath(config) {
        // Create water surface
        const waterWidth = config.dimensions.width;
        const waterLength = config.dimensions.length;
        const waterLevel = config.position.y + config.dimensions.waterLevel;
        
        const waterGeometry = new THREE.PlaneGeometry(waterWidth, waterLength);
        
        // Water properties
        const water = new Water(waterGeometry, {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader(this.loadingManager).load(
                'https://unpkg.com/three@0.160.0/examples/textures/waternormals.jpg', 
                function(texture) {
                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                    texture.repeat.set(2, 2); // Reduced repeat for gentler texture
                }
            ),
            sunDirection: new THREE.Vector3(0, 1, 0),
            sunColor: 0xffffff,
            waterColor: config.waterColor, // Color based on bath type
            distortionScale: 1.5, // Reduced distortion for gentler ripples
            fog: false,
            alpha: 0.6 // More translucent
        });
        
        water.rotation.x = -Math.PI / 2; // Rotate to be horizontal
        water.position.set(config.position.x, waterLevel, config.position.z); // Position at the water level in the bath
        
        this.scene.add(water);
        
        // Store water for animation
        this.waters.push(water);
        
        // Add steam if it's a hot bath
        if (config.waterTemp === "hot" || config.waterTemp === "warm") {
            this.addSteamToBath(config.position.x, waterLevel, config.position.z, waterWidth, waterLength, config.waterTemp);
        }
    }
    
    // Add steam effect to hot baths
    addSteamToBath(x, y, z, width, length, temp) {
        // Create a more subtle, volumetric-like steam effect
        const particleCount = temp === "hot" ? 200 : 100; // More particles for hot baths
        const particles = new THREE.BufferGeometry();
        
        const positions = [];
        const sizes = [];
        
        // Create random positions for steam particles above the water
        for (let i = 0; i < particleCount; i++) {
            // Random position within the bath area, slightly above the water
            const xPos = x + (Math.random() - 0.5) * width;
            const yPos = y + 0.1 + Math.random() * 1.5; // Start just above water
            const zPos = z + (Math.random() - 0.5) * length;
            
            positions.push(xPos, yPos, zPos);
            sizes.push(Math.random() * 0.8 + 0.2); // Smaller particles (0.2 to 1.0)
        }
        
        particles.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        particles.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
        
        // Load a soft particle texture
        const textureLoader = new THREE.TextureLoader(this.loadingManager);
        const particleTexture = textureLoader.load(
            'https://unpkg.com/three@0.160.0/examples/textures/sprites/circle.png'
        );
        
        // Create a simple point material with low opacity
        const steamMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            map: particleTexture,
            size: 0.5,
            transparent: true,
            opacity: temp === "hot" ? 0.15 : 0.08, // Lower opacity for warm baths
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true,
            depthWrite: false
        });
        
        // Create the particle system
        const steamParticles = new THREE.Points(particles, steamMaterial);
        this.scene.add(steamParticles);
        
        // Store particles for animation
        this.steamParticles.push({
            points: steamParticles,
            initialPositions: [...positions],
            config: { x, y, z, temp }
        });
    }
    
    // Add a height area to the height map
    addHeightArea(x1, z1, x2, z2, height, type = 'flat') {
        this.heightAreas.push({
            x1, z1, x2, z2, height, type
        });
    }
    
    // Get the height at a specific position
    getHeightAtPosition(x, z) {
        // Default ground level
        let height = 0;
        let foundArea = false;
        
        // First check for individual steps (they have higher priority)
        for (const area of this.heightAreas) {
            // Check if position is within this area and it's a flat area (individual step)
            if (area.type === 'flat' && 
                x >= area.x1 && x <= area.x2 && 
                z >= area.z1 && z <= area.z2) {
                // If we find a higher area, use that height
                if (area.height > height) {
                    height = area.height;
                    foundArea = true;
                }
            }
        }
        
        // If we didn't find a specific step, check for stairs areas
        if (!foundArea) {
            for (const area of this.heightAreas) {
                // Check if position is within this area and it's a stairs area
                if (area.type === 'stairs' && 
                    x >= area.x1 && x <= area.x2 && 
                    z >= area.z1 && z <= area.z2) {
                    
                    // Determine if stairs go in x or z direction
                    const stairsWidth = Math.abs(area.x2 - area.x1);
                    const stairsLength = Math.abs(area.z2 - area.z1);
                    const isZDirection = stairsLength > stairsWidth;
                    
                    if (isZDirection) {
                        // Stairs along z-axis
                        // Calculate progress along the stairs (0 to 1)
                        const zMin = Math.min(area.z1, area.z2);
                        const zMax = Math.max(area.z1, area.z2);
                        const progress = (z - zMin) / (zMax - zMin);
                        
                        // Calculate height based on progress
                        height = area.height * progress;
                    } else {
                        // Stairs along x-axis
                        // Calculate progress along the stairs (0 to 1)
                        const xMin = Math.min(area.x1, area.x2);
                        const xMax = Math.max(area.x1, area.x2);
                        const progress = (x - xMin) / (xMax - xMin);
                        
                        // Calculate height based on progress
                        height = area.height * progress;
                    }
                    
                    foundArea = true;
                }
            }
        }
        
        return height;
    }
    
    // Check if a position is in water
    isInWater(x, z) {
        // Get water areas from level data
        const waterAreas = this.levelLoader.getWaterAreas();
        
        // Check if position is inside a bath (water area)
        for (const bath of waterAreas) {
            if (x >= bath.x1 && x <= bath.x2 && z >= bath.z1 && z <= bath.z2) {
                return { inWater: true, waterHeight: bath.height - 0.2 }; // In water, return water height
            }
        }
        
        return { inWater: false, waterHeight: 0 }; // Not in water
    }
    
    // Check if a position collides with any objects
    checkCollision(x, z) {
        // Check collision with columns and other objects
        for (const obj of this.collisionObjects) {
            const dx = x - obj.x;
            const dz = z - obj.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance < obj.radius) {
                return true; // Collision detected
            }
        }
        
        return false; // No collision
    }
    
    // Update animations for environment elements
    update(delta) {
        // Update water animation
        if (this.waters) {
            this.waters.forEach(water => {
                const waterAnimationSpeed = 0.25;
                water.material.uniforms['time'].value += delta * waterAnimationSpeed;
            });
        }
        
        // Animate steam particles - much slower and more subtle movement
        if (this.steamParticles) {
            this.steamParticles.forEach(steamData => {
                const positions = steamData.points.geometry.attributes.position.array;
                const initialPositions = steamData.initialPositions;
                
                for (let i = 0; i < positions.length; i += 3) {
                    // Get initial position
                    const initialX = initialPositions[i];
                    const initialY = initialPositions[i + 1];
                    const initialZ = initialPositions[i + 2];
                    
                    // Create very subtle, slow movement
                    const time = Date.now() * 0.0001; // Slow time factor
                    
                    // Gentle wave-like motion
                    positions[i] = initialX + Math.sin(time + i * 0.1) * 0.05; // Subtle x movement
                    positions[i + 1] = initialY + Math.sin(time * 0.2 + i * 0.05) * 0.03 + time * 0.01; // Very slow rising
                    positions[i + 2] = initialZ + Math.cos(time + i * 0.1) * 0.05; // Subtle z movement
                    
                    // Reset particles that have risen too high (very slowly)
                    if (positions[i + 1] > initialY + 1.5) {
                        // Reset to slightly below the initial position
                        positions[i + 1] = initialY - 0.2;
                        // Update the initial position in the array
                        initialPositions[i + 1] = positions[i + 1];
                    }
                }
                
                steamData.points.geometry.attributes.position.needsUpdate = true;
            });
        }
        
        // Animate torch flames
        if (this.flames) {
            this.flames.forEach(flame => {
                // Random flickering effect - scaled by delta time
                const flickerAmount = 0.05 * delta * 60; // Scale the flicker amount by delta
                const flicker = 0.95 + Math.random() * flickerAmount;
                flame.scale.set(flicker, 1.5 * flicker, flicker);
                
                // Random rotation - scaled by delta time
                flame.rotation.y += 0.1 * Math.random() * delta * 60;
            });
        }
    }
}
