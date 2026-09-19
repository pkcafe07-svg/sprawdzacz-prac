import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { WorkUploader } from './components/WorkUploader';
import { SubmissionDetail } from './components/SubmissionDetail';
import { ClassGradeSheet } from './components/ClassGradeSheet';
import { ClassAnalytics } from './components/ClassAnalytics';
import { PrintStudentCard } from './components/PrintStudentCard';
import { INITIAL_SUBMISSIONS, DEFAULT_CLASSES } from './data/mockData';
import { StudentSubmission } from './types';

export default function App() {
  const [submissions, setSubmissions] = useState<StudentSubmission[]>(() => {
    try {
      const saved = localStorage.getItem('school_submissions_v1');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Could not read cached submissions:', e);
    }
    return INITIAL_SUBMISSIONS;
  });

  const [activeTab, setActiveTab] = useState<'sheet' | 'upload' | 'detail' | 'analytics'>('sheet');
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>('sub-1');
  const [classFilter, setClassFilter] = useState<string>('ALL');
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Custom manually added classes
  const [customClasses, setCustomClasses] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('custom_classes_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleAddClass = (newClassName: string) => {
    const trimmed = newClassName.trim();
    if (!trimmed) return;
    setCustomClasses((prev) => {
      if (prev.includes(trimmed)) return prev;
      const updated = [...prev, trimmed];
      try {
        localStorage.setItem('custom_classes_v1', JSON.stringify(updated));
      } catch (e) {
        console.warn('Could not save class to localStorage:', e);
      }
      return updated;
    });
    setClassFilter(trimmed);
  };

  // Fetch submissions from backend on mount
  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const res = await fetch('/api/submissions');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.submissions)) {
            setSubmissions(data.submissions);
            try {
              localStorage.setItem('school_submissions_v1', JSON.stringify(data.submissions));
            } catch (e) {}
          }
        }
      } catch (err) {
        console.warn('Using local initial data due to fetch error:', err);
      }
    };
    fetchSubmissions();
  }, []);

  // Compute available classes dynamically (defaults + custom + submissions)
  const availableClasses = useMemo(() => {
    const classes = new Set<string>();
    // Pre-defined rich set of classes
    DEFAULT_CLASSES.forEach((cls) => classes.add(cls));
    // Manually added custom classes
    customClasses.forEach((cls) => classes.add(cls));
    // Any existing submissions
    submissions.forEach((s) => {
      if (s.className) classes.add(s.className);
    });
    return Array.from(classes);
  }, [customClasses, submissions]);

  const selectedSubmission = useMemo(() => {
    return submissions.find((s) => s.id === selectedSubmissionId) || submissions[0] || null;
  }, [submissions, selectedSubmissionId]);

  // When a new work is successfully analyzed by Gemini
  const handleGradedSuccess = (newSub: StudentSubmission) => {
    setSubmissions((prev) => {
      const updated = [newSub, ...prev.filter((s) => s.id !== newSub.id)];
      try {
        localStorage.setItem('school_submissions_v1', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setSelectedSubmissionId(newSub.id);
    setActiveTab('detail');
  };

  // Delete submission
  const handleDeleteSubmission = async (id: string) => {
    // 1. Immediate UI state and cache update
    setSubmissions((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      try {
        localStorage.setItem('school_submissions_v1', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (selectedSubmissionId === id) {
      const remaining = submissions.filter((s) => s.id !== id);
      setSelectedSubmissionId(remaining.length > 0 ? remaining[0].id : null);
      if (activeTab === 'detail' && remaining.length === 0) {
        setActiveTab('sheet');
      }
    }

    // 2. Persist delete on backend
    try {
      await fetch(`/api/submissions/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Delete error on server:', err);
    }
  };

  // Delete all demo submissions in class TEST
  const handleDeleteAllTestSubmissions = async () => {
    setSubmissions((prev) => {
      const updated = prev.filter((s) => s.className !== 'TEST');
      try {
        localStorage.setItem('school_submissions_v1', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (selectedSubmission && selectedSubmission.className === 'TEST') {
      const remaining = submissions.filter((s) => s.className !== 'TEST');
      setSelectedSubmissionId(remaining.length > 0 ? remaining[0].id : null);
    }

    try {
      await fetch('/api/submissions/demo/all', { method: 'DELETE' });
    } catch (err) {
      console.warn('Delete all demo error:', err);
    }
  };

  // Reset to initial demo class
  const handleResetToDemo = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/submissions/reset', { method: 'POST' });
      if (res.ok) {
        const data = await fetch('/api/submissions').then((r) => r.json());
        const list = Array.isArray(data.submissions) ? data.submissions : INITIAL_SUBMISSIONS;
        setSubmissions(list);
        try {
          localStorage.setItem('school_submissions_v1', JSON.stringify(list));
        } catch (e) {}
      } else {
        setSubmissions(INITIAL_SUBMISSIONS);
      }
    } catch (err) {
      setSubmissions(INITIAL_SUBMISSIONS);
    } finally {
      setIsSyncing(false);
      setSelectedSubmissionId('sub-1');
    }
  };

  // Save teacher custom note / adjusted grade
  const handleSaveTeacherNote = async (id: string, note: string, adjustedGrade?: string) => {
    try {
      await fetch(`/api/submissions/${id}/note`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherCustomNotes: note, adjustedGrade }),
      });
    } catch (err) {
      console.warn('Note save error:', err);
    }
    setSubmissions((prev) => {
      const updated = prev.map((s) =>
        s.id === id ? { ...s, teacherCustomNotes: note, adjustedGrade } : s
      );
      try {
        localStorage.setItem('school_submissions_v1', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Handle click on submission from grade sheet
  const handleSelectSubmission = (sub: StudentSubmission) => {
    setSelectedSubmissionId(sub.id);
    setActiveTab('detail');
  };

  // Print mode
  if (isPrinting && selectedSubmission) {
    return (
      <PrintStudentCard
        submission={selectedSubmission}
        onClose={() => setIsPrinting(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedSubmissionId={selectedSubmissionId}
        submissionCount={submissions.length}
        classFilter={classFilter}
        setClassFilter={setClassFilter}
        availableClasses={availableClasses}
        onAddClass={handleAddClass}
      />

      {/* Main View Area */}
      <main className="flex-1">
        {activeTab === 'sheet' && (
          <ClassGradeSheet
            submissions={submissions}
            onSelectSubmission={handleSelectSubmission}
            onDeleteSubmission={handleDeleteSubmission}
            onDeleteAllTestSubmissions={handleDeleteAllTestSubmissions}
            onResetToDemo={handleResetToDemo}
            onNewSubmission={() => setActiveTab('upload')}
            selectedClass={classFilter}
            onSelectClass={setClassFilter}
            availableClasses={availableClasses}
            onAddClass={handleAddClass}
          />
        )}

        {activeTab === 'upload' && (
          <WorkUploader
            onGradedSuccess={handleGradedSuccess}
            availableClasses={availableClasses}
            defaultClass={classFilter !== 'ALL' ? classFilter : 'Klasa 7A'}
            onAddClass={handleAddClass}
          />
        )}

        {activeTab === 'detail' && selectedSubmission && (
          <SubmissionDetail
            submission={selectedSubmission}
            onBack={() => setActiveTab('sheet')}
            onSaveTeacherNote={handleSaveTeacherNote}
            onDeleteSubmission={handleDeleteSubmission}
            onPrintCard={(sub) => {
              setSelectedSubmissionId(sub.id);
              setIsPrinting(true);
            }}
          />
        )}

        {activeTab === 'analytics' && (
          <ClassAnalytics
            submissions={submissions}
            selectedClass={classFilter}
            onGoToSheet={() => setActiveTab('sheet')}
          />
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <span>
            Sprawdzarka Prac Uczniów — Wspomaganie oceniania z Google Gemini 3.8 Flash & Google Search
          </span>
          <span className="text-slate-400">
            Weryfikacja merytoryczna • Skala procentowa • Wskazówki dydaktyczne
          </span>
        </div>
      </footer>
    </div>
  );
}
