const router = require('express').Router();
const axios = require('axios');
const https = require('https');

const User = require('../models/User.model');
const Light = require('../models/Light.model');
const loggedIn = require('../middleware/loggedIn');
const cert = process.env.HUE_PEM.replace(/\\n/g, '\n');

router.get('/user/connect', loggedIn, async (req, res) => {
  const { _id } = req.session.keks;
  try {
    let possibleBridges = await axios.get('https://discovery.meethue.com/');
    possibleBridges = [
      ...new Set(possibleBridges.data.map((item) => item.internalipaddress)),
    ];

    possibleBridges.map(async (elem) => {
      try {
        const user = await User.findById(_id);

        let { data } = await axios.post(
          `https://${elem}/api/`,
          {
            devicetype: `huehu#${user.username}`,
            generateclientkey: true,
          },
          {
            headers: {
              'content-type': 'application/json',
              accept: 'application/json',
            },
            httpsAgent: new https.Agent({
              rejectUnauthorized: false,
              cacert: cert,
              keepAlive: true,
            }),
            withCredentials: true,
          }
        );

        if (data[0].error) {
          if (data[0].error.type === 101) {
            res.status(400).json({
              message: data[0].error.description,
            });
          }
        }

        if (data[0].success) {
          await User.findByIdAndUpdate(
            _id,
            {
              bridgeUsername: data[0].success.username,
              bridgeClientkey: data[0].success.clientkey,
              bridgeIP: elem,
            },
            { new: true }
          );
        }
      } catch (err) {}

      return;
    });
  } catch (err) {
    res.status(400).json({
      errorMessage: 'oops power failure',
      message: err,
    });
  }
});

router.get('/user/getLights', loggedIn, async (req, res) => {
  const { _id } = req.session.keks;

  try {
    let user = await User.findById(_id);

    const {
      data: { data },
    } = await axios.get(`https://${user.bridgeIP}/clip/v2/resource/light`, {
      headers: {
        'hue-application-key': user.bridgeUsername,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
        cacert: cert,
        keepAlive: true,
      }),
      withCredentials: true,
    });

    const saveLights = data.map((elem) => {
      let obj = {
        user: _id,
        id: elem.id,
        xy: elem.hasOwnProperty('color'),
        mirek: elem.hasOwnProperty('color_temperature'),
        archetype: elem.metadata.archetype,
        name: elem.metadata.name,
        type: elem.type,
        addUrl: elem.id_v1,
      };

      return obj;
    });

    const createdlights = await Light.create(saveLights);

    const lights = createdlights.map((elem) => elem._id.toString());

    user = await User.findByIdAndUpdate(_id, { lights }, { new: true });

    user.passwort = '***';
    req.session.keks = user;

    res.status(200).json({
      message: 'Lights found and linked ',
    });
  } catch (err) {
    res.status(400).json({
      errorMessage: 'oops power failure',
      message: err,
    });
  }
});

module.exports = router;
