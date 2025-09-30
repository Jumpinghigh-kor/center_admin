const db = require("../../../db");
const dayjs = require("dayjs");
const { createClient } = require("@supabase/supabase-js");
const path = require("path");

// Supabase 설정
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
// Supabase 클라이언트 생성
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 상품 목록 조회
exports.selectProductAppList = (req, res) => {
  const { brand_name, product_name, big_category
    , small_category, min_price, max_price
    , min_discount, max_discount, min_point
    , max_point, consignment_yn, view_yn } = req.body;

  let addCondition = '';
  let params = [];

  if(brand_name) {
    addCondition += ` AND brand_name LIKE CONCAT('%', ?, '%')`;
    params.push(brand_name);
  }

  if(product_name) {
    addCondition += ` AND product_name LIKE CONCAT('%', ?, '%')`;
    params.push(product_name);
  }

  if(big_category) {
    addCondition += ` AND big_category = ?`;
    params.push(big_category);
  }

  if(small_category) {
    addCondition += ` AND small_category = ?`;
    params.push(small_category);
  }

  if(consignment_yn) {
    addCondition += ` AND consignment_yn = ?`;
    params.push(consignment_yn);
  }

  if(view_yn) {
    addCondition += ` AND view_yn = ?`;
    params.push(view_yn);
  }

  if(min_price && max_price) {
    addCondition += ` AND price BETWEEN ? AND ?`;
    params.push(min_price, max_price);
  }

  if(min_price) {
    addCondition += ` AND price >= ?`;
    params.push(min_price);
  }
  
  if(max_price) {
    addCondition += ` AND price <= ?`;
    params.push(max_price);
  }

  if(min_point && max_point) {
    addCondition += ` AND give_point BETWEEN ? AND ?`;
    params.push(min_point, max_point);
  }

  if(min_point) {
    addCondition += ` AND give_point >= ?`;
    params.push(min_point);
  }

  if(max_point) {
    addCondition += ` AND give_point <= ?`;
    params.push(max_point);
  }
  
  if(min_discount && max_discount) {
    addCondition += ` AND discount BETWEEN ? AND ?`;
    params.push(min_discount, max_discount);
  }
  
  if(min_discount) {
    addCondition += ` AND discount >= ?`;
    params.push(min_discount);
  }

  if(max_discount) {
    addCondition += ` AND discount <= ?`;
    params.push(max_discount);
  }

  const query = `
    SELECT
      product_app_id
      , brand_name
      , product_name
      , big_category
      , small_category
      , title
      , price
      , original_price
      , discount
      , give_point
      , sell_start_dt
      , sell_end_dt
      , courier_code
      , delivery_fee
      , return_delivery_fee
      , remote_delivery_fee
      , free_shipping_amount
      , inquiry_phone_number
      , today_send_yn
      , today_send_time
      , not_today_send_day
      , consignment_yn
      , view_yn
      , DATE_FORMAT(reg_dt, '%Y-%m-%d %H:%i:%s') as reg_dt
      , reg_id
    FROM      product_app
    WHERE     del_yn = 'N'
    ${addCondition}
    ORDER BY  product_app_id DESC
  `;

  db.query(query, params, (err, result) => {
    if (err) {
      res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

// 상품 상세 조회
exports.selectProductAppDetail = (req, res) => {
  const { product_app_id } = req.body;

  const query = `
    SELECT
      product_app_id
      , brand_name
      , product_name
      , big_category
      , small_category
      , title
      , price
      , original_price
      , discount
      , give_point
      , DATE_FORMAT(sell_start_dt, '%Y-%m-%d %H:%i:%s') as sell_start_dt
      , DATE_FORMAT(sell_end_dt, '%Y-%m-%d %H:%i:%s') as sell_end_dt
      , courier_code
      , delivery_fee
      , return_delivery_fee
      , remote_delivery_fee
      , free_shipping_amount
      , inquiry_phone_number
      , today_send_yn
      , CONCAT(
                SUBSTRING(today_send_time, 1, 2), ':',
                SUBSTRING(today_send_time, 3, 2)
              ) AS today_send_time
      , not_today_send_day
      , consignment_yn
      , view_yn
      , DATE_FORMAT(reg_dt, '%Y-%m-%d %H:%i:%s') as reg_dt
      , reg_id
    FROM      product_app
    WHERE     del_yn = 'N'
    AND       product_app_id = ?
  `;

  db.query(query, [product_app_id], (err, result) => {
    if (err) {
      res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

// 상품 상세 조회
exports.selectProductOptionAppDetail = (req, res) => {
  const { product_app_id } = req.body;
  
  const query = `
    SELECT
      pda.product_detail_app_id
      , pda.option_type
      , pda.option_amount
      , pda.option_unit
      , pda.option_gender
      , pda.quantity
      , pda.use_yn
      , pda.del_yn
    FROM		    product_app pa
    LEFT JOIN   product_detail_app pda ON pa.product_app_id = pda.product_app_id
    WHERE	    	pa.product_app_id = ?
    AND			    pda.del_yn = 'N'
  `;

  db.query(query, [product_app_id], (err, result) => {
    if (err) {
      res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

// 상품 이미지 조회
exports.selectProductAppImgList = async (req, res) => {
  try {
    const { product_app_id } = req.body;
    
    const query = `
      SELECT
        cf.file_id
        , cf.file_path
        , cf.file_name
        , cf.file_division
        , pai.product_app_img_id
        , pai.order_seq
        , pai.img_form
      FROM		  product_app pa
      LEFT JOIN	product_app_img pai ON pa.product_app_id = pai.product_app_id
      LEFT JOIN	common_file cf 		ON pai.file_id = cf.file_id
      WHERE		  pa.product_app_id = ?
      AND			  cf.del_yn = 'N'
      AND			  pai.del_yn = 'N'
    `;

    db.query(query, [product_app_id], (err, results) => {
      if (err) {
        console.error("상품 이미지 목록 조회 오류:", err);
        return res.status(500).json({
          error: "상품 이미지 목록을 조회하는 도중 오류가 발생했습니다.",
        });
      }
      
      const productAppImgList = results.map((productAppImg) => {
        // Supabase URL 구성
        let imageUrl = null;
        if (productAppImg.file_name) {
          imageUrl = supabase.storage
            .from("product")
            .getPublicUrl(`product/${productAppImg.file_name}`).data.publicUrl;
        }
        
        return {
          fileId: productAppImg.file_id,
          fileName: productAppImg.file_name,
          filePath: productAppImg.file_path,
          fileDivision: productAppImg.file_division,
          productAppImgId: productAppImg.product_app_img_id,
          imageUrl: imageUrl,
          imgForm: productAppImg.img_form,
          orderSeq: productAppImg.order_seq,
        };
      });
      
      res.status(200).json(productAppImgList);
    });
  } catch (error) {
    console.error("상품 이미지 목록 조회 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

// 상품 반품/교환 정책 조회
exports.returnExchangePolicy = (req, res) => {
  const { product_app_id } = req.body;

  const query = `
    SELECT
      rep.return_exchange_id
      , pa.product_app_id
      , rep.title
      , rep.content
      , rep.direction
      , rep.order_seq
      , rep.use_yn
    FROM      product_app pa
    LEFT JOIN return_exchange_policy rep ON pa.product_app_id = rep.product_app_id
    WHERE     pa.product_app_id = ?
    AND       rep.del_yn = 'N'
    ORDER BY  rep.return_exchange_id ASC
  `;

  db.query(query, [product_app_id], (err, result) => {
    if (err) {
      res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

// 상품 삭제
exports.deleteProductApp = async (req, res) => {
  try {
    const { product_app_id, user_id } = req.body;
    
    if (!product_app_id || !user_id) {
      return res.status(400).json({
        message: "필수 파라미터가 누락되었습니다. (product_app_id, user_id)",
      });
    }

    const mod_dt = dayjs().format("YYYYMMDDHHmmss");

    const updateProductSql = `
      UPDATE product_app SET
        del_yn = 'Y'
        , mod_dt = ?
        , mod_id = ?
      WHERE product_app_id IN (?)
    `;

    await new Promise((resolve, reject) => {
      db.query(
        updateProductSql,
        [mod_dt, user_id, product_app_id],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    const updateImagesSql = `
      UPDATE product_app_img SET
        del_yn = 'Y'
        , use_yn = 'N'
        , mod_dt = ?
        , mod_id = ?
      WHERE product_app_id IN (?)
    `;

    await new Promise((resolve, reject) => {
      db.query(
        updateImagesSql,
        [mod_dt, user_id, product_app_id],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    res.status(200).json({
      message: "상품 삭제 성공",
      product_app_id,
    });
  } catch (error) {
    console.error("상품 삭제 오류:", error);
    res.status(500).json({
      message: "상품 삭제 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
};

// 상품 등록/수정
exports.insertProductApp = async (req, res) => {
  try {
    const { productApp, productDetailApp, imageData, returnExchangeData } = req.body;

    if (!productApp || !productApp.mem_id) {
      return res.status(400).json({
        message: "필수 파라미터가 누락되었습니다. (productApp, mem_id)",
      });
    }

    // 현재 날짜 형식화
    const now = dayjs();
    const reg_dt = now.format("YYYYMMDDHHmmss");
    // 밀리초 추가 (현재 시간의 밀리초 부분)
    const timestamp = Date.now() % 1000;

    const insertedFiles = [];
    
    if (imageData && imageData.length > 0) {
      for (const image of imageData) {
        
        // 파일 이름 생성 (요청 내 각 이미지가 고유해지도록 form/순서/랜덤 포함)
        const originalFilename = path.parse(image.file_name);
        const fileExtension = originalFilename.ext;
        const rand = Math.random().toString(36).slice(2, 8);
        const formTag = image.img_form || "IMG";
        const orderTag = typeof image.order_seq !== "undefined" ? String(image.order_seq) : "0";
        const newFilename = `product_${originalFilename.name}_${formTag}_${orderTag}_${reg_dt}${timestamp}_${rand}${fileExtension}`;


        // Supabase에 이미지 업로드
        // 클라이언트에서 data URL(base64) 또는 순수 base64/Buffer로 올 수 있으므로 모두 처리
        let contentType = image.content_type;
        let fileBuffer;
        if (typeof image.file_data === 'string') {
          // data:image/...;base64,XXXX 형태면 prefix 제거
          const match = image.file_data.match(/^data:(.*?);base64,(.*)$/);
          const base64Payload = match ? match[2] : image.file_data;
          if (!contentType && match && match[1]) {
            contentType = match[1];
          }
          fileBuffer = Buffer.from(base64Payload, 'base64');
        } else {
          fileBuffer = image.file_data; // Buffer 또는 Uint8Array 가정
        }
        // contentType이 없으면 확장자로 추론
        if (!contentType) {
          const ext = (fileExtension || '').toLowerCase();
          contentType = ext === '.png' ? 'image/png' : 'image/jpeg';
        }

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("product")
          .upload(`product/${newFilename}`, fileBuffer, {
            contentType,
          });

        if (uploadError) {
          console.error("이미지 업로드 오류:", uploadError);
          return res.status(500).json({ 
            error: "이미지 업로드 중 오류가 발생했습니다." 
          });
        }

        // common_file 테이블에 파일 정보 등록
        const fileInsertQuery = `
          INSERT INTO common_file (
            file_name
            , file_path
            , file_division
            , del_yn
            , reg_dt
            , reg_id
            , mod_dt
            , mod_id
          ) VALUES (
            ?
            , ?
            , ?
            , ?
            , ?
            , ?
            , ?
            , ?
          )
        `;

        const fileResult = await new Promise((resolve, reject) => {
          db.query(
            fileInsertQuery,
            [
              newFilename,
              "/product",
              "product",
              "N",
              reg_dt,
              productApp.mem_id,
              null,
              null
            ],
            (err, result) => {
              if (err) reject(err);
              else resolve(result);
            }
          );
        });

        const fileId = fileResult.insertId;

        // Supabase 공개 URL 구성
        const imageUrl = supabase.storage
          .from("product")
          .getPublicUrl(`product/${newFilename}`).data.publicUrl;

        insertedFiles.push({
          fileId: fileId,
          fileName: newFilename,
          originalFileName: image.file_name,
          imgForm: image.img_form,
          orderSeq: image.order_seq,
          imageUrl: imageUrl
        });
      }
    }

    // product_app 테이블에 상품 정보 등록
    const productInsertQuery = `
      INSERT INTO product_app (
        brand_name
        , product_name
        , big_category
        , small_category
        , title
        , price
        , original_price
        , discount
        , give_point
        , sell_start_dt
        , sell_end_dt
        , courier_code
        , delivery_fee
        , return_delivery_fee
        , remote_delivery_fee
        , free_shipping_amount
        , inquiry_phone_number
        , today_send_yn
        , today_send_time
        , not_today_send_day
        , consignment_yn
        , view_yn
        , del_yn
        , reg_dt
        , reg_id
        , mod_dt
        , mod_id
      ) VALUES (
        ?
        , ?
        , ?
        , ?
        , ?
        , ?
        , ?
        , ?
        , ?
        , ?
        , ?
        , ?
        , ?
        , ?
        , ?
        , ?
        , ?
        , ?
        , ?
        , ?
        , ?
        , ?
        , ?
        , ?
        , ?
        , ?
        , ?
      )
    `;

    const productResult = await new Promise((resolve, reject) => {
      db.query(
        productInsertQuery,
        [
          productApp.brand_name,
          productApp.product_name,
          productApp.big_category,
          productApp.small_category,
          productApp.title,
          productApp.price,
          productApp.original_price,
          productApp.discount,
          productApp.give_point,
          productApp.sell_start_dt ? productApp.sell_start_dt.replace(/[-:]/g, '').replace(/T/g, '').replace(/\s/g, '') + '00' : null,
          productApp.sell_end_dt ? productApp.sell_dt_type === "unlimited" ? "29991230235959" : productApp.sell_end_dt.replace(/[-:]/g, '').replace(/T/g, '').replace(/\s/g, '') + '00' : null,
          productApp.courier_code,
          productApp.delivery_fee,
          productApp.return_delivery_fee,
          productApp.remote_delivery_fee,
          productApp.free_shipping_amount,
          productApp.inquiry_phone_number,
          productApp.today_send_yn,
          productApp.today_send_time ? productApp.today_send_time.replace(':', '') : null,
          productApp.not_today_send_day === 0 ? null : productApp.not_today_send_day,
          productApp.consignment_yn,
          "Y",
          "N",
          reg_dt,
          productApp.mem_id,
          null,
          null
        ],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    const product_app_id = productResult.insertId;

    // product_app_img 테이블에 이미지 정보 등록
    if (insertedFiles.length > 0) {
      for (const file of insertedFiles) {
        const imgInsertQuery = `
          INSERT INTO product_app_img (
            product_app_id
            , file_id
            , img_form
            , order_seq
            , use_yn
            , del_yn
            , reg_dt
            , reg_id
            , mod_dt
            , mod_id
          ) VALUES (
            ?
            , ?
            , ?
            , ?
            , ?
            , ?
            , ?
            , ?
            , ?
            , ?
          )
        `;

        await new Promise((resolve, reject) => {
          db.query(
            imgInsertQuery,
            [
              product_app_id,
              file.fileId,
              file.imgForm,
              file.orderSeq,
              "Y",
              "N",
              reg_dt,
              productApp.mem_id,
              null,
              null
            ],
            (err, result) => {
              if (err) reject(err);
              else resolve(result);
            }
          );
        });
      }
    }

    // product_detail_app 테이블에 상품 상세 정보 등록
    if (productDetailApp && productDetailApp.length > 0) {
      for (const detail of productDetailApp) {
        const detailInsertQuery = `
          INSERT INTO product_detail_app (
            product_app_id
            , option_type
            , option_amount
            , option_unit
            , option_gender
            , quantity
            , use_yn
            , del_yn
            , reg_dt
            , reg_id
            , mod_dt
            , mod_id
          ) VALUES (
            ?
            , ?
            , ?
            , ?
            , ?
            , ?
            , ?
            , ?
            , ?
            , ?
            , ?
            , ?
          )
        `;

        await new Promise((resolve, reject) => {
          db.query(
            detailInsertQuery,
            [
              product_app_id,
              detail.option_type,
              detail.option_amount,
              detail.option_unit,
              detail.option_gender,
              detail.quantity,
              detail.use_yn || "Y",
              detail.del_yn || "N",
              reg_dt,
              productApp.mem_id,
              null,
              null
            ],
            (err, result) => {
              if (err) reject(err);
              else resolve(result);
            }
          );
        });
      }
    }

    // return_exchange_policy 테이블에 반품/교환 정책 등록
    if (returnExchangeData && returnExchangeData.length > 0) {
      for (const policy of returnExchangeData) {
        const policyInsertQuery = `
          INSERT INTO return_exchange_policy (
            product_app_id
            , title
            , content
            , direction
            , order_seq
            , use_yn
            , del_yn
            , reg_dt
            , reg_id
            , mod_dt
            , mod_id
          ) VALUES (
            ?
            , ?
            , ?
            , ?
            , ?
            , ?
            , ?
            , ?
            , ?
            , ?
            , ?
          )
        `;

        await new Promise((resolve, reject) => {
          db.query(
            policyInsertQuery,
            [
              product_app_id,
              policy.title,
              policy.content,
              policy.direction,
              policy.order_seq,
              policy.use_yn || "Y",
              policy.del_yn || "N",
              reg_dt,
              productApp.mem_id,
              null,
              null
            ],
            (err, result) => {
              if (err) reject(err);
              else resolve(result);
            }
          );
        });
      }
    }

    res.status(201).json({
      message: "상품이 성공적으로 등록되었습니다.",
      product_app_id: product_app_id,
      insertedFiles: insertedFiles
    });

  } catch (error) {
    console.error("상품 등록 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

// 상품 정보 업데이트
exports.updateProductApp = async (req, res) => {
  try {
    const { product_app_id, productApp, user_id, imageData, productDetailApp } = req.body;

    if (!product_app_id || !productApp || !(user_id || productApp.mem_id)) {
      return res.status(400).json({
        message: "필수 파라미터가 누락되었습니다. (product_app_id, productApp, user_id/mem_id)",
      });
    }

    const mod_dt = dayjs().format("YYYYMMDDHHmmss");
    const mod_id = user_id || productApp.mem_id;

    // 날짜/시간 포맷 정규화 (insert와 동일 규칙)
    const normalizeDateTime = (dt) =>
      dt ? dt.replace(/[-:]/g, '').replace(/T/g, '').replace(/\s/g, '') : null;

    const normalized_sell_start_dt = normalizeDateTime(productApp.sell_start_dt);
    let normalized_sell_end_dt = productApp.sell_dt_type === "unlimited"
      ? "29991230235959"
      : normalizeDateTime(productApp.sell_end_dt) + '01';
      
    if(normalized_sell_end_dt.length >= 15) {
      normalized_sell_end_dt = normalized_sell_end_dt.substring(0, 14);
    }

    const normalized_today_send_time = productApp.today_send_time
      ? String(productApp.today_send_time).replace(':', '')
      : null;

    const normalized_not_today_send_day = Number(productApp.not_today_send_day) === 0
      ? null
      : productApp.not_today_send_day;

    const updateSql = `
      UPDATE product_app SET
        brand_name = ?
        , product_name = ?
        , big_category = ?
        , small_category = ?
        , title = ?
        , price = ?
        , original_price = ?
        , discount = ?
        , give_point = ?
        , sell_start_dt = ?
        , sell_end_dt = ?
        , courier_code = ?
        , delivery_fee = ?
        , return_delivery_fee = ?
        , remote_delivery_fee = ?
        , free_shipping_amount = ?
        , inquiry_phone_number = ?
        , today_send_yn = ?
        , today_send_time = ?
        , not_today_send_day = ?
        , consignment_yn = ?
        , view_yn = ?
        , mod_dt = ?
        , mod_id = ?
      WHERE product_app_id = ?
    `;

    const params = [
      productApp.brand_name,
      productApp.product_name,
      productApp.big_category,
      productApp.small_category,
      productApp.title,
      productApp.price,
      productApp.original_price,
      productApp.discount,
      productApp.give_point,
      normalized_sell_start_dt,
      normalized_sell_end_dt,
      productApp.courier_code,
      productApp.delivery_fee,
      productApp.return_delivery_fee,
      productApp.remote_delivery_fee,
      productApp.free_shipping_amount,
      productApp.inquiry_phone_number,
      productApp.today_send_yn,
      normalized_today_send_time,
      normalized_not_today_send_day,
      productApp.consignment_yn,
      productApp.view_yn,
      mod_dt,
      mod_id,
      product_app_id,
    ];

    await new Promise((resolve, reject) => {
      db.query(updateSql, params, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    // 이미지가 전달되면 요구사항대로 처리
    const insertedFiles = [];
    if (Array.isArray(imageData)) {
      const reg_dt = mod_dt;

      const uploadAndInsertImage = async (image, formTag) => {
        const originalFilename = path.parse(image.file_name);
        const fileExtension = originalFilename.ext;
        const rand = Math.random().toString(36).slice(2, 8);
        const orderTag = typeof image.order_seq !== "undefined" ? String(image.order_seq) : "0";
        const newFilename = `product_${originalFilename.name}_${formTag}_${orderTag}_${reg_dt}${Date.now() % 1000}_${rand}${fileExtension}`;

        let contentType = image.content_type;
        let fileBuffer;
        if (typeof image.file_data === 'string') {
          const match = image.file_data.match(/^data:(.*?);base64,(.*)$/);
          const base64Payload = match ? match[2] : image.file_data;
          if (!contentType && match && match[1]) contentType = match[1];
          fileBuffer = Buffer.from(base64Payload, 'base64');
        } else {
          fileBuffer = image.file_data;
        }
        if (!contentType) {
          const ext = (fileExtension || '').toLowerCase();
          contentType = ext === '.png' ? 'image/png' : 'image/jpeg';
        }

        const { error: uploadError } = await supabase.storage
          .from("product")
          .upload(`product/${newFilename}`, fileBuffer, { contentType });
        if (uploadError) {
          console.error("이미지 업로드 오류:", uploadError);
          throw new Error("이미지 업로드 중 오류가 발생했습니다.");
        }

        // common_file INSERT
        const fileInsertQuery = `
          INSERT INTO common_file (
            file_name
            , file_path
            , file_division
            , del_yn
            , reg_dt
            , reg_id
            , mod_dt
            , mod_id
          ) VALUES (
            ?
            , ?
            , ?
            , ?
            , ?
            , ?
            , ?
            , ?
          )
        `;
        const fileResult = await new Promise((resolve, reject) => {
          db.query(
            fileInsertQuery,
            [
              newFilename,
              "/product",
              "product",
              "N",
              reg_dt,
              mod_id,
              null,
              null,
            ],
            (err, result) => (err ? reject(err) : resolve(result))
          );
        });
        const fileId = fileResult.insertId;

        const imgInsertQuery = `
          INSERT INTO product_app_img (
            product_app_id
            , file_id
            , img_form
            , order_seq
            , use_yn
            , del_yn
            , reg_dt
            , reg_id
            , mod_dt
            , mod_id
          ) VALUES (
            ?
            , ?
            , ?
            , ?
            , ?
            , ?
            , ?
            , ?
            , ?
            , ?
          )
        `;
        await new Promise((resolve, reject) => {
          db.query(
            imgInsertQuery,
            [
              product_app_id,
              fileId,
              formTag,
              image.order_seq,
              "Y",
              "N",
              reg_dt,
              mod_id,
              null,
              null,
            ],
            (err, result) => (err ? reject(err) : resolve(result))
          );
        });

        const imageUrl = supabase.storage
          .from("product")
          .getPublicUrl(`product/${newFilename}`).data.publicUrl;
        insertedFiles.push({
          fileId,
          fileName: newFilename,
          originalFileName: image.file_name,
          imgForm: formTag,
          orderSeq: image.order_seq,
          imageUrl,
        });
      };

      const representers = imageData.filter((img) => img.img_form === 'REPRESENTER');
      const details = imageData.filter((img) => img.img_form === 'DETAIL');

      // 1) 대표 이미지: 기존만 있는 경우 -> order_seq만 일괄 업데이트
      //    새 이미지가 추가된 경우 -> 기존 order_seq 업데이트 + 새 이미지 INSERT
      const hasId = (val) => val !== undefined && val !== null;
      const getImgId = (img) => hasId(img.product_app_img_id) ? img.product_app_img_id : img.productAppImgId;
      const repExistingUpdates = representers.filter((img) => hasId(getImgId(img)));
      if (repExistingUpdates.length > 0) {
        // single UPDATE using CASE ... WHERE id IN (...)
        const updates = repExistingUpdates
          .map((u) => ({ id: Number(getImgId(u)), order: Number(u.order_seq) }))
          .filter((u) => Number.isFinite(u.id) && Number.isFinite(u.order));
        if (updates.length > 0) {
          const ids = updates.map((u) => u.id);
          const caseSql = updates
            .map((u) => `WHEN ${u.id} THEN ${u.order}`)
            .join(' ');
          const updateSql = `
            UPDATE product_app_img SET
              order_seq = CASE product_app_img_id ${caseSql} END,
              mod_dt = ?,
              mod_id = ?
            WHERE product_app_img_id IN (${ids.map(() => '?').join(',')})
          `;
          await new Promise((resolve, reject) => {
            db.query(updateSql, [mod_dt, mod_id, ...ids], (err, result) => (err ? reject(err) : resolve(result)));
          });
        }
      }

      const repNew = representers.filter((img) => !hasId(getImgId(img)));
      for (const img of repNew) {
        await uploadAndInsertImage(img, 'REPRESENTER');
      }

      // 2) 상세 이미지: 새로 추가된 것만 INSERT, 없으면 아무것도 안 함
      const detailNew = details.filter((img) => !hasId(getImgId(img)));
      for (const img of detailNew) {
        await uploadAndInsertImage(img, 'DETAIL');
      }
    }

    // 상품 상세 정보(옵션) INSERT/UPDATE 처리
    if (Array.isArray(productDetailApp) && productDetailApp.length > 0) {
      const reg_dt_for_detail = mod_dt;

      // UPDATE: product_detail_app_id가 있는 항목
      const detailUpdates = productDetailApp.filter((d) => d && d.product_detail_app_id);
      for (const d of detailUpdates) {
        const updateDetailSql = `
          UPDATE product_detail_app SET
            option_type = ?
            , option_amount = ?
            , option_unit = ?
            , option_gender = ?
            , quantity = ?
            , use_yn = ?
            , mod_dt = ?
            , mod_id = ?
          WHERE product_detail_app_id = ?
        `;
        const updateParams = [
          d.option_type || null,
          d.option_amount || null,
          d.option_unit || null,
          d.option_gender || null,
          d.quantity || null,
          d.use_yn || "Y",
          mod_dt,
          mod_id,
          d.product_detail_app_id,
        ];
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve, reject) => {
          db.query(updateDetailSql, updateParams, (err, result) => (err ? reject(err) : resolve(result)));
        });
      }

      // INSERT: product_detail_app_id가 없는 항목
      const detailInserts = productDetailApp.filter((d) => d && !d.product_detail_app_id);
      for (const d of detailInserts) {
        const insertDetailSql = `
          INSERT INTO product_detail_app (
            product_app_id
            , option_type
            , option_amount
            , option_unit
            , option_gender
            , quantity
            , use_yn
            , del_yn
            , reg_dt
            , reg_id
            , mod_dt
            , mod_id
          ) VALUES (
            ?
            , ?
            , ?
            , ?
            , ?
            , ?
            , ?
            , ?
            , ?
            , ?
            , ?
            , ?
          )
        `;
        const insertParams = [
          product_app_id,
          d.option_type || null,
          d.option_amount || null,
          d.option_unit || null,
          d.option_gender || null,
          d.quantity || null,
          d.use_yn || "Y",
          "N",
          reg_dt_for_detail,
          mod_id,
          null,
          null,
        ];
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve, reject) => {
          db.query(insertDetailSql, insertParams, (err, result) => (err ? reject(err) : resolve(result)));
        });
      }
    }

    // 반품/교환 정책 INSERT/UPDATE 처리
    const { returnExchangeData } = req.body;
    if (Array.isArray(returnExchangeData) && returnExchangeData.length > 0) {
      const reg_dt_for_policy = mod_dt;

      // UPDATE: return_exchange_id가 있는 항목
      const policyUpdates = returnExchangeData.filter((p) => p && p.return_exchange_id);
      for (const p of policyUpdates) {
        const updatePolicySql = `
          UPDATE return_exchange_policy SET
            title = ?
            , content = ?
            , direction = ?
            , order_seq = ?
            , use_yn = ?
            , mod_dt = ?
            , mod_id = ?
          WHERE return_exchange_id = ?
        `;
        const updateParams = [
          p.title || null,
          p.content || null,
          p.direction || null,
          p.order_seq || null,
          p.use_yn || "Y",
          mod_dt,
          mod_id,
          p.return_exchange_id,
        ];
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve, reject) => {
          db.query(updatePolicySql, updateParams, (err, result) => (err ? reject(err) : resolve(result)));
        });
      }

      // INSERT: return_exchange_id가 없는 항목
      const policyInserts = returnExchangeData.filter((p) => p && !p.return_exchange_id);
      for (const p of policyInserts) {
        const insertPolicySql = `
          INSERT INTO return_exchange_policy (
            product_app_id
            , title
            , content
            , direction
            , order_seq
            , use_yn
            , del_yn
            , reg_dt
            , reg_id
            , mod_dt
            , mod_id
          ) VALUES (
            ?
            , ?
            , ?
            , ?
            , ?
            , ?
            , ?
            , ?
            , ?
            , ?
            , ?
          )
        `;
        const insertParams = [
          product_app_id,
          p.title || null,
          p.content || null,
          p.direction || null,
          p.order_seq || null,
          p.use_yn || "Y",
          "N",
          reg_dt_for_policy,
          mod_id,
          null,
          null,
        ];
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve, reject) => {
          db.query(insertPolicySql, insertParams, (err, result) => (err ? reject(err) : resolve(result)));
        });
      }
    }

    res.status(200).json({
      message: "상품 기본 정보 업데이트 성공",
      product_app_id,
      insertedFiles,
    });
  } catch (error) {
    console.error("상품 기본 정보 업데이트 오류:", error);
    res.status(500).json({ message: "상품 업데이트 중 오류가 발생했습니다.", error: error.message });
  }
};

// 상품 이미지 삭제
exports.deleteProductImgApp = async (req, res) => {
  try {
    const { product_app_img_id, user_id } = req.body;

    // 현재 날짜 형식화
    const now = dayjs();
    const mod_dt = now.format("YYYYMMDDHHmmss");
    
    const deleteProductImgAppQuery = `
      UPDATE product_app_img SET
        del_yn = 'Y'
        , use_yn = 'N'
        , mod_dt = ?
        , mod_id = ?
      WHERE product_app_img_id = ?
    `;

    db.query(
      deleteProductImgAppQuery,
      [mod_dt, user_id, product_app_img_id],
      (err, result) => {
        if (err) {
          console.error("상품 이미지 삭제 오류:", err);
          return res
            .status(500)
            .json({ error: "상품 이미지 삭제 중 오류가 발생했습니다." });
        }

        res.status(200).json({
          message: "상품 이미지가 성공적으로 삭제되었습니다.",
        });
      }
    );
  } catch (error) {
    console.error("상품 이미지 삭제 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

// 상품 옵션 삭제
exports.deleteProductDetailApp = async (req, res) => {
  try {
    const { product_detail_app_id, user_id } = req.body;

    // 현재 날짜 형식화
    const now = dayjs();
    const mod_dt = now.format("YYYYMMDDHHmmss");
    
    const deleteProductDetailAppQuery = `
      UPDATE product_detail_app SET
        del_yn = 'Y'
        , use_yn = 'N'
        , mod_dt = ?
        , mod_id = ?
      WHERE product_detail_app_id = ?
    `;

    db.query(
      deleteProductDetailAppQuery,
      [mod_dt, user_id, product_detail_app_id],
      (err, result) => {
        if (err) {
          console.error("상품 옵션 삭제 오류:", err);
          return res
            .status(500)
            .json({ error: "상품 옵션 삭제 중 오류가 발생했습니다." });
        }

        res.status(200).json({
          message: "상품 옵션이 성공적으로 삭제되었습니다.",
        });
      }
    );
  } catch (error) {
    console.error("상품 옵션 삭제 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};

// 상품 반품/교환 정책 삭제
exports.deleteReturnExchangePolicy = async (req, res) => {
  try {
    const { return_exchange_id, user_id } = req.body;

    // 현재 날짜 형식화
    const now = dayjs();
    const mod_dt = now.format("YYYYMMDDHHmmss");
    
    const deleteReturnExchangePolicyQuery = `
      UPDATE return_exchange_policy SET
        del_yn = 'Y'
        , use_yn = 'N'
        , mod_dt = ?
        , mod_id = ?
      WHERE return_exchange_id = ?
    `;

    db.query(
      deleteReturnExchangePolicyQuery,
      [mod_dt, user_id, return_exchange_id],
      (err, result) => {
        if (err) {
          console.error("상품 반품/교환 정책 삭제 오류:", err);
          return res
            .status(500)
            .json({ error: "상품 반품/교환 정책 삭제 중 오류가 발생했습니다." });
        }

        res.status(200).json({
          message: "상품 반품/교환 정책이 성공적으로 삭제되었습니다.",
        });
      }
    );
  } catch (error) {
    console.error("상품 반품/교환 정책 삭제 중 오류 발생:", error);
    res.status(500).json({ error: "서버 오류가 발생했습니다." });
  }
};