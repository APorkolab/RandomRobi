const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
	const authHeader = req.headers.authorization;

	if (authHeader) {
		const token = authHeader.split(' ')[1];
		jwt.verify(token, 'bociBociTarkaSeFuleSeFarka', (err, video) => {
			if (err) {
				return res.sendStatus(403);
			}

			req.video = video;
			next();
		});
	} else {
		res.sendStatus(401);
	}

};