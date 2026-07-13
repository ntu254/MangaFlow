import express, { Router } from "express";
import {
  displayFile,
  putLocalUpload,
} from "../modules/files/presentation/file-token.controller.js";

const router = Router();

router.put("/files/local-upload/:token", express.raw({ limit: "25mb", type: "*/*" }), putLocalUpload);
router.get("/files/display/:token", displayFile);

export default router;
