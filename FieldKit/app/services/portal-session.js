export default class PortalSession {
	constructor(services) {
		this.services = services;
	}

	portal() {
		return this.services.PortalInterface();
	}

	login(user) {
		return this.portal().login(user).then(user => {
			return this.services.StationFirmware().downloadFirmware().then(_ => {
				return user;
			})
		});
	}

	logout() {
		return this.portal().logout();
	}

	register(user) {
		return this.portal().register(user);
	}

	resetPassword(newPassword) {
		return this.portal().logout(newPassword);
	}
}