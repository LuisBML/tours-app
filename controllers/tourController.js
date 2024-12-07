const Tour = require('./../models/tourModel.js');
const catchAsync = require('./../utilities/catchAsync.js');
const factory = require('./handlerFactory.js');
const AppError = require('./../utilities/appError.js');
// Multer is a node.js middleware for handling multipart/form-data, which is primarily used for uploading files. 
const multer = require('multer');
// Image processing library
const sharp = require('sharp');

const EARTH_RADIUS_MILES = 3963.2;
const EARTH_RADIUS_KM = 6378.1;


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

// upload.fields(): Returns middleware that processes multiple files associated with the given form fields.
// upload.fields(): Put some information about the file on the request object(req.files)
// 'name', 'images': name of the form fields
exports.uploadTourImages = upload.fields(
    [
        { name: 'imageCover', maxCount: 1 },
        { name: 'images', maxCount: 3 }
    ]);

// If only 'images' were needed
// upload.array();

exports.resizeTourImages = catchAsync(async (req, res, next) => {
    if (!req.files?.imageCover || !req.files?.images) {
        return next();
    }

    // 1. Cover image
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
    // req.file.buffer: comes from multer
    // jpeg(): compress file by lowering its quality (in this case 90%)
    // toFile(): specify route to save the file
    await sharp(req.files.imageCover[0].buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${req.body.imageCover}`);

    // 2. Images
    req.body.images = [];

    // map() will return an array of promises
    await Promise.all(req.files.images.map(async (file, index) => {
        const filename = `tour-${req.params.id}-${Date.now()}-${index + 1}.jpeg`;

        await sharp(file.buffer)
            .resize(2000, 1333)
            .toFormat('jpeg')
            .jpeg({ quality: 90 })
            .toFile(`public/img/tours/${filename}`);

        req.body.images.push(filename)
    }));

    next();
});


exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = 'price';
    req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
    next();
};

exports.getAllTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, { path: 'reviews' });

exports.createTour = factory.createOne(Tour);

exports.updateTour = factory.updateOne(Tour);

exports.deleteTour = factory.deleteOne(Tour);

exports.getTourStats = catchAsync(async (req, res, next) => {
    // Tour.aggregate() returns an aggregate object
    // Awaiting it returns the result
    const stats = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } }
        },
        {
            $group: {
                // _id: null = makes One big group
                // In this case group by the difficulty field
                _id: '$difficulty',
                numTours: { $count: {} },
                numRating: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' }
            }
        },
        {
            $sort: { avgPrice: 1 }
        }
    ]);

    res
        .status(200)
        .json({
            status: 'success',
            data: stats
        });
});

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
    const year = Number(req.params.year);

    // $unwind :Deconstructs an array field from the input documents to output a 
    // document for each element. Each output document is the input document with 
    // the value of the array field replaced by the element.

    // tours: { $push: '$name' } = creates an array and pushes each tour's name into it

    // tours: { $push: '$name' } = creates an array and pushes each tour's name into it

    // $project = hides fields

    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates'
        },
        {
            $match: {
                startDates:
                {
                    $gte: new Date(`${year}-01-01`),
                    $lte: new Date(`${year}-12-31`)
                }
            }
        },
        {
            $group: {
                _id: { $month: '$startDates' },
                numTours: { $count: {} },
                tours: { $push: '$name' }
            }
        },
        {
            $addFields: {
                month: '$_id'
            }
        },
        {
            $project: {
                _id: 0
            }
        },
        {
            $sort: {
                numTours: -1
            }
        }
    ]);

    res
        .status(200)
        .json({
            status: 'success',
            data: plan
        });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    // radius needs to be in radians
    const radius = unit === 'mi' ? distance / EARTH_RADIUS_MILES : distance / EARTH_RADIUS_KM;

    if (!lat || !lng) {
        throw new AppError('Please provide latitude and longitude in the format: lat,lng', 400)
    }

    // $geoWithin: finds documents within a certain geometry
    const tours = await Tour.find(
        { startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } } }
    );

    res
        .status(200)
        .json({
            status: 'success',
            results: tours.length,
            data: { data: tours }
        });
});

exports.getDistances = catchAsync(async (req, res, next) => {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');

    const multipler = unit === "mi" ? 0.000621371 : 0.001;

    if (!lat || !lng) {
        throw new AppError('Please provide latitude and longitude in the format: lat,lng', 400)
    }

    // $geoNear: 
    // needs to be the first stage on the pipeline
    // requires that at least on field in the model (eg Tour) contains a geospatial index (eg startLocation)

    // distanceField: The output field that contains the calculated distance

    // distanceMultiplier: The factor to multiply all distances returned by the query.

    // $project: select fields to keep/show
    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [Number(lng), Number(lat)]
                },
                distanceField: 'distance',
                distanceMultiplier: multipler,
                key: 'startLocation'
            }
        },
        {
            $project: {
                distance: 1,
                name: 1
            }
        }
    ]);

    res
        .status(200)
        .json({
            status: 'success',
            data: { data: distances }
        });
});

// exports.deleteTour = catchAsync(async (req, res, next) => {
//     const tour = await Tour.findByIdAndDelete(req.params.id);

//     if (!tour) {
//         throw new AppError('Tour not found.', 404)
//     }

//     res
//         .status(204)
//         .json({
//             status: 'success',
//             data: null
//         });
// });