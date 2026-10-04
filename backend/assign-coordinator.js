import 'dotenv/config';
import mongoose from 'mongoose';

import { connectDB } from './config/db.js';
import User from './models/User.js';
import Community from './models/Community.js';

await connectDB();

try {

  const coordinator = await User.findOne({
    role: 'coordinator'
  });

  if (!coordinator) {
    throw new Error('Coordinator not found');
  }

  const communities = await Community.find({
    $or: [
      { code: 'TECH' },
      { code: 'IEI' },
      { name: 'Tech Society' },
      { name: 'IEI' }
    ]
  });

  if (communities.length === 0) {
    throw new Error('Communities not found');
  }

  coordinator.communityIds =
    communities.map(c => c._id);

  await coordinator.save();

  console.log(
    'Coordinator assigned to BOTH communities'
  );

  console.log(
    'Coordinator:',
    coordinator.name
  );

  console.log(
    'Communities:',
    communities.map(c => c.name).join(', ')
  );

} catch (error) {

  console.error(error);

} finally {

  await mongoose.connection.close();

}