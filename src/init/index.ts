import { unixStylePath, PLUGIN_NAME } from "../utils";
import through = require("through2");
import path from "path";
import acorn from "acorn";
import { SourceMapGenerator, Mapping } from "source-map";
import css from "css-tree";
import initInternals from "./index.internals";
import _debug from "../debug";
import { InitOptions } from "../types";
import type File from "vinyl";

/**
 * Initialize source mapping chain
 */
function init(options: InitOptions) {
	const debug = _debug.spawn("init");

	function sourceMapInit(
		file: File,
		encoding: string,
		callback: (error?: Error) => any
	) {
		// pass through if file is null or already has a source map
		if (file.isNull() || file.sourceMap) {
			this.push(file);
			return callback();
		}

		if (file.isStream()) {
			return callback(
				new Error(PLUGIN_NAME + "-init: Streaming not supported")
			);
		}

		if (options === undefined) {
			options = {};
		}
		debug(function () {
			return options;
		});

		let fileContent = file.contents.toString();
		let sourceMap, preExistingComment;
		const internals = initInternals(options, file, fileContent);

		if (options.loadMaps) {
			const result = internals.loadMaps();
			sourceMap = result.map;
			fileContent = result.content;
			preExistingComment = result.preExistingComment;
		}

		if (!sourceMap && options.identityMap) {
			debug(function () {
				return "**identityMap option is deprecated, update to use sourcemap.identityMap stream**";
			});
			debug(function () {
				return "identityMap";
			});
			const fileType = path.extname(file.path);
			const source = unixStylePath(file.relative);
			const generator = new SourceMapGenerator({ file: source });

			if (fileType === ".js") {
				const tokenizer = acorn.tokenizer(fileContent, {
					locations: true,
				});
				while (true) {
					const token = tokenizer.getToken();
					if (token.type.label === "eof") {
						break;
					}
					const mapping: Mapping = {
						original: token.loc.start,
						generated: token.loc.start,
						source: source,
					};
					if (token.type.label === "name") {
						mapping.name = token.value;
					}
					generator.addMapping(mapping);
				}
				generator.setSourceContent(source, fileContent);
				sourceMap = generator.toJSON();
			} else if (fileType === ".css") {
				debug("css");
				const ast = css.parse(fileContent, { positions: true });
				debug(function () {
					return ast;
				});
				const registerTokens = function (ast: css.CssNode) {
					if (!["Rule", "Declaration"].includes(ast.type)) {
						return;
					}
					generator.addMapping({
						original: ast.loc.start,
						generated: ast.loc.start,
						source: source,
					});
				};
				css.walk(ast, registerTokens);
				registerTokens(ast);
				generator.setSourceContent(source, fileContent);
				sourceMap = generator.toJSON();
			}
		}

		if (!sourceMap) {
			// Make an empty source map
			sourceMap = {
				version: 3,
				names: [],
				mappings: "",
				sources: [unixStylePath(file.relative)],
				sourcesContent: [fileContent],
			};
		} else if (
			preExistingComment !== null &&
			typeof preExistingComment !== "undefined"
		) {
			sourceMap.preExistingComment = preExistingComment;
		}

		sourceMap.file = unixStylePath(file.relative);
		file.sourceMap = sourceMap;

		this.push(file);
		callback();
	}

	return through.obj(sourceMapInit);
}

export { init };
