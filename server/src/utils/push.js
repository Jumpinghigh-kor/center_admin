const admin = require('firebase-admin');

if (!admin.apps.length) {
  try {
    const cred = process.env.GOOGLE_APPLICATION_CREDENTIALS
      ? require(process.env.GOOGLE_APPLICATION_CREDENTIALS)
      : {
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : null,
        };
    
    if (!cred.projectId || !cred.clientEmail || !cred.privateKey) {
      console.error('[Push] Firebase credentials are missing or incomplete');
    } else {
      admin.initializeApp({ 
        credential: admin.credential.cert(cred),
        projectId: cred.projectId
      });
      console.log(`[Push] Firebase initialized with project: ${cred.projectId}`);
    }
  } catch (err) {
    console.error('[Push] Firebase initialization error:', err.message);
  }
}

async function sendPush(tokens, { title, body, data }) {
  if (!(tokens && tokens.length)) {
    return { successCount: 0, failureCount: 0, invalidTokens: [] };
  }

  // Firebase가 초기화되지 않은 경우
  if (!admin.apps.length) {
    console.error('[Push] Firebase Admin SDK is not initialized');
    return { successCount: 0, failureCount: tokens.length, invalidTokens: [] };
  }

  // sendMulticast가 404 오류를 반환하므로 개별 전송 방식 사용
  // 배치 크기를 줄여서 동시 연결 수 제한
  const batchSize = 100;
  let successCount = 0, failureCount = 0;
  const invalidTokens = [];
  
  const message = {
    notification: { title, body },
    data: data || {},
  };

  // 배치 단위로 처리하여 동시 연결 수 제한
  for (let i = 0; i < tokens.length; i += batchSize) {
    const batch = tokens.slice(i, i + batchSize);
    
    try {
      // 개별 전송을 병렬로 처리
      const promises = batch.map((token, idx) => 
        admin.messaging().send({
          token,
          ...message
        })
        .then(() => ({ success: true, tokenIndex: i + idx }))
        .catch(error => ({ 
          success: false, 
          error, 
          token,
          tokenIndex: i + idx
        }))
      );

      const results = await Promise.allSettled(promises);
      
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          const value = result.value;
          if (value.success === false) {
            failureCount++;
            const errorCode = value.error && value.error.code;
            if (errorCode === 'messaging/registration-token-not-registered' || 
                errorCode === 'messaging/invalid-registration-token') {
              invalidTokens.push(value.token);
            }
            // 심각한 오류만 로깅 (무효한 토큰은 너무 많을 수 있음)
            if (errorCode && errorCode !== 'messaging/registration-token-not-registered' && 
                errorCode !== 'messaging/invalid-registration-token') {
              console.warn('[Push] Failure', {
                tokenIndex: value.tokenIndex,
                code: errorCode,
                message: value.error && value.error.message
              });
            }
          } else {
            successCount++;
          }
        } else {
          failureCount++;
          console.warn('[Push] Promise rejected', {
            error: result.reason
          });
        }
      });

      if (i + batchSize < tokens.length) {
        // 다음 배치 전에 짧은 지연 (API rate limit 방지)
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (err) {
      console.error('[Push] Batch processing error:', err.message);
      failureCount += batch.length;
    }
  }
  
  console.log(`[Push] Completed. success=${successCount}, failure=${failureCount}, invalidTokens=${invalidTokens.length}`);
  return { successCount, failureCount, invalidTokens };
}

module.exports = { sendPush };