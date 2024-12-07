const mongoose = require('mongoose');
const validatorJS = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A user must have a name'],
        trim: true,
        maxlength: [40, 'The name of a user must have 40 or less characters.'],
        minlength: [3, 'The name of a user must have 3 or more characters.']
    },
    email: {
        type: String,
        required: [true, 'A user must have a email'],
        trim: true,
        unique: true,
        lowercase: true,
        validate: [validatorJS.isEmail, 'Invalid email.']
    },
    password: {
        type: String,
        required: [true, 'A user must have a password'],
        trim: true,
        maxlength: [15, 'The password of a user must have 15 or less characters.'],
        minlength: [8, 'The password of a user must have 8 or more characters.'],
        select: false
        // validate: [validatorJS.isStrongPassword,]
    },
    passwordConfirm: {
        type: String,
        // Required input
        required: [true, 'Password confirmation needed'],
        select: false,
        validate: {
            validator: function (value) {
                // Only works on .create() and .save()
                return value === this.password;
            },
            message: 'Invalid password.'
        }
    },
    photo: {
        type: String,
        default: 'default.jpg'
    },
    role: {
        type: String,
        default: 'user',
        enum: ['user', 'guide', 'lead-guide', 'admin']
    },
    active: {
        type: Boolean,
        default: true,
        select: false
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date
});

/////////// DOCUMENT MIDDLEWARE ///////////

// runs before save() and create()
userSchema.pre('save', async function (next) {
    // 'this' points to the currently processed document
    if (this.isModified('password')) {

        // Hash and salt
        this.password = await bcrypt.hash(this.password, 12);

        // passwordConfirm it's a required input but that doesn't mean
        // it must be persisted on the db. So don't keep/save it
        this.passwordConfirm = undefined;
    }
    next();
});

userSchema.pre('save', function (next) {
    if (this.isModified && !this.isNew) {

        // substract one second to ensure that the token is created after
        // the password has been changed
        this.passwordChangedAt = Date.now() - 1000;
    }
    next();
});


/////////// QUERY MIDDLEWARE ///////////

// runs before query object(in this case User.find...()) is executed
userSchema.pre(/^find/, function (next) {
    // this points to current query

    // find/get only active users
    this.find({ active: { $ne: false } });
    next();
});


/////////// INSTANCE METHODS ///////////
userSchema.methods.correctPassword = async function (candidatePassword) {
    // bcrypt.compare() returns a Promise<boolean>

    return await bcrypt.compare(candidatePassword, this.password);
}

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    // returns false if the password has not changed after the token creation

    // 'this' points to the current document
    if (this.passwordChangedAt) {
        // getTime() is a JS method
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

        return JWTTimestamp < changedTimestamp;
    }

    return false;
}

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    // Reset token will expire in 10 minutes
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
}


const User = mongoose.model('User', userSchema);

module.exports = User;