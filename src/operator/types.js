import t from 'tcomb';

/**
 * @swagger
 * definitions:
 *   Credentials:
 *     required:
 *      - username
 *      - password
 *     properties:
 *      username:
 *        type: string
 *      password:
 *        type: string
 */
t.Credentials = t.struct({
  username: t.String,
  password: t.String
});
