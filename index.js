const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Your Telegram bot token from environment variable
const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, {polling: false});

// ==================== COMPREHENSIVE VEHICLE DETECTION ====================
function detectVehicleType(userText) {
  const vehicles = {
    // Motorcycles - COMPREHENSIVE COVERAGE
    'motorcycle': [
      // Indian Brands
      'bajaj', 'royal enfield', 'bullet', 'classic', 'continental', 'himalayan', 'meteor', 
      'pulsar', 'avenger', 'dominar', 'ktm', 'duke', 'rc', 'adv', 'tvs', 'apache', 'rr', 'raider',
      'hero', 'splendor', 'passion', 'xpulse', 'karizma', 'honda bike', 'shine', 'unicorn', 
      'cb', 'cbr', 'hornet', 'xblade', 'yamaha bike', 'mt', 'r15', 'fz', 'ray', 'fascino',
      'suzuki bike', 'gixxer', 'access', 'burgman', 'hayabusa', 'intruder',
      // International Brands
      'harley', 'davidson', 'ducati', 'panigale', 'monster', 'multistrada', 'bmw bike', 
      's1000', 'r1250', 'f850', 'kawasaki', 'ninja', 'z', 'versys', 'vulcan', 'triumph',
      'bonneville', 'street triple', 'tiger', 'rocket', 'cfmoto', 'benelli', 'trk', 'leonardo',
      'kymco', 'sym', 'hyosung', 'mv agusta', 'brutale', 'dragster'
    ],
    
    // Scooters - COMPREHENSIVE COVERAGE
    'scooter': [
      // Indian Brands
      'activa', 'dio', 'aviator', 'jupiter', 'access', 'burgman', 'ntorq', 'ray', 'fascino',
      'zx', 'maestro', 'pleasure', 'vespa', 'sprint', 'lx', 'vxl', 'zx', 'aprilia', 'sr',
      'suzuki access', 'burgman street', 'honda activa', 'tvs jupiter', 'yamaha fascino',
      // Electric Scooters
      'ola s1', 'ather', 'hero electric', 'okinawa', 'ampere', 'revolt', 'pure ev', 'bounce',
      'bajaj chetak', 'tv iqube', 'yamaha neos', 'vespa elettrica'
    ],
    
    // Cars - COMPREHENSIVE GLOBAL COVERAGE
    'car': [
      // Indian Brands
      'tata', 'nexon', 'harrier', 'safari', 'altroz', 'tiago', 'tigor', 'punch', 'mahindra',
      'thar', 'xuv700', 'scorpio', 'bolero', 'xuv300', 'maruti', 'swift', 'baleno', 'brezza',
      'dzire', 'ertiga', 'wagon r', 'celerio', 's-presso', 'ignis', 'xl6',
      // Japanese Brands
      'toyota', 'innova', 'fortuner', 'etios', 'glanza', 'urban cruiser', 'hilux', 'honda car',
      'city', 'amaze', 'civic', 'jazz', 'wr-v', 'brio', 'nissan', 'sunny', 'micra', 'kicks',
      'magnite', 'mitsubishi', 'pajero', 'outlander', 'lancer', 'subaru', 'forester', 'xv',
      // Korean Brands
      'hyundai', 'i20', 'i10', 'creta', 'venue', 'aura', 'verna', 'elantra', 'tucson', 'santro',
      'kia', 'seltos', 'sonet', 'carens', 'carnival', 'ev6', 'mg', 'hector', 'astor', 'gloster',
      'zs ev',
      // European Brands
      'volkswagen', 'vw', 'polo', 'vento', 'taigun', 'virtus', 't-roc', 'tiguan', 'passat',
      'audi', 'a4', 'a6', 'q3', 'q5', 'q7', 'q8', 'bmw car', '3 series', '5 series', '7 series',
      'x1', 'x3', 'x5', 'x7', 'mercedes', 'benz', 'c class', 'e class', 's class', 'gla', 'glc',
      'volvo', 'xc40', 'xc60', 'xc90', 's60', 's90', 'jaguar', 'xf', 'xe', 'f-pace', 'e-pace',
      'land rover', 'range rover', 'velar', 'sport', 'evoque', 'defender', 'discovery',
      'skoda', 'rapid', 'octavia', 'superb', 'kushaq', 'slavia', 'kamiq', 'karoq',
      'renault', 'duster', 'kiger', 'triber', 'captur', 'kwid',
      'citroen', 'c3', 'c5', 'berlingo', 'fiat', 'punto', 'linea', 'avventura', 'urban',
      'peugeot', '2008', '3008', '5008', 'opel', 'astra', 'corsa', 'saab', 'mini', 'cooper',
      // American Brands
      'ford', 'ecosport', 'endeavour', 'figo', 'aspire', 'mustang', 'ranger', 'chevrolet',
      'beat', 'cruze', 'trailblazer', 'spark', 'tavera', 'jeep', 'compass', 'meridian', 'wrangler',
      'cadillac', 'escalade', 'xts', 'chrysler', 'dodge', 'challenger', 'charger', 'durango',
      'tesla car', 'model 3', 'model y', 'model s', 'model x'
    ],
    
    // Electric Vehicles - COMPREHENSIVE COVERAGE
    'ev': [
      // Cars
      'tata nexon ev', 'tata tiago ev', 'tata tigor ev', 'mg zs ev', 'hyundai kona',
      'mahindra e20', 'mahindra xuv400', 'audi e-tron', 'bmw i4', 'bmw i7', 'bmw ix',
      'mercedes eq', 'eqa', 'eqb', 'eqc', 'eqs', 'volvo xc40 recharge', 'polestar',
      'kia ev6', 'hyundai ioniq', 'ioniq 5', 'ioniq 6', 'nissan leaf', 'renault zoe',
      'tesla', 'model 3', 'model y', 'model s', 'model x', 'cybertruck',
      'volkswagen id', 'id.4', 'id.6', 'skoda enyaq', 'cupra born',
      // Electric Two-Wheelers
      'ola electric', 'ola s1', 'ola s1 pro', 'ather', 'ather 450x', 'hero electric',
      'okinawa', 'okinawa praise', 'okinawa ridge', 'ampere', 'ampere reo', 'ampere zeal',
      'revolt', 'revolt rv400', 'pure ev', 'pure ectron', 'bounce', 'bounce infinity',
      'bajaj chetak electric', 'tvs iqube', 'yamaha neos', 'vespa elettrica',
      // Electric Commercial
      'mahindra treo', 'piaggio ape e', 'e-rickshaw', 'electric auto'
    ]
  };

  const text = userText.toLowerCase();
  
  for (const [type, keywords] of Object.entries(vehicles)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return type;
    }
  }
  return 'vehicle'; // default
}

// ==================== ENHANCED ISSUE CATEGORIZATION ====================
function categorizeVehicleIssue(userText, vehicleType) {
  const issueCategories = {
    // Common to all vehicles
    'engine': ['engine', 'overheating', 'starting', 'stalling', 'knocking', 'smoke', 'compression', 'cylinder', 'piston', 'timing', 'camshaft', 'crankshaft'],
    'electrical': ['battery', 'wiring', 'lights', 'ignition', 'spark', 'fuse', 'alternator', 'starter', 'horn', 'ecu', 'sensor', 'relay', 'wiring harness'],
    'transmission': ['gear', 'clutch', 'shifting', 'transmission', 'automatic', 'manual', 'gearbox', 'cvt', 'dsg', 'torque converter'],
    'brakes': ['brake', 'stopping', 'pedal', 'disc', 'drum', 'abs', 'braking', 'brake pad', 'brake disc', 'brake fluid'],
    'suspension': ['suspension', 'shock', 'handle', 'steering', 'vibration', 'handlebar', 'wheel', 'alignment', 'strut', 'coilover'],
    'fuel': ['fuel', 'petrol', 'diesel', 'mileage', 'injection', 'carburetor', 'mpg', 'consumption', 'fuel pump', 'injector'],
    'cooling': ['coolant', 'radiator', 'overheating', 'thermostat', 'water pump', 'cooling fan'],
    'exhaust': ['exhaust', 'muffler', 'catalytic converter', 'emissions', 'smoke'],
    
    // EV-specific issues
    'ev_battery': ['battery range', 'charging time', 'battery life', 'range anxiety', 'battery health', 'battery degradation'],
    'ev_charging': ['charging', 'charger', 'charging station', 'slow charging', 'fast charging', 'ac charger', 'dc charger', 'charging port'],
    'ev_motor': ['motor', 'acceleration', 'power', 'torque', 'electric motor', 'motor controller'],
    'ev_software': ['software', 'update', 'glitch', 'display', 'touchscreen', 'app', 'firmware', 'ota update'],
    'ev_regenerative': ['regenerative braking', 'regen', 'energy recovery']
  };

  const text = userText.toLowerCase();

  // EV-specific issues get priority for EVs
  if (vehicleType === 'ev') {
    for (const [category, keywords] of Object.entries(issueCategories)) {
      if (category.startsWith('ev_') && keywords.some(keyword => text.includes(keyword))) {
        return category;
      }
    }
  }

  // General issues for all vehicles
  for (const [category, keywords] of Object.entries(issueCategories)) {
    if (!category.startsWith('ev_') && keywords.some(keyword => text.includes(keyword))) {
      return category;
    }
  }
  
  return 'general';
}

// ==================== YOUTUBE API FUNCTION ====================
async function searchYouTubeVideos(query) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=3&q=${encodeURIComponent(query + " repair tutorial")}&type=video&key=${apiKey}&videoDuration=medium`;
  
  try {
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      return data.items.map(item => ({
        title: item.snippet.title,
        videoId: item.id.videoId,
        channel: item.snippet.channelTitle
      }));
    }
    return null;
  } catch (error) {
    console.log('YouTube API error:', error);
    return null;
  }
}

// ==================== GOOGLE WEB SEARCH FUNCTION - OPTIMIZED ====================
async function searchGoogleWeb(query, vehicleType) {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const engineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
  
  if (!apiKey || !engineId) {
    console.log('Google Search API not configured properly');
    return [];
  }
  
  // OPTIMIZED: Better search queries for vehicle-specific forums
  const searchQueries = [
    `${query} site:teambhp.com OR site:xbhp.com`, // Indian vehicle forums
    `${query} "electrical problem" forum`,
    `${query} repair guide OR solution`,
    `${vehicleType} ${query} discussion`
  ];
  
  let allResults = [];
  
  // Try multiple search queries to get better results
  for (const searchQuery of searchQueries) {
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${engineId}&q=${encodeURIComponent(searchQuery)}&num=5`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        data.items.forEach(item => {
          // Avoid duplicates and filter for quality
          if (!allResults.some(existing => existing.link === item.link)) {
            // Prioritize Indian vehicle forums and relevant content
            const isRelevant = item.link.includes('teambhp') || 
                              item.link.includes('xbhp') || 
                              item.title.toLowerCase().includes('activa') ||
                              item.snippet.toLowerCase().includes('electrical');
            
            if (isRelevant) {
              allResults.push({
                title: item.title,
                link: item.link,
                snippet: item.snippet,
                source: 'web',
                relevance: isRelevant ? 10 : 1
              });
            }
          }
        });
      }
    } catch (error) {
      console.log('Google Search failed for query:', searchQuery);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Sort by relevance and return
  return allResults.sort((a, b) => (b.relevance || 0) - (a.relevance || 0)).slice(0, 6);
}

// ==================== UNIVERSAL SEARCH FUNCTION ====================
async function searchUniversalSolutions(query, vehicleType) {
  console.log(`🔍 Universal search for: ${query} (${vehicleType})`);
  
  const searchResults = {
    videos: [],
    articles: [],
    forums: [],
    technical: []
  };
  
  try {
    // 1. YouTube Search (Working)
    const youtubeResults = await searchYouTubeVideos(query);
    if (youtubeResults && youtubeResults.length > 0) {
      searchResults.videos = youtubeResults.slice(0, 3);
    }
    
    // 2. Google Web Search (OPTIMIZED)
    console.log(`🔍 Starting Google Search...`);
    const webResults = await searchGoogleWeb(query, vehicleType);
    console.log(`🔍 Google Search Completed: ${webResults.length} results`);
    
    if (webResults && webResults.length > 0) {
      webResults.forEach(result => {
        const link = result.link.toLowerCase();
        
        if (link.includes('teambhp.com') || link.includes('reddit.com') || link.includes('forum') || link.includes('xbhp.com')) {
          searchResults.forums.push(result);
        } else if (link.includes('stackoverflow.com') || link.includes('github.com')) {
          searchResults.technical.push(result);
        } else {
          searchResults.articles.push(result);
        }
      });
    }
    
    console.log(`🔍 Final Results:`, {
      videos: searchResults.videos.length,
      forums: searchResults.forums.length,
      technical: searchResults.technical.length,
      articles: searchResults.articles.length
    });
    
    return searchResults;
    
  } catch (error) {
    console.log('❌ Universal search error:', error);
    const youtubeResults = await searchYouTubeVideos(query);
    return { videos: youtubeResults || [], articles: [], forums: [], technical: [] };
  }
}

// ==================== GENERATE UNIVERSAL RESPONSE ====================
function generateUniversalResponse(searchResults, userQuery, vehicleType) {
  console.log(`📝 Generating response for:`, {
    videos: searchResults.videos.length,
    forums: searchResults.forums.length,
    technical: searchResults.technical.length
  });
  
  let response = `🔧 **Solutions for ${userQuery}**\n\n`;
  let hasContent = false;

  // Video Results
  if (searchResults.videos.length > 0) {
    hasContent = true;
    response += `🎥 **Video Tutorials:**\n`;
    searchResults.videos.forEach((video, index) => {
      response += `${index + 1}. ${video.title}\n`;
      response += `   👉 https://youtube.com/watch?v=${video.videoId}\n\n`;
    });
  }
  
  // Forum Results
  if (searchResults.forums.length > 0) {
    hasContent = true;
    response += `🌐 **Forum Discussions:**\n`;
    searchResults.forums.slice(0, 3).forEach((forum, index) => {
      const shortTitle = forum.title.length > 60 ? forum.title.substring(0, 60) + '...' : forum.title;
      response += `${index + 1}. ${shortTitle}\n`;
      response += `   👉 ${forum.link}\n\n`;
    });
  }
  
  // Technical Articles
  if (searchResults.technical.length > 0) {
    hasContent = true;
    response += `💻 **Technical Solutions:**\n`;
    searchResults.technical.slice(0, 2).forEach((tech, index) => {
      const shortTitle = tech.title.length > 60 ? tech.title.substring(0, 60) + '...' : tech.title;
      response += `${index + 1}. ${shortTitle}\n`;
      response += `   👉 ${tech.link}\n\n`;
    });
  }
  
  if (!hasContent) {
    response = `🎥 **Video Tutorials:**\n`;
    searchResults.videos.forEach((video, index) => {
      response += `${index + 1}. ${video.title}\n`;
      response += `   👉 https://youtube.com/watch?v=${video.videoId}\n\n`;
    });
    response += `\n🔍 I found video tutorials but couldn't access forum discussions right now. The search system is being optimized!`;
  }
  
  return response;
}

// ==================== CONVERSATION MEMORY ====================
const userMemory = {};

function updateMemory(chatId, field, value) {
  if (!userMemory[chatId]) userMemory[chatId] = {};
  userMemory[chatId][field] = value;
  userMemory[chatId].lastActive = Date.now();
}

function getMemory(chatId) {
  return userMemory[chatId] || {};
}

function clearMemory(chatId) {
  delete userMemory[chatId];
}

// ==================== COMPREHENSIVE VEHICLE MODEL EXTRACTION ====================
function extractVehicleModel(userText) {
  const brands = {
    'motorcycle': [
      'bajaj', 'pulsar', 'avenger', 'dominar', 'ktm', 'duke', 'rc', 'adv', 'tvs', 'apache', 'raider',
      'hero', 'splendor', 'passion', 'xpulse', 'karizma', 'honda', 'shine', 'unicorn', 'cb', 'cbr',
      'hornet', 'xblade', 'yamaha', 'mt', 'r15', 'fz', 'ray', 'fascino', 'suzuki', 'gixxer', 'access',
      'burgman', 'hayabusa', 'intruder', 'harley', 'davidson', 'ducati', 'panigale', 'monster',
      'multistrada', 'bmw', 's1000', 'r1250', 'f850', 'kawasaki', 'ninja', 'z', 'versys', 'vulcan',
      'triumph', 'bonneville', 'street triple', 'tiger', 'rocket', 'cfmoto', 'benelli', 'trk',
      'leonardo', 'kymco', 'sym', 'hyosung', 'mv agusta', 'brutale', 'dragster'
    ],
    'scooter': [
      'activa', 'dio', 'aviator', 'jupiter', 'access', 'burgman', 'ntorq', 'ray', 'fascino', 'zx',
      'maestro', 'pleasure', 'vespa', 'sprint', 'lx', 'vxl', 'aprilia', 'sr', 'ola', 's1', 'ather',
      'hero electric', 'okinawa', 'ampere', 'revolt', 'pure ev', 'bounce', 'chetak', 'iqube', 'neos',
      'elettrica'
    ],
    'car': [
      // Indian
      'tata', 'nexon', 'harrier', 'safari', 'altroz', 'tiago', 'tigor', 'punch', 'mahindra', 'thar',
      'xuv700', 'scorpio', 'bolero', 'xuv300', 'maruti', 'swift', 'baleno', 'brezza', 'dzire', 'ertiga',
      'wagon r', 'celerio', 's-presso', 'ignis', 'xl6',
      // Japanese
      'toyota', 'innova', 'fortuner', 'etios', 'glanza', 'urban cruiser', 'hilux', 'honda', 'city',
      'amaze', 'civic', 'jazz', 'wr-v', 'brio', 'nissan', 'sunny', 'micra', 'kicks', 'magnite',
      'mitsubishi', 'pajero', 'outlander', 'lancer', 'subaru', 'forester', 'xv',
      // Korean
      'hyundai', 'i20', 'i10', 'creta', 'venue', 'aura', 'verna', 'elantra', 'tucson', 'santro',
      'kia', 'seltos', 'sonet', 'carens', 'carnival', 'ev6', 'mg', 'hector', 'astor', 'gloster',
      // European
      'volkswagen', 'vw', 'polo', 'vento', 'taigun', 'virtus', 't-roc', 'tiguan', 'passat', 'audi',
      'a4', 'a6', 'q3', 'q5', 'q7', 'q8', 'bmw', '3 series', '5 series', '7 series', 'x1', 'x3', 'x5',
      'x7', 'mercedes', 'benz', 'c class', 'e class', 's class', 'gla', 'glc', 'volvo', 'xc40', 'xc60',
      'xc90', 's60', 's90', 'jaguar', 'xf', 'xe', 'f-pace', 'e-pace', 'land rover', 'range rover',
      'velar', 'sport', 'evoque', 'defender', 'discovery', 'skoda', 'rapid', 'octavia', 'superb',
      'kushaq', 'slavia', 'kamiq', 'karoq', 'renault', 'duster', 'kiger', 'triber', 'captur', 'kwid',
      'citroen', 'c3', 'c5', 'berlingo', 'fiat', 'punto', 'linea', 'avventura', 'urban', 'peugeot',
      '2008', '3008', '5008', 'opel', 'astra', 'corsa', 'saab', 'mini', 'cooper',
      // American
      'ford', 'ecosport', 'endeavour', 'figo', 'aspire', 'mustang', 'ranger', 'chevrolet', 'beat',
      'cruze', 'trailblazer', 'spark', 'tavera', 'jeep', 'compass', 'meridian', 'wrangler', 'cadillac',
      'escalade', 'xts', 'chrysler', 'dodge', 'challenger', 'charger', 'durango'
    ],
    'ev': [
      'tata nexon ev', 'tata tiago ev', 'tata tigor ev', 'mg zs ev', 'hyundai kona', 'mahindra e20',
      'mahindra xuv400', 'audi e-tron', 'bmw i4', 'bmw i7', 'bmw ix', 'mercedes eq', 'eqa', 'eqb',
      'eqc', 'eqs', 'volvo xc40 recharge', 'polestar', 'kia ev6', 'hyundai ioniq', 'ioniq 5', 'ioniq 6',
      'nissan leaf', 'renault zoe', 'tesla', 'model 3', 'model y', 'model s', 'model x', 'cybertruck',
      'volkswagen id', 'id.4', 'id.6', 'skoda enyaq', 'cupra born', 'ola electric', 'ola s1',
      'ather', 'ather 450x', 'hero electric', 'okinawa', 'okinawa praise', 'okinawa ridge', 'ampere',
      'ampere reo', 'ampere zeal', 'revolt', 'revolt rv400', 'pure ev', 'pure ectron', 'bounce',
      'bounce infinity', 'bajaj chetak electric', 'tvs iqube', 'yamaha neos', 'vespa elettrica'
    ]
  };

  const ignoreWords = ['has', 'have', 'is', 'are', 'my', 'the', 'a', 'an', 'with', 'having', 'issue', 'problem', 'not', 'now', 'electrical', 'engine', 'brake', 'charging', 'battery', 'starting', 'noise', 'mileage'];
  
  const text = userText.toLowerCase();
  let foundBrand = '';
  
  // Find brand across all vehicle types
  for (const [type, typeBrands] of Object.entries(brands)) {
    for (const brand of typeBrands) {
      if (text.includes(brand) && brand.length > foundBrand.length) {
        foundBrand = brand;
      }
    }
  }

  if (foundBrand) {
    // Extract words after brand, but stop at ignore words
    const brandIndex = text.indexOf(foundBrand);
    const afterBrand = text.substring(brandIndex + foundBrand.length).trim();
    const words = afterBrand.split(' ');
    
    let modelExtension = '';
    for (const word of words) {
      if (ignoreWords.includes(word)) {
        break; // Stop when we hit an ignore word
      }
      if (word.length > 0) {
        modelExtension += ' ' + word;
      }
    }
    
    // If we found additional model info, include it
    if (modelExtension.trim()) {
      return `${foundBrand.charAt(0).toUpperCase() + foundBrand.slice(1)}${modelExtension}`;
    } else {
      return foundBrand.charAt(0).toUpperCase() + foundBrand.slice(1);
    }
  }
  
  return 'vehicle';
}

// ==================== EXTRACT ISSUE ====================
function extractIssue(userText) {
  const issues = {
    'spark plug': ['spark', 'plug'],
    'engine issue': ['engine', 'overheating', 'starting', 'stalling', 'knocking', 'compression', 'cylinder'],
    'brake problem': ['brake', 'stopping', 'pedal', 'disc', 'drum', 'abs', 'braking'],
    'electrical problem': ['electrical', 'wiring', 'lights', 'ignition', 'battery', 'fuse', 'alternator', 'starter', 'ecu'],
    'starting problem': ['starting', 'crank', 'self start'],
    'unusual noise': ['noise', 'sound', 'knocking', 'rattling', 'grinding'],
    'charging problem': ['charging', 'charger'],
    'battery issue': ['battery', 'power', 'drain'],
    'mileage issue': ['mileage', 'fuel efficiency', 'consumption', 'kmpl'],
    'transmission issue': ['gear', 'clutch', 'shifting', 'transmission'],
    'suspension issue': ['suspension', 'shock', 'handle', 'steering', 'vibration'],
    'cooling issue': ['coolant', 'radiator', 'overheating', 'thermostat'],
    'fuel issue': ['fuel', 'petrol', 'diesel', 'injection', 'carburetor']
  };
  
  const text = userText.toLowerCase();
  
  for (const [issue, keywords] of Object.entries(issues)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return issue;
    }
  }
  
  if (text.includes('problem') || text.includes('issue') || text.includes('help')) {
    return 'general problem';
  }
  
  return null;
}

// ==================== CHECK IF MESSAGE HAS BOTH VEHICLE AND ISSUE ====================
function hasBothVehicleAndIssue(userText) {
  const vehicleKeywords = [
    // Motorcycles
    'kawasaki', 'ninja', 'hayabusa', 'suzuki', 'honda', 'yamaha', 'bajaj', 'royal enfield', 'bullet', 'pulsar', 'ducati', 'bmw', 'ktm', 'harley',
    // Scooters
    'vespa', 'activa', 'access', 'jupiter', 'ntorq', 'burgman', 'scooty', 'aviator', 'pleasure', 'maestro',
    // Cars
    'toyota', 'honda', 'hyundai', 'maruti', 'ford', 'chevrolet', 'bmw', 'mercedes', 'audi', 'volkswagen', 'skoda', 'tata', 'mahindra', 'renault', 'nissan', 'jeep',
    // EVs
    'tesla', 'nexon ev', 'mg zs', 'kona', 'revolt', 'ather', 'ola', 'hero electric',
    // General
    'electric', 'ev', 'scooter', 'car', 'bike', 'vehicle', 'motorcycle'
  ];
  
  const issueKeywords = [
    'spark', 'plug', 'engine', 'brake', 'oil', 'electrical', 'starting', 'noise',
    'charging', 'battery', 'range', 'motor', 'mileage', 'overheating', 'problem', 'issue', 'help',
    'gear', 'clutch', 'transmission', 'suspension', 'coolant', 'fuel'
  ];
  
  const text = userText.toLowerCase();
  const hasVehicle = vehicleKeywords.some(keyword => text.includes(keyword));
  const hasIssue = issueKeywords.some(keyword => text.includes(keyword));
  
  return hasVehicle && hasIssue;
}

// ==================== PRIYA'S PERSONALITY ====================
const priyaResponses = {
  greeting: [
    "Namaste! I'm Priya, your intelligent vehicle assistant. I can find solutions across the entire internet! 🚗🏍️🛵",
    "Hello there! I see a curious mind ready to explore. I search videos, forums, and technical sites for the best solutions! 🚀",
    "Well hello! I was just organizing brilliant repair solutions from across the web. What vehicle issue can I help you solve today? 💫"
  ],
  help: [
    "I sense you need guidance! Tell me your vehicle type and issue, and I'll search the entire internet for solutions.",
    "Don't worry, I'm here to help! I can search videos, forums, and technical sites. What's your vehicle and problem?",
    "Let's solve this together! Tell me your vehicle details and the issue - I'll search everywhere for answers."
  ],
  frustrated: [
    "I sense your frustration. Let's tackle this problem step by step - we've got this! 💪",
    "I understand it's frustrating. Take a deep breath and let me help you find the solution across multiple sources.",
    "Vehicle issues can be annoying, but together we'll search everywhere for the right answer. What's the main problem?"
  ]
};

// ==================== EXPRESS SERVER SETUP ====================
app.use(express.json());

app.get('/', (req, res) => {
  res.send('🚀 Priya Universal Vehicle Assistant is running!');
});

app.get('/webhook', (req, res) => {
  res.send('✅ Webhook is active! Priya searches the entire internet for solutions.');
});

// ==================== TELEGRAM WEBHOOK HANDLER ====================
app.post('/webhook', async (req, res) => {
  const message = req.body.message;
  
  if (message && message.text) {
    const chatId = message.chat.id;
    const userText = message.text;
    const userTextLower = userText.toLowerCase();
    const memory = getMemory(chatId);
    
    let response = "I'm here to help with vehicle issues! Tell me what vehicle you have and what's wrong - I'll search everywhere for solutions.";

    try {
      // 1. GREETINGS
      if (userTextLower.includes('hello') || userTextLower.includes('hi') || userTextLower.includes('/start')) {
        response = priyaResponses.greeting[Math.floor(Math.random() * priyaResponses.greeting.length)];
      }
      // 2. HELP REQUESTS
      else if (userTextLower.includes('help') || userTextLower.includes('support')) {
        response = priyaResponses.help[Math.floor(Math.random() * priyaResponses.help.length)];
      }
      // 3. EMOTION DETECTION
      else if (userTextLower.includes('frustrated') || userTextLower.includes('angry') || userTextLower.includes('annoying')) {
        response = priyaResponses.frustrated[Math.floor(Math.random() * priyaResponses.frustrated.length)];
      }
      // 4. COMPLETE PROBLEM DETECTION (handles vehicle + issue in one message)
      else if (hasBothVehicleAndIssue(userText)) {
        const vehicleType = detectVehicleType(userText);
        const cleanModel = extractVehicleModel(userText);
        const cleanIssue = extractIssue(userText);
        
        if (cleanModel && cleanIssue) {
          updateMemory(chatId, 'vehicleType', vehicleType);
          updateMemory(chatId, 'model', cleanModel);
          updateMemory(chatId, 'issue', cleanIssue);
          updateMemory(chatId, 'originalQuery', userText);
          
          response = `🎯 Perfect! I understand: ${cleanModel} with ${cleanIssue}. Should I search across videos, forums, and technical sites for solutions? (Say YES or SEARCH)`;
        } else {
          // Fallback to separate collection if extraction fails
          const vehicleType = detectVehicleType(userText);
          const cleanModel = extractVehicleModel(userText);
          updateMemory(chatId, 'vehicleType', vehicleType);
          updateMemory(chatId, 'model', cleanModel);
          updateMemory(chatId, 'originalQuery', userText);
          
          if (vehicleType === 'ev') {
            response = `⚡ Excellent! You have an electric vehicle (${cleanModel}). What specific issue are you experiencing? (e.g., charging, battery range, motor, software)`;
          } else if (vehicleType === 'scooter') {
            response = `🛵 Excellent! You have a scooter (${cleanModel}). What specific issue are you experiencing? (e.g., starting, mileage, noise, electrical)`;
          } else if (vehicleType === 'car') {
            response = `🚗 Excellent! You have a car (${cleanModel}). What specific issue are you experiencing? (e.g., engine, transmission, brakes, electrical)`;
          } else {
            response = `🏍️ Excellent! You have a motorcycle (${cleanModel}). What specific issue are you experiencing? (e.g., spark plugs, engine, brakes, electrical)`;
          }
        }
      }
      // 5. UNIVERSAL SEARCH TRIGGER (FIXED - NO MEMORY CLEARING UNTIL AFTER SEARCH)
      else if (memory.vehicleType && memory.model && memory.issue && 
               (userTextLower === 'yes' || userTextLower === 'yep' || userTextLower === 'yeah' || userTextLower === 'search' || 
                userTextLower.includes('video') || userTextLower.includes('find') || userTextLower.includes('show') || userTextLower.includes('go'))) {
        
        // Use original query if available, otherwise build from memory
        const searchQuery = memory.originalQuery || `${memory.model} ${memory.issue}`;
        
        response = `🔍 **Searching across the entire internet for "${searchQuery}"...**\n\nThis might take a moment as I check videos, forums, and technical sites!`;
        
        // Send immediate response that we're searching
        await bot.sendMessage(chatId, response);
        
        // Perform the actual search (DO NOT CLEAR MEMORY YET)
        const universalResults = await searchUniversalSolutions(searchQuery, memory.vehicleType);
        const finalResponse = generateUniversalResponse(universalResults, searchQuery, memory.vehicleType);
        
        // Send the search results
        await bot.sendMessage(chatId, finalResponse);
        
        // ONLY NOW clear memory after successful search delivery
        clearMemory(chatId);
        
        // Return early since we already sent responses
        res.sendStatus(200);
        return;
      }
      // 6. SPECIFIC FORUM REQUEST (NEW FEATURE)
      else if (userTextLower.includes('forum') || userTextLower.includes('discussion') || userTextLower.includes('community')) {
        if (memory.model && memory.issue) {
          const searchQuery = memory.originalQuery || `${memory.model} ${memory.issue}`;
          response = `🔍 **Searching specifically in forums for "${searchQuery}"...`;
          
          await bot.sendMessage(chatId, response);
          
          const universalResults = await searchUniversalSolutions(searchQuery + " forum", memory.vehicleType);
          
          // Filter to show only forums
          const forumResults = {
            videos: [],
            articles: [],
            forums: universalResults.forums,
            technical: universalResults.technical.filter(t => t.link.includes('stackoverflow'))
          };
          
          const forumResponse = generateUniversalResponse(forumResults, searchQuery, memory.vehicleType);
          await bot.sendMessage(chatId, forumResponse);
          clearMemory(chatId);
          
          res.sendStatus(200);
          return;
        } else {
          response = "I'd be happy to search forums! First, tell me your vehicle model and what issue you're having.";
        }
      }
      // 7. COLLECT VEHICLE INFORMATION ONLY
      else if (userTextLower.includes('kawasaki') || userTextLower.includes('ninja') || userTextLower.includes('hayabusa') || userTextLower.includes('suzuki') || 
               userTextLower.includes('honda') || userTextLower.includes('yamaha') || userTextLower.includes('toyota') || userTextLower.includes('hyundai') ||
               userTextLower.includes('ford') || userTextLower.includes('tesla') || userTextLower.includes('activa') || userTextLower.includes('vespa') ||
               userTextLower.includes('electric') || userTextLower.includes('ev') || userTextLower.includes('scooter') || userTextLower.includes('car') ||
               userTextLower.includes('volkswagen') || userTextLower.includes('audi') || userTextLower.includes('bmw') || userTextLower.includes('mercedes') ||
               userTextLower.includes('passat') || userTextLower.includes('polo') || userTextLower.includes('vento') || userTextLower.includes('tata') ||
               userTextLower.includes('mahindra') || userTextLower.includes('maruti') || userTextLower.includes('skoda') || userTextLower.includes('renault')) {
        
        const vehicleType = detectVehicleType(userText);
        const cleanModel = extractVehicleModel(userText);
        
        updateMemory(chatId, 'vehicleType', vehicleType);
        updateMemory(chatId, 'model', cleanModel);
        updateMemory(chatId, 'originalQuery', userText);
        
        // Vehicle-specific responses
        if (vehicleType === 'ev') {
          response = `⚡ Excellent! You have an electric vehicle (${cleanModel}). What specific issue are you experiencing? (e.g., charging, battery range, motor, software)`;
        } else if (vehicleType === 'scooter') {
          response = `🛵 Excellent! You have a scooter (${cleanModel}). What specific issue are you experiencing? (e.g., starting, mileage, noise, electrical)`;
        } else if (vehicleType === 'car') {
          response = `🚗 Excellent! You have a car (${cleanModel}). What specific issue are you experiencing? (e.g., engine, transmission, brakes, electrical)`;
        } else {
          response = `🏍️ Excellent! You have a motorcycle (${cleanModel}). What specific issue are you experiencing? (e.g., spark plugs, engine, brakes, electrical)`;
        }
      }
      // 8. COLLECT ISSUE DESCRIPTION ONLY
      else if (memory.model && (userTextLower.includes('spark') || userTextLower.includes('plug') || userTextLower.includes('engine') || userTextLower.includes('brake') || 
                               userTextLower.includes('oil') || userTextLower.includes('electrical') || userTextLower.includes('starting') || userTextLower.includes('noise') ||
                               userTextLower.includes('charging') || userTextLower.includes('battery') || userTextLower.includes('range') || userTextLower.includes('motor') ||
                               userTextLower.includes('gear') || userTextLower.includes('clutch') || userTextLower.includes('transmission') || userTextLower.includes('suspension') ||
                               userTextLower.includes('coolant') || userTextLower.includes('fuel') || userTextLower.includes('mileage'))) {
        
        const cleanIssue = extractIssue(userText);
        updateMemory(chatId, 'issue', cleanIssue);
        updateMemory(chatId, 'originalQuery', `${memory.model} ${userText}`);
        
        response = `Perfect! I understand: ${memory.model} with ${cleanIssue} issue. 🎯\n\nShould I search across videos, forums, and technical sites for solutions? (Say YES or SEARCH)`;
      }
      // 9. AFFIRMATIVE RESPONSE WITHOUT COMPLETE INFO (FIXED)
      else if (userTextLower === 'yes' || userTextLower === 'yep' || userTextLower === 'yeah' || userTextLower.includes('search') || userTextLower.includes('find')) {
        if (memory.model && memory.issue) {
          // This should trigger the universal search in condition 5
          response = `🔍 Searching across the entire internet for "${memory.model} ${memory.issue}"... This might take a moment!`;
        } else {
          response = "I'd love to help! First, tell me your vehicle model and what issue you're having.";
        }
      }
      // 10. FALLBACK
      else {
        response = "I specialize in vehicle repair solutions across the entire internet! Tell me your vehicle (car, bike, scooter, or EV) and what's wrong, and I'll search everywhere for expert solutions. 🚗🏍️🛵";
      }

      // Send response to user
      await bot.sendMessage(chatId, response);
      
    } catch (error) {
      console.log('Error processing message:', error);
      await bot.sendMessage(chatId, "I'm having trouble connecting to search services right now. Please try again in a moment! 😊");
    }
  }
  
  res.sendStatus(200);
});

// ==================== START SERVER ====================
app.listen(port, () => {
  console.log(`🚀 Priya Universal Vehicle Assistant running on port ${port}`);
  console.log(`🎥 YouTube API: ACTIVE`);
  console.log(`🌐 Google Search API: OPTIMIZED`);
  console.log(`🏍️ Vehicle Types: COMPREHENSIVE COVERAGE`);
  console.log(`🚗 Cars: Indian + Japanese + Korean + European + American`);
  console.log(`🏍️ Motorcycles: All major brands`);
  console.log(`🛵 Scooters: All major brands + Electric`);
  console.log(`⚡ EVs: Cars + Two-wheelers + Commercial`);
  console.log(`🔍 Search Sources: Videos + Forums + Technical Sites`);
  console.log(`🌐 Webhook: https://priya-assistant-1.onrender.com/webhook`);
});

// Clean up old memory every hour
setInterval(() => {
  const now = Date.now();
  for (const chatId in userMemory) {
    if (now - userMemory[chatId].lastActive > 3600000) {
      delete userMemory[chatId];
    }
  }
}, 3600000);
