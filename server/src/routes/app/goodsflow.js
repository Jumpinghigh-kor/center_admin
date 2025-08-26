const express = require('express');
const router = express.Router();
const { shippingPrint, shippingPrintDeliveryItems, shippingPrintUri, shippingDeliveriesResult, cancelDeliveries, shippingReturnDeliveryItems } = require('../../controllers/app/goodsflow');

// 굿스플로 송장 출력 API
router.post('/shipping/print', shippingPrint);
router.post('/shipping/print/deliveryItems', shippingPrintDeliveryItems);
router.post('/deliveries/shipping/return/deliveryItems', shippingReturnDeliveryItems);
router.put('/shipping/print-uri', shippingPrintUri);
router.get('/shipping/deliveries/:idCommaList', shippingDeliveriesResult);
router.delete('/deliveries/cancel', cancelDeliveries);

module.exports = router; 