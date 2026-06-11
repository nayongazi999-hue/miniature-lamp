// auto_upload.js v3 — Quota-safe version
// Level 1: Verb ১-২০০, Noun ১-৪০০ (প্রতিদিন ১০ verb + ২০ noun)
// Level 2: Verb ২০১+, Noun ৪০১+ (প্রতিদিন ১০ verb + ২০ noun)

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const fs = require('fs');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const wordsData = JSON.parse(fs.readFileSync('./words_data.json', 'utf8'));
const ALL_VERBS = wordsData.verbs;
const ALL_NOUNS = wordsData.nouns;

const L1_VERB_LIMIT = 200;
const L1_NOUN_LIMIT = 400;

// Bangladesh time (UTC+6)
function getTodayBD() {
  const now = new Date();
  const bdOffset = 6 * 60;
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const bd = new Date(utc + bdOffset * 60000);
  const y = bd.getFullYear();
  const m = String(bd.getMonth() + 1).padStart(2, '0');
  const d = String(bd.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function autoUpload(collection, level) {
  const today = getTodayBD();
  console.log(`\n📅 তারিখ: ${today} | Collection: ${collection} | Level: ${level}`);

  // counter document চেক (মাত্র ১টি read)
  const counterRef = db.collection('upload_counters').doc(collection);
  const counterDoc = await counterRef.get();

  // আজকে আগে আপলোড হয়েছে কিনা চেক
  if (counterDoc.exists && counterDoc.data().lastDate === today) {
    console.log(`✅ আজকের শব্দ ইতোমধ্যে আছে, স্কিপ।`);
    return;
  }

  const dayIndex = counterDoc.exists ? counterDoc.data().dayIndex : 0;

  // Level অনুযায়ী pool নির্ধারণ
  let verbPool, nounPool;
  if (level === 1) {
    verbPool = ALL_VERBS.slice(0, L1_VERB_LIMIT);
    nounPool = ALL_NOUNS.slice(0, L1_NOUN_LIMIT);
  } else {
    verbPool = ALL_VERBS.slice(L1_VERB_LIMIT);
    nounPool = ALL_NOUNS.slice(L1_NOUN_LIMIT);
  }

  const vStart = dayIndex * 10;
  const nStart = dayIndex * 20;

  if (vStart >= verbPool.length || nStart >= nounPool.length) {
    console.log(`⚠️ শব্দ শেষ! আরো শব্দ যোগ করুন words_data.json এ।`);
    return;
  }

  const batch = db.batch();
  const now = Timestamp.now();

  // ১০টি verb
  for (let i = 0; i < 10; i++) {
    if (vStart + i < verbPool.length) {
      const ref = db.collection(collection).doc();
      batch.set(ref, {
        ...verbPool[vStart + i],
        type: 'verb',
        taskDate: today,
        timestamp: now,
        autoUploaded: true
      });
    }
  }

  // ২০টি noun
  for (let j = 0; j < 20; j++) {
    if (nStart + j < nounPool.length) {
      const ref = db.collection(collection).doc();
      batch.set(ref, {
        ...nounPool[nStart + j],
        type: 'noun',
        taskDate: today,
        timestamp: now,
        autoUploaded: true
      });
    }
  }

  // counter আপডেট (batch এর মধ্যেই)
  batch.set(counterRef, {
    dayIndex: dayIndex + 1,
    lastDate: today
  });

  await batch.commit();
  console.log(`🎉 ${today}: ${Math.min(10, verbPool.length - vStart)}টি verb + ${Math.min(20, nounPool.length - nStart)}টি noun আপলোড হয়েছে!`);
  console.log(`📊 দিন: ${dayIndex + 1} | Verb: ${vStart}-${vStart+9} | Noun: ${nStart}-${nStart+19}`);
}

async function main() {
  try {
    await autoUpload('daily_tasks', 1);       // Level 1
    await autoUpload('daily_tasks_level2', 2); // Level 2
    console.log('\n✅ সম্পন্ন!');
    process.exit(0);
  } catch (err) {
    console.error('❌ সমস্যা:', err);
    process.exit(1);
  }
}

main();
