"use strict";

const expect = require("expect");
const utils = require("../lib/utils");

describe("utils", function () {
	it("exceptionToString: takes message if present", function (done) {
		const exception = { message: "exception message" };
		const result = utils.exceptionToString(exception);

		expect(result).toEqual("exception message");
		done();
	});

	it("exceptionToString: returns empty string if message is not present", function (done) {
		const exception = { foo: "bar" };
		const result = utils.exceptionToString(exception);

		expect(result).toEqual("");
		done();
	});

	it("getCommentFormatter: gets a commenter with invalid extension", function (done) {
		const commenter = utils.getCommentFormatter({
			relative: "some.junk",
			contents: "var a = 'hello';",
			sourceMap: { preExistingComment: true },
		});

		expect(commenter).toExist();
		done();
	});
});
