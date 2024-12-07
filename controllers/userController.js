const User = require('./../models/userModel.js');
const catchAsync = require('./../utilities/catchAsync.js');
const AppError = require('./../utilities/appError.js');
const factory = require('./handlerFactory.js');
// Multer is a node.js middleware for handling multipart/form-data, which is primarily used for uploading files. 
const multer = require('multer');
// Image processing library
const sharp = require('sharp');

// How to store files(user photo)
// const multerStorage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         // cb(callback function): null means there is no error
//         cb(null, 'public/img/users');
//     },
//     filename: (req, file, cb) => {
//         const extension = file.mimetype.split('/')[1];
//         // cb(callback function): null means there is no error
//         cb(null, `user-${req.user.id}-${Date.now()}.${extension}`)
//     }
// });

// How to store files(user photo)
// Image/Photo will be stored as a buffer
const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        // cb(callback function): 
        // 'null' means there is no error; 
        // 'true' if the uploaded file is an image
        cb(null, true);
    } else {
        cb(new AppError('Incorrect file type. Plase upload an image.', 400), false);
    }
};

// multer options
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

// upload.single() middleware: upload one single image (in this case the image will be saved in 'public/img/users')
// upload.single() middleware: Put some information about the file on the request object(req.file)
// 'photo': name of the form field
exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
    if (!req.file) {
        return next();
    }

    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`

    // req.file.buffer: comes from multer
    // jpeg(): compress file by lowering its quality (in this case 90%)
    // toFile(): specify route to save the file
    await sharp(req.file.buffer)
        .resize(500, 500)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/users/${req.file.filename}`);

    next();
});

// To filtered out unwanted fields
const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    for (const field of allowedFields) {
        newObj[field] = obj[field];
    }
    return newObj;
};

exports.getMe = (req, res, next) => {
    // In order to use 'factory.getOne(User)' add the current user id to the req.params object
    req.params.id = req.user.id;
    next();
};

exports.updateMe = catchAsync(async (req, res, next) => {
    // 1. Send error if user POSTs password data
    if (req.body.password || req.body.confirmPassword) {
        throw new AppError('This route is not for password updates. Please use /update-password.', 400)
    }

    // 2. Filtered out unwanted fields that are not allowed to be updated
    const filteredBody = filterObj(req.body, 'name', 'email');
    if (req.file) {
        filteredBody.photo = req.file.filename;
    }

    // 3. Update user document
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        filteredBody,
        {
            new: true,
            runValidators: true
        });

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    });
});

exports.deleteMe = catchAsync(async (req, res) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res
        .status(204)
        .json({
            status: 'success',
            data: null
        });
});

exports.getAllUsers = factory.getAll(User);

exports.getUser = factory.getOne(User);

// Don't try to update password
exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);