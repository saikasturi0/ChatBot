
import express from "express";
import handleWebSearch from "../controllers/webSearch.js";
import { AuthenticateUser } from "../controllers/Authentication.js";

const router = express.Router();

router.post("/web-search", AuthenticateUser, handleWebSearch)


export default router;
