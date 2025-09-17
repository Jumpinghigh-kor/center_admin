import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useUserStore } from "../../../store/store";

const EventAppRegister: React.FC = () => {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);

  const [title, setTitle] = useState<string>("");
  const [navigationUseYn, setNavigationUseYn] = useState<"Y" | "N">("Y");
  const [navigationPath, setNavigationPath] = useState<string>("");
  const [navigationPathList, setNavigationPathList] = useState<{ common_code: string; common_code_name: string }[]>([]);

  const [detailImage, setDetailImage] = useState<File | null>(null);
  const [buttonImage, setButtonImage] = useState<File | null>(null);
  const [detailImagePreview, setDetailImagePreview] = useState<string>("");
  const [buttonImagePreview, setButtonImagePreview] = useState<string>("");

  useEffect(() => {
    const fetchCodes = async () => {
      try {
        const res = await axios.post(
          `${process.env.REACT_APP_API_URL}/app/common/selectCommonCodeList`,
          { group_code: "APP_NAVIGATION_PATH" }
        );
        setNavigationPathList(res.data?.result || []);
      } catch (e) {
        console.error("이동 경로 코드 로딩 오류:", e);
      }
    };
    fetchCodes();
  }, []);

  const handleDetailImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        alert("JPG, PNG, JPEG 파일만 업로드 가능합니다.");
        e.target.value = "";
        return;
      }
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        alert("파일 크기는 2MB 이하여야 합니다.");
        e.target.value = "";
        return;
      }
      if (detailImagePreview) URL.revokeObjectURL(detailImagePreview);
      const previewUrl = URL.createObjectURL(file);
      setDetailImagePreview(previewUrl);
      setDetailImage(file);
    }
  };

  const handleButtonImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        alert("JPG, PNG, JPEG 파일만 업로드 가능합니다.");
        e.target.value = "";
        return;
      }
      const maxSize = 2 * 1024 * 1024;
      if (file.size > maxSize) {
        alert("파일 크기는 2MB 이하여야 합니다.");
        e.target.value = "";
        return;
      }
      if (buttonImagePreview) URL.revokeObjectURL(buttonImagePreview);
      const previewUrl = URL.createObjectURL(file);
      setButtonImagePreview(previewUrl);
      setButtonImage(file);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        const base64Data = base64String.split(",")[1];
        resolve(base64Data);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleRegister = async () => {
    if (!title.trim()) {
      alert("제목을 입력하세요.");
      return;
    }
    if (!detailImage) {
      alert("상세 이미지를 선택해주세요.");
      return;
    }
    if (navigationUseYn === "Y") {
      if (!navigationPath) {
        alert("이동 경로를 선택해주세요.");
        return;
      }
      if (!buttonImage) {
        alert("버튼 이미지를 선택해주세요.");
        return;
      }
    }

    try {
      const imagesData: any[] = [];
      // 상세 이미지 (필수)
      const detailB64 = await convertFileToBase64(detailImage);
      imagesData.push({
        file_data: detailB64,
        content_type: detailImage.type,
        event_img_type: "CONTENT",
        order_seq: 1,
      });
      // 버튼 이미지 (사용 시 필수)
      if (navigationUseYn === "Y" && buttonImage) {
        const buttonB64 = await convertFileToBase64(buttonImage);
        imagesData.push({
          file_data: buttonB64,
          content_type: buttonImage.type,
          event_img_type: "BUTTON",
          order_seq: 2,
        });
      }

      await axios.post(`${process.env.REACT_APP_API_URL}/app/eventApp/insertEventApp`, {
        title,
        use_yn: "Y",
        reg_id: user.index,
        navigation_path: navigationUseYn === "Y" ? navigationPath : null,
        images: imagesData,
      });

      alert("이벤트가 성공적으로 등록되었습니다.");
      navigate("/app/eventApp");
    } catch (e) {
      console.error("이벤트 등록 오류:", e);
      alert("등록 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">이벤트 등록</h2>
      </div>

      <form className="space-y-6">
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 font-semibold w-1/6">
                  <p>
                    제목<span className="text-red-500"> *</span>
                  </p>
                </td>
                <td className="px-4 py-3 w-1/3">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                  <p className="text-xs text-gray-500 mt-1">사용자에게 표시되지 않습니다.</p>
                </td>
                <td className="bg-gray-100 px-4 py-3 font-semibold w-1/6">이동 경로</td>
                <td className="px-4 py-3 w-1/3">
                  <div className="flex items-center gap-6 mb-3">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="navigation_use"
                        value="Y"
                        checked={navigationUseYn === "Y"}
                        onChange={() => setNavigationUseYn("Y")}
                        className="form-radio h-5 w-5 text-blue-600"
                      />
                      <span className="ml-2">사용</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="navigation_use"
                        value="N"
                        checked={navigationUseYn === "N"}
                        onChange={() => setNavigationUseYn("N")}
                        className="form-radio h-5 w-5 text-red-600"
                      />
                      <span className="ml-2">미사용</span>
                    </label>
                  </div>

                  {navigationUseYn === "Y" ? (
                    <select
                      value={navigationPath}
                      onChange={(e) => setNavigationPath(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded bg-white"
                    >
                      <option value="">선택</option>
                      {navigationPathList.map((code) => (
                        <option key={code.common_code} value={code.common_code}>
                          {code.common_code_name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value="-"
                      onChange={() => {}}
                      className="w-full p-2 border border-gray-200 rounded bg-gray-50 text-gray-500"
                      disabled
                    />
                  )}
                </td>
              </tr>

              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 font-semibold">
                  <p>
                    상세 이미지 <span className="text-red-500">*</span>
                  </p>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={handleDetailImageChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="mt-1 text-xs text-gray-500">
                    JPG, PNG, JPEG 파일만 가능 (최대 2MB)
                  </div>
                  {detailImage && (
                    <div className="mt-2 text-sm text-gray-600">
                      새로 선택된 파일: {detailImage.name}
                    </div>
                  )}
                  {detailImagePreview && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm text-blue-700 mb-2">새로 선택된 이미지 미리보기:</div>
                      <img
                        src={detailImagePreview}
                        alt="상세 이미지 미리보기"
                        className="w-full h-32 object-contain rounded border"
                      />
                    </div>
                  )}
                </td>
                <td className="bg-gray-100 px-4 py-3 font-semibold">
                  <p>버튼 이미지</p>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={handleButtonImageChange}
                    className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      navigationUseYn === "N" ? "border-gray-200 bg-gray-50 cursor-not-allowed" : "border-gray-300"
                    }`}
                    disabled={navigationUseYn === "N"}
                  />
                  <div className="mt-1 text-xs text-gray-500">
                    {navigationUseYn === "Y"
                      ? "JPG, PNG, JPEG 파일만 가능 (최대 2MB)"
                      : "이동 경로 미사용 시 버튼 이미지는 비활성화됩니다."}
                  </div>
                  {buttonImage && navigationUseYn === "Y" && (
                    <div className="mt-2 text-sm text-gray-600">
                      새로 선택된 파일: {buttonImage.name}
                    </div>
                  )}
                  {buttonImagePreview && navigationUseYn === "Y" && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm text-blue-700 mb-2">새로 선택된 이미지 미리보기:</div>
                      <img
                        src={buttonImagePreview}
                        alt="버튼 이미지 미리보기"
                        className="w-full h-32 object-contain rounded border"
                      />
                    </div>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={() => navigate("/app/eventApp")}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleRegister}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            등록
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventAppRegister;
