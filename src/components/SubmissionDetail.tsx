import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ExternalLink, 
  Printer, 
  ArrowLeft, 
  Lightbulb, 
  Search, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Maximize2, 
  Save, 
  Check, 
  ThumbsUp, 
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Layers,
  Trash2
} from 'lucide-react';
import { StudentSubmission } from '../types';

interface SubmissionDetailProps {
  submission: StudentSubmission;
  onBack: () => void;
  onSaveTeacherNote?: (id: string, note: string, adjustedGrade?: string) => Promise<void>;
  onDeleteSubmission?: (id: string) => void;
  onPrintCard: (submission: StudentSubmission) => void;
}

export const SubmissionDetail: React.FC<SubmissionDetailProps> = ({
  submission,
  onBack,
  onSaveTeacherNote,
  onDeleteSubmission,
  onPrintCard,
}) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreenImage, setIsFullscreenImage] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const submissionImages = (submission.images && submission.images.length > 0)
    ? submission.images
    : (submission.imageUrl ? [submission.imageUrl] : []);

  const currentImage = submissionImages[currentPageIndex] || submission.imageUrl;

  // Teacher manual note
  const [teacherNote, setTeacherNote] = useState(submission.teacherCustomNotes || '');
  const [adjustedGrade, setAdjustedGrade] = useState(submission.adjustedGrade || submission.gradeScale);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Active filter for tasks (all, correct, partial, incorrect)
  const [taskFilter, setTaskFilter] = useState<'all' | 'correct' | 'partial' | 'incorrect'>('all');

  const filteredTasks = submission.tasks.filter((t) => {
    if (taskFilter === 'all') return true;
    return t.isCorrect === taskFilter;
  });

  const handleSaveNotes = async () => {
    if (!onSaveTeacherNote) return;
    setIsSavingNote(true);
    try {
      await onSaveTeacherNote(submission.id, teacherNote, adjustedGrade);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingNote(false);
    }
  };

  const getGradeBadgeColor = (gradeNumber: number, percentage: number) => {
    if (percentage >= 90 || gradeNumber >= 5) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-emerald-600/20';
    }
    if (percentage >= 70 || gradeNumber >= 4) {
      return 'bg-blue-50 text-blue-700 border-blue-300 ring-blue-600/20';
    }
    if (percentage >= 50 || gradeNumber >= 3) {
      return 'bg-amber-50 text-amber-700 border-amber-300 ring-amber-600/20';
    }
    if (percentage >= 35 || gradeNumber >= 2) {
      return 'bg-orange-50 text-orange-700 border-orange-300 ring-orange-600/20';
    }
    return 'bg-rose-50 text-rose-700 border-rose-300 ring-rose-600/20';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      
      {/* Top action bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Powrót do arkusza klasy</span>
        </button>

        <div className="flex items-center gap-2">
          {onDeleteSubmission && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-600 text-xs font-semibold border border-rose-200 transition-all cursor-pointer shadow-xs"
              title="Usuń tę pracę z dziennika ocen"
            >
              <Trash2 className="w-4 h-4" />
              <span>Usuń tę pracę</span>
            </button>
          )}
          <button
            onClick={() => onPrintCard(submission)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-all cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Drukuj kartę oceny dla ucznia</span>
          </button>
        </div>
      </div>

      {/* Quota Fallback Notice */}
      {submission.isQuotaFallback && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-bold text-amber-950">Wstępny szablon oceniania (Limit zapytań Gemini 429)</p>
            <p className="mt-0.5 text-amber-800 leading-relaxed">
              Z powodu chwilowego wyczerpania limitu zapytań darmowego API Gemini, praca została wstępnie zarejestrowana. 
              Możesz zweryfikować punkty w sekcji zadań lub ręcznie zmienić ocenę i zapisać uwagi nauczyciela poniżej.
            </p>
          </div>
        </div>
      )}

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Pane: Student Image Viewer (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            {/* Top Bar with Page Switcher and Image Controls */}
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Zdjęcie pracy
                </span>
                {submissionImages.length > 1 && (
                  <div className="flex items-center gap-1 bg-indigo-50 border border-indigo-200 text-indigo-800 px-2 py-0.5 rounded-md text-[11px] font-bold">
                    <Layers className="w-3 h-3 text-indigo-600" />
                    <span>Strona {currentPageIndex + 1} z {submissionImages.length}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1">
                {submissionImages.length > 1 && (
                  <div className="flex items-center mr-2 border-r border-slate-200 pr-2 gap-1">
                    <button
                      type="button"
                      disabled={currentPageIndex === 0}
                      onClick={() => setCurrentPageIndex((p) => Math.max(0, p - 1))}
                      title="Poprzednia strona pracy"
                      className="p-1 rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={currentPageIndex === submissionImages.length - 1}
                      onClick={() => setCurrentPageIndex((p) => Math.min(submissionImages.length - 1, p + 1))}
                      title="Następna strona pracy"
                      className="p-1 rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                  title="Pomniejsz"
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-mono text-slate-500 w-9 text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                  title="Powiększ"
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  title="Obróć o 90°"
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsFullscreenImage(true)}
                  title="Pełny ekran"
                  className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable container for photo */}
            <div className="relative rounded-xl overflow-auto bg-slate-950 max-h-[620px] min-h-[420px] flex items-center justify-center p-2 border border-slate-800">
              <img
                src={currentImage}
                alt={`Praca ucznia: ${submission.studentName} (strona ${currentPageIndex + 1})`}
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.15s ease-out',
                }}
                className="max-w-full max-h-full object-contain select-none"
              />
            </div>

            {/* Multiple Page Thumbnail Gallery */}
            {submissionImages.length > 1 && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <div className="text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center justify-between">
                  <span>Wszystkie strony tej pracy ({submissionImages.length}):</span>
                  <span className="text-slate-400">Kliknij stronę, aby ją powiększyć</span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                  {submissionImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentPageIndex(idx)}
                      className={`relative shrink-0 w-16 h-20 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                        currentPageIndex === idx
                          ? 'border-indigo-600 ring-2 ring-indigo-500/30 shadow-xs'
                          : 'border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-300'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Strona ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-slate-900/80 text-white text-[10px] font-bold py-0.5 text-center">
                        Str. {idx + 1}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <p className="text-[11px] text-slate-400 text-center mt-2">
              Użyj przycisków powyżej, aby powiększyć lub obrócić zdjęcie rękopisu
            </p>
          </div>

          {/* Teacher Manual Notes Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Komentarz nauczyciela i korekta oceny
              </h3>
              {savedSuccess && (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Zapisano!
                </span>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Wpisana ocena końcowa w dzienniku:
              </label>
              <input
                type="text"
                value={adjustedGrade}
                onChange={(e) => setAdjustedGrade(e.target.value)}
                placeholder="np. 5 (bardzo dobry)"
                className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                Indywidualna notatka dla ucznia / rodzica:
              </label>
              <textarea
                rows={3}
                value={teacherNote}
                onChange={(e) => setTeacherNote(e.target.value)}
                placeholder="Wpisz własny komentarz, który znajdzie się na karcie oceny..."
                className="w-full text-xs font-normal bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <button
              onClick={handleSaveNotes}
              disabled={isSavingNote}
              className="w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingNote ? 'Zapisywanie...' : 'Zapisz moje uwagi do pracy'}</span>
            </button>
          </div>

        </div>

        {/* Right Pane: AI Evaluation Breakdown (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Header Card: Student Info & Big Score */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {submission.className}
                  </span>
                  <span className="text-xs font-semibold text-slate-500">
                    Nr {submission.studentNumber} w dzienniku
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mt-1">
                  {submission.studentName}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  {submission.subject} • {submission.testTitle} • {submission.date}
                </p>
              </div>

              {/* Grade Badge */}
              <div className="flex flex-col items-end">
                <div
                  className={`px-4 py-2 rounded-xl border font-bold text-base flex items-center gap-2 shadow-xs ${getGradeBadgeColor(
                    submission.gradeNumber,
                    submission.percentageScore
                  )}`}
                >
                  <span className="text-xl font-extrabold">{submission.percentageScore}%</span>
                  <span className="border-l border-current pl-2 text-sm font-bold">
                    {submission.adjustedGrade || submission.gradeScale}
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-500 mt-1">
                  Punkty: <span className="text-slate-900 font-bold">{submission.totalPoints}</span> / {submission.maxPoints} pkt
                </span>
              </div>
            </div>

            {/* Overall Justification */}
            <div className="mt-5 pt-5 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Uzasadnienie oceny merytorycznej:
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                {submission.overallJustification}
              </p>
            </div>

            {/* Strengths and Weaknesses */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {submission.strengths.length > 0 && (
                <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 mb-1.5">
                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                    Mocne strony pracy:
                  </div>
                  <ul className="text-xs text-emerald-900 space-y-1 pl-4 list-disc marker:text-emerald-500">
                    {submission.strengths.map((str, i) => (
                      <li key={i}>{str}</li>
                    ))}
                  </ul>
                </div>
              )}

              {submission.weaknesses.length > 0 && (
                <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 mb-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Obszary do poprawy:
                  </div>
                  <ul className="text-xs text-amber-900 space-y-1 pl-4 list-disc marker:text-amber-500">
                    {submission.weaknesses.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Teacher Recommendations / Didactic Tips */}
            {submission.teacherRecommendations && (
              <div className="mt-4 p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-200 text-xs text-indigo-950 flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-indigo-900">
                    Wskazówki dla nauczyciela do dalszej pracy:
                  </span>
                  <p className="mt-1 leading-relaxed text-indigo-800">
                    {submission.teacherRecommendations}
                  </p>
                </div>
              </div>
            )}

            {/* Google Search Grounding Sources */}
            {submission.groundingSources && submission.groundingSources.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                  <Search className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Źródła weryfikacji poprawności merytorycznej (Google Search):</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {submission.groundingSources.map((source, i) => (
                    <a
                      key={i}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors border border-slate-200"
                    >
                      <span className="truncate max-w-xs">{source.title}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Task by Task Section */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-bold text-slate-900">
                Szczegółowa ocena poszczególnych zadań ({submission.tasks.length})
              </h2>

              {/* Filter tabs */}
              <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-medium">
                <button
                  onClick={() => setTaskFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    taskFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Wszystkie ({submission.tasks.length})
                </button>
                <button
                  onClick={() => setTaskFilter('correct')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    taskFilter === 'correct'
                      ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  Poprawne ({submission.tasks.filter((t) => t.isCorrect === 'correct').length})
                </button>
                <button
                  onClick={() => setTaskFilter('partial')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    taskFilter === 'partial'
                      ? 'bg-white text-amber-700 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-amber-700'
                  }`}
                >
                  Częściowe ({submission.tasks.filter((t) => t.isCorrect === 'partial').length})
                </button>
                <button
                  onClick={() => setTaskFilter('incorrect')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    taskFilter === 'incorrect'
                      ? 'bg-white text-rose-700 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-rose-700'
                  }`}
                >
                  Błędne ({submission.tasks.filter((t) => t.isCorrect === 'incorrect').length})
                </button>
              </div>
            </div>

            {/* Task list */}
            <div className="space-y-4">
              {filteredTasks.map((task) => {
                const isCorrect = task.isCorrect === 'correct';
                const isPartial = task.isCorrect === 'partial';

                return (
                  <div
                    key={task.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs transition-all hover:border-slate-300"
                  >
                    {/* Task Title & Points */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          Zadanie {task.taskNumber}
                        </span>
                        {isCorrect && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Poprawne
                          </span>
                        )}
                        {isPartial && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertCircle className="w-3 h-3 text-amber-600" />
                            Częściowo poprawne
                          </span>
                        )}
                        {!isCorrect && !isPartial && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            Błędne
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {task.pointsAwarded} / {task.maxPoints} pkt
                      </div>
                    </div>

                    {/* Task Prompt */}
                    <div className="mt-3">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Treść zadania odczytana z kartki:
                      </span>
                      <p className="text-xs font-semibold text-slate-800 bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                        {task.taskPrompt}
                      </p>
                    </div>

                    {/* Student Answer vs Correct Answer */}
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Odpowiedź ucznia:
                        </span>
                        <p className="text-slate-800 leading-relaxed font-mono text-[11px]">
                          {task.studentAnswer || '(Brak odpowiedzi)'}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100">
                        <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider block mb-1">
                          Wzorzec / poprawna odpowiedź:
                        </span>
                        <p className="text-indigo-950 leading-relaxed">
                          {task.correctAnswer}
                        </p>
                      </div>
                    </div>

                    {/* Feedback for Student */}
                    {task.detailedFeedback && (
                      <div className="mt-3 p-3 rounded-xl bg-slate-100/70 border border-slate-200 text-xs">
                        <span className="font-bold text-slate-800 block mb-0.5">
                          Feedback i wyjaśnienie dla ucznia:
                        </span>
                        <p className="text-slate-700 leading-relaxed">
                          {task.detailedFeedback}
                        </p>
                      </div>
                    )}

                    {/* Teacher Methodological Tip */}
                    {task.teacherTip && (
                      <div className="mt-3 p-3 rounded-xl bg-amber-50/50 border border-amber-200 text-xs flex items-start gap-2 text-amber-900">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-amber-900">
                            Wskazówka dydaktyczna dla nauczyciela:
                          </span>
                          <p className="mt-0.5 text-amber-800 leading-relaxed">
                            {task.teacherTip}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Substantive check notice */}
                    {task.substantiveVerification && (
                      <p className="text-[10px] text-slate-400 mt-2 italic">
                        ✓ {task.substantiveVerification}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

          </div>

        </div>

      </div>

      {/* Fullscreen Image Modal */}
      {isFullscreenImage && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-between p-4 backdrop-blur-sm">
          <div className="w-full flex items-center justify-between mb-2 max-w-5xl">
            <div className="text-white text-xs font-semibold flex items-center gap-2">
              <span>{submission.studentName} — {submission.testTitle}</span>
              {submissionImages.length > 1 && (
                <span className="bg-indigo-600 px-2 py-0.5 rounded text-[11px] font-bold">
                  Strona {currentPageIndex + 1} z {submissionImages.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {submissionImages.length > 1 && (
                <div className="flex items-center gap-1 mr-3">
                  <button
                    type="button"
                    disabled={currentPageIndex === 0}
                    onClick={() => setCurrentPageIndex((p) => Math.max(0, p - 1))}
                    className="p-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={currentPageIndex === submissionImages.length - 1}
                    onClick={() => setCurrentPageIndex((p) => Math.min(submissionImages.length - 1, p + 1))}
                    className="p-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
              <button
                onClick={() => setIsFullscreenImage(false)}
                className="text-white bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Zamknij pełny ekran
              </button>
            </div>
          </div>
          <div className="max-w-5xl max-h-[85vh] flex-1 flex items-center justify-center overflow-auto">
            <img
              src={currentImage}
              alt={`Pełny podgląd (strona ${currentPageIndex + 1})`}
              className="max-w-full max-h-[85vh] object-contain mx-auto"
            />
          </div>
        </div>
      )}

      {/* In-app delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="p-3 bg-rose-100 rounded-xl">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Usuń tę sprawdzoną pracę</h3>
                <p className="text-xs text-slate-500">Potwierdzenie trwałego usunięcia</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Czy na pewno chcesz usunąć pracę ucznia <strong className="text-slate-900">{submission.studentName}</strong> (klasa: <span className="font-semibold text-indigo-600">{submission.className}</span>)?
              <br className="mb-2" />
              Sprawdzian i wszystkie wygenerowane uwagi zostaną trwale usunięte z systemu.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  if (onDeleteSubmission) {
                    onDeleteSubmission(submission.id);
                  }
                  onBack();
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Tak, usuń tę pracę</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
