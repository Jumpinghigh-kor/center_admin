const db = require("../../../db");
const dayjs = require("dayjs");

// 업데이트 로그 목록 조회
exports.selectUpdateLogAppList = (req, res) => {
  const { up_app_version, up_app_desc } = req.body;

  let addCondition = '';
  let params = [];
  
  if (up_app_version) {
    addCondition += ` AND up_app_version LIKE CONCAT('%', ?, '%')`;
    params.push(up_app_version);
  }
  if (up_app_desc) {
    addCondition += ` AND up_app_desc LIKE CONCAT('%', ?, '%')`;
    params.push(up_app_desc);
  }

  const query = `
    SELECT
      up_app_id
      , up_app_version
      , up_app_desc
      , del_yn
      , DATE_FORMAT(reg_dt, '%Y-%m-%d %H:%i:%s') as reg_dt
      , reg_id
      , DATE_FORMAT(mod_dt, '%Y-%m-%d %H:%i:%s') as mod_dt
      , mod_id
    FROM        update_log_app
    WHERE       del_yn = 'N'
    ${addCondition}
    ORDER BY    up_app_id DESC
  `;

  db.query(query, params, (err, results) => {
    if (err) {
      console.error("업데이트 로그 목록 조회 오류:", err);
      return res.status(500).json({
        error: "업데이트 로그 목록을 조회하는 도중 오류가 발생했습니다.",
      });
    }

    res.status(200).json({ result: results });
  });
};

// 업데이트 로그 상세 조회
exports.selectUpdateLogAppDetail = (req, res) => {
  const { up_app_id } = req.body;
  
  const query = `
    SELECT
      up_app_id
      , up_app_version
      , up_app_desc
      , del_yn
      , DATE_FORMAT(reg_dt, '%Y-%m-%d %H:%i:%s') as reg_dt
      , reg_id
      , DATE_FORMAT(mod_dt, '%Y-%m-%d %H:%i:%s') as mod_dt
      , mod_id
    FROM        update_log_app
    WHERE       del_yn = 'N'
    AND         up_app_id = ?
  `;

  db.query(query, [up_app_id], (err, results) => {
    if (err) {
      console.error("업데이트 로그 상세 조회 오류:", err);
      return res.status(500).json({
        error: "업데이트 로그 상세를 조회하는 도중 오류가 발생했습니다.",
      });
    }

    res.status(200).json({ result: results });
  });
};

// 버전 중복 체크크
exports.selectUpdateLogAppVersionCheck = (req, res) => {
  const { up_app_version } = req.body;
  

  const query = `
    SELECT
      COUNT(*) AS version_cnt
    FROM        update_log_app
    WHERE       del_yn = 'N'
    AND         up_app_version = ?
  `;

  db.query(query, [up_app_version], (err, results) => {
    if (err) {
      console.error("업데이트 로그 버전 중복 체크 오류:", err);
      return res.status(500).json({
        error: "업데이트 로그 버전 중복 체크 오류가 발생했습니다.",
      });
    }

    res.status(200).json({ result: results[0].version_cnt });
  });
};

// 업데이트 로그 등록
exports.insertUpdateLogApp = (req, res) => {
  try {
    const { upAppVersion, upAppDesc, userId } = req.body;

    // 현재 날짜 형식화
    const now = dayjs();
    const reg_dt = now.format("YYYYMMDDHHmmss");

    const updateLogAppInsertQuery = `
      INSERT INTO update_log_app (
        up_app_version
        , up_app_desc
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

    db.query(
      updateLogAppInsertQuery,
      [
        upAppVersion,
        upAppDesc,
        "N",
        reg_dt,
        userId || null,
        null,
        null,
      ],
      (updateLogAppErr, updateLogAppResult) => {
        if (updateLogAppErr) {
          console.error("업데이트 로그 등록 오류:", updateLogAppErr);
          return res
            .status(500)
            .json({ error: "업데이트 로그 등록 중 오류가 발생했습니다." });
        }

        res.status(201).json({
          updateLogAppId: updateLogAppResult.insertId,
          message: "업데이트 로그가 성공적으로 등록되었습니다.",
        });
      }
    );
  } catch (error) {
    console.error("업데이트 로그 등록 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

// 업데이트 로그 수정
exports.updateUpdateLogApp = (req, res) => {
  try {
    const { upAppVersion, upAppDesc, userId, upAppId } = req.body;

    // 현재 날짜 형식화
    const now = dayjs();
    const mod_dt = now.format("YYYYMMDDHHmmss");

    // notices_app 테이블에 공지사항 정보 수정
    const updateLogAppUpdateQuery = `
      UPDATE update_log_app SET
        up_app_version = ?
        , up_app_desc = ?
        , mod_dt = ?
        , mod_id = ?
      WHERE up_app_id = ?
    `;

    db.query(
      updateLogAppUpdateQuery,
      [upAppVersion, upAppDesc, mod_dt, userId || null, upAppId],
      (err, result) => {
        if (err) {
          console.error("업데이트 로그 수정 오류:", err);
          return res
            .status(500)
            .json({ error: "업데이트 로그 수정 중 오류가 발생했습니다." });
        }

        res.status(200).json({
          message: "업데이트 로그가 성공적으로 수정되었습니다.",
        });
      }
    );
  } catch (error) {
    console.error("업데이트 로그 수정 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

// 업데이트 로그 일괄 삭제
exports.batchDeleteUpdateLogApp = (req, res) => {
  try {
    const { updateLogAppIds, userId } = req.body;
    
    if (
      !updateLogAppIds ||
      !Array.isArray(updateLogAppIds) ||
      updateLogAppIds.length === 0
    ) {
      return res
        .status(400)
        .json({ error: "삭제할 업데이트 로그 ID가 필요합니다." });
    }

    // 현재 날짜 형식화
    const now = dayjs();
    const mod_dt = now.format("YYYYMMDDHHmmss");

    // notices_app 테이블에서 여러 공지사항을 일괄 삭제
    const updateLogAppDeleteQuery = `
      UPDATE update_log_app
      SET del_yn = 'Y'
        , mod_dt = ?
        , mod_id = ?
      WHERE up_app_id IN (?)
    `;

    db.query(
      updateLogAppDeleteQuery,
      [mod_dt, userId || null, updateLogAppIds],
      (err, result) => {
        if (err) {
          console.error("업데이트 로그 일괄 삭제 오류:", err);
          return res
            .status(500)
            .json({ error: "업데이트 로그 일괄 삭제 중 오류가 발생했습니다." });
        }

        res.status(200).json({
          message: "업데이트 로그가 성공적으로 삭제되었습니다.",
        });
      }
    );
  } catch (error) {
    console.error("업데이트 로그 일괄 삭제 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};
