import type { PoseKey, Prop, Scene } from "@/components/PoseDemo";
import type { Move } from "@/lib/moves";

// How each type of an exercise is really done: which moving picture to show,
// what the hero holds (dumbbell, barbell, kettlebell) and the steps.

export type HowTo = { pose?: PoseKey; prop?: Prop; scene?: Scene; steps?: string[] };

// The default picture and equipment for each exercise.
const MOVE: Record<string, HowTo> = {
  Kettlebell: { pose: "swing", prop: "kettlebell" },
  "Bench press": { pose: "benchpress", prop: "barbell" },
  "Chest fly": { pose: "benchpress", prop: "dumbbell" },
  "Overhead press": { pose: "ohpress", prop: "barbell" },
  "Lateral raise": { pose: "armraise", prop: "dumbbell" },
  "Front raise": { pose: "armraise", prop: "dumbbell" },
  "Rear delt fly": { pose: "row", prop: "dumbbell" },
  Shrugs: { pose: "shrug", prop: "dumbbell" },
  "Upright row": { pose: "shrug", prop: "barbell" },
  Deadlift: { pose: "deadlift", prop: "barbell" },
  "Barbell row": { pose: "row", prop: "barbell" },
  "Dumbbell row": { pose: "row", prop: "dumbbell" },
  "Bicep curl": { pose: "curl", prop: "dumbbell" },
  "Tricep extension": { pose: "ohpress", prop: "dumbbell" },
  "Wrist curl": { pose: "seatcurl", prop: "dumbbell" },
  "Farmer's walk": { pose: "run", prop: "dumbbell" },
  "Front squat": { pose: "frontsquat", prop: "barbell" },
  "Goblet squat": { pose: "goblet", prop: "kettlebell" },
  "Wall sit": { pose: "wallsit" },
  "Step-ups": { pose: "stepup" },
  "Box jumps": { pose: "boxjump" },
  "Calf raises": { pose: "calf" },
  "Hip thrust": { pose: "hipthrust", prop: "barbell" },
  "Good morning": { pose: "hinge", prop: "barbell" },
  Superman: { pose: "superman" },
  "Flutter kicks": { pose: "flutter" },
  "Sit-ups / crunches": { pose: "situp" },
  Burpees: { pose: "burpee" },
  "Mountain climbers": { pose: "climber" },
  "High knees": { pose: "highknee" },
  "Star jumps": { pose: "jumpsquat" },
  "Pull-ups": { pose: "pull" },
  "Lat pulldown": { pose: "widepull" },
  "Muscle-up": { pose: "pull" },
  Weights: { pose: "curl", prop: "dumbbell" },
  "Bench dips": { pose: "dip", scene: "bench" },
  "Pike push-up": { pose: "pikepush" },
  "Incline dumbbell press": { pose: "benchpress", prop: "dumbbell" },
  "Machine chest press": { pose: "benchpress" },
  "Hack squat": { pose: "squat" },
  "Zercher squat": { pose: "frontsquat", prop: "barbell" },
  "Single-leg deadlift": { pose: "hinge", prop: "dumbbell" },
  "Rack pull": { pose: "deadlift", prop: "barbell" },
  "Pendlay row": { pose: "row", prop: "barbell" },
  "Reverse curl": { pose: "curl", prop: "barbell" },
  "Zottman curl": { pose: "curl", prop: "dumbbell" },
  "Toes to bar": { pose: "pull" },
};


// The right moving picture for each exercise (checked one by one).
const PICTURE: Record<string, HowTo> = {
  "Jumping jacks": { pose: "jacks" }, Skipping: { pose: "jumprope" }, Walking: { pose: "walk" }, Cycling: { pose: "cycle" }, Swimming: { pose: "swim" },
  "Lateral raise": { pose: "lateral", prop: "dumbbell" }, "Front raise": { pose: "frontraise", prop: "dumbbell" }, "Rear delt fly": { pose: "revfly", prop: "dumbbell" },
  "Face pull": { pose: "facepull" }, "Upright row": { pose: "uprow", prop: "barbell" }, Handstand: { pose: "handstand", scene: "wall" },
  "Lat pulldown": { pose: "pulldown" }, "Seated cable row": { pose: "seatrow" }, "Inverted row": { pose: "invrow" }, "Muscle-up": { pose: "muscleup" },
  "Back extension": { pose: "superman" }, "Farmer's walk": { pose: "walk", prop: "dumbbell" }, "Leg press": { pose: "legpress" }, "Leg curl": { pose: "legcurl" },
  "Leg extension": { pose: "legext" }, "Donkey kicks": { pose: "donkey" }, "Side lunges": { pose: "sidelunge" }, "Nordic curl": { pose: "nordic" },
  "Bicycle crunch": { pose: "bicycle" }, "Flutter kicks": { pose: "flutterkick" }, "Hollow hold": { pose: "hollow" }, "Dead bug": { pose: "deadbug" },
  "Bird dog": { pose: "birddog" }, "Toe touches": { pose: "vup" }, "L-sit": { pose: "lsit" }, "Dragon flag": { pose: "dragonflag" }, "Reverse crunch": { pose: "revcrunch" },
  "Star jumps": { pose: "jacks" }, "Stair climbing": { pose: "boxstep" }, "Rowing machine": { pose: "rowmachine" }, Elliptical: { pose: "walk" },
  "Shadow boxing": { pose: "punch" }, "Bear crawl": { pose: "bear" }, "Battle ropes": { pose: "ropes" }, Hiking: { pose: "walk" }, Dancing: { pose: "jacks" },
  "Sun salutation": { pose: "sunsal" }, "Downward dog": { pose: "downdog" }, "Cobra stretch": { pose: "cobra" }, "Child's pose": { pose: "child" },
  "Hamstring stretch": { pose: "seatfold" }, "Hip flexor stretch": { pose: "kneelunge" }, "Cat-cow": { pose: "catcow" }, Inchworm: { pose: "inchworm" },
  "Neck and shoulder rolls": { pose: "neck" }, "Dumbbell pullover": { pose: "pullover", prop: "dumbbell" }, "Lateral hops": { pose: "skater" },
  "Dead hang": { pose: "hang" }, "Scapular pull-up": { pose: "hang" }, "Front lever": { pose: "lever" }, "Y-T-W raise": { pose: "lateral", prop: "none" },
  "Medicine ball slam": { pose: "medball" }, Sledgehammer: { pose: "medball" }, "Suitcase carry": { pose: "walk", prop: "kettlebell" }, "Overhead carry": { pose: "walk", prop: "dumbbell" },
  "Glute ham raise": { pose: "nordic" }, "Hip abduction": { pose: "sideleg" }, "Hip adduction": { pose: "sideleg" }, "Glute kickback": { pose: "glutekick" },
  Jackknife: { pose: "vup" }, "Wall angels": { pose: "lateral" }, "World's greatest stretch": { pose: "kneelunge" }, "Pigeon pose": { pose: "pigeon" },
  "Butterfly stretch": { pose: "butterfly" }, "Quad stretch": { pose: "quadstretch" }, "Calf stretch": { pose: "lunge", scene: "wall" }, "Chest stretch": { pose: "warrior" },
  "Kettlebell high pull": { pose: "uprow", prop: "kettlebell" }, "Kettlebell lateral lunge": { pose: "sidelunge", prop: "kettlebell" },
  "Kettlebell rack walk": { pose: "walk", prop: "kettlebell" }, "Kettlebell farmer carry": { pose: "walk", prop: "kettlebell" },
  "Seal jacks": { pose: "jacks" }, "Cross jacks": { pose: "jacks" }, "Ski jumps": { pose: "skater" }, "Pogo jumps": { pose: "jumprope" }, "Lateral shuffle": { pose: "skater" },
  Carioca: { pose: "walk" }, "Heel walk": { pose: "walk" }, "Toe walk": { pose: "calf" }, "Standing knee raise": { pose: "kneeup" }, "Standing oblique crunch": { pose: "kneeup" },
  "Reverse lunge knee drive": { pose: "lungeknee" }, "Reverse plank": { pose: "crab" }, "Crab toe touch": { pose: "crabtoe" }, "Plank to downward dog": { pose: "plankdog" },
  "Side plank reach": { pose: "sideplank" }, "Bear plank hold": { pose: "bear" }, "Sit-out": { pose: "bear" }, "Boat pose": { pose: "vup" }, "Hollow rock": { pose: "hollow" },
  "Side-lying leg raise": { pose: "sideleg" }, "Seated knee tuck": { pose: "vup" }, "Arm circles": { pose: "lateral" }, "Cable fly": { pose: "fly" },
  "Sissy squat": { pose: "sissy" }, "Straight-arm pulldown": { pose: "frontraise" }, "Plank shoulder taps": { pose: "shouldertap" }, "Plank jacks": { pose: "plankjack" },
  "Side plank dips": { pose: "sideplank" }, "Hanging knee raise": { pose: "hangraise" }, "Toes to bar": { pose: "toesbar" }, "Pallof press": { pose: "frontraise" },
  "Wood chop": { pose: "medball" }, "Skater jumps": { pose: "skater" }, "Lateral bounds": { pose: "skater" }, "Spin bike": { pose: "cycle" }, "Ice skating": { pose: "skater" },
  Kayaking: { pose: "seatrow" }, "Tai chi": { pose: "warrior" }, "Zumba / aerobics": { pose: "jacks" }, "Yoga / stretching": { pose: "downdog" }, "Chest fly": { pose: "fly", prop: "dumbbell" },
  "Squat jacks": { pose: "sumo" },
};

// Each type of an exercise, done the real-world way.
const TYPES: Record<string, Record<string, HowTo>> = {
  "Push-ups": {
    Knee: { pose: "kneepush", steps: ["Knees on the floor, hands under your shoulders.", "Keep a straight line from knees to head and lower your chest.", "Push back up. Move to full push-ups when 15 feel easy."] },
    Incline: { pose: "inclinepush", steps: ["Hands on the edge of a bench, table or step.", "Walk your feet back until your body is straight.", "Lower your chest to the edge, then push away."] },
    Standard: { pose: "push" },
    Wide: { pose: "push", steps: ["Hands about 1.5 times shoulder-width.", "Lower your chest between your hands, elbows out a little more.", "Push up, squeezing your chest."] },
    Diamond: { pose: "push", steps: ["Make a diamond with thumbs and index fingers under your chest.", "Lower with elbows tucked close to your ribs.", "Push up using your triceps."] },
    Decline: { pose: "declinepush", steps: ["Feet up on a bench or bed, hands on the floor.", "Lower your head towards the floor, body straight.", "Push back up. More weight goes to your upper chest and shoulders."] },
    Pike: { pose: "pikepush", steps: ["Hips high like an upside-down V, hands shoulder-width.", "Bend your elbows to bring the top of your head towards the floor.", "Press back up. This trains you for handstand push-ups."] },
    Clap: { pose: "plyopush", steps: ["Start in a normal push-up.", "Lower, then push up so hard your hands leave the floor and clap.", "Land with soft elbows straight into the next rep."] },
    Archer: { pose: "archer", steps: ["Hands very wide, fingers out to the sides.", "Lower towards one hand while the other arm stays straight.", "Push up and switch sides."] },
    "One-arm": { pose: "push", steps: ["Feet wide, one hand under the middle of your chest, other hand behind your back.", "Lower slowly, keeping hips square to the floor.", "Push up. Start with the incline version on a bench."] },
  },
  "Pull-ups": {
    Negative: { pose: "pull", steps: ["Jump or step up so your chin is over the bar.", "Lower yourself as slowly as you can (5 seconds).", "Drop off, reset, repeat."] },
    "Band-assisted": { pose: "pull", steps: ["Loop a band over the bar and put a foot or knee in it.", "Pull your chin over the bar; the band helps at the bottom.", "Lower slowly. Use a thinner band as you get stronger."] },
    "Chin-up": { pose: "chinup", steps: ["Hang with palms facing you, hands shoulder-width.", "Pull your chest up to the bar, elbows close to your body.", "Lower all the way down. More biceps than a pull-up."] },
    Standard: { pose: "pull" },
    Wide: { pose: "widepull", steps: ["Hands wider than shoulders, palms facing away.", "Pull your upper chest to the bar, elbows going down and out.", "Lower slowly to straight arms."] },
    Commando: { pose: "chinup", steps: ["Stand under the bar side-on, hands close with palms facing each other.", "Pull up so your head goes to one side of the bar.", "Lower and alternate sides."] },
    "L-sit": { pose: "pull", steps: ["Hang and lift straight legs out in front to hip height.", "Hold that L and pull up.", "Lower with your legs still up."] },
    Weighted: { pose: "pull", prop: "dumbbell", steps: ["Hold a dumbbell between your feet or wear a dip belt.", "Pull up with the same strict form.", "Lower slowly. Add small weights only."] },
    Archer: { pose: "widepull", steps: ["Very wide grip.", "Pull towards one hand while the other arm stays nearly straight.", "Lower and switch sides."] },
    "One-arm": { pose: "chinup", steps: ["Grip the bar with one hand, other hand on your chest.", "Pull up without twisting too much.", "Lower slowly. Train with archer pull-ups first."] },
  },
  Squats: {
    Half: { pose: "squat", steps: ["Feet shoulder-width.", "Bend until your thighs are halfway to level.", "Stand back up. Good for starting out or sore knees."] },
    Bodyweight: { pose: "squat" },
    Sumo: { pose: "sumo", steps: ["Feet very wide, toes turned out.", "Sit straight down, knees pushed out over your toes.", "Stand up squeezing your inner thighs and glutes."] },
    Jump: { pose: "jumpsquat", steps: ["Squat down with arms back.", "Explode up and swing your arms, leaving the floor.", "Land softly and go straight into the next squat."] },
    "Bulgarian split": { pose: "lunge", prop: "dumbbell", steps: ["Back foot on a bench behind you, dumbbells at your sides.", "Lower your back knee towards the floor.", "Push up through your front heel. Switch legs."] },
    Pistol: { pose: "pistol", steps: ["Stand on one leg, other leg straight out in front.", "Squat all the way down on the standing leg, arms forward for balance.", "Stand back up. Hold a door frame to learn it."] },
  },
  Dips: {
    Bench: { pose: "dip", scene: "bench", steps: ["Hands on the edge of a bench behind you, feet on the floor.", "Bend your elbows to lower your hips.", "Press back up to straight arms."] },
    "Parallel bar": { pose: "dip" },
    Ring: { pose: "dip", steps: ["Support yourself on gymnastic rings, arms straight and turned out.", "Lower until your shoulders are below your elbows, rings close to your body.", "Press up and turn the rings out at the top."] },
  },
  Plank: {
    Knee: { pose: "plank", steps: ["Forearms down, knees on the floor.", "Straight line from knees to head.", "Hold and breathe."] },
    Side: { pose: "sideplank", steps: ["Lie on your side, elbow under your shoulder.", "Lift your hips so your body is straight.", "Hold, then switch sides."] },
    Weighted: { pose: "plank", steps: ["Ask someone to put a plate on your upper back.", "Hold a perfect plank.", "Have the plate taken off before you drop."] },
  },
  Lunges: {
    Static: { pose: "lunge", steps: ["Split stance, one foot forward, one back.", "Drop your back knee straight down.", "Rise up without moving your feet. Switch legs."] },
    Reverse: { pose: "lunge", steps: ["Stand tall.", "Step one foot back and lower the back knee.", "Push through your front heel to return."] },
    Jump: { pose: "jumpsquat", steps: ["Start in a lunge.", "Jump and switch legs in the air.", "Land softly in a lunge on the other side."] },
  },
  Burpees: {
    "No push-up": { pose: "burpee", steps: ["Squat and put your hands down.", "Step or jump back to a plank.", "Jump feet in and stand or jump up."] },
    "Tuck jump": { pose: "burpee", steps: ["Do a normal burpee.", "At the top, jump and pull your knees to your chest.", "Land softly and go again."] },
  },
  "Sit-ups / crunches": {
    Crunch: { pose: "crunch", steps: ["Lie on your back, knees bent.", "Lift only your shoulder blades using your abs.", "Lower slowly."] },
    "V-up": { pose: "situp", steps: ["Lie flat, arms overhead.", "Lift arms and straight legs at the same time to meet over your hips.", "Lower slowly to the floor."] },
  },
  Kettlebell: {
    Swing: { pose: "swing" },
    "Goblet squat": { pose: "goblet", steps: ["Hold the kettlebell by the horns at your chest.", "Squat down with elbows inside your knees.", "Stand up tall, bell stays close."] },
    Clean: { pose: "clean", steps: ["Bell between your feet, hinge and grab it with one hand.", "Pull it up close to your body, hips snap forward.", "Let it roll around your wrist into the rack at your shoulder."] },
    Press: { pose: "ohpress", steps: ["Bell in the rack position at your shoulder.", "Press straight up until your arm is locked.", "Lower back to the rack with control."] },
    Snatch: { pose: "snatch", steps: ["Swing the bell back between your legs.", "Snap your hips and pull it up close to your body.", "Punch your hand through so it lands softly overhead."] },
    "Turkish get-up": { pose: "getup", steps: ["Lie down holding the bell straight up, eyes on it.", "Roll to your elbow, then hand, lift your hips and sweep your leg under.", "Stand up, then reverse every step back to lying."] },
    Windmill: { pose: "windmill", steps: ["Bell locked overhead, feet turned away from it.", "Push your hip out and slide your other hand down your leg.", "Rise back up keeping the bell straight above you."] },
    Halo: { pose: "halo", steps: ["Hold the bell upside down by the horns at your chest.", "Circle it around your head, close to your neck.", "Go the other way. Keep your core tight."] },
  },
  "Bench press": {
    Flat: { pose: "benchpress" },
    Incline: { pose: "benchpress", steps: ["Set the bench to 30 to 45 degrees.", "Lower the bar to your upper chest.", "Press up over your shoulders."] },
    Decline: { pose: "benchpress", steps: ["Lock your legs on a decline bench.", "Lower the bar to your lower chest.", "Press up. Always use a spotter."] },
    "Close-grip": { pose: "benchpress", steps: ["Grip the bar with hands shoulder-width.", "Lower with elbows close to your body.", "Press up using your triceps."] },
    Dumbbell: { pose: "benchpress", prop: "dumbbell", steps: ["Sit with dumbbells on your thighs, then lie back with them at your chest.", "Press both up until they nearly touch.", "Lower slowly to chest level."] },
  },
  "Overhead press": {
    Barbell: { pose: "ohpress", prop: "barbell" },
    Dumbbell: { pose: "ohpress", prop: "dumbbell", steps: ["Dumbbells at shoulder height, palms forward.", "Press up until arms are straight, dumbbells close together.", "Lower slowly to your shoulders."] },
    Arnold: { pose: "ohpress", prop: "dumbbell", steps: ["Dumbbells in front of your shoulders, palms facing you.", "Press up while turning your palms forward.", "Turn them back as you lower."] },
  },
  Deadlift: {
    Conventional: { pose: "deadlift" },
    Sumo: { pose: "deadlift", steps: ["Feet very wide, toes out, hands inside your knees.", "Push your knees out and stand up with a flat back.", "Lower the bar the same way."] },
    Romanian: { pose: "hinge", steps: ["Stand holding the bar at your hips.", "Push your hips back, bar slides down your thighs to below the knee.", "Squeeze your glutes to stand back up."] },
    "Trap bar": { pose: "deadlift", steps: ["Stand inside the hex bar, grip the side handles.", "Sit down a little more than a normal deadlift, back flat.", "Stand up tall, then lower."] },
  },
  "Bicep curl": {
    Dumbbell: { pose: "curl", prop: "dumbbell" },
    Barbell: { pose: "curl", prop: "barbell", steps: ["Hold a barbell shoulder-width, palms forward.", "Curl it up to your chest, elbows at your sides.", "Lower slowly. Don't swing your back."] },
    Hammer: { pose: "curl", prop: "dumbbell", steps: ["Hold dumbbells with palms facing each other (like hammers).", "Curl up keeping your thumbs on top.", "Lower slowly. Builds forearms too."] },
    Preacher: { pose: "seatcurl", prop: "dumbbell", steps: ["Sit at a preacher bench, back of your arm on the pad.", "Curl the weight up without lifting your elbow.", "Lower until your arm is almost straight."] },
    Concentration: { pose: "seatcurl", prop: "dumbbell", steps: ["Sit on a bench, elbow against your inner thigh.", "Curl the dumbbell up to your shoulder.", "Lower slowly. Squeeze at the top."] },
  },
  "Tricep extension": {
    Overhead: { pose: "ohpress", prop: "dumbbell" },
    "Skull crusher": { pose: "benchpress", prop: "barbell", steps: ["Lie on a bench with an EZ bar above your face.", "Bend only your elbows to lower it to your forehead.", "Straighten your arms again."] },
    "Cable pushdown": { pose: "curl", steps: ["Face a high cable, hold the bar or rope.", "Elbows at your sides, push down until arms are straight.", "Let it rise slowly to 90°."] },
    Kickback: { pose: "row", prop: "dumbbell", steps: ["Hinge forward, upper arm against your side.", "Straighten your elbow to push the dumbbell back.", "Bend it back to 90°."] },
  },
  Running: { Sprint: { pose: "highknee", steps: ["Warm up well first.", "Run all out for 10 to 30 seconds, knees high, arms driving.", "Walk to recover fully, then repeat."] } },
  "Glute bridge": { "Single-leg": { pose: "bridge", steps: ["Lie on your back, one foot flat, other leg straight up.", "Push through the heel on the floor to lift your hips.", "Lower slowly. Switch legs."] } },
  Handstand: { Wall: { pose: "handstand", scene: "wall" }, Freestanding: { pose: "handstand", scene: "none" }, "Push-up": { pose: "hspu", scene: "wall" } },
};

const PROP_IN_NAME: [RegExp, Prop][] = [[/kettle/i, "kettlebell"], [/barbell|\bbar\b|ez.?bar|smith/i, "barbell"], [/dumbbell|\bdb\b/i, "dumbbell"]];

// The picture, equipment and steps for a move and one of its types. A type
// or name that says Barbell, Dumbbell or Kettlebell always holds that.
export function howTo(m: Move | undefined, variant?: string, name?: string): HowTo {
  if (!m) return {};
  const base = MOVE[m.name] ?? {};
  const t = (variant && TYPES[m.name]?.[variant]) || {};
  const named = PROP_IN_NAME.find(([re]) => re.test(variant ?? "") || re.test(name ?? ""))?.[1];
  const out: HowTo = {
    pose: m.ownPose ? m.pose : t.pose ?? PICTURE[m.name]?.pose ?? m.pose ?? base.pose ?? m.pattern,
    prop: m.ownProp ? m.prop : t.prop ?? named ?? PICTURE[m.name]?.prop ?? m.prop ?? base.prop,
    scene: t.scene ?? PICTURE[m.name]?.scene ?? m.scene ?? base.scene,
    steps: m.ownSteps ? m.steps : t.steps ?? m.steps,
  };
  return out;
}

// The type an exercise name already describes, e.g. "Dumbbell curl" → Dumbbell.
export function variantFromName(m: Move | undefined, name: string) {
  const vs = m?.variants ?? [];
  const low = name.toLowerCase();
  return vs.find((v) => low.includes(v.name.toLowerCase()))?.name ?? vs.find((v) => v.factor === 1)?.name ?? vs[0]?.name;
}
