const { activityService } = require("../services/activityService");

const activityController = {
  async getActivities(req, res, next) {
    try {
      const filters = { category: req.query.category };
      if (req.query.grouped === "true" || req.query.grouped === true) {
        const grouped = await activityService.listGroupedByCategory(filters);
        res.json(grouped);
        return;
      }
      const activities = await activityService.listActivities(filters);
      res.json(activities);
    } catch (err) {
      next(err);
    }
  },

  async getActivity(req, res, next) {
    try {
      const activity = await activityService.getActivity(req.params.slug);
      if (!activity) {
        res.status(404).json({ error: "Activity not found." });
        return;
      }
      res.json(activity);
    } catch (err) {
      next(err);
    }
  }
};

module.exports = { activityController };
