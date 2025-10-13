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
      className="block rounded-2xl hover:opacity-80 mr-3 px-4 py-1 text-center text-sm text-white font-extrabold shadow-sm hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
      onClick={() => navigate("/members/membersOrderBulkRegister")}
      style={{ backgroundColor: '#03AFDE' }}
    >
      회원권 일괄등록
    </button>
    <button
      type="button"
      className="block rounded-2xl mr-3 hover:opacity-80 px-4 py-1 text-center text-sm text-white font-extrabold shadow-sm hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
      style={{ backgroundColor: '#00C49F' }}
      onClick={onAddClick}
    >
      회원추가
    </button>
    <button
      onClick={onEditClick}
      className={`cursor-pointer block rounded-2xl mr-3 hover:opacity-80 px-4 py-1 text-center text-sm text-white font-extrabold shadow-sm hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600`}
        disabled={!selectedMember}
        style={{ backgroundColor: !selectedMember ? '#ADB5BD' : '#82B2C0' }}
    >
      회원수정
    </button>
    <button
      onClick={onDeleteClick}
      className={`cursor-pointer block rounded-2xl px-4 py-1 hover:opacity-80 text-center text-sm text-white font-extrabold shadow-sm hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600`}
      style={{ backgroundColor: !selectedMember ? '#ADB5BD' : '#FF746C' }}
      disabled={!selectedMember}
    >
      회원삭제
    </button>
  </div>
);
}

export default MemberActions;
