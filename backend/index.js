const express = require('express');
const dotenv = require('dotenv');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post('/api/message', async (req, res) => {
    const originalMessage = req.body.message?.trim();
    const message = originalMessage?.toLowerCase();

    if (!GEMINI_API_KEY) {
        return res.json({ response: 'Error: Gemini API key not found.' });
    }

    if (!message) {
        return res.json({ response: 'Please enter a message.' });
    }

    const alwaysGiveQuoteKeywords = ['another', 'again', 'more', 'one more', 'next'];

    const shouldAlwaysRespond =
        isMotivationalPrompt(message) ||
        isGreetingPrompt(message) ||
        alwaysGiveQuoteKeywords.some(keyword => message.includes(keyword));

    if (!shouldAlwaysRespond) {
        return res.json({
            response: 'I specialize in motivational quotes. Ask for inspiration or just type "another one!"',
        });
    }

    // ✅ Updated Prompt to Gemini
    const prompt = `
You are a cheerful motivational assistant. Based on the following request, respond with:
- A short, friendly introduction line (e.g., "Here’s something to brighten your day!" or "Absolutely! Take this one to heart:")
- Followed by a fresh, unique motivational quote.

Request: "${originalMessage}"
`.trim();

    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [
                    {
                        parts: [{ text: prompt }],
                    },
                ],
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        const generatedText =
            response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "Here’s something to keep you going: Keep going! You are stronger than you think.";

        const cleaned = generatedText
            .replace(/[\*\_\#\~\`]/g, '')
            .replace(/\n+/g, ' ')
            .trim();

        res.json({ response: cleaned });
    } catch (error) {
        console.error(error);
        res.json({ response: 'There was an error processing your request.' });
    }
});

function isMotivationalPrompt(message) {
    const keywords = [
        'motivate', 'inspire', 'quote', 'encourage', 'motivation', 'uplift',
        'energy', 'focus', 'hope', 'dream', 'goal', 'success', 'boost'
    ];
    return keywords.some(keyword => message.includes(keyword));
}

function isGreetingPrompt(message) {
    const keywords = [
        'hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon',
        'good evening', 'howdy', 'sup', 'yo'
    ];
    return keywords.some(keyword => message.includes(keyword));
}

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

