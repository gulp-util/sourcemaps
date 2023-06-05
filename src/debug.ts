// @ts-expect-error debug-fabulous doesn't have type definitions
import { spawnable } from "debug-fabulous";

export default spawnable(require("../package.json").name);
