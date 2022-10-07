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

	return BaseController.extend("zsap.com.r3.cobi.s4.comaccigb.controller.HomePosFin", {


		/**
		 * @override
		 */
		onInit: async function() {
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.getRoute("HomePosFin").attachPatternMatched(this._onObjectMatched, this);
		//	this.handleCreateInizialFilter();
			//this.initData();
		},
		_onObjectMatched: async function (oEvent) {
			this.getView().setBusy(true)
			this.getOwnerComponent().setModel(new JSONModel({faseRicerca: true, infoSottoStrumento: {}}),"modelPosFin")
			this.getOwnerComponent().setModel(new JSONModel({FieldPosEnabled: true, Esercizio:(new Date(new Date().setFullYear(new Date().getFullYear() + 1))).getFullYear().toString()}),"modelFilterHome")
			// this.getView().getModel("modelPosFin").setProperty("/onAvvio",false
			this.getOwnerComponent().getModel("modelPosFin").setProperty("/initialDetail",true)
			this.getOwnerComponent().getModel("modelPosFin").setProperty("/form",{})
			this.getOwnerComponent().getModel("modelPosFin").setProperty("/formPosFin",{
				amministrazioni: [],
				capitoli: [],
				pg: []
			})
			this.getOwnerComponent().getModel("modelPosFin").setProperty("/adatta_filtri", {})
			this.getOwnerComponent().getModel("modelPosFin").setProperty("/posFinHelp", {})
			this.getOwnerComponent().getModel("modelPosFin").setProperty("/tablePosFin", [])
			this.getOwnerComponent().getModel("modelPosFin").setProperty("/elencoPosFin", [])
			const oKeySStr = oEvent.getParameter("arguments")
			let sAnnoFase = await this.__getAnnoFase();
			this.__getSottoStrumento(oKeySStr, sAnnoFase);
		},
		__getSottoStrumento(oKeySStr, sAnnoFase){
			//const oModel = this.getOwnerComponent().getModel("sapHanaS2");
			 var serviceUrl = "/sap/opu/odata/sap/ZSS4_COBI_ALV_SRV/";
			 //var serviceUrl = "/sap/opu/odata/sap/ZSS4_COBI_ACCANTONAM_FORM_SRV/";
			 //platformization end
			 var oModel = new sap.ui.model.odata.v2.ODataModel(serviceUrl);
			oModel.read("/SottostrumentoSet",{
				filters: [
					new Filter("Fikrs", FilterOperator.EQ, oKeySStr.Fikrs),
					new Filter("CodiceStrumento", FilterOperator.EQ, oKeySStr.CodiceStrumento),
					new Filter("CodiceStrumentoOri", FilterOperator.EQ, oKeySStr.CodiceStrumentoOri),
					new Filter("CodiceSottostrumento", FilterOperator.EQ, oKeySStr.CodiceSottostrumento),
					new Filter("Datbis", FilterOperator.EQ, new Date(oKeySStr.Datbis))
				],
				urlParameters: {
					$expand: "DomInterno,DomAmministrazione,DomMissione,DomTitolo"
				},
				success: (oData, res) => {
					let modelPosFin = this.getView().getModel("modelPosFin")
					//modelPosFin.setProperty("/Sottostrumento", `${oData.results[0].DescrTipoSottostrumento} - ${oData.results[0].NumeroSottostrumento}`)
					modelPosFin.setProperty("/Sottostrumento", `${oData.results[0].FaseSstr} - ${oData.results[0].NumeroSstr}`)
					modelPosFin.setProperty("/infoSottoStrumento", oData.results[0])
					this.__getHVValue()
					this.__getHVAmministrazione(oModel, modelPosFin, oData.results[0].DomAmministrazione)
					this.getView().setBusy(false)
				},
				error: function (res) {
					this.getView().setBusy(false)
				}.bind(this)
			})
		},
		__getHVValue: function () {
			
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
		
		
		
		
		onPosFin: function () {
			if(!this.oDialogPosFin) {
				Fragment.load({
					name:"zsap.com.r3.cobi.s4.comaccigb.view.fragment.PosFinHelp",
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
					name:"zsap.com.r3.cobi.s4.comaccigb.view.fragment." + value,
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
			//homeModel.setProperty("/detailAnagrafica", homeModel.getProperty("/selectedPosFin"))
			homeModel.setProperty("/PosFin", homeModel.getProperty("/selectedPosFin"))
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
		
		
		  
		  
		onPressConfPosFin: function () {
			if(!this.oDialogTabPosFinanziaria) {
				Fragment.load({
					name:"zsap.com.r3.cobi.s4.comaccigb.view.fragment.TablePosizioneFinanziaria",
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
		onPressAvvio: function() {
			// let modelHome = this.getView().getModel("modelPosFin");
			this.getView().setBusy(true)
			let modelPosFin = this.getView().getModel("modelPosFin")
			const oModel = this.getView().getModel("sapHanaS2");
			let aFilters =  [new Filter("Fikrs", FilterOperator.EQ, "S001"),
							new Filter("Fase", FilterOperator.EQ, "DLB"),
							new Filter("Anno", FilterOperator.EQ, modelPosFin.getProperty("/infoSottoStrumento/AnnoSstr")),
							new Filter("Reale", FilterOperator.EQ, modelPosFin.getProperty("/infoSottoStrumento/Reale")),
							new Filter("Datbis", FilterOperator.GE, new Date()),
							new Filter("Eos", FilterOperator.EQ, "S")
							]
			//Se non sono stati valorizzati i filtri, creazione dei filtri in base al Dominio del sottostrumento
			let oAdattaFiltri = modelPosFin.getProperty("/adatta_filtri/")
			
			if(!(modelPosFin.getProperty("/posFinHelp/posFin/Fipex") || Object.values(oAdattaFiltri).find(item => !(item === undefined || item === null || item === "" )))) {
				aFilters = this.__setDomSStrFilters(aFilters)
			}
			//Se sono stati valorizzati gli adatta filtri
			if( Object.values(oAdattaFiltri).find(item => !(item === undefined || item === null || item === "" )))
				aFilters = this.__setFiltersHVPosFin(oAdattaFiltri)
			//Filtro Posizione Finanziaria
			if(modelPosFin.getProperty("/posFinHelp/posFin/Fipex")) {
				aFilters.push(new Filter("Fipex", FilterOperator.EQ, modelPosFin.getProperty("/posFinHelp/posFin/Fipex")))
				aFilters.push(new Filter("Versione", FilterOperator.EQ, modelPosFin.getProperty("/posFinHelp/posFin/Versione")))
			}
			oModel.read("/PosizioneFinanziariaSet", {
				filters: aFilters,
				success: (oData) => {
					// oData.results = oData.results.filter((arr, index, self) =>
					// 					index === self.findIndex((t) => (t.Fipex === arr.Fipex)))
					modelPosFin.setProperty("/tablePosFin", oData.results)
					this.getView().setBusy(false)
				},
				error:  (err) => {
					this.getView().setBusy(false)
				}
			})
			//modelHome.setProperty("/tablePosFin", modelHome.getProperty("/elencoPosFin"))

		},
		onNavBackHome: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("");
		},
		onHVAdattaFiltri: function (oEvent) {
			let modelPosFin = this.getOwnerComponent().getModel("modelPosFin")
			let {key, value} = oEvent.getSource().getCustomData()[0].mProperties
			modelPosFin.setProperty("/action_filtri", key)
			this.__getDataForHV(value, key) //estrae i dati filtrati nel caso ci siano selezioni di attributi padre
			Fragment.load({
				name:"zsap.com.r3.cobi.s4.comaccigb.view.fragment.HVPosFin." + value,
				controller: this
			}).then(oDialog => {
				this[value] = oDialog
				this.getView().addDependent(oDialog);
				this[value].open()
			})
		},
		onCloseHVPosFin: function (oEvent) {
			oEvent.getSource().getParent().close()
		},
		__getDataForHV: function (sHV, sProperty) {
			let modelPosFin = this.getOwnerComponent().getModel("modelPosFin")
			let modelHana = this.getOwnerComponent().getModel("sapHanaS2")

			/* var serviceUrl = appUrl + "/sap/opu/odata/sap/ZSS4_COBI_ALV_SRV/";			
			var modelHana = new sap.ui.model.odata.v2.ODataModel(serviceUrl); */

			let aFilters = [new Filter("Fikrs", FilterOperator.EQ, "S001"),
							new Filter("Fase", FilterOperator.EQ, "DLB"),
							new Filter("Anno", FilterOperator.EQ, modelPosFin.getProperty("/infoSottoStrumento/AnnoSstr")),
							new Filter("Reale", FilterOperator.EQ, modelPosFin.getProperty("/infoSottoStrumento/Reale"))
							]
			switch (sHV) {
				case "HVCapitolo":
					aFilters.push(new Filter("Eos", FilterOperator.EQ, "S"))
					if(modelPosFin.getProperty("/" + sProperty + "/Prctr")){
						aFilters.push(new Filter("Prctr", FilterOperator.EQ, modelPosFin.getProperty("/" + sProperty + "/Prctr")))
					} else {
						if(modelPosFin.getProperty("/infoSottoStrumento/DomAmministrazione/results").length > 0)
							aFilters.push(this.__getFiltersOR(modelPosFin.getProperty("/infoSottoStrumento/DomAmministrazione/results"), "Prctr"))
					}
					modelHana.read("/TipCapitoloSet", {
						filters: aFilters,
						success: function (oData) {
							modelPosFin.setProperty("/formPosFin/capitoli", function() {
								let aCapitoli = []
								
								for(let i = 0; i < oData.results.length; i++){
										if(!aCapitoli.find(item => (item.Prctr === oData.results[i].Prctr && item.Capitolo === oData.results[i].Capitolo)))
											aCapitoli.push(oData.results[i])
								}
								return aCapitoli
							}())
						}
					})
					break;
				case "HVPgChoice":
					aFilters.push(new Filter("Eos", FilterOperator.EQ, "S"))
					if(modelPosFin.getProperty("/" + sProperty + "/Capitolo")){
						aFilters.push(new Filter("Capitolo", FilterOperator.EQ, modelPosFin.getProperty("/" + sProperty + "/Capitolo")))
					}
					if(modelPosFin.getProperty("/" + sProperty + "/Prctr")){
						aFilters.push(new Filter("Prctr", FilterOperator.EQ, modelPosFin.getProperty("/" + sProperty + "/Prctr")))
					} else {
						if(modelPosFin.getProperty("/infoSottoStrumento/DomAmministrazione/results").length > 0)
							aFilters.push(this.__getFiltersOR(modelPosFin.getProperty("/infoSottoStrumento/DomAmministrazione/results"), "Prctr"))
					}
					modelHana.read("/TipCapitoloSet", {
						filters: aFilters,
						success: function (oData) {
							modelPosFin.setProperty("/formPosFin/pg", oData.results)
						}
					})
					break;
				case "HVCdr":
					if(modelPosFin.getProperty("/" + sProperty + "/Prctr")){
						aFilters.push(new Filter("Prctr", FilterOperator.EQ, modelPosFin.getProperty("/" + sProperty + "/Prctr")))
					} else {
						if(modelPosFin.getProperty("/infoSottoStrumento/DomAmministrazione/results").length > 0)
							aFilters.push(this.__getFiltersOR(modelPosFin.getProperty("/infoSottoStrumento/DomAmministrazione/results"), "Prctr"))
					}
					modelHana.read("/TipAmministrazioneSet",{
						filters: aFilters,
						urlParameters: {
							$expand: "TipCdr"
						},
						success: (oData) => {
							//debugger
							modelPosFin.setProperty("/formPosFin/cdr", function() {
								let aCdr = []
								if(oData.results.length === 1) {
									for(let i = 0; i <  oData.results.length; i++){
										aCdr.push(...oData.results[i].TipCdr.results)
									}
								} else {
									for(let i = 0; i < oData.results.length; i++){
										aCdr.push(...oData.results[i].TipCdr.results)
									}
								}
								return aCdr
							}())
						},
						error:  (err) => {
							//debugger
						}
					})
					break
				case "HVRagioneria":
					if(modelPosFin.getProperty("/" + sProperty + "/Prctr")){
						aFilters.push(new Filter("Prctr", FilterOperator.EQ, modelPosFin.getProperty("/" + sProperty + "/Prctr")))
					} else {
						if(modelPosFin.getProperty("/infoSottoStrumento/DomAmministrazione/results").length > 0)
							aFilters.push(this.__getFiltersOR(modelPosFin.getProperty("/infoSottoStrumento/DomAmministrazione/results"), "Prctr"))
					}
					modelHana.read("/RelazioneAmminRagioneriaSet", {
						filters: aFilters,
						success: (oData) => {
							modelPosFin.setProperty("/formPosFin/ragionerie", oData.results)
						}
					})
					break
				case "HVMissione":
					if(modelPosFin.getProperty("/infoSottoStrumento/DomMissione/results").length > 0) {
						aFilters.push(this.__setMultiFiltersMissione(modelPosFin.getProperty("/infoSottoStrumento/DomMissione/results"), ["Missione", "Programma", "Azione", "Prctr"]))
					}
					if(modelPosFin.getProperty("/infoSottoStrumento/DomAmministrazione/results").length > 0)
						aFilters.push(this.__getFiltersOR(modelPosFin.getProperty("/infoSottoStrumento/DomAmministrazione/results"), "Prctr"))
					modelHana.read("/TipMissioneSet",{
						filters: aFilters,
						success:  (oData) => {
							modelPosFin.setProperty("/formPosFin/missioni", function() {
								let aMissioni = []
									for(let i = 0; i <  oData.results.length; i++){
											if(!aMissioni.find(item => (item.Missione === oData.results[i].Missione)))
												aMissioni.push(oData.results[i])
									}
								return aMissioni
							}())
						}
					})
					break
				case "HVProgramma":
					if(modelPosFin.getProperty("/" + sProperty + "/Prctr")) {
						aFilters.push(new Filter("Prctr", FilterOperator.EQ, modelPosFin.getProperty("/" + sProperty + "/Prctr")))
					} else {
						if(modelPosFin.getProperty("/infoSottoStrumento/DomAmministrazione/results").length > 0) { //filtra per amministrazioni del dominio, se non è stata selezionata un'amministrazione
							aFilters.push(this.__getFiltersOR(modelPosFin.getProperty("/infoSottoStrumento/DomAmministrazione/results"), "Prctr"))
						}
					}
					if(modelPosFin.getProperty("/" + sProperty + "/Missione")) {
						aFilters.push(new Filter("Missione", FilterOperator.EQ, modelPosFin.getProperty("/" + sProperty + "/Missione")))
					} else {
						if(modelPosFin.getProperty("/infoSottoStrumento/DomMissione/results").length > 0) {
							aFilters.push(this.__setMultiFiltersMissione(modelPosFin.getProperty("/infoSottoStrumento/DomMissione/results"), ["Missione", "Programma", "Prctr"]))
						}
					}
					modelHana.read("/TipMissioneSet",{
						filters: aFilters,
						success:  (oData) => {
							modelPosFin.setProperty("/formPosFin/programmi", function() {
								let aProgrammi = []
									for(let i = 0; i <  oData.results.length; i++){
										if(aProgrammi.filter(item => (item.Missione === oData.results[i].Missione &&
											item.Programma === oData.results[i].Programma)).length === 0)
												aProgrammi.push(oData.results[i])
									}
								return aProgrammi
							}())
						}
					})
					break
				case "HVAzione":
					//se si apre help value di Programma, controllare che sia stato valorizzata Missione e filtrare per tale valore
					if(modelPosFin.getProperty("/" + sProperty + "/Prctr")) { // Filtro amministrazione se è stato già selezionato
						aFilters.push(new Filter("Prctr", FilterOperator.EQ, modelPosFin.getProperty("/" + sProperty + "/Prctr")))
					} else {
						if(modelPosFin.getProperty("/infoSottoStrumento/DomAmministrazione/results").length > 0) { //filtra per amministrazioni del dominio, se non è stata selezionata un'amministrazione
							aFilters.push(this.__getFiltersOR(modelPosFin.getProperty("/infoSottoStrumento/DomAmministrazione/results"), "Prctr"))
						}
					}
					if(modelPosFin.getProperty("/" + sProperty + "/Programma")) {
						aFilters.push(new Filter("Programma", FilterOperator.EQ, modelPosFin.getProperty("/" + sProperty + "/Programma")))
					} 
					if(modelPosFin.getProperty("/" + sProperty + "/Missione")) {
						aFilters.push(new Filter("Missione", FilterOperator.EQ, modelPosFin.getProperty("/" + sProperty + "/Missione")))
					} else {
						if(modelPosFin.getProperty("/infoSottoStrumento/DomMissione/results").length > 0) {
							aFilters.push(this.__setMultiFiltersMissione(modelPosFin.getProperty("/infoSottoStrumento/DomMissione/results"), ["Missione", "Programma", "Azione"]))
						}
					}
					modelHana.read("/TipMissioneSet",{
						filters: aFilters,
						success: (oData) => {
							modelPosFin.setProperty("/formPosFin/azioni", oData.results)	
						},
						error:  (err) => {}
					})
				break
				case "HVTitolo":
					// aFilters.push(new Filter("Eos", FilterOperator.EQ, "S"))
					if(modelPosFin.getProperty("/infoSottoStrumento/DomTitolo/results").length > 0) {
						aFilters.push(this.__setMultiFiltersMissione(modelPosFin.getProperty("/infoSottoStrumento/DomTitolo/results"), ["Titolo", "Categoria", "Ce2", "Ce3"]))
					}
					modelHana.read("/TipTitoloSet",{
						filters: aFilters,
						success: (oData, res) => {
							modelPosFin.setProperty("/formPosFin/titoli", function() {
								let aTitoli = []
								for(let i = 0; i < oData.results.length; i++)
									if(!aTitoli.find(item => item.Titolo === oData.results[i].Titolo) )
										aTitoli.push(oData.results[i])
								
								return aTitoli
							}())
						}
					})
					break
				case "HVCategoria":
					// aFilters.push(new Filter("Eos", FilterOperator.EQ, "S"))
					if(modelPosFin.getProperty("/" + sProperty + "/Titolo")) {
						aFilters.push(new Filter("Titolo", FilterOperator.EQ, modelPosFin.getProperty("/" + sProperty + "/Titolo")))
					} else {
						aFilters.push(this.__setMultiFiltersMissione(modelPosFin.getProperty("/infoSottoStrumento/DomTitolo/results"), ["Titolo", "Categoria", "Ce2", "Ce3"]))
					}
					modelHana.read("/TipTitoloSet",{
						filters: aFilters,
						success: (oData) => {
							//debugger
							modelPosFin.setProperty("/formPosFin/categorie", function() {
								let aCategoria = []
								for(let i = 0; i < oData.results.length; i++)
									if(aCategoria.filter(item => item.Titolo === oData.results[i].Titolo &&
										item.Categoria === oData.results[i].Categoria).length === 0 )
										aCategoria.push(oData.results[i])
									
								return aCategoria
							}())
						}
					})
					break
				case "HVCe2" :
					if(modelPosFin.getProperty("/" + sProperty + "/Titolo")) {
						aFilters.push(new Filter("Titolo", FilterOperator.EQ, modelPosFin.getProperty("/" + sProperty + "/Titolo")))
					} 
					if(modelPosFin.getProperty("/" + sProperty + "/Categoria")) {
						aFilters.push(new Filter("Categoria", FilterOperator.EQ, modelPosFin.getProperty("/" + sProperty + "/Categoria")))
					} 
					if(!(modelPosFin.getProperty("/" + sProperty + "/Categoria") && modelPosFin.getProperty("/" + sProperty + "/Titolo"))){
						if(modelPosFin.getProperty("/infoSottoStrumento/DomTitolo/results").length > 0)
							aFilters.push(this.__setMultiFiltersMissione(modelPosFin.getProperty("/infoSottoStrumento/DomTitolo/results"), ["Titolo", "Categoria", "Ce2", "Ce3"]))
					}
					modelHana.read("/TipTitoloSet",{
						filters: aFilters,
						success: (oData) => {
							//debugger
							modelPosFin.setProperty("/formPosFin/ce2", function() {
								let aCe2 = []
								for(let i = 0; i < oData.results.length; i++)
									
									if(aCe2.filter(item => item.Titolo === oData.results[i].Titolo &&
										item.Categoria === oData.results[i].Categoria &&
										item.Ce2 === oData.results[i].Ce2).length === 0 )
										aCe2.push(oData.results[i])
									
								return aCe2
							}())
						},
						error:  (err) => {
							//debugger
						}
					})
					break
				case "HVCe3":
					if(modelPosFin.getProperty("/" + sProperty + "/Titolo")) {
						aFilters.push(new Filter("Titolo", FilterOperator.EQ, modelPosFin.getProperty("/" + sProperty + "/Titolo")))
					} 
					if(modelPosFin.getProperty("/" + sProperty + "/Categoria")) {
						aFilters.push(new Filter("Categoria", FilterOperator.EQ, modelPosFin.getProperty("/" + sProperty + "/Categoria")))
					} 
					if(modelPosFin.getProperty("/" + sProperty + "/Ce2")) {
						aFilters.push(new Filter("Ce2", FilterOperator.EQ, modelPosFin.getProperty("/" + sProperty + "/Ce2")))
					}
					if(!(modelPosFin.getProperty("/" + sProperty + "/Categoria") && modelPosFin.getProperty("/" + sProperty + "/Titolo") && modelPosFin.getProperty("/" + sProperty + "/Ce2"))){
						if(modelPosFin.getProperty("/infoSottoStrumento/DomTitolo/results").length > 0)
							aFilters.push(this.__setMultiFiltersMissione(modelPosFin.getProperty("/infoSottoStrumento/DomTitolo/results"), ["Titolo", "Categoria", "Ce2", "Ce3"]))
					}
					modelHana.read("/TipTitoloSet",{
						filters: aFilters,
						success: (oData) => {
							//debugger
							modelPosFin.setProperty("/formPosFin/ce3", oData.results)
						}
					})
					break
				default:
					break;
			}
		},

		getAmmDescEstesa: function (Prctr) {
			let modelPosFin = this.getOwnerComponent().getModel("modelPosFin")
			let aAmministrazioni = modelPosFin.getProperty("/formPosFin/amministrazioni")
			return aAmministrazioni.filter(amm => amm.Prctr === Prctr)[0].DescEstesa
		},
				
		onConfirmSelectionPosFin: function (oEvent) {
			let {_, value} = oEvent.getSource().getCustomData()[0].mProperties
			let modelPosFin = this.getOwnerComponent().getModel("modelPosFin")
			let sAction = modelPosFin.getProperty("/action_filtri")
		
			let sPath, aAmministrazioni
			switch (value) {
				case "Amministrazione":
					sPath = oEvent.getSource().getParent().getContent()[0].getSelectedContextPaths()
					//check se sono stati selezionati figli; in caso di amministrazione non combaciante, resettare input
					if(modelPosFin.getProperty(sPath + "/Prctr") !== modelPosFin.getProperty("/" + sAction + "/Prctr")) {
						modelPosFin.setProperty("/" + sAction + "/CapitoloDesc", null)
						modelPosFin.setProperty("/" + sAction + "/Capitolo", null)
						modelPosFin.setProperty("/" + sAction + "/PgDesc", null)
						modelPosFin.setProperty("/" + sAction + "/Pg", null)
						modelPosFin.setProperty("/" + sAction + "/CdrDesc", null)
						modelPosFin.setProperty("/" + sAction + "/Cdr", null)
					}
					if(sAction === "adatta_filtri")
						modelPosFin.setProperty( "/" + sAction + "/AmministrazioneDesc", modelPosFin.getProperty(sPath + "/Prctr") + "-" +  modelPosFin.getProperty(sPath + "/DescEstesa"))
					else 
						modelPosFin.setProperty( "/" + sAction + "/AmministrazioneDesc", modelPosFin.getProperty(sPath + "/DescEstesa"))
					modelPosFin.setProperty( "/" + sAction + "/Prctr", modelPosFin.getProperty(sPath + "/Prctr"))

					break;
				case "Capitolo":
					sPath = oEvent.getSource().getParent().getContent()[0].getSelectedContextPaths()
					//check se sono stati selezionati figli; in caso di capitolo non combaciante, resettare input
					if(modelPosFin.getProperty(sPath[0] + "/Capitolo") !== modelPosFin.getProperty("/" + sAction + "/Capitolo")) {
						modelPosFin.setProperty("/" + sAction + "/PgDesc", null)
						modelPosFin.setProperty("/" + sAction + "/Pg", null)
					}
					aAmministrazioni = modelPosFin.getProperty("/formPosFin/amministrazioni")
					let oCapitolo = modelPosFin.getProperty(sPath[0])
					if(sAction === "adatta_filtri") {
						modelPosFin.setProperty("/" + sAction + "/CapitoloDesc", modelPosFin.getProperty(sPath[0] + "/Capitolo") + "-" + modelPosFin.getProperty(sPath[0] + "/DescEstesaCapitolo"))
						modelPosFin.setProperty("/" + sAction + "/AmministrazioneDesc", aAmministrazioni.filter(amm => amm.Prctr === oCapitolo.Prctr)[0].Prctr + "-" +  aAmministrazioni.filter(amm => amm.Prctr === oCapitolo.Prctr)[0].DescEstesa)
					} else {
						modelPosFin.setProperty("/" + sAction + "/CapitoloDesc",  modelPosFin.getProperty(sPath[0] + "/DescEstesaCapitolo"))
						modelPosFin.setProperty("/" + sAction + "/AmministrazioneDesc",  aAmministrazioni.filter(amm => amm.Prctr === oCapitolo.Prctr)[0].DescEstesa)
					}
					modelPosFin.setProperty("/" + sAction + "/Capitolo", modelPosFin.getProperty(sPath[0] + "/Capitolo"))
					modelPosFin.setProperty("/" + sAction + "/Prctr",aAmministrazioni.filter(amm => amm.Prctr === oCapitolo.Prctr)[0].Prctr)
					break
				case "Pg":
					sPath = oEvent.getSource().getParent().getContent()[0].getSelectedContextPaths()
					aAmministrazioni = modelPosFin.getProperty("/formPosFin/amministrazioni")
					let oPg = modelPosFin.getProperty(sPath[0])
					if(sAction === "adatta_filtri") {
						modelPosFin.setProperty("/" + sAction + "/PgDesc", modelPosFin.getProperty(sPath[0] + "/Pg") + "-" +  modelPosFin.getProperty(sPath[0] + "/DescEstesaPg"))
						modelPosFin.setProperty("/" + sAction + "/CapitoloDesc", modelPosFin.getProperty(sPath[0] + "/Capitolo") + "-" + modelPosFin.getProperty(sPath[0] + "/DescEstesaCapitolo"))
						modelPosFin.setProperty("/" + sAction + "/AmministrazioneDesc", aAmministrazioni.filter(amm => amm.Prctr === oPg.Prctr)[0].Prctr + "-" +  aAmministrazioni.filter(amm => amm.Prctr === oPg.Prctr)[0].DescEstesa)
					} else {
						modelPosFin.setProperty("/" + sAction + "/PgDesc",  modelPosFin.getProperty(sPath[0] + "/DescEstesaPg"))
						modelPosFin.setProperty("/" + sAction + "/CapitoloDesc", modelPosFin.getProperty(sPath[0] + "/DescEstesaCapitolo"))
						modelPosFin.setProperty("/" + sAction + "/AmministrazioneDesc", aAmministrazioni.filter(amm => amm.Prctr === oPg.Prctr)[0].DescEstesa)
					}
					modelPosFin.setProperty("/" + sAction + "/Pg", modelPosFin.getProperty(sPath[0] + "/Pg"))
					modelPosFin.setProperty("/" + sAction + "/Capitolo", modelPosFin.getProperty(sPath[0] + "/Capitolo"))
					modelPosFin.setProperty("/" + sAction + "/Prctr",aAmministrazioni.filter(amm => amm.Prctr === oPg.Prctr)[0].Prctr)
					break
				case "Cdr":
					sPath = oEvent.getSource().getParent().getContent()[0].getSelectedContextPaths()
					aAmministrazioni = modelPosFin.getProperty("/formPosFin/amministrazioni")
					let oCdr = modelPosFin.getProperty(sPath[0])
					if(sAction === "adatta_filtri") {
						modelPosFin.setProperty( "/" + sAction +  "/CdrDesc", modelPosFin.getProperty(sPath[0] + "/Cdr") + "-" + modelPosFin.getProperty(sPath[0] + "/DescEstesaCdr"))
						modelPosFin.setProperty("/" + sAction + "/AmministrazioneDesc", aAmministrazioni.filter(amm => amm.Prctr === oCdr.Prctr)[0].Prctr + "-" +  aAmministrazioni.filter(amm => amm.Prctr === oCdr.Prctr)[0].DescEstesa)
					} else {
						modelPosFin.setProperty( "/" + sAction +  "/CdrDesc", modelPosFin.getProperty(sPath[0] + "/DescEstesaCdr"))
						modelPosFin.setProperty("/" + sAction + "/AmministrazioneDesc", aAmministrazioni.filter(amm => amm.Prctr === oCdr.Prctr)[0].DescEstesa)
					}
					modelPosFin.setProperty("/" + sAction +  "/Cdr", modelPosFin.getProperty(sPath[0] + "/Cdr"))
					modelPosFin.setProperty("/" + sAction + "/Prctr",aAmministrazioni.filter(amm => amm.Prctr === oCdr.Prctr)[0].Prctr)
					break
				case "Ragioneria":
					sPath = oEvent.getSource().getParent().getContent()[0].getSelectedContextPaths()
					
					if(sAction === "adatta_filtri") {
						modelPosFin.setProperty("/" + sAction +  "/RagioneriaDesc",modelPosFin.getProperty(sPath[0]  + "/Ragioneria") + "-" + modelPosFin.getProperty(sPath[0]  + "/DescrEstesaRagioneria"))
						modelPosFin.setProperty("/" + sAction + "/AmministrazioneDesc", modelPosFin.getProperty(sPath[0]  + "/Prctr")  + "-" +  modelPosFin.getProperty(sPath[0]  + "/DescrEstesaAmmin"))
					} else {
						modelPosFin.setProperty("/" + sAction +  "/RagioneriaDesc", modelPosFin.getProperty(sPath[0]  + "/DescrEstesaRagioneria"))
						modelPosFin.setProperty("/" + sAction + "/AmministrazioneDesc", modelPosFin.getProperty(sPath[0]  + "/DescrEstesaAmmin"))
					}
					modelPosFin.setProperty("/" + sAction + "/Ragioneria", modelPosFin.getProperty(sPath[0]  + "/Ragioneria"))
					modelPosFin.setProperty("/" + sAction + "/Prctr", modelPosFin.getProperty(sPath[0]  + "/Prctr"))
					break;
				case "Missione":
					sPath = oEvent.getSource().getParent().getContent()[0].getSelectedContextPaths()
					//check se sono stati selezionati figli; in caso di Missione non combaciante, resettare input
					if(modelPosFin.getProperty(sPath + "/Missione") !== modelPosFin.getProperty("/" + sAction +  "/Missione")) {
						modelPosFin.setProperty("/" + sAction +  "/ProgrammaDesc", null)
						modelPosFin.setProperty("/" + sAction +  "/Programma",null)
						modelPosFin.setProperty("/" + sAction +  "/Azione", null)
						modelPosFin.setProperty("/" + sAction +  "/AzioneDesc",null)
					}
					if(sAction === "adatta_filtri") {
						modelPosFin.setProperty("/" + sAction +  "/MissioneDesc", modelPosFin.getProperty(sPath + "/Missione") + "-" + modelPosFin.getProperty(sPath + "/DescEstesaMissione"))
					} else { 
						modelPosFin.setProperty("/" + sAction +  "/MissioneDesc",  modelPosFin.getProperty(sPath + "/DescEstesaMissione"))
					}
					modelPosFin.setProperty("/" + sAction +  "/Missione", modelPosFin.getProperty(sPath + "/Missione"))

					break;
				case "Programma":
					sPath = oEvent.getSource().getParent().getContent()[0].getSelectedContextPaths()
					//check se sono stati selezionati figli; in caso di amministrazione non combaciante, resettare input
					if(modelPosFin.getProperty(sPath + "/Programma") !== modelPosFin.getProperty("/" + sAction + "/Programma")) {
						modelPosFin.setProperty("/" + sAction + "/AzioneDesc", null)
						modelPosFin.setProperty("/" + sAction + "/Azione",null)
					}
					if(sAction === "adatta_filtri") {
						modelPosFin.setProperty("/" + sAction +  "/MissioneDesc", modelPosFin.getProperty(sPath[0] + "/Missione") + "-" + modelPosFin.getProperty(sPath[0] + "/DescEstesaMissione"))
						modelPosFin.setProperty("/" + sAction +  "/ProgrammaDesc", modelPosFin.getProperty(sPath[0] + "/Programma") + "-" + modelPosFin.getProperty(sPath[0] + "/DescEstesaProgramma"))
					} else {
						modelPosFin.setProperty("/" + sAction +  "/MissioneDesc",  modelPosFin.getProperty(sPath[0] + "/DescEstesaMissione"))
						modelPosFin.setProperty("/" + sAction +  "/ProgrammaDesc", modelPosFin.getProperty(sPath[0] + "/DescEstesaProgramma"))
					}
					modelPosFin.setProperty("/" + sAction +  "/Missione", modelPosFin.getProperty(sPath[0] + "/Missione"))
					modelPosFin.setProperty("/" + sAction +  "/Programma", modelPosFin.getProperty(sPath[0] + "/Programma"))
					break;
				case "Azione":
					sPath = oEvent.getSource().getParent().getContent()[0].getSelectedContextPaths()
					if(sAction === "adatta_filtri") {
						modelPosFin.setProperty("/" + sAction + "/AmministrazioneDesc", modelPosFin.getProperty(sPath[0] + "/Prctr") + "-" +modelPosFin.getProperty(sPath[0] + "/DescEstesaPrctr"))
						modelPosFin.setProperty("/" + sAction +  "/MissioneDesc", modelPosFin.getProperty(sPath[0] + "/Missione") + "-" + modelPosFin.getProperty(sPath[0] + "/DescEstesaMissione"))
						modelPosFin.setProperty("/" + sAction +  "/ProgrammaDesc",  modelPosFin.getProperty(sPath[0] + "/Programma") + "-" + modelPosFin.getProperty(sPath[0] + "/DescEstesaProgramma"))
						modelPosFin.setProperty("/" + sAction + "/AzioneDesc",modelPosFin.getProperty(sPath[0] + "/Azione") + "-" + modelPosFin.getProperty(sPath[0] + "/DescEstesaAzione"))
					} else {
						modelPosFin.setProperty("/" + sAction + "/AmministrazioneDesc", modelPosFin.getProperty(sPath[0] + "/DescEstesaPrctr"))
						modelPosFin.setProperty("/" + sAction +  "/MissioneDesc",  modelPosFin.getProperty(sPath[0] + "/DescEstesaMissione"))
						modelPosFin.setProperty("/" + sAction +  "/ProgrammaDesc",  modelPosFin.getProperty(sPath[0] + "/DescEstesaProgramma"))
						modelPosFin.setProperty("/" + sAction + "/AzioneDesc", modelPosFin.getProperty(sPath[0] + "/DescEstesaAzione"))
					}
					modelPosFin.setProperty("/" + sAction + "/Prctr", modelPosFin.getProperty(sPath[0] + "/Prctr"))
					modelPosFin.setProperty("/" + sAction +  "/Missione", modelPosFin.getProperty(sPath[0] + "/Missione"))
					modelPosFin.setProperty("/" + sAction +  "/Programma", modelPosFin.getProperty(sPath[0] + "/Programma"))
					modelPosFin.setProperty("/" + sAction + "/Azione", modelPosFin.getProperty(sPath[0] + "/Azione"))
					
					break;
				case "Titolo":
					sPath = oEvent.getSource().getParent().getContent()[0].getSelectedContextPaths()
					//check se sono stati selezionati figli; in caso di Missione non combaciante, resettare input
					if(modelPosFin.getProperty(sPath + "/Titolo") !== modelPosFin.getProperty("/" + sAction + "/Titolo")) {
						modelPosFin.setProperty("/" + sAction + "/Categoria", null)
						modelPosFin.setProperty("/" + sAction + "/CategoriaDesc",null)
						modelPosFin.setProperty("/" + sAction + "/Ce2", null)
						modelPosFin.setProperty("/" + sAction + "/Ce2Desc",null)
						modelPosFin.setProperty("/" + sAction + "/Ce3", null)
						modelPosFin.setProperty("/" + sAction + "/Ce3Desc",null)
					}
					if(sAction === "adatta_filtri") {
						modelPosFin.setProperty("/" + sAction + "/TitoloDesc", modelPosFin.getProperty(sPath + "/Titolo") + "-" + modelPosFin.getProperty(sPath + "/DescEstesaTitolo"))
					} else {
						modelPosFin.setProperty("/" + sAction + "/TitoloDesc", modelPosFin.getProperty(sPath + "/DescEstesaTitolo"))
					}
					modelPosFin.setProperty("/" + sAction + "/Titolo", modelPosFin.getProperty(sPath + "/Titolo"))

					break;
				case "Categoria":
					sPath = oEvent.getSource().getParent().getContent()[0].getSelectedContextPaths()
					//check se sono stati selezionati figli; in caso di Missione non combaciante, resettare input
					if(modelPosFin.getProperty(sPath[0] + "/Categoria") !== modelPosFin.getProperty("/" + sAction + "/Categoria")) {
						modelPosFin.setProperty("/" + sAction + "/Ce2", null)
						modelPosFin.setProperty("/" + sAction + "/Ce2Desc", null)
						modelPosFin.setProperty("/" + sAction + "/Ce3", null)
						modelPosFin.setProperty("/" + sAction + "/Ce3Desc",null)
					}
					if(sAction === "adatta_filtri") {
						modelPosFin.setProperty("/" + sAction + "/TitoloDesc", modelPosFin.getProperty(sPath[0] + "/Titolo") + "-" +  modelPosFin.getProperty(sPath[0]  + "/DescEstesaTitolo"))
						modelPosFin.setProperty("/" + sAction + "/CategoriaDesc",modelPosFin.getProperty(sPath[0]  + "/Categoria") + "-" +  modelPosFin.getProperty(sPath[0] + "/DescEstesaCategoria"))
					} else {
						modelPosFin.setProperty("/" + sAction + "/TitoloDesc", modelPosFin.getProperty(sPath[0]  + "/DescEstesaTitolo"))
						modelPosFin.setProperty("/" + sAction + "/CategoriaDesc", modelPosFin.getProperty(sPath[0] + "/DescEstesaCategoria"))
					}
					modelPosFin.setProperty("/" + sAction + "/Titolo", modelPosFin.getProperty(sPath[0] + "/Titolo"))
					modelPosFin.setProperty("/" + sAction + "/Categoria", modelPosFin.getProperty(sPath[0]  + "/Categoria"))

					break;
				case "Ce2":
					sPath = oEvent.getSource().getParent().getContent()[0].getSelectedContextPaths()
					//check se sono stati selezionati figli; in caso di Missione non combaciante, resettare input
					if(modelPosFin.getProperty(sPath[0] + "/Ce2") !== modelPosFin.getProperty("/" + sAction +  "/Ce2")) {
						modelPosFin.setProperty("/" + sAction + "/Ce3", null)
						modelPosFin.setProperty("/" + sAction + "/Ce3Desc",null)
					}
					if(sAction === "adatta_filtri") {
						modelPosFin.setProperty("/" + sAction + "/TitoloDesc", modelPosFin.getProperty(sPath[0] + "/Titolo") + "-" +  modelPosFin.getProperty(sPath[0]  + "/DescEstesaTitolo"))
						modelPosFin.setProperty("/" + sAction + "/CategoriaDesc",modelPosFin.getProperty(sPath[0]  + "/Categoria") + "-" +  modelPosFin.getProperty(sPath[0] + "/DescEstesaCategoria"))
						modelPosFin.setProperty("/" + sAction +  "/Ce2Desc", modelPosFin.getProperty(sPath[0]  + "/Ce2") + "-" +   modelPosFin.getProperty(sPath[0] + "/DescEstesaCe2"))
					} else {
						modelPosFin.setProperty("/" + sAction + "/TitoloDesc",  modelPosFin.getProperty(sPath[0]  + "/DescEstesaTitolo"))
						modelPosFin.setProperty("/" + sAction + "/CategoriaDesc", modelPosFin.getProperty(sPath[0] + "/DescEstesaCategoria"))
						modelPosFin.setProperty("/" + sAction +  "/Ce2Desc",  modelPosFin.getProperty(sPath[0] + "/DescEstesaCe2"))
					}
					modelPosFin.setProperty("/" + sAction + "/Titolo", modelPosFin.getProperty(sPath[0] + "/Titolo"))
					modelPosFin.setProperty("/" + sAction + "/Categoria", modelPosFin.getProperty(sPath[0]  + "/Categoria"))
					modelPosFin.setProperty("/" + sAction +  "/Ce2", modelPosFin.getProperty(sPath[0]  + "/Ce2"))

					break;
				case "Ce3":
					sPath = oEvent.getSource().getParent().getContent()[0].getSelectedContextPaths()
					if(sAction === "adatta_filtri") {
						modelPosFin.setProperty("/" + sAction + "/TitoloDesc", modelPosFin.getProperty(sPath[0] + "/Titolo") + "-" +  modelPosFin.getProperty(sPath[0]  + "/DescEstesaTitolo"))
						modelPosFin.setProperty("/" + sAction + "/CategoriaDesc",modelPosFin.getProperty(sPath[0]  + "/Categoria") + "-" +  modelPosFin.getProperty(sPath[0] + "/DescEstesaCategoria"))
						modelPosFin.setProperty("/" + sAction +  "/Ce2Desc", modelPosFin.getProperty(sPath[0]  + "/Ce2") + "-" +   modelPosFin.getProperty(sPath[0] + "/DescEstesaCe2"))
						modelPosFin.setProperty("/" + sAction +  "/Ce3Desc", modelPosFin.getProperty(sPath[0]  + "/Ce3") + "-" + modelPosFin.getProperty(sPath[0] + "/DescEstesaCe3"))
					} else {
						modelPosFin.setProperty("/" + sAction + "/TitoloDesc", modelPosFin.getProperty(sPath[0]  + "/DescEstesaTitolo"))
						modelPosFin.setProperty("/" + sAction + "/CategoriaDesc",  modelPosFin.getProperty(sPath[0] + "/DescEstesaCategoria"))
						modelPosFin.setProperty("/" + sAction +  "/Ce2Desc", modelPosFin.getProperty(sPath[0] + "/DescEstesaCe2"))
						modelPosFin.setProperty("/" + sAction +  "/Ce3Desc",  modelPosFin.getProperty(sPath[0] + "/DescEstesaCe3"))
					}
					modelPosFin.setProperty("/" + sAction + "/Titolo", modelPosFin.getProperty(sPath[0] + "/Titolo"))
					modelPosFin.setProperty("/" + sAction + "/Categoria", modelPosFin.getProperty(sPath[0]  + "/Categoria"))
					modelPosFin.setProperty("/" + sAction +  "/Ce2", modelPosFin.getProperty(sPath[0]  + "/Ce2"))
					modelPosFin.setProperty("/" + sAction +  "/Ce3", modelPosFin.getProperty(sPath[0]  + "/Ce3"))

					break;
				default:
					break;
				}
				oEvent.getSource().getParent().close()
		},
		onPressConfPosFin: function (oEvent) {
			let modelHana = this.getOwnerComponent().getModel("sapHanaS2")
			let modelPosFin = this.getOwnerComponent().getModel("modelPosFin")
			modelPosFin.setProperty("/tablePosFinBusy", true)
			let oFormPosf = modelPosFin.getProperty("/posFinHelp/")
			let aFilters = this.__setFiltersHVPosFin(oFormPosf)

			
			aFilters = this.__setDomSStrFilters(aFilters)
			
			if(!this.oDialogTablePosFin) {
				Fragment.load({
					name:"zsap.com.r3.cobi.s4.comaccigb.view.fragment.TablePosizioneFinanziaria",
					controller: this
				}).then(oDialog => {
					this.oDialogTablePosFin = oDialog;
					this.getView().addDependent(oDialog);
					this.oDialogTablePosFin.open();
				})
			} else {
				this.oDialogTablePosFin.open();
			}
			modelHana.read("/PosizioneFinanziariaSet",{
				filters: aFilters,
				success: (oData, res) => {
					modelPosFin.setProperty("/elencoPosFin", oData.results)
					modelPosFin.setProperty("/tablePosFinBusy", false)
				},
				error: (err) => {
					modelPosFin.setProperty("/tablePosFinBusy", false)
					modelPosFin.setProperty("/elencoPosFin", [])
				}
			})
			
		},
		__setFiltersHVPosFin: function (oFormPosf) {
			let modelPosFin = this.getOwnerComponent().getModel("modelPosFin")
			let aFilters = [new Filter("Fikrs", FilterOperator.EQ, "S001"),
							new Filter("Fase", FilterOperator.EQ, "DLB"),
							new Filter("Anno", FilterOperator.EQ, modelPosFin.getProperty("/infoSottoStrumento/AnnoSstr")),
							new Filter("Reale", FilterOperator.EQ, modelPosFin.getProperty("/infoSottoStrumento/Reale")),
							new Filter("Eos", FilterOperator.EQ, "S")
							]
			if(oFormPosf.Prctr)
				aFilters.push(new Filter("Prctr", FilterOperator.EQ, oFormPosf.Prctr))
			if(oFormPosf.Cdr)
				aFilters.push(new Filter("Cdr", FilterOperator.EQ, oFormPosf.Cdr))
			if(oFormPosf.Ragioneria)
				aFilters.push(new Filter("Ragioneria", FilterOperator.EQ, oFormPosf.Ragioneria))
			if(oFormPosf.Missione)
				aFilters.push(new Filter("Missione", FilterOperator.EQ, oFormPosf.Missione))
			if(oFormPosf.Programma)
				aFilters.push(new Filter("Programma", FilterOperator.EQ, oFormPosf.Programma))
			if(oFormPosf.Azione)
				aFilters.push(new Filter("Azione", FilterOperator.EQ, oFormPosf.Azione))
			if(oFormPosf.Capitolo)
				aFilters.push(new Filter("Capitolo", FilterOperator.EQ, oFormPosf.Capitolo))
			if(oFormPosf.Pg)
				aFilters.push(new Filter("Pg", FilterOperator.EQ, oFormPosf.Pg))
			if(oFormPosf.Titolo)
				aFilters.push(new Filter("Titolo", FilterOperator.EQ, oFormPosf.Titolo))
			if(oFormPosf.Categoria)
				aFilters.push(new Filter("Categoria", FilterOperator.EQ, oFormPosf.Categoria))
			if(oFormPosf.Ce2)
				aFilters.push(new Filter("Ce2", FilterOperator.EQ, oFormPosf.Ce2))
			if(oFormPosf.Ce3)
				aFilters.push(new Filter("Ce3", FilterOperator.EQ, oFormPosf.Ce3))
			if(oFormPosf.fipex)
				aFilters.push(new Filter("Fipex", FilterOperator.EQ, oFormPosf.fipex))
			return aFilters
		},
		onConfirmTablePosFin: function (oEvent) {
			const modelPosFin = this.getOwnerComponent().getModel("modelPosFin")
			const oSelectedPosFin = modelPosFin.getProperty(oEvent.getParameter("selectedItem").getBindingContextPath())
			modelPosFin.setProperty("/posFinHelp/posFin", oSelectedPosFin)
			modelPosFin.setProperty("/elencoPosFin", [])
			this.oDialogPosFin.close()
		},
		__setDomSStrFilters: function (aFilters) {
			const modelPosFin = this.getOwnerComponent().getModel("modelPosFin")
			if(modelPosFin.getProperty("/infoSottoStrumento/DomAmministrazione/results").length > 0) 
				aFilters.push(this.__setMultiFiltersMissione(modelPosFin.getProperty("/infoSottoStrumento/DomAmministrazione/results"), ["Prctr"]))
			
			if(modelPosFin.getProperty("/infoSottoStrumento/DomTitolo/results").length > 0)
				aFilters.push(this.__setMultiFiltersMissione(modelPosFin.getProperty("/infoSottoStrumento/DomTitolo/results"), ["Titolo", "Categoria", "Ce2", "Ce3"]))

			if(modelPosFin.getProperty("/infoSottoStrumento/DomMissione/results").length > 0) 
				aFilters.push(this.__setMultiFiltersMissione(modelPosFin.getProperty("/infoSottoStrumento/DomMissione/results"), ["Missione", "Programma", "Azione", "Prctr"]))
			
			return aFilters
		},
		onResetPosFinHelp: function (oEvent) {
			const modelPosFin = this.getOwnerComponent().getModel("modelPosFin")
			modelPosFin.setProperty("/posFinHelp", {})
			modelPosFin.setProperty("/elencoPosFin", [])
		}
		
		
	});
});