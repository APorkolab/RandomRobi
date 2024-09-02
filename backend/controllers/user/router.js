const express = require('express');
const router = express.Router();
const User = require('../../models/user');
const bcrypt = require('bcrypt');

/**
 * @swagger
 * /user:
 *   post:
 *     summary: Create a new user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
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
 *               email:
 *                 type: string
 *                 example: johndoe@example.com
 *     responses:
 *       201:
 *         description: New user has been created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: New user has been created.
 *       500:
 *         description: Error creating user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error creating user.
 */
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

/**
 * @swagger
 * /user:
 *   get:
 *     summary: Retrieve all users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
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
 *                     example: 1
 *                   username:
 *                     type: string
 *                     example: johndoe
 *                   email:
 *                     type: string
 *                     example: johndoe@example.com
 *       500:
 *         description: Error fetching users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error fetching users.
 */
router.get('/', async (req, res) => {
	try {
		const users = await User.findAll();
		res.json(users);
	} catch (error) {
		console.error('Error fetching users:', error);
		res.status(500).send('Error fetching users');
	}
});

/**
 * @swagger
 * /user/{id}:
 *   get:
 *     summary: Retrieve a user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *           example: 1
 *         required: true
 *         description: The ID of the user to retrieve
 *     responses:
 *       200:
 *         description: The user information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 username:
 *                   type: string
 *                   example: johndoe
 *                 email:
 *                   type: string
 *                   example: johndoe@example.com
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Error fetching user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error fetching user.
 */
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

/**
 * @swagger
 * /user/{id}:
 *   put:
 *     summary: Update a user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *           example: 1
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
 *                 example: johndoe_updated
 *               password:
 *                 type: string
 *                 example: newpassword123
 *               email:
 *                 type: string
 *                 example: johndoe_updated@example.com
 *     responses:
 *       200:
 *         description: The user has been updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: The user has been updated.
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Error updating user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error updating user.
 */
router.put('/:id', async (req, res) => {
	try {
		const result = await User.update(req.body, {
			where: {
				id: req.params.id
			},
			individualHooks: true
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

/**
 * @swagger
 * /user/{id}:
 *   delete:
 *     summary: Delete a user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *           example: 1
 *         required: true
 *         description: The ID of the user to delete
 *     responses:
 *       200:
 *         description: The user has been deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: The user has been deleted.
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: User not found
 *       500:
 *         description: Error deleting user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Error deleting user.
 */
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

module.exports = router;