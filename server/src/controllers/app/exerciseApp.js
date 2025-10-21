const db = require("../../../db");
const dayjs = require("dayjs");

// 운동 목록 조회
exports.selectExerciseAppList = (req, res) => {
  const { center_id, mem_name, mem_gender, exercise_start_dt, exercise_end_dt, jumping_intensity_level, other_exercise_type, other_exercise_calory_min, other_exercise_calory_max } = req.body;

  let addCondition = '';
  let params = [center_id];

  if(mem_name) {
    addCondition += ` AND m.mem_name LIKE CONCAT('%', ?, '%')`;
    params.push(mem_name);
  }

  if(mem_gender) {
    addCondition += ` AND m.mem_gender = ?`;
    params.push(mem_gender);
  }

  if(exercise_start_dt && exercise_end_dt) {
    addCondition += ` AND mea.exercise_dt BETWEEN ? AND ?`;
    params.push(exercise_start_dt.replace(/-/g, ''), exercise_end_dt.replace(/-/g, ''));
  } else if(exercise_start_dt) {
    addCondition += ` AND mea.exercise_dt >= ?`;
    params.push(exercise_start_dt.replace(/-/g, ''));
  } else if(exercise_end_dt) {
    addCondition += ` AND mea.exercise_dt <= ?`;
    params.push(exercise_end_dt.replace(/-/g, ''));
  }

  if(jumping_intensity_level) {
    addCondition += ` AND mea.jumping_intensity_level = ?`;
    params.push(jumping_intensity_level);
  }

  if(other_exercise_type) {
    addCondition += ` AND mea.other_exercise_type = ?`;
    params.push(other_exercise_type);
  }

  if(other_exercise_calory_min && other_exercise_calory_max) {
    addCondition += ` AND mea.other_exercise_calory BETWEEN ? AND ?`;
    params.push(other_exercise_calory_min, other_exercise_calory_max);
  } else if(other_exercise_calory_min) {
    addCondition += ` AND mea.other_exercise_calory >= ?`;
    params.push(other_exercise_calory_min);
  } else if(other_exercise_calory_max) {
    addCondition += ` AND mea.other_exercise_calory <= ?`;
    params.push(other_exercise_calory_max);
  }

  const query = `
    SELECT
      m.mem_id
      , m.mem_name
      , CASE 
          WHEN	m.mem_gender = 1 THEN '남자'
          ELSE	'여자'
      END AS mem_gender
      , mea.exercise_app_id
      , mea.mem_id
      , DATE_FORMAT(mea.exercise_dt, '%Y-%m-%d') AS exercise_dt
      , mea.jumping_exercise_time
      , CASE
          WHEN	mea.jumping_intensity_level = 'LOW'       THEN '저강도'
          WHEN	mea.jumping_intensity_level = 'MODERATE'  THEN '중강도'
          ELSE 	'고강도'
      END AS jumping_intensity_level
      , mea.jumping_heart_rate
      , mea.other_exercise_type
      , mea.other_exercise_time
      , mea.other_exercise_calory
      , DATE_FORMAT(mea.reg_dt, '%Y-%m-%d %H:%i:%s') AS reg_dt
      , mea.reg_id
    FROM		    members m
    INNER JOIN	member_exercise_app mea	ON m.mem_id = mea.mem_id
    WHERE       m.center_id = ?
    ${addCondition}
    ORDER BY    mea.exercise_dt DESC
  `;

  db.query(query, params, (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};
