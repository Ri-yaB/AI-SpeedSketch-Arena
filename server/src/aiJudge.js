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
- Mark correct=false for: blank/nearly blank canvas, total scribbles, or something that clearly looks like a completely different object.
- Do NOT be overly harsh — if the drawing has the right shape, key features, or overall feel of "${targetWord}", mark it correct.

REQUIRED FIELDS:

"guess" — ALWAYS a specific, descriptive, funny name for what you literally see in the drawing. NEVER write "something else", "unclear", or vague answers. Examples: "a lopsided mushroom", "spaghetti explosion", "a nervous stick figure", "melting ice cream cone". Be creative and specific to the actual shapes/lines.

"message" — a punchy 1-sentence roast or cheer (max 12 words) specific to THIS drawing:
- If CORRECT: hype them up referencing something specific you saw (e.g. "Those pointy ears are unmistakable — purrfect!", "The trunk sold it immediately!")
- If INCORRECT: a funny, specific roast of what the drawing looks like (e.g. "That's a lovely spaghetti explosion, not a ${targetWord}!", "Sir those are just sad ovals on a stick.")

Reply ONLY valid JSON (no markdown, no code block):
{"description":"one sentence of what you literally see","correct":true_or_false,"confidence":0.0_to_1.0,"guess":"specific funny name for what you see","message":"punchy specific one-liner"}`;

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
    const aiGuess = (json.guess && json.guess.trim() && json.guess.toLowerCase() !== 'something else' && json.guess.toLowerCase() !== 'unclear')
      ? json.guess
      : correct ? targetWord : `a very confused ${targetWord}`;
    const description = json.description || null;

    const funnyMessage = json.message || (correct
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
