import React, { useState } from "react";
import "./../styles/MembersCheckIn.css";
import logoImage from "./../images/logo-jumpinghigh.png";
import { useUserStore } from "../store/store";
import axios, { AxiosError, AxiosResponse } from "axios";
import MembershipSelectionModal from "../components/MembershipSelectionModal";

interface Message {
  status: boolean;
  message: string;
}

const MembersCheckIn: React.FC = () => {
  const user = useUserStore((state) => state.user);
  const [checkinNumber, setCheckinNumber] = useState<string>("");
  const [modal, setModal] = useState<boolean>(false);
  const [message, setMessage] = useState<Message>();
  const [selectionModal, setSelectionModal] = useState(false);
  const [memberships, setMemberships] = useState([]);
  const [name, setName] = useState("");

  // 출석 완료 알림음 재생 함수
  const playSuccessSound = () => {
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();

    // 첫 번째 음 (띵)
    const oscillator1 = audioContext.createOscillator();
    const gainNode1 = audioContext.createGain();

    oscillator1.connect(gainNode1);
    gainNode1.connect(audioContext.destination);

    oscillator1.frequency.setValueAtTime(800, audioContext.currentTime);
    gainNode1.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode1.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.3
    );

    oscillator1.start(audioContext.currentTime);
    oscillator1.stop(audioContext.currentTime + 0.3);

    // 두 번째 음 (똥)
    setTimeout(() => {
      const oscillator2 = audioContext.createOscillator();
      const gainNode2 = audioContext.createGain();

      oscillator2.connect(gainNode2);
      gainNode2.connect(audioContext.destination);

      oscillator2.frequency.setValueAtTime(600, audioContext.currentTime);
      gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode2.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.3
      );

      oscillator2.start(audioContext.currentTime);
      oscillator2.stop(audioContext.currentTime + 0.3);
    }, 200);
  };

  // 번호 추가
  const handleNumberClick = (num: string) => {
    if (checkinNumber.length > 10) {
      return;
    }
    setCheckinNumber((prev) => prev + num);
  };

  // 지우기 기능
  const handleDelete = () => {
    setCheckinNumber((prev) => prev.slice(0, -1));
  };

  // 출석 버튼 눌렀을 때
  const handleSubmit = async () => {
    if (checkinNumber.length < 4) {
      return alert("출입번호를 4자리 이상 입력해주세요.");
    }

    try {
      const result = await axios.post(
        `${process.env.REACT_APP_API_URL}/log/checkin`,
        [user, checkinNumber]
      );
      setSelectionModal(true);
      setMemberships(result.data.result);
      setName(result.data.mem_name);
    } catch (error) {
      const errorResponse = (error as AxiosError).response;
      if (errorResponse) {
        const data = (errorResponse as AxiosResponse).data;
        setMessage(data);
        setModal(true);
      }
    } finally {
      setCheckinNumber("");

      setTimeout(() => {
        setModal(false);
      }, 3000);
    }
  };

  return (
    <div className="phone-input-container">
      <p className="fullscreen-message">
        F11 키를 눌러 전체 화면 모드로 전환해 주세요.
      </p>
      <span className="font-bold text-3xl mb-3">{user.usr_name}</span>
      <span className="font-bold mb-4">
        출석 체크를 위해 출입 번호를 입력해 주세요.
      </span>
      <textarea
        className="phone-display"
        value={checkinNumber}
        readOnly
        rows={1}
      />
      <div className="number-pad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button key={num} onClick={() => handleNumberClick(num.toString())}>
            {num}
          </button>
        ))}
        <button onClick={handleDelete} className="delete-button">
          <svg
            className="delete-icon"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 14 10"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 5H1m0 0 4 4M1 5l4-4"
            />
          </svg>
        </button>
        <button onClick={() => handleNumberClick("0")}>0</button>
        <button onClick={handleSubmit} className="submit-button">
          출석
        </button>
      </div>
      {/* 오른쪽 하단 로고 이미지 */}
      <img src={logoImage} alt="로고 이미지" className="logo-image" />

      {selectionModal ? (
        <MembershipSelectionModal
          setSelectionModal={setSelectionModal}
          memberships={memberships}
          name={name}
          setModal={setModal}
          setMessage={setMessage}
          onSuccess={playSuccessSound}
        />
      ) : null}

      {/* 메시지 모달 */}
      {modal ? (
        <div className="overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-full max-h-full flex">
          <div className="fixed top-0 right-0 left-0 w-full max-h-full min-h-screen bg-black opacity-50"></div>
          <div className="relative p-4 w-full max-w-lg max-h-full">
            <div className="relative bg-white rounded-lg shadow">
              <div className="p-4 md:p-5 text-center">
                {message?.status ? (
                  <svg
                    className="mx-auto mb-4 w-12 h-12 text-green-600"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 20 20"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 11.917 9.724 16.5 19 7.5"
                    />
                  </svg>
                ) : (
                  <svg
                    className="mx-auto mb-4 text-red-600 w-12 h-12"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 20 20"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    />
                  </svg>
                )}

                <h3 className="mb-5 text-lg font-normal text-gray-500 whitespace-pre-line">
                  {message?.message}
                </h3>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MembersCheckIn;
