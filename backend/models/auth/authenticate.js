const jwt = require('jsonwebtoken');

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

module.exports = (req, res, next) => {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return res.sendStatus(401); // Unauthorized
	}

	const token = authHeader.split(' ')[1];
	const secret = process.env.JWT_SECRET || (process.env.NODE_ENV === 'development' ? 'bociBociTarkaSeFuleSeFarka' : 'bociBociTarkaSeFuleSeFarka');

	jwt.verify(token, secret, (err, user) => {
		if (err) {
			return res.sendStatus(403); // Forbidden
		}
		req.user = user;
		next();
	});
};