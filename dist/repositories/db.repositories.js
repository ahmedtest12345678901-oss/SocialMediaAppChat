"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DBRepository = void 0;
class DBRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    async create(data) {
        return this.model.create(data);
    }
    async find({ filter, select, options }) {
        return this.model.find(filter, select, options);
    }
    async findOne(filter, select) {
        return this.model.findOne(filter, select);
    }
    async findOneWithPopulate(filter, populate, select) {
        return this.model.findOne(filter, select).populate(populate);
    }
    async updateOne(filter, update) {
        return this.model.updateOne(filter, update);
    }
    async findOneAndUpdate(filter, update, options = { new: true }) {
        return this.model.findOneAndUpdate(filter, update, options);
    }
    async deleteOne(filter) {
        return await this.model.deleteOne(filter);
    }
    async paginate({ filter, query, select, options = {} }) {
        let { page, limit } = query;
        if (page < 0)
            page = 1;
        page = page * 1 || 1;
        const skip = (page - 1) * limit;
        const finalOptions = {
            ...options,
            skip,
            limit
        };
        const count = await this.model.countDocuments({ deletedAt: { $exists: false } });
        const numberOfPages = Math.ceil(count / limit);
        const docs = await this.model.find(filter, select, finalOptions);
        return { docs, currentPage: page, countDocuments: count, numberOfPages };
    }
    async findById(id, select) {
        return this.model.findById(id, select);
    }
    async findOnDocument(filter, select) {
        return this.findOne(filter, select);
    }
    async createNewDocument(data) {
        return this.create(data);
    }
    async findDoucuments({ filter, select, options, }) {
        return this.model.find(filter, select, options);
    }
}
exports.DBRepository = DBRepository;
