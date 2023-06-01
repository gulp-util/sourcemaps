"use strict";
import path from "path";
import detectNewline from "detect-newline";
import _debug from "./debug";
function unixStylePath(filePath) {
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

const commentFormatters = {
	css: function cssCommentFormatter(preLine, newline, url) {
		return preLine + "/*# sourceMappingURL=" + url + " */" + newline;
	},
	js: function jsCommentFormatter(preLine, newline, url) {
		return preLine + "//# sourceMappingURL=" + url + newline;
	},
	default: function defaultFormatter() {
		return "";
	},
};

function getCommentFormatter(file) {
	const extension = file.relative.split(".").pop();
	const fileContents = file.contents.toString();
	const newline = detectNewline.graceful(fileContents || "");

	let commentFormatter = commentFormatters.default;

	if (file.sourceMap.preExistingComment) {
		commentFormatter = (
			commentFormatters[extension] || commentFormatter
		).bind(undefined, "", newline);
		debug(function () {
			return (
				"preExistingComment commentFormatter " + commentFormatter.name
			);
		});
	} else {
		commentFormatter = (
			commentFormatters[extension] || commentFormatter
		).bind(undefined, newline, newline);
	}

	debug(function () {
		return "commentFormatter " + commentFormatter.name;
	});
	return commentFormatter;
}

function getInlinePreExisting(fileContent) {
	if (sourceMapUrlRegEx().test(fileContent)) {
		debug(function () {
			return "has preExisting";
		});
		return fileContent.match(sourceMapUrlRegEx())[0];
	}
}

function exceptionToString(exception) {
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
