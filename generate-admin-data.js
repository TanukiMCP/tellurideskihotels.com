const crypto = require('crypto');

const ADMIN_EMAIL = 'admin@tellurideskihotels.com';
const ADMIN_PASSWORD = 'Voy79262!@#';
const ADMIN_NAME = 'Administrator';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

const user = {
  id: crypto.randomBytes(16).toString('hex'),
  email: ADMIN_EMAIL,
  name: ADMIN_NAME,
  passwordHash: hashPassword(ADMIN_PASSWORD),
};

console.log(JSON.stringify(user, null, 2));

