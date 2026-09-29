import multer from 'multer';
import path from 'path';
import fs from 'fs';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import User from '../models/User.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();


/* =========================================================
   PROFILE UPLOAD DIRECTORY
========================================================= */

const uploadDir = path.join(
  process.cwd(),
  'uploads'
);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true
  });
}


/* =========================================================
   MULTER STORAGE
========================================================= */

const storage = multer.diskStorage({

  destination: (req, file, cb) => {

    cb(null, uploadDir);

  },

  filename: (req, file, cb) => {

    const ext = path
      .extname(file.originalname)
      .toLowerCase();

    const filename =
      `profile-${req.user._id}-${Date.now()}${ext}`;

    cb(null, filename);

  }

});


/* =========================================================
   MULTER CONFIGURATION
========================================================= */

const upload = multer({

  storage,

  limits: {
    fileSize: 5 * 1024 * 1024
  },

  fileFilter: (req, file, cb) => {

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (!allowedTypes.includes(file.mimetype)) {

      return cb(
        new Error(
          'Only JPG, PNG and WEBP images are allowed.'
        )
      );

    }

    cb(null, true);

  }

});


/* =========================================================
   SAFE USER
========================================================= */

const safeUser = (u) => ({

  id: u._id,

  name: u.name,

  email: u.email,

  role: u.role,

  registerNo: u.registerNo,

  department: u.department,

  year: u.year,

  gender: u.gender,

  className: u.className,

  photoUrl: u.photoUrl,

  communityIds: u.communityIds

});


/* =========================================================
   REGISTER
========================================================= */

router.post(
  '/register',
  async (req, res) => {

    try {

      const {
        name,
        email,
        password,
        registerNo,
        department,
        year,
        gender
      } = req.body;


      /* REQUIRED FIELDS */

      if (
        !name ||
        !email ||
        !password ||
        !registerNo ||
        !department ||
        !year ||
        !gender
      ) {

        return res.status(400).json({

          message:
            'Please fill all required fields'

        });

      }


      /* CHECK EXISTING USER */

      const existingUser =
        await User.findOne({

          $or: [

            {
              email:
                email.toLowerCase()
            },

            {
              registerNo:
                registerNo
            }

          ]

        });


      if (existingUser) {

        return res.status(409).json({

          message:
            'Email or Register Number already exists'

        });

      }


      /* HASH PASSWORD */

      const passwordHash =
        await bcrypt.hash(
          password,
          10
        );


      /* CREATE USER */

      const user =
        await User.create({

          name,

          email:
            email.toLowerCase(),

          passwordHash,

          role: 'student',

          registerNo,

          department,

          year,

          gender

        });


      /* CREATE JWT */

      const token =
        jwt.sign(

          {
            userId: user._id,
            role: user.role
          },

          process.env.JWT_SECRET,

          {
            expiresIn: '2d'
          }

        );


      res.status(201).json({

        token,

        user:
          safeUser(user)

      });

    } catch (error) {

      console.error(
        'Register error:',
        error
      );

      res.status(500).json({

        message:
          error.message

      });

    }

  }
);


/* =========================================================
   LOGIN USING EMAIL
========================================================= */

router.post(
  '/login',
  async (req, res) => {

    try {

      const email =
        req.body.email?.toLowerCase();

      const password =
        req.body.password || '';


      /* FIND USER */

      const user =
        await User.findOne({
          email
        });


      /* CHECK PASSWORD */

      if (
        !user ||
        !(await bcrypt.compare(
          password,
          user.passwordHash
        ))
      ) {

        return res.status(401).json({

          message:
            'Invalid email or password'

        });

      }


      /* CREATE JWT */

      const token =
        jwt.sign(

          {
            userId: user._id,
            role: user.role
          },

          process.env.JWT_SECRET,

          {
            expiresIn: '2d'
          }

        );


      res.json({

        token,

        user:
          safeUser(user)

      });

    } catch (error) {

      console.error(
        'Login error:',
        error
      );

      res.status(500).json({

        message:
          error.message

      });

    }

  }
);


/* =========================================================
   CURRENT USER
========================================================= */

router.get(
  '/me',
  auth,
  async (req, res) => {

    res.json({

      user:
        safeUser(req.user)

    });

  }
);


/* =========================================================
   UPDATE PROFILE + PROFILE PHOTO
========================================================= */

router.put(
  '/profile',
  auth,
  upload.single('photo'),

  async (req, res) => {

    try {

      /* =====================================================
         ALLOWED PROFILE FIELDS
      ===================================================== */

      const allowedFields = [

        'name',

        'email',

        'registerNo',

        'department',

        'year',

        'gender',

        'className'

      ];


      const data = {};


      /* =====================================================
         GET FORM DATA
      ===================================================== */

      for (
        const field of allowedFields
      ) {

        if (
          req.body[field] !== undefined
        ) {

          data[field] =
            req.body[field];

        }

      }


      /* =====================================================
         NORMALIZE EMAIL
      ===================================================== */

      if (data.email) {

        data.email =
          data.email.toLowerCase();

      }


      /* =====================================================
         CHECK EMAIL DUPLICATE
      ===================================================== */

      const emailExists =
        data.email

          ? await User.findOne({

              email: data.email,

              _id: {
                $ne: req.user._id
              }

            })

          : null;


      if (emailExists) {

        return res.status(409).json({

          message:
            'Email already exists'

        });

      }


      /* =====================================================
         CHECK REGISTER NUMBER DUPLICATE
      ===================================================== */

      const registerExists =
        data.registerNo

          ? await User.findOne({

              registerNo:
                data.registerNo,

              _id: {
                $ne: req.user._id
              }

            })

          : null;


      if (registerExists) {

        return res.status(409).json({

          message:
            'Register Number already exists'

        });

      }


      /* =====================================================
         SAVE PROFILE PHOTO
      ===================================================== */

      if (req.file) {

        data.photoUrl =
          `/uploads/${req.file.filename}`;

        console.log(
          'Uploaded photo:',
          req.file.filename
        );

        console.log(
          'Photo URL:',
          data.photoUrl
        );

      }


      /* =====================================================
         UPDATE USER IN MONGODB
      ===================================================== */

      const updatedUser =
        await User.findByIdAndUpdate(

          req.user._id,

          data,

          {
            new: true,
            runValidators: true
          }

        );


      /* =====================================================
         USER NOT FOUND
      ===================================================== */

      if (!updatedUser) {

        return res.status(404).json({

          message:
            'User not found'

        });

      }


      /* =====================================================
         DEBUG
      ===================================================== */

      console.log(
        'Profile updated:',
        updatedUser.email
      );

      console.log(
        'Saved photoUrl:',
        updatedUser.photoUrl
      );


      /* =====================================================
         SEND UPDATED USER TO FRONTEND
      ===================================================== */

      res.json({

        user:
          safeUser(updatedUser)

      });

    } catch (error) {

      console.error(
        'Profile update error:',
        error
      );

      res.status(500).json({

        message:
          error.message

      });

    }

  }
);


/* =========================================================
   MULTER ERROR HANDLING
========================================================= */

router.use(
  (error, req, res, next) => {

    /* FILE SIZE ERROR */

    if (
      error instanceof multer.MulterError
    ) {

      if (
        error.code ===
        'LIMIT_FILE_SIZE'
      ) {

        return res.status(400).json({

          message:
            'Profile picture must be less than 5 MB.'

        });

      }

      return res.status(400).json({

        message:
          error.message

      });

    }


    /* INVALID FILE TYPE */

    if (
      error &&
      error.message ===
        'Only JPG, PNG and WEBP images are allowed.'
    ) {

      return res.status(400).json({

        message:
          error.message

      });

    }


    next(error);

  }
);


export default router;