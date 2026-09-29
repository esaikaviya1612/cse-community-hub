import mongoose from 'mongoose';
const s=new mongoose.Schema({communityId:{type:mongoose.Schema.Types.ObjectId,ref:'Community',required:true},name:{type:String,required:true},description:String,active:{type:Boolean,default:true},displayOrder:{type:Number,default:0}},{timestamps:true});s.index({communityId:1,name:1},{unique:true});export default mongoose.model('Role',s);
