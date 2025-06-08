import * as THREE from 'three';

export class TimeSystem {
    constructor(scene, sunLight) {
        this.scene = scene;
        this.sunLight = sunLight;
        
        this.timeOfDay = 0; // 0 to 1 (0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset)
        this.dayCount = 1;
        this.secondsPerDay = 300; // 5 minutes per in-game day
        this.timeElapsed = 0;
        
        // Sky colors
        this.skyColors = {
            night: new THREE.Color(0x0a1020), // Darker night color
            sunrise: new THREE.Color(0xff9e80),
            day: new THREE.Color(0x87ceeb),
            sunset: new THREE.Color(0xff7043)
        };
        
        // Sun colors
        this.sunColors = {
            night: new THREE.Color(0x1a2236), // Darker night sun color
            sunrise: new THREE.Color(0xffcc80),
            day: new THREE.Color(0xffffff),
            sunset: new THREE.Color(0xffab40)
        };
        
        // Sun intensity
        this.sunIntensity = {
            night: 0.05, // Dimmer night intensity
            sunrise: 0.5,
            day: 1.0,
            sunset: 0.5
        };
        
        // Ambient light intensities
        this.ambientIntensity = {
            night: 0.1, // Very low ambient light at night
            sunrise: 0.4,
            day: 0.8,
            sunset: 0.4
        };
        
        // Initialize ambient light
        this.ambientLight = new THREE.AmbientLight(0xffffff, this.ambientIntensity.day);
        this.scene.add(this.ambientLight);
        
        // Initialize hemisphere light
        this.hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
        this.scene.add(this.hemisphereLight);
    }
    
    update(deltaTime) {
        // Update time
        this.timeElapsed += deltaTime;
        
        // Calculate time of day (0 to 1)
        const previousTimeOfDay = this.timeOfDay;
        this.timeOfDay = (this.timeElapsed % this.secondsPerDay) / this.secondsPerDay;
        
        // Check if a day has passed - detect the exact moment when we cross midnight
        if (previousTimeOfDay > 0.9 && this.timeOfDay < 0.1) {
            this.dayCount = Math.floor(this.timeElapsed / this.secondsPerDay) + 1;
            
            // Make sure the game gets this update immediately
            if (this.scene.userData.game && this.scene.userData.game.gameState) {
                this.scene.userData.game.gameState.dayCount = this.dayCount;
            }
        }
        
        // Update sun position
        this.updateSun();
        
        // Update sky color
        this.updateSky();
        
        return {
            timeOfDay: this.timeOfDay,
            dayCount: this.dayCount
        };
    }
    
    updateSun() {
        // Calculate sun position
        const sunAngle = this.timeOfDay * Math.PI * 2;
        
        // Position the sun in a circle around the scene
        const radius = 100;
        
        // During night (0.75 to 0.25), keep sun below horizon
        let y;
        if (this.timeOfDay > 0.75 || this.timeOfDay < 0.25) {
            // Night - sun below horizon
            y = -Math.abs(Math.sin(sunAngle)) * radius;
        } else {
            // Day - sun above horizon
            y = Math.sin(sunAngle) * radius;
        }
        
        const x = Math.cos(sunAngle) * radius;
        
        // Use simple assignment instead of set() method for better performance
        this.sunLight.position.x = x;
        this.sunLight.position.y = y;
        this.sunLight.position.z = 0;
        
        // Update sun color and intensity with improved transitions
        let sunColor, sunIntensity;
        
        // More gradual transitions between times of day
        if (this.timeOfDay < 0.2) {
            // Deep night (darkest at 0.0/midnight)
            const nightProgress = (0.2 - this.timeOfDay) / 0.2;
            sunColor = this.sunColors.night.clone();
            sunIntensity = Math.max(0.02, this.sunIntensity.night * (1 - nightProgress * 0.7));
        } else if (this.timeOfDay < 0.3) {
            // Sunrise transition
            const t = (this.timeOfDay - 0.2) / 0.1;
            sunColor = this.sunColors.night.clone().lerp(this.sunColors.sunrise, t);
            sunIntensity = this.sunIntensity.night + (this.sunIntensity.sunrise - this.sunIntensity.night) * t;
        } else if (this.timeOfDay < 0.4) {
            // Sunrise to day
            const t = (this.timeOfDay - 0.3) / 0.1;
            sunColor = this.sunColors.sunrise.clone().lerp(this.sunColors.day, t);
            sunIntensity = this.sunIntensity.sunrise + (this.sunIntensity.day - this.sunIntensity.sunrise) * t;
        } else if (this.timeOfDay < 0.6) {
            // Day (brightest at 0.5/noon)
            const noonEffect = 1.0 - Math.abs(this.timeOfDay - 0.5) * 2; // 1.0 at noon, decreasing as we move away
            sunColor = this.sunColors.day;
            sunIntensity = this.sunIntensity.day * (1 + noonEffect * 0.2); // Up to 20% brighter at noon
        } else if (this.timeOfDay < 0.7) {
            // Day to sunset
            const t = (this.timeOfDay - 0.6) / 0.1;
            sunColor = this.sunColors.day.clone().lerp(this.sunColors.sunset, t);
            sunIntensity = this.sunIntensity.day + (this.sunIntensity.sunset - this.sunIntensity.day) * t;
        } else if (this.timeOfDay < 0.8) {
            // Sunset to night
            const t = (this.timeOfDay - 0.7) / 0.1;
            sunColor = this.sunColors.sunset.clone().lerp(this.sunColors.night, t);
            sunIntensity = this.sunIntensity.sunset + (this.sunIntensity.night - this.sunIntensity.sunset) * t;
        } else {
            // Night approaching midnight (getting progressively darker)
            const nightProgress = (this.timeOfDay - 0.8) / 0.2;
            sunColor = this.sunColors.night.clone();
            sunIntensity = Math.max(0.02, this.sunIntensity.night * (1 - nightProgress * 0.7));
        }
        
        this.sunLight.color = sunColor;
        
        // Base intensity is modified by the weather system, if present
        this.sunLight.intensity = sunIntensity;
        
        // Store the base intensity for use by the weather system
        this.currentBaseIntensity = sunIntensity;
    }
    
    getSunBaseIntensity() {
        return this.currentBaseIntensity || 1.0;
    }
    
    updateSky() {
        let skyColor;
        let ambientIntensity;
        let hemisphereIntensity;
        
        // Improved sky color transitions with smoother blending
        if (this.timeOfDay < 0.2) {
            // Deep night (darkest at 0.0/midnight)
            const nightProgress = (0.2 - this.timeOfDay) / 0.2;
            skyColor = this.skyColors.night.clone();
            // Make it progressively darker as we approach midnight
            skyColor.multiplyScalar(0.5 + (1 - nightProgress) * 0.5); 
            ambientIntensity = Math.max(0.03, this.ambientIntensity.night * (1 - nightProgress * 0.7)); 
            hemisphereIntensity = 0.08 + (1 - nightProgress) * 0.1; 
        } else if (this.timeOfDay < 0.3) {
            const t = (this.timeOfDay - 0.2) / 0.1;
            skyColor = this.skyColors.night.clone().lerp(this.skyColors.sunrise, t);
            ambientIntensity = this.ambientIntensity.night + (this.ambientIntensity.sunrise - this.ambientIntensity.night) * t;
            hemisphereIntensity = 0.2 + t * 0.4;
        } else if (this.timeOfDay < 0.4) {
            const t = (this.timeOfDay - 0.3) / 0.1;
            skyColor = this.skyColors.sunrise.clone().lerp(this.skyColors.day, t);
            ambientIntensity = this.ambientIntensity.sunrise + (this.ambientIntensity.day - this.ambientIntensity.sunrise) * t;
            hemisphereIntensity = 0.6;
        } else if (this.timeOfDay < 0.6) {
            // Day (brightest at 0.5/noon)
            const noonEffect = 1.0 - Math.abs(this.timeOfDay - 0.5) * 2; // 1.0 at noon, decreasing as we move away
            skyColor = this.skyColors.day.clone();
            // Make the sky slightly more vibrant at noon
            skyColor.multiplyScalar(1 + noonEffect * 0.1);
            ambientIntensity = this.ambientIntensity.day * (1 + noonEffect * 0.1);
            hemisphereIntensity = 0.6 + noonEffect * 0.1;
        } else if (this.timeOfDay < 0.7) {
            const t = (this.timeOfDay - 0.6) / 0.1;
            skyColor = this.skyColors.day.clone().lerp(this.skyColors.sunset, t);
            ambientIntensity = this.ambientIntensity.day + (this.ambientIntensity.sunset - this.ambientIntensity.day) * t;
            hemisphereIntensity = 0.6;
        } else if (this.timeOfDay < 0.8) {
            const t = (this.timeOfDay - 0.7) / 0.1;
            skyColor = this.skyColors.sunset.clone().lerp(this.skyColors.night, t);
            ambientIntensity = this.ambientIntensity.sunset + (this.ambientIntensity.night - this.ambientIntensity.sunset) * t;
            hemisphereIntensity = 0.6 - t * 0.4;
        } else {
            // Night approaching midnight
            const nightProgress = (this.timeOfDay - 0.8) / 0.2;
            skyColor = this.skyColors.night.clone();
            // Make it progressively darker as we approach midnight
            skyColor.multiplyScalar(0.5 + (1 - nightProgress) * 0.5); 
            ambientIntensity = Math.max(0.03, this.ambientIntensity.night * (1 - nightProgress * 0.7)); 
            hemisphereIntensity = 0.08 + (1 - nightProgress) * 0.1; 
        }
        
        // Always update the ambient & hemisphere light intensities
        this.ambientLight.intensity = ambientIntensity;
        this.hemisphereLight.intensity = hemisphereIntensity;
        
        // Remove the condition so that the sky and fog update continuously based on time-of-day,
        // ensuring the scene gets darker at night.
        this.scene.background = skyColor;
        if (this.scene.fog) {
            this.scene.fog.color = skyColor;
            // Increase fog at night for better night atmosphere
            const isNight = this.timeOfDay < 0.25 || this.timeOfDay > 0.75;
            const nightProgress = isNight ? 
                (this.timeOfDay < 0.25 ? 1 - this.timeOfDay/0.25 : (this.timeOfDay - 0.75)/0.25) : 0;
            this.scene.fog.density = 0.005 + (isNight ? nightProgress * 0.015 : 0); 
        }
    }
    
    getTimeString() {
        const hours = Math.floor(this.timeOfDay * 24);
        const minutes = Math.floor((this.timeOfDay * 24 * 60) % 60);
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    
    getTimeDescription() {
        if (this.timeOfDay < 0.25) {
            return 'Night';
        } else if (this.timeOfDay < 0.4) {
            return 'Morning';
        } else if (this.timeOfDay < 0.6) {
            return 'Day';
        } else if (this.timeOfDay < 0.75) {
            return 'Evening';
        } else {
            return 'Night';
        }
    }

    getWeekday() {
        // For example, assume Day 1 is Monday:
        const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
        return weekdays[(this.dayCount - 1) % 7];
    }
}