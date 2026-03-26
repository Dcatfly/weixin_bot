import os from "node:os";
import path from "node:path";

let _stateDir = path.join(os.homedir(), ".weixin-bot");

/** Set the base state directory for all persistent storage. */
export function setStateDir(dir: string): void {
  _stateDir = dir;
}

/** Get the current base state directory. */
export function getStateDir(): string {
  return _stateDir;
}
