import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useUserStore } from "../../../store/store";
import { openInputDatePicker } from "../../../utils/commonUtils";

interface NoticesShoppingApp {
  notices_shopping_app_id: number;
  notices_type: string;
  title: string;
  content: string;
  start_dt: string;
  end_dt: string;
  view_yn: "Y" | "N";
  del_yn: "Y" | "N";
  reg_dt: string;
  mod_dt: string;
}

const NoticesShoppingAppDetail: React.FC = () => {
  const user = useUserStore((state) => state.user);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [noticesShoppingAppData, setNoticesShoppingAppData] = useState<NoticesShoppingApp | null>(null);
  const [formData, setFormData] = useState({
    notices_type: "NOTICE",
    title: "",
    content: "",
    start_dt: "",
    end_dt: "",
    view_yn: "Y" as "Y" | "N",
  });

  const noticesShoppingAppId = searchParams.get('noticesShoppingAppId');

  // 공지사항 상세 조회
  const getNoticesShoppingAppDetail = async () => {
    if (!noticesShoppingAppId) return;
    
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/noticesShoppingApp/selectNoticesShoppingAppDetail`,
        {
          notices_shopping_app_id: noticesShoppingAppId
        }
      );
      
      if (response.data.result && response.data.result.length > 0) {
        const data = response.data.result[0];
        setNoticesShoppingAppData(data);
        setFormData({
          notices_type: data.notices_type,
          title: data.title,
          content: data.content,
          start_dt: data.start_dt,
          end_dt: data.end_dt,
          view_yn: data.view_yn,
        });
      }
    } catch (error) {
      console.error("공지사항 상세 조회 오류:", error);
    }
  };

  useEffect(() => {
    getNoticesShoppingAppDetail();
  }, [noticesShoppingAppId]);

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
    if (!noticesShoppingAppData) return;
    
    if(window.confirm("정말로 수정하시겠습니까?")) {
    
    if (formData.start_dt > formData.end_dt) {
      alert("종료일은 시작일보다 늦어야 합니다.");
      return;
    }
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/app/noticesShoppingApp/updateNoticesShoppingApp`,
        {
          noticesShoppingAppId: noticesShoppingAppData?.notices_shopping_app_id,
          notices_type: formData.notices_type,
          title: formData.title,
          content: formData.content,
          start_dt: formData.start_dt,
          end_dt: formData.end_dt,
          view_yn: formData.view_yn,
          userId: user.index,
        }
      );

      navigate("/app/noticesShoppingAppList");
    } catch (error) {
        console.error("공지사항 수정 오류:", error);
        alert("공지사항 수정 중 오류가 발생했습니다.");
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm("정말로 삭제하시겠습니까?")) {
      try {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/app/noticesShoppingApp/batchDeleteNoticesShoppingApp`,
          {
            notices_shopping_app_ids: [noticesShoppingAppData?.notices_shopping_app_id],
            userId: user.index,
          }
        );

        navigate("/app/noticesShoppingAppList");
      } catch (err) {
        console.error("공지사항 삭제 오류:", err);
        alert("공지사항 삭제 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">공지사항 상세</h2>
      </div>

      <form className="space-y-6">
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 font-semibold w-1/6">
                  공지 유형
                </td>
                <td className="px-4 py-3">
                  <select
                    name="notices_type"
                    value={formData.notices_type}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"                     
                  >
                    <option value="NOTICE">공지</option>
                    <option value="EVENT">이벤트</option>
                    <option value="GUIDE">가이드</option>
                  </select>
                </td>
                <td className="bg-gray-100 px-4 py-3 font-semibold w-1/6">
                  노출 여부
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center space-x-6">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="view_yn"
                        value="Y"
                        checked={formData.view_yn === "Y"}
                        onChange={handleInputChange}
                        className="form-radio h-5 w-5 text-red-600"
                      />
                      <span className="ml-2">네</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="view_yn"
                        value="N"
                        checked={formData.view_yn === "N"}
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
                     onChange={(e) => {
                       handleInputChange(e);
                       requestAnimationFrame(() => {
                         try { e.currentTarget.blur(); } catch {}
                       });
                     }}
                     onInput={(e) => {
                       const input = e.currentTarget;
                       requestAnimationFrame(() => {
                         try { input.blur(); } catch {}
                       });
                     }}
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
                     onChange={(e) => {
                       handleInputChange(e);
                       requestAnimationFrame(() => {
                         try { e.currentTarget.blur(); } catch {}
                       });
                     }}
                     onInput={(e) => {
                       const input = e.currentTarget;
                       requestAnimationFrame(() => {
                         try { input.blur(); } catch {}
                       });
                     }}
                     onClick={(e) => openInputDatePicker(e.currentTarget)}
                     onFocus={(e) => openInputDatePicker(e.currentTarget)}
                     className="w-full p-2 border cursor-pointer border-gray-300 rounded"
                   />
                 </td>
               </tr>


              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 font-semibold w-1/6">
                  공지 제목
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="공지 제목을 입력하세요"
                  />
                </td>
              </tr>

              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 font-semibold w-1/6">
                  공지 내용
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
    </div>
  );
};

export default NoticesShoppingAppDetail;
