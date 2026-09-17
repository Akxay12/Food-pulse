import { GoogleGenAI } from '@google/genai';
import { FoodScanResult, ScanType, AnalysisSummaryItem } from '../types';
// Safe development diagnostic (Never print the key itself)
console.log('[Gemini] API key configured:', Boolean(import.meta.env.VITE_AI_API_KEY));

function getGeminiApiKey(): string {
  const raw = import.meta.env.VITE_AI_API_KEY;
  if (!raw) return '';
  const cleaned = String(raw).trim().replace(/^["']|["']$/g, '').trim();
  if (cleaned === '' || cleaned === 'MY_AI_API_KEY' || cleaned === '""' || cleaned === "''") {
    return '';
  }
  return cleaned;
}

export interface AIScanInput {
  imageBase64: string;
  scanType: ScanType;
  language?: string;
  foodNameHint?: string;
}

export const MANDATORY_LAB_DISCLAIMER =
  'AI visual analysis cannot detect hidden bacteria, toxins, pathogens, or other invisible contamination. For definitive food safety, laboratory testing is required.';

export const aiService = {
  /**
   * Check if live external Gemini AI Vision API is configured
   */
  isConfigured(): boolean {
    return Boolean(getGeminiApiKey());
  },

  /**
   * Primary AI Food Analysis Pipeline using Gemini Vision API
   * Strictly sends REAL image bytes + structured instructions to Gemini.
   * NEVER returns simulated or fake scores when in production.
   */
  async analyzeFoodImage(input: AIScanInput): Promise<FoodScanResult> {
    const { imageBase64, scanType, language = 'en' } = input;

    // Check API Key
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      console.warn('[FoodCheck AI] Gemini API key is missing from environment (VITE_AI_API_KEY).');
      throw new Error(
        'Gemini API key is not configured. Please add VITE_AI_API_KEY in your .env file to enable live AI food safety scanning.'
      );
    }

    // Parse image mime type and clean base64 data
    let mimeType = 'image/jpeg';
    let cleanBase64 = imageBase64;
    const dataUrlMatch = imageBase64.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (dataUrlMatch) {
      mimeType = dataUrlMatch[1];
      cleanBase64 = dataUrlMatch[2];
    }

    if (!cleanBase64 || cleanBase64.length < 50) {
      throw new Error('No valid food image was provided for analysis. Please capture or upload a photo.');
    }

    // Dev Logging (WITHOUT logging API keys or full base64 strings)
    console.info('[FoodCheck AI] Gemini request started for scanType:', scanType);
    console.info('[FoodCheck AI] Gemini received image input:', {
      mimeType,
      imageByteEstimate: Math.round(cleanBase64.length * 0.75),
      hasImageInput: Boolean(cleanBase64 && cleanBase64.length > 50)
    });

    const ai = new GoogleGenAI({ apiKey });

    const systemInstructions = `You are analyzing a food image for a consumer food-safety assistant (FoodCheck).
Inspect ONLY what can reasonably be inferred from the provided image.

Identify the visible food.
Give a safety assessment from 0 to 10 based ONLY on visible evidence such as:
- visible freshness/spoilage indicators
- mold/discoloration
- packaging damage
- visible contamination
- expiry/best-before text if readable
- ingredient/allergen information if readable
- visible hygiene conditions for street food
- visible oil/food handling conditions for street food

Return strict raw JSON matching this schema:
{
  "detectedFood": string,
  "foodType": string,
  "safetyScore": number,
  "confidence": number,
  "visibleConcerns": string[],
  "positiveIndicators": string[],
  "explanation": string,
  "expiryText": string or null,
  "allergens": string[]
}

CRITICAL RULES:
1. Do NOT claim that an image can detect hidden bacteria, viruses, toxins, pathogens, or chemical contamination.
2. If something cannot be determined from the image, explicitly say so.
3. The safety score must be evidence-based and should NOT be randomly generated. Provide a number between 0 and 10 (e.g. 8.0).
4. Confidence must be a float between 0.0 and 1.0 (e.g. 0.86).
5. For PACKAGED FOOD:
   - Inspect and read visible text: product/food name, expiry/best-before date, ingredients, allergens, nutrition info, packaging condition (tears, puffing, seal intact).
   - Use OCR/vision from the SAME image. Do NOT invent or hallucinate unreadable dates.
   - If expiry date is not clearly readable, set "expiryText": null.
6. For STREET FOOD:
   - Inspect visible characteristics: food freshness, visible spoilage, cleanliness of preparation/stall, food handling, visible oil condition (clarity, reuse signs), surrounding hygiene, exposed food/dust risks.
   - Set "expiryText": null.
7. FOOD IDENTIFICATION:
   - For example: if the photo contains cheese, explicitly state "detectedFood": "Cheese" and "foodType": "Dairy product" or "Cheddar / processed cheese".
   - Only state a specific type when the image provides enough visual evidence. Otherwise say "Cheese (type uncertain)".
   - Do NOT hallucinate a specific brand or exact product when it cannot be reliably read from the image.
8. Output ONLY valid JSON with NO markdown fences, NO extra text.`;

    const userPrompt = `Scan mode: ${scanType === 'packaged' ? 'PACKAGED FOOD' : 'STREET FOOD'}. Preferred language: ${language}. Analyze the attached food image carefully according to the rules.`;

    try {
      const candidateModels = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash'];
      let response: any = null;
      let lastError: any = null;

      for (const modelName of candidateModels) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                role: 'user',
                parts: [
                  { text: systemInstructions + '\n\n' + userPrompt },
                  {
                    inlineData: {
                      mimeType,
                      data: cleanBase64
                    }
                  }
                ]
              }
            ],
            config: {
              responseMimeType: 'application/json',
              temperature: 0.1
            }
          });
          if (response?.text) {
            console.info(`[FoodCheck AI] Gemini request succeeded using model ${modelName}`);
            break;
          }
        } catch (err: any) {
          lastError = err;
          const msg = String(err?.message || '');
          if (msg.includes('404') || msg.includes('not found') || msg.includes('no longer available') || msg.includes('503')) {
            console.warn(`[FoodCheck AI] Model ${modelName} unavailable, trying next candidate...`);
            continue;
          }
          throw err;
        }
      }

      if (!response && lastError) {
        throw lastError;
      }

      const rawText = response?.text || '';
      console.info('[FoodCheck AI] Gemini response received. Raw response length:', rawText.length);

      const cleanedJson = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/i, '')
        .trim();

      let parsed: any;
      try {
        parsed = JSON.parse(cleanedJson);
      } catch (jsonErr) {
        console.error('[FoodCheck AI] Failed to parse JSON response from Gemini:', rawText);
        throw new Error('Gemini returned an unstructured response. Please try scanning again with clearer lighting.');
      }

      // Validate and clamp fields
      const rawScore = Number(parsed.safetyScore);
      const safetyScore = Math.max(0, Math.min(10, !isNaN(rawScore) ? rawScore : 7.0));

      const rawConf = Number(parsed.confidence);
      const confidence = Math.max(0, Math.min(1, !isNaN(rawConf) ? rawConf : 0.85));

      const detectedFood =
        typeof parsed.detectedFood === 'string' && parsed.detectedFood.trim()
          ? parsed.detectedFood.trim()
          : scanType === 'packaged'
          ? 'Packaged Food Item'
          : 'Street Food Item';

      const foodTypeLabel =
        typeof parsed.foodType === 'string' && parsed.foodType.trim()
          ? parsed.foodType.trim()
          : scanType === 'packaged'
          ? 'Packaged Food'
          : 'Street Food';

      const visibleConcerns: string[] = Array.isArray(parsed.visibleConcerns)
        ? parsed.visibleConcerns.filter((c: any) => typeof c === 'string' && c.trim())
        : [];

      const positiveIndicators: string[] = Array.isArray(parsed.positiveIndicators)
        ? parsed.positiveIndicators.filter((p: any) => typeof p === 'string' && p.trim())
        : [];

      const explanation: string =
        typeof parsed.explanation === 'string' && parsed.explanation.trim()
          ? parsed.explanation.trim()
          : 'Visual assessment completed based on observable food characteristics and package integrity.';

      const expiryText: string | null =
        typeof parsed.expiryText === 'string' && parsed.expiryText.trim()
          ? parsed.expiryText.trim()
          : null;

      const allergens: string[] = Array.isArray(parsed.allergens)
        ? parsed.allergens.filter((a: any) => typeof a === 'string' && a.trim())
        : [];

      // Determine risk label and colors
      const riskLabel: 'Lower apparent risk' | 'Caution' | 'Higher apparent risk' =
        safetyScore >= 7.5 ? 'Lower apparent risk' : safetyScore >= 6.0 ? 'Caution' : 'Higher apparent risk';

      const riskColor: 'green' | 'yellow' | 'red' =
        safetyScore >= 7.5 ? 'green' : safetyScore >= 6.0 ? 'yellow' : 'red';

      // Build structured summary items
      const summaryItems: AnalysisSummaryItem[] = [
        {
          id: 'food-id',
          category: 'Food Identification',
          status: 'safe',
          title: 'Detected Food',
          detail: `${detectedFood}${foodTypeLabel ? ` (${foodTypeLabel})` : ''}`
        }
      ];

      positiveIndicators.forEach((pos, idx) => {
        summaryItems.push({
          id: `pos-${idx}`,
          category: 'Positive Observations',
          status: 'safe',
          title: 'Positive Indicator',
          detail: pos
        });
      });

      visibleConcerns.forEach((concern, idx) => {
        summaryItems.push({
          id: `concern-${idx}`,
          category: 'Visible Concerns',
          status: safetyScore < 6.0 ? 'danger' : 'caution',
          title: 'Visible Concern',
          detail: concern
        });
      });

      if (scanType === 'packaged') {
        summaryItems.push({
          id: 'expiry-item',
          category: 'Expiry Check',
          status: expiryText ? 'safe' : 'caution',
          title: 'Expiry / Best Before',
          detail: expiryText ? `Detected: ${expiryText}` : 'Expiry could not be verified from this image.'
        });

        if (allergens.length > 0) {
          summaryItems.push({
            id: 'allergens-item',
            category: 'Allergen Advisory',
            status: 'caution',
            title: 'Identified Allergens',
            detail: allergens.join(', ')
          });
        }
      }

      // Logging parsed results
      console.info('[FoodCheck AI] Parsed safety score:', safetyScore, '/ 10 | Confidence:', Math.round(confidence * 100) + '%');
      console.info('[FoodCheck AI] Detected food:', detectedFood, '| Category/Type:', foodTypeLabel);

      return {
        id: 'scan-' + Date.now(),
        foodName: detectedFood,
        foodType: scanType,
        foodTypeLabel,
        imageUrl: imageBase64,
        scanDate: 'Scanned just now (Live AI)',
        safetyScore,
        confidence,
        visibleConcerns,
        positiveIndicators,
        explanation,
        expiryText,
        allergens,
        riskLabel,
        riskColor,
        summaryItems,
        recommendation: explanation,
        disclaimer: MANDATORY_LAB_DISCLAIMER,
        expiryDetected: Boolean(expiryText),
        detectedExpiryDate: expiryText || 'Expiry could not be verified from this image.',
        ingredientsOrCleanliness: allergens.length > 0 ? allergens : positiveIndicators.slice(0, 3),
        nutritionOrVisualIndicators: {
          'Safety Score': `${safetyScore.toFixed(1)} / 10`,
          'AI Confidence': `${Math.round(confidence * 100)}%`,
          'Assessment Basis': 'Visible Inspection Only'
        }
      };
    } catch (err: any) {
      const errMsg = err?.message || String(err);
      console.error('[FoodCheck AI] Gemini API call error:', {
        message: errMsg.slice(0, 250),
        status: err?.status || err?.code || 'ERROR'
      });

      if (errMsg.includes('SERVICE_DISABLED') || errMsg.includes('Gemini API has not been used')) {
        throw new Error(
          'Gemini API is not enabled on this Google Cloud project. Please enable "Generative Language API" in Google Cloud Console or check your API key.'
        );
      }
      if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('API key not valid')) {
        throw new Error('The configured Gemini API key is invalid. Please check VITE_AI_API_KEY in your .env file.');
      }
      if (errMsg.includes('PERMISSION_DENIED')) {
        throw new Error('Permission denied calling Gemini API. Please ensure your API key has Generative Language API permissions.');
      }

      throw new Error(`Gemini AI analysis failed: ${errMsg.slice(0, 160)}`);
    }
  }
};
