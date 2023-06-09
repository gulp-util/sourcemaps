import expect from "expect";
import File from "vinyl";
import { _utils as utils } from "..";

describe("utils", function () {
	it("exceptionToString: takes message if present", function (done) {
		const exception = { message: "exception message" };
		const result = utils.exceptionToString(exception);

		expect(result).toEqual("exception message");
		done();
	});

	it("exceptionToString: returns empty string if message is not present", function (done) {
		const exception = { foo: "bar" };
		// @ts-expect-error it needs to fail since the message is not pressent
		const result = utils.exceptionToString(exception);

		expect(result).toEqual("");
		done();
	});

	it("getCommentFormatter: gets a commenter with invalid extension", function (done) {
		const file = new File();
		file.path = "some.junk";
		file.contents = Buffer.from("var a = 'hello';");
		file.sourceMap = { preExistingComment: true };
		const commenter = utils.getCommentFormatter(file);

		expect(commenter).toExist();
		done();
	});
});
