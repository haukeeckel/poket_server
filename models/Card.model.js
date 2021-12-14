const { Schema, model } = require('mongoose');

const cardSchema = new Schema(
  {
    id: String,
    name: String,
    supertype: String,
    types: [String],
    set: {
      id: String,
      name: String,
      series: String,
      images: {
        symbol: String,
        logo: String,
      },
    },
    number: String,
    artist: String,
    rarity: String,
    flavorText: String,
    images: {
      small: String,
      large: String,
    },
  },
  {
    timestamps: true,
  }
);

const Card = model('Card', cardSchema);

module.exports = Card;
