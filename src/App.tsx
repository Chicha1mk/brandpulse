import React, { useState, useEffect, useMemo } from 'react';
// ⚠️ Потребно е да се додаде импорт за GoogleGenAI, бидејќи не е во api.ts, туку во App.tsx
import { GoogleGenAI } from '@google/genai'; 

// --- API MOCKS AND TYPES (ВНЕСЕНИ ВО App.tsx) ---

// ⚠️ КОРЕКЦИЈА НА API КЛУЧОТ ТУКА!
// Ова овозможува Vercel да го чита клучот преку променливата VITE_GEMINI_API_KEY
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY; 

// Иницијализација на Gemini клиентот
const ai = new GoogleGenAI({ apiKey });


// --- MOCK DATA И API ФУНКЦИИ (Требаше да бидат во api.ts, но се тука) ---

// --- TYPES & MOCK DATA ---

type User = {
  id: number;
  name: string;
  email: string;
  plan: 'start' | 'pro' | 'enterprise';
  brands: string[];
};

type Mention = {
  id: number;
  source: string;
  content: string;
  date: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  url: string;
};

type AIAnalysisResult = {
  text: string;
  sources: { title: string; uri: string }[];
};

// --- MOCK API (Ископирано од вашиот код) ---

const mockUser: User = {
  id: 1,
  name: "Ѓорѓи Наумов",
  email: "g.naumov@brandpulse.mk",
  plan: "pro",
  brands: ["Makstil", "T-Mobile MK", "Vitaminka"],
};

const mockMentions: Mention[] = [
  { id: 1, source: 'Twitter', content: 'Македонски Телеком има најдобра 5G мрежа во мојот град. Браво!', date: '2024-12-05', sentiment: 'positive', url: '#' },
  { id: 2, source: 'Вести 24/7', content: 'Makstil објави рекорден профит за третиот квартал, акциите пораснаа.', date: '2024-12-05', sentiment: 'positive', url: '#' },
  { id: 3, source: 'Facebook', content: 'Не сум задоволен од новата амбалажа на чоколадите на Витаминка. Не е практична.', date: '2024-12-04', sentiment: 'negative', url: '#' },
  { id: 4, source: 'IT Форум', content: 'Дали некој има искуство со новиот пакет од T-Mobile? Истите цени.', date: '2024-12-04', sentiment: 'neutral', url: '#' },
  { id: 5, source: 'Бизнис портал', content: 'Акциите на Makstil се стабилни и покрај кризата во секторот.', date: '2024-12-03', sentiment: 'neutral', url: '#' },
  { id: 6, source: 'Instagram', content: 'Новите 'Стоби Флипс' на Витаминка се топ! Мора да ги пробате.', date: '2024-12-02', sentiment: 'positive', url: '#' },
];

// --- AI SERVICE (Gemini Integration) ---

const AI_MODEL = "gemini-2.5-flash"; // Изберете го моделот што го користите

async function runAIAnalysis(query: string): Promise<AIAnalysisResult> {
    if (!apiKey) {
        throw new Error("API Key is not configured.");
    }

    const systemInstruction = `Ти си BrandPulse AI асистент. Твојата задача е да извршиш длабинска анализа на брендот или компанијата што е внесена во 'query', користејќи ги најновите информации од Google Search (Grounding). 
    Одговорот форматирај го како сеопфатен извештај, поделен на следниве секции користејќи Markdown наслови (##):
    1. **Клучни информации** (Кој е брендот, што прави, големина)
    2. **Последни вести и трендови** (Најнови 3-5 случувања за брендот во последните 3 месеци)
    3. **Анализа на пазарот** (Конкуренти, пазарна позиција, предизвици)
    4. **Сентимент и перцепција** (Како е перцепиран брендот според онлајн податоците)
    Одговорот мора да биде на македонски јазик.`;

    const response = await ai.models.generateContent({
        model: AI_MODEL,
        contents: query,
        config: {
            systemInstruction: systemInstruction,
            // Дозволете на моделот да користи Google Search (Grounding)
            tools: [{ googleSearch: {} }] 
        }
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(chunk => ({
        title: chunk.web.title || new URL(chunk.web.uri).hostname,
        uri: chunk.web.uri
    })) || [];
    
    // Филтрирање на дупликати извори
    const uniqueSources = Array.from(new Map(sources.map(item => [item.uri, item])).values());

    return {
        text: response.text,
        sources: uniqueSources
    };
}


// --- API OBJECT (Експортирање на функциите) ---

const api = {
  auth: {
    login: async (email: string, password: string): Promise<{ user: User }> => {
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
      if (email === 'demo@pulse.mk' && password === 'demo123') {
        return { user: mockUser };
      }
      throw new Error('Невалиден е-маил или лозинка.');
    },
    signup: async (data: any): Promise<{ user: User }> => {
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API delay
      if (data.email.includes('error')) {
        throw new Error('Е-маил адресата е веќе зафатена.');
      }
      return { user: mockUser };
    }
  },
  dashboard: {
    getMentions: async (): Promise<Mention[]> => {
      await new Promise(resolve => setTimeout(resolve, 1200));
      return mockMentions;
    },
    generateReport: async (): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      return;
    }
  },
  ai: {
    analyze: runAIAnalysis // Користи ја функцијата за анализа на Gemini
  }
};

// --- TYPES & STATE ---

type ViewState = 'landing' | 'login' | 'signup' | 'dashboard';

// --- COMPONENTS ---

const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const Logo = ({ dark = false, size = 'normal' }: { dark?: boolean, size?: 'normal' | 'large' }) => (
  <div className={`flex items-center gap-2.5 font-bold tracking-tight select-none ${dark ? 'text-white' : 'text-slate-900'} ${size === 'large' ? 'text-3xl' : 'text-xl'}`}>
    <div className={`relative flex items-center justify-center ${size === 'large' ? 'w-10 h-10' : 'w-8 h-8'} rounded-xl ${dark ? 'bg-gradient-to-br from-brand-500 to-brand-600' : 'bg-gradient-to-br from-brand-600 to-brand-700'} text-white shadow-lg shadow-brand-500/25`}>
      <i className="ph-bold ph-pulse text-lg"></i>
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-white opacity-20 rounded-xl animate-pulse-slow"></div>
    </div>
    <span>Brand<span className="text-brand-600">Pulse</span></span>
  </div>
);

const DemoBanner = () => (
  <div className="bg-slate-900 text-white text-[11px] font-medium py-2 px-4 text-center sticky top-0 z-[60] shadow-md border-b border-white/10">
    <div className="flex flex-col sm:flex-row justify-center items-center gap-1.5">
      <span className="bg-brand-500/20 text-brand-300 border border-brand-500/30 px-2 py-0.5 rounded-[4px] uppercase tracking-wider">DEMO</span> 
      <span className="opacity-80">Податоците се симулирани. Backend интеграција наскоро.</span>
    </div>
  </div>
);

// --- LANDING PAGE ---

const LandingPage = ({ onNavigate }: { onNavigate: (view: ViewState) => void }) => {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-brand-100 selection:text-brand-900 overflow-x-hidden">
      {/* Navbar */}
      <header className="fixed w-full top-0 glass z-40 border-b border-slate-200/60 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-2 sm:gap-4">
            <button onClick={() => onNavigate('login')} className="text-slate-600 hover:text-brand-600 font-medium transition px-3 py-2 text-sm">
              Најави се
            </button>
            <button onClick={() => onNavigate('signup')} className="bg-slate-900 text-white px-5 py-2.5 rounded-full font-medium hover:bg-slate-800 transition shadow-lg shadow-slate-900/20 text-sm transform active:scale-95">
              Започни Бесплатно
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 relative">
        {/* Background Decor */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full overflow-hidden -z-10 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-200/40 rounded-full mix-blend-multiply filter blur-[100px] animate-blob"></div>
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-200/40 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-blue-200/40 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm border border-brand-100 px-4 py-1.5 rounded-full text-sm font-medium text-brand-700 mb-8 shadow-sm animate-fade-in hover:shadow-md transition cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
            </span>
            <span>Ново: AI Search Intelligence v2.0</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight mb-8 leading-[1.1] animate-slide-up">
            Платформа за <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600">бренд мониторинг</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed px-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Интелигентна AI платформа за следење на спомнувања на социјални мрежи, портали и форуми во реално време.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <button onClick={() => onNavigate('signup')} className="w-full sm:w-auto px-8 py-4 bg-brand-600 text-white rounded-2xl font-semibold text-lg hover:bg-brand-700 transition shadow-xl shadow-brand-600/25 hover:shadow-brand-600/40 hover:-translate-y-1">
              Пробајте 7 дена бесплатно
            </button>
          </div>
          
          {/* Social Proof / Trust */}
          <div className="mt-16 pt-8 border-t border-slate-100/50 animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-6">Им веруваат на 50+ успешни компании</p>
            <div className="flex flex-wrap justify-center gap-8 opacity-40 grayscale mix-blend-multiply">
              {/* Placeholders for logos */}
              <div className="h-8 w-24 bg-slate-400/20 rounded"></div>
              <div className="h-8 w-24 bg-slate-400/20 rounded"></div>
              <div className="h-8 w-24 bg-slate-400/20 rounded"></div>
              <div className="h-8 w-24 bg-slate-400/20 rounded hidden sm:block"></div>
              <div className="h-8 w-24 bg-slate-400/20 rounded hidden sm:block"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
             <h2 className="text-base font-semibold text-brand-600 tracking-wide uppercase mb-2">Карактеристики</h2>
             <h3 className="text-3xl sm:text-4xl font-bold text-slate-900">Сè што ви треба за вашиот бренд</h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: 'ph-ear', title: 'Real-time Мониторинг', desc: 'Инстант известувања кога некој ќе го спомне вашиот бренд на Facebook, Twitter, Instagram или вести.' },
              { icon: 'ph-chart-pie-slice', title: 'AI Сентимент Анализа', desc: 'Нашата напредна AI технологија автоматски го класифицира мислењето на корисниците како позитивно, негативно или неутрално.' },
              { icon: 'ph-globe-hemisphere-west', title: 'Global Intelligence', desc: 'Користете ја моќта на Google Search Grounding за да добиете најнови информации и трендови за пазарот.' },
            ].map((f, i) => (
              <div key={i} className="group bg-white p-8 rounded-3xl border border-slate-100 hover:border-brand-200/50 hover:shadow-2xl hover:shadow-brand-900/25 transition-all duration-500 relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-brand-50 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                
                <div className="relative w-14 h-14 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mb-6 border border-brand-100 group-hover:bg-brand-600 group-hover:text-white transition-colors duration-300">
                  <i className={`ph ${f.icon} text-3xl`}></i>
                </div>
                <h3 className="relative text-xl font-bold mb-3 text-slate-900">{f.title}</h3>
                <p className="relative text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">Транспарентни цени</h2>
            <p className="text-slate-600 text-lg">Без скриени трошоци. Откажете било кога.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {[
              { name: 'Start', price: '300', features: ['1 Бренд', '500 спомнувања/месечно', 'Дневни извештаи', 'Email поддршка'] },
              { name: 'Pro', price: '1000', popular: true, features: ['3 Бренда', 'Неограничени спомнувања', 'AI Сентимент анализа', 'Real-time alerts', 'PDF Експорт'] },
              { name: 'Enterprise', price: '3000', features: ['10 Брендови', 'Неограничено', 'API Пристап', 'Посветен менаџер', 'Custom интеграции'] },
            ].map((plan, i) => (
              <div key={i} className={`flex flex-col relative p-8 rounded-3xl transition-all duration-300 ${plan.popular ? 'border-2 border-brand-500 shadow-2xl shadow-brand-900/10 scale-100 md:-translate-y-4 bg-white z-10' : 'border border-slate-200 bg-white hover:border-brand-200 hover:shadow-xl'}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-brand-600 to-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg uppercase tracking-wider">
                    Најпопуларен
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline">
                    <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                    <span className="text-slate-500 ml-2 font-medium">МКД/мес</span>
                  </div>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feat, j) => (
                    <li key={j} className="flex items-start text-slate-600 text-sm">
                      <i className="ph-fill ph-check-circle text-brand-600 mr-3 text-lg shrink-0 mt-0.5"></i>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                <button onClick={() => onNavigate('signup')} className={`w-full py-4 rounded-xl font-bold transition-all ${plan.popular ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-lg shadow-brand-600/30 hover:shadow-brand-600/50' : 'bg-slate-50 text-slate-900 hover:bg-slate-100 border border-slate-200'}`}>
                  Одбери {plan.name}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-16 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 flex flex-col items-center text-center">
          <Logo dark size="large" />
          <p className="mt-4 max-w-md text-slate-500">
            Напредна алатка за следење и анализа на брендови, дизајнирана за максимална прецизност и контрола.
          </p>
          <div className="flex flex-wrap justify-center gap-8 mt-10 text-sm font-medium">
             <a href="#" className="hover:text-white transition">За нас</a>
             <a href="#" className="hover:text-white transition">Цени</a>
             <a href="#" className="hover:text-white transition">Блог</a>
             <a href="#" className="hover:text-white transition">Политика за приватност</a>
             <a href="#" className="hover:text-white transition">Услови за користење</a>
          </div>
          <div className="mt-12 pt-8 border-t border-slate-800 w-full flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <p>&copy; 2024 BrandPulse. Made with <i className="ph-fill ph-heart text-red-500 mx-1"></i>.</p>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white"><i className="ph-fill ph-facebook-logo text-xl"></i></a>
              <a href="#" className="hover:text-white"><i className="ph-fill ph-twitter-logo text-xl"></i></a>
              <a href="#" className="hover:text-white"><i className="ph-fill ph-linkedin-logo text-xl"></i></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// --- AUTH PAGES ---

const AuthPage = ({ type, onLogin }: { type: 'login' | 'signup', onLogin: (user: User) => void }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    plan: 'start'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (type === 'login') {
        const { user } = await api.auth.login(formData.email, formData.password);
        onLogin(user);
      } else {
        const { user } = await api.auth.signup(formData);
        onLogin(user);
      }
    } catch (err: any) {
      setError(err.message || 'Настана грешка.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-brand-200/30 rounded-full blur-[80px]"></div>
         <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-200/30 rounded-full blur-[80px]"></div>
      </div>

      <div className="bg-white p-8 sm:p-12 rounded-3xl shadow-xl shadow-brand-900/5 w-full max-w-md border border-slate-100 relative z-10 animate-slide-up">
        <div className="flex justify-center mb-10">
          <Logo size="large" />
          </div>
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2 text-slate-900 tracking-tight">
          {type === 'login' ? 'Добредојдовте назад' : 'Започнете сега'}
        </h2>
        <p className="text-center text-slate-500 mb-8">
          {type === 'login' ? 'Внесете ги вашите податоци за најава' : 'Креирајте бесплатна сметка за неколку секунди'}
        </p>
        
        {error && (
          <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm mb-6 flex items-start border border-rose-100">
            <i className="ph-fill ph-warning-circle text-lg mr-2 shrink-0 mt-0.5"></i>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {type === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Име и Презиме</label>
              <div className="relative group">
                <i className="ph ph-user absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-brand-500 transition-colors"></i>
                <input
                  required
                  type="text"
                  placeholder="Вашето име"
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition bg-slate-50 focus:bg-white"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Е-маил адреса</label>
            <div className="relative group">
                <i className="ph ph-envelope-simple absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-brand-500 transition-colors"></i>
                <input
                  required
                  type="email"
                  placeholder="name@company.com"
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition bg-slate-50 focus:bg-white"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Лозинка</label>
            <div className="relative group">
                <i className="ph ph-lock-key absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-brand-500 transition-colors"></i>
                <input
                  required
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition bg-slate-50 focus:bg-white"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
            </div>
          </div>

          {type === 'signup' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-1">Одберете Пакет</label>
              <div className="relative group">
                <i className="ph ph-package absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg group-focus-within:text-brand-500 transition-colors"></i>
                <select
                  className="w-full pl-11 pr-10 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition appearance-none bg-slate-50 focus:bg-white"
                  value={formData.plan}
                  onChange={e => setFormData({...formData, plan: e.target.value})}
                >
                  <option value="start">Start (300 МКД)</option>
                  <option value="pro">Pro (1000 МКД)</option>
                  <option value="enterprise">Enterprise (3000 МКД)</option>
                </select>
                <i className="ph ph-caret-down absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
              </div>
            </div>
          )}

          <button
            disabled={loading}
            type="submit"
            className="w-full bg-brand-600 text-white py-3.5 rounded-xl font-bold hover:bg-brand-700 transition flex justify-center items-center gap-2 mt-2 shadow-lg shadow-brand-600/25 active:scale-[0.98]"
          >
            {loading ? <Spinner /> : (type === 'login' ? 'Најави се' : 'Креирај сметка')}
          </button>
        </form>

        <p className="text-center mt-8 text-sm text-slate-600">
          {type === 'login' ? 'Немате профил?' : 'Веќе имате профил?'}
          <button 
            onClick={() => window.location.reload()}
            className="text-brand-600 font-bold ml-1 hover:text-brand-700 transition"
          >
             {type === 'login' ? 'Регистрирајте се' : 'Најавете се'}
          </button>
        </p>
      </div>
    </div>
  );
};

// --- DASHBOARD COMPONENTS ---

const SentimentBadge = ({ type }: { type: 'positive' | 'negative' | 'neutral' }) => {
  const styles = {
    positive: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20',
    negative: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20',
    neutral: 'bg-slate-50 text-slate-600 border-slate-200 ring-slate-400/20'
  };

  const icons = {
    positive: 'ph-smiley',
    negative: 'ph-smiley-sad',
    neutral: 'ph-smiley-meh'
  };

  const labels = {
    positive: 'Позитивно',
    negative: 'Негативно',
    neutral: 'Неутрално'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ring-1 ${styles[type]}`}>
      <i className={`ph-fill ${icons[type]}`}></i>
      {labels[type]}
    </span>
  );
};

const SimpleBarChart = ({ data }: { data: { label: string, value: number }[] }) => {
  const max = Math.max(...data.map(d => d.value));
  return (
    <div className="h-48 flex items-end justify-between gap-2 sm:gap-4 px-2 pt-6">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center w-full group cursor-pointer">
          <div className="relative w-full flex items-end justify-center h-40">
            <div 
              className="w-full max-w-[32px] sm:max-w-[48px] bg-brand-100 rounded-t-md group-hover:bg-brand-500 transition-all duration-300 relative overflow-hidden"
              style={{ height: `${(d.value / max) * 100}%` }}
            >
               {/* Animated Gradient Overlay */}
               <div className="absolute inset-0 bg-gradient-to-t from-brand-600 to-brand-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            {/* Tooltip */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 pointer-events-none shadow-md whitespace-nowrap z-20">
               {d.value} Mentions
            </div>
          </div>
          <div className="text-[10px] sm:text-xs text-slate-400 mt-3 font-medium group-hover:text-brand-600 transition-colors">{d.label}</div>
        </div>
      ))}
    </div>
  );
};

// --- AI INTELLIGENCE COMPONENT ---

const AIIntelligenceView = ({ user }: { user: User }) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await api.ai.analyze(query);
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Search Intelligence</h2>
        <p className="text-slate-500">Добијте детална анализа на пазарот користејќи Google Search податоци во реално време.</p>
      </div>

      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 mb-8 sticky top-20 z-10 md:static">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 group">
             <i className="ph ph-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl group-focus-within:text-brand-500 transition-colors"></i>
             <input 
              type="text" 
              placeholder="Внесете име на бренд (пр. 'Алкалоид', 'Телеком')..." 
              className="w-full pl-12 pr-4 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition bg-slate-50 focus:bg-white text-base"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="bg-brand-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-brand-700 transition flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-brand-600/20 active:translate-y-0.5"
          >
            {loading ? <Spinner /> : <><i className="ph-bold ph-sparkle"></i> Анализирај</>}
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-rose-50 text-rose-600 p-4 rounded-xl border border-rose-100 flex items-start gap-3 animate-fade-in mb-6">
          <i className="ph-fill ph-warning-circle text-xl mt-0.5"></i>
          <div>{error}</div>
        </div>
      )}

      {result && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <div className="bg-brand-100 p-2 rounded-lg text-brand-600">
                <i className="ph-fill ph-robot text-xl"></i>
              </div>
              Резултат од Анализата
            </h3>
            <div className="prose prose-slate prose-a:text-brand-600 prose-headings:text-slate-900 max-w-none text-slate-600 leading-relaxed whitespace-pre-line">
              {result.text}
            </div>
          </div>

          {result.sources.length > 0 && (
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">Користени Извори</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {result.sources.map((source, idx) => (
                  <a 
                    key={idx} 
                    href={source.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-start gap-4 p-4 rounded-xl hover:bg-brand-50/50 transition border border-slate-100 hover:border-brand-200 group h-full"
                  >
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:text-brand-600 group-hover:bg-white group-hover:shadow-sm transition shrink-0 mt-0.5">
                      <i className="ph ph-link text-lg"></i>
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-900 group-hover:text-brand-600 transition truncate text-sm mb-0.5">{source.title}</div>
                      <div className="text-xs text-slate-400 truncate font-mono">{new URL(source.uri).hostname}</div>
                    </div>
                    <i className="ph ph-arrow-square-out text-slate-300 ml-auto opacity-0 group-hover:opacity-100 transition shrink-0"></i>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    };
    
    // --- DASHBOARD COMPONENTS (продолжение) ---
    
    // ... продолжува кодот на компонентите ...

const Dashboard = ({ user, logout }: { user: User, logout: () => void }) => {
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [view, setView] = useState<'overview' | 'intelligence' | 'settings'>('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await api.dashboard.getMentions();
      setMentions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    setGeneratingPdf(true);
    await api.dashboard.generateReport();
    setGeneratingPdf(false);
    alert('PDF извештајот е успешно генериран и испратен на вашиот е-маил!');
  };

  const handleCancelSub = async () => {
    if (confirm('Дали сте сигурни дека сакате да ја откажете претплатата?')) {
      // Simulate cancellation logic
      alert('Претплатата е успешно откажана.');
      logout();
    }
  };

  const sentimentCounts = useMemo(() => {
    return mentions.reduce((acc, mention) => {
      acc[mention.sentiment] = (acc[mention.sentiment] || 0) + 1;
      return acc;
    }, {} as Record<'positive' | 'negative' | 'neutral', number>);
  }, [mentions]);

  const chartData = useMemo(() => [
    { label: 'Позитивен', value: sentimentCounts.positive || 0 },
    { label: 'Неутрален', value: sentimentCounts.neutral || 0 },
    { label: 'Негативен', value: sentimentCounts.negative || 0 },
  ], [sentimentCounts]);

  const MentionItem = ({ mention }: { mention: Mention }) => (
    <div className="p-4 rounded-xl hover:bg-slate-50 transition border border-slate-100 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0 mt-0.5 ${mention.sentiment === 'positive' ? 'bg-emerald-500' : mention.sentiment === 'negative' ? 'bg-rose-500' : 'bg-slate-500'}`}>
        <i className={`ph-fill ${mention.sentiment === 'positive' ? 'ph-check-circle' : mention.sentiment === 'negative' ? 'ph-x-circle' : 'ph-info'}`}></i>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <SentimentBadge type={mention.sentiment} />
            <span className="text-xs text-slate-400">{mention.date}</span>
          </div>
          <a href={mention.url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-600 hover:text-brand-700 font-medium">
            Види Повеќе <i className="ph ph-arrow-square-out text-sm ml-1"></i>
          </a>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed line-clamp-2">{mention.content}</p>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (view) {
      case 'overview':
        return (
          <div>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {/* Stat Card: Total Mentions */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-slate-500">Вкупно Спомнувања</p>
                  <i className="ph ph-hash text-2xl text-brand-500"></i>
                </div>
                <p className="text-3xl font-bold text-slate-900">{loading ? <Spinner /> : mentions.length}</p>
                <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
                  <i className="ph ph-caret-up-fill text-sm"></i> 
                  +15% vs. лани
                </p>
              </div>

              {/* Stat Card: Positive Sentiment */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-slate-500">Позитивен Сентимент</p>
                  <i className="ph ph-chart-line-up text-2xl text-emerald-500"></i>
                </div>
                <p className="text-3xl font-bold text-slate-900">{loading ? <Spinner /> : Math.round((sentimentCounts.positive || 0) / mentions.length * 100) || 0}%</p>
                <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                  <i className="ph ph-caret-down-fill text-sm"></i> 
                  -5% vs. минатиот месец
                </p>
              </div>

              {/* Stat Card: Watched Brands */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-slate-500">Следени Брендови</p>
                  <i className="ph ph-tag text-2xl text-violet-500"></i>
                </div>
                <p className="text-3xl font-bold text-slate-900">{user.brands.length}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {user.brands.join(', ')}
                </p>
              </div>
            </div>

            <div className="grid lg:grid-cols-7 gap-6">
              {/* Chart Card (Col 1) */}
              <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Анализа на Сентимент</h3>
                {loading ? (
                  <div className="h-48 flex items-center justify-center text-slate-400">
                    <Spinner /> Вчитување податоци...
                  </div>
                ) : (
                  <SimpleBarChart data={chartData} />
                )}
              </div>

              {/* Mentions List (Col 2) */}
              <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-900">Последни Спомнувања</h3>
                  <button onClick={handleGeneratePDF} disabled={generatingPdf} className="flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 transition disabled:opacity-50">
                    {generatingPdf ? <Spinner /> : <i className="ph ph-file-pdf text-lg"></i>} 
                    {generatingPdf ? 'Генерирам...' : 'Генерирај PDF'}
                  </button>
                </div>

                <div className="space-y-3">
                  {loading ? (
                    <div className="p-4 flex justify-center items-center text-slate-400">
                      <Spinner /> 
                    </div>
                  ) : (
                    mentions.slice(0, 5).map(m => <MentionItem key={m.id} mention={m} />)
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      case 'intelligence':
        return <AIIntelligenceView user={user} />;
      case 'settings':
        return (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Профил и Претплата</h2>
              <div className="space-y-4 text-sm text-slate-700 mb-8">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="font-medium text-slate-500">Име:</span>
                  <span>{user.name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="font-medium text-slate-500">Е-маил:</span>
                  <span>{user.email}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="font-medium text-slate-500">План:</span>
                  <span className="font-bold text-brand-600 uppercase">{user.plan}</span>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 mb-4 pt-6 border-t border-slate-100">Управување</h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={handleCancelSub} className="w-full py-3.5 bg-rose-50 text-rose-600 rounded-xl font-bold hover:bg-rose-100 transition border border-rose-200">
                  Откажи Претплата
                </button>
                <button onClick={logout} className="w-full py-3.5 bg-slate-100 text-slate-900 rounded-xl font-bold hover:bg-slate-200 transition border border-slate-200">
                  Одјави се
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };


  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-brand-100 selection:text-brand-900">
      <DemoBanner />
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-10 sm:top-[44px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-700 hidden sm:block">Здраво, {user.name.split(' ')[0]}!</span>
            <button onClick={logout} className="w-10 h-10 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center hover:bg-brand-100 transition shrink-0">
              <i className="ph ph-sign-out text-xl"></i>
            </button>
          </div>
        </div>
        
        {/* Tabs/Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex border-t border-slate-100">
          {['overview', 'intelligence', 'settings'].map(nav => (
            <button
              key={nav}
              onClick={() => setView(nav as any)}
              className={`px-4 py-3 text-sm font-semibold transition relative ${view === nav ? 'text-brand-600 border-b-2 border-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {nav === 'overview' ? 'Преглед' : nav === 'intelligence' ? 'AI Анализа' : 'Подесувања'}
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">{view === 'overview' ? 'Контролна Табла' : view === 'intelligence' ? 'AI Search Intelligence' : 'Подесувања'}</h1>
        {renderContent()}
      </main>
    </div>
  );
};


// --- MAIN APP ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<ViewState>('landing');

  useEffect(() => {
    // Check for existing session (e.g., in localStorage)
    const savedUser = localStorage.getItem('brandpulse_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setView('dashboard');
    }
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    setView('dashboard');
    localStorage.setItem('brandpulse_user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    setView('landing');
    localStorage.removeItem('brandpulse_user');
  };

  const handleNavigate = (newView: ViewState) => {
    setView(newView);
  };

  if (user && view === 'dashboard') {
    return <Dashboard user={user} logout={handleLogout} />;
  }
  
  if (view === 'login' || view === 'signup') {
    return <AuthPage type={view} onLogin={handleLogin} />;
  }

  return <LandingPage onNavigate={handleNavigate} />;
}