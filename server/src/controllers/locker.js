const db = require("./../../db");
const resultCode = require("../utils/resultCode.js");
const dayjs = require("dayjs");

// 로커 기본 정보 조회
exports.getLockerBas = async (req, res) => {
  const { center_id } = req.query;

  const query = `
      SELECT
        locker_id
        , center_id
        , locker_type
        , locker_memo
        , locker_gender
        , array_type
        , array_form
        , array_direction
        , \`rows\`
        , cols
        , del_yn
        , reg_dt
        , reg_seq
      FROM	locker_bas
      WHERE	center_id = ?
      AND		del_yn = 'N'
    `;

  try {
    const result = await db.promise().query(query, [center_id]);
    res.json({
      result_code: resultCode.SUCCESS,
      result: result[0],
    });
  } catch (err) {
    console.error("err:::", err);
    res.status(500).send({
      result_code: resultCode.ERROR,
      message: "오류입니다.\n관리자에게 문의해주세요.",
    });
  }
};

// 로커 기본 정보 등록 및 수정
exports.modifyLockerBas = async (req, res) => {
  const {
    center_id,
    locker_id,
    locker_type,
    locker_memo,
    locker_gender,
    array_type,
    array_form,
    array_direction,
    rows,
    cols,
  } = req.body;

  const now_dt = dayjs().format("YYYYMMDDHHmmss");

  const selectQuery = `
      SELECT
        locker_id
        , center_id
        , locker_type
        , locker_gender
        , array_type
        , array_form
        , array_direction
        , \`rows\`
        , cols
        , del_yn
        , reg_dt
        , reg_seq
      FROM  locker_bas
      WHERE locker_id = ?
      AND   center_id = ?
      AND   del_yn = 'N'
    `;

  try {
    const [result] = await db
      .promise()
      .query(selectQuery, [locker_id, center_id]);

    if (result.length > 0) {
      if (
        (req.body.array_type === "FREE" && result[0].array_type === "AUTO") ||
        (req.body.array_type === "AUTO" && result[0].array_type === "FREE")
      ) {
        const deleteQuery = `
        UPDATE locker_detail SET
          del_yn = 'Y'
          , mod_dt = ?
          , mod_seq = ?
        WHERE locker_id = ?
      `;

        await db.promise().query(deleteQuery, [now_dt, center_id, locker_id]);
      }

      const updateQuery = `
        UPDATE locker_bas SET
          \`rows\` = ?
          , cols = ?
          , locker_type = ?
          , locker_memo = ?
          , locker_gender = ?
          , array_type = ?
          , array_form = ?
          , array_direction = ?
          , mod_dt = ?
          , mod_seq = ?
        WHERE locker_id = ?
      `;

      await db
        .promise()
        .query(updateQuery, [
          rows,
          cols,
          locker_type,
          locker_memo,
          locker_gender,
          array_type,
          array_form ? array_form : null,
          array_direction ? array_direction : null,
          now_dt,
          center_id,
          locker_id,
        ]);
      return res.json({ result_code: resultCode.SUCCESS });
    } else {
      const insertQuery = `
        INSERT INTO locker_bas (
          center_id
          , locker_type
          , locker_memo
          , locker_gender
          , array_type
          , array_form
          , array_direction
          , \`rows\`
          , cols
          , del_yn
          , reg_dt
          , reg_seq
          , mod_dt
          , mod_seq
        ) 
        VALUES (
          ?
          , ?
          , ?
          , ?
          , ?
          , ?
          , ?
          , ?
          , ?
          , 'N'
          , ?
          , ?
          , ?
          , ?
        )`;
      await db
        .promise()
        .query(insertQuery, [
          center_id,
          locker_type,
          locker_memo,
          locker_gender,
          array_type,
          array_form ? array_form : null,
          array_direction ? array_direction : null,
          rows,
          cols,
          now_dt,
          center_id,
          null,
          null,
        ]);
      return res.json({ result_code: resultCode.SUCCESS });
    }
  } catch (err) {
    console.error("err:::", err);
    return res.status(500).send({
      result_code: resultCode.ERROR,
      message: "오류입니다.\n관리자에게 문의해주세요.",
    });
  }
};

// 로커 기본 정보 삭제
exports.deleteLockerBas = async (req, res) => {
  const { locker_id, usr_id } = req.body;
  const now_dt = dayjs().format("YYYYMMDDHHmmss");

  const deleteQuery = `
    UPDATE locker_bas SET
      del_yn = 'Y'
      , mod_dt = ?
      , mod_seq = ?
    WHERE locker_id = ?
  `;

  try {
    await db.promise().query(deleteQuery, [now_dt, usr_id, locker_id]);
    return res.json({ result_code: resultCode.SUCCESS });
  } catch (err) {
    console.error("err:::", err);
    return res.status(500).send({
      result_code: resultCode.ERROR,
      message: "오류입니다.\n관리자에게 문의해주세요.",
    });
  }
};

// 로커 상세 정보 조회
exports.getLockerDetail = async (req, res) => {
  const { center_id } = req.query;

  const query = `
    SELECT
      lb.locker_id
      , lb.locker_gender
      , lb.locker_type
      , ld.locker_status
      , ld.locker_number
      , ld.locker_detail_memo
      , ld.free_position
      , ld.del_yn
      , DATE_FORMAT(ld.locker_start_dt, '%Y%m%d') AS locker_start_dt
      , DATE_FORMAT(ld.locker_end_dt, '%Y%m%d') AS locker_end_dt
      , m.mem_id
      , m.mem_name
      , m.mem_phone
      , CASE
          WHEN m.mem_gender = 0 THEN 'W'
        ELSE 'M'
      END AS mem_gender
    FROM		  locker_bas lb
    LEFT JOIN	locker_detail ld 	ON lb.locker_id = ld.locker_id
    LEFT JOIN	members m 			  ON ld.mem_id = m.mem_id
    WHERE		  lb.center_id = ?
    AND			  lb.del_yn = 'N'
    AND       ld.del_yn = 'N'
  `;

  try {
    const [result] = await db.promise().query(query, [center_id]);
    res.json({
      result_code: resultCode.SUCCESS,
      result: result,
    });
  } catch (err) {
    console.error("err:::", err);
    res.status(500).send({
      result_code: resultCode.ERROR,
      message: "오류입니다.\n관리자에게 문의해주세요.",
    });
  }
};

// 로커 상세 정보 등록
exports.modifyLockerDetail = async (req, res) => {
  const {
    locker_id,
    mem_id,
    locker_status,
    locker_number,
    locker_start_dt,
    locker_end_dt,
    locker_detail_memo,
    free_position,
    center_id,
  } = req.body;
  const reg_dt = dayjs().format("YYYYMMDDHHmmss");
  const format_locker_start_dt =
    dayjs(locker_start_dt).format("YYYYMMDD") + "000001";
  const format_locker_end_dt =
    dayjs(locker_end_dt).format("YYYYMMDD") + "235959";

  // 로커 상세 데이터 조회
  const selectQuery = `
    SELECT
      COUNT(*) AS ldCnt
    FROM		  locker_bas lb
    LEFT JOIN	locker_detail ld ON lb.locker_id = ld.locker_id
    WHERE		  lb.locker_id = ?
    AND			  ld.locker_number = ?
    AND       ld.del_yn = 'N'
  `;

  try {
    const [result] = await db
      .promise()
      .query(selectQuery, [locker_id, locker_number]);
    let use_yn = "";
    if (locker_status == "OCCUPIED" || locker_status == "UNAVAILABLE") {
      use_yn = "Y";
    } else {
      use_yn = "N";
    }

    // 기존의 데이터가 있을 시 상태 변경
    if (result[0].ldCnt > 0) {
      const updateQuery = `
        UPDATE locker_detail SET
          mem_id = ?
          , locker_status = ?
          , locker_start_dt = ?
          , locker_end_dt = ?
          , locker_detail_memo = ?
          , free_position = ?
          , use_yn = ?
          , mod_dt = ?
          , mod_seq = ?
        WHERE	locker_number = ?
      `;

      await db
        .promise()
        .query(updateQuery, [
          mem_id,
          locker_status,
          format_locker_start_dt,
          format_locker_end_dt,
          locker_detail_memo,
          free_position,
          use_yn,
          reg_dt,
          center_id,
          locker_number,
        ]);
      return res.json({ result_code: resultCode.SUCCESS });
    } else {
      // 데이터 없을시 추가
      const insertQuery = `
        INSERT INTO locker_detail (
          locker_id
          , mem_id
          , locker_status
          , locker_number
          , locker_start_dt
          , locker_end_dt
          , locker_detail_memo
          , free_position
          , use_yn
          , del_yn
          , reg_dt
          , reg_seq
          , mod_dt
          , mod_seq
        ) VALUES (
          ?
          , ?
          , ?
          , ?
          , ?
          , ?
          , ?
          , ?
          , 'Y'
          , 'N'
          , ?
          , ?
          , NULL
          , NULL
        )
      `;

      await db
        .promise()
        .query(insertQuery, [
          locker_id,
          mem_id,
          locker_status,
          locker_number,
          format_locker_start_dt,
          format_locker_end_dt,
          locker_detail_memo,
          free_position,
          reg_dt,
          center_id,
        ]);
      return res.json({ result_code: resultCode.SUCCESS });
    }
  } catch (err) {
    console.error("err:::", err);
    return res.status(500).send({
      result_code: resultCode.ERROR,
      message: "오류입니다.\n관리자에게 문의해주세요.",
    });
  }
};
