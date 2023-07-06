module.exports = function (self) {
	self.setActionDefinitions({
		exec_command: {
			name: 'Execute SSH Command',
			options: [
				{
					id: 'cmd',
					type: 'textinput',
					label: 'Command',
				},
			],
			callback: async (event) => {
				self.sshClient.exec(event.options.cmd, (err, stream) => {
					stream.on('data', (data) => {
						self.log('debug', data)
					})

					stream.stderr.on('data', (data) => {
						self.log('error', data)
					})
				})
			},
		},
	})
}
