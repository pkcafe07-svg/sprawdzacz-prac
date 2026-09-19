import React, { useState } from 'react';
import { 
  GraduationCap, 
  Table, 
  Camera, 
  BarChart3, 
  FileCheck2, 
  Sparkles,
  Plus,
  Check,
  X
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'sheet' | 'upload' | 'detail' | 'analytics';
  setActiveTab: (tab: 'sheet' | 'upload' | 'detail' | 'analytics') => void;
  selectedSubmissionId: string | null;
  submissionCount: number;
  classFilter: string;
  setClassFilter: (cls: string) => void;
  availableClasses: string[];
  onAddClass?: (newClassName: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedSubmissionId,
  submissionCount,
  classFilter,
  setClassFilter,
  availableClasses,
  onAddClass,
}) => {
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');

  const handleCreateClass = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newClassName.trim() || !onAddClass) return;
    onAddClass(newClassName.trim());
    setNewClassName('');
    setIsAddingClass(false);
  };
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & App Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">
                  Sprawdzarka Prac Uczniów
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  Gemini + Google Search
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden md:block">
                Weryfikacja merytoryczna, feedback do zadań i arkusz klasy w czasie rzeczywistym
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              id="nav-sheet-tab"
              onClick={() => setActiveTab('sheet')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'sheet'
                  ? 'bg-indigo-50 text-indigo-700 shadow-xs border border-indigo-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Table className="w-4 h-4 text-indigo-600" />
              <span>Arkusz klasy</span>
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-xs bg-slate-200 text-slate-700 font-semibold">
                {submissionCount}
              </span>
            </button>

            <button
              id="nav-upload-tab"
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'upload'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-indigo-600 bg-indigo-50/70 hover:bg-indigo-100'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Sprawdź zdjęcie</span>
            </button>

            {selectedSubmissionId && (
              <button
                id="nav-detail-tab"
                onClick={() => setActiveTab('detail')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === 'detail'
                    ? 'bg-indigo-50 text-indigo-700 shadow-xs border border-indigo-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FileCheck2 className="w-4 h-4 text-indigo-600" />
                <span className="hidden md:inline">Karta oceny</span>
              </button>
            )}

            <button
              id="nav-analytics-tab"
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'analytics'
                  ? 'bg-indigo-50 text-indigo-700 shadow-xs border border-indigo-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">Analiza dydaktyczna</span>
            </button>
          </nav>

          {/* Class Filter Selector & Manual Add */}
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Widok klasy:</span>
            <select
              id="nav-class-selector"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="text-xs font-semibold bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 hover:bg-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer max-w-[160px] truncate"
            >
              <option value="ALL">Wszystkie klasy</option>
              {availableClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls === 'TEST' ? '🧪 TEST (demo)' : cls}
                </option>
              ))}
            </select>

            {onAddClass && (
              isAddingClass ? (
                <form onSubmit={handleCreateClass} className="flex items-center gap-1">
                  <input
                    type="text"
                    autoFocus
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="np. Klasa 6C"
                    className="text-xs px-2 py-1 bg-white border border-indigo-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-28"
                  />
                  <button
                    type="submit"
                    title="Zapisz klasę"
                    className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Anuluj"
                    onClick={() => {
                      setIsAddingClass(false);
                      setNewClassName('');
                    }}
                    className="p-1 rounded bg-slate-200 text-slate-600 hover:bg-slate-300 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  id="nav-btn-add-class"
                  onClick={() => setIsAddingClass(true)}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-1.5 rounded-lg transition-colors cursor-pointer"
                  title="Dodaj nową klasę do listy"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Dodaj klasę</span>
                </button>
              )
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
