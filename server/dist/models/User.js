import mongoose, { Schema } from 'mongoose';
const UserSchema = new Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    githubToken: {
        type: String,
        default: null,
    },
}, {
    timestamps: true,
});
export const User = mongoose.model('User', UserSchema);
