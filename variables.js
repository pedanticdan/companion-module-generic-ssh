module.exports = async function (self) {
	self.setVariableDefinitions([{ variableId: self.getConstants().CMD_ERROR_VAR_NAME, name: 'Command Error' }])
	self.setVariableValues({ [self.getConstants().CMD_ERROR_VAR_NAME]: false })
}
