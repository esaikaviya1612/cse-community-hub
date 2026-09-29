import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema(
  {
    electionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Election',
      required: true
    },

    position: {
      type: String,
      required: true
    },

    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },

    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

// ONE STUDENT = ONE VOTE FOR ONE POSITION
voteSchema.index(
  {
    electionId: 1,
    position: 1,
    studentId: 1
  },
  { unique: true }
);

export default mongoose.model('Vote', voteSchema);