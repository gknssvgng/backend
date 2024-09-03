const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(express.json());
app.use(cors());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).send('Access Denied');

    try {
        const verified = token === process.env.JWT_SECRET;
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).send('Invalid Token');
    }
};

const initializeDB = async () => {
    try {
        await mongoose.connect("mongodb://localhost:27017/peopleDB", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log("DB initialized successfully");

        

        return true;
    } catch (error) {
        console.log("Error with DB initialization:", error.message);
        return false;
    }
};


initializeDB().then((response) => {
    if (response) {
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    }
});






const personSchema = new mongoose.Schema({
    type: String,
    count: Number,
});

const Person = mongoose.model('Person', personSchema);

const checkRecords=async()=>{
const existingRecords = await Person.countDocuments();

if (existingRecords === 0) {
    await Person.insertMany([
        { type: "Male", count: 150 },
        { type: "Female", count: 180 },
        { type: "Boy", count: 75 },
        { type: "Girl", count: 95 }
    ]);
    console.log("Sample records inserted successfully");
} else {
    console.log("Sample records already exist in the database");
}
}
checkRecords()

app.post('/api/people', authenticateJWT, async (req, res) => {
    try {
        const { type, count } = req.body;
        let person = await Person.findOneAndUpdate({ type }, { count }, { new: true, upsert: true });
        res.json(person);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/people', authenticateJWT, async (req, res) => {
    try {
        console.log("hitted")
        const people = await Person.find();
        res.json(people);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
