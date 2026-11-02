import { Router } from "express";
import {
  createOrder,
  listOrders,
  getOrder,
  recordReturn,
  issueExtraGold,
} from "../controllers/orderController.js";
import auth from "../middleware/auth.js";

const router = Router();

router.post("/", auth, createOrder);
router.get("/", auth, listOrders);
router.get("/:id", auth, getOrder);
router.post("/:id/returns", auth, recordReturn);
router.post("/:id/issues", auth, issueExtraGold);

export default router;