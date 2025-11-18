// src/components/chat/ChatMessages.jsx
import React, { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";

const ChatMessages = ({ messages, currentUserId, currentRole }) => {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-gray-50">
      {messages.map((msg, i) => {
        const senderId = Number(msg.sender_id ?? msg.senderId);
        const senderRole = String(msg.sender_role || "")
          .trim()
          .toLowerCase();
        const role = String(currentRole || "").trim().toLowerCase();
        const userId = Number(currentUserId);

        const isSender = senderRole === role && senderId === userId;

        const senderName = isSender
          ? "You"
          : senderRole === "provider"
          ? "Provider"
          : "Client";

        return (
          <MessageBubble
            key={i}
            message={msg}
            isSender={isSender}
            senderName={senderName}
          />
        );
      })}
      <div ref={endRef} />
    </div>
  );
};

export default ChatMessages;
