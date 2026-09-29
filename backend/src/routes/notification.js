import express from 'express';

import Notification from '../models/Notification.js';

import { auth } from '../middleware/auth.js';

const r = express.Router();


// Get my notifications
r.get('/', auth, async (req, res) => {
  try {

    const notifications =
      await Notification.find({
        userId: req.user._id
      })
        .populate('eventId', 'name date time venue')
        .sort({ createdAt: -1 });

    res.json(notifications);

  } catch (e) {

    res.status(500).json({
      message: e.message
    });

  }
});


// Mark one notification as read
r.patch('/:id/read', auth, async (req, res) => {
  try {

    const notification =
      await Notification.findOneAndUpdate(
        {
          _id: req.params.id,
          userId: req.user._id
        },
        {
          read: true
        },
        {
          new: true
        }
      );

    if (!notification) {
      return res.status(404).json({
        message: 'Notification not found'
      });
    }

    res.json(notification);

  } catch (e) {

    res.status(500).json({
      message: e.message
    });

  }
});


// Mark all as read
r.patch('/read-all', auth, async (req, res) => {
  try {

    await Notification.updateMany(
      {
        userId: req.user._id,
        read: false
      },
      {
        read: true
      }
    );

    res.json({
      message: 'All notifications marked as read'
    });

  } catch (e) {

    res.status(500).json({
      message: e.message
    });

  }
});


export default r;