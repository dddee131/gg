import React, { useState } from 'react';
import { NovelConfig, Genre, Tone } from '../types';
import { BookOpen, Feather, Sparkles, User, MapPin, FileText, Users, Dices, Loader2 } from 'lucide-react';
import { generateRandomNovelIdea } from '../services/geminiService';

interface SetupFormProps {
  onStart: (config: NovelConfig) => void;
  isLoading: boolean;
}

export const SetupForm: React.FC<SetupFormProps> = ({ onStart, isLoading }) => {
  const [config, setConfig] = useState<NovelConfig>({
    title: '',
    genre: Genre.FANTASY,
    tone: Tone.SERIOUS,
    protagonist: '',
    setting: '',
    plotSummary: '',
    targetAudience: 'الشباب والكبار'
  });
  const [isRandomizing, setIsRandomizing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart(config);
  };

  const handleChange = (field: keyof NovelConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleRandomize = async () => {
    setIsRandomizing(true);
    try {
      const randomConfig = await generateRandomNovelIdea();
      setConfig(randomConfig);
    } catch (error) {
      console.error("Error generating random idea:", error);
      // Optional: Add toast or alert here in a real app
    } finally {
      setIsRandomizing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-100 text-brand-600 mb-4 shadow-sm">
          <Feather size={32} />
        </div>
        <h1 className="text-4xl font-bold text-slate-800 mb-2">ابدأ رحلة الكتابة</h1>
        <p className="text-slate-600">أدخل تفاصيل روايتك وسيقوم الراوي الذكي ببناء الهيكل والأحداث.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
        
        {/* Randomizer Button */}
        <div className="flex justify-end">
           <button
            type="button"
            onClick={handleRandomize}
            disabled={isRandomizing || isLoading}
            className="flex items-center gap-2 text-brand-600 bg-brand-50 hover:bg-brand-100 disabled:bg-slate-100 disabled:text-slate-400 px-4 py-2 rounded-lg transition-colors text-sm font-bold"
            title="اقتراح فكرة جديدة بواسطة الذكاء الاصطناعي"
          >
            {isRandomizing ? <Loader2 className="animate-spin" size={18} /> : <Dices size={18} />}
            {isRandomizing ? 'جاري استلهام فكرة...' : 'اقتراح فكرة ذكية'}
          </button>
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <BookOpen size={16} /> عنوان الرواية
            </label>
            <input
              type="text"
              required
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all outline-none"
              placeholder="مثال: أسرار المدينة القديمة"
              value={config.title}
              onChange={(e) => handleChange('title', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Users size={16} /> الجمهور المستهدف
            </label>
            <input
              type="text"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all outline-none"
              placeholder="مثال: محبي الغموض، المراهقين"
              value={config.targetAudience}
              onChange={(e) => handleChange('targetAudience', e.target.value)}
            />
          </div>
        </div>

        {/* Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Sparkles size={16} /> النوع الأدبي
            </label>
            <select
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none appearance-none"
              value={config.genre}
              onChange={(e) => handleChange('genre', e.target.value as Genre)}
            >
              {Object.values(Genre).map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Sparkles size={16} /> النغمة / الأسلوب
            </label>
            <select
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none appearance-none"
              value={config.tone}
              onChange={(e) => handleChange('tone', e.target.value as Tone)}
            >
              {Object.values(Tone).map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Characters & Setting */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <User size={16} /> البطل / الشخصيات الرئيسية
            </label>
            <textarea
              rows={3}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none resize-none"
              placeholder="وصف موجز للأبطال..."
              value={config.protagonist}
              onChange={(e) => handleChange('protagonist', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <MapPin size={16} /> المكان والزمان (Setting)
            </label>
            <textarea
              rows={3}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none resize-none"
              placeholder="أين ومتى تدور الأحداث؟"
              value={config.setting}
              onChange={(e) => handleChange('setting', e.target.value)}
            />
          </div>
        </div>

        {/* Plot */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <FileText size={16} /> ملخص الحبكة (Plot Summary)
          </label>
          <textarea
            required
            rows={5}
            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
            placeholder="اكتب ملخصاً لقصتك هنا... كلما كان التفصيل أكثر، كانت النتيجة أفضل."
            value={config.plotSummary}
            onChange={(e) => handleChange('plotSummary', e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || isRandomizing}
          className="w-full py-4 bg-brand-600 hover:bg-brand-700 disabled:bg-slate-400 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 text-lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={24} />
              جاري هندسة الرواية...
            </>
          ) : (
            <>
              <Sparkles size={20} />
              إنشاء هيكل الرواية
            </>
          )}
        </button>
      </form>
    </div>
  );
};