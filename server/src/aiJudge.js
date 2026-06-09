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
- Mark correct=true ONLY if you are over 95% sure the drawing unmistakably shows "${targetWord}". When in doubt, mark false.
- Mark correct=false if: blank/nearly blank canvas, random scribbles, vague resemblance, missing key features, or confidence < 95%.

REQUIRED — write a "message" field that is a funny, specific 1-2 sentence comment about what you actually see in THIS drawing:
- If CORRECT: celebrate what they drew well. Be specific (e.g. "Those whiskers and pointy ears are unmistakable — purrfect!"). Max 15 words.
- If INCORRECT: roast what the drawing actually looks like to you — be specific and funny about the actual strokes/shapes you see. Do NOT say generic things like "try harder". Reference what you genuinely see (e.g. "I see a sad melting rectangle, not a phone", "Those blobs could be clouds... or maybe scrambled eggs?"). Max 15 words.

The message MUST be specific to this drawing — never generic filler.

Reply ONLY valid JSON (no markdown, no code block):
{"description":"one sentence of what you literally see in the drawing","correct":true_or_false,"confidence":0.0_to_1.0,"guess":"what this drawing most looks like to you","message":"your specific funny comment about this drawing"}`;

    const result = await model.generateContent([
      { inlineData: { mimeType, data: base64Data } },
      prompt,
    ]);

    const raw = result.response.text().trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response: ' + raw);
    const json = JSON.parse(jsonMatch[0]);

    const confidence = Math.min(1, Math.max(0, parseFloat(json.confidence) || 0));
    const correct = !!json.correct && confidence > 0.92;
    const aiGuess = json.guess || (correct ? targetWord : 'something else');
    const description = json.description || null;

    // Always use Gemini's message — it's required in the prompt
    const funnyMessage = json.message || (correct
      ? `Nailed it! That ${targetWord} was crystal clear.`
      : `AI sees "${aiGuess}" — keep practising!`);

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
