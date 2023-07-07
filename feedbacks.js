const { combineRgb } = require('@companion-module/base')

module.exports = async function (self) {
	self.setFeedbackDefinitions({
		[self.getConstants().CMD_ERROR_FEEDBACK_NAME]: {
			name: 'Command Error',
			type: 'boolean',
			description:
				'Feedback that will activate when the last command(s) ran either returned a non 0 error code, or outputed any data to STDERR.',
			Styles: {
				bgcolor: combineRgb(255, 0, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [],
			callback: (feedback) => {
				var returnedError = self.getVariableValue(self.getConstants().CMD_ERROR_VAR_NAME)
				return returnedError
			},
		},
	})
}
