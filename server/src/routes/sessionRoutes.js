import express from "express";
import { getSessions, startSession, endSession } from "../controllers/sessionController.js";

const router = express.Router();

router.get("/sessions", getSessions);
router.post("/sessions/start", startSession);
router.post("/sessions/end", endSession);

export default router;