import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  email: string;
  githubUsername?: string;
  githubId?: string;
  githubToken?: string;
  featureMap?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    githubUsername: {
      type: String,
      default: null,
    },
    githubId: {
      type: String,
      default: null,
    },
    githubToken: {
      type: String,
      default: null,
    },
    featureMap: {
      type: String,
      default: ""
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);

