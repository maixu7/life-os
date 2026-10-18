// More symptoms, medicines and conditions for the app doctor. Same rules as
// doctor.ts: first-aid level guidance from a fixed list, not a diagnosis.
// Cancer entries are "warning signs to get checked", never a verdict.

import type { Area, Condition, Med, Severity, Symptom } from "./doctor";

const S = (id: string, label: string, ja: string, area: Area, red = false): Symptom => ({ id, label, ja, area, red });

export const EXTRA_SYMPTOMS: Symptom[] = [
  // General
  S("lump", "Soft lump under the skin", "皮膚の下にしこりがある", "general"),
  S("hardlump", "Hard, fixed lump that keeps growing", "硬くて動かないしこりが大きくなっている", "general"),
  S("neckfront", "Swelling at the front of the neck", "首の前（のど仏の下）が腫れている", "general"),
  S("heatintol", "Always hot, sweaty, shaky hands", "暑がりで汗が多く、手が震える", "general"),
  S("coldintol", "Always cold, sluggish, puffy, gaining weight", "寒がりで体がむくみ、体重が増える", "general"),
  S("bruise", "Bruise easily / bleeding gums / tiny red dots", "あざができやすい・点状の出血", "general"),
  S("shakyhungry", "Suddenly shaky, cold sweat, very hungry", "急な手の震え・冷や汗・強い空腹感", "general"),
  S("sepsisskin", "Very unwell: mottled cold skin, fast breathing, feels like dying", "ぐったりして皮膚がまだら・呼吸が速い", "general", true),
  S("dkabreath", "Fast deep breathing, fruity breath, vomiting (with thirst)", "呼吸が速く深い・甘いにおいの息・嘔吐", "general", true),
  S("breastlump", "Lump or swelling under the nipple", "乳首の下にしこり・ふくらみ", "general"),
  S("purplestretch", "Wide purple stretch marks, round face", "赤紫色の太い肉割れ・丸い顔", "general"),
  S("ankleswell", "Both ankles or legs swollen", "両足がむくむ", "general"),
  S("standdizzy", "Dizzy or blacking out when standing up", "立ちくらみ", "general"),
  S("achybones", "Aching bones, weak muscles", "骨が痛い・筋力が落ちた", "general"),

  // Eyes, ears, nose, mouth
  S("flashes", "Sudden flashes, shower of floaters or a dark curtain", "急に光が走る・黒い点が増える・視野が欠ける", "eent", true),
  S("floaters", "A few floating spots, for a long time", "以前から黒い点や糸くずが見える（飛蚊症）", "eent"),
  S("eyeblood", "Bright red patch on the white of the eye, no pain", "白目が真っ赤（痛みはない）", "eent"),
  S("eyepain", "Eye hurts, feels like something is in it", "目が痛い・ゴロゴロする", "eent"),
  S("eyestab", "Stabbing pain round one eye, watery eye, same time daily", "片目の奥がえぐられるように痛い", "eent"),
  S("gumbleed", "Swollen gums that bleed when brushing", "歯ぐきが腫れる・歯みがきで出血", "eent"),
  S("jawpain", "Jaw clicks or hurts when chewing / opening", "あごが痛い・口を開けるとカクカク鳴る", "eent"),
  S("wisdom", "Pain and swelling at the very back of the jaw", "親知らずのあたりが腫れて痛い", "eent"),
  S("sensitive", "Teeth sting with cold drinks", "冷たいものが歯にしみる", "eent"),
  S("badbreath", "Bad breath", "口臭が気になる", "eent"),
  S("itchymouth", "Itchy mouth or throat after raw fruit", "生の果物を食べると口やのどがかゆい", "eent"),

  // Chest
  S("suddenbreath", "Sudden breathlessness with sharp chest pain on breathing in", "急な息切れ・息を吸うと胸が痛い", "chest", true),
  S("coughblood", "Coughing up blood", "血痰・血を咳で吐いた", "chest", true),
  S("longcough", "Cough for more than 3 weeks", "3週間以上せきが続く", "chest"),
  S("chestpress", "Chest hurts when I press on one spot", "胸を押すと痛い場所がある", "chest"),

  // Stomach and bowel
  S("rumble", "Stomach rumbling / gurgling", "お腹がゴロゴロ・グーグー鳴る", "stomach"),
  S("gas", "Passing a lot of gas", "おならが多い", "stomach"),
  S("wateryst", "Watery diarrhoea (like water)", "水のような下痢", "stomach"),
  S("chronicdiarr", "Diarrhoea for 4 weeks or more", "下痢が4週間以上続く", "stomach"),
  S("blackstool", "Black, sticky, tar-like poo (not on iron tablets)", "黒くてねばねばしたタール状の便（鉄剤は飲んでいない）", "stomach", true),
  S("blackiron", "Dark green-black poo while taking iron", "鉄剤を飲んでいて便が黒っぽい", "stomach"),
  S("redblood", "Bright red blood on the paper or in the toilet", "トイレットペーパーや便器に鮮血がつく", "stomach"),
  S("bloodymucus", "Blood and mucus mixed into the poo", "便に血と粘液が混じる（粘血便）", "stomach"),
  S("palestool", "Pale, clay-coloured poo", "便の色が白っぽい・灰色", "stomach"),
  S("swollenbelly", "Belly getting bigger or tight and swollen", "お腹が膨らんできた・パンパンに張る", "stomach"),
  S("noflatus", "Can't pass wind or poo, belly swelling, vomiting", "おならも便も出ずお腹が張って吐く", "stomach", true),
  S("urgency", "Sudden urgent need to rush to the toilet", "急に強い便意がきてトイレに駆け込む", "stomach"),
  S("analtear", "Sharp cutting pain while pooing", "排便時に切れるような鋭い痛み", "stomach"),
  S("prolapse", "Something comes out of the anus", "肛門から何かが出てくる", "stomach"),
  S("analswell", "Painful swollen lump at the anus", "肛門のまわりが腫れて痛い", "stomach"),
  S("itchanus", "Itchy bottom", "肛門がかゆい", "stomach"),
  S("rigidbelly", "Severe pain all over a hard belly, hurts to move", "お腹全体が激しく痛く、板のように硬い", "stomach", true),
  S("bandpain", "Severe upper belly pain going through to the back", "みぞおちから背中に突き抜ける激痛", "stomach", true),
  S("rightupper", "Pain under the right ribs", "右の肋骨の下が痛い", "stomach"),
  S("earlyfull", "Full after a few bites / heavy stomach", "少し食べただけでお腹がいっぱい・胃もたれ", "stomach"),
  S("hungerpain", "Stomach pain when hungry or at night, eases after eating", "空腹時や夜中にみぞおちが痛む", "stomach"),
  S("stoolthin", "Poo habits changed for weeks / thin poo", "便通の変化が続く・便が細い", "stomach"),
  S("foodstuck", "Food gets stuck going down", "食べ物がのどや胸につかえる", "stomach"),
  S("dairy", "Worse after milk or dairy", "牛乳や乳製品で悪くなる", "stomach"),
  S("wheat", "Worse after bread, pasta or wheat", "パンや麺など小麦で悪くなる", "stomach"),

  // Pee and private parts
  S("morningwood", "Erection on waking", "朝起きると勃起している（朝立ち）", "urinary"),
  S("edsym", "Hard to get or keep an erection", "勃起しにくい・維持できない", "urinary"),
  S("earlyej", "Ejaculating sooner than I want", "射精が早すぎる", "urinary"),
  S("highlibido", "Strong sex drive / masturbate often", "性欲が強い・自慰の回数が多い", "urinary"),
  S("lowlibido", "Low sex drive", "性欲がない", "urinary"),
  S("testpain", "Sudden severe pain in a testicle", "睾丸の突然の激しい痛み", "urinary", true),
  S("testache", "Dull ache, heaviness or swelling in the scrotum", "陰のうが重い・鈍い痛み・腫れ", "urinary"),
  S("testlump", "Lump or hard area on a testicle", "睾丸にしこりがある・硬い", "urinary"),
  S("priapism", "Painful erection lasting over 4 hours", "4時間以上続く痛い勃起", "urinary", true),
  S("uretdisch", "Discharge or pus from the penis", "尿道から膿・分泌物が出る", "urinary"),
  S("genitalsore", "Painless sore or ulcer on the genitals", "陰部に痛みのないしこり・ただれ", "urinary"),
  S("genitalblister", "Painful small blisters on the genitals", "陰部に痛い小さな水ぶくれ", "urinary"),
  S("genitalbump", "Small fleshy bumps on the genitals", "陰部に小さないぼ", "urinary"),
  S("penisred", "Red, sore, itchy head of the penis", "亀頭が赤い・かゆい・ただれる", "urinary"),
  S("weakstream", "Weak stream / pain between legs or in the pelvis", "尿の勢いが弱い・会陰部や下腹部の痛み", "urinary"),
  S("cantpee", "Can't pee at all, bladder full and painful", "尿が全く出ず下腹部がパンパンで痛い", "urinary", true),
  S("darkpee", "Dark brown or cola-coloured pee", "尿がコーラ色・濃い茶色", "urinary"),
  S("groinbulge", "Bulge in the groin that goes back when lying down", "足の付け根のふくらみ（横になると戻る）", "urinary"),
  S("stuckbulge", "Groin bulge that is hard, painful and won't go back", "足の付け根のふくらみが硬く痛く戻らない", "urinary", true),
  S("irregperiod", "Irregular or missing periods", "生理不順・生理が来ない", "urinary"),

  // Skin
  S("mole", "Mole changing shape, colour or size, or bleeding", "ほくろの形・色・大きさが変わる・出血する", "skin"),
  S("scaly", "Thick red patches with silvery scales", "赤く盛り上がり銀白色のかさぶたがつく", "skin"),
  S("itchnight", "Intense itch at night, tiny spots between fingers", "夜に激しくかゆい・指の間にぶつぶつ", "skin"),
  S("wart", "Rough hard skin bump (wart / corn)", "いぼ・うおのめ", "skin"),
  S("ringrash", "Round red ring-shaped itchy rash", "輪のような形の赤いかゆい発疹", "skin"),
  S("dandruff", "Flaky scalp, red greasy face sides", "フケ・小鼻のわきが赤くカサカサ", "skin"),
  S("hairloss", "Thinning hair on top or front", "頭頂部や生え際の髪が薄くなった", "skin"),
  S("baldpatch", "Round bald patch appeared suddenly", "円形にはげた部分ができた", "skin"),
  S("handsweat", "Hands, feet or armpits drip with sweat", "手のひら・足・わきの汗が多すぎる", "skin"),
  S("toenail", "Toenail digging in, red and sore", "足の爪が食い込んで赤く痛い", "skin"),

  // Muscles and joints
  S("tendon", "Pain along a tendon when using it", "使うと腱（すじ）が痛い", "body"),
  S("kneepain", "Pain around or behind the kneecap", "膝のお皿のまわりが痛い", "body"),
  S("elbowpain", "Pain on the outside of the elbow when gripping", "物をつかむと肘の外側が痛い", "body"),
  S("shoulderpain", "Shoulder hurts lifting the arm overhead", "腕を上げると肩が痛い", "body"),
  S("heelpain", "Heel pain on first steps in the morning", "朝の一歩目にかかとが痛い", "body"),
  S("shinpain", "Pain along the inner shin when running", "走るとすねの内側が痛い", "body"),
  S("morningstiff", "Joints or back stiff for over 30 min in the morning", "朝のこわばりが30分以上続く", "body"),
  S("legshoot", "Shooting pain from buttock down the leg", "お尻から足に電気が走るような痛み", "body"),
  S("muscpull", "Sudden sharp muscle pain during exercise", "運動中に急に筋肉がピキッと痛んだ", "body"),
  S("saddle", "Numb between the legs / can't control pee or poo", "股のまわりがしびれる・尿や便がもれる", "body", true),
  S("tingfeet", "Tingling or numb feet", "足がしびれる・ピリピリする", "body"),
  S("restlegs", "Restless crawly legs at night, must move them", "夜に脚がむずむずして動かしたくなる", "body"),

  // Mind and sleep
  S("worryloop", "Unwanted thoughts, must check or wash again and again", "確認や手洗いをやめられない", "mind"),
  S("restless", "Restless, impulsive, forgetful since childhood", "子どもの頃から落ち着きがない・忘れ物が多い", "mind"),
  S("wakeearly", "Wake very early and can't get back to sleep", "朝早く目が覚めて眠れない", "mind"),
  S("latesleep", "Can't fall asleep until very late", "夜遅くまで寝つけない", "mind"),
  S("snore", "Loud snoring / stop breathing in sleep", "大きないびき・寝ている間に呼吸が止まる", "mind"),
  S("socialfear", "Strong fear of being judged by others", "人前で強く緊張する・人の目が怖い", "mind"),
  S("hyper", "Days of very high energy, little sleep, racing thoughts", "ほとんど寝なくても元気・考えが止まらない", "mind"),
  S("hearvoices", "Hearing voices / feeling watched or followed", "声が聞こえる・見張られている感じがする", "mind"),
  S("cantstop", "Can't stop a habit even though I want to", "やめたくてもやめられない習慣がある", "mind"),
  S("overbreath", "Fast breathing with tingling lips and hands", "呼吸が速くなり口や手がしびれる", "mind"),

  // What happened
  S("ironpill", "Taking iron tablets", "鉄剤を飲んでいる", "context"),
  S("painkillers", "Take painkillers often (10+ days a month)", "痛み止めをよく飲む（月10日以上）", "context"),
  S("sex", "New or unprotected sexual partner", "新しい相手・コンドームなしの性行為", "context"),
  S("sport", "Running or sport a lot", "ランニングやスポーツをよくする", "context"),
  S("rawfood", "Ate raw chicken, oysters, raw fish, raw egg or rare meat", "生の鶏肉・カキ・刺身・生卵・生焼けの肉を食べた", "context"),
  S("porn", "Watch a lot of porn", "アダルト動画をよく見る", "context"),
  S("smoker", "Smoke cigarettes", "たばこを吸う", "context"),
  S("antibiotic", "Recently took antibiotics", "最近抗生物質を飲んだ", "context"),
  S("steroids", "Using muscle-building steroids or testosterone", "筋肉増強剤・テストステロンを使っている", "context"),
  S("caffeine", "Lots of coffee or energy drinks", "コーヒーやエナジードリンクをたくさん飲む", "context"),
  S("traumaevent", "Something shocking happened to me", "ショックな出来事があった", "context"),
];

const M = (name: string, generic: string, use: string, caution: string, cls?: string): Med => ({ name, generic, use, caution, cls });
export const EXTRA_MEDS: Record<string, Med> = {
  buscopan: M("Buscopan A (ブスコパンA錠)", "butylscopolamine", "Cramping stomach and gut pain.", "Not with glaucoma, an enlarged prostate or heart rhythm problems. Can blur vision: don't drive if it does.", "第2類"),
  wakamoto: M("Strong Wakamoto (強力わかもと)", "digestive enzymes + lactic acid bacteria", "Gas, bloating, heavy stomach, soft poo.", "Very safe.", "指定医薬部外品"),
  rikkunshito: M("Rikkunshito (ツムラ漢方六君子湯)", "kampo herbal", "Weak stomach: full quickly, no appetite, heavy after meals.", "Take before meals. Stop if swelling or high blood pressure appears.", "第2類"),
  cerekinon: M("Cerekinon S (セレキノンS)", "trimebutine", "Repeat IBS flare-ups (cramps with diarrhoea or constipation).", "Only if a doctor has already diagnosed IBS. Buy where a pharmacist is on duty.", "第1類"),
  ichijiku: M("Ichijiku enema (イチジク浣腸)", "glycerin enema", "Hard poo stuck at the exit.", "Occasional use only. Not with belly pain of unknown cause, vomiting or bleeding.", "第2類"),
  lecicarbon: M("Shin Lecicarbon suppository (新レシカルボン坐剤S)", "CO2-releasing suppository", "Poo reaches the bottom but won't come out.", "Gentle; works in 10 to 30 min.", "第3類"),
  borraginolm: M("Borraginol M (ボラギノールM軟膏)", "non-steroid haemorrhoid ointment", "Piles or small anal tear: pain, itch, bleeding.", "Steroid-free, OK for longer use. If bleeding continues, see a doctor.", "第2類"),
  feitas: M("Feitas 5.0 (フェイタス5.0)", "diclofenac patch", "Muscle strain, tendon and joint pain.", "Not in pregnancy or with painkiller asthma. Max 2 patches a day.", "第2類"),
  vantelin: M("Vantelin Kowa gel EX (バンテリンコーワゲルEX)", "indometacin gel", "Elbow, knee, shoulder and muscle pain.", "Not on broken skin. Not with painkiller asthma.", "第2類"),
  hirumild: M("Hirumild cream (ヒルマイルドクリーム)", "heparinoid moisturiser", "Dry, rough skin, mild eczema between flares.", "Not on bleeding cuts.", "第2類"),
  ibokorori: M("Ibokorori (イボコロリ)", "salicylic acid", "Common warts and corns on hands and feet.", "Not on the face, genitals, or if diabetic. Genital warts need a doctor.", "第2類"),
  furufuru: M("Collage Furufuru Next shampoo (コラージュフルフルネクストシャンプー)", "antifungal shampoo (miconazole)", "Dandruff and itchy flaky scalp.", "Leave on 1 to 2 min before rinsing.", "医薬部外品"),
  riupx5: M("RiUP X5 Plus (リアップX5プラス)", "minoxidil 5% lotion", "Male-pattern hair thinning.", "Takes 4 to 6 months; stops working if you stop. Not with heart problems or low blood pressure.", "第1類"),
  shumitect: M("Sensodyne / Shumitect (シュミテクト)", "potassium nitrate toothpaste", "Teeth that sting with cold.", "Use daily for 2 weeks to feel the effect.", "医薬部外品"),
  ases: M("Ases (アセス)", "herbal gum medicine (toothpaste-type)", "Swollen, bleeding gums.", "A dentist cleaning is still needed for gum disease.", "第3類"),
  hangekobokuto: M("Hange-koboku-to (半夏厚朴湯)", "kampo herbal", "Nervous tension, a 'lump in the throat' feeling with stress.", "Gentle. Not a replacement for help with real anxiety or depression.", "第2類"),
  vitd: M("Vitamin D supplement (ネイチャーメイド ビタミンD)", "vitamin D3 (supplement)", "Low vitamin D: little sun, indoor life.", "Supplement, not a medicine. Don't exceed the label dose.", undefined),
  zinc: M("Zinc supplement (ネイチャーメイド 亜鉛)", "zinc (supplement)", "Low zinc: taste changes, slow healing.", "Supplement. Too much zinc lowers copper: keep to the label dose.", undefined),
};

const C = (name: string, ja: string, area: Area, severity: Severity, syms: string, cause: string, home: string[], meds: string[], doctor: string, dept: string, days?: number, info?: string, contagious?: boolean): Condition => ({
  name, ja, area, severity, cause, home, meds, doctor, dept, days, info, contagious,
  syms: syms.split(" ").map((x) => { const [id, w] = x.split(":"); return [id, Number(w ?? 1)]; }),
});

const REST = "Rest and sleep well", FLUID = "Sip fluids often: water, tea, OS-1 or Pocari";
const ER = "EMERGENCY: call 119 now.", CALL = "Call 119 now";
const FIBRE = "Fibre every day: vegetables, natto, oats, seaweed, kiwi", NOSTRAIN = "Don't strain or sit on the toilet for long (no phones)";
const CHECK = "Don't panic: most lumps and changes like this are harmless, but this one is worth a proper check.";
const SLEEPH = "Same wake-up time every day, even weekends", NOSCREEN = "No phone in bed; dim lights an hour before sleep";
const RICE = "Rest it, ice 15 min a few times a day, then gentle movement as pain allows";
const SAFE = "No sex until treated and cleared; tell recent partners", TEST = "Free, anonymous STI/HIV tests at your local 保健所 (health centre)";

export const EXTRA_CONDITIONS: Condition[] = [
  // ----- Stomach pain types -----
  C("Functional dyspepsia", "機能性ディスペプシア", "stomach", "mild", "earlyfull:3 upperpain:2 bloating:2 nausea:1 stress:2 noappetite:1", "The stomach is sensitive and slow to relax after food, with no damage on a camera test. Stress and irregular meals make it worse.", ["Smaller, regular meals; don't skip breakfast", "Less fatty and fried food, less coffee and alcohol", "Eat slowly and don't lie down for 2 h after eating", "Manage stress; light walks after meals"], ["rikkunshito", "cabbagin", "gaster"], "If it lasts over 4 weeks, or with weight loss, black poo, vomiting or trouble swallowing: an endoscopy (胃カメラ) rules out other causes.", "消化器内科", 14, "Very common in Japan. Not dangerous, but it can come and go for months."),
  C("Acute gastritis (alcohol / painkillers / stress)", "急性胃炎", "stomach", "mild", "upperpain:3 nausea:2 painkillers:2 alcohol:2 stress:1 heartburn:1 vomit:1", "The stomach lining gets irritated by alcohol, NSAID painkillers (ibuprofen, loxoprofen, aspirin), spicy food or sudden stress.", ["Stop the trigger: no alcohol, switch painkillers to acetaminophen", "Bland food for 1 to 2 days: rice porridge (お粥), udon, tofu", FLUID], ["gaster", "ohta", "tylenol"], "If pain is severe, lasts over 3 days, or you vomit blood or have black poo (go now).", "内科 / 消化器内科", 3),
  C("Duodenal ulcer", "十二指腸潰瘍", "stomach", "moderate", "hungerpain:3 upperpain:2 heartburn:1 painkillers:1 smoker:1 stress:1 nausea:1", "A sore in the first part of the small intestine, often from H. pylori bacteria or NSAID painkillers.", ["Regular meals; avoid long empty-stomach periods", "No smoking, less alcohol and coffee", "Avoid NSAID painkillers; use acetaminophen"], ["gaster", "tylenol"], "See a doctor: a breath or blood test for H. pylori, and a week of medicine can cure it. Black poo or vomiting blood: call 119.", "消化器内科", 14, "Getting rid of H. pylori (ピロリ菌除菌) is covered by insurance in Japan and also lowers stomach cancer risk."),
  C("H. pylori infection", "ピロリ菌感染症", "stomach", "moderate", "upperpain:2 earlyfull:3 hungerpain:2 nausea:1 badbreath:1", "A stomach bacterium usually caught in childhood. It causes long-term gastritis, ulcers and raises stomach cancer risk.", ["Nothing at home clears it", "Avoid smoking and heavy drinking"], [], "Ask a clinic for a test (breath, stool or blood). Treatment is a 7-day course of three medicines.", "消化器内科", 30, "About half of older Japanese adults have it; fewer young people do. Worth testing once."),
  C("Anisakis (raw fish parasite)", "アニサキス症", "stomach", "serious", "upperpain:3 rawfood:3 nausea:2 vomit:2", "A tiny worm in raw or lightly cured fish (mackerel しめさば, squid, salmon, bonito) bites into the stomach wall, 2 to 8 hours after eating.", ["Don't wait it out if pain is severe", "Vinegar, soy sauce and wasabi do NOT kill it; freezing (-20°C, 24 h) or cooking does"], [], "See a doctor today: an endoscopy can see and remove the worm, and the pain stops almost at once.", "消化器内科 (胃カメラ)", 1, "Very common in Japan. Pain can be intense. Occasionally it causes an allergic reaction (hives): that needs care too."),
  C("Gallbladder inflammation", "急性胆のう炎", "stomach", "serious", "rightupper:3 fever:2 nausea:2 vomit:1 upperpain:1", "A gallstone blocks the gallbladder and it gets inflamed or infected.", ["Don't eat until seen", "Sip water only"], [], "See a doctor today: needs a scan, often antibiotics and later surgery. Yellow eyes plus fever and chills: call 119.", "消化器内科 / 外科", 3),
  C("Acute pancreatitis", "急性膵炎", "stomach", "emergency", "bandpain:3 upperpain:2 vomit:2 alcohol:2 fever:1 nausea:1", "The pancreas becomes inflamed, mostly from heavy drinking or a gallstone.", [CALL, "Nothing to eat or drink", "Leaning forward may ease pain a little"], [], ER, "救急 (emergency)", 0, "Severe attacks can affect the whole body. It needs hospital fluids and monitoring."),
  C("Stomach rumbling (normal)", "腹鳴 (お腹が鳴る)", "stomach", "mild", "rumble:3 gas:1 bloating:1", "Gut muscles push gas and fluid along. It's loudest when you're hungry (the 'housekeeping wave' clears the gut every 1 to 2 hours) or after fizzy drinks, sweeteners and beans.", ["Normal and healthy: no treatment needed", "Eat regular meals; a small snack before quiet meetings", "Eat slowly, chew well, fewer fizzy drinks and gum"], [], "Only if it comes with pain, diarrhoea, weight loss or blood.", "内科 (if worried)", 1, "Doctors call it borborygmi. A silent belly for hours with pain and swelling is what worries doctors, not noise."),
  C("Trapped gas / flatulence", "腸内ガス・おなら", "stomach", "mild", "gas:3 bloating:2 rumble:1 lowerpain:1 dairy:1", "Swallowed air (eating fast, gum, fizzy drinks) and gut bacteria breaking down beans, onions, sweeteners and fibre.", ["Eat slowly, cut fizzy drinks and gum", "Walk after meals", "Lie on your left side or knees-to-chest to release gas", "Note foods that set it off"], ["wakamoto", "biofermin"], "If with weight loss, blood in poo, or it changes suddenly after age 40.", "内科 / 消化器内科", 2, "Passing gas 10 to 20 times a day is normal."),

  // ----- Diarrhoea and gastroenteritis -----
  C("Norovirus", "ノロウイルス胃腸炎", "stomach", "moderate", "vomit:3 wateryst:2 diarrhea:2 nausea:2 rawfood:1 sickcontact:2 fever:1", "A very catching stomach virus, mostly winter. Spread by sick people, raw oysters and shared toilets.", [FLUID, "Small sips every few minutes even if you vomit", "Clean with diluted bleach (alcohol doesn't kill it)", "Wash hands with soap; don't cook for others for 2 days after"], ["os1"], "If you can't keep fluids down for 12 h, pee very little, or have blood in poo.", "内科", 3, "Usually over in 1 to 3 days. Avoid diarrhoea stoppers; let it clear.", true),
  C("Campylobacter (raw chicken)", "カンピロバクター食中毒", "stomach", "moderate", "rawfood:3 diarrhea:3 fever:2 lowerpain:2 bloodymucus:1 badfood:1", "Bacteria from raw or undercooked chicken (鶏刺し, 鳥わさ, rare yakitori). Symptoms start 2 to 5 days later.", [FLUID, REST, "Bland food once hungry"], ["os1", "biofermin"], "If fever over 38.5 °C, bloody poo, or lasting over 3 days. Weakness or tingling in legs weeks later: see a doctor at once (rare nerve complication).", "内科 / 消化器内科", 5, "The most common food poisoning in Japan. Avoid anti-diarrhoea medicine with fever or blood."),
  C("Salmonella", "サルモネラ食中毒", "stomach", "moderate", "rawfood:3 fever:3 diarrhea:2 vomit:1 lowerpain:1 badfood:1", "Bacteria from raw or undercooked eggs, chicken and meat. Starts 6 to 72 hours later, often with high fever.", [FLUID, REST], ["os1"], "If fever over 38.5 °C for 2 days, blood in poo, or you can't keep fluids down.", "内科", 5, undefined, true),
  C("Staph toxin food poisoning", "黄色ブドウ球菌食中毒", "stomach", "mild", "vomit:3 badfood:3 nausea:2 lowerpain:1 diarrhea:1", "A toxin made by bacteria in food handled with bare hands and left warm (onigiri, bento, sandwiches). Hits fast: 1 to 6 hours.", [FLUID, "Rest; it usually stops within a day"], ["os1"], "If vomiting lasts over 24 h, or you're very dizzy and can't drink.", "内科", 1, "Sudden but short. Fever is unusual."),
  C("E. coli O157 (bloody diarrhoea)", "腸管出血性大腸菌 (O157) 感染症", "stomach", "serious", "bloodymucus:3 rawfood:2 lowerpain:3 diarrhea:2 wateryst:1", "Bacteria from undercooked beef (rare hamburg, raw liver, ユッケ) or contaminated vegetables. Bloody diarrhoea with bad cramps, often little fever.", [FLUID, "Do NOT take anti-diarrhoea medicine"], ["os1"], "See a doctor today. Very little pee, puffy face or pale and tired: go to hospital (kidney complication).", "内科 / 消化器内科", 7, undefined, true),
  C("Traveller's diarrhoea", "旅行者下痢症", "stomach", "mild", "travel:3 diarrhea:3 wateryst:2 lowerpain:1 nausea:1", "Bacteria in food or water abroad.", [FLUID, "Bland food; avoid alcohol and milk for a few days"], ["os1", "biofermin", "stoppa"], "If fever, blood in poo, or over 3 days. Tell the doctor where you travelled.", "内科 / 感染症内科", 3),
  C("Antibiotic-related diarrhoea", "抗菌薬関連下痢症", "stomach", "moderate", "antibiotic:3 wateryst:2 diarrhea:2 lowerpain:1 fever:1", "Antibiotics upset gut bacteria. Rarely a germ called C. difficile overgrows and causes severe watery diarrhoea.", [FLUID, "Yogurt or probiotics", "Don't stop prescribed antibiotics without asking"], ["biofermin", "os1"], "Tell the prescribing doctor. 3+ watery stools a day with fever or belly pain: see a doctor today.", "内科", 3),
  C("IBS diarrhoea type (IBS-D)", "過敏性腸症候群 (下痢型)", "stomach", "mild", "urgency:3 wateryst:2 lowerpain:2 stress:2 rumble:1 diarrhea:2", "A sensitive gut-brain connection: stress, commuting, exams or certain foods trigger sudden cramps and loose poo, relieved after the toilet.", ["Know your toilet stops; it calms the fear", "Regular sleep and meals", "Try less fatty food, alcohol, caffeine and high-FODMAP foods (onion, garlic, wheat)", "Breathing exercises on the train"], ["cerekinon", "stoppa", "biofermin"], "See a doctor if new after 40, waking you at night, blood, weight loss, or fever. Prescription medicine (e.g. ramosetron) works well for men.", "消化器内科 / 心療内科", 30, "Very common in young Japanese men. The 'morning train diarrhoea' (通勤快速) pattern is classic IBS-D."),
  C("Overactive bowel after meals", "胃結腸反射の亢進", "stomach", "mild", "urgency:3 rumble:1 caffeine:2 stress:1", "Eating and coffee trigger a reflex that pushes the bowel to empty. Some people's reflex is strong.", ["Allow time after breakfast for the toilet", "Smaller meals; less coffee and energy drinks", "Warm drinks instead of ice-cold"], ["biofermin"], "If you have blood, night-time diarrhoea, or weight loss.", "消化器内科", 30, "Needing to go soon after eating is a normal reflex."),
  C("Ulcerative colitis", "潰瘍性大腸炎", "stomach", "serious", "chronicdiarr:3 bloodymucus:3 urgency:2 lowerpain:1 weightloss:1 fatigue:1", "The immune system inflames the lining of the large bowel. Often starts in the 20s.", ["Keep a food and symptom diary", FLUID, "Don't use painkillers like ibuprofen"], [], "See a gastroenterologist: diagnosed by colonoscopy. Many medicines control it well. Severe pain, fever or 6+ bloody stools a day: go today.", "消化器内科", 30, "A designated intractable disease (指定難病) in Japan: medical costs are subsidised."),
  C("Crohn's disease", "クローン病", "stomach", "serious", "chronicdiarr:3 lowerpain:2 weightloss:2 fatigue:1 fever:1 mouthsore:1 analswell:2", "Immune inflammation that can affect any part of the gut, often near the end of the small bowel. Usually starts age 15 to 30.", ["Stop smoking (makes it much worse)", "Eat what you tolerate; keep a diary"], [], "See a gastroenterologist. Recurring anal abscesses plus diarrhoea and weight loss is a typical clue.", "消化器内科", 30, "Also a 指定難病 with cost support. Modern treatment lets most people live normally."),
  C("Lactose intolerance", "乳糖不耐症", "stomach", "mild", "dairy:3 bloating:2 gas:2 diarrhea:2 rumble:1", "Not enough lactase enzyme to digest milk sugar. Very common in East Asian adults.", ["Lactose-free milk, yogurt and hard cheese are usually fine", "Small amounts with meals", "Try soy milk"], [], "Only if symptoms happen without dairy too.", "内科 (if unsure)", 1, "Not an allergy and not dangerous."),
  C("Coeliac disease / wheat sensitivity", "セリアック病・小麦過敏", "stomach", "moderate", "wheat:3 bloating:2 diarrhea:2 fatigue:1 weightloss:1 pale:1", "An immune reaction to gluten in wheat, barley and rye. Rare in Japan but possible.", ["Don't stop wheat before testing (the test needs it)", "Keep a food diary"], [], "See a doctor for a blood test, especially with weight loss or anaemia.", "消化器内科", 14),

  // ----- Bottom -----
  C("Anal fissure", "裂肛 (切れ痔)", "stomach", "mild", "analtear:3 redblood:2 constip:2 bottompain:2", "A small tear at the anus, usually from passing hard poo or strong diarrhoea.", ["Soft poo is the cure: fibre, water, magnesium", "Warm bath or sitz bath 2 to 3 times a day", NOSTRAIN, "Wash with warm water (washlet on gentle) rather than rubbing"], ["borraginolm", "borraginol", "magmi"], "If it lasts over 6 weeks, keeps returning, or bleeding is more than streaks.", "肛門科 / 肛門外科", 14),
  C("Thrombosed external haemorrhoid", "血栓性外痔核", "stomach", "mild", "analswell:3 bottompain:2 sitting:1 constip:1", "A small blood clot in a vein at the anus after straining, a long sit, heavy lifting or alcohol. A blue-purple painful lump.", ["Warm baths", "Avoid long sitting and straining", "It shrinks over 1 to 2 weeks"], ["borraginol", "eve"], "If the pain is severe in the first 3 days (it can be drained), or with fever.", "肛門科", 10),
  C("Prolapsing internal haemorrhoid", "内痔核の脱出 (いぼ痔)", "stomach", "mild", "prolapse:3 redblood:2 constip:1 sitting:1", "Swollen cushions inside the anus slip out when pooing, often with painless bright red bleeding.", [NOSTRAIN, FIBRE, "Push it gently back with a clean finger and some ointment"], ["borraginol", "magmi"], "If it won't go back in, becomes very painful, or bleeding is frequent.", "肛門科", 14),
  C("Rectal prolapse", "直腸脱", "stomach", "moderate", "prolapse:3 constip:2 itchanus:1", "The lower bowel slides out through the anus, usually from long-term straining. A ring-shaped red tube, bigger than a pile.", [NOSTRAIN, "Push it back gently lying down", FIBRE], ["magmi"], "See a colorectal surgeon; it usually needs an operation. If it won't go back and turns dark: go to ER today.", "肛門外科 / 消化器外科", 30),
  C("Anal abscess / fistula", "肛門周囲膿瘍・痔ろう", "stomach", "serious", "analswell:3 fever:2 bottompain:2", "An infected gland next to the anus fills with pus; afterwards a tunnel (fistula) can form.", ["Warm baths ease pain", "Don't squeeze it"], ["tylenol"], "See a doctor within a day: it usually needs draining. Fever with spreading redness: go today.", "肛門外科", 7),
  C("Itchy bottom", "肛門そう痒症", "stomach", "mild", "itchanus:3 bottompain:1", "Leftover poo, sweat, over-washing with soap, spicy food or piles.", ["Rinse with water, pat dry; no soap scrubbing", "Washlet on a gentle setting, not too long", "Cotton underwear; avoid scratching"], ["borraginolm"], "If it lasts over 3 weeks or bleeds.", "肛門科 / 皮膚科", 7),
  C("Bleeding piles vs bowel bleeding", "痔の出血と大腸からの出血", "stomach", "moderate", "redblood:3 constip:1 bottompain:1 stoolthin:1 bloodymucus:1", "Bright red blood on paper is usually piles or a small tear. Darker blood mixed in the poo comes from higher up.", ["Note the colour and how much", "Soft poo: fibre and water"], ["borraginol"], "First time, over age 40, blood mixed in poo, mucus, weight loss or change in habits: get a colonoscopy. Japan offers a cheap stool blood test (便潜血検査).", "肛門科 / 消化器内科", 7, "Don't assume blood is piles without a check, even when young."),
  C("Heavy bleeding from the bowel", "大量下血", "stomach", "emergency", "bloodstool:3 faint:2 dizzy:2 pale:2 standdizzy:1", "Heavy bleeding from the colon (diverticula, ulcer, rarely a tumour).", [CALL, "Lie down with legs raised", "Nothing to eat or drink"], [], ER, "救急 (emergency)", 0),

  // ----- Black poo -----
  C("Upper GI bleeding", "上部消化管出血", "stomach", "emergency", "blackstool:3 bloodvomit:3 faint:2 standdizzy:2 pale:2 painkillers:1 alcohol:1", "Bleeding from the stomach, duodenum or oesophagus (ulcer, NSAIDs, alcohol). Blood turns black and tar-like on the way through.", [CALL, "Lie down; don't eat or drink", "Bring your medicines"], [], ER, "救急 (emergency)", 0, "Black, sticky, smelly poo without iron tablets is blood until proven otherwise."),
  C("Black poo from iron tablets (harmless)", "鉄剤による黒色便", "stomach", "mild", "blackiron:3 ironpill:3 constip:1 nausea:1", "Unabsorbed iron turns poo dark green-black. Also bismuth, blueberries, squid ink and lots of seaweed.", ["Normal: keep taking as directed", "Take after meals if your stomach is upset"], [], "If it becomes sticky like tar, smells very bad, or you feel dizzy or faint: that may be bleeding.", "内科 (if unsure)", 1, "Iron poo is formed and dark. Bleeding poo is shiny, sticky tar."),

  // ----- Belly swelling -----
  C("Bloating from gas", "腹部膨満 (ガス)", "stomach", "mild", "bloating:3 swollenbelly:2 gas:2 constip:1 rumble:1", "Gas and slow transit; worse in the evening and after fizzy drinks, beans and wheat.", ["Walk after meals", "Fewer fizzy drinks, gum and sweeteners", "Treat any constipation"], ["wakamoto", "biofermin", "buscopan"], "If the swelling stays all day and night, keeps growing, or with weight loss.", "消化器内科", 3, "Gas bloating comes and goes; a belly that stays big needs a check."),
  C("Fluid in the belly (ascites)", "腹水", "stomach", "serious", "swollenbelly:3 ankleswell:2 yellow:2 breathless:1 alcohol:1 weightloss:1", "Fluid builds up from liver disease, heart or kidney failure, or rarely cancer.", ["Low salt while waiting", "Note your weight daily"], [], "See a doctor this week (today if breathless): needs an ultrasound and blood tests.", "消化器内科 / 内科", 3),
  C("Bowel obstruction", "腸閉塞 (イレウス)", "stomach", "emergency", "noflatus:3 swollenbelly:2 vomit:2 lowerpain:2 constip:1", "Something blocks the bowel: a twist, scar tissue from old surgery, a hernia or a tumour.", [CALL, "Nothing to eat or drink", "No laxatives"], [], ER, "救急 (emergency)", 0),
  C("Visceral belly fat", "内臓脂肪", "stomach", "mild", "swollenbelly:3 alcohol:1 sitting:1", "Fat stored around the organs from extra calories, alcohol, sugary drinks and little movement. Raises diabetes and liver risk.", ["Walk 8,000+ steps a day", "Cut sugary drinks and evening snacks", "Less alcohol"], [], "Ask for a health check (健康診断) with waist, sugar and liver tests. Japan's メタボ waist cut-off for men is 85 cm.", "内科", 90),

  // ----- Constipation types -----
  C("Outlet constipation", "直腸性便秘", "stomach", "mild", "constip:3 analtear:1 bottompain:1 bloating:1", "Poo reaches the bottom but won't come out: from holding it in, hard stool or poor pelvic coordination.", ["Go when you feel the urge; don't hold it", "Footstool under feet, lean forward, elbows on knees", NOSTRAIN], ["lecicarbon", "ichijiku", "magmi"], "If over 3 weeks, with blood, or narrow poo.", "消化器内科 / 肛門科", 7),
  C("Stress or travel constipation", "ストレス・旅行便秘", "stomach", "mild", "constip:3 stress:2 travel:1 bloating:1 lowerpain:1", "Routine changes, fewer meals, less water and nerves slow the gut.", [FLUID, FIBRE, "Warm drink and toilet after breakfast", "Walk daily"], ["magmi", "biofermin"], "If no poo for a week, or with vomiting, swelling or blood.", "内科", 5),

  // ----- Perforation -----
  C("Bowel or stomach perforation", "消化管穿孔", "stomach", "emergency", "rigidbelly:3 fever:2 vomit:1 painkillers:1 upperpain:1", "A hole in the stomach or bowel (from an ulcer, burst appendix or diverticulum) lets gut contents leak into the belly.", [CALL, "Lie still; nothing to eat or drink", "No painkillers until seen"], [], ER, "救急 (emergency)", 0, "Sudden, severe pain with a rock-hard belly that hurts to touch or move is a surgical emergency."),
  C("Diverticulitis", "憩室炎", "stomach", "serious", "lowerpain:3 fever:2 constip:1 nausea:1 diarrhea:1", "Small pouches in the bowel wall get inflamed. In Japan it's often on the right side, so it can look like appendicitis.", ["Liquid diet while sore", REST], ["tylenol"], "See a doctor today for a scan and antibiotics. Hard belly or high fever: call 119.", "消化器内科 / 外科", 7),

  // ----- Liver and pancreas -----
  C("Acute hepatitis", "急性肝炎", "stomach", "serious", "yellow:3 darkpee:2 fatigue:2 nausea:2 rightupper:1 fever:1 rawfood:1 sex:1", "Liver inflammation from viruses (A from raw shellfish, B and C from blood or sex, E from undercooked pork or boar), alcohol or medicines.", ["No alcohol and no unnecessary medicines or supplements", REST, "Don't share razors or toothbrushes"], [], "See a doctor today for blood tests. Confusion or bleeding: call 119.", "消化器内科 / 肝臓内科", 30, "Hepatitis B has a vaccine; ask a clinic if you didn't have it as a child.", true),
  C("Fatty liver", "脂肪肝", "stomach", "mild", "rightupper:3 fatigue:1 swollenbelly:2 alcohol:2", "Fat in the liver from extra weight, sugar, alcohol and little exercise. Usually no symptoms; found on a health check.", ["Lose 5 to 7% of body weight", "Cut sugary drinks, ramen-soup and late-night eating", "Two alcohol-free days a week", "Exercise 150 min a week"], [], "See a doctor if liver tests (AST, ALT, γ-GTP) are high on your health check.", "消化器内科", 90, "Reversible when caught early."),

  // ----- Cancer warning signs -----
  C("Colorectal cancer warning signs", "大腸がんの警告サイン", "stomach", "serious", "stoolthin:3 bloodymucus:2 redblood:2 weightloss:2 fatigue:1 pale:1 lowerpain:1 swollenbelly:1", "Most changes like these are piles, IBS or infection. Bowel cancer is uncommon under 40 but rising, so lasting changes deserve a check.", [CHECK, "Note how long and how often"], [], "See a doctor within 2 weeks for a stool blood test or colonoscopy if poo habits change for over 3 weeks, blood is mixed in, or with weight loss or anaemia.", "消化器内科", 21, "Caught early it is very curable. Japan's 便潜血検査 screening starts at 40."),
  C("Stomach cancer warning signs", "胃がんの警告サイン", "stomach", "serious", "earlyfull:3 upperpain:2 weightloss:2 noappetite:2 blackstool:1 nausea:1 pale:1", "Usually these are dyspepsia or gastritis. Stomach cancer is more common in Japan than elsewhere, mostly after 50 and linked to H. pylori.", [CHECK], [], "See a doctor for an endoscopy if symptoms last over 4 weeks, or now with weight loss, black poo or vomiting.", "消化器内科", 21, "H. pylori treatment lowers the risk. Endoscopy finds early cancer that can be removed through the scope."),
  C("Oesophageal cancer warning signs", "食道がんの警告サイン", "stomach", "serious", "foodstuck:3 weightloss:2 heartburn:1 hoarse:1 smoker:2 alcohol:2", "Food sticking is often reflux narrowing or tension, but with heavy drinking (especially if your face goes red with alcohol) and smoking it needs a check.", [CHECK, "Stop smoking; cut alcohol"], [], "See a doctor for an endoscopy if food sticks for more than 2 weeks.", "消化器内科", 14),
  C("Liver cancer warning signs", "肝臓がんの警告サイン", "stomach", "serious", "rightupper:3 yellow:2 swollenbelly:2 weightloss:2 alcohol:1 fatigue:1", "Very rare in young people without hepatitis B or C or heavy drinking.", [CHECK, "No alcohol until checked"], [], "See a doctor for blood tests and an ultrasound.", "消化器内科", 14),
  C("Pancreatic cancer warning signs", "膵臓がんの警告サイン", "stomach", "serious", "yellow:3 palestool:2 darkpee:2 weightloss:2 upperpain:1 backpain:1 noappetite:1", "Yellow skin with pale poo and dark pee means bile is blocked: most often a gallstone, rarely a tumour. Very rare in young adults.", [CHECK], [], "See a doctor within days for blood tests and a scan.", "消化器内科", 7),
  C("Lung cancer warning signs", "肺がんの警告サイン", "chest", "serious", "longcough:3 coughblood:2 weightloss:2 hoarse:1 smoker:2 breathless:1 chestpain:1", "A long cough is usually post-viral, asthma or reflux. With smoking, weight loss or blood, a chest X-ray is worth getting.", [CHECK, "Stop smoking: Japan's 禁煙外来 is covered by insurance"], [], "See a doctor for a chest X-ray if a cough lasts over 3 weeks; sooner with blood.", "呼吸器内科", 21),
  C("Testicular cancer warning signs", "精巣がんの警告サイン", "urinary", "serious", "testlump:3 testache:2 breastlump:1 backpain:1", "A painless hard lump or swelling in a testicle. It is the most common cancer in men aged 15 to 35, and one of the most curable.", ["Check monthly in a warm shower: roll each testicle gently between fingers", "The soft tube behind the testicle (epididymis) is normal", CHECK], [], "See a urologist within 2 weeks for an ultrasound if you feel any new hard lump.", "泌尿器科", 14, "Over 95% cure rate when found early. Don't be embarrassed; urologists check this every day."),
  C("Thyroid cancer warning signs", "甲状腺がんの警告サイン", "general", "serious", "neckfront:3 hardlump:2 hoarse:1 swallow:1", "Most thyroid lumps (nodules) are harmless. A hard, growing one is worth an ultrasound.", [CHECK], [], "See a doctor for an ultrasound if a neck lump lasts over 3 weeks; sooner if hoarse.", "内分泌内科 / 甲状腺外来", 21, "Thyroid cancer is usually slow and very treatable."),
  C("Melanoma warning signs", "悪性黒色腫 (メラノーマ) の警告サイン", "skin", "serious", "mole:3 itch:1", "Check moles with ABCDE: Asymmetry, uneven Border, several Colours, Diameter over 6 mm, Evolving. In Japanese people it often appears on the soles, palms or under a nail.", [CHECK, "Photograph it next to a ruler to track changes", "Sunscreen and avoid sunburn"], [], "See a dermatologist for a dermoscopy check if a mole changes, bleeds, or a dark streak appears under a nail.", "皮膚科", 14),
  C("Lymphoma warning signs", "悪性リンパ腫の警告サイン", "general", "serious", "glands:3 sweats:2 weightloss:2 fever:1 fatigue:1 hardlump:2 itch:1", "Swollen glands are almost always from infection. Painless, rubbery glands that keep growing over weeks, with night sweats or weight loss, need a check.", [CHECK, "Note the size every week"], [], "See a doctor if a gland is over 1.5 cm, lasts over 4 weeks, or with drenching night sweats or weight loss.", "内科 / 血液内科", 28),
  C("Leukaemia warning signs", "白血病の警告サイン", "general", "serious", "bruise:3 pale:2 fatigue:2 fever:2 sweats:1 glands:1 gumbleed:1", "Unexplained bruising, tiny red spots, constant tiredness and repeated infections can come from blood-cell problems. Usually something simpler, but a blood test is quick.", [CHECK], [], "See a doctor this week for a full blood count; today if bleeding won't stop or you have high fever.", "内科 / 血液内科", 7),

  // ----- Lumps -----
  C("Lipoma (fatty lump)", "脂肪腫", "skin", "mild", "lump:3", "A soft, rubbery, slow-growing lump of fat under the skin that moves when pushed. Harmless.", ["Leave it alone unless it bothers you"], [], "If it's hard, fixed, painful, growing fast, or over 5 cm.", "形成外科 / 皮膚科", 365),
  C("Epidermoid cyst (sebaceous cyst)", "粉瘤 (アテローム)", "skin", "mild", "lump:3 redswollen:1 acne:1", "A small sac under the skin filled with keratin, often with a tiny dark hole on top. Can smell and get infected.", ["Don't squeeze it", "Warm compress if it gets sore"], ["oronine"], "If it becomes red, hot and painful (infected), or you want it removed (a small operation).", "形成外科 / 皮膚科", 30),
  C("Swollen glands from infection", "反応性リンパ節腫脹", "general", "mild", "glands:3 sorethroat:2 fever:1 toothache:1 earache:1", "Lymph nodes swell while fighting a nearby infection (throat, tooth, skin). Usually soft and tender.", [REST, "Treat the infection; they shrink over 2 to 4 weeks"], ["tylenol"], "If over 4 weeks, hard and painless, over 2 cm, or with night sweats and weight loss.", "内科 / 耳鼻咽喉科", 21),
  C("Ganglion cyst", "ガングリオン", "body", "mild", "lump:3 jointpain:1", "A jelly-filled lump near a wrist or finger joint. Harmless; it can come and go.", ["Leave it; don't hit it with a book"], [], "If it hurts, causes numbness, or you want it drained.", "整形外科", 90),
  C("Inguinal hernia", "鼠径ヘルニア", "urinary", "moderate", "groinbulge:3 testache:1", "Gut pushes through a weak spot in the groin, often after lifting or coughing.", ["Avoid heavy lifting", "Push it back gently lying down"], [], "See a surgeon; it's fixed with a short operation. Hard, painful and won't go back: call 119.", "外科 / 消化器外科", 30),
  C("Strangulated hernia", "嵌頓ヘルニア", "urinary", "emergency", "stuckbulge:3 vomit:2 lowerpain:2 groinbulge:1", "Gut gets trapped in a hernia and its blood supply is cut.", [CALL, "Don't force it back", "Nothing to eat or drink"], [], ER, "救急 (emergency)", 0),
  C("Male breast swelling (gynaecomastia)", "女性化乳房", "general", "mild", "breastlump:3 steroids:1", "Hormone shifts in puberty, weight gain, some medicines, steroids or cannabis. Common in teens and usually fades.", ["Stop any steroid or supplement products", "Weight loss helps the fatty type"], [], "If one-sided and hard, growing, with nipple discharge, or with a testicle lump.", "乳腺外科 / 内分泌内科", 90),

  // ----- Stress -----
  C("Acute stress reaction", "急性ストレス反応", "mind", "moderate", "traumaevent:3 anxious:2 insomnia:2 palpit:1 poorfocus:1 lowmood:1", "A normal reaction to an accident, assault, loss or disaster: shock, numbness, racing heart, poor sleep for days to weeks.", ["Talk to someone you trust", "Keep basic routine: food, sleep, light exercise", "Avoid alcohol to cope", "Limit replaying news or videos"], [], "If it lasts over 4 weeks, or you can't work, sleep or feel safe.", "心療内科 / 精神科", 14),
  C("PTSD", "心的外傷後ストレス障害 (PTSD)", "mind", "moderate", "traumaevent:3 insomnia:2 anxious:2 lowmood:1 poorfocus:1", "After a frightening event: flashbacks, nightmares, avoiding reminders and feeling on edge for over a month.", ["Grounding: name 5 things you see, 4 you hear", "Keep safe routines"], [], "See a doctor: trauma-focused therapy works well.", "精神科 / 心療内科", 60),
  C("Adjustment disorder", "適応障害", "mind", "moderate", "stress:3 lowmood:2 anxious:2 insomnia:1 poorfocus:1 fatigue:1", "Strong stress reaction to a specific change: new job, boss, moving to Japan, breakup. Symptoms ease when away from the stressor.", ["Name the stressor; can anything change?", "Take leave if possible: a doctor's note (診断書) allows sick leave", "Keep exercise, sleep and friends"], ["hangekobokuto"], "If you can't go to work or school, or feel hopeless.", "心療内科", 30, "One of the most common reasons for sick leave in Japan."),
  C("Burnout syndrome", "燃え尽き症候群", "mind", "moderate", "fatigue:3 stress:2 lowmood:2 poorfocus:2 insomnia:1", "Long overwork without recovery: emotional exhaustion, cynicism about work, and feeling ineffective.", ["Real days off with no work messages", "Talk to your manager or the company 産業医 (occupational doctor)", "Sleep, daylight, movement"], [], "If it lasts weeks or you dread every day: see a doctor.", "心療内科 / 産業医", 30),

  // ----- Mind -----
  C("Social anxiety", "社交不安障害", "mind", "moderate", "socialfear:3 anxious:2 palpit:1 sweats:1", "Intense fear of being judged or embarrassed, leading to avoiding people.", ["Small, gradual steps into feared situations", "Slow breathing before events"], [], "If it stops you working, studying or making friends: therapy (CBT) and medicine help.", "心療内科 / 精神科", 60),
  C("OCD", "強迫性障害", "mind", "moderate", "worryloop:3 anxious:2 stress:1", "Unwanted, distressing thoughts (germs, harm, order) and repeated actions to calm them (washing, checking).", ["Delay a ritual by a few minutes and notice the anxiety fade"], [], "If it takes over an hour a day: see a doctor. CBT and medicine work well.", "精神科 / 心療内科", 60),
  C("ADHD signs", "ADHD (注意欠如・多動症) の傾向", "mind", "mild", "restless:3 poorfocus:3 sleepy:1 stress:1", "A lifelong difference in attention and impulse control. Signs started in childhood: losing things, missing deadlines, restlessness.", ["Use phone reminders and lists", "Break tasks into short blocks", "Regular sleep and exercise"], [], "If it causes trouble at work or relationships, ask for an adult ADHD assessment.", "精神科 (成人ADHD外来)", 90),
  C("Health anxiety", "病気不安症", "mind", "mild", "anxious:3 worryloop:2 palpit:1", "Worrying a lot about having a serious illness despite reassurance; checking the body and searching symptoms.", ["Limit symptom searching to once a day", "Notice how worry makes body feelings stronger"], [], "If the worry takes over: CBT helps.", "心療内科", 30, "Using this app a lot? That's OK, but notice if it makes you calmer or more worried."),
  C("Hyperventilation", "過換気症候群 (過呼吸)", "mind", "mild", "overbreath:3 anxious:2 numb:1 palpit:1 dizzy:1 chestpain:1", "Breathing too fast from panic or stress lowers CO2, causing tingling, dizziness and tight hands.", ["Breathe slowly: in 4 seconds, out 6 to 8 seconds", "Sit down; it passes in minutes", "No paper bag"], [], "If it's the first time, with chest pain at rest or breathlessness that doesn't settle: get checked.", "心療内科 / 内科", 1),
  C("Bipolar warning signs", "双極性障害の兆候", "mind", "serious", "hyper:3 insomnia:1 lowmood:2 poorfocus:1", "Periods of unusually high energy and little need for sleep, spending or risk-taking, alternating with depression.", ["Protect sleep", "Avoid alcohol and drugs", "Ask someone you trust to tell you if you seem 'too high'"], [], "See a psychiatrist; mood stabilisers work well. Antidepressants alone can make it worse.", "精神科", 30),
  C("Psychosis warning signs", "精神病症状の兆候", "mind", "serious", "hearvoices:3 insomnia:1 anxious:1 confused:1", "Hearing voices or feeling watched can come from stress, lack of sleep, drugs or a mental illness.", ["Sleep; avoid cannabis, stimulants and alcohol", "Tell someone you trust"], [], "See a psychiatrist soon. If you feel in danger or might hurt yourself or others: call 119.", "精神科", 7, "Early treatment gives the best recovery."),
  C("Drinking too much", "アルコール使用障害", "mind", "moderate", "alcohol:3 cantstop:3 lowmood:1 insomnia:1", "Needing more to feel it, drinking alone, failed attempts to cut down.", ["Alcohol-free days; track drinks", "Swap for non-alcoholic beer"], [], "If you can't cut down, or get shaky or sweaty without alcohol: see a doctor. Sudden stopping after heavy daily drinking can be dangerous.", "精神科 (アルコール外来)", 30),
  C("Gaming or phone overuse", "ゲーム・スマホ依存", "mind", "mild", "cantstop:3 screen:2 insomnia:1 poorfocus:1", "Use that grows despite harming sleep, work or relationships.", ["Set app limits", "Phone out of the bedroom", "Plan offline activities"], [], "If you can't cut down and it hurts your life: Japan has internet addiction clinics (ネット依存外来).", "精神科 / 心療内科", 30),

  // ----- Hormones -----
  C("Overactive thyroid (Graves')", "甲状腺機能亢進症 (バセドウ病)", "general", "moderate", "heatintol:3 palpit:2 weightloss:2 sweats:1 anxious:1 neckfront:1 insomnia:1", "The thyroid makes too much hormone, often from an immune condition. Speeds everything up.", ["Avoid lots of iodine (kombu, kelp)", "Avoid energy drinks"], [], "See a doctor for a blood test (TSH, FT4).", "内分泌内科 / 甲状腺外来", 30),
  C("Underactive thyroid (Hashimoto's)", "甲状腺機能低下症 (橋本病)", "general", "moderate", "coldintol:3 fatigue:2 constip:1 dryskin:1 lowmood:1 hairloss:1 neckfront:1", "The thyroid makes too little hormone. Slows everything down.", ["Don't overdo seaweed/kombu (excess iodine)"], [], "See a doctor for a blood test. One small daily tablet replaces the hormone.", "内分泌内科", 30),
  C("Low testosterone", "テストステロン低下 (LOH症候群)", "urinary", "moderate", "lowlibido:3 edsym:2 fatigue:2 lowmood:1 poorfocus:1", "Low male hormone from obesity, poor sleep, chronic stress, heavy drinking, past steroid use or rarely a pituitary problem.", ["Sleep 7 to 8 h", "Strength training", "Lose weight", "Less alcohol"], [], "See a doctor for a morning blood test.", "泌尿器科 (男性更年期外来) / 内分泌内科", 30, "Truly low testosterone is uncommon in young men; stress and sleep are more often the cause."),
  C("Anabolic steroid side effects", "筋肉増強剤の副作用", "general", "moderate", "steroids:3 acne:2 breastlump:1 testache:1 lowlibido:1 anxious:1 palpit:1", "External testosterone shuts down your own production: shrunken testicles, acne, breast growth, mood swings, high blood pressure and liver strain.", ["Don't stop suddenly or restart without advice"], [], "See a doctor for blood pressure, liver, blood count and hormone tests. Chest pain: call 119.", "泌尿器科 / 内分泌内科", 30),
  C("Cortisol excess (Cushing's)", "クッシング症候群の疑い", "general", "moderate", "purplestretch:3 swollenbelly:1 bruise:1 fatigue:1 lowmood:1", "Too much cortisol, from steroid medicines or rarely a gland tumour: round face, belly fat, wide purple stretch marks, thin skin.", ["Don't stop prescribed steroid tablets suddenly"], [], "See a doctor for tests.", "内分泌内科", 30),
  C("Low cortisol (adrenal insufficiency)", "副腎不全", "general", "serious", "standdizzy:3 fatigue:2 weightloss:1 nausea:1 faint:1", "The adrenal glands don't make enough cortisol, or long steroid treatment was stopped suddenly.", ["Salty snacks and fluids while waiting"], [], "See a doctor soon. Vomiting with collapse: call 119.", "内分泌内科", 7),
  C("PCOS", "多嚢胞性卵巣症候群", "urinary", "moderate", "irregperiod:3 acne:2 hairloss:1", "A common hormone imbalance in women: irregular periods, acne, extra hair, weight gain.", ["Exercise and weight control help hormones"], [], "See a gynaecologist for an ultrasound and blood test.", "婦人科", 30),
  C("Prediabetes", "境界型糖尿病 (予備群)", "general", "mild", "thirsty:3 swollenbelly:2 fatigue:1 sitting:1", "Blood sugar higher than normal but not yet diabetes. Very reversible.", ["Walk after meals", "Swap white rice for half brown or barley rice; cut sugary drinks"], [], "Retest HbA1c yearly; see a doctor if 6.5% or more.", "内科", 90),
  C("Low blood sugar", "低血糖", "general", "moderate", "shakyhungry:3 sweats:2 palpit:1 confused:2 dizzy:1", "Sugar drops after skipping meals, heavy exercise, alcohol, or diabetes medicine.", ["Take 15 g sugar now: juice, glucose tablets, sweets", "Then a meal with carbs"], [], "If it happens without diabetes medicine, or keeps happening: see a doctor. Confused or can't swallow: call 119.", "内科 / 糖尿病内科", 1),
  C("Diabetic ketoacidosis", "糖尿病性ケトアシドーシス", "general", "emergency", "dkabreath:3 thirsty:2 vomit:2 oftenpee:2 confused:1 weightloss:1", "Very high sugar with no insulin: the body burns fat and the blood turns acidic. Can be the first sign of type 1 diabetes.", [CALL, "Sip water if able"], [], ER, "救急 (emergency)", 0),

  // ----- Sexual health (male) -----
  C("Morning erection (normal)", "朝立ち (夜間勃起)", "urinary", "mild", "morningwood:3", "During REM sleep the body naturally causes 3 to 5 erections a night. Waking during one gives a morning erection. It's a reflex, not related to dreams or arousal.", ["Normal and healthy: it shows blood vessels and nerves work", "It goes away by itself; peeing helps"], [], "Only if it is painful and lasts over 4 hours (that's priapism: call 119).", "None needed", 0, "Fewer morning erections can follow poor sleep, alcohol, stress or low testosterone. Having them when you also struggle with erections during sex suggests the cause is stress or nerves, not physical."),
  C("Strong sex drive / frequent masturbation (normal)", "性欲が強い・自慰の頻度", "urinary", "mild", "highlibido:3 morningwood:1", "Testosterone peaks in the late teens and 20s, so strong desire is normal. Masturbation, even daily, doesn't harm health, fertility, muscles or eyesight.", ["No set 'right' number exists", "Good hygiene and gentle technique avoid skin soreness", "Exercise, sleep and hobbies are healthy outlets too"], [], "Only if it is causing distress, harming your work or relationships, or you can't stop when you want to.", "None needed (泌尿器科 or 心療内科 if worried)", 0, "It becomes a problem when it feels compulsive: hours a day, using it to escape stress, missing commitments, or needing more extreme content."),
  C("Compulsive sexual behaviour", "強迫的性行動症 (性依存)", "mind", "moderate", "highlibido:3 cantstop:3 porn:2 stress:1 lowmood:1", "Sexual urges or porn use that feel out of control and continue despite harm. Often linked to stress, loneliness, anxiety or ADHD.", ["Notice triggers (boredom, stress, late nights)", "Phone out of the bedroom, content blockers", "Replace with exercise or calling a friend", "Shame makes it worse; be kind to yourself"], [], "If it harms your life and you can't cut down, a counsellor or psychiatrist can help (CBT).", "精神科 / 心療内科", 60),
  C("Porn-related erection difficulty", "ポルノ関連の勃起障害", "urinary", "mild", "edsym:3 porn:3 morningwood:2 highlibido:1", "Frequent intense porn can make real-life arousal harder. Morning erections and erections with porn usually remain normal.", ["Take a 2 to 3 month break from porn", "Less frequent masturbation, with less intense stimulation", "Focus on touch and relaxation with a partner"], [], "If no better after 3 months, or no morning erections either.", "泌尿器科", 90),
  C("Premature ejaculation", "早漏", "urinary", "mild", "earlyej:3 anxious:2 stress:1", "Very common, often from anxiety, high sensitivity or habits of rushing. Not a disease.", ["Stop-start technique: pause before the point of no return", "Pelvic floor exercises", "Thicker condoms or a second round", "Talk with your partner; pressure makes it worse"], [], "If it causes distress: a urologist has treatments (some prescription options in Japan).", "泌尿器科", 30),
  C("Erectile dysfunction", "勃起不全 (ED)", "urinary", "mild", "edsym:3 anxious:1 stress:1 smoker:1 alcohol:1 lowlibido:1", "In young men usually performance anxiety, stress, tiredness or alcohol. Physical causes (diabetes, vessel disease, hormones) become more likely with age, smoking or weight.", ["Less alcohol before sex", "Sleep, exercise, stop smoking", "Remove pressure: focus on touch"], [], "If it happens most of the time for over 3 months. Prescription tablets (sildenafil, tadalafil) are available at clinics; don't buy them online (fakes are common).", "泌尿器科 / ED外来", 30, "ED can be an early sign of heart or blood sugar problems, so a check is worth it."),
  C("Priapism", "持続勃起症", "urinary", "emergency", "priapism:3 testache:1", "An erection that won't go down, from medicines, ED injections or blood conditions.", [CALL, "Don't wait: damage starts after 4 to 6 hours"], [], ER, "救急 (emergency) / 泌尿器科", 0),
  C("Varicocele", "精索静脈瘤", "urinary", "mild", "testache:3 sitting:1 sport:1", "Swollen veins above a testicle (usually the left), feels like a 'bag of worms'. Aches after standing or exercise. Common: about 15% of men.", ["Supportive underwear", "Lie down when it aches"], ["tylenol"], "See a urologist if it aches a lot, the testicle is smaller, or you're trying for a baby.", "泌尿器科", 90),
  C("Epididymitis", "精巣上体炎", "urinary", "moderate", "testache:3 fever:2 burnpee:1 uretdisch:1 sex:1", "Infection of the tube behind the testicle, often from chlamydia or gonorrhoea in young men. Builds up over a day or two.", ["Supportive underwear, ice pack wrapped in a towel", REST], ["tylenol", "eve"], "See a doctor today for antibiotics. Sudden severe pain: torsion, call 119.", "泌尿器科", 14),
  C("Testicular torsion", "精巣捻転", "urinary", "emergency", "testpain:3 vomit:2 nausea:1 lowerpain:1", "The testicle twists on its cord and loses blood supply. Most common age 12 to 25, often at night or after sport.", [CALL, "Go to the ER now, don't wait for the pain to settle"], [], "EMERGENCY: call 119. Surgery within 6 hours saves the testicle.", "救急 / 泌尿器科", 0),
  C("Balanitis", "亀頭包皮炎", "urinary", "mild", "penisred:3 itchgenital:2 uretdisch:1", "Irritation or infection (often yeast) of the head of the penis; more common with a tight foreskin, diabetes or harsh soap.", ["Wash gently with warm water daily, dry well", "No strong soaps", "Use a condom until healed"], [], "If it doesn't clear in a week, or with sores or discharge: a doctor can give the right cream.", "泌尿器科 / 皮膚科", 7),

  // ----- STIs -----
  C("Chlamydia", "クラミジア感染症", "urinary", "moderate", "uretdisch:3 burnpee:2 sex:2 testache:1", "The most common STI in Japan. Clear or white discharge and mild burning; often no symptoms at all.", [SAFE, TEST], [], "See a doctor for a urine test; one course of antibiotics cures it. Partners need treatment too.", "泌尿器科 / 性病科", 7, undefined, true),
  C("Gonorrhoea", "淋菌感染症 (淋病)", "urinary", "moderate", "uretdisch:3 burnpee:3 sex:2 sorethroat:1", "Thick yellow-green discharge and strong burning, 2 to 7 days after sex. Can infect the throat from oral sex.", [SAFE, TEST], [], "See a doctor; it needs an injection because many strains resist tablets.", "泌尿器科 / 性病科", 7, undefined, true),
  C("Genital herpes", "性器ヘルペス", "urinary", "moderate", "genitalblister:3 burnpee:1 fever:1 glands:1 sex:1", "A virus causing painful blisters and sores; first outbreak can come with fever. It can return with stress.", ["Keep the area clean and dry", "Loose cotton underwear", SAFE], ["tylenol"], "See a doctor within 72 h for antiviral tablets.", "泌尿器科 / 皮膚科", 10, undefined, true),
  C("Syphilis", "梅毒", "urinary", "moderate", "genitalsore:3 rash:2 glands:1 sex:2 fever:1", "Cases have risen sharply in Japan. Starts as a painless sore; weeks later a rash (often palms and soles) appears. Symptoms fade but the infection stays.", [SAFE, TEST], [], "See a doctor for a blood test. Penicillin cures it.", "泌尿器科 / 皮膚科 / 性病科", 14, undefined, true),
  C("Genital warts", "尖圭コンジローマ", "urinary", "mild", "genitalbump:3 sex:2", "HPV causes small skin-coloured bumps. Harmless but catching.", ["Don't use wart remover on genitals", "Condoms reduce spread"], [], "See a doctor for creams or freezing. HPV vaccine (now offered to boys in some areas) prevents it.", "泌尿器科 / 皮膚科", 60, undefined, true),
  C("HIV — when to test", "HIV検査のすすめ", "urinary", "moderate", "sex:3 fever:2 rash:2 glands:2 sorethroat:1 fatigue:1", "2 to 4 weeks after infection some people get a flu-like illness with rash; many have no symptoms.", [TEST, "Condoms every time"], [], "Test 4 weeks after a risk and again at 3 months. Within 72 h of a high-risk event, ask a hospital about PEP. Treatment today gives a normal life span.", "保健所 / 感染症内科", 28),

  // ----- Urinary -----
  C("Acute prostatitis", "急性前立腺炎", "urinary", "serious", "weakstream:3 fever:3 burnpee:2 chills:2 oftenpee:1", "Bacterial infection of the prostate: high fever, pain between the legs and painful peeing.", [FLUID, REST], ["tylenol"], "See a doctor today for antibiotics. Can't pee at all: go to the ER.", "泌尿器科", 14),
  C("Chronic pelvic pain (prostatitis)", "慢性前立腺炎", "urinary", "mild", "weakstream:3 sitting:2 stress:1 oftenpee:1", "Long-lasting ache in the pelvis, between the legs or after ejaculation, often linked to sitting, cold and tension, without infection.", ["Avoid long sitting; use a cushion with a hole", "Warm baths", "Less alcohol, spicy food and coffee", "Pelvic relaxation stretches"], ["tylenol"], "See a urologist to rule out infection.", "泌尿器科", 60),
  C("Kidney infection", "腎盂腎炎", "urinary", "serious", "sidepain:3 fever:3 chills:2 burnpee:2 vomit:1", "A bladder infection that climbs to the kidney.", [FLUID, REST], ["tylenol"], "See a doctor today: needs antibiotics, sometimes a drip. Very unwell or confused: call 119.", "内科 / 泌尿器科", 7),
  C("Urine retention", "尿閉", "urinary", "emergency", "cantpee:3 lowerpain:2 weakstream:1", "The bladder can't empty: from prostate swelling, some cold or allergy medicines, alcohol or nerve problems.", [CALL, "Don't take more cold medicine", "A warm bath may help start flow while you wait"], [], "EMERGENCY: go to an ER or call 119 to have the bladder drained.", "救急 / 泌尿器科", 0),
  C("Muscle breakdown (rhabdomyolysis)", "横紋筋融解症", "body", "serious", "darkpee:3 sorework:2 heatexp:1 sport:1 bodyache:1", "Extreme exercise, heat or crush injury breaks muscle down and the protein clogs the kidneys.", ["Drink a lot of water now", "Stop exercising"], [], "See a doctor today for blood tests. Little or no pee: go to ER.", "内科 / 救急", 3),

  // ----- Chest and blood -----
  C("Pulmonary embolism", "肺塞栓症 (エコノミークラス症候群)", "chest", "emergency", "suddenbreath:3 legswell:2 chestpain:2 palpit:1 coughblood:1 travel:1 sitting:1", "A blood clot travels to the lungs, often from a leg vein after a long flight, bed rest or injury.", [CALL, "Sit up, stay calm"], [], ER, "救急 (emergency)", 0),
  C("Collapsed lung (pneumothorax)", "気胸", "chest", "emergency", "suddenbreath:3 chestpain:2 breathless:2 smoker:1", "Air leaks around a lung so it partly collapses. Classic in tall, thin young men, often at rest.", [CALL, "Sit upright, avoid exertion"], [], ER, "救急 / 呼吸器外科", 0, "Small ones may only need watching, but only a doctor with an X-ray can say. No flying or diving until cleared."),
  C("Chest wall pain (costochondritis)", "肋軟骨炎・胸壁痛", "chest", "mild", "chestpress:3 chestpain:2 sorework:1 cough:1", "Strain or inflammation of rib joints and muscles, after coughing, workouts or carrying. Hurts to press and on twisting.", ["Warm compress", "Avoid heavy chest workouts for a couple of weeks"], ["eve", "salonpas"], "Any crushing chest pain, pain with breathlessness or sweating, or pain on exertion: call 119 to rule out the heart.", "内科 / 整形外科", 14),
  C("Pericarditis / myocarditis", "心膜炎・心筋炎", "chest", "serious", "chestpain:3 fever:2 palpit:2 breathless:1 sickcontact:1", "Inflammation around or in the heart, usually after a viral illness. Sharp chest pain, worse lying flat, better leaning forward.", [REST, "No exercise until cleared"], [], "See a doctor today for an ECG. Breathlessness or fainting: call 119.", "循環器内科", 14),
  C("Tuberculosis", "結核", "chest", "serious", "longcough:3 sweats:2 weightloss:2 fever:1 coughblood:2 fatigue:1", "A bacterial lung infection still seen in Japan, spread by coughing in close quarters.", ["Wear a mask until checked"], [], "See a doctor for a chest X-ray if a cough lasts over 2 to 3 weeks with sweats or weight loss.", "呼吸器内科", 30, undefined, true),
  C("Whooping cough", "百日咳", "chest", "moderate", "longcough:3 nightcough:2 vomit:1 sickcontact:1", "Bacterial infection with bouts of hard coughing, sometimes a 'whoop' or vomiting after. Adults' childhood vaccine has worn off.", ["Mask; keep away from babies", REST], [], "See a doctor; antibiotics in the first weeks reduce spread.", "内科 / 呼吸器内科", 42, undefined, true),
  C("Post-viral cough", "感染後咳嗽", "chest", "mild", "longcough:3 cough:2 nightcough:1", "After a cold the airways stay sensitive for 3 to 8 weeks.", ["Honey in warm water", "Humid room", "No smoking"], ["ryukakusan", "bron"], "If over 8 weeks, with blood, weight loss or breathlessness.", "内科", 30),
  C("Sepsis", "敗血症", "general", "emergency", "sepsisskin:3 fever:2 confused:2 chills:2 breathless:1 palpit:1", "The body's overwhelming reaction to an infection (from lungs, urine, skin or gut). It can worsen within hours.", [CALL, "Say: 'I think this could be sepsis'"], [], ER, "救急 (emergency)", 0, "Warning signs: slurred speech or confusion, extreme shivering, no pee in a day, severe breathlessness, mottled skin."),
  C("Brain bleed (subarachnoid)", "くも膜下出血", "head", "emergency", "worsthead:3 vomit:2 stiffneck:2 confused:2 faint:1", "A burst blood vessel on the brain. Thunderclap headache reaching full strength within a minute.", [CALL, "Lie still; don't take aspirin"], [], ER, "救急 / 脳神経外科", 0),
  C("Bleeding after head injury", "頭部外傷後の出血 (硬膜下血腫)", "head", "emergency", "confused:3 headinjury:3 vomit:2 headache:2 weakside:1", "Bleeding under the skull can build up over hours to weeks after a knock, especially with alcohol or blood thinners.", [CALL, "Don't leave the person alone"], [], ER, "救急 / 脳神経外科", 0),
  C("Post-concussion syndrome", "脳振とう後症候群", "head", "mild", "headinjury:3 headache:2 poorfocus:2 dizzy:1 insomnia:1 lightsens:1", "Headache, poor focus and fatigue lasting weeks after a concussion.", ["Gentle daily activity; build up slowly", "Short screen sessions with breaks", "No contact sport until cleared"], ["tylenol"], "If over 4 weeks, worsening, or with vomiting or confusion (go now).", "脳神経外科 / 脳神経内科", 30),

  // ----- Headache variants -----
  C("Cluster headache", "群発頭痛", "head", "moderate", "eyestab:3 headache:2 runnynose:1 redeye:1 alcohol:1 smoker:1", "Extremely severe pain round one eye lasting 15 min to 3 hours, often at the same time each night, for weeks. Mostly young men who smoke.", ["No alcohol during a cluster period (sets it off)", "Breathing pure oxygen helps (prescribed)"], [], "See a headache clinic: triptan injections and oxygen work; normal painkillers don't.", "脳神経内科 / 頭痛外来", 30),
  C("Vestibular migraine", "前庭性片頭痛", "head", "moderate", "dizzy:3 headache:2 lightsens:2 nausea:1 motion:1", "Migraine that shows as dizziness or spinning, with or without headache.", ["Regular sleep and meals", "Track triggers"], ["travelmin"], "See a headache clinic. Sudden dizziness with weakness or slurred speech: call 119.", "脳神経内科 / 頭痛外来", 3),
  C("Medication-overuse headache", "薬物乱用頭痛", "head", "moderate", "painkillers:3 headache:3", "Taking painkillers on 10+ days a month makes headaches more frequent.", ["Keep a headache diary", "Cut painkiller days to under 10 a month (expect a hard 1 to 2 weeks)"], [], "See a headache clinic for a withdrawal plan and preventive medicine.", "頭痛外来", 30),
  C("Caffeine withdrawal headache", "カフェイン離脱頭痛", "head", "mild", "caffeine:3 headache:2 fatigue:1 poorfocus:1", "Skipping your usual coffee or energy drinks causes a dull headache within 12 to 24 hours.", ["Cut down slowly: a quarter less each week", "A small coffee eases it"], ["tylenol"], "Only if it is severe or lasts over a week.", "None needed", 5),
  C("Too much caffeine", "カフェインの過剰摂取", "chest", "moderate", "caffeine:3 palpit:2 anxious:2 insomnia:2 nausea:1", "Energy drinks plus coffee can exceed 400 mg a day. Overdose (tablets, many cans) is dangerous.", ["Stop caffeine for the day", FLUID], [], "Chest pain, fainting or a very fast heartbeat: call 119.", "内科", 1),

  // ----- Muscles, joints, back -----
  C("Muscle strain", "肉離れ・筋挫傷", "body", "mild", "muscpull:3 sport:2 sorework:1", "Muscle fibres tear when stretched while contracting: hamstring, calf, back.", [RICE, "Compression bandage", "Gentle stretching after 3 days, no sprints for 2 to 4 weeks"], ["feitas", "loxtape", "eve"], "If you can't walk, there's a dent or big bruise, or it doesn't improve in 2 weeks.", "整形外科", 21),
  C("Tendinitis", "腱炎", "body", "mild", "tendon:3 sport:2 jointpain:1", "Overuse inflames a tendon: Achilles, wrist, shoulder, knee.", [RICE, "Cut training load by half, then build up 10% a week"], ["feitas", "vantelin", "eve"], "If it lasts over 3 weeks, or the Achilles suddenly snaps (feels like a kick): go today.", "整形外科", 21),
  C("Tennis elbow", "テニス肘 (上腕骨外側上顆炎)", "body", "mild", "elbowpain:3 tendon:1", "Overuse of forearm muscles from gripping: mouse, tools, racket sports.", ["Grip with palm up when lifting", "Elbow strap", "Gentle forearm stretches"], ["vantelin", "feitas"], "If over 6 weeks or numbness in fingers.", "整形外科", 42),
  C("Runner's knee", "膝蓋大腿疼痛症候群 (ランナー膝)", "body", "mild", "kneepain:3 sport:2", "Overloading the knee, weak hips or thighs, worn shoes. Also IT band pain on the outside.", ["Reduce running, swap to cycling or swimming", "Strengthen thighs and hips", "Check shoes"], ["vantelin", "feitas"], "If the knee swells, locks or gives way.", "整形外科 / スポーツ整形", 42),
  C("Shin splints", "シンスプリント", "body", "mild", "shinpain:3 sport:2", "Overuse of the shin from running too much too soon or hard surfaces.", ["Rest from running 2 weeks", "Ice", "Gradual return"], ["feitas"], "If one spot is very painful to press (stress fracture).", "整形外科", 21),
  C("Plantar fasciitis", "足底筋膜炎", "body", "mild", "heelpain:3 sport:1", "Strain of the band under the foot.", ["Stretch calves and roll a bottle under the foot", "Cushioned shoes"], ["feitas"], "If over 6 weeks.", "整形外科", 60),
  C("Shoulder impingement", "肩インピンジメント・腱板炎", "body", "mild", "shoulderpain:3 sport:1", "Shoulder tendons get pinched lifting overhead: gym, swimming, volleyball.", ["Avoid overhead lifting for 2 weeks", "Gentle shoulder rolls"], ["feitas", "vantelin"], "If you can't lift the arm, or after a fall.", "整形外科", 30),
  C("Osteoarthritis", "変形性関節症", "body", "mild", "jointpain:3 kneepain:2 morningstiff:1", "Cartilage wears with age, injuries or weight. Stiffness under 30 min, worse after use.", ["Keep moving: walking, cycling, swimming", "Strengthen the muscles round the joint", "Lose weight"], ["voltaren", "vantelin"], "If it locks, gives way, or wakes you at night.", "整形外科", 90),
  C("Rheumatoid arthritis", "関節リウマチ", "body", "moderate", "morningstiff:3 jointswell:3 jointpain:2 fatigue:1", "Immune inflammation of joints, often small hand joints on both sides, with morning stiffness over 30 minutes.", ["Warm water for stiff hands", "Gentle movement"], ["eve"], "See a rheumatologist soon: early treatment prevents damage.", "リウマチ科 / 膠原病内科", 30),
  C("Ankylosing spondylitis", "強直性脊椎炎", "body", "moderate", "morningstiff:3 backpain:3 heelpain:1 fatigue:1", "Inflammatory back pain in young men: worse in the morning and at rest, better with exercise.", ["Daily stretching and swimming"], ["eve"], "See a rheumatologist if back pain lasts over 3 months.", "リウマチ科 / 整形外科", 90),
  C("Septic arthritis", "化膿性関節炎", "body", "serious", "jointswell:3 fever:3 bonepain:2", "Infection inside a joint: hot, swollen, very painful joint with fever.", ["Don't use the joint"], [], "See a doctor today.", "整形外科 / 救急", 1),
  C("Herniated disc", "椎間板ヘルニア", "body", "moderate", "legshoot:3 backpain:2 numb:1 tingfeet:2", "A disc in the lower back bulges and presses a nerve.", ["Stay gently active", "Avoid heavy lifting"], ["loxonin", "loxtape"], "See a doctor if leg weakness or worsening. Numbness between legs: call 119.", "整形外科", 42),
  C("Sciatica from sitting", "坐骨神経痛 (梨状筋症候群)", "body", "mild", "legshoot:3 sitting:2 backpain:1", "Tight muscles in the buttock press the sciatic nerve.", ["Get up every 30 to 60 minutes", "Stretch the buttock"], ["loxtape", "eve"], "If weakness, or over 6 weeks.", "整形外科", 30),
  C("Cauda equina syndrome", "馬尾症候群", "body", "emergency", "saddle:3 backpain:2 legshoot:2 cantpee:2", "Severe nerve compression at the bottom of the spine.", [CALL], [], "EMERGENCY: call 119. Surgery within hours.", "救急 / 整形外科", 0),
  C("Restless legs", "むずむず脚症候群", "body", "mild", "restlegs:3 insomnia:2", "Urge to move the legs at night.", ["Less caffeine and alcohol", "Stretch legs before bed"], [], "See a doctor; check iron levels.", "脳神経内科 / 睡眠外来", 30),

  // ----- Vitamins -----
  C("Vitamin B12 deficiency", "ビタミンB12欠乏症", "general", "moderate", "tingfeet:3 fatigue:2 pale:2 mouthsore:1 poorfocus:1", "Low B12 from a vegan diet, stomach surgery, gastritis or some medicines.", ["Eat fish, meat, eggs, dairy, nori"], ["vitb"], "See a doctor for a blood test.", "内科", 30),
  C("Vitamin D deficiency", "ビタミンD欠乏症", "general", "mild", "achybones:3 fatigue:2 lowmood:1", "Little sun, indoor life, sunscreen.", ["15 to 30 min of daylight", "Oily fish, eggs, mushrooms"], ["vitd"], "See a doctor for a blood test.", "内科", 60),
  C("Zinc deficiency (taste change)", "亜鉛欠乏症 (味覚障害)", "eent", "mild", "smell:3 hairloss:1 mouthsore:1", "Low zinc from diet or alcohol.", ["Oysters, beef, eggs, nuts"], ["zinc"], "If no recovery in 2 weeks.", "耳鼻咽喉科 / 内科", 30),

  // ----- Sleep -----
  C("Night-owl sleep pattern", "睡眠相後退症候群", "mind", "mild", "latesleep:3 sleepy:2 screen:1", "The body clock runs late.", [SLEEPH, NOSCREEN, "Bright light in the morning"], [], "If it disrupts work.", "睡眠外来 / 精神科", 30),
  C("Early waking insomnia", "早朝覚醒", "mind", "moderate", "wakeearly:3 lowmood:2 insomnia:1", "Waking at 3 to 5 a.m. is common with stress and depression.", [SLEEPH, "Get up if awake over 20 min"], [], "If over 2 weeks, especially with low mood.", "心療内科 / 精神科", 14),
  C("Sleep apnoea", "睡眠時無呼吸症候群", "mind", "moderate", "snore:3 sleepy:3 headache:1 fatigue:1", "Throat collapses during sleep.", ["Lose weight", "Sleep on your side", "Less alcohol"], [], "See a doctor for a home sleep test.", "睡眠外来 / 呼吸器内科", 30),
  C("Narcolepsy signs", "ナルコレプシーの疑い", "mind", "moderate", "sleepy:3 poorfocus:1", "A brain condition causing sudden sleep attacks.", ["Planned naps", "Don't drive when sleepy"], [], "See a sleep clinic.", "睡眠外来", 60),

  // ----- Skin -----
  C("Atopic dermatitis", "アトピー性皮膚炎", "skin", "mild", "itch:3 dryskin:3 rash:2 stress:1", "Sensitive skin barrier.", ["Moisturise twice a day", "Lukewarm showers", "Cotton clothes"], ["hirumild", "fulcort"], "If it spreads or weeps.", "皮膚科", 30),
  C("Psoriasis", "乾癬", "skin", "moderate", "scaly:3 itch:1 jointpain:1", "Immune condition causing thick scaly plaques.", ["Moisturise", "Sunlight in moderation"], ["hirumild"], "See a dermatologist.", "皮膚科", 90),
  C("Seborrhoeic dermatitis", "脂漏性皮膚炎", "skin", "mild", "dandruff:3 itch:1", "Yeast on oily skin.", ["Antifungal shampoo"], ["furufuru"], "If not better in 4 weeks.", "皮膚科", 30),
  C("Ringworm (body)", "体部白癬 (ぜにたむし)", "skin", "mild", "ringrash:3 itch:2", "Fungal infection.", ["Keep dry"], ["lamisil"], "If it spreads.", "皮膚科", 28, undefined, true),
  C("Jock itch", "股部白癬 (いんきんたむし)", "skin", "mild", "itchgenital:3 ringrash:2 itch:1 footpeel:1", "Fungus in the groin.", ["Dry well after showers"], ["lamisil"], "If not better in 2 weeks.", "皮膚科", 28, undefined, true),
  C("Scabies", "疥癬", "skin", "moderate", "itchnight:3 itch:2 sickcontact:1", "Tiny mites burrowing.", ["Wash bedding hot"], [], "See a dermatologist.", "皮膚科", 28, undefined, true),
  C("Warts and corns", "いぼ・うおのめ", "skin", "mild", "wart:3", "Warts are HPV; corns are pressure.", ["Don't pick", "Better-fitting shoes"], ["ibokorori"], "If on face or genitals.", "皮膚科", 60, undefined, true),
  C("Male-pattern hair loss", "男性型脱毛症 (AGA)", "skin", "mild", "hairloss:3", "Genetics and hormones.", ["Treatments work best early"], ["riupx5"], "AGA clinic.", "皮膚科 / AGA外来", 180),
  C("Alopecia areata", "円形脱毛症", "skin", "mild", "baldpatch:3 stress:1", "Immune attack on hair follicles.", ["Most regrow"], [], "See a dermatologist.", "皮膚科", 90),
  C("Excessive sweating", "多汗症", "skin", "mild", "handsweat:3 anxious:1", "Overactive sweat glands.", ["Antiperspirant at night"], [], "Dermatologist.", "皮膚科", 90),
  C("Ingrown toenail", "巻き爪・陥入爪", "skin", "mild", "toenail:3 redswollen:1", "Nail grows into skin.", ["Cut nails straight", "Wider shoes"], ["oronine"], "If pus or spreading redness.", "皮膚科 / 形成外科", 14),

  // ----- Eyes, ears, mouth -----
  C("Retinal detachment", "網膜剥離", "eent", "emergency", "flashes:3 blurry:2", "The retina peels away.", [CALL], [], ER, "眼科 (救急)", 0),
  C("Eye floaters (harmless)", "飛蚊症 (生理的)", "eent", "mild", "floaters:3", "Gel in the eye clumps with age.", ["Normal"], [], "If sudden increase.", "眼科", 0),
  C("Burst blood vessel in eye", "結膜下出血", "eent", "mild", "eyeblood:3", "A tiny vessel breaks.", ["Harmless"], [], "If painful or recurrent.", "眼科", 14),
  C("Corneal scratch / lens ulcer", "角膜びらん・角膜潰瘍", "eent", "moderate", "eyepain:3 redeye:2 blurry:1", "Scratch or lens infection.", ["Remove contacts"], [], "See eye doctor today.", "眼科", 3),
  C("Tinnitus", "耳鳴り", "eent", "mild", "ringing:3 stress:1", "Ear nerve noise.", ["Background sound"], [], "If one-sided or sudden.", "耳鼻咽喉科", 30),
  C("Blocked Eustachian tube", "耳管機能障害", "eent", "mild", "earfull:3 stuffynose:2", "Tube doesn't open.", ["Yawn and swallow"], ["nasal"], "If over 2 weeks.", "耳鼻咽喉科", 14),
  C("Ménière's disease", "メニエール病", "eent", "moderate", "dizzy:3 ringing:2 earfull:2 vomit:1", "Fluid build-up in the inner ear.", ["Less salt"], ["travelmin"], "See ENT.", "耳鼻咽喉科", 30),
  C("Vestibular neuritis", "前庭神経炎", "eent", "moderate", "dizzy:3 vomit:2 nausea:2", "Inflamed balance nerve.", ["Lie still"], ["travelmin"], "See doctor today.", "耳鼻咽喉科", 14),
  C("Gum disease", "歯周病", "eent", "mild", "gumbleed:3 badbreath:2", "Plaque inflames gums.", ["Floss daily"], ["ases"], "See a dentist.", "歯科", 30),
  C("Wisdom tooth infection", "智歯周囲炎", "eent", "moderate", "wisdom:3 swallow:1", "Gum flap infected.", ["Salt rinses"], ["loxonin"], "See a dentist.", "歯科 / 口腔外科", 7),
  C("Sensitive teeth", "知覚過敏", "eent", "mild", "sensitive:3", "Exposed dentine.", ["Soft brush"], ["shumitect"], "If constant pain.", "歯科", 14),
  C("Jaw joint disorder", "顎関節症", "eent", "mild", "jawpain:3 stress:1", "Jaw joint strain.", ["Soft foods"], ["eve"], "If jaw locks.", "歯科 / 口腔外科", 30),
  C("Dental abscess", "歯の膿瘍", "eent", "serious", "toothache:3 redswollen:2 fever:2", "Infection at tooth root.", ["Salt rinses"], ["loxonin"], "See a dentist today.", "歯科 / 口腔外科", 3),
  C("Bad breath", "口臭", "eent", "mild", "badbreath:3", "Tongue coating, gums.", ["Clean tongue"], [], "Dentist.", "歯科", 14),
  C("Pollen-fruit allergy", "口腔アレルギー症候群", "eent", "mild", "itchymouth:3 pollen:2", "Cross-reaction.", ["Cook the fruit"], ["allegra"], "If throat swelling: 119.", "アレルギー科", 1),
  C("Acute glaucoma", "急性緑内障発作", "eent", "emergency", "blurry:3 eyepain:2 headache:2 vomit:2", "Eye pressure spike.", [CALL], [], ER, "眼科 (救急)", 0),

  // ----- General -----
  C("Fainting (vasovagal)", "血管迷走神経反射", "general", "mild", "faint:3 standdizzy:2", "Reflex drop in BP.", ["Lie with legs up"], [], "If during exercise.", "内科 / 循環器内科", 1),
  C("Dizzy on standing", "起立性低血圧", "general", "mild", "standdizzy:3 dizzy:1", "BP drops on standing.", ["Stand slowly"], ["os1"], "If fainting.", "内科", 7),
  C("Food allergy (mild)", "食物アレルギー (軽症)", "skin", "moderate", "newfood:3 hives:3 itch:2", "Immune reaction to a food.", ["Avoid it"], ["allegra"], "Throat swelling: 119.", "アレルギー科", 1),
];
