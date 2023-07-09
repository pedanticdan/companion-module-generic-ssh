const { InstanceBase, Regex, runEntrypoint, InstanceStatus } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades')
const UpdateActions = require('./actions')
const UpdateFeedbacks = require('./feedbacks')
const UpdateVariableDefinitions = require('./variables')
const ssh = require('ssh2')
const fs = require('fs')

const Constants = {
	CMD_ERROR_VAR_NAME: 'returnedError',
	CMD_ERROR_FEEDBACK_NAME: 'commandErrorState',
}

class SSHInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
	}

	async init(config) {
		this.config = config

		this.updateActions() // export actions
		this.updateFeedbacks() // export feedbacks
		this.updateVariableDefinitions() // export variable definitions
		this.initSSH() // start up SSH connection
	}

	// allows other files that have a reference to the instance class to grab the constants
	getConstants() {
		return Constants
	}

	initSSH() {
		if (this.sshClient !== undefined) {
			// clean up the SSH connection
			this.sshClient.destroy()
			delete this.sshClient
			this.updateStatus(InstanceStatus.Disconnected)
		}

		if (this.config.host) {
			// create the ssh connection
			this.sshClient = new ssh.Client()

			var loadedPrivateKey = ''
			// we will enable key-based authentication and load the key from the filepath if there is no password present
			if (this.config.password == null || this.config.password == '') {
				try {
					loadedPrivateKey = fs.readFileSync(this.config.privatekeypath, 'utf8')
					this.log('debug', 'private-key file loaded successfully!')
				} catch (err) {
					this.log('error', 'private-key file load error: ' + err)
				}
			}

			// setup the needed parameters for the SSH client connection
			const authConfig = {
				host: this.config.host,
				port: this.config.port,
				username: this.config.username,
				password: this.config.password,
				privateKey: loadedPrivateKey,
				passphrase: this.config.passphrase,
			}

			try {
				// initiate the SSH client connection
				this.sshClient.connect(authConfig)
			} catch (err) {
				this.log('error', 'initiating connection failed, error: ' + err)
				this.updateStatus(InstanceStatus.ConnectionFailure)
				return
			}

			this.updateStatus(InstanceStatus.Connecting)

			// for password-based authentication, if the server requests for a password change,
			// we really can't do this interactively, so we will need to put the module into an error state and try again.
			this.sshClient.on('change password', (message) => {
				this.log(
					'error',
					'Server requests that you change your password, please do this manually and try the module again in Companion: ' +
						message
				)
				this.updateStatus(InstanceStatus.ConnectionFailure)
			})

			this.sshClient.on('error', (err) => {
				this.log('error', 'Server connection error: ' + err)
				this.updateStatus(InstanceStatus.ConnectionFailure)
			})

			this.sshClient.on('end', () => {
				this.log('error', 'Server ended connection')
				this.updateStatus(InstanceStatus.Disconnected)
			})

			this.sshClient.on('timeout', () => {
				this.log('error', 'Server connection timed out')
				this.updateStatus(InstanceStatus.ConnectionFailure)
			})

			this.sshClient.on('connect', () => {
				this.log('debug', 'Server connection successful!')
				this.updateStatus(InstanceStatus.Ok)
			})

			this.sshClient.on('greeting', (greeting) => {
				this.log('debug', 'Server greeting: ' + greeting)
			})

			this.sshClient.on('handshake', (negotiated) => {
				this.log('debug', 'Server handshake: ' + negotiated)
			})
		}
	}

	// When module gets deleted
	async destroy() {
		this.log('debug', 'destroy')
	}

	async configUpdated(config) {
		this.config = config
		this.initSSH() // restart SSH connection when the config is updated
	}

	// Return config fields for web config
	getConfigFields() {
		return [
			{
				type: 'textinput',
				id: 'host',
				label: 'Target Hostname/IP',
				width: 8,
				regex: Regex.HOSTNAME,
			},
			{
				type: 'textinput',
				id: 'port',
				label: 'Target Port',
				width: 4,
				regex: Regex.PORT,
				default: 22,
			},
			{
				type: 'textinput',
				id: 'username',
				label: 'Username',
				width: 6,
			},
			{
				type: 'textinput',
				id: 'password',
				label: 'Password',
				width: 6,
			},
			{
				type: 'textinput',
				id: 'privatekeypath',
				label: 'Full path to Private Key file on local system (key-based authentication)',
				width: 6,
			},
			{
				type: 'textinput',
				id: 'passphrase',
				label: 'Passphrase (key-based authentication)',
				width: 6,
			},
		]
	}

	updateActions() {
		UpdateActions(this)
	}

	updateFeedbacks() {
		UpdateFeedbacks(this)
	}

	updateVariableDefinitions() {
		UpdateVariableDefinitions(this)
	}
}

runEntrypoint(SSHInstance, UpgradeScripts)
