import mongoose from "mongoose";

import slugify from "slugify";

const subcategorySchema = new mongoose.Schema(
  {
    name: {
      en: {
        type: String,
        required: [true, "Subcategory name in English is required"],
      },
      ar: {
        type: String,
        required: [true, "Subcategory name in Arabic is required"],
      }
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
      }
    },
    description: {
      en: {
        type: String,
        required: [true, "Subcategory description in English is required"],
      },
      ar: {
        type: String,
        required: [true, "Subcategory description in Arabic is required"],
      }
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
      en: { type: String, maxlength: [60, "Meta title cannot exceed 60 characters"] },
      ar: { type: String, maxlength: [60, "Meta title cannot exceed 60 characters"] }
    },
    metaDescription: {
      en: { type: String, maxlength: [160, "Meta description cannot exceed 160 characters"] },
      ar: { type: String, maxlength: [160, "Meta description cannot exceed 160 characters"] }
    },
  },
  {
    timestamps: true,
  }
);

subcategorySchema.pre("save", function (next) {
  if (this.isModified("name")) {
    if (this.name.en) {
      this.slug.en = slugify(this.name.en, {
        lower: true,
        strict: true,
      });
    }
    if (this.name.ar) {
      this.slug.ar = slugify(this.name.ar, {
        lower: true,
        strict: true,
        locale: 'ar'
      });
    }
  }
  next();
});

subcategorySchema.index({ "name.en": 1 });
subcategorySchema.index({ "name.ar": 1 });
// Note: slug indexes are automatically created by unique: true
subcategorySchema.index({ category: 1, isActive: 1, order: 1 });

subcategorySchema.statics.findActive = function () {
  return this.find({ isActive: true }).sort("order");
};

subcategorySchema.statics.findBySlug = function (slug) {
  return this.findOne({
    $or: [
      { "slug.en": slug },
      { "slug.ar": slug }
    ],
    isActive: true
  });
};

subcategorySchema.statics.findByCategory = function (categoryId, activeOnly = true) {
  const query = { category: categoryId };
  if (activeOnly) query.isActive = true;
  return this.find(query).sort("order");
};

subcategorySchema.methods.getLocalized = function (language = 'en') {
  const lang = language === 'ar' ? 'ar' : 'en';
  return {
    _id: this._id,
    name: this.name[lang],
    slug: this.slug[lang],
    description: this.description[lang],
    metaTitle: this.metaTitle?.[lang],
    metaDescription: this.metaDescription?.[lang],
    category: this.category,
    subSubcategories: this.subSubcategories,
    isActive: this.isActive,
    order: this.order,
    image: this.image,
    icon: this.icon,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

subcategorySchema.virtual('localizedData').get(function() {
  return {
    en: this.getLocalized('en'),
    ar: this.getLocalized('ar')
  };
});

const Subcategory = mongoose.model("Subcategory", subcategorySchema);
export default Subcategory;
