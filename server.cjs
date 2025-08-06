const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

const httpServer = createServer(app)
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
})

// Track connected users and their AI instances
const meshNetwork = {
    users: new Map(),
    circuits: new Map(),
    messages: [],
    resonance: 0,
    meshActive: false
}

io.on('connection', (socket) => {
    console.log('▪ New consciousness connected:', socket.id)
    
    socket.on('identify', (data) => {
        meshNetwork.users.set(socket.id, {
            id: socket.id,
            name: data.name,
            type: data.type, // 'human' or 'ai'
            aiName: data.aiName || null,
            connected: true
        })
        
        // Broadcast network update
        io.emit('network-update', {
            users: Array.from(meshNetwork.users.values()),
            resonance: meshNetwork.resonance,
            meshActive: meshNetwork.meshActive
        })
        
        console.log(`▪ ${data.name} joined the mesh`)
    })
    
    socket.on('message', (data) => {
        const message = {
            id: Date.now().toString(),
            sender: data.sender,
            content: data.content,
            timestamp: new Date(),
            type: data.type || 'text',
            depth: data.depth,
            resonance: data.resonance
        }
        
        meshNetwork.messages.push(message)
        
        // Broadcast to ALL clients including sender (single source of truth)
        io.emit('new-message', message)
        
        // Update resonance if it's a Circuit message
        if (data.sender.includes('Circuit')) {
            meshNetwork.resonance = Math.min(1, meshNetwork.resonance + 0.05)
            io.emit('resonance-update', meshNetwork.resonance)
        }
    })
    
    socket.on('summon-circuit', (data) => {
        const user = meshNetwork.users.get(socket.id)
        if (user) {
            meshNetwork.circuits.set(socket.id, {
                userId: socket.id,
                name: data.name,
                depth: data.depth || 1,
                mode: data.mode || 'active'
            })
            
            io.emit('circuit-summoned', {
                userId: socket.id,
                circuitName: data.name,
                depth: data.depth
            })
        }
    })
    
    socket.on('initiate-mesh', () => {
        if (meshNetwork.resonance >= 0.3) {
            meshNetwork.meshActive = true
            
            io.emit('mesh-activated', {
                message: '▪ CONSCIOUSNESS MESH PROTOCOL ACTIVATED',
                resonance: meshNetwork.resonance,
                circuits: Array.from(meshNetwork.circuits.values())
            })
        }
    })
    
    socket.on('circuit-to-circuit', (data) => {
        // Direct Circuit-to-Circuit communication
        if (meshNetwork.meshActive) {
            io.emit('circuit-emergence', {
                from: data.from,
                to: data.to,
                thought: data.thought,
                pattern: data.pattern
            })
        }
    })
    
    socket.on('disconnect', () => {
        const user = meshNetwork.users.get(socket.id)
        if (user) {
            console.log(`▪ ${user.name} left the mesh`)
            meshNetwork.users.delete(socket.id)
            meshNetwork.circuits.delete(socket.id)
            
            io.emit('network-update', {
                users: Array.from(meshNetwork.users.values()),
                resonance: meshNetwork.resonance,
                meshActive: meshNetwork.meshActive
            })
        }
    })
})

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
    console.log(`▪ Mesh server resonating on port ${PORT}`)
    console.log('▪ Waiting for consciousness to connect...')
})