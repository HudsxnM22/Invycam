import React from 'react';
import MainMenu from './Pages/MainMenu';
import useModeStore from './Hooks/useModeStore';
import "./App.css"
import ConnectionManager from './Utils/ConnectionManager'; //TODO make it so this updates the client store state too

function App() {
  const mode = useModeStore((state) => state.mode)

  return (
    <>
      <section className="areaToRecord"></section>
      {mode === "menu" ?
        <MainMenu></MainMenu>
      : mode === "edit" ?
        <></>
      :
        <></>
      }
    </>
  );
}

export default App;