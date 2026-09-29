import express from 'express';import Community from '../models/Community.js';import Role from '../models/Role.js';import OfficeBearer from '../models/OfficeBearer.js';import User from '../models/User.js';import {auth,allow} from '../middleware/auth.js';
const r=express.Router();
r.get('/users/coordinators',auth,allow('staff'),async(req,res)=>res.json(await User.find({role:'coordinator',active:true}).select('-passwordHash').sort({name:1})));
r.get('/',auth,async(req,res)=>res.json(await Community.find().sort({name:1})));
r.get('/:id',auth,async(req,res)=>{const c=await Community.findById(req.params.id);if(!c)return res.status(404).json({message:'Community not found'});const [roles,bearers,coordinators]=await Promise.all([Role.find({communityId:c._id,active:true}).sort({displayOrder:1}),OfficeBearer.find({communityId:c._id}).sort({displayOrder:1}),User.find({_id:{$in:c.coordinatorIds}}).select('-passwordHash').sort({name:1})]);res.json({community:c,roles,bearers,coordinators})});
r.post('/',auth,allow('staff'),async(req,res)=>res.status(201).json(await Community.create(req.body)));r.put('/:id',auth,allow('staff'),async(req,res)=>res.json(await Community.findByIdAndUpdate(req.params.id,req.body,{new:true})));
r.post('/:id/roles',auth,allow('staff'),async(req,res)=>res.status(201).json(await Role.create({...req.body,communityId:req.params.id})));r.put('/roles/:id',auth,allow('staff'),async(req,res)=>res.json(await Role.findByIdAndUpdate(req.params.id,req.body,{new:true})));r.delete('/roles/:id',auth,allow('staff'),async(req,res)=>{await Role.findByIdAndDelete(req.params.id);res.json({message:'Role deleted'})});
r.post('/:id/bearers',auth,allow('staff'),async(req,res)=>res.status(201).json(await OfficeBearer.create({...req.body,communityId:req.params.id})));r.put('/bearers/:id',auth,allow('staff'),async(req,res)=>res.json(await OfficeBearer.findByIdAndUpdate(req.params.id,req.body,{new:true})));r.delete('/bearers/:id',auth,allow('staff'),async(req,res)=>{await OfficeBearer.findByIdAndDelete(req.params.id);res.json({message:'Office bearer deleted'})});
r.post('/:id/coordinators',auth,allow('staff'),async(req,res)=>{const c=await Community.findById(req.params.id),u=await User.findById(req.body.userId);if(!c||!u||u.role!=='coordinator')return res.status(400).json({message:'Valid coordinator required'});if(!c.coordinatorIds.some(x=>x.toString()===u._id.toString()))c.coordinatorIds.push(u._id);if(!u.communityIds.some(x=>x.toString()===c._id.toString()))u.communityIds.push(c._id);await c.save();await u.save();res.json({message:'Coordinator added'})});r.delete('/:id/coordinators/:uid',auth,allow('staff'),async(req,res)=>{const c=await Community.findById(req.params.id);if(!c)return res.status(404).json({message:'Community not found'});c.coordinatorIds=c.coordinatorIds.filter(x=>x.toString()!==req.params.uid);await c.save();res.json({message:'Coordinator removed'})});export default r;
r.put('/:id', auth, async (req, res) => {

  const community = await Community.findById(
    req.params.id
  );

  if (!community) {
    return res.status(404).json({
      message: 'Community not found'
    });
  }

  const allowed =
    req.user.role === 'staff' ||
    (
      req.user.role === 'coordinator' &&
      req.user.communityIds.some(
        id =>
          id.toString() ===
          req.params.id
      )
    );

  if (!allowed) {
    return res.status(403).json({
      message: 'Not allowed'
    });
  }

  if (req.body.logoUrl !== undefined) {
    community.logoUrl =
      req.body.logoUrl;
  }

  if (req.body.name !== undefined) {
    community.name =
      req.body.name;
  }

  if (req.body.description !== undefined) {
    community.description =
      req.body.description;
  }

  if (req.body.activities !== undefined) {
    community.activities =
      req.body.activities;
  }

  await community.save();

  res.json(community);
});
r.post('/:id/roles', auth, async (req, res) => {

  const community = await Community.findById(
    req.params.id
  );

  if (!community) {
    return res.status(404).json({
      message: 'Community not found'
    });
  }

  const allowed =
    req.user.role === 'staff' ||
    (
      req.user.role === 'coordinator' &&
      req.user.communityIds.some(
        id =>
          id.toString() ===
          req.params.id
      )
    );

  if (!allowed) {
    return res.status(403).json({
      message: 'Not allowed'
    });
  }

  const role = await Role.create({
    communityId: req.params.id,
    name: req.body.name,
    description: req.body.description || '',
    displayOrder: req.body.displayOrder || 0
  });

  res.status(201).json(role);
});