const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config({ path: './.env' });
const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const connectDB = require('./db');
const User = require('./models/User'); 
const Complaint = require('./models/Complaint');
const Suggestion = require('./models/Suggestion'); 



const app = express();

// Middlewares
app.use(cors()); // Allows Flutter to connect
app.use(express.json()); // Allows server to understand JSON data
app.get('/', (req, res) => {
    res.send("🚀 Complaint Box API is running and connected to MongoDB!");
});
// Connect to Database
connectDB();

// --- ROUTES ---
app.use('/uploads', express.static('uploads'));
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Make sure you create this folder!
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

app.post('/api/signup', async (req, res) => {
    try {
        const { name, rollNumber, password } = req.body;
        const existingUser = await User.findOne({ rollNumber });
        if (existingUser) return res.status(400).json({ message: "User already exists" });

        const newUser = new User({ name, rollNumber, password });
        await newUser.save();
        res.status(201).json({ message: "User created" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { rollNumber, password } = req.body;
        const user = await User.findOne({ rollNumber, password });
        if (user) {
            res.status(200).json(user);
        } else {
            res.status(401).json({ message: "Invalid credentials" });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 1. Post a new complaint (Student side)
app.post('/api/add-complaint', upload.single('image'), async (req, res) => {
    try {
        const complaintData = req.body;
        if (req.file) {
            // Change 'localhost' to your IP if testing on a real phone
            complaintData.imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        }

        const newComplaint = new Complaint(complaintData);
        const savedComplaint = await newComplaint.save();
        res.status(201).json(savedComplaint);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get complaints for a specific user (History)
app.get('/api/complaints/:userId', async (req, res) => {try {
        const complaints = await Complaint.find({ userId: req.params.userId }).sort({ timestamp: -1 });
        res.json(complaints);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// Post a new suggestion
app.post('/api/add-suggestion', async (req, res) => {
    try {
        const newSuggestion = new Suggestion(req.body);
        await newSuggestion.save();
        res.status(201).json(newSuggestion);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Get all complaints for Admin overview
app.get('/api/admin/all-complaints', async (req, res) => {
    try {
        const complaints = await Complaint.find().sort({ timestamp: -1 });
        res.json(complaints);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// Get all suggestions for Admin
app.get('/api/admin/all-suggestions', async (req, res) => {
    try {
        const suggestions = await Suggestion.find().sort({ timestamp: -1 });
        res.json(suggestions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// Delete a suggestion
app.delete('/api/admin/delete-suggestion/:id', async (req, res) => {
    try {
        await Suggestion.findByIdAndDelete(req.params.id);
        res.json({ message: "Suggestion deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

const PORT = process.env.PORT || 5000; 
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));
    