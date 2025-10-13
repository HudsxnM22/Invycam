import React from "react";
import styles from "./RoomOptionsForm.module.css"
import { useState } from "react";
import useClientStore from "../../Hooks/useClientStore";
import ConnectionManager from "../../Utils/ConnectionManager";
import { TailChase } from 'ldrs/react'
import 'ldrs/react/TailChase.css'
import { useForm, SubmitHandler } from 'react-hook-form'

const RoomOptionsForm = () => {
    const [tab, setTab] = useState("join")
    const connectionStatus = useClientStore((state) => state.roomStatus)
    const roomId = useClientStore((state) => state.roomId)
    const username = useClientStore((state) => state.username)

    const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    } = useForm()

    const onSubmit = (data) => {
        console.log(data)
    }

    return(
        <section className={styles.roomOptionsFormMenu}>
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
                    <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
                        <div className={styles.formControl}>
                            <input {...register("roomId")

                            } type="text" name="roomId" required />
                            <label>
                                <span>R</span><span>o</span><span>o</span><span>m</span><span> </span><span>I</span><span>d</span><span>:</span>
                            </label>
                        </div>

                        <div className={styles.formControl}>
                            <input {...register("username")
                                
                            } type="text" name="username" required />
                            <label>
                                <span>U</span><span>s</span><span>e</span><span>r</span><span>n</span><span>a</span><span>m</span><span>e</span><span>:</span>
                            </label>
                        </div>
                    </form>
                    <section className={styles.buttonHolder}>
                        <button className={styles.submitButton} type="submit">Join Room</button> <button className={styles.submitButton} onClick={() => {setTab("create")}}>Create Room</button>
                    </section>
                </>
                : tab === "create" && connectionStatus === "disconnected" ?
                <>
                    <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
                        <div className={styles.formControl}>
                            <input {...register("roomName")

                            } type="text" name="roomName" required />
                            <label>
                                <span>R</span><span>o</span><span>o</span><span>m</span><span> </span><span>N</span><span>a</span><span>m</span><span>e</span><span>:</span>
                            </label>
                        </div>

                        <div className={styles.formControl}>
                            <input {...register("username")

                            } type="text" name="username" required />
                            <label>
                                <span>U</span><span>s</span><span>e</span><span>r</span><span>n</span><span>a</span><span>m</span><span>e</span><span>:</span>
                            </label>
                        </div>
                    </form>
                    <section className={styles.buttonHolder}>
                        <button className={styles.submitButton} onClick={() => {setTab("join")}}>Join Room</button> <button className={styles.submitButton} type="submit">Create Room</button>
                    </section>
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
                        <form className={styles.form}>
                            <div className={styles.formControl}>
                                <label>
                                    <span>R</span><span>o</span><span>o</span><span>m</span><span> </span><span>I</span><span>D</span><span>: {roomId}</span> 
                                </label>
                            </div>

                            <div className={styles.formControl}>
                                <label>
                                    <span>U</span><span>s</span><span>e</span><span>r</span><span>n</span><span>a</span><span>m</span><span>e</span><span>: {username}</span>
                                </label>
                            </div>
                        </form>

                        <section className={styles.leaveButtonHolder}>
                            <button className={styles.leaveButton} type="button">Leave Room</button>
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