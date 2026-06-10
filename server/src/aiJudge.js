import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

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
  const base64Data = imageDataBase64.startsWith('data:')
    ? imageDataBase64.split(',')[1]
    : imageDataBase64;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const mimeType = imageDataBase64.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png';

    const prompt = `You are a sharp, witty Pictionary judge AI. The player was trying to draw: "${targetWord}".

JUDGING RULES:
- Mark correct=true if the drawing clearly shows "${targetWord}" and you are at least 80% confident. Be fair — if it genuinely looks like the word, accept it.
- Mark correct=false for: blank/nearly blank canvas, total scribbles, or something clearly different.
- Do NOT be overly harsh — if the drawing has the right shape, key features, or overall feel, mark it correct.

REQUIRED FIELDS — fill ALL four, no exceptions:

"description" — one sentence describing the literal shapes/lines you see. Be specific. e.g. "a round blob with four stubby legs and a tail", "two triangles connected by a long stick", "a lumpy oval with squiggles coming out the top".

"guess" — a funny, creative name for what the drawing looks like. Derived directly from your description. NEVER "something else", "unclear", "a drawing", or anything vague. ALWAYS a concrete noun phrase. e.g. "a potato with legs", "a melting ice cream tower", "an angry cloud with hair".

"message" — one punchy sentence (max 12 words) reacting to THIS specific drawing:
- CORRECT: hype them up referencing a specific visual detail you saw.
- INCORRECT: a funny roast naming what it actually looks like from your guess.

"correct" and "confidence" as defined above.

Reply ONLY valid JSON (no markdown, no code block):
{"description":"...","correct":true_or_false,"confidence":0.0_to_1.0,"guess":"...","message":"..."}`;

    const result = await model.generateContent([
      { inlineData: { mimeType, data: base64Data } },
      prompt,
    ]);

    const raw = result.response.text().trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response: ' + raw);
    const json = JSON.parse(jsonMatch[0]);

    const confidence = Math.min(1, Math.max(0, parseFloat(json.confidence) || 0));
    const correct = !!json.correct && confidence > 0.78;
    const description = json.description?.trim() || null;

    const VAGUE = ['something else', 'unclear', 'unknown', 'a drawing', 'the drawing', ''];
    const rawGuess = (json.guess || '').trim();
    const guessIsVague = !rawGuess || VAGUE.some(v => rawGuess.toLowerCase() === v);

    // Use description as the displayed guess if guess is vague — it's what the LLM actually saw
    const aiGuess = !guessIsVague
      ? rawGuess
      : description || (correct ? targetWord : `a very confused ${targetWord}`);

    const funnyMessage = json.message?.trim() || (correct
      ? `That ${targetWord} was unmistakable — great drawing!`
      : `That looks more like ${aiGuess} to me!`);

    return { correct, confidence, aiGuess, description, funnyMessage };
  } catch (err) {
    console.error('[aiJudge] Gemini API error:', err.message || err);
    return fallbackAnalysis(imageDataBase64, targetWord);
  }
}

/**
 * Fallback when no API key is set — still generates dynamic messages.
 */
function fallbackAnalysis(imageDataBase64, targetWord) {
  const dataLength = imageDataBase64 ? imageDataBase64.length : 100;
  const isSubstantialDrawing = dataLength > 5000;

  let successChance = isSubstantialDrawing ? 0.60 : 0.15;
  const wordSeed = targetWord.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const variance = ((dataLength % 100 + wordSeed) % 20 - 10) / 100;
  successChance = Math.min(0.80, Math.max(0.10, successChance + variance));

  const correct = Math.random() < successChance;

  if (correct) {
    const confidence = parseFloat((0.93 + Math.random() * 0.07).toFixed(2));
    return {
      correct: true, confidence,
      aiGuess: targetWord,
      description: null,
      funnyMessage: `That ${targetWord} was unmistakable — well drawn!`,
    };
  }

  const confidence = parseFloat((0.10 + Math.random() * 0.40).toFixed(2));
  return {
    correct: false, confidence,
    aiGuess: 'something else',
    description: null,
    funnyMessage: `Hmm, that doesn't quite look like a ${targetWord} to me!`,
  };
}
