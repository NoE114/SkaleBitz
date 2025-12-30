import { Router } from "express";
import authRequired from "../middleware/authRequired.js";
import { getDeal, listDeals } from "../controllers/dealsController.js";

const router = Router();

router.get("/", authRequired, listDeals);
router.get("/:id", authRequired, getDeal);

export default router;