import React, { useEffect, useState } from "react";
import axios from "axios";
import { useUserStore } from "../../store/store";

interface Banner {
  bannerAppId: number;
  title: string;
  bannerType: string;
  content: string;
  bannerLocate: string;
  useYn: "Y" | "N";
  delYn: "Y" | "N";
  regDate: string;
  fileId: number;
  imageUrl?: string;
  orderSeq: number;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  start_dt?: string;
  end_dt?: string;
  navigationPath?: string;
  eventAppId?: number;
}

interface CommonCode {
  common_code: string;
  group_code: string;
  common_code_name: string;
  common_code_memo: string;
}

interface Event {
  event_app_id: number;
  title: string;
  use_yn: "Y" | "N";
  del_yn: "Y" | "N";
  reg_dt: string;
}

interface BannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  selectedBanner: Banner | null;
  commonCodeList: CommonCode[];
}

const BannerModal: React.FC<BannerModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  selectedBanner,
  commonCodeList,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const user = useUserStore((state) => state.user);
  const [eventList, setEventList] = useState<Event[]>([]);
  const [navigationPathList, setNavigationPathList] = useState<CommonCode[]>([]);

  // Modal functionality
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    
    window.addEventListener("keydown", handleEsc);

    // 모달이 열리면 body 스크롤 방지
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setIsAnimating(true);
      fetchEventList();
      fetchNavigationPathList();
    } else {
      // 애니메이션이 끝난 후에 isAnimating을 false로 설정
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 300); // 애니메이션 시간(duration)과 동일하게 설정

      return () => {
        clearTimeout(timer);
      };
    }

    return () => {
      window.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  // 이벤트 목록 조회
  const fetchEventList = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/eventApp/selectEventAppList`
      );

      setEventList(response.data.result);
    } catch (err) {
      console.error("이벤트 목록 로딩 오류:", err);
    } finally {
    }
  };

  // 네비게이션 경로 목록 조회
  const fetchNavigationPathList = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/common/selectCommonCodeList`,
        {
          group_code: "APP_NAVIGATION_PATH"
        }
      );

      setNavigationPathList(response.data.result);
    } catch (err) {
      console.error("네비게이션 경로 목록 로딩 오류:", err);
    } finally {
    }
  };

  if (!isOpen && !isAnimating) return null;

  // Banner Form Component
  const BannerForm = () => {
    const user = useUserStore((state) => state.user);
    const [formData, setFormData] = useState({
      title: selectedBanner ? selectedBanner.title : "",
      content: selectedBanner ? selectedBanner.content : "",
      bannerType: selectedBanner ? selectedBanner.bannerType : "NORMAL",
      bannerLocate: selectedBanner ? selectedBanner.bannerLocate : "HOME",
      image: null as File | null,
      useYn: selectedBanner ? selectedBanner.useYn : "Y",
      delYn: selectedBanner ? selectedBanner.delYn : "N",
      orderSeq: selectedBanner ? selectedBanner.orderSeq : "",
      regId: user.index.toString(),
      selectedEventId: selectedBanner && selectedBanner.eventAppId ? selectedBanner.eventAppId.toString() : "",
      navigationType: selectedBanner && selectedBanner.navigationPath ? 
        (selectedBanner.navigationPath.startsWith('https://') ? "EXTERNAL" : "APP") : "APP",
      appNavigationPath: selectedBanner && selectedBanner.navigationPath && !selectedBanner.navigationPath.startsWith('https://') ? 
        selectedBanner.navigationPath : "",
      externalUrl: selectedBanner && selectedBanner.navigationPath && selectedBanner.navigationPath.startsWith('https://') ? 
        selectedBanner.navigationPath : "",
      startDate: selectedBanner && selectedBanner.startDate ? selectedBanner.startDate.split(' ')[0] : "",
      endDate: selectedBanner && selectedBanner.endDate ? selectedBanner.endDate.split(' ')[0] : "",
      startTime: selectedBanner && selectedBanner.startDate ? selectedBanner.startDate.split(' ')[1] || "00:00:01" : "00:00:01",
      endTime: selectedBanner && selectedBanner.endDate ? selectedBanner.endDate.split(' ')[1] || "23:59:59" : "23:59:59",
    });
    const [imagePreview, setImagePreview] = useState<string | null>(
      selectedBanner && selectedBanner.imageUrl ? selectedBanner.imageUrl : null
    );

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const handleInputChange = (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ) => {
      const { name, value } = e.target;
      setFormData({
        ...formData,
        [name]: value,
      });
    };

    const handleNumericInputChange = (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const { name, value } = e.target;

      if (value === "" || /^[0-9]+$/.test(value)) {
        if (value.length <= 3) {
          setFormData({
            ...formData,
            [name]: value,
          });
        }
      }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const fileType = file.type;

        // 파일 타입 검증 (png, jpg만 허용)
        if (fileType !== "image/png" && fileType !== "image/jpeg") {
          alert("PNG 또는 JPG 파일만 업로드 가능합니다.");
          e.target.value = "";
          return;
        }

        // 파일 크기 검증 (1MB 이하만 허용)
        if (file.size > 1 * 1024 * 1024) {
          alert("파일 크기는 1MB 이하만 허용됩니다.");
          e.target.value = "";
          return;
        }

        // 에러 메시지 초기화

        // 이미지 파일 저장 및 미리보기 생성
        setFormData({
          ...formData,
          image: file,
        });

        // 이미지 미리보기 URL 생성
        const imageUrl = URL.createObjectURL(file);
        setImagePreview(imageUrl);

        // 컴포넌트가 언마운트될 때 URL 해제
        return () => {
          URL.revokeObjectURL(imageUrl);
        };
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      // 필수 필드 확인
      if (!formData.title || !formData.content) {
        alert("제목과 내용을 입력해주세요.");
        return;
      }

      if (!selectedBanner && !formData.image) {
        alert("이미지를 업로드해주세요.");
        return;
      }

      if (!formData.startDate || !formData.endDate) {
        alert("시작일과 종료일을 입력해주세요.");
        return;
      }

      if (formData.startDate > formData.endDate) {
        alert("시작일은 종료일보다 이전이어야 합니다.");
        return;
      }

      if (formData.startDate === formData.endDate && formData.startTime > formData.endTime) {
        alert("시작 시간은 종료 시간보다 이전이어야 합니다.");
        return;
      }

      // 외부 URL 유효성 검사
      if (formData.navigationType === "EXTERNAL" && formData.externalUrl) {
        if (!formData.externalUrl.startsWith("https://")) {
          alert("외부 URL은 https://로 시작해야 합니다.");
          return;
        }
      }

      try {
        setIsSubmitting(true);

        // FormData 객체 생성
        const data = new FormData();
        data.append("title", formData.title);
        data.append("content", formData.content);
        data.append("bannerType", formData.bannerType);
        data.append("bannerLocate", formData.bannerLocate);
        data.append("useYn", formData.useYn);
        data.append("delYn", formData.delYn);
        data.append("userId", user.index.toString());
        if (formData.orderSeq) {
          data.append("orderSeq", formData.orderSeq.toString());
        }

        if (formData.image) {
          data.append("image", formData.image);
        }

        // 이벤트 ID 추가
        if (formData.bannerType === "EVENT" && formData.selectedEventId) {
          data.append("eventAppId", formData.selectedEventId);
        }

        // 네비게이션 경로 추가
        if (formData.navigationType === "APP" && formData.appNavigationPath) {
          data.append("navigationPath", formData.appNavigationPath);
        }
        if (formData.navigationType === "EXTERNAL" && formData.externalUrl) {
          data.append("navigationPath", formData.externalUrl);
        }

        // 날짜와 시간을 YYYYMMDDHHIISS 형식으로 변환
        if (formData.startDate && formData.startTime) {
          const startDateTime = formData.startDate.replace(/-/g, '') + formData.startTime.replace(/:/g, '');
          data.append("startDate", startDateTime);
        }
        if (formData.endDate && formData.endTime) {
          const endDateTime = formData.endDate.replace(/-/g, '') + formData.endTime.replace(/:/g, '');
          data.append("endDate", endDateTime);
        }

        // API 요청
        if (selectedBanner) {
          // 수정 API 호출
          data.append("bannerAppId", selectedBanner.bannerAppId.toString());

          await axios.put(
            `${process.env.REACT_APP_API_URL}/app/bannerApp/updateBannerApp`,
            data,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
              withCredentials: true,
            }
          );

          alert("배너가 성공적으로 수정되었습니다.");
        } else {
          // 등록 API 호출
          await axios.post(
            `${process.env.REACT_APP_API_URL}/app/bannerApp/insertBannerApp`,
            data,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
              withCredentials: true,
            }
          );

          alert("배너가 성공적으로 등록되었습니다.");
        }

        onSuccess();
      } catch (error) {
        console.error("배너 처리 오류:", error);
        alert("배너 처리 중 오류가 발생했습니다.");
      } finally {
        setIsSubmitting(false);
      }
    };

          return (
        <div>
          <form onSubmit={handleSubmit}>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <tbody>
                {/* 모바일 화면에서는 배너 위치와 타입이 각각 별도의 행에 표시됨 */}
                <tr className="border-b border-gray-200 md:hidden">
                  <td className="bg-gray-100 px-4 py-3 w-1/4 font-semibold">
                    <p>배너 위치<span className="text-red-500">*</span></p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      name="bannerLocate"
                      value={formData.bannerLocate}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      disabled={isSubmitting}
                    >
                      <option value="HOME">홈</option>
                      <option value="SHOP">쇼핑</option>
                    </select>
                  </td>
                </tr>
                <tr className="border-b border-gray-200 md:hidden">
                  <td className="bg-gray-100 px-4 py-3 w-1/4 font-semibold">
                    <p>배너 타입<span className="text-red-500">*</span></p>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      name="bannerType"
                      value={formData.bannerType}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      disabled={isSubmitting}
                    >
                      {
                        commonCodeList?.length > 0 && commonCodeList?.map((code) => (
                          <option key={code.common_code} value={code.common_code}>
                            {code.common_code_name}
                          </option>
                        ))
                      }
                    </select>
                  </td>
                </tr>

                {/* 데스크톱 화면에서는 배너 위치와 타입이 한 행에 표시됨 */}
                <tr className="border-b border-gray-200 hidden md:table-row">
                  <td className="bg-gray-100 px-4 py-3 w-1/6 font-semibold">
                    <p>배너 위치<span className="text-red-500">*</span></p>
                  </td>
                  <td className="px-4 py-3 w-1/3">
                    <select
                      name="bannerLocate"
                      value={formData.bannerLocate}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      disabled={isSubmitting}
                    >
                      <option value="HOME">홈</option>
                      <option value="SHOP">쇼핑 홈</option>
                    </select>
                  </td>
                  <td className="bg-gray-100 px-4 py-3 w-1/6 font-semibold">
                    <p>배너 타입<span className="text-red-500">*</span></p>
                  </td>
                  <td className="px-4 py-3 w-1/3">
                    <select
                      name="bannerType"
                      value={formData.bannerType}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      disabled={isSubmitting}
                    >
                      {
                        commonCodeList?.length > 0 && commonCodeList?.map((code) => (
                          <option key={code.common_code} value={code.common_code}>
                            {code.common_code_name}
                          </option>
                        ))
                      }
                    </select>
                  </td>
                </tr>

                {formData.bannerType === "EVENT" && (
                  <tr className="border-b border-gray-200">
                    <td className="bg-gray-100 px-4 py-3 font-semibold">
                      <p>이벤트<br />선택<span className="text-red-500">*</span></p>
                    </td>
                    <td className="px-4 py-3" colSpan={3}>
                      <select
                        name="selectedEventId"
                        value={formData.selectedEventId}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded"
                        disabled={isSubmitting}
                      >
                        <option value="">선택</option>
                        {eventList.map((event) => (
                          <option key={event.event_app_id} value={event.event_app_id}>
                            {event.title}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                )}

                {formData.bannerType !== "EVENT" && (
                  <tr className="border-b border-gray-200">
                    <td className="bg-gray-100 px-4 py-3 font-semibold">
                      이동 경로
                    </td>
                    <td className="px-4 py-3" colSpan={3}>
                      <div className="flex items-center space-x-6 mb-4">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="navigationType"
                            value="APP"
                            checked={formData.navigationType === "APP"}
                            onChange={handleInputChange}
                            className="form-radio h-5 w-5 text-blue-600"
                            disabled={isSubmitting}
                          />
                          <span className="ml-2">앱 내 이동</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="navigationType"
                            value="EXTERNAL"
                            checked={formData.navigationType === "EXTERNAL"}
                            onChange={handleInputChange}
                            className="form-radio h-5 w-5 text-blue-600"
                            disabled={isSubmitting}
                          />
                          <span className="ml-2">외부 사이트 이동</span>
                        </label>
                      </div>
                      
                      {formData.navigationType === "APP" && (
                        <select
                          name="appNavigationPath"
                          value={formData.appNavigationPath}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded"
                          disabled={isSubmitting}
                        >
                          <option value="">선택</option>
                          {navigationPathList.map((path) => (
                            <option key={path.common_code} value={path.common_code}>
                              {path.common_code_name}
                            </option>
                          ))}
                        </select>
                      )}
                      
                      {formData.navigationType === "EXTERNAL" && (
                        <input
                          type="url"
                          name="externalUrl"
                          value={formData.externalUrl}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded"
                          placeholder="https://www.example.com"
                          disabled={isSubmitting}
                        />
                      )}
                    </td>
                  </tr>
                )}

                <tr className="border-b border-gray-200">
                  <td className="bg-gray-100 px-4 py-3 font-semibold">
                    <p>배너 제목<span className="text-red-500">*</span></p>
                  </td>
                  <td className="px-4 py-3" colSpan={3}>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="관리용 제목(사용자에겐 표시되지 않습니다)"
                      disabled={isSubmitting}
                    />
                  </td>
                </tr>

                <tr className="border-b border-gray-200">
                  <td className="bg-gray-100 px-4 py-3 font-semibold">
                    배너 내용
                  </td>
                  <td className="px-4 py-3" colSpan={3}>
                    <textarea
                      name="content"
                      value={formData.content}
                      onChange={handleInputChange}
                      className="w-full p-2 border border-gray-300 rounded h-32"
                      placeholder="관리용 내용(사용자에겐 표시되지 않습니다)"
                      disabled={isSubmitting}
                    />
                  </td>
                </tr>

                <tr className="border-b border-gray-200">
                  <td className="bg-gray-100 px-4 py-3 font-semibold">
                    <p>노출 순서<span className="text-red-500">*</span></p>
                  </td>
                  <td className="px-4 py-3" colSpan={3}>
                    <input
                      type="text"
                      name="orderSeq"
                      value={formData.orderSeq}
                      onChange={handleNumericInputChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="숫자만 입력 가능"
                      maxLength={3}
                      disabled={isSubmitting}
                    />
                    <div className="text-sm text-gray-500 mt-1">
                      숫자가 낮을수록 먼저 노출됩니다 (1-999)
                    </div>
                  </td>
                </tr>

                <tr className="border-b border-gray-200">
                  <td className="bg-gray-100 px-4 py-3 font-semibold">
                    <p>시작일<span className="text-red-500">*</span></p>
                  </td>
                  <td className="px-4 py-3" colSpan={3}>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleInputChange}
                        className="flex-1 p-2 border border-gray-300 rounded"
                        disabled={isSubmitting}
                      />
                      <input
                        type="time"
                        name="startTime"
                        value={formData.startTime || "00:00:01"}
                        onChange={handleInputChange}
                        className="w-40 p-2 border border-gray-300 rounded"
                        step="1"
                        disabled={isSubmitting}
                      />
                    </div>
                  </td>
                </tr>

                <tr className="border-b border-gray-200">
                  <td className="bg-gray-100 px-4 py-3 font-semibold">
                    <p>종료일<span className="text-red-500">*</span></p>
                  </td>
                  <td className="px-4 py-3" colSpan={3}>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleInputChange}
                        className="flex-1 p-2 border border-gray-300 rounded"
                        disabled={isSubmitting}
                      />
                      <input
                        type="time"
                        name="endTime"
                        value={formData.endTime || "23:59:59"}
                        onChange={handleInputChange}
                        className="w-40 p-2 border border-gray-300 rounded"
                        step="1"
                        disabled={isSubmitting}
                      />
                    </div>
                  </td>
                </tr>

                <tr className="border-b border-gray-200">
                  <td className="bg-gray-100 px-4 py-3 font-semibold">
                    <p>배너 이미지<span className="text-red-500">*</span></p>
                  </td>
                  <td className="px-4 py-3" colSpan={3}>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg"
                      onChange={handleImageChange}
                      className="w-full p-2 border border-gray-300 rounded"
                      disabled={isSubmitting}
                    />
                    <div className="text-sm text-gray-500 mt-1">
                      PNG, JPG만 가능, 최대 1MB
                    </div>
                    {imagePreview && (
                      <div className="mt-4">
                        <img
                          src={imagePreview}
                          alt="배너 미리보기"
                          className="max-w-full max-h-64 rounded"
                        />
                      </div>
                    )}
                  </td>
                </tr>

                <tr className="border-b border-gray-200">
                  <td className="bg-gray-100 px-4 py-3 font-semibold">
                    <p>사용 여부<span className="text-red-500">*</span></p>
                  </td>
                  <td className="px-4 py-3" colSpan={3}>
                    <div className="flex items-center space-x-6">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="useYn"
                          value="Y"
                          checked={formData.useYn === "Y"}
                          onChange={handleInputChange}
                          className="form-radio h-5 w-5 text-blue-600"
                          disabled={isSubmitting}
                        />
                        <span className="ml-2">네</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="useYn"
                          value="N"
                          checked={formData.useYn === "N"}
                          onChange={handleInputChange}
                          className="form-radio h-5 w-5 text-red-600"
                          disabled={isSubmitting}
                        />
                        <span className="ml-2">아니오</span>
                      </label>
                    </div>
                  </td>
                </tr>

                <tr className="border-b border-gray-200">
                  <td className="bg-gray-100 px-4 py-3 font-semibold">
                    <p>삭제 여부<span className="text-red-500">*</span></p>
                  </td>
                  <td className="px-4 py-3" colSpan={3}>
                    <div className="flex items-center space-x-6">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="delYn"
                          value="Y"
                          checked={formData.delYn === "Y"}
                          onChange={handleInputChange}
                          className="form-radio h-5 w-5 text-red-600"
                          disabled={isSubmitting}
                        />
                        <span className="ml-2">네</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="delYn"
                          value="N"
                          checked={formData.delYn === "N"}
                          onChange={handleInputChange}
                          className="form-radio h-5 w-5 text-blue-600"
                          disabled={isSubmitting}
                        />
                        <span className="ml-2">아니오</span>
                      </label>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-end mt-6">
            <button
              type="submit"
              className={`${
                isSubmitting
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600"
              } text-white px-4 py-2 rounded`}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "처리 중..."
                : selectedBanner
                ? "배너 수정"
                : "배너 등록"}
            </button>
          </div>
        </form>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* 백드롭 (배경 어둡게) */}
      <div
        className={`fixed inset-0 bg-black transition-opacity duration-300 ${
          isOpen ? "bg-opacity-50" : "bg-opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* 모달 컨테이너 - 모바일에서는 아래에서 위로, 데스크톱에서는 오른쪽에서 왼쪽으로 */}
      <div
        className={`
          fixed bg-white shadow-xl 
          md:top-0 md:right-0 md:bottom-0 md:h-full md:w-2/3 lg:w-1/2 xl:w-1/3
          md:border-l md:border-gray-200
          transform 
          md:transform ${isOpen ? "md:translate-x-0" : "md:translate-x-full"}
          bottom-0 right-0 h-[90vh] rounded-t-xl md:rounded-none
          ${isOpen ? "translate-x-0" : "translate-x-full"}
          md:translate-y-0
        `}
      >
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t">
          <h3 className="text-xl font-semibold text-gray-900">
            {selectedBanner ? "배너 수정" : "배너 등록"}
          </h3>
          <button
            type="button"
            className="end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
            data-modal-hide="authentication-modal"
            onClick={onClose}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 모달 내용 */}
        <div className="p-4 overflow-y-auto max-h-[calc(100%-4rem)]">
          <BannerForm />
        </div>
      </div>
    </div>
  );
};

export default BannerModal;
