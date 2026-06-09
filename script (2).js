let ws = new WebSocket('ws://localhost:8080');
let localName = "";
let targetPeerName = "";
let peerConnection = null;
let dataChannel = null;

// Public Google STUN Servers to map global NAT routes
const rtcConfig = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19002' }]
};

ws.onmessage = async (msg) => {
    const data = JSON.parse(msg.data);
    
    if (data.type === 'peer-list') {
        renderPeerList(data.peers);
    } else if (data.type === 'signal') {
        handleSignalingData(data.signal, data.sender);
    }
};

function registerSelf() {
    localName = document.getElementById('username').value.trim();
    if(localName) {
        ws.send(JSON.stringify({ type: 'register', name: localName }));
        document.getElementById('connection-status').innerText = `Online as: ${localName}`;
    }
}

function renderPeerList(peers) {
    const listUi = document.getElementById('peer-list-ui');
    listUi.innerHTML = "";
    peers.forEach(peer => {
        if(peer !== localName) {
            const li = document.createElement('li');
            li.innerText = `Connect to: ${peer}`;
            li.onclick = () => initiateP2PLink(peer);
            listUi.appendChild(li);
        }
    });
}

// 1. Initial Offer Creation
async function initiateP2PLink(targetPeer) {
    targetPeerName = targetPeer;
    initiateRTCConnection();
    
    // Create the primary explicit DataChannel instance
    dataChannel = peerConnection.createDataChannel("chat-and-files");
    bindChannelEvents(dataChannel);
    
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    ws.send(JSON.stringify({ type: 'signal', target: targetPeerName, signal: offer }));
}

function initiateRTCConnection() {
    peerConnection = new RTCPeerConnection(rtcConfig);
    
    // Forward ICE Network configurations via the signaling server channel
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            ws.send(JSON.stringify({
                type: 'signal', target: targetPeerName, 
                signal: { type: 'candidate', candidate: event.candidate }
            }));
        }
    };
}

// 2. Automated Handshake Answering Engine 
async function handleSignalingData(signal, sender) {
    targetPeerName = sender;
    
    if (!peerConnection) {
        initiateRTCConnection();
        // If the peer created the data channel, grab it here
        peerConnection.ondatachannel = (event) => {
            dataChannel = event.channel;
            bindChannelEvents(dataChannel);
        };
    }
    
    if (signal.type === 'offer') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        ws.send(JSON.stringify({ type: 'signal', target: targetPeerName, signal: answer }));
    } else if (signal.type === 'answer') {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
    } else if (signal.type === 'candidate') {
        await peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate));
    }
}

function bindChannelEvents(channel) {
    channel.onopen = () => {
        document.getElementById('chat-input').disabled = false;
        document.getElementById('file-input').disabled = false;
        document.getElementById('send-btn').disabled = false;
        logMessage("🔄 Direct Encrypted P2P Data Pipe Established!");
    };
    channel.onmessage = (event) => handleIncomingData(event.data);
}

function sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if(text && dataChannel) {
        dataChannel.send(JSON.stringify({ type: 'text', value: text }));
        logMessage(`Me: ${text}`);
        input.value = "";
    }
}

function logMessage(msg) {
    const win = document.getElementById('chat-window');
    win.innerHTML += `<p>${msg}</p>`;
    win.scrollTop = win.scrollHeight;
}

// 3. Decentralized File Stream Handler (ArrayBuffer Slicing)
let fileChunks = [];
function handleIncomingData(data) {
    if (typeof data === 'string') {
        const meta = JSON.parse(data);
        if(meta.type === 'text') logMessage(`${targetPeerName}: ${meta.value}`);
        if(meta.type === 'file-start') { fileChunks = []; }
    } else {
        // Binary raw array chunks received
        fileChunks.push(data);
        document.getElementById('progress-bar').innerText = `Receiving file payload parts...`;
        
        // Assembler Logic
        const blob = new Blob(fileChunks);
        const url = URL.createObjectURL(blob);
        logMessage(`📂 Received File: <a href="${url}" download="p2p_shared_file">Download File</a>`);
    }
}