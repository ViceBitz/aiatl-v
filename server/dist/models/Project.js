import mongoose, { Schema } from 'mongoose';
const ProjectSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    repoId: {
        type: String,
        required: true,
        index: true,
    },
}, {
    timestamps: true,
});
export const Project = mongoose.model('Project', ProjectSchema);
