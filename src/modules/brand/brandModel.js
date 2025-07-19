import mongoose from "mongoose";
import slugify from "slugify";
const localizedStringSchema = new mongoose.Schema(
  {
    en: { type: String, trim: true, required: true },
    ar: { type: String, trim: true, required: true },
  },
  { _id: false, strict: false }
);
const brandSchema = new mongoose.Schema(
  {
    name: {
      type: localizedStringSchema,
      required: true,
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
    },
    description: {
      type: String,
      default: "",
    },
    logoUrl: {
      type: String,
      default: "https://via.placeholder.com/150", // Default logo URL
    },
    websiteUrl: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

brandSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

const Brand = mongoose.model("Brand", brandSchema);
export default Brand;
