import React, { useEffect } from "react";
import socket from "../utils/socket";
import { FiMic, FiMicOff, FiVideo, FiVideoOff } from "react-icons/fi";
import { createRoot } from "react-dom/client";

export default function VideoRoom({ roomCode }) {
  console.log("VideoRoom initialized with roomCode:", roomCode);

  useEffect(() => {
    socket.on("user-left", (userId) => {
      console.log("user left:", userId);
      const video = document.getElementById(`video-${userId}`);
      if (video) {
        video.remove();
      }
    });

    const videoRoom = document.querySelector(".videoroom");
    if (!videoRoom) {
      console.error("Error: .videoroom container not found in DOM!");
      return;
    }

    const localVideo = document.createElement("video");
    localVideo.muted = true;

    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localVideo.srcObject = stream;
        localVideo.addEventListener("loadedmetadata", () => {
          localVideo
            .play()
            .then(() => {
              console.log("Local video playback started.");
              enableVideo(localVideo, stream, videoRoom);
            })
            .catch((err) => console.error("Local video playback error:", err));
        });

        console.log("Local stream obtained:", stream);
        makeConnection(stream);
      })
      .catch((error) => {
        console.error(
          "Error accessing media devices From ur own laptop:",
          error
        );
      });

    return () => {
      socket.off("users");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
    };
  }, []);

  const enableVideo = (localVideo, stream, videoRoom) => {
    let isMuted = false;
    let isVideoOff = false;

    const muteButton = document.createElement("button");
    muteButton.className =
      "flex items-center justify-center px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition";
    const muteIconRoot = createRoot(muteButton);
    muteIconRoot.render(<FiMic />);
    muteButton.onclick = () => {
      stream
        .getAudioTracks()
        .forEach((track) => (track.enabled = !track.enabled));
      isMuted = !isMuted;
      muteIconRoot.render(isMuted ? <FiMicOff /> : <FiMic />);
    };

    const videoButton = document.createElement("button");
    videoButton.className =
      "flex items-center justify-center px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition";
    const videoIconRoot = createRoot(videoButton);
    videoIconRoot.render(<FiVideo />);
    videoButton.onclick = () => {
      stream
        .getVideoTracks()
        .forEach((track) => (track.enabled = !track.enabled));
      isVideoOff = !isVideoOff;
      videoIconRoot.render(isVideoOff ? <FiVideoOff /> : <FiVideo />);
    };

    const controlBar = document.createElement("div");
    controlBar.className = "flex space-x-4 mt-2";
    controlBar.appendChild(muteButton);
    controlBar.appendChild(videoButton);

    const container = document.createElement("div");
    container.className =
      "flex flex-col items-center justify-center bg-gray-900 text-white rounded-lg p-4 shadow-lg";
    container.appendChild(localVideo);
    container.appendChild(controlBar);

    videoRoom.appendChild(container);
  };

  async function makeConnection(localStream) {
    socket.off("offer");
    socket.on("offer", async (data) => {
      if (data.to !== socket.id) return;

      try {
        const peerConnection = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        localStream
          .getTracks()
          .forEach((track) => peerConnection.addTrack(track, localStream));

        peerConnection.onicecandidate = (e) => {
          if (e.candidate) {
            socket.emit("ice-candidate", {
              to: data.from,
              candidate: e.candidate,
              from: socket.id,
            });
          }
        };

        peerConnection.ontrack = (e) => {
          if (e.streams[0]) {
            if (!document.getElementById(`video-${data.from}`)) {
              createRemoteVideoElement(data.from, e.streams[0], data.user);
            }
          }
        };

        await peerConnection.setRemoteDescription(data.offer);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit("answer", {
          to: data.from,
          answer,
          from: socket.id,
        });
      } catch (error) {
        console.error("Error handling offer:", error);
      }
    });

    socket.emit("fetch-users", roomCode);

    socket.on("users", (users) => {
      users.forEach(({ user, userName }) => {
        console.log("User connected:", user, userName);
        const peerConnection = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        localStream
          .getTracks()
          .forEach((track) => peerConnection.addTrack(track, localStream));

        peerConnection.onnegotiationneeded = async () => {
          try {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            socket.emit("offer", { to: user, offer, from: socket.id });
          } catch (e) {
            console.error("Error making offer:", e);
          }
        };

        peerConnection.onicecandidate = (e) => {
          if (e.candidate) {
            socket.emit("ice-candidate", {
              to: user,
              candidate: e.candidate,
              from: socket.id,
            });
          }
        };

        socket.on("answer", async (data) => {
          if (data.from !== user) return;
          try {
            await peerConnection.setRemoteDescription(data.answer);
          } catch (error) {
            console.error("Error setting remote description:", error);
          }
        });

        socket.on("ice-candidate", (data) => {
          if (data.to === socket.id) {
            try {
              peerConnection.addIceCandidate(data.candidate);
            } catch (error) {
              console.error("Error adding ICE candidate:", error);
            }
          }
        });

        peerConnection.ontrack = (event) => {
          if (!document.getElementById(`video-${user}`)) {
            createRemoteVideoElement(user, event.streams[0], userName);
          }
        };
      });
    });
  }

  function createRemoteVideoElement(userId, stream, username = "Remote User") {
    const videoRoom = document.querySelector(".videoroom");

    const remoteVideo = document.createElement("video");
    remoteVideo.id = `video-${userId}`;
    remoteVideo.srcObject = stream;
    remoteVideo.autoplay = true;

    const muteBtn = document.createElement("button");
    muteBtn.className =
      "flex items-center justify-center px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition";
    let muted = false;
    const muteIcon = createRoot(muteBtn);
    muteIcon.render(<FiMic />);
    muteBtn.onclick = () => {
      muted = !muted;
      remoteVideo.muted = muted;
      muteIcon.render(muted ? <FiMicOff /> : <FiMic />);
    };

    const videoBtn = document.createElement("button");
    videoBtn.className =
      "flex items-center justify-center px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition";
    let videoPaused = false;
    const videoIcon = createRoot(videoBtn);
    videoIcon.render(<FiVideo />);
    videoBtn.onclick = () => {
      videoPaused = !videoPaused;
      videoPaused ? remoteVideo.pause() : remoteVideo.play();
      videoIcon.render(videoPaused ? <FiVideoOff /> : <FiVideo />);
    };

    const nameLabel = document.createElement("h2");
    nameLabel.innerText = username;
    nameLabel.className = "text-white text-lg font-semibold mb-2";

    const controls = document.createElement("div");
    controls.className = "flex space-x-4 mt-2";
    controls.appendChild(muteBtn);
    controls.appendChild(videoBtn);

    const container = document.createElement("div");
    container.id = `video-${userId}`;
    container.className =
      "flex flex-col items-center justify-center bg-gray-800 rounded-lg p-4 shadow-lg";
    container.appendChild(nameLabel);
    container.appendChild(remoteVideo);
    container.appendChild(controls);

    videoRoom.appendChild(container);
  }

  return (
    <div className="videoroom grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-[0.2px] min-h-screen overflow-auto custom-scrollbar" />
  );
}
