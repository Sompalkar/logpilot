import { Router } from "express";
import { 
  register, 
  login, 
  getProfile, 
  refreshToken 
} from "../controller/auth.controller.js";
import { authenticateToken } from "../middleware/auth.js";

const router = Router();

// Public routes (no authentication required)
router.post('/register', register);
router.post('/login', login);

// Protected routes (authentication required)
router.get('/profile', authenticateToken, getProfile);
router.post('/refresh', authenticateToken, refreshToken);

export default router;
