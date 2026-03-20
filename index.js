const fs = require('fs')
const diagLog = (msg) => {
	try { fs.appendFileSync('C:\\Users\\benja\\AppData\\Roaming\\companion\\wol-diag.txt', new Date().toISOString() + ' ' + msg + '\n') } catch (_) {}
}
diagLog('=== MODULE LOAD START ===')

let InstanceBase, InstanceStatus, runEntrypoint
try {
	diagLog('requiring @companion-module/base...')
	const base = require('@companion-module/base')
	InstanceBase = base.InstanceBase
	InstanceStatus = base.InstanceStatus
	runEntrypoint = base.runEntrypoint
	diagLog('OK: @companion-module/base loaded')
} catch (e) {
	diagLog('FAILED @companion-module/base: ' + e.message + '\n' + e.stack)
	process.exit(1)
}

let getActionDefinitions
try {
	diagLog('requiring ./actions.js...')
	getActionDefinitions = require('./actions.js').getActionDefinitions
	diagLog('OK: actions.js loaded')
} catch (e) {
	diagLog('FAILED actions.js: ' + e.message + '\n' + e.stack)
	process.exit(1)
}

const os = require('os')
diagLog('OK: os loaded')

class WOLInstance extends InstanceBase {
	async init(config) {
		await this.configUpdated(config)
	}

	async configUpdated(config) {
		this.config = config

		this.setActionDefinitions(getActionDefinitions(this))

		this.updateStatus(InstanceStatus.Ok)
	}

	// When module gets deleted
	async destroy() {}

	/**
	 * Compute the broadcast address for a given network interface.
	 * Falls back to 255.255.255.255 if the interface is not found.
	 */
	getBroadcastAddress(interfaceName) {
		if (!interfaceName || interfaceName === 'auto') {
			return '255.255.255.255'
		}

		const interfaces = os.networkInterfaces()
		const iface = interfaces[interfaceName]
		if (!iface) {
			this.log('warn', `Network interface "${interfaceName}" not found, using global broadcast`)
			return '255.255.255.255'
		}

		for (const info of iface) {
			if (info.family === 'IPv4' && !info.internal) {
				// Calculate broadcast: IP OR (NOT netmask)
				const ipParts = info.address.split('.').map(Number)
				const maskParts = info.netmask.split('.').map(Number)
				const broadcast = ipParts.map((ip, i) => (ip | (~maskParts[i] & 0xff))).join('.')
				return broadcast
			}
		}

		this.log('warn', `No IPv4 address found on interface "${interfaceName}", using global broadcast`)
		return '255.255.255.255'
	}

	/**
	 * Get a list of available network interfaces for dropdown options.
	 */
	static getNetworkInterfaceChoices() {
		const choices = [{ id: 'auto', label: 'Auto (255.255.255.255)' }]
		const interfaces = os.networkInterfaces()

		for (const [name, addrs] of Object.entries(interfaces)) {
			for (const info of addrs) {
				if (info.family === 'IPv4' && !info.internal) {
					choices.push({
						id: name,
						label: `${name} (${info.address})`,
					})
				}
			}
		}

		return choices
	}

	// Return config fields for web config
	getConfigFields() {
		return [
			{
				type: 'static-text',
				id: 'info',
				label: 'Information',
				width: 12,
				value:
					'Wake-on-LAN sends magic packets to wake devices on your network. ' +
					'On Windows, you may need to use the Advanced action or select a specific network interface to ensure packets are routed correctly.',
			},
		]
	}
}

diagLog('calling runEntrypoint...')
runEntrypoint(WOLInstance, [])
diagLog('runEntrypoint called (async running)')

module.exports = WOLInstance

