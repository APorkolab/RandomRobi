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
	const { username, password } = req.body;

	if (!username || !password) {
		return res.status(400).json({
			error: 'Felhasználónév és jelszó megadása kötelező'
		});
	}

	try {
		const user = await Users.findOne({
			where: { username },
			attributes: ['id', 'username', 'password', 'email']
		});

		if (!user) {
			return res.status(404).json({
				error: 'A felhasználó nem létezik'
			});
		}

		const valid = await bcrypt.compare(password, user.password);
		if (valid) {
			const accessToken = jwt.sign({
				username: user.username,
				userId: user.id
			}, process.env.JWT_SECRET, {
				expiresIn: '1h'
			});
			return res.json({
				accessToken,
				user: {
					id: user.id,
					username: user.username,
					email: user.email
				}
			});
		} else {
			return res.status(401).json({
				error: 'Helytelen jelszó'
			});
		}
	} catch (error) {
		console.error('Bejelentkezési hiba:', error);
		return res.status(500).json({
			error: 'Hiba történt a bejelentkezés során'
		});
	}
});

module.exports = router;