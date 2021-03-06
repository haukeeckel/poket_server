const { Schema, model } = require('mongoose');

const userSchema = new Schema(
  {
    username: {
      type: String,
      unique: true,
    },
    email: {
      type: String,
      unique: true,
    },
    password: String,
    bridgeUsername: String,
    bridgeClientkey: String,
    bridgeIP: String,
    lights: {
      type: [Schema.Types.ObjectId],
      ref: 'Light',
    },
  },
  {
    timestamps: true,
  }
);

const User = model('User', userSchema);

module.exports = User;
