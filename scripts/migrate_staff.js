const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('../db');
const User = require('../models/User');
const Staff = require('../models/Staff');

async function migrateStaff() {
  console.log("🚀 Starting staff data migration...");
  await connectDB();

  try {
    // 1. Find all users with staff roles (role !== 'user')
    const staffToMigrate = await mongoose.connection.collection('users').find({ role: { $ne: 'user' } }).toArray();

    if (!staffToMigrate || staffToMigrate.length === 0) {
      console.log("ℹ️ No staff/admin users found in 'users' collection. Migration skipped.");
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log(`🔍 Found ${staffToMigrate.length} non-user record(s) in 'users' collection to migrate.`);

    // Filter out any documents that might already exist in 'staff' to ensure idempotency
    const existingStaffIds = new Set(
      (await Staff.find({}, 'userId').lean()).map(s => s.userId)
    );

    const newStaffDocs = staffToMigrate.filter(doc => !existingStaffIds.has(doc.userId));

    if (newStaffDocs.length > 0) {
      // 2. Insert into 'staff' collection
      const inserted = await Staff.insertMany(newStaffDocs, { ordered: false });
      console.log(`✅ Successfully inserted ${inserted.length} record(s) into 'staff' collection.`);
    } else {
      console.log("ℹ️ All non-user records already exist in 'staff' collection.");
    }

    // 3. Delete migrated records from 'users' collection
    const migratedIds = staffToMigrate.map(doc => doc._id);
    const deleteResult = await mongoose.connection.collection('users').deleteMany({ _id: { $in: migratedIds } });
    console.log(`🗑️ Successfully deleted ${deleteResult.deletedCount} migrated record(s) from 'users' collection.`);

    console.log("🎉 Staff migration completed successfully!");
  } catch (error) {
    console.error("❌ Error during staff migration:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected.");
    process.exit(0);
  }
}

migrateStaff();
