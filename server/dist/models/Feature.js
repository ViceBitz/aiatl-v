import mongoose, { Schema } from 'mongoose';
const FeatureSchema = new Schema({
    projectId: {
        type: Schema.Types.ObjectId,
        ref: 'Project',
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
}, {
    timestamps: true,
});
export const Feature = mongoose.model('Feature', FeatureSchema);
