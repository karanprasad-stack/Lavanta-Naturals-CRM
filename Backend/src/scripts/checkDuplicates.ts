import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { TaskModel } from '../models/Task.js';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const tasks = await TaskModel.find({});
  let duplicatesFound = 0;
  for (const t of tasks) {
    if (Array.isArray(t.assignees)) {
      const ids = t.assignees.map(a => a.toString());
      const uniqueIds = Array.from(new Set(ids));
      if (ids.length !== uniqueIds.length) {
        console.log('Task with duplicate assignees:', t._id, t.title, ids);
        duplicatesFound++;
        // Fix and normalize
        t.assignees = uniqueIds.map(id => new mongoose.Types.ObjectId(id)) as any;
        if (t.assignedTo && !uniqueIds.includes(t.assignedTo.toString())) {
          t.assignedTo = t.assignees[0];
        }
        await t.save();
        console.log('Normalized task:', t._id);
      }
    }
  }
  console.log('Total tasks checked:', tasks.length, 'Duplicates found & fixed:', duplicatesFound);
  await mongoose.disconnect();
}
main();
