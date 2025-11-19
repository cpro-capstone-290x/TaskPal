// src/components/shared/Avatar.jsx
import React from "react";

const fallbackUrl =
  "https://cdn-icons-png.flaticon.com/512/149/149071.png";

const Avatar = ({ src, alt = "Profile", className = "" }) => {
  const safeSrc = src || fallbackUrl;

  return (
    <img
      src={safeSrc}
      alt={alt}
      className={`rounded-full object-cover border bg-gray-50 ${className}`}
    />
  );
};

export default Avatar;
