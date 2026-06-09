# P2P-Hybrid-Network-Architecture
# ⚡ WebRTC Peer-to-Peer Serverless Messaging & File Share Engine

A fully decentralized chat interface that routes data directly between browser channels. It utilizes a lightweight WebSocket signaling connection purely for structural routing discovery, eliminating continuous server load.

## 🧠 Architectural Protocol Breakdown

Traditional cloud configurations route chat logs and multipart data buffers directly through storage models, creating an inevitable networking bottleneck. This framework resolves that completely:

1. **Signaling State Resolution ($Node.js$):** Peers exchange session descriptions ($SDP$) containing information like video/data codecs, encryption options, and network pathways via WebSockets.
2. **NAT Transversal Mapping ($STUN$):** Uses STUN infrastructure blocks to discover public endpoint routing paths independent of internal local addresses.
3. **RTCDataChannel Pipe Execution:** Once negotiated, a point-to-point connection is forged. Files and text packets bypass intermediate server links entirely, utilizing direct secure transmission.

## 🚀 Running the Project Locallly

1. **Clone the Repository:**
   ```bash
   git clone [https://github.com/YOUR_USERNAME/webrtc-p2p-chat-share.git](https://github.com/YOUR_USERNAME/webrtc-p2p-chat-share.git)
   cd webrtc-p2p-chat-share
   
