export { init } from "./init";
export { write } from "./write";
// @ts-expect-error map-sources doesn't have type definitions
export { default as mapSources } from "@gulp-sourcemaps/map-sources";
// @ts-expect-error identity-map doesn't have type definitions
export { default as identityMap } from "@gulp-sourcemaps/identity-map";
export * as _utils from "./utils";
