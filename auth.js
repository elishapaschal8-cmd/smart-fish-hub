const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');

const SECRET = 'smartfishhub2026';

function sajili(jina, simu, nywila, role) {
  const hashed = bcrypt.hashSync(nywila, 10);
  try {
    const stmt = db.prepare(`INSERT INTO users (jina, simu, nywila, role) VALUES (?, ?, ?, ?)`);
    const result = stmt.run(jina, simu, hashed, role);
    return { user_id: result.lastInsertRowid, jina, simu, role };
  } catch(err) {
    if (err.message.includes('UNIQUE')) {
      throw new Error('Namba ya simu hii tayari imesajiliwa!');
    }
    throw err;
  }
}

function ingia(simu, nywila) {
  const user = db.prepare(`SELECT * FROM users WHERE simu = ?`).get(simu);
  if (!user) throw new Error('Namba ya simu haijapatikana!');
  const sawa = bcrypt.compareSync(nywila, user.nywila);
  if (!sawa) throw new Error('Nywila si sahihi!');
  const token = jwt.sign(
    { user_id: user.user_id, jina: user.jina, role: user.role, simu: user.simu },
    SECRET,
    { expiresIn: '7d' }
  );
  return { token, jina: user.jina, role: user.role, user_id: user.user_id };
}

function thibitisha(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = { sajili, ingia, thibitisha };