const fs = require("fs");
const path = require("path");
const File = require("vinyl");
const ReadableStream = require("stream").Readable;

const sourceContent = fs
	.readFileSync(path.join(__dirname, "assets/helloworld.js"))
	.toString();

const sourceContentCSS = fs
	.readFileSync(path.join(__dirname, "assets/test.css"))
	.toString();

function makeFile() {
	return new File({
		cwd: __dirname,
		base: path.join(__dirname, "assets"),
		path: path.join(__dirname, "assets", "helloworld.js"),
		contents: Buffer.from
			? Buffer.from(sourceContent)
			: new Buffer(sourceContent),
	});
}

function makeNullFile() {
	const junkBuffer = new Buffer([]);
	junkBuffer.toString = function () {
		return null;
	};

	return new File({
		cwd: __dirname,
		base: path.join(__dirname, "assets"),
		path: path.join(__dirname, "assets", "helloworld.js"),
		contents: junkBuffer,
	});
}

function makeStreamFile() {
	return new File({
		cwd: __dirname,
		base: path.join(__dirname, "assets"),
		path: path.join(__dirname, "assets", "helloworld.js"),
		contents: new ReadableStream(),
	});
}

function makeFileWithInlineSourceMap() {
	const contents =
		'console.log("line 1.1"),console.log("line 1.2"),console.log("line 2.1"),console.log("line 2.2");\n//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxsLmpzIiwic291cmNlcyI6WyJ0ZXN0MS5qcyIsInRlc3QyLmpzIl0sIm5hbWVzIjpbImNvbnNvbGUiLCJsb2ciXSwibWFwcGluZ3MiOiJBQUFBQSxRQUFBQyxJQUFBLFlBQ0FELFFBQUFDLElBQUEsWUNEQUQsUUFBQUMsSUFBQSxZQUNBRCxRQUFBQyxJQUFBIiwic291cmNlc0NvbnRlbnQiOlsiY29uc29sZS5sb2coJ2xpbmUgMS4xJyk7XG5jb25zb2xlLmxvZygnbGluZSAxLjInKTtcbiIsImNvbnNvbGUubG9nKCdsaW5lIDIuMScpO1xuY29uc29sZS5sb2coJ2xpbmUgMi4yJyk7Il0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9';

	return new File({
		cwd: __dirname,
		base: path.join(__dirname, "assets"),
		path: path.join(__dirname, "assets", "all.js"),
		contents: Buffer.from ? Buffer.from(contents) : new Buffer(contents),
	});
}

function makeFileCSS() {
	return new File({
		cwd: __dirname,
		base: path.join(__dirname, "assets"),
		path: path.join(__dirname, "assets", "test.css"),
		contents: Buffer.from
			? Buffer.from(sourceContentCSS)
			: new Buffer(sourceContentCSS),
	});
}

module.exports = {
	sourceContent: sourceContent,
	sourceContentCSS: sourceContentCSS,
	makeFile: makeFile,
	makeFileCSS: makeFileCSS,
	makeNullFile: makeNullFile,
	makeStreamFile: makeStreamFile,
	makeFileWithInlineSourceMap: makeFileWithInlineSourceMap,
};
