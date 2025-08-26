const axios = require('axios');

// 굿스플로 API 프록시 엔드포인트
const shippingPrint = async (req, res) => {
  try {
    const response = await axios.post(
      'https://api.goodsflow.io/api/deliveries/shipping/print',
      req.body,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': process.env.GOODSFLOW_API_KEY
        }
      }
    );
    
    res.status(200).json(response.data);
  } catch (error) {
    console.error('굿스플로 API 오류:', error.response?.data || error.message);
    
    if (error.response) {
      // 서버에서 오류 응답을 받은 경우
      res.status(error.response.status).json({
        error: true,
        message: error.response.data?.error?.message || error.response.data?.message || '서버 오류가 발생했습니다.',
        details: error.response.data
      });
    } else if (error.request) {
      // 요청은 보냈지만 응답을 받지 못한 경우
      res.status(500).json({
        error: true,
        message: '서버에 연결할 수 없습니다. 네트워크 연결을 확인해 주세요.'
      });
    } else {
      // 요청 설정 중 오류가 발생한 경우
      res.status(500).json({
        error: true,
        message: '요청 설정 중 오류가 발생했습니다.'
      });
    }
  }
};

// 굿스플로 반품접수 - 물품정보분리 API
const shippingReturnDeliveryItems = async (req, res) => {
  try {
    const response = await axios.post(
      'https://api.goodsflow.io/api/deliveries/shipping/return/deliveryItems',
      req.body,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': process.env.GOODSFLOW_API_KEY
        }
      }
    );
    res.status(200).json(response.data);
  } catch (error) {
    console.error('굿스플로 반품접수 API 오류:', error.response?.data || error.message);
    if (error.response) {
      res.status(error.response.status).json({
        error: true,
        message: error.response.data?.error?.message || error.response.data?.message || '서버 오류가 발생했습니다.',
        details: error.response.data
      });
    } else if (error.request) {
      res.status(500).json({
        error: true,
        message: '서버에 연결할 수 없습니다. 네트워크 연결을 확인해 주세요.'
      });
    } else {
      res.status(500).json({
        error: true,
        message: '요청 설정 중 오류가 발생했습니다.'
      });
    }
  }
};

// 굿스플로 API 프록시 엔드포인트 (물품정보분리)
const shippingPrintDeliveryItems = async (req, res) => {
  try {
    const response = await axios.post(
      'https://api.goodsflow.io/api/deliveries/shipping/print/deliveryItems',
      req.body,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': process.env.GOODSFLOW_API_KEY
        }
      }
    );
    
    res.status(200).json(response.data);
  } catch (error) {
    console.error('굿스플로 API 오류:', error.response?.data || error.message);
    
    if (error.response) {
      // 서버에서 오류 응답을 받은 경우
      res.status(error.response.status).json({
        error: true,
        message: error.response.data?.error?.message || error.response.data?.message || '서버 오류가 발생했습니다.',
        details: error.response.data
      });
    } else if (error.request) {
      // 요청은 보냈지만 응답을 받지 못한 경우
      res.status(500).json({
        error: true,
        message: '서버에 연결할 수 없습니다. 네트워크 연결을 확인해 주세요.'
      });
    } else {
      // 요청 설정 중 오류가 발생한 경우
      res.status(500).json({
        error: true,
        message: '요청 설정 중 오류가 발생했습니다.'
      });
    }
  }
};

// 송장출력 URI 생성 API
const shippingPrintUri = async (req, res) => {
  try {
    const response = await axios.put(
      'https://api.goodsflow.io/api/deliveries/shipping/print-uri',
      req.body,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': process.env.GOODSFLOW_API_KEY
        }
      }
    );
    res.status(200).json(response.data);
  } catch (error) {
    console.error('굿스플로 송장출력 URI 생성 오류:', error.response?.data || error.message);
    if (error.response) {
      res.status(error.response.status).json({
        error: true,
        message: error.response.data?.error?.message || error.response.data?.message || '서버 오류가 발생했습니다.',
        details: error.response.data
      });
    } else if (error.request) {
      res.status(500).json({
        error: true,
        message: '서버에 연결할 수 없습니다. 네트워크 연결을 확인해 주세요.'
      });
    } else {
      res.status(500).json({
        error: true,
        message: '요청 설정 중 오류가 발생했습니다.'
      });
    }
  }
};

const shippingDeliveriesResult = async (req, res) => {
  try {
    const { idCommaList } = req.params;
    const { idType = 'serviceId' } = req.query;
    const url = `https://api.goodsflow.io/api/deliveries/${encodeURIComponent(idCommaList)}`;
    const response = await axios.get(url, {
      headers: {
        'Authorization': process.env.GOODSFLOW_API_KEY
      },
      params: { idType }
    });
    res.status(200).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json({
        error: true,
        message: error.response.data?.error?.message || error.response.data?.message || '서버 오류가 발생했습니다.',
        details: error.response.data
      });
    } else if (error.request) {
      res.status(500).json({ error: true, message: '서버에 연결할 수 없습니다. 네트워크 연결을 확인해 주세요.' });
    } else {
      res.status(500).json({ error: true, message: '요청 설정 중 오류가 발생했습니다.' });
    }
  }
};

// 굿스플로 배송 주문 취소 (서비스ID 기반)
const cancelDeliveries = async (req, res) => {
  try {
    const response = await axios.delete(
      'https://api.goodsflow.io/api/deliveries/cancel',
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': process.env.GOODSFLOW_API_KEY
        },
        data: req.body
      }
    );
    res.status(200).json(response.data);
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json({
        error: true,
        message: error.response.data?.error?.message || error.response.data?.message || '서버 오류가 발생했습니다.',
        details: error.response.data
      });
    } else if (error.request) {
      res.status(500).json({ error: true, message: '서버에 연결할 수 없습니다. 네트워크 연결을 확인해 주세요.' });
    } else {
      res.status(500).json({ error: true, message: '요청 설정 중 오류가 발생했습니다.' });
    }
  }
};

module.exports = {
  shippingPrint,
  shippingPrintDeliveryItems,
  shippingPrintUri,
  shippingDeliveriesResult,
  cancelDeliveries,
  shippingReturnDeliveryItems,
};
