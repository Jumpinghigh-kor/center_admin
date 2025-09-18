import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useUserStore } from "../../../store/store";
import { openInputDatePicker } from "../../../utils/commonUtils";

interface CouponApp {
  coupon_app_id: number;
  coupon_type: string;
  title: string;
  content: string;
  start_dt: string;
  end_dt: string;
  coupon_notice: "Y" | "N";
  del_yn: "Y" | "N";
  reg_dt: string;
  mod_dt: string;
}

interface CouponMember {
  member_coupon_app_id: number;
  mem_id: string;
  mem_name: string;
  coupon_app_id: number;
  use_yn: string;
  use_dt: string;
  reg_dt: string;
}

const CouponAppDetail: React.FC = () => {
  const user = useUserStore((state) => state.user);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [couponData, setCouponData] = useState<CouponApp | null>(null);
  const [memberCouponList, setMemberCouponList] = useState<CouponMember[]>([]);
  const [formData, setFormData] = useState({
    coupon_type: "NOTICE",
    title: "",
    content: "",
    start_dt: "",
    end_dt: "",
    coupon_notice: "Y" as "Y" | "N",
  });

  const couponAppId = searchParams.get('couponAppId');

  // 쿠폰 상세 조회
  const getCouponAppDetail = async () => {
    if (!couponAppId) return;
    
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/couponApp/selectCouponAppDetail`,
        {
          coupon_app_id: couponAppId
        }
      );
      
      if (response.data.result && response.data.result.length > 0) {
        const data = response.data.result[0];
        setCouponData(data);
        setFormData({
          coupon_type: data.coupon_type,
          title: data.title,
          content: data.content,
          start_dt: data.start_dt,
          end_dt: data.end_dt,
          coupon_notice: data.coupon_notice,
        });
      }
    } catch (error) {
      console.error("쿠폰 상세 조회 오류:", error);
    }
  };

  // 쿠폰 회원 목록 조회
  const selectMembercouponAppList = async (coupon_app_id: string | null) => {
    if (!coupon_app_id) return;
    
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/couponApp/selectMemberCouponAppList`,
        {
          coupon_app_id
        }
      );

      setMemberCouponList(response.data.result);
    } catch (err) {
      alert("쿠폰 목록을 불러오는 도중 오류가 발생했습니다.");
    } finally {
    }
  };

  useEffect(() => {
    getCouponAppDetail();
    selectMembercouponAppList(couponAppId || "");
  }, [couponAppId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'start_dt' || name === 'end_dt') {
      const formattedValue = value ? `${value.replace(/[-:T]/g, '').slice(0, 14)}00` : '';
      setFormData(prev => {
        const newData = {
          ...prev,
          [name]: formattedValue
        };
        
        // Validate date range
        if (newData.start_dt && newData.end_dt) {
          if (newData.start_dt > newData.end_dt) {
            alert("종료일은 시작일보다 늦어야 합니다.");
            // Clear end date if it's earlier than start date
            if (name === 'end_dt') {
              newData.end_dt = '';
            }
          }
        }
        
        return newData;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleUpdate = async () => {
    if (!couponData) return;
    
    if(window.confirm("정말로 수정하시겠습니까?")) {
    
    if (formData.start_dt > formData.end_dt) {
      alert("종료일은 시작일보다 늦어야 합니다.");
      return;
    }
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/app/couponApp/updateCouponApp`,
        {
          couponAppId: couponData.coupon_app_id,
          coupon_type: formData.coupon_type,
          title: formData.title,
          content: formData.content,
          start_dt: formData.start_dt,
          end_dt: formData.end_dt,
          coupon_notice: formData.coupon_notice,
          userId: user.index,
        }
      );

      navigate("/app/couponAppList");
    } catch (error) {
        console.error("쿠폰 수정 오류:", error);
        alert("쿠폰 수정 중 오류가 발생했습니다.");
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm("정말로 삭제하시겠습니까?")) {
      try {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/app/couponApp/batchDeleteCouponApp`,
          {
            coupon_app_ids: [couponData?.coupon_app_id],
            userId: user.index,
          }
        );

        navigate("/app/couponAppList");
      } catch (err) {
        console.error("쿠폰 삭제 오류:", err);
        alert("쿠폰 삭제 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">쿠폰 상세</h2>
      </div>

      <form className="space-y-6">
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 font-semibold w-1/6">
                  쿠폰 유형
                </td>
                <td className="px-4 py-3">
                  <select
                    name="coupon_type"
                    value={formData.coupon_type}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"                     
                  >
                    <option value="NOTICE">쿠폰</option>
                    <option value="EVENT">이벤트</option>
                    <option value="GUIDE">가이드</option>
                  </select>
                </td>
                <td className="bg-gray-100 px-4 py-3 font-semibold w-1/6">
                  쿠폰 노출 여부
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-6">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="coupon_notice"
                        value="Y"
                        checked={formData.coupon_notice === "Y"}
                        onChange={handleInputChange}
                        className="form-radio h-5 w-5 text-red-600"
                      />
                      <span className="ml-2">네</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="coupon_notice"
                        value="N"
                        checked={formData.coupon_notice === "N"}
                        onChange={handleInputChange}
                        className="form-radio h-5 w-5 text-blue-600"
                      />
                      <span className="ml-2">아니오</span>
                    </label>
                  </div>
                </td>
              </tr>

               <tr className="border-b border-gray-200">
                 <td className="bg-gray-100 px-4 py-3 font-semibold w-1/6">
                   시작일
                 </td>
                 <td className="px-4 py-3" onClick={(e) => {
                   const target = e.target as HTMLElement;
                   if (target && target.tagName.toLowerCase() === 'input') return;
                   const input = e.currentTarget.querySelector('input[type="datetime-local"]') as HTMLInputElement | null;
                   if (input) openInputDatePicker(input);
                 }}>
                   <input
                     type="datetime-local"
                     name="start_dt"
                     value={formData.start_dt ? `${formData.start_dt.slice(0, 4)}-${formData.start_dt.slice(4, 6)}-${formData.start_dt.slice(6, 8)}T${formData.start_dt.slice(8, 10)}:${formData.start_dt.slice(10, 12)}` : ''}
                     onChange={handleInputChange}
                     onClick={(e) => openInputDatePicker(e.currentTarget)}
                     onFocus={(e) => openInputDatePicker(e.currentTarget)}
                     className="w-full p-2 border cursor-pointer border-gray-300 rounded"
                   />
                 </td>
                 <td className="bg-gray-100 px-4 py-3 font-semibold w-1/6">
                   종료일
                 </td>
                 <td className="px-4 py-3" onClick={(e) => {
                   const target = e.target as HTMLElement;
                   if (target && target.tagName.toLowerCase() === 'input') return;
                   const input = e.currentTarget.querySelector('input[type="datetime-local"]') as HTMLInputElement | null;
                   if (input) openInputDatePicker(input);
                 }}>
                   <input
                     type="datetime-local"
                     name="end_dt"
                     value={formData.end_dt ? `${formData.end_dt.slice(0, 4)}-${formData.end_dt.slice(4, 6)}-${formData.end_dt.slice(6, 8)}T${formData.end_dt.slice(8, 10)}:${formData.end_dt.slice(10, 12)}` : ''}
                     onChange={handleInputChange}
                     onClick={(e) => openInputDatePicker(e.currentTarget)}
                     onFocus={(e) => openInputDatePicker(e.currentTarget)}
                     className="w-full p-2 border cursor-pointer border-gray-300 rounded"
                   />
                 </td>
               </tr>


              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 font-semibold w-1/6">
                  쿠폰 제목
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="쿠폰 제목을 입력하세요"
                  />
                </td>
              </tr>

              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 font-semibold w-1/6">
                  쿠폰 내용
                </td>
                <td className="px-4 py-3 w-1/3">
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    className="w-full min-h-[150px] p-2 border border-gray-300 rounded"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={handleUpdate}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            수정
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            삭제
          </button>
        </div>
      </form>
      
      <div className="mt-12">
        {memberCouponList.length === 0 ? (
          <div className="text-center py-8 text-gray-500">소유 회원이 없습니다.</div>
        ) : (
          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="w-full h-16 border-b border-gray-200 bg-gray-200">
                  <th className="text-center pl-4 whitespace-nowrap">번호</th>
                  <th className="text-center max-w-[100px] md:max-w-[200px] whitespace-nowrap">회원 ID</th>
                  <th className="text-center max-w-[100px] md:max-w-[200px] whitespace-nowrap">회원 이름</th>
                  <th className="text-center max-w-[100px] md:max-w-[200px] whitespace-nowrap">사용 여부</th>
                  <th className="text-center max-w-[100px] md:max-w-[200px] whitespace-nowrap">쿠폰 사용일</th>
                  <th className="text-center max-w-[100px] md:max-w-[200px] whitespace-nowrap">등록일</th>
                </tr>
              </thead>
              <tbody>
                {memberCouponList.map((ele, index) => (
                  <tr key={ele.member_coupon_app_id} className="h-16 border-b border-gray-200 hover:bg-gray-50">
                    <td className="pl-4 text-center">{memberCouponList.length - index}</td>
                    <td className="text-center px-2">{ele.mem_id}</td>
                    <td className="text-center px-2">{ele.mem_name}</td>
                    <td className="text-center px-2">{ele.use_yn === 'Y' ? '사용' : '미사용'}</td>
                    <td className="text-center px-2">{ele.use_dt ? ele.use_dt : '-'}</td>
                    <td className="text-center px-2">{ele.reg_dt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CouponAppDetail;
