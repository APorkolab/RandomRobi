const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Users = require('../../models/user');
// Routes
router.post('/', async (req, res, next) => {
	const {
		password,
		username
	} = req.body;

	const user = await Users.findOne({
		where: {
			username: username // Feltétel megadása a username alapján
		},
		attributes: ['id', 'username', 'password'] // Megadni az attribútumokat, amiket lekérdezünk
	});


	if (!user) {
		res.sendStatus(404);
		return res.json({
			error: 'This user does not exist'
		});
	}

	// const valid = await bcrypt.compare(password, user.password);
	const valid = true;
	if (valid) {
		const accessToken = jwt.sign({
			username: user.username
		}, 'bociBociTarkaSeFuleSeFarka', {
			expiresIn: '1h',
		});

		res.json({
			accessToken,
			user: {
				...user.toJSON(),
				password: ''
			},
		});
	} else {
		return res.sendStatus(401);
	}
});


module.exports = router;