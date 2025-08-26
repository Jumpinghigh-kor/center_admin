const express = require("express");
const dotenv = require("dotenv");
dotenv.config({
  path: process.env.NODE_ENV === "production" ? ".env.production" : ".env",
});

const cors = require("cors");
const dayjs = require("dayjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const http = require("http");
const path = require("path");
const cookieParser = require("cookie-parser");
const db = require("./db");

const center = require("./src/routes/center");
const sales = require("./src/routes/sales");
const member = require("./src/routes/member");
const product = require("./src/routes/product");
const schedule = require("./src/routes/schedule");
const info = require("./src/routes/info");
const log = require("./src/routes/log");
const inquiry = require("./src/routes/inquiry");
const video = require("./src/routes/video");
const admin = require("./src/routes/admin");
const news = require("./src/routes/news");
const locker = require("./src/routes/locker");
const app_api = require("./src/routes/app");

const cron = require("node-cron");

const PORT = process.env.PORT || 8080;
const app = express();
app.use(express.json({ extended: true }));
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: [
      "https://jumpingportal.gabia.io",
      "http://jpportal.co.kr",
      "http://localhost:3000",
    ],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);
app.use(cookieParser());

console.log("process.env.NODE_ENV : ", process.env.NODE_ENV || "development");

const ACCESS_SECRET = "jumpingaccesssecret";
const REFRESH_SECRET = "jumpingrefreshsecret";

const verifyToken = (req, res) => {
  try {
    const token = req.cookies.accessToken;
    const data = jwt.verify(token, ACCESS_SECRET);
    const query = "SELECT * FROM users WHERE usr_id = ?";
    db.query(query, [data.id], (err, result) => {
      if (err) {
        res.send(err);
      }
      const { usr_password, usr_second_password, ...others } = result[0];
      res.status(200).json(others);
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

// IP 주소 가져오기 함수
function getIpAddress(req) {
  return req.headers["x-forwarded-for"] || req.socket.remoteAddress;
}

//1차 비밀번호
app.post("/api/login/primary", (req, res) => {
  const { id } = req.body;
  const password = crypto
    .createHash("sha256")
    .update(req.body.password)
    .digest("base64");

  const loginQuery = `SELECT * FROM users WHERE usr_id = ? AND usr_password = ?`;
  db.query(loginQuery, [id, password], (err, result) => {
    if (err) {
      return res.send(err);
    }

    if (result.length === 0) {
      //로그인 실패
      return res.json({
        login: false,
        message: "로그인 실패",
      });
    } else {
      try {
        return res.status(200).json({
          login: true,
          message: "1차 로그인 성공",
        });
      } catch (error) {
        res.status(500).json(error);
      }
    }
  });
});

//2차 비밀번호
app.post("/api/login/secondary", (req, res) => {
  const { id } = req.body;
  const password = crypto
    .createHash("sha256")
    .update(req.body.password)
    .digest("base64");
  const ipAddress = getIpAddress(req);
  const loginQuery = `SELECT * FROM users WHERE usr_id = ? AND usr_second_password = ?`;
  db.query(loginQuery, [id, password], (err, result) => {
    if (err) {
      return res.send(err);
    }

    if (result.length === 0) {
      //로그인 실패
      saveLoginLog(id, ipAddress, "failure");
      return res.json({
        login: false,
        message: "로그인 실패",
      });
    } else {
      try {
        //엑세스 토큰 발급
        const accessToken = jwt.sign(
          {
            type: "JWT",
            id: id,
          },
          ACCESS_SECRET,
          {
            issuer: "Jumping High",
            expiresIn: "24h", // 만료시간 24시간
          }
        );

        //리프레시 토큰 발급
        const refreshToken = jwt.sign(
          {
            type: "JWT",
            id: id,
          },
          REFRESH_SECRET,
          {
            issuer: "Jumping High",
            expiresIn: "12h", // 만료시간 12시간
          }
        );

        res.cookie("accessToken", accessToken, {
          secure: false,
          httpOnly: true,
        });

        res.cookie("refreshtoken", refreshToken, {
          secure: false,
          httpOnly: true,
        });

        const { usr_password, usr_second_password, ...others } = result[0];
        saveLoginLog(id, ipAddress, "success");
        return res.status(200).json({
          login: true,
          message: "로그인 성공",
          result: others,
          access_token: accessToken,
          current_version: "0.1.1",
        });
      } catch (error) {
        res.status(500).json(error);
      }
    }
  });
});

// 로그인 로그를 DB에 저장하는 함수
const saveLoginLog = (userId, ipAddress, status) => {
  if (process.env.NODE_ENV === "production") {
    const query =
      "INSERT INTO login_log (user_id, ip_address, status) VALUES (?, INET_ATON(?), ?)";
    db.query(query, [userId, ipAddress, status], (err) => {
      if (err) {
        console.error("로그인 로그 저장 오류:", err);
      }
    });
  }
};

app.get("/api/check-token", verifyToken);

app.use("/api/center", center);
app.use("/api/sales", sales);
app.use("/api/member", member);
app.use("/api/product", product);
app.use("/api/schedule", schedule);
app.use("/api/inquiry", inquiry);
app.use("/api/info", info);
app.use("/api/log", log);
app.use("/api/video", video);
app.use("/api/admin", admin);
app.use("/api/news", news);
app.use("/api/locker", locker);
app.use("/api/app", app_api);

//센터 추가
app.post("/api/user", (req, res) => {
  const { name, id, password, user_role } = req.body;
  if (user_role !== "admin") {
    return res.status(400).json({
      message: "어드민 계정이 아닙니다.",
    });
  }

  //중복 ID 체크
  const query = `SELECT * FROM users WHERE usr_id = ?`;
  db.query(query, [id], (err, result) => {
    if (err) {
      return res.status(500).json(err);
    }

    if (result.length !== 0) {
      return res.status(400).json({ message: "동일한 ID가 존재합니다." });
    }
    const createCenterQuery = `INSERT INTO centers 
    (center_name, target_amount_month, target_amount_year, target_members) 
    VALUES (?,?,?,?)`;
    db.query(
      createCenterQuery,
      [name, 5000000, 40000000, 35],
      (err, result) => {
        if (err) {
          return console.error("센터 추가 오류:", err);
        }
        const center_id = result.insertId;
        const HASHED_PASSWORD = crypto
          .createHash("sha256")
          .update(password)
          .digest("base64");
        const HASHED_SECOND_PASSWORD = crypto
          .createHash("sha256")
          .update("1234")
          .digest("base64");
        const createUserQuery = `INSERT INTO users 
    (usr_name, usr_id, usr_password, usr_second_password, usr_role, center_id) 
    VALUES (?,?,?,?,?,?)`;
        db.query(
          createUserQuery,
          [
            name,
            id,
            HASHED_PASSWORD,
            HASHED_SECOND_PASSWORD,
            "franchisee",
            center_id,
          ],
          (err, result) => {
            if (err) {
              console.log(err);
              return res.status(500).json(err);
            }
            return res
              .status(200)
              .json({ result: result, message: "센터가 새로 추가되었습니다." });
          }
        );
      }
    );
  });
});

app.patch("/api/user/:id", (req, res) => {
  const { id } = req.params;
  const { mode, currentPassword, newPassword } = req.body;
  const password = crypto
    .createHash("sha256")
    .update(currentPassword)
    .digest("base64");
  const new_password = crypto
    .createHash("sha256")
    .update(newPassword)
    .digest("base64");
  const query = `SELECT * FROM users WHERE center_id = ? AND usr_password = ?`;
  db.query(query, [id, password], (err, result) => {
    const message =
      mode === 1
        ? "비밀번호를 성공적으로 변경하였습니다. 다시 로그인해주세요."
        : "2차 비밀번호를 성공적으로 변경하였습니다. 다시 로그인해주세요.";

    if (err) {
      res.status(500).json(err);
    }

    if (result.length === 0) {
      return res.status(400).json({
        message: "현재 비밀번호를 잘못 입력하셨습니다.",
      });
    } else {
      const changePasswordQuery =
        mode === 1
          ? `UPDATE users SET usr_password = ? WHERE center_id = ?`
          : `UPDATE users SET usr_second_password = ? WHERE center_id = ?`;
      db.query(changePasswordQuery, [new_password, id], (err, result) => {
        if (err) {
          res.status(500).json(err);
        }
        res.status(200).json({
          result: result,
          message: message,
        });
      });
    }
  });
});

const checkMembershipExpiry = () => {
  const time = dayjs().format("YYYY-MM-DD HH:mm:ss");
  console.log(`${time} running a task everyday`);

  db.query(
    "SELECT GET_LOCK('membership_expiry_lock', 0) AS lock_status",
    (err, result) => {
      if (err || result[0].lock_status === 0) {
        console.log("Lock not acquired, skipping execution.");
        return; // 다른 프로세스가 이미 락을 가지고 있어 작업을 실행하지 않음
      }

      const query = `SELECT * FROM members INNER JOIN member_orders ON member_orders.memo_mem_id = members.mem_id
        WHERE members.mem_status = 1
        AND NOW() BETWEEN memo_start_date AND memo_end_date
        AND DATEDIFF(memo_end_date, NOW()) <= 5
        AND memo_end_date > NOW()
        AND memo_notification_sent = 0
        GROUP BY mem_id;`;
      db.query(query, (err, result) => {
        if (err) {
          console.log(err);
          return;
        }

        if (result.length > 0) {
          result.forEach((member) => {
            const notificationQuery = `
              INSERT INTO notifications (not_user_id, not_type, not_title, not_message, not_is_read, not_created_at)
              VALUES (?, ?, ?, ?, ?, ?)
            `;

            const type = "만료 알림";
            const title = "회원권 만료 알림";
            const message = `📢알림! ${member.mem_name} 회원님의 회원권 만료일이 다가오고 있습니다`;
            const createdAt = dayjs().format("YYYY-MM-DD HH:mm:ss");

            db.query(
              notificationQuery,
              [member.center_id, type, title, message, 0, createdAt],
              (err) => {
                if (err) {
                  console.log("Error inserting notification:", err);
                } else {
                  const updateNotificationSentQuery = `
                    UPDATE member_orders SET memo_notification_sent = 1 WHERE memo_id = ?
                  `;

                  db.query(
                    updateNotificationSentQuery,
                    [member.memo_id],
                    (err, result) => {
                      if (err) {
                        console.log(
                          "Error updating member_notification_sent:",
                          err
                        );
                      } else {
                        console.log(
                          `member_notification_sent updated for member ${member.memo_mem_id}`
                        );
                      }
                    }
                  );
                }
              }
            );
          });
        }

        // 모든 작업이 완료되면 락 해제
        db.query("SELECT RELEASE_LOCK('membership_expiry_lock')");
      });
    }
  );
};

//매일 자정에 멤버쉽 만료를 체크
cron.schedule("0 0 * * *", () => {
  checkMembershipExpiry();
});

//알림 가져오기
app.get("/api/notification/:centerid", (req, res) => {
  const { centerid } = req.params;
  const query = `SELECT * FROM notifications WHERE not_user_id = ? ORDER BY not_id DESC`;
  db.query(query, [centerid], (err, result) => {
    if (err) {
      res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
});

app.patch("/api/notification/:id", (req, res) => {
  const time = dayjs().format("YYYY-MM-DD HH:mm:ss");
  const { id } = req.params;
  const query = `UPDATE notifications SET not_is_read = 1, not_read_at = ? WHERE not_id = ?`;
  db.query(query, [time, id], (err, result) => {
    if (err) {
      console.log(err);
      return res.status(500).json(err);
    }
    return res.json({ message: "Updated the notification", result: result });
  });
});

//서버 시간
app.get("/api/time", (req, res) => {
  const time = dayjs().format();
  res.send({ result: time });
});

const httpServer = http.createServer(app);

app.use(express.static(__dirname + "/build"));

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "/build/index.html"));
});

app.get("*", function (req, res) {
  res.sendFile(path.join(__dirname, "/build/index.html"));
});

httpServer.listen(PORT, () => {
  console.log(`HTTP Server running on port ${PORT}`);
});
