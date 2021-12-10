const { Schema, model } = require('mongoose');

const lightSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    id: {
      type: String,
      unique: true,
    },
    xy: Boolean,
    mirek: Boolean,
    name: String,
    type: String,
  },
  {
    timestamps: true,
  }
);

const Light = model('Light', lightSchema);

module.exports = Light;
