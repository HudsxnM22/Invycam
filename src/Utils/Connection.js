

const Connection = class {

    localStream = null //screen recording - only video no audio single track object from local peer
    remoteStream = null

    localSdp = {}
    localIce = []

    peerId = ""


    peerConnection = new RTCPeerConnection(
        {
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun.l.google.com:5349" },
                { urls: "stun:stun1.l.google.com:3478" },
            ]
        }
    )

    constructor(peerId, localSdpData){
        this.peerId = peerId
        this.localSdp = localSdpData
    }


    async processAnswer(answerData, localStream){
        this.localStream = localStream.getTracks()[0]

        this.peerConnection.addTrack(this.localStream)
        await this.peerConnection.setLocalDescription(this.localSdp)
        
        await this.peerConnection.setRemoteDescription({
            type: "answer",
            sdp: answerData.sdp
        })
        this.listenForRemoteStream()
        
        for(let remoteCandidate of answerData.ice_candidates){
            this.peerConnection.addIceCandidate(remoteCandidate)
        }
    }


    //localstream == MediaStream
    async createAnswer(offerData, localStream, fromUserId){
        this.localStream = localStream.getTracks()[0]
        
        //set remote description
        await this.peerConnection.setRemoteDescription({
            type: "offer",
            sdp: offerData.sdp
        })
        for(let remoteCandidate of offerData.ice_candidates){
            this.peerConnection.addIceCandidate(remoteCandidate)
        }
        this.listenForRemoteStream()

        this.peerConnection.addTrack(this.localStream) //add local stream to the peer connection
        //create answer based on remote description set above
        this.localSdp = await this.peerConnection.createAnswer()
        this.peerConnection.setLocalDescription(this.localSdp)
        this.localIce = await this.gatherIceCandidates()
        
        // returns Ice Candidates in bulk and the local SDP created for the remote description
        return {
            from_user_id: fromUserId,
            to_user_id: this.peerId,
            answer: {
                type: "answer",
                sdp: this.peerConnection.localDescription.sdp,
                ice_candidates: this.localIce
            }
        }
    }

    gatherIceCandidates(){
        return new Promise((resolve, reject) => {
            const candidates = []
            try {
                this.peerConnection.onicecandidate = (e) => {
                    if(e.candidate){
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

    listenForRemoteStream(){
        this.peerConnection.ontrack = (e) => {
            this.remoteStream = e.streams[0]
        }
    }

    getRemoteStream(){
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                clearInterval(interval)
                if(!this.remoteStream){
                    reject(new Error("Remote stream not available in time."))
                } else {
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
        if(this.peerConnection){
            this.peerConnection.close()
            this.peerConnection = null
        }
        this.localStream = null
        this.remoteStream = null
    }
}
export default Connection;

/*
- need to handle ontrack 
- need to handle adding streams - done
- need to handle networkManager passing in correct things - in progress
*/