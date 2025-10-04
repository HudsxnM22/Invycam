import React from "react"
import { useState, useEffect, useRef } from "react"
import usePeersStore from "../../Hooks/usePeerStore"
import useClientStore from "../../Hooks/useClientStore"
import styles from "./PeersScrollableMenu.module.css"
import PeerCard from "../MainMenu/PeerCard"


const PeersScrollableMenu = () => {

    //const peers = usePeersStore((state) => state.peers) //an object of all the instances of Connections / peers
    const client = useClientStore((state) => state) //the client store, contains info about the local user

    //mock data
    const peers = {
        "9023nm89": {username: "Alice", onScreen: true, isHost: true},
        "s3nkk32": {username: "Bob", onScreen: false, isHost: false},
        "jsd9033": {username: "Charlie", onScreen: true, isHost: false}
    }

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