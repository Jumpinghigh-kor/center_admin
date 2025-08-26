import React from "react";

const CardDetailButton: React.FC = () => {
  return (
    <span className="mt-12 flex justify-end items-center">
      <span className="text-gray-400">자세히보기&nbsp;</span>
      <svg
        className="w-4 h-4 text-gray-400"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 14 10"
      >
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M1 5h12m0 0L9 1m4 4L9 9"
        />
      </svg>
    </span>
  );
};

export default CardDetailButton;
