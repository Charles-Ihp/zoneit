import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const exercises = [
  // WARMUP - MOBILITY
  {
    id: "wm1",
    name: "Shoulder Circles & Arm Swings",
    description: "Dynamic arm circles forward and backward, followed by cross-body arm swings.",
    category: "warmup-mobility",
    wallTypes: ["any"],
    levels: ["beginner", "intermediate", "advanced"],
    durationMin: 3,
    durationMax: 5,
    intensity: 1,
    equipment: ["none"],
    injuryRisk: [],
    focus: ["shoulders", "mobility"],
  },
  {
    id: "wm2",
    name: "Wrist & Finger Warm-up",
    description: "Wrist circles, prayer stretches, finger extensions with rubber band.",
    category: "warmup-mobility",
    wallTypes: ["any"],
    levels: ["beginner", "intermediate", "advanced"],
    durationMin: 3,
    durationMax: 5,
    intensity: 1,
    equipment: ["none"],
    injuryRisk: [],
    focus: ["fingers", "wrists"],
  },
  {
    id: "wm3",
    name: "Hip Openers & Leg Swings",
    description: "Deep lunges, hip circles, lateral leg swings to open hips for high feet.",
    category: "warmup-mobility",
    wallTypes: ["any"],
    levels: ["beginner", "intermediate", "advanced"],
    durationMin: 3,
    durationMax: 5,
    intensity: 1,
    equipment: ["none"],
    injuryRisk: [],
    focus: ["hips", "legs"],
  },
  {
    id: "wm4",
    name: "Cat-Cow & Thoracic Rotations",
    description: "Spinal mobility: cat-cow on all fours, then thoracic rotation stretches.",
    category: "warmup-mobility",
    wallTypes: ["any"],
    levels: ["beginner", "intermediate", "advanced"],
    durationMin: 3,
    durationMax: 5,
    intensity: 1,
    equipment: ["none"],
    injuryRisk: [],
    focus: ["spine", "core"],
  },
  {
    id: "wm5",
    name: "Neck & Upper Trap Release",
    description:
      "Slow neck rolls, side tilts, and upper trapezius stretches to release tension before climbing.",
    category: "warmup-mobility",
    wallTypes: ["any"],
    levels: ["beginner", "intermediate", "advanced"],
    durationMin: 2,
    durationMax: 4,
    intensity: 1,
    equipment: ["none"],
    injuryRisk: [],
    focus: ["neck", "upper back"],
  },
  {
    id: "wm6",
    name: "Ankle & Toe Mobility",
    description:
      "Ankle rolls, toe spreads, and calf raises to prepare feet for precise footwork on small holds.",
    category: "warmup-mobility",
    wallTypes: ["any"],
    levels: ["beginner", "intermediate", "advanced"],
    durationMin: 2,
    durationMax: 4,
    intensity: 1,
    equipment: ["none"],
    injuryRisk: [],
    focus: ["ankles", "feet"],
  },

  // WARMUP - CLIMBING
  {
    id: "wc1",
    name: "Easy Traversing",
    description:
      "Traverse the wall at low height, focusing on smooth movement. Stay 2-3 grades below max.",
    category: "warmup-climbing",
    wallTypes: ["any"],
    levels: ["beginner", "intermediate", "advanced"],
    durationMin: 5,
    durationMax: 10,
    intensity: 2,
    equipment: ["none"],
    injuryRisk: [],
    focus: ["movement", "flow"],
  },
  {
    id: "wc2",
    name: "Progressive Ladder",
    description:
      "Climb 3-5 problems, each one grade harder. Start very easy, end 1-2 grades below max.",
    category: "warmup-climbing",
    wallTypes: ["any"],
    levels: ["beginner", "intermediate", "advanced"],
    durationMin: 10,
    durationMax: 15,
    intensity: 3,
    equipment: ["none"],
    injuryRisk: [],
    focus: ["progression", "warm-up"],
  },
  {
    id: "wc3",
    name: "Down-climb Practice",
    description: "Climb easy problems and reverse them. Great for control and warming up slowly.",
    category: "warmup-climbing",
    wallTypes: ["slab", "vertical"],
    levels: ["beginner", "intermediate", "advanced"],
    durationMin: 5,
    durationMax: 10,
    intensity: 2,
    equipment: ["none"],
    injuryRisk: [],
    focus: ["control", "technique"],
  },
  {
    id: "wc4",
    name: "Volume Warm-up",
    description:
      "Flash 5-8 problems well below your grade. Move steadily without stopping to build blood flow.",
    category: "warmup-climbing",
    wallTypes: ["any"],
    levels: ["beginner", "intermediate", "advanced"],
    durationMin: 10,
    durationMax: 20,
    intensity: 3,
    equipment: ["none"],
    injuryRisk: [],
    focus: ["blood flow", "activation"],
  },
  {
    id: "wc5",
    name: "Movement Isolation",
    description:
      "Pick one movement pattern (e.g. heel hooks, underclings) and practice it on easy terrain to activate it before projecting.",
    category: "warmup-climbing",
    wallTypes: ["any"],
    levels: ["intermediate", "advanced"],
    durationMin: 5,
    durationMax: 10,
    intensity: 3,
    equipment: ["none"],
    injuryRisk: [],
    focus: ["movement prep", "activation"],
  },

  // TECHNIQUE
  {
    id: "t1",
    name: "Silent Feet",
    description:
      "Climb easy problems placing feet with zero noise. Focus on precision and awareness.",
    category: "technique",
    wallTypes: ["slab", "vertical"],
    levels: ["beginner", "intermediate", "advanced"],
    durationMin: 8,
    durationMax: 12,
    intensity: 3,
    equipment: ["none"],
    injuryRisk: [],
    focus: ["footwork", "precision"],
  },
  {
    id: "t2",
    name: "Hover Hands",
    description:
      "Before grabbing each hold, hover your hand 2cm away for 2 seconds. Builds intention.",
    category: "technique",
    wallTypes: ["slab", "vertical", "overhang"],
    levels: ["beginner", "intermediate", "advanced"],
    durationMin: 8,
    durationMax: 12,
    intensity: 3,
    equipment: ["none"],
    injuryRisk: [],
    focus: ["precision", "body awareness"],
  },
  {
    id: "t3",
    name: "Sticky Feet",
    description:
      "Once you place a foot, it cannot move. Commit to placements and read the wall ahead.",
    category: "technique",
    wallTypes: ["slab", "vertical"],
    levels: ["beginner", "intermediate", "advanced"],
    durationMin: 8,
    durationMax: 12,
    intensity: 3,
    equipment: ["none"],
    injuryRisk: [],
    focus: ["footwork", "reading"],
  },
  {
    id: "t4",
    name: "Flag & Twist Drills",
    description:
      "On moderate climbs, practice flagging and twisting into every move even when not required.",
    category: "technique",
    wallTypes: ["vertical", "overhang"],
    levels: ["intermediate", "advanced"],
    durationMin: 10,
    durationMax: 15,
    intensity: 4,
    equipment: ["none"],
    injuryRisk: [],
    focus: ["balance", "efficiency"],
  },
  {
    id: "t5",
    name: "Slab Balance Walk",
    description:
      "Climb easy slab using only open hands. Focus on weight over feet and balance points.",
    category: "technique",
    wallTypes: ["slab"],
    levels: ["beginner", "intermediate", "advanced"],
    durationMin: 8,
    durationMax: 12,
    intensity: 2,
    equipment: ["none"],
    injuryRisk: [],
    focus: ["balance", "slab"],
  },
  {
    id: "t6",
    name: "Drop Knee Practice",
    description:
      "Find moderate overhang problems and practice turning hips using drop knees on every move.",
    category: "technique",
    wallTypes: ["overhang", "comp"],
    levels: ["intermediate", "advanced"],
    durationMin: 10,
    durationMax: 15,
    intensity: 5,
    equipment: ["none"],
    injuryRisk: ["knees"],
    focus: ["technique", "efficiency"],
  },
  {
    id: "t7",
    name: "Heel Hook Progressions",
    description:
      "On overhangs, seek out heel hook moves. Practice loading the heel actively and pulling with the hamstring.",
    category: "technique",
    wallTypes: ["overhang", "comp", "spray"],
    levels: ["intermediate", "advanced"],
    durationMin: 10,
    durationMax: 15,
    intensity: 5,
    equipment: ["none"],
    injuryRisk: ["knees"],
    focus: ["heel hooks", "body tension"],
  },
  {
    id: "t8",
    name: "Toe Hook Isolation",
    description:
      "Find problems requiring toe hooks. Focus on engaging the top of the foot and maintaining tension through the core.",
    category: "technique",
    wallTypes: ["overhang", "spray", "moonboard"],
    levels: ["intermediate", "advanced"],
    durationMin: 10,
    durationMax: 15,
    intensity: 5,
    equipment: ["none"],
    injuryRisk: [],
    focus: ["toe hooks", "body tension"],
  },
  {
    id: "t9",
    name: "Pinch & Side-pull Drills",
    description:
      "Climb a circuit of moderate problems focusing exclusively on pinch and side-pull holds. Exaggerate hip position for each.",
    category: "technique",
    wallTypes: ["vertical", "overhang", "comp"],
    levels: ["intermediate", "advanced"],
    durationMin: 10,
    durationMax: 15,
    intensity: 5,
    equipment: ["none"],
    injuryRisk: ["fingers"],
    focus: ["pinch strength", "body position"],
  },
  {
    id: "t10",
    name: "Mantling & Pressing",
    description:
      "Practice pressing over the top of problems and mantling on high volumes. Essential for bouldering topouts.",
    category: "technique",
    wallTypes: ["slab", "vertical"],
    levels: ["beginner", "intermediate", "advanced"],
    durationMin: 8,
    durationMax: 12,
    intensity: 4,
    equipment: ["none"],
    injuryRisk: ["shoulders"],
    focus: ["pressing", "topout"],
  },
  {
    id: "t11",
    name: "Quiet Hips Drill",
    description:
      "Climb moderate problems keeping hips perfectly square to the wall throughout. Then reclimb letting hips rotate naturally — feel the difference.",
    category: "technique",
    wallTypes: ["vertical", "slab"],
    levels: ["beginner", "intermediate"],
    durationMin: 8,
    durationMax: 12,
    intensity: 3,
    equipment: ["none"],
    injuryRisk: [],
    focus: ["hip position", "efficiency"],
  },
  {
    id: "t12",
    name: "No Thumb Climbing",
    description:
      "Climb easy problems using only four fingers (no thumb). Forces open-hand grip and foot reliance.",
    category: "technique",
    wallTypes: ["slab", "vertical"],
    levels: ["beginner", "intermediate", "advanced"],
    durationMin: 8,
    durationMax: 12,
    intensity: 3,
    equipment: ["none"],
    injuryRisk: ["fingers"],
    focus: ["open hand", "footwork"],
  },

  // PROJECTING
  {
    id: "p1",
    name: "Project Burns",
    description:
      "Pick 1-2 problems at your limit. Work moves individually, then link sections. Full rest between attempts.",
    category: "projecting",
    wallTypes: ["any"],
    levels: ["intermediate", "advanced"],
    durationMin: 20,
    durationMax: 40,
    intensity: 9,
    equipment: ["none"],
    injuryRisk: ["fingers", "shoulders"],
    focus: ["max strength", "problem solving"],
  },
  {
    id: "p2",
    name: "Beta Breakdown",
    description:
      "Read a hard problem from the ground. Plan every move before touching the wall. Then execute.",
    category: "projecting",
    wallTypes: ["any"],
    levels: ["beginner", "intermediate", "advanced"],
    durationMin: 15,
    durationMax: 25,
    intensity: 7,
    equipment: ["none"],
    injuryRisk: [],
    focus: ["reading", "strategy"],
  },
  {
    id: "p3",
    name: "Limit Moves",
    description: "Isolate the hardest move on your project. Repeat it 5-8 times with full rest.",
    category: "projecting",
    wallTypes: ["any"],
    levels: ["intermediate", "advanced"],
    durationMin: 15,
    durationMax: 25,
    intensity: 9,
    equipment: ["none"],
    injuryRisk: ["fingers", "shoulders"],
    focus: ["max strength", "power"],
  },
  {
    id: "p4",
    name: "Mirror Beta",
    description:
      "Watch another climber on your project and actively copy their exact sequence. Identify what differences exist in your attempts.",
    category: "projecting",
    wallTypes: ["any"],
    levels: ["intermediate", "advanced"],
    durationMin: 10,
    durationMax: 20,
    intensity: 6,
    equipment: ["none"],
    injuryRisk: [],
    focus: ["reading", "learning"],
  },
  {
    id: "p5",
    name: "Bottom-up Linking",
    description:
      "Link moves starting from the first hold, adding one more each attempt. Build toward a full send.",
    category: "projecting",
    wallTypes: ["any"],
    levels: ["intermediate", "advanced"],
    durationMin: 20,
    durationMax: 40,
    intensity: 9,
    equipment: ["none"],
    injuryRisk: ["fingers"],
    focus: ["linking", "mental game"],
  },
  {
    id: "p6",
    name: "Top-down Linking",
    description:
      "Work a problem from the top down. Master the finish first, then add the preceding moves progressively.",
    category: "projecting",
    wallTypes: ["any"],
    levels: ["intermediate", "advanced"],
    durationMin: 20,
    durationMax: 40,
    intensity: 9,
    equipment: ["none"],
    injuryRisk: ["fingers"],
    focus: ["redpoint strategy", "sections"],
  },

  // POWER
  {
    id: "pw1",
    name: "Campus Laddering",
    description: "Ladder up campus rungs: 1-2-3, 1-3-5, etc. Full rest between sets.",
    category: "power",
    wallTypes: ["any"],
    levels: ["advanced"],
    durationMin: 10,
    durationMax: 20,
    intensity: 9,
    equipment: ["campus-board"],
    injuryRisk: ["fingers", "shoulders", "elbows"],
    focus: ["contact strength", "power"],
  },
  {
    id: "pw2",
    name: "Dyno Practice",
    description: "Find or set dyno problems. Focus on explosive hip drive and coordination.",
    category: "power",
    wallTypes: ["comp", "overhang"],
    levels: ["intermediate", "advanced"],
    durationMin: 15,
    durationMax: 25,
    intensity: 8,
    equipment: ["none"],
    injuryRisk: ["shoulders"],
    focus: ["explosiveness", "coordination"],
  },
  {
    id: "pw3",
    name: "Power Boulders",
    description:
      "Climb short, powerful problems (3-5 moves) near your limit. 3-5 min rest between.",
    category: "power",
    wallTypes: ["overhang", "comp", "spray"],
    levels: ["intermediate", "advanced"],
    durationMin: 20,
    durationMax: 30,
    intensity: 8,
    equipment: ["none"],
    injuryRisk: ["fingers"],
    focus: ["power", "recruitment"],
  },
  {
    id: "pw4",
    name: "Dead Hangs to Big Moves",
    description:
      "Start each boulder with a dead hang of 3s on the first hold, then explode into the move. Trains contact strength from cold.",
    category: "power",
    wallTypes: ["overhang", "comp", "spray"],
    levels: ["intermediate", "advanced"],
    durationMin: 15,
    durationMax: 25,
    intensity: 8,
    equipment: ["none"],
    injuryRisk: ["fingers", "shoulders"],
    focus: ["contact strength", "power"],
  },
  {
    id: "pw5",
    name: "One-Move Monsters",
    description:
      "Find or create single extremely hard moves. Attempt each move 5-8 times with full rest. Focus on maximum recruitment.",
    category: "power",
    wallTypes: ["overhang", "spray", "moonboard"],
    levels: ["advanced"],
    durationMin: 20,
    durationMax: 30,
    intensity: 10,
    equipment: ["none"],
    injuryRisk: ["fingers", "shoulders"],
    focus: ["max power", "recruitment"],
  },
  {
    id: "pw6",
    name: "Depth Jump Toe Hooks",
    description:
      "From a slight drop, land a large move onto a toe hook position. Builds reactive strength in leg-assisted pulling.",
    category: "power",
    wallTypes: ["overhang", "comp"],
    levels: ["advanced"],
    durationMin: 10,
    durationMax: 20,
    intensity: 8,
    equipment: ["none"],
    injuryRisk: ["knees", "ankles"],
    focus: ["reactive power", "coordination"],
  },

  // ENDURANCE
  {
    id: "e1",
    name: "4x4s",
    description:
      "Pick 4 problems 2-3 grades below max. Climb all 4 back-to-back, rest 4 min. Repeat 4 sets.",
    category: "endurance",
    wallTypes: ["any"],
    levels: ["intermediate", "advanced"],
    durationMin: 20,
    durationMax: 35,
    intensity: 7,
    equipment: ["none"],
    injuryRisk: [],
    focus: ["power endurance", "pump"],
  },
  {
    id: "e2",
    name: "ARC Training",
    description: "Climb continuously for 15-20 min at very easy grades. Stay below pump threshold.",
    category: "endurance",
    wallTypes: ["any"],
    levels: ["beginner", "intermediate", "advanced"],
    durationMin: 15,
    durationMax: 25,
    intensity: 3,
    equipment: ["none"],
    injuryRisk: [],
    focus: ["aerobic capacity", "recovery"],
  },
  {
    id: "e3",
    name: "Linked Circuits",
    description: "Link 3-4 easy-to-moderate problems into one continuous circuit. Rest and repeat.",
    category: "endurance",
    wallTypes: ["any"],
    levels: ["beginner", "intermediate", "advanced"],
    durationMin: 15,
    durationMax: 25,
    intensity: 5,
    equipment: ["none"],
    injuryRisk: [],
    focus: ["endurance", "flow"],
  },
  {
    id: "e4",
    name: "Interval Repeaters",
    description: "Climb for 1 min, rest for 1 min. Repeat 8-10 rounds on easy terrain.",
    category: "endurance",
    wallTypes: ["any"],
    levels: ["beginner", "intermediate", "advanced"],
    durationMin: 15,
    durationMax: 25,
    intensity: 5,
    equipment: ["none"],
    injuryRisk: [],
    focus: ["anaerobic endurance"],
  },
  {
    id: "e5",
    name: "Volume Day",
    description: "Flash as many easy-moderate problems as possible. Aim for 30-50 climbs.",
    category: "endurance",
    wallTypes: ["any"],
    levels: ["beginner", "intermediate", "advanced"],
    durationMin: 45,
    durationMax: 90,
    intensity: 4,
    equipment: ["none"],
    injuryRisk: [],
    focus: ["base volume", "movement mileage"],
  },
  {
    id: "e6",
    name: "Spray Wall Endurance",
    description:
      "Set a long sequence on the spray wall or connect several circuits. Climb for max moves before failure.",
    category: "endurance",
    wallTypes: ["spray"],
    levels: ["intermediate", "advanced"],
    durationMin: 20,
    durationMax: 35,
    intensity: 6,
    equipment: ["none"],
    injuryRisk: ["fingers"],
    focus: ["power endurance", "spray wall"],
  },
  {
    id: "e7",
    name: "Rest-step Overhang Laps",
    description:
      "Climb a moderate overhang problem, find a rest position, recover partially, then continue. Repeat 4-6 laps.",
    category: "endurance",
    wallTypes: ["overhang", "comp"],
    levels: ["intermediate", "advanced"],
    durationMin: 15,
    durationMax: 25,
    intensity: 6,
    equipment: ["none"],
    injuryRisk: [],
    focus: ["on-wall recovery", "endurance"],
  },

  // FINGER STRENGTH
  {
    id: "f1",
    name: "Hangboard Repeaters",
    description: "7s hang / 3s rest × 6 reps. 3 min between sets. Half crimp on medium edge.",
    category: "finger-strength",
    wallTypes: ["any"],
    levels: ["intermediate", "advanced"],
    durationMin: 10,
    durationMax: 20,
    intensity: 8,
    equipment: ["hangboard"],
    injuryRisk: ["fingers"],
    focus: ["finger strength", "tendons"],
  },
  {
    id: "f2",
    name: "Max Hangs",
    description: "10s max effort hang with added weight. 3 min rest × 5 sets. Half crimp only.",
    category: "finger-strength",
    wallTypes: ["any"],
    levels: ["advanced"],
    durationMin: 15,
    durationMax: 20,
    intensity: 9,
    equipment: ["hangboard"],
    injuryRisk: ["fingers"],
    focus: ["max finger strength"],
  },
  {
    id: "f3",
    name: "Easy Hangs (Warm-up)",
    description: "Light hangs on large edges: 10s on, 10s off × 5. No added weight.",
    category: "finger-strength",
    wallTypes: ["any"],
    levels: ["beginner", "intermediate", "advanced"],
    durationMin: 5,
    durationMax: 8,
    intensity: 3,
    equipment: ["hangboard"],
    injuryRisk: [],
    focus: ["finger warm-up"],
  },
  {
    id: "f4",
    name: "Open Hand Isolations",
    description:
      "Hang on medium pockets and slopers using open hand only. 3 × 10s hangs with 2 min rest.",
    category: "finger-strength",
    wallTypes: ["any"],
    levels: ["intermediate", "advanced"],
    durationMin: 10,
    durationMax: 15,
    intensity: 7,
    equipment: ["hangboard"],
    injuryRisk: ["fingers"],
    focus: ["open hand", "tendon health"],
  },
  {
    id: "f5",
    name: "Sloper Hangs",
    description: "Hang on sloped holds. 3 × 10s. Focus on wrist, elbow, and shoulder alignment.",
    category: "finger-strength",
    wallTypes: ["any"],
    levels: ["intermediate", "advanced"],
    durationMin: 8,
    durationMax: 12,
    intensity: 7,
    equipment: ["hangboard"],
    injuryRisk: ["fingers", "wrists"],
    focus: ["sloper strength", "contact force"],
  },
  {
    id: "f6",
    name: "Crimp Strength Blocks",
    description: "Work half-crimp on a small edge (20mm). 5s hang / 55s rest × 10 sets.",
    category: "finger-strength",
    wallTypes: ["any"],
    levels: ["advanced"],
    durationMin: 12,
    durationMax: 18,
    intensity: 9,
    equipment: ["hangboard"],
    injuryRisk: ["fingers"],
    focus: ["crimp strength", "max load"],
  },
  {
    id: "f7",
    name: "Pinch Block Squeezes",
    description:
      "Hold a pinch block for 3 × 30s squeezes. Builds thumb opposition and pinch force.",
    category: "finger-strength",
    wallTypes: ["any"],
    levels: ["intermediate", "advanced"],
    durationMin: 5,
    durationMax: 10,
    intensity: 5,
    equipment: ["none"],
    injuryRisk: ["thumbs"],
    focus: ["pinch", "thumb strength"],
  },

  // CORE
  {
    id: "c1",
    name: "Hollow Body Hold",
    description: "30s hold × 3 sets. Arms overhead, legs extended, lower back flat.",
    category: "core",
    wallTypes: ["any"],
    levels: ["beginner", "intermediate", "advanced"],
    durationMin: 5,
    durationMax: 8,
    intensity: 5,
    equipment: ["none"],
    injuryRisk: [],
    focus: ["core tension", "stability"],
  },
  {
    id: "c2",
    name: "Hanging Leg Raises",
    description: "Hang from bar. Raise legs to 90° (or toes to bar). 3 × 8-12 reps.",
    category: "core",
    wallTypes: ["any"],
    levels: ["intermediate", "advanced"],
    durationMin: 5,
    durationMax: 10,
    intensity: 6,
    equipment: ["pull-up-bar"],
    injuryRisk: ["shoulders"],
    focus: ["core", "hip flexors"],
  },
  {
    id: "c3",
    name: "Plank Variations",
    description: "Front plank 45s, side plank 30s each side. 2-3 rounds.",
    category: "core",
    wallTypes: ["any"],
    levels: ["beginner", "intermediate", "advanced"],
    durationMin: 5,
    durationMax: 10,
    intensity: 4,
    equipment: ["none"],
    injuryRisk: [],
    focus: ["core stability"],
  },
  {
    id: "c4",
    name: "L-sit Hold",
    description: "Hang from a pull-up bar and hold an L-sit with legs extended. 3 × 15-30s.",
    category: "core",
    wallTypes: ["any"],
    levels: ["intermediate", "advanced"],
    durationMin: 5,
    durationMax: 10,
    intensity: 7,
    equipment: ["pull-up-bar"],
    injuryRisk: ["shoulders"],
    focus: ["core compression", "hip flexors"],
  },
  {
    id: "c5",
    name: "Front Lever Progressions",
    description: "Tuck → advanced tuck → straddle → full. Hold 3 × 5-10s.",
    category: "core",
    wallTypes: ["any"],
    levels: ["intermediate", "advanced"],
    durationMin: 8,
    durationMax: 15,
    intensity: 8,
    equipment: ["pull-up-bar"],
    injuryRisk: ["shoulders"],
    focus: ["body tension", "straight arm strength"],
  },
  {
    id: "c6",
    name: "Arch Body Rocks",
    description: "Alternate between hollow body and arch body positions. 3 × 15 reps.",
    category: "core",
    wallTypes: ["any"],
    levels: ["beginner", "intermediate", "advanced"],
    durationMin: 5,
    durationMax: 8,
    intensity: 4,
    equipment: ["none"],
    injuryRisk: [],
    focus: ["core control", "body tension"],
  },
  {
    id: "c7",
    name: "Typewriter Pull-ups",
    description: "Pull up to one side, traverse the bar, lower on the other side. 3 × 5 reps.",
    category: "core",
    wallTypes: ["any"],
    levels: ["advanced"],
    durationMin: 5,
    durationMax: 10,
    intensity: 8,
    equipment: ["pull-up-bar"],
    injuryRisk: ["shoulders"],
    focus: ["core", "lat strength"],
  },

  // ANTAGONIST
  {
    id: "a1",
    name: "Push-ups",
    description: "3 × 10-15 push-ups. Slow and controlled. Balance out pulling muscles.",
    category: "antagonist",
    wallTypes: ["any"],
    levels: ["beginner", "intermediate", "advanced"],
    durationMin: 5,
    durationMax: 8,
    intensity: 4,
    equipment: ["none"],
    injuryRisk: [],
    focus: ["chest", "shoulders", "balance"],
  },
  {
    id: "a2",
    name: "Reverse Wrist Curls",
    description: "Light dumbbell or band. 3 × 15 wrist extensions. Prevent elbow issues.",
    category: "antagonist",
    wallTypes: ["any"],
    levels: ["beginner", "intermediate", "advanced"],
    durationMin: 5,
    durationMax: 8,
    intensity: 2,
    equipment: ["resistance-bands"],
    injuryRisk: [],
    focus: ["forearm balance", "elbows"],
  },
  {
    id: "a3",
    name: "External Rotation",
    description: "Band external rotations for rotator cuff health. 3 × 12 each arm.",
    category: "antagonist",
    wallTypes: ["any"],
    levels: ["beginner", "intermediate", "advanced"],
    durationMin: 5,
    durationMax: 8,
    intensity: 2,
    equipment: ["resistance-bands"],
    injuryRisk: [],
    focus: ["shoulders", "prehab"],
  },
  {
    id: "a4",
    name: "Dumbbell Tricep Extensions",
    description: "Overhead tricep extension or skullcrusher. 3 × 12 at light weight.",
    category: "antagonist",
    wallTypes: ["any"],
    levels: ["beginner", "intermediate", "advanced"],
    durationMin: 5,
    durationMax: 8,
    intensity: 3,
    equipment: ["none"],
    injuryRisk: ["elbows"],
    focus: ["triceps", "elbow health"],
  },
  {
    id: "a5",
    name: "Scapular Retractions",
    description:
      "Band pull-aparts and face pulls. 3 × 15. Counteracts protracted shoulder posture.",
    category: "antagonist",
    wallTypes: ["any"],
    levels: ["beginner", "intermediate", "advanced"],
    durationMin: 5,
    durationMax: 8,
    intensity: 2,
    equipment: ["resistance-bands"],
    injuryRisk: [],
    focus: ["scapula", "posture"],
  },
  {
    id: "a6",
    name: "Prone Y-T-W Raises",
    description: "Lying face down, raise arms in Y, T, then W positions. 2 × 10 each.",
    category: "antagonist",
    wallTypes: ["any"],
    levels: ["beginner", "intermediate", "advanced"],
    durationMin: 5,
    durationMax: 8,
    intensity: 2,
    equipment: ["none"],
    injuryRisk: [],
    focus: ["scapula", "shoulder health"],
  },

  // COOLDOWN
  {
    id: "cd1",
    name: "Forearm & Finger Stretches",
    description: "Prayer stretch, reverse prayer, individual finger stretches. Hold 20-30s each.",
    category: "cooldown",
    wallTypes: ["any"],
    levels: ["beginner", "intermediate", "advanced"],
    durationMin: 3,
    durationMax: 5,
    intensity: 1,
    equipment: ["none"],
    injuryRisk: [],
    focus: ["fingers", "forearms"],
  },
  {
    id: "cd2",
    name: "Shoulder & Back Stretch",
    description: "Cross-body shoulder stretch, doorway chest opener, child's pose.",
    category: "cooldown",
    wallTypes: ["any"],
    levels: ["beginner", "intermediate", "advanced"],
    durationMin: 3,
    durationMax: 5,
    intensity: 1,
    equipment: ["none"],
    injuryRisk: [],
    focus: ["shoulders", "back"],
  },
  {
    id: "cd3",
    name: "Hip & Leg Stretch",
    description: "Pigeon stretch, hamstring stretch, quad stretch. Hold 30s each side.",
    category: "cooldown",
    wallTypes: ["any"],
    levels: ["beginner", "intermediate", "advanced"],
    durationMin: 3,
    durationMax: 5,
    intensity: 1,
    equipment: ["none"],
    injuryRisk: [],
    focus: ["hips", "legs"],
  },
  {
    id: "cd4",
    name: "Full Body Cooldown Flow",
    description:
      "Gentle yoga-inspired flow: cat-cow, downward dog, child's pose, seated forward fold.",
    category: "cooldown",
    wallTypes: ["any"],
    levels: ["beginner", "intermediate", "advanced"],
    durationMin: 5,
    durationMax: 10,
    intensity: 1,
    equipment: ["none"],
    injuryRisk: [],
    focus: ["full body", "relaxation"],
  },
  {
    id: "cd5",
    name: "Theraband Finger Flexion",
    description: "Light resistance finger curls to flush forearms and aid recovery.",
    category: "cooldown",
    wallTypes: ["any"],
    levels: ["beginner", "intermediate", "advanced"],
    durationMin: 3,
    durationMax: 5,
    intensity: 1,
    equipment: ["resistance-bands"],
    injuryRisk: [],
    focus: ["fingers", "recovery"],
  },
  {
    id: "cd6",
    name: "Wrist Flexor Deep Stretch",
    description: "Hold a full wrist extension against a flat surface for 45s. Repeat in reverse.",
    category: "cooldown",
    wallTypes: ["any"],
    levels: ["beginner", "intermediate", "advanced"],
    durationMin: 3,
    durationMax: 5,
    intensity: 1,
    equipment: ["none"],
    injuryRisk: [],
    focus: ["wrists", "forearms"],
  },
  {
    id: "cd7",
    name: "Chest & Lat Opener",
    description: "Use a foam roller or doorway to open pecs and lats. 3 × 30s each side.",
    category: "cooldown",
    wallTypes: ["any"],
    levels: ["beginner", "intermediate", "advanced"],
    durationMin: 5,
    durationMax: 8,
    intensity: 1,
    equipment: ["none"],
    injuryRisk: [],
    focus: ["chest", "lats", "posture"],
  },

  // ── Dynos ──────────────────────────────────────────────────────────────────
  {
    id: "ex-dynos-001",
    name: "Beginner Dyno Intro",
    description:
      "Jump between two jugs set at shoulder height, one move apart. Focus on generating power from your legs and timing the catch. 5 × 3 reps.",
    category: "dynos",
    wallTypes: ["comp", "spray", "mixed"],
    levels: ["beginner", "intermediate"],
    durationMin: 10,
    durationMax: 15,
    intensity: 5,
    equipment: ["none"],
    injuryRisk: ["fingers", "shoulders"],
    focus: ["dynos", "coordination", "power"],
  },
  {
    id: "ex-dynos-002",
    name: "Double Dyno Drills",
    description:
      "Both feet leave the wall simultaneously. Start with a small hop between adjacent jugs, progressively increase the span. 4 × 4 reps.",
    category: "dynos",
    wallTypes: ["comp", "spray", "mixed"],
    levels: ["intermediate", "advanced"],
    durationMin: 12,
    durationMax: 18,
    intensity: 7,
    equipment: ["none"],
    injuryRisk: ["fingers", "shoulders", "elbows"],
    focus: ["dynos", "explosive power", "timing"],
  },
  {
    id: "ex-dynos-003",
    name: "Deadpoint Practice",
    description:
      "Control the apex of your reach — throw to a hold and catch it at the exact moment of zero momentum. Use slopes or crimps. 6 × 3 reps.",
    category: "dynos",
    wallTypes: ["comp", "spray", "mixed", "moonboard"],
    levels: ["intermediate", "advanced"],
    durationMin: 15,
    durationMax: 20,
    intensity: 6,
    equipment: ["none"],
    injuryRisk: ["fingers"],
    focus: ["dynos", "deadpoint", "precision"],
  },
  {
    id: "ex-dynos-004",
    name: "Leg-Assisted Dyno",
    description:
      "Drive hard from a high foot, using legs as the primary power source for the jump. Practice on a vertical wall with big holds. 5 × 4 reps.",
    category: "dynos",
    wallTypes: ["comp", "mixed"],
    levels: ["beginner", "intermediate"],
    durationMin: 10,
    durationMax: 15,
    intensity: 5,
    equipment: ["none"],
    injuryRisk: ["knees", "ankles"],
    focus: ["dynos", "leg drive", "coordination"],
  },
  {
    id: "ex-dynos-005",
    name: "Span Dyno Progression",
    description:
      "Set a series of dyno problems with incrementally larger spans. Climb each problem twice before increasing distance. Rest 2 min between.",
    category: "dynos",
    wallTypes: ["spray", "comp"],
    levels: ["intermediate", "advanced"],
    durationMin: 20,
    durationMax: 25,
    intensity: 8,
    equipment: ["none"],
    injuryRisk: ["fingers", "shoulders"],
    focus: ["dynos", "explosive power", "progression"],
  },
  {
    id: "ex-dynos-006",
    name: "One-Arm Deadpoint",
    description:
      "Throw to a distant hold with one hand, aiming for the deadpoint catch. Use a slight hip twist to gain extra reach. 5 × 3 each side.",
    category: "dynos",
    wallTypes: ["moonboard", "spray", "comp"],
    levels: ["advanced"],
    durationMin: 15,
    durationMax: 20,
    intensity: 9,
    equipment: ["none"],
    injuryRisk: ["fingers", "shoulders", "elbows"],
    focus: ["dynos", "deadpoint", "power"],
  },
  {
    id: "ex-dynos-007",
    name: "Dyno to Sloper",
    description:
      "Practice catching slopers dynamically — the grip must engage before you start to fall. 4 × 3 reps. Rest fully between attempts.",
    category: "dynos",
    wallTypes: ["comp", "mixed"],
    levels: ["intermediate", "advanced"],
    durationMin: 12,
    durationMax: 18,
    intensity: 7,
    equipment: ["none"],
    injuryRisk: ["fingers", "wrists"],
    focus: ["dynos", "sloper", "catch technique"],
  },
  {
    id: "ex-dynos-008",
    name: "Reverse Dyno (Down Jump)",
    description:
      "Start high and jump down to a lower hold, practicing controlled landings and re-engagement. Great for body tension. 4 × 4 reps.",
    category: "dynos",
    wallTypes: ["spray", "comp"],
    levels: ["intermediate", "advanced"],
    durationMin: 10,
    durationMax: 15,
    intensity: 6,
    equipment: ["none"],
    injuryRisk: ["fingers", "shoulders"],
    focus: ["dynos", "body tension", "control"],
  },

  // ── Handstand ──────────────────────────────────────────────────────────────
  {
    id: "hs1",
    name: "Wall Handstand Hold",
    description:
      "Kick up to a handstand against the wall (chest facing wall). Hold for 30-60s focusing on straight body line. 3-5 sets.",
    category: "handstand",
    wallTypes: ["any"],
    levels: ["beginner", "intermediate", "advanced"],
    durationMin: 5,
    durationMax: 10,
    intensity: 5,
    equipment: ["none"],
    injuryRisk: ["wrists", "shoulders"],
    focus: ["handstand", "shoulder stability", "balance"],
  },
  {
    id: "hs2",
    name: "Chest-to-Wall Shoulder Taps",
    description:
      "In a wall handstand (chest facing wall), lift one hand and tap your shoulder. Alternate sides. 3 × 10 taps total.",
    category: "handstand",
    wallTypes: ["any"],
    levels: ["intermediate", "advanced"],
    durationMin: 5,
    durationMax: 10,
    intensity: 6,
    equipment: ["none"],
    injuryRisk: ["wrists", "shoulders"],
    focus: ["handstand", "balance", "weight shift"],
  },
  {
    id: "hs3",
    name: "Wall Handstand Walk-ups",
    description:
      "Start in a push-up position with feet against the wall. Walk hands back while walking feet up the wall into a handstand. Walk back down. 5-8 reps.",
    category: "handstand",
    wallTypes: ["any"],
    levels: ["beginner", "intermediate"],
    durationMin: 5,
    durationMax: 10,
    intensity: 5,
    equipment: ["none"],
    injuryRisk: ["wrists", "shoulders"],
    focus: ["handstand", "shoulder strength", "control"],
  },
  {
    id: "hs4",
    name: "Freestanding Handstand Practice",
    description:
      "Kick up to a freestanding handstand away from the wall. Focus on finger balance and hip alignment. Practice for 5-10 min.",
    category: "handstand",
    wallTypes: ["any"],
    levels: ["intermediate", "advanced"],
    durationMin: 5,
    durationMax: 15,
    intensity: 6,
    equipment: ["none"],
    injuryRisk: ["wrists", "shoulders"],
    focus: ["handstand", "balance", "proprioception"],
  },
  {
    id: "hs5",
    name: "Pike Handstand Push-ups",
    description:
      "In a pike position (feet elevated on a box or bench), perform handstand push-up motion. 3 × 8-12 reps.",
    category: "handstand",
    wallTypes: ["any"],
    levels: ["beginner", "intermediate", "advanced"],
    durationMin: 5,
    durationMax: 10,
    intensity: 6,
    equipment: ["none"],
    injuryRisk: ["shoulders"],
    focus: ["handstand", "pressing strength", "shoulders"],
  },
  {
    id: "hs6",
    name: "Wall Handstand Push-ups",
    description:
      "From a wall handstand position (back to wall), lower head to floor and press back up. 3 × 5-10 reps.",
    category: "handstand",
    wallTypes: ["any"],
    levels: ["intermediate", "advanced"],
    durationMin: 8,
    durationMax: 15,
    intensity: 8,
    equipment: ["none"],
    injuryRisk: ["wrists", "shoulders", "neck"],
    focus: ["handstand", "pressing strength", "power"],
  },
  {
    id: "hs7",
    name: "Handstand Wrist Prep",
    description:
      "Wrist circles, flexor/extensor stretches, and knuckle pushups to prepare wrists for handstand loading. Essential before any handstand work.",
    category: "handstand",
    wallTypes: ["any"],
    levels: ["beginner", "intermediate", "advanced"],
    durationMin: 3,
    durationMax: 5,
    intensity: 2,
    equipment: ["none"],
    injuryRisk: [],
    focus: ["wrists", "mobility", "warm-up"],
  },
  {
    id: "hs8",
    name: "Crow Pose to Handstand",
    description:
      "Start in crow pose, then press or kick into a handstand. Focus on control and hip placement. 5-8 attempts.",
    category: "handstand",
    wallTypes: ["any"],
    levels: ["advanced"],
    durationMin: 8,
    durationMax: 15,
    intensity: 7,
    equipment: ["none"],
    injuryRisk: ["wrists", "shoulders"],
    focus: ["handstand", "transitions", "control"],
  },
  {
    id: "hs9",
    name: "Handstand Leg Scissors",
    description:
      "In a wall handstand, slowly split legs front and back, then switch. Builds hip mobility and balance. 3 × 10 switches.",
    category: "handstand",
    wallTypes: ["any"],
    levels: ["intermediate", "advanced"],
    durationMin: 5,
    durationMax: 10,
    intensity: 6,
    equipment: ["none"],
    injuryRisk: ["wrists", "shoulders"],
    focus: ["handstand", "hip mobility", "control"],
  },
  {
    id: "hs10",
    name: "Straddle Handstand Hold",
    description:
      "Hold a handstand with legs in a wide straddle position. Easier balance point than straight legs. 3 × 20-30s.",
    category: "handstand",
    wallTypes: ["any"],
    levels: ["intermediate", "advanced"],
    durationMin: 5,
    durationMax: 10,
    intensity: 5,
    equipment: ["none"],
    injuryRisk: ["wrists", "shoulders"],
    focus: ["handstand", "balance", "hip flexibility"],
  },
  {
    id: "hs11",
    name: "Tuck Handstand Hold",
    description:
      "Hold a handstand with knees tucked to chest. Great for learning balance and body awareness. 3 × 15-30s.",
    category: "handstand",
    wallTypes: ["any"],
    levels: ["beginner", "intermediate"],
    durationMin: 5,
    durationMax: 10,
    intensity: 4,
    equipment: ["none"],
    injuryRisk: ["wrists"],
    focus: ["handstand", "balance", "progression"],
  },
  {
    id: "hs12",
    name: "Handstand Pirouette Practice",
    description:
      "From a freestanding handstand, practice 90° and 180° rotations. Focus on finger control. 5-10 min practice.",
    category: "handstand",
    wallTypes: ["any"],
    levels: ["advanced"],
    durationMin: 10,
    durationMax: 15,
    intensity: 7,
    equipment: ["none"],
    injuryRisk: ["wrists", "shoulders"],
    focus: ["handstand", "rotation", "advanced balance"],
  },
  {
    id: "hs13",
    name: "Wall Handstand Toe Taps",
    description:
      "In a wall handstand, lightly tap one toe off the wall and return. Alternate feet. 3 × 10 taps each side.",
    category: "handstand",
    wallTypes: ["any"],
    levels: ["intermediate", "advanced"],
    durationMin: 5,
    durationMax: 10,
    intensity: 5,
    equipment: ["none"],
    injuryRisk: ["wrists", "shoulders"],
    focus: ["handstand", "balance", "independence"],
  },
  {
    id: "hs14",
    name: "Handstand Wall Walks (Lateral)",
    description:
      "In a wall handstand, walk hands sideways along the wall. Go 5 steps left, then 5 steps right. 3 sets.",
    category: "handstand",
    wallTypes: ["any"],
    levels: ["intermediate", "advanced"],
    durationMin: 5,
    durationMax: 10,
    intensity: 6,
    equipment: ["none"],
    injuryRisk: ["wrists", "shoulders"],
    focus: ["handstand", "shoulder stability", "control"],
  },
  {
    id: "hs15",
    name: "Headstand to Handstand Press",
    description:
      "Start in a headstand, then press up to a full handstand. Lower back down with control. 5-8 reps.",
    category: "handstand",
    wallTypes: ["any"],
    levels: ["advanced"],
    durationMin: 8,
    durationMax: 15,
    intensity: 8,
    equipment: ["none"],
    injuryRisk: ["wrists", "shoulders", "neck"],
    focus: ["handstand", "pressing strength", "control"],
  },
  {
    id: "hs16",
    name: "Hollow Body Handstand Drill",
    description:
      "Practice hollow body position on the ground, then apply it in a wall handstand. Focus on posterior pelvic tilt. 5 × 30s.",
    category: "handstand",
    wallTypes: ["any"],
    levels: ["beginner", "intermediate", "advanced"],
    durationMin: 5,
    durationMax: 10,
    intensity: 4,
    equipment: ["none"],
    injuryRisk: [],
    focus: ["handstand", "body alignment", "core"],
  },
  {
    id: "hs17",
    name: "Handstand Negative (Slow Descent)",
    description:
      "Kick up to handstand and lower down as slowly as possible with control. Focus on eccentric strength. 5-8 reps.",
    category: "handstand",
    wallTypes: ["any"],
    levels: ["intermediate", "advanced"],
    durationMin: 5,
    durationMax: 10,
    intensity: 6,
    equipment: ["none"],
    injuryRisk: ["wrists", "shoulders"],
    focus: ["handstand", "control", "eccentric strength"],
  },
  {
    id: "hs18",
    name: "Fingertip Handstand Hold",
    description:
      "Hold a wall handstand on fingertips only (no palm contact). Builds finger strength for balance corrections. 3 × 10-20s.",
    category: "handstand",
    wallTypes: ["any"],
    levels: ["advanced"],
    durationMin: 5,
    durationMax: 10,
    intensity: 7,
    equipment: ["none"],
    injuryRisk: ["wrists", "fingers"],
    focus: ["handstand", "finger strength", "balance"],
  },
];

async function main() {
  console.log("Seeding exercises…");
  for (const ex of exercises) {
    await prisma.exercise.upsert({
      where: { id: ex.id },
      update: ex,
      create: ex,
    });
  }
  console.log(`Seeded ${exercises.length} exercises.`);

  console.log("Seeding app config…");
  const configs: { key: string; value: string }[] = [{ key: "testingMode", value: "true" }];
  for (const cfg of configs) {
    await prisma.appConfig.upsert({
      where: { key: cfg.key },
      update: {},
      create: cfg,
    });
  }
  console.log("App config seeded.");

  console.log("Seeding bouldering terms…");
  const terms: { term: string; definition: string; letter: string }[] = [
    // A
    {
      term: "Antagonistic",
      definition:
        "The antagonistic muscles are those responsible for pushing as opposed to pulling.",
      letter: "A",
    },
    {
      term: "Antihydral",
      definition: "A skin drying agent that reduces the hand's sweating.",
      letter: "A",
    },
    {
      term: "Ape Index",
      definition: "The difference between your arm span and height.",
      letter: "A",
    },
    {
      term: "Approach Shoe",
      definition: "A hybrid between a running shoe and a hiking boot.",
      letter: "A",
    },
    {
      term: "Arch",
      definition:
        "The arched middle part of the sole of the foot that lies between the toes and the ankle. Or a steeply overhanging arete.",
      letter: "A",
    },
    {
      term: "Arete",
      definition:
        "A protruding rock feature that is formed by the meeting of two planes. The opposite to a corner.",
      letter: "A",
    },
    {
      term: "Arm Bar",
      definition:
        "A crack climbing technique in which an arm is inserted deep into the crack and secured by pressing the palm of the hand against one wall and the tricep/shoulder against the other.",
      letter: "A",
    },
    // B
    {
      term: "Backstep",
      definition:
        "A technique in which one foot inside edges while the other outside edges. Similar to a dropknee.",
      letter: "B",
    },
    {
      term: "Back and Foot",
      definition:
        "A method of climbing chimneys in which the back is pressed against one side while the feet push against the other.",
      letter: "B",
    },
    {
      term: "Barndoor",
      definition: "An unintentional, uncontrolled rotation away from the rock.",
      letter: "B",
    },
    {
      term: "Belaying",
      definition: "Paying out or taking in the rope while another climber climbs.",
      letter: "B",
    },
    {
      term: "Beta",
      definition:
        "A description of how to climb a specific problem, usually refers to the best (ie. easiest) way.",
      letter: "B",
    },
    {
      term: "Bicycle",
      definition:
        "A technique in which one foot pushes a hold conventionally while the other foot toe hooks the same, or a nearby, hold. Most commonly used when climbing roofs (AKA clamp).",
      letter: "B",
    },
    {
      term: "Body Position",
      definition: "The position of the body relative to the hand and foot holds.",
      letter: "B",
    },
    {
      term: "Body Tension",
      definition:
        "The ability to keep the feet on their foot holds when climbing steep rock. Core strength and technique are components of body tension.",
      letter: "B",
    },
    {
      term: "Bolt On",
      definition: "A resin or wood hold that is bolted to the surface of a climbing wall.",
      letter: "B",
    },
    {
      term: "Boss",
      definition: "A rounded lump protruding from the rock that can be used as a hand hold.",
      letter: "B",
    },
    {
      term: "Bouldering Pad",
      definition:
        "A rectangular crash mat that consists of multiple layers of foam covered in a heavy duty material. The pad is placed where the climber is expected to fall to cushion their landing (AKA bouldering mat).",
      letter: "B",
    },
    { term: "Break", definition: "A horizontal, often rounded, crack.", letter: "B" },
    {
      term: "Bridging",
      definition:
        "Pushing onwards with the hands and/or feet. Usually done in corners or grooves, but can also be done between two protruding holds (AKA stemming).",
      letter: "B",
    },
    {
      term: "Buildering",
      definition: "Bouldering on buildings or other man-made structures.",
      letter: "B",
    },
    { term: "Bulge", definition: "A rounded roof or overhang.", letter: "B" },
    {
      term: "Bump",
      definition: "Making two consecutive hand moves with the same hand (AKA going again).",
      letter: "B",
    },
    { term: "Buttress", definition: "A prominent rock face protruding from a crag.", letter: "B" },
    // C
    {
      term: "Callouses",
      definition: "Areas of hard skin that can develop on the fingers or palm.",
      letter: "C",
    },
    {
      term: "Campus Board",
      definition:
        "A training device that consists of a small overhanging board crossed by wooden rungs at regular intervals. The idea is to climb it without using the feet so as to develop arm and finger strength.",
      letter: "C",
    },
    { term: "Campusing", definition: "Climbing without using the feet.", letter: "C" },
    {
      term: "Centre of Gravity",
      definition:
        "The theoretical point where the entire mass of a body is concentrated (abbreviated to CoG).",
      letter: "C",
    },
    {
      term: "Chalk",
      definition:
        "Magnesium Carbonate (MgCO₃) is a white powder that is used to absorb sweat from a climber's hands.",
      letter: "C",
    },
    {
      term: "Chalk Bag",
      definition: "A small pouch for holding chalk that is hung on a belt tied around the waist.",
      letter: "C",
    },
    { term: "Chalk Ball", definition: "A small round mesh bag filled with chalk.", letter: "C" },
    {
      term: "Chalk Bucket",
      definition: "A large chalk bag designed to be left on the ground.",
      letter: "C",
    },
    { term: "Chalking Up", definition: "Coating the hands with chalk.", letter: "C" },
    {
      term: "Cheatstone",
      definition:
        "A stone placed at the bottom of a problem to bring the starting holds into reach.",
      letter: "C",
    },
    {
      term: "Chicken Head",
      definition: "A protruding lump of rock, most common on granite.",
      letter: "C",
    },
    {
      term: "Chicken Wing",
      definition:
        "A jamming technique in which the arm is bent and inserted into a crack elbow first with the palm pressed against one wall while the tricep/shoulder presses against the other. Similar to an arm bar.",
      letter: "C",
    },
    {
      term: "Chimney",
      definition: "A wide crack that is large enough to climb into.",
      letter: "C",
    },
    {
      term: "Chipping",
      definition: "Creating or enhancing a climbing hold. The worst sin a climber can commit.",
      letter: "C",
    },
    { term: "Choss", definition: "Loose, dirty or otherwise unappealing rock.", letter: "C" },
    {
      term: "Chunking",
      definition:
        "Breaking down a move or problem into small sections to figure out how to climb it.",
      letter: "C",
    },
    {
      term: "Circuit",
      definition:
        "Either a grouping of problems of similar difficulty (most common in Fontainebleau, France) or a long problem, often a loop, climbed on an indoor wall to train endurance.",
      letter: "C",
    },
    {
      term: "Climbing Shoes",
      definition: "Tight fitting, rubber covered shoes designed for rock climbing.",
      letter: "C",
    },
    {
      term: "Cobble",
      definition: "An embedded stone that is used as a hold. Usually rounded and smooth.",
      letter: "C",
    },
    {
      term: "Compression",
      definition:
        "A technique for climbing symmetrical features by placing a hand (or foot) on either side and pulling hard to hold the body in place.",
      letter: "C",
    },
    {
      term: "Conditions",
      definition: "The suitability of the temperature, humidity, wind etc. for climbing.",
      letter: "C",
    },
    {
      term: "Conglomerate",
      definition:
        "A sedimentary rock type that is mainly composed of embedded round stones (cobbles).",
      letter: "C",
    },
    { term: "Core", definition: "The muscles of the stomach, lower back and legs.", letter: "C" },
    {
      term: "Corner",
      definition: "A feature formed where two planes meet at roughly right angles (AKA dihedral).",
      letter: "C",
    },
    {
      term: "Crag",
      definition:
        "A generic term for a climbing or bouldering area. May also refer specifically to an outcrop of rock.",
      letter: "C",
    },
    {
      term: "Crimp",
      definition:
        "A small edge. Also a powerful grip in which the second finger joint is bent sharply and the thumb presses onto the index finger (AKA full crimp).",
      letter: "C",
    },
    {
      term: "Cross Through",
      definition:
        "A traversing move in which one hand reaches past (over or under) the other to reach the next hold.",
      letter: "C",
    },
    {
      term: "Crystal",
      definition:
        "A small piece of quartz that can be used as a hold, common on some types of granite.",
      letter: "C",
    },
    { term: "Crux", definition: "A problem's hardest move.", letter: "C" },
    {
      term: "Cusp",
      definition:
        "A grip in which a protruding hold is squeezed, over the top or around the side, between the fingers and palm, with the fingers on the side nearest the body (AKA guppy).",
      letter: "C",
    },
    {
      term: "Cutting Loose",
      definition:
        "When both feet swing off the rock and all the climber's weight is taken by the hands.",
      letter: "C",
    },
    // D
    {
      term: "Dab",
      definition:
        "When, mid ascent, a climber brushes off or hits into their spotter, a tree, the ground, another boulder or a pad.",
      letter: "D",
    },
    {
      term: "Deadhang",
      definition: "To hang with straight arms without any assistance from the feet.",
      letter: "D",
    },
    {
      term: "Deadpoint",
      definition:
        "The instant in a movement when the body is moving neither up nor down, the ideal time to grab a hold.",
      letter: "D",
    },
    {
      term: "Deep Water Soloing",
      definition: "Climbing above water without a rope, often abbreviated to DWS.",
      letter: "D",
    },
    {
      term: "Descent Route",
      definition: "The way down from a boulder (AKA downclimb).",
      letter: "D",
    },
    { term: "Diagonal Stride", definition: "Using opposing limbs in coordination.", letter: "D" },
    {
      term: "Double Dyno",
      definition:
        "A dyno in which the target hold or holds are simultaneously grabbed with both hands.",
      letter: "D",
    },
    {
      term: "Down Climbing",
      definition:
        "Reversing down a problem either as a retreat or as a means of getting off a boulder.",
      letter: "D",
    },
    {
      term: "Dropknee",
      definition:
        "When one foot inside edges while the other outside edges, the knee of the outside edging leg is lowered so that the feet are pushing away from each other rather than down (AKA Egyptian).",
      letter: "D",
    },
    { term: "Dynamic", definition: "Any move that uses momentum.", letter: "D" },
    {
      term: "Dyno",
      definition:
        "An all out leap during which the whole body is airborne and has, very briefly, no contact with the rock.",
      letter: "D",
    },
    // E
    { term: "Edge", definition: "A flat horizontal hold.", letter: "E" },
    { term: "Edging", definition: "Standing on an edge.", letter: "E" },
    {
      term: "Eliminate",
      definition:
        "A contrived problem in which certain holds are deemed off limits to make the climbing harder.",
      letter: "E",
    },
    // F
    {
      term: "Featured Wall",
      definition: "An indoor wall that is designed to resemble real rock.",
      letter: "F",
    },
    {
      term: "Figure Four",
      definition:
        "A very rarely used technique for making a long static reach from a positive hold. Involves hooking a leg over the holding arm.",
      letter: "F",
    },
    {
      term: "Finger Jam",
      definition:
        "A jam in which the fingers are inserted into a crack and rotated until they are wedged.",
      letter: "F",
    },
    {
      term: "Finger Tape",
      definition: "Strong tape designed to provide support to injured fingers.",
      letter: "F",
    },
    {
      term: "Fingerboard",
      definition:
        "A small wooden or resin board covered in hand holds that is hung from to train finger strength.",
      letter: "F",
    },
    {
      term: "First Ascent",
      definition: "The first time a boulder problem is climbed.",
      letter: "F",
    },
    {
      term: "Fist Jam",
      definition: "A jam in which the fist is inserted into a crack.",
      letter: "F",
    },
    {
      term: "Flagging",
      definition: "To dangle one leg in the air for balance, usually done on steep rock.",
      letter: "F",
    },
    { term: "Flake", definition: "A thin, partially detached, slice of rock.", letter: "F" },
    {
      term: "Flapper",
      definition: "When a large chunk of skin is ripped off, usually during a dynamic move.",
      letter: "F",
    },
    {
      term: "Flared",
      definition: "A crack with sides that taper outwards making it very difficult to jam.",
      letter: "F",
    },
    {
      term: "Flash",
      definition: "To climb a problem on the first try from start to finish.",
      letter: "F",
    },
    {
      term: "Fontainebleau",
      definition:
        "The famous bouldering area just south of Paris, France (AKA Font or Bleau). Also a system for grading boulder problems, the grade is often prefixed with 'Font'.",
      letter: "F",
    },
    {
      term: "Foot Cam",
      definition:
        "A technique in which the foot is rotated around the heel until it wedges, works well in horizontal cracks or breaks.",
      letter: "F",
    },
    {
      term: "Foot Jam",
      definition: "A jamming technique in which the foot is wedged, toes first, into a crack.",
      letter: "F",
    },
    {
      term: "Foot Swap",
      definition: "Replacing one foot for another on a foot hold.",
      letter: "F",
    },
    { term: "Footwork", definition: "The art of using the feet well.", letter: "F" },
    {
      term: "Friction",
      definition: "The force created when skin or rubber is pressed into the rock.",
      letter: "F",
    },
    {
      term: "Frogging",
      definition:
        "Getting the hips parallel and as close as possible to the wall with the knees pointing out to the sides.",
      letter: "F",
    },
    {
      term: "Front Lever",
      definition:
        "A strength exercise that involves hanging from a bar, raising the body so it's horizontal and holding that position for as long as possible.",
      letter: "F",
    },
    {
      term: "Front Pointing",
      definition: "Standing on a hold with the tip of the big toe.",
      letter: "F",
    },
    {
      term: "Full-body Stem",
      definition: "Climbing a very wide crack with the hands on one wall and feet on the other.",
      letter: "F",
    },
    // G
    { term: "Gabbro", definition: "A coarse grained, rough igneous rock.", letter: "G" },
    {
      term: "Gaston",
      definition:
        "Gripping a vertical hold with the arm bent at the elbow and the hand, thumb down, pulling the hold away from the body.",
      letter: "G",
    },
    {
      term: "Golfer's Elbow",
      definition:
        "Aches and pains in the inside of the elbows caused by a lack of balance between the pushing and pulling muscles.",
      letter: "G",
    },
    {
      term: "Grades",
      definition:
        "An indication of how difficult it is to climb a problem assuming good conditions and the best sequence.",
      letter: "G",
    },
    {
      term: "Granite",
      definition: "A rough, igneous rock that consists mainly of quartz, mica, and feldspar.",
      letter: "G",
    },
    {
      term: "Gritstone",
      definition: "A hard, coarse grained form of sandstone (AKA grit).",
      letter: "G",
    },
    { term: "Groove", definition: "A shallow corner.", letter: "G" },
    {
      term: "Ground Up",
      definition:
        "Attempting and climbing a problem or route without inspecting it from a rope and starting from the ground on each attempt.",
      letter: "G",
    },
    {
      term: "Guidebook",
      definition:
        "A book containing information about a bouldering area (or areas) including details of the problems, directions, maps and photos.",
      letter: "G",
    },
    // H
    {
      term: "Half Crimp",
      definition:
        "A versatile grip in which the fingers are partially bent. It's a compromise between open handing and crimping and is particularly useful on flat holds.",
      letter: "H",
    },
    {
      term: "Hand Jam",
      definition:
        "A jam in which an open hand is inserted into a crack and pressed against the sides with the knuckles against one side, fingertips and palm against the other.",
      letter: "H",
    },
    {
      term: "Hand Stacking",
      definition: "An advanced technique for hand jamming in offwidth cracks.",
      letter: "H",
    },
    {
      term: "Headpointing",
      definition: "Climbing a route or problem after rehearsing the moves on a top rope first.",
      letter: "H",
    },
    {
      term: "Heel Hooking",
      definition: "Placing the heel of the foot on a hold and using it like an extra hand.",
      letter: "H",
    },
    { term: "Heel-toe Jam", definition: "A jam used in wide cracks.", letter: "H" },
    { term: "Highball", definition: "A tall boulder problem.", letter: "H" },
    { term: "Hueco", definition: "A large rounded pocket.", letter: "H" },
    // I
    {
      term: "Inside Edge",
      definition: "The straight edge running along the inside of the big toe.",
      letter: "I",
    },
    {
      term: "Intermediate",
      definition: "A small hold that is used briefly during a reach to a distant hold.",
      letter: "I",
    },
    // J
    { term: "Jamming", definition: "Wedging a body part into a crack.", letter: "J" },
    { term: "Jug", definition: "A large incut hold (AKA bucket).", letter: "J" },
    {
      term: "Jump",
      definition:
        "A dynamic movement in which one hand stays on while both feet leave the rock. There is at least one point of contact at all times.",
      letter: "J",
    },
    {
      term: "Jump Start",
      definition: "Jumping from the ground to the starting holds of a problem (AKA French start).",
      letter: "J",
    },
    // K
    {
      term: "Kipping",
      definition: "Kicking the legs to generate momentum when hanging from the arms.",
      letter: "K",
    },
    {
      term: "Kneebars",
      definition:
        "A jam that leverages between foot and knee. The foot stands on a conventional hold while the knee (really the front or side of the lower thigh) presses into a corner, overlap or large protruding hold.",
      letter: "K",
    },
    // L
    { term: "Lace Ups", definition: "Climbing shoes that are fastened with laces.", letter: "L" },
    { term: "Landing", definition: "The landing zone beneath a problem.", letter: "L" },
    {
      term: "Launch Pad",
      definition:
        "A small bouldering pad that is designed to protect the start of a problem or as a supplement to other larger pads.",
      letter: "L",
    },
    {
      term: "Layback",
      definition:
        "A technique for climbing continuous vertical features such as cracks, flakes or aretes, that relies on opposition created by pulling with the hands and pushing with the feet (AKA liebacking).",
      letter: "L",
    },
    {
      term: "Link Up",
      definition:
        "Combining sections or whole problems together to create a more difficult challenge.",
      letter: "L",
    },
    {
      term: "Linking",
      definition:
        "Practising sections of a problem to prepare for the complete ascent from start to finish.",
      letter: "L",
    },
    {
      term: "Limestone",
      definition:
        "A sedimentary rock composed of skeletal fragments of marine organisms such as coral.",
      letter: "L",
    },
    {
      term: "Liquid Chalk",
      definition:
        "A mix of alcohol and chalk that is rubbed into the hands to coat them with chalk.",
      letter: "L",
    },
    {
      term: "Lock Off",
      definition: "A static reach done with the holding arm bent sharply.",
      letter: "L",
    },
    { term: "Lowball", definition: "A low or short boulder problem.", letter: "L" },
    // M
    {
      term: "Mantel",
      definition:
        'A method of getting from hanging the lip of a boulder or ledge to standing on it (short for mantel-shelf). Also a verb, "mantel the ledge".',
      letter: "M",
    },
    {
      term: "Matching",
      definition: "Placing both hands side by side on a hold (AKA sharing).",
      letter: "M",
    },
    {
      term: "Midge",
      definition:
        "Tiny (1–4mm) flying insects which are most common in temperate climates during the summer months on humid, still days.",
      letter: "M",
    },
    { term: "Mono", definition: "A small pocket that can only fit one finger.", letter: "M" },
    { term: "Monzonite", definition: "An igneous rock type, similar to granite.", letter: "M" },
    {
      term: "Morpho",
      definition:
        'A climb or move whose difficulty is highly dependent on the body shape or size of the climber. Usually code for "hard for the short".',
      letter: "M",
    },
    // N
    {
      term: "No Hands Rest",
      definition: "An excellent resting position that doesn't require use of the hands.",
      letter: "N",
    },
    // O
    {
      term: "Offwidth",
      definition: "A crack that is too wide to jam but too narrow to climb inside.",
      letter: "O",
    },
    {
      term: "Open Hand",
      definition: "Gripping a hold with the fingers only slightly bent.",
      letter: "O",
    },
    {
      term: "Opposition",
      definition:
        "Creating tension either by pulling a pair of holds that face away from each other or pushing on a pair of holds that face each other.",
      letter: "O",
    },
    {
      term: "Outside Edge",
      definition:
        "The curved section of a climbing shoe between the tip of the big toe and the side of the little toe.",
      letter: "O",
    },
    {
      term: "Over Gripping",
      definition: "Holding on with the hands harder than necessary, wasting strength and energy.",
      letter: "O",
    },
    { term: "Overlap", definition: "A small roof.", letter: "O" },
    { term: "Overhanging", definition: "Rock that is steeper than vertical.", letter: "O" },
    // P
    { term: "Palming", definition: "Pressing the palm of the hand onto the rock.", letter: "P" },
    {
      term: "Parkour",
      definition:
        "A physical discipline that focuses on movement around obstacles by vaulting, rolling, running, climbing, and jumping (AKA free running).",
      letter: "P",
    },
    { term: "Patioing", definition: "Improving a landing by shifting rocks.", letter: "P" },
    {
      term: "Pebbles",
      definition: "Tiny stones protruding from the surface of the rock, most common on gritstone.",
      letter: "P",
    },
    {
      term: "Pinch",
      definition: "A hand hold that is squeezed between the fingers and thumb.",
      letter: "P",
    },
    {
      term: "Pocket",
      definition: "A hole in the rock that can be used as a hand or foot hold.",
      letter: "P",
    },
    {
      term: "Pof",
      definition:
        "Dried pine resin that is wrapped in a cloth and slapped onto hand and foot holds. It's used by a minority of climbers in Fontainebleau but most climbers consider it very damaging to the rock (AKA resin).",
      letter: "P",
    },
    {
      term: "Power Endurance",
      definition: "The ability to do multiple hard moves in a row.",
      letter: "P",
    },
    {
      term: "Powerspot",
      definition:
        "When the spotter takes some of the climber's weight so they can get the feel of a move.",
      letter: "P",
    },
    { term: "Problem", definition: "A bouldering route.", letter: "P" },
    {
      term: "Project",
      definition:
        "A problem that has been attempted but hasn't yet been climbed or a problem that an individual is working towards climbing ie. a personal goal.",
      letter: "P",
    },
    { term: "Prow", definition: "A narrow overhanging arete.", letter: "P" },
    {
      term: "Pumped",
      definition:
        "When the forearms become filled with lactic acid after a bout of hard or sustained climbing.",
      letter: "P",
    },
    // R
    { term: "Reading", definition: "Analysing how to climb a problem.", letter: "R" },
    {
      term: "Red Herrings",
      definition:
        "Holds that aren't essential to the sequence and only serve to distract and confuse.",
      letter: "R",
    },
    {
      term: "Rockover",
      definition:
        "Placing a foot on a high hold and standing up on it using a combination of pulling with the arms and pushing with the legs.",
      letter: "R",
    },
    { term: "Roof", definition: "An approximately horizontal piece of rock.", letter: "R" },
    {
      term: "Rubber",
      definition: "The sticky compound that is used on the soles of climbing shoes.",
      letter: "R",
    },
    {
      term: "Run and Jump",
      definition:
        "A dynamic technique that involves running at the rock, kicking off one or more foot holds and jumping for the hand holds.",
      letter: "R",
    },
    // S
    {
      term: "Sandbag",
      definition:
        "A problem that is given a significantly lower grade than it deserves. Also a verb, to sandbag, which is to underplay the difficulty of a problem.",
      letter: "S",
    },
    {
      term: "Sandstone",
      definition: "A sedimentary rock composed mainly of sand-sized minerals or rock grains.",
      letter: "S",
    },
    {
      term: "Screw On",
      definition:
        "A very small artificial hold, that is screwed rather than bolted to the surface of a climbing wall. Usually used as a foot hold.",
      letter: "S",
    },
    { term: "Seam", definition: "A narrow or closed crack.", letter: "S" },
    { term: "Send", definition: "To successfully climb a problem.", letter: "S" },
    {
      term: "Sequence",
      definition: "The details of how a problem is climbed (AKA beta).",
      letter: "S",
    },
    {
      term: "Share",
      definition: "To place both hands on the same hold simultaneously.",
      letter: "S",
    },
    { term: "Sidepull", definition: "A vertical hold that faces away from the body.", letter: "S" },
    {
      term: "Sit Start",
      definition:
        "To start a problem from a sitting position, sometimes abbreviated as SS or SDS (sit down start).",
      letter: "S",
    },
    { term: "Slab", definition: "A less than vertical piece of rock.", letter: "S" },
    {
      term: "Slap",
      definition:
        "A quick reach or lunge during which there is a minimum of two points of contact at all times.",
      letter: "S",
    },
    { term: "Slippers", definition: "Soft climbing shoes.", letter: "S" },
    { term: "Sloper", definition: "A rounded or sloping hand hold.", letter: "S" },
    { term: "Slot", definition: "A narrow horizontal pocket.", letter: "S" },
    {
      term: "Smear",
      definition:
        "A sloping foot hold. Used as a verb it means to place a foot flat against the rock.",
      letter: "S",
    },
    {
      term: "Soloing",
      definition: "Climbing a route without a rope. The complete term is free soloing.",
      letter: "S",
    },
    { term: "Splitter", definition: "A long, parallel sided crack.", letter: "S" },
    {
      term: "Sport Climbing",
      definition: "Routes that are protected by clipping the rope to permanent bolts.",
      letter: "S",
    },
    {
      term: "Spotting",
      definition: "Guiding a falling climber safely to the ground.",
      letter: "S",
    },
    {
      term: "Sprag",
      definition:
        "A grip in which the thumb pushes the rock above the fingers to create more downward force.",
      letter: "S",
    },
    { term: "Squat", definition: "An exercise for developing leg strength.", letter: "S" },
    { term: "Squeak", definition: "To thoroughly clean the sole of a climbing shoe.", letter: "S" },
    {
      term: "Stalactites",
      definition: "A limestone tooth that hangs from the ceiling of a roof.",
      letter: "S",
    },
    { term: "Stamina", definition: "The ability to do a large volume of climbing.", letter: "S" },
    { term: "Static", definition: "To do a move slowly and in total control.", letter: "S" },
    {
      term: "Stemming",
      definition:
        "Pressing the legs away from each other to create an opposition force that holds the body in place. Usually done in corners or grooves but can be done between two protruding holds (AKA bridging).",
      letter: "S",
    },
    {
      term: "Stepping Through",
      definition:
        "Standing (usually with the outside edge) on the next foot hold with the foot furthest from it.",
      letter: "S",
    },
    {
      term: "Syenite",
      definition:
        "A coarse grained igneous rock of similar composition to granite but with a very low amount of chalk.",
      letter: "S",
    },
    {
      term: "Systems Board",
      definition:
        "A steep board on which the various hold types – pinch, crimp, sloper, pocket, undercut, sidepull – are laid out in a repeating, symmetrical pattern.",
      letter: "S",
    },
    // T
    {
      term: "Taco",
      definition:
        "A type of bouldering pad that consists of one continuous section of foam that bends in the middle for transporting.",
      letter: "T",
    },
    {
      term: "Technical",
      definition: "A problem that demands a high standard of technique and movement skills.",
      letter: "T",
    },
    {
      term: "Technique",
      definition:
        'Can refer to either a specific type of movement or more generally to a climber\'s movement skills – "she has good technique".',
      letter: "T",
    },
    {
      term: "Tennis Elbow",
      definition:
        "Aches and pains in the outside of the elbows caused by a lack of balance between the pushing and pulling muscles.",
      letter: "T",
    },
    {
      term: "Thumbcatch",
      definition: "Improving a hold by pinching the underside of it with the thumb.",
      letter: "T",
    },
    {
      term: "Tickmark",
      definition: "A small chalk mark that indicates the location of a hard to see hold.",
      letter: "T",
    },
    { term: "Toe Hooking", definition: "Using the top of the toe to pull on a hold.", letter: "T" },
    {
      term: "Topo",
      definition: "A map or photo upon which the line taken by a problem (or problems) is marked.",
      letter: "T",
    },
    {
      term: "Top Out",
      definition:
        "The process of getting stood up on the top of a problem. Indoors you usually jump down from the finishing hold rather than top out.",
      letter: "T",
    },
    {
      term: "Top Rope",
      definition:
        "Anchoring the rope at the top of the cliff or boulder so that the climber can climb in safety.",
      letter: "T",
    },
    {
      term: "Trad Climbing",
      definition: "Climbing a route protected by gear that has been placed by the leader.",
      letter: "T",
    },
    {
      term: "Training Board",
      definition: "A small, steep wooden climbing wall (AKA woodie).",
      letter: "T",
    },
    { term: "Traverse", definition: "A problem that travels predominantly sideways.", letter: "T" },
    { term: "Tufas", definition: "A limestone rib.", letter: "T" },
    {
      term: "Turning the Lip",
      definition:
        "The process of getting from hanging from the lip of a roof to standing on the lip.",
      letter: "T",
    },
    {
      term: "Twist-locking",
      definition:
        "A technique for climbing steep ground in which the torso twists perpendicular to the rock to maximise reach.",
      letter: "T",
    },
    // U
    { term: "Undercut", definition: "A downward facing hold (AKA undercling).", letter: "U" },
    // V
    {
      term: "V Grade",
      definition:
        "An American system for grading problems, consisting of a number prefixed by the letter V, the higher the number the more difficult the problem.",
      letter: "V",
    },
    {
      term: "Velcros",
      definition: "Climbing shoes that are fastened with velcro straps.",
      letter: "V",
    },
    {
      term: "volcanic Tuff",
      definition: "A rock type consisting of consolidated ash ejected from a volcano.",
      letter: "V",
    },
    {
      term: "Volume",
      definition:
        "A large, hollow plywood or resin hold (usually triangular or rounded), upon which other holds can be mounted.",
      letter: "V",
    },
    // W
    { term: "Wall", definition: "A roughly vertical piece of rock.", letter: "W" },
    {
      term: "Warm-up",
      definition: "A routine to prepare the mind and body for climbing.",
      letter: "W",
    },
    {
      term: "Wire Brush",
      definition: "A very aggressive wire bristled brush that should never be used to clean rock.",
      letter: "W",
    },
    { term: "Wired", definition: "Having a problem mastered (AKA dialled).", letter: "W" },
    {
      term: "Working",
      definition: "Figuring out and rehearsing the moves of a problem.",
      letter: "W",
    },
  ];
  for (const t of terms) {
    await prisma.term.upsert({
      where: { term: t.term },
      update: { definition: t.definition, letter: t.letter },
      create: t,
    });
  }
  console.log(`Seeded ${terms.length} terms.`);

  console.log("Seeding promo codes…");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0/I/1 for readability
  function genCode(): string {
    let c = "";
    for (let i = 0; i < 6; i++) c += chars[Math.floor(Math.random() * chars.length)];
    return c;
  }
  const existing = await prisma.promoCode.count();
  if (existing === 0) {
    const codes = Array.from({ length: 10 }, genCode);
    await prisma.promoCode.createMany({ data: codes.map((code) => ({ code })) });
    console.log("Generated promo codes:");
    codes.forEach((c) => console.log(" ", c));
  } else {
    console.log(`Skipped — ${existing} codes already exist.`);
    const all = await prisma.promoCode.findMany({ select: { code: true, usedAt: true } });
    all.forEach((c) => console.log(` ${c.code}  ${c.usedAt ? "(used)" : "(unused)"}`));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
