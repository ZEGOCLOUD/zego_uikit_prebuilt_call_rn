import { NativeModules, Platform } from "react-native"

export const getRnVersion = () => {
    let rnVersion = Platform.constants?.reactNativeVersion || {}
    if (!rnVersion) {
      rnVersion = NativeModules.PlatformConstants?.reactNativeVersion || {}
    }
  
    let displayVersion = 'unknown'
    // @ts-ignore
    if (rnVersion.major !== undefined) { displayVersion = rnVersion.major }
    // @ts-ignore
    if (rnVersion.minor !== undefined) { displayVersion += `.${rnVersion.minor}` }
    // @ts-ignore
    if (rnVersion.patch !== undefined) { displayVersion += `.${rnVersion.patch}` }
    // @ts-ignore
    if (rnVersion.prerelease !== undefined && rnVersion.prerelease !== null) { displayVersion += `.${rnVersion.prerelease}` }
  
    return displayVersion
  }