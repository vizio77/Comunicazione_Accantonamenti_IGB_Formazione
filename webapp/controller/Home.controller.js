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
                    dominio_sstr: [],
                    azione_set: [],
                    azioni: [],
                    programmi: [],
                    missioni: [],
                    economica3: [],
                    economica2: [],
                    categoria: [],
                    titoli: [],
                    amministrazioni: [],
                    solo_struttura: false,
                    solo_contabili: false,
                    nessuna_restrizione: true,
                    esercizio: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).getFullYear().toString()
                }}), "modelHome")
                //this.getView().setModel(new JSONModel({Sottostrumento: null, visibleAuth: false}), "modelFilterHome")
                //this.initData();
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
                        this.initDataDomSStr()
                        oModel.read("/Gest_PosFin_SH_TiesSet",{
                            filters:[ new Filter("Anno", FilterOperator.EQ, modelHome.getProperty("/formSottostrumento/esercizio")),
                                      new Filter("Fase", FilterOperator.EQ, "DLB")],
                            success:  (oData) => {
                                oData.results.unshift({TipoEsposizione: null, Descr: null, Fase: null, Anno: null})
                                modelHome.setProperty("/formSottostrumento/esposizione_contabileSet", oData.results)
                            }
                        })
                        // oModel.read("/Gest_PosFin_SH_AmministrazioniSet",{
                        //     filters:[new Filter("Fikrs", FilterOperator.EQ, "S001"),
                        //              new Filter("Anno", FilterOperator.EQ, modelHome.getProperty("/formSottostrumento/esercizio")),
                        //              new Filter("Fase", FilterOperator.EQ, "DLB")],
                        //     success:  (oData) => {
                        //         //oData.results.unshift({Prctr: null, DescrBreve: ""})
                        //         modelHome.setProperty("/formSottostrumento/dominio_sstrSet", oData.results)
                        //     }
                        // })
                        oModel.read("/Gest_SH1Set",{
                            urlParameters: {
                                $expand: 'ToSHEsposizione,ToSHTipologia,ToSHVisibilita'
                            },
                            filters:[new Filter("Anno", FilterOperator.EQ, "2023"),
                                    new Filter("Fase", FilterOperator.EQ, "DLB"),
                                    // new Filter("TipoSstr", FilterOperator.EQ, "03"),
                                    // new Filter("TipoEsposizione", FilterOperator.EQ, "2"),
                                    // new Filter("Reale", FilterOperator.EQ, "R")
                                ],
                            success:  (oData) => {
                                debugger
                                oData.results[0].ToSHTipologia.results.unshift({ TipoSstr: null, TipoSstrDescr: ""})
                                modelHome.setProperty("/formSottostrumento/tipologieSet", oData.results[0].ToSHTipologia.results)
                                oData.results[0].ToSHEsposizione.results.unshift({TipoEsposizione: null, TipoEsposizioneDescr: "", Fase: null, Anno: null})
                                modelHome.setProperty("/formSottostrumento/esposizione_contabileSet", oData.results[0].ToSHEsposizione.results)
                                oData.results[0].ToSHVisibilita.results.unshift({Fase: null, Anno: null})
                                modelHome.setProperty("/formSottostrumento/visibilitaSet", oData.results[0].ToSHVisibilita.results)
                            },
                            error: function (res) {
                                debugger
                            }
                        })
                    })
                } else {
                    this.oDialogHVSottoStrumento.open();
                }
            },
            onClose: function (oEvent) {
                this.__resetFiltri()
                let sDialog = oEvent.getSource().getCustomData().find(item => item.getKey() === "HVSottostrumento").getValue()
                this[sDialog].close()
                this[sDialog].destroy()
                this[sDialog] = null
            },
            __resetFiltri: function () {
                let modelHome = this.getView().getModel("modelHome");
                modelHome.setProperty("/formSottostrumento/tipologia", null)
                modelHome.setProperty("/formSottostrumento/codice_sstr", null)
                modelHome.setProperty("/formSottostrumento/descrizione_sstr", null)
                modelHome.setProperty("/formSottostrumento/visibilita", null)
                modelHome.setProperty("/formSottostrumento/dominio_sstr", null)
                modelHome.setProperty("/formSottostrumento/esposizione_contabile", null)
                modelHome.setProperty("/formSottostrumento/categoria", [])
                modelHome.setProperty("/formSottostrumento/economica2", [])
                modelHome.setProperty("/formSottostrumento/economica3", [])
                modelHome.setProperty("/formSottostrumento/programmi", [])
                modelHome.setProperty("/formSottostrumento/azioni", [])
                modelHome.setProperty("/formSottostrumento/dominio_sstr", [])
                modelHome.setProperty("/formSottostrumento/titoli", [])
                modelHome.setProperty("/formSottostrumento/missioni", [])
                // sap.ui.getCore().byId("id_dom_amm").setSelectedItems([])
                // sap.ui.getCore().byId("id_dom_titolo").setSelectedItems([])
                // sap.ui.getCore().byId("id_dom_missione").setSelectedItems([])
            },
            onPressConfSottoStrumento: function (oEvent) {
                this.onSearchSottostrumento()
            },
            onSearchSottostrumentoOld: function () {
                var oModel = this.getOwnerComponent().getModel("sapHanaS2");
                
                let annoSStr = new Date(new Date().setFullYear(new Date().getFullYear() + 1)) 
                var sottostrumentiModel = new JSONModel();

                var oView = this.getView();
                //filtri standard
                var _filters = [
                    new Filter({
                        path: "AnnoSottostrumento",
                        operator: FilterOperator.EQ,
                        value1: annoSStr.getFullYear().toString()
                    }),
                    new Filter({
                        path: "Fase",
                        operator: FilterOperator.EQ,
                        value1: "DLB"
                    })
                ];
                //filtri in da form di sottostrumento
                let modelHome = this.getView().getModel("modelHome") //.getProperty("/formSottostrumento")
                if(modelHome.getProperty("/formSottostrumento/esposizione_contabile")){
                    _filters.push(new Filter({
                        path: "TipoEsposizione",
                        operator: FilterOperator.EQ,
                        value1: modelHome.getProperty("/formSottostrumento/esposizione_contabile")
                    }))
                } else {
                    modelHome.getProperty("/formSottostrumento/esposizione_contabileSet").map((espCont) => {
                            if (espCont.TipoEsposizione) {
                                _filters.push(new Filter({
                                    path: "TipoEsposizione",
                                    operator: FilterOperator.EQ,
                                    value1: espCont.TipoEsposizione
                                }))
                            }   
                        })
                }
                if(modelHome.getProperty("/formSottostrumento/sottostrumento")){
                    _filters.push(new Filter({
                        path: "CodiceSottostrumento",
                        operator: FilterOperator.EQ,
                        value1: modelHome.getProperty("/formSottostrumento/sottostrumento")
                    }),)
                }
                if(modelHome.getProperty("/formSottostrumento/descrizione_sstr")){
                    _filters.push( new Filter({
                        path: "DescrEstesa",
                        operator: FilterOperator.Contains,
                        value1: modelHome.getProperty("/formSottostrumento/descrizione_sstr")
                    }))
                    _filters.push( new Filter({
                        path: "DescrBreve",
                        operator: FilterOperator.Contains,
                        value1: modelHome.getProperty("/formSottostrumento/descrizione_sstr")
                    }))
                }
                if(modelHome.getProperty("/formSottostrumento/dominio_sstr")){
                    _filters.push(new Filter({
                        path: "Prctr",
                        operator: FilterOperator.EQ,
                        value1: modelHome.getProperty("/formSottostrumento/dominio_sstr")
                    }),)
                } else {
                    modelHome.getProperty("/formSottostrumento/dominio_sstrSet").map((dom) => {
                        if (dom.Prctr) {
                            _filters.push(new Filter({
                                path: "Prctr",
                                operator: FilterOperator.EQ,
                                value1: dom.Prctr
                            }))
                        }   
                    })
                }
                if(modelHome.getProperty("/formSottostrumento/tipologia")){
                    _filters.push(new Filter({
                        path: "TipoSottostrumento",
                        operator: FilterOperator.EQ,
                        value1: modelHome.getProperty("/formSottostrumento/tipologia")
                    }),)
                } else {
                    modelHome.getProperty("/formSottostrumento/tipologieSet").map((tipologie) => {
                        if (tipologie.TipoSstr) {
                            _filters.push(new Filter({
                                path: "TipoSottostrumento",
                                operator: FilterOperator.EQ,
                                value1: tipologie.TipoSstr
                            }))
                        }   
                    })
                }
                //
                oModel.read("/Gest_fasi_sstrSet", {
                    filters: _filters,
                    sorters: [new sap.ui.model.Sorter("TipoSottostrumento", false),
                              new sap.ui.model.Sorter("NumeroSottostrumento", false)],//new sap.ui.model.Sorter("NumeroSottostrumento", false),
                    success: (oData, response) => {
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
            onSearchSottostrumento: function () {
                var oModel = this.getOwnerComponent().getModel("sapHanaS2");
                
                let annoSStr = new Date(new Date().setFullYear(new Date().getFullYear() + 1)) 
                var sottostrumentiModel = new JSONModel();

                var oView = this.getView();
                var aFiltersCompose = [new Filter("AnnoSottostrumento", FilterOperator.EQ, annoSStr.getFullYear().toString()),
                                       new Filter("Fase", FilterOperator.Contains, "DLB")];

                let modelHome = this.getView().getModel("modelHome")
                //Esposizione Contabile
                if(modelHome.getProperty("/formSottostrumento/esposizione_contabile") && modelHome.getProperty("/formSottostrumento/esposizione_contabile").length > 1){
                    aFiltersCompose.push(new Filter({
                        path: "TipoEsposizione",
                        operator: FilterOperator.EQ,
                        value1: modelHome.getProperty("/formSottostrumento/esposizione_contabile").split("-")[0]
                    }))
                } else {
                    let aFilterEspContCompose = []
                    modelHome.getProperty("/formSottostrumento/esposizione_contabileSet").map((espCont) => {
                            if (espCont.TipoEsposizione) {
                                aFilterEspContCompose.push(new Filter({
                                    path: "TipoEsposizione",
                                    operator: FilterOperator.EQ,
                                    value1: espCont.TipoEsposizione.split("-")[0]
                                }))
                            }   
                    })
                    let afiltersEspCont = 
                        new Filter({
                            filters: aFilterEspContCompose,
                            and: false,
                            or : true
                            })
                    
                    aFiltersCompose.push(afiltersEspCont)
                }
                //Numero Sottostrumento
                if(modelHome.getProperty("/formSottostrumento/sottostrumento")){
                    aFiltersCompose.push(new Filter({
                        path: "CodiceSottostrumento",
                        operator: FilterOperator.EQ,
                        value1: modelHome.getProperty("/formSottostrumento/sottostrumento")
                    }),)
                }
                //Descrizione Sottostrumento
                if(modelHome.getProperty("/formSottostrumento/descrizione_sstr")){
                    aFiltersCompose.push(new Filter({
                        path: "DescrEstesa",
                        operator: FilterOperator.Contains,
                        value1: modelHome.getProperty("/formSottostrumento/descrizione_sstr").toUpperCase()
                    }),)
                }
                //Tipologia Sottostrumento
                if(modelHome.getProperty("/formSottostrumento/tipologia")){
                    aFiltersCompose.push(new Filter({
                        path: "TipoSottostrumento",
                        operator: FilterOperator.EQ,
                        value1: modelHome.getProperty("/formSottostrumento/tipologia")
                    }),)
                } else {
                    let aFilterTipologiaCompose = []
                    modelHome.getProperty("/formSottostrumento/tipologieSet").map((tipologie) => {
                        if (tipologie.TipoSstr) {
                            aFilterTipologiaCompose.push(new Filter({
                                path: "TipoSottostrumento",
                                operator: FilterOperator.EQ,
                                value1: tipologie.TipoSstr
                            }))
                        }   
                    })
                    let afiltersTipologia = 
                        new Filter({
                            filters: aFilterTipologiaCompose,
                            and: false,
                            or : true
                            })
                    
                    aFiltersCompose.push(afiltersTipologia)
                }
                var _filters = [
                    new Filter({
                        filters: aFiltersCompose,
                        and: true
                      })
                ]
                oModel.read("/Gest_fasi_sstrSet", {
                    filters: _filters,
                    sorters: [new sap.ui.model.Sorter("TipoSottostrumento", false),
                              new sap.ui.model.Sorter("NumeroSottostrumento", false)],//new sap.ui.model.Sorter("NumeroSottostrumento", false),
                    success: (oData, response) => {
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
    
                modelHome.setProperty("/Sottostrumento", `${selectedItem.DescrTipoSottostrumento} - ${selectedItem.NumeroSottostrumento}`)
                modelHome.setProperty("/infoSottoStrumento", selectedItem)
                modelHome.setProperty("/esercizio", selectedItem.AnnoSottostrumento)
    
                this.oDialogHVSottoStrumento.close();
                this._oDialog.close()
                this.oDialogHVSottoStrumento.destroy();
                this._oDialog.destroy()
                this.oDialogHVSottoStrumento = null
                this._oDialog = null
            },
            onNavigate: function () {
                let modelHome = this.getView().getModel("modelHome")
                let oSottostrumento = modelHome.getProperty("/infoSottoStrumento")
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			    oRouter.navTo("HomePosFin",{
                    Fikrs: oSottostrumento.Fikrs,
                    CodiceStrumento: oSottostrumento.CodiceStrumento,
                    CodiceStrumentoOri: oSottostrumento.CodiceStrumentoOri,
                    CodiceSottostrumento: oSottostrumento.CodiceSottostrumento,
                    Datbis: oSottostrumento.Datbis.toISOString(),
                });
            },
            onFormatTipoEsposizione:function (sTipoEsposizione) {
                   const modelHome = this.getView().getModel("modelHome")
                   const aTipologie = modelHome.getProperty("/formSottostrumento/esposizione_contabileSet")
                   return aTipologie.find(es => es.TipoEsposizione === sTipoEsposizione).TipoEsposizioneDescr
               },
            onResetVHSstr: function (oEvent) {
                    this.__resetFiltri()
            },
            onChangeSelect: function (oEvent) {
                debugger
                let oModel = this.getOwnerComponent().getModel("sapHanaS2");
                let modelHome = this.getView().getModel("modelHome")
                const sIdChange = oEvent.getParameter("id")
                let sExpand = ""
                let aFilter = [new Filter("Anno", FilterOperator.EQ, "2023"),
                               new Filter("Fase", FilterOperator.EQ, "DLB")]
                switch (sIdChange) {
                    case 'idformStTipologia':
                        if(modelHome.getProperty("/formSottostrumento/tipologia")){
                            aFilter.push(new Filter("TipoSstr", FilterOperator.EQ, modelHome.getProperty("/formSottostrumento/tipologia")))
                            sExpand = sExpand + "ToSHEsposizione,ToSHVisibilita"
                        }
                        break;
                    case 'idformStEspCont':
                        if(modelHome.getProperty("/formSottostrumento/esposizione_contabile").length > 1){
                            let arrKeyTipoEsp = modelHome.getProperty("/formSottostrumento/esposizione_contabile").split("-")
                            aFilter.push(new Filter("TipoEsposizione", FilterOperator.EQ, arrKeyTipoEsp[0]))
                            aFilter.push(new Filter("Progr", FilterOperator.EQ, arrKeyTipoEsp[1]))
                            sExpand = sExpand + "ToSHTipologia,ToSHVisibilita"
                            if(modelHome.getProperty("/formSottostrumento/esposizione_contabile") !== '0' && modelHome.getProperty("/formSottostrumento/solo_struttura") === true){
                                modelHome.setProperty("/formSottostrumento/solo_struttura", false)
                                modelHome.setProperty("/formSottostrumento/nessuna_restrizione", true)
                            }
                        }
                        break
                    case 'idFormStVisibilita':
                        if(modelHome.getProperty("/formSottostrumento/visibilita")){
                            aFilter.push(new Filter("Reale", FilterOperator.EQ, modelHome.getProperty("/formSottostrumento/visibilita")))
                            sExpand = sExpand + "ToSHTipologia,ToSHEsposizione"
                        }
                        break
                    default:
                        break;
                }
                oModel.read("/Gest_SH1Set",{
                    urlParameters: {
                        $expand: sExpand || 'ToSHEsposizione,ToSHTipologia,ToSHVisibilita'
                    },
                    filters: aFilter,
                    success:  (oData) => {
                        debugger
                        if(Array.isArray(oData.results[0].ToSHTipologia.results)) {
                            oData.results[0].ToSHTipologia.results.unshift({ TipoSstr: null, TipoSstrDescr: ""})
                            modelHome.setProperty("/formSottostrumento/tipologieSet", oData.results[0].ToSHTipologia.results)
                        }
                        if(Array.isArray(oData.results[0].ToSHEsposizione.results)){
                            oData.results[0].ToSHEsposizione.results.unshift({TipoEsposizione: null, TipoEsposizioneDescr: "", Fase: null, Anno: null})
                            modelHome.setProperty("/formSottostrumento/esposizione_contabileSet", oData.results[0].ToSHEsposizione.results)
                        }
                        if(Array.isArray(oData.results[0].ToSHVisibilita.results)){
                            oData.results[0].ToSHVisibilita.results.unshift({Fase: null, Anno: null})
                            modelHome.setProperty("/formSottostrumento/visibilitaSet", oData.results[0].ToSHVisibilita.results)
                        }
                    },
                    error: function (res) {
                        debugger
                    }
                })
            },
            onResetSStr: function () {
                let modelHome = this.getView().getModel("modelHome")
                modelHome.setProperty("/Sottostrumento", null)
                modelHome.setProperty("/infoSottoStrumento", null)
            },
            initDataDomSStr: function () {
                 let modelHome = this.getView().getModel("modelHome")
                 let modelHana = this.getOwnerComponent().getModel("sapHanaS2")

                 modelHana.read("/Gest_SH1_TitoloSet", {
                    filters: [new Filter("Fase", FilterOperator.EQ, "DLB"),
                              new Filter("Anno", FilterOperator.EQ, modelHome.getProperty("/formSottostrumento/esercizio"))],
                    success: (oData, res) => {
                        debugger
                        this.__setPropertyFiltriTitoloDomSStr(oData)
                    },
                    error: (err) => {
                        debugger
                    }
                 })
                //  modelHana.read("/Gest_SH1_MissioneSet", {
                //     filters: [new Filter("Fase", FilterOperator.EQ, "DLB"),
                //               new Filter("Anno", FilterOperator.EQ, modelHome.getProperty("/formSottostrumento/esercizio"))],
                //     success: (oData, res) => {
                //         debugger
                //         // let result = oData.results.filter((s => a => !(s.has(a.REQUESTID) && s.has(a.REQUESTCOMPANYOWNID)) && (s.add(a.REQUESTID) && s.add(
				// 		// 	                                a.REQUESTCOMPANYOWNID)))(new Set));
                //         let result = oData.results.filter((s => a => !(s.has(a.Prctr)) && (s.add(a.Prctr)))(new Set));
                //     },
                //     error: (err) => {
                //         debugger
                //     }
                //  })
                 //sap.ui.core.BusyIndicator.show();		
                // var sapHanaS2Tipologiche = this.getOwnerComponent().getModel("sapHanaS2Tipologiche");

                // var entityArray = [
                //     "/ZES_AMMINISTRAZIONE_SET",
                //     "/ZES_PROGRAMMA_SET",
                //     "/ZES_CATEGORIA_SET",
                //     "/ZES_AZIONE_SET",
                //     "/ZES_MISSIONE_SET",
                //     "/ZES_ECONOMICA2_SET",
                //     "/ZES_ECONOMICA3_SET" /*,
                //     "/ZES_PG_SET",
                //     "/ZES_CAPITOLO_SET"*/			
                // ];
               
                // sapHanaS2Tipologiche.read("/ZES_PROGRAMMA_SET", {
                //     filters: [new Filter("FIKRS", FilterOperator.EQ, "S001"),
                //               new Filter("FASE", FilterOperator.EQ, "DLB"), 
                //               new Filter("ANNO", FilterOperator.EQ, "2023"),
                //               new Filter("ATTIVO", FilterOperator.EQ, "X"),
                //         ],
                //     success: (oData, res ) => {
                //         debugger
                //         modelHome.setProperty("/formSottostrumento/programma_set", oData.results)
                //     },
                //     error: function(res){
                //         debugger
                //     }
                // })
                // sapHanaS2Tipologiche.read("/ZES_AZIONE_SET", {
                //     filters: [new Filter("FIKRS", FilterOperator.EQ, "S001"),
                //               new Filter("FASE", FilterOperator.EQ, "DLB"), 
                //               new Filter("ANNO", FilterOperator.EQ, "2023"),
                //               new Filter("ATTIVO", FilterOperator.EQ, "X"),
                //         ],
                //     success: (oData, res ) => {
                //         modelHome.setProperty("/formSottostrumento/azione_set", oData.results)
                //     },
                //     error: function(res){
                //         debugger
                //     }
                // })
                // sapHanaS2Tipologiche.read("/ZES_MISSIONE_SET", {
                //     filters: [new Filter("FIKRS", FilterOperator.EQ, "S001"),
                //               new Filter("FASE", FilterOperator.EQ, "DLB"), 
                //               new Filter("ANNO", FilterOperator.EQ, "2023"),
                //               new Filter("ATTIVO", FilterOperator.EQ, "X"),
                //         ],
                //     success: (oData, res ) => {
                //         modelHome.setProperty("/formSottostrumento/missione_set", oData.results)
                //     },
                //     error: function(res){
                //         debugger
                //     }
                // })
                // sapHanaS2Tipologiche.read("/ZES_ECONOMICA3_SET", {
                //     filters: [new Filter("FIKRS", FilterOperator.EQ, "S001"),
                //               new Filter("FASE", FilterOperator.EQ, "DLB"), 
                //               new Filter("ANNO", FilterOperator.EQ, "2023"),
                //               new Filter("ATTIVO", FilterOperator.EQ, "X"),
                //         ],
                //     success: (oData, res ) => {
                //         modelHome.setProperty("/formSottostrumento/economica3_set", oData.results)
                //     },
                //     error: function(res){
                //         debugger
                //     }
                // })
                // sapHanaS2Tipologiche.read("/ZES_ECONOMICA2_SET", {
                //     filters: [new Filter("FIKRS", FilterOperator.EQ, "S001"),
                //               new Filter("FASE", FilterOperator.EQ, "DLB"), 
                //               new Filter("ANNO", FilterOperator.EQ, "2023"),
                //               new Filter("ATTIVO", FilterOperator.EQ, "X"),
                //         ],
                //     success: (oData, res ) => {
                //         modelHome.setProperty("/formSottostrumento/economica2_set", oData.results)
                //     },
                //     error: function(res){
                //         debugger
                //     }
                // })
                // sapHanaS2Tipologiche.read("/ZES_CATEGORIA_SET", {
                //     filters: [new Filter("FIKRS", FilterOperator.EQ, "S001"),
                //               new Filter("FASE", FilterOperator.EQ, "DLB"), 
                //               new Filter("ANNO", FilterOperator.EQ, "2023"),
                //               new Filter("ATTIVO", FilterOperator.EQ, "X"),
                //         ],
                //     success: (oData, res ) => {
                //         modelHome.setProperty("/formSottostrumento/categoria_set", oData.results)
                //     },
                //     error: function(res){
                //         debugger
                //     }
                // })
                // sapHanaS2Tipologiche.read("/ZES_TITOLO_SET", {
                //     filters: [new Filter("FIKRS", FilterOperator.EQ, "S001"),
                //               new Filter("FASE", FilterOperator.EQ, "DLB"), 
                //               new Filter("ANNO", FilterOperator.EQ, "2023"),
                //               new Filter("ATTIVO", FilterOperator.EQ, "X"),
                //         ],
                //     success: (oData, res ) => {
                //         modelHome.setProperty("/formSottostrumento/titolo_set", oData.results)
                //     },
                //     error: function(res){
                //         debugger
                //     }
                // })

            },
            onHRDomSStr: function (oEvent) {
                let {key, value} = oEvent.getSource().getCustomData()[0].mProperties
                var sapHanaS2Tipologiche = this.getOwnerComponent().getModel("sapHanaS2Tipologiche");
                Fragment.load({
                    name:"zsap.com.r3.cobi.s4.gestposfin.view.fragment." + value,
                    controller: this
                }).then(oDialog => {
                    this[value] = oDialog
                    this.getView().addDependent(oDialog);
                    this[value].open()
                    // let modelHome = this.getView().getModel("modelHome")	
                    // sapHanaS2Tipologiche.read("/ZES_AZIONE_SET", {
                    //     filters: [new Filter("FIKRS", FilterOperator.EQ, "S001"),
                    //               new Filter("FASE", FilterOperator.EQ, "DLB"), 
                    //               new Filter("ANNO", FilterOperator.EQ, "2023"),
                    //               new Filter("ATTIVO", FilterOperator.EQ, "X"),
                    //         ],
                    //     success: (oData, res ) => {
                    //         debugger
                    //         modelHome.setProperty("/formSottostrumento/azione_set", oData.results)
                    //     },
                    //     error: function(res){
                    //         debugger
                    //     }
                    // })
                })
            },
            onConfirmSelectionDomSStr: function (oEvent) {
                let oTable = oEvent.getSource().getParent().getContent()[0]
                let sPathToUpdate  = oTable.getCustomData().find(cd => cd.getKey() === "selezioni").getValue()
                let modelHome = this.getView().getModel("modelHome")
                let aSelectedPaths = oTable.getSelectedContextPaths()
                let selectedItems = []
                for(let i = 0; i < aSelectedPaths.length; i++){
                    let currentItem = modelHome.getProperty(aSelectedPaths[i])
                    selectedItems.push(currentItem)
                }
                modelHome.setProperty("/formSottostrumento/" + sPathToUpdate, selectedItems)
                //modelHome.updateBindings(true)
                oEvent.getSource().getParent().close()
                this.__refreshItemsFilterDomSStr(sPathToUpdate) //aggiorna le altre liste/Tabelle in seguito a una selezione
            },
            onSearchHVAzioni: function (oEvent) {
                oEvent.getSource().getParent().getParent().getBinding("items").filter([new Filter("DESC_BREVE", FilterOperator.Contains, oEvent.getParameter("query"))])
            },
            setSelectedAzioni: function (azione, amm, missione, programma) {
                let modelHome = this.getView().getModel("modelHome")
                let aAzioni = modelHome.getProperty("/formSottostrumento/azioni")
                return  aAzioni.filter(item => (item.PRCTR === amm && item.CODICE_AZIONE === azione && 
                    item.CODICE_PROGRAMMA === programma && item.CODICE_MISSIONE === missione)).length > 0
                
            },
            onUpdateStartedHVDomSStr: function (oEvent) {
                oEvent.getSource().setBusy(true)
            },
            onUpdateFinishedHVDomSStr: function (oEvent) {
                oEvent.getSource().setBusy(false)
            },
            onCloseHVDomSStr: function (oEvent) {
                oEvent.getSource().getParent().close() 
            },
            onDeleteTokenDomSStr: function (oEvent) {
                let modelHome = this.getView().getModel("modelHome")
                let aSplitPathDeleted = []
                let sPathToUpdate = ""

                if(oEvent.getId() === 'tokenUpdate') {
                    sPathToUpdate = oEvent.getSource().getCustomData().find(cd => cd.getKey() === "deleteToken").getValue()
                    aSplitPathDeleted = oEvent.getParameter("removedTokens")[0].getBindingContext("modelHome").getPath().split("/")
                }
                else {
                    sPathToUpdate = oEvent.getSource().getParent().getParent().getCustomData().find(cd => cd.getKey() === "deleteToken").getValue()
                    aSplitPathDeleted = oEvent.getParameter("token").getBindingContext("modelHome").getPath().split("/")
                }

                let sIndexDeleted = aSplitPathDeleted[aSplitPathDeleted.length - 1]
                let aSelectedItems = modelHome.getProperty("/formSottostrumento/" + sPathToUpdate)
                //prima della rimozione del token, elimino i figli
                this.__deleteTokenChildrenDomSStr(aSplitPathDeleted)
                aSelectedItems.splice(Number(sIndexDeleted), 1)
                modelHome.updateBindings(true)
            },
            __deleteTokenChildrenDomSStr: function (aSplitPathDeleted) {
                let modelHome = this.getView().getModel("modelHome") 
                //determino i figli da eliminare
                let aEconomica3New = []
                let aEconomica3 = []
                let aEconomica2New = []
                let aEconomica2 = []
                let aCategoriaNew = []
                let aCategoria = []
                let oFatherDeleted = {}
                switch (aSplitPathDeleted[2]) {
                    case "economica2": //economica 2 ha figlio economica3
                        //estrazione padre in eliminazione
                         oFatherDeleted = modelHome.getProperty(`/formSottostrumento/${aSplitPathDeleted[2]}/${aSplitPathDeleted[3]}`)
                         aEconomica3 = modelHome.getProperty("/formSottostrumento/economica3")
                       if(oFatherDeleted !== undefined){
                            for(let i = 0; i < aEconomica3.length; i++){
                                if(aEconomica3[i].Ce2 !== oFatherDeleted.Ce2)
                                    aEconomica3New.push(aEconomica3[i])
                            }
                            modelHome.setProperty("/formSottostrumento/economica3", aEconomica3New)
                        }
                        break;
                    case "categoria": //categoria  figlio economica2 e economica3
                        //estrazione padre in eliminazione 
                         oFatherDeleted = modelHome.getProperty(`/formSottostrumento/${aSplitPathDeleted[2]}/${aSplitPathDeleted[3]}`)
                         aEconomica3 = modelHome.getProperty("/formSottostrumento/economica3")
                         aEconomica2 = modelHome.getProperty("/formSottostrumento/economica2")
                       if(oFatherDeleted !== undefined){
                            for(let i = 0; i < aEconomica3.length; i++){
                                if(aEconomica3[i].Categoria !== oFatherDeleted.Categoria)
                                    aEconomica3New.push(aEconomica3[i])
                            }
                            modelHome.setProperty("/formSottostrumento/economica3", aEconomica3New)

                            for(let i = 0; i < aEconomica2.length; i++){
                                if(aEconomica2[i].Categoria !== oFatherDeleted.Categoria)
                                    aEconomica2New.push(aEconomica2[i])
                            }
                            modelHome.setProperty("/formSottostrumento/economica2", aEconomica2New)
                        }
                        break;
                    case "titoli": //categoria  figlio economica2 e economica3
                        //estrazione padre in eliminazione 
                         oFatherDeleted = modelHome.getProperty(`/formSottostrumento/${aSplitPathDeleted[2]}/${aSplitPathDeleted[3]}`)
                         aEconomica3 = modelHome.getProperty("/formSottostrumento/economica3")
                         aEconomica2 = modelHome.getProperty("/formSottostrumento/economica2")
                         aCategoria = modelHome.getProperty("/formSottostrumento/categoria")
                       if(oFatherDeleted !== undefined){
                            for(let i = 0; i < aEconomica3.length; i++){
                                if(aEconomica3[i].Titolo !== oFatherDeleted.Titolo)
                                    aEconomica3New.push(aEconomica3[i])
                            }
                            modelHome.setProperty("/formSottostrumento/economica3", aEconomica3New)

                            for(let i = 0; i < aEconomica2.length; i++){
                                if(aEconomica2[i].Titolo !== oFatherDeleted.Titolo)
                                    aEconomica2New.push(aEconomica2[i])
                            }
                            modelHome.setProperty("/formSottostrumento/economica2", aEconomica2New)

                            for(let i = 0; i < aCategoria.length; i++){
                                if(aCategoria[i].Titolo !== oFatherDeleted.Titolo)
                                    aCategoriaNew.push(aCategoria[i])
                            }
                            modelHome.setProperty("/formSottostrumento/categoria", aCategoriaNew)
                        }
                        break;
                    default:
                        break;
                }
            },
            __getAllIndexes(arr, val, property) {
                var indexes = [], i;
                for(i = 0; i < arr.length; i++)
                    if (arr[i][property] === val)
                        indexes.push(i);
                return indexes;
            },
            setSelectedProgrammi: function (missione, amm, programma) {
                let modelHome = this.getView().getModel("modelHome")
                let aProgrammi = modelHome.getProperty("/formSottostrumento/programmi")
                return  aProgrammi.filter(item => ( item.CODICE_PROGRAMMA === programma && item.CODICE_MISSIONE === missione)).length > 0
            },
            setSelectedCE3: function (titolo, categoria, ce2, ce3) {
                let modelHome = this.getView().getModel("modelHome")
                let aProgrammi = modelHome.getProperty("/formSottostrumento/economica3")
                return  aProgrammi.filter(item => ( item.Titolo === titolo && item.Categoria === categoria && 
                                        item.Ce2 === ce2&& item.Ce3 === ce3 )).length > 0
            },
            setSelectedCE2: function (titolo, categoria, ce2) {
                let modelHome = this.getView().getModel("modelHome")
                let aProgrammi = modelHome.getProperty("/formSottostrumento/economica2")
                return  aProgrammi.filter(item => ( item.Titolo === titolo && item.Categoria === categoria && 
                                        item.Ce2 === ce2 )).length > 0
            },
            setSelectedCategoria: function (titolo, categoria) {
                let modelHome = this.getView().getModel("modelHome")
                let aProgrammi = modelHome.getProperty("/formSottostrumento/categoria")
                return  aProgrammi.filter(item => ( item.Titolo === titolo && item.Categoria === categoria)).length > 0
            },
            setSelectedAmm: function (amm) {
                let modelHome = this.getView().getModel("modelHome")
                let aProgrammi = modelHome.getProperty("/formSottostrumento/dominio_sstr")
                return  aProgrammi.filter(item => ( item.Prctr === amm)).length > 0
            },
            setSelectedTitolo: function (titolo) {
                let modelHome = this.getView().getModel("modelHome")
                let aProgrammi = modelHome.getProperty("/formSottostrumento/titoli")
                return  aProgrammi.filter(item => ( item.Titolo === titolo)).length > 0
            },
            setSelectedMissioni: function (missione) {
                let modelHome = this.getView().getModel("modelHome")
                let aProgrammi = modelHome.getProperty("/formSottostrumento/missioni")
                return  aProgrammi.filter(item => ( item.CODICE_MISSIONE === missione)).length > 0
            },
            onSelectionChangeMCBDomSStr: function (oEvent) {
                debugger
                let modelHome = this.getView().getModel("modelHome")
                const bAction = oEvent.getParameter("selected")
                const sArrayName = oEvent.getSource().getCustomData().find(cd => cd.getKey() === "selezione").getValue()
                let sPathItem = oEvent.getParameter("changedItem").getBindingContext("modelHome").getPath()
                let aItemsToUpdate = modelHome.getProperty("/formSottostrumento/" + sArrayName)
                if(bAction) {
                    aItemsToUpdate.push(modelHome.getProperty(sPathItem))
                } else {
                    const sKey = this.__getKeyMCBDomSStr(sArrayName)
                    let sIndexToRemove = aItemsToUpdate.findIndex( item => item[sKey] === oEvent.getParameter("changedItem").getKey())
                    aItemsToUpdate.splice(Number(sIndexToRemove), 1)
                }
            },
            __getKeyMCBDomSStr: function (key) { //metodo per l'estrazione delle chiavi degli array
                const keyValue = {
                    "amministrazioni": "Prctr",
                    "titoli": "CODICE_TITOLO",
                    "missioni": "CODICE_MISSIONE"
                }
                return keyValue[key]
            },
            __getPropertyByEntity: function (sEntity) {
                const propertyEntity =  {
                    "/Gest_PosFin_SH_AmministrazioniSet" : "dominio_sstrSet",
                    "/ZES_PROGRAMMA_SET": "programma_set",
                    "/ZES_MISSIONE_SET": "missione_set"
                }
            },
            __refreshItemsFilterDomSStr: function (sPath) {
                const modelHana = this.getOwnerComponent().getModel("sapHanaS2");
                const modelHome = this.getView().getModel("modelHome")

                let sEntitySet = []
                let aFilters = [new Filter("Fase", FilterOperator.EQ, "DLB"),
                                new Filter("Anno", FilterOperator.EQ, modelHome.getProperty("/formSottostrumento/esercizio"))]
                switch (sPath) {
                    case "categoria": //la selezione di azioni ha effetto su Amministrazione/Missione/Programma
                        let aCategoria=  modelHome.getProperty("/formSottostrumento/" + sPath)
                        aCategoria.map(cat => {
                            aFilters.push(new Filter("Titolo", FilterOperator.EQ, cat.Titolo))
                        })
                        break;
                    case "economica2": //la selezione di azioni ha effetto su Amministrazione/Missione/Programma
                        let aEconomica2 =  modelHome.getProperty("/formSottostrumento/" + sPath)
                        aEconomica2.map(ce2 => {
                            aFilters.push(new Filter("Categoria", FilterOperator.EQ, ce2.Categoria))
                            aFilters.push(new Filter("Titolo", FilterOperator.EQ, ce2.Titolo))
                        })
                        break;
                    case "economica3": //la selezione di azioni ha effetto su Amministrazione/Missione/Programma
                        let aEconomica3 =  modelHome.getProperty("/formSottostrumento/" + sPath)
                        aEconomica3.map(ce3 => {
                            aFilters.push(new Filter("Ce2", FilterOperator.EQ, ce3.Ce2))
                            aFilters.push(new Filter("Categoria", FilterOperator.EQ, ce3.Categoria))
                            aFilters.push(new Filter("Titolo", FilterOperator.EQ, ce3.Titolo))
                        })
                        break;
                    default:
                        break;
                }
                modelHana.read("/Gest_SH1_TitoloSet", {
                    filters: aFilters,
                    success: (oData, res) => {
                        debugger
                        // this.__setPropertyFiltriTitoloDomSStr(oData)
                        let modelHome = this.getView().getModel("modelHome")
                        let aCategoriaAutoSelected = []
                        let aTitoliAutoSelected = []
                        let aCE2AutoSelected = []
                        switch (sPath) {
                            case "categoria":
                                aTitoliAutoSelected = oData.results.filter((s => a => !(s.has(a.Titolo)) && (s.add(a.Titolo)))(new Set))
                                                                .filter(tit => tit.Titolo !== "");
                                modelHome.setProperty("/formSottostrumento/titoli", aTitoliAutoSelected)
                                break;
                            case "economica2":
                                aCategoriaAutoSelected = this.__removeDuplicate(oData.results, "categoria")
                                                                .filter(cat => cat.Titolo !== "");
                                modelHome.setProperty("/formSottostrumento/categoria", aCategoriaAutoSelected)
                                aTitoliAutoSelected = oData.results.filter((s => a => !(s.has(a.Titolo)) && (s.add(a.Titolo)))(new Set))
                                                                .filter(tit => tit.Titolo !== "");
                                modelHome.setProperty("/formSottostrumento/titoli", aTitoliAutoSelected)
                                break;
                            case "economica3":
                                aCE2AutoSelected = this.__removeDuplicate(oData.results, "ce2").filter(ce2 => ce2.Ce2 !== "");
                                modelHome.setProperty("/formSottostrumento/economica2", aCE2AutoSelected)

                                aCategoriaAutoSelected = this.__removeDuplicate(oData.results, "categoria")
                                                                .filter(cat => cat.Titolo !== "");
                                modelHome.setProperty("/formSottostrumento/categoria", aCategoriaAutoSelected)
                                
                                aTitoliAutoSelected = oData.results.filter((s => a => !(s.has(a.Titolo)) && (s.add(a.Titolo)))(new Set))
                                                                .filter(tit => tit.Titolo !== "");
                                modelHome.setProperty("/formSottostrumento/titoli", aTitoliAutoSelected)
                                break;
                            default:
                                break;
                        }
                    },
                    error: (err) => {
                        debugger
                    }
                 })
            },
            __removeDuplicate(arr, property){
                let results = []
                switch (property) {
                    case "categoria":
                        for(let i = 0; i <  arr.length; i++){
                            if(results.filter(item => (item.Categoria === arr[i].Categoria && item.Titolo === arr[i].Titolo)).length === 0)
                                results.push(arr[i])
                        }
                        break;
                    case "ce2":
                        for(let i = 0; i <  arr.length; i++){
                            if(results.filter(item => item.Categoria === arr[i].Categoria && item.Titolo === arr[i].Titolo
                                            && item.Ce2 === arr[i].Ce2).length === 0)
                                results.push(arr[i])
                        }
                        break; 
                    case "ce3":
                        for(let i = 0; i <  arr.length; i++){
                            if(results.filter(item => item.Categoria === arr[i].Categoria && item.Titolo === arr[i].Titolo
                                            && item.Ce2 === arr[i].Ce2 && item.Ce3 === arr[i].Ce3).length === 0)
                                results.push(arr[i])
                        }
                        break; 
                    default:
                        break;
                }
                return results
            },
            __setPropertyFiltriTitoloDomSStr: function (oData) {
                let modelHome = this.getView().getModel("modelHome")
                let resultAmm = oData.results.filter((s => a => !(s.has(a.Prctr)) && (s.add(a.Prctr)))(new Set))
                                        .filter(amm => amm.Prctr !== "");
                modelHome.setProperty("/formSottostrumento/dominio_sstrSet", resultAmm)

                let resultTitoli = oData.results.filter((s => a => !(s.has(a.Titolo)) && (s.add(a.Titolo)))(new Set))
                                    .filter(tit => tit.Titolo !== "");
                modelHome.setProperty("/formSottostrumento/titolo_set", resultTitoli)

                let resultCategoria = this.__removeDuplicate(oData.results, "categoria")
                                            .filter(cat => cat.Titolo !== "");
                modelHome.setProperty("/formSottostrumento/categoria_set", resultCategoria)

                let resultCE2= this.__removeDuplicate(oData.results, "ce2")
                                            .filter(ce2 => ce2.Ce2 !== "");
                modelHome.setProperty("/formSottostrumento/economica2_set", resultCE2)

                let resultCE3= this.__removeDuplicate(oData.results, "ce3")
                                            .filter(ce3 => ce3.Ce3 !== "");
                modelHome.setProperty("/formSottostrumento/economica3_set", resultCE3)
            }
        });
    });
