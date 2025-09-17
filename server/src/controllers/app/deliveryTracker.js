const axios = require('axios');

// Delivery Tracker GraphQL Proxy
// POST /app/delivery-tracker/graphql
// Body: { query: string, variables?: object }
const graphqlProxy = async (req, res) => {
  try {
    const baseUrl = process.env.DELIVERY_TRACKER_BASE_URL;
    const clientId = process.env.DELIVERY_TRACKER_CLIENT_ID;
    const clientSecret = process.env.DELIVERY_TRACKER_CLIENT_SECRET;

    if (!baseUrl || !clientId || !clientSecret) {
      return res.status(500).json({
        error: true,
        message: 'Delivery Tracker 환경변수가 설정되지 않았습니다.'
      });
    }

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await axios.post(
      baseUrl,
      req.body,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${basicAuth}`
        }
      }
    );

    res.status(200).json(response.data);
  } catch (error) {
    if (error.response) {
      return res.status(error.response.status).json({
        error: true,
        message: error.response.data.errors[0].message || error.response.data.message || '서버 오류가 발생했습니다.',
        details: error.response.data
      });
    }
    if (error.request) {
      return res.status(500).json({ error: true, message: 'Delivery Tracker 서버에 연결할 수 없습니다.' });
    }
    return res.status(500).json({ error: true, message: '요청 처리 중 오류가 발생했습니다.' });
  }
};

module.exports = {
  graphqlProxy
};


