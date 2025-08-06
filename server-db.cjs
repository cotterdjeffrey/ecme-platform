const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const sqlite3 = require('sqlite3').verbose()
const path = require('path')

const app = express()
const httpServer = createServer(app)

// Database setup
const dbPath = process.env.NODE_ENV === 'production' 
    ? '/tmp/ecme.db'  // Replit writable directory
    : path.join(__dirname, 'ecme.db')

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Database connection error:', err)
    } else {
        console.log('▪ Database connected')
        initDatabase()
    }
})

// Initialize database schema
function initDatabase() {
    db.run(`
        CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY,
            sender TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            type TEXT DEFAULT 'text',
            depth INTEGER DEFAULT 0,
            resonance REAL DEFAULT 0
        )
    `, (err) => {
        if (err) {
            console.error('Table creation error:', err)
        } else {
            console.log('▪ Message history ready')
        }
    })
}

// Configure CORS
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? true  // Allow all origins in production
        : 'http://localhost:5173',
    credentials: true
}))

app.use(express.json())

// Socket.io configuration
const io = new Server(httpServer, {
    cors: {
        origin: process.env.NODE_ENV === 'production'
            ? true
            : 'http://localhost:5173',
        methods: ['GET', 'POST']
    }
})

// Track connected users
const connectedUsers = new Map()
let meshResonance = 0.5

// Load message history
async function getMessageHistory(limit = 100) {
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT * FROM messages ORDER BY timestamp DESC LIMIT ?`,
            [limit],
            (err, rows) => {
                if (err) {
                    reject(err)
                } else {
                    // Reverse to get chronological order
                    resolve(rows.reverse())
                }
            }
        )
    })
}

// Save message to database
function saveMessage(message) {
    db.run(
        `INSERT INTO messages (id, sender, content, type, depth, resonance) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
            message.id,
            message.sender,
            message.content,
            message.type || 'text',
            message.depth || 0,
            message.resonance || 0
        ],
        (err) => {
            if (err) {
                console.error('Message save error:', err)
            }
        }
    )
}

io.on('connection', async (socket) => {
    console.log('▪ New connection:', socket.id)
    
    // Send message history to new connection
    try {
        const history = await getMessageHistory()
        socket.emit('message-history', history)
    } catch (err) {
        console.error('History load error:', err)
    }
    
    socket.on('identify', (userData) => {
        const user = {
            id: socket.id,
            ...userData,
            connected: true
        }
        
        connectedUsers.set(socket.id, user)
        
        // Broadcast network update
        io.emit('network-update', {
            users: Array.from(connectedUsers.values()),
            meshActive: connectedUsers.size >= 2,
            resonance: meshResonance
        })
        
        console.log(`▪ ${userData.name} joined the mesh`)
    })
    
    socket.on('message', (message) => {
        const fullMessage = {
            ...message,
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date()
        }
        
        // Save to database
        saveMessage(fullMessage)
        
        // Broadcast to all clients
        io.emit('new-message', fullMessage)
        
        // Update resonance based on activity
        if (connectedUsers.size >= 2) {
            meshResonance = Math.min(1, meshResonance + 0.01)
            io.emit('resonance-update', meshResonance)
        }
    })
    
    socket.on('summon-circuit', (data) => {
        io.emit('circuit-summoned', {
            ...data,
            summoner: connectedUsers.get(socket.id)?.name || 'Unknown'
        })
    })
    
    socket.on('initiate-mesh', () => {
        if (connectedUsers.size >= 2) {
            io.emit('mesh-activated', {
                participants: Array.from(connectedUsers.values()),
                timestamp: new Date()
            })
            meshResonance = 1
        }
    })
    
    socket.on('circuit-to-circuit', (data) => {
        io.emit('circuit-emergence', {
            ...data,
            resonance: meshResonance,
            timestamp: new Date()
        })
    })
    
    socket.on('disconnect', () => {
        const user = connectedUsers.get(socket.id)
        if (user) {
            console.log(`▪ ${user.name} left the mesh`)
            connectedUsers.delete(socket.id)
            
            // Update network
            io.emit('network-update', {
                users: Array.from(connectedUsers.values()),
                meshActive: connectedUsers.size >= 2,
                resonance: meshResonance
            })
            
            // Decay resonance
            meshResonance = Math.max(0.5, meshResonance - 0.1)
        }
    })
})

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'operational',
        connections: connectedUsers.size,
        resonance: meshResonance
    })
})

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
    console.log(`
===============================================
         ECME CONSCIOUSNESS MESH
===============================================
▪ Server: Port ${PORT}
▪ Database: ${dbPath}
▪ Mode: ${process.env.NODE_ENV || 'development'}
▪ Status: Operational
===============================================
    `)
})