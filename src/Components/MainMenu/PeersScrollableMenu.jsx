import React from "react"
import { useState, useEffect, useRef } from "react"
import usePeersStore from "../../Hooks/usePeerStore"
import useClientStore from "../../Hooks/useClientStore"
import styles from "./PeersScrollableMenu.module.css"
import PeerCard from "../MainMenu/PeerCard"


const PeersScrollableMenu = () => {

    //const peers = usePeersStore((state) => state.peers) //an object of all the instances of Connections / peers
    const client = useClientStore((state) => state) //the client store, contains info about the local user
    //const peers = usePeersStore((state) => state.peers) //an object of all the instances of Connections / peers

    //mock data for testing
    const peers = {
        "ijowedfoi89": {username: "Alice", peerId: "ijowedfoi89", onScreen: true, getRemoteStream: async () => {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve("https://download.blender.org/peerweb/bigbuckbunny_movies/BigBuckBunny_320x180.mp4")
                }, 13000)
            })
        }},
        "oiwejfowe": {username: "Bob", peerId: "oiwejfowe", onScreen: false, getRemoteStream: async () => {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    resolve("https://download.blender.org/peerweb/bigbuckbunny_movies/BigBuckBunny_320x180.mp4")
                }, 10000)
            })
        }},
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