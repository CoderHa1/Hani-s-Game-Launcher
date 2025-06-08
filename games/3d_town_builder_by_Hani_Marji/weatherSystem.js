import * as THREE from 'three';

export class WeatherSystem {
    constructor(scene, terrainGenerator) {
        this.scene = scene;
        this.terrainGenerator = terrainGenerator;
        
        // Updated Weather states: sunny, cloudy, rainy, stormy
        this.weatherTypes = [
            {
                name: 'sunny',
                probability: 0.5,
                fogDensity: 0.001,
                fogColor: new THREE.Color(0x87ceeb),
                skyColor: new THREE.Color(0x87ceeb),
                sunIntensity: 1.0,
                duration: { min: 60, max: 180 }
            },
            {
                name: 'cloudy',
                probability: 0.3,
                fogDensity: 0.005,
                fogColor: new THREE.Color(0xaaaaaa),
                skyColor: new THREE.Color(0xb0b0b0),
                sunIntensity: 0.7,
                duration: { min: 40, max: 120 }
            },
            {
                name: 'rainy',
                probability: 0.1,
                fogDensity: 0.008,
                fogColor: new THREE.Color(0x666666),
                skyColor: new THREE.Color(0x707070),
                sunIntensity: 0.5,
                duration: { min: 30, max: 90 }
            },
            {
                name: 'stormy',
                probability: 0.1,
                fogDensity: 0.012,
                fogColor: new THREE.Color(0x444444),
                skyColor: new THREE.Color(0x303030),
                sunIntensity: 0.3,
                duration: { min: 20, max: 60 }
            }
        ];
        
        // ... existing code for weatherTransition, timers, particle systems, etc.
        this.weatherTransition = {
            active: false,
            from: null,
            to: null,
            progress: 0,
            duration: 10, // Seconds for weather transition
        };
        
        this.weatherDuration = this.getRandomDuration(this.weatherTypes[0]);
        this.weatherTimer = 0;
        
        this.raindrops = [];
        this.rainParticleSystem = null;
        this.cloudParticles = [];
        
        this.initWeatherEffects();
    }
    
    initWeatherEffects() {
        // Create rain particle system
        this.createRainSystem();
        
        // Create cloud particles
        this.createCloudSystem();
        
        // Set initial weather
        this.setWeather(this.weatherTypes[0], true);
    }
    
    createRainSystem() {
        // Rain material with alpha map for raindrop shape
        const rainMaterial = new THREE.MeshBasicMaterial({
            color: 0x7799aa,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        
        // Raindrop geometry - simple line segment
        const rainGeometry = new THREE.BoxGeometry(0.05, 0.5, 0.05);
        
        // Create a container for all raindrops
        this.rainParticleSystem = new THREE.Group();
        this.scene.add(this.rainParticleSystem);
        
        // Create raindrops
        for (let i = 0; i < 1000; i++) {
            const raindrop = new THREE.Mesh(rainGeometry, rainMaterial);
            
            // Randomize position in a box above the terrain
            raindrop.position.set(
                (Math.random() - 0.5) * 100,
                Math.random() * 50 + 30,
                (Math.random() - 0.5) * 100
            );
            
            // Store fall speed for update
            raindrop.userData.speed = 0.8 + Math.random() * 0.6;
            
            this.raindrops.push(raindrop);
            this.rainParticleSystem.add(raindrop);
        }
        
        // Initially hide rain
        this.rainParticleSystem.visible = false;
    }
    
    createCloudSystem() {
        // Cloud material
        const cloudMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        
        // Cloud geometry using sphere for puff shape
        const cloudPuffGeometry = new THREE.SphereGeometry(5, 7, 7);
        
        // Create clouds
        for (let i = 0; i < 25; i++) {
            const cloud = new THREE.Group();
            
            // Create cloud with multiple puffs
            const puffCount = 3 + Math.floor(Math.random() * 5);
            for (let j = 0; j < puffCount; j++) {
                const puff = new THREE.Mesh(cloudPuffGeometry, cloudMaterial);
                
                // Arrange puffs in a cluster
                puff.position.set(
                    (Math.random() - 0.5) * 8,
                    (Math.random() - 0.5) * 3,
                    (Math.random() - 0.5) * 8
                );
                
                // Randomize scale
                const scale = 0.6 + Math.random() * 0.8;
                puff.scale.set(scale, scale, scale);
                
                cloud.add(puff);
            }
            
            // Position cloud in sky
            cloud.position.set(
                (Math.random() - 0.5) * 150,
                Math.random() * 20 + 40,
                (Math.random() - 0.5) * 150
            );
            
            // Store movement info
            cloud.userData.speed = 0.05 + Math.random() * 0.1;
            cloud.userData.direction = Math.random() * Math.PI * 2;
            
            this.cloudParticles.push(cloud);
            this.scene.add(cloud);
            
            // Make clouds invisible initially - will fade in with weather transitions
            cloud.visible = false;
            cloud.userData.opacity = 0;
        }
    }
    
    update(deltaTime, timeSystem) {
        // Update weather timer
        this.weatherTimer += deltaTime;
        
        // Check if weather should change
        if (this.weatherTimer > this.weatherDuration && !this.weatherTransition.active) {
            this.changeWeather();
        }
        
        // Update weather transition if active
        if (this.weatherTransition.active) {
            this.updateWeatherTransition(deltaTime);
        }
        
        // On mobile, reduce particle counts and effects
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Only update rain and clouds if we're in appropriate weather or transitioning
        const needRainUpdate = this.currentWeather.name === 'rainy' || this.currentWeather.name === 'stormy' ||
            (this.weatherTransition.active &&
             ((this.weatherTransition.from.name === 'rainy' || this.weatherTransition.from.name === 'stormy') ||
              (this.weatherTransition.to.name === 'rainy' || this.weatherTransition.to.name === 'stormy')));
              
        if (needRainUpdate) {
            if (isMobile) {
                // Update only a subset of raindrops on mobile
                const rainUpdateCount = Math.min(this.raindrops.length, 300);
                for (let i = 0; i < rainUpdateCount; i++) {
                    const raindrop = this.raindrops[i];
                    raindrop.position.y -= raindrop.userData.speed * deltaTime * 20;
                    
                    if (raindrop.position.y < 0) {
                        raindrop.position.set(
                            (Math.random() - 0.5) * 100,
                            Math.random() * 20 + 50,
                            (Math.random() - 0.5) * 100
                        );
                    }
                }
            } else {
                this.updateRain(deltaTime);
            }
        }
        
        // Update clouds less frequently on mobile
        if (isMobile) {
            if (Math.random() < 0.1) { // Only update 10% of clouds per frame on mobile
                this.updateClouds(deltaTime, timeSystem);
            }
        } else {
            this.updateClouds(deltaTime, timeSystem);
        }
        
        // Add night stars if it's dark
        if (!isMobile || Math.random() < 0.1) { // Update stars less often on mobile
            this.updateStars(timeSystem);
        }
    }
    
    updateRain(deltaTime) {
        for (const raindrop of this.raindrops) {
            // Move raindrop down along the z-axis (gravity)
            raindrop.position.y -= raindrop.userData.speed * deltaTime * 20;
            
            // Reset position if below ground
            if (raindrop.position.y < 0) {
                raindrop.position.set(
                    (Math.random() - 0.5) * 100,
                    Math.random() * 20 + 50,
                    (Math.random() - 0.5) * 100
                );
            }
        }
    }
    
    updateClouds(deltaTime, timeSystem) {
        const isDay = timeSystem.timeOfDay > 0.25 && timeSystem.timeOfDay < 0.75;
        
        for (const cloud of this.cloudParticles) {
            // Move cloud horizontally in its direction
            cloud.position.x += Math.cos(cloud.userData.direction) * cloud.userData.speed * deltaTime;
            cloud.position.z += Math.sin(cloud.userData.direction) * cloud.userData.speed * deltaTime;
            
            // Wrap around if out of bounds
            if (cloud.position.x > 100) cloud.position.x = -100;
            if (cloud.position.x < -100) cloud.position.x = 100;
            if (cloud.position.z > 100) cloud.position.z = -100;
            if (cloud.position.z < -100) cloud.position.z = 100;
            
            // Gradually change opacity based on weather and time of day
            let targetOpacity = 0;
            
            if (this.currentWeather.name === 'cloudy' || this.currentWeather.name === 'rainy') {
                targetOpacity = this.currentWeather.name === 'rainy' ? 0.8 : 0.6;
            } else if (this.currentWeather.name === 'stormy') {
                targetOpacity = 0.8;
            } else if (this.currentWeather.name === 'sunny') {
                // For sunny weather, almost no clouds during day and none at night
                targetOpacity = isDay ? 0.05 : 0; 
            }
            
            // During transitions, adjust cloud opacity gradually
            if (this.weatherTransition.active) {
                const fromOpacity = this.getCloudOpacityForWeather(this.weatherTransition.from);
                const toOpacity = this.getCloudOpacityForWeather(this.weatherTransition.to);
                targetOpacity = fromOpacity + (toOpacity - fromOpacity) * this.weatherTransition.progress;
            }
            
            // Apply cloud opacity
            if (Math.random() < 0.1) { // Only update some clouds each frame to avoid performance issues
                // Get all cloud puffs
                cloud.children.forEach(puff => {
                    const material = puff.material;
                    material.opacity = targetOpacity;
                });
                
                // Show/hide cloud based on opacity
                cloud.visible = targetOpacity > 0.05;
            }
        }
    }
    
    getCloudOpacityForWeather(weather) {
        switch (weather.name) {
            case 'rainy': return 0.8;
            case 'cloudy': return 0.6;
            case 'stormy': return 0.8;
            case 'sunny': return 0.05; 
            default: return 0;
        }
    }
    
    changeWeather() {
        const newWeather = this.chooseWeatherByProbability();
        if (newWeather.name === this.currentWeather.name) {
            this.weatherTimer = 0;
            this.weatherDuration = this.getRandomDuration(this.currentWeather);
            return;
        }
        this.weatherTransition.active = true;
        this.weatherTransition.from = this.currentWeather;
        this.weatherTransition.to = newWeather;
        this.weatherTransition.progress = 0;
    }
    
    updateWeatherTransition(deltaTime) {
        this.weatherTransition.progress += deltaTime / this.weatherTransition.duration;
        if (this.weatherTransition.progress >= 1) {
            this.weatherTransition.active = false;
            this.currentWeather = this.weatherTransition.to;
            this.weatherTimer = 0;
            this.weatherDuration = this.getRandomDuration(this.currentWeather);
            this.setWeather(this.currentWeather);
        } else {
            this.interpolateWeather(this.weatherTransition.from, this.weatherTransition.to, this.weatherTransition.progress);
        }
    }
    
    interpolateWeather(from, to, progress) {
        const fogDensity = from.fogDensity + (to.fogDensity - from.fogDensity) * progress;
        const fogColor = new THREE.Color().lerpColors(from.fogColor, to.fogColor, progress);
        const skyColor = new THREE.Color().lerpColors(from.skyColor, to.skyColor, progress);
        if (this.scene.fog) {
            this.scene.fog.density = fogDensity;
            this.scene.fog.color = fogColor;
        } else {
            this.scene.fog = new THREE.FogExp2(fogColor, fogDensity);
        }
        this.scene.background = skyColor;
        
        // Adjust rain fade during transitions (apply to both 'rainy' and 'stormy' conditions)
        if ((from.name === 'rainy' || from.name === 'stormy') && !(to.name === 'rainy' || to.name === 'stormy')) {
            this.rainParticleSystem.visible = true;
            const opacity = 1 - progress;
            for (const raindrop of this.raindrops) {
                raindrop.material.opacity = 0.6 * opacity;
            }
            if (progress > 0.9) this.rainParticleSystem.visible = false;
        } else if (!(from.name === 'rainy' || from.name === 'stormy') && (to.name === 'rainy' || to.name === 'stormy')) {
            this.rainParticleSystem.visible = true;
            const opacity = progress;
            for (const raindrop of this.raindrops) {
                raindrop.material.opacity = 0.6 * opacity;
            }
        }
        
        if (this.scene.userData.game && this.scene.userData.game.timeSystem) {
            const sunLight = this.scene.userData.game.timeSystem.sunLight;
            if (sunLight) {
                const baseIntensity = this.scene.userData.game.timeSystem.getSunBaseIntensity();
                const weatherIntensity = from.sunIntensity + (to.sunIntensity - from.sunIntensity) * progress;
                sunLight.intensity = baseIntensity * weatherIntensity;
            }
        }
    }
    
    setWeather(weather, immediate = false) {
        if (this.scene.fog) {
            const timeSystem = this.scene.userData.game && this.scene.userData.game.timeSystem;
            const isNight = timeSystem && (timeSystem.timeOfDay < 0.25 || timeSystem.timeOfDay > 0.75);
            
            // Calculate night darkness factor - darkest at midnight (0.0 or 1.0)
            let nightDarknessFactor = 1.0;
            if (isNight) {
                // Calculate how close to midnight (0.0 or 1.0) we are
                const midnightFactor = timeSystem.timeOfDay < 0.25 ? 
                    1.0 - (timeSystem.timeOfDay / 0.25) : 
                    (timeSystem.timeOfDay - 0.75) / 0.25;
                
                // Stronger darkness factor for cloudy/rainy/stormy weather at night
                nightDarknessFactor = (weather.name === 'cloudy' || weather.name === 'rainy' || weather.name === 'stormy') ? 
                    3.0 + midnightFactor * 1.0 : 
                    2.0 + midnightFactor * 1.0;
            }
            
            if (immediate) {
                this.scene.fog.color = weather.fogColor;
                this.scene.fog.density = weather.fogDensity * (isNight ? nightDarknessFactor : 1.0);
            } else {
                const currentColor = this.scene.fog.color;
                const currentDensity = this.scene.fog.density;
                this.scene.fog.color.lerp(weather.fogColor, 0.05);
                this.scene.fog.density += ((weather.fogDensity * (isNight ? nightDarknessFactor : 1.0)) - currentDensity) * 0.05;
            }
        } else {
            this.scene.fog = new THREE.FogExp2(weather.fogColor, weather.fogDensity);
        }
        
        const timeSystem = this.scene.userData.game && this.scene.userData.game.timeSystem;
        const isNight = timeSystem && (timeSystem.timeOfDay < 0.25 || timeSystem.timeOfDay > 0.75);
        
        // Calculate darkness multiplier based on how close to midnight we are
        let darknessMultiplier;
        if (isNight) {
            // Calculate how close to midnight (0.0 or 1.0) we are - for a smooth transition
            const midnightFactor = timeSystem.timeOfDay < 0.25 ? 
                1.0 - (timeSystem.timeOfDay / 0.25) : 
                (timeSystem.timeOfDay - 0.75) / 0.25;
            
            // Darker at midnight, especially for cloudy weather
            darknessMultiplier = (weather.name === 'cloudy' || weather.name === 'rainy' || weather.name === 'stormy') ? 
                0.15 - midnightFactor * 0.05 : 
                0.2 - midnightFactor * 0.05;
        } else {
            darknessMultiplier = 1.0;
        }
        
        let adjustedSkyColor = weather.skyColor.clone();
        if (isNight) {
            adjustedSkyColor.multiplyScalar(darknessMultiplier);
        } else if (weather.name === 'sunny') {
            // Calculate noon effect for extra brightness at noon
            if (timeSystem) {
                const noonEffect = 1.0 - Math.abs(timeSystem.timeOfDay - 0.5) * 2;
                adjustedSkyColor.multiplyScalar(1.25 + noonEffect * 0.15);
                adjustedSkyColor.offsetHSL(0, 0.2, 0.05);
            } else {
                adjustedSkyColor.multiplyScalar(1.25);
                adjustedSkyColor.offsetHSL(0, 0.2, 0.05);
            }
        }
        
        if (immediate) {
            this.scene.background = adjustedSkyColor;
        } else {
            if (this.scene.background) {
                this.scene.background.lerp(adjustedSkyColor, 0.05);
            } else {
                this.scene.background = adjustedSkyColor;
            }
        }
        this.rainParticleSystem.visible = (weather.name === 'rainy' || weather.name === 'stormy');
        if (this.scene.userData.game && this.scene.userData.game.timeSystem) {
            const sunLight = this.scene.userData.game.timeSystem.sunLight;
            if (sunLight) {
                const baseIntensity = this.scene.userData.game.timeSystem.getSunBaseIntensity();
                const weatherIntensity = weather.name === 'sunny' && !isNight ? 
                    weather.sunIntensity * 1.3 : weather.sunIntensity;
                sunLight.intensity = baseIntensity * weatherIntensity;
            }
        }
        this.currentWeather = weather;
    }
    
    getRandomDuration(weather) {
        return weather.duration.min + Math.random() * (weather.duration.max - weather.duration.min);
    }
    
    chooseWeatherByProbability() {
        const adjustedWeatherTypes = this.weatherTypes.map(weather => {
            let adjustedProbability = weather.probability;
            
            // Check time of day from time system
            const timeSystem = this.scene.userData.game && this.scene.userData.game.timeSystem;
            const isNight = timeSystem && (timeSystem.timeOfDay < 0.25 || timeSystem.timeOfDay > 0.75);
            
            // If it's night time, reduce probability of sunny weather to near-zero
            if (isNight && weather.name === 'sunny') {
                adjustedProbability *= 0.05; 
            }
            
            // Original probability adjustments
            if (weather.name === this.currentWeather.name) {
                adjustedProbability *= 0.2;
            }
            if (this.currentWeather.name === 'sunny' && weather.name === 'rainy') {
                adjustedProbability *= 0.3;
            } else if (this.currentWeather.name === 'sunny' && weather.name === 'cloudy') {
                adjustedProbability *= 1.5;
            } else if (this.currentWeather.name === 'cloudy' && weather.name === 'rainy') {
                adjustedProbability *= 1.5;
            } else if (this.currentWeather.name === 'rainy' && weather.name === 'sunny') {
                adjustedProbability *= 0.3;
            } else if (this.currentWeather.name === 'cloudy' && weather.name === 'stormy') {
                adjustedProbability *= 1.2;
            } else if (this.currentWeather.name === 'rainy' && weather.name === 'stormy') {
                adjustedProbability *= 1.3;
            } else if (this.currentWeather.name === 'stormy' && weather.name === 'sunny') {
                adjustedProbability *= 0.2;
            }
            
            return {
                ...weather,
                adjustedProbability
            };
        });
        const totalProbability = adjustedWeatherTypes.reduce((sum, weather) => sum + weather.adjustedProbability, 0);
        let random = Math.random() * totalProbability;
        for (const weather of adjustedWeatherTypes) {
            random -= weather.adjustedProbability;
            if (random <= 0) {
                return weather;
            }
        }
        return this.weatherTypes[0];
    }
    
    getWeatherName() {
        const weatherEmojis = {
            'sunny': '☀️',
            'cloudy': '☁️',
            'rainy': '🌧️',
            'stormy': '⛈️'
        };
        
        // Get time of day
        const timeSystem = this.scene.userData.game && this.scene.userData.game.timeSystem;
        const isNight = timeSystem && (timeSystem.timeOfDay < 0.25 || timeSystem.timeOfDay > 0.75);
        
        // If it's night and sunny, display "Clear Night" instead
        if (isNight && this.currentWeather.name === 'sunny') {
            return '🌙 Clear Night';
        }
        
        const emoji = weatherEmojis[this.currentWeather.name] || '';
        return `${emoji} ${this.currentWeather.name.charAt(0).toUpperCase() + this.currentWeather.name.slice(1)}`;
    }
    
    getCurrentWeather() {
        return this.currentWeather;
    }
    
    updateStars(timeSystem) {
        // Create stars if they don't exist
        if (!this.stars) {
            this.createStarField();
        }
        
        // Show stars only at night
        const isNight = timeSystem.timeOfDay < 0.25 || timeSystem.timeOfDay > 0.75;
        const moonPhase = Math.abs((timeSystem.dayCount % 30) - 15) / 15; // 0-1 value for moon phase
        
        if (isNight) {
            // Calculate intensity based on time (brightest at midnight)
            let intensity = 0;
            
            if (timeSystem.timeOfDay < 0.25) {
                // From midnight (0) to dawn (0.25)
                intensity = 1 - (timeSystem.timeOfDay / 0.25); // 1 at midnight, 0 at dawn
            } else {
                // From dusk (0.75) to midnight (1.0)
                intensity = (timeSystem.timeOfDay - 0.75) / 0.25; // 0 at dusk, 1 at midnight
            }
            
            // Adjust for weather conditions
            if (this.currentWeather.name === 'cloudy') {
                intensity *= 0.3;
            } else if (this.currentWeather.name === 'rainy' || this.currentWeather.name === 'stormy') {
                intensity *= 0.1;
            }
            
            // Make stars visible with proper opacity
            if (this.stars) {
                this.stars.visible = true;
                this.stars.material.opacity = 0.7 * intensity;
            }
            
            // Update moon if it exists
            if (this.moon) {
                this.moon.visible = true;
                this.moon.material.opacity = 0.8 * intensity;
                
                // Position moon based on time
                const moonAngle = timeSystem.timeOfDay * Math.PI * 2 + Math.PI;
                const moonRadius = 120;
                const moonY = Math.sin(moonAngle) * moonRadius;
                if (moonY > 0) { // Only show moon when it's above horizon
                    const moonX = Math.cos(moonAngle) * moonRadius;
                    this.moon.position.set(moonX, moonY, -40);
                    
                    // Moon size based on phase
                    const baseScale = 15;
                    this.moon.scale.set(baseScale, baseScale, 1);
                } else {
                    this.moon.visible = false;
                }
            }
        } else {
            // Hide stars during day
            if (this.stars) this.stars.visible = false;
            if (this.moon) this.moon.visible = false;
        }
    }
    
    createStarField() {
        // Create a star field for night sky
        const starCount = 1000;
        const starGeometry = new THREE.BufferGeometry();
        const starPositions = [];
        
        for (let i = 0; i < starCount; i++) {
            // Distribute stars in a dome shape around the scene
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI * 0.5;
            const radius = 150 + Math.random() * 50;
            
            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.cos(phi);
            const z = radius * Math.sin(phi) * Math.sin(theta);
            
            starPositions.push(x, y, z);
        }
        
        starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
        
        const starMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.8,
            transparent: true,
            opacity: 0,
            sizeAttenuation: false
        });
        
        this.stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(this.stars);
        
        // Create moon
        const moonGeometry = new THREE.CircleGeometry(1, 32);
        const moonMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0
        });
        
        this.moon = new THREE.Mesh(moonGeometry, moonMaterial);
        this.moon.position.set(0, 100, -50);
        this.scene.add(this.moon);
    }
}