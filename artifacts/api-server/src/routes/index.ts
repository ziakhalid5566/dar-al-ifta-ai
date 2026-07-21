import { Router, type IRouter } from "express";
import healthRouter from "./health";
import groqRouter from "./groq.js";
import googleSearchRouter from "./googleSearch.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(groqRouter);
router.use(googleSearchRouter);

export default router;
