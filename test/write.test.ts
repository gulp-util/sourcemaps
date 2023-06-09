import expect from "expect";
import sourcemaps = require("..");
import File from "vinyl";
import { Readable as ReadableStream } from "stream";
import path from "path";
import fs from "fs";
import { stderr as hookStderr } from "hook-std";
// @ts-expect-error debug-fabulous doesn't have type definitions
import _debug from "debug-fabulous";
import from = require("from2");
import { DEBUG_NAME, concat } from "./test-helpers";
import { pipeline as pipe } from "stream";

const debug = _debug();

const ignoreLogTests = process.argv.indexOf("--ignore-log-tests") !== -1;

if (!ignoreLogTests) {
	debug.save(`${DEBUG_NAME}:*`);
	debug.enable(debug.load());
}

import { _utils as utils } from "..";
import convert from "convert-source-map";

const sourceContent = fs
	.readFileSync(path.join(__dirname, "assets/helloworld.js"))
	.toString();
const mappedContent = fs
	.readFileSync(path.join(__dirname, "assets/helloworld.map.js"))
	.toString();

function makeSourceMap(custom?: object) {
	const obj = {
		version: 3,
		file: "helloworld.js",
		names: <string[]>[],
		mappings: "",
		sources: ["helloworld.js"],
		sourcesContent: [sourceContent],
	};

	if (custom) {
		Object.assign(obj, custom);
	}

	return obj;
}

function base64JSON(object: object) {
	return (
		"data:application/json;charset=utf8;base64," +
		Buffer.from(JSON.stringify(object)).toString("base64")
	);
}

function makeFile(custom?: object) {
	const file = new File({
		cwd: __dirname,
		base: path.join(__dirname, "assets"),
		path: path.join(__dirname, "assets", "helloworld.js"),
		contents: Buffer.from(sourceContent),
	});
	file.sourceMap = makeSourceMap(custom);
	return file;
}

function makeMappedFile() {
	const file = new File({
		cwd: __dirname,
		base: path.join(__dirname, "assets"),
		path: path.join(__dirname, "assets", "helloworld.map.js"),
		contents: Buffer.from(mappedContent),
	});
	file.sourceMap = makeSourceMap({
		preExistingComment: utils.getInlinePreExisting(mappedContent),
	});
	return file;
}

function makeNestedFile() {
	const file = new File({
		cwd: __dirname,
		base: path.join(__dirname, "assets"),
		path: path.join(__dirname, "assets", "dir1", "dir2", "helloworld.js"),
		contents: Buffer.from(sourceContent),
	});
	file.sourceMap = makeSourceMap();
	return file;
}

function makeStreamFile() {
	const file = new File({
		cwd: __dirname,
		base: path.join(__dirname, "assets"),
		path: path.join(__dirname, "assets", "helloworld.js"),
		contents: new ReadableStream(),
	});
	file.sourceMap = {};
	return file;
}

describe("write", function () {
	it("should pass through when file is null", function (done) {
		const file = new File();

		function assert(results: File[]) {
			const data = results[0];
			expect(data).toExist();
			expect(data instanceof File).toEqual(true);
			expect(data).toBe(file);
			expect(data.contents).toEqual(null);
		}

		pipe([from.obj([file]), sourcemaps.write(), concat(assert)], done);
	});

	it("should pass through when file has no source map", function (done) {
		const file = makeFile();
		delete file.sourceMap;

		function assert(results: File[]) {
			const data = results[0];
			expect(data).toExist();
			expect(data instanceof File).toEqual(true);
			expect(data).toBe(file);
			expect(data.contents.toString()).toEqual(sourceContent);
		}

		pipe([from.obj([file]), sourcemaps.write(), concat(assert)], done);
	});

	it("should emit an error if file content is a stream", function (done) {
		const file = makeStreamFile();

		pipe(
			[from.obj([file]), sourcemaps.write(), concat()],
			function (err: Error) {
				expect(err).toExist();
				done();
			}
		);
	});

	it("should write an inline source map", function (done) {
		const file = makeFile();

		function assert(results: File[]) {
			const data = results[0];
			expect(data).toExist();
			expect(data instanceof File).toEqual(true);
			expect(data).toBe(file);
			expect(data.contents.toString()).toEqual(
				sourceContent +
					"\n//# sourceMappingURL=" +
					base64JSON(data.sourceMap) +
					"\n"
			);
		}

		pipe([from.obj([file]), sourcemaps.write(), concat(assert)], done);
	});

	it("should use CSS comments if CSS file", function (done) {
		const file = makeFile();
		file.path = file.path.replace(".js", ".css");

		function assert(results: File[]) {
			const data = results[0];
			expect(data.contents.toString()).toEqual(
				sourceContent +
					"\n/*# sourceMappingURL=" +
					base64JSON(data.sourceMap) +
					" */\n"
			);
		}

		pipe([from.obj([file]), sourcemaps.write(), concat(assert)], done);
	});

	it("should write no comment if not JS or CSS file", function (done) {
		const file = makeFile();
		file.path = file.path.replace(".js", ".txt");

		function assert(results: File[]) {
			const data = results[0];
			expect(data.contents.toString()).toEqual(sourceContent);
		}

		pipe([from.obj([file]), sourcemaps.write(), concat(assert)], done);
	});

	it("should detect whether a file uses \\n or \\r\\n and follow the existing style", function (done) {
		const file = makeFile();
		file.contents = Buffer.from(
			file.contents.toString().replace(/\n/g, "\r\n")
		);

		function assert(results: File[]) {
			const data = results[0];
			expect(data.contents.toString()).toEqual(
				sourceContent.replace(/\n/g, "\r\n") +
					"\r\n//# sourceMappingURL=" +
					base64JSON(data.sourceMap) +
					"\r\n"
			);
		}

		pipe([from.obj([file]), sourcemaps.write(), concat(assert)], done);
	});

	it("preExistingComment", function (done) {
		const file = makeMappedFile();
		file.contents = Buffer.from(
			convert.removeComments(file.contents.toString())
		);

		function assert(results: File[]) {
			const data = results[0];
			expect(data).toExist();
			expect(data.sourceMap.preExistingComment).toExist();
			expect(data.contents.toString()).toEqual(
				sourceContent +
					"\n//# sourceMappingURL=" +
					base64JSON(data.sourceMap) +
					"\n"
			);
		}

		pipe([from.obj([file]), sourcemaps.write(), concat(assert)], done);
	});

	it("should write external map files", function (done) {
		const file = makeFile();

		function assert(results: File[]) {
			const dataFile = results[1];
			console.log("debugging", dataFile.path);
			expect(dataFile.path).toEqual(
				path.join(__dirname, "assets/helloworld.js")
			);
			expect(dataFile instanceof File).toEqual(true);
			expect(dataFile).toBe(file);
			expect(dataFile.contents.toString()).toEqual(
				sourceContent +
					"\n//# sourceMappingURL=../maps/helloworld.js.map\n"
			);
			expect(dataFile.sourceMap.file).toEqual("../dist/helloworld.js");

			const mapFile = results[0];
			expect(mapFile instanceof File).toEqual(true);
			expect(mapFile.path).toEqual(
				path.join(__dirname, "maps/helloworld.js.map")
			);
			const mapFileContents = JSON.parse(mapFile.contents.toString());
			expect(mapFileContents).toEqual(dataFile.sourceMap);
			expect(mapFile.stat.isFile()).toEqual(true);
			expect(mapFile.stat.isDirectory()).toEqual(false);
			expect(mapFile.stat.isBlockDevice()).toEqual(false);
			expect(mapFile.stat.isCharacterDevice()).toEqual(false);
			expect(mapFile.stat.isSymbolicLink()).toEqual(false);
			expect(mapFile.stat.isFIFO()).toEqual(false);
			expect(mapFile.stat.isSocket()).toEqual(false);
		}

		pipe(
			[
				from.obj([file]),
				sourcemaps.write("../maps", { destPath: "dist" }),
				concat(assert),
			],
			done
		);
	});

	it("clone - should keep original file history", function (done) {
		const file = makeFile();

		function assert(results: File[]) {
			const data = results[0];
			expect(data.path).toEqual(
				path.join(__dirname, "maps/helloworld.js.map")
			);
			expect(data.history[0]).toEqual(
				path.join(__dirname, "assets/helloworld.js")
			);
		}

		pipe(
			[
				from.obj([file]),
				sourcemaps.write("../maps", { destPath: "dist" }),
				concat(assert),
			],
			done
		);
	});

	it("should allow to rename map file", function (done) {
		const file = makeFile();

		function assert(results: File[]) {
			const dataFile = results[1];
			expect(dataFile.path).toEqual(
				path.join(__dirname, "assets/helloworld.js")
			);
			expect(dataFile instanceof File).toEqual(true);
			expect(dataFile).toBe(file);
			expect(dataFile.contents.toString()).toEqual(
				sourceContent +
					"\n//# sourceMappingURL=../maps/helloworld.map\n"
			);
			expect(dataFile.sourceMap.file).toEqual("../dist/helloworld.js");

			const mapFile = results[0];
			expect(mapFile instanceof File).toEqual(true);
			expect(mapFile.path).toEqual(
				path.join(__dirname, "maps/helloworld.map")
			);
			const mapFileContents = JSON.parse(mapFile.contents.toString());
			expect(mapFileContents).toEqual(dataFile.sourceMap);
		}

		pipe(
			[
				from.obj([file]),
				sourcemaps.write("../maps", {
					mapFile: function (mapFile) {
						return mapFile.replace(".js.map", ".map");
					},
					destPath: "dist",
				}),
				concat(assert),
			],
			done
		);
	});

	it("should create shortest path to map in file comment", function (done) {
		const file = makeNestedFile();

		function assert(results: File[]) {
			const data = results[1];
			expect(data.path).toEqual(
				path.join(__dirname, "assets/dir1/dir2/helloworld.js")
			);
			expect(data.contents.toString()).toEqual(
				sourceContent +
					"\n//# sourceMappingURL=../maps/dir1/dir2/helloworld.js.map\n"
			);
		}

		pipe(
			[from.obj([file]), sourcemaps.write("dir1/maps"), concat(assert)],
			done
		);
	});

	it("should write no comment with option addComment=false", function (done) {
		const file = makeFile();

		function assert(results: File[]) {
			const data = results[0];
			expect(data.contents.toString()).toEqual(sourceContent);
		}

		pipe(
			[
				from.obj([file]),
				sourcemaps.write(null, { addComment: false }),
				concat(assert),
			],
			done
		);
	});

	it("should not include source content with option includeContent=false", function (done) {
		const file = makeFile();

		function assert(results: File[]) {
			const data = results[0];
			expect(data.sourceMap.sourcesContent).toEqual(undefined);
		}

		pipe(
			[
				from.obj([file]),
				sourcemaps.write(null, { includeContent: false }),
				concat(assert),
			],
			done
		);
	});

	it("should fetch missing sourceContent", function (done) {
		const file = makeFile();
		delete file.sourceMap.sourcesContent;

		function assert(results: File[]) {
			const data = results[0];
			expect(data.sourceMap.sourcesContent).toExist();
			expect(data.sourceMap.sourcesContent).toEqual([sourceContent]);
		}

		pipe([from.obj([file]), sourcemaps.write(), concat(assert)], done);
	});

	it("should not throw when unable to fetch missing sourceContent", function (done) {
		const file = makeFile();
		file.sourceMap.sources[0] += ".invalid";
		delete file.sourceMap.sourcesContent;

		function assert(results: File[]) {
			const data = results[0];
			expect(data.sourceMap.sourcesContent).toExist();
			expect(data.sourceMap.sourcesContent).toEqual([]);
		}

		pipe([from.obj([file]), sourcemaps.write(), concat(assert)], done);
	});

	it("should set the sourceRoot by option sourceRoot", function (done) {
		const file = makeFile();

		function assert(results: File[]) {
			const data = results[0];
			expect(data.sourceMap.sources).toEqual(["helloworld.js"]);
			expect(data.sourceMap.sourceRoot).toEqual("/testSourceRoot");
		}

		pipe(
			[
				from.obj([file]),
				sourcemaps.write(null, { sourceRoot: "/testSourceRoot" }),
				concat(assert),
			],
			done
		);
	});

	it("should set the mapSourcesAbsolute by option mapSourcesAbsolute", function (done) {
		const file = makeFile();

		function assert(results: File[]) {
			const data = results[0];
			expect(data.sourceMap.sources).toEqual(["/assets/helloworld.js"]);
			expect(data.sourceMap.sourceRoot).toEqual("/testSourceRoot");
		}

		pipe(
			[
				from.obj([file]),
				sourcemaps.write(null, {
					sourceRoot: "/testSourceRoot",
					mapSourcesAbsolute: true,
				}),
				concat(assert),
			],
			done
		);
	});

	it("should set the sourceRoot by option sourceRoot, as a function", function (done) {
		const file = makeFile();

		function assert(results: File[]) {
			const data = results[0];
			expect(data.sourceMap.sourceRoot).toEqual("/testSourceRoot");
		}

		pipe(
			[
				from.obj([file]),
				sourcemaps.write(null, {
					sourceRoot: function () {
						return "/testSourceRoot";
					},
				}),
				concat(assert),
			],
			done
		);
	});

	it("should automatically determine sourceRoot if destPath is set", function (done) {
		const file = makeNestedFile();

		function assert(results: File[]) {
			const dataFile = results[1];
			expect(dataFile.path).toEqual(
				path.join(__dirname, "assets/dir1/dir2/helloworld.js")
			);
			expect(dataFile.sourceMap.sourceRoot).toEqual("../../../assets");
			expect(dataFile.sourceMap.file).toEqual("helloworld.js");
			const mapFile = results[0];
			expect(mapFile.path).toEqual(
				path.join(__dirname, "assets/dir1/dir2/helloworld.js.map")
			);
		}

		pipe(
			[
				from.obj([file]),
				sourcemaps.write(".", {
					destPath: "dist",
					includeContent: false,
				}),
				concat(assert),
			],
			done
		);
	});

	it("should interpret relative path in sourceRoot as relative to destination", function (done) {
		const file = makeNestedFile();

		function assert(results: File[]) {
			const dataFile = results[1];
			expect(dataFile.path).toEqual(
				path.join(__dirname, "assets/dir1/dir2/helloworld.js")
			);
			expect(dataFile.sourceMap.sourceRoot).toEqual("../../../src");
			expect(dataFile.sourceMap.file).toEqual("helloworld.js");
			const mapFile = results[0];
			expect(mapFile.path).toEqual(
				path.join(__dirname, "assets/dir1/dir2/helloworld.js.map")
			);
		}

		pipe(
			[
				from.obj([file]),
				sourcemaps.write(".", { sourceRoot: "../src" }),
				concat(assert),
			],
			done
		);
	});

	it("should interpret relative path in sourceRoot as relative to destination (part 2)", function (done) {
		const file = makeNestedFile();

		function assert(results: File[]) {
			const dataFile = results[1];
			expect(dataFile.path).toEqual(
				path.join(__dirname, "assets/dir1/dir2/helloworld.js")
			);
			expect(dataFile.sourceMap.sourceRoot).toEqual("../..");
			expect(dataFile.sourceMap.file).toEqual("helloworld.js");
			const mapFile = results[0];
			expect(mapFile.path).toEqual(
				path.join(__dirname, "assets/dir1/dir2/helloworld.js.map")
			);
		}

		pipe(
			[
				from.obj([file]),
				sourcemaps.write(".", { sourceRoot: "" }),
				concat(assert),
			],
			done
		);
	});

	it("should interpret relative path in sourceRoot as relative to destination (part 3)", function (done) {
		const file = makeNestedFile();

		function assert(results: File[]) {
			const dataFile = results[1];
			expect(dataFile.path).toEqual(
				path.join(__dirname, "assets/dir1/dir2/helloworld.js")
			);
			expect(dataFile.sourceMap.sourceRoot).toEqual("../../../../src");
			expect(dataFile.sourceMap.file).toEqual(
				"../../../dir1/dir2/helloworld.js"
			);
			const mapFile = results[0];
			expect(mapFile.path).toEqual(
				path.join(__dirname, "assets/maps/dir1/dir2/helloworld.js.map")
			);
		}

		pipe(
			[
				from.obj([file]),
				sourcemaps.write("maps", { sourceRoot: "../src" }),
				concat(assert),
			],
			done
		);
	});

	it("should interpret relative path in sourceRoot as relative to destination (part 4)", function (done) {
		const file = makeNestedFile();

		function assert(results: File[]) {
			const dataFile = results[1];
			expect(dataFile.path).toEqual(
				path.join(__dirname, "assets/dir1/dir2/helloworld.js")
			);
			expect(dataFile.sourceMap.sourceRoot).toEqual("../../../src");
			expect(dataFile.sourceMap.file).toEqual(
				"../../../dist/dir1/dir2/helloworld.js"
			);
			const mapFile = results[0];
			expect(mapFile.path).toEqual(
				path.join(__dirname, "maps/dir1/dir2/helloworld.js.map")
			);
		}

		pipe(
			[
				from.obj([file]),
				sourcemaps.write("../maps", {
					sourceRoot: "../src",
					destPath: "dist",
				}),
				concat(assert),
			],
			done
		);
	});

	it("should accept a sourceMappingURLPrefix", function (done) {
		const file = makeFile();

		function assert(results: File[]) {
			const data = results[1];
			expect(/helloworld\.js$/.test(data.path)).toEqual(true);
			expect(
				data.contents.toString().match(/sourceMappingURL.*\n$/)[0]
			).toEqual(
				"sourceMappingURL=https://asset-host.example.com/maps/helloworld.js.map\n"
			);
		}

		pipe(
			[
				from.obj([file]),
				sourcemaps.write("../maps", {
					sourceMappingURLPrefix: "https://asset-host.example.com",
				}),
				concat(assert),
			],
			done
		);
	});

	it("should accept a sourceMappingURLPrefix, as a function", function (done) {
		const file = makeFile();

		function assert(results: File[]) {
			const data = results[1];
			expect(/helloworld\.js$/.test(data.path)).toEqual(true);
			expect(
				data.contents.toString().match(/sourceMappingURL.*\n$/)[0]
			).toEqual(
				"sourceMappingURL=https://asset-host.example.com/maps/helloworld.js.map\n"
			);
		}

		pipe(
			[
				from.obj([file]),
				sourcemaps.write("../maps", {
					sourceMappingURLPrefix: function () {
						return "https://asset-host.example.com";
					},
				}),
				concat(assert),
			],
			done
		);
	});

	it("should invoke sourceMappingURLPrefix every time", function (done) {
		let times = 0;

		const files = [makeFile(), makeFile(), makeFile()];

		function assert(results: File[]) {
			// Only the files, not maps
			[results[1], results[3], results[5]].forEach(function (data, idx) {
				expect(/helloworld\.js$/.test(data.path)).toEqual(true);
				expect(
					data.contents.toString().match(/sourceMappingURL.*\n$/)[0]
				).toEqual(
					"sourceMappingURL=https://asset-host.example.com/" +
						(idx + 1) +
						"/maps/helloworld.js.map\n"
				);
			});
		}

		pipe(
			[
				from.obj(files),
				sourcemaps.write("../maps", {
					sourceMappingURLPrefix: function () {
						++times;
						return "https://asset-host.example.com/" + times;
					},
				}),
				concat(assert),
			],
			done
		);
	});

	it("null as sourceRoot should not set the sourceRoot", function (done) {
		const file = makeFile();

		function assert(results: File[]) {
			const data = results[0];
			expect(data.sourceMap.sourceRoot).toEqual(undefined);
		}

		pipe(
			[
				from.obj([file]),
				sourcemaps.write(null, { sourceRoot: null }),
				concat(assert),
			],
			done
		);
	});

	it("function returning null as sourceRoot should not set the sourceRoot", function (done) {
		const file = makeFile();

		function assert(results: File[]) {
			const data = results[0];
			expect(data.sourceMap.sourceRoot).toEqual(undefined);
		}

		pipe(
			[
				from.obj([file]),
				sourcemaps.write(null, {
					sourceRoot: function () {
						return null;
					},
				}),
				concat(assert),
			],
			done
		);
	});

	it("empty string as sourceRoot should be kept", function (done) {
		const file = makeFile();

		function assert(results: File[]) {
			const data = results[0];
			expect(data.sourceMap.sourceRoot).toEqual("");
		}

		pipe(
			[
				from.obj([file]),
				sourcemaps.write(null, { sourceRoot: "" }),
				concat(assert),
			],
			done
		);
	});

	it("should be able to fully control sourceMappingURL by the option sourceMappingURL", function (done) {
		const file = makeNestedFile();

		function assert(results: File[]) {
			const data = results[1];
			expect(/helloworld\.js$/.test(data.path)).toEqual(true);
			expect(data.contents.toString()).toEqual(
				sourceContent +
					"\n//# sourceMappingURL=http://maps.example.com/helloworld.js.map\n"
			);
		}

		pipe(
			[
				from.obj([file]),
				sourcemaps.write("../aaa/bbb/", {
					sourceMappingURL: function (file) {
						// This avoids file.relative because Windows path separators
						return (
							"http://maps.example.com/" + file.basename + ".map"
						);
					},
				}),
				concat(assert),
			],
			done
		);
	});

	it("should allow to change sources", function (done) {
		const file = makeFile();

		function assert(results: File[]) {
			const data = results[0];
			expect(data.sourceMap.sources).toEqual(["../src/helloworld.js"]);
		}

		pipe(
			[
				from.obj([file]),
				sourcemaps.write(null, {
					mapSources: function (sourcePath: string, f: File) {
						expect(file).toEqual(f);
						return "../src/" + sourcePath;
					},
				}),
				concat(assert),
			],
			done
		);
	});

	it("can replace `mapSources` option with sourcemap.mapSources stream", function (done) {
		const file = makeFile();

		function assert(results: File[]) {
			const data = results[0];
			expect(data.sourceMap.sources).toEqual(["../src/helloworld.js"]);
		}

		pipe(
			[
				from.obj([file]),
				sourcemaps.mapSources(function (sourcePath: string, f: File) {
					expect(file).toEqual(f);
					return "../src/" + sourcePath;
				}),
				sourcemaps.write(),
				concat(assert),
			],
			done
		);
	});

	if (!ignoreLogTests) {
		// Should always be last as disabling a debug namespace does not work
		it("should output an error message if debug option is set and sourceContent is missing", function (done) {
			const file = makeFile();
			file.sourceMap.sources[0] += ".invalid";
			delete file.sourceMap.sourcesContent;

			const history: string[] = [];

			const hook = hookStderr(function (s: string) {
				history.push(s);
			});

			async function assert() {
				hook.unhook();
				const hasRegex = function (regex: RegExp) {
					return function (s: string) {
						return regex.test(s);
					};
				};

				expect(
					history.some(
						hasRegex(
							/No source content for "helloworld.js.invalid". Loading from file./g
						)
					)
				).toEqual(true);
				expect(
					history.some(hasRegex(/source file not found: /g))
				).toEqual(true);
			}

			pipe([from.obj([file]), sourcemaps.write(), concat(assert)], done);
		});
	}
});
