import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    passwordHash: {
      type: String,
      required: true
    },

    role: {
      type: String,
      enum: ['student', 'coordinator', 'staff'],
      default: 'student'
    },

    registerNo: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },

    department: {
      type: String,
      default: ''
    },

    year: {
      type: String,
      default: ''
    },

    gender: {
      type: String,
      default: ''
    },

    className: {
      type: String,
      default: ''
    },

    photoUrl: {
      type: String,
      default: ''
    },

    communityIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community'
      }
    ],

    active: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('User', userSchema);