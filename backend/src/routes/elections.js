import express from 'express';
import Election from '../models/Election.js';
import Vote from '../models/Vote.js';
import { auth, allow } from '../middleware/auth.js';

const r = express.Router();

/* GET ACTIVE ELECTIONS */
r.get('/', auth, async (req, res) => {
  try {
    const elections = await Election.find({
      status: 'active'
    })
      .populate('communityId', 'name code')
      .sort({ createdAt: -1 });

    res.json(elections);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});


/* GET SINGLE ELECTION */
r.get('/:id', auth, async (req, res) => {
  try {
    const election = await Election.findById(req.params.id)
      .populate('communityId', 'name code');

    if (!election) {
      return res.status(404).json({
        message: 'Election not found'
      });
    }

    res.json(election);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});


/* SUBMIT VOTE */
r.post('/:id/vote', auth, allow('student'), async (req, res) => {
  try {
    const { position, candidateId } = req.body;

    if (!position || !candidateId) {
      return res.status(400).json({
        message: 'Position and candidate are required'
      });
    }

    const election = await Election.findById(req.params.id);

    if (!election) {
      return res.status(404).json({
        message: 'Election not found'
      });
    }

    if (election.status !== 'active') {
      return res.status(400).json({
        message: 'Voting is not active'
      });
    }

    const selectedPosition = election.positions.find(
      p => p.name === position
    );

    if (!selectedPosition) {
      return res.status(400).json({
        message: 'Invalid position'
      });
    }

    const candidate = selectedPosition.candidates.find(
      c => c._id.toString() === candidateId
    );

    if (!candidate) {
      return res.status(400).json({
        message: 'Invalid candidate'
      });
    }

    // CHECK ALREADY VOTED
    const existingVote = await Vote.findOne({
      electionId: election._id,
      position,
      studentId: req.user._id
    });

    if (existingVote) {
      return res.status(400).json({
        message: `You have already voted for ${position}. Your vote cannot be changed.`
      });
    }

    // SAVE FINAL VOTE
    await Vote.create({
      electionId: election._id,
      position,
      candidateId,
      studentId: req.user._id
    });

    res.status(201).json({
      message: `Your vote for ${position} has been submitted successfully.`
    });

  } catch (e) {

    // MongoDB duplicate protection
    if (e.code === 11000) {
      return res.status(400).json({
        message:
          'You have already voted for this position. Your vote cannot be changed.'
      });
    }

    res.status(500).json({
      message: e.message
    });
  }
});


/* CHECK WHETHER CURRENT STUDENT VOTED */
r.get('/:id/my-votes', auth, allow('student'), async (req, res) => {
  try {
    const votes = await Vote.find({
      electionId: req.params.id,
      studentId: req.user._id
    }).select('position candidateId');

    res.json(votes);
  } catch (e) {
    res.status(500).json({
      message: e.message
    });
  }
});


/* STAFF - VIEW RESULTS */
r.get(
  '/:id/results',
  auth,
  allow('staff'),
  async (req, res) => {
    try {
      const election = await Election.findById(req.params.id);

      if (!election) {
        return res.status(404).json({
          message: 'Election not found'
        });
      }

      const votes = await Vote.find({
        electionId: election._id
      });

      const results = election.positions.map(position => {

        const candidates = position.candidates.map(candidate => {

          const count = votes.filter(
            vote =>
              vote.position === position.name &&
              vote.candidateId.toString() ===
                candidate._id.toString()
          ).length;

          return {
            candidateId: candidate._id,
            name: candidate.name,
            registerNo: candidate.registerNo,
            votes: count
          };
        });

        return {
          position: position.name,
          candidates
        };
      });

      res.json(results);

    } catch (e) {
      res.status(500).json({
        message: e.message
      });
    }
  }
);


export default r;