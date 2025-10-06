import React from "react"
import { useState, useEffect, useRef } from "react"
import usePeersStore from "../../Hooks/usePeerStore"
import useClientStore from "../../Hooks/useClientStore"
import styles from "./PeersScrollableMenu.module.css"
import PeerCard from "../MainMenu/PeerCard"
import Connection from "../../Utils/Connection"


const PeersScrollableMenu = () => {

    //const peers = usePeersStore((state) => state.peers) //an object of all the instances of Connections / peers
    const client = useClientStore((state) => state) //the client store, contains info about the local user\

    //mock data for testing
    const peers = {
        "abc123": new Connection("abc123"),
        "def456": new Connection("def456"),
        "ghi789": new Connection("ghi789"),
    }

    peers["abc123"].username = "Alice"
    peers["def456"].username = "Bob"
    peers["ghi789"].username = "Charlie"

    peers["abc123"].remoteStream = client.localStream
    peers["def456"].remoteStream = client.localStream
    peers["ghi789"].remoteStream = client.localStream

    const populatePeers = () => {
        return Object.keys(peers).map((peerId) => {
            return <PeerCard key={peerId} peer={peers[peerId]} />
        })
    }

    return (
        <section className={styles.peersScrollableMenuContainer} style={{justifyContent: client.roomStatus === "connected" ? "flex-start" : "center"}}>
            {client.roomStatus !== "connected" ?
                <h2 className={styles.connectedPeersTitle}>Join Or Create A Room</h2>
            :
            <>
                {Object.keys(peers).length > 0 ?
                    <h2 className={styles.connectedPeersTitle}>Connected Users</h2>
                :
                    <h2 className={styles.connectedPeersTitle}>Empty Room</h2>
                }
                {populatePeers()}
            </>
            }
        </section>
    )
}

export default PeersScrollableMenu