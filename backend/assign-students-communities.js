import 'dotenv/config';
import mongoose from 'mongoose';

import { connectDB } from './config/db.js';
import User from './models/User.js';
import Community from './models/Community.js';

await connectDB();

try {
  const tech = await Community.findOne({
    $or: [
      { code: 'TECH' },
      { name: 'Tech Society' }
    ]
  });

  const iei = await Community.findOne({
    $or: [
      { code: 'IEI' },
      { name: 'IEI' }
    ]
  });

  if (!tech) {
    throw new Error('Tech Society community not found');
  }

  if (!iei) {
    throw new Error('IEI community not found');
  }

  const result = await User.updateMany(
    { role: 'student' },
    {
      $set: {
        communityIds: [
          tech._id,
          iei._id
        ]
      }
    }
  );

  console.log('Students updated:', result.modifiedCount);

  console.log('Tech Society:', tech._id);
  console.log('IEI:', iei._id);

  console.log(
    'All students can now vote in both communities.'
  );

} catch (error) {
  console.error(error);
} finally {
  await mongoose.connection.close();
}