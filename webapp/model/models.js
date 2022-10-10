sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
], 
    /**
     * provide app-view type models (as in the first "V" in MVVC)
     * 
     * @param {typeof sap.ui.model.json.JSONModel} JSONModel
     * @param {typeof sap.ui.Device} Device
     * 
     * @returns {Function} createDeviceModel() for providing runtime info for the device the UI5 app is running on
     */
    function (JSONModel, Device) {
        "use strict";

        return {
            createDeviceModel: function () {
                var oModel = new JSONModel(Device);
                oModel.setDefaultBindingMode("OneWay");
                return oModel;
        },

        createIframeModel: function () {
            var oModel = new JSONModel({
                competenzaSac : "",
                cassaSac      : ""
                // competenzaSac : "https://initsac-svil.eu10.hcs.cloud.sap/sap/fpa/ui/tenants/f23bc/app.html#/analyticapp?shellMode=embed&/aa/7AF01283AE3E6C449CAACA2C308F98EF/?url_api=true&mode=present&view_id=appBuilding",
                // cassaSac      : "https://initsac-svil.eu10.hcs.cloud.sap/sap/fpa/ui/tenants/f23bc/app.html#/analyticapp?shellMode=embed&/aa/EE080A83AE3EC5B683F3B241E62A1929/?url_api=true&mode=present&view_id=appBuilding"
            });
            
            return oModel;
    }
    };
});