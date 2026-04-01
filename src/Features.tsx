import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Youtube, FileText, Map, MessageSquare, Search, Play, Download, Sparkles, Send, Bot, ExternalLink, Zap, Brain, Copy, Clock, Calendar, X, RotateCcw, Pause, Utensils } from 'lucide-react';
import { jsPDF } from "jspdf";
import Markdown from 'react-markdown';
const Type = {
  OBJECT: 'OBJECT',
  ARRAY: 'ARRAY',
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  INTEGER: 'INTEGER',
  BOOLEAN: 'BOOLEAN',
};

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

async function callGemini(model: string, contents: any[], config: any = {}) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          responseMimeType: config.responseMimeType,
          responseSchema: config.responseSchema,
          temperature: config.temperature,
          topP: config.topP,
          topK: config.topK,
        },
        systemInstruction: config.systemInstruction ? { parts: [{ text: config.systemInstruction }] } : undefined,
      }),
    }
  );
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return {
    text: data.candidates?.[0]?.content?.parts?.[0]?.text || ""
  };
}

interface FeatureProps {
  onBack: () => void;
  lang?: string;
}

interface AIMentorProps extends FeatureProps {
  userData?: any;
  predictionResult?: any;
}

export function YouTubeSuggester({ onBack, lang = 'en' }: FeatureProps) {
  const [subject, setSubject] = React.useState('');
  const [year, setYear] = React.useState('1st Year');
  const [course, setCourse] = React.useState('B.Tech');
  const [suggestions, setSuggestions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);

  const handleSearch = async () => {
    if (!subject.trim()) return;
    setLoading(true);
    try {
      const model = "gemini-3-flash-preview";
      const prompt = `Suggest 5 high-quality YouTube resources for a ${year} ${course} student learning "${subject}".
      Return ONLY a JSON array of objects: [{"title": "...", "channel": "...", "url": "...", "description": "...", "whyItIsGood": "..."}]
      Use search URLs: https://www.youtube.com/results?search_query=...`;
      
      const response = await callGemini(model, [{ parts: [{ text: prompt }] }], { 
        responseMimeType: "application/json"
      });

      let text = response.text || "[]";
      // Clean potential markdown code blocks
      text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
      const data = JSON.parse(text);
      const results = Array.isArray(data) ? data : (data.suggestions || data.resources || []);
      setSuggestions(results);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 z-30 pt-[80px] px-4 sm:px-8 overflow-y-auto pb-20 bg-[#020814]/75 backdrop-blur-xl custom-scrollbar">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button onClick={onBack} className="flex items-center gap-2 text-cyan/60 hover:text-cyan transition-colors font-display text-[10px] uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" /> {lang === 'en' ? 'Back to Prediction' : 'भविष्यवाणी पर वापस जाएं'}
        </button>

        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
            <Youtube className="w-6 h-6 sm:w-7 h-7" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl sm:text-4xl text-white uppercase tracking-wider">{lang === 'en' ? '🎥 WATCH & LEVEL UP' : 'यूट्यूब सुझाव'}</h1>
            <p className="text-white/40 font-display text-[8px] sm:text-[10px] tracking-[2px] uppercase">{lang === 'en' ? '— DROP YOUR SUBJECT. GET THE BEST VIDEOS. NO SCROLLING NEEDED. —' : 'आपके शैक्षणिक प्रोफाइल के लिए क्यूरेटेड शैक्षिक सामग्री'}</p>
          </div>
        </div>

        <div className="glass-panel p-4 sm:p-8 rounded-xl border-white/5 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-display text-white/40 uppercase tracking-widest">🎓 YOUR DEGREE</label>
              <input 
                type="text" 
                placeholder="e.g. B.Tech, BCA, BSc..."
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full bg-[#02060a]/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-cyan/50 transition-all font-sans"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-display text-white/40 uppercase tracking-widest">📅 WHICH YEAR?</label>
              <select 
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full bg-[#02060a]/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-cyan/50 transition-all font-sans appearance-none"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Post-Grad">Post-Grad</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-display text-white/40 uppercase tracking-widest">🔍 WHAT DO YOU WANT TO LEARN?</label>
              <input 
                type="text" 
                placeholder="e.g. Data Structures..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full bg-[#02060a]/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-cyan/50 transition-all font-sans"
              />
            </div>
          </div>

          <button 
            onClick={handleSearch}
            disabled={loading || !subject.trim() || !course.trim()}
            className="w-full py-4 bg-red-600/10 border border-red-600/20 rounded-lg text-red-500 font-display text-[12px] font-bold tracking-[2px] hover:bg-red-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_15px_rgba(220,38,38,0.1)]"
          >
            {loading ? <div className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" /> : <Search className="w-4 h-4" />}
            {loading ? 'ANALYZING CURRICULUM...' : 'GET CURATED SUGGESTIONS'}
          </button>

          {suggestions.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-white/5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-[12px] text-cyan tracking-[3px] uppercase">Top Recommendations</h2>
                <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Context: {year} {course}</span>
              </div>
              <div className="grid gap-4">
                {suggestions.map((item, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-5 flex items-start gap-5 hover:border-cyan/30 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Youtube className="w-12 h-12" />
                    </div>
                    <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 flex-shrink-0 group-hover:scale-110 transition-transform border border-red-500/20">
                      <Play className="w-6 h-6 fill-current" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-display text-[15px] font-bold text-white tracking-wide uppercase">{item.title}</h3>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-mono text-red-500 uppercase tracking-widest font-bold">{item.channel}</span>
                            <span className="w-1 h-1 rounded-full bg-white/20" />
                            <span className="text-[9px] text-white/40 uppercase tracking-tighter">Verified Resource</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-[12px] text-white/60 leading-relaxed italic">"{item.description}"</p>
                      
                      {item.whyItIsGood && (
                        <div className="bg-cyan/5 border border-cyan/10 rounded p-3 mt-2">
                          <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-3 h-3 text-cyan" />
                            <span className="text-[9px] font-display text-cyan uppercase tracking-widest font-bold">Why it works for you</span>
                          </div>
                          <p className="text-[11px] text-cyan/70 leading-tight">{item.whyItIsGood}</p>
                        </div>
                      )}

                      <a 
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-3 text-[10px] font-display text-white bg-white/5 border border-white/10 px-4 py-2 rounded hover:bg-red-600 hover:border-red-600 transition-all tracking-widest uppercase group/link"
                      >
                        Launch Resource <ExternalLink className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function NotesSummarizer({ onBack, lang = 'en' }: FeatureProps) {
  const [text, setText] = React.useState('');
  const [fileName, setFileName] = React.useState('');
  const [fileData, setFileData] = React.useState<{data: string, mimeType: string} | null>(null);
  const [summaryData, setSummaryData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [summaryMode, setSummaryMode] = React.useState<'cheatsheet' | 'questions' | 'summary' | 'flashcards'>('summary');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = React.useState(false);

  const processFile = (file: File) => {
    setFileName(file.name);
    const reader = new FileReader();
    
    if (file.type === 'application/pdf') {
      reader.onload = (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        setFileData({ data: base64, mimeType: 'application/pdf' });
        setText('');
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('image/')) {
      reader.onload = (event) => {
        const base64 = (event.target?.result as string).split(',')[1];
        setFileData({ data: base64, mimeType: file.type });
        setText('');
      };
      reader.readAsDataURL(file);
    } else {
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setText(content);
        setFileData(null);
      };
      reader.readAsText(file);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleSummarize = async () => {
    if (!text.trim() && !fileData) return;
    setLoading(true);
    try {
      const model = "gemini-3-flash-preview";
      
      let prompt = "";
      let schema: any = {};

      switch(summaryMode) {
        case 'cheatsheet':
          prompt = "Create an emergency cheatsheet for an exam in 1 hour. Focus on the most critical formulas, terms, and definitions. Keep it extremely compressed.";
          schema = {
            type: Type.OBJECT,
            properties: {
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    term: { type: Type.STRING },
                    definition: { type: Type.STRING }
                  },
                  required: ["term", "definition"]
                }
              }
            },
            required: ["items"]
          };
          break;
        case 'questions':
          prompt = "Generate important exam questions and short answers for a student studying the night before. Focus on high-weightage topics and likely exam questions.";
          schema = {
            type: Type.OBJECT,
            properties: {
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    question: { type: Type.STRING },
                    answer: { type: Type.STRING }
                  },
                  required: ["question", "answer"]
                }
              }
            },
            required: ["questions"]
          };
          break;
        case 'summary':
          prompt = "Create a structured revision summary for a student with 2-3 days left. Organize into logical sections with key points and explanations.";
          schema = {
            type: Type.OBJECT,
            properties: {
              sections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    points: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["title", "points"]
                }
              }
            },
            required: ["sections"]
          };
          break;
        case 'flashcards':
          prompt = "Create a set of flashcards for deep study and spaced repetition. Each card should have a clear question/term on the front and a concise answer/definition on the back.";
          schema = {
            type: Type.OBJECT,
            properties: {
              cards: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    front: { type: Type.STRING },
                    back: { type: Type.STRING }
                  },
                  required: ["front", "back"]
                }
              }
            },
            required: ["cards"]
          };
          break;
      }

      const fullPrompt = `As an expert academic tutor, analyze the following study notes and provide a ${summaryMode} summary.
      
      INSTRUCTIONS:
      1. ${prompt}
      2. If there are any complex terms, explain them simply.
      3. Highlight any "Exam Alerts" (topics likely to be tested).
      
      NOTES CONTENT:
      ${text}`;

      const parts: any[] = [];
      if (fileData) {
        parts.push({
          inlineData: {
            data: fileData.data,
            mimeType: fileData.mimeType
          }
        });
      }
      parts.push({ text: fullPrompt });

      const response = await callGemini(model, [{ parts }], {
        responseMimeType: "application/json",
        responseSchema: schema
      });
      
      const result = JSON.parse(response.text || "{}");
      setSummaryData(result);
    } catch (error) {
      console.error("Error summarizing:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!summaryData) return;
    
    const doc = new jsPDF();
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const textWidth = pageWidth - (margin * 2);
    
    // Dark Background
    doc.setFillColor(2, 8, 20);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // LighthouseAI Header
    doc.setFontSize(10);
    doc.setTextColor(0, 245, 255);
    doc.setFont("helvetica", "bold");
    doc.text("LighthouseAI", pageWidth / 2, 10, { align: "center" });
    doc.setDrawColor(0, 245, 255);
    doc.line(margin, 12, pageWidth - margin, 12);

    doc.setFontSize(18);
    doc.setTextColor(0, 245, 255);
    doc.text(`Study Notes: ${summaryMode.toUpperCase()}`, margin, 22);
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, 30);
    
    let cursorY = 42;
    const lineHeight = 7;

    const addText = (text: string, isBold = false, isTitle = false) => {
      if (isBold) doc.setFont("helvetica", "bold");
      else doc.setFont("helvetica", "normal");
      
      if (isTitle) doc.setTextColor(0, 245, 255);
      else doc.setTextColor(232, 244, 255);

      const lines = doc.splitTextToSize(text, textWidth - 5);
      
      // Draw left border for items
      if (isTitle) {
        doc.setDrawColor(0, 245, 255);
        doc.setLineWidth(0.5);
        // We don't know the height yet, so we'll draw it after or estimate
      }

      for (const line of lines) {
        if (cursorY > pageHeight - margin) {
          doc.addPage();
          // Redraw background on new page
          doc.setFillColor(2, 8, 20);
          doc.rect(0, 0, pageWidth, pageHeight, 'F');
          cursorY = margin;
        }
        doc.text(line, margin + 5, cursorY);
        cursorY += lineHeight;
      }
      cursorY += 2;
    };

    if (summaryMode === 'cheatsheet') {
      summaryData.items?.forEach((it: any) => {
        const startY = cursorY - 5;
        addText(`${it.term}:`, true, true);
        addText(it.definition);
        doc.setDrawColor(0, 245, 255);
        doc.line(margin, startY, margin, cursorY - 2);
        cursorY += 4;
      });
    } else if (summaryMode === 'questions') {
      summaryData.questions?.forEach((q: any, i: number) => {
        const startY = cursorY - 5;
        addText(`Q${i+1}: ${q.question}`, true, true);
        addText(`A: ${q.answer}`);
        doc.setDrawColor(0, 245, 255);
        doc.line(margin, startY, margin, cursorY - 2);
        cursorY += 4;
      });
    } else if (summaryMode === 'summary') {
      summaryData.sections?.forEach((sec: any) => {
        const startY = cursorY - 5;
        addText(sec.title, true, true);
        sec.points?.forEach((p: string) => {
          addText(`• ${p}`);
        });
        doc.setDrawColor(0, 245, 255);
        doc.line(margin, startY, margin, cursorY - 2);
        cursorY += 6;
      });
    } else if (summaryMode === 'flashcards') {
      summaryData.cards?.forEach((c: any, i: number) => {
        const startY = cursorY - 5;
        addText(`Card ${i+1} Front: ${c.front}`, true, true);
        addText(`Card ${i+1} Back: ${c.back}`);
        doc.setDrawColor(0, 245, 255);
        doc.line(margin, startY, margin, cursorY - 2);
        cursorY += 6;
      });
    }
    
    doc.save(`${fileName ? fileName.split('.')[0] : 'summary'}_${summaryMode}.pdf`);
  };

  const modeConfig = {
    cheatsheet: { label: 'EXAM IN 1 HR', icon: Zap, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20', desc: 'Ultra-compressed cheatsheet' },
    questions: { label: '1 NIGHT BEFORE', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20', desc: 'Important questions & answers' },
    summary: { label: '2-3 DAYS LEFT', icon: FileText, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', desc: 'Structured revision summary' },
    flashcards: { label: '1 WEEK LEFT', icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20', desc: 'Flashcards for deep study' }
  };

  return (
    <div className="absolute inset-0 z-30 pt-[80px] px-4 sm:px-8 overflow-y-auto pb-20 bg-[#020814]/75 backdrop-blur-xl custom-scrollbar">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button onClick={onBack} className="flex items-center gap-2 text-cyan/60 hover:text-cyan transition-colors font-display text-[10px] uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" /> {lang === 'en' ? 'Back to Prediction' : 'भविष्यवाणी पर वापस जाएं'}
        </button>

        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-cyan/10 border border-cyan/20 flex items-center justify-center text-cyan">
            <FileText className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl sm:text-4xl text-white uppercase tracking-wider">{lang === 'en' ? 'Notes Summarizer' : 'नोट्स सारांश'}</h1>
            <p className="text-white/40 font-display text-[8px] sm:text-[10px] tracking-[2px] uppercase">{lang === 'en' ? 'AI-powered compression of your study material' : 'आपकी अध्ययन सामग्री का एआई-संचालित संपीड़न'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          <div className="space-y-6">
            <div className="glass-panel p-4 sm:p-6 rounded-xl border-white/5 space-y-4">
              <h2 className="font-display text-[10px] sm:text-[12px] text-cyan tracking-[3px] uppercase">1. Choose Situation</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(modeConfig).map(([id, cfg]) => (
                  <button
                    key={id}
                    onClick={() => setSummaryMode(id as any)}
                    className={`flex flex-col p-4 rounded-xl border transition-all text-left gap-2 group ${
                      summaryMode === id 
                        ? `${cfg.bg} ${cfg.border} border-opacity-100` 
                        : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <cfg.icon className={`w-5 h-5 ${summaryMode === id ? cfg.color : 'text-white/20'}`} />
                      <div className={`text-[8px] font-display tracking-widest uppercase px-2 py-0.5 rounded ${summaryMode === id ? cfg.bg + ' ' + cfg.color : 'bg-white/5 text-white/20'}`}>
                        {id === 'cheatsheet' ? 'Emergency' : id === 'questions' ? 'Night Before' : id === 'summary' ? 'Revision' : 'Deep Study'}
                      </div>
                    </div>
                    <div>
                      <div className={`font-display text-[10px] uppercase tracking-widest font-black ${summaryMode === id ? 'text-white' : 'text-white/40'}`}>{cfg.label}</div>
                      <div className="text-[8px] opacity-40 mt-1 leading-tight">{cfg.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-panel p-6 rounded-xl border-white/5 space-y-4">
              <h2 className="font-display text-[12px] text-cyan tracking-[3px] uppercase">2. Input Notes</h2>
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`w-full h-[140px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all group ${
                  isDragging ? 'border-cyan bg-cyan/10' : 'border-white/10 hover:border-cyan/30 hover:bg-cyan/5'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".txt,.md,.pdf,.png,.jpg,.jpeg"
                  className="hidden"
                />
                <Download className="w-6 h-6 text-cyan/40 group-hover:text-cyan group-hover:scale-110 transition-all rotate-180" />
                <div className="text-center px-4">
                  <p className="font-display text-[10px] text-white tracking-widest uppercase truncate max-w-[200px]">
                    {fileName ? fileName : 'Upload PDF or Image'}
                  </p>
                  <p className="text-[8px] text-white/40 mt-1 uppercase tracking-widest">OCR Supported</p>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-white/5"></div>
                </div>
                <div className="relative flex justify-center text-[8px] uppercase tracking-[4px] text-white/20">
                  <span className="bg-[#041020] px-4">OR PASTE TEXT</span>
                </div>
              </div>

              <textarea 
                placeholder="Paste your notes here..."
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (fileName) {
                    setFileName('');
                    setFileData(null);
                  }
                }}
                className="w-full h-[120px] bg-[#02060a]/40 border border-white/10 rounded-lg p-4 text-white text-sm outline-none focus:border-cyan/50 transition-all font-sans resize-none custom-scrollbar"
              />

              <button 
                onClick={handleSummarize}
                disabled={loading || (!text.trim() && !fileData)}
                className="w-full py-4 bg-cyan/10 border border-cyan/20 rounded-lg text-cyan font-display text-[12px] font-bold tracking-[2px] hover:bg-cyan/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <div className="w-4 h-4 border-2 border-cyan/30 border-t-cyan rounded-full animate-spin" /> : <Zap className="w-4 h-4" />}
                {loading ? 'PROCESSING...' : 'GENERATE SUMMARY'}
              </button>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-xl border-white/5 space-y-4 flex flex-col min-h-[600px]">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[12px] text-cyan tracking-[3px] uppercase">Synthesis Output</h2>
              {summaryData && (
                <div className="flex gap-4">
                  <button 
                    onClick={handleDownloadPDF}
                    className="text-[10px] font-display text-white/40 hover:text-cyan transition-colors uppercase tracking-widest flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" /> Download PDF
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 bg-[#02060a]/20 border border-white/5 rounded-lg p-6 overflow-y-auto custom-scrollbar">
              {!summaryData && !loading && (
                <div className="h-full flex flex-col items-center justify-center text-white/20 text-center p-8 space-y-4">
                  <div className="w-20 h-20 rounded-full border border-white/5 flex items-center justify-center animate-pulse">
                    <Brain className="w-10 h-10 opacity-20" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[3px] font-bold">Neural Core Ready</p>
                    <p className="text-[8px] uppercase tracking-[2px] opacity-40 mt-1">Select mode and provide notes to begin</p>
                  </div>
                </div>
              )}

              {loading && (
                <div className="h-full flex flex-col items-center justify-center space-y-6">
                  <div className="relative">
                    <div className="w-16 h-16 border-2 border-cyan/20 rounded-full animate-ping"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 border-2 border-cyan border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <p className="font-display text-[10px] text-cyan animate-pulse tracking-[4px] uppercase">Synthesizing Knowledge</p>
                    <p className="text-[8px] text-white/40 tracking-[2px] uppercase">Analyzing patterns & extracting core concepts</p>
                  </div>
                </div>
              )}

              {summaryData && (
                <div className="space-y-8 animate-in fade-in duration-500">
                  {summaryMode === 'cheatsheet' && (
                    <div className="grid grid-cols-1 gap-4">
                      {summaryData.items?.map((it: any, i: number) => (
                        <div key={i} className="bg-white/5 border-l-2 border-cyan p-4 rounded-r-lg">
                          <div className="font-display text-[10px] text-cyan uppercase tracking-widest mb-1">{it.term}</div>
                          <p className="text-sm text-white/80 leading-relaxed">{it.definition}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {summaryMode === 'questions' && (
                    <div className="space-y-6">
                      {summaryData.questions?.map((q: any, i: number) => (
                        <div key={i} className="bg-white/5 border-l-2 border-cyan p-4 rounded-r-lg group">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded bg-cyan/10 border border-cyan/20 flex items-center justify-center text-[10px] font-display text-cyan shrink-0 mt-1">Q{i+1}</div>
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-white group-hover:text-cyan transition-colors">{q.question}</p>
                              <div className="bg-black/20 p-4 rounded-lg border border-white/5">
                                <p className="text-xs text-white/60 leading-relaxed italic">A: {q.answer}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {summaryMode === 'summary' && (
                    <div className="space-y-8">
                      {summaryData.sections?.map((sec: any, i: number) => (
                        <div key={i} className="bg-white/5 border-l-2 border-cyan p-6 rounded-r-lg space-y-4">
                          <div className="flex items-center gap-3">
                            <h3 className="font-display text-[12px] text-cyan tracking-[2px] uppercase">{sec.title}</h3>
                            <div className="flex-1 h-px bg-cyan/20"></div>
                          </div>
                          <ul className="space-y-3">
                            {sec.points?.map((p: string, pi: number) => (
                              <li key={pi} className="flex gap-3 text-sm text-white/70 leading-relaxed">
                                <span className="text-cyan mt-1.5 shrink-0 w-1 h-1 rounded-full bg-cyan"></span>
                                {p}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}

                  {summaryMode === 'flashcards' && (
                    <div className="grid grid-cols-1 gap-4">
                      {summaryData.cards?.map((c: any, i: number) => (
                        <div key={i} className="bg-white/5 border-l-2 border-cyan rounded-r-lg p-6 hover:bg-cyan/5 transition-all cursor-pointer group">
                          <div className="text-[8px] font-display text-cyan/60 uppercase tracking-[3px] mb-4">Flashcard #{i+1}</div>
                          <div className="space-y-4">
                            <div className="font-display text-xs text-white tracking-wide leading-relaxed">{c.front}</div>
                            <div className="pt-4 border-t border-white/5">
                              <p className="text-xs text-white/50 leading-relaxed italic">{c.back}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function StudyRoadmap({ onBack, lang = 'en' }: FeatureProps) {
  const [examDate, setExamDate] = React.useState('');
  const [studyHours, setStudyHours] = React.useState('4');
  const [subjects, setSubjects] = React.useState<string[]>([]);
  const [subInput, setSubInput] = React.useState('');
  const [syllabus, setSyllabus] = React.useState('');
  const [intensity, setIntensity] = React.useState('balanced');
  const [loading, setLoading] = React.useState(false);
  const [loadMsg, setLoadMsg] = React.useState('GENERATING YOUR STUDY ROADMAP...');
  const [roadmapData, setRoadmapData] = React.useState<any>(null);
  const [daysLeft, setDaysLeft] = React.useState<number | null>(null);

  const LOAD_MSGS = [
    'GENERATING YOUR STUDY ROADMAP...',
    'ANALYZING YOUR SUBJECTS...',
    'BUILDING DAY-BY-DAY MISSIONS...',
    'CALCULATING OPTIMAL SEQUENCE...',
    'FINALIZING YOUR BATTLE PLAN...'
  ];

  React.useEffect(() => {
    if (examDate) {
      const diff = Math.ceil((new Date(examDate).getTime() - new Date().getTime()) / 86400000);
      setDaysLeft(diff);
    } else {
      setDaysLeft(null);
    }
  }, [examDate]);

  const addSubject = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = subInput.trim().replace(/,$/, '');
      if (val && !subjects.includes(val)) {
        setSubjects([...subjects, val]);
      }
      setSubInput('');
    }
  };

  const removeSubject = (index: number) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const generateRoadmap = async () => {
    if (!examDate || subjects.length === 0 || (daysLeft !== null && daysLeft <= 0)) return;
    
    setLoading(true);
    setRoadmapData(null);
    
    let msgIndex = 0;
    const interval = setInterval(() => {
      setLoadMsg(LOAD_MSGS[msgIndex % LOAD_MSGS.length]);
      msgIndex++;
    }, 1000);

    try {
      const model = "gemini-3-flash-preview";
      const prompt = `Create a day-by-day study roadmap for a student.
Exam date: ${examDate} (${daysLeft} days from today)
Subjects: ${subjects.join(', ')}
Daily study hours: ${studyHours} hours
Intensity: ${intensity}
Syllabus/topics: ${syllabus || 'General syllabus'}

Return ONLY valid JSON, no markdown:
{
  "totalDays": ${daysLeft},
  "phases": [
    {
      "name": "Phase name",
      "type": "foundation|intense|revision|final",
      "days": [
        {
          "day": 1,
          "date": "Day 1 — Mon 24 Mar",
          "title": "Short catchy title",
          "type": "foundation|intense|revision|final|rest",
          "tasks": ["Task 1 (1 hr)", "Task 2 (1 hr)", "Task 3 (30 min)"],
          "tip": "One short motivational tip or study tip",
          "hours": ${studyHours}
        }
      ]
    }
  ]
}
Make it realistic with ${daysLeft} total days. Every 6-7 days add a rest/revision day. Tasks should be specific and time-boxed. Max 4 tasks per day.`;

      const response = await callGemini(model, [{ parts: [{ text: prompt }] }], { 
        responseMimeType: "application/json"
      });

      let text = response.text || "{}";
      text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
      const data = JSON.parse(text);
      setRoadmapData(data);
    } catch (error) {
      console.error("Error generating roadmap:", error);
      // Fallback logic
      const fallback = buildFallback(daysLeft || 7, examDate);
      setRoadmapData(fallback);
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  };

  const handleDownloadRoadmapPDF = () => {
    if (!roadmapData) return;
    
    const doc = new jsPDF();
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const textWidth = pageWidth - (margin * 2);
    
    // Dark Background
    doc.setFillColor(2, 8, 20);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // LighthouseAI Header
    doc.setFontSize(10);
    doc.setTextColor(0, 245, 255);
    doc.setFont("helvetica", "bold");
    doc.text("LighthouseAI", pageWidth / 2, 10, { align: "center" });
    doc.setDrawColor(0, 245, 255);
    doc.line(margin, 12, pageWidth - margin, 12);

    doc.setFontSize(18);
    doc.setTextColor(0, 245, 255);
    doc.text("STUDY ROADMAP", margin, 22);
    
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, 30);
    doc.text(`Subjects: ${subjects.join(', ')}`, margin, 35);
    doc.text(`Days: ${daysLeft} | Mode: ${intensity.toUpperCase()}`, margin, 40);
    
    let cursorY = 50;
    const lineHeight = 7;

    const checkPageBreak = (needed: number) => {
      if (cursorY + needed > pageHeight - margin) {
        doc.addPage();
        doc.setFillColor(2, 8, 20);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
        cursorY = 20;
      }
    };

    roadmapData.phases?.forEach((phase: any) => {
      checkPageBreak(15);
      doc.setFontSize(14);
      doc.setTextColor(0, 245, 255);
      doc.setFont("helvetica", "bold");
      doc.text(phase.name.toUpperCase(), margin, cursorY);
      cursorY += 10;

      phase.days?.forEach((day: any) => {
        const tasksHeight = (day.tasks?.length || 0) * lineHeight + 15;
        checkPageBreak(tasksHeight);

        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.text(`${day.date || `Day ${day.day}`}: ${day.title}`, margin, cursorY);
        cursorY += 7;

        doc.setFontSize(10);
        doc.setTextColor(200, 200, 200);
        doc.setFont("helvetica", "normal");
        day.tasks?.forEach((task: string) => {
          const lines = doc.splitTextToSize(`• ${task}`, textWidth - 10);
          lines.forEach((line: string) => {
            checkPageBreak(lineHeight);
            doc.text(line, margin + 5, cursorY);
            cursorY += lineHeight;
          });
        });

        if (day.tip) {
          checkPageBreak(lineHeight + 5);
          doc.setFontSize(9);
          doc.setTextColor(0, 245, 255);
          doc.setFont("helvetica", "italic");
          doc.text(`Tip: ${day.tip}`, margin + 5, cursorY);
          cursorY += lineHeight + 5;
        }
        cursorY += 5;
      });
      cursorY += 10;
    });

    doc.save(`Study_Roadmap_${new Date().getTime()}.pdf`);
  };

  const buildFallback = (days: number, date: string) => {
    const phases: any[] = [];
    const subCycle = subjects.length > 0 ? subjects : ['Study Session'];
    let dayCount = 1;
    const phaseNames = [
      { name: 'Foundation Phase', type: 'foundation' },
      { name: 'Intensive Phase', type: 'intense' },
      { name: 'Revision Phase', type: 'revision' },
      { name: 'Final Sprint', type: 'final' }
    ];
    const daysPerPhase = Math.max(1, Math.floor(days / 4));

    phaseNames.forEach((ph, pi) => {
      const phaseDays: any[] = [];
      const start = dayCount;
      const end = Math.min(start + daysPerPhase - 1, days);
      for (let d = start; d <= end; d++) {
        const isRest = (d - start) % 7 === 6;
        const sub = subCycle[(d - 1) % subCycle.length];
        phaseDays.push({
          day: d,
          date: `Day ${d}`,
          title: isRest ? 'Rest & Review Day' : `${sub} — ${ph.name.split(' ')[0]} Focus`,
          type: isRest ? 'rest' : ph.type,
          tasks: isRest ?
            ['📖 Review notes from this week', '✅ Solve 5 practice problems', '😴 Rest and recharge'] :
            [`📚 Study ${sub} core concepts (1.5 hrs)`, `📝 Make notes & formulas`, `🧠 Solve practice questions`, `✅ Quick self-test`],
          tip: isRest ? 'Rest is part of the plan — your brain needs it!' : 'Consistency beats intensity every time.',
          hours: isRest ? 2 : parseInt(studyHours) || 4
        });
        dayCount++;
      }
      if (phaseDays.length > 0) phases.push({ name: ph.name, type: ph.type, days: phaseDays });
    });
    return { totalDays: days, phases };
  };

  const PHASE_COLORS: any = {
    foundation: { badge: 'bg-cyan/10 text-cyan border-cyan/30', card: 'border-cyan/30', dot: 'bg-cyan' },
    intense: { badge: 'bg-amber-500/10 text-amber-500 border-amber-500/30', card: 'border-amber-500/30', dot: 'bg-amber-500' },
    revision: { badge: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30', card: 'border-emerald-500/30', dot: 'bg-emerald-500' },
    final: { badge: 'bg-rose-500/10 text-rose-500 border-rose-500/30', card: 'border-rose-500/30', dot: 'bg-rose-500' },
    rest: { badge: 'bg-purple-500/10 text-purple-500 border-purple-500/30', card: 'border-purple-500/30 border-dashed', dot: 'bg-purple-500' },
  };

  const getDaysLeftLabel = () => {
    if (daysLeft === null) return '';
    if (daysLeft < 0) return 'PAST DATE';
    if (daysLeft === 0) return 'TODAY! 😱';
    if (daysLeft <= 3) return `${daysLeft}D LEFT 🔥`;
    if (daysLeft <= 7) return `${daysLeft}D LEFT ⚡`;
    return `${daysLeft} DAYS LEFT`;
  };

  const getDaysLeftColor = () => {
    if (daysLeft === null) return 'text-white/40';
    if (daysLeft <= 3) return 'text-rose-500';
    if (daysLeft <= 7) return 'text-amber-500';
    return 'text-emerald-500';
  };

  return (
    <div className="absolute inset-0 z-30 pt-[80px] px-4 sm:px-8 overflow-y-auto pb-20 bg-[#020814]/75 backdrop-blur-xl custom-scrollbar font-exo">
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button onClick={onBack} className="flex items-center gap-2 text-cyan/60 hover:text-cyan transition-colors font-orbitron text-[10px] uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" /> {lang === 'en' ? 'Back to Prediction' : 'भविष्यवाणी पर वापस जाएं'}
        </button>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan/10 border border-cyan/20 flex items-center justify-center text-2xl shadow-[0_0_16px_rgba(0,245,255,0.1)]">
            🗺️
          </div>
          <div>
            <h1 className="font-orbitron font-black text-3xl text-cyan tracking-[2px] text-glow-cyan uppercase">STUDY ROADMAP</h1>
            <p className="text-white/40 font-orbitron text-[9px] tracking-[3px] uppercase mt-1">◈ YOUR PERSONALIZED DAY-BY-DAY BATTLE PLAN ◈</p>
          </div>
        </div>

        {!roadmapData && !loading && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="glass-panel rounded-xl p-6 sm:p-8 border-cyan/20 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan to-transparent" />
              <div className="flex items-center gap-2 mb-6 font-orbitron text-[10px] text-cyan tracking-[3px] uppercase">
                <span>◈</span> Mission Details
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="font-orbitron text-[9px] text-white/40 tracking-[2px] uppercase">⏰ Exam / D-Day</label>
                  <div className="relative">
                    <input 
                      type="date" 
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className={`w-full bg-cyan/5 border rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-cyan focus:shadow-[0_0_12px_rgba(0,245,255,0.1)] transition-all ${daysLeft !== null && daysLeft <= 7 ? 'border-amber-500/40 text-amber-500' : 'border-cyan/20'}`}
                    />
                    <div className={`absolute right-4 top-1/2 -translate-y-1/2 font-orbitron text-[9px] font-bold tracking-[1px] pointer-events-none ${getDaysLeftColor()}`}>
                      {getDaysLeftLabel()}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-orbitron text-[9px] text-white/40 tracking-[2px] uppercase">📚 Daily Study Hours</label>
                  <select 
                    value={studyHours}
                    onChange={(e) => setStudyHours(e.target.value)}
                    className="w-full bg-[#020814] border border-cyan/20 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-cyan focus:shadow-[0_0_12px_rgba(0,245,255,0.1)] transition-all appearance-none cursor-pointer"
                  >
                    <option value="1" className="bg-[#020814] text-white">1 Hour/day — Minimal</option>
                    <option value="2" className="bg-[#020814] text-white">2 Hours/day — Light</option>
                    <option value="3" className="bg-[#020814] text-white">3 Hours/day — Moderate</option>
                    <option value="4" className="bg-[#020814] text-white">4 Hours/day — Solid</option>
                    <option value="5" className="bg-[#020814] text-white">5 Hours/day — Serious</option>
                    <option value="6" className="bg-[#020814] text-white">6 Hours/day — Beast Mode</option>
                    <option value="8" className="bg-[#020814] text-white">8 Hours/day — Full Send 🔥</option>
                  </select>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="font-orbitron text-[9px] text-white/40 tracking-[2px] uppercase">📖 Subjects to Conquer</label>
                  <div className="flex flex-wrap gap-2 p-3 bg-cyan/5 border border-cyan/20 rounded-lg min-h-[52px] items-center">
                    {subjects.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 bg-cyan/15 border border-cyan/30 rounded-full px-3 py-1 font-orbitron text-[9px] text-cyan">
                        {s}
                        <button onClick={() => removeSubject(i)} className="hover:text-white transition-colors text-[12px]">×</button>
                      </div>
                    ))}
                    <input 
                      type="text"
                      value={subInput}
                      onChange={(e) => setSubInput(e.target.value)}
                      onKeyDown={addSubject}
                      placeholder={subjects.length === 0 ? "Type subject and press Enter — e.g. Mathematics, Physics..." : ""}
                      className="flex-1 min-w-[150px] bg-transparent border-none outline-none text-white text-sm placeholder:text-white/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-xl p-6 sm:p-8 border-cyan/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="font-orbitron text-[9px] text-white/40 tracking-[2px] uppercase">📄 Syllabus / Topics (optional)</label>
                  <textarea 
                    value={syllabus}
                    onChange={(e) => setSyllabus(e.target.value)}
                    placeholder="Paste your syllabus or specific topics here... e.g. Chapter 1-5, Integration, Newton's Laws, Organic Chemistry..."
                    className="w-full h-[120px] bg-cyan/5 border border-cyan/20 rounded-lg p-4 text-white text-sm outline-none focus:border-cyan focus:shadow-[0_0_12px_rgba(0,245,255,0.1)] transition-all resize-none custom-scrollbar"
                  />
                </div>

                <div className="space-y-2">
                  <label className="font-orbitron text-[9px] text-white/40 tracking-[2px] uppercase">⚡ Study Intensity Mode</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'chill', icon: '😌', name: 'CHILL', desc: 'Relaxed pace' },
                      { id: 'balanced', icon: '⚖️', name: 'BALANCED', desc: 'Sustainable' },
                      { id: 'grind', icon: '🔥', name: 'GRIND', desc: 'Max output' }
                    ].map((mode) => (
                      <button
                        key={mode.id}
                        onClick={() => setIntensity(mode.id)}
                        className={`p-3 rounded-xl border-2 transition-all text-center space-y-1 group ${
                          intensity === mode.id 
                            ? 'border-cyan bg-cyan/15 shadow-[0_0_16px_rgba(0,245,255,0.1)]' 
                            : 'border-cyan/20 bg-cyan/5 hover:bg-cyan/10'
                        }`}
                      >
                        <span className="text-xl block">{mode.icon}</span>
                        <div className="font-orbitron text-[9px] font-bold text-white tracking-[1px]">{mode.name}</div>
                        <div className="text-[10px] text-white/40 leading-tight">{mode.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={generateRoadmap}
              disabled={!examDate || subjects.length === 0 || (daysLeft !== null && daysLeft <= 0)}
              className="w-full py-5 bg-gradient-to-r from-cyan/20 to-blue-600/20 border border-cyan rounded-xl text-cyan font-orbitron text-[13px] font-bold tracking-[3px] uppercase hover:bg-cyan/30 hover:shadow-[0_0_32px_rgba(0,245,255,0.3)] transition-all disabled:opacity-30 disabled:cursor-not-allowed relative overflow-hidden group slanted-clip"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              🗺️ GENERATE MY BATTLE PLAN
            </button>
          </div>
        )}

        {loading && (
          <div className="py-20 text-center space-y-6 animate-in fade-in duration-500">
            <div className="w-16 h-16 border-2 border-cyan/20 border-t-cyan rounded-full animate-spin mx-auto" />
            <div className="font-orbitron text-[11px] text-cyan tracking-[3px] animate-pulse uppercase">
              {loadMsg}
            </div>
          </div>
        )}

        {roadmapData && !loading && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h2 className="font-orbitron text-2xl font-black text-cyan tracking-[2px] uppercase">⚡ YOUR BATTLE PLAN</h2>
                  <p className="font-orbitron text-[9px] text-white/40 tracking-[2px] uppercase mt-1">
                    ◈ {subjects.join(' · ')} · {daysLeft} DAYS · {intensity.toUpperCase()} MODE
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={handleDownloadRoadmapPDF}
                    className="px-6 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-[9px] font-orbitron text-emerald-500 font-bold tracking-[2px] uppercase hover:bg-emerald-500/20 transition-all flex items-center gap-2"
                  >
                    <Download className="w-3 h-3" /> PDF
                  </button>
                  <button 
                    onClick={() => setRoadmapData(null)}
                    className="px-6 py-2 bg-cyan/10 border border-cyan/30 rounded-lg text-[9px] font-orbitron text-cyan font-bold tracking-[2px] uppercase hover:bg-cyan/20 transition-all"
                  >
                    ↺ NEW PLAN
                  </button>
                </div>
              </div>

            <div className="space-y-2">
              <div className="flex justify-between font-orbitron text-[9px] tracking-[2px] uppercase">
                <span className="text-white/40">OVERALL PROGRESS</span>
                <span className="text-cyan">0%</span>
              </div>
              <div className="h-1 bg-cyan/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '0%' }}
                  className="h-full bg-gradient-to-r from-cyan to-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-12">
              {roadmapData.phases?.map((phase: any, pi: number) => (
                <div key={pi} className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className={`px-4 py-1.5 rounded-full font-orbitron text-[9px] font-bold tracking-[2px] uppercase border ${PHASE_COLORS[phase.type]?.badge || PHASE_COLORS.foundation.badge}`}>
                      {phase.name}
                    </div>
                    <div className="flex-1 h-[1px] bg-white/5" />
                    <div className="font-orbitron text-[11px] text-white/40 uppercase tracking-widest">{phase.days?.length} DAYS</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {phase.days?.map((day: any, di: number) => {
                      const colors = PHASE_COLORS[day.type] || PHASE_COLORS.foundation;
                      return (
                        <div 
                          key={di} 
                          className={`glass-panel rounded-2xl p-6 border-t-2 transition-all hover:-translate-y-1 hover:shadow-xl ${colors.card} ${day.type === 'rest' ? 'opacity-70' : ''}`}
                        >
                          <div className="flex justify-between items-center mb-4">
                            <div className="font-orbitron text-[11px] font-bold text-cyan tracking-[1px]">{day.date || `DAY ${day.day}`}</div>
                            <div className={`font-orbitron text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${colors.badge}`}>
                              {day.type}
                            </div>
                          </div>
                          <h4 className="font-orbitron text-[11px] font-bold text-white mb-4 tracking-wide">{day.title}</h4>
                          <div className="space-y-2 mb-4">
                            {day.tasks?.map((task: string, ti: number) => (
                              <div key={ti} className="flex gap-3 text-[12px] text-white/70 leading-relaxed">
                                <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${colors.dot}`} />
                                <span>{task}</span>
                              </div>
                            ))}
                          </div>
                          {day.tip && (
                            <div className="pt-3 border-t border-white/5 font-orbitron text-[8px] text-white/40 tracking-[1px] italic">
                              💡 {day.tip}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function TimetableGenerator({ onBack, lang = 'en' }: FeatureProps) {
  const [viewMode, setViewMode] = React.useState<'generate' | 'saved'>('generate');
  const [step, setStep] = React.useState(0);
  const [formData, setFormData] = React.useState({
    wakeTime: '06:00 AM',
    sleepTime: '10:00 PM',
    subjects: ['Mathematics', 'Physics'],
    preferences: '',
    breakDuration: '20 mins',
    studySessionMax: '90 mins'
  });
  const [loading, setLoading] = React.useState(false);
  const [timetable, setTimetable] = React.useState<any[]>([]);
  const [savedTimetables, setSavedTimetables] = React.useState<any[]>([]);
  const [activeTimetableId, setActiveTimetableId] = React.useState<string | null>(null);
  const [currentTime, setCurrentTime] = React.useState(new Date());
  
  // Timer State
  const [showTimer, setShowTimer] = React.useState(false);
  const [timerMode, setTimerMode] = React.useState<'normal' | 'pomodoro'>('normal');
  const [timerSlot, setTimerSlot] = React.useState<any>(null);
  const [timeLeft, setTimeLeft] = React.useState(0);
  const [isTimerRunning, setIsTimerRunning] = React.useState(false);
  const [pomodoroPhase, setPomodoroPhase] = React.useState<'work' | 'break' | 'long-break'>('work');
  const [pomodoroConfig, setPomodoroConfig] = React.useState({ work: 25, break: 5, longBreak: 15 });
  const [sessionsDone, setSessionsDone] = React.useState(0);
  const [totalFocusMins, setTotalFocusMins] = React.useState(0);
  const [streak, setStreak] = React.useState(0);
  const [showMusicPanel, setShowMusicPanel] = React.useState(false);
  const [currentPlaylist, setCurrentPlaylist] = React.useState('lofi');
  const [notification, setNotification] = React.useState<string | null>(null);
  const [totalSecs, setTotalSecs] = React.useState(25 * 60);

  // Load saved timetables
  React.useEffect(() => {
    const saved = localStorage.getItem('saved_timetables');
    if (saved) {
      try {
        setSavedTimetables(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved timetables", e);
      }
    }
  }, []);

  // Update current time every second for status tracking and timer auto-stop
  React.useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Timer Logic
  React.useEffect(() => {
    let interval: any;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft <= 0 && isTimerRunning) {
      if (timerMode === 'pomodoro') {
        if (pomodoroPhase === 'work') {
          setSessionsDone(prev => prev + 1);
          setTotalFocusMins(prev => prev + pomodoroConfig.work);
          setStreak(prev => prev + 1);
          
          const nextPhase = (sessionsDone + 1) % 4 === 0 ? 'long-break' : 'break';
          setPomodoroPhase(nextPhase);
          const nextTime = nextPhase === 'long-break' ? pomodoroConfig.longBreak : pomodoroConfig.break;
          setTimeLeft(nextTime * 60);
          setTotalSecs(nextTime * 60);
          showNotif(nextPhase === 'long-break' ? '🎉 4 SESSIONS COMPLETE! TAKE A LONG BREAK!' : '🎉 FOCUS SESSION COMPLETE! TAKE A BREAK!');
        } else {
          setPomodoroPhase('work');
          setTimeLeft(pomodoroConfig.work * 60);
          setTotalSecs(pomodoroConfig.work * 60);
          showNotif('⚡ BREAK OVER — TIME TO FOCUS!');
        }
      } else {
        setIsTimerRunning(false);
        setTimeLeft(0);
        showNotif('✅ SESSION COMPLETE!');
      }
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft, timerMode, pomodoroPhase, pomodoroConfig, sessionsDone]);

  const showNotif = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Auto-stop timer when slot ends
  React.useEffect(() => {
    if (isTimerRunning && timerSlot) {
      const index = timetable.findIndex(s => s.time === timerSlot.time && s.activity === timerSlot.activity);
      if (index !== -1) {
        const nextSlot = timetable[index + 1];
        const end = nextSlot ? parseTime(nextSlot.time) : new Date(parseTime(timerSlot.time).getTime() + 60 * 60 * 1000);
        
        if (new Date() >= end) {
          setIsTimerRunning(false);
          setTimeLeft(0);
        }
      }
    }
  }, [currentTime, isTimerRunning, timerSlot, timetable]);

  const parseTime = (timeStr: string) => {
    try {
      if (!timeStr) return new Date();
      const parts = timeStr.trim().split(/\s+/);
      let time = parts[0];
      let modifier = parts[1];

      // Handle "06:00AM" format
      if (!modifier) {
        const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (match) {
          time = `${match[1]}:${match[2]}`;
          modifier = match[3].toUpperCase();
        }
      }

      let [hours, minutes] = time.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) return new Date();

      if (modifier === 'PM' && hours < 12) hours += 12;
      if (modifier === 'AM' && hours === 12) hours = 0;
      
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    } catch (e) {
      console.error("Error parsing time:", timeStr, e);
      return new Date();
    }
  };

  const getSlotStatus = (startTimeStr: string, nextStartTimeStr?: string) => {
    const start = parseTime(startTimeStr);
    const now = currentTime;
    
    if (now < start) return 'upcoming';
    
    if (nextStartTimeStr) {
      const end = parseTime(nextStartTimeStr);
      if (now >= start && now < end) return 'current';
      return 'missed';
    }
    
    // Last slot: check if it's within 2 hours or before sleep
    const diffHours = (now.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (diffHours > 2) return 'missed';
    return 'current';
  };

  const saveTimetable = (slots: any[]) => {
    const newTimetable = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString(),
      slots,
      formData: { ...formData }
    };
    const updated = [newTimetable, ...savedTimetables];
    setSavedTimetables(updated);
    localStorage.setItem('saved_timetables', JSON.stringify(updated));
    setActiveTimetableId(newTimetable.id);
    setTimetable(slots);
  };

  const deleteTimetable = (id: string) => {
    const updated = savedTimetables.filter(t => t.id !== id);
    setSavedTimetables(updated);
    localStorage.setItem('saved_timetables', JSON.stringify(updated));
    if (activeTimetableId === id) {
      setActiveTimetableId(null);
      setTimetable([]);
    }
  };

  const startTimer = (slot: any, mode: 'normal' | 'pomodoro') => {
    try {
      console.log("startTimer called with:", { slot, mode });
      if (!slot) {
        console.error("startTimer: slot is null or undefined");
        return;
      }
      setTimerSlot(slot);
      setTimerMode(mode);
      setShowTimer(true);
      setIsTimerRunning(true);
      console.log("State updates triggered: showTimer=true, isTimerRunning=true");
      
      if (mode === 'pomodoro') {
        setPomodoroPhase('work');
        const secs = pomodoroConfig.work * 60;
        setTimeLeft(secs);
        setTotalSecs(secs);
      } else {
        const index = timetable.findIndex(s => s.time === slot.time && s.activity === slot.activity);
        console.log("Slot index in timetable:", index);
        const start = parseTime(slot.time);
        const nextSlot = timetable[index + 1];
        const end = nextSlot ? parseTime(nextSlot.time) : new Date(start.getTime() + 60 * 60 * 1000);
        
        const now = new Date();
        if (now >= start && now < end) {
          const remaining = Math.floor((end.getTime() - now.getTime()) / 1000);
          const total = Math.floor((end.getTime() - start.getTime()) / 1000);
          console.log("Calculating remaining time in current slot:", remaining);
          setTimeLeft(remaining > 0 ? remaining : 0);
          setTotalSecs(total > 0 ? total : 60 * 60);
        } else {
          const duration = Math.floor((end.getTime() - start.getTime()) / 1000);
          console.log("Calculating full slot duration:", duration);
          const secs = duration > 0 ? duration : 60 * 60;
          setTimeLeft(secs);
          setTotalSecs(secs);
        }
      }
    } catch (e) {
      console.error("CRITICAL ERROR in startTimer:", e);
    }
  };

  const formatTimeLeft = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const steps = [
    {
      title: "Daily Cycle",
      description: "When does your day begin and end?",
      fields: (
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-display text-white/40 uppercase tracking-widest">Wake Up Time</label>
            <select 
              value={formData.wakeTime}
              onChange={(e) => setFormData({...formData, wakeTime: e.target.value})}
              className="w-full bg-[#02060a]/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-cyan/50 transition-all font-sans"
            >
              {["04:00 AM", "04:30 AM", "05:00 AM", "05:30 AM", "06:00 AM", "06:30 AM", "07:00 AM", "07:30 AM", "08:00 AM", "08:30 AM", "09:00 AM"].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-display text-white/40 uppercase tracking-widest">Sleep Time</label>
            <select 
              value={formData.sleepTime}
              onChange={(e) => setFormData({...formData, sleepTime: e.target.value})}
              className="w-full bg-[#02060a]/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-cyan/50 transition-all font-sans"
            >
              {["09:00 PM", "09:30 PM", "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM", "12:00 AM", "12:30 AM", "01:00 AM"].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      )
    },
    {
      title: "Academic Focus",
      description: "What are we conquering today?",
      fields: (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-display text-white/40 uppercase tracking-widest">Subjects (Comma separated)</label>
            <input 
              type="text"
              placeholder="e.g. Math, Physics, Chemistry..."
              value={formData.subjects.join(', ')}
              onChange={(e) => setFormData({...formData, subjects: e.target.value.split(',').map(s => s.trim())})}
              className="w-full bg-[#02060a]/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-cyan/50 transition-all font-sans"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-display text-white/40 uppercase tracking-widest">Priorities / Constraints</label>
            <textarea 
              placeholder="e.g. I'm weak in Math, I have a test in Physics tomorrow, I have classes from 10am to 2pm..."
              value={formData.preferences}
              onChange={(e) => setFormData({...formData, preferences: e.target.value})}
              className="w-full h-32 bg-[#02060a]/40 border border-white/10 rounded-lg p-4 text-white text-sm outline-none focus:border-cyan/50 transition-all font-sans resize-none"
            />
          </div>
        </div>
      )
    },
    {
      title: "Rhythm & Pace",
      description: "Customize your focus and recovery blocks.",
      fields: (
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-display text-white/40 uppercase tracking-widest">Max Study Session</label>
            <select 
              value={formData.studySessionMax}
              onChange={(e) => setFormData({...formData, studySessionMax: e.target.value})}
              className="w-full bg-[#02060a]/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-cyan/50 transition-all font-sans"
            >
              {["45 mins", "60 mins", "90 mins", "120 mins"].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-display text-white/40 uppercase tracking-widest">Break Duration</label>
            <select 
              value={formData.breakDuration}
              onChange={(e) => setFormData({...formData, breakDuration: e.target.value})}
              className="w-full bg-[#02060a]/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-cyan/50 transition-all font-sans"
            >
              {["10 mins", "15 mins", "20 mins", "30 mins"].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
      )
    }
  ];

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const model = "gemini-3-flash-preview";
      const prompt = `Create a high-performance daily study timetable.
      
      STUDENT PROFILE:
      - Wake Time: ${formData.wakeTime}
      - Sleep Time: ${formData.sleepTime}
      - Subjects: ${formData.subjects.join(', ')}
      - Constraints/Priorities: ${formData.preferences || "None"}
      - Preferred Session Length: ${formData.studySessionMax}
      - Preferred Break Length: ${formData.breakDuration}

      INTELLIGENT REQUIREMENTS:
      1. PRIORITIZE: Based on the constraints, decide which subjects need more time or earlier slots (when brain is fresh).
      2. DYNAMIC BREAKS: Suggest DIFFERENT activities for each break (e.g., stretching, quick walk, snack, meditation, power nap).
      3. REALISM: Account for meals (Breakfast, Lunch, Dinner) and morning routine.
      4. OUTPUT: Return ONLY a JSON object with a "slots" array. 
         Each slot: {"time": "HH:MM AM/PM", "activity": "...", "type": "study"|"break"|"meal"|"routine"|"sleep", "priority": "high"|"medium"|"low"}.`;

      const response = await callGemini(model, [{ parts: [{ text: prompt }] }], {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            slots: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.STRING },
                  activity: { type: Type.STRING },
                  type: { type: Type.STRING },
                  priority: { type: Type.STRING }
                },
                required: ["time", "activity", "type", "priority"]
              }
            }
          },
          required: ["slots"]
        }
      });

      let text = response.text || "{}";
      text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
      const data = JSON.parse(text);
      const slots = data.slots || [];
      saveTimetable(slots);
      setStep(3); // Result step
    } catch (error) {
      console.error("Error generating timetable:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Timer Overlay */}
      {showTimer && (
        <div className="fixed inset-0 z-[1000] bg-[#020814] overflow-hidden flex flex-col items-center justify-center p-8">
          {/* Space Background */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="stars1 absolute inset-0" />
            <div className="stars2 absolute inset-0" />
            <div className="nebula absolute inset-0" />
            <div className="shoot absolute top-[20%] left-[-5%]" />
            <div className="shoot absolute top-[60%] left-[-5%] [animation-delay:3s] [animation-duration:11s]" />
            <div className="shoot absolute top-[40%] left-[-5%] [animation-delay:6s] [animation-duration:9s]" />
          </div>

          {/* Notification */}
          {notification && (
            <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-cyan/15 border border-cyan/35 rounded-full px-6 py-2.5 font-orbitron text-[10px] text-cyan tracking-[2px] z-[1100] animate-in fade-in slide-in-from-top-4 duration-300">
              {notification}
            </div>
          )}

          <button 
            onClick={() => setShowTimer(false)}
            className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors z-[1010]"
          >
            <X className="w-8 h-8" />
          </button>
          
          <div className="relative z-[1005] flex flex-col items-center w-full max-w-2xl">
            <div className="font-orbitron text-[11px] text-cyan/50 tracking-[6px] uppercase mb-6">◈ LighthouseAI Focus Timer ◈</div>

            {/* Mode Tabs */}
            <div className="flex gap-1 bg-white/5 border border-white/10 rounded-full p-1 mb-10">
              {[
                { id: 'work', label: 'FOCUS' },
                { id: 'break', label: 'SHORT BREAK' },
                { id: 'long-break', label: 'LONG BREAK' }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => {
                    setPomodoroPhase(m.id as any);
                    const secs = m.id === 'work' ? pomodoroConfig.work * 60 : 
                                m.id === 'break' ? pomodoroConfig.break * 60 : 
                                pomodoroConfig.longBreak * 60;
                    setTimeLeft(secs);
                    setTotalSecs(secs);
                    setIsTimerRunning(false);
                  }}
                  className={`px-5 py-2 rounded-full font-orbitron text-[9px] font-semibold tracking-[2px] transition-all ${
                    pomodoroPhase === m.id ? 'bg-cyan/15 text-cyan shadow-[0_0_16px_rgba(0,245,255,0.2)]' : 'text-cyan/50 hover:text-cyan/80'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Timer Ring */}
            <div className="relative w-[280px] h-[280px] mb-9">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 280 280">
                <circle className="fill-none stroke-white/5 stroke-[6]" cx="140" cy="140" r="120" />
                <circle 
                  className="fill-none stroke-cyan stroke-[6] transition-all duration-1000 ease-linear"
                  cx="140" cy="140" r="120"
                  strokeDasharray={754}
                  strokeDashoffset={754 * (1 - (timeLeft / totalSecs))}
                  strokeLinecap="round"
                  style={{ filter: 'drop-shadow(0 0 8px rgba(0,245,255,0.6))' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="font-orbitron text-[58px] font-light text-white tracking-[2px] leading-none drop-shadow-[0_0_30px_rgba(0,245,255,0.4)]">
                  {formatTimeLeft(timeLeft)}
                </div>
                <div className="font-orbitron text-[9px] text-cyan/60 tracking-[4px] mt-2 uppercase">
                  {pomodoroPhase === 'work' ? 'FOCUS TIME' : pomodoroPhase === 'break' ? 'SHORT BREAK' : 'LONG BREAK'}
                </div>
                <div className="font-orbitron text-[9px] text-white/25 tracking-[2px] mt-1.5 uppercase">
                  SESSION {(sessionsDone % 4) + 1} OF 4
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 mb-9">
              <button 
                onClick={() => {
                  setIsTimerRunning(false);
                  setTimeLeft(totalSecs);
                }}
                className="w-[52px] h-[52px] rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/30 flex items-center justify-center transition-all"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className="w-[70px] h-[70px] rounded-full bg-gradient-to-br from-cyan/25 to-blue-600/30 border border-cyan/50 text-cyan flex items-center justify-center transition-all hover:bg-cyan/30 hover:scale-105 shadow-[0_0_24px_rgba(0,245,255,0.2)]"
              >
                {isTimerRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current" />}
              </button>
              <button 
                onClick={() => {
                  setIsTimerRunning(false);
                  setTimeLeft(0);
                }}
                className="w-[52px] h-[52px] rounded-full bg-white/5 border border-white/10 text-white/60 hover:text-white hover:border-white/30 flex items-center justify-center transition-all"
              >
                <Zap className="w-5 h-5" />
              </button>
            </div>

            {/* Task Input */}
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-5 py-2.5 w-[340px] mb-7">
              <span className="text-cyan/40 text-sm">✏️</span>
              <input 
                className="flex-1 bg-transparent border-none outline-none font-exo text-[13px] text-white/70 placeholder:text-white/20"
                placeholder="What are you studying?"
                defaultValue={timerSlot?.activity}
              />
            </div>

            {/* Session Dots */}
            <div className="flex items-center gap-2">
              <span className="font-orbitron text-[8px] text-white/30 tracking-[2px] mr-1">SESSIONS</span>
              {[0, 1, 2, 3].map(i => (
                <div 
                  key={i}
                  className={`w-2 h-2 rounded-full border border-white/20 transition-all duration-300 ${
                    i < (sessionsDone % 4) ? 'bg-cyan border-cyan shadow-[0_0_8px_rgba(0,245,255,0.6)]' : 'bg-white/15'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Stats Row */}
          <div className="fixed bottom-6 flex gap-8 items-center">
            <div className="text-center">
              <div className="font-orbitron text-base font-semibold text-cyan/80">{sessionsDone}</div>
              <div className="font-orbitron text-[7px] text-white/25 tracking-[2px] mt-0.5">FOCUS SESSIONS</div>
            </div>
            <div className="text-center">
              <div className="font-orbitron text-base font-semibold text-cyan/80">{totalFocusMins}m</div>
              <div className="font-orbitron text-[7px] text-white/25 tracking-[2px] mt-0.5">TOTAL FOCUSED</div>
            </div>
            <div className="text-center">
              <div className="font-orbitron text-base font-semibold text-cyan/80">{streak}🔥</div>
              <div className="font-orbitron text-[7px] text-white/25 tracking-[2px] mt-0.5">STREAK</div>
            </div>
          </div>

          {/* Music FAB */}
          <button 
            onClick={() => setShowMusicPanel(!showMusicPanel)}
            className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-[#041020]/90 border border-cyan/30 text-cyan flex items-center justify-center shadow-[0_0_16px_rgba(0,245,255,0.2)] hover:shadow-[0_0_28px_rgba(0,245,255,0.4)] hover:scale-110 transition-all backdrop-blur-md z-[1020]"
          >
            <Youtube className="w-5 h-5" />
          </button>

          {/* Music Panel */}
          {showMusicPanel && (
            <div className="fixed bottom-20 right-6 bg-[#041020]/90 border border-white/10 rounded-2xl p-4 w-[220px] backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] z-[1015] animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="font-orbitron text-[8px] text-cyan/70 tracking-[2px]">🎵 STUDY MUSIC</div>
                <button onClick={() => setShowMusicPanel(false)} className="text-white/40 hover:text-white transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex flex-col gap-1.5 mb-3">
                {[
                  { id: 'lofi', label: '🌙 Lofi Hip Hop', vid: 'jfKfPfyJRdk' },
                  { id: 'jazz', label: '🎷 Study Jazz', vid: 'HuFYqnbVbzY' },
                  { id: 'classical', label: '🎻 Classical Focus', vid: '4oStw0r33so' },
                  { id: 'rain', label: '🌧️ Rain & Ambience', vid: 'mPZkdNFkNps' },
                  { id: 'space', label: '🚀 Space Ambient', vid: 'H-iJKNX5L8k' }
                ].map(pl => (
                  <button
                    key={pl.id}
                    onClick={() => setCurrentPlaylist(pl.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border font-exo text-[11px] transition-all text-left ${
                      currentPlaylist === pl.id ? 'bg-cyan/10 border-cyan/30 text-cyan' : 'bg-white/5 border-white/10 text-white/55 hover:bg-white/10'
                    }`}
                  >
                    {pl.label}
                  </button>
                ))}
              </div>
              <div className="rounded-lg overflow-hidden h-[108px]">
                <iframe 
                  width="100%" 
                  height="100%"
                  src={`https://www.youtube.com/embed/${
                    currentPlaylist === 'lofi' ? 'jfKfPfyJRdk' :
                    currentPlaylist === 'jazz' ? 'HuFYqnbVbzY' :
                    currentPlaylist === 'classical' ? '4oStw0r33so' :
                    currentPlaylist === 'rain' ? 'mPZkdNFkNps' : 'H-iJKNX5L8k'
                  }?autoplay=1&controls=1&rel=0`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                  allowFullScreen
                />
              </div>
            </div>
          )}
        </div>
      )}

      <div className="absolute inset-0 z-30 pt-[80px] px-8 overflow-y-auto pb-20 bg-[#020814]/75 backdrop-blur-xl custom-scrollbar">

      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-cyan/60 hover:text-cyan transition-colors font-display text-[10px] uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4" /> {lang === 'en' ? 'Back to Prediction' : 'भविष्यवाणी पर वापस जाएं'}
          </button>
          
          <div className="flex bg-[#02060a]/60 p-1 rounded-lg border border-white/5">
            <button 
              onClick={() => setViewMode('generate')}
              className={`px-6 py-2 rounded-md font-display text-[10px] uppercase tracking-widest transition-all ${viewMode === 'generate' ? 'bg-cyan/10 text-cyan border border-cyan/20' : 'text-white/40 hover:text-white'}`}
            >
              Generate New
            </button>
            <button 
              onClick={() => setViewMode('saved')}
              className={`px-6 py-2 rounded-md font-display text-[10px] uppercase tracking-widest transition-all ${viewMode === 'saved' ? 'bg-cyan/10 text-cyan border border-cyan/20' : 'text-white/40 hover:text-white'}`}
            >
              Saved ({savedTimetables.length})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-cyan/10 border border-cyan/20 flex items-center justify-center text-cyan">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <h1 className="font-display font-black text-4xl text-white uppercase tracking-wider">⏱️ BUILD MY SCHEDULE</h1>
            <p className="text-white/40 font-display text-[10px] tracking-[2px] uppercase">Neural-optimized daily execution protocol</p>
          </div>
        </div>

        {viewMode === 'generate' ? (
          step < 3 ? (
            <div className="glass-panel p-8 rounded-xl border-white/5 space-y-8">
              <div className="flex items-center gap-4 mb-4">
                {steps.map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-display text-[10px] border transition-all ${
                      i === step ? 'bg-cyan/20 border-cyan text-cyan shadow-[0_0_10px_rgba(0,245,255,0.3)]' : 
                      i < step ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 'bg-white/5 border-white/10 text-white/20'
                    }`}>
                      {i < step ? '✓' : i + 1}
                    </div>
                    {i < steps.length - 1 && <div className={`w-8 h-[1px] ${i < step ? 'bg-emerald-500' : 'bg-white/10'}`} />}
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <h2 className="font-display text-xl text-white tracking-widest uppercase">{steps[step].title}</h2>
                <p className="text-white/40 text-sm font-sans italic">{steps[step].description}</p>
              </div>

              <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                {steps[step].fields}
              </div>

              <div className="flex justify-between pt-4">
                <button 
                  onClick={() => setStep(step - 1)}
                  disabled={step === 0}
                  className="px-8 py-3 border border-white/10 rounded-lg text-[10px] font-display text-white/40 uppercase tracking-widest hover:border-white/20 hover:text-white transition-all disabled:opacity-0"
                >
                  Previous
                </button>
                {step < steps.length - 1 ? (
                  <button 
                    onClick={() => setStep(step + 1)}
                    className="px-10 py-3 bg-cyan/10 border border-cyan/30 rounded-lg text-[10px] font-display text-cyan font-bold uppercase tracking-widest hover:bg-cyan/20 transition-all shadow-[0_0_15px_rgba(0,245,255,0.1)]"
                  >
                    Next Step
                  </button>
                ) : (
                  <button 
                    onClick={handleGenerate}
                    disabled={loading}
                    className="px-10 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-[10px] font-display text-emerald-500 font-bold uppercase tracking-widest hover:bg-emerald-500/20 transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)] flex items-center gap-2"
                  >
                    {loading ? <div className="w-3 h-3 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Generate Protocol
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-[12px] text-cyan tracking-[3px] uppercase">Protocol Generated Successfully</h2>
                <button 
                  onClick={() => setViewMode('saved')}
                  className="px-6 py-2 bg-cyan/10 border border-cyan/20 rounded text-[10px] font-display text-cyan uppercase tracking-widest hover:bg-cyan/20 transition-all"
                >
                  View in Saved
                </button>
              </div>
              <div className="glass-panel p-8 rounded-xl border-white/5 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-500">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-xl text-white font-display uppercase tracking-widest">Neural Optimization Complete</h3>
                <p className="text-white/40 text-sm max-w-md mx-auto">Your study schedule has been calculated and saved to your local device history. You can now track it in real-time.</p>
              </div>
            </div>
          )
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
            {!activeTimetableId ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {savedTimetables.length === 0 ? (
                  <div className="col-span-full glass-panel p-12 rounded-xl border-white/5 text-center space-y-4">
                    <Calendar className="w-12 h-12 text-white/10 mx-auto" />
                    <p className="text-white/40 font-display text-[10px] uppercase tracking-widest">No saved protocols found</p>
                    <button onClick={() => setViewMode('generate')} className="text-cyan text-[10px] font-display uppercase tracking-widest hover:underline">Generate your first one</button>
                  </div>
                ) : (
                  savedTimetables.map((t) => (
                    <div key={t.id} className="glass-panel p-6 rounded-xl border-white/5 hover:border-cyan/30 transition-all group relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => deleteTimetable(t.id)} className="p-2 text-rose-500/40 hover:text-rose-500 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-[10px] font-display text-white/40 uppercase tracking-widest mb-1">{t.date}</div>
                            <h3 className="text-white font-display text-lg uppercase tracking-wider">Protocol {t.id.slice(-4)}</h3>
                          </div>
                          <div className="px-2 py-1 bg-cyan/10 border border-cyan/20 rounded text-[8px] font-display text-cyan uppercase tracking-widest">
                            {t.slots.filter((s: any) => s.type === 'study').length} Study Blocks
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {t.formData.subjects.slice(0, 3).map((s: string) => (
                            <span key={s} className="px-2 py-0.5 bg-white/5 rounded text-[8px] text-white/60 uppercase tracking-widest">{s}</span>
                          ))}
                        </div>
                        <button 
                          onClick={() => {
                            setActiveTimetableId(t.id);
                            setTimetable(t.slots);
                          }}
                          className="w-full py-3 bg-white/5 border border-white/10 rounded-lg text-[10px] font-display text-white/60 uppercase tracking-widest hover:bg-cyan/10 hover:text-cyan hover:border-cyan/30 transition-all"
                        >
                          Launch Protocol
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setActiveTimetableId(null)} className="text-white/40 hover:text-white transition-colors">
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="font-display text-[12px] text-cyan tracking-[3px] uppercase">Active Protocol Execution</h2>
                  </div>
                  <div className="flex items-center gap-4">
                    <button 
                    onClick={() => {
                        const doc = new jsPDF();
                        const pageWidth = doc.internal.pageSize.getWidth();
                        const pageHeight = doc.internal.pageSize.getHeight();
                        const margin = 20;

                        // Dark Background
                        doc.setFillColor(2, 8, 20);
                        doc.rect(0, 0, pageWidth, pageHeight, 'F');

                        // LighthouseAI Header
                        doc.setFontSize(10);
                        doc.setTextColor(0, 245, 255);
                        doc.setFont("helvetica", "bold");
                        doc.text("LighthouseAI", pageWidth / 2, 10, { align: "center" });
                        doc.setDrawColor(0, 245, 255);
                        doc.line(margin, 12, pageWidth - margin, 12);

                        doc.setFontSize(22);
                        doc.setTextColor(0, 245, 255);
                        doc.text("AI-Optimized Study Timetable", margin, 25);
                        
                        doc.setFontSize(10);
                        doc.setTextColor(100, 100, 100);
                        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, 32);
                        
                        let y = 45;
                        timetable.forEach((slot) => {
                          if (y > pageHeight - 20) { 
                            doc.addPage(); 
                            doc.setFillColor(2, 8, 20);
                            doc.rect(0, 0, pageWidth, pageHeight, 'F');
                            y = 20; 
                          }
                          
                          // Draw a subtle background for study slots to "keep formatting"
                          if (slot.type === 'study') {
                            doc.setFillColor(16, 185, 129, 0.1);
                            doc.rect(margin - 2, y - 6, pageWidth - (margin * 2) + 4, 10, 'F');
                            doc.setTextColor(0, 245, 255);
                          } else {
                            doc.setTextColor(232, 244, 255);
                          }

                          doc.setFont("helvetica", "bold");
                          doc.text(`${slot.time}`, margin, y);
                          
                          doc.setFont("helvetica", "normal");
                          doc.text(`${slot.activity}`, margin + 35, y);
                          
                          doc.setFontSize(8);
                          doc.setTextColor(100, 100, 100);
                          doc.text(`${slot.type.toUpperCase()}`, pageWidth - margin - 20, y);
                          doc.setFontSize(10);
                          
                          y += 10;
                        });
                        doc.save("study-timetable.pdf");
                      }}
                      className="flex items-center gap-2 text-[10px] font-display text-white/40 hover:text-cyan transition-colors uppercase tracking-widest"
                    >
                      <Download className="w-3 h-3" /> Export PDF
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {timetable.map((slot, i) => {
                    const status = getSlotStatus(slot.time, timetable[i + 1]?.time);
                    return (
                      <div key={i} className={`flex items-center gap-3 sm:gap-6 p-3 sm:p-5 rounded-xl border transition-all group hover:scale-[1.01] duration-300 ${
                        status === 'current' ? 'bg-cyan/10 border-cyan/40 shadow-[0_0_20px_rgba(0,245,255,0.1)]' : 
                        status === 'missed' ? 'bg-white/5 border-white/5 opacity-40' :
                        'bg-white/5 border-white/5'
                      }`}>
                        <div className="w-16 sm:w-24 font-mono text-[11px] sm:text-[13px] text-cyan font-bold shrink-0">{slot.time}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                            <div className="text-white text-[13px] sm:text-[15px] font-medium tracking-wide truncate">{slot.activity}</div>
                            {status === 'current' && (
                              <div className="px-2 py-0.5 bg-cyan/20 border border-cyan/40 rounded text-[7px] font-display text-cyan tracking-[1px] uppercase animate-pulse">Running Now</div>
                            )}
                            {status === 'missed' && (
                              <div className="px-2 py-0.5 bg-white/10 border border-white/20 rounded text-[7px] font-display text-white/40 tracking-[1px] uppercase">Missed</div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className={`text-[7px] sm:text-[8px] uppercase tracking-widest px-2 py-0.5 rounded font-bold ${
                              slot.type === 'study' ? 'bg-cyan/20 text-cyan' :
                              slot.type === 'break' ? 'bg-amber-500/20 text-amber-500' :
                              slot.type === 'meal' ? 'bg-emerald-500/20 text-emerald-500' :
                              slot.type === 'sleep' ? 'bg-violet-500/20 text-violet-500' :
                              'bg-white/10 text-white/40'
                            }`}>
                              {slot.type}
                            </span>
                            {slot.priority === 'high' && (
                              <span className="text-[7px] sm:text-[8px] text-rose-500 uppercase tracking-widest font-bold">Critical</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                          {(slot.type === 'study' || slot.type === 'break' || slot.type === 'meal') && (
                            <div className={`flex gap-1 transition-opacity ${status === 'current' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                              <button 
                                onClick={(e) => {
                                  console.log("Normal timer button clicked");
                                  e.stopPropagation();
                                  startTimer(slot, 'normal');
                                }}
                                className="p-1.5 sm:p-2 bg-white/5 border border-white/10 rounded hover:bg-cyan/10 hover:border-cyan/30 text-white/40 hover:text-cyan transition-all"
                                title="Normal Timer"
                              >
                                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              </button>
                              {slot.type === 'study' && (
                                <button 
                                  onClick={(e) => {
                                    console.log("Pomodoro timer button clicked");
                                    e.stopPropagation();
                                    startTimer(slot, 'pomodoro');
                                  }}
                                  className="p-1.5 sm:p-2 bg-white/5 border border-white/10 rounded hover:bg-cyan/10 hover:border-cyan/30 text-white/40 hover:text-cyan transition-all"
                                  title="Pomodoro Timer"
                                >
                                  <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </button>
                              )}
                            </div>
                          )}
                          {slot.type === 'study' && <Brain className={`w-4 h-4 sm:w-5 sm:h-5 text-cyan ${status === 'current' ? 'animate-pulse' : ''}`} />}
                          {slot.type === 'break' && <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />}
                          {slot.type === 'meal' && <Utensils className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  );
}

export function AIMentor({ onBack, userData, predictionResult, lang = 'en' }: AIMentorProps) {
  const [messages, setMessages] = React.useState<{role: 'user' | 'ai', text: string, timestamp: string, thoughtDuration?: number}[]>([]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const getInitialMessage = () => {
    let text = lang === 'en' ? "Hey! 👋 " : "नमस्ते! ";
    if (predictionResult && userData) {
      text += lang === 'en' 
        ? `I've scanned your academic profile. Your predicted score is **${predictionResult.score}%** — but together, we can push that higher. What do you want to tackle first?`
        : `मैंने आपके प्रोफाइल का विश्लेषण किया है। आपका अनुमानित स्कोर **${predictionResult.score}%** है। मैं आज आपको बेहतर बनाने में कैसे मदद कर सकता हूँ?`;
    } else {
      text += lang === 'en'
        ? "I'm ready to help you improve your scores. How can I help you today?"
        : "मैं आपके स्कोर को बेहतर बनाने में मदद करने के लिए तैयार हूँ। मैं आज आपकी कैसे मदद कर सकता हूँ?";
    }
    return text;
  };

  React.useEffect(() => {
    setMessages([{ 
      role: 'ai', 
      text: getInitialMessage(), 
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    }]);
  }, [predictionResult, userData]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input;
    const startTime = Date.now();
    setInput('');
    setMessages(prev => [...prev, { 
      role: 'user', 
      text: userMsg, 
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
    }]);
    setLoading(true);

    try {
      const model = "gemini-3-flash-preview";
      
      let context = "The student has provided the following academic and habit data:\n";
      if (userData) {
        context += `- Midterm Score: ${userData.midterm}%\n`;
        context += `- Attendance: ${userData.attendance}%\n`;
        context += `- Daily Study Hours: ${userData.studyHrs}\n`;
        context += `- Daily Sleep Hours: ${userData.sleepHrs}\n`;
      }
      
      if (predictionResult) {
        context += `\nPrediction Analysis:\n`;
        context += `- Predicted Final Score: ${predictionResult.score}%\n`;
        context += `- Risk Level: ${predictionResult.risk}\n`;
      }

      const systemInstruction = lang === 'en' 
        ? `You are a helpful, friendly, and motivating AI Mentor. 
        Keep your messages SHORT and FRIENDLY. 
        Suggest ancient techniques (like the Method of Loci, Pomodoro, Active Recall, or ancient Indian/Greek mnemonic methods) when relevant.
        
        Student Context:
        ${context}`
        : `आप एक सहायक, मिलनसार और प्रेरक एआई मेंटर हैं।
        अपने संदेशों को छोटा और मिलनसार रखें।
        प्रासंगिक होने पर प्राचीन तकनीकों (जैसे लोकी की विधि, पोमोडोरो, एक्टिव रिकॉल, या प्राचीन भारतीय/यूनानी स्मरक विधियों) का सुझाव दें।
        
        छात्र संदर्भ:
        ${context}`;

      const chatHistory = messages.map(m => ({
        role: m.role === 'ai' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [...chatHistory, { role: 'user', parts: [{ text: userMsg }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] }
          })
        }
      );
      const geminiData = await geminiRes.json();
      if (geminiData.error) throw new Error(geminiData.error.message);
      const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't process that.";
      const duration = Math.round((Date.now() - startTime) / 1000);
      
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        thoughtDuration: duration > 0 ? duration : 1
      }]);
    } catch (error) {
      console.error("Error in chat:", error);
      setMessages(prev => [...prev, { 
        role: 'ai', 
        text: "Connection error. Please try again.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 z-30 pt-[80px] px-4 sm:px-8 overflow-y-auto pb-20 bg-[#020814]/75 backdrop-blur-xl custom-scrollbar">
      <div className="max-w-4xl mx-auto h-full flex flex-col space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <button onClick={onBack} className="flex items-center gap-2 text-cyan/60 hover:text-cyan transition-colors font-display text-[10px] uppercase tracking-widest">
          <ArrowLeft className="w-4 h-4" /> {lang === 'en' ? '← DASHBOARD' : 'भविष्यवाणी पर वापस जाएं'}
        </button>

        <div className="flex items-center gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-500">
            <Bot className="w-6 h-6 sm:w-7 h-7" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl sm:text-4xl text-white uppercase tracking-wider">{lang === 'en' ? 'AI COACH' : 'एआई मेंटर'}</h1>
            <p className="text-white/40 font-display text-[8px] sm:text-[10px] tracking-[2px] uppercase">{lang === 'en' ? '— YOUR PERSONAL AI THAT KNOWS YOUR SCORE, YOUR HABITS & YOUR WEAK SPOTS —' : 'तंत्रिका बुद्धिमत्ता द्वारा संचालित व्यक्तिगत परामर्श'}</p>
          </div>
        </div>

        <div className="flex-1 glass-panel rounded-xl border-white/5 flex flex-col overflow-hidden min-h-[400px] sm:min-h-[500px]">
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 custom-scrollbar">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-cyan/10 border border-cyan/20 text-white rounded-tr-none' 
                    : 'bg-white/5 border border-white/10 text-white/80 rounded-tl-none'
                }`}>
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2">
                      {msg.role === 'ai' ? <Bot className="w-3 h-3 text-cyan" /> : <Sparkles className="w-3 h-3 text-white/40" />}
                      <span className="text-[9px] font-display uppercase tracking-widest opacity-40">
                        {msg.role === 'user' ? (lang === 'en' ? 'You' : 'आप') : (lang === 'en' ? '⚡ LIGHTHOUSEAI' : 'एआई मेंटर')}
                      </span>
                    </div>
                    <span className="text-[8px] font-mono opacity-30">{msg.timestamp}</span>
                  </div>
                  <div className="markdown-body prose prose-invert prose-sm max-w-none">
                    <Markdown>{msg.text}</Markdown>
                  </div>
                  {msg.thoughtDuration && (
                    <div className="mt-2 pt-2 border-t border-white/5 text-[8px] font-mono text-cyan/30 italic">
                      Thought for {msg.thoughtDuration} seconds
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/10 p-4 rounded-xl rounded-tl-none flex flex-col gap-2">
                  <div className="flex gap-2">
                    <div className="w-1.5 h-1.5 bg-cyan rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-cyan rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-cyan rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span className="text-[8px] font-mono text-cyan/30 animate-pulse">{lang === 'en' ? 'Thinking...' : 'सोच रहा हूँ...'}</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-white/5 bg-[#02060a]/20 space-y-4">
            {lang === 'en' && (
              <div className="flex flex-wrap gap-2">
                {[
                  { icon: '💡', text: 'How do I improve my score?' },
                  { icon: '📅', text: 'Make me a 7-day study plan' },
                  { icon: '🤯', text: 'I have exams tomorrow, help!' },
                  { icon: '📊', text: "What's my weakest habit?" },
                  { icon: '🎯', text: 'What should I study first?' }
                ].map((chip, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(chip.text);
                      // We can't easily trigger handleSend here because it's defined inside the component
                      // but we can set the input and let the user press send, or we can refactor.
                      // Actually, let's just set the input for now, or I can try to call handleSend if I move it.
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-white/60 hover:bg-cyan/10 hover:border-cyan/30 hover:text-cyan transition-all"
                  >
                    <span>{chip.icon}</span>
                    <span>{chip.text}</span>
                  </button>
                ))}
              </div>
            )}
            <div className="flex gap-4">
              <input 
                type="text" 
                placeholder={lang === 'en' ? "Ask me anything — study plan, weak subjects, tips..." : "अपने मेंटर से कुछ भी पूछें..."}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 bg-[#02060a]/40 border border-white/10 rounded-lg px-6 py-4 text-white outline-none focus:border-cyan/50 transition-all font-sans"
              />
              <button 
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="w-14 h-14 bg-cyan/10 border border-cyan/20 rounded-lg text-cyan flex items-center justify-center hover:bg-cyan/20 transition-all disabled:opacity-50"
              >
                <Send className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
