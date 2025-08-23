const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Production environment settings
const isProduction = process.env.NODE_ENV === 'production';

// Log environment info for debugging
console.log(`Environment: ${isProduction ? 'Production' : 'Development'}`);
console.log(`Port: ${PORT}`);
console.log(`Node.js version: ${process.version}`);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// PAGASA endpoints
const PAGASA_ENDPOINTS = {
    tropicalCyclone: 'https://www.pagasa.dost.gov.ph/tropical-cyclone/severe-weather-bulletin',
    weatherAdvisory: 'https://www.pagasa.dost.gov.ph/weather-advisory',
    weatherForecast: 'https://www.pagasa.dost.gov.ph/weather-forecast',
    weatherWarning: 'https://www.pagasa.dost.gov.ph/weather-warning'
};

// Cache for weather data (5 minutes)
let weatherCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Production cache settings
const PROD_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes for production

// Main weather endpoint
app.get('/api/pagasa/weather', async (req, res) => {
    try {
        // Check if we have valid cached data
        const cacheDuration = isProduction ? PROD_CACHE_DURATION : CACHE_DURATION;
        if (weatherCache && (Date.now() - cacheTimestamp) < cacheDuration) {
            console.log('Returning cached weather data');
            return res.json(weatherCache);
        }

        console.log('Fetching fresh weather data from PAGASA...');
        
        // Fetch data from PAGASA
        const weatherData = await fetchPAGASAData();
        
        // Cache the data
        weatherCache = weatherData;
        cacheTimestamp = Date.now();
        
        res.json(weatherData);
    } catch (error) {
        console.error('Error fetching PAGASA data:', error);
        
        // Return cached data if available, even if expired
        if (weatherCache) {
            console.log('Returning expired cached data due to error');
            return res.json(weatherCache);
        }
        
        res.status(500).json({
            error: 'Failed to fetch weather data',
            message: error.message
        });
    }
});

        // Fetch and parse PAGASA data
        async function fetchPAGASAData() {
            try {
                console.log(`Fetching PAGASA data from: ${PAGASA_ENDPOINTS.tropicalCyclone}`);
                
                // Fetch tropical cyclone bulletin
                const response = await axios.get(PAGASA_ENDPOINTS.tropicalCyclone, {
                    timeout: 15000, // Increased timeout for production
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });

                console.log(`PAGASA response status: ${response.status}`);
                console.log(`PAGASA response size: ${response.data.length} characters`);

                const htmlContent = response.data;
                const $ = cheerio.load(htmlContent);
                
                // Extract storm information
                const stormData = extractStormData($);
                console.log(`Extracted storm data:`, stormData);
                
                // Extract weather warnings
                const warningData = extractWarningData($);
                console.log(`Extracted warning data:`, warningData);
                
                // Generate weather data for different regions
                const weatherData = generateWeatherData(stormData, warningData);
                console.log(`Generated weather data for ${weatherData.length} cities`);
                
                return weatherData;
            } catch (error) {
                console.error('Error fetching from PAGASA:', error.message);
                if (error.response) {
                    console.error('Response status:', error.response.status);
                    console.error('Response headers:', error.response.headers);
                }
                throw error;
            }
        }

// Extract storm information from PAGASA HTML
function extractStormData($) {
    const stormData = {
        stormName: 'None',
        stormCategory: 'None',
        currentPosition: 'No active storm',
        coordinates: 'N/A',
        movement: 'N/A',
        maxWinds: '0 km/h',
        gustiness: '0 km/h',
        pressure: 'N/A',
        status: 'Inactive'
    };

    try {
        const textContent = $.text();
        
        // Extract storm name and category
        const stormMatch = textContent.match(/(?:TROPICAL STORM|TYPHOON|TROPICAL DEPRESSION)\s+([A-Z]+)/i);
        if (stormMatch) {
            stormData.stormName = stormMatch[1];
            stormData.stormCategory = stormMatch[0];
        }

        // Extract wind speed
        const windMatch = textContent.match(/maximum sustained winds of (\d+)\s*km\/h/i);
        if (windMatch) {
            stormData.maxWinds = windMatch[1] + ' km/h';
        }

        // Extract position
        const positionMatch = textContent.match(/(\d+)\s*km\s*(?:west|east|north|south|northeast|northwest|southeast|southwest)\s+of\s+([^,]+)/i);
        if (positionMatch) {
            stormData.currentPosition = positionMatch[1] + ' km ' + positionMatch[2];
        }

        // Extract movement
        const movementMatch = textContent.match(/(?:moving\s+)?(northward|southward|eastward|westward|northeastward|northwestward|southeastward|southwestward)\s+at\s+(\d+)\s*km\/h/i);
        if (movementMatch) {
            stormData.movement = movementMatch[1] + ' at ' + movementMatch[2] + ' km/h';
        }

        // Extract pressure
        const pressureMatch = textContent.match(/(\d+)\s*hPa/i);
        if (pressureMatch) {
            stormData.pressure = pressureMatch[1] + ' hPa';
        }

        // Set status
        if (stormData.stormName !== 'None') {
            stormData.status = 'Active';
        }
    } catch (error) {
        console.error('Error extracting storm data:', error);
    }

    return stormData;
}

// Extract weather warning data
function extractWarningData($) {
    const warningData = {
        windSignals: {},
        affectedAreas: [],
        warnings: []
    };

    try {
        const textContent = $.text();
        
        // Extract wind signal information
        const signalMatches = textContent.match(/Tropical Cyclone Wind Signal #(\d+)[^#]*?for\s+([^#]+)/gi);
        
        if (signalMatches) {
            signalMatches.forEach(match => {
                const signalMatch = match.match(/Tropical Cyclone Wind Signal #(\d+)[^#]*?for\s+([^#]+)/i);
                if (signalMatch) {
                    const signalLevel = parseInt(signalMatch[1]);
                    const areas = signalMatch[2].split(',').map(area => area.trim());
                    
                    warningData.windSignals[signalLevel] = areas;
                    warningData.affectedAreas.push(...areas);
                }
            });
        }

        // Extract general warnings
        const warningMatches = textContent.match(/(?:warning|advisory|alert)[^.!]*[.!]/gi);
        if (warningMatches) {
            warningData.warnings = warningMatches.slice(0, 5);
        }
    } catch (error) {
        console.error('Error extracting warning data:', error);
    }

    return warningData;
}

// Generate weather data for different regions
function generateWeatherData(stormData, warningData) {
    const now = new Date();
    const currentTime = now.toISOString().slice(0, 16).replace('T', ' ');
    
    // Define major Philippine cities
    const philippineCities = [
        {
            id: 1,
            city: "Manila",
            coordinates: "14.5995°N, 120.9842°E",
            region: "NCR"
        },
        {
            id: 2,
            city: "Cebu City",
            coordinates: "10.3157°N, 123.8854°E",
            region: "Central Visayas"
        },
        {
            id: 3,
            city: "Davao City",
            coordinates: "7.1907°N, 125.4553°E",
            region: "Davao Region"
        },
        {
            id: 4,
            city: "Baguio City",
            coordinates: "16.4023°N, 120.5960°E",
            region: "Cordillera"
        },
        {
            id: 5,
            city: "Iloilo City",
            coordinates: "10.7203°N, 122.5621°E",
            region: "Western Visayas"
        },
        {
            id: 6,
            city: "Zamboanga City",
            coordinates: "6.9214°N, 122.0790°E",
            region: "Zamboanga Peninsula"
        }
    ];

    // Generate weather data for each city
    return philippineCities.map(city => {
        // Determine wind signal level based on affected areas
        let currentSignal = 0;
        let affectedAreas = [];
        
        // Check if this city's region is under any wind signal
        for (const [signalLevel, areas] of Object.entries(warningData.windSignals)) {
            if (areas.some(area => 
                area.toLowerCase().includes(city.region.toLowerCase()) ||
                area.toLowerCase().includes(city.city.toLowerCase())
            )) {
                currentSignal = Math.max(currentSignal, parseInt(signalLevel));
                affectedAreas = areas;
            }
        }

        // Generate realistic weather conditions based on signal level
        const weatherConditions = generateWeatherConditions(currentSignal, stormData);
        
        return {
            id: city.id,
            city: city.city,
            country: "Philippines",
            region: city.region,
            currentSignal: currentSignal,
            coordinates: city.coordinates,
            ...weatherConditions,
            ...stormData,
            affectedAreas: affectedAreas,
            lastUpdated: currentTime,
            nextUpdate: calculateNextUpdate(),
            history: generateHistory(currentSignal, currentTime, stormData),
            signalName: getSignalName(currentSignal),
            description: getSignalDescription(currentSignal)
        };
    });
}

// Generate weather conditions based on signal level
function generateWeatherConditions(signalLevel, stormData) {
    const baseConditions = {
        temperature: "28°C",
        humidity: "75%",
        visibility: "10 km",
        pressure: "1013 hPa"
    };

    if (signalLevel === 0) {
        return {
            ...baseConditions,
            currentWinds: "15-25 km/h",
            gusts: "30-40 km/h",
            direction: "Variable",
            rainfall: "0-5 mm/hr"
        };
    } else if (signalLevel === 1) {
        return {
            ...baseConditions,
            currentWinds: "39-61 km/h",
            gusts: "65-80 km/h",
            direction: determineWindDirection(stormData.movement),
            rainfall: "5-15 mm/hr",
            temperature: "26°C",
            humidity: "80%",
            visibility: "8-12 km",
            pressure: "1005 hPa"
        };
    } else if (signalLevel === 2) {
        return {
            ...baseConditions,
            currentWinds: "62-88 km/h",
            gusts: "90-110 km/h",
            direction: determineWindDirection(stormData.movement),
            rainfall: "15-30 mm/hr",
            temperature: "25°C",
            humidity: "85%",
            visibility: "5-8 km",
            pressure: "995 hPa"
        };
    } else if (signalLevel >= 3) {
        return {
            ...baseConditions,
            currentWinds: "89-117 km/h",
            gusts: "120-150 km/h",
            direction: determineWindDirection(stormData.movement),
            rainfall: "30-50 mm/hr",
            temperature: "24°C",
            humidity: "90%",
            visibility: "3-5 km",
            pressure: "985 hPa"
        };
    }

    return baseConditions;
}

// Determine wind direction based on storm movement
function determineWindDirection(movement) {
    if (!movement || movement === 'N/A') return 'Variable';
    
    if (movement.includes('northward')) return 'S';
    if (movement.includes('southward')) return 'N';
    if (movement.includes('eastward')) return 'W';
    if (movement.includes('westward')) return 'E';
    if (movement.includes('northeastward')) return 'SW';
    if (movement.includes('northwestward')) return 'SE';
    if (movement.includes('southeastward')) return 'NW';
    if (movement.includes('southwestward')) return 'NE';
    
    return 'Variable';
}

// Calculate next update time
function calculateNextUpdate() {
    const now = new Date();
    const currentHour = now.getHours();
    
    // PAGASA typically updates at 5:00 AM, 11:00 AM, 5:00 PM, and 11:00 PM
    const updateHours = [5, 11, 17, 23];
    let nextUpdate = updateHours.find(hour => hour > currentHour);
    
    if (!nextUpdate) {
        nextUpdate = updateHours[0]; // Next day
        now.setDate(now.getDate() + 1);
    }
    
    return `${nextUpdate.toString().padStart(2, '0')}:00`;
}

// Generate history based on signal progression
function generateHistory(currentSignal, currentTime, stormData) {
    const history = [];
    const now = new Date();
    
    if (currentSignal === 0) {
        history.push({
            time: now.toTimeString().slice(0, 5),
            signal: 0,
            event: "No weather warnings in effect",
            winds: "< 39 km/h",
            pressure: "1013 hPa"
        });
    } else {
        // Show signal progression
        for (let i = currentSignal; i >= 0; i--) {
            const time = new Date(now.getTime() - (currentSignal - i) * 2 * 60 * 60 * 1000);
            history.push({
                time: time.toTimeString().slice(0, 5),
                signal: i,
                event: i === 0 ? "Initial weather warning" : `Signal raised to #${i}`,
                winds: i === 0 ? "< 39 km/h" : `${39 + (i - 1) * 25}-${39 + i * 25} km/h`,
                pressure: stormData.pressure !== 'N/A' ? stormData.pressure : `${1013 - i * 10} hPa`
            });
        }
    }
    
    return history;
}

// Get signal name
function getSignalName(signalLevel) {
    const signalNames = {
        0: "No Weather Warning",
        1: "Weather Warning Level 1",
        2: "Weather Warning Level 2",
        3: "Weather Warning Level 3",
        4: "Weather Warning Level 4",
        5: "Weather Warning Level 5"
    };
    return signalNames[signalLevel] || "Unknown";
}

// Get signal description
function getSignalDescription(signalLevel) {
    const descriptions = {
        0: "Normal weather conditions",
        1: "Strong winds expected within 36 hours",
        2: "Very strong winds expected within 24 hours",
        3: "Dangerous winds expected within 18 hours",
        4: "Very dangerous winds expected within 12 hours",
        5: "Extremely dangerous winds expected within 12 hours"
    };
    return descriptions[signalLevel] || "Unknown warning level";
}

        // Health check endpoint
        app.get('/api/health', (req, res) => {
            const uptime = process.uptime();
            const memoryUsage = process.memoryUsage();
            
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                environment: isProduction ? 'production' : 'development',
                port: PORT,
                uptime: `${Math.floor(uptime / 60)} minutes ${Math.floor(uptime % 60)} seconds`,
                memory: {
                    rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
                    heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
                    heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`
                },
                cache: {
                    hasData: !!weatherCache,
                    age: weatherCache ? Date.now() - cacheTimestamp : null,
                    ageMinutes: weatherCache ? Math.round((Date.now() - cacheTimestamp) / 1000 / 60) : null
                },
                version: process.version,
                platform: process.platform
            });
        });

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'weathernowPH.html'));
});

        // Start server
        app.listen(PORT, () => {
            console.log(`PAGASA Weather Proxy Server running on port ${PORT}`);
            
            // Log appropriate URLs based on environment
            if (isProduction) {
                console.log(`Server deployed successfully on Render`);
                console.log(`API endpoint: /api/pagasa/weather`);
                console.log(`Health check: /api/health`);
            } else {
                console.log(`Access the weather app at: http://localhost:${PORT}`);
                console.log(`API endpoint: http://localhost:${PORT}/api/pagasa/weather`);
            }
        });
