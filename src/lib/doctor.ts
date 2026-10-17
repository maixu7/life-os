// The app doctor: symptoms, common illnesses, home care, Japanese
// over-the-counter medicines and when to see a real doctor. It gives
// first-aid level guidance from a fixed list, not a diagnosis.

export type Area = "general" | "head" | "eent" | "chest" | "stomach" | "urinary" | "skin" | "body" | "mind" | "context";
export type Symptom = { id: string; label: string; ja: string; area: Area; red?: boolean };

export const AREAS: [Area, string][] = [
  ["general", "🌡️ Whole body"], ["head", "🤕 Head"], ["eent", "👃 Eyes, ears, nose, mouth"], ["chest", "🫁 Chest & breathing"],
  ["stomach", "🤢 Stomach"], ["urinary", "🚻 Pee & private parts"], ["skin", "🖐️ Skin"], ["body", "🦴 Muscles & joints"], ["mind", "🧠 Mind & sleep"], ["context", "📝 What happened"],
];

const S = (id: string, label: string, ja: string, area: Area, red = false): Symptom => ({ id, label, ja, area, red });
export const SYMPTOMS: Symptom[] = [
  S("fever", "Fever", "熱がある", "general"), S("chills", "Chills / shivering", "寒気がする", "general"), S("fatigue", "Tired / no energy", "だるい", "general"),
  S("bodyache", "Body aches", "体の節々が痛い", "general"), S("sweats", "Night sweats", "寝汗", "general"), S("weightloss", "Losing weight without trying", "体重が減った", "general"),
  S("noappetite", "No appetite", "食欲がない", "general"), S("dizzy", "Dizzy / spinning", "めまい", "general"), S("faint", "Fainted / nearly fainted", "気を失った", "general", true),
  S("thirsty", "Very thirsty, dry mouth, little pee", "のどが渇く・尿が少ない", "general"), S("glands", "Swollen lumps in neck", "首のリンパが腫れた", "general"), S("pale", "Pale, short of breath on stairs", "顔色が悪い", "general"),
  S("hot", "Very hot, stopped sweating", "体が熱く汗が出ない", "general", true),

  S("headache", "Headache", "頭痛", "head"), S("worsthead", "Sudden worst headache of life", "突然の激しい頭痛", "head", true), S("throbbing", "Throbbing one side of head", "片側がズキズキ", "head"),
  S("aura", "Flashing lights before headache", "目の前がチカチカ", "head"), S("lightsens", "Light or noise hurts", "光や音がつらい", "head"), S("stiffneck", "Stiff neck (can't touch chin to chest)", "首が硬く曲がらない", "head", true),
  S("confused", "Confused / very sleepy / can't wake up", "意識がおかしい", "head", true), S("headinjury", "Hit my head", "頭を打った", "head"),

  S("redeye", "Red eye", "目が赤い", "eent"), S("itchyeye", "Itchy watery eyes", "目がかゆい", "eent"), S("eyegoo", "Sticky eye discharge", "目やに", "eent"),
  S("dryeye", "Dry tired eyes", "目が乾く・疲れる", "eent"), S("blurry", "Sudden blurry or lost vision", "急に見えにくい", "eent", true), S("earache", "Ear pain", "耳が痛い", "eent"),
  S("earfull", "Blocked ear / hearing less", "耳が詰まる・聞こえにくい", "eent"), S("ringing", "Ringing in ears", "耳鳴り", "eent"), S("runnynose", "Runny nose", "鼻水", "eent"),
  S("stuffynose", "Blocked nose", "鼻づまり", "eent"), S("sneeze", "Sneezing", "くしゃみ", "eent"), S("facepain", "Pain behind cheeks / forehead", "頬や額が痛い", "eent"),
  S("yellownose", "Thick yellow-green snot", "黄色い鼻水", "eent"), S("sorethroat", "Sore throat", "のどが痛い", "eent"), S("hoarse", "Hoarse voice", "声がかれる", "eent"),
  S("swallow", "Hard / painful to swallow", "飲み込むと痛い", "eent"), S("toothache", "Toothache", "歯が痛い", "eent"), S("mouthsore", "Mouth ulcer", "口内炎", "eent"),
  S("lipsore", "Blisters on lip", "唇に水ぶくれ", "eent"), S("smell", "Lost smell or taste", "味やにおいがしない", "eent"), S("nosebleed", "Nosebleed", "鼻血", "eent"),
  S("lipswell", "Lips, tongue or throat swelling", "唇やのどが腫れる", "eent", true),

  S("cough", "Cough", "せき", "chest"), S("phlegm", "Cough with phlegm", "たん", "chest"), S("wheeze", "Wheezing", "ゼーゼーする", "chest"),
  S("breathless", "Hard to breathe at rest", "息苦しい", "chest", true), S("chestpain", "Chest pain or pressure", "胸が痛い・圧迫感", "chest", true), S("palpit", "Heart racing / skipping", "動悸", "chest"),
  S("nightcough", "Cough worse at night", "夜にせきが出る", "chest"),

  S("nausea", "Nausea", "吐き気", "stomach"), S("vomit", "Vomiting", "嘔吐", "stomach"), S("diarrhea", "Diarrhoea", "下痢", "stomach"),
  S("constip", "Constipation", "便秘", "stomach"), S("upperpain", "Upper stomach pain", "みぞおちが痛い", "stomach"), S("lowerpain", "Lower belly cramps", "下腹部が痛い", "stomach"),
  S("rightpain", "Pain moving to lower right belly", "右下腹部が痛い", "stomach", true), S("heartburn", "Heartburn / sour taste", "胸やけ", "stomach"), S("bloating", "Bloating / gas", "お腹が張る", "stomach"),
  S("bloodstool", "Blood in poo or black poo", "血便・黒い便", "stomach", true), S("bloodvomit", "Vomiting blood", "血を吐いた", "stomach", true), S("bottompain", "Pain or bleeding at bottom", "おしりが痛い・出血", "stomach"),
  S("motion", "Sick in car / bus / boat", "乗り物酔い", "stomach"), S("yellow", "Yellow skin or eyes", "皮膚や白目が黄色い", "stomach", true),

  S("burnpee", "Burning when peeing", "排尿時に痛い", "urinary"), S("oftenpee", "Peeing very often", "頻尿", "urinary"), S("bloodpee", "Blood in pee", "血尿", "urinary"),
  S("sidepain", "Pain in side / back by ribs", "わき腹・背中が痛い", "urinary"), S("periodpain", "Period pain", "生理痛", "urinary"), S("discharge", "Unusual discharge", "おりもの異常", "urinary"),
  S("itchgenital", "Itchy private parts", "陰部がかゆい", "urinary"),

  S("rash", "Rash", "発疹", "skin"), S("itch", "Itchy skin", "かゆい", "skin"), S("hives", "Raised itchy welts (hives)", "じんましん", "skin"),
  S("redswollen", "Red, hot, swollen skin area", "赤く腫れて熱い", "skin"), S("blisters", "Blisters", "水ぶくれ", "skin"), S("acne", "Pimples", "にきび", "skin"),
  S("dryskin", "Dry, cracked skin", "乾燥・ひび割れ", "skin"), S("footpeel", "Itchy peeling between toes", "足の指の間がかゆい", "skin"), S("bite", "Insect bite", "虫刺され", "skin"),
  S("burn", "Burn", "やけど", "skin"), S("cut", "Cut or scrape", "切り傷・すり傷", "skin"), S("sunburn", "Sunburn", "日焼け", "skin"),
  S("bandrash", "Painful band of blisters on one side", "片側の帯状の水ぶくれ", "skin"), S("spots", "Itchy spots all over (chickenpox-like)", "全身の水ぶくれ", "skin"),

  S("backpain", "Lower back pain", "腰痛", "body"), S("neckpain", "Neck / shoulder stiffness", "肩こり・首の痛み", "body"), S("jointpain", "Joint pain", "関節痛", "body"),
  S("jointswell", "Hot swollen joint", "関節が腫れて熱い", "body"), S("cramp", "Muscle cramp", "こむら返り", "body"), S("sprain", "Twisted ankle / wrist", "ねんざ", "body"),
  S("sorework", "Sore muscles after exercise", "筋肉痛", "body"), S("numb", "Numb or tingling hands", "手のしびれ", "body"), S("weakside", "Sudden weakness one side / face droop / slurred speech", "片側のまひ・ろれつ", "body", true),
  S("legswell", "One leg swollen and painful", "片足が腫れて痛い", "body", true), S("bonepain", "Can't move or put weight on it", "動かせない・体重をかけられない", "body"),

  S("insomnia", "Can't sleep", "眠れない", "mind"), S("anxious", "Anxious / panicky", "不安", "mind"), S("lowmood", "Low mood for 2+ weeks", "気分が落ち込む", "mind"),
  S("stress", "Stressed / overwhelmed", "ストレス", "mind"), S("sleepy", "Very sleepy in the day", "日中眠い", "mind"), S("selfharm", "Thoughts of hurting myself", "死にたい気持ち", "mind", true),
  S("poorfocus", "Can't concentrate", "集中できない", "mind"),

  S("badfood", "Ate something suspicious", "変なものを食べた", "context"), S("alcohol", "Drank alcohol last night", "お酒を飲んだ", "context"), S("screen", "Long hours on screens", "画面を長時間見た", "context"),
  S("injury", "Fell / hurt it", "けがをした", "context"), S("pollen", "Pollen season / dust", "花粉の季節", "context"), S("sickcontact", "Someone near me is sick", "周りに病人がいる", "context"),
  S("heatexp", "Was out in the heat", "暑い所にいた", "context"), S("newfood", "Ate a new food / took a new medicine", "新しい食べ物・薬", "context"), S("sitting", "Sit for long hours", "長時間座っている", "context"),
  S("travel", "Recent travel abroad", "海外旅行", "context"),
];
export const symptom = (id: string) => SYMPTOMS.find((s) => s.id === id);

// Japanese over-the-counter medicines. Class: 第1類 needs a pharmacist on duty.
export type Med = { name: string; generic: string; use: string; caution: string; cls?: string };
const M = (name: string, generic: string, use: string, caution: string, cls?: string): Med => ({ name, generic, use, caution, cls });
export const MEDS: Record<string, Med> = {
  tylenol: M("Tylenol A (タイレノールA)", "acetaminophen (paracetamol)", "Fever, headache, pain. Gentle on the stomach.", "Max 3 doses a day, 4 h apart. Don't take with other cold medicines that also contain acetaminophen. Avoid with heavy drinking.", "第2類"),
  calonal: M("Calonal A (カロナールA)", "acetaminophen", "Fever and pain; same medicine doctors prescribe.", "Same as Tylenol: don't double up with cold medicines.", "第2類"),
  eve: M("EVE A (イブA錠)", "ibuprofen", "Headache, period pain, toothache, fever.", "Take after food. Not with stomach ulcers, asthma from painkillers, late pregnancy, or kidney problems.", "指定第2類"),
  loxonin: M("Loxonin S (ロキソニンS)", "loxoprofen", "Strong pain: headache, toothache, period pain, back pain.", "Take after food. Stomach ulcer, asthma, pregnancy: ask first. Buy where a pharmacist is on duty.", "第1類"),
  bufferin: M("Bufferin A (バファリンA)", "aspirin", "Headache, fever, pain.", "Not for under 15s (Reye's syndrome), stomach ulcers, asthma.", "指定第2類"),
  pabron: M("Pabron Gold A (パブロンゴールドA)", "multi-symptom cold medicine", "Fever, runny nose, cough and sore throat together.", "Makes you sleepy. Don't drive. Don't add another painkiller with acetaminophen.", "指定第2類"),
  lulu: M("Lulu Attack EX (ルルアタックEX)", "cold medicine with ibuprofen", "Strong sore throat with cold.", "Sleepy. Same cautions as ibuprofen.", "指定第2類"),
  kakkonto: M("Kakkonto (葛根湯)", "kampo herbal", "Very early cold: chills, stiff neck, no sweating yet.", "Best on day 1. Contains ephedra: careful with heart disease, high blood pressure.", "第2類"),
  perack: M("Perack T (ペラックT錠)", "tranexamic acid", "Sore, swollen throat.", "Not with a history of blood clots.", "第3類"),
  ryukakusan: M("Ryukakusan (龍角散ダイレクト)", "herbal powder", "Throat pain, cough, phlegm.", "Safe and simple.", "第3類"),
  nodonuru: M("Nodonuru spray (のどぬ～るスプレー)", "iodine throat spray", "Sore throat germs.", "Not with iodine allergy or thyroid disease.", "第3類"),
  bron: M("Shin Bron Eki Ace (新ブロン液エース)", "cough syrup", "Dry or wet cough.", "Contains codeine-type ingredient: not for under 12s, don't overuse.", "指定第2類"),
  allegra: M("Allegra FX (アレグラFX)", "fexofenadine", "Hay fever, sneezing, runny nose, itchy eyes.", "Not sleepy. Take on an empty stomach for best effect.", "第2類"),
  alesion: M("Alesion 20 (アレジオン20)", "epinastine", "Hay fever and hives, once a day.", "Slightly sleepy for some people.", "第2類"),
  claritin: M("Claritin EX (クラリチンEX)", "loratadine", "Hay fever, once a day.", "Not sleepy.", "第1類"),
  nasal: M("Nazal spray (ナザールスプレー)", "decongestant nose spray", "Blocked nose.", "Max 1 week, or the blockage comes back worse.", "第2類"),
  ohta: M("Ohta's Isan (太田胃散)", "antacid", "Heartburn, overeating, indigestion.", "Avoid with kidney problems.", "第2類"),
  gaster: M("Gaster 10 (ガスター10)", "famotidine", "Heartburn and stomach acid pain.", "Max 3 days without seeing a doctor. Buy where a pharmacist is on duty.", "第1類"),
  cabbagin: M("Cabbagin Kowa α (キャベジンコーワα)", "stomach medicine", "Heavy stomach, nausea after food.", "Gentle.", "第2類"),
  seirogan: M("Seirogan (正露丸)", "wood creosote", "Diarrhoea from bad food or nerves.", "Not if there's high fever or blood in poo: those need a doctor.", "第2類"),
  stoppa: M("Stoppa (ストッパ下痢止めEX)", "anti-diarrhoea, no water needed", "Sudden diarrhoea when you must go out.", "Not for food poisoning with fever or blood: let it come out.", "第2類"),
  biofermin: M("Shin-Biofermin S (新ビオフェルミンS)", "probiotic", "Upset gut, mild diarrhoea or constipation.", "Very safe.", "指定医薬部外品"),
  os1: M("OS-1 (経口補水液 OS-1)", "oral rehydration solution", "Dehydration from diarrhoea, vomiting, heat.", "Sip slowly. Sold at drugstores and some convenience stores.", undefined),
  magmi: M("3A Magnesia (3Aマグネシア)", "magnesium oxide", "Constipation, gentle.", "Not with kidney disease.", "第3類"),
  colac: M("Colac (コーラック)", "stimulant laxative", "Stubborn constipation.", "Short term only; can cramp.", "第2類"),
  aneron: M("Aneron Niscap (アネロン「ニスキャップ」)", "motion sickness", "Car, bus, boat sickness. Take 30 min before.", "Sleepy. Don't drive.", "指定第2類"),
  travelmin: M("Travelmin (トラベルミン)", "motion sickness", "Motion sickness.", "Sleepy.", "第2類"),
  salonpas: M("Salonpas (サロンパス)", "pain patch", "Muscle pain, stiff shoulders.", "Not on broken skin.", "第3類"),
  voltaren: M("Voltaren EX tape (ボルタレンEXテープ)", "diclofenac patch", "Back pain, joint and muscle pain.", "Not in pregnancy or with painkiller asthma.", "第2類"),
  loxtape: M("Loxonin S tape (ロキソニンSテープ)", "loxoprofen patch", "Strong muscle and joint pain.", "Not in pregnancy.", "第2類"),
  muhi: M("Muhi Alpha EX (ムヒアルファEX)", "antihistamine + mild steroid cream", "Insect bites, itchy rash.", "Not on face for long, not on infected skin.", "指定第2類"),
  eurax: M("Eurax (オイラックスA)", "anti-itch cream", "Itchy skin, eczema.", "Short term.", "指定第2類"),
  fulcort: M("Fulcort f (フルコートf)", "steroid cream (strong)", "Red, itchy eczema or rash.", "Max 1 week. Not on face, fungus or infected skin.", "指定第2類"),
  pairacne: M("Pair Acne Cream W (ペアアクネクリームW)", "acne cream", "Red pimples.", "Not on broken skin.", "第2類"),
  lamisil: M("Lamisil Plus (ラミシールプラス)", "terbinafine", "Athlete's foot (水虫).", "Use for 4 weeks even after it looks better.", "指定第2類"),
  oronine: M("Oronine H (オロナインH軟膏)", "antiseptic ointment", "Small cuts, scrapes, minor burns, pimples.", "Not for deep wounds.", "第2類"),
  kizupower: M("Band-Aid Kizu Power Pad (キズパワーパッド)", "hydrocolloid dressing", "Clean small cuts and scrapes heal faster.", "Wash the wound first. Not for infected wounds.", undefined),
  actibia: M("Actibia (アクチビア軟膏)", "acyclovir cream", "Cold sores that keep coming back.", "Only if a doctor diagnosed it before.", "第1類"),
  ulcerpatch: M("Taisho mouth ulcer patch (口内炎パッチ大正A)", "steroid patch", "Mouth ulcers.", "Not if it lasts over 2 weeks: see a dentist.", "指定第2類"),
  santear: M("Soft Santear (ソフトサンティア)", "artificial tears", "Dry, tired eyes.", "Very safe, OK with contact lenses.", "第3類"),
  algard: M("Algard eye drops (アルガード)", "anti-allergy eye drops", "Itchy hay fever eyes.", "Not with soft contacts in.", "第2類"),
  sante: M("Sante antibacterial eye drops (サンテ抗菌新目薬)", "sulfa eye drops", "Mild bacterial eye infection (sticky eye).", "If no better in 3 days, see an eye doctor.", "第2類"),
  drewell: M("Drewell (ドリエル)", "diphenhydramine sleep aid", "Occasional sleeplessness.", "Short term only. Not for long-term insomnia.", "指定第2類"),
  borraginol: M("Borraginol A (ボラギノールA)", "haemorrhoid ointment", "Piles pain and bleeding.", "If bleeding continues, see a doctor.", "指定第2類"),
  faichi: M("Faichi (ファイチ)", "iron tablets", "Iron-deficiency anaemia.", "Can make poo black (normal). Confirm anaemia with a blood test.", "第2類"),
  bokoren: M("Bokoren (ボーコレン)", "kampo for bladder", "Mild bladder discomfort.", "A real infection needs antibiotics from a doctor.", "第2類"),
  candida: M("Femineena vaginal tablets (フェミニーナ腟カンジダ錠)", "miconazole", "Repeat yeast infection only.", "Only if a doctor diagnosed it before.", "第1類"),
  vitb: M("Alinamin EX Plus (アリナミンEXプラス)", "vitamin B1/B6/B12", "Tired eyes, stiff shoulders, nerve tingling.", "Safe.", "第3類"),
  aftercare: M("Calamine / cooling gel (カーマインローション)", "soothing lotion", "Sunburn, heat rash.", "Safe.", "第3類"),
};

export type Severity = "mild" | "moderate" | "serious" | "emergency";
export type Condition = {
  name: string; ja: string; area: Area; severity: Severity; contagious?: boolean;
  syms: [string, number][]; // symptom id and weight (3 = key sign)
  cause: string; home: string[]; meds: string[]; doctor: string; dept: string; days?: number; info?: string;
};

const C = (name: string, ja: string, area: Area, severity: Severity, syms: string, cause: string, home: string[], meds: string[], doctor: string, dept: string, days?: number, info?: string, contagious?: boolean): Condition => ({
  name, ja, area, severity, cause, home, meds, doctor, dept, days, info, contagious,
  syms: syms.split(" ").map((x) => { const [id, w] = x.split(":"); return [id, Number(w ?? 1)]; }),
});
const REST = "Rest and sleep a lot", FLUID = "Drink plenty: water, tea, OS-1 or Pocari", WARM = "Keep warm and humid (wet towel in the room)";

export const CONDITIONS: Condition[] = [
  // Infections and general
  C("Common cold", "風邪 (かぜ)", "eent", "mild", "runnynose:3 sorethroat:2 sneeze:2 stuffynose:2 cough:2 fever:1 fatigue:1 headache:1 sickcontact:1", "A virus in the nose and throat.", [REST, FLUID, WARM, "Gargle with water or salt water", "Honey in warm water for cough (not for babies)"], ["pabron", "kakkonto", "tylenol", "ryukakusan"], "If fever lasts more than 3 days, or you're getting worse after day 5.", "内科 (internal medicine)", 7, "Antibiotics don't help a cold. It usually goes in 7 to 10 days.", true),
  C("Influenza", "インフルエンザ", "general", "moderate", "fever:3 chills:2 bodyache:3 fatigue:2 headache:2 cough:2 sorethroat:1 sickcontact:1", "Flu virus, mostly in winter. Starts suddenly with high fever.", [REST, FLUID, "Stay home until 2 days after the fever goes (Japan rule: 5 days from start + 2 days fever-free)", "Wear a mask at home"], ["tylenol", "calonal"], "Within 48 h of the fever starting, a clinic can test and give anti-flu medicine. Go now if breathing is hard.", "内科 (internal medicine)", 7, "Use acetaminophen, not aspirin or ibuprofen, for flu fever, especially for children.", true),
  C("COVID-19", "新型コロナウイルス感染症", "general", "moderate", "fever:2 cough:2 sorethroat:2 smell:3 fatigue:2 bodyache:1 headache:1 sickcontact:1", "Coronavirus infection.", [REST, FLUID, "Use a home antigen test (drugstores sell them)", "Stay home about 5 days and wear a mask"], ["tylenol", "calonal"], "Go if breathing is hard, chest hurts, or you are older / have a long-term illness.", "内科 or 発熱外来 (fever clinic)", 7, undefined, true),
  C("Strep throat / tonsillitis", "扁桃炎", "eent", "moderate", "sorethroat:3 swallow:3 fever:2 glands:2 headache:1", "Bacteria or virus infecting the tonsils.", [FLUID, "Soft cold food (yogurt, jelly)", "Salt-water gargles"], ["tylenol", "perack", "nodonuru"], "See a doctor if fever + painful swallowing and no cough: it may need antibiotics. Go now if you can't open your mouth or swallow saliva.", "耳鼻咽喉科 (ENT)", 7, undefined, true),
  C("Sinusitis", "副鼻腔炎 (ちくのう)", "eent", "mild", "facepain:3 yellownose:3 stuffynose:2 headache:1 smell:1", "Blocked sinuses after a cold or allergy.", ["Steam inhalation (bowl of hot water, towel over head)", "Rinse nose with saline (ハナノア)", FLUID], ["tylenol", "nasal"], "If it lasts over 10 days, or high fever, or swelling round the eye.", "耳鼻咽喉科 (ENT)", 10),
  C("Ear infection", "中耳炎", "eent", "moderate", "earache:3 earfull:2 fever:2 runnynose:1", "Germs behind the eardrum, often after a cold.", ["Warm cloth over the ear", "Sleep with the head raised"], ["tylenol", "eve"], "See an ENT if pain lasts over 2 days, there's discharge, or high fever.", "耳鼻咽喉科 (ENT)", 5),
  C("Swimmer's ear", "外耳炎", "eent", "mild", "earache:3 itch:1 earfull:1", "Infection of the ear canal, often from water or ear picking (耳かき).", ["Keep the ear dry", "Stop using ear picks"], ["tylenol"], "If pain is strong or there's discharge: ear drops from an ENT.", "耳鼻咽喉科 (ENT)", 7),
  C("Earwax blockage", "耳垢栓塞", "eent", "mild", "earfull:3 ringing:1", "Wax pushed deep, often by cotton buds.", ["Don't push cotton buds in", "A few drops of olive oil for 3 days"], [], "ENT can remove it in a minute.", "耳鼻咽喉科 (ENT)", 7),
  C("Sudden hearing loss", "突発性難聴", "eent", "serious", "earfull:3 ringing:2 dizzy:1", "Sudden inner-ear problem. Unknown cause.", ["Don't wait it out"], [], "See an ENT within 48 hours: treatment works best early.", "耳鼻咽喉科 (ENT)", 1),
  C("Hay fever", "花粉症", "eent", "mild", "sneeze:3 runnynose:3 itchyeye:3 stuffynose:2 pollen:3", "Allergy to cedar (スギ) or cypress (ヒノキ) pollen, Feb to May.", ["Mask and glasses outside", "Shower and change clothes when you come home", "Don't dry laundry outside in the season"], ["allegra", "alesion", "claritin", "algard"], "If medicines from the drugstore don't help: an ENT can give stronger ones or immunotherapy.", "耳鼻咽喉科 (ENT)", 30),
  C("Allergic rhinitis (dust)", "アレルギー性鼻炎", "eent", "mild", "sneeze:3 runnynose:2 stuffynose:2 itchyeye:1", "Allergy to house dust, mites or pets.", ["Vacuum and wash sheets in hot water weekly", "Air purifier in the bedroom"], ["allegra", "claritin"], "If it ruins sleep or causes wheeze.", "耳鼻咽喉科 (ENT)", 30),
  C("Pink eye (bacterial)", "細菌性結膜炎", "eent", "mild", "redeye:3 eyegoo:3 itchyeye:1", "Bacteria in the eye.", ["Wash hands, don't share towels", "Wipe discharge with clean wet cotton"], ["sante"], "If no better in 3 days, eye pain, or vision changes.", "眼科 (eye clinic)", 5, undefined, true),
  C("Viral conjunctivitis", "流行性角結膜炎 (はやり目)", "eent", "moderate", "redeye:3 eyegoo:2 sorethroat:1 sickcontact:1", "Adenovirus. Very contagious.", ["Separate towels", "Don't go to school / work until a doctor says OK"], ["santear"], "See an eye doctor to confirm.", "眼科 (eye clinic)", 14, undefined, true),
  C("Allergic eyes", "アレルギー性結膜炎", "eent", "mild", "itchyeye:3 redeye:2 pollen:2 sneeze:1", "Pollen, dust or pets.", ["Cold compress", "Don't rub"], ["algard", "allegra"], "If it's one eye only and painful.", "眼科 (eye clinic)", 14),
  C("Eye strain / dry eye", "眼精疲労・ドライアイ", "eent", "mild", "dryeye:3 screen:3 headache:1 blurry:0 neckpain:1", "Long screen time, less blinking.", ["20-20-20 rule: every 20 min look 20 feet away for 20 s", "Warm towel on the eyes", "Screen at arm's length, slightly below eye level"], ["santear", "vitb"], "If vision stays blurry or eyes hurt.", "眼科 (eye clinic)", 7),
  C("Stye", "ものもらい (麦粒腫)", "eent", "mild", "redeye:2 eyegoo:1", "Blocked infected gland on the eyelid.", ["Warm compress 10 min, 3 times a day", "Don't squeeze it"], ["sante"], "If it spreads or lasts over a week.", "眼科 (eye clinic)", 7),
  C("Mouth ulcer", "口内炎", "eent", "mild", "mouthsore:3 stress:1", "Small injury, stress, lack of sleep or vitamin B.", ["Avoid spicy and sour food", "Vitamin B2/B6", "Sleep well"], ["ulcerpatch", "vitb"], "If it lasts over 2 weeks or keeps coming back.", "歯科 or 口腔外科 (dentist)", 10),
  C("Cold sore", "口唇ヘルペス", "eent", "mild", "lipsore:3 stress:1 fatigue:1", "Herpes virus that wakes up when you're tired.", ["Don't touch or kiss", "Rest"], ["actibia"], "First time: see a dermatologist for antiviral medicine.", "皮膚科 (dermatology)", 10, undefined, true),
  C("Toothache / cavity", "虫歯", "eent", "moderate", "toothache:3", "Tooth decay or gum infection.", ["Rinse with warm salt water", "Avoid very hot, cold or sweet food"], ["loxonin", "eve"], "See a dentist soon. Go now if your face is swelling.", "歯科 (dentist)", 3),
  C("Nosebleed", "鼻出血", "eent", "mild", "nosebleed:3", "Dry air, picking, blowing hard.", ["Sit, lean FORWARD, pinch the soft part of the nose 10 min", "Don't tip your head back", "Cold cloth on the nose"], [], "If it doesn't stop after 20 min, or happens often.", "耳鼻咽喉科 (ENT)", 1),
  C("Glandular fever", "伝染性単核球症", "general", "moderate", "fatigue:3 sorethroat:2 glands:3 fever:2", "Epstein-Barr virus (the 'kissing disease').", [REST, FLUID, "No contact sports for a month (spleen)"], ["tylenol"], "See a doctor for a blood test.", "内科 (internal medicine)", 21, undefined, true),

  // Chest
  C("Acute bronchitis", "急性気管支炎", "chest", "mild", "cough:3 phlegm:3 fatigue:1 fever:1 wheeze:1", "Usually a virus after a cold.", [REST, FLUID, "Humid room", "Honey and ginger tea"], ["bron", "ryukakusan"], "If cough lasts over 3 weeks, high fever, or breathless.", "内科 or 呼吸器内科", 21),
  C("Pneumonia", "肺炎", "chest", "serious", "fever:3 cough:3 phlegm:2 breathless:3 chestpain:2 chills:2 fatigue:1", "Infection in the lungs.", ["Don't wait at home"], [], "See a doctor today. Call 119 if breathing is very hard or lips are blue.", "内科 / 呼吸器内科", 1),
  C("Asthma attack", "ぜんそく発作", "chest", "serious", "wheeze:3 breathless:3 nightcough:2 cough:2", "Airways tighten (allergy, cold air, exercise, infection).", ["Sit upright, slow breathing", "Use your inhaler if you have one"], [], "See a doctor for an inhaler. Call 119 if you can't speak in full sentences.", "呼吸器内科", 1),
  C("Cough variant asthma", "咳喘息", "chest", "moderate", "nightcough:3 cough:3 wheeze:1", "Dry cough lasting weeks after a cold, worse at night.", ["Avoid cold air and smoke", "Mask at night"], [], "Cough over 3 weeks needs a doctor: it responds to inhalers, not cough syrup.", "呼吸器内科", 21),
  C("Acid reflux (GERD)", "逆流性食道炎", "stomach", "mild", "heartburn:3 nightcough:1 hoarse:1 upperpain:1 chestpain:1", "Stomach acid coming up.", ["Don't lie down for 3 h after eating", "Smaller meals, less fat, coffee, alcohol", "Raise the head of the bed"], ["gaster", "ohta"], "If you need medicine for over 2 weeks, have trouble swallowing or lose weight.", "消化器内科 (gastroenterology)", 14),
  C("Panic attack", "パニック発作", "mind", "moderate", "anxious:3 palpit:3 breathless:2 chestpain:1 dizzy:2 numb:1", "Sudden rush of fear. Not dangerous but feels like it.", ["Breathe in 4 s, hold 4 s, out 6 s", "Name 5 things you can see", "It passes in about 10 to 20 minutes"], [], "If attacks repeat: a 心療内科 can help a lot. First time with chest pain: get checked to be safe.", "心療内科 (psychosomatic medicine)", 1),
  C("Heart attack warning", "心筋梗塞の疑い", "chest", "emergency", "chestpain:3 breathless:2 sweats:1 nausea:1 numb:1", "Blocked heart artery.", ["Call 119 now", "Sit down, loosen clothes", "Chew one aspirin (Bufferin A) if not allergic"], [], "EMERGENCY: call 119 now.", "救急 (emergency)", 0),
  C("Palpitations (harmless)", "動悸", "chest", "mild", "palpit:3 stress:1 insomnia:1", "Caffeine, energy drinks, stress, little sleep.", ["Cut coffee and energy drinks", "Sleep more", "Slow breathing"], [], "See a doctor if it comes with chest pain, fainting, or lasts long.", "循環器内科 (cardiology)", 3),

  // Stomach
  C("Food poisoning / stomach flu", "食中毒・胃腸炎", "stomach", "moderate", "vomit:3 diarrhea:3 nausea:2 lowerpain:2 fever:1 badfood:3 sickcontact:1", "Bacteria (from undercooked food, raw chicken, old rice) or norovirus.", ["Stop solid food for a few hours", "Sip OS-1 every 5 to 10 min", "Then rice porridge (おかゆ), udon, banana", "Wash hands well: it spreads"], ["os1", "biofermin"], "See a doctor if you can't keep fluids down, have blood in poo, high fever, or no pee for 8 hours.", "内科 / 消化器内科", 3, "Don't take strong diarrhoea stoppers with fever or blood: the body needs to clear the germs.", true),
  C("Indigestion / overeating", "消化不良・食べ過ぎ", "stomach", "mild", "upperpain:2 bloating:3 nausea:1 heartburn:1", "Big, fatty or spicy meal.", ["Light food next meal", "Walk 10 minutes", "Warm water"], ["ohta", "cabbagin"], "If it keeps happening.", "消化器内科", 1),
  C("Gastritis / stomach ulcer", "胃炎・胃潰瘍", "stomach", "moderate", "upperpain:3 nausea:2 heartburn:2 noappetite:1 stress:1", "Stomach lining irritated: stress, painkillers, alcohol, H. pylori germ.", ["Stop ibuprofen/aspirin/loxoprofen", "No alcohol, coffee or spicy food", "Small regular meals"], ["gaster", "ohta"], "If pain lasts over a week, or black poo / vomiting blood (emergency).", "消化器内科 (gastroenterology)", 7),
  C("Irritable bowel (IBS)", "過敏性腸症候群", "stomach", "mild", "lowerpain:2 diarrhea:2 constip:2 bloating:2 stress:2", "Gut is extra sensitive, often with stress.", ["Regular meals and sleep", "Less fatty food, alcohol, caffeine", "Probiotics"], ["biofermin"], "If you lose weight, see blood, or it starts after age 50.", "消化器内科", 30),
  C("Constipation", "便秘", "stomach", "mild", "constip:3 bloating:2 lowerpain:1 sitting:1", "Little water, fibre or movement.", ["2 litres of water a day", "Natto, fruit, vegetables, oats", "Walk every day", "Go to the toilet at the same time each morning"], ["magmi", "biofermin", "colac"], "If it lasts over 2 weeks, with blood, or severe pain.", "消化器内科", 7),
  C("Appendicitis", "虫垂炎 (盲腸)", "stomach", "emergency", "rightpain:3 lowerpain:1 nausea:2 fever:2 noappetite:2 vomit:1", "Infected appendix.", ["Don't eat or take laxatives"], [], "Go to a hospital today (emergency). Call 119 if the pain is severe.", "外科 / 救急", 0),
  C("Haemorrhoids", "痔 (じ)", "stomach", "mild", "bottompain:3 constip:2 sitting:1", "Swollen veins at the bottom from straining or sitting.", ["Don't strain; fix constipation", "Warm bath (sitz bath)", "Don't sit for hours"], ["borraginol", "magmi"], "If bleeding is heavy or doesn't stop.", "肛門科 / 外科", 7),
  C("Motion sickness", "乗り物酔い", "stomach", "mild", "motion:3 nausea:3 dizzy:2 vomit:1", "Eyes and inner ear disagree about movement.", ["Look at the horizon", "Sit in front, window open", "Don't read on the bus"], ["aneron", "travelmin"], "Not needed.", "", 1),
  C("Hangover", "二日酔い", "stomach", "mild", "alcohol:3 headache:2 nausea:2 thirsty:2 fatigue:1", "Dehydration and alcohol breakdown products.", [FLUID, "OS-1 or Pocari", "Light food: miso soup, rice porridge", "Sleep"], ["os1", "tylenol"], "If vomiting blood or very confused.", "", 1, "Skip acetaminophen if you drank a lot; use ibuprofen after food instead, or just rest."),
  C("Gallstones", "胆石症", "stomach", "moderate", "upperpain:3 nausea:2 vomit:1 yellow:2", "Stones in the gallbladder, pain after fatty meals.", ["Avoid fatty food"], [], "See a doctor for an ultrasound. Go to ER if there's fever or yellow skin.", "消化器内科", 1),

  // Urinary
  C("Bladder infection (UTI)", "膀胱炎", "urinary", "moderate", "burnpee:3 oftenpee:3 lowerpain:1 bloodpee:1", "Bacteria in the bladder; common in women.", [FLUID, "Don't hold your pee", "Wipe front to back"], ["bokoren"], "See a doctor for antibiotics. Go now if fever or back/side pain (kidney).", "泌尿器科 (urology) / 内科", 3),
  C("Kidney stone", "尿路結石", "urinary", "serious", "sidepain:3 bloodpee:2 nausea:2 vomit:1", "Crystal stone moving down the tube.", [FLUID], ["loxonin"], "See a urologist today; ER if pain is unbearable or with fever.", "泌尿器科 (urology)", 1),
  C("Period pain", "生理痛 (月経痛)", "urinary", "mild", "periodpain:3 lowerpain:2 backpain:1 headache:1 nausea:1", "Uterus contractions (prostaglandins).", ["Warm pad (カイロ) on the belly", "Gentle walk or stretch", "Warm drinks"], ["eve", "loxonin"], "If pain stops you living normally (could be endometriosis), or very heavy bleeding.", "婦人科 (gynaecology)", 3),
  C("Yeast infection", "腟カンジダ", "urinary", "mild", "itchgenital:3 discharge:3", "Yeast overgrowth (after antibiotics, stress).", ["Cotton underwear", "Avoid scented soaps"], ["candida"], "First time: see a gynaecologist.", "婦人科 (gynaecology)", 7),
  C("STI check needed", "性感染症の疑い", "urinary", "moderate", "discharge:3 burnpee:2 itchgenital:2 rash:1", "Chlamydia, gonorrhoea and others.", ["Avoid sex until checked", "Tell your partner"], [], "See a doctor; tests are quick and treatable.", "泌尿器科 / 婦人科 / 性病科", 3),

  // Skin
  C("Insect bite", "虫刺され", "skin", "mild", "bite:3 itch:2 redswollen:1", "Mosquito, mite (ダニ), flea.", ["Wash with soap", "Cold pack", "Don't scratch"], ["muhi"], "Go now if lips/throat swell or breathing changes. See a doctor if it grows red and hot.", "皮膚科 (dermatology)", 3),
  C("Hives", "じんましん", "skin", "mild", "hives:3 itch:3 newfood:2 stress:1", "Allergy (food, medicine) or stress, often no clear cause.", ["Cool the skin", "Avoid hot baths and alcohol"], ["alesion", "allegra"], "EMERGENCY (119) if lips, tongue or throat swell or breathing is hard.", "皮膚科 (dermatology)", 3),
  C("Anaphylaxis", "アナフィラキシー", "skin", "emergency", "lipswell:3 hives:2 breathless:3 newfood:2 vomit:1 dizzy:1", "Severe allergic reaction.", ["Call 119 now", "Use EpiPen if you have one", "Lie down with legs raised"], [], "EMERGENCY: call 119 now.", "救急 (emergency)", 0),
  C("Eczema / contact rash", "湿疹・かぶれ", "skin", "mild", "rash:3 itch:3 dryskin:2 newfood:1", "Irritation or allergy (soap, metal, plants, sweat).", ["Find and avoid the trigger", "Moisturise twice a day", "Lukewarm showers"], ["fulcort", "eurax"], "If it spreads, oozes, or lasts over 2 weeks.", "皮膚科 (dermatology)", 14),
  C("Cellulitis", "蜂窩織炎", "skin", "serious", "redswollen:3 fever:2 cut:1 bite:1", "Bacteria under the skin.", ["Draw a line round the red edge to see if it spreads"], [], "See a doctor today for antibiotics.", "皮膚科 / 内科", 1),
  C("Acne", "にきび", "skin", "mild", "acne:3 stress:1", "Blocked pores and bacteria; hormones, sleep, stress.", ["Wash face twice a day, gently", "Don't squeeze", "Change pillowcase often", "Sleep well"], ["pairacne", "vitb"], "If painful lumps or scars: dermatologists have strong treatments.", "皮膚科 (dermatology)", 30),
  C("Athlete's foot", "水虫", "skin", "mild", "footpeel:3 itch:2", "Fungus that loves warm wet shoes.", ["Dry between toes", "Change socks daily", "Rotate shoes"], ["lamisil"], "If it's in the toenails or doesn't clear in 4 weeks.", "皮膚科 (dermatology)", 28, undefined, true),
  C("Minor burn", "やけど (軽度)", "skin", "mild", "burn:3 blisters:1", "Heat injury.", ["Cool under running water 15 to 20 minutes", "Don't pop blisters", "No ice, butter or toothpaste"], ["oronine"], "If bigger than your palm, on face/hands/genitals, or white/leathery.", "皮膚科 / 形成外科", 7),
  C("Cut or scrape", "切り傷・すり傷", "skin", "mild", "cut:3 injury:2", "Injury.", ["Rinse with clean water", "Press to stop bleeding", "Cover with a hydrocolloid pad"], ["kizupower", "oronine"], "If deep, gaping, bleeds over 10 min, or dirty (tetanus).", "外科 / 形成外科", 7),
  C("Sunburn", "日焼け", "skin", "mild", "sunburn:3 heatexp:2 blisters:1", "UV damage.", ["Cool shower", "Aloe or calamine", FLUID], ["aftercare", "tylenol"], "If big blisters, fever or feeling faint.", "皮膚科", 5),
  C("Shingles", "帯状疱疹", "skin", "serious", "bandrash:3 blisters:2 rash:1 fatigue:1", "Chickenpox virus waking up in a nerve.", ["Don't wait"], [], "See a doctor within 72 h for antiviral medicine. Near the eye: go today.", "皮膚科 (dermatology)", 1),
  C("Chickenpox", "水ぼうそう", "skin", "moderate", "spots:3 fever:2 itch:2 sickcontact:1", "Varicella virus.", ["Stay home until all spots crust", "Cool baths, short nails"], ["tylenol"], "See a doctor (adults get it worse).", "皮膚科 / 内科", 7, "No aspirin.", true),
  C("Heat rash", "あせも", "skin", "mild", "rash:2 itch:2 heatexp:2", "Blocked sweat glands.", ["Keep cool, shower", "Loose cotton clothes"], ["aftercare"], "Rarely needed.", "皮膚科", 3),
  C("Dry skin", "乾燥肌", "skin", "mild", "dryskin:3 itch:2", "Low humidity, hot showers, soap.", ["Moisturiser right after shower", "Humidifier", "Lukewarm water"], ["eurax"], "If cracks bleed or get infected.", "皮膚科", 14),

  // Head
  C("Tension headache", "緊張型頭痛", "head", "mild", "headache:3 neckpain:2 stress:2 screen:1 insomnia:1", "Tight neck and shoulder muscles, stress, screens.", ["Warm towel on neck", "Stretch shoulders", "Water and a short walk", "Screen breaks"], ["tylenol", "eve", "salonpas"], "If headaches are new, getting worse, or you need painkillers over 10 days a month.", "脳神経内科 / 頭痛外来", 1),
  C("Migraine", "片頭痛", "head", "moderate", "throbbing:3 headache:2 lightsens:3 nausea:2 aura:3 vomit:1", "Brain sensitivity; triggers: lack of sleep, skipped meals, stress, periods.", ["Dark, quiet room", "Cold pack on the painful side", "Take medicine early", "Small amount of caffeine can help"], ["loxonin", "eve"], "If it's frequent: a 頭痛外来 can give triptans and prevention.", "脳神経内科 / 頭痛外来", 1),
  C("Stroke warning", "脳卒中の疑い", "head", "emergency", "weakside:3 confused:2 worsthead:2 blurry:2 dizzy:1", "Blocked or bleeding brain vessel.", ["Call 119 now", "Note the time it started"], [], "EMERGENCY: call 119. Every minute counts (FAST: Face, Arm, Speech, Time).", "救急 (emergency)", 0),
  C("Meningitis warning", "髄膜炎の疑い", "head", "emergency", "stiffneck:3 fever:3 headache:2 lightsens:2 confused:2 rash:1 vomit:1", "Infection around the brain.", ["Call 119 now"], [], "EMERGENCY: call 119.", "救急 (emergency)", 0),
  C("Concussion", "脳しんとう", "head", "moderate", "headinjury:3 headache:2 dizzy:2 nausea:1 confused:2 poorfocus:1", "Brain shaken by a hit.", ["Rest the brain: no screens, no sport", "Someone should stay with you for 24 h"], ["tylenol"], "Go to a hospital if vomiting, getting sleepier, confused, or the headache gets worse.", "脳神経外科 (neurosurgery)", 7),
  C("Vertigo (BPPV)", "良性発作性頭位めまい症", "head", "mild", "dizzy:3 nausea:2 earfull:0", "Tiny crystals moved in the inner ear; spinning when you turn your head.", ["Move slowly", "Ask an ENT about the Epley exercise"], ["travelmin"], "Go now if dizziness comes with weakness, speech problems or worst headache.", "耳鼻咽喉科 (ENT)", 7),

  // General / body
  C("Dehydration", "脱水症", "general", "moderate", "thirsty:3 dizzy:2 headache:1 fatigue:1 diarrhea:1 vomit:1 heatexp:1", "Not enough water.", ["Sip OS-1 slowly", "Rest somewhere cool"], ["os1"], "If you can't drink, are confused, or haven't peed in 8 h.", "内科", 1),
  C("Heat exhaustion / heatstroke", "熱中症", "general", "serious", "heatexp:3 dizzy:2 headache:2 nausea:2 hot:3 thirsty:2 cramp:1 confused:2", "Body overheating.", ["Move to shade or AC", "Cool neck, armpits, groin with cold water or ice", "Sip OS-1"], ["os1"], "Call 119 if confused, can't drink, or stopped sweating and very hot.", "救急 / 内科", 1),
  C("Iron-deficiency anaemia", "鉄欠乏性貧血", "general", "mild", "pale:3 fatigue:3 dizzy:2 headache:1 palpit:1", "Low iron: heavy periods, diet, blood loss.", ["Red meat, liver, spinach, natto, clams", "Vitamin C with meals", "No tea right after meals"], ["faichi"], "Get a blood test to confirm and find the cause.", "内科", 30),
  C("Burnout / overwork fatigue", "疲労・過労", "general", "mild", "fatigue:3 insomnia:2 stress:2 poorfocus:2 headache:1", "Too much work and too little rest.", ["7 to 9 hours of sleep", "One day fully off this week", "Short walks in daylight"], ["vitb"], "If tiredness lasts over 2 weeks with no reason: blood test for anaemia, thyroid, diabetes.", "内科 / 心療内科", 14),
  C("Diabetes warning signs", "糖尿病の疑い", "general", "moderate", "thirsty:3 oftenpee:3 weightloss:2 fatigue:2 blurry:1", "High blood sugar.", ["Cut sugary drinks"], [], "See a doctor for a blood test (HbA1c).", "内科 / 糖尿病内科", 7),
  C("Thyroid problem", "甲状腺の病気", "general", "moderate", "fatigue:2 weightloss:2 palpit:2 sweats:1 anxious:1 glands:1", "Thyroid too active or too slow.", [], [], "See a doctor for a blood test.", "内分泌内科", 14),
  C("Lower back pain", "腰痛 (ぎっくり腰)", "body", "mild", "backpain:3 sitting:2 injury:1", "Strained muscles, bad posture, lifting.", ["Keep gently moving: bed rest makes it worse", "Warm bath or heat pad after day 2", "Lift with your legs"], ["voltaren", "loxtape", "loxonin"], "Go now if numb around the bottom, can't control pee/poo, or leg weakness.", "整形外科 (orthopaedics)", 14),
  C("Stiff neck and shoulders", "肩こり", "body", "mild", "neckpain:3 screen:2 sitting:2 headache:1", "Posture, screens, stress.", ["Every hour: roll shoulders, tuck chin", "Monitor at eye level", "Warm bath"], ["salonpas", "vitb"], "If arm numbness or weakness.", "整形外科", 7),
  C("Sprain", "ねんざ", "body", "mild", "sprain:3 injury:2 jointswell:1", "Stretched ligament.", ["RICE: Rest, Ice 20 min, Compression, Elevation", "No hot baths for 2 days"], ["loxtape", "salonpas"], "If you can't walk 4 steps, or bone is tender: X-ray.", "整形外科 (orthopaedics)", 14),
  C("Possible fracture", "骨折の疑い", "body", "serious", "bonepain:3 injury:3 jointswell:2", "Broken bone.", ["Don't move it, splint with cardboard", "Ice"], [], "See an orthopaedic clinic today; ER if deformed or open wound.", "整形外科 (orthopaedics)", 1),
  C("Muscle soreness (DOMS)", "筋肉痛", "body", "mild", "sorework:3", "Small muscle damage after new exercise. It's how you get stronger.", ["Light movement", "Protein and sleep", "Warm bath"], ["salonpas"], "If pee turns dark brown after very hard exercise (go now).", "", 3),
  C("Muscle cramp", "こむら返り", "body", "mild", "cramp:3 thirsty:1 heatexp:1", "Tired muscle, low water or minerals.", ["Stretch the muscle gently", "Drink water with salt / OS-1"], ["os1"], "If frequent.", "整形外科 / 内科", 1),
  C("Gout", "痛風", "body", "moderate", "jointswell:3 jointpain:3 alcohol:2", "Uric acid crystals, often big toe.", ["Ice and raise", "No beer, less meat and fish roe", "Drink water"], ["loxonin"], "See a doctor for tests and medicine. Don't take aspirin.", "整形外科 / 内科", 7),
  C("Carpal tunnel", "手根管症候群", "body", "mild", "numb:3 screen:1", "Pinched nerve at the wrist, typing, phone use.", ["Wrist rest, keep wrists straight", "Night splint"], ["vitb"], "If weakness or it wakes you every night.", "整形外科", 30),
  C("Blood clot in leg (DVT)", "深部静脈血栓症", "body", "emergency", "legswell:3 sitting:2 breathless:2 chestpain:1", "Clot in a leg vein after long sitting or flights.", ["Don't massage it"], [], "See a doctor today; 119 if breathless or chest pain.", "救急 / 循環器内科", 0),
  C("Joint pain (wear)", "関節痛", "body", "mild", "jointpain:3", "Wear, overuse, or weight.", ["Strengthen muscles round the joint", "Low-impact cardio (cycling, swimming)"], ["voltaren", "eve"], "If swollen, hot, or locking.", "整形外科", 30),

  // Mind
  C("Insomnia", "不眠症", "mind", "mild", "insomnia:3 stress:2 screen:2 anxious:1 sleepy:1", "Stress, screens, caffeine, irregular schedule.", ["Same wake time every day", "No screens 1 h before bed", "No caffeine after 2 PM", "Get out of bed if awake 20 min"], ["drewell"], "If over a month, or you snore and stop breathing (sleep apnoea).", "心療内科 / 睡眠外来", 30),
  C("Anxiety", "不安障害", "mind", "moderate", "anxious:3 palpit:2 insomnia:2 stress:2 poorfocus:1", "Ongoing worry that is hard to control.", ["Daily exercise", "Box breathing", "Talk to someone you trust", "Limit caffeine"], [], "If it stops you from daily life: a 心療内科 can help with therapy or medicine.", "心療内科 / 精神科", 14),
  C("Depression", "うつ病", "mind", "moderate", "lowmood:3 fatigue:2 insomnia:2 noappetite:2 poorfocus:2 sleepy:1", "Brain chemistry, stress, loss. It is an illness, not weakness.", ["Tell someone", "Small daily goals", "Daylight and walks"], [], "See a 心療内科 or 精神科. If you think of hurting yourself, call いのちの電話 0570-783-556 or 119.", "心療内科 / 精神科", 14),
  C("Crisis", "危機", "mind", "emergency", "selfharm:3", "You are going through something too heavy to carry alone.", ["Stay with someone or call someone now", "Remove anything you could hurt yourself with"], [], "Please call いのちの電話 0570-783-556, or 119 if you are in danger. You matter.", "救急 / 精神科", 0),
  C("Stress overload", "ストレス過多", "mind", "mild", "stress:3 headache:1 insomnia:1 neckpain:1 upperpain:1", "Too much pressure for too long.", ["Write your worries on paper", "Exercise", "Sleep before midnight", "Say no to one thing this week"], [], "If it lasts weeks or affects sleep and eating.", "心療内科", 7),
  C("Eye-screen headache combo", "VDT症候群", "eent", "mild", "screen:3 dryeye:2 headache:2 neckpain:2", "Computer vision syndrome: long screen hours.", ["20-20-20 rule", "Blink more", "Screen brightness = room brightness"], ["santear", "vitb"], "If vision changes.", "眼科", 7),
];

// ----- The consult -----
export type Answers = {
  syms: string[]; feel: number; days: number; temp?: number; worse: boolean; age?: number; pregnant?: boolean;
};
export type Match = { c: Condition; pct: number; hits: string[] };

export function diagnose(a: Answers): Match[] {
  const mine = new Set(a.syms);
  const out: Match[] = [];
  for (const c of CONDITIONS) {
    const total = c.syms.reduce((n, [, w]) => n + w, 0);
    const hits = c.syms.filter(([id]) => mine.has(id));
    if (!hits.some(([, w]) => w >= 3)) continue; // needs at least one key sign
    if (c.severity === "emergency" && !hits.some(([id]) => symptom(id)?.red)) continue; // only with a danger sign
    const got = hits.reduce((n, [, w]) => n + w, 0);
    const explained = a.syms.filter((s) => c.syms.some(([id]) => id === s) || symptom(s)?.area === "context").length;
    let pct = 0.6 * (got / total) + 0.4 * (explained / Math.max(1, a.syms.length));
    if (c.syms.some(([id]) => id === "fever") && a.temp && a.temp >= 37.5) pct += 0.05;
    out.push({ c, pct: Math.min(0.97, pct), hits: hits.map(([id]) => id) });
  }
  return out.sort((x, y) => y.pct - x.pct).slice(0, 5);
}

export type Advice = { level: "emergency" | "doctor-today" | "doctor-soon" | "home"; title: string; why: string[] };

// Decides home care vs doctor vs emergency from red flags, fever, time and
// how bad it feels.
export function triage(a: Answers, top: Match[]): Advice {
  const red = a.syms.map(symptom).filter((s) => s?.red).map((s) => s!.label);
  if (red.length) return { level: "emergency", title: "🚑 Get help now: call 119", why: red.map((r) => `${r} is a danger sign`) };
  const why: string[] = [];
  if (a.temp && a.temp >= 40) why.push("Fever 40 °C or more");
  if (a.temp && a.temp >= 38.5 && a.days >= 3) why.push("High fever for 3+ days");
  if (a.feel <= 1) why.push("You feel very unwell");
  if (top[0]?.c.severity === "serious" && top[0].pct > 0.4) why.push(`${top[0].c.name} needs a doctor`);
  if ((a.age ?? 20) < 1 && a.temp && a.temp >= 38) why.push("Baby under 1 with fever");
  if (why.length) return { level: "doctor-today", title: "🏥 See a doctor today", why };
  if (a.worse) why.push("It's getting worse");
  if (a.temp && a.temp >= 38.5) why.push("Fever 38.5 °C or more: a clinic (発熱外来) can test for flu or COVID and give medicine in the first 48 h");
  if (a.days >= (top[0]?.c.days ?? 7)) why.push(`It has lasted ${a.days} days, longer than ${top[0]?.c.name.toLowerCase() ?? "usual"} normally does`);
  if (a.pregnant) why.push("Pregnant: check medicines with a doctor or pharmacist");
  if (top[0]?.c.severity === "moderate" && top[0].pct > 0.6 && (a.days >= 2 || a.feel <= 2)) why.push(`${top[0].c.name} often needs a check`);
  if (why.length) return { level: "doctor-soon", title: "🩺 See a doctor in the next day or two", why };
  return { level: "home", title: "🏠 Home care should be enough", why: ["No danger signs", "Watch it; come back if it changes"] };
}

export const PHONES: [string, string][] = [
  ["119", "Ambulance and fire (free, 24 h)"],
  ["#7119", "Not sure if it's an emergency? Nurse advice line (most areas)"],
  ["#8000", "Child sick at night: paediatric advice line"],
  ["0570-783-556", "いのちの電話: someone to talk to in a crisis"],
];
export const BUY = "Drugstores: Matsumoto Kiyoshi (マツキヨ), Welcia, Tsuruha, Sugi, Sundrug, Cocokara Fine. 第1類 medicines need a pharmacist on duty (薬剤師), so go when the pharmacy counter is open. Show the Japanese symptom words to the staff.";
