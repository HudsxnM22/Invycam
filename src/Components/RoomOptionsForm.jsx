import React from "react";
import styles from "./RoomOptionsForm.module.css"
import { useState } from "react";

const RoomOptionsForm = (ConnectionManager) => {
    const [tab, setTab] = useState("join")


    return(
        <section className={styles.roomOptionsFormMenu}>
            <h4 className={styles.title}>{tab === "join" ? "Join Room" : "Create Room"}</h4>

            {tab === "join"?
            <section className={styles.formContainer}>
                <form className={styles.form}>
                    <div className={styles.formControl}>
                        <input type="text" name="roomId" required />
                        <label>
                            <span>R</span><span>o</span><span>o</span><span>m</span><span> </span><span>I</span><span>d</span><span>:</span>
                        </label>
                    </div>

                    <div className={styles.formControl}>
                        <input type="text" name="username" required />
                        <label>
                            <span>U</span><span>s</span><span>e</span><span>r</span><span>n</span><span>a</span><span>m</span><span>e</span><span>:</span>
                        </label>
                    </div>
                </form>
                <section className={styles.buttonHolder}>
                    <button className={styles.submitButton}>Join Room</button> <button className={styles.submitButton} onClick={() => {setTab("create")}}>Create Room</button>
                </section>
            </section>
            :
            <section className={styles.formContainer}>
                <form className={styles.form}>
                    <div className={styles.formControl}>
                        <input type="text" name="roomName" required />
                        <label>
                            <span>R</span><span>o</span><span>o</span><span>m</span><span> </span><span>N</span><span>a</span><span>m</span><span>e</span><span>:</span>
                        </label>
                    </div>

                    <div className={styles.formControl}>
                        <input type="text" name="username" required />
                        <label>
                            <span>U</span><span>s</span><span>e</span><span>r</span><span>n</span><span>a</span><span>m</span><span>e</span><span>:</span>
                        </label>
                    </div>
                </form>
                <section className={styles.buttonHolder}>
                    <button className={styles.submitButton} onClick={() => {setTab("join")}}>Join Room</button> <button className={styles.submitButton}>Create Room</button>
                </section>
            </section>
            }
        </section>
    )
}

export default RoomOptionsForm