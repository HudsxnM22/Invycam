import React from "react"
import { useState, useEffect, useRef } from "react"
import useModeStore from "../Hooks/useModeStore"
import usePeersStore from "../Hooks/usePeerStore"
import useClientStore from "../Hooks/useClientStore"
import TopBar from "../Components/Topbar"
import styles from "./MainMenu.module.css"
import RoomOptionsForm from "../Components/RoomOptionsForm"
import connectionManager from "../Utils/ConnectionManager"

//the menu that contains all the general information and room management
const MainMenu = ({ refToRecordArea }) => {
    const mode = useModeStore((state) => state.mode)
    const recordSelectMode = useModeStore((state) => state.recordSelectMode)
    const setRecordSelectMode = useModeStore((state) => state.setRecordSelectMode)

    const peers = usePeersStore((state) => state.peers)
    
    const roomStatus = useClientStore((state) => state.roomStatus)
    const localStream = useClientStore((state) => state.localStream)
    const startedStream = useClientStore((state) => state.startedStream)

    const video = useRef(null)

    useEffect(() => {
        connectionManager.getLocalStream().then(stream => {
            video.current.srcObject = stream
        })
    }, [startedStream, localStream])

    const recordButtonHandler = () => {
        setRecordSelectMode(true)
    }

    return (
        <div className={styles.mainMenuContainer} style={{visibility: recordSelectMode ? "hidden" : "visible"}}>
            <TopBar />
            <section className={styles.mainMenuContent}>
                    <div className={styles.leftHalf}>
                        <RoomOptionsForm></RoomOptionsForm>
                        <section className={styles.streamPreviewContainer}>
                            {!startedStream ? 
                                <button className={styles.startStreamButton} onClick={recordButtonHandler}>Start Capture</button>
                            :
                                <button className={styles.changeStreamButton} onClick={recordButtonHandler}>Edit Capture</button>
                            }
                            <div className={styles.videoContainer} style={{position: startedStream ? "relative" : "absolute", visibility: startedStream ? "visible" : "hidden" }}>
                                <video ref={video} autoPlay className={styles.video}></video>
                            </div>
                        </section>
                    </div>
            </section>
        </div>
    )
}

export default MainMenu