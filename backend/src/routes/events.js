import express from 'express';
import Event from '../models/Event.js';
import Community from '../models/Community.js';
import Registration from '../models/Registration.js';
import {auth,allow,assigned} from '../middleware/auth.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
const r=express.Router();const manager=(e,u)=>u.role==='staff'||(u.role==='coordinator'&&e.createdBy.toString()===u._id.toString()&&assigned(u,e.communityId));
r.get('/',auth,async(req,res)=>{const q={};if(req.query.communityId)q.communityId=req.query.communityId;if(req.user.role==='student')q.status='approved';else if(req.query.status)q.status=req.query.status;res.json(await Event.find(q).populate('communityId','name code').populate('createdBy','name email').sort({date:1,time:1,createdAt:-1}))});
r.get('/pending',auth,allow('staff'),async(req,res)=>res.json(await Event.find({status:'pending'}).populate('communityId','name code').populate('createdBy','name email').sort({createdAt:1})));r.get('/mine',auth,allow('coordinator','staff'),async(req,res)=>res.json(await Event.find(req.user.role==='staff'?{}:{createdBy:req.user._id}).populate('communityId','name code').sort({createdAt:-1})));
r.get('/:id',auth,async(req,res)=>{const e=await Event.findById(req.params.id).populate('communityId','name code').populate('createdBy','name email').populate('approvedBy','name');if(!e||(req.user.role==='student'&&e.status!=='approved'))return res.status(404).json({message:'Event not found'});res.json(e)});
r.post('/',auth,allow('coordinator','staff'),async(req,res)=>{const c=await Community.findById(req.body.communityId);if(!c||!assigned(req.user,c._id))return res.status(403).json({message:'You are not assigned to this community'});const min=Number(req.body.minParticipants||1),max=Number(req.body.maxParticipants||min);if(min<1||max<min)return res.status(400).json({message:'Invalid participant limits'});const a=req.user.role==='staff';const e=await Event.create({...req.body,minParticipants:min,maxParticipants:max,createdBy:req.user._id,status:a?'approved':'pending',approvedBy:a?req.user._id:undefined,approvedAt:a?new Date():undefined});res.status(201).json(e)});
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