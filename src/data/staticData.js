export const WC = { 0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',51:'🌦️',61:'🌧️',63:'🌧️',65:'⛈️',80:'🌦️',95:'⛈️' };
export const WD = { 0:'Clear Sky',1:'Mostly Clear',2:'Partly Cloudy',3:'Overcast',45:'Foggy',51:'Light Drizzle',61:'Light Rain',63:'Moderate Rain',65:'Heavy Rain',80:'Showers',95:'Thunderstorm' };

export const PESTS = {
  cashew: [
    { nm:'Powdery Mildew', rfn:w=>w.h>80?'hi':w.h>65?'me':'lo', sea:'Feb–May', desc:'White powdery coating on leaves and nuts. Spreads rapidly when humidity exceeds 80%.', tips:['Spray Wettable Sulfur 2g/L before 9am in cool hours','Avoid spraying during rain, dew or midday heat','Repeat every 10 days during high humidity'] },
    { nm:'Tea Mosquito Bug', rfn:_=>'me', sea:'Jan–Apr', desc:'Sucks sap from tender shoots causing tip burn and shoot death.', tips:['Spray Imidacloprid 0.5ml/L early morning','Check new cashew flush for feeding marks daily','Install yellow sticky traps at canopy level'] },
    { nm:'Thrips', rfn:w=>w.h<50?'me':'lo', sea:'Dec–Mar', desc:'Tiny insects causing silvery-white streaks on tender leaves.', tips:['Monitor with blue sticky traps','Apply Spinosad 0.3ml/L if count >10/trap/day','Avoid excess nitrogen fertilization'] },
    { nm:'Stem & Root Borer', rfn:_=>'lo', sea:'Jun–Sep', desc:'Bores into trunk base leaving sawdust deposits. Weakens tree over monsoon.', tips:['Apply Chlorpyriphos 0.05% paste on trunk base','Inspect roots monthly during monsoon','Remove and burn severely infested branches'] },
  ],
  paddy: [
    { nm:'Rice Blast', rfn:w=>w.h>80?'hi':w.h>65?'me':'lo', sea:'Jul–Oct', desc:'Diamond-shaped lesions on leaves. Spreads fast in high humidity + cool nights.', tips:['Apply Tricyclazole 75% WP @ 0.6g/L at first sign','Avoid excess urea — split into 3 doses','Grow resistant varieties: Jaya, IR-64, Samba Masuri'] },
    { nm:'Brown Plant Hopper', rfn:w=>w.h>75?'hi':'me', sea:'Aug–Oct', desc:'Causes "hopperburn" — circular yellowing patches in the field.', tips:['Drain fields for 3–5 days to break breeding cycle','Spray Buprofezin 25% SC @ 1ml/L at plant base','Never use synthetic pyrethroids'] },
    { nm:'Sheath Blight', rfn:w=>w.h>85?'hi':'me', sea:'Aug–Sep', desc:'Oval water-soaked lesions at leaf sheath level.', tips:['Spray Hexaconazole 5% EC @ 2ml/L at lower stem','Avoid close planting — maintain 20×15cm spacing','Drain field intermittently to reduce humidity'] },
  ],
  coconut: [
    { nm:'Rhinoceros Beetle', rfn:_=>'me', sea:'Year-round', desc:'Bores into crown causing V-shaped cuts on fronds. Severe attack kills the palm.', tips:['Apply Naphthalene balls 10g in crown cavity','Make pit traps with cow dung + sawdust near palms','Remove dead palms — they breed rhinoceros beetles'] },
    { nm:'Red Palm Weevil', rfn:_=>'me', sea:'Year-round', desc:'Larvae bore into trunk causing collapse of crown.', tips:['Inject Chlorpyriphos 0.1% into bore holes and seal','Monitor for oozing liquid and fermenting odour','Trench treat with Imidacloprid around root zone'] },
    { nm:'Bud Rot', rfn:w=>w.h>80?'hi':'lo', sea:'Jun–Oct', desc:'Water-soaked rotting of central bud. Often fatal to young palms.', tips:['Remove infected tissue, apply Bordeaux paste','Spray Copper Oxychloride 3g/L on crown during monsoon','Improve drainage — never allow waterlogging'] },
  ],
};

export const PRODS = [
  { id:'p1', nm:'Premium Organic Fertilizer Petroganik 40kg', cat:'fertilizer', emo:'🌿', pr:135, mrp:185, inc:50, sloc:'Margao, Goa', rat:4.5, rev:128, desc:'Boost plant growth naturally with balanced nutrients. Improves soil health and yield. OMRI listed — organic certified.', feats:['Higher Yield','Soil Health','Strong Roots','Eco Friendly'] },
  { id:'p2', nm:'Tricyclazole 75% WP — Rice Blast Fungicide', cat:'pesticide', emo:'🛡️', pr:280, mrp:320, inc:40, sloc:'Panaji, Goa', rat:4.7, rev:89, desc:'Most effective systemic fungicide for Rice Blast. Rain-fast formula with 3-week protection. CIB approved.', feats:['Systemic Action','Rain-fast','3-Week Protection','CIB Approved'] },
  { id:'p3', nm:'Cashew Seedlings Vengurla-4 (High Yield)', cat:'seed', emo:'🌱', pr:45, mrp:60, inc:15, sloc:'Old Goa', rat:4.8, rev:203, desc:'High-yielding Vengurla-4 cashew variety certified by ICAR. Starts bearing in 3 years. Disease resistant.', feats:['High Yield','Disease Resistant','ICAR Certified','Early Bearing'] },
  { id:'p4', nm:'Wettable Sulfur 80% WP — Powdery Mildew', cat:'pesticide', emo:'🧴', pr:95, mrp:110, inc:0, sloc:'Mapusa, Goa', rat:4.3, rev:67, desc:'Contact fungicide for Powdery Mildew. Organic-certified. Safe for beneficial insects.', feats:['Organic Certified','Economical','Broad Spectrum'] },
  { id:'p5', nm:'DAP Diammonium Phosphate 50kg Bag', cat:'fertilizer', emo:'💚', pr:1250, mrp:1400, inc:150, sloc:'Vasco, Goa', rat:4.6, rev:341, desc:'High phosphorus fertilizer for root development. Government subsidized price.', feats:['High Phosphorus','Root Development','Govt Subsidized'] },
  { id:'p6', nm:'Complete Drip Irrigation Kit — 0.5 Acre', cat:'tool', emo:'💧', pr:3200, mrp:4500, inc:1300, sloc:'Ponda, Goa', rat:4.9, rev:512, desc:'Complete drip system for 0.5 acres. Saves 40-50% water. NABARD 50% subsidy available.', feats:['Saves 50% Water','NABARD Subsidy','Easy Install','5-Year Warranty'] },
];

export const SOIL_DATA = {
  laterite: {
    cashew: { score:78, n:'Low', p:'Low', k:'Medium', om:'1.8%', fert:'Cashew thrives in laterite! Apply 500g NPK 10:10:10/tree in April & October. Add 5kg compost/tree annually.', warn:'Watch for boron deficiency — apply Borax 10g/tree/year.' },
    paddy:   { score:62, n:'Medium', p:'Low', k:'High', om:'1.8%', fert:'Apply 2T lime/acre before transplanting. Use DAP 50kg + MOP 30kg as basal. Top-dress Urea 25kg at 30 days.', warn:'Laterite is highly acidic — liming is critical. Iron toxicity risk during waterlogging.' },
    coconut: { score:70, n:'Medium', p:'Low', k:'High', om:'1.8%', fert:'Apply 1kg Urea + 0.5kg SSP + 2kg MOP per palm/year in 2 split doses.', warn:'Coconut needs regular potassium on laterite. Ensure adequate drainage.' },
    vegetable:{ score:48, n:'Low', p:'Low', k:'Medium', om:'1.8%', fert:'Apply 1T lime + 2T FYM/acre before planting. Use 50kg DAP + 25kg MOP/acre as basal.', warn:'Acidic laterite limits yields. pH correction with lime is mandatory.' },
  },
  alluvial: {
    cashew:  { score:80, n:'High', p:'Medium', k:'High', om:'3.2%', fert:'Good for cashew. Reduce nitrogen — apply only 100g Urea/tree twice a year. Focus on potash.', warn:'Rich alluvial soil can cause excessive vegetative growth. Reduce N fertilizer.' },
    paddy:   { score:92, n:'High', p:'Medium', k:'High', om:'3.2%', fert:'Excellent for paddy! Apply DAP 50kg + MOP 30kg as basal. Top-dress Urea 25kg+25kg at 30 & 55 days.', warn:'Watch for iron toxicity if permanently waterlogged.' },
    coconut: { score:88, n:'High', p:'Medium', k:'High', om:'3.2%', fert:'Excellent for coconut. Apply standard: 1kg Urea + 0.5kg SSP + 2kg MOP/palm/year.', warn:'Monitor drainage in low-lying khazan areas. Salt intrusion can affect coastal soils.' },
    vegetable:{ score:90, n:'High', p:'Medium', k:'High', om:'3.2%', fert:'Ideal for vegetables. Add only 1T FYM/acre + 30kg DAP as starter fertilizer.', warn:'Rich soil — monitor for aphids and soft-growth pests.' },
  },
  clay: {
    cashew:  { score:38, n:'High', p:'High', k:'Medium', om:'2.5%', fert:'Suboptimal for cashew — poor drainage risks root rot. Add organic matter, grow on ridges.', warn:'Cashew is very sensitive to waterlogging. Grow on elevated land.' },
    paddy:   { score:72, n:'High', p:'High', k:'Medium', om:'2.5%', fert:'Good for paddy but drainage is critical. Apply standard DAP 50kg + MOP 30kg.', warn:'Clay waterlogging causes hydrogen sulfide toxicity. Install drainage channels.' },
    coconut: { score:60, n:'High', p:'High', k:'Medium', om:'2.5%', fert:'Moderate for coconut. Ensure drainage. Apply standard fertilizer + additional MOP 500g/palm.', warn:'Create circular trenches around palms for drainage.' },
    vegetable:{ score:55, n:'High', p:'High', k:'Medium', om:'2.5%', fert:'Raise beds to improve drainage. Add sand + FYM to improve texture.', warn:'Root vegetables difficult on clay. Focus on leafy vegetables and beans.' },
  },
  sandy: {
    cashew:  { score:72, n:'Low', p:'Low', k:'Low', om:'0.8%', fert:'Sandy coastal soil suits cashew well. Mulch with 10kg organic matter/tree. Apply foliar spray monthly.', warn:'Leaching is rapid — use slow-release fertilizers. Add bentonite clay.' },
    paddy:   { score:35, n:'Low', p:'Low', k:'Low', om:'0.8%', fert:'Poor for paddy — high leaching. Increase doses by 30% and split into 4 applications.', warn:'Sandy soil is not suitable for paddy. Consider drip irrigation with fertigation.' },
    coconut: { score:78, n:'Low', p:'Low', k:'Low', om:'0.8%', fert:'Coconut does well on coastal sandy soils. Apply Urea + MOP + compost.', warn:'Salt spray from sea can damage palms within 200m of coast.' },
    vegetable:{ score:45, n:'Low', p:'Low', k:'Low', om:'0.8%', fert:'Add heavy organic matter (3T FYM/acre). Use drip fertigation with frequent small doses.', warn:'Water-stress risk is high. Install drip irrigation.' },
  },
};

export function timeAgo(iso) {
  if (!iso) return 'Just now';
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'Just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}
