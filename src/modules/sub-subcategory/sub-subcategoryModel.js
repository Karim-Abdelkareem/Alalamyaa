import mongoose from "mongoose";
import slugify from "slugify";

const subSubcategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Sub-subcategory name is required"],
      trim: true,
      unique: true,
      minlength: [2, "Sub-subcategory name must be at least 2 characters long"],
      maxlength: [100, "Sub-subcategory name cannot exceed 100 characters"],
    },
    slug: {
      type: String,
      lowercase: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Parent category is required"],
    },
    subcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategory",
      required: [true, "Parent subcategory is required"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Generate slug from name
subSubcategorySchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
      locale: "en",
    });
  }
  next();
});

const SubSubcategory = mongoose.model("SubSubcategory", subSubcategorySchema);

export default SubSubcategory;
