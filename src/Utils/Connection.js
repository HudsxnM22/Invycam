

const Connection = class {

    localStream = null //screen recording - only video no audio single track object from local peer
    remoteStream = null

    localSdp = {}
    localIce = []

    peerId = ""

    username = ""
    isHost = false //for visualization purposes only
    onScreen = false //whether the peer is currently being displayed on the screen or not


    peerConnection = new RTCPeerConnection(
        {
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" }
            ]
        }
    )

    constructor(peerId){
        this.peerId = peerId
        this.peerConnection.addEventListener('track', async (event) => {
            this.remoteStream = event.streams[0]
        })
    }


    async createOffer(localStream, fromUserId, toUserId){

        this.localStream = localStream.getTracks()[0]

        this.peerConnection.addTrack(this.localStream, localStream)

        this.localSdp = await this.peerConnection.createOffer()
        await this.peerConnection.setLocalDescription(this.localSdp)

        this.localIce = await this.gatherIceCandidates()

        console.log(this.peerId + " " + this.peerConnection.signalingState) 

        return {
            from_user_id: fromUserId,
            to_user_id: toUserId,
            offer: {
                type: "offer",
                sdp: this.localSdp.sdp,
                ice_candidates: this.localIce
            }
        }
    }

    async processAnswer(answerData){
        console.log("processes answer")
        
        await this.peerConnection.setRemoteDescription({
            type: "answer",
            sdp: answerData.sdp
        })

        for(let remoteCandidate of answerData.ice_candidates){
            this.peerConnection.addIceCandidate(remoteCandidate)
        }   

        console.log(this.peerId + " " + this.peerConnection.signalingState)
    }


    //localstream == MediaStream
    async createAnswer(offerData, localStream, fromUserId, targetId){

        this.localStream = localStream.getTracks()[0]

        this.peerConnection.addTrack(this.localStream, localStream) //add local stream to the peer connection
        
        //set remote description
        await this.peerConnection.setRemoteDescription({
            type: "offer",
            sdp: offerData.sdp
        })
        for(let remoteCandidate of offerData.ice_candidates){
            this.peerConnection.addIceCandidate(remoteCandidate)
        }
        
        //create answer based on remote description set above
        this.localSdp = await this.peerConnection.createAnswer()
        this.peerConnection.setLocalDescription(this.localSdp)
        this.localIce = await this.gatherIceCandidates()

        console.log(this.peerId + " " + this.peerConnection.signalingState)
        
        // returns Ice Candidates in bulk and the local SDP created for the remote description
        return {
            from_user_id: fromUserId,
            to_user_id: targetId,
            answer: {
                type: "answer",
                sdp:  this.peerConnection.localDescription.sdp,
                ice_candidates: this.localIce
            }
        }
    }

    gatherIceCandidates(){

        console.log("gather ice called")
        return new Promise((resolve, reject) => {
            const candidates = []
            try {
                this.peerConnection.onicecandidate = (e) => {
                    if(e.candidate){
                        console.log("ice candidate found")
                        candidates.push(e.candidate)
                    }
                    else{
                        resolve(candidates)
                    }
                }

            } catch (error) {
                console.error("Error gathering ICE candidates: ", error)
                //NotificationSystem.notify("Critical failure please restart app.", "error")
                reject(error)
            }
        })
    }

    getRemoteStream(){
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                clearInterval(interval)
                if(!this.remoteStream){
                    reject(new Error("Remote stream not available in time."))
                } else {
                    console.log("remote stream found webRTC connection established.")
                    resolve(this.remoteStream)
                }
            }, 60000) // minute time out

            const interval = setInterval(() => {
                if(this.remoteStream){
                    clearInterval(interval)
                    clearTimeout(timeout)
                    resolve(this.remoteStream)
                }
            }, 100) // check every 100ms
        })
    }

    closeConnection(){ //double check this logic with the connection manager
        console.log("attempting to close connection with: " + this.peerId)
        if(this.peerConnection){
            this.peerConnection.close()
            this.peerConnection = null
        }
        this.localStream = null
        this.remoteStream = null
        console.log("closed conneciton with: " + this.peerId)
    }
}
export default Connection;

/*
- need to handle ontrack 
- need to handle adding streams - done
- need to handle networkManager passing in correct things - in progress
*/