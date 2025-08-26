import { Member } from "../utils/types";

// MemberList.tsx
const MemberList: React.FC<{
  filteredMembers: Member[];
  onSelect: (member: Member) => void;
}> = ({ filteredMembers, onSelect }) => (
  <div className="memberList relative overflow-x-auto shadow-md sm:rounded-lg my-2 overflow-y-scroll">
    <table className="w-full text-sm text-left rtl:text-right text-gray-500">
      <thead className="text-xs text-white font-bold uppercase bg-custom-C4C4C4">
        <tr>
          <th className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base">
            NO
          </th>
          <th className="px-1 sm:px-2 lg:px-6 py-3 text-center text-base">
            이름
          </th>
        </tr>
      </thead>
      <tbody>
        {filteredMembers.map((member, index) => (
          <tr
            key={member.mem_id}
            className="bg-white border-b hover:bg-gray-50"
            onClick={() => onSelect(member)}
          >
            <th className="px-1 sm:px-2 lg:px-6 py-4 text-base font-medium text-center text-black whitespace-nowrap">
              {index + 1}
            </th>
            <td className="px-1 sm:px-2 lg:px-6 py-4 text-base text-black text-center">
              {member.mem_name}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default MemberList;
