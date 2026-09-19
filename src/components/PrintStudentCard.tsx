import React from 'react';
import { StudentSubmission } from '../types';
import { CheckCircle2, XCircle, AlertCircle, Printer, ArrowLeft } from 'lucide-react';

interface PrintStudentCardProps {
  submission: StudentSubmission;
  onClose: () => void;
}

export const PrintStudentCard: React.FC<PrintStudentCardProps> = ({
  submission,
  onClose,
}) => {
  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 print:p-0 print:bg-white">
      {/* Non-printable top action bar */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Wróć do aplikacji</span>
        </button>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Drukuj kartę oceny ucznia (lub zapisz PDF)</span>
        </button>
      </div>

      {/* Printable Sheet (A4 formatted) */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl p-8 sm:p-12 shadow-sm border border-slate-200 print:shadow-none print:border-none print:p-4 text-slate-900 font-sans">
        
        {/* School Header */}
        <div className="border-b-2 border-slate-800 pb-4 mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wide text-slate-900">
              Karta Oceny i Informacji Zwrotnej dla Ucznia
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Sprawdzian wiedzy i umiejętności • {submission.subject}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-slate-500 block">Data oceny:</span>
            <span className="text-sm font-semibold text-slate-800">{submission.date}</span>
          </div>
        </div>

        {/* Student Data & Grade Overview */}
        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6">
          <div>
            <span className="text-[11px] uppercase font-bold text-slate-500 block">Uczeń:</span>
            <span className="text-base font-bold text-slate-900">{submission.studentName}</span>
            <span className="text-xs text-slate-600 block mt-0.5">
              {submission.className} • Nr {submission.studentNumber} w dzienniku
            </span>
          </div>

          <div className="text-right flex flex-col items-end justify-center">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900">
                {submission.percentageScore}%
              </span>
              <span className="text-sm font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                {submission.adjustedGrade || submission.gradeScale}
              </span>
            </div>
            <span className="text-xs font-medium text-slate-600 mt-1">
              Punkty: <strong>{submission.totalPoints}</strong> / {submission.maxPoints} pkt
            </span>
          </div>
        </div>

        {/* Justification & Strengths */}
        <div className="mb-6 space-y-3">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Uzasadnienie oceny:
            </h2>
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
              {submission.overallJustification}
            </p>
          </div>

          {submission.strengths.length > 0 && (
            <div className="text-xs">
              <strong className="text-emerald-800 block mb-1">Co poszło bardzo dobrze:</strong>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                {submission.strengths.map((str, i) => (
                  <li key={i}>{str}</li>
                ))}
              </ul>
            </div>
          )}

          {submission.weaknesses.length > 0 && (
            <div className="text-xs">
              <strong className="text-amber-800 block mb-1">Zagadnienia do powtórzenia:</strong>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                {submission.weaknesses.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {submission.teacherCustomNotes && (
            <div className="p-3 bg-indigo-50/60 rounded-lg border border-indigo-200 text-xs text-indigo-900">
              <strong>Komentarz nauczyciela:</strong>
              <p className="mt-0.5">{submission.teacherCustomNotes}</p>
            </div>
          )}
        </div>

        {/* Detailed Task Feedback */}
        <div className="mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 pb-1 border-b border-slate-200">
            Wyniki i feedback do poszczególnych zadań:
          </h2>

          <div className="space-y-3">
            {submission.tasks.map((task) => (
              <div key={task.id} className="p-3 rounded-lg border border-slate-200 text-xs">
                <div className="flex items-center justify-between font-bold mb-1">
                  <span className="text-slate-900">
                    Zadanie {task.taskNumber}: {task.taskPrompt}
                  </span>
                  <span className="text-slate-700 shrink-0 ml-2">
                    {task.pointsAwarded} / {task.maxPoints} pkt
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 my-1.5 text-[11px]">
                  <div className="text-slate-600 bg-slate-50 p-2 rounded">
                    <strong>Twoja odpowiedź:</strong> {task.studentAnswer || '(brak)'}
                  </div>
                  <div className="text-slate-700 bg-indigo-50/40 p-2 rounded">
                    <strong>Poprawna:</strong> {task.correctAnswer}
                  </div>
                </div>

                {task.detailedFeedback && (
                  <p className="text-slate-700 text-[11px] mt-1 italic">
                    {task.detailedFeedback}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer Signature */}
        <div className="pt-8 border-t border-slate-300 flex items-center justify-between text-xs text-slate-500">
          <div>
            <span>Podpis nauczyciela: ___________________________</span>
          </div>
          <div>
            <span>Podpis rodzica / opiekuna: ___________________________</span>
          </div>
        </div>

      </div>
    </div>
  );
};
