import React from "react";
import styles from "./KeyBindSetting.module.css";
import { useState, useEffect } from "react";

const KeyBindSetting = () => {
    const [keyBinding, setKeyBinding] = useState("F2");
    const [isListening, setIsListening] = useState(false);

    useEffect(() => {
        // Fetch key bindings from an API or context
        const fetchKeyBinding = async () => {
            const binding = await window.ipc.getKeyBindings();
            setKeyBinding(binding.changeMode);
        };

        fetchKeyBinding();
    }, []);

    const handleKeyChangeClick = () => {
        const handleKeyDown = async (event) => {
            event.preventDefault();

            await window.ipc.setKeyBinding("changeMode", event.key);

            const updatedBinding = await window.ipc.getKeyBindings();
            setKeyBinding(updatedBinding.changeMode);
            setIsListening(false);
        };

        setIsListening(true);
        document.addEventListener("keydown", handleKeyDown, {
            once: true,
        });
    };

    return (
        <div className={styles.container} style={{ color: isListening ? "#93dab6" : "#7a7e8d", cursor: isListening ? "default" : "pointer"}} onClick={handleKeyChangeClick}>
            <div className={styles.keyBind} style={{ color: isListening ? "#93dab6" : "#7a7e8d", borderColor: isListening ? "#93dab6" : "#7a7e8d"}}>
                {keyBinding.toUpperCase()}
            </div>
            <div className={styles.description}>
                Change Mode KeyBind
            </div>
        </div>
    );
};

export default KeyBindSetting;
