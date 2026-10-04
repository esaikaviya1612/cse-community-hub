import express from 'express';
import Community from '../models/Community.js';
import Role from '../models/Role.js';
import OfficeBearer from '../models/OfficeBearer.js';
import User from '../models/User.js';
import { auth, allow } from '../middleware/auth.js';

const r = express.Router();

/* =====================================================
   GET ALL USERS WHO CAN BE ASSIGNED AS COORDINATOR
   Staff can select students here
===================================================== */
r.get(
  '/users/coordinators',
  auth,
  allow('staff'),
  async (req, res) => {
    try {
      const users = await User.find({
        role: {
          $in: ['student', 'coordinator']
        },
        active: true
      })
        .select(
          'name email registerNo department year gender className photoUrl role'
        )
        .sort({ name: 1 });

      res.json(users);
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  }
);


/* =====================================================
   GET ALL COMMUNITIES
===================================================== */
r.get(
  '/',
  auth,
  async (req, res) => {
    try {
      const communities = await Community.find()
        .sort({ name: 1 });

      res.json(communities);
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  }
);


/* =====================================================
   GET ONE COMMUNITY + ROLES + BEARERS + COORDINATORS
===================================================== */
r.get(
  '/:id',
  auth,
  async (req, res) => {
    try {
      const community = await Community.findById(
        req.params.id
      );

      if (!community) {
        return res.status(404).json({
          message: 'Community not found'
        });
      }

      const [
        roles,
        bearers,
        coordinators
      ] = await Promise.all([
        Role.find({
          communityId: community._id,
          active: true
        }).sort({ displayOrder: 1 }),

        OfficeBearer.find({
          communityId: community._id
        }).sort({ displayOrder: 1 }),

        User.find({
          _id: { $in: community.coordinatorIds }
        })
          .select('-passwordHash')
          .sort({ name: 1 })
      ]);

      res.json({
        community,
        roles,
        bearers,
        coordinators
      });
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  }
);


/* =====================================================
   CREATE COMMUNITY
   STAFF ONLY
===================================================== */
r.post(
  '/',
  auth,
  allow('staff'),
  async (req, res) => {
    try {
      const community = await Community.create(
        req.body
      );

      res.status(201).json(community);
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  }
);


/* =====================================================
   UPDATE COMMUNITY
   STAFF ONLY
===================================================== */
r.put(
  '/:id',
  auth,
  allow('staff'),
  async (req, res) => {
    try {
      const community =
        await Community.findByIdAndUpdate(
          req.params.id,
          req.body,
          {
            new: true,
            runValidators: true
          }
        );

      if (!community) {
        return res.status(404).json({
          message: 'Community not found'
        });
      }

      res.json(community);
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  }
);


/* =====================================================
   ADD OFFICE BEARER ROLE
   STAFF ONLY
===================================================== */
r.post(
  '/:id/roles',
  auth,
  allow('staff'),
  async (req, res) => {
    try {
      const community =
        await Community.findById(req.params.id);

      if (!community) {
        return res.status(404).json({
          message: 'Community not found'
        });
      }

      const role = await Role.create({
        communityId: req.params.id,
        name: req.body.name,
        description: req.body.description || '',
        displayOrder: req.body.displayOrder || 0
      });

      res.status(201).json(role);
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  }
);


/* =====================================================
   UPDATE OFFICE BEARER ROLE
===================================================== */
r.put(
  '/roles/:id',
  auth,
  allow('staff'),
  async (req, res) => {
    try {
      const role =
        await Role.findByIdAndUpdate(
          req.params.id,
          req.body,
          {
            new: true,
            runValidators: true
          }
        );

      if (!role) {
        return res.status(404).json({
          message: 'Role not found'
        });
      }

      res.json(role);
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  }
);


/* =====================================================
   DELETE OFFICE BEARER ROLE
===================================================== */
r.delete(
  '/roles/:id',
  auth,
  allow('staff'),
  async (req, res) => {
    try {
      await Role.findByIdAndDelete(
        req.params.id
      );

      res.json({
        message: 'Role deleted'
      });
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  }
);


/* =====================================================
   ADD OFFICE BEARER
===================================================== */
r.post(
  '/:id/bearers',
  auth,
  allow('staff'),
  async (req, res) => {
    try {
      const community =
        await Community.findById(req.params.id);

      if (!community) {
        return res.status(404).json({
          message: 'Community not found'
        });
      }

      const bearer =
        await OfficeBearer.create({
          ...req.body,
          communityId: req.params.id
        });

      res.status(201).json(bearer);
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  }
);


/* =====================================================
   UPDATE OFFICE BEARER
===================================================== */
r.put(
  '/bearers/:id',
  auth,
  allow('staff'),
  async (req, res) => {
    try {
      const bearer =
        await OfficeBearer.findByIdAndUpdate(
          req.params.id,
          req.body,
          {
            new: true,
            runValidators: true
          }
        );

      if (!bearer) {
        return res.status(404).json({
          message: 'Office bearer not found'
        });
      }

      res.json(bearer);
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  }
);


/* =====================================================
   DELETE OFFICE BEARER
===================================================== */
r.delete(
  '/bearers/:id',
  auth,
  allow('staff'),
  async (req, res) => {
    try {
      await OfficeBearer.findByIdAndDelete(
        req.params.id
      );

      res.json({
        message: 'Office bearer deleted'
      });
    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  }
);


/* =====================================================
   STAFF ASSIGNS COORDINATOR
   STUDENT -> COORDINATOR
===================================================== */
r.post(
  '/:id/coordinators',
  auth,
  allow('staff'),
  async (req, res) => {
    try {
      const community =
        await Community.findById(req.params.id);

      const user =
        await User.findById(req.body.userId);

      if (!community) {
        return res.status(404).json({
          message: 'Community not found'
        });
      }

      if (!user) {
        return res.status(404).json({
          message: 'User not found'
        });
      }

      if (user.role === 'staff') {
        return res.status(400).json({
          message:
            'Staff cannot be assigned as coordinator'
        });
      }

      /* ---------------------------------------------
         CHANGE USER ROLE TO COORDINATOR
      --------------------------------------------- */
      user.role = 'coordinator';

      /* ---------------------------------------------
         ADD COMMUNITY TO USER
      --------------------------------------------- */
      if (!Array.isArray(user.communityIds)) {
        user.communityIds = [];
      }

      const alreadyAssignedToUser =
        user.communityIds.some(
          id =>
            id.toString() ===
            community._id.toString()
        );

      if (!alreadyAssignedToUser) {
        user.communityIds.push(
          community._id
        );
      }

      /* ---------------------------------------------
         ADD USER TO COMMUNITY
      --------------------------------------------- */
      if (!Array.isArray(community.coordinatorIds)) {
        community.coordinatorIds = [];
      }

      const alreadyCoordinator =
        community.coordinatorIds.some(
          id =>
            id.toString() ===
            user._id.toString()
        );

      if (!alreadyCoordinator) {
        community.coordinatorIds.push(
          user._id
        );
      }

      await user.save();
      await community.save();

      res.json({
        message:
          `${user.name} is now a coordinator`,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });

    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  }
);


/* =====================================================
   REMOVE COORDINATOR FROM COMMUNITY
===================================================== */
r.delete(
  '/:id/coordinators/:uid',
  auth,
  allow('staff'),
  async (req, res) => {
    try {
      const community =
        await Community.findById(req.params.id);

      const user =
        await User.findById(req.params.uid);

      if (!community) {
        return res.status(404).json({
          message: 'Community not found'
        });
      }

      if (!user) {
        return res.status(404).json({
          message: 'User not found'
        });
      }

      /* Remove from community */
      community.coordinatorIds =
        community.coordinatorIds.filter(
          id =>
            id.toString() !==
            user._id.toString()
        );

      /* Remove community from user */
      user.communityIds =
        user.communityIds.filter(
          id =>
            id.toString() !==
            community._id.toString()
        );

      /*
        If the coordinator has no communities
        remaining, change them back to student.
      */
      if (
        user.communityIds.length === 0 &&
        user.role === 'coordinator'
      ) {
        user.role = 'student';
      }

      await community.save();
      await user.save();

      res.json({
        message:
          'Coordinator removed successfully'
      });

    } catch (error) {
      res.status(500).json({
        message: error.message
      });
    }
  }
);

export default r;