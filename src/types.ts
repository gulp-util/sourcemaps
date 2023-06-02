import type { SourceMapConverter } from "convert-source-map";
import type File from "vinyl";

type WriteMapper = {
	(file: File): string;
};

type SourceUrlMapper = {
	(file: File): string;
};

type MapFilenameMapper = {
	(mapFilePath: string): string;
};

type CloneOptions = Partial<{
	contents: boolean;
	deep: boolean;
}>;

type SourceMapMapper = {
	(sourcePath: string, file: File): string;
};

type InitOptions = Partial<{
	loadMaps: boolean;
	largeFile: boolean;
	identityMap: boolean;
}>;

type WriteOptions = Partial<{
	addComment: boolean;
	includeContent: boolean;
	mapSourcesAbsolute: boolean;
	charset: string;
	destPath: string;
	clone: boolean | CloneOptions;
	mapFile: string | MapFilenameMapper;
	sourceRoot: string | WriteMapper;
	sourceMappingURLPrefix: string | WriteMapper;
	sourceMappingURL: SourceUrlMapper;
	mapSources: SourceMapMapper;
}>;

type Sources = {
	path: string;
	map: SourceMapConverter | any | null;
	content: string;
	preExistingComment: string | null;
};

export { Sources, InitOptions, WriteOptions };
