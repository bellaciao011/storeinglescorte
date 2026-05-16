import { Router, type IRouter } from "express";
import healthRouter from "./health";
import paymentRouter from "./payment";
import stripeRouter from "./stripe";

const router: IRouter = Router();

router.use(healthRouter);
router.use(paymentRouter);
router.use(stripeRouter);

export default router;
