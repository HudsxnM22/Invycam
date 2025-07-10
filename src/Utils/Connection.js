

const Connection = class {

    localStream = null
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


    processAnswer(answerData, localSdpData, localStream){

        this.peerConnection.setLocalDescription(localSdpData.localSdp)
        
        this.peerConnection.setRemoteDescription(answerData.answerSdp)
        
        for(let remoteCandidate of answerData.answerIce){
            this.peerConnection.addIceCandidate(remoteCandidate)
        }
    }


    async createAnswer(offerData, localStream){
        
        //set remote description
        this.peerConnection.setRemoteDescription(offerData.offerSdp)
        for(let remoteCandidate of offerData.offerIce){
            this.peerConnection.addIceCandidate(remoteCandidate)
        }

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
}
export default Connection;

/*
- need to handle ontrack
- need to handle adding streams
- need to handle networkManager passing in correct things

dont use AI this has been iffy at best with AI its kinda done like a lot of nudging along
*/