"use strict";

const os = require("os");
const exec = require("child_process").exec;
const rimraf = require("rimraf");

const isWindows = os.platform() === "win32";

function cleanUp(cb) {
	rimraf("./tmp", cb);
}

function makeTestPackage(cb) {
	if (isWindows) {
		this.skip();
	}

	return exec("./scripts/mockPublish", cb);
}

describe("mock publish", function () {
	beforeEach(makeTestPackage);
	after(cleanUp);

	// with regards to averting npm publishing disasters https://github.com/gulp-sourcemaps/gulp-sourcemaps/issues/246
	it("can load a published version", function (done) {
		if (isWindows) {
			this.skip();
		}

		try {
			// attempt to load a packed / unpacked potential deployed version
			require("../tmp/package/index");
		} catch (error) {
			done(error);
			return;
		}

		done();
	});
});
