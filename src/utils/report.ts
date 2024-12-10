import {ZegoUIKitReport} from '@zegocloud/zego-uikit-rn';

const PrebuiltCallReport = {
    create: (appID: number, appSign: string, commonParams: {}) => {
        ZegoUIKitReport.create(appID, appSign, commonParams)
    },

    updateCommonParams: (params: {}) => {
        ZegoUIKitReport.updateCommonParams(params)
    },

    reportEvent: (event: string, params: {}) => {
        ZegoUIKitReport.reportEvent(event, params)
    },
}

export default PrebuiltCallReport;
