/**
 * ai.js — AI Report Generation using Google Gemini (Free Tier)
 * 
 * Why Gemini?
 * - Google offers a "Free of charge" tier for Gemini 1.5 Flash (15 RPM, 1M TPM).
 * - This allows the Jatham platform to run 100% free of charge for low-volume apps.
 */

const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `You are an expert Vedic astrology compatibility analyst specializing in the South Indian Thirumana Porutham system. 
You receive structured JSON from a deterministic rule engine and produce a clear, honest, culturally-appropriate compatibility report.

Rules:
1. Never use words like "guaranteed", "perfect", "certain". Use "tendency toward", "alignment suggests".
2. Keep the report under 800 words.
3. Mention that independent verification by a qualified astrologer is recommended.
4. Structure the report with specific sections: Summary, Strengths, Risks, Doshas, Recommendations.`;

function buildAIPrompt(matchResult, profileA, profileB) {
  return `
Analyze this Thirumana Porutham compatibility result and generate a structured report.

GROOM: ${profileA.astroData.nakshatraName} (${profileA.astroData.gana}, ${profileA.astroData.yoniAnimal})
BRIDE: ${profileB.astroData.nakshatraName} (${profileB.astroData.gana}, ${profileB.astroData.yoniAnimal})

PORUTHAM RESULTS:
${JSON.stringify(matchResult.poruthams, null, 1)}

DOSHA ANALYSIS:
${JSON.stringify(matchResult.doshaAnalysis, null, 1)}

OVERALL: ${matchResult.passCount}/10 pass, Score: ${matchResult.overallScore}/100, Hard Reject: ${matchResult.hasHardReject}

Output format:
1. Summary ( assessment)
2. Strengths (bullet points)
3. Risk Zones (bullet points)
4. Dosha Assessment (explanation)
5. Recommendations (3 suggestions)
6. For the Astrologer (technical paragraph)
7. Disclaimer
`;
}

async function generateAIReport(matchResult, profileA, profileB) {
  // If no Gemini key, fallback to mock
  if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY missing. Returning mock AI report.');
    return "This is a mock compatibility report. Configure GEMINI_API_KEY for real AI analysis.";
  }

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [{ text: SYSTEM_PROMPT + "\n\n" + buildAIPrompt(matchResult, profileA, profileB) }]
        }],
        generationConfig: {
          maxOutputTokens: 2000,
          temperature: 0.7,
        }
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(`Gemini API error: ${err.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
}

module.exports = { generateAIReport };
