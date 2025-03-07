import { useEffect, useRef, useState } from "react";
import socket from "../utils/socket";

export const Canvas = ({ roomCode }) => {
  const [stroke, setStroke] = useState([]);
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    if (roomCode) {
      socket.emit("fetch-room-data", { roomCode });
      socket.on("room-data", (roomData) => {
        setStroke(roomData?.stroke || []);
        redrawStroke(roomData?.stroke);
      });
      return () => socket.off("room-data");
    }
  }, [roomCode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 300;
    canvas.height = 380;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctxRef.current = ctx;
    redrawStroke(stroke);

    socket.on("receive-stroke", (strokeData) => redrawStroke(strokeData));
    return () => socket.off("receive-stroke");
  }, []);

  const startDrawing = (e) => {
    setIsDrawing(true);
    setStroke([]);
    ctxRef.current.beginPath();
  };

  const endDrawing = () => {
    setIsDrawing(false);
    ctxRef.current.beginPath();
    if (stroke.length > 1) {
      socket.emit("send-stroke", { stroke, roomCode });
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;
    ctxRef.current.lineTo(x, y);
    ctxRef.current.stroke();
    setStroke((prev) => [...prev, { x, y }]);
  };

  const redrawStroke = (strokeData) => {
    if (!strokeData || strokeData.length < 2) {
      ctxRef.current.clearRect(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );
      return;
    }
    ctxRef.current.beginPath();
    strokeData.forEach(({ x, y, type }, index) => {
      if (type === "break") {
        ctxRef.current.beginPath();
      } else {
        if (index === 0 || strokeData[index - 1].type === "break") {
          ctxRef.current.moveTo(x, y);
        } else {
          ctxRef.current.lineTo(x, y);
          ctxRef.current.stroke();
        }
      }
    });
    ctxRef.current.beginPath();
  };

  return (
    <div className="flex flex-col items-center p-4 bg-gray-800 min-h-screen">
      <canvas
        ref={canvasRef}
        className="border border-gray-300 shadow-md bg-white rounded-lg cursor-crosshair"
        onMouseDown={startDrawing}
        onMouseUp={endDrawing}
        onMouseMove={draw}
      />
      <button
        className="mt-4 px-6 py-2 bg-red-600 text-white font-medium rounded-md shadow hover:bg-red-700 transition-all"
        onClick={() => {
          ctxRef.current.clearRect(
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );
          socket.emit("send-stroke", { stroke: [], roomCode });
        }}
      >
        Clear Canvas
      </button>
    </div>
  );
};
