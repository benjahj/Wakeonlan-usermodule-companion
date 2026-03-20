# Wake-on-LAN – Bitfocus Companion Module

A Wake-on-LAN (WOL) module for [Bitfocus Companion](https://bitfocus.io/companion) v4.x.  
Sends magic packets over UDP to wake devices on your local network.

---

## Features

- **Simple action** – enter a MAC address and pick a network interface from a dropdown
- **Advanced action** – full control over broadcast address, UDP port, packet count and interval
- Supports Companion **variables** in MAC address fields
- Automatically calculates the correct broadcast address per network interface
- Falls back to global broadcast `255.255.255.255` when no specific interface is selected
- Works on Windows and Linux

---

## Installation (Dev module on Linux)

```bash
cd /opt/companion-module-dev

git clone https://github.com/benjahj/Wakeonlan-usermodule-companion.git WakeOnLan-Dev-Module

cd WakeOnLan-Dev-Module

npm install
```

Companion will pick up the module automatically from the `user-modules-dev` folder on next restart.

### Updating after code changes

```bash
cd /opt/companion-module-dev/WakeOnLan-Dev-Module
git pull
npm install
```

---

## Actions

### Send WOL (Simple)

Sends 3 magic packets to port 9 using the broadcast address of the selected interface.

| Option | Description |
|---|---|
| **MAC Address** | Target device MAC — any standard format (`AA:BB:CC:DD:EE:FF`, `AA-BB-...`, `AABBCCDDEEFF`). Supports Companion variables. |
| **Network Interface** | Select a specific NIC or leave on **Auto** (`255.255.255.255`). On Windows, selecting a specific interface avoids routing issues. |

### Send WOL (Advanced)

Full control over every parameter of the magic packet.

| Option | Default | Description |
|---|---|---|
| **MAC Address** | — | Target device MAC. Supports Companion variables. |
| **Destination IP / Broadcast** | `255.255.255.255` | IP or subnet broadcast address, e.g. `192.168.1.255` |
| **UDP Port** | `9` | Destination port (common values: `7`, `9`) |
| **Number of Packets** | `3` | How many magic packets to send |
| **Interval (ms)** | `100` | Delay between packets in milliseconds |

---

## MAC Address formats accepted

All of the following are valid inputs:

```
AA:BB:CC:DD:EE:FF
AA-BB-CC-DD-EE-FF
AA.BB.CC.DD.EE.FF
AABBCCDDEEFF
```

---

## Windows notes

On Windows, UDP broadcasts may not leave on the expected interface due to the routing table.  
Use the **Network Interface** dropdown in the Simple action, or set a specific **Destination IP** in the Advanced action (e.g. `192.168.1.255`).

---

## Requirements

- Bitfocus Companion **4.2.x** or newer
- Node.js **18** (bundled with Companion)
- `@companion-module/base` **~1.13.x**

---

## Project structure

```
WakeOnLan-Dev-Module/
├── companion/
│   └── manifest.json       # Module metadata for Companion
├── actions.js              # WOL logic and action definitions
├── index.js                # Module entry point
├── package.json
└── README.md
```

---

## License

MIT

