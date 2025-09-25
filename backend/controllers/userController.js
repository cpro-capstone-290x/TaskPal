// backend/controllers/userController.js

import { sql } from "../config/db.js";
export const getUsers = async (req, res) => {
    try {
        const users = await sql`
        SELECT * FROM users
        ORDER BY created_at DESC
        `;
        console.log("fetched users", users);
        res.status(200).json({success:true, data: users});
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }   
}
export const getUser = async (req, res) => {
    const { id } = req.params;
    res.status(200).json({ message: `Get user with ID ${id}` });    
    try {
        const user = await sql`
        SELECT * FROM users WHERE id = ${id}
        `;
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
}
export const createUser = async (req, res) => {
    const { name, email } = req.body;
    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
    }

    try {
        const newUser = await sql`
        INSERT INTO users (name, email) 
        VALUES (${name}, ${email}) 
        RETURNING *
        `;
        console.log("created user", newUser);
        res.status(201).json({ success: true, data: newUser[0] });
    } catch (error) {
        if (error.code === '23505') { // Unique violation
            return res.status(400).json({ error: 'Email already exists' });
        }
    }    res.status(500).json({ error: 'Failed to create user' });   
}
export const updateUsers = async (req, res) => {
    const { id } = req.params;
    const { name, email } = req.body;
    try{
        const updatedUser = await sql`
        UPDATE users 
        SET name = ${name}, email = ${email};
        WHERE id = ${id}
        RETURNING *
        `;
        res.status(200).json({ success: true, data: updatedUser[0] });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update user' });       
    }
}
export const deleteUsers = (req, res) => {
    const { id } = req.params;
    try{
        res.status(200).json({ message: `Delete user with ID ${id}` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });       
    }
}