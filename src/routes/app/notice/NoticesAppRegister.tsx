import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUserStore } from "../../../store/store";
import { openInputDatePicker } from "../../../utils/commonUtils";


const NoticesAppRegister: React.FC = () => {
  const user = useUserStore((state) => state.user);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    notices_type: "NOTICE",
    title: "",
    content: "",
    start_dt: "",
    end_dt: "",
    view_yn: "Y" as "Y" | "N",
  });


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

  const handleSubmit = async () => {
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/app/noticesApp/insertNoticesApp`,
        {
          notices_type: formData.notices_type,
          title: formData.title,
          content: formData.content,
          start_dt: formData.start_dt,
          end_dt: formData.end_dt,
          view_yn: formData.view_yn,
          userId: user.index.toString(),
        }
      );

      alert("공지 사항이 성공적으로 등록되었습니다.");
      navigate("/app/noticesAppList");
    } catch (error) {
      console.error("공지 사항 처리 오류:", error);
    } finally {
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">공지사항 등록</h2>
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
                        className="form-radio h-5 w-5 text-red-600 cursor-pointer"
                      />
                      <span className="ml-2 cursor-pointer">네</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="view_yn"
                        value="N"
                        checked={formData.view_yn === "N"}
                        onChange={handleInputChange}
                        className="form-radio h-5 w-5 text-blue-600 cursor-pointer"
                      />
                      <span className="ml-2 cursor-pointer">아니오</span>
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

        <div className="flex justify-end mt-6">
          <button
            type="button"
            onClick={handleSubmit}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            공지 등록
          </button>
        </div>
      </form>
    </div>
  );
};

export default NoticesAppRegister;
