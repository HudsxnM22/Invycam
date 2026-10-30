import React from "react";
import styles from "./RoomOptionsForm.module.css"
import { useState, useEffect } from "react";
import useClientStore from "../../Hooks/useClientStore";
import ConnectionManager from "../../Utils/ConnectionManager";
import useNotification from "../../Hooks/useNotification";
import { TailChase } from 'ldrs/react'
import 'ldrs/react/TailChase.css'
import { useForm, SubmitHandler } from 'react-hook-form'

//greets the logged in user, revealing their username letter by letter with a green shimmer from left to right
const WelcomeBanner = ({ username }) => (
    <h3 className={styles.welcome} aria-label={`Welcome ${username}!`}>
        <span aria-hidden="true">Welcome </span>
        <span className={styles.usernameReveal} key={username} aria-hidden="true">
            {[...username].map((letter, i) => (
                <span key={i} style={{ "--i": i }}>{letter}</span>
            ))}
        </span>
        <span className={styles.welcomeBang} aria-hidden="true" style={{ "--i": username.length }}>!</span>
    </h3>
)

const RoomOptionsForm = () => {
    const [tab, setTab] = useState("join")
    const [copied, setCopied] = useState(false)
    const connectionStatus = useClientStore((state) => state.roomStatus)
    const roomId = useClientStore((state) => state.roomId)
    const username = useClientStore((state) => state.username)
    const notify = useNotification((state) => state.notify)

    const {
    register,
    handleSubmit,
    } = useForm()

    const onSubmit = (data) => {
        if(tab === "join"){
            ConnectionManager.joinRoom(data.roomId)
        }
        if(tab == "create"){
            ConnectionManager.createRoom(data.roomName)
        }
    }

    const handleLeave = () => {
        ConnectionManager.leaveRoom()
    }

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(roomId)
            setCopied(true)
            notify("success", "Room ID copied.")
            setTimeout(() => setCopied(false), 1500)
        } catch {
            notify("error", "Couldn't copy the room ID.")
        }
    }

    const onError = (errors) => {
        if(errors.roomId){
            notify("error", "Room Id must be 6 chars")
        }
        if(errors.roomName){
            notify("error", "Room Name must be 3-10 chars")
        }
        if(errors.username){
            notify("error", "Username must be 2-10 chars")
        }
    }

    return(
        <section className={styles.roomOptionsFormMenu}>
            {username && <WelcomeBanner username={username} />}
            <h4 className={styles.title}>
                {tab === "join" && connectionStatus === "disconnected" ? 
                "Join Room" 
                : tab === "create" && connectionStatus === "disconnected" ?
                "Create Room"
                :
                connectionStatus
                }
            </h4>
            <section className={styles.formContainer}>
                {tab === "join" && connectionStatus === "disconnected"?
                <>
                    <form className={styles.form} onSubmit={handleSubmit(onSubmit, onError)}>
                        <div className={styles.formControl}>
                            <input {...register("roomId", {
                                required: true,
                                minLength: 6,
                                maxLength: 6,

                            })

                            } type="text" name="roomId" required />
                            <label>
                                <span>R</span><span>o</span><span>o</span><span>m</span><span> </span><span>I</span><span>d</span><span>:</span>
                            </label>
                        </div>

                        <section className={styles.buttonHolder}>
                            <button 
                            className={styles.submitButton} 
                            type="submit" 
                            style={{background: "rgba(34, 255, 0, 0.16)", boxShadow: "0 0.1vh 0.1vw rgba(133, 255, 114, 0.56)"}}
                            >
                                {tab === "join" ? 
                                    <>
                                    Join    
                                    <svg className={styles.roomIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M11.0005 15.9995L15.0005 11.9995M15.0005 11.9995L11.0005 7.99951M15.0005 11.9995H3.00049M11.0005 2.99951H17.7997C18.9198 2.99951 19.4799 2.99951 19.9077 3.2175C20.284 3.40925 20.59 3.71521 20.7817 4.09153C20.9997 4.51935 20.9997 5.07941 20.9997 6.19951V17.7995C20.9997 18.9196 20.9997 19.4797 20.7817 19.9075C20.59 20.2838 20.284 20.5898 19.9077 20.7815C19.4799 20.9995 18.9198 20.9995 17.7997 20.9995H11.0005" stroke="#ffffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
                                    </>
                                :
                                    "Join Room"
                                }
                            </button> <button className={styles.submitButton} type="button" onClick={(e) => {
                                setTab("create")
                                e.preventDefault()
                                e.stopPropagation()
                            }}>Create Room</button>
                        </section>
                    </form>
                    
                </>
                : tab === "create" && connectionStatus === "disconnected" ?
                <>
                    <form className={styles.form} onSubmit={handleSubmit(onSubmit, onError)}>
                        <div className={styles.formControl}>
                            <input {...register("roomName", {
                                required: true,
                                minLength: 3,
                                maxLength: 10,
                            })

                            } type="text" name="roomName" required />
                            <label>
                                <span>R</span><span>o</span><span>o</span><span>m</span><span> </span><span>N</span><span>a</span><span>m</span><span>e</span><span>:</span>
                            </label>
                        </div>

                        <section className={styles.buttonHolder}>
                            <button className={styles.submitButton} type="button" onClick={(e) => {
                                setTab("join")
                                e.preventDefault()
                                e.stopPropagation()
                            }}>Join Room</button> 
                            <button 
                            className={styles.submitButton} 
                            type="submit"
                            style={{background: "rgba(34, 255, 0, 0.16)", boxShadow: "0 0.1vh 0.1vw rgba(133, 255, 114, 0.56)"}}
                            >
                                {tab === "create" ? 
                                    <>
                                    Create    
                                    <svg className={styles.roomIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M11.0005 15.9995L15.0005 11.9995M15.0005 11.9995L11.0005 7.99951M15.0005 11.9995H3.00049M11.0005 2.99951H17.7997C18.9198 2.99951 19.4799 2.99951 19.9077 3.2175C20.284 3.40925 20.59 3.71521 20.7817 4.09153C20.9997 4.51935 20.9997 5.07941 20.9997 6.19951V17.7995C20.9997 18.9196 20.9997 19.4797 20.7817 19.9075C20.59 20.2838 20.284 20.5898 19.9077 20.7815C19.4799 20.9995 18.9198 20.9995 17.7997 20.9995H11.0005" stroke="#ffffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
                                    </>
                                :
                                    "Create Room"
                                }
                            </button>
                        </section>
                    </form>
                </>
                :connectionStatus === "joining" || connectionStatus === "creating" || connectionStatus ==="leaving" ?
                <section className={styles.loadingSection}>
                    <TailChase
                    size="40"
                    speed="1.75"
                    color="white" 
                    />
                </section>
                : connectionStatus === "connected" ?
                    <div className={styles.connectionManagerContainer}>
                        <div className={styles.roomCodeCard}>
                            <div className={styles.roomCodeText}>
                                <span className={styles.roomCodeLabel}>Room ID</span>
                                <span className={styles.roomCode}>{roomId}</span>
                            </div>

                            <button
                                className={styles.copyButtonContainer}
                                type="button"
                                onClick={handleCopy}
                                title={copied ? "Copied" : "Copy room ID"}
                                aria-label="Copy room ID"
                                data-copied={copied}
                            >
                                {copied ?
                                    <svg className={styles.copyIcon} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M20 6L9 17l-5-5" />
                                    </svg>
                                :
                                    <svg className={styles.copyIcon} viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
                                        <rect x="9" y="9" width="13" height="13" rx="2" />
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                    </svg>
                                }
                            </button>
                        </div>

                        <section className={styles.leaveButtonHolder}>
                            <button className={styles.leaveButton} type="button" onClick={handleLeave}>Leave Room</button>
                        </section>
                    </div>
                :
                <></>
                }
            </section>
        </section>
    )
}

export default RoomOptionsForm