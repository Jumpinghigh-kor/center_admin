const admin = require('firebase-admin');

if (!admin.apps.length) {
  const cred = process.env.GOOGLE_APPLICATION_CREDENTIALS
    ? require(process.env.GOOGLE_APPLICATION_CREDENTIALS)
    : {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      };
  admin.initializeApp({ credential: admin.credential.cert(cred) });
}

async function sendPush(tokens, { title, body, data }) {
  if (!(tokens && tokens.length)) {
    return { successCount: 0, failureCount: 0 };
  }
  const chunks = [];
  for (let i = 0; i < tokens.length; i += 500) chunks.push(tokens.slice(i, i + 500));
  let successCount = 0, failureCount = 0;
  for (const list of chunks) {
    const res = await admin.messaging().sendEachForMulticast({
      tokens: list,
      notification: { title, body },
      data: data || {},
    });
    successCount += res.successCount;
    failureCount += res.failureCount;
  }
  return { successCount, failureCount };
}

module.exports = { sendPush };