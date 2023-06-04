import fs from "fs";
import path from "path";
import File from "vinyl";
import { Readable as ReadableStream, Writable } from "stream";

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
		contents: Buffer.from(sourceContent),
	});
}

function makeNullFile() {
	const junkBuffer = Buffer.from([]);
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
		contents: Buffer.from(contents),
	});
}

function makeFileCSS() {
	return new File({
		cwd: __dirname,
		base: path.join(__dirname, "assets"),
		path: path.join(__dirname, "assets", "test.css"),
		contents: Buffer.from(sourceContentCSS),
	});
}

// https://github.com/gulpjs/glob-stream/blob/d8eace309c58b2097b60c926bd68c98a58451809/test/index.js#L22-L43
function concat<T>(fn?: (f: T[]) => void, timeout?: number) {
	const items = <T[]>[];
	return new Writable({
		objectMode: true,
		write: function (chunk, enc, cb) {
			if (typeof enc === "function") {
				cb = enc;
			}
			setTimeout(function () {
				items.push(chunk);
				cb();
			}, timeout || 1);
		},
		final: function (cb) {
			if (typeof fn === "function") {
				fn(items);
			}

			cb();
		},
	});
}

export {
	sourceContent,
	sourceContentCSS,
	concat,
	makeFile,
	makeFileCSS,
	makeNullFile,
	makeStreamFile,
	makeFileWithInlineSourceMap,
};
