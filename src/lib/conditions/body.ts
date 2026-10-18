// Bones, muscles, joints, sports injuries, everyday injuries, children,
// older adults, heat and cold, and other conditions.
export const C_BODY = `
Rotator cuff tear|腱板断裂|body|o|shoulderpain:3 musclewaste:1 lifting:1 elderly:1|A tear in the shoulder tendons: pain and weakness lifting the arm.|Rest from overhead lifting; Ice|loxonin|See an orthopaedic doctor.|整形外科|0
Frozen shoulder|五十肩 (肩関節周囲炎)|body|o|shoulderpain:3 morningstiff:1|The shoulder becomes stiff and painful, often aged 40-60.|Gentle pendulum swings; Warmth; Keep moving within pain|loxonin|See an orthopaedic doctor.|整形外科|180
Shoulder dislocation|肩関節脱臼|body|s|shoulderpain:3 injury:3 bonepain:2|The shoulder comes out of its socket.|Don't try to put it back; Support the arm||See a doctor now.|整形外科 / 救急|0
Collarbone fracture|鎖骨骨折|body|s|shoulderpain:3 injury:3 bonepain:2|A fall onto the shoulder or arm.|Support the arm in a sling||See a doctor today.|整形外科|42
Golfer's elbow|ゴルフ肘|body|m|elbowpain:3 lifting:1|Inner elbow tendon pain from gripping.|Rest; Ice; Stretch forearm|vantelin|See an orthopaedic doctor if over 6 weeks.|整形外科|42
Elbow bursitis|肘頭滑液包炎|body|m|elbowpain:2 jointswell:3|A fluid bump at the tip of the elbow.|Don't lean on it; Ice||See a doctor if red and hot.|整形外科|14
De Quervain's tendinitis|ドケルバン病|body|m|wristpain:3 tendon:2|Thumb-side wrist pain from texting or holding a baby.|Rest; Splint; Ice|vantelin|See an orthopaedic doctor.|整形外科|30
Wrist sprain|手首の捻挫|body|m|wristpain:3 injury:2 sprain:2|A fall onto the hand.|Rest, Ice, Compress, Elevate (RICE)|vantelin|See a doctor if very swollen or can't move it.|整形外科|14
Scaphoid fracture|舟状骨骨折|body|s|wristpain:3 injury:3|A wrist bone easily missed after a fall.|Splint||See a doctor for an X-ray.|整形外科|56
Trigger finger|ばね指|body|m|triggerfinger:3|A finger catches or locks.|Rest; Warm water stretches||See an orthopaedic doctor.|整形外科|30
Mallet finger|槌指 (突き指)|body|o|injury:3 jointpain:2|The fingertip droops after a ball hits it.|Keep it straight with a splint||See a doctor within a week.|整形外科|42
Jammed finger|突き指|body|m|injury:3 jointswell:2|A finger hit end-on by a ball.|Ice; Buddy-tape to the next finger||See a doctor if it can't straighten or looks bent.|整形外科|14
Hand osteoarthritis|ヘバーデン結節|body|m|jointpain:3 jointswell:2 elderly:1|Bony bumps on finger joints.|Warm water; Gentle exercises|vantelin|See a doctor.|整形外科|0
Typing wrist pain|タイピングによる手首痛|body|m|wristpain:3 deskwork:3|Repetitive typing strains tendons.|Wrist rest; Breaks; Keep wrists straight|vantelin|If numbness.|整形外科|14
Gaming thumb|ゲーマーの親指痛|body|m|wristpain:2 tendon:3 screen:2|Overuse of the thumb tendons.|Breaks every 30 min; Stretch||If it continues.|整形外科|14
Hip bursitis|大転子滑液包炎|body|m|hippain:3|Pain on the outside of the hip, worse lying on that side.|Pillow between knees; Ice|vantelin|See a doctor.|整形外科|30
Hip osteoarthritis|変形性股関節症|body|o|hippain:3 morningstiff:2 elderly:1|Worn hip cartilage.|Swimming or cycling; Weight loss|loxonin|See an orthopaedic doctor.|整形外科|0
Hip fracture (older adult)|大腿骨頸部骨折|body|s|hippain:3 injury:3 elderly:3 bonepain:2|A fall in an older person; can't stand.|Call 119||EMERGENCY.|救急|0
Groin strain|鼠径部の肉離れ|body|m|hippain:3 sport:2|Inner thigh muscle pulled during sport.|Rest; Ice; Gentle stretching after a few days|vantelin|If very bruised or no better in 2 weeks.|整形外科|21
Sports hernia|スポーツヘルニア|body|o|hippain:3 groinbulge:1 sport:2|Groin pain with kicking and twisting.|Rest from sport||See a sports doctor.|整形外科|0
Piriformis syndrome|梨状筋症候群|body|m|legshoot:3 sitting:2 hippain:1|A tight buttock muscle irritates the sciatic nerve.|Stretch the buttock; Don't sit on your wallet|vantelin|If numbness or weakness.|整形外科|30
Hamstring strain|ハムストリングの肉離れ|body|o|muscpull:3 sport:2 calfpain:-1|Sudden pain at the back of the thigh while sprinting.|RICE; Gentle walking after 2-3 days|vantelin|See a doctor if bruised or can't walk.|整形外科|21
Quad strain|大腿四頭筋の肉離れ|body|m|muscpull:3 sport:2|Front thigh muscle pulled by kicking or sprinting.|RICE|vantelin|If severe.|整形外科|14
Calf strain|ふくらはぎの肉離れ|body|o|calfpain:3 muscpull:2 sport:2|A sudden calf pain like being kicked.|RICE; Heel lift|vantelin|See a doctor if you can't stand on tiptoe.|整形外科|21
Achilles tendinitis|アキレス腱炎|body|m|heelpain:3 tendon:2 sport:1|Pain at the back of the heel from running.|Rest; Heel raises slowly; Ice|vantelin|If it doesn't improve in 4 weeks.|整形外科|42
Achilles rupture|アキレス腱断裂|body|s|calfpain:3 injury:3|A snap at the back of the ankle; can't push off.|Don't walk on it; Go to hospital||See a doctor today.|整形外科 / 救急|0
ACL injury|前十字靭帯損傷|body|s|kneepain:3 jointswell:3 injury:2 sport:2|A pop and the knee gives way after twisting.|RICE; Crutches||See an orthopaedic doctor.|整形外科|0
Meniscus tear|半月板損傷|body|o|kneepain:3 jointswell:2 injury:1|Knee catches or locks after a twist.|RICE|loxonin|See an orthopaedic doctor.|整形外科|0
Knee osteoarthritis|変形性膝関節症|body|o|kneepain:3 morningstiff:2 elderly:2|Worn knee cartilage.|Thigh-strengthening exercises; Weight loss; Walking poles|vantelin loxonin|See an orthopaedic doctor.|整形外科|0
Patellar tendinitis (jumper's knee)|ジャンパー膝|body|m|kneepain:3 sport:2|Pain below the kneecap from jumping.|Rest from jumping; Ice|vantelin|If over 4 weeks.|整形外科|42
IT band syndrome|腸脛靭帯炎 (ランナー膝)|body|m|kneepain:3 sport:2|Pain on the outside of the knee when running.|Reduce running; Foam roll; Hip strengthening|vantelin|If it continues.|整形外科|30
Osgood-Schlatter|オスグッド病|body|m|kneepain:3 sport:2|A painful bump below the knee in teenage athletes.|Less jumping; Ice||See a doctor if severe.|整形外科|90
Baker's cyst|ベーカー嚢腫|body|m|kneepain:2 lump:3|A fluid swelling behind the knee.|Nothing usually needed||See a doctor (rule out a clot if calf swells).|整形外科|0
Knee bursitis|膝の滑液包炎|body|m|kneepain:2 jointswell:3|Swelling on the front of the knee from kneeling.|Kneeling pad; Ice||See a doctor if red and hot.|整形外科|14
Ankle sprain|足首の捻挫|body|m|anklepain:3 sprain:3 injury:2|Rolling the ankle.|RICE; Gentle movement after 2 days|vantelin|See a doctor if you can't take 4 steps.|整形外科|14
Ankle fracture|足首の骨折|body|s|anklepain:3 bonepain:3 injury:3|Can't walk after a twist or fall.|Don't walk on it; Splint||See a doctor now.|整形外科 / 救急|42
Metatarsal stress fracture|中足骨疲労骨折|body|o|footpain:3 sport:2|Pain on top of the foot after more running.|Rest from running||See a doctor for an X-ray.|整形外科|42
Morton's neuroma|モートン病|body|m|footpain:3 numb:1|Burning between the toes from tight shoes.|Wide shoes; Pads||See a doctor.|整形外科|0
Bunion|外反母趾|body|m|bunion:3 footpain:2|The big toe turns in.|Wide shoes; Toe spacers||See an orthopaedic doctor.|整形外科|0
Flat feet|扁平足|body|m|flatfeet:3 footpain:1|Low arches can ache.|Arch supports; Calf stretches||If painful.|整形外科|0
Heel spur|踵骨棘|body|m|heelpain:3|A bony growth under the heel, often with plantar fasciitis.|Heel cushion; Calf stretches|vantelin|See a doctor.|整形外科|0
Sever's disease|踵骨骨端症 (シーバー病)|body|m|heelpain:3 sport:2|Heel pain in active children.|Less running; Heel cushions||Not needed unless severe.|整形外科|60
Stubbed toe|足の指をぶつけた|body|m|injury:3 footpain:2|Hitting a toe on furniture.|Ice; Buddy tape|tylenol|See a doctor if deformed.|整形外科|7
Broken toe|足の指の骨折|body|m|injury:3 bonepain:2 bruise:2|A toe fracture.|Buddy tape; Stiff-soled shoe||See a doctor if the big toe or deformed.|整形外科|42
Neck strain|首の寝違え|body|m|neckpain:3|Waking with a stiff neck.|Gentle movement; Warmth after the first day|vantelin|If arm numbness or fever.|整形外科|7
Whiplash|むち打ち症|body|o|neckpain:3 injury:2 headache:1|Neck injury from a car crash.|Gentle movement; Pain relief|loxonin|See a doctor after any crash.|整形外科|30
Cervical radiculopathy|頚椎症性神経根症|body|o|neckpain:2 numb:3 shoulderpain:1|A pinched nerve in the neck: pain and numbness down the arm.|Avoid looking up for long|loxonin|See an orthopaedic doctor.|整形外科|42
Spinal stenosis|脊柱管狭窄症|body|o|legshoot:2 legcramplwalk:3 elderly:2 backpain:1|Narrowed spine: legs ache when walking, better leaning forward.|Cycling; Lean on a shopping cart||See an orthopaedic doctor.|整形外科|0
Spondylolysis|腰椎分離症|body|o|backpain:3 sport:2|A stress fracture in the lower back in young athletes.|Rest from sport||See an orthopaedic doctor.|整形外科|90
Acute low back pain (gikkuri-goshi)|ぎっくり腰|body|m|backpain:3 lifting:2|Sudden back spasm after lifting or twisting.|Keep gently moving; Warm bath after day 2|loxonin loxtape|See a doctor if numbness, leg weakness or pee problems.|整形外科|7
Sacroiliac joint pain|仙腸関節炎|body|m|backpain:3 hippain:1|Pain low in the back near the dimples.|Gentle stretches; Pelvic belt|vantelin|If it continues.|整形外科|30
Coccydynia|尾骨痛|body|m|tailbone:3|Tailbone pain after a fall or long sitting.|Cushion with a hole; Avoid hard seats|tylenol|If over 2 months.|整形外科|30
Rib fracture|肋骨骨折|body|o|ribpain:3 injury:2|Pain on breathing after a fall or blow.|Deep breaths every hour to avoid pneumonia|loxonin|See a doctor; go now if breathless.|整形外科|42
Cough rib fracture|せきによる肋骨骨折|body|m|ribpain:3 longcough:2|Coughing hard can crack a rib.|Hold a pillow when coughing|loxonin|See a doctor.|整形外科|42
Osteoporosis|骨粗しょう症|body|o|achybones:3 elderly:2 bonepain:1|Thin bones that break easily.|Calcium, vitamin D, sunlight; Strength and balance exercise|vitd|Ask for a bone scan (骨密度検査).|整形外科|0
Compression fracture|圧迫骨折|body|s|backpain:3 elderly:2 injury:1|A spine bone collapses in an older person.|Rest|tylenol|See a doctor.|整形外科|0
Stress fracture of the shin|脛骨疲労骨折|body|o|shinpain:3 sport:2|A small crack from too much running.|Rest from running||See a doctor for an X-ray.|整形外科|56
Compartment syndrome|コンパートメント症候群|body|s|calfpain:3 injury:2 numb:2|Severe pressure in a limb after injury.|Go to hospital now||EMERGENCY.|救急|0
Muscle cramps at night|夜間のこむら返り|body|m|cramp:3 nightpee:-1|Calf cramps in bed.|Stretch the calf before bed; Water; Magnesium foods|shakuyaku|See a doctor if every night.|内科|0
Exercise cramps|運動中のけいれん|body|m|cramp:3 sport:2 heatexp:1|Cramps during exercise with sweat loss.|Sports drink; Stretch|os1|Not needed.|—|0
Weightlifter's back strain|ウェイトでの腰痛|body|m|backpain:3 lifting:3|Lifting with a rounded back.|Rest a few days; Light movement; Fix technique|loxonin|If leg pain or numbness.|整形外科|7
Bicep tendon rupture|上腕二頭筋腱断裂|body|o|elbowpain:2 bruise:2 lifting:3 muscpull:3|A pop in the arm while lifting, with a bulging muscle.|Ice||See an orthopaedic doctor within a week.|整形外科|0
Pectoral tear|大胸筋断裂|body|o|chestpress:2 bruise:2 lifting:3 muscpull:3|Tear during heavy bench pressing.|Ice||See a doctor soon.|整形外科|0
Overtraining syndrome|オーバートレーニング症候群|body|m|sorework:3 fatigue:2 insomnia:1 sport:3|Training too hard without rest.|Rest days; Sleep 8 h; Eat enough||If it lasts weeks.|スポーツ外来|14
Hypermobility|関節弛緩性|body|m|jointpain:3 sprain:2|Very flexible joints that sprain easily.|Strengthening exercises||See a doctor if frequent dislocations.|整形外科|0
Growing pains|成長痛|body|m|kneepain:3 childfever:-1|Leg aches at night in children, gone by morning.|Massage; Warm bath||See a doctor if limping, swelling or fever.|小児科|0
Pulled elbow (child)|肘内障|body|o|elbowpain:3 injury:2|A toddler won't use an arm after being pulled by the hand.|Don't pull by the hand||See a doctor: a quick move fixes it.|整形外科 / 小児科|0
Limp in a child|子どもの跛行|body|o|hippain:3 childfever:2|A child suddenly limps.|Rest||See a doctor today, especially with fever.|小児科 / 整形外科|0
Teething|歯が生える時期の不快感|eent|m|babycry:3 drymouth:-1|Babies drool and chew while teeth come in.|Cold teether; Gum massage|tylenol|If high fever (teething doesn't cause it).|小児科|0
Nappy rash|おむつかぶれ|skin|m|rash:3 babycry:1|Wet nappies irritate skin.|Change often; Air time; Barrier cream|hirumild|See a doctor if spots or blisters.|小児科 / 皮膚科|5
Cradle cap|乳児脂漏性湿疹|skin|m|dandruff:3 babycry:-1|Yellow crusty scalp in babies.|Oil to soften, then gentle wash||Not needed.|小児科|30
Baby eczema|乳児湿疹|skin|m|rash:3 dryskin:2 itch:1|Dry itchy patches in babies.|Moisturise twice daily; Lukewarm baths|hirumild|See a doctor if weeping or infected.|小児科 / 皮膚科|0
Bed-wetting|夜尿症|urinary|m|nightpee:3|Common in children up to 7.|Pee before bed; Less drink in the evening; Don't punish||See a doctor if over 7 or started again.|小児科|0
Newborn jaundice|新生児黄疸|general|o|yellow:3 babycry:-1|Yellow skin in the first days of life.|Feed often||See a doctor if very yellow, sleepy or after 2 weeks.|小児科|14
Dehydration in babies|乳児の脱水|general|s|babycry:2 vomit:2 diarrhea:2 darkpee:3|Few wet nappies, sunken eyes, very sleepy.|Small frequent feeds; Call your doctor||Go now.|救急 / 小児科|0
Fever in a baby under 3 months|生後3か月未満の発熱|general|s|childfever:3 fever:3|Any fever of 38 °C or more in a young baby.|Don't wait||Go to hospital now.|救急 / 小児科|0
Heat stroke in children|子どもの熱中症|general|e|hot:3 childfever:2 sleepy:2|Children heat up fast, e.g. in cars.|Cool water; Shade; Call 119||EMERGENCY.|救急|0
Falls in older adults|高齢者の転倒|body|o|balance:3 elderly:3 injury:1|Weak muscles, medicines and poor eyesight cause falls.|Remove rugs and clutter; Night lights; Balance exercises||See a doctor after any fall with injury.|整形外科 / 内科|0
Frailty|フレイル|general|o|elderly:3 musclewaste:2 weightloss:2 easytired:2|Muscle and energy decline with age.|Protein at every meal; Walking and chair squats; Stay social||Ask your doctor about a frailty check.|内科|0
Delirium|せん妄|head|e|confused:3 elderly:3|Sudden confusion in an older person, often from infection or medicines.|Stay with them||See a doctor today; call 119 if very unwell.|救急 / 内科|0
Pressure sores|床ずれ|skin|o|elderly:3 redswollen:2 cut:2|Skin breaks down from lying still.|Turn every 2 hours; Cushions||See a doctor or nurse.|皮膚科|0
Hearing aid need|補聴器が必要|eent|m|hearingloss:3 elderly:2|Untreated hearing loss raises dementia risk.|Hearing test||See an ENT.|耳鼻咽喉科|0
Heat cramps|熱けいれん|body|m|cramp:3 heatexp:3|Cramps from sweating out salt.|Shade; OS-1 or sports drink|os1|If confusion.|内科|1
Heat syncope|熱失神|general|o|faint:2 heatexp:3 standdizzy:2|Fainting in the heat.|Lie down in shade; Raise legs; Fluids|os1|See a doctor if they don't recover quickly.|救急|1
Sunstroke risk at work|職場での熱中症リスク|general|m|heatexp:3 thirsty:2|Hot outdoor work.|Drink every 20 min; Rest in shade; Salt candy|os1|If dizzy or headache.|内科|0
Exercise-associated collapse|運動後の虚脱|general|o|faint:3 sport:3|Collapsing after finishing a race.|Lie down; Raise legs; Fluids|os1|Call 119 if collapse during exercise or confused.|救急|0
Lightning or sun exposure dizziness|日差しによるめまい|general|m|dizzy:3 heatexp:2 thirsty:1|Too long in sun.|Shade, fluids, rest|os1|If no better in 30 min.|内科|0
Cold urticaria at sea|寒冷蕁麻疹 (海水浴)|skin|m|hives:3 cold:2|Hives after cold water.|Never swim alone|allegra|See a doctor.|皮膚科|0
Sun-damaged eyes|紫外線による目の障害|eent|m|redeye:3 eyepain:2 heatexp:1|UV burn of the eyes.|Sunglasses|santear|If pain continues.|眼科|2
Mild head bump|軽い頭部打撲|head|m|headinjury:3|A small knock without other symptoms.|Ice; Watch for 24 hours|tylenol|Go now if vomiting, worsening headache, confusion or very sleepy.|脳神経外科|1
Nose fracture|鼻骨骨折|eent|o|nosebleed:3 injury:3 facepain:2|A blow to the nose.|Ice; Pinch to stop bleeding||See an ENT within a week.|耳鼻咽喉科|21
Black eye|目の周りのあざ|eent|m|injury:3 bruise:2 eyelidswell:2|Bruise round the eye.|Cold pack|tylenol|Go now if vision changes or eye won't move.|眼科|10
Tooth knocked out|歯の脱臼|eent|s|brokentooth:3 injury:2|An adult tooth knocked out.|Hold by the crown; Put in milk; Dentist within 1 hour||See a dentist now.|歯科|0
Jaw dislocation|顎関節脱臼|eent|o|jawpain:3|The jaw locks open after a yawn.|Don't force it||See a doctor or dentist now.|口腔外科|0
Cut finger in the kitchen|包丁での切り傷|skin|m|cut:3|A knife cut.|Press firmly for 10 min; Raise the hand; Clean and cover|kizupower|See a doctor if gaping, deep or won't stop bleeding.|外科|7
Deep cut needing stitches|縫合が必要な傷|skin|o|cut:3 injury:2|A gaping or deep wound.|Press firmly; Cover||See a doctor within 6 hours.|外科|0
Puncture wound (nail)|釘を踏んだ|skin|o|cut:3 injury:2|Stepping on a nail.|Wash well||See a doctor for tetanus and infection check.|外科|0
Road rash|すり傷 (擦過傷)|skin|m|cut:3 injury:2|Scraped skin from a fall.|Rinse well with water; Moist dressing|kizupower|If grit stays in or infected.|外科|10
Burn from hot oil|油でのやけど|skin|o|burn:3 blisters:2|Cooking oil splash.|Cool water 20 min; Cover loosely||See a doctor if larger than your palm.|皮膚科|10
Hand burn from iron or pan|アイロン・鍋のやけど|skin|m|burn:3|Small contact burn.|Cool water 20 min; Cover|aftercare|If blisters larger than a coin.|皮膚科|7
Insect in the ear|耳に虫が入った|eent|o|earache:2 earfull:3|A bug crawls into the ear.|Turn the ear to a light; A drop of oil||See an ENT.|耳鼻咽喉科|0
Object in a child's nose|鼻の異物|eent|o|stuffynose:3 badbreath:1|A bead or toy in a nostril.|Blow the other side; Don't poke||See an ENT.|耳鼻咽喉科|0
Fish bone in throat|魚の骨が刺さった|eent|o|throatlump:3 swallowpain:2|A bone sticks in the throat.|Don't swallow rice to push it||See an ENT.|耳鼻咽喉科|0
Hangnail|ささくれ|skin|m|cut:3 redswollen:1|Torn skin beside a nail.|Clip it; Moisturise|actibia|If infected.|皮膚科|5
Paper cut|紙で切った傷|skin|m|cut:3|A small sharp cut.|Wash and cover|kizupower|Not needed.|—|3
Motion sickness on boats|船酔い|stomach|m|motion:3 nausea:2|The inner ear and eyes disagree.|Look at the horizon; Fresh air|aneron travelmin|Not needed.|—|0
Hiccups in babies|赤ちゃんのしゃっくり|stomach|m|hiccups:3 babycry:-1|Common after feeds.|Burp the baby||Not needed.|—|0
Hay fever in children|子どもの花粉症|eent|m|sneeze:3 itchyeye:2 pollen:2|Pollen allergy in kids.|Mask and glasses; Shower after outside|allegra|See a doctor for child doses.|小児科 / 耳鼻咽喉科|30
Dust mite allergy|ダニアレルギー|eent|m|sneeze:3 stuffynose:2 nightcough:1|Reaction to house mites.|Hot-wash bedding weekly; Dry futons; Vacuum|allegra|See an allergist.|アレルギー科|0
Pet allergy|ペットアレルギー|eent|m|sneeze:3 itchyeye:2 hives:1|Cat or dog allergy.|Keep pets out of the bedroom; Air purifier|allegra|See an allergist.|アレルギー科|0
Mould allergy|カビアレルギー|eent|m|sneeze:3 cough:1 wheeze:1|Damp homes in rainy season (梅雨).|Ventilate; Dehumidify; Clean mould|allegra|See an allergist.|アレルギー科|0
PM2.5 / yellow dust irritation|PM2.5・黄砂|eent|m|cough:3 itchyeye:2 sorethroat:2|Air pollution in spring.|Check forecasts; Mask; Close windows|santear|If wheezing.|内科|0
Sick building irritation|シックハウス症候群|general|m|headache:3 itchyeye:2 sorethroat:1|Chemicals from new furniture or buildings.|Ventilate daily||If it continues.|内科|0
Static shock sensitivity|静電気|general|m|electric:3|Dry winter air.|Humidify; Touch metal with a key first||Not needed.|—|0
Weather-related joint pain|天気による関節痛|body|m|jointpain:3|Pressure changes before rain.|Keep warm; Gentle movement|vantelin|Not needed.|—|0
Chronic pain|慢性疼痛|body|o|bodyache:3 lowmood:1 insomnia:1|Pain lasting over 3 months.|Stay active; Pace yourself; Sleep||See a pain clinic (ペインクリニック).|ペインクリニック|0
Lyme-like joint pain after travel|旅行後の関節痛|body|m|jointpain:3 travel:2|Joint pain after a viral illness abroad.|Rest|tylenol|See a doctor if fever.|内科|14
Lymphoedema|リンパ浮腫|general|o|legswell:2 ankleswell:3|Swelling from blocked lymph drainage.|Compression; Skin care||See a doctor.|内科 / 形成外科|0
Hernia after surgery|腹壁瘢痕ヘルニア|stomach|o|swollenbelly:2 groinbulge:3|A bulge at an old scar.|Avoid heavy lifting||See a surgeon.|外科|0
Umbilical hernia|臍ヘルニア|stomach|m|groinbulge:3 bellyfat:1|A bulge at the belly button.|Avoid straining||See a surgeon; go now if painful and hard.|外科|0
Hemorrhoids in pregnancy|妊娠中の痔|stomach|m|bottompain:3 pregnant:3|Pressure and constipation in pregnancy.|Fibre, water; Don't strain|borraginol|Ask your obstetrician.|産婦人科|0
Varicose veins in pregnancy|妊娠中の静脈瘤|body|m|legswell:2 pregnant:3|Leg veins swell in pregnancy.|Raise legs; Compression socks||Ask your obstetrician.|産婦人科|0
Back pain in pregnancy|妊娠中の腰痛|body|m|backpain:3 pregnant:3|The bump changes posture.|Pregnancy belt; Gentle stretches|tylenol|Ask your obstetrician.|産婦人科|0
Carpal tunnel in pregnancy|妊娠中の手根管症候群|body|m|handnumbnight:3 pregnant:3|Fluid presses the wrist nerve.|Wrist splint at night||Usually goes after birth.|産婦人科|0
Leg cramps in pregnancy|妊娠中のこむら返り|body|m|cramp:3 pregnant:3|Common in later pregnancy.|Stretch calves before bed||Ask your obstetrician.|産婦人科|0
Pelvic girdle pain in pregnancy|妊娠中の恥骨痛|body|m|hippain:3 pregnant:3|The pelvic joints loosen.|Keep knees together when turning; Belt||Ask your obstetrician.|産婦人科|0
Nosebleeds in winter|冬の鼻血|eent|m|nosebleed:3 dryskin:1|Dry air cracks nose lining.|Humidify; Petroleum jelly inside the nostril||If over 20 min.|耳鼻咽喉科|0
Chapped lips in winter|冬の唇荒れ|eent|m|lipsore:3 dryskin:2|Cold dry air.|Lip balm; Don't lick lips||Not needed.|—|0
Winter depression from dark mornings|冬季の気分の落ち込み|mind|m|lowmood:3 sleepy:2|Short days lower energy.|Morning light; Exercise outdoors|vitd|If it affects daily life.|心療内科|0
Spring fatigue (gogatsu-byo)|五月病|mind|m|lowmood:3 fatigue:2 homesick:1|Low energy after the new school or work year in April.|Routine; Sleep; Small enjoyable plans||See a doctor if it lasts.|心療内科|0
Summer fatigue (natsubate)|夏バテ|general|m|fatigue:3 noappetite:2 heatexp:2|Heat and cold air-conditioning drain energy.|Pork, eel, umeboshi; Avoid over-cold rooms; Sleep|vitb|If very weak.|内科|0
Air-conditioner chill|冷房病|general|m|fatigue:3 headache:2 coldhands:2|Going between hot outside and cold inside.|Cardigan; Warm drinks; Set AC to 27-28 °C||Not needed.|—|0
`;
