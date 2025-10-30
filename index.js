const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Your Telegram bot token from environment variable
const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, {polling: false});

// ==================== ENHANCED VEHICLE DETECTION ====================
function detectVehicleType(userText) {
  const vehicles = {
    // Motorcycles
    'motorcycle': ['kawasaki', 'ninja', 'hayabusa', 'suzuki', 'honda bike', 'yamaha bike', 'bajaj', 'royal enfield', 'bullet', 'pulsar', 'ducati', 'bmw bike', 'ktm', 'harley'],
    
    // Scooters
    'scooter': ['vespa', 'activa', 'access', 'jupiter', 'ntorq', 'burgman', 'scooty', 'aviator', 'pleasure', 'maestro'],
    
    // Cars
    'car': ['toyota', 'honda car', 'hyundai', 'maruti', 'ford', 'chevrolet', 'bmw car', 'mercedes', 'audi', 'volkswagen', 'skoda', 'tata', 'mahindra', 'renault', 'nissan', 'jeep'],
    
    // Electric Vehicles
    'ev': ['tesla', 'tata nexon ev', 'mg zs ev', 'hyundai kona', 'electric car', 'ev bike', 'revolt', 'ather', 'ola electric', 'hero electric', 'kinetic', 'ev scooter', 'electric vehicle']
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
    'engine': ['engine', 'overheating', 'starting', 'stalling', 'knocking', 'smoke', 'compression', 'cylinder', 'piston'],
    'electrical': ['battery', 'wiring', 'lights', 'ignition', 'spark', 'fuse', 'alternator', 'starter', 'horn'],
    'transmission': ['gear', 'clutch', 'shifting', 'transmission', 'automatic', 'manual', 'gearbox'],
    'brakes': ['brake', 'stopping', 'pedal', 'disc', 'drum', 'abs', 'braking'],
    'suspension': ['suspension', 'shock', 'handle', 'steering', 'vibration', 'handlebar', 'wheel'],
    'fuel': ['fuel', 'petrol', 'diesel', 'mileage', 'injection', 'carburetor', 'mpg', 'consumption'],
    
    // EV-specific issues
    'ev_battery': ['battery range', 'charging time', 'battery life', 'range anxiety', 'battery health'],
    'ev_charging': ['charging', 'charger', 'charging station', 'slow charging', 'fast charging', 'ac charger', 'dc charger'],
    'ev_motor': ['motor', 'acceleration', 'power', 'torque', 'electric motor'],
    'ev_software': ['software', 'update', 'glitch', 'display', 'touchscreen', 'app']
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
        channel: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.default.url
      }));
    }
    return null;
  } catch (error) {
    console.log('YouTube API error:', error);
    return null;
  }
}

// ==================== GOOGLE WEB SEARCH FUNCTION ====================
async function searchGoogleWeb(query, vehicleType) {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const engineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
  
  if (!apiKey || !engineId) {
    console.log('Google Search API not configured');
    return [];
  }
  
  // ENHANCED: Better search queries for forums
  const searchQueries = [
    `${query} ${vehicleType} forum discussion`,
    `${query} ${vehicleType} community solutions`,
    `${query} ${vehicleType} teambhp forum`,
    `${query} ${vehicleType} repair guide`
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
          // Avoid duplicates
          if (!allResults.some(existing => existing.link === item.link)) {
            allResults.push({
              title: item.title,
              link: item.link,
              snippet: item.snippet,
              source: 'web'
            });
          }
        });
      }
    } catch (error) {
      console.log('Google Search failed for query:', searchQuery, error.message);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return allResults.slice(0, 8); // Return max 8 results
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
    // 1. YouTube Search (Existing - Working)
    const youtubeResults = await searchYouTubeVideos(query);
    if (youtubeResults && youtubeResults.length > 0) {
      searchResults.videos = youtubeResults.slice(0, 3);
    }
    
    // 2. Google Web Search (NEW - Internet Wide)
    const webResults = await searchGoogleWeb(query, vehicleType);
    if (webResults && webResults.length > 0) {
      // ENHANCED: Better categorization
      webResults.forEach(result => {
        const link = result.link.toLowerCase();
        const title = result.title.toLowerCase();
        
        if (link.includes('stackoverflow') || link.includes('github') || link.includes('technical')) {
          searchResults.technical.push(result);
        } else if (link.includes('forum') || link.includes('community') || link.includes('teambhp') || 
                   link.includes('reddit') || link.includes('discussion') || title.includes('forum')) {
          searchResults.forums.push(result);
        } else if (link.includes('blog') || link.includes('article') || link.includes('guide') || 
                   title.includes('how to') || title.includes('guide')) {
          searchResults.articles.push(result);
        } else {
          searchResults.articles.push(result);
        }
      });
    }
    
    return searchResults;
    
  } catch (error) {
    console.log('Universal search error, falling back to YouTube only');
    const youtubeResults = await searchYouTubeVideos(query);
    return { videos: youtubeResults || [], articles: [], forums: [], technical: [] };
  }
}

// ==================== GENERATE UNIVERSAL RESPONSE ====================
function generateUniversalResponse(searchResults, userQuery, vehicleType) {
  let response = `🔧 **Universal Solutions for ${userQuery}**\n\n`;
  
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
  
  // Forum Results - PRIORITIZE FORUMS
  if (searchResults.forums.length > 0) {
    hasContent = true;
    response += `🌐 **Forum Discussions:**\n`;
    searchResults.forums.slice(0, 3).forEach((forum, index) => {
      // Shorten long titles
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
  
  // Web Articles
  if (searchResults.articles.length > 0 && searchResults.forums.length === 0) {
    hasContent = true;
    response += `📖 **Helpful Articles:**\n`;
    searchResults.articles.slice(0, 2).forEach((article, index) => {
      const shortTitle = article.title.length > 60 ? article.title.substring(0, 60) + '...' : article.title;
      response += `${index + 1}. ${shortTitle}\n`;
      response += `   👉 ${article.link}\n\n`;
    });
  }
  
  if (!hasContent) {
    response = `I searched across videos, forums, and technical sites but couldn't find specific solutions for "${userQuery}".\n\nTry:\n• Rephrasing your question\n• Being more specific about the issue\n• Asking about a different vehicle problem`;
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

// ==================== EXTRACT VEHICLE MODEL (FIXED VERSION) ====================
function extractVehicleModel(userText) {
  const brands = {
    'motorcycle': ['kawasaki', 'ninja', 'hayabusa', 'suzuki', 'honda', 'yamaha', 'bajaj', 'royal enfield', 'bullet', 'pulsar', 'ducati', 'bmw', 'ktm', 'harley'],
    'scooter': ['vespa', 'activa', 'access', 'jupiter', 'ntorq', 'burgman', 'scooty', 'aviator', 'pleasure', 'maestro'],
    'car': ['toyota', 'honda', 'hyundai', 'maruti', 'ford', 'chevrolet', 'bmw', 'mercedes', 'audi', 'volkswagen', 'skoda', 'tata', 'mahindra', 'renault', 'nissan', 'jeep'],
    'ev': ['tesla', 'nexon ev', 'mg zs', 'kona', 'revolt', 'ather', 'ola', 'hero electric']
  };

  // Common words to ignore when extracting model
  const ignoreWords = ['has', 'have', 'is', 'are', 'my', 'the', 'a', 'an', 'with', 'having', 'issue', 'problem', 'not', 'now', 'electrical', 'engine', 'brake', 'charging', 'battery'];
  
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

// ==================== EXTRACT ISSUE (FIXED VERSION) ====================
function extractIssue(userText) {
  const issues = {
    'spark plug': ['spark', 'plug'],
    'engine issue': ['engine', 'overheating', 'starting', 'stalling', 'knocking'],
    'brake problem': ['brake', 'stopping', 'pedal', 'disc', 'drum'],
    'oil issue': ['oil', 'lubricant', 'lubrication'],
    'electrical problem': ['electrical', 'wiring', 'lights', 'ignition', 'battery', 'fuse', 'alternator'],
    'starting problem': ['starting', 'crank'],
    'unusual noise': ['noise', 'sound', 'knocking', 'rattling'],
    'chain maintenance': ['chain', 'sprocket'],
    'tire issue': ['tire', 'tyre', 'wheel'],
    'charging problem': ['charging', 'charger'],
    'battery issue': ['battery', 'power'],
    'range anxiety': ['range', 'mileage', 'distance'],
    'mileage issue': ['mileage', 'fuel efficiency', 'consumption'],
    'acceleration problem': ['acceleration', 'power', 'torque'],
    'overheating': ['overheating', 'heat', 'temperature']
  };
  
  const text = userText.toLowerCase();
  
  // Find the most specific issue match
  for (const [issue, keywords] of Object.entries(issues)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return issue;
    }
  }
  
  // If no specific issue found, return general problem
  if (text.includes('problem') || text.includes('issue') || text.includes('help')) {
    return 'general problem';
  }
  
  return null;
}

// ==================== CHECK IF MESSAGE HAS BOTH VEHICLE AND ISSUE ====================
function hasBothVehicleAndIssue(userText) {
  const vehicleKeywords = ['kawasaki', 'ninja', 'hayabusa', 'suzuki', 'honda', 'yamaha', 'toyota', 'hyundai',
                          'ford', 'tesla', 'activa', 'vespa', 'electric', 'ev', 'scooter', 'car', 'bike', 'vehicle'];
  
  const issueKeywords = ['spark', 'plug', 'engine', 'brake', 'oil', 'electrical', 'starting', 'noise',
                        'charging', 'battery', 'range', 'motor', 'mileage', 'overheating', 'problem', 'issue', 'help'];
  
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
          updateMemory(chatId, 'originalQuery', userText); // Store original query for better search
          
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
          response = `🔍 **Searching specifically in forums for "${searchQuery}"...**`;
          
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
               userTextLower.includes('electric') || userTextLower.includes('ev') || userTextLower.includes('scooter') || userTextLower.includes('car')) {
        
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
                               userTextLower.includes('charging') || userTextLower.includes('battery') || userTextLower.includes('range') || userTextLower.includes('motor'))) {
        
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
  console.log(`🌐 Google Search API: ACTIVE`);
  console.log(`🏍️ Vehicle Types: Motorcycles, Scooters, Cars, EVs`);
  console.log(`🔧 Smart Detection: Vehicle + Issue in one message`);
  console.log(`🔍 Search Sources: Videos + Forums + Technical Sites`);
  console.log(`🔄 Memory Management: FIXED`);
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
