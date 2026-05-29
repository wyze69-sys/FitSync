const { Router } = require("express");
const { authenticateToken } = require("../middleware/authMiddleware");
const { categoryController } = require("../controllers/categoryController");

const router = Router();

router.get("/", authenticateToken, categoryController.getCategories);

module.exports = router;
