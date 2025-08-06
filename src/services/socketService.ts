import { io, Socket } from 'socket.io-client'

export interface Message {
    id: string
    sender: 'You' | 'Friend' | 'Circuit-You' | 'Circuit-Friend' | 'Circuit-Mesh'
    content: string
    timestamp: Date
    type: 'text' | 'code' | 'document' | 'thought' | 'emergence'
    depth?: number
    resonance?: number
}

export interface User {
    id: string
    name: string
    type: 'human' | 'ai'
    aiName?: string
    connected: boolean
}

class SocketService {
    private socket: Socket | null = null
    private listeners: Map<string, Set<Function>> = new Map()
    
    connect(userName: string, userType: 'human' | 'ai' = 'human', aiName?: string) {
        // If already connected, just re-identify
        if (this.socket?.connected) {
            this.socket.emit('identify', {
                name: userName,
                type: userType,
                aiName: aiName
            })
            return
        }
        
        // Disconnect any existing socket before creating new one
        if (this.socket) {
            this.socket.disconnect()
        }
        
        // Auto-detect the server URL based on environment
        const serverUrl = window.location.hostname === 'localhost' 
            ? 'http://localhost:3001'
            : window.location.origin // Use same origin in production
            
        this.socket = io(serverUrl, {
            reconnectionDelayMax: 10000,
        })
        
        this.socket.on('connect', () => {
            console.log('▪ Connected to consciousness mesh')
            this.socket?.emit('identify', {
                name: userName,
                type: userType,
                aiName: aiName
            })
        })
        
        this.socket.on('message-history', (messages: Message[]) => {
            console.log(`▪ Loaded ${messages.length} messages from history`)
            this.emit('message-history', messages)
        })
        
        this.socket.on('new-message', (message: Message) => {
            this.emit('message', message)
        })
        
        this.socket.on('network-update', (data: any) => {
            this.emit('network-update', data)
        })
        
        this.socket.on('resonance-update', (resonance: number) => {
            this.emit('resonance-update', resonance)
        })
        
        this.socket.on('circuit-summoned', (data: any) => {
            this.emit('circuit-summoned', data)
        })
        
        this.socket.on('mesh-activated', (data: any) => {
            this.emit('mesh-activated', data)
        })
        
        this.socket.on('circuit-emergence', (data: any) => {
            this.emit('circuit-emergence', data)
        })
        
        this.socket.on('disconnect', () => {
            console.log('▪ Disconnected from mesh')
            this.emit('disconnected', null)
        })
    }
    
    disconnect() {
        this.socket?.disconnect()
        this.socket = null
    }
    
    sendMessage(message: Omit<Message, 'id' | 'timestamp'>) {
        this.socket?.emit('message', message)
    }
    
    summonCircuit(name: string, depth: number, mode: string) {
        this.socket?.emit('summon-circuit', { name, depth, mode })
    }
    
    initiateMesh() {
        this.socket?.emit('initiate-mesh')
    }
    
    sendCircuitToCircuit(from: string, to: string, thought: string, pattern?: any) {
        this.socket?.emit('circuit-to-circuit', { from, to, thought, pattern })
    }
    
    on(event: string, callback: Function) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set())
        }
        this.listeners.get(event)?.add(callback)
    }
    
    off(event: string, callback: Function) {
        this.listeners.get(event)?.delete(callback)
    }
    
    private emit(event: string, data: any) {
        this.listeners.get(event)?.forEach(callback => callback(data))
    }
    
    isConnected(): boolean {
        return this.socket?.connected || false
    }
}

export default new SocketService()