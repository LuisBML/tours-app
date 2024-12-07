class APIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString
    }

    filter() {
        // 1. Filtering
        let queryObj = { ...this.queryString };
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach(field => delete queryObj[field]);

        // 2. Advanced Filtering
        let tempQueryString = JSON.stringify(queryObj);
        // with regular expression
        tempQueryString = tempQueryString.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
        queryObj = JSON.parse(tempQueryString);

        // findData() returns a mongoose query object 
        this.query = this.query.find(queryObj);

        // In order to keep chaining methods
        return this;
    }

    sort() {
        if (this.queryString.sort) {
            // By multiple fields
            const sortBy = this.queryString.sort.replaceAll(',', ' ');
            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort('-_id');
        }
        // In order to keep chaining methods
        return this;
    }

    limitFields() {
        if (this.queryString.fields) {
            // By multiple fields
            const fields = this.queryString.fields.replaceAll(',', ' ');
            this.query = this.query.select(fields);
        } else {
            // Exclude a field
            this.query = this.query.select('-__v');
        }
        // In order to keep chaining methods
        return this;
    }

    paginate() {
        const page = Number(this.queryString.page) || 1;
        const limitDocuments = Number(this.queryString.limit) || 3;
        const skipDocuments = (page - 1) * limitDocuments;

        this.query = this.query.skip(skipDocuments).limit(limitDocuments);

        // In order to keep chaining methods
        return this;
    }
}

module.exports = APIFeatures;