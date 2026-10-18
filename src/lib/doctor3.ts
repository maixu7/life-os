// Even more symptoms and 700+ conditions for the app doctor. Same rules as
// doctor.ts: first-aid level guidance from a fixed list, not a diagnosis.
// Conditions are written one per line to keep this file readable:
// Name|日本語|area|severity|symptom:weight …|cause|home care; …|medicines|when to see a doctor|department|usual days|extra info
// severity: m mild, o moderate, s serious, e emergency. A name starting with
// * is contagious.

import type { Area, Condition, Med, Severity, Symptom } from "./doctor";
import { C_SEX } from "./conditions/sex";
import { C_INFECT } from "./conditions/infect";
import { C_HEART } from "./conditions/heart";
import { C_GUT } from "./conditions/gut";
import { C_BRAIN } from "./conditions/brain";
import { C_SKIN } from "./conditions/skin";
import { C_BODY } from "./conditions/body";
import { C_EXTRA } from "./conditions/extra";

const S = (id: string, label: string, ja: string, area: Area, red = false): Symptom => ({ id, label, ja, area, red });

export const MORE_SYMPTOMS: Symptom[] = [
  // Sex and hormones
  S("delayej", "Takes very long or can't ejaculate", "射精に時間がかかる・できない", "sex"),
  S("dryorgasm", "Orgasm with little or no semen", "精液がほとんど出ない", "sex"),
  S("bloodsemen", "Blood in semen", "精液に血が混じる", "sex"),
  S("bentpenis", "Erection bends or has a lump in the shaft", "勃起時に曲がる・しこりがある", "sex"),
  S("penispain", "Pain in the penis", "陰茎が痛い", "sex"),
  S("tightforeskin", "Tight foreskin, can't pull it back", "包皮がむけない・きつい", "sex"),
  S("stuckforeskin", "Foreskin stuck behind the head and swelling", "包皮が戻らず腫れている", "sex", true),
  S("painsex", "Pain during or after sex", "性交時・後の痛み", "sex"),
  S("noorgasm", "Can't reach orgasm", "オーガズムに達しない", "sex"),
  S("softerection", "Erection goes soft quickly or not hard enough", "勃起が弱い・続かない", "sex"),
  S("noarousal", "Little sexual feeling or arousal", "性的に興奮しにくい", "sex"),
  S("sexworry", "Worry or fear about sex performance", "性行為への不安", "sex"),
  S("wetdream", "Night-time ejaculation (wet dreams)", "夢精", "sex"),
  S("smallballs", "Testicles getting smaller or softer", "精巣が小さく・柔らかくなった", "sex"),
  S("scrotumswell", "Painless swelling of the scrotum", "陰嚢が痛みなく腫れている", "sex"),
  S("itchyscrotum", "Itchy scrotum or groin", "陰嚢・股がかゆい", "sex"),
  S("lumpshaft", "Small bumps on the penis", "陰茎にぶつぶつ", "sex"),
  S("vagdry", "Vaginal dryness", "腟の乾燥", "sex"),
  S("vagitch", "Vaginal itch or burning", "腟のかゆみ・ヒリヒリ", "sex"),
  S("fishyodour", "Fishy-smelling discharge", "魚のようなにおいのおりもの", "sex"),
  S("hotflash", "Hot flushes", "ほてり・のぼせ", "sex"),
  S("missedperiod", "Missed period", "生理が来ない", "sex"),
  S("heavyperiod", "Very heavy periods / clots", "経血が多い・塊が出る", "sex"),
  S("spotting", "Bleeding between periods or after sex", "不正出血", "sex"),
  S("pelvicpain", "Lower pelvic pain", "下腹部・骨盤の痛み", "sex"),
  S("breastpain", "Breast pain or tenderness", "乳房の痛み・張り", "sex"),
  S("nippledisch", "Nipple discharge", "乳頭からの分泌物", "sex"),
  S("infertile", "Trying for a baby for over a year", "1年以上妊娠しない", "sex"),
  S("pregnant", "Pregnant", "妊娠中", "sex"),
  S("pregbleed", "Bleeding or cramps in pregnancy", "妊娠中の出血・腹痛", "sex", true),
  S("postbirth", "Gave birth in the last 6 weeks", "産後6週間以内", "sex"),
  S("facehair", "New dark facial or body hair (women)", "顔や体の毛が濃くなった（女性）", "sex"),
  S("pms", "Mood swings, bloating before periods", "生理前の不調", "sex"),
  S("milkleak", "Milky nipple discharge, not breastfeeding", "授乳中でないのに乳汁が出る", "sex"),
  S("lowenergy", "Low energy and drive", "やる気・活力がない", "sex"),
  S("bellyfat", "Gaining belly fat", "お腹に脂肪がつく", "sex"),
  S("musclelose", "Losing muscle despite training", "鍛えても筋肉が落ちる", "sex"),
  S("sexcompuls", "Can't control sexual urges, it harms life", "性衝動を抑えられず生活に支障", "sex"),
  S("thinkingsex", "Thinking about sex all the time", "いつも性のことを考えてしまう", "sex"),
  S("condombreak", "Condom broke / unprotected sex", "コンドームが破れた・避妊なしの性交", "sex"),
  S("pumpuse", "Used a penis pump, ring or rough masturbation", "器具や強いマスターベーション", "sex"),
  S("snap", "Snap sound and sudden bend during sex", "性交中にポキッと音がして曲がった", "sex", true),
  // Whole body
  S("nightfever", "Fever that comes and goes for weeks", "数週間続く・ぶり返す発熱", "general"),
  S("swollenface", "Puffy face or eyelids", "顔やまぶたのむくみ", "general"),
  S("coldhands", "Cold, pale or blue fingers in the cold", "寒さで指が白・紫になる", "general"),
  S("pallor", "Very pale lips and gums", "唇や歯ぐきが白い", "general"),
  S("easytired", "Tired after little effort for weeks", "少し動くだけで疲れる", "general"),
  S("foamyurine", "Foamy pee", "尿が泡立つ", "general"),
  S("weightgain", "Gaining weight fast without eating more", "急に体重が増えた", "general"),
  S("dryeyesmouth", "Dry eyes and dry mouth together", "目と口が乾く", "general"),
  S("tickbite", "Tick bite or outdoor bites (hiking)", "マダニに刺された", "general"),
  S("animalbite", "Bitten or scratched by an animal", "動物に噛まれた・引っかかれた", "general"),
  S("snakebite", "Snake bite", "ヘビに噛まれた", "general", true),
  S("poison", "Swallowed something poisonous", "毒・薬を誤って飲んだ", "general", true),
  S("cold", "Very cold, shivering, slurred speech (outside in cold)", "体が冷え切って震えが止まらない", "general", true),
  S("drowning", "Breathed in water / near drowning", "溺れた・水を吸い込んだ", "general", true),
  S("electric", "Electric shock", "感電した", "general", true),
  S("allergyfood", "Reaction right after a new food or drug", "食べ物・薬の直後に症状", "general"),
  S("lymphswell", "Lumps in armpit or groin", "わきの下・足の付け根のしこり", "general"),
  S("childfever", "Child with fever", "子どもの発熱", "general"),
  S("babycry", "Baby crying non-stop, can't settle", "赤ちゃんが泣き止まない", "general"),
  S("elderly", "Older adult (over 75)", "75歳以上", "context"),
  S("diabetic", "Has diabetes", "糖尿病がある", "context"),
  S("highbp", "Has high blood pressure", "高血圧がある", "context"),
  S("mountain", "At high altitude / mountain climbing", "高地・登山中", "context"),
  S("diving", "After scuba diving or flying", "ダイビング・飛行機の後", "context"),
  S("tropics", "Recently in the tropics (SE Asia, Africa, S. America)", "熱帯地域から帰国", "context"),
  S("newmeds", "Started a new medicine", "新しい薬を飲み始めた", "context"),
  S("nightshift", "Night shifts or jet lag", "夜勤・時差ぼけ", "context"),
  S("deskwork", "Long hours at a desk", "長時間のデスクワーク", "context"),
  S("lifting", "Lifting heavy weights", "重い物を持ち上げた", "context"),
  // Head and brain
  S("seizure", "Seizure / fit / shaking with loss of consciousness", "けいれん発作", "head", true),
  S("memory", "Forgetting things more and more", "物忘れが増えた", "head"),
  S("tremor", "Shaking hands at rest", "安静時の手の震え", "head"),
  S("facedroop", "One side of the face drooping (no other weakness)", "片側の顔が動かない", "head"),
  S("speech", "Trouble finding or saying words", "言葉が出にくい", "head", true),
  S("balance", "Unsteady walking, falling", "ふらつく・よく転ぶ", "head"),
  S("doublevis", "Double vision", "物が二重に見える", "head", true),
  S("jawclaud", "Jaw pain when chewing + headache (over 50)", "噛むとあごが痛む・頭痛", "head"),
  S("tics", "Repeated sudden movements or sounds", "チック", "head"),
  S("faceburn", "Electric stabbing pain in the face", "顔に電気が走るような痛み", "head"),
  // Eyes, ears, nose, mouth
  S("halos", "Rainbow halos round lights", "光の周りに虹が見える", "eent"),
  S("nightblind", "Poor vision at night or in dim light", "暗いところで見えにくい", "eent"),
  S("eyelidswell", "Swollen, red eyelid", "まぶたが赤く腫れる", "eent"),
  S("twitch", "Eyelid twitching", "まぶたがピクピクする", "eent"),
  S("squint", "Eyes not looking the same way", "目の向きがずれる", "eent"),
  S("earitch", "Itchy or flaky ear canal", "耳の中がかゆい", "eent"),
  S("eardisch", "Discharge from the ear", "耳だれ", "eent"),
  S("hearingloss", "Hearing slowly getting worse", "聞こえが徐々に悪い", "eent"),
  S("nosepolyp", "Blocked nose on both sides for months, no smell", "長く鼻づまり・においがしない", "eent"),
  S("tonguewhite", "White coating or patches in the mouth", "口の中の白い苔・斑点", "eent"),
  S("drymouth", "Very dry mouth", "口が乾く", "eent"),
  S("tongueburn", "Burning tongue", "舌がヒリヒリする", "eent"),
  S("swollencheek", "Swollen cheek or under the jaw", "頬・あごの下の腫れ", "eent"),
  S("grind", "Grinding teeth at night", "歯ぎしり", "eent"),
  S("brokentooth", "Broken or knocked-out tooth", "歯が折れた・抜けた", "eent"),
  S("throatlump", "Feeling of a lump in the throat", "のどに何か詰まった感じ", "eent"),
  S("snoreloud", "Very loud snoring", "大きないびき", "eent"),
  // Chest and heart
  S("racing", "Heart racing over 150 at rest", "安静時に脈が速い（150以上）", "chest", true),
  S("slowpulse", "Very slow pulse with dizziness", "脈が遅くふらつく", "chest"),
  S("legcramplwalk", "Calf pain when walking, eases with rest", "歩くとふくらはぎが痛み休むと治る", "chest"),
  S("breathlie", "Short of breath lying flat / waking breathless", "横になると息苦しい", "chest"),
  S("chestexert", "Chest tightness on exertion, goes with rest", "動くと胸が締めつけられる", "chest"),
  S("highbpread", "Blood pressure reading 180/110 or more", "血圧180/110以上", "chest", true),
  S("barkcough", "Barking cough (child)", "犬が吠えるようなせき（子ども）", "chest"),
  // Stomach and bowel
  S("hiccups", "Hiccups that won't stop", "しゃっくりが止まらない", "stomach"),
  S("vomitall", "Vomiting everything for over a day", "1日以上何も受け付けない", "stomach"),
  S("greasystool", "Pale, greasy, floating poo", "白っぽく脂っぽい便", "stomach"),
  S("worms", "Seeing worms in poo / itchy bottom at night", "便に虫・夜におしりがかゆい", "stomach"),
  S("belching", "Lots of burping", "げっぷが多い", "stomach"),
  S("leftpain", "Pain in the lower left belly", "左下腹部の痛み", "stomach"),
  S("swallowpain", "Pain behind the breastbone when swallowing", "飲み込むと胸の奥が痛い", "stomach"),
  // Pee
  S("nightpee", "Getting up to pee 2+ times a night", "夜中に2回以上トイレ", "urinary"),
  S("leakpee", "Leaking pee when coughing or rushing", "尿もれ", "urinary"),
  S("cloudypee", "Cloudy or smelly pee", "尿がにごる・におう", "urinary"),
  S("dribble", "Dribbling after peeing", "排尿後のちょい漏れ", "urinary"),
  // Skin
  S("yellowskinonly", "Yellow-orange palms (eating lots of carrots/mikan)", "手のひらが黄色い（柑橘の食べすぎ）", "skin"),
  S("darkpatch", "Dark velvety skin in neck folds", "首やわきの黒ずみ", "skin"),
  S("whitepatch", "White patches of skin", "白い斑点・白斑", "skin"),
  S("brownpatch", "Brown patches on the face", "顔のシミ・肝斑", "skin"),
  S("redface", "Red face, flushing, small veins", "顔の赤み・ほてり", "skin"),
  S("boil", "Painful pus-filled bump", "膿をもった痛いできもの", "skin"),
  S("nailchange", "Thick, yellow or crumbly nails", "爪が厚く黄色くもろい", "skin"),
  S("stretchmarks", "Stretch marks", "肉割れ", "skin"),
  S("bruiseeasy", "Unexplained bruises", "原因不明のあざ", "skin"),
  S("lice", "Itchy scalp with tiny eggs on hair", "頭がかゆく髪に卵", "skin"),
  S("sweatsmell", "Strong body or foot odour", "体臭・足のにおい", "skin"),
  S("blackhead", "Blackheads and whiteheads", "毛穴の黒ずみ・白ニキビ", "skin"),
  S("frostbite", "Numb, white, hard skin after cold", "寒さで皮膚が白く硬くなった", "skin"),
  S("chafing", "Raw rubbed skin between thighs or armpits", "股ずれ・こすれ", "skin"),
  S("tattoo", "New tattoo or piercing that is red and sore", "タトゥー・ピアスが赤く痛む", "skin"),
  // Muscles and joints
  S("bigtoe", "Hot, red, very painful big toe", "足の親指が赤く激痛", "body"),
  S("handnumbnight", "Numb fingers at night", "夜に指がしびれる", "body"),
  S("triggerfinger", "Finger locks or clicks when bending", "指が引っかかる・カクンとなる", "body"),
  S("wristpain", "Wrist pain", "手首の痛み", "body"),
  S("hippain", "Hip or groin pain", "股関節・足の付け根の痛み", "body"),
  S("anklepain", "Ankle pain or swelling", "足首の痛み・腫れ", "body"),
  S("footpain", "Pain on top or ball of the foot", "足の甲・指の付け根の痛み", "body"),
  S("calfpain", "Sudden calf pain like being kicked", "ふくらはぎに蹴られたような痛み", "body"),
  S("backstiff", "Back stiff in the morning, better with movement", "朝の背中のこわばり", "body"),
  S("posture", "Rounded shoulders / forward head", "猫背・ストレートネック", "body"),
  S("flatfeet", "Flat feet / aching arches", "扁平足・土踏まずの痛み", "body"),
  S("bunion", "Bump at the base of the big toe", "外反母趾", "body"),
  S("ribpain", "Pain over a rib after a fall or cough", "肋骨の痛み", "body"),
  S("tailbone", "Tailbone pain when sitting", "尾てい骨の痛み", "body"),
  S("musclewaste", "Muscle weakness getting worse", "筋力が徐々に落ちる", "body"),
  // Mind and sleep
  S("panicrep", "Repeated sudden panic attacks", "繰り返すパニック発作", "mind"),
  S("eatingbinge", "Eating huge amounts and feeling out of control", "むちゃ食いがやめられない", "mind"),
  S("nightmare", "Nightmares or acting out dreams", "悪夢・寝言や寝ぼけ行動", "mind"),
  S("grief", "Lost someone close", "大切な人を亡くした", "mind"),
  S("lonely", "Feeling lonely or isolated", "孤独を感じる", "mind"),
  S("anger", "Angry outbursts hard to control", "怒りを抑えられない", "mind"),
  S("homesick", "Homesick / culture stress living abroad", "ホームシック・異文化ストレス", "mind"),
  S("procrast", "Can't start tasks, putting everything off", "やるべきことを先延ばし", "mind"),
  S("gambling", "Gambling (pachinko, betting) you can't stop", "ギャンブルがやめられない", "mind"),
  S("smokeurge", "Want to quit smoking or vaping", "禁煙したい", "mind"),
  S("hairpull", "Pulling hair or picking skin", "抜毛・皮膚むしり", "mind"),
  S("bodyimage", "Hating how your body looks", "体型への強い悩み", "mind"),
];

// Drugstore medicines named only in the new conditions.
const M = (name: string, generic: string, use: string, caution: string, cls: string): Med => ({ name, generic, use, caution, cls });
export const MORE_MEDS: Record<string, Med> = {
  sumithrin: M("Sumithrin lice shampoo (スミスリンシャンプー)", "phenothrin", "Head and pubic lice.", "Use 3 times, 3 days apart. Not near the eyes.", "第2類"),
  shakuyaku: M("Shakuyaku-kanzo-to (芍薬甘草湯)", "Kampo herbal granules", "Sudden muscle cramps (calf cramps).", "Short-term only; long use can lower potassium.", "第2類"),
};

const SEV: Record<string, Severity> = { m: "mild", o: "moderate", s: "serious", e: "emergency" };

// Shared medicine keys from doctor.ts and doctor2.ts can be named in the lines.
function parse(text: string): Condition[] {
  const out: Condition[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("//")) continue;
    const [name0, ja, area, sev, syms, cause, home, meds, doctor, dept, days, info] = line.split("|").map((x) => x.trim());
    const contagious = name0.startsWith("*");
    out.push({
      name: name0.replace(/^\*/, ""), ja, area: area as Area, severity: SEV[sev] ?? "mild", contagious: contagious || undefined,
      // Weights 1-3 (3 = key sign); lower ones are just hints and are left out.
      syms: syms.split(/\s+/).filter(Boolean).map((x) => { const [id, w] = x.split(":"); return [id, Number(w ?? 1)] as [string, number]; }).filter(([, w]) => w > 0),
      cause, home: home ? home.split(";").map((x) => x.trim()).filter(Boolean) : [], meds: meds ? meds.split(/[\s,]+/).filter(Boolean) : [],
      doctor, dept, days: days ? Number(days) : undefined, info: info || undefined,
    });
  }
  return out;
}

export const MORE_CONDITIONS: Condition[] = [C_SEX, C_INFECT, C_HEART, C_GUT, C_BRAIN, C_SKIN, C_BODY, C_EXTRA].flatMap(parse);
