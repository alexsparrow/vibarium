// Class to handle all audio-related functionality
export class AudioManager {
    constructor() {
        // Initialize Web Audio API
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGainNode = this.audioContext.createGain();
        this.masterGainNode.gain.value = 0.5; // Initial volume
        this.masterGainNode.connect(this.audioContext.destination);
        
        // Get UI controls
        this.toggleMusicButton = document.getElementById('toggle-music');
        this.volumeSlider = document.getElementById('volume-slider');
        
        // Add event listeners for audio controls
        this.toggleMusicButton.addEventListener('click', () => {
            this.toggleMusic();
        });
        
        this.volumeSlider.addEventListener('input', (e) => {
            this.masterGainNode.gain.value = e.target.value;
        });
        
        // Initialize music state
        this.isMusicPlaying = false;
        this.toggleMusicButton.textContent = "Play Music";
        this.activeOscillators = [];
        this.activeLFOs = [];
        
        // Create ambient music generator
        this.setupAmbientMusicGenerator();
    }
    
    setupAmbientMusicGenerator() {
        // Define a pentatonic scale for ancient/mystical feel
        this.scale = [
            220.00, // A3
            246.94, // B3
            293.66, // D4
            329.63, // E4
            392.00  // G4
        ];
        
        // Define chord progressions
        this.chords = [
            [0, 2, 4], // A minor pentatonic
            [1, 3, 0], // B minor with A
            [2, 4, 1], // D minor with B
            [3, 0, 2]  // E minor with D
        ];
        
        this.currentChord = 0;
        this.chordDuration = 8; // seconds per chord
        this.lastChordChange = 0;
    }
    
    toggleMusic() {
        console.log("Toggle music called, current state:", this.isMusicPlaying);
        
        try {
            if (this.isMusicPlaying) {
                // Stop all active oscillators
                this.stopAllSounds();
                this.toggleMusicButton.textContent = "Play Music";
                this.isMusicPlaying = false;
                console.log("Music stopped");
            } else {
                // Resume audio context if suspended
                console.log("Audio context state before resume:", this.audioContext.state);
                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume();
                    console.log("Audio context resumed");
                }
                this.toggleMusicButton.textContent = "Pause Music";
                
                // Set music playing state to true BEFORE generating music
                this.isMusicPlaying = true;
                
                // Start generating ambient music
                this.generateAmbientMusic();
                console.log("Started generating ambient music");
            }
            console.log("New music state:", this.isMusicPlaying);
        } catch (error) {
            console.error("Error in toggleMusic:", error);
        }
    }
    
    stopAllSounds() {
        // Stop all active oscillators
        this.activeOscillators.forEach(osc => {
            osc.stop();
            osc.disconnect();
        });
        
        // Stop all LFOs
        this.activeLFOs.forEach(lfo => {
            lfo.stop();
            lfo.disconnect();
        });
        
        this.activeOscillators = [];
        this.activeLFOs = [];
    }
    
    generateAmbientMusic() {
        console.log("generateAmbientMusic called, music playing:", this.isMusicPlaying);
        
        if (!this.isMusicPlaying) return;
        
        try {
            const now = this.audioContext.currentTime;
            console.log("Audio context current time:", now);
            
            // Check if we need to change chord
            if (now - this.lastChordChange >= this.chordDuration) {
                this.currentChord = (this.currentChord + 1) % this.chords.length;
                this.lastChordChange = now;
                console.log("Changed to chord:", this.currentChord);
            }
            
            // Get current chord notes
            const chord = this.chords[this.currentChord];
            console.log("Current chord:", chord, "using notes:", 
                        this.scale[chord[0]], this.scale[chord[1]], this.scale[chord[2]]);
            
            // Create drone bass note
            console.log("Creating drone bass note");
            this.createDrone(this.scale[chord[0]] / 2, 8);
            
            // Create chord notes with different timbres
            console.log("Creating chord pads");
            this.createPad(this.scale[chord[0]], 4);
            this.createPad(this.scale[chord[1]], 6);
            this.createPad(this.scale[chord[2]], 5);
            
            // Add occasional high bell-like sounds
            if (Math.random() < 0.1) {
                const randomNote = this.scale[Math.floor(Math.random() * this.scale.length)];
                console.log("Creating bell sound at note:", randomNote * 2);
                this.createBell(randomNote * 2, 2);
            }
            
            // Schedule next generation
            console.log("Scheduling next music generation in 2 seconds");
            setTimeout(() => {
                if (this.isMusicPlaying) {
                    this.generateAmbientMusic();
                }
            }, 2000); // Generate new sounds every 2 seconds
        } catch (error) {
            console.error("Error in generateAmbientMusic:", error);
        }
    }
    
    createDrone(frequency, duration) {
        console.log(`Creating drone at frequency ${frequency}Hz for ${duration}s`);
        
        try {
            const osc = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            // Create a subtle LFO for the drone
            const lfo = this.audioContext.createOscillator();
            const lfoGain = this.audioContext.createGain();
            
            lfo.frequency.value = 0.1 + Math.random() * 0.2; // Slow LFO
            lfoGain.gain.value = 2; // Subtle pitch modulation
            
            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);
            
            // Set up the oscillator
            osc.type = 'sine';
            osc.frequency.value = frequency;
            
            // Set up the envelope
            const now = this.audioContext.currentTime;
            console.log(`Drone envelope: now=${now}, attack=${now+2}, decay=${now+duration-2}, release=${now+duration}`);
            
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.12, now + 2); // Slow attack
            gainNode.gain.linearRampToValueAtTime(0.1, now + duration - 2); // Slight decay
            gainNode.gain.linearRampToValueAtTime(0, now + duration); // Release
            
            // Connect and start
            osc.connect(gainNode);
            gainNode.connect(this.masterGainNode);
            
            console.log("Starting drone oscillator and LFO");
            osc.start();
            lfo.start();
            
            // Stop after duration
            osc.stop(now + duration);
            lfo.stop(now + duration);
            
            // Store active oscillators for later cleanup
            this.activeOscillators.push(osc);
            this.activeLFOs.push(lfo);
            
            console.log(`Drone created successfully, will play until ${now + duration}`);
        } catch (error) {
            console.error("Error creating drone:", error);
        }
    }
    
    createPad(frequency, duration) {
        console.log(`Creating pad at frequency ${frequency}Hz for ${duration}s`);
        
        try {
            const osc1 = this.audioContext.createOscillator();
            const osc2 = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            // Slightly detune the oscillators for a richer sound
            osc1.type = 'sine';
            osc1.frequency.value = frequency;
            
            osc2.type = 'triangle';
            osc2.frequency.value = frequency * 1.005; // Slight detuning
            
            // Set up the envelope
            const now = this.audioContext.currentTime;
            console.log(`Pad envelope: now=${now}, attack=${now+1.5}, decay=${now+duration-1}, release=${now+duration}`);
            
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.07, now + 1.5); // Slow attack
            gainNode.gain.linearRampToValueAtTime(0.05, now + duration - 1); // Slight decay
            gainNode.gain.linearRampToValueAtTime(0, now + duration); // Release
            
            // Connect and start
            osc1.connect(gainNode);
            osc2.connect(gainNode);
            gainNode.connect(this.masterGainNode);
            
            console.log("Starting pad oscillators");
            osc1.start();
            osc2.start();
            
            // Stop after duration
            osc1.stop(now + duration);
            osc2.stop(now + duration);
            
            // Store active oscillators for later cleanup
            this.activeOscillators.push(osc1, osc2);
            
            console.log(`Pad created successfully, will play until ${now + duration}`);
        } catch (error) {
            console.error("Error creating pad:", error);
        }
    }
    
    createBell(frequency, duration) {
        console.log(`Creating bell at frequency ${frequency}Hz for ${duration}s`);
        
        try {
            const osc = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            // Set up the oscillator
            osc.type = 'sine';
            osc.frequency.value = frequency;
            
            // Set up the envelope for a bell-like sound
            const now = this.audioContext.currentTime;
            console.log(`Bell envelope: now=${now}, attack=${now+0.02}, decay=${now+duration*0.8}, release=${now+duration}`);
            
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.15, now + 0.02); // Fast attack
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration * 0.8); // Fast decay
            gainNode.gain.linearRampToValueAtTime(0, now + duration); // Release
            
            // Connect and start
            osc.connect(gainNode);
            gainNode.connect(this.masterGainNode);
            
            console.log("Starting bell oscillator");
            osc.start();
            
            // Stop after duration
            osc.stop(now + duration);
            
            // Store active oscillator for later cleanup
            this.activeOscillators.push(osc);
            
            console.log(`Bell created successfully, will play until ${now + duration}`);
        } catch (error) {
            console.error("Error creating bell:", error);
        }
    }
    
    // Play victory sound
    playVictorySound() {
        try {
            // Create a triumphant sound
            const osc1 = this.audioContext.createOscillator();
            const osc2 = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            // Set up oscillators
            osc1.type = 'triangle';
            osc1.frequency.value = 523.25; // C5
            
            osc2.type = 'triangle';
            osc2.frequency.value = 659.25; // E5
            
            // Set up the envelope
            const now = this.audioContext.currentTime;
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.4, now + 0.1);
            gainNode.gain.linearRampToValueAtTime(0.2, now + 0.3);
            gainNode.gain.linearRampToValueAtTime(0, now + 1.5);
            
            // Connect and start
            osc1.connect(gainNode);
            osc2.connect(gainNode);
            gainNode.connect(this.masterGainNode);
            
            osc1.start();
            osc2.start();
            
            // Play a sequence
            osc1.frequency.setValueAtTime(523.25, now); // C5
            osc2.frequency.setValueAtTime(659.25, now); // E5
            
            osc1.frequency.setValueAtTime(587.33, now + 0.3); // D5
            osc2.frequency.setValueAtTime(783.99, now + 0.3); // G5
            
            osc1.frequency.setValueAtTime(659.25, now + 0.6); // E5
            osc2.frequency.setValueAtTime(880.00, now + 0.6); // A5
            
            osc1.frequency.setValueAtTime(783.99, now + 0.9); // G5
            osc2.frequency.setValueAtTime(1046.50, now + 0.9); // C6
            
            // Stop after duration
            osc1.stop(now + 1.5);
            osc2.stop(now + 1.5);
            
            // Store for cleanup
            this.activeOscillators.push(osc1, osc2);
        } catch (error) {
            console.error("Error playing victory sound:", error);
        }
    }
    
    // Play level start sound
    playLevelStartSound() {
        try {
            // Create a short fanfare sound
            const osc = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            // Set up the oscillator
            osc.type = 'triangle';
            osc.frequency.value = 440; // A4
            
            // Set up the envelope
            const now = this.audioContext.currentTime;
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
            gainNode.gain.linearRampToValueAtTime(0.1, now + 0.2);
            gainNode.gain.linearRampToValueAtTime(0, now + 0.5);
            
            // Connect and start
            osc.connect(gainNode);
            gainNode.connect(this.masterGainNode);
            
            osc.start();
            
            // Play a quick ascending arpeggio
            osc.frequency.setValueAtTime(440, now); // A4
            osc.frequency.setValueAtTime(554.37, now + 0.1); // C#5
            osc.frequency.setValueAtTime(659.25, now + 0.2); // E5
            osc.frequency.setValueAtTime(880, now + 0.3); // A5
            
            // Stop after duration
            osc.stop(now + 0.5);
            
            // Store for cleanup
            this.activeOscillators.push(osc);
        } catch (error) {
            console.error("Error playing level start sound:", error);
        }
    }
    
    // Play a sound when collecting a gold pot
    playCollectionSound() {
        try {
            // Create a short bell-like sound
            const osc = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            // Set up the oscillator
            osc.type = 'sine';
            osc.frequency.value = 523.25; // C5
            
            // Set up the envelope for a short bell-like sound
            const now = this.audioContext.currentTime;
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.3, now + 0.02); // Fast attack
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5); // Fast decay
            
            // Connect and start
            osc.connect(gainNode);
            gainNode.connect(this.masterGainNode);
            
            osc.start();
            osc.stop(now + 0.5);
            
            // Store for cleanup
            this.activeOscillators.push(osc);
        } catch (error) {
            console.error("Error playing collection sound:", error);
        }
    }
    
    // Play a sound when characters collide
    playCollisionSound() {
        try {
            // Create a crash/collision sound
            const osc1 = this.audioContext.createOscillator();
            const osc2 = this.audioContext.createOscillator();
            const noiseBuffer = this.createNoiseBuffer();
            const noiseSource = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            const filterNode = this.audioContext.createBiquadFilter();
            
            // Set up the oscillators for a dissonant sound
            osc1.type = 'sawtooth';
            osc1.frequency.value = 220; // A3
            
            osc2.type = 'sawtooth';
            osc2.frequency.value = 233.08; // Bb3 - dissonant with A3
            
            // Set up noise
            noiseSource.buffer = noiseBuffer;
            
            // Set up filter for the noise
            filterNode.type = 'bandpass';
            filterNode.frequency.value = 800;
            filterNode.Q.value = 0.7;
            
            // Set up the envelope for a crash sound
            const now = this.audioContext.currentTime;
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.4, now + 0.02); // Very fast attack
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.8); // Medium decay
            
            // Connect everything
            osc1.connect(gainNode);
            osc2.connect(gainNode);
            noiseSource.connect(filterNode);
            filterNode.connect(gainNode);
            gainNode.connect(this.masterGainNode);
            
            // Start and stop
            osc1.start();
            osc2.start();
            noiseSource.start();
            
            osc1.stop(now + 0.8);
            osc2.stop(now + 0.8);
            noiseSource.stop(now + 0.8);
            
            // Store for cleanup
            this.activeOscillators.push(osc1, osc2);
        } catch (error) {
            console.error("Error playing collision sound:", error);
        }
    }
    
    // Create a noise buffer for sound effects
    createNoiseBuffer() {
        const bufferSize = this.audioContext.sampleRate * 1; // 1 second buffer
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        return buffer;
    }
}
