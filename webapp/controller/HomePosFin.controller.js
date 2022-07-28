sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/Fragment",
	"sap/m/MessageBox",
	"./BaseController"
], function(Controller, JSONModel, Filter, FilterOperator, Fragment, MessageBox, BaseController) {
	"use strict";

	return BaseController.extend("zsap.com.r3.cobi.s4.gestposfin.controller.HomePosFin", {
		/**
		 * @override
		 */
		onInit: async function() {
			this.getOwnerComponent().setModel(new JSONModel({faseRicerca: true, infoSottoStrumento: {}}),"modelPosFin")
			this.getOwnerComponent().setModel(new JSONModel({FieldPosEnabled: true, Esercizio:(new Date(new Date().setFullYear(new Date().getFullYear() + 1))).getFullYear().toString()}),"modelFilterHome")
			// this.getView().getModel("modelPosFin").setProperty("/onAvvio",false)
			let itemsMock = await this.loadJSONTest("/model/data_mock.json");
			this.getOwnerComponent().getModel("modelPosFin").setProperty("/",itemsMock)
			this.getOwnerComponent().getModel("modelPosFin").setProperty("/initialDetail",true)
			this.getOwnerComponent().getModel("modelPosFin").setProperty("/form",{})
			
			const router = sap.ui.core.UIComponent.getRouterFor(this)
			const aSubHashes = router.getHashChanger().getHash().split("/")
			const oKeySStr = {
				Fikrs: aSubHashes[1],
				CodiceStrumento: aSubHashes[2],
				CodiceStrumentoOri: aSubHashes[3],
				CodiceSottostrumento: aSubHashes[4],
				Datbis: encodeURIComponent(new Date(aSubHashes[5]).toISOString()).replace(".000Z", "")
			}
			this.__getSottoStrumento(oKeySStr)
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.getRoute("HomePosFin").attachPatternMatched(this._onObjectMatched, this);
		//	this.handleCreateInizialFilter();
			//this.initData();
		},
		_onObjectMatched: function (oEvent) {
			const oKeySStr = oEvent.getParameter("arguments")
			const oModel = this.getView().getModel("sapHanaS2");
			this.getView().setBusy(true)
			oKeySStr.Datbis = encodeURIComponent(new Date(oKeySStr.Datbis).toISOString()).replace(".000Z", "")
			this.__getSottoStrumento(oKeySStr)
			// let sUrl = `/Gest_fasi_sstrSet(Fikrs='${oKeySStr.Fikrs}',CodiceStrumento='${oKeySStr.CodiceStrumento}'`+
			// 			`,CodiceStrumentoOri='${oKeySStr.CodiceStrumentoOri}',CodiceSottostrumento='${oKeySStr.CodiceSottostrumento}',Datbis=datetime'${oKeySStr.Datbis}')`
			// oModel.read(sUrl,{
			// 	success: (oData, res) => {
			// 		this.getView().setBusy(false)
			// 		let modelPosFin = this.getView().getModel("modelPosFin")
			// 		modelPosFin.setProperty("/Sottostrumento", `${oData.DescrTipoSottostrumento} - ${oData.NumeroSottostrumento}`)
			// 		modelPosFin.setProperty("/itemSottostrumento", oData)
			// 	},
			// 	error: function (res) {
			// 		this.getView().setBusy(false)
			// 	}
			// })
		},
		__getSottoStrumento(oKeySStr){
			//this.getView().setBusy(true)
			const oModel = this.getView().getModel("sapHanaS2");
			// let sUrl = `/Gest_fasi_sstrSet(Fikrs='${oKeySStr.Fikrs}',CodiceStrumento='${oKeySStr.CodiceStrumento}'`+
			// 			`,CodiceStrumentoOri='${oKeySStr.CodiceStrumentoOri}',CodiceSottostrumento='${oKeySStr.CodiceSottostrumento}',Datbis=datetime'${oKeySStr.Datbis}')`
			oModel.read("/Gest_fasi_sstrSet",{
				filters: [
					new Filter("Fikrs", FilterOperator.EQ, oKeySStr.Fikrs),
					new Filter("CodiceStrumento", FilterOperator.EQ, oKeySStr.CodiceStrumento),
					new Filter("CodiceStrumentoOri", FilterOperator.EQ, oKeySStr.CodiceStrumentoOri),
					new Filter("CodiceSottostrumento", FilterOperator.EQ, oKeySStr.CodiceSottostrumento)
					//new Filter("Datbis", FilterOperator.EQ, new Date(oKeySStr.Datbis))
				],
				success: (oData, res) => {
					this.getView().setBusy(false)
					let modelPosFin = this.getView().getModel("modelPosFin")
					modelPosFin.setProperty("/Sottostrumento", `${oData.results[0].DescrTipoSottostrumento} - ${oData.results[0].NumeroSottostrumento}`)
					modelPosFin.setProperty("/infoSottoStrumento", oData.results[0])
				},
				error: function (res) {
					this.getView().setBusy(false)
				}
			})
		},
		onSearchSottostrumento: function () {
			var oModel = this.getView().getModel("sapHanaS2");
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
			let modelHome = this.getView().getModel("modelPosFin") //.getProperty("/formSottostrumento")
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
		onClose: function (oEvent) {
			if(oEvent.getSource().getCustomData().length){
				this.__resetFiltri(oEvent.getSource().getCustomData().filter(item => item.getKey() === "resetFiltri"))
			}   
			oEvent.getSource().getParent().close()
			//let sDialog = oEvent.getSource().getCustomData().find(item => item.getKey() === "HVSottostrumento").getValue()
			// this[sDialog].close()
			// this[sDialog].destroy()
			// this[sDialog] = null
		},
		onPressConfermaSottostrumento: function (oEvent) {
			let modelSottoStrumenti = this.getView().getModel("sottostrumentiModel")
			let modelHome = this.getView().getModel("modelPosFin")
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

			this.oDialogHVSottoStrumento.close();
			oEvent.getSource().getParent().close()
		},
		onPosFin: function () {
			if(!this.oDialogPosFin) {
				Fragment.load({
					name:"zsap.com.r3.cobi.s4.gestposfin.view.fragment.PosFinHelp",
					controller: this
				}).then(oDialog => {
					this.oDialogPosFin = oDialog;
					this.getView().addDependent(oDialog);
					this.oDialogPosFin.open();
				})
			} else {
				this.oDialogPosFin.open();
			}
		},
		onPressMatchCodeFragment: function (oEvent) {
			const {key, value} = oEvent.getSource().getCustomData()[0].mProperties
			if(!this[value]) {
				Fragment.load({
					name:"zsap.com.r3.cobi.s4.gestposfin.view.fragment." + value,
					controller: this
				}).then(oDialog => {
					//this.__getValueHelpData(key)
					this[value] = oDialog;
					this.getView().addDependent(oDialog);
					this[value].open();
				})
			} else {
				this[value].open();
			}
		},
		loadJSONTest: function (sPath) {
			return new Promise(async function (resolve, reject) {
			  let oJsonModel = new sap.ui.model.json.JSONModel();
			  await oJsonModel.loadData(sPath, false);
			  resolve(oJsonModel.getData());
			});
		  },
		  onPressChoiceStandardlist: function (oEvent) {
			let homeModel = this.getView().getModel("modelPosFin")
			const {key, value} = oEvent.getSource().getCustomData()[0].mProperties 
			homeModel.setProperty("/form/" + key, oEvent.getParameter("selectedItem").getProperty("title"))
			homeModel.setProperty("/form/" + value, oEvent.getParameter("selectedItem").getProperty("description"))
		},
		onPressChoiceTableProgramma: function (oEvent) {
			let homeModel = this.getView().getModel("modelPosFin")
			const {key, value} = oEvent.getSource().getCustomData()[0].mProperties 
			let item = homeModel.getProperty(oEvent.getParameter("selectedItem").getBindingContextPath())
			homeModel.setProperty("/form/" + key,  item.VALORE)
			homeModel.setProperty("/form/" + value, item.DESCRIZIONE)
			homeModel.setProperty("/form/MISSIONE",  item.MISSIONE)
			homeModel.setProperty("/form/DESCRIZIONE_MISSIONE", item.DESCR_MISSIONE)
		},
		  onPressChoiceTableAzione: function (oEvent) {
			let homeModel = this.getView().getModel("modelPosFin")
			const {key, value} = oEvent.getSource().getCustomData()[0].mProperties 
			let item = homeModel.getProperty(oEvent.getParameter("selectedItem").getBindingContextPath())
			homeModel.setProperty("/form/" + key,  item.VALORE)
			homeModel.setProperty("/form/" + value, item.DESCRIZIONE)
			homeModel.setProperty("/form/MISSIONE",  item.MISSIONE)
			homeModel.setProperty("/form/DESCRIZIONE_MISSIONE", item.DESCR_MISSIONE)
			homeModel.setProperty("/form/PROGRAMMA",  item.PROGRAMMA)
			homeModel.setProperty("/form/DESC_PROGRAMMA", item.DESCR_PROGRAMMA)
			homeModel.setProperty("/form/AMMINISTRAZIONE",  item.AMMINISTRAZIONE)
			homeModel.setProperty("/form/DESCRIZIONE_AMM", item.DESCR_AMMINISTRAZIONE)
		},
		  onPressChoiceTableCapitolo: function (oEvent) {
			let homeModel = this.getView().getModel("modelPosFin")
			const {key, value} = oEvent.getSource().getCustomData()[0].mProperties 
			let item = homeModel.getProperty(oEvent.getParameter("selectedItem").getBindingContextPath())
			homeModel.setProperty("/form/" + key,  item.CAPITOLO)
			homeModel.setProperty("/form/" + value, item.DESCR_CAPITOLO)
			homeModel.setProperty("/form/AMMINISTRAZIONE",  item.AMMINISTRAZIONE)
			homeModel.setProperty("/form/DESCRIZIONE_AMM", item.DESCR_AMMINISTRAZIONE)
		},
		  onPressChoiceTablePG: function (oEvent) {
			let homeModel = this.getView().getModel("modelPosFin")
			const {key, value} = oEvent.getSource().getCustomData()[0].mProperties 
			let item = homeModel.getProperty(oEvent.getParameter("selectedItem").getBindingContextPath())
			homeModel.setProperty("/form/" + key,  item.PG)
			homeModel.setProperty("/form/" + value, item.DESCR_PG)
			homeModel.setProperty("/form/AMMINISTRAZIONE",  item.AMMINISTRAZIONE)
			homeModel.setProperty("/form/DESCRIZIONE_AMM", item.DESCR_AMMINISTRAZIONE)
			homeModel.setProperty("/form/CAPITOLO",  item.CAPITOLO)
			homeModel.setProperty("/form/DESC_CAPITOLO", item.DESCR_CAPITOLO)
		},
		  onPressChoiceTableCategoria: function (oEvent) {
			let homeModel = this.getView().getModel("modelPosFin")
			const {key, value} = oEvent.getSource().getCustomData()[0].mProperties 
			let item = homeModel.getProperty(oEvent.getParameter("selectedItem").getBindingContextPath())
			homeModel.setProperty("/form/" + key,  item.VALORE)
			homeModel.setProperty("/form/" + value, item.DESCRIZIONE)
			homeModel.setProperty("/form/AMMINISTRAZIONE",  item.AMMINISTRAZIONE)
			homeModel.setProperty("/form/DESCRIZIONE_AMM", item.DESCR_AMMINISTRAZIONE)
		},
		onPressConfPosFin: function () {
			if(!this.oDialogTabPosFinanziaria) {
				Fragment.load({
					name:"zsap.com.r3.cobi.s4.gestposfin.view.fragment.TablePosizioneFinanziaria",
					controller: this
				}).then(oDialog => {
					this.oDialogTabPosFinanziaria = oDialog;
					this.getView().addDependent(oDialog);
					this.oDialogTabPosFinanziaria.open();
				})
			} else {
				this.oDialogTabPosFinanziaria.open();
			}
		},
		handleCloseFinan: function (oEvent) {
			let homeModel = this.getView().getModel("modelPosFin")
			let oSelectedItem = homeModel.getProperty(oEvent.getParameter("selectedItem").getBindingContextPath())
			homeModel.setProperty("/posFin", oSelectedItem.POSIZIONE_FINANZIARIA)
			//lt inserisco la posizione finanziaria
			let modelFilterHome = this.getView().getModel("modelFilterHome") 
			modelFilterHome.setProperty("/PosizioneFinanziaria", oSelectedItem.POSIZIONE_FINANZIARIA)
			homeModel.setProperty("/selectedPosFin", oSelectedItem)
			this.oDialogPosFin.close()
		},
		onGestisciPosFin: function (oEvent) {
			let homeModel = this.getView().getModel("modelPosFin")
			//this.getView().byId("DetailInitial").setVisible(false)
			homeModel.setProperty("/onAvvio", true)
			homeModel.setProperty("/tabAnagrafica", true)
			homeModel.setProperty("/faseRicerca", false)
			homeModel.setProperty("/onModify", true)
			homeModel.setProperty("/onCreate", false)
			homeModel.setProperty("/detailAnagrafica", homeModel.getProperty("/selectedPosFin"))
			/* this.getView().byId("idCompetenzaTab").setVisible(true)
			this.getView().byId("idCassTab").setVisible(true) */

			homeModel.setProperty("/idCompetenzaTab", true)
			homeModel.setProperty("/idCassTab", true)

			//lt vado al dettaglio
			this.onNavTo();

		},
		onCreaPosFin: function(oEvent){
			let modelPosFin = this.getView().getModel("modelPosFin")

			/* this.getView().byId("DetailInitial").setVisible(false)
			this.getView().byId("idCompetenzaTab").setVisible(false)
			this.getView().byId("idCassTab").setVisible(false) */
			//setto visibilità
			//homeModel.setProperty("/DetailInitial", false)

			//controlla che il sotto strumento sia stato selezionato
			// if(!modelPosFin.getProperty("/Sottostrumento")) {
			// 	return MessageBox.warning("Selezionare  un Sottostrumento", 
			// 		{ 	
			// 			title: "Attenzione",
			// 			actions: sap.m.MessageBox.Action.OK,                
			// 			emphasizedAction: sap.m.MessageBox.Action.OK,       
			// 			onClose: () => {
			// 				this.onHelpValueSottoStrumento()
			// 			}
			// 		}
			// 	)
			// }
			//fine controllo
			modelPosFin.setProperty("/idCompetenzaTab", false)
			modelPosFin.setProperty("/idCassTab", false)

			modelPosFin.setProperty("/onAvvio", true)
			modelPosFin.setProperty("/tabAnagrafica", true)
			modelPosFin.setProperty("/onModify", false)
			modelPosFin.setProperty("/onCreate", true)
			modelPosFin.setProperty("/detailAnagrafica", {})
			
			
			//lt vado al dettaglio
			this.onNavTo();
		},
		onExpandPopOverPosFin: function (oEvent) {
			var oButton = oEvent.getSource(),
			oView = this.getView();

			// create popover
			if (!this._pPopover) {
				this._pPopover = Fragment.load({
					id: oView.getId(),
					name: "zsap.com.r3.cobi.s4.gestposfin.view.fragment.PopOverPosizioneFinanziaria",
					controller: this
				}).then(function(oPopover) {
					oView.addDependent(oPopover);
					return oPopover;
				});
			}
			this._pPopover.then(function(oPopover) {
				oPopover.openBy(oButton);
			});
		},
		onPressRipristinaRicerca: function (oEvent) {
			let homeModel = this.getView().getModel("modelPosFin")
			homeModel.setProperty("/faseRicerca", true)
			//this.getView().byId("DetailInitial").setVisible(true)
			homeModel.setProperty("/Sottostrumento", "")
			homeModel.setProperty("/esercizio", "")
			homeModel.setProperty("/posFin", "")
			homeModel.setProperty("/onAvvio", false)
			homeModel.setProperty("/tabAnagrafica", false)

			//lt apro il popup
			this.handleCreateInizialFilter();
			
		},

		//lt button info general
		onExpandPopOverInfo: function (oEvent) {
			var oButton = oEvent.getSource(),			
			oView = this.getView();
			var customData = oButton.data();
			var descrizione,
			title;
			if(!customData.desc || customData.desc === ""){
				descrizione = "no desc";
				//return;
			}else{
				descrizione = customData.desc;
			}	
					
			this.getView().getModel("modelPosFin").setProperty("/InfoPopoverTitle", customData.title); 
			this.getView().getModel("modelPosFin").setProperty("/InfoPopover", descrizione); 

			// create popover general	
			if (!this._pPopoverAction) {
				this._pPopoverAction = Fragment.load({
					id: oView.getId(),
					name: "zsap.com.r3.cobi.s4.gestposfin.view.fragment.PopOverInfoGeneral",
					controller: this
				}).then(function(oPopover) {
					oView.addDependent(oPopover);
					return oPopover;
				});
			}
			this._pPopoverAction.then(function(oPopover) {
				oPopover.openBy(oButton);
			});
		},


		onExpandPopOverSottostrumento: function (oEvent) {
			var oButton = oEvent.getSource(),
			oView = this.getView();

			// create popover
			if (!this._pPopoverSottoStr) {
				this._pPopoverSottoStr = Fragment.load({
					id: oView.getId(),
					name: "zsap.com.r3.cobi.s4.gestposfin.view.fragment.PopOverSottostrumento",
					controller: this
				}).then(function(oPopover) {
					oView.addDependent(oPopover);
					return oPopover;
				});
			}
			this._pPopoverSottoStr.then(function(oPopover) {
				oPopover.openBy(oButton);
			});
		},
		onExpandPopOverMiss: function (oEvent) {
			var oButton = oEvent.getSource(),
			oView = this.getView();

			// create popover
			if (!this._pPopoverMiss) {
				this._pPopoverMiss = Fragment.load({
					id: oView.getId(),
					name: "zsap.com.r3.cobi.s4.gestposfin.view.fragment.PopOverMissione",
					controller: this
				}).then(function(oPopover) {
					oView.addDependent(oPopover);
					return oPopover;
				});
			}
			this._pPopoverMiss.then(function(oPopover) {
				oPopover.openBy(oButton);
			});
		},
		onExpandPopOverProgr: function (oEvent) {
			var oButton = oEvent.getSource(),
			oView = this.getView();

			// create popover
			if (!this._pPopoverProgr) {
				this._pPopoverProgr = Fragment.load({
					id: oView.getId(),
					name: "zsap.com.r3.cobi.s4.gestposfin.view.fragment.PopOverProgramma",
					controller: this
				}).then(function(oPopover) {
					oView.addDependent(oPopover);
					return oPopover;
				});
			}
			this._pPopoverProgr.then(function(oPopover) {
				oPopover.openBy(oButton);
			});
		},

		onExpandPopOverAction: function (oEvent) {
			var oButton = oEvent.getSource(),
			oView = this.getView();

			// create popover
			if (!this._pPopoverAction) {
				this._pPopoverAction = Fragment.load({
					id: oView.getId(),
					name: "zsap.com.r3.cobi.s4.gestposfin.view.fragment.PopOverAzione",
					controller: this
				}).then(function(oPopover) {
					oView.addDependent(oPopover);
					return oPopover;
				});
			}
			this._pPopoverAction.then(function(oPopover) {
				oPopover.openBy(oButton);
			});
		},
		onTabChanged: function (oEvent) {
			let homeModel = this.getView().getModel("modelPosFin")
			if(oEvent.getParameter("key") === "info"){
				homeModel.setProperty("/tabAnagrafica", true)
			} else {
				homeModel.setProperty("/tabAnagrafica", false)
			}
		},

		//lt inserisco popup iniziale.
		handleCreateInizialFilter: function (oEvent) {

			this.getView().getModel("modelPosFin").setProperty("/Filter",{
				nome 		: "",
				esercizio 	: "2023",
				descrizione : "",
				statoWf		: "Iniziato"
			})
			if (!this._handleAddFilter) {
				this._handleAddFilter = sap.ui.xmlfragment("zsap.com.r3.cobi.s4.gestposfin.view.fragment.FiltriIniziali", this);
				this.getView().addDependent(this._handleAddFilter);
			}
			this._handleAddFilter.open();
		},
		//lt chiudo e distruggo i filtri iniziale
		handlecloseInizialFilter: function () {
			if (this._handleAddFilter) {
				this._handleAddFilter.destroy();
				this._handleAddFilter = null;
			}
		},

		handleAddElenco: function (oEvent) {

			/* this.getView().getModel("generalModel").setProperty("/ValueNpshNew", {}); */
			this.getView().getModel("modelPosFin").setProperty("/Elenco",{
				nome 		: "",
				esercizio 	: "",
				descrizione : "",
				statoWf		: "Iniziato"
			})
			if (!this._handleAddElenco) {
				this._handleAddElenco = sap.ui.xmlfragment("zsap.com.r3.cobi.s4.gestposfin.view.fragment.AddElenco", this);
				this.getView().addDependent(this._handleAddElenco);
			}
			this._handleAddElenco.open();
		},

		handlecloseElenco: function () {
			if (this._handleAddElenco) {
				this._handleAddElenco.destroy();
				this._handleAddElenco = null;
			}
		},

		addElenco: function () {
			//lt funzione di aggiunta

			this.handlecloseElenco();
		},

		handleAddCOFOG: function (oEvent) {

			/* this.getView().getModel("generalModel").setProperty("/ValueNpshNew", {}); */
			this.getView().getModel("modelPosFin").setProperty("/COFOG",{
				nome 		: "",
				esercizio 	: "",
				descrizione : "",
				statoWf		: "Iniziato"
			})
			if (!this._handleAddCOFOG) {
				this._handleAddCOFOG = sap.ui.xmlfragment("zsap.com.r3.cobi.s4.gestposfin.view.fragment.AddCOFOG", this);
				this.getView().addDependent(this._handleAddCOFOG);
			}
			this._handleAddCOFOG.open();
		},

		handlecloseCOFOG: function () {
			if (this._handleAddCOFOG) {
				this._handleAddCOFOG.destroy();
				this._handleAddCOFOG = null;
			}
		},

		addCOFOG: function () {
			//lt funzione di aggiunta

			this.handlecloseCOFOG();
		},

		onOpenSearchCOFOG: function (oEvent) {

			
			if (!this._handleAddCOFOG) {
				this._handleAddCOFOG = sap.ui.xmlfragment("zsap.com.r3.cobi.s4.gestposfin.view.fragment.AddCOFOG", this);
				this.getView().addDependent(this._handleAddCOFOG);
			}
			this._handleAddCOFOG.open();
		},


		initData: function () {

			//sap.ui.core.BusyIndicator.show();		
			var sapHanaS2Tipologiche = this.getView().getModel("sapHanaS2Tipologiche");

			var scpDeferredGroups = sapHanaS2Tipologiche.getDeferredGroups();
			scpDeferredGroups = scpDeferredGroups.concat(["scpGroup"]);
			sapHanaS2Tipologiche.setDeferredGroups(scpDeferredGroups);
			var that = this;
			var entityArray = [
				"/ZES_AMMINISTRAZIONE_SET",
				"/ZES_PROGRAMMA_SET",
				"/ZES_CATEGORIA_SET",
				"/ZES_AZIONE_SET",
				"/ZES_MISSIONE_SET",
				"/ZES_ECONOMICA2_SET",
				"/ZES_ECONOMICA3_SET" /*,
				"/ZES_PG_SET",
				"/ZES_CAPITOLO_SET"*/			
			];
			
			for (var i=0; i<entityArray.length; i++) {
				var entity = entityArray[i];
				var urlParam = {};
				sapHanaS2Tipologiche.read(entity,	  {groupId: "scpGroup", urlParameters: urlParam });
        	}
        	
			

			sapHanaS2Tipologiche.submitChanges({
				success: function (batchCallRel) {
					var errore = false;
					for (var j = 0; batchCallRel.__batchResponses && j < batchCallRel.__batchResponses.length; j++) {
						if (batchCallRel.__batchResponses[j].statusCode === "200") {
							var propertyToSave = this[j];				
							that.getView().getModel("modelPosFin").setProperty(propertyToSave, batchCallRel.__batchResponses[j].data.results);
							
						} 
					}
					if(errore){
							sap.ui.core.BusyIndicator.hide();
							MessageBox.error("Errore recupero di alcune entities");
							return;
					}
					sap.ui.core.BusyIndicator.hide();
				}.bind(entityArray),
				error: function (oError) {
					sap.ui.core.BusyIndicator.hide();
					MessageBox.error(that.getView().getModel("i18n").getResourceBundle().getText("errorChiamataBatchInit"));
					return;
				}.bind(entityArray)
			});

		},
		navToDetail: function(oEvent){
			var table = this.getView().byId("idTableRisultatiRicerca");
			var context = table.getSelectedContexts();

			if(context.length === 0){
				MessageBox.warning("Seleziona Prima una Posizione");
				return;
			}
			var posizione = context[0].getObject();

			this.getView().getModel("modelPosFin").setProperty("/selectedPosFin", posizione);
			this.onGestisciPosFin();
		},
		onNavTo: function () {		
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("DetailPosFin");
					
		},
		onReset: function () {
			let modelFilterHome = this.getView().getModel("modelFilterHome");
			let modelHome = this.getView().getModel("modelPosFin");

			//reset Filtri
			modelFilterHome.setProperty("/FieldPosEnabled", false)
			modelFilterHome.setProperty("/PosizioneFinanziaria", "")
			modelFilterHome.setProperty("/Sottostrumento", "")
			modelFilterHome.setProperty("/infoSottoStrumento", {})

			//Pulizia Tabella
			modelHome.setProperty("/tablePosFin", [])

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
					let oModel = this.getView().getModel("sapHanaS2");
					let modelHome = this.getView().getModel("modelPosFin")
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
		onPressConfSottoStrumento: function (oEvent) {
			this.onSearchSottostrumento()
		},
		onPressAvvio: function() {
			let modelHome = this.getView().getModel("modelPosFin");
			modelHome.setProperty("/tablePosFin", modelHome.getProperty("/elencoPosFin"))

		},
		__resetFiltri: function (aResetKeyValue) {
			let modelHome = this.getView().getModel("modelPosFin");
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
		onResetVHSstr: function (oEvent) {
			if(oEvent.getSource().getCustomData().length){
				this.__resetFiltri(oEvent.getSource().getCustomData())
			}
		},
		onNavBackHome: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("");
		}
	});
});