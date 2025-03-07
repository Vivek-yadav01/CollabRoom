import { useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../utils/socket";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { use } from "react";

function Home() {
  const [roomCode, setRoomCode] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleJoinRoom = async () => {
    if (!username.trim() || !roomCode.trim()) {
      setError("Username and Room Code are required.");
      return;
    }
    setError("");
    await socket.emit("join-room", { roomCode, username });
    await socket.on("room-joined", (data) => {
      if (data.error) {
        alert("Room not found");
        navigate("/");
      } else {
        navigate(`/room/${roomCode}`, { state: { data } });
        localStorage.setItem("username", username);
        localStorage.setItem("roomCode", roomCode);
      }
    });
  };

  const handleCreateRoom = async () => {
    if (!username.trim()) {
      setError("Username is required.");
      return;
    }
    setError("");
    await socket.emit("create-room", username);
    await socket.on("room-created", (roomCode) => {
      navigate(`/room/${roomCode}`, { state: { data: "" } });
      localStorage.setItem("username", username);
      localStorage.setItem("roomCode", roomCode);
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white">
      {/* Heading */}
      <h1 className="text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
        Let's Club...
      </h1>

      {/* Card Container with Two Buttons */}
      <Card className="bg-white/10 backdrop-blur-lg p-6 rounded-xl shadow-lg w-full max-w-md text-center">
        <Dialog>
          {/* Create Room Button */}
          <DialogTrigger asChild>
            <Button className="bg-blue-600 w-full mb-4">Create Room</Button>
          </DialogTrigger>
          <DialogContent className="bg-black/80 text-white border border-gray-700 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Enter Username</h2>
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError(""); // Clear error when user types
              }}
              className="bg-black/50 text-white border border-gray-700 mb-2"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button
              onClick={handleCreateRoom}
              className="bg-blue-600 w-full"
              disabled={!username.trim()}
            >
              Create Room
            </Button>
          </DialogContent>
        </Dialog>

        <Dialog>
          {/* Join Room Button */}
          <DialogTrigger asChild>
            <Button className="bg-blue-500 w-full">Join Room</Button>
          </DialogTrigger>
          <DialogContent className="bg-black/80 text-white border border-gray-700 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Join a Room</h2>
            <Input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError("");
              }}
              className="bg-black/50 text-white border border-gray-700 mb-2"
            />
            <div className="flex gap-2 mb-2">
              <Input
                type="text"
                placeholder="Enter room code"
                value={roomCode}
                onChange={(e) => {
                  setRoomCode(e.target.value);
                  setError("");
                }}
                className="bg-black/50 text-white border border-gray-700"
              />
              <Button
                onClick={() => navigator.clipboard.readText().then(setRoomCode)}
                className="bg-gray-700"
              >
                PASTE
              </Button>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button
              onClick={handleJoinRoom}
              className="bg-blue-500 w-full"
              disabled={!username.trim() || !roomCode.trim()}
            >
              Join Room
            </Button>
          </DialogContent>
        </Dialog>
      </Card>
    </div>
  );
}

export default Home;
