// Heart, blood vessels, lungs, blood and metabolism.
export const C_HEART = `
High blood pressure|高血圧症|chest|o|highbp:3 headache:1 dizzy:1 highbpread:2|Blood pushes too hard on artery walls; usually no symptoms.|Less salt (under 6 g a day); Walk 30 min daily; Lose weight; Less alcohol; Measure at home morning and evening||See a doctor if home readings are 135/85 or more.|内科 / 循環器内科|0|Called the silent killer: measure it.
Hypertensive crisis|高血圧緊急症|chest|e|highbpread:3 headache:2 chestpain:2 blurry:2|Very high blood pressure damaging organs.|Sit and rest; Call 119 if chest pain, confusion or vision loss||EMERGENCY.|救急|0
Low blood pressure|低血圧|general|m|standdizzy:3 fatigue:2 dizzy:1|Common in slim young people; dizzy when standing.|Stand up slowly; Drink water; A little more salt; Compression socks||If you faint.|内科|0
Angina|狭心症|chest|s|chestexert:3 chestpain:2 breathless:1 highbp:1 smoker:1|Narrowed heart arteries: chest tightness with effort that goes with rest.|Stop and rest when it starts||See a cardiologist soon; call 119 if it lasts over 15 minutes or comes at rest.|循環器内科|0
Unstable angina|不安定狭心症|chest|e|chestpain:3 chestexert:2 sweats:2 breathless:2|Chest pain at rest or getting worse: a heart attack may be coming.|Call 119; Sit down; Chew aspirin if not allergic||EMERGENCY.|救急|0
Heart failure|心不全|chest|s|breathlie:3 ankleswell:3 breathless:2 easytired:2 weightgain:1|The heart can't pump well; fluid builds up in lungs and legs.|Weigh yourself daily; Less salt; Sleep propped up||See a cardiologist soon; call 119 if breathless at rest.|循環器内科|0
Atrial fibrillation|心房細動|chest|s|palpit:3 racing:2 breathless:1 dizzy:1 elderly:1|An irregular heartbeat that raises stroke risk.|Check your pulse: irregular and fast?; Less alcohol and caffeine||See a cardiologist; go now if chest pain or fainting.|循環器内科|0
Supraventricular tachycardia|発作性上室頻拍|chest|o|racing:3 palpit:3 dizzy:1|Sudden bursts of very fast regular heartbeat that start and stop suddenly.|Try bearing down as if on the toilet for 15 seconds; Cold water on the face||Go to hospital if it doesn't stop in 15 minutes.|循環器内科 / 救急|0
Extra heartbeats (ectopics)|期外収縮|chest|m|palpit:3 caffeine:2 stress:1|Skipped or thumping beats; usually harmless.|Less caffeine, alcohol and energy drinks; Sleep|vitb|See a doctor if with fainting, chest pain or very frequent.|循環器内科|0
Slow heart rate (bradycardia)|徐脈|chest|o|slowpulse:3 dizzy:2 faint:1 fatigue:1|A heartbeat under 50 with symptoms; athletes can be normal.|Note your pulse||See a cardiologist if dizzy or fainting.|循環器内科|0
Heart valve problem|心臓弁膜症|chest|o|breathless:3 chestexert:2 palpit:2 easytired:2 elderly:1|A valve that is narrowed or leaks.|Nothing at home||See a cardiologist for a heart scan.|循環器内科|0
Aortic dissection|大動脈解離|chest|e|chestpain:3 backpain:3 highbp:2|A tear in the main artery: sudden tearing pain to the back.|Call 119 now||EMERGENCY.|救急|0
Aortic aneurysm|大動脈瘤|chest|s|swollenbelly:3 backpain:2 elderly:2 smoker:2|A bulge in the main artery; often found on a scan.|Stop smoking; Control blood pressure||See a doctor; call 119 if sudden severe belly or back pain.|循環器内科 / 血管外科|0
Peripheral artery disease|閉塞性動脈硬化症|chest|o|legcramplwalk:3 smoker:2 diabetic:2 coldhands:1|Narrowed leg arteries: calf pain when walking that eases with rest.|Walk daily to the point of pain, rest, repeat; Stop smoking||See a vascular doctor.|循環器内科 / 血管外科|0
Varicose veins|下肢静脈瘤|body|m|legswell:1 cramp:3 ankleswell:2 sitting:1|Swollen twisted leg veins from weak valves.|Raise your legs; Compression socks; Walk|vantelin|See a vascular clinic if painful or skin changes.|血管外科|0
Raynaud's phenomenon|レイノー現象|general|m|coldhands:3 numb:1|Fingers turn white then blue in cold or stress.|Gloves; Keep the whole body warm; Stop smoking||See a doctor if sores on fingers or it started after 30.|内科 / 膠原病内科|0
Chilblains|しもやけ|skin|m|coldhands:2 itch:2 redswollen:3|Itchy red swellings on fingers or toes after cold.|Warm slowly; Dry socks; Don't rub|vitb|If skin breaks.|皮膚科|10
Frostbite|凍傷|skin|s|frostbite:3 numb:2 cold:1|Frozen skin and tissue after cold exposure.|Warm in 37-39 °C water; Don't rub; Don't re-freeze||See a doctor today.|救急 / 皮膚科|0
Hypothermia|低体温症|general|e|cold:3 confused:2 sleepy:1|Body temperature falls too low.|Get somewhere warm; Remove wet clothes; Warm drinks if alert; Call 119||EMERGENCY.|救急|0
High cholesterol|脂質異常症|general|m|bellyfat:3 highbp:1 smoker:1 weightgain:2|Too much LDL cholesterol; no symptoms but raises heart risk.|More fish, vegetables, oats, soy; Less fried food and pastries; Exercise||Check at your yearly health check (健康診断).|内科|0
Metabolic syndrome|メタボリックシンドローム|general|o|bellyfat:3 highbp:2 thirsty:1 snore:1|Belly fat plus high blood pressure, sugar or fats.|Waist under 85 cm (men) / 90 cm (women); Walk daily; Fewer sweet drinks||See a doctor at your health check.|内科|0
Obesity|肥満症|general|o|weightgain:3 bellyfat:2 snore:1 kneepain:1|Too much body fat for health.|Small changes: fewer sweet drinks, more walking, more protein and vegetables; Sleep 7 h||A doctor can help with a plan.|内科|0
Being underweight|やせすぎ|general|m|weightloss:3 easytired:2 noappetite:2|BMI under 18.5; low energy, weak immunity.|Regular meals with protein; Strength training||See a doctor if weight keeps dropping.|内科|0
Iron overload|鉄過剰症|general|o|fatigue:3 jointpain:2 darkpatch:1 ironpill:2|Too much iron from supplements or genes.|Stop iron supplements unless prescribed||See a doctor for a blood test.|内科|0
B12 deficiency anaemia|悪性貧血|general|o|pale:2 tingfeet:3 fatigue:2 tongueburn:1|Low vitamin B12 (vegan diet, stomach problems).|Eggs, fish, meat, dairy|vitb|See a doctor for a blood test.|内科|0
Folate deficiency|葉酸欠乏|general|m|fatigue:3 mouthsore:2 pale:2|Low folate from few vegetables or alcohol.|Leafy greens, beans|vitb|See a doctor if very tired.|内科|0
Thalassaemia trait|サラセミア|general|m|pale:3 fatigue:1|An inherited blood trait common in South Asia; mild anaemia.|Don't take iron unless tested low||Tell your doctor; matters for family planning.|血液内科|0
Low platelets (ITP)|特発性血小板減少性紫斑病|general|o|bruiseeasy:3 bruise:3 gumbleed:2 nosebleed:1|The immune system destroys platelets: tiny red spots and easy bruising.|Avoid contact sports and aspirin||See a doctor soon; go now if heavy bleeding.|血液内科|0
Blood clotting disorder|出血傾向|general|o|bruiseeasy:3 nosebleed:2 heavyperiod:2|Bleeding longer than normal.|Press firmly on cuts for 10 min||See a doctor for blood tests.|血液内科|0
Polycythaemia|多血症|general|o|redface:3 headache:1 itch:1 smoker:1|Too many red blood cells; blood is thick.|Stop smoking; Drink water||See a doctor.|血液内科|0
Swollen ankles from heat or standing|立ち仕事・暑さによるむくみ|general|m|ankleswell:3 heatexp:1 sitting:1|Fluid pools in the legs from standing, sitting or heat.|Raise legs; Walk; Less salt; Compression socks||See a doctor if one leg only, sudden, or breathless.|内科|3
Chronic bronchitis (COPD)|慢性閉塞性肺疾患 (COPD)|chest|s|longcough:3 phlegm:2 breathless:2 smoker:3|Long-term lung damage, mostly from smoking.|Stop smoking (the most important step); Stay active; Flu and pneumonia vaccines||See a respiratory doctor.|呼吸器内科|0
Emphysema|肺気腫|chest|s|breathless:3 smoker:3 longcough:1|Lung air sacs damaged by smoking.|Stop smoking; Breathing exercises||See a respiratory doctor.|呼吸器内科|0
Bronchiectasis|気管支拡張症|chest|o|phlegm:3 longcough:2 coughblood:1|Widened airways that collect mucus.|Daily airway clearance (huffing, physio); Fluids||See a respiratory doctor.|呼吸器内科|0
Sarcoidosis|サルコイドーシス|chest|o|longcough:3 breathless:2 redeye:1 rash:1 fatigue:2|Clumps of inflammation in lungs, skin, eyes.|Nothing at home||See a doctor.|呼吸器内科|0
Pulmonary fibrosis|肺線維症|chest|s|breathless:3 longcough:2 elderly:1|Scarring of the lungs.|Stop smoking||See a respiratory doctor.|呼吸器内科|0
Allergic asthma|アレルギー性喘息|chest|o|wheeze:3 cough:2 pollen:2 nightcough:2|Airways react to dust, mites, pets or pollen.|Keep inhalers handy; Clean bedding hot weekly|allegra|See a doctor for an inhaler plan.|呼吸器内科|0
Exercise-induced asthma|運動誘発性喘息|chest|m|wheeze:3 sport:3 cough:1|Airways narrow during or after exercise, especially in cold air.|Warm up slowly; Breathe through the nose||See a doctor for an inhaler before exercise.|呼吸器内科|0
Vocal cord dysfunction|声帯機能不全|chest|o|wheeze:3 throatlump:2 breathless:2 stress:1|The vocal cords close when breathing in.|Slow breathing through the nose||See an ENT or respiratory doctor.|耳鼻咽喉科|0
Smoker's cough|喫煙者のせき|chest|m|cough:2 phlegm:2 smoker:3|Smoke irritates the airways.|Stop smoking or cut down; Cough usually gets better within months of quitting||See a doctor if blood, weight loss or over 3 weeks.|呼吸器内科 / 禁煙外来|0
Vaping lung irritation|電子タバコによる肺障害|chest|o|cough:3 breathless:2 chestpain:1 smokeurge:1|Vape chemicals can inflame the lungs.|Stop vaping||See a doctor if short of breath.|呼吸器内科|0
Carbon monoxide poisoning|一酸化炭素中毒|general|e|headache:3 dizzy:2 nausea:2 confused:2|From heaters, grills or cars in closed spaces; several people get headaches together.|Get to fresh air now; Call 119||EMERGENCY.|救急|0
Smoke inhalation|煙の吸入|chest|e|cough:2 breathless:3 hoarse:2|Breathing smoke from a fire.|Fresh air; Call 119||EMERGENCY.|救急|0
Choking|窒息|chest|e|breathless:3 foodstuck:3|Something blocks the airway: can't speak or breathe.|Call 119; 5 back blows then 5 abdominal thrusts (Heimlich)||EMERGENCY.|救急|0
Near drowning|溺水|chest|e|drowning:3 cough:2 breathless:2|Water in the lungs can cause problems hours later.|Call 119; Keep warm||EMERGENCY even if they seem fine.|救急|0
Electric shock|感電|general|e|electric:3 burn:2 palpit:1|Electricity can affect the heart.|Turn off power before touching them; Call 119||EMERGENCY.|救急|0
Heart palpitations from energy drinks|エナジードリンクによる動悸|chest|m|palpit:3 caffeine:3 restless:1 insomnia:1|High caffeine speeds up the heart.|Stop energy drinks; Water; Rest||Go now if chest pain or fainting.|内科|1
Thyroid storm|甲状腺クリーゼ|general|e|racing:3 fever:3 confused:2 heatintol:2|A dangerous surge of thyroid hormone.|Call 119||EMERGENCY.|救急|0
Hyperparathyroidism|副甲状腺機能亢進症|general|o|achybones:3 thirsty:2 constip:1 lowmood:1|High calcium from an overactive gland.|Drink water||See a doctor for blood tests.|内分泌内科|0
Diabetes type 1 signs|1型糖尿病の兆候|general|s|thirsty:3 oftenpee:3 weightloss:3 fatigue:2|The body stops making insulin, often in young people.|Don't wait||See a doctor today; call 119 if vomiting or fast breathing.|糖尿病内科|0
Diabetes type 2|2型糖尿病|general|o|thirsty:3 oftenpee:2 bellyfat:2 fatigue:1 darkpatch:2|Insulin works less well; linked to weight and family.|Walk after meals; Fewer sweet drinks and white carbs; Lose weight||See a doctor; check HbA1c yearly.|糖尿病内科|0
Diabetic foot problem|糖尿病足病変|body|s|diabetic:3 tingfeet:2 cut:2 redswollen:2|Numb feet don't feel injuries, which get infected.|Check feet daily; Never walk barefoot||See a doctor today for any foot wound.|糖尿病内科 / 皮膚科|0
Insulin resistance|インスリン抵抗性|general|m|darkpatch:3 bellyfat:2 sleepy:1|Cells respond poorly to insulin; often before diabetes.|Walk after meals; Strength training; Less sugar||See a doctor for blood tests.|内科|0
High uric acid|高尿酸血症|general|m|alcohol:3 bigtoe:1 bellyfat:1|Found on health checks; leads to gout and kidney stones.|Water 2 L a day; Less beer, offal and sweet drinks||Recheck at your health check.|内科|0
Dehydration in older adults|高齢者の脱水|general|s|elderly:3 thirsty:1 confused:2 darkpee:2|Older people feel less thirst.|Regular drinks even if not thirsty; OS-1|os1|See a doctor if confused or not peeing.|内科|0
Low sodium (hyponatraemia)|低ナトリウム血症|general|s|confused:3 headache:2 nausea:2 vomit:1|Drinking too much water or some medicines dilute salt in the blood.|Don't overdrink water in races; Use sports drinks||See a doctor; call 119 if confused or seizure.|内科|0
Low potassium|低カリウム血症|general|o|cramp:3 musclewaste:2 palpit:2|From vomiting, diarrhoea or some medicines.|Bananas, potatoes, OS-1|os1|See a doctor for a blood test.|内科|0
Hangover with palpitations|二日酔いの動悸|chest|m|palpit:2 alcohol:3 headache:2 thirsty:2|Alcohol dehydrates and stresses the heart.|Water; Rest; Eat|os1|Go now if chest pain or irregular pulse continues.|内科|1
Long COVID|新型コロナ後遺症|general|o|easytired:3 poorfocus:2 breathless:1 smell:1|Symptoms lasting weeks or months after COVID.|Pace yourself: rest before you crash; Gentle activity||See a doctor or long COVID clinic.|内科|0
Chronic fatigue syndrome|慢性疲労症候群|general|o|easytired:3 sleepy:2 poorfocus:2 bodyache:1|Long-lasting exhaustion worse after effort.|Pacing; Regular sleep||See a doctor to rule out other causes.|内科 / 心療内科|0
Fibromyalgia|線維筋痛症|body|o|bodyache:3 easytired:2 insomnia:2 poorfocus:1|Widespread pain and tiredness with sensitive nerves.|Gentle daily exercise; Sleep routine; Warm baths||See a doctor.|内科 / 心療内科|0
Lupus|全身性エリテマトーデス|general|s|rash:2 redface:3 jointpain:2 fever:1 fatigue:2|The immune system attacks the body: butterfly face rash, joint pain.|Sun protection||See a rheumatologist.|膠原病内科|0
Sjögren's syndrome|シェーグレン症候群|general|o|dryeyesmouth:3 fatigue:1 jointpain:1|The immune system dries the eyes and mouth.|Artificial tears; Sip water; Sugar-free gum|santear|See a rheumatologist.|膠原病内科|0
Vasculitis|血管炎|general|s|rash:3 fever:2 weightloss:2 jointpain:1 bruiseeasy:1|Inflamed blood vessels.|Nothing at home||See a doctor.|膠原病内科|0
Giant cell arteritis|巨細胞性動脈炎|head|s|jawclaud:3 headache:2 blurry:2 elderly:2|Inflamed head arteries in people over 50; can cause sudden blindness.|Don't wait||See a doctor today.|膠原病内科 / 眼科|0
Polymyalgia rheumatica|リウマチ性多発筋痛症|body|o|morningstiff:3 shoulderpain:2 hippain:2 elderly:2|Stiff, painful shoulders and hips in older people.|Gentle movement|tylenol|See a doctor; steroids work fast.|膠原病内科|0
Kidney disease|慢性腎臓病|urinary|o|foamyurine:3 ankleswell:2 swollenface:2 fatigue:1 highbp:1|Kidneys slowly lose function; often no symptoms.|Control blood pressure and sugar; Less salt; Avoid regular NSAIDs||See a doctor for blood and urine tests.|腎臓内科|0
Nephrotic syndrome|ネフローゼ症候群|urinary|s|foamyurine:3 swollenface:3 ankleswell:2 weightgain:1|Kidneys leak protein: very puffy face and legs.|Less salt||See a doctor soon.|腎臓内科|0
Acute kidney injury|急性腎障害|urinary|e|cantpee:3 ankleswell:2 confused:1 vomit:1|Kidneys stop working suddenly (severe dehydration, drugs).|Call 119 if very little pee and unwell||EMERGENCY.|救急 / 腎臓内科|0
Glomerulonephritis|糸球体腎炎|urinary|s|bloodpee:3 swollenface:2 highbp:1 sorethroat:1|Inflamed kidney filters, sometimes after a sore throat.|Rest; Less salt||See a doctor.|腎臓内科|0
IgA nephropathy|IgA腎症|urinary|o|bloodpee:3 sorethroat:2|Blood in pee after colds, common in Japan.|Nothing at home||See a kidney doctor.|腎臓内科|0
Overactive bladder|過活動膀胱|urinary|m|oftenpee:3 urgency:2 nightpee:2 leakpee:1|The bladder squeezes too often.|Bladder training: hold a little longer; Less caffeine; Pelvic floor exercises||See a urologist; medicines help.|泌尿器科|0
Stress urinary incontinence|腹圧性尿失禁|urinary|m|leakpee:3 postbirth:1|Weak pelvic floor muscles leak pee with coughs or jumps.|Pelvic floor (Kegel) exercises daily||See a gynaecologist or urologist.|泌尿器科 / 婦人科|0
Post-pee dribble|排尿後尿滴下|urinary|m|dribble:3|A little pee stays in the urethra after peeing (common in men).|Press gently behind the scrotum after peeing; Pelvic floor exercises||Not needed.|泌尿器科|0
Interstitial cystitis|間質性膀胱炎|urinary|o|oftenpee:3 pelvicpain:2 urgency:2|Long-term bladder pain without infection.|Avoid coffee, alcohol, citrus, spicy food||See a urologist.|泌尿器科|0
Bladder cancer warning signs|膀胱がんの兆候|urinary|s|bloodpee:3 smoker:2 elderly:1|Painless blood in pee needs checking.|Nothing at home||See a urologist within 2 weeks.|泌尿器科|0
Kidney cancer warning signs|腎臓がんの兆候|urinary|s|bloodpee:3 sidepain:2 weightloss:2 fever:1|Blood in pee, side pain or a lump.|Nothing at home||See a urologist.|泌尿器科|0
Dark urine from dehydration|脱水による濃い尿|urinary|m|darkpee:3 thirsty:2 heatexp:1|Concentrated pee when you don't drink enough.|Drink water until pee is pale yellow|os1|If dark pee with yellow eyes or pale poo.|内科|1
Orange pee from vitamins|ビタミンによる尿の色|urinary|m|darkpee:2 newmeds:3|B vitamins turn pee bright yellow; harmless.|Nothing needed|vitb|Not needed.|—|0
`;
