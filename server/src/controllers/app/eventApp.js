const db = require("../../../db");
const dayjs = require("dayjs");
const { createClient } = require("@supabase/supabase-js");


// Supabase 설정
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Supabase 클라이언트 생성
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 이벤트 목록 조회
exports.selectEventAppList = (req, res) => {
  const query = `
    SELECT
      event_app_id
      , title
      , use_yn
      , del_yn
      , DATE_FORMAT(reg_dt, '%Y-%m-%d %H:%i:%s') as reg_dt
      , reg_id
      , mod_dt
      , mod_id
      , (
          SELECT
            seai.navigation_path
          FROM  event_app_img seai
          WHERE seai.event_app_id = ea.event_app_id
          AND   seai.del_yn = 'N'
          AND   seai.event_img_type = 'BUTTON'
      ) AS navigation_path
    FROM      event_app ea
    WHERE		  del_yn = 'N'
    ORDER BY	event_app_id DESC
  `;

  db.query(query, (err, result) => {
    if (err) {
      res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

// 이벤트 이미지 목록 조회
exports.selectEventAppImgList = async (req, res) => {
  const { event_app_id } = req.body;

  const query = `
    SELECT
      eai.event_app_id
      , eai.file_id
      , eai.event_img_type
      , eai.navigation_path
      , eai.order_seq
      , cf.file_name
      , cf.file_path
      , cf.file_division
    FROM		  event_app_img eai
    LEFT JOIN	common_file cf ON eai.file_id = cf.file_id
    WHERE		  eai.event_app_id = ?
    AND			  eai.del_yn = 'N'
    ORDER BY	eai.order_seq ASC
  `;

  db.query(query, [event_app_id], async (err, result) => {
    if (err) {
      res.status(500).json(err);
      return;
    }
    
    try {
      // 각 이미지에 대해 Supabase Storage의 공개 URL 생성
      const processedResult = await Promise.all(
        result.map(async (item) => {
          // 이미지 타입에 따른 경로 설정
          let folderPath;
          if (item.event_img_type === 'CONTENT') {
            folderPath = 'content';
          } else if (item.event_img_type === 'BUTTON') {
            folderPath = 'button';
          } else {
            folderPath = 'other';
          }
          
          const filePath = `${folderPath}/${item.file_name}`;
          
          // Supabase Storage에서 공개 URL 생성
          const { data: publicURL } = supabase.storage
            .from('event')
            .getPublicUrl(filePath);
          
          return {
            ...item,
            file_path: publicURL.publicUrl
          };
        })
      );
      
      res.status(200).json({ result: processedResult });
    } catch (error) {
      console.error("이미지 URL 생성 오류:", error);
      res.status(500).json({ error: "이미지 URL 생성 중 오류가 발생했습니다." });
    }
  });
};

// 이벤트 등록
exports.insertEventApp = async (req, res) => {
  try {
    const { title, use_yn,reg_id, images, navigation_path } = req.body;

    const now = dayjs();
    const reg_dt = now.format("YYYYMMDDHHmmss");

    // 개별 연결을 가져와서 트랜잭션 시작
    db.getConnection((err, connection) => {
      if (err) {
        console.error("데이터베이스 연결 오류:", err);
        return res.status(500).json({ error: "데이터베이스 연결 중 오류가 발생했습니다." });
      }

      connection.beginTransaction(async (err) => {
        if (err) {
          console.error("트랜잭션 시작 오류:", err);
          connection.release();
          return res.status(500).json({ error: "트랜잭션 시작 중 오류가 발생했습니다." });
        }

        // 1. event_app 테이블에 먼저 삽입
        const insertEventAppQuery = `
          INSERT INTO event_app (
            title
            , use_yn
            , del_yn
            , reg_dt
            , reg_id
            , mod_dt
            , mod_id
          ) VALUES (
            ?
            , ?
            , ?
            , ?
            , ?
            , ?
            , ?
          )
        `;

        connection.query(
          insertEventAppQuery,
          [title, 'Y', 'N', reg_dt, reg_id, null, null],
          async (err, result) => {
            if (err) {
              console.error("이벤트 등록 오류:", err);
              return connection.rollback(() => {
                connection.release();
                res.status(500).json({ error: "이벤트 등록 중 오류가 발생했습니다." });
              });
            }

            const event_app_id = result.insertId;

            // 2. 이미지가 있는 경우 처리
            if (images && images.length > 0) {
              let completedInserts = 0;
              const totalInserts = images.length;

              for (let index = 0; index < images.length; index++) {
                const image = images[index];
                
                try {
                  // 2-1. Supabase Storage에 파일 업로드
                  const fileBuffer = Buffer.from(image.file_data, 'base64');
                  
                  // 파일명 생성: event_YYYYMMDDHHIISS마이크로초.jpg
                  const nowWithMicro = dayjs().format('YYYYMMDDHHmmss');
                  const microseconds = process.hrtime.bigint().toString().slice(-6);
                  const fileName = `event_${nowWithMicro}${microseconds}.jpg`;
                  
                  // 이미지 타입에 따른 경로 설정
                  let folderPath;
                  if (image.event_img_type === 'CONTENT') {
                    folderPath = 'content';
                  } else if (image.event_img_type === 'BUTTON') {
                    folderPath = 'button';
                  } else {
                    folderPath = 'other';
                  }
                  const filePath = `${folderPath}/${fileName}`;

                  const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('event')
                    .upload(filePath, fileBuffer, {
                      contentType: image.content_type || 'image/jpeg',
                      cacheControl: '3600',
                      upsert: false
                    });

                  if (uploadError) {
                    console.error("Supabase 업로드 오류:", uploadError);
                    return connection.rollback(() => {
                      connection.release();
                      res.status(500).json({ error: "이미지 업로드 중 오류가 발생했습니다." });
                    });
                  }

                  // 2-3. common_file 테이블에 파일 정보 삽입
                  const insertCommonFileQuery = `
                    INSERT INTO common_file (
                      file_name
                      , file_path
                      , file_division
                      , del_yn
                      , reg_dt
                      , reg_id
                      , mod_dt
                      , mod_id
                    ) VALUES (
                      ?
                      , ?
                      , ?
                      , ?
                      , ?
                      , ?
                      , ?
                      , ?
                    )
                  `;

                  connection.query(
                    insertCommonFileQuery,
                    [
                      fileName,
                      '/event',
                      'event',
                      'N',
                      reg_dt,
                      reg_id,
                      null,
                      null
                    ],
                    (err, fileResult) => {
                      if (err) {
                        console.error("파일 등록 오류:", err);
                        return connection.rollback(() => {
                          connection.release();
                          res.status(500).json({ error: "파일 등록 중 오류가 발생했습니다." });
                        });
                      }
                      
                      const file_id = fileResult.insertId;

                      // 2-4. event_app_img 테이블에 이미지 정보 삽입
                      const insertEventAppImgQuery = `
                        INSERT INTO event_app_img (
                          event_app_id
                          , file_id
                          , event_img_type
                          , navigation_path
                          , order_seq
                          , del_yn
                          , reg_dt
                          , reg_id
                          , mod_dt
                          , mod_id
                        ) VALUES (
                          ?
                          , ?
                          , ?
                          , ?
                          , ?
                          , ?
                          , ?
                          , ?
                          , ?
                          , ?
                        )
                      `;

                      connection.query(
                        insertEventAppImgQuery,
                        [
                          event_app_id,
                          file_id,
                          image.event_img_type,
                          image.event_img_type === 'BUTTON' ? navigation_path : null,
                          image.order_seq,
                          'N',
                          reg_dt,
                          reg_id,
                          null,
                          null
                        ],
                        (err, imgResult) => {
                          if (err) {
                            console.error("이벤트 이미지 등록 오류:", err);
                            return connection.rollback(() => {
                              connection.release();
                              res.status(500).json({ error: "이벤트 이미지 등록 중 오류가 발생했습니다." });
                            });
                          }

                          completedInserts++;

                          // 모든 이미지 처리가 완료되면 트랜잭션 커밋
                          if (completedInserts === totalInserts) {
                            connection.commit((err) => {
                              if (err) {
                                console.error("트랜잭션 커밋 오류:", err);
                                return connection.rollback(() => {
                                  connection.release();
                                  res.status(500).json({ error: "트랜잭션 커밋 중 오류가 발생했습니다." });
                                });
                              }

                              connection.release();
                              res.status(200).json({
                                message: "이벤트가 성공적으로 등록되었습니다.",
                                event_app_id: event_app_id
                              });
                            });
                          }
                        }
                      );
                    }
                  );
                } catch (uploadError) {
                  console.error("이미지 업로드 처리 오류:", uploadError);
                  return connection.rollback(() => {
                    connection.release();
                    res.status(500).json({ error: "이미지 업로드 처리 중 오류가 발생했습니다." });
                  });
                }
              }
            } else {
              // 이미지가 없는 경우 바로 커밋
              connection.commit((err) => {
                if (err) {
                  console.error("트랜잭션 커밋 오류:", err);
                  return connection.rollback(() => {
                    connection.release();
                    res.status(500).json({ error: "트랜잭션 커밋 중 오류가 발생했습니다." });
                  });
                }

                connection.release();
                res.status(200).json({
                  message: "이벤트가 성공적으로 등록되었습니다.",
                  event_app_id: event_app_id
                });
              });
            }
          }
        );
      });
    });
  } catch (error) {
    console.error("이벤트 등록 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

// 이벤트 삭제
exports.deleteEventApp = (req, res) => {
  const { event_app_id, mod_id } = req.body;

  const now = dayjs();
  const mod_dt = now.format("YYYYMMDDHHmmss");

  const query = `
    UPDATE event_app SET
      del_yn = 'Y'
      , mod_dt = ?
      , mod_id = ?
    WHERE event_app_id = ?
  `;

  db.query(query, [mod_dt, mod_id, event_app_id], (err, result) => {
    if (err) {
      res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

// 이벤트 수정
exports.updateEventApp = async (req, res) => {
  try {
    const { event_app_id, title, use_yn, mod_id, images, navigation_path } = req.body;

    const now = dayjs();
    const mod_dt = now.format("YYYYMMDDHHmmss");

    // 개별 연결을 가져와서 트랜잭션 시작
    db.getConnection((err, connection) => {
      if (err) {
        console.error("데이터베이스 연결 오류:", err);
        return res.status(500).json({ error: "데이터베이스 연결 중 오류가 발생했습니다." });
      }

      connection.beginTransaction(async (err) => {
        if (err) {
          console.error("트랜잭션 시작 오류:", err);
          connection.release();
          return res.status(500).json({ error: "트랜잭션 시작 중 오류가 발생했습니다." });
        }

        // 1. event_app 테이블 업데이트
        const updateEventAppQuery = `
          UPDATE event_app SET
            title = ?
            , use_yn = ?
            , mod_dt = ?
            , mod_id = ?
          WHERE event_app_id = ?
        `;

        connection.query(updateEventAppQuery, [title, use_yn, mod_dt, mod_id, event_app_id], async (err, result) => {
          if (err) {
            console.error("이벤트 수정 오류:", err);
            return connection.rollback(() => {
              connection.release();
              res.status(500).json({ error: "이벤트 수정 중 오류가 발생했습니다." });
            });
          }

          // 2. 새로운 이미지가 있는 경우에만 해당 타입의 기존 이미지를 삭제하고 새로 등록
          if (images && images.length > 0) {
            // 업로드할 이미지 타입들을 파악
            const uploadImageTypes = images.map(img => img.event_img_type);
            
            // 해당 타입의 기존 이미지만 삭제 처리
            const placeholders = uploadImageTypes.map(() => '?').join(',');
            const updateEventAppImgQuery = `
              UPDATE event_app_img SET
                del_yn = 'Y'
                , mod_dt = ?
                , mod_id = ?
              WHERE event_app_id = ?
              AND event_img_type IN (${placeholders})
            `;

            connection.query(updateEventAppImgQuery, [mod_dt, mod_id, event_app_id, ...uploadImageTypes], async (err, result) => {
              if (err) {
                console.error("기존 이미지 삭제 오류:", err);
                return connection.rollback(() => {
                  connection.release();
                  res.status(500).json({ error: "기존 이미지 삭제 중 오류가 발생했습니다." });
                });
              }

              // 3. 새로운 이미지 처리
              let completedInserts = 0;
              const totalInserts = images.length;

              for (let index = 0; index < images.length; index++) {
                const image = images[index];
                
                try {
                  // 3-1. Supabase Storage에 파일 업로드
                  const fileBuffer = Buffer.from(image.file_data, 'base64');
                  
                  // 파일명 생성: event_YYYYMMDDHHIISS마이크로초.jpg
                  const nowWithMicro = dayjs().format('YYYYMMDDHHmmss');
                  const microseconds = process.hrtime.bigint().toString().slice(-6);
                  const fileName = `event_${nowWithMicro}${microseconds}.jpg`;
                  
                  // 이미지 타입에 따른 경로 설정
                  let folderPath;
                  if (image.event_img_type === 'CONTENT') {
                    folderPath = 'content';
                  } else if (image.event_img_type === 'BUTTON') {
                    folderPath = 'button';
                  } else {
                    folderPath = 'other';
                  }
                  const filePath = `${folderPath}/${fileName}`;

                  const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('event')
                    .upload(filePath, fileBuffer, {
                      contentType: image.content_type || 'image/jpeg',
                      cacheControl: '3600',
                      upsert: false
                    });

                  if (uploadError) {
                    console.error("Supabase 업로드 오류:", uploadError);
                    return connection.rollback(() => {
                      connection.release();
                      res.status(500).json({ error: "이미지 업로드 중 오류가 발생했습니다." });
                    });
                  }

                  // 3-2. common_file 테이블에 파일 정보 삽입
                  const insertCommonFileQuery = `
                    INSERT INTO common_file (
                      file_name
                      , file_path
                      , file_division
                      , del_yn
                      , reg_dt
                      , reg_id
                      , mod_dt
                      , mod_id
                    ) VALUES (
                      ?
                      , ?
                      , ?
                      , ?
                      , ?
                      , ?
                      , ?
                      , ?
                    )
                  `;

                  connection.query(
                    insertCommonFileQuery,
                    [
                      fileName,
                      '/event',
                      'event',
                      'N',
                      mod_dt,
                      mod_id,
                      null,
                      null
                    ],
                    (err, fileResult) => {
                      if (err) {
                        console.error("파일 등록 오류:", err);
                        return connection.rollback(() => {
                          connection.release();
                          res.status(500).json({ error: "파일 등록 중 오류가 발생했습니다." });
                        });
                      }

                      const file_id = fileResult.insertId;

                      // 3-3. event_app_img 테이블에 새로운 이미지 정보 삽입
                      const insertEventAppImgQuery = `
                        INSERT INTO event_app_img (
                          event_app_id
                          , file_id
                          , event_img_type
                          , navigation_path
                          , order_seq
                          , del_yn
                          , reg_dt
                          , reg_id
                          , mod_dt
                          , mod_id
                        ) VALUES (
                          ?
                          , ?
                          , ?
                          , ?
                          , ?
                          , ?
                          , ?
                          , ?
                          , ?
                          , ?
                        )
                      `;

                      connection.query(
                        insertEventAppImgQuery,
                        [
                          event_app_id,
                          file_id,
                          image.event_img_type,
                          image.event_img_type === 'BUTTON' ? navigation_path : null,
                          image.order_seq,
                          'N',
                          mod_dt,
                          mod_id,
                          null,
                          null
                        ],
                        (err, imgResult) => {
                          if (err) {
                            console.error("이벤트 이미지 등록 오류:", err);
                            return connection.rollback(() => {
                              connection.release();
                              res.status(500).json({ error: "이벤트 이미지 등록 중 오류가 발생했습니다." });
                            });
                          }

                          completedInserts++;

                          // 모든 이미지 처리가 완료되면 트랜잭션 커밋
                          if (completedInserts === totalInserts) {
                            connection.commit((err) => {
                              if (err) {
                                console.error("트랜잭션 커밋 오류:", err);
                                return connection.rollback(() => {
                                  connection.release();
                                  res.status(500).json({ error: "트랜잭션 커밋 중 오류가 발생했습니다." });
                                });
                              }

                              connection.release();
                              res.status(200).json({
                                message: "이벤트가 성공적으로 수정되었습니다.",
                                event_app_id: event_app_id
                              });
                            });
                          }
                        }
                      );
                    }
                  );
                } catch (uploadError) {
                  console.error("이미지 업로드 처리 오류:", uploadError);
                  return connection.rollback(() => {
                    connection.release();
                    res.status(500).json({ error: "이미지 업로드 처리 중 오류가 발생했습니다." });
                  });
                }
              }
            });
          } else {
            // 새로운 이미지가 없는 경우, navigation_path만 업데이트
            if (navigation_path !== undefined && navigation_path !== null) {
              const updateNavigationQuery = `
                UPDATE event_app_img SET
                  navigation_path = ?
                  , mod_dt = ?
                  , mod_id = ?
                WHERE event_app_id = ?
                AND event_img_type = 'BUTTON'
                AND del_yn = 'N'
              `;

              connection.query(updateNavigationQuery, [navigation_path, mod_dt, mod_id, event_app_id], (err, result) => {
                if (err) {
                  console.error("네비게이션 경로 업데이트 오류:", err);
                  return connection.rollback(() => {
                    connection.release();
                    res.status(500).json({ error: "네비게이션 경로 업데이트 중 오류가 발생했습니다." });
                  });
                }

                connection.commit((err) => {
                  if (err) {
                    console.error("트랜잭션 커밋 오류:", err);
                    return connection.rollback(() => {
                      connection.release();
                      res.status(500).json({ error: "트랜잭션 커밋 중 오류가 발생했습니다." });
                    });
                  }

                  connection.release();
                  res.status(200).json({
                    message: "이벤트가 성공적으로 수정되었습니다.",
                    event_app_id: event_app_id
                  });
                });
              });
            } else {
              // navigation_path가 없는 경우 바로 커밋
              connection.commit((err) => {
                if (err) {
                  console.error("트랜잭션 커밋 오류:", err);
                  return connection.rollback(() => {
                    connection.release();
                    res.status(500).json({ error: "트랜잭션 커밋 중 오류가 발생했습니다." });
                  });
                }

                connection.release();
                res.status(200).json({
                  message: "이벤트가 성공적으로 수정되었습니다.",
                  event_app_id: event_app_id
                });
              });
            }
          }
        });
      });
    });
  } catch (error) {
    console.error("이벤트 수정 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

