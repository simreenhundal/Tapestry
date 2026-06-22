import { Router, type IRouter } from "express";
import healthRouter from "./health";
import employeesRouter from "./employees";
import contextInsightRouter from "./context-insight";

const router: IRouter = Router();

router.use(healthRouter);
router.use(employeesRouter);
router.use(contextInsightRouter);

export default router;
