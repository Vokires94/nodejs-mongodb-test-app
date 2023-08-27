const mongoose = require("mongoose");
const ProductsSchema = new mongoose.Schema({
  items: {
    type: [String],
    required: [true, "Please select items!"],
    unique: false,
    default: undefined,
  },
  amount: {
    type: String,
    required: [true, "Please provide an Amount!"],
    unique: false,
  },
  date: {
    type: Date,
    required: [true, "Please provide a Date!"],
    unique: false,
    default: Date.now
  },
});

module.exports = mongoose.model.Products || mongoose.model("Products", ProductsSchema);