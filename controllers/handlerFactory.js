const catchAsync = require('./../utilities/catchAsync.js');
const AppError = require('./../utilities/appError.js');
const APIFeatures = require('./../utilities/apiFeatures.js');

exports.deleteOne = function (Model) {
    return catchAsync(async (req, res, next) => {
        const document = await Model.findByIdAndDelete(req.params.id);

        if (!document) {
            throw new AppError('Document not found.', 404)
        }

        res
            .status(204)
            .json({
                status: 'success',
                data: null
            });
    });
};

exports.updateOne = function (Model) {
    return catchAsync(async (req, res, next) => {
        const document = await Model.findByIdAndUpdate(req.params.id, req.body,
            { new: true, runValidators: true }
        );

        if (!document) {
            throw new AppError('Document not found.', 404)
        }

        res
            .status(200)
            .json({
                status: 'success',
                data: { data: document }
            });
    });
};

exports.getOne = function (Model, populateOptions) {

    return catchAsync(async (req, res, next) => {
        // build query
        let query = Model.findById(req.params.id);
        if (populateOptions) {
            query = query.populate(populateOptions);
        }
        // execute query
        const document = await query;

        if (!document) {
            throw new AppError('Document not found.', 404);
        }

        res
            .status(200)
            .json({
                status: 'success',
                data: { data: document }
            });

    });
};

exports.getAll = function (Model) {
    return catchAsync(async (req, res, next) => {
        // For allowing nested GET reviews on tour
        let filter = {};
        if (req.params.tourId) {
            filter = { tour: req.params.tourId };
        }
        // ---------------------------------------
        // BUILD QUERY
        // // 1. Filtering
        // let queryObj = { ...req.query };
        // const excludedFields = ['page', 'sort', 'limit', 'fields'];
        // excludedFields.forEach(field => delete queryObj[field]);

        // // 2. Advanced Filtering
        // let queryStr = JSON.stringify(queryObj);
        // // with regular expression
        // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
        // queryObj = JSON.parse(queryStr);

        // Tour.find returns a query object 
        // console.log(queryObj)
        // let query = Tour.find(queryObj);

        // // 3. Sorting
        // if (req.query.sort) {
        //     // By multiple fields
        //     const sortBy = req.query.sort.replaceAll(',', ' ');
        //     query = query.sort(sortBy);
        // } else {
        //     query = query.sort('-_id');
        // }

        // 4. Limiting fields
        // if (req.query.fields) {
        //     // By multiple fields
        //     const fields = req.query.fields.replaceAll(',', ' ');
        //     query = query.select(fields);
        // } else {
        //     // Exclude a field
        //     query = query.select('-__v');
        // }

        // 4. Pagination
        // const page = Number(req.query.page) || 1;
        // const limitDocuments = Number(req.query.limit) || 3;
        // const skipDocuments = (page - 1) * limitDocuments;

        // query = query.skip(skipDocuments).limit(limitDocuments);

        // if (req.query.page) {
        //     const numTours = await Tour.countDocuments();
        //     if (page * limitDocuments > numTours) {
        //         throw new Error('Page does not exist');
        //     }
        // }

        // BUILD QUERY
        // Model.find returns a query object 
        const features = new APIFeatures(Model.find(filter), req.query)
            .filter()
            .sort()
            .limitFields()
            .paginate();

        // EXECUTE QUERY
        const documents = await features.query;

        // SEND RESPONSE
        res
            .status(200)
            .json({
                status: 'success',
                results: documents.length,
                data: { data: documents }
            });
    });
};

exports.createOne = function (Model) {
    return catchAsync(async (req, res, next) => {
        const newDocument = await Model.create(req.body);

        res
            .status(201)
            .json({ status: 'success', data: { data: newDocument } });
    });
};