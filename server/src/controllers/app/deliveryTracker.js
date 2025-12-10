const axios = require('axios');
const dayjs = require('dayjs');
const db = require('../../../db');

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

// Generic sync for shipping status transitions (CJ fixed)
const syncGeneric = async ({ selectQuery, extractTrackingNumberFromRow, statusToUpdate }) => {
  try {
    const restBase = process.env.DELIVERY_TRACKER_REST_BASE || 'https://apis.tracker.delivery';
    const rows = await new Promise((resolve) => {
      db.query(selectQuery, (err, result) => resolve(err ? [] : (result || [])));
    });

    const pairs = new Map();
    for (const r of rows) {
      const tn = String(extractTrackingNumberFromRow(r) || '').trim();
      if (!tn) continue;
      const key = `kr.cjlogistics::${tn}`;
      if (!pairs.has(key)) pairs.set(key, { carrierId: 'kr.cjlogistics', trackingNumber: tn });
    }
    if (pairs.size === 0) return;

    const checks = await Promise.allSettled(
      Array.from(pairs.values()).map(({ carrierId, trackingNumber }) =>
        axios
          .get(`${restBase}/carriers/${carrierId}/tracks/${encodeURIComponent(trackingNumber)}`, { timeout: 15000 })
          .then((res) => {
            const track = res && res.data ? res.data : {};
            const progresses = track && Array.isArray(track.progresses) ? track.progresses : [];
            const stateId = String(((track && track.state && track.state.id) || '')).toLowerCase();
            const delivered =
              stateId === 'delivered' ||
              progresses.some((p) => String(((p && p.status && p.status.id) || '')).toLowerCase() === 'delivered');
            return { carrierId, trackingNumber, delivered };
          })
      )
    );

    const deliveredPairs = new Set(
      checks
        .map((r) => (r.status === 'fulfilled' ? r.value : null))
        .filter((v) => v && v.delivered)
        .map((v) => `${v.carrierId}::${v.trackingNumber}`)
    );
    if (deliveredPairs.size === 0) return;

    const idsToUpdate = [];
    for (const r of rows) {
      const tn = String(extractTrackingNumberFromRow(r) || '').trim();
      if (!tn) continue;
      const key = `kr.cjlogistics::${tn}`;
      if (deliveredPairs.has(key)) idsToUpdate.push(r.order_detail_app_id);
    }
    if (idsToUpdate.length === 0) return;

    const now = dayjs().format('YYYYMMDDHHmmss');
    await new Promise((resolve) => {
      const updateQuery = statusToUpdate === 'SHIPPING_COMPLETE'
        ? `
        UPDATE member_order_detail_app SET
          order_status = ?
          , shipping_complete_dt = ?
          , mod_dt = ?
          , mod_id = ?
        WHERE order_detail_app_id IN (?)
      `
        : `
        UPDATE member_order_detail_app SET
          order_status = ?
          , mod_dt = ?
          , mod_id = ?
        WHERE order_detail_app_id IN (?)
      `;
      const params = statusToUpdate === 'SHIPPING_COMPLETE'
        ? [statusToUpdate, now, now, 1, idsToUpdate]
        : [statusToUpdate, now, 1, idsToUpdate];
      db.query(updateQuery, params, () => resolve());
    });

    // Send notifications only for delivered rows
    for (const r of rows) {
      const tn = String(extractTrackingNumberFromRow(r) || '').trim();
      if (!tn) continue;
      const key = `kr.cjlogistics::${tn}`;
      if (!deliveredPairs.has(key)) continue;

      const memId = Number(r && r.mem_id);
      const memName = String(((r && r.mem_name) || '')).trim();
      const productName = String(((r && r.product_name) || '')).trim();
      const title = `${memName}님께서 주문하신 ${productName} 상품이 배송 완료 되었습니다.`;
      const content = '고객님의 소중한 상품이 배송 완료되었습니다. 저희 서비스를 이용해 주셔서 감사드리며, 앞으로도 더 나은 서비스를 위해 노력하겠습니다.';

      const postAppId = await new Promise((resolve) => {
        const insertPost = `
          INSERT INTO post_app (
            post_type
            , title
            , content
            , all_send_yn
            , push_send_yn
            , del_yn
            , reg_dt
            , reg_id
            , mod_dt
            , mod_id
          ) VALUES (
            'SHOPPING'
            , ?
            , ?
            , 'N'
            , 'Y'
            , 'N'
            , ?
            , ?
            , NULL
            , NULL
          )
        `;
        db.query(insertPost, [title, content, now, memId], (err, result) => resolve(err ? null : (result && result.insertId)));
      });
      if (!postAppId) continue;

      await new Promise((resolve) => {
        const insertMemberPostSelect = `
          INSERT INTO member_post_app (
            post_app_id
            , mem_id
            , read_yn
            , read_dt
            , del_yn
            , reg_dt
            , reg_id
            , mod_dt
            , mod_id
          )
          SELECT
            ?
            , ?
            , 'N'
            , NULL
            , 'N'
            , ?
            , ?
            , NULL
            , NULL
        `;
        db.query(insertMemberPostSelect, [postAppId, memId, now, 1], (err) => {
          if (err) console.error('[member_post_app insert error]', err);
          resolve();
        });
      });
    }
  } catch (e) {
    console.warn('[syncGeneric] error:', e.message);
  }
};

module.exports = {
  graphqlProxy,
  
  async syncShippingingStatus() {
    const selectQuery = `
      SELECT
        moda.tracking_number
        , moda.order_detail_app_id
        , pa.product_name
        , m.mem_name
        , m.mem_id
      FROM      members m
      LEFT JOIN member_order_app moa          ON m.mem_id = moa.mem_id
      LEFT JOIN member_order_detail_app moda  ON moa.order_app_id = moda.order_app_id
      LEFT JOIN product_detail_app pda        ON moda.product_detail_app_id = pda.product_detail_app_id
      LEFT JOIN product_app pa                ON pda.product_app_id = pa.product_app_id
      WHERE     moda.order_status = 'SHIPPINGING'
      AND       pa.consignment_yn = 'N'
      AND       moa.del_yn = 'N'
    `;
    await syncGeneric({
      selectQuery,
      extractTrackingNumberFromRow: (r) => (r && r.tracking_number),
      statusToUpdate: 'SHIPPING_COMPLETE',
    }).catch((e) => console.warn('[shippinging] sync error:', e.message));
  },
  
  async syncExchangeShippingingStatus() {
    const selectQuery = `
      SELECT
        mra.company_tracking_number
        , moda.order_detail_app_id
        , pa.product_name
        , m.mem_name
        , m.mem_id
      FROM      members m
      LEFT JOIN member_order_app moa          ON m.mem_id = moa.mem_id
      LEFT JOIN member_order_detail_app moda  ON moa.order_app_id = moda.order_app_id
      LEFT JOIN product_detail_app pda        ON moda.product_detail_app_id = pda.product_detail_app_id
      LEFT JOIN product_app pa                ON pda.product_app_id = pa.product_app_id
      LEFT JOIN member_return_app mra         ON moda.order_detail_app_id = mra.order_detail_app_id
      WHERE     moda.order_status = 'EXCHANGE_SHIPPINGING'
      AND       mra.del_yn = 'N'
      AND       moa.del_yn = 'N'
    `;
    await syncGeneric({
      selectQuery,
      extractTrackingNumberFromRow: (r) => (r && r.company_tracking_number),
      statusToUpdate: 'EXCHANGE_SHIPPING_COMPLETE',
    }).catch((e) => console.warn('[exchange_shippinging] sync error:', e.message));
  }
};


