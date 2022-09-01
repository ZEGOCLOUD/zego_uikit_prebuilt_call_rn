# Quick start

- - -

<img src="https://user-images.githubusercontent.com/5242852/188269744-bc605919-ac98-4fac-bdac-fcb58334a470.gif" width=500/>

Read more from [our official website](https://docs.zegocloud.com/article/14764)


## Integrate the SDK

### Import the SDK

### Add zego-uikit-prebuilt-call-rn as dependencies

```bash
yarn add zego-uikit-prebuilt-call-rn 
```

### Add other dependencies

Run the following command to install other dependencies for making sure the `zego-uikit-prebuilt-call-rn` can work properly:

```bash
yarn add zego-uikit-rn react-delegate-component zego-express-engine-reactnative
```

### Using the `ZegoUIKitPrebuiltCall` Component in your project

- Go to [ZEGOCLOUD Admin Console\|_blank](https://console.zegocloud.com/), get the `appID` and `appSign` of your project.
- Get the `userID` and `userName` for connecting the Video Call Kit service. 
- And also get a `callID` for making a call.

<div class="mk-hint">

- `userID` and `callID` can only contain numbers, letters, and underlines (_). 
- Users that join the call with the same `callID` can talk to each other. 
</div>



<pre style="background-color: #011627; border-radius: 8px; padding: 25px; color: white"><div>
// App.js
import React, { Component } from 'react';
import { ZegoUIKitPrebuiltCall } from 'zego-uikit-rn';

export default function App() {
  return (
<div style="background-color:#032A4B; margin: 0px; padding: 2px;">
    &lt;ZegoUIKitPrebuiltCall
      appID={Get your app ID from ZEGOCLOUD Admin Console.}
      appSign='Get your app Sign from ZEGOCLOUD Admin Console.'
      userID='12345' // userID can only contain numbers, letters, and underlines (_). 
      userName='Oliver'
      callID='rn12345678' // roomID can only contain numbers, letters, and underlines (_). 
      config={{
        //onHangUp: () => {props.navigation.navigate('HomePage')}
      }}
    /&gt;
</div>
  );
}

</div></pre>


## Configure your project

- Android: 

Open `my_project/android/app/src/main/AndroidManifest.xml` file and add the code as follow:

<img src="https://user-images.githubusercontent.com/5242852/188270423-19fd9e83-f588-4599-b365-fdfa3ac39898.gif" width=500/>

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.CAMERA" />
```

- iOS:

Open `my_project/ios/my_project/Info.plist` file and add the code as follow:

<img src="https://user-images.githubusercontent.com/5242852/188270427-6b4638bb-d0f2-483d-b43a-179e7490cf06.gif" width=500/>

```xml
<key>NSCameraUsageDescription</key>
<string></string>
<key>NSMicrophoneUsageDescription</key>
<string></string>
```

## Run & Test

- Run on an iOS device:
```bash
yarn android
```
- Run on an Android device:
```bash
yarn ios
```

## Related guide

[Customize prebuilt UI](!ZEGOUIKIT_Custom_prebuilt_UI)


## Resources

<div class="md-grid-list-box">
  <a href="https://github.com/ZEGOCLOUD/zego_uikit_prebuilt_call_example_rn" class="md-grid-item" target="_blank">
    <div class="grid-title">Sample code</div>
    <div class="grid-desc">Click here to get the complete sample code.</div>
  </a>
</div>
