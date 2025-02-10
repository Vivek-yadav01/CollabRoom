// src/pages/CollabSpace.js

import Chat from "../components/chat";
import { useParams } from "react-router-dom";
import PdfView from "../components/pdfview";
import { Canvas } from "../components/wboard";
function CollabSpace() {
  const { roomCode } = useParams();

  return (
    <>
      <div className="flex \ items-center justify-center min-h-screen bg-blue-500">
        <div className="flex flex-col items-center justify-center bg-white p-2 rounded-lg shadow-md space-y-4">
          <Chat roomCode={roomCode} />
          <Canvas roomCode={roomCode} />
        </div>
        <PdfView roomCode={roomCode} />
      </div>
    </>
  );
}

export default CollabSpace;
