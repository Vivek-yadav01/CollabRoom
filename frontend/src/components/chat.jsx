import { useEffect, useState } from "react";
import socket from "../utils/socket";
import { useLocation } from "react-router-dom";

function Chat({ roomCode }) {
  const location = useLocation();
  const { data } = location.state || {};
  console.log(data);

  const [messages, setMessages] = useState(data.chat || []);
  const [messageInput, setMessageInput] = useState("");

  useEffect(() => {
    const handleNewMessage = (newMessage) => {
      console.log(newMessage);
      // Append only the new message to the messages state
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    };

    socket.on("new-message", handleNewMessage);

    return () => {
      socket.off("new-message", handleNewMessage);
    };
  }, []);

  const handleSendMessage = async () => {
    if (messageInput.trim()) {
      await socket.emit("send-message", { roomCode, message: messageInput });
      setMessageInput("");
    }
  };

  return (
    <div className="w-96 p-6 bg-gradient-to-br from-gray-200 to-blue-400 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Chat Room</h2>
      <div className="h-96 overflow-y-auto bg-white rounded-lg shadow-inner p-4 mb-4">
        {messages.map((msg, index) => (
          <div key={index} className="mb-3 last:mb-0">
            <span className="font-medium text-blue-600">{msg.userId}: </span>
            <span className="text-gray-700">{msg.message}</span>
          </div>
        ))}
      </div>

      <div className="flex space-x-2">
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          placeholder="Type your message..."
        />
        <button
          onClick={handleSendMessage}
          className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg transition duration-200 ease-in-out transform hover:scale-105"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default Chat;
