import React from "react";

const Tooltip = ({ text }) => {
  return (
    <span className="relative group cursor-help inline-block">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4 text-gray-500 inline-block"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path d="M18 10c0 4.418-3.582 8-8 8s-8-3.582-8-8 3.582-8 8-8 8 3.582 8 8zM9 9a1 1 0 112 0v1a1 1 0 01-2 0V9zM9 13a1 1 0 112 0 1 1 0 01-2 0z" />
      </svg>
      <span className="absolute hidden group-hover:block bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-700 text-white text-xs rounded py-1 px-2">
        {text}
      </span>
    </span>
  );
};

export default Tooltip;
