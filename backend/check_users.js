const mongoose = require('mongoose');
const User = require('./models/User');
const { mongoURI } = require('./config/config');

const checkUsers = async () => {
    try {
        await mongoose.connect(mongoURI);
        const users = await User.find({}, 'name email role permissions');
        console.log('--- User List ---');
        console.log(JSON.stringify(users, null, 2));
        console.log('-----------------');
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkUsers();
