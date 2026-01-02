import React from "react";
import jumpingHighPlusImg001 from "../images/jumpinghigh_plus_img001.png";
import googleQRIMG from "../images/google_qr.png";
import appleQRIMG from "../images/apple_qr.png";
import googleStoreIcon from "../images/google_store_icon.png";
import appleStoreIcon from "../images/apple_store_icon.png";

interface AppInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AppInfoModal: React.FC<AppInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      <div className="relative z-50 bg-white rounded-xl w-11/12 max-w-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">점핑하이 플러스 설명</h2>
          <button
            aria-label="닫기"
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-6 h-6"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div>
          <div className="flex flex-col items-center justify-center mt-12">
            <img src={jumpingHighPlusImg001} alt="점핑하이 플러스 설명" className="" />
          </div>
          <div className="leading-6 space-y-2 mt-8">
            <p className="text-base">
              점핑하이 플러스는 점핑하이 회원을 위한 전용 애플리케이션으로,<br />
              출석 체크, 수업 예약, 운동 기록, 쇼핑몰 이용 등 다양한 기능을 제공합니다.<br /><br />
              이 관리 페이지는 회원 계정 생성부터 운동 기록, 주문 내역 조회까지<br />
              회원 관련 정보를 보다 쉽게 확인하고 관리할 수 있도록 제작되었습니다.<br /><br />
            </p>

            <div className="flex justify-evenly mt-4">
              <div className="flex flex-col items-center">
                <p className="mb-4">구글 플레이 QR코드</p>
                <img src={googleQRIMG} alt="구글 플레이 qr코드" className="w-20 h-20" />
              </div>
              <div className="border border-gray-500"></div>
              <div className="flex flex-col items-center">
                <p className="mb-4">애플 스토어 QR코드</p>
                <img src={appleQRIMG} alt="애플 스토어 qr코드" className="w-20 h-20" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-8">
          <a href="https://play.google.com/store/apps/details?id=com.jumpinghighplus&hl=ko" target="_blank" className="text-blue-500">
            <img src={googleStoreIcon} alt="구글 플레이 아이콘" className="w-6 h-6" />
          </a>
          <a href="https://apps.apple.com/kr/app/%EC%A0%90%ED%95%91%ED%95%98%EC%9D%B4-%ED%94%8C%EB%9F%AC%EC%8A%A4/id6754903377#information" target="_blank" className="text-blue-500 ml-4">
            <img src={appleStoreIcon} alt="애플 스토어 아이콘" className="w-6 h-6" />
          </a>
        </div>
        <div className="mt-4 text-right">
          <button
            className="bg-custom-393939 text-white rounded-lg px-4 py-2"
            onClick={onClose}
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppInfoModal;


