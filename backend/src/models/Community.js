import mongoose from 'mongoose';

const communitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true
    },

    code: {
      type: String,
      required: true,
      unique: true
    },

    description: {
      type: String,
      default: ''
    },

    activities: {
      type: String,
      default: ''
    },

    logoUrl: {
      type: String,
      default: ''
    },

    coordinatorIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  {
    timestamps: true
  }
);

export default mongoose.model(
  'Community',
  communitySchema
);