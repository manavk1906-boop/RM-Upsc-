import type { SupportedLanguage } from '../i18n/translations.ts';

export interface SeedSubject {
  slug: string;
  nameEn: string;
  nameHi: string;
  nameGu: string;
  stage: 'prelims' | 'mains' | 'both';
  sortOrder: number;
}

export interface SeedQuestion {
  externalCode: string;
  subjectSlug: string;
  topicName: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  questionType:
    | 'single_mcq'
    | 'multiple_statement'
    | 'assertion_reason'
    | 'match_following'
    | 'chronological'
    | 'map_based'
    | 'analytical'
    | 'interdisciplinary';
  paperCode: 'GS_I' | 'CSAT_II';
  isPyq: boolean;
  pyqYear: number | null;
  marks: number;
  negativeMarks: number;
  sourceTitle: string;
  citationText: string;
  status: 'approved' | 'pending_review';
  isAiGenerated?: boolean;
  translations: Record<
    SupportedLanguage,
    {
      questionText: string;
      explanation: string;
      isOfficialTranslation: boolean;
      options: Array<{ key: 'A' | 'B' | 'C' | 'D'; text: string }>;
    }
  >;
  correctOption: 'A' | 'B' | 'C' | 'D';
}

export interface SeedMainsPaper {
  paperCode: string;
  titleEn: string;
  titleHi: string;
  titleGu: string;
  maxMarks: number;
  durationMinutes: number;
  isQualifying: boolean;
  qualifyingNote?: string;
  samplePrompts: Array<{
    id: string;
    wordLimit: number;
    marks: number;
    topic: string;
    promptEn: string;
    promptHi: string;
    promptGu: string;
  }>;
}

export const DIFFICULTY_LABELS: Record<number, { en: string; hi: string; gu: string }> = {
  1: { en: 'Foundation', hi: 'आधारभूत', gu: 'પાયાનું' },
  2: { en: 'Moderate', hi: 'मध्यम', gu: 'મધ્યમ' },
  3: { en: 'Advanced', hi: 'उन्नत', gu: 'અદ્યતન' },
  4: { en: 'Very Difficult', hi: 'अत्यंत कठिन', gu: 'ખૂબ અઘરું' },
  5: { en: 'Expert Challenge', hi: 'विशेषज्ञ चुनौती', gu: 'નિષ્ણાત પડકાર' },
};

export const QUESTION_TYPE_LABELS: Record<string, string> = {
  single_mcq: 'Single Correct MCQ',
  multiple_statement: 'Multiple Statement',
  assertion_reason: 'Assertion & Reason',
  match_following: 'Match the Following',
  chronological: 'Chronological Order',
  map_based: 'Map-Based Question',
  analytical: 'Analytical Question',
  interdisciplinary: 'Interdisciplinary',
};

export const OPTIONAL_SUBJECTS = [
  'Political Science & International Relations (PSIR)',
  'Sociology',
  'Geography',
  'History',
  'Public Administration',
  'Anthropology',
  'Economics',
  'Hindi Literature',
  'Gujarati Literature',
  'Philosophy',
  'Law',
  'Mathematics',
];

export const SEED_SUBJECTS: SeedSubject[] = [
  { slug: 'polity', nameEn: 'Indian Polity', nameHi: 'भारतीय राजव्यवस्था', nameGu: 'ભારતીય રાજ્યવ્યવસ્થા', stage: 'both', sortOrder: 1 },
  { slug: 'history', nameEn: 'History', nameHi: 'इतिहास', nameGu: 'ઇતિહાસ', stage: 'both', sortOrder: 2 },
  { slug: 'geography', nameEn: 'Geography', nameHi: 'भूगोल', nameGu: 'ભૂગોળ', stage: 'both', sortOrder: 3 },
  { slug: 'economy', nameEn: 'Economy', nameHi: 'अर्थव्यवस्था', nameGu: 'અર્થતંત્ર', stage: 'both', sortOrder: 4 },
  { slug: 'environment', nameEn: 'Environment', nameHi: 'पर्यावरण एवं पारिस्थितिकी', nameGu: 'પર્યાવરણ', stage: 'both', sortOrder: 5 },
  { slug: 'science_tech', nameEn: 'Science and Technology', nameHi: 'विज्ञान एवं प्रौद्योगिकी', nameGu: 'વિજ્ઞાન અને ટેકનોલોજી', stage: 'both', sortOrder: 6 },
  { slug: 'current_affairs', nameEn: 'Current Affairs', nameHi: 'समसामयिकी', nameGu: 'વર્તમાન પ્રવાહો', stage: 'both', sortOrder: 7 },
  { slug: 'ir', nameEn: 'International Relations', nameHi: 'अंतरराष्ट्रीय संबंध', nameGu: 'આંતરરાષ્ટ્રીય સંબંધો', stage: 'both', sortOrder: 8 },
  { slug: 'art_culture', nameEn: 'Art and Culture', nameHi: 'कला एवं संस्कृति', nameGu: 'કલા અને સંસ્કૃતિ', stage: 'both', sortOrder: 9 },
  { slug: 'ethics', nameEn: 'Ethics (GS IV)', nameHi: 'नीतिशास्त्र (GS IV)', nameGu: 'નીતિશાસ્ત્ર (GS IV)', stage: 'mains', sortOrder: 10 },
  { slug: 'csat', nameEn: 'CSAT Aptitude & Comprehension', nameHi: 'CSAT अभिरुचि एवं बोधगम्यता', nameGu: 'CSAT અભિયોગ્યતા', stage: 'prelims', sortOrder: 11 },
];

export const DEFAULT_EXAM_RULES = [
  {
    versionName: 'UPSC CSE 2026 Standard — Prelims GS Paper I',
    examYear: 2026,
    paperCode: 'GS_I',
    durationMinutes: 120,
    questionCount: 100,
    marksPerQuestion: 2.0,
    negativeMarkingRatio: 1 / 3,
    qualifyingPercent: null as number | null,
  },
  {
    versionName: 'UPSC CSE 2026 Standard — Prelims CSAT Paper II',
    examYear: 2026,
    paperCode: 'CSAT_II',
    durationMinutes: 120,
    questionCount: 80,
    marksPerQuestion: 2.5,
    negativeMarkingRatio: 1 / 3,
    qualifyingPercent: 33,
  },
];

export const SEED_QUESTIONS: SeedQuestion[] = [
  {
    externalCode: 'UPSC-POL-001',
    subjectSlug: 'polity',
    topicName: 'Constitutional Remedies & Writ Jurisdiction',
    difficulty: 3,
    questionType: 'multiple_statement',
    paperCode: 'GS_I',
    isPyq: true,
    pyqYear: 2022,
    marks: 2,
    negativeMarks: 0.67,
    sourceTitle: 'Constitution of India — Articles 32 & 226',
    citationText: 'UPSC CSE Prelims 2022 (Adapted for Practice Review) · Part III, Constitution of India',
    status: 'approved',
    correctOption: 'B',
    translations: {
      en: {
        isOfficialTranslation: true,
        questionText:
          'Consider the following statements regarding Writ Jurisdiction under the Constitution of India:\n1. The writ of Mandamus cannot be issued against a private individual unless entrusted with a public duty.\n2. The writ jurisdiction of a High Court under Article 226 is narrower than that of the Supreme Court under Article 32.\n3. Quo Warranto can be sought by any interested person and not necessarily the aggrieved person.\nWhich of the statements given above are correct?',
        explanation:
          'Statement 1 is correct: Mandamus generally lies against public authorities or private bodies performing public duties. Statement 2 is incorrect: Article 226 is wider than Article 32 because High Courts can issue writs for both Fundamental Rights and ordinary legal rights. Statement 3 is correct: Quo Warranto challenges unlawful usurpation of public office and has liberal locus standi.',
        options: [
          { key: 'A', text: '1 and 2 only' },
          { key: 'B', text: '1 and 3 only' },
          { key: 'C', text: '2 and 3 only' },
          { key: 'D', text: '1, 2 and 3' },
        ],
      },
      hi: {
        isOfficialTranslation: true,
        questionText:
          'भारत के संविधान के अंतर्गत रिट अधिकारिता के संबंध में निम्नलिखित कथनों पर विचार कीजिए:\n1. परमादेश (Mandamus) की रिट किसी निजी व्यक्ति के विरुद्ध तब तक जारी नहीं की जा सकती जब तक उसे कोई सार्वजनिक कर्तव्य न सौंपा गया हो।\n2. अनुच्छेद 226 के तहत उच्च न्यायालय की रिट अधिकारिता अनुच्छेद 32 के तहत सर्वोच्च न्यायालय से संकीर्ण है।\n3. अधिकार-पृच्छा (Quo Warranto) किसी भी इच्छुक व्यक्ति द्वारा माँगी जा सकती है, न कि केवल पीड़ित व्यक्ति द्वारा।\nउपर्युक्त में से कौन-से कथन सही हैं?',
        explanation:
          'कथन 1 सही है: परमादेश सार्वजनिक प्राधिकारियों के विरुद्ध जारी होता है। कथन 2 गलत है: अनुच्छेद 226 का दायरा अनुच्छेद 32 से व्यापक है क्योंकि उच्च न्यायालय मौलिक अधिकारों के साथ-साथ सामान्य विधिक अधिकारों के लिए भी रिट जारी कर सकते हैं। कथन 3 सही है।',
        options: [
          { key: 'A', text: 'केवल 1 और 2' },
          { key: 'B', text: 'केवल 1 और 3' },
          { key: 'C', text: 'केवल 2 और 3' },
          { key: 'D', text: '1, 2 और 3' },
        ],
      },
      gu: {
        isOfficialTranslation: true,
        questionText:
          'ભારતના બંધારણ હેઠળ રિટ અધિકારક્ષેત્ર અંગે નીચેના વિધાનો પર વિચાર કરો:\n1. પરમાદેશ (Mandamus) ની રિટ કોઈ ખાનગી વ્યક્તિ સામે ત્યાં સુધી જારી કરી શકાય નહીં જ્યાં સુધી તેને જાહેર ફરજ સોંપવામાં ન આવી હોય.\n2. અનુચ્છેદ 226 હેઠળ હાઈકોર્ટનું રિટ અધિકારક્ષેત્ર અનુચ્છેદ 32 હેઠળ સુપ્રીમ કોર્ટ કરતાં સંકુચિત છે.\n3. અધિકાર-પૃચ્છા (Quo Warranto) કોઈપણ રસ ધરાવતી વ્યક્તિ દ્વારા માંગી શકાય છે.\nઉપરનામાંથી કયા વિધાનો સાચા છે?',
        explanation:
          'વિધાન 1 અને 3 સાચા છે. વિધાન 2 ખોટું છે કારણ કે અનુચ્છેદ 226 હેઠળ હાઈકોર્ટ મૂળભૂત અધિકારો ઉપરાંત સામાન્ય કાયદેસરના અધિકારો માટે પણ રિટ જારી કરી શકે છે.',
        options: [
          { key: 'A', text: 'માત્ર 1 અને 2' },
          { key: 'B', text: 'માત્ર 1 અને 3' },
          { key: 'C', text: 'માત્ર 2 અને 3' },
          { key: 'D', text: '1, 2 અને 3' },
        ],
      },
    },
  },
  {
    externalCode: 'UPSC-POL-002',
    subjectSlug: 'polity',
    topicName: 'Money Bill & Parliamentary Procedure',
    difficulty: 2,
    questionType: 'single_mcq',
    paperCode: 'GS_I',
    isPyq: true,
    pyqYear: 2023,
    marks: 2,
    negativeMarks: 0.67,
    sourceTitle: 'Constitution of India — Article 110',
    citationText: 'Constitution of India, Article 110 · Laxmikanth Indian Polity Reference',
    status: 'approved',
    correctOption: 'C',
    translations: {
      en: {
        isOfficialTranslation: true,
        questionText:
          'Under Article 110 of the Constitution of India, a Bill shall NOT be deemed to be a Money Bill solely by reason that it provides for:',
        explanation:
          'Article 110(2) explicitly states that a Bill shall not be deemed to be a Money Bill by reason only that it provides for the imposition of fines or other pecuniary penalties, or for demand/payment of fees for licences or services.',
        options: [
          { key: 'A', text: 'Imposition, abolition, remission, alteration or regulation of any tax' },
          { key: 'B', text: 'Appropriation of moneys out of the Consolidated Fund of India' },
          { key: 'C', text: 'Imposition of fines or pecuniary penalties for regulatory offences' },
          { key: 'D', text: 'Custody of the Consolidated Fund or Contingency Fund of India' },
        ],
      },
      hi: {
        isOfficialTranslation: true,
        questionText:
          'भारत के संविधान के अनुच्छेद 110 के अंतर्गत, कोई विधेयक केवल इस कारण से धन विधेयक (Money Bill) नहीं माना जाएगा कि वह प्रावधान करता है:',
        explanation:
          'अनुच्छेद 110(2) के अनुसार, केवल जुर्माने या आर्थिक दंड लगाने अथवा लाइसेंस शुल्क की मांग करने वाले प्रावधानों से कोई विधेयक धन विधेयक नहीं बन जाता।',
        options: [
          { key: 'A', text: 'किसी कर का अधिरोपण, उत्सादन, परिहार, परिवर्तन या विनियमन' },
          { key: 'B', text: 'भारत की संचित निधि से धन का विनियोग' },
          { key: 'C', text: 'विनियामक अपराधों के लिए जुर्माना या आर्थिक दंड लगाना' },
          { key: 'D', text: 'भारत की संचित निधि या आकस्मिकता निधि की अभिरक्षा' },
        ],
      },
      gu: {
        isOfficialTranslation: true,
        questionText:
          'ભારતના બંધારણના અનુચ્છેદ 110 હેઠળ, કોઈ ખરડો માત્ર એટલા માટે નાણાકીય ખરડો (Money Bill) ગણાશે નહીં કે તેમાં નીચેની જોગવાઈ છે:',
        explanation:
          'અનુચ્છેદ 110(2) સ્પષ્ટ કરે છે કે દંડ કે આર્થિક દંડ અથવા લાઇસન્સ ફીની જોગવાઈ માત્રથી ખરડો મની બિલ બનતો નથી.',
        options: [
          { key: 'A', text: 'કોઈપણ કર લાદવો, નાબૂદ કરવો કે તેમાં ફેરફાર કરવો' },
          { key: 'B', text: 'ભારતના સંચિત ફંડમાંથી નાણાંની ફાળવણી' },
          { key: 'C', text: 'નિયમનકારી ગુનાઓ માટે દંડ અથવા આર્થિક દંડ લાદવો' },
          { key: 'D', text: 'સંચિત નિધિ અથવા આકસ્મિક નિધિની જાળવણી' },
        ],
      },
    },
  },
  {
    externalCode: 'UPSC-HIS-003',
    subjectSlug: 'history',
    topicName: 'Modern Indian Freedom Struggle',
    difficulty: 3,
    questionType: 'chronological',
    paperCode: 'GS_I',
    isPyq: false,
    pyqYear: null,
    marks: 2,
    negativeMarks: 0.67,
    sourceTitle: 'Spectrum / Bipan Chandra — Modern India',
    citationText: 'NCERT Class XII Themes in Indian History Part III · Demo Practice Item',
    status: 'approved',
    correctOption: 'A',
    translations: {
      en: {
        isOfficialTranslation: true,
        questionText:
          'Arrange the following events of the Indian National Movement in correct chronological order from earliest to latest:\n1. Gandhi-Irwin Pact\n2. Poona Pact\n3. Karachi Session of Indian National Congress\n4. Communal Award announcement by Ramsay MacDonald',
        explanation:
          'Chronology: Gandhi-Irwin Pact (March 5, 1931) -> Karachi Congress Session (March 29, 1931) -> Communal Award (August 16, 1932) -> Poona Pact (September 24, 1932). Hence 1 - 3 - 4 - 2.',
        options: [
          { key: 'A', text: '1 - 3 - 4 - 2' },
          { key: 'B', text: '1 - 4 - 3 - 2' },
          { key: 'C', text: '3 - 1 - 4 - 2' },
          { key: 'D', text: '1 - 3 - 2 - 4' },
        ],
      },
      hi: {
        isOfficialTranslation: true,
        questionText:
          'भारतीय राष्ट्रीय आंदोलन की निम्नलिखित घटनाओं को प्रारंभ से अंत तक सही कालानुक्रम में व्यवस्थित कीजिए:\n1. गांधी-इरविन समझौता\n2. पूना समझौता\n3. भारतीय राष्ट्रीय कांग्रेस का कराची अधिवेशन\n4. रैमजे मैकडोनाल्ड द्वारा सांप्रदायिक पंचाट (Communal Award) की घोषणा',
        explanation:
          'गांधी-इरविन समझौता (5 मार्च 1931) -> कराची अधिवेशन (मार्च 1931 के अंत में) -> सांप्रदायिक पंचाट (अगस्त 1932) -> पूना समझौता (सितंबर 1932)।',
        options: [
          { key: 'A', text: '1 - 3 - 4 - 2' },
          { key: 'B', text: '1 - 4 - 3 - 2' },
          { key: 'C', text: '3 - 1 - 4 - 2' },
          { key: 'D', text: '1 - 3 - 2 - 4' },
        ],
      },
      gu: {
        isOfficialTranslation: true,
        questionText:
          'ભારતીય રાષ્ટ્રીય ચળવળની નીચેની ઘટનાઓને પ્રારંભથી અંત સુધીના સાચા કાલક્રમમાં ગોઠવો:\n1. ગાંધી-ઇરવિન કરાર\n2. પૂના કરાર\n3. ભારતીય રાષ્ટ્રીય કોંગ્રેસનું કરાચી અધિવેશન\n4. રામસે મેકડોનાલ્ડ દ્વારા કોમ્યુનલ એવોર્ડની જાહેરાત',
        explanation:
          'ગાંધી-ઇરવિન કરાર (માર્ચ 1931) -> કરાચી અધિવેશન (માર્ચ 1931) -> કોમ્યુનલ એવોર્ડ (ઓગસ્ટ 1932) -> પૂના કરાર (સપ્ટેમ્બર 1932).',
        options: [
          { key: 'A', text: '1 - 3 - 4 - 2' },
          { key: 'B', text: '1 - 4 - 3 - 2' },
          { key: 'C', text: '3 - 1 - 4 - 2' },
          { key: 'D', text: '1 - 3 - 2 - 4' },
        ],
      },
    },
  },
  {
    externalCode: 'UPSC-ART-004',
    subjectSlug: 'art_culture',
    topicName: 'Ancient Indian Epigraphy & Architecture',
    difficulty: 4,
    questionType: 'match_following',
    paperCode: 'GS_I',
    isPyq: true,
    pyqYear: 2021,
    marks: 2,
    negativeMarks: 0.67,
    sourceTitle: 'ASI Heritage Records & NCERT Fine Arts',
    citationText: 'NCERT An Introduction to Indian Art · Archaeological Survey of India',
    status: 'approved',
    correctOption: 'B',
    translations: {
      en: {
        isOfficialTranslation: true,
        questionText:
          'Consider the following pairs of historical sites and their celebrated archaeological features:\n1. Dholavira : Unique water harvesting & multi-tier urban citadel\n2. Lothal : Tidal dockyard connected to Sabarmati river system\n3. Rani ki Vav : Rock-cut Buddhist Chaitya hall\n4. Sanchi : Ashokan Stupa with Torana gateways\nHow many of the above pairs are correctly matched?',
        explanation:
          'Pair 1 (Dholavira, Kutch) is correct. Pair 2 (Lothal, Gujarat) is correct. Pair 3 is incorrect: Rani ki Vav (Patan, Gujarat) is a Solanki-era subterranean Maru-Gurjara stepwell, not a Buddhist Chaitya. Pair 4 (Sanchi) is correct. Thus 3 pairs are correct.',
        options: [
          { key: 'A', text: 'Only two pairs' },
          { key: 'B', text: 'Only three pairs' },
          { key: 'C', text: 'All four pairs' },
          { key: 'D', text: 'Only one pair' },
        ],
      },
      hi: {
        isOfficialTranslation: true,
        questionText:
          'ऐतिहासिक स्थलों और उनकी प्रमुख पुरातात्विक विशेषताओं के निम्नलिखित युग्मों पर विचार कीजिए:\n1. धोलावीरा : अद्वितीय जल संचयन एवं त्रि-स्तरीय नगरीय संरचना\n2. लोथल : साबरमती नदी प्रणाली से जुड़ा ज्वारीय गोदीबाड़ा (Dockyard)\n3. रानी की वाव : शैलकृत बौद्ध चैत्य गृह\n4. साँची : तोरण द्वारों सहित अशोककालीन स्तूप\nउपर्युक्त में से कितने युग्म सही सुमेलित हैं?',
        explanation:
          'धोलावीरा, लोथल और साँची सही सुमेलित हैं। रानी की वाव (पाटण, गुजरात) सोलंकी काल की मारु-गुर्जर शैली की भूमिगत बावड़ी है, न कि बौद्ध चैत्य। अतः तीन युग्म सही हैं।',
        options: [
          { key: 'A', text: 'केवल दो युग्म' },
          { key: 'B', text: 'केवल तीन युग्म' },
          { key: 'C', text: 'सभी चार युग्म' },
          { key: 'D', text: 'केवल एक युग्म' },
        ],
      },
      gu: {
        isOfficialTranslation: true,
        questionText:
          'ઐતિહાસિક સ્થળો અને તેમની પુરાતત્વીય વિશેષતાઓની નીચેની જોડીઓ પર વિચાર કરો:\n1. ધોળાવીરા : અનોખું જળ સંચય અને ત્રિ-સ્તરીય નગર રચના\n2. લોથલ : સાબરમતી નદી પ્રણાલી સાથે જોડાયેલ ભરતીનું ગોદીવાડું (Dockyard)\n3. રાણીની વાવ : પથ્થરમાં કોતરેલ બૌદ્ધ ચૈત્ય હોલ\n4. સાંચી : તોરણ દ્વાર સાથેનો અશોકકાલીન સ્તૂપ\nઉપરનામાંથી કેટલી જોડીઓ સાચી રીતે જોડાયેલી છે?',
        explanation:
          'ધોળાવીરા, લોથલ અને સાંચી સાચા છે. પાટણ સ્થિત રાણીની વાવ સોલંકી કાળની મારુ-ગુર્જર શૈલીની વાવ છે, બૌદ્ધ ચૈત્ય નથી. તેથી માત્ર ત્રણ જોડીઓ સાચી છે.',
        options: [
          { key: 'A', text: 'માત્ર બે જોડી' },
          { key: 'B', text: 'માત્ર ત્રણ જોડી' },
          { key: 'C', text: 'બધી ચાર જોડી' },
          { key: 'D', text: 'માત્ર એક જોડી' },
        ],
      },
    },
  },
  {
    externalCode: 'UPSC-GEO-005',
    subjectSlug: 'geography',
    topicName: 'Indian Drainage & River Basins',
    difficulty: 3,
    questionType: 'map_based',
    paperCode: 'GS_I',
    isPyq: false,
    pyqYear: null,
    marks: 2,
    negativeMarks: 0.67,
    sourceTitle: 'NCERT Class XI India Physical Environment',
    citationText: 'NCERT Indian Physical Environment · Central Water Commission Atlas',
    status: 'approved',
    correctOption: 'D',
    translations: {
      en: {
        isOfficialTranslation: true,
        questionText:
          'If you travel by road along a straight east-to-west transect from Dibrugarh to Surat during the post-monsoon season, which sequence of major rivers will you cross in order?',
        explanation:
          'Moving from east (Assam) to west (Gujarat): Brahmaputra (Dibrugarh/Assam) -> Ganga (Eastern/Central Plains) -> Chambal/Betwa (Central India) -> Narmada / Tapi (Surat sits on the Tapi estuary). Option D gives the accurate East-to-West progression.',
        options: [
          { key: 'A', text: 'Brahmaputra — Mahanadi — Godavari — Tapi' },
          { key: 'B', text: 'Teesta — Subarnarekha — Cauvery — Narmada' },
          { key: 'C', text: 'Barak — Krishna — Chambal — Mahi' },
          { key: 'D', text: 'Brahmaputra — Ganga — Chambal — Tapi' },
        ],
      },
      hi: {
        isOfficialTranslation: true,
        questionText:
          'यदि आप मानसून के बाद के मौसम में डिब्रूगढ़ से सूरत तक पूर्व से पश्चिम की सीधी दिशा में यात्रा करते हैं, तो आप किन प्रमुख नदियों को क्रमशः पार करेंगे?',
        explanation:
          'पूर्व (असम) से पश्चिम (गुजरात) जाने पर क्रमशः ब्रह्मपुत्र, गंगा, चंबल और तापी (सूरत तापी नदी के मुहाने पर स्थित है) नदियाँ आएँगी।',
        options: [
          { key: 'A', text: 'ब्रह्मपुत्र — महानदी — गोदावरी — तापी' },
          { key: 'B', text: 'तीस्ता — सुवर्णरेखा — कावेरी — नर्मदा' },
          { key: 'C', text: 'बराक — कृष्णा — चंबल — माही' },
          { key: 'D', text: 'ब्रह्मपुत्र — गंगा — चंबल — तापी' },
        ],
      },
      gu: {
        isOfficialTranslation: true,
        questionText:
          'જો તમે ચોમાસા પછીના સમયમાં ડિબ્રુગઢથી સુરત સુધી પૂર્વથી પશ્ચિમ દિશામાં સીધી મુસાફરી કરો, તો તમે કઈ મુખ્ય નદીઓને ક્રમશઃ પાર કરશો?',
        explanation:
          'પૂર્વ (આસામ) થી પશ્ચિમ (ગુજરાત) તરફ જતાં ક્રમશઃ બ્રહ્મપુત્રા, ગંગા, ચંબલ અને તાપી (સુરત તાપી નદીના કિનારે આવેલું છે) નદીઓ આવે છે.',
        options: [
          { key: 'A', text: 'બ્રહ્મપુત્રા — મહાનદી — ગોદાવરી — તાપી' },
          { key: 'B', text: 'તીસ્તા — સુવર્ણરેખા — કાવેરી — નર્મદા' },
          { key: 'C', text: 'બરાક — કૃષ્ણા — ચંબલ — મહી' },
          { key: 'D', text: 'બ્રહ્મપુત્રા — ગંગા — ચંબલ — તાપી' },
        ],
      },
    },
  },
  {
    externalCode: 'UPSC-ECO-006',
    subjectSlug: 'economy',
    topicName: 'Monetary Policy & RBI Instruments',
    difficulty: 3,
    questionType: 'assertion_reason',
    paperCode: 'GS_I',
    isPyq: true,
    pyqYear: 2020,
    marks: 2,
    negativeMarks: 0.67,
    sourceTitle: 'Reserve Bank of India — Monetary Policy Framework',
    citationText: 'RBI Handbook of Indian Economy · Economic Survey Reference',
    status: 'approved',
    correctOption: 'A',
    translations: {
      en: {
        isOfficialTranslation: true,
        questionText:
          'Consider the following two statements:\nAssertion (A): During periods of persistent demand-pull inflation, the Monetary Policy Committee may raise the Repo Rate and conduct Open Market Operations (OMO) sales of Government Securities.\nReason (R): Raising the Repo Rate increases the cost of short-term borrowing for commercial banks, while OMO sales absorb excess rupee liquidity from the banking system.\nWhich of the following is correct?',
        explanation:
          'Both A and R are true, and R directly explains the transmission mechanism by which Repo hikes and OMO sales tighten monetary conditions to curb demand-pull inflation.',
        options: [
          { key: 'A', text: 'Both A and R are individually true, and R is the correct explanation of A' },
          { key: 'B', text: 'Both A and R are individually true, but R is not the correct explanation of A' },
          { key: 'C', text: 'A is true, but R is false' },
          { key: 'D', text: 'A is false, but R is true' },
        ],
      },
      hi: {
        isOfficialTranslation: true,
        questionText:
          'निम्नलिखित दो कथनों पर विचार कीजिए:\nकथन (A): निरंतर मांग-जनित मुद्रास्फीति के समय मौद्रिक नीति समिति (MPC) रेपो दर बढ़ा सकती है और सरकारी प्रतिभूतियों की खुले बाजार की बिक्री (OMO) कर सकती है।\nकारण (R): रेपो दर बढ़ाने से वाणिज्यिक बैंकों के लिए अल्पकालिक उधार लागत बढ़ती है, जबकि OMO बिक्री बैंकिंग प्रणाली से अतिरिक्त तरलता को अवशोषित करती है।\nसही उत्तर चुनिए:',
        explanation:
          'A और R दोनों सत्य हैं तथा R, A की सही व्याख्या करता है।',
        options: [
          { key: 'A', text: 'A और R दोनों सही हैं और R, A का सही स्पष्टीकरण है' },
          { key: 'B', text: 'A और R दोनों सही हैं, किंतु R, A का सही स्पष्टीकरण नहीं है' },
          { key: 'C', text: 'A सही है, किंतु R गलत है' },
          { key: 'D', text: 'A गलत है, किंतु R सही है' },
        ],
      },
      gu: {
        isOfficialTranslation: true,
        questionText:
          'નીચેના બે વિધાનો પર વિચાર કરો:\nવિધાન (A): સતત માંગ-પ્રેરિત ફુગાવાના સમયે મોનેટરી પોલિસી કમિટી રેપો રેટ વધારી શકે છે અને સરકારી જામીનગીરીઓનું ઓપન માર્કેટ વેચાણ (OMO) કરી શકે છે.\nકારણ (R): રેપો રેટ વધારવાથી બેંકો માટે ટૂંકા ગાળાનું ધિરાણ મોંઘું બને છે અને OMO વેચાણ બેંકિંગ પ્રણાલીમાંથી વધારાની તરલતા શોષી લે છે.\nસાચો વિકલ્પ પસંદ કરો:',
        explanation:
          'A અને R બંને સાચા છે અને R એ A ની સાચી સમજૂતી છે.',
        options: [
          { key: 'A', text: 'A અને R બંને સાચા છે અને R એ A ની સાચી સમજૂતી છે' },
          { key: 'B', text: 'A અને R બંને સાચા છે પરંતુ R એ A ની સાચી સમજૂતી નથી' },
          { key: 'C', text: 'A સાચું છે પરંતુ R ખોટું છે' },
          { key: 'D', text: 'A ખોટું છે પરંતુ R સાચું છે' },
        ],
      },
    },
  },
  {
    externalCode: 'UPSC-ENV-007',
    subjectSlug: 'environment',
    topicName: 'Biodiversity Conservation & Protected Areas',
    difficulty: 4,
    questionType: 'interdisciplinary',
    paperCode: 'GS_I',
    isPyq: true,
    pyqYear: 2023,
    marks: 2,
    negativeMarks: 0.67,
    sourceTitle: 'Wildlife Protection Act 1972 & Ramsar Convention',
    citationText: 'MoEFCC Annual Report · National Tiger Conservation Authority',
    status: 'approved',
    correctOption: 'C',
    translations: {
      en: {
        isOfficialTranslation: true,
        questionText:
          'With reference to India’s wetland and wildlife conservation framework, consider the following statements:\n1. Community Reserves are declared on private or community land under the Wildlife (Protection) Act, 1972.\n2. Every Ramsar Site in India is automatically notified as a National Park.\n3. The Wildlife (Protection) Amendment Act, 2022 rationalized schedules to align with CITES implementation.\nWhich of the statements given above are correct?',
        explanation:
          'Statement 1 is correct (Section 36C of WPA 1972). Statement 2 is incorrect: Ramsar Sites are regulated under the Wetlands (Conservation and Management) Rules, 2017 and are not automatically National Parks. Statement 3 is correct: WPA Amendment 2022 reduced schedules from 6 to 4 and added a dedicated CITES schedule.',
        options: [
          { key: 'A', text: '1 and 2 only' },
          { key: 'B', text: '2 and 3 only' },
          { key: 'C', text: '1 and 3 only' },
          { key: 'D', text: '1, 2 and 3' },
        ],
      },
      hi: {
        isOfficialTranslation: true,
        questionText:
          'भारत के आर्द्रभूमि और वन्यजीव संरक्षण ढाँचे के संदर्भ में निम्नलिखित कथनों पर विचार कीजिए:\n1. वन्यजीव (संरक्षण) अधिनियम, 1972 के अंतर्गत निजी या सामुदायिक भूमि पर सामुदायिक आरक्षिति (Community Reserves) घोषित किए जाते हैं।\n2. भारत में प्रत्येक रामसर स्थल स्वतः ही राष्ट्रीय उद्यान के रूप में अधिसूचित होता है।\n3. वन्यजीव (संरक्षण) संशोधन अधिनियम, 2022 ने CITES के कार्यान्वयन हेतु अनुसूचियों को तर्कसंगत बनाया।\nउपर्युक्त में से कौन-से कथन सही हैं?',
        explanation:
          'कथन 1 और 3 सही हैं। कथन 2 गलत है क्योंकि रामसर स्थल स्वतः राष्ट्रीय उद्यान नहीं बनते; वे आर्द्रभूमि (संरक्षण एवं प्रबंधन) नियम, 2017 के अंतर्गत आते हैं।',
        options: [
          { key: 'A', text: 'केवल 1 और 2' },
          { key: 'B', text: 'केवल 2 और 3' },
          { key: 'C', text: 'केवल 1 और 3' },
          { key: 'D', text: '1, 2 और 3' },
        ],
      },
      gu: {
        isOfficialTranslation: true,
        questionText:
          'ભારતના વેટલેન્ડ અને વન્યજીવ સંરક્ષણ માળખાના સંદર્ભમાં નીચેના વિધાનો પર વિચાર કરો:\n1. વન્યજીવ (સંરક્ષણ) અધિનિયમ, 1972 હેઠળ ખાનગી અથવા સામુદાયિક જમીન પર કોમ્યુનિટી રિઝર્વ જાહેર કરવામાં આવે છે.\n2. ભારતમાં દરેક રામસર સાઇટ આપોઆપ રાષ્ટ્રીય ઉદ્યાન તરીકે જાહેર થાય છે.\n3. વન્યજીવ (સંરક્ષણ) સુધારા અધિનિયમ, 2022 એ CITES ના અમલીકરણ માટે અનુસૂચિઓને તર્કસંગત બનાવી.\nઉપરનામાંથી કયા વિધાનો સાચા છે?',
        explanation:
          'વિધાન 1 અને 3 સાચા છે. વિધાન 2 ખોટું છે કારણ કે રામસર સાઇટ્સ આપમેળે નેશનલ પાર્ક બનતી નથી.',
        options: [
          { key: 'A', text: 'માત્ર 1 અને 2' },
          { key: 'B', text: 'માત્ર 2 અને 3' },
          { key: 'C', text: 'માત્ર 1 અને 3' },
          { key: 'D', text: '1, 2 અને 3' },
        ],
      },
    },
  },
  {
    externalCode: 'UPSC-SCI-008',
    subjectSlug: 'science_tech',
    topicName: 'Space Technology & Quantum Communication',
    difficulty: 3,
    questionType: 'analytical',
    paperCode: 'GS_I',
    isPyq: false,
    pyqYear: null,
    marks: 2,
    negativeMarks: 0.67,
    sourceTitle: 'ISRO / Department of Space Technical Briefs',
    citationText: 'PIB Science & Technology Releases · National Quantum Mission Brief',
    status: 'approved',
    correctOption: 'B',
    translations: {
      en: {
        isOfficialTranslation: true,
        questionText:
          'Why is the Sun-Earth Lagrange Point L1 chosen as the halo orbit station for India’s Aditya-L1 solar observatory rather than a Low Earth Orbit (LEO)?',
        explanation:
          'At L1 (~1.5 million km from Earth towards the Sun), the gravitational pull of the Sun and Earth balances the centripetal force required for a spacecraft to orbit with the same angular period as Earth, enabling continuous, uninterrupted solar observation without eclipses/occultations.',
        options: [
          { key: 'A', text: 'It completely shields the spacecraft from all solar coronal mass ejections' },
          { key: 'B', text: 'It allows uninterrupted continuous observation of the Sun free from Earth occultation' },
          { key: 'C', text: 'It eliminates the need for onboard thrusters for station-keeping' },
          { key: 'D', text: 'It lies inside Earth’s lower Van Allen radiation belt for faster telemetry' },
        ],
      },
      hi: {
        isOfficialTranslation: true,
        questionText:
          'भारत की आदित्य-L1 सौर वेधशाला के लिए निम्न पृथ्वी कक्षा (LEO) के बजाय सूर्य-पृथ्वी लैग्रेंज बिंदु L1 को हेलो कक्षा के रूप में क्यों चुना गया?',
        explanation:
          'L1 बिंदु (पृथ्वी से लगभग 15 लाख किमी दूर) पर सूर्य और पृथ्वी का गुरुत्वाकर्षण संतुलन उपग्रह को पृथ्वी के साथ समकालिक रखता है, जिससे बिना किसी ग्रहण या अवरोध के सूर्य का निरंतर अवलोकन संभव होता है।',
        options: [
          { key: 'A', text: 'यह अंतरिक्ष यान को सभी सौर कोरोनल मास इजेक्शन से पूरी तरह सुरक्षित रखता है' },
          { key: 'B', text: 'यह पृथ्वी की छाया या अवरोध के बिना सूर्य का निरंतर अवलोकन संभव बनाता है' },
          { key: 'C', text: 'इससे कक्षा बनाए रखने के लिए थ्रस्टर्स की आवश्यकता समाप्त हो जाती है' },
          { key: 'D', text: 'यह तीव्र टेलीमेट्री के लिए निचली वैन एलेन विकिरण बेल्ट के भीतर स्थित है' },
        ],
      },
      gu: {
        isOfficialTranslation: true,
        questionText:
          'ભારતની આદિત્ય-L1 સૌર વેધશાળા માટે લો અર્થ ઓર્બિટ (LEO) ને બદલે સૂર્ય-પૃથ્વી લાગ્રાંજ પોઈન્ટ L1 ની પસંદગી કેમ કરવામાં આવી?',
        explanation:
          'L1 બિંદુ પર પૃથ્વીના ગ્રહણ કે અવરોધ વિના સૂર્યનું સતત અવલોકન કરી શકાય છે.',
        options: [
          { key: 'A', text: 'તે અવકાશયાનને તમામ સૌર વિકિરણોથી સંપૂર્ણ સુરક્ષિત રાખે છે' },
          { key: 'B', text: 'તે પૃથ્વીના અવરોધ વિના સૂર્યનું અવિરત નિરંતર અવલોકન કરવા દે છે' },
          { key: 'C', text: 'તેનાથી ઓનબોર્ડ થ્રસ્ટર્સની જરૂરિયાત સંપૂર્ણ નાબૂદ થાય છે' },
          { key: 'D', text: 'તે ઝડપી ટેલિમેટ્રી માટે નીચલા વેન એલન બેલ્ટની અંદર આવેલું છે' },
        ],
      },
    },
  },
  {
    externalCode: 'UPSC-IR-009',
    subjectSlug: 'ir',
    topicName: 'Multilateral Groupings & Connectivity',
    difficulty: 2,
    questionType: 'single_mcq',
    paperCode: 'GS_I',
    isPyq: false,
    pyqYear: null,
    marks: 2,
    negativeMarks: 0.67,
    sourceTitle: 'Ministry of External Affairs Annual Brief',
    citationText: 'MEA India Official Statements · Demo Practice Item',
    status: 'approved',
    correctOption: 'D',
    translations: {
      en: {
        isOfficialTranslation: true,
        questionText:
          'Which of the following countries is NOT a founding or current member of the Indian Ocean Rim Association (IORA)?',
        explanation:
          'India, Australia, South Africa, Indonesia, Kenya, UAE, and 17 other Indian Ocean littoral states are members of IORA. Landlocked Nepal does not border the Indian Ocean and is not an IORA member.',
        options: [
          { key: 'A', text: 'Australia' },
          { key: 'B', text: 'South Africa' },
          { key: 'C', text: 'Indonesia' },
          { key: 'D', text: 'Nepal' },
        ],
      },
      hi: {
        isOfficialTranslation: true,
        questionText:
          'निम्नलिखित में से कौन-सा देश हिंद महासागर रिम एसोसिएशन (IORA) का सदस्य नहीं है?',
        explanation:
          'ऑस्ट्रेलिया, दक्षिण अफ्रीका और इंडोनेशिया हिंद महासागर तटीय देश होने के कारण IORA के सदस्य हैं, जबकि स्थल-रुद्ध नेपाल इसका सदस्य नहीं है।',
        options: [
          { key: 'A', text: 'ऑस्ट्रेलिया' },
          { key: 'B', text: 'दक्षिण अफ्रीका' },
          { key: 'C', text: 'इंडोनेशिया' },
          { key: 'D', text: 'नेपाल' },
        ],
      },
      gu: {
        isOfficialTranslation: true,
        questionText:
          'નીચેનામાંથી કયો દેશ ઇન્ડિયન ઓશન રિમ એસોસિએશન (IORA) નો સભ્ય નથી?',
        explanation:
          'ભારત, ઓસ્ટ્રેલિયા, દક્ષિણ આફ્રિકા અને ઇન્ડોનેશિયા IORA ના સભ્યો છે, જ્યારે ભૂ-આવૃત નેપાળ સભ્ય નથી.',
        options: [
          { key: 'A', text: 'ઓસ્ટ્રેલિયા' },
          { key: 'B', text: 'દક્ષિણ આફ્રિકા' },
          { key: 'C', text: 'ઇન્ડોનેશિયા' },
          { key: 'D', text: 'નેપાળ' },
        ],
      },
    },
  },
  {
    externalCode: 'UPSC-CA-010',
    subjectSlug: 'current_affairs',
    topicName: 'Digital Public Infrastructure & Fiscal Governance',
    difficulty: 3,
    questionType: 'multiple_statement',
    paperCode: 'GS_I',
    isPyq: false,
    pyqYear: null,
    marks: 2,
    negativeMarks: 0.67,
    sourceTitle: 'Economic Survey & Finance Commission Terms',
    citationText: 'Sixteenth Finance Commission Notification · Ministry of Finance',
    status: 'approved',
    correctOption: 'A',
    translations: {
      en: {
        isOfficialTranslation: true,
        questionText:
          'With reference to the Finance Commission of India under Article 280, consider the following statements:\n1. Its recommendations are advisory in nature and not legally binding on the Union Government.\n2. It recommends principles governing Grants-in-Aid of the revenues of the States out of the Consolidated Fund of India.\n3. The Sixteenth Finance Commission was constituted under the chairmanship of Dr. Arvind Panagariya.\nWhich of the statements given above are correct?',
        explanation:
          'All three statements are factually accurate. Under Article 280, the Finance Commission makes recommendations (advisory, though traditionally respected) on vertical/horizontal tax devolution and Grants-in-Aid, and Dr. Arvind Panagariya was appointed Chairman of the 16th Finance Commission.',
        options: [
          { key: 'A', text: '1, 2 and 3' },
          { key: 'B', text: '1 and 2 only' },
          { key: 'C', text: '2 and 3 only' },
          { key: 'D', text: '1 and 3 only' },
        ],
      },
      hi: {
        isOfficialTranslation: true,
        questionText:
          'अनुच्छेद 280 के तहत भारत के वित्त आयोग के संदर्भ में निम्नलिखित कथनों पर विचार कीजिए:\n1. इसकी सिफारिशें सलाहकारी प्रकृति की होती हैं और संघ सरकार पर विधिक रूप से बाध्यकारी नहीं हैं।\n2. यह भारत की संचित निधि से राज्यों के राजस्व के लिए सहायता अनुदान (Grants-in-Aid) के सिद्धांतों की सिफारिश करता है।\n3. सोलहवें वित्त आयोग का गठन डॉ. अरविंद पनगढ़िया की अध्यक्षता में किया गया।\nउपर्युक्त में से कौन-से कथन सही हैं?',
        explanation:
          'तीनों कथन सही हैं। अनुच्छेद 280 के अंतर्गत वित्त आयोग की अनुशंसाएँ सलाहकारी होती हैं और 16वें वित्त आयोग के अध्यक्ष डॉ. अरविंद पनगढ़िया हैं।',
        options: [
          { key: 'A', text: '1, 2 और 3' },
          { key: 'B', text: 'केवल 1 और 2' },
          { key: 'C', text: 'केवल 2 और 3' },
          { key: 'D', text: 'केवल 1 और 3' },
        ],
      },
      gu: {
        isOfficialTranslation: true,
        questionText:
          'અનુચ્છેદ 280 હેઠળ ભારતના નાણા પંચના સંદર્ભમાં નીચેના વિધાનો પર વિચાર કરો:\n1. તેની ભલામણો સલાહકારી સ્વરૂપની હોય છે અને કેન્દ્ર સરકાર પર કાયદેસર રીતે બંધનકર્તા નથી.\n2. તે ભારતના સંચિત ફંડમાંથી રાજ્યોને સહાયક અનુદાન (Grants-in-Aid) ના સિદ્ધાંતોની ભલામણ કરે છે.\n3. સોળમા નાણા પંચની રચના ડૉ. અરવિંદ પનાગરિયાની અધ્યક્ષતામાં કરવામાં આવી.\nઉપરનામાંથી કયા વિધાનો સાચા છે?',
        explanation:
          'ત્રણેય વિધાનો સાચા છે.',
        options: [
          { key: 'A', text: '1, 2 અને 3' },
          { key: 'B', text: 'માત્ર 1 અને 2' },
          { key: 'C', text: 'માત્ર 2 અને 3' },
          { key: 'D', text: 'માત્ર 1 અને 3' },
        ],
      },
    },
  },
  {
    externalCode: 'UPSC-CSAT-001',
    subjectSlug: 'csat',
    topicName: 'Reading Comprehension & Logical Inference',
    difficulty: 2,
    questionType: 'analytical',
    paperCode: 'CSAT_II',
    isPyq: true,
    pyqYear: 2023,
    marks: 2.5,
    negativeMarks: 0.83,
    sourceTitle: 'UPSC CSE CSAT Practice Passage',
    citationText: 'CSAT Paper II Analytical Comprehension Practice',
    status: 'approved',
    correctOption: 'C',
    translations: {
      en: {
        isOfficialTranslation: true,
        questionText:
          'Passage: "Sustainable urban water governance cannot rely solely on supply-side megaprojects such as long-distance canal transfers. Without reviving local aquifers, pricing industrial effluent fairly, and mandating greywater recycling in new layouts, cities merely defer water scarcity while raising fiscal debt."\nWhich of the following is the most logical and critical corollary to the passage?',
        explanation:
          'The passage explicitly links durable urban water security to demand-side and local ecological interventions alongside or instead of pure supply-side transfers.',
        options: [
          { key: 'A', text: 'Long-distance canal projects should be banned across all Indian states immediately' },
          { key: 'B', text: 'Industrial growth is incompatible with groundwater conservation' },
          { key: 'C', text: 'Urban water policy must integrate local aquifer recharge and demand-side efficiency' },
          { key: 'D', text: 'Municipalities should abolish water tariffs to encourage recycling' },
        ],
      },
      hi: {
        isOfficialTranslation: true,
        questionText:
          'गद्यांश: "टिकाऊ शहरी जल प्रशासन केवल लंबी दूरी की नहर परियोजनाओं जैसे आपूर्ति-पक्षीय बड़े प्रोजेक्ट्स पर निर्भर नहीं रह सकता। स्थानीय जलभृतों को पुनर्जीवित किए बिना, औद्योगिक अपशिष्ट का उचित मूल्य निर्धारण किए बिना और ग्रेवाटर पुनर्चक्रण के बिना शहर केवल जल संकट को टालते हैं।"\nउपर्युक्त गद्यांश का सबसे तार्किक निहितार्थ क्या है?',
        explanation:
          'गद्यांश स्थानीय जलभृत पुनर्भरण और मांग-पक्षीय दक्षता को शहरी जल नीति में शामिल करने की आवश्यकता दर्शाता है।',
        options: [
          { key: 'A', text: 'सभी राज्यों में लंबी दूरी की नहर परियोजनाओं पर तुरंत प्रतिबंध लगा देना चाहिए' },
          { key: 'B', text: 'औद्योगिक विकास भूजल संरक्षण के साथ असंगत है' },
          { key: 'C', text: 'शहरी जल नीति में स्थानीय जलभृत पुनर्भरण और मांग-पक्षीय दक्षता को एकीकृत करना चाहिए' },
          { key: 'D', text: 'नगर पालिकाओं को जल शुल्क समाप्त कर देना चाहिए' },
        ],
      },
      gu: {
        isOfficialTranslation: true,
        questionText:
          'ફકરો: "ટકાઉ શહેરી જળ વ્યવસ્થાપન માત્ર લાંબા અંતરની નહેર યોજનાઓ જેવા પુરવઠા-પક્ષના પ્રોજેક્ટ્સ પર નિર્ભર રહી શકે નહીં. સ્થાનિક જળભંડારને પુનર્જીવિત કર્યા વિના અને ગ્રેવોટર રિસાયક્લિંગ વિના શહેરો માત્ર જળ સંકટને મુલતવી રાખે છે."\nઆ ફકરાનો સૌથી તાર્કિક નિષ્કર્ષ શું છે?',
        explanation:
          'શહેરી જળ નીતિમાં સ્થાનિક જળસંચય અને માંગ-પક્ષની કાર્યક્ષમતાને એકીકૃત કરવી જરૂરી છે.',
        options: [
          { key: 'A', text: 'તમામ રાજ્યોમાં નહેર યોજનાઓ પર તાત્કાલિક પ્રતિબંધ મૂકવો જોઈએ' },
          { key: 'B', text: 'ઔદ્યોગિક વિકાસ ભૂગર્ભજળ સંરક્ષણ સાથે અસંગત છે' },
          { key: 'C', text: 'શહેરી જળ નીતિમાં સ્થાનિક જળસંચય અને માંગ-પક્ષની કાર્યક્ષમતાનો સમાવેશ થવો જોઈએ' },
          { key: 'D', text: 'નગરપાલિકાઓએ પાણીના દર નાબૂદ કરવા જોઈએ' },
        ],
      },
    },
  },
  {
    externalCode: 'UPSC-CSAT-002',
    subjectSlug: 'csat',
    topicName: 'Quantitative Reasoning & Number Theory',
    difficulty: 3,
    questionType: 'single_mcq',
    paperCode: 'CSAT_II',
    isPyq: false,
    pyqYear: null,
    marks: 2.5,
    negativeMarks: 0.83,
    sourceTitle: 'CSAT Quantitative Aptitude Series',
    citationText: 'CSAT Paper II Quantitative Practice Item',
    status: 'approved',
    correctOption: 'B',
    translations: {
      en: {
        isOfficialTranslation: true,
        questionText:
          'A candidate answers all 80 questions in a CSAT simulation. Each correct answer awards 2.5 marks and each wrong answer deducts one-third of 2.5 marks. If the candidate scores exactly 120 marks, how many questions did the candidate answer correctly?',
        explanation:
          'Let c = correct answers, so wrong = 80 - c. Score = 2.5c - (2.5/3)(80 - c) = 120. Multiply by 3: 7.5c - 2.5(80 - c) = 360 => 7.5c - 200 + 2.5c = 360 => 10c = 560 => c = 56.',
        options: [
          { key: 'A', text: '54' },
          { key: 'B', text: '56' },
          { key: 'C', text: '58' },
          { key: 'D', text: '60' },
        ],
      },
      hi: {
        isOfficialTranslation: true,
        questionText:
          'एक अभ्यर्थी CSAT अभ्यास में सभी 80 प्रश्नों के उत्तर देता है। प्रत्येक सही उत्तर पर 2.5 अंक मिलते हैं और प्रत्येक गलत उत्तर पर 2.5 अंक का एक-तिहाई काटा जाता है। यदि अभ्यर्थी को ठीक 120 अंक प्राप्त होते हैं, तो उसने कितने प्रश्न सही किए?',
        explanation:
          'माना सही प्रश्न = c, गलत = 80 - c। 2.5c - (2.5/3)(80 - c) = 120 => 10c = 560 => c = 56।',
        options: [
          { key: 'A', text: '54' },
          { key: 'B', text: '56' },
          { key: 'C', text: '58' },
          { key: 'D', text: '60' },
        ],
      },
      gu: {
        isOfficialTranslation: true,
        questionText:
          'એક ઉમેદવાર CSAT પ્રેક્ટિસમાં તમામ 80 પ્રશ્નોના જવાબ આપે છે. દરેક સાચા જવાબના 2.5 ગુણ મળે છે અને દરેક ખોટા જવાબના 2.5 ગુણનો ત્રીજો ભાગ કપાય છે. જો ઉમેદવારને બરાબર 120 ગુણ મળે, તો તેણે કેટલા પ્રશ્નો સાચા કર્યા હશે?',
        explanation:
          'સાચા = c, ખોટા = 80 - c. 2.5c - (2.5/3)(80 - c) = 120 => 10c = 560 => c = 56.',
        options: [
          { key: 'A', text: '54' },
          { key: 'B', text: '56' },
          { key: 'C', text: '58' },
          { key: 'D', text: '60' },
        ],
      },
    },
  },
  {
    externalCode: 'UPSC-CSAT-003',
    subjectSlug: 'csat',
    topicName: 'Data Sufficiency & Permutations',
    difficulty: 4,
    questionType: 'analytical',
    paperCode: 'CSAT_II',
    isPyq: false,
    pyqYear: null,
    marks: 2.5,
    negativeMarks: 0.83,
    sourceTitle: 'CSAT Reasoning Module',
    citationText: 'CSAT Paper II Practice Item',
    status: 'approved',
    correctOption: 'D',
    translations: {
      en: {
        isOfficialTranslation: true,
        questionText:
          'A committee of 4 officers is to be formed from 5 IAS officers and 4 IPS officers such that at least 2 IAS officers and at least 1 IPS officer are included. In how many distinct ways can this committee be formed?',
        explanation:
          'Valid compositions (IAS, IPS): (2, 2) or (3, 1).\nCase (2, 2): C(5,2) * C(4,2) = 10 * 6 = 60.\nCase (3, 1): C(5,3) * C(4,1) = 10 * 4 = 40.\nTotal = 60 + 40 = 100 ways.',
        options: [
          { key: 'A', text: '70' },
          { key: 'B', text: '85' },
          { key: 'C', text: '90' },
          { key: 'D', text: '100' },
        ],
      },
      hi: {
        isOfficialTranslation: true,
        questionText:
          '5 IAS और 4 IPS अधिकारियों में से 4 अधिकारियों की एक समिति इस प्रकार बनानी है कि उसमें कम से कम 2 IAS और कम से कम 1 IPS अधिकारी अवश्य हों। यह समिति कितने भिन्न तरीकों से बनाई जा सकती है?',
        explanation:
          'संभावित संयोजन: (2 IAS, 2 IPS) = C(5,2)×C(4,2) = 60 तथा (3 IAS, 1 IPS) = C(5,3)×C(4,1) = 40। कुल = 100 तरीके।',
        options: [
          { key: 'A', text: '70' },
          { key: 'B', text: '85' },
          { key: 'C', text: '90' },
          { key: 'D', text: '100' },
        ],
      },
      gu: {
        isOfficialTranslation: true,
        questionText:
          '5 IAS અને 4 IPS અધિકારીઓમાંથી 4 અધિકારીઓની એક સમિતિ એવી રીતે બનાવવાની છે કે જેમાં ઓછામાં ઓછા 2 IAS અને ઓછામાં ઓછા 1 IPS અધિકારી હોય. આ સમિતિ કેટલી અલગ-અલગ રીતે બનાવી શકાય?',
        explanation:
          '(2 IAS, 2 IPS) = C(5,2)×C(4,2) = 60 અને (3 IAS, 1 IPS) = C(5,3)×C(4,1) = 40. કુલ = 100 રીતે.',
        options: [
          { key: 'A', text: '70' },
          { key: 'B', text: '85' },
          { key: 'C', text: '90' },
          { key: 'D', text: '100' },
        ],
      },
    },
  },
  {
    externalCode: 'UPSC-CSAT-004',
    subjectSlug: 'csat',
    topicName: 'Syllogism & Deductive Logic',
    difficulty: 2,
    questionType: 'multiple_statement',
    paperCode: 'CSAT_II',
    isPyq: false,
    pyqYear: null,
    marks: 2.5,
    negativeMarks: 0.83,
    sourceTitle: 'CSAT Logical Reasoning',
    citationText: 'CSAT Paper II Practice Item',
    status: 'approved',
    correctOption: 'A',
    translations: {
      en: {
        isOfficialTranslation: true,
        questionText:
          'Statements:\nAll District Collectors are Civil Servants.\nSome Civil Servants are Economists.\nConclusions:\nI. Some Economists are Civil Servants.\nII. All Economists are District Collectors.\nWhich conclusion logically follows?',
        explanation:
          'From "Some Civil Servants are Economists", conversion directly yields "Some Economists are Civil Servants" (Conclusion I follows). Conclusion II does not necessarily follow.',
        options: [
          { key: 'A', text: 'Only Conclusion I follows' },
          { key: 'B', text: 'Only Conclusion II follows' },
          { key: 'C', text: 'Both I and II follow' },
          { key: 'D', text: 'Neither I nor II follows' },
        ],
      },
      hi: {
        isOfficialTranslation: true,
        questionText:
          'कथन: सभी जिलाधिकारी सिविल सेवक हैं। कुछ सिविल सेवक अर्थशास्त्री हैं।\nनिष्कर्ष:\nI. कुछ अर्थशास्त्री सिविल सेवक हैं।\nII. सभी अर्थशास्त्री जिलाधिकारी हैं।\nकौन-सा निष्कर्ष तार्किक रूप से निकलता है?',
        explanation:
          'केवल निष्कर्ष I निकलता है।',
        options: [
          { key: 'A', text: 'केवल निष्कर्ष I निकलता है' },
          { key: 'B', text: 'केवल निष्कर्ष II निकलता है' },
          { key: 'C', text: 'I और II दोनों निकलते हैं' },
          { key: 'D', text: 'न तो I और न ही II निकलता है' },
        ],
      },
      gu: {
        isOfficialTranslation: true,
        questionText:
          'વિધાનો: બધા જિલ્લા કલેક્ટર સિવિલ સર્વન્ટ છે. કેટલાક સિવિલ સર્વન્ટ અર્થશાસ્ત્રી છે.\nતારણો:\nI. કેટલાક અર્થશાસ્ત્રી સિવિલ સર્વન્ટ છે.\nII. બધા અર્થશાસ્ત્રી જિલ્લા કલેક્ટર છે.\nકયું તારણ તાર્કિક રીતે અનુસરે છે?',
        explanation:
          'માત્ર તારણ I અનુસરે છે.',
        options: [
          { key: 'A', text: 'માત્ર તારણ I અનુસરે છે' },
          { key: 'B', text: 'માત્ર તારણ II અનુસરે છે' },
          { key: 'C', text: 'I અને II બંને અનુસરે છે' },
          { key: 'D', text: 'I કે II એક પણ અનુસરતું નથી' },
        ],
      },
    },
  },
  {
    externalCode: 'UPSC-PYQ-2024-POL-01',
    subjectSlug: 'polity',
    topicName: 'Constitutional Amendments & Special Majority',
    difficulty: 3,
    questionType: 'multiple_statement',
    paperCode: 'GS_I',
    isPyq: true,
    pyqYear: 2024,
    marks: 2,
    negativeMarks: 0.67,
    sourceTitle: 'UPSC CSE Prelims 2024 Official Paper I',
    citationText: 'UPSC CSE Prelims 2024 · Constitution Article 368',
    status: 'approved',
    correctOption: 'B',
    translations: {
      en: {
        isOfficialTranslation: true,
        questionText:
          'With reference to Constitutional Amendment Bills under Article 368 in India, consider the following statements:\n1. A Constitutional Amendment Bill can be introduced in either House of Parliament without prior presidential permission.\n2. There is a provision for holding a joint sitting of both Houses to resolve a deadlock over a Constitutional Amendment Bill.\n3. After the 24th Constitutional Amendment Act, 1971, it is obligatory for the President to give assent to a Constitutional Amendment Bill.\nWhich of the statements given above are correct?',
        explanation:
          'Statement 1 is correct (no prior Presidential recommendation needed). Statement 2 is incorrect (Article 108 joint sitting does NOT apply to Constitutional Amendment Bills under Article 368). Statement 3 is correct (24th Amendment made Presidential assent obligatory).',
        options: [
          { key: 'A', text: '1 and 2 only' },
          { key: 'B', text: '1 and 3 only' },
          { key: 'C', text: '2 and 3 only' },
          { key: 'D', text: '1, 2 and 3' },
        ],
      },
      hi: {
        isOfficialTranslation: true,
        questionText:
          'भारत में अनुच्छेद 368 के तहत संविधान संशोधन विधेयकों के संदर्भ में निम्नलिखित कथनों पर विचार कीजिए:\n1. संविधान संशोधन विधेयक राष्ट्रपति की पूर्व अनुमति के बिना संसद के किसी भी सदन में पेश किया जा सकता है।\n2. गतिरोध दूर करने के लिए दोनों सदनों की संयुक्त बैठक का प्रावधान है।\n3. 24वें संविधान संशोधन अधिनियम, 1971 के बाद राष्ट्रपति के लिए ऐसे विधेयक को सहमति देना अनिवार्य है।\nउपर्युक्त में से कौन-से कथन सही हैं?',
        explanation:
          'कथन 1 और 3 सही हैं। अनुच्छेद 368 के संविधान संशोधन विधेयकों पर संयुक्त बैठक (अनुच्छेद 108) का प्रावधान नहीं है।',
        options: [
          { key: 'A', text: 'केवल 1 और 2' },
          { key: 'B', text: 'केवल 1 और 3' },
          { key: 'C', text: 'केवल 2 और 3' },
          { key: 'D', text: '1, 2 और 3' },
        ],
      },
      gu: {
        isOfficialTranslation: true,
        questionText:
          'ભારતમાં અનુચ્છેદ 368 હેઠળ બંધારણીય સુધારા ખરડાના સંદર્ભમાં નીચેના વિધાનો પર વિચાર કરો:\n1. રાષ્ટ્રપતિની પૂર્વ મંજૂરી વિના સંસદના કોઈપણ ગૃહમાં બંધારણીય સુધારા ખરડો રજૂ કરી શકાય છે.\n2. મડાગાંઠ ઉકેલવા બંને ગૃહોની સંયુક્ત બેઠકની જોગવાઈ છે.\n3. 24મા બંધારણીય સુધારા અધિનિયમ, 1971 પછી રાષ્ટ્રપતિ માટે સંમતિ આપવી ફરજિયાત છે.\nઉપરનામાંથી કયા વિધાનો સાચા છે?',
        explanation:
          'વિધાન 1 અને 3 સાચા છે. બંધારણીય સુધારા ખરડા માટે સંયુક્ત બેઠકની જોગવાઈ નથી.',
        options: [
          { key: 'A', text: 'માત્ર 1 અને 2' },
          { key: 'B', text: 'માત્ર 1 અને 3' },
          { key: 'C', text: 'માત્ર 2 અને 3' },
          { key: 'D', text: '1, 2 અને 3' },
        ],
      },
    },
  },
  {
    externalCode: 'UPSC-PYQ-2023-ECO-01',
    subjectSlug: 'economy',
    topicName: 'Central Bank Digital Currency & Capital Markets',
    difficulty: 3,
    questionType: 'multiple_statement',
    paperCode: 'GS_I',
    isPyq: true,
    pyqYear: 2023,
    marks: 2,
    negativeMarks: 0.67,
    sourceTitle: 'UPSC CSE Prelims 2023 Official Paper I',
    citationText: 'UPSC CSE Prelims 2023 · RBI e-Rupee & Treasury Bills',
    status: 'approved',
    correctOption: 'A',
    translations: {
      en: {
        isOfficialTranslation: true,
        questionText:
          'Consider the following statements regarding Treasury Bills (T-Bills) and Central Bank Digital Currency (e-Rupee) in India:\n1. Treasury Bills are short-term money market instruments issued by the Government of India at a discount and redeemed at par.\n2. State Governments cannot issue Treasury Bills in India.\n3. Retail e-Rupee (CBDC-R) issued by the RBI is a sovereign legal tender liability appearing on the RBI balance sheet.\nWhich of the statements given above are correct?',
        explanation:
          'All three statements are correct. T-Bills (91, 182, 364 days) are issued only by the Union Government at discount without coupon; State Governments issue SDLs, not T-Bills. CBDC-R is legal tender on the RBI balance sheet.',
        options: [
          { key: 'A', text: '1, 2 and 3' },
          { key: 'B', text: '1 and 2 only' },
          { key: 'C', text: '2 and 3 only' },
          { key: 'D', text: '1 and 3 only' },
        ],
      },
      hi: {
        isOfficialTranslation: true,
        questionText:
          'भारत में ट्रेजरी बिल (T-Bills) और सेंट्रल बैंक डिजिटल करेंसी (e-Rupee) के संदर्भ में विचार कीजिए:\n1. ट्रेजरी बिल भारत सरकार द्वारा बट्टे पर जारी और सममूल्य पर भुनाए जाने वाले अल्पकालिक मुद्रा बाजार प्रपत्र हैं।\n2. भारत में राज्य सरकारें ट्रेजरी बिल जारी नहीं कर सकतीं।\n3. RBI द्वारा जारी खुदरा e-Rupee संप्रभु वैध मुद्रा देयता है जो RBI की बैलेंस शीट पर दर्ज होती है।\nकौन-से कथन सही हैं?',
        explanation:
          'तीनों कथन सही हैं।',
        options: [
          { key: 'A', text: '1, 2 और 3' },
          { key: 'B', text: 'केवल 1 और 2' },
          { key: 'C', text: 'केवल 2 और 3' },
          { key: 'D', text: 'केवल 1 और 3' },
        ],
      },
      gu: {
        isOfficialTranslation: true,
        questionText:
          'ભારતમાં ટ્રેઝરી બિલ્સ (T-Bills) અને સેન્ટ્રલ બેંક ડિજિટલ કરન્સી (e-Rupee) અંગે વિચારો:\n1. ટ્રેઝરી બિલ્સ ભારત સરકાર દ્વારા ડિસ્કાઉન્ટ પર જારી કરાતા ટૂંકા ગાળાના નાણા બજારના સાધનો છે.\n2. ભારતમાં રાજ્ય સરકારો ટ્રેઝરી બિલ્સ જારી કરી શકતી નથી.\n3. RBI દ્વારા જારી રિટેલ e-Rupee એ RBI ની બેલેન્સ શીટ પરનું કાયદેસરનું ચલણ છે.\nકયા વિધાનો સાચા છે?',
        explanation:
          'ત્રણેય વિધાનો સાચા છે.',
        options: [
          { key: 'A', text: '1, 2 અને 3' },
          { key: 'B', text: 'માત્ર 1 અને 2' },
          { key: 'C', text: 'માત્ર 2 અને 3' },
          { key: 'D', text: 'માત્ર 1 અને 3' },
        ],
      },
    },
  },
  {
    externalCode: 'UPSC-PYQ-2022-HIST-01',
    subjectSlug: 'history',
    topicName: 'Quit India Movement & Constitutional Proposals',
    difficulty: 2,
    questionType: 'single_mcq',
    paperCode: 'GS_I',
    isPyq: true,
    pyqYear: 2022,
    marks: 2,
    negativeMarks: 0.67,
    sourceTitle: 'UPSC CSE Prelims 2022 Official Paper I',
    citationText: 'UPSC CSE Prelims 2022 · Cripps Mission 1942',
    status: 'approved',
    correctOption: 'B',
    translations: {
      en: {
        isOfficialTranslation: true,
        questionText:
          'With reference to the proposals of the Cripps Mission (1942), consider the following statements:\n1. The Constituent Assembly would have members nominated by the Provincial Assemblies as well as the Princely States.\n2. Any Province which is not prepared to accept the new Constitution would have the right to sign a separate agreement with Britain regarding its future status.\nWhich of the statements given above is/are correct?',
        explanation:
          'Statement 1 is incorrect: Provincial Assembly members were to be elected by proportional representation, while Princely States would nominate their representatives. Statement 2 is correct: provinces could opt out and negotiate separate dominion arrangements.',
        options: [
          { key: 'A', text: '1 only' },
          { key: 'B', text: '2 only' },
          { key: 'C', text: 'Both 1 and 2' },
          { key: 'D', text: 'Neither 1 nor 2' },
        ],
      },
      hi: {
        isOfficialTranslation: true,
        questionText:
          'क्रिप्स मिशन (1942) के प्रस्तावों के संदर्भ में निम्नलिखित कथनों पर विचार कीजिए:\n1. संविधान सभा में प्रांतीय विधानसभाओं और देसी रियासतों दोनों द्वारा नामित सदस्य होते।\n2. कोई भी प्रांत जो नया संविधान स्वीकार करने को तैयार नहीं है, उसे ब्रिटेन के साथ अपनी भावी स्थिति पर अलग समझौता करने का अधिकार होगा।\nकौन-सा/से कथन सही है/हैं?',
        explanation:
          'कथन 1 गलत है क्योंकि प्रांतीय विधानसभाओं द्वारा सदस्य आनुपातिक प्रतिनिधित्व से निर्वाचित होने थे। कथन 2 सही है।',
        options: [
          { key: 'A', text: 'केवल 1' },
          { key: 'B', text: 'केवल 2' },
          { key: 'C', text: '1 और 2 दोनों' },
          { key: 'D', text: 'न तो 1 और न ही 2' },
        ],
      },
      gu: {
        isOfficialTranslation: true,
        questionText:
          'ક્રિપ્સ મિશન (1942) ની દરખાસ્તો અંગે વિચારો:\n1. બંધારણ સભામાં પ્રાંતીય વિધાનસભાઓ અને દેશી રજવાડાઓ દ્વારા નામાંકિત સભ્યો હશે.\n2. નવું બંધારણ સ્વીકારવા તૈયાર ન હોય તેવા કોઈપણ પ્રાંતને બ્રિટન સાથે અલગ કરાર કરવાનો અધિકાર હશે.\nકયું વિધાન સાચું છે?',
        explanation:
          'માત્ર વિધાન 2 સાચું છે; પ્રાંતીય સભ્યો ચૂંટાવાના હતા.',
        options: [
          { key: 'A', text: 'માત્ર 1' },
          { key: 'B', text: 'માત્ર 2' },
          { key: 'C', text: '1 અને 2 બંને' },
          { key: 'D', text: '1 કે 2 પૈકી કોઈ નહીં' },
        ],
      },
    },
  },
  {
    externalCode: 'UPSC-PYQ-2021-GEO-01',
    subjectSlug: 'geography',
    topicName: 'Black Cotton Soils & Regur Distribution',
    difficulty: 2,
    questionType: 'single_mcq',
    paperCode: 'GS_I',
    isPyq: true,
    pyqYear: 2021,
    marks: 2,
    negativeMarks: 0.67,
    sourceTitle: 'UPSC CSE Prelims 2021 Official Paper I',
    citationText: 'UPSC CSE Prelims 2021 · Indian Soils & Deccan Trap',
    status: 'approved',
    correctOption: 'C',
    translations: {
      en: {
        isOfficialTranslation: true,
        questionText:
          'The black cotton soil of India has been formed due to the weathering of:',
        explanation:
          'Indian black cotton soil (Regur) formed predominantly through weathering of Cretaceous basaltic fissure volcanic rocks of the Deccan Trap across Maharashtra, Gujarat, and Madhya Pradesh.',
        options: [
          { key: 'A', text: 'Brown forest soil' },
          { key: 'B', text: 'Granite and schist' },
          { key: 'C', text: 'Fissure volcanic rock' },
          { key: 'D', text: 'Shale and limestone' },
        ],
      },
      hi: {
        isOfficialTranslation: true,
        questionText:
          'भारत की काली कपास मिट्टी (रेगुर) का निर्माण किसके अपक्षय के कारण हुआ है?',
        explanation:
          'भारत की काली मिट्टी दक्कन ट्रैप की दरारी ज्वालामुखी (बेसाल्टिक) चट्टानों के अपक्षय से बनी है।',
        options: [
          { key: 'A', text: 'भूरी वन मिट्टी' },
          { key: 'B', text: 'ग्रेनाइट और शिस्ट' },
          { key: 'C', text: 'दरारी ज्वालामुखी चट्टान' },
          { key: 'D', text: 'शेल और चूना पत्थर' },
        ],
      },
      gu: {
        isOfficialTranslation: true,
        questionText:
          'ભારતની કાળી કપાસની જમીન (રેગુર) કોના ખવાણને કારણે બનેલી છે?',
        explanation:
          'દખ્ખણના ઉચ્ચપ્રદેશના ફિશર જ્વાળામુખી (બેસાલ્ટ) ખડકોના ખવાણથી કાળી જમીન બની છે.',
        options: [
          { key: 'A', text: 'ભૂરી જંગલ જમીન' },
          { key: 'B', text: 'ગ્રેનાઇટ અને શિસ્ટ' },
          { key: 'C', text: 'ફિશર જ્વાળામુખી ખડક' },
          { key: 'D', text: 'શેલ અને ચૂનાનો પથ્થર' },
        ],
      },
    },
  },
  {
    externalCode: 'UPSC-PYQ-2020-ENV-01',
    subjectSlug: 'environment',
    topicName: 'Tiger Reserves & Critical Wildlife Habitats',
    difficulty: 3,
    questionType: 'single_mcq',
    paperCode: 'GS_I',
    isPyq: true,
    pyqYear: 2020,
    marks: 2,
    negativeMarks: 0.67,
    sourceTitle: 'UPSC CSE Prelims 2020 Official Paper I',
    citationText: 'UPSC CSE Prelims 2020 · NTCA Protected Areas',
    status: 'approved',
    correctOption: 'A',
    translations: {
      en: {
        isOfficialTranslation: true,
        questionText:
          'Among the following Tiger Reserves, which one has the largest area under "Critical Tiger Habitat"?',
        explanation:
          'Nagarjunasagar-Srisailam Tiger Reserve (Andhra Pradesh / Telangana) spans over 2,500+ sq km of Core/Critical Tiger Habitat, the largest among Indian Tiger Reserves.',
        options: [
          { key: 'A', text: 'Nagarjunasagar-Srisailam' },
          { key: 'B', text: 'Corbett' },
          { key: 'C', text: 'Ranthambore' },
          { key: 'D', text: 'Sundarbans' },
        ],
      },
      hi: {
        isOfficialTranslation: true,
        questionText:
          'निम्नलिखित बाघ अभयारण्यों में से किसमें "क्रांतिक बाघ पर्यावास" (Critical Tiger Habitat) के अंतर्गत सबसे बड़ा क्षेत्रफल है?',
        explanation:
          'नागार्जुनसागर-श्रीशैलम बाघ अभयारण्य में क्रांतिक बाघ पर्यावास का क्षेत्रफल सर्वाधिक है।',
        options: [
          { key: 'A', text: 'नागार्जुनसागर-श्रीशैलम' },
          { key: 'B', text: 'कॉर्बेट' },
          { key: 'C', text: 'रणथंभौर' },
          { key: 'D', text: 'सुंदरबन' },
        ],
      },
      gu: {
        isOfficialTranslation: true,
        questionText:
          'નીચેનામાંથી કયા ટાઇગર રિઝર્વમાં "ક્રિટિકલ ટાઇગર હેબિટેટ" હેઠળ સૌથી મોટો વિસ્તાર આવેલો છે?',
        explanation:
          'નાગાર્જુનસાગર-શ્રીશૈલમ ટાઇગર રિઝર્વ સૌથી મોટો કોર વિસ્તાર ધરાવે છે.',
        options: [
          { key: 'A', text: 'નાગાર્જુનસાગર-શ્રીશૈલમ' },
          { key: 'B', text: 'કોર્બેટ' },
          { key: 'C', text: 'રણથંભોર' },
          { key: 'D', text: 'સુંદરબન' },
        ],
      },
    },
  },
  {
    externalCode: 'UPSC-PYQ-2019-POL-01',
    subjectSlug: 'polity',
    topicName: 'Ninth Schedule & Judicial Review',
    difficulty: 3,
    questionType: 'single_mcq',
    paperCode: 'GS_I',
    isPyq: true,
    pyqYear: 2019,
    marks: 2,
    negativeMarks: 0.67,
    sourceTitle: 'UPSC CSE Prelims 2019 Official Paper I',
    citationText: 'UPSC CSE Prelims 2019 · I.R. Coelho Case 2007',
    status: 'approved',
    correctOption: 'C',
    translations: {
      en: {
        isOfficialTranslation: true,
        questionText:
          'Under which Schedule of the Constitution of India can the transfer of tribal land to private parties for mining be declared null and void, as upheld in the Samatha Judgment?',
        explanation:
          'In Samatha vs. State of Andhra Pradesh (1997), the Supreme Court held that transfer of tribal land in Scheduled Areas to non-tribals or private mining companies is null and void under the Fifth Schedule.',
        options: [
          { key: 'A', text: 'Third Schedule' },
          { key: 'B', text: 'Fourth Schedule' },
          { key: 'C', text: 'Fifth Schedule' },
          { key: 'D', text: 'Ninth Schedule' },
        ],
      },
      hi: {
        isOfficialTranslation: true,
        questionText:
          'भारत के संविधान की किस अनुसूची के अधीन जनजातीय भूमि का खनन के लिए निजी पक्षकारों को अंतरण अकृत और शून्य घोषित किया जा सकता है?',
        explanation:
          'समता बनाम आंध्र प्रदेश राज्य (1997) मामले में सर्वोच्च न्यायालय ने पाँचवीं अनुसूची के तहत अनुसूचित क्षेत्रों में जनजातीय भूमि के गैर-जनजातीय या निजी खनन अंतरण को शून्य माना।',
        options: [
          { key: 'A', text: 'तीसरी अनुसूची' },
          { key: 'B', text: 'चौथी अनुसूची' },
          { key: 'C', text: 'पाँचवीं अनुसूची' },
          { key: 'D', text: 'नौवीं अनुसूची' },
        ],
      },
      gu: {
        isOfficialTranslation: true,
        questionText:
          'ભારતના બંધારણની કઈ અનુસૂચિ હેઠળ ખાણકામ માટે આદિવાસી જમીનનું ખાનગી પક્ષોને હસ્તાંતરણ રદબાતલ જાહેર કરી શકાય છે?',
        explanation:
          'સમતા કેસ (1997) માં સુપ્રીમ કોર્ટે પાંચમી અનુસૂચિ હેઠળ આવું હસ્તાંતરણ રદબાતલ ઠેરવ્યું હતું.',
        options: [
          { key: 'A', text: 'ત્રીજી અનુસૂચિ' },
          { key: 'B', text: 'ચોથી અનુસૂચિ' },
          { key: 'C', text: 'પાંચમી અનુસૂચિ' },
          { key: 'D', text: 'નવમી અનુસૂચિ' },
        ],
      },
    },
  },
  {
    externalCode: 'UPSC-PYQ-2018-ART-01',
    subjectSlug: 'art_culture',
    topicName: 'Indian Classical Paintings & Architecture',
    difficulty: 2,
    questionType: 'single_mcq',
    paperCode: 'GS_I',
    isPyq: true,
    pyqYear: 2018,
    marks: 2,
    negativeMarks: 0.67,
    sourceTitle: 'UPSC CSE Prelims 2018 Official Paper I',
    citationText: 'UPSC CSE Prelims 2018 · Bani Thani & Kishangarh School',
    status: 'approved',
    correctOption: 'D',
    translations: {
      en: {
        isOfficialTranslation: true,
        questionText:
          'The well-known painting "Bani Thani" belongs to which of the following miniature schools of Rajasthan?',
        explanation:
          'Bani Thani ("Lady of Fashion") was painted by Nihal Chand under Maharaja Sawant Singh (Nagari Das) and is the signature masterpiece of the Kishangarh School of miniature painting.',
        options: [
          { key: 'A', text: 'Bundi School' },
          { key: 'B', text: 'Jaipur School' },
          { key: 'C', text: 'Kangra School' },
          { key: 'D', text: 'Kishangarh School' },
        ],
      },
      hi: {
        isOfficialTranslation: true,
        questionText:
          'सुप्रसिद्ध चित्र "बनी-ठनी" किस शैली से संबंधित है?',
        explanation:
          '"बनी-ठनी" निहाल चंद द्वारा किशनगढ़ शैली में निर्मित विश्वप्रसिद्ध लघुचित्र है।',
        options: [
          { key: 'A', text: 'बूंदी शैली' },
          { key: 'B', text: 'जयपुर शैली' },
          { key: 'C', text: 'कांगड़ा शैली' },
          { key: 'D', text: 'किशनगढ़ शैली' },
        ],
      },
      gu: {
        isOfficialTranslation: true,
        questionText:
          'સુપ્રસિદ્ધ ચિત્ર "બની-ઠની" નીચેનામાંથી કઈ ચિત્રશૈલી સાથે સંકળાયેલું છે?',
        explanation:
          '"બની-ઠની" નિહાલ ચંદ દ્વારા બનાવેલ કિશનગઢ શૈલીની ઉત્તમ કૃતિ છે.',
        options: [
          { key: 'A', text: 'બુંદી શૈલી' },
          { key: 'B', text: 'જયપુર શૈલી' },
          { key: 'C', text: 'કાંગડા શૈલી' },
          { key: 'D', text: 'કિશનગઢ શૈલી' },
        ],
      },
    },
  },
  {
    externalCode: 'UPSC-PYQ-2024-CSAT-01',
    subjectSlug: 'csat',
    topicName: 'Remainder Theorem & Quantitative Logic',
    difficulty: 3,
    questionType: 'single_mcq',
    paperCode: 'CSAT_II',
    isPyq: true,
    pyqYear: 2024,
    marks: 2.5,
    negativeMarks: 0.83,
    sourceTitle: 'UPSC CSE Prelims 2024 CSAT Paper II',
    citationText: 'UPSC CSE Prelims 2024 · CSAT Number System',
    status: 'approved',
    correctOption: 'B',
    translations: {
      en: {
        isOfficialTranslation: true,
        questionText:
          'What is the remainder when (85 × 87 × 89 × 91 × 95 × 96) is divided by 100?',
        explanation:
          'Factor out powers of 5 and 2: 85 = 5×17, 95 = 5×19, and 96 = 4×24. Thus the product contains 5 × 5 × 4 = 100 as an exact factor! Therefore the remainder is 0.',
        options: [
          { key: 'A', text: '1' },
          { key: 'B', text: '0' },
          { key: 'C', text: '2' },
          { key: 'D', text: '4' },
        ],
      },
      hi: {
        isOfficialTranslation: true,
        questionText:
          '(85 × 87 × 89 × 91 × 95 × 96) को 100 से विभाजित करने पर शेषफल क्या होगा?',
        explanation:
          '85 और 95 दोनों 5 से विभाज्य हैं (5×5=25) तथा 96 संख्या 4 से विभाज्य है। 25×4 = 100, अतः गुणनफल 100 से पूर्णतः विभाज्य है और शेषफल 0 होगा।',
        options: [
          { key: 'A', text: '1' },
          { key: 'B', text: '0' },
          { key: 'C', text: '2' },
          { key: 'D', text: '4' },
        ],
      },
      gu: {
        isOfficialTranslation: true,
        questionText:
          '(85 × 87 × 89 × 91 × 95 × 96) ને 100 વડે ભાગતા શેષ કેટલી વધે?',
        explanation:
          '85 અને 95 માં 5×5=25 અને 96 માં 4 નો ગુણક હોવાથી 25×4=100 વડે પૂર્ણ ભાગી શકાય છે, એટલે શેષ 0 આવશે.',
        options: [
          { key: 'A', text: '1' },
          { key: 'B', text: '0' },
          { key: 'C', text: '2' },
          { key: 'D', text: '4' },
        ],
      },
    },
  },
];

export const SEED_MAINS_PAPERS: SeedMainsPaper[] = [
  {
    paperCode: 'ESSAY',
    titleEn: 'Paper I — Essay',
    titleHi: 'प्रश्नपत्र I — निबंध',
    titleGu: 'પેપર I — નિબંધ',
    maxMarks: 250,
    durationMinutes: 180,
    isQualifying: false,
    samplePrompts: [
      {
        id: 'essay-1',
        wordLimit: 1100,
        marks: 125,
        topic: 'Philosophical & Governance',
        promptEn: 'A ship in harbour is safe, but that is not what ships are built for — examine in the context of civil service reform and innovation.',
        promptHi: 'बंदरगाह में खड़ा जहाज सुरक्षित होता है, लेकिन जहाज इसके लिए नहीं बनाए जाते — लोक सेवा सुधार और नवाचार के संदर्भ में परीक्षण कीजिए।',
        promptGu: 'બંદરમાં ઊભેલું વહાણ સુરક્ષિત હોય છે, પરંતુ વહાણ તે માટે બનતા નથી — જાહેર વહીવટમાં સુધારાના સંદર્ભમાં ચર્ચા કરો.',
      },
    ],
  },
  {
    paperCode: 'GS1',
    titleEn: 'Paper II — General Studies I',
    titleHi: 'प्रश्नपत्र II — सामान्य अध्ययन I',
    titleGu: 'પેપર II — જનરલ સ્ટડીઝ I',
    maxMarks: 250,
    durationMinutes: 180,
    isQualifying: false,
    samplePrompts: [
      {
        id: 'gs1-1',
        wordLimit: 250,
        marks: 15,
        topic: 'Indian Heritage, Society & Geography',
        promptEn: 'Explain how the Bhakti movement transformed regional linguistic identities and social cohesion across medieval India. Give illustrative examples.',
        promptHi: 'स्पष्ट कीजिए कि भक्ति आंदोलन ने मध्यकालीन भारत में क्षेत्रीय भाषाई पहचान और सामाजिक समरसता को किस प्रकार रूपांतरित किया। उदाहरण सहित उत्तर दीजिए।',
        promptGu: 'ભક્તિ આંદોલને મધ્યકાલીન ભારતમાં પ્રાદેશિક ભાષાકીય ઓળખ અને સામાજિક એકતાને કેવી રીતે રૂપાંતરિત કરી તે ઉદાહરણ સહિત સમજાવો.',
      },
    ],
  },
  {
    paperCode: 'GS2',
    titleEn: 'Paper III — General Studies II',
    titleHi: 'प्रश्नपत्र III — सामान्य अध्ययन II',
    titleGu: 'પેપર III — જનરલ સ્ટડીઝ II',
    maxMarks: 250,
    durationMinutes: 180,
    isQualifying: false,
    samplePrompts: [
      {
        id: 'gs2-1',
        wordLimit: 250,
        marks: 15,
        topic: 'Polity, Governance & Cooperative Federalism',
        promptEn: 'Critically evaluate the institutional role of the Finance Commission and GST Council in balancing fiscal autonomy with cooperative federalism in India.',
        promptHi: 'भारत में राजकोषीय स्वायत्तता और सहकारी संघवाद के बीच संतुलन बनाने में वित्त आयोग और GST परिषद की संस्थागत भूमिका का समालोचनात्मक मूल्यांकन कीजिए।',
        promptGu: 'ભારતમાં નાણાકીય સ્વાયત્તતા અને સહકારી સંઘવાદ વચ્ચે સંતુલન જાળવવામાં નાણા પંચ અને GST કાઉન્સિલની ભૂમિકાનું વિવેચનાત્મક મૂલ્યાંકન કરો.',
      },
    ],
  },
  {
    paperCode: 'GS3',
    titleEn: 'Paper IV — General Studies III',
    titleHi: 'प्रश्नपत्र IV — सामान्य अध्ययन III',
    titleGu: 'પેપર IV — જનરલ સ્ટડીઝ III',
    maxMarks: 250,
    durationMinutes: 180,
    isQualifying: false,
    samplePrompts: [
      {
        id: 'gs3-1',
        wordLimit: 250,
        marks: 15,
        topic: 'Economy, Environment & Internal Security',
        promptEn: 'India’s transition toward green hydrogen and grid-scale battery storage requires both supply-chain resilience and agricultural water parity. Discuss.',
        promptHi: 'हरित हाइड्रोजन और ग्रिड-स्तरीय बैटरी भंडारण की ओर भारत के संक्रमण के लिए आपूर्ति-श्रृंखला लचीलापन और कृषि जल समता दोनों आवश्यक हैं। चर्चा कीजिए।',
        promptGu: 'ગ્રીન હાઇડ્રોજન અને ગ્રીડ-સ્તરીય બેટરી સંગ્રહ તરફ ભારતના સંક્રમણ માટે સપ્લાય-ચેઇન સ્થિતિસ્થાપકતા અને કૃષિ જળ સંતુલન બંને જરૂરી છે. ચર્ચા કરો.',
      },
    ],
  },
  {
    paperCode: 'GS4',
    titleEn: 'Paper V — General Studies IV (Ethics)',
    titleHi: 'प्रश्नपत्र V — सामान्य अध्ययन IV (नीतिशास्त्र)',
    titleGu: 'પેપર V — જનરલ સ્ટડીઝ IV (નીતિશાસ્ત્ર)',
    maxMarks: 250,
    durationMinutes: 180,
    isQualifying: false,
    samplePrompts: [
      {
        id: 'gs4-1',
        wordLimit: 250,
        marks: 20,
        topic: 'Administrative Ethics Case Study',
        promptEn: 'As a District Magistrate, you discover that a newly built flood-relief embankment uses substandard material approved by a retiring senior colleague. Monsoon arrives in 10 days. Outline your ethical dilemmas and concrete administrative course of action.',
        promptHi: 'एक जिला मजिस्ट्रेट के रूप में आप पाते हैं कि नवनिर्मित बाढ़-राहत तटबंध में सेवानिवृत्त हो रहे वरिष्ठ सहयोगी द्वारा अनुमोदित घटिया सामग्री का उपयोग हुआ है। मानसून 10 दिनों में आने वाला है। अपने नैतिक द्वंद्व और प्रशासनिक कार्ययोजना की रूपरेखा प्रस्तुत कीजिए।',
        promptGu: 'જિલ્લા કલેક્ટર તરીકે તમને જાણવા મળે છે કે નવા બનેલા પૂર-રાહત બંધમાં નિવૃત્ત થઈ રહેલા વરિષ્ઠ અધિકારી દ્વારા મંજૂર કરાયેલ હલકી ગુણવત્તાની સામગ્રી વપરાઈ છે. ચોમાસું 10 દિવસમાં આવી રહ્યું છે. તમારી નૈતિક મૂંઝવણ અને વહીવટી પગલાં સમજાવો.',
      },
    ],
  },
  {
    paperCode: 'OPT1',
    titleEn: 'Paper VI — Optional Subject Paper I',
    titleHi: 'प्रश्नपत्र VI — वैकल्पिक विषय प्रश्नपत्र I',
    titleGu: 'પેપર VI — વૈકલ્પિક વિષય પેપર I',
    maxMarks: 250,
    durationMinutes: 180,
    isQualifying: false,
    samplePrompts: [
      {
        id: 'opt1-1',
        wordLimit: 250,
        marks: 20,
        topic: 'Optional Core Theory',
        promptEn: 'Examine how classical theoretical traditions in your chosen optional subject address the tension between state capacity and citizen autonomy.',
        promptHi: 'परीक्षण कीजिए कि आपके चयनित वैकल्पिक विषय की शास्त्रीय सैद्धांतिक परंपराएँ राज्य क्षमता और नागरिक स्वायत्तता के बीच तनाव को कैसे संबोधित करती हैं।',
        promptGu: 'તમારા પસંદ કરેલા વૈકલ્પિક વિષયના શાસ્ત્રીય સિદ્ધાંતો રાજ્યની ક્ષમતા અને નાગરિક સ્વાયત્તતા વચ્ચેના તણાવને કેવી રીતે સંબોધે છે તે તપાસો.',
      },
    ],
  },
  {
    paperCode: 'OPT2',
    titleEn: 'Paper VII — Optional Subject Paper II',
    titleHi: 'प्रश्नपत्र VII — वैकल्पिक विषय प्रश्नपत्र II',
    titleGu: 'પેપર VII — વૈકલ્પિક વિષય પેપર II',
    maxMarks: 250,
    durationMinutes: 180,
    isQualifying: false,
    samplePrompts: [
      {
        id: 'opt2-1',
        wordLimit: 250,
        marks: 20,
        topic: 'Applied Indian Context',
        promptEn: 'Analyze contemporary post-liberalization shifts in your optional subject within the Indian administrative and socio-economic landscape.',
        promptHi: 'भारतीय प्रशासनिक और सामाजिक-आर्थिक परिदृश्य में अपने वैकल्पिक विषय के समकालीन उदारीकरणोत्तर परिवर्तनों का विश्लेषण कीजिए।',
        promptGu: 'ભારતીય વહીવટી અને સામાજિક-આર્થિક પરિપ્રેક્ષ્યમાં તમારા વૈકલ્પિક વિષયના સમકાલીન પરિવર્તનોનું વિશ્લેષણ કરો.',
      },
    ],
  },
  {
    paperCode: 'ENG_QUAL',
    titleEn: 'Paper A — Compulsory English (Qualifying)',
    titleHi: 'प्रश्नपत्र A — अनिवार्य अंग्रेज़ी (अर्हक)',
    titleGu: 'પેપર A — ફરજિયાત અંગ્રેજી (ક્વોલિફાઇંગ)',
    maxMarks: 300,
    durationMinutes: 180,
    isQualifying: true,
    qualifyingNote: '25% Qualifying Threshold (75/300)',
    samplePrompts: [
      {
        id: 'eng-1',
        wordLimit: 600,
        marks: 100,
        topic: 'Precis & Formal Essay',
        promptEn: 'Write an essay in clear, grammatically rigorous English on: "Public libraries as pillars of democratic citizenship in a digital age."',
        promptHi: 'स्पष्ट और व्याकरणिक रूप से शुद्ध अंग्रेज़ी में निबंध लिखें: "डिजिटल युग में लोकतांत्रिक नागरिकता के स्तंभ के रूप में सार्वजनिक पुस्तकालय।"',
        promptGu: 'શુદ્ધ અને સ્પષ્ટ અંગ્રેજીમાં નિબંધ લખો: "ડિજિટલ યુગમાં લોકશાહી નાગરિકતાના સ્તંભ તરીકે જાહેર પુસ્તકાલયો."',
      },
    ],
  },
  {
    paperCode: 'LANG_QUAL',
    titleEn: 'Paper B — Indian Language (Qualifying)',
    titleHi: 'प्रश्नपत्र B — भारतीय भाषा (अर्हक)',
    titleGu: 'પેપર B — ભારતીય ભાષા (ક્વોલિફાઇંગ)',
    maxMarks: 300,
    durationMinutes: 180,
    isQualifying: true,
    qualifyingNote: '25% Qualifying Threshold (75/300 · Hindi / Gujarati / Eighth Schedule)',
    samplePrompts: [
      {
        id: 'lang-1',
        wordLimit: 600,
        marks: 100,
        topic: 'Eighth Schedule Language Essay (Hindi / Gujarati)',
        promptEn: 'Write a structured essay in your chosen Eighth Schedule language (Hindi or Gujarati) on: "Gram Swaraj and grassroots ecological stewardship."',
        promptHi: 'अपनी चयनित आठवीं अनुसूची की भाषा (हिन्दी या गुजराती) में निबंध लिखें: "ग्राम स्वराज और जमीनी स्तर पर पारिस्थितिक संरक्षण।"',
        promptGu: 'તમારી પસંદ કરેલી આઠમી અનુસૂચિની ભાષા (ગુજરાતી અથવા હિન્દી) માં નિબંધ લખો: "ગ્રામ સ્વરાજ અને પાયાના સ્તરે પર્યાવરણ સંરક્ષણ."',
      },
    ],
  },
];

export const SEED_CURRENT_AFFAIRS = [
  {
    slug: 'ca-16th-fc-fiscal-devolution',
    publishedDate: '2026-11-20',
    subjectSlug: 'economy',
    gsPaper: 'GS III · Economy',
    titleEn: 'Sixteenth Finance Commission Consultations on Urban Local Body Grants',
    titleHi: 'शहरी स्थानीय निकाय अनुदानों पर सोलहवें वित्त आयोग का परामर्श',
    titleGu: 'શહેરી સ્થાનિક સંસ્થાઓના અનુદાન પર સોળમા નાણા પંચની ચર્ચા',
    summaryEn:
      'State finance departments submitted memoranda proposing performance-linked disaster mitigation and municipal climate resilience weightage under Article 280 devolution.',
    summaryHi:
      'राज्य वित्त विभागों ने अनुच्छेद 280 के अंतर्गत आपदा न्यूनीकरण और नगरपालिका जलवायु लचीलेपन से जुड़े प्रदर्शन-आधारित अनुदानों का प्रस्ताव रखा।',
    summaryGu:
      'રાજ્ય નાણા વિભાગોએ અનુચ્છેદ 280 હેઠળ આપત્તિ નિવારણ અને મ્યુનિસિપલ ક્લાયમેટ રેઝિલિયન્સ આધારિત અનુદાનની દરખાસ્ત રજૂ કરી.',
    sourceCitation: 'PIB Press Release · Ministry of Finance Brief',
  },
  {
    slug: 'ca-digital-public-infra-g20',
    publishedDate: '2026-11-18',
    subjectSlug: 'ir',
    gsPaper: 'GS II · International Relations',
    titleEn: 'India Expands Digital Public Infrastructure Co-Creation Pact with Global South Partners',
    titleHi: 'भारत ने ग्लोबल साउथ भागीदारों के साथ डिजिटल पब्लिक इंफ्रास्ट्रक्चर समझौते का विस्तार किया',
    titleGu: 'ભારતે ગ્લોબલ સાઉથ ભાગીદારો સાથે ડિજિટલ પબ્લિક ઇન્ફ્રાસ્ટ્રક્ચર કરારનો વિસ્તાર કર્યો',
    summaryEn:
      'Open-source modular identity and real-time interoperable payment rails are being deployed across partner nations with strong data sovereignty safeguards.',
    summaryHi:
      'डेटा संप्रभुता सुरक्षा उपायों के साथ भागीदार देशों में ओपन-सोर्स पहचान और त्वरित भुगतान ढांचे का विस्तार किया जा रहा है।',
    summaryGu:
      'ડેટા સાર્વભૌમત્વ સુરક્ષા સાથે ભાગીદાર દેશોમાં ઓપન-સોર્સ ઓળખ અને રિયલ-ટાઇમ પેમેન્ટ માળખાનો અમલ થઈ રહ્યો છે.',
    sourceCitation: 'Ministry of External Affairs · Digital India Brief',
  },
  {
    slug: 'ca-wetlands-biodiversity-corridors',
    publishedDate: '2026-11-15',
    subjectSlug: 'environment',
    gsPaper: 'GS III · Environment',
    titleEn: 'National Wetland Inventory Updates Ecological Buffer Norms for Ramsar Basins',
    titleHi: 'राष्ट्रीय आर्द्रभूमि सूची ने रामसर बेसिनों के लिए पारिस्थितिक बफर मानदंड अद्यतन किए',
    titleGu: 'નેશનલ વેટલેન્ડ ઇન્વેન્ટરીએ રામસર બેસિન માટે ઇકોલોજીકલ બફર ધોરણો અપડેટ કર્યા',
    summaryEn:
      'High-resolution satellite mapping identifies hydrological connectivity corridors between coastal mangroves and inland floodplain wetlands.',
    summaryHi:
      'उच्च-रिज़ॉल्यूशन उपग्रह मानचित्रण द्वारा तटीय मैंग्रोव और अंतर्देशीय बाढ़-मैदान आर्द्रभूमियों के बीच जलीय संपर्क गलियारों की पहचान की गई।',
    summaryGu:
      'ઉચ્ચ-રિઝોલ્યુશન સેટેલાઇટ મેપિંગ દ્વારા દરિયાકાંઠાના મેન્ગ્રોવ્સ અને આંતરિક વેટલેન્ડ્સ વચ્ચેના જળમાર્ગોની ઓળખ કરવામાં આવી.',
    sourceCitation: 'MoEFCC · SAC-ISRO Wetland Atlas Update',
  },
  {
    slug: 'ca-constitutional-bench-subclassification',
    publishedDate: '2026-11-12',
    subjectSlug: 'polity',
    gsPaper: 'GS II · Indian Polity',
    titleEn: 'Parliamentary Committee Reviews Cooperative Societies Governance & Federal Accountability',
    titleHi: 'संसदीय समिति ने सहकारी समितियों के प्रशासन और संघीय जवाबदेही की समीक्षा की',
    titleGu: 'સંસદીય સમિતિએ સહકારી મંડળીઓના શાસન અને સંઘીય જવાબદેહીની સમીક્ષા કરી',
    summaryEn:
      'Deliberations examined the interplay between Part IXB of the Constitution, state cooperative acts, and audit transparency in multi-state societies.',
    summaryHi:
      'विचार-विमर्श में संविधान के भाग IXB, राज्य सहकारी अधिनियमों और बहु-राज्य समितियों में लेखापरीक्षा पारदर्शिता की समीक्षा की गई।',
    summaryGu:
      'બંધારણના ભાગ IXB, રાજ્ય સહકારી કાયદાઓ અને બહુ-રાજ્ય મંડળીઓમાં ઓડિટ પારદર્શિતાની સમીક્ષા કરવામાં આવી.',
    sourceCitation: 'Sansad TV / Lok Sabha Secretariat Committee Bulletin',
  },
];

export const MAINS_EVALUATION_RUBRIC = [
  { key: 'relevance', label: 'Relevance to Directive & Demand', max: 10 },
  { key: 'accuracy', label: 'Conceptual & Constitutional Accuracy', max: 10 },
  { key: 'structure', label: 'Structure (Intro · Body · Conclusion)', max: 10 },
  { key: 'examples', label: 'Examples, Data & Case Studies', max: 10 },
  { key: 'balance', label: 'Balanced Multi-Dimensional Arguments', max: 10 },
  { key: 'clarity', label: 'Clarity, Flow & Word Limit Discipline', max: 10 },
];
