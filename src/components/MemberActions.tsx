import { Member } from "../utils/types";
import { useNavigate } from "react-router-dom";


// MemberActions.tsx
const MemberActions: React.FC<{
  selectedMember: Member | undefined;
  onAddClick: () => void;
  onEditClick: () => void;
  onDeleteClick: () => void;
}> = ({ selectedMember, onAddClick, onEditClick, onDeleteClick }) => {
  const navigate = useNavigate();
  
  return (

  <div className="flex justify-end">
    <button
      type="button"
      className="block rounded-2xl mr-3 bg-blue-600 px-4 py-1 text-center text-sm text-white font-extrabold shadow-sm hover:text-white hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
      onClick={() => navigate("/members/membersOrderBulkRegister")}
    >
      회원권 일괄등록
    </button>
    <button
      type="button"
      className="block rounded-2xl mr-3 bg-green-600 px-4 py-1 text-center text-sm text-white font-extrabold shadow-sm hover:text-white hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
      onClick={onAddClick}
    >
      회원추가
    </button>
    <button
      onClick={onEditClick}
      className={`${
        !selectedMember
          ? "bg-gray-400"
          : "bg-blue-600 hover:bg-blue-700 cursor-pointer"
      } block rounded-2xl mr-3 px-4 py-1 text-center text-sm text-white font-extrabold shadow-sm hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600`}
      disabled={!selectedMember}
    >
      회원수정
    </button>
    <button
      onClick={onDeleteClick}
      className={`${
        !selectedMember
          ? "bg-gray-400"
          : "bg-red-600 hover:bg-red-700 cursor-pointer"
      } block rounded-2xl px-4 py-1 text-center text-sm text-white font-extrabold shadow-sm hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600`}
      disabled={!selectedMember}
    >
      회원삭제
    </button>
  </div>
);
}

export default MemberActions;
