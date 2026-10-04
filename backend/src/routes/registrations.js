import express from 'express';

import Registration from '../models/Registration.js';
import Event from '../models/Event.js';
import { auth, allow } from '../middleware/auth.js';

const r = express.Router();


// STUDENT: REGISTER FOR EVENT
r.post(
  '/events/:id/register',
  auth,
  allow('student'),
  async (req, res) => {
    try {
      const event = await Event.findById(
        req.params.id
      );

      if (!event) {
        return res.status(404).json({
          message: 'Event not found'
        });
      }

      if (event.status !== 'approved') {
        return res.status(400).json({
          message: 'Event is not published yet'
        });
      }

      const existing =
        await Registration.findOne({
          eventId: event._id,
          studentId: req.user._id
        });

      if (existing) {
        return res.status(400).json({
          message: 'Already registered'
        });
      }

      const registration =
        await Registration.create({
          ...req.body,
          eventId: event._id,
          studentId: req.user._id
        });

      res.status(201).json(registration);

    } catch (e) {
      res.status(500).json({
        message: e.message
      });
    }
  }
);


// STUDENT: MY REGISTRATIONS
r.get(
  '/my-registrations',
  auth,
  allow('student'),
  async (req, res) => {
    try {

      const registrations =
        await Registration.find({
          studentId: req.user._id
        })
          .populate({
            path: 'eventId',
            populate: {
              path: 'communityId',
              select: 'name code'
            }
          })
          .sort({
            createdAt: -1
          });

      res.json(registrations);

    } catch (e) {

      res.status(500).json({
        message: e.message
      });

    }
  }
);
// STAFF / COORDINATOR: VIEW EVENT REGISTRATIONS
r.get(
  '/events/:id/registrations',
  auth,
  allow('coordinator', 'staff'),
  async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);

      if (!event) {
        return res.status(404).json({
          message: 'Event not found'
        });
      }

      if (
        req.user.role === 'coordinator' &&
        event.createdBy.toString() !== req.user._id.toString()
      ) {
        return res.status(403).json({
          message: 'You are not allowed to view these registrations'
        });
      }

      const registrations =
        await Registration.find({
          eventId: event._id
        })
          .populate(
            'studentId',
            'name email registerNo department year gender'
          )
          .sort({
            createdAt: 1
          });

      res.json(registrations);

    } catch (e) {
      res.status(500).json({
        message: e.message
      });
    }
  }
);

// EXPORT ROUTER
export default r;