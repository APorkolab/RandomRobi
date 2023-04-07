const express = require('express');
const router = express.Router();
const User = require('../../models/user');
const bcrypt = require('bcrypt');

// CREATE
router.post('/', async (req, res) => {
	try {
		await User.create(req.body);
		res.status(201).json({
			message: 'New user has been created.'
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({
			error: 'Error creating user.'
		});
	}
});

// READ ALL
router.get('/all', async (req, res) => {
	try {
		const users = await User.findAll();
		res.json(users);
	} catch (error) {
		console.error(error);
		res.status(500).send('Error fetching users');
	}
});

// READ ONE
router.get('/:id', async (req, res) => {
	try {
		const user = await User.findByPk(req.params.id);
		if (!user) {
			res.status(404).send('User not found');
		} else {
			res.json(user);
		}
	} catch (error) {
		console.error(error);
		res.status(500).send('Error fetching user');
	}
});

// UPDATE
const hashPassword = async (password) => {
	const salt = await bcrypt.genSalt(10);
	return bcrypt.hash(password, salt);
};

router.put('/:id', async (req, res) => {
	try {
		let updatedUser = req.body;
		if (updatedUser.password) {
			updatedUser.password = await hashPassword(updatedUser.password);
		}
		const result = await User.update(updatedUser, {
			where: {
				id: req.params.id
			}
		});
		if (result[0] === 0) {
			res.status(404).json({
				error: 'User not found'
			});
		} else {
			res.status(200).json({
				message: 'The user has been updated.'
			});
		}
	} catch (error) {
		console.error(error);
		res.status(500).json({
			error: 'Error updating user'
		});
	}
});


// DELETE
router.delete('/:id', async (req, res) => {
	try {
		const result = await User.destroy({
			where: {
				id: req.params.id
			}
		});
		if (result === 0) {
			res.status(404).json({
				error: 'User not found'
			});
		} else {
			res.status(200).json({
				message: 'The user has been deleted.'
			});
		}
	} catch (error) {
		console.error(error);
		res.status(500).json({
			error: 'Error deleting user'
		});
	}
});

module.exports = router;