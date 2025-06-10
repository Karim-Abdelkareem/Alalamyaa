import mongoose from "mongoose";
import slugify from "slugify";

const storageOptionSchema = new mongoose.Schema(
  {
    sku: { type: String, unique: true, index: true },
    storage: { type: String, required: true },
    ram: { type: String },
    price: { type: Number, required: true },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    priceAfterDiscount: { type: Number, default: 0 },
    stock: { type: Number, required: true },
  },
  { _id: false }
);

const variantSchema = new mongoose.Schema(
  {
    color: { type: String, required: true },
    images: [{ type: String, required: true }],
    storageOptions: [storageOptionSchema],
  },
  { _id: false }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true, index: true },
    description: { type: String, required: true },
    coverImage: { type: String },

    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    subCategory: { type: mongoose.Schema.Types.ObjectId, ref: "Subcategory" },
    subSubcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubSubcategory",
    },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: "Brand" },

    variants: [variantSchema],

    specifications: { type: mongoose.Schema.Types.Mixed },

    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],

    sold: { type: Number, default: 0, min: 0 },
    ratingCount: { type: Number, default: 0, min: 0 },
    views: { type: Number, default: 0 },

    basePrice: { type: Number, default: 0 },
    bestPriceAfterDiscount: { type: Number, default: 0 },
    totalStock: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Slug + SKU + basePrice + totalStock generation
productSchema.pre("save", async function (next) {
  // Generate slug from name
  if (this.name && !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }

  if (this.variants?.length > 0 && this.name && this.brand) {
    const brandDoc = await mongoose.model("Brand").findById(this.brand);
    const brandCode = brandDoc?.name?.slice(0, 3).toUpperCase() || "GEN";
    const modelCode = this.name.replace(/\s+/g, "").slice(0, 5).toUpperCase();

    let allPrices = [];
    let totalStock = 0;

    this.variants.forEach((variant, varIdx) => {
      const color = (variant.color || "NA").toUpperCase();

      variant.storageOptions = variant.storageOptions.map((opt, optIdx) => {
        const storage = opt.storage?.toUpperCase() || "0GB";
        const sku = `${brandCode}-${modelCode}-${color}-${storage}-${varIdx}${optIdx}`;
        const price = opt.price;
        const discount = opt.discount || 0;

        // Calculate priceAfterDiscount
        const priceAfterDiscount =
          discount > 0 ? +(price * (1 - discount / 100)).toFixed(2) : price;

        allPrices.push(price);
        totalStock += opt.stock;

        return { ...opt, sku, priceAfterDiscount };
      });
    });

    if (allPrices.length > 0) this.basePrice = Math.min(...allPrices);
    if (totalStock > 0) this.bestPriceAfterDiscount = Math.min(...allPrices);
    this.totalStock = totalStock;
  }

  next();
});

const Product = mongoose.model("Product", productSchema);
export default Product;
