import React from "react"
import useModeStore from "../Hooks/useModeStore"
import styles from "./TopBar.module.css"
import useClientStore from "../Hooks/useClientStore"
import usePeersStore from "../Hooks/usePeerStore"
import Connection from "../Utils/Connection"
import useNotification from "../Hooks/useNotification"

//top bar of menu contains the X and - to minimize and close the application
const TopBar = ({ tabSelected, setTabSelected }) => {
    const changeMode = useModeStore((state) => state.changeMode)
    const updatePeers = usePeersStore((state) => state.updatePeers)
    const localStream = useClientStore((state) => state.localStream)

    //TODO remove me later
    const roomStatus = useClientStore((state) => state.roomStatus)
    const setRoomStatus = useClientStore((state) => state.setRoomStatus)
    const notify = useNotification((state) => state.notify)

    const minimizeHandler = () => {
        changeMode("operation") //unmount the menu.
        window.ipc.enterOperationMode()
    }

    const exitHandler = async () => {
        window.ipc.closeApp()
    }

    const settingsHandler = () => {
        if(tabSelected === "settings"){
            setTabSelected("mainMenu")
        } else {
            setTabSelected("settings")
        }
    }

    return (
        <span className={styles.topbarContainer}>
            <span className={styles.title}>Invycam</span>
            <button className={styles.topbarButtonContainer} name="settings" onClick={settingsHandler}> 
                  <svg
                    className={styles.gearIcon}
                    viewBox="0 0 24 24"
                    fill="none"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 1.72l-.12.88a2 2 0 0 1-1.18 1.52l-.2.09a2 2 0 0 1-1.9-.18l-.71-.54a2 2 0 0 0-2.63.7l-.22.38a2 2 0 0 0 .63 2.65l.71.54a2 2 0 0 1 .72 1.76v.22a2 2 0 0 1-.8 1.76l-.71.54a2 2 0 0 0-.63 2.65l.22.38a2 2 0 0 0 2.63.7l.71-.54a2 2 0 0 1 1.9-.18l.2.09a2 2 0 0 1 1.18 1.52l.12.88A2 2 0 0 0 11.78 22h.44a2 2 0 0 0 2-1.72l.12-.88a2 2 0 0 1 1.18-1.52l.2-.09a2 2 0 0 1 1.9.18l.71.54a2 2 0 0 0 2.63-.7l.22-.39a2 2 0 0 0-.63-2.65l-.71-.53a2 2 0 0 1-.72-1.76v-.22a2 2 0 0 1 .72-1.76l.71-.54a2 2 0 0 0 .63-2.65l-.22-.38a2 2 0 0 0-2.63-.7l-.71.54a2 2 0 0 1-1.9.18l-.2-.09a2 2 0 0 1-1.18-1.52l-.12-.88A2 2 0 0 0 12.22 2Z" />
                    <circle cx="12" cy="12" r="3" />
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
