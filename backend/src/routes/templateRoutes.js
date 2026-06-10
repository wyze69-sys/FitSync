const { Router } = require("express");
const { templateController } = require("../controllers/templateController");

const router = Router();

router.get("/active", templateController.getActiveTemplates);

module.exports = router;
