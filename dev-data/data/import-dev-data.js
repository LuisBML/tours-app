const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./../../models/tourModel.js');
const Review = require('./../../models/reviewModel.js');
const User = require('./../../models/userModel.js');

dotenv.config({ path: './config.env' });

mongoose
    .connect(process.env.DATABASE)
    .then(connectionObj => console.log('DB connection successful'))
    .catch(err => console.log(err));

// Read JSON file
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));

// Import data into DB
const importData = async () => {
    try {
        await Tour.create(tours);
        await Review.create(reviews);
        await User.create(users, { validateBeforeSave: false });
        console.log('Data successfully imported')
    } catch (error) {
        console.log(error);
    }
    process.exit();
}

// Delete all data from Collection
const deleteAllData = async () => {
    try {
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log('Data successfully deleted')
    } catch (error) {
        console.log(error);
    }
    process.exit();
}

if (process.argv[2] === '--import') {
    importData()
} else if (process.argv[2] === '--delete') {
    deleteAllData()
}

console.log(__dirname);