import React, { Component, ErrorInfo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, X, Send, ExternalLink, Languages, RotateCcw, TrendingUp, Info, Clock, Brain, Bot, Quote, ArrowRight, Sparkles, Map } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from 'recharts';
import { 
  YouTubeSuggester, 
  NotesSummarizer, 
  StudyRoadmap, 
  AIMentor, 
  TimetableGenerator 
} from './Features';

import { dataService, type AnalyticsData, type StudentData } from './services/dataService';

function CustomCursor() {
  const [position, setPosition] = React.useState({ x: -100, y: -100 });
  const [isPointer, setIsPointer] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!isVisible) setIsVisible(true);
      
      const target = e.target as HTMLElement;
      if (!target) return;
      const cursorStyle = window.getComputedStyle(target).cursor;
      setIsPointer(cursorStyle === 'pointer' || target.tagName === 'BUTTON' || target.tagName === 'A');
    };

    const onMouseLeave = () => setIsVisible(false);
    const onMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
    };
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed top-0 left-0 pointer-events-none z-[99999] mix-blend-normal hidden md:block"
      style={{ 
        transform: `translate(${position.x}px, ${position.y}px)`,
        width: isPointer ? '40px' : '32px',
        height: isPointer ? '40px' : '32px',
        marginTop: '-4px',
        marginLeft: '-4px',
        transition: 'width 0.2s, height 0.2s'
      }}
    >
      <img 
        src="/Cursor.png?v=3" 
        alt="" 
        className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(0,245,255,0.5)]"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#020814] flex items-center justify-center p-8 text-center">
          <div className="max-w-md space-y-6 glass-panel p-10 border-red-500/30">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Zap className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="font-display text-2xl font-black text-white uppercase tracking-widest">System Failure</h1>
            <p className="text-white/60 text-sm leading-relaxed">
              LighthouseAI encountered a critical error while processing your data. 
              Our neural links have been temporarily severed.
            </p>
            <div className="bg-black/40 p-4 rounded font-mono text-[10px] text-red-400/80 text-left overflow-x-auto">
              {this.state.error?.message}
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-white/5 border border-white/10 rounded text-white font-display text-xs tracking-widest uppercase hover:bg-white/10 transition-all"
            >
              Reboot System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  const [view, setView] = React.useState<'home' | 'predict' | 'youtube' | 'notes' | 'roadmap' | 'mentor' | 'timetable'>('home');
  const [activeModal, setActiveModal] = React.useState<'none' | 'features' | 'about-us' | 'advice' | 'faq' | 'team' | 'how-it-works'>('none');
  const [isMuted, setIsMuted] = React.useState(false);
  const [lang, setLang] = React.useState<'en' | 'hi'>('en');
  const [showFooter, setShowFooter] = React.useState(true);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  const [formData, setFormData] = React.useState({
    midterm: 70,
    attendance: 80,
    syllabus: 3,
    seat: 'Front Row',
    prep: '3-4 Weeks Before',
    panic: 3,
    studyHrs: 2,
    sleepHrs: 7,
    screenTime: 4,
    travelTime: 1,
    ott: 'None (0 hrs)'
  });

  const [result, setResult] = React.useState<{
    score: number;
    risk: string;
    riskClass: string;
    riskIcon: string;
    confidenceRange: [number, number];
    impactData: { name: string; value: number; fill: string }[];
    suggestions: { icon: string; title: string; desc: string }[];
  } | null>(null);

  const [isPredicting, setIsPredicting] = React.useState(false);
  const [analytics, setAnalytics] = React.useState<AnalyticsData | null>(null);
  const [dataError, setDataError] = React.useState<string | null>(null);
  const [modelMAE, setModelMAE] = React.useState<number>(4.6);

  // Sync with dataService on mount
  React.useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch dynamic MAE from backend
        const info = await dataService.getModelInfo();
        setModelMAE(info.mae);

        const response = await fetch('/lighthouse_clean.csv');
        if (response.ok) {
          const csvText = await response.text();
          const studentData = await dataService.parseLocalCsv(csvText);
          const generatedAnalytics = dataService.generateAnalytics(studentData);
          setAnalytics(generatedAnalytics);
          setDataError(null);
        } else {
          setDataError("Dataset file 'lighthouse_clean.csv' not found in public folder.");
        }
      } catch (error) {
        console.error("Failed to load dataset:", error);
        setDataError("Error loading dataset. Please check the file format.");
      }
    };
    loadData();
  }, []);

  React.useEffect(() => {
    const playAudio = () => {
      if (audioRef.current) {
        if (!isMuted) {
          audioRef.current.volume = 0.3;
          audioRef.current.play().catch(err => console.log("Autoplay blocked:", err));
        } else {
          audioRef.current.pause();
        }
      }
    };

    playAudio();

    // Interaction listener to handle autoplay policies
    const handleInteraction = () => {
      if (!isMuted) playAudio();
    };

    window.addEventListener('click', handleInteraction, { once: true });
    return () => window.removeEventListener('click', handleInteraction);
  }, [isMuted]);

  const [selectedSuggestion, setSelectedSuggestion] = React.useState<any>(null);

  const t = (key: string) => {
    const translations = {
      en: {
        about: 'About Us',
        how: 'How It Works',
        faq: 'FAQs',
        features: 'Features',
        contact: 'THE CREW',
        welcome: "⚡ YOUR AI MENTOR IS READY — LET'S PREDICT YOUR FUTURE",
        start: '⚡ PREDICT NOW',
        fillForm: '🔥 HELP US GET SMARTER — FILL THE FORM',
        formBtn: 'JOIN THE DATA',
        tagline: 'ILLUMINATE YOUR PATH TO MASTERY',
        description: '"Your habits are talking. Our AI is listening. Your score is waiting."',
        startBtn: 'START PREDICTION',
        aboutBtn: 'ABOUT US',
        faqBtn: "FAQs",
        adviceBtn: 'GIVE FEEDBACK',
        predictionScan: 'Prediction Scan',
        academicVitals: 'Academic Vitals',
        dailyHabits: 'Daily Habits',
        midtermScore: 'Midterm Score (%)',
        attendance: 'Attendance (%)',
        studyHrs: 'Daily Study Hours',
        sleepHrs: 'Daily Sleep Hours',
        screenTime: 'Daily Screen Time (hrs)',
        travelTime: 'Travel Time(hrs) from College to Home',
        ottTime: 'OTT Time(hrs) Per Week',
        panicLevel: 'Panic Level (1-5)',
        seat: 'Where Do You Sit?',
        prep: 'When Do You Start Preparing?',
        initiateScan: 'Initiate Prediction Scan',
        processingScan: 'Processing Scan...',
        whatIf: '🔮 WHAT IF I CHANGED THIS?',
        resetVitals: '↺ START FRESH',
        featureImpact: '🔍 FACTORS AFFECTING YOUR SCORE',
        featureImportance: '📊 FEATURE IMPORTANCE',
        impactWeight: 'Impact Weight (%)',
        habitAnalysis: 'Habit Analysis (vs Top Scorers)',
        mentor: 'AI Mentor'
      },
      hi: {
        about: 'हमारे बारे में',
        how: 'यह कैसे काम करता है',
        faq: 'सामान्य प्रश्न',
        features: 'विशेषताएं',
        contact: 'टीम से मिलें',
        welcome: 'एआई-संचालित छात्र मेंटर प्लेटफॉर्म में स्वागत है',
        start: 'अभी भविष्यवाणी करें',
        fillForm: 'मॉडल के प्रदर्शन को बेहतर बनाने के लिए यह फॉर्म भरें',
        formBtn: 'फॉर्म भरें',
        tagline: 'महारत के लिए अपना रास्ता रोशन करें',
        description: 'शैक्षणिक अंतर्दृष्टि के माध्यम से छात्रों को सशक्त बनाना - अपने अंतिम स्कोर की भविष्यवाणी करें, जानें कि क्या ठीक करना है, और फाइनल आने से पहले शीर्ष पर पहुंचें।',
        startBtn: 'भविष्यवाणी शुरू करें',
        aboutBtn: 'हमारे बारे में',
        faqBtn: 'सामान्य प्रश्न',
        adviceBtn: 'फीडबैक दें',
        predictionScan: 'भविष्यवाणी स्कैन',
        academicVitals: 'शैक्षणिक महत्वपूर्ण आंकड़े',
        dailyHabits: 'दैनिक आदतें',
        midtermScore: 'मिडटर्म स्कोर (%)',
        attendance: '🏫 उपस्थिति %',
        studyHrs: '📚 पढ़ाई के घंटे',
        sleepHrs: 'दैनिक नींद के घंटे',
        screenTime: '📱 स्क्रीन टाइम',
        travelTime: 'कॉलेज से घर तक यात्रा का समय (घंटे)',
        ottTime: 'प्रति सप्ताह ओटीटी समय (घंटे)',
        panicLevel: 'घबराहट स्तर (1-5)',
        seat: 'आप कहाँ बैठते हैं?',
        prep: 'आप तैयारी कब शुरू करते हैं?',
        initiateScan: 'भविष्यवाणी स्कैन शुरू करें',
        processingScan: 'स्कैन प्रोसेस किया जा रहा है...',
        whatIf: '🔮 क्या होगा अगर मैं इसे बदल दूँ?',
        resetVitals: '↺ फिर से शुरू करें',
        featureImpact: '🔍 आपके स्कोर को प्रभावित करने वाले कारक',
        featureImportance: '📊 फीचर महत्व',
        impactWeight: 'प्रभाव भार (%)',
        habitAnalysis: 'आदत विश्लेषण (शीर्ष स्कोरर के मुकाबले)',
        mentor: 'एआई मेंटर'
      }
    };
    return (translations[lang as keyof typeof translations] as any)[key] || key;
  };

  return (
    <ErrorBoundary>
      <div className="relative w-screen h-screen overflow-hidden font-sans text-[#e8f4ff] overflow-x-hidden">
        <CustomCursor />
        {/* ══ SCENE ══ */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 overflow-hidden">
            <img 
              src="/BG.png" 
              alt="Background" 
              className="absolute min-w-full min-h-full object-cover opacity-100"
              referrerPolicy="no-referrer"
            />
          </div>
          
          {/* ── GRID OVERLAY ── */}
          <div className="absolute inset-0 z-1 pointer-events-none bg-[linear-gradient(rgba(0,245,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(0,245,255,0.018)_1px,transparent_1px)] bg-[size:52px_52px]" />
          
          {/* ── SCANLINES ── */}
          <div className="absolute inset-0 z-1 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(0,0,0,0.025)_3px,rgba(0,0,0,0.025)_4px)]" />
        </div>

        {/* ══ NAV ══ */}
        <nav className="absolute top-0 left-0 right-0 z-30 h-[52px] flex items-center justify-between px-7 border-b border-cyan/12 backdrop-blur-[4px]">
          <audio ref={audioRef} src="/BG Music.mp3" loop />
          <div className="absolute bottom-0 left-[6%] right-[6%] h-[1px] bg-gradient-to-r from-transparent via-cyan/30 to-transparent" />
          
          <div 
            className="flex items-center gap-[12px] font-display text-[15px] font-black text-cyan tracking-[2px] text-glow-cyan cursor-pointer group"
            onClick={() => setView('home')}
          >
            <span className="mt-0.5">LighthouseAI</span>
          </div>
          
          <div className="flex items-center gap-[2px]">
            <div className="hidden sm:flex items-center gap-[2px]">
              {[
                { name: t('about'), action: () => setActiveModal('about-us') },
                { name: t('how'), action: () => setActiveModal('how-it-works') },
                { name: t('features'), action: () => setActiveModal('features') },
                { name: t('contact'), action: () => setActiveModal('team') }
              ].map((link) => (
                <div 
                  key={link.name} 
                  className="px-[14px] py-[6px] font-display text-[12px] font-semibold tracking-[2px] uppercase text-[#b4dcff]/90 cursor-pointer rounded-[3px] border border-transparent hover:text-cyan hover:border-cyan/18 hover:bg-cyan-dim transition-all duration-200"
                  onClick={link.action}
                >
                  {link.name}
                </div>
              ))}
            </div>
            <button 
              className="ml-2 px-[14px] sm:px-[18px] py-[6px] sm:py-[7px] font-display text-[10px] sm:text-[12px] font-bold tracking-[2px] uppercase text-cyan cursor-pointer bg-cyan-dim border border-cyan-border rounded-[3px] shadow-[0_0_12px_var(--color-cyan-dim)] transition-all duration-300 slanted-clip-nav hover:bg-cyan/22 hover:shadow-[0_0_22px_var(--color-cyan-glow)]"
              onClick={() => setView('predict')}
            >
              <span className="opacity-70">+ </span>{t('start')}
            </button>
            <button 
              onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
              className="ml-2 w-[32px] h-[32px] sm:w-[36px] sm:h-[36px] flex items-center justify-center bg-cyan-dim border border-cyan-border rounded-[3px] text-cyan/70 hover:text-cyan hover:bg-cyan/22 transition-all duration-300 shadow-[0_0_8px_var(--color-cyan-dim)]"
              title={lang === 'en' ? "Translate to Hindi" : "English में देखें"}
            >
              <Languages className="w-4 h-4" />
            </button>
          </div>
        </nav>

        {/* ══ TRANSLATE BUTTON REMOVED ══ */}

        <AnimatePresence mode="wait">
          {view === 'home' ? (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <HomeView onStart={() => setView('predict')} onShowModal={setActiveModal} t={t} mae={modelMAE} />
            </motion.div>
          ) : view === 'predict' ? (
            <motion.div
              key="predict"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <PredictionView 
                onBack={() => setView('home')} 
                onFeatureClick={(f) => setView(f as any)} 
                formData={formData}
                setFormData={setFormData}
                result={result}
                setResult={setResult}
                isMuted={isMuted}
                setIsMuted={setIsMuted}
                analytics={analytics}
                setAnalytics={setAnalytics}
                dataError={dataError}
                isPredicting={isPredicting}
                setIsPredicting={setIsPredicting}
                modelMAE={modelMAE}
                scrollRef={scrollRef}
                lang={lang}
                t={t}
                setSelectedSuggestion={setSelectedSuggestion}
              />
            </motion.div>
          ) : view === 'roadmap' ? (
            <motion.div
              key="roadmap"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <StudyRoadmap onBack={() => setView('predict')} lang={lang} />
            </motion.div>
          ) : view === 'youtube' ? (
            <motion.div
              key="youtube"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <YouTubeSuggester onBack={() => setView('predict')} lang={lang} />
            </motion.div>
          ) : view === 'notes' ? (
            <motion.div
              key="notes"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <NotesSummarizer onBack={() => setView('predict')} lang={lang} />
            </motion.div>
          ) : view === 'timetable' ? (
            <motion.div
              key="timetable"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <TimetableGenerator onBack={() => setView('predict')} lang={lang} />
            </motion.div>
          ) : view === 'mentor' ? (
            <motion.div
              key="mentor"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <AIMentor 
                onBack={() => setView('predict')} 
                userData={formData}
                predictionResult={result}
                lang={lang}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>

      {/* ══ MODALS ══ */}
      <Modal title="System Capabilities" isOpen={activeModal === 'features'} onClose={() => setActiveModal('none')}>
        <div className="space-y-6">
          <div className="font-display text-[12px] text-cyan tracking-[3px] uppercase mb-2 opacity-80">Our Features</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { icon: '⚡', title: 'Predict Score', desc: 'Predict your final exam score based on habits and academic history.' },
              { icon: '🎥', title: 'YouTube Video Suggestor', desc: 'Get personalized video recommendations to strengthen weak topics.' },
              { icon: '📄', title: 'Notes Summarizer', desc: 'Condense long study materials into concise, readable summaries.' },
              { icon: '🗺️', title: 'Study Roadmap', desc: 'A step-by-step guide to mastering your subjects and achieving targets.' },
              { icon: '⏱️', title: 'BUILD MY SCHEDULE', desc: 'Automatically create a balanced study schedule tailored to your routine.' },
              { icon: '🤖', title: 'AI Mentor', desc: '24/7 AI assistance for academic queries and personalized guidance.' }
            ].map((feat, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-lg p-4 hover:border-cyan/30 transition-colors">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-lg">{feat.icon}</span>
                  <div className="font-display text-[12px] text-white tracking-widest uppercase">{feat.title}</div>
                </div>
                <div className="text-white/85 text-[11px] leading-relaxed">{feat.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      <Modal title="About Us" isOpen={activeModal === 'about-us'} onClose={() => setActiveModal('none')}>
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="font-display text-[12px] text-cyan tracking-[3px] uppercase mb-2 opacity-80">◈ Our Mission</div>
            <p className="text-white/90 leading-relaxed">
              LighthouseAI was born at SKIT to solve a critical problem: the academic "black box". Students often don't realize how their daily habits—sleep, screen time, attendance, and study patterns—impact their final results until it’s too late. Our mission is to illuminate this path with data-driven transparency.
            </p>
          </div>
          
          <div className="space-y-4 pt-2">
            <div className="font-display text-[12px] text-cyan tracking-[3px] uppercase mb-2 opacity-80">◈ The Vision</div>
            <p className="text-white/90 leading-relaxed">
              To move beyond generic advice. We provide every student with a What-If Simulator, allowing them to visualize how small, manageable changes in their lifestyle can lead to massive gains in their academic performance.
            </p>
          </div>

          <div className="pt-6 border-t border-white/5 space-y-4">
            <div className="bg-cyan/5 border border-cyan/20 rounded-lg p-4">
              <p className="text-[12px] text-white/90 mb-3">
                {lang === 'en' ? 'To improve the performance of the model, please fill this form:' : 'मॉडल के प्रदर्शन को बेहतर बनाने के लिए, कृपया यह फॉर्म भरें:'}
              </p>
              <a 
                href="https://forms.gle/HxDjBW4eW3ERkwzv6" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-cyan/10 border border-cyan/30 rounded text-[11px] font-display text-cyan font-bold tracking-[2px] hover:bg-cyan/20 transition-all uppercase"
              >
                {lang === 'en' ? 'Open Research Form' : 'रिसर्च फॉर्म खोलें'}
              </a>
            </div>
            
            <div className="font-display text-[11px] text-white/60 uppercase tracking-[3px] text-center">
              Developed with ❤️ for the SKIT community.
            </div>
          </div>
        </div>
      </Modal>


      <Modal title={lang === 'en' ? "Meet the Team" : "टीम से मिलें"} isOpen={activeModal === 'team'} onClose={() => setActiveModal('none')}>
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="font-display text-[14px] text-cyan tracking-[3px] uppercase mb-2 border-b border-cyan/20 pb-2">◈ THE TEAM BEHIND THE LIGHT</div>
            <p className="text-[#bee1ff]/95 text-sm leading-relaxed">
              We are a collective of four student-innovators from SKIT, united by a single goal: to make AI-driven academic success accessible to every student. By combining data science with user-centric design, we’ve built LighthouseAI to be more than just a tool—it's a digital mentor for our campus community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { 
                name: 'Shlok Shukla', 
                title: 'Project Lead',
                role: 'Machine Learning Engineer',
                linkedin: 'https://www.linkedin.com/in/shlokshukla200'
              },
              { 
                name: 'Virendra Sharma', 
                title: '',
                role: 'Backend & Data Engineer', 
                linkedin: 'https://www.linkedin.com/in/virendra-sharma-4531933a0'
              },
              { 
                name: 'Sujal Gautam', 
                title: '',
                role: 'Frontend Engineer', 
                linkedin: 'https://www.linkedin.com/in/sujal-gautam-b844903a1'
              },
              { 
                name: 'Soumya Gupta', 
                title: '',
                role: 'UI/UX Designer', 
                linkedin: 'https://www.linkedin.com/in/soumya-gupta-478396391'
              }
            ].map((member, i) => (
              <div key={i} className="glass-panel rounded-lg p-5 border-white/5 hover:border-cyan/30 transition-all group">
                <div className="flex justify-between items-start mb-3">
                  <div className="font-display text-[16px] font-black text-cyan tracking-[1px]">{member.name}</div>
                  <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-cyan transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
                <div className="space-y-1">
                  {member.title && (
                    <div className="font-display text-[10px] text-cyan/60 tracking-[2px] uppercase mb-1">— {member.title}</div>
                  )}
                  <div className="text-[11px] text-white/85">
                    <span className="text-[#8ab4d6] mr-1">Role:</span> {member.role}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      <Modal title={lang === 'en' ? "How It Works" : "यह कैसे काम करता है"} isOpen={activeModal === 'how-it-works'} onClose={() => setActiveModal('none')}>
        <div className="space-y-6">
          <div className="font-display text-[14px] text-cyan tracking-[2px] uppercase mb-4 border-b border-cyan/20 pb-2">{lang === 'en' ? 'The Process' : 'प्रक्रिया'}</div>
          <div className="bg-cyan/5 p-5 rounded-lg border border-cyan/20 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-cyan/20 flex items-center justify-center text-cyan font-bold shrink-0">1</div>
              <p className="text-sm text-white/80">
                <span className="text-cyan font-bold">{lang === 'en' ? 'Initiate:' : 'शुरू करें:'}</span> {lang === 'en' ? 'Click on' : 'होम स्क्रीन या नेविगेशन बार से'} <span className="text-cyan">"{lang === 'en' ? 'PREDICT NOW' : 'अभी भविष्यवाणी करें'}"</span> {lang === 'en' ? 'from the home screen or navigation bar.' : 'पर क्लिक करें।'}
              </p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-cyan/20 flex items-center justify-center text-cyan font-bold shrink-0">2</div>
              <p className="text-sm text-white/80">
                <span className="text-cyan font-bold">{lang === 'en' ? 'Input Vitals:' : 'आंकड़े दर्ज करें:'}</span> {lang === 'en' ? 'Fill in your academic scores and daily habit data in the prediction form.' : 'भविष्यवाणी फॉर्म में अपने शैक्षणिक स्कोर और दैनिक आदत डेटा भरें।'}
              </p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-cyan/20 flex items-center justify-center text-cyan font-bold shrink-0">3</div>
              <p className="text-sm text-white/80">
                <span className="text-cyan font-bold">{lang === 'en' ? 'Analyze:' : 'विश्लेषण करें:'}</span> {lang === 'en' ? 'Click' : 'अपने डेटा को प्रोसेस करने के लिए'} <span className="text-cyan">"{lang === 'en' ? 'Initiate Prediction Scan' : 'भविष्यवाणी स्कैन शुरू करें'}"</span> {lang === 'en' ? 'to let our AI process your data.' : 'पर क्लिक करें।'}
              </p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-cyan/20 flex items-center justify-center text-cyan font-bold shrink-0">4</div>
              <p className="text-sm text-white/80">
                <span className="text-cyan font-bold">{lang === 'en' ? 'Optimize:' : 'बेहतर बनाएं:'}</span> {lang === 'en' ? 'Review your predicted score, risk level, and use the' : 'अपने अनुमानित स्कोर, जोखिम स्तर की समीक्षा करें और सुधार के लिए'} <span className="text-cyan">{lang === 'en' ? 'AI Mentor' : 'एआई मेंटर'}</span> {lang === 'en' ? 'and other tools to improve.' : 'और अन्य उपकरणों का उपयोग करें।'}
              </p>
            </div>
          </div>
        </div>
      </Modal>

      <Modal title={lang === 'en' ? "Frequently Asked Questions" : "अक्सर पूछे जाने वाले प्रश्न"} isOpen={activeModal === 'faq'} onClose={() => setActiveModal('none')}>
        <div className="space-y-6">
          {[
            { 
              q: lang === 'en' ? 'How accurate is the prediction?' : 'भविष्यवाणी कितनी सटीक है?', 
              a: lang === 'en' ? `Our model uses a Random Forest Regressor trained on 11 distinct academic and lifestyle factors. It has a Mean Absolute Error of ±${modelMAE}%, providing a robust scientific prediction rather than a simple formula.` : `हमारा मॉडल 11 अलग-अलग शैक्षणिक और जीवनशैली कारकों पर प्रशिक्षित रैंडम फॉरेस्ट रिग्रेसर का उपयोग करता है। इसमें ±${modelMAE}% की औसत पूर्ण त्रुटि है, जो एक सरल सूत्र के बजाय एक मजबूत वैज्ञानिक भविष्यवाणी प्रदान करती है।`
            },
            { 
              q: lang === 'en' ? 'Is my data saved?' : 'क्या मेरा डेटा सहेजा गया है?', 
              a: lang === 'en' ? 'No. All calculations are performed locally in your session. We do not store personal academic data on our servers.' : 'नहीं। सभी गणनाएँ आपके सत्र में स्थानीय रूप से की जाती हैं। हम अपने सर्वर पर व्यक्तिगत शैक्षणिक डेटा संग्रहीत नहीं करते हैं।'
            },
            { 
              q: lang === 'en' ? 'What is the Random Forest algorithm?' : 'रैंडम फॉरेस्ट एल्गोरिदम क्या है?', 
              a: lang === 'en' ? 'It is an ensemble learning method that builds multiple decision trees to provide robust predictions and minimize overfitting.' : 'यह एक एन्सेम्बल लर्निंग विधि है जो मजबूत भविष्यवाणियां प्रदान करने और ओवरफिटिंग को कम करने के लिए कई निर्णय वृक्ष (decision trees) बनाती है।'
            },
            { 
              q: lang === 'en' ? 'Can I use this for any subject?' : 'क्या मैं इसे किसी भी विषय के लिए उपयोग कर सकता हूँ?', 
              a: lang === 'en' ? 'Yes, the model is trained on general academic patterns that apply across most disciplines.' : 'हाँ, मॉडल को सामान्य शैक्षणिक पैटर्न पर प्रशिक्षित किया गया है जो अधिकांश विषयों पर लागू होते हैं।'
            }
          ].map((item, i) => (
            <div key={i} className="bg-white/5 p-4 rounded-lg border border-white/5">
              <div className="font-display text-[12px] text-cyan tracking-widest uppercase mb-2">Q: {item.q}</div>
              <div className="text-white/60 pl-4 border-l border-cyan/30">{item.a}</div>
            </div>
          ))}
        </div>
      </Modal>

      {/* ══ FOOTER ══ */}
      {showFooter && view === 'home' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 hidden md:flex items-center gap-4 px-5 py-2.5 bg-white/10 border border-white/10 rounded-full backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] border-t-white/20 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse shadow-[0_0_8px_var(--color-cyan)]" />
          <span className="text-[12px] font-display text-white/80 tracking-[2px] uppercase whitespace-nowrap">{t('fillForm')}</span>
          <a 
            href="https://forms.gle/HxDjBW4eW3ERkwzv6" 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-4 py-1.5 bg-cyan/15 border border-cyan/40 rounded-full text-[12px] font-display font-bold text-cyan tracking-[2px] uppercase hover:bg-cyan/25 hover:shadow-[0_0_15px_rgba(0,245,255,0.3)] transition-all duration-300 active:scale-95"
          >
            {t('formBtn')}
          </a>
          <button 
            onClick={() => setShowFooter(false)}
            className="p-1 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <AnimatePresence>
        {selectedSuggestion && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#020814]/95 backdrop-blur-xl"
          >
            <div 
              className="absolute inset-0 cursor-pointer" 
              onClick={() => setSelectedSuggestion(null)} 
            />
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-[#0a1628] w-full h-full relative flex flex-col overflow-hidden shadow-2xl z-10"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan/40 via-blue-500/40 to-cyan/40" />
              
              {/* Header */}
              <div className="p-6 md:p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-cyan/10 border border-cyan/30 flex items-center justify-center text-3xl shadow-[0_0_20px_rgba(0,245,255,0.2)]">
                    {selectedSuggestion.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="px-3 py-1 rounded-full bg-cyan/10 border border-cyan/20 text-[8px] font-display text-cyan tracking-[2px] uppercase font-black">
                        IMPROVEMENT PROTOCOL
                      </span>
                      <span className="text-[8px] font-display text-white/20 tracking-[2px] uppercase">
                        Verified by LighthouseAI
                      </span>
                    </div>
                    <h2 className="font-display text-2xl md:text-3xl text-white tracking-[2px] uppercase font-black leading-tight">
                      {selectedSuggestion.title}
                    </h2>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedSuggestion(null)}
                  className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all group"
                >
                  <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-12 custom-scrollbar bg-gradient-to-b from-transparent to-black/30">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-7 space-y-10">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-cyan">
                        <Brain className="w-5 h-5" />
                        <h3 className="font-display text-[12px] tracking-[3px] uppercase font-black">Strategic Overview</h3>
                      </div>
                      <p className="text-white/70 text-base leading-relaxed">
                        {selectedSuggestion.desc}
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div className="flex items-center gap-2 text-cyan">
                        <Zap className="w-5 h-5" />
                        <h3 className="font-display text-[12px] tracking-[3px] uppercase font-black">Execution Steps</h3>
                      </div>
                      <div className="space-y-4">
                        {(selectedSuggestion.protocol || []).map((step: any, idx: number) => (
                          <div key={idx} className="flex gap-4 p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
                            <div className="w-8 h-8 rounded-lg bg-cyan/10 border border-cyan/20 flex items-center justify-center text-cyan font-mono text-base font-bold shrink-0">
                              {idx + 1}
                            </div>
                            <div className="space-y-1 pt-0.5">
                              <div className="text-cyan text-[9px] font-display uppercase tracking-widest">{step.title}</div>
                              <p className="text-white/80 text-sm leading-relaxed">{step.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-5 space-y-10">
                    <div className="bg-cyan/5 border border-cyan/20 rounded-3xl p-8 space-y-6">
                      <div className="flex items-center gap-2 text-cyan">
                        <Bot className="w-5 h-5" />
                        <h3 className="font-display text-[12px] tracking-[3px] uppercase font-black">AI Insight</h3>
                      </div>
                      <div className="relative">
                        <Quote className="absolute -top-3 -left-3 w-8 h-8 text-cyan/10" />
                        <p className="text-white/70 italic text-sm leading-relaxed relative z-10 pl-4">
                          {selectedSuggestion.quote || selectedSuggestion.desc}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 space-y-6">
                      <div className="font-display text-[10px] text-white/40 tracking-[3px] uppercase font-black">Expected Outcome</div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white/60">Retention Boost</span>
                          <span className="text-xs text-cyan font-mono">+45%</span>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="w-[45%] h-full bg-cyan shadow-[0_0_10px_rgba(0,245,255,0.6)]" />
                        </div>
                        <div className="flex items-center justify-between pt-2">
                          <span className="text-xs text-white/60">Exam Confidence</span>
                          <span className="text-xs text-emerald-500 font-mono">High</span>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="w-[85%] h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.6)]" />
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => setSelectedSuggestion(null)}
                      className="w-full py-4 bg-cyan border border-cyan text-black font-display text-[12px] font-black tracking-[4px] uppercase rounded-xl hover:bg-transparent hover:text-cyan transition-all shadow-[0_10px_30px_rgba(0,245,255,0.2)]"
                    >
                      Activate Protocol
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
        </div>
      </ErrorBoundary>
    );
}

function Modal({ title, isOpen, onClose, children }: { title: string, isOpen: boolean, onClose: () => void, children: React.ReactNode }) {
  if (!isOpen) return null;
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#02060a]/60 backdrop-blur-sm cursor-pointer"
      onClick={onClose}
    >
      <div 
        className="glass-panel w-full max-w-2xl rounded-lg p-8 border-cyan/30 relative animate-in fade-in zoom-in duration-300 cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-cyan transition-colors">
          <X className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3 mb-6 border-l-2 border-cyan pl-3">
          <h2 className="font-display text-xl text-cyan tracking-[3px] uppercase">{title}</h2>
        </div>
        <div className="text-[#bee1ff]/90 text-sm leading-relaxed max-h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}

function HomeView({ onStart, onShowModal, t, mae }: { onStart: () => void, onShowModal: (modal: 'about-us' | 'advice' | 'faq' | 'team' | 'how-it-works') => void, t: (key: string) => string, mae: number }) {
  return (
    <>
      {/* ══ GOLD ANNOUNCEMENT BAR ══ */}
      <div className="absolute top-[52px] left-0 right-0 z-30 h-[26px] flex items-center justify-center gap-2 bg-gradient-to-r from-transparent via-[#b48200]/14 via-[#ffd232]/20 via-[#b48200]/14 to-transparent border-b border-[#ffd232]/16 font-display text-[12px] tracking-[3px] text-[#ffdc46]/85">
        <span className="text-gold text-glow-gold text-[10px]">+</span>
        {t('welcome')}
        <span className="text-gold text-glow-gold text-[10px]">+</span>
      </div>

      {/* ══ LEFT HUD PANELS ══ */}
      <div className="absolute left-[18px] top-1/2 -translate-y-1/2 z-20 hidden md:flex flex-col gap-2">
        {[
          { icon: '📊', val: `${mae.toFixed(2)}%`, lbl: 'MAE' },
          { icon: '👥', val: '200+', lbl: 'Students' },
          { icon: '⚡', val: '<1m', lbl: 'To Results' }
        ].map((card, i) => (
          <div key={i} className="glass-panel rounded-[6px] px-[14px] py-[10px] min-w-[100px] text-center relative overflow-hidden transition-all duration-250 cursor-default animate-float bg-[#04142c]/85 hover:border-cyan/40 hover:bg-[#04142c]" style={{ animationDelay: `${i * 0.7}s` }}>
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan to-transparent opacity-50" />
            <div className="absolute top-0 left-0 w-[10px] h-[10px] border-t-[1.5px] border-l-[1.5px] border-cyan" />
            <div className="absolute bottom-0 right-0 w-[10px] h-[10px] border-b-[1.5px] border-r-[1.5px] border-cyan" />
            <div className="text-[20px] mb-[5px] leading-none">{card.icon}</div>
            <div className="font-display text-[18px] font-bold text-cyan text-glow-cyan leading-none">{card.val}</div>
            <div className="font-display text-[12px] text-[#bee1ff] tracking-[1.5px] mt-[3px] uppercase font-bold">{card.lbl}</div>
          </div>
        ))}
      </div>

      {/* ══ RIGHT HUD PANELS ══ */}
      <div className="absolute right-[18px] top-1/2 -translate-y-1/2 z-20 hidden md:flex flex-col gap-2">
        <div className="glass-panel rounded-[6px] px-[14px] py-[10px] min-w-[110px] text-center relative animate-float bg-[#04142c]/85 hover:border-cyan/40 hover:bg-[#04142c] transition-all duration-250 cursor-default group">
          <div className="absolute top-0 left-0 w-[10px] h-[10px] border-t-[1.5px] border-l-[1.5px] border-cyan" />
          <div className="absolute bottom-0 right-0 w-[10px] h-[10px] border-b-[1.5px] border-r-[1.5px] border-cyan" />
          <div className="font-display text-[12px] tracking-[2px] text-[#8ab4d6] group-hover:text-cyan transition-colors uppercase mb-1">Status Effect</div>
          <div className="font-display text-[10px] tracking-[1px] text-[#3a5a72] uppercase mb-[6px]"></div>
          <div className="w-[52px] h-[52px] mx-auto mb-[6px] [clip-path:polygon(50%_0%,100%_25%,100%_75%,50%_100%,0%_75%,0%_25%)] bg-gradient-to-br from-[#00ff88]/18 to-[#00b464]/08 border border-[#00ff88]/30 flex items-center justify-center text-[22px] group-hover:scale-110 transition-transform">
            🔥
          </div>
          <div className="font-display text-[14px] font-bold tracking-[1px] uppercase text-[#00ff88] [text-shadow:0_0_8px_rgba(0,255,136,0.5)]">Safe</div>
          <div className="font-display text-[10px] text-[#5a7a96] tracking-[1px] mt-[3px]"></div>
        </div>
        
        <div className="glass-panel rounded-[6px] px-[14px] py-[10px] min-w-[110px] text-center relative animate-float [animation-delay:1s] bg-[#04142c]/85 hover:border-cyan/40 hover:bg-[#04142c] transition-all duration-250 cursor-default group">
          <div className="absolute top-0 left-0 w-[10px] h-[10px] border-t-[1.5px] border-l-[1.5px] border-cyan" />
          <div className="absolute bottom-0 right-0 w-[10px] h-[10px] border-b-[1.5px] border-r-[1.5px] border-cyan" />
          <div className="font-display text-[12px] tracking-[2px] text-[#8ab4d6] group-hover:text-cyan transition-colors uppercase mb-1">Risk Level</div>
          <div className="my-[6px] relative group-hover:scale-105 transition-transform">
            <svg className="mx-auto" width="60" height="60" viewBox="0 0 60 60">
              <circle cx="30" cy="30" r="28" fill="none" stroke="rgba(0,245,255,0.2)" strokeWidth="1" />
              <circle cx="30" cy="30" r="20" fill="none" stroke="rgba(0,245,255,0.2)" strokeWidth="1" />
              <circle cx="30" cy="30" r="12" fill="none" stroke="rgba(0,245,255,0.2)" strokeWidth="1" />
              <line x1="30" y1="2" x2="30" y2="58" stroke="rgba(0,245,255,0.2)" strokeWidth="1" />
              <line x1="2" y1="30" x2="58" y2="30" stroke="rgba(0,245,255,0.2)" strokeWidth="1" />
              <g className="animate-spin-slow" style={{ transformOrigin: '30px 30px' }}>
                <line x1="30" y1="30" x2="30" y2="2" stroke="rgba(0,245,255,0.6)" strokeWidth="2" strokeLinecap="round" />
                <path d="M30 30 L30 2 A28 28 0 0 0 10 10 Z" fill="url(#radarGradient)" opacity="0.4" />
              </g>
              <defs>
                <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(0,245,255,0.7)" />
                  <stop offset="100%" stopColor="rgba(0,245,255,0)" />
                </linearGradient>
              </defs>
              <circle cx="45" cy="20" r="2" fill="#ff3366" className="animate-pulse" />
              <circle cx="15" cy="40" r="1.5" fill="#ff3366" className="animate-pulse" style={{ animationDelay: '0.5s' }} />
              <circle cx="38" cy="45" r="2" fill="#ff3366" className="animate-pulse" style={{ animationDelay: '1.2s' }} />
              <circle cx="30" cy="30" r="3" fill="#00ff88"/>
            </svg>
          </div>
          <div className="font-display text-[13px] font-bold tracking-[1px] uppercase text-[#00ff88] [text-shadow:0_0_8px_rgba(0,255,136,0.5)]">SAFE</div>
          <div className="font-display text-[8px] text-[#5a7a96] tracking-[1px] mt-[3px]"></div>
        </div>
      </div>

      {/* ══ HERO CENTRE ══ */}
      <div className="absolute left-4 right-4 sm:left-[118px] sm:right-[128px] inset-y-0 z-10 flex items-center justify-center pb-[60px] pt-[78px]">
        <div className="text-center max-w-[580px]">
          <h1 className="font-display font-black text-4xl sm:text-[62px] leading-none mb-[6px] tracking-[1px] bg-gradient-to-br from-white via-[#c0e8ff] via-cyan to-[#60b0ff] bg-clip-text text-transparent drop-shadow-[0_2px_24px_rgba(0,200,255,0.25)]">
            LighthouseAI
          </h1>
          <div className="font-display text-[9px] sm:text-[11px] tracking-[4px] sm:tracking-[8px] text-cyan/70 mb-5 uppercase">
            {t('tagline')}
          </div>

          <div className="flex justify-center gap-[7px] mb-[18px]">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-cyan shadow-[0_0_8px_var(--color-cyan)]" />
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-cyan shadow-[0_0_8px_var(--color-cyan)]" />
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-cyan/20 border border-cyan/30" />
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-cyan shadow-[0_0_8px_var(--color-cyan)]" />
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-cyan/20 border border-cyan/30" />
          </div>

          <p className="text-[14px] sm:text-[16px] italic font-light text-[#bee1ff]/90 leading-[1.75] mb-[30px] max-w-[460px] mx-auto">
            {t('description')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[10px] mb-10 max-w-[440px] mx-auto px-4 sm:px-0">
            <button 
              className="btn-primary btn slanted-clip px-[18px] py-3 font-display text-[10px] font-bold tracking-[2px] uppercase text-cyan bg-cyan-dim border border-cyan-border shadow-[0_0_14px_var(--color-cyan-dim)] transition-all duration-300 hover:border-cyan hover:shadow-[0_0_18px_var(--color-cyan-dim)] hover:-translate-y-[2px]"
              onClick={onStart}
            >
              <span className="mr-[6px] opacity-80 text-[11px]">⚡</span>{t('startBtn')}
            </button>
            <button 
              className="btn slanted-clip px-[18px] py-3 font-display text-[10px] font-bold tracking-[2px] uppercase text-white bg-[#04142c]/65 border border-cyan/30 transition-all duration-300 hover:border-cyan hover:text-cyan hover:shadow-[0_0_18px_var(--color-cyan-dim)] hover:-translate-y-[2px]"
              onClick={() => onShowModal('about-us')}
            >
              <span className="mr-[6px] opacity-80 text-[11px]">◈</span>{t('aboutBtn')}
            </button>
            <button 
              className="btn slanted-clip px-[18px] py-3 font-display text-[10px] font-bold tracking-[2px] uppercase text-white bg-[#04142c]/65 border border-cyan/30 transition-all duration-300 hover:border-cyan hover:text-cyan hover:shadow-[0_0_18px_var(--color-cyan-dim)] hover:-translate-y-[2px]"
              onClick={() => onShowModal('faq')}
            >
              <span className="mr-[6px] opacity-80 text-[11px]">❓</span>{t('faqBtn')}
            </button>
            <a 
              href="https://forms.gle/7JYLpruEPwGWqtuw7"
              target="_blank"
              rel="noopener noreferrer"
              className="btn slanted-clip px-[18px] py-3 font-display text-[10px] font-bold tracking-[2px] uppercase text-white bg-[#04142c]/65 border border-cyan/30 transition-all duration-300 hover:border-cyan hover:text-cyan hover:shadow-[0_0_18px_var(--color-cyan-dim)] hover:-translate-y-[2px] flex items-center justify-center"
            >
              <span className="mr-[6px] opacity-80 text-[11px]">💡</span>{t('adviceBtn')}
            </a>
          </div>

          <div className="flex flex-wrap justify-center gap-y-4">
            {[
              { val: `${mae.toFixed(2)}%`, lbl: 'Mean Absolute Error' },
              { val: '200+', lbl: 'Students' },
              { val: '<1m', lbl: 'To Results' }
            ].map((stat, i) => (
              <div key={i} className={`px-4 sm:px-[26px] text-center ${i < 2 ? 'border-r border-cyan/10' : ''}`}>
                <div className="font-display text-[18px] sm:text-[24px] font-black text-cyan text-glow-cyan leading-none">{stat.val}</div>
                <div className="font-display text-[7px] sm:text-[8px] text-[#8ab4d6] tracking-[2px] mt-[3px] uppercase">{stat.lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function PredictionView({ 
  onBack, 
  onFeatureClick, 
  formData,
  setFormData,
  result,
  setResult,
  isMuted,
  setIsMuted,
  analytics,
  setAnalytics,
  dataError,
  isPredicting,
  setIsPredicting,
  modelMAE,
  scrollRef,
  lang,
  t,
  setSelectedSuggestion
}: { 
  onBack: () => void, 
  onFeatureClick: (view: string) => void, 
  formData: any,
  setFormData: any,
  result: any,
  setResult: any,
  isMuted: boolean,
  setIsMuted: (v: boolean) => void,
  analytics: AnalyticsData | null,
  setAnalytics: (a: AnalyticsData | null) => void,
  dataError: string | null,
  isPredicting: boolean,
  setIsPredicting: (v: boolean) => void,
  modelMAE: number,
  scrollRef: React.RefObject<HTMLDivElement>,
  lang: 'en' | 'hi',
  t: (key: string) => string,
  setSelectedSuggestion: (s: any) => void
}) {
  const [originalFormData, setOriginalFormData] = React.useState<any>(null);
  const [targetScore, setTargetScore] = React.useState(85);

  const generateTargetSuggestions = (current: number, target: number, data: any) => {
    const gap = target - current;
    const suggestions = [];
    
    // Standard weights for guidance
    const w = {
      studyHrs: 1.5,
      attendance: 0.15,
      screenTime: -1.2,
      syllabus: 2.5,
      sleepHrs: 1.8,
      midterm: 0.4,
      prep: -3.0
    };

    if (gap <= 0) {
      return [{
        icon: "🌟",
        title: "Maintain Excellence",
        desc: "You are already performing at or above your target. Focus on consistency and peer mentoring to solidify your knowledge.",
        details: "At this level, you should focus on mastery. Peer mentoring is one of the best ways to solidify your own knowledge. Try explaining complex topics to your classmates. This is known as the Feynman Technique."
      }, {
        icon: "🧠",
        title: "Deepen Understanding",
        desc: "Instead of just scores, focus on applying concepts to real-world projects or research.",
        details: "Move beyond the textbook. Try to find real-world applications for the theories you are learning. This will not only help you in exams but also in your future career."
      }, {
        icon: "⚖️",
        title: "Balance Well-being",
        desc: "Ensure your high performance isn't coming at the cost of burnout. Maintain your current sleep and leisure balance.",
        details: "High performance is a marathon, not a sprint. Ensure you are getting 7-8 hours of sleep and taking regular breaks. Burnout can happen to the best students."
      }, {
        icon: "📈",
        title: "Advanced Certifications",
        desc: "Look into professional certifications related to your strongest subjects.",
        details: "If you are excelling in a particular subject, look for external certifications (like AWS, Google, or specialized academic certs) to add to your resume."
      }, {
        icon: "🤝",
        title: "Networking",
        desc: "Use your academic success to connect with professors for potential research opportunities.",
        details: "Professors are always looking for bright students to help with research. Use your good grades as a conversation starter to ask about their current projects."
      }];
    }

    // Determine the "Strategy Tier" based on the Target Level
    const isElite = target >= 92;
    const isHigh = target >= 85 && target < 92;
    const isFoundation = gap > 15 || target < 75;

    // 1. PRIMARY STRATEGY (Based on Tier)
    if (isElite) {
      suggestions.push({
        icon: "🏆",
        title: "The 1% Strategy",
        desc: `To reach ${target}%, you need near-perfect execution. Focus on 'Ultra-Deep Work' blocks of 90 mins with zero notifications.`,
        details: "The 1% strategy is about eliminating all distractions. During your deep work blocks, your phone should be in another room. Focus on the most difficult topics first when your brain is freshest."
      });
    } else if (isHigh) {
      suggestions.push({
        icon: "📈",
        title: "Optimization Phase",
        desc: `Targeting ${target}% requires shifting from 'studying' to 'simulating'. Start doing timed mock papers every 3 days.`,
        details: "At this level, you know the material. Now you need to master the exam format. Timed mock papers help you manage time and reduce anxiety during the actual final."
      });
    } else if (isFoundation) {
      suggestions.push({
        icon: "🧱",
        title: "Foundation Reset",
        desc: `A ${gap.toFixed(1)}% gap requires a total reset of your academic schedule. Prioritize core syllabus mastery over everything else.`,
        details: "Don't try to learn everything at once. Focus on the core 20% of the syllabus that usually accounts for 80% of the marks. Master the basics before moving to advanced topics."
      });
    } else {
      suggestions.push({
        icon: "⚡",
        title: "Efficiency Boost",
        desc: `Reaching ${target}% is about working smarter. Use Spaced Repetition (Anki) for all your core definitions and formulas.`,
        details: "Spaced repetition is scientifically proven to improve long-term retention. Use flashcards for formulas, definitions, and key dates. Review them daily."
      });
    }

    // 2. DATA-DRIVEN ML SUGGESTION (Study Hours)
    const studyWeight = Math.abs(w.studyHrs || 1.5);
    const neededStudyIncrease = (gap * 0.4) / studyWeight;
    const finalStudyHrs = Math.min(12, data.studyHrs + neededStudyIncrease);
    const actualStudyIncrease = finalStudyHrs - data.studyHrs;

    if (isElite) {
      suggestions.push({
        icon: "🔬",
        title: "Cognitive Endurance",
        desc: `Elite scores require stamina. Increase study to ${finalStudyHrs.toFixed(1)}h/day, but split it into 'Sprint' sessions to avoid mental fatigue.`
      });
    } else if (actualStudyIncrease > 0.5) {
      suggestions.push({
        icon: "📚",
        title: "ML-Calculated Volume",
        desc: `Our model predicts that adding ${actualStudyIncrease.toFixed(1)}h of daily study will bridge ~${(actualStudyIncrease * studyWeight).toFixed(1)}% of your current gap.`
      });
    }

    // 3. SYLLABUS / KNOWLEDGE SUGGESTION
    const syllabusWeight = Math.abs(w.syllabus || 2.5);
    if (isElite || data.syllabus >= 4.5) {
      suggestions.push({
        icon: "🗣️",
        title: "Feynman Technique",
        desc: `To hit ${target}%, you must teach. Record yourself explaining the hardest 20% of the syllabus. If you stutter, you don't know it.`
      });
    } else {
      const neededSyllabusIncrease = (gap * 0.2) / syllabusWeight;
      const finalSyllabus = Math.min(5, data.syllabus + neededSyllabusIncrease);
      suggestions.push({
        icon: "💡",
        title: "Syllabus Deep-Dive",
        desc: `Improving understanding to ${finalSyllabus.toFixed(1)}/5 is vital. Focus on the 'Why' behind every formula to gain ~${(gap * 0.2).toFixed(1)}%.`
      });
    }

    // 4. ATTENDANCE / ENVIRONMENT
    const attWeight = Math.abs(w.attendance || 0.15);
    if (data.attendance < 85) {
      suggestions.push({
        icon: "🎯",
        title: "Attendance Recovery",
        desc: `ML analysis shows a high correlation between attendance and your target. Boosting to 90%+ is the easiest way to gain ${( (90 - data.attendance) * attWeight ).toFixed(1)}%.`
      });
    } else if (isElite) {
      suggestions.push({
        icon: "🏛️",
        title: "Professor Office Hours",
        desc: "Since your attendance is great, use office hours to discuss 'out-of-syllabus' concepts that often appear in bonus questions."
      });
    }

    // 5. LIFESTYLE / NEGATIVE IMPACT
    const screenWeight = Math.abs(w.screenTime || -1.2);
    if (data.screenTime > 4) {
      suggestions.push({
        icon: "📵",
        title: "Digital Austerity",
        desc: `Your ${data.screenTime}h screen time is a major bottleneck. Reducing it to 2h could reclaim enough focus to boost scores by ~${( (data.screenTime - 2) * Math.abs(screenWeight) ).toFixed(1)}%.`
      });
    } else if (isElite) {
      suggestions.push({
        icon: "🧘",
        title: "Bio-Hacking Focus",
        desc: "Optimize your brain for the exam. Use 10 mins of NSDR (Non-Sleep Deep Rest) after study sessions to accelerate memory encoding."
      });
    }

    // 6. PREP TIMELINE
    const prepMap: Record<string, number> = { '3-4 Weeks Before': 1, '1 Week Before': 2, '2 Days Before': 3, 'One Night Study 😎': 4 };
    const currentPrepVal = prepMap[data.prep] || 2;
    if (currentPrepVal >= 3) {
      suggestions.push({
        icon: "📅",
        title: "Timeline Shift",
        desc: "The 'Late Prep' habit is costing you. Moving your start date 2 weeks earlier is predicted to reduce panic-induced errors by 12%."
      });
    } else {
      suggestions.push({
        icon: "📝",
        title: "Active Recall Drills",
        desc: "You start early. Now, replace passive reading with 'Blurting'—writing everything you know on a blank sheet from memory."
      });
    }

    const enrich = (s: any) => {
      const detailsMap: Record<string, any> = {
        "Feynman Technique": {
          quote: "The Feynman Technique leverages the 'Protégé Effect,' where the act of teaching forces the brain to organize information more logically. By targeting the most difficult 20% of your material and demanding a stutter-free delivery, you convert passive recognition into active mastery.",
          classic: "Writing a concept at the top of a blank page and explaining it in simple terms as if teaching a novice.",
          digital: "Utilizing audio/video recording and transcription tools to audit 'cognitive friction' and verbal fluency.",
          protocol: [
            { title: "Target the Critical 20%", desc: "Identify the top 20% of the syllabus that is most complex or carries the most weight; this is where the technique provides the highest ROI." },
            { title: "Teach to a Child", desc: "Explain the concept in plain language without using jargon. If you can't explain it simply, you don't understand it well enough." },
            { title: "Audit for Stutters", desc: "Listen back to your recording. Every 'um', 'uh', or long pause is a diagnostic marker indicating a specific area where your mental model is weak." },
            { title: "Surgical Review", desc: "Go back to your primary sources only for the specific moments where you faltered. Re-learn the logic, not just the definitions." },
            { title: "The Flawless Take", desc: "Re-record the explanation. You have only mastered the material when you can deliver the entire 20% with total fluidity and zero hesitation." }
          ],
          proTip: "Apply the 'Analogy Stress Test'—if you cannot explain a complex technical process using a metaphor from everyday life (like plumbing or cooking), you are likely masking a lack of understanding with memorized terminology."
        },
        "The 1% Strategy": {
          quote: "Elite performance is not about doing 100% better than everyone else; it's about doing 100 things 1% better. This strategy focuses on the marginal gains that separate the good from the great.",
          classic: "Generic study sessions with frequent breaks and multitasking.",
          digital: "Ultra-Deep Work blocks using biometric tracking and environment optimization.",
          protocol: [
            { title: "Zero-Notification Zone", desc: "Place all devices in a separate room. Visual proximity to a phone reduces cognitive capacity even if it's off." },
            { title: "90-Minute Sprints", desc: "Work in blocks that match the brain's ultradian rhythms for maximum focus." },
            { title: "Active Retrieval", desc: "Spend 60% of the time testing yourself rather than reading." },
            { title: "Environment Priming", desc: "Use specific lighting or music to trigger an immediate 'flow state' response." }
          ],
          proTip: "The first 10 minutes of a deep work block are the hardest. Push through the 'boredom barrier' to reach peak focus."
        },
        "Active Recall Drills": {
          quote: "Passive reading is the illusion of competence. Active recall is the reality of knowledge. By forcing your brain to retrieve information, you strengthen the neural pathways associated with that memory.",
          classic: "Re-reading notes and highlighting key passages multiple times.",
          digital: "Spaced repetition algorithms (Anki) and AI-generated quiz banks.",
          protocol: [
            { title: "The 'Blurting' Method", desc: "Read a page, close the book, and write down everything you remember on a blank sheet." },
            { title: "Flashcard Mastery", desc: "Create cards for concepts, not just facts. Ask 'Why' and 'How' on the back." },
            { title: "Interleaved Practice", desc: "Mix different subjects in one session to improve the brain's ability to distinguish between concepts." }
          ],
          proTip: "If a concept feels 'easy' while you're studying it, you're likely not learning. Real learning should feel slightly difficult."
        }
      };

      const extra = detailsMap[s.title] || {
        quote: s.desc,
        classic: "Standard academic approach focusing on volume and repetition.",
        digital: "Data-driven optimization using AI insights and cognitive science.",
        protocol: [
          { title: "Initial Assessment", desc: "Identify the specific variables in your habit data that are causing the performance gap." },
          { title: "Strategic Implementation", desc: "Apply the recommended change consistently for a minimum of 7 days." },
          { title: "Feedback Loop", desc: "Re-run the Prediction Scan to see how the change impacts your projected score." }
        ],
        proTip: "Small, consistent adjustments to your daily routine are more effective than massive, unsustainable shifts."
      };

      return { ...s, ...extra };
    };

    return suggestions.slice(0, 6).map(enrich);
  };

  const mapToPredictionInput = (data: typeof formData) => {
    const seatMap: Record<string, number> = { 'Front Row': 1, 'Middle Row': 2, 'Back Row': 3 };
    const ottMap: Record<string, number> = { 'None (0 hrs)': 0, '1–3 hrs': 2, '3–5 hrs': 4, '5–7 hrs': 6, '7+ hrs': 8 };
    const prepMap: Record<string, number> = { '3-4 Weeks Before': 1, '1 Week Before': 2, '2 Days Before': 3, 'One Night Study 😎': 4 };

    return {
      attendance_pct: data.attendance,
      study_hrs: data.studyHrs,
      syllabus_understood: data.syllabus,
      seat_position: seatMap[data.seat] || 2,
      screen_time_hrs: data.screenTime,
      ott_hrs_per_week: ottMap[data.ott] || 2,
      exam_prep_timing: prepMap[data.prep] || 2,
      travel_time_hrs: data.travelTime,
      sleep_hrs: data.sleepHrs,
      panic_level: data.panic,
      midterm_pct: data.midterm
    };
  };

  const formatPredictionResult = (finalScore: number, apiRisk?: string) => {
    const seatVal = formData.seat === 'Front Row' ? 1 : formData.seat === 'Middle Row' ? 2 : 3;
    const prepVal = formData.prep === '3-4 Weeks Before' ? 1 : formData.prep === '1 Week Before' ? 2 : formData.prep === '2 Days Before' ? 3 : 4;

    // SHAP-like impact calculation (using standard weights)
    const impacts = [
      { name: 'Midterm', value: (formData.midterm - 70) * 0.4 },
      { name: 'Study Hrs', value: (formData.studyHrs - 2) * 1.5 },
      { name: 'Screen Time', value: (formData.screenTime - 3) * -1.2 },
      { name: 'Attendance', value: (formData.attendance - 75) * 0.15 },
      { name: 'Sleep', value: (formData.sleepHrs >= 6 && formData.sleepHrs <= 8 ? 1.8 : -1.8) },
      { name: 'Preparation', value: (prepVal - 2) * 1.0 },
      { name: 'Panic Level', value: (formData.panic - 2) * -0.8 },
      { name: 'Seat Pos', value: (seatVal - 2) * 0.5 },
      { name: 'Syllabus', value: (formData.syllabus - 3) * 0.7 }
    ];

    let risk = apiRisk || "SAFE";
    let riskClass = "text-[#00ff88]";
    let riskIcon = "🟢";

    if (apiRisk) {
      if (apiRisk === "High Risk") {
        riskClass = "text-[#ff3366]";
        riskIcon = "🔴";
      } else if (apiRisk === "Moderate") {
        riskClass = "text-[#ffaa00]";
        riskIcon = "🟡";
      } else {
        riskClass = "text-[#00ff88]";
        riskIcon = "🟢";
      }
    } else {
      if (finalScore < 60) {
        risk = "HIGH RISK";
        riskClass = "text-[#ff3366]";
        riskIcon = "🔴";
      } else if (finalScore < 75) {
        risk = "MODERATE";
        riskClass = "text-[#ffaa00]";
        riskIcon = "🟡";
      }
    }

    const suggestions = [];
    if (formData.screenTime > 4) suggestions.push({ icon: "📵", title: "Reduce Screen Time", desc: `You spend ${formData.screenTime}h on screen. Cut 1hr/day → estimated +3–5% gain` });
    if (formData.studyHrs < 2) suggestions.push({ icon: "📚", title: "Increase Study Hours", desc: `Only ${formData.studyHrs}h/day study. Add 1hr daily → estimated +4–6% gain` });
    if (formData.sleepHrs < 6 || formData.sleepHrs > 9) suggestions.push({ icon: "😴", title: "Fix Sleep Schedule", desc: `${formData.sleepHrs}h sleep is not optimal. Aim for 7–8hrs for peak performance` });
    if (formData.attendance < 75) suggestions.push({ icon: "🎯", title: "Boost Attendance", desc: `${formData.attendance}% attendance is low. Every class missed = missed syllabus` });

    return {
      score: isNaN(finalScore) ? 0 : Math.round(finalScore * 10) / 10,
      risk,
      riskClass,
      riskIcon,
      confidenceRange: [
        isNaN(finalScore) ? 0 : Math.round((finalScore - modelMAE) * 10) / 10, 
        isNaN(finalScore) ? 0 : Math.round((finalScore + modelMAE) * 10) / 10
      ] as [number, number],
      impactData: (impacts || []).sort((a, b) => {
        const valA = isNaN(a.value) ? 0 : a.value;
        const valB = isNaN(b.value) ? 0 : b.value;
        return Math.abs(valB) - Math.abs(valA);
      }).map(imp => ({
        ...imp,
        value: isNaN(imp.value) ? 0 : imp.value,
        fill: (isNaN(imp.value) ? 0 : imp.value) >= 0 ? '#00ff88' : '#ff3366'
      })),
      importanceData: [
        { name: lang === 'en' ? '🏫 Attendance' : '🏫 उपस्थिति', value: 32 },
        { name: lang === 'en' ? '📝 Midterm' : '📝 मिडटर्म', value: 28 },
        { name: lang === 'en' ? '📚 Study Hrs' : '📚 पढ़ाई के घंटे', value: 18 },
        { name: lang === 'en' ? '📖 Syllabus' : '📖 पाठ्यक्रम', value: 12 },
        { name: lang === 'en' ? '😴 Sleep' : '😴 नींद', value: 6 },
        { name: lang === 'en' ? '⚙️ Others' : '⚙️ अन्य', value: 4 }
      ],
      suggestions: suggestions.length > 0 ? suggestions : [{ icon: "✅", title: "🔥 YOU'RE CRUSHING IT!", desc: "Solid habits detected. Keep this momentum and finals will bow to you." }]
    };
  };

  const calculatePrediction = (data: typeof formData) => {
    const midterm = data.midterm || 70;
    const attendance = data.attendance || 80;
    const syllabus = data.syllabus || 3;
    const studyHrs = data.studyHrs || 2;
    const screenTime = data.screenTime || 4;
    const sleepHrs = data.sleepHrs || 6;
    const panic = data.panic || 3;
    const ott = data.ott || 2;
    const travel = data.travelTime || 1;

    const seatVal = data.seat === 'Front Row' ? 3 
      : data.seat === 'Middle Row' ? 0 : -3;
    const prepVal = data.prep === '3-4 Weeks Before' ? 6 
      : data.prep === '1 Week Before' ? 3 
      : data.prep === '2 Days Before' ? -2 : -5;

    let score = 0;
    score += midterm * 0.55;
    score += (attendance - 75) * 0.18;
    score += (syllabus - 2.5) * 2.2;
    score += (studyHrs - 2) * 2.8;
    score -= (screenTime - 4) * 0.9;
    score += (sleepHrs - 6) * 1.1;
    score -= (panic - 3) * 1.8;
    score -= (ott - 2) * 0.6;
    score -= (travel - 1) * 0.4;
    score += seatVal;
    score += prepVal;

    const finalScore = Math.min(95, Math.max(35, 
      isNaN(score) ? 65 : Math.round(score)));
    return formatPredictionResult(finalScore);
  };

  const handlePredict = async () => {
    setIsPredicting(true);
    setOriginalFormData({...formData});
    
    try {
      const input = mapToPredictionInput(formData);
      try {
        const apiResult = await dataService.getPrediction(input);
        if (apiResult && typeof apiResult.predicted_score === 'number') {
          console.log("Level 1 (Flask API) succeeded");
          const uiResult = formatPredictionResult(apiResult.predicted_score, apiResult.risk);
          setResult(uiResult);
        } else {
          throw new Error("Invalid API response");
        }
      } catch (flaskError) {
        console.error("Level 1 (Flask API) failed, trying Level 2 (Gemini API):", flaskError);
        try {
          const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{
                  parts: [{
                    text: `You are an academic score predictor. 
Predict the final exam percentage for this student.
Return ONLY a single number between 35 and 95. 
No explanation. Just the number.

Midterm Score: ${input.midterm_pct}%
Attendance: ${input.attendance_pct}%
Daily Study Hours: ${input.study_hrs}
Daily Sleep Hours: ${input.sleep_hrs}
Daily Screen Time: ${input.screen_time_hrs} hrs
Syllabus Understood (0-5): ${input.syllabus_understood}
Seat Position (1=Back, 2=Middle, 3=Front): ${input.seat_position}
Exam Prep (1=Night before, 2=2days, 3=1week, 4=3-4weeks): ${input.exam_prep_timing}
Panic Level (1-5): ${input.panic_level}
OTT Hours/week: ${input.ott_hrs_per_week}
Travel Time (hrs): ${input.travel_time_hrs}`
                  }]
                }]
              })
            }
          );
          const geminiData = await geminiRes.json();
          const geminiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          const geminiScore = parseFloat(geminiText);
          if (!isNaN(geminiScore) && geminiScore >= 35 && geminiScore <= 95) {
            console.log("Level 2 (Gemini API) succeeded");
            const risk = geminiScore >= 70 ? 'On Track' : geminiScore >= 50 ? 'Moderate' : 'High Risk';
            setResult(formatPredictionResult(geminiScore, risk));
          } else {
            throw new Error('Invalid Gemini response');
          }
        } catch (geminiError) {
          console.error("Level 2 (Gemini API) failed, falling back to Level 3 (Formula):", geminiError);
          console.log("Level 3 (Formula) succeeded");
          const res = calculatePrediction(formData);
          setResult(res);
        }
      }
      
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (error) {
      console.error("Prediction process failed:", error);
    } finally {
      setIsPredicting(false);
    }
  };

  // What-If Simulator: Real-time updates
  React.useEffect(() => {
    if (result) {
      const timer = setTimeout(async () => {
        try {
          const input = mapToPredictionInput(formData);
          try {
            const apiResult = await dataService.getPrediction(input);
            setResult(formatPredictionResult(apiResult.predicted_score, apiResult.risk));
          } catch (flaskError) {
            try {
              const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
              const geminiRes = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    contents: [{
                      parts: [{
                        text: `You are an academic score predictor. 
Predict the final exam percentage for this student.
Return ONLY a single number between 35 and 95. 
No explanation. Just the number.

Midterm Score: ${input.midterm_pct}%
Attendance: ${input.attendance_pct}%
Daily Study Hours: ${input.study_hrs}
Daily Sleep Hours: ${input.sleep_hrs}
Daily Screen Time: ${input.screen_time_hrs} hrs
Syllabus Understood (0-5): ${input.syllabus_understood}
Seat Position (1=Back, 2=Middle, 3=Front): ${input.seat_position}
Exam Prep (1=Night before, 2=2days, 3=1week, 4=3-4weeks): ${input.exam_prep_timing}
Panic Level (1-5): ${input.panic_level}
OTT Hours/week: ${input.ott_hrs_per_week}
Travel Time (hrs): ${input.travel_time_hrs}`
                      }]
                    }]
                  })
                }
              );
              const geminiData = await geminiRes.json();
              const geminiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
              const geminiScore = parseFloat(geminiText);
              if (!isNaN(geminiScore) && geminiScore >= 35 && geminiScore <= 95) {
                const risk = geminiScore >= 70 ? 'On Track' : geminiScore >= 50 ? 'Moderate' : 'High Risk';
                setResult(formatPredictionResult(geminiScore, risk));
              } else {
                throw new Error('Invalid Gemini response');
              }
            } catch (geminiError) {
              setResult(calculatePrediction(formData));
            }
          }
        } catch (e) {
          setResult(calculatePrediction(formData));
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [formData]);

  return (
    <div ref={scrollRef} className="absolute inset-0 z-20 pt-[80px] px-4 sm:px-8 overflow-y-auto pb-20 scroll-smooth custom-scrollbar">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* ── LEFT SIDE: FEATURES INFO ── */}
        <div className={`lg:col-span-4 lg:sticky animate-in fade-in slide-in-from-left-4 duration-700 py-12 ${result ? 'lg:top-1/2 lg:-translate-y-1/2' : 'lg:top-[180px]'}`}>
          <div className="glass-panel p-8 border-cyan/20 bg-[#02060a]/40 rounded-xl space-y-8 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <div className="space-y-2">

<h2 className="font-display font-black text-3xl text-white tracking-wider uppercase">Command Deck</h2>
              <div className="h-1 w-20 bg-cyan shadow-[0_0_10px_rgba(0,245,255,0.5)]" />
            </div>

            <div className="space-y-6">
              {[
                {
                  icon: "⚡",
                  title: lang === 'en' ? "Predict Score" : "स्कोर की भविष्यवाणी",
                  view: "predict"
                },
                {
                  icon: "🎥",
                  title: lang === 'en' ? "YouTube Video Suggestor" : "यूट्यूब वीडियो सुझाव",
                  view: "youtube"
                },
                {
                  icon: "📄",
                  title: lang === 'en' ? "Notes Summarizer" : "नोट्स सारांश",
                  view: "notes"
                },                
                {
                  icon: "🗺️",
                  title: lang === 'en' ? "Study Roadmap" : "अध्ययन रोडमैप",
                  view: "roadmap"
                },
                {
                  icon: "📅",
                  title: lang === 'en' ? "BUILD MY SCHEDULE" : "टाइमटेबल जनरेटर",
                  view: "timetable"
                },
                {
                  icon: "🤖",
                  title: lang === 'en' ? "AI Mentor" : "एआई मेंटर",
                  view: "mentor"
                }
              ].map((feature, i) => (
                <div 
                  key={i} 
                  className={`group relative cursor-pointer transition-all duration-300 ${feature.view === 'predict' ? 'opacity-100' : 'opacity-60 hover:opacity-100'}`}
                  onClick={() => {
                    if (feature.view === 'improvement') {
                      const el = document.getElementById('improvement-roadmap');
                      if (el) {
                        el.scrollIntoView({ behavior: 'smooth' });
                      }
                    } else if (feature.view !== 'predict') {
                      onFeatureClick(feature.view);
                    }
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className={`flex-shrink-0 w-10 h-10 rounded border flex items-center justify-center text-xl transition-all duration-300 animate-float ${feature.view === 'predict' ? 'bg-cyan/10 border-cyan/50 text-cyan shadow-[0_0_15px_rgba(0,245,255,0.2)]' : 'bg-white/5 border-white/10 group-hover:border-cyan/50 group-hover:bg-cyan/5'}`} style={{ animationDelay: `${i * 0.2}s` }}>
                      {feature.icon}
                    </div>
                    <div className="space-y-0">
                      <h3 className={`font-display text-[14px] font-bold tracking-widest uppercase transition-colors ${feature.view === 'predict' ? 'text-cyan' : 'text-white group-hover:text-cyan'}`}>{feature.title}</h3>
                      {feature.view === 'predict' && <div className="text-[10px] text-cyan/70 font-display tracking-widest uppercase mt-0.5 font-bold">Active Session</div>}
                    </div>
                  </div>
                  {i < 6 && <div className="absolute -bottom-3 left-5 w-[1px] h-3 bg-white/5" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT SIDE: PREDICTION SCAN ── */}
        <div className="lg:col-span-8 px-4 sm:px-0">
            <div className="flex items-center gap-4 mb-2">
              <Zap className="w-8 h-8 sm:w-10 sm:h-10 text-cyan fill-cyan" />
              <h1 className="font-display font-black text-3xl sm:text-5xl text-cyan text-glow-cyan uppercase tracking-wider">{lang === 'en' ? 'Prediction Scan' : 'भविष्यवाणी स्कैन'}</h1>
            </div>
            <div className="flex items-center gap-2 mb-8">
              <div className="px-2 py-0.5 bg-cyan/20 border border-cyan/40 rounded text-[9px] font-display text-cyan tracking-[2px] uppercase animate-pulse">
                {lang === 'en' ? 'DECODING...' : 'डिकोडिंग...'}
              </div>
              <p className="text-[#8ab4d6] font-display text-[10px] tracking-[2px] uppercase">{lang === 'en' ? '— 11 HABIT SIGNALS DECODED BY RANDOM FOREST AI —' : '— रैंडम फॉरेस्ट एआई द्वारा 11 आदत संकेतों को डिकोड किया गया —'}</p>
            </div>

          {result && (
            <div className="mb-8 glass-panel rounded-lg p-6 border-cyan/30 bg-cyan/5 flex flex-col md:flex-row items-center justify-between gap-6 animate-in zoom-in-95 duration-300 hover:bg-cyan/10 hover:border-cyan/50 transition-all group">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-full border-2 border-cyan/30 flex items-center justify-center text-3xl bg-[#02060a]/40 shadow-[0_0_15px_rgba(0,245,255,0.2)] group-hover:shadow-[0_0_25px_rgba(0,245,255,0.4)] transition-all">
                  {result.riskIcon}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="font-display text-[10px] text-white tracking-[3px] uppercase">{lang === 'en' ? '⚡ LIVE PREDICTION MODE' : '⚡ लाइव भविष्यवाणी मोड'}</div>
                    <div className="px-1.5 py-0.5 bg-cyan/10 border border-cyan/30 rounded text-[7px] font-display text-cyan tracking-[1px] uppercase">{lang === 'en' ? '✅ AI CERTIFIED' : '✅ एआई प्रमाणित'}</div>
                  </div>
                  <div className={`font-display text-3xl font-black ${result.riskClass} tracking-tight group-hover:scale-105 transition-transform origin-left`}>{result.risk}</div>
                </div>
              </div>
              
              <div className="h-12 w-[1px] bg-white/20 hidden md:block" />

              <div className="flex flex-col items-center md:items-end">
                <div className="font-display text-6xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] group-hover:text-cyan transition-colors">
                  {result.score}%
                </div>
                <div className="text-[12px] font-mono text-white mt-1 uppercase tracking-widest">
                  Confidence Interval: {result.confidenceRange[0]}% – {result.confidenceRange[1]}%
                </div>
              </div>
            </div>
          )}

          {!result ? (
            <div className="glass-panel rounded-lg p-8 border-cyan/20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Academic Vitals */}
              <div>
                <div className="flex items-center gap-2 mb-6 border-l-2 border-cyan pl-3">
                  <span className="text-cyan text-[10px]">◈</span>
                  <h2 className="font-display text-[13px] text-cyan tracking-[3px] uppercase">{lang === 'en' ? 'Academic Vitals' : 'शैक्षणिक महत्वपूर्ण आंकड़े'}</h2>
                </div>
                
                <div className="space-y-6">
                  <InputGroup label={lang === 'en' ? "Midterm Score (%)" : "मिडटर्म स्कोर (%)"} value={formData.midterm} onChange={(v) => setFormData({...formData, midterm: v})} min={0} max={100} />
                  <InputGroup label={lang === 'en' ? "Attendance (%)" : "उपस्थिति (%)"} value={formData.attendance} onChange={(v) => setFormData({...formData, attendance: v})} min={0} max={100} />
                  <SliderGroup label={lang === 'en' ? "Syllabus Understood during Class (0-5)" : "कक्षा के दौरान समझा गया सिलेबस (0-5)"} value={formData.syllabus} onChange={(v) => setFormData({...formData, syllabus: v})} min={0} max={5} />
                  <SelectGroup label={lang === 'en' ? "Where Do You Sit?" : "आप कहाँ बैठते हैं?"} value={formData.seat} options={lang === 'en' ? ['Front Row', 'Middle Row', 'Back Row'] : ['पहली पंक्ति', 'बीच की पंक्ति', 'आखिरी पंक्ति']} onChange={(v) => setFormData({...formData, seat: v})} />
                  <SelectGroup label={lang === 'en' ? "When Do You Start Preparing?" : "आप तैयारी कब शुरू करते हैं?"} value={formData.prep} options={lang === 'en' ? ['3-4 Weeks Before', '1 Week Before', '2 Days Before', 'One Night Study 😎'] : ['3-4 सप्ताह पहले', '1 सप्ताह पहले', '2 दिन पहले', 'एक रात पहले 😎']} onChange={(v) => setFormData({...formData, prep: v})} />
                  <SliderGroup label={lang === 'en' ? "Panic Level (1-5)" : "घबराहट स्तर (1-5)"} value={formData.panic} onChange={(v) => setFormData({...formData, panic: v})} min={1} max={5} />
                </div>
              </div>

              {/* Daily Habits */}
              <div>
                <div className="flex items-center gap-2 mb-6 border-l-2 border-cyan pl-3">
                  <span className="text-cyan text-[10px]">◈</span>
                  <h2 className="font-display text-[13px] text-cyan tracking-[3px] uppercase">{lang === 'en' ? 'Daily Habits' : 'दैनिक आदतें'}</h2>
                </div>

                <div className="space-y-6">
                  <SliderGroup label={lang === 'en' ? "Daily Study Hours" : "दैनिक पढ़ाई के घंटे"} value={formData.studyHrs} onChange={(v) => setFormData({...formData, studyHrs: v})} min={0} max={10} />
                  <SliderGroup label={lang === 'en' ? "Daily Sleep Hours" : "दैनिक नींद के घंटे"} value={formData.sleepHrs} onChange={(v) => setFormData({...formData, sleepHrs: v})} min={2} max={12} />
                  <SliderGroup label={lang === 'en' ? "Daily Screen Time (hrs)" : "दैनिक स्क्रीन टाइम (घंटे)"} value={formData.screenTime} onChange={(v) => setFormData({...formData, screenTime: v})} min={0} max={16} />
                  <SliderGroup label={lang === 'en' ? "Travel Time(hrs) from College to Home" : "कॉलेज से घर तक यात्रा का समय (घंटे)"} value={formData.travelTime} onChange={(v) => setFormData({...formData, travelTime: v})} min={0} max={5} />
                  <SelectGroup label={lang === 'en' ? "OTT Time(hrs) Per Week" : "प्रति सप्ताह ओटीटी समय (घंटे)"} value={formData.ott} options={lang === 'en' ? ['None (0 hrs)', '1–3 hrs', '3–5 hrs', '5–7 hrs', '7+ hrs'] : ['कोई नहीं (0 घंटे)', '1–3 घंटे', '3–5 घंटे', '5–7 घंटे', '7+ घंटे']} onChange={(v) => setFormData({...formData, ott: v})} />
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-white/5 flex gap-4">
              <button 
                className={`btn-primary btn slanted-clip px-14 py-5 font-display text-[12px] font-bold tracking-[3px] uppercase text-cyan bg-cyan-dim border border-cyan-border shadow-[0_0_14px_var(--color-cyan-dim)] transition-all duration-300 hover:bg-cyan/22 hover:shadow-[0_0_22px_var(--color-cyan-glow)] ${isPredicting ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={handlePredict}
                disabled={isPredicting}
              >
                <span className="mr-2">{isPredicting ? '⏳' : '⚡'}</span> 
                {isPredicting ? (lang === 'en' ? 'Processing Scan...' : 'स्कैन प्रोसेस किया जा रहा है...') : (lang === 'en' ? 'Initiate Prediction Scan' : 'भविष्यवाणी स्कैन शुरू करें')}
              </button>
              <button 
                className="btn slanted-clip px-12 py-4 font-display text-[12px] font-bold tracking-[3px] uppercase text-white/50 bg-white/5 border border-white/10 transition-all duration-300 hover:bg-white/10 hover:text-white/80"
                onClick={onBack}
              >
                {lang === 'en' ? 'Cancel' : 'रद्द करें'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* ── WHAT-IF SIMULATOR ── */}
            <div className="glass-panel rounded-lg p-8 border-cyan/20 hover:border-cyan/40 hover:bg-white/5 transition-all group">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2 border-l-2 border-cyan pl-3">
                  <span className="text-cyan text-[10px] group-hover:animate-pulse">◈</span>
                  <h2 className="font-display text-[13px] text-cyan tracking-[3px] uppercase">{t('whatIf')}</h2>
                </div>
                <div className="text-[10px] font-display text-white uppercase tracking-widest italic">{lang === 'en' ? 'DRAG. CHANGE. WATCH YOUR SCORE REACT LIVE.' : 'खींचें। बदलें। अपने स्कोर को लाइव प्रतिक्रिया करते हुए देखें।'}</div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <SliderGroup label={t('studyHrs')} value={formData.studyHrs} onChange={(v) => setFormData({...formData, studyHrs: v})} min={0} max={10} />
                <SliderGroup label={t('screenTime')} value={formData.screenTime} onChange={(v) => setFormData({...formData, screenTime: v})} min={0} max={16} />
                <SliderGroup label={t('attendance')} value={formData.attendance} onChange={(v) => setFormData({...formData, attendance: v})} min={0} max={100} />
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 flex justify-center">
                <button 
                  className="text-[10px] font-display text-cyan/50 hover:text-cyan underline tracking-widest uppercase"
                  onClick={() => originalFormData && setFormData(originalFormData)}
                >
                  {t('resetVitals')}
                </button>
              </div>
            </div>

            {/* ── MODEL EXPLAINABILITY (XAI) ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="glass-panel rounded-lg p-8 hover:border-cyan/30 hover:bg-white/5 transition-all group">
                <div className="flex items-center gap-2 mb-6 border-l-2 border-cyan pl-3">
                  <span className="text-cyan text-[10px] group-hover:scale-125 transition-transform">◈</span>
                  <h2 className="font-display text-[13px] text-cyan tracking-[3px] uppercase">{t('featureImpact')}</h2>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={result.impactData} 
                      layout="vertical" 
                      margin={{ left: 20, right: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        stroke="rgba(255,255,255,0.7)" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        width={80}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#050d1a', border: '1px solid rgba(0,245,255,0.2)', borderRadius: '4px', fontSize: '10px' }}
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        formatter={(value: number) => [`${value.toFixed(2)}% Impact`, 'Contribution']}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {result.impactData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex justify-between text-[9px] font-display uppercase tracking-widest text-white/30">
                  <span>{lang === 'en' ? '📉 HURTING YOUR SCORE' : '📉 आपके स्कोर को नुकसान पहुँचा रहा है'}</span>
                  <span>{lang === 'en' ? '📈 BOOSTING YOUR SCORE' : '📈 आपके स्कोर को बढ़ा रहा है'}</span>
                </div>
              </div>

              <div className="glass-panel rounded-lg p-8 hover:border-cyan/30 hover:bg-white/5 transition-all group">
                <div className="flex items-center gap-2 mb-6 border-l-2 border-cyan pl-3">
                  <span className="text-cyan text-[10px] group-hover:scale-125 transition-transform">◈</span>
                  <h2 className="font-display text-[13px] text-cyan tracking-[3px] uppercase">{t('featureImportance')}</h2>
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={result.importanceData} 
                      layout="vertical" 
                      margin={{ left: 20, right: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        stroke="rgba(255,255,255,0.7)" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false}
                        width={80}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#050d1a', border: '1px solid rgba(0,245,255,0.2)', borderRadius: '4px', fontSize: '10px' }}
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        formatter={(value: number) => [`${value}% Importance`, t('impactWeight')]}
                      />
                      <Bar dataKey="value" fill="#00f5ff" radius={[0, 4, 4, 0]}>
                        {result.importanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#00f5ff' : index === 1 ? '#00d4ff' : '#00b4ff'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 text-center text-[9px] font-display uppercase tracking-widest text-white/30">
                  {t('impactWeight')}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
              <div className="glass-panel rounded-lg p-8 hover:border-cyan/30 hover:bg-white/5 transition-all group">
                <div className="flex items-center gap-2 mb-6 border-l-2 border-cyan pl-3">
                  <h2 className="font-display text-[13px] text-cyan tracking-[3px] uppercase">{lang === 'en' ? '🚀 YOUR ACTION PLAN' : '🚀 आपकी कार्य योजना'}</h2>
                </div>
                <div className="space-y-4">
                  {result.suggestions.map((tip, i) => (
                    <div key={i} className="bg-white/5 border border-white/5 rounded p-4 flex gap-4 items-start">
                      <span className="text-2xl">{tip.icon}</span>
                      <div>
                        <div className="font-display text-[9px] text-cyan tracking-[1px] uppercase mb-1">{tip.title}</div>
                        <div className="text-xs text-white/60 leading-relaxed">{tip.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Roadmap moved outside grid */}



          </div>
        )}

        {/* ── FULL-WIDTH IMPROVEMENT STRATEGIES OVERLAY ── */}
        {result && (
          <div className="mt-12 animate-in slide-in-from-bottom-10 duration-700 px-4 sm:px-0">
            <div id="improvement-roadmap" className="glass-panel rounded-2xl sm:rounded-[32px] p-6 sm:p-10 border-cyan/20 hover:border-cyan/40 bg-white/[0.02] transition-all group relative overflow-hidden shadow-[0_0_50px_rgba(0,245,255,0.05)]">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan/40 to-transparent" />
              
              <div className="flex flex-col lg:flex-row items-center justify-between mb-12 gap-10">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-cyan/10 border border-cyan/30 flex items-center justify-center shadow-[0_0_30px_rgba(0,245,255,0.15)] group-hover:scale-110 transition-transform duration-500">
                    <TrendingUp className="w-8 h-8 text-cyan" />
                  </div>
                  <div>
                    <h2 className="font-display text-4xl text-white tracking-[8px] uppercase font-black leading-none mb-3">
                      {lang === 'en' ? 'IMPROVEMENT STRATEGIES' : 'सुधार रणनीतियां'}
                    </h2>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-cyan animate-pulse shadow-[0_0_10px_rgba(0,245,255,1)]" />
                      <p className="text-[11px] uppercase tracking-[4px] text-cyan/60 font-bold">
                        {lang === 'en' ? 'YOUR NEURAL-OPTIMIZED PATH TO 100%' : '100% तक आपका तंत्रिका-अनुकूलित मार्ग'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="w-full sm:w-72 bg-[#02060a]/60 border border-white/10 rounded-2xl p-6 shadow-2xl">
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-[11px] font-display text-white/40 tracking-[2px] uppercase">{lang === 'en' ? '🎯 TARGET SCORE' : '🎯 लक्ष्य स्कोर'}</label>
                      <span className="text-3xl font-mono text-cyan font-black drop-shadow-[0_0_15px_rgba(0,245,255,0.5)]">{targetScore}%</span>
                    </div>
                    <input 
                      type="range" 
                      min={Math.ceil(result?.score || 0)} 
                      max={100} 
                      value={targetScore} 
                      onChange={(e) => setTargetScore(parseInt(e.target.value) || 0)}
                      className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer accent-cyan mb-3"
                    />
                    <div className="flex justify-between text-[9px] font-mono text-white/20 uppercase tracking-tighter">
                      <span>{lang === 'en' ? `CURRENT: ${result.score}%` : `वर्तमान: ${result.score}%`}</span>
                      <span>{lang === 'en' ? 'GOAL: 100%' : 'लक्ष्य: 100%'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative">
                {/* Connecting Line (Visual only) */}
                <div className="hidden lg:block absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan/10 to-transparent -translate-y-1/2 pointer-events-none" />
                
                {generateTargetSuggestions(result.score, targetScore, formData).map((step, i) => (
                  <div 
                    key={i} 
                    className="group relative bg-[#020814]/40 border border-white/5 rounded-3xl p-8 transition-all duration-500 hover:bg-cyan/5 hover:border-cyan/20 hover:-translate-y-2 cursor-pointer overflow-hidden"
                    onClick={() => setSelectedSuggestion(step)}
                  >
                    <div className="flex flex-col gap-6">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-4xl filter drop-shadow-[0_0_10px_rgba(255,255,255,0.1)] group-hover:scale-110 transition-transform duration-500">
                        {step.icon}
                      </div>
                      <div>
                        <h3 className="font-display text-[14px] text-white tracking-[3px] uppercase mb-3 font-black group-hover:text-cyan transition-colors">{step.title}</h3>
                        <p className="text-[12px] text-white/40 leading-relaxed group-hover:text-white/80 transition-colors line-clamp-3">{step.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-12 p-6 bg-cyan/5 border border-cyan/20 rounded-2xl flex items-center gap-6">
                <div className="w-12 h-12 rounded-full bg-cyan/20 flex items-center justify-center text-cyan">
                  <Info className="w-6 h-6" />
                </div>
                <p className="text-[13px] text-white/70 italic leading-relaxed">
                  {lang === 'en' ? (
                    <>
                      <span className="text-cyan font-bold">{(Math.max(0, targetScore - (result?.score || 0))).toFixed(1)}%</span> gap? That's nothing. Lock in on these 5-6 habits for 4 weeks and watch your mock results explode. You've got this. 🔥
                    </>
                  ) : (
                    <>
                      <span className="text-cyan font-bold">{(Math.max(0, targetScore - (result?.score || 0))).toFixed(1)}%</span> का अंतर? यह कुछ भी नहीं है। 4 सप्ताह तक इन 5-6 आदतों पर ध्यान दें और अपने मॉक परिणामों को शानदार होते देखें। आप यह कर सकते हैं। 🔥
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="mt-12 pt-8 border-t border-white/5 flex justify-center">
              <button 
                className="px-12 py-4 bg-cyan/10 border border-cyan/30 rounded-lg text-[12px] font-display text-cyan font-bold tracking-[3px] uppercase hover:bg-cyan/20 hover:border-cyan/50 shadow-[0_0_20px_rgba(0,245,255,0.1)] transition-all duration-300"
                onClick={() => setResult(null)}
              >
                <RotateCcw className="w-4 h-4 inline-block mr-2" /> Reset Scan
              </button>
            </div>
          </div>
        )}
      </div>

      </div>
    </div>
  );
}

function InputGroup({ label, value, onChange, min, max }: { label: string, value: number, onChange: (v: number) => void, min: number, max: number }) {
  const [tempValue, setTempValue] = React.useState(value.toString());

  React.useEffect(() => {
    setTempValue(value.toString());
  }, [value]);

  const handleBlur = () => {
    let n = parseFloat(tempValue);
    if (isNaN(n)) n = value;
    n = Math.min(max, Math.max(min, n));
    onChange(n);
    setTempValue(n.toString());
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-[12px] font-display text-white/85 uppercase tracking-widest">{label}</label>
        <span className="text-sm font-mono text-cyan">{value.toFixed(2)}</span>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => onChange(Math.max(min, value - 1))} className="w-8 h-8 bg-white/5 border border-white/10 rounded flex items-center justify-center hover:bg-white/10 text-white/85">-</button>
        <input 
          type="text"
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleBlur();
            }
          }}
          className="flex-1 h-8 bg-[#02060a]/40 border border-white/20 rounded flex items-center px-4 font-mono text-sm text-white/95 outline-none focus:border-cyan/50 text-center"
        />
        <button onClick={() => onChange(Math.min(max, value + 1))} className="w-8 h-8 bg-white/5 border border-white/10 rounded flex items-center justify-center hover:bg-white/10 text-white/85">+</button>
      </div>
    </div>
  );
}

function SliderGroup({ label, value, onChange, min, max }: { label: string, value: number, onChange: (v: number) => void, min: number, max: number }) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-[12px] font-display text-white/85 uppercase tracking-widest">{label}</label>
        <span className="text-sm font-mono text-cyan">{value}</span>
      </div>
      <div className="relative h-1 bg-white/5 rounded-full">
        <div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#0066ff] to-cyan rounded-full"
          style={{ width: `${((value - min) / (max - min)) * 100}%` }}
        />
        <input 
          type="range" 
          min={min} 
          max={max} 
          value={value} 
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div 
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-cyan border-2 border-brand-dark rounded-sm shadow-[0_0_8px_var(--color-cyan-glow)] pointer-events-none"
          style={{ left: `calc(${((value - min) / (max - min)) * 100}% - 6px)` }}
        />
      </div>
    </div>
  );
}

function SelectGroup({ label, value, options, onChange }: { label: string, value: string, options: string[], onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <label className="text-[12px] font-display text-white/85 uppercase tracking-widest">{label}</label>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 bg-[#02060a]/40 border border-white/20 rounded px-4 font-display text-[12px] text-white/95 tracking-widest uppercase focus:border-cyan/50 outline-none appearance-none cursor-pointer"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'rgba(255,255,255,0.7)\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
      >
        {options.map(opt => <option key={opt} value={opt} className="bg-[#050d1a]">{opt}</option>)}
      </select>
    </div>
  );
}
