// Digestion, liver, nutrition, food reactions and poisoning.
export const C_GUT = `
Hiatus hernia|食道裂孔ヘルニア|stomach|m|heartburn:3 belching:2 bellyfat:1|Part of the stomach slides up through the diaphragm, causing reflux.|Smaller meals; Don't lie down for 3 h after eating; Raise the head of the bed|gaster|See a doctor if hard to swallow or vomiting.|消化器内科|0
Oesophagitis|食道炎|stomach|o|swallowpain:3 heartburn:2|Inflamed food pipe from acid or pills that stick.|Take tablets with a full glass of water, sitting up; Avoid hot spicy food|gaster|See a doctor if pain lasts over a week.|消化器内科|14
Swallowing difficulty|嚥下障害|stomach|s|foodstuck:3 weightloss:2 swallowpain:1|Food sticks on the way down.|Soft food; Small bites; Sit upright||See a doctor soon: needs a camera test.|消化器内科|0
Globus sensation|咽喉頭異常感症|eent|m|throatlump:3 stress:2 heartburn:1|A lump feeling in the throat with nothing there; worse with stress.|Sip water; Manage stress|hangekobokuto|See an ENT if hard to swallow food or weight loss.|耳鼻咽喉科|30
Persistent hiccups|しゃっくりが止まらない|stomach|m|hiccups:3 alcohol:1|Irritated diaphragm nerve.|Hold your breath; Sip cold water; Swallow a spoon of sugar||See a doctor if over 48 hours.|内科|1
Excess burping (aerophagia)|呑気症|stomach|m|belching:3 bloating:2 stress:1|Swallowing air when eating fast, chewing gum or anxious.|Eat slowly; No gum or fizzy drinks; Relax jaw||If with weight loss or pain.|消化器内科|14
Gastroparesis|胃不全麻痺|stomach|o|earlyfull:3 nausea:2 vomit:2 diabetic:2|The stomach empties too slowly.|Small low-fat meals; Soft food|rikkunshito|See a doctor.|消化器内科|0
Peptic ulcer bleeding|消化性潰瘍出血|stomach|e|blackstool:3 bloodvomit:3 upperpain:2 faint:1|An ulcer bleeding into the stomach.|Call 119; Nothing to eat||EMERGENCY.|救急|0
Food intolerance (FODMAP)|FODMAP過敏|stomach|m|bloating:3 gas:2 diarrhea:1 lowerpain:1|Some carbs (onion, garlic, wheat, beans, apples) ferment and cause gas.|Try a low-FODMAP diet for 4 weeks, then add foods back; Food diary|wakamoto|See a doctor if weight loss or blood.|消化器内科|30
Fructose malabsorption|果糖吸収不良|stomach|m|bloating:3 diarrhea:2 gas:1|Too much fruit, juice or honey ferments in the gut.|Less juice and dried fruit; Whole fruit in small amounts||If no better with diet.|消化器内科|14
Sugar alcohol upset|糖アルコールによる下痢|stomach|m|diarrhea:3 gas:2 bloating:1|Sugar-free sweets and gum (xylitol, sorbitol) cause loose stools.|Cut sugar-free sweets||Not needed.|—|2
Coffee stomach upset|コーヒーによる胃の不調|stomach|m|caffeine:3 heartburn:2 diarrhea:1|Coffee stimulates acid and the bowel.|Coffee after food, not on an empty stomach; Less strong coffee|gaster|If pain continues.|内科|3
Spicy food stomach upset|辛いものによる腹痛|stomach|m|newfood:3 upperpain:2 diarrhea:2 bottompain:1|Chilli (capsaicin) irritates the gut lining.|Milk or yogurt; Bland food|ohta|If blood or fever.|内科|1
Overeating at a party|食べすぎ|stomach|m|earlyfull:2 bloating:3 heartburn:1|Too much food stretches the stomach.|Gentle walk; Peppermint tea; Skip the next snack|ohta cabbagin|Not needed.|—|1
Milk allergy|牛乳アレルギー|stomach|o|allergyfood:3 hives:2 vomit:1|An immune reaction to milk protein (different from lactose intolerance).|Avoid milk; Read labels (乳)|allegra|See an allergist; go now if breathing trouble.|アレルギー科|0
Egg allergy|卵アレルギー|stomach|o|allergyfood:3 hives:2 vomit:1|Reaction to egg protein.|Avoid egg; Read labels (卵)|allegra|See an allergist.|アレルギー科|0
Wheat allergy|小麦アレルギー|stomach|o|allergyfood:3 hives:2 wheat:2|Reaction to wheat, sometimes only when exercising after eating it.|Avoid wheat; Read labels (小麦)|allegra|See an allergist.|アレルギー科|0
Peanut allergy|落花生アレルギー|stomach|s|allergyfood:3 hives:2 lipswell:2|Can be severe even from traces.|Avoid peanuts; Read labels (落花生); Carry your adrenaline pen if prescribed|allegra|See an allergist; call 119 if breathing trouble.|アレルギー科|0
Shellfish allergy|甲殻類アレルギー|stomach|s|allergyfood:3 hives:2 lipswell:2 rawfood:1|Reaction to shrimp or crab (えび, かに).|Avoid shellfish|allegra|See an allergist; call 119 if breathing trouble.|アレルギー科|0
Buckwheat (soba) allergy|そばアレルギー|stomach|s|allergyfood:3 hives:2 lipswell:2|Soba allergy can be severe; even the steam from boiling can trigger it.|Avoid soba and shops that boil it|allegra|See an allergist.|アレルギー科|0
Exercise-induced food allergy|食物依存性運動誘発アナフィラキシー|stomach|e|allergyfood:3 sport:3 hives:3 breathless:2|Eating a food (often wheat or shrimp) then exercising within 2 hours causes anaphylaxis.|Don't exercise for 2-4 h after that food; Call 119 if breathing trouble||EMERGENCY if breathing trouble.|救急 / アレルギー科|0
Drug allergy|薬物アレルギー|skin|s|newmeds:3 rash:3 hives:2 fever:1|A rash or hives after a new medicine (antibiotics, painkillers).|Stop the medicine and keep the box||See the prescribing doctor today; call 119 if lips swell or breathing trouble.|内科 / 皮膚科|0
Severe drug rash (SJS)|スティーブンス・ジョンソン症候群|skin|s|newmeds:3 rash:3 mouthsore:3 blisters:3 fever:2|A rare severe reaction: blisters, mouth sores and peeling skin.|Stop the medicine; Call 119||EMERGENCY.|救急 / 皮膚科|0
Scombroid fish poisoning|ヒスタミン食中毒|stomach|m|rawfood:2 redface:3 headache:2 hives:2|Spoiled fish (tuna, mackerel) forms histamine: flushing within an hour.|Antihistamine; Fluids|allegra|If breathing trouble.|内科|1
Pufferfish poisoning|フグ中毒|general|e|rawfood:3 numb:3 breathless:2|Tetrodotoxin numbs lips and tongue, then muscles.|Call 119 now||EMERGENCY.|救急|0
Mushroom poisoning|キノコ中毒|stomach|e|vomit:3 diarrhea:2 badfood:2 confused:1|Wild mushrooms can be deadly.|Call 119; Keep a sample||EMERGENCY.|救急|0
Botulism|ボツリヌス症|general|e|doublevis:3 swallow:2 badfood:2 weakside:1|A toxin from badly preserved food causes paralysis.|Call 119||EMERGENCY.|救急|0
Bacillus cereus (fried rice)|セレウス菌食中毒|stomach|m|vomit:3 badfood:3|Cooked rice left warm grows a toxin; vomiting 1-6 hours later.|Fluids; Rest|os1|If vomiting lasts over a day.|内科|1
Clostridium perfringens (curry)|ウエルシュ菌食中毒|stomach|m|diarrhea:3 lowerpain:2 badfood:3|Big pots of curry or stew left to cool slowly; diarrhoea 6-18 h later.|Fluids|os1|If over 2 days.|内科|1
Vibrio (raw seafood)|腸炎ビブリオ|stomach|o|rawfood:3 diarrhea:3 lowerpain:2 fever:1|Raw seafood in summer.|Fluids|os1|See a doctor if bloody or high fever.|内科|3
Alcohol poisoning|急性アルコール中毒|general|e|alcohol:3 confused:3 vomit:2 sleepy:2|Too much alcohol too fast: can stop breathing.|Lay them on their side; Don't leave them alone; Call 119 if can't wake||EMERGENCY.|救急|0
Medicine overdose|薬の過剰摂取|general|e|poison:3 sleepy:2 confused:2|Too much of a medicine (often paracetamol).|Call 119 or the poison line; Keep the box||EMERGENCY even if they feel fine.|救急|0
Swallowed a battery or magnet|電池・磁石の誤飲|general|e|poison:3 babycry:1|Button batteries burn the food pipe within hours.|Don't make them vomit; Call 119||EMERGENCY.|救急|0
Swallowed cleaning product|洗剤の誤飲|general|e|poison:3 vomit:1|Bleach and detergents burn.|Rinse the mouth; Don't make them vomit; Call 119||EMERGENCY.|救急|0
Tobacco swallowed by a child|子どものタバコ誤飲|general|s|poison:3 vomit:2|Nicotine is poisonous to children.|Don't give water; Call the poison line (072-727-2499 / 029-852-9999)||See a doctor now.|救急 / 小児科|0
Fatty liver from alcohol|アルコール性脂肪肝|stomach|o|alcohol:3 bellyfat:1 fatigue:1|Alcohol fills the liver with fat; reversible if you stop.|Stop or cut alcohol; Lose weight||Check liver blood tests yearly.|消化器内科 / 肝臓内科|0
Alcoholic hepatitis|アルコール性肝炎|stomach|s|alcohol:3 yellow:3 swollenbelly:2 fever:1|Heavy drinking inflames the liver.|Stop alcohol (with medical help)||See a doctor today.|消化器内科|0
Cirrhosis|肝硬変|stomach|s|yellow:2 swollenbelly:3 bruiseeasy:2 alcohol:2 confused:1|Long-term liver scarring.|No alcohol; Less salt||See a liver doctor.|肝臓内科|0
Hepatitis C|C型肝炎|stomach|o|fatigue:3 yellow:2 darkpee:1|A blood-borne liver virus; often silent for years; now curable.|No alcohol||See a doctor for a blood test.|肝臓内科|0
Gilbert's syndrome|体質性黄疸|stomach|m|yellow:3 fatigue:1|A harmless genetic condition: eyes turn slightly yellow when tired, fasting or ill.|Regular meals; Rest||See a doctor once to confirm.|内科|0
Gallbladder sludge|胆泥|stomach|m|rightupper:3 nausea:1 bloating:1|Thick bile; may cause mild pain after fatty meals.|Smaller low-fat meals||See a doctor if pain is severe or with fever.|消化器内科|0
Bile duct stone|総胆管結石|stomach|s|rightupper:3 yellow:3 fever:2 darkpee:1|A gallstone blocks the bile duct.|Nothing to eat||See a doctor today; 119 if fever and chills.|消化器内科|0
Chronic pancreatitis|慢性膵炎|stomach|o|bandpain:3 greasystool:2 weightloss:2 alcohol:2|Long-term pancreas damage, usually from alcohol.|No alcohol; Low-fat meals||See a doctor.|消化器内科|0
Mesenteric ischaemia|腸間膜虚血|stomach|e|lowerpain:3 elderly:2 bloodstool:2|Blocked blood supply to the gut: severe pain.|Call 119||EMERGENCY.|救急|0
Intussusception (child)|腸重積|stomach|s|babycry:3 vomit:2 bloodymucus:3|In young children, the bowel telescopes: crying fits, vomiting, red jelly stool.|Call 119||EMERGENCY.|救急 / 小児科|0
Pyloric stenosis (baby)|肥厚性幽門狭窄症|stomach|s|vomit:3 babycry:2|A baby (2-8 weeks) projectile vomits after every feed.|Keep feeding small amounts||See a doctor today.|小児科|0
Infant colic|乳児コリック|stomach|m|babycry:3|Healthy babies crying for hours, usually evenings, from 2 weeks to 4 months.|Hold and rock; White noise; Take turns; Never shake a baby||See a doctor if fever, vomiting or not feeding.|小児科|0
Constipation in children|小児の便秘|stomach|m|constip:3 lowerpain:1 childfever:-1|Holding in poo makes it hard and painful.|Water, fruit, vegetables; Toilet time after meals|ichijiku|See a doctor if blood or very swollen belly.|小児科|7
Toddler diarrhoea|幼児下痢|stomach|m|diarrhea:3|Loose stools in healthy toddlers, often from juice.|Less juice; More fat and fibre||If weight loss.|小児科|0
Bile acid diarrhoea|胆汁酸性下痢|stomach|o|wateryst:3 urgency:2 chronicdiarr:2|Too much bile reaches the colon, often after gallbladder removal.|Low-fat meals||See a doctor.|消化器内科|0
Microscopic colitis|顕微鏡的大腸炎|stomach|o|chronicdiarr:3 wateryst:2 painkillers:1|Watery diarrhoea in older adults, linked to some medicines.|Review medicines|os1|See a doctor for a colonoscopy.|消化器内科|0
Small intestine bacterial overgrowth|小腸内細菌異常増殖症 (SIBO)|stomach|o|bloating:3 gas:2 diarrhea:2|Too many bacteria in the small intestine.|Small meals||See a doctor for a breath test.|消化器内科|0
Pancreatic insufficiency|膵外分泌不全|stomach|o|greasystool:3 weightloss:2|The pancreas doesn't make enough enzymes.|Low-fat meals||See a doctor.|消化器内科|0
Colon polyp|大腸ポリープ|stomach|m|redblood:3 stoolthin:2|Small growths found on colonoscopy; some can turn into cancer.|High-fibre diet||Do a stool test at your health check (便潜血).|消化器内科|0
Anal warts|肛門尖圭コンジローマ|stomach|o|analswell:3 itchanus:2 condombreak:1|HPV warts round the anus.|Don't pick||See a dermatologist or proctologist.|肛門科 / 皮膚科|0
Pilonidal cyst|毛巣洞|skin|o|tailbone:3 boil:2|An infected pocket at the top of the buttock crease.|Keep clean and dry; Warm compress|actibia|See a surgeon if painful or discharging.|外科|0
Pinworm in adults|成人のぎょう虫|stomach|m|itchanus:3 worms:2|Worms passed from children.|Treat the whole household; Wash bedding||See a doctor.|内科|14
Tapeworm|条虫症|stomach|m|worms:3 rawfood:2 weightloss:1|From raw fish (salmon, trout) or undercooked meat.|Cook fish and meat well||See a doctor; one dose clears it.|内科|0
Vitamin A deficiency|ビタミンA欠乏|eent|m|nightblind:3 dryeye:2|Poor night vision and dry eyes.|Carrots, pumpkin, eggs, liver||See an eye doctor if night vision is poor.|眼科|0
Vitamin C deficiency (scurvy)|壊血病|general|o|gumbleed:3 bruiseeasy:2 fatigue:1|Almost no fruit or vegetables for months.|Fruit and vegetables daily|vitb|See a doctor.|内科|0
Vitamin B1 deficiency|ビタミンB1欠乏 (脚気)|general|o|tingfeet:3 ankleswell:2 easytired:2 alcohol:2|Too much white rice, sugar and alcohol, few other foods.|Pork, brown rice, beans, natto|vitb|See a doctor.|内科|0
Vitamin B2 deficiency|ビタミンB2欠乏|eent|m|mouthsore:3 lipsore:2|Cracked mouth corners and sore tongue.|Eggs, milk, natto, green vegetables|vitb|If no better in 2 weeks.|内科|0
Magnesium deficiency|マグネシウム欠乏|body|m|cramp:3 twitch:2 insomnia:1|Muscle twitches and cramps.|Nuts, seeds, beans, leafy greens||See a doctor if severe.|内科|0
Calcium deficiency|カルシウム不足|body|m|cramp:3 achybones:2|Few dairy or bone-in fish.|Milk, yogurt, tofu, small fish||See a doctor for a bone check.|内科|0
Protein deficiency|たんぱく質不足|general|m|musclelose:3 swollenface:1 hairloss:1 easytired:2|Not enough protein for repair.|Protein at every meal: eggs, fish, chicken, tofu, natto, dal||See a doctor if swelling.|内科|0
Iodine excess (seaweed)|ヨウ素過剰|general|m|neckfront:3 coldintol:1|Lots of kombu and seaweed can upset the thyroid.|Moderate kombu||See a doctor for a thyroid test.|内分泌内科|0
Caffeine overuse|カフェイン過剰|mind|m|caffeine:3 insomnia:2 palpit:2 anxious:1|More than about 400 mg a day (4 cups of coffee or 2 energy drinks).|Cut down slowly to avoid headaches; Nothing after 2 pm||If chest pain.|内科|0
Sugar crash|血糖値スパイク|general|m|sleepy:3 shakyhungry:2 poorfocus:1|Sweet drinks and white carbs spike then drop blood sugar.|Eat protein and vegetables first; Fewer sweet drinks||See a doctor if shaky spells continue.|内科|0
Skipping meals|欠食による不調|general|m|shakyhungry:3 headache:2 poorfocus:2|Long gaps without food.|Regular meals; Keep healthy snacks||Not needed.|—|0
Binge eating disorder|過食性障害|mind|o|eatingbinge:3 lowmood:2 bodyimage:2|Repeated episodes of eating very large amounts with loss of control.|Regular meals (no skipping); Notice triggers; Be kind to yourself||See a doctor or eating disorder service; it's treatable.|心療内科 / 精神科|0
Gastric reflux in babies|乳児の胃食道逆流|stomach|m|vomit:3 babycry:1|Babies often spit up after feeds.|Hold upright for 20 min after feeds; Smaller feeds||See a doctor if poor weight gain or blood.|小児科|0
Dumping syndrome|ダンピング症候群|stomach|o|diarrhea:3 dizzy:2 palpit:2 sleepy:1|After stomach surgery, food rushes into the intestine.|Small meals; Less sugar||See your surgeon.|消化器外科|0
Chronic constipation from medicines|薬剤性便秘|stomach|m|constip:3 newmeds:3|Iron, painkillers, antidepressants and some allergy pills slow the bowel.|Water, fibre, walking|magmi|Ask your doctor about alternatives.|内科|0
Laxative overuse|下剤の使いすぎ|stomach|m|constip:3 bloating:2|Stimulant laxatives used daily can make the bowel lazy.|Switch to fibre and magnesium-type laxatives|magmi|See a doctor.|消化器内科|0
Stomach upset from antibiotics|抗生物質による胃腸障害|stomach|m|antibiotic:3 nausea:2 diarrhea:2|Antibiotics disturb gut bacteria.|Take with food; Yogurt|biofermin|See a doctor if severe diarrhoea.|内科|7
Stomach upset from painkillers|鎮痛薬による胃痛|stomach|o|painkillers:3 upperpain:3 heartburn:1|NSAIDs irritate the stomach.|Take with food; Switch to acetaminophen|gaster tylenol|See a doctor if black poo.|内科|3
Iron tablet stomach upset|鉄剤による胃腸障害|stomach|m|ironpill:3 nausea:2 constip:2|Iron is hard on the stomach.|Take with food or at night; Ask about a gentler form||See your doctor.|内科|0
Morning nausea from anxiety|不安による朝の吐き気|stomach|m|nausea:3 anxious:3 noappetite:1|Stress hormones peak in the morning.|Small dry breakfast; Slow breathing; Ginger tea||See a doctor if weight loss.|心療内科|0
Eating too fast|早食い|stomach|m|bloating:3 belching:2 heartburn:2|Swallowing air and overeating before fullness signals arrive.|Put chopsticks down between bites; Chew 20 times||Not needed.|—|0
Late-night eating reflux|夜食による逆流|stomach|m|heartburn:3 latesleep:2 nightcough:1|Eating close to bedtime.|Finish dinner 3 h before bed||If it continues.|内科|0
Dry mouth from medicines|薬剤性口渇|eent|m|drymouth:3 newmeds:2|Allergy pills, antidepressants and others dry the mouth.|Sip water; Sugar-free gum||Ask your doctor.|内科 / 歯科|0
Taste changes|味覚障害|eent|m|smell:3 drymouth:1|From zinc deficiency, colds, COVID or medicines.|Zinc-rich food (oysters, beef, nuts)|zinc|See an ENT if over 2 weeks.|耳鼻咽喉科|14
Halitosis from stomach|胃からの口臭|eent|m|badbreath:3 heartburn:2|Reflux can cause bad breath.|Treat reflux; Clean tongue|gaster|See a dentist first.|歯科 / 消化器内科|0
Tonsil stones|膿栓 (臭い玉)|eent|m|badbreath:3 throatlump:2|Small smelly white lumps in tonsil pockets.|Gargle with salt water; Don't poke them||See an ENT if large or frequent.|耳鼻咽喉科|0
Gastric cancer screening due|胃がん検診|stomach|m|upperpain:1 earlyfull:3 elderly:1|Over 50 in Japan, a stomach camera every 2 years is recommended.|Book screening||Ask your city office about free screening.|消化器内科|0
`;
