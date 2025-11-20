import { GoogleGenAI, Type, Modality } from "@google/genai";
import { NovelConfig, Chapter, Genre, Tone } from "../types";

// Initialize Gemini Client
// CRITICAL: Using process.env.API_KEY as required
const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

// Helper to get model based on complexity
const MODEL_COMPLEX = 'gemini-3-pro-preview';
const MODEL_FAST = 'gemini-2.5-flash';
const MODEL_TTS = 'gemini-2.5-flash-preview-tts';

/**
 * Generates a random novel configuration using AI.
 */
export const generateRandomNovelIdea = async (): Promise<NovelConfig> => {
  if (!apiKey) throw new Error("API Key is missing");

  const prompt = `
    اقترح فكرة رواية فريدة ومبتكرة باللغة العربية. كن مبدعاً جداً.
    
    القيود للاختيارات:
    - النوع الأدبي يجب أن يكون واحداً من القيم التالية حصراً: ${Object.values(Genre).join('، ')}.
    - النغمة يجب أن تكون واحدة من القيم التالية حصراً: ${Object.values(Tone).join('، ')}.
    
    المطلوب تعبئة البيانات التالية في ملف JSON:
    - title: عنوان جذاب وغير تقليدي.
    - genre: النوع الأدبي (من القائمة أعلاه).
    - tone: النغمة (من القائمة أعلاه).
    - protagonist: وصف مثير للاهتمام للشخصية الرئيسية.
    - setting: وصف المكان والزمان (إعداد مميز).
    - plotSummary: ملخص الحبكة (فقرة مشوقة تحتوي على صراع واضح).
    - targetAudience: الجمهور المستهدف.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_FAST, // Use fast model for quick ideas
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          genre: { type: Type.STRING },
          tone: { type: Type.STRING },
          protagonist: { type: Type.STRING },
          setting: { type: Type.STRING },
          plotSummary: { type: Type.STRING },
          targetAudience: { type: Type.STRING },
        },
        required: ["title", "genre", "tone", "protagonist", "setting", "plotSummary", "targetAudience"]
      }
    },
  });

  const jsonText = response.text;
  if (!jsonText) throw new Error("No content generated");

  try {
    const parsed = JSON.parse(jsonText);
    return {
      title: parsed.title,
      genre: parsed.genre as Genre,
      tone: parsed.tone as Tone,
      protagonist: parsed.protagonist,
      setting: parsed.setting,
      plotSummary: parsed.plotSummary,
      targetAudience: parsed.targetAudience
    };
  } catch (e) {
    console.error("Failed to parse random idea JSON", e);
    throw new Error("فشل في توليد فكرة عشوائية");
  }
};

/**
 * Generates a novel outline (list of chapters) based on user configuration.
 */
export const generateNovelOutline = async (config: NovelConfig): Promise<Chapter[]> => {
  if (!apiKey) throw new Error("API Key is missing");

  const prompt = `
    أنت روائي محترف ومحرر أدبي. قم بإنشاء مخطط تفصيلي لرواية بناءً على المعلومات التالية:
    - العنوان: ${config.title}
    - النوع: ${config.genre}
    - النغمة/الأسلوب: ${config.tone}
    - الشخصية الرئيسية: ${config.protagonist}
    - المكان/الإعداد: ${config.setting}
    - ملخص الحبكة: ${config.plotSummary}
    - الجمهور المستهدف: ${config.targetAudience}

    المطلوب: قم بإنشاء قائمة بـ 5 إلى 10 فصول لهذه الرواية. لكل فصل، قدم عنوانًا وملخصًا موجزًا للأحداث.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_COMPLEX,
    contents: prompt,
    config: {
      systemInstruction: "أنت مساعد كتابة إبداعي متخصص في الأدب العربي. يجب أن تكون مخرجاتك باللغة العربية الفصحى السليمة والجذابة.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          chapters: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: "عنوان الفصل" },
                summary: { type: Type.STRING, description: "ملخص أحداث الفصل" }
              },
              required: ["title", "summary"]
            }
          }
        }
      }
    },
  });

  const jsonText = response.text;
  if (!jsonText) throw new Error("No content generated");

  try {
    const parsed = JSON.parse(jsonText);
    // Map to our internal Chapter interface adding IDs
    return parsed.chapters.map((c: any, index: number) => ({
      id: index + 1,
      title: c.title,
      summary: c.summary,
      content: undefined
    }));
  } catch (e) {
    console.error("Failed to parse outline JSON", e);
    throw new Error("فشل في معالجة استجابة الذكاء الاصطناعي");
  }
};

/**
 * Generates a plot twist for a specific chapter summary.
 */
export const generatePlotTwist = async (
  config: NovelConfig,
  chapter: Chapter,
  previousChaptersSummary: string
): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing");

  const prompt = `
    أنت مساعد روائي مبدع. قم بتعديل ملخص الفصل التالي لإضافة "حبكة مفاجئة" (Plot Twist) أو حدث غير متوقع يقلب الموازين، مع الحفاظ على سياق القصة ونوعها (${config.genre}).

    سياق سابق:
    ${previousChaptersSummary || "بداية القصة."}

    ملخص الفصل الحالي (قبل التعديل):
    ${chapter.summary}

    المطلوب:
    أعد كتابة ملخص هذا الفصل ليتضمن مفاجأة قوية أو كشف مثير أو عقبة غير متوقعة. اجعل الملخص مشوقاً جداً ومختلفاً عما هو متوقع.
    أرجع فقط النص الجديد للملخص بدون مقدمات.
  `;

  const response = await ai.models.generateContent({
    model: MODEL_COMPLEX,
    contents: prompt,
    config: {
      temperature: 1.2, // Higher temperature for more creativity
    }
  });

  return response.text || chapter.summary;
};

/**
 * Generates the full text content for a specific chapter.
 */
export const generateChapterContent = async (
  config: NovelConfig,
  chapter: Chapter,
  previousChaptersSummary: string
): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing");

  const prompt = `
    اكتب الفصل التالي من الرواية بالتفصيل.
    
    معلومات الرواية:
    - العنوان: ${config.title}
    - الأسلوب: ${config.tone}
    
    الفصل الحالي:
    - رقم الفصل: ${chapter.id}
    - عنوان الفصل: ${chapter.title}
    - ملخص أحداث هذا الفصل (يجب تغطيتها): ${chapter.summary}
    
    سياق سابق (ما حدث قبل هذا الفصل):
    ${previousChaptersSummary || "هذا هو الفصل الأول."}
    
    تعليمات الكتابة:
    - اكتب باللغة العربية الفصحى السردية الغنية.
    - استخدم الحوار والوصف لبعث الحياة في المشهد.
    - لا تختصر الأحداث، بل اسردها بتفصيل روائي ممتع.
    - تأكد من أن طول الفصل مناسب (حوالي 1000-1500 كلمة).
  `;

  const response = await ai.models.generateContent({
    model: MODEL_COMPLEX,
    contents: prompt,
    config: {
      // Using a thinking budget for better creative writing quality
      thinkingConfig: { thinkingBudget: 1024 },
    }
  });

  return response.text || "عذراً، لم يتم إنشاء نص لهذا الفصل.";
};

/**
 * Generates speech audio for the given text using Gemini TTS.
 * Returns the base64 audio data.
 */
export const generateSpeech = async (text: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing");

  // Gemini TTS prompt structure
  const prompt = `اقرأ النص التالي باللغة العربية قراءة معبرة:\n\n${text}`;

  const response = await ai.models.generateContent({
    model: MODEL_TTS,
    contents: [{ parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Zephyr' }, // Zephyr works reasonably well for general tone
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  
  if (!base64Audio) {
    throw new Error("لم يتم إنشاء ملف صوتي");
  }

  return base64Audio;
};