const router = require('express').Router();

const Card = require('../models/Card.model');
const List = require('../models/List.model');

const loggedIn = require('../middleware/loggedIn');

router.post('/card/add/', loggedIn, async (req, res) => {
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
    images,
  } = req.body;

  try {
    let card = await Card.findOne({ id, set: { id: set.id } });

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
        images,
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
      list: list.title,
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

router.post('/lists/', loggedIn, async (req, res) => {
  const { lists } = req.body;

  try {
    const cardLists = await List.find({ _id: lists }).populate('cards');

    res.status(200).json(cardLists);
  } catch (err) {
    res.status(400).json({
      errorMessage: 'oops power failure',
      message: err,
    });
  }
});

router.patch('/lists/card/remove', loggedIn, async (req, res) => {
  const { listId, cardId } = req.body;

  try {
    const list = await List.findByIdAndUpdate(listId, {
      $pull: { cards: cardId },
    });

    const lists = await List.find({ user: list.user }).populate('cards');

    res.status(200).json(lists);
  } catch (err) {
    res.status(400).json({
      errorMessage: 'oops power failure',
      message: err,
    });
  }
});

module.exports = router;
