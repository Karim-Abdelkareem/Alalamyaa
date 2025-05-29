import mongoose from "mongoose";
import slugify from "slugify";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    priceAfterDiscount: {
      type: Number,
      min: 0,
    },
    discount: {
      type: Number,
    },
    coverImage: {
      type: String,
    },
    images: [
      {
        type: String,
      },
    ],
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subcategory",
    },
    subSubcategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubSubcategory",
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Brand",
    },
    stock: {
      type: Number,
      default: 0,
    },
    specs: {
      type: Map,
      of: String,
      default: {},
    },
    variants: [
      {
        type: Map,
        of: String,
        default: {},
      },
    ],
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
    sold: {
      type: Number,
      default: 0,
      min: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.pre("save", function (next) {
  if (this.name && !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

const Product = mongoose.model("Product", productSchema);

export default Product;
