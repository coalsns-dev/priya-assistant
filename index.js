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
    'motorcycle': ['kawasaki', 'ninja', 'hayabusa', 'suzuki', 'honda bike', 'yamaha bike', 'bajaj', 'royal enfield', 'bullet', 'pulsar', 'ducati', 'bmw bike', 'ktm', 'harley'],
    'scooter': ['vespa', 'activa', 'access', 'jupiter', 'ntorq', 'burgman', 'scooty', 'aviator', 'pleasure', 'maestro'],
    'car': ['toyota', 'honda car', 'hyundai', 'maruti', 'ford', 'chevrolet', 'bmw car', 'mercedes', 'audi', 'volkswagen', 'skoda', 'tata', 'mahindra', 'renault', 'nissan', 'jeep'],
    'ev': ['tesla', 'tata nexon ev', 'mg zs ev', 'hyundai kona', 'electric car', 'ev bike', 'revolt', 'ather', 'ola electric', 'hero electric', 'kinetic', 'ev scooter', 'electric vehicle']
  };

  const text = userText.toLowerCase();
  
  for (const [type, keywords] of Object.entries(vehicles)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return type;
    }
  }
  return 'vehicle';
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
  // SIMPLIFIED: Use one effective search query
  const searchQuery = `${query} ${vehicleType} forum discussion site:teambhp.com OR site:reddit.com OR site:quora.com`;
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${engineId}&q=${encodeURIComponent(searchQuery)}&num=5`;
  
  console.log(`🔍 Google Search URL:`, url);
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    console.log(`🔍 Google Search Response:`, {
      status: response.status,
      itemsFound: data.items ? data.items.length : 0,
      error: data.error
    });
    
    if (data.error) {
      console.log('❌ Google Search API Error:', data.error);
      return [];
    }
    
    if (data.items && data.items.length > 0) {
      const results = data.items.map(item => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
        source: 'web'
      }));
      console.log(`✅ Google Search Found: ${results.length} results`);
      return results;
    }
    
    console.log('❌ Google Search: No items found');
    return [];
  } catch (error) {
    console.log('❌ Google Search Failed:', error.message);
    return [];
  }
}

// ==================== UNIVERSAL SEARCH FUNCTION - SIMPLIFIED ====================
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
    
    // 2. Google Web Search (DEBUG MODE)
    console.log(`🔍 Starting Google Search...`);
    const webResults = await searchGoogleWeb(query, vehicleType);
    console.log(`🔍 Google Search Completed: ${webResults.length} results`);
    
    if (webResults && webResults.length > 0) {
      webResults.forEach(result => {
        const link = result.link.toLowerCase();
        
        if (link.includes('teambhp.com') || link.includes('reddit.com') || link.includes('forum')) {
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

// ==================== EXTRACT VEHICLE MODEL ====================
function extractVehicleModel(userText) {
  const brands = {
    'motorcycle': ['kawasaki', 'ninja', 'hayabusa', 'suzuki', 'honda', 'yamaha', 'bajaj', 'royal enfield', 'bullet', 'pulsar', 'ducati', 'bmw', 'ktm', 'harley'],
    'scooter': ['vespa', 'activa', 'access', 'jupiter', 'ntorq', 'burgman', 'scooty', 'aviator', 'pleasure', 'maestro'],
    'car': ['toyota', 'honda', 'hyundai', 'maruti', 'ford', 'chevrolet', 'bmw', 'mercedes', 'audi', 'volkswagen', 'skoda', 'tata', 'mahindra', 'renault', 'nissan', 'jeep'],
    'ev': ['tesla', 'nexon ev', 'mg zs', 'kona', 'revolt', 'ather', 'ola', 'hero electric']
  };

  const ignoreWords = ['has', 'have', 'is', 'are', 'my', 'the', 'a', 'an', 'with', 'having', 'issue', 'problem', 'not', 'now', 'electrical', 'engine', 'brake', 'charging', 'battery'];
  
  const text = userText.toLowerCase();
  let foundBrand = '';
  
  for (const [type, typeBrands] of Object.entries(brands)) {
    for (const brand of typeBrands) {
      if (text.includes(brand) && brand.length > foundBrand.length) {
        foundBrand = brand;
      }
    }
  }

  if (foundBrand) {
    const brandIndex = text.indexOf(foundBrand);
    const afterBrand = text.substring(brandIndex + foundBrand.length).trim();
    const words = afterBrand.split(' ');
    
    let modelExtension = '';
    for (const word of words) {
      if (ignoreWords.includes(word)) break;
      if (word.length > 0) modelExtension += ' ' + word;
    }
    
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
    'engine issue': ['engine', 'overheating', 'starting', 'stalling', 'knocking'],
    'brake problem': ['brake', 'stopping', 'pedal', 'disc', 'drum'],
    'electrical problem': ['electrical', 'wiring', 'lights', 'ignition', 'battery', 'fuse', 'alternator'],
    'starting problem': ['starting', 'crank'],
    'unusual noise': ['noise', 'sound', 'knocking', 'rattling'],
    'charging problem': ['charging', 'charger'],
    'battery issue': ['battery', 'power'],
    'mileage issue': ['mileage', 'fuel efficiency', 'consumption']
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
      // 2. COMPLETE PROBLEM DETECTION
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
          const vehicleType = detectVehicleType(userText);
          const cleanModel = extractVehicleModel(userText);
          updateMemory(chatId, 'vehicleType', vehicleType);
          updateMemory(chatId, 'model', cleanModel);
          updateMemory(chatId, 'originalQuery', userText);
          
          if (vehicleType === 'ev') {
            response = `⚡ Excellent! You have an electric vehicle (${cleanModel}). What specific issue?`;
          } else if (vehicleType === 'scooter') {
            response = `🛵 Excellent! You have a scooter (${cleanModel}). What specific issue?`;
          } else if (vehicleType === 'car') {
            response = `🚗 Excellent! You have a car (${cleanModel}). What specific issue?`;
          } else {
            response = `🏍️ Excellent! You have a motorcycle (${cleanModel}). What specific issue?`;
          }
        }
      }
      // 3. UNIVERSAL SEARCH TRIGGER
      else if (memory.vehicleType && memory.model && memory.issue && 
               (userTextLower === 'yes' || userTextLower === 'yep' || userTextLower === 'yeah' || userTextLower === 'search' || 
                userTextLower.includes('video') || userTextLower.includes('find') || userTextLower.includes('show') || userTextLower.includes('go'))) {
        
        const searchQuery = memory.originalQuery || `${memory.model} ${memory.issue}`;
        
        response = `🔍 **Searching across the entire internet for "${searchQuery}"...**\n\nThis might take a moment as I check videos, forums, and technical sites!`;
        
        await bot.sendMessage(chatId, response);
        
        const universalResults = await searchUniversalSolutions(searchQuery, memory.vehicleType);
        const finalResponse = generateUniversalResponse(universalResults, searchQuery, memory.vehicleType);
        
        await bot.sendMessage(chatId, finalResponse);
        clearMemory(chatId);
        
        res.sendStatus(200);
        return;
      }
      // 4. COLLECT VEHICLE INFORMATION
      else if (userTextLower.includes('kawasaki') || userTextLower.includes('ninja') || userTextLower.includes('hayabusa') || userTextLower.includes('suzuki') || 
               userTextLower.includes('honda') || userTextLower.includes('yamaha') || userTextLower.includes('toyota') || userTextLower.includes('hyundai') ||
               userTextLower.includes('ford') || userTextLower.includes('tesla') || userTextLower.includes('activa') || userTextLower.includes('vespa') ||
               userTextLower.includes('electric') || userTextLower.includes('ev') || userTextLower.includes('scooter') || userTextLower.includes('car')) {
        
        const vehicleType = detectVehicleType(userText);
        const cleanModel = extractVehicleModel(userText);
        
        updateMemory(chatId, 'vehicleType', vehicleType);
        updateMemory(chatId, 'model', cleanModel);
        updateMemory(chatId, 'originalQuery', userText);
        
        if (vehicleType === 'ev') {
          response = `⚡ Excellent! You have an electric vehicle (${cleanModel}). What specific issue?`;
        } else if (vehicleType === 'scooter') {
          response = `🛵 Excellent! You have a scooter (${cleanModel}). What specific issue?`;
        } else if (vehicleType === 'car') {
          response = `🚗 Excellent! You have a car (${cleanModel}). What specific issue?`;
        } else {
          response = `🏍️ Excellent! You have a motorcycle (${cleanModel}). What specific issue?`;
        }
      }
      // 5. COLLECT ISSUE DESCRIPTION
      else if (memory.model && (userTextLower.includes('spark') || userTextLower.includes('plug') || userTextLower.includes('engine') || userTextLower.includes('brake') || 
                               userTextLower.includes('oil') || userTextLower.includes('electrical') || userTextLower.includes('starting') || userTextLower.includes('noise') ||
                               userTextLower.includes('charging') || userTextLower.includes('battery') || userTextLower.includes('range') || userTextLower.includes('motor'))) {
        
        const cleanIssue = extractIssue(userText);
        updateMemory(chatId, 'issue', cleanIssue);
        updateMemory(chatId, 'originalQuery', `${memory.model} ${userText}`);
        
        response = `Perfect! I understand: ${memory.model} with ${cleanIssue} issue. 🎯\n\nShould I search across videos, forums, and technical sites for solutions? (Say YES or SEARCH)`;
      }
      // 6. FALLBACK
      else {
        response = "I specialize in vehicle repair solutions across the entire internet! Tell me your vehicle (car, bike, scooter, or EV) and what's wrong, and I'll search everywhere for expert solutions. 🚗🏍️🛵";
      }

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
  console.log(`🌐 Google Search API: DEBUG MODE`);
  console.log(`🏍️ Vehicle Types: Motorcycles, Scooters, Cars, EVs`);
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
