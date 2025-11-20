import React, { useRef, useEffect, useState } from 'react';
import { Chapter, NovelData } from '../types';
import { ChevronRight, ChevronLeft, Book, FileText, Play, Download, Edit3, AlertCircle, Sparkles, Zap, Volume2, Loader2, Square } from 'lucide-react';
import { generateSpeech } from '../services/geminiService';

interface NovelReaderProps {
  data: NovelData;
  onSelectChapter: (index: number) => void;
  onGenerateChapter: (index: number) => void;
  onTwist: (index: number) => void;
  isGenerating: boolean;
}

// Helper to decode base64
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export const NovelReader: React.FC<NovelReaderProps> = ({
  data,
  onSelectChapter,
  onGenerateChapter,
  onTwist,
  isGenerating,
}) => {
  const currentChapter = data.outline[data.currentChapterIndex];
  const contentRef = useRef<HTMLDivElement>(null);

  // Audio State
  const [audioState, setAudioState] = useState<'idle' | 'loading' | 'playing'>('idle');
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    // Scroll to top when chapter changes
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
    // Stop audio if changing chapters
    stopAudio();
  }, [data.currentChapterIndex]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
    };
  }, []);

  const stopAudio = () => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) { /* ignore if already stopped */ }
      audioSourceRef.current = null;
    }
    setAudioState('idle');
  };

  const handlePlayAudio = async () => {
    if (audioState === 'playing') {
      stopAudio();
      return;
    }

    if (!currentChapter.content) return;

    try {
      setAudioState('loading');
      
      // Initialize Audio Context
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      }
      
      // Resume if suspended (browser policy)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // 1. Get Base64 from Gemini
      // Limit text length if necessary, but Gemini 2.5 has large context.
      // We might just send the first 2000 chars for responsiveness in a demo if it was huge, 
      // but let's try sending the whole chapter content.
      const base64Audio = await generateSpeech(currentChapter.content);

      // 2. Decode
      const audioData = decode(base64Audio);
      const audioBuffer = await audioContextRef.current.decodeAudioData(audioData.buffer);

      // 3. Play
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        setAudioState('idle');
        audioSourceRef.current = null;
      };

      source.start();
      audioSourceRef.current = source;
      setAudioState('playing');

    } catch (error) {
      console.error("Error playing audio:", error);
      alert("حدث خطأ أثناء توليد الصوت. يرجى المحاولة مرة أخرى.");
      setAudioState('idle');
    }
  };

  const handleExport = () => {
    const fullText = data.outline
      .filter(c => c.content)
      .map(c => `الفصل ${c.id}: ${c.title}\n\n${c.content}`)
      .join('\n\n-------------------\n\n');
    
    const blob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.config.title}.txt`;
    a.click();
  };

  return (
    <div className="flex h-screen overflow-hidden bg-paper">
      {/* Sidebar */}
      <aside className="w-80 bg-white border-e border-slate-200 flex flex-col shadow-lg z-10 hidden md:flex">
        <div className="p-6 border-b border-slate-100 bg-brand-50">
          <h2 className="font-bold text-xl text-brand-900 line-clamp-2">{data.config.title}</h2>
          <p className="text-sm text-brand-600 mt-1">{data.config.genre}</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">الفصول</div>
          {data.outline.map((chapter, idx) => (
            <button
              key={chapter.id}
              onClick={() => onSelectChapter(idx)}
              className={`w-full text-start p-3 rounded-xl transition-all group relative flex flex-col gap-1 ${
                idx === data.currentChapterIndex
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className={`font-bold text-sm ${idx === data.currentChapterIndex ? 'text-white' : 'text-slate-800'}`}>
                  الفصل {chapter.id}
                </span>
                {chapter.content ? (
                  <span className="w-2 h-2 rounded-full bg-green-400" title="تم إنشاؤه" />
                ) : (
                   <span className="w-2 h-2 rounded-full bg-slate-300" title="مسودة" />
                )}
              </div>
              <span className={`text-sm truncate w-full ${idx === data.currentChapterIndex ? 'text-brand-100' : 'text-slate-500'}`}>
                {chapter.title}
              </span>
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors font-medium text-sm"
          >
            <Download size={16} />
            تصدير الرواية
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full relative">
        {/* Header */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 md:px-8 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <span className="bg-brand-100 text-brand-700 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
              فصل {currentChapter.id}
            </span>
            <h1 className="text-lg font-bold text-slate-800 truncate">{currentChapter.title}</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Audio Player Button */}
            {currentChapter.content && !isGenerating && (
              <button
                onClick={handlePlayAudio}
                disabled={audioState === 'loading'}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors border ${
                  audioState === 'playing' || audioState === 'loading'
                    ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
                title="قراءة الفصل صوتياً"
              >
                {audioState === 'loading' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : audioState === 'playing' ? (
                  <Square size={16} className="fill-current" />
                ) : (
                  <Volume2 size={16} />
                )}
                <span className="hidden sm:inline">
                   {audioState === 'loading' ? 'جاري التحضير...' : audioState === 'playing' ? 'إيقاف القراءة' : 'استماع'}
                </span>
              </button>
            )}

            {currentChapter.content && !isGenerating && (
              <button
                onClick={() => onTwist(data.currentChapterIndex)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200"
                title="إضافة حدث مفاجئ وإعادة الكتابة"
              >
                <Zap size={16} className="fill-amber-500 stroke-amber-700" />
                <span className="hidden sm:inline">إضافة حبكة</span>
              </button>
            )}
          </div>
        </header>

        {/* Reader / Generator */}
        <div 
          ref={contentRef}
          className="flex-1 overflow-y-auto p-4 md:p-16 scroll-smooth"
        >
          <div className="max-w-3xl mx-auto">
            
            {!currentChapter.content && !currentChapter.isGenerating && (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                  <Edit3 size={40} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">جاهز للكتابة؟</h3>
                  <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
                    هذا الفصل عبارة عن مخطط حالياً. اضغط على الزر أدناه ليقوم الراوي الذكي بكتابة الأحداث بناءً على الملخص:
                  </p>
                  <div className="mt-4 bg-yellow-50 border border-yellow-100 p-4 rounded-lg text-sm text-yellow-800 text-start shadow-sm">
                    <div className="flex items-center gap-2 mb-2 font-bold text-yellow-900">
                       <FileText size={16} /> ملخص الفصل:
                    </div>
                    {currentChapter.summary}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center">
                  <button
                    onClick={() => onGenerateChapter(data.currentChapterIndex)}
                    className="flex-1 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-lg hover:shadow-brand-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Play size={20} fill="currentColor" />
                    توليد الفصل
                  </button>
                  
                  <button
                    onClick={() => onTwist(data.currentChapterIndex)}
                    className="flex-1 px-6 py-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                    title="تغيير الملخص بحدث مفاجئ وتوليد الفصل"
                  >
                    <Zap size={20} className="fill-amber-500 stroke-amber-700" />
                    إضافة حبكة مفاجئة
                  </button>
                </div>
              </div>
            )}

            {currentChapter.isGenerating && (
              <div className="py-20 space-y-6 animate-pulse">
                 <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
                 <div className="space-y-3">
                    <div className="h-3 bg-slate-100 rounded"></div>
                    <div className="h-3 bg-slate-100 rounded"></div>
                    <div className="h-3 bg-slate-100 rounded w-5/6"></div>
                    <div className="h-3 bg-slate-100 rounded"></div>
                 </div>
                 <div className="flex flex-col items-center justify-center gap-3 text-brand-600 font-medium mt-12">
                   <Sparkles className="animate-spin text-brand-500" size={32} />
                   <p>جارٍ صياغة الأحداث...</p>
                   <span className="text-xs text-slate-400">قد يستغرق هذا بعض الوقت للإبداع</span>
                 </div>
              </div>
            )}

            {currentChapter.content && !currentChapter.isGenerating && (
              <div className="prose prose-lg prose-slate max-w-none text-justify leading-loose font-serif">
                {currentChapter.content.split('\n').map((para, idx) => (
                  para.trim() ? <p key={idx} className="mb-6 indent-8">{para}</p> : null
                ))}
                <div className="mt-12 pt-8 border-t border-slate-200 flex justify-between text-slate-500">
                  <span>نهاية الفصل {currentChapter.id}</span>
                  {data.currentChapterIndex < data.outline.length - 1 && (
                     <button 
                       onClick={() => onSelectChapter(data.currentChapterIndex + 1)}
                       className="text-brand-600 hover:text-brand-800 font-bold flex items-center gap-1"
                     >
                       الفصل التالي <ChevronLeft size={16} />
                     </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};