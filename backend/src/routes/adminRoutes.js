const { Router } = require("express");
const { adminController } = require("../controllers/adminController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { requireAdmin } = require("../middleware/roleMiddleware");

const router = Router();

router.get("/users", authenticateToken, requireAdmin, adminController.getUsers);
router.post("/categories", authenticateToken, requireAdmin, adminController.createCategory);
router.put("/categories/:id", authenticateToken, requireAdmin, adminController.updateCategory);
router.delete("/categories/:id", authenticateToken, requireAdmin, adminController.deleteCategory);
router.get("/stats", authenticateToken, requireAdmin, adminController.getStats);

module.exports = router;
