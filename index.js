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
  const ignoreWords = ['has', 'have', 'is', 'are', 'my', 'the', 'a', 'an', 'with', 'having', 'issue', 'problem', 'not', 'now'];
  
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
  
  return userText;
}

// ==================== EXTRACT ISSUE ====================
function extractIssue(userText) {
  const issues = {
    'spark': 'spark plug',
    'plug': 'spark plug', 
    'engine': 'engine issue',
    'brake': 'brake problem',
    'oil': 'oil change',
    'electrical': 'electrical issue',
    'starting': 'starting problem',
    'noise': 'unusual noise',
    'chain': 'chain maintenance',
    'tire': 'tire issue',
    'charging': 'charging problem',
    'battery': 'battery issue',
    'range': 'range anxiety',
    'mileage': 'mileage issue',
    'acceleration': 'acceleration problem',
    'overheating': 'overheating'
  };
  
  const text = userText.toLowerCase();
  for (const [key, issue] of Object.entries(issues)) {
    if (text.includes(key)) {
      return issue;
    }
  }
  
  return null; // Return null if no issue found
}

// ==================== CHECK IF MESSAGE HAS BOTH VEHICLE AND ISSUE ====================
function hasBothVehicleAndIssue(userText) {
  const vehicleKeywords = ['kawasaki', 'ninja', 'hayabusa', 'suzuki', 'honda', 'yamaha', 'toyota', 'hyundai',
                          'ford', 'tesla', 'activa', 'vespa', 'electric', 'ev', 'scooter', 'car', 'bike'];
  
  const issueKeywords = ['spark', 'plug', 'engine', 'brake', 'oil', 'electrical', 'starting', 'noise',
                        'charging', 'battery', 'range', 'motor', 'mileage', 'overheating', 'problem', 'issue'];
  
  const text = userText.toLowerCase();
  const hasVehicle = vehicleKeywords.some(keyword => text.includes(keyword));
  const hasIssue = issueKeywords.some(keyword => text.includes(keyword));
  
  return hasVehicle && hasIssue;
}

// ==================== PRIYA'S PERSONALITY ====================
const priyaResponses = {
  greeting: [
    "Namaste! I'm Priya, your intelligent vehicle assistant. I can find solutions for cars, bikes, scooters, and EVs! 🚗🏍️🛵",
    "Hello there! I see a curious mind ready to explore. I specialize in finding repair solutions for all types of vehicles! 🚀",
    "Well hello! I was just organizing brilliant repair tutorials. What vehicle issue can I help you solve today? 💫"
  ],
  help: [
    "I sense you need guidance! Tell me your vehicle type and issue, and I'll find perfect solutions.",
    "Don't worry, I'm here to help! What's your vehicle and what problem are you facing?",
    "Let's solve this together! Tell me your vehicle details and the issue."
  ],
  frustrated: [
    "I sense your frustration. Let's tackle this problem step by step - we've got this! 💪",
    "I understand it's frustrating. Take a deep breath and let me help you find the solution.",
    "Vehicle issues can be annoying, but together we'll get through this. What's the main problem?"
  ]
};

// ==================== EXPRESS SERVER SETUP ====================
app.use(express.json());

app.get('/', (req, res) => {
  res.send('🚀 Priya Vehicle Assistant is running!');
});

app.get('/webhook', (req, res) => {
  res.send('✅ Webhook is active! Priya is ready for all vehicles.');
});

// ==================== TELEGRAM WEBHOOK HANDLER ====================
app.post('/webhook', async (req, res) => {
  const message = req.body.message;
  
  if (message && message.text) {
    const chatId = message.chat.id;
    const userText = message.text.toLowerCase();
    const memory = getMemory(chatId);
    
    let response = "I'm here to help with vehicle issues! Tell me what vehicle you have and what's wrong.";

    try {
      // 1. GREETINGS
      if (userText.includes('hello') || userText.includes('hi') || userText.includes('/start')) {
        response = priyaResponses.greeting[Math.floor(Math.random() * priyaResponses.greeting.length)];
      }
      // 2. HELP REQUESTS
      else if (userText.includes('help') || userText.includes('support')) {
        response = priyaResponses.help[Math.floor(Math.random() * priyaResponses.help.length)];
      }
      // 3. EMOTION DETECTION
      else if (userText.includes('frustrated') || userText.includes('angry') || userText.includes('annoying')) {
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
          
          response = `🎯 Perfect! I understand: ${cleanModel} with ${cleanIssue}. Should I find specific video tutorials for this? (Say YES or SEARCH VIDEOS)`;
        } else {
          // Fallback to separate collection if extraction fails
          const vehicleType = detectVehicleType(userText);
          const cleanModel = extractVehicleModel(userText);
          updateMemory(chatId, 'vehicleType', vehicleType);
          updateMemory(chatId, 'model', cleanModel);
          
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
      // 5. VIDEO SEARCH TRIGGER (FIXED - handles ALL affirmative responses)
      else if (memory.vehicleType && memory.model && memory.issue && 
               (userText === 'yes' || userText === 'yep' || userText === 'yeah' || userText === 'search' || 
                userText.includes('video') || userText.includes('find') || userText.includes('show'))) {
        
        const searchQuery = `${memory.model} ${memory.issue}`;
        const videos = await searchYouTubeVideos(searchQuery);
        
        if (videos && videos.length > 0) {
          response = `🎥 **I found these expert videos for your ${memory.model} ${memory.issue}:**\n\n`;
          
          videos.forEach((video, index) => {
            response += `**${index + 1}. ${video.title}**\n`;
            response += `📺 By: ${video.channel}\n`;
            response += `🔗 Watch: https://youtube.com/watch?v=${video.videoId}\n\n`;
          });
          
          response += `Which one looks most helpful? I can find more if needed! 😊`;
          
          // Clear memory after successful video delivery
          clearMemory(chatId);
        } else {
          response = `I searched everywhere but couldn't find perfect videos for "${searchQuery}" right now. 😔\n\nTry searching YouTube directly, or tell me a different issue?`;
          clearMemory(chatId);
        }
      }
      // 6. COLLECT VEHICLE INFORMATION ONLY
      else if (userText.includes('kawasaki') || userText.includes('ninja') || userText.includes('hayabusa') || userText.includes('suzuki') || 
               userText.includes('honda') || userText.includes('yamaha') || userText.includes('toyota') || userText.includes('hyundai') ||
               userText.includes('ford') || userText.includes('tesla') || userText.includes('activa') || userText.includes('vespa') ||
               userText.includes('electric') || userText.includes('ev') || userText.includes('scooter') || userText.includes('car')) {
        
        const vehicleType = detectVehicleType(userText);
        const cleanModel = extractVehicleModel(userText);
        
        updateMemory(chatId, 'vehicleType', vehicleType);
        updateMemory(chatId, 'model', cleanModel);
        
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
      // 7. COLLECT ISSUE DESCRIPTION ONLY
      else if (memory.model && (userText.includes('spark') || userText.includes('plug') || userText.includes('engine') || userText.includes('brake') || 
                               userText.includes('oil') || userText.includes('electrical') || userText.includes('starting') || userText.includes('noise') ||
                               userText.includes('charging') || userText.includes('battery') || userText.includes('range') || userText.includes('motor'))) {
        
        const cleanIssue = extractIssue(userText);
        updateMemory(chatId, 'issue', cleanIssue);
        
        response = `Perfect! I understand: ${memory.model} with ${cleanIssue} issue. 🎯\n\nShould I find specific video tutorials for this? (Say YES or SEARCH VIDEOS)`;
      }
      // 8. AFFIRMATIVE RESPONSE WITHOUT COMPLETE INFO (FIXED)
      else if (userText === 'yes' || userText === 'yep' || userText === 'yeah' || userText.includes('search') || userText.includes('find')) {
        if (memory.model && memory.issue) {
          // This should trigger the video search in condition 5
          response = `🎬 Searching for the best "${memory.model} ${memory.issue}" tutorials... This will take just a moment!`;
        } else {
          response = "I'd love to help! First, tell me your vehicle model and what issue you're having.";
        }
      }
      // 9. FALLBACK
      else {
        response = "I specialize in vehicle repair solutions! Tell me your vehicle (car, bike, scooter, or EV) and what's wrong, and I'll find expert tutorials. 🚗🏍️🛵";
      }

      // Send response to user
      await bot.sendMessage(chatId, response);
      
    } catch (error) {
      console.log('Error processing message:', error);
      await bot.sendMessage(chatId, "I'm having trouble connecting right now. Please try again in a moment! 😊");
    }
  }
  
  res.sendStatus(200);
});

// ==================== START SERVER ====================
app.listen(port, () => {
  console.log(`🚀 Priya Vehicle Assistant running on port ${port}`);
  console.log(`🎥 YouTube API: ACTIVE`);
  console.log(`🏍️ Vehicle Types: Motorcycles, Scooters, Cars, EVs`);
  console.log(`🔧 Smart Detection: Vehicle + Issue in one message`);
  console.log(`✅ Fixed: Yep/Yes handling`);
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
