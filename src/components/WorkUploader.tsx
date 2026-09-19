import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  Camera, 
  Sparkles, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  RefreshCw, 
  X, 
  FileText,
  Plus,
  ChevronLeft,
  ChevronRight,
  Layers,
  Trash2,
  Image as ImageIcon,
  Check,
  FileUp
} from 'lucide-react';
import { SAMPLE_TEST_PRESETS } from '../data/mockData';
import { StudentSubmission } from '../types';
import { optimizeImage, formatDataSize } from '../utils/imageOptimizer';

export interface PageItem {
  id: string;
  preview: string;
  name: string;
}

interface WorkUploaderProps {
  onGradedSuccess: (submission: StudentSubmission) => void;
  availableClasses: string[];
  defaultClass: string;
  onAddClass?: (newClassName: string) => void;
}

export const WorkUploader: React.FC<WorkUploaderProps> = ({
  onGradedSuccess,
  availableClasses,
  defaultClass,
  onAddClass,
}) => {
  // Multi-page state
  const [pages, setPages] = useState<PageItem[]>([]);
  const [activePageIndex, setActivePageIndex] = useState<number>(0);
  const [selectedSamplePreset, setSelectedSamplePreset] = useState<string | null>(null);
  
  // Student form state
  const [studentName, setStudentName] = useState('');
  const [autoDetectName, setAutoDetectName] = useState(true);
  const [studentNumber, setStudentNumber] = useState<number>(6);
  const [className, setClassName] = useState(defaultClass || 'Klasa 7A');
  const [subject, setSubject] = useState('Historia');
  const [testTitle, setTestTitle] = useState('Sprawdzian: Rzeczpospolita Obojga Narodów');
  const [customCriteria, setCustomCriteria] = useState('');

  // Custom class creation state
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [newClassNameInput, setNewClassNameInput] = useState('');

  // Camera capture state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Analysis / Grading loading states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const appendFileInputRef = useRef<HTMLInputElement | null>(null);

  // Safe file reader helper
  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // Add files (replace or append) with automatic client-side compression & scaling
  const handleFilesSelected = async (fileList: FileList | File[], append = false) => {
    const filesArray = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (filesArray.length === 0) {
      setErrorMessage('Wybierz pliki w formacie graficznym (JPG, PNG, WEBP).');
      return;
    }

    try {
      setErrorMessage(null);
      const newPages: PageItem[] = [];
      for (let i = 0; i < filesArray.length; i++) {
        const file = filesArray[i];
        // Automatically compress and resize high-res phone/scanner photos
        const previewUrl = await optimizeImage(file, { maxDimension: 1600, quality: 0.82 });
        const pageNum = append ? pages.length + i + 1 : i + 1;
        newPages.push({
          id: `page-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          preview: previewUrl,
          name: file.name || `Strona ${pageNum}`,
        });
      }

      if (append) {
        setPages((prev) => [...prev, ...newPages]);
        setActivePageIndex(pages.length);
      } else {
        setPages(newPages);
        setActivePageIndex(0);
      }
      setSelectedSamplePreset(null);
    } catch (err) {
      console.error('Błąd odczytu lub kompresji plików:', err);
      setErrorMessage('Nie udało się wczytać lub zoptymalizować jednego z plików graficznych.');
    }
  };

  // Drag and drop handlers
  const [isDragging, setIsDragging] = useState(false);
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files, false);
    }
  };

  // Camera start / stop with multi-stage fallback
  const startCamera = async () => {
    setErrorMessage(null);
    if (!navigator?.mediaDevices?.getUserMedia) {
      setErrorMessage(
        'Twoja przeglądarka lub urządzenie nie wspiera bezpośredniego dostępu do kamery. Użyj przycisku "Wybierz pliki ze zdjęciami", aby wgrać pliki z dysku.'
      );
      return;
    }

    setIsCameraActive(true);

    let stream: MediaStream | null = null;

    // Strategy 1: Try environment camera (ideal for mobile/tablet scanning)
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
    } catch (envErr) {
      console.warn('Could not acquire environment camera, falling back to default webcam:', envErr);
    }

    // Strategy 2: Fallback to any available camera without facingMode constraint
    if (!stream) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
      } catch (fallbackErr: any) {
        console.warn('Default camera attempt also failed:', fallbackErr);
        setIsCameraActive(false);

        const errMsg = String(fallbackErr?.message || '');
        const errName = String(fallbackErr?.name || '');

        if (
          errName === 'NotFoundError' ||
          errName === 'DevicesNotFoundError' ||
          errMsg.includes('Requested device not found') ||
          errMsg.includes('device not found')
        ) {
          setErrorMessage(
            'W Twoim urządzeniu nie wykryto podłączonej kamery ani kamerki internetowej. Możesz przesłać zdjęcie lub skan pracy bezpośrednio z dysku (przycisk "Wybierz pliki ze zdjęciami").'
          );
        } else if (
          errName === 'NotAllowedError' ||
          errName === 'PermissionDeniedError' ||
          errMsg.includes('Permission denied')
        ) {
          setErrorMessage(
            'Brak uprawnień do kamery. Kliknij ikonę kłódki lub kamery w pasku adresu przeglądarki i zezwól na dostęp do aparatu.'
          );
        } else if (errName === 'NotReadableError' || errMsg.includes('device in use')) {
          setErrorMessage(
            'Kamera jest obecnie zajęta przez inną aplikację lub inną kartę przeglądarki. Zamknij programy korzystające z kamery i spróbuj ponownie.'
          );
        } else {
          setErrorMessage(
            'Nie udało się uruchomić kamery. Prześlij gotowe zdjęcie pracy ucznia z dysku za pomocą przycisku "Wybierz pliki ze zdjęciami".'
          );
        }
        return;
      }
    }

    mediaStreamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Capture single page photo from camera (optimized and scaled)
  const capturePhoto = (keepCameraOpen = true) => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    let w = video.videoWidth || 1280;
    let h = video.videoHeight || 720;
    const maxDim = 1600;
    if (w > maxDim || h > maxDim) {
      if (w > h) {
        h = Math.round((h * maxDim) / w);
        w = maxDim;
      } else {
        w = Math.round((w * maxDim) / h);
        h = maxDim;
      }
    }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      const newPageNumber = pages.length + 1;
      const newPage: PageItem = {
        id: `page-cam-${Date.now()}`,
        preview: dataUrl,
        name: `Zdjęcie aparatem (Strona ${newPageNumber})`,
      };
      setPages((prev) => [...prev, newPage]);
      setActivePageIndex(pages.length);
      setSelectedSamplePreset(null);
      if (!keepCameraOpen) {
        stopCamera();
      }
    }
  };

  // Select sample preset (supports multi-page presets!)
  const handleSelectPreset = (preset: typeof SAMPLE_TEST_PRESETS[0]) => {
    setSelectedSamplePreset(preset.id);
    const presetPages: PageItem[] = (preset.pages && preset.pages.length > 0)
      ? preset.pages.map((url, idx) => ({
          id: `preset-page-${idx + 1}`,
          preview: url,
          name: `Strona ${idx + 1} (${preset.subject})`,
        }))
      : [
          {
            id: 'preset-page-1',
            preview: preset.previewUrl,
            name: `Strona 1 (${preset.subject})`,
          }
        ];

    setPages(presetPages);
    setActivePageIndex(0);
    setSubject(preset.subject);
    setClassName(preset.className);
    setTestTitle(preset.testTitle);
    setStudentName(preset.studentName);
    setStudentNumber(preset.studentNumber);
    setAutoDetectName(false);
    setErrorMessage(null);
    if (isCameraActive) stopCamera();
  };

  // Delete specific page
  const handleDeletePage = (indexToRemove: number) => {
    setPages((prev) => {
      const updated = prev.filter((_, i) => i !== indexToRemove);
      return updated;
    });
    if (activePageIndex >= indexToRemove && activePageIndex > 0) {
      setActivePageIndex((prev) => prev - 1);
    }
  };

  // Reorder pages
  const handleMovePage = (index: number, direction: 'left' | 'right') => {
    if (direction === 'left' && index === 0) return;
    if (direction === 'right' && index === pages.length - 1) return;
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    setPages((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
    setActivePageIndex(targetIndex);
  };

  // Clear all pages
  const handleResetAllPages = () => {
    setPages([]);
    setActivePageIndex(0);
    setSelectedSamplePreset(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (appendFileInputRef.current) appendFileInputRef.current.value = '';
    if (isCameraActive) stopCamera();
  };

  // Add custom class directly from uploader
  const handleCreateCustomClass = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newClassNameInput.trim();
    if (!trimmed) return;
    if (onAddClass) {
      onAddClass(trimmed);
    }
    setClassName(trimmed);
    setNewClassNameInput('');
    setIsAddingClass(false);
  };

  // Submit to AI grading endpoint
  const handleStartAnalysis = async () => {
    if (pages.length === 0) {
      setErrorMessage('Wybierz lub zrób co najmniej jedno zdjęcie pracy ucznia przed uruchomieniem sprawdzania.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);

    const pageCountText = pages.length === 1 ? '1 strony' : `${pages.length} stron`;
    setAnalysisStep(`Odczytywanie pisma odręcznego i zadań z ${pageCountText} pracy...`);
    
    // Progressive user feedback steps
    const stepTimer1 = setTimeout(() => {
      setAnalysisStep('Weryfikacja poprawności merytorycznej w Google Search (fakty, pojęcia, wzory)...');
    }, 3200);

    const stepTimer2 = setTimeout(() => {
      setAnalysisStep(`Łączenie punktacji ze wszystkich ${pageCountText}, obliczanie procentów i tworzenie feedbacku...`);
    }, 6500);

    const stepTimer3 = setTimeout(() => {
      setAnalysisStep('Formułowanie wskazówek dydaktycznych i rekomendacji dla nauczyciela...');
    }, 9800);

    try {
      setAnalysisStep(`Optymalizacja i kompresja ${pageCountText} do bezpiecznego rozmiaru...`);
      
      // Ensure all images are scaled down & optimized so payload stays well under server limits
      const optimizedImages = await Promise.all(
        pages.map((p) => optimizeImage(p.preview, { maxDimension: 1600, quality: 0.82 }))
      );

      const payload: any = {
        images: optimizedImages,
        imageBase64: optimizedImages[0]?.startsWith('data:') ? optimizedImages[0] : undefined,
        imageUrl: !optimizedImages[0]?.startsWith('data:') ? optimizedImages[0] : undefined,
        studentName: autoDetectName ? '' : studentName.trim(),
        studentNumber: studentNumber || 1,
        className: className || 'Klasa 7A',
        subject: subject || 'Historia',
        testTitle: testTitle || 'Sprawdzian',
        customCriteria: customCriteria.trim(),
      };

      setAnalysisStep(`Odczytywanie pisma odręcznego i zadań z ${pageCountText} pracy...`);

      const response = await fetch('/api/grade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);

      if (!response.ok) {
        let serverError = '';
        try {
          const errData = await response.json();
          serverError = errData.error;
        } catch {
          // Ignored if non-JSON
        }

        if (response.status === 413) {
          throw new Error(
            'Zdjęcia przekroczyły limit wielkości serwera (błąd 413). Wybierz mniejszą liczbę stron lub pliki o niższej rozdzielczości.'
          );
        }

        throw new Error(serverError || `Błąd serwera (${response.status})`);
      }

      const data = await response.json();
      if (data.submission) {
        onGradedSuccess(data.submission);
      } else {
        throw new Error('Serwer nie zwrócił ocenionej pracy.');
      }
    } catch (err: any) {
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      console.error('Grading error:', err);
      setErrorMessage(err.message || 'Wystąpił błąd podczas komunikacji z modelem AI.');
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  const activePage = pages[activePageIndex] || pages[0] || null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Top Banner */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Sprawdzanie nowej pracy ze zdjęcia
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Możesz wgrać pojedyncze zdjęcie lub <strong>wielostronicowy sprawdzian (np. 2, 3 lub więcej stron)</strong>.
              Gemini odczyta całą pracę, zweryfikuje fakty w Google Search i wystawi jedną łączną ocenę.
            </p>
          </div>

          {pages.length > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold shadow-2xs">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Dodano {pages.length} {pages.length === 1 ? 'stronę' : pages.length < 5 ? 'strony' : 'stron'}</span>
            </div>
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-rose-900">Informacja o operacji:</p>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-rose-500 hover:text-rose-800 text-xs font-semibold px-2 py-0.5 rounded hover:bg-rose-100 transition-colors cursor-pointer"
              >
                Zamknij ×
              </button>
            </div>
            <p className="mt-1 leading-relaxed text-rose-800">{errorMessage}</p>

            {/* Contextual quick actions */}
            {(errorMessage.includes('kamera') || errorMessage.includes('kamery') || errorMessage.includes('aparatu')) && (
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-rose-300 text-rose-900 text-xs font-bold hover:bg-rose-100 transition-colors shadow-2xs cursor-pointer"
                >
                  <FileUp className="w-3.5 h-3.5 text-rose-700" />
                  Wybierz plik ze zdjęciem z dysku
                </button>
              </div>
            )}

            {(errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('limit zapytań')) && (
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  disabled={isAnalyzing}
                  onClick={handleStartAnalysis}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-700 text-white text-xs font-bold hover:bg-rose-800 transition-colors shadow-2xs cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Ponów próbę sprawdzania
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Multi-page Upload & Viewer (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            
            {/* Header: Title and multi-page counters */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">
                  Zdjęcia pracy ucznia
                </h2>
                {pages.length > 0 && (
                  <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                    {pages.length} {pages.length === 1 ? 'strona' : pages.length < 5 ? 'strony' : 'stron'}
                  </span>
                )}
              </div>

              {pages.length > 0 && !isCameraActive && (
                <button
                  type="button"
                  onClick={handleResetAllPages}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Wyczyść wszystkie
                </button>
              )}
            </div>

            {/* Hidden file input for adding more pages */}
            <input
              ref={appendFileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => {
                if (e.target.files) handleFilesSelected(e.target.files, true);
              }}
              className="hidden"
            />

            {/* Camera View Mode */}
            {isCameraActive ? (
              <div className="relative rounded-xl overflow-hidden bg-black aspect-4/3 flex flex-col items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                
                {/* Camera Top Status */}
                <div className="absolute top-3 left-3 bg-slate-900/80 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur-xs flex items-center gap-2 font-medium">
                  <Camera className="w-3.5 h-3.5 text-indigo-400" />
                  <span>
                    Fotografowanie: <strong>Strona {pages.length + 1}</strong>
                  </span>
                </div>

                {/* Camera Bottom Controls */}
                <div className="absolute bottom-4 left-0 right-0 flex flex-wrap items-center justify-center gap-3 px-4">
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-4 py-2 rounded-xl bg-slate-800/80 text-white text-xs font-semibold backdrop-blur-xs hover:bg-slate-700 cursor-pointer"
                  >
                    {pages.length > 0 ? 'Zakończ aparat' : 'Anuluj'}
                  </button>

                  <button
                    type="button"
                    onClick={() => capturePhoto(true)}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-lg hover:bg-indigo-700 flex items-center gap-2 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Zrób zdjęcie strony {pages.length + 1}</span>
                  </button>

                  {pages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => capturePhoto(false)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-lg hover:bg-emerald-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Zapisz i zakończ ({pages.length + 1} stron)</span>
                    </button>
                  )}
                </div>
              </div>
            ) : pages.length > 0 && activePage ? (
              /* Active Multi-Page Preview Mode */
              <div className="space-y-4">
                
                {/* Main Active Page Display */}
                <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-200 aspect-4/3 max-h-96 flex items-center justify-center">
                  <img
                    src={activePage.preview}
                    alt={`Podgląd: ${activePage.name}`}
                    className="w-full h-full object-contain"
                  />

                  {/* Overlay badge with page number & size */}
                  <div className="absolute top-3 left-3 bg-slate-900/80 text-white text-xs px-2.5 py-1 rounded-md backdrop-blur-xs flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Strona {activePageIndex + 1} z {pages.length}</span>
                    <span className="text-[11px] text-slate-300 font-mono bg-slate-800/80 px-1.5 py-0.5 rounded">
                      {formatDataSize(activePage.preview)}
                    </span>
                  </div>

                  {/* Reorder & Delete controls on top right */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-slate-900/80 p-1 rounded-lg backdrop-blur-xs">
                    <button
                      type="button"
                      disabled={activePageIndex === 0}
                      onClick={() => handleMovePage(activePageIndex, 'left')}
                      title="Przesuń tę stronę w lewo"
                      className="p-1 text-white hover:text-indigo-300 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-[11px] text-slate-300 font-mono px-1">
                      {activePageIndex + 1}/{pages.length}
                    </span>
                    <button
                      type="button"
                      disabled={activePageIndex === pages.length - 1}
                      onClick={() => handleMovePage(activePageIndex, 'right')}
                      title="Przesuń tę stronę w prawo"
                      className="p-1 text-white hover:text-indigo-300 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <div className="w-px h-3.5 bg-slate-700 mx-1" />
                    <button
                      type="button"
                      onClick={() => handleDeletePage(activePageIndex)}
                      title="Usuń tę stronę"
                      className="p-1 text-rose-400 hover:text-rose-200 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Page Thumbnails Carousel & Add Page Buttons */}
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-2">
                    <span className="font-semibold flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      Arkusze / strony pracy ({pages.length}):
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      Kliknij miniaturę, aby przełączyć podgląd
                    </span>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-thin">
                    {pages.map((p, idx) => (
                      <div
                        key={p.id}
                        onClick={() => setActivePageIndex(idx)}
                        className={`group relative shrink-0 w-20 h-24 rounded-xl border-2 overflow-hidden cursor-pointer transition-all ${
                          activePageIndex === idx
                            ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-sm'
                            : 'border-slate-200 hover:border-indigo-300 opacity-75 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={p.preview}
                          alt={`Strona ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-slate-900/80 text-white text-[10px] font-bold py-0.5 text-center">
                          Str. {idx + 1}
                        </div>
                        {/* Quick remove button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePage(idx);
                          }}
                          className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}

                    {/* Button to add another page from file */}
                    <button
                      type="button"
                      onClick={() => appendFileInputRef.current?.click()}
                      className="shrink-0 w-20 h-24 rounded-xl border-2 border-dashed border-indigo-300 hover:border-indigo-500 bg-indigo-50/40 hover:bg-indigo-50 flex flex-col items-center justify-center gap-1 text-indigo-600 cursor-pointer transition-colors"
                      title="Dodaj kolejną stronę (z pliku)"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-[10px] font-bold text-center leading-tight">
                        + Dodaj stronę
                      </span>
                    </button>

                    {/* Button to snap another page with camera */}
                    <button
                      type="button"
                      onClick={startCamera}
                      className="shrink-0 w-20 h-24 rounded-xl border-2 border-dashed border-slate-300 hover:border-slate-500 bg-slate-50 hover:bg-slate-100 flex flex-col items-center justify-center gap-1 text-slate-600 cursor-pointer transition-colors"
                      title="Zrób zdjęcie kolejnej strony aparatem"
                    >
                      <Camera className="w-4 h-4" />
                      <span className="text-[10px] font-bold text-center leading-tight">
                        Aparat (kolejna)
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span>
                    {selectedSamplePreset ? 'Wybrano przykładowy zestaw testowy' : `${pages.length} przesłanych stron`}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => appendFileInputRef.current?.click()}
                      className="text-indigo-600 font-semibold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Dodaj kolejną stronę
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              /* Upload / Drop Area (0 pages yet) */
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
                    : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/50'
                }`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files) handleFilesSelected(e.target.files, false);
                  }}
                  className="hidden"
                />
                <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 shadow-xs">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <p className="text-base font-semibold text-slate-800">
                  Przeciągnij i upuść zdjęcia pracy tutaj
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Możesz zaznaczyć i wrzucić <strong>kilka stron naraz (np. 1, 2, 3 lub więcej zdjęć)</strong>
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Wybierz pliki z dysku (wielostronicowe)</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      startCamera();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 border border-slate-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-slate-600" />
                    <span>Zrób zdjęcia aparatem</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quick Sample Presets */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                Szybki test — kliknij gotowy przykład (w tym wielostronicowy):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {SAMPLE_TEST_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`text-left p-3 rounded-xl border transition-all text-xs cursor-pointer ${
                      selectedSamplePreset === preset.id
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-xs'
                        : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-bold text-slate-800 line-clamp-1">{preset.subject}</span>
                      {preset.pages && preset.pages.length > 1 && (
                        <span className="shrink-0 text-[10px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.2 rounded">
                          {preset.pages.length} strony
                        </span>
                      )}
                    </div>
                    <div className="text-slate-600 line-clamp-1 text-[11px]">{preset.title}</div>
                    <div className="text-slate-400 line-clamp-1 mt-0.5 text-[10px]">{preset.studentName}</div>
                    <span className="inline-block text-[10px] mt-1.5 text-indigo-600 font-medium bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {preset.className}
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Metadata, Class & Criteria Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              Dane sprawdzianu i ucznia
            </h2>

            <div className="space-y-4">
              {/* Subject & Class */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Przedmiot
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="Historia">Historia</option>
                    <option value="Matematyka">Matematyka</option>
                    <option value="Biologia">Biologia</option>
                    <option value="Język polski">Język polski</option>
                    <option value="Geografia">Geografia</option>
                    <option value="Fizyka">Fizyka</option>
                    <option value="Chemia">Chemia</option>
                    <option value="Język angielski">Język angielski</option>
                    <option value="Informatyka">Informatyka</option>
                    <option value="WOS">WOS</option>
                    <option value="Inny">Inny</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Klasa
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddingClass(!isAddingClass)}
                      className="text-[11px] text-indigo-600 hover:text-indigo-700 font-semibold cursor-pointer"
                    >
                      {isAddingClass ? 'Anuluj' : '+ Nowa klasa'}
                    </button>
                  </div>

                  {isAddingClass ? (
                    <form onSubmit={handleCreateCustomClass} className="flex items-center gap-1">
                      <input
                        type="text"
                        autoFocus
                        value={newClassNameInput}
                        onChange={(e) => setNewClassNameInput(e.target.value)}
                        placeholder="np. Klasa 6C"
                        className="w-full text-xs font-medium bg-white border border-indigo-300 rounded-lg p-2 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                      <button
                        type="submit"
                        className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer"
                        title="Zatwierdź klasę"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  ) : (
                    <select
                      value={className}
                      onChange={(e) => {
                        if (e.target.value === '__ADD_NEW__') {
                          setIsAddingClass(true);
                        } else {
                          setClassName(e.target.value);
                        }
                      }}
                      className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                    >
                      {availableClasses.map((cls) => (
                        <option key={cls} value={cls}>
                          {cls}
                        </option>
                      ))}
                      <option value="__ADD_NEW__" className="text-indigo-600 font-bold">
                        + Dodaj nową klasę...
                      </option>
                    </select>
                  )}
                </div>
              </div>

              {/* Test Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tytuł sprawdzianu / zadania
                </label>
                <input
                  type="text"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  placeholder="np. Sprawdzian: Rzeczpospolita Obojga Narodów"
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Student identification */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Uczeń
                  </label>
                  <label className="text-[11px] text-slate-500 flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoDetectName}
                      onChange={(e) => setAutoDetectName(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    Odczytaj nazwisko z kartki
                  </label>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  <div className="col-span-3">
                    <input
                      type="text"
                      disabled={autoDetectName}
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder={autoDetectName ? 'AI odczyta ze zdjęcia...' : 'Imię i nazwisko'}
                      className={`w-full text-xs font-medium rounded-lg p-2.5 border ${
                        autoDetectName
                          ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          : 'bg-slate-50 text-slate-800 border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500'
                      }`}
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      min={1}
                      max={40}
                      value={studentNumber}
                      onChange={(e) => setStudentNumber(Number(e.target.value))}
                      placeholder="Nr"
                      title="Numer w dzienniku"
                      className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 text-center focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Custom Criteria / Answer Key */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Klucz odpowiedzi / uwagi nauczyciela <span className="text-slate-400 font-normal">(opcjonalnie)</span>
                </label>
                <textarea
                  rows={3}
                  value={customCriteria}
                  onChange={(e) => setCustomCriteria(e.target.value)}
                  placeholder="np. Zwróć szczególną uwagę na definicję unii realnej. Za błąd ortograficzny odejmij 0.5 pkt..."
                  className="w-full text-xs font-normal bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Grounding & Multi-page Summary Note */}
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-[11px] text-indigo-900 space-y-1.5">
                <div className="flex items-start gap-2">
                  <Search className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Automatyczna weryfikacja internetowa:</span>
                    <p className="text-indigo-700 mt-0.5">
                      Model użyje Google Search do sprawdzenia poprawności faktograficznej odpowiedzi, 
                      zgodności z podstawą programową oraz wygeneruje źródła weryfikacji.
                    </p>
                  </div>
                </div>

                {pages.length > 1 && (
                  <div className="flex items-start gap-2 pt-1 border-t border-indigo-200/60">
                    <Layers className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-indigo-950">
                        Wielostronicowy sprawdzian ({pages.length} strony):
                      </span>
                      <p className="text-indigo-700 mt-0.5">
                        Wszystkie {pages.length} strony zostaną ocenione jako jedna spójna praca, a punkty z poszczególnych zadań zostaną zsumowane do końcowej oceny.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                id="btn-start-grade"
                type="button"
                disabled={isAnalyzing || pages.length === 0}
                onClick={handleStartAnalysis}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                  isAnalyzing || pages.length === 0
                    ? 'bg-slate-300 shadow-none cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 active:scale-[0.99]'
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Trwa sprawdzanie {pages.length > 1 ? `${pages.length} stron pracy` : 'pracy'}...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {pages.length > 1 
                        ? `Sprawdź całą pracę (${pages.length} strony) i oceń` 
                        : 'Sprawdź pracę i wystaw ocenę'}
                    </span>
                  </>
                )}
              </button>

              {/* Analysis Progress Steps */}
              {isAnalyzing && (
                <div className="p-3.5 rounded-xl bg-slate-900 text-white text-xs space-y-2 animate-pulse">
                  <div className="flex items-center gap-2 text-indigo-300 font-semibold">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Krok weryfikacji AI:
                  </div>
                  <p className="text-slate-200 leading-relaxed pl-5">
                    {analysisStep}
                  </p>
                </div>
              )}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
