const express = require("express");
const { saveAnswer } = require("../controllers/admin");
const router = express.Router();

router.post("/inquiry/answer", saveAnswer);

module.exports = router;
