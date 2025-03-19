import { Router } from "express";
import { body } from "express-validator";
import { login } from "../controllers/Login.Controller";
import { validateEnpoint } from "../middlewares/validatorEnpoint";

const loginRouter = Router();

/**
 * @swagger
 * /login:
 *   post:
 *     tags:
 *       - Login
 *     summary: Login
 *     description: Allows a user to log in with their email and password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: user email.
 *               password:
 *                 type: string
 *                 description: user password.
 *             required:
 *               - email
 *               - password
 *     responses:
 *       200:
 *         description: login 
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   user:
 *                     type: string
 *                   token:
 *                     type: string
 *                   expireIn:
 *                     type: number
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                 message:
 *                   type: object
 *                   properties:
 *                     translationKey:
 *                       type: string
 *                       example: login.error_invalid_data
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
loginRouter.post(
    "/login",
    [
        body("email").notEmpty().withMessage("login.file_required").isString().withMessage("login.file_required_tex"),
        body("password").notEmpty().withMessage("login.file_required_password").isString().withMessage("login.file_required_tex"),
        validateEnpoint
    ], 
    login
);

export default loginRouter;