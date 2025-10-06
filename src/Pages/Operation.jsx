import React from "react"
import useModeStore from "../Hooks/useModeStore"
import styles from "./Operation.module.css"
import { useEffect } from "react"
import OnScreenRemoteStream from "../Components/OperationMode/OnScreenRemoteStream"


const Operation = () => {
    const setMode = useModeStore((state) => state.changeMode)
    const onScreenPeers = useModeStore((state) => state.onScreenPeers)
    const populateOnScreenPeers = () => {
        return Object.keys(onScreenPeers).map((peerId) => {
            return <OnScreenRemoteStream key={peerId} peer={onScreenPeers[peerId]} />
        })
    }

    useEffect(() => {
        document.addEventListener("keypress", handleEnterKey)
    
        return () => {
          document.removeEventListener("keypress", handleEnterKey)
        }
    }, [onScreenPeers])

    //TODO remove this just for testing purposes
    const handleEnterKey = (e) => {
        console.log(e.key)
        if (e.key === "Enter") {
            //TODO save changes
            setMode("menu")
        }
    }

    return (
        <div className={styles.operatingContainer} onKeyDown={handleEnterKey}>
            {populateOnScreenPeers()}
        </div>
    )
}

export default Operation