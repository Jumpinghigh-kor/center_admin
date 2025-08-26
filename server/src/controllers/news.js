const db = require("./../../db");
const dayjs = require("dayjs");
const resultCode = require('../utils/resultCode.js');

// 업데이트 등록
exports.createUpdateLog = async (req, res) => {
  const { up_ver, up_desc } = req.body;
  const query = 
    `
      INSERT INTO update_log (
        up_ver
        , up_desc
      ) VALUES (
        ?
        , ?
      )
    `;

  try {
    const result = await db.promise().query(query, [up_ver, up_desc]);
    res.json({
      result_code: resultCode.SUCCESS,
      result,
    });
  } catch (err) {
    console.error('err::', err);
    res.status(500).send({
      result_code: resultCode.ERROR,
      message: '오류입니다.\n관리자에게 문의해주세요.',
    });
  }
};

// 공지사항 등록
exports.createNotices = async (req, res) => {
  const { no_desc } = req.body;
  const no_background = null;
  const no_text = null;
  const no_date = dayjs().format("YYYY-MM-DD HH:mm:ss");

  const query = 
    `
      INSERT INTO notices (
        no_desc
        , no_background
        , no_text
        , no_date
      ) VALUES (
        ?
        , ?
        , ?
        , ?
      )
    `;

  try {
    const result = await db.promise().query(query, [no_desc, no_background, no_text, no_date]);
    res.json({
      result_code: resultCode.SUCCESS,
      result,
    });
  } catch (err) {
    console.error('err::', err);
    res.status(500).send({
      result_code: resultCode.ERROR,
      message: '오류입니다.\n관리자에게 문의해주세요.',
    });
  }
};

// 안내사항 등록
exports.createGuidelines = async (req, res) => {
  const { gl_desc, gl_background, gl_text } = req.body;
  
  const query = 
    `
      INSERT INTO guidelines (
        gl_desc
        , gl_background
        , gl_text
      ) VALUES (
        ?
        , ?
        , ?
      )
    `;

  try {
    const result = await db.promise().query(query, [gl_desc, gl_background, gl_text]);
    res.json({
      result_code: resultCode.SUCCESS,
      result,
    });
  } catch (err) {
    console.error('err::', err);
    res.status(500).send({
      result_code: resultCode.ERROR,
      message: '오류입니다.\n관리자에게 문의해주세요.',
    });
  }
};