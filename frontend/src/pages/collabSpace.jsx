import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Card, CardContent } from "@/components/ui/card";
import Chat from "../components/chat";
import { useParams } from "react-router-dom";
import PdfView from "../components/pdfview";
import { Canvas } from "../components/wboard";
import VideoRoom from "../components/video";
import { Toaster } from "react-hot-toast";

function CollabSpace() {
  const { roomCode } = useParams();
  const [activeTab, setActiveTab] = useState("chat"); // 'chat' or 'whiteboard'

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <div className="flex h-screen w-full bg-gray-900 text-white overflow-hidden sm:flex-col">
        {/* Left Section - Chat & Whiteboard */}
        <div className="w-1/3 min-h-screen flex flex-col border-r  fixed left-0 bg-gray-800">
          {/* Tab Switch Buttons (ShadCN UI) */}
          <Card className="border-none rounded-none shadow-none bg-transparent">
            <CardContent className="p-2 flex justify-around">
              <ToggleGroup
                type="single"
                value={activeTab}
                onValueChange={(value) => setActiveTab(value || "chat")}
                className="w-full flex justify-center"
              >
                <ToggleGroupItem
                  variant="outline"
                  className="px-4 py-2 bg-gray-700 text-white"
                  value="chat"
                >
                  Chat
                </ToggleGroupItem>
                <ToggleGroupItem
                  variant="outline"
                  className="px-4 py-2 bg-gray-700 text-white"
                  value="whiteboard"
                >
                  Whiteboard
                </ToggleGroupItem>
              </ToggleGroup>
            </CardContent>
          </Card>

          {/* Dynamic Content Based on Active Tab */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === "chat" ? (
              <Chat roomCode={roomCode} />
            ) : (
              <Canvas roomCode={roomCode} />
            )}
          </div>
        </div>

        {/* Middle Section - PDF Viewer */}
        <div className="w-1/2 h-full flex items-center justify-center mx-auto fixed left-1/3  border-gray-700 overflow-y-auto">
          <PdfView roomCode={roomCode} />
        </div>

        {/* Right Section - Video Room */}
        <div className="w-1/5 h-full p-4 fixed right-0 overflow-y-auto">
          <VideoRoom roomCode={roomCode} />
        </div>
      </div>
    </>
  );
}

export default CollabSpace;
