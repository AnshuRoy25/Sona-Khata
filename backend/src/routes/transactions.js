import { Router } from "express";
import { confirmTransaction, rejectTransaction } from "../controllers/transactionController.js";
import auth from "../middleware/auth.js";

const router = Router();

router.post("/:id/confirm", auth, confirmTransaction);
router.post("/:id/reject", auth, rejectTransaction);

export default router;