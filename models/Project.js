const { Schema, model } = require("mongoose");

const projectSchema = new Schema({
  name: {type: String, required: true}
});

module.exports = model("Project", projectSchema);