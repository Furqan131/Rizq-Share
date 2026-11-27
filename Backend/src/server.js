require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/posts', require('./routes/food.routes'));
app.use('/api/me', require('./routes/profile.routes'));
app.use('/api/contact', require('./routes/contact.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

app.get('/', (req, res) => {
  res.json({ message: 'Hello from Rizq Share' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});