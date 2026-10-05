import express from 'express';
import Event from '../models/Event.js';
import Community from '../models/Community.js';
import Registration from '../models/Registration.js';
import {auth,allow,assigned} from '../middleware/auth.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
const uploadDir = path.join('/tmp', 'uploads', 'event-posters');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true
  });
}

const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {

    const ext =
      path.extname(file.originalname)
        .toLowerCase();

    const filename =
      `poster-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

    cb(null, filename);
  }

});

const posterUpload = multer({

  storage,

  limits: {
    fileSize: 5 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {

    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (!allowed.includes(file.mimetype)) {

      return cb(
        new Error(
          'Only JPG, PNG and WEBP images are allowed.'
        )
      );

    }

    cb(null, true);

  }

});
const r=express.Router();const manager=(e,u)=>u.role==='staff'||(u.role==='coordinator'&&e.createdBy.toString()===u._id.toString()&&assigned(u,e.communityId));
r.get('/',auth,async(req,res)=>{const q={};if(req.query.communityId)q.communityId=req.query.communityId;if(req.user.role==='student')q.status='approved';else if(req.query.status)q.status=req.query.status;res.json(await Event.find(q).populate('communityId','name code').populate('createdBy','name email').sort({date:1,time:1,createdAt:-1}))});
r.get('/pending',auth,allow('staff'),async(req,res)=>res.json(await Event.find({status:'pending'}).populate('communityId','name code').populate('createdBy','name email').sort({createdAt:1})));r.get('/mine',auth,allow('coordinator','staff'),async(req,res)=>res.json(await Event.find(req.user.role==='staff'?{}:{createdBy:req.user._id}).populate('communityId','name code').sort({createdAt:-1})));
r.get('/:id',auth,async(req,res)=>{const e=await Event.findById(req.params.id).populate('communityId','name code').populate('createdBy','name email').populate('approvedBy','name');if(!e||(req.user.role==='student'&&e.status!=='approved'))return res.status(404).json({message:'Event not found'});res.json(e)});
r.post(
  '/',
  auth,
  allow('coordinator'),
  posterUpload.single('poster'),
  async (req, res) => {
    try {
      const {
        communityId,
        name,
        date,
        time,
        venue,
        description,
        organizer,
        facultyCoordinator,
        studentCoordinator,
        registrationRequired,
        registrationType,
        minParticipants,
        maxParticipants,
        registrationDeadline
      } = req.body;

      // Check community
      const community = await Community.findById(communityId);

      if (!community) {
        return res.status(404).json({
          message: 'Community not found'
        });
      }

      // Check coordinator is assigned to this community
      if (!assigned(req.user, community._id)) {
        return res.status(403).json({
          message: 'You are not assigned to this community'
        });
      }

      const min = Number(minParticipants || 1);
      const max = Number(maxParticipants || min);

      if (min < 1 || max < min) {
        return res.status(400).json({
          message: 'Invalid participant limits'
        });
      }

      const event = await Event.create({
        communityId,
        name,
        date,
        time,
        venue,
        description,
        organizer,
        facultyCoordinator,
        studentCoordinator,

        registrationRequired:
          registrationRequired === 'true' ||
          registrationRequired === true,

        registrationType:
          registrationType || 'individual',

        minParticipants: min,
        maxParticipants: max,

        registrationDeadline,

        status: 'pending',

        createdBy: req.user._id,

        posterUrl: req.file
          ? `/uploads/event-posters/${req.file.filename}`
          : ''
      });

      res.status(201).json(event);

    } catch (error) {
      console.error('CREATE EVENT ERROR:', error);

      res.status(500).json({
        message: error.message
      });
    }
  }
);
r.put('/:id',auth,allow('coordinator','staff'),async(req,res)=>{const e=await Event.findById(req.params.id);if(!e||!manager(e,req.user))return res.status(403).json({message:'Not allowed'});if(req.user.role==='coordinator'&&e.status==='approved'){e.status='pending';e.approvedBy=undefined;e.approvedAt=undefined}Object.assign(e,req.body);await e.save();res.json(e)});r.delete('/:id',auth,allow('coordinator','staff'),async(req,res)=>{const e=await Event.findById(req.params.id);if(!e||!manager(e,req.user))return res.status(403).json({message:'Not allowed'});await Registration.deleteMany({eventId:e._id});await e.deleteOne();res.json({message:'Event deleted'})});
r.patch(
  '/:id/approve',
  auth,
  allow('staff'),
  async (req, res) => {

    try {

      const e = await Event.findById(
        req.params.id
      );

      if (!e) {
        return res.status(404).json({
          message: 'Event not found'
        });
      }

      e.status = 'approved';
      e.rejectionReason = '';
      e.approvedBy = req.user._id;
      e.approvedAt = new Date();

      await e.save();

      // Get all active users
      const users = await User.find({
        active: true
      }).select('_id');

      // Create notification for everyone
      const notifications = users.map((u) => ({
        userId: u._id,
        title: 'New Event Published',
        message:
          `${e.name} has been published. ` +
          `Date: ${e.date}, Venue: ${e.venue}`,
        type: 'event',
        eventId: e._id
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(
          notifications
        );
      }

      res.json({
        message: 'Event approved and notifications sent.',
        event: e
      });

    } catch (error) {

      res.status(500).json({
        message: error.message
      });

    }
  }
);
export default r;