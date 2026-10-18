// Skin, hair, nails, eyes, ears, nose, mouth and teeth.
export const C_SKIN = `
Rosacea|酒さ|skin|m|redface:3 acne:1 alcohol:1|Facial redness and flushing triggered by heat, alcohol, spicy food and sun.|Sunscreen daily; Gentle skincare; Note triggers||See a dermatologist.|皮膚科|0
Perioral dermatitis|口囲皮膚炎|skin|m|rash:3 acne:1 steroids:1|A bumpy rash round the mouth, often from steroid creams or heavy creams.|Stop face steroid creams; Gentle wash only||See a dermatologist.|皮膚科|30
Melasma|肝斑|skin|m|brownpatch:3|Brown patches on the cheeks, from hormones and sun.|Sunscreen SPF 50 daily; Hat|vitb|See a dermatologist (tranexamic acid helps).|皮膚科|0
Sun spots|日光黒子 (シミ)|skin|m|brownpatch:3 elderly:1|Flat brown spots from years of sun.|Sunscreen||See a dermatologist if one changes.|皮膚科|0
Vitiligo|尋常性白斑|skin|m|whitepatch:3|The skin loses colour in patches.|Sunscreen on white areas||See a dermatologist.|皮膚科|0
Pityriasis versicolor|癜風|skin|m|whitepatch:3 brownpatch:2 sweats:1|A yeast causes pale or brown patches on the chest and back, worse in summer.|Antifungal shampoo on the skin|lamisil|See a dermatologist.|皮膚科|30
Pityriasis rosea|ばら色粃糠疹|skin|m|rash:3 scaly:2|One large patch then many small ones on the trunk; goes away in weeks.|Moisturise; Gentle soap|allegra|See a dermatologist to confirm.|皮膚科|42
Keratosis pilaris|毛孔性角化症|skin|m|dryskin:3 acne:2|Rough bumps on the upper arms.|Urea cream; Gentle exfoliation||Not needed.|皮膚科|0
Acanthosis nigricans|黒色表皮腫|skin|m|darkpatch:3 bellyfat:2|Dark velvety skin in folds, linked to insulin resistance.|Weight loss and exercise||See a doctor for a blood sugar check.|皮膚科 / 内科|0
Seborrhoeic keratosis|脂漏性角化症|skin|m|mole:3 elderly:2|Harmless brown warty growths with age.|Nothing needed||See a dermatologist if unsure.|皮膚科|0
Skin tag|軟性線維腫 (スキンタッグ)|skin|m|lump:3 mole:2|Small soft skin flaps in the neck and armpits.|Harmless||A dermatologist can remove them.|皮膚科|0
Basal cell carcinoma|基底細胞がん|skin|o|mole:3 cut:1 elderly:1|A pearly bump or sore that won't heal, on sun-exposed skin.|Sunscreen||See a dermatologist.|皮膚科|0
Actinic keratosis|日光角化症|skin|m|scaly:3 elderly:2|Rough scaly spots from sun; can turn into cancer.|Sunscreen||See a dermatologist.|皮膚科|0
Hidradenitis suppurativa|化膿性汗腺炎|skin|o|boil:3 redswollen:2|Painful lumps in armpits and groin that keep coming back.|Loose clothes; Stop smoking; Weight loss|actibia|See a dermatologist.|皮膚科|0
Folliculitis|毛嚢炎|skin|m|acne:3 itch:1|Infected hair follicles, often after shaving.|Shave with the grain; Clean razor|actibia|See a dermatologist if many.|皮膚科|7
Razor bumps|カミソリ負け|skin|m|acne:3 itch:2 redswollen:1|Hairs curling back into the skin after shaving.|Shave with the grain; Sharp razor; Shaving gel||If infected.|皮膚科|7
Body acne|背中ニキビ|skin|m|acne:3 sweats:1|Sweat and friction on the back and chest.|Shower after sport; Loose cotton shirts|pairacne|See a dermatologist if many.|皮膚科|30
Blackheads|毛穴の黒ずみ|skin|m|blackhead:3|Oil plugs in pores.|Gentle cleansing; Salicylic acid wash; Don't squeeze||See a dermatologist if severe.|皮膚科|0
Severe acne|重症ニキビ|skin|o|acne:3 boil:2|Deep painful cysts that scar.|Don't pick|pairacne|See a dermatologist: prescription treatment prevents scars.|皮膚科|0
Steroid acne|ステロイドによるニキビ|skin|m|acne:3 steroids:3|Steroids cause sudden acne on the chest and back.|Stop steroids||See a dermatologist.|皮膚科|30
Sweat rash (miliaria)|あせも|skin|m|rash:3 heatexp:2 itch:2|Blocked sweat glands in hot weather.|Cool down; Loose clothes; Shower|aftercare|If it doesn't settle.|皮膚科|5
Chafing|股ずれ|skin|m|chafing:3 sport:1|Rubbing skin gets raw.|Keep dry; Petroleum jelly; Moisture-wicking clothes||If infected.|皮膚科|5
Intertrigo|間擦疹|skin|m|chafing:2 rash:3|Red rash in skin folds from moisture.|Keep folds dry; Powder||See a dermatologist if no better.|皮膚科|7
Candida skin infection|皮膚カンジダ症|skin|m|rash:3 itch:2 chafing:1 diabetic:1|Yeast in skin folds: red with small spots at the edge.|Keep dry|lamisil|See a dermatologist.|皮膚科|14
Nail fungus|爪白癬|skin|m|nailchange:3 footpeel:1|Fungus makes nails thick, yellow and crumbly.|Keep feet dry; Treat athlete's foot too||See a dermatologist; tablets work best.|皮膚科|180
Brittle nails|爪の割れ|skin|m|nailchange:3 dryskin:1|Dryness, washing up and nail polish remover.|Gloves for cleaning; Moisturise nails|vitb|Not needed.|—|0
Nail biting|爪噛み|mind|m|hairpull:3 stress:2|A habit linked to stress.|Keep nails short; Bitter nail polish||Not needed.|—|0
Subungual haematoma|爪下血腫|skin|m|injury:2 toenail:3|Blood under a nail after hitting it.|Ice; Raise it|tylenol|See a doctor if very painful (can be drained).|整形外科 / 皮膚科|14
Dandruff|ふけ|skin|m|dandruff:3 itch:1|Flaky scalp from a yeast and oil.|Anti-dandruff shampoo 2-3 times a week|furufuru|See a dermatologist if red and scaly.|皮膚科|0
Scalp psoriasis|頭部乾癬|skin|o|scaly:3 dandruff:2 itch:1|Thick silvery scales on the scalp.|Gentle shampoo||See a dermatologist.|皮膚科|0
Hair loss after illness or stress|休止期脱毛症|skin|m|hairloss:3 stress:2 fever:1|Lots of hair falls out 2-3 months after illness, stress or birth; it grows back.|Gentle care; Eat enough protein and iron||See a dermatologist if over 6 months.|皮膚科|180
Female-pattern hair loss|女性の薄毛|skin|m|hairloss:3|Thinning on top of the head.|Gentle styling|riupx5|See a dermatologist.|皮膚科|0
Traction alopecia|牽引性脱毛症|skin|m|hairloss:3|Tight hairstyles pull hair out.|Looser styles||Not needed.|—|0
Grey hair (early)|若白髪|skin|m|hairloss:3 stress:1|Genes mostly; stress and smoking may speed it.|Nothing harmful about it||Not needed.|—|0
Oily skin|脂性肌|skin|m|acne:3 blackhead:2|Lots of sebum, often genetic.|Gentle foaming wash twice a day; Light moisturiser||Not needed.|—|0
Body odour|体臭|skin|m|sweatsmell:3 sweats:1|Bacteria break down sweat.|Shower daily; Antiperspirant at night; Breathable clothes||See a doctor if sudden change.|皮膚科|0
Smelly feet|足のにおい|skin|m|sweatsmell:3 footpeel:1|Sweaty feet in closed shoes.|Change socks daily; Rotate shoes; Dry between toes|lamisil|Not needed.|—|0
Calluses|たこ|skin|m|footpain:3 scaly:2|Thick skin from pressure.|Better shoes; Pumice after bath||See a podiatrist if painful.|皮膚科|0
Cracked heels|かかとのひび割れ|skin|m|dryskin:3 heelpain:1|Dry thick skin on the heels splits.|Urea cream at night with socks||If bleeding or infected.|皮膚科|14
Blister from shoes|靴ずれ|skin|m|blisters:3 sport:1|Rubbing makes a fluid pocket.|Don't pop; Cover with a blister plaster|kizupower|If infected.|—|5
Splinter|とげ|skin|m|cut:3|A sliver under the skin.|Clean tweezers; Wash after||See a doctor if deep or near the eye.|外科|1
Scald from hot water|熱湯でのやけど|skin|o|burn:3 blisters:2|Hot drinks or water.|Cool water for 20 min; Don't burst blisters; Cover loosely||See a doctor if larger than your palm, on face or genitals, or a child.|皮膚科 / 救急|10
Chemical burn|化学やけど|skin|s|burn:3 poison:1|Cleaning products or acids on skin.|Rinse with lots of water for 20 min||See a doctor.|皮膚科 / 救急|0
Hives from cold|寒冷じんましん|skin|m|hives:3 cold:1|Welts after cold water or wind.|Avoid sudden cold; Never swim alone|allegra|See a doctor.|皮膚科|0
Pressure hives|機械性じんましん|skin|m|hives:3|Welts where skin is rubbed or scratched (dermographism).|Avoid tight clothes|allegra|If daily.|皮膚科|0
Chronic hives|慢性じんましん|skin|o|hives:3 itch:2|Hives most days for over 6 weeks.|Note triggers; Cool showers|allegra|See a dermatologist.|皮膚科|0
Angioedema|血管性浮腫|skin|s|lipswell:3 swollenface:2|Deep swelling of lips, eyes or face.|Call 119 if tongue or throat swells|allegra|See a doctor today.|皮膚科 / 救急|0
Contact dermatitis from metal|金属アレルギー|skin|m|rash:3 itch:2|Nickel in jewellery or belts.|Avoid nickel; Clear nail polish on buckles|fulcort|See a dermatologist for a patch test.|皮膚科|7
Hair dye allergy|ヘアカラーかぶれ|skin|o|rash:3 swollenface:2 itch:2|PPD in hair dye.|Rinse; Stop using that dye|fulcort|See a dermatologist; go now if face swells a lot.|皮膚科|7
Cosmetic irritation|化粧品かぶれ|skin|m|rash:3 itch:2 redface:1|New skincare or makeup.|Stop the product; Gentle skincare only|fulcort|If no better in a week.|皮膚科|7
Poison ivy-type rash (urushi)|漆かぶれ|skin|m|blisters:3 itch:3 rash:2|Lacquer plants (urushi) cause itchy blisters.|Wash skin and clothes|fulcort|See a dermatologist if widespread.|皮膚科|14
Insect bites in bed (bedbugs)|トコジラミ|skin|m|bite:3 itchnight:2|Bites in lines, often after travel.|Wash bedding hot; Inspect mattress seams|muhi|See a dermatologist for itch.|皮膚科|14
Mosquito bite allergy|蚊アレルギー|skin|m|bite:3 redswollen:2|Large swelling after mosquito bites.|Cold pack; Don't scratch|muhi allegra|If fever.|皮膚科|3
Mite bites (tick-free)|ダニ刺され|skin|m|bite:3 itchnight:2|House mites bite at night.|Wash bedding at 60 °C; Vacuum; Dry futons in the sun|muhi|If many.|皮膚科|7
Molluscum contagiosum|水いぼ|skin|m|wart:3 childfever:-1|Small pearly bumps in children.|Don't pick; They go in months||See a dermatologist if many.|皮膚科|0
Plantar wart|足底疣贅|skin|m|wart:3 footpain:2|A wart on the sole that hurts when walking.|Don't share towels|ibokorori|See a dermatologist for freezing.|皮膚科|0
Corn on the toe|魚の目|skin|m|footpain:3 scaly:1|Hard core of skin from pressure.|Wider shoes; Corn pads|ibokorori|See a dermatologist if diabetic.|皮膚科|0
Sunburn with blisters|水ぶくれを伴う日焼け|skin|o|sunburn:3 blisters:2|A second-degree burn from the sun.|Cool showers; Aloe; Fluids; Don't pop|aftercare tylenol|See a doctor if large area, fever or chills.|皮膚科|7
Sun allergy|日光アレルギー|skin|m|rash:3 sunburn:1 itch:2|An itchy rash after sun exposure.|Sunscreen; Cover up|allegra|See a dermatologist.|皮膚科|7
Photosensitivity from medicine|薬剤性光線過敏症|skin|m|newmeds:3 sunburn:3|Some medicines make skin burn easily.|Avoid sun||Ask your doctor.|皮膚科|0
Stretch marks|妊娠線・肉割れ|skin|m|stretchmarks:3|Fast growth, weight change or pregnancy stretches skin.|Moisturise; They fade over time||Not needed (unless wide purple and round face: see Cushing's).|—|0
Keloid|ケロイド|skin|m|lump:3 cut:2|Thick raised scar growing beyond the wound.|Avoid piercings if you get them||See a dermatologist.|皮膚科|0
Cherry angioma|老人性血管腫|skin|m|mole:3|Small red dots on the skin, harmless.|Nothing needed||Not needed.|—|0
Spider veins|くも状静脈|skin|m|redface:3 legswell:1|Tiny visible veins on legs or face.|Compression socks||Cosmetic treatment if wanted.|皮膚科|0
Bruise|打撲・あざ|skin|m|injury:2 bruise:3|Bleeding under the skin after a knock.|Cold pack first day; Raise it|vantelin|See a doctor if bruises without injury.|整形外科|10
Hand eczema|手湿疹|skin|m|dryskin:3 itch:2 rash:1|Frequent washing, gloves or chemicals.|Gloves for cleaning; Hand cream after each wash|fulcort hirumild|See a dermatologist if cracking.|皮膚科|14
Nummular eczema|貨幣状湿疹|skin|m|rash:3 itch:2 dryskin:1|Coin-shaped itchy patches.|Moisturise twice a day|fulcort|See a dermatologist.|皮膚科|30
Winter itch|冬の乾燥かゆみ|skin|m|itch:3 dryskin:3|Dry air and hot baths.|Lukewarm baths; Moisturise right after|hirumild|If it doesn't settle.|皮膚科|0
Eye allergy from contact lenses|コンタクトによるアレルギー|eent|m|itchyeye:3 redeye:2 eyegoo:1|Protein build-up on lenses.|Switch to dailies; Clean properly; Glasses for a few days|santear|See an eye doctor.|眼科|7
Contact lens overwear|コンタクトレンズの過装用|eent|o|eyepain:3 redeye:2|Wearing lenses too long starves the cornea of oxygen.|Remove lenses; Wear glasses||See an eye doctor if pain or blurry vision.|眼科|3
Blepharitis|眼瞼炎|eent|m|eyelidswell:3 eyegoo:2 dryeye:2|Inflamed eyelid edges.|Warm compress and lid cleaning daily|santear|See an eye doctor.|眼科|30
Chalazion|霰粒腫|eent|m|eyelidswell:3|A painless lump in the eyelid from a blocked gland.|Warm compress 10 min, 3 times a day||See an eye doctor if large.|眼科|30
Eyelid twitch|まぶたのけいれん|eent|m|twitch:3 stress:1 caffeine:1|Tired, stressed or too much caffeine.|Sleep; Less caffeine||If it spreads to the face.|眼科|7
Periorbital cellulitis|眼窩周囲蜂窩織炎|eent|s|eyelidswell:3 fever:2 redswollen:2|Infection round the eye.|Don't wait||See a doctor today.|眼科 / 救急|0
Cataract|白内障|eent|o|blurry:3 halos:2 elderly:2|Cloudy lens with age.|Bright lighting; Sunglasses||See an eye doctor.|眼科|0
Glaucoma (chronic)|緑内障|eent|o|blurry:3 elderly:2|Slowly damages side vision without symptoms.|Regular eye checks after 40||See an eye doctor.|眼科|0
Macular degeneration|加齢黄斑変性|eent|o|blurry:3 elderly:2 smoker:1|Central vision blurs or bends.|Stop smoking; Leafy greens||See an eye doctor soon.|眼科|0
Diabetic eye disease|糖尿病網膜症|eent|o|blurry:2 diabetic:3|High sugar damages eye vessels.|Control sugar||See an eye doctor yearly.|眼科|0
Short-sightedness|近視|eent|m|blurry:3 screen:2|Distance looks blurry.|Outdoor time; Breaks from near work||See an eye doctor for glasses.|眼科|0
Lazy eye / squint|斜視・弱視|eent|o|squint:3|Eyes don't line up.|Nothing at home||See an eye doctor (children early).|眼科|0
Uveitis|ぶどう膜炎|eent|s|redeye:3 eyepain:2 lightsens:2 blurry:1|Inflammation inside the eye.|Don't wait||See an eye doctor today.|眼科|0
Scleritis|強膜炎|eent|s|redeye:3 eyepain:3|Deep painful eye inflammation.|Don't wait||See an eye doctor today.|眼科|0
Chemical in the eye|目に薬品が入った|eent|e|eyepain:3 poison:2|Bleach, detergent or chemicals splashed.|Rinse with running water for 15 min; Call 119||EMERGENCY.|救急 / 眼科|0
Foreign body in eye|目の異物|eent|o|eyepain:3 redeye:1|Dust or metal in the eye.|Blink and rinse with water; Don't rub|santear|See an eye doctor if it stays.|眼科|1
Welder's eye (snow blindness)|電気性眼炎|eent|o|eyepain:3 lightsens:2|UV burns the eye surface (welding, snow).|Cool compress; Dark room||See an eye doctor.|眼科|2
Outer ear eczema|外耳道湿疹|eent|m|earitch:3 eardisch:1|Itchy flaky ear canal.|Stop ear picking; Keep dry||See an ENT.|耳鼻咽喉科|14
Perforated eardrum|鼓膜穿孔|eent|o|earache:2 eardisch:3 hearingloss:1|A hole in the eardrum from infection or injury.|Keep water out||See an ENT.|耳鼻咽喉科|30
Ear barotrauma|航空性中耳炎|eent|m|earfull:3 earache:2 diving:2|Pressure change when flying or diving.|Swallow or yawn; Chew gum on descent||See an ENT if pain lasts.|耳鼻咽喉科|3
Age-related hearing loss|加齢性難聴|eent|m|hearingloss:3 elderly:2|Hearing slowly fades.|Face people when talking||See an ENT for a hearing test.|耳鼻咽喉科|0
Noise-induced hearing loss|騒音性難聴|eent|m|hearingloss:3 ringing:2|Loud music or work noise.|Turn down earphones (60% max); Earplugs at concerts||See an ENT.|耳鼻咽喉科|0
Nasal polyps|鼻茸|eent|m|nosepolyp:3 smell:2|Soft growths blocking the nose.|Saline rinse|nasal|See an ENT.|耳鼻咽喉科|0
Deviated septum|鼻中隔弯曲症|eent|m|stuffynose:3 snoreloud:1|A bent nose wall blocks one side.|Saline spray||See an ENT if it affects sleep.|耳鼻咽喉科|0
Rebound nasal congestion|点鼻薬の使いすぎ|eent|m|stuffynose:3 newmeds:1|Using decongestant spray over 7 days makes it worse.|Stop the spray; Saline instead||See an ENT.|耳鼻咽喉科|14
Nasal vestibulitis|鼻前庭炎|eent|m|redswollen:3 nosebleed:1 stuffynose:1|Infection inside the nostril.|Don't pick|actibia|See a doctor if spreading.|耳鼻咽喉科|7
Laryngitis|喉頭炎|eent|m|hoarse:3 sorethroat:2|Inflamed voice box from colds or overuse.|Rest your voice; Steam; Fluids|ryukakusan|See an ENT if over 2 weeks.|耳鼻咽喉科|7
Vocal nodules|声帯結節|eent|m|hoarse:3|Overused voice (singers, teachers).|Voice rest; Water||See an ENT.|耳鼻咽喉科|0
Peritonsillar abscess|扁桃周囲膿瘍|eent|s|sorethroat:3 swallow:3 fever:2|Pus beside a tonsil: can't open the mouth fully.|Don't wait||See an ENT today.|耳鼻咽喉科|0
Epiglottitis|急性喉頭蓋炎|eent|e|swallow:3 breathless:3 fever:2|Swelling of the flap over the windpipe: drooling, can't swallow.|Sit up; Call 119||EMERGENCY.|救急|0
Salivary stone|唾石症|eent|m|swollencheek:3|A stone blocks a saliva gland: swelling at mealtimes.|Sour sweets; Massage; Water||See an ENT.|耳鼻咽喉科|0
Oral thrush in adults|成人の口腔カンジダ|eent|m|tonguewhite:3 steroids:1|Yeast in the mouth.|Rinse after inhalers||See a dentist or doctor.|歯科 / 内科|10
Burning mouth syndrome|舌痛症|eent|m|tongueburn:3 drymouth:1|Burning tongue with no visible cause.|Sip cold water; Sugar-free gum||See a dentist or oral surgeon.|口腔外科|0
Geographic tongue|地図状舌|eent|m|tongueburn:3 mouthsore:2|Map-like patches on the tongue, harmless.|Avoid spicy food||Not needed.|—|0
Dry socket|ドライソケット|eent|o|toothache:3 badbreath:2|Pain days after a tooth extraction.|Don't smoke or use straws|tylenol|See your dentist.|歯科|7
Broken tooth|歯の破折|eent|o|brokentooth:3 toothache:2|A cracked or knocked-out tooth.|Knocked-out adult tooth: put it in milk and see a dentist within 1 hour||See a dentist today.|歯科|0
Tooth decay|虫歯|eent|m|sensitive:2 toothache:3|Bacteria and sugar make holes.|Fluoride toothpaste; Less sugar between meals||See a dentist.|歯科|0
Teeth staining|歯の着色|eent|m|badbreath:3|Coffee, tea, curry and smoking.|Rinse after coffee; Dental cleaning||See a dentist.|歯科|0
Oral cancer warning signs|口腔がんの兆候|eent|s|mouthsore:3 smoker:2 alcohol:1|A mouth ulcer or white/red patch lasting over 3 weeks.|Stop smoking||See a dentist or oral surgeon within 2 weeks.|口腔外科|0
Cracked lips (cheilitis)|口角炎|eent|m|lipsore:3 mouthsore:1|Dry cracked lips or mouth corners.|Lip balm; Vitamin B|vitb|If over 2 weeks.|皮膚科|7
`;
