import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import socket from "../utils/socket";
import { useLocation } from "react-router-dom";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

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

  // Fetch latest room data when a new user joins
  useEffect(() => {
    if (roomCode) {
      socket.emit("fetch-room-data", { roomCode });

      socket.on("room-data", (roomData) => {
        console.log("Room Data received:", roomData);
        setFileList(roomData.files);
        setSelectedFile(roomData.activePdf?.filename || null);
        setPage(roomData.activePdf?.page || 1);
      });

      return () => {
        socket.off("room-data");
      };
    }
  }, [roomCode]);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file || !roomCode) {
      alert("Select a file and enter a room code!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("roomCode", roomCode);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        console.log("Upload successful");
      } else {
        alert("Upload failed!");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error uploading file.");
    }
  };

  useEffect(() => {
    socket.on("file-uploaded", (fileInfo) => {
      console.log("File uploaded:", fileInfo);
      setFileList((prevList) => [...prevList, fileInfo]);
    });

    return () => {
      socket.off("file-uploaded");
    };
  }, []);

  const handleFileSelect = (file) => {
    socket.emit("pdf-file-change", { roomCode, filename: file.path });

    socket.on("pdf-file-updated", (data) => {
      console.log("File updated:", data);
      setSelectedFile(data.filename);
    });
  };

  useEffect(() => {
    socket.on("pdf-file-updated", (data) => {
      console.log("File updated:", data);
      setSelectedFile(data.filename);
    });

    return () => {
      socket.off("pdf-file-updated");
    };
  }, []);

  const changePage = (newPage) => {
    socket.emit("pdf-page-change", {
      roomCode,
      page: newPage,
      filename: selectedFile,
    });

    socket.on("pdf-page-updated", (data) => {
      console.log("Page updated:", data);
      setPage(data.page);
    });
  };

  useEffect(() => {
    socket.on("pdf-page-updated", (data) => {
      console.log("Page updated:", data);
      setPage(data.page);
    });

    return () => {
      socket.off("pdf-page-updated");
    };
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">File Viewer</h1>

      <input
        type="text"
        placeholder="Enter Room Code"
        value={roomCode}
        className="border p-2 rounded mr-2"
      />

      <input
        type="file"
        accept="image/*,.pdf,.doc,.docx,.txt"
        onChange={handleFileChange}
      />
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded ml-2"
        onClick={handleUpload}
      >
        Upload
      </button>

      {/* File List */}
      <div className="mt-4 border p-4 rounded">
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
      </div>

      {/* File Viewer */}
      {selectedFile && (
        <div className="mt-4 border p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">File Viewer</h2>
          <div className="border p-2">
            {selectedFile.endsWith(".pdf") ? (
              <>
                <Document
                  file={`${import.meta.env.VITE_API_URL}${selectedFile}`}
                >
                  <Page pageNumber={page} />
                </Document>
                <div className="flex justify-between mt-2">
                  <button
                    onClick={() => changePage(page - 1)}
                    className="px-4 py-2 bg-gray-300 rounded"
                  >
                    ←
                  </button>
                  <button
                    onClick={() => changePage(page + 1)}
                    className="px-4 py-2 bg-gray-300 rounded"
                  >
                    →
                  </button>
                </div>
              </>
            ) : selectedFile.match(/\.(jpeg|jpg|png|gif)$/) ? (
              <img
                src={`${import.meta.env.VITE_API_URL}${selectedFile}`}
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
