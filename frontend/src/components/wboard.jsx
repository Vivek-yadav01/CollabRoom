import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import socket from "../utils/socket";

export const Canvas = ({ roomCode }) => {
  const location = useLocation();
  const { data } = location.state || {};
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [stroke, setStroke] = useState(data.stroke || []);

  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctxRef.current = ctx;
    redrawStroke(stroke);

    socket.on("receive-stroke", (strokeData) => {
      console.log("Received stroke:", strokeData);
      redrawStroke(strokeData);
    });

    return () => {
      socket.off("receive-stroke");
    };
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
    <div style={{ textAlign: "center" }}>
      <canvas
        ref={canvasRef}
        style={{ border: "2px solid black  rounded-lg" }}
        onMouseDown={startDrawing}
        onMouseUp={endDrawing}
        onMouseMove={draw}
      />
      <div style={{ marginTop: "10px" }}>
        <button
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
          Clear All
        </button>
      </div>
    </div>
  );
};
