const { Router } = require("express");
const { adminController } = require("../controllers/adminController");
const { authenticateToken } = require("../middleware/authMiddleware");
const { requireAdmin } = require("../middleware/roleMiddleware");
const { validate } = require("../middleware/validate");
const {
  categorySchema,
  categoryUpdateSchema,
  roleUpdateSchema,
  statusUpdateSchema,
  adminUserQuerySchema
} = require("../validation/schemas");

const router = Router();

// All admin routes require authentication AND the admin role.
router.use(authenticateToken, requireAdmin);

router.get("/stats", adminController.getStats);

router.get("/users", validate(adminUserQuerySchema, "query"), adminController.getUsers);
router.get("/users/:id", adminController.getUserDetail);
router.put("/users/:id/role", validate(roleUpdateSchema), adminController.updateUserRole);
router.put("/users/:id/status", validate(statusUpdateSchema), adminController.updateUserStatus);

router.get("/categories/analytics", adminController.getCategoryAnalytics);
router.post("/categories", validate(categorySchema), adminController.createCategory);
router.put("/categories/:id", validate(categoryUpdateSchema), adminController.updateCategory);
router.delete("/categories/:id", adminController.deleteCategory);

module.exports = router;
