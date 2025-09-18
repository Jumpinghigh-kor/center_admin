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
  const { brand_name, product_name, big_category, small_category, title, price, original_price, discount, give_point, sell_start_dt, sell_end_dt, courier_code, delivery_fee, remote_delivery_fee, free_shipping_amount, inquiry_phone_number, today_send_yn, today_send_time, not_today_send_day, view_yn } = req.body;

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
      , remote_delivery_fee
      , free_shipping_amount
      , inquiry_phone_number
      , today_send_yn
      , today_send_time
      , not_today_send_day
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

// 상품 상세 목록 조회
exports.selectProductAppDetail = (req, res) => {
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
    AND			    pa.del_yn = 'N'
  `;

  db.query(query, [product_app_id], (err, result) => {
    if (err) {
      res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

// 상품 목록 조회
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
    ORDER BY  rep.return_exchange_id DESC
  `;

  db.query(query, [product_app_id], (err, result) => {
    if (err) {
      res.status(500).json(err);
    }
    res.status(200).json({ result: result });
  });
};

// 상품 일괄 삭제
exports.deleteProductApp = async (req, res) => {
  try {
    const { productAppId, modId } = req.body;

    if (!productAppId || !modId) {
      return res.status(400).json({
        message: "필수 파라미터가 누락되었습니다. (productAppId, modId)",
      });
    }

    const mod_dt = dayjs().format("YYYYMMDDHHmmss");

    const updateProductSql = `
      UPDATE product_app SET
        del_yn = 'Y'
        , mod_dt = ?
        , mod_id = ?
      WHERE product_app_id = ?
    `;

    await new Promise((resolve, reject) => {
      db.query(
        updateProductSql,
        [mod_dt, modId, productAppId],
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
      WHERE product_app_id = ?
    `;

    await new Promise((resolve, reject) => {
      db.query(
        updateImagesSql,
        [mod_dt, modId, productAppId],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    res.status(200).json({
      message: "상품 삭제 성공",
      productAppId,
    });
  } catch (error) {
    console.error("상품 삭제 오류:", error);
    res.status(500).json({
      message: "상품 삭제 중 오류가 발생했습니다.",
      error: error.message,
    });
  }
};

// 상품 이미지 목록 조회
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

// 상품 등록
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
        // 파일 이름 생성 (product_원본파일명_timestamp.확장자)
        const originalFilename = path.parse(image.file_name);
        const fileExtension = originalFilename.ext;
        const newFilename = `product_${originalFilename.name}_${reg_dt}${timestamp}${fileExtension}`;

        // Supabase에 이미지 업로드
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("product")
          .upload(`product/${newFilename}`, image.file_data, {
            contentType: image.content_type || 'image/jpeg',
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
        , remote_delivery_fee
        , free_shipping_amount
        , inquiry_phone_number
        , today_send_yn
        , today_send_time
        , not_today_send_day
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
          productApp.sell_start_dt ? productApp.sell_start_dt.replace(/[-:]/g, '').replace(/T/g, '').replace(/\s/g, '') + '01' : null,
          productApp.sell_end_dt ? productApp.sell_end_dt.replace(/[-:]/g, '').replace(/T/g, '').replace(/\s/g, '') + '01' : null,
          productApp.courier_code,
          productApp.delivery_fee,
          productApp.remote_delivery_fee,
          productApp.free_shipping_amount,
          productApp.inquiry_phone_number,
          productApp.today_send_yn,
          productApp.today_send_time ? productApp.today_send_time.replace(':', '') : null,
          productApp.not_today_send_day === 0 ? null : productApp.not_today_send_day,
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

