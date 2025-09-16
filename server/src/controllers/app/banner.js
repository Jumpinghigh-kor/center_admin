const db = require("../../../db");
const dayjs = require("dayjs");
const { createClient } = require("@supabase/supabase-js");
const path = require("path");

// Supabase 설정
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Supabase 클라이언트 생성
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 배너 목록 조회
exports.selectBannerAppList = (req, res) => {
  const { bannerLocate, bannerType, startDate, endDate, useYn } = req.body;

  let query = `
    SELECT
      cf.file_id
      , cf.file_name
      , cf.file_path
      , cf.file_division
      , ba.banner_app_id
      , ba.banner_locate
      , ba.banner_type
      , ba.navigation_path
      , DATE_FORMAT(ba.start_dt, '%Y-%m-%d %H:%i:%s') as start_dt
      , DATE_FORMAT(ba.end_dt, '%Y-%m-%d %H:%i:%s') as end_dt
      , ba.event_app_id
      , ba.use_yn
      , ba.del_yn
      , ba.order_seq
      , ba.title
      , ba.content
      , DATE_FORMAT(ba.reg_dt, '%Y-%m-%d %H:%i:%s') as reg_dt
      , ba.reg_id
    FROM        banner_app ba
    LEFT JOIN   common_file cf ON ba.file_id = cf.file_id
    WHERE       ba.del_yn = 'N'
  `;

  const params = [];

  // 검색 조건 추가
  if (bannerLocate && bannerLocate !== '') {
    query += ` AND ba.banner_locate = ?`;
    params.push(bannerLocate);
  }

  if (bannerType && bannerType !== '') {
    query += ` AND ba.banner_type = ?`;
    params.push(bannerType);
  }

  if (startDate && startDate !== '') {
    query += ` AND ba.start_dt >= ?`;
    params.push(startDate.replace(/-/g, ''));
  }

  if (endDate && endDate !== '') {
    query += ` AND ba.end_dt <= ?`;
    params.push(endDate.replace(/-/g, ''));
  }

  if (useYn && useYn !== '') {
    query += ` AND ba.use_yn = ?`;
    params.push(useYn);
  }

  query += ` ORDER BY ba.banner_app_id DESC`;

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("배너 목록 조회 오류:", err);
      return res
        .status(500)
        .json({ error: "배너 목록을 조회하는 도중 오류가 발생했습니다." });
    }

    // 결과 포맷팅
    const banners = results.map((banner) => {
      // Supabase URL 구성
      let imageUrl = null;
      if (banner.file_name) {
        imageUrl = supabase.storage
          .from("banner")
          .getPublicUrl(`banner/${banner.file_name}`).data.publicUrl;
      }

      return {
        bannerAppId: banner.banner_app_id,
        bannerLocate: banner.banner_locate,
        navigationPath: banner.navigation_path,
        eventAppId: banner.event_app_id,
        bannerType: banner.banner_type,
        title: banner.title,
        content: banner.content,
        fileId: banner.file_id,
        fileName: banner.file_name,
        filePath: banner.file_path,
        imageUrl: imageUrl,
        startDate: banner.start_dt,
        endDate: banner.end_dt,
        regDate: banner.reg_dt,
        regId: banner.reg_id,
        useYn: banner.use_yn,
        delYn: banner.del_yn,
        orderSeq: banner.order_seq,
      };
    });

    res.status(200).json(banners);
  });
};

// 배너 상세 조회
exports.selectBannerAppDetail = (req, res) => {
  const { banner_app_id } = req.body;
  
  const query = `
    SELECT
      cf.file_id
      , cf.file_name
      , cf.file_path
      , cf.file_division
      , ba.banner_app_id
      , ba.banner_locate
      , ba.banner_type
      , ba.navigation_path
      , DATE_FORMAT(ba.start_dt, '%Y-%m-%d %H:%i:%s') as start_dt
      , DATE_FORMAT(ba.end_dt, '%Y-%m-%d %H:%i:%s') as end_dt
      , ba.event_app_id
      , ba.use_yn
      , ba.del_yn
      , ba.order_seq
      , ba.title
      , ba.content
      , DATE_FORMAT(ba.reg_dt, '%Y-%m-%d %H:%i:%s') as reg_dt
      , ba.reg_id
    FROM        banner_app ba
    LEFT JOIN   common_file cf ON ba.file_id = cf.file_id
    WHERE       ba.banner_app_id = ?
  `;

  db.query(query, [banner_app_id], (err, results) => {
    if (err) {
      console.error("배너 상세 조회 오류:", err);
      return res
        .status(500)
        .json({ error: "배너를 조회하는 도중 오류가 발생했습니다." });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "해당 배너를 찾을 수 없습니다." });
    }

    const banner = results[0];
    // Supabase URL 구성
    let imageUrl = null;
    if (banner.file_name) {
      imageUrl = supabase.storage
        .from("banner")
        .getPublicUrl(`banner/${banner.file_name}`).data.publicUrl;
    }

    // 결과에 imageUrl 추가
    const bannerWithImageUrl = {
      ...banner,
      image_url: imageUrl
    };

    res.status(200).json({ result: [bannerWithImageUrl] });
  });
};

// 배너 등록
exports.insertBannerApp = async (req, res) => {
  try {
    const {
      eventAppId,
      bannerLocate,
      bannerType,
      navigationPath,
      title,
      content,
      startDate,
      endDate,
      orderSeq,
      useYn,
      delYn,
      userId,
    } = req.body;

    // 현재 날짜 형식화
    const now = dayjs();
    const reg_dt = now.format("YYYYMMDDHHmmss");
    const mod_dt = reg_dt;
    // 밀리초 추가 (현재 시간의 밀리초 부분)
    const timestamp = Date.now() % 1000;

    // 파일이 제공되었는지 확인
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "배너 이미지는 필수입니다." });
    }

    // 이미지 파일 검색 (fieldname이 'image'인 파일)
    const imageFile = req.files.find((file) => file.fieldname === "image");
    if (!imageFile) {
      return res.status(400).json({ error: "배너 이미지가 필요합니다." });
    }

    // 파일 이름 생성 (banner_원본파일명_timestamp.확장자)
    const originalFilename = path.parse(imageFile.originalname);
    const fileExtension = originalFilename.ext;
    const newFilename = `banner_${originalFilename.name}_${reg_dt}${timestamp}${fileExtension}`;

    // Supabase에 이미지 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("banner") // 버킷 이름 수정
      .upload(`banner/${newFilename}`, imageFile.buffer, {
        contentType: imageFile.mimetype,
      });

    if (uploadError) {
      console.error("이미지 업로드 오류:", uploadError);
      return res
        .status(500)
        .json({ error: "이미지 업로드 중 오류가 발생했습니다." });
    }

    // common_file 테이블에 파일 정보 등록
    const fileInsertQuery = `
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

    db.query(
      fileInsertQuery,
      [
        newFilename,
        "/banner",
        "banner",
        "N",
        reg_dt,
        userId || null,
        null, // mod_dt
        null, // mod_id
      ],
      (fileErr, fileResult) => {
        if (fileErr) {
          console.error("파일 정보 등록 오류:", fileErr);
          return res
            .status(500)
            .json({ error: "파일 정보 등록 중 오류가 발생했습니다." });
        }

        // 등록된 파일의 ID 가져오기
        const file_id = fileResult.insertId;

        // banner_app 테이블에 배너 정보 등록
        const bannerInsertQuery = `
          INSERT INTO banner_app (
            file_id
            , event_app_id
            , banner_locate
            , banner_type
            , navigation_path
            , title
            , content
            , start_dt
            , end_dt
            , use_yn
            , del_yn
            , order_seq
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
            , ?
            , ?
            , ?
            , ?
            , ?
            , ?
          )
        `;

        db.query(
          bannerInsertQuery,
          [
            file_id,
            eventAppId,
            bannerLocate,
            bannerType,
            navigationPath,
            title,
            content,
            startDate,
            endDate,
            useYn || "Y",
            "N",
            orderSeq || null,
            reg_dt,
            userId || null,
            null,
            null,
          ],
          (bannerErr, bannerResult) => {
            if (bannerErr) {
              console.error("배너 등록 오류:", bannerErr);
              return res
                .status(500)
                .json({ error: "배너 등록 중 오류가 발생했습니다." });
            }

            // Supabase 공개 URL 구성
            const imageUrl = supabase.storage
              .from("banner")
              .getPublicUrl(`banner/${newFilename}`).data.publicUrl;

            res.status(201).json({
              id: bannerResult.insertId,
              file_id: file_id,
              file_name: newFilename,
              imageUrl: imageUrl,
              message: "배너가 성공적으로 등록되었습니다.",
            });
          }
        );
      }
    );
  } catch (error) {
    console.error("배너 등록 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

// 배너 수정
exports.updateBannerApp = async (req, res) => {
  try {
    const {
      bannerAppId,
      eventAppId,
      bannerLocate,
      bannerType,
      navigationPath,
      title,
      content,
      startDate,
      endDate,
      orderSeq,
      useYn,
      userId,
    } = req.body;

    console.log("req.body:", req.body);
    console.log("req.files:", req.files);

    if (!bannerAppId) {
      return res.status(400).json({ error: "배너 ID는 필수입니다." });
    }

    // 현재 날짜 형식화
    const now = dayjs();
    const mod_dt = now.format("YYYYMMDDHHmmss");
    // 밀리초 추가 (현재 시간의 밀리초 부분)
    const timestamp = Date.now() % 1000;

    // 기존 배너 정보 조회
    const bannerQuery = `
      SELECT
        ba.file_id,
        cf.file_name
      FROM      banner_app ba
      LEFT JOIN common_file cf ON ba.file_id = cf.file_id
      WHERE     ba.banner_app_id = ?
    `;

    db.query(bannerQuery, [bannerAppId], async (err, results) => {
      if (err) {
        console.error("배너 조회 오류:", err);
        return res
          .status(500)
          .json({ error: "배너를 조회하는 도중 오류가 발생했습니다." });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: "해당 배너를 찾을 수 없습니다." });
      }

      const banner = results[0];
      let file_id = banner.file_id;
      let newFilename = null;

      // 새 이미지 파일이 제공된 경우 처리
      if (req.files && req.files.length > 0) {
        // 이미지 파일 검색 (fieldname이 'image'인 파일)
        const imageFile = req.files.find((file) => file.fieldname === "image");
        if (imageFile) {
          // 파일 이름 생성 (banner_원본파일명_timestamp.확장자)
          const originalFilename = path.parse(imageFile.originalname);
          const fileExtension = originalFilename.ext;
          newFilename = `banner_${originalFilename.name}_${mod_dt}${timestamp}${fileExtension}`;

          // Supabase에 이미지 업로드
          const { data: uploadData, error: uploadError } =
            await supabase.storage
              .from("banner")
              .upload(`banner/${newFilename}`, imageFile.buffer, {
                contentType: imageFile.mimetype,
                upsert: false,
              });

          if (uploadError) {
            console.error("이미지 업로드 오류:", uploadError);
            return res
              .status(500)
              .json({ error: "이미지 업로드 중 오류가 발생했습니다." });
          }

          // common_file 테이블 업데이트
          const updateFileQuery = `
            UPDATE common_file SET 
              file_name = ?
              , file_path = ?
              , file_division = ?
              , mod_dt = ?
              , mod_id = ?
            WHERE file_id = ?
          `;

          db.query(
            updateFileQuery,
            [newFilename, "/banner", "banner", mod_dt, userId || null, file_id],
            (fileErr) => {
              if (fileErr) {
                console.error("파일 정보 업데이트 오류:", fileErr);
                return res.status(500).json({
                  error: "파일 정보 업데이트 중 오류가 발생했습니다.",
                });
              }

              // 기존 Supabase 이미지 삭제 (있는 경우)
              if (banner.file_name) {
                supabase.storage
                  .from("banner")
                  .remove([`banner/${banner.file_name}`])
                  .then(({ error }) => {
                    if (error) {
                      console.error("기존 이미지 삭제 오류:", error);
                    }
                  });
              }

              // banner_app 테이블 업데이트
              const bannerUpdateQuery = `
                UPDATE banner_app SET 
                  event_app_id = ?
                  , file_id = ?
                  , banner_locate = ?
                  , banner_type = ?
                  , navigation_path = ?
                  , title = ?
                  , content = ?
                  , start_dt = ?
                  , end_dt = ?
                  , use_yn = ?
                  , order_seq = ?
                  , mod_dt = ?
                  , mod_id = ?
                WHERE banner_app_id = ?
              `;

              db.query(
                bannerUpdateQuery,
                [
                  eventAppId,
                  file_id,
                  bannerLocate,
                  bannerType,
                  navigationPath,
                  title,
                  content,
                  startDate,
                  endDate,
                  useYn || "Y",
                  orderSeq || null,
                  mod_dt,
                  userId || null,
                  bannerAppId,
                ],
                (bannerErr) => {
                  if (bannerErr) {
                    console.error("배너 업데이트 오류:", bannerErr);
                    return res
                      .status(500)
                      .json({ error: "배너 업데이트 중 오류가 발생했습니다." });
                  }

                  // Supabase 공개 URL 구성 (이미지가 있는 경우)
                  let imageUrl = null;
                  if (newFilename) {
                    imageUrl = supabase.storage
                      .from("banner")
                      .getPublicUrl(`banner/${newFilename}`).data.publicUrl;
                  }

                  res.status(200).json({
                    bannerAppId: bannerAppId,
                    file_id: file_id,
                    file_name: newFilename,
                    imageUrl: imageUrl,
                    message: "배너가 성공적으로 업데이트되었습니다.",
                  });
                }
              );
            }
          );
        }
      }

      // 이미지가 없는 경우에만 배너 정보 업데이트
      if (!req.files || req.files.length === 0) {
        const bannerUpdateQuery = `
          UPDATE banner_app SET 
            event_app_id = ?
            , banner_locate = ?
            , banner_type = ?
            , navigation_path = ?
            , title = ?
            , content = ?
            , start_dt = ?
            , end_dt = ?
            , use_yn = ?
            , order_seq = ?
            , mod_dt = ?
            , mod_id = ?
          WHERE banner_app_id = ?
        `;

        db.query(
          bannerUpdateQuery,
          [
            eventAppId,
            bannerLocate,
            bannerType,
            navigationPath,
            title,
            content,
            startDate,
            endDate,
            useYn || "Y",
            orderSeq || null,
            mod_dt,
            userId || null,
            bannerAppId,
          ],
          (bannerErr) => {
            if (bannerErr) {
              console.error("배너 업데이트 오류:", bannerErr);
              return res
                .status(500)
                .json({ error: "배너 업데이트 중 오류가 발생했습니다." });
            }

            res.status(200).json({
              bannerAppId: bannerAppId,
              message: "배너가 성공적으로 업데이트되었습니다.",
            });
          }
        );
      }
    });
  } catch (error) {
    console.error("배너 수정 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

// 배너 일괄 삭제
exports.batchDeleteBannerApp = (req, res) => {
  try {
    const { bannerAppIds, userId } = req.body;

    if (
      !bannerAppIds ||
      !Array.isArray(bannerAppIds) ||
      bannerAppIds.length === 0
    ) {
      return res.status(400).json({ error: "삭제할 배너 ID가 필요합니다." });
    }

    // 현재 날짜 형식화
    const now = dayjs();
    const mod_dt = now.format("YYYYMMDDHHmmss");

    // banner_app 테이블에서 여러 배너를 일괄 삭제
    const bannerDeleteQuery = `
      UPDATE banner_app SET
        del_yn = 'Y'
        , mod_dt = ?
        , mod_id = ?
      WHERE banner_app_id IN (?)
    `;

    db.query(
      bannerDeleteQuery,
      [mod_dt, userId || null, bannerAppIds],
      (err, result) => {
        if (err) {
          console.error("배너 일괄 삭제 오류:", err);
          return res
            .status(500)
            .json({ error: "배너 일괄 삭제 중 오류가 발생했습니다." });
        }

        res.status(200).json({
          message: "배너가 성공적으로 삭제되었습니다.",
        });
      }
    );
  } catch (error) {
    console.error("배너 일괄 삭제 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};
