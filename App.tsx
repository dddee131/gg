import React, { useState, useCallback } from 'react';
import { SetupForm } from './components/SetupForm';
import { NovelReader } from './components/NovelReader';
import { generateNovelOutline, generateChapterContent, generatePlotTwist } from './services/geminiService';
import { AppState, NovelConfig, NovelData, Chapter } from './types';
import { Sparkles } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.SETUP);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [novelData, setNovelData] = useState<NovelData>({
    config: {} as NovelConfig,
    outline: [],
    currentChapterIndex: 0
  });

  // Step 1: Start -> Generate Outline
  const handleStart = async (config: NovelConfig) => {
    setIsLoading(true);
    setError(null);
    try {
      const outline = await generateNovelOutline(config);
      setNovelData({
        config,
        outline,
        currentChapterIndex: 0
      });
      setAppState(AppState.READING);
    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء توليد مخطط الرواية. يرجى التأكد من المفتاح البرمجي أو المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Generate specific chapter
  const handleGenerateChapter = useCallback(async (index: number) => {
    const chapter = novelData.outline[index];
    if (chapter.content || chapter.isGenerating) return;

    // Optimistic update to show loading state for specific chapter
    setNovelData(prev => {
      const newOutline = [...prev.outline];
      newOutline[index] = { ...newOutline[index], isGenerating: true };
      return { ...prev, outline: newOutline };
    });

    try {
      // Create context from previous chapters summaries
      const prevChapters = novelData.outline.slice(0, index);
      const contextSummary = prevChapters.map(c => `فصل ${c.id}: ${c.summary}`).join('\n');

      const content = await generateChapterContent(novelData.config, chapter, contextSummary);

      setNovelData(prev => {
        const newOutline = [...prev.outline];
        newOutline[index] = { 
          ...newOutline[index], 
          content: content, 
          isGenerating: false 
        };
        return { ...prev, outline: newOutline };
      });
    } catch (err) {
      console.error(err);
      // Revert generating state on error
      setNovelData(prev => {
        const newOutline = [...prev.outline];
        newOutline[index] = { ...newOutline[index], isGenerating: false };
        return { ...prev, outline: newOutline };
      });
      alert('فشل في توليد الفصل. حاول مرة أخرى.');
    }
  }, [novelData.config, novelData.outline]);

  // Step 3: Add a plot twist and regenerate
  const handleTwist = useCallback(async (index: number) => {
    const chapter = novelData.outline[index];
    if (chapter.isGenerating) return;

    // Set generating state
    setNovelData(prev => {
      const newOutline = [...prev.outline];
      newOutline[index] = { ...newOutline[index], isGenerating: true };
      return { ...prev, outline: newOutline };
    });

    try {
      const prevChapters = novelData.outline.slice(0, index);
      const contextSummary = prevChapters.map(c => `فصل ${c.id}: ${c.summary}`).join('\n');

      // 1. Generate new summary with twist
      const newSummary = await generatePlotTwist(novelData.config, chapter, contextSummary);

      // 2. Update summary in state (in case generation fails later, we at least have the new idea)
      setNovelData(prev => {
        const newOutline = [...prev.outline];
        newOutline[index] = { ...newOutline[index], summary: newSummary }; 
        return { ...prev, outline: newOutline };
      });

      // 3. Generate content based on new summary
      const content = await generateChapterContent(
        novelData.config, 
        { ...chapter, summary: newSummary }, // Use the new summary
        contextSummary
      );

      setNovelData(prev => {
        const newOutline = [...prev.outline];
        newOutline[index] = { 
          ...newOutline[index], 
          summary: newSummary, // Ensure summary is consistent
          content: content, 
          isGenerating: false 
        };
        return { ...prev, outline: newOutline };
      });

    } catch (err) {
      console.error(err);
      setNovelData(prev => {
        const newOutline = [...prev.outline];
        newOutline[index] = { ...newOutline[index], isGenerating: false };
        return { ...prev, outline: newOutline };
      });
      alert('فشل في إضافة الحبكة. حاول مرة أخرى.');
    }
  }, [novelData.config, novelData.outline]);

  // Navigation
  const handleSelectChapter = (index: number) => {
    setNovelData(prev => ({ ...prev, currentChapterIndex: index }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans" dir="rtl">
      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 right-4 left-4 z-50 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative shadow-md text-center md:text-start md:w-auto md:mx-auto max-w-2xl">
          <strong className="font-bold ms-1">خطأ:</strong>
          <span className="block sm:inline">{error}</span>
          <span className="absolute top-0 bottom-0 left-0 px-4 py-3 cursor-pointer" onClick={() => setError(null)}>
            <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
          </span>
        </div>
      )}

      {appState === AppState.SETUP && (
        <div className="container mx-auto py-12 px-4">
          <header className="flex justify-center mb-8">
             <div className="flex items-center gap-2 text-brand-700">
                <Sparkles size={28} />
                <span className="text-2xl font-bold tracking-tight">Rawi AI</span>
             </div>
          </header>
          <SetupForm onStart={handleStart} isLoading={isLoading} />
        </div>
      )}

      {appState === AppState.READING && (
        <NovelReader
          data={novelData}
          onSelectChapter={handleSelectChapter}
          onGenerateChapter={handleGenerateChapter}
          onTwist={handleTwist}
          isGenerating={novelData.outline[novelData.currentChapterIndex]?.isGenerating || false}
        />
      )}
    </div>
  );
};

export default App;