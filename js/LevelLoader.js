// Class to handle loading level data from JSON
export class LevelLoader {
    constructor() {
        this.levelData = null;
    }
    
    // Load level data from JSON file
    async loadLevelData(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`Failed to load level data: ${response.status} ${response.statusText}`);
            }
            this.levelData = await response.json();
            console.log("Level data loaded successfully");
            return this.levelData;
        } catch (error) {
            console.error("Error loading level data:", error);
            throw error;
        }
    }
    
    // Get all baths from the level data
    getBaths() {
        return this.levelData?.baths || [];
    }
    
    // Get a specific bath by name
    getBathByName(name) {
        return this.levelData?.baths.find(bath => bath.name === name);
    }
    
    // Get all walkways from the level data
    getWalkways() {
        return this.levelData?.walkways || [];
    }
    
    // Get all torches from the level data
    getTorches() {
        return this.levelData?.torches || [];
    }
    
    // Get all decorative pots from the level data
    getDecorativePots() {
        return this.levelData?.decorativePots || [];
    }
    
    // Get all statues from the level data
    getStatues() {
        return this.levelData?.statues || [];
    }
    
    // Get all pot types from the level data
    getPotTypes() {
        return this.levelData?.potTypes || [];
    }
    
    // Get a specific pot type by ID
    getPotTypeById(id) {
        return this.levelData?.potTypes.find(potType => potType.id === id);
    }
    
    // Get all gold pot areas from the level data
    getGoldPotAreas() {
        return this.levelData?.goldPotAreas || [];
    }
    
    // Get all height areas from the level data
    getHeightAreas() {
        const heightAreas = [];
        
        // Add bath height areas
        if (this.levelData?.baths) {
            this.levelData.baths.forEach(bath => {
                if (bath.heightArea) {
                    heightAreas.push(bath.heightArea);
                }
                if (bath.platformArea) {
                    heightAreas.push(bath.platformArea);
                }
                
                // Add bath edges as height areas
                const outerWidth = bath.dimensions.outerWidth;
                const outerLength = bath.dimensions.outerLength;
                const innerWidth = bath.dimensions.innerWidth;
                const innerLength = bath.dimensions.innerLength;
                const wallThickness = (outerWidth - innerWidth) / 2;
                const posX = bath.position.x;
                const posZ = bath.position.z;
                
                // Front wall
                heightAreas.push({
                    x1: posX - outerWidth/2,
                    z1: posZ + outerLength/2 - wallThickness,
                    x2: posX + outerWidth/2,
                    z2: posZ + outerLength/2,
                    height: bath.heightArea ? bath.heightArea.height : bath.dimensions.height,
                    type: 'flat'
                });
                
                // Back wall
                heightAreas.push({
                    x1: posX - outerWidth/2,
                    z1: posZ - outerLength/2,
                    x2: posX + outerWidth/2,
                    z2: posZ - outerLength/2 + wallThickness,
                    height: bath.heightArea ? bath.heightArea.height : bath.dimensions.height,
                    type: 'flat'
                });
                
                // Left wall
                heightAreas.push({
                    x1: posX - outerWidth/2,
                    z1: posZ - outerLength/2 + wallThickness,
                    x2: posX - outerWidth/2 + wallThickness,
                    z2: posZ + outerLength/2 - wallThickness,
                    height: bath.heightArea ? bath.heightArea.height : bath.dimensions.height,
                    type: 'flat'
                });
                
                // Right wall
                heightAreas.push({
                    x1: posX + outerWidth/2 - wallThickness,
                    z1: posZ - outerLength/2 + wallThickness,
                    x2: posX + outerWidth/2,
                    z2: posZ + outerLength/2 - wallThickness,
                    height: bath.heightArea ? bath.heightArea.height : bath.dimensions.height,
                    type: 'flat'
                });
                
                // Add stairs with individual steps
                if (bath.stairs) {
                    // Add the overall stairs area
                    heightAreas.push(bath.stairs);
                    
                    // Calculate step dimensions
                    const stairsWidth = Math.abs(bath.stairs.x2 - bath.stairs.x1);
                    const stairsLength = Math.abs(bath.stairs.z2 - bath.stairs.z1);
                    const stairsHeight = bath.stairs.height;
                    const numSteps = Math.ceil(stairsHeight / 0.5); // 0.5 units per step
                    const stepHeight = stairsHeight / numSteps;
                    
                    // Determine if stairs go in x or z direction
                    const isZDirection = stairsLength > stairsWidth;
                    
                    if (isZDirection) {
                        // Stairs along z-axis
                        const stepLength = stairsLength / numSteps;
                        const zStart = Math.min(bath.stairs.z1, bath.stairs.z2);
                        
                        for (let i = 0; i < numSteps; i++) {
                            heightAreas.push({
                                x1: bath.stairs.x1,
                                z1: zStart + i * stepLength,
                                x2: bath.stairs.x2,
                                z2: zStart + (i + 1) * stepLength,
                                height: (i + 1) * stepHeight,
                                type: 'flat' // Each step is flat
                            });
                        }
                    } else {
                        // Stairs along x-axis
                        const stepWidth = stairsWidth / numSteps;
                        const xStart = Math.min(bath.stairs.x1, bath.stairs.x2);
                        
                        for (let i = 0; i < numSteps; i++) {
                            heightAreas.push({
                                x1: xStart + i * stepWidth,
                                z1: bath.stairs.z1,
                                x2: xStart + (i + 1) * stepWidth,
                                z2: bath.stairs.z2,
                                height: (i + 1) * stepHeight,
                                type: 'flat' // Each step is flat
                            });
                        }
                    }
                }
            });
        }
        
        // Add walkway height areas
        if (this.levelData?.walkways) {
            this.levelData.walkways.forEach(walkway => {
                if (walkway.heightArea) {
                    heightAreas.push(walkway.heightArea);
                }
            });
        }
        
        return heightAreas;
    }
    
    // Get all water areas from the level data
    getWaterAreas() {
        const waterAreas = [];
        
        // Add bath water areas
        if (this.levelData?.baths) {
            this.levelData.baths.forEach(bath => {
                const halfWidth = bath.dimensions.innerWidth / 2;
                const halfLength = bath.dimensions.innerLength / 2;
                
                waterAreas.push({
                    x1: bath.position.x - halfWidth,
                    z1: bath.position.z - halfLength,
                    x2: bath.position.x + halfWidth,
                    z2: bath.position.z + halfLength,
                    height: bath.position.y + bath.dimensions.height,
                    temperature: bath.water.temperature
                });
            });
        }
        
        return waterAreas;
    }
    
    // Get starting position for a specific level
    getStartingPosition(level) {
        const levelMod = level % 5;
        const startingPosition = this.levelData?.startingPositions.find(pos => pos.level === levelMod);
        
        if (startingPosition) {
            return startingPosition.position;
        }
        
        // Default starting position if not found
        return { x: 0, z: 10 };
    }
}
