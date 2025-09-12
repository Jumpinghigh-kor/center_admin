const db = require("../../../db");
const dayjs = require("dayjs");

// 공지사항 목록 조회
exports.selectNoticesAppList = (req, res) => {
  const { title, notices_type, start_dt: startDt, end_dt: endDt, view_yn } = req.body;

  let processedStartDt = startDt;
  let processedEndDt = endDt;

  if (startDt) {
    processedStartDt = startDt.replace(/[-:T]/g, '')+'00';
  }
  if (endDt) {
    processedEndDt = endDt.replace(/[-:T]/g, '')+'00';
  }

  let addCondition = '';
  let params = [];

  if(title) {
    addCondition += `AND title LIKE CONCAT('%', ?, '%')`;
    params.push(title);
  }

  if(notices_type) {
    addCondition += `AND notices_type = ?`;
    params.push(notices_type);
  }

  if(processedStartDt) {
    addCondition += `AND start_dt <= ?`;
    params.push(processedStartDt);
  }

  if(processedEndDt) {
    addCondition += `AND end_dt >= ?`;
    params.push(processedEndDt);
  }

  if(view_yn) {
    addCondition += `AND view_yn = ?`;
    params.push(view_yn);
  }

  const query = `
    SELECT
      notices_app_id
      , notices_type
      , title
      , content
      , DATE_FORMAT(start_dt, '%Y-%m-%d %H:%i:%s') AS start_dt
      , DATE_FORMAT(end_dt, '%Y-%m-%d %H:%i:%s') AS end_dt
      , view_yn
      , del_yn
      , DATE_FORMAT(reg_dt, '%Y-%m-%d %H:%i:%s') AS reg_dt
    FROM      notices_app
    WHERE     del_yn = 'N'
    ${addCondition}
    ORDER BY  notices_app_id DESC
  `;

  db.query(query, params, (err, result) => {
    if (err) {
      res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

// 공지사항 상세 조회
exports.selectNoticesAppDetail = (req, res) => {
  const { notices_app_id } = req.body;

  const query = `
    SELECT
      notices_app_id
      , notices_type
      , title
      , content
      , start_dt
      , end_dt
      , view_yn
      , del_yn
      , DATE_FORMAT(reg_dt, '%Y-%m-%d %H:%i:%s') AS reg_dt
    FROM      notices_app
    WHERE     del_yn = 'N'
    AND       notices_app_id = ?
  `;

  db.query(query, [notices_app_id], (err, result) => {
    if (err) {
      res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

// 공지사항 등록
exports.insertNoticesApp = (req, res) => {
  try {
    const { notices_type, title, content, start_dt, end_dt, view_yn, userId } = req.body;

    // 현재 날짜 형식화
    const now = dayjs();
    const reg_dt = now.format("YYYYMMDDHHmmss");

    // notices_app 테이블에 공지사항 정보 등록
    const noticesInsertQuery = `
      INSERT INTO notices_app (
        notices_type
        , title
        , content
        , start_dt
        , end_dt
        , view_yn
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
        , ?
      )
    `;

    db.query(
      noticesInsertQuery,
      [
        notices_type,
        title,
        content,
        start_dt,
        end_dt,
        view_yn,
        "N",
        reg_dt,
        userId || null,
        null,
        null,
      ],
      (noticesErr, noticesResult) => {
        if (noticesErr) {
          console.error("공지사항 등록 오류:", noticesErr);
          return res
            .status(500)
            .json({ error: "공지사항 등록 중 오류가 발생했습니다." });
        }

        res.status(201).json({
          noticesAppId: noticesResult.insertId,
          message: "공지사항이 성공적으로 등록되었습니다.",
        });
      }
    );
  } catch (error) {
    console.error("공지사항 등록 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

// 공지사항 수정
exports.updateNoticesApp = (req, res) => {
  try {
    const { noticesAppId, notices_type, title, content, start_dt, end_dt, view_yn, del_yn, userId } = req.body;

    // 현재 날짜 형식화
    const now = dayjs();
    const mod_dt = now.format("YYYYMMDDHHmmss");

    // notices_app 테이블에 공지사항 정보 수정
    const noticesUpdateQuery = `
      UPDATE notices_app SET notices_type = ?
        , title = ?
        , content = ?
        , start_dt = ?
        , end_dt = ?
        , view_yn = ?
        , mod_dt = ?
        , mod_id = ?
      WHERE notices_app_id = ?
    `;

    db.query(
      noticesUpdateQuery,
      [
        notices_type,
        title,
        content,
        start_dt,
        end_dt,
        view_yn,
        mod_dt,
        userId || null,
        noticesAppId,
      ],
      (err, result) => {
        if (err) {
          console.error("공지사항 수정 오류:", err);
          return res
            .status(500)
            .json({ error: "공지사항 수정 중 오류가 발생했습니다." });
        }

        res.status(200).json({
          message: "공지사항이 성공적으로 수정되었습니다.",
        });
      }
    );
  } catch (error) {
    console.error("공지사항 수정 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

// 공지사항 일괄 삭제
exports.batchDeleteNoticesApp = (req, res) => {
  try {
    const { notices_app_ids, userId } = req.body;
    
    if (
      !notices_app_ids ||
      !Array.isArray(notices_app_ids) ||
      notices_app_ids.length === 0
    ) {
      return res
        .status(400)
        .json({ error: "삭제할 공지사항 ID가 필요합니다." });
    }

    // 현재 날짜 형식화
    const now = dayjs();
    const mod_dt = now.format("YYYYMMDDHHmmss");

    // notices_app 테이블에서 여러 공지사항을 일괄 삭제
    const noticesDeleteQuery = `
      UPDATE notices_app
      SET del_yn = 'Y'
        , mod_dt = ?
        , mod_id = ?
      WHERE notices_app_id IN (?)
    `;

    db.query(
      noticesDeleteQuery,
      [mod_dt, userId || null, notices_app_ids],
      (err, result) => {
        if (err) {
          console.error("공지사항 일괄 삭제 오류:", err);
          return res
            .status(500)
            .json({ error: "공지사항 일괄 삭제 중 오류가 발생했습니다." });
        }

        res.status(200).json({
          message: "공지사항이 성공적으로 삭제되었습니다.",
        });
      }
    );
  } catch (error) {
    console.error("공지사항 일괄 삭제 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};
