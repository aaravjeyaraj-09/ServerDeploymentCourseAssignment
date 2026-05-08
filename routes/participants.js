const express = require('express');
const router = express.Router();
const pool = require('../db');

/**
 * POST /participants/add
 */
router.post('/add', async (req, res) => {
    try {
        const { participant, work, home } = req.body;

        // Validate structure
        if (!participant || !work || !home) {
            return res.status(400).json({
                error: 'participant, work, and home objects are required'
            });
        }

        const { email, firstname, lastname, dob } = participant;
        const { companyname, salary, currency } = work;
        const { country, city } = home;

        // Participant validation
        if (!email || !firstname || !lastname || !dob) {
            return res.status(400).json({
                error: 'All participant fields are required'
            });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) {
            return res.status(400).json({
                error: 'DOB must be in YYYY-MM-DD format'
            });
        }

        // Work validation
        if (!companyname || salary === undefined || !currency) {
            return res.status(400).json({
                error: 'All work fields are required'
            });
        }

        if (isNaN(salary)) {
            return res.status(400).json({
                error: 'Salary must be a number'
            });
        }

        // Home validation
        if (!country || !city) {
            return res.status(400).json({
                error: 'All home fields are required'
            });
        }

        // Check duplicate participant
        const [existing] = await pool.query(
            'SELECT email FROM participants WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                error: 'Participant already exists'
            });
        }

        // Insert data
        await pool.query(
            'INSERT INTO participants (email, firstname, lastname, dob) VALUES (?, ?, ?, ?)',
            [email, firstname, lastname, dob]
        );

        await pool.query(
            'INSERT INTO work (email, companyname, salary, currency) VALUES (?, ?, ?, ?)',
            [email, companyname, salary, currency]
        );

        await pool.query(
            'INSERT INTO home (email, country, city) VALUES (?, ?, ?)',
            [email, country, city]
        );

        res.status(201).json({
            status: 'success',
            message: 'Participant added successfully'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Failed to add participant'
        });
    }
});

/**
 * GET /participants
 */
router.get('/', async (req, res) => {
    try {
        const [participants] = await pool.query('SELECT * FROM participants');
        const [work] = await pool.query('SELECT * FROM work');
        const [home] = await pool.query('SELECT * FROM home');

        const result = participants.map(p => {
            const w = work.find(item => item.email === p.email);
            const h = home.find(item => item.email === p.email);

            return {
                email: p.email,
                firstname: p.firstname,
                lastname: p.lastname,
                dob: p.dob,
                work: w ? {
                    companyname: w.companyname,
                    salary: w.salary,
                    currency: w.currency
                } : null,
                home: h ? {
                    country: h.country,
                    city: h.city
                } : null
            };
        });

        res.status(200).json({
            status: 'success',
            message: 'Participants retrieved successfully',
            data: result
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Failed to retrieve participants'
        });
    }
});

/**
* /participants/details GET
*/
router.get('/details', async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT email, firstname, lastname FROM participants'
        );

        res.status(200).json({
            status: 'success',
            data: rows
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Failed to retrieve participant details'
        });
    }
});

/**
 * /participants/details/:email
 */
router.get('/details/:email', async (req, res) => {
    try {
        const { email } = req.params;

        const [rows] = await pool.query(
            'SELECT firstname, lastname, dob FROM participants WHERE email = ?',
            [email]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                error: 'Participant not found'
            });
        }

        res.status(200).json({
            status: 'success',
            data: rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: 'Failed to retrieve participant details'
        });
    }
});

/**
 *participants/work/:email GET 
**/
router.get('/work/:email', async (req, res) => {
    try {
        const { email } = req.params;

        const [rows] = await pool.query(
            'SELECT companyname, salary, currency FROM work WHERE email = ?',
            [email]

        );

        if (rows.length === 0) {
            return res.status(404).json({
                error: 'Work details not found for this participant'
            });
        }

        res.status(200).json({
            status: 'success',
            data: rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: 'Failed to retrieve work details'
        });
    }
});

/**
 * participants/home/:email GET
 * **/
router.get('/home/:email', async (req, res) => {
    try {
        const { email } = req.params;

        const [rows] = await pool.query(
            'SELECT country, city FROM home WHERE email = ?',
            [email]

        );

        if (rows.length === 0) {
            return res.status(404).json({
                error: 'Home details not found for this participant'
            });
        }

        res.status(200).json({
            status: 'success',
            data: rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: 'Failed to retrieve home details'
        });
    }
});

module.exports = router;