import os from "node:os"
import path from "node:path"

export const APP_DIR_NAME = "debate"
export const CONFIG_FILE_NAME = "config.json"

export function getAppConfigDir() {
  const xdgConfigHome = process.env.XDG_CONFIG_HOME

  if (xdgConfigHome) {
    return path.join(xdgConfigHome, APP_DIR_NAME)
  }

  return path.join(os.homedir(), ".config", APP_DIR_NAME)
}

export function getAppConfigPath() {
  return path.join(getAppConfigDir(), CONFIG_FILE_NAME)
}
