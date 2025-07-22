
const ConnectionManager = class {

    localSdpOfferWithBulkIceCandidates = {
        user_id: "",
        offer: {}
    }
    roomId = ""
    roomStatus = "disconnected"
    userId = ""
    localStream = null
    role = "guest" // or "host", depending on the role in the room
    //maybe some window management for the various peers. later

    constructor(coordsToRecord){
        // Init the connection manager with the local SDP with bulk ice candidates

        this.startLocalStream(coordsToRecord).then((localStream) => { //TODO: create this function. crop the stream and cap the resolution and FPS. will return a MediaStream
            this.localStream = localStream
            this.createLocalSdpOfferWithBulkIceCandidates(localStream)
        }).catch((error) => {
            console.error("Error starting local stream:", error) //TODO: error notification
        })
    }

    createLocalSdpOfferWithBulkIceCandidates(localStream){
        const temporaryRTC = new RTCPeerConnection(
        {
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun.l.google.com:5349" },
                { urls: "stun:stun1.l.google.com:3478" },
            ]
        })
        temporaryRTC.addTrack(localStream.getTracks()[0])
        temporaryRTC.createOffer().then(this.gatherIceCandidates(temporaryRTC).then((localSdp) => {
            this.localSdpOfferWithBulkIceCandidates.offer = localSdp
            temporaryRTC.close()
        })).catch((error) => {
            temporaryRTC.close()
            console.error("Error creating offer:", error) //TODO: error notification
        })
    }

    async gatherIceCandidates(temporaryRTC){
        return new Promise((resolve) => {
            temporaryRTC.onicecandidate = (event) => {
                if(event.candidate){
                    this.localSdpOfferWithBulkIceCandidates.offer.ice_candidates.push(event.candidate)
                } else {
                    //no more candidates
                    temporaryRTC.onicecandidate = null
                    resolve(this.localSdpOfferWithBulkIceCandidates)
                }
            }
        })
    }


}

/*
User gets given id upon joining a room, or creating a room - see signalling server API for more details.

Offer object structure for signalling server for development purposes only.:

{
  "user_id": "user_xyz",
  "offer": {
    
  }
}
*/