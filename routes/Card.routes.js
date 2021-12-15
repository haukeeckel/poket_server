const router = require('express').Router();

const Card = require('../models/Card.model');
const List = require('../models/List.model');
const User = require('../models/User.model');

const loggedIn = require('../middleware/loggedIn');

// FE ✅
router.post('/card/add/', loggedIn, async (req, res) => {
  const { lists, _id } = req.session.keks;
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
    let card = await Card.findOne({ id });
    let user = await User.findById(_id);

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
    } else {
      let list = await List.findOne({ user: _id, cards: card });
      if (list) {
        let response = {
          success: false,
          card: card.name,
          list: list.title,
          image: card.images.small,
          user,
        };
        res.status(200).json(response);
        return;
      }
    }

    let list = await List.findByIdAndUpdate(
      lists[0],
      {
        $push: { cards: card._id },
      },
      { new: true }
    );

    user = await User.findOneAndUpdate(
      _id,
      {
        $push: {
          lastAdded: {
            $each: [card._id],
            $slice: -3,
          },
        },
      },
      { new: true }
    );

    let response = {
      success: true,
      card: card.name,
      list: list.title,
      image: card.images.small,
      user,
    };

    res.status(200).json(response);
  } catch (err) {
    res.status(400).json({
      errorMessage: 'oops power failure',
      message: err,
    });
  }
});

// FE ✅
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

// FE ✅
router.post('/collection/stats/', loggedIn, async (req, res) => {
  const { lists } = req.body;

  try {
    const cardLists = await List.find({ _id: lists }).populate('cards');

    let stats = {
      lists: cardLists.length,
      energy: 0,
      tranier: 0,
      pokemon: 0,
    };

    cardLists.forEach((list) =>
      list.cards.forEach((card) => {
        switch (card.supertype) {
          case 'Energy':
            stats.energy++;
            break;
          case 'Trainer':
            stats.tranier++;
            break;
          case 'Pokémon':
            stats.pokemon++;
            break;
        }
      })
    );

    res.status(200).json(cardLists);
  } catch (err) {
    res.status(400).json({
      errorMessage: 'oops power failure',
      message: err,
    });
  }
});

// FE ✅
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
