const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config({ path: './.env' });
const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const multerStorageCloudinary = require('multer-storage-cloudinary');

const connectDB = require('./db');

// This line handles both old and new versions of the library
const CloudinaryStorage = multerStorageCloudinary.CloudinaryStorage || multerStorageCloudinary;

// Models
const User = require('./models/User'); 
const Complaint = require('./models/Complaint');
const Suggestion = require('./models/Suggestion'); 

const app = express();

// 1. Cloudinary Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'complaints',
        allowed_formats: ['jpg', 'png', 'jpeg'],
    },
});

const upload = multer({ storage: storage });

// 3. Middlewares
app.use(cors()); 
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
    

// 4. Database Connection
connectDB();

// --- ROUTES ---

app.get('/', (req, res) => {
    res.send("🚀 Complaint Box API is running and connected to MongoDB!");
});

// --- AUTHENTICATION ---

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

// --- COMPLAINTS ---

// Post a new complaint with optional image upload to Cloudinary
app.post('/api/add-complaint', (req, res, next) => {
    // 1. Manually trigger multer to catch errors BEFORE they cause a 502
    upload.single('image')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.error("❌ Multer Error:", err.message);
            return res.status(400).json({ message: "File upload error", error: err.message });
        } else if (err) {
            console.error("❌ Cloudinary/Server Error:", err);
            return res.status(500).json({ message: "Cloudinary connection failed", error: err.message });
        }
        // No error? Move to the next function
        next();
    });
}, async (req, res) => {
    try {
        const complaintData = req.body;
        
        // Cloudinary provides the URL in req.file.path
        if (req.file) {
            console.log("📸 Image uploaded to Cloudinary:", req.file.path);
            complaintData.imageUrl = req.file.path; 
        }

        const newComplaint = new Complaint(complaintData);
        await newComplaint.save();
        res.status(201).json(newComplaint);
    } catch (err) {
        console.error("❌ Database Error:", err);
        res.status(500).json({ message: "Failed to save complaint to database", error: err.message });
    }
});

// Get complaints for a specific user (History)
app.get('/api/complaints/:userId', async (req, res) => {
    try {
        const complaints = await Complaint.find({ userId: req.params.userId }).sort({ createdAt: -1 });
        res.json(complaints);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- SUGGESTIONS ---

app.post('/api/add-suggestion', async (req, res) => {
    try {
        const newSuggestion = new Suggestion(req.body);
        await newSuggestion.save();
        res.status(201).json(newSuggestion);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// --- ADMIN ROUTES ---

app.get('/api/admin/all-complaints', async (req, res) => {
    try {
        const complaints = await Complaint.find().sort({ createdAt: -1 });
        res.json(complaints);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.get('/api/admin/all-suggestions', async (req, res) => {
    try {
        const suggestions = await Suggestion.find().sort({ createdAt: -1 });
        res.json(suggestions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.delete('/api/admin/delete-suggestion/:id', async (req, res) => {
    try {
        await Suggestion.findByIdAndDelete(req.params.id);
        res.json({ message: "Suggestion deleted" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 5. Start Server
const PORT = process.env.PORT || 5000; 
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));