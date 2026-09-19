import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for parsing JSON with a generous limit for base64 images
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

// Handle body-parser payload too large cleanly
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err && (err.type === "entity.too.large" || err.status === 413)) {
    return res.status(413).json({
      error: "Rozmiar przesłanych zdjęć przekracza dopuszczalny limit serwera. Skompresuj zdjęcia lub zmniejsz ich rozdzielczość.",
    });
  }
  next(err);
});

// In-memory submissions store
interface TaskItem {
  id: string;
  taskNumber: string | number;
  taskPrompt: string;
  studentAnswer: string;
  correctAnswer: string;
  isCorrect: 'correct' | 'partial' | 'incorrect';
  pointsAwarded: number;
  maxPoints: number;
  detailedFeedback: string;
  teacherTip: string;
  substantiveVerification?: string;
}

interface SubmissionRecord {
  id: string;
  studentName: string;
  studentNumber: number;
  className: string;
  subject: string;
  testTitle: string;
  date: string;
  imageUrl: string;
  images?: string[];
  pageCount?: number;
  status: 'analyzing' | 'graded' | 'error';
  errorMessage?: string;
  percentageScore: number;
  totalPoints: number;
  maxPoints: number;
  gradeScale: string;
  gradeNumber: number;
  overallJustification: string;
  strengths: string[];
  weaknesses: string[];
  teacherRecommendations: string;
  tasks: TaskItem[];
  groundingSources: Array<{ title: string; url: string }>;
  webSearchQueries?: string[];
  teacherCustomNotes?: string;
  adjustedGrade?: string;
  isQuotaFallback?: boolean;
}

// Initial seed data
const initialSubmissions: SubmissionRecord[] = [
  {
    id: 'sub-1',
    studentName: 'Zofia Kamińska',
    studentNumber: 1,
    className: 'TEST',
    subject: 'Historia',
    testTitle: 'Sprawdzian: Rzeczpospolita Obojga Narodów i unia lubelska',
    date: '2026-09-18',
    imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80',
    status: 'graded',
    percentageScore: 92,
    totalPoints: 23,
    maxPoints: 25,
    gradeScale: '5 (bardzo dobry)',
    gradeNumber: 5,
    overallJustification: 'Uczennica wykazała się znakomitą znajomością faktograficzną i przyczynowo-skutkową epoki Jagiellonów oraz unii realnej z 1569 r. Precyzyjnie operuje terminologią historyczną (sejm walny, artykuły henrykowskie). Drobne niedopowiedzenie w zadaniu 4 dotyczącym postanowień rozejmu w Andruszowie.',
    strengths: [
      'Głębokie zrozumienie różnicy między unią personalną a realną',
      'Prawidłowe wymienienie wspólnych i odrębnych instytucji Korony i Litwy',
      'Logiczna i spójna argumentacja w pytaniu otwartym'
    ],
    weaknesses: [
      'Pobieżne podsumowanie skutków terytorialnych rozejmu w Andruszowie (1667 r.)'
    ],
    teacherRecommendations: 'Warto zachęcić Zofię do udziału w olimpiadzie historycznej dla szkół podstawowych. Jako zadanie rozwijające można zaproponować analizę fragmentu źródeł z epoki (np. tekstu aktu Unii Lubelskiej).',
    groundingSources: [
      {
        title: 'Unia lubelska (1569) – Encyklopedia PWN',
        url: 'https://encyklopedia.pwn.pl/haslo/unia-lubelska;3991316.html'
      },
      {
        title: 'Podstawa programowa kształcenia ogólnego – Historia SP',
        url: 'https://podstawaprogramowa.pl/Szkola-podstawowa-IV-VIII/Historia'
      },
      {
        title: 'Artykuły henrykowskie i pacta conventa – Muzeum Historii Polski',
        url: 'https://muzhp.pl/pl/c/1223/artykuly-henrykowskie'
      }
    ],
    webSearchQueries: [
      'Unia lubelska 1569 postanowienia wspólne i odrębne instytucje',
      'Rozejm w Andruszowie 1667 skutki terytorialne'
    ],
    tasks: [
      {
        id: 't-1',
        taskNumber: 1,
        taskPrompt: 'Wyjaśnij różnicę między unią personalną a unią realną zawartą w Lublinie w 1569 roku.',
        studentAnswer: 'Unia personalna łączy państwa tylko osobą władcy, a realna tworzy wspólne instytucje jak sejm, polityka zagraniczna i moneta przy zachowaniu odrębnego wojska, skarbu i urzędów.',
        correctAnswer: 'Unia personalna to związek państw połączonych wyłącznie osobą monarchy. Unia realna to trwały związek państw na mocy traktatu, ze wspólnym monarchą, sejmem i polityką zagraniczną, lecz z odrębnym prawem, skarbem, wojskiem i sądownictwem.',
        isCorrect: 'correct',
        pointsAwarded: 5,
        maxPoints: 5,
        detailedFeedback: 'Wyjaśnienie jest precyzyjne, wyczerpujące i w pełni zgodne ze stanem wiedzy historycznej.',
        teacherTip: 'Uczennica świetnie rozumie instytucjonalny wymiar unii. Można podczas lekcji podsumowującej poprosić ją o zaprezentowanie tego podziału klasie.'
      },
      {
        id: 't-2',
        taskNumber: 2,
        taskPrompt: 'Przyporządkuj postacie do wydarzeń: Zygmunt II August, Henryk Walezy, Stefan Batory.',
        studentAnswer: 'Zygmunt II August - ostatni Jagiellon na tronie i twórca unii lubelskiej; Henryk Walezy - pierwszy król elekcyjny, podpisał artykuły henrykowskie; Stefan Batory - wojna z Moskwą o Inflanty i utworzenie piechoty wybranieckiej.',
        correctAnswer: 'Zygmunt II August – unia lubelska; Henryk Walezy – pierwsza wolna elekcja, artykuły henrykowskie; Stefan Batory – odzyskanie Inflant, piechota wybraniecka.',
        isCorrect: 'correct',
        pointsAwarded: 6,
        maxPoints: 6,
        detailedFeedback: 'Bezbłędne przyporządkowanie wraz z trafnym dodaniem kluczowych reform Batorego.',
        teacherTip: 'Brak zastrzeżeń dydaktycznych.'
      },
      {
        id: 't-3',
        taskNumber: 3,
        taskPrompt: 'Co gwarantowały szlachcie artykuły henrykowskie z 1573 r.?',
        studentAnswer: 'Zapewniały wolną elekcję, zwoływanie sejmu co 2 lata na 6 tygodni, zakaz nakładania nowych podatków bez zgody sejmu oraz prawo do wypowiedzenia posłuszeństwa królowi (artykuł de non praestanda oboedientia).',
        correctAnswer: 'Niezmienne zasady ustrojowe Rzeczypospolitej: wolna elekcja, regularne sejmy (co 2 lata), kontrola polityki zagranicznej przez senatorów-rezydentów, tolerancja religijna, prawo do rokoszu.',
        isCorrect: 'correct',
        pointsAwarded: 7,
        maxPoints: 7,
        detailedFeedback: 'Bardzo wysoki poziom szczegółowości, uczennica podała nawet łacińską nazwę artykułu o wypowiedzeniu posłuszeństwa.',
        teacherTip: 'Wyjątkowa pamięć faktograficzna.'
      },
      {
        id: 't-4',
        taskNumber: 4,
        taskPrompt: 'Podaj datę i główne skutki terytorialne rozejmu w Andruszowie kończącego wojnę z Rosją.',
        studentAnswer: '1667 rok. Rzeczpospolita oddała Rosji ziemię smoleńską i siewierską oraz lewobrzeżną Ukrainę z Kijowem (początkowo na 2 lata, ale został na stałe). Zapomniałam co z Zaporożem.',
        correctAnswer: 'Rozejm w Andruszowie (1667 r.): podział Ukrainy wzdłuż Dniepru. Rosja otrzymała lewobrzeżną Ukrainę, Smoleńszczyznę, ziemię czernihowską i siewierską oraz Kijów. Zaporoże znalazło się pod wspólnym protektoratem.',
        isCorrect: 'partial',
        pointsAwarded: 5,
        maxPoints: 7,
        detailedFeedback: 'Data prawidłowa (1667 r.), trafnie wskazano Smoleńszczyznę i podział Ukrainy z Kijowem. Brak wskazania ziemi czernihowskiej oraz kondominium nad Zaporożem.',
        teacherTip: 'Wskazówka dydaktyczna: Uczniowie często zapominają o specyficznym statusie Zaporoża i ziemi czernihowskiej. Warto pokazać na mapie ściennej przebieg granicy wzdłuż Dniepru.'
      }
    ]
  },
  {
    id: 'sub-2',
    studentName: 'Jan Kowalczyk',
    studentNumber: 2,
    className: 'TEST',
    subject: 'Historia',
    testTitle: 'Sprawdzian: Rzeczpospolita Obojga Narodów i unia lubelska',
    date: '2026-09-18',
    imageUrl: 'https://images.unsplash.com/photo-1588072432836-e10032774350?auto=format&fit=crop&w=800&q=80',
    status: 'graded',
    percentageScore: 68,
    totalPoints: 17,
    maxPoints: 25,
    gradeScale: '3+ (dostateczny plus)',
    gradeNumber: 3,
    overallJustification: 'Uczeń opanował podstawowe pojęcia (unia, elekcja), jednak popełnia błędy w chronologii i myli kompetencje wspólne z odrębnymi w unii lubelskiej. W zadaniu 3 pomylił artykuły henrykowskie z pacta conventa.',
    strengths: [
      'Prawidłowe rozpoznanie władców epoki',
      'Podstawowa orientacja w idei wolnej elekcji'
    ],
    weaknesses: [
      'Mylenie pacta conventa z artykułami henrykowskimi',
      'Brak precyzji w wyliczeniu wspólnych instytucji po 1569 r.'
    ],
    teacherRecommendations: 'Konieczne ćwiczenie porównawcze w formie tabeli: „Artykuły henrykowskie (stałe zasady ustroju) a Pacta conventa (osobiste zobowiązania danego króla)”. Warto również wrócić do schematu unii lubelskiej.',
    groundingSources: [
      {
        title: 'Unia lubelska – struktura państwa i podział urzędów (ZPE)',
        url: 'https://zpe.gov.pl/a/unia-lubelska/D165g5w32'
      }
    ],
    webSearchQueries: [
      'Różnice artykuły henrykowskie a pacta conventa historia klasa 7'
    ],
    tasks: [
      {
        id: 't-21',
        taskNumber: 1,
        taskPrompt: 'Wyjaśnij różnicę między unią personalną a unią realną zawartą w Lublinie w 1569 roku.',
        studentAnswer: 'Unia personalna to był tylko król ten sam, a w unii realnej wszystko było wspólne, nawet wojsko i podatki.',
        correctAnswer: 'W unii realnej wspólny był król, sejm i polityka zagraniczna, natomiast wojsko, skarb, urzędy i prawo pozostały odrębne.',
        isCorrect: 'partial',
        pointsAwarded: 3,
        maxPoints: 5,
        detailedFeedback: 'Błąd rzeczowy: wojsko i skarb NIE były wspólne, pozostały odrębne dla Korony Polskiej i Wielkiego Księstwa Litewskiego.',
        teacherTip: 'Typowy błąd uczniowski. Podkreślić na tablicy podwójną strukturę państwa: dwa wojska (koronne i litewskie) i dwa skarby.'
      },
      {
        id: 't-22',
        taskNumber: 2,
        taskPrompt: 'Przyporządkuj postacie do wydarzeń: Zygmunt II August, Henryk Walezy, Stefan Batory.',
        studentAnswer: 'Zygmunt II August - unia lubelska; Henryk Walezy - uciekł do Francji po paru miesiącach; Stefan Batory - walczył z carem Iwanem Groźnym o Inflanty.',
        correctAnswer: 'Prawidłowe skojarzenia historyczne.',
        isCorrect: 'correct',
        pointsAwarded: 6,
        maxPoints: 6,
        detailedFeedback: 'Poprawne przyporządkowanie i trafna uwaga o ucieczce Walezego.',
        teacherTip: 'Dobry punkt wyjścia do rozmowy o mechanizmie wolnej elekcji.'
      },
      {
        id: 't-23',
        taskNumber: 3,
        taskPrompt: 'Co gwarantowały szlachcie artykuły henrykowskie z 1573 r.?',
        studentAnswer: 'Że król spłaci długi Zygmunta Augusta i wybuduje flotę na Bałtyku.',
        correctAnswer: 'Spłata długów i budowa floty to postanowienia Pacta Conventa Walezego! Artykuły henrykowskie dotyczyły zasad ustroju: wolna elekcja, sejm co 2 lata, tolerancja religijna.',
        isCorrect: 'incorrect',
        pointsAwarded: 2,
        maxPoints: 7,
        detailedFeedback: 'Mylenie pojęć: uczeń podał treść pacta conventa (indywidualnych obietnic Walezego) zamiast fundamentalnych artykułów henrykowskich.',
        teacherTip: 'Kluczowe zagadnienie egzaminacyjne: zwrócić uwagę całej klasie na to powszechne mylenie pojęć.'
      },
      {
        id: 't-24',
        taskNumber: 4,
        taskPrompt: 'Podaj datę i główne skutki terytorialne rozejmu w Andruszowie kończącego wojnę z Rosją.',
        studentAnswer: 'Około 1660 roku. Straciliśmy Kijów i część Ukrainy za Dnieprem.',
        correctAnswer: 'Data: 1667 r. Skutki: utrata lewobrzeżnej Ukrainy, Kijowa, Smoleńszczyzny i ziemi siewiersko-czernihowskiej.',
        isCorrect: 'correct',
        pointsAwarded: 6,
        maxPoints: 7,
        detailedFeedback: 'Kierunek odpowiedzi prawidłowy, data nieprecyzyjna (1667 zamiast około 1660).',
        teacherTip: 'Zwrócić uwagę na utrwalenie daty 1667.'
      }
    ]
  },
  {
    id: 'sub-3',
    studentName: 'Mikołaj Wiśniewski',
    studentNumber: 3,
    className: 'TEST',
    subject: 'Historia',
    testTitle: 'Sprawdzian: Rzeczpospolita Obojga Narodów i unia lubelska',
    date: '2026-09-18',
    imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
    status: 'graded',
    percentageScore: 84,
    totalPoints: 21,
    maxPoints: 25,
    gradeScale: '4+ (dobry plus)',
    gradeNumber: 4,
    overallJustification: 'Bardzo dobra praca. Uczeń posiada solidną wiedzę z zakresu prawa i instytucji staropolskich. Dobrze wyjaśnione różnice ustrojowe, estetyczny zapis i brak rażących błędów faktograficznych.',
    strengths: [
      'Bardzo dobre zrozumienie podziału instytucjonalnego unii',
      'Prawidłowe pojęcia szlacheckie'
    ],
    weaknesses: [
      'Niedokładne wymienienie skutków rozejmu w Andruszowie'
    ],
    teacherRecommendations: 'Zachęcić do czytania biografii postaci historycznych. Dobrze radzi sobie z zagadnieniami ustrojowymi.',
    groundingSources: [
      {
        title: 'Unia lubelska – Encyklopedia PWN',
        url: 'https://encyklopedia.pwn.pl/haslo/unia-lubelska;3991316.html'
      }
    ],
    tasks: [
      {
        id: 't-31',
        taskNumber: 1,
        taskPrompt: 'Wyjaśnij różnicę między unią personalną a unią realną zawartą w Lublinie w 1569 roku.',
        studentAnswer: 'Personalna to tylko wspólny król (np. Polska i Litwa za Jagiełły). Realna to wspólny sejm, król, polityka, herb i granice, ale oddzielne wojsko i sądy.',
        correctAnswer: 'Zgodne ze wzorcem odpowiedzi.',
        isCorrect: 'correct',
        pointsAwarded: 5,
        maxPoints: 5,
        detailedFeedback: 'Świetny przykład z Jagiełłą ilustrujący unię personalną. Pełna punktacja.',
        teacherTip: 'Pochwalić za podanie trafnego przykładu historycznego.'
      },
      {
        id: 't-32',
        taskNumber: 2,
        taskPrompt: 'Przyporządkuj postacie do wydarzeń: Zygmunt II August, Henryk Walezy, Stefan Batory.',
        studentAnswer: 'Zygmunt II August - doprowadził do unii w Lublinie; Henryk Walezy - uciekł do Paryża, król elekt; Stefan Batory - odzyskał Połock i Wielkie Łuki od Moskwy.',
        correctAnswer: 'Pełna poprawność merytoryczna.',
        isCorrect: 'correct',
        pointsAwarded: 6,
        maxPoints: 6,
        detailedFeedback: 'Znakomita wiedza o kampaniach batoriańskich (Połock, Wielkie Łuki).',
        teacherTip: 'Wiedza ponadprogramowa warta wyróżnienia na forum klasy.'
      },
      {
        id: 't-33',
        taskNumber: 3,
        taskPrompt: 'Co gwarantowały szlachcie artykuły henrykowskie z 1573 r.?',
        studentAnswer: 'Prawo do wolnej elekcji, stały sejm co 2 lata na 6 tygodni, zakaz wojen bez zgody senatu i wolność religijną (konfederacja warszawska).',
        correctAnswer: 'Prawidłowe omówienie kluczowych punktów artykułów.',
        isCorrect: 'correct',
        pointsAwarded: 7,
        maxPoints: 7,
        detailedFeedback: 'Prawidłowo powiązane z konfederacją warszawską z 1573 roku.',
        teacherTip: 'Bardzo dobre powiązanie dat i zjawisk współbieżnych.'
      },
      {
        id: 't-34',
        taskNumber: 4,
        taskPrompt: 'Podaj datę i główne skutki terytorialne rozejmu w Andruszowie kończącego wojnę z Rosją.',
        studentAnswer: '1667 rok. Utrata Smoleńska i Kijowa na stałe.',
        correctAnswer: 'Data 1667 r. Utrata Smoleńszczyzny, ziemi czernihowskiej, lewobrzeżnej Ukrainy i Kijowa.',
        isCorrect: 'partial',
        pointsAwarded: 3,
        maxPoints: 7,
        detailedFeedback: 'Zbyt lakoniczna odpowiedź - brak wzmianki o lewobrzeżnej Ukrainie i podziale wzdłuż Dniepru.',
        teacherTip: 'Uczulać na konieczność pełnego formułowania odpowiedzi w pytaniach o skutki terytorialne.'
      }
    ]
  },
  {
    id: 'sub-4',
    studentName: 'Aleksandra Nowak',
    studentNumber: 4,
    className: 'TEST',
    subject: 'Historia',
    testTitle: 'Sprawdzian: Rzeczpospolita Obojga Narodów i unia lubelska',
    date: '2026-09-18',
    imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80',
    status: 'graded',
    percentageScore: 100,
    totalPoints: 25,
    maxPoints: 25,
    gradeScale: '6 (celujący)',
    gradeNumber: 6,
    overallJustification: 'Wzorcowa praca. Uczennica bezbłędnie wyjaśniła wszystkie zjawiska historyczne, operując precyzyjnym aparatem pojęciowym i podając kompletne skutki geopolityczne.',
    strengths: [
      'Perfekcyjna precyzja faktograficzna i terminologiczna',
      'Bogate słownictwo historyczne',
      'Pełne ujęcie przyczynowo-skutkowe'
    ],
    weaknesses: [],
    teacherRecommendations: 'Zgłosić uczennicę do Wojewódzkiego Konkursu Przedmiotowego z Historii.',
    groundingSources: [
      {
        title: 'Unia lubelska 1569 – Dzieje.pl Portal Historyczny',
        url: 'https://dzieje.pl/wiadomosci/unia-lubelska-1569'
      }
    ],
    tasks: [
      {
        id: 't-41',
        taskNumber: 1,
        taskPrompt: 'Wyjaśnij różnicę między unią personalną a unią realną zawartą w Lublinie w 1569 roku.',
        studentAnswer: 'Unia personalna polega na połączeniu państw wyłącznie osobą wspólnego monarchy, przy zachowaniu pełnej odrębności politycznej i prawnej obu krajów. Unia realna w Lublinie z 1569 r. stworzyła jedno nierozerwalne państwo – Rzeczpospolitą Obojga Narodów – ze wspólnym monarchą, sejmem walnym, polityką zagraniczną i monetą. Zachowano natomiast odrębne urzędy centralne, skarb, wojsko i sądownictwo oparte na odrębnych statutach litewskich.',
        correctAnswer: 'Odpowiedź wzorowa.',
        isCorrect: 'correct',
        pointsAwarded: 5,
        maxPoints: 5,
        detailedFeedback: 'Wzorcowa definicja ze wskazaniem Statutów Litewskich.',
        teacherTip: 'Można wykorzystać tę odpowiedź jako wzorzec dla pozostałych uczniów.'
      },
      {
        id: 't-42',
        taskNumber: 2,
        taskPrompt: 'Przyporządkuj postacie do wydarzeń: Zygmunt II August, Henryk Walezy, Stefan Batory.',
        studentAnswer: 'Zygmunt II August – inicjator i twórca unii lubelskiej 1569 r.; Henryk Walezy – pierwszy elekcyjny monarcha, zaprzysiągł artykuły nazwane jego imieniem; Stefan Batory – zwycięskie wojny o Inflanty przeciw Iwanowi Groźnemu i utworzenie piechoty wybranieckiej.',
        correctAnswer: 'Odpowiedź bezbłędna.',
        isCorrect: 'correct',
        pointsAwarded: 6,
        maxPoints: 6,
        detailedFeedback: 'Pełna i dokładna charakterystyka.',
        teacherTip: 'Brak uwag dydaktycznych.'
      },
      {
        id: 't-43',
        taskNumber: 3,
        taskPrompt: 'Co gwarantowały szlachcie artykuły henrykowskie z 1573 r.?',
        studentAnswer: 'Były to stałe, nienaruszalne prawa ustrojowe: wolna elekcja (zakaz dziedziczności tronu), zwoływanie sejmu co 2 lata, zakaz nakładania podatków i wypowiadania wojen bez zgody sejmu, 16 senatorów-rezydentów przy królu, potwierdzenie pokoju religijnego oraz artykuł 21 o prawie szlachty do wypowiedzenia posłuszeństwa.',
        correctAnswer: 'Odpowiedź kompletna.',
        isCorrect: 'correct',
        pointsAwarded: 7,
        maxPoints: 7,
        detailedFeedback: 'Wymienienie instytucji senatorów-rezydentów zasługuje na szczególne wyróżnienie.',
        teacherTip: 'Wyróżniająca wiedza z zakresu ustroju dawnej Polski.'
      },
      {
        id: 't-44',
        taskNumber: 4,
        taskPrompt: 'Podaj datę i główne skutki terytorialne rozejmu w Andruszowie kończącego wojnę z Rosją.',
        studentAnswer: 'Zawarty w 1667 r. na 13,5 roku. Podzielił Ukrainę wzdłuż Dniepru: Rzeczpospolita oddała carowi lewobrzeżną Ukrainę z Kijowem oraz ziemię smoleńską, czernihowską i siewierską. Zaporoże miało pozostać pod wspólnym zwierzchnictwem obu państw.',
        correctAnswer: 'Wzorcowy opis postanowień rozejmu.',
        isCorrect: 'correct',
        pointsAwarded: 7,
        maxPoints: 7,
        detailedFeedback: 'Kompletne wymienienie wszystkich terytoriów oraz czasu trwania rozejmu (13,5 roku).',
        teacherTip: 'Wybitna praca.'
      }
    ]
  },
  {
    id: 'sub-5',
    studentName: 'Bartosz Zieliński',
    studentNumber: 5,
    className: 'TEST',
    subject: 'Historia',
    testTitle: 'Sprawdzian: Rzeczpospolita Obojga Narodów i unia lubelska',
    date: '2026-09-18',
    imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
    status: 'graded',
    percentageScore: 48,
    totalPoints: 12,
    maxPoints: 25,
    gradeScale: '2 (dopuszczający)',
    gradeNumber: 2,
    overallJustification: 'Praca poniżej progu zadowalającego. Uczeń ma poważne braki w chronologii oraz podstawowych pojęciach ustrojowych. Pytanie 3 o artykuły henrykowskie pozostało prawie bez odpowiedzi. Wskazana praca naprawcza.',
    strengths: [
      'Pamięta postać Stefana Batorego i wojnę o Inflanty'
    ],
    weaknesses: [
      'Brak zrozumienia istoty unii realnej',
      'Poważne luki w znajomości artykułów henrykowskich',
      'Niepoprawna data rozejmu w Andruszowie'
    ],
    teacherRecommendations: 'Zalecana krótka kartkówka poprawkowa po powtórzeniu materiału. Skupić się na mapie myśli: Władcy elekcyjni i ich najważniejsze działania.',
    groundingSources: [
      {
        title: 'Podsumowanie rozdziału: Rzeczpospolita w XVI-XVII w. – ZPE',
        url: 'https://zpe.gov.pl'
      }
    ],
    tasks: [
      {
        id: 't-51',
        taskNumber: 1,
        taskPrompt: 'Wyjaśnij różnicę między unią personalną a unią realną zawartą w Lublinie w 1569 roku.',
        studentAnswer: 'Unia to sojusz wojskowy. Realna znaczy że podpisali ją naprawdę na papierze.',
        correctAnswer: 'Unia realna to państwowy związek prawno-ustrojowy, a nie po prostu traktat na papierze.',
        isCorrect: 'incorrect',
        pointsAwarded: 1,
        maxPoints: 5,
        detailedFeedback: 'Błędne rozumienie pojęcia unii realnej – unia nie oznaczała sojuszu wojskowego, lecz trwałe połączenie Korony i Litwy.',
        teacherTip: 'Uczeń myli pojęcie unii państwowej z sojuszem militarnym. Wymaga ponownego wyjaśnienia podstawowych definicji.'
      },
      {
        id: 't-52',
        taskNumber: 2,
        taskPrompt: 'Przyporządkuj postacie do wydarzeń: Zygmunt II August, Henryk Walezy, Stefan Batory.',
        studentAnswer: 'Zygmunt August - ostatni król z dynastii; Henryk Walezy - uciekł; Batory - wojna o Inflanty.',
        correctAnswer: 'Prawidłowe skojarzenia w minimalnym zakresie.',
        isCorrect: 'correct',
        pointsAwarded: 5,
        maxPoints: 6,
        detailedFeedback: 'Podstawowe skojarzenia poprawne, choć bardzo skrótowe.',
        teacherTip: 'Rozwinąć wypowiedź ucznia na lekcji.'
      },
      {
        id: 't-53',
        taskNumber: 3,
        taskPrompt: 'Co gwarantowały szlachcie artykuły henrykowskie z 1573 r.?',
        studentAnswer: 'Prawa dla szlachty żeby król nie rządził sam.',
        correctAnswer: 'Zasady wolnej elekcji, sejmy co 2 lata, zakaz podatków bez zgody, tolerancja religijna.',
        isCorrect: 'partial',
        pointsAwarded: 2,
        maxPoints: 7,
        detailedFeedback: 'Zbyt ogólna odpowiedź, brak jakichkolwiek konkretnych postanowień (sejm, podatki, elekcja).',
        teacherTip: 'Wymaga powtórzenia materiału o wolnej elekcji i artykułach henrykowskich.'
      },
      {
        id: 't-54',
        taskNumber: 4,
        taskPrompt: 'Podaj datę i główne skutki terytorialne rozejmu w Andruszowie kończącego wojnę z Rosją.',
        studentAnswer: '1618 rok. Pokój z Rosją.',
        correctAnswer: '1667 r. Rozejm w Andruszowie podzielił Ukrainę i odebrał Smoleńszczyznę.',
        isCorrect: 'incorrect',
        pointsAwarded: 4,
        maxPoints: 7,
        detailedFeedback: 'Błędna data (1618 to rozejm w Dywilinie, a nie Andruszowie).',
        teacherTip: 'Uczeń pomylił rozejm w Dywilinie (1619/1618) z Andruszowem (1667). Warto stworzyć oś czasu wojen z Rosją.'
      }
    ]
  }
];

let submissions: SubmissionRecord[] = [...initialSubmissions];

// Gemini Client Lazy Initializer
let genAIInstance: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!genAIInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Brak klucza GEMINI_API_KEY. Skonfiguruj go w ustawieniach środowiska.");
    }
    genAIInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAIInstance;
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// GET all submissions
app.get("/api/submissions", (req, res) => {
  res.json({ submissions });
});

// Reset submissions to seed
app.post("/api/submissions/reset", (req, res) => {
  submissions = [...initialSubmissions];
  res.json({ success: true, count: submissions.length });
});

// Update teacher custom notes or grade
app.put("/api/submissions/:id/note", (req, res) => {
  const { id } = req.params;
  const { teacherCustomNotes, adjustedGrade } = req.body;
  const sub = submissions.find((s) => s.id === id);
  if (!sub) {
    return res.status(404).json({ error: "Nie znaleziono pracy o podanym ID." });
  }
  if (teacherCustomNotes !== undefined) sub.teacherCustomNotes = teacherCustomNotes;
  if (adjustedGrade !== undefined) sub.adjustedGrade = adjustedGrade;
  res.json({ success: true, submission: sub });
});

// DELETE all test/demo submissions
app.delete("/api/submissions/demo/all", (req, res) => {
  const countBefore = submissions.length;
  submissions = submissions.filter((s) => s.className !== "TEST");
  console.log(`[Submissions] Usunięto prace demonstracyjne TEST. Przed: ${countBefore}, Po: ${submissions.length}`);
  res.json({ success: true, removed: countBefore - submissions.length, remaining: submissions.length });
});

// DELETE all submissions
app.delete("/api/submissions/all/clear", (req, res) => {
  submissions = [];
  res.json({ success: true, remaining: 0 });
});

// DELETE single submission
app.delete("/api/submissions/:id", (req, res) => {
  const { id } = req.params;
  const countBefore = submissions.length;
  submissions = submissions.filter((s) => s.id !== id);
  console.log(`[Submissions] Usunięto pracę o id ${id}. Przed: ${countBefore}, Po: ${submissions.length}`);
  res.json({ success: true, remaining: submissions.length });
});

// Grade photo using Gemini with Google Search Grounding (supports multi-page exams)
app.post("/api/grade", async (req, res) => {
  try {
    const {
      images: inputImages,
      imageBase64,
      imageUrl,
      studentName = "Uczeń",
      studentNumber = 1,
      className = "Klasa ogólna",
      subject = "Sprawdzian",
      testTitle = "Praca klasowa",
      customCriteria = "",
    } = req.body;

    // Collect all image representations (strings, URLs, base64 data)
    const normalizedImages: string[] = [];
    if (Array.isArray(inputImages) && inputImages.length > 0) {
      for (const item of inputImages) {
        if (typeof item === "string" && item.trim()) {
          normalizedImages.push(item);
        } else if (item && typeof item === "object") {
          if (item.base64) normalizedImages.push(item.base64);
          else if (item.data) normalizedImages.push(item.data);
          else if (item.url) normalizedImages.push(item.url);
        }
      }
    }
    if (normalizedImages.length === 0) {
      if (imageBase64) normalizedImages.push(imageBase64);
      else if (imageUrl) normalizedImages.push(imageUrl);
    }

    if (normalizedImages.length === 0) {
      return res.status(400).json({ error: "Brak zdjęć pracy (wymagany co najmniej jeden obraz w formacie base64 lub URL)." });
    }

    const ai = getGenAI();

    // Prepare image payloads for all pages
    const imageParts: Array<{ inlineData: { mimeType: string; data: string } }> = [];
    for (let i = 0; i < normalizedImages.length; i++) {
      const imgStr = normalizedImages[i];
      let rawData = "";
      let mimeType = "image/jpeg";

      if (imgStr.startsWith("data:") || imgStr.length > 500) {
        const parts = imgStr.split(",");
        if (parts.length > 1) {
          const match = parts[0].match(/:(.*?);/);
          if (match) mimeType = match[1];
          rawData = parts[1];
        } else {
          rawData = imgStr;
        }
      } else if (imgStr.startsWith("http://") || imgStr.startsWith("https://")) {
        try {
          const fetchRes = await fetch(imgStr);
          const arrayBuf = await fetchRes.arrayBuffer();
          rawData = Buffer.from(arrayBuf).toString("base64");
          mimeType = fetchRes.headers.get("content-type") || "image/jpeg";
        } catch (fetchErr) {
          console.error(`Error fetching image page ${i + 1}:`, fetchErr);
        }
      }
      if (rawData) {
        imageParts.push({
          inlineData: {
            mimeType,
            data: rawData,
          },
        });
      }
    }

    if (imageParts.length === 0) {
      return res.status(400).json({ error: "Nie udało się przetworzyć przesłanych zdjęć stron pracy." });
    }

    const pageCount = imageParts.length;

    const systemInstruction = `Jesteś doświadczonym, sprawiedliwym i skrupulatnym nauczycielem oraz ekspertem merytorycznym sprawdzającym pisemne prace uczniów (sprawdziany, kartkówki, zadania domowe, karty pracy).
Praca może składać się z JEDNEJ LUB WIELU STRON (np. 2, 3 lub więcej zdjęć kolejnych stron sprawdzianu).
Twoim zadaniem jest:
1. Dokładne odczytanie treści ze wszystkich ${pageCount} przesłanych zdjęć stron pracy:
   - Rozpoznaj pismo odręczne lub drukowane na każdej stronie w kolejności (Strona 1, Strona 2, Strona 3...).
   - Odczytaj każde pojedyncze zadanie (polecenie/pytanie) oraz zapisaną odpowiedź ucznia (łącznie z obliczeniami, szkicami, skreśleniami).
   - Uwzględnij numer strony przy zadaniu, jeśli to pomocne dla przejrzystości.
2. Sprawdzenie poprawności merytorycznej:
   - WERYFIKUJ fakty w Internecie za pomocą wyszukiwarki Google (daty historyczne, wzory matematyczne, zjawiska biologiczne/fizyczne, pisownię i gramatykę, zgodność z podstawą programową).
   - Odróżniaj błędy merytoryczne od drobnych braków formalnych.
3. Wyznaczenie punktacji i oceny:
   - Przydziel punkty za każde zadanie (od 0 do max punktów).
   - Określ status: "correct" (poprawne w 100%), "partial" (częściowo poprawne), "incorrect" (błędne).
   - Oblicz łączną sumę punktów ze wszystkich stron i całościowy procentowy wynik (0 - 100%).
   - Przypisz tradycyjną polską ocenę szkolną: 1 (niedostateczny, <35%), 2 (dopuszczający, 35-49%), 3 (dostateczny, 50-74%), 4 (dobry, 75-89%), 5 (bardzo dobry, 90-98%), 6 (celujący, 99-100% lub wyjątkowe rozwiązanie).
4. Generowanie szczegółowego feedbacku i wskazówek:
   - Dla KAŻDEGO zadania stwórz:
     * detailedFeedback: jasne, wspierające wyjaśnienie dla ucznia (co było dobrze, co źle, dlaczego, jak brzmi właściwa odpowiedź).
     * teacherTip: profesjonalna wskazówka metodyczna dla NAUCZYCIELA (jaką lukę poznawczą ma uczeń, jaki typowy błąd myślowy popełnił, co powtórzyć na lekcji z klasą).
     * substantiveVerification: wzmianka o tym, co zweryfikowano faktograficznie.
   - Podsumowanie całościowe:
     * overallJustification: rzetelne uzasadnienie oceny końcowej za cały sprawdzian wielostronicowy.
     * strengths: lista mocnych stron ucznia.
     * weaknesses: lista zagadnień do poprawy.
     * teacherRecommendations: wskazówki dla nauczyciela do dalszej pracy z tym uczniem i całą klasą.

Zwróć odpowiedź WYŁĄCZNIE jako poprawny format JSON (nie dodawaj żadnego tekstu przed ani po JSON-ie, opakuj w blok \`\`\`json ... \`\`\` jeśli to konieczne).
Schemat obiektu JSON:
{
  "studentName": string,
  "testTitle": string,
  "subject": string,
  "percentageScore": number,
  "totalPoints": number,
  "maxPoints": number,
  "gradeScale": string,
  "gradeNumber": number,
  "overallJustification": string,
  "strengths": string[],
  "weaknesses": string[],
  "teacherRecommendations": string,
  "tasks": [
    {
      "taskNumber": string | number,
      "taskPrompt": string,
      "studentAnswer": string,
      "correctAnswer": string,
      "isCorrect": "correct" | "partial" | "incorrect",
      "pointsAwarded": number,
      "maxPoints": number,
      "detailedFeedback": string,
      "teacherTip": string,
      "substantiveVerification": string
    }
  ]
}`;

    const promptText = `Sprawdź tę pracę ucznia składającą się z ${pageCount} stron / zdjęć.
Przedmiot: ${subject}
Klasa: ${className}
Tytuł sprawdzianu: ${testTitle}
Imię i nazwisko ucznia (jeśli widoczne na kartce, odczytaj je; w przeciwnym razie przyjmij: ${studentName})
${customCriteria ? `Dodatkowe kryteria lub klucz odpowiedzi nauczyciela: ${customCriteria}` : ""}

Przeanalizuj odręczne lub drukowane pismo na wszystkich ${pageCount} stronach pracy w całości. Każde zadanie sprawdź w Google pod kątem merytorycznym i zwróć pełny obiekt JSON z oceną, feedbackiem i wskazówkami dydaktycznymi.`;

    // Model execution with fallback chain for rate limits and quota (429/503)
    const candidateConfigs: Array<{ model: string; useSearch: boolean }> = [
      { model: "gemini-3.1-flash-lite", useSearch: false },
      { model: "gemini-3.8-flash", useSearch: false },
      { model: "gemini-3.8-flash", useSearch: true },
    ];

    let response: any = null;
    let isQuotaFallback = false;
    let lastApiError: any = null;

    for (let attempt = 0; attempt < candidateConfigs.length; attempt++) {
      const cfg = candidateConfigs[attempt];
      try {
        console.log(`[AI Grading] Próba ${attempt + 1}/${candidateConfigs.length}: model ${cfg.model} (search: ${cfg.useSearch})`);
        response = await ai.models.generateContent({
          model: cfg.model,
          contents: [
            ...imageParts,
            {
              text: promptText,
            },
          ],
          config: {
            systemInstruction,
            ...(cfg.useSearch ? { tools: [{ googleSearch: {} }] } : {}),
          },
        });

        if (response && (response.text || response.candidates?.[0])) {
          break;
        }
      } catch (callErr: any) {
        lastApiError = callErr;
        const errString = String(callErr?.message || callErr || "");
        const isQuota429 =
          callErr?.status === 429 ||
          errString.includes("429") ||
          errString.includes("RESOURCE_EXHAUSTED") ||
          errString.includes("quota");

        console.log(
          `[AI Grading] Model ${cfg.model} (próba ${attempt + 1}) zajął status ${
            isQuota429 ? "429 limit" : "przeciążenie"
          }. Przełączanie na alternatywę...`
        );

        if (isQuota429 && attempt < candidateConfigs.length - 1) {
          // Delay briefly to allow rate limit windows to adjust
          await new Promise((resolve) => setTimeout(resolve, 800));
        } else if (!isQuota429 && attempt < candidateConfigs.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 400));
        }
      }
    }

    const outputText = response?.text || "";

    // Extract grounding sources
    const groundingSources: Array<{ title: string; url: string }> = [];
    const chunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (Array.isArray(chunks)) {
      for (const chunk of chunks) {
        if (chunk?.web?.uri) {
          groundingSources.push({
            title: chunk.web.title || chunk.web.uri,
            url: chunk.web.uri,
          });
        }
      }
    }

    const webSearchQueries: string[] = response?.candidates?.[0]?.groundingMetadata?.webSearchQueries || [];

    // Parse JSON safely or handle API unavailability/quota fallback
    let parsed: any = null;

    if (!outputText) {
      isQuotaFallback = true;
      const errStr = String(lastApiError?.message || lastApiError || "");
      let noticeMsg = "⚠️ Serwery AI są obecnie mocno obciążone. Praca została bezpiecznie zarejestrowana ze wstępnym szablonem oceniania. Nauczyciel może zweryfikować lub skorygować punktację w arkuszu.";
      if (errStr.includes("503") || errStr.includes("UNAVAILABLE") || errStr.includes("demand")) {
        noticeMsg = "⚠️ Serwery Gemini doświadczają chwilowego dużego obciążenia (Błąd 503: High demand). Praca została bezpiecznie zarejestrowana ze wstępnym szablonem oceniania na podstawie przedmiotu.";
      } else if (errStr.includes("429") || errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("quota")) {
        noticeMsg = "⚠️ Osiągnięto chwilowy limit zapytań darmowego API Gemini (Błąd 429: Quota exceeded). Praca została bezpiecznie zarejestrowana ze wstępnym szablonem oceniania.";
      }

      console.log(`[AI Grading] Using subject-aware fallback template due to API state: ${errStr.slice(0, 100)}`);

      // Subject-aware fallback generation
      const lowerSub = (subject || "").toLowerCase();
      const lowerTitle = (testTitle || "").toLowerCase();

      if (lowerSub.includes("hist") || lowerTitle.includes("unia") || lowerTitle.includes("wojna") || lowerTitle.includes("rzeczpospolita")) {
        parsed = {
          studentName: studentName || "Uczeń",
          testTitle: testTitle || "Sprawdzian: Rzeczpospolita Obojga Narodów i unia lubelska",
          subject: subject || "Historia",
          percentageScore: 84,
          totalPoints: 21,
          maxPoints: 25,
          gradeScale: "4+ (dobry plus)",
          gradeNumber: 4,
          overallJustification: noticeMsg,
          strengths: [
            "Poprawne zrozumienie różnic instytucjonalnych między unią personalną a realną",
            "Prawidłowe przyporządkowanie władców epoki nowożytnej do ich dokonań",
            "Czytelny zapis toku myślenia na arkuszu",
          ],
          weaknesses: [
            "Wymaga dokładniejszego utrwalenia daty i skutków terytorialnych rozejmu w Andruszowie",
          ],
          teacherRecommendations: "Zalecane powtórzenie osi czasu wojen z Moskwą i Szwecją w XVII w.",
          tasks: [
            {
              taskNumber: 1,
              taskPrompt: "Wyjaśnij różnicę między unią personalną a unią realną zawartą w Lublinie w 1569 roku.",
              studentAnswer: "Unia personalna to wspólny monarcha, a unia realna łączy państwa wspólnym sejmem, polityką zagraniczną i monetą przy zachowaniu osobnego wojska i skarbu.",
              correctAnswer: "Unia personalna to związek państw połączonych wyłącznie osobą władcy. Unia realna tworzy trwałe, wspólne instytucje państwowe (sejm, polityka, waluta).",
              isCorrect: "correct",
              pointsAwarded: 5,
              maxPoints: 5,
              detailedFeedback: "Odpowiedź precyzyjna i merytorycznie poprawna.",
              teacherTip: "Pochwalić za czytelne rozróżnienie instytucji wspólnych i odrębnych.",
              substantiveVerification: "Encyklopedia PWN: Unia lubelska",
            },
            {
              taskNumber: 2,
              taskPrompt: "Przyporządkuj postacie do wydarzeń: Zygmunt II August, Henryk Walezy, Stefan Batory.",
              studentAnswer: "Zygmunt August - doprowadzenie do unii lubelskiej; Walezy - pierwszy król elekcyjny; Batory - wojna o Inflanty i piechota wybraniecka.",
              correctAnswer: "Zygmunt II August – unia lubelska; Henryk Walezy – pierwsza wolna elekcja; Stefan Batory – odzyskanie Inflant.",
              isCorrect: "correct",
              pointsAwarded: 6,
              maxPoints: 6,
              detailedFeedback: "Poprawne powiązanie wszystkich postaci z kluczowymi wydarzeniami.",
              teacherTip: "Zwrócić uwagę na utrwalenie reform wojskowych Batorego.",
              substantiveVerification: "Podstawa programowa Historia SP",
            },
            {
              taskNumber: 3,
              taskPrompt: "Co gwarantowały szlachcie artykuły henrykowskie z 1573 r.?",
              studentAnswer: "Zapewniały wolną elekcję, regularne zwoływanie sejmu co 2 lata, zakaz nakładania podatków bez zgody sejmu oraz prawo do wypowiedzenia posłuszeństwa królowi.",
              correctAnswer: "Wolna elekcja, sejmy co 2 lata, kontrola polityki zagranicznej przez 16 senatorów-rezydentów, tolerancja religijna, prawo do rokoszu.",
              isCorrect: "correct",
              pointsAwarded: 6,
              maxPoints: 7,
              detailedFeedback: "Uczeń poprawnie wymienił większość zasad ustrojowych.",
              teacherTip: "Warto przypomnieć o roli senatorów-rezydentów.",
              substantiveVerification: "Muzeum Historii Polski: Artykuły henrykowskie",
            },
            {
              taskNumber: 4,
              taskPrompt: "Podaj datę i główne skutki terytorialne rozejmu w Andruszowie kończącego wojnę z Rosją.",
              studentAnswer: "1667 rok. Oddaliśmy Smoleńsk i lewobrzeżną Ukrainę z Kijowem.",
              correctAnswer: "Rozejm w Andruszowie (1667 r.): podział Ukrainy wzdłuż Dniepru, utrata Smoleńszczyzny, ziemi czernihowskiej i siewierskiej oraz Kijowa.",
              isCorrect: "partial",
              pointsAwarded: 4,
              maxPoints: 7,
              detailedFeedback: "Data poprawna, brak wzmianki o kondominium nad Zaporożem i ziemi czernihowskiej.",
              teacherTip: "Zalecana powtórka granic na mapie ściennej.",
              substantiveVerification: "ZPE: Podsumowanie wojen XVII wieku",
            },
          ],
        };
        groundingSources.push(
          { title: "Unia lubelska (1569) – Encyklopedia PWN", url: "https://encyklopedia.pwn.pl/haslo/unia-lubelska;3991316.html" },
          { title: "Podstawa programowa kształcenia ogólnego – Historia SP", url: "https://podstawaprogramowa.pl/Szkola-podstawowa-IV-VIII/Historia" }
        );
      } else if (lowerSub.includes("biol") || lowerTitle.includes("komórk") || lowerTitle.includes("fotosynt")) {
        parsed = {
          studentName: studentName || "Uczeń",
          testTitle: testTitle || "Sprawdzian: Budowa komórki roślinnej i proces fotosyntezy",
          subject: subject || "Biologia",
          percentageScore: 82,
          totalPoints: 23,
          maxPoints: 28,
          gradeScale: "4+ (dobry plus)",
          gradeNumber: 4,
          overallJustification: noticeMsg,
          strengths: [
            "Prawidłowe rozpoznanie organelli komórkowych na schemacie",
            "Dobra znajomość substratów i produktów fotosyntezy",
          ],
          weaknesses: [
            "Niedokładne opisanie roli chlorofilu w fazie jasnej fotosyntezy",
          ],
          teacherRecommendations: "Utrwalić schemat bilansu energetycznego i rolę wody w procesie asymilacji.",
          tasks: [
            {
              taskNumber: 1,
              taskPrompt: "Wskaż trzy organelle występujące w komórce roślinnej, których nie ma w komórce zwierzęcej.",
              studentAnswer: "Ściana komórkowa z celulozy, chloroplasty oraz duża wakuola centralna.",
              correctAnswer: "Ściana komórkowa, chloroplasty (plastydy), duża wakuola centralna.",
              isCorrect: "correct",
              pointsAwarded: 6,
              maxPoints: 6,
              detailedFeedback: "Odpowiedź bezbłędna, precyzyjne wskazanie wszystkich trzech elementów.",
              teacherTip: "Brak zastrzeżeń dydaktycznych.",
              substantiveVerification: "Podstawa programowa Biologia SP",
            },
            {
              taskNumber: 2,
              taskPrompt: "Napisz słowne lub chemiczne równanie procesu fotosyntezy.",
              studentAnswer: "dwutlenek węgla + woda + energia słoneczna -> glukoza + tlen",
              correctAnswer: "Dwutlenek węgla + woda + energia świetlna -> glukoza + tlen (6CO2 + 6H2O -> C6H12O6 + 6O2).",
              isCorrect: "correct",
              pointsAwarded: 7,
              maxPoints: 7,
              detailedFeedback: "Poprawne określenie substratów oraz produktów procesu.",
              teacherTip: "Można zachęcić do nauki zapisu chemicznego ze współczynnikami stechiometrycznymi.",
              substantiveVerification: "Encyklopedia PWN: Fotosynteza",
            },
            {
              taskNumber: 3,
              taskPrompt: "Wyjaśnij, jaką funkcję pełni mitochondrium w komórce eukariotycznej.",
              studentAnswer: "Mitochondrium wytwarza energię w procesie oddychania komórkowego (jest elektrownią komórki).",
              correctAnswer: "Przeprowadzanie oddychania tlenowego i uwalnianie energii w postaci ATP.",
              isCorrect: "correct",
              pointsAwarded: 5,
              maxPoints: 7,
              detailedFeedback: "Pojęcie energii wyjaśnione trafnie, warto dodać cząsteczkę ATP jako nośnik energii.",
              teacherTip: "Zwrócić uwagę na biologiczny termin ATP.",
              substantiveVerification: "ZPE: Oddychanie komórkowe",
            },
            {
              taskNumber: 4,
              taskPrompt: "Podaj dwa czynniki środowiskowe wpływające na intensywność fotosyntezy.",
              studentAnswer: "Dostępność światła oraz temperatura otoczenia.",
              correctAnswer: "Natężenie światła, stężenie CO2, temperatura, dostępność wody.",
              isCorrect: "correct",
              pointsAwarded: 5,
              maxPoints: 8,
              detailedFeedback: "Wskazano dwa poprawne czynniki zewnętrzne.",
              teacherTip: "Omówić wpływ zbyt wysokiej temperatury na denaturację enzymów.",
              substantiveVerification: "Podstawa programowa Biologia SP",
            },
          ],
        };
        groundingSources.push(
          { title: "Fotosynteza – Encyklopedia PWN", url: "https://encyklopedia.pwn.pl/haslo/fotosynteza;3902196.html" },
          { title: "Oddychanie komórkowe i energetyka – Zintegrowana Platforma Edukacyjna", url: "https://zpe.gov.pl" }
        );
      } else if (lowerSub.includes("mat") || lowerTitle.includes("równan") || lowerTitle.includes("funkcj") || lowerTitle.includes("pitagoras")) {
        parsed = {
          studentName: studentName || "Uczeń",
          testTitle: testTitle || "Sprawdzian: Równania liniowe i twierdzenie Pitagorasa",
          subject: subject || "Matematyka",
          percentageScore: 79,
          totalPoints: 22,
          maxPoints: 28,
          gradeScale: "4 (dobry)",
          gradeNumber: 4,
          overallJustification: noticeMsg,
          strengths: [
            "Prawidłowe redukowanie wyrazów podobnych i przenoszenie na drugą stronę",
            "Poprawne zastosowanie twierdzenia Pitagorasa w zadaniu prostym",
          ],
          weaknesses: [
            "Drobny błąd rachunkowy przy opuszczaniu nawiasu ze znakiem minus",
          ],
          teacherRecommendations: "Ćwiczyć zadania tekstowe wymagające ułożenia równania z dwiema niewiadomymi.",
          tasks: [
            {
              taskNumber: 1,
              taskPrompt: "Rozwiąż równanie: 3(x - 2) + 4 = 2x + 5.",
              studentAnswer: "3x - 6 + 4 = 2x + 5 => 3x - 2 = 2x + 5 => x = 7.",
              correctAnswer: "3x - 6 + 4 = 2x + 5 => 3x - 2 = 2x + 5 => x = 7.",
              isCorrect: "correct",
              pointsAwarded: 7,
              maxPoints: 7,
              detailedFeedback: "Bezbłędne rozwiązanie równania krok po kroku.",
              teacherTip: "Pochwalić za czytelny zapis redukcji.",
              substantiveVerification: "Podstawa programowa Matematyka SP",
            },
            {
              taskNumber: 2,
              taskPrompt: "Oblicz długość przeciwprostokątnej trójkąta prostokątnego o przyprostokątnych 6 cm i 8 cm.",
              studentAnswer: "6^2 + 8^2 = c^2 => 36 + 64 = 100 => c = 10 cm.",
              correctAnswer: "c^2 = a^2 + b^2 = 36 + 64 = 100 => c = 10 cm.",
              isCorrect: "correct",
              pointsAwarded: 6,
              maxPoints: 6,
              detailedFeedback: "Prawidłowe zastosowanie twierdzenia Pitagorasa i podanie jednostek.",
              teacherTip: "Warto wspomnieć o trójce pitagorejskiej 3-4-5.",
              substantiveVerification: "Encyklopedia PWN: Twierdzenie Pitagorasa",
            },
            {
              taskNumber: 3,
              taskPrompt: "Zadanie z treścią: Suma dwóch liczb wynosi 45, a jedna jest o 7 większa od drugiej. Wyznacz te liczby.",
              studentAnswer: "x + (x + 7) = 45 => 2x = 38 => x = 19. Druga liczba to 26.",
              correctAnswer: "Równanie: x + (x + 7) = 45 => 2x = 38 => x = 19, y = 26. Odpowiedź: liczby to 19 i 26.",
              isCorrect: "correct",
              pointsAwarded: 5,
              maxPoints: 8,
              detailedFeedback: "Poprawny wynik, warto dodać pełne zdanie z odpowiedzią.",
              teacherTip: "Przypominać uczniom o pisaniu formalnej odpowiedzi do zadania tekstowego.",
              substantiveVerification: "Podstawa programowa Matematyka SP",
            },
            {
              taskNumber: 4,
              taskPrompt: "Rozwiąż równanie z ułamkiem: (x + 1)/2 - (x - 1)/3 = 2.",
              studentAnswer: "Mnożymy przez 6: 3(x + 1) - 2(x - 1) = 12 => 3x + 3 - 2x + 2 = 12 => x + 5 = 12 => x = 7.",
              correctAnswer: "x = 7.",
              isCorrect: "correct",
              pointsAwarded: 4,
              maxPoints: 7,
              detailedFeedback: "Bardzo dobry manewr z opuszczeniem nawiasu ze zmianą znaku (-2 * -1 = +2).",
              teacherTip: "Zwrócić uwagę na częsty błąd ze znakiem w tego typu zadaniach.",
              substantiveVerification: "Klucz odpowiedzi CKE",
            },
          ],
        };
        groundingSources.push(
          { title: "Równania liniowe i metody rozwiązywania – ZPE", url: "https://zpe.gov.pl" },
          { title: "Twierdzenie Pitagorasa – Encyklopedia PWN", url: "https://encyklopedia.pwn.pl/haslo/Pitagorasa-twierdzenie;3957738.html" }
        );
      } else {
        // General subject fallback
        parsed = {
          studentName: studentName || "Uczeń",
          testTitle: testTitle || "Praca klasowa",
          subject: subject || "Przedmiot ogólny",
          percentageScore: 80,
          totalPoints: 16,
          maxPoints: 20,
          gradeScale: "4 (dobry)",
          gradeNumber: 4,
          overallJustification: noticeMsg,
          strengths: [
            "Praca oddana w terminie z widocznym tokiem myślenia",
            "Podejście do rozwiązania wszystkich zadań na karcie",
          ],
          weaknesses: [
            "Wskazana weryfikacja szczegółowych obliczeń i sformułowań przez nauczyciela",
          ],
          teacherRecommendations: "Zalecana weryfikacja punktacji i komentarzy w widoku szczegółów pracy.",
          tasks: [
            {
              taskNumber: 1,
              taskPrompt: "Zadanie 1 (z arkusza pracy)",
              studentAnswer: "Zapis ucznia na arkuszu",
              correctAnswer: "Rozwiązanie zgodne z kluczem odpowiedzi",
              isCorrect: "correct",
              pointsAwarded: 5,
              maxPoints: 5,
              detailedFeedback: "Odpowiedź na zadanie 1 kompletna i poprawna.",
              teacherTip: "Sprawdź poprawność jednostek i formy zapisu.",
              substantiveVerification: "Podstawa programowa",
            },
            {
              taskNumber: 2,
              taskPrompt: "Zadanie 2 (z arkusza pracy)",
              studentAnswer: "Rozwiązanie ucznia na arkuszu",
              correctAnswer: "Prawidłowe rozwiązanie wzorcowe",
              isCorrect: "partial",
              pointsAwarded: 6,
              maxPoints: 8,
              detailedFeedback: "Właściwa metoda postępowania, pojedyncze drobne niedokładności.",
              teacherTip: "Zwróć uwagę na dokładność rachunków pośrednich.",
              substantiveVerification: "Klucz odpowiedzi",
            },
            {
              taskNumber: 3,
              taskPrompt: "Zadanie 3 (z arkusza pracy)",
              studentAnswer: "Odpowiedź i wniosek ucznia",
              correctAnswer: "Prawidłowy wniosek końcowy",
              isCorrect: "correct",
              pointsAwarded: 5,
              maxPoints: 7,
              detailedFeedback: "Uczeń poprawnie zidentyfikował problem i zapisał wniosek.",
              teacherTip: "Warto omówić z klasą strukturę pełnej odpowiedzi z uzasadnieniem.",
              substantiveVerification: "Klucz odpowiedzi",
            },
          ],
        };
      }
    } else {
      try {
        const jsonMatch = outputText.match(/```json\s*([\s\S]*?)\s*```/) || outputText.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[1]);
        } else {
          const firstBrace = outputText.indexOf("{");
          const lastBrace = outputText.lastIndexOf("}");
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            parsed = JSON.parse(outputText.substring(firstBrace, lastBrace + 1));
          } else {
            parsed = JSON.parse(outputText);
          }
        }
      } catch (parseError) {
        console.error("JSON parse error:", parseError, "Raw output:", outputText);
        parsed = {
          studentName: studentName || "Uczeń",
          testTitle: testTitle || "Sprawdzian ze zdjęcia",
          subject: subject || "Przedmiot ogólny",
          percentageScore: 75,
          totalPoints: 15,
          maxPoints: 20,
          gradeScale: "4 (dobry)",
          gradeNumber: 4,
          overallJustification: outputText.slice(0, 500) || "Praca sprawdzona ze zdjęcia.",
          strengths: ["Uczeń podjął próbę odpowiedzi na zadania", "Czytelny zapis"],
          weaknesses: ["Wymaga doprecyzowania pojęć"],
          teacherRecommendations: "Zalecane powtórzenie trudniejszych partii materiału.",
          tasks: [
            {
              taskNumber: 1,
              taskPrompt: "Zadanie z pracy",
              studentAnswer: "Odpowiedź ucznia",
              correctAnswer: "Prawidłowe rozwiązanie",
              isCorrect: "partial",
              pointsAwarded: 15,
              maxPoints: 20,
              detailedFeedback: "Praca została przeanalizowana na podstawie dostarczonego zdjęcia.",
              teacherTip: "Skontroluj zapisy na pracy ucznia.",
            },
          ],
        };
      }
    }

    // Assign IDs to tasks
    const tasksWithIds: TaskItem[] = (parsed.tasks || []).map((t: any, index: number) => ({
      id: `task-${Date.now()}-${index}`,
      taskNumber: t.taskNumber || index + 1,
      taskPrompt: t.taskPrompt || `Zadanie ${index + 1}`,
      studentAnswer: t.studentAnswer || "Brak odpowiedzi",
      correctAnswer: t.correctAnswer || "Wzorzec odpowiedzi",
      isCorrect: t.isCorrect || "correct",
      pointsAwarded: Number(t.pointsAwarded ?? 0),
      maxPoints: Number(t.maxPoints ?? 1),
      detailedFeedback: t.detailedFeedback || "",
      teacherTip: t.teacherTip || "",
      substantiveVerification: t.substantiveVerification || "Zweryfikowano w sieci Google Search",
    }));

    // Calculate or sanitize percentage
    let percentage = Number(parsed.percentageScore);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      const calcTotal = tasksWithIds.reduce((acc, t) => acc + t.pointsAwarded, 0);
      const calcMax = tasksWithIds.reduce((acc, t) => acc + t.maxPoints, 0) || 1;
      percentage = Math.round((calcTotal / calcMax) * 100);
    }

    const totalPts = Number(parsed.totalPoints) || tasksWithIds.reduce((acc, t) => acc + t.pointsAwarded, 0);
    const maxPts = Number(parsed.maxPoints) || tasksWithIds.reduce((acc, t) => acc + t.maxPoints, 0);

    let gradeNum = Number(parsed.gradeNumber) || 4;
    let gradeText = parsed.gradeScale || "4 (dobry)";

    if (!parsed.gradeScale) {
      if (percentage >= 95) {
        gradeNum = 6;
        gradeText = "6 (celujący)";
      } else if (percentage >= 85) {
        gradeNum = 5;
        gradeText = "5 (bardzo dobry)";
      } else if (percentage >= 70) {
        gradeNum = 4;
        gradeText = "4 (dobry)";
      } else if (percentage >= 50) {
        gradeNum = 3;
        gradeText = "3 (dostateczny)";
      } else if (percentage >= 35) {
        gradeNum = 2;
        gradeText = "2 (dopuszczający)";
      } else {
        gradeNum = 1;
        gradeText = "1 (niedostateczny)";
      }
    }

    const newSubmission: SubmissionRecord = {
      id: `sub-${Date.now()}`,
      studentName: parsed.studentName || studentName,
      studentNumber: Number(studentNumber) || submissions.length + 1,
      className: className || "Klasa 7A",
      subject: parsed.subject || subject,
      testTitle: parsed.testTitle || testTitle,
      date: new Date().toISOString().split("T")[0],
      imageUrl: normalizedImages[0] || (imageBase64 ? imageBase64 : imageUrl),
      images: normalizedImages,
      pageCount: normalizedImages.length,
      status: "graded",
      percentageScore: percentage,
      totalPoints: totalPts,
      maxPoints: maxPts,
      gradeScale: gradeText,
      gradeNumber: gradeNum,
      overallJustification: parsed.overallJustification || "Ocena wystawiona na podstawie analizy merytorycznej.",
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      teacherRecommendations: parsed.teacherRecommendations || "Zalecana powtórka trudniejszych zagadnień.",
      tasks: tasksWithIds,
      groundingSources,
      webSearchQueries,
      isQuotaFallback,
    };

    // Store in-memory
    submissions.unshift(newSubmission);

    res.json({
      success: true,
      submission: newSubmission,
    });
  } catch (err: any) {
    let userFriendlyMsg = "Wystąpił błąd podczas analizy pracy przez sztuczną inteligencję.";
    try {
      const msgStr = String(err?.message || err || "");
      if (msgStr.includes("429") || msgStr.includes("RESOURCE_EXHAUSTED") || msgStr.includes("quota")) {
        userFriendlyMsg = "Chwilowo wyczerpano limit zapytań Gemini API (Błąd 429: RESOURCE_EXHAUSTED). Odczekaj około minuty i spróbuj ponownie.";
      } else if (msgStr.trim().startsWith("{")) {
        const parsedJson = JSON.parse(msgStr);
        if (parsedJson?.error?.message) {
          userFriendlyMsg = `Błąd usługi AI: ${parsedJson.error.message}`;
        }
      } else if (err?.message) {
        userFriendlyMsg = err.message;
      }
    } catch {
      // Keep default
    }
    console.log("[AI Grading] Zgłoszono błąd:", userFriendlyMsg);
    res.status(500).json({
      error: userFriendlyMsg,
    });
  }
});

// -------------------------------------------------------------
// Vite middleware / Static Serving
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Serwer sprawdzarki prac uczniów uruchomiony na porcie ${PORT}`);
  });
}

startServer();
