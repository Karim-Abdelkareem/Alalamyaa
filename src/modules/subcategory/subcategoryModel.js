import mongoose from "mongoose";

import slugify from "slugify";

const subcategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Subcategory name is required"],
      trim: true,
      unique: true,
      minlength: [2, "Subcategory name must be at least 2 characters long"],
      maxlength: [50, "Subcategory name cannot exceed 50 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: [true, "Subcategory description is required"],
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Subcategory category is required"],
    },
    subSubcategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubSubcategory",
        default: [],
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

subcategorySchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
    });
  }
  next();
});

subcategorySchema.statics.findActive = function () {
  return this.find({ isActive: true }).sort("name");
};

const Subcategory = mongoose.model("Subcategory", subcategorySchema);
export default Subcategory;
