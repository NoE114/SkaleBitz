import { Router } from "express";
import authRequired from "../middleware/authRequired.js";
import {
  createDeal,
  getDeal,
  getDealCashflows,
  investInDeal,
  listDealInvestments,
  listDealInvestors,
  listDeals,
} from "../controllers/dealsController.js";

const router = Router();

router.get("/", authRequired, listDeals);

router.get("/:id/cashflows", authRequired, getDealCashflows);
router.get("/:id", authRequired, getDeal);
router.get("/:id/investors", authRequired, listDealInvestors);
router.get("/:id/investments", authRequired, listDealInvestments);
router.post("/:id/invest", authRequired, investInDeal);
router.post("/", authRequired, createDeal);

export default router;