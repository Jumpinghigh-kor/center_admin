import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUserStore } from "../../../store/store";
import SelectMemberAppPopup from "../../../components/app/SelectMemberAppPopup";

interface PostAppDetail {
  post_app_id: number;
  post_detail_app_id: number;
  post_type: string;
  all_send_yn: string;
  title: string;
  content: string;
  mem_id: string;
  reg_dt: string;
}

const PostAppDetail: React.FC = () => {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const postAppId = new URLSearchParams(window.location.search).get("post_app_id");

  const [formData, setFormData] = useState<PostAppDetail>({
    post_app_id: 0,
    post_detail_app_id: 0,
    post_type: "",
    all_send_yn: "",
    title: "",
    content: "",
    mem_id: "",
    reg_dt: "",
  });

  const [postType, setPostType] = useState<"ALL" | "SHOPPING" | "JUMPING">("ALL");
  const [allSendYn, setAllSendYn] = useState<"Y" | "N">("Y");
  const [pushSendYn, setPushSendYn] = useState<"Y" | "N">("Y");
  const [isPopup, setIsPopup] = useState(false);
  const [selectedMemberNames, setSelectedMemberNames] = useState<string>("");
  
  useEffect(() => {
    const fetchPostAppDetail = async () => {
      try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/app/postApp/selectMemberPostAppList`, { post_app_id: postAppId });
      const rows = res?.data?.result || [];
      
      if (rows.length > 0) {
        const base = rows[0];
        setPostType(base.post_type || "ALL");
        setAllSendYn(base.all_send_yn || "Y");
        setPushSendYn(base.push_send_yn || "Y");

        const ids = rows.filter((r: any) => r.mem_id != null).map((r: any) => r.mem_id).join(",");
        const names = rows.filter((r: any) => r.mem_name).map((r: any) => r.mem_name).join(", ");

        setFormData((prev) => ({
          ...prev,
          post_app_id: Number(postAppId) || 0,
          post_type: base.post_type || "",
          all_send_yn: base.all_send_yn || "",
          title: base.title || "",
          content: base.content || "",
          mem_id: base.all_send_yn === "N" ? ids : "",
        }));

        if (base.all_send_yn === "N") {
          setSelectedMemberNames(names);
        } else {
          setSelectedMemberNames("");
        }
      }
      } catch (err) {
        console.error(err);
        alert("우편함 상세 조회에 실패했습니다.");
      }
    };

    if (postAppId) {
      fetchPostAppDetail();
    }
  }, []);

  // 우편함 삭제
  const onSubmitPostApp = async () => {
    const confirm = window.confirm("이미 읽은 회원이 있을 수 있습니다. 정말 삭제하시겠습니까?");
    
    if (!confirm) {
      return;
    }

    try {
      const deletePostAppRes = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/postApp/deletePostApp`,
        {
          post_app_id: postAppId,
          userId: user.index,
        }
      );

      alert("삭제가 완료되었습니다.");
      navigate("/app/postApp");
    } catch (err) {
      console.error(err);
      alert("삭제에 실패했습니다.");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">우편함 상세</h2>
        </div>

        <form className="space-y-6">
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="bg-gray-100 px-4 py-3 font-semibold w-1/6">
                    우편 유형 <span className="text-red-500">*</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="post_type"
                          value="ALL"
                          checked={postType === "ALL"}
                          onChange={() => setPostType("ALL")}
                          className="mr-2"
                          disabled
                        />
                        전체 섹션
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="post_type"
                          value="SHOPPING"
                          checked={postType === "SHOPPING"}
                          onChange={() => setPostType("SHOPPING")}
                          className="mr-2"
                          disabled
                        />
                        쇼핑몰 섹션
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="post_type"
                          value="JUMPING"
                          checked={postType === "JUMPING"}
                          onChange={() => setPostType("JUMPING")}
                          className="mr-2"
                          disabled
                        />
                        점핑하이 섹션
                      </label>
                    </div>
                  </td>
                </tr>
                
                <tr className="border-b border-gray-200">
                  <td className="bg-gray-100 px-4 py-3 font-semibold">
                    전체 발송 여부 <span className="text-red-500">*</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="all_send_yn"
                          value="Y"
                          checked={allSendYn === "Y"}
                          onChange={() => setAllSendYn("Y")}
                          className="mr-2"
                          disabled
                        />
                        전체 발송
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="all_send_yn"
                          value="N"
                          checked={allSendYn === "N"}
                          onChange={() => setAllSendYn("N")}
                          className="mr-2"
                          disabled
                        />
                        개별 발송
                      </label>
                    </div>
                  </td>
                </tr>

                {allSendYn === "N" && (
                  <tr className="border-b border-gray-200">
                    <td className="bg-gray-100 px-4 py-3 font-semibold">
                      회원 선택
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setIsPopup(true)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled
                        title={pushSendYn === "N" ? "푸쉬 발송이 '아니오'인 경우 회원 선택이 비활성화됩니다." : undefined}
                      >
                        회원 선택
                      </button>
                      {selectedMemberNames && (
                        <span className="ml-3 text-gray-700 align-middle">{selectedMemberNames}</span>
                      )}
                    </td>
                  </tr>
                )}

                <tr className="border-b border-gray-200">
                  <td className="bg-gray-100 px-4 py-3 font-semibold">
                    푸쉬 발송 여부 <span className="text-red-500">*</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="push_send_yn"
                          value="Y"
                          checked={pushSendYn === "Y"}
                          onChange={() => setPushSendYn("Y")}
                          className="mr-2"
                          disabled
                        />
                        네
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="push_send_yn"
                          value="N"
                          checked={pushSendYn === "N"}
                          onChange={() => setPushSendYn("N")}
                          className="mr-2"
                          disabled
                        />
                        아니오
                      </label>
                    </div>
                  </td>
                </tr>

                <tr className="border-b border-gray-200">
                  <td className="bg-gray-100 px-4 py-3 font-semibold">
                    제목 <span className="text-red-500">*</span>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="상품 제목을 입력하세요"
                      required
                      disabled
                    />
                  </td>
                </tr>

                <tr className="border-b border-gray-200">
                  <td className="bg-gray-100 px-4 py-3 font-semibold">
                    내용 <span className="text-red-500">*</span>
                  </td>
                  <td className="px-4 py-3">
                    <textarea
                      name="content"
                      value={formData.content}
                      onChange={handleInputChange}
                      className="h-[150px] w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="내용을 입력하세요"
                      disabled
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 버튼 */}
          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={() => navigate("/app/postAppList")}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
              onClick={onSubmitPostApp}
            >
              삭제
            </button>
          </div>
        </form>
      </div>  
      {/* 회원 선택 팝업 */}
      <SelectMemberAppPopup
        isOpen={isPopup}
        onClose={() => setIsPopup(false)}
        onSelect={(members: { mem_id: number; mem_name: string }[]) => {
          const ids = members.map((m: any) => m.mem_id).join(",");
          const names = members.map((m: any) => m.mem_name).join(", ");
          setFormData((prev) => ({ ...prev, mem_id: ids }));
          setSelectedMemberNames(names);
          setIsPopup(false);
        }}
        preselectedIds={(formData.mem_id || "")
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s)
          .map((s) => Number(s))
          .filter((n) => !Number.isNaN(n))}
      />
    </>
  );
};

export default PostAppDetail;
