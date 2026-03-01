const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const hashPassword = async (password) => {
  return bcrypt.hash(password, 10);
};

const comparePassword = (password, hashedPassword) => {
  if (!password || !hashedPassword) {
    console.error('❌ Missing password or hashedPassword for comparison');
    return false;
  }
  const match = bcrypt.compareSync(password, hashedPassword);
  console.log(`🔐 Password match check: ${match}. Hash starts with: ${hashedPassword.substring(0, 10)}...`);
  return match;
};

const generateToken = (user) => {
  const jwtdata = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  };
  return jwt.sign(jwtdata, process.env.JWT_SECRET, { expiresIn: '7d' });
};

module.exports = {
  hashPassword,
  comparePassword,
  generateToken
};
