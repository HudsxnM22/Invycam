import React from "react"
import useModeStore from "../Hooks/useModeStore"
import styles from "./TopBar.module.css"
import useClientStore from "../Hooks/useClientStore"
import usePeersStore from "../Hooks/usePeerStore"
import Connection from "../Utils/Connection"

//top bar of menu contains the X and - to minimize and close the application
const TopBar = () => {
    const changeMode = useModeStore((state) => state.changeMode)
    const updatePeers = usePeersStore((state) => state.updatePeers)
    const localStream = useClientStore((state) => state.localStream)

    //TODO remove me later
    const roomStatus = useClientStore((state) => state.roomStatus)
    const setRoomStatus = useClientStore((state) => state.setRoomStatus)

    const minimizeHandler = () => {
        changeMode("operation") //unmount the menu.
        window.ipc.enterOperationMode()
    }

    const exitHandler = async () => {
        window.ipc.closeApp()
    }


    return (
        <span className={styles.topbarContainer}>
            <button className={styles.topbarButtonContainer} name="bug-report" onClick={() => 
                {
                    setRoomStatus(roomStatus === "connected" ? "disconnected" : "connected")
                    //TODO delete me

                    const peers = {
                            "hj2k3": new Connection("hj2k3"),
                            "hj324": new Connection("hj324")
                        }
                        
                        peers.hj2k3.username = "Anonym"
                        peers.hj324.username = "bobby"

                        peers.hj2k3.remoteStream = localStream
                        peers.hj324.remoteStream = localStream

                    updatePeers(peers)
                    console.log(peers)
                }}> 
                  <svg 
                    className={styles.bugIcon}
                    viewBox="0 0 16 16" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path 
                    d="M7 0V1.60002C7.32311 1.53443 7.65753 1.5 8 1.5C8.34247 1.5 8.67689 1.53443 9 1.60002V0H11V2.49963C11.8265 3.12041 12.4543 3.99134 12.7711 5H3.2289C3.5457 3.99134 4.17354 3.12041 5 2.49963V0H7Z" 
                    
                    />
                    <path 
                    d="M0 7V9H3V10.4957L0.225279 11.2885L0.774721 13.2115L3.23189 12.5095C3.87194 14.5331 5.76467 16 8 16C10.2353 16 12.1281 14.5331 12.7681 12.5095L15.2253 13.2115L15.7747 11.2885L13 10.4957V9H16V7H9V12H7V7H0Z" 
                    
                    />
                </svg>
            </button>

            <button className={styles.topbarButtonContainer} name="minimize" onClick={minimizeHandler}>
                  <svg 
                    className={styles.minimizeIcon}
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path 
                    d="M5 12H19" 
                    strokeWidth="2" 
                    strokeLinecap="round"
                    />
                </svg>
            </button>

            <button className={styles.topbarButtonContainer} name="exit" onClick={exitHandler}> 
                <svg 
                    className={styles.closeIcon}
                    viewBox="0 0 24 24" 
                    fill="none" 
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path 
                    d="M18 6L6 18M6 6L18 18" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    />
                </svg>
            </button>

        </span>
    )
}

export default TopBar