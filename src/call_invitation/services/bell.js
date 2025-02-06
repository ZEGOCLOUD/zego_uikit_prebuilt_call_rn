import { NativeModules, Vibration } from 'react-native';
import Sound from 'react-native-sound';
import { zloginfo, zlogerror, zlogwarning } from '../../utils/logger';

const { ZegoUIKitPrebuiltCallRNModule } = NativeModules;

// console.warn('Sound', Sound);
// console.warn('Vibration', Vibration);

const BellManage = {
  _incomingCallFileName: '',
  _outgoingCallFileName: '',
  _whooshIncoming: null,
  _whooshOutgoing: null,
  vibrate: () => {
    Vibration.vibrate([0, 500, 1000, 500], true);
  },
  cancleVirate: () => {
    Vibration.cancel();
  },
  initRingtoneConfig: (ringtoneConfig) => {
    BellManage._incomingCallFileName = ringtoneConfig.incomingCallFileName;
    BellManage._outgoingCallFileName = ringtoneConfig.outgoingCallFileName;
  },
  initIncomingSound: () => {
    zloginfo('[BellManage][initIncomingSound]')
    // Sound.setCategory('Playback');
    return new Promise((resolve, reject) => {
      BellManage._whooshIncoming = new Sound(
        BellManage._incomingCallFileName,
        Sound.MAIN_BUNDLE,
        (error) => {
          if (error) {
            zlogerror('Failed to load the sound of zego_incoming', error);
            reject();
          } else {
            zloginfo('Load the sound of zego_incoming successfully');
            BellManage._whooshIncoming.setNumberOfLoops(-1);
            resolve(BellManage._whooshIncoming);
          }
        }
      );
    });
  },
  initOutgoingSound: () => {
    return new Promise((resolve, reject) => {
      BellManage._whooshOutgoing = new Sound(
        BellManage._outgoingCallFileName,
        Sound.MAIN_BUNDLE,
        (error) => {
          if (error) {
            zlogerror('Failed to load the sound of zego_outgoing', error);
            reject();
          } else {
            zloginfo('Load the sound of zego_outgoing successfully');
            BellManage._whooshOutgoing.setNumberOfLoops(-1);
            resolve(BellManage._whooshOutgoing);
          }
        }
      );
    });
  },
  playIncomingSound: () => {
    ZegoUIKitPrebuiltCallRNModule.changeToSpeaker()
    
    BellManage._whooshIncoming.play((success) => {
      if (success) {
        zloginfo('successfully finished playing zego_incoming');
      } else {
        zloginfo(
          'playback zego_incoming failed due to audio decoding errors'
        );
      }
    });
    zloginfo('successfully playing zego_incoming');
  },
  stopIncomingSound: () => {
    if (!BellManage._whooshIncoming) {
      zloginfo('[BellManage][stopOutgoingSound] _whooshIncoming is null');
      return
    }
    BellManage._whooshIncoming.stop(() => {
      zloginfo('successfully stop playing zego_incoming');
    });
  },
  playOutgoingSound: () => {
    ZegoUIKitPrebuiltCallRNModule.changeToReceiver()

    BellManage._whooshOutgoing.play((success) => {
      if (success) {
        zloginfo('successfully finished playing zego_outgoing');
      } else {
        zloginfo(
          'playback zego_outgoing failed due to audio decoding errors'
        );
      }
    });
    zloginfo('successfully playing zego_outgoing');
  },
  stopOutgoingSound: () => {
    BellManage._whooshOutgoing.stop(() => {
      zloginfo('successfully stop playing zego_outgoing');
    });
  },
  releaseIncomingSound: () => {
    zloginfo('[BellManage][releaseIncomingSound]')
    BellManage._whooshIncoming.release();
    BellManage._whooshIncoming = null;
    zloginfo('successfully release the audio player resource');
  },
  releaseOutgoingSound: () => {
    BellManage._whooshOutgoing.release();
    BellManage._whooshOutgoing = null;
    zloginfo('successfully release the audio player resource');
  },
};

export default BellManage;
