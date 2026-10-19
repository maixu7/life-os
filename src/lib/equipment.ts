import type { Gear } from "@/lib/have";

// A catalogue of workout equipment, so a photo read by a vision AI ("Decathlon
// 10 kg hex dumbbell", "ケトルベル 16kg", "Bowflex SelectTech 552") can be
// matched to exactly what it is, and the app knows what it means for training
// (its `gear` in have.ts, and its weight).
//
// Built from: (a) equipment types × their real standard sizes, and (b) brand
// product lines, only where that brand really sells that category. Sizes on
// a brand line are the usual range for that line; where a line's exact range
// is less certain the entry carries a note. Weights in lb also show kg, so
// have.ts reads the kg from the name.

export type Market = "IN" | "JP" | "global";
export type Equip = {
  name: string; ja?: string; type: string; gear: Gear | null; emoji: string;
  kg?: number; brand?: string; markets?: Market[]; note?: string;
};

type Def = {
  t: string; ja?: string; g: Gear | null; e: string; grp: string;
  re: RegExp; q?: RegExp; kg?: number[]; lb?: number[]; v?: string[]; w?: boolean;
  fmt?: (size: string) => string;
};

const r1 = (x: number) => Math.round(x * 10) / 10;
const lbKg = (lb: number) => r1(lb * 0.45359237);
const range = (a: number, b: number, s: number) => { const out: number[] = []; for (let x = a; x <= b + 1e-9; x += s) out.push(+x.toFixed(3)); return out; };

// ---------- Nouns shared by a family of types ----------
const DB = /dumb+e?l+s?|ダンベル|鉄アレ[イー]|唖鈴/i;
const KB = /ket+[le]{1,2}\s*-?bel+s?|kendal+\s*bel+s?|\bk-?bel+s?\b|ケトルベル/i;
const BAR = /bar\s*-?bell?s?|olympic\s*bar|weightlifting\s*bar|power\s*bar\b|deadlift\s*bar|squat\s*bar|barbell\s*rod|バーベル|シャフト/i;
const PLATE = /plates?\b|bumpers?\b|\bdiscs?\b|weight\s*disc|プレート/i;
const BAND = /bands?\b|tubes?\b|tubing|バンド|チューブ/i;
const MAT = /\bmats?\b|マット/i;
const ROPE = /rope|skipping|縄跳び|なわとび|ロープ/i;
const BIKE = /bike|cycle|cycling|バイク/i;
const TREAD = /treadmill|walking\s*pad|running\s*machine|ランニングマシン|ルームランナー|トレッドミル|ウォーキングマシン/i;
const ROW = /row(ing)?\s*machine|rower|row\s*erg|rowerg|ローイング|ロウイング/i;
const GLOVE = /gloves?|グローブ/i;
const SHOE = /shoes?|sneakers?|trainers?\b|シューズ|スニーカー/i;

const DB_KG = [1, 2, 2.5, 3, 4, 5, 6, 7, 7.5, 8, 9, 10, 12, 12.5, 14, 15, 16, 17.5, 18, 20, 22.5, 24, 25, 26, 27.5, 30, 32.5, 35, 37.5, 40, 42.5, 45, 47.5, 50];
const DB_LB = [3, 5, 8, 10, 12, 15, ...range(20, 150, 5)];
const KB_KG = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 32, 36, 40, 44, 48];
const KB_LB = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 53, 60, 62, 70, 80, 90, 100];
const COMP_KB = [8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36, 40, 44, 48];
const OZ = [8, 10, 12, 14, 16];
const LEVELS = ["extra light", "light", "medium", "heavy", "extra heavy"];
const upTo = (s: string) => `(up to ${s})`;

// ---------- Equipment types ----------
const D = (t: string, ja: string | undefined, g: Gear | null, e: string, grp: string, re: RegExp, o: Partial<Def> = {}): Def => ({ t, ja, g, e, grp, re, ...o });
const DEFS: Def[] = [
  // Dumbbells
  D("Dumbbell", "ダンベル", "dumbbell", "🏋️", "Dumbbells", DB, { kg: DB_KG, lb: DB_LB }),
  D("Hex dumbbell", "六角ダンベル", "dumbbell", "🏋️", "Dumbbells", DB, { q: /hex|六角|ヘックス/i, kg: DB_KG, lb: DB_LB }),
  D("Chrome dumbbell", "クロームダンベル", "dumbbell", "🏋️", "Dumbbells", DB, { q: /chrome|クローム|メッキ/i, kg: [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10, 12.5, 15], lb: [1, 2, 3, 5, 8, 10, 12, 15, 20, 25] }),
  D("Vinyl dumbbell", "ビニールダンベル", "dumbbell", "🏋️", "Dumbbells", DB, { q: /vinyl|soft|ビニール|カラー/i, kg: [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10] }),
  D("Neoprene dumbbell", "ネオプレンダンベル", "dumbbell", "🏋️", "Dumbbells", DB, { q: /neoprene|ネオプレン/i, kg: [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10], lb: [1, 2, 3, 4, 5, 6, 8, 10, 12, 15] }),
  D("PVC dumbbell", "PVCダンベル", "dumbbell", "🏋️", "Dumbbells", DB, { q: /pvc|plastic|cement|sand|concrete|プラスチック/i, kg: [1, 2, 2.5, 3, 4, 5, 6, 7, 8, 10, 12, 15] }),
  D("Rubber dumbbell", "ラバーダンベル", "dumbbell", "🏋️", "Dumbbells", DB, { q: /rubber|round|pro[\s-]?style|ラバー/i, kg: range(2.5, 50, 2.5) }),
  D("Urethane dumbbell", "ウレタンダンベル", "dumbbell", "🏋️", "Dumbbells", DB, { q: /urethane|\bpu\b|ウレタン/i, kg: [...range(2.5, 50, 2.5), 55, 60] }),
  D("Cast iron dumbbell", "鉄アレイ", "dumbbell", "🏋️", "Dumbbells", DB, { q: /cast[\s-]*iron|\biron\b|鉄|アイアン/i, kg: [0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10] }),
  D("Spinlock dumbbell set", "ダンベルセット", "dumbbell", "🏋️", "Dumbbells", DB, { q: /set|kit|spin[\s-]*lock|screw|threaded|セット|スクリュー|プレート式/i, kg: [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 100] }),
  D("Adjustable dumbbell", "可変式ダンベル", "dumbbell", "🏋️", "Dumbbells", DB, { q: /adjustable|select|dial|quick[\s-]*(change|lock)|可変|アジャスタブル/i, kg: [10, 12, 15, 20, 24, 25, 30, 32, 36, 40, 41, 50], fmt: upTo }),
  D("Loadable dumbbell handle", "ダンベルシャフト", "dumbbell", "🏋️", "Dumbbells", DB, { q: /handle|loadable|shaft|シャフト|ハンドル/i, v: ["(25 mm)", "(28 mm)", "(Olympic 50 mm)"] }),

  // Kettlebells
  D("Kettlebell", "ケトルベル", "kettlebell", "🔔", "Kettlebells", KB, { kg: KB_KG, lb: KB_LB }),
  D("Cast iron kettlebell", "鋳鉄ケトルベル", "kettlebell", "🔔", "Kettlebells", KB, { q: /cast[\s-]*iron|\biron\b|鋳鉄|鉄/i, kg: [4, 6, 8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48] }),
  D("Competition kettlebell", "競技用ケトルベル", "kettlebell", "🔔", "Kettlebells", KB, { q: /competition|\bcomp\b|steel|pro[\s-]*grade|競技/i, kg: COMP_KB }),
  D("Vinyl kettlebell", "ソフトケトルベル", "kettlebell", "🔔", "Kettlebells", KB, { q: /vinyl|plastic|soft|ソフト|ビニール/i, kg: [2, 4, 6, 8, 10, 12, 14, 16] }),
  D("Rubber kettlebell", "ラバーケトルベル", "kettlebell", "🔔", "Kettlebells", KB, { q: /rubber|neoprene|coated|ラバー/i, kg: [4, 6, 8, 10, 12, 14, 16, 20, 24] }),
  D("Adjustable kettlebell", "可変式ケトルベル", "kettlebell", "🔔", "Kettlebells", KB, { q: /adjustable|select|dial|可変/i, kg: [12, 16, 18, 20, 24, 32, 40], fmt: upTo }),

  // Barbells and bars that load plates
  D("Olympic barbell", "オリンピックバーベル", "barbell", "🏋️", "Barbells", BAR, { q: /olympic|50\s*mm|オリンピック/i, kg: [5, 7, 10, 15, 20] }),
  D("Powerlifting barbell", "パワーリフティングバー", "barbell", "🏋️", "Barbells", BAR, { q: /power/i, kg: [20, 25] }),
  D("Deadlift barbell", "デッドリフトバー", "barbell", "🏋️", "Barbells", BAR, { q: /deadlift/i, kg: [20] }),
  D("Fixed barbell", "固定式バーベル", "barbell", "🏋️", "Barbells", BAR, { q: /fixed|pre[\s-]*loaded|studio|固定/i, kg: range(10, 50, 2.5) }),
  D("Standard barbell rod", "スタンダードバーベルシャフト", "barbell", "🏋️", "Barbells", BAR, { q: /standard|1[\s-]*inch|25\s*mm|28\s*mm|rod|スタンダード/i, v: ["3 ft", "4 ft", "5 ft", "6 ft", "7 ft"] }),
  D("Barbell set", "バーベルセット", "barbell", "🏋️", "Barbells", BAR, { q: /set|kit|combo|セット/i, kg: [20, 30, 40, 50, 60, 70, 80, 100, 120, 140] }),
  D("EZ curl barbell", "EZバー", "barbell", "🏋️", "Barbells", /ez[\s-]*(curl\s*)?bar(bell)?|curl\s*bar|\bez\b|EZバー|カールバー/i, { v: ["(standard 1-inch)", "(Olympic 50 mm)", "(super curl)"] }),
  D("Hex trap barbell", "トラップバー", "barbell", "🏋️", "Barbells", /trap\s*bar(bell)?|hex\s*bar(?!bell)|hex\s*trap|トラップバー|ヘックスバー/i, { v: ["(Olympic)", "(open)", "(standard 1-inch)"] }),
  D("Safety squat barbell", "セーフティスクワットバー", "barbell", "🏋️", "Barbells", /safety\s*squat\s*bar(bell)?|\bssb\b/i),
  D("Swiss multi-grip barbell", "マルチグリップバー", "barbell", "🏋️", "Barbells", /swiss\s*bar|multi[\s-]*grip\s*bar(bell)?|football\s*bar/i),
  D("Tricep barbell", "トライセップスバー", "barbell", "🏋️", "Barbells", /tri(cep|ceps)\s*bar(bell)?/i),
  D("Landmine barbell attachment", "ランドマイン", "barbell", "🏋️", "Barbells", /landmine|ランドマイン/i),

  // Plates (load a barbell)
  D("Weight plate", "プレート", "barbell", "💿", "Plates", PLATE, { kg: [0.5, 1, 1.25, 2, 2.5, 5, 7.5, 10, 15, 20, 25] }),
  D("Olympic iron plate", "オリンピックプレート", "barbell", "💿", "Plates", PLATE, { q: /olympic|50\s*mm|iron|cast|オリンピック|アイアン/i, kg: [0.5, 1.25, 2.5, 5, 7.5, 10, 15, 20, 25], lb: [2.5, 5, 10, 25, 35, 45] }),
  D("Standard plate 1-inch", "スタンダードプレート", "barbell", "💿", "Plates", PLATE, { q: /standard|1[\s-]*inch|25\s*mm|28\s*mm|スタンダード/i, kg: [0.5, 1, 1.25, 2, 2.5, 5, 7.5, 10, 15, 20] }),
  D("Bumper plate", "バンパープレート", "barbell", "💿", "Plates", PLATE, { q: /bumper|バンパー/i, kg: [5, 10, 15, 20, 25], lb: [10, 15, 25, 35, 45, 55] }),
  D("Competition bumper plate", "競技用バンパープレート", "barbell", "💿", "Plates", PLATE, { q: /competition|iwf|calibrated|競技/i, kg: [10, 15, 20, 25] }),
  D("Technique bumper plate", "テクニックプレート", "barbell", "💿", "Plates", PLATE, { q: /technique|training\s*disc|テクニック/i, kg: [1, 2.5, 5] }),
  D("Rubber-coated plate", "ラバープレート", "barbell", "💿", "Plates", PLATE, { q: /rubber|coated|ラバー/i, kg: [1.25, 2.5, 5, 10, 15, 20, 25] }),
  D("Tri-grip plate", "グリップ付きプレート", "barbell", "💿", "Plates", PLATE, { q: /tri[\s-]*grip|grip|handle|グリップ/i, kg: [1.25, 2.5, 5, 10, 15, 20, 25] }),
  D("Urethane plate", "ウレタンプレート", "barbell", "💿", "Plates", PLATE, { q: /urethane|ウレタン/i, kg: [1.25, 2.5, 5, 10, 15, 20, 25] }),
  D("Change plate", "チェンジプレート", "barbell", "💿", "Plates", PLATE, { q: /change|calibrated\s*steel|チェンジ/i, kg: [0.25, 0.5, 1, 1.25, 1.5, 2, 2.5, 5] }),
  D("Fractional plate", "マイクロプレート", "barbell", "💿", "Plates", PLATE, { q: /fractional|micro|マイクロ/i, kg: [0.1, 0.125, 0.25, 0.5] }),
  D("PVC weight plate", "PVCプレート", "barbell", "💿", "Plates", PLATE, { q: /pvc|plastic|cement|concrete|vinyl/i, kg: [1, 2, 2.5, 3, 4, 5, 7.5, 10, 15, 20] }),

  // Resistance bands
  D("Resistance band", "トレーニングバンド", "band", "➰", "Bands", BAND, { v: LEVELS.map((l) => `(${l})`) }),
  D("Long loop power band", "パワーバンド", "band", "➰", "Bands", BAND, { q: /loop|power|super|pull[\s-]*up\s*assist|ループ|パワー/i, v: ["6 mm (5–15 lb)", "13 mm (15–35 lb)", "22 mm (25–65 lb)", "32 mm (35–85 lb)", "44 mm (50–125 lb)", "64 mm (60–150 lb)"] }),
  D("Mini loop band", "ミニバンド", "band", "➰", "Bands", BAND, { q: /mini|loop|booty|glute|ミニ/i, v: LEVELS.map((l) => `(${l})`) }),
  D("Fabric hip band", "ヒップバンド", "band", "➰", "Bands", BAND, { q: /fabric|cloth|hip|booty|glute|布|ヒップ/i, v: ["(light)", "(medium)", "(heavy)"] }),
  D("Resistance tube band with handles", "ハンドル付きチューブ", "band", "➰", "Bands", BAND, { q: /tube|tubing|handle|チューブ/i, v: LEVELS.map((l) => `(${l})`) }),
  D("Flat therapy band", "セラバンド", "band", "➰", "Bands", BAND, { q: /flat|therapy|physio|rehab|セラ/i, v: LEVELS.map((l) => `(${l})`) }),
  D("Figure-8 resistance band", "8の字バンド", "band", "➰", "Bands", BAND, { q: /figure[\s-]*8|figure\s*eight|8の字/i }),
  D("Resistance band set", "バンドセット", "band", "➰", "Bands", BAND, { q: /set|kit|セット/i, v: ["(5 bands)", "(11-piece tubes)"] }),
  D("Toning tube band", "トーニングチューブ", "band", "➰", "Bands", BAND, { q: /toning/i }),
  D("Door anchor (for tubes)", "ドアアンカー", null, "🚪", "Bands", /door\s*anchor|ドアアンカー/i),

  // Pull-up bars and racks with a bar
  D("Doorway pull-up bar", "ドア用懸垂バー", "bar", "🤸", "Bars & racks", /pull[\s-]*up|chin[\s-]*up|chinning|懸垂|チンニング|ぶら下がり/i, { q: /door|telescop|ドア|突っ張り|つっぱり/i, v: ["(telescopic)", "(multi-grip)"] }),
  D("Wall-mounted pull-up bar", "壁付け懸垂バー", "bar", "🤸", "Bars & racks", /pull[\s-]*up|chin[\s-]*up|懸垂/i, { q: /wall|壁/i }),
  D("Ceiling-mounted pull-up bar", "天井懸垂バー", "bar", "🤸", "Bars & racks", /pull[\s-]*up|chin[\s-]*up|懸垂/i, { q: /ceiling|天井/i }),
  D("Pull-up bar", "懸垂バー", "bar", "🤸", "Bars & racks", /pull[\s-]*up|chin[\s-]*up|chinning|懸垂|チンニング/i),
  D("Chin-up stand with pull-up bar", "チンニングスタンド", "bar", "🤸", "Bars & racks", /chin[\s-]*up\s*stand|pull[\s-]*up\s*stand|free[\s-]*standing|チンニングスタンド|ぶら下がり健康器/i),
  D("Power tower pull-up and dip station", "パワータワー", "bar", "🤸", "Bars & racks", /power\s*tower|vkr|knee\s*raise\s*station|(pull[\s-]*up|chin[\s-]*up|懸垂)[^,\n]{0,25}dip|dip[^,\n]{0,25}(pull[\s-]*up|chin[\s-]*up)|パワータワー|ぶら下がり健康器/i),
  D("Power rack with pull-up bar", "パワーラック", "bar", "🏗️", "Bars & racks", /power\s*rack|power\s*cage|squat\s*cage|full\s*rack|パワーラック/i),
  D("Half rack with pull-up bar", "ハーフラック", "bar", "🏗️", "Bars & racks", /half\s*rack|ハーフラック/i),
  D("Squat stand", "スクワットスタンド", null, "🏗️", "Bars & racks", /squat\s*(stand|rack)|スクワットラック|スクワットスタンド/i),
  D("Wall-mounted folding squat rack", "折りたたみラック", null, "🏗️", "Bars & racks", /fold(ing)?\s*(squat\s*)?rack|wall[\s-]*mounted\s*rack/i),
  D("Swedish ladder (stall bars)", "肋木", null, "🪜", "Bars & racks", /stall\s*bars|swedish\s*(ladder|wall)|wall\s*bars|肋木/i),

  // Dips and bodyweight
  D("Dip station", "ディップススタンド", "dip", "🤸", "Bodyweight", /dip\s*(station|stand|bars?)|parallel\s*bars|ディップス/i, { v: ["(free-standing)", "(wall-mounted)"] }),
  D("Parallettes (mini dip bars)", "パラレット", "dip", "🤸", "Bodyweight", /parallettes?|p[\s-]*bars|パラレット/i, { v: ["(low)", "(high)", "(wooden)"] }),
  D("Push-up handles", "プッシュアップバー", null, "🤸", "Bodyweight", /push[\s-]*up\s*(bars?|handles?|stands?|grips?)|腕立て|プッシュアップ/i, { v: ["(rotating)", "(fixed)"] }),
  D("Push-up board", "プッシュアップボード", null, "🤸", "Bodyweight", /push[\s-]*up\s*board/i),
  D("Gymnastic rings", "吊り輪", "rings", "⭕", "Bodyweight", /gymnastic(s)?\s*rings?|\brings?\b|吊り輪|リング/i, { v: ["(wood)", "(plastic)"] }),
  D("Suspension trainer", "サスペンショントレーナー", null, "🪢", "Bodyweight", /suspension|\btrx\b|サスペンション/i),
  D("Nordic curl strap", "ノルディックハムストリング", null, "🦵", "Bodyweight", /nordic\s*(curl|hamstring)/i),
  D("Ab crunch machine", "腹筋マシン", null, "🦵", "Ab wheels", /ab(dominal)?\s*(crunch(er)?|coaster|machine|trainer|glider)|crunch\s*machine|lower\s*body\s*(exercise|trainer|tool|machine)|leg\s*(and|n|&)\s*lower\s*body|腹筋マシン|アブコースター|アブマシン/i),
  D("Ab wheel", "腹筋ローラー", "wheel", "🛞", "Ab wheels", /ab(dominal)?\s*(wheel|roller|carver)|exercise\s*(wheel|roller)|wheel\s*roller|^\s*roller\b|腹筋ローラー|アブローラー/i, { v: ["(single)", "(double)", "(wide)", "with knee pad", "(auto-rebound)"] }),
  D("Sit-up assist strap", "腹筋サポーター", null, "🤸", "Bodyweight", /sit[\s-]*up\s*(bar|assist)|腹筋サポート/i),

  // Benches
  D("Flat bench", "フラットベンチ", "bench", "🪑", "Benches", /bench|ベンチ/i, { q: /flat|utility|フラット/i, v: ["(folding)"] }),
  D("Adjustable bench", "インクラインベンチ", "bench", "🪑", "Benches", /bench|ベンチ/i, { q: /adjustable|incline|fid|multi|インクライン|アジャスタブル|マルチ/i, v: ["(flat/incline/decline)", "(folding)"] }),
  D("Decline sit-up bench", "腹筋台", "bench", "🪑", "Benches", /bench|ベンチ|腹筋台/i, { q: /decline|sit[\s-]*up|ab\b|crunch|デクライン|シットアップ|腹筋/i }),
  D("Preacher curl bench", "プリーチャーカールベンチ", "bench", "🪑", "Benches", /bench|ベンチ/i, { q: /preacher|scott|プリーチャー/i }),
  D("Weight bench", "トレーニングベンチ", "bench", "🪑", "Benches", /bench|ベンチ/i),
  D("Bench press station with rack", "ベンチプレス台", "bench", "🪑", "Benches", /bench\s*press|ベンチプレス/i, { q: /rack|station|stand|台|ラック/i }),
  D("Roman chair hyperextension bench", "ハイパーエクステンション", "bench", "🪑", "Benches", /roman\s*chair|hyper[\s-]*extension|back\s*extension|ハイパーエクステンション/i),
  D("Glute ham developer bench", "GHD", "bench", "🪑", "Benches", /glute[\s-]*ham|\bghd\b/i),
  D("Leg curl and extension bench", "レッグカールベンチ", "bench", "🪑", "Benches", /leg\s*(curl|extension)\s*(bench|attachment)/i),

  // Machines (home gym)
  D("Smith machine (home gym)", "スミスマシン", "gym", "🏗️", "Machines", /smith|スミス/i),
  D("Cable crossover (home gym)", "ケーブルクロスオーバー", "gym", "🏗️", "Machines", /cable\s*cross|crossover|functional\s*trainer|ケーブル/i),
  D("Lat pulldown machine (home gym)", "ラットプルダウン", "gym", "🏗️", "Machines", /lat\s*pull[\s-]*down|low\s*row|ラットプル/i),
  D("Leg press machine (home gym)", "レッグプレス", "gym", "🏗️", "Machines", /leg\s*press|レッグプレス/i),
  D("Hack squat machine (home gym)", "ハックスクワット", "gym", "🏗️", "Machines", /hack\s*squat/i),
  D("Leg extension machine (home gym)", "レッグエクステンション", "gym", "🏗️", "Machines", /leg\s*(extension|curl)\s*machine|レッグエクステンション|レッグカール/i),
  D("Pec deck machine (home gym)", "ペックデック", "gym", "🏗️", "Machines", /pec\s*deck|chest\s*fly\s*machine|ペックデック/i),
  D("Multi-station home gym", "ホームジム", "gym", "🏗️", "Machines", /home\s*gym|multi[\s-]*(station|gym)|all[\s-]*in[\s-]*one\s*trainer|ホームジム/i),
  D("Belt squat machine (home gym)", "ベルトスクワット", "gym", "🏗️", "Machines", /belt\s*squat/i),
  D("Weight sled", "スレッド", null, "🛷", "Machines", /\bsled\b|prowler|スレッド/i),

  // Cardio
  D("Motorised treadmill", "ルームランナー", null, "🏃", "Cardio", TREAD, { v: ["(folding)", "(with incline)"] }),
  D("Walking pad", "ウォーキングパッド", null, "🏃", "Cardio", TREAD, { q: /walking\s*pad|under[\s-]*desk|ウォーキング/i }),
  D("Manual treadmill", "マニュアルトレッドミル", null, "🏃", "Cardio", TREAD, { q: /manual|non[\s-]*motori[sz]ed|curved|self[\s-]*powered|自走/i }),
  D("Upright exercise bike", "フィットネスバイク", "bike", "🚴", "Cardio", BIKE, { q: /upright|exercise|fitness|stationary|magnetic|aero|フィットネス|エアロ|マグネティック/i }),
  D("Spin bike", "スピンバイク", "bike", "🚴", "Cardio", BIKE, { q: /spin|indoor\s*cycl|studio|スピン/i }),
  D("Recumbent bike", "リカンベントバイク", "bike", "🚴", "Cardio", BIKE, { q: /recumbent|リカンベント/i }),
  D("Air bike", "エアバイク", "bike", "🚴", "Cardio", BIKE, { q: /\bair\b|fan|assault|echo|airdyne|エア/i }),
  D("Folding X-bike", "折りたたみバイク", "bike", "🚴", "Cardio", BIKE, { q: /fold|x[\s-]*bike|折りたたみ/i }),
  D("Mini pedal exerciser cycle", "ペダル運動器", "bike", "🚴", "Cardio", /pedal\s*exerciser|mini\s*(bike|cycle)|desk\s*cycle|ペダル/i),
  D("Indoor bike trainer", "サイクルトレーナー", "bike", "🚴", "Cardio", /turbo\s*trainer|bike\s*trainer|smart\s*trainer|direct[\s-]*drive|サイクルトレーナー|ローラー台/i),
  D("Exercise bike", "エアロバイク", "bike", "🚴", "Cardio", BIKE),
  D("Rowing machine", "ローイングマシン", null, "🚣", "Cardio", ROW, { v: ["(air)", "(magnetic)", "(water)", "(hydraulic)"] }),
  D("Elliptical cross trainer", "クロストレーナー", null, "🏃", "Cardio", /elliptical|cross\s*trainer|クロストレーナー|エリプティカル/i),
  D("Mini stepper", "ステッパー", null, "🪜", "Cardio", /stepper|ステッパー/i, { v: ["(twist)", "(side)", "with arm cords"] }),
  D("Stair climber", "ステアクライマー", null, "🪜", "Cardio", /stair\s*(climber|master|mill)|ステアクライマー/i),
  D("Ski ergometer", "スキーエルゴ", null, "⛷️", "Cardio", /ski\s*erg|skierg|ski\s*trainer/i),
  D("Vibration platform machine", "振動マシン", null, "📳", "Cardio", /vibration|whole[\s-]*body\s*vibr|振動/i),
  D("Mini trampoline rebounder", "トランポリン", null, "🤸", "Cardio", /trampoline|rebounder|トランポリン/i),
  D("Aerobic step platform", "ステップ台", null, "🪜", "Cardio", /aerobic\s*step|step\s*(platform|board|deck)|ステップ台|踏み台/i),
  D("Plyo box", "プライオボックス", null, "📦", "Cardio", /plyo(metric)?\s*box|box\s*jump|プライオ/i, { v: ["(soft foam)", "(wooden 3-in-1)"] }),
  D("Air walker", "エアウォーカー", null, "🏃", "Cardio", /air\s*walker|ウォーカー/i),

  // Skipping ropes and battle ropes
  D("Skipping rope", "縄跳び", "rope", "🪢", "Ropes", ROPE, { v: ["(PVC)", "(leather)", "(wooden handles)"] }),
  D("Speed jump rope", "スピードロープ", "rope", "🪢", "Ropes", ROPE, { q: /speed|steel|cable|bearing|スピード|ワイヤー/i }),
  D("Weighted jump rope", "ウェイト縄跳び", "rope", "🪢", "Ropes", ROPE, { q: /weighted|heavy|ウェイト/i, v: ["(0.5 lb)", "(1 lb)", "(2 lb)", "(1 kg)"] }),
  D("Beaded jump rope", "ビーズ縄跳び", "rope", "🪢", "Ropes", ROPE, { q: /beaded|bead|segmented|ビーズ/i }),
  D("Cordless skipping rope", "コードレス縄跳び", "rope", "🪢", "Ropes", ROPE, { q: /cordless|ropeless|ball|コードレス/i }),
  D("Smart skipping rope with counter", "カウンター付き縄跳び", "rope", "🪢", "Ropes", ROPE, { q: /counter|smart|digital|bluetooth|カウンター|カウント/i }),
  D("Battle rope", "バトルロープ", null, "🪢", "Ropes", /battle\s*rope|power\s*rope|heavy\s*rope|バトルロープ/i, { v: ["38 mm × 9 m", "38 mm × 12 m", "38 mm × 15 m", "50 mm × 9 m", "50 mm × 12 m", "50 mm × 15 m"] }),

  // Mats
  D("Yoga mat", "ヨガマット", "mat", "🧘", "Mats", /yoga\s*mat|ヨガマット/i, {
    v: [...[3, 4, 6, 8].map((x) => `PVC ${x} mm`), ...[4, 6, 8, 10].map((x) => `TPE ${x} mm`), ...[8, 10, 12, 15, 20].map((x) => `NBR ${x} mm`),
      ...[3, 4, 5, 6].map((x) => `natural rubber ${x} mm`), ...[4, 5].map((x) => `PU rubber ${x} mm`), ...[3, 4, 5, 6].map((x) => `cork ${x} mm`), "jute 4 mm", "jute 5 mm",
      ...[1, 1.5, 2].map((x) => `travel ${x} mm`)],
  }),
  D("Exercise mat", "トレーニングマット", "mat", "🧘", "Mats", MAT, { q: /exercise|fitness|workout|gym|pilates|トレーニング|エクササイズ|ピラティス/i, v: ["10 mm", "12 mm", "15 mm", "20 mm", "(folding)"] }),
  D("Puzzle floor mat", "ジョイントマット", "mat", "🧘", "Mats", MAT, { q: /puzzle|interlock|jigsaw|eva|joint|tile|ジョイント/i, v: ["10 mm", "12 mm", "20 mm"] }),
  D("Folding gymnastics mat", "体操マット", "mat", "🧘", "Mats", MAT, { q: /folding|gymnastic|tumbling|crash|体操/i }),
  D("Equipment floor mat", "防振マット", "mat", "🧘", "Mats", MAT, { q: /floor|equipment|protect|防振|防音|床/i }),
  D("Rubber floor tile", "ゴムマット", null, "⬛", "Mats", /rubber\s*(floor|flooring|tile)|horse\s*stall|ゴムマット/i, { v: ["15 mm", "20 mm", "30 mm"] }),

  // Balls
  D("Medicine ball", "メディシンボール", null, "🏐", "Balls", /medicine\s*ball|med\s*ball|メディシンボール/i, { kg: range(1, 10, 1) }),
  D("Slam ball", "スラムボール", null, "🏐", "Balls", /slam\s*ball|スラムボール/i, { kg: [3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30] }),
  D("Wall ball", "ウォールボール", null, "🏐", "Balls", /wall\s*ball|ウォールボール/i, { kg: [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14] }),
  D("Stability ball", "バランスボール", null, "🔵", "Balls", /stability\s*ball|swiss\s*ball|gym\s*ball|exercise\s*ball|yoga\s*ball|fit\s*ball|balance\s*ball|バランスボール|ジムボール/i, { v: ["45 cm", "55 cm", "65 cm", "75 cm", "85 cm"] }),
  D("Mini pilates ball", "ピラティスボール", null, "🔵", "Balls", /pilates\s*ball|mini\s*ball|soft\s*ball|ピラティスボール/i, { v: ["20 cm", "25 cm"] }),
  D("BOSU balance trainer", "バランスドーム", null, "🔵", "Balls", /bosu|balance\s*(trainer|dome)|half\s*ball|バランスドーム/i),
  D("Balance board", "バランスボード", null, "🛹", "Balls", /balance\s*board|wobble\s*board|バランスボード/i),
  D("Balance pad", "バランスパッド", null, "🟦", "Balls", /balance\s*(pad|cushion|disc)|wobble\s*cushion|バランスディスク|バランスクッション/i),
  D("Massage ball", "マッサージボール", null, "⚪", "Recovery", /massage\s*ball|lacrosse\s*ball|peanut\s*ball|spiky\s*ball|trigger\s*point\s*ball|マッサージボール/i, { v: ["(single)", "(peanut)", "(spiky)"] }),

  // Wearable weights
  D("Weight vest", "ウェイトベスト", null, "🦺", "Wearable weights", /weight(ed)?\s*vest|plate\s*carrier|ウェイトベスト|加重ベスト/i, { kg: [2.5, 5, 7.5, 10, 15, 20, 25, 30] }),
  D("Ankle weights", "アンクルウェイト", null, "🦶", "Wearable weights", /ankle\s*weights?|leg\s*weights?|アンクルウェイト|リストウェイト/i, { kg: [0.5, 1, 1.5, 2, 2.5, 3, 4, 5] }),
  D("Wrist weights", "リストウェイト", null, "✊", "Wearable weights", /wrist\s*weights?|hand\s*weights?\s*strap|リストウェイト/i, { kg: [0.25, 0.5, 1, 1.5, 2] }),
  D("Chain weight belt", "ディップベルト", null, "⛓️", "Wearable weights", /dip(ping)?\s*belt|chain\s*belt|weight\s*belt\s*with\s*chain|ディップベルト/i),
  D("Weighted hula hoop", "フラフープ", null, "⭕", "Wearable weights", /hula\s*hoop|フラフープ/i, { kg: [0.5, 1, 1.2, 1.5, 2] }),

  // Grip and forearms
  D("Hand gripper", "ハンドグリップ", null, "✊", "Grip", /hand\s*grip(per)?|grip\s*(strengthener|trainer)|gripper|ハンドグリップ|握力/i, { v: ["(adjustable 5–60 kg)", "(adjustable 10–40 kg)", "20 kg", "30 kg", "40 kg", "50 kg", "60 kg", "100 lb", "150 lb", "200 lb", "250 lb", "300 lb"] }),
  D("Rotating arm exerciser", "回転式アームトレーナー", null, "💪", "Grip", /rotating\s*arm|arm\s*(exerciser|trainer|blaster|twister)|speed\s*wheel|power\s*twister|アームトレーナー|アームツイスター/i),
  D("Wrist roller", "リストローラー", null, "✊", "Grip", /wrist\s*roller|forearm\s*roller|リストローラー/i),
  D("Finger exerciser", "フィンガートレーナー", null, "✊", "Grip", /finger\s*(exerciser|strengthener|trainer)|フィンガー/i),
  D("Gyroscopic wrist ball", "パワーボール", null, "✊", "Grip", /powerball|power\s*ball|gyro(scopic)?\s*(wrist)?\s*ball|パワーボール/i),
  D("Chest expander", "エキスパンダー", null, "💪", "Grip", /chest\s*expander|spring\s*expander|エキスパンダー/i),
  D("Power twister", "パワーツイスター", null, "💪", "Grip", /power\s*twister|twister\s*bar|bendy\s*bar|パワーツイスター/i),
  D("Farmer's walk handles", "ファーマーズハンドル", null, "💪", "Grip", /farmer'?s?\s*(walk\s*)?handles?/i),

  // Strongman, traditional and functional
  D("Sandbag", "サンドバッグ", null, "🎒", "Functional", /sand\s*bag|power\s*bag|core\s*bag|パワーバッグ/i, { kg: [5, 10, 15, 20, 25, 30, 40, 50] }),
  D("Bulgarian bag", "ブルガリアンバッグ", null, "🎒", "Functional", /bulgarian\s*bag/i, { kg: [5, 8, 10, 12, 15, 17, 22] }),
  D("Steel mace", "スチールメイス", null, "🔨", "Functional", /steel\s*mace|\bmace\b|メイス/i, { kg: [4, 5, 7, 9, 10, 12, 15] }),
  D("Gada (Indian mace)", "ガダ", null, "🔨", "Functional", /\bgada\b|gadha/i, { kg: [5, 8, 10, 12, 15, 20] }),
  D("Mudgar (jori pair)", "ムドガル", null, "🔨", "Functional", /mudgar|mugdar|\bjori\b|joris/i, { kg: [2, 3, 4, 5, 6, 8, 10] }),
  D("Indian clubs", "インディアンクラブ", null, "🔨", "Functional", /indian\s*clubs?|\bclubbells?\b|インディアンクラブ/i, { kg: [0.5, 1, 1.5, 2, 3, 5] }),
  D("Sledgehammer", "スレッジハンマー", null, "🔨", "Functional", /sledge\s*hammer|sledgehammer/i, { kg: [4, 5, 7, 9] }),
  D("Training tyre", "タイヤ", null, "🛞", "Functional", /\btyre\b|\btire\b|タイヤ/i),
  D("Core sliders", "スライドディスク", null, "🥏", "Functional", /sliders?|gliding\s*discs?|glide\s*discs?|スライドディスク/i),
  D("Agility ladder", "ラダー", null, "🪜", "Functional", /agility\s*ladder|speed\s*ladder|ラダー/i, { v: ["4 m", "6 m", "8 m"] }),
  D("Training cones", "マーカーコーン", null, "🔺", "Functional", /cones?\b|marker\s*disc|コーン/i, { v: ["(set of 10)", "(set of 50 disc cones)"] }),
  D("Speed hurdles", "ミニハードル", null, "🚧", "Functional", /hurdles?|ハードル/i, { v: ["6 inch", "9 inch", "12 inch", "15 inch", "18 inch"] }),
  D("Parachute speed chute", "スピードパラシュート", null, "🪂", "Functional", /parachute|speed\s*chute/i),

  // Combat
  D("Boxing gloves", "ボクシンググローブ", null, "🥊", "Combat", /boxing\s*gloves?|ボクシンググローブ|ボクシンググラブ/i, { v: [...OZ, 18].map((x) => `${x} oz`) }),
  D("MMA gloves", "オープンフィンガーグローブ", null, "🥊", "Combat", /mma\s*gloves?|grappling\s*gloves?|open[\s-]*finger|オープンフィンガー/i),
  D("Bag gloves", "パンチンググローブ", null, "🥊", "Combat", /bag\s*gloves?|punch(ing)?\s*mitts?|パンチンググローブ/i),
  D("Hand wraps", "バンテージ", null, "🥊", "Combat", /hand\s*wraps?|boxing\s*wraps?|bandage|バンテージ/i, { v: ["120 in (3 m)", "180 in (4.5 m)", "(quick wraps)"] }),
  D("Focus mitts", "パンチングミット", null, "🥊", "Combat", /focus\s*mitts?|punch(ing)?\s*mitts?|pads?\s*mitts?|ミット/i),
  D("Thai pads", "キックミット", null, "🥊", "Combat", /thai\s*pads?|kick\s*(shield|pad|mitt)|キックミット/i),
  D("Punching bag", "サンドバッグ (ボクシング)", null, "🥊", "Combat", /punch(ing)?\s*bag|heavy\s*bag|boxing\s*bag|kick\s*bag|サンドバッグ|サンドバック/i, { v: ["3 ft", "4 ft", "5 ft", "6 ft"] }),
  D("Free-standing punching bag", "自立式サンドバッグ", null, "🥊", "Combat", /punch(ing)?\s*bag|boxing\s*bag|サンドバッグ|サンドバック/i, { q: /free[\s-]*standing|stand|自立/i }),
  D("Speed bag", "パンチングボール", null, "🥊", "Combat", /speed\s*bag|double[\s-]*end|reflex\s*bag|パンチングボール/i, { v: ["(platform)", "(double-end)"] }),
  D("Boxing headgear", "ヘッドギア", null, "🥊", "Combat", /head\s*gear|headguard|ヘッドギア/i),
  D("Mouthguard", "マウスピース", null, "🦷", "Combat", /mouth\s*guard|gum\s*shield|マウスピース/i),

  // Lifting accessories
  D("Lifting belt", "トレーニングベルト", null, "🎽", "Lifting accessories", /lifting\s*belt|weight\s*belt|powerlifting\s*belt|lever\s*belt|トレーニングベルト|パワーベルト/i, { v: ["(leather 10 mm)", "(leather 13 mm)", "(lever 10 mm)", "(lever 13 mm)", "(nylon)"] }),
  D("Lifting straps", "リストストラップ", null, "🎽", "Lifting accessories", /lifting\s*straps?|wrist\s*straps?|lasso\s*straps?|figure[\s-]*8\s*straps?|versa\s*gripps?|リストストラップ/i, { v: ["(lasso)", "(figure-8)", "(padded)", "(hook)"] }),
  D("Wrist wraps", "リストラップ", null, "🎽", "Lifting accessories", /wrist\s*wraps?|リストラップ/i, { v: ["30 cm", "50 cm", "60 cm"] }),
  D("Knee sleeves", "ニースリーブ", null, "🎽", "Lifting accessories", /knee\s*sleeves?|ニースリーブ/i, { v: ["5 mm", "7 mm"] }),
  D("Knee wraps", "ニーラップ", null, "🎽", "Lifting accessories", /knee\s*wraps?|ニーラップ/i),
  D("Elbow sleeves", "エルボースリーブ", null, "🎽", "Lifting accessories", /elbow\s*sleeves?|エルボー/i),
  D("Lifting chalk", "チョーク", null, "🧂", "Lifting accessories", /chalk|magnesium\s*carbonate|チョーク|炭酸マグネシウム/i, { v: ["(block)", "(loose)", "(liquid)", "(ball)"] }),
  D("Lifting gloves", "トレーニンググローブ", null, "🧤", "Lifting accessories", GLOVE, { q: /lifting|gym|workout|weight|training|fitness|トレーニング|ジム/i, v: ["(half finger)", "(full finger)", "with wrist support"] }),
  D("Weight collars", "カラー", null, "🔒", "Lifting accessories", /collars?|spring\s*clips?|lock\s*jaw|カラー/i, { v: ["(spring 50 mm)", "(quick-lock 50 mm)", "(1-inch)"] }),
  D("Squat neck pad", "バーパッド", null, "🧽", "Lifting accessories", /squat\s*pad|neck\s*pad|bar\s*pad|barbell\s*pad|バーパッド/i),
  D("Hip thrust belt", "ヒップスラストベルト", null, "🎽", "Lifting accessories", /hip\s*thrust\s*(belt|pad)/i),
  D("Neck harness", "ネックハーネス", null, "🎽", "Lifting accessories", /neck\s*harness/i),
  D("Weight tree", "プレートラック", null, "🌳", "Lifting accessories", /weight\s*tree|plate\s*(tree|rack|storage)|プレートラック/i),
  D("Weight storage rack", "ダンベルラック", null, "🗄️", "Lifting accessories", /storage\s*rack|weights?\s*rack|ダンベルラック/i),

  // Yoga and mobility
  D("Yoga block", "ヨガブロック", null, "🧱", "Yoga & mobility", /yoga\s*(block|brick)|ヨガブロック/i, { v: ["(EVA foam)", "(cork)", "(wood)", "(bamboo)"] }),
  D("Yoga strap", "ヨガベルト", null, "🧘", "Yoga & mobility", /yoga\s*(strap|belt)|stretch(ing)?\s*strap|ヨガベルト|ストレッチベルト/i, { v: ["1.8 m", "2.5 m", "3 m"] }),
  D("Yoga bolster", "ボルスター", null, "🧘", "Yoga & mobility", /bolster|ボルスター/i),
  D("Yoga wheel", "ヨガホイール", null, "🧘", "Yoga & mobility", /yoga\s*wheel|ヨガホイール/i),
  D("Meditation cushion", "瞑想クッション", null, "🧘", "Yoga & mobility", /meditation\s*cushion|zafu|瞑想/i),
  D("Pilates circle (magic circle)", "ピラティスリング", null, "🧘", "Yoga & mobility", /pilates\s*(ring|circle)|magic\s*circle|ピラティスリング/i),
  D("Pilates reformer", "リフォーマー", null, "🧘", "Yoga & mobility", /reformer|リフォーマー/i),
  D("Stretch pole", "ストレッチポール", null, "🧘", "Yoga & mobility", /stretch\s*pole|ストレッチポール/i, { v: ["(half-cut)"] }),

  // Recovery
  D("Foam roller", "フォームローラー", null, "🧽", "Recovery", /foam\s*roll(er)?|grid\s*roller|フォームローラー/i, { v: ["30 cm", "45 cm", "60 cm", "90 cm", "(grid)", "(vibrating)"] }),
  D("Massage stick roller", "マッサージスティック", null, "🧽", "Recovery", /massage\s*stick|muscle\s*roller\s*stick|roller\s*stick|マッサージスティック/i),
  D("Massage gun", "マッサージガン", null, "🔫", "Recovery", /massage\s*gun|percussion|theragun|hypervolt|マッサージガン|筋膜リリースガン/i, { v: ["(mini)", "(full size)"] }),
  D("Compression boots", "リカバリーブーツ", null, "🦵", "Recovery", /compression\s*boots|normatec|air\s*compression/i),
  D("EMS trainer", "EMSトレーニング", null, "⚡", "Recovery", /\bems\b|electric\s*muscle|sixpad|シックスパッド/i, { v: ["(abs belt)", "(foot pad)", "(arm pad)"] }),

  // Footwear
  D("Running shoes", "ランニングシューズ", null, "👟", "Shoes", SHOE, { q: /running|run|road|marathon|jogging|ランニング/i }),
  D("Training shoes", "トレーニングシューズ", null, "👟", "Shoes", SHOE, { q: /training|cross[\s-]*train|gym|workout|metcon|nano|トレーニング/i }),
  D("Weightlifting shoes", "ウエイトリフティングシューズ", null, "👟", "Shoes", SHOE, { q: /weightlifting|lifting|lifter|squat|romaleos|adipower|リフティング/i }),
  D("Walking shoes", "ウォーキングシューズ", null, "👟", "Shoes", SHOE, { q: /walking|ウォーキング/i }),
  D("Trail running shoes", "トレイルランニングシューズ", null, "👟", "Shoes", SHOE, { q: /trail|トレイル/i }),
  D("Sports shoes", "スポーツシューズ", null, "👟", "Shoes", SHOE),
  D("Boxing shoes", "ボクシングシューズ", null, "👟", "Shoes", SHOE, { q: /boxing|wrestling|ボクシング/i }),

  // Trackers
  D("Heart-rate chest strap", "心拍センサー", null, "❤️", "Trackers", /heart[\s-]*rate\s*(strap|monitor|sensor)|\bhrm\b|chest\s*strap|心拍/i),
  D("Heart-rate arm sensor", "アームバンド心拍計", null, "❤️", "Trackers", /arm\s*(band)?\s*(heart|hr)|optical\s*hr|verity/i),
  D("Smart watch", "スマートウォッチ", null, "⌚", "Trackers", /smart\s*watch|sports\s*watch|gps\s*watch|running\s*watch|watch|スマートウォッチ|ウォッチ/i),
  D("Fitness tracker", "活動量計", null, "⌚", "Trackers", /fitness\s*(tracker|band)|activity\s*tracker|smart\s*band|活動量計|スマートバンド/i),
  D("Body composition scale", "体組成計", null, "⚖️", "Trackers", /body\s*(composition|fat)\s*scale|smart\s*scale|体組成計|体重計/i),
];

// ---------- Brands ----------
type B = { b: string; ja?: string; m: Market[]; re: RegExp };
const BR: Record<string, B> = {};
const brand = (b: string, m: Market[], re: RegExp, ja?: string) => { BR[b] = { b, m, re, ja }; };
// India
brand("Corength", ["IN", "global"], /corength|decathlon|デカトロン/i);
brand("Domyos", ["IN", "global"], /domyos|decathlon|デカトロン/i);
brand("Kimjaly", ["IN", "global"], /kimjaly|decathlon/i);
brand("Outshock", ["IN", "global"], /outshock|decathlon/i);
brand("Kiprun", ["IN", "global"], /kiprun|kalenji|decathlon/i);
brand("Boldfit", ["IN"], /boldfit|bold\s*fit/i);
brand("Kore", ["IN"], /\bkore\b/i);
brand("Nivia", ["IN"], /nivia/i);
brand("Cosco", ["IN"], /cosco/i);
brand("Strauss", ["IN"], /strauss/i);
brand("Cockatoo", ["IN"], /cockatoo/i);
brand("Amazon Basics", ["IN", "JP", "global"], /amazon\s*basics|amazonbasics|アマゾンベーシック/i);
brand("Lifelong", ["IN"], /lifelong/i);
brand("PowerMax Fitness", ["IN"], /power\s*max/i);
brand("Fitkit", ["IN"], /fitkit/i);
brand("Durafit", ["IN"], /durafit/i);
brand("Welcare", ["IN"], /welcare/i);
brand("Aurion", ["IN"], /aurion/i);
brand("Protoner", ["IN"], /protoner/i);
brand("Cultsport", ["IN"], /cult\s*sport|cult\.?fit/i);
brand("Vector X", ["IN"], /vector\s*x/i);
brand("USI Universal", ["IN"], /\busi\b|usi\s*universal/i);
brand("HRX", ["IN"], /\bhrx\b/i);
brand("Campus", ["IN"], /\bcampus\b/i);
brand("Noise", ["IN"], /\bnoise\b|colorfit/i);
brand("boAt", ["IN"], /\bboat\b/i);
brand("Fire-Boltt", ["IN"], /fire[\s-]*boltt?/i);
// Japan
brand("Nitori", ["JP"], /nitori|ニトリ/i, "ニトリ");
brand("Daiso", ["JP"], /daiso|ダイソー/i, "ダイソー");
brand("Alinco", ["JP"], /alinco|アルインコ/i, "アルインコ");
brand("La-VIE", ["JP"], /la[\s-]*vie|ラヴィ|ラビ/i, "ラヴィ");
brand("IROTEC", ["JP"], /irotec|アイロテック/i, "アイロテック");
brand("Motions", ["JP"], /motions|モーションズ/i, "モーションズ");
brand("Fighting Road", ["JP"], /fighting\s*road|ファイティングロード/i, "ファイティングロード");
brand("Reebok", ["JP", "global"], /reebok|リーボック/i, "リーボック");
brand("STEADY", ["JP"], /\bsteady\b|ステディ/i, "ステディ");
brand("BODYMAKER", ["JP"], /body\s*maker|ボディメーカー/i, "ボディメーカー");
brand("Winning", ["JP"], /\bwinning\b|ウイニング|ウィニング/i, "ウイニング");
brand("ISAMI", ["JP"], /\bisami\b|イサミ/i, "イサミ");
brand("Wild Fit", ["JP"], /wild\s*fit|ワイルドフィット/i, "ワイルドフィット");
brand("SIXPAD", ["JP", "global"], /six\s*pad|シックスパッド/i, "シックスパッド");
brand("LPN", ["JP"], /\blpn\b|stretch\s*pole|ストレッチポール/i);
brand("ASICS", ["JP", "global"], /asics|アシックス/i, "アシックス");
brand("Mizuno", ["JP", "global"], /mizuno|ミズノ/i, "ミズノ");
brand("Tanita", ["JP", "global"], /tanita|タニタ/i, "タニタ");
// Global
brand("Rogue", ["global"], /rogue/i, "ローグ");
brand("Eleiko", ["global"], /eleiko|エレイコ/i, "エレイコ");
brand("Bowflex", ["global", "JP"], /bowflex|ボウフレックス/i, "ボウフレックス");
brand("PowerBlock", ["global", "JP"], /power\s*block|パワーブロック/i, "パワーブロック");
brand("Ironmaster", ["global"], /iron\s*master/i);
brand("Life Fitness", ["global", "JP", "IN"], /life\s*fitness|ライフフィットネス/i, "ライフフィットネス");
brand("Technogym", ["global", "JP", "IN"], /techno\s*gym|テクノジム/i, "テクノジム");
brand("Concept2", ["global", "JP", "IN"], /concept\s*-?2|コンセプト2/i, "コンセプト2");
brand("TRX", ["global", "JP", "IN"], /\btrx\b/i);
brand("Adidas", ["global", "JP", "IN"], /adidas|アディダス/i, "アディダス");
brand("Nike", ["global", "JP", "IN"], /\bnike\b|ナイキ/i, "ナイキ");
brand("Under Armour", ["global", "JP", "IN"], /under\s*armou?r|アンダーアーマー/i, "アンダーアーマー");
brand("Puma", ["global", "JP", "IN"], /\bpuma\b|プーマ/i, "プーマ");
brand("New Balance", ["global", "JP", "IN"], /new\s*balance|ニューバランス/i, "ニューバランス");
brand("Brooks", ["global", "JP"], /\bbrooks\b|ブルックス/i, "ブルックス");
brand("Hoka", ["global", "JP", "IN"], /\bhoka\b|ホカ/i, "ホカ");
brand("Saucony", ["global", "JP"], /saucony|サッカニー/i, "サッカニー");
brand("On", ["global", "JP", "IN"], /\bon\s+cloud|cloud(monster|surfer|flow|runner|boom)|オン/i, "オン");
brand("Theraband", ["global", "JP", "IN"], /thera\s*-?band|セラバンド/i, "セラバンド");
brand("Gymshark", ["global"], /gymshark/i);
brand("SPRI", ["global"], /\bspri\b/i);
brand("Black Mountain", ["global"], /black\s*mountain/i);
brand("Fit Simplify", ["global"], /fit\s*simplify/i);
brand("NordicTrack", ["global"], /nordic\s*track/i);
brand("Peloton", ["global"], /peloton/i);
brand("Schwinn", ["global"], /schwinn/i);
brand("Echelon", ["global"], /echelon/i);
brand("Keiser", ["global"], /keiser/i);
brand("Assault Fitness", ["global"], /assault/i);
brand("Hydrow", ["global"], /hydrow/i);
brand("WaterRower", ["global", "JP"], /water\s*rower|ウォーターローワー/i);
brand("Matrix", ["global", "JP", "IN"], /\bmatrix\b/i);
brand("Precor", ["global"], /precor/i);
brand("Body-Solid", ["global"], /body[\s-]*solid/i);
brand("Rep Fitness", ["global"], /rep\s*fitness/i);
brand("Titan Fitness", ["global"], /titan\s*fitness/i);
brand("York Barbell", ["global"], /\byork\b/i);
brand("Kettlebell Kings", ["global"], /kettlebell\s*kings/i);
brand("Dragon Door", ["global"], /dragon\s*door|\brkc\b/i);
brand("Onnit", ["global"], /onnit/i);
brand("KingSmith", ["global", "JP", "IN"], /king\s*smith|walking\s*pad/i);
brand("Bosu", ["global"], /bosu/i);
brand("SKLZ", ["global"], /sklz/i);
brand("SBD", ["global"], /\bsbd\b/i);
brand("Rehband", ["global"], /rehband/i);
brand("Harbinger", ["global"], /harbinger/i);
brand("Versa Gripps", ["global"], /versa\s*gripps?/i);
brand("IronMind", ["global"], /iron\s*mind|captains?\s*of\s*crush|\bcoc\b/i);
brand("Everlast", ["global", "IN"], /everlast/i);
brand("Hayabusa", ["global"], /hayabusa/i);
brand("Title Boxing", ["global"], /title\s*boxing/i);
brand("RDX", ["global", "IN"], /\brdx\b/i);
brand("Venum", ["global", "JP"], /venum/i);
brand("Twins Special", ["global", "JP"], /twins/i);
brand("Fairtex", ["global", "JP"], /fairtex/i);
brand("Cleto Reyes", ["global"], /cleto|reyes/i);
brand("Manduka", ["global", "JP"], /manduka|マンドゥカ/i, "マンドゥカ");
brand("Liforme", ["global"], /liforme/i);
brand("Lululemon", ["global", "JP"], /lululemon|ルルレモン/i);
brand("Gaiam", ["global"], /gaiam/i);
brand("Jade Yoga", ["global"], /\bjade\b/i);
brand("TriggerPoint", ["global", "JP"], /trigger\s*point/i);
brand("Therabody", ["global", "JP", "IN"], /therabody|theragun|セラガン/i);
brand("Hyperice", ["global", "JP"], /hyperice|hypervolt/i);
brand("Crossrope", ["global"], /cross\s*rope/i);
brand("Garmin", ["global", "JP", "IN"], /garmin|ガーミン/i, "ガーミン");
brand("Apple", ["global", "JP", "IN"], /apple\s*watch|アップルウォッチ/i);
brand("Fitbit", ["global", "JP", "IN"], /fitbit/i);
brand("Samsung", ["global", "IN"], /samsung|galaxy\s*(watch|fit)/i);
brand("Xiaomi", ["global", "JP", "IN"], /xiaomi|\bmi\s*band|redmi|シャオミ/i);
brand("Huawei", ["global", "JP"], /huawei|ファーウェイ/i);
brand("Amazfit", ["global", "JP", "IN"], /amazfit/i);
brand("Polar", ["global", "JP"], /\bpolar\b|ポラール/i);
brand("Coros", ["global", "JP"], /coros/i);
brand("Suunto", ["global", "JP"], /suunto|スント/i);
brand("Wahoo", ["global", "JP"], /wahoo/i);
brand("Whoop", ["global"], /whoop/i);

// ---------- Brand lines ----------
// [brand, type, options]. `kg`/`lb`/`v` list the sizes or variants sold;
// `models` are named products: [name, model words, kg?].
type Line = { line?: string; kg?: number[]; lb?: number[]; v?: string[]; note?: string; models?: [string, string, number?][]; bare?: boolean };
const LINES: [string, string, Line][] = [];
const L = (b: string, t: string, o: Line = {}) => { LINES.push([b, t, o]); };
const M = (b: string, t: string, models: [string, string, number?][]) => L(b, t, { models, bare: false });
const TYPICAL = "Sizes are the usual range for this line; check the label";

// --- Decathlon (Corength strength, Domyos fitness, Kimjaly yoga, Outshock boxing, Kiprun running)
L("Corength", "Hex dumbbell", { kg: [2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20, 22.5, 25, 27.5, 30], note: TYPICAL });
L("Corength", "Cast iron kettlebell", { kg: [4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32], note: TYPICAL });
L("Corength", "Spinlock dumbbell set", { kg: [10, 20, 50], note: TYPICAL });
L("Corength", "Standard plate 1-inch", { kg: [0.5, 1, 2, 5, 10, 20], note: TYPICAL });
L("Corength", "Bumper plate", { kg: [5, 10, 15, 20, 25], note: TYPICAL });
L("Corength", "Olympic barbell", { kg: [20] });
L("Corength", "EZ curl barbell");
L("Corength", "Flat bench");
L("Corength", "Adjustable bench");
L("Corength", "Squat stand");
L("Corength", "Power rack with pull-up bar");
L("Domyos", "Hex dumbbell", { kg: [2, 4, 6, 8, 10, 12.5, 15, 17.5, 20], note: TYPICAL });
L("Domyos", "Vinyl dumbbell", { kg: [0.5, 1, 1.5, 2, 3, 4, 5], note: TYPICAL });
L("Domyos", "Spinlock dumbbell set", { kg: [10, 20], note: TYPICAL });
L("Domyos", "Exercise mat");
L("Domyos", "Resistance band", { v: ["(5 kg)", "(10 kg)", "(15 kg)", "(25 kg)", "(35 kg)"], note: TYPICAL });
L("Domyos", "Mini loop band");
L("Domyos", "Fabric hip band");
L("Domyos", "Resistance tube band with handles");
L("Domyos", "Ab wheel");
L("Domyos", "Push-up handles");
L("Domyos", "Doorway pull-up bar");
L("Domyos", "Skipping rope");
L("Domyos", "Stability ball", { v: ["55 cm", "65 cm", "75 cm"] });
L("Domyos", "Medicine ball", { kg: [1, 2, 3, 4, 5], note: TYPICAL });
L("Domyos", "Ankle weights", { kg: [0.5, 1, 2], note: TYPICAL });
L("Domyos", "Aerobic step platform");
L("Domyos", "Foam roller");
L("Domyos", "Motorised treadmill");
M("Domyos", "Motorised treadmill", [["Domyos T540C motorised treadmill", "T540C"], ["Domyos T900D motorised treadmill", "T900D"]]);
L("Domyos", "Upright exercise bike");
L("Domyos", "Rowing machine");
L("Domyos", "Elliptical cross trainer");
L("Kimjaly", "Yoga mat", { v: ["4 mm", "5 mm", "8 mm", "(travel 1.5 mm)"], note: TYPICAL });
L("Kimjaly", "Yoga block", { v: ["(foam)", "(cork)"] });
L("Kimjaly", "Yoga strap");
L("Outshock", "Boxing gloves", { v: OZ.map((x) => `${x} oz`) });
L("Outshock", "Punching bag");
L("Outshock", "Hand wraps");
L("Outshock", "Focus mitts");
L("Kiprun", "Running shoes");
// --- India
L("Boldfit", "Yoga mat", { v: ["4 mm", "6 mm", "8 mm", "10 mm"], note: TYPICAL });
L("Boldfit", "Resistance tube band with handles");
L("Boldfit", "Mini loop band");
L("Boldfit", "Long loop power band");
L("Boldfit", "Resistance band set");
L("Boldfit", "Skipping rope");
L("Boldfit", "Hand gripper", { v: ["(adjustable 10–40 kg)"] });
L("Boldfit", "Lifting gloves");
L("Boldfit", "Ab wheel", { v: ["with knee pad"] });
L("Boldfit", "Push-up handles");
L("Boldfit", "Foam roller");
L("Boldfit", "Wrist wraps");
L("Boldfit", "Lifting belt");
L("Boldfit", "Stability ball", { v: ["65 cm", "75 cm"] });
L("Kore", "PVC dumbbell", { kg: [1, 2, 3, 4, 5, 6, 8, 10], note: TYPICAL });
L("Kore", "Spinlock dumbbell set", { line: "PVC", kg: [10, 20, 30, 40, 50], note: TYPICAL });
L("Kore", "PVC weight plate", { kg: [1, 2, 2.5, 3, 5, 10], note: TYPICAL });
L("Kore", "Standard barbell rod", { v: ["3 ft", "4 ft", "5 ft"] });
L("Kore", "Barbell set", { kg: [20, 30, 50], note: TYPICAL });
L("Kore", "Adjustable bench");
L("Kore", "Lifting gloves");
L("Kore", "Skipping rope");
L("Nivia", "Yoga mat");
L("Nivia", "Skipping rope");
L("Nivia", "Hand gripper");
L("Nivia", "Lifting gloves");
L("Nivia", "Resistance tube band with handles");
L("Nivia", "Stability ball");
L("Nivia", "Medicine ball");
L("Nivia", "Sports shoes");
L("Nivia", "Running shoes");
L("Cosco", "Skipping rope");
L("Cosco", "Hand gripper");
L("Cosco", "Medicine ball");
L("Cosco", "Stability ball");
L("Cosco", "Boxing gloves");
L("Cosco", "Punching bag");
L("Cosco", "Yoga mat");
L("Cosco", "Chest expander");
L("Strauss", "Yoga mat", { v: ["4 mm", "6 mm", "8 mm"], note: TYPICAL });
L("Strauss", "Ab wheel");
L("Strauss", "Mini loop band");
L("Strauss", "Resistance tube band with handles");
L("Strauss", "Push-up handles");
L("Strauss", "Skipping rope");
L("Strauss", "Hand gripper");
L("Strauss", "Foam roller");
L("Strauss", "Stability ball", { v: ["65 cm", "75 cm"] });
L("Strauss", "Vinyl dumbbell", { kg: [1, 2, 3, 4, 5], note: TYPICAL });
L("Strauss", "Ankle weights", { kg: [0.5, 1, 2], note: TYPICAL });
L("Strauss", "Lifting gloves");
L("Strauss", "Lifting belt");
L("Cockatoo", "Motorised treadmill");
L("Cockatoo", "Upright exercise bike");
L("Cockatoo", "Spin bike");
L("Cockatoo", "Elliptical cross trainer");
L("Cockatoo", "Adjustable bench");
L("Cockatoo", "Multi-station home gym");
L("Amazon Basics", "Neoprene dumbbell", { lb: [1, 2, 3, 5, 8, 10, 12, 15], note: TYPICAL });
L("Amazon Basics", "Hex dumbbell", { lb: range(10, 50, 5), note: TYPICAL });
L("Amazon Basics", "Cast iron kettlebell", { lb: range(10, 50, 5), note: TYPICAL });
L("Amazon Basics", "Vinyl kettlebell", { lb: [5, 10, 15, 20, 25], note: TYPICAL });
L("Amazon Basics", "Exercise mat", { v: ["13 mm (extra thick)"] });
L("Amazon Basics", "Yoga mat");
L("Amazon Basics", "Foam roller", { v: ["30 cm", "45 cm", "60 cm", "90 cm"] });
L("Amazon Basics", "Resistance band set");
L("Amazon Basics", "Stability ball", { v: ["55 cm", "65 cm", "75 cm"] });
L("Amazon Basics", "Medicine ball");
L("Lifelong", "Motorised treadmill");
L("Lifelong", "Upright exercise bike");
L("Lifelong", "Spinlock dumbbell set", { line: "PVC", kg: [10, 20, 30], note: TYPICAL });
L("Lifelong", "Ab wheel");
L("PowerMax Fitness", "Motorised treadmill");
L("PowerMax Fitness", "Upright exercise bike");
L("PowerMax Fitness", "Spin bike");
L("PowerMax Fitness", "Elliptical cross trainer");
L("Fitkit", "Motorised treadmill");
L("Fitkit", "Upright exercise bike");
L("Durafit", "Motorised treadmill");
L("Welcare", "Motorised treadmill");
L("Welcare", "Upright exercise bike");
L("Aurion", "Yoga mat");
L("Aurion", "Resistance band set");
L("Aurion", "Foam roller");
L("Aurion", "Ab wheel");
L("Aurion", "Stability ball");
L("Protoner", "PVC dumbbell", { kg: [1, 2, 3, 4, 5, 6, 8, 10], note: TYPICAL });
L("Protoner", "Rubber-coated plate", { kg: [1.25, 2.5, 5, 10], note: TYPICAL });
L("Protoner", "Standard barbell rod", { v: ["3 ft", "5 ft"] });
L("Protoner", "Barbell set", { kg: [20, 30, 50], note: TYPICAL });
L("Protoner", "Adjustable bench");
L("Cultsport", "Motorised treadmill");
L("Cultsport", "Spin bike");
L("Cultsport", "Yoga mat");
L("Vector X", "Boxing gloves");
L("Vector X", "Skipping rope");
L("Vector X", "Stability ball");
L("Vector X", "Medicine ball");
L("USI Universal", "Boxing gloves");
L("USI Universal", "Punching bag");
L("USI Universal", "Hand wraps");
L("USI Universal", "Focus mitts");
L("USI Universal", "Thai pads");
L("HRX", "Running shoes");
L("HRX", "Training shoes");
L("Campus", "Running shoes");
L("Campus", "Sports shoes");
M("Noise", "Smart watch", [["Noise ColorFit Pro 4 smart watch", "ColorFit Pro 4"], ["Noise ColorFit Pro 5 smart watch", "ColorFit Pro 5"], ["Noise ColorFit Icon 2 smart watch", "ColorFit Icon 2"]]);
M("boAt", "Smart watch", [["boAt Xtend smart watch", "Xtend"], ["boAt Wave Call smart watch", "Wave Call"], ["boAt Wave Lite smart watch", "Wave Lite"]]);
M("Fire-Boltt", "Smart watch", [["Fire-Boltt Ninja Call Pro smart watch", "Ninja Call Pro"], ["Fire-Boltt Phoenix smart watch", "Phoenix"]]);
// --- Japan
L("Nitori", "Yoga mat");
L("Nitori", "Stability ball");
L("Nitori", "Foam roller");
L("Nitori", "Exercise mat");
L("Daiso", "Hand gripper");
L("Daiso", "Skipping rope");
L("Daiso", "Resistance tube band with handles");
L("Daiso", "Mini loop band");
L("Daiso", "Yoga mat");
L("Daiso", "Vinyl dumbbell", { kg: [0.5, 1], note: TYPICAL });
L("Daiso", "Push-up handles");
L("Daiso", "Massage ball");
M("Alinco", "Upright exercise bike", [["Alinco AFB4309 exercise bike", "AFB4309"]]);
L("Alinco", "Upright exercise bike");
L("Alinco", "Motorised treadmill");
L("Alinco", "Chin-up stand with pull-up bar");
L("Alinco", "Mini stepper");
L("Alinco", "Rowing machine");
L("Alinco", "Decline sit-up bench");
L("La-VIE", "Yoga mat");
L("La-VIE", "Stability ball");
L("La-VIE", "Foam roller");
L("La-VIE", "Ankle weights");
L("La-VIE", "Push-up handles");
L("La-VIE", "Resistance band");
L("La-VIE", "Ab wheel");
L("IROTEC", "Spinlock dumbbell set", { line: "rubber", kg: [20, 40, 60, 80, 100], note: TYPICAL });
L("IROTEC", "Barbell set", { kg: [60, 100], note: TYPICAL });
L("IROTEC", "Rubber-coated plate", { kg: [1.25, 2.5, 5, 10, 15, 20], note: TYPICAL });
L("IROTEC", "Olympic iron plate", { kg: [1.25, 2.5, 5, 10, 15, 20], note: TYPICAL });
L("IROTEC", "Adjustable bench");
L("IROTEC", "Flat bench");
L("IROTEC", "Power rack with pull-up bar");
L("IROTEC", "Chin-up stand with pull-up bar");
L("Motions", "Adjustable dumbbell", { kg: [24, 40], note: TYPICAL });
L("Motions", "Adjustable bench");
L("Fighting Road", "Spinlock dumbbell set", { kg: [20, 30, 40, 60], note: TYPICAL });
L("Fighting Road", "Olympic iron plate");
L("Fighting Road", "Rubber-coated plate");
L("Fighting Road", "Olympic barbell", { kg: [20] });
L("Fighting Road", "Flat bench");
L("Fighting Road", "Adjustable bench");
L("Fighting Road", "Power rack with pull-up bar");
L("Fighting Road", "Half rack with pull-up bar");
L("Fighting Road", "Chin-up stand with pull-up bar");
L("Reebok", "Aerobic step platform");
L("Reebok", "Exercise mat");
L("Reebok", "Yoga mat");
L("Reebok", "Hex dumbbell");
L("Reebok", "Kettlebell");
L("Reebok", "Flat bench");
L("Reebok", "Resistance tube band with handles");
L("Reebok", "Foam roller");
L("Reebok", "Lifting gloves");
L("Reebok", "Upright exercise bike");
L("Reebok", "Motorised treadmill");
M("Reebok", "Training shoes", [["Reebok Nano X3 training shoes", "Nano X3"], ["Reebok Nano X4 training shoes", "Nano X4"], ["Reebok Nano X5 training shoes", "Nano X5"], ["Reebok Nano 2.0 training shoes", "Nano 2.0"]]);
M("Reebok", "Weightlifting shoes", [["Reebok Legacy Lifter III weightlifting shoes", "Legacy Lifter III"]]);
L("STEADY", "Adjustable dumbbell");
L("STEADY", "Adjustable bench");
L("STEADY", "Upright exercise bike");
L("STEADY", "Ab wheel");
L("BODYMAKER", "Boxing gloves");
L("BODYMAKER", "Exercise mat");
L("BODYMAKER", "Resistance band");
L("BODYMAKER", "Weight vest");
L("BODYMAKER", "Skipping rope");
L("BODYMAKER", "Focus mitts");
L("Winning", "Boxing gloves", { v: OZ.map((x) => `${x} oz`) });
L("Winning", "Hand wraps");
L("Winning", "Focus mitts");
L("Winning", "Boxing headgear");
L("ISAMI", "Boxing gloves");
L("ISAMI", "MMA gloves");
L("ISAMI", "Focus mitts");
L("ISAMI", "Thai pads");
L("Wild Fit", "Kettlebell");
L("Wild Fit", "Spinlock dumbbell set");
L("Wild Fit", "Sandbag");
M("SIXPAD", "EMS trainer", [["SIXPAD Abs Fit 2 EMS trainer", "Abs Fit 2"], ["SIXPAD Foot Fit EMS trainer", "Foot Fit"]]);
M("LPN", "Stretch pole", [["LPN Stretch Pole EX", "EX"], ["LPN Stretch Pole MX", "MX"]]);
M("Tanita", "Body composition scale", [["Tanita InnerScan body composition scale", "InnerScan"]]);
// --- Strength, global
L("Rogue", "Hex dumbbell", { line: "rubber", lb: [...range(5, 100, 5), 105, 110, 115, 120, 125], note: TYPICAL });
L("Rogue", "Cast iron kettlebell", { kg: [4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 40, 44, 48] });
L("Rogue", "Competition kettlebell", { kg: [8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48] });
L("Rogue", "Bumper plate", { line: "HG 2.0", lb: [10, 15, 25, 35, 45, 55] });
L("Rogue", "Bumper plate", { line: "Echo", lb: [10, 15, 25, 35, 45] });
L("Rogue", "Bumper plate", { line: "KG Training 2.0", kg: [5, 10, 15, 20, 25] });
L("Rogue", "Olympic iron plate", { line: "Deep Dish", lb: [25, 45] });
L("Rogue", "Change plate", { kg: [0.25, 0.5, 1, 1.5, 2, 2.5, 5] });
M("Rogue", "Olympic barbell", [["Rogue Ohio Bar (Olympic barbell 20 kg)", "Ohio Bar", 20], ["Rogue Bella Bar 2.0 (Olympic barbell 15 kg)", "Bella Bar", 15], ["Rogue Echo Bar 2.0 (Olympic barbell 20 kg)", "Echo Bar", 20], ["Rogue Euro Olympic WL barbell 20 kg", "Euro Olympic", 20]]);
M("Rogue", "Powerlifting barbell", [["Rogue Ohio Power Bar (barbell 20 kg)", "Ohio Power Bar", 20]]);
M("Rogue", "Deadlift barbell", [["Rogue Ohio Deadlift Bar (barbell 20 kg)", "Ohio Deadlift Bar", 20]]);
M("Rogue", "Hex trap barbell", [["Rogue TB-2 trap barbell", "TB-2"]]);
M("Rogue", "Power rack with pull-up bar", [["Rogue R-3 power rack with pull-up bar", "R-3"], ["Rogue R-4 power rack with pull-up bar", "R-4"], ["Rogue RML-390F folding power rack with pull-up bar", "RML-390F"], ["Rogue RM-6 Monster power rack with pull-up bar", "RM-6"]]);
M("Rogue", "Squat stand", [["Rogue SML-2 squat stand", "SML-2"]]);
M("Rogue", "Adjustable bench", [["Rogue Adjustable Bench 3.0", "Adjustable Bench 3.0"]]);
M("Rogue", "Flat bench", [["Rogue Flat Utility Bench 2.0", "Flat Utility Bench 2.0"]]);
M("Rogue", "Air bike", [["Rogue Echo Bike (air bike)", "Echo Bike"]]);
M("Rogue", "Speed jump rope", [["Rogue SR-1 speed jump rope", "SR-1"], ["Rogue SR-2 speed jump rope", "SR-2"]]);
L("Rogue", "Gymnastic rings", { v: ["(wood)"] });
L("Rogue", "Long loop power band");
L("Rogue", "Slam ball", { lb: [10, 15, 20, 25, 30, 40, 50], note: TYPICAL });
L("Rogue", "Wall ball", { lb: [6, 8, 10, 14, 16, 20, 25, 30], note: TYPICAL });
M("Rogue", "Lifting belt", [["Rogue Ohio lifting belt", "Ohio"]]);
L("Eleiko", "Competition bumper plate", { line: "IWF", kg: [10, 15, 20, 25] });
L("Eleiko", "Change plate", { line: "IWF", kg: [0.5, 1, 1.5, 2, 2.5, 5] });
L("Eleiko", "Bumper plate", { line: "Sport Training", kg: [5, 10, 15, 20, 25] });
L("Eleiko", "Competition kettlebell", { kg: [8, 12, 16, 20, 24, 28, 32] });
M("Eleiko", "Olympic barbell", [["Eleiko IWF weightlifting competition barbell 20 kg", "IWF competition", 20], ["Eleiko IWF women's competition barbell 15 kg", "IWF women", 15], ["Eleiko XF barbell 20 kg", "XF", 20], ["Eleiko XF barbell 15 kg", "XF", 15], ["Eleiko Sport training barbell 20 kg", "Sport training", 20]]);
M("Eleiko", "Powerlifting barbell", [["Eleiko IPF powerlifting barbell 20 kg", "IPF powerlifting", 20]]);
M("Bowflex", "Adjustable dumbbell", [["Bowflex SelectTech 552 adjustable dumbbell (2–24 kg)", "SelectTech 552", 24], ["Bowflex SelectTech 1090 adjustable dumbbell (4–41 kg)", "SelectTech 1090", 41]]);
M("Bowflex", "Adjustable kettlebell", [["Bowflex SelectTech 840 adjustable kettlebell (3.5–18 kg)", "SelectTech 840", 18]]);
M("Bowflex", "Adjustable bench", [["Bowflex SelectTech 5.1S adjustable bench", "5.1S"]]);
M("Bowflex", "Elliptical cross trainer", [["Bowflex Max Trainer M6 elliptical cross trainer", "Max Trainer M6"], ["Bowflex Max Trainer M9 elliptical cross trainer", "Max Trainer M9"]]);
M("Bowflex", "Spin bike", [["Bowflex C6 spin bike", "C6"], ["Bowflex VeloCore spin bike", "VeloCore"]]);
M("Bowflex", "Multi-station home gym", [["Bowflex Xtreme 2 SE home gym", "Xtreme 2 SE"]]);
M("PowerBlock", "Adjustable dumbbell", [
  ["PowerBlock Elite EXP adjustable dumbbell stage 1 (up to 22.7 kg)", "Elite EXP", 22.7], ["PowerBlock Elite EXP adjustable dumbbell stage 2 (up to 31.8 kg)", "Elite EXP stage 2", 31.8],
  ["PowerBlock Elite EXP adjustable dumbbell stage 3 (up to 40.8 kg)", "Elite EXP stage 3", 40.8], ["PowerBlock Pro EXP adjustable dumbbell (up to 22.7 kg)", "Pro EXP", 22.7],
  ["PowerBlock Sport 24 adjustable dumbbell (up to 10.9 kg)", "Sport 24", 10.9], ["PowerBlock Sport 50 adjustable dumbbell (up to 22.7 kg)", "Sport 50", 22.7],
  ["PowerBlock Elite USA adjustable dumbbell (up to 22.7 kg)", "Elite USA", 22.7],
]);
M("Ironmaster", "Adjustable dumbbell", [["Ironmaster Quick-Lock adjustable dumbbell (up to 34 kg)", "Quick-Lock 75", 34], ["Ironmaster Quick-Lock adjustable dumbbell (up to 54.4 kg)", "Quick-Lock 120", 54.4]]);
M("Ironmaster", "Adjustable bench", [["Ironmaster Super Bench adjustable bench", "Super Bench"]]);
M("Rep Fitness", "Adjustable bench", [["Rep Fitness AB-3000 adjustable bench", "AB-3000"], ["Rep Fitness AB-5000 adjustable bench", "AB-5000"]]);
M("Rep Fitness", "Power rack with pull-up bar", [["Rep Fitness PR-4000 power rack with pull-up bar", "PR-4000"], ["Rep Fitness PR-5000 power rack with pull-up bar", "PR-5000"]]);
L("Rep Fitness", "Hex dumbbell", { lb: range(5, 50, 5), note: TYPICAL });
L("Rep Fitness", "Bumper plate", { lb: [10, 15, 25, 35, 45, 55], note: TYPICAL });
M("Titan Fitness", "Power rack with pull-up bar", [["Titan Fitness T-3 power rack with pull-up bar", "T-3"], ["Titan Fitness X-3 power rack with pull-up bar", "X-3"]]);
L("Titan Fitness", "Bumper plate");
L("Titan Fitness", "Flat bench");
L("Body-Solid", "Power rack with pull-up bar");
L("Body-Solid", "Multi-station home gym");
L("Body-Solid", "Adjustable bench");
L("York Barbell", "Olympic iron plate");
L("York Barbell", "Olympic barbell");
L("York Barbell", "Hex dumbbell");
L("Kettlebell Kings", "Competition kettlebell", { kg: COMP_KB });
L("Dragon Door", "Cast iron kettlebell", { line: "RKC", kg: [8, 12, 16, 20, 24, 28, 32, 40, 48] });
L("Onnit", "Steel mace", { lb: [7, 10, 15, 20, 25], note: TYPICAL });
L("Onnit", "Cast iron kettlebell");
L("Onnit", "Sandbag");
M("TRX", "Suspension trainer", [["TRX Home2 suspension trainer", "Home2"], ["TRX PRO4 suspension trainer", "PRO4"], ["TRX All-in-One suspension trainer", "All-in-One"], ["TRX Tactical suspension trainer", "Tactical"]]);
L("TRX", "Mini loop band");
L("Adidas", "Hex dumbbell", { kg: [2.5, 5, 7.5, 10, 12.5, 15, 17.5, 20, 22.5, 25], note: TYPICAL });
L("Adidas", "Kettlebell", { kg: [4, 6, 8, 10, 12, 16, 20, 24], note: TYPICAL });
L("Adidas", "Yoga mat");
L("Adidas", "Exercise mat");
L("Adidas", "Mini loop band");
L("Adidas", "Speed jump rope");
L("Adidas", "Lifting gloves");
L("Adidas", "Boxing gloves", { v: OZ.map((x) => `${x} oz`), note: TYPICAL });
L("Adidas", "Ankle weights");
L("Adidas", "Foam roller");
L("Adidas", "Flat bench");
L("Nike", "Yoga mat");
L("Nike", "Speed jump rope");
L("Nike", "Lifting gloves");
L("Under Armour", "Lifting gloves");
L("Under Armour", "Yoga mat");
L("Gymshark", "Resistance band");
L("Gymshark", "Mini loop band");
// Bands (Theraband colours are the real resistance scale)
const TB = ["tan, extra thin", "yellow, thin", "red, medium", "green, heavy", "blue, extra heavy", "black, special heavy", "silver, super heavy", "gold, max"];
L("Theraband", "Flat therapy band", { v: TB.map((c) => `(${c})`) });
L("Theraband", "Mini loop band", { v: TB.slice(1, 6).map((c) => `(${c})`) });
L("Theraband", "Resistance tube band with handles", { line: "tubing", v: TB.slice(1, 7).map((c) => `(${c})`) });
L("Theraband", "Resistance band", { line: "CLX", v: TB.slice(1, 7).map((c) => `(${c})`) });
M("Theraband", "Power twister", [["Theraband FlexBar (yellow, extra light)", "FlexBar yellow"], ["Theraband FlexBar (red, light)", "FlexBar red"], ["Theraband FlexBar (green, medium)", "FlexBar green"], ["Theraband FlexBar (blue, heavy)", "FlexBar blue"]]);
L("SPRI", "Resistance tube band with handles", { line: "Xertube", v: ["(light)", "(medium)", "(heavy)", "(ultra heavy)"] });
L("Black Mountain", "Resistance band set");
L("Fit Simplify", "Mini loop band", { v: ["(set of 5)"] });
// Grip
M("IronMind", "Hand gripper", [
  ["IronMind Captains of Crush hand gripper Guide (60 lb)", "Guide"], ["IronMind Captains of Crush hand gripper Sport (80 lb)", "Sport"], ["IronMind Captains of Crush hand gripper Trainer (100 lb)", "Trainer"],
  ["IronMind Captains of Crush hand gripper No. 0.5 (120 lb)", "No. 0.5"], ["IronMind Captains of Crush hand gripper No. 1 (140 lb)", "No. 1"], ["IronMind Captains of Crush hand gripper No. 1.5 (167.5 lb)", "No. 1.5"],
  ["IronMind Captains of Crush hand gripper No. 2 (195 lb)", "No. 2"], ["IronMind Captains of Crush hand gripper No. 2.5 (237.5 lb)", "No. 2.5"], ["IronMind Captains of Crush hand gripper No. 3 (280 lb)", "No. 3"],
  ["IronMind Captains of Crush hand gripper No. 3.5 (322.5 lb)", "No. 3.5"], ["IronMind Captains of Crush hand gripper No. 4 (365 lb)", "No. 4"],
]);
M("Versa Gripps", "Lifting straps", [["Versa Gripps Pro lifting straps", "Pro"], ["Versa Gripps FIT lifting straps", "FIT"]]);
M("SBD", "Lifting belt", [["SBD lever lifting belt 10 mm", "lever 10"], ["SBD lever lifting belt 13 mm", "lever 13"]]);
M("SBD", "Knee sleeves", [["SBD knee sleeves 7 mm", "7 mm"]]);
L("SBD", "Wrist wraps");
L("Rehband", "Knee sleeves", { v: ["5 mm", "7 mm"] });
L("Harbinger", "Lifting gloves");
L("Harbinger", "Lifting belt");
// Cardio, global
M("Concept2", "Rowing machine", [["Concept2 RowErg rowing machine", "RowErg"], ["Concept2 RowErg rowing machine (tall legs)", "RowErg tall"], ["Concept2 Model D rowing machine", "Model D"], ["Concept2 Model E rowing machine", "Model E"], ["Concept2 Dynamic rowing machine", "Dynamic"]]);
M("Concept2", "Ski ergometer", [["Concept2 SkiErg", "SkiErg"]]);
M("Concept2", "Air bike", [["Concept2 BikeErg (air bike)", "BikeErg"]]);
M("Technogym", "Motorised treadmill", [["Technogym Skillrun treadmill", "Skillrun"], ["Technogym Run treadmill", "Run"], ["Technogym MyRun treadmill", "MyRun"]]);
M("Technogym", "Spin bike", [["Technogym Skillbike (spin bike)", "Skillbike"], ["Technogym Bike (spin bike)", "Technogym Bike"]]);
M("Technogym", "Rowing machine", [["Technogym Skillrow rowing machine", "Skillrow"]]);
M("Technogym", "Adjustable bench", [["Technogym Bench (adjustable bench)", "Technogym Bench"]]);
M("Life Fitness", "Motorised treadmill", [["Life Fitness T3 treadmill", "T3"], ["Life Fitness T5 treadmill", "T5"], ["Life Fitness Run CX treadmill", "Run CX"], ["Life Fitness Integrity treadmill", "Integrity"]]);
M("Life Fitness", "Elliptical cross trainer", [["Life Fitness E3 elliptical cross trainer", "E3"], ["Life Fitness E5 elliptical cross trainer", "E5"]]);
M("Life Fitness", "Upright exercise bike", [["Life Fitness Lifecycle C1 exercise bike", "Lifecycle C1"], ["Life Fitness Lifecycle C3 exercise bike", "Lifecycle C3"]]);
M("NordicTrack", "Motorised treadmill", [["NordicTrack Commercial 1750 treadmill", "Commercial 1750"], ["NordicTrack Commercial X22i incline treadmill", "X22i"]]);
M("NordicTrack", "Spin bike", [["NordicTrack S22i studio cycle (spin bike)", "S22i"]]);
M("NordicTrack", "Rowing machine", [["NordicTrack RW900 rowing machine", "RW900"]]);
M("Peloton", "Spin bike", [["Peloton Bike (spin bike)", "Peloton Bike"], ["Peloton Bike+ (spin bike)", "Bike+"]]);
M("Peloton", "Motorised treadmill", [["Peloton Tread treadmill", "Tread"]]);
M("Peloton", "Rowing machine", [["Peloton Row rowing machine", "Row"]]);
M("Schwinn", "Air bike", [["Schwinn Airdyne AD7 air bike", "AD7"], ["Schwinn Airdyne AD6 air bike", "AD6"]]);
M("Schwinn", "Spin bike", [["Schwinn IC4 spin bike", "IC4"]]);
M("Schwinn", "Recumbent bike", [["Schwinn 270 recumbent bike", "270"]]);
M("Schwinn", "Upright exercise bike", [["Schwinn 170 upright exercise bike", "170"]]);
M("Echelon", "Spin bike", [["Echelon Connect EX-5 spin bike", "EX-5"]]);
M("Keiser", "Spin bike", [["Keiser M3i spin bike", "M3i"]]);
M("Assault Fitness", "Air bike", [["AssaultBike Classic air bike", "Classic"], ["AssaultBike Elite air bike", "Elite"]]);
M("Assault Fitness", "Manual treadmill", [["AssaultRunner Pro curved treadmill", "AssaultRunner Pro"], ["AssaultRunner Elite curved treadmill", "AssaultRunner Elite"]]);
M("Hydrow", "Rowing machine", [["Hydrow rowing machine", "Hydrow"], ["Hydrow Wave rowing machine", "Wave"]]);
M("WaterRower", "Rowing machine", [["WaterRower Natural rowing machine", "Natural"], ["WaterRower Oxbridge rowing machine", "Oxbridge"], ["WaterRower Club rowing machine", "Club"], ["WaterRower A1 rowing machine", "A1"]]);
L("Matrix", "Motorised treadmill");
L("Matrix", "Elliptical cross trainer");
L("Matrix", "Spin bike");
L("Precor", "Motorised treadmill");
L("Precor", "Elliptical cross trainer");
M("KingSmith", "Walking pad", [["KingSmith WalkingPad A1 Pro walking pad", "A1"], ["KingSmith WalkingPad C2 walking pad", "C2"], ["KingSmith WalkingPad R1 Pro walking pad", "R1"]]);
M("Bosu", "BOSU balance trainer", [["Bosu Home balance trainer", "Home"], ["Bosu Pro balance trainer", "Pro"]]);
L("SKLZ", "Agility ladder");
L("SKLZ", "Speed hurdles");
L("SKLZ", "Training cones");
M("Crossrope", "Weighted jump rope", [["Crossrope Get Lean weighted jump rope set", "Get Lean"], ["Crossrope Get Strong weighted jump rope set", "Get Strong"], ["Crossrope AMP smart jump rope", "AMP"]]);
// Combat, global
L("Everlast", "Boxing gloves", { line: "Pro Style", v: [8, 10, 12, 14, 16].map((x) => `${x} oz`) });
L("Everlast", "Boxing gloves", { line: "Elite", v: [12, 14, 16].map((x) => `${x} oz`) });
L("Everlast", "Punching bag", { v: ["(70 lb)", "(100 lb)"] });
L("Everlast", "Hand wraps", { v: ["180 in (4.5 m)"] });
L("Hayabusa", "Boxing gloves", { line: "T3", v: [10, 12, 14, 16].map((x) => `${x} oz`) });
L("Title Boxing", "Boxing gloves");
L("Title Boxing", "Punching bag");
L("RDX", "Boxing gloves", { v: [10, 12, 14, 16].map((x) => `${x} oz`), note: TYPICAL });
L("RDX", "Punching bag");
L("RDX", "Lifting belt");
L("RDX", "Lifting straps");
L("Venum", "Boxing gloves", { line: "Challenger 3.0", v: [8, 10, 12, 14, 16].map((x) => `${x} oz`) });
L("Venum", "Boxing gloves", { line: "Elite", v: [10, 12, 14, 16].map((x) => `${x} oz`) });
L("Venum", "MMA gloves");
L("Venum", "Hand wraps");
L("Twins Special", "Boxing gloves", { line: "BGVL3", v: [8, 10, 12, 14, 16].map((x) => `${x} oz`) });
L("Twins Special", "Thai pads");
L("Fairtex", "Boxing gloves", { line: "BGV1", v: [8, 10, 12, 14, 16].map((x) => `${x} oz`) });
L("Fairtex", "Thai pads");
L("Cleto Reyes", "Boxing gloves", { v: [12, 14, 16].map((x) => `${x} oz`), note: TYPICAL });
// Yoga and recovery, global
M("Manduka", "Yoga mat", [["Manduka PRO yoga mat 6 mm", "PRO"], ["Manduka PROlite yoga mat 4.7 mm", "PROlite"], ["Manduka eKO yoga mat 5 mm", "eKO"], ["Manduka eKO SuperLite travel yoga mat 1.5 mm", "eKO SuperLite"], ["Manduka GRP Adapt yoga mat 5 mm", "GRP"]]);
L("Manduka", "Yoga block", { v: ["(cork)", "(foam)"] });
M("Liforme", "Yoga mat", [["Liforme yoga mat 4.2 mm", "Liforme"]]);
M("Lululemon", "Yoga mat", [["Lululemon The Mat 5 mm yoga mat", "The Mat 5"], ["Lululemon The Mat 3 mm yoga mat", "The Mat 3"]]);
L("Gaiam", "Yoga mat", { v: ["6 mm", "10 mm"] });
L("Gaiam", "Yoga block");
L("Gaiam", "Yoga strap");
M("Jade Yoga", "Yoga mat", [["Jade Harmony yoga mat 4.8 mm", "Harmony"]]);
M("TriggerPoint", "Foam roller", [["TriggerPoint GRID foam roller", "GRID"], ["TriggerPoint GRID Vibe foam roller", "GRID Vibe"]]);
M("Therabody", "Massage gun", [["Theragun Prime massage gun", "Prime"], ["Theragun Mini massage gun", "Mini"], ["Theragun Pro massage gun", "Pro"], ["Theragun Elite massage gun", "Elite"], ["Theragun Relief massage gun", "Relief"]]);
M("Hyperice", "Massage gun", [["Hyperice Hypervolt 2 massage gun", "Hypervolt 2"], ["Hyperice Hypervolt 2 Pro massage gun", "Hypervolt 2 Pro"], ["Hyperice Hypervolt Go 2 massage gun", "Hypervolt Go 2"]]);
M("Hyperice", "Foam roller", [["Hyperice Vyper 3 vibrating foam roller", "Vyper 3"]]);
M("Hyperice", "Compression boots", [["Hyperice Normatec 3 compression boots", "Normatec 3"]]);
// Shoes
M("Nike", "Training shoes", [["Nike Metcon 8 training shoes", "Metcon 8"], ["Nike Metcon 9 training shoes", "Metcon 9"], ["Nike Free Metcon 5 training shoes", "Free Metcon 5"], ["Nike Free Metcon 6 training shoes", "Free Metcon 6"]]);
M("Nike", "Weightlifting shoes", [["Nike Romaleos 4 weightlifting shoes", "Romaleos 4"], ["Nike Savaleos weightlifting shoes", "Savaleos"]]);
M("Nike", "Running shoes", [
  ["Nike Pegasus 39 running shoes", "Pegasus 39"], ["Nike Pegasus 40 running shoes", "Pegasus 40"], ["Nike Pegasus 41 running shoes", "Pegasus 41"], ["Nike Invincible 3 running shoes", "Invincible 3"],
  ["Nike Vomero 17 running shoes", "Vomero 17"], ["Nike Vaporfly 3 running shoes", "Vaporfly 3"], ["Nike Alphafly 3 running shoes", "Alphafly 3"], ["Nike Structure 25 running shoes", "Structure 25"],
  ["Nike Revolution 7 running shoes", "Revolution 7"], ["Nike Downshifter 13 running shoes", "Downshifter 13"],
]);
M("Nike", "Trail running shoes", [["Nike Pegasus Trail 5 trail running shoes", "Pegasus Trail 5"]]);
M("Adidas", "Weightlifting shoes", [["Adidas Adipower Weightlifting 3 shoes", "Adipower 3"]]);
M("Adidas", "Training shoes", [["Adidas Dropset 3 training shoes", "Dropset 3"], ["Adidas Dropset 2 training shoes", "Dropset 2"]]);
M("Adidas", "Running shoes", [
  ["Adidas Adizero Adios Pro 3 running shoes", "Adios Pro 3"], ["Adidas Adizero Boston 12 running shoes", "Boston 12"], ["Adidas Adizero SL running shoes", "Adizero SL"],
  ["Adidas Supernova Rise running shoes", "Supernova Rise"], ["Adidas Ultraboost Light running shoes", "Ultraboost Light"], ["Adidas Duramo SL running shoes", "Duramo SL"], ["Adidas Runfalcon 3 running shoes", "Runfalcon 3"],
]);
M("Under Armour", "Training shoes", [["Under Armour TriBase Reign 5 training shoes", "TriBase Reign 5"], ["Under Armour TriBase Reign 6 training shoes", "TriBase Reign 6"], ["Under Armour Project Rock 6 training shoes", "Project Rock 6"]]);
M("Under Armour", "Running shoes", [["Under Armour HOVR Machina 3 running shoes", "HOVR Machina 3"], ["Under Armour Charged Assert 10 running shoes", "Charged Assert 10"]]);
M("ASICS", "Running shoes", [
  ["ASICS Gel-Kayano 30 running shoes", "Kayano 30"], ["ASICS Gel-Kayano 31 running shoes", "Kayano 31"], ["ASICS Gel-Nimbus 25 running shoes", "Nimbus 25"], ["ASICS Gel-Nimbus 26 running shoes", "Nimbus 26"],
  ["ASICS Novablast 3 running shoes", "Novablast 3"], ["ASICS Novablast 4 running shoes", "Novablast 4"], ["ASICS Gel-Cumulus 25 running shoes", "Cumulus 25"], ["ASICS Gel-Cumulus 26 running shoes", "Cumulus 26"],
  ["ASICS GT-2000 12 running shoes", "GT-2000 12"], ["ASICS Magic Speed 3 running shoes", "Magic Speed 3"], ["ASICS Magic Speed 4 running shoes", "Magic Speed 4"], ["ASICS Superblast running shoes", "Superblast"],
  ["ASICS Metaspeed Sky Paris running shoes", "Metaspeed Sky"], ["ASICS Metaspeed Edge Paris running shoes", "Metaspeed Edge"], ["ASICS Gel-Contend 8 running shoes", "Contend 8"], ["ASICS Gel-Excite 10 running shoes", "Excite 10"],
]);
M("ASICS", "Trail running shoes", [["ASICS Gel-Trabuco 12 trail running shoes", "Trabuco 12"]]);
M("Mizuno", "Running shoes", [
  ["Mizuno Wave Rider 27 running shoes", "Wave Rider 27"], ["Mizuno Wave Rider 28 running shoes", "Wave Rider 28"], ["Mizuno Wave Inspire 20 running shoes", "Wave Inspire 20"],
  ["Mizuno Wave Sky 7 running shoes", "Wave Sky 7"], ["Mizuno Wave Sky 8 running shoes", "Wave Sky 8"], ["Mizuno Wave Rebellion Pro 2 running shoes", "Rebellion Pro 2"], ["Mizuno Neo Vista running shoes", "Neo Vista"],
]);
M("New Balance", "Running shoes", [["New Balance Fresh Foam X 1080v13 running shoes", "1080v13"], ["New Balance Fresh Foam X 1080v14 running shoes", "1080v14"], ["New Balance Fresh Foam X 880v14 running shoes", "880v14"], ["New Balance FuelCell Rebel v4 running shoes", "Rebel v4"], ["New Balance FuelCell SC Elite v4 running shoes", "SC Elite v4"]]);
M("New Balance", "Training shoes", [["New Balance Minimus TR training shoes", "Minimus TR"]]);
M("Brooks", "Running shoes", [["Brooks Ghost 15 running shoes", "Ghost 15"], ["Brooks Ghost 16 running shoes", "Ghost 16"], ["Brooks Glycerin 21 running shoes", "Glycerin 21"], ["Brooks Adrenaline GTS 23 running shoes", "Adrenaline GTS 23"], ["Brooks Adrenaline GTS 24 running shoes", "Adrenaline GTS 24"]]);
M("Hoka", "Running shoes", [["Hoka Clifton 9 running shoes", "Clifton 9"], ["Hoka Bondi 8 running shoes", "Bondi 8"], ["Hoka Mach 6 running shoes", "Mach 6"], ["Hoka Arahi 7 running shoes", "Arahi 7"]]);
M("Hoka", "Trail running shoes", [["Hoka Speedgoat 6 trail running shoes", "Speedgoat 6"]]);
M("Puma", "Running shoes", [["Puma Velocity Nitro 3 running shoes", "Velocity Nitro 3"], ["Puma Deviate Nitro 3 running shoes", "Deviate Nitro 3"]]);
M("Saucony", "Running shoes", [["Saucony Endorphin Speed 4 running shoes", "Endorphin Speed 4"], ["Saucony Ride 17 running shoes", "Ride 17"], ["Saucony Kinvara 14 running shoes", "Kinvara 14"], ["Saucony Triumph 22 running shoes", "Triumph 22"]]);
M("On", "Running shoes", [["On Cloudmonster running shoes", "Cloudmonster"], ["On Cloudsurfer running shoes", "Cloudsurfer"], ["On Cloudflow 4 running shoes", "Cloudflow 4"]]);
// Trackers
M("Garmin", "Smart watch", [
  ...["55", "165", "255", "265", "570", "955", "965", "970"].map((x): [string, string] => [`Garmin Forerunner ${x} smart watch`, `Forerunner ${x}`]),
  ["Garmin Fenix 7 smart watch", "Fenix 7"], ["Garmin Fenix 8 smart watch", "Fenix 8"], ["Garmin Epix Pro smart watch", "Epix Pro"], ["Garmin Venu 3 smart watch", "Venu 3"],
  ["Garmin Venu Sq 2 smart watch", "Venu Sq 2"], ["Garmin Vivoactive 5 smart watch", "Vivoactive 5"], ["Garmin Instinct 2 smart watch", "Instinct 2"], ["Garmin Instinct 3 smart watch", "Instinct 3"],
]);
M("Garmin", "Fitness tracker", [["Garmin Vivosmart 5 fitness tracker", "Vivosmart 5"]]);
M("Garmin", "Heart-rate chest strap", [["Garmin HRM-Pro Plus heart-rate chest strap", "HRM-Pro Plus"], ["Garmin HRM-Dual heart-rate chest strap", "HRM-Dual"], ["Garmin HRM 600 heart-rate chest strap", "HRM 600"]]);
M("Apple", "Smart watch", [["Apple Watch SE smart watch", "SE"], ["Apple Watch Series 8 smart watch", "Series 8"], ["Apple Watch Series 9 smart watch", "Series 9"], ["Apple Watch Series 10 smart watch", "Series 10"], ["Apple Watch Ultra smart watch", "Ultra"], ["Apple Watch Ultra 2 smart watch", "Ultra 2"]]);
M("Fitbit", "Fitness tracker", [["Fitbit Charge 5 fitness tracker", "Charge 5"], ["Fitbit Charge 6 fitness tracker", "Charge 6"], ["Fitbit Inspire 3 fitness tracker", "Inspire 3"], ["Fitbit Luxe fitness tracker", "Luxe"]]);
M("Fitbit", "Smart watch", [["Fitbit Versa 4 smart watch", "Versa 4"], ["Fitbit Sense 2 smart watch", "Sense 2"]]);
M("Samsung", "Smart watch", [["Samsung Galaxy Watch 5 smart watch", "Watch 5"], ["Samsung Galaxy Watch 6 smart watch", "Watch 6"], ["Samsung Galaxy Watch 7 smart watch", "Watch 7"], ["Samsung Galaxy Watch Ultra smart watch", "Watch Ultra"]]);
M("Samsung", "Fitness tracker", [["Samsung Galaxy Fit 3 fitness tracker", "Fit 3"]]);
M("Xiaomi", "Fitness tracker", [["Xiaomi Smart Band 7 fitness tracker", "Band 7"], ["Xiaomi Smart Band 8 fitness tracker", "Band 8"], ["Xiaomi Smart Band 9 fitness tracker", "Band 9"]]);
M("Xiaomi", "Smart watch", [["Xiaomi Redmi Watch 3 smart watch", "Redmi Watch 3"], ["Xiaomi Redmi Watch 4 smart watch", "Redmi Watch 4"]]);
M("Huawei", "Smart watch", [["Huawei Watch GT 3 smart watch", "GT 3"], ["Huawei Watch GT 4 smart watch", "GT 4"], ["Huawei Watch GT 5 smart watch", "GT 5"], ["Huawei Watch Fit 3 smart watch", "Fit 3"]]);
M("Huawei", "Fitness tracker", [["Huawei Band 8 fitness tracker", "Band 8"], ["Huawei Band 9 fitness tracker", "Band 9"]]);
M("Amazfit", "Smart watch", [["Amazfit GTR 4 smart watch", "GTR 4"], ["Amazfit GTS 4 smart watch", "GTS 4"], ["Amazfit Bip 5 smart watch", "Bip 5"], ["Amazfit T-Rex 2 smart watch", "T-Rex 2"], ["Amazfit T-Rex 3 smart watch", "T-Rex 3"], ["Amazfit Balance smart watch", "Balance"], ["Amazfit Active smart watch", "Active"]]);
M("Polar", "Heart-rate chest strap", [["Polar H10 heart-rate chest strap", "H10"], ["Polar H9 heart-rate chest strap", "H9"]]);
M("Polar", "Heart-rate arm sensor", [["Polar Verity Sense heart-rate arm sensor", "Verity Sense"]]);
M("Polar", "Smart watch", [["Polar Vantage V3 smart watch", "Vantage V3"], ["Polar Pacer Pro smart watch", "Pacer Pro"], ["Polar Grit X2 Pro smart watch", "Grit X2 Pro"], ["Polar Ignite 3 smart watch", "Ignite 3"]]);
M("Coros", "Smart watch", [["Coros Pace 3 smart watch", "Pace 3"], ["Coros Pace Pro smart watch", "Pace Pro"], ["Coros Apex 2 Pro smart watch", "Apex 2 Pro"], ["Coros Vertix 2S smart watch", "Vertix 2S"]]);
M("Suunto", "Smart watch", [["Suunto Race smart watch", "Race"], ["Suunto Race S smart watch", "Race S"], ["Suunto 9 Peak Pro smart watch", "9 Peak Pro"], ["Suunto 5 Peak smart watch", "5 Peak"], ["Suunto Vertical smart watch", "Vertical"]]);
M("Wahoo", "Heart-rate chest strap", [["Wahoo TICKR heart-rate chest strap", "TICKR"], ["Wahoo TICKR X heart-rate chest strap", "TICKR X"]]);
M("Wahoo", "Indoor bike trainer", [["Wahoo KICKR smart bike trainer", "KICKR"], ["Wahoo KICKR Core smart bike trainer", "KICKR Core"]]);
M("Whoop", "Fitness tracker", [["Whoop 4.0 fitness tracker", "4.0"]]);

// ---------- Build ----------
const DEF = new Map(DEFS.map((d) => [d.t, d]));
const num = (n: number) => String(+n.toFixed(3));
const lower = (t: string) => (/^[A-Z]{2}/.test(t) ? t : t[0].toLowerCase() + t.slice(1));

type Rec = { e: Equip; d: Def; toks: Set<string>; ja: Set<string>; model?: string[] };
const RECS: Rec[] = [];
const SEEN = new Set<string>();
const words = (s: string) => s.normalize("NFKC").toLowerCase().replace(/(\d)([a-z]+)/g, "$1 $2").split(/[^\p{L}\p{N}.+]+/u).map((w) => w.replace(/^\.+|\.+$/g, "")).filter((w) => w.length > 1 || /\d/.test(w));
function add(d: Def, name: string, o: { ja?: string; kg?: number; brand?: string; markets?: Market[]; note?: string; model?: string } = {}) {
  if (SEEN.has(name.toLowerCase())) return;
  SEEN.add(name.toLowerCase());
  const e: Equip = { name, type: d.t, gear: d.g, emoji: d.e };
  if (o.ja) e.ja = o.ja;
  if (o.kg !== undefined) e.kg = o.kg;
  if (o.brand) e.brand = o.brand;
  if (o.markets) e.markets = o.markets;
  if (o.note) e.note = o.note;
  const toks = new Set(words(name));
  RECS.push({ e, d, toks, ja: new Set(words(o.ja ?? "").filter((w) => !toks.has(w))), model: o.model ? words(o.model) : undefined });
}
const sizeName = (d: Def, base: string, s: string) => (d.fmt ? `${base} ${d.fmt(s)}` : `${base} ${s}`);
function sizes(d: Def, base: string, jaBase: string | undefined, kg: number[] | undefined, lb: number[] | undefined, v: string[] | undefined, extra: { brand?: string; markets?: Market[]; note?: string }) {
  for (const k of kg ?? []) add(d, sizeName(d, base, `${num(k)} kg`), { ...extra, kg: k, ja: jaBase && `${jaBase} ${num(k)}kg` });
  for (const p of lb ?? []) { const k = lbKg(p); add(d, sizeName(d, base, `${num(p)} lb (${num(k)} kg)`), { ...extra, kg: k, ja: jaBase && `${jaBase} ${num(p)}ポンド (${num(k)}kg)` }); }
  for (const x of v ?? []) add(d, `${base} ${x}`, { ...extra, ja: jaBase && `${jaBase} ${x}` });
}
for (const d of DEFS) {
  add(d, d.t, { ja: d.ja });
  sizes(d, d.t, d.ja, d.kg, d.lb, d.v, {});
}
for (const [b, t, o] of LINES) {
  const d = DEF.get(t), br = BR[b];
  if (!d || !br) throw new Error(`equipment: bad line ${b} / ${t}`);
  const extra = { brand: b, markets: br.m, note: o.note };
  if (o.models) for (const [name, model, kg] of o.models) add(d, name, { brand: b, markets: br.m, kg, model, ja: d.ja && `${br.ja ?? b} ${model} ${d.ja}` });
  if (o.bare === false) continue;
  const base = `${b}${o.line ? ` ${o.line}` : ""} ${lower(t)}`;
  const jaBase = d.ja && `${br.ja ?? b}${o.line ? ` ${o.line}` : ""} ${d.ja}`;
  add(d, base, { brand: b, markets: br.m, ja: jaBase });
  sizes(d, base, jaBase, o.kg, o.lb, o.v, extra);
}

export const EQUIPMENT: Equip[] = RECS.map((r) => r.e);

// `name` and `type` are the same: the type's own catalogue entry.
export const EQUIP_TYPES: { name: string; type: string; ja?: string; emoji: string; gear: Gear | null; group: string }[] =
  DEFS.map((d) => ({ name: d.t, type: d.t, ja: d.ja, emoji: d.e, gear: d.g, group: d.grp }));

// ---------- Matching ----------
// A weight in kg from text: "10kg", "10 kgs", "5キロ", "25 lb", "25lbs", "25ポンド".
export function kgIn(text: string): number | undefined {
  const t = text.normalize("NFKC").toLowerCase();
  const kg = t.match(/(\d+(?:[.,]\d+)?)\s*(?:kgs?|kilo(?:gram)?s?|キロ(?:グラム)?)(?![a-z])/);
  if (kg) return +kg[1].replace(",", ".");
  const lb = t.match(/(\d+(?:[.,]\d+)?)\s*(?:lbs?|pounds?|ポンド)(?![a-z])/);
  return lb ? lbKg(+lb[1].replace(",", ".")) : undefined;
}
const near = (a: number, b: number) => Math.abs(a - b) <= Math.max(0.06, b * 0.025);

// The best catalogue entry for a product name or description read from a photo.
// Prefers brand + type + weight, then type + weight, then type. When the
// weight isn't a catalogue size, the type's entry is returned with that weight.
export function equipOf(text: string): Equip | undefined {
  const t = text.normalize("NFKC");
  if (!t.trim()) return undefined;
  const kg = kgIn(t);
  const brands = new Set(Object.values(BR).filter((b) => b.re.test(t)).map((b) => b.b));
  const toks = new Set(words(t));
  const typeScore = new Map<string, number>();
  for (const d of DEFS) {
    const m = t.match(d.re);
    if (!m) continue;
    let s = m[0].length;
    if (d.q) { if (!d.q.test(t)) continue; s += 8; }
    typeScore.set(d.t, s);
  }
  const groupHit = new Set(DEFS.filter((d) => typeScore.has(d.t)).map((d) => d.grp));
  let best: Rec | undefined, bestScore = -Infinity;
  for (const r of RECS) {
    const e = r.e;
    const ts = typeScore.get(e.type);
    let mScore = 0;
    if (r.model && e.brand && brands.has(e.brand)) {
      // Words with a digit or 5+ letters ("552", "selecttech") say more than "red" or "pro".
      const wt = (w: string) => (/\d/.test(w) || w.length >= 5 ? 2 : 1);
      const all = r.model.reduce((a, w) => a + wt(w), 0);
      const hit = r.model.reduce((a, w) => a + (toks.has(w) ? wt(w) : 0), 0);
      // A colour or size word alone isn't the model: need its first word or a number.
      const key = r.model.some((w, i) => toks.has(w) && (i === 0 || /\d/.test(w)));
      mScore = key ? (hit / all) * 80 : 0;
    }
    const sameGroup = !ts && groupHit.has(r.d.grp);
    if (!ts && mScore < 40 && !(sameGroup && e.brand && brands.has(e.brand))) continue;
    let s = ts ? 20 + ts : sameGroup ? 12 : 0;
    s += mScore;
    if (e.brand) s += brands.has(e.brand) ? 100 : -25;
    if (kg !== undefined && e.kg !== undefined) s += near(kg, e.kg) ? 50 : -40;
    let overlap = 0;
    for (const w of r.toks) if (toks.has(w)) overlap++;
    for (const w of r.ja) if (toks.has(w)) overlap++;
    s += overlap * 3 - (r.toks.size - [...r.toks].filter((w) => toks.has(w)).length) * 0.5;
    if (s > bestScore) { bestScore = s; best = r; }
  }
  if (!best) return undefined;
  const e = best.e;
  const weighted = !!(best.d.kg || best.d.lb || best.d.w);
  if (kg !== undefined && weighted && (e.kg === undefined || !near(kg, e.kg)) && !/\(up to/.test(e.name)) {
    const k = +kg.toFixed(3);
    return { ...e, name: `${e.name.replace(/\s+\d+(\.\d+)?\s*(kg|lb).*$/i, "")} ${num(k)} kg`, ja: e.ja && `${e.ja.replace(/\s+\d.*$/, "")} ${num(k)}kg`, kg: k };
  }
  if (!e.brand && brands.size === 1) return { ...e, brand: [...brands][0] };
  return e;
}

/** A typed list of gear, one thing per line: "Dumbbell 10kg each, item 2", "kettlebell 20kg",
 *  "push up bars set of 2". Gives each line's name (from the list when known), how many and kg each. */
type GearLine = { name: string; qty?: number; kg?: number };
export function parseGear(text: string): GearLine[] {
  return text.normalize("NFKC").split(/\n|;/).map((raw): GearLine | null => {
    const line = raw.replace(/^\s*(?:[-•*]|\d+[.)])\s+/, "").trim();
    if (!line) return null;
    const n = /(?:item|items|x|×|set\s*of|qty|pcs?)\s*:?\s*(\d+)|(\d+)\s*(?:pcs|pieces|items?|個|本|台)\b/i.exec(line);
    const qty = n ? Number(n[1] ?? n[2]) : undefined;
    const each = /(\d+(?:\.\d+)?)\s*kg\s*each/i.exec(line);
    const lb = /(\d+(?:\.\d+)?)\s*(?:-\s*)?(?:lb|lbs|pound)/i.exec(line);
    const kg = each ? Number(each[1]) : (/total/i.test(line) ? undefined : kgIn(line)) || (lb ? Math.round(Number(lb[1]) * 0.4536 * 10) / 10 : undefined);
    const e = equipOf(line);
    const name = e?.name ?? line.replace(/\b(item|items|qty|set of|total|each)\b.*$/i, "").replace(/[,:]+\s*$/, "").trim();
    // "10 kg each" alone says how heavy, not what it is.
    return name.replace(/[\d.,\s]|kg|lbs?|each|total/gi, "").length >= 3 ? { name, qty, kg: kg || e?.kg } : null;
  }).filter((x): x is GearLine => !!x);
}
