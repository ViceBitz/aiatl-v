import mongoose, { Schema, Document } from 'mongoose';

export interface IFeature extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  featureName: string;
  userSummary: string;
  aiSummary: string;
  filenames: string[];
  neighbors: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const FeatureSchema = new Schema<IFeature>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    featureName: {
      type: String,
      required: true,
    },
    userSummary: {
      type: String,
      required: true,
    },
    aiSummary: {
      type: String,
      required: true,
    },
    filenames: {
      type: [String],
      default: [],
    },
    neighbors: {
      type: [Schema.Types.ObjectId],
      ref: 'Feature',
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const Feature = mongoose.model<IFeature>('Feature', FeatureSchema);

