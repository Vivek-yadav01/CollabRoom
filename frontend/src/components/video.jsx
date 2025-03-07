import React, { useEffect } from "react";
import socket from "../utils/socket";
import { data } from "react-router-dom";

export default function VideoRoom({ roomCode }) {
  console.log("VideoRoom initialized with roomCode:", roomCode);

  useEffect(() => {
    // handle user diconnection
    socket.on("user-left", (userId) => {
      console.log("User left:", userId);
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

              // Mute/Unmute button
              const muteButton = document.createElement("button");
              muteButton.innerHTML = "Mute";
              muteButton.onclick = () => {
                stream.getAudioTracks().forEach((track) => {
                  track.enabled = !track.enabled;
                });
                muteButton.innerHTML = stream.getAudioTracks()[0].enabled
                  ? "Mute"
                  : "Unmute";
              };

              // Stop/Start Video button
              const videoButton = document.createElement("button");
              videoButton.innerHTML = "Stop";
              videoButton.onclick = () => {
                stream.getVideoTracks().forEach((track) => {
                  track.enabled = !track.enabled;
                });
                videoButton.innerHTML = stream.getVideoTracks()[0].enabled
                  ? "Stop "
                  : "Start ";
              };

              const div = document.createElement("div");
              div.appendChild(localVideo);
              const div2 = document.createElement("div");
              div2.appendChild(videoButton);
              div2.appendChild(muteButton);
              div.appendChild(div2);
              div2.classList.add("flex");
              div2.classList.add("flex-row");
              div2.classList.add("justify-center");

              div2.classList.add("space-x-2");

              videoRoom.appendChild(div);
            })
            .catch((err) => console.error("Local video playback error:", err));
        });

        console.log("Local stream obtained:", stream);
        makeConnection(stream);
      })
      .catch((error) => {
        console.error("Error accessing media devices:", error);
      });

    return () => {
      socket.off("users");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice-candidate");
    };
  }, []);

  async function makeConnection(localStream) {
    socket.off("offer");
    socket.on("offer", async (data) => {
      console.log(
        "Offer received from:",
        data.from,
        "to:",
        data.to,
        "Socket ID:",
        socket.id
      );

      if (data.to === socket.id) {
        console.log(
          "Offer received for this socket.",
          data.offer,
          "me",
          socket.id
        );
        try {
          const peerConnection = new RTCPeerConnection({
            iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
          });

          localStream
            .getTracks()
            .forEach((track) => peerConnection.addTrack(track, localStream));
          console.log("PeerConnection initialized for offer handling.");

          if (!peerConnection.onicecandidate) {
            peerConnection.onicecandidate = (e) => {
              if (e.candidate) {
                console.log("ICE Candidate generated:", e.candidate);
                socket.emit("ice-candidate", {
                  to: data.from,
                  candidate: e.candidate,
                  from: socket.id,
                });
              }
            };
          }

          peerConnection.ontrack = (e) => {
            console.log("Track received from peer:", e.streams[0]);

            if (e.streams[0]) {
              let existingVideo = document.getElementById(`video-${data.from}`);

              if (!existingVideo) {
                const remoteVideo = document.createElement("video");
                remoteVideo.id = `video-${data.from}`; // Assign a unique ID
                remoteVideo.srcObject = e.streams[0];
                remoteVideo.autoplay = true;

                const btn = document.createElement("button");
                btn.innerHTML = "Mute";
                btn.onclick = () => {
                  if (remoteVideo.muted) {
                    remoteVideo.muted = false;
                    btn.innerHTML = "Unmute";
                  } else {
                    remoteVideo.muted = true;
                    btn.innerHTML = "Mute";
                  }
                };

                const vdoff = document.createElement("button");
                vdoff.innerHTML = "Stop Video";
                vdoff.onclick = () => {
                  if (remoteVideo.paused) {
                    remoteVideo.play();
                    vdoff.innerHTML = "Stop ";
                  } else {
                    remoteVideo.pause();
                    vdoff.innerHTML = "Start ";
                  }
                };
                const h2 = document.createElement("h1");
                h2.innerHTML = data.user;

                const div = document.createElement("div");
                const div2 = document.createElement("div");
                div2.appendChild(vdoff);
                div2.appendChild(btn);
                div.appendChild(remoteVideo);
                div.appendChild(div2);

                div.appendChild(h2);
                div.id = "video-" + data.from;
                document.querySelector(".videoroom").appendChild(div);

                console.log("Remote video added for user:", data.from);
              } else {
                console.log(
                  "Video element already exists for user:",
                  data.from
                );
              }
            }
          };

          await peerConnection.setRemoteDescription(data.offer);
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);

          console.log("Answer created and sent to:", data.from);
          socket.emit("answer", {
            to: data.from,
            answer,
            from: socket.id,
          });
        } catch (error) {
          console.error("Error handling offer:", error);
        }
      }
    });

    socket.emit("fetch-users", roomCode);
    socket.on("users", (users) => {
      users.forEach((user) => {
        console.log("Connecting to user:", user);
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

            console.log("Offer created and sent to:", user);
            socket.emit("offer", { to: user, offer, from: socket.id });
          } catch (e) {
            console.error("Error making offer:", e);
          }
        };

        // peerConnection.onicecandidate = (e) => {
        //   if (e.candidate) {
        //     console.log("ICE Candidate found:", e.candidate);
        //     socket.emit("ice-candidate", {
        //       to: user,
        //       candidate: e.candidate,
        //       from: socket.id,
        //     });
        //   }
        // };

        socket.on("answer", async (data) => {
          console.log(
            "Answer received from:",
            data.from,
            "to:",
            data.to,
            data.answer
          );

          if (data.from === user) {
            data.answer;
            try {
              await peerConnection.setRemoteDescription(data.answer);
              console.log("Remote description set.");
            } catch (error) {
              console.error("Error setting remote description:", error);
            }
          }
        });

        socket.on("ice-candidate", (data) => {
          console.log(
            "ICE Candidate received from:",
            data.from,
            "to:",
            data.to
          );
          if (data.to === socket.id) {
            try {
              peerConnection.addIceCandidate(data.candidate);
            } catch (error) {
              console.error("Error adding ICE candidate:", error);
            }
          }
        });
        peerConnection.ontrack = (event) => {
          console.log("Track received:", event.streams[0]);

          let existingVideo = document.getElementById(`video-${user}`);
          if (!existingVideo) {
            const remoteVideo = document.createElement("video");
            remoteVideo.id = `video-${user}`; // Assign unique ID
            remoteVideo.srcObject = event.streams[0];
            remoteVideo.autoplay = true;
            const btn = document.createElement("button");
            btn.innerHTML = "Mute";
            btn.onclick = () => {
              if (remoteVideo.muted) {
                remoteVideo.muted = false;
                btn.innerHTML = "Unmute";
              } else {
                remoteVideo.muted = true;
                btn.innerHTML = "Mute";
              }
            };
            const vdoff = document.createElement("button");
            vdoff.innerHTML = "Stop ";
            vdoff.onclick = () => {
              if (remoteVideo.paused) {
                remoteVideo.play();
                vdoff.innerHTML = "Stop ";
              } else {
                remoteVideo.pause();
                vdoff.innerHTML = "Start ";
              }
            };
            const h1 = document.createElement("h1");
            h1.innerHTML = data?.user || "User";
            const div = document.createElement("div");
            const div2 = document.createElement("div");
            div2.appendChild(vdoff);
            div2.appendChild(btn);
            div.appendChild(remoteVideo);
            div.appendChild(div2);

            div.appendChild(h1);
            div.id = "video-" + user;
            document.querySelector(".videoroom").appendChild(div);
          }
        };
      });
    });
  }

  return <div className="videoroom  bg-gray-900"></div>;
}
