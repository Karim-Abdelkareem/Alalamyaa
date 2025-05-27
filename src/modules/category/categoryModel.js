import mongoose from 'mongoose';
import slugify from 'slugify';

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        trim: true,
        unique: true,
        minlength: [2, 'Category name must be at least 2 characters long'],
        maxlength: [50, 'Category name cannot exceed 50 characters']
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true
    },
    description: {
        type: String,
        required: [true, 'Category description is required'],
        trim: true,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    image: {
        type: String,
        default: 'default-category.jpg'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

categorySchema.virtual('subcategories', {
    ref: 'Category',
    localField: '_id',
    foreignField: 'parent'
});

categorySchema.pre('save', function(next) {
    if (this.isModified('name')) {
        this.slug = slugify(this.name, {
            lower: true,       
            strict: true,      
            locale: 'en',       
            trim: true        
        });
    }
    next();
});

categorySchema.statics.findActive = function() {
    return this.find({ isActive: true }).sort('order');
};

categorySchema.methods.getWithSubcategories = async function() {
    await this.populate('subcategories');
    return this;
};

const Category = mongoose.model('Category', categorySchema);

export default Category;
