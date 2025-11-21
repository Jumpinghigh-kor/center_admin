import React, { useState, useEffect } from "react";
import axios from "axios";
import { useUserStore } from "../../../store/store";

interface CommonCodeApp {
  common_code_app_id: number;
  common_code: string;
  common_code_name: string;
  common_code_memo: string;
  order_seq: number;
  use_yn: string;
  reg_dt: string;
  mod_dt: string;
  mod_id: number;
}

const CommonCodeList: React.FC = () => {
  const [commonCodeList, setCommonCodeList] = useState<CommonCodeApp[]>([]);
  const user = useUserStore((state) => state.user);

  const selectCommonCodeList = async (searchParams?: any) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/commonCode/selectCommonCodeList`,
        {
          ...searchParams,
        }
      );
      
      setCommonCodeList(response.data.result);
    } catch (err) {
      console.error("공통코드 목록 로딩 오류:", err);
    } finally {
    }
  };

  useEffect(() => {
    if (user && user.index) {
      selectCommonCodeList();
    }
  }, [user]);

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">공통코드 관리</h2>
        </div>


        {commonCodeList.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <p>등록된 공통코드가 없습니다.</p>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-semibold">총 {commonCodeList.length}건</p>
            </div>
            <div className="overflow-x-auto">
              
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default CommonCodeList;
