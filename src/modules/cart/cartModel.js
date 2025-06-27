import mongoose from "mongoose";

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

// Optional localized string schema (both languages are optional)
const optionalLocalizedStringSchema = new mongoose.Schema(
  {
    en: {
      type: String,
      trim: true,
    },
    ar: {
      type: String,
      trim: true,
    },
  },
  { _id: false, strict: false }
);

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  notes: {
    type: optionalLocalizedStringSchema,
  },
});

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [cartItemSchema],
    totalPrice: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
      max: [100, "Discount cannot be greater than 100"],
    },
    discountDescription: {
      type: optionalLocalizedStringSchema,
    },
    notes: {
      type: optionalLocalizedStringSchema,
    },
    status: {
      type: String,
      enum: ["active", "abandoned", "converted"],
      default: "active",
    },
    statusDisplay: {
      type: localizedStringSchema,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Calculate total price before saving
cartSchema.pre("save", function (next) {
  this.totalPrice = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);

  // Auto-populate status display based on status
  const statusMap = {
    active: { en: "Active", ar: "نشط" },
    abandoned: { en: "Abandoned", ar: "مهجور" },
    converted: { en: "Converted", ar: "تم التحويل" }
  };

  if (this.status && statusMap[this.status]) {
    this.statusDisplay = statusMap[this.status];
  }

  next();
});

// Method to add item to cart
cartSchema.methods.addItem = async function (productId, quantity, price, notes = null) {
  const existingItem = this.items.find(
    (item) => item.product.toString() === productId.toString()
  );

  if (existingItem) {
    existingItem.quantity += quantity;
    if (notes) {
      existingItem.notes = notes;
    }
  } else {
    const newItem = {
      product: productId,
      quantity,
      price,
    };
    if (notes) {
      newItem.notes = notes;
    }
    this.items.push(newItem);
  }

  return this.save();
};

// Method to remove item from cart
cartSchema.methods.removeItem = async function (productId) {
  this.items = this.items.filter(
    (item) => item.product.toString() !== productId.toString()
  );
  return this.save();
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = async function (productId, quantity) {
  const item = this.items.find(
    (item) => item.product.toString() === productId.toString()
  );

  if (item) {
    item.quantity = quantity;
    return this.save();
  }
  return this;
};

// Method to update item notes
cartSchema.methods.updateItemNotes = async function (productId, notes) {
  const item = this.items.find(
    (item) => item.product.toString() === productId.toString()
  );

  if (item) {
    item.notes = notes;
    return this.save();
  }
  return this;
};

// Method to apply discount with description
cartSchema.methods.applyDiscount = async function (discountPercent, description = null) {
  this.discount = discountPercent;
  if (description) {
    this.discountDescription = description;
  }
  return this.save();
};

// Method to clear cart
cartSchema.methods.clearCart = async function () {
  this.items = [];
  this.totalPrice = 0;
  this.discount = 0;
  this.discountDescription = undefined;
  this.notes = undefined;
  return this.save();
};

// Method to mark cart as abandoned
cartSchema.methods.markAsAbandoned = async function () {
  this.status = "abandoned";
  return this.save();
};

// Method to mark cart as converted (when order is placed)
cartSchema.methods.markAsConverted = async function () {
  this.status = "converted";
  return this.save();
};

cartSchema.virtual("totalPriceAfterDiscount").get(function () {
  return this.totalPrice - (this.totalPrice * this.discount / 100);
});

// Virtual for getting localized discount description
cartSchema.virtual("discountText").get(function () {
  if (this.discount > 0) {
    return {
      en: `${this.discount}% discount applied${this.discountDescription?.en ? ': ' + this.discountDescription.en : ''}`,
      ar: `تم تطبيق خصم ${this.discount}%${this.discountDescription?.ar ? ': ' + this.discountDescription.ar : ''}`
    };
  }
  return {
    en: "No discount applied",
    ar: "لم يتم تطبيق أي خصم"
  };
});

const Cart = mongoose.model("Cart", cartSchema);

export default Cart;
