import React from "react";

const Card = ({ item, title, children, onClick }) => {
  const handleClick = () => {
    if (onClick && item?.id) onClick(item.id);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        cursor: onClick ? "pointer" : "default",
        padding: "20px",
        margin: "10px",
        border: "1px solid #ccc",
        borderRadius: "8px",
        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
        transition: "transform 0.2s",
        minWidth: "200px",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = onClick ? "scale(1.05)" : "scale(1)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      {title && <h3>{title}</h3>}
      
      {item && <p>{item.description}</p>}
      {children}
    </div>
  );
};

export default Card;