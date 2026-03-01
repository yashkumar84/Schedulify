const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const hashPassword = async (password) => {
  return bcrypt.hash(password, 10);
};

const comparePassword = async (password, hashedPassword) => {
  if (!password || !hashedPassword) {
    console.error('❌ Missing password or hashedPassword for comparison');
    return false;
  }
  try {
    const match = await bcrypt.compare(password, hashedPassword);
    console.log(`🔐 Password match check: ${match}. Hash starts with: ${hashedPassword.substring(0, 10)}... (Pass Length: ${password.length})`);
    return match;
  } catch (error) {
    console.error('❌ Bcrypt compare error:', error);
    return false;
  }
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
