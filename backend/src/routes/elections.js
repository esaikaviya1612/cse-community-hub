import express from 'express';

import Election from '../models/Election.js';
import Vote from '../models/Vote.js';
import Community from '../models/Community.js';
import User from '../models/User.js';
import OfficeBearer from '../models/OfficeBearer.js';

import { auth, allow } from '../middleware/auth.js';


const r = express.Router();


/* =========================================================
   GET ELECTIONS
========================================================= */

r.get('/', auth, async (req, res) => {
  try {

    let filter = {};

    // Staff can see all elections
    if (req.user.role === 'staff') {
      filter = {};
    }

    // Students and coordinators can see active elections
    else if (
      req.user.role === 'student' ||
      req.user.role === 'coordinator'
    ) {
      filter = {
        status: 'active'
      };
    }

    else {
      return res.status(403).json({
        message: 'Not authorized'
      });
    }

    const elections = await Election.find(filter)
      .populate('communityId', 'name code')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(elections);

  } catch (error) {

    res.status(500).json({
      message: error.message
    });

  }
});


/* =========================================================
   GET ONE ELECTION
========================================================= */

r.get(
  '/:id',
  auth,
  async (req, res) => {

    try {

      const election = await Election.findById(
        req.params.id
      )
        .populate('communityId', 'name code')
        .populate('createdBy', 'name email');

      if (!election) {
        return res.status(404).json({
          message: 'Election not found'
        });
      }

      res.json(election);

    } catch (error) {

      res.status(500).json({
        message: error.message
      });

    }
  }
);


/* =========================================================
   STAFF CREATE ELECTION
========================================================= */

r.post(
  '/',
  auth,
  allow('staff'),
  async (req, res) => {

    try {

      const {
        title,
        communityId,
        positions,
        startDate,
        endDate
      } = req.body;


      if (!title || !communityId) {
        return res.status(400).json({
          message: 'Title and community are required'
        });
      }


      if (
        !Array.isArray(positions) ||
        positions.length === 0
      ) {
        return res.status(400).json({
          message: 'Add at least one position'
        });
      }


      /* -----------------------------------------------
         VALIDATE POSITIONS
      ------------------------------------------------ */

      for (const position of positions) {

        if (
          !position.name ||
          !position.name.trim()
        ) {
          return res.status(400).json({
            message: 'Every position must have a name'
          });
        }


        if (
          !Array.isArray(position.candidates) ||
          position.candidates.length === 0
        ) {
          return res.status(400).json({
            message:
              `Add at least one candidate for ${position.name}`
          });
        }


        for (const candidate of position.candidates) {

          if (
            !candidate.name ||
            !candidate.name.trim()
          ) {
            return res.status(400).json({
              message:
                `Candidate name is required for ${position.name}`
            });
          }

        }

      }


      const community =
        await Community.findById(communityId);


      if (!community) {
        return res.status(404).json({
          message: 'Community not found'
        });
      }


      const election = await Election.create({

        title,

        communityId,

        positions,

        startDate,

        endDate,

        createdBy: req.user._id,

        status: 'active'

      });


      res.status(201).json(election);

    } catch (error) {

      res.status(500).json({
        message: error.message
      });

    }
  }
);


/* =========================================================
   CLOSE ELECTION
   STAFF ONLY

   ALSO:
   Winner of every position becomes Office Bearer
========================================================= */

r.patch(
  '/:id/close',
  auth,
  allow('staff'),
  async (req, res) => {

    try {

      const election =
        await Election.findById(req.params.id);


      if (!election) {
        return res.status(404).json({
          message: 'Election not found'
        });
      }


      if (election.status === 'closed') {
        return res.status(400).json({
          message: 'Election is already closed'
        });
      }


      const votes =
        await Vote.find({
          electionId: election._id
        });


      const winners = [];


      /* =====================================================
         FIND WINNER FOR EACH DYNAMIC POSITION
      ===================================================== */

      for (const position of election.positions) {

        const voteCounts = {};


        /* ---------------------------------------------
           Count votes
        --------------------------------------------- */

        for (const candidate of position.candidates) {

          const count =
            votes.filter(
              vote =>
                vote.position === position.name &&
                vote.candidateId.toString() ===
                  candidate._id.toString()
            ).length;

          voteCounts[
            candidate._id.toString()
          ] = count;

        }


        /* ---------------------------------------------
           Find highest vote count
        --------------------------------------------- */

        let highestVotes = 0;
        let winner = null;


        for (const candidate of position.candidates) {

          const count =
            voteCounts[
              candidate._id.toString()
            ] || 0;


          if (count > highestVotes) {

            highestVotes = count;

            winner = candidate;

          }

        }


        /* ---------------------------------------------
           No votes
        --------------------------------------------- */

        if (!winner || highestVotes === 0) {

          winners.push({
            position: position.name,
            winner: null,
            votes: 0
          });

          continue;
        }


        /* ---------------------------------------------
           CREATE / UPDATE OFFICE BEARER
        --------------------------------------------- */

        const existingBearer =
          await OfficeBearer.findOne({
            communityId: election.communityId,
            roleId: position._id
          });


        const bearerData = {

          communityId:
            election.communityId,

          roleId:
            position._id,

          roleName:
            position.name,

          name:
            winner.name,

          year:
            winner.year || '',

          className:
            winner.className || '',

          photoUrl:
            winner.photo || '',

          bio:
            `Elected through ${election.title}`

        };


        if (existingBearer) {

          await OfficeBearer.findByIdAndUpdate(
            existingBearer._id,
            bearerData,
            {
              new: true
            }
          );

        } else {

          await OfficeBearer.create(
            bearerData
          );

        }


        winners.push({

          position:
            position.name,

          winner: {
            candidateId:
              winner._id,

            name:
              winner.name,

            registerNo:
              winner.registerNo,

            votes:
              highestVotes
          }

        });

      }


      /* =====================================================
         CLOSE ELECTION
      ===================================================== */

      election.status = 'closed';

      await election.save();


      res.json({

        message:
          'Election closed and winners assigned as office bearers',

        election,

        winners

      });


    } catch (error) {

      console.error(
        'Close election error:',
        error
      );

      res.status(500).json({
        message: error.message
      });

    }
  }
);


/* =========================================================
   STUDENT + COORDINATOR VOTE
========================================================= */

r.post(
  '/:id/vote',
  auth,
  allow('student', 'coordinator'),
  async (req, res) => {

    try {

      const {
        position,
        candidateId
      } = req.body;


      if (!position || !candidateId) {

        return res.status(400).json({
          message:
            'Position and candidate are required'
        });

      }


      const election =
        await Election.findById(
          req.params.id
        );


      if (!election) {

        return res.status(404).json({
          message: 'Election not found'
        });

      }


      if (election.status !== 'active') {

        return res.status(400).json({
          message: 'Voting is closed'
        });

      }


      /* =====================================================
         FIND POSITION
      ===================================================== */

      const selectedPosition =
        election.positions.find(
          p => p.name === position
        );


      if (!selectedPosition) {

        return res.status(400).json({
          message: 'Invalid position'
        });

      }


      /* =====================================================
         FIND CANDIDATE
      ===================================================== */

      const candidate =
        selectedPosition.candidates.find(
          c =>
            c._id.toString() ===
            candidateId.toString()
        );


      if (!candidate) {

        return res.status(400).json({
          message: 'Invalid candidate'
        });

      }


      /* =====================================================
         CHECK WHETHER USER ALREADY VOTED
      ===================================================== */

      const existingVote =
        await Vote.findOne({

          electionId:
            election._id,

          position,

          studentId:
            req.user._id

        });


      if (existingVote) {

        return res.status(400).json({
          message: 'Already Voted'
        });

      }


      /* =====================================================
         SAVE FINAL VOTE
      ===================================================== */

      const vote =
        await Vote.create({

          electionId:
            election._id,

          position,

          candidateId,

          studentId:
            req.user._id

        });


      res.status(201).json({

        message:
          'Vote submitted successfully',

        vote

      });


    } catch (error) {

      /* MongoDB unique-index protection */

      if (error.code === 11000) {

        return res.status(400).json({
          message: 'Already Voted'
        });

      }


      res.status(500).json({
        message: error.message
      });

    }
  }
);


/* =========================================================
   MY VOTES
   STUDENT + COORDINATOR
========================================================= */

r.get(
  '/:id/my-votes',
  auth,
  allow('student', 'coordinator'),
  async (req, res) => {

    try {

      const votes =
        await Vote.find({

          electionId:
            req.params.id,

          studentId:
            req.user._id

        });


      res.json(votes);

    } catch (error) {

      res.status(500).json({
        message: error.message
      });

    }
  }
);


/* =========================================================
   STAFF RESULTS
========================================================= */

r.get(
  '/:id/results',
  auth,
  allow('staff'),
  async (req, res) => {

    try {

      const election =
        await Election.findById(
          req.params.id
        );


      if (!election) {

        return res.status(404).json({
          message: 'Election not found'
        });

      }


      const votes =
        await Vote.find({
          electionId:
            election._id
        });


      const results =
        election.positions.map(
          position => {

            const candidates =
              position.candidates.map(
                candidate => {

                  const count =
                    votes.filter(
                      vote =>
                        vote.position ===
                          position.name &&
                        vote.candidateId
                          .toString() ===
                          candidate._id.toString()
                    ).length;


                  return {

                    candidateId:
                      candidate._id,

                    name:
                      candidate.name,

                    registerNo:
                      candidate.registerNo,

                    photo:
                      candidate.photo,

                    votes:
                      count

                  };

                }
              );


            return {

              position:
                position.name,

              candidates

            };

          }
        );


      res.json({

        election:
          election.title,

        status:
          election.status,

        results

      });


    } catch (error) {

      res.status(500).json({
        message: error.message
      });

    }
  }
);
r.patch(
  '/:id/close',
  auth,
  allow('staff'),
  async (req, res) => {

    try {

      const election =
        await Election.findById(
          req.params.id
        );

      if (!election) {

        return res.status(404).json({
          message: 'Election not found'
        });

      }


      if (
        election.status === 'closed'
      ) {

        return res.status(400).json({
          message: 'Election already closed'
        });

      }


      const community =
        await Community.findById(
          election.communityId
        );

      if (!community) {

        return res.status(404).json({
          message: 'Community not found'
        });

      }


      /*
       * PROCESS EACH POSITION
       */

      for (
        const position
        of election.positions
      ) {

        if (
          !position.candidates ||
          position.candidates.length === 0
        ) {
          continue;
        }


        /*
         * GET VOTES
         */

        const voteCounts =
          await Vote.aggregate([
            {
              $match: {
                electionId:
                  election._id,

                position:
                  position.name
              }
            },

            {
              $group: {
                _id:
                  '$candidateId',

                votes: {
                  $sum: 1
                }
              }
            },

            {
              $sort: {
                votes: -1
              }
            }
          ]);


        if (
          voteCounts.length === 0
        ) {
          continue;
        }


        /*
         * WINNER
         */

        const winnerVote =
          voteCounts[0];


        const winner =
          position.candidates.find(
            candidate =>
              candidate._id.toString() ===
              winnerVote._id.toString()
          );


        if (!winner) {
          continue;
        }


        /*
         * GET USER DETAILS
         */

        const winnerUser =
          await User.findById(
            winner.userId
          );


        if (!winnerUser) {
          continue;
        }


        /*
         * UPDATE / CREATE OFFICE BEARER
         */

        await OfficeBearer.findOneAndUpdate(
          {
            communityId:
              election.communityId,

            roleId:
              position.roleId
          },

          {
            communityId:
              election.communityId,

            roleId:
              position.roleId,

            roleName:
              position.name,

            name:
              winnerUser.name,

            year:
              winnerUser.year || '',

            className:
              winnerUser.className || '',

            photoUrl:
              winnerUser.photoUrl || '',

            bio:
              `Elected through ${election.title}`,

            displayOrder:
              position._id
          },

          {
            upsert: true,

            new: true,

            setDefaultsOnInsert: true
          }
        );

      }


      /*
       * CLOSE ELECTION
       */

      election.status =
        'closed';

      election.endDate =
        new Date();

      await election.save();


      res.json({
        message:
          'Election closed and winners assigned successfully.',

        election
      });

    } catch (error) {

      console.error(
        'CLOSE ELECTION ERROR:',
        error
      );

      res.status(500).json({
        message:
          error.message
      });

    }

  }
);

export default r;