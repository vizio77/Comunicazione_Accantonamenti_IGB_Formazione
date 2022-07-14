sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/Fragment",
    "./BaseController"
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, JSONModel, Filter, FilterOperator, Fragment, BaseController) {
        "use strict";

        return BaseController.extend("zsap.com.r3.cobi.s4.gestposfin.controller.Home", {
            onInit: function () {
                this.getView().setModel(new JSONModel({formSottostrumento:{
                    tipologia: null,
                    tipologieSet: [],
                    codice_sstr: null,
                    esposizione_contabileSet: [],
                    esposizione_contabile: null,
                    descrizione_sstr: null,
                    visibilitaSet: [],
                    visibilita: null,
                    dominio_sstrSet: [],
                    dominio_sstr: null
                }}), "modelHome")
                this.getView().setModel(new JSONModel({Sottostrumento: null, visibleAuth: false}), "modelFilterHome")
            },
            onHelpValueSottoStrumento: function () {
                if(!this.oDialogHVSottoStrumento) {
                    Fragment.load({
                        name:"zsap.com.r3.cobi.s4.gestposfin.view.fragment.HelpValueSottostrumento",
                        controller: this
                    }).then(oDialog => {
                        this.oDialogHVSottoStrumento = oDialog;
                        this.getView().addDependent(oDialog);
                        this.oDialogHVSottoStrumento.open();
                        let oModel = this.getOwnerComponent().getModel("sapHanaS2");
                        let modelHome = this.getView().getModel("modelHome")
                        oModel.read("/Gest_PosFin_SH_TipologiaSet",{
                            success:  (oData) => {
                                oData.results.push({StatFase: -1, TipoSstr: null, NomeTipoSstr: ""})
                                modelHome.setProperty("/formSottostrumento/tipologieSet", oData.results)
                            }
                        })
                    })
                } else {
                    this.oDialogHVSottoStrumento.open();
                }
            },
            onClose: function (oEvent) {
                if(oEvent.getSource().getCustomData().length){
                    this.__resetFiltri(oEvent.getSource().getCustomData().filter(item => item.getKey() === "resetFiltri"))
                }   
                let sDialog = oEvent.getSource().getCustomData().find(item => item.getKey() === "HVSottostrumento").getValue()
                this[sDialog].close()
                this[sDialog].destroy()
                this[sDialog] = null
            },
            __resetFiltri: function (aResetKeyValue) {
                let modelHome = this.getView().getModel("modelHome");
                aResetKeyValue.map(reset => {
                    if(reset.getKey() === "resetFiltri"){
                        if (reset.getValue() === "formSottostrumento") {
                            modelHome.setProperty("/formSottostrumento/tipologia", null)
                            modelHome.setProperty("/formSottostrumento/codice_sstr", null)
                            modelHome.setProperty("/formSottostrumento/descrizione_sstr", null)
                            modelHome.setProperty("/formSottostrumento/visibilita", null)
                            modelHome.setProperty("/formSottostrumento/dominio_sstr", null)
                        }
                    }
                })
            },
            onPressConfSottoStrumento: function (oEvent) {
                this.onSottostrumento()
            },
            onSottostrumento: function () {
                var oModel = this.getOwnerComponent().getModel("sapHanaS2");
                var Dateto = new Date(new Date().getFullYear(), 11, 31);
                Dateto.setHours(2);
                var sottostrumentiModel = new JSONModel();
                var oView = this.getView();
                //filtri standard
                var _filters = [
                    new Filter({
                        path: "Dateto",
                        operator: FilterOperator.EQ,
                        value1: Dateto
                    }),
                    new Filter({
                        path: "Fase",
                        operator: FilterOperator.EQ,
                        value1: "DLB"
                    }),
                    new Filter({
                        path: "TestoTipo",
                        operator: FilterOperator.EQ,
                        value1: "VLV"
                    }),
                    new Filter({
                        path: "StatStatus",
                        operator: FilterOperator.EQ,
                        value1: "1"
                    })
                ];
                //filtri in da form di sottostrumento
                let modelHome = this.getView().getModel("modelHome") //.getProperty("/formSottostrumento")
                if(modelHome.getProperty("/formSottostrumento/esposizione_contabile")){
                    _filters.push(new Filter({
                        path: "StatEsposizione",
                        operator: FilterOperator.EQ,
                        value1: modelHome.getProperty("/formSottostrumento/esposizione_contabile")
                    }),)
                }
                if(modelHome.getProperty("/formSottostrumento/sottostrumento")){
                    _filters.push(new Filter({
                        path: "IdSstr",
                        operator: FilterOperator.EQ,
                        value1: modelHome.getProperty("/formSottostrumento/sottostrumento")
                    }),)
                }
                if(modelHome.getProperty("/formSottostrumento/descrizione")){
                    _filters.push(new Filter({
                        path: "DescrEstesa",
                        operator: FilterOperator.EQ,
                        value1: modelHome.getProperty("/formSottostrumento/descrizione")
                    }),)
                }
                //
                oModel.read("/Gest_PosFin_SottostrumentoSet", {
                    filters: _filters,
                    success: function(oData, response) {
                        oData.results = oData.results.map((item) => {
                            item.FkEseStrAnnoEse = Number(item.FkEseStrAnnoEse) + 1
                            item.EseAnnoEse = Number(item.EseAnnoEse) + 1
                            item.Stato = "Aperto"
                            return item
                        })
                        sottostrumentiModel.setData(oData.results);
                        sottostrumentiModel.setSizeLimit(2000);
                        oView.setModel(sottostrumentiModel, "sottostrumentiModel");
                    },
                    error: function(e) {
    
                    }
                });
                if(!this._oDialog){
                    this._oDialog = sap.ui.xmlfragment(
                        "zsap.com.r3.cobi.s4.gestposfin.view.fragment.Sottostrumento",
                        this);
                    this._oDialog.setModel("sottostrumentiModel");
                    this.getView().addDependent(this._oDialog);
                    this._oDialog.open();
                } else {
                    this._oDialog.open();
                }
            },
            onPressConfermaSottostrumento: function (oEvent) {
                let modelSottoStrumenti = this.getView().getModel("sottostrumentiModel")
                let modelHome = this.getView().getModel("modelHome")
                let idTableStr = sap.ui.getCore().byId("idTableSottostrumento2")
                let selectedPath = sap.ui.getCore().byId("idTableSottostrumento2").getSelectedContextPaths()[0]
                let selectedItem = modelSottoStrumenti.getProperty(selectedPath)
    
                modelHome.setProperty("/Sottostrumento", `${selectedItem.TestoTipo} - ${selectedItem.IdSstr} - ${selectedItem.EseAnnoEse}`)
                modelHome.setProperty("/infoSottoStrumento", selectedItem)
                modelHome.setProperty("/esercizio", Number(selectedItem.EseAnnoEse) + 1)
    
                //lt setto anche il model filter home per recuperare tutto nella prima schermata
                let modelFilterHome = this.getView().getModel("modelFilterHome")
                modelFilterHome.setProperty("/Sottostrumento", `${selectedItem.TestoTipo} - ${selectedItem.IdSstr}`)
                //lt elimino l'anno all'interno della selezione del sottostrumento
                //modelFilterHome.setProperty("/Sottostrumento", `${selectedItem.TestoTipo} - ${selectedItem.IdSstr} - ${selectedItem.EseAnnoEse}`)
                modelFilterHome.setProperty("/infoSottoStrumento", selectedItem)
                modelFilterHome.setProperty("/esercizio", Number(selectedItem.EseAnnoEse) + 1)
                //setto nel modello filtro anche l'abilitazione o meno del campo pos finanziaria
                modelFilterHome.setProperty("/FieldPosEnabled", true)
                if(selectedItem.TestoTipo === "VLV") {
                    modelFilterHome.setProperty("/visibleAuth", false)
                } else {
                    modelFilterHome.setProperty("/visibleAuth", true)
                }
    
                this.oDialogHVSottoStrumento.close();
                this._oDialog.close()
                this.oDialogHVSottoStrumento.destroy();
                this._oDialog.destroy()
                this.oDialogHVSottoStrumento = null
                this._oDialog = null
            },
            onNavigate: function () {
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			    oRouter.navTo("HomePosFin");
            }
        });
    });
