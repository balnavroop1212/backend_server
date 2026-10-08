const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../db');
const Staff = require('../models/Staff');

async function seedTechnician() {
  console.log("🚀 Starting Technician account seeding...");
  await connectDB();

  try {
    const hashedPassword = bcrypt.hashSync('global1', 10);

    const result = await Staff.updateOne(
      { userId: '0000006' },
      {
        $setOnInsert: {
          name: 'Technician',
          userId: '0000006',
          password: hashedPassword,
          phone: '0000000000',
          role: 'Technician',
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      console.log("✅ Default Technician account (userId: 0000006) successfully seeded!");
    } else {
      console.log("ℹ️ Technician account (userId: 0000006) already exists. No action taken.");
    }
  } catch (error) {
    console.error("❌ Error seeding Technician account:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected.");
    process.exit(0);
  }
}

seedTechnician();
