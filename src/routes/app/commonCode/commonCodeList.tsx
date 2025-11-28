import React, { useState, useEffect } from "react";
import axios from "axios";
import { useUserStore } from "../../../store/store";
import { useCheckbox } from "../../../hooks/useCheckbox";

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

interface GroupCodeApp {
  group_code: string;
  group_code_name: string;
  order_seq: number;
  use_yn: string;
}

const CommonCodeList: React.FC = () => {
  const [commonCodeList, setCommonCodeList] = useState<CommonCodeApp[]>([]);
  const [groupCodeList, setGroupCodeList] = useState<GroupCodeApp[]>([]);
  const [selectedGroupCode, setSelectedGroupCode] = useState<string | null>(null);
  const [isAddingGroup, setIsAddingGroup] = useState<boolean>(false);
  const [newGroup, setNewGroup] = useState<{ group_code: string; group_code_name: string; order_seq: string }>({
    group_code: "",
    group_code_name: "",
    order_seq: "",
  });
  const [newGroupChecked, setNewGroupChecked] = useState<boolean>(false);
  const [isAddingCommon, setIsAddingCommon] = useState<boolean>(false);
  const [newCommon, setNewCommon] = useState<{ common_code: string; common_code_name: string; order_seq: string }>({
    common_code: "",
    common_code_name: "",
    order_seq: "",
  });
  const [newCommonChecked, setNewCommonChecked] = useState<boolean>(false);
  const user = useUserStore((state) => state.user);

  const {
    checkedItems: groupCheckedItems,
    allChecked: groupAllChecked,
    handleAllCheck: handleGroupAllCheck,
    handleIndividualCheck: handleGroupIndividualCheck,
    resetCheckedItems: resetGroupCheckedItems,
  } = useCheckbox(groupCodeList.length);

  const {
    checkedItems: commonCheckedItems,
    allChecked: commonAllChecked,
    handleAllCheck: handleCommonAllCheck,
    handleIndividualCheck: handleCommonIndividualCheck,
    resetCheckedItems: resetCommonCheckedItems,
  } = useCheckbox(commonCodeList.length);

  const selectCommonCodeList = async (group_code: string) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/common/selectCommonCodeList`,
        { group_code, screen: 'commonCodeList' }
      );
      
      setCommonCodeList(response.data.result);
    } catch (err) {
      console.error("공통코드 목록 로딩 오류:", err);
    } finally {
    }
  };

  const insertGroupCode = async () => {
    if (!newGroup.group_code || newGroup.group_code.trim() === "") {
      window.alert("그룹코드를 입력해 주세요.");
      return;
    }
    if (newGroup.group_code.trim().length > 50) {
      window.alert("그룹코드는 최대 50자까지 입력 가능합니다.");
      return;
    }
    if (!newGroup.group_code_name || newGroup.group_code_name.trim() === "") {
      window.alert("그룹코드명을 입력해 주세요.");
      return;
    }
    if (newGroup.order_seq === undefined || String(newGroup.order_seq).trim() === "") {
      window.alert("순서를 입력해 주세요.");
      return;
    }
    const normalized = newGroup.group_code.trim();
    const isDup = groupCodeList.some((g) => (g.group_code || "").trim() === normalized);
    if (isDup) {
      window.alert("이미 존재하는 그룹코드입니다.");
      return;
    }
    await axios.post(`${process.env.REACT_APP_API_URL}/app/common/insertGroupCode`, {
      group_code: newGroup.group_code,
      group_code_name: newGroup.group_code_name,
      order_seq: newGroup.order_seq || null,
      use_yn: "Y",
      userId: user?.index,
    });
    await selectGroupCodeList();
    setIsAddingGroup(false);
    setNewGroup({ group_code: "", group_code_name: "", order_seq: "" });
    setNewGroupChecked(false);
  };

  const insertCommonCode = async () => {
    if (!selectedGroupCode) {
      window.alert("그룹코드를 먼저 선택해 주세요.");
      return;
    }
    if (!newCommon.common_code || newCommon.common_code.trim() === "") {
      window.alert("공통코드를 입력해 주세요.");
      return;
    }
    if (newCommon.common_code.trim().length > 50) {
      window.alert("공통코드는 최대 50자까지 입력 가능합니다.");
      return;
    }
    if (!newCommon.common_code_name || newCommon.common_code_name.trim() === "") {
      window.alert("공통코드명을 입력해 주세요.");
      return;
    }
    if (newCommon.order_seq === undefined || String(newCommon.order_seq).trim() === "") {
      window.alert("순서를 입력해 주세요.");
      return;
    }
    const normalized = newCommon.common_code.trim();
    const isDup = commonCodeList.some((c) => (c.common_code || "").trim() === normalized);
    if (isDup) {
      window.alert("이미 존재하는 공통코드입니다.");
      return;
    }
    await axios.post(`${process.env.REACT_APP_API_URL}/app/common/insertCommonCode`, {
      common_code: newCommon.common_code,
      group_code: selectedGroupCode,
      common_code_name: newCommon.common_code_name,
      order_seq: newCommon.order_seq || null,
      use_yn: "Y",
      userId: user?.index,
    });
    await selectCommonCodeList(selectedGroupCode);
    setIsAddingCommon(false);
    setNewCommon({ common_code: "", common_code_name: "", order_seq: "" });
    setNewCommonChecked(false);
  };

  const selectGroupCodeList = async () => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/common/selectGroupCodeList`,
      );
      
      setGroupCodeList(response.data.result);
    } catch (err) {
      console.error("그룹코드 목록 로딩 오류:", err);
    } finally {
    }
  };

  const updateUseYn = async (group_code: string | null, common_code: string | null, use_yn: string) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/app/common/updateUseYn`,
        { group_code, common_code, use_yn, userId: user?.index }
      );
      
    } catch (err) {
      console.error("그룹 코드 사용 여부 수정 오류:", err);
    } finally {
    }
  };

  useEffect(() => {
    if (user && user.index) {
      selectGroupCodeList();
    }
  }, [user]);

  const groupAnySelected = groupCheckedItems.some(Boolean);
  const commonAnySelected = commonCheckedItems.some(Boolean);

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6 pb-24">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">공통코드 관리</h2>
        </div>

        <div className="overflow-x-auto">
          <div className="flex gap-6 min-w-[960px]">
            <div className="w-1/2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-semibold mr-2">그룹코드 목록</h3>
                  <span className="text-xs text-gray-500">{groupCodeList.length}건</span>
                </div>
                <div>
                  {isAddingGroup && (
                    <button
                      className="text-white text-sm px-4 py-2 rounded-md mr-2"
                      style={{ backgroundColor: newGroupChecked ? '#FF746C' : '#D1D5DB', cursor: newGroupChecked ? 'pointer' : 'not-allowed' }}
                      disabled={!newGroupChecked}
                      onClick={() => {
                        if (!newGroupChecked) return;
                        setIsAddingGroup(false);
                        setNewGroup({ group_code: "", group_code_name: "", order_seq: "" });
                        setNewGroupChecked(false);
                      }}
                    >
                      행 제거
                    </button>
                  )}
                  <button
                    className="text-white text-sm px-4 py-2 rounded-md"
                    style={{ backgroundColor: isAddingGroup ? '#D1D5DB' : '#03AFDE', cursor: isAddingGroup ? 'not-allowed' : 'pointer' }}
                    disabled={isAddingGroup}
                    onClick={() => {
                      setIsAddingGroup(true);
                      setNewGroup({ group_code: "", group_code_name: "", order_seq: "" });
                      setNewGroupChecked(false);
                    }}
                  >
                    행 생성
                  </button>
                  <button
                    className="text-white text-sm px-4 py-2 rounded-md ml-2"
                    style={{ backgroundColor: groupAnySelected ? '#FF746C' : '#D1D5DB', cursor: groupAnySelected ? 'pointer' : 'not-allowed' }}
                    disabled={!groupAnySelected}
                    onClick={async () => {
                      if (!groupAnySelected) return;
                      if (!window.confirm('선택된 그룹코드를 미사용으로 변경하시겠습니까?')) return;
                      const selectedCodes = groupCodeList
                        .map((g, i) => (groupCheckedItems[i] ? g.group_code : null))
                        .filter((v): v is string => !!v);
                      await Promise.all(selectedCodes.map((code) => updateUseYn(code, null, 'N')));
                      await selectGroupCodeList();
                      if (selectedGroupCode) {
                        await selectCommonCodeList(selectedGroupCode);
                      }
                      resetGroupCheckedItems();
                    }}
                  >
                    미사용
                  </button>
                </div>
              </div>
              <div className="max-h-[55vh] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200 border rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-10">
                        <input
                          type="checkbox"
                          checked={groupAllChecked}
                          onChange={(e) => handleGroupAllCheck(e.target.checked)}
                        />
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">그룹코드</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">그룹코드명</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">순서</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">사용여부</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">동작</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {groupCodeList.length === 0 && !isAddingGroup ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-6 text-center text-sm text-gray-400">
                          데이터가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      <>
                        {isAddingGroup && (
                          <tr className="bg-white">
                            <td className="px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={newGroupChecked}
                                onChange={(e) => setNewGroupChecked(e.target.checked)}
                                onClick={(ev) => ev.stopPropagation()}
                              />
                            </td>
                            <td className="px-3 py-2 text-sm">
                              <input
                                className="w-40 border rounded px-2 py-1"
                                type="text"
                                maxLength={50}
                                value={newGroup.group_code}
                                onChange={(ev) => setNewGroup((prev) => ({ ...prev, group_code: ev.target.value }))}
                              />
                            </td>
                            <td className="px-3 py-2 text-sm">
                              <input
                                className="w-56 border rounded px-2 py-1"
                                type="text"
                                value={newGroup.group_code_name}
                                onChange={(ev) => setNewGroup((prev) => ({ ...prev, group_code_name: ev.target.value }))}
                              />
                            </td>
                            <td className="px-3 py-2 text-sm text-center">
                              <input
                                className="w-20 border rounded px-2 py-1 text-center"
                                type="number"
                                value={newGroup.order_seq}
                                onChange={(ev) => setNewGroup((prev) => ({ ...prev, order_seq: ev.target.value }))}
                              />
                            </td>
                            <td className="px-3 py-2 text-sm text-center">사용</td>
                            <td className="px-3 py-2 text-sm text-center">
                              <button
                                style={{ backgroundColor: '#FFC067' }}
                                className="text-white text-xs px-2 py-1 rounded"
                                onClick={(ev) => { ev.stopPropagation(); insertGroupCode(); }}
                              >
                                추가
                              </button>
                            </td>
                          </tr>
                        )}
                        {groupCodeList.map((e, idx) => (
                        <tr
                          key={e.group_code}
                          className={`${selectedGroupCode === e.group_code ? "bg-gray-100" : "hover:bg-gray-50"} cursor-pointer`}
                          onClick={() => { setSelectedGroupCode(e.group_code); selectCommonCodeList(e.group_code); }}
                        >
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={groupCheckedItems[idx] || false}
                              onChange={(ev) => handleGroupIndividualCheck(idx, ev.target.checked)}
                              onClick={(ev) => ev.stopPropagation()}
                            />
                          </td>
                          <td className={`px-3 py-2 text-sm ${selectedGroupCode === e.group_code ? "text-gray-900 font-semibold" : "text-gray-700"}`}>{e.group_code}</td>
                          <td className={`px-3 py-2 text-sm ${selectedGroupCode === e.group_code ? "text-gray-900 font-semibold" : "text-gray-700"}`}>{e.group_code_name}</td>
                          <td className="px-3 py-2 text-sm text-gray-700 text-center">{e.order_seq}</td>
                          <td className="px-3 py-2 text-sm text-gray-700 text-center">{e.use_yn === 'Y' ? '사용' : '미사용'}</td>
                          <td className="px-3 py-2 text-sm text-gray-700 text-center">
                            {e.use_yn !== 'Y' ? (
                              <button
                                style={{ backgroundColor: '#115272' }}
                                className="text-white text-xs px-2 py-1 rounded"
                                onClick={async (ev) => {
                                  ev.stopPropagation();
                                  if (!window.confirm('해당 그룹코드를 사용으로 변경하시겠습니까?')) return;
                                  await updateUseYn(e.group_code, null, 'Y');
                                  await selectGroupCodeList();
                                  if (selectedGroupCode) {
                                    await selectCommonCodeList(selectedGroupCode);
                                  }
                                }}
                              >
                                사용
                              </button>
                            ) : '-'}
                          </td>
                        </tr>
                        ))}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="w-1/2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-sm font-semibold mr-2">공통코드 목록</h3>
                  <span className="text-xs text-gray-500">{commonCodeList.length}건</span>
                </div>
                <div>
                  {isAddingCommon && (
                    <button
                      className="text-white text-sm px-4 py-2 rounded-md mr-2"
                      style={{ backgroundColor: newCommonChecked ? '#FF746C' : '#D1D5DB', cursor: newCommonChecked ? 'pointer' : 'not-allowed' }}
                      disabled={!newCommonChecked}
                      onClick={() => {
                        if (!newCommonChecked) return;
                        setIsAddingCommon(false);
                        setNewCommon({ common_code: "", common_code_name: "", order_seq: "" });
                        setNewCommonChecked(false);
                      }}
                    >행 제거</button>
                  )}
                  <button
                    className="text-white text-sm px-4 py-2 rounded-md"
                    style={{ backgroundColor: (!selectedGroupCode || isAddingCommon) ? '#D1D5DB' : '#03AFDE', cursor: (!selectedGroupCode || isAddingCommon) ? 'not-allowed' : 'pointer' }}
                    disabled={!selectedGroupCode || isAddingCommon}
                    onClick={() => {
                      if (!selectedGroupCode) return;
                      setIsAddingCommon(true);
                      setNewCommon({ common_code: "", common_code_name: "", order_seq: "" });
                      setNewCommonChecked(false);
                    }}
                  >행 생성</button>
                  <button
                    className="text-white text-sm px-4 py-2 rounded-md ml-2"
                    style={{ backgroundColor: commonAnySelected ? '#FF746C' : '#D1D5DB', cursor: commonAnySelected ? 'pointer' : 'not-allowed' }}
                    disabled={!commonAnySelected}
                    onClick={async () => {
                      if (!commonAnySelected || !selectedGroupCode) return;
                      if (!window.confirm('선택된 공통코드를 미사용으로 변경하시겠습니까?')) return;
                      const selectedCodes = commonCodeList
                        .map((c, i) => (commonCheckedItems[i] ? c.common_code : null))
                        .filter((v): v is string => !!v);
                      await Promise.all(selectedCodes.map((code) => updateUseYn(selectedGroupCode, code, 'N')));
                      await selectCommonCodeList(selectedGroupCode);
                      resetCommonCheckedItems();
                    }}
                  >
                    미사용
                  </button>
                </div>
              </div>
              <div className="max-h-[55vh] overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200 border rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 w-10">
                        <input
                          type="checkbox"
                          checked={commonAllChecked}
                          onChange={(e) => handleCommonAllCheck(e.target.checked)}
                        />
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">공통코드</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">공통코드명</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">순서</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">사용여부</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-500">동작</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {commonCodeList.length === 0 && !isAddingCommon ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-6 text-center text-sm text-gray-400">
                          그룹코드 목록을 누르면 해당 공통코드 목록이 조회됩니다.
                        </td>
                      </tr>
                    ) : (
                      <>
                        {isAddingCommon && (
                          <tr className="bg-white">
                            <td className="px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={newCommonChecked}
                                onChange={(e) => setNewCommonChecked(e.target.checked)}
                                onClick={(ev) => ev.stopPropagation()}
                              />
                            </td>
                            <td className="px-3 py-2 text-sm">
                              <input
                                className="w-40 border rounded px-2 py-1"
                                type="text"
                                maxLength={50}
                                value={newCommon.common_code}
                                onChange={(ev) => setNewCommon((prev) => ({ ...prev, common_code: ev.target.value }))}
                              />
                            </td>
                            <td className="px-3 py-2 text-sm">
                              <input
                                className="w-56 border rounded px-2 py-1"
                                type="text"
                                value={newCommon.common_code_name}
                                onChange={(ev) => setNewCommon((prev) => ({ ...prev, common_code_name: ev.target.value }))}
                              />
                            </td>
                            <td className="px-3 py-2 text-sm text-center">
                              <input
                                className="w-20 border rounded px-2 py-1 text-center"
                                type="number"
                                value={newCommon.order_seq}
                                onChange={(ev) => setNewCommon((prev) => ({ ...prev, order_seq: ev.target.value }))}
                              />
                            </td>
                            <td className="px-3 py-2 text-sm text-center">사용</td>
                            <td className="px-3 py-2 text-sm text-center">
                              <button
                                style={{ backgroundColor: '#FFC067' }}
                                className="text-white text-xs px-2 py-1 rounded"
                                onClick={(ev) => { ev.stopPropagation(); insertCommonCode(); }}
                              >
                                추가
                              </button>
                            </td>
                          </tr>
                        )}
                        {commonCodeList.map((e, idx) => (
                        <tr
                          key={e.common_code}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => handleCommonIndividualCheck(idx, !(commonCheckedItems[idx] ?? false))}
                        >
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={commonCheckedItems[idx] || false}
                              onChange={(ev) => handleCommonIndividualCheck(idx, ev.target.checked)}
                              onClick={(ev) => ev.stopPropagation()}
                            />
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-700">{e.common_code}</td>
                          <td className="px-3 py-2 text-sm text-gray-700">{e.common_code_name}</td>
                          <td className="px-3 py-2 text-sm text-gray-700 text-center">{e.order_seq}</td>
                          <td className="px-3 py-2 text-sm text-gray-700 text-center">{e.use_yn === 'Y' ? '사용' : '미사용'}</td>
                          <td className="px-3 py-2 text-sm text-gray-700 text-center">
                            {e.use_yn !== 'Y' ? (
                              <button
                                style={{ backgroundColor: '#115272' }}
                                className="text-white text-xs px-2 py-1 rounded"
                                onClick={async (ev) => {
                                  ev.stopPropagation();
                                  if (!selectedGroupCode) return;
                                  if (!window.confirm('해당 공통코드를 사용으로 변경하시겠습니까?')) return;
                                  await updateUseYn(selectedGroupCode, e.common_code, 'Y');
                                  await selectCommonCodeList(selectedGroupCode);
                                }}
                              >
                                사용
                              </button>
                            ) : null}
                          </td>
                        </tr>
                        ))}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CommonCodeList;
