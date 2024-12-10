import { NativeModules } from "react-native"

export const getRnVersion = () => {
    let rnVersion = NativeModules.PlatformConstants.reactNativeVersion
    if (rnVersion.prerelease) {
        return `${rnVersion.major}.${rnVersion.minor}.${rnVersion.patch}.${rnVersion.prerelease}`
    } else {
        return `${rnVersion.major}.${rnVersion.minor}.${rnVersion.patch}`    
    }
}
