sap.ui.define([
        "sap/ui/core/UIComponent",
        "sap/ui/Device",
        "zsap/com/r3/cobi/s4/gestposfin/model/models"
    ],
    function (UIComponent, Device, models) {
        "use strict";

        return UIComponent.extend("zsap.com.r3.cobi.s4.gestposfin.Component", {
            metadata: {
                manifest: "json",
                config: {
                    fullWidth: true
                }
            },

            /**
             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
             * @public
             * @override
             */
            init: function () {
                // call the base component's init function
                UIComponent.prototype.init.apply(this, arguments);

                // enable routing
                this.getRouter().initialize();
                //set language
                sap.ui.getCore().getConfiguration().setLanguage("it");
                // set the device model
                this.setModel(models.createDeviceModel(), "device");
            }
        });
    }
);