import express from 'express';
import XLSX from 'xlsx';

import Registration from '../models/Registration.js';
import Event from '../models/Event.js';
import { auth, allow } from '../middleware/auth.js';

const r = express.Router();


// DOWNLOAD EVENT REGISTRATIONS AS EXCEL
r.get(
  '/events/:id/excel',
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


      // Coordinator can download only their own event
      if (
        req.user.role === 'coordinator' &&
        event.createdBy.toString() !==
          req.user._id.toString()
      ) {
        return res.status(403).json({
          message:
            'You are not allowed to download these registrations'
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


      const data = registrations.map(
        (registration, index) => ({
          'S.No': index + 1,

          'Name':
            registration.studentId?.name || '',

          'Email':
            registration.studentId?.email || '',

          'Register No':
            registration.studentId?.registerNo || '',

          'Department':
            registration.studentId?.department || '',

          'Year':
            registration.studentId?.year || '',

          'Gender':
            registration.studentId?.gender || '',

          'Registered At':
            registration.createdAt
              ? new Date(
                  registration.createdAt
                ).toLocaleString()
              : ''
        })
      );


      // Create Excel worksheet
      const worksheet =
        XLSX.utils.json_to_sheet(data);


      // Create workbook
      const workbook =
        XLSX.utils.book_new();


      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        'Participants'
      );


      // Generate Excel buffer
      const excelBuffer =
        XLSX.write(workbook, {
          type: 'buffer',
          bookType: 'xlsx'
        });


      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );

      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${event.name}-Participants.xlsx"`
      );


      res.send(excelBuffer);

    } catch (error) {

      console.error(
        'Excel export error:',
        error
      );

      res.status(500).json({
        message: error.message
      });

    }
  }
);


export default r;