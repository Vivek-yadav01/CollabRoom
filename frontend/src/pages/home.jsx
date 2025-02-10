import { useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../utils/socket";

function Home() {
  const [roomCode, setRoomCode] = useState("");
  const navigate = useNavigate();

  const handleJoinRoom = async () => {
    await socket.emit("join-room", roomCode);
    await socket.on("room-joined", (data) => {
      if (!data) {
        alert("Room not found");
        navigate("/");
      } else {
        navigate(`/room/${roomCode}`, { state: { data } });
      }
    });
  };

  const handleCreateRoom = async () => {
    await socket.emit("create-room");
    await socket.on("room-created", (roomCode) => {
      navigate(`/room/${roomCode}`, { state: { data: "" } });
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-500">
      <h1 className="text-4xl text-white mb-8">CollabRoom</h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl mb-4">Options</h2>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Enter room code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            className="border border-gray-300 rounded-md p-2 mr-2"
          />
          <button
            onClick={handleJoinRoom}
            className="bg-blue-500 text-white px-4 py-2 rounded-md"
          >
            Join Room
          </button>
        </div>
        <button
          onClick={handleCreateRoom}
          className="bg-blue-600 text-white px-4 py-2 rounded-md"
        >
          Create Room
        </button>
      </div>
    </div>
  );
}

export default Home;
