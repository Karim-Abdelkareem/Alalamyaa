import mongoose from "mongoose";
import slugify from "slugify";

// Localized string schema for supporting multiple languages
const localizedStringSchema = new mongoose.Schema(
  {
    en: {
      type: String,
      trim: true,
      required: function () {
        return !this.ar;
      },
    },
    ar: {
      type: String,
      trim: true,
      required: function () {
        return !this.en;
      },
    },
  },
  { _id: false, strict: false }
);

// Localized slug schema for multilingual slugs
const localizedSlugSchema = new mongoose.Schema(
  {
    en: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
      unique: true,
      sparse: true,
    },
    ar: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
      unique: true,
      sparse: true,
    },
  },
  { _id: false, strict: false }
);

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: localizedStringSchema,
      required: true,
    },
    slug: {
      type: localizedSlugSchema,
      unique: true,
      index: true,
      sparse: true,
    },
    description: {
      type: localizedStringSchema,
      default: { en: "", ar: "" },
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
  if (this.isModified("name") || this.isNew) {
    // Generate English slug if English name exists and slug doesn't exist or name was modified
    if (this.name.en && (!this.slug.en || this.isModified("name.en"))) {
      this.slug.en = slugify(this.name.en, { lower: true, strict: true });
    }
    // Generate Arabic slug if Arabic name exists and slug doesn't exist or name was modified
    if (this.name.ar && (!this.slug.ar || this.isModified("name.ar"))) {
      this.slug.ar = slugify(this.name.ar, { lower: true, strict: true });
    }
  }
  next();
});

const Brand = mongoose.model("Brand", brandSchema);
export default Brand;
