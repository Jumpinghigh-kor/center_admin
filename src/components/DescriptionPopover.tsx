import React, { useState } from "react";

interface ModalProps {
  tip: string;
}

const DescriptionPopover: React.FC<ModalProps> = ({ tip }) => {
  const [isPopoverVisible, setPopoverVisible] = useState(false);

  return (
    <div className="relative hidden sm:block">
      <p className="flex items-center text-sm text-gray-500">
        <button
          data-popover-target="popover-description"
          data-popover-placement="bottom-end"
          type="button"
          onMouseEnter={() => setPopoverVisible(true)}
          onMouseLeave={() => setPopoverVisible(false)}
        >
          <svg
            className="w-4 h-4 ms-2 text-gray-400 hover:text-gray-500"
            aria-hidden="true"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            ></path>
          </svg>
          <span className="sr-only">Show information</span>
        </button>
      </p>

      {/* Popover Content with Transition */}
      <div
        role="tooltip"
        className={`absolute z-10 -right-3 ml-2 top-3 text-sm text-gray-500 bg-white border border-gray-200 rounded-lg shadow-xs w-32 mt-2
        transition-all duration-300 ease-in-out 
        ${
          isPopoverVisible
            ? "opacity-100 visible translate-y-0"
            : "opacity-0 invisible -translate-y-2"
        }`}
      >
        <div className="p-3 space-y-2">
          <h3 className="font-semibold text-gray-900">TIP</h3>
          <p>{tip}</p>
        </div>
      </div>
    </div>
  );
};

export default DescriptionPopover;
