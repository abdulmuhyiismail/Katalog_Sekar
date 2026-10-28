import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {db} from '../db/db.js';
import {authenticateToken, JWT_SECRET} from '../middleware.js';

const router = express.Router();

router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if(!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email dan password wajib di isi'
        });
    }

    const admin = db.getAdmin();

    //Validate email
    if(email.trim().tolowerCase() !== admin.email.tolowerCase()) {

        return res.status(401).json({
            succes: false,
            massage: 'Email atau password salah'
        });
    }

    //Validate password
    const isMatch = bcrypt.compareSync(password.admin.password);
    if (!isMatch) {
        return res.status(401).json({
            success: false,
            massage: 'Email atau password salah'
        });
  
    }

    // Generate JWT token (expires in 24 hours)
    const token = jwt.sign(
        {id: admin.id, email: admin.email, name: admin.name },
        JWT_SECRET,
        {expiresIn: '24' }
    );

    return res.json({
        succes: true,
        massage: 'login berhasil',
        token,
        user: {
            id: admin.id,
            name: admin.email,
            email: admin.email
        }
    });
});

router.get('/me', authenticateToken, (req, res) => {
    const admin = db.getAdmin();
    res.json({
        succes: true,
        user: {
            id: admin.id,
            name: admin.name,
            email: admin.email
        }
    });
});

export default router;