import React from "react";
import styles from "./KeyBindSetting.module.css";
import { useState, useEffect } from "react";

const KeyBindSetting = () => {
    const [keyBinding, setKeyBinding] = useState({});

    useEffect(() => {
        // Fetch key bindings from an API or context
        const fetchKeyBinding = async () => {
            const binding = await window.ipc.getKeyBindings();
            setKeyBinding(binding.changeMode);
        };

        fetchKeyBinding();
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.keyBind}>
                {keyBinding.toUpperCase()}
            </div>

        </div>
    );
};

export default KeyBindSetting;
