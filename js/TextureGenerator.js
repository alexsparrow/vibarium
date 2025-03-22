import * as THREE from 'three';

export class TextureGenerator {
    /**
     * Generate a procedural stone texture
     * @param {number} width - Texture width
     * @param {number} height - Texture height
     * @param {Object} options - Texture generation options
     * @returns {THREE.CanvasTexture} - Generated texture
     */
    static generateStoneTexture(width = 512, height = 512, options = {}) {
        // Default options
        const defaults = {
            baseColor: { r: 180, g: 180, b: 180 }, // Base stone color (light gray)
            darkColor: { r: 100, g: 100, b: 100 }, // Dark color for cracks and variations
            lightColor: { r: 220, g: 220, b: 220 }, // Light color for highlights
            noiseScale: 20, // Scale of the noise pattern
            crackDensity: 0.4, // Density of cracks (0-1)
            crackWidth: 0.5, // Width of cracks (0-1)
            roughness: 0.8, // Roughness of the stone surface
            bumpiness: 0.3, // Bumpiness of the stone surface
            marbling: 0.2, // Amount of marbling effect (0-1)
            stoneType: 'granite', // Type of stone: 'granite', 'marble', 'limestone', 'sandstone'
        };

        // Merge provided options with defaults
        const settings = { ...defaults, ...options };

        // Create canvas and get context
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Fill with base color
        ctx.fillStyle = `rgb(${settings.baseColor.r}, ${settings.baseColor.g}, ${settings.baseColor.b})`;
        ctx.fillRect(0, 0, width, height);

        // Apply different stone type patterns
        switch (settings.stoneType) {
            case 'marble':
                this.generateMarblePattern(ctx, width, height, settings);
                break;
            case 'limestone':
                this.generateLimestonePattern(ctx, width, height, settings);
                break;
            case 'sandstone':
                this.generateSandstonePattern(ctx, width, height, settings);
                break;
            case 'granite':
            default:
                this.generateGranitePattern(ctx, width, height, settings);
                break;
        }

        // Add cracks
        this.addCracks(ctx, width, height, settings);

        // Add noise for texture
        this.addNoise(ctx, width, height, settings);

        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        
        return texture;
    }

    /**
     * Generate a normal map from the texture
     * @param {HTMLCanvasElement} sourceCanvas - Source texture canvas
     * @param {number} strength - Normal map strength
     * @returns {THREE.CanvasTexture} - Generated normal map
     */
    static generateNormalMap(sourceCanvas, strength = 1.0) {
        const width = sourceCanvas.width;
        const height = sourceCanvas.height;
        
        // Create canvas for normal map
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Get source image data
        const sourceCtx = sourceCanvas.getContext('2d');
        const sourceData = sourceCtx.getImageData(0, 0, width, height).data;
        
        // Create image data for normal map
        const normalData = ctx.createImageData(width, height);
        
        // Calculate normal map
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                // Get height values from surrounding pixels
                const xp = (x + 1) % width;
                const xm = (x - 1 + width) % width;
                const yp = (y + 1) % height;
                const ym = (y - 1 + height) % height;
                
                // Get brightness values (average of RGB)
                const i = (y * width + x) * 4;
                const ip = (y * width + xp) * 4;
                const im = (y * width + xm) * 4;
                const jp = (yp * width + x) * 4;
                const jm = (ym * width + x) * 4;
                
                const cp = (sourceData[ip] + sourceData[ip + 1] + sourceData[ip + 2]) / 3;
                const cm = (sourceData[im] + sourceData[im + 1] + sourceData[im + 2]) / 3;
                const sp = (sourceData[jp] + sourceData[jp + 1] + sourceData[jp + 2]) / 3;
                const sm = (sourceData[jm] + sourceData[jm + 1] + sourceData[jm + 2]) / 3;
                
                // Calculate normal vector
                const dx = (cp - cm) * strength;
                const dy = (sp - sm) * strength;
                const dz = 1.0;
                
                // Normalize vector
                const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
                const nx = dx / length;
                const ny = dy / length;
                const nz = dz / length;
                
                // Convert to RGB (range 0-255)
                const r = Math.floor((nx * 0.5 + 0.5) * 255);
                const g = Math.floor((ny * 0.5 + 0.5) * 255);
                const b = Math.floor((nz * 0.5 + 0.5) * 255);
                
                // Set pixel in normal map
                normalData.data[i] = r;
                normalData.data[i + 1] = g;
                normalData.data[i + 2] = b;
                normalData.data[i + 3] = 255;
            }
        }
        
        // Put image data to canvas
        ctx.putImageData(normalData, 0, 0);
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        
        return texture;
    }

    /**
     * Generate a roughness map from the texture
     * @param {HTMLCanvasElement} sourceCanvas - Source texture canvas
     * @param {number} baseRoughness - Base roughness value
     * @returns {THREE.CanvasTexture} - Generated roughness map
     */
    static generateRoughnessMap(sourceCanvas, baseRoughness = 0.7) {
        const width = sourceCanvas.width;
        const height = sourceCanvas.height;
        
        // Create canvas for roughness map
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        // Get source image data
        const sourceCtx = sourceCanvas.getContext('2d');
        const sourceData = sourceCtx.getImageData(0, 0, width, height).data;
        
        // Create image data for roughness map
        const roughnessData = ctx.createImageData(width, height);
        
        // Calculate roughness map
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                
                // Get brightness value (average of RGB)
                const brightness = (sourceData[i] + sourceData[i + 1] + sourceData[i + 2]) / 3;
                
                // Calculate roughness value (darker areas are rougher)
                const roughness = baseRoughness + (1 - brightness / 255) * 0.3;
                
                // Convert to grayscale (range 0-255)
                const value = Math.floor(roughness * 255);
                
                // Set pixel in roughness map
                roughnessData.data[i] = value;
                roughnessData.data[i + 1] = value;
                roughnessData.data[i + 2] = value;
                roughnessData.data[i + 3] = 255;
            }
        }
        
        // Put image data to canvas
        ctx.putImageData(roughnessData, 0, 0);
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        
        return texture;
    }

    /**
     * Generate a granite pattern
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @param {Object} settings - Texture settings
     */
    static generateGranitePattern(ctx, width, height, settings) {
        // Add speckles
        const speckleCount = Math.floor(width * height * 0.05);
        for (let i = 0; i < speckleCount; i++) {
            const x = Math.floor(Math.random() * width);
            const y = Math.floor(Math.random() * height);
            const size = Math.random() * 2 + 1;
            const isDark = Math.random() < 0.7;
            
            const color = isDark ? settings.darkColor : settings.lightColor;
            ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.7)`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add larger mineral deposits
        const depositCount = Math.floor(width * height * 0.001);
        for (let i = 0; i < depositCount; i++) {
            const x = Math.floor(Math.random() * width);
            const y = Math.floor(Math.random() * height);
            const size = Math.random() * 5 + 3;
            const isDark = Math.random() < 0.5;
            
            const color = isDark ? settings.darkColor : settings.lightColor;
            ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.5)`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Generate a marble pattern
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @param {Object} settings - Texture settings
     */
    static generateMarblePattern(ctx, width, height, settings) {
        // Create perlin noise for marble veins
        const scale = 0.01;
        const intensity = settings.marbling * 2;
        
        // Create gradient for marble
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                
                // Generate noise value
                const nx = x * scale;
                const ny = y * scale;
                const noise = this.perlinNoise(nx, ny) * intensity;
                
                // Apply sine wave for marble veins
                const vein = Math.abs(Math.sin((x * 0.01 + y * 0.01 + noise) * Math.PI));
                
                // Mix base color with vein color
                const mixFactor = Math.pow(vein, 0.5);
                const r = Math.floor(settings.baseColor.r * (1 - mixFactor) + settings.lightColor.r * mixFactor);
                const g = Math.floor(settings.baseColor.g * (1 - mixFactor) + settings.lightColor.g * mixFactor);
                const b = Math.floor(settings.baseColor.b * (1 - mixFactor) + settings.lightColor.b * mixFactor);
                
                // Set pixel color
                data[i] = r;
                data[i + 1] = g;
                data[i + 2] = b;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Generate a limestone pattern
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @param {Object} settings - Texture settings
     */
    static generateLimestonePattern(ctx, width, height, settings) {
        // Add subtle layers
        const layerCount = Math.floor(height / 20);
        const layerHeight = height / layerCount;
        
        for (let i = 0; i < layerCount; i++) {
            const y = i * layerHeight;
            const brightness = Math.random() * 30 - 15;
            
            // Adjust color based on brightness
            const r = Math.max(0, Math.min(255, settings.baseColor.r + brightness));
            const g = Math.max(0, Math.min(255, settings.baseColor.g + brightness));
            const b = Math.max(0, Math.min(255, settings.baseColor.b + brightness));
            
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
            ctx.fillRect(0, y, width, layerHeight);
        }
        
        // Add small fossils
        const fossilCount = Math.floor(width * height * 0.0002);
        for (let i = 0; i < fossilCount; i++) {
            const x = Math.floor(Math.random() * width);
            const y = Math.floor(Math.random() * height);
            const size = Math.random() * 3 + 1;
            
            ctx.fillStyle = `rgba(${settings.darkColor.r}, ${settings.darkColor.g}, ${settings.darkColor.b}, 0.5)`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Generate a sandstone pattern
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @param {Object} settings - Texture settings
     */
    static generateSandstonePattern(ctx, width, height, settings) {
        // Create sandy texture with layers
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        for (let y = 0; y < height; y++) {
            // Create horizontal layers
            const layerIntensity = Math.sin(y * 0.05) * 15;
            
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                
                // Add noise
                const noise = (Math.random() - 0.5) * 20;
                
                // Calculate color with noise and layers
                const r = Math.max(0, Math.min(255, settings.baseColor.r + noise + layerIntensity));
                const g = Math.max(0, Math.min(255, settings.baseColor.g + noise + layerIntensity));
                const b = Math.max(0, Math.min(255, settings.baseColor.b + noise + layerIntensity));
                
                // Set pixel color
                data[i] = r;
                data[i + 1] = g;
                data[i + 2] = b;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Add small pits
        const pitCount = Math.floor(width * height * 0.001);
        for (let i = 0; i < pitCount; i++) {
            const x = Math.floor(Math.random() * width);
            const y = Math.floor(Math.random() * height);
            const size = Math.random() * 2 + 0.5;
            
            ctx.fillStyle = `rgba(${settings.darkColor.r}, ${settings.darkColor.g}, ${settings.darkColor.b}, 0.3)`;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    /**
     * Add cracks to the texture
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @param {Object} settings - Texture settings
     */
    static addCracks(ctx, width, height, settings) {
        const crackCount = Math.floor(width * height * 0.0001 * settings.crackDensity);
        
        for (let i = 0; i < crackCount; i++) {
            const startX = Math.floor(Math.random() * width);
            const startY = Math.floor(Math.random() * height);
            const length = Math.random() * 100 + 20;
            const segments = Math.floor(length / 10);
            
            ctx.strokeStyle = `rgba(${settings.darkColor.r}, ${settings.darkColor.g}, ${settings.darkColor.b}, 0.7)`;
            ctx.lineWidth = Math.random() * settings.crackWidth + 0.5;
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            
            let x = startX;
            let y = startY;
            let angle = Math.random() * Math.PI * 2;
            
            for (let j = 0; j < segments; j++) {
                // Slightly change direction
                angle += (Math.random() - 0.5) * Math.PI / 4;
                
                // Calculate new point
                const segmentLength = Math.random() * 10 + 5;
                x += Math.cos(angle) * segmentLength;
                y += Math.sin(angle) * segmentLength;
                
                // Ensure point is within bounds
                x = Math.max(0, Math.min(width, x));
                y = Math.max(0, Math.min(height, y));
                
                ctx.lineTo(x, y);
            }
            
            ctx.stroke();
        }
    }

    /**
     * Add noise to the texture
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @param {Object} settings - Texture settings
     */
    static addNoise(ctx, width, height, settings) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * settings.roughness * 30;
            
            data[i] = Math.max(0, Math.min(255, data[i] + noise));
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Simple Perlin noise implementation
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {number} - Noise value (-1 to 1)
     */
    static perlinNoise(x, y) {
        // Simple implementation for demo purposes
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        
        const xf = x - Math.floor(x);
        const yf = y - Math.floor(y);
        
        const u = this.fade(xf);
        const v = this.fade(yf);
        
        const A = this.p[X] + Y;
        const B = this.p[X + 1] + Y;
        
        return this.lerp(v, 
            this.lerp(u, 
                this.grad(this.p[A], xf, yf), 
                this.grad(this.p[B], xf - 1, yf)
            ),
            this.lerp(u, 
                this.grad(this.p[A + 1], xf, yf - 1), 
                this.grad(this.p[B + 1], xf - 1, yf - 1)
            )
        );
    }

    /**
     * Fade function for Perlin noise
     * @param {number} t - Input value
     * @returns {number} - Faded value
     */
    static fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    /**
     * Linear interpolation
     * @param {number} t - Interpolation factor
     * @param {number} a - First value
     * @param {number} b - Second value
     * @returns {number} - Interpolated value
     */
    static lerp(t, a, b) {
        return a + t * (b - a);
    }

    /**
     * Gradient function for Perlin noise
     * @param {number} hash - Hash value
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {number} - Gradient value
     */
    static grad(hash, x, y) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    // Permutation table for Perlin noise
    static p = (() => {
        const p = new Array(512);
        const permutation = [
            151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225,
            140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148,
            247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32,
            57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175,
            74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122,
            60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54,
            65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169,
            200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64,
            52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212,
            207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213,
            119, 248, 152, 2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9,
            129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178, 185, 112, 104,
            218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241,
            81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157,
            184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93,
            222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180
        ];
        
        for (let i = 0; i < 256; i++) {
            p[i] = p[i + 256] = permutation[i];
        }
        
        return p;
    })();

    /**
     * Create a material with the generated textures
     * @param {Object} options - Texture options
     * @returns {THREE.MeshStandardMaterial} - Material with textures
     */
    static createStoneMaterial(options = {}) {
        // Generate textures
        const diffuseTexture = this.generateStoneTexture(512, 512, options);
        
        // Create material
        const material = new THREE.MeshStandardMaterial({
            map: diffuseTexture,
            roughness: options.roughness || 0.8,
            metalness: 0.1,
        });
        
        // Generate and apply normal map if requested
        if (options.useNormalMap !== false) {
            // We need to get the canvas from the diffuse texture
            const normalMap = this.generateNormalMap(diffuseTexture.image, options.bumpiness || 0.3);
            material.normalMap = normalMap;
            material.normalScale = new THREE.Vector2(1, 1);
        }
        
        // Generate and apply roughness map if requested
        if (options.useRoughnessMap !== false) {
            const roughnessMap = this.generateRoughnessMap(diffuseTexture.image, options.roughness || 0.8);
            material.roughnessMap = roughnessMap;
        }
        
        return material;
    }
    
    /**
     * Generate a procedural wood texture
     * @param {number} width - Texture width
     * @param {number} height - Texture height
     * @param {Object} options - Texture generation options
     * @returns {THREE.CanvasTexture} - Generated texture
     */
    static generateWoodTexture(width = 512, height = 512, options = {}) {
        // Default options
        const defaults = {
            baseColor: { r: 139, g: 69, b: 19 }, // Base wood color (brown)
            darkColor: { r: 100, g: 50, b: 10 }, // Dark color for grain
            lightColor: { r: 160, g: 90, b: 30 }, // Light color for grain
            grainSize: 0.2, // Size of wood grain
            roughness: 0.8, // Roughness of the wood surface
            bumpiness: 0.3, // Bumpiness of the wood surface
            noiseScale: 20, // Scale of the noise pattern
        };

        // Merge provided options with defaults
        const settings = { ...defaults, ...options };

        // Create canvas and get context
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Fill with base color
        ctx.fillStyle = `rgb(${settings.baseColor.r}, ${settings.baseColor.g}, ${settings.baseColor.b})`;
        ctx.fillRect(0, 0, width, height);

        // Generate wood grain
        this.generateWoodGrain(ctx, width, height, settings);
        
        // Add noise for texture
        this.addNoise(ctx, width, height, { ...settings, roughness: settings.roughness * 0.5 });

        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        
        return texture;
    }
    
    /**
     * Generate wood grain pattern
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {number} width - Canvas width
     * @param {number} height - Canvas height
     * @param {Object} settings - Texture settings
     */
    static generateWoodGrain(ctx, width, height, settings) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        const grainScale = settings.grainSize * 50; // Scale factor for grain size
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                
                // Generate wood grain using perlin noise
                const nx = x / width * grainScale;
                const ny = y / height * grainScale;
                
                // Create oval-shaped rings
                const distX = (x - width / 2) / width;
                const distY = (y - height / 2) / height;
                const dist = Math.sqrt(distX * distX * 4 + distY * distY * 4); // Oval shape
                
                // Combine distance with noise for natural-looking grain
                const noise = this.perlinNoise(nx, ny) * 0.2;
                const grain = (Math.sin(dist * 50 + noise * 10) + 1) / 2; // Normalized to 0-1
                
                // Add some variation to the grain
                const variation = this.perlinNoise(nx * 2, ny * 2) * 0.1;
                
                // Mix colors based on grain value
                const mixFactor = Math.pow(grain + variation, 1.5);
                const r = Math.floor(settings.baseColor.r * (1 - mixFactor) + 
                                    (mixFactor > 0.5 ? settings.lightColor.r : settings.darkColor.r) * mixFactor);
                const g = Math.floor(settings.baseColor.g * (1 - mixFactor) + 
                                    (mixFactor > 0.5 ? settings.lightColor.g : settings.darkColor.g) * mixFactor);
                const b = Math.floor(settings.baseColor.b * (1 - mixFactor) + 
                                    (mixFactor > 0.5 ? settings.lightColor.b : settings.darkColor.b) * mixFactor);
                
                // Set pixel color
                data[i] = r;
                data[i + 1] = g;
                data[i + 2] = b;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Add some knots
        const knotCount = Math.floor(width * height * 0.0001);
        for (let i = 0; i < knotCount; i++) {
            const x = Math.floor(Math.random() * width);
            const y = Math.floor(Math.random() * height);
            const size = Math.random() * 10 + 5;
            
            // Draw knot
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
            gradient.addColorStop(0, `rgb(${settings.darkColor.r - 20}, ${settings.darkColor.g - 20}, ${settings.darkColor.b - 20})`);
            gradient.addColorStop(0.7, `rgb(${settings.darkColor.r}, ${settings.darkColor.g}, ${settings.darkColor.b})`);
            gradient.addColorStop(1, `rgb(${settings.baseColor.r}, ${settings.baseColor.g}, ${settings.baseColor.b})`);
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
            
            // Add rings around knot
            ctx.strokeStyle = `rgba(${settings.darkColor.r}, ${settings.darkColor.g}, ${settings.darkColor.b}, 0.5)`;
            for (let j = 0; j < 3; j++) {
                ctx.beginPath();
                ctx.arc(x, y, size * (1.2 + j * 0.2), 0, Math.PI * 2);
                ctx.stroke();
            }
        }
    }
    
    /**
     * Create a wood material with the generated textures
     * @param {Object} options - Texture options
     * @returns {THREE.MeshStandardMaterial} - Material with textures
     */
    static createWoodMaterial(options = {}) {
        // Generate textures
        const diffuseTexture = this.generateWoodTexture(512, 512, options);
        
        // Create material
        const material = new THREE.MeshStandardMaterial({
            map: diffuseTexture,
            roughness: options.roughness || 0.8,
            metalness: 0.1,
        });
        
        // Generate and apply normal map if requested
        if (options.useNormalMap !== false) {
            // We need to get the canvas from the diffuse texture
            const normalMap = this.generateNormalMap(diffuseTexture.image, options.bumpiness || 0.3);
            material.normalMap = normalMap;
            material.normalScale = new THREE.Vector2(1, 1);
        }
        
        // Generate and apply roughness map if requested
        if (options.useRoughnessMap !== false) {
            const roughnessMap = this.generateRoughnessMap(diffuseTexture.image, options.roughness || 0.8);
            material.roughnessMap = roughnessMap;
        }
        
        return material;
    }
}
