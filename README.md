# Invycam

A Windows desktop overlay app that lets you crop a region of your screen (your inventory, stats panel, HUD, map — anything) and stream it peer-to-peer to friends, who can then drag that stream anywhere on their own screen and overlay it on top of whatever they're doing, including full-screen games.

Built with Electron + React on the client and a small Python signaling server on the backend, using WebRTC for the actual video transport. The app window itself is a transparent, frameless, click-through overlay that sits always-on-top without stealing keyboard focus from the game underneath — a global hotkey (default `F2`) toggles it between "invisible overlay" and "interactive menu" states.

## Features

- **Screen region capture** — draw a rectangle over any part of your screen; that crop becomes a live, independent video stream.
- **Peer-to-peer streaming** — stream your cropped region directly to other users via WebRTC (no media passes through the server).
- **Draggable overlays** — recipients can drag and resize a peer's incoming stream and position it anywhere on their own screen.
- **Always-on-top, click-through overlay** — the window stays visible over full-screen applications/games without stealing focus or blocking input until you intentionally bring up the menu.
- **Global hotkey toggle** — a system-wide key listener (default `F2`, rebindable) switches between overlay mode and an interactive menu, from inside any application.
- **Room-based sessions** — create or join a room by ID; a lightweight signaling server tracks room membership and relays WebRTC offers/answers/ICE candidates between peers.
- **Host handoff** — if the host leaves, the server reassigns a new host and notifies the room.
- **Live stream re-negotiation** — changing your captured region mid-session swaps the outgoing video track via `RTCRtpSender.replaceTrack()` without tearing down the peer connection.

## Tech stack

**Desktop shell**
- [Electron](https://www.electronjs.org/) — transparent/frameless/always-on-top `BrowserWindow`, IPC bridge via a sandboxed preload script, `desktopCapturer` + `getDisplayMedia` for screen capture.
- [uiohook-napi](https://github.com/wilix-team/uiohook-napi) — native global keyboard hook, used for the system-wide hotkey that works even while the overlay is non-focusable/click-through.

**Frontend**
- [React 19](https://react.dev/) (via Create React App / `react-scripts`)
- [Zustand](https://github.com/pmndrs/zustand) — small, hook-based state stores (client/room state, connected peers, overlay/operation mode, notifications) instead of a heavier state library
- [react-hook-form](https://react-hook-form.com/) — room create/join forms
- [react-draggable](https://github.com/react-grid-layout/react-draggable) — positioning peer overlays on screen
- [ldrs](https://uiball.com/ldrs/) — loading indicators
- CSS Modules for component-scoped styling

**Networking / real-time transport**
- **WebRTC** (native browser APIs, no library) — `RTCPeerConnection`, transceivers, and `RTCRtpSender.replaceTrack` for mid-call track swaps; a STUN server for NAT traversal.
- **Canvas-based cropping pipeline** — `getDisplayMedia()` captures the full screen, a hidden `<video>` plays it, `drawImage()` crops the selected region onto a `<canvas>` each frame, and `canvas.captureStream(10)` turns that into a standalone, shareable `MediaStream` at 10 FPS — all without ever writing a file to disk.
- **[Invycam-api](../Invycam-api)** (companion Python service, separate repo) — a lightweight signaling server (HTTP + WebSocket) that tracks rooms/users in memory and forwards WebRTC offers, answers, and ICE candidates between peers. It never touches the actual video — that's negotiated and streamed directly peer-to-peer once signaling completes.
- [Axios](https://axios-http.com/) — HTTP calls to the signaling server.

## Architecture

```
┌─────────────────────────┐          HTTP + WebSocket           ┌───────────────────────┐
│   Invycam (Electron)    │ ───────────────────────────────────▶│  Invycam-api (Python)  │
│                         │   room create/join, offer/answer,    │  in-memory room/user   │
│  ┌───────────────────┐ │   ICE candidate relay                │  registry + relay      │
│  │ Electron main proc │ │◀───────────────────────────────────┐│                        │
│  │ (window, capture,  │ │                                     └───────────────────────┘
│  │  global hotkey)    │ │
│  └─────────┬──────────┘ │
│            │ IPC (preload bridge)
│  ┌─────────▼──────────┐ │          WebRTC (P2P, direct)
│  │   React renderer    │ │◀═══════════════════════════════▶   Another Invycam instance
│  │  - ConnectionManager│ │        cropped video stream
│  │  - Connection (1/peer)
│  │  - Zustand stores   │ │
│  └─────────────────────┘ │
└─────────────────────────┘
```

Key pieces, by file:

| Piece | Responsibility | Where |
| --- | --- | --- |
| Electron main process | Creates the transparent/always-on-top window, supplies the screen capture source, runs the global key listener | [`public/main.js`](public/main.js) |
| Preload bridge | Exposes a minimal `window.ipc` API from main → renderer | [`public/preload.js`](public/preload.js) |
| Global hotkey listener | Native keyboard hook that fires regardless of window focus | [`public/keyEventListener.js`](public/keyEventListener.js) |
| `ConnectionManager` | One per app instance: owns the local cropped stream, room lifecycle (create/join/leave), and one `Connection` per remote peer | [`src/Utils/ConnectionManager.js`](src/Utils/ConnectionManager.js) |
| `Connection` | Wraps a single `RTCPeerConnection`: offer/answer creation, ICE gathering, track replacement for one peer | [`src/Utils/Connection.js`](src/Utils/Connection.js) |
| Zustand stores | Reactive state for the connected client, peer list, UI mode, and toast notifications | [`src/Hooks/`](src/Hooks) |
| React UI | Main menu, room forms, draggable peer overlays, settings | [`src/Pages/`](src/Pages), [`src/Components/`](src/Components) |

For a given screen share session: a user selects a region → `ConnectionManager.setLocalStream()` captures and crops it onto a canvas-backed `MediaStream` → joining a room triggers an SDP offer (with bulk-gathered ICE candidates) sent through the signaling server → the receiving peer answers → WebRTC establishes a direct connection → the incoming stream is attached to a draggable `<video>` overlay.

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) (18+ recommended) and npm
- Windows (the overlay behavior and global hotkey are currently Windows-targeted; `uiohook-napi` has native bindings per-platform)
- The [Invycam-api](../Invycam-api) signaling server running and reachable (or point `signalingServerUrl` in [`src/Utils/ConnectionManager.js`](src/Utils/ConnectionManager.js) at your own instance)

### Install

```bash
npm install
```

### Run in development

Starts the React dev server and launches Electron pointed at it, with hot reload:

```bash
npm run electron-dev
```

### Build a production bundle

```bash
npm run react-build
```

### Run the production build in Electron

```bash
npm run electron-prod
```

### Package a distributable

```bash
npm run electron-pack
```

## Project structure

```
public/            Electron main process, preload bridge, native key listener, local settings util
src/
  Pages/           Top-level screens (MainMenu, Operation/overlay mode, Edit/region selection)
  Components/      MainMenu (room forms, peer cards), OperationMode (on-screen remote stream), Settings (keybinds)
  Hooks/           Zustand stores: client/room state, peer state, UI mode, notifications
  Utils/           ConnectionManager (room + signaling orchestration), Connection (per-peer WebRTC), NotificationProvider
```

## Known limitations / in progress

- Room creation/joining UX is still being refined.
- Multi display handling.
- Multiple streamed elements.

## Why I built this

A project to force myself across the full stack of a real-time application: native desktop integration, a multi-peer networking layer, and a UI that has to behave correctly under unusual constraints (an overlay that can't interfere with a game running underneath it). Also a deliberate excuse to actually use WebRTC, Electron's process model, and multi-store state management instead of just reading about them.

## AI use policy

AI was used sparingly and intentionally. The goal was to learn and sharpen my own engineering ability, not to offload design or implementation.

- Architecture, the WebRTC signaling flow, Electron process boundaries, and state management were designed and implemented by me.
- AI was used for CSS/styling polish and for help tracking down bugs and logic issues (e.g. reasoning through race conditions in the signaling flow, catching stale-reference bugs) — closer to a rubber duck/code reviewer than a co-author.
- Any AI-assisted suggestions were reviewed and understood before being kept, not pasted in blind.
