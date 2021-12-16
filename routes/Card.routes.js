const router = require('express').Router();

const Card = require('../models/Card.model');
const List = require('../models/List.model');
const User = require('../models/User.model');

const loggedIn = require('../middleware/loggedIn');
const { findById } = require('../models/User.model');

// FE ✅
router.post('/card/add/', loggedIn, async (req, res) => {
  const { lists, _id } = req.session.keks;
  const { saveToList, saveCard } = req.body;

  try {
    let card = await Card.findOne({ id: saveCard.id });
    let user = await User.findById(_id);

    if (!card) {
      card = await Card.create({
        id: saveCard.id,
        name: saveCard.name,
        supertype: saveCard.supertype,
        types: saveCard.types,
        set: saveCard.set,
        number: saveCard.number,
        artist: saveCard.artist,
        rarity: saveCard.rarity,
        flavorText: saveCard.flavorText,
        images: saveCard.images,
      });
    } else {
      let list = await List.findOne({
        title: saveToList,
        user: _id,
        cards: card,
      });
      if (list) {
        let response = {
          success: false,
          image: card.images.small,
          messageTitle: 'Already saved!',
          message: `List ${list.title} already includes ${card.name}.`,
          user,
        };
        res.status(200).json(response);
        return;
      }
    }

    let list = await List.findOneAndUpdate(
      {
        title: saveToList,
        user: _id,
      },
      {
        title: saveToList,
        user: _id,
        isPublic: true,
        $push: { cards: card._id },
      },
      { new: true, upsert: true }
    );

    if (!lists.includes(list._id)) {
      user = await User.findByIdAndUpdate(
        _id,
        {
          $push: { lists: list },
        },
        {
          new: true,
        }
      );
    }

    let response = {
      success: true,
      image: card.images.small,
      messageTitle: 'Successfully saved!',
      message: `${card.name} added to list ${list.title}.`,
      user,
    };

    req.session.keks = user;
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
      trainer: 0,
      pokemon: 0,
    };

    cardLists.forEach((list) =>
      list.cards.forEach((card) => {
        switch (card.supertype) {
          case 'Energy':
            stats.energy++;
            break;
          case 'Trainer':
            stats.trainer++;
            break;
          case 'Pokémon':
            stats.pokemon++;
            break;
        }
      })
    );

    res.status(200).json(stats);
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
