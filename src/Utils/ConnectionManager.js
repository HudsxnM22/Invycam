import axios from "axios"
import Connection from "./Connection"

const signalingServerUrl = "http://localhost:8000/"

/*
read the README.md for more information on how to use this class.
and why this class is built the way it is.
*/

const ConnectionManager = class {

    localSdpOfferWithBulkIceCandidates = {
        user_id: "",
        offer: {
            ice_candidates: []
        }
    }
    sdpInitialized = false // flag variable this is used to check if the local SDP has been initialized with bulk ICE candidates
    roomId = ""
    roomStatus = "disconnected"
    userId = ""
    localStream = null
    role = "guest" // or "host", depending on the role in the room
    peerConnections = {}
    roomKey = "" 
    //maybe some window management for the various peers. later

    constructor(coordsToRecord){
        // Init the connection manager with the local SDP with bulk ice candidates

        this.startLocalStream(coordsToRecord).then((localStream) => { //TODO: create this function. crop the stream and cap the resolution and FPS. will return a MediaStream
            this.localStream = localStream
            this.createLocalSdpOfferWithBulkIceCandidates(localStream)

            //start answer, offer, and event listener
            this.listenForOffers()
            this.listenForAnswers()
            //this.listenForEvents() <- this is not implemented yet
        }).catch((error) => {
            console.error("Error starting local stream:", error) //TODO: error notification
        })
    }

    async startLocalStream(coordsToRecord){
        // This function should return a MediaStream object with the local video/audio stream
        // TODO: implement this function to get the user's media stream
    }

    async createRoom(roomName, userName){
        await this.waitForLocalSdpOfferWithBulkIceCandidates()

        if(!roomName || roomName === ""){
            //NotificationSystem.notify("Please provide a valid room name", "error")
            return
        }

        if(this.roomStatus === "disconnected"){
            this.roomStatus = "creating"
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
                    return
                }
                this.roomId = response.data.room_id
                this.userId = response.data.user_id
                this.roomKey = response.data.room_key //only host has access to this key

                //NotificationSystem.notify(response.data.message, "success") <- this isnt implemented yet
                this.roomStatus = "connected"
                this.role = "host"
                this.localSdpOfferWithBulkIceCandidates.user_id = this.userId
            }
            catch (error) {
                console.error("Error calling signalling server: ", error)
            }
        }
    }

    async joinRoom(roomId, userName){
        await this.waitForLocalSdpOfferWithBulkIceCandidates()

        if(!roomId || roomId === ""){
            //NotificationSystem.notify("Please provide a valid room ID", "error") // <- this isnt implemented yet
            return
        }

        if(this.roomStatus === "disconnected"){
            this.roomStatus = "joining"
            try {
                const response = await this.signallingServerCall("joinRoom", 
                {
                    room_id: roomId,
                    username: userName
                })

                if(response.data.error){
                    //NotificationSystem.notify(response.data.error, "error") <- this isnt implemented yet
                    this.roomStatus = "disconnected"
                    return
                }

                this.roomId = response.data.room_id
                this.userId = response.data.user_id

                //NotificationSystem.notify(response.data.message, "success")
                this.roomStatus = "connected"
                this.role = "guest"
                this.localSdpOfferWithBulkIceCandidates.user_id = this.userId

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
            try {
                const response = await this.signallingServerCall("leaveRoom", this.userId)

                if(response.data.error){
                    //NotificationSystem.notify(response.data.error, "error") <- this isnt implemented yet
                    this.roomStatus = "connected" // stay connected if leave fails
                    return
                }

                //NotificationSystem.notify(response.data.message, "success") <- this isnt implemented yet
                this.roomStatus = "disconnected"
                this.roomId = ""
                this.userId = ""
                this.roomKey = ""

                // close all peer connections
                for(let peerId in this.peerConnections){
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
        await this.waitForLocalSdpOfferWithBulkIceCandidates()
        

        if(this.roomStatus === "connected"){
            try {
                
                const response = await this.signallingServerCall("sendOffer", this.localSdpOfferWithBulkIceCandidates)

                if(response.data.error){
                    //NotificationSystem.notify(response.data.error, "error")
                    return
                }
                
                //NotificationSystem.notify(response.data.message, "success")

            }
            catch (error) {
                console.error("Error calling signalling server: ", error)
            }
        }
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

                switch(data.type) {
                    case "offer":
                        const offerData = data.payload
                        connection = new Connection(offerData.from_user_id, {
                            type: "offer",
                            sdp: this.localSdpOfferWithBulkIceCandidates.offer.sdp // send without ice candidates
                        })

                        this.peerConnections[offerData.user_id] = connection
                        const answer = await connection.createAnswer(offerData.offer, this.localStream, this.userId)
                        console.log(answer) //TODO remove this log
                        this.signallingServerCall("sendAnswer", answer)
                        break

                    case "answer":
                        const answerData = data.payload
                        connection = new Connection(answerData.from_user_id, {
                            type: "offer",
                            sdp: this.localSdpOfferWithBulkIceCandidates.offer.sdp // send without ice candidates
                        })
                        this.peerConnections[answerData.from_user_id] = connection
                        await connection.processAnswer(answerData.answer, this.localStream)
                        break

                    case "disconnect":
                        const disconnectData = data.payload
                        if(this.peerConnections[disconnectData.user_id]){
                            this.peerConnections[disconnectData.user_id].closeConnection()
                            delete this.peerConnections[disconnectData.user_id]
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

    waitForLocalSdpOfferWithBulkIceCandidates(){
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                clearInterval(interval)
                if(!this.sdpInitialized){
                    reject(new Error("Local SDP offer with bulk ICE candidates not initialized in time."))
                } else {
                    resolve()
                }
            }, 30000) // 30 seconds timeout

            const interval = setInterval(() => {
                if(this.sdpInitialized){
                    clearInterval(interval)
                    clearTimeout(timeout)
                    resolve()
                }
            }, 50) // check every 100ms
        })
    }
    
    getUserId(){
        return this.userId
    }

    getRoomId(){
        return this.roomId
    }

    getRoomStatus(){
        return this.roomStatus
    }

    async createLocalSdpOfferWithBulkIceCandidates(localStream){

        const temporaryRTC = new RTCPeerConnection(
            {
                iceServers: [
                    { urls: "stun:stun.l.google.com:19302" },
                    { urls: "stun:stun.l.google.com:5349" },
                    { urls: "stun:stun1.l.google.com:3478" },
                ]
            })

        try{
            
            temporaryRTC.addTrack(localStream.getTracks()[0])
            const offer = await temporaryRTC.createOffer()

            this.localSdpOfferWithBulkIceCandidates.offer.type = offer.type
            this.localSdpOfferWithBulkIceCandidates.offer.sdp = offer.sdp
            await temporaryRTC.setLocalDescription(offer)
            await this.gatherIceCandidates(temporaryRTC)

            temporaryRTC.close() // close the temporary RTC connection after gathering ICE candidates. we only need the SDP and ICE candidates for peer connections. handled by the Connection class.
        }catch(error){
            console.error("Error creating local SDP offer with bulk ICE candidates: ", error)
            temporaryRTC.close()
        }
    }

    async gatherIceCandidates(temporaryRTC){
        return new Promise((resolve, reject) => {
            try {
                temporaryRTC.onicecandidate = (event) => {
                    if(event.candidate){
                        this.localSdpOfferWithBulkIceCandidates.offer.ice_candidates.push(event.candidate)
                    } else {
                        //no more candidates
                        temporaryRTC.onicecandidate = null
                        this.sdpInitialized = true // set the flag to true when all candidates are gathered
                        resolve()
                    }
                }
            } catch (error) {
                //NotificationSystem.notify("Critical failure please restart app.", "error") // <- this isnt implemented yet
                console.error("Error gathering ICE candidates: ", error)
                reject()
            }
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
} // <-- Add this closing brace for the class

/*
User gets given id upon joining a room, or creating a room - see signalling server API for more details.

Offer object structure for signalling server for development purposes only.:

{
  "user_id": "user_xyz",
  "offer": {
    
  }
}
*/