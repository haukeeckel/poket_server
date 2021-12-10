const router = require('express').Router();
const axios = require('axios');
const https = require('https');

const User = require('../models/User.model');
const loggedIn = require('../middleware/loggedIn');

router.get('/user/connect', loggedIn, async (req, res) => {
  const { _id } = req.session.keks;
  try {
    let possibleBridges = await axios.get('https://discovery.meethue.com/');
    possibleBridges = [
      ...new Set(possibleBridges.data.map((item) => item.internalipaddress)),
    ];

    possibleBridges.map(async (elem) => {
      try {
        let cert = process.env.HUE_PEM.replace(/\\n/g, '\n');
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
          await User.findByIdAndUpdate(_id, {
            bridgeUsername: data[0].success.username,
            bridgeClientkey: data[0].success.clientkey,
            bridgeIP: elem,
          });
        }
      } catch (err) {
        res.status(400).json({
          errorMessage: 'oops power failure',
          message: err,
        });
      }

      return;
    });
  } catch (err) {
    res.status(400).json({
      errorMessage: 'oops power failure',
      message: err,
    });
  }
});

module.exports = router;
