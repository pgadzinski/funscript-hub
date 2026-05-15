import { Router, type IRouter } from "express";
import healthRouter from "./health";
import creatorsRouter from "./creators";
import scriptsRouter from "./scripts";
import accessRouter from "./access";
import statsRouter from "./stats";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(creatorsRouter);
router.use(scriptsRouter);
router.use(accessRouter);
router.use(statsRouter);
router.use(adminRouter);

export default router;
