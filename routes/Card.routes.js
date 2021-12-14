const router = require('express').Router();

const Card = require('../models/Card.model');
const List = require('../models/List.model');

const loggedIn = require('../middleware/loggedIn');

router.post('/card/add/:cardId', loggedIn, async (req, res) => {
  const { lists } = req.session.keks;
  const {
    id,
    name,
    supertype,
    types,
    set,
    number,
    artist,
    rarity,
    flavorText,
  } = req.body;

  try {
    let card = await find({ id, set: { id: set.id } });

    if (!card) {
      card = await Card.create({
        id,
        name,
        supertype,
        types,
        set,
        number,
        artist,
        rarity,
        flavorText,
      });
    }

    let list = await List.findByIdAndUpdate(
      lists[0],
      {
        $push: { cards: card._id },
      },
      { new: true }
    );

    let response = {
      card: card.name,
      list: list.name,
      image: card.images.small,
    };

    res.status(200).json(response);
  } catch (err) {
    res.status(400).json({
      errorMessage: 'oops power failure',
      message: err,
    });
  }
});

module.exports = router;
