import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
    id:Number,
    title: String,
    excerpt: String,
    author: String,
    category: String,
    image: String,
    tags: [String],
}, {
    timestamps: true
});

export default mongoose.model('Blog', blogSchema);
