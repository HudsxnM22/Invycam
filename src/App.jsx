import React, { useState, useEffect, useRef } from 'react';
import MainMenu from './Pages/MainMenu';
import useModeStore from './Hooks/useModeStore';
import "./App.css"
import connectionManager from './Utils/ConnectionManager'; //TODO make it so this updates the client store state too
import Edit from './Pages/Edit';
import Operation from './Pages/Operation';

function App() {
  const mode = useModeStore((state) => state.mode)
  const setMode = useModeStore((state) => state.changeMode)
  const recordSelectMode = useModeStore((state) => state.recordSelectMode)
  const setRecordSelectMode = useModeStore((state) => state.setRecordSelectMode)
  const [areaSelected, setAreaSelected] = useState(false)
  const recordArea = useRef(null)

  //listen for mouse events to scale and move the rectangle
  useEffect(() => {
    if (!recordSelectMode) return;
    document.querySelector("body").style.backgroundColor = "rgba(62, 62, 62, 0.1)"

    let mouseDown = false;
    let startX, startY;

    const handleMouseDown = (event) => {
      mouseDown = true;
      setAreaSelected(false)
      startX = event.clientX;
      startY = event.clientY;
      
      // Position the area selector at mouse position
      const areaElement = document.querySelector(".areaToRecord");
      if (areaElement) {
        areaElement.style.left = startX + "px";
        areaElement.style.top = startY + "px";
        areaElement.style.width = "0px";
        areaElement.style.height = "0px";
        areaElement.style.display = "block";
      }
    };

    const handleMouseMove = (event) => {
      if (!mouseDown) return;

      const currentX = event.clientX;
      const currentY = event.clientY;

      // Calculate the top-left corner
      const left = Math.min(startX, currentX);
      const top = Math.min(startY, currentY);

      // Calculate width and height
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);

      const areaElement = document.querySelector(".areaToRecord");
      if (areaElement) {
        areaElement.style.left = left + "px";
        areaElement.style.top = top + "px";
        areaElement.style.width = width + "px";
        areaElement.style.height = height + "px";
      }
    };

    const handleMouseUp = () => {
      mouseDown = false;
      setAreaSelected(true)
    };

    const handleKeyPressed = (event) => {
      if(event.key !== "Enter"){
        return
      }

      document.querySelector("body").style.backgroundColor = "transparent"
      setRecordSelectMode(false)
      //get dimensions of crop for canvas processing in connection manager.
      //I do it this way so that it saves across renders and is more performant than changing a state every mouse move or mouse up. enter finalizes the area...
      const areaElement = document.querySelector(".areaToRecord")
      const rect = areaElement.getBoundingClientRect()

      console.log({
        startX: rect.left,
        startY: rect.top, 
        width: rect.width,
        height: rect.height
      })
      
      connectionManager.setLocalStream({
        startX: rect.left,
        startY: rect.top, 
        width: rect.width,
        height: rect.height
      })
    }

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("keypress", handleKeyPressed)

    // Cleanup
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("keypress", handleKeyPressed)
    };
  }, [recordSelectMode]);

  useEffect(() => {
    if(mode === "menu" || mode === "edit"){
      document.documentElement.style.setProperty('--edit-background-color', 'rgba(62, 62, 62, 0.291)');
    }else{
      document.documentElement.style.setProperty('--edit-background-color', 'transparent');
    }
  }, [mode])

  //listens for key press to open menu... then updates mode to menu too
  //TODO make so it doesnt constantly rerender
  useEffect(() => {
    window.ipc.openMenu(() => {
      setMode("menu")
    })
  }, [])

  return (
    <>
      <div ref={recordArea} className="areaToRecord" style={{backgroundColor: recordSelectMode ? "#80808062" : "transparent"}}></div>
      {recordSelectMode && areaSelected ? <h1 className="pressEnterToConfirmAreaText">Press Enter To Confirm Area</h1> : <></>}
      {mode === "menu" && !recordSelectMode ?
        <MainMenu></MainMenu>
      : mode === "edit" ?
        <Edit></Edit>
      :
        <Operation></Operation>
      }
    </>
  );
}

export default App;