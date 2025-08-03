import axios from "axios"
import Connection from "./Connection"
import useClientStore from "../Hooks/useClientStore"
import usePeersStore from "../Hooks/usePeerStore"


const signalingServerUrl = "http://localhost:8000/"

/*
read the README.md for more information on how to use this class.
and why this class is built the way it is.
*/
const state = useClientStore.getState() //update state values to change UI upon changes
const peerState = usePeersStore.getState()

const ConnectionManager = class {

    roomId = ""
    roomStatus = "disconnected"
    userId = ""
    localStream = null
    role = "guest" // or "host", depending on the role in the room
    peerConnections = {}
    roomKey = "" 
    username = "Guest"

    //maybe some window management for the various peers. later

    constructor(){
    }

    async setLocalStream(screenCoordinatesToDraw){
        try {
            // Capture screen
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    frameRate: 10
                },
                
                audio: false
            })


            

            this.localStream = stream
            state.setStartedStream(true)
            state.setLocalStream(this.localStream)
        }catch (error) {
            console.error("Error setting local stream:", error)
            throw error
        }
    }

    async createRoom(roomName, userName){

        if(!roomName || roomName === ""){
            //NotificationSystem.notify("Please provide a valid room name", "error")
            return
        }

        if(this.roomStatus === "disconnected"){
            this.roomStatus = "creating"
            state.setRoomStatus("creating")
            this.username = userName
            state.setUsername(userName)
            try {
                const response = await this.signallingServerCall("createRoom", 
                    {
                        name: roomName,
                        username: userName
                    }
                )

                if(response.data.error){
                    //NotificationSystem.notify(response.data.error, "error") <- this isnt implemented yet
                    this.roomStatus = "disconnected"
                    state.setRoomStatus("disconnected")
                    state.setUsername("")
                    return
                }
                this.roomId = response.data.room_id
                state.setRoomId(this.roomId)
                this.userId = response.data.user_id
                
                this.roomKey = response.data.room_key //only host has access to this key

                //NotificationSystem.notify(response.data.message, "success") <- this isnt implemented yet
                this.roomStatus = "connected"
                state.setRoomStatus("connected")
                this.role = "host"
                state.setRole("host")
                this.startWebSocketConnectionMonitoring()
            }
            catch (error) {
                console.error("Error calling signalling server: ", error)
            }
        }
    }

    async joinRoom(roomId, userName){

        if(!roomId || roomId === ""){
            //NotificationSystem.notify("Please provide a valid room ID", "error") // <- this isnt implemented yet
            return
        }

        if(this.roomStatus === "disconnected"){
            this.roomStatus = "joining"
            state.setStatus("joining")
            this.username = userName
            state.setUsername(userName)
            try {
                const response = await this.signallingServerCall("joinRoom", 
                {
                    room_id: roomId,
                    username: userName
                })

                if(response.data.error){
                    //NotificationSystem.notify(response.data.error, "error") <- this isnt implemented yet
                    this.roomStatus = "disconnected"
                    state.setRoomStatus("disconnected")
                    state.setUsername("")
                    return
                }

            
                this.roomId = response.data.room_id
                state.setRoomId(this.roomId)
                this.userId = response.data.user_id

                //NotificationSystem.notify(response.data.message, "success")
                this.roomStatus = "connected"
                state.setRoomStatus("connected")
                this.role = "guest"
                state.setRole("guest")

                this.startWebSocketConnectionMonitoring()

                //---------------------------------
                this.sendOffer() // send the local SDP offer with bulk ICE candidates to the signalling server which will then distribute it to the other users in the room.
                //----------------------------------
            }
            catch (error) {
                console.error("Error calling signalling server: ", error)
            }
        }
    }

    // close all peer connections. through webRTC along with telling the signalling server they left.
    async leaveRoom(){
        if(this.roomStatus === "connected"){
            this.roomStatus = "leaving"
            state.setStatus("leaving")
            try {
                const response = await this.signallingServerCall("leaveRoom", {
                    room_id: this.roomId,
                    user_id: this.userId
                })

                if(response.data.error){
                    //NotificationSystem.notify(response.data.error, "error") <- this isnt implemented yet
                    this.roomStatus = "connected" // stay connected if leave fails
                    state.setStatus("connected")
                    return
                }

                //NotificationSystem.notify(response.data.message, "success") <- this isnt implemented yet
                this.roomStatus = "disconnected"
                state.setStatus("disconnected")
                this.roomId = ""
                state.setRoomId("")
                this.userId = ""
                state.setUsername("")
                this.roomKey = ""

                // close all peer connections
                for(let peerId in this.peerConnections){
                    peerState.updatePeers([])
                    this.peerConnections[peerId].closeConnection()
                    delete this.peerConnections[peerId]
                }
            }
            catch (error) {
                console.error("Error calling signalling server: ", error)
            }
        }
    }

    async getServerRoomUsers(){
        if(this.roomStatus === "connected"){
            try {
                const response = await this.signallingServerCall("getRoomUsers", {})

                if(response.data.error){
                    //NotificationSystem.notify(response.data.error, "error") // <- this isnt implemented yet
                    return
                }

                return response.data.users // returns an array of users in the room
            }
            catch (error) {
                console.error("Error calling signalling server: ", error)
            }
        }
        else {
            //NotificationSystem.notify("You are not connected to a room", "error") // <- this isnt implemented yet
            return []
        }
    }


    // sends offer to all users in the room
    async sendOffer(){
        if(this.roomStatus === "connected"){
            const usersInRoom = await this.getServerRoomUsers() // array of users in the room

            if(!usersInRoom){
                //NotificationSystem here
                return
            }
            try {
                for(let user of usersInRoom) {
                    if(user.user_id === this.userId){
                        continue
                    }

                    const targetUserId = user.user_id

                    const connection = new Connection(targetUserId)
                    this.peerConnections[targetUserId] = connection

                    const fromUserId = this.userId
                    const toUserId = targetUserId
                    
                    const offerToSend = await connection.createOffer(this.localStream, fromUserId, toUserId)
                    offerToSend.room_id = this.roomId //add room id for some very basic security

                    const response = await this.signallingServerCall("sendOffer", offerToSend)

                    console.log(this.peerConnections)

                    if(response.data.error){
                        //NotificationSystem.notify(response.data.error, "error")
                    }
                }
            }
            catch (error){
                //NotificationSystem.notify("Connection error", "error")
                console.error("sendOffer error: " + error)
            }     
        }
    }

    getRemoteStreams() {
        let remoteStreams = []
        
        for(let peerId in this.peerConnections){
            const connection = this.peerConnections[peerId]
            
            // Return immediately available streams only
            if (connection.remoteStream) {
                remoteStreams.push(connection.remoteStream)
            } else {
                console.log(`Remote stream not yet available for peer ${peerId}`)
            }
        }
        
        return Promise.resolve(remoteStreams)
    }

    // web socket listeners for offers, answers, and events
    async startWebSocketConnectionMonitoring(){
        if(this.roomStatus != "connected"){
            return
        }

        try {
            const url = "ws://localhost:8000/ws/socket/" + this.userId
            const socket = new WebSocket(url)
            socket.onopen = () => {
                console.log("WebSocket connection established")
            }
            socket.onmessage = async (event) => {
                const data = JSON.parse(event.data)

                if(data.error){
                    //NotificationSystem.notify(data.error, "error") // <- this isnt implemented yet
                    return
                }

                let connection = null

                console.log(data)

                switch(data.type) {
                    case "offer":
                        const offerData = data.payload
                        connection = new Connection(offerData.from_user_id)
                        this.peerConnections[offerData.from_user_id] = connection

                        const answer = await connection.createAnswer(offerData.offer, this.localStream, this.userId, offerData.from_user_id)
                        console.log(connection)
                        console.log(answer) //TODO remove this log
                        this.signallingServerCall("sendAnswer", answer)
                        break

                    case "answer":
                        const answerData = data.payload

                        if(!this.peerConnections[answerData.from_user_id]){
                            console.error("Peer answer failure")
                            //NotificationSystem.notify(`Connection to another user failed.`, "info") // <- this isnt implemented yet
                            break
                        }

                        try{
                            const connection = this.peerConnections[answerData.from_user_id]
                            await connection.processAnswer(answerData.answer)
                        }
                        catch (error){
                            console.error("answer websocket error: " + error)
                        }
                        break

                    case "disconnect":
                        const disconnectData = data.payload
                        if(this.peerConnections[disconnectData.user_id]){
                            console.log(this.peerConnections)
                            this.peerConnections[disconnectData.user_id].closeConnection()
                            delete this.peerConnections[disconnectData.user_id]
                            console.log(this.peerConnections)
                        }
                        else {
                            console.warn("No peer connection found for user_id: ", disconnectData.user_id)
                        }
                        break
                    case "host_reallocation":
                        const reallocationData = data.payload
                        //NotificationSystem.notify(`Host has been reallocated to ${reallocationData.message}`, "info") // <- this isnt implemented yet
                        if(this.userId === reallocationData.new_host_id){
                            this.role = "host"
                        }
                        this.roomKey = reallocationData.room_key //only host has access to this key. for kicking users and other host actions
                        break
                }
            }
            socket.onclose = () => {
                // more logging and error handling
                console.log("WebSocket connection closed")
            }
        }
        catch (error) {
            console.error("Error establishing WebSocket connection: ", error)
        }
    }


    //Utils ----========================================================================------------------=====================------------------==========
    
    getUserId(){
        return this.userId
    }

    getRoomId(){
        return this.roomId
    }

    getRoomStatus(){
        return this.roomStatus
    }

    getLocalStream(){
        return new Promise((resolve, reject) => {
            if (this.localStream) {
                resolve(this.localStream)
                return
            }

            const interval = setInterval(() => {
                if(this.localStream){
                    resolve(this.localStream)
                    clearTimeout(timeout)
                }
            }, 100)
            const timeout = setTimeout(() => {
                clearInterval(interval)
                reject(new Error("Failed to fetch local stream"))
            }, 5000)
        })
    }
    

    // This function is used to make calls to the signalling server more readable and maintainable.
    signallingServerCall(type, payload){
        switch(type) {
            case "createRoom":
                return axios.post(signalingServerUrl + "api/create-room", payload)
            case "joinRoom":
                return axios.post(signalingServerUrl + "api/join-room", payload)
            case "leaveRoom":
                return axios.post(signalingServerUrl + "api/leave-room", payload)
            case "sendOffer":
                return axios.post(signalingServerUrl + "api/offer", payload)
            case "sendAnswer":
                return axios.post(signalingServerUrl + "api/answer", payload)
            case "getRoomUsers":
                return axios.get(signalingServerUrl + "api/get-room-users/" + this.roomId + "/" + this.userId)
            default:
                throw new Error("Unknown signalling server call type: " + type) //TODO: error notification
        }
    }
}

const connectionManager = new ConnectionManager //module level instance. so I can avoid state police.
export default connectionManager

