const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../src/models/User').default;

const MONGO_URI = 'mongodb+srv://robbynugraha:Pr5DG8aQntBxXkHA@cluster0.qxxyqlg.mongodb.net/db_monitoringwork?retryWrites=true&w=majority&appName=Cluster0'; // Ganti dengan nama database Anda

async function createUsers() {
  await mongoose.connect(MONGO_URI);

  // Manager
  const manager = new User({
    username: 'manager',
    password: await bcrypt.hash('manager123', 10),
    role: 'manager',
  });

  // Employee
  const employee = new User({
    username: 'employee',
    password: await bcrypt.hash('employee123', 10),
    role: 'employee',
  });

  await manager.save();
  await employee.save();

  console.log('Manager and Employee created!');
  await mongoose.disconnect();
}

createUsers().catch(console.error);
