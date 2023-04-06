const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

//Post
// Routes
router.post('/login', async (req, res) => {
	try {
		const {
			username,
			password
		} = req.body;

		const user = await Users.findOne({
			where: {
				username
			}
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
				},
				'bociBociTarkaSeFuleSeFarka', {
					expiresIn: '1h'
				}
			);

			return res.json({
				accessToken,
				user: {
					...user.toJSON(),
					password: ''
				},
			});
		} else {
			return res.status(401).send('Incorrect username or password');
		}
	} catch (error) {
		console.error(error);
		return res.status(500).send('Error logging in');
	}
});

module.exports = router;