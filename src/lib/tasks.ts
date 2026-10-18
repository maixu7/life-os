// A big catalogue of everyday tasks, each judged as a good deed (builds you up),
// a bad deed (wastes time or harms you) or neutral (needed, but neither).
// `judge()` works for any typed text: catalogue match first, then keyword rules.

export type Deed = "good" | "bad" | "neutral";
export type TaskCat =
  | "chores" | "self care" | "health" | "fitness" | "learning" | "work" | "social" | "screen" | "food" | "money"
  | "errands" | "creative" | "mind" | "family" | "outdoors" | "faith" | "sleep" | "travel" | "pets" | "tech" | "bad habit";
export type TaskDef = { name: string; emoji: string; cat: TaskCat; deed: Deed; why: string; met?: number; minutes?: number };

// An item is a name, or [name, minutes, met].
type It = string | [string, number, number?];

const LIST: TaskDef[] = [];
const SEEN = new Set<string>();

function add(cat: TaskCat, deed: Deed, emoji: string, why: string, items: It[]) {
  for (const it of items) {
    const name = typeof it === "string" ? it : it[0];
    const minutes = typeof it === "string" ? undefined : it[1];
    const met = typeof it === "string" ? undefined : it[2];
    const key = name.toLowerCase();
    if (SEEN.has(key)) continue;
    SEEN.add(key);
    LIST.push({ name, emoji, cat, deed, why, ...(met ? { met } : {}), ...(minutes ? { minutes } : {}) });
  }
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const an = (s: string) => (/^[aeiou]/i.test(s) ? `an ${s}` : `a ${s}`);

// ───────────────────────────── Chores ─────────────────────────────
const TIDY = "A clean, tidy home lowers stress and keeps you healthy";
add("chores", "good", "🍽️", "Clean dishes keep the kitchen hygienic and calm", [
  ["Wash dishes", 15, 2.3], ["Dry dishes", 10, 2], ["Put away dishes", 5, 2], ["Load the dishwasher", 5, 2],
  ["Unload the dishwasher", 5, 2], ["Soak and scrub pots and pans", 15, 2.5], ["Wash the cutting board", 5, 2.3],
  ["Wash lunch boxes", 5, 2.3], ["Wash water bottles", 5, 2.3], ["Descale the kettle", 10, 2],
]);
add("chores", "good", "🧺", "Clean clothes and a tidy room lower stress", [
  ["Wash clothes by hand", 30, 3], ["Wash clothes (machine)", 10, 2], ["Hang laundry", 15, 2.3], ["Take in laundry", 10, 2],
  ["Fold laundry", 15, 2], ["Put away clothes", 10, 2], ["Iron shirts", 20, 1.8], ["Iron trousers", 15, 1.8],
  ["Wash bed sheets", 10, 2], ["Change bed sheets", 15, 2.5], ["Wash pillowcases", 5, 2], ["Wash towels", 10, 2],
  ["Wash school uniform", 15, 2.3], ["Wash work uniform", 15, 2.3], ["Wash socks by hand", 15, 3], ["Wash underwear by hand", 15, 3],
  ["Wash shoes", 20, 3], ["Wash sneakers", 20, 3], ["Wash curtains", 20, 2.5], ["Wash futon cover", 10, 2],
  ["Air out the futon", 10, 3], ["Dry the futon in the sun", 10, 3], ["Use the coin laundry", 60, 2], ["Sort laundry by colour", 5, 2],
  ["Remove a stain", 10, 2], ["Sew on a button", 10, 1.5], ["Mend torn clothes", 20, 1.5], ["Wash a jacket", 10, 2],
  ["Wash gym clothes", 10, 2], ["Wash the bath mat", 5, 2], ["Wash your bag", 15, 2.5], ["Polish shoes", 15, 2],
  ["Lint-roll clothes", 5, 2], ["Steam wrinkled clothes", 10, 2], ["Swap out seasonal clothes (koromogae)", 45, 2.5],
]);
add("chores", "good", "🧹", TIDY, [
  ["Clean the toilet", 15, 3.5], ["Scrub the toilet bowl", 10, 3.5], ["Clean the bathroom", 30, 3.5], ["Scrub the bathtub", 20, 3.5],
  ["Clean the shower", 15, 3.5], ["Remove mould in the bathroom", 30, 3.5], ["Clean the bathroom drain", 10, 3], ["Clean the bathroom mirror", 5, 2.5],
  ["Clean the bathroom sink", 10, 3], ["Clean the bathroom fan", 15, 3], ["Clean the kitchen", 30, 3.3], ["Wipe the kitchen counter", 5, 2.5],
  ["Clean the kitchen sink", 10, 3], ["Clean the stove", 15, 3], ["Degrease the range hood", 30, 3.5], ["Clean the microwave", 10, 2.5],
  ["Clean the oven", 30, 3.5], ["Clean the fridge", 30, 3], ["Defrost the freezer", 30, 3], ["Clean the rice cooker", 10, 2.3],
  ["Clean the toaster", 5, 2.3], ["Clean the kitchen drain", 10, 3], ["Wipe the kitchen tiles", 15, 3], ["Clean the kitchen cabinets", 20, 3],
  ["Clean the windows", 30, 3.2], ["Wipe the window sills", 10, 2.5], ["Clean the window tracks", 15, 3], ["Clean the mirrors", 10, 2.5],
  ["Vacuum the room", 20, 3.3], ["Vacuum the whole apartment", 40, 3.3], ["Vacuum the carpet", 15, 3.3], ["Vacuum the sofa", 10, 3.3],
  ["Vacuum the mattress", 10, 3.3], ["Vacuum the tatami", 15, 3.3], ["Vacuum the stairs", 15, 4], ["Vacuum the car", 20, 3.3],
  ["Sweep the floor", 15, 3.3], ["Sweep the entrance (genkan)", 5, 3.3], ["Sweep the balcony", 10, 3.3], ["Mop the floor", 20, 3.5],
  ["Mop the kitchen floor", 10, 3.5], ["Mop the bathroom floor", 10, 3.5], ["Wipe the tatami", 15, 3], ["Clean the balcony", 30, 3.5],
  ["Dust the room", 15, 2.5], ["Dust the shelves", 10, 2.5], ["Dust the TV and electronics", 10, 2.5], ["Dust the lamps", 5, 2.5],
  ["Dust the ceiling light", 10, 3], ["Clean the air conditioner filter", 20, 3], ["Clean the fan", 15, 2.5], ["Wipe the door handles", 5, 2.5],
  ["Wipe the light switches", 5, 2.5], ["Wipe the walls", 20, 3], ["Wipe the table", 5, 2.5], ["Wipe the desk", 5, 2.5],
  ["Clean the trash cans", 10, 3], ["Clean the washing machine", 15, 2.5], ["Clean the shoe rack", 10, 2.5], ["Clean the front door", 10, 3],
  ["Wipe your phone screen", 2, 1.5], ["Clean your keyboard", 10, 1.8], ["Clean your laptop", 10, 1.8], ["Clean your glasses", 2, 1.5],
  ["Wash the bicycle", 20, 3], ["Wash the car", 40, 3.5], ["Clean the fish grill", 10, 2.5], ["Clean the bed frame", 15, 2.5],
  ["Make the bed", 3, 2], ["Tidy the room", 15, 2.5], ["Tidy the desk", 10, 2], ["Tidy the kitchen", 10, 2.5],
  ["Tidy the living room", 15, 2.5], ["Tidy the entrance (genkan)", 5, 2.5], ["Organise the closet", 30, 2.5], ["Organise the drawers", 20, 2.3],
  ["Organise the bookshelf", 20, 2.3], ["Organise the kitchen cabinets", 30, 2.5], ["Organise the fridge", 15, 2.3], ["Organise your bag", 5, 1.8],
  ["Organise your wallet", 5, 1.5], ["Organise cables", 15, 2], ["Organise your study notes", 20, 1.5], ["Declutter the closet", 45, 2.5],
  ["Declutter the room", 45, 2.5], ["Declutter the desk", 15, 2.3], ["Declutter the kitchen", 30, 2.5], ["Throw away things you don't use", 30, 2.5],
  ["Rearrange the room", 60, 3.5], ["Assemble furniture", 60, 3], ["Change a light bulb", 5, 2], ["Fix a leaking tap", 20, 3],
  ["Unclog the drain", 15, 3], ["Tighten loose screws", 10, 2], ["Replace the shower head", 15, 2.5], ["Put up a shelf", 30, 3],
  ["Clean up after cooking", 10, 2.5], ["Clean up after a party", 30, 3], ["Spring cleaning (oosouji)", 180, 3.5], ["Five-minute tidy-up", 5, 2.5],
]);
add("chores", "good", "🗑️", "Proper garbage sorting keeps the home clean and neighbours happy", [
  ["Take out the trash", 5, 3], ["Take out burnable trash (moeru gomi)", 5, 3], ["Take out non-burnable trash", 5, 3],
  ["Take out plastic recycling", 5, 3], ["Take out cans and bottles", 5, 3], ["Take out PET bottles", 5, 3], ["Take out cardboard", 5, 3],
  ["Bundle old newspapers", 10, 2.5], ["Sort the garbage", 5, 2], ["Rinse recycling", 5, 2], ["Book oversized garbage pickup (sodai gomi)", 10],
  ["Throw away expired food", 10, 2],
]);
add("chores", "good", "🪴", "Caring for plants is calm, steady work that keeps the home alive", [
  ["Water the plants", 5, 2.5], ["Repot a plant", 20, 3], ["Fertilise the plants", 5, 2.5], ["Prune the plants", 15, 3],
  ["Weed the garden", 30, 4], ["Plant seeds", 15, 3], ["Harvest vegetables from the balcony garden", 10, 3], ["Mow the lawn", 40, 5.5],
  ["Rake leaves", 30, 4], ["Sweep the yard", 20, 3.5], ["Wipe plant leaves", 10, 2], ["Start a herb garden", 30, 3],
]);

// ───────────────────────────── Self care / health ─────────────────────────────
add("self care", "good", "🪥", "Small hygiene habits keep you healthy and confident", [
  ["Brush teeth (morning)", 3], ["Brush teeth (night)", 3], ["Floss", 3], ["Use mouthwash", 1], ["Clean your tongue", 1],
  ["Wash your face", 3], ["Skincare routine", 10], ["Apply sunscreen", 2], ["Moisturise", 2], ["Put on a face mask (sheet mask)", 15],
  ["Exfoliate", 5], ["Shave", 10], ["Trim your beard", 10], ["Trim nose hair", 3], ["Shape your eyebrows", 5],
  ["Get a haircut", 40], ["Wash your hair", 5], ["Condition your hair", 3], ["Style your hair", 5], ["Take a shower", 10, 2],
  ["Take a bath", 20, 1.5], ["Soak in a hot bath before bed", 20, 1.5], ["Cut fingernails", 5], ["Cut toenails", 5], ["Clean your ears", 3],
  ["Put on deodorant", 1], ["Put on clean clothes", 5], ["Pick tomorrow's outfit", 5], ["Apply lip balm", 1], ["Use hand cream", 1],
  ["Take care of your feet", 10], ["Clean contact lenses", 3], ["Change contact lenses", 3], ["Get dressed properly on a day off", 5],
  ["Wear perfume or cologne", 1], ["Wash your hands properly", 1], ["Gargle (ugai)", 1], ["Iron tomorrow's outfit", 10, 1.8],
  ["Go to a sento (public bath)", 60, 1.5], ["Visit an onsen", 90, 1.5], ["Get a massage", 60], ["Have a slow self-care evening", 60],
]);
add("health", "good", "💊", "Looking after your body now prevents bigger problems later", [
  ["Take vitamins", 1], ["Take medicine on time", 1], ["Take your vitamin D", 1], ["Check your weight", 2], ["Measure body fat", 2],
  ["Measure blood pressure", 3], ["Check resting heart rate", 2], ["Take your temperature", 2], ["Drink a glass of water", 1],
  ["Drink 2 litres of water", 1], ["Drink water right after waking up", 1], ["Rest your eyes (20-20-20 rule)", 1], ["Use eye drops", 1],
  ["Do eye exercises", 3], ["Fix your posture", 1], ["Stand up every hour", 2, 2], ["Get morning sunlight", 15, 2],
  ["No sugar today", 1], ["No caffeine after 2 pm", 1], ["Log your meals", 5], ["Count calories", 5], ["Eat a vegetable with every meal", 1],
  ["Eat fruit", 5], ["Eat a high-protein meal", 20], ["Eat a balanced breakfast", 15], ["Eat slowly and mindfully", 20],
  ["Stop eating at 80% full (hara hachi bu)", 1], ["See a doctor", 60], ["Book a doctor's appointment", 5], ["Go to the dentist", 60],
  ["Dental check-up and cleaning", 60], ["Annual health check (kenkō shindan)", 120], ["Get a flu shot", 30], ["Get vaccinated", 30],
  ["Eye test", 30], ["Do physiotherapy exercises", 20, 3], ["Ice an injury", 15], ["Take a rest day", 1], ["Rest when sick", 1],
  ["Wear a mask when sick", 1], ["Track your sleep", 2], ["Track your steps", 1], ["Check your skin for changes", 5],
  ["Refill your prescription", 15], ["Do a breast/testicular self-check", 5], ["Take allergy medicine", 1], ["Keep a symptoms diary", 5],
  ["Cut down on salt", 1], ["Swap soda for water", 1], ["Swap snacks for fruit", 1], ["Eat breakfast before class", 15],
]);

// ───────────────────────────── Fitness ─────────────────────────────
const MOVE = "Exercise builds strength, mood and discipline";
add("fitness", "good", "💪", MOVE, [
  ["Do push-ups", 10, 8], ["Do knee push-ups", 10, 5], ["Do diamond push-ups", 10, 8], ["Do pike push-ups", 10, 8],
  ["Do decline push-ups", 10, 8], ["Do pull-ups", 10, 8], ["Do chin-ups", 10, 8], ["Do negative pull-ups", 10, 6],
  ["Do dips", 10, 8], ["Do bench dips", 10, 5], ["Do squats", 10, 5], ["Do jump squats", 10, 8], ["Do pistol squats", 10, 6],
  ["Do sumo squats", 10, 5], ["Do lunges", 10, 4], ["Do walking lunges", 10, 5], ["Do Bulgarian split squats", 10, 5],
  ["Do step-ups", 10, 5], ["Do glute bridges", 10, 3.5], ["Do hip thrusts", 10, 5], ["Do calf raises", 10, 3],
  ["Do a wall sit", 5, 4], ["Hold a plank", 5, 4], ["Hold a side plank", 5, 4], ["Do sit-ups", 10, 3.8], ["Do crunches", 10, 3.8],
  ["Do leg raises", 10, 3.8], ["Do Russian twists", 10, 3.8], ["Do bicycle crunches", 10, 3.8], ["Do flutter kicks", 10, 3.8],
  ["Do mountain climbers", 10, 8], ["Do burpees", 10, 8], ["Do jumping jacks", 10, 7.7], ["Do high knees", 10, 8],
  ["Do bear crawls", 10, 8], ["Do superman holds", 5, 3], ["Do inverted rows", 10, 6], ["Practise handstands", 15, 5],
  ["Do L-sit holds", 10, 5], ["Do hollow body holds", 5, 4], ["Do dead hangs", 5, 3], ["Practise muscle-ups", 15, 8],
  ["Do bench press", 20, 6], ["Do incline bench press", 20, 6], ["Do deadlifts", 20, 6], ["Do Romanian deadlifts", 20, 6],
  ["Do barbell back squats", 20, 6], ["Do front squats", 20, 6], ["Do overhead press", 20, 6], ["Do barbell rows", 20, 6],
  ["Do dumbbell rows", 15, 5], ["Do lat pulldowns", 15, 5], ["Do seated cable rows", 15, 5], ["Do leg press", 15, 5],
  ["Do leg extensions", 10, 4], ["Do leg curls", 10, 4], ["Do bicep curls", 10, 3.5], ["Do hammer curls", 10, 3.5],
  ["Do tricep pushdowns", 10, 3.5], ["Do skull crushers", 10, 3.5], ["Do lateral raises", 10, 3.5], ["Do face pulls", 10, 3.5],
  ["Do chest flyes", 10, 3.5], ["Do cable crossovers", 10, 3.5], ["Do shrugs", 10, 3.5], ["Do kettlebell swings", 10, 9.8],
  ["Do goblet squats", 10, 5], ["Do Turkish get-ups", 10, 6], ["Do farmer's walks", 10, 6], ["Do battle ropes", 10, 10],
  ["Do box jumps", 10, 8], ["Do medicine ball slams", 10, 8], ["Resistance band workout", 20, 3.5], ["Grip strength training", 10, 3],
]);
add("fitness", "good", "🏋️", MOVE, [
  ["Full-body workout", 45, 6], ["Upper-body workout", 40, 5], ["Leg day workout", 45, 6], ["Chest and triceps workout", 45, 5],
  ["Back and biceps workout", 45, 5], ["Shoulder workout", 30, 5], ["Core workout", 20, 4], ["Ab workout", 15, 4],
  ["HIIT workout", 20, 8], ["Tabata session", 4, 9], ["7-minute workout", 7, 8], ["Home workout", 30, 5], ["Gym session", 60, 5.5],
  ["Calisthenics session", 45, 6], ["Circuit training", 30, 8], ["CrossFit class", 60, 8], ["Weightlifting session", 60, 6],
  ["Radio taiso (ラジオ体操)", 10, 4], ["Warm-up routine", 10, 3], ["Cool-down stretches", 10, 2.3],
]);
add("fitness", "good", "🧘", "Stretching and mobility keep you loose and prevent injury", [
  ["Morning stretching", 10, 2.3], ["Evening stretching", 10, 2.3], ["Full-body stretch", 15, 2.3], ["Hamstring stretches", 10, 2.3],
  ["Hip mobility routine", 15, 2.5], ["Shoulder mobility routine", 10, 2.5], ["Neck stretches", 5, 2], ["Wrist stretches", 5, 2],
  ["Back stretches", 10, 2.3], ["Foam rolling", 10, 2.5], ["Yoga session", 30, 3], ["Morning yoga", 20, 3], ["Power yoga", 45, 4],
  ["Pilates", 40, 3], ["Balance training", 15, 2.5], ["Posture exercises", 10, 2.5], ["Splits practice", 15, 2.5], ["Tai chi", 30, 3],
]);
add("fitness", "good", "🏃", MOVE, [
  ["Go for a run", 30, 9.8], ["Morning jog", 30, 7], ["Jog 3 km", 20, 7], ["Run 5 km", 30, 9.8], ["Run 10 km", 60, 9.8],
  ["Run a half marathon", 120, 10], ["Interval sprints", 20, 10], ["Run on the treadmill", 30, 9], ["Trail run", 45, 9],
  ["Hill sprints", 20, 10], ["Walk 30 minutes", 30, 3.5], ["Walk 10,000 steps", 90, 3.5], ["Brisk walk", 30, 4.3],
  ["Evening walk", 30, 3.5], ["Walk after dinner", 15, 3], ["Walk to the station instead of taking the bus", 15, 3.5],
  ["Take the stairs instead of the escalator", 5, 8], ["Get off one stop early and walk", 15, 3.5], ["Walk on the treadmill", 30, 3.5],
  ["Go cycling", 45, 7.5], ["Cycle 20 km", 60, 8], ["Stationary bike", 30, 7], ["Spin class", 45, 8.5], ["Swim laps", 30, 8],
  ["Swim 1 km", 40, 8], ["Aqua jogging", 30, 6], ["Skipping rope", 10, 11], ["Rowing machine", 20, 7], ["Elliptical trainer", 30, 5],
  ["Stair climber", 20, 9], ["Go hiking", 180, 6], ["Rock climbing", 90, 8], ["Bouldering", 90, 5.8], ["Skateboarding", 45, 5],
  ["Rollerblading", 45, 7], ["Surfing", 90, 3], ["Skiing", 180, 7], ["Snowboarding", 180, 5.3], ["Ice skating", 60, 7],
  ["Kayaking", 60, 5], ["Horse riding", 60, 5.5], ["Dance practice", 45, 6], ["Hip-hop dance class", 60, 7], ["Zumba", 45, 7],
]);
add("fitness", "good", "🥋", "Martial arts train body, focus and discipline together", [
  ["Kendo practice", 90, 8], ["Judo practice", 90, 10], ["Karate practice", 60, 10], ["Aikido practice", 60, 6],
  ["Boxing training", 60, 9], ["Kickboxing", 60, 10], ["Muay Thai training", 60, 10], ["Brazilian jiu-jitsu", 60, 8],
  ["Wrestling practice", 60, 6], ["Taekwondo", 60, 10], ["Kyudo (archery) practice", 60, 3.5], ["Shadow boxing", 15, 7],
  ["Hit the punching bag", 15, 8], ["Sumo practice", 60, 8],
]);
const BALL: [string, number][] = [
  ["football", 7], ["futsal", 8], ["basketball", 6.5], ["volleyball", 4], ["baseball", 5], ["softball", 5], ["tennis", 7.3],
  ["badminton", 5.5], ["table tennis", 4], ["rugby", 8.3], ["handball", 8], ["cricket", 4.8], ["hockey", 7.8],
  ["beach volleyball", 8], ["dodgeball", 5], ["ultimate frisbee", 8], ["squash", 7.3], ["soft tennis", 7],
];
add("fitness", "good", "⚽", "Sports build fitness, teamwork and friends", BALL.flatMap(([s, met]): It[] => [
  [`Play ${s}`, 60, met], [`${cap(s)} training`, 90, met], [`Practise ${s} drills`, 30, met],
]));
add("fitness", "good", "⛳", MOVE, [
  ["Golf practice at the driving range", 60, 3], ["Play a round of golf", 240, 4.8], ["Play catch", 20, 2.5], ["Kick a ball around", 20, 4],
  ["Shoot hoops", 30, 4.5],
]);
add("fitness", "neutral", "🎳", "Fun and a bit active, but mostly leisure", [["Go bowling", 90, 3], ["Play darts", 60, 2.5], ["Play billiards", 60, 2.5]]);

// ───────────────────────────── Learning ─────────────────────────────
const SUBJECTS = [
  "maths", "algebra", "calculus", "geometry", "statistics", "physics", "chemistry", "biology", "history", "Japanese history",
  "world history", "geography", "economics", "accounting", "business", "marketing", "finance", "law", "psychology", "philosophy",
  "sociology", "political science", "computer science", "data structures", "algorithms", "machine learning", "web development",
  "electronics", "engineering", "anatomy", "nursing", "pharmacology", "English grammar", "essay writing", "literature",
  "art history", "music theory", "astronomy", "earth science", "environmental science", "linear algebra", "probability",
];
const STUDY = "Steady study builds skills that pay off for life";
add("learning", "good", "📖", STUDY, SUBJECTS.flatMap((s): It[] => [
  [`Study ${s}`, 45], [`Revise ${s}`, 30], [`Do ${s} practice questions`, 30], [`Do ${s} homework`, 45],
  [`Watch ${an(s)} lecture`, 60], [`Make ${s} flashcards`, 20], [`Take ${an(s)} mock test`, 60], [`Take notes on ${s}`, 30],
  [`Attend ${s} class`, 90], [`Explain ${s} to a friend`, 20],
]));
const LANGS = [
  "Japanese", "English", "Korean", "Mandarin Chinese", "Spanish", "French", "German", "Italian", "Portuguese",
  "Russian", "Vietnamese", "Thai", "Indonesian", "Hindi", "Nepali", "Arabic", "Tagalog", "Turkish",
];
add("learning", "good", "🗣️", "A new language opens doors to people, work and culture", LANGS.flatMap((l): It[] => [
  [`Study ${l} vocabulary`, 20], [`Study ${l} grammar`, 30], [`${l} listening practice`, 20], [`${l} speaking practice`, 20],
  [`${l} reading practice`, 20], [`${l} writing practice`, 20], [`${l} shadowing practice`, 15], [`Do ${an(l)} Duolingo lesson`, 10],
  [`${l} lesson with a tutor`, 50], [`Watch a show in ${l} with subtitles`, 25], [`Review ${l} Anki cards`, 15],
]));
add("learning", "good", "🈴", "Japanese skills make daily life, work and friendships in Japan easier", [
  ["Study kanji", 20], ["Write kanji by hand", 20], ["Learn 10 new kanji", 20], ["Review kanji with WaniKani", 20],
  ["Practise hiragana", 10], ["Practise katakana", 10], ["Study keigo (polite Japanese)", 30], ["Study for JLPT N5", 45],
  ["Study for JLPT N4", 45], ["Study for JLPT N3", 45], ["Study for JLPT N2", 45], ["Study for JLPT N1", 45],
  ["Take a JLPT practice test", 120], ["Read NHK News Web Easy", 15], ["Read a Japanese graded reader", 20],
  ["Practise Japanese with a neighbour", 15], ["Go to a language exchange", 90], ["Practise ordering in Japanese", 10],
  ["Write a diary entry in Japanese", 15], ["Learn Japanese counters", 20], ["Practise Japanese pitch accent", 15],
  ["Study Japanese business phrases", 20], ["Write a nengajō (New Year card)", 20],
]);
add("learning", "good", "📚", "Reading grows knowledge, focus and imagination", [
  ["Read a novel", 30], ["Read a non-fiction book", 30], ["Read a biography", 30], ["Read a self-help book", 30],
  ["Read a history book", 30], ["Read a science book", 30], ["Read a philosophy book", 30], ["Read a business book", 30],
  ["Read a classic novel", 30], ["Read a Japanese novel", 30], ["Read a poetry book", 20], ["Read a textbook chapter", 40],
  ["Read a research paper", 40], ["Read the newspaper", 20], ["Read a news article", 10], ["Read for 30 minutes", 30],
  ["Read 10 pages", 15], ["Read before bed", 20], ["Finish a book", 60], ["Write a book summary", 20],
  ["Listen to an audiobook", 30], ["Listen to an educational podcast", 30], ["Borrow a book from the library", 20],
  ["Return library books", 15], ["Study at the library", 120], ["Visit a museum", 120], ["Visit an art gallery", 90],
  ["Watch a documentary", 60], ["Watch a TED talk", 15], ["Take an online course", 60], ["Do a Coursera lesson", 30],
  ["Learn something new on Khan Academy", 30], ["Study with the Pomodoro method", 25], ["Deep study block (90 min)", 90],
  ["Plan your study schedule", 15], ["Review today's lessons", 20], ["Prepare for tomorrow's class", 20],
  ["Prepare for an exam", 90], ["Take an exam", 120], ["Write an essay", 60], ["Write a research report", 90],
  ["Prepare a presentation", 60], ["Give a presentation", 15], ["Study a certification (e.g. IT Passport)", 45],
  ["Study for the driving licence test", 45], ["Learn to touch-type", 15], ["Practise typing speed", 10],
  ["Learn a new skill from a YouTube tutorial", 30], ["Memorise vocabulary on the train", 15], ["Ask the teacher a question", 5],
  ["Join a study group", 90], ["Attend a seminar", 90], ["Go to cram school (juku)", 120],
]);
add("learning", "neutral", "📖", "Fine for fun, but it builds little on its own", [["Read a light novel", 30], ["Read a magazine", 20], ["Read a web novel", 30]]);

// ───────────────────────────── Creative ─────────────────────────────
const INSTRUMENTS = ["guitar", "piano", "bass", "drums", "ukulele", "violin", "flute", "keyboard", "shamisen", "saxophone", "harmonica", "cello"];
add("creative", "good", "🎸", "Practising an instrument builds skill, patience and joy", INSTRUMENTS.flatMap((i): It[] => [
  [`Practise ${i}`, 30], [`Learn a new song on ${i}`, 45], [`Play scales on ${i}`, 15],
]));
add("creative", "good", "🎨", "Making things trains your eye, hands and patience", [
  ["Draw a sketch", 30], ["Daily drawing practice", 30], ["Draw from life", 45], ["Practise anatomy drawing", 45],
  ["Practise perspective drawing", 30], ["Paint with watercolour", 60], ["Paint with acrylics", 60], ["Digital painting", 60],
  ["Draw your own manga page", 90], ["Design a character", 60], ["Practise calligraphy (shodō)", 30], ["Fold origami", 20],
  ["Take photos on a walk", 60, 3], ["Edit photos", 30], ["Edit a video", 60], ["Write in a sketchbook", 20],
  ["Write a short story", 60], ["Write a poem", 20], ["Write a haiku", 10], ["Write a blog post", 45], ["Write a novel chapter", 90],
  ["Write song lyrics", 30], ["Compose music", 60], ["Make a beat", 45], ["Practise singing", 20], ["Voice training", 20],
  ["Learn 3D modelling", 60], ["Practise pixel art", 45], ["Knit", 30], ["Sew something", 45], ["Do embroidery", 30],
  ["Build a model kit (Gunpla)", 60], ["Do a craft project", 45], ["Practise magic tricks", 20], ["Make pottery", 90],
  ["Practise ikebana (flower arranging)", 45], ["Learn the tea ceremony", 90], ["Practise dance choreography", 45, 6],
  ["Brainstorm ideas in a notebook", 15], ["Finish a creative project", 60],
]);
add("creative", "neutral", "🖼️", "Sharing is fine; just don't get stuck chasing likes", [
  ["Post your art on social media", 10], ["Upload a video to YouTube", 15], ["Share photos with friends", 5],
]);

// ───────────────────────────── Mind / faith ─────────────────────────────
add("mind", "good", "🧘", "A calm, clear mind makes every other habit easier", [
  ["Meditate 10 minutes", 10], ["Meditate 20 minutes", 20], ["Breathing exercise", 5], ["Box breathing", 5], ["Body scan meditation", 15],
  ["Mindful walk", 20, 3], ["Sit in silence", 10], ["Write in your journal", 15], ["Write a gratitude list", 5],
  ["Reflect on the day", 10], ["Plan tomorrow", 10], ["Plan the week", 20], ["Weekly review", 30], ["Set goals for the month", 20],
  ["Review your goals", 15], ["Make a to-do list", 5], ["Do the hardest task first", 30], ["Write down your worries", 10],
  ["Say positive affirmations", 3], ["Visualise your goals", 5], ["Talk to a counsellor", 50], ["Digital detox hour", 60],
  ["Phone-free morning", 60], ["Social media detox day", 1], ["Leave your phone in another room", 1], ["Practise patience", 1],
  ["Forgive someone", 5], ["Let go of a grudge", 5], ["Spend time alone in nature", 30, 2.5], ["Read something inspiring", 10],
]);
add("faith", "good", "🙏", "Prayer and faith bring peace, gratitude and direction", [
  ["Morning prayer", 10], ["Evening prayer", 10], ["Pray before a meal", 1], ["Pray for family", 5], ["Pray at a shrine", 10],
  ["Visit a shrine", 30, 2.5], ["Visit a temple", 45, 2.5], ["Go to church", 90], ["Go to the mosque", 60], ["Go to the gurdwara", 60],
  ["Visit a Hindu temple", 60], ["Pray salah", 10], ["Pray Fajr on time", 10], ["Read the Bible", 20], ["Read the Quran", 20],
  ["Read the Bhagavad Gita", 20], ["Read Buddhist sutras", 20], ["Chant a mantra", 10], ["Do puja", 15], ["Light a candle and pray", 5],
  ["Attend a Bible study", 60], ["Fast for faith", 1], ["Give to charity", 5], ["Donate to a temple or church", 5], ["Thank God for the day", 2],
  ["Hatsumōde (first shrine visit of the year)", 60, 2.5], ["Zazen at a temple", 60], ["Sing in the choir", 60], ["Volunteer at your place of worship", 120, 2.5],
  ["Reflect on scripture", 10],
]);

// ───────────────────────────── Family / social ─────────────────────────────
const MEMBERS = ["mom", "dad", "grandma", "grandpa", "brother", "sister", "cousin", "aunt", "uncle"];
add("family", "good", "👨‍👩‍👦", "Staying close to family keeps you grounded and loved", MEMBERS.flatMap((m): It[] => [
  [`Call ${m}`, 15], [`Video call ${m}`, 20], [`Message ${m}`, 5], [`Visit ${m}`, 120], [`Buy a gift for ${m}`, 30],
  [`Send a birthday wish to ${m}`, 5], [`Help ${m} with something`, 30],
]));
add("family", "good", "🏠", "Helping at home shows care and builds trust", [
  ["Help parents with chores", 30, 3], ["Help parents with technology", 20], ["Cook for family", 60, 2.5], ["Eat dinner with family", 40],
  ["Send money home", 10], ["Send a letter home", 20], ["Send a parcel home", 30], ["Look after a younger sibling", 60],
  ["Help a sibling with homework", 30], ["Listen to your parents' advice", 15], ["Plan a family trip", 30], ["Celebrate a family birthday", 120],
  ["Tell your family you love them", 1], ["Visit your hometown", 1440], ["Share news with family", 10],
]);
add("family", "bad", "😠", "Fights at home hurt people you love and solve nothing", [
  ["Argue with parents", 20], ["Fight with siblings", 20], ["Ignore messages from family", 1], ["Skip a family call", 1],
]);
const CHATS = ["LINE", "WhatsApp", "Messenger", "Telegram", "Discord", "KakaoTalk", "WeChat", "Viber", "Signal", "Instagram DMs"];
add("family", "good", "💬", "A quick message keeps family and real friends close", CHATS.flatMap((a): It[] => [
  [`Message family on ${a}`, 10], [`Video call family on ${a}`, 20],
]));
add("social", "neutral", "💬", "Short chats keep friendships alive; fine in small doses", [
  ...CHATS.flatMap((a): It[] => [[`Chat with friends on ${a} (short)`, 15], [`Reply to messages on ${a}`, 10]]),
  ["Talk with friends on social media (short)", 15], ["Reply to messages", 10], ["Check messages", 5],
]);
add("social", "bad", "🌀", "Hours of chatting online eat the day and leave little behind", [
  ...CHATS.map((a): It => [`Chat for hours on ${a}`, 180]),
  ["Chat for hours on social media", 180], ["Group-chat all night", 240], ["Send memes for hours", 120], ["Hang out in Discord voice for hours", 240],
]);
add("social", "good", "🤝", "Real connection and helping others make life richer", [
  ["Meet a friend for coffee", 60], ["Have lunch with a coworker", 60], ["Make a new friend", 30], ["Say hello to your neighbours", 1],
  ["Help a friend move", 180, 4], ["Help a neighbour", 30, 2.5], ["Volunteer", 120, 3], ["Join a community clean-up", 90, 3.5],
  ["Pick up litter in the neighbourhood", 30, 3], ["Attend a club meeting", 60], ["Join a sports club", 90], ["Attend a meetup", 120],
  ["Host friends for dinner", 180], ["Write a thank-you message", 5], ["Apologise to someone", 5], ["Give someone a compliment", 1],
  ["Listen to a friend's problems", 30], ["Check on a friend who seems down", 15], ["Visit a sick friend", 60], ["Teach someone a skill", 45],
  ["Give up your seat on the train", 1], ["Help a tourist with directions", 5], ["Call an old friend", 20], ["Write a letter to a friend", 20],
  ["Send a postcard", 10], ["Donate clothes", 20], ["Donate blood", 60], ["Mentor a junior (kōhai)", 30], ["Congratulate a friend", 2],
  ["Keep a promise", 1],
]);
add("social", "neutral", "🎉", "Fun with people is healthy in balance", [
  ["Hang out with friends", 180], ["Go to karaoke", 120], ["Go on a date", 180], ["Go to a party", 180], ["Go to a nomikai (drinking party)", 150],
  ["Play board games with friends", 120], ["Go to a matsuri (festival)", 120, 2.5], ["Watch fireworks (hanabi)", 90], ["Go to a concert", 180],
  ["Go to the cinema with friends", 150], ["Go to a café", 60], ["Go to an anime convention", 240, 2.5], ["Go shopping with friends", 120, 2.5],
  ["Have a hanami picnic", 180, 2], ["Go to a BBQ", 180], ["Attend a wedding", 300], ["Attend a funeral", 180], ["Go to a sports game", 180],
]);
add("social", "bad", "🗯️", "It damages relationships and your own peace", [
  ["Gossip about people", 20], ["Ghost a friend", 1], ["Break a promise", 1], ["Lie to someone", 1], ["Get angry and shout", 5],
  ["Hold a grudge", 1], ["Be rude to a store clerk", 1], ["Cancel plans last minute for no reason", 1],
]);

// ───────────────────────────── Screen time ─────────────────────────────
const FEEDS = [
  "Instagram", "TikTok", "YouTube", "YouTube Shorts", "X (Twitter)", "Facebook", "Reddit", "Threads", "Snapchat",
  "Pinterest", "Twitch", "Tumblr", "Bilibili", "Niconico", "5channel", "Douyin", "Weibo", "BeReal",
];
const ARGUE = ["X (Twitter)", "Reddit", "Facebook", "YouTube", "Threads", "5channel", "Weibo"];
add("screen", "bad", "📱", "Endless scrolling eats hours and hurts focus", [
  ...FEEDS.flatMap((a): It[] => [[`Scroll ${a}`, 30], [`Scroll ${a} for hours`, 150], [`Scroll ${a} in bed`, 60]]),
  ...ARGUE.map((a): It => [`Argue in ${a} comments`, 45]),
  ["Scroll social media", 30], ["Scroll social media for hours", 150], ["Doom-scroll the news", 60], ["Watch Instagram Reels", 30],
  ["Watch Instagram Reels for hours", 120], ["Watch Facebook Reels", 30], ["Watch TikToks for hours", 150], ["Watch YouTube Shorts for hours", 120],
  ["Check notifications again and again", 30], ["Check your phone every few minutes", 60], ["Refresh likes on your post", 20],
  ["Watch reaction videos for hours", 120], ["Watch streamers for hours", 180], ["Watch Twitch streams all night", 300],
  ["Watch YouTube for hours", 180], ["Fall down a YouTube rabbit hole", 120], ["Browse memes for hours", 120],
  ["Compare yourself to others on social media", 30], ["Use your phone while walking (aruki-sumaho)", 10],
  ["Eat while scrolling", 30], ["Scroll during class", 30], ["Scroll at work", 30], ["Browse online shops for hours", 120],
  ["Read celebrity gossip online", 45], ["Watch prank videos", 60], ["Stalk an ex on social media", 30],
]);
add("screen", "neutral", "📲", "Quick and purposeful is fine; just put it down after", [
  ...FEEDS.map((a): It => [`Check ${a} quickly`, 5]),
  ...["Instagram", "TikTok", "X (Twitter)", "Facebook", "Threads", "Pinterest"].map((a): It => [`Post on ${a}`, 10]),
  ["Check social media quickly", 5], ["Watch one YouTube video", 15], ["Watch the news on TV", 20], ["Watch a movie", 120],
  ["Watch a movie at the cinema", 150], ["Watch a sports match on TV", 120], ["Listen to music", 30], ["Listen to a podcast for fun", 30],
  ["Watch a variety show", 60], ["Watch a J-drama episode", 50], ["Watch a K-drama episode", 60],
]);
add("screen", "good", "🛡️", "Taking control of your screen time frees hours for what matters", [
  ["Delete a time-wasting app", 2], ["Turn off notifications", 5], ["Set a screen time limit", 5], ["Put your phone on grayscale", 2],
  ["Log out of social media", 2], ["Keep screen time under 2 hours", 1], ["Unfollow accounts that waste your time", 10],
  ["Use a website blocker", 5], ["Charge your phone outside the bedroom", 1],
]);
const STREAM = ["Netflix", "Amazon Prime Video", "Disney+", "U-Next", "ABEMA", "Hulu", "Crunchyroll", "DMM TV", "d Anime Store", "TVer", "Apple TV+", "Lemino"];
add("screen", "bad", "📺", "Binge watching swallows whole evenings and sleep", [
  ...STREAM.map((s): It => [`Binge ${s}`, 240]),
  ["Binge a whole series in one day", 480], ["Binge anime all night", 360], ["Watch a full anime season in one day", 300],
  ["Rewatch an anime for the fifth time", 240], ["Watch anime clips on YouTube for hours", 150], ["Watch TV for hours", 180],
  ["Binge K-dramas", 300], ["Binge J-dramas", 300], ["Watch one more episode at 2 am", 30],
]);
add("screen", "neutral", "📺", "One episode is a fair break; stop there", [
  ...STREAM.map((s): It => [`Watch one episode on ${s}`, 25]),
  ["Watch one anime episode", 25], ["Watch an anime movie", 110], ["Read one manga chapter", 10], ["Watch the new episode of your favourite anime", 25],
]);
add("learning", "good", "🎌", "Using anime as study turns fun into Japanese practice", [
  ["Watch anime with Japanese subtitles (study)", 25], ["Read manga in Japanese with a dictionary", 30], ["Mine vocabulary from anime", 20],
]);
const MANGA_APPS = ["Shōnen Jump+", "Piccoma", "LINE Manga", "Magazine Pocket", "Kindle"];
add("screen", "bad", "🍥", "Manga binges eat hours that could build your future", [
  ...MANGA_APPS.map((a): It => [`Read manga on ${a} for hours`, 150]),
  ["Read manga for hours", 150], ["Binge a whole manga series", 300], ["Read manga until late at night", 180], ["Read webtoons for hours", 150],
]);
const GAMES = [
  "Genshin Impact", "Honkai: Star Rail", "Zenless Zone Zero", "Fortnite", "Valorant", "Apex Legends", "Minecraft", "Pokémon",
  "League of Legends", "Call of Duty", "EA Sports FC", "Monster Hunter", "Elden Ring", "Uma Musume", "Blue Archive",
  "Fate/Grand Order", "Puzzle & Dragons", "Splatoon", "Super Smash Bros.", "Mario Kart", "Zelda", "Animal Crossing",
  "Final Fantasy", "Dragon Quest", "Persona", "Street Fighter", "Tekken", "Roblox", "PUBG", "Clash Royale", "Overwatch",
  "Counter-Strike 2", "Dota 2", "Monster Strike", "Pokémon GO", "Marvel Rivals", "Wuthering Waves", "Arknights",
];
const GACHA = [
  "Genshin Impact", "Honkai: Star Rail", "Zenless Zone Zero", "Uma Musume", "Blue Archive", "Fate/Grand Order", "Puzzle & Dragons",
  "Monster Strike", "Wuthering Waves", "Arknights",
];
add("screen", "bad", "🎮", "Hours of gaming eat time, sleep and money", [
  ...GAMES.map((g): It => [`Play ${g} for hours`, 180]),
  ...GACHA.flatMap((g): It[] => [[`Spend money on ${g} gacha`, 10], [`Grind ${g} dailies`, 45]]),
  ["Game all night", 480], ["Play video games for hours", 180], ["Play mobile games for hours", 120], ["Gaming marathon", 360],
  ["Play ranked until 3 am", 240], ["Grind levels for hours", 180], ["Watch gaming videos for hours", 150], ["Skip sleep to play games", 240],
]);
add("screen", "neutral", "🎮", "A short session is a fair break; keep it short", [
  ...GAMES.map((g): It => [`Play ${g} (short session)`, 30]),
  ["Play a game for 30 minutes", 30], ["Play a board game", 60], ["Do a crossword", 20], ["Do a sudoku", 15], ["Play shogi", 45],
  ["Play chess", 30], ["Play go (igo)", 45], ["Play mahjong", 90],
]);
add("fitness", "good", "🕹️", "Active games still get you moving", [["Play Ring Fit Adventure", 30, 4.5], ["Play Just Dance", 30, 5], ["Play VR fitness games", 30, 6]]);

// ───────────────────────────── Food ─────────────────────────────
const COOK = "Home cooking is cheaper and healthier than eating out";
add("food", "good", "🍳", COOK, [
  ["Cook rice", 40, 2], ["Make miso soup", 15, 2.5], ["Make onigiri", 15, 2], ["Make a bento", 30, 2.5], ["Cook curry rice", 60, 2.5],
  ["Make oyakodon", 25, 2.5], ["Make katsudon", 40, 2.5], ["Make gyūdon", 25, 2.5], ["Make tamagoyaki", 15, 2.5], ["Make omurice", 30, 2.5],
  ["Make yakisoba", 20, 2.5], ["Make okonomiyaki", 30, 2.5], ["Make takoyaki", 45, 2.5], ["Cook udon", 15, 2.5], ["Cook soba", 15, 2.5],
  ["Make ramen from scratch", 180, 2.5], ["Make gyoza", 60, 2.5], ["Make nikujaga", 45, 2.5], ["Make karaage", 40, 2.5],
  ["Make tonkatsu", 45, 2.5], ["Make tempura", 45, 2.5], ["Make sukiyaki", 40, 2.5], ["Make shabu-shabu", 30, 2.5],
  ["Make nabe (hot pot)", 40, 2.5], ["Make teriyaki chicken", 30, 2.5], ["Grill salmon", 20, 2.5], ["Grill mackerel (saba)", 20, 2.5],
  ["Make chawanmushi", 40, 2.5], ["Make hiyayakko", 5, 2], ["Make a salad", 15, 2.5], ["Make a vegetable stir-fry", 20, 2.5],
  ["Make fried rice", 20, 2.5], ["Make dal bhat", 60, 2.5], ["Make chicken curry", 60, 2.5], ["Make momo", 90, 2.5],
  ["Make chapati", 30, 2.5], ["Make pasta", 25, 2.5], ["Make spaghetti bolognese", 45, 2.5], ["Make vegetable soup", 40, 2.5],
  ["Make okayu (rice porridge)", 30, 2.5], ["Make oatmeal", 10, 2], ["Make scrambled eggs", 10, 2.5], ["Boil eggs", 12, 2],
  ["Make an omelette", 10, 2.5], ["Make pancakes", 25, 2.5], ["Make a sandwich", 10, 2], ["Make a smoothie", 5, 2],
  ["Make a protein shake", 3, 2], ["Bake bread", 180, 2.5], ["Bake a cake", 90, 2.5], ["Bake cookies", 60, 2.5],
  ["Make pizza at home", 60, 2.5], ["Make tacos", 40, 2.5], ["Make mapo tofu", 25, 2.5], ["Make kimchi fried rice", 20, 2.5],
  ["Make bibimbap", 40, 2.5], ["Make pho", 90, 2.5], ["Make pad thai", 30, 2.5], ["Make a stew", 90, 2.5],
  ["Make hamburg steak", 40, 2.5], ["Make natto rice", 5, 2], ["Make zaru soba", 15, 2.5], ["Make tofu steak", 20, 2.5],
  ["Roast sweet potatoes", 60, 2], ["Steam vegetables", 15, 2.5], ["Make chicken soup", 60, 2.5], ["Make egg fried rice", 15, 2.5],
  ["Make mugicha (barley tea)", 5, 2], ["Brew coffee at home", 5, 2], ["Make green tea", 5, 2], ["Make milk tea", 5, 2],
  ["Make chai", 10, 2], ["Make a healthy breakfast", 15, 2.5], ["Meal prep for the week", 120, 3], ["Pack lunch for tomorrow", 15, 2.5],
  ["Plan meals for the week", 20], ["Cook for friends", 90, 2.5], ["Try a new recipe", 60, 2.5], ["Cook with leftovers", 20, 2.5],
  ["Cut and wash vegetables", 15, 2.5], ["Marinate meat for tomorrow", 10, 2.5], ["Make pickles (tsukemono)", 20, 2.5],
  ["Make homemade sauce", 20, 2.5],
]);
add("food", "neutral", "🍽️", "Eating is necessary; it is what and how much that matters", [
  ["Eat breakfast", 15], ["Eat lunch", 30], ["Eat dinner", 30], ["Have a snack", 5], ["Eat at the school cafeteria", 30],
  ["Eat at the company cafeteria", 30], ["Eat a combini bento", 15], ["Eat at Yoshinoya", 20], ["Eat at Matsuya", 20], ["Eat at Sukiya", 20],
  ["Eat at Saizeriya", 45], ["Eat ramen at a shop", 30], ["Eat conveyor-belt sushi", 45], ["Eat at a family restaurant", 60],
  ["Eat at a teishoku restaurant", 40], ["Eat fast food", 20], ["Eat at McDonald's", 20], ["Order delivery (Uber Eats / Demae-can)", 40],
  ["Eat out with friends", 90], ["Have coffee", 10], ["Drink tea", 10], ["Eat dessert", 10], ["Have a drink with dinner", 30],
  ["Eat leftovers", 15], ["Eat an onigiri on the go", 5], ["Eat instant noodles", 10], ["Drink a canned coffee", 5],
]);
add("food", "good", "🥗", "Good food is fuel; it shows in your energy and mood", [
  ["Eat vegetables", 10], ["Eat a salad", 15], ["Eat a home-cooked meal", 30], ["Drink milk", 2], ["Eat yoghurt", 5], ["Eat natto", 5],
  ["Eat fish", 20], ["Eat nuts instead of chips", 5], ["Drink green tea instead of soda", 5], ["Eat a fruit for dessert", 5],
]);

// ───────────────────────────── Money / errands / work ─────────────────────────────
const BILLS = [
  "rent", "electricity bill", "gas bill", "water bill", "phone bill", "internet bill", "NHK fee", "national health insurance",
  "national pension", "resident tax", "credit card bill", "student loan", "gym membership", "school fees",
];
add("money", "good", "💴", "Paying on time avoids late fees and stress", BILLS.map((b): It => [`Pay the ${b}`, 10]));
add("money", "good", "💰", "Knowing and growing your money gives you freedom", [
  ["Check your bank balance", 3], ["Make a budget", 30], ["Track today's expenses", 5], ["Log receipts in a budgeting app", 10],
  ["Write in your household account book (kakeibo)", 10], ["Review subscriptions", 15], ["Cancel an unused subscription", 5], ["Save money", 1],
  ["Transfer money to savings", 5], ["Invest in NISA", 15], ["Contribute to iDeCo", 10], ["Read about investing", 30],
  ["Build an emergency fund", 5], ["Compare prices before buying", 10], ["Use coupons and points", 5], ["Buy half-price stickers at the supermarket", 10],
  ["Sell unused stuff on Mercari", 30], ["Sell books to a used bookshop", 30], ["No-spend day", 1], ["Repay a friend", 5],
  ["File your tax return (kakutei shinkoku)", 120], ["Check your pay slip", 5], ["Set a savings goal", 10], ["Review last month's spending", 20],
  ["Switch to a cheaper phone plan", 30], ["Pack lunch to save money", 15, 2.5], ["Bring your own water bottle", 1], ["Check your credit card statement", 10],
  ["Save loose coins", 2], ["Plan a big purchase carefully", 20],
]);
add("money", "bad", "💸", "Money spent on impulse or chance is money and future lost", [
  ["Impulse buy online", 10], ["Late-night online shopping", 60], ["Buy things you don't need", 20], ["Spend money on gacha", 10],
  ["Spend your whole paycheck", 1], ["Borrow money for fun", 5], ["Pay a late fee", 5], ["Buy lottery tickets", 10],
  ["Spend too much at the combini", 10], ["Buy merch you'll never use", 15], ["Order delivery out of laziness", 40], ["Bet on horse racing", 120],
  ["Gamble online", 120], ["Play pachinko", 180], ["Play pachislot", 180], ["Bet on sports", 60],
]);
add("errands", "neutral", "🏃", "Necessary life admin; it has to get done", [
  ["Go to the ward office (区役所)", 60], ["Register your address at the ward office", 60], ["Get a residence certificate (jūminhyō)", 30],
  ["Renew your residence card", 120], ["Visit the immigration bureau", 180], ["Apply for a visa extension", 180], ["Apply for a My Number card", 60],
  ["Go to the post office", 20], ["Send a parcel", 20], ["Request redelivery of a package", 5], ["Send a letter", 10], ["Buy stamps", 10],
  ["Go to the bank", 30], ["Withdraw cash at the ATM", 10], ["Deposit cash", 10], ["Pay bills at the combini", 10], ["Go to the combini", 10],
  ["Buy groceries at the supermarket", 40, 2.3], ["Buy essentials at the drugstore", 20, 2.3], ["Shop at the 100-yen shop", 30, 2.3],
  ["Shop at Don Quijote", 45, 2.3], ["Buy household items at the home centre", 45, 2.3], ["Buy clothes at Uniqlo", 45, 2.3], ["Buy new shoes", 45, 2.3],
  ["Buy stationery", 20], ["Buy a gift", 30], ["Return an item", 20], ["Drop off dry cleaning", 10], ["Pick up dry cleaning", 10],
  ["Go to the pharmacy", 20], ["Pick up a prescription", 20], ["Top up your Suica / PASMO", 3], ["Buy a commuter pass (teiki)", 15],
  ["Renew your phone contract", 60], ["Visit the phone shop", 60], ["Get your phone repaired", 60], ["Get your bicycle repaired", 30],
  ["Register your bicycle (bōhan tōroku)", 20], ["Recycle old electronics", 30], ["Pick up a package at the combini", 10],
  ["Order groceries online", 20], ["Book a haircut", 5], ["Fill in forms", 20], ["Send documents", 20], ["Print documents at the combini", 10],
  ["Make photocopies", 10], ["Get ID photos taken", 10], ["Renew your passport", 60], ["Buy a SIM card", 30], ["Change your address on documents", 30],
  ["Buy a train ticket", 5], ["Buy rice", 15], ["Restock toilet paper", 15], ["Restock detergent and soap", 15], ["Buy vegetables at the market", 30, 2.3],
  ["Make a shopping list", 5], ["Book a restaurant", 5], ["Renew your driving licence", 120], ["Pay a parking fee", 5], ["Buy pet food", 15],
  ["Go to the electronics store", 60, 2.3], ["Buy furniture", 90, 2.3], ["Go to the dry cleaner", 15], ["Make a hospital appointment", 5],
]);
const SHIFTS = [
  "combini", "restaurant", "izakaya", "café", "warehouse", "factory", "hotel", "supermarket", "drugstore", "ramen shop",
  "sushi restaurant", "fast food restaurant", "cram school", "event venue", "construction site",
];
add("work", "good", "💼", "Work earns money, builds skills and keeps you reliable", [
  ...SHIFTS.map((s): It => [`Work a shift at the ${s}`, 300, 2.5]),
  ["Deliver for Uber Eats by bike", 180, 7], ["Go to work", 480], ["Arrive at work early", 1], ["Finish a task ahead of time", 60],
  ["Answer work emails", 30], ["Clear your inbox", 30], ["Attend a meeting", 60], ["Write a report", 60], ["Plan your work day", 10],
  ["Deep work block (90 min)", 90], ["Focus session (Pomodoro)", 25], ["Learn a new work skill", 45], ["Ask your senior (senpai) for feedback", 10],
  ["Help a coworker", 20], ["Write a daily report (nippō)", 15], ["Prepare for a meeting", 20], ["Update your resume", 45],
  ["Write a rirekisho (Japanese CV)", 60], ["Apply for jobs", 60], ["Practise for a job interview", 45], ["Go to a job interview", 90],
  ["Visit Hello Work", 90], ["Update your LinkedIn", 20], ["Network at an event", 120], ["Study for a work certification", 60],
  ["Ask for a raise", 15], ["Organise your work files", 20], ["Send an invoice", 10], ["Work on a side business", 90],
  ["Freelance work", 120], ["Do a coding job", 120], ["Translate a document", 60], ["Tutor a student", 60], ["Do overtime when needed", 60],
]);
add("work", "bad", "🥱", "It wastes paid time and slowly hurts your reputation", [
  ["Be late for work", 15], ["Skip work", 480], ["Slack off at work", 60], ["Procrastinate on a work task", 60], ["Call in sick when not sick", 480],
  ["Miss a deadline", 1],
]);

// ───────────────────────────── Tech ─────────────────────────────
const CODE = ["Python", "JavaScript", "TypeScript", "Java", "C", "C++", "C#", "Go", "Rust", "Swift", "Kotlin", "PHP", "Ruby", "SQL", "HTML & CSS"];
add("tech", "good", "💻", "Coding skills are valuable and train clear thinking", [
  ...CODE.flatMap((l): It[] => [[`Learn ${l}`, 45], [`Build a project in ${l}`, 90], [`Solve ${l} coding problems`, 30]]),
  ["Solve a LeetCode problem", 30], ["Do AtCoder practice", 60], ["Contribute to open source", 60], ["Build a website", 120], ["Fix a bug", 30],
  ["Write tests for your code", 30], ["Learn Git", 30], ["Deploy an app", 45], ["Learn Linux commands", 30], ["Read documentation", 30],
  ["Build a PC", 180], ["Make a mobile app", 120], ["Learn about AI", 45], ["Write a technical blog post", 60],
]);
add("tech", "good", "🔧", "Small tech upkeep saves you from big headaches", [
  ["Back up your phone", 15], ["Back up your laptop", 20], ["Update your phone", 15], ["Install laptop updates", 20], ["Free up phone storage", 15],
  ["Organise your computer files", 30], ["Clean up your email inbox", 20], ["Unsubscribe from spam emails", 10], ["Change your passwords", 20],
  ["Set up two-factor authentication", 10], ["Use a password manager", 15], ["Delete unused apps", 10], ["Organise your photos", 30],
  ["Clean up your desktop", 10], ["Run an antivirus scan", 10], ["Charge your devices", 1],
]);
add("tech", "bad", "🌀", "Fiddling with gadgets for hours feels busy but builds nothing", [
  ["Tinker with phone settings for hours", 120], ["Watch tech reviews for hours", 120], ["Customise your setup instead of working", 90],
  ["Browse Wikipedia rabbit holes for hours", 120],
]);

// ───────────────────────────── Pets ─────────────────────────────
add("pets", "good", "🐾", "Pets depend on you; caring for them is real responsibility", [
  ["Walk the dog", 30, 3], ["Feed the dog", 5, 2], ["Brush the dog", 10, 2.3], ["Give the dog a bath", 30, 3],
  ["Play fetch with the dog", 20, 3.5], ["Train the dog", 15, 3], ["Clean up after the dog", 5, 2.5], ["Take the dog to the vet", 60],
  ["Feed the cat", 5, 2], ["Clean the litter box", 5, 2.5], ["Brush the cat", 10, 2], ["Play with the cat", 15, 2], ["Trim the cat's claws", 5],
  ["Take the cat to the vet", 60], ["Feed the fish", 2], ["Clean the fish tank", 30, 3], ["Change the aquarium water", 20, 3],
  ["Feed the hamster", 2], ["Clean the hamster cage", 15, 2.5], ["Feed the rabbit", 5], ["Clean the rabbit hutch", 20, 3],
  ["Feed the bird", 2], ["Clean the bird cage", 15, 2.5], ["Feed the turtle", 2], ["Clean the turtle tank", 30, 3],
  ["Refill the pet's water bowl", 1], ["Give your pet medicine", 5], ["Cuddle your pet", 10],
]);

// ───────────────────────────── Sleep ─────────────────────────────
add("sleep", "good", "😴", "Good sleep powers your body, mood and memory", [
  ["Go to bed before 11 pm", 1], ["Sleep 7–8 hours", 450], ["Wake up before 7 am", 1], ["Wake up on the first alarm", 1],
  ["Take a 20-minute power nap", 20], ["No screens an hour before bed", 60], ["Wind-down routine", 20], ["Put your phone away at bedtime", 1],
  ["Keep a consistent sleep schedule", 1], ["Make the bedroom dark and cool", 5], ["Set tomorrow's alarm early", 1],
]);
add("sleep", "bad", "🦉", "Late nights and oversleeping wreck the next day", [
  ["Stay up past 2 am", 1], ["Oversleep until noon", 1], ["Snooze the alarm many times", 30], ["Nap for 3 hours in the afternoon", 180],
  ["Pull an all-nighter", 480], ["Use your phone in bed until late", 90], ["Stay up late for no reason", 120], ["Waste the morning in bed", 180],
  ["Revenge bedtime procrastination", 120],
]);
add("sleep", "neutral", "🛏️", "Sometimes rest is just what's needed", [["Sleep in on a day off", 60], ["Lie down to rest", 20], ["Rest on the sofa", 30]]);

// ───────────────────────────── Travel / outdoors ─────────────────────────────
add("travel", "neutral", "🚃", "Getting around is necessary; use the time well", [
  ["Commute by train", 40], ["Commute by bus", 30], ["Drive to work", 30], ["Take the Shinkansen", 150], ["Take a night bus", 480],
  ["Take a domestic flight", 90], ["Take a taxi", 20], ["Book train tickets", 10], ["Book a hotel", 20], ["Pack for a trip", 30, 2.3],
  ["Go to the airport", 90], ["Ride the ferry", 60], ["Day trip to Kyoto", 600, 2.5], ["Day trip to Nara", 480, 2.5],
  ["Day trip to Kamakura", 420, 2.5], ["Day trip to Nikkō", 600, 2.5], ["Day trip to Hakone", 600, 2.5], ["Day trip to Yokohama", 360, 2.5],
  ["Trip to Osaka", 1440, 2.5], ["Trip to Hiroshima", 1440, 2.5], ["Trip to Hokkaido", 2880, 2.5], ["Trip to Okinawa", 2880, 2.5],
  ["Trip abroad", 4320], ["Go home for Obon", 2880], ["Go home for New Year", 2880], ["Go sightseeing", 240, 2.5],
]);
add("travel", "good", "🚲", "Active commuting builds fitness into your day", [
  ["Commute by bicycle", 30, 6.8], ["Walk to school", 20, 3.5], ["Walk to work", 20, 3.5], ["Cycle to school", 20, 6.8],
  ["Study on the train", 30], ["Listen to a language podcast on the commute", 30], ["Unpack after a trip", 30, 2.5], ["Plan a trip budget", 20],
]);
add("outdoors", "good", "🌳", "Fresh air, sunlight and movement reset body and mind", [
  ["Go to the park", 60, 2.5], ["Walk in the park", 45, 3.5], ["Hike Mt. Takao", 240, 6], ["Climb Mt. Fuji", 720, 7],
  ["Hanami (cherry blossom viewing)", 120, 2.5], ["Momijigari (autumn leaves viewing)", 120, 3], ["Go to the beach", 180, 2.5],
  ["Go camping", 1440, 3], ["Watch the sunrise", 30], ["Watch the sunset", 30], ["Have a picnic", 90], ["Go stargazing", 60],
  ["Go birdwatching", 90, 2.5], ["Visit a botanical garden", 90, 2.5], ["Visit a Japanese garden", 60, 2.5], ["Visit the zoo", 180, 2.5],
  ["Visit an aquarium", 120, 2.5], ["Walk along the river", 45, 3.5], ["Explore a new neighbourhood on foot", 90, 3.5],
  ["Sit outside in the sun", 15], ["Go to a forest (shinrin-yoku)", 90, 3], ["Go fishing", 180, 3], ["Go berry or fruit picking", 120, 3],
  ["Visit a waterfall", 120, 4], ["Swim in the sea", 45, 6], ["Go for a bike ride in the countryside", 120, 7],
]);

// ───────────────────────────── Bad habits ─────────────────────────────
add("bad habit", "bad", "🚬", "It harms your health and drains money", [
  ["Smoke a cigarette", 5], ["Smoke a whole pack", 120], ["Vape", 5], ["Drink alcohol heavily", 180], ["Get drunk", 180],
  ["Drink alone at night", 90], ["Drink until the last train", 240], ["Wake up hungover", 1], ["Drink an energy drink late at night", 5],
  ["Drink 3+ energy drinks", 5], ["Drink too much coffee", 5], ["Drink sugary soda", 5], ["Take sleeping pills without need", 1],
]);
add("bad habit", "bad", "🍟", "Junk food feels good for a minute and heavy for a day", [
  ["Eat junk food", 20], ["Binge on snacks", 30], ["Binge on fast food", 40], ["Eat a whole bag of chips", 15], ["Eat instant noodles for every meal", 10],
  ["Late-night ramen", 30], ["Midnight combini snack run", 20], ["Eat sweets all day", 30], ["Skip breakfast", 1], ["Skip meals", 1],
  ["Overeat until you feel sick", 40], ["Stress eat", 30],
]);
add("bad habit", "bad", "⏳", "Putting things off steals time and piles on stress", [
  ["Procrastinate", 60], ["Procrastinate on homework", 60], ["Procrastinate on studying", 60], ["Procrastinate on chores", 60],
  ["Skip class", 90], ["Skip the gym", 60], ["Skip your workout", 60], ["Lie in bed scrolling your phone", 90], ["Waste the day in bed", 480],
  ["Do nothing all day", 480], ["Leave dishes unwashed for days", 1], ["Leave laundry piled up", 1], ["Leave homework until the last minute", 1],
  ["Watch adult content for long", 60], ["Bite your nails", 5], ["Litter", 1], ["Break your diet", 30], ["Break a streak", 1],
  ["Make excuses", 1], ["Complain all day", 1],
]);

export const TASKS: TaskDef[] = LIST;

// ───────────────────────────── Matching ─────────────────────────────
const STOP = new Set(["a", "an", "the", "to", "of", "on", "in", "for", "with", "by", "at", "and", "or", "my", "your", "some", "from", "through", "via", "into", "i", "me", "is", "was", "it", "e", "g"]);
const SYN: Record<string, string> = { talk: "chat", text: "message", texting: "message", insta: "instagram", ig: "instagram", yt: "youtube", twitter: "x", tweet: "x", hr: "hour", hrs: "hour", h: "hour", mins: "minute", min: "minute" };

function stem(w: string): string {
  let s = SYN[w] ?? w;
  if (s.length > 4 && s.endsWith("ies")) s = s.slice(0, -3) + "y";
  else if (s.length > 5 && s.endsWith("ing")) s = s.slice(0, -3);
  else if (s.length > 4 && s.endsWith("ed")) s = s.slice(0, -2);
  else if (s.length > 4 && /(sh|ch|x|ss)es$/.test(s)) s = s.slice(0, -2);
  else if (s.length > 4 && s.endsWith("es") && /thes$/.test(s)) s = s.slice(0, -1);
  if (s.length > 3 && s.endsWith("s") && !s.endsWith("ss")) s = s.slice(0, -1);
  if (s.length > 3 && /(.)\1$/.test(s)) s = s.slice(0, -1);
  if (s.length > 4 && s.endsWith("e")) s = s.slice(0, -1);
  return SYN[s] ?? s;
}

function tokens(text: string): string[] {
  return text.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").split(/[^a-z0-9぀-鿿]+/)
    .filter((w) => w && !STOP.has(w) && !/^\d+$/.test(w)).map(stem);
}

const INTENSE = new Set(["hour", "night", "binge", "marathon", "all-night"]);
let INDEX: { t: TaskDef; toks: string[] }[] | null = null;
const BY_NAME = new Map(LIST.map((t) => [t.name.toLowerCase(), t]));
const index = () => (INDEX ??= LIST.map((t) => ({ t, toks: tokens(t.name) })));

// How well a query matches one task: share of query words found, nudged towards tighter task names.
function score(q: string[], toks: string[]): number {
  if (!q.length || !toks.length) return 0;
  let hit = 0;
  for (const w of q) {
    if (toks.includes(w)) hit += 1;
    else if (w.length >= 4 && toks.some((t) => t.startsWith(w) || (t.length >= 4 && w.startsWith(t)))) hit += 0.8;
  }
  // Don't jump to the "for hours" version of a task unless the query says so.
  const intense = toks.some((t) => INTENSE.has(t)) && !q.some((w) => INTENSE.has(w));
  return hit / q.length + (0.3 * hit) / toks.length - (intense ? 0.25 : 0);
}

export function taskOf(name: string): TaskDef | undefined {
  const exact = BY_NAME.get(name.trim().toLowerCase());
  if (exact) return exact;
  const q = tokens(name);
  if (!q.length) return undefined;
  let best: { t: TaskDef; s: number } | undefined;
  for (const { t, toks } of index()) {
    const s = score(q, toks);
    if (!best || s > best.s) best = { t, s }; // ties keep the earlier, more everyday entry
  }
  // Need most of the query covered (all of it for one- or two-word queries).
  const need = q.length <= 2 ? 0.95 : 0.6;
  return best && best.s >= need ? best.t : undefined;
}

export function searchTasks(q: string, limit = 20): TaskDef[] {
  const qt = tokens(q);
  if (!qt.length) return LIST.slice(0, limit);
  return index()
    .map(({ t, toks }) => ({ t, s: score(qt, toks) + (t.name.toLowerCase().includes(q.trim().toLowerCase()) ? 1 : 0) }))
    .filter((r) => r.s > 0.3)
    .sort((a, b) => b.s - a.s || a.t.name.length - b.t.name.length)
    .slice(0, limit)
    .map((r) => r.t);
}

type Rule = [RegExp, Deed, TaskCat, string, string];
const RULES: Rule[] = [
  [/scroll|reels?\b|tiktok|shorts|doom|binge|all[- ]?night|for hours|rabbit hole/i, "bad", "screen", "📱", "Endless scrolling and binges eat hours and hurt focus"],
  [/pachinko|pachislot|gambl|\bbet(ting)?\b|lottery|gacha/i, "bad", "money", "💸", "Chance and gacha spending drain money and time"],
  [/smok|cigar|vap(e|ing)|drunk|hangover|heavy drink/i, "bad", "bad habit", "🚬", "It harms your health and drains money"],
  [/porn|adult content/i, "bad", "bad habit", "⏳", "It eats time and attention"],
  [/procrastinat|skip(ped|ping)? (class|school|work|gym|workout)|oversle|stay(ed|ing)? up|all-nighter|lazy|wast(e|ed|ing) time/i, "bad", "bad habit", "⏳", "Putting things off steals time and piles on stress"],
  [/junk|chips|candy|soda|energy drink|fast food/i, "bad", "bad habit", "🍟", "Junk food feels good for a minute and heavy for a day"],
  [/\banime\b|manga|gaming|video ?games?|netflix|youtube|twitch/i, "bad", "screen", "📺", "Fun, but it easily eats hours better spent building yourself"],
  [/wash|clean|tidy|laundry|dish|vacuum|mop|sweep|dust|iron|declutter|organi[sz]|trash|garbage/i, "good", "chores", "🧹", "A clean, tidy home lowers stress and keeps you healthy"],
  [/stud(y|ied|ies)|read|revis|practi[cs]e|homework|learn|lesson|lecture|exam|kanji|jlpt|course/i, "good", "learning", "📖", "Steady study builds skills that pay off for life"],
  [/exercis|workout|gym|walk|run|jog|swim|cycl|bike|yoga|stretch|push-?ups?|squats?|plank|lift|train(ing)?|hike|sport/i, "good", "fitness", "💪", "Exercise builds strength, mood and discipline"],
  [/meditat|journal|gratitude|breath|reflect|plan (the|my|tomorrow)/i, "good", "mind", "🧘", "A calm, clear mind makes every other habit easier"],
  [/pray|shrine|temple|church|mosque|scripture|bible|quran|puja/i, "good", "faith", "🙏", "Prayer and faith bring peace, gratitude and direction"],
  [/cook|bake|meal prep|bento/i, "good", "food", "🍳", "Home cooking is cheaper and healthier than eating out"],
  [/brush|floss|shower|bath|skincare|shave|haircut|nails?/i, "good", "self care", "🪥", "Small hygiene habits keep you healthy and confident"],
  [/vitamin|medicine|doctor|dentist|water|sleep early|bed early|nap/i, "good", "health", "💊", "Looking after your body now prevents bigger problems later"],
  [/budget|sav(e|ing)|invest|pay (the )?bill|bank/i, "good", "money", "💰", "Knowing and growing your money gives you freedom"],
  [/help|volunteer|donat|famil|mom|dad|parent|grand/i, "good", "family", "🤝", "Helping and staying close to people makes life richer"],
  [/chat|talk|call|message|text|line\b|whatsapp|discord/i, "neutral", "social", "💬", "Short chats keep friendships alive; fine in small doses"],
  [/work|shift|job|office|meeting|email/i, "good", "work", "💼", "Work earns money, builds skills and keeps you reliable"],
  [/shop|buy|errand|post office|combini|supermarket|atm/i, "neutral", "errands", "🛒", "Necessary life admin; it has to get done"],
  [/eat|lunch|dinner|breakfast|snack|drink/i, "neutral", "food", "🍽️", "Eating is necessary; it is what and how much that matters"],
  [/commute|train|bus|taxi|drive/i, "neutral", "travel", "🚃", "Getting around is necessary; use the time well"],
];
const LONG = /\b\d+(\.\d+)?\s*(h|hr|hrs|hours?)\b|for hours|all (night|day)|until (late|\d)|binge/i;
const IDLE_CATS: TaskCat[] = ["screen", "social", "tech"];

// Judges anything typed: catalogue first, then keyword rules, else neutral.
// Leisure that runs for hours is marked as a bad deed even if one session would be fine.
export function judge(name: string): { deed: Deed; why: string; cat: TaskCat; emoji: string } {
  const t = taskOf(name);
  if (t) {
    if (t.deed === "neutral" && IDLE_CATS.includes(t.cat) && LONG.test(name)) {
      return { deed: "bad", why: "A little is fine, but hours of it eat the day", cat: t.cat, emoji: t.emoji };
    }
    return { deed: t.deed, why: t.why, cat: t.cat, emoji: t.emoji };
  }
  for (const [re, deed, cat, emoji, why] of RULES) {
    if (re.test(name)) {
      if (deed === "neutral" && IDLE_CATS.includes(cat) && LONG.test(name)) return { deed: "bad", why: "A little is fine, but hours of it eat the day", cat, emoji };
      return { deed, why, cat, emoji };
    }
  }
  return { deed: "neutral", why: "Not clearly good or bad; it depends on how much and why", cat: "chores", emoji: "✨" };
}
