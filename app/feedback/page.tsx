'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Sparkles, MessageSquare, Star, Utensils, Zap, Heart, Smile, Frown, Meh, Laugh, Ghost } from 'lucide-react';

const RATING_TYPES = [
  { id: 'taste', label: 'Legendary Taste', icon: Utensils },
  { id: 'cleanliness', label: 'Hygiene & Clean', icon: Sparkles },
  { id: 'facilities', label: 'Sitting Ambience', icon: Laugh },
  { id: 'packing', label: 'Packing Quality', icon: Zap },
  { id: 'speed', label: 'Service Speed', icon: Heart }
];

const RATING_LEVELS = [
  { value: '1', emoji: <Frown className="w-6 h-6" />, label: 'Poor' },
  { value: '2', emoji: <Meh className="w-6 h-6" />, label: 'Meh' },
  { value: '3', emoji: <Smile className="w-6 h-6" />, label: 'Good' },
  { value: '4', emoji: <Laugh className="w-6 h-6" />, label: 'Great' },
  { value: '5', emoji: <Sparkles className="w-6 h-6" />, label: 'Legendary' }
];

export default function FeedbackPage() {
  const [submitted, setSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    fullName: '',
    mobileNumber: '',
    taste: '',
    cleanliness: '',
    facilities: '',
    packing: '',
    speed: '',
    comments: ''
  });

  const handleChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleNext = () => {
    if (currentStep < 3) setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center px-4">
        <div className="w-32 h-32 bg-brand-bg rounded-full flex items-center justify-center mb-10 translate-y-0 animate-bounce transition-all shadow-premium">
          <Sparkles size={64} className="text-brand-red animate-pulse" />
        </div>
        <h1 className="text-5xl lg:text-7xl font-bold text-brand-text mb-6 tracking-tighter leading-none">
          YOU&apos;RE <br />
          <span className="text-brand-red">ABSOLUTE MAGIC!</span>
        </h1>
        <p className="text-brand-muted max-w-md font-medium text-lg leading-relaxed">
          Your feedback is fuel for our legendary kitchen. We appreciate you more than extra fries!
        </p>
        <Link href="/" className="btn-primary mt-12 py-5 px-16 text-xl shadow-premium group">
          ORDER MORE MAGIC <ArrowRight className="inline ml-2 group-hover:translate-x-2 transition-transform" />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-20 lg:py-24 relative overflow-hidden">
      {/* Background Decor System */}
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-brand-red/5 rounded-full blur-[150px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-brand-orange/5 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Floating Emojis */}
      <div className="absolute top-[10%] left-[10%] animate-float opacity-20 hidden md:block">
        <Utensils size={48} className="text-brand-red" />
      </div>
      <div className="absolute bottom-[20%] right-[10%] animate-float opacity-20 delay-500 hidden md:block">
        <Heart size={36} className="text-brand-orange" />
      </div>

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        <div className="mb-12 text-center pt-16 md:pt-20">
          <Link href="/" className="group inline-flex items-center gap-2 text-brand-muted hover:text-brand-red transition-all font-bold text-[9px] uppercase tracking-[0.3em] mb-6 bg-brand-bg px-4 py-1.5 rounded-full border border-brand-border">
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          <h1 className="text-4xl lg:text-6xl font-bold text-brand-text tracking-tighter leading-[0.9] mb-4">
            Help Us Become <br />
            <span className="text-brand-red">The Ultimate.</span>
          </h1>
          <p className="text-brand-muted font-bold text-sm uppercase tracking-widest">Step {currentStep} of 3 — Your voice matters</p>
          
          {/* Progress Indicator */}
          <div className="flex justify-center gap-2 mt-6">
            {[1, 2, 3].map(step => (
              <div 
                key={step} 
                className={`h-1 rounded-full transition-all duration-500 ${currentStep === step ? 'w-10 bg-brand-red' : 'w-4 bg-brand-border'}`}
              />
            ))}
          </div>
        </div>

        <div className="glass rounded-[2.5rem] p-6 md:p-14 border-white shadow-premium relative overflow-hidden transition-all hover:shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-red via-brand-orange to-brand-red animate-shimmer" />
          
          <form onSubmit={handleSubmit} className="relative z-10">
            {/* STEP 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-10 animate-slide-up">
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-bold text-brand-text uppercase tracking-tight">Who are we talking to?</h3>
                  <p className="text-brand-muted text-sm font-medium">This helps us personalize our response to you.</p>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-brand-muted uppercase tracking-[0.15em] ml-2">Full Legal Name</label>
                    <input
                      type="text"
                      name="fullName"
                      placeholder="Elon Musk"
                      value={formData.fullName}
                      onChange={(e) => handleChange('fullName', e.target.value)}
                      className="w-full bg-brand-bg border border-brand-border rounded-2xl px-6 py-4 text-brand-text placeholder-brand-muted focus:outline-none focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red transition-all font-bold text-base"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-brand-muted uppercase tracking-[0.15em] ml-2">Mobile Hotline</label>
                    <input
                      type="tel"
                      name="mobileNumber"
                      placeholder="+91 ..."
                      value={formData.mobileNumber}
                      onChange={(e) => handleChange('mobileNumber', e.target.value)}
                      className="w-full bg-brand-bg border border-brand-border rounded-2xl px-6 py-4 text-brand-text placeholder-brand-muted focus:outline-none focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red transition-all font-bold text-base"
                    />
                  </div>
                </div>
                <button type="button" onClick={handleNext} className="w-full btn-primary py-4.5 text-lg shadow-premium flex items-center justify-center gap-3">
                  LET&apos;S RATE THE FOOD <ArrowRight size={18} />
                </button>
              </div>
            )}

            {/* STEP 2: Ratings */}
            {currentStep === 2 && (
              <div className="space-y-10 animate-slide-up">
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-bold text-brand-text uppercase tracking-tight">The Experience Scale</h3>
                  <p className="text-brand-muted text-sm font-medium">Select to express your legendary feelings.</p>
                </div>
                
                <div className="space-y-6">
                  {RATING_TYPES.map((type) => (
                    <div key={type.id} className="space-y-4 p-5 bg-brand-bg/50 rounded-[2rem] border border-brand-border hover:border-brand-red/30 transition-all">
                      <div className="flex items-center gap-3 ml-2">
                        <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-brand-red shadow-soft">
                          <type.icon size={18} />
                        </div>
                        <h4 className="text-[11px] font-bold text-brand-text uppercase tracking-widest">{type.label}</h4>
                      </div>
                      <div className="flex justify-between gap-1.5 max-w-lg mx-auto">
                        {RATING_LEVELS.map((level) => (
                          <button
                            key={level.value}
                            type="button"
                            onClick={() => handleChange(type.id, level.value)}
                            className={`flex-1 flex flex-col items-center gap-1.5 transition-all py-2 rounded-xl border ${
                              (formData as any)[type.id] === level.value 
                                ? 'bg-brand-red border-brand-red text-white scale-105 shadow-lg' 
                                : 'bg-white border-brand-border text-brand-muted hover:border-brand-red/30'
                            }`}
                          >
                            <div className="scale-75 md:scale-90">{level.emoji}</div>
                            <span className="text-[8px] font-bold uppercase tracking-tight">{level.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={handleBack} className="flex-1 btn-secondary py-4.5 text-sm">BACK</button>
                  <button type="button" onClick={handleNext} className="flex-[2] btn-primary py-4.5 text-sm">ALMOST DONE <ArrowRight size={16} className="inline ml-2" /></button>
                </div>
              </div>
            )}

            {/* STEP 3: Comments */}
            {currentStep === 3 && (
              <div className="space-y-10 animate-slide-up">
                <div className="text-center space-y-1">
                  <h3 className="text-xl font-bold text-brand-text uppercase tracking-tight">Final Words of Wisdom</h3>
                  <p className="text-brand-muted text-sm font-medium">Anything else on your mind?</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 ml-3">
                    <MessageSquare size={20} className="text-brand-red" />
                    <span className="text-[9px] font-bold text-brand-muted uppercase tracking-[0.15em]">Open Mic Section</span>
                  </div>
                  <textarea
                    name="comments"
                    rows={4}
                    placeholder="Share your thoughts here..."
                    value={formData.comments}
                    onChange={(e) => handleChange('comments', e.target.value)}
                    className="w-full bg-brand-bg border border-brand-border rounded-[2rem] px-8 py-8 text-brand-text placeholder-brand-muted focus:outline-none focus:ring-4 focus:ring-brand-red/5 focus:border-brand-red transition-all font-medium text-base shadow-inner"
                  />
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={handleBack} className="flex-1 btn-secondary py-4.5 text-sm">EDIT</button>
                  <button type="submit" className="flex-[3] btn-primary py-4.5 text-lg shadow-premium flex items-center justify-center gap-3 group">
                    RECORD FEEDBACK <Send size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Support Section */}
        <div className="mt-20 text-center space-y-6">
          <p className="text-[10px] font-bold text-brand-muted uppercase tracking-[0.4em]">Want to talk to a human?</p>
          <div className="flex justify-center gap-8">
            <Link href="https://wa.link/mnta3l" target="_blank" className="flex items-center gap-3 text-brand-text hover:text-brand-red font-bold text-xs uppercase tracking-widest transition-all">
              <Zap size={16} /> WhatsApp Support
            </Link>
            <div className="w-px h-4 bg-brand-border" />
            <Link href="mailto:support@drive-thru.com" className="flex items-center gap-3 text-brand-text hover:text-brand-red font-bold text-xs uppercase tracking-widest transition-all">
              <MessageSquare size={16} /> Email Direct
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const ArrowRight = ({ className, size = 20 }: { className?: string, size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="3" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);
