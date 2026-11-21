import type { CameraSettings } from '../sim/types';

export interface Scenario {
  id: string;
  icon: string;
  title: string;
  category: 'Action' | 'People' | 'Low light' | 'Landscape' | 'Tricky light' | 'Creative';
  summary: string;
  settings: {
    mode: string;
    aperture: string;
    shutter: string;
    iso: string;
    focus: string;
    wb?: string;
    metering?: string;
  };
  why: string[];
  steps?: string[];
  mistakes: string[];
  gear?: string[];
  /** Challenge id to practice, or a simulator preset. */
  challenge?: string;
  sim?: { scene: string; settings: Partial<CameraSettings> };
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'kids-sports',
    icon: '⚽',
    title: 'Kids & outdoor sports',
    category: 'Action',
    summary: 'Fast, unpredictable movement in daylight.',
    settings: { mode: 'M + Auto ISO (or Tv)', aperture: 'f/2.8 – f/5.6', shutter: '1/1000 s', iso: 'Auto (100–6400)', focus: 'AF-C, zone or tracking', metering: 'Evaluative' },
    why: [
      'Children and athletes change direction constantly. 1/1000 s freezes running and most ball action.',
      'f/4-ish gives some depth of field margin when focus is slightly off, while still separating from the background.',
      'Auto ISO absorbs clouds and shade so you never have to re-meter.',
    ],
    steps: ['Set shutter 1/1000 and aperture f/4 in M.', 'Turn on Auto ISO with a max of 6400.', 'Use continuous AF and burst mode.', 'Get low, at the kids\' eye level.'],
    mistakes: ['Using AF-S: focus locks and the subject runs out of it.', 'Shutter too slow (1/250): arms and legs blur.'],
    gear: ['A 70–200mm or similar zoom helps for field sports.'],
    challenge: 'freeze-runner',
  },
  {
    id: 'birds',
    icon: '🦅',
    title: 'Birds in flight & wildlife',
    category: 'Action',
    summary: 'Small, fast subjects at long focal lengths.',
    settings: { mode: 'M + Auto ISO', aperture: 'Wide open (f/5.6 – f/6.3 on long zooms)', shutter: '1/2000 – 1/4000 s', iso: 'Auto (often 800–6400)', focus: 'AF-C, tracking + animal-eye detection', metering: 'Evaluative, +⅓ to +1 against bright sky' },
    why: [
      'Wings move incredibly fast; 1/2000+ freezes feathers.',
      'Long lenses magnify shake too: 400mm needs at least 1/400 even for still birds.',
      'Birds against a bright sky fool the meter into silhouettes, so add + compensation.',
    ],
    mistakes: ['Underexposing birds against the sky.', 'Single-point AF on an erratic flyer. Use zone/tracking.'],
    gear: ['Telephoto 300–600mm', 'Stabilization'],
    sim: { scene: 'park-runner', settings: { mode: 'M', autoIso: true, aperture: 5.6, shutter: 1 / 2000, focal: 200 } },
  },
  {
    id: 'portrait',
    icon: '🧑',
    title: 'Outdoor portrait',
    category: 'People',
    summary: 'A person, sharp eyes, soft background.',
    settings: { mode: 'Av', aperture: 'f/1.8 – f/2.8', shutter: '1/250 s or faster (camera picks)', iso: '100–400', focus: 'AF-S/AF-C with eye detection, nearest eye', wb: 'Daylight/Cloudy (slightly warm)', metering: 'Evaluative or spot on face' },
    why: [
      'A wide aperture blurs distractions and draws attention to the face.',
      '85mm-ish focal lengths flatter faces and compress the background.',
      'Open shade or the soft light of a cloudy day avoids harsh shadows and squinting.',
    ],
    steps: ['Find open shade, with the subject facing the light.', 'Put distance between subject and background.', 'Av at f/2, focus on the nearest eye.', 'Check that the face isn\'t underexposed against a bright background.'],
    mistakes: ['Shooting in harsh midday sun.', 'f/1.4 on two people at different distances.', 'Background right behind the subject, so it can\'t blur.'],
    gear: ['50mm f/1.8 or 85mm f/1.8 primes are affordable and excellent.', 'A reflector to fill shadows.'],
    challenge: 'creamy-background',
  },
  {
    id: 'indoor',
    icon: '🏠',
    title: 'Indoors without flash',
    category: 'Low light',
    summary: 'Family moments in dim household light.',
    settings: { mode: 'M + Auto ISO', aperture: 'Wide open (f/1.8 – f/2.8)', shutter: '1/125 – 1/250 s (people moving)', iso: 'Auto, up to 6400–12800', focus: 'AF-C with face detection', wb: 'Tungsten / 3200K or Auto', metering: 'Evaluative' },
    why: [
      'Indoor light is 6–8 stops darker than daylight. You need all the help you can get.',
      'People move more than you think: 1/125 is a sensible floor.',
      'High ISO noise is far better than motion blur.',
    ],
    mistakes: ['Keeping ISO low and getting blurry photos.', 'Leaving AWB on under warm bulbs (orange skin).'],
    gear: ['A fast prime (f/1.8) is the single biggest upgrade here.'],
    sim: { scene: 'gym', settings: { mode: 'M', autoIso: true, aperture: 2, shutter: 1 / 250, focal: 50 } },
  },
  {
    id: 'concert',
    icon: '🎸',
    title: 'Concerts & stage',
    category: 'Low light',
    summary: 'Dark venue, bright moving stage lights.',
    settings: { mode: 'M (manual ISO or Auto ISO)', aperture: 'f/1.8 – f/2.8', shutter: '1/250 – 1/500 s', iso: '1600–6400', focus: 'AF-C', wb: 'Kelvin ~3500K or Auto', metering: 'Spot on the performer, or −⅔ to −1 EV' },
    why: [
      'Performers are lit by spotlights against black. Evaluative metering overexposes them.',
      'Stage lights clip easily. Protect highlights and let the shadows fall dark.',
      'Fast shutter freezes guitarists and drummers.',
    ],
    mistakes: ['Faces blown out by spotlights (metering the dark room).', 'Using flash (banned at most venues and ugly anyway).'],
    challenge: 'gym-action',
  },
  {
    id: 'milky-way',
    icon: '🌌',
    title: 'Milky Way & stars',
    category: 'Low light',
    summary: 'Dark sky, tripod, as much light as possible without trails.',
    settings: { mode: 'M', aperture: 'Wide open (f/1.4 – f/2.8)', shutter: '10–20 s (NPF rule)', iso: '1600–6400', focus: 'Manual, on a bright star (live view, zoomed in)', wb: '3800–4200K' },
    why: [
      'Stars move across the sky; longer exposures trail. The NPF rule (or the looser 500 rule) gives the maximum time.',
      'A wide lens allows longer exposures and fits more sky.',
      'Autofocus fails in the dark. Focus manually on a star using magnified live view.',
    ],
    steps: ['Find a dark site, no moon.', 'Tripod, 2 s timer or remote.', 'Wide open, ISO 3200, ~15 s at 20mm.', 'Check the histogram. It should be off the left edge, not mid.'],
    mistakes: ['Focusing on "∞" on the lens scale. It\'s often not true infinity.', 'Stabilization on while on the tripod.', 'Exposing too long, giving star trails.'],
    gear: ['Sturdy tripod', 'Wide, fast lens (14–24mm f/2.8 or faster)', 'Headlamp with red light'],
    challenge: 'milky-way',
  },
  {
    id: 'light-trails',
    icon: '🚗',
    title: 'Light trails',
    category: 'Creative',
    summary: 'Car lights painting streaks through the city.',
    settings: { mode: 'M', aperture: 'f/8 – f/16', shutter: '2 – 30 s', iso: '100', focus: 'AF-S on a static object, then switch to MF', wb: 'Auto or 3500K' },
    why: [
      'A long shutter turns each pair of headlights into a line.',
      'Narrow aperture lets you use a long shutter without overexposing, and adds starbursts to streetlights.',
      'Moving lights don\'t brighten with longer exposures (each spot is passed once), but the static scene does.',
    ],
    mistakes: ['Shooting handheld.', 'Exposure ending mid-traffic. Time it to a full traffic light cycle.'],
    gear: ['Tripod', 'Remote or self-timer'],
    challenge: 'light-trails',
  },
  {
    id: 'waterfall',
    icon: '💧',
    title: 'Silky waterfalls & seascapes',
    category: 'Landscape',
    summary: 'Smooth moving water with a long exposure.',
    settings: { mode: 'M or Av', aperture: 'f/8 – f/16', shutter: '½ – 4 s (ND filter in daylight)', iso: '100', focus: 'AF-S on a rock, then lock', wb: 'Daylight/Shade' },
    why: [
      'Water moving during a long exposure blurs into silk; rocks and trees stay sharp.',
      'Overcast days or shade give you longer shutter speeds naturally.',
      'An ND filter (3–10 stops) makes long exposures possible in daylight.',
    ],
    mistakes: ['Too long an exposure: water turns into featureless fog. Try ½–1 s first.', 'White water clipping. Watch the blinkies.'],
    gear: ['Tripod', 'ND filter (3, 6 or 10 stops)', 'Polarizer to cut reflections'],
    challenge: 'silky-water',
  },
  {
    id: 'fireworks',
    icon: '🎆',
    title: 'Fireworks',
    category: 'Creative',
    summary: 'Bright bursts against a dark sky.',
    settings: { mode: 'M', aperture: 'f/8 – f/11', shutter: '2 – 6 s (or Bulb)', iso: '100–200', focus: 'Manual, pre-focused on the first burst or far buildings', wb: 'Daylight' },
    why: [
      'Fireworks are bright; a low ISO and f/8–f/11 keep their colors from clipping.',
      'The shutter time controls how much of the burst you capture.',
      'Manual focus avoids the camera hunting in the dark.',
    ],
    mistakes: ['High ISO: everything blows out white.', 'Autofocus hunting and missing the burst.'],
    gear: ['Tripod', 'Remote release'],
  },
  {
    id: 'golden-hour',
    icon: '🌅',
    title: 'Golden-hour landscape',
    category: 'Landscape',
    summary: 'Warm, low light; sharp from foreground to horizon.',
    settings: { mode: 'Av or M', aperture: 'f/8 – f/11', shutter: 'Whatever exposure needs (tripod)', iso: '100', focus: 'AF-S about ⅓ into the scene (or hyperfocal)', wb: 'Daylight or Cloudy (keeps warmth)', metering: 'Evaluative; protect the sky' },
    why: [
      'f/8–f/11 is the sharpness sweet spot with deep depth of field.',
      'Base ISO maximizes dynamic range for skies and shadows.',
      'Auto WB tends to neutralize the golden color you came for.',
    ],
    mistakes: ['Focusing on infinity, leaving the foreground soft.', 'Sky clipped white. Underexpose a little and lift shadows later.'],
    gear: ['Tripod', 'Graduated ND filter or exposure bracketing'],
    challenge: 'everything-sharp',
  },
  {
    id: 'snow-beach',
    icon: '⛷️',
    title: 'Snow & beach',
    category: 'Tricky light',
    summary: 'Very bright scenes that fool the meter.',
    settings: { mode: 'Av', aperture: 'f/8', shutter: 'Fast (camera picks)', iso: '100', focus: 'AF-C for skiers, AF-S for scenery', metering: 'Evaluative + 1 to +2 EV' },
    why: [
      'The meter makes everything middle grey, so white snow turns dull grey.',
      'Plus exposure compensation brings the snow back to white without clipping.',
    ],
    mistakes: ['Grey snow from trusting the meter.', 'Overdoing it and clipping the snow texture.'],
    challenge: 'snow-meter',
  },
  {
    id: 'backlit',
    icon: '🌇',
    title: 'Backlit subject / sunset portrait',
    category: 'Tricky light',
    summary: 'Subject in front of a bright sky or window.',
    settings: { mode: 'Av or M', aperture: 'f/2 – f/4', shutter: '1/250+', iso: '100–400', focus: 'AF-S/AF-C, face detection', metering: 'Spot on face, or +1 to +2 EV; or flash fill' },
    why: [
      'The bright background dominates the meter and turns faces into silhouettes.',
      'Decide: expose for the face (background brightens), expose for the sky (silhouette), or add light (flash or reflector) to balance.',
    ],
    mistakes: ['Dark, muddy faces.', 'Lens flare washing out contrast. Use a lens hood or shade the lens.'],
    gear: ['Reflector', 'Flash with diffuser'],
    sim: { scene: 'snow', settings: { mode: 'Av', aperture: 4, meterMode: 'spot', focal: 85 } },
  },
  {
    id: 'street',
    icon: '🚶',
    title: 'Street photography',
    category: 'People',
    summary: 'Fast, candid moments in changing light.',
    settings: { mode: 'Av or M + Auto ISO', aperture: 'f/5.6 – f/8', shutter: '1/250 – 1/500 s', iso: 'Auto', focus: 'Zone focus (MF at ~3 m) or AF-C wide', wb: 'Auto' },
    why: [
      'f/8 at ~3 m gives a deep zone of sharpness, so you can shoot without waiting for autofocus.',
      'Fast shutter freezes walking people and your own movement.',
      'Auto ISO handles moving between sun and shade.',
    ],
    mistakes: ['Wide open apertures with missed focus on candid moments.', 'Hesitating. Pre-set everything so you only have to press the shutter.'],
    sim: { scene: 'night-street', settings: { mode: 'M', autoIso: true, aperture: 4, shutter: 1 / 125, focal: 35, comp: -0.7 } },
  },
  {
    id: 'panning',
    icon: '🚴',
    title: 'Panning moving subjects',
    category: 'Creative',
    summary: 'Sharp subject, streaked background: the sense of speed.',
    settings: { mode: 'Tv or M', aperture: 'f/8 – f/16 (to allow slow shutter)', shutter: '1/15 – 1/60 s', iso: '100', focus: 'AF-C, tracking', metering: 'Evaluative' },
    why: [
      'Moving the camera with the subject keeps it sharp while the static background smears.',
      'Slower shutters give more streak but more misses. Start at 1/60 and go slower.',
    ],
    steps: ['Stand parallel to the subject\'s path.', 'Twist from the hips, following smoothly.', 'Press the shutter mid-swing and keep following through.', 'Shoot bursts; expect many misses.'],
    mistakes: ['Stopping the pan when you press the shutter.', 'Shutter too fast: no streaks.'],
    challenge: 'pan-runner',
  },
  {
    id: 'macro',
    icon: '🌸',
    title: 'Close-up / macro',
    category: 'Creative',
    summary: 'Flowers, insects and small details.',
    settings: { mode: 'M or Av', aperture: 'f/8 – f/16 (depth is razor-thin up close)', shutter: '1/250+ handheld, or tripod', iso: '100–800', focus: 'Manual: rock gently forward and back', wb: 'Daylight' },
    why: [
      'Depth of field shrinks dramatically at close distances, so even f/11 is just a few millimeters.',
      'The tiniest breeze or hand movement is magnified. Use a fast shutter or a tripod.',
      'Autofocus struggles; moving the camera to focus is often easier.',
    ],
    mistakes: ['f/2.8 macro shots where only an eyelash is sharp.', 'Shooting on a windy day.'],
    gear: ['Macro lens or extension tubes', 'Diffused flash or reflector'],
    sim: { scene: 'portrait', settings: { mode: 'M', aperture: 11, shutter: 1 / 250, iso: 400, focal: 105 } },
  },
];

export const CATEGORIES = ['Action', 'People', 'Low light', 'Landscape', 'Tricky light', 'Creative'] as const;
