import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUserStore } from "../../../store/store";
import axios from "axios";

interface EventAppDetailData {
  event_app_id: number;
  title: string;
  navigation_path: string | null;
  reg_dt: string;
  mod_dt?: string | null;
}

interface ExistingImage {
  file_id: number;
  file_name: string;
  file_path: string;
  event_img_type: string;
  order_seq: number;
}

const EventAppDetail: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useUserStore((state) => state.user);
  const [formData, setFormData] = useState<EventAppDetailData | null>(null);

  const eventAppId = searchParams.get("eventAppId");
  const [existingContentImage, setExistingContentImage] = useState<ExistingImage | null>(null);
  const [existingButtonImage, setExistingButtonImage] = useState<ExistingImage | null>(null);
  const [detailImage, setDetailImage] = useState<File | null>(null);
  const [buttonImage, setButtonImage] = useState<File | null>(null);
  const [detailImagePreview, setDetailImagePreview] = useState<string>("");
  const [buttonImagePreview, setButtonImagePreview] = useState<string>("");
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [navigationUseYn, setNavigationUseYn] = useState<"Y" | "N">("N");
  const [navigationPathList, setNavigationPathList] = useState<{ common_code: string; common_code_name: string }[]>([]);

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

      if (detailImagePreview) {
        URL.revokeObjectURL(detailImagePreview);
      }

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

      if (buttonImagePreview) {
        URL.revokeObjectURL(buttonImagePreview);
      }

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
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const fileFromUrl = async (url: string, filename: string): Promise<File> => {
    const response = await fetch(url);
    const blob = await response.blob();
    const type = blob.type || "image/jpeg";
    return new File([blob], filename || "image.jpg", { type });
  };

  const handleUpdateEvent = async () => {
    if (!eventAppId || !formData) return;

    if (!formData.title?.trim()) {
      alert("제목을 입력하세요.");
      return;
    }

    if (navigationUseYn === "Y" && !formData.navigation_path) {
      alert("이동 경로를 선택해주세요.");
      return;
    }

    if (!detailImage && !existingContentImage) {
      alert("상세 이미지를 선택해주세요.");
      return;
    }
  
    if (window.confirm("정말로 수정하시겠습니까?")) {
      try {
        // 선택된 이미지들을 base64로 변환하여 payload 구성
        const imagesData: any[] = [];
        if (detailImage) {
          const base64 = await convertFileToBase64(detailImage);
          imagesData.push({
            file_data: base64,
            content_type: detailImage.type,
            event_img_type: "CONTENT",
            order_seq: 1,
          });
        }
        if (navigationUseYn === "Y") {
          if (buttonImage) {
            const base64 = await convertFileToBase64(buttonImage);
            imagesData.push({
              file_data: base64,
              content_type: buttonImage.type,
              event_img_type: "BUTTON",
              order_seq: 2,
            });
          }
          // 버튼 이미지를 교체하지 않은 경우 기존 이미지를 재전송하여 navigation_path 반영
          else if (existingButtonImage) {
            try {
              const file = await fileFromUrl(
                existingButtonImage.file_path,
                existingButtonImage.file_name || "button.jpg"
              );
              const base64 = await convertFileToBase64(file);
              imagesData.push({
                file_data: base64,
                content_type: file.type,
                event_img_type: "BUTTON",
                order_seq: 2,
              });
            } catch (e) {
              console.error("기존 버튼 이미지 변환 오류:", e);
            }
          }
        }

        await axios.post(
          `${process.env.REACT_APP_API_URL}/app/eventApp/updateEventApp`,
          {
            event_app_id: Number(eventAppId),
            title: formData.title,
            mod_id: user.index,
            navigation_path: navigationUseYn === "Y" ? formData.navigation_path || null : null,
            images: imagesData,
          }
        );

        navigate("/app/eventApp");
      } catch (e) {
        console.error(e);
        alert("저장 중 오류가 발생했습니다.");
      }
    }
  };

  const handleDelete = async () => {
    if (window.confirm("정말로 삭제하시겠습니까?")) {
      try {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/app/eventApp/deleteEventApp`,
          {
            event_app_id: Number(eventAppId),
            mod_id: user.index,
          }
        );
        navigate("/app/eventApp");
      } catch (err) {
        console.error("이벤트 삭제 오류:", err);
        alert("이벤트 삭제 중 오류가 발생했습니다.");
      }
    }
  };

  useEffect(() => {
    const fetchEventAppDetail = async () => {
      if (!eventAppId) return;
      
      try {
        const res = await axios.post(
          `${process.env.REACT_APP_API_URL}/app/eventApp/selectEventAppDetail`,
          { event_app_id: Number(eventAppId) }
        );
        const row = res.data?.result?.[0];
        if (row) {
          setFormData({
            event_app_id: Number(eventAppId),
            title: row.title,
            navigation_path: row.navigation_path,
            reg_dt: row.reg_dt,
            mod_dt: row.mod_dt,
          });
        }

        const imgRes = await axios.post(
          `${process.env.REACT_APP_API_URL}/app/eventApp/selectEventAppImgList`,
          { event_app_id: Number(eventAppId) }
        );
        const imgs = imgRes.data?.result || [];
        const content = imgs.find((i: any) => i.event_img_type === "CONTENT");
        const button = imgs.find((i: any) => i.event_img_type === "BUTTON");
        if (content) setExistingContentImage(content);
        if (button) setExistingButtonImage(button);
      } catch (e) {
        console.error("이벤트 상세 로딩 오류:", e);
      }
    };
    fetchEventAppDetail();
  }, [eventAppId]);

  // 이동 경로 공통코드 목록 조회 및 초기 사용 여부 설정
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

  useEffect(() => {
    // 상세 데이터 로딩 후 이동 경로 존재 여부로 사용/미사용 초기화
    if (formData) {
      setNavigationUseYn(formData.navigation_path ? "Y" : "N");
    }
  }, [formData]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">이벤트 상세</h2>
      </div>

      <form className="space-y-6">
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 font-semibold w-1/6">
                  <p>제목<span className="text-red-500"> *</span></p>
                </td>
                <td className="px-4 py-3 w-1/3">
                  <input
                    type="text"
                    value={formData?.title || ""}
                    onChange={(e) =>
                      setFormData((prev) => (prev ? { ...prev, title: e.target.value } : prev))
                    }
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                  <p className="text-xs text-gray-500 mt-1">사용자에게 표시되지 않습니다.</p>
                </td>
                <td className="bg-gray-100 px-4 py-3 font-semibold w-1/6">
                  이동 경로
                </td>
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
                      value={formData?.navigation_path || ""}
                      onChange={(e) =>
                        setFormData((prev) => (prev ? { ...prev, navigation_path: e.target.value } : prev))
                      }
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
                  <p>상세 이미지 <span className="text-red-500">*</span></p>
                </td>
                <td className="px-4 py-3">
                  <div>
                    {existingContentImage && (
                      <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600 mb-2">현재 이미지:</div>
                        <img 
                          src={existingContentImage.file_path} 
                          alt="현재 상세 이미지"
                          className="w-full h-32 object-contain rounded border"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {existingContentImage.file_name}
                        </div>
                      </div>
                    )}
                
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png"
                      onChange={handleDetailImageChange}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="mt-1 text-xs text-gray-500">
                      JPG, PNG, JPEG 파일만 가능 (최대 2MB)
                      {existingContentImage && (
                        <span>
                          <br />새 이미지를 선택하면 기존 이미지가 교체됩니다.
                        </span>
                      )}
                    </div>
                    {detailImage && (
                      <div className="mt-2 text-sm text-gray-600">
                        새로 선택된 파일: {detailImage.name}
                      </div>
                    )}
                    
                    {/* 상세 이미지 미리보기 */}
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
                  </div>
                </td>
                <td className="bg-gray-100 px-4 py-3 font-semibold">
                  <p>버튼 이미지</p>
                </td>
                <td className="px-4 py-3">
                  <div>
                    {existingButtonImage && (
                      <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-600 mb-2">현재 이미지:</div>
                        <img 
                          src={existingButtonImage.file_path} 
                          alt="현재 버튼 이미지"
                          className="w-full h-32 object-contain rounded border"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                          {existingButtonImage.file_name}
                        </div>
                      </div>
                    )}
                
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
                      {navigationUseYn === "Y" ? (
                        <>
                          JPG, PNG, JPEG 파일만 가능 (최대 2MB)
                          {existingButtonImage && (
                            <span>
                              <br />새 이미지를 선택하면 기존 이미지가 교체됩니다.
                            </span>
                          )}
                        </>
                      ) : (
                        <>이동 경로 미사용 시 버튼 이미지는 비활성화됩니다.</>
                      )}
                    </div>
                    {buttonImage && navigationUseYn === "Y" && (
                      <div className="mt-2 text-sm text-gray-600">
                        새로 선택된 파일: {buttonImage.name}
                      </div>
                    )}
                
                    {/* 버튼 이미지 미리보기 */}
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
                  </div>
 
                  {isLoadingImages && (
                    <div className="text-center text-gray-500">
                      이미지를 불러오는 중...
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
            onClick={handleDelete}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            삭제
          </button>
          
          <button
            type="button"
            onClick={handleUpdateEvent}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            수정
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventAppDetail;
