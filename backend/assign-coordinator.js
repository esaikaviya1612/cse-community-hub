import 'dotenv/config';
import { connectDB } from './src/config/db.js';
import User from './src/models/User.js';
import Community from './src/models/Community.js';

await connectDB();

const coordinator = await User.findOne({
  email: 'coordinator@csehub.local'
});

if (!coordinator) {
  console.log('Coordinator not found');
  process.exit(1);
}

const communities = await Community.find({
  name: { $in: ['Tech Society', 'IEI'] }
});

if (communities.length !== 2) {
  console.log('Could not find both communities');
  process.exit(1);
}

coordinator.communityIds = communities.map(c => c._id);
await coordinator.save();

for (const community of communities) {
  if (!community.coordinatorIds.some(
    id => id.toString() === coordinator._id.toString()
  )) {
    community.coordinatorIds.push(coordinator._id);
    await community.save();
  }
}

console.log('Coordinator assigned to BOTH communities');
console.log('Coordinator:', coordinator.name);
console.log('Communities:', communities.map(c => c.name).join(', '));

process.exit(0);