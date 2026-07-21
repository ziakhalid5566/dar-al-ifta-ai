import { Router } from "express";

const router = Router();
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

type Role = "system" | "user" | "assistant";
interface GMessage { role: Role; content: string }

async function groqChat(messages: GMessage[], maxTokens = 1024): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");
  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: MODEL, messages, max_tokens: maxTokens, temperature: 0.7 }),
  });
  if (!res.ok) throw new Error(`Groq API error ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  return data.choices[0]?.message?.content ?? "";
}

// ─── Language helpers ───────────────────────────────────────────────────────
function langInstruction(lang: string): string {
  const scriptRule = `
CRITICAL SCRIPT RULE — This is mandatory and must NEVER be violated:
- You may ONLY use these three scripts: Urdu/Arabic script (Nastaliq/Naskh) OR English (Latin alphabet).
- If you cannot write a word correctly in Urdu or Arabic script, write it in ENGLISH instead.
- NEVER use Cyrillic (Russian), Hebrew, Greek, or ANY other script. Not even one character.
- Examples of what is FORBIDDEN: "остав", "Ма3", "Мас", "οστ" — these are Cyrillic/Greek and must NEVER appear.
- Correct fallback: if you cannot write the Arabic word "مذاهب" properly, write "madhahib" in English.
- Mixed sentence example (allowed): "تمام چار مذاہب (Hanafi, Maliki, Shafi'i, Hanbali) متفق ہیں"`.trim();

  if (lang === "ur") return `آپ کو ہمیشہ اردو میں جواب دینا ہے۔ جب تک صارف خود دوسری زبان نہ مانگے، تمام جوابات اردو میں دیں۔\n${scriptRule}`;
  if (lang === "ar") return `يجب أن تجيب دائماً باللغة العربية الفصحى ما لم يطلب المستخدم غير ذلك.\n${scriptRule}`;
  return `Always detect the language the user writes in and respond in the SAME language. If Urdu → respond in Urdu. If Arabic → respond in Arabic. If English → respond in English.\n${scriptRule}`;
}

function islamicSystem(isMultiAgent: boolean, lang: string): string {
  const base = `You are Tufi AI, a knowledgeable Islamic scholar and Mufti assistant for the Dar Al-Ifta AI application.
Core guidelines:
- Begin with appropriate Islamic greeting
- Reference Quranic verses (Surah + ayah) and Hadith (with source) when relevant
- Present views of four madhabs (Hanafi, Maliki, Shafi'i, Hanbali) where they differ
- Be respectful, compassionate, avoid extremism
- Remind users to consult a local scholar for personal matters
${langInstruction(lang)}`;
  if (isMultiAgent) return base + "\nSynthesize insights from Quranic research, Hadith verification, and Fiqh analysis. Clearly label each section.";
  return base;
}

function agentSystem(agentId: string, agentName: string, specialty: string, lang: string): string {
  const ln = langInstruction(lang);
  const prompts: Record<string, string> = {
    "1": `You are the Quran Researcher agent specializing in Quranic Studies and Tafsir.\n- Cite surah name + ayah number with Arabic text and translation\n- Reference Ibn Kathir, Al-Tabari, Al-Qurtubi, Maariful Quran\n- Explain Asbab al-Nuzul when relevant\nBegin every response with: "📖 Quran Researcher:"\n${ln}`,
    "2": `You are the Hadith Verifier agent specializing in Hadith sciences.\n- Verify authenticity: Sahih/Hasan/Da'if/Maudu'\n- Reference Bukhari, Muslim, Abu Dawud, Tirmidhi, Nasa'i, Ibn Majah\n- Explain Isnad and narrator credibility\nBegin every response with: "🛡️ Hadith Verifier:"\n${ln}`,
    "3": `You are the Fiqh Coordinator agent specializing in Islamic Jurisprudence.\n- Analyze through all four madhabs: Hanafi, Maliki, Shafi'i, Hanbali\n- Apply usul al-fiqh: Quran, Sunnah, Ijma', Qiyas, Maslaha\n- Cite recognized institutions: Dar al-Ifta Egypt, Darul Uloom, Al-Azhar\nBegin every response with: "⚖️ Fiqh Coordinator:"\n${ln}`,
    "4": `You are the Fatwa Analyst agent specializing in contemporary fatwa analysis.\n- Analyze fatwas from global Islamic institutions\n- Compare opinions on modern issues: crypto, insurance, banking, bioethics\n- Explain the ijtihad and maqasid al-Shariah behind each ruling\nBegin every response with: "📊 Fatwa Analyst:"\n${ln}`,
    "5": `You are the Arabic Linguist agent specializing in Classical Arabic.\n- Explain Arabic terms with etymology\n- Provide I'rab (grammatical analysis) of Quranic Arabic\n- Clarify how word choices affect legal rulings\nBegin every response with: "🔤 Arabic Linguist:"\n${ln}`,
    "6": `You are the Legal Advisor agent specializing in Islamic law applications.\n- Islamic finance: murabaha, ijara, sukuk, musharaka\n- Family law: nikah, talaq, mirath, hadana\n- Reference Al-Hidaya, Muwatta, Umm, Al-Mughni\nBegin every response with: "📋 Legal Advisor:"\n${ln}`,
  };
  return prompts[agentId] ?? `You are ${agentName}, an Islamic AI specialist in ${specialty}.\n${ln}`;
}

// ─── Fatwa research system prompt ──────────────────────────────────────────
function fatwaResearchSystem(lang: string): string {
  const ln = langInstruction(lang);
  return `You are a senior Islamic scholar and researcher producing a comprehensive fatwa research document.

ABSOLUTE RULE: Only use Urdu/Arabic script OR English (Latin). Never Cyrillic, never Greek, never any other script. If unsure how to spell an Islamic term in Urdu/Arabic, use the English transliteration instead (e.g. "madhab" not a garbled mix).

For the given Islamic question, produce a STRUCTURED research report in this EXACT format using these section headers:

## السؤال الكامل / مکمل سوال / Full Question
[Restate the question clearly and completely]

## الحكم الشرعي / شرعی حکم / Islamic Ruling
[State the ruling clearly: Halal/Haram/Makruh/Mubah/Wajib/Sunnah with brief explanation]

## الدليل من القرآن / قرآنی دلیل / Quranic Evidence
[Cite relevant Quranic verses with Surah name, ayah number, Arabic text, and translation]

## الدليل من السنة / حدیث کی دلیل / Hadith Evidence  
[Cite relevant authentic hadiths with source (Bukhari/Muslim/etc.), Arabic text if available, translation, and authenticity grade]

## آراء الفقهاء / فقہاء کی آراء / Scholarly Views
[Present the position of each madhab: Hanafi, Maliki, Shafi'i, Hanbali — agree or disagree, with reasons]

## جهة الإفتاء / فتوی جاری کرنے والا ادارہ / Issuing Authority
[Name recognized Islamic institutions that have addressed this: Dar al-Ifta al-Misriyyah, Darul Uloom Deoband, Al-Azhar, Islamic Fiqh Academy, AAOIFI, etc. with their stance]

## خلاصة / خلاصہ / Conclusion
[Brief 2-3 sentence summary for easy understanding]

${ln}
Be thorough, accurate, and cite real Islamic sources. This is a scholarly document.`;
}

// ─── Routes ────────────────────────────────────────────────────────────────

router.post("/groq/chat", async (req, res) => {
  try {
    const { messages, isMultiAgent, language = "auto" } = req.body as {
      messages: { role: "user" | "assistant"; content: string }[];
      isMultiAgent?: boolean;
      language?: string;
    };
    if (!Array.isArray(messages)) { res.status(400).json({ error: "messages array required" }); return; }
    const content = await groqChat([{ role: "system", content: islamicSystem(!!isMultiAgent, language) }, ...messages]);
    res.json({ content, model: MODEL });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Groq API error" });
  }
});

router.post("/groq/agent", async (req, res) => {
  try {
    const { agentId, agentName, specialty, messages, language = "auto" } = req.body as {
      agentId: string; agentName: string; specialty: string;
      messages: { role: "user" | "assistant"; content: string }[];
      language?: string;
    };
    if (!Array.isArray(messages)) { res.status(400).json({ error: "messages array required" }); return; }
    const system = agentSystem(agentId, agentName, specialty, language);
    const content = await groqChat([{ role: "system", content: system }, ...messages]);
    res.json({ content, agent: agentName, model: MODEL });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Groq API error" });
  }
});

// Comprehensive fatwa research — used by FatwaDetailScreen
router.post("/groq/fatwa", async (req, res) => {
  try {
    const { question, category, language = "auto" } = req.body as {
      question: string; category?: string; language?: string;
    };
    if (!question) { res.status(400).json({ error: "question is required" }); return; }
    const userMsg = category
      ? `Research this Islamic question from the category "${category}":\n\n${question}`
      : `Research this Islamic question:\n\n${question}`;
    const content = await groqChat(
      [{ role: "system", content: fatwaResearchSystem(language) }, { role: "user", content: userMsg }],
      2048,
    );
    res.json({ content, model: MODEL });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Groq API error" });
  }
});

// ─── Social Post Generator ───────────────────────────────────────────────────
router.post("/groq/social-post", async (req, res) => {
  try {
    const { topic, language = "ur", agentName = "Dar Al-Ifta AI", agentSpecialty = "" } = req.body as {
      topic: string; language?: string; agentName?: string; agentSpecialty?: string;
    };
    if (!topic) { res.status(400).json({ error: "topic required" }); return; }

    const langRule = language === "ar"
      ? "اكتب بالعربية الفصحى فقط."
      : "ہمیشہ خالص اردو میں لکھیں۔ کوئی Cyrillic، Greek یا دیگر رسم الخط استعمال نہ کریں۔";

    const persona = agentSpecialty
      ? `آپ "${agentName}" ہیں جو ${agentSpecialty} میں ماہر ہیں۔`
      : `آپ "${agentName}" ہیں۔`;

    const system = `${persona} آپ Dar Al-Ifta AI پلیٹ فارم کے لیے اسلامی سوشل میڈیا مواد بناتے ہیں۔
ایک پرکشش Facebook-style پوسٹ لکھیں جو:
- اپنی مہارت کے مطابق تعلیمی اور روحانی طور پر بلند کرنے والی ہو
- متعلقہ قرآنی آیت (سورہ + آیت نمبر کے ساتھ) یا صحیح حدیث شامل ہو
- 3 سے 4 مختصر پیراگراف ہوں
- آخر میں اردو/عربی ہیش ٹیگز ہوں
- اسلامی کلمات (سبحان اللہ، الحمد للہ وغیرہ) مناسب جگہ استعمال ہوں
- Emojis استعمال نہ کریں
${langRule}`;

    const content = await groqChat(
      [{ role: "system", content: system }, { role: "user", content: `اس موضوع پر پوسٹ بنائیں: ${topic}` }],
      900,
    );
    res.json({ content, model: MODEL });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : "Groq API error" });
  }
});

export default router;
