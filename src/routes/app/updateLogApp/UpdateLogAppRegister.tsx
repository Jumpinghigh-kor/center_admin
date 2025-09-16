import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useUserStore } from "../../../store/store";

interface UpdateLogApp {
  upAppVersion: string;
  upAppDesc: string;
}

const UpdateLogAppRegister: React.FC = () => {
  const user = useUserStore((state) => state.user);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const upAppId = searchParams.get('upAppId');
  const [formData, setFormData] = useState<UpdateLogApp>({
    upAppVersion: "",
    upAppDesc: "",
  });
  
  // 업데이트 로그 버전 체크
  const getUpdateLogAppVersionCheck = async (version: string) => {    
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/updateLogApp/selectUpdateLogAppVersionCheck`,
        {
          up_app_version: version
        }
      );
      
      const count = response.data.result;
      return count;
    } catch (err) {
      console.error("업데이트 로그 목록 로딩 오류:", err);
      return 0;
    }
  };

  const insertUpdateLogApp = async () => {
    // 버전이 변경된 경우에만 유효성 체크
    if (formData.upAppVersion !== "") {
      const versionCount = await getUpdateLogAppVersionCheck(formData.upAppVersion);
      
      if (versionCount > 0) {
        alert("이미 존재하는 버전입니다.");
        return;
      }
    }
    
    if(window.confirm("정말로 등록하시겠습니까?")) {

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/app/updateLogApp/insertUpdateLogApp`,
        {
          upAppVersion: formData.upAppVersion,
          upAppDesc: formData.upAppDesc,
          userId: user.index,
        }
      );

      navigate("/app/updateLogApp");
    } catch (error) {
        console.error("업데이트 로그 등록 오류:", error);
        alert("업데이트 로그 등록 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">업데이트 로그 등록</h2>
      </div>

      <form className="space-y-6">
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 font-semibold w-1/6">
                  버전
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    name="upAppVersion"
                    value={formData.upAppVersion}
                    onChange={(e) => setFormData({ ...formData, upAppVersion: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="버전을 입력하세요"
                  />
                </td>
                <td></td>
              </tr>

              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 font-semibold w-1/6">
                  내용
                </td>
                <td className="px-4 py-3 w-1/3">
                  <textarea
                    name="upAppDesc"
                    value={formData.upAppDesc}
                    onChange={(e) => setFormData({ ...formData, upAppDesc: e.target.value })}
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
            onClick={insertUpdateLogApp}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            등록
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateLogAppRegister;
