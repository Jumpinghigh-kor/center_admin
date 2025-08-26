const express = require('express');
const router = express.Router();
const { graphqlProxy } = require('../../controllers/app/deliveryTracker');

// Delivery Tracker GraphQL proxy
router.post('/graphql', graphqlProxy);

module.exports = router;


