// What Sensei says. Every moment of the game has its own lines, always positive.

export const SENSEI = { name: "Sensei Kaito", icon: "🥷" };

export const LORE: Record<string, string[]> = {
  morning: [
    "A new stage begins. The hero who wins the morning wins the day.",
    "The sun has risen, and so have you. That is already victory number one.",
    "Every legend started on an ordinary morning just like this one.",
    "Drink water before anything else. Your brain is 75% water and it's thirsty.",
    "Make your bed. One small mission done before breakfast builds momentum all day.",
    "Ten minutes of daylight in the morning sets your body clock and improves sleep tonight.",
    "Today you don't need to be perfect. You only need to be better than yesterday.",
  ],
  afternoon: [
    "Halfway through the stage. Check your missions, hero. Which one falls next?",
    "The afternoon slump is real. A glass of water and a 5-minute walk will reset you.",
    "Strong heroes don't wait for motivation. They start, and motivation follows.",
    "Your future self is watching. Give them something to be proud of.",
    "Small steps every afternoon add up to giant leaps by the end of the year.",
  ],
  evening: [
    "The evening is for finishing strong. One more mission before the day closes?",
    "Review what you did today. Every record is a step on your legend's path.",
    "Screens off 30 minutes before bed and your sleep quality goes up. Real science.",
    "You fought well today. Prepare tomorrow's plan, then rest like a champion.",
    "Even a single completed mission today keeps the streak fire alive.",
  ],
  night: [
    "Night has fallen. The wisest heroes sleep to recover their power.",
    "Sleep is when your muscles grow and your memory saves what you studied.",
    "Late-night scrolling steals tomorrow's energy. Rest now, conquer tomorrow.",
    "Your brain cleans itself while you sleep. Let it do its job, hero.",
  ],
  water: [
    "Hydration restores focus. Even 2% dehydration lowers concentration.",
    "Water: the first potion of every great hero.",
    "Keep a bottle in sight. Heroes who see water drink water.",
    "Thirst often feels like hunger. Drink first, then decide if you're hungry.",
  ],
  milk: [
    "Milk brings calcium and protein. Bones of steel are forged slowly.",
    "A glass of milk before bed can help you relax and sleep better.",
    "Protein after training helps your muscles rebuild stronger.",
  ],
  sleep: [
    "Rest is not weakness. It is how heroes level up overnight.",
    "Seven to nine hours. That's where the real power-up happens.",
    "Same sleep time every day trains your body to fall asleep faster.",
    "A short nap of 20 minutes recharges you without the grogginess.",
  ],
  wake: [
    "Ohayo, hero! Waking up is the first mission of every stage.",
    "You rose again. Consistency is the secret technique of every master.",
    "Open the curtains. Morning light tells your brain the battle has begun.",
  ],
  meal: [
    "Fuel the hero. Protein, vegetables and water make the strongest builds.",
    "Eat slowly. It takes 20 minutes for your body to know it's full.",
    "Colorful plates mean more vitamins. Make your plate a rainbow.",
  ],
  workout: [
    "Every rep is XP for your body. Pain is temporary, power is permanent.",
    "Form first, weight later. Masters protect their bodies.",
    "Progressive overload: a little more each week is how legends grow.",
    "Rest between sets is part of training. Breathe, then strike again.",
    "You don't have to feel like training. You just have to start the first set.",
  ],
  focus: [
    "25 minutes of pure focus beats 3 hours of distracted study.",
    "Phone away, mind on. This is the Dojo of the Mind.",
    "Teach what you learn to an imaginary student. It doubles your memory.",
    "Every focus session now is anime you'll watch guilt-free after the exams.",
    "Hard chapters are bosses. Defeat them one session at a time.",
    "Breaks are part of the technique. 5 minutes off, then strike again.",
  ],
  shopping: [
    "A wise hero checks the list before the market. Impulse buys drain gold.",
    "Compare prices per kg, not per pack. Merchants hide tricks in sizes.",
    "Tracking every coin today means freedom tomorrow.",
    "Buy what you need, not what the shelf shouts at you.",
  ],
  activity: [
    "Side quest complete. Every action writes your story.",
    "Little habits are the roots of big trees.",
    "Recorded and remembered. Your chronicle grows.",
    "Discipline is choosing what you want most over what you want now.",
  ],
  mission: [
    "Mission complete! This is how heroes are built: one win at a time.",
    "Well fought! Your consistency is becoming your superpower.",
    "Another victory recorded in the chronicle. Keep the momentum!",
    "Excellent! Remember this feeling. You earned it.",
  ],
  perfect: [
    "PERFECT STAGE! Every mission cleared. Days like this build legends.",
    "Flawless victory. Your future self just bowed to you.",
  ],
  levelup: [
    "Your power grows! New level, new limits to break.",
    "Level up! The training is paying off, hero.",
  ],
  boss: [
    "The boss trembles. Every mission you clear is a strike against it.",
    "Bosses fall to consistency, not to one big hit.",
  ],
  achievement: [
    "Achievement unlocked! Proof that you showed up.",
    "A new badge for your legend. Wear it proudly.",
  ],
  comeback: [
    "Welcome back, hero. Missing days happens. Restarting is what makes a champion.",
    "The stage reset, but your skills remain. Let's go again.",
  ],
  exam: [
    "Exams are boss battles. Your daily study sessions are the training arc.",
    "After the exams: all the anime and manga you want, guilt-free. Earn it now.",
  ],
};

export function line(topic: string, seed?: number) {
  const list = LORE[topic] ?? LORE.activity;
  const i = seed === undefined ? Math.floor(Math.random() * list.length) : Math.abs(seed) % list.length;
  return list[i];
}

export function timeTopic(d = new Date()) {
  const h = d.getHours();
  return h < 5 ? "night" : h < 12 ? "morning" : h < 18 ? "afternoon" : h < 22 ? "evening" : "night";
}

// Which Sensei topic fits a record kind.
export const KIND_TOPIC: Record<string, string> = {
  water: "water", milk: "milk", sleep: "sleep", wake: "wake", meal: "meal", workout: "workout", focus: "focus",
  reading: "focus", media: "focus", shopping: "shopping", activity: "activity", use: "meal", listening: "activity",
};
