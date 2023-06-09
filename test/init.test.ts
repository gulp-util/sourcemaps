import expect from "expect";
// BEGIN PRE-HOOK of debug
// @ts-expect-error debug-fabulous doesn't have type definitions
import _debug from "debug-fabulous";
import from = require("from2");
import { concat } from "./test-helpers";
import { pipeline as pipe } from "stream";
import * as helpers from "./test-helpers";

const debug = _debug();

const ignoreLogTests = process.argv.indexOf("--ignore-log-tests") !== -1;

if (!ignoreLogTests) {
	debug.save(`${helpers.DEBUG_NAME}:*`);
	debug.enable(debug.load());
}
// END PRE-HOOK of debug (must be loaded before our main module (sourcemaps))
import sourcemaps = require("..");
import File from "vinyl";
import { stderr as hookStderr } from "hook-std";

describe("init", function () {
	it("should pass through when file is null", function (done) {
		// end inner conflict
		const file = new File();

		function assert(results: File[]) {
			const data = results[0];
			expect(data).toExist();
			expect(data instanceof File).toEqual(true);
			expect(data.sourceMap).toNotExist();
			expect(data).toEqual(file);
		}

		pipe([from.obj([file]), sourcemaps.init(), concat(assert)], done);
	});

	it("should emit an error if file content is a stream", function (done) {
		const file = helpers.makeStreamFile();

		function assert(err: Error) {
			expect(err).toExist();

			done();
		}

		pipe([from.obj([file]), sourcemaps.init(), concat()], assert);
	});

	it("should add an empty source map", function (done) {
		const file = helpers.makeFile();

		function assert(results: File[]) {
			const data = results[0];
			expect(data).toExist();
			expect(data instanceof File).toEqual(true);
			expect(data.sourceMap).toExist();
			expect(String(data.sourceMap.version)).toEqual("3");
			expect(data.sourceMap.sources[0]).toEqual("helloworld.js");
			expect(data.sourceMap.sourcesContent[0]).toEqual(
				helpers.sourceContent
			);
			expect(data.sourceMap.names).toEqual([]);
			expect(data.sourceMap.mappings).toEqual("");
		}

		pipe([from.obj([file]), sourcemaps.init(), concat(assert)], done);
	});

	it("should add a valid source map if wished", function (done) {
		const file = helpers.makeFile();

		function assert(results: File[]) {
			const data = results[0];
			expect(data).toExist();
			expect(data instanceof File).toEqual(true);
			expect(data.sourceMap).toExist();
			expect(String(data.sourceMap.version)).toEqual("3");
			expect(data.sourceMap.sources[0]).toEqual("helloworld.js");
			expect(data.sourceMap.sourcesContent[0]).toEqual(
				helpers.sourceContent
			);
			expect(data.sourceMap.names).toEqual([
				"helloWorld",
				"console",
				"log",
			]);
			expect(data.sourceMap.mappings).toEqual(
				"AAAA,YAAY;;AAEZ,SAASA,UAAU,CAAC,EAAE;IAClBC,OAAO,CAACC,GAAG,CAAC,cAAc,CAAC;AAC/B"
			);
		}

		pipe(
			[
				from.obj([file]),
				sourcemaps.init({ identityMap: true }),
				concat(assert),
			],
			done
		);
	});

	it("should add a valid source map for css if wished", function (done) {
		const file = helpers.makeFileCSS();

		function assert(results: File[]) {
			const data = results[0];
			expect(data).toExist();
			expect(data instanceof File).toEqual(true);
			expect(data.sourceMap).toExist();
			expect(String(data.sourceMap.version)).toEqual("3");
			expect(data.sourceMap.sources[0]).toEqual("test.css");
			expect(data.sourceMap.sourcesContent[0]).toEqual(
				helpers.sourceContentCSS
			);
			expect(data.sourceMap.names).toEqual([]);
			expect(data.sourceMap.mappings).toEqual("CAAC;GACE;GACA");
		}

		pipe(
			[
				from.obj([file]),
				sourcemaps.init({ identityMap: true }),
				concat(assert),
			],
			done
		);
	});

	it("init: can replace `identityMap` option with sourcemap.identityMap stream (js file)", function (done) {
		const file = helpers.makeFile();

		function assert(results: File[]) {
			const data = results[0];
			expect(data).toExist();
			expect(data instanceof File).toEqual(true);
			expect(data.sourceMap).toExist();
			expect(String(data.sourceMap.version)).toEqual("3");
			expect(data.sourceMap.sources[0]).toEqual("helloworld.js");
			expect(data.sourceMap.sourcesContent[0]).toEqual(
				helpers.sourceContent
			);
			expect(data.sourceMap.names).toEqual([
				"helloWorld",
				"console",
				"log",
			]);
			expect(data.sourceMap.mappings).toEqual(
				"AAAA,YAAY;;AAEZ,SAASA,UAAU,CAAC,EAAE;IAClBC,OAAO,CAACC,GAAG,CAAC,cAAc,CAAC;AAC/B"
			);
		}

		pipe(
			[
				from.obj([file]),
				sourcemaps.init(),
				sourcemaps.identityMap(),
				concat(assert),
			],
			done
		);
	});

	it("can replace `identityMap` option with sourcemap.identityMap stream (css file)", function (done) {
		const file = helpers.makeFileCSS();

		function assert(results: File[]) {
			const data = results[0];
			expect(data).toExist();
			expect(data instanceof File).toEqual(true);
			expect(data.sourceMap).toExist();
			expect(String(data.sourceMap.version)).toEqual("3");
			expect(data.sourceMap.sources[0]).toEqual("test.css");
			expect(data.sourceMap.sourcesContent[0]).toEqual(
				helpers.sourceContentCSS
			);
			expect(data.sourceMap.names).toEqual([]);
			expect(data.sourceMap.mappings).toEqual(
				"AAAA;EACE,gBAAgB;EAChB,WAAW;AACb"
			);
		}

		pipe(
			[
				from.obj([file]),
				sourcemaps.init(),
				sourcemaps.identityMap(),
				concat(assert),
			],
			done
		);
	});

	it("should import an existing inline source map", function (done) {
		const file = helpers.makeFileWithInlineSourceMap();

		function assert(results: File[]) {
			const data = results[0];
			expect(data).toExist();
			expect(data instanceof File).toEqual(true);
			expect(data.sourceMap).toExist();
			expect(/sourceMappingURL/.test(data.contents.toString())).toEqual(
				false
			);
			expect(String(data.sourceMap.version)).toEqual("3");
			expect(data.sourceMap.sources).toEqual(["test1.js", "test2.js"]);
			expect(data.sourceMap.sourcesContent).toEqual([
				"console.log('line 1.1');\nconsole.log('line 1.2');\n",
				"console.log('line 2.1');\nconsole.log('line 2.2');",
			]);
			expect(data.sourceMap.mappings).toEqual(
				"AAAAA,QAAAC,IAAA,YACAD,QAAAC,IAAA,YCDAD,QAAAC,IAAA,YACAD,QAAAC,IAAA"
			);
		}

		pipe(
			[
				from.obj([file]),
				sourcemaps.init({ loadMaps: true }),
				concat(assert),
			],
			done
		);
	});

	it("should load external source map file referenced in comment with the //# syntax", function (done) {
		const file = helpers.makeFile();
		file.contents = Buffer.from(
			helpers.sourceContent + "\n//# sourceMappingURL=helloworld2.js.map"
		);

		function assert(results: File[]) {
			const data = results[0];
			expect(data.sourceMap).toExist();
			expect(String(data.sourceMap.version)).toEqual("3");
			expect(data.sourceMap.sources).toEqual(["helloworld2.js"]);
			expect(data.sourceMap.sourcesContent).toEqual([
				"source content from source map",
			]);
			expect(data.sourceMap.mappings).toEqual("");
		}

		pipe(
			[
				from.obj([file]),
				sourcemaps.init({ loadMaps: true }),
				concat(assert),
			],
			done
		);
	});

	it("css: should load external source map file referenced in comment with the //*# syntax", function (done) {
		const file = helpers.makeFileCSS();
		file.contents = Buffer.from(
			helpers.sourceContentCSS + "\n/*# sourceMappingURL=test.css.map */"
		);

		function assert(results: File[]) {
			const data = results[0];
			expect(data.sourceMap).toExist();
			expect(String(data.sourceMap.version)).toEqual("3");
			expect(data.sourceMap.sources).toEqual(["../test.css"]);
			expect(data.sourceMap.sourcesContent).toEqual([
				"body {\n  background: #eee;\n  color: #888;\n}\n\n",
			]);
			expect(data.sourceMap.mappings).toEqual("");
		}

		pipe(
			[
				from.obj([file]),
				sourcemaps.init({ loadMaps: true }),
				concat(assert),
			],
			done
		);
	});

	it("should remove source map comment with the //# syntax", function (done) {
		const file = helpers.makeFile();
		file.contents = Buffer.from(
			helpers.sourceContent + "\n//# sourceMappingURL=helloworld2.js.map"
		);

		function assert(results: File[]) {
			const data = results[0];
			expect(/sourceMappingURL/.test(data.contents.toString())).toEqual(
				false
			);
		}

		pipe(
			[
				from.obj([file]),
				sourcemaps.init({ loadMaps: true }),
				concat(assert),
			],
			done
		);
	});

	it("init: css: should remove source map comment with the //*# syntax", function (done) {
		const file = helpers.makeFileCSS();
		file.contents = Buffer.from(
			helpers.sourceContentCSS + "\n/*# sourceMappingURL=test.css.map */"
		);

		function assert(results: File[]) {
			const data = results[0];
			const actualContents = data.contents.toString();
			expect(/sourceMappingURL/.test(actualContents)).toEqual(false);
		}

		pipe(
			[
				from.obj([file]),
				sourcemaps.init({ loadMaps: true }),
				concat(assert),
			],
			done
		);
	});

	it("should load external source map file referenced in comment with the /*# */ syntax", function (done) {
		const file = helpers.makeFile();
		file.contents = Buffer.from(
			helpers.sourceContent +
				"\n/*# sourceMappingURL=helloworld2.js.map */"
		);

		function assert(results: File[]) {
			const data = results[0];
			expect(data.sourceMap).toExist();
			expect(String(data.sourceMap.version)).toEqual("3");
			expect(data.sourceMap.sources).toEqual(["helloworld2.js"]);
			expect(data.sourceMap.sourcesContent).toEqual([
				"source content from source map",
			]);
			expect(data.sourceMap.mappings).toEqual("");
		}

		pipe(
			[
				from.obj([file]),
				sourcemaps.init({ loadMaps: true }),
				concat(assert),
			],
			done
		);
	});

	it("should remove source map comment with the /* # */ syntax", function (done) {
		const file = helpers.makeFile();
		file.contents = Buffer.from(
			helpers.sourceContent +
				"\n/*# sourceMappingURL=helloworld2.js.map */"
		);

		function assert(results: File[]) {
			const data = results[0];
			expect(/sourceMappingURL/.test(data.contents.toString())).toEqual(
				false
			);
		}

		pipe(
			[
				from.obj([file]),
				sourcemaps.init({ loadMaps: true }),
				concat(assert),
			],
			done
		);
	});

	it("should load external source map if no source mapping comment", function (done) {
		const file = helpers.makeFile();
		file.path = file.path.replace("helloworld.js", "helloworld2.js");

		function assert(results: File[]) {
			const data = results[0];
			expect(data.sourceMap).toExist();
			expect(String(data.sourceMap.version)).toEqual("3");
			expect(data.sourceMap.sources).toEqual(["helloworld2.js"]);
			expect(data.sourceMap.sourcesContent).toEqual([
				"source content from source map",
			]);
			expect(data.sourceMap.mappings).toEqual("");
		}

		pipe(
			[
				from.obj([file]),
				sourcemaps.init({ loadMaps: true }),
				concat(assert),
			],
			done
		);
	});

	it("should load external source map and add sourceContent if missing", function (done) {
		const file = helpers.makeFile();
		file.contents = Buffer.from(
			helpers.sourceContent + "\n//# sourceMappingURL=helloworld3.js.map"
		);

		function assert(results: File[]) {
			const data = results[0];
			expect(data.sourceMap).toExist();
			expect(String(data.sourceMap.version)).toEqual("3");
			expect(data.sourceMap.sources).toEqual([
				"helloworld.js",
				"test1.js",
			]);
			expect(data.sourceMap.sourcesContent).toEqual([
				file.contents.toString(),
				"test1\n",
			]);
			expect(data.sourceMap.mappings).toEqual("");
		}

		pipe(
			[
				from.obj([file]),
				sourcemaps.init({ loadMaps: true }),
				concat(assert),
			],
			done
		);
	});

	it("should not throw when source file for sourceContent not found", function (done) {
		const file = helpers.makeFile();
		file.contents = Buffer.from(
			helpers.sourceContent + "\n//# sourceMappingURL=helloworld4.js.map"
		);

		function assert(results: File[]) {
			const data = results[0];
			expect(data.sourceMap).toExist();
			expect(String(data.sourceMap.version)).toEqual("3");
			expect(data.sourceMap.sources).toEqual([
				"helloworld.js",
				"missingfile",
			]);
			expect(data.sourceMap.sourcesContent).toEqual([
				file.contents.toString(),
				null,
			]);
			expect(data.sourceMap.mappings).toEqual("");
		}

		pipe(
			[
				from.obj([file]),
				sourcemaps.init({ loadMaps: true }),
				concat(assert),
			],
			done
		);
	});

	// vinyl 2.X breaks this spec, not exactly sure why but it is due to the following commit
	// https://github.com/gulpjs/vinyl/commit/ece4abf212c83aa3e2613c57a4a0fe96171d5755
	it("should use unix style paths in sourcemap", function (done) {
		const file = helpers.makeFile();
		file.base = file.cwd;

		function assert(results: File[]) {
			const data = results[0];
			expect(data.sourceMap.file).toEqual("assets/helloworld.js");
			expect(data.sourceMap.sources).toEqual(["assets/helloworld.js"]);
		}

		pipe([from.obj([file]), sourcemaps.init(), concat(assert)], done);
	});

	it("should use sourceRoot when resolving path to sources", function (done) {
		const file = helpers.makeFile();
		file.contents = Buffer.from(
			helpers.sourceContent + "\n//# sourceMappingURL=helloworld5.js.map"
		);

		function assert(results: File[]) {
			const data = results[0];
			expect(data.sourceMap).toExist();
			expect(String(data.sourceMap.version)).toEqual("3");
			expect(data.sourceMap.sources).toEqual([
				"../helloworld.js",
				"../test1.js",
			]);
			expect(data.sourceMap.sourcesContent).toEqual([
				file.contents.toString(),
				"test1\n",
			]);
			expect(data.sourceMap.mappings).toEqual("");
			expect(data.sourceMap.sourceRoot).toEqual("test");
		}

		pipe(
			[
				from.obj([file]),
				sourcemaps.init({ loadMaps: true }),
				concat(assert),
			],
			done
		);
	});

	it("should not load source content if the path is a url", function (done) {
		const file = helpers.makeFile();
		file.contents = Buffer.from(
			helpers.sourceContent + "\n//# sourceMappingURL=helloworld6.js.map"
		);

		function assert(results: File[]) {
			const data = results[0];
			expect(data.sourceMap).toExist();
			expect(String(data.sourceMap.version)).toEqual("3");
			expect(data.sourceMap.sources).toEqual([
				"helloworld.js",
				"http://example2.com/test1.js",
			]);
			expect(data.sourceMap.sourcesContent).toEqual([null, null]);
			expect(data.sourceMap.mappings).toEqual("");
		}

		pipe(
			[
				from.obj([file]),
				sourcemaps.init({ loadMaps: true }),
				concat(assert),
			],
			done
		);
	});

	it("should pass through when file already has a source map", function (done) {
		const sourceMap = {
			version: 3,
			names: <string[]>[],
			mappings: "",
			sources: ["test.js"],
			sourcesContent: ["testContent"],
		};

		const file = helpers.makeFile();
		file.sourceMap = sourceMap;

		function assert(results: File[]) {
			const data = results[0];
			expect(data).toExist();
			expect(data instanceof File).toEqual(true);
			expect(data.sourceMap).toBe(sourceMap);
			expect(data).toBe(file);
		}

		pipe(
			[
				from.obj([file]),
				sourcemaps.init({ loadMaps: true }),
				concat(assert),
			],
			done
		);
	});

	it("handle null contents", function (done) {
		const file = helpers.makeNullFile();

		function assert(results: File[]) {
			const data = results[0];
			expect(data).toExist();
			expect(data instanceof File).toEqual(true);
			expect(data.sourceMap).toExist();
			expect(String(data.sourceMap.version)).toEqual("3");
			expect(data.sourceMap.sources[0]).toEqual("helloworld.js");
			expect(data.sourceMap.sourcesContent[0]).toEqual(null);
			expect(data.sourceMap.names).toEqual([]);
			expect(data.sourceMap.mappings).toEqual("");
		}

		pipe([from.obj([file]), sourcemaps.init(), concat(assert)], done);
	});

	if (!ignoreLogTests) {
		// should always be last as disabling a debug namespace does not work
		it("should output an error message if debug option is set and sourceContent is missing", function (done) {
			const file = helpers.makeFile();
			file.contents = Buffer.from(
				helpers.sourceContent +
					"\n//# sourceMappingURL=helloworld4.js.map"
			);

			const history: string[] = [];

			const hook = hookStderr(function (s: string) {
				history.push(s);
			});

			function assert() {
				hook.unhook();
				const hasRegex = function (regex: RegExp) {
					return function (s: string) {
						return regex.test(s);
					};
				};

				expect(
					history.some(
						hasRegex(
							/No source content for "missingfile". Loading from file./g
						)
					)
				).toEqual(true);
				expect(
					history.some(hasRegex(/source file not found: /g))
				).toEqual(true);
			}

			pipe(
				[
					from.obj([file]),
					sourcemaps.init({ loadMaps: true }),
					concat(assert),
				],
				done
			);
		});

		it("should output an error message if debug option is set, loadMaps: true, and source map file not found", function (done) {
			const file = helpers.makeFile();
			file.contents = Buffer.from(
				helpers.sourceContent +
					"\n//# sourceMappingURL=not-existent.js.map"
			);

			const history: string[] = [];

			const hook = hookStderr(function (s: string) {
				history.push(s);
			});

			function assert() {
				hook.unhook();
				const hasRegex = function (regex: RegExp) {
					return function (s: string) {
						return regex.test(s);
					};
				};

				expect(
					history.some(
						hasRegex(
							/warn: external source map not found or invalid: /g
						)
					)
				).toEqual(true);
			}

			pipe(
				[
					from.obj([file]),
					sourcemaps.init({ loadMaps: true }),
					concat(assert),
				],
				done
			);
		});
	}
});
