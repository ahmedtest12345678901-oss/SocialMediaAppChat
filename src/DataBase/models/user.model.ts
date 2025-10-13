import mongoose, { Document, Types } from "mongoose";
import commentModel from "./comment.model";
import postModel from "./post.model";

export enum GenderType {
  male = "male",
  female = "female",
}
export enum RoleType {
  user = "user",
  admin = "admin",
  superAdmin = "super-admin",
}
export enum ProviderType {
  system = "system",
  google = "google",
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  fName: string;
  lName: string;
  userName: string;
  email: string;
  password: string;
  age: number;
  phone?: string;
  address?: string;
  gender: GenderType;
  image: string;
  role?: RoleType;
  provider: ProviderType;
  profileImage?: string;
  tempProfileIamge?: string;
  confirmed?: boolean;
  otp: string;
  changeCredentials?: Date;
  createdAt: Date;
  updatedAt: Date;

  friends: Types.ObjectId[];
  blockedUsers: Types.ObjectId[];

  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  restoredAt?: Date;
  restoredBy?: Types.ObjectId;
}


const userSchema = new mongoose.Schema<IUser>(
  {
    profileImage: { type: String },
    tempProfileIamge: { type: String },
    fName: { type: String, minLength: 2, maxLength: 10, trim: true },
    lName: { type: String, minLength: 2, maxLength: 10, trim: true },
    userName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: {
      type: String,
      required: function () {
        return this.provider === ProviderType.google ? false : true;
      },
    },
    age: {
      type: Number,
      min: 20,
      max: 70,
      required: function () {
        return this.provider === ProviderType.google ? false : true;
      },
    },
    phone: {
      type: String,
      required: function () {
        return this.provider === ProviderType.google ? false : true;
      },
    },
    otp: { type: String },
    confirmed: { type: Boolean },
    changeCredentials: { type: Date },
    address: {
      type: String,
      required: function () {
        return this.provider === ProviderType.google ? false : true;
      },
    },
    gender: {
      type: String,
      enum: Object.values(GenderType),
      required: function () {
        return this.provider === ProviderType.google ? false : true;
      },
    } as const,
    provider: {
      type: String,
      enum: Object.values(ProviderType),
      default: ProviderType.system,
    } as const,
    image: {
      type: String,
    },
    role: {
      type: String,
      enum: Object.values(RoleType),
      default: RoleType.user,
    },

    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    deletedAt: { type: Date },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    restoredAt: { type: Date },
    restoredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);


userSchema
  .virtual("FullName")
  .set(function (value: string) {
    const [fName, lName] = value.split(" ");
    this.set({ fName, lName });
  })
  .get(function () {
    return this.fName + " " + this.lName;
  });


userSchema.pre("deleteOne", { document: false, query: true }, async function (next) {
  const filter = this.getFilter();
  const userId = filter._id;

  await Promise.all([
    commentModel.deleteMany({ userId }),
    postModel.deleteMany({ author: userId }),
  ]);

  next();
});



const userModel = mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default userModel;
