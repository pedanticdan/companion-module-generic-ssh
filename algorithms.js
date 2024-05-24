
const Ciphers = {
	AUTO: 0,
	AES256: 1,
}

function createAlgorithmsObjectForSSH2(config) {
	let algorithms = undefined;

	switch (config.preferedCipher) {
		case Ciphers.AUTO:
			break;
		case Ciphers.AES256:
			algorithms = {
				cipher: { 
					prepend: new RegExp(/aes256\-gcm/)
				}
			}
			break;

		default:
			break;
	}

	return algorithms;
}

module.exports = {
	Ciphers,
	createAlgorithmsObjectForSSH2
}