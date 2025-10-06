import React from "react";
import { useState, useEffect, useRef } from "react";
import useModeStore from "../../Hooks/useModeStore";
import styles from "./OnScreenRemoteStream.module.css";
import Operation from "../../Pages/Operation";

const OnScreenRemoteStream = ({ peer }) => {
    const mode = useModeStore((state) => state.mode)
    //peer === an instance of Connection
    const video = useRef(null)
    const videoContainer = useRef(null)

    useEffect(() => {
        //get the remote stream from the peer instance
        peer.getRemoteStream().then(stream => {
            video.current.srcObject = stream
        }).catch(err => {
            console.error("Failed to get remote stream for peer:", peer.peerId, err)
        })
    }, [peer])

    //handle resizing the video container
    const handleBubbleMouseDown = (e) => {
        e.preventDefault()
        e.stopPropagation()
        const startX = e.clientX
        const startWidth = videoContainer.current.offsetWidth

        const handleMouseMove = (event) => {
            const deltaX = event.clientX - startX;
            const newWidth = startWidth + deltaX;
            videoContainer.current.style.width = newWidth + "px"
        }
        const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove)
            document.removeEventListener("mouseup", handleMouseUp)
            peer.displayData.size.width = videoContainer.current.style.width
        }

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    }

    //handles moving around video container
    const handleContainerMove = (e) => {
        e.preventDefault()
        e.stopPropagation()

        const startX = e.clientX
        const startY = e.clientY
        const containerRect = videoContainer.current.getBoundingClientRect();
        
        const parentRect = videoContainer.current.offsetParent.getBoundingClientRect();
        
        const startLeft = containerRect.left - parentRect.left;
        const startBottom = window.innerHeight - containerRect.bottom;
        videoContainer.current.style.cursor = "grabbing"

        const handleMouseMove = (event) => {
            const deltaX = event.clientX - startX
            const deltaY = event.clientY - startY

            const newLeft = startLeft + deltaX
            const newBottom = startBottom - deltaY

            videoContainer.current.style.left = newLeft + "px"
            videoContainer.current.style.bottom = newBottom + "px"
        }

        const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove)
            document.removeEventListener("mouseup", handleMouseUp)
            peer.displayData.position.left = videoContainer.current.style.left
            peer.displayData.position.bottom = videoContainer.current.style.bottom
            videoContainer.current.style.cursor = "grab"
        }

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    }


    return (
        <>
        <div className={styles.onScreenRemoteStreamContainer}
        style={{left: peer.displayData.position.left, bottom: peer.displayData.position.bottom, width: peer.displayData.size.width, border: mode !== "operation" ? "2px dashed white" : "transparent"}} 
        ref={videoContainer}
        onMouseDown={handleContainerMove}
        >
            <div className={styles.resizeBubble} onMouseDown={handleBubbleMouseDown} style={{visibility: mode !== "operation" ? "visible" : "hidden"}}></div>
            <video
                muted
                ref={video}
                autoPlay
                className={styles.onScreenRemoteStream}
            >
            </video>
        </div>
        </>
    )
}

export default OnScreenRemoteStream;