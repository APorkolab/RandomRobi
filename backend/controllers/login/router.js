const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Users = require('../../models/user');

const router = express.Router();
const adminIps = new Set();

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
 *                 example: johndoe
 *               password:
 *                 type: string
 *                 example: password123
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
 *                   description: JWT token for the authenticated user
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: User ID
 *                       example: 1
 *                     username:
 *                       type: string
 *                       description: Username of the authenticated user
 *                       example: johndoe
 *                     email:
 *                       type: string
 *                       description: Email of the authenticated user
 *                       example: johndoe@example.com
 *       400:
 *         description: Bad Request - Username and password are required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Felhasználónév és jelszó megadása kötelező
 *       401:
 *         description: Unauthorized - Incorrect password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Helytelen jelszó
 *       404:
 *         description: Not Found - User does not exist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: A felhasználó nem létezik
 *       500:
 *         description: Internal Server Error - An error occurred during login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Hiba történt a bejelentkezés során
 */
// Bejelentkezési Endpoint
router.post('/login', async (req, res) => {
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

    // Jelszó összehasonlítás bcrypt használatával
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password comparison result:', isMatch); // Debugging célokra
		console.log('Kapott user jelszó:', password); // Debugging célokra
		console.log('Hashelt jelszó:', user.password); // Debugging célokra
		

    if (isMatch) {
      const accessToken = jwt.sign({
        username: user.username,
        userId: user.id
      }, process.env.JWT_SECRET || 'bociBociTarkaSeFuleSeFarka', {
        expiresIn: '1h'
      });

      adminIps.add(req.ip);

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

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Log out a user and remove their IP from the admin list
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Successful logout
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Sikeres kijelentkezés, IP eltávolítva a kivétellistáról
 *       400:
 *         description: Bad Request - IP not found in the exception list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: IP nem található a kivétellistában
 *       500:
 *         description: Internal Server Error - An error occurred during logout
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Szerver hiba történt a kijelentkezés során
 */
// Kijelentkezési Endpoint
router.post('/logout', (req, res) => {
  // Admin IP eltávolítása a kivétellistáról
  if (adminIps.has(req.ip)) {
    adminIps.delete(req.ip);
    return res.json({ message: 'Sikeres kijelentkezés, IP eltávolítva a kivétellistáról' });
  } else {
    return res.status(400).json({ message: 'IP nem található a kivétellistában' });
  }
});

module.exports = { router, adminIps };