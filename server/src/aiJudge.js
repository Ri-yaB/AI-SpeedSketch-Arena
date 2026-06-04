import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

const FAILURE_TEMPLATES = [
  (guess) => `That's clearly a ${guess}. The resemblance is uncanny.`,
  (guess) => `My circuits are screaming "${guess}" and I refuse to accept otherwise.`,
  (guess) => `I ran 17 neural networks on this. Unanimous verdict: ${guess}.`,
  (guess) => `I've seen thousands of drawings. This is definitely a ${guess}.`,
  (guess) => `Bold strokes, confident lines... 100% a ${guess}. No notes.`,
  (guess) => `I zoomed in, rotated it 47 times — still just a ${guess}.`,
  (guess) => `My training data has seen a lot. This? A ${guess}. Final answer.`,
  (guess) => `The pixels don't lie. That's a ${guess} if I've ever seen one.`,
  (guess) => `I consulted three backup models. We all agree: ${guess}.`,
  (guess) => `Even upside down this is a ${guess}. Try harder next time!`,
];

function getFailureMessage(aiGuess) {
  const template = FAILURE_TEMPLATES[Math.floor(Math.random() * FAILURE_TEMPLATES.length)];
  return template(aiGuess);
}

const SUCCESS_MESSAGES = [
  "Nailed it! Gemini is impressed!",
  "Crystal clear! Were you a professional artist in another life?",
  "Recognized immediately! 10/10 would analyze again.",
  "Gemini is applauding your artistic genius!",
  "Perfect! My confidence score just broke its own record.",
  "Unmistakable! That drawing speaks for itself.",
  "Spot on! Even my toughest neural layers agree.",
];

/**
 * Uses Gemini 3.5 Flash vision API to analyze the drawing.
 * Falls back to simulation if no API key is set.
 */
export async function analyzeDrawing(imageDataBase64, targetWord) {
  if (genAI) {
    return analyzeWithGemini(imageDataBase64, targetWord);
  }
  return fallbackAnalysis(imageDataBase64, targetWord);
}

async function analyzeWithGemini(imageDataBase64, targetWord) {
  // Strip data URL prefix to get raw base64
  const base64Data = imageDataBase64.startsWith('data:')
    ? imageDataBase64.split(',')[1]
    : imageDataBase64;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are an extremely strict Pictionary judge. The player was trying to draw: "${targetWord}".

IMPORTANT: Only mark CORRECT if you are MORE than 95% sure the drawing clearly and unmistakably shows "${targetWord}". When in doubt, mark INCORRECT.

Ask yourself: Would ANY person looking at this drawing — with no hint — immediately say "${targetWord}"? If there is ANY doubt, mark INCORRECT.

Mark INCORRECT if:
- Blank or nearly blank canvas
- Random lines or scribbles
- Only vague resemblance
- Could be mistaken for anything else
- Missing the key defining features of "${targetWord}"
- You are less than 95% confident

Also write a short witty one-liner (max 12 words) about what you specifically see in this drawing. Be funny and direct.

Reply ONLY valid JSON (no markdown): {"description":"one sentence of what you literally see","correct":true_or_false,"confidence":0.0_to_1.0,"guess":"what this most looks like","message":"witty one-liner about this specific drawing"}`;

    // Detect mime type from data URL prefix (client sends JPEG now)
    const mimeType = imageDataBase64.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png';

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
      prompt,
    ]);

    const raw = result.response.text().trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response: ' + raw);
    const json = JSON.parse(jsonMatch[0]);

    const confidence = Math.min(1, Math.max(0, parseFloat(json.confidence) || 0));
    // Only accept if model is >95% confident
    const correct = !!json.correct && confidence > 0.92;
    const aiGuess = json.guess || (correct ? targetWord : 'something else');
    const description = json.description || null;

    // Use Gemini's specific message if provided, else fall back to templates
    const funnyMessage = json.message
      ? json.message
      : correct
        ? SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)]
        : getFailureMessage(aiGuess);

    return { correct, confidence, aiGuess, description, funnyMessage };
  } catch (err) {
    console.error('[aiJudge] Gemini API error:', err.message || err);
    console.error('[aiJudge] Full error:', JSON.stringify(err, null, 2));
    return fallbackAnalysis(imageDataBase64, targetWord);
  }
}

/**
 * Fallback when no API key is set.
 */
function fallbackAnalysis(imageDataBase64, targetWord) {
  const dataLength = imageDataBase64 ? imageDataBase64.length : 100;
  const isSubstantialDrawing = dataLength > 5000;

  let successChance = isSubstantialDrawing ? 0.60 : 0.15;
  const wordSeed = targetWord.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const seed = dataLength % 100;
  const variance = ((seed + wordSeed) % 20 - 10) / 100;
  successChance = Math.min(0.80, Math.max(0.10, successChance + variance));

  const correct = Math.random() < successChance;
  let confidence, aiGuess, funnyMessage;

  if (correct) {
    confidence = parseFloat((0.66 + Math.random() * 0.30).toFixed(2));
    aiGuess = targetWord;
    funnyMessage = SUCCESS_MESSAGES[Math.floor(Math.random() * SUCCESS_MESSAGES.length)];
  } else {
    confidence = parseFloat((0.10 + Math.random() * 0.40).toFixed(2));
    const wrongGuesses = getWrongGuesses(targetWord);
    aiGuess = wrongGuesses[Math.floor(Math.random() * wrongGuesses.length)];
    funnyMessage = getFailureMessage(aiGuess);
  }

  return { correct, confidence, aiGuess, description: null, funnyMessage };
}

function getWrongGuesses(targetWord) {
  const wrongAnswerMap = {
    cat: ['dog', 'rabbit', 'hamster'],
    dog: ['cat', 'wolf', 'fox'],
    elephant: ['hippo', 'rhino', 'mammoth'],
    penguin: ['duck', 'puffin', 'toucan'],
    giraffe: ['zebra', 'camel', 'llama'],
    octopus: ['squid', 'jellyfish', 'starfish'],
    shark: ['dolphin', 'whale', 'barracuda'],
    butterfly: ['moth', 'dragonfly', 'bee'],
    pizza: ['pie', 'frisbee', 'clock'],
    sushi: ['hotdog', 'sandwich', 'burrito'],
    snowflake: ['star', 'asterisk', 'flower'],
    castle: ['house', 'fort', 'tower'],
    dragon: ['lizard', 'dinosaur', 'snake'],
    volcano: ['mountain', 'triangle', 'hill'],
    rainbow: ['arch', 'bridge', 'wave'],
    umbrella: ['mushroom', 'jellyfish', 'parachute'],
    battery: ['rectangle', 'door', 'window'],
    brain: ['cloud', 'walnut', 'blob'],
    keyboard: ['piano', 'grid', 'waffle'],
  };

  const specific = wrongAnswerMap[targetWord.toLowerCase()];
  if (specific) return specific;

  return [
    'a fried egg', 'a melted candle', 'a lopsided hat', 'a sad potato',
    'a crumpled sock', 'a sleeping caterpillar', 'a deflated balloon',
    'a very confused cloud', 'an upside-down umbrella', 'a wonky pretzel',
  ];
}
