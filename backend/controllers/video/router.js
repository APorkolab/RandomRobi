/**
 * @swagger
 * /user:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
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
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: New user has been created
 *       500:
 *         description: Error creating user
 */

/**
 * @swagger
 * /user/all:
 *   get:
 *     summary: Retrieve all users
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: A list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   username:
 *                     type: string
 *                   email:
 *                     type: string
 *       500:
 *         description: Error fetching users
 */

/**
 * @swagger
 * /user/{id}:
 *   get:
 *     summary: Retrieve a user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the user to retrieve
 *     responses:
 *       200:
 *         description: The user information
 *       404:
 *         description: User not found
 *       500:
 *         description: Error fetching user
 */

/**
 * @swagger
 * /user/{id}:
 *   put:
 *     summary: Update a user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the user to update
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
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: The user has been updated
 *       404:
 *         description: User not found
 *       500:
 *         description: Error updating user
 */

/**
 * @swagger
 * /user/{id}:
 *   delete:
 *     summary: Delete a user by ID
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The ID of the user to delete
 *     responses:
 *       200:
 *         description: The user has been deleted
 *       404:
 *         description: User not found
 *       500:
 *         description: Error deleting user
 */
const express = require('express');
const router = express.Router();
const User = require('../../models/user');

router.post('/', async (req, res) => {
	try {
		await User.create(req.body);
		res.status(201).json({
			message: 'New user has been created.'
		});
	} catch (error) {
		console.error('Error creating user:', error);
		res.status(500).json({
			error: 'Error creating user.'
		});
	}
});

router.get('/all', async (req, res) => {
	try {
		const users = await User.findAll();
		res.json(users);
	} catch (error) {
		console.error('Error fetching users:', error);
		res.status(500).send('Error fetching users');
	}
});

router.get('/:id', async (req, res) => {
	try {
		const user = await User.findByPk(req.params.id);
		if (!user) {
			return res.status(404).send('User not found');
		}
		res.json(user);
	} catch (error) {
		console.error('Error fetching user:', error);
		res.status(500).send('Error fetching user');
	}
});

router.put('/:id', async (req, res) => {
	try {
		const updatedUser = req.body;
		if (updatedUser.password) {
			updatedUser.password = await hashPassword(updatedUser.password);
		}
		const result = await User.update(updatedUser, {
			where: {
				id: req.params.id
			}
		});
		if (result[0] === 0) {
			return res.status(404).json({
				error: 'User not found'
			});
		}
		res.status(200).json({
			message: 'The user has been updated.'
		});
	} catch (error) {
		console.error('Error updating user:', error);
		res.status(500).json({
			error: 'Error updating user'
		});
	}
});

router.delete('/:id', async (req, res) => {
	try {
		const result = await User.destroy({
			where: {
				id: req.params.id
			}
		});
		if (result === 0) {
			return res.status(404).json({
				error: 'User not found'
			});
		}
		res.status(200).json({
			message: 'The user has been deleted.'
		});
	} catch (error) {
		console.error('Error deleting user:', error);
		res.status(500).json({
			error: 'Error deleting user'
		});
	}
});

async function hashPassword(password) {
	const salt = await bcrypt.genSalt(10);
	return bcrypt.hash(password, salt);
}

module.exports = router;