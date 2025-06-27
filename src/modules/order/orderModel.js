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

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
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
      },
    ],

    totalOrderPrice: {
      type: Number,
      required: true,
    },
    shippingAddress: {
      address: {
        type: localizedStringSchema,
        required: true,
      },
      city: {
        type: localizedStringSchema,
        required: true,
      },
      postalCode: { 
        type: String, 
        required: true 
      },
      country: {
        type: localizedStringSchema,
        required: true,
      },
    },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    statusDisplay: {
      type: localizedStringSchema,
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ["cash", "credit_card", "bank_transfer"],
      default: "cash",
    },
    paymentMethodDisplay: {
      type: localizedStringSchema,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    paymentStatusDisplay: {
      type: localizedStringSchema,
    },
    notes: {
      type: optionalLocalizedStringSchema,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save middleware to automatically set display values based on status
orderSchema.pre('save', function(next) {
  const statusMap = {
    pending: { en: "Pending", ar: "قيد الانتظار" },
    processing: { en: "Processing", ar: "قيد المعالجة" },
    shipped: { en: "Shipped", ar: "تم الشحن" },
    delivered: { en: "Delivered", ar: "تم التسليم" },
    cancelled: { en: "Cancelled", ar: "ملغي" }
  };

  const paymentMethodMap = {
    cash: { en: "Cash", ar: "نقدي" },
    credit_card: { en: "Credit Card", ar: "بطاقة ائتمان" },
    bank_transfer: { en: "Bank Transfer", ar: "تحويل بنكي" }
  };

  const paymentStatusMap = {
    pending: { en: "Pending", ar: "قيد الانتظار" },
    paid: { en: "Paid", ar: "مدفوع" },
    failed: { en: "Failed", ar: "فشل" }
  };

  if (this.status && statusMap[this.status]) {
    this.statusDisplay = statusMap[this.status];
  }

  if (this.paymentMethod && paymentMethodMap[this.paymentMethod]) {
    this.paymentMethodDisplay = paymentMethodMap[this.paymentMethod];
  }

  if (this.paymentStatus && paymentStatusMap[this.paymentStatus]) {
    this.paymentStatusDisplay = paymentStatusMap[this.paymentStatus];
  }

  next();
});

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

const Order = mongoose.model("Order", orderSchema);

export default Order;
