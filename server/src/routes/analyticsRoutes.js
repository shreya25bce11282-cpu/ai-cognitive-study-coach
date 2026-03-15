import express from "express";
import {
  getFatigue,
  getOptimalSession,
  getSummary,
  getSubjectPerformance,
  getStudyPlan,
  getBurnoutRisk
} from "../controllers/analyticsController.js";

const router = express.Router();

router.get("/analytics/fatigue", getFatigue);
router.get("/analytics/optimal-session", getOptimalSession);
router.get("/analytics/summary", getSummary);
router.get("/analytics/subject-performance", getSubjectPerformance);
router.get("/analytics/recommend-study-plan", getStudyPlan);
router.get("/analytics/burnout-risk", getBurnoutRisk);

export default router;