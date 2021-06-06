const mongoose = require("mongoose");

const questionDataSchema = mongoose.Schema({
  userId: String,
  questionId: String,
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.model("questiondata", questionDataSchema);
