import { Router } from "express";
import { ingestLog } from "../controller/ingest.controller.ts";

const router = Router()




router.get('/ingest', ingestLog);




export default router