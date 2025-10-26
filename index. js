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
  ]
};

// Basic web server
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Priya Assistant is running! 🚀');
});

// Webhook for Telegram
app.post('/webhook', (req, res) => {
  const message = req.body.message;
  
  if (message && message.text) {
    const chatId = message.chat.id;
    const userText = message.text.toLowerCase();
    
    let response = "I'm still learning, but I'm here to help! What can I assist you with today?";
    
    // Basic intelligence
    if (userText.includes('hello') || userText.includes('hi') || userText.includes('/start')) {
      response = priyaResponses.greeting[Math.floor(Math.random() * priyaResponses.greeting.length)];
    } else if (userText.includes('help') || userText.includes('support')) {
      response = priyaResponses.help[Math.floor(Math.random() * priyaResponses.help.length)];
    } else if (userText.includes('frustrated') || userText.includes('angry') || userText.includes('annoying')) {
      response = priyaResponses.frustrated[Math.floor(Math.random() * priyaResponses.frustrated.length)];
    } else if (userText.includes('spark plug') || userText.includes('motorcycle')) {
      response = "I'd love to help with your motorcycle issue! For spark plugs, I recommend checking the gap and looking for fouling. What's your bike's model and year? 🏍️";
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
});
