import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

/**
 * Uses Gemini 2.5 Flash vision API to analyze the drawing.
 * Falls back to simulation if no API key is set.
 */
export async function analyzeDrawing(imageDataBase64, targetWord) {
  // Deterministic test seam: automated tests submit "TESTCONF:<n>" to force a
  // confidence. Real submissions are always "data:" URLs, so this is inert in
  // normal play.
  if (typeof imageDataBase64 === 'string' && imageDataBase64.startsWith('TESTCONF:')) {
    const c = Math.min(1, Math.max(0, parseFloat(imageDataBase64.slice(9)) || 0));
    return {
      correct: c >= SOLO_CORRECT_THRESHOLD, confidence: c,
      aiGuess: `test ${targetWord}`, description: 'test drawing',
      funnyMessage: 'test',
    };
  }
  if (genAI) {
    return analyzeWithGemini(imageDataBase64, targetWord);
  }
  return fallbackAnalysis(imageDataBase64, targetWord);
}

// A blank/near-blank 800x580 canvas compresses to a tiny PNG. Anything this
// small has essentially nothing drawn on it, so it can never score well —
// short-circuit before spending a Gemini call and before the model can
// hallucinate a high confidence.
// A blank 512x372 white JPEG is ~3.5KB of base64; any real drawing is well
// above this. 4500 reliably separates empty from drawn.
const BLANK_BASE64_THRESHOLD = 4500;

// Minimum confidence level (75%) for a solo drawing to be scored "correct".
const SOLO_CORRECT_THRESHOLD = 0.75;

function blankResult(targetWord) {
  return {
    correct: false,
    confidence: 0.05,
    aiGuess: 'an empty page',
    description: 'an empty/blank canvas',
    funnyMessage: `Looks like a blank page — I can't see a ${targetWord} there!`,
  };
}

async function analyzeWithGemini(imageDataBase64, targetWord) {
  const base64Data = imageDataBase64.startsWith('data:')
    ? imageDataBase64.split(',')[1]
    : imageDataBase64;

  if (process.env.DEBUG_JUDGE) console.log(`[aiJudge] "${targetWord}" base64 len=${base64Data?.length}`);
  if (!base64Data || base64Data.length < BLANK_BASE64_THRESHOLD) {
    return blankResult(targetWord);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      // Disable "thinking" — this is a quick image classification, and thinking
      // adds ~5-7s of latency for no quality gain here.
      generationConfig: {
        thinkingConfig: { thinkingBudget: 0 },
        responseMimeType: 'application/json',
      },
    });
    const mimeType = imageDataBase64.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png';

    const prompt = `You are a witty but HONEST Pictionary judge AI. The player was trying to draw: "${targetWord}".

Your job is to rate how well the drawing actually depicts "${targetWord}". Be fair, not flattering — a bad drawing must get a low score, or the game is broken.

CONFIDENCE — this is the single most important field. It measures how clearly THIS drawing depicts "${targetWord}". Calibrate honestly using these anchors:
- 0.00–0.10 : blank or nearly-blank canvas, a single dot/line, or random noise.
- 0.10–0.25 : meaningless scribbles with no recognisable form, OR clearly a completely different object.
- 0.25–0.45 : a vague resemblance — a couple of the right features but mostly ambiguous; you would NOT guess "${targetWord}" unprompted.
- 0.45–0.65 : recognisable with effort — the overall shape/key features lean toward "${targetWord}".
- 0.65–0.85 : clearly recognisable as "${targetWord}" — most defining features present.
- 0.85–1.00 : unmistakable, an excellent depiction of "${targetWord}".
Do NOT inflate. Most rough sketches belong in the 0.25–0.65 band. Reserve 0.85+ for genuinely clear drawings. A blank or scribbled canvas MUST be below 0.15.

CORRECT — set correct=true only if confidence >= 0.75 AND the drawing genuinely reads as "${targetWord}". Otherwise correct=false.

REQUIRED FIELDS — fill ALL four, no exceptions:

"description" — one sentence describing the literal shapes/lines you see. Be specific. e.g. "a round blob with four stubby legs and a tail", "two triangles connected by a long stick", "a lumpy oval with squiggles coming out the top". For a blank canvas say "an empty/blank canvas".

"guess" — a funny, creative name for what the drawing actually looks like, derived from your description. NEVER "something else", "unclear", "a drawing", or anything vague. ALWAYS a concrete noun phrase. e.g. "a potato with legs", "a melting ice cream tower", "an angry cloud with hair". For a blank canvas, "an empty page".

"message" — one punchy sentence (max 12 words) reacting to THIS specific drawing:
- CORRECT: hype them up referencing a specific visual detail you saw.
- INCORRECT: a funny roast naming what it actually looks like from your guess.

Reply ONLY valid JSON (no markdown, no code block):
{"description":"...","correct":true_or_false,"confidence":0.0_to_1.0,"guess":"...","message":"..."}`;

    const t0 = Date.now();
    const result = await model.generateContent([
      { inlineData: { mimeType, data: base64Data } },
      prompt,
    ]);
    if (process.env.DEBUG_JUDGE) console.log(`[aiJudge] "${targetWord}" Gemini latency=${Date.now() - t0}ms`);

    const raw = result.response.text().trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response: ' + raw);
    const json = JSON.parse(jsonMatch[0]);

    const confidence = Math.min(1, Math.max(0, parseFloat(json.confidence) || 0));
    // Minimum confidence level to count as correct (solo) — 75%.
    const correct = !!json.correct && confidence >= SOLO_CORRECT_THRESHOLD;
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

  // Empty / near-empty canvas can never be correct.
  if (dataLength < BLANK_BASE64_THRESHOLD) {
    return blankResult(targetWord);
  }

  const isSubstantialDrawing = dataLength > 6000;

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
