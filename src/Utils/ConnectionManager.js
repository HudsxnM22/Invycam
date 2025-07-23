import axios from "axios"
import Connection from "./Connection"

const signalingServerUrl = "http://localhost:8000/api/"

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
    peerConnections = []
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

    async createRoom(roomName){
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
                        name: roomName
                    }
                )

                if(response.data.error){
                    //NotificationSystem.notify(response.data.error, "error") <- this isnt implemented yet
                    this.roomStatus = "disconnected"
                    return
                }
                this.roomId = response.data.room_id
                this.userId = response.data.user_id

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

    async joinRoom(roomId){
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

                if(this.peerConnections.length > 0){
                    this.peerConnections.forEach(pc => pc.closeConnection())
                    this.peerConnections = []
                }
            }
            catch (error) {
                console.error("Error calling signalling server: ", error)
            }
        }
    }

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

    

    // Listeners - these are hung requests for the signalling server to send us offers, answers, and events

    // will listen for offers from the signalling server and create a peer connection for each offer received.
    async listenForOffers(){
        try {
            const response = await this.signallingServerCall("listenForOffers", {})
            if(response.data.error){
                //NotificationSystem.notify(response.data.error, "error") // <- this isnt implemented yet
                return
            }
            
            const fromUserId = response.data.offer.from_user_id
            const offerData = response.data.offer.offer

            const localSdpData = { // for parsing in the Connection class
                type: "offer",
                sdp: this.localSdpOfferWithBulkIceCandidates.offer.sdp
            }

            const newPeerConnection = new Connection(fromUserId, localSdpData)
            this.peerConnections.push(newPeerConnection)
            const answer = await newPeerConnection.createAnswer(offerData, this.localStream, this.userId)
            
            const answerResponse = await this.signallingServerCall("sendAnswer", answer)
            if(answerResponse.data.error){
                //NotificationSystem.notify(answerResponse.data.error, "error") // <- this isnt implemented yet
                return 
            }
        //NotificationSystem.notify(answerResponse.data.message, "success") // <- this isnt implemented yet
        } catch (error) {
            console.error("Error calling signalling server: ", error) //TODO: error notification
            return
        }

        this.listenForOffers()
    }

    async listenForAnswers(){
        try {
            // This will hang until an answer is received from the signalling server
            const response = await this.signallingServerCall("listenForAnswers", {})
            if(response.data.error){
                //NotificationSystem.notify(response.data.error, "error") // <- this isnt implemented yet
                return
            }

            const localSdpData = { // for parsing in the Connection class
                type: "offer",
                sdp: this.localSdpOfferWithBulkIceCandidates.offer.sdp
            }

            const fromUserId = response.data.answer.from_user_id
            const answerData = response.data.answer.answer
            const newPeerConnection = new Connection(fromUserId, localSdpData)
            this.peerConnections.push(newPeerConnection)
            await newPeerConnection.processAnswer(answerData, this.localStream)
        } catch (error) {
            console.error("Error calling signalling server: ", error) //TODO: error notification
            return
        }

        this.listenForAnswers()
    }

    //Utils ----

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
        return new Promise((resolve) => {
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
        })
    }

    // This function is used to make calls to the signalling server more readable and maintainable.
    signallingServerCall(type, payload){
        switch(type) {
            case "createRoom":
                return axios.post(signalingServerUrl + "create-room", payload)
            case "joinRoom":
                return axios.post(signalingServerUrl + "join-room", payload)
            case "leaveRoom":
                return axios.post(signalingServerUrl + "leave-room", payload)
            case "sendOffer":
                return axios.post(signalingServerUrl + "offer", payload)
            case "sendAnswer":
                return axios.post(signalingServerUrl + "answer", payload)

            case "listenForOffers":
                return axios.get(signalingServerUrl + "wait-for-offer/" + this.userId)
            case "listenForAnswers":
                return axios.get(signalingServerUrl + "wait-for-answer/" + this.userId)
            
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