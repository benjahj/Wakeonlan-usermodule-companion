const dgram = require('dgram')
const { Regex } = require('@companion-module/base')

const MAC_REGEX = /^[0-9a-fA-F]{12}$/

/**
 * Create a Wake-on-LAN magic packet buffer for the given MAC address.
 * A magic packet is 6 bytes of 0xFF followed by the MAC address repeated 16 times.
 * @param {string} mac - 12 hex character MAC address (no separators)
 * @returns {Buffer}
 */
function createMagicPacket(mac) {
	const macBytes = Buffer.alloc(6)
	for (let i = 0; i < 6; i++) {
		macBytes[i] = parseInt(mac.substring(i * 2, i * 2 + 2), 16)
	}

	const packet = Buffer.alloc(102)
	// 6 bytes of 0xFF
	for (let i = 0; i < 6; i++) {
		packet[i] = 0xff
	}
	// MAC address repeated 16 times
	for (let i = 0; i < 16; i++) {
		macBytes.copy(packet, 6 + i * 6)
	}
	return packet
}

/**
 * Send WOL magic packet(s) via UDP broadcast.
 * @param {string} mac - 12 hex character MAC address (no separators)
 * @param {object} options - { address, port, num_packets, interval }
 * @returns {Promise<void>}
 */
function sendWol(mac, options) {
	const address = options.address || '255.255.255.255'
	const port = options.port || 9
	const numPackets = options.num_packets || 3
	const interval = options.interval || 100

	const packet = createMagicPacket(mac)

	return new Promise((resolve, reject) => {
		const socket = dgram.createSocket('udp4')

		socket.once('error', (err) => {
			try { socket.close() } catch (_) {}
			reject(err)
		})

		socket.bind(() => {
			socket.setBroadcast(true)

			let sent = 0
			const sendNext = () => {
				if (sent >= numPackets) {
					try { socket.close() } catch (_) {}
					resolve()
					return
				}
				socket.send(packet, 0, packet.length, port, address, (err) => {
					if (err) {
						try { socket.close() } catch (_) {}
						reject(err)
						return
					}
					sent++
					if (sent < numPackets) {
						setTimeout(sendNext, interval)
					} else {
						try { socket.close() } catch (_) {}
						resolve()
					}
				})
			}
			sendNext()
		})
	})
}

function getActionDefinitions(self) {
	const interfaceChoices = self.constructor.getNetworkInterfaceChoices()

	return {
		send_simple: {
			name: 'Send WOL (Simple)',
			options: [
				{
					type: 'textinput',
					id: 'mac',
					label: 'MAC Address',
					default: '',
					regex: '/^([0-9a-fA-F]{2}([:.\\-]?)){5}[0-9a-fA-F]{2}$/i',
					useVariables: true,
				},
				{
					type: 'dropdown',
					id: 'iface',
					label: 'Network Interface',
					default: 'auto',
					choices: interfaceChoices,
				},
			],
			callback: async (action) => {
				try {
					const rawMac = await self.parseVariablesInString(action.options.mac)
					const mac = rawMac.replace(/[:.\\-]/g, '')

					if (!MAC_REGEX.test(mac)) {
						self.log('error', `Invalid MAC address: "${rawMac}"`)
						return
					}

					const address = self.getBroadcastAddress(action.options.iface)

					self.log('debug', `Sending WOL to ${rawMac} via ${address}`)

					await sendWol(mac, {
						address: address,
						num_packets: 3,
						port: 9,
					})

					self.log('info', `WOL packet sent successfully to ${rawMac}`)
				} catch (err) {
					self.log('error', `Failed to send WOL packet: ${err.message}`)
				}
			},
		},
		send_advanced: {
			name: 'Send WOL (Advanced)',
			options: [
				{
					type: 'textinput',
					id: 'mac',
					label: 'MAC Address',
					default: '',
					regex: '/^([0-9a-fA-F]{2}([:.\\-]?)){5}[0-9a-fA-F]{2}$/i',
					useVariables: true,
				},
				{
					type: 'textinput',
					id: 'address',
					label: 'Destination IP / Broadcast Address',
					default: '255.255.255.255',
					regex: Regex.IP,
				},
				{
					type: 'textinput',
					id: 'port',
					label: 'UDP Port',
					default: '9',
					regex: Regex.PORT,
				},
				{
					type: 'textinput',
					id: 'count',
					label: 'Number of Packets',
					default: '3',
					regex: Regex.NUMBER,
				},
				{
					type: 'textinput',
					id: 'interval',
					label: 'Interval Between Packets (ms)',
					default: '100',
					regex: Regex.NUMBER,
				},
			],
			callback: async (action) => {
				try {
					const rawMac = await self.parseVariablesInString(action.options.mac)
					const mac = rawMac.replace(/[:.\\-]/g, '')

					if (!MAC_REGEX.test(mac)) {
						self.log('error', `Invalid MAC address: "${rawMac}"`)
						return
					}

					const options = {
						address: action.options.address || '255.255.255.255',
						port: parseInt(action.options.port, 10) || 9,
						num_packets: parseInt(action.options.count, 10) || 3,
						interval: parseInt(action.options.interval, 10) || 100,
					}

					self.log('debug', `Sending WOL to ${rawMac} — address=${options.address}, port=${options.port}, packets=${options.num_packets}, interval=${options.interval}ms`)

					await sendWol(mac, options)

					self.log('info', `WOL packet(s) sent successfully to ${rawMac}`)
				} catch (err) {
					self.log('error', `Failed to send WOL packet: ${err.message}`)
				}
			},
		},
	}
}

module.exports = { getActionDefinitions }
