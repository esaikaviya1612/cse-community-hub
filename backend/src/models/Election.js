import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  registerNo: { type: String, required: true },
  photo: { type: String, default: '' }
});

const positionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  candidates: [candidateSchema]
});

const electionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },

    communityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      required: true
    },

    positions: [positionSchema],

    status: {
      type: String,
      enum: ['draft', 'active', 'closed'],
      default: 'draft'
    },

    startDate: Date,
    endDate: Date,

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

export default mongoose.model('Election', electionSchema);