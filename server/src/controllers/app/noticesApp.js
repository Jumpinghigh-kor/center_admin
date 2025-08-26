const db = require("../../../db");
const dayjs = require("dayjs");

// 배너 목록 조회
exports.selectNoticesAppList = (req, res) => {
  const query = `
    SELECT
      notices_app_id
      , notices_type
      , title
      , content
      , view_yn
      , del_yn
      , reg_dt
      , mod_dt
    FROM        notices_app
    WHERE       del_yn = 'N'
    ORDER BY    notices_app_id DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("공지사항 목록 조회 오류:", err);
      return res
        .status(500)
        .json({ error: "공지사항 목록을 조회하는 도중 오류가 발생했습니다." });
    }

    const noticesApp = results.map((notice) => ({
      noticesAppId: notice.notices_app_id,
      noticesType: notice.notices_type,
      title: notice.title,
      content: notice.content,
      viewYn: notice.view_yn,
      delYn: notice.del_yn,
      regDate: notice.reg_dt,
      modDate: notice.mod_dt,
    }));

    res.status(200).json(noticesApp);
  });
};

// 공지사항 등록
exports.insertNoticesApp = (req, res) => {
  try {
    const { noticesType, title, content, viewYn, userId } = req.body;

    // 현재 날짜 형식화
    const now = dayjs();
    const reg_dt = now.format("YYYYMMDDHHmmss");

    // notices_app 테이블에 공지사항 정보 등록
    const noticesInsertQuery = `
      INSERT INTO notices_app (
        notices_type
        , title
        , content
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
      )
    `;

    db.query(
      noticesInsertQuery,
      [
        noticesType,
        title,
        content,
        viewYn,
        "N",
        reg_dt,
        userId || null,
        null, // mod_dt
        null, // mod_id
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
    const { noticesAppId, noticesType, title, content, viewYn, delYn, userId } =
      req.body;

    console.log(req.body);
    // 현재 날짜 형식화
    const now = dayjs();
    const mod_dt = now.format("YYYYMMDDHHmmss");

    // notices_app 테이블에 공지사항 정보 수정
    const noticesUpdateQuery = `
      UPDATE notices_app SET notices_type = ?
        , title = ?
        , content = ?
        , view_yn = ?
        , del_yn = ?
        , mod_dt = ?
        , mod_id = ?
      WHERE notices_app_id = ?
    `;

    db.query(
      noticesUpdateQuery,
      [
        noticesType,
        title,
        content,
        viewYn,
        delYn,
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
    const { noticesAppIds, userId } = req.body;
    console.log(req.body);
    if (
      !noticesAppIds ||
      !Array.isArray(noticesAppIds) ||
      noticesAppIds.length === 0
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
      [mod_dt, userId || null, noticesAppIds],
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
