const express = require("express");
const router = express.Router();
const {
  getSales,
  getYearlySales,
  getMonthlySales,
  getReRegisterSales,
  deleteSales,
} = require("../controllers/sales");

router.get("/", getSales);
router.get("/year", getYearlySales);
router.get("/month", getMonthlySales);
router.get("/reregister", getReRegisterSales);
router.delete("/:id", deleteSales);

module.exports = router;
