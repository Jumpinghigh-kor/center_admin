import React, { useEffect, useState } from "react";
import axios from "axios";
import { useUserStore } from "../../store/store";

interface ExistingImageItem {
  imageUrl: string;
  fileName: string;
  badge?: string;
  orderSeq?: number;
  productAppImgId?: number; // 혹시 케멀 케이스로 내려오는 경우 대비
}

interface ProductImageUploaderProps {
  label: string;
  multiple: boolean;
  accept?: string;
  maxFiles: number;
  maxSizeMB: number;
  files: File[];
  previews: string[];
  orders: number[];
  setFiles: (files: File[]) => void;
  setPreviews: (previews: string[]) => void;
  setOrders: (orders: number[]) => void;
  disabledAdd?: boolean;
  existingImages?: ExistingImageItem[];
  orderBadgePrefix?: string;
  onExistingOrderChange?: (index: number, newOrder: number) => void;
  onExistingRemove?: (index: number) => void;
}

const ProductImageUploader: React.FC<ProductImageUploaderProps> = ({
  label,
  multiple,
  accept = ".png,.jpg,.jpeg",
  maxFiles,
  maxSizeMB,
  files,
  previews,
  orders,
  setFiles,
  setPreviews,
  setOrders,
  disabledAdd,
  existingImages,
  orderBadgePrefix,
  onExistingOrderChange,
  onExistingRemove,
}) => {
  const [existingOrders, setExistingOrders] = useState<number[]>([]);
  const [existingLocal, setExistingLocal] = useState<ExistingImageItem[]>([]);
  const [newCombinedOrders, setNewCombinedOrders] = useState<number[]>([]);
  const [removedKeys, setRemovedKeys] = useState<Set<string>>(new Set());
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    if (existingImages && existingImages.length > 0) {
      // 부모에서 동일한 이미지 집합(순서만 다름)을 다시 내려줘도 로컬 정렬을 유지
      const filteredFromRemoved = existingImages.filter((x) => !removedKeys.has(x.imageUrl || x.fileName));
      const propKeys = filteredFromRemoved.map((x) => x.imageUrl || x.fileName);
      const localKeys = existingLocal.map((x) => x.imageUrl || x.fileName);
      const isSameSet =
        propKeys.length === localKeys.length &&
        propKeys.every((k) => localKeys.includes(k));

      if (!isSameSet || existingLocal.length === 0) {
        setExistingLocal(filteredFromRemoved);
        const initial = filteredFromRemoved.map((img, idx) => img.orderSeq ?? idx + 1);
        setExistingOrders(initial);
      }
    } else {
      setExistingLocal([]);
      setExistingOrders([]);
    }
  }, [existingImages, removedKeys]);

  const onChangeFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const incoming = Array.from(e.target.files);
    const existingCount = existingLocal ? existingLocal.length : 0;

    // 기존 이미지가 이미 최대치면 업로드 차단
    if (existingCount >= maxFiles) {
      alert(
        multiple
          ? `대표 이미지는 최대 ${maxFiles}장입니다. 기존 이미지를 삭제한 후 등록해 주세요.`
          : `상세 이미지는 최대 ${maxFiles}장입니다. 기존 이미지를 삭제한 후 등록해 주세요.`
      );
      e.target.value = "";
      return;
    }

    // 제한: 최대 개수
    if (existingCount + previews.length + incoming.length > maxFiles) {
      alert(
        multiple
          ? `대표 이미지는 최대 ${maxFiles}장입니다. 기존 이미지를 삭제하거나 업로드 수를 줄여주세요.`
          : `상세 이미지는 최대 ${maxFiles}장입니다. 기존 이미지를 삭제하거나 업로드 수를 줄여주세요.`
      );
      return;
    }

    // 검증: 타입/사이즈
    const invalid = incoming.filter((file) => {
      const isTypeOk = ["image/png", "image/jpeg"].includes(file.type);
      const isSizeOk = file.size <= maxSizeMB * 1024 * 1024;
      return !isTypeOk || !isSizeOk;
    });
    if (invalid.length > 0) {
      alert(`PNG 또는 JPG만 가능, 각 파일은 ${maxSizeMB}MB 이하이어야 합니다.`);
      return;
    }

    const nextFiles = [...files, ...incoming];
    const nextPreviews = [...previews];
    const nextOrders = [...orders];
    incoming.forEach(() => {
      nextPreviews.push("");
      nextOrders.push(nextOrders.length + 1);
    });

    // 미리보기 URL 생성은 별도로 push
    const createdUrls = incoming.map((f) => URL.createObjectURL(f));
    createdUrls.forEach((url) => {
      const idx = nextPreviews.findIndex((p) => p === "");
      nextPreviews[idx === -1 ? nextPreviews.length : idx] = url;
    });

    setFiles(nextFiles);
    setPreviews(nextPreviews);

    // 새 이미지의 '전체 기준' 노출 순서를 기본값으로 설정(기존개수 다음부터)
    setNewCombinedOrders((prev) => {
      const base = existingLocal.length;
      const result = [...prev];
      for (let i = 0; i < incoming.length; i += 1) {
        result.push(base + previews.length + i + 1);
      }
      // 부모로 전달: 대표(다중)면 결합 순서, 상세(단일)면 항상 1
      if (multiple) {
        setOrders(result);
      } else {
        setOrders(Array(result.length).fill(1));
      }
      return result;
    });
  };

  const removeAt = (index: number) => {
    const nextFiles = [...files];
    const nextPreviews = [...previews];
    const nextOrders = [...orders];

    const removedPreview = nextPreviews[index];
    if (removedPreview) URL.revokeObjectURL(removedPreview);

    nextFiles.splice(index, 1);
    nextPreviews.splice(index, 1);
    nextOrders.splice(index, 1);

    setFiles(nextFiles);
    setPreviews(nextPreviews);
    setNewCombinedOrders((prev) => {
      const totalExisting = existingLocal.length;
      const removedCombined = prev[index] ?? (totalExisting + index + 1);
      const next = [...prev];
      next.splice(index, 1);
      for (let i = 0; i < next.length; i += 1) {
        if ((next[i] ?? (totalExisting + (i >= index ? i + 1 : i) + 1)) > removedCombined) {
          next[i] = ((next[i] ?? (totalExisting + (i >= index ? i + 1 : i) + 1)) - 1);
        }
      }
      // 부모 orders 동기화: 대표(다중)면 결합 순서, 상세(단일)면 빈 배열
      if (multiple) {
        setOrders(next);
      } else {
        setOrders([]);
      }
      return next;
    });
  };

  const changeOrder = (index: number, newOrder: number) => {
    if (newOrder < 1 || newOrder > previews.length) return;
    const nextOrders = [...orders];
    const oldOrder = nextOrders[index];
    nextOrders[index] = newOrder;

    // 다른 항목들 보정
    for (let i = 0; i < nextOrders.length; i += 1) {
      if (i === index) continue;
      if (oldOrder < newOrder && nextOrders[i] > oldOrder && nextOrders[i] <= newOrder) {
        nextOrders[i] = nextOrders[i] - 1;
      } else if (oldOrder > newOrder && nextOrders[i] < oldOrder && nextOrders[i] >= newOrder) {
        nextOrders[i] = nextOrders[i] + 1;
      }
    }

    setOrders(nextOrders);
  };

  return (
    <div>
      <div className="p-4 border border-gray-200">
        <input
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={onChangeFiles}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={!!disabledAdd}
        />
        {existingImages && existingImages.length > 0 ? (
          <div className="mt-4">
            {(() => {
              const total = existingLocal.length + previews.length;
              const normalizedNewCombined = Array.from({ length: previews.length }, (_, i) => newCombinedOrders[i] ?? (existingLocal.length + i + 1));
              const used = new Set<number>(normalizedNewCombined);
              const remaining: number[] = [];
              for (let p = 1; p <= total; p += 1) {
                if (!used.has(p)) remaining.push(p);
              }
              const existingPairs = existingLocal.map((_, i) => ({ idx: i, order: existingOrders[i] ?? (i + 1) }));
              existingPairs.sort((a, b) => a.order - b.order);
              const existingCombined: number[] = new Array(existingLocal.length);
              for (let i = 0; i < existingPairs.length; i += 1) {
                existingCombined[existingPairs[i].idx] = remaining[i] ?? (i + 1);
              }

              return existingLocal.map((img, idx) => (
                <div key={img.imageUrl || img.fileName || String(idx)} className="mt-4 inline-block mr-4 mb-4">
                  <div className="relative border border-gray-300 rounded-lg p-3 bg-gray-50 overflow-visible">
                  <img src={img.imageUrl} alt={img.fileName} className="w-32 h-32 object-cover rounded-md" />
                    <button
                      type="button"
                      onClick={async () => {
                        const confirmed = window.confirm("해당 이미지는 삭제되며, 복구는 불가능합니다.\n진행하시겠습니까?");
                        if (!confirmed) return;

                        // 삭제될 기존 이미지의 전체 기준 순서 계산
                        const total = existingLocal.length + previews.length;
                        const normalizedNewCombined = Array.from({ length: previews.length }, (_, i) => newCombinedOrders[i] ?? (existingLocal.length + i + 1));
                        const used = new Set<number>(normalizedNewCombined);
                        const remaining: number[] = [];
                        for (let p = 1; p <= total; p += 1) {
                          if (!used.has(p)) remaining.push(p);
                        }
                        const existingPairs = existingLocal.map((_, i) => ({ idx: i, order: existingOrders[i] ?? (i + 1) }));
                        existingPairs.sort((a, b) => a.order - b.order);
                        const existingCombined: number[] = new Array(existingLocal.length);
                        for (let i = 0; i < existingPairs.length; i += 1) {
                          existingCombined[existingPairs[i].idx] = remaining[i] ?? (i + 1);
                        }
                        const deletedCombined = existingCombined[idx] ?? 1;

                        // API 호출 (id가 있을 때만)
                        const imgId = img.productAppImgId;
                        
                        if (imgId) {
                          try {
                            await axios.post(`${process.env.REACT_APP_API_URL}/app/productApp/deleteProductImgApp`, {
                              product_app_img_id: imgId,
                              user_id: user?.index,
                            });
                          } catch (error) {
                            console.error("이미지 삭제 오류:", error);
                            alert("이미지 삭제 중 오류가 발생했습니다.");
                            return;
                          }
                        }

                        if (onExistingRemove) onExistingRemove(idx);
                        setExistingLocal((prev) => prev.filter((_, i) => i !== idx));
                        setExistingOrders((prev) => prev.filter((_, i) => i !== idx).map((_, i) => i + 1));
                        const key = img.imageUrl || img.fileName;
                        if (key) {
                          setRemovedKeys((prev) => {
                            const next = new Set(prev);
                            next.add(key);
                            return next;
                          });
                        }

                        // 새 이미지들의 전체 순서도 삭제된 지점 이후는 1씩 당김
                        setNewCombinedOrders((prev) => prev.map((v, i) => {
                          const val = v ?? (existingLocal.length + i + 1);
                          return val > deletedCombined ? (val - 1) : val;
                        }));
                      }}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 z-50"
                    >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                    {orderBadgePrefix && multiple ? (
                      <div className="absolute top-0 left-0 bg-green-500 text-white px-2 py-1 text-xs rounded-br">
                        {orderBadgePrefix} {existingCombined[idx]}
                      </div>
                    ) : null}
                  {img.badge ? (
                    <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 text-xs rounded">
                      {img.badge}
                    </div>
                  ) : null}
                  <div className="mt-2 text-xs text-gray-600 text-center">{img.fileName}</div>
                  {multiple && existingLocal.length > 0 ? (
                    <div className="mt-2 flex items-center justify-center">
                      <span className="mr-2 text-xs text-gray-700">노출 순서</span>
                      <select
                        value={existingCombined[idx]}
                        onChange={(e) => {
                          const total = existingLocal.length + previews.length;
                          const targetCombined = Math.max(1, Math.min(total, parseInt(e.target.value, 10)));
                          const oldCombined = existingCombined[idx];
                          if (!Number.isFinite(targetCombined) || targetCombined === oldCombined) return;

                          // 1) 새 이미지들의 전체 순서를 이동시켜 targetCombined 자리를 비움
                          const normalizedNew = Array.from({ length: previews.length }, (_, i) => newCombinedOrders[i] ?? (existingLocal.length + i + 1));
                          const nextNormalizedNew = (() => {
                            const next = [...normalizedNew];
                            for (let i = 0; i < next.length; i += 1) {
                              const order = next[i];
                              if (oldCombined < targetCombined && order > oldCombined && order <= targetCombined) {
                                next[i] = order - 1;
                              } else if (oldCombined > targetCombined && order < oldCombined && order >= targetCombined) {
                                next[i] = order + 1;
                              }
                            }
                            return next;
                          })();
                          setNewCombinedOrders(() => nextNormalizedNew);

                          // 2) 남은 번호(=기존 이미지가 차지할 번호들) 목록에서 targetCombined의 순위를 구해 기존 내부 순서 조정
                          const remaining: number[] = [];
                          for (let p = 1; p <= total; p += 1) {
                            if (!nextNormalizedNew.includes(p)) remaining.push(p);
                          }
                          const nextRankInExisting = Math.max(1, remaining.indexOf(targetCombined) + 1);

                          setExistingOrders((prev) => {
                            const length = existingLocal.length;
                            const next = [...prev];
                            const oldRank = next[idx] ?? (idx + 1);
                            if (nextRankInExisting === oldRank) return prev;
                            next[idx] = nextRankInExisting;

                            for (let i = 0; i < next.length; i += 1) {
                              if (i === idx) continue;
                              const order = next[i] ?? (i + 1);
                              if (oldRank < nextRankInExisting && order > oldRank && order <= nextRankInExisting) {
                                next[i] = order - 1;
                              } else if (oldRank > nextRankInExisting && order < oldRank && order >= nextRankInExisting) {
                                next[i] = order + 1;
                              }
                            }

                            // 기존 이미지 배열 자체를 next 순서 기준으로 재정렬
                            setExistingLocal((prevLocal) => {
                              const zipped = prevLocal.map((item, i) => ({ item, order: next[i] ?? (i + 1) }));
                              zipped.sort((a, b) => a.order - b.order);
                              return zipped.map((z) => z.item);
                            });

                            // 정규화 1..N
                            return Array.from({ length }, (_, i) => i + 1);
                          });
                          if (onExistingOrderChange) {
                            onExistingOrderChange(idx, targetCombined);
                          }
                        }}
                        className="p-1 border border-gray-300 rounded text-xs"
                      >
                        {Array.from({ length: existingLocal.length + previews.length }, (_, i) => (
                          <option key={i} value={i + 1}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}
                </div>
              </div>
              ));
            })()}
          </div>
        ) : null}

        {previews.length > 0 && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative border p-2 rounded">
                <img src={preview} alt={`${label} ${index + 1}`} className="max-w-full h-40 object-contain rounded" />
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                {multiple ? (
                  <div className="flex items-center mt-2">
                    <span className="mr-2 text-sm">노출 순서:</span>
                    <select
                      value={newCombinedOrders[index] ?? (existingLocal.length + (orders[index] || 0))}
                      onChange={(e) => {
                        const total = existingLocal.length + previews.length;
                        const nextCombined = Math.max(1, Math.min(total, parseInt(e.target.value, 10)));
                        setNewCombinedOrders((prev) => {
                          const oldCombined = prev[index] ?? (existingLocal.length + index + 1);
                          if (oldCombined === nextCombined) return prev;
                          const next = [...prev];
                          next[index] = nextCombined;
                          for (let i = 0; i < next.length; i += 1) {
                            if (i === index) continue;
                            const order = next[i] ?? (existingLocal.length + i + 1);
                            if (oldCombined < nextCombined && order > oldCombined && order <= nextCombined) {
                              next[i] = order - 1;
                            } else if (oldCombined > nextCombined && order < oldCombined && order >= nextCombined) {
                              next[i] = order + 1;
                            }
                          }
                          // 부모 orders에 결합 순서를 그대로 전달
                          setOrders(next);
                          return next;
                        });
                      }}
                      className="p-1 border border-gray-300 rounded text-sm"
                    >
                      {Array.from({ length: existingLocal.length + previews.length }, (_, i) => (
                        <option key={i} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
                {orderBadgePrefix && multiple ? (
                  <div className="absolute top-0 left-0 bg-green-500 text-white px-2 py-1 text-xs rounded-br">
                    {orderBadgePrefix} {newCombinedOrders[index] ?? (existingLocal.length + (orders[index] || 0))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductImageUploader;


