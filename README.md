# 🌐 CollabRoom

**CollabRoom** is a real-time, open collaboration platform where anyone can join or create a room with a unique code — no login required. Inside a room, participants can **chat**, **share audio/video streams**, **collaborate on documents**, and use a shared **whiteboard** — all synchronized live across all users.

---

## 🚀 Features

- 🔐 **No Authentication**: Anyone can create or join a room using a unique room code.
- 💬 **Live Chat**: Message all room participants in real time.
- 🎥 **Real-Time Audio/Video Sharing**:
  - Everyone in the room can share their video/audio.
  - Toggle your own media stream on/off.
  - Control (mute/unmute) other participants as well (with consent or force).
- 🖼️ **Shared Document Viewer**:
  - Upload and render **PDFs** and **images** using `react-pdf` and native image rendering.
  - Page turns and views are synchronized across users.
- 🖊️ **Collaborative Whiteboard**:
  - Everyone can draw, write, and erase.
  - Canvas is synced live using **Socket.IO**.
- 🧠 **Full Synchronization**:
  - Every action is live: chat, media, drawing, documents, and user controls.

---

## 🛠 Tech Stack

- **Frontend**: React.js, Tailwind CSS, React-PDF, Canvas API, WebRTC
- **Backend**: Node.js, Express.js
- **Real-Time Communication**: Socket.IO, WebRTC (for media)
- **File Upload**: Multer (with optional Cloudinary support)
- **PDF/Image Rendering**: `react-pdf`, HTML5 image tag

---

## 🧩 Project Structure
```
collabroom/
├── frontend/          # React frontend
│   └── src/           # Components: Chat, VideoGrid, Whiteboard, PDFViewer, etc.
├── backend/           # Express.js backend with Socket.IO & WebRTC signaling
│   └── uploads/       # Uploaded documents/images
├── README.md




## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Vivek-yadav01/CollabRoom.git
   cd collabroom
   ```
2. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
3. Set up environment variables:
   - Create a `.env` file in the root directory and add the following:
     ```env
     VITE_API_URL=http://localhost:4000
     ```
4. Run the application:
   ```bash
   npm run dev
   ```

2. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
3. Set up environment variables:
   - Create a `.env` file in the root directory and add the following:
     ```env
     CLOUDINARY_CLOUD_NAME=YOUR KEY
     CLOUDINARY_API_KEY=YOUR API KEY
     CLOUDINARY_API_SECRET=API SECRET KEY
     FRONTEND_URL=http://localhost:5173

     ```
4. Run the application:
   ```bash
   npm start
   ```

4. Get the application at:
   ```bash
   http://localhost:5173
   ```

### Made with ❤ By vivek


