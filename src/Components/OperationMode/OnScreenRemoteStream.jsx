import React from "react";
import { useState, useEffect, useRef } from "react";
import useModeStore from "../../Hooks/useModeStore";
import styles from "./OnScreenRemoteStream.module.css";

const OnScreenRemoteStream = ({ peer }) => {
    //peer === an instance of Connection
    const [videoContainerData, setVideoContainerData] = useState(peer.displayData)
    console.log(videoContainerData.position.left)
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
            const currentX = event.clientX
            const currentWidth = videoContainer.current.offsetWidth
            

            const deltaX = event.clientX - startX;
            const newWidth = startWidth + deltaX;
            setVideoContainerData(prevData => ({
                ...prevData,
                size: {...prevData.size, width: newWidth + "px"}
            }))
        }
        const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove)
            document.removeEventListener("mouseup", handleMouseUp)
            peer.displayData = videoContainerData //save the new size to the peer instance
        }

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    }

    const handleContainerMove = (e) => {
        e.preventDefault()
        e.stopPropagation()

        
        const startX = e.clientX
        const startY = e.clientY
        const startLeft = videoContainer.current.offsetLeft
        const containerRect = videoContainer.current.getBoundingClientRect();
        const startBottom = window.innerHeight - containerRect.bottom;

        const handleMouseMove = (event) => {
            const currentX = event.clientX
            const currentY = event.clientY
            const newLeft = startLeft + (currentX - startX)
            const newBottom = startBottom + (currentY - startY)
        }

        const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove)
            document.removeEventListener("mouseup", handleMouseUp)
        }

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    }


    return (
        <>
        <div className={styles.onScreenRemoteStreamContainer} 
        style={{left: videoContainerData.position.left, bottom: videoContainerData.position.bottom, width: videoContainerData.size.width}} 
        ref={videoContainer}
        onMouseDown={handleContainerMove}
        >
            <div className={styles.resizeBubble} onMouseDown={handleBubbleMouseDown}></div>
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