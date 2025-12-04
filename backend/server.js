require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({origin: '*'}));
app.use(express.json());

// routes
const authRoutes = require('./src/routes/auth.routes');
const customersRoutes = require('./src/routes/customers.routes');
const adminsRoutes = require('./src/routes/admins.routes');
const carriersRoutes = require('./src/routes/carriers.routes');
const flightRoutes = require("./src/routes/flights.routes");
const bookingsRoutes = require('./src/routes/bookings.routes');

app.use('/api/auth', authRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/admins', adminsRoutes);
app.use('/api/carriers', carriersRoutes);
app.use("/api/flights", flightRoutes);
app.use('/api/bookings', bookingsRoutes);

app.get('/', (req, res) => res.send({ status: 'OK', ts: new Date().toISOString() }));

// global error handler
app.use((err, req, res, next) => {
  console.error('GLOBAL ERROR:', err.stack || err.message || err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

app.listen(PORT, () => {
  console.log(`Airline backend running on port ${PORT}`);
});
