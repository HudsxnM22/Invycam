import React from "react";
import { useState, useEffect, useRef } from "react";
import useModeStore from "../Hooks/useModeStore";
import styles from "./Edit.module.css";
import OnScreenRemoteStream from "../Components/OperationMode/OnScreenRemoteStream";

const Edit = () => {
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

    const handleEnterKey = (e) => {
        console.log(e.key)
        if (e.key === "Enter") {
            //TODO save changes
            setMode("menu")
        }
    }

    return (
        <div className={styles.editContainer} onKeyDown={handleEnterKey}>
            {populateOnScreenPeers()}
        </div>
    )
}

export default Edit;