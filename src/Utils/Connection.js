

const Connection = class {

    localStream = null //screen recording - only video no audio single track object from local peer
    remoteStream = null

    localSdp = ""
    localIce = []

    peerId = ""
    dataChannel = null


    peerConnection = new RTCPeerConnection(
        {
            iceServers: [
                { urls: "stun:stun.l.google.com:19302" },
                { urls: "stun:stun.l.google.com:5349" },
                { urls: "stun:stun1.l.google.com:3478" },
            ]
        }
    )

    constructor(peerId){
        this.peerId = peerId
    }


    async processAnswer(answerData, localSdpData, localStream){
        this.localStream = localStream.getTracks()[0]

        this.peerConnection.addTrack(this.localStream)
        await this.peerConnection.setLocalDescription(localSdpData.localSdp)
        
        await this.peerConnection.setRemoteDescription(answerData.answerSdp)
        this.listenForRemoteStream()
        
        for(let remoteCandidate of answerData.answerIce){
            this.peerConnection.addIceCandidate(remoteCandidate)
        }
    }


    //localstream == MediaStream
    async createAnswer(offerData, localStream){
        this.localStream = localStream.getTracks()[0]
        
        //set remote description
        await this.peerConnection.setRemoteDescription(offerData.offerSdp)
        for(let remoteCandidate of offerData.offerIce){
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
            answerSdp: this.peerConnection.localDescription,
            answerIce: this.localIce
        }
    }

    gatherIceCandidates(){
        return new Promise((resolve, reject) => {
            const candidates = []

            this.peerConnection.onicecandidate = (e) => {
                if(e.candidate){
                    candidates.push(e.candidate)
                }
                else{
                    resolve(candidates)
                }
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
            if(this.remoteStream){
                resolve(this.remoteStream)
            }
        })
    }
}
export default Connection;

/*
- need to handle ontrack 
- need to handle adding streams - done
- need to handle networkManager passing in correct things - in progress

dont use AI this has been iffy at best with AI its kinda done like a lot of nudging along
*/