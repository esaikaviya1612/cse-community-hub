import express from 'express';

import Enquiry from '../models/Enquiry.js';
import User from '../models/User.js';

import { auth, allow } from '../middleware/auth.js';

const r = express.Router();


// =====================================================
// STUDENT - CREATE FEEDBACK / ENQUIRY
// =====================================================

r.post(
  '/',
  auth,
  allow('student'),
  async (req, res) => {
    try {

      const {
        type,
        subject,
        message
      } = req.body;

      if (!type || !subject || !message) {
        return res.status(400).json({
          message: 'Type, subject and message are required'
        });
      }

      const enquiry = await Enquiry.create({
        userId: req.user._id,
        type,
        subject,
        message
      });

      res.status(201).json({
        message: 'Feedback / enquiry submitted successfully',
        enquiry
      });

    } catch (error) {

      res.status(500).json({
        message: error.message
      });

    }
  }
);


// =====================================================
// STUDENT - MY ENQUIRIES
// =====================================================

r.get(
  '/mine',
  auth,
  allow('student'),
  async (req, res) => {
    try {

      const enquiries = await Enquiry.find({
        userId: req.user._id
      })
        .populate('assignedTo', 'name email role')
        .sort({ createdAt: -1 });

      res.json(enquiries);

    } catch (error) {

      res.status(500).json({
        message: error.message
      });

    }
  }
);


// =====================================================
// STAFF - VIEW ALL
// =====================================================

r.get(
  '/',
  auth,
  allow('staff'),
  async (req, res) => {
    try {

      const enquiries = await Enquiry.find()
        .populate('userId', 'name email registerNo department year')
        .populate('assignedTo', 'name email role')
        .sort({ createdAt: -1 });

      res.json(enquiries);

    } catch (error) {

      res.status(500).json({
        message: error.message
      });

    }
  }
);


// =====================================================
// STAFF - GET COORDINATORS
// =====================================================

r.get(
  '/coordinators',
  auth,
  allow('staff'),
  async (req, res) => {
    try {

      const coordinators = await User.find({
        role: 'coordinator',
        active: true
      })
        .select('_id name email communityIds')
        .populate('communityIds', 'name code');

      res.json(coordinators);

    } catch (error) {

      res.status(500).json({
        message: error.message
      });

    }
  }
);


// =====================================================
// STAFF - ASSIGN TO COORDINATOR
// =====================================================

r.patch(
  '/:id/assign',
  auth,
  allow('staff'),
  async (req, res) => {
    try {

      const {
        coordinatorId
      } = req.body;

      if (!coordinatorId) {
        return res.status(400).json({
          message: 'Coordinator is required'
        });
      }

      const coordinator =
        await User.findOne({
          _id: coordinatorId,
          role: 'coordinator',
          active: true
        });

      if (!coordinator) {
        return res.status(404).json({
          message: 'Coordinator not found'
        });
      }

      const enquiry =
        await Enquiry.findById(req.params.id);

      if (!enquiry) {
        return res.status(404).json({
          message: 'Enquiry not found'
        });
      }

      enquiry.assignedTo = coordinator._id;
      enquiry.status = 'Assigned';

      await enquiry.save();

      res.json({
        message: 'Issue redirected to coordinator',
        enquiry
      });

    } catch (error) {

      res.status(500).json({
        message: error.message
      });

    }
  }
);


// =====================================================
// COORDINATOR - MY ASSIGNED ISSUES
// =====================================================

r.get(
  '/assigned',
  auth,
  allow('coordinator'),
  async (req, res) => {
    try {

      const enquiries = await Enquiry.find({
        assignedTo: req.user._id
      })
        .populate(
          'userId',
          'name email registerNo department year'
        )
        .sort({ createdAt: -1 });

      res.json(enquiries);

    } catch (error) {

      res.status(500).json({
        message: error.message
      });

    }
  }
);


// =====================================================
// COORDINATOR - RESOLVE ISSUE
// =====================================================

r.patch(
  '/:id/resolve',
  auth,
  allow('coordinator'),
  async (req, res) => {
    try {

      const enquiry =
        await Enquiry.findOne({
          _id: req.params.id,
          assignedTo: req.user._id
        });

      if (!enquiry) {
        return res.status(404).json({
          message: 'Assigned enquiry not found'
        });
      }

      enquiry.coordinatorReply =
        req.body.reply || '';

      enquiry.status = 'Resolved';

      await enquiry.save();

      res.json({
        message: 'Issue marked as resolved',
        enquiry
      });

    } catch (error) {

      res.status(500).json({
        message: error.message
      });

    }
  }
);


// =====================================================
// STUDENT - VIEW ONE
// =====================================================

r.get(
  '/:id',
  auth,
  async (req, res) => {
    try {

      const enquiry =
        await Enquiry.findById(req.params.id)
          .populate(
            'userId',
            'name email registerNo department year'
          )
          .populate(
            'assignedTo',
            'name email role'
          );

      if (!enquiry) {
        return res.status(404).json({
          message: 'Enquiry not found'
        });
      }

      if (
        req.user.role === 'student' &&
        enquiry.userId._id.toString() !==
          req.user._id.toString()
      ) {
        return res.status(403).json({
          message: 'Not allowed'
        });
      }

      res.json(enquiry);

    } catch (error) {

      res.status(500).json({
        message: error.message
      });

    }
  }
);


export default r;