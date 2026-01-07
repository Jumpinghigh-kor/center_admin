import React, { useCallback, useEffect, useRef, useState } from "react";
import { useUserStore } from "../store/store";
import axios from "axios";
import { convertDate } from "../utils/formatUtils";
import { isAllSelected, toggleSelectAll, toggleSelectOne } from "../utils/commonUtils";
import { useNavigate } from "react-router-dom";
import { usePagination } from "../hooks/usePagination";
import Pagination from "../components/Pagination";

interface PosterListType {
  poster_id: number;
  poster_image_type: "WEB" | "PRINT";
  title: string;
  start_dt: string;
  end_dt: string;
  reg_dt: string;
  reg_id: string;
}

const PosterList: React.FC = () => {
  const user = useUserStore((state) => state.user);
  const navigate = useNavigate();
  const [posterList, setPosterList] = useState<PosterListType[]>([]);
  const [selectedPosterIds, setSelectedPosterIds] = useState<number[]>([]);
  const [centerInfo, setCenterInfo] = useState<any>(null);
  const [isCenterPopupOpen, setIsCenterPopupOpen] = useState(false);
  const [pendingPosterId, setPendingPosterId] = useState<number | null>(null);
  const [popupAddress, setPopupAddress] = useState<string>("");
  const [popupZipcode, setPopupZipcode] = useState<string>("");
  const [popupAddressDetail, setPopupAddressDetail] = useState<string>("");
  const [popupPhone, setPopupPhone] = useState<string>("");
  const allPosterIds = posterList.map((p) => p.poster_id);
  const [itemsPerPage] = useState(10);
  const daumPostcodeLoadPromiseRef = useRef<Promise<void> | null>(null);

  // 공통 페이지네이션 훅 사용
  const pagination = usePagination({
    totalItems: posterList.length,
    itemsPerPage,
  });
  const currentPosters = pagination.getCurrentPageData(posterList);

  // 목록 변경 시 페이지 범위 보정
  useEffect(() => {
    const total = posterList.length;
    const totalPagesCalc = Math.max(1, Math.ceil(total / itemsPerPage));
    if (pagination.currentPage > totalPagesCalc) {
      pagination.handlePageChange(1);
    }
  }, [posterList.length]);

  const fetchData = useCallback(async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/poster`);

      setPosterList(res.data.result);
    } catch (e) {
      console.log(e);
    }
  }, [user]);

  const getCenterInfo = useCallback(async () => {
    const centerId = user?.center_id;
    if (!centerId) return;

    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/center`, {
        params: { center_id: centerId },
      });
      setCenterInfo(res.data.result[0]);
    } catch (e) {
      console.log(e);
    }
  }, [user]);

  const ensureDaumPostcodeLoaded = useCallback(() => {
    if ((window as any)?.daum?.Postcode) return Promise.resolve();
    if (daumPostcodeLoadPromiseRef.current) return daumPostcodeLoadPromiseRef.current;

    daumPostcodeLoadPromiseRef.current = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector(
        'script[data-daum-postcode="true"]'
      ) as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener(
          "error",
          () => reject(new Error("daum postcode load failed")),
          { once: true }
        );
        return;
      }

      const script = document.createElement("script");
      script.async = true;
      script.defer = true;
      script.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
      script.setAttribute("data-daum-postcode", "true");
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("daum postcode load failed"));
      document.head.appendChild(script);
    }).catch((e) => {
      // allow retry next time
      daumPostcodeLoadPromiseRef.current = null;
      throw e;
    });

    return daumPostcodeLoadPromiseRef.current;
  }, []);

  const openDaumPostcode = useCallback(async () => {
    await ensureDaumPostcodeLoaded();
    return await new Promise<{ address: string; zonecode: string }>((resolve) => {
      const Postcode = (window as any)?.daum?.Postcode;
      if (!Postcode) return resolve({ address: "", zonecode: "" });
      new Postcode({
        oncomplete: (data: any) => {
          const addr = data?.roadAddress || data?.jibunAddress || data?.address || "";
          const zonecode = data?.zonecode || "";
          resolve({ address: String(addr || ""), zonecode: String(zonecode || "") });
        },
        onclose: () => resolve({ address: "", zonecode: "" }),
      }).open();
    });
  }, [ensureDaumPostcodeLoaded]);

  const deleteSelectedPosters = useCallback(async () => {
    if (user?.usr_role !== "admin") return;
    if (!selectedPosterIds.length) return alert("삭제할 포스터를 선택해주세요.");
    const ok = window.confirm(`선택한 포스터 ${selectedPosterIds.length}개를 삭제할까요?`);
    if (!ok) return;

    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/poster/deletePosterBase`, {
        poster_id: selectedPosterIds,
        userId: user.index,
      });
      setSelectedPosterIds([]);
      await fetchData();
      alert("삭제되었습니다.");
    } catch (e) {
      console.log(e);
      alert("삭제에 실패했습니다.");
    }
  }, [fetchData, selectedPosterIds, user]);

  useEffect(() => {
    const loadData = async () => {
      await fetchData();
    };

    loadData();
  }, [fetchData]);

  useEffect(() => {    
    if (user?.center_id) {
      getCenterInfo();
    }
  }, [user]);

  return (
    <div className="p-3 sm:p-10">
      {isCenterPopupOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsCenterPopupOpen(false)}
          />
          <div className="relative z-10 w-[min(92vw,560px)] rounded-xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold">센터 정보 입력</div>
              <button
                type="button"
                className="rounded-lg px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => setIsCenterPopupOpen(false)}
              >
                닫기
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <div className="text-sm font-semibold text-gray-800">주소</div>
                <div className="mt-1 flex gap-2">
                  <input
                    type="text"
                    className="w-full rounded border border-gray-300 bg-gray-100 p-2 text-sm text-gray-700"
                    value={popupAddress}
                    disabled
                    readOnly
                  />
                  <button
                    type="button"
                    className="shrink-0 rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700"
                    onClick={async () => {
                      try {
                        const { address, zonecode } = await openDaumPostcode();
                        if (!address || !address.trim()) return;
                        setPopupAddress(address.trim());
                        setPopupZipcode(String(zonecode || "").trim());
                        setCenterInfo((prev: any) => ({
                          ...(prev || {}),
                          address: address.trim(),
                          zipcode: String(zonecode || "").trim(),
                        }));
                      } catch (e) {
                        console.log(e);
                      }
                    }}
                  >
                    입력
                  </button>
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-gray-800">상세주소</div>
                <input
                  type="text"
                  className="mt-1 w-full rounded border border-gray-300 bg-white p-2 text-sm"
                  value={popupAddressDetail}
                  onChange={(e) => setPopupAddressDetail(e.target.value)}
                  placeholder="상세주소 입력"
                />
              </div>

              <div>
                <div className="text-sm font-semibold text-gray-800">매장 전화번호</div>
                <input
                  type="text"
                  className="mt-1 w-full rounded border border-gray-300 bg-white p-2 text-sm"
                  value={popupPhone}
                  onChange={(e) => setPopupPhone(e.target.value)}
                  placeholder="예) 02-1234-5678"
                />
              </div>

              <div>
                <div className="text-sm font-semibold text-gray-800">우편번호</div>
                <input
                  type="text"
                  className="mt-1 w-full rounded border border-gray-300 bg-gray-100 p-2 text-sm text-gray-700"
                  value={popupZipcode}
                  disabled
                  readOnly
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                onClick={() => setIsCenterPopupOpen(false)}
              >
                취소
              </button>
              <button
                type="button"
                className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-bold text-white hover:bg-slate-900"
                onClick={async () => {
                  if (!popupAddress || !popupAddress.trim()) {
                    alert("주소를 입력해주세요.");
                    return;
                  }
                  if (!popupAddressDetail || !popupAddressDetail.trim()) {
                    alert("상세주소를 입력해주세요.");
                    return;
                  }
                  if (popupPhone && popupPhone.trim() && !popupPhone.includes("-")) {
                    alert("매장 전화번호에 하이픈(-)을 포함해주세요.");
                    return;
                  }
                  try {
                    await axios.patch(`${process.env.REACT_APP_API_URL}/center/address`, {
                      center_id: user?.center_id,
                      address: popupAddress.trim(),
                      address_detail: popupAddressDetail.trim(),
                      zip_code: String(popupZipcode || "").trim(),
                      phone_number: popupPhone.trim(),
                    });
                    setCenterInfo((prev: any) => ({
                      ...(prev || {}),
                      address: popupAddress.trim(),
                      address_detail: popupAddressDetail.trim(),
                      zip_code: String(popupZipcode || "").trim(),
                      phone_number: popupPhone.trim(),
                    }));
                  } catch (e) {
                    console.log(e);
                    alert("주소 저장에 실패했습니다.");
                    return;
                  }
                  setIsCenterPopupOpen(false);
                  if (pendingPosterId != null) {
                    navigate(`/poster/detail/${pendingPosterId}`);
                  }
                }}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex justify-between">
        <span className="font-bold text-xl">포스터 관리</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="block rounded-2xl px-4 py-2 text-center text-sm text-white font-extrabold shadow-sm hover:opacity-80"
            style={{ backgroundColor: "#5F9EA0" }}
            onClick={() => {
              if (!centerInfo) {
                alert("센터 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
                return;
              }
              setPendingPosterId(null);
              setPopupAddress(String(centerInfo?.address || ""));
              setPopupZipcode(String(centerInfo?.zipcode || centerInfo?.zip_code || ""));
              setPopupAddressDetail(
                String(centerInfo?.address_detail || centerInfo?.addressDetail || "")
              );
              setPopupPhone(
                String(
                  centerInfo?.phone_number ||
                    centerInfo?.phone ||
                    centerInfo?.tel ||
                    centerInfo?.center_tel ||
                    ""
                )
              );
              setIsCenterPopupOpen(true);
            }}
          >
            {!String(centerInfo?.address || "").trim() &&
            !String(
              centerInfo?.phone_number ||
                centerInfo?.phone ||
                centerInfo?.tel ||
                centerInfo?.center_tel ||
                ""
            ).trim()
              ? "센터 정보 등록"
              : "센터 정보 변경"}
          </button>
          {user?.usr_role === "admin" ? (
            <>
              <button
                className="block rounded-2xl px-4 py-2 text-center text-sm text-white font-extrabold shadow-sm hover:text-white hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#C4302B' }}
                disabled={!selectedPosterIds.length}
                onClick={deleteSelectedPosters}
              >
                삭제
              </button>
              <button
                className="block rounded-2xl px-4 py-2 text-center text-sm  text-white font-extrabold shadow-sm hover:text-white hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 hover:opacity-80"
                style={{ backgroundColor: '#92A2CE' }}
                onClick={() => {
                  navigate("/poster/register");
                }}
              >
                등록
              </button>
            </>
          ) : null}
        </div>
      </div>
      <div className="text-sm mt-4 mb-2 flex flex-row justify-between">
        <p className="font-bold">총 {posterList.length}개</p>
        <div>
          <p className="text-base">센터 정보를 등록해야 포스터를 다운 받을 수 있습니다.</p>
          <p className="text-base">목록을 클릭하여 상세 화면으로 이동 후 포스터를 다운로드 해주세요.</p>
        </div>
      </div>
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left rtl:text-right text-gray-500">
          <thead className="text-xs text-white font-bold uppercase bg-custom-C4C4C4">
            <tr>
              {user?.usr_role === "admin" ? (
                <th
                  scope="col"
                  className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
                >
                  <input
                    type="checkbox"
                    aria-label="전체 선택"
                    className="h-4 w-4"
                    disabled={!posterList.length}
                    checked={isAllSelected(allPosterIds, selectedPosterIds)}
                    onChange={(e) => {
                      setSelectedPosterIds(toggleSelectAll(allPosterIds, e.target.checked));
                    }}
                  />
                </th>
              ) : null}
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                번호
              </th>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                유형
              </th>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                제목
              </th>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                다운로드 기간
              </th>
              <th
                scope="col"
                className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base"
              >
                등록일
              </th>
            </tr>
          </thead>
          <tbody>
            {!posterList.length ? (
              <tr className="text-center py-10 text-gray-500">
                <td colSpan={user?.usr_role === "admin" ? 6 : 5} className="p-4">
                  등록된 포스터가 없습니다.
                </td>
              </tr>
            ) : (
              <>
                {currentPosters.map((ele, index) => (
                  <tr
                    key={ele.poster_id}
                    className={`bg-white border-b hover:bg-gray-50 cursor-pointer`}
                    onClick={async () => {
                      const hasAddress = !!String(centerInfo?.address || "").trim();
                      const hasPhone = !!String(
                        centerInfo?.phone_number ||
                          centerInfo?.phone ||
                          centerInfo?.tel ||
                          centerInfo?.center_tel ||
                          ""
                      ).trim();
                      if (hasAddress && hasPhone) {
                        navigate(`/poster/detail/${ele.poster_id}`);
                        return;
                      }
                      setPendingPosterId(ele.poster_id);
                      setPopupAddress(String(centerInfo?.address || ""));
                      setPopupZipcode(String(centerInfo?.zipcode || centerInfo?.zip_code || ""));
                      setPopupAddressDetail(String(centerInfo?.address_detail || centerInfo?.addressDetail || ""));
                      setPopupPhone(
                        String(
                          centerInfo?.phone_number ||
                            centerInfo?.phone ||
                            centerInfo?.tel ||
                            centerInfo?.center_tel ||
                            ""
                        )
                      );
                      setIsCenterPopupOpen(true);
                    }}
                  >
                    {user?.usr_role === "admin" ? (
                      <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                        <input
                          type="checkbox"
                          aria-label="선택"
                          className="h-4 w-4"
                          checked={selectedPosterIds.includes(ele.poster_id)}
                          onChange={(e) => {
                            setSelectedPosterIds((prev) =>
                              toggleSelectOne(prev, ele.poster_id, e.target.checked)
                            );
                          }}
                          onClick={(e) => e.stopPropagation()}
                          onDoubleClick={(e) => e.stopPropagation()}
                        />
                      </td>
                    ) : null}
                    <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                      {posterList.length -
                        (((pagination.currentPage - 1) * itemsPerPage) + index)}
                    </td>
                    <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                      {ele.poster_image_type === "WEB" ? "웹용" : ele.poster_image_type === "PRINT" ? "인쇄용" : "전체(웹용, 인쇄용)"}
                    </td>
                    <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                      {ele.title}
                    </td>
                    <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                      {String(ele.end_dt ?? "").startsWith("2999") ? "무기한" : ele.start_dt + " ~ " + ele.end_dt}
                    </td>
                    <td className="px-1 sm:px-2 lg:px-6 py-4 text-black text-center text-base">
                      {ele.reg_dt}
                    </td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* 공통 페이지네이션 */}
      {posterList.length > 0 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          onPageChange={pagination.handlePageChange}
        />
      )}
    </div>
  );
};

export default PosterList;
