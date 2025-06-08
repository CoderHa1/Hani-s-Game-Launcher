import * as THREE from 'three';

export class BuildingSystem {
    constructor(scene, gameState) {
        this.scene = scene;
        this.gameState = gameState;
        this.buildings = new Map(); // Map to store building data
        
        // Building configs
        this.buildingTypes = {
            residential: {
                small_house: { 
                    cost: 200, 
                    capacity: 5,
                    happiness: 0,
                    maintenance: 5,
                    color: 0x8ecae6
                },
                apartment: { 
                    cost: 800, 
                    capacity: 25,
                    happiness: -2,
                    maintenance: 15,
                    color: 0x219ebc
                },
                mansion: { 
                    cost: 1500, 
                    capacity: 8,
                    happiness: 5,
                    maintenance: 25,
                    color: 0x023047
                },
                townhouse: {
                    cost: 500,
                    capacity: 12,
                    happiness: 2,
                    maintenance: 10,
                    color: 0x6497b1
                },
                skyscraper: {
                    cost: 3000,
                    capacity: 50,
                    happiness: -5,
                    maintenance: 40,
                    color: 0x005b96
                },
                duplex: {
                    cost: 350,
                    capacity: 8,
                    happiness: 1,
                    maintenance: 8,
                    color: 0xb3cde0
                }
            },
            commercial: {
                shop: { 
                    cost: 300, 
                    jobs: 5,
                    income: 50,
                    happiness: 1,
                    maintenance: 10,
                    color: 0xfb8500
                },
                office: { 
                    cost: 1000, 
                    jobs: 20,
                    income: 150,
                    happiness: 0,
                    maintenance: 25,
                    color: 0xffb703
                },
                mall: { 
                    cost: 2000, 
                    jobs: 50,
                    income: 300,
                    happiness: 3,
                    maintenance: 50,
                    color: 0xfd9e02
                },
                hotel: {
                    cost: 1500,
                    jobs: 25,
                    income: 200,
                    happiness: 2,
                    maintenance: 30,
                    color: 0xffc300
                },
                restaurant: {
                    cost: 600,
                    jobs: 10,
                    income: 80,
                    happiness: 4,
                    maintenance: 15,
                    color: 0xffb400
                },
                cinema: {
                    cost: 1200,
                    jobs: 15,
                    income: 120,
                    happiness: 5,
                    maintenance: 35,
                    color: 0xffaa00
                }
            },
            industrial: {
                factory: { 
                    cost: 1500, 
                    jobs: 30,
                    income: 200,
                    happiness: -5,
                    pollution: 10,
                    maintenance: 40,
                    color: 0x588157
                },
                warehouse: { 
                    cost: 800, 
                    jobs: 10,
                    income: 100,
                    happiness: -2,
                    pollution: 3,
                    maintenance: 20,
                    color: 0x3a5a40
                },
                power_plant: { 
                    cost: 3000, 
                    jobs: 15,
                    income: 250,
                    happiness: -8,
                    pollution: 20,
                    maintenance: 80,
                    color: 0x344e41
                },
                refinery: {
                    cost: 2500,
                    jobs: 20,
                    income: 220,
                    happiness: -7,
                    pollution: 15,
                    maintenance: 60,
                    color: 0x4c6444
                },
                logistics_center: {
                    cost: 1200,
                    jobs: 25,
                    income: 180,
                    happiness: -3,
                    pollution: 5,
                    maintenance: 30,
                    color: 0x44633f
                },
                data_center: {
                    cost: 2000,
                    jobs: 15,
                    income: 280,
                    happiness: -1,
                    pollution: 2,
                    maintenance: 70,
                    color: 0x2d4024
                }
            },
            civic: {
                park: { 
                    cost: 500, 
                    happiness: 10,
                    maintenance: 15,
                    color: 0x95d5b2
                },
                hospital: { 
                    cost: 2000, 
                    jobs: 40,
                    happiness: 8,
                    maintenance: 100,
                    color: 0xd8f3dc
                },
                school: { 
                    cost: 1500, 
                    jobs: 25,
                    happiness: 5,
                    maintenance: 75,
                    color: 0xb7e4c7
                },
                library: {
                    cost: 1000,
                    jobs: 10,
                    happiness: 6,
                    maintenance: 50,
                    color: 0xd4e2d4
                },
                police_station: {
                    cost: 1200,
                    jobs: 15,
                    happiness: 3,
                    maintenance: 60,
                    color: 0xc6dec6
                },
                fire_station: {
                    cost: 1300,
                    jobs: 12,
                    happiness: 4,
                    maintenance: 65,
                    color: 0x8B0000
                },
                city_hall: {
                    cost: 2500,
                    jobs: 30,
                    happiness: 7,
                    maintenance: 120,
                    color: 0xFFFFF0
                }
            },
            transportation: {
                bus_stop: {
                    cost: 300,
                    happiness: 2,
                    maintenance: 10,
                    color: 0x5e8b7e
                },
                train_station: {
                    cost: 2500,
                    jobs: 20,
                    happiness: 3,
                    maintenance: 80,
                    color: 0x2f6072
                },
                port: {
                    cost: 3000,
                    jobs: 30,
                    income: 200,
                    happiness: 4,
                    maintenance: 100,
                    color: 0x3D5A80
                },
                airport: {
                    cost: 5000,
                    jobs: 50,
                    happiness: 5,
                    pollution: 8,
                    maintenance: 200,
                    color: 0x213e4a
                },
                parking_garage: {
                    cost: 800,
                    jobs: 5,
                    income: 40,
                    maintenance: 20,
                    color: 0x435e6c
                }
            },
            religious: {
                church: {
                    cost: 1200,
                    jobs: 5,
                    happiness: 6,
                    maintenance: 40,
                    color: 0xebefd0
                },
                mosque: {
                    cost: 1200,
                    jobs: 5,
                    happiness: 6,
                    maintenance: 40,
                    color: 0xdaeac8
                },
                temple: {
                    cost: 1200,
                    jobs: 5,
                    happiness: 6,
                    maintenance: 40,
                    color: 0xc9e4c5
                }
            },
            recreational: {
                stadium: {
                    cost: 3000,
                    jobs: 30,
                    income: 150,
                    happiness: 7,
                    maintenance: 100,
                    color: 0xb5c99a
                },
                gym: {
                    cost: 800,
                    jobs: 10,
                    income: 60,
                    happiness: 3,
                    maintenance: 30,
                    color: 0x98b37d
                },
                museum: {
                    cost: 1800,
                    jobs: 15,
                    happiness: 6,
                    maintenance: 70,
                    color: 0x709e56
                }
            },
            farm: {
                farm_house: {
                    cost: 700,
                    jobs: 10,
                    income: 80,
                    happiness: 3,
                    maintenance: 20,
                    color: 0xA52A2A
                },
                farm_field: {
                    cost: 100,
                    income: 20,
                    maintenance: 5,
                    color: 0x7cca46
                }
            },
            road: {
                road: { 
                    cost: 50, 
                    maintenance: 2,
                    color: 0x888888 
                },
                highway: {
                    cost: 150,
                    maintenance: 5,
                    color: 0x666666
                },
                bridge: {
                    cost: 300,
                    maintenance: 8,
                    color: 0x777777
                },
                water_channel: {
                    cost: 200,
                    maintenance: 5,
                    color: 0x4a95cf
                }
            }
        };
        
        // Create geometries for different building types
        this.buildingGeometries = {
            residential: {
                small_house: new THREE.BoxGeometry(0.8, 1, 0.8),
                apartment: new THREE.BoxGeometry(0.8, 3, 0.8),
                mansion: new THREE.BoxGeometry(0.9, 1.5, 0.9),
                townhouse: new THREE.BoxGeometry(0.7, 2, 0.7),
                skyscraper: new THREE.BoxGeometry(0.7, 5, 0.7),
                duplex: new THREE.BoxGeometry(0.85, 1.2, 0.85)
            },
            commercial: {
                shop: new THREE.BoxGeometry(0.8, 1, 0.8),
                office: new THREE.BoxGeometry(0.8, 2, 0.8),
                mall: new THREE.BoxGeometry(0.9, 1.5, 0.9),
                hotel: new THREE.BoxGeometry(0.8, 4, 0.8),
                restaurant: new THREE.CylinderGeometry(0.4, 0.4, 1, 8),
                cinema: new THREE.BoxGeometry(1, 1.2, 1)
            },
            industrial: {
                factory: new THREE.BoxGeometry(0.9, 1.2, 0.9),
                warehouse: new THREE.BoxGeometry(0.9, 1, 0.9),
                power_plant: new THREE.BoxGeometry(0.9, 2, 0.9),
                refinery: new THREE.CylinderGeometry(0.4, 0.4, 2, 8),
                logistics_center: new THREE.BoxGeometry(1, 0.8, 1),
                data_center: new THREE.BoxGeometry(0.8, 1.5, 0.8)
            },
            civic: {
                park: new THREE.SphereGeometry(0.5, 8, 8), 
                hospital: new THREE.BoxGeometry(0.9, 1.5, 0.9),
                school: new THREE.BoxGeometry(0.9, 1.2, 0.9),
                library: new THREE.BoxGeometry(0.8, 1.3, 0.8),
                police_station: new THREE.BoxGeometry(0.7, 1.1, 0.7),
                fire_station: new THREE.BoxGeometry(0.75, 1.2, 0.75),
                city_hall: new THREE.BoxGeometry(1, 2, 1)
            },
            transportation: {
                bus_stop: new THREE.BoxGeometry(0.3, 0.5, 0.3),
                train_station: new THREE.BoxGeometry(1.2, 1, 1.2),
                port: new THREE.BoxGeometry(1.2, 0.6, 1.2),
                airport: new THREE.BoxGeometry(1.5, 0.8, 1.5),
                parking_garage: new THREE.BoxGeometry(1, 1.8, 1)
            },
            religious: {
                church: new THREE.BoxGeometry(0.8, 1.5, 0.8),
                mosque: new THREE.BoxGeometry(0.8, 1.0, 0.8),
                temple: new THREE.BoxGeometry(0.8, 1.4, 0.8)
            },
            recreational: {
                stadium: new THREE.CylinderGeometry(0.8, 0.8, 0.5, 16),
                gym: new THREE.BoxGeometry(0.7, 0.9, 0.7),
                museum: new THREE.BoxGeometry(1, 1.1, 1)
            },
            farm: {
                farm_house: new THREE.BoxGeometry(0.8, 1.2, 0.8),
                farm_field: new THREE.BoxGeometry(0.9, 0.1, 0.9)
            },
            road: {
                road: new THREE.BoxGeometry(1, 0.1, 1),
                highway: new THREE.BoxGeometry(1.2, 0.15, 1.2),
                bridge: new THREE.BoxGeometry(1, 0.2, 1.5),
                water_channel: new THREE.BoxGeometry(1, 0.3, 1)
            }
        };
        
        // Create materials for different building types
        this.buildingMaterials = {};
        
        for (const category in this.buildingTypes) {
            this.buildingMaterials[category] = {};
            
            for (const type in this.buildingTypes[category]) {
                const color = this.buildingTypes[category][type].color;
                if (category === 'civic' && type === 'park') {
                    this.buildingMaterials[category][type] = new THREE.MeshStandardMaterial({
                        color: color,
                        roughness: 0.9,
                        metalness: 0.0
                    });
                } else {
                    this.buildingMaterials[category][type] = new THREE.MeshStandardMaterial({
                        color: color,
                        roughness: 0.7,
                        metalness: 0.2
                    });
                }
            }
        }
    }
    
    placeBuilding(x, z, category, type, freePlacement = false) {
        // Check if there's already a building at this position
        if (this.buildings.has(`${x},${z}`)) {
            return false;
        }
        
        const buildingConfig = this.buildingTypes[category][type];
        if (!buildingConfig) return false;
        
        // When not in free placement mode, require sufficient funds and deduct cost.
        if (!freePlacement) {
            if (this.gameState.money < buildingConfig.cost) {
                return false;
            }
            this.gameState.money -= buildingConfig.cost;
        }
        
        // Get terrain height at position
        const terrainHeight = this.getTerrainHeightAt(x, z);
        if (terrainHeight === null) {
            return false;
        }
        
        // Create building mesh
        const geometry = this.buildingGeometries[category][type];
        const material = this.buildingMaterials[category][type];
        const building = new THREE.Mesh(geometry, material);
        
        // Position the building appropriately
        // For roads, position them right at the terrain level with small height
        // For other buildings, position them on top of the terrain
        if (category === 'road') {
            // Raise roads higher above the terrain and adjust rendering so they are visible
            const roadOffset = 0.3; // Increased offset for better visibility
            building.position.set(x, terrainHeight + roadOffset, z);
            
            // Special material for water channels
            if (type === 'water_channel') {
                building.material = new THREE.MeshStandardMaterial({
                    color: 0x4a95cf, // Water blue color
                    transparent: true,
                    opacity: 0.8,
                    roughness: 0.1,
                    metalness: 0.2,
                    polygonOffset: true,
                    polygonOffsetFactor: -1,
                    polygonOffsetUnits: -4
                });
            } else {
                // Use middle-grey color for roads instead of light-brown
                building.material = new THREE.MeshStandardMaterial({
                    color: 0x888888, // Middle-grey color for roads (changed from 0xA97D4C)
                    roughness: 0.7,
                    metalness: 0.1,
                    polygonOffset: true,
                    polygonOffsetFactor: -1,
                    polygonOffsetUnits: -4
                });
            }
            // Ensure roads are rendered on top of terrain
            building.renderOrder = 10;
        } else if (category === 'civic' && type === 'park') {
            building.position.set(x, terrainHeight + 0.3, z);
        } else if (category === 'farm' && type === 'farm_field') {
            // Position farm fields at ground level with a slightly larger offset to ensure visibility
            building.position.set(x, terrainHeight + 0.35, z);
        } else {
            // Position buildings so they sit properly on top of the terrain
            // Increased the overall height positioning by adjusting the division factor
            building.position.set(x, terrainHeight + (geometry.parameters.height / 1.5), z);
            
            // Special adjustment for skyscrapers and apartments to make them touch the ground
            if ((category === 'residential' && type === 'skyscraper') || 
                (category === 'residential' && type === 'apartment')) {
                building.position.y = terrainHeight + (geometry.parameters.height / 2);
            }
            
            // Add windows to buildings except for roads, parks, and farm fields
            if (!(category === 'farm' && type === 'farm_field')) {
                this.addWindowsToBuilding(building, category, type);
            }
        }
        
        // Add Red Cross on top of hospital buildings
        if (category === 'civic' && type === 'hospital') {
            // Create horizontal part of cross
            const horizontalGeometry = new THREE.BoxGeometry(0.6, 0.08, 0.2);
            const crossMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
            const horizontalCross = new THREE.Mesh(horizontalGeometry, crossMaterial);
            horizontalCross.position.y = geometry.parameters.height / 2 + 0.1;
            building.add(horizontalCross);
            
            // Create vertical part of cross
            const verticalGeometry = new THREE.BoxGeometry(0.2, 0.08, 0.6);
            const verticalCross = new THREE.Mesh(verticalGeometry, crossMaterial);
            verticalCross.position.y = geometry.parameters.height / 2 + 0.1;
            building.add(verticalCross);
        }
        
        // Add gear symbol on top of factory buildings
        if (category === 'industrial' && type === 'factory') {
            // Create gear base (cylinder)
            const gearBaseGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.08, 12);
            const gearMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
            const gearBase = new THREE.Mesh(gearBaseGeometry, gearMaterial);
            gearBase.position.y = geometry.parameters.height / 2 + 0.1;
            building.add(gearBase);
            
            // Create gear teeth as small boxes arranged in a circle
            const teethCount = 8;
            for (let i = 0; i < teethCount; i++) {
                const angle = (i / teethCount) * Math.PI * 2;
                const toothGeometry = new THREE.BoxGeometry(0.08, 0.1, 0.08);
                const tooth = new THREE.Mesh(toothGeometry, gearMaterial);
                const radius = 0.25;
                tooth.position.x = Math.cos(angle) * radius;
                tooth.position.z = Math.sin(angle) * radius;
                tooth.position.y = geometry.parameters.height / 2 + 0.1;
                tooth.rotation.y = angle;
                building.add(tooth);
            }
            
            // Add center hole
            const holeGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.1, 12);
            const holeMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
            const hole = new THREE.Mesh(holeGeometry, holeMaterial);
            hole.position.y = geometry.parameters.height / 2 + 0.15;
            building.add(hole);
        }
        
        // Add atom symbol on top of power plant buildings
        if (category === 'industrial' && type === 'power_plant') {
            // Create nucleus (central sphere)
            const nucleusGeometry = new THREE.SphereGeometry(0.15, 8, 8);
            const nucleusMaterial = new THREE.MeshStandardMaterial({ color: 0x0088ff });
            const nucleus = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
            nucleus.position.y = geometry.parameters.height * 1.3; // Positioned higher, near the top of the building
            building.add(nucleus);
            
            // Create electron orbits (rings)
            const orbit1 = new THREE.RingGeometry(0.25, 0.28, 16);
            const orbit2 = new THREE.RingGeometry(0.25, 0.28, 16);
            const orbit3 = new THREE.RingGeometry(0.25, 0.28, 16);
            const orbitMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x00aaff, 
                side: THREE.DoubleSide 
            });
            
            const orbitMesh1 = new THREE.Mesh(orbit1, orbitMaterial);
            const orbitMesh2 = new THREE.Mesh(orbit2, orbitMaterial);
            const orbitMesh3 = new THREE.Mesh(orbit3, orbitMaterial);
            
            // Position and rotate orbits differently
            orbitMesh1.position.y = geometry.parameters.height * 1.3;
            orbitMesh2.position.y = geometry.parameters.height * 1.3;
            orbitMesh3.position.y = geometry.parameters.height * 1.3;
            
            orbitMesh1.rotation.x = Math.PI / 2;
            orbitMesh2.rotation.x = Math.PI / 4;
            orbitMesh3.rotation.x = Math.PI / 2;
            orbitMesh3.rotation.y = Math.PI / 2;
            
            building.add(orbitMesh1);
            building.add(orbitMesh2);
            building.add(orbitMesh3);
            
            // Add electrons (small spheres) on the orbits
            const electronGeometry = new THREE.SphereGeometry(0.04, 6, 6);
            const electronMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
            
            const positions = [
                { x: 0.25, y: 0, z: 0 },
                { x: -0.125, y: 0, z: 0.217 },
                { x: 0, y: 0.217, z: 0.125 }
            ];
            
            positions.forEach(pos => {
                const electron = new THREE.Mesh(electronGeometry, electronMaterial);
                electron.position.set(
                    nucleus.position.x + pos.x,
                    nucleus.position.y + pos.y,
                    nucleus.position.z + pos.z
                );
                building.add(electron);
            });
        }
        
        // Add shopping bag symbol on top of shop buildings
        if (category === 'commercial' && type === 'shop') {
            // Create burger bun bottom
            const bottomBunGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 16);
            const bunMaterial = new THREE.MeshStandardMaterial({ color: 0xF5DEB3 }); // Wheat color
            const bottomBun = new THREE.Mesh(bottomBunGeometry, bunMaterial);
            bottomBun.position.y = geometry.parameters.height / 2 + 0.1;
            building.add(bottomBun);
            
            // Create burger patty
            const pattyGeometry = new THREE.CylinderGeometry(0.18, 0.18, 0.05, 16);
            const pattyMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brown color
            const patty = new THREE.Mesh(pattyGeometry, pattyMaterial);
            patty.position.y = geometry.parameters.height / 2 + 0.15;
            building.add(patty);
            
            // Create cheese slice
            const cheeseGeometry = new THREE.CylinderGeometry(0.19, 0.19, 0.02, 16);
            const cheeseMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700 }); // Gold color
            const cheese = new THREE.Mesh(cheeseGeometry, cheeseMaterial);
            cheese.position.y = geometry.parameters.height / 2 + 0.18;
            building.add(cheese);
            
            // Create burger bun top
            const topBunGeometry = new THREE.BoxGeometry(0.2, 0.08, 0.2);
            const topBun = new THREE.Mesh(topBunGeometry, bunMaterial);
            topBun.position.y = geometry.parameters.height / 2 + 0.23;
            building.add(topBun);
        }
        
        // Add pizza symbol on top of restaurant buildings
        if (category === 'commercial' && type === 'restaurant') {
            // Create pizza base (thin cylinder)
            const pizzaBaseGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.03, 16);
            const crustMaterial = new THREE.MeshStandardMaterial({ color: 0xE2C499 }); // Crust color
            const pizzaBase = new THREE.Mesh(pizzaBaseGeometry, crustMaterial);
            pizzaBase.position.y = geometry.parameters.height / 2 + 0.1;
            building.add(pizzaBase);
            
            // Create pizza topping (slightly smaller cylinder with red sauce)
            const toppingGeometry = new THREE.CylinderGeometry(0.23, 0.23, 0.02, 16);
            const sauceMaterial = new THREE.MeshStandardMaterial({ color: 0xD03C30 }); // Tomato sauce red
            const topping = new THREE.Mesh(toppingGeometry, sauceMaterial);
            topping.position.y = geometry.parameters.height / 2 + 0.12;
            building.add(topping);
            
            // Add cheese (yellow dots)
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const radius = 0.15;
                const cheeseGeometry = new THREE.SphereGeometry(0.03, 8, 8);
                const cheeseMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700 }); // Cheese color
                const cheese = new THREE.Mesh(cheeseGeometry, cheeseMaterial);
                cheese.position.set(
                    Math.cos(angle) * radius,
                    geometry.parameters.height / 2 + 0.13,
                    Math.sin(angle) * radius
                );
                building.add(cheese);
            }
            
            // Add pepperoni (red circles)
            for (let i = 0; i < 5; i++) {
                const angle = (i / 5) * Math.PI * 2;
                const radius = 0.1;
                const pepperoniGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.01, 8);
                const pepperoniMaterial = new THREE.MeshStandardMaterial({ color: 0xAA0000 }); // Pepperoni red
                const pepperoni = new THREE.Mesh(pepperoniGeometry, pepperoniMaterial);
                pepperoni.position.set(
                    Math.cos(angle) * radius,
                    geometry.parameters.height / 2 + 0.14,
                    Math.sin(angle) * radius
                );
                building.add(pepperoni);
            }
            
            // Add a slice cut (triangle cutout)
            const sliceMarkerGeometry = new THREE.BoxGeometry(0.02, 0.01, 0.2);
            const sliceMarkerMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
            const sliceMarker = new THREE.Mesh(sliceMarkerGeometry, sliceMarkerMaterial);
            sliceMarker.position.set(0, geometry.parameters.height / 2 + 0.14, 0.05);
            sliceMarker.rotation.y = Math.PI / 4;
            building.add(sliceMarker);
        }
        
        // Add office symbol (laptop/computer) on top of office buildings
        if (category === 'commercial' && type === 'office') {
            // Create laptop base
            const laptopBaseGeometry = new THREE.BoxGeometry(0.4, 0.02, 0.3);
            const laptopMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 }); // Gray color
            const laptopBase = new THREE.Mesh(laptopBaseGeometry, laptopMaterial);
            laptopBase.position.y = geometry.parameters.height / 2 + 0.15;
            building.add(laptopBase);
            
            // Create laptop screen
            const screenGeometry = new THREE.BoxGeometry(0.35, 0.25, 0.02);
            const screenMaterial = new THREE.MeshStandardMaterial({ color: 0x2196F3 }); // Blue color
            const screen = new THREE.Mesh(screenGeometry, screenMaterial);
            screen.position.set(0, geometry.parameters.height / 2 + 0.28, -0.14);
            screen.rotation.set(Math.PI/6, 0, 0); // Tilt the screen slightly
            building.add(screen);
            
            // Create laptop keyboard
            const keyboardGeometry = new THREE.BoxGeometry(0.3, 0.01, 0.2);
            const keyboardMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 }); // Dark gray
            const keyboard = new THREE.Mesh(keyboardGeometry, keyboardMaterial);
            keyboard.position.set(0, geometry.parameters.height / 2 + 0.16, 0.05);
            building.add(keyboard);
        }

        // Add letter symbol (envelope) on top of mall buildings
        if (category === 'commercial' && type === 'mall') {
            // Create shopping bag base
            const bagGeometry = new THREE.BoxGeometry(0.5, 0.4, 0.3);
            const bagMaterial = new THREE.MeshStandardMaterial({ color: 0xA0522D }); // Brown color
            const bag = new THREE.Mesh(bagGeometry, bagMaterial);
            bag.position.y = geometry.parameters.height / 2 + 0.25;
            building.add(bag);
            
            // Add bag handles (curved cylinders)
            const handleGeometry = new THREE.TorusGeometry(0.15, 0.03, 8, 12, Math.PI);
            const handleMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Darker brown
            
            // Left handle
            const leftHandle = new THREE.Mesh(handleGeometry, handleMaterial);
            leftHandle.position.set(-0.12, geometry.parameters.height / 2 + 0.5, 0);
            leftHandle.rotation.set(0, 0, Math.PI / 2);
            building.add(leftHandle);
            
            // Right handle
            const rightHandle = new THREE.Mesh(handleGeometry, handleMaterial);
            rightHandle.position.set(0.12, geometry.parameters.height / 2 + 0.5, 0);
            rightHandle.rotation.set(0, 0, Math.PI / 2);
            building.add(rightHandle);
            
            // Add a decorative element on the bag (like a logo)
            const logoGeometry = new THREE.CircleGeometry(0.12, 12);
            const logoMaterial = new THREE.MeshStandardMaterial({ color: 0xFFD700 }); // Gold color
            const logo = new THREE.Mesh(logoGeometry, logoMaterial);
            logo.position.set(0, geometry.parameters.height / 2 + 0.25, 0.16);
            logo.rotation.x = -Math.PI / 6; // Tilt slightly to face upward
            building.add(logo);
        }
        
        // Add book symbol on top of school buildings
        if (category === 'civic' && type === 'school') {
            // Create book base
            const bookGeometry = new THREE.BoxGeometry(0.5, 0.08, 0.4);
            const bookMaterial = new THREE.MeshStandardMaterial({ color: 0x2196F3 }); // Blue color
            const book = new THREE.Mesh(bookGeometry, bookMaterial);
            book.position.y = geometry.parameters.height / 2 + 0.15;
            building.add(book);
            
            // Create book pages (thin white box inside)
            const pagesGeometry = new THREE.BoxGeometry(0.45, 0.05, 0.35);
            const pagesMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF }); // White color
            const pages = new THREE.Mesh(pagesGeometry, pagesMaterial);
            pages.position.y = geometry.parameters.height / 2 + 0.19;
            building.add(pages);
            
            // Create book binding (on the side)
            const bindingGeometry = new THREE.BoxGeometry(0.05, 0.1, 0.4);
            const bindingMaterial = new THREE.MeshStandardMaterial({ color: 0x0D47A1 }); // Darker blue
            const binding = new THREE.Mesh(bindingGeometry, bindingMaterial);
            binding.position.set(-0.25, geometry.parameters.height / 2 + 0.16, 0);
            building.add(binding);
        }
        
        // Add fire symbol on top of fire station
        if (category === 'civic' && type === 'fire_station') {
            // Add fire symbol on top of fire station
            const flameGeometry = new THREE.ConeGeometry(0.25, 0.5, 8);
            const flameMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xff3d00, // Bright red-orange for fire
                emissive: 0xff5722,
                emissiveIntensity: 0.3
            });
            const flame = new THREE.Mesh(flameGeometry, flameMaterial);
            flame.position.y = geometry.parameters.height / 2 + 0.25;
            building.add(flame);
            
            // Add smaller flames around the main one for more realistic fire look
            for (let i = 0; i < 3; i++) {
                const angle = (i / 3) * Math.PI * 2;
                const smallFlameGeometry = new THREE.ConeGeometry(0.12, 0.3, 6);
                const smallFlame = new THREE.Mesh(smallFlameGeometry, flameMaterial);
                smallFlame.position.set(
                    Math.cos(angle) * 0.15,
                    geometry.parameters.height / 2 + 0.15,
                    Math.sin(angle) * 0.15
                );
                building.add(smallFlame);
            }
        }
        
        building.castShadow = true;
        building.receiveShadow = true;
        this.scene.add(building);
        
        // Store building data
        const buildingData = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            category,
            type,
            x,
            z,
            mesh: building,
            constructed: this.gameState.dayCount,
            ...buildingConfig
        };
        this.buildings.set(`${x},${z}`, buildingData);
        
        // Update game state counters
        this.gameState.buildings[category]++;
        this.gameState.stats.buildingsConstructed++;
        
        // Dispatch event if residential building is placed (for notifications)
        if (category === 'residential') {
            // Immediately increase population when residential building is placed
            const populationIncrease = Math.floor(buildingData.capacity * 0.7); // Fill to 70% capacity initially
            this.gameState.population += populationIncrease;
            
            document.dispatchEvent(new CustomEvent('game:newResidential', { 
                detail: { type, capacity: buildingData.capacity, populationIncrease }
            }));
        }
        
        // Notify car system when a new road is placed
        if (category === 'road' && this.scene.userData.game && this.scene.userData.game.carSystem) {
            // Potentially add a new car when road network expands
            if (Math.random() < 0.3) { // 30% chance to add a new car when a road is built
                this.scene.userData.game.carSystem.spawnCars(1);
            }
        }
        
        // Spawn a ship when a new port is built
        if (category === 'transportation' && type === 'port' && this.scene.userData.game && this.scene.userData.game.shipSystem) {
            setTimeout(() => {
                this.scene.userData.game.shipSystem.createShip(buildingData);
            }, 2000); // Small delay before first ship appears
        }
        
        // Spawn a plane when a new airport is built
        if (category === 'transportation' && type === 'airport' && this.scene.userData.game && this.scene.userData.game.airCargoSystem) {
            setTimeout(() => {
                this.scene.userData.game.airCargoSystem.createPlane(buildingData);
            }, 2000); // Small delay before first plane appears
        }
        
        // Spawn a boat when a water channel is built
        if (category === 'road' && type === 'water_channel' && this.scene.userData.game && this.scene.userData.game.boatSystem) {
            // Get current number of water channels
            const waterChannels = this.getBuildingsByType('road').filter(b => b.type === 'water_channel');
            const waterChannelCount = waterChannels.length;
            
            // Check if this is a brand new channel (not connected to any existing channels)
            let isNewChannel = true;
            const directions = [
                { dx: 1, dz: 0 },  // East
                { dx: -1, dz: 0 }, // West
                { dx: 0, dz: 1 },  // North
                { dx: 0, dz: -1 }  // South
                // Removed diagonal checks
            ];
            
            for (const dir of directions) {
                const nx = x + dir.dx;
                const nz = z + dir.dz;
                const key = `${nx},${nz}`;
                
                if (this.buildings.has(key)) {
                    const building = this.buildings.get(key);
                    if (building.category === 'road' && building.type === 'water_channel') {
                        isNewChannel = false;
                        break;
                    }
                }
            }
            
            // Add a boat if:
            // 1. Every 4th water channel is placed
            // 2. Or it's a new independent channel
            if (waterChannelCount % 4 === 0 || isNewChannel) {
                setTimeout(() => {
                    this.scene.userData.game.boatSystem.createBoat(buildingData);
                }, 500); // Small delay before boat appears
            }
        }
        
        // Add farm house features
        if (category === 'farm' && type === 'farm_house') {
            this.addFarmFeatures(building, geometry.parameters.width, geometry.parameters.depth, geometry.parameters.height);
        }
        
        // Add a grid pattern to farm fields
        if (category === 'farm' && type === 'farm_field') {
            this.addFarmFieldPattern(building);
        }
        
        return true;
    }
    
    addWindowsToBuilding(building, category, type) {
        // Skip roads and parks
        if (category === 'road' || (category === 'civic' && type === 'park')) {
            return;
        }
        
        const buildingHeight = building.geometry.parameters.height;
        const buildingWidth = building.geometry.parameters.width;
        const buildingDepth = building.geometry.parameters.depth;
        
        // Create window material
        const windowMaterial = new THREE.MeshStandardMaterial({
            color: 0x87CEEB, // Light blue for windows
            transparent: true,
            opacity: 0.7,
            metalness: 0.8,
            roughness: 0.2
        });
        
        // Create glowing window material for night
        const glowingWindowMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFF176, // Warm yellow light
            transparent: true,
            opacity: 0.9,
            emissive: 0xFFF176,
            emissiveIntensity: 0.5,
            metalness: 0.3,
            roughness: 0.2
        });
        
        // Determine number of window rows and columns based on building size
        let rowCount, colCount;
        
        if (buildingHeight > 2) {
            // Tall buildings like apartments and offices
            rowCount = Math.ceil(buildingHeight * 2);
            colCount = 4;
        } else if (buildingHeight > 1) {
            // Medium buildings
            rowCount = Math.ceil(buildingHeight * 1.5);
            colCount = 3;
        } else {
            // Small buildings
            rowCount = 1;
            colCount = 2;
        }
        
        // Window dimensions
        const windowWidth = buildingWidth * 0.15;
        const windowHeight = buildingHeight * 0.15;
        const windowDepth = 0.05;
        
        // Window spacing
        const spacingX = buildingWidth * 0.7 / colCount;
        const spacingY = buildingHeight * 0.7 / rowCount;
        const startY = -buildingHeight / 2 + spacingY;
        
        // Window geometry
        const windowGeometry = new THREE.BoxGeometry(windowWidth, windowHeight, windowDepth);
        
        // Add windows to all four sides of the building
        const sides = [
            { axis: 'z', sign: 1, rotation: 0 },
            { axis: 'x', sign: 1, rotation: Math.PI / 2 },
            { axis: 'z', sign: -1, rotation: Math.PI },
            { axis: 'x', sign: -1, rotation: -Math.PI / 2 }
        ];
        
        sides.forEach(side => {
            for (let row = 0; row < rowCount; row++) {
                for (let col = 0; col < colCount; col++) {
                    // Randomly decide if this window will be lit at night
                    const willLightUp = Math.random() < 0.7; // 70% of windows will light up at night
                    
                    // Create window with appropriate material
                    const window = new THREE.Mesh(windowGeometry, windowMaterial);
                    
                    // Position windows along the building face
                    const xOffset = side.axis === 'z' ? 
                        (-buildingWidth / 2 + spacingX * (col + 0.5)) : 
                        (side.sign * (buildingDepth / 2 + 0.025));
                    
                    const zOffset = side.axis === 'x' ? 
                        (-buildingDepth / 2 + spacingX * (col + 0.5)) : 
                        (side.sign * (buildingWidth / 2 + 0.025));
                    
                    const yPos = startY + spacingY * row;
                    
                    window.position.set(xOffset, yPos, zOffset);
                    
                    // Rotate windows to face outward
                    if (side.axis === 'x') {
                        window.rotation.y = side.rotation;
                    }
                    
                    // Store if this window should light up at night
                    if (willLightUp) {
                        window.userData.isLightable = true;
                        window.userData.dayMaterial = windowMaterial;
                        window.userData.nightMaterial = glowingWindowMaterial;
                    }
                    
                    building.add(window);
                }
            }
        });
        
        // Special facade details for certain building types
        if (category === 'commercial') {
            // Add storefront for commercial buildings
            this.addStorefront(building, buildingWidth, buildingDepth, buildingHeight);
        } else if (category === 'civic' && type === 'hospital') {
            // Add entrance for hospital
            this.addBuildingEntrance(building, buildingWidth, buildingDepth, buildingHeight, 0xFFFFFF);
        } else if (category === 'residential' && type === 'apartment') {
            // Add balconies for apartments
            this.addBalconies(building, buildingWidth, buildingDepth, buildingHeight);
        } else if (category === 'industrial') {
            // Add industrial features like pipes, vents, and loading docks
            this.addIndustrialFeatures(building, buildingWidth, buildingDepth, buildingHeight, type);
        } else if (category === 'residential' && type === 'mansion') {
            // Add luxury features to mansions
            this.addMansionFeatures(building, buildingWidth, buildingDepth, buildingHeight);
        } else if (category === 'civic' && type === 'school') {
            // Add school features like flagpole and playground elements
            this.addSchoolFeatures(building, buildingWidth, buildingDepth, buildingHeight);
        } else if (category === 'transportation') {
            // Add transportation-specific features
            this.addTransportationFeatures(building, buildingWidth, buildingDepth, buildingHeight, type);
        } else if (category === 'religious') {
            // Add religious building features
            this.addReligiousFeatures(building, buildingWidth, buildingDepth, buildingHeight, type);
        } else if (category === 'recreational') {
            // Add recreational building features
            this.addRecreationalFeatures(building, buildingWidth, buildingDepth, buildingHeight, type);
        }
        
        // Add roof details to all buildings except roads and parks
        this.addRoofDetails(building, category, type, buildingWidth, buildingDepth, buildingHeight);
    }
    
    addRoofDetails(building, category, type, width, depth, height) {
        // Skip roads and parks
        if (category === 'road' || (category === 'civic' && type === 'park')) {
            return;
        }
        
        // Create different roof types based on building category
        if (category === 'residential' && type !== 'apartment') {
            // Pitched roof for houses
            const roofGeometry = new THREE.ConeGeometry(Math.max(width, depth) * 0.75, height * 0.5, 4);
            const roofMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x8B4513, // Brown
                roughness: 0.8
            });
            
            const roof = new THREE.Mesh(roofGeometry, roofMaterial);
            roof.position.y = height / 2 + height * 0.25;
            roof.rotation.y = Math.PI / 4; // Rotate to align corners with building
            building.add(roof);
            
        } else if (type === 'apartment' || category === 'commercial' || (category === 'industrial' && type !== 'power_plant')) {
            // Flat roof with details like AC units, vents, water towers
            
            // Main roof surface
            const roofGeometry = new THREE.BoxGeometry(width * 0.95, 0.05, depth * 0.95);
            const roofMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x333333, // Dark gray 
                roughness: 0.9
            });
            
            const roof = new THREE.Mesh(roofGeometry, roofMaterial);
            roof.position.y = height / 2 + 0.025;
            building.add(roof);
            
            // Add random roof equipment
            const equipmentCount = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < equipmentCount; i++) {
                // AC units, ventilation, water tanks, etc.
                const equipType = Math.floor(Math.random() * 3);
                let equipMesh;
                
                if (equipType === 0) {
                    // AC unit
                    const acGeometry = new THREE.BoxGeometry(0.2, 0.1, 0.2);
                    const acMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
                    equipMesh = new THREE.Mesh(acGeometry, acMaterial);
                } else if (equipType === 1) {
                    // Ventilation
                    const ventGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.15, 8);
                    const ventMaterial = new THREE.MeshStandardMaterial({ color: 0x777777 });
                    equipMesh = new THREE.Mesh(ventGeometry, ventMaterial);
                } else {
                    // Water tank (for larger buildings)
                    if (height > 1.5) {
                        const tankGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.25, 8);
                        const tankMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
                        equipMesh = new THREE.Mesh(tankGeometry, tankMaterial);
                    } else {
                        const satelliteGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.02, 8);
                        const dishGeometry = new THREE.SphereGeometry(0.1, 8, 4, 0, Math.PI);
                        const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
                        const dishMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
                        
                        equipMesh = new THREE.Group();
                        const base = new THREE.Mesh(satelliteGeometry, baseMaterial);
                        const dish = new THREE.Mesh(dishGeometry, dishMaterial);
                        
                        dish.rotation.x = -Math.PI / 2;
                        dish.position.y = 0.02;
                        
                        equipMesh.add(base);
                        equipMesh.add(dish);
                    }
                }
                
                // Position on roof
                equipMesh.position.set(
                    (Math.random() - 0.5) * width * 0.7,
                    height / 2 + 0.1,
                    (Math.random() - 0.5) * depth * 0.7
                );
                
                building.add(equipMesh);
            }
        } else if (category === 'civic') {
            // Civic buildings get decorative roofs
            
            if (type === 'hospital') {
                // Hospital gets a helipad
                const padGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.03, 16);
                const padMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
                const helipad = new THREE.Mesh(padGeometry, padMaterial);
                helipad.position.y = height / 2 + 0.015;
                building.add(helipad);
                
                // "H" marking
                const markingGeometry = new THREE.BoxGeometry(0.2, 0.01, 0.05);
                const markingMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
                const hBar1 = new THREE.Mesh(markingGeometry, markingMaterial);
                hBar1.position.y = height / 2 + 0.03;
                building.add(hBar1);
                
                const hBar2 = new THREE.Mesh(markingGeometry, markingMaterial);
                hBar2.position.y = height / 2 + 0.03;
                hBar2.rotation.y = Math.PI / 2;
                building.add(hBar2);
            } else if (type === 'police_station') {
                // Police station gets a sheriff star
                const starPoints = 5;
                const outerRadius = 0.25;
                const innerRadius = 0.1;
                const starShape = new THREE.Shape();
                
                for (let i = 0; i < starPoints * 2; i++) {
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const angle = (i / (starPoints * 2)) * Math.PI * 2;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    
                    if (i === 0) {
                        starShape.moveTo(x, y);
                    } else {
                        starShape.lineTo(x, y);
                    }
                }
                
                starShape.closePath();
                const starGeometry = new THREE.ExtrudeGeometry(starShape, {
                    depth: 0.05,
                    bevelEnabled: false
                });
                
                const starMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0xFFD700, // Gold/yellow color
                    metalness: 0.5,
                    roughness: 0.3
                });
                
                const star = new THREE.Mesh(starGeometry, starMaterial);
                star.position.set(0, height / 2 + 0.025, 0);
                star.rotation.x = -Math.PI / 2; // Lay flat on roof
                building.add(star);
            } else if (type === 'fire_station') {
                // Fire station gets a fire symbol
                const flameGeometry = new THREE.ConeGeometry(0.25, 0.5, 8);
                const flameMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0xff3d00, // Bright red-orange for fire
                    emissive: 0xff5722,
                    emissiveIntensity: 0.3
                });
                const flame = new THREE.Mesh(flameGeometry, flameMaterial);
                flame.position.y = height / 2 + 0.25;
                building.add(flame);
                
                // Add smaller flames around the main one for more realistic fire look
                for (let i = 0; i < 3; i++) {
                    const angle = (i / 3) * Math.PI * 2;
                    const smallFlameGeometry = new THREE.ConeGeometry(0.12, 0.3, 6);
                    const smallFlame = new THREE.Mesh(smallFlameGeometry, flameMaterial);
                    smallFlame.position.set(
                        Math.cos(angle) * 0.15,
                        height / 2 + 0.15,
                        Math.sin(angle) * 0.15
                    );
                    building.add(smallFlame);
                }
            } else {
                // Other civic buildings get decorative domes or spires
                const domeGeometry = new THREE.SphereGeometry(Math.min(width, depth) * 0.3, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
                const domeMaterial = new THREE.MeshStandardMaterial({ 
                    color: 0xDDDDDD,
                    metalness: 0.3,
                    roughness: 0.6
                });
                
                const dome = new THREE.Mesh(domeGeometry, domeMaterial);
                dome.position.y = height / 2;
                building.add(dome);
            }
        }
    }
    
    addBalconies(building, width, depth, height) {
        // Add balconies on different floors
        const floorCount = Math.floor(height * 2.5);
        
        for (let floor = 1; floor < floorCount; floor++) {
            // Alternate between front and sides for variety
            if (floor % 2 === 0) {
                // Front balcony
                const balconyGeometry = new THREE.BoxGeometry(width * 0.6, height * 0.05, depth * 0.15);
                const balconyMaterial = new THREE.MeshStandardMaterial({ color: 0xCCCCCC });
                const balcony = new THREE.Mesh(balconyGeometry, balconyMaterial);
                balcony.position.set(0, -height * 0.5 + (floor / floorCount) * height, depth / 2);
                building.add(balcony);
                
                // Railings
                const railingGeometry = new THREE.BoxGeometry(width * 0.6, height * 0.1, 0.02);
                const railingMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
                const railing = new THREE.Mesh(railingGeometry, railingMaterial);
                railing.position.set(0, -height * 0.5 + (floor / floorCount) * height + height * 0.075, depth / 2 + 0.07);
                building.add(railing);
            } else {
                // Side balconies
                for (let side = -1; side <= 1; side += 2) {
                    const balconyGeometry = new THREE.BoxGeometry(width * 0.15, height * 0.05, depth * 0.6);
                    const balconyMaterial = new THREE.MeshStandardMaterial({ color: 0xCCCCCC });
                    const balcony = new THREE.Mesh(balconyGeometry, balconyMaterial);
                    balcony.position.set(side * (width / 2), -height * 0.5 + (floor / floorCount) * height, 0);
                    building.add(balcony);
                    
                    // Railings
                    const railingGeometry = new THREE.BoxGeometry(0.02, height * 0.1, depth * 0.6);
                    const railingMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
                    const railing = new THREE.Mesh(railingGeometry, railingMaterial);
                    railing.position.set(side * (width / 2 + 0.07), -height * 0.5 + (floor / floorCount) * height + height * 0.075, 0);
                    building.add(railing);
                }
            }
        }
    }
    
    addIndustrialFeatures(building, width, depth, height, type) {
        // Add industrial features based on building type
        if (type === 'factory') {
            // Add chimney
            const chimneyGeometry = new THREE.CylinderGeometry(0.15, 0.2, height * 1.2, 8);
            const chimneyMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
            const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
            chimney.position.set(width * 0.25, height * 0.6, depth * 0.25);
            building.add(chimney);
            
            // Add smoke particles (just for show)
            const smokeGeometry = new THREE.SphereGeometry(0.2, 8, 8);
            const smokeMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xDDDDDD,
                transparent: true,
                opacity: 0.7
            });
            
            for (let i = 0; i < 3; i++) {
                const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
                smoke.position.set(
                    width * 0.25,
                    height * (1.2 + i * 0.3),
                    depth * 0.25
                );
                smoke.scale.set(
                    0.7 + i * 0.3,
                    0.7 + i * 0.3,
                    0.7 + i * 0.3
                );
                building.add(smoke);
            }
        } else if (type === 'warehouse') {
            // Add loading dock
            const dockGeometry = new THREE.BoxGeometry(width * 0.5, height * 0.1, depth * 0.2);
            const dockMaterial = new THREE.MeshStandardMaterial({ color: 0x777777 });
            const dock = new THREE.Mesh(dockGeometry, dockMaterial);
            dock.position.set(0, -height * 0.45, depth * 0.6);
            building.add(dock);
            
            // Add warehouse door
            const doorGeometry = new THREE.BoxGeometry(width * 0.4, height * 0.3, 0.05);
            const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
            const door = new THREE.Mesh(doorGeometry, doorMaterial);
            door.position.set(0, -height * 0.35, depth / 2 + 0.03);
            building.add(door);
        } else if (type === 'power_plant') {
            // Add cooling towers
            for (let i = -1; i <= 1; i += 2) {
                const towerGeometry = new THREE.CylinderGeometry(width * 0.2, width * 0.3, height * 1.2, 16);
                const towerMaterial = new THREE.MeshStandardMaterial({ color: 0xDDDDDD });
                const tower = new THREE.Mesh(towerGeometry, towerMaterial);
                tower.position.set(width * 0.3 * i, height * 0.6, 0);
                building.add(tower);
            }
            
            // Add atom symbol on top of the power plant (adding back the correct symbol at the top)
            // Create nucleus (central sphere)
            const nucleusGeometry = new THREE.SphereGeometry(0.15, 8, 8);
            const nucleusMaterial = new THREE.MeshStandardMaterial({ color: 0x0088ff });
            const nucleus = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
            nucleus.position.y = height * 1.3; // Positioned higher, near the top of the building
            building.add(nucleus);
            
            // Create electron orbits (rings)
            const orbit1 = new THREE.RingGeometry(0.25, 0.28, 16);
            const orbit2 = new THREE.RingGeometry(0.25, 0.28, 16);
            const orbit3 = new THREE.RingGeometry(0.25, 0.28, 16);
            const orbitMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x00aaff, 
                side: THREE.DoubleSide 
            });
            
            const orbitMesh1 = new THREE.Mesh(orbit1, orbitMaterial);
            const orbitMesh2 = new THREE.Mesh(orbit2, orbitMaterial);
            const orbitMesh3 = new THREE.Mesh(orbit3, orbitMaterial);
            
            // Position and rotate orbits differently
            orbitMesh1.position.y = height * 1.3;
            orbitMesh2.position.y = height * 1.3;
            orbitMesh3.position.y = height * 1.3;
            
            orbitMesh1.rotation.x = Math.PI / 2;
            orbitMesh2.rotation.x = Math.PI / 4;
            orbitMesh3.rotation.x = Math.PI / 2;
            orbitMesh3.rotation.y = Math.PI / 2;
            
            building.add(orbitMesh1);
            building.add(orbitMesh2);
            building.add(orbitMesh3);
            
            // Add electrons (small spheres) on the orbits
            const electronGeometry = new THREE.SphereGeometry(0.04, 6, 6);
            const electronMaterial = new THREE.MeshStandardMaterial({ color: 0xffff00 });
            
            const positions = [
                { x: 0.25, y: 0, z: 0 },
                { x: -0.125, y: 0, z: 0.217 },
                { x: 0, y: 0.217, z: 0.125 }
            ];
            
            positions.forEach(pos => {
                const electron = new THREE.Mesh(electronGeometry, electronMaterial);
                electron.position.set(
                    nucleus.position.x + pos.x,
                    nucleus.position.y + pos.y,
                    nucleus.position.z + pos.z
                );
                building.add(electron);
            });
        }
    }
    
    addMansionFeatures(building, width, depth, height) {
        // Add luxury features to mansions
        
        // Add swimming pool
        const poolGeometry = new THREE.BoxGeometry(width * 0.5, 0.1, depth * 0.3);
        const poolMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x4fc3f7,
            transparent: true,
            opacity: 0.7
        });
        const pool = new THREE.Mesh(poolGeometry, poolMaterial);
        pool.position.set(width * 0.5, -height * 0.45, depth * 0.5);
        building.add(pool);
        
        // Add deck chairs
        for (let i = -1; i <= 1; i += 2) {
            const chairGeometry = new THREE.BoxGeometry(0.15, 0.05, 0.4);
            const chairMaterial = new THREE.MeshStandardMaterial({ color: 0xA0522D });
            const chair = new THREE.Mesh(chairGeometry, chairMaterial);
            chair.position.set(width * 0.5 + i * 0.2, -height * 0.4, depth * 0.5);
            building.add(chair);
        }
        
        // Add decorative columns at entrance
        for (let i = -1; i <= 1; i += 2) {
            const columnGeometry = new THREE.CylinderGeometry(0.05, 0.05, height * 0.9, 8);
            const columnMaterial = new THREE.MeshStandardMaterial({ color: 0xF5F5F5 });
            const column = new THREE.Mesh(columnGeometry, columnMaterial);
            column.position.set(i * width * 0.3, -height * 0.05, depth * 0.5);
            building.add(column);
        }
        
        // Add fancy entrance
        const entranceGeometry = new THREE.BoxGeometry(width * 0.4, height * 0.5, depth * 0.1);
        const entranceMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const entrance = new THREE.Mesh(entranceGeometry, entranceMaterial);
        entrance.position.set(0, -height * 0.25, depth * 0.55);
        building.add(entrance);
    }
    
    addSchoolFeatures(building, width, depth, height) {
        // Add flagpole
        const poleGeometry = new THREE.CylinderGeometry(0.03, 0.03, height * 1.5, 8);
        const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.set(width * 0.4, height * 0.75, depth * 0.4);
        building.add(pole);
        
        // Add flag
        const flagGeometry = new THREE.PlaneGeometry(0.3, 0.2);
        const flagMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x3F51B5,
            side: THREE.DoubleSide
        });
        const flag = new THREE.Mesh(flagGeometry, flagMaterial);
        flag.position.set(width * 0.5, height * 1.4, depth * 0.4);
        flag.rotation.y = Math.PI / 2;
        building.add(flag);
        
        // Add playground equipment
        const playgroundGeometry = new THREE.BoxGeometry(width * 0.4, height * 0.1, depth * 0.4);
        const playgroundMaterial = new THREE.MeshStandardMaterial({ color: 0xFFC107 });
        const playground = new THREE.Mesh(playgroundGeometry, playgroundMaterial);
        playground.position.set(-width * 0.5, -height * 0.45, -depth * 0.5);
        building.add(playground);
    }
    
    addStorefront(building, width, depth, height) {
        // Add storefront glass display
        const displayGeometry = new THREE.BoxGeometry(width * 0.7, height * 0.3, 0.05);
        const displayMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x87CEEB,
            transparent: true,
            opacity: 0.7
        });
        
        const display = new THREE.Mesh(displayGeometry, displayMaterial);
        display.position.set(0, -height * 0.35, depth / 2 + 0.03);
        building.add(display);
        
        // Add storefront sign
        const signGeometry = new THREE.BoxGeometry(width * 0.6, height * 0.15, 0.03);
        const signMaterial = new THREE.MeshStandardMaterial({ color: 0x4CAF50 });
        const sign = new THREE.Mesh(signGeometry, signMaterial);
        sign.position.set(0, height * 0.1, depth / 2 + 0.04);
        building.add(sign);
        
        // Add entrance door
        const doorGeometry = new THREE.BoxGeometry(width * 0.3, height * 0.4, 0.02);
        const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(0, -height * 0.3, depth / 2 + 0.04);
        building.add(door);
        
        // Add doorknob
        const knobGeometry = new THREE.SphereGeometry(0.03, 8, 8);
        const knobMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFFD700,
            metalness: 0.8,
            roughness: 0.2
        });
        
        const knob = new THREE.Mesh(knobGeometry, knobMaterial);
        knob.position.set(width * 0.1, -height * 0.3, depth / 2 + 0.06);
        building.add(knob);
    }
    
    addReligiousFeatures(building, width, depth, height, type) {
        if (type === 'church') {
            // Replace steeple or bell tower with tall box
            const churchTowerGeometry = new THREE.BoxGeometry(0.4, height * 2.0, 0.4);
            const churchTowerMaterial = new THREE.MeshStandardMaterial({ color: 0xebefd0 });
            const churchTower = new THREE.Mesh(churchTowerGeometry, churchTowerMaterial);
            churchTower.position.y = height * 1.0;
            building.add(churchTower);
            
            // Add cross on top
            const crossVertGeometry = new THREE.BoxGeometry(0.05, 0.3, 0.05);
            const crossHorizGeometry = new THREE.BoxGeometry(0.2, 0.05, 0.05);
            const crossMaterial = new THREE.MeshStandardMaterial({ color: 0xDDDDDD });
            
            const crossVert = new THREE.Mesh(crossVertGeometry, crossMaterial);
            crossVert.position.y = height * 2.1;
            building.add(crossVert);
            
            const crossHoriz = new THREE.Mesh(crossHorizGeometry, crossMaterial);
            crossHoriz.position.y = height * 2.05;
            building.add(crossHoriz);
            
            // Add arched doorway
            const doorwayGeometry = new THREE.BoxGeometry(width * 0.3, height * 0.5, 0.1);
            const doorwayMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
            const doorway = new THREE.Mesh(doorwayGeometry, doorwayMaterial);
            doorway.position.y = height * 0.25;
            doorway.position.z = depth * 0.45;
            building.add(doorway);
        } else if (type === 'mosque') {
            // Completely revised mosque generation with base cube and dome on top
            // Base cube for mosque
            const baseGeometry = new THREE.BoxGeometry(width * 0.9, height * 0.7, depth * 0.9);
            const baseMaterial = new THREE.MeshStandardMaterial({ color: 0xF5F5F5 });
            const base = new THREE.Mesh(baseGeometry, baseMaterial);
            base.position.y = height * 0.35;
            building.add(base);
            
            // Dome on top (half sphere)
            const domeGeometry = new THREE.SphereGeometry(width * 0.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
            const domeMaterial = new THREE.MeshStandardMaterial({ color: 0x81B29A });
            const dome = new THREE.Mesh(domeGeometry, domeMaterial);
            dome.position.y = height * 0.7;
            building.add(dome);
            
            // Add spire on dome
            const spireGeometry = new THREE.ConeGeometry(0.15, height * 0.3, 8);
            const spireMaterial = new THREE.MeshStandardMaterial({ color: 0xDDD8B8 });
            const spire = new THREE.Mesh(spireGeometry, spireMaterial);
            spire.position.y = height * 1.1;
            building.add(spire);
            
            // Add crescent moon
            const moonGeometry = new THREE.TorusGeometry(0.15, 0.03, 8, 16, Math.PI);
            const moonMaterial = new THREE.MeshStandardMaterial({ color: 0xDDD8B8 });
            const moon = new THREE.Mesh(moonGeometry, moonMaterial);
            moon.position.y = height * 1.4;
            moon.rotation.x = Math.PI / 2; // Lay flat on top
            building.add(moon);
            
            // Add decorative entrance arch
            const archGeometry = new THREE.BoxGeometry(width * 0.4, height * 0.5, 0.1);
            const archMaterial = new THREE.MeshStandardMaterial({ color: 0x81B29A });
            const arch = new THREE.Mesh(archGeometry, archMaterial);
            arch.position.y = height * 0.25;
            arch.position.z = depth * 0.45;
            building.add(arch);
            
            // Decorative windows
            const windowGeometry = new THREE.BoxGeometry(0.2, 0.3, 0.02);
            const windowMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x87CEEB,
                transparent: true,
                opacity: 0.7
            });
            
            // Add windows to front face
            for (let i = -1; i <= 1; i += 2) {
                const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
                windowMesh.position.set(i * width * 0.3, height * 0.3, depth * 0.45);
                building.add(windowMesh);
            }
            
            // Add windows to side faces
            for (let i = -1; i <= 1; i += 2) {
                for (let j = -1; j <= 1; j += 2) {
                    const sideWindow = new THREE.Mesh(windowGeometry, windowMaterial);
                    sideWindow.position.set(i * width * 0.45, height * 0.3, j * depth * 0.2);
                    sideWindow.rotation.y = Math.PI / 2;
                    building.add(sideWindow);
                }
            }
            
            // Add minaret (tall tower)
            const minaretGeometry = new THREE.CylinderGeometry(0.1, 0.15, height * 1.8, 8);
            const minaretMaterial = new THREE.MeshStandardMaterial({ color: 0xF5F5F5 });
            const minaret = new THREE.Mesh(minaretGeometry, minaretMaterial);
            minaret.position.set(width * 0.5, height * 0.9, depth * 0.5);
            building.add(minaret);
            
            // Add minaret top
            const minaretTopGeometry = new THREE.ConeGeometry(0.15, height * 0.3, 8);
            const minaretTop = new THREE.Mesh(minaretTopGeometry, spireMaterial);
            minaretTop.position.set(width * 0.5, height * 1.8, depth * 0.5);
            building.add(minaretTop);
            
            // Add balcony to minaret
            const balconyGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16);
            const balconyMaterial = new THREE.MeshStandardMaterial({ color: 0xDDD8B8 });
            const balcony = new THREE.Mesh(balconyGeometry, balconyMaterial);
            balcony.position.set(width * 0.5, height * 1.5, depth * 0.5);
            building.add(balcony);
            
            // Add second minaret on other side
            const minaret2 = minaret.clone();
            minaret2.position.set(width * 0.5, height * 0.9, -depth * 0.5);
            building.add(minaret2);
            
            const minaretTop2 = minaretTop.clone();
            minaretTop2.position.set(width * 0.5, height * 1.8, -depth * 0.5);
            building.add(minaretTop2);
            
            const balcony2 = balcony.clone();
            balcony2.position.set(width * 0.5, height * 1.5, -depth * 0.5);
            building.add(balcony2);
            
            // Add decorative patterns on the front
            const patternGeometry = new THREE.CircleGeometry(0.15, 12);
            const patternMaterial = new THREE.MeshStandardMaterial({ color: 0x81B29A });
            const pattern = new THREE.Mesh(patternGeometry, patternMaterial);
            pattern.position.set(0, height * 0.5, depth * 0.46);
            building.add(pattern);
            
            // Add steps leading to entrance
            const stepsGeometry = new THREE.BoxGeometry(width * 0.6, height * 0.1, depth * 0.2);
            const stepsMaterial = new THREE.MeshStandardMaterial({ color: 0xDDD8B8 });
            const steps = new THREE.Mesh(stepsGeometry, stepsMaterial);
            steps.position.set(0, height * 0.05, depth * 0.55);
            building.add(steps);
        } else if (type === 'temple') {
            // Create tiered pagoda-style roof
            for (let i = 0; i < 3; i++) {
                const scale = 1 - (i * 0.2);
                const roofGeometry = new THREE.BoxGeometry(width * scale, height * 0.1, depth * scale);
                const roofMaterial = new THREE.MeshStandardMaterial({ color: 0xA52A2A });
                const roof = new THREE.Mesh(roofGeometry, roofMaterial);
                roof.position.set(0, height * (0.7 + i * 0.2), 0);
                building.add(roof);
                
                // Add curved roof corners
                for (let x = -1; x <= 1; x += 2) {
                    for (let z = -1; z <= 1; z += 2) {
                        const cornerGeometry = new THREE.SphereGeometry(0.1, 8, 8);
                        const corner = new THREE.Mesh(cornerGeometry, roofMaterial);
                        corner.position.set(
                            width * scale * 0.5 * x, 
                            height * (0.7 + i * 0.2), 
                            depth * scale * 0.5 * z
                        );
                        building.add(corner);
                    }
                }
            }
            
            // Add entrance columns
            for (let x = -1; x <= 1; x += 2) {
                const columnGeometry = new THREE.CylinderGeometry(0.1, 0.1, height * 0.7, 8);
                const columnMaterial = new THREE.MeshStandardMaterial({ color: 0xF5DEB3 });
                const column = new THREE.Mesh(columnGeometry, columnMaterial);
                column.position.set(width * 0.3 * x, height * 0.35, depth * 0.47);
                building.add(column);
            }
            
            // Add steps
            const stepsGeometry = new THREE.BoxGeometry(width * 0.7, height * 0.1, depth * 0.2);
            const stepsMaterial = new THREE.MeshStandardMaterial({ color: 0xF5DEB3 });
            const steps = new THREE.Mesh(stepsGeometry, stepsMaterial);
            steps.position.set(0, height * 0.05, depth * 0.65);
            building.add(steps);
        }
    }
    
    addRecreationalFeatures(building, width, depth, height, type) {
        if (type === 'stadium') {
            // Create oval-shaped stadium walls
            const wallGeometry = new THREE.CylinderGeometry(width * 0.8, width * 0.8, height * 0.5, 32);
            const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xCCCCCC });
            const wall = new THREE.Mesh(wallGeometry, wallMaterial);
            wall.position.set(0, height * 0.25, 0);
            building.add(wall);
            
            // Create field
            const fieldGeometry = new THREE.CylinderGeometry(width * 0.7, width * 0.7, 0.02, 32);
            const fieldMaterial = new THREE.MeshStandardMaterial({ color: 0x7CFC00 });
            const field = new THREE.Mesh(fieldGeometry, fieldMaterial);
            field.position.set(0, height * 0.01, 0);
            building.add(field);
            
            // Create field markings
            const markingsGeometry = new THREE.RingGeometry(width * 0.2, width * 0.25, 32);
            const markingsMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xFFFFFF,
                side: THREE.DoubleSide
            });
            const markings = new THREE.Mesh(markingsGeometry, markingsMaterial);
            markings.position.set(0, height * 0.02, 0);
            markings.rotation.x = Math.PI / 2;
            building.add(markings);
            
            // Add Olympic rings on top
            const ringColors = [0x0085C7, 0x000000, 0xDF0024, 0xF4C300, 0x009F3D]; // Olympic ring colors
            const ringGeometry = new THREE.TorusGeometry(0.1, 0.03, 16, 32);
            const ringPositions = [
                {x: -0.2, y: 0, z: 0},
                {x: 0, y: 0, z: 0},
                {x: 0.2, y: 0, z: 0},
                {x: -0.1, y: 0, z: -0.1},
                {x: 0.1, y: 0, z: -0.1}
            ];
            
            for (let i = 0; i < 5; i++) {
                const ringMaterial = new THREE.MeshStandardMaterial({ color: ringColors[i] });
                const ring = new THREE.Mesh(ringGeometry, ringMaterial);
                ring.position.set(
                    ringPositions[i].x,
                    height * 0.55, // Position on top of the stadium
                    ringPositions[i].z
                );
                ring.rotation.x = Math.PI / 2; // Lay flat on top
                building.add(ring);
            }
            
            // Create stadium roof sections
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2;
                const roofGeometry = new THREE.BoxGeometry(width * 0.5, 0.05, depth * 0.3);
                const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x777777 });
                const roof = new THREE.Mesh(roofGeometry, roofMaterial);
                
                roof.position.set(
                    Math.cos(angle) * width * 0.5,
                    height * 0.55,
                    Math.sin(angle) * width * 0.5
                );
                
                roof.rotation.y = angle + Math.PI / 2;
                building.add(roof);
            }
        } else if (type === 'gym') {
            // Main building
            const mainGeometry = new THREE.BoxGeometry(width * 0.9, height * 0.9, depth * 0.9);
            const mainMaterial = new THREE.MeshStandardMaterial({ color: 0xC0C0C0 });
            const main = new THREE.Mesh(mainGeometry, mainMaterial);
            main.position.set(0, height * 0.45, 0);
            building.add(main);
            
            // Entrance
            const entranceGeometry = new THREE.BoxGeometry(width * 0.4, height * 0.4, depth * 0.1);
            const entranceMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x87CEEB,
                transparent: true,
                opacity: 0.7
            });
            const entrance = new THREE.Mesh(entranceGeometry, entranceMaterial);
            entrance.position.set(0, height * 0.2, depth * 0.5);
            building.add(entrance);
            
            // Gym sign
            const signGeometry = new THREE.BoxGeometry(width * 0.6, height * 0.2, 0.05);
            const signMaterial = new THREE.MeshStandardMaterial({ color: 0xFF4500 });
            const sign = new THREE.Mesh(signGeometry, signMaterial);
            sign.position.set(0, height * 0.85, depth * 0.45);
            building.add(sign);
            
            // Dumbbells symbol
            const barGeometry = new THREE.CylinderGeometry(0.03, 0.03, width * 0.3, 8);
            const weightGeometry = new THREE.SphereGeometry(0.1, 8, 8);
            const weightMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
            
            const bar = new THREE.Mesh(barGeometry, weightMaterial);
            bar.position.set(0, height * 0.9, depth * 0.46);
            bar.rotation.z = Math.PI / 4;
            building.add(bar);
            
            // Weights on each end
            for (let i = -1; i <= 1; i += 2) {
                const weight = new THREE.Mesh(weightGeometry, weightMaterial);
                weight.position.set(i * width * 0.2, height * 0.9 + i * width * 0.1, depth * 0.46);
                building.add(weight);
            }
        } else if (type === 'museum') {
            // Main building with columns
            const baseGeometry = new THREE.BoxGeometry(width * 0.95, height * 0.95, depth * 0.95);
            const baseMaterial = new THREE.MeshStandardMaterial({ color: 0xF5F5F5 });
            const base = new THREE.Mesh(baseGeometry, baseMaterial);
            base.position.set(0, height * 0.475, 0);
            building.add(base);
            
            // Triangular pediment
            const pedimentGeometry = new THREE.ConeGeometry(width * 0.5, height * 0.3, 3);
            const pedimentMaterial = new THREE.MeshStandardMaterial({ color: 0xEEEEEE });
            const pediment = new THREE.Mesh(pedimentGeometry, pedimentMaterial);
            pediment.position.set(0, height * 1.1, depth * 0.25);
            pediment.rotation.y = Math.PI;
            building.add(pediment);
            
            // Steps
            const stepsGeometry = new THREE.BoxGeometry(width * 0.8, height * 0.1, depth * 0.2);
            const stepsMaterial = new THREE.MeshStandardMaterial({ color: 0xDDDDDD });
            const steps = new THREE.Mesh(stepsGeometry, stepsMaterial);
            steps.position.set(0, height * 0.05, depth * 0.6);
            building.add(steps);
            
            // Columns
            for (let i = 0; i < 3; i++) {
                if (i === 0) continue; // Skip middle for entrance
                const columnGeometry = new THREE.CylinderGeometry(0.07, 0.07, height * 0.8, 8);
                const columnMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
                const column = new THREE.Mesh(columnGeometry, columnMaterial);
                column.position.set((i - 1) * width * 0.4, height * 0.4, depth * 0.47);
                building.add(column);
                
                // Column cap
                const capGeometry = new THREE.BoxGeometry(0.15, 0.05, 0.15);
                const cap = new THREE.Mesh(capGeometry, columnMaterial);
                cap.position.set((i - 1) * width * 0.4, height * 0.85, depth * 0.47);
                building.add(cap);
            }
        }
    }
    
    addTransportationFeatures(building, width, depth, height, type) {
        if (type === 'bus_stop') {
            // Add bus stop shelter
            const shelterGeometry = new THREE.BoxGeometry(width * 0.7, height * 0.2, depth * 0.5);
            const shelterMaterial = new THREE.MeshStandardMaterial({ color: 0x777777 });
            const shelter = new THREE.Mesh(shelterGeometry, shelterMaterial);
            shelter.position.set(0, height * 0.5, 0);
            building.add(shelter);
            
            // Add bench
            const benchGeometry = new THREE.BoxGeometry(width * 0.5, height * 0.1, depth * 0.2);
            const benchMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
            const bench = new THREE.Mesh(benchGeometry, benchMaterial);
            bench.position.set(0, height * 0.1, depth * 0.1);
            building.add(bench);
            
            // Add bus stop sign
            const signGeometry = new THREE.BoxGeometry(0.05, height * 0.8, 0.05);
            const signMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFF00 });
            const sign = new THREE.Mesh(signGeometry, signMaterial);
            sign.position.set(width * 0.3, height * 0.4, depth * 0.2);
            building.add(sign);
        } else if (type === 'train_station') {
            // Add station roof
            const roofGeometry = new THREE.BoxGeometry(width * 1.2, height * 0.3, depth * 1.5);
            const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
            const roof = new THREE.Mesh(roofGeometry, roofMaterial);
            roof.position.set(0, height * 0.65, 0);
            building.add(roof);
            
            // Add columns
            for (let i = -1; i <= 1; i += 2) {
                for (let j = -1; j <= 1; j += 2) {
                    const columnGeometry = new THREE.CylinderGeometry(0.1, 0.1, height * 0.8, 8);
                    const columnMaterial = new THREE.MeshStandardMaterial({ color: 0x888888 });
                    const column = new THREE.Mesh(columnGeometry, columnMaterial);
                    column.position.set(width * 0.4 * i, height * 0.4, depth * 0.4 * j);
                    building.add(column);
                }
            }
            
            // Add clock
            const clockGeometry = new THREE.CircleGeometry(0.2, 16);
            const clockMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
            const clock = new THREE.Mesh(clockGeometry, clockMaterial);
            clock.position.set(0, height * 0.8, depth * 0.55);
            clock.rotation.x = -Math.PI / 6;
            building.add(clock);
        } else if (type === 'airport') {
            // Add control tower
            const towerGeometry = new THREE.CylinderGeometry(0.15, 0.2, height * 1.5, 8);
            const towerMaterial = new THREE.MeshStandardMaterial({ color: 0xBBBBBB });
            const tower = new THREE.Mesh(towerGeometry, towerMaterial);
            tower.position.set(width * 0.3, height * 0.75, depth * 0.3);
            building.add(tower);
            
            // Add control room
            const roomGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 8);
            const roomMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x87CEEB,
                transparent: true,
                opacity: 0.7
            });
            const room = new THREE.Mesh(roomGeometry, roomMaterial);
            room.position.set(width * 0.3, height * 1.45, depth * 0.3);
            building.add(room);
            
            // Add runway
            const runwayGeometry = new THREE.BoxGeometry(width * 3, 0.01, depth * 0.5);
            const runwayMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
            const runway = new THREE.Mesh(runwayGeometry, runwayMaterial);
            runway.position.set(width * 1.5, 0, 0);
            building.add(runway);
            
            // Add runway markings
            for (let i = 0; i < 5; i++) {
                const markingGeometry = new THREE.BoxGeometry(0.2, 0.015, 0.05);
                const markingMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
                const marking = new THREE.Mesh(markingGeometry, markingMaterial);
                marking.position.set(width * (i * 0.5 + 0.5), 0.01, 0);
                building.add(marking);
            }
        } else if (type === 'parking_garage') {
            // Add multiple floors with ramps
            for (let i = 0; i < 3; i++) {
                const floorGeometry = new THREE.BoxGeometry(width * 0.9, 0.05, depth * 0.9);
                const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
                const floor = new THREE.Mesh(floorGeometry, floorMaterial);
                floor.position.set(0, height * 0.3 * i, 0);
                building.add(floor);
                
                // Add ramp between floors
                if (i < 2) {
                    const rampGeometry = new THREE.BoxGeometry(width * 0.3, 0.05, depth * 0.6);
                    const ramp = new THREE.Mesh(rampGeometry, floorMaterial);
                    ramp.position.set(width * 0.3, height * (0.15 + 0.3 * i), depth * 0.15);
                    ramp.rotation.x = Math.PI / 8;
                    building.add(ramp);
                }
            }
            
            // Add entrance barrier
            const barrierGeometry = new THREE.BoxGeometry(width * 0.05, 0.05, depth * 0.5);
            const barrierMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000 });
            const barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
            barrier.position.set(width * 0.4, height * 0.1, depth * 0.4);
            barrier.rotation.y = Math.PI / 4;
            building.add(barrier);
        } else if (type === 'port') {
            // Add dock extending from the port building
            const dockGeometry = new THREE.BoxGeometry(width * 2, 0.1, depth * 0.8);
            const dockMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
            const dock = new THREE.Mesh(dockGeometry, dockMaterial);
            dock.position.set(width * 1.0, height * 0.05, 0);
            building.add(dock);
            
            // Add warehouse/terminal building
            const terminalGeometry = new THREE.BoxGeometry(width * 0.8, height * 0.8, depth * 0.8);
            const terminalMaterial = new THREE.MeshStandardMaterial({ color: 0x607D8B });
            const terminal = new THREE.Mesh(terminalGeometry, terminalMaterial);
            terminal.position.set(-width * 0.2, height * 0.4, 0);
            building.add(terminal);
            
            // Add crane
            const craneBaseGeometry = new THREE.BoxGeometry(0.2, height * 1.5, 0.2);
            const craneMaterial = new THREE.MeshStandardMaterial({ color: 0xF57C00 });
            const craneBase = new THREE.Mesh(craneBaseGeometry, craneMaterial);
            craneBase.position.set(width * 0.5, height * 0.75, depth * 0.3);
            building.add(craneBase);
            
            // Add crane arm
            const craneArmGeometry = new THREE.BoxGeometry(width * 1.2, 0.1, 0.1);
            const craneArm = new THREE.Mesh(craneArmGeometry, craneMaterial);
            craneArm.position.set(width * 0.3, height * 1.5, depth * 0.3);
            building.add(craneArm);
            
            // Add container
            const containerGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.3);
            const containerMaterial = new THREE.MeshStandardMaterial({ color: 0x2196F3 });
            const container = new THREE.Mesh(containerGeometry, containerMaterial);
            container.position.set(width * 0.8, height * 0.2, depth * 0.0);
            building.add(container);
            
            // Add another container in different color
            const container2 = new THREE.Mesh(containerGeometry, 
                new THREE.MeshStandardMaterial({ color: 0xF44336 }));
            container2.position.set(width * 0.6, height * 0.2, depth * 0.0);
            building.add(container2);
            
            // Add navigation buoy
            const buoyGeometry = new THREE.ConeGeometry(0.1, 0.2, 8);
            const buoyMaterial = new THREE.MeshStandardMaterial({ color: 0xFF5722 });
            const buoy = new THREE.Mesh(buoyGeometry, buoyMaterial);
            buoy.position.set(width * 1.5, height * 0.3, depth * 0.4);
            building.add(buoy);
        }
    }
    
    moveBuilding(fromX, fromZ, toX, toZ) {
        const fromKey = `${fromX},${fromZ}`;
        const toKey = `${toX},${toZ}`;
        
        // Check if source building exists
        if (!this.buildings.has(fromKey)) {
            return false;
        }
        
        // Check if destination is free
        if (this.buildings.has(toKey)) {
            return false;
        }
        
        // Get building data
        const building = this.buildings.get(fromKey);
        
        // Get terrain height at new position
        const terrainHeight = this.getTerrainHeightAt(toX, toZ);
        if (terrainHeight === null) {
            return false;
        }
        
        // Update building position
        building.x = toX;
        building.z = toZ;
        
        // Position the mesh appropriately based on type
        if (building.category === 'road') {
            const roadOffset = 0.3;
            building.mesh.position.set(toX, terrainHeight + roadOffset, toZ);
        } else if (building.category === 'civic' && building.type === 'park') {
            building.mesh.position.set(toX, terrainHeight + 0.3, toZ);
        } else if (building.category === 'farm' && building.type === 'farm_field') {
            // Increased height offset for farm fields when moving to ensure they're visible
            building.mesh.position.set(toX, terrainHeight + 0.35, toZ);
        } else {
            const geometry = building.mesh.geometry;
            building.mesh.position.set(toX, terrainHeight + (geometry.parameters.height / 1.5), toZ);
        }
        
        // Update buildings map
        this.buildings.delete(fromKey);
        this.buildings.set(toKey, building);
        
        return true;
    }
    
    removeBuilding(x, z) {
        const key = `${x},${z}`;
        
        if (this.buildings.has(key)) {
            const building = this.buildings.get(key);
            
            // Remove from scene
            this.scene.remove(building.mesh);
            
            // Update game state
            this.gameState.buildings[building.category]--;
            
            // Remove from buildings map
            this.buildings.delete(key);
            
            return true;
        }
        
        return false;
    }
    
    canPlaceBuilding(x, z, type) {
        // Check if there's already a building at this position
        if (this.buildings.has(`${x},${z}`)) {
            return false;
        }
        
        // If this is a move operation with a specific building type passed as string
        // We need to check validity based on that type, not the position
        const moveTypeCheck = typeof type === 'string';
        
        // Special case for airport - can only be built on flat grass terrain
        if ((moveTypeCheck && type === 'airport') || (!moveTypeCheck && type === 'airport')) {
            // Check if this is a grass tile and has low slope
            const tileType = this.scene.userData.terrainGenerator.getTileType(x, z);
            if (tileType !== 'grass') {
                return false;
            }
            
            // Check that the surface is flat by comparing heights with adjacent tiles
            const height = this.getTerrainHeightAt(x, z);
            const directions = [
                { dx: 1, dz: 0 },  // East
                { dx: -1, dz: 0 }, // West
                { dx: 0, dz: 1 },  // North
                { dx: 0, dz: -1 }  // South
                // Removed diagonal checks
            ];
            
            for (const dir of directions) {
                const neighborHeight = this.getTerrainHeightAt(x + dir.dx, z + dir.dz);
                if (Math.abs(neighborHeight - height) > 0.3) {
                    return false; // Surface is not flat enough
                }
            }
            
            // Check if this is at least 5 terrain elements away from mountains
            const checkDistance = 5;
            for (let rx = -checkDistance; rx <= checkDistance; rx++) {
                for (let rz = -checkDistance; rz <= checkDistance; rz++) {
                    const checkX = x + rx;
                    const checkZ = z + rz;
                    const checkTileType = this.scene.userData.terrainGenerator.getTileType(checkX, checkZ);
                    if (checkTileType === 'mountain' || checkTileType === 'dirt') {
                        return false; // Too close to mountains
                    }
                }
            }
        }
        
        // Special case for farm_field - must be adjacent to a farm_house
        if ((moveTypeCheck && type === 'farm_field') || (!moveTypeCheck && type === 'farm_field')) {
            // Check if this is grass tile
            const tileType = this.scene.userData.terrainGenerator.getTileType(x, z);
            if (tileType !== 'grass') {
                return false;
            }
            
            // Check if there's a farm_house nearby
            const directions = [
                { dx: 1, dz: 0 },  // East
                { dx: -1, dz: 0 }, // West
                { dx: 0, dz: 1 },  // North
                { dx: 0, dz: -1 },  // South
                { dx: 1, dz: 1 },   // Northeast
                { dx: -1, dz: 1 },  // Northwest
                { dx: 1, dz: -1 },  // Southeast
                { dx: -1, dz: -1 }  // Southwest
            ];
            
            for (const dir of directions) {
                const nx = x + dir.dx;
                const nz = z + dir.dz;
                const key = `${nx},${nz}`;
                
                if (this.buildings.has(key)) {
                    const building = this.buildings.get(key);
                    if (building.type === 'farm_house') {
                        return true;
                    }
                }
            }
            
            return false;
        }

        // Check if the terrain is buildable
        if (!this.scene.userData.terrainGenerator || 
            !this.scene.userData.terrainGenerator.isBuildableTile(x, z)) {
            
            // Special case for port: can be built at water's edge
            if ((moveTypeCheck && type === 'port') || (!moveTypeCheck && type === 'port')) {
                // Check if this is a water tile
                const tileType = this.scene.userData.terrainGenerator.getTileType(x, z);
                if (tileType === 'water') {
                    // Check if there's adjacent land
                    return this.isAdjacentToLand(x, z);
                }
            }
            
            // Special case for water_channel: can be built on water or next to other water channels
            if ((moveTypeCheck && type === 'water_channel') || (!moveTypeCheck && type === 'water_channel')) {
                const tileType = this.scene.userData.terrainGenerator.getTileType(x, z);
                if (tileType === 'water') {
                    return true; // Can place water channels on water to create lakes
                }
                
                // Check if adjacent to another water channel
                const adjacentToWaterChannel = this.isAdjacentToWaterChannel(x, z);
                if (adjacentToWaterChannel) {
                    return true; // Can place water channels adjacent to existing ones
                }
            }
            
            // Special case for bridge: can be built over water
            if ((moveTypeCheck && type === 'bridge') || (!moveTypeCheck && type === 'bridge')) {
                const tileType = this.scene.userData.terrainGenerator.getTileType(x, z);
                if (tileType === 'water') {
                    // Check if there are roads or bridges at both ends
                    return this.hasRoadConnectionsForBridge(x, z);
                }
            }
            
            return false;
        }
        
        // For roads, we don't need to check additional requirements
        if ((moveTypeCheck && type === 'road') || (!moveTypeCheck && type === 'road')) {
            return true;
        }
        
        // Special case for water_channel: also check if adjacent to existing water channel
        if ((moveTypeCheck && type === 'water_channel') || (!moveTypeCheck && type === 'water_channel')) {
            if (this.isAdjacentToWaterChannel(x, z)) {
                return true;
            }
        }
        
        // For other buildings, check if there's a road nearby
        return this.isNearRoad(x, z);
    }
    
    isNearRoad(x, z) {
        // Check surrounding tiles for roads
        const directions = [
            { dx: 1, dz: 0 },  // East
            { dx: -1, dz: 0 }, // West
            { dx: 0, dz: 1 },  // North
            { dx: 0, dz: -1 },  // South
            { dx: 1, dz: 1 },   // Northeast
            { dx: -1, dz: 1 },  // Northwest
            { dx: 1, dz: -1 },  // Southeast
            { dx: -1, dz: -1 }  // Southwest
        ];
        
        for (const dir of directions) {
            const nx = x + dir.dx;
            const nz = z + dir.dz;
            const key = `${nx},${nz}`;
            
            if (this.buildings.has(key)) {
                const building = this.buildings.get(key);
                if (building.category === 'road' && building.type !== 'water_channel') {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    isAdjacentToRoadOrWaterChannel(x, z) {
        const directions = [
            { dx: 1, dz: 0 },  // East
            { dx: -1, dz: 0 }, // West
            { dx: 0, dz: 1 },  // North
            { dx: 0, dz: -1 }  // South
        ];
        
        for (const dir of directions) {
            const nx = x + dir.dx;
            const nz = z + dir.dz;
            const key = `${nx},${nz}`;
            
            if (this.buildings.has(key)) {
                const building = this.buildings.get(key);
                if (building.category === 'road') {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    highlightBuildingForMove(building) {
        if (!building || !building.mesh) return;
        
        // Store original material
        if (!building.mesh.userData.originalMaterial) {
            building.mesh.userData.originalMaterial = building.mesh.material;
        }
        
        // Apply highlight material for moving
        building.mesh.material = new THREE.MeshStandardMaterial({
            color: building.mesh.userData.originalMaterial.color,
            transparent: true,
            opacity: 0.7,
            wireframe: true
        });
        
        // Add outline effect by scaling up slightly
        building.mesh.scale.set(1.1, 1.1, 1.1);
    }
    
    clearBuildingMoveHighlight(building) {
        if (!building || !building.mesh) return;
        
        // Restore original material
        if (building.mesh.userData.originalMaterial) {
            building.mesh.material = building.mesh.userData.originalMaterial;
            delete building.mesh.userData.originalMaterial;
        }
        
        // Reset scale
        building.mesh.scale.set(1, 1, 1);
    }
    
    addBuildingEntrance(building, width, depth, height, color) {
        // Add entrance to building
        const entranceGeometry = new THREE.BoxGeometry(width * 0.3, height * 0.4, 0.05);
        const entranceMaterial = new THREE.MeshStandardMaterial({ color: color || 0x8B4513 });
        const entrance = new THREE.Mesh(entranceGeometry, entranceMaterial);
        entrance.position.set(0, -height * 0.3, depth / 2 + 0.03);
        building.add(entrance);
        
        // Add doorknob
        const knobGeometry = new THREE.SphereGeometry(0.03, 8, 8);
        const knobMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFFD700,
            metalness: 0.8,
            roughness: 0.2
        });
        const knob = new THREE.Mesh(knobGeometry, knobMaterial);
        knob.position.set(width * 0.1, -height * 0.3, depth / 2 + 0.06);
        building.add(knob);
    }
    
    addFarmFeatures(building, width, depth, height) {
        // Add pitched roof
        const roofGeometry = new THREE.ConeGeometry(Math.max(width, depth) * 0.75, height * 0.5, 4);
        const roofMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513, // Brown
            roughness: 0.8
        });
        
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = height / 2 + height * 0.25;
        roof.rotation.y = Math.PI / 4; // Rotate to align corners with building
        building.add(roof);
        
        // Add chimney
        const chimneyGeometry = new THREE.BoxGeometry(0.15, 0.4, 0.15);
        const chimneyMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
        chimney.position.set(width * 0.25, height / 2 + 0.3, depth * 0.25);
        building.add(chimney);
        
        // Add entrance door
        const doorGeometry = new THREE.BoxGeometry(0.3, 0.5, 0.05);
        const doorMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(0, -height * 0.35, depth / 2 + 0.03);
        building.add(door);
        
        // Add small silo
        const siloGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.0, 8);
        const siloMaterial = new THREE.MeshStandardMaterial({ color: 0xCCCCCC });
        const silo = new THREE.Mesh(siloGeometry, siloMaterial);
        silo.position.set(-width * 0.5, height * 0.5, -depth * 0.3);
        building.add(silo);
        
        // Add silo cap
        const siloCapGeometry = new THREE.ConeGeometry(0.2, 0.2, 8);
        const siloCap = new THREE.Mesh(siloCapGeometry, siloMaterial);
        siloCap.position.set(-width * 0.5, height * 1.1, -depth * 0.3);
        building.add(siloCap);
    }
    
    addFarmFieldPattern(building) {
        // Create grid pattern on top of the field
        const gridSize = 3;
        const lineWidth = 0.03;
        const lineColor = 0x5D4037; // Brown for soil
        const lineMaterial = new THREE.MeshBasicMaterial({ color: lineColor });
        
        // Add horizontal grid lines
        for (let i = 0; i <= gridSize; i++) {
            const lineGeometry = new THREE.BoxGeometry(0.9, 0.01, lineWidth);
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            const position = -0.45 + (i / gridSize) * 0.9;
            line.position.set(0, 0.1, position);
            building.add(line);
        }
        
        // Add vertical grid lines
        for (let i = 0; i <= gridSize; i++) {
            const lineGeometry = new THREE.BoxGeometry(lineWidth, 0.01, 0.9);
            const line = new THREE.Mesh(lineGeometry, lineMaterial);
            const position = -0.45 + (i / gridSize) * 0.9;
            line.position.set(position, 0.1, 0);
            building.add(line);
        }
        
        // Add some crop details (small green dots in some cells)
        const cropGeometry = new THREE.BoxGeometry(0.2, 0.1, 0.2); 
        const cropMaterial = new THREE.MeshStandardMaterial({ color: 0x4CAF50 }); // Green
        
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                if (Math.random() < 0.7) { // 70% chance to add crops to a cell
                    const crop = new THREE.Mesh(cropGeometry, cropMaterial);
                    const posX = -0.45 + (i / gridSize) * 0.9 + 0.15;
                    const posZ = -0.45 + (j / gridSize) * 0.9 + 0.15;
                    crop.position.set(posX, 0.1, posZ);
                    building.add(crop);
                }
            }
        }
    }
    
    isAdjacentToWaterChannel(x, z) {
        // Check adjacent tiles for water channels
        const directions = [
            { dx: 1, dz: 0 },  // East
            { dx: -1, dz: 0 }, // West
            { dx: 0, dz: 1 },  // North
            { dx: 0, dz: -1 }  // South
        ];
        
        for (const dir of directions) {
            const nx = x + dir.dx;
            const nz = z + dir.dz;
            
            const tileType = this.scene.userData.terrainGenerator.getTileType(nx, nz);
            if (tileType === 'water') {
                return true; // Directly adjacent to water
            }
            
            const key = `${nx},${nz}`;
            
            if (this.buildings.has(key)) {
                const building = this.buildings.get(key);
                if (building.category === 'road' && building.type === 'water_channel') {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    getTerrainHeightAt(x, z) {
        // Get height from terrain generator if available
        if (this.scene.userData.terrainGenerator) {
            return this.scene.userData.terrainGenerator.getTileHeight(x, z);
        }
        
        // Fallback to default height
        return 0;
    }
    
    getBuildingAtPosition(x, z) {
        return this.buildings.get(`${x},${z}`) || null;
    }
    
    getBuildingCost(type) {
        // Find the building type in building configs
        for (const category in this.buildingTypes) {
            if (this.buildingTypes[category][type]) {
                return this.buildingTypes[category][type].cost;
            }
        }
        
        return 0;
    }
    
    getAllBuildings() {
        return Array.from(this.buildings.values());
    }
    
    getBuildingsByType(category) {
        return Array.from(this.buildings.values())
            .filter(building => building.category === category);
    }
    
    calculateBuildingImpacts() {
        let totalPopulationCapacity = 0;
        let totalJobs = 0;
        let totalIncome = 0;
        let totalMaintenance = 0;
        let totalHappiness = 0;
        let totalPollution = 0;
        
        for (const building of this.buildings.values()) {
            if (building.capacity) {
                totalPopulationCapacity += building.capacity;
            }
            
            if (building.jobs) {
                totalJobs += building.jobs;
            }
            
            if (building.income) {
                totalIncome += building.income;
            }
            
            if (building.maintenance) {
                totalMaintenance += building.maintenance;
            }
            
            if (building.happiness) {
                totalHappiness += building.happiness;
            }
            
            if (building.pollution) {
                totalPollution += building.pollution;
            }
        }
        
        return {
            populationCapacity: totalPopulationCapacity,
            jobs: totalJobs,
            income: totalIncome,
            maintenance: totalMaintenance,
            happiness: totalHappiness,
            pollution: totalPollution
        };
    }
    
    update(deltaTime) {
        // Get time of day from the game if available
        const isNight = this.scene.userData.game && 
                        this.scene.userData.game.timeSystem && 
                        (this.scene.userData.game.timeSystem.timeOfDay < 0.25 || 
                         this.scene.userData.game.timeSystem.timeOfDay > 0.75);
        
        // On mobile, update only buildings that are visible to the camera
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const camera = this.scene.userData.game ? this.scene.userData.game.camera : null;
        
        // Cache Date.now() to avoid multiple calls
        const now = Date.now();
        
        // Animate buildings if needed - only update a subset of buildings per frame on mobile
        let buildingCounter = 0;
        const maxBuildingsPerFrame = isMobile ? 20 : 999999; // Limit updates on mobile
        
        for (const building of this.buildings.values()) {
            // Skip distant buildings on mobile
            if (isMobile && camera && buildingCounter++ > maxBuildingsPerFrame) {
                const distance = camera.position.distanceTo(new THREE.Vector3(building.x, 0, building.z));
                if (distance > 50) continue; // Skip buildings far from camera
            }
            
            if (building.category === 'civic' && building.type === 'park') {
                building.mesh.position.y = this.getTerrainHeightAt(building.x, building.z) + 
                    0.3 + Math.sin(now * 0.001) * 0.05;
            }
            
            // Update windows for night time glow effect - optimize by only updating a portion of buildings per frame
            if (building.mesh && building.mesh.children && (Math.random() < 0.1 || !isMobile)) {
                building.mesh.children.forEach(child => {
                    if (child.userData.isLightable) {
                        // Switch materials based on time of day
                        if (isNight) {
                            // At night, some windows glow
                            child.material = child.userData.nightMaterial;
                            
                            // Add slight flickering effect to some windows - less often on mobile
                            if (Math.random() < (isMobile ? 0.005 : 0.01)) {
                                const flickerAmount = 0.3 + Math.random() * 0.4;
                                child.material.emissiveIntensity = flickerAmount;
                            }
                        } else {
                            // During day, use normal window material
                            child.material = child.userData.dayMaterial;
                        }
                    }
                });
            }
        }
    }
    
    calculateTaxContribution(building) {
        if (building.category === 'residential') {
            // Residential tax based on property value
            return building.cost * 0.001 * (this.gameState.taxRate / 10);
        } else if (building.category === 'commercial') {
            // Commercial tax based on income
            return building.income * 0.05 * (this.gameState.taxRate / 10);
        }
        return 0;
    }
    
    isNearRoad(x, z) {
        // Check surrounding tiles for roads
        const directions = [
            { dx: 1, dz: 0 },  // East
            { dx: -1, dz: 0 }, // West
            { dx: 0, dz: 1 },  // North
            { dx: 0, dz: -1 },  // South
            { dx: 1, dz: 1 },   // Northeast
            { dx: -1, dz: 1 },  // Northwest
            { dx: 1, dz: -1 },  // Southeast
            { dx: -1, dz: -1 }  // Southwest
        ];
        
        for (const dir of directions) {
            const nx = x + dir.dx;
            const nz = z + dir.dz;
            const key = `${nx},${nz}`;
            
            if (this.buildings.has(key)) {
                const building = this.buildings.get(key);
                if (building.category === 'road' && building.type !== 'water_channel') {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    highlightBuildingForMove(building) {
        if (!building || !building.mesh) return;
        
        // Store original material
        if (!building.mesh.userData.originalMaterial) {
            building.mesh.userData.originalMaterial = building.mesh.material;
        }
        
        // Apply highlight material for moving
        building.mesh.material = new THREE.MeshStandardMaterial({
            color: building.mesh.userData.originalMaterial.color,
            transparent: true,
            opacity: 0.7,
            wireframe: true
        });
        
        // Add outline effect by scaling up slightly
        building.mesh.scale.set(1.1, 1.1, 1.1);
    }
    
    clearBuildingMoveHighlight(building) {
        if (!building || !building.mesh) return;
        
        // Restore original material
        if (building.mesh.userData.originalMaterial) {
            building.mesh.material = building.mesh.userData.originalMaterial;
            delete building.mesh.userData.originalMaterial;
        }
        
        // Reset scale
        building.mesh.scale.set(1, 1, 1);
    }
    
    hasRoadConnectionsForBridge(x, z) {
        // We need roads on at least two opposite sides for a bridge to connect
        const directions = [
            { dx: 1, dz: 0, opposite: { dx: -1, dz: 0 } },  // East and West
            { dx: 0, dz: 1, opposite: { dx: 0, dz: -1 } }   // North and South
        ];
        
        for (const dirPair of directions) {
            // Check both directions
            const hasRoad1 = this.hasRoadInDirection(x, z, dirPair.dx, dirPair.dz);
            const hasRoad2 = this.hasRoadInDirection(x, z, dirPair.opposite.dx, dirPair.opposite.dz);
            
            // If we have roads or bridges in both directions, bridge is valid
            if ((hasRoad1 || hasRoad2)) {
                return true;
            }
        }
        
        return false;
    }
    
    hasRoadInDirection(x, z, dx, dz) {
        // Check if there's a road or bridge in the specified direction
        const nx = x + dx;
        const nz = z + dz;
        const key = `${nx},${nz}`;
        
        if (this.buildings.has(key)) {
            const building = this.buildings.get(key);
            return building.category === 'road' || 
                   (building.category === 'road' && building.type === 'bridge');
        }
        
        return false;
    }
}