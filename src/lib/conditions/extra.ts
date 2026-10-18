// More conditions across the body.
export const C_EXTRA = `
Pheochromocytoma signs|褐色細胞腫の兆候|general|o|palpit:3 sweats:2 headache:2 highbp:2|A rare adrenal growth releasing bursts of adrenaline: pounding heart, sweating and headache.|Note when episodes happen||See a doctor for blood and urine tests.|内分泌内科|0
Acromegaly signs|先端巨大症の兆候|general|o|weightgain:1 jointpain:3 sweats:2 snoreloud:2 headache:1|Too much growth hormone: hands, feet and jaw slowly enlarge.|Compare old photos||See an endocrinologist.|内分泌内科|0
Diabetes insipidus|尿崩症|general|o|thirsty:3 oftenpee:3 nightpee:2|The body can't hold water: huge amounts of pale pee.|Drink to thirst||See a doctor.|内分泌内科|0
Primary aldosteronism|原発性アルドステロン症|chest|o|highbp:3 cramp:2 musclewaste:1|An adrenal gland makes too much aldosterone: high blood pressure and low potassium.|Less salt||Ask your doctor to test if blood pressure is hard to control.|内分泌内科|0
Reactive low blood sugar|反応性低血糖|general|m|shakyhungry:3 sweats:2 sleepy:1|Blood sugar dips 2-4 hours after a sugary meal.|Protein and fibre with carbs; Fewer sweet drinks||See a doctor if you faint.|内科|0
Low blood sugar after drinking|飲酒後の低血糖|general|o|alcohol:3 shakyhungry:3 confused:1|Alcohol stops the liver releasing sugar.|Eat when drinking; Carbs before bed||Call 119 if confused and won't eat.|内科 / 救急|0
Ovarian cancer warning signs|卵巣がんの兆候|sex|s|bloating:3 pelvicpain:2 earlyfull:2 oftenpee:1|Persistent bloating, fullness and pelvic pain most days for weeks.|Note how often||See a gynaecologist if it lasts over 3 weeks.|婦人科|0
Womb cancer warning signs|子宮体がんの兆候|sex|s|spotting:3 elderly:1|Bleeding after menopause or between periods.|Nothing at home||See a gynaecologist soon.|婦人科|0
Throat cancer warning signs|咽頭・喉頭がんの兆候|eent|s|hoarse:3 throatlump:2 smoker:2 alcohol:1|Hoarseness or a lump feeling for over 3 weeks.|Stop smoking||See an ENT within 2 weeks.|耳鼻咽喉科|0
Squamous cell skin cancer|有棘細胞がん|skin|o|scaly:3 mole:2 elderly:1|A crusty growing lump on sun-exposed skin.|Sunscreen||See a dermatologist.|皮膚科|0
Myeloma warning signs|多発性骨髄腫の兆候|body|s|bonepain:3 backpain:2 fatigue:2 elderly:1|A blood cancer causing bone pain and tiredness in older adults.|Nothing at home||See a doctor.|血液内科|0
Bone tumour warning signs|骨腫瘍の兆候|body|s|bonepain:3 lump:2|Deep bone pain at night or a hard lump, often in young people near the knee.|Nothing at home||See an orthopaedic doctor.|整形外科|0
Aspiration pneumonia|誤嚥性肺炎|chest|s|elderly:3 cough:2 fever:2 swallow:2|Food or saliva goes into the lungs in older people.|Eat sitting upright; Brush teeth daily||See a doctor today.|呼吸器内科|0
Summer-type hypersensitivity pneumonitis|夏型過敏性肺炎|chest|o|cough:3 fever:2 breathless:2|A Japan-specific lung allergy to mould in damp old houses in summer; better when away from home.|Clean mould; Ventilate||See a respiratory doctor.|呼吸器内科|0
Post-nasal drip cough|後鼻漏によるせき|chest|m|cough:3 nightcough:2 runnynose:2|Mucus dripping down the throat makes you cough.|Saline rinse; Sleep propped up|allegra nasal|See an ENT if over 3 weeks.|耳鼻咽喉科|14
Cough from blood-pressure medicine|降圧薬によるせき|chest|m|cough:3 newmeds:3|ACE inhibitors cause a dry tickly cough.|Don't stop the medicine yourself||Ask your doctor to switch.|内科|0
Pleural effusion|胸水|chest|s|breathless:3 chestpain:1|Fluid round the lungs.|Sit upright||See a doctor soon.|呼吸器内科|0
Fainting during exercise|運動中の失神|chest|e|faint:3 sport:3 palpit:2|Can signal a heart rhythm or muscle problem.|Stop sport until checked||Call 119; then see a cardiologist.|救急 / 循環器内科|0
Hypertrophic cardiomyopathy warning|肥大型心筋症の兆候|chest|s|chestexert:3 breathless:2 faint:2 sport:1|Thick heart muscle; risky in athletes. Family history of sudden death matters.|Avoid intense sport until checked||See a cardiologist.|循環器内科|0
Endocarditis|感染性心内膜炎|chest|s|nightfever:3 fatigue:2 weightloss:1|Infection on a heart valve: fever for weeks.|Don't wait||See a doctor soon.|循環器内科|0
Mesenteric adenitis (child)|腸間膜リンパ節炎|stomach|m|lowerpain:3 childfever:2 sorethroat:1|Swollen glands in the belly after a virus; looks like appendicitis.|Rest|tylenol|See a doctor to rule out appendicitis.|小児科|7
Faecal impaction|宿便・便塞栓|stomach|o|constip:3 elderly:2 swollenbelly:1|Hard stool stuck in the rectum; watery leakage around it.|Water, fibre, gentle movement|ichijiku|See a doctor.|消化器内科|0
Constipation in older adults|高齢者の便秘|stomach|m|constip:3 elderly:2|Less movement, fluids and more medicines.|Water; Fibre; Walk; Toilet routine|magmi|See a doctor if pain or blood.|内科|0
Bowel incontinence|便失禁|stomach|o|urgency:3 elderly:1 postbirth:1|Leaking stool.|Pelvic floor exercises; Fibre||See a doctor.|消化器内科 / 肛門科|0
Proctitis|直腸炎|stomach|o|bloodymucus:3 urgency:2 bottompain:2 condombreak:1|Inflamed rectum (IBD or infection).|Nothing at home||See a doctor.|消化器内科|0
Urethral stricture|尿道狭窄|urinary|o|weakstream:3 dribble:2|Narrowed urethra from past infection or injury.|Nothing at home||See a urologist.|泌尿器科|0
Bladder stone|膀胱結石|urinary|o|bloodpee:2 burnpee:2 weakstream:2 oftenpee:3|A stone in the bladder.|Drink water||See a urologist.|泌尿器科|0
Blood in pee after exercise|運動後の血尿|urinary|m|bloodpee:3 sport:3|Long runs can cause harmless blood in pee.|Drink well; Recheck in 3 days||See a doctor if it happens again.|泌尿器科|3
UTI in men|男性の尿路感染症|urinary|o|burnpee:3 oftenpee:2 fever:1|Less common in men; may involve the prostate.|Fluids||See a doctor: men need longer antibiotics.|泌尿器科|7
UTI in pregnancy|妊娠中の尿路感染症|urinary|o|burnpee:3 pregnant:3|Needs treatment even if mild.|Fluids||See your obstetrician today.|産婦人科|7
UTI in children|小児の尿路感染症|urinary|o|childfever:3 burnpee:2 cloudypee:2|Fever with smelly pee in a child.|Fluids||See a doctor today.|小児科|7
Lichen planus|扁平苔癬|skin|m|rash:3 itch:2 mouthsore:1|Purple itchy flat bumps; white lace in the mouth.|Gentle skincare|fulcort|See a dermatologist.|皮膚科|0
Erythema nodosum|結節性紅斑|skin|o|redswollen:3 shinpain:2 fever:1|Painful red lumps on the shins.|Rest; Raise legs|tylenol|See a doctor to find the cause.|皮膚科|30
Erythema multiforme|多形紅斑|skin|o|rash:3 lipsore:1|Target-shaped spots after cold sores or medicines.|Note medicines|allegra|See a dermatologist.|皮膚科|14
Scalp ringworm|頭部白癬|skin|m|baldpatch:3 scaly:2|Fungus causing scaly bald patches.|Don't share combs||See a dermatologist (tablets needed).|皮膚科|42
Hand ringworm|手白癬|skin|m|scaly:3 itch:1|Fungus on one hand, often with athlete's foot.|Treat feet too|lamisil|See a dermatologist.|皮膚科|30
Cellulite (normal)|セルライト|skin|m|bodyimage:2 bellyfat:1 weightgain:3|Dimpled skin on thighs: normal fat structure in most women.|Exercise and healthy weight help appearance||Not needed.|—|0
Acne marks|ニキビ跡|skin|m|acne:2 brownpatch:3|Dark marks after spots heal.|Sunscreen; Don't pick; Vitamin C serum||See a dermatologist for scars.|皮膚科|0
Pterygium|翼状片|eent|m|redeye:3 dryeye:1|A fleshy growth on the white of the eye from sun and wind.|Sunglasses|santear|See an eye doctor if growing.|眼科|0
Pinguecula|瞼裂斑|eent|m|redeye:2 dryeye:3|A yellow bump on the white of the eye.|Sunglasses; Lubricating drops|santear|Not needed unless sore.|眼科|0
Retinal vein occlusion|網膜静脈閉塞症|eent|s|blurry:3 highbp:2|Sudden blurry vision in one eye.|Don't wait||See an eye doctor today.|眼科|0
Optic neuritis|視神経炎|eent|s|blurry:3 eyepain:2|Blurred vision with pain moving the eye.|Don't wait||See an eye doctor today.|眼科|0
Keratoconus|円錐角膜|eent|o|blurry:3 halos:1|The cornea thins and bulges; don't rub eyes.|Stop eye rubbing||See an eye doctor.|眼科|0
Glue ear (child)|滲出性中耳炎|eent|m|hearingloss:3 earfull:2|Fluid behind the eardrum after colds; hearing dulls.|Usually clears in weeks||See an ENT if over 3 months.|耳鼻咽喉科|60
Cholesteatoma|真珠腫性中耳炎|eent|s|eardisch:3 hearingloss:2|A skin growth in the middle ear: smelly discharge.|Keep ear dry||See an ENT.|耳鼻咽喉科|0
Lost smell after illness|嗅覚障害|eent|m|smell:3|Smell may take months to return after colds or COVID.|Smell training: sniff 4 strong scents twice a day|zinc|See an ENT if over 2 weeks.|耳鼻咽喉科|90
Mouth breathing|口呼吸|eent|m|drymouth:3 snoreloud:1 stuffynose:1|Breathing through the mouth dries it and affects teeth.|Treat blocked nose; Mouth tape only if nose is clear||See an ENT.|耳鼻咽喉科|0
Recurrent mouth ulcers|再発性アフタ性口内炎|eent|m|mouthsore:3 stress:1|Ulcers that keep coming back.|Avoid sharp foods; Vitamin B; Stress management|vitb ulcerpatch|See a doctor if very frequent.|歯科 / 内科|0
Leukoplakia|白板症|eent|o|tonguewhite:3 smoker:2|A white patch that won't rub off.|Stop smoking||See a dentist or oral surgeon.|口腔外科|0
Tongue-tie|舌小帯短縮症|eent|m|babycry:3|A tight band under the tongue affects feeding or speech.|Nothing at home||See a paediatrician or dentist.|小児科 / 歯科|0
Denture sores|入れ歯による傷|eent|m|mouthsore:3 elderly:2|Badly fitting dentures rub.|Take them out at night; Rinse||See your dentist.|歯科|7
Dupuytren's contracture|デュピュイトラン拘縮|body|m|triggerfinger:2 lump:3|A thick cord in the palm bends fingers.|Nothing at home||See a hand surgeon if fingers bend.|整形外科|0
Turf toe|ターフトゥ|body|m|footpain:3 sport:2|Big toe joint sprain from pushing off.|Rest; Stiff shoe; Ice|vantelin|If no better in 2 weeks.|整形外科|21
Hip labral tear|股関節唇損傷|body|o|hippain:3 sport:1|Clicking and groin pain in the hip.|Avoid deep squats||See an orthopaedic doctor.|整形外科|0
Snapping hip|弾発股|body|m|hippain:3|A click or snap at the hip; usually harmless.|Stretch hip muscles||If painful.|整形外科|0
Scoliosis|側弯症|body|m|posture:3 backpain:1|A sideways curve of the spine, often noticed in teens.|Exercise||See an orthopaedic doctor.|整形外科|0
Psoriatic arthritis|乾癬性関節炎|body|o|jointswell:3 scaly:2 morningstiff:1|Joint pain with psoriasis.|Gentle movement||See a rheumatologist.|膠原病内科|0
Reactive arthritis|反応性関節炎|body|o|jointswell:3 redeye:1 burnpee:1|Joint swelling after a gut or sexual infection.|Rest|loxonin|See a doctor.|膠原病内科|30
Pseudogout|偽痛風|body|o|kneepain:3 jointswell:3 elderly:2|Calcium crystals in a joint, often the knee.|Rest; Ice|loxonin|See a doctor.|整形外科|7
Dowager's hump|首の後ろのこぶ|body|m|posture:3 neckpain:1|Rounded upper back from posture or weak bones.|Posture exercises; Chin tucks||See a doctor for a bone check if older.|整形外科|0
Insomnia in older adults|高齢者の不眠|mind|m|insomnia:3 elderly:2 wakeearly:2|Sleep gets lighter with age.|Daytime light and activity; Short naps only||See a doctor before sleeping pills.|内科|0
Sleep anxiety|睡眠への不安|mind|m|insomnia:3 worryloop:2|Worrying about not sleeping keeps you awake.|Get up after 20 min awake; Only go to bed when sleepy||See a sleep doctor if it lasts.|睡眠外来|0
Social media stress|SNS疲れ|mind|m|screen:3 lowmood:2 anxious:1|Comparing yourself online.|Mute accounts; Set app limits; Phone-free mornings||If low mood lasts.|—|0
Perfectionism|完璧主義|mind|m|anxious:2 procrast:3 stress:2|Fear of mistakes stops you starting or finishing.|Aim for good enough; Set time limits||A counsellor can help.|心療内科|0
Imposter feelings|インポスター症候群|mind|m|anxious:3 lowmood:1|Feeling like a fraud despite success.|Write down your achievements; Talk to peers||Not needed.|—|0
Breakup distress|失恋のつらさ|mind|m|lowmood:3 insomnia:1 lonely:2|A breakup hurts like grief.|Keep routines; Lean on friends; Limit checking their social media||If you can't function for weeks.|心療内科|0
Social withdrawal (hikikomori)|ひきこもり|mind|o|lonely:3 lowmood:2 socialfear:2|Staying home and avoiding contact for months.|Small daily steps outside; Online communities||Support centres (ひきこもり地域支援センター) help families.|精神科|0
Workaholism|仕事依存|mind|m|stress:3 insomnia:1|Can't stop working even when it harms health.|Set a work end time; Plan non-work hobbies||If burnout signs.|心療内科|0
Shopping addiction|買い物依存|mind|m|cantstop:3 stress:1|Buying things you don't need to feel better.|Delete saved cards; 48-hour rule before buying||A counsellor can help.|心療内科|0
Speech delay (toddler)|言葉の遅れ|mind|m|babycry:1 socialfear:3|Fewer words than expected for age.|Talk and read together daily||Ask at the health check or a paediatrician.|小児科|0
Bow legs in toddlers|O脚 (幼児)|body|m|kneepain:1 balance:3|Normal until about age 2-3.|Nothing needed||See a doctor if one side or getting worse.|小児科 / 整形外科|0
Flat head in babies|頭の形のゆがみ (乳児)|head|m|babycry:3|Babies lying on one side get a flat spot.|Tummy time when awake; Change head direction||See a paediatrician if severe.|小児科|0
Nosebleeds in children|子どもの鼻血|eent|m|nosebleed:3 childfever:-1|Common from nose picking and dry air.|Pinch the soft part for 10 min, lean forward||See a doctor if over 20 min or very frequent.|小児科 / 耳鼻咽喉科|0
Childhood tummy aches|子どもの腹痛 (機能性)|stomach|m|lowerpain:3 stress:1|Recurring belly aches in healthy children, often with stress.|Regular meals and toilet time; Reassurance||See a doctor if weight loss, fever or night pain.|小児科|0
Vaginal prolapse|骨盤臓器脱|sex|o|pelvicpain:2 leakpee:2 postbirth:1 elderly:1 genitalbump:3|The womb or bladder drops into the vagina.|Pelvic floor exercises; Avoid straining||See a gynaecologist.|婦人科|0
Ovulation pain|排卵痛|sex|m|pelvicpain:3|One-sided pain mid-cycle.|Heat pad|eve|If severe or with fever.|婦人科|1
Contraceptive pill side effects|ピルの副作用|sex|m|newmeds:3 nausea:1 breastpain:1 spotting:1|Spotting, nausea or breast tenderness in the first months.|Take at the same time daily||See a doctor if leg swelling, chest pain or severe headache.|婦人科|90
IUD problems|IUDのトラブル|sex|o|pelvicpain:3 spotting:2 fever:1|Cramps, bleeding or the strings feel different.|Nothing at home||See a gynaecologist.|婦人科|0
Heartburn in pregnancy|妊娠中の胸やけ|stomach|m|heartburn:3 pregnant:3|The bump and hormones push acid up.|Small meals; Sleep propped up||Ask your obstetrician which antacids are safe.|産婦人科|0
Constipation in pregnancy|妊娠中の便秘|stomach|m|constip:3 pregnant:3|Hormones slow the bowel.|Water, fibre, walking||Ask your obstetrician.|産婦人科|0
Hair loss after birth|産後の抜け毛|skin|m|hairloss:3 postbirth:3|Hair sheds 2-4 months after birth and regrows.|Gentle care||Not needed.|—|180
Sore nipples from breastfeeding|授乳による乳首の痛み|sex|m|breastpain:3 postbirth:3|Often from latch.|Ask a midwife to check the latch; Air-dry nipples||See a midwife or doctor if cracked or fever.|産婦人科|7
Scrotal eczema|陰嚢湿疹|sex|m|itchyscrotum:3 rash:2|Itchy dry scrotal skin.|Loose cotton underwear; Gentle washes|fulcort|See a dermatologist.|皮膚科|14
Penile thrush|陰茎カンジダ|sex|m|penisred:3 itchgenital:2 diabetic:1|Yeast on the head of the penis.|Wash gently; Keep dry|candida|See a doctor if no better in a week.|泌尿器科 / 皮膚科|7
Sports drink overuse|スポーツドリンクの飲みすぎ|general|m|thirsty:2 weightgain:3|Sports drinks have lots of sugar.|Water for daily drinking||Not needed.|—|0
Energy drink dependence|エナジードリンク依存|mind|m|caffeine:3 insomnia:2 palpit:1|Needing energy drinks to function.|Cut down slowly; Sleep||If chest pain.|内科|0
Nicotine withdrawal|ニコチン離脱|mind|m|smokeurge:3 anger:2 restless:2|Irritability and cravings for 2-4 weeks after quitting.|Nicotine gum; Exercise; Delay each craving 5 min||A quit clinic helps.|禁煙外来|21
Keto flu|ケトフル|general|m|fatigue:3 headache:2 newfood:2|Tiredness when starting a very low-carb diet.|Salt and fluids; Ease in||Not needed.|—|7
Protein powder stomach upset|プロテインによる腹部不快感|stomach|m|bloating:3 gas:2 dairy:2|Whey can upset lactose-sensitive people.|Try whey isolate or plant protein||Not needed.|—|1
Fasting side effects|断食の副作用|general|m|headache:2 dizzy:2 shakyhungry:3|Long fasts cause low energy and dizziness.|Break the fast gently; Drink water||See a doctor if diabetic.|内科|1
`;
