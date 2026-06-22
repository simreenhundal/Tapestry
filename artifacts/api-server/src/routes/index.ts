import { Router, type IRouter } from "express";
import healthRouter from "./health";
import employeesRouter from "./employees";
import contextInsightRouter from "./context-insight";
import calendarRouter from "./calendar";

const router: IRouter = Router();

router.use(healthRouter);
router.use(employeesRouter);
router.use(contextInsightRouter);
router.use(calendarRouter);

export default router;
