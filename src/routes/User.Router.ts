import { Router } from "express";
import { body } from "express-validator";
import { validateEnpoint } from "../middlewares/validatorEnpoint";
import { createUser, updateUser } from "../controllers/User.Controller";
import { validateEmailUserExist } from "../middlewares/validator-custom";

const userRouter = Router();

/**
 * @swagger
 * /createUser:
 *   post:
 *     tags:
 *       - Users
 *     summary: Add a new user
 *     description: Add a new user.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identification:
 *                 type: string
 *               name:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               idUser:
 *                 type: number          
 *     responses:
 *       200:
 *         description: User added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: object
 *                   properties:
 *                     translationKey:
 *                       type: string
 *                       example: user.successfull
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 400
 *                 message:
 *                   type: object
 *                   properties:
 *                     translationKey:
 *                       type: string
 *                       example: user.error_invalid_data
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
userRouter.post("/createUser",
    [
        body("identification", "user.required_field_text").isString().notEmpty(),
        body("name", "user.required_field_text").isString().notEmpty(),
        body("lastName", "user.required_field_text").isString().notEmpty(),
        body("email").custom(validateEmailUserExist),
        body("password", "user.required_field_text").isString().notEmpty(),
        validateEnpoint
    ],
    createUser
);

/**
 * @swagger
 * /updateUser/{idUser}:
 *   put:
 *     tags:
 *       - Users
 *     summary: Update an existing user
 *     description: Update an existing user by ID.
 *     parameters:
 *       - in: path
 *         name: idUser
 *         required: true
 *         description: The ID of the user to update
 *         schema:
 *           type: number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identification:
 *                 type: string
 *               name:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: object
 *                   properties:
 *                     translationKey:
 *                       type: string
 *                       example: user.successfull
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 400
 *                 message:
 *                   type: object
 *                   properties:
 *                     translationKey:
 *                       type: string
 *                       example: user.error_invalid_data
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 404
 *                 message:
 *                   type: object
 *                   properties:
 *                     translationKey:
 *                       type: string
 *                       example: user.not_found
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
userRouter.put("/updateUser/:idUser",
  body("identification").optional().isString(),
  body("name").optional().isString(),
  body("lastName").optional().isString(),
  body("email").optional().isString(),
  validateEnpoint,
  updateUser
);

export default userRouter;