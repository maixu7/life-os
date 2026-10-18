// JLPT kanji: a built-in starter list for N5 and N4 (meaning and readings,
// ON in katakana / kun in hiragana), the hero's own added kanji for any
// level, daily picks, and the next JLPT test date.

export type Level = "N5" | "N4" | "N3" | "N2" | "N1";
export const LEVELS: Level[] = ["N5", "N4", "N3", "N2", "N1"];
export type Kanji = { k: string; m: string; r: string; level: Level; own?: boolean };

const N5 = `日|day, sun|ニチ・ジツ / ひ・か;一|one|イチ / ひと(つ);二|two|ニ / ふた(つ);三|three|サン / みっ(つ);四|four|シ / よん・よっ(つ);五|five|ゴ / いつ(つ);六|six|ロク / むっ(つ);七|seven|シチ / なな(つ);八|eight|ハチ / やっ(つ);九|nine|キュウ・ク / ここの(つ);十|ten|ジュウ / とお;百|hundred|ヒャク;千|thousand|セン / ち;万|ten thousand|マン・バン;円|yen, circle|エン / まる(い);人|person|ジン・ニン / ひと;口|mouth|コウ / くち;目|eye|モク / め;耳|ear|ジ / みみ;手|hand|シュ / て;足|foot, enough|ソク / あし・た(りる);山|mountain|サン / やま;川|river|セン / かわ;田|rice field|デン / た;天|heaven, sky|テン / あま;気|spirit, air|キ・ケ;雨|rain|ウ / あめ;空|sky, empty|クウ / そら・あ(く);花|flower|カ / はな;月|month, moon|ゲツ・ガツ / つき;火|fire, Tuesday|カ / ひ;水|water, Wednesday|スイ / みず;木|tree, Thursday|モク・ボク / き;金|gold, money, Friday|キン / かね;土|soil, Saturday|ド・ト / つち;年|year|ネン / とし;時|time, hour|ジ / とき;分|minute, part|フン・ブン / わ(かる);半|half|ハン / なか(ば);午|noon|ゴ;今|now|コン / いま;毎|every|マイ;週|week|シュウ;曜|weekday|ヨウ;先|ahead, previous|セン / さき;前|before, front|ゼン / まえ;後|after, behind|ゴ・コウ / あと・うし(ろ);間|interval, between|カン・ケン / あいだ・ま;上|up, above|ジョウ / うえ・あ(がる);下|down, below|カ・ゲ / した・さ(がる);中|middle, inside|チュウ / なか;外|outside|ガイ / そと;右|right|ウ・ユウ / みぎ;左|left|サ / ひだり;東|east|トウ / ひがし;西|west|セイ・サイ / にし;南|south|ナン / みなみ;北|north|ホク / きた;大|big|ダイ・タイ / おお(きい);小|small|ショウ / ちい(さい);高|tall, expensive|コウ / たか(い);安|cheap, safe|アン / やす(い);長|long, chief|チョウ / なが(い);新|new|シン / あたら(しい);古|old|コ / ふる(い);多|many|タ / おお(い);少|few, a little|ショウ / すく(ない)・すこ(し);白|white|ハク / しろ(い);明|bright|メイ / あか(るい);本|book, origin|ホン / もと;学|study|ガク / まな(ぶ);校|school|コウ;生|life, birth|セイ・ショウ / い(きる)・う(まれる);国|country|コク / くに;語|word, language|ゴ / かた(る);名|name|メイ・ミョウ / な;子|child|シ / こ;女|woman|ジョ / おんな;男|man|ダン・ナン / おとこ;父|father|フ / ちち;母|mother|ボ / はは;友|friend|ユウ / とも;会|meet|カイ / あ(う);社|company, shrine|シャ / やしろ;店|shop|テン / みせ;駅|station|エキ;道|road, way|ドウ / みち;車|car|シャ / くるま;電|electricity|デン;何|what|カ / なに・なん;行|go|コウ・ギョウ / い(く);来|come|ライ / く(る);出|exit, go out|シュツ / で(る)・だ(す);入|enter|ニュウ / い(る)・はい(る);見|see|ケン / み(る);聞|hear, ask|ブン / き(く);言|say|ゲン / い(う);話|talk|ワ / はな(す);読|read|ドク / よ(む);書|write|ショ / か(く);食|eat|ショク / た(べる);飲|drink|イン / の(む);買|buy|バイ / か(う);休|rest|キュウ / やす(む);立|stand|リツ / た(つ);魚|fish|ギョ / さかな`;

const N4 = `同|same|ドウ / おな(じ);事|thing, matter|ジ / こと;自|oneself|ジ・シ / みずか(ら);発|depart, emit|ハツ;者|person (-er)|シャ / もの;地|ground|チ・ジ;業|business|ギョウ;方|direction, way|ホウ / かた;場|place|ジョウ / ば;員|member|イン;開|open|カイ / あ(ける)・ひら(く);力|power|リョク・リキ / ちから;問|question|モン / と(う);代|generation, fee|ダイ / か(わる)・よ;動|move|ドウ / うご(く);京|capital|キョウ;通|pass, commute|ツウ / とお(る)・かよ(う);理|reason, logic|リ;体|body|タイ / からだ;主|main, master|シュ / おも・ぬし;題|topic|ダイ;意|meaning, mind|イ;不|not, un-|フ・ブ;作|make|サク / つく(る);用|use, errand|ヨウ / もち(いる);度|degree, times|ド / たび;強|strong|キョウ / つよ(い);公|public|コウ / おおやけ;持|hold|ジ / も(つ);野|field|ヤ / の;以|since, by means of|イ;思|think|シ / おも(う);家|house|カ・ケ / いえ・や;世|world, generation|セ・セイ / よ;正|correct|セイ・ショウ / ただ(しい);院|institution|イン;心|heart|シン / こころ;界|world, boundary|カイ;教|teach|キョウ / おし(える);文|writing, sentence|ブン・モン / ふみ;元|origin|ゲン・ガン / もと;重|heavy|ジュウ / おも(い)・かさ(ねる);近|near|キン / ちか(い);考|consider|コウ / かんが(える);画|picture, stroke|ガ・カク;海|sea|カイ / うみ;売|sell|バイ / う(る);知|know|チ / し(る);集|gather|シュウ / あつ(める);別|separate|ベツ / わか(れる);物|thing|ブツ・モツ / もの;使|use|シ / つか(う);品|goods|ヒン / しな;計|measure, plan|ケイ / はか(る);死|death|シ / し(ぬ);特|special|トク;私|I, private|シ / わたし;始|begin|シ / はじ(める);朝|morning|チョウ / あさ;運|carry, luck|ウン / はこ(ぶ);終|end|シュウ / お(わる);台|stand, counter for machines|ダイ・タイ;広|wide|コウ / ひろ(い);住|live, reside|ジュウ / す(む);真|true|シン / ま;有|have, exist|ユウ / あ(る);町|town|チョウ / まち;料|fee, materials|リョウ;工|craft, construction|コウ・ク;建|build|ケン / た(てる);急|hurry|キュウ / いそ(ぐ);止|stop|シ / と(まる);送|send|ソウ / おく(る);切|cut|セツ / き(る);転|turn, roll|テン / ころ(ぶ);研|polish, study|ケン / と(ぐ);究|research|キュウ / きわ(める);楽|fun, music|ガク・ラク / たの(しい);起|wake up|キ / お(きる);着|arrive, wear|チャク / き(る)・つ(く);病|illness|ビョウ / やまい;質|quality|シツ;待|wait|タイ / ま(つ);試|try, test|シ / ため(す);族|family, tribe|ゾク;銀|silver|ギン;早|early|ソウ / はや(い);映|reflect, project|エイ / うつ(る);親|parent, intimate|シン / おや・した(しい);験|test, verify|ケン;英|England, excellent|エイ;医|doctor, medicine|イ;仕|serve, do|シ / つか(える);去|leave, past|キョ / さ(る);味|taste|ミ / あじ;写|copy, photo|シャ / うつ(す);字|character, letter|ジ / あざ;答|answer|トウ / こた(える);夜|night|ヤ / よる;音|sound|オン / おと;注|pour, attention|チュウ / そそ(ぐ);帰|return home|キ / かえ(る);歌|song|カ / うた;悪|bad|アク / わる(い);図|map, drawing|ズ・ト / はか(る);室|room|シツ / むろ;歩|walk|ホ / ある(く);風|wind, style|フウ / かぜ;紙|paper|シ / かみ;黒|black|コク / くろ(い);春|spring|シュン / はる;夏|summer|カ / なつ;秋|autumn|シュウ / あき;冬|winter|トウ / ふゆ;赤|red|セキ / あか(い);青|blue|セイ / あお(い);色|colour|ショク / いろ;館|large building|カン;屋|shop, roof|オク / や;走|run|ソウ / はし(る);習|learn|シュウ / なら(う);洋|ocean, Western|ヨウ;旅|travel|リョ / たび;服|clothes|フク;夕|evening|セキ / ゆう;晩|night, evening|バン;昼|daytime, noon|チュウ / ひる;借|borrow|シャク / か(りる);貸|lend|タイ / か(す);肉|meat|ニク;堂|hall|ドウ;鳥|bird|チョウ / とり;飯|meal, rice|ハン / めし;勉|effort|ベン;茶|tea|チャ・サ;牛|cow|ギュウ / うし;犬|dog|ケン / いぬ;兄|older brother|ケイ・キョウ / あに;弟|younger brother|ダイ・テイ / おとうと;姉|older sister|シ / あね;妹|younger sister|マイ / いもうと;漢|Han (China)|カン;光|light|コウ / ひかり;低|low|テイ / ひく(い);暗|dark|アン / くら(い);軽|light (weight)|ケイ / かる(い);短|short|タン / みじか(い);寒|cold|カン / さむ(い);暑|hot (weather)|ショ / あつ(い);引|pull|イン / ひ(く);島|island|トウ / しま;池|pond|チ / いけ;林|grove|リン / はやし;森|forest|シン / もり`;

const parse = (s: string, level: Level): Kanji[] => s.split(";").map((x) => { const [k, m, r] = x.split("|"); return { k, m, r: r ?? "", level }; });
export const BUILT_IN: Kanji[] = [...parse(N5, "N5"), ...parse(N4, "N4")];

// Everything to learn up to the goal level, easiest first. The hero's own
// kanji join their level's list (a built-in one with the same character wins).
export function studyList(goal: Level, own: Kanji[]): Kanji[] {
  const upTo = LEVELS.slice(0, LEVELS.indexOf(goal) + 1);
  const seen = new Set<string>();
  const out: Kanji[] = [];
  for (const lv of upTo) for (const k of [...BUILT_IN, ...own].filter((x) => x.level === lv)) if (!seen.has(k.k)) { seen.add(k.k); out.push(k); }
  return out;
}

// Today's kanji: the ones learned today stay on the card, then the next
// unknown ones until the daily count is reached.
export function dailyPicks(list: Kanji[], known: Set<string>, learnedToday: Set<string>, perDay: number): Kanji[] {
  const today = list.filter((k) => learnedToday.has(k.k));
  const next = list.filter((k) => !known.has(k.k)).slice(0, Math.max(0, perDay - today.length));
  return [...today, ...next];
}

// JLPT runs on the first Sunday of July and of December (Japan).
export function nextJlpt(now = new Date()): Date {
  for (let y = now.getFullYear(); ; y++) {
    for (const m of [6, 11]) {
      const d = new Date(y, m, 1);
      d.setDate(1 + ((7 - d.getDay()) % 7));
      if (d.getTime() + 86_400_000 > now.getTime()) return d;
    }
  }
}
