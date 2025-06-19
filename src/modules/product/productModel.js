import mongoose from "mongoose";
import slugify from "slugify";

// Re-using existing localized string and slug schemas
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

// --- MODIFIED: optionValueSchema to embed color details ---
const optionValueSchema = new mongoose.Schema(
  {
    value: { type: localizedStringSchema, required: true }, // e.g., "Black - 128GB - 3GB RAM"
    sku: { type: String, unique: true, index: true, sparse: true },

    // Embedded Color Fields
    colorName: { type: localizedStringSchema, trim: true }, // e.g., {en: "Natural Titanium", ar: "تيتانيوم طبيعي"}
    colorHex: {
      type: String,
      trim: true,
      match: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
      required: function () {
        // Required if colorName is provided and no swatch image is given
        return !!this.colorName && !this.colorSwatchImage;
      },
    },
    colorSwatchImage: {
      type: String, // URL to a small image for complex colors/textures
      trim: true,
      required: function () {
        // Required if colorName is provided and no hex code is given
        return !!this.colorName && !this.colorHex;
      },
    },

    storage: { type: String, trim: true },
    ram: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    priceAfterDiscount: { type: Number, default: 0, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    variantImages: [
      {
        url: { type: String, required: true },
        altText: { type: localizedStringSchema, trim: true },
      },
    ],
  },
  { _id: false }
);

// Add a validation for embedded color: if colorName exists, one of hexCode or swatchImage must exist
optionValueSchema.pre("validate", function (next) {
  if (this.colorName && !this.colorHex && !this.colorSwatchImage) {
    this.invalidate(
      "colorHex",
      "Either colorHex or colorSwatchImage must be provided if colorName is set."
    );
    this.invalidate(
      "colorSwatchImage",
      "Either colorHex or colorSwatchImage must be provided if colorName is set."
    );
  }
  next();
});

const variantSchema = new mongoose.Schema(
  {
    name: { type: localizedStringSchema, required: true },
    options: [optionValueSchema],
  },
  { _id: false }
);

const specificationSchema = new mongoose.Schema(
  {
    name: { type: localizedStringSchema, required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    unit: { type: localizedStringSchema, trim: true },
    isFilterable: { type: Boolean, default: false },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: localizedStringSchema, required: true },
    slug: {
      type: localizedSlugSchema,
      unique: true,
      index: true,
      sparse: true,
    },

    shortDescription: {
      type: localizedStringSchema,
      trim: true,
      maxlength: 500,
    },
    details: { type: localizedStringSchema, required: true },

    images: [
      {
        url: { type: String, required: true },
        altText: { type: localizedStringSchema, trim: true },
        isFeatured: { type: Boolean, default: false },
      },
    ],

    basePrice: { type: Number, required: true, min: 0 },
    variants: [variantSchema],
    specifications: [specificationSchema],

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategory",
      default: null,
      index: true,
    },
    subSubcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubSubcategory",
      default: null,
      index: true,
    },

    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
      required: true,
      index: true,
    },

    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    numOfReviews: { type: Number, default: 0, min: 0 },

    sold: { type: Number, default: 0, min: 0 },
    views: { type: Number, default: 0 },

    bestPriceAfterDiscount: { type: Number, default: 0, min: 0 },
    totalStock: { type: Number, default: 0, min: 0 },

    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    publishedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

productSchema.pre("save", async function (next) {
  if (this.isModified("name") || this.isNew) {
    if (this.name.en && (!this.slug.en || this.isModified("name.en"))) {
      this.slug.en = slugify(this.name.en, { lower: true, strict: true });
    }
    if (this.name.ar && (!this.slug.ar || this.isModified("name.ar"))) {
      this.slug.ar = slugify(this.name.ar, { lower: true, strict: true });
    }
  }

  if (this.variants && this.variants.length > 0) {
    let allFinalPrices = [];
    let cumulativeTotalStock = 0;

    let brandCode = "GEN";
    if (this.brand && (this.isNew || this.isModified("brand"))) {
      const Brand = mongoose.model("Brand");
      // Populate brand if it's an ObjectId and we need its name for SKU generation
      const brandDoc = await Brand.findById(this.brand);
      if (brandDoc && brandDoc.name && brandDoc.name.en) {
        brandCode = brandDoc.name.en.slice(0, 3).toUpperCase();
      }
    } else if (
      this._brandDoc &&
      this._brandDoc.name &&
      this._brandDoc.name.en
    ) {
      brandCode = this._brandDoc.name.en.slice(0, 3).toUpperCase();
    }

    const modelCode = this.name.en
      ? this.name.en.replace(/\s+/g, "").slice(0, 5).toUpperCase()
      : "PROD";

    this.variants.forEach((variantType) => {
      variantType.options.forEach((option, optIdx) => {
        if (
          !option.sku ||
          this.isModified("name.en") ||
          this.isModified("brand") ||
          this.isNew
        ) {
          const variantTypeNameCode = variantType.name.en
            ? variantType.name.en.slice(0, 3).toUpperCase()
            : "VAR";
          // --- MODIFIED: Use embedded colorName for SKU generation ---
          const colorNameForSku = option.colorName
            ? option.colorName.en
            : "NCL"; // Use 'NCL' for No Color
          const colorCode = colorNameForSku
            .replace(/\s+/g, "")
            .slice(0, 3)
            .toUpperCase();

          const storageCode = option.storage
            ? option.storage.replace(/\s+/g, "").slice(0, 4).toUpperCase()
            : "STR";
          const ramCode = option.ram
            ? option.ram.replace(/\s+/g, "").slice(0, 3).toUpperCase()
            : "RAM";
          option.sku = `${brandCode}-${modelCode}-${colorCode}-${storageCode}-${ramCode}-${optIdx}`;
        }

        const price = option.price;
        const discount = option.discount || 0;
        option.priceAfterDiscount =
          discount > 0 ? +(price * (1 - discount / 100)).toFixed(2) : price;

        allFinalPrices.push(option.priceAfterDiscount);
        cumulativeTotalStock += option.stock;
      });
    });

    let allBaseOptionPrices = [];
    this.variants.forEach((variantType) => {
      variantType.options.forEach((option) => {
        allBaseOptionPrices.push(option.price);
      });
    });
    this.basePrice =
      allBaseOptionPrices.length > 0 ? Math.min(...allBaseOptionPrices) : 0;

    this.bestPriceAfterDiscount =
      allFinalPrices.length > 0 ? Math.min(...allFinalPrices) : 0;
    this.totalStock = cumulativeTotalStock;
  } else {
    this.basePrice = 0;
    this.bestPriceAfterDiscount = 0;
    this.totalStock = 0;
  }

  next();
});

const Product = mongoose.model("Product", productSchema);
export default Product;
