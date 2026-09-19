import { StudentSubmission } from '../types';

export const INITIAL_SUBMISSIONS: StudentSubmission[] = [
  {
    id: 'sub-1',
    studentName: 'Zofia Kamińska',
    studentNumber: 1,
    className: 'TEST',
    subject: 'Historia',
    testTitle: 'Sprawdzian: Rzeczpospolita Obojga Narodów i unia lubelska',
    date: '2026-09-18',
    imageUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80',
    images: [
      'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&w=800&q=80'
    ],
    pageCount: 3,
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
        title: 'Unia lubelska – struktura państwa i podział urzędów (Zintegrowana Platforma Edukacyjna MEN)',
        url: 'https://zpe.gov.pl/a/unia-lubelska/D165g5w32'
      },
      {
        title: 'Pacta conventa a artykuły henrykowskie – różnice ustrojowe',
        url: 'https://ciekawostkihistoryczne.pl/artykuly-henrykowskie-a-pacta-conventa/'
      }
    ],
    webSearchQueries: [
      'Różnice artykuły henrykowskie a pacta conventa historia klasa 7',
      'Instytucje wspólne i odrębne unii lubelskiej ZPE'
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
    webSearchQueries: ['Andruszowo 1667 rozejm granice'],
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
        detailedFeedback: 'Wzorcowa, akademicka definicja ze wskazaniem Statutów Litewskich.',
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

export const DEFAULT_CLASSES: string[] = [
  'TEST',
  'Klasa 4A',
  'Klasa 4B',
  'Klasa 5A',
  'Klasa 5B',
  'Klasa 6A',
  'Klasa 6B',
  'Klasa 7A',
  'Klasa 7B',
  'Klasa 7C',
  'Klasa 8A',
  'Klasa 8B',
  'Klasa 1 LO',
  'Klasa 2 LO',
  'Klasa 3 LO',
  'Klasa 4 LO',
  'Klasa 1 Technikum',
  'Klasa 2 Technikum',
  'Grupa Językowa A2/B1',
  'Koło Olimpijskie'
];

// Sample test photos that users can try with a single click if they don't have an image on hand
export const SAMPLE_TEST_PRESETS = [
  {
    id: 'sample-multi-math',
    title: 'Wielostronicowy Sprawdzian (3 strony – Matematyka)',
    subject: 'Matematyka',
    className: 'Klasa 8B',
    studentName: 'Kacper Wiśniewski',
    studentNumber: 14,
    testTitle: 'Sprawdzian: Równania liniowe, funkcje i twierdzenie Pitagorasa (3 arkusze)',
    previewUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80',
    pages: [
      'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&w=800&q=80',
    ],
    description: 'Pełny 3-stronicowy sprawdzian: Strona 1 (algebra i równania), Strona 2 (zadania tekstowe), Strona 3 (geometria i rysunki pomocnicze).',
  },
  {
    id: 'sample-biology',
    title: 'Sprawdzian z Biologii (2 strony – Komórka i fotosynteza)',
    subject: 'Biologia',
    className: 'Klasa 7C',
    studentName: 'Maja Dąbrowska',
    studentNumber: 6,
    testTitle: 'Sprawdzian: Budowa komórki roślinnej i proces fotosyntezy',
    previewUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
    pages: [
      'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=800&q=80',
    ],
    description: 'Strona 1 (schematy komórek i organelli) oraz Strona 2 (pytania otwarte i bilans chemiczny).',
  },
  {
    id: 'sample-history',
    title: 'Sprawdzian z Historii (Polska Jagiellonów)',
    subject: 'Historia',
    className: 'Klasa 7A',
    studentName: 'Piotr Lewandowski',
    studentNumber: 9,
    testTitle: 'Sprawdzian: Rzeczpospolita Obojga Narodów i unia lubelska',
    previewUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80',
    pages: [
      'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80',
    ],
    description: 'Unia lubelska 1569, artykuły henrykowskie, pierwsi królowie elekcyjni oraz rozejm w Andruszowie.',
  }
];
