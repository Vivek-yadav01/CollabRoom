import { useEffect, useState } from "react";
import socket from "../utils/socket";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

function Chat({ roomCode }) {
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");

  useEffect(() => {
    if (roomCode) {
      socket.emit("fetch-room-data", { roomCode });
      socket.on("room-data", (roomData) => {
        setMessages(roomData?.chat || []);
      });
      return () => {
        socket.off("room-data");
      };
    }
  }, [roomCode]);

  useEffect(() => {
    const handleNewMessage = (newMessage) => {
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
    <div className="flex flex-col justify-center items-center">
      <Card className="w-80 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md flex flex-col">
        <ScrollArea className="h-72 bg-white dark:bg-gray-900 rounded-md p-3 shadow-inner overflow-y-auto">
          {messages.map((msg, index) => (
            <div key={index} className="mb-2">
              <span className="font-medium text-blue-600 dark:text-blue-400">
                {msg.username}:{" "}
              </span>
              <span className="text-gray-700 dark:text-gray-300">
                {msg.message}
              </span>
            </div>
          ))}
        </ScrollArea>
        <div className="flex items-center mt-3 space-x-2">
          <Input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSendMessage();
              }
            }}
            className="flex-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Type your message..."
          />
          <Button
            onClick={handleSendMessage}
            className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-md"
          >
            Send
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default Chat;
