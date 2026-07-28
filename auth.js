const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');

const SECRET = 'smartfishhub2026';

// SAJILI MTUMIAJI MPYA
async function sajili(jina, simu, nywila, role) {
  return new Promise((resolve, reject) => {
    const hashed = bcrypt.hashSync(nywila, 10);
    db.run(
      `INSERT INTO users (jina, simu, nywila, role) VALUES (?, ?, ?, ?)`,
      [jina, simu, hashed, role],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            reject(new Error('Namba ya simu hii tayari imesajiliwa!'));
          } else {
            reject(err);
          }
        } else {
          resolve({ user_id: this.lastID, jina, simu, role });
        }
      }
    );
  });
}

// INGIA
async function ingia(simu, nywila) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM users WHERE simu = ?`,
      [simu],
      (err, user) => {
        if (err) return reject(err);
        if (!user) return reject(new Error('Namba ya simu haijapatikana!'));
        const sawa = bcrypt.compareSync(nywila, user.nywila);
        if (!sawa) return reject(new Error('Nywila si sahihi!'));
        const token = jwt.sign(
          { user_id: user.user_id, jina: user.jina, role: user.role, simu: user.simu },
          SECRET,
          { expiresIn: '7d' }
        );
        resolve({ token, jina: user.jina, role: user.role, user_id: user.user_id });
      }
    );
  });
}

// THIBITISHA TOKEN
function thibitisha(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = { sajili, ingia, thibitisha };