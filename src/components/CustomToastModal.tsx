import React, { useEffect, useState } from 'react';

interface CustomToastModalProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
  variant?: 'warning' | 'success';
}

const CustomToastModal: React.FC<CustomToastModalProps> = ({ 
  message,
  isVisible, 
  onClose, 
  duration = 2000,
  variant = 'success'
}) => {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldShow(true);
      
      const timer = setTimeout(() => {
        setShouldShow(false);
        setTimeout(() => {
          onClose();
        }, 300); // 애니메이션 완료 후 닫기
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible && !shouldShow) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
      <div 
        className={`
          ${variant === 'success' ? 'bg-black text-white' : 'bg-red-500 text-white'} rounded-full px-6 py-3 shadow-lg transition-all duration-500 ease-out flex items-center gap-2
          ${shouldShow ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-95'}
        `}
      >
        <div style={{borderRadius: '50%', width: '10px', height: '10px', backgroundColor: variant === 'success' ? '#40B649' : '#FFFFFF'}} />
        <p className="text-sm font-medium whitespace-nowrap">{message}</p>
      </div>
    </div>
  );
};

export default CustomToastModal;
