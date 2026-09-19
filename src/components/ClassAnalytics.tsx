import React from 'react';
import { 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  BookOpen, 
  Target, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { StudentSubmission } from '../types';

interface ClassAnalyticsProps {
  submissions: StudentSubmission[];
  selectedClass: string;
  onGoToSheet: () => void;
}

export const ClassAnalytics: React.FC<ClassAnalyticsProps> = ({
  submissions,
  selectedClass,
  onGoToSheet,
}) => {
  const activeList = selectedClass === 'ALL'
    ? submissions
    : submissions.filter((s) => s.className === selectedClass);

  // Group tasks across all students to find hardest tasks
  const taskStats = React.useMemo(() => {
    const taskMap = new Map<
      string,
      {
        taskPrompt: string;
        taskNumber: string | number;
        totalAwarded: number;
        totalMax: number;
        failCount: number;
        partialCount: number;
        correctCount: number;
        teacherTips: string[];
      }
    >();

    activeList.forEach((sub) => {
      sub.tasks.forEach((t) => {
        const key = `t-${t.taskNumber}`;
        if (!taskMap.has(key)) {
          taskMap.set(key, {
            taskPrompt: t.taskPrompt,
            taskNumber: t.taskNumber,
            totalAwarded: 0,
            totalMax: 0,
            failCount: 0,
            partialCount: 0,
            correctCount: 0,
            teacherTips: [],
          });
        }
        const data = taskMap.get(key)!;
        data.totalAwarded += t.pointsAwarded;
        data.totalMax += t.maxPoints;
        if (t.isCorrect === 'incorrect') data.failCount++;
        else if (t.isCorrect === 'partial') data.partialCount++;
        else data.correctCount++;

        if (t.teacherTip && !data.teacherTips.includes(t.teacherTip)) {
          data.teacherTips.push(t.teacherTip);
        }
      });
    });

    return Array.from(taskMap.values()).map((t) => {
      const avgPercent = t.totalMax > 0 ? Math.round((t.totalAwarded / t.totalMax) * 100) : 0;
      return {
        ...t,
        avgPercent,
      };
    }).sort((a, b) => a.avgPercent - b.avgPercent); // Hardest first
  }, [activeList]);

  // Aggregate teacher recommendations
  const allTeacherTips = React.useMemo(() => {
    const tips: string[] = [];
    activeList.forEach((sub) => {
      if (sub.teacherRecommendations && !tips.includes(sub.teacherRecommendations)) {
        tips.push(sub.teacherRecommendations);
      }
      sub.tasks.forEach((t) => {
        if (t.teacherTip && !tips.includes(t.teacherTip)) {
          tips.push(t.teacherTip);
        }
      });
    });
    return tips.slice(0, 6);
  }, [activeList]);

  // Common weaknesses
  const commonWeaknesses = React.useMemo(() => {
    const map = new Map<string, number>();
    activeList.forEach((sub) => {
      sub.weaknesses.forEach((w) => {
        map.set(w, (map.get(w) || 0) + 1);
      });
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [activeList]);

  if (activeList.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Brak danych dla wybranej klasy</h2>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
          Wgraj zdjęcia prac uczniów tej klasy, aby wygenerować zbiorczą analizę dydaktyczną.
        </p>
        <button
          onClick={onGoToSheet}
          className="mt-6 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs hover:bg-indigo-700 inline-flex items-center gap-2 cursor-pointer"
        >
          <span>Wróć do arkusza</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200">
            {selectedClass === 'ALL' ? 'Wszystkie klasy' : selectedClass}
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Zbiorcza analiza dydaktyczna i wskazówki dla nauczyciela
          </h1>
        </div>
        <p className="text-sm text-slate-600 mt-1">
          Wnioski merytoryczne ze sprawdzonych prac: najtrudniejsze zagadnienia, typowe błędy myślowe i rekomendacje do powtórzenia na lekcji.
        </p>
      </div>

      {/* Grid: Hardest Tasks & Lesson Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Hardest Tasks Ranked (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                Zadania sprawiające największą trudność klasie
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                Średnia punktacja
              </span>
            </div>

            <div className="space-y-4">
              {taskStats.map((task) => (
                <div
                  key={task.taskNumber}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-bold text-sm text-slate-900">
                      Zadanie {task.taskNumber}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">
                        {task.avgPercent}% zdobytych pkt
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          task.avgPercent < 60
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : task.avgPercent < 80
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {task.avgPercent < 60 ? 'Trudne dla klasy' : task.avgPercent < 80 ? 'Średnie' : 'Opanowane'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 font-medium mt-1.5 line-clamp-2">
                    {task.taskPrompt}
                  </p>

                  <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        task.avgPercent < 60 ? 'bg-rose-500' : task.avgPercent < 80 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${task.avgPercent}%` }}
                    />
                  </div>

                  {/* Representative Teacher Tip for this task */}
                  {task.teacherTips.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-200/60 text-xs text-amber-900 bg-amber-50/50 p-2.5 rounded-lg border border-amber-200/60 flex items-start gap-2">
                      <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Wskazówka dydaktyczna do tego zadania:</span>
                        <p className="mt-0.5 text-[11px] text-amber-800">
                          {task.teacherTips[0]}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* Right Column: Didactic Advice & Common Misconceptions (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Actionable Tips for Next Lesson */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              Zalecenia na najbliższą lekcję
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Zsyntetyzowane przez AI na podstawie odpowiedzi wszystkich sprawdzonych uczniów:
            </p>

            <div className="space-y-3">
              {allTeacherTips.map((tip, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs text-indigo-950 flex items-start gap-2.5"
                >
                  <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="leading-relaxed text-indigo-900">
                    {tip}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Common Gaps in Understanding */}
          {commonWeaknesses.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <h2 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Częste luki i pomyłki pojęciowe
              </h2>
              <div className="space-y-2">
                {commonWeaknesses.map(([weakness, count], i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-amber-50/40 border border-amber-100 text-xs text-amber-900 flex items-center justify-between"
                  >
                    <span className="font-medium pr-2">{weakness}</span>
                    <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[11px] shrink-0">
                      u {count} {count === 1 ? 'ucznia' : 'uczniów'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
