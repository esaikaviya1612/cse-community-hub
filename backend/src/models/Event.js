import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema(
  {
    communityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      required: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    date: {
      type: String,
      required: true
    },

    time: {
      type: String,
      required: true
    },

    venue: {
      type: String,
      required: true
    },

    description: {
      type: String,
      default: ''
    },

    organizer: {
      type: String,
      default: ''
    },

    facultyCoordinator: {
      type: String,
      default: ''
    },

    studentCoordinator: {
      type: String,
      default: ''
    },

    /* EVENT POSTER */
    posterUrl: {
      type: String,
      default: ''
    },

    registrationRequired: {
      type: Boolean,
      default: true
    },

    registrationType: {
      type: String,
      enum: ['individual', 'team'],
      default: 'individual'
    },

    minParticipants: {
      type: Number,
      default: 1
    },

    maxParticipants: {
      type: Number,
      default: 1
    },

    registrationDeadline: {
      type: String,
      default: ''
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },

    rejectionReason: {
      type: String,
      default: ''
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    approvedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

export default mongoose.model('Event', eventSchema);