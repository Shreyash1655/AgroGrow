import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Image, ActivityIndicator,
  KeyboardAvoidingView, Platform, Keyboard, StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../../src/store/AppContext';

// ─────────────────────────────────────────────────────
// API KEYS
// ─────────────────────────────────────────────────────
const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const PLANTID_KEY  = process.env.EXPO_PUBLIC_PLANTID_KEY;
// ─────────────────────────────────────────────────────
// STRIP MARKDOWN — removes **bold** *italic* # headers `code`
// ─────────────────────────────────────────────────────
function stripMd(text) {
  return (text || '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/`(.+?)`/g, '$1')
    .trim();
}

// ─────────────────────────────────────────────────────
// PRELOADED ANSWERS — full paragraphs, no markdown
// ─────────────────────────────────────────────────────
const PRELOADED = {
  en: {
    greeting:
      'Hello! I am AgroGROW AI, your smart farming assistant for Goa and India. You can ask me about crops, fertilizers, pests, irrigation, soil health, weather tips, government schemes, and much more. How can I help you today? 🌱',
    thanks:
      'You are most welcome! It is a pleasure helping fellow farmers. Feel free to ask me anything else about your farm anytime. Happy farming! 🌾',
    bye:
      'Goodbye and best wishes for a great harvest! Come back anytime you have farming questions. 🌱',
    who:
      'I am AgroGROW AI — a smart farming assistant built specifically for Indian farmers, especially those in Goa. I can help with crop advice, pest control, fertilizers, irrigation, soil health, market information, and government schemes in your preferred language.',
    help:
      'I can help you with crop selection and care, fertilizer recommendations, pest and disease control, irrigation planning, soil health and testing, weather-based advice, post-harvest storage, market prices, and government subsidy schemes. Just type your question naturally and I will answer!',
    fertilizer:
      'Choosing the right fertilizer depends on your crop and soil condition. For most crops use a balanced NPK mix — Urea supplies nitrogen for leaf growth, DAP provides phosphorus for strong roots, and MOP (Muriate of Potash) improves fruit quality and disease resistance. Always get your soil tested first so you know exactly what nutrients are missing. Adding 2 to 3 tonnes of compost or vermicompost per acre before planting will improve soil health long-term and reduce the amount of chemical fertilizer needed.',
    urea:
      'Urea is the most common and affordable nitrogen fertilizer. Apply 2 to 3 bags (50 kg each) per acre, split into two doses — half at planting time and the remaining half 30 days later. Avoid over-applying because excess urea burns roots and causes too much leafy growth at the expense of fruits. Always apply urea when the soil is moist and water lightly after application to activate it.',
    dap:
      'DAP (Di-Ammonium Phosphate) is excellent for root development and seedling establishment. Apply 50 kg per acre at sowing or transplanting time, mixing it well into the soil. DAP is especially important for flowering crops and vegetables since phosphorus supports early root establishment and flower and fruit set. It also boosts the effectiveness of other fertilizers applied later.',
    npk:
      'NPK fertilizers combine Nitrogen, Phosphorus, and Potassium in one product. Use NPK 20:20:20 for balanced vegetative growth, NPK 10:26:26 at the flowering and fruiting stage to boost yield, and NPK 12:32:16 for root crops. Apply 50 kg per acre as per crop stage, and always combine with 2 to 3 tonnes of compost for the best long-term results.',
    potash:
      'Potassium (MOP or Muriate of Potash) improves fruit size, taste, skin quality, and the crop ability to resist diseases and drought. Apply 30 to 50 kg per acre. For fruit crops like mango, banana, and cashew, increase potash dosage at the fruiting stage for sweeter and better-coloured fruit. Potash also strengthens cell walls and reduces damage from wind and rain.',
    compost:
      'Compost is the foundation of healthy soil. Apply 2 to 3 tonnes of well-made compost per acre, 2 to 3 weeks before planting. To make your own, pile crop waste and cow dung in layers, keep it moist, and turn it every 7 days — it will be ready in 45 to 60 days. Regular compost use reduces the need for chemical fertilizers by up to 40% and improves water retention in Goa laterite soil.',
    'organic fertilizer':
      'For organic farming use a combination of cow dung manure at 2 to 4 tonnes per acre, vermicompost at 500 kg per acre, neem cake at 100 kg per acre, and bio-fertilizers like Rhizobium for legumes or Azospirillum for cereals. Apply 2 to 3 weeks before planting. Organic inputs improve soil microbe activity, water retention, and long-term fertility, and help you earn a premium price at the organic market.',
    micronutrients:
      'Zinc, Boron, and Iron are the most commonly deficient micronutrients in Goa laterite soil. Zinc deficiency shows as yellowing between leaf veins — apply Zinc Sulphate at 25 kg per acre. Boron deficiency causes hollow stems in cauliflower and poor fruit set — apply Borax at 5 kg per acre. Iron deficiency causes pale yellow new leaves — spray Ferrous Sulphate 0.5 percent on leaves weekly until the green colour returns.',
    'foliar spray':
      'Foliar spraying delivers nutrients directly through leaves for a fast response, ideal when you see deficiency symptoms. Mix the recommended fertilizer in clean water and spray on leaves early in the morning before 9 AM or after 5 PM to avoid burning. Spray thoroughly covering both sides of leaves. Use the solution within 2 hours of mixing for best effectiveness. Add a few drops of liquid soap to help the spray stick to leaves.',
    'mango fertilizer':
      'For mango trees apply fertilizer in three stages. In June before monsoon give 250 g Urea plus 200 g DAP plus 300 g MOP per tree. In September give the same dose again. Before flowering in November to December give a foliar spray of 1 percent Potassium Nitrate to improve flower and fruit set. Also apply 10 to 15 kg of compost per tree annually to keep the soil healthy. Young trees under 3 years need half these doses.',
    'mango pest':
      'The main pests of mango are hoppers — spray Lambda-Cyhalothrin 0.05 percent at the budding and flowering stage. Fruit fly is controlled using methyl eugenol traps placed at 25 per acre and a malathion-protein bait spray on foliage. Mealybug is managed by applying chlorpyrifos on the tree trunk and soil in October before mango starts new growth. Spray copper-based fungicide to control powdery mildew and anthracnose during humid weather.',
    'mango disease':
      'Common mango diseases are powdery mildew — spray Wettable Sulfur 80 WP or Hexaconazole at first sign. Anthracnose affects flowers and young fruits — spray Mancozeb or Copper Oxychloride before flowering and after monsoon. Bacterial canker shows as water-soaked lesions — remove infected branches and apply Bordeaux paste on cuts. Ensure good air circulation by pruning dense branches after harvest every year to reduce disease pressure.',
    mango:
      'In Goa mango flowering occurs from November to January and fruits are ready from April to June. Alphonso (Hapus) and Mankurad are the most prized Goa varieties. To improve yield apply Paclobutrazol (Cultar) as a soil drench in September to October at 5 to 10 g per tree, then follow with 1 percent Potassium Nitrate foliar spray after 45 days to trigger uniform flowering. Avoid excess irrigation and nitrogen during the flowering period.',
    'cashew fertilizer':
      'Apply fertilizer to cashew in two split doses, before monsoon in May and after monsoon in October. For young trees under 3 years give 250 g Urea plus 125 g DAP plus 125 g MOP per tree. For bearing trees over 4 years increase to 500 g Urea plus 250 g DAP plus 250 g MOP per tree. Also apply 10 kg compost per tree and Borax at 10 g per tree to improve nut yield and reduce nut black spot. Always apply in a circular ring around the tree drip zone.',
    'cashew pest':
      'The main pest of cashew in Goa is the Tea Mosquito Bug which damages young shoots and flowers — spray Dimethoate or Lambda-Cyhalothrin at the budding and flushing stage starting from December. Stem and root borer is managed by applying Chlorpyrifos to the stem base and surrounding soil. Thrips attack flowers — spray Spinosad or Fipronil. Regular monitoring from December when new flushes appear is essential for timely control.',
    cashew:
      'Cashew thrives in Goa laterite soil. Plant in June to July with 7 by 7 metre or 8 by 8 metre spacing. Young trees need watering twice a week in summer at 20 to 30 litres per tree. Prune dead, crossing, and low-hanging branches after every harvest season in May to June. Grafted varieties like Vengurla-4, Vengurla-7, and BPP-8 give high yields of 8 to 12 kg shelled nuts per tree compared to just 2 to 3 kg from seedling trees.',
    'coconut fertilizer':
      'Apply fertilizer to coconut in two split doses every year. Give 500 g Urea plus 320 g DAP plus 200 g MOP plus 100 g Magnesium Sulphate per tree, split between May and September. Additionally apply 25 kg compost and 2 kg Neem Cake in the basin around each tree. For deficiency correction spray 2 percent Urea plus 1 percent Ferrous Sulphate on leaves. Potassium is the most critical nutrient for coconut yield — never skip the MOP dose.',
    coconut:
      'Coconut palms in Goa need regular care for good yield. Water 2 to 3 times per week in summer at 40 to 45 litres per tree. Keep the basin of 3 metre radius clean and mulched with dry leaves or coir pith. Remove all dead fronds and old dried flower spathes regularly. Spray Bordeaux mixture on the stem during monsoon to prevent bud rot disease. If you see wilt disease with sudden yellowing and collapse there is no cure — remove and burn infected trees immediately to prevent spread.',
    'paddy fertilizer':
      'For paddy in Goa apply the basal dose at transplanting: 25 kg DAP plus 25 kg MOP per acre. Then top-dress with 25 kg Urea at the tillering stage which is 21 days after transplanting, and another 25 kg Urea at panicle initiation which is 45 days after transplanting. Do not apply Urea during flowering as it causes sterility. Apply Zinc Sulphate at 25 kg per acre if yellowing at the tillering stage is noticed.',
    paddy:
      'Paddy cultivation in Goa uses the Kharif season from June to October. Recommended varieties are Jyothi, IR64, and Uma. Transplant 21-day-old seedlings keeping 20 by 15 cm spacing with 2 seedlings per hill. Maintain 2 to 3 inches of standing water throughout. Drain fields 10 days before harvest. The crop is ready in 120 to 135 days with a yield of 18 to 25 quintals per acre under good management.',
    rice:
      'Transplant rice seedlings at 21 days old into puddled fields at 20 by 15 cm spacing. Maintain 2 to 3 inch standing water throughout growth. Apply Urea in 3 split doses — at transplanting, at tillering, and at panicle initiation. Common diseases are blast — apply Tricyclazole; sheath blight — apply Hexaconazole; and brown planthopper — drain the field and spray Buprofezin.',
    tomato:
      'Grow hybrid tomatoes like Arka Rakshak or Namdhari 505 for best disease resistance. Transplant 25-day-old seedlings into raised beds with 60 by 45 cm spacing. Apply NPK 13:00:45 foliar spray at flowering for better fruit set. Stake plants at 40 cm height. Control leaf curl virus by spraying Imidacloprid to eliminate whitefly vectors. Spray Mancozeb or Metalaxyl every 10 days in humid weather to prevent blight.',
    brinjal:
      'Transplant brinjal seedlings at 45 by 45 cm spacing in well-drained raised beds. Apply NPK monthly and irrigate every 5 to 6 days. The main pest is Shoot and Fruit Borer — spray Spinosad 45SC at 0.5 ml per litre every 10 days and remove wilted shoot tips. Harvest every 5 to 7 days to keep the plant producing continuously for 4 to 6 months.',
    okra:
      'Bhendi is a fast-growing summer crop. Direct sow seeds 45 by 30 cm apart after soaking for 12 hours. Apply Urea top-dressing at the first flower bud stage. Remove infected plants showing Yellow Vein Mosaic Virus and spray Imidacloprid to control whitefly vectors. Harvest pods every 2 days at 5 to 7 cm for continuous production.',
    onion:
      'Use Nasik Red or N-53 variety. Raise seedlings for 6 weeks then transplant at 15 by 10 cm spacing. Apply DAP at planting and Urea at 20 and 40 days after transplanting. Stop all watering 10 days before harvest. Cure bulbs in shade for 7 to 10 days before storage to improve shelf life.',
    potato:
      'Plant certified seed potatoes in October to November in well-drained soil. Apply DAP 50 kg plus MOP 50 kg per acre as basal dose and Urea 25 kg at earthing up. Harvest in 90 to 100 days when tops start yellowing. Leave in soil for 7 more days after stopping irrigation so the skin sets hard for better storage.',
    chilli:
      'Apply Boron and Calcium Nitrate spray at budding to prevent flower drop and improve fruit set. The main pests are Thrips — spray Fipronil or Spinosad; and red spider mites — spray Abamectin. Remove plants showing mosaic virus and control aphid and thrips vectors with Imidacloprid. Green chilli harvest starts from 70 days.',
    banana:
      'Plant tissue culture banana for disease-free, high-yielding crops. Apply NPK with high potassium monthly for best fruit quality. Watch for Panama wilt — remove and burn infected plants. Prop up heavy bunches with bamboo poles to prevent toppling. Harvest in 12 to 14 months when fingers are fully round and green to light yellow.',
    papaya:
      'Papaya grows very fast in Goa. Plant in raised beds for good drainage and apply NPK monthly. Watch for mosaic virus — remove infected plants immediately. Control papaya mealy bug with Dimethoate spray. Harvest in 9 to 11 months when skin turns from green to light orange.',
    pest:
      'The first rule of pest management is early detection — walk through your fields every 3 to 4 days. Start with non-chemical methods: neem oil at 5 ml plus 1 ml soap per litre every 7 to 10 days, yellow sticky traps for aphids and whiteflies, and pheromone traps for moths. Use chemical pesticides only when pest numbers are high and always rotate between different pesticide classes to prevent resistance.',
    fungus:
      'Fungal diseases spread fast in Goa humid monsoon weather. At the first sign of spots, mold, or rot spray Mancozeb 75 WP at 2.5 g per litre or Copper Oxychloride at 3 g per litre. For advanced infections use Hexaconazole or Propiconazole at 1 ml per litre. Spray every 10 to 14 days during monsoon as prevention. Improve air circulation by thinning dense foliage.',
    aphids:
      'Aphids cluster on young shoots and leaf undersides, sucking sap and spreading sooty mold. Spray Imidacloprid 17.8 SL at 0.5 ml per litre for quick control. Yellow sticky traps help monitor populations. For organic control spray strong neem oil at 10 ml per litre. Natural predators like ladybird beetles help — avoid broad-spectrum pesticides that kill them.',
    neem:
      'Neem oil is a safe broad-spectrum organic pesticide and fungicide. Mix 5 ml neem oil plus 1 ml liquid soap in 1 litre of warm water, shake well, and spray thoroughly on both sides of leaves. Apply in early morning or evening — never in hot afternoon sun. Repeat every 7 to 10 days as prevention or every 5 days during active infestation. It controls aphids, whiteflies, mites, and many fungal diseases.',
    'stem borer':
      'Stem borer is a serious pest in paddy, maize, and sugarcane. Look for dead heart symptoms — the central shoot dries while outer leaves stay green. Apply Carbofuran 3G granules in paddy water at tillering. For vegetables and fruit crops spray Chlorpyrifos or Coragen on shoots. Set up light traps to catch adult moths at night.',
    'fruit fly':
      'Fruit fly is a major pest of mango, guava, cucurbits, and tomato in Goa. Use methyl eugenol or cue-lure traps at 25 per acre to catch male flies. Bait spray with Malathion 50 EC at 2 ml per litre mixed with 10 percent jaggery solution sprayed on foliage. Collect and destroy all fallen and damaged fruits immediately.',
    irrigation:
      'Good irrigation management is key to crop yield. Most crops need watering every 5 to 7 days and vegetables every 3 to 4 days in summer. Water in early morning (6 to 8 AM) or evening (4 to 6 PM) to reduce evaporation losses. Drip irrigation saves 40 to 50 percent water and reduces fungal diseases by keeping foliage dry. Always check soil moisture 5 cm deep before irrigating.',
    'drip irrigation':
      'Drip irrigation is the most efficient method especially for cashew, coconut, mango, and vegetables. It saves 40 to 50 percent water and reduces weeds and fungal diseases. Installation costs about 35,000 to 50,000 rupees per acre but the Goa government provides 50 to 90 percent subsidy. Apply at the Agriculture or Horticulture Department at Tonca with your land documents and Aadhaar card.',
    soil:
      'Healthy soil is the foundation of good farming. Test your soil every 2 to 3 years — KVK at Ela and district agriculture offices provide cheap testing at just 50 to 100 rupees. Ideal soil pH for most crops is 6.0 to 7.0. Goa laterite soil is often acidic — apply lime at 500 kg per acre to correct pH and add 2 to 3 tonnes of compost to improve fertility.',
    'soil test':
      'A soil test is the most important first step in fertilizer planning. Collect soil from 8 to 10 spots in your field at 15 cm depth, mix them, dry the sample in shade, and send 500 g to KVK Ela or the District Agriculture Office. The test costs only 50 to 100 rupees and gives you NPK levels, pH, and micronutrient status — preventing both over-fertilizing and under-fertilizing.',
    mulching:
      'Mulching with dry straw, dry leaves, or black plastic film conserves soil moisture by 30 to 40 percent, suppresses weeds, and keeps soil temperature stable. Apply a 3 to 4 inch thick layer around plants leaving a small gap near the stem. Organic mulch also improves soil fertility as it decomposes. Especially useful for vegetables and fruit trees during the dry season in Goa.',
    weeding:
      'Remove weeds before they flower and set seeds. Hand weeding is safest near crop roots. Use Pendimethalin as a pre-emergent herbicide before seeds germinate. For post-emergent control between crop rows use Glyphosate carefully. Regular weeding every 3 to 4 weeks during the growing season is essential — weeds compete for nutrients, water, and light and harbour pests.',
    'crop rotation':
      'Rotating crops each season breaks the disease cycle, improves soil fertility, and reduces pest pressure. After paddy grow vegetables; after vegetables grow pulses which fix nitrogen. Do not grow the same crop family in the same plot more than 2 seasons in a row. In Goa a good rotation is paddy in Kharif, then vegetables or groundnut in Rabi, then green manure in summer.',
    monsoon:
      'During the Goa monsoon from June to September focus on drainage — waterlogged fields cause root rot and large losses. Spray Mancozeb or copper-based fungicide preventively every 14 days as humidity is high. Avoid applying nitrogen fertilizer during heavy rain as it leaches away quickly. Use this season for paddy cultivation and vegetables grown on raised beds for good drainage.',
    drought:
      'During drought or dry spells apply 3 to 4 inch straw or dry leaf mulch around plants to reduce moisture evaporation by 30 to 40 percent. Irrigate only in early morning. Use drought-resistant varieties like paddy variety Uma, cowpea, bajra, and jowar. For established fruit trees water only at critical flowering and fruit development stages.',
    goa:
      'Goa has unique farming conditions — laterite soil, heavy monsoon with 250 to 300 cm annual rainfall, and a 4-month dry season. Main crops are cashew, coconut, paddy, areca nut, and spices. The Goa government provides good subsidies on drip irrigation, seeds, farm equipment, and organic certification through the Agriculture and Horticulture Departments at Panaji.',
    kvk:
      'KVK (Krishi Vigyan Kendra) at Ela, Old Goa is your best free resource for expert advice. They provide free soil testing, subsidized certified seeds, training programs on modern farming, field demonstrations on farmers land, and technology dissemination. Visit them Monday to Friday between 10 AM and 5 PM, or contact the District Agriculture Office at Panaji for their direct number.',
    subsidy:
      'Goa farmers can get many government subsidies: drip irrigation at 50 to 90 percent, power tiller and farm equipment at 25 to 50 percent, certified seed purchase at 50 percent, organic certification support, and PM-KISAN income support of 6,000 rupees per year. Visit your nearest Taluka Agriculture Office with your land documents (7/12 extract), Aadhaar card, and bank passbook to apply.',
    'crop insurance':
      'PMFBY insures your crops against losses from drought, flood, pest, and disease. Premium is only 2 percent of sum insured for Kharif crops. Enroll before the cut-off date at any bank or CSC center. In case of loss report within 72 hours, take photos of damage, and fill the claim form. Compensation is deposited directly into your bank account.',
    'pm kisan':
      'PM-KISAN provides 6,000 rupees per year to eligible farmers in 3 instalments of 2,000 rupees each. Register at any CSC center or bank with your Aadhaar card, land ownership documents, and bank passbook. Check payment status at pmkisan.gov.in or on the UMANG mobile app.',
    kcc:
      'Kisan Credit Card gives you a revolving loan at subsidised interest rates of 4 to 7 percent per year to buy seeds, fertilizers, and pesticides. Apply at any cooperative bank, SBI, or nationalised bank with your land records (7/12 extract), Aadhaar card, and two passport photos. Credit limit is set based on land area and crop type.',
    storage:
      'Proper storage prevents 20 to 30 percent post-harvest losses. Dry grains to below 12 percent moisture before storage. Store in clean metal bins or HDPE bags with silica gel packs in a dry, cool, ventilated area. For paddy and grains use phosphine fumigation tablets in sealed storage every 3 months. Check regularly for insects or mold.',
    market:
      'To get the best market price sort and grade your produce before selling — higher grade fetches 20 to 40 percent more. Check daily mandi rates on the eNAM app or Goa Agriculture Department website. Sell through the APMC mandi or join a Farmer Producer Organisation for collective bargaining. Value addition like making cashew nuts from raw cashew can give you 3 to 5 times more income.',
    'groundnut':
      'Sow groundnut in June to July in well-drained sandy loam soil. Apply DAP 50 kg per acre at sowing. Apply Gypsum at 200 kg per acre at the pegging stage for good pod development. Harvest in 110 to 120 days when most pods have brown inner walls. Cure in shade for 5 to 7 days before storage or selling.',
    sugarcane:
      'Plant sugarcane in January to February or June to July. Apply press mud compost 10 tonnes per acre. Give Urea in 3 split doses. Earthing up at 60 days prevents lodging. Harvest after 12 months when brix value is 18 to 20 percent. Ratoon crop can be taken for 2 more seasons.',
    spices:
      'Goa is ideal for black pepper, cardamom, nutmeg, and cloves. Black pepper is a vine — train on arecanut or coconut trees and apply NPK quarterly. Cardamom needs high humidity and shade. Spices are high-value crops — even 0.5 acre of pepper can give good additional income alongside coconut or cashew.',
    'animal feed':
      'For dairy cows provide a daily mix of green fodder like napier grass, dry fodder like paddy straw, and concentrate including oil cake and grain at 2 to 3 percent of body weight. Add mineral mixture at 50 g per cow per day. Deworm every 6 months. Vaccinate against FMD, HS, and BQ annually at the government veterinary dispensary free of cost.',
    'water conservation':
      'Conserve water on your farm by making farm ponds to collect monsoon rainwater, practicing drip irrigation, applying mulch around plants, and using drought-resistant crop varieties. A 30 by 30 metre farm pond can store 400,000 litres — enough for 1 acre of crops in the dry season. MGNREGA funds can be used to build farm ponds — apply at the gram panchayat.',
    greenhouse:
      'A low-cost polyhouse or greenhouse costs 3 to 12 lakh rupees per acre depending on structure. It protects crops from rain, pests, and extreme weather and allows year-round vegetable production. The Goa government provides 50 percent subsidy on polyhouse construction. Tomato, capsicum, and cucumber are the most profitable crops for greenhouse farming in Goa.',
    'seed treatment':
      'Always treat seeds before sowing to prevent seed-borne and soil-borne diseases. For fungal diseases dust seeds with Thiram or Mancozeb at 2 to 3 g per kg. For bacterial diseases use Streptomycin. For pulses apply Rhizobium culture to seeds just before sowing for nitrogen fixation. Treated seeds germinate more uniformly and establish stronger seedlings.',
    intercropping:
      'Intercropping improves land productivity and income. In Goa good combinations are coconut plus banana plus pineapple, cashew plus turmeric, and coconut plus pepper vine. Choose crops that do not compete for the same resources. Intercropping also reduces pest and disease pressure by creating biodiversity on the farm.',
  },

  hi: {
    greeting:
      'नमस्ते! मैं AgroGROW AI हूँ — आपका स्मार्ट खेती सहायक। मैं फसल सलाह, खाद, सिंचाई, कीट नियंत्रण, मिट्टी की जाँच, सरकारी योजनाएँ और बहुत कुछ बता सकता हूँ। आज आपकी खेती में कैसे मदद करूँ? 🌱',
    thanks:
      'आपका बहुत-बहुत स्वागत है! किसान भाइयों की मदद करना मुझे बहुत अच्छा लगता है। कोई भी सवाल हो तो बेझिझक पूछें। 🌾',
    bye:
      'अलविदा! अच्छी फसल की शुभकामनाएँ। जब भी खेती से जुड़ा सवाल हो, वापस आएं! 🌱',
    who:
      'मैं AgroGROW AI हूँ — भारतीय किसानों, खासकर गोवा के किसानों के लिए बनाया गया स्मार्ट खेती सहायक। फसल सलाह, खाद, कीट नियंत्रण, सिंचाई, मिट्टी, बाजार भाव और सरकारी योजनाओं में मदद करता हूँ।',
    help:
      'मैं आपकी मदद कर सकता हूँ: फसल चुनाव, खाद की सलाह, कीट और रोग नियंत्रण, सिंचाई योजना, मिट्टी जाँच, मौसम आधारित सलाह, भंडारण, बाजार भाव, और सरकारी सब्सिडी। बस अपना सवाल सामान्य भाषा में पूछें!',
    fertilizer:
      'सही खाद का चुनाव आपकी फसल और मिट्टी की जाँच पर निर्भर करता है। अधिकांश फसलों के लिए NPK खाद का उपयोग करें — यूरिया नाइट्रोजन के लिए, DAP जड़ विकास के लिए, और MOP फल की गुणवत्ता और रोग प्रतिरोधक क्षमता के लिए। बुवाई से पहले 2 से 3 टन जैविक खाद प्रति एकड़ जरूर डालें।',
    urea:
      'यूरिया सबसे सस्ता नाइट्रोजन खाद है। प्रति एकड़ 2 से 3 बोरी डालें — आधा बुवाई पर और आधा 30 दिन बाद। ज्यादा यूरिया डालने से जड़ें जल जाती हैं। हमेशा नम मिट्टी में डालें और हल्की सिंचाई करें।',
    dap:
      'DAP जड़ विकास के लिए उत्तम है। बुवाई के समय 50 kg प्रति एकड़ मिट्टी में मिलाएं। फूल वाली फसलों और सब्जियों के लिए खासतौर पर जरूरी है।',
    npk:
      'NPK खाद में नाइट्रोजन, फास्फोरस और पोटाश तीनों होते हैं। सामान्य वृद्धि के लिए NPK 20:20:20, फूल-फल के लिए 10:26:26, और जड़ वाली फसलों के लिए 12:32:16 उपयोग करें। 50 kg प्रति एकड़ डालें।',
    'mango fertilizer':
      'आम के पेड़ को साल में 3 बार खाद दें। जून में 250 g यूरिया, 200 g DAP और 300 g MOP प्रति पेड़ दें। सितंबर में फिर उतनी ही मात्रा। नवंबर-दिसंबर में फूल आने से पहले 1 प्रतिशत पोटेशियम नाइट्रेट का छिड़काव करें। सालाना 10 से 15 kg कम्पोस्ट प्रति पेड़ दें।',
    'cashew fertilizer':
      'काजू को साल में दो बार खाद दें — मई में और अक्टूबर में। 3 साल से कम उम्र के पेड़ों को 250 g यूरिया, 125 g DAP और 125 g MOP दें। फल देने वाले पेड़ों को 500 g यूरिया, 250 g DAP और 250 g MOP दें। साथ में 10 kg कम्पोस्ट और 10 g बोरेक्स दें।',
    mango:
      'गोवा में आम के फूल नवंबर से जनवरी में आते हैं और फल अप्रैल से जून में तैयार होते हैं। अल्फांसो (हापुस) और मांकुराड सबसे अच्छी किस्में हैं। उपज बढ़ाने के लिए सितंबर में पैक्लोबुट्राज़ोल का मिट्टी में प्रयोग करें और 45 दिन बाद 1 प्रतिशत पोटेशियम नाइट्रेट का छिड़काव करें।',
    cashew:
      'काजू गोवा की लेटराइट मिट्टी में बहुत अच्छे से उगता है। जून-जुलाई में 7x7 मीटर की दूरी पर लगाएं। ग्राफ्टेड किस्में जैसे Vengurla-4 और Vengurla-7 से 8 से 12 kg नट्स प्रति पेड़ मिलते हैं। फसल के बाद मृत और रोगग्रस्त शाखाओं की छंटाई करें।',
    coconut:
      'गोवा में नारियल के लिए गर्मी में हफ्ते में 2 से 3 बार 40 से 45 लीटर पानी दें। हर तिमाही NPK और सूक्ष्मपोषक तत्व दें। मृत पत्तियां और फूल के डंठल नियमित हटाएं। मानसून में तने पर बोर्डो मिश्रण लगाएं।',
    paddy:
      'गोवा में धान खरीफ मौसम (जून-अक्टूबर) में उगाया जाता है। जयोती, IR64 और उमा किस्में अच्छी हैं। 21 दिन के पौधे 20x15 cm की दूरी पर रोपें। खेत में 2 से 3 इंच पानी बनाए रखें। 120 से 135 दिन में कटाई।',
    pest:
      'कीट प्रबंधन में सबसे जरूरी है जल्दी पहचान। हर 3 से 4 दिन में खेत का निरीक्षण करें। पहले नीम तेल (5 ml और 1 ml साबुन प्रति लीटर) हर 7 से 10 दिन में छिड़कें। रासायनिक दवाएँ तभी उपयोग करें जब कीट की संख्या बहुत ज्यादा हो और हर मौसम में दवाएँ बदलें।',
    neem:
      'नीम का तेल एक सुरक्षित और प्रभावी जैविक कीटनाशक है। 5 ml नीम तेल और 1 ml तरल साबुन को 1 लीटर गुनगुने पानी में मिलाएं। पत्तियों के नीचे भी स्प्रे करें। सुबह 7 से 9 बजे या शाम 5 से 7 बजे करें। हर 7 से 10 दिन में दोहराएं।',
    irrigation:
      'अधिकांश फसलों को 5 से 7 दिन में एक बार, सब्जियों को 3 से 4 दिन में एक बार पानी चाहिए। सुबह 6 से 8 बजे सींचें। ड्रिप सिंचाई से 40 से 50 प्रतिशत पानी बचता है। पानी देने से पहले मिट्टी में 5 cm उंगली डालकर देखें।',
    soil:
      'हर 2 से 3 साल में KVK या कृषि विभाग से मिट्टी जाँच करवाएं। अधिकांश फसलों के लिए pH 6 से 7 आदर्श है। गोवा की लेटराइट मिट्टी अक्सर अम्लीय होती है — pH सुधारने के लिए 500 kg प्रति एकड़ चूना और 2 से 3 टन कम्पोस्ट डालें।',
    subsidy:
      'गोवा के किसानों के लिए सब्सिडी: ड्रिप सिंचाई (50 से 90 प्रतिशत), पावर टिलर (25 से 50 प्रतिशत), प्रमाणित बीज (50 प्रतिशत), और PM-KISAN से सालाना 6,000 रुपए। तालुका कृषि कार्यालय में जमीन के कागज और आधार कार्ड लेकर जाएं।',
    'pm kisan':
      'PM-KISAN में हर साल 6,000 रुपए तीन किस्तों में मिलते हैं। CSC सेंटर या बैंक पर आधार कार्ड, जमीन के दस्तावेज और बैंक पासबुक लेकर पंजीकरण करें। स्थिति pmkisan.gov.in पर जाँचें।',
    monsoon:
      'गोवा के मानसून (जून-सितंबर) में जलनिकास पर ध्यान दें। हर 14 दिन में मैंकोजेब या कॉपर ऑक्सीक्लोराइड का निवारक छिड़काव करें। भारी बारिश में नाइट्रोजन खाद मत डालें।',
    compost:
      'फसल अवशेष और गोबर को परतों में रखें, नम रखें और हर 7 दिन में पलटें। 45 से 60 दिन में तैयार हो जाता है। 2 से 3 टन प्रति एकड़ बुवाई से पहले डालें। रासायनिक खाद की जरूरत 40 प्रतिशत कम होती है।',
    tomato:
      'हाइब्रिड टमाटर जैसे अर्का रक्षक उगाएं। 25 दिन के पौधे 60x45 cm की दूरी पर लगाएं। 40 cm ऊंचाई पर काठी लगाएं। फूल आने पर NPK 13:00:45 का छिड़काव करें। व्हाइटफ्लाई नियंत्रण के लिए Imidacloprid स्प्रे करें।',
    banana:
      'टिशू कल्चर केले के पौधे लगाएं। हर महीने उच्च पोटाश NPK दें। पनामा विल्ट के लिए संक्रमित पौधे तुरंत हटाएं। भारी गुच्छों को बांस की लाठी से सहारा दें। 12 से 14 महीने में कटाई करें।',
    groundnut:
      'जून-जुलाई में अच्छी जल निकासी वाली मिट्टी में बोएं। बुवाई पर DAP 50 kg प्रति एकड़ डालें। पेगिंग स्टेज पर 200 kg जिप्सम डालें। 110 से 120 दिन में कटाई।',
    storage:
      'भंडारण से पहले अनाज को 12 प्रतिशत से कम नमी तक सुखाएं। धातु के डिब्बों या HDPE बैग में सिलिका जेल के साथ ठंडी सूखी जगह पर रखें। हर 3 महीने फॉस्फीन टैबलेट से धूमन करें।',
    market:
      'बेचने से पहले उपज को श्रेणीबद्ध करें — उच्च श्रेणी पर 20 से 40 प्रतिशत ज्यादा दाम मिलते हैं। eNAM ऐप पर मंडी भाव देखें। APMC मंडी या FPO के माध्यम से बेचें।',
    'water conservation':
      'खेत में तालाब बनाकर मानसून का पानी जमा करें। ड्रिप सिंचाई अपनाएं। पौधों के आसपास मल्चिंग करें। MGNREGA से फार्म तालाब बनाने के लिए ग्राम पंचायत में आवेदन करें।',
  },

  mr: {
    greeting:
      'नमस्कार! मी AgroGROW AI आहे — तुमचा स्मार्ट शेती सहायक. पीक सल्ला, खत, सिंचन, कीड नियंत्रण, माती तपासणी, सरकारी योजना आणि बरेच काही मी सांगू शकतो. आज तुमच्या शेतीसाठी कशी मदत करू? 🌱',
    thanks:
      'तुमचे खूप आभार! शेतकरी बंधूंना मदत करणे मला खूप आनंद देते. इतर प्रश्न असतील तर जरूर विचारा. 🌾',
    bye:
      'निरोप! चांगल्या पिकाच्या शुभेच्छा! कधीही शेतीबद्दल प्रश्न असतील तर परत या! 🌱',
    who:
      'मी AgroGROW AI आहे — भारतीय शेतकऱ्यांसाठी, विशेषतः गोव्यातील शेतकऱ्यांसाठी बनवलेला स्मार्ट शेती सहायक. पीक सल्ला, खत, कीड नियंत्रण, सिंचन, माती, बाजारभाव आणि सरकारी योजनांमध्ये मी मदत करतो.',
    help:
      'मी तुम्हाला मदत करू शकतो: पीक निवड, खत शिफारस, कीड व रोग नियंत्रण, सिंचन नियोजन, माती तपासणी, हवामान सल्ला, काढणीनंतरचे व्यवस्थापन, बाजारभाव आणि सरकारी अनुदाने.',
    fertilizer:
      'योग्य खताची निवड पीक आणि मातीच्या तपासणीवर अवलंबून आहे. बहुतेक पिकांसाठी NPK खत वापरा — युरिया नायट्रोजनसाठी, DAP मुळांच्या विकासासाठी, आणि MOP फळांची गुणवत्ता आणि रोग प्रतिकारशक्तीसाठी. पेरणीपूर्वी 2 ते 3 टन कंपोस्ट प्रती एकर जमिनीत मिसळा.',
    urea:
      'युरिया हे सर्वात स्वस्त नायट्रोजन खत आहे. प्रती एकर 2 ते 3 पोती टाका — अर्धे पेरणीच्या वेळी आणि अर्धे 30 दिवसांनी. जास्त युरियामुळे मुळे जळतात. ओल्या मातीत टाकून हलके पाणी द्या.',
    'mango fertilizer':
      'आंब्याच्या झाडाला वर्षातून 3 वेळा खत द्या. जूनमध्ये 250 g युरिया, 200 g DAP आणि 300 g MOP प्रती झाड द्या. सप्टेंबरमध्ये पुन्हा तेवढेच. फुलोरा येण्यापूर्वी 1 टक्का पोटॅशियम नायट्रेट फवारा. दरवर्षी 10 ते 15 kg कंपोस्ट प्रती झाड द्या.',
    'cashew fertilizer':
      'काजूला वर्षातून दोनदा खत द्या — मेमध्ये आणि ऑक्टोबरमध्ये. लहान झाडांना 250 g युरिया, 125 g DAP आणि 125 g MOP द्या. फळ देणाऱ्या झाडांना 500 g युरिया, 250 g DAP आणि 250 g MOP द्या. तसेच 10 kg कंपोस्ट आणि 10 g बोरेक्स द्या.',
    mango:
      'गोव्यात आंब्याला नोव्हेंबर ते जानेवारीत फुले येतात आणि एप्रिल ते जूनमध्ये फळे तयार होतात. अल्फांसो (हापूस) आणि मांकुराड या प्रमुख जाती आहेत. उत्पादन वाढवण्यासाठी सप्टेंबरात पॅक्लोबुट्राझोल जमिनीत द्या.',
    cashew:
      'काजू गोव्याच्या लाल मातीत उत्तम येतो. जून-जुलैमध्ये 7x7 मीटर अंतरावर लागवड करा. कलम केलेल्या जाती जसे Vengurla-4 पासून 8 ते 12 kg नट्स प्रती झाड मिळतात.',
    coconut:
      'नारळाला उन्हाळ्यात आठवड्यातून 2 ते 3 वेळा 40 ते 45 लीटर पाणी द्या. तिमाही NPK आणि सूक्ष्मपोषक द्या. मृत पाने नियमित काढा. मान्सूनात बोर्डो मिश्रण खोडावर लावा.',
    paddy:
      'गोव्यात भात खरीफ हंगामात (जून-ऑक्टोबर) घेतात. जोती, IR64 आणि उमा या जाती चांगल्या आहेत. 21 दिवसांच्या रोपांची 20x15 cm अंतरावर पुनर्लागवड करा. शेतात 2 ते 3 इंच पाणी ठेवा.',
    pest:
      'कीड व्यवस्थापनात सर्वात महत्त्वाचे म्हणजे लवकर ओळख. दर 3 ते 4 दिवसांनी शेताची तपासणी करा. प्रथम कडुनिंब तेल आणि चिकट सापळे वापरा. रासायनिक औषधे फक्त गरज असल्यासच वापरा.',
    neem:
      'कडुनिंब तेल हे सुरक्षित आणि प्रभावी जैविक कीटकनाशक आहे. 5 ml कडुनिंब तेल आणि 1 ml साबण 1 लीटर कोमट पाण्यात मिसळा. पानांखाली फवारणी करा. सकाळी लवकर किंवा संध्याकाळी फवारा.',
    irrigation:
      'बहुतेक पिकांना 5 ते 7 दिवसांनी एकदा, भाज्यांना 3 ते 4 दिवसांनी पाणी लागते. सकाळी 6 ते 8 वाजता पाणी द्या. ड्रिप सिंचनाने 40 ते 50 टक्के पाणी वाचते.',
    soil:
      'दर 2 ते 3 वर्षांनी KVK किंवा कृषी विभागाकडून माती तपासणी करा. बहुतेक पिकांसाठी pH 6 ते 7 आदर्श आहे. गोव्याची लेटरराइट माती अनेकदा आम्लीय असते — 500 kg चुना आणि 2 ते 3 टन कंपोस्ट टाका.',
    subsidy:
      'गोव्याच्या शेतकऱ्यांसाठी अनुदाने: ड्रिप सिंचन (50 ते 90 टक्के), पॉवर टिलर (25 ते 50 टक्के), प्रमाणित बियाणे (50 टक्के), आणि PM-KISAN मधून दरवर्षी 6,000 रुपये. तालुका कृषी कार्यालयात कागदपत्रे घेऊन जा.',
    compost:
      'पीक अवशेष आणि शेणखत थरांत रचा, ओले ठेवा आणि 7 दिवसांनी उलटा. 45 ते 60 दिवसांत तयार होते. पेरणीपूर्वी 2 ते 3 टन प्रती एकर टाका.',
    market:
      'विक्रीपूर्वी उत्पादनाचे दर्जानुसार वर्गीकरण करा — उच्च दर्जाला 20 ते 40 टक्के जास्त भाव मिळतो. eNAM अॅपवर मंडी भाव पाहा. APMC मंडी किंवा FPO मार्फत विका.',
  },

  kok: {
    greeting:
      'नमस्कार! हांव AgroGROW AI — तुमचो स्मार्ट शेती सहायक. पीक सल्लो, खत, सिंचन, कीड नियंत्रण, सरकारी येजना आनी बरेंच हांव सांगूं शकतां. आयज तुमच्या शेताखातीर कशी मदत करूं? 🌱',
    thanks:
      'तुमचे खूब आभार! शेतकरी भावांक मदत करप मला खूब बरें वाटता. आनीक प्रस्न आसल्यार जरूर विचारात. 🌾',
    bye:
      'निरोप! बऱ्या पिकाच्या शुभेच्छा! केन्नाय शेतीविशीं प्रस्न आसल्यार परतून यात! 🌱',
    who:
      'हांव AgroGROW AI — भारतीय शेतकऱ्यांखातीर, खाशेल्यान गोंयच्या शेतकऱ्यांखातीर बनयिल्लो स्मार्ट शेती सहायक. पीक सल्लो, खत, कीड नियंत्रण, सिंचन, माती, बाजार भाव आनी सरकारी येजनांनी हांव मदत करतां.',
    fertilizer:
      'बऱ्या खताची निवड पीक आनी मातयेच्या तपासणेर अवलंबून आसा. चडश्या पिकांखातीर NPK खत वापरात — युरिया नायट्रोजनखातीर, DAP मुळांच्या विकासाखातीर, आनी MOP फळांची गुणवत्ता आनी रोग प्रतिकारशक्तीखातीर. पेरणेपयलीं 2 ते 3 टन कंपोस्ट प्रती एकर दियात.',
    urea:
      'युरिया सगळ्यांत सस्तें नायट्रोजन खत आसा. प्रती एकर 2 ते 3 पोती घालात — अर्धें पेरणेवेळार आनी अर्धें 30 दिसांनी. चड युरियान मुळां जळटात. ओल्या मातयेंत घालात आनी हळूच उदक दियात.',
    'mango fertilizer':
      'आंब्याच्या झाडाक वर्सांतून 3 खेप खत दियात. जूनांत 250 g युरिया, 200 g DAP आनी 300 g MOP प्रती झाड दियात. सप्टेंबरांत परतून तेतलेंच दियात. फुलां येवचे आदीं 1 टक्को पोटॅशियम नायट्रेट फवारात.',
    'cashew fertilizer':
      'काजूक वर्सांतून दोन खेप खत दियात — मेयांत आनी ऑक्टोबरांत. ल्हान झाडांक 250 g युरिया, 125 g DAP आनी 125 g MOP दियात. फळ दिवपी झाडांक 500 g युरिया, 250 g DAP आनी 250 g MOP दियात.',
    mango:
      'गोंयांत आंब्याक नोव्हेंबर ते जानेवारींत फुलां येतात आनी एप्रिल ते जूनांत फळां तयार जातात. अल्फांसो आनी मांकुराड ह्यो मुख्य जाती आसात.',
    cashew:
      'काजू गोंयच्या लाल मातयेंत बरो येता. जून-जुलयांत 7x7 मीटर अंतरार लागवड करात. Vengurla-4 सारकिल्या जातींसून 8 ते 12 kg नट्स प्रती झाड मेळटात.',
    coconut:
      'नारळाक उन्हाळ्यांत आठवड्यांत 2 ते 3 खेप 40 ते 45 लिटर उदक दियात. तिमाही NPK आनी सूक्ष्मपोषक दियात. मेलेलीं पानां नेमान काडात.',
    pest:
      'कीड व्यवस्थापनांत सगळ्यांत म्हत्वाचें म्हणजे वेळीच वळखप. दर 3 ते 4 दिसांनी शेताची तपासणी करात. आदीं कडूनिंब तेल आनी चिकट सापळे वापरात. रसायनां फकत गरज आसल्यार वापरात.',
    neem:
      'कडूनिंब तेल एक सुरक्षीत आनी प्रभावी जैविक कीटकनाशक आसा. 5 ml तेल आनी 1 ml साबण 1 लिटर उदकांत मेळयात. पानांखाल फवारणी करात. सकाळीं लवकर वा सांजेर फवारात.',
    irrigation:
      'चडश्या पिकांक 5 ते 7 दिसांनी एकदां, भाजी पिकांक 3 ते 4 दिसांनी उदक दियात. सकाळीं 6 ते 8 वाजतां उदक दियात. ड्रिप सिंचनान 40 ते 50 टक्के उदक वाचता.',
    subsidy:
      'गोंयच्या शेतकऱ्यांखातीर अनुदानां: ड्रिप सिंचन (50 ते 90 टक्के), पॉवर टिलर (25 ते 50 टक्के), प्रमाणित बियो (50 टक्के), आनी PM-KISAN मधून दर वर्सां 6,000 रुपया.',
    soil:
      'दर 2 ते 3 वर्सांनी KVK वा कृषी विभागाकडसून माती तपासणी करात. चडश्या पिकांखातीर pH 6 ते 7 बरें आसा. लेटरराइट माती अनेकदां आम्लीय आसता — 500 kg चुनो आनी 2 ते 3 टन कंपोस्ट घालात.',
  },
};

// ─────────────────────────────────────────────────────
// INTENT MAP — maps sentence patterns to topic slugs
// ─────────────────────────────────────────────────────
const INTENT_MAP = [
  { slug: 'greeting',   phrases: ['hi','hello','hey','namaste','namaskar','good morning','good afternoon','good evening','good night','kya hal','kasa aahe','how are you','sup','hii'] },
  { slug: 'thanks',     phrases: ['thank you','thanks','shukriya','dhanyawad','dhanyavad','aabhar'] },
  { slug: 'bye',        phrases: ['bye','goodbye','alvida','nirop','tata'] },
  { slug: 'who',        phrases: ['who are you','what are you','about you','kaun ho','tumhi kon'] },
  { slug: 'help',       phrases: ['what can you do','what do you know','help me','kya kar sakte'] },
  // Fertilizer
  { slug: 'fertilizer', phrases: ['fertilizer','fertiliser','which fertilizer','best fertilizer','what fertilizer','konti khad','kaunsi khaad','khad','khaad','feed my crop','what to feed','crop nutrition','plant food'] },
  { slug: 'urea',       phrases: ['urea','nitrogen fertilizer','leafy growth','n fertilizer'] },
  { slug: 'dap',        phrases: ['dap','di ammonium phosphate','phosphorus fertilizer','root growth fertilizer'] },
  { slug: 'npk',        phrases: ['npk','n p k','complete fertilizer','balanced fertilizer'] },
  { slug: 'potash',     phrases: ['potash','potassium','mop','muriate of potash','k fertilizer'] },
  { slug: 'compost',    phrases: ['compost','vermicompost','jivamrut','jeevamrut','compost making','how to make compost','organic manure','gobar khad','cow dung'] },
  { slug: 'organic fertilizer', phrases: ['organic fertilizer','jaivik khad','sendiya khad','natural fertilizer','bio fertilizer','organic input'] },
  { slug: 'micronutrients', phrases: ['micronutrient','zinc deficiency','boron deficiency','iron deficiency','yellow leaves','yellowing leaf','pale leaves'] },
  { slug: 'foliar spray', phrases: ['foliar spray','leaf spray','spray on leaves','patti par spray'] },
  // Mango
  { slug: 'mango fertilizer', phrases: ['fertilizer for mango','mango fertilizer','mango khad','aam ka khaad','aamacha khad','feed mango','mango nutrition','which khad for mango','khad for aam'] },
  { slug: 'mango pest',       phrases: ['mango pest','mango insect','mango hopper','mango fly','aam keeda','mango bug','aam ka kida'] },
  { slug: 'mango disease',    phrases: ['mango disease','mango blight','mango rot','mango mildew','aam rog'] },
  { slug: 'mango',            phrases: ['mango','hapus','alphonso','mankurad','aam','amba'] },
  // Cashew
  { slug: 'cashew fertilizer', phrases: ['fertilizer for cashew','cashew fertilizer','kaju ka khaad','kajucha khad','feed cashew','cashew nutrition','khad for kaju'] },
  { slug: 'cashew pest',       phrases: ['cashew pest','cashew bug','kaju keeda','tea mosquito','cashew stem borer'] },
  { slug: 'cashew',            phrases: ['cashew','kaju','cashew farming','how to grow cashew'] },
  // Coconut
  { slug: 'coconut fertilizer', phrases: ['fertilizer for coconut','coconut fertilizer','nariyal khad','naral khad','feed coconut'] },
  { slug: 'coconut',            phrases: ['coconut','nariyal','naral','coconut palm','coconut farming'] },
  // Paddy/Rice
  { slug: 'paddy fertilizer', phrases: ['fertilizer for paddy','paddy fertilizer','rice fertilizer','dhan khad','bhatache khad','feed rice','feed paddy'] },
  { slug: 'paddy',            phrases: ['paddy','rice farming','dhan','bhat','tandd','chawal','paddy farming','how to grow rice'] },
  { slug: 'rice',             phrases: ['rice crop','rice disease','rice pest','rice blast','rice yield'] },
  // Vegetables
  { slug: 'tomato',   phrases: ['tomato','tamatar','tamtamat','how to grow tomato','tomato farming'] },
  { slug: 'brinjal',  phrases: ['brinjal','eggplant','baingan','vangi','vaangi','brinjal farming'] },
  { slug: 'okra',     phrases: ['okra','bhendi','bhindi','lady finger','okra farming'] },
  { slug: 'onion',    phrases: ['onion','pyaaz','kanda','onion farming','how to grow onion'] },
  { slug: 'potato',   phrases: ['potato','aloo','batata','potato farming'] },
  { slug: 'chilli',   phrases: ['chilli','chili','mirchi','mirch','green chilli','chilli farming'] },
  { slug: 'banana',   phrases: ['banana','kela','plantain','banana farming'] },
  { slug: 'papaya',   phrases: ['papaya','papita','papaya farming','how to grow papaya'] },
  // Pest/Disease
  { slug: 'pest',     phrases: ['pest control','pest management','insect problem','how to control pest','keeda niyantran','kidu niyantran','pest attack','spray for pest','kida mara','keeda maro'] },
  { slug: 'fungus',   phrases: ['fungal disease','fungus problem','fungicide','leaf spot','blight','rot','mold','powdery mildew','rog control'] },
  { slug: 'aphids',   phrases: ['aphid','aphids','mavu','mawa','green fly','plant lice'] },
  { slug: 'neem',     phrases: ['neem oil','neem spray','neem pesticide','nim tel','kadu nimb tel','how to use neem'] },
  { slug: 'stem borer', phrases: ['stem borer','shoot borer','dead heart','borer pest','tana borer'] },
  { slug: 'fruit fly',  phrases: ['fruit fly','tephritidae','melon fly','bactrocera','cue lure'] },
  // Irrigation
  { slug: 'irrigation',      phrases: ['irrigation','how to water','watering schedule','when to water','how much water','sinchai kab','pani kab dena','udak kadhi'] },
  { slug: 'drip irrigation', phrases: ['drip irrigation','drip system','drip sinchani','trickle irrigation','drip cost','drip subsidy'] },
  // Soil
  { slug: 'soil',       phrases: ['soil health','soil improvement','how to improve soil','mitti sudhar','maati sudhar','laterite soil','sandy soil','clay soil','soil problem'] },
  { slug: 'soil test',  phrases: ['soil test','mitti ki jaanch','maati tapas','soil testing','soil ph','test my soil','how to test soil'] },
  { slug: 'mulching',   phrases: ['mulching','mulch','soil cover','straw mulch','plastic mulch'] },
  { slug: 'weeding',    phrases: ['weed','weeding','herbicide','weed control','nikaii','tanha kadna'] },
  { slug: 'crop rotation', phrases: ['crop rotation','fasal chakra','pik ferav','rotate crops'] },
  // Weather
  { slug: 'monsoon',  phrases: ['monsoon farming','rainy season tips','rain farming','kharif tips','paus sheti','what to do in monsoon'] },
  { slug: 'drought',  phrases: ['drought','dry weather','no rain','water stress','sukha','dushkal','drought tips'] },
  // Goa/Government
  { slug: 'goa',            phrases: ['goa farming','goa crop','goa soil','farming in goa','goa agriculture'] },
  { slug: 'kvk',            phrases: ['kvk','krishi vigyan kendra','agriculture office','where to get farming help'] },
  { slug: 'subsidy',        phrases: ['subsidy','anudan','government scheme','sarkari yojana','free seed','government help','farming subsidy','scheme for farmer','sarkar yojana'] },
  { slug: 'crop insurance', phrases: ['crop insurance','fasal bima','pmfby','insure my crop'] },
  { slug: 'pm kisan',       phrases: ['pm kisan','pmkisan','6000 rupees','pm-kisan','kisan money','farmer income scheme'] },
  { slug: 'kcc',            phrases: ['kisan credit card','kcc','crop loan','farmer loan','farming loan','karz'] },
  // Post harvest
  { slug: 'storage',  phrases: ['how to store','crop storage','grain storage','post harvest','store grains','preserve crop','bhandan'] },
  { slug: 'market',   phrases: ['how to sell','market price','mandi rate','where to sell','crop price','enam','apmc','sell produce','market tips'] },
  // Crops
  { slug: 'groundnut',  phrases: ['groundnut','peanut','mungfali','shengdana','ground nut farming'] },
  { slug: 'sugarcane',  phrases: ['sugarcane','ganna','oos','sugarcane farming'] },
  { slug: 'spices',     phrases: ['spice','pepper','cardamom','nutmeg','clove','masale','black pepper','kali mirch'] },
  { slug: 'intercropping', phrases: ['intercrop','intercropping','mixed farming','multiple crop','sanyukt sheti'] },
  { slug: 'greenhouse', phrases: ['greenhouse','polyhouse','poly house','protected farming','indoor farming','controlled farming'] },
  { slug: 'seed treatment', phrases: ['seed treatment','beej upchar','bij upchar','treat seeds','seed dressing'] },
  // Livestock
  { slug: 'animal feed', phrases: ['animal','cow','goat','poultry','cattle','livestock','pashu','gai','janavar','animal feed','dairy'] },
  { slug: 'water conservation', phrases: ['water conservation','water saving','farm pond','pani bachao','water harvest','rainwater','save water'] },
];

// ─────────────────────────────────────────────────────
// SMART MATCH
// ─────────────────────────────────────────────────────
function findPreloaded(text, lang) {
  const t = text.toLowerCase().trim();
  const db = PRELOADED[lang] || PRELOADED.en;
  for (const intent of INTENT_MAP) {
    for (const phrase of intent.phrases) {
      if (t.includes(phrase)) {
        return db[intent.slug] || PRELOADED.en[intent.slug] || null;
      }
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────
// PLANT.ID API
// ─────────────────────────────────────────────────────
async function callPlantId(base64Image, lang) {
  try {
    const res = await fetch('https://plant.id/api/v3/health_assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Api-Key': PLANTID_KEY },
      body: JSON.stringify({
        images: [`data:image/jpeg;base64,${base64Image}`],
        latitude: 15.4909, longitude: 73.8278,
        similar_images: false,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const healthy = data?.result?.is_healthy?.binary;
    const diseases = data?.result?.disease?.suggestions || [];
    if (healthy === true) {
      return lang === 'hi' ? 'आपकी फसल की तस्वीर देखने पर कोई बड़ी बीमारी या कीट नहीं पाया गया — फसल स्वस्थ दिखती है। नियमित निगरानी जारी रखें और हर 10 दिन में नीम तेल का छिड़काव करते रहें।'
           : lang === 'mr' ? 'तुमच्या पिकाच्या फोटोमध्ये कोणताही मोठा रोग किंवा कीड आढळला नाही — पीक निरोगी दिसत आहे. नियमित तपासणी आणि दर 10 दिवसांनी कडुनिंब तेल फवारणी सुरू ठेवा.'
           : lang === 'kok' ? 'तुमच्या पिकाच्या फोटोंत कसलोच मोठो रोग वा कीड दिसना — पीक भलें दिसता. नेमान तपासणी आनी दर 10 दिसांनी कडूनिंब तेल फवारणी करात.'
           : 'Your crop looks healthy in this image — no major disease or pest was detected. Keep up regular field monitoring and continue preventive neem oil sprays every 10 days.';
    }
    if (!diseases.length) return null;
    const top  = diseases[0];
    const name = top?.name || 'Unknown issue';
    const prob = top?.probability ? Math.round(top.probability * 100) : null;
    const desc = (top?.details?.description || '').slice(0, 180);
    const bio  = (top?.details?.treatment?.biological || [])[0] || '';
    const chem = (top?.details?.treatment?.chemical   || [])[0] || '';
    let reply = `Detected: ${name}${prob ? ` (${prob}% confidence)` : ''}.`;
    if (desc)  reply += ` ${desc}.`;
    if (bio)   reply += ` Organic treatment: ${bio.slice(0, 120)}.`;
    if (chem)  reply += ` Chemical treatment: ${chem.slice(0, 120)}.`;
    reply += ' Please also consult your local agriculture officer for exact dosage.';
    return stripMd(reply);
  } catch (e) { console.error('Plant.id error:', e); return null; }
}

// ─────────────────────────────────────────────────────
// GROQ API — fallback
// ─────────────────────────────────────────────────────
async function callGroq(prompt, lang) {
  const langLine =
    lang === 'hi'  ? 'You MUST respond ONLY in Hindi.' :
    lang === 'mr'  ? 'You MUST respond ONLY in Marathi.' :
    lang === 'kok' ? 'You MUST respond ONLY in Konkani.' :
    'You MUST respond ONLY in English.';
  const system = `You are AgroGROW AI for Goa farmers. ${langLine} Write one helpful paragraph of 3 to 5 sentences. Give specific advice suited to Goa climate and laterite soil. Plain text only — no markdown, no bold, no bullet points.`;
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 220,
        temperature: 0.5,
        messages: [
          { role: 'system', content: system },
          { role: 'user',   content: prompt },
        ],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content?.trim() || null;
    return raw ? stripMd(raw) : null;
  } catch (e) { console.error('Groq error:', e); return null; }
}

// ─────────────────────────────────────────────────────
// UI — MessageBubble
// ─────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  if (isUser) {
    return (
      <View style={styles.userWrapper}>
        <LinearGradient colors={['#10B981', '#059669']} style={styles.userBubble}>
          {msg.image && <Image source={{ uri: msg.image }} style={styles.msgImage} />}
          <Text style={styles.userText}>{msg.text}</Text>
        </LinearGradient>
      </View>
    );
  }
  return (
    <View style={styles.botWrapper}>
      <View style={styles.botAvatar}>
        <MaterialCommunityIcons name="robot-confused-outline" size={20} color="#059669" />
      </View>
      <View style={styles.botBubble}>
        <Text style={styles.botText}>{msg.text}</Text>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────
// MAIN SCREEN
// ─────────────────────────────────────────────────────
export default function ChatbotScreen() {
  const { user } = useApp();
  const insets = useSafeAreaInsets();
  const [lang, setLang]         = useState(user?.lang || 'en');
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [messages, setMessages] = useState([
    { id: '0', role: 'bot', text: PRELOADED[user?.lang || 'en']?.greeting || PRELOADED.en.greeting },
  ]);
  const scrollRef = useRef(null);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
  }, [messages, loading]);

  function changeLang(l) {
    setLang(l);
    setMessages([{ id: Date.now().toString(), role: 'bot', text: PRELOADED[l]?.greeting || PRELOADED.en.greeting }]);
  }

  async function handleSend(text = input, imageUri = null, imageBase64 = null) {
    const trimmed = (text || '').trim();
    if (!trimmed && !imageUri) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      text: trimmed || 'Analyzing photo...',
      image: imageUri || null,
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    Keyboard.dismiss();

    let reply = null;

    if (imageBase64) {
      reply = await callPlantId(imageBase64, lang);
      if (!reply) reply = await callGroq('Analyze this crop image for diseases or pests and give treatment advice.', lang);
    } else {
      reply = findPreloaded(trimmed, lang);
      if (!reply) reply = await callGroq(trimmed, lang);
    }

    setMessages(prev => [...prev, {
      id: (Date.now() + 1).toString(),
      role: 'bot',
      text: reply ||
        (lang === 'hi'  ? 'माफ़ करें, अभी जवाब नहीं मिल पाया। कृपया इंटरनेट जाँचें और दोबारा पूछें।' :
         lang === 'mr'  ? 'माफ करा, आत्ता उत्तर मिळाले नाही. पुन्हा प्रयत्न करा.' :
         lang === 'kok' ? 'माफ करात, जाप मेळनां. परतून प्रयत्न करात.' :
         "I'm having trouble connecting right now. Please check your internet and try again."),
    }]);
    setLoading(false);
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#064E3B" />

      {/* ── HEADER ── */}
      <LinearGradient
        colors={['#064E3B', '#10B981']}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>AgroGROW AI</Text>
            <View style={styles.statusRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.statusText}>Live Assistant</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => setMessages([{ id: Date.now().toString(), role: 'bot', text: PRELOADED[lang]?.greeting || PRELOADED.en.greeting }])}
            style={styles.historyBtn}
          >
            <Ionicons name="refresh-outline" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.langScroll}>
          {[{ v: 'en', l: 'English' }, { v: 'hi', l: 'Hindi' }, { v: 'mr', l: 'Marathi' }, { v: 'kok', l: 'Konkani' }].map(o => (
            <TouchableOpacity
              key={o.v}
              style={[styles.langChip, lang === o.v && styles.langChipActive]}
              onPress={() => changeLang(o.v)}
            >
              <Text style={[styles.langText, lang === o.v && styles.langTextActive]}>{o.l}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      {/* ── CHAT AREA ── */}
      <ScrollView
        ref={scrollRef}
        style={styles.chatArea}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)}
        {loading && (
          <View style={styles.botWrapper}>
            <View style={styles.botAvatar}>
              <ActivityIndicator size="small" color="#059669" />
            </View>
            <View style={styles.botBubble}>
              <Text style={styles.typingText}>
                {lang === 'hi' ? 'सोच रहा हूँ...' : lang === 'mr' ? 'विचार करतोय...' : lang === 'kok' ? 'विचार करतां...' : 'Thinking...'}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── INPUT BAR ── */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 10 }]}>
          <View style={styles.inputPill}>
            <TouchableOpacity
              onPress={async () => {
                const res = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.6 });
                if (!res.canceled) handleSend('', res.assets[0].uri, res.assets[0].base64);
              }}
              style={styles.cameraBtn}
            >
              <Ionicons name="camera-outline" size={24} color="#64748B" />
            </TouchableOpacity>

            <TextInput
              style={styles.textInput}
              placeholder={
                lang === 'hi'  ? 'कुछ भी पूछें...' :
                lang === 'mr'  ? 'काहीही विचारा...' :
                lang === 'kok' ? 'कितेंय विचारात...' :
                'Ask about farming...'
              }
              placeholderTextColor="#94A3B8"
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => handleSend()}
              returnKeyType="send"
              multiline
            />

            <TouchableOpacity onPress={() => handleSend()} style={styles.sendBtn}>
              <LinearGradient colors={['#10B981', '#059669']} style={styles.sendBtnGrad}>
                <Ionicons name="send" size={18} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ─────────────────────────────────────────────────────
// STYLES — exact same as pasted UI code
// ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  mainContainer:   { flex: 1, backgroundColor: '#F8FAFC' },
  header:          { paddingHorizontal: 20, paddingBottom: 25, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle:     { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: -0.8 },
  statusRow:       { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  onlineDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4ADE80', marginRight: 6 },
  statusText:      { fontSize: 12, color: 'rgba(255,255,255,0.9)', fontWeight: '700' },
  historyBtn:      { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  langScroll:      { marginTop: 20 },
  langChip:        { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', marginRight: 10 },
  langChipActive:  { backgroundColor: '#FFF' },
  langText:        { fontSize: 13, fontWeight: '800', color: '#FFF' },
  langTextActive:  { color: '#064E3B' },
  chatArea:        { flex: 1 },
  userWrapper:     { alignItems: 'flex-end', marginBottom: 20 },
  userBubble:      { padding: 15, borderRadius: 24, borderBottomRightRadius: 4, maxWidth: '85%' },
  userText:        { color: '#FFF', fontSize: 15, fontWeight: '600' },
  botWrapper:      { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20 },
  botAvatar:       { width: 36, height: 36, borderRadius: 12, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', marginRight: 12, elevation: 2 },
  botBubble:       { backgroundColor: '#FFF', padding: 16, borderRadius: 24, borderBottomLeftRadius: 4, maxWidth: '80%', borderWidth: 1, borderColor: '#F1F5F9', elevation: 1 },
  botText:         { color: '#1E293B', fontSize: 15, fontWeight: '500', lineHeight: 23 },
  typingText:      { fontSize: 13, color: '#94A3B8', fontStyle: 'italic' },
  inputContainer:  { padding: 15, paddingBottom: 10, backgroundColor: '#F8FAFC' },
  inputPill:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 35, padding: 8, paddingHorizontal: 15, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8 },
  cameraBtn:       { padding: 8 },
  textInput:       { flex: 1, paddingHorizontal: 12, fontSize: 16, color: '#1E293B', maxHeight: 100 },
  sendBtn:         { width: 46, height: 46, borderRadius: 23, overflow: 'hidden' },
  sendBtnGrad:     { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  msgImage:        { width: 220, height: 160, borderRadius: 18, marginBottom: 10 },
});