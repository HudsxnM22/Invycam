import React from "react"
import { useState, useEffect } from "react"
import useModeStore from "../Hooks/useModeStore"
import usePeersStore from "../Hooks/usePeerStore"
import useClientStore from "../Hooks/useClientStore"
import TopBar from "../Components/Topbar"
import styles from "./MainMenu.module.css"

//the menu that contains all the general information and room management
const MainMenu = (ConnectionManager) => {
    const mode = useModeStore((state) => state.mode)
    const peers = usePeersStore((state) => state.peers)
    const isStreamstarted = useClientStore((state) => state.startedStream)
    const roomStatus = useClientStore((state) => state.roomStatus)
    const [recordSelectMode, setRecordSelectMode] = useState(false)


    const recordButtonHandler = () => {
        setRecordSelectMode(true)
        
    }

    return (
        <div className={styles.mainMenuContainer} style={{visibility: recordSelectMode ? "hidden" : "visible"}}>
            <TopBar />
            <section className={styles.mainMenuContent}>
                {isStreamstarted ? 
                    roomStatus === "connected" ?
                        <h3>connected</h3>
                    :
                        <h3>disconnected</h3>
                :
                    <>
                        <h3 className={styles.introToApp}>Welcome Select Recording Area</h3>
                        <button className={styles.startRecordButton} onClick={recordButtonHandler}>Select Record Area</button>
                    </>
                }
            </section>
        </div>
    )
}

export default MainMenu