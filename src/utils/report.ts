import { NativeModules, Platform } from 'react-native';
import { zloginfo } from './logger';

const { CallReportRNModule } = NativeModules;

const PrebuiltCallReport = {
    create: (appID: number, appSign: string, commonParams: {}) => {
        if (Platform.OS === 'ios') {
            return;
        }
      
        zloginfo('[PrebuiltCallReport][create]')
        CallReportRNModule.create(appID.toString(), appSign, commonParams)
    },

    updateCommonParams: (params: {}) => {
        if (Platform.OS === 'ios') {
            return;
        }
      
        zloginfo('[PrebuiltCallReport][create]')
        CallReportRNModule.updateCommonParams(params)
    },

    reportEvent: (event: string, params: {}) => {
        if (Platform.OS === 'ios') {
            return;
        }

        zloginfo(`[PrebuiltCallReport][reportEvent] ${event}`)
        CallReportRNModule.reportEvent(event, params)
    },
}

export default PrebuiltCallReport;
