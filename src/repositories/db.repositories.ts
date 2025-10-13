
import {
  Model,
  HydratedDocument,
  ProjectionType,
  RootFilterQuery,
  UpdateQuery,
  UpdateWriteOpResult,
  QueryOptions,
  DeleteResult,
  PopulateOptions,
} from "mongoose";

export abstract class DBRepository<TDocument> {
  constructor(protected readonly model: Model<TDocument>) { }

  async create(data: Partial<TDocument>): Promise<HydratedDocument<TDocument>> {
    return this.model.create(data);
  }


  async find(
    { filter,
      select,
      options
    }: {
      filter: RootFilterQuery<TDocument>,
      select?: ProjectionType<TDocument>,
      options?: QueryOptions<TDocument>
    }
  ): Promise<HydratedDocument<TDocument>[]> {
    return this.model.find(filter, select, options);
  }


  async findOne(
    filter: RootFilterQuery<TDocument>,
    select?: ProjectionType<TDocument>
  ): Promise<HydratedDocument<TDocument> | null> {
    return this.model.findOne(filter, select);
  }

  async findOneWithPopulate(
    filter: RootFilterQuery<TDocument>,
    populate: PopulateOptions | PopulateOptions[],
    select?: ProjectionType<TDocument>,
  ): Promise<HydratedDocument<TDocument> | null> {
    return this.model.findOne(filter, select).populate(populate);
  }

  async updateOne(
    filter: RootFilterQuery<TDocument>,
    update: UpdateQuery<TDocument>
  ): Promise<UpdateWriteOpResult> {
    return this.model.updateOne(filter, update);
  }

  async findOneAndUpdate(
    filter: RootFilterQuery<TDocument>,
    update: UpdateQuery<TDocument>,
    options: QueryOptions<TDocument> = { new: true }
  ): Promise<HydratedDocument<TDocument> | null> {
    return this.model.findOneAndUpdate(filter, update, options);
  }

  async deleteOne(filter: RootFilterQuery<TDocument>): Promise<DeleteResult> {
    return await this.model.deleteOne(filter);
  }

  async paginate({
    filter,
    query,
    select,
    options = {}
  }: {
    filter: RootFilterQuery<TDocument>,
    query: { page: number, limit: number },
    select?: ProjectionType<TDocument>,
    options?: QueryOptions<TDocument>,
  }) {
    let { page, limit } = query;

    if (page < 0) page = 1;
    page = page * 1 || 1;
    const skip = (page - 1) * limit;

    const finalOptions = {
      ...options,
      skip,
      limit
    };
    const count = await this.model.countDocuments({ deletedAt: { $exists: false } })
    const numberOfPages = Math.ceil(count / limit)
    const docs = await this.model.find(filter, select, finalOptions);
    return { docs, currentPage: page, countDocuments: count, numberOfPages };
  }

  async findById(id: string, select?: ProjectionType<TDocument>): Promise<HydratedDocument<TDocument> | null> {
    return this.model.findById(id, select);
  }




  async findOnDocument(filter: RootFilterQuery<TDocument>, select?: ProjectionType<TDocument>) {
    return this.findOne(filter, select);
  }

  async createNewDocument(data: Partial<TDocument>) {
    return this.create(data);
  }

 async findDoucuments({
  filter,
  select,
  options,
}: {
  filter: any;
  select?: any;
  options?: any;
}) {
  return this.model.find(filter, select, options);
}



}

