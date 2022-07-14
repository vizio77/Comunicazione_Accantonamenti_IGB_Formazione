sap.ui.define([
	"sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function(
	Controller, JSONModel, Filter, FilterOperator
) {
	"use strict";

	return Controller.extend("zsap.com.r3.cobi.s4.gestposfin.controller.BaseController", {
        __getEntityMatchCode: function (key) {
            let oCodificaEntity = {
                "Amm": "/Gest_PosFin_SH_AmministrazioniSet"
            }
            let oCodificaProperty = {
                "Amm": "/helpValueAmministrazioni"
            }
            let oCodificaFilters = {
                "Amm":[
                    new Filter("Anno", FilterOperator.EQ, (new Date(new Date().setFullYear(new Date().getFullYear() + 1))).getFullYear().toString()),
                    new Filter("Fase", FilterOperator.EQ, "FORM")
                ]
            }
            return {entity: oCodificaEntity[key],  property: oCodificaProperty[key], filters: oCodificaFilters[key] }
        },
        __getValueHelpData: function (key) {
            let oCodifica = this.__getEntityMatchCode(key)
            let modelPosFin = this.getView().getModel("modelPosFin")
            let oModel = this.getOwnerComponent().getModel("sapHanaS2")

            oModel.read(oCodifica.entity, {
                filters: oCodifica.filters,
                success: (odata) => {
                    modelPosFin.setProperty(oCodifica.property, odata.results)
                }
            })
            
        }
	});
});