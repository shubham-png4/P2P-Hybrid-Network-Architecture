const { WebSocketServer } = require('ws');

// Initialize a WebSocket server on port 8080
const wss = new WebSocketServer({ port: 8080 });
console.log("⚡ Signaling Matchmaker Server running on ws://localhost:8080");

// Track connected peers in a map structure
const clients = new Map();

wss.on('connection', (ws) => {
    let clientName = null;

    ws.on('message', (message) => {
        const data = JSON.parse(message);
        
        switch (data.type) {
            # 1. Handle peer registration state
            case 'register':
                clientName = data.name;
                clients.set(clientName, ws);
                console.log(`👤 Peer registered: ${clientName}`);
                broadcastPeerList();
                break;
                
            # 2. Forward WebRTC handshake tokens (Offers, Answers, ICE Candidates)
            case 'signal':
                const targetClient = clients.get(data.target);
                if (targetClient) {
                    targetClient.send(JSON.stringify({
                        type: 'signal',
                        sender: clientName,
                        signal: data.signal
                    }));
                }
                break;
        }
    });

    ws.on('close', () => {
        if (clientName) {
            clients.delete(clientName);
            console.log(`❌ Peer disconnected: ${clientName}`);
            broadcastPeerList();
        }
    });
});

function broadcastPeerList() {
    const list = Array.from(clients.keys());
    const message = JSON.stringify({ type: 'peer-list', peers: list });
    for (const ws of clients.values()) {
        ws.send(message);
    }
}