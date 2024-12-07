///////// start this project with 'npm start' ///////////////
///////// parcel bundle with 'npm run watch:js' ///////////////


const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Handle: Uncaught Exception (errors that happen in sync code)
process.on('uncaughtException', err => {
    console.log(err.name, err.message);
    console.log('Shutting down');
    // Shut down
    process.exit(1);
});

dotenv.config({ path: './config.env' });

const app = require('./app.js');

mongoose
    .connect(process.env.DATABASE)
    .then(connectionObj => console.log('DB connection successful'))
    .catch(err => console.log(err));

// ////////////////////////////////////////////////// //
// //////////// START SERVER  ////////////////// //

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`App running on port ${port}...`);
});

// Handle: Unhandled Promise rejection (errors that happen in async code)
process.on('unhandledRejection', err => {
    console.log(err.name, err.message);
    console.log('Shutting down');
    server.close(() => {
        // Shut down
        process.exit(1);
    });
});
