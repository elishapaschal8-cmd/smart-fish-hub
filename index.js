require('dotenv').config();
const express = require('express');
const app = express();
const PORT = 3000;
const db = require('./database');
const { zungumzaNaDaktari } = require('./daktari');
const { sajili, ingia, thibitisha } = require('./auth');

app.use(express.json());

// ============================================
// KNOWLEDGE BASE
// ============================================

const KB_FEEDING = [
  { min_abw: 0,   max_abw: 0.5,  rate: 17.5, pellet: '0.5mm', frequency: 8 },
  { min_abw: 0.5, max_abw: 5,    rate: 11.0, pellet: '1mm',   frequency: 5 },
  { min_abw: 5,   max_abw: 20,   rate: 7.0,  pellet: '1.5mm', frequency: 4 },
  { min_abw: 20,  max_abw: 100,  rate: 4.5,  pellet: '2mm',   frequency: 3 },
  { min_abw: 100, max_abw: 250,  rate: 2.75, pellet: '3mm',   frequency: 3 },
  { min_abw: 250, max_abw: 400,  rate: 1.9,  pellet: '4mm',   frequency: 2 },
  { min_abw: 400, max_abw: 9999, rate: 1.35, pellet: '4mm',   frequency: 2 },
];

const KB_TEMPERATURE = [
  { min: 26,   max: 30,   multiplier: 1.00, status: 'Optimum',       decision: 'Lisha kawaida' },
  { min: 24,   max: 25.9, multiplier: 0.95, status: 'Baridi kidogo', decision: 'Punguza 5%' },
  { min: 22,   max: 23.9, multiplier: 0.90, status: 'Baridi',        decision: 'Punguza 10%' },
  { min: 0,    max: 21.9, multiplier: 0.85, status: 'Baridi sana',   decision: 'Punguza 15%' },
  { min: 30.1, max: 31,   multiplier: 0.95, status: 'Joto kidogo',   decision: 'Punguza 5%' },
  { min: 31.1, max: 32,   multiplier: 0.85, status: 'Joto',          decision: 'Punguza 15%' },
  { min: 32.1, max: 99,   multiplier: 0.70, status: 'Joto sana',     decision: 'Punguza 30%' },
];

const KB_DO = [
  { min: 5,   max: 99, multiplier: 1.00, status: 'Bora',    decision: 'Kawaida' },
  { min: 4,   max: 5,  multiplier: 0.95, status: 'Nzuri',   decision: 'Punguza kidogo' },
  { min: 3,   max: 4,  multiplier: 0.75, status: 'Chini',   decision: 'Punguza sana' },
  { min: 0,   max: 3,  multiplier: 0.00, status: 'HATARI',  decision: 'SIMAMISHA KULISHA' },
];

const KB_FEED_RESPONSE = {
  'Aggressive': { multiplier: 1.05, score: 3 },
  'Normal':     { multiplier: 1.00, score: 2 },
  'Slow':       { multiplier: 0.85, score: 1 },
  'No Feeding': { multiplier: 0.00, score: 0 },
};

const KB_WATER = {
  oxygen: [
    {
      min: 5.0, max: 99, hali: 'Bora ✅', color: 'bora',
      pond: 'Oksijeni iko vizuri. Endelea kulisha kawaida.',
      concrete: 'Oksijeni iko vizuri. Angalia aerator kama upo.',
      liner: 'Oksijeni iko vizuri. Hakuna hatua inayohitajika.',
      cage: 'Oksijeni iko vizuri. Lisha kawaida.',
      ras: 'Oksijeni iko vizuri. Pump inafanya kazi vizuri.',
      tank: 'Oksijeni iko vizuri. Endelea kulisha kawaida.'
    },
    {
      min: 3.5, max: 5.0, hali: 'Angalia ⚠️', color: 'tahadhari',
      pond: 'Punguza kulisha kwa 50%. Washa aerator. Angalia kama mbolea nyingi zimeingia.',
      concrete: 'Punguza kulisha kwa 50%. Washa aerator. Concrete inapoteza oksijeni haraka — angalia mzunguko wa maji.',
      liner: 'Punguza kulisha kwa 50%. Washa aerator. Liner inazuia hewa — ongeza mzunguko.',
      cage: 'Punguza kulisha kwa 50%. Washa aerator. Huwezi kubadili maji ya ziwa.',
      ras: 'Angalia pump za oksijeni na biofilter. Punguza kulisha.',
      tank: 'Washa aerator. Punguza kulisha kwa 50%. Badilisha 20% ya maji.'
    },
    {
      min: 2.0, max: 3.5, hali: 'Hatari 🚨', color: 'hatari',
      pond: 'ACHA KULISHA. Washa aerator SASA. Badilisha 30% ya maji. Angalia mwani mwingi.',
      concrete: 'ACHA KULISHA. Washa aerator SASA. Badilisha 40% ya maji. Angalia drain ya chini.',
      liner: 'ACHA KULISHA. Washa aerator SASA. Badilisha 40% ya maji. Angalia kama liner ina mashimo.',
      cage: 'ACHA KULISHA. Washa aerator. Hamia samaki wachache kisimba kingine.',
      ras: 'ACHA KULISHA. Angalia biofilter na pump za hewa SASA.',
      tank: 'ACHA KULISHA. Badilisha 50% ya maji HARAKA. Washa aerator.'
    },
    {
      min: 0, max: 2.0, hali: 'DHARURA 🆘', color: 'hatari',
      pond: 'DHARURA! Badilisha maji SASA. Washa aerator nguvu zote. Toa samaki wanaoogelea juu!',
      concrete: 'DHARURA! Fungua drain na pumpia maji mapya SASA. Washa aerator zote.',
      liner: 'DHARURA! Badilisha maji yote HARAKA. Angalia liner. Washa aerator!',
      cage: 'DHARURA! Hamia samaki eneo jingine la ziwa HARAKA. Washa aerator nguvu zote.',
      ras: 'DHARURA! Mfumo wa oksijeni umeshindwa. Badilisha maji na angalia pump SASA.',
      tank: 'DHARURA! Badilisha maji yote SASA. Samaki wako hatarini!'
    },
  ],
  temperature: [
    {
      min: 25, max: 31, hali: 'Bora ✅', color: 'bora',
      pond: 'Joto bora. Lisha kiasi kamili. Udongo unasaidia kudumisha joto.',
      concrete: 'Joto bora. Lisha kiasi kamili. Angalia joto asubuhi na jioni — concrete inabadilika haraka.',
      liner: 'Joto bora. Lisha kiasi kamili. Liner inaweza kupasha joto haraka mchana.',
      cage: 'Joto bora. Lisha kiasi kamili.',
      ras: 'Joto bora. Mfumo unafanya kazi vizuri.',
      tank: 'Joto bora. Lisha kiasi kamili.'
    },
    {
      min: 22, max: 25, hali: 'Baridi ❄️', color: 'tahadhari',
      pond: 'Joto baridi. Punguza kulisha kwa 30%. Usibadilishe maji mengi — udongo unahifadhi joto.',
      concrete: 'Joto baridi. Punguza kulisha kwa 30%. Concrete inapoteza joto haraka — weka kivuli usiku.',
      liner: 'Joto baridi. Punguza kulisha kwa 30%. Liner haina uwezo wa kuhifadhi joto — fikiria kifuniko.',
      cage: 'Joto baridi. Punguza kulisha kwa 30%. Huwezi kubadili joto la ziwa.',
      ras: 'Angalia heater ya mfumo. Punguza kulisha kwa 30%.',
      tank: 'Hamia tanki mahali pa jua. Punguza kulisha kwa 30%.'
    },
    {
      min: 31, max: 34, hali: 'Joto 🔥', color: 'tahadhari',
      pond: 'Joto juu. Punguza kulisha kwa 50%. Ongeza maji baridi. Panda miti kwa kivuli.',
      concrete: 'Joto juu! Concrete inachukua joto la jua — weka kivuli SASA. Pumpia maji baridi. Punguza kulisha kwa 50%.',
      liner: 'Joto juu! Liner inachukua joto haraka — weka kivuli. Punguza kulisha kwa 50%.',
      cage: 'Joto juu. Punguza kulisha kwa 50%. Angalia oksijeni kila saa.',
      ras: 'Angalia chiller. Punguza kulisha kwa 50%.',
      tank: 'Hamia tanki kwenye kivuli. Ongeza maji baridi. Punguza kulisha kwa 50%.'
    },
    {
      min: 0, max: 22, hali: 'Baridi Sana ❄️❄️', color: 'hatari',
      pond: 'ACHA KULISHA. Baridi sana. Usibadilishe maji — udongo unahifadhi joto kidogo.',
      concrete: 'ACHA KULISHA. Baridi hatari! Concrete inapoteza joto lote — weka kifuniko.',
      liner: 'ACHA KULISHA. Baridi hatari! Liner haina ulinzi wa joto — weka kifuniko cha plastiki.',
      cage: 'ACHA KULISHA. Huwezi kubadili joto la ziwa. Subiri hali ibadilike.',
      ras: 'ACHA KULISHA. Heater imeshindwa — angalia mara moja.',
      tank: 'ACHA KULISHA. Hamia tanki mahali pa joto.'
    },
    {
      min: 34, max: 99, hali: 'Joto Hatari 🔥🔥', color: 'hatari',
      pond: 'HATARI! Pumpia maji baridi SASA. Weka kivuli kikubwa. Acha kulisha kabisa.',
      concrete: 'HATARI KUBWA! Concrete inachukua joto la jua — weka kivuli SASA. Pumpia maji baridi. Acha kulisha.',
      liner: 'HATARI KUBWA! Liner inachukua joto haraka sana — weka kivuli. Pumpia maji baridi. Acha kulisha.',
      cage: 'HATARI! Angalia oksijeni kila dakika 30. Acha kulisha kabisa.',
      ras: 'HATARI! Chiller imeshindwa. Badilisha maji baridi SASA.',
      tank: 'HATARI! Hamia kwenye kivuli na ongeza barafu kidogo. Acha kulisha.'
    },
  ],
  ph: [
    {
      min: 6.5, max: 8.5, hali: 'Bora ✅', color: 'bora',
      pond: 'pH iko vizuri. Udongo unasaidia kudumisha pH — hakuna hatua.',
      concrete: 'pH iko vizuri. Angalia kila wiki — cement inaweza kuinua pH baada ya muda.',
      liner: 'pH iko vizuri. Liner haiathiri pH — hakuna hatua.',
      cage: 'pH iko vizuri. Hakuna hatua inayohitajika.',
      ras: 'pH iko vizuri. Buffering system inafanya kazi vizuri.',
      tank: 'pH iko vizuri. Hakuna hatua inayohitajika.'
    },
    {
      min: 5.5, max: 6.5, hali: 'Asidi Kidogo ⚠️', color: 'tahadhari',
      pond: 'pH ya asidi. Weka chokaa (CaCO3) gramu 20-30 kwa kila m². Udongo wa asidi unaweza kuwa chanzo.',
      concrete: 'pH ya asidi. Concrete haipaswi kuwa na asidi — angalia chanzo cha maji. Weka chokaa kidogo.',
      liner: 'pH ya asidi. Chanzo ni maji — weka chokaa gramu 20-30 kwa m². Badilisha 20% ya maji.',
      cage: 'pH ya asidi. HAIWEZEKANI kuweka chokaa. Subiri maji ya ziwa kubadilika.',
      ras: 'pH ya asidi. Ongeza sodium bicarbonate kidogo. Angalia buffering system.',
      tank: 'pH ya asidi. Badilisha 30% ya maji. Weka chokaa kidogo.'
    },
    {
      min: 8.5, max: 9.5, hali: 'Alkali Kidogo ⚠️', color: 'tahadhari',
      pond: 'pH ya alkali. Badilisha 30% ya maji. Punguza mbolea. Mwani mwingi unaweza kusababisha hili.',
      concrete: 'pH ya alkali! Cement mpya inaweza kusababisha hili. Badilisha 30% ya maji. Usitumie chokaa.',
      liner: 'pH ya alkali. Badilisha 30% ya maji. Punguza mbolea.',
      cage: 'pH ya alkali. HAIWEZEKANI kubadili maji. Punguza kulisha. Subiri hali ibadilike.',
      ras: 'pH ya alkali. Badilisha 10-15% ya maji. Angalia CO2.',
      tank: 'pH ya alkali. Badilisha 40% ya maji. Acha mbolea yote.'
    },
    {
      min: 0, max: 5.5, hali: 'Asidi Sana 🔴', color: 'hatari',
      pond: 'HATARI! pH ya asidi sana. Weka chokaa gramu 50-100 kwa m² SASA. Badilisha 40% ya maji.',
      concrete: 'HATARI! Asidi inaharibu saruji na kuua samaki. Badilisha maji yote. Weka chokaa.',
      liner: 'HATARI! Badilisha maji yote SASA. Weka chokaa kwenye maji mapya.',
      cage: 'HATARI! HAIWEZEKANI kuweka chokaa. Hamia samaki eneo jingine haraka.',
      ras: 'HATARI! Mfumo wa pH umeshindwa. Badilisha maji na ongeza buffer SASA.',
      tank: 'HATARI! Badilisha maji yote SASA. Weka chokaa kwenye maji mapya.'
    },
    {
      min: 9.5, max: 14, hali: 'Alkali Sana 🔴', color: 'hatari',
      pond: 'HATARI! Badilisha 50% ya maji SASA. Acha mbolea yote kwa wiki 2.',
      concrete: 'HATARI KUBWA! Cement mpya inaweza kusababisha hili. Badilisha maji yote. Safisha kuta.',
      liner: 'HATARI! Badilisha maji yote SASA. Angalia liner — inaweza kuwa chanzo.',
      cage: 'HATARI! HAIWEZEKANI kubadili maji. Angalia oksijeni kila saa.',
      ras: 'HATARI! Badilisha maji na angalia mfumo wote wa kemikali SASA.',
      tank: 'HATARI! Badilisha maji yote. Safisha tanki kabla ya kurudisha samaki.'
    },
  ]
};

// ============================================
// FEED INTELLIGENCE ENGINE
// ============================================

function getKBFeeding(abw) {
  return KB_FEEDING.find(r => abw >= r.min_abw && abw < r.max_abw) || KB_FEEDING[KB_FEEDING.length - 1];
}

function getTempRule(temp) {
  return KB_TEMPERATURE.find(r => temp >= r.min && temp <= r.max) || KB_TEMPERATURE[0];
}

function getDORule(doValue) {
  return KB_DO.find(r => doValue >= r.min && doValue <= r.max) || KB_DO[0];
}

function hesabuKulisha(data) {
  const { idadi, abw, joto, do_mg, feed_response } = data;
  const kbFeed = getKBFeeding(abw);
  const tempRule = getTempRule(joto);
  const doRule = getDORule(do_mg);
  const responseRule = KB_FEED_RESPONSE[feed_response] || KB_FEED_RESPONSE['Normal'];
  const biomass_kg = (abw * idadi) / 1000;
  const target_feed_kg = biomass_kg * (kbFeed.rate / 100);

  let em = 0;
  let critical_rule = null;

  if (do_mg < 3) {
    em = 0;
    critical_rule = 'LIFE_SAFETY: DO chini ya 3 mg/L — Simamisha kulisha mara moja!';
  } else {
    em = tempRule.multiplier * doRule.multiplier * responseRule.multiplier;
  }

  const adjusted_feed_kg = target_feed_kg * em;

  let category = '';
  if (em >= 1.00) category = 'Lisha Kawaida';
  else if (em >= 0.90) category = 'Punguza Kidogo';
  else if (em >= 0.75) category = 'Punguza Kulisha';
  else if (em >= 0.50) category = 'Lisha kwa Tahadhari';
  else category = 'SIMAMISHA Kulisha';

  const confidence = 15 + 20 + (joto ? 20 : 0) + (do_mg !== null ? 20 : 0) + (feed_response ? 15 : 0) + 10;

  let sababu = '';
  if (critical_rule) {
    sababu = `DHARURA: ${critical_rule}`;
  } else {
    sababu = `Joto ${joto}°C (${tempRule.status}) → ${tempRule.decision}. `;
    sababu += `Oksijeni ${do_mg} mg/L (${doRule.status}) → ${doRule.decision}. `;
    sababu += `Tabia ya ulaji: ${feed_response} → Mgawanyiko: ${responseRule.multiplier}.`;
  }

  let hali = 'bora';
  if (em === 0) hali = 'hatari';
  else if (em < 0.90) hali = 'tahadhari';

  return {
    biomass_kg: biomass_kg.toFixed(1),
    target_feed_kg: target_feed_kg.toFixed(2),
    adjusted_feed_kg: adjusted_feed_kg.toFixed(2),
    pellet_size: kbFeed.pellet,
    frequency: kbFeed.frequency,
    temp_multiplier: tempRule.multiplier,
    do_multiplier: doRule.multiplier,
    response_multiplier: responseRule.multiplier,
    environmental_multiplier: em.toFixed(4),
    category,
    confidence,
    sababu,
    hali,
    temp_status: tempRule.status,
    do_status: doRule.status,
  };
}

// ============================================
// WATER QUALITY ENGINE
// ============================================

function analyzeMaji(oxygen, temp, ph, aina_mfumo) {
  const key = aina_mfumo;
  const o2Rule = KB_WATER.oxygen.find(r => oxygen >= r.min && oxygen < r.max) || KB_WATER.oxygen[0];
  const tRule = KB_WATER.temperature.find(r => temp >= r.min && temp < r.max) || KB_WATER.temperature[0];
  const phRule = KB_WATER.ph.find(r => ph >= r.min && ph < r.max) || KB_WATER.ph[0];
  const colors = ['bora', 'tahadhari', 'hatari'];
  const worstColor = [o2Rule.color, tRule.color, phRule.color]
    .sort((a,b) => colors.indexOf(b) - colors.indexOf(a))[0];

  return {
    oxygen: { value: oxygen, hali: o2Rule.hali, color: o2Rule.color, ushauri: o2Rule[key] || o2Rule.pond },
    temperature: { value: temp, hali: tRule.hali, color: tRule.color, ushauri: tRule[key] || tRule.pond },
    ph: { value: ph, hali: phRule.hali, color: phRule.color, ushauri: phRule[key] || phRule.pond },
    hali_jumla: worstColor,
    aina_mfumo
  };
}

// ============================================
// FCR ENGINE
// ============================================

function hesabuFCR(chakula_kg, uzito_awali_kg, uzito_mwisho_kg) {
  const ongezeko = uzito_mwisho_kg - uzito_awali_kg;
  if (ongezeko <= 0) return { kosa: true, ujumbe: 'Uzito wa mwisho lazima uwe mkubwa kuliko uzito wa awali!' };
  const fcr = chakula_kg / ongezeko;
  let tathmini, hali, ushauri, emoji;
  if (fcr < 1.0) { tathmini = 'Bora Sana'; hali = 'bora'; emoji = '🏆'; ushauri = 'HONGERA! Ufanisi wa kulisha ni bora sana. Endelea hivyo hivyo!'; }
  else if (fcr <= 1.8) { tathmini = 'Nzuri'; hali = 'bora'; emoji = '✅'; ushauri = 'FCR yako ni nzuri sana. Endelea kulisha kwa kiwango hiki.'; }
  else if (fcr <= 2.2) { tathmini = 'Tahadhari'; hali = 'tahadhari'; emoji = '⚠️'; ushauri = 'FCR ni kidogo juu. Angalia ubora wa chakula na mara za kulisha.'; }
  else if (fcr <= 3.0) { tathmini = 'Tatizo'; hali = 'tahadhari'; emoji = '🔴'; ushauri = 'TATIZO! FCR ni juu sana. Pima ubora wa maji na angalia magonjwa ya samaki.'; }
  else { tathmini = 'Hatari Kubwa'; hali = 'hatari'; emoji = '🆘'; ushauri = 'DHARURA YA KIUCHUMI! Wasiliana na afisa ugani wako SASA.'; }
  return { kosa: false, fcr: fcr.toFixed(2), ongezeko_kg: ongezeko.toFixed(1), tathmini, hali, emoji, ushauri, chakula_kg, uzito_awali_kg, uzito_mwisho_kg };
}

// ============================================
// HARVEST & PROFIT ENGINE
// ============================================

function hesabuMavuno(data) {
  const { idadi_samaki, uzito_sasa_g, uzito_lengo_g, bei_soko_kg, gharama_vifaranga, gharama_chakula, gharama_nyingine } = data;
  const uzito_sasa_kg = (idadi_samaki * uzito_sasa_g) / 1000;
  const uzito_lengo_kg = (idadi_samaki * uzito_lengo_g) / 1000;
  const ongezeko_kg = uzito_lengo_kg - uzito_sasa_kg;
  const mapato_ghafi = uzito_lengo_kg * bei_soko_kg;
  const gharama_jumla = gharama_vifaranga + gharama_chakula + gharama_nyingine;
  const faida_halisi = mapato_ghafi - gharama_jumla;
  const profit_margin = ((faida_halisi / mapato_ghafi) * 100).toFixed(1);
  let hali, tathmini, ushauri, emoji;
  if (faida_halisi <= 0) { hali = 'hatari'; tathmini = 'Hasara!'; emoji = '🆘'; ushauri = 'Unafanya HASARA! Gharama zako ni kubwa kuliko mapato. Punguza gharama au ongeza bei ya kuuzia.'; }
  else if (profit_margin < 20) { hali = 'tahadhari'; tathmini = 'Faida Ndogo'; emoji = '⚠️'; ushauri = `Faida yako ni ndogo (${profit_margin}%). Jaribu kupunguza gharama au kuuzia bei nzuri zaidi.`; }
  else if (profit_margin < 40) { hali = 'tahadhari'; tathmini = 'Faida Nzuri'; emoji = '✅'; ushauri = `Faida yako ni nzuri (${profit_margin}%). Endelea kuboresha FCR na udhibiti wa maji.`; }
  else { hali = 'bora'; tathmini = 'Faida Nzuri Sana!'; emoji = '🏆'; ushauri = `HONGERA! Faida yako ni nzuri sana (${profit_margin}%). Fikiria kupanua uzalishaji!`; }
  return { uzito_sasa_kg: uzito_sasa_kg.toFixed(1), uzito_lengo_kg: uzito_lengo_kg.toFixed(1), ongezeko_kg: ongezeko_kg.toFixed(1), mapato_ghafi: mapato_ghafi.toFixed(0), gharama_jumla: gharama_jumla.toFixed(0), faida_halisi: faida_halisi.toFixed(0), profit_margin, hali, tathmini, emoji, ushauri };
}

// ============================================
// API ENDPOINTS
// ============================================

app.post('/kulisha', (req, res) => {
  const { idadi, abw, joto, do_mg, feed_response } = req.body;
  if (!idadi || !abw || joto === undefined || do_mg === undefined) return res.json({ kosa: 'Jaza: idadi, abw, joto, do_mg' });
  const matokeo = hesabuKulisha({ idadi: Number(idadi), abw: Number(abw), joto: Number(joto), do_mg: Number(do_mg), feed_response: feed_response || 'Normal' });
  db.run(`INSERT INTO feeding_logs (idadi, abw_gramu, joto, do_mg, feed_response, biomass_kg, target_feed_kg, adjusted_feed_kg, environmental_multiplier, confidence, category, sababu) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [idadi, abw, joto, do_mg, feed_response, matokeo.biomass_kg, matokeo.target_feed_kg, matokeo.adjusted_feed_kg, matokeo.environmental_multiplier, matokeo.confidence, matokeo.category, matokeo.sababu],
    (err) => { if (err) console.error('Hitilafu ya kuhifadhi:', err.message); else console.log('Rekodi imehifadhiwa!'); });
  res.json(matokeo);
});

app.post('/maji', (req, res) => {
  const { oxygen, temp, ph, aina_mfumo } = req.body;
  if (!oxygen || !temp || !ph || !aina_mfumo) return res.json({ kosa: 'Jaza: oxygen, temp, ph, aina_mfumo' });
  const matokeo = analyzeMaji(Number(oxygen), Number(temp), Number(ph), aina_mfumo);
  db.run(`INSERT INTO water_logs (joto, do_mg, ph, hali_joto, hali_do, ushauri) VALUES (?, ?, ?, ?, ?, ?)`,
    [temp, oxygen, ph, matokeo.temperature.hali, matokeo.oxygen.hali, matokeo.oxygen.ushauri],
    (err) => { if (err) console.error(err.message); });
  res.json(matokeo);
});

app.post('/fcr', (req, res) => {
  const { chakula_kg, uzito_awali_kg, uzito_mwisho_kg } = req.body;
  if (!chakula_kg || !uzito_awali_kg || !uzito_mwisho_kg) return res.json({ kosa: true, ujumbe: 'Jaza taarifa zote' });
  res.json(hesabuFCR(Number(chakula_kg), Number(uzito_awali_kg), Number(uzito_mwisho_kg)));
});

app.post('/mavuno', (req, res) => {
  const { idadi_samaki, uzito_sasa_g, uzito_lengo_g, bei_soko_kg, gharama_vifaranga, gharama_chakula, gharama_nyingine } = req.body;
  if (!idadi_samaki || !uzito_sasa_g || !uzito_lengo_g || !bei_soko_kg) return res.json({ kosa: true, ujumbe: 'Jaza taarifa zote!' });
  res.json(hesabuMavuno({ idadi_samaki: Number(idadi_samaki), uzito_sasa_g: Number(uzito_sasa_g), uzito_lengo_g: Number(uzito_lengo_g), bei_soko_kg: Number(bei_soko_kg), gharama_vifaranga: Number(gharama_vifaranga || 0), gharama_chakula: Number(gharama_chakula || 0), gharama_nyingine: Number(gharama_nyingine || 0) }));
});

app.post('/daktari', async (req, res) => {
  const { historia } = req.body;
  if (!historia || historia.length === 0) return res.json({ kosa: true, ujumbe: 'Historia ya mazungumzo inahitajika' });
  try {
    const jibu = await zungumzaNaDaktari(historia);
    res.json({ jibu, kosa: false });
  } catch (err) {
    console.error('Hitilafu ya AI:', err.message);
    res.json({ kosa: true, ujumbe: 'AI haifanyi kazi sasa. Jaribu tena.' });
  }
});

// ============================================
// AUTH ENDPOINTS
// ============================================

app.post('/sajili', async (req, res) => {
  const { jina, simu, nywila, role } = req.body;
  if (!jina || !simu || !nywila) {
    return res.json({ kosa: true, ujumbe: 'Jaza jina, simu, na nywila!' });
  }
  try {
    const user = await sajili(jina, simu, nywila, role || 'mfugaji');
    res.json({ kosa: false, ujumbe: 'Umesajiliwa vizuri!', user });
  } catch (err) {
    res.json({ kosa: true, ujumbe: err.message });
  }
});

app.post('/ingia', async (req, res) => {
  const { simu, nywila } = req.body;
  if (!simu || !nywila) {
    return res.json({ kosa: true, ujumbe: 'Jaza simu na nywila!' });
  }
  try {
    const matokeo = await ingia(simu, nywila);
    res.json({ kosa: false, ...matokeo });
  } catch (err) {
    res.json({ kosa: true, ujumbe: err.message });
  }
});

app.get('/mtumiaji', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.json({ kosa: true, ujumbe: 'Hakuna token!' });
  const user = thibitisha(token);
  if (!user) return res.json({ kosa: true, ujumbe: 'Token si sahihi!' });
  res.json({ kosa: false, user });
});

app.get('/historia', (req, res) => {
  db.all(`SELECT * FROM feeding_logs ORDER BY recorded_at DESC LIMIT 50`, [], (err, rows) => {
    if (err) return res.json({ kosa: err.message });
    res.json(rows);
  });
});

app.get('/app', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/', (req, res) => {
  res.send('Smart Fish Hub Tanzania — AOS Engine v2.0');
});

app.listen(PORT, () => {
  console.log('AOS Engine imefunguka kwenye port ' + PORT);
});