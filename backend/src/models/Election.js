import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },

    registerNo: {
      type: String,
      default: ''
    },

    photo: {
      type: String,
      default: ''
    }
  },
  { _id: true }
);

const positionSchema = new mongoose.Schema(
  {
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      required: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    candidates: {
      type: [candidateSchema],
      default: []
    }
  },
  { _id: true }
);

const electionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    communityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      required: true
    },

    positions: {
      type: [positionSchema],
      required: true,
      default: []
    },

    status: {
      type: String,
      enum: ['draft', 'active', 'closed'],
      default: 'active'
    },

    startDate: {
      type: Date,
      default: Date.now
    },

    endDate: {
      type: Date,
      default: null
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Election', electionSchema);