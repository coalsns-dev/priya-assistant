const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Your Telegram bot token from environment variable
const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, {polling: false});

// Priya's intelligent responses
const priyaResponses = {
  greeting: [
    "Namaste! I'm Priya, your intelligent assistant. How can I help you today? 😊",
    "Hello there! I see a curious mind ready to explore. What shall we discover together? 🚀",
    "Well hello! I was just organizing some brilliant answers. What brings you here today? 💫"
  ],
  help: [
    "I sense you need guidance! Are you looking for technical help, tutorials, or something else?",
    "Don't worry, I'm here to help! Tell me what's challenging you today.",
    "Let's solve this together! What specific issue are you facing?"
  ],
  frustrated: [
    "I sense your frustration. Let's tackle this problem step by step - we've got this! 💪",
    "I understand it's frustrating. Take a deep breath and let me help you find the solution.",
    "Technical issues can be annoying, but together we'll get through this. What's the main problem?"
  ],
  video: [
    "I'd love to find you the perfect video tutorial! 🎥 What specific topic would you like me to search for?",
    "Great! I can find expert video guides for you. Tell me exactly what you want to learn!",
    "Video tutorials are my specialty! What specific skill or repair do you want to master?"
  ],
  yes: [
    "Perfect! 🎯 Tell me the exact model and year of your motorcycle, and I'll find the perfect video tutorial for you!",
    "Excellent! I'm on it. What's your specific bike model and the issue you're facing?",
    "Great! Let me find the best tutorial for you. What's your motorcycle's exact model and year?"
  ]
};

// Basic web server
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Priya Assistant is running! 🚀');
});

// FIX: Add GET endpoint for webhook verification
app.get('/webhook', (req, res) => {
  res.send('Webhook is active! Priya is ready to assist. 🚀');
});

// Webhook for Telegram - POST requests
app.post('/webhook', (req, res) => {
  const message = req.body.message;
  
  if (message && message.text) {
    const chatId = message.chat.id;
    const userText = message.text.toLowerCase();
    
    let response = "I'm still learning, but I'm here to help! What can I assist you with today?";
    
    // ENHANCED INTELLIGENCE WITH BETTER FLOW:
    
    // 1. Greetings first
    if (userText.includes('hello') || userText.includes('hi') || userText.includes('/start')) {
      response = priyaResponses.greeting[Math.floor(Math.random() * priyaResponses.greeting.length)];
    } 
    // 2. Help requests
    else if (userText.includes('help') || userText.includes('support')) {
      response = priyaResponses.help[Math.floor(Math.random() * priyaResponses.help.length)];
    } 
    // 3. Emotion detection
    else if (userText.includes('frustrated') || userText.includes('angry') || userText.includes('annoying')) {
      response = priyaResponses.frustrated[Math.floor(Math.random() * priyaResponses.frustrated.length)];
    } 
    // 4. VIDEO/YOUTUBE INTENT (MOVED HIGHER)
    else if (userText.includes('video') || userText.includes('tutorial') || userText.includes('show me') || userText.includes('youtube') || userText.includes('watch')) {
      response = priyaResponses.video[Math.floor(Math.random() * priyaResponses.video.length)];
    } 
    // 5. YES/NO DETECTION (NEW)
    else if (userText === 'yes' || userText === 'yeah' || userText === 'yep' || userText === 'sure' || userText === 'ok') {
      response = priyaResponses.yes[Math.floor(Math.random() * priyaResponses.yes.length)];
    } 
    else if (userText === 'no' || userText === 'nope' || userText === 'not now') {
      response = "No problem! What else can I help you with today?";
    }
    // 6. Brand detection with Hayabusa clarification
    else if ((userText.includes('kawasaki') && userText.includes('hayabusa')) || userText === 'kawasaki hayabusa') {
      response = "I see you're working on a motorcycle! Just to clarify - the Hayabusa is actually Suzuki's model, not Kawasaki. But no worries! What specific issue are you having? I can find detailed repair videos! 🏍️";
    }
    else if (userText.includes('kawasaki') || userText.includes('ninja') || userText.includes('hayabusa') || userText.includes('suzuki')) {
      const brand = userText.includes('kawasaki') ? "Kawasaki" : 
                   userText.includes('ninja') ? "Ninja" : 
                   userText.includes('hayabusa') ? "Hayabusa" : "Suzuki";
      response = `I see you're working on a ${brand}! I specialize in motorcycle maintenance. What specific issue are you having? I can find detailed video guides! 🏍️`;
    }
    // 7. Motorcycle issues (general)
    else if (userText.includes('spark plug') || userText.includes('motorcycle') || userText.includes('bike repair') || userText.includes('bike issue')) {
      response = "I'd love to help with your motorcycle issue! 🏍️ For spark plugs, I recommend checking the gap and looking for fouling. Would you like me to find a video tutorial for your specific model?";
    }
    
    // Send response back to user
    bot.sendMessage(chatId, response).catch(error => {
      console.log('Error sending message:', error);
    });
  }
  
  res.sendStatus(200);
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Priya bot server running on port ${port}`);
  console.log(`🌐 Webhook URL: https://priya-assistant-1.onrender.com/webhook`);
});
