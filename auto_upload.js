// auto_upload.js — GitHub Actions এ চলবে, প্রতিরাত ১২টায়
// Firestore-এ আজকের তারিখে সিরিয়াল অনুযায়ী ১০টি verb + ১০টি noun আপলোড করে

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const fs = require('fs');

// Firebase Service Account (GitHub Secret থেকে আসবে)
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// শব্দ ডেটা লোড
const wordsData = JSON.parse(fs.readFileSync('./words_data.json', 'utf8'));
const ALL_VERBS = wordsData.verbs;
const ALL_NOUNS = wordsData.nouns;

// আজকের তারিখ (Bangladesh time = UTC+6)
function getTodayBD() {
  const now = new Date();
  const bdOffset = 6 * 60; // মিনিটে
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const bd = new Date(utc + bdOffset * 60000);
  const y = bd.getFullYear();
  const m = String(bd.getMonth() + 1).padStart(2, '0');
  const d = String(bd.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function autoUpload(collection) {
  const today = getTodayBD();
  console.log(`📅 তারিখ: ${today} | Collection: ${collection}`);

  // আগে থেকে আপলোড আছে কিনা চেক
  const existing = await db.collection(collection)
    .where('taskDate', '==', today)
    .limit(1)
    .get();

  if (!existing.empty) {
    console.log(`✅ ${collection}: আজকের শব্দ ইতোমধ্যে আছে, স্কিপ।`);
    return;
  }

  // কতদিন আপলোড হয়েছে গণনা
  const allDocs = await db.collection(collection).get();
  const uploadedDates = new Set();
  allDocs.forEach(doc => {
    const d = doc.data().taskDate;
    if (d) uploadedDates.add(d);
  });
  const dayIndex = uploadedDates.size; // ০ থেকে শুরু

  const vStart = dayIndex * 10;
  const nStart = dayIndex * 10;

  if (vStart >= ALL_VERBS.length || nStart >= ALL_NOUNS.length) {
    console.log(`⚠️ শব্দ শেষ! আরো শব্দ যোগ করুন words_data.json এ।`);
    return;
  }

  const batch = db.batch();
  const now = Timestamp.now();

  // ১০টি verb
  for (let i = 0; i < 10; i++) {
    if (vStart + i < ALL_VERBS.length) {
      const ref = db.collection(collection).doc();
      batch.set(ref, {
        ...ALL_VERBS[vStart + i],
        type: 'verb',
        taskDate: today,
        timestamp: now,
        autoUploaded: true
      });
    }
  }

  // ১০টি noun
  for (let j = 0; j < 10; j++) {
    if (nStart + j < ALL_NOUNS.length) {
      const ref = db.collection(collection).doc();
      batch.set(ref, {
        ...ALL_NOUNS[nStart + j],
        type: 'noun',
        taskDate: today,
        timestamp: now,
        autoUploaded: true
      });
    }
  }

  await batch.commit();
  console.log(`🎉 ${collection}: ${today} তারিখে ${Math.min(10, ALL_VERBS.length - vStart)}টি verb + ${Math.min(10, ALL_NOUNS.length - nStart)}টি noun আপলোড হয়েছে!`);
  console.log(`📊 দিন নম্বর: ${dayIndex + 1} | Verb index: ${vStart}-${vStart+9} | Noun index: ${nStart}-${nStart+9}`);
}

async function main() {
  try {
    // ব্যাচ ১ এবং ব্যাচ ২ দুটোতেই আপলোড
    await autoUpload('daily_tasks');
    await autoUpload('daily_tasks_level2');
    console.log('✅ সম্পন্ন!');
    process.exit(0);
  } catch (err) {
    console.error('❌ সমস্যা:', err);
    process.exit(1);
  }
}

main();
