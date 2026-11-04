export const PROBLEMS = [
  {
    id: 'heart',
    icon: 'heart',
    label: { en: 'Heart attack / chest pain', hi: 'दिल का दौरा / सीने में दर्द' },
    brief: { en: 'Cardiology · ICU · oxygen', hi: 'कार्डियोलॉजी · ICU · ऑक्सीजन' },
    keywords: ['heart', 'chest', 'cardiac', 'dil', 'seena', 'सीना', 'दिल', 'छाती', 'दर्द', 'heart attack'],
    firstAid: {
      en: [
        'Call 112 or 108 now and say “chest pain, possible heart attack”.',
        'Make the person sit or lie down, keep them calm and loosen tight clothing.',
        'If conscious, not allergic and available, let them chew one 300 mg aspirin (or four 75 mg tablets).',
        'If they become unresponsive and stop breathing normally, start CPR: hard compressions at 100–120 per minute in the centre of the chest.',
        'Use an AED if one is nearby. Do not give food or water.',
      ],
      hi: [
        'तुरंत 112 या 108 पर कॉल करें और कहें “सीने में दर्द, दिल का दौरा हो सकता है”।',
        'मरीज़ को बैठाएं या लिटाएं, उन्हें शांत रखें और तंग कपड़े ढीले करें।',
        'अगर होश में हैं, एलर्जी नहीं है और उपलब्ध हो, तो एक 300mg एस्पिरिन (या 75mg की 4 गोलियां) चबाने दें।',
        'बेहोश हो जाएं और सामान्य सांस बंद हो जाए तो CPR शुरू करें — सीने के बीच 100–120 प्रति मिनट की दबाव।',
        'पास में AED हो तो इस्तेमाल करें। खाना या पानी न दें।',
      ],
    },
  },
  {
    id: 'breathing',
    icon: 'wind',
    label: { en: 'Breathing problem / low oxygen', hi: 'सांस की तकलीफ / ऑक्सीजन कम' },
    brief: { en: 'Pulmonology · oxygen · ICU', hi: 'पल्मोनोलॉजी · ऑक्सीजन · ICU' },
    keywords: ['breath', 'breathing', 'saans', 'sans', 'oxygen', 'घुटन', 'सांस', 'दम', 'ऑक्सीजन', 'asthma', 'दमा'],
    firstAid: {
      en: [
        'Call 112 or 108 immediately. Keep the person sitting upright — never force them to lie flat.',
        'Help them use their prescribed inhaler with a spacer, or their nebuliser.',
        'If home oxygen is prescribed, start it at the prescribed flow and make sure the mask fits.',
        'Open windows, loosen tight clothing and stay calm; panic worsens breathlessness.',
        'Blue lips, inability to speak, or drowsiness is critical — prepare for CPR if they stop breathing.',
      ],
      hi: [
        'तुरंत 112 या 108 पर कॉल करें। मरीज़ को सीधा बैठाएं — लिटाने की कोशिश न करें।',
        'उनके इनहेलर (स्पेसर के साथ) या नेबुलाइज़र इस्तेमाल करने में मदद करें।',
        'अगर घर पर ऑक्सीजन लिखी है, तो निर्धारित फ्लो पर शुरू करें और मास्क ठीक से लगाएं।',
        'खिड़कियां खोलें, तंग कपड़े ढीले करें और शांत रहें; घबराहट सांस की तकलीफ बढ़ाती है।',
        'होंठ नीले होना, बोल न पाना या सुस्ती गंभीर है — सांस रुके तो CPR के लिए तैयार रहें।',
      ],
    },
  },
  {
    id: 'accident',
    icon: 'accident',
    label: { en: 'Accident / injury / bleeding', hi: 'दुर्घटना / चोट / खून बहना' },
    brief: { en: 'Trauma · ortho · ICU · blood bank', hi: 'ट्रॉमा · ऑर्थो · ICU · ब्लड बैंक' },
    keywords: ['accident', 'injury', 'bleeding', 'blood', 'chot', 'durghatna', 'खून', 'चोट', 'दुर्घटना', 'हादसा', 'fracture', 'हड्डी'],
    firstAid: {
      en: [
        'Call 112 or 108. Switch off traffic and make the area safe before helping.',
        'Stop bleeding with firm pressure using a clean cloth. Do not pull out embedded objects.',
        'If there may be a head, neck or back injury, keep the person still and support the head.',
        'Keep them warm and reassured. Do not give food or water.',
        'For an amputated part: wrap it cleanly, seal it in a plastic bag and place the bag on ice — never directly on ice.',
      ],
      hi: [
        '112 या 108 पर कॉल करें। मदद से पहले ट्रैफिक रोकें और जगह सुरक्षित करें।',
        'साफ कपड़े से दबाव डालकर खून रोकें। घुसी हुई चीज़ को खींचें नहीं।',
        'सिर, गर्दन या पीठ की चोट हो सकती है तो मरीज़ को हिलाएं नहीं और सिर सहारा दें।',
        'उन्हें गर्म और आश्वस्त रखें। खाना या पानी न दें।',
        'कटा हुआ अंग: साफ कपड़े में लपेटें, प्लास्टिक बैग में सील करें और बैग को बर्फ पर रखें — सीधे बर्फ पर नहीं।',
      ],
    },
  },
  {
    id: 'stroke',
    icon: 'brain',
    label: { en: 'Stroke / paralysis', hi: 'स्ट्रोक / लकवा' },
    brief: { en: 'Neurology · ICU · imaging', hi: 'न्यूरोलॉजी · ICU · इमेजिंग' },
    keywords: ['stroke', 'paralysis', 'lakwa', 'falij', 'brain', 'स्ट्रोक', 'लकवा', 'फालिज', 'मस्तिष्क', 'बोलने', 'face'],
    firstAid: {
      en: [
        'Call 108 immediately. Note the exact time symptoms started — treatment decisions depend on it.',
        'Do the FAST check: Face drooping, Arm weakness, Speech difficulty, Time to call.',
        'Do not give food, water or aspirin — swallowing may be unsafe.',
        'If vomiting or unconscious, lie them on their side and keep the airway clear.',
        'Tell the hospital the symptom-start time so clot-busting treatment can be assessed.',
      ],
      hi: [
        'तुरंत 108 पर कॉल करें। लक्षण शुरू होने का सटीक समय नोट करें — इलाज इस पर निर्भर है।',
        'FAST जांचें: चेहरा लटकना, हाथ में कमज़ोरी, बोलने में दिक्कत, तुरंत कॉल करने का समय।',
        'खाना, पानी या एस्पिरिन न दें — निगलने में खतरा हो सकता है।',
        'उल्टी हो या बेहोश हों तो करवट लिटाएं और सांस की नली खुली रखें।',
        'अस्पताल को लक्षण शुरू होने का समय बताएं ताकि क्लॉट-बस्टिंग इलाज का आकलन हो सके।',
      ],
    },
  },
  {
    id: 'pregnancy',
    icon: 'baby',
    label: { en: 'Pregnancy / delivery', hi: 'गर्भावस्था / प्रसव' },
    brief: { en: 'Maternity · NICU · ICU', hi: 'मैटरनिटी · NICU · ICU' },
    keywords: ['pregnancy', 'pregnant', 'delivery', 'labour', 'labor', 'garbh', 'प्रेग्नेंट', 'प्रेगनेंसी', 'गर्भ', 'डिलीवरी', 'प्रसव', 'लेबर'],
    firstAid: {
      en: [
        'Call 108 and say how many weeks pregnant, whether there is bleeding and how far apart contractions are.',
        'Lie on your left side. Do not try to deliver at home.',
        'Note bleeding, water breaking and baby movements, and carry the hospital records.',
        'If the umbilical cord is visible, stay off your feet and keep the cord warm and wet; call 108 immediately.',
        'Do not eat or drink in case surgery is needed.',
      ],
      hi: [
        '108 पर कॉल करें, बताएं कितने हफ्ते का गर्भ है, खून बह रहा है या नहीं और संकुचन कितने अंतराल पर हैं।',
        'बाईं करवट लेटें। घर पर डिलीवरी कराने की कोशिश न करें।',
        'खून, पानी फटना और बच्चे की हलचल नोट करें और अस्पताल के रिकॉर्ड साथ रखें।',
        'अगर गर्भनाल दिख रही है, खड़े न हों, गर्भनाल को गर्म और गीला रखें; तुरंत 108 पर कॉल करें।',
        'सर्जरी की ज़रूरत पड़ सकती है, इसलिए कुछ खाएं-पिएं नहीं।',
      ],
    },
  },
  {
    id: 'burns',
    icon: 'flame',
    label: { en: 'Burns', hi: 'जलना' },
    brief: { en: 'Burns · ICU · plastic surgery', hi: 'बर्न्स · ICU · प्लास्टिक सर्जरी' },
    keywords: ['burn', 'burns', 'fire', 'jal', 'जल', 'आग', 'बर्न', 'जलन'],
    firstAid: {
      en: [
        'Call 108 for large, deep, facial or airway burns.',
        'Cool the burn with cool running water for about 20 minutes. Do not use ice.',
        'Remove jewellery and loose clothing, but leave anything stuck to the skin.',
        'Cover with a clean non-stick cloth. Never apply toothpaste, oil or turmeric.',
        'Do not burst blisters. Keep the person warm and keep burns elevated if possible.',
      ],
      hi: [
        'बड़े, गहरे, चेहरे या सांस की नली के जलने पर 108 पर कॉल करें।',
        'जले हिस्से को ठंडे बहते पानी में लगभग 20 मिनट ठंडा करें। बर्फ न लगाएं।',
        'गहने और ढीले कपड़े हटाएं, लेकिन त्वचा से चिपकी चीज़ न छुड़ाएं।',
        'साफ, नॉन-स्टिक कपड़े से ढकें। टूथपेस्ट, तेल या हल्दी न लगाएं।',
        'छाले न फोड़ें। मरीज़ को गर्म रखें और जले हिस्से को ऊपर रखें।',
      ],
    },
  },
  {
    id: 'fever',
    icon: 'thermometer',
    label: { en: 'Fever / infection', hi: 'बुखार / संक्रमण' },
    brief: { en: 'General medicine · oxygen', hi: 'जनरल मेडिसिन · ऑक्सीजन' },
    keywords: ['fever', 'infection', 'bukhar', 'बुखार', 'संक्रमण', 'इन्फेक्शन', 'temperature'],
    firstAid: {
      en: [
        'Call 112 if there is drowsiness, breathing difficulty, a stiff neck, a seizure or a baby under 3 months with fever.',
        'Give frequent fluids and sponge with lukewarm water. Do not use ice-cold water.',
        'Use paracetamol at the dose written on the pack or prescribed by a doctor.',
        'Watch temperature, urine output and alertness. Keep a record for the hospital.',
        'Never give aspirin to children or teenagers with fever.',
      ],
      hi: [
        'सुस्ती, सांस लेने में दिक्कत, गर्दन अकड़ना, दौरा या 3 महीने से छोटे बच्चे को बुखार हो तो 112 पर कॉल करें।',
        'बार-बार तरल दें और गुनगुने पानी से पोंछें। बर्फ जैसा ठंडा पानी न इस्तेमाल करें।',
        'पैक पर लिखी या डॉक्टर की बताई खुराक में पैरासिटामोल दें।',
        'तापमान, पेशाब और सतर्कता पर नज़र रखें। अस्पताल के लिए रिकॉर्ड रखें।',
        'बच्चों या किशोरों को बुखार में एस्पिरिन कभी न दें।',
      ],
    },
  },
  {
    id: 'poisoning',
    icon: 'flask',
    label: { en: 'Poisoning / snake bite', hi: 'ज़हर / सांप काटना' },
    brief: { en: 'ICU · dialysis · antivenom', hi: 'ICU · डायलिसिस · एंटीवेनम' },
    keywords: ['poison', 'snake', 'bite', 'zeher', 'jahar', 'saanp', 'जहर', 'ज़हर', 'सांप', 'साँप', 'काटा', 'विष'],
    firstAid: {
      en: [
        'Call 112 or 108 immediately and identify the poison or snake if it is safe to do so.',
        'Do not make the person vomit or drink anything unless the poison helpline advises it.',
        'Keep the container, label or a photo of the substance for the hospital.',
        'Snake bite: keep still, keep the bitten limb below heart level, and remove rings or tight items. Do not cut, suck or use a tourniquet.',
        'Go to a hospital with ICU and antivenom; do not delay for herbal remedies.',
      ],
      hi: [
        'तुरंत 112 या 108 पर कॉल करें और सुरक्षित हो तो ज़हर या सांप की पहचान करें।',
        'ज़हर हेल्पलाइन के न कहने पर उल्टी न कराएं और कुछ पिलाएं नहीं।',
        'बोतल, लेबल या उस चीज़ की फोटो अस्पताल के लिए साथ रखें।',
        'सांप काटे तो हिलें नहीं, काटे गए अंग को दिल से नीचे रखें और अंगूठी या तंग चीज़ें निकालें। चीरा, चूसना या टूर्निकेट न करें।',
        'ICU और एंटीवेनम वाले अस्पताल जाएं; देसी नुस्खों में देरी न करें।',
      ],
    },
  },
  {
    id: 'child',
    icon: 'child',
    label: { en: 'Child emergency', hi: 'बच्चे की इमरजेंसी' },
    brief: { en: 'Paediatrics · NICU · ICU', hi: 'बाल रोग · NICU · ICU' },
    keywords: ['child', 'baby', 'bachcha', 'bachche', 'kid', 'infant', 'बच्चा', 'बच्चे', 'शिशु', 'नवजात'],
    firstAid: {
      en: [
        'Call 108 or 112 for breathing trouble, blue lips, a seizure, a head injury or unresponsiveness.',
        'Keep the airway clear and do not shake the child. Keep them warm.',
        'If the child is unresponsive and not breathing, start CPR and follow the dispatcher’s guidance.',
        'For fever: fluids, lukewarm sponging and paracetamol as prescribed. Any fever in a newborn is urgent.',
        'Carry the child’s medicines and health records.',
      ],
      hi: [
        'सांस लेने में दिक्कत, नीले होंठ, दौरा, सिर की चोट या बेहोशी पर 108 या 112 पर कॉल करें।',
        'सांस की नली खुली रखें, बच्चे को हिलाएं नहीं। उन्हें गर्म रखें।',
        'बच्चा बेहोश है और सांस नहीं ले रहा तो CPR शुरू करें और डिस्पैचर के निर्देश मानें।',
        'बुखार में तरल, गुनगुने पानी से पोंछा और निर्धारित पैरासिटामोल। नवजात का बुखार तुरंत जांच का विषय है।',
        'बच्चे की दवाइयां और हेल्थ रिकॉर्ड साथ ले जाएं।',
      ],
    },
  },
  {
    id: 'other',
    icon: 'firstAid',
    label: { en: 'Other / describe it', hi: 'अन्य / बताएं' },
    brief: { en: 'General medicine · emergency', hi: 'जनरल मेडिसिन · इमरजेंसी' },
    keywords: [],
    firstAid: {
      en: [
        'If the situation is life-threatening, call 112 immediately.',
        'Keep the patient conscious, comfortable and warm. Do not leave them alone.',
        'Do not give food or water if they are unconscious or vomiting.',
        'Gather medicines, allergies, ID and insurance details for the hospital.',
        'Use Raahat to call the nearest emergency ward for guidance while an ambulance is on the way.',
      ],
      hi: [
        'स्थिति जानलेवा है तो तुरंत 112 पर कॉल करें।',
        'मरीज़ को होश में, आरामदायक और गर्म रखें। अकेला न छोड़ें।',
        'बेहोशी या उल्टी हो तो खाना-पानी न दें।',
        'अस्पताल के लिए दवाइयां, एलर्जी, पहचान और बीमा जानकारी जुटाएं।',
        'एम्बुलेंस आने तक मार्गदर्शन के लिए Raahat से नज़दीकी इमरजेंसी वार्ड को कॉल करें।',
      ],
    },
  },
];

export const PROBLEM_BY_ID = Object.fromEntries(PROBLEMS.map((problem) => [problem.id, problem]));

/** Lightweight keyword matcher used by voice input. */
export function matchProblemFromText(text) {
  if (!text) return null;
  const value = String(text).toLowerCase();
  let best = null;
  let bestScore = 0;

  for (const problem of PROBLEMS) {
    if (problem.id === 'other') continue;
    let score = 0;
    for (const keyword of problem.keywords) {
      if (value.includes(keyword.toLowerCase())) score += keyword.length;
    }
    if (score > bestScore) {
      bestScore = score;
      best = problem.id;
    }
  }
  return best;
}

export const PROBLEM_ICONS = {
  heart: 'heart',
  breathing: 'wind',
  accident: 'accident',
  stroke: 'brain',
  pregnancy: 'baby',
  burns: 'flame',
  fever: 'thermometer',
  poisoning: 'flask',
  child: 'child',
  other: 'firstAid',
};
