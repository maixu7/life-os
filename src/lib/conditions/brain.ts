// Brain, nerves, mental health, sleep, habits and life stress.
export const C_BRAIN = `
Epilepsy|てんかん|head|s|seizure:3 confused:1|Repeated seizures from abnormal brain activity.|Don't restrain; Turn them on their side; Time it; Call 119 if over 5 min or first seizure||See a neurologist.|脳神経内科|0
First seizure|初めてのけいれん発作|head|e|seizure:3|Any first seizure needs a check.|Lay on side; Nothing in the mouth; Call 119||EMERGENCY.|救急|0
Transient ischaemic attack (mini-stroke)|一過性脳虚血発作 (TIA)|head|e|speech:3 weakside:3 facedroop:2 doublevis:2|Stroke symptoms that go away within minutes: a warning a stroke may follow.|Call 119 even if it passed||EMERGENCY.|救急|0
Bell's palsy|顔面神経麻痺 (ベル麻痺)|head|s|facedroop:3 earache:1|One side of the face suddenly weak (can't close eye or smile), with no arm or leg weakness.|Protect the eye with tape at night||See a doctor within 72 hours for steroids; go now if any arm/leg weakness or speech trouble.|脳神経内科 / 耳鼻咽喉科|30
Trigeminal neuralgia|三叉神経痛|head|o|faceburn:3 facepain:1|Electric shock pain in the face triggered by touch, chewing or wind.|Note triggers; Avoid cold wind||See a neurologist; medicines help.|脳神経内科|0
Occipital neuralgia|後頭神経痛|head|m|headache:3 neckpain:2 posture:1|Shooting pain at the back of the head.|Neck stretches; Warm towel|tylenol|See a doctor if it continues.|脳神経内科|7
Parkinson's disease signs|パーキンソン病の兆候|head|o|tremor:3 balance:2 elderly:1 smell:1|Shaking at rest, stiffness and slow movement.|Stay active||See a neurologist.|脳神経内科|0
Essential tremor|本態性振戦|head|m|tremor:3 caffeine:1|Hands shake when using them (writing, cups); runs in families.|Less caffeine; Use heavier cups||See a neurologist if it affects daily life.|脳神経内科|0
Dementia warning signs|認知症の兆候|head|o|memory:3 confused:2 elderly:2|Memory loss that affects daily life.|Routines; Stay social; Exercise||See a doctor (物忘れ外来).|脳神経内科 / 物忘れ外来|0
Normal forgetfulness|年齢による物忘れ|head|m|memory:3 stress:1 sleepy:1|Forgetting names or where keys are, especially when tired or stressed. Normal.|Sleep; Lists and phone reminders||If it's getting worse or others notice.|—|0
Multiple sclerosis signs|多発性硬化症の兆候|head|o|numb:3 blurry:2 doublevis:1 balance:2 fatigue:1|The immune system damages nerve coverings: numbness, vision changes.|Nothing at home||See a neurologist.|脳神経内科|0
Guillain-Barré syndrome|ギラン・バレー症候群|body|s|musclewaste:3 tingfeet:2 numb:2|Weakness rising from the legs, often after a stomach bug.|Go to hospital||EMERGENCY.|救急|0
Peripheral neuropathy|末梢神経障害|body|o|tingfeet:3 numb:2 diabetic:2 alcohol:1|Damaged nerves in the feet and hands.|Check feet daily; Control blood sugar; Less alcohol|vitb|See a doctor.|脳神経内科|0
Ulnar nerve (funny bone)|肘部管症候群|body|m|numb:3 elbowpain:2|Pressure on the elbow nerve numbs the little and ring fingers.|Don't lean on elbows; Keep elbows straighter at night||See a doctor if weakness.|整形外科|30
Thoracic outlet syndrome|胸郭出口症候群|body|m|numb:3 posture:2 shoulderpain:2 neckpain:1|Nerves squeezed between collarbone and rib.|Posture exercises; Avoid carrying heavy bags||See a doctor.|整形外科|30
Restless legs worse at night|むずむず脚症候群（夜間）|body|m|restlegs:3 insomnia:2 ironpill:-1|An urge to move the legs in the evening.|Walk and stretch; Less caffeine and alcohol; Check iron|vitd|See a doctor; iron helps if low.|脳神経内科|0
Sleep paralysis|睡眠麻痺 (金縛り)|mind|m|nightmare:3 sleepy:1 nightshift:2|Waking unable to move, sometimes seeing things. Harmless.|Regular sleep; Don't sleep on your back; It passes in seconds||If very frequent.|睡眠外来|0
REM sleep behaviour disorder|レム睡眠行動障害|mind|o|nightmare:3 elderly:1|Acting out dreams, punching or shouting in sleep.|Make the bedroom safe||See a sleep doctor.|睡眠外来 / 脳神経内科|0
Sleepwalking|夢遊病|mind|m|nightmare:3 stress:1|Walking in sleep, common in children.|Safe bedroom; Lock doors||If injuries.|睡眠外来|0
Nightmares|悪夢|mind|m|nightmare:3 stress:2 traumaevent:1|Frequent bad dreams, often with stress or trauma.|Calm bedtime; No scary content late; Write the dream down and change its ending||If they ruin sleep for weeks.|心療内科|0
Shift work sleep disorder|交代勤務睡眠障害|mind|m|nightshift:3 insomnia:2 sleepy:2|Body clock fights your work hours.|Blackout curtains; Same sleep block daily; Bright light at work start||See a sleep doctor.|睡眠外来|0
Jet lag|時差ぼけ|mind|m|nightshift:3 sleepy:2 insomnia:1|Body clock is in the wrong time zone.|Morning light at the new place; Short naps only; Eat on local time||Not needed.|—|5
Oversleeping (hypersomnia)|過眠症|mind|o|sleepy:3 poorfocus:1|Sleeping 10+ hours and still tired.|Regular wake time||See a sleep doctor.|睡眠外来|0
Bruxism|歯ぎしり|eent|m|grind:3 jawpain:2 headache:1 stress:1|Grinding or clenching teeth at night.|Mouth guard from a dentist; Relax jaw; Less caffeine||See a dentist.|歯科|0
Snoring|いびき|eent|m|snoreloud:3 alcohol:1 bellyfat:1|Narrow airway vibrates in sleep.|Sleep on your side; Less alcohol; Lose weight||See a doctor if you stop breathing in sleep.|耳鼻咽喉科 / 睡眠外来|0
Panic disorder|パニック障害|mind|o|panicrep:3 palpit:2 breathless:2 anxious:2|Repeated panic attacks and fear of the next one.|Slow breathing (4 in, 6 out); Don't avoid places||See a doctor; very treatable.|心療内科 / 精神科|0
Agoraphobia|広場恐怖症|mind|o|anxious:3 panicrep:2 socialfear:1|Fear of places where escape feels hard (trains, crowds).|Small steps back into those places||See a doctor.|心療内科|0
Generalised anxiety|全般性不安障害|mind|o|worryloop:3 anxious:3 restless:2 insomnia:1|Worrying about everything, most days, for months.|Worry time: 15 min a day; Exercise; Less caffeine||See a doctor; therapy and medicines help.|心療内科|0
Specific phobia|恐怖症|mind|m|anxious:3|Intense fear of one thing (needles, heights, spiders).|Gradual exposure||See a therapist if it limits life.|心療内科|0
Illness worry from the internet|ネット検索による健康不安|mind|m|worryloop:3 anxious:2|Searching symptoms makes worry worse.|Limit searching; Write down questions for one doctor visit||See a doctor once, then trust the answer.|内科|0
Seasonal depression|季節性うつ|mind|o|lowmood:3 sleepy:2 weightgain:1|Low mood in winter from less daylight.|Morning light walks; Light box; Exercise|vitd|See a doctor if it affects daily life.|心療内科|0
Persistent low mood (dysthymia)|気分変調症|mind|o|lowmood:3 fatigue:1 poorfocus:1|Mild low mood most days for 2+ years.|Routine; Exercise; Connect with people||See a doctor.|心療内科|0
Grief|悲嘆|mind|m|grief:3 lowmood:2 insomnia:1|Grief after losing someone comes in waves.|Let yourself feel it; Talk about them; Keep basic routines||See a doctor if months later you can't function.|心療内科|0
Loneliness|孤独|mind|m|lonely:3 lowmood:1|Feeling disconnected is common, especially living abroad.|One small contact a day; Join a club or class; Volunteer||Talk to someone if it brings dark thoughts.|—|0
Culture shock / homesickness|カルチャーショック・ホームシック|mind|m|homesick:3 lonely:2 lowmood:1|Living in a new country is stressful.|Connect with home and local people; Learn a little language daily; Familiar food sometimes||See a counsellor if it lasts.|—|0
Work stress|仕事のストレス|mind|m|stress:3 insomnia:1 anxious:1|Too much work or conflict at work.|Set work boundaries; Breaks; Talk to your manager||Japan: free counselling via こころの耳.|心療内科|0
Anger problems|怒りのコントロール困難|mind|m|anger:3 stress:2|Outbursts that hurt relationships.|Walk away and breathe; Exercise; Sleep||A counsellor can teach skills.|心療内科|0
Procrastination|先延ばし癖|mind|m|procrast:3 poorfocus:2|Avoiding tasks due to stress or perfectionism.|Two-minute start; Break tasks small; Phone in another room||If with low mood or ADHD signs.|—|0
Gambling problem|ギャンブル依存|mind|o|gambling:3 stress:2 lowmood:1|Pachinko or betting you can't stop, with debts.|Block betting sites; Hand money control to someone you trust||See a doctor; GA meetings help.|精神科|0
Nicotine dependence|ニコチン依存症|mind|m|smokeurge:3 smoker:3|Nicotine addiction.|Set a quit date; Nicotine gum or patches; Avoid triggers for 2 weeks||Quit-smoking clinics (禁煙外来) are covered by insurance.|禁煙外来|0
Alcohol withdrawal|アルコール離脱|mind|e|alcohol:3 tremor:3 sweats:2 confused:2 seizure:2|Stopping heavy drinking suddenly causes shaking and can cause seizures.|Don't stop suddenly alone if you drink daily; Get medical help||See a doctor today; call 119 if seizure or confusion.|精神科 / 救急|0
Cannabis or drug misuse|薬物乱用|mind|s|hearvoices:3 anxious:2 sleepy:1|Drugs harm mental health and are illegal in Japan.|Stop; Talk to someone||See a doctor; mental health centres (精神保健福祉センター) help confidentially.|精神科|0
Hair pulling (trichotillomania)|抜毛症|mind|m|hairpull:3 baldpatch:2 stress:1|An urge to pull hair, often when stressed or bored.|Fidget toys; Notice triggers; Cover hands||See a therapist.|心療内科|0
Skin picking|皮膚むしり症|mind|m|hairpull:3 cut:1|Repeated picking at skin.|Keep nails short; Fidget toys||See a therapist.|心療内科|0
Body dysmorphia|身体醜形障害|mind|o|bodyimage:3 lowmood:2 anxious:1|Constant worry about a flaw others barely see.|Limit mirror checking||See a doctor.|心療内科|0
Muscle dysmorphia|筋肉醜形恐怖|mind|o|bodyimage:3 steroids:1|Feeling too small despite being muscular.|Notice obsessive training and checking||See a doctor.|心療内科|0
Tic disorder|チック症|head|m|tics:3 stress:1|Sudden repeated movements or sounds.|Reduce stress; Don't punish tics||See a doctor if they cause problems.|小児科 / 精神科|0
Autism signs|自閉スペクトラム症の兆候|mind|m|socialfear:3 cantstop:2|Differences in social communication and strong routines.|Understanding and structure help||See a developmental clinic.|精神科 / 発達外来|0
Adult ADHD|大人のADHD|mind|m|poorfocus:3 hyper:2 procrast:2|Lifelong trouble focusing, restlessness and disorganisation.|Lists, alarms, short work blocks; Exercise||See a psychiatrist.|精神科|0
Eating disorder warning signs|摂食障害の兆候|mind|s|bodyimage:3 weightloss:2 eatingbinge:1|Restricting food, purging or extreme exercise.|Talk to someone you trust||See a doctor or eating disorder service.|心療内科|0
Self-harm|自傷|mind|e|selfharm:3 lowmood:2|Hurting yourself to cope with pain.|Remove means; Call someone now||Call 119 or いのちの電話 0570-783-556.|救急 / 精神科|0
Psychosis in young adults|若年者の精神病|mind|s|hearvoices:3 confused:2 insomnia:1|Hearing or believing things others don't.|Stay with someone safe||See a psychiatrist soon.|精神科|0
Dissociation|解離|mind|o|traumaevent:3 confused:2 anxious:2|Feeling unreal or detached from yourself.|Grounding: name 5 things you see||See a doctor.|心療内科|0
Insomnia from phone use|スマホによる不眠|mind|m|insomnia:3 screen:3 latesleep:2|Bright screens and scrolling keep the brain awake.|Phone out of the bedroom; No screens 1 h before bed||If it continues.|睡眠外来|0
Insomnia from caffeine|カフェインによる不眠|mind|m|insomnia:3 caffeine:3|Caffeine lasts 6+ hours.|No caffeine after 2 pm||Not needed.|—|0
Sunday-night anxiety|日曜夜の不安|mind|m|anxious:3 insomnia:1 stress:2|Dread before the work week.|Plan Monday on Friday; Enjoy Sunday evening||If it's every week and severe.|—|0
Exam stress|試験のストレス|mind|m|stress:3 insomnia:1 poorfocus:1|Pressure before exams.|Study in blocks with breaks; Sleep is when memory sets; Walk daily||If panic attacks.|—|0
Burnout from caregiving|介護疲れ|mind|o|stress:3 fatigue:2 lowmood:2|Caring for someone wears you out.|Ask for respite care; Take breaks||Ask your city's 地域包括支援センター for support.|心療内科|0
Concussion in sports|スポーツによる脳しんとう|head|s|headinjury:3 headache:2 dizzy:2 confused:1 sport:2|A blow to the head during sport.|Stop playing today; No sport until symptom-free||See a doctor; call 119 if vomiting, sleepy or confused.|脳神経外科|14
Chronic subdural haematoma|慢性硬膜下血腫|head|s|headinjury:3 confused:2 balance:2 elderly:2 memory:1|Slow bleed weeks after a minor bump, mostly in older people.|Don't wait||See a doctor today.|脳神経外科|0
Brain tumour warning signs|脳腫瘍の兆候|head|s|headache:3 vomit:2 seizure:2 blurry:1 confused:1|New headaches worse in the morning, vomiting, seizures.|Don't wait||See a doctor soon.|脳神経外科|0
Idiopathic intracranial hypertension|特発性頭蓋内圧亢進症|head|o|headache:3 blurry:2 ringing:1 weightgain:1|High pressure around the brain, often in young women.|Weight loss helps||See a doctor.|脳神経内科|0
Hangover headache|二日酔いの頭痛|head|m|headache:3 alcohol:3 thirsty:2|Dehydration and alcohol by-products.|Water; Rest; Eat|tylenol os1|Not needed.|—|1
Ice-cream headache|アイスクリーム頭痛|head|m|headache:3|Cold food triggers a brief headache.|Eat cold food slowly||Not needed.|—|0
Weather headache|天気痛|head|m|headache:3 neckpain:1|Pressure changes before rain trigger headaches.|Regular sleep; Gentle neck exercises|tylenol|If very frequent.|頭痛外来|0
Screen headache|画面による頭痛|head|m|headache:3 screen:3 dryeye:1|Long screen time strains eyes and neck.|20-20-20 rule; Screen at eye level|tylenol|If it continues.|眼科|1
Dehydration headache|脱水による頭痛|head|m|headache:3 thirsty:2 heatexp:1|Not drinking enough.|Drink water slowly|os1|If no better after fluids.|内科|1
Hunger headache|空腹による頭痛|head|m|headache:3 shakyhungry:2|Low blood sugar.|Eat something with protein||Not needed.|—|0
Sinus headache|副鼻腔による頭痛|head|m|headache:3 facepain:2 stuffynose:2|Blocked sinuses.|Steam; Saline rinse|tylenol|If fever or over 10 days.|耳鼻咽喉科|7
Exercise headache|運動時頭痛|head|o|headache:3 sport:3|Headache with hard exercise.|Warm up; Hydrate|tylenol|The first one: see a doctor.|脳神経内科|1
Persistent dizziness (PPPD)|持続性知覚性姿勢誘発めまい|head|m|dizzy:3 anxious:1 balance:1|Constant unsteadiness worse in busy places, often after a vertigo episode.|Gradual exposure; Balance exercises||See an ENT or neurologist.|耳鼻咽喉科|0
Motion sickness in children|子どもの乗り物酔い|stomach|m|motion:3 nausea:2|Common in kids.|Front seat or window; Look outside; Light meal|travelmin|Not needed.|—|0
Text neck|ストレートネック|body|m|posture:3 neckpain:2 headache:1|Looking down at phones strains the neck.|Phone at eye level; Chin tucks; Breaks||If arm numbness.|整形外科|0
`;
