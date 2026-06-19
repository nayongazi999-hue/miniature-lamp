// auto_upload.js v5 — 30-day class system
// লেভেল ১: ক্লাস ১-৩০ | লেভেল ২: ক্লাস ৩১-৬০
// প্রতি ক্লাসে: ৭টি ক্রিয়া + ১৩টি নাউন = ২০টি শব্দ

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const fs = require('fs');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const wordsData = JSON.parse(fs.readFileSync('./words_data.json', 'utf8'));
const ALL_CLASSES = wordsData.classes;

// Bangladesh time (UTC+6)
function getTodayBD() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const bd = new Date(utc + 6 * 60 * 60000);
  const y = bd.getFullYear();
  const m = String(bd.getMonth() + 1).padStart(2, '0');
  const d = String(bd.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function autoUpload(collection, levelClasses) {
  const today = getTodayBD();
  console.log(`\n📅 তারিখ: ${today} | Collection: ${collection}`);

  const counterRef = db.collection('upload_counters').doc(collection);
  const counterDoc = await counterRef.get();

  if (counterDoc.exists && counterDoc.data().lastDate === today) {
    console.log(`✅ আজকের শব্দ ইতোমধ্যে আছে, স্কিপ।`);
    return;
  }

  const dayIndex = counterDoc.exists ? counterDoc.data().dayIndex : 0;
  const classIdx = dayIndex % levelClasses.length; // ৩০ দিন পর আবার শুরু
  const classData = levelClasses[classIdx];

  console.log(`📚 ক্লাস নম্বর: ${classData.classNo} (দিন: ${dayIndex + 1})`);

  const batch = db.batch();
  const now = Timestamp.now();

  for (const word of classData.verbs) {
    const ref = db.collection(collection).doc();
    batch.set(ref, {
      arabic: word.arabic,
      pronunciation: word.pronunciation,
      meaning: word.meaning,
      type: 'verb',
      classNo: classData.classNo,
      level: classData.level,
      taskDate: today,
      timestamp: now,
      autoUploaded: true
    });
  }

  for (const word of classData.nouns) {
    const ref = db.collection(collection).doc();
    batch.set(ref, {
      arabic: word.arabic,
      pronunciation: word.pronunciation,
      meaning: word.meaning,
      type: 'noun',
      classNo: classData.classNo,
      level: classData.level,
      taskDate: today,
      timestamp: now,
      autoUploaded: true
    });
  }

  batch.set(counterRef, {
    dayIndex: dayIndex + 1,
    lastDate: today,
    lastClassNo: classData.classNo
  });

  await batch.commit();
  console.log(`🎉 ক্লাস ${classData.classNo}: ${classData.verbs.length}টি ক্রিয়া + ${classData.nouns.length}টি নাউন আপলোড!`);
}

async function main() {
  try {
    const level1 = ALL_CLASSES.filter(c => c.level === 1); // ক্লাস ১-৩০
    const level2 = ALL_CLASSES.filter(c => c.level === 2); // ক্লাস ৩১-৬০

    await autoUpload('daily_tasks', level1);
    await autoUpload('daily_tasks_level2', level2);

    console.log('\n✅ সম্পন্ন!');
    process.exit(0);
  } catch (err) {
    console.error('❌ সমস্যা:', err);
    process.exit(1);
  }
}

main();
