import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useUserStore } from "../../../store/store";
import { openInputDatePicker } from "../../../utils/commonUtils";

interface BannerApp {
  banner_app_id: number;
  title: string;
  banner_type: string;
  content: string;
  banner_locate: string;
  use_yn: "Y" | "N";
  del_yn: "Y" | "N";
  reg_dt: string;
  file_id: number;
  image_url?: string;
  order_seq: number;
  start_dt?: string;
  end_dt?: string;
  start_time?: string;
  end_time?: string;
  navigation_path?: string;
  event_app_id?: number;
  navigation_type?: string;
  app_navigation_path?: string;
  external_url?: string;
  image?: File | null;
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

const BannerAppDetail: React.FC = () => {
  const user = useUserStore((state) => state.user);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bannerAppId = searchParams.get('bannerAppId');
  const [formData, setFormData] = useState<Partial<BannerApp>>({
    title: "",
    content: "",
    banner_type: "",
    banner_locate: "",
    use_yn: "Y",
    order_seq: 0,
    start_dt: "",
    end_dt: "",
    navigation_type: "APP",
    app_navigation_path: "",
    external_url: "",
    image: null,
  });
  const [commonCodeList, setCommonCodeList] = useState<CommonCode[]>([]);
  const [navigationPathList, setNavigationPathList] = useState<CommonCode[]>([]);
  const [eventList, setEventList] = useState<Event[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // 공지사항 상세 조회
  const getBannerAppDetail = async () => {
    if (!bannerAppId) return;
    
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/bannerApp/selectBannerAppDetail`,
        {
          banner_app_id: bannerAppId
        }
      );

      const data = response.data.result[0];
      setFormData({
        ...data,
        start_dt: data.start_dt?.replace(/[-: ]/g, '').slice(0, 14),
        end_dt: data.end_dt?.replace(/[-: ]/g, '').slice(0, 14),
        start_time: data.start_dt?.split(' ')[1] || "00:00:01",
        end_time: data.end_dt?.split(' ')[1] || "23:59:59",
        navigation_type: data.navigation_path?.startsWith('https://') ? "EXTERNAL" : "APP",
        app_navigation_path: !data.navigation_path?.startsWith('https://') ? data.navigation_path || "" : "",
        external_url: data.navigation_path?.startsWith('https://') ? data.navigation_path || "" : "",
        image: null,
      });
      setImagePreview(data.image_url || null);
    } catch (error) {
      console.error("배너 상세 조회 오류:", error);
    }
  };

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

  // 공통 코드 목록 조회
  const fetchCommonCodeList = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/common/selectCommonCodeList`,
        {
          group_code: "BANNER_TYPE"
        }
      );
      setCommonCodeList(response.data.result);
    } catch (err) {
      console.error("공통 코드 목록 로딩 오류:", err);
    }
  };

  const handleModify = async (type: string) => {
    if (!bannerAppId) return;

    const typeText = type === 'EDIT' ? "수정" : "삭제";
    if (!window.confirm(`정말로 ${typeText} 하시겠습니까?`)) return;

    try {
      if (type === 'EDIT') {
        const data = new FormData();
        
        data.append("bannerAppId", bannerAppId);
        data.append("title", formData.title || "");
        data.append("content", formData.content || "");
        data.append("bannerType", formData.banner_type || "");
        data.append("bannerLocate", formData.banner_locate || "");
        data.append("useYn", formData.use_yn || "Y");
        data.append("userId", user.index.toString());
        
        if (formData.order_seq) data.append("orderSeq", formData.order_seq.toString());
        if (formData.start_dt) {
          // 날짜는 14자리 형식으로 전송 (00 추가)
          const startDate = formData.start_dt.length === 12 ? formData.start_dt + '00' : formData.start_dt;
          data.append("startDate", startDate);
        }
        if (formData.end_dt) {
          // 날짜는 14자리 형식으로 전송 (00 추가)
          const endDate = formData.end_dt.length === 12 ? formData.end_dt + '00' : formData.end_dt;
          data.append("endDate", endDate);
        }
        if (formData.banner_type === "EVENT" && formData.event_app_id) {
          data.append("eventAppId", formData.event_app_id.toString());
          data.append("navigationPath", ""); // EVENT 타입일 때 네비게이션 패스는 null
        } else {
          if (formData.navigation_type === "APP" && formData.app_navigation_path) {
            data.append("navigationPath", formData.app_navigation_path);
          }
          if (formData.navigation_type === "EXTERNAL" && formData.external_url) {
            data.append("navigationPath", formData.external_url);
          }
        }
        if (formData.image) data.append("image", formData.image);

        await axios.post(
          `${process.env.REACT_APP_API_URL}/app/bannerApp/updateBannerApp`,
          data,
          {
            headers: { "Content-Type": "multipart/form-data" }
          }
        );
      } else {
        // 삭제
        await axios.post(
          `${process.env.REACT_APP_API_URL}/app/bannerApp/batchDeleteBannerApp`,
          {
            bannerAppIds: [bannerAppId],
            userId: user.index,
          }
        );
      }

      navigate("/app/banner");
    } catch (error) {
      console.error(`배너 ${typeText} 오류:`, error);
      alert(`배너 ${typeText} 중 오류가 발생했습니다.`);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileType = file.type;

      if (fileType !== "image/png" && fileType !== "image/jpeg") {
        alert("PNG 또는 JPG 파일만 업로드 가능합니다.");
        e.target.value = "";
        return;
      }

      if (file.size > 1 * 1024 * 1024) {
        alert("파일 크기는 1MB 이하만 허용됩니다.");
        e.target.value = "";
        return;
      }

      const imageUrl = URL.createObjectURL(file);
      setFormData({
        ...formData,
        image: file,
        image_url: imageUrl,
      });
      setImagePreview(imageUrl);

      return () => {
        URL.revokeObjectURL(imageUrl);
      };
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

  useEffect(() => {
    getBannerAppDetail();
    fetchCommonCodeList();
    fetchNavigationPathList();
    fetchEventList();
  }, [bannerAppId]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">배너 상세</h2>
      </div>

      <form className="space-y-6">
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <tbody>
              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 font-semibold w-1/6">
                  <p>배너 위치<span className="text-red-500">*</span></p>
                </td>
                <td className="px-4 py-3 w-1/3">
                  <select
                    name="bannerLocate"
                    value={formData.banner_locate}
                    onChange={(e) => setFormData({ ...formData, banner_locate: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option value="HOME">홈</option>
                    <option value="SHOP">쇼핑</option>
                  </select>
                </td>
                <td className="bg-gray-100 px-4 py-3 font-semibold w-1/6">
                  <p>배너 타입<span className="text-red-500">*</span></p>
                </td>
                <td className="px-4 py-3 w-1/3">
                  <select
                    name="bannerType"
                    value={formData.banner_type}
                    onChange={(e) => setFormData({ ...formData, banner_type: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded"
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

              {formData.banner_type === "EVENT" && (
                <tr className="border-b border-gray-200">
                  <td className="bg-gray-100 px-4 py-3 font-semibold w-1/6">
                    <p>이벤트<br />선택<span className="text-red-500">*</span></p>
                  </td>
                  <td className="px-4 py-3" colSpan={3}>
                    <select
                      name="eventAppId"
                      value={formData.event_app_id}
                      onChange={(e) => setFormData({ ...formData, event_app_id: parseInt(e.target.value) })}
                      className="w-full p-2 border border-gray-300 rounded"
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
                
              {formData.banner_type !== "EVENT" && (
                <tr className="border-b border-gray-200">
                  <td className="bg-gray-100 px-4 py-3 font-semibold w-1/6">
                    이동 경로
                  </td>
                  <td className="px-4 py-3" colSpan={3}>
                    <div className="flex items-center space-x-6 mb-4">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="navigation_type"
                          value="APP"
                          checked={formData.navigation_type === "APP"}
                          onChange={(e) => setFormData({ ...formData, navigation_type: e.target.value })}
                          className="form-radio h-5 w-5 text-blue-600"
                        />
                        <span className="ml-2">앱 내 이동</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          name="navigation_type"
                          value="EXTERNAL"
                          checked={formData.navigation_type === "EXTERNAL"}
                          onChange={(e) => setFormData({ ...formData, navigation_type: e.target.value })}
                          className="form-radio h-5 w-5 text-blue-600"
                        />
                        <span className="ml-2">외부 사이트 이동</span>
                      </label>
                    </div>
                    
                    {formData.navigation_type === "APP" && (
                      <select
                        name="app_navigation_path"
                        value={formData.app_navigation_path}
                        onChange={(e) => setFormData({ ...formData, app_navigation_path: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded"
                      >
                        <option value="">선택</option>
                        {navigationPathList.map((path) => (
                          <option key={path.common_code} value={path.common_code}>
                            {path.common_code_name}
                          </option>
                        ))}
                      </select>
                    )}
                    
                    {formData.navigation_type === "EXTERNAL" && (
                      <input
                        type="url"
                        name="external_url"
                        value={formData.external_url}
                        onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded"
                        placeholder="https://www.example.com"
                      />
                    )}
                  </td>
                </tr>
              )}

              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 font-semibold w-1/6">
                  <p>배너 제목<span className="text-red-500">*</span></p>
                </td>
                <td className="px-4 py-3" colSpan={3}>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="관리용 제목(사용자에겐 표시되지 않습니다)"
                  />
                </td>
              </tr>

              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 font-semibold w-1/6">
                  배너 내용
                </td>
                <td className="px-4 py-3" colSpan={3}>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded h-32"
                    placeholder="관리용 내용(사용자에겐 표시되지 않습니다)"
                  />
                </td>
              </tr>

              <tr className="border-b border-gray-200">
                <td className="bg-gray-100 px-4 py-3 font-semibold w-1/6">
                  <p>노출 순서<span className="text-red-500">*</span></p>
                </td>
                <td className="px-4 py-3" colSpan={3}>
                  <input
                    type="text"
                    name="order_seq"
                    value={formData.order_seq}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === "" || /^[0-9]+$/.test(value)) {
                        if (value.length <= 3) {
                          setFormData({ ...formData, order_seq: parseInt(value) || 0 });
                        }
                      }
                    }}
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="숫자만 입력 가능"
                    maxLength={3}
                  />
                  <div className="text-sm text-gray-500 mt-1">
                    숫자가 낮을수록 먼저 노출됩니다 (1-999)
                  </div>
                </td>
              </tr>

              <tr className="border-b border-gray-200">
              <td className="bg-gray-100 px-4 py-3 font-semibold w-1/6">
                  <p>시작일<span className="text-red-500">*</span></p>
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
                    step="60"
                    value={formData.start_dt && formData.start_dt.length >= 12 ? 
                      `${formData.start_dt.slice(0, 4)}-${formData.start_dt.slice(4, 6).padStart(2, '0')}-${formData.start_dt.slice(6, 8).padStart(2, '0')}T${formData.start_dt.slice(8, 10).padStart(2, '0')}:${formData.start_dt.slice(10, 12).padStart(2, '0')}` : ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      const formattedValue = value ? value.replace(/[-:T]/g, '').slice(0, 12) : '';
                      setFormData(prev => ({
                        ...prev,
                        start_dt: formattedValue
                      }));
                    }}
                    onClick={(e) => openInputDatePicker(e.currentTarget)}
                    onFocus={(e) => openInputDatePicker(e.currentTarget)}
                    className="w-full p-2 border cursor-pointer border-gray-300 rounded"
                  />
                </td>
                <td className="bg-gray-100 px-4 py-3 font-semibold w-1/6">
                  <p>종료일<span className="text-red-500">*</span></p>
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
                    step="60"
                    value={formData.end_dt && formData.end_dt.length >= 12 ? 
                      `${formData.end_dt.slice(0, 4)}-${formData.end_dt.slice(4, 6).padStart(2, '0')}-${formData.end_dt.slice(6, 8).padStart(2, '0')}T${formData.end_dt.slice(8, 10).padStart(2, '0')}:${formData.end_dt.slice(10, 12).padStart(2, '0')}` : ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      const formattedValue = value ? value.replace(/[-:T]/g, '').slice(0, 12) : '';
                      setFormData(prev => ({
                        ...prev,
                        end_dt: formattedValue
                      }));
                    }}
                    onClick={(e) => openInputDatePicker(e.currentTarget)}
                    onFocus={(e) => openInputDatePicker(e.currentTarget)}
                    className="w-full p-2 border cursor-pointer border-gray-300 rounded"
                  />
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
                        name="use_yn"
                        value="Y"
                        checked={formData.use_yn === "Y"}
                        onChange={(e) => setFormData({ ...formData, use_yn: e.target.value as "Y" | "N" })}
                        className="form-radio h-5 w-5 text-blue-600"
                      />
                      <span className="ml-2">네</span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        name="use_yn"
                        value="N"
                        checked={formData.use_yn === "N"}
                        onChange={(e) => setFormData({ ...formData, use_yn: e.target.value as "Y" | "N" })}
                        className="form-radio h-5 w-5 text-red-600"
                      />
                      <span className="ml-2">아니오</span>
                    </label>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            type="button"
            onClick={() => {handleModify('EDIT')}}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            수정
          </button>
          <button
            type="button"
            onClick={() => {handleModify('DELETE')}}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            삭제
          </button>
        </div>
      </form>
    </div>
  );
};

export default BannerAppDetail;
