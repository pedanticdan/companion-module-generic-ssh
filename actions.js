module.exports = function (self) {
	self.setActionDefinitions({
		execCommand: {
			name: 'Execute SSH Command',
			options: [
				{
					id: 'cmd',
					type: 'textinput',
					label: 'Command',
				},
			],
			callback: async (event) => {
				// make sure that we start our execution status as OK
				self.setVariableValues({ [self.getConstants().CMD_ERROR_VAR_NAME]: false })
				self.checkFeedbacks(self.getConstants().CMD_ERROR_FEEDBACK_NAME)

				// we need to check for line breaks and execute each line as a separate command
				// NOTE: if you need \n to be in the string without a linefeed, you can use \\n to escape \n representing linefeed
				var currentCmd = event.options.cmd.replace(/\w*(?<!\\)\\n/g, String.fromCharCode(10))

				// make sure to replace any \\n with a regular \n
				var currentCmd = currentCmd.replace(/\\\\n/g, '\\n')

				self.log('debug', 'Excuting command: ' + currentCmd)

				self.sshClient.exec(currentCmd, (err, stream) => {
					stream.stderr.on('data', (data) => {
						// here is where a STDERR happened
						self.setVariableValues({ [self.getConstants().CMD_ERROR_VAR_NAME]: true })
						self.checkFeedbacks(self.getConstants().CMD_ERROR_FEEDBACK_NAME)
						self.log('error', 'Command: ' + currentCmd + ' wrote to STDERR: ')
					})

					stream.on('exit', (code) => {
						if (code != 0) {
							// we have an error code that is not 0 coming back, show error status
							self.setVariableValues({ [self.getConstants().CMD_ERROR_VAR_NAME]: true })
							self.checkFeedbacks(self.getConstants().CMD_ERROR_FEEDBACK_NAME)
							self.log('error', 'Command: ' + currentCmd + ' exited with error code: ' + code)
						}
					})
				})
			},
		},
	})
}
