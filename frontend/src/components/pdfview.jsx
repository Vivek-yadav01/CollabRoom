import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import socket from "../utils/socket";
import { useLocation } from "react-router-dom";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { Toaster } from "react-hot-toast";

pdfjs.GlobalWorkerOptions.workerSrc = `${
  import.meta.env.VITE_API_URL
}/pdf.worker.mjs`;

function FileView({ roomCode }) {
  const location = useLocation();
  const { data } = location.state || {};
  const [page, setPage] = useState(1);
  const [file, setFile] = useState(null);
  const [fileList, setFileList] = useState(data?.files || []);
  const [selectedFile, setSelectedFile] = useState(
    data?.activePdf?.filename || null
  );
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [openFileListDialog, setOpenFileListDialog] = useState(false);

  useEffect(() => {
    if (roomCode) {
      socket.emit("fetch-room-data", { roomCode });

      socket.on("room-data", (roomData) => {
        setFileList(roomData?.files || []);
        setSelectedFile(roomData?.activePdf?.filename || null);
        setPage(roomData?.activePdf?.page || 1);
      });

      return () => socket.off("room-data");
    }
  }, [roomCode]);

  useEffect(() => {
    socket.on("file-uploaded", (fileInfo) => {
      setFileList((prevList) => [...prevList, fileInfo]);
    });

    return () => socket.off("file-uploaded");
  }, []);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file || !roomCode) {
      toast.error("Please select a file to upload.");
      return;
    }
    toast.loading("Uploading file...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("roomCode", roomCode);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast.dismiss();

        toast.success("File uploaded successfully!");
        setOpenUploadDialog(false); // Close dialog after upload
      } else {
        alert("Upload failed!");
      }
    } catch (error) {
      toast.dismiss();
      console.error("Upload error:", error);
      toast.error("Upload failed!");
    }
  };

  const handleFileSelect = (file) => {
    setOpenFileListDialog(false);
    socket.emit("pdf-file-change", { roomCode, filename: file.path });

    socket.on("pdf-file-updated", (data) => {
      setSelectedFile(data.filename);
    });
  };

  const changePage = (newPage) => {
    socket.emit("pdf-page-change", {
      roomCode,
      page: newPage,
      filename: selectedFile,
    });

    socket.on("pdf-page-updated", (data) => {
      setPage(data.page);
    });
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast.success("Room code copied!");
  };

  return (
    <div className="p-2 flex flex-col items-center mt-16">
      {/* Copy Room Code Button */}
      <Button
        variant="outline"
        onClick={copyRoomCode}
        className="mb-4 bg-gray-800 text-white"
      >
        <span className="bg-white text-black rounded-sm px-2">{roomCode}</span>{" "}
        Copy Room Code
      </Button>

      {/* Buttons */}
      <div className="flex gap-4">
        {/* Upload Button */}
        <Dialog open={openUploadDialog} onOpenChange={setOpenUploadDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" className="bg-gray-800 text-white">
              Upload File
            </Button>
          </DialogTrigger>
          <DialogContent>
            <h2 className="text-lg font-semibold">Upload a File</h2>
            <input
              type="file"
              accept="image/*,.pdf,.doc,.docx,.txt"
              onChange={handleFileChange}
              className="border p-2 rounded w-full"
            />
            <Button
              onClick={handleUpload}
              className="mt-2 bg-gray-700 text-white"
            >
              Upload
            </Button>
          </DialogContent>
        </Dialog>

        {/* Show Uploaded Files Button */}
        <Dialog open={openFileListDialog} onOpenChange={setOpenFileListDialog}>
          <DialogTrigger asChild>
            <Button variant="outline" className="bg-gray-800 text-white">
              Show Uploaded Files
            </Button>
          </DialogTrigger>
          <DialogContent>
            <h2 className="text-lg font-semibold">Uploaded Files</h2>
            <ul className="mt-2">
              {fileList.map((file, index) => (
                <li
                  key={index}
                  className="text-blue-600 cursor-pointer underline"
                  onClick={() => handleFileSelect(file)}
                >
                  {file.originalName}
                </li>
              ))}
            </ul>
          </DialogContent>
        </Dialog>
      </div>

      {/* File Viewer */}
      {selectedFile && (
        <div className="mt-4 border p-4 rounded w-full max-w-3xl">
          <div className="border p-2 overflow-auto max-h-[80vh]">
            {selectedFile.endsWith(".pdf") ? (
              <>
                <Document file={`${selectedFile}`} className="overflow-auto">
                  <Page pageNumber={page} className="max-w-full h-auto" />
                </Document>
                <div className="flex justify-between mt-2">
                  <Button
                    variant="outline"
                    onClick={() => changePage(page - 1)}
                    className="px-4 py-2 bg-gray-700 text-white"
                  >
                    ←
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => changePage(page + 1)}
                    className="px-4 py-2 bg-gray-700 text-white"
                  >
                    →
                  </Button>
                </div>
              </>
            ) : selectedFile.match(/\.(jpeg|jpg|png|gif)$/) ? (
              <img
                src={`${selectedFile}`}
                alt="Uploaded"
                className="max-w-full h-auto"
              />
            ) : (
              <p>File format not supported for preview.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default FileView;
