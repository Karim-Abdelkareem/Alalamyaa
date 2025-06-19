import mongoose from "mongoose";
import slugify from "slugify";

const localizedStringSchema = new mongoose.Schema(
  {
    en: { type: String, trim: true, required: true },
    ar: { type: String, trim: true, required: true },
  },
  { _id: false, strict: false }
);
const categorySchema = new mongoose.Schema(
  {
    name: {
      type: localizedStringSchema,
      required: [true, "Category name is required"],
      trim: true,
      unique: true,
      minlength: [2, "Category name must be at least 2 characters long"],
      maxlength: [50, "Category name cannot exceed 50 characters"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
    },
    description: {
      type: localizedStringSchema,
      required: [true, "Category description is required"],
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    subcategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subcategory",
        default: [],
      },
    ],
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

categorySchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true,
    });
  }
  next();
});

categorySchema.statics.findActive = function () {
  return this.find({ isActive: true }).sort("order");
};

categorySchema.methods.getWithSubcategories = async function () {
  await this.populate("subcategories");
  return this;
};

const Category = mongoose.model("Category", categorySchema);

export default Category;
