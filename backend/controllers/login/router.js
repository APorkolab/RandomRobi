/**
 * @swagger
 * /login:
 *   post:
 *     summary: Authenticate a user and return a JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Users = require('../../models/user');

router.post('/', async (req, res) => {
	const {
		username,
		password
	} = req.body;

	try {
		const user = await Users.findOne({
			where: {
				username
			},
			attributes: ['id', 'username', 'password']
		});

		if (!user) {
			return res.status(404).json({
				error: 'This user does not exist'
			});
		}

		const valid = await bcrypt.compare(password, user.password);
		if (valid) {
			const accessToken = jwt.sign({
				username: user.username
			}, process.env.JWT_SECRET, {
				expiresIn: '1h'
			});
			return res.json({
				accessToken,
				user: {
					...user.toJSON(),
					password: ''
				}
			});
		} else {
			return res.sendStatus(401);
		}
	} catch (error) {
		console.error('Login error:', error);
		res.status(500).json({
			error: 'An error occurred during login'
		});
	}
});

module.exports = router;