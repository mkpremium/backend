var bcrypt = require('bcrypt');
const saltRounds = 10;
const myPlaintextPassword = 'P4$$w0rD';


bcrypt.hash(myPlaintextPassword, saltRounds, function(err, hash) {
  // Store hash in your password DB.
  console.log('hash', hash);
});