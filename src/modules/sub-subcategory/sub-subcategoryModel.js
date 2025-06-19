import mongoose from "mongoose";
import slugify from "slugify";

const subSubcategorySchema = new mongoose.Schema(
  {
    name: {
      en: {
        type: String,
        required: [true, "Sub-subcategory name in English is required"],
      },
      ar: {
        type: String,
        required: [true, "Sub-subcategory name in Arabic is required"],
      }
    },
    slug: {
      en: {
        type: String,
        lowercase: true,
        unique: true,
      },
      ar: {
        type: String,
        lowercase: true,
        unique: true,
      }
    },
    description: {
      en: {
        type: String,
     
      },
      ar: {
        type: String,
        trim: true,
        maxlength: [500, "Description cannot exceed 500 characters"],
      }
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

// Pre-save middleware to generate slugs for both languages
subSubcategorySchema.pre("save", function (next) {
  if (this.isModified("name")) {
    if (this.name.en) {
      this.slug.en = slugify(this.name.en, {
        lower: true,
        strict: true,
        locale: "en",
      });
    }
    if (this.name.ar) {
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
subSubcategorySchema.index({ "name.en": 1 });
subSubcategorySchema.index({ "name.ar": 1 });
// Note: slug indexes are automatically created by unique: true
subSubcategorySchema.index({ category: 1, subcategory: 1, isActive: 1, order: 1 });

// Static method to find active sub-subcategories
subSubcategorySchema.statics.findActive = function () {
  return this.find({ isActive: true }).sort("order");
};

// Static method to find by slug in any language
subSubcategorySchema.statics.findBySlug = function (slug) {
  return this.findOne({
    $or: [
      { "slug.en": slug },
      { "slug.ar": slug }
    ],
    isActive: true
  });
};

// Static method to find by category
subSubcategorySchema.statics.findByCategory = function (categoryId, activeOnly = true) {
  const query = { category: categoryId };
  if (activeOnly) query.isActive = true;
  return this.find(query).sort("order");
};

// Static method to find by subcategory
subSubcategorySchema.statics.findBySubcategory = function (subcategoryId, activeOnly = true) {
  const query = { subcategory: subcategoryId };
  if (activeOnly) query.isActive = true;
  return this.find(query).sort("order");
};

// Method to get localized data
subSubcategorySchema.methods.getLocalized = function (language = 'en') {
  const lang = language === 'ar' ? 'ar' : 'en';
  return {
    _id: this._id,
    name: this.name[lang],
    slug: this.slug[lang],
    description: this.description[lang],
    metaTitle: this.metaTitle?.[lang],
    metaDescription: this.metaDescription?.[lang],
    category: this.category,
    subcategory: this.subcategory,
    isActive: this.isActive,
    order: this.order,
    image: this.image,
    icon: this.icon,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Virtual for getting both language versions
subSubcategorySchema.virtual('localizedData').get(function() {
  return {
    en: this.getLocalized('en'),
    ar: this.getLocalized('ar')
  };
});

const SubSubcategory = mongoose.model("SubSubcategory", subSubcategorySchema);

export default SubSubcategory;

function cleanMongoData(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  if (obj.$oid) return obj.$oid;
  if (obj.$date) return obj.$date;
  
  if (Array.isArray(obj)) {
    return obj.map(cleanMongoData);
  }
  
  const cleaned = {};
  for (const [key, value] of Object.entries(obj)) {
    // Skip MongoDB internal fields for updates
    if (['_id', 'createdAt', 'updatedAt', '__v'].includes(key)) continue;
    cleaned[key] = cleanMongoData(value);
  }
  return cleaned;
}

// Usage:
const mongoData = { /* your mongo export data */ };
const apiData = cleanMongoData(mongoData);
