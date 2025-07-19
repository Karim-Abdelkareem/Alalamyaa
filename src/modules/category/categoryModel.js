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
      en: {
        type: String,
        required: [true, "Category name in English is required"],
      },
      ar: {
        type: String,
        required: [true, "Category name in Arabic is required"],
      },
    },
    slug: {
      en: {
        type: String,
        unique: true,
        lowercase: true,
      },
      ar: {
        type: String,
        unique: true,
        lowercase: true,
      },
    },
    description: {
      en: {
        type: String,
        required: [true, "Category description in English is required"],
      },
      ar: {
        type: String,
        required: [true, "Category description in Arabic is required"],
      },
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
    image: {
      type: String,
      trim: true,
    },
    icon: {
      type: String,
      trim: true,
    },
    metaTitle: {
      en: {
        type: String,
        maxlength: [60, "Meta title cannot exceed 60 characters"],
      },
      ar: {
        type: String,
        maxlength: [60, "Meta title cannot exceed 60 characters"],
      },
    },
    metaDescription: {
      en: {
        type: String,
        maxlength: [160, "Meta description cannot exceed 160 characters"],
      },
      ar: {
        type: String,
        maxlength: [160, "Meta description cannot exceed 160 characters"],
      },
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to generate slugs for both languages
categorySchema.pre("save", function (next) {
  if (this.isModified("name")) {
    if (this.name.en) {
      this.slug.en = slugify(this.name.en, {
        lower: true,
        strict: true,
      });
    }
    if (this.name.ar) {
      // For Arabic, we'll use transliteration or English equivalent for URL-friendly slug
      // You might want to use a transliteration library here
      this.slug.ar = slugify(this.name.ar, {
        lower: true,
        strict: true,
        locale: "ar",
      });
    }
  }
  next();
});

// Index for better performance
categorySchema.index({ "name.en": 1 });
categorySchema.index({ "name.ar": 1 });
// Note: slug indexes are automatically created by unique: true
categorySchema.index({ isActive: 1, order: 1 });

// Static method to find active categories
categorySchema.statics.findActive = function () {
  return this.find({ isActive: true }).sort("order");
};

// Static method to find by slug in any language
categorySchema.statics.findBySlug = function (slug) {
  return this.findOne({
    $or: [{ "slug.en": slug }, { "slug.ar": slug }],
    isActive: true,
  });
};

// Method to get category with subcategories
categorySchema.methods.getWithSubcategories = async function () {
  await this.populate("subcategories");
  return this;
};

// Method to get localized data
categorySchema.methods.getLocalized = function (language = "en") {
  const lang = language === "ar" ? "ar" : "en";
  return {
    _id: this._id,
    name: this.name[lang],
    slug: this.slug[lang],
    description: this.description[lang],
    metaTitle: this.metaTitle?.[lang],
    metaDescription: this.metaDescription?.[lang],
    subcategories: this.subcategories,
    isActive: this.isActive,
    order: this.order,
    image: this.image,
    icon: this.icon,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

// Virtual for getting both language versions
categorySchema.virtual("localizedData").get(function () {
  return {
    en: this.getLocalized("en"),
    ar: this.getLocalized("ar"),
  };
});

const Category = mongoose.model("Category", categorySchema);

export default Category;
