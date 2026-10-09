/* NOKT FIELD LOG — static configuration & schemas.
   Everything the paper appendices used to hold lives here. */
var CFG = (function () {

  var FACTORY_STATUS = ['Not contacted', 'Contacted', 'Replied', 'Quoted', 'Visited', 'Shortlisted', 'Rejected'];

  /* ---- Appendix A: 12 capability questions ---- */
  var FACTORY_QUESTIONS = [
    { id: 'q1', short: 'Stretch capability',
      q: 'Do you work with high-elastane knits (18–28% elastane, nylon/elastane warp knits)? What proportion of your work is stretch vs cotton jersey?',
      ctl: { type: 'slider', key: 'pct', label: 'Share of work that is stretch', min: 0, max: 100, step: 5, unit: '%' } },
    { id: 'q2', short: 'Flatlock',
      q: 'Do you have flatlock machines? How many, and what configuration?',
      ctl: { type: 'yesno+num', key: 'yes', numKey: 'count', numLabel: 'How many machines', unit: 'units' } },
    { id: 'q3', short: 'Coverstitch',
      q: 'Do you have coverstitch capability?',
      ctl: { type: 'yesno', key: 'yes' } },
    { id: 'q4', short: 'Bonding',
      q: 'Do you have seam bonding / heat-welding / taping equipment?',
      ctl: { type: 'yesno', key: 'yes' } },
    { id: 'q5', short: 'MOQ basis', critical: true,
      q: 'Is your MOQ counted per style, or per size within a style? (If I produce one style in 3 sizes, is that 1 × MOQ or 3 × MOQ?)',
      ctl: { type: 'radio', key: 'basis', options: ['Per style', 'Per size', 'Unclear'] } },
    { id: 'q6', short: 'MOQ',
      q: 'What is your minimum order quantity for a legging-type garment?',
      ctl: { type: 'number', key: 'moq', unit: 'units' } },
    { id: 'q7', short: 'Sample',
      q: 'What do you charge for a first sample, and what is the lead time?',
      ctl: { type: 'money+days', key: 'cost', daysKey: 'days' } },
    { id: 'q8', short: 'Pattern-making',
      q: 'Do you offer pattern-making, or should I supply a finished pattern?',
      ctl: { type: 'radio', key: 'pattern', options: ['They make patterns', 'I supply pattern', 'Unclear'] } },
    { id: 'q9', short: 'Pattern-maker ref',
      q: 'Can you recommend a pattern-maker experienced in stretch/activewear?',
      ctl: { type: 'contact', nameKey: 'pmName', phoneKey: 'pmPhone' } },
    { id: 'q10', short: 'Sourcing',
      q: 'Do I supply fabric and trims, or can you source?',
      ctl: { type: 'radio', key: 'sourcing', options: ['They can source', 'I supply', 'Mixed'] } },
    { id: 'q11', short: 'CMT price',
      q: 'Indicative CMT price per unit — full-length men\'s legging, 4–6 panels, flatlock construction, elasticated waistband, at your MOQ?',
      ctl: { type: 'number', key: 'cmt', unit: 'R', money: true } },
    { id: 'q12', short: 'Production lead time',
      q: 'What is your lead time from approved sample to delivered production?',
      ctl: { type: 'number', key: 'weeks', unit: 'weeks' } }
  ];

  var QUESTIONNAIRE_INTRO =
    "Good day,\n\nI'm developing a premium men's technical legwear brand based in Cape Town and I'm assessing local production partners. " +
    "Before I finalise my design I'd like to understand your capability. Would you mind answering the following?\n";
  var QUESTIONNAIRE_OUTRO = "\nI'm happy to visit the factory. Thank you for your time.";

  /* ---- Appendix B: 10-test fabric protocol ---- */
  var FABRIC_TESTS = [
    { id: 't1', n: 1, name: 'Opacity under stretch', critical: true, input: 'passfail', photo: true,
      method: 'Stretch the swatch 60% over printed text, in bright daylight.', pass: 'Text not readable; no greying' },
    { id: 't2', n: 2, name: 'Opacity over skin', critical: true, input: 'passfail', photo: true,
      method: 'Stretch 60% directly over bare skin, bright light behind AND in front. Photograph it — the camera is more honest than your eye.', pass: 'No skin tone visible' },
    { id: 't3', n: 3, name: 'Extension — lengthwise', input: 'number', unit: '%', min: 60, photo: false,
      method: 'Mark 10 cm. Stretch to comfortable maximum. Measure. Use the same hand force every time.', pass: '≥ 60% — target 60–80%' },
    { id: 't4', n: 4, name: 'Extension — crosswise', input: 'number', unit: '%', min: 70, photo: false,
      method: 'As above, perpendicular to the first test (around the body).', pass: '≥ 70% — target 70–90%' },
    { id: 't5', n: 5, name: 'Recovery', critical: true, input: 'number', unit: '%', min: 90, photo: false,
      method: 'Mark 10 cm. Hold at 50% extension for 2 min. Release. Measure after 60 s. Recovery % = (stretched − recovered) ÷ (stretched − original) × 100.',
      pass: '≥ 90% — target ≥ 95%' },
    { id: 't6', n: 6, name: 'Growth', input: 'number', unit: '%', max: 3, photo: false,
      method: 'Repeat load/release 10 times. Measure permanent lengthening against the original 10 cm. Most growth happens in the first 3 cycles.',
      pass: '≤ 3% — reject above 5%' },
    { id: 't7', n: 7, name: 'Surface', critical: true, input: 'passfail', photo: true,
      method: 'Photograph under direct light.', pass: 'Matte. Any sheen fails.' },
    { id: 't8', n: 8, name: 'Hand feel', input: 'rating', min: 3, photo: false,
      method: 'Against inner forearm and inner thigh.', pass: 'No scratch, no rubber feel (3+)' },
    { id: 't9', n: 9, name: 'Weight', critical: true, input: 'number', unit: 'gsm', min: 240, max: 320, photo: false,
      method: 'Cut exactly 10×10 cm and weigh on a 0.1 g scale, ×100. A 0.1 g error = 10 gsm, so cut accurately.',
      pass: '240–320 gsm — target 260–285' },
    { id: 't10', n: 10, name: 'Seam puncture', input: 'passfail', photo: true,
      method: 'Hand-stitch a test seam, stretch to failure.', pass: 'Fabric fails before the seam' }
  ];

  /* ---- Appendix C: 18-point measurement set ---- */
  var BODY_GIRTHS = [
    { id: 'waistNatural', label: 'Natural waist', help: 'Narrowest point of the torso, usually just above the navel. Tape snug, not compressing.' },
    { id: 'waistLow', label: 'Low waist (waistband position)', help: 'Where the waistband will actually sit. Mark it and keep the mark consistent across all sessions.' },
    { id: 'hipHigh', label: 'High hip', help: 'Roughly 8–10 cm below the low waist, across the top of the hip bone.' },
    { id: 'hipFull', label: 'Full hip / seat', help: 'The fullest point of the seat, feet together. The single most important girth for glute fit.' },
    { id: 'thighUpper', label: 'Thigh — upper (crotch level)', help: 'Horizontally at the crotch, highest possible point of the thigh.' },
    { id: 'thighMid', label: 'Thigh — mid', help: 'Halfway between crotch and knee. Weight evenly on both feet.' },
    { id: 'knee', label: 'Knee', help: 'Across the centre of the kneecap, leg straight.' },
    { id: 'calfMax', label: 'Calf — maximum', help: 'The widest point of the calf, standing, weight even.' },
    { id: 'ankle', label: 'Ankle', help: 'Just above the ankle bone. Determines whether the hem can pass over the heel.' }
  ];
  var BODY_LENGTHS = [
    { id: 'riseFront', label: 'Front rise', help: 'Low waist at centre front, down to the crotch point.' },
    { id: 'riseBack', label: 'Back rise', help: 'Low waist at centre back, down to the crotch point. Usually longer than front rise.' },
    { id: 'riseTotal', label: 'Total rise', help: 'Front waist, through the crotch, to back waist in one continuous measurement.' },
    { id: 'inseam', label: 'Inside leg / inseam', help: 'Crotch point to floor along the inner leg, barefoot.' },
    { id: 'outseam', label: 'Outside leg', help: 'Low waist to floor down the outside of the leg, barefoot.' },
    { id: 'waistToKnee', label: 'Low waist to knee', help: 'Down the outside of the leg to the centre of the kneecap. Sets knee panel placement.' },
    { id: 'kneeToAnkle', label: 'Knee to ankle', help: 'Centre of kneecap to the ankle measuring point.' },
    { id: 'crotchDepth', label: 'Crotch depth (seated)', help: 'Sit on a hard flat chair. Measure from low waist at the side down to the seat surface.' }
  ];
  var EASE_ZONES = [
    { id: 'waist', label: 'Waist', from: 'waistLow' },
    { id: 'hip', label: 'Hip / seat', from: 'hipFull' },
    { id: 'thigh', label: 'Thigh', from: 'thighMid' },
    { id: 'knee', label: 'Knee', from: 'knee' },
    { id: 'calf', label: 'Calf', from: 'calfMax' },
    { id: 'ankle', label: 'Ankle', from: 'ankle' }
  ];
  var EASE_PRESETS = [
    { id: 'light', name: 'Light compression', note: '8–15% — everyday wear, all-day comfort',
      zones: { waist: 10, hip: 8, thigh: 12, knee: 10, calf: 14, ankle: 15 } },
    { id: 'firm', name: 'Firm compression', note: '15–25% — training and support',
      zones: { waist: 15, hip: 15, thigh: 20, knee: 16, calf: 22, ankle: 25 } }
  ];

  /* ---- Fit sessions ---- */
  var FIT_SLOTS = [
    'Front standing', 'Back standing', 'Left side', 'Right side',
    'Squat (front)', 'Squat (back)', 'Seated', 'Lunge', 'Walking',
    'Front detail', 'Waistband', 'Hem'
  ];
  var ZONES = ['Waist', 'Abdomen', 'Hip', 'Glute', 'Perineum', 'Genital region', 'Inner thigh',
    'Outer thigh', 'Knee', 'Calf', 'Ankle', 'Waistband', 'Hem', 'Gusset'];
  var ISSUE_TYPES = ['Too tight', 'Too loose', 'Riding up', 'Rolling down', 'Twisting / torque',
    'Seam pressure', 'Transparency', 'Wrinkling / pooling', 'Restricted movement', 'Chafing', 'Other'];
  var FIT_VERDICTS = ['Not assessed', 'Reject', 'Major corrections', 'Minor corrections', 'Approve'];

  /* ---- Wear tests ---- */
  var ACTIVITIES = ['Walking', 'Gym / lifting', 'Running', 'Seated work', 'Lounging', 'Cycling', 'Stairs', 'Driving', 'Social / public'];
  var CHECKIN_METRICS = [
    { id: 'comfort', label: 'Comfort' },
    { id: 'support', label: 'Support' },
    { id: 'discretion', label: 'Discretion' },
    { id: 'temperature', label: 'Temperature' },
    { id: 'waistband', label: 'Waistband hold' }
  ];

  /* ---- Cost model ---- */
  var COST_DEFAULTS = {
    fabricPricePerM: 185, metresPerUnit: 1.35, markerWidth: 150, garmentLength: 105, efficiency: 82,
    trims: 18, cmt: 160, labels: 22, freight: 15, wastage: 8,
    fxUsd: 17.8, fxEur: 19.4, retail: 1950, moq: 75, sizes: 3, moqBasis: 'Per size'
  };
  var COMPETITORS = [
    { id: 'c1', name: 'adidas Techfit', lo: 35, hi: 35, cur: 'USD' },
    { id: 'c2', name: 'Kapow Originals', lo: 62.99, hi: 89.99, cur: 'USD' },
    { id: 'c3', name: 'Modus Vivendi Dry Tech', lo: 66.8, hi: 66.8, cur: 'EUR' },
    { id: 'c4', name: 'Rufskin Sport', lo: 68, hi: 87, cur: 'USD' },
    { id: 'c5', name: 'Under Armour Launch Elite', lo: 90, hi: 90, cur: 'USD' },
    { id: 'c6', name: 'Matador Meggings', lo: 91.9, hi: 91.9, cur: 'USD' },
    { id: 'c7', name: 'Lululemon Wunder Train', lo: 98, hi: 128, cur: 'USD' },
    { id: 'c8', name: 'ES Collection Vertex', lo: 110, hi: 110, cur: 'USD' },
    { id: 'c9', name: 'Kapow Vinyl', lo: 114.99, hi: 114.99, cur: 'USD' }
  ];

  /* ---- Decision log ---- */
  var DEC_STATUS = ['Open', 'Resolved', 'Reversed'];
  var DEC_CONF = ['Low', 'Medium', 'High'];

  /* ---- 30-day roadmap ---- */
  var ROADMAP = [
    { w: 1, d: 1, t: 'Send capability questionnaire to 5 CMTs' },
    { w: 1, d: 2, t: 'Rewrite fabric spec — all 8 parameters' },
    { w: 1, d: 3, t: 'Request 20×20 cm swatches from 4 suppliers' },
    { w: 1, d: 4, t: 'Patent scan: SAXX, Separatec, UFM' },
    { w: 1, d: 5, t: 'Capture fit-body measurements' },
    { w: 1, d: 6, t: 'Chase non-responders' },
    { w: 1, d: 7, t: 'Build cost model skeleton' },
    { w: 2, d: 8, t: 'Run fabric test protocol on all swatches' },
    { w: 2, d: 9, t: 'Build landing page with a real price' },
    { w: 2, d: 10, t: 'Build 2 ad creatives — technical vs sensual' },
    { w: 2, d: 11, t: 'Launch ad test, R1,000–1,500' },
    { w: 2, d: 12, t: 'Source 3 pattern-makers' },
    { w: 2, d: 13, t: 'Shortlist the fabric' },
    { w: 2, d: 14, t: 'Week 2 review' },
    { w: 3, d: 15, t: 'Read ad data — resolve positioning' },
    { w: 3, d: 16, t: 'Rank the front trade-off' },
    { w: 3, d: 17, t: 'Choose ONE front architecture' },
    { w: 3, d: 18, t: 'Produce the Alpha tech pack' },
    { w: 3, d: 19, t: 'Brief the pattern-maker in person' },
    { w: 3, d: 20, t: 'Buy fabric for 3 prototypes' },
    { w: 3, d: 21, t: 'Week 3 review' },
    { w: 4, d: 22, t: 'Pattern-maker: block + pattern (1/3)' },
    { w: 4, d: 23, t: 'Pattern-maker: block + pattern (2/3)' },
    { w: 4, d: 24, t: 'Review the paper pattern before cutting' },
    { w: 4, d: 25, t: 'Toile in cheap stretch fabric first' },
    { w: 4, d: 26, t: 'Fit session — full photo set' },
    { w: 4, d: 27, t: 'Pattern corrections' },
    { w: 4, d: 28, t: 'Cut and sew Alpha 1 in real fabric' },
    { w: 4, d: 29, t: '8-hour wear test' },
    { w: 4, d: 30, t: 'Audit V2' }
  ];
  var WEEK_TITLES = {
    1: 'Manufacturing & material reality',
    2: 'Demand signal & pattern-maker',
    3: 'Architecture decision & pattern commission',
    4: 'First physical object'
  };
  var GATES = [
    { id: 'g1', w: 1, label: 'Week 1 gate', cond: '≥2 factory replies AND ≥2 swatch sets in hand' },
    { id: 'g2', w: 2, label: 'Week 2 gate', cond: 'Ads live, fabric down to 2, pattern-maker quotes received' },
    { id: 'g3', w: 3, label: 'Week 3 gate', cond: 'Pattern commissioned, fabric bought, positioning resolved' },
    { id: 'g4', w: 4, label: 'Week 4 gate', cond: 'A real garment exists on a real body' }
  ];

  var SEED_DECISIONS = [
    { n: 'Q1', title: 'Which single customer does NOKT serve first?',
      fact: 'The $90–115 men\'s legging tier is occupied almost entirely by ES Collection, Rufskin and Modus Vivendi — sensual menswear. The $60–92 tier is print-led (Kapow, Matador). No occupied "serious technical luxury" tier.',
      assumption: 'That the empty tier is a gap rather than proof that technical-minimalist men buy trousers, not leggings.',
      hypothesis: 'The technical-minimalist man is the described positioning; the fashion/sensual man is the customer who buys first.',
      rec: 'Resolve with paid-ad data (two creatives, same product, same price), not with taste.',
      mind: 'A clear conversion gap between the two ad creatives.' },
    { n: 'Q2', title: 'Priority order of the front trade-off: support / accommodation / discretion?',
      fact: 'Documented complaint in the category is "everything smushed" — a compression failure, not a support failure. Support is the problem underwear already solves.',
      assumption: 'That buyers will wear NOKT over underwear rather than commando.',
      hypothesis: 'Accommodation > discretion > support is the correct ranking.',
      rec: 'Adopt accommodation > discretion > support until a wear test contradicts it.',
      mind: 'Wear-test check-ins scoring support below 3 repeatedly.' },
    { n: 'Q3', title: 'What is the actual fabric specification?',
      fact: 'Current spec says "approximately 40% four-way stretch fabric". A fabric needs 8 parameters: composition, construction, gsm, width, extension both directions, recovery, opacity, modulus.',
      assumption: 'That 230–300 gsm is the right weight band for standalone black opacity.',
      hypothesis: 'A nylon/elastane warp knit at 240–290 gsm, matte, will pass all four critical tests.',
      rec: 'Do not cost anything until the spec is rewritten in full.', mind: 'Swatch test results.' },
    { n: 'Q4', title: 'Negative ease figure per body zone?',
      fact: 'Light compression typically implies 8–15% negative ease on girths; firm 15–25%.',
      assumption: 'That a single ease profile works across the whole leg.',
      hypothesis: 'Differential ease per zone (lower at hip, higher at calf/ankle) is required.',
      rec: 'Build the ease profile in the Fit Body module, test on the toile.', mind: 'Fit session issue log.' },
    { n: 'Q5', title: 'Whose body is the fit standard?',
      fact: 'No fit model, no base measurement set, no size range currently exist.',
      assumption: 'That one fit body can represent the target customer.',
      hypothesis: 'A single named, repeatedly available fit body is sufficient for Alpha.',
      rec: 'Name the fit body and capture all 18 measurements before any pattern work.', mind: '—' },
    { n: 'Q6', title: 'Can a low-profile waistband hold a standalone legging?',
      fact: 'The waistband is the #1 functional failure in standalone legwear. Low profile has less surface area to generate holding force.',
      assumption: 'That internal elastic tape alone is sufficient.',
      hypothesis: 'Rise height compensation matters more than waistband width.',
      rec: 'Test three rise heights on the toile.', mind: 'Wear test: waistband hold score over 8 hours.' },
    { n: 'Q7', title: 'Does the no-seam architecture survive a real pattern-maker?',
      fact: 'A tube cut from flat fabric must close somewhere. Seamless circular knit needs Santoni machinery at thousands-of-units MOQ.',
      assumption: 'That posterior-leg closure delivers the intended visual result.',
      hypothesis: 'Relocating closure to the posterior leg and absorbing the inner-thigh seam into gusset geometry gives 90% of the effect.',
      rec: 'Brief the pattern-maker and ask them to attack the rule. Listen.', mind: 'Pattern-maker judgement.' },
    { n: 'Q8', title: 'Does the pouch geometry infringe SAXX / Separatec / UFM claims?',
      fact: 'SAXX BallPark Pouch is patented (mesh side panels, I-shaped pouch, flat seams). Separatec holds dual-pouch IP. UFM holds adjustable-pouch IP.',
      assumption: 'That integrated geometry rather than an inserted pouch falls outside those claims.',
      hypothesis: 'No infringement, but unverified.',
      rec: 'Google Patents first pass. Blocks launch, not prototyping.', mind: 'A matching independent claim.' }
  ];

  var SEED_FACTORIES = [
    { name: 'Amari CMT', address: '232 Albert Rd, Woodstock, Cape Town', contact: 'Nadia Jacobs', phone: '', email: '',
      notes: 'Boutique. States MOQ 75 units per style. No pattern-making or fabric sourcing in house — client supplies patterns, fabric and trims. Describes itself as "quality, not affordability".' },
    { name: 'Cape Town CMT', address: '45 M163, Observatory, Cape Town', contact: '', phone: '+27 63 970 7094', email: 'hello@capetowncmt.co.za',
      notes: 'Lists activewear from R210. 4–6 week lead time. Sample-first, small MOQ claimed.' },
    { name: 'Troy Textiles CMT', address: 'Cape Town', contact: '', phone: '', email: '',
      notes: 'Claims facility fully set up for knits and stretch materials. In-house printing and embroidery. Claim not yet verified.' },
    { name: 'The Cotton Crew CMT', address: 'Cape Town', contact: 'Roxanne / Marcelle', phone: '', email: '',
      notes: 'End-to-end CMT, pattern-making off-site. Specialises in knit garments — mostly cotton jersey. Stretch capability unknown.' },
    { name: 'Edit Atelier', address: 'Woodstock, Cape Town', contact: '', phone: '', email: '',
      notes: 'Lists loungewear & underwear and seamless among categories. Worth probing on gusset and pouch construction.' }
  ];


  var FABRIC_SPEC = [
    { p: 'P1', name: 'Composition', target: '78-80% nylon 6,6 / 20-22% branded elastane (Lycra, creora, ROICA)',
      accept: '70-85% polyamide, 15-30% elastane', reject: 'Under 15% elastane, any cotton, unbranded spandex',
      why: 'Nylon holds structure under stretch. Branded elastane keeps compression alive past wear 30 — which is when repeat purchase is decided.' },
    { p: 'P2', name: 'Mass', target: '260-285 gsm', accept: '245-300 gsm', reject: 'Under 240 gsm, or over 320 gsm',
      why: 'The single best predictor of opacity. Carvico Vita is 190 gsm and would fail. Black buys ~20-30 gsm of latitude - do not spend it.' },
    { p: 'P3', name: 'Construction', target: 'Warp knit (tricot) or double-knit interlock',
      accept: 'Dense circular double-knit', reject: 'Single jersey, anything brushed-back or "buttery soft"',
      why: 'Beats composition for opacity. Single-knit loops separate under load and open light paths. Brushed hand = the construction that fails.' },
    { p: 'P4', name: 'Usable width', target: '150 cm or more, cuttable', accept: '140-160 cm', reject: 'Under 135 cm',
      why: 'Drives metres per unit, which drives landed cost. Ask for cuttable width, not total. Ask whether the edge curls.' },
    { p: 'P5', name: 'Extension', target: '70-90% crosswise, 60-80% lengthwise, four-way',
      accept: '60% or more on both axes', reject: 'Under 50% either axis, or two-way only',
      why: 'Controls how few sizes you can launch with. Low stretch forces per-size MOQ - the R135k scenario instead of R30k.' },
    { p: 'P6', name: 'Recovery / growth', target: '95%+ recovery, 3% or less growth', accept: '90%+ / 4% or less',
      reject: 'Under 85% recovery, or over 5% growth',
      why: 'Decides whether the garment reads luxury or cheap. Nobody sees gsm. Everybody sees a baggy knee.' },
    { p: 'P7', name: 'Opacity at 60% extension', target: 'Zero skin tone, over skin, bright light',
      accept: 'Zero skin tone at 50%', reject: 'Any skin tone or underwear line, at any extension',
      why: 'Not a feature - the licence to operate. Automatic REJECT regardless of every other score.' },
    { p: 'P8', name: 'Surface & durability', target: 'Matte, dry hand, 20k+ Martindale, pilling 4+',
      accept: 'Matte to semi-matte', reject: 'Any sheen, buttery/brushed hand',
      why: 'Sheen reads as cheap compression-wear and collides with the sensual-menswear tier. Matte is free positioning.' }
  ];

  var SUPPLIER_CONTACTS = [
    { name: 'Chothia Bros', note: 'Strongest local candidate. Formtex Lycra - high-Lycra, explicitly for tights.',
      web: 'https://chothiabros.co.za/fabrics/fabrics-for-sportswear', tel: '', email: '' },
    { name: 'Active Fabrics', note: '36 3rd Ave, Elsiesrivier. Walk-in. Nearest plain black nylon/spandex.',
      web: 'https://activefabrics.co.za', tel: '+27215926230', email: 'info@acactivewear.co.za' },
    { name: 'SK Textiles', note: 'Activewear and swimwear knits, roughly R48-110/m.',
      web: 'https://sktextiles.co.za', tel: '', email: '' },
    { name: 'Rubitex', note: 'Cape Town importer and wholesaler since 1991. Woven and knit.',
      web: 'https://rubitex.co.za', tel: '', email: '' },
    { name: 'Ahmeds', note: 'Retail benchmark only - Nylon Lycra R140/m. Use to sanity-check wholesale quotes.',
      web: 'https://ahmeds.co.za', tel: '', email: '' }
  ];

  var SUPPLIER_ENQUIRY =
    'Good day - I am developing a premium men\'s legging and sourcing a black technical stretch knit. ' +
    'Could you tell me what you have against this spec, and quote for swatches?\n\n' +
    '- Composition: nylon/elastane, 15-30% elastane (branded elastane preferred)\n' +
    '- Weight: 240-300 gsm - this is firm, below 240 will not work\n' +
    '- Construction: warp knit or double-knit interlock (not single jersey, not brushed)\n' +
    '- Usable width, and whether the edge curls\n' +
    '- Four-way stretch - approximate % both crosswise and lengthwise if known\n' +
    '- Matte finish, black\n\n' +
    'Please send: price per metre, minimum cut, roll width, current black stock, and whether swatches ' +
    'are available (I will pay for swatches and courier). Swatches need to be at least 20 x 20 cm so I ' +
    'can test extension and opacity properly.\n\n' +
    'I am in Cape Town and can collect. Thank you.';

  var FABRIC_SUPPLIERS = ['Chothia Bros', 'Active Fabrics (Elsiesrivier)', 'SK Textiles', 'Rubitex', 'Other'];

  return {
    FACTORY_STATUS: FACTORY_STATUS, FACTORY_QUESTIONS: FACTORY_QUESTIONS,
    QUESTIONNAIRE_INTRO: QUESTIONNAIRE_INTRO, QUESTIONNAIRE_OUTRO: QUESTIONNAIRE_OUTRO,
    FABRIC_TESTS: FABRIC_TESTS, FABRIC_SUPPLIERS: FABRIC_SUPPLIERS,
    FABRIC_SPEC: FABRIC_SPEC, SUPPLIER_CONTACTS: SUPPLIER_CONTACTS, SUPPLIER_ENQUIRY: SUPPLIER_ENQUIRY,
    BODY_GIRTHS: BODY_GIRTHS, BODY_LENGTHS: BODY_LENGTHS,
    BODY_ALL: BODY_GIRTHS.concat(BODY_LENGTHS),
    EASE_ZONES: EASE_ZONES, EASE_PRESETS: EASE_PRESETS,
    FIT_SLOTS: FIT_SLOTS, ZONES: ZONES, ISSUE_TYPES: ISSUE_TYPES, FIT_VERDICTS: FIT_VERDICTS,
    ACTIVITIES: ACTIVITIES, CHECKIN_METRICS: CHECKIN_METRICS,
    COST_DEFAULTS: COST_DEFAULTS, COMPETITORS: COMPETITORS,
    DEC_STATUS: DEC_STATUS, DEC_CONF: DEC_CONF,
    ROADMAP: ROADMAP, WEEK_TITLES: WEEK_TITLES, GATES: GATES,
    SEED_DECISIONS: SEED_DECISIONS, SEED_FACTORIES: SEED_FACTORIES
  };
})();
