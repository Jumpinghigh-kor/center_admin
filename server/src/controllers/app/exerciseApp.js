const db = require("../../../db");
const dayjs = require("dayjs");

// 운동 목록 조회
exports.selectExerciseAppList = (req, res) => {
  const { center_id, mem_name, mem_gender, exercise_start_dt, exercise_end_dt, member_type, total_jumping_calory_min, total_jumping_calory_max, total_other_calory_min, total_other_calory_max } = req.body;

  let addCondition = '';
  let params = [center_id];

  if(mem_name) {
    addCondition += ` AND A.mem_name LIKE CONCAT('%', ?, '%')`;
    params.push(mem_name);
  }

  if(mem_gender) {
    addCondition += ` AND A.mem_gender = ?`;
    params.push(mem_gender);
  }

  if(exercise_start_dt && exercise_end_dt) {
    addCondition += ` AND A.exercise_dt BETWEEN ? AND ?`;
    params.push(exercise_start_dt.replace(/-/g, ''), exercise_end_dt.replace(/-/g, ''));
  } else if(exercise_start_dt) {
    addCondition += ` AND A.exercise_dt >= ?`;
    params.push(exercise_start_dt.replace(/-/g, ''));
  } else if(exercise_end_dt) {
    addCondition += ` AND A.exercise_dt <= ?`;
    params.push(exercise_end_dt.replace(/-/g, ''));
  }

  if(member_type) {
    addCondition += ` AND A.member_type = ?`;
    params.push(member_type);
  }

  if(total_jumping_calory_min && total_jumping_calory_max) {
    addCondition += ` AND A.total_jumping_calory BETWEEN ? AND ?`;
    params.push(total_jumping_calory_min, total_jumping_calory_max);
  } else if(total_jumping_calory_min) {
    addCondition += ` AND A.total_jumping_calory >= ?`;
    params.push(total_jumping_calory_min);
  } else if(total_jumping_calory_max) {
    addCondition += ` AND A.total_jumping_calory <= ?`;
    params.push(total_jumping_calory_max);
  }

  if(total_other_calory_min && total_other_calory_max) {
    addCondition += ` AND A.total_other_calory BETWEEN ? AND ?`;
    params.push(total_other_calory_min, total_other_calory_max);
  } else if(total_other_calory_min) {
    addCondition += ` AND A.total_other_calory >= ?`;
    params.push(total_other_calory_min);
  } else if(total_other_calory_max) {
    addCondition += ` AND A.total_other_calory <= ?`;
    params.push(total_other_calory_max);
  }

  const query = `
    SELECT 
     *
    FROM (
      SELECT
        m.mem_id
        , m.mem_name
        , m.mem_gender
        , maa.account_app_id
        , mea.exercise_app_id
        , mea.member_type
        , CONCAT(DATE_FORMAT(mea.exercise_dt, '%Y'), '년 ', DATE_FORMAT(mea.exercise_dt, '%m'), '월 ', DATE_FORMAT(mea.exercise_dt, '%d'), '일') AS exercise_dt
        , mea.reg_id
        , (
            SELECT
              SUM(jumping_calory)
            FROM	exercise_jumping sej
            WHERE	sej.exercise_app_id = mea.exercise_app_id
          ) AS total_jumping_calory
        , (
            SELECT
              SUM(other_exercise_calory)
            FROM	exercise_other seo
            WHERE	seo.exercise_app_id = mea.exercise_app_id
          ) AS total_other_calory
      FROM		    members m
      INNER JOIN	member_account_app maa	ON m.mem_id = maa.mem_id
      INNER JOIN	member_exercise_app mea	ON maa.account_app_id = mea.account_app_id
      WHERE       m.center_id = ?
      AND         mea.del_yn = 'N'
      AND         maa.del_yn = 'N'
    ) A
    WHERE 1 = 1
    ${addCondition}
    ORDER BY    exercise_dt DESC
    `;

  db.query(query, params, (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

// 운동 점핑 상세 조회
exports.selectExerciseJumpingDetail = (req, res) => {
  const { exercise_app_id } = req.body;

  const query = `
    SELECT
      mea.exercise_app_id
      , mea.account_app_id
      , CONCAT(DATE_FORMAT(mea.exercise_dt, '%Y'), '년 ', DATE_FORMAT(mea.exercise_dt, '%m'), '월 ', DATE_FORMAT(mea.exercise_dt, '%d'), '일') AS exercise_dt
      , CASE
          WHEN	mea.member_type = 'NORMAL_MEMBER' THEN '일반 회원'
          ELSE	'수업 강사'
      END	AS member_type
      , ej.exercise_jumping_id
      , ej.exercise_app_id
      , ej.session
      , ej.intensity_level
      , ej.skill_level
      , ej.average_heart_rate
      , ej.max_heart_rate
      , ej.jumping_minute
      , ej.jumping_calory
      , ej.lesson
      , ej.lesson_type
      , ej.reg_dt
      , ej.reg_id
    FROM		  member_exercise_app mea
    LEFT JOIN	exercise_jumping ej	ON	mea.exercise_app_id = ej.exercise_app_id
    WHERE		  mea.exercise_app_id = ?
  `;

  db.query(query, [exercise_app_id], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

// 운동 기타 운동 상세 조회
exports.selectExerciseOtherDetail = (req, res) => {
  const { exercise_app_id } = req.body;

  const query = `
    SELECT
      CASE
        WHEN	mea.member_type = 'NORMAL_MEMBER' THEN '일반 회원'
        ELSE	'수업 강사'
      END	AS member_type
      , eo.exercise_other_id
      , eo.other_exercise_type
      , CAST(LEFT(eo.other_exercise_time, 2) AS UNSIGNED) AS other_exercise_hour
      , CAST(RIGHT(eo.other_exercise_time, 2) AS UNSIGNED) AS other_exercise_minute
      , eo.other_exercise_calory
      , eo.reg_dt
      , eo.reg_id
    FROM		  member_exercise_app mea
    LEFT JOIN	exercise_other eo	ON	mea.exercise_app_id = eo.exercise_app_id
    WHERE		  mea.exercise_app_id = ?
  `;

  db.query(query, [exercise_app_id], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};