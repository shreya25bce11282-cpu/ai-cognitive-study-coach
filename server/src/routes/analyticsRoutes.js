import express from "express";
import {
  getFatigue,
  getOptimalSession,
  getSummary,
  getSubjectPerformance,
  getStudyPlan,
  getBurnoutRisk,
  getBreakRecommendation,
  predictSessionDuration,
  getBestStudyTime
} from "../controllers/analyticsController.js";

const router = express.Router();

router.get("/analytics/fatigue", getFatigue);
router.get("/analytics/optimal-session", getOptimalSession);
router.get("/analytics/summary", getSummary);
router.get("/analytics/subject-performance", getSubjectPerformance);
router.get("/analytics/recommend-study-plan", getStudyPlan);
router.get("/analytics/burnout-risk", getBurnoutRisk);
router.get("/analytics/break-recommendation", getBreakRecommendation);
router.get("/analytics/predict-session", predictSessionDuration);
router.get("/analytics/best-time", getBestStudyTime);

export default router;