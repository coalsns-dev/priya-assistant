const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Your Telegram bot token from environment variable
const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, {polling: false});

// ==================== YOUTUBE API FUNCTION ====================
async function searchYouTubeVideos(query) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=3&q=${encodeURIComponent(query + " motorcycle repair tutorial")}&type=video&key=${apiKey}&videoDuration=medium`;
  
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

// ==================== EXTRACT BIKE MODEL FROM TEXT ====================
function extractBikeModel(userText) {
  const brands = ['kawasaki', 'ninja', 'hayabusa', 'suzuki', 'honda', 'yamaha', 'bajaj', 'royal enfield', 'bullet', 'pulsar', 'ducati', 'bmw'];
  const models = ['ninja', 'hayabusa', 'cbr', 'r15', 'mt', 'pulsar', 'apache', 'bullet', 'classic', 'continental'];
  
  let foundBrand = '';
  let foundModel = '';
  
  // Find brand
  for (const brand of brands) {
    if (userText.includes(brand)) {
      foundBrand = brand;
      break;
    }
  }
  
  // Find model
  for (const model of models) {
    if (userText.includes(model)) {
      foundModel = model;
      break;
    }
  }
  
  // Format nicely: "Kawasaki Ninja" instead of "kawasaki ninja"
  if (foundBrand && foundModel) {
    return `${foundBrand.charAt(0).toUpperCase() + foundBrand.slice(1)} ${foundModel.charAt(0).toUpperCase() + foundModel.slice(1)}`;
  } else if (foundBrand) {
    return foundBrand.charAt(0).toUpperCase() + foundBrand.slice(1);
  }
  
  return userText; // Fallback to original text
}

// ==================== EXTRACT ISSUE FROM TEXT ====================
function extractIssue(userText) {
  const issues = {
    'spark': 'spark plug',
    'plug': 'spark plug', 
    'engine': 'engine',
    'brake': 'brake',
    'oil': 'oil change',
    'electrical': 'electrical',
    'starting': 'starting issue',
    'noise': 'unusual noise',
    'chain': 'chain maintenance',
    'tire': 'tire issue'
  };
  
  for (const [key, issue] of Object.entries(issues)) {
    if (userText.includes(key)) {
      return issue;
    }
  }
  
  return userText; // Fallback to original text
}

// ==================== PRIYA'S PERSONALITY ====================
const priyaResponses = {
  greeting: [
    "Namaste! I'm Priya, your intelligent assistant. I can find video tutorials for any motorcycle issue! 🏍️",
    "Hello there! I see a curious mind ready to explore. I specialize in finding exact repair videos for your bike! 🚀",
    "Well hello! I was just organizing some brilliant video tutorials. What motorcycle issue can I help you solve today? 💫"
  ],
  help: [
    "I sense you need guidance! Tell me your motorcycle model and issue, and I'll find perfect video tutorials.",
    "Don't worry, I'm here to help! What's your bike model and what problem are you facing?",
    "Let's solve this together! Tell me your motorcycle details and the issue."
  ],
  frustrated: [
    "I sense your frustration. Let's tackle this problem step by step - we've got this! 💪",
    "I understand it's frustrating. Take a deep breath and let me help you find the solution.",
    "Technical issues can be annoying, but together we'll get through this. What's the main problem?"
  ]
};

// ==================== EXPRESS SERVER SETUP ====================
app.use(express.json());

app.get('/', (req, res) => {
  res.send('🚀 Priya Assistant is running with YouTube API!');
});

app.get('/webhook', (req, res) => {
  res.send('✅ Webhook is active! Priya is ready with video intelligence.');
});

// ==================== TELEGRAM WEBHOOK HANDLER ====================
app.post('/webhook', async (req, res) => {
  const message = req.body.message;
  
  if (message && message.text) {
    const chatId = message.chat.id;
    const userText = message.text.toLowerCase();
    const memory = getMemory(chatId);
    
    let response = "I'm here to help with motorcycle issues! Tell me your bike model and what's wrong.";

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
      // 4. VIDEO SEARCH TRIGGER (When we have complete info)
      else if (memory.model && memory.issue && (userText.includes('yes') || userText.includes('find') || userText.includes('video') || userText.includes('search'))) {
        
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
      // 5. COLLECT MOTORCYCLE MODEL (FIXED VERSION)
      else if (userText.includes('kawasaki') || userText.includes('ninja') || userText.includes('hayabusa') || userText.includes('suzuki') || userText.includes('honda') || userText.includes('yamaha') || userText.includes('bajaj') || userText.includes('royal enfield')) {
        
        const cleanModel = extractBikeModel(userText);
        updateMemory(chatId, 'model', cleanModel);
        
        // Brand clarification for Hayabusa
        if (userText.includes('hayabusa') && userText.includes('kawasaki')) {
          response = "I see you're working on a motorcycle! Just to clarify - the Hayabusa is actually Suzuki's model, not Kawasaki. But no worries! What specific issue are you having? I can find detailed repair videos! 🏍️";
        } else {
          response = `Excellent! You have a ${cleanModel}. What specific issue are you experiencing? (e.g., spark plugs, oil change, brakes, electrical)`;
        }
      }
      // 6. COLLECT ISSUE DESCRIPTION (FIXED VERSION)
      else if (memory.model && (userText.includes('spark') || userText.includes('plug') || userText.includes('engine') || userText.includes('brake') || userText.includes('oil') || userText.includes('electrical') || userText.includes('starting') || userText.includes('noise'))) {
        
        const cleanIssue = extractIssue(userText);
        updateMemory(chatId, 'issue', cleanIssue);
        response = `Perfect! I understand: ${memory.model} with ${cleanIssue} issue. 🎯\n\nShould I find specific video tutorials for this? (Say YES or SEARCH VIDEOS)`;
      }
      // 7. YES/NO HANDLING
      else if (userText === 'yes' || userText === 'yeah' || userText === 'yep' || userText === 'sure' || userText === 'ok') {
        if (memory.model && memory.issue) {
          response = `🎬 Searching for the best "${memory.model} ${memory.issue}" tutorials... This will take just a moment!`;
        } else {
          response = "I'd love to help! First, tell me your motorcycle model and what issue you're having.";
        }
      }
      // 8. FALLBACK
      else {
        response = "I specialize in motorcycle repair videos! Tell me your bike model (e.g., Kawasaki Ninja) and what's wrong, and I'll find expert tutorials. 🏍️";
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
  console.log(`🚀 Priya bot server running on port ${port}`);
  console.log(`🎥 YouTube API: ACTIVE`);
  console.log(`🧠 Memory System: ACTIVE`);
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
