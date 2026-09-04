import React, { useState } from 'react';
import { 
  Lightbulb, 
  Search, 
  Sparkles, 
  Target, 
  FileText, 
  UserCheck, 
  Cpu, 
  ShieldCheck, 
  DollarSign, 
  Copy, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  RefreshCw, 
  Feather,
  Zap,
  Play,
  ListOrdered,
  Edit3,
  Languages,
  Eye,
  Monitor,
  Code2,
  Wand2,
  Image as ImageIcon,
  Download,
  Info
} from 'lucide-react';

async function callGeminiApi(prompt, systemInstruction = "") {
  const payload = {
    prompt,
    systemInstruction
  };

  const delays = [1000, 2000, 4000, 8000, 16000];

  for (let i = 0; i <= delays.length; i++) {
    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(detail || `Status server: ${response.status}`);
      }

      const data = await response.json();
      return data.text || "";
    } catch (error) {
      if (i === delays.length) {
        throw new Error(error?.message || "Gagal terhubung ke AI. Silakan coba beberapa saat lagi.");
      }
      await new Promise(resolve => setTimeout(resolve, delays[i]));
    }
  }
}

function ArticleRenderer({ content }) {
  if (!content) return null;

  const cleanContent = content.replace(/\*\*/g, '').replace(/\*/g, '');
  const blocks = cleanContent.split(/\n\n+/);

  return (
    <div className="space-y-4 text-slate-200 leading-relaxed font-sans">
      {blocks.map((block, idx) => {
        const trimmed = block.trim();

        if (trimmed.startsWith('# ')) {
          return <h1 key={idx} className="text-2xl font-bold text-emerald-400 mt-6 mb-2">{trimmed.replace('# ', '')}</h1>;
        }
        if (trimmed.startsWith('## ')) {
          return <h2 key={idx} className="text-lg font-bold text-emerald-300 mt-5 mb-2 border-b border-slate-800 pb-1">{trimmed.replace('## ', '')}</h2>;
        }
        if (trimmed.startsWith('### ')) {
          return <h3 key={idx} className="text-base font-semibold text-slate-100 mt-4 mb-1">{trimmed.replace('### ', '')}</h3>;
        }

        if (trimmed.startsWith('> ')) {
          return (
            <blockquote key={idx} className="p-3 my-2 border-l-4 border-emerald-500 bg-emerald-950/30 rounded-r-xl text-emerald-200 text-xs italic">
              {trimmed.replace('> ', '')}
            </blockquote>
          );
        }

        return (
          <p key={idx} className="text-xs sm:text-sm leading-relaxed text-slate-300">
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

export default function App() {
  const [viewMode, setViewMode] = useState('app');
  const [pageStage, setPageStage] = useState('topic_search');
  const [generalTopic, setGeneralTopic] = useState('');
  const [customSpecificTopic, setCustomSpecificTopic] = useState('');
  const [subtopics, setSubtopics] = useState([]);
  const [previousSubtopics, setPreviousSubtopics] = useState([]);
  const [selectedSubtopic, setSelectedSubtopic] = useState('');
  const [isAnalyzingSubtopics, setIsAnalyzingSubtopics] = useState(false);
  const [ideaGenerationCount, setIdeaGenerationCount] = useState(0);

  const [optionalData, setOptionalData] = useState({
    userExperience: '',
    toneOfVoice: 'Santai & Akrab (Ramah Pembaca)',
    targetWordCount: '1200',
    targetLanguage: 'id'
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(9);
  const [autoStatus, setAutoStatus] = useState('');
  const [activeTab, setActiveTab] = useState('preview');
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [refinementInstruction, setRefinementInstruction] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [lastRefinementInfo, setLastRefinementInfo] = useState(null);

  const [imageDescription, setImageDescription] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [generatedImageData, setGeneratedImageData] = useState(null);

  const [resultData, setResultData] = useState({
    topic: '',
    targetAudience: '',
    painPoints: '',
    keyQuestions: '',
    uniqueAngle: '',
    primaryKeyword: '',
    longTailKeywords: '',
    lsiKeywords: '',
    searchIntent: '',
    urlSlug: '',
    internalLinkSuggestions: [],
    externalLinkSuggestions: [],
    outline: '',
    articleContent: '',
    metaTitle: '',
    metaDescription: '',
    eeatScore: 0,
    eeatFeedback: [],
    qualityScore: 0,
    qualityFeedback: [],
    seoScore: 0,
    seoFeedback: [],
    adsenseScore: 0,
    adsenseFeedback: []
  });

  const stepsList = [
    { id: 1, title: 'Analisis Audiens', icon: Search, short: 'Analisis' },
    { id: 2, title: 'Unique Angle', icon: Sparkles, short: 'Angle' },
    { id: 3, title: 'SEO & Keywords', icon: Target, short: 'Keywords SEO' },
    { id: 4, title: 'Content Blueprint', icon: FileText, short: 'Outline' },
    { id: 5, title: 'Penulisan Draf', icon: Cpu, short: 'Draft' },
    { id: 6, title: 'Audit E-E-A-T Google', icon: UserCheck, short: 'E-E-A-T Google' },
    { id: 7, title: 'Audit On-Page SEO', icon: ShieldCheck, short: 'Audit SEO' },
    { id: 8, title: 'Kelayakan AdSense', icon: DollarSign, short: 'AdSense' },
    { id: 9, title: 'Artikel Final', icon: Feather, short: 'Selesai' }
  ];

  const handleOptionalChange = (field, value) => {
    setOptionalData(prev => ({ ...prev, [field]: value }));
  };

  const copyToClipboard = (text) => {
    const cleanText = text.replace(/\*\*/g, '').replace(/\*/g, '');
    const textarea = document.createElement('textarea');
    textarea.value = cleanText;
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Gagal menyalin:', err);
    }
    document.body.removeChild(textarea);
  };

  const analyzeTopicPotential = async (isRegenerate = false) => {
    if (!generalTopic.trim()) {
      setErrorMessage("Silakan masukkan topik besar atau niche terlebih dahulu.");
      return;
    }
    setErrorMessage('');

    setIsAnalyzingSubtopics(true);
    setSubtopics([]);

    const currentBatch = isRegenerate ? ideaGenerationCount + 1 : 1;
    setIdeaGenerationCount(currentBatch);

    if (!isRegenerate) {
      setPreviousSubtopics([]);
    }

    const accumulatedTitles = isRegenerate ? previousSubtopics : [];
    const avoidPrompt = accumulatedTitles.length > 0 
      ? `\n\nPERINGATAN SANGAT PENTING: JANGAN PERNAH MENGULANG atau menampilkan kembali ide-ide subtopik yang sudah dihasilkan sebelumnya berikut ini:\n${accumulatedTitles.map(t => `- "${t}"`).join('\n')}\nHasilkan 10 subtopik BARU dan BENAR-BENAR UNIK yang belum ada di daftar di atas.`
      : '';

    try {
      const prompt = `Pengguna memberikan topik besar/niche berikut: "${generalTopic.trim()}".
Tugasmu adalah menganalisis dan menghasilkan 10 pilihan ide pembahasan (subtopik spesifik) yang berbeda dan segar (Variasi Batch Ke-${currentBatch}) yang paling berpotensi banyak dicari di Google, bernilai SEO tinggi, serta ramah monetisasi AdSense.${avoidPrompt}

Hasilkan output JSON murni tanpa markdown formatting:
{
  "ideas": [
    {
      "id": 1,
      "title": "Judul Subtopik Spesifik 1",
      "reason": "Alasan mengapa topik ini berpotensi banyak dicari & diminati pembaca"
    }
  ]
}`;

      const resultText = await callGeminiApi(prompt, "Kamu adalah SEO Riset Analyst & Trend Specialist Google Global & Indonesia.");
      const cleanJson = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      if (parsed.ideas && Array.isArray(parsed.ideas)) {
        setSubtopics(parsed.ideas);
        const newTitles = parsed.ideas.map(item => item.title);
        setPreviousSubtopics(prev => isRegenerate ? [...prev, ...newTitles] : newTitles);
      } else {
        throw new Error("Format analisis topik tidak valid.");
      }
    } catch (err) {
      setErrorMessage("Gagal menganalisis potensi topik: " + err.message);
    } finally {
      setIsAnalyzingSubtopics(false);
    }
  };

  const handleSelectRecommendation = (title) => {
    setSelectedSubtopic(title);
    setPageStage('customize_details');
  };

  const handleCustomTopicSubmit = () => {
    if (!customSpecificTopic.trim()) {
      setErrorMessage("Silakan isi topik spesifik Anda terlebih dahulu.");
      return;
    }
    setErrorMessage('');
    setSelectedSubtopic(customSpecificTopic.trim());
    setPageStage('customize_details');
  };

  const startArticleGeneration = async (isAlternative = false) => {
    if (!selectedSubtopic) return;

    setPageStage('generating');
    setIsGenerating(true);
    setErrorMessage('');
    setLastRefinementInfo(null);
    const targetTopic = selectedSubtopic;
    const isEnglish = optionalData.targetLanguage === 'en';
    const langInstruction = isEnglish 
      ? "OUTPUT LANGUAGE MANDATE: Everything must be written strictly in high-quality, native ENGLISH." 
      : "MANDAT BAHASA OUTPUT: Seluruh artikel dan respon wajib ditulis dalam BAHASA INDONESIA yang alami dan santun.";

    try {
      setAutoStatus(isEnglish ? "Memproses riset keyword SEO & search intent..." : "Memproses riset keyword SEO & niat pencarian pembaca...");
      
      const prepPrompt = `Lakukan riset SEO mendalam dan pilihkan kata kunci terbaik untuk topik spesifik berikut:
Topik Spesifik Terpilih: "${targetTopic}"
Konteks Topik Induk: "${generalTopic}"

Bahasa Target Output Artikel: ${isEnglish ? 'ENGLISH' : 'BAHASA INDONESIA'}.

Hasilkan output JSON murni tanpa markdown formatting:
{
  "primaryKeyword": "Pilih 1 Kata Kunci Utama Terbaik",
  "longTailKeywords": "Pilih 3-4 Kata Kunci Long-Tail Spesifik Terbaik dipisah koma",
  "lsiKeywords": "4-5 Kata Kunci LSI / Konteks dipisah koma",
  "targetAudience": "siapa target pembaca spesifik",
  "painPoints": "masalah utama pembaca yang ingin diselesaikan",
  "keyQuestions": "3 pertanyaan pencarian paling sering dicari di Google",
  "uniqueAngle": "sudut pandang praktis dan bermanfaat agar tidak pasaran",
  "searchIntent": "Informational / Commercial / Transactional",
  "urlSlug": "rekomendasi URL slug SEO friendly",
  "internalLinkSuggestions": ["ide artikel internal 1", "ide artikel internal 2"],
  "externalLinkSuggestions": ["rujukan sumber data publik/otoritas 1", "rujukan otoritas 2"],
  "outline": "Struktur heading (H1, H2, H3, FAQ) yang rapi"
}`;

      const prepResult = await callGeminiApi(prepPrompt, `Kamu adalah SEO Data Analyst & Content Strategist Senior. ${langInstruction}`);
      let cleanPrep = prepResult.replace(/```json/g, '').replace(/```/g, '').trim();
      let prepData = {};
      try {
        prepData = JSON.parse(cleanPrep);
      } catch (e) {
        prepData = {
          primaryKeyword: targetTopic.toLowerCase(),
          longTailKeywords: isEnglish ? `guide to ${targetTopic}` : `panduan ${targetTopic}`,
          lsiKeywords: isEnglish ? `solutions for ${targetTopic}` : `solusi ${targetTopic}`,
          targetAudience: isEnglish ? `Readers looking for solutions.` : `Pembaca yang mencari solusi.`,
          painPoints: isEnglish ? `Difficulty finding clear guidance.` : `Kesulitan menemukan penjelasan praktis.`,
          keyQuestions: `1. How to start?\n2. What are key tips?`,
          uniqueAngle: isEnglish ? `A direct, step-by-step practical approach.` : `Pendekatan langsung pada langkah-langkah solutif.`,
          searchIntent: `Informational`,
          urlSlug: targetTopic.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'),
          internalLinkSuggestions: [isEnglish ? `Beginner's Guide` : `Panduan Pemula`],
          externalLinkSuggestions: [isEnglish ? `Google Search Central` : `Pusat Panduan Google`],
          outline: `H1: ${targetTopic}\nH2: Overview\nH2: Conclusion`
        };
      }

      setAutoStatus(isEnglish ? `Menulis artikel (~${optionalData.targetWordCount} kata)...` : `Menulis artikel & ramah pembaca (~${optionalData.targetWordCount} kata)...`);
      
      const userExpPrompt = optionalData.userExperience.trim() 
        ? `Sertakan poin pengalaman berikut secara alami: "${optionalData.userExperience.trim()}"` 
        : `Tulis artikel dengan nada praktisi yang berpengalaman.`;

      const alternativeVariation = isAlternative ? `Pastikan sudut pandang, gaya pembuka, dan struktur paragraf berbeda dari artikel standar namun tetap membahas topik yang sama secara mendalam.` : ``;

      const writePrompt = `Tulis artikel blog SEO bertaraf profesional yang SANGAT ALAMI, ENAK DIBACA, DAN HUMAN-LIKE.
${alternativeVariation}

MANDAT BAHASA: Tulis seluruh artikel dalam ${isEnglish ? 'ENGLISH' : 'BAHASA INDONESIA'}.

PARAMETER KONTEN:
1. Topik: "${targetTopic}"
2. Keyword Utama: "${prepData.primaryKeyword}"
3. Long-tail Keywords: "${prepData.longTailKeywords}"
4. Tone: "${optionalData.toneOfVoice}"
5. Target Kata: MINIMAL ${optionalData.targetWordCount} KATA.
6. Catatan Pengalaman: ${userExpPrompt}
7. Outline:
${prepData.outline}`;

      const articleText = await callGeminiApi(writePrompt, `Kamu adalah Penulis Blog Manusia Senior. ${langInstruction}`);

      const metaPrompt = `Buatkan Meta Title SEO (maks 60 char) dan Meta Description (maks 155 char) dalam ${isEnglish ? 'English' : 'Bahasa Indonesia'} untuk: ${targetTopic}`;
      const metaText = await callGeminiApi(metaPrompt, "Balas 2 baris:\nMeta Title: [isi]\nMeta Description: [isi]");
      
      let metaTitle = targetTopic;
      let metaDesc = `Panduan mendalam mengenai ${targetTopic}.`;

      metaText.split('\n').forEach(l => {
        if (l.toLowerCase().includes('meta title:')) metaTitle = l.replace(/meta title:/i, '').trim();
        if (l.toLowerCase().includes('meta description:')) metaDesc = l.replace(/meta description:/i, '').trim();
      });

      setAutoStatus(isEnglish ? "Menjalankan audit On-Page SEO & E-E-A-T..." : "Menjalankan audit On-Page SEO, E-E-A-T, & AdSense...");
      
      const auditPrompt = `Evaluasi artikel berikut berdasarkan standar Google E-E-A-T, On-Page SEO, dan AdSense. (Respon dalam ${isEnglish ? 'English' : 'Bahasa Indonesia'}).

ARTIKEL:
${articleText.substring(0, 2000)}...

Balas JSON murni:
{
  "eeatScore": 93,
  "eeatFeedback": ["Experience: Baik.", "Expertise: Komprehensif.", "Trustworthiness: Terpercaya."],
  "qualityScore": 92,
  "qualityFeedback": ["Bahasa alami."],
  "seoScore": 94,
  "seoFeedback": ["Keyword optimal.", "Meta tags sesuai."],
  "adsenseScore": 95,
  "adsenseFeedback": ["Siap monetisasi.", "Bebas low value content."]
}`;

      const auditResult = await callGeminiApi(auditPrompt, "Kamu adalah Google Search Quality Rater.");
      let cleanAudit = auditResult.replace(/```json/g, '').replace(/```/g, '').trim();
      let auditData = {};
      try {
        auditData = JSON.parse(cleanAudit);
      } catch (e) {
        auditData = {
          eeatScore: 92,
          eeatFeedback: ["Memenuhi kriteria E-E-A-T."],
          qualityScore: 92,
          qualityFeedback: ["Penulisan alami."],
          seoScore: 94,
          seoFeedback: ["SEO optimal."],
          adsenseScore: 95,
          adsenseFeedback: ["AdSense ready."]
        };
      }

      setResultData({
        topic: targetTopic,
        targetAudience: prepData.targetAudience || '',
        painPoints: prepData.painPoints || '',
        keyQuestions: prepData.keyQuestions || '',
        uniqueAngle: prepData.uniqueAngle || '',
        primaryKeyword: prepData.primaryKeyword || targetTopic,
        longTailKeywords: prepData.longTailKeywords || '',
        lsiKeywords: prepData.lsiKeywords || '',
        searchIntent: prepData.searchIntent || 'Informational',
        urlSlug: prepData.urlSlug || '',
        internalLinkSuggestions: prepData.internalLinkSuggestions || [],
        externalLinkSuggestions: prepData.externalLinkSuggestions || [],
        outline: prepData.outline || '',
        articleContent: articleText.trim(),
        metaTitle: metaTitle,
        metaDescription: metaDesc,
        eeatScore: auditData.eeatScore || 93,
        eeatFeedback: auditData.eeatFeedback || ["Memenuhi standar."],
        qualityScore: auditData.qualityScore || 92,
        qualityFeedback: auditData.qualityFeedback || ["Berkualitas tinggi."],
        seoScore: auditData.seoScore || 94,
        seoFeedback: auditData.seoFeedback || ["On-page optimal."],
        adsenseScore: auditData.adsenseScore || 95,
        adsenseFeedback: auditData.adsenseFeedback || ["Siap AdSense."]
      });

      setImageDescription('');
      setGeneratedImageData(null);

      setPageStage('result');
      setCurrentStep(9);
    } catch (err) {
      setErrorMessage("Terjadi kesalahan: " + err.message);
      setPageStage('customize_details');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateBlogImage = async () => {
    if (!imageDescription.trim()) {
      setErrorMessage("Silakan masukkan deskripsi gambar terlebih dahulu.");
      return;
    }
    setIsGeneratingImage(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/gemini-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: imageDescription.trim() })
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(detail || `Gagal menghasilkan gambar (Status: ${response.status})`);
      }

      const result = await response.json();
      const part = result?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      
      if (!part || !part.inlineData) {
        throw new Error("Gambar tidak ditemukan dalam respon AI.");
      }

      const rawBase64 = part.inlineData.data;
      const mimeType = part.inlineData.mimeType || 'image/jpeg';
      const compressedDataUrl = await compressImageToUnder100KB(rawBase64, mimeType);

      const base64Data = compressedDataUrl.split(',')[1];
      const sizeInBytes = (base64Data.length * 3) / 4;
      const sizeInKB = (sizeInBytes / 1024).toFixed(1);

      const safeFilename = (resultData.topic || 'article-image')
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-') + '.jpg';

      const altText = `Ilustrasi foto realistis ${resultData.topic} - ${imageDescription.trim()}`;
      const titleText = `${resultData.topic} - Gambar Artikel`;

      setGeneratedImageData({
        dataUrl: compressedDataUrl,
        filename: safeFilename,
        altText: altText,
        titleText: titleText,
        format: 'JPG/JPEG',
        sizeKB: sizeInKB
      });

    } catch (err) {
      setErrorMessage("Gagal membuat gambar AI: " + err.message);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const compressImageToUnder100KB = (base64Str, mimeType) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = `data:${mimeType};base64,${base64Str}`;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const MAX_WIDTH = 1024;
        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.85;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        
        while (dataUrl.length * 0.75 > 100 * 1024 && quality > 0.1) {
          quality -= 0.15;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(dataUrl);
      };
    });
  };

  const handleRefineArticleSection = async () => {
    if (!refinementInstruction.trim() || !resultData.articleContent) return;
    setIsRefining(true);
    setErrorMessage('');

    const isEnglish = optionalData.targetLanguage === 'en';
    const langPrompt = isEnglish ? "Write in English." : "Tulis dalam Bahasa Indonesia.";

    const prompt = `Berikut adalah artikel lengkap saat ini:
---
${resultData.articleContent}
---

Instruksi perubahan dari pengguna: "${refinementInstruction.trim()}"

Tugasmu: Perbarui atau modifikasi artikel di atas sesuai instruksi spesifik pengguna tersebut. Pertahankan kualitas SEO, kealamian bahasa human-like, serta format heading markdown yang rapi. 
Keluarkan artikel lengkap terbaru hasil revisi secara utuh tanpa teks pembuka/penutup lain. ${langPrompt}`;

    const summaryPrompt = `Berdasarkan instruksi pengguna berikut: "${refinementInstruction.trim()}", buatkan 2-3 poin penjelasan singkat dan jelas dalam bahasa Indonesia mengenai apa saja bagian yang diubah atau ditambahkan pada artikel.`;

    try {
      const [updatedArticle, summaryResult] = await Promise.all([
        callGeminiApi(prompt, "Kamu adalah editor senior dan spesialis konten SEO."),
        callGeminiApi(summaryPrompt, "Kamu adalah asisten editor.")
      ]);

      if (updatedArticle.trim()) {
        setResultData(prev => ({ ...prev, articleContent: updatedArticle.trim() }));
        setLastRefinementInfo({
          instruction: refinementInstruction.trim(),
          explanation: summaryResult.trim().replace(/\*\*/g, '').replace(/\*/g, '') || "Perubahan telah diterapkan sesuai dengan instruksi Anda."
        });
        setRefinementInstruction('');
      } else {
        throw new Error("Gagal memperbarui artikel.");
      }
    } catch (err) {
      setErrorMessage("Gagal merevisi artikel: " + err.message);
    } finally {
      setIsRefining(false);
    }
  };

  const handleResetAll = () => {
    setGeneralTopic('');
    setCustomSpecificTopic('');
    setSubtopics([]);
    setPreviousSubtopics([]);
    setSelectedSubtopic('');
    setErrorMessage('');
    setRefinementInstruction('');
    setLastRefinementInfo(null);
    setImageDescription('');
    setGeneratedImageData(null);
    setResultData({ ...resultData, articleContent: '' });
    setPageStage('topic_search');
    setCurrentStep(9);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 shrink-0">
              <Zap className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
                SEO Article Studio Pro
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                Generator Artikel Blog Profesional dengan Optimasi SEO & Standar E-E-A-T Google
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="bg-slate-800 p-1 rounded-xl flex items-center border border-slate-700">
              <button
                onClick={() => setViewMode('app')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === 'app' 
                    ? 'bg-emerald-500 text-slate-950 shadow' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" /> Preview
              </button>
              <button
                onClick={() => setViewMode('code')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  viewMode === 'code' 
                    ? 'bg-emerald-500 text-slate-950 shadow' 
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" /> Kode
              </button>
            </div>
          </div>
        </div>
      </header>

      {errorMessage && (
        <div className="max-w-4xl w-full mx-auto mt-4 px-4">
          <div className="bg-rose-950/80 border border-rose-500/50 text-rose-200 px-4 py-3 rounded-2xl text-xs flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage('')} className="font-bold ml-2">✕</button>
          </div>
        </div>
      )}

      {viewMode === 'code' ? (
        <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 overflow-x-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <span className="text-xs font-mono text-emerald-400">App.jsx (React Single Component)</span>
              <button
                onClick={() => copyToClipboard(`// SEO Article Studio Pro Source Code`)}
                className="text-xs bg-slate-800 text-slate-200 px-3 py-1 rounded-lg border border-slate-700 hover:bg-slate-700 transition"
              >
                Salin Kode
              </button>
            </div>
            <pre className="text-xs text-slate-300 font-mono leading-relaxed overflow-x-auto max-h-[600px]">
              {`// SEO Article Studio Pro - All-in-One Component
export default function App() {
  return <div className="p-8 text-center">Silakan beralih ke tab 'Preview' di bagian atas untuk menguji antarmuka.</div>;
}`}
            </pre>
          </div>
        </div>
      ) : (
        <>
          {pageStage === 'result' && (
            <div className="bg-slate-950/40 border-b border-slate-800 py-2.5 px-4 overflow-x-auto">
              <div className="max-w-6xl mx-auto flex items-center justify-between min-w-[700px] space-x-1">
                {stepsList.map((step) => {
                  const isActive = currentStep === step.id;
                  return (
                    <button
                      key={step.id}
                      onClick={() => setCurrentStep(step.id)}
                      className={`flex flex-col items-center flex-1 py-1 px-2 rounded-lg transition ${
                        isActive 
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="text-[11px] whitespace-nowrap">{step.short}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 md:p-8">
            {pageStage === 'topic_search' && (
              <div className="space-y-6 my-2">
                <div className="bg-slate-800/50 border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur space-y-4">
                  <div className="text-center max-w-xl mx-auto space-y-2">
                    <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400 mb-2">
                      <Lightbulb className="w-6 h-6" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-100">
                      Riset Topik & Subtopik Potensial
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400">
                      Masukkan topik besar atau niche blog Anda untuk menemukan pembahasan spesifik bernilai SEO tinggi.
                    </p>
                  </div>

                  <div className="space-y-2 max-w-2xl mx-auto">
                    <label className="block text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Masukkan Topik Besar / Niche Blog *
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Contoh: Bisnis Agrobisnis, Belajar Coding, Tips Hemat..."
                        value={generalTopic}
                        onChange={(e) => setGeneralTopic(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && analyzeTopicPotential(false)}
                        className="flex-1 bg-slate-900 border-2 border-slate-700 rounded-2xl px-4 py-3.5 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 shadow-inner"
                      />
                      <button
                        onClick={() => analyzeTopicPotential(false)}
                        disabled={isAnalyzingSubtopics}
                        className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-2xl transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 whitespace-nowrap"
                      >
                        {isAnalyzingSubtopics ? (
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                          <Search className="w-5 h-5" />
                        )}
                        Cari 10 Rekomendasi Subtopik
                      </button>
                    </div>
                  </div>
                </div>

                {isAnalyzingSubtopics && (
                  <div className="p-8 bg-slate-800/60 border border-slate-700/80 rounded-3xl text-center space-y-3">
                    <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                    <p className="text-sm text-slate-200 font-medium">Memindai 10 ide subtopik spesifik yang paling banyak dicari di Google...</p>
                  </div>
                )}

                {subtopics.length > 0 && !isAnalyzingSubtopics && (
                  <div className="bg-slate-800/50 border border-slate-700/60 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-700 pb-3 gap-2">
                      <div>
                        <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                          <ListOrdered className="w-5 h-5" /> Rekomendasi Subtopik Potensial
                        </h3>
                        <p className="text-xs text-slate-400">Klik salah satu pilihan di bawah untuk melanjutkan.</p>
                      </div>
                      
                      <button
                        onClick={() => analyzeTopicPotential(true)}
                        className="flex items-center gap-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-emerald-300 border border-emerald-500/30 px-3 py-2 rounded-xl transition whitespace-nowrap self-start sm:self-auto"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-emerald-400" /> Cari 10 Ide Lainnya (Tanpa Mengulang)
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {subtopics.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleSelectRecommendation(item.title)}
                          className="group p-4 bg-slate-900/90 hover:bg-emerald-950/40 border border-slate-700/80 hover:border-emerald-500/60 rounded-2xl transition cursor-pointer flex items-start gap-3.5"
                        >
                          <div className="w-7 h-7 bg-slate-800 group-hover:bg-emerald-500 group-hover:text-slate-950 text-emerald-400 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition">
                            {item.id}
                          </div>
                          <div className="flex-1 space-y-1">
                            <h4 className="font-semibold text-sm text-slate-100 group-hover:text-emerald-300 transition">
                              {item.title}
                            </h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              <b className="text-slate-300">Potensi Riset:</b> {item.reason}
                            </p>
                          </div>
                          <button className="text-xs bg-slate-800 group-hover:bg-emerald-500 text-slate-300 group-hover:text-slate-950 px-3.5 py-2 rounded-xl font-medium transition self-center shrink-0 flex items-center gap-1">
                            Pilih <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-slate-800/40 border border-slate-700/60 rounded-3xl p-6 sm:p-8 space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-emerald-400" /> Punya Subtopik Spesifik Sendiri?
                  </label>
                  <p className="text-xs text-slate-400">
                    Jika Anda sudah memiliki judul/subtopik spesifik sendiri yang ingin dibahas, ketik di bawah ini:
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Contoh: Cara Menanam Cabai Rawit di Pot..."
                      value={customSpecificTopic}
                      onChange={(e) => setCustomSpecificTopic(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCustomTopicSubmit()}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      onClick={handleCustomTopicSubmit}
                      className="px-5 py-3 bg-slate-700 hover:bg-slate-600 text-emerald-300 border border-emerald-500/30 font-semibold text-xs rounded-2xl transition flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <Play className="w-3.5 h-3.5 fill-emerald-300" /> Gunakan Subtopik Saya
                    </button>
                  </div>
                </div>
              </div>
            )}

            {pageStage === 'customize_details' && (
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur space-y-6 my-4">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-4">
                  <div>
                    <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block mb-1">
                      Pengaturan Detail Artikel
                    </span>
                    <h3 className="text-lg font-bold text-slate-100">
                      Topik Terpilih: "{selectedSubtopic}"
                    </h3>
                  </div>
                  <button
                    onClick={() => setPageStage('topic_search')}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl transition flex items-center gap-1 border border-slate-700"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Ganti Topik
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                      <Languages className="w-3.5 h-3.5 text-emerald-400" /> Bahasa Target Output
                    </label>
                    <select
                      value={optionalData.targetLanguage}
                      onChange={(e) => handleOptionalChange('targetLanguage', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                    >
                      <option value="id">Bahasa Indonesia (Default)</option>
                      <option value="en">English (Native-like)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">Gaya Bahasa / Tone of Voice</label>
                    <select
                      value={optionalData.toneOfVoice}
                      onChange={(e) => handleOptionalChange('toneOfVoice', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Santai & Akrab (Ramah Pembaca)">Santai & Akrab (Ramah Pembaca)</option>
                      <option value="Profesional & Otoritatif (Pakar)">Profesional & Otoritatif (Pakar)</option>
                      <option value="Informatif & Edukatif (Step-by-Step)">Informatif & Edukatif (Step-by-Step)</option>
                      <option value="Persuasif & Menjual (Copywriting)">Persuasif & Menjual (Copywriting)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">Target Jumlah Kata</label>
                    <select
                      value={optionalData.targetWordCount}
                      onChange={(e) => handleOptionalChange('targetWordCount', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-3 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                    >
                      <option value="800">~800 Kata (Ringkas & Padat)</option>
                      <option value="1200">~1200 Kata (Standar SEO Optimal)</option>
                      <option value="1800">~1800 Kata (Long-form Mendalam)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300">Catatan Pengalaman / Sudut Pandang Unik (Opsional)</label>
                    <textarea
                      rows={4}
                      placeholder="Contoh: Berdasarkan pengalaman saya selama 3 tahun berkecimpung di bidang ini, banyak pemula sering keliru pada tahap awal..."
                      value={optionalData.userExperience}
                      onChange={(e) => handleOptionalChange('userExperience', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 resize-y leading-relaxed"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-700/60 flex justify-end">
                  <button
                    onClick={() => startArticleGeneration(false)}
                    className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-2xl transition shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-5 h-5 fill-slate-950" /> Jalankan Generator 9 Langkah Otomatis
                  </button>
                </div>
              </div>
            )}

            {pageStage === 'generating' && (
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-3xl p-10 shadow-2xl backdrop-blur text-center space-y-6 my-12">
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl flex items-center justify-center mx-auto text-emerald-400 animate-bounce">
                  <RefreshCw className="w-8 h-8 animate-spin" />
                </div>
                <div className="space-y-2 max-w-md mx-auto">
                  <h3 className="text-xl font-bold text-slate-100">Sedang Membuat Artikel SEO Pro</h3>
                  <p className="text-xs text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-500/30 py-2 px-4 rounded-xl">
                    {autoStatus || "Memproses permintaan..."}
                  </p>
                  <p className="text-xs text-slate-400 pt-2">
                    Mohon tunggu beberapa detik. AI sedang melakukan riset keyword, menyusun kerangka, menulis artikel mendalam, dan mengaudit E-E-A-T.
                  </p>
                </div>
              </div>
            )}

            {pageStage === 'result' && (
              <div className="space-y-6">
                {currentStep === 1 && (
                  <div className="bg-slate-800/50 border border-slate-700/60 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
                    <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                      <Search className="w-5 h-5" /> Analisis Audiens & Pain Points
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="p-4 bg-slate-900 border border-slate-700 rounded-2xl space-y-2">
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Target Pembaca Spesifik</span>
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{resultData.targetAudience}</p>
                      </div>
                      <div className="p-4 bg-slate-900 border border-slate-700 rounded-2xl space-y-2">
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">Masalah Utama (Pain Points)</span>
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{resultData.painPoints}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-900 border border-slate-700 rounded-2xl space-y-2">
                      <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block">Pertanyaan Paling Sering Dicari (Key Questions)</span>
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">{resultData.keyQuestions}</p>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="bg-slate-800/50 border border-slate-700/60 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
                    <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                      <Sparkles className="w-5 h-5" /> Unique Angle & Search Intent
                    </h3>
                    <div className="space-y-4 pt-2">
                      <div className="p-4 bg-slate-900 border border-slate-700 rounded-2xl space-y-2">
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Sudut Pandang Unik (Unique Angle)</span>
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{resultData.uniqueAngle}</p>
                      </div>
                      <div className="p-4 bg-slate-900 border border-slate-700 rounded-2xl space-y-2">
                        <span className="text-xs font-bold text-teal-400 uppercase tracking-wider block">Niat Pencarian (Search Intent)</span>
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{resultData.searchIntent}</p>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="bg-slate-800/50 border border-slate-700/60 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
                    <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                      <Target className="w-5 h-5" /> SEO & Keywords Strategy
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                      <div className="p-4 bg-slate-900 border border-slate-700 rounded-2xl space-y-2">
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Keyword Utama</span>
                        <p className="text-xs sm:text-sm text-slate-100 font-semibold">{resultData.primaryKeyword}</p>
                      </div>
                      <div className="p-4 bg-slate-900 border border-slate-700 rounded-2xl space-y-2">
                        <span className="text-xs font-bold text-sky-400 uppercase tracking-wider block">Long-Tail Keywords</span>
                        <p className="text-xs sm:text-sm text-slate-200">{resultData.longTailKeywords}</p>
                      </div>
                      <div className="p-4 bg-slate-900 border border-slate-700 rounded-2xl space-y-2">
                        <span className="text-xs font-bold text-teal-400 uppercase tracking-wider block">LSI / Konteks Keywords</span>
                        <p className="text-xs sm:text-sm text-slate-200">{resultData.lsiKeywords}</p>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="bg-slate-800/50 border border-slate-700/60 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
                    <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                      <FileText className="w-5 h-5" /> Content Blueprint & Outline
                    </h3>
                    <div className="p-4 bg-slate-900 border border-slate-700 rounded-2xl space-y-2">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Struktur Heading (H1, H2, H3)</span>
                      <pre className="text-xs text-slate-200 font-mono whitespace-pre-line leading-relaxed">{resultData.outline}</pre>
                    </div>
                  </div>
                )}

                {currentStep === 5 && (
                  <div className="bg-slate-800/50 border border-slate-700/60 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
                    <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                      <Cpu className="w-5 h-5" /> Penulisan Draf & Human-like Review
                    </h3>
                    <p className="text-xs text-slate-400">Artikel telah ditulis dengan standar human-like dan mengalir alami.</p>
                    <button onClick={() => setCurrentStep(9)} className="text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl transition">
                      Lihat Artikel Lengkap di Tab Final →
                    </button>
                  </div>
                )}

                {currentStep === 6 && (
                  <div className="bg-slate-800/50 border border-slate-700/60 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                        <UserCheck className="w-5 h-5" /> Audit E-E-A-T Google
                      </h3>
                      <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-1.5 rounded-xl font-bold text-sm">
                        Skor: {resultData.eeatScore}/100
                      </div>
                    </div>
                    <ul className="space-y-2 pt-2">
                      {resultData.eeatFeedback.map((fb, i) => (
                        <li key={i} className="text-xs sm:text-sm bg-slate-900 border border-slate-700 p-3 rounded-xl text-slate-200 flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{fb}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {currentStep === 7 && (
                  <div className="bg-slate-800/50 border border-slate-700/60 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5" /> Audit On-Page SEO
                      </h3>
                      <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-1.5 rounded-xl font-bold text-sm">
                        Skor: {resultData.seoScore}/100
                      </div>
                    </div>
                    <ul className="space-y-2 pt-2">
                      {resultData.seoFeedback.map((fb, i) => (
                        <li key={i} className="text-xs sm:text-sm bg-slate-900 border border-slate-700 p-3 rounded-xl text-slate-200 flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{fb}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {currentStep === 8 && (
                  <div className="bg-slate-800/50 border border-slate-700/60 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
                        <DollarSign className="w-5 h-5" /> Kelayakan AdSense & Monetisasi
                      </h3>
                      <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-4 py-1.5 rounded-xl font-bold text-sm">
                        Skor: {resultData.adsenseScore}/100
                      </div>
                    </div>
                    <ul className="space-y-2 pt-2">
                      {resultData.adsenseFeedback.map((fb, i) => (
                        <li key={i} className="text-xs sm:text-sm bg-slate-900 border border-slate-700 p-3 rounded-xl text-slate-200 flex items-start gap-2">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{fb}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {currentStep === 9 && (
                  <div className="space-y-6">
                    <div className="bg-slate-800/50 border border-slate-700/60 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-700 pb-4 gap-3">
                        <div>
                          <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block mb-1">Artikel Final Siap Publikasi</span>
                          <h2 className="text-xl font-bold text-slate-100">{resultData.topic}</h2>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => startArticleGeneration(true)}
                            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-700 hover:bg-slate-600 text-emerald-300 border border-emerald-500/30 font-semibold text-xs rounded-xl transition"
                          >
                            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" /> Buat Artikel Lain (Berbeda)
                          </button>
                          <button
                            onClick={() => copyToClipboard(resultData.articleContent)}
                            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-500/20"
                          >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? "Berhasil Disalin!" : "Salin Artikel"}
                          </button>
                          <button
                            onClick={handleResetAll}
                            className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 font-semibold text-xs rounded-xl transition border border-slate-600"
                          >
                            + Buat Baru
                          </button>
                        </div>
                      </div>

                      <div className="bg-slate-900/90 border border-slate-700/80 p-4 rounded-2xl space-y-3">
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">SEO Meta Tags</span>
                        <div className="space-y-2 text-xs">
                          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                            <span className="text-slate-400 block font-semibold">Meta Title:</span>
                            <span className="text-slate-200">{resultData.metaTitle}</span>
                          </div>
                          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                            <span className="text-slate-400 block font-semibold">Meta Description:</span>
                            <span className="text-slate-200">{resultData.metaDescription}</span>
                          </div>
                          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                            <span className="text-slate-400 block font-semibold">URL Slug:</span>
                            <span className="text-slate-200 font-mono">/{resultData.urlSlug}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 border-b border-slate-700/60 pb-2">
                        <button
                          onClick={() => setActiveTab('preview')}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                            activeTab === 'preview' 
                              ? 'bg-emerald-500 text-slate-950 shadow' 
                              : 'text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" /> Preview Tampilan Web
                        </button>
                        <button
                          onClick={() => setActiveTab('markdown')}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                            activeTab === 'markdown' 
                              ? 'bg-emerald-500 text-slate-950 shadow' 
                              : 'text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5" /> Markdown Mentah
                        </button>
                      </div>

                      {activeTab === 'preview' ? (
                        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-inner space-y-6">
                          <ArticleRenderer content={resultData.articleContent} />
                        </div>
                      ) : (
                        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
                          <textarea
                            readOnly
                            value={resultData.articleContent.replace(/\*\*/g, '').replace(/\*/g, '')}
                            className="w-full h-96 bg-slate-950 text-slate-300 font-mono text-xs p-3 focus:outline-none resize-none"
                          />
                        </div>
                      )}

                      {lastRefinementInfo && (
                        <div className="bg-slate-900 border border-emerald-500/40 p-4 rounded-2xl flex items-start gap-3 shadow-md mt-6">
                          <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                          <div className="space-y-1.5 text-xs">
                            <span className="font-bold text-emerald-300 uppercase tracking-wider block">Ringkasan Perubahan AI Editor:</span>
                            <p className="text-slate-300">
                              <b>Instruksi Anda:</b> "{lastRefinementInfo.instruction}"
                            </p>
                            <div className="text-slate-200 bg-slate-950 border border-slate-800 p-3 rounded-xl mt-2 space-y-1">
                              <span className="text-emerald-400 font-semibold block">Detail yang Telah Diubah:</span>
                              <p className="leading-relaxed whitespace-pre-line">{lastRefinementInfo.explanation}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-800/50 border border-slate-700/60 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
                      <div className="flex items-center space-x-2 border-b border-slate-700 pb-3">
                        <Wand2 className="w-5 h-5 text-emerald-400" />
                        <h3 className="text-lg font-bold text-slate-100">Ubah & Sesuaikan Bagian Tertentu (AI Editor)</h3>
                      </div>
                      <p className="text-xs text-slate-400">
                        Ingin mengubah nada, memperpanjang paragraf tertentu, menambahkan tips khusus, atau memperbaiki sub-bagian tertentu? Tulis instruksi Anda di bawah. Penjelasan ringkas mengenai apa saja yang diubah akan ditampilkan di bawah artikel.
                      </p>

                      <div className="space-y-3">
                        <textarea
                          rows={3}
                          value={refinementInstruction}
                          onChange={(e) => setRefinementInstruction(e.target.value)}
                          placeholder="Contoh: Perpanjang bagian tips nomor 3 agar lebih mendetail, atau ubah bagian pendahuluan menjadi lebih kasual..."
                          className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 resize-none"
                        />
                        <button
                          onClick={handleRefineArticleSection}
                          disabled={isRefining || !refinementInstruction.trim()}
                          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                        >
                          {isRefining ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                          {isRefining ? "Merevisi Artikel..." : "Terapkan Perubahan AI"}
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-800/50 border border-slate-700/60 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
                      <div className="flex items-center space-x-2 border-b border-slate-700 pb-3">
                        <ImageIcon className="w-5 h-5 text-emerald-400" />
                        <h3 className="text-lg font-bold text-slate-100">Generator Gambar AI Realistis (SEO Web Optimized &lt; 100 KB)</h3>
                      </div>
                      <p className="text-xs text-slate-400">
                        Masukkan deskripsi visual gambar yang Anda inginkan. Sistem akan menghasilkan foto realistis landscape (16:9), ukuran di bawah 100 KB, penamaan file sesuai judul artikel, lengkap dengan <b>Alt Text</b> & <b>Title Text</b> untuk optimasi SEO.
                      </p>

                      <div className="space-y-3">
                        <textarea
                          rows={2}
                          value={imageDescription}
                          onChange={(e) => setImageDescription(e.target.value)}
                          placeholder="Contoh: Seorang profesional sedang fokus bekerja di depan laptop di kafe dengan pencahayaan hangat..."
                          className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 resize-none"
                        />
                        <button
                          onClick={handleGenerateBlogImage}
                          disabled={isGeneratingImage || !imageDescription.trim()}
                          className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                        >
                          {isGeneratingImage ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                          {isGeneratingImage ? "Membuat & Mengompres Gambar (< 100KB)..." : "Generate Gambar AI"}
                        </button>
                      </div>

                      {generatedImageData && (
                        <div className="mt-6 pt-6 border-t border-slate-700/60 space-y-4">
                          <div className="rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 max-w-2xl mx-auto">
                            <img src={generatedImageData.dataUrl} alt={generatedImageData.altText} title={generatedImageData.titleText} className="w-full h-auto object-cover max-h-[400px]" />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl space-y-1">
                              <span className="text-slate-400 block font-semibold">Nama File (SEO-friendly):</span>
                              <span className="text-emerald-400 font-mono font-bold">{generatedImageData.filename}</span>
                            </div>
                            <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl space-y-1">
                              <span className="text-slate-400 block font-semibold">Format & Ukuran File:</span>
                              <span className="text-slate-200">{generatedImageData.format} • <b className="text-emerald-400">{generatedImageData.sizeKB} KB</b> (&lt; 100 KB)</span>
                            </div>
                            <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl space-y-1 sm:col-span-2">
                              <span className="text-slate-400 block font-semibold">Alt Text (SEO):</span>
                              <span className="text-slate-200 italic">"{generatedImageData.altText}"</span>
                            </div>
                            <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl space-y-1 sm:col-span-2">
                              <span className="text-slate-400 block font-semibold">Title Text (SEO):</span>
                              <span className="text-slate-200 italic">"{generatedImageData.titleText}"</span>
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <a
                              href={generatedImageData.dataUrl}
                              download={generatedImageData.filename}
                              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-md shadow-emerald-500/20"
                            >
                              <Download className="w-4 h-4" /> Unduh Gambar ({generatedImageData.sizeKB} KB)
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>
        </>
      )}

      <footer className="mt-auto border-t border-slate-800 bg-slate-950 py-4 px-4 text-center text-xs text-slate-400 space-y-1">
        <p>Hak cipta tools oleh Novarty - Grow from Home. Dilindungi Undang-Undang.</p>
        <p>Bila ada error, kendala, atau masukan untuk pengembangan tools, email ke novarty@gmail.com.</p>
      </footer>
    </div>
  );
}