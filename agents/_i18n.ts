/**
 * Backend i18n module — English-only strings shared by agents and cloud-functions.
 *
 * Usage:
 *   import { t, getLocale, languageDirective } from "../_i18n";
 *   const msg = t(locale, "ai.refundSubmitted", { orderId });
 *
 * The frontend (lib/i18n.tsx) maintains a parallel table with the
 * same keys for client-side rendering.
 */

export type Locale = "en" | "hi" | "hinglish";

/** English-only: always returns "en" regardless of request body. */
export function getLocale(_body?: any): Locale {
  return "en";
}

// Common Roman-script Hindi words (no English loanwords here on purpose, so
// pure-English messages are never misclassified as Hinglish).
const HINGLISH_WORDS = new Set([
  "mujhe", "mera", "meri", "mere", "mein", "maine", "hum", "tum", "tumhara",
  "tumhari", "aap", "aapka", "aapki", "aapko", "tujhe", "tera", "teri",
  "kya", "kaise", "kab", "kahan", "kidhar", "kitna", "kitne", "kitni",
  "kaun", "kaunsa", "chahiye", "chaahiye", "karo", "karo", "karke", "karna",
  "karte", "karta", "karti", "kiya", "kiye", "hai", "hain", "ho", "hun",
  "tha", "thi", "hoga", "hogi", "honge", "raha", "rahe", "rahi",
  "gaya", "gayi", "gaye", "wala", "wali", "wale", "wala", "nahi", "nahin",
  "nahein", "mat", "matlab", "kyunki", "kyonki", "lekin", "magar", "aur",
  "ya", "par", "ko", "ka", "ki", "ke", "se", "bhi", "bahut", "bohot",
  "thoda", "thodi", "zyada", "kam", "accha", "achha", "acha", "arre",
  "namaste", "namaskar", "shukriya", "dhanyavad", "dhanyavaad", "paise",
  "wapas", "wapasi", "dikhao", "dikhayein", "dikha", "batayein", "batao",
  "bata", "samajh", "samjhao", "pata", "maloom", "liye", "saath", "wajah",
  "kaam", "cheez", "saman", "samaan", "dobaara", "dobara", "phir", "abhi",
  "ab", "kal", "aaj", "theek", "thik", "kharab", "bhejo", "bhej", "dekho",
  "dekhein", "sunao", "madad", "pahunchega", "pahuncha", "pahuchega",
  "lagega", "lagegi", "lagenge", "lagta", "lagti", "lagte", "laga", "lagi",
  "milega", "milegi", "mila", "mili", "milta", "milti", "hota", "hoti",
  "hote", "hua", "hui", "hue", "diya", "diyaa", "lena", "dena", "jana",
  "badalna", "badlo", "dusra", "dusri", "dusre", "alag", "wahi", "yeh",
  "woh", "ye", "vo", "kuch", "sab", "koi", "kafi", "bas", "sirf", "bina",
]);

/**
 * Detect the user's language from a raw message: "hi" for Devanagari,
 * "hinglish" for Roman-script Hindi mix, "en" otherwise.
 */
export function detectLanguage(text: string): Locale {
  if (!text) return "en";
  if (/[\u0900-\u097F]/.test(text)) return "hi";
  const words = text.toLowerCase().split(/[^a-z]+/).filter(Boolean);
  if (words.length === 0) return "en";
  let hits = 0;
  for (const w of words) if (HINGLISH_WORDS.has(w)) hits++;
  if (hits >= 2 || (hits >= 1 && words.length <= 4)) return "hinglish";
  return "en";
}

/** Appended to LLM system prompts: mirror the user's language and tone. */
export function languageDirective(locale: Locale): string {
  const langName =
    locale === "hi"
      ? "Hindi (Devanagari script)"
      : locale === "hinglish"
        ? "Hinglish (Hindi-English mix in Roman script)"
        : "English";
  return `\n\nIMPORTANT: The user is speaking ${langName}. Respond in the SAME language and script. Match their tone: casual/friendly → warm and friendly; formal → polite and professional; upset → calm, empathetic and reassuring. Never be rude or sarcastic.`;
}

// ─── Translation table (English only) ───

const EN: Record<string, string> = {
  // Status labels
  "status.pending": "Pending",
  "status.shipped": "Shipped",
  "status.delivered": "Delivered",
  "status.refund_requested": "Refund Requested",
  "status.refund_approved": "Refund Approved",
  "status.refund_completed": "Refund Completed",
  "status.exchange_requested": "Exchange Requested",
  "status.exchange_shipped": "Exchange Shipped",
  "status.unknown": "Unknown",

  // Workflow steps
  "step.intent_recognition": "Understanding your question...",
  "step.faq_search": "Searching policies...",
  "step.lookup_order": "Looking up your order...",
  "step.request_refund": "Processing refund request...",
  "step.request_exchange": "Processing exchange request...",
  "step.general_chat": "Thinking...",

  // AI static responses
  "ai.kbEmpty": "Sorry, no relevant documents found in the knowledge base. Please rephrase your question or share your order ID and I'll help.",
  "ai.faqNotFound": "Sorry, I couldn't find any documents matching your question. Please rephrase or share your order ID.",
  "ai.noOrders": "No orders found. Please provide an order ID, or import the demo data from the Knowledge Base.",
  "ai.orderListPrompt": "You have the following orders. Which one would you like to look up?\n\n{lines}",
  "ai.orderFound": "Found your order {orderId}. Current status: **{statusLabel}**.{tracking}",
  "ai.trackingLine": "\nShipping: {carrier} {trackingNumber}",
  "ai.orderNotFound": "Sorry, order {orderId} was not found. Please double-check the ID, or import the demo data from the Knowledge Base.",
  "ai.orderFoundFromBlob": "Found details for order **{orderId}**:\n\n{content}",
  "ai.refundNoOrders": "No orders found, can't process refund. Please import demo data or provide an order ID.",
  "ai.refundOrderListPrompt": "Please choose the order to refund (only Shipped or Delivered orders are eligible):\n\n{lines}\n\nReply with the order ID.",
  "ai.refundDuplicate": "Order {orderId} already has a refund record, no need to apply again.\n\nDetails:\n{content}",
  "ai.refundDuplicateShort": "Order {orderId} already has a refund record (current status: {statusLabel}). No need to apply again.",
  "ai.refundIneligible": "Order {orderId} is currently \"{statusLabel}\" and not eligible for refund. Only Shipped or Delivered orders can be refunded.",
  "ai.refundIneligibleWithDetail": "Order {orderId} is currently \"{statusLabel}\" and not eligible for refund. Only Shipped or Delivered orders can be refunded.\n\nDetails:\n{content}",
  "ai.refundSubmittedSimple": "Refund submitted!\n\n- Order: {orderId}\n- Funds will return to original payment method in 3-5 business days\n\nIf this is a quality issue, we'll provide free pickup service.",
  "ai.refundSubmitted": "Refund submitted!\n\n- Order: {orderId}\n- Refund amount: ¥{amount}\n- Funds will return to original payment method in 3-5 business days\n\nIf this is a quality issue, we'll provide free pickup service.",
  "ai.exchangeNoOrders": "No orders found, can't process exchange. Please import demo data or provide an order ID.",
  "ai.exchangeOrderListPrompt": "Please choose the order to exchange (only Delivered orders are eligible):\n\n{lines}\n\nReply with the order ID.",
  "ai.exchangeDuplicate": "Order {orderId} already has an exchange record, no need to apply again.\n\nDetails:\n{content}",
  "ai.exchangeIneligible": "Order {orderId} is currently \"{statusLabel}\". Only Delivered items can be exchanged.\n\nDetails:\n{content}",
  "ai.exchangeIneligibleShort": "Order {orderId} is currently \"{statusLabel}\". Only Delivered items can be exchanged.",
  "ai.exchangeSubmittedNoItems": "Exchange submitted!\n\n- Order: {orderId}\n- Processing time: new item ships within 3 business days of receiving the old one\n\nPlease return the item in pristine condition with original packaging.",
  "ai.exchangeSubmitted": "Exchange submitted!\n\n- Order: {orderId}\n- Items: {items}\n- Processing time: new item ships within 3 business days of receiving the old one\n\nPlease return the item in pristine condition with original packaging.",
  "ai.orderNotFoundShort": "Order {orderId} not found, please verify the order ID.",

  // Suggestions
  "sug.refund": "Refund this order",
  "sug.exchange": "Exchange this order",
  "sug.refundActionTpl": "I want a refund for {orderId}",
  "sug.exchangeActionTpl": "I want to exchange {orderId}",
  "sug.delivery": "When will it arrive?",
  "sug.deliveryActionTpl": "When will {orderId} arrive?",
  "sug.eta": "When will it ship?",
  "sug.etaActionTpl": "When will {orderId} ship?",
  "sug.cancel": "Cancel this order",
  "sug.cancelActionTpl": "I want to cancel order {orderId}",
  "sug.status": "What's the latest status?",
  "sug.statusActionTpl": "What's the latest status of {orderId}?",
  "sug.lookupOther": "Look up another order",
  "sug.faqGeneral": "After-sales policies",
  "sug.refundApply": "Apply for a refund",
  "sug.timelineRefund": "How long for refund?",
  "sug.address": "What's the return address?",
  "sug.timelineExchange": "How long for exchange?",
  "sug.lookupMyOrders": "Look up my orders",

  // SSE: seed-demo
  "seed.start": "Importing {docs} docs + {orders} orders...",
  "seed.indexing": "[{i}/{n}] Indexing: {title}",
  "seed.importingOrder": "[{i}/{n}] Importing order: {orderId}",
  "seed.failure": "Import failed: {failed} entries had errors. Check storage configuration.",
  "seed.successOnly": "Done! Imported {imported} entries",
  "seed.successWithFailures": "Done! Imported {imported}, failed {failed}",

  // SSE: upload
  "upload.parsing": "Parsing document: {filename}",
  "upload.parseDone": "Parsed, extracted {chars} chars",
  "upload.summarizing": "Generating summary and keywords...",
  "upload.saving": "Saving document...",
  "upload.noText": "Could not extract text from the document.",
  "upload.failure": "Upload failed: {error}",
};

const HI: Record<string, string> = {
  // Status labels
  "status.pending": "लंबित",
  "status.shipped": "भेज दिया गया",
  "status.delivered": "डिलीवर हो गया",
  "status.refund_requested": "रिफंड अनुरोधित",
  "status.refund_approved": "रिफंड स्वीकृत",
  "status.refund_completed": "रिफंड पूरा",
  "status.exchange_requested": "एक्सचेंज अनुरोधित",
  "status.exchange_shipped": "एक्सचेंज भेज दिया गया",
  "status.unknown": "अज्ञात",

  // Workflow steps
  "step.intent_recognition": "आपका प्रश्न समझ रहे हैं...",
  "step.faq_search": "संबंधित नीति खोज रहे हैं...",
  "step.lookup_order": "आपका ऑर्डर देख रहे हैं...",
  "step.request_refund": "रिफंड अनुरोध प्रोसेस कर रहे हैं...",
  "step.request_exchange": "एक्सचेंज अनुरोध प्रोसेस कर रहे हैं...",
  "step.general_chat": "सोच रहे हैं...",

  // AI static responses
  "ai.kbEmpty": "माफ़ कीजिए, नॉलेज बेस में इससे संबंधित कोई दस्तावेज़ नहीं मिला। कृपया अपना प्रश्न दूसरे तरीके से बताएं या अपना ऑर्डर आईडी भेजें, मैं मदद करूंगा।",
  "ai.faqNotFound": "माफ़ कीजिए, आपके प्रश्न से मेल खाता कोई दस्तावेज़ नहीं मिला। कृपया दोबारा बताएं या अपना ऑर्डर आईडी भेजें।",
  "ai.noOrders": "कोई ऑर्डर रिकॉर्ड नहीं मिला। कृपया ऑर्डर आईडी बताएं, या नॉलेज बेस से डेमो डेटा इंपोर्ट करें।",
  "ai.orderListPrompt": "आपके ये ऑर्डर हैं। बताएं कौन सा देखना है:\n\n{lines}",
  "ai.orderFound": "आपका ऑर्डर {orderId} मिल गया। वर्तमान स्थिति: **{statusLabel}**।{tracking}",
  "ai.trackingLine": "\nकूरियर: {carrier} {trackingNumber}",
  "ai.orderNotFound": "माफ़ कीजिए, ऑर्डर {orderId} नहीं मिला। कृपया आईडी जांच लें, या नॉलेज बेस से डेमो डेटा इंपोर्ट करें।",
  "ai.orderFoundFromBlob": "ऑर्डर **{orderId}** की जानकारी मिली:\n\n{content}",
  "ai.refundNoOrders": "कोई ऑर्डर रिकॉर्ड नहीं है, रिफंड प्रोसेस नहीं हो सकता। पहले डेमो डेटा इंपोर्ट करें या ऑर्डर आईडी बताएं।",
  "ai.refundOrderListPrompt": "रिफंड के लिए ऑर्डर चुनें (केवल भेजे गए या डिलीवर हुए ऑर्डर योग्य हैं):\n\n{lines}\n\nऑर्डर आईडी भेजें।",
  "ai.refundDuplicate": "ऑर्डर {orderId} का रिफंड रिकॉर्ड पहले से है, दोबारा आवेदन की ज़रूरत नहीं।\n\nविवरण:\n{content}",
  "ai.refundDuplicateShort": "ऑर्डर {orderId} का रिफंड रिकॉर्ड पहले से है (वर्तमान स्थिति: {statusLabel}), दोबारा आवेदन की ज़रूरत नहीं।",
  "ai.refundIneligible": "ऑर्डर {orderId} अभी \"{statusLabel}\" है और रिफंड के योग्य नहीं है। केवल भेजे गए या डिलीवर हुए ऑर्डर पर रिफंड मिलता है।",
  "ai.refundIneligibleWithDetail": "ऑर्डर {orderId} अभी \"{statusLabel}\" है और रिफंड के योग्य नहीं है। केवल भेजे गए या डिलीवर हुए ऑर्डर पर रिफंड मिलता है।\n\nविवरण:\n{content}",
  "ai.refundSubmittedSimple": "रिफंड आवेदन जमा हो गया!\n\n- ऑर्डर: {orderId}\n- 3-5 कार्यदिवसों में पैसा मूल पेमेंट माध्यम में वापस आएगा\n\nयदि क्वालिटी समस्या है, तो हम मुफ़्त पिकअप देंगे।",
  "ai.refundSubmitted": "रिफंड आवेदन जमा हो गया!\n\n- ऑर्डर: {orderId}\n- रिफंड राशि: ¥{amount}\n- 3-5 कार्यदिवसों में पैसा मूल पेमेंट माध्यम में वापस आएगा\n\nयदि क्वालिटी समस्या है, तो हम मुफ़्त पिकअप देंगे।",
  "ai.exchangeNoOrders": "कोई ऑर्डर रिकॉर्ड नहीं है, एक्सचेंज प्रोसेस नहीं हो सकता। पहले डेमो डेटा इंपोर्ट करें या ऑर्डर आईडी बताएं।",
  "ai.exchangeOrderListPrompt": "एक्सचेंज के लिए ऑर्डर चुनें (केवल डिलीवर हुए ऑर्डर योग्य हैं):\n\n{lines}\n\nऑर्डर आईडी भेजें।",
  "ai.exchangeDuplicate": "ऑर्डर {orderId} का एक्सचेंज रिकॉर्ड पहले से है, दोबारा आवेदन की ज़रूरत नहीं।\n\nविवरण:\n{content}",
  "ai.exchangeIneligible": "ऑर्डर {orderId} अभी \"{statusLabel}\" है। केवल डिलीवर हुआ सामान बदला जा सकता है।\n\nविवरण:\n{content}",
  "ai.exchangeIneligibleShort": "ऑर्डर {orderId} अभी \"{statusLabel}\" है। केवल डिलीवर हुआ सामान बदला जा सकता है।",
  "ai.exchangeSubmittedNoItems": "एक्सचेंज आवेदन जमा हो गया!\n\n- ऑर्डर: {orderId}\n- पुराना सामान मिलने के 3 कार्यदिवसों में नया सामान भेजा जाएगा\n\nकृपया सामान बिल्कुल नई हालत में, पूरी पैकेजिंग के साथ वापस भेजें।",
  "ai.exchangeSubmitted": "एक्सचेंज आवेदन जमा हो गया!\n\n- ऑर्डर: {orderId}\n- सामान: {items}\n- पुराना सामान मिलने के 3 कार्यदिवसों में नया सामान भेजा जाएगा\n\nकृपया सामान बिल्कुल नई हालत में, पूरी पैकेजिंग के साथ वापस भेजें।",
  "ai.orderNotFoundShort": "ऑर्डर {orderId} नहीं मिला, कृपया ऑर्डर आईडी जांचें।",

  // Suggestions
  "sug.refund": "मुझे रिफंड चाहिए",
  "sug.exchange": "मुझे एक्सचेंज चाहिए",
  "sug.refundActionTpl": "मुझे {orderId} का रिफंड चाहिए",
  "sug.exchangeActionTpl": "मुझे {orderId} का सामान बदलना है",
  "sug.delivery": "कब पहुंचेगा?",
  "sug.deliveryActionTpl": "{orderId} कब पहुंचेगा?",
  "sug.eta": "कब भेजा जाएगा?",
  "sug.etaActionTpl": "{orderId} कब भेजा जाएगा?",
  "sug.cancel": "मैं ऑर्डर रद्द करना चाहता हूं",
  "sug.cancelActionTpl": "मैं ऑर्डर {orderId} रद्द करना चाहता हूं",
  "sug.status": "ताज़ा स्थिति क्या है?",
  "sug.statusActionTpl": "{orderId} की ताज़ा स्थिति क्या है?",
  "sug.lookupOther": "दूसरा ऑर्डर देखें",
  "sug.faqGeneral": "बिक्री-पश्चात नीतियां",
  "sug.refundApply": "रिफंड के लिए आवेदन करें",
  "sug.timelineRefund": "रिफंड में कितना समय लगेगा?",
  "sug.address": "वापसी का पता क्या है?",
  "sug.timelineExchange": "एक्सचेंज में कितना समय लगेगा?",
  "sug.lookupMyOrders": "मेरे ऑर्डर देखें",
};

const HINGLISH: Record<string, string> = {
  // Status labels
  "status.pending": "Pending",
  "status.shipped": "Shipped",
  "status.delivered": "Delivered",
  "status.refund_requested": "Refund Requested",
  "status.refund_approved": "Refund Approved",
  "status.refund_completed": "Refund Completed",
  "status.exchange_requested": "Exchange Requested",
  "status.exchange_shipped": "Exchange Shipped",
  "status.unknown": "Unknown",

  // Workflow steps
  "step.intent_recognition": "Aapka question samajh rahe hain...",
  "step.faq_search": "Related policy dhoondh rahe hain...",
  "step.lookup_order": "Aapka order dekh rahe hain...",
  "step.request_refund": "Refund request process kar rahe hain...",
  "step.request_exchange": "Exchange request process kar rahe hain...",
  "step.general_chat": "Soch rahe hain...",

  // AI static responses
  "ai.kbEmpty": "Sorry, knowledge base me isse related koi document nahi mila. Apna question dobara batayein ya order ID bhej dein, main help karunga.",
  "ai.faqNotFound": "Sorry, aapke question se match karta koi document nahi mila. Dobara batayein ya order ID bhej dein.",
  "ai.noOrders": "Koi order record nahi mila. Order ID batayein, ya Knowledge Base se demo data import karein.",
  "ai.orderListPrompt": "Aapke ye orders hain. Batayein kaun sa dekhna hai:\n\n{lines}",
  "ai.orderFound": "Aapka order {orderId} mil gaya. Current status: **{statusLabel}**.{tracking}",
  "ai.trackingLine": "\nShipping: {carrier} {trackingNumber}",
  "ai.orderNotFound": "Sorry, order {orderId} nahi mila. ID check kar lein, ya Knowledge Base se demo data import karein.",
  "ai.orderFoundFromBlob": "Order **{orderId}** ki details mili:\n\n{content}",
  "ai.refundNoOrders": "Koi order record nahi hai, refund process nahi ho sakta. Pehle demo data import karein ya order ID batayein.",
  "ai.refundOrderListPrompt": "Refund ke liye order chunein (sirf Shipped ya Delivered orders eligible hain):\n\n{lines}\n\nOrder ID bhej dein.",
  "ai.refundDuplicate": "Order {orderId} ka refund record pehle se hai, dobara apply karne ki zaroorat nahi.\n\nDetails:\n{content}",
  "ai.refundDuplicateShort": "Order {orderId} ka refund record pehle se hai (current status: {statusLabel}). Dobara apply karne ki zaroorat nahi.",
  "ai.refundIneligible": "Order {orderId} abhi \"{statusLabel}\" hai aur refund ke liye eligible nahi hai. Sirf Shipped ya Delivered orders par refund milta hai.",
  "ai.refundIneligibleWithDetail": "Order {orderId} abhi \"{statusLabel}\" hai aur refund ke liye eligible nahi hai. Sirf Shipped ya Delivered orders par refund milta hai.\n\nDetails:\n{content}",
  "ai.refundSubmittedSimple": "Refund submit ho gaya!\n\n- Order: {orderId}\n- 3-5 business days me paise original payment method me wapas aayenge\n\nAgar quality issue hai to free pickup milegi.",
  "ai.refundSubmitted": "Refund submit ho gaya!\n\n- Order: {orderId}\n- Refund amount: ¥{amount}\n- 3-5 business days me paise original payment method me wapas aayenge\n\nAgar quality issue hai to free pickup milegi.",
  "ai.exchangeNoOrders": "Koi order record nahi hai, exchange process nahi ho sakta. Pehle demo data import karein ya order ID batayein.",
  "ai.exchangeOrderListPrompt": "Exchange ke liye order chunein (sirf Delivered orders eligible hain):\n\n{lines}\n\nOrder ID bhej dein.",
  "ai.exchangeDuplicate": "Order {orderId} ka exchange record pehle se hai, dobara apply karne ki zaroorat nahi.\n\nDetails:\n{content}",
  "ai.exchangeIneligible": "Order {orderId} abhi \"{statusLabel}\" hai. Sirf Delivered item exchange ho sakta hai.\n\nDetails:\n{content}",
  "ai.exchangeIneligibleShort": "Order {orderId} abhi \"{statusLabel}\" hai. Sirf Delivered item exchange ho sakta hai.",
  "ai.exchangeSubmittedNoItems": "Exchange submit ho gaya!\n\n- Order: {orderId}\n- Purana item milne ke 3 business days me naya item bhej diya jayega\n\nItem bilkul nayi condition me, poori packaging ke saath wapas bhejein.",
  "ai.exchangeSubmitted": "Exchange submit ho gaya!\n\n- Order: {orderId}\n- Items: {items}\n- Purana item milne ke 3 business days me naya item bhej diya jayega\n\nItem bilkul nayi condition me, poori packaging ke saath wapas bhejein.",
  "ai.orderNotFoundShort": "Order {orderId} nahi mila, order ID check karein.",

  // Suggestions
  "sug.refund": "Mujhe refund chahiye",
  "sug.exchange": "Mujhe exchange chahiye",
  "sug.refundActionTpl": "Mujhe {orderId} ka refund chahiye",
  "sug.exchangeActionTpl": "Mujhe {orderId} exchange karna hai",
  "sug.delivery": "Kab pahunchega?",
  "sug.deliveryActionTpl": "{orderId} kab pahunchega?",
  "sug.eta": "Kab ship hoga?",
  "sug.etaActionTpl": "{orderId} kab ship hoga?",
  "sug.cancel": "Mujhe order cancel karna hai",
  "sug.cancelActionTpl": "Mujhe order {orderId} cancel karna hai",
  "sug.status": "Latest status kya hai?",
  "sug.statusActionTpl": "{orderId} ka latest status kya hai?",
  "sug.lookupOther": "Dusra order dekhein",
  "sug.faqGeneral": "After-sales policies",
  "sug.refundApply": "Refund ke liye apply karein",
  "sug.timelineRefund": "Refund me kitna time lagega?",
  "sug.address": "Return address kya hai?",
  "sug.timelineExchange": "Exchange me kitna time lagega?",
  "sug.lookupMyOrders": "Mere orders dekhein",
};

const TABLES: Record<string, Record<string, string>> = { en: EN, hi: HI, hinglish: HINGLISH };

/** Translate `key` to target locale, with optional `{name}` template params. */
export function t(locale: Locale, key: string, params?: Record<string, string | number>): string {
  let str = TABLES[locale]?.[key] ?? TABLES.en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.split(`{${k}}`).join(String(v));
    }
  }
  return str;
}

/** Get the localized status label. */
export function statusLabel(locale: Locale, status: string): string {
  return t(locale, `status.${status}`);
}
