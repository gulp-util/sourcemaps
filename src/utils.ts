import path from "path";
import detectNewline from "detect-newline";
import _debug from "./debug";
import type File from "vinyl";

function unixStylePath(filePath: string) {
	return filePath.split(path.sep).join("/");
}

const PLUGIN_NAME = require("../package.json").name;

const urlRegex = /^(https?|webpack(-[^:]+)?):\/\//;

const debug = _debug.spawn("utils");
/*
So reusing the same ref for a regex (with global (g)) is from a poor decision in js.
See http://stackoverflow.com/questions/10229144/bug-with-regexp-in-javascript-when-do-global-search

So we either need to use a new instance of a regex everywhere.
*/
function sourceMapUrlRegEx() {
	return /\/\/# sourceMappingURL=.*/g;
}

type Formatter = (() => string) | ((url: string) => string);

const commentFormatters = {
	css: function cssCommentFormatter(
		preLine: string,
		newline: string,
		url: string
	) {
		return preLine + "/*# sourceMappingURL=" + url + " */" + newline;
	},
	js: function jsCommentFormatter(
		preLine: string,
		newline: string,
		url: string
	) {
		return preLine + "//# sourceMappingURL=" + url + newline;
	},
	default: function defaultFormatter() {
		return "";
	},
};

type formatterKeys = keyof typeof commentFormatters;

function formatterExists(extension: string): extension is formatterKeys {
	return extension in commentFormatters;
}

function resolveFormatter(extension: string) {
	if (formatterExists(extension)) {
		return commentFormatters[extension];
	}
	return commentFormatters.default;
}

function getCommentFormatter(file: File): Formatter {
	const extension = file.relative.split(".").pop();
	const fileContents = file.contents.toString();
	const newline = detectNewline.graceful(fileContents || "");

	const commentFormatter = resolveFormatter(extension);

	debug(() => `commentFormatter ${commentFormatter.name}`);
	if (file.sourceMap.preExistingComment) {
		debug(function () {
			return `preExistingComment commentFormatter ${commentFormatter.name}`;
		});
		return commentFormatter.bind(undefined, "", newline);
	}
	return commentFormatter.bind(undefined, newline, newline);
}

function getInlinePreExisting(fileContent: string) {
	if (sourceMapUrlRegEx().test(fileContent)) {
		debug(() => "has preExisting");
		return fileContent.match(sourceMapUrlRegEx())[0];
	}
}

function exceptionToString(exception: { message: string }) {
	return exception.message || "";
}

export {
	unixStylePath,
	PLUGIN_NAME,
	urlRegex,
	sourceMapUrlRegEx,
	getCommentFormatter,
	getInlinePreExisting,
	exceptionToString,
};
