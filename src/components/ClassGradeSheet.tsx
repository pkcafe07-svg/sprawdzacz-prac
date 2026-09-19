import React, { useState, useMemo } from 'react';
import { 
  Download, 
  Search, 
  Filter, 
  Eye, 
  Trash2, 
  TrendingUp, 
  Award, 
  Users, 
  CheckCircle2, 
  Printer, 
  Sparkles,
  PlusCircle,
  RotateCcw
} from 'lucide-react';
import { StudentSubmission } from '../types';

interface ClassGradeSheetProps {
  submissions: StudentSubmission[];
  onSelectSubmission: (submission: StudentSubmission) => void;
  onDeleteSubmission: (id: string) => void;
  onDeleteAllTestSubmissions?: () => void;
  onResetToDemo: () => void;
  onNewSubmission: () => void;
  selectedClass: string;
  onSelectClass: (cls: string) => void;
  availableClasses: string[];
  onAddClass?: (newClassName: string) => void;
}

export const ClassGradeSheet: React.FC<ClassGradeSheetProps> = ({
  submissions,
  onSelectSubmission,
  onDeleteSubmission,
  onDeleteAllTestSubmissions,
  onResetToDemo,
  onNewSubmission,
  selectedClass,
  onSelectClass,
  availableClasses,
  onAddClass,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState<string>('ALL');
  const [subjectFilter, setSubjectFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'number' | 'name' | 'score' | 'date'>('number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [submissionToDelete, setSubmissionToDelete] = useState<StudentSubmission | null>(null);
  const [showDeleteAllTestModal, setShowDeleteAllTestModal] = useState(false);

  const testSubmissionsCount = useMemo(() => {
    return submissions.filter((s) => s.className === 'TEST').length;
  }, [submissions]);

  const handleQuickAddClass = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newClassName.trim() || !onAddClass) return;
    onAddClass(newClassName.trim());
    onSelectClass(newClassName.trim());
    setNewClassName('');
    setIsAddingClass(false);
  };

  // Available subjects
  const availableSubjects = useMemo(() => {
    const subjects = new Set<string>();
    submissions.forEach((s) => {
      if (s.subject) subjects.add(s.subject);
    });
    return Array.from(subjects);
  }, [submissions]);

  // Filtered list
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      if (selectedClass !== 'ALL' && s.className !== selectedClass) return false;
      if (subjectFilter !== 'ALL' && s.subject !== subjectFilter) return false;
      if (gradeFilter !== 'ALL' && String(s.gradeNumber) !== gradeFilter) return false;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = s.studentName.toLowerCase().includes(query);
        const matchesTest = s.testTitle.toLowerCase().includes(query);
        const matchesSubject = s.subject.toLowerCase().includes(query);
        if (!matchesName && !matchesTest && !matchesSubject) return false;
      }
      return true;
    }).sort((a, b) => {
      let comp = 0;
      if (sortBy === 'number') comp = a.studentNumber - b.studentNumber;
      else if (sortBy === 'name') comp = a.studentName.localeCompare(b.studentName);
      else if (sortBy === 'score') comp = a.percentageScore - b.percentageScore;
      else if (sortBy === 'date') comp = a.date.localeCompare(b.date);
      return sortOrder === 'asc' ? comp : -comp;
    });
  }, [submissions, selectedClass, subjectFilter, gradeFilter, searchTerm, sortBy, sortOrder]);

  // Statistics
  const stats = useMemo(() => {
    const activeList = selectedClass === 'ALL' 
      ? submissions 
      : submissions.filter((s) => s.className === selectedClass);

    if (activeList.length === 0) {
      return {
        total: 0,
        averageScore: 0,
        passingRate: 0,
        highestScore: 0,
        lowestScore: 0,
        gradeCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 } as Record<number, number>,
      };
    }

    const total = activeList.length;
    const sumPercentage = activeList.reduce((acc, s) => acc + s.percentageScore, 0);
    const averageScore = Math.round(sumPercentage / total);
    const passingCount = activeList.filter((s) => s.percentageScore >= 50).length;
    const passingRate = Math.round((passingCount / total) * 100);
    const highestScore = Math.max(...activeList.map((s) => s.percentageScore));
    const lowestScore = Math.min(...activeList.map((s) => s.percentageScore));

    const gradeCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    activeList.forEach((s) => {
      const g = s.gradeNumber || 1;
      if (gradeCounts[g] !== undefined) {
        gradeCounts[g]++;
      }
    });

    return {
      total,
      averageScore,
      passingRate,
      highestScore,
      lowestScore,
      gradeCounts,
    };
  }, [submissions, selectedClass]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Nr w dzienniku',
      'Uczeń',
      'Klasa',
      'Przedmiot',
      'Tytuł pracy',
      'Wynik procentowy',
      'Punkty uzyskane',
      'Punkty maksymalne',
      'Ocena',
      'Data sprawdzenia',
      'Uzasadnienie oceny'
    ];

    const rows = filteredSubmissions.map((s) => [
      s.studentNumber,
      `"${s.studentName}"`,
      `"${s.className}"`,
      `"${s.subject}"`,
      `"${s.testTitle}"`,
      `${s.percentageScore}%`,
      s.totalPoints,
      s.maxPoints,
      `"${s.adjustedGrade || s.gradeScale}"`,
      s.date,
      `"${s.overallJustification.replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `arkusz_ocen_${selectedClass.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getGradePill = (gradeNumber: number, percentage: number) => {
    if (percentage >= 90 || gradeNumber >= 5) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-300';
    }
    if (percentage >= 70 || gradeNumber >= 4) {
      return 'bg-blue-50 text-blue-700 border-blue-300';
    }
    if (percentage >= 50 || gradeNumber >= 3) {
      return 'bg-amber-50 text-amber-700 border-amber-300';
    }
    if (percentage >= 35 || gradeNumber >= 2) {
      return 'bg-orange-50 text-orange-700 border-orange-300';
    }
    return 'bg-rose-50 text-rose-700 border-rose-300';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Arkusz zbiorczy klasy w czasie rzeczywistym
            </h1>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Na żywo
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-1">
            Zestawienie ocen, wyników procentowych i postępów uczniów w wybranej klasie.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onNewSubmission}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Sprawdź nową pracę</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Eksportuj CSV (Excel/Librus)</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Drukuj</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Average Class Score */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Średnia klasy</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats.averageScore}%
            </span>
            <span className="text-xs font-semibold text-slate-500">
              ze sprawdzianów
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                stats.averageScore >= 70 ? 'bg-emerald-500' : stats.averageScore >= 50 ? 'bg-indigo-500' : 'bg-rose-500'
              }`}
              style={{ width: `${stats.averageScore}%` }}
            />
          </div>
        </div>

        {/* Passing Rate */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Zdawalność (≥50%)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats.passingRate}%
            </span>
            <span className="text-xs font-semibold text-emerald-600">
              pozytywnych ocen
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Oceny dopuszczające i wyższe
          </p>
        </div>

        {/* Highest / Lowest Score */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Skrajne wyniki</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-xs text-slate-500 block">Najwyższy</span>
              <span className="text-2xl font-extrabold text-emerald-600">
                {stats.highestScore}%
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Najniższy</span>
              <span className="text-2xl font-extrabold text-rose-600">
                {stats.lowestScore}%
              </span>
            </div>
          </div>
        </div>

        {/* Total Students Graded */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Ocenione prace</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats.total}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              uczniów w arkuszu
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-3">
            Gotowe do eksportu do e-dziennika
          </p>
        </div>

      </div>

      {/* Grade Distribution Bar Graph */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Rozkład ocen szkolnych w wybranej grupie
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Skala 1 - 6
          </span>
        </div>

        <div className="grid grid-cols-6 gap-2 sm:gap-4">
          {[6, 5, 4, 3, 2, 1].map((gradeNum) => {
            const count = stats.gradeCounts[gradeNum] || 0;
            const maxCount = Math.max(...Object.values(stats.gradeCounts), 1);
            const heightPercent = Math.round((count / maxCount) * 100);

            const colors: Record<number, { bar: string; label: string }> = {
              6: { bar: 'bg-emerald-600', label: 'Celujący (6)' },
              5: { bar: 'bg-emerald-500', label: 'B. Dobry (5)' },
              4: { bar: 'bg-blue-500', label: 'Dobry (4)' },
              3: { bar: 'bg-amber-500', label: 'Dostateczny (3)' },
              2: { bar: 'bg-orange-500', label: 'Dopuszczający (2)' },
              1: { bar: 'bg-rose-500', label: 'Niedostateczny (1)' },
            };

            return (
              <div key={gradeNum} className="flex flex-col items-center">
                <span className="text-xs font-bold text-slate-800 mb-1">
                  {count} {count === 1 ? 'uczeń' : 'uczniów'}
                </span>
                <div className="w-full bg-slate-100 rounded-lg h-24 flex items-end p-1">
                  <div
                    className={`w-full rounded-md transition-all duration-500 ${colors[gradeNum].bar}`}
                    style={{ height: `${Math.max(heightPercent, count > 0 ? 12 : 0)}%` }}
                  />
                </div>
                <span className="text-xs font-extrabold text-slate-800 mt-2">
                  {gradeNum}
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:block truncate text-center w-full">
                  {colors[gradeNum].label.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          
          {/* Search Box (4 cols) */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Szukaj ucznia lub tematu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs font-medium pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Class Filter (3 cols) */}
          <div className="lg:col-span-3">
            {isAddingClass ? (
              <form onSubmit={handleQuickAddClass} className="flex items-center gap-1">
                <input
                  type="text"
                  autoFocus
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="np. Klasa 6C"
                  className="w-full text-xs font-medium py-1.5 px-2 bg-white border border-indigo-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="px-2 py-1.5 bg-indigo-600 text-white rounded-md text-xs font-bold hover:bg-indigo-700 cursor-pointer"
                >
                  Dodaj
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingClass(false)}
                  className="px-2 py-1.5 bg-slate-200 text-slate-600 rounded-md text-xs font-semibold hover:bg-slate-300 cursor-pointer"
                >
                  ✕
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-1.5">
                <select
                  value={selectedClass}
                  onChange={(e) => {
                    if (e.target.value === '__NEW__') {
                      setIsAddingClass(true);
                    } else {
                      onSelectClass(e.target.value);
                    }
                  }}
                  className="flex-1 text-xs font-medium py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                >
                  <option value="ALL">Wszystkie klasy ({submissions.length})</option>
                  {availableClasses.map((cls) => (
                    <option key={cls} value={cls}>
                      {cls === 'TEST' ? '🧪 TEST (prace demonstracyjne)' : cls}
                    </option>
                  ))}
                  {onAddClass && (
                    <option value="__NEW__" className="text-indigo-600 font-bold">
                      + Dodaj nową klasę...
                    </option>
                  )}
                </select>
                {onAddClass && (
                  <button
                    type="button"
                    onClick={() => setIsAddingClass(true)}
                    title="Dodaj nową klasę ręcznie"
                    className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 rounded-lg text-xs font-bold cursor-pointer shrink-0"
                  >
                    +
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Subject Filter (3 cols) */}
          <div className="lg:col-span-3">
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full text-xs font-medium py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Wszystkie przedmioty</option>
              {availableSubjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Grade Filter (2 cols) */}
          <div className="lg:col-span-2">
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="w-full text-xs font-medium py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">Każda ocena</option>
              <option value="6">Ocena 6</option>
              <option value="5">Ocena 5</option>
              <option value="4">Ocena 4</option>
              <option value="3">Ocena 3</option>
              <option value="2">Ocena 2</option>
              <option value="1">Ocena 1</option>
            </select>
          </div>

        </div>
      </div>

      {/* Demo submissions in TEST category banner */}
      {testSubmissionsCount > 0 && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-amber-950 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900 font-bold text-[11px]">
              Kategoria: TEST
            </span>
            <span>
              Wszystkie prace demonstracyjne zostały zgrupowane w klasie <strong>TEST</strong> ({testSubmissionsCount} prac).
            </span>
          </div>
          {onDeleteAllTestSubmissions && (
            <button
              type="button"
              onClick={() => setShowDeleteAllTestModal(true)}
              className="px-3 py-1.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold transition-colors cursor-pointer flex items-center gap-1.5 text-xs shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Wyczyść / usuń prace demonstracyjne ({testSubmissionsCount})</span>
            </button>
          )}
        </div>
      )}

      {/* Spreadsheet / Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th 
                  className="py-3.5 px-4 cursor-pointer hover:text-indigo-600 select-none w-14"
                  onClick={() => {
                    if (sortBy === 'number') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else { setSortBy('number'); setSortOrder('asc'); }
                  }}
                >
                  Nr {sortBy === 'number' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="py-3.5 px-4 cursor-pointer hover:text-indigo-600 select-none"
                  onClick={() => {
                    if (sortBy === 'name') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else { setSortBy('name'); setSortOrder('asc'); }
                  }}
                >
                  Uczeń {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-3.5 px-4">Klasa i Przedmiot</th>
                <th className="py-3.5 px-4">Tytuł pracy</th>
                <th 
                  className="py-3.5 px-4 cursor-pointer hover:text-indigo-600 select-none w-36"
                  onClick={() => {
                    if (sortBy === 'score') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    else { setSortBy('score'); setSortOrder('desc'); }
                  }}
                >
                  Wynik % {sortBy === 'score' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="py-3.5 px-4 w-28">Punkty</th>
                <th className="py-3.5 px-4 w-36">Ocena</th>
                <th className="py-3.5 px-4 text-center w-28">Weryfikacja</th>
                <th className="py-3.5 px-4 text-right w-28">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <p className="font-semibold text-sm text-slate-700">Brak prac spełniających kryteria.</p>
                    <p className="text-xs mt-1">Zmień filtry lub wgraj nowe zdjęcie sprawdzianu.</p>
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="hover:bg-indigo-50/40 transition-colors group cursor-pointer"
                    onClick={() => onSelectSubmission(sub)}
                  >
                    {/* Number */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-600">
                      {sub.studentNumber}
                    </td>

                    {/* Student Name */}
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <span>{sub.studentName}</span>
                        {sub.teacherCustomNotes && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" title="Zawiera notatkę nauczyciela" />
                        )}
                      </div>
                    </td>

                    {/* Class & Subject */}
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 block">{sub.className}</span>
                      <span className="text-[11px] text-slate-500 font-medium">{sub.subject}</span>
                    </td>

                    {/* Test Title */}
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-700 font-medium">
                      {sub.testTitle}
                    </td>

                    {/* Percentage Score & bar */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                        <span>{sub.percentageScore}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            sub.percentageScore >= 90
                              ? 'bg-emerald-500'
                              : sub.percentageScore >= 70
                              ? 'bg-blue-500'
                              : sub.percentageScore >= 50
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${sub.percentageScore}%` }}
                        />
                      </div>
                    </td>

                    {/* Points */}
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      <span className="font-bold text-slate-900">{sub.totalPoints}</span> / {sub.maxPoints}
                    </td>

                    {/* Grade */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold border ${getGradePill(
                          sub.gradeNumber,
                          sub.percentageScore
                        )}`}
                      >
                        {sub.adjustedGrade || sub.gradeScale}
                      </span>
                    </td>

                    {/* Grounding Status */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        title="Poprawność sprawdzona w Google Search"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Google
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onSelectSubmission(sub)}
                          className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-100 transition-colors cursor-pointer"
                          title="Zobacz szczegółową kartę oceny i zdjęcie"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSubmissionToDelete(sub);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Usuń tę pracę"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer toolbar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-3">
          <span>
            Wyświetlono <strong className="text-slate-800">{filteredSubmissions.length}</strong> z{' '}
            <strong className="text-slate-800">{submissions.length}</strong> sprawdzonych prac
          </span>

          <div className="flex flex-wrap items-center gap-3">
            {testSubmissionsCount > 0 && onDeleteAllTestSubmissions && (
              <button
                type="button"
                onClick={() => setShowDeleteAllTestModal(true)}
                className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Usuń prace TEST ({testSubmissionsCount})</span>
              </button>
            )}
            <button
              type="button"
              onClick={onResetToDemo}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-indigo-600 font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Przywróć przykładowe prace demonstracyjne</span>
            </button>
          </div>
        </div>

      </div>

      {/* In-app modal for deleting a single submission */}
      {submissionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="p-3 bg-rose-100 rounded-xl">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Usuń sprawdzian ucznia</h3>
                <p className="text-xs text-slate-500">Potwierdzenie trwałego usunięcia</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 mb-5 text-xs text-slate-700 space-y-1.5">
              <div>
                <span className="text-slate-500">Uczeń: </span>
                <strong className="text-slate-900 font-bold">{submissionToDelete.studentName}</strong> (nr: {submissionToDelete.studentNumber})
              </div>
              <div>
                <span className="text-slate-500">Klasa: </span>
                <span className="font-semibold text-indigo-600">{submissionToDelete.className}</span> • {submissionToDelete.subject}
              </div>
              <div>
                <span className="text-slate-500">Tytuł pracy: </span>
                <span className="font-medium text-slate-800">{submissionToDelete.testTitle}</span>
              </div>
              <div>
                <span className="text-slate-500">Wynik: </span>
                <span className="font-bold text-slate-900">
                  {submissionToDelete.percentageScore}% ({submissionToDelete.adjustedGrade || submissionToDelete.gradeScale})
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-6">
              Czy na pewno chcesz usunąć tę pracę? Sprawdzian zostanie natychmiast wycofany z zestawienia ocen.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSubmissionToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = submissionToDelete.id;
                  setSubmissionToDelete(null);
                  onDeleteSubmission(id);
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Tak, usuń pracę</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-app modal for deleting all TEST submissions */}
      {showDeleteAllTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="p-3 bg-rose-100 rounded-xl">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Usuń wszystkie prace TEST</h3>
                <p className="text-xs text-slate-500">Wyczyszczenie danych demonstracyjnych</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-6 leading-relaxed">
              Czy na pewno chcesz usunąć wszystkie prace demonstracyjne z klasy <strong>TEST</strong> ({testSubmissionsCount} prac)?
              <br className="mb-2" />
              Po usunięciu arkusz będzie zawierał tylko Twoje własne, autentyczne prace.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowDeleteAllTestModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Anuluj
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteAllTestModal(false);
                  if (onDeleteAllTestSubmissions) {
                    onDeleteAllTestSubmissions();
                  }
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Usuń wszystkie prace TEST</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
