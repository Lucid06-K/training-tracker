// AUTO-ported from legacy-index.html — default app data

export const DEFAULT_CATEGORIES={'upper':{name:'Upper Body',color:'upper'},'lower':{name:'Lower Body + Core',color:'lower'},'endurance':{name:'Endurance + Light',color:'endurance'},'sport':{name:'Sport / Activity',color:'sport'},'rest':{name:'Rest',color:'rest'},'custom':{name:'Custom',color:'custom'}};
export const DEFAULT_SCHEDULE={0:{category:'endurance',label:'Gym: Endurance'},1:{category:'upper',label:'Gym: Upper Body'},2:{category:'sport',label:'Dragon Boating'},3:{category:'lower',label:'Gym: Lower + Core'},4:{category:'sport',label:'Dragon Boating'},5:{category:'sport',label:'Bouldering'},6:{category:'sport',label:'Dragon Boating'}};
export const DEFAULT_WORKOUTS={
  'upper':{name:'Upper Body Strength',sections:[
    {name:'Main Exercises',exercises:[
      {id:'ub1',name:'Pec Fly Machine',equipment:'Pec fly machine',weight:'15-20 kg',sets:3,reps:'10-12',rest:60,video:'https://www.youtube.com/watch?v=Z57CtFmRMxA'},
      {id:'ub2',name:'Barbell Rows',equipment:'Bar weight',weight:'8-12 kg',sets:3,reps:'10',rest:90,video:'https://www.youtube.com/watch?v=roCP6wCXPqo'},
      {id:'ub3',name:'Overhead Press',equipment:'Bar weight',weight:'5-8 kg',sets:3,reps:'8-10',rest:90,video:'https://www.youtube.com/watch?v=qEwKCR5JCog'},
      {id:'ub4',name:'Lat Pulldown',equipment:'Lat pulldown',weight:'20-25 kg',sets:3,reps:'10-12',rest:60,video:'https://www.youtube.com/watch?v=CAwf7n6Luuc'},
      {id:'ub5',name:'Rear Delt Fly Machine',equipment:'Rear delt machine',weight:'10-15 kg',sets:3,reps:'15',rest:60,video:'https://www.youtube.com/watch?v=5YK4bgzXDp0'},
      {id:'ub6',name:'Cable Face Pulls',equipment:'Cable machine',weight:'5-10 kg',sets:3,reps:'15',rest:60,video:'https://www.youtube.com/watch?v=rep-qVOkqgk'},
      {id:'ub7',name:'Pallof Press',equipment:'Cable machine',weight:'5-8 kg',sets:3,reps:'12 each',rest:60,video:'https://www.youtube.com/watch?v=AH_QZLm_0-s'}
    ]},{name:'Ab Finisher: Top-Down',exercises:[
      {id:'uba1',name:'Cable Crunches',equipment:'Cable machine',weight:'10-15 kg',sets:3,reps:'12-15',rest:45,video:'https://www.youtube.com/watch?v=AV5PmR3fmuE'},
      {id:'uba2',name:'Hanging Knee Raises',equipment:'Pull-up bar',weight:'BW',sets:3,reps:'10-15',rest:45,video:'https://www.youtube.com/watch?v=Pr1ieGZ5atk'},
      {id:'uba3',name:'Plank Shoulder Taps',equipment:'Yoga mat',weight:'BW',sets:3,reps:'20 taps',rest:45,video:'https://www.youtube.com/watch?v=LEZq7QEgLbI'}
    ]},{name:'Stretch Session',exercises:[
      {id:'ubs1',name:'Doorway Chest Stretch',equipment:'',weight:'',sets:1,reps:'30s each side',rest:0,video:'https://www.youtube.com/watch?v=WJOEUvr-mMI'},
      {id:'ubs2',name:'Cross-Body Shoulder Stretch',equipment:'',weight:'',sets:1,reps:'30s each side',rest:0,video:'https://www.youtube.com/watch?v=qGYflbNbaqE'},
      {id:'ubs3',name:'Overhead Tricep Stretch',equipment:'',weight:'',sets:1,reps:'30s each side',rest:0,video:'https://www.youtube.com/watch?v=OBJF4LNOqHk'},
      {id:'ubs4',name:'Cat-Cow',equipment:'',weight:'',sets:1,reps:'10 reps',rest:0,video:'https://www.youtube.com/watch?v=kqnua4rHVVA'},
      {id:'ubs5',name:'Thread the Needle',equipment:'',weight:'',sets:1,reps:'30s each side',rest:0,video:'https://www.youtube.com/watch?v=RbMl0G1JJrA'},
      {id:'ubs6',name:"Child's Pose",equipment:'',weight:'',sets:1,reps:'45s',rest:0,video:'https://www.youtube.com/watch?v=2MJGg-dUKh0'}
    ]}
  ]},
  'lower':{name:'Lower Body + Core',sections:[
    {name:'Main Exercises',exercises:[
      {id:'lb1',name:'Leg Press',equipment:'Leg press machine',weight:'40-60 kg',sets:3,reps:'10-12',rest:90,video:'https://www.youtube.com/watch?v=IZxyjW7MPJQ'},
      {id:'lb2',name:'Barbell Romanian Deadlifts',equipment:'Bar weight',weight:'8-12 kg',sets:3,reps:'10',rest:90,video:'https://www.youtube.com/watch?v=jEy_czb3RKA'},
      {id:'lb3',name:'Bulgarian Split Squats',equipment:'Bar weights',weight:'3-5 kg each',sets:3,reps:'10 each',rest:90,video:'https://www.youtube.com/watch?v=2C-uNgKwPLE'},
      {id:'lb4',name:'Leg Curl Machine',equipment:'Leg curl machine',weight:'15-20 kg',sets:3,reps:'12',rest:60,video:'https://www.youtube.com/watch?v=1Tq3QdYUuHs'},
      {id:'lb5',name:'Leg Extension Machine',equipment:'Leg extension',weight:'15-20 kg',sets:3,reps:'12',rest:60,video:'https://www.youtube.com/watch?v=YyvSfVjQeL0'},
      {id:'lb6',name:'Calf Raises',equipment:'Leg press',weight:'40-50 kg',sets:3,reps:'15',rest:60,video:'https://www.youtube.com/watch?v=gwLzBJYoWlI'},
      {id:'lb7',name:'Dead Bugs',equipment:'Yoga mat',weight:'BW',sets:3,reps:'10 each',rest:30,video:'https://www.youtube.com/watch?v=I5xbsA71v1A'}
    ]},{name:'Ab Finisher: Rotational',exercises:[
      {id:'lba1',name:'Cable Woodchops (High to Low)',equipment:'Cable machine',weight:'5-10 kg',sets:3,reps:'12 each',rest:45,video:'https://www.youtube.com/watch?v=pAplQXk3dkU'},
      {id:'lba2',name:'Bicycle Crunches (Slow)',equipment:'Yoga mat',weight:'BW',sets:3,reps:'15 each',rest:45,video:'https://www.youtube.com/watch?v=9FGilxCbdz8'},
      {id:'lba3',name:'Weighted Sit-Ups',equipment:'Sit-up chair + bar',weight:'3-5 kg',sets:3,reps:'12-15',rest:45,video:'https://www.youtube.com/watch?v=7TLevjZBGnA'}
    ]},{name:'Stretch Session',exercises:[
      {id:'lbs1',name:'Standing Quad Stretch',equipment:'',weight:'',sets:1,reps:'30s each side',rest:0,video:'https://www.youtube.com/watch?v=YBc4_BNALEI'},
      {id:'lbs2',name:'Kneeling Hip Flexor Stretch',equipment:'',weight:'',sets:1,reps:'30s each side',rest:0,video:'https://www.youtube.com/watch?v=ePE-MB0ZFlc'},
      {id:'lbs3',name:'Seated Hamstring Stretch',equipment:'',weight:'',sets:1,reps:'30s each side',rest:0,video:'https://www.youtube.com/watch?v=1elR0KY73mE'},
      {id:'lbs4',name:'Figure-4 Glute Stretch',equipment:'',weight:'',sets:1,reps:'30s each side',rest:0,video:'https://www.youtube.com/watch?v=dqVTqBJp9oc'},
      {id:'lbs5',name:'Calf Stretch (Wall)',equipment:'',weight:'',sets:1,reps:'30s each side',rest:0,video:'https://www.youtube.com/watch?v=5n-yAJ4sEaE'},
      {id:'lbs6',name:'Pigeon Pose',equipment:'',weight:'',sets:1,reps:'45s each side',rest:0,video:'https://www.youtube.com/watch?v=_DAo9JAXKNE'}
    ]}
  ]},
  'endurance':{name:'Endurance + Light Strength',sections:[
    {name:'Cardio Block',exercises:[
      {id:'en1',name:'Matrix ClimbMill',equipment:'ClimbMill',weight:'Level 4-6',sets:1,reps:'20-30 min',rest:0,video:'https://www.youtube.com/watch?v=VjPKJkIB00M'}
    ]},{name:'Light Accessory Work',exercises:[
      {id:'en2',name:'Lateral Raises',equipment:'Bar weights',weight:'2-3 kg each',sets:2,reps:'15',rest:45,video:'https://www.youtube.com/watch?v=3VcKaXpzqRo'},
      {id:'en3',name:'Bicep Curls',equipment:'Bar weights',weight:'5-8 kg',sets:2,reps:'12',rest:45,video:'https://www.youtube.com/watch?v=ykJmrZ5v0Oo'},
      {id:'en4',name:'Tricep Pushdowns',equipment:'Cable machine',weight:'8-12 kg',sets:2,reps:'12',rest:45,video:'https://www.youtube.com/watch?v=2-LAMcpzODU'}
    ]},{name:'Ab Finisher: Anti-Movement',exercises:[
      {id:'ena1',name:'Pallof Press Holds',equipment:'Cable machine',weight:'5-8 kg',sets:3,reps:'20s each',rest:30,video:'https://www.youtube.com/watch?v=AH_QZLm_0-s'},
      {id:'ena2',name:'Dead Bugs (Slow)',equipment:'Yoga mat',weight:'BW',sets:3,reps:'10 each',rest:30,video:'https://www.youtube.com/watch?v=I5xbsA71v1A'},
      {id:'ena3',name:'Weighted Sit-Ups',equipment:'Sit-up chair + bar',weight:'3-5 kg',sets:3,reps:'12-15',rest:45,video:'https://www.youtube.com/watch?v=7TLevjZBGnA'}
    ]},{name:'Stretch Session',exercises:[
      {id:'ens1',name:'Shoulder Dislocates (towel)',equipment:'',weight:'',sets:1,reps:'10 slow reps',rest:0,video:'https://www.youtube.com/watch?v=02HdChcpyBs'},
      {id:'ens2',name:'Doorway Chest Stretch',equipment:'',weight:'',sets:1,reps:'30s each side',rest:0,video:'https://www.youtube.com/watch?v=WJOEUvr-mMI'},
      {id:'ens3',name:'Forearm/Wrist Stretch',equipment:'',weight:'',sets:1,reps:'30s each side',rest:0,video:'https://www.youtube.com/watch?v=U3IfgiNlTPU'},
      {id:'ens4',name:'Kneeling Hip Flexor Stretch',equipment:'',weight:'',sets:1,reps:'30s each side',rest:0,video:'https://www.youtube.com/watch?v=ePE-MB0ZFlc'},
      {id:'ens5',name:'Seated Spinal Twist',equipment:'',weight:'',sets:1,reps:'30s each side',rest:0,video:'https://www.youtube.com/watch?v=SaxvQGmg2Eo'},
      {id:'ens6',name:"Child's Pose",equipment:'',weight:'',sets:1,reps:'60s',rest:0,video:'https://www.youtube.com/watch?v=2MJGg-dUKh0'}
    ]}
  ]},
  'drum':{name:'Paddle Emulation Workout',sections:[
    {name:'Pull & Row (Catch Phase)',exercises:[
      {id:'dr1',name:'Seated Cable Row',equipment:'Cable machine',weight:'10-15 kg',sets:3,reps:'12',rest:60,video:''},
      {id:'dr2',name:'Lat Pulldown (Wide Grip)',equipment:'Lat pulldown',weight:'20-25 kg',sets:3,reps:'10-12',rest:60,video:'https://www.youtube.com/watch?v=CAwf7n6Luuc'},
      {id:'dr3',name:'Single-Arm Cable Row',equipment:'Cable machine',weight:'8-12 kg',sets:3,reps:'10 each',rest:60,video:''}
    ]},{name:'Rotation & Core (Drive Phase)',exercises:[
      {id:'dr4',name:'Cable Woodchops (High to Low)',equipment:'Cable machine',weight:'5-10 kg',sets:3,reps:'12 each',rest:45,video:'https://www.youtube.com/watch?v=pAplQXk3dkU'},
      {id:'dr5',name:'Pallof Press',equipment:'Cable machine',weight:'5-8 kg',sets:3,reps:'12 each',rest:45,video:'https://www.youtube.com/watch?v=AH_QZLm_0-s'},
      {id:'dr6',name:'Weighted Sit-Up Twists',equipment:'Sit-up chair + bar',weight:'3-5 kg',sets:3,reps:'12 each side',rest:45,video:'https://www.youtube.com/watch?v=7TLevjZBGnA'}
    ]},{name:'Stability & Endurance',exercises:[
      {id:'dr7',name:'Rear Delt Fly Machine',equipment:'Pec fly / rear delt',weight:'10-15 kg',sets:3,reps:'15',rest:45,video:'https://www.youtube.com/watch?v=5YK4bgzXDp0'},
      {id:'dr8',name:'Plank with Shoulder Taps',equipment:'Yoga mat',weight:'BW',sets:3,reps:'20 taps',rest:45,video:'https://www.youtube.com/watch?v=LEZq7QEgLbI'}
    ]}
  ]}
};
export const DEFAULT_PROFILE={height:161,weight:55,proteinMin:88,proteinMax:110,unit:'metric',waterGoal:2.5};

export const DEFAULT_SETTINGS={
  restTimerEnabled:true,
  restTimerSound:true,
  darkMode:true,
  showStretchSection:true,
  autoTrackRestDays:true
};

export const DEFAULT_OVERLOAD={upper:1,lower:2.5,endurance:0.5,sport:0};

// ==================== FEATURE CONSTANTS ====================
export const RATING_EMOJIS={1:'\u{1F634}',2:'\u{1F60A}',3:'\u{1F4AA}',4:'\u{1F525}',5:'\u{2620}\uFE0F'};
export const RATING_LABELS={1:'Easy',2:'Moderate',3:'Good',4:'Intense',5:'Brutal'};

export const WARMUP_ROUTINES={
  gym:[
    {name:'Arm Circles',duration:'30s',desc:'Forward & backward'},
    {name:'Leg Swings',duration:'30s each',desc:'Front/back & side'},
    {name:'Hip Circles',duration:'30s',desc:'Both directions'},
    {name:'Bodyweight Squats',duration:'10 reps',desc:'Slow & controlled'},
    {name:'Cat-Cow',duration:'10 reps',desc:'Spine mobilization'}
  ],
  dragonboat:[
    {name:'Arm Circles',duration:'30s',desc:'Loosen shoulders'},
    {name:'Torso Twists',duration:'30s',desc:'Standing rotation'},
    {name:'Hip Circles',duration:'30s',desc:'Both directions'},
    {name:'Shoulder Dislocates',duration:'10 reps',desc:'With towel'},
    {name:'Wrist Circles',duration:'20s',desc:'Both directions'},
    {name:'Light Jog',duration:'2 min',desc:'Get heart rate up'}
  ],
  bouldering:[
    {name:'Wrist Circles',duration:'30s',desc:'Both directions'},
    {name:'Finger Tendon Glides',duration:'20 reps',desc:'Open & close slowly'},
    {name:'Arm Circles',duration:'30s',desc:'Forward & backward'},
    {name:'Hip Circles',duration:'30s',desc:'Both directions'},
    {name:'Shoulder Shrugs',duration:'15 reps',desc:'Up & release'},
    {name:'Easy Traverse',duration:'5 min',desc:'2-3 easy routes'}
  ]
};

export const EXERCISE_ALTERNATIVES={
  'ub1':[{name:'Cable Chest Fly',equipment:'Cable machine',weight:'5-10 kg'},{name:'Push-Ups',equipment:'Yoga mat',weight:'BW'}],
  'ub2':[{name:'Single-Arm Cable Row',equipment:'Cable machine',weight:'10-15 kg'},{name:'Lat Pulldown (Close Grip)',equipment:'Lat pulldown',weight:'20-25 kg'}],
  'ub3':[{name:'Landmine Press',equipment:'Bar weight',weight:'5-8 kg'},{name:'Cable Shoulder Press',equipment:'Cable machine',weight:'5-10 kg'}],
  'ub4':[{name:'Straight Arm Pulldown',equipment:'Cable machine',weight:'10-15 kg'},{name:'Pull-Ups',equipment:'Pull-up bar',weight:'BW'}],
  'ub5':[{name:'Cable Face Pulls',equipment:'Cable machine',weight:'5-10 kg'},{name:'Rear Delt Cable Fly',equipment:'Cable machine',weight:'3-5 kg'}],
  'ub6':[{name:'Rear Delt Fly Machine',equipment:'Pec fly / rear delt',weight:'10-15 kg'},{name:'Band Pull-Aparts',equipment:'Band',weight:'Light'}],
  'ub7':[{name:'Cable Woodchops',equipment:'Cable machine',weight:'5-8 kg'},{name:'Dead Bugs',equipment:'Yoga mat',weight:'BW'}],
  'lb1':[{name:'Goblet Squats',equipment:'Bar weight',weight:'8-12 kg'},{name:'Wall Sit',equipment:'Wall',weight:'BW'}],
  'lb2':[{name:'Cable Pull-Through',equipment:'Cable machine',weight:'10-15 kg'},{name:'Good Mornings',equipment:'Bar weight',weight:'5-8 kg'}],
  'lb3':[{name:'Reverse Lunges',equipment:'Bar weights',weight:'3-5 kg each'},{name:'Step-Ups',equipment:'Bench',weight:'BW'}],
  'lb4':[{name:'Cable Hamstring Curl',equipment:'Cable machine',weight:'5-10 kg'},{name:'Romanian Deadlift',equipment:'Bar weight',weight:'8-12 kg'}],
  'lb5':[{name:'Sissy Squats',equipment:'Bodyweight',weight:'BW'},{name:'Cable Leg Extension',equipment:'Cable machine',weight:'5-10 kg'}],
  'lb6':[{name:'Standing Calf Raises',equipment:'Bar weight',weight:'5-10 kg'},{name:'Seated Calf Raise',equipment:'Leg press',weight:'30-40 kg'}],
  'lb7':[{name:'Plank',equipment:'Yoga mat',weight:'BW'},{name:'Pallof Press',equipment:'Cable machine',weight:'5-8 kg'}],
  'en1':[{name:'Treadmill Incline Walk',equipment:'Treadmill',weight:'Incline 10-15%'},{name:'Cycle',equipment:'Cycle',weight:'Moderate'}],
  'en2':[{name:'Cable Lateral Raise',equipment:'Cable machine',weight:'2-5 kg'},{name:'Front Raises',equipment:'Bar weights',weight:'2-3 kg'}],
  'en3':[{name:'Cable Curls',equipment:'Cable machine',weight:'5-8 kg'},{name:'Hammer Curls',equipment:'Bar weights',weight:'5-8 kg'}],
  'en4':[{name:'Overhead Cable Extension',equipment:'Cable machine',weight:'8-12 kg'},{name:'Tricep Kickbacks',equipment:'Bar weights',weight:'3-5 kg'}],
  'dr1':[{name:'Cable Row (Standing)',equipment:'Cable machine',weight:'10-15 kg'},{name:'Barbell Rows',equipment:'Bar weight',weight:'8-12 kg'}],
  'dr2':[{name:'Pull-Ups',equipment:'Pull-up bar',weight:'BW'},{name:'Straight Arm Pulldown',equipment:'Cable machine',weight:'10-15 kg'}],
  'dr3':[{name:'Barbell Row',equipment:'Bar weight',weight:'8-12 kg'},{name:'Cable Face Pull',equipment:'Cable machine',weight:'5-10 kg'}],
  'dr4':[{name:'Russian Twists',equipment:'Yoga mat',weight:'BW or bar weight'},{name:'Bicycle Crunches',equipment:'Yoga mat',weight:'BW'}],
  'dr5':[{name:'Dead Bugs',equipment:'Yoga mat',weight:'BW'},{name:'Cable Crunch Twist',equipment:'Cable machine',weight:'10-15 kg'}],
  'dr6':[{name:'Cable Woodchops',equipment:'Cable machine',weight:'5-10 kg'},{name:'Bicycle Crunches',equipment:'Yoga mat',weight:'BW'}],
  'dr7':[{name:'Cable Reverse Fly',equipment:'Cable machine',weight:'3-5 kg'},{name:'Pec Fly Machine (reverse)',equipment:'Pec fly / rear delt',weight:'10-15 kg'}],
  'dr8':[{name:'Dead Bugs',equipment:'Yoga mat',weight:'BW'},{name:'Plank',equipment:'Yoga mat',weight:'BW'}]
};


export const STORAGE_KEY = 'training_tracker_v2';
export const SYNC_CODE_KEY = 'training_sync_code';

export function buildDefaultData() {
  return {
    profile: { ...DEFAULT_PROFILE },
    categories: { ...DEFAULT_CATEGORIES },
    schedule: { ...DEFAULT_SCHEDULE },
    workouts: JSON.parse(JSON.stringify(DEFAULT_WORKOUTS)),
    customWorkouts: {},
    logs: {},
    nutrition: {},
    bodyweight: {},
    measurements: {},
    prs: {},
    exerciseNotes: {},
    settings: { ...DEFAULT_SETTINGS, overloadIncrements: { ...DEFAULT_OVERLOAD } }
  };
}

export function mergeWithDefaults(data) {
  if (!data || typeof data !== 'object') return buildDefaultData();
  if (!data.profile) data.profile = { ...DEFAULT_PROFILE };
  if (!data.categories) data.categories = { ...DEFAULT_CATEGORIES };
  if (!data.schedule) data.schedule = { ...DEFAULT_SCHEDULE };
  if (!data.workouts) data.workouts = JSON.parse(JSON.stringify(DEFAULT_WORKOUTS));
  if (!data.workouts.drum) data.workouts.drum = JSON.parse(JSON.stringify(DEFAULT_WORKOUTS.drum));
  if (!data.customWorkouts) data.customWorkouts = {};
  if (!data.logs) data.logs = {};
  if (!data.nutrition) data.nutrition = {};
  if (!data.bodyweight) data.bodyweight = {};
  if (!data.measurements) data.measurements = {};
  if (!data.prs) data.prs = {};
  if (!data.exerciseNotes) data.exerciseNotes = {};
  if (!data.settings) data.settings = { ...DEFAULT_SETTINGS };
  if (data.settings.autoTrackRestDays === undefined) data.settings.autoTrackRestDays = true;
  if (!data.settings.overloadIncrements) data.settings.overloadIncrements = { ...DEFAULT_OVERLOAD };
  if (data.profile.waterGoal === undefined) data.profile.waterGoal = 2.5;
  return data;
}

// Per-date maps are unioned; for overlapping keys the newer side wins. Singleton
// fields (profile, settings, schedule, templates) are taken entirely from the
// newer side. Prevents the whole document from being clobbered when two devices
// edit on the same day.
const DATE_KEYED_FIELDS = ['logs', 'nutrition', 'bodyweight', 'measurements', 'prs', 'exerciseNotes'];
const SINGLETON_FIELDS = ['profile', 'categories', 'schedule', 'workouts', 'customWorkouts', 'settings'];

export function mergeSyncData(local, cloud, localModified = 0, cloudModified = 0) {
  const a = mergeWithDefaults(local || buildDefaultData());
  const b = mergeWithDefaults(cloud || buildDefaultData());
  const cloudNewer = cloudModified >= localModified;
  const winner = cloudNewer ? b : a;
  const loser = cloudNewer ? a : b;

  const out = {};
  SINGLETON_FIELDS.forEach((k) => { out[k] = winner[k]; });
  DATE_KEYED_FIELDS.forEach((k) => {
    const merged = { ...(loser[k] || {}) };
    Object.entries(winner[k] || {}).forEach(([key, val]) => { merged[key] = val; });
    out[k] = merged;
  });
  out._lastModified = Math.max(localModified, cloudModified) || Date.now();
  return mergeWithDefaults(out);
}
