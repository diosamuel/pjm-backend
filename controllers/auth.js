const { db } = require('../db.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jose = require('jose');
require('dotenv/config');

const register = (req, res) => {
  //CHECK EXISTING USER
  const q = 'SELECT * FROM users WHERE email = ? OR username = ?';

  db.query(q, [req.body.email, req.body.username], (err, data) => {
    if (err) return res.status(500).json(err);
    if (data.length) return res.status(409).json('User already exists!');

    //Hash the password and create a user
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(req.body.password, salt);

    const insertQuery =
      'INSERT INTO users(`username`,`email`,`password`) VALUES (?)';
    const values = [[req.body.username, req.body.email, hash]];

    db.query(insertQuery, values, (err, data) => {
      if (err) return res.status(500).json(err);
      return res.status(200).json('User has been created.');
    });
  });
};

const login = (req, res) => {
  //CHECK USER
  const q = 'SELECT * FROM users WHERE username = ?';

  db.query(q, [req.body.username], async (err, data) => {
    if (err) return res.status(500).json(err);
    if (data.length === 0) return res.status(404).json('User not found!');

    //Check password
    const isPasswordCorrect = bcrypt.compareSync(
      req.body.password,
      data[0].password
    );

    if (!isPasswordCorrect)
      return res.status(400).json('Wrong username or password!');

    const secret = new TextEncoder().encode(process.env.JWT_KEY);
    const token = await new jose.SignJWT({
      username: data[0].username,
      id: data[0].id,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .sign(secret);

    const { password, ...other } = data[0];

    res
      .cookie('access_token', token, {
        httpOnly: true,
      })
      .status(200)
      .json({
        token,
        ...other,
      });
  });
};

const logout = (req, res) => {
  res
    .clearCookie('access_token', {
      sameSite: 'none',
      secure: true,
    })
    .status(200)
    .json('User has been logged out.');
};

module.exports = {
  register,
  login,
  logout,
};
