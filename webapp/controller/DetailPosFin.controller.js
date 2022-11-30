sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/Fragment",
	"sap/m/MessageBox",
	"sap/ui/core/routing/History",
	"./BaseController"
], function(Controller, JSONModel, Filter, FilterOperator, Fragment, MessageBox, History,BaseController) {
	"use strict";

	return BaseController.extend("zsap.com.r3.cobi.s4.comaccigb.controller.DetailPosFin", {
		/**
		 * @override
		 */
		onInit: async function() {
			let modelPosFin = this.getOwnerComponent().getModel("modelPosFin")
			modelPosFin.setProperty("/CompetenzaAuth", {Auth : null})
			modelPosFin.setProperty("/formCodingBlock", {checkedPercentAps: false, nuovaAuth: false})
			modelPosFin.setProperty("/formPosFin", {
				amministrazioni: [],
				capitoli: [],
				pg: [],
				cdr: [],
				missioni: [],
				programmi: [],
				azioni: [],
				titoli: [],
				categorie: [],
				ragionerie: [],
				mac: [],
				tipofondo: [],
				tipoSpesaCapitolo: [],
				tipoSpesaPG: [],
				codice_elenco: [],
				AreaInterventi: [],
				Noipa: []
			})
			modelPosFin.setProperty("/DominioSStr", {
				Amministrazione:[],
				Missione: [],
				Programma: [],
				Azione: [],
				Titolo: [],
				Categoria: [],
				Ce2: [],
				Ce3: []
			})
			modelPosFin.setProperty("/detailAnagrafica", {
				elencoCOFOG:[],
				elenchiCapitolo: [],
				lista_cofog: [],
				codice_elenco:[],
				PosizioneFinanziariaIrap: []
			})
			// this.__removeDuplicateDomSStr()
			// this.__getDataHVPosFin()
			
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.getRoute("DetailPosFin").attachPatternMatched(this._onObjectMatched, this);
		},
		onNavToHome: function () {		
			var oHistory = History.getInstance();
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("Home");			
					
		},
		_onObjectMatched: function (oEvent) {
			let modelPosFin = this.getOwnerComponent().getModel("modelPosFin")
			this.getView().setBusy(true);
			
				return new Promise( async function(resolve, reject) {
					let oPosFin = await this.__getPosFin()
					modelPosFin.setProperty("/posFin", oPosFin.Fipex)
					Promise.all([
								this.__getStrutturaAmminCentrale(oPosFin),
								this.__setFieldAmmin(oPosFin), 
								this.__setFieldCapPg(oPosFin), 
								this.__setFieldTitolo(oPosFin), 
								this.__setFieldMissione(oPosFin), 
								//this.__setFieldCdr(oPosFin),
								this.__setFieldRagioneria(oPosFin),
								this.__setFieldMac(oPosFin),
								this.__setFieldPosizioneFinanziariaIrap(oPosFin),
								this.__getHVMac(), 
								this.__getTipoFondo(), 
								this.__getHVCodiceStandard(), 
								this.__getHVAreaInterventi(),
								//this.__setCofog(oPosFin),
								//this.__setElenchi(oPosFin),
								//this.__getNOIPA()
							])
							.then(function(res){
								this.__setOtherFields(oPosFin)
								this.getView().setBusy(false)
							}.bind(this))
							.catch(err => {
								this.getView().setBusy(false)
								let oError = JSON.parse(err.responseText)
								MessageBox.error(oError.error.message.value)
							})
				}.bind(this))
			
			
		},

		__getPosFin: function () {
			let modelPosFin = this.getOwnerComponent().getModel("modelPosFin")
			let modelHana = this.getOwnerComponent().getModel("sapHanaS2")
			const oPosFin = modelPosFin.getProperty("/PosFin/")
			return new Promise( function(resolve, reject) {
				const sUrl = "/" + oPosFin.__metadata.uri.split("/")[oPosFin.__metadata.uri.split("/").length - 1]
				modelHana.read(sUrl, {
					success: (oData) => {
						debugger
						resolve(oData)
					},
					error: function (err) {
						debugger
						reject()
					}
				})
			})

		},

		__setCodeStandard: function (oCapitolo, sPath, sCodice, sEstesa, sRidotta) {
			let modelPosFin = this.getOwnerComponent().getModel("modelPosFin")
			let modelHana = this.getOwnerComponent().getModel("sapHanaS2")
			const aFilterCS = [new Filter("Fikrs", FilterOperator.EQ, "S001"),
								new Filter("Fase", FilterOperator.EQ, "DLB"),
								new Filter("Anno", FilterOperator.EQ, modelPosFin.getProperty("/infoSottoStrumento/AnnoSstr")),
								new Filter("Reale", FilterOperator.EQ, modelPosFin.getProperty("/infoSottoStrumento/Reale")),
								new Filter("CodiceStd", FilterOperator.EQ, oCapitolo[sPath])
							]
			return new Promise((resolve, reject) => {
				modelHana.read("/CodiceStandardSet", {
					filters: aFilterCS,
					success: (oData) => {
						if(oData.results.length > 0) {
							modelPosFin.setProperty("/detailAnagrafica/" + sCodice, oData.results[0].CodiceStd)
							modelPosFin.setProperty("/detailAnagrafica/" + sEstesa, oData.results[0].DescEstesa)
							modelPosFin.setProperty("/detailAnagrafica/" + sRidotta, oData.results[0].DescBreve)
							modelPosFin.updateBindings(true)
						}
						resolve()
					}
				})
			})
		},

		__setFieldAmmin: function (oPosFin) {
			let modelHana = this.getOwnerComponent().getModel("sapHanaS2")
			let modelPosFin = this.getOwnerComponent().getModel("modelPosFin")
			let aFiltersAmm = [new Filter("Fikrs", FilterOperator.EQ, "S001"),
								new Filter("Fase", FilterOperator.EQ, "DLB"),
								new Filter("Anno", FilterOperator.EQ, modelPosFin.getProperty("/infoSottoStrumento/AnnoSstr")),
								new Filter("Prctr", FilterOperator.EQ, oPosFin.Prctr)
							]
			return new Promise((resolve, reject) => {
				modelHana.read("/TipAmministrazioneSet", {
					filters: aFiltersAmm,
					success: (oData) => {
						if(oData.results.length > 0) {
							modelPosFin.setProperty("/detailAnagrafica/AMMINISTAZIONE", oData.results[0].Prctr)
							modelPosFin.setProperty("/detailAnagrafica/DESC_AMMINISTAZIONE", oData.results[0].DescEstesa)
						}
						resolve()
					}
				})
			})
		},

		__setFieldCapPg(oPosFin){
			let modelHana = this.getOwnerComponent().getModel("sapHanaS2")
			let modelPosFin = this.getOwnerComponent().getModel("modelPosFin")
			let aFiltersCapPg = [new Filter("Fikrs", FilterOperator.EQ, "S001"),
								new Filter("Fase", FilterOperator.EQ, "DLB"),
								new Filter("Anno", FilterOperator.EQ, modelPosFin.getProperty("/infoSottoStrumento/AnnoSstr")),
								new Filter("Capitolo", FilterOperator.EQ, oPosFin.Capitolo),
								new Filter("Prctr", FilterOperator.EQ, oPosFin.Prctr),
								new Filter("Pg", FilterOperator.EQ, oPosFin.Pg)
							]
			return new Promise((resolve, reject) => {
				modelHana.read("/TipCapitoloSet", {
					filters: aFiltersCapPg,
					success: async (oData) => {
						if(oData.results.length > 0) {
							modelPosFin.setProperty("/detailAnagrafica/pg", oData.results[0].Pg)
							modelPosFin.setProperty("/detailAnagrafica/CAPITOLO", oData.results[0].Capitolo)
							modelPosFin.setProperty("/detailAnagrafica/DESC_CAPITOLO", oData.results[0].DescEstesaCapitolo)
							modelPosFin.setProperty("/detailAnagrafica/DESC_PG", oData.results[0].DescEstesaPg)
							if( oData.results[0].CodiceStdPg !== "000") {
								await this.__setCodeStandard(oData.results[0], "CodiceStdPg", "CODICE_STANDARD_PG", "CD_PG_DEN_EST", "CD_PG_DEN_BREVE")
							} else {
								modelPosFin.setProperty("/detailAnagrafica/CD_PG_DEN_EST", oData.results[0].DescEstesaPg)
								modelPosFin.setProperty("/detailAnagrafica/CD_PG_DEN_BREVE", oData.results[0].DescBrevePg)
							}
							if( oData.results[0].CodiceStdCapitolo !== "000"){
								await this.__setCodeStandard(oData.results[0], "CodiceStdCapitolo", "CODICE_STANDARD_CAPITOLO", "CD_CAPITOLO_DEN_EST", "CD_CAPITOLO_DEN_BREVE")
							} else {
								modelPosFin.setProperty("/detailAnagrafica/CD_CAPITOLO_DEN_EST", oData.results[0].DescEstesaCapitolo)
								modelPosFin.setProperty("/detailAnagrafica/CD_CAPITOLO_DEN_BREVE", oData.results[0].DescBreveCapitolo)
							}
						}
						resolve()
					}
				})
			})
		},

		__setFieldTitolo: function (oPosFin) {
			const modelHana = this.getOwnerComponent().getModel("sapHanaS2")
			let modelPosFin = this.getOwnerComponent().getModel("modelPosFin")
			let filtersTitolo = [new Filter("Fikrs", FilterOperator.EQ, "S001"),
								new Filter("Fase", FilterOperator.EQ, "DLB"),
								new Filter("Anno", FilterOperator.EQ, modelPosFin.getProperty("/infoSottoStrumento/AnnoSstr")),
								new Filter("Reale", FilterOperator.EQ, modelPosFin.getProperty("/infoSottoStrumento/Reale")),
								new Filter("Titolo", FilterOperator.EQ, oPosFin.Titolo), 
								new Filter("Categoria", FilterOperator.EQ, oPosFin.Categoria),
								new Filter("Ce2", FilterOperator.EQ, oPosFin.Ce2),
								new Filter("Ce3", FilterOperator.EQ, oPosFin.Ce3),
							]
			return new Promise(function (resolve, reject) {
				modelHana.read("/TipTitoloSet", {
					filters: filtersTitolo,
					success: function (oData) {
						if(oData.results.length > 0) {
							modelPosFin.setProperty("/detailAnagrafica/TITOLO", oData.results[0].Titolo)
							modelPosFin.setProperty("/detailAnagrafica/DESC_TITOLO",  oData.results[0].DescEstesaTitolo)
							modelPosFin.setProperty("/detailAnagrafica/CATEGORIA", oData.results[0].Categoria)
							modelPosFin.setProperty("/detailAnagrafica/DESC_CATEGORIA",  oData.results[0].DescEstesaCategoria)
							if(modelPosFin.getProperty("/onModify")) {
								modelPosFin.setProperty("/detailAnagrafica/CE2", oData.results[0].Ce2)
								modelPosFin.setProperty("/detailAnagrafica/DESC_CE2", oData.results[0].DescEstesaCe2)
								modelPosFin.setProperty("/detailAnagrafica/CE3", oData.results[0].Ce3)
								modelPosFin.setProperty("/detailAnagrafica/DESC_CE3", oData.results[0].DescEstesaCe3)
							}
						}
						resolve()
					}
				})
			})
		},

		__setFieldMissione: function (oPosFin) {
			const modelHana = this.getOwnerComponent().getModel("sapHanaS2")
			let modelPosFin = this.getOwnerComponent().getModel("modelPosFin")
			let filtersMissione= [new Filter("Fikrs", FilterOperator.EQ, "S001"),
								new Filter("Fase", FilterOperator.EQ, "DLB"),
								new Filter("Anno", FilterOperator.EQ, modelPosFin.getProperty("/infoSottoStrumento/AnnoSstr")),
								new Filter("Reale", FilterOperator.EQ, modelPosFin.getProperty("/infoSottoStrumento/Reale")),
								new Filter("Missione", FilterOperator.EQ, oPosFin.Missione), 
								new Filter("Programma", FilterOperator.EQ, oPosFin.Programma),
								new Filter("Azione", FilterOperator.EQ, oPosFin.Azione),
								new Filter("Prctr", FilterOperator.EQ, oPosFin.Prctr),
							]
			return new Promise(function (resolve, reject) {
				modelHana.read("/TipMissioneSet", {
					filters: filtersMissione,
					success: function (oData) {
						if(oData.results.length > 0) {
							modelPosFin.setProperty("/detailAnagrafica/MISSIONE", oData.results[0].Missione)
							modelPosFin.setProperty("/detailAnagrafica/DESC_MISSIONE", oData.results[0].DescEstesaMissione)
							modelPosFin.setProperty("/detailAnagrafica/PROGRAMMA", oData.results[0].Programma)
							modelPosFin.setProperty("/detailAnagrafica/DESC_PROGRAMMA", oData.results[0].DescEstesaProgramma)
							modelPosFin.setProperty("/detailAnagrafica/AZIONE", oData.results[0].Azione)
							modelPosFin.setProperty("/detailAnagrafica/DESC_AZIONE", oData.results[0].DescEstesaAzione)
						}
						resolve()
					}
				})
			})
		},
		__setFieldCdr: function (oPosFin) {
			let modelHana = this.getOwnerComponent().getModel("sapHanaS2")
			let modelPosFin = this.getOwnerComponent().getModel("modelPosFin")
			let filtersAmm = [new Filter("Fikrs", FilterOperator.EQ, "S001"),
									  new Filter("Fase", FilterOperator.EQ, "DLB"),
									  new Filter("Anno", FilterOperator.EQ, modelPosFin.getProperty("/infoSottoStrumento/AnnoSstr")),
									  new Filter("Reale", FilterOperator.EQ, modelPosFin.getProperty("/infoSottoStrumento/Reale")),
									  new Filter("Prctr", FilterOperator.EQ, oPosFin.Prctr)]
				return new Promise((resolve, reject) => {
					modelHana.read("/TipAmministrazioneSet",{
						filters: filtersAmm,
						urlParameters: {
							$expand: "TipCdr"
						},
						success: (oData) => {
							if(oData.results.length > 0){
								let oCdr = oData.results[0].TipCdr.results.filter(item => item.Cdr === oPosFin.Cdr && item.Prctr === oPosFin.Prctr)[0]
								modelPosFin.setProperty("/detailAnagrafica/CDR", oCdr.Cdr)
								modelPosFin.setProperty("/detailAnagrafica/CDR_DESCR", oCdr.DescEstesaCdr)
							}
							resolve()
						},
						error:  (err) => {
							debugger
						}
					})
			})
		},
		__setFieldRagioneria: function (oPosFin) {
			let modelHana = this.getOwnerComponent().getModel("sapHanaS2")
			let modelPosFin = this.getOwnerComponent().getModel("modelPosFin")
			let filtersRagioneria = [new Filter("Fikrs", FilterOperator.EQ, "S001"),
									new Filter("Fase", FilterOperator.EQ, "DLB"),
									new Filter("Anno", FilterOperator.EQ, modelPosFin.getProperty("/infoSottoStrumento/AnnoSstr")),
									new Filter("Reale", FilterOperator.EQ, modelPosFin.getProperty("/infoSottoStrumento/Reale")),
									new Filter("Ragioneria", FilterOperator.EQ, oPosFin.Ragioneria)
								]
			return new Promise((resolve, reject) => {
				modelHana.read("/TipRagioneriaSet", {
					filters: filtersRagioneria,
					success: (oData) => {
						if(oData.results.length > 0){
							modelPosFin.setProperty("/detailAnagrafica/DESC_RAG", oData.results[0].DescEstesaRagioneria)
							modelPosFin.setProperty("/detailAnagrafica/RAG", oData.results[0].Ragioneria)
						}
						resolve()
					}
				})
			})
		},
		__setFieldMac: function (oPosFin) {
			let modelHana = this.getOwnerComponent().getModel("sapHanaS2")
			let modelPosFin = this.getOwnerComponent().getModel("modelPosFin")
			return new Promise((resolve, reject) => {
				modelHana.read("/MacSet", {
					filters: [new Filter("NumeCodDett", FilterOperator.EQ, oPosFin.Mac)],
					success: (oData) => {
						if(oData.results.length > 0){
							modelPosFin.setProperty("/detailAnagrafica/MAC", oData.results[0].NumeCodDett)
							modelPosFin.setProperty("/detailAnagrafica/DESC_MAC", oData.results[0].DescEstesa)
						}
						resolve()
					}
				})
			})
		},
		__setFieldPosizioneFinanziariaIrap: function (oPosFin) {
			let modelHana = this.getOwnerComponent().getModel("sapHanaS2")
			let modelPosFin = this.getOwnerComponent().getModel("modelPosFin")
			let aFiltersIrap = [new Filter("Fikrs", FilterOperator.EQ, "S001"),
								new Filter("Anno", FilterOperator.EQ, modelPosFin.getProperty("/infoSottoStrumento/AnnoSstr")),
								new Filter("Capitolo", FilterOperator.EQ, oPosFin.Capitolo),
								new Filter("Prctr", FilterOperator.EQ, oPosFin.Prctr)
							]
			return new Promise((resolve, reject) => {
				modelHana.read("/PosizioneFinanziariaIrapSet", {
					filters: aFiltersIrap,
					success: (oData) => {
						modelPosFin.setProperty("/detailAnagrafica/PosizioneFinanziariaIrap", oData.results)
						resolve()
					}
				})
			})
		},

		__getHVMac: function () {
			let modelHana = this.getOwnerComponent().getModel("sapHanaS2")
			let modelPosFin = this.getOwnerComponent().getModel("modelPosFin")
			//Inizio Estrazione Mac
			return new Promise((resolve, reject) => {
				modelHana.read("/MacSet", {
					success: (oData) => {
						modelPosFin.setProperty("/formPosFin/mac", oData.results)
						resolve()
					}
				})
			})
			//Fine Estrazione Mac	
		},
		__getTipoFondo: function () {
			let modelHana = this.getOwnerComponent().getModel("sapHanaS2")
			let modelPosFin = this.getOwnerComponent().getModel("modelPosFin")
			let filterTipoFondo = [new Filter("Fikrs", FilterOperator.EQ, "S001"),
									new Filter("Fase", FilterOperator.EQ, "DLB"),
									new Filter("Anno", FilterOperator.EQ, modelPosFin.getProperty("/infoSottoStrumento/AnnoSstr")),
									new Filter("Reale", FilterOperator.EQ, modelPosFin.getProperty("/infoSottoStrumento/Reale"))]
			//Inizio Estrazione Tipo Fondo
			return new Promise((resolve, reject) => {
				modelHana.read("/TipoFondoSet", {
					filters: filterTipoFondo,
					success: (oData) => {
						oData.results.unshift({CodiceTipoFondo: null, DescTipoFondo: null})
						modelPosFin.setProperty("/formPosFin/tipofondo", oData.results)
						resolve()
					}
				})
			})
			//Fine Estrazione Tipo Fondo	
		},
		__getHVCodiceStandard: function () {
			let modelHana = this.getOwnerComponent().getModel("sapHanaS2")
			let modelPosFin = this.getOwnerComponent().getModel("modelPosFin")
			let filterCodiceStandard = [new Filter("Fikrs", FilterOperator.EQ, "S001"),
									new Filter("Fase", FilterOperator.EQ, "DLB"),
									new Filter("Anno", FilterOperator.EQ, modelPosFin.getProperty("/infoSottoStrumento/AnnoSstr")),
									new Filter("Reale", FilterOperator.EQ, modelPosFin.getProperty("/infoSottoStrumento/Reale"))]
			//Inizio Estrazione Codici Standard
			return new Promise((resolve, reject) => {
				modelHana.read("/CodiceStandardSet", {
					filters: filterCodiceStandard,
					success: (oData) => {
						modelPosFin.setProperty("/formPosFin/codiceStandard", oData.results)
						resolve()
					}
				})
			})
			//Fine Estrazione Codici Standard	
		},
		__getHVAreaInterventi: function () {
			let modelHana = this.getOwnerComponent().getModel("sapHanaS2")
			let modelPosFin = this.getOwnerComponent().getModel("modelPosFin")
			return new Promise((resolve, reject) => {
				modelHana.read("/AreaInterventiSet", {
					success: (oData) => {
						oData.results.unshift({AreaDestinataria: "", Desc: ""})
						modelPosFin.setProperty("/formPosFin/AreaInterventi", oData.results)
						resolve()
					}
				})
			})
		},
		__setCofog: function (oPosFin) {
			let modelPosFin = this.getOwnerComponent().getModel("modelPosFin")
			let modelHana = this.getOwnerComponent().getModel("sapHanaS2")
			return new Promise( (resolve, reject) => {
				modelHana.read("/DistribuzioneCofogSet", {
					filters: [new Filter("Fikrs", FilterOperator.EQ, "S001"),
					new Filter("Fase", FilterOperator.EQ, "DLB"),
					new Filter("Anno", FilterOperator.EQ, modelPosFin.getProperty("/infoSottoStrumento/AnnoSstr")),
					new Filter("Reale", FilterOperator.EQ, modelPosFin.getProperty("/infoSottoStrumento/Reale")),
					new Filter("Capitolo", FilterOperator.EQ, oPosFin.Capitolo),
					new Filter("Prctr", FilterOperator.EQ, oPosFin.Prctr)
				],
				success:  async (oData) =>  {
					oData.results = oData.results.filter((arr, index, self) =>
						index === self.findIndex((t) => (t.CofogL1 === arr.CofogL1 && t.CofogL2 === arr.CofogL2  && t.CofogL3 === arr.CofogL3 )))
						//estrazione descrizioni cofog
						for(let i = 0; i < oData.results.length; i++){
							let sDesc = await this.__getDescCofog(oData.results[i])
							oData.results[i].Desc = sDesc
						}
						//fine descrizioni cofog
						modelPosFin.setProperty("/detailAnagrafica/elencoCOFOG", oData.results)
						resolve()
				}
				})	
			})
		},
		__setElenchi: function (oPosFin) {
			let modelPosFin = this.getOwnerComponent().getModel("modelPosFin")
			let modelHana = this.getOwnerComponent().getModel("sapHanaS2")
			return new Promise( (resolve, reject) => {
				modelHana.read("/CapitoloElencoSet", {
					filters: [new Filter("Fikrs", FilterOperator.EQ, "S001"),
					new Filter("Fase", FilterOperator.EQ, "DLB"),
					new Filter("Anno", FilterOperator.EQ, modelPosFin.getProperty("/infoSottoStrumento/AnnoSstr")),
					new Filter("Reale", FilterOperator.EQ, modelPosFin.getProperty("/infoSottoStrumento/Reale")),
					new Filter("Capitolo", FilterOperator.EQ, oPosFin.Capitolo),
					new Filter("PrctrElenco", FilterOperator.EQ, oPosFin.Prctr)
				],
				success:  async (oData) =>  {
					for(let i = 0; i < oData.results.length; i++) {
						let sDesc = await this.__getDescElenco(oData.results[i])
						oData.results[i].Desc = sDesc
					}
					modelPosFin.setProperty("/detailAnagrafica/elenchiCapitolo", oData.results)
					resolve()
				}
				})
			})
		},
		__getNOIPA: function () {
			let modelPosFin = this.getOwnerComponent().getModel("modelPosFin")
			let modelHana = this.getOwnerComponent().getModel("sapHanaS2")
			return new Promise( (resolve, reject) => {
				modelHana.read("/NoipaSet", {
					success: (oData) =>  {
						modelPosFin.setProperty("/formPosFin/Noipa", oData.results)
						resolve()
					}
				})
			})
		},
		/* lt setto gli altri campid della pos fin */

		__setOtherFields: function (oPosFin) {
			let modelPosFin = this.getOwnerComponent().getModel("modelPosFin")
			modelPosFin.setProperty("/detailAnagrafica/UdvL1", oPosFin.UdvL1)
			modelPosFin.setProperty("/detailAnagrafica/UdvL2", oPosFin.UdvL2)
			modelPosFin.setProperty("/detailAnagrafica/tipoFondo", oPosFin.TipoFondo)
			modelPosFin.setProperty("/detailAnagrafica/tipoSpesaCapitolo", oPosFin.TipoSpesaCapitolo)
			modelPosFin.setProperty("/detailAnagrafica/CodiceNaturaSpesa", oPosFin.NaturaSpesa)
			modelPosFin.setProperty("/detailAnagrafica/Memoria", oPosFin.Memoria === "0" ? false : true)
			modelPosFin.setProperty("/detailAnagrafica/Capitolone", oPosFin.Capitolone)
			modelPosFin.setProperty("/detailAnagrafica/CuIrapNoncu", oPosFin.CuIrapNoncu)
			modelPosFin.setProperty("/detailAnagrafica/StatusCapitolo", oPosFin.StatusCapitolo === "1"  ? true : false)
			modelPosFin.setProperty("/detailAnagrafica/StatusPg", oPosFin.StatusPg === "X"  ? true : false)
			modelPosFin.setProperty("/detailAnagrafica/Noipa", oPosFin.Noipa)
			if(modelPosFin.getProperty("/onModify")) {
				modelPosFin.setProperty("/detailAnagrafica/TipoSpesaPg", oPosFin.TipoSpesaPg)
				modelPosFin.setProperty("/detailAnagrafica/AreaDestinataria", oPosFin.AreaDestinataria)
				modelPosFin.setProperty("/detailAnagrafica/ObiettiviMinisteri", oPosFin.ObiettiviMinisteri === ""  ? false : true)
				modelPosFin.setProperty("/detailAnagrafica/RuoliSpesaFissa", oPosFin.RuoliSpesaFissa === "00"  ? false : true)
			}
			modelPosFin.updateBindings(true)
			
		},

		_getSemObject: function(){
			return "COM_ACC_IGB";
		},

		_getSchermataSac: function(sTypeSac){
			let sSchermata = null;
			switch(sTypeSac){
				case "cassaSac":
					sSchermata = "CASSA_IGB";
				break;
				case "competenzaSac":
					sSchermata = "COMPETENZA_IGB";
				break;
				default: 
					break;
			}
			return sSchermata;
		},

		_getSacParams: function(sSchermata){
			let oModelPosFin = this.getOwnerComponent().getModel("modelPosFin");
			let oPosFin = oModelPosFin.getProperty("/PosFin/");
			let oSst = oModelPosFin.getProperty("/infoSottoStrumento");
			let oAut = oModelPosFin.getProperty("/CompetenzaAuth");
			let oAmResp = oModelPosFin.getProperty("/strutturaAmminCentrale/Fictr");

			let oParams = {
				"Ammin" : oPosFin.Prctr || "",
				"Aut" : "",
				"AutColl" : "",
				"Cap" : oPosFin.Capitolo || "",
				"PosFin" : oPosFin.Fipex.replace(".","").replace(".","") || "",
				//"PosFin" : oPosFin.Fipex || "",
				"Sstr" : oSst.CodiceSottostrumento || "",
				"Str" : oSst.CodiceStrumento || "",
				"StrOri" : oSst.CodiceStrumentoOri || "",
				"StAmResp" : oAmResp || ""
			};

			if(sSchermata === "COMPETENZA_IGB"){
				oParams.Aut = oAut.Auth.IdAutorizzazione ? oAut.Auth.IdAutorizzazione : "";
				oParams.AutColl = oAut.Auth.AuthAssociata ? oAut.Auth.AuthAssociata : "";
			}
			return oParams;
		},	

		_getIFrameUrlPromise: function(oPayload){

			let that = this;

			return { 
				oPayload,
				mPromise: oData => new Promise((res,rej)=>{
					
					var serviceUrl = "/sap/opu/odata/sap/ZSS4_COBI_ACCANTONAM_FORM_SRV/";
					var oModel = new sap.ui.model.odata.v2.ODataModel(serviceUrl);
					//let oModel = that.getOwnerComponent().getModel("sapHanaS2");

					oModel.create(
						"/VarSingSet",
						oData,
						{
							success: oRes => res({oResponse: oRes, oPayload: oData}),
							error: oRes => rej({oResponse: oRes, oPayload: oData})
						}
					);
				})
			};
		},

		loadIframe: async function(typeSac){
			//lt prova recupero iframe
			let that = this;
			let oModel = that.getOwnerComponent().getModel("sapHanaS2");
			let sSemObj = this._getSemObject();
			let sSchermata = this._getSchermataSac(typeSac);
			let oModelPosFin = this.getOwnerComponent().getModel("modelPosFin");
			/* if(sSchermata === "COMPETENZA_IGB"){
				let oAut = oModelPosFin.getProperty("/CompetenzaAuth");
				if(!oAut || !oAut.Auth || !oAut.AuthAssociata || oAut.Auth !== "" || oAut.AuthAssociata !== ""){
					this.openMessageBox("Error", "Errore campo Obbligatorio", "Manca l'autorizzazione per la competenza");
					return;
				}  
			} */


			let oFields = this._getSacParams(sSchermata);
			
			let oPayload = {
				"SemObj": sSemObj,
				"SchedaSac": sSchermata,
				...oFields
			};

			// BusyIndicator.show();
			let oPromise = this._getIFrameUrlPromise(oPayload);
			await oPromise.mPromise(oPromise.oPayload)
				.then(
					oRes => that.getOwnerComponent().getModel("iframe").setProperty("/" + typeSac, oRes.oResponse.Url),
					oRes => that.openMessageBox("Error","Errore","Errore recupero scheda SAC")
				);
			// BusyIndicator.hide();
		},
		/* loadIframe: function(typeSac){
			//lt prova recupero iframe
			var that = this;
			var oFrame = that.getView().byId(typeSac);
			var url = this.getOwnerComponent().getModel("iframe").getProperty("/" + typeSac);
			that.urlSac = url;
			var oFrameContent = oFrame.$()[0];
			oFrameContent.setAttribute("src", that.urlSac);
			that._refresh();
		}, */
		_refresh: function() {
			var urlSac = this.urlSac;
			window.frames[0].location = urlSac + (new Date());
		},
		sorterAmmByNumericCode: function (a,b) {
			const subStrAmm1 = Number(a.substring(1, a.length))
			const subStrAmm2 = Number(b.substring(1, a.length))
			return subStrAmm1 - subStrAmm2;
		},
		sorterHVDomSStr: function (a, b) {
			return Number(a) - Number(b)
		},
		onHVFormPosFin: async function (oEvent) {
			let {_, value} = oEvent.getSource().getCustomData()[0].mProperties
			await this.__getDataForHV(value) //estrae i dati filtrati nel caso ci siano selezioni di attributi padre
			Fragment.load({
				name:"zsap.com.r3.cobi.s4.comaccigb.view.fragment.HVPosFin." + value,
				controller: this
			}).then(oDialog => {
				this[value] = oDialog
				this.getView().addDependent(oDialog);
				this[value].open()
			})
		},
		__getDataForHV: function name(sHV) {
			let modelPosFin = this.getOwnerComponent().getModel("modelPosFin")
			let modelHana = this.getOwnerComponent().getModel("sapHanaS2")
			let aFilters = [new Filter("Fikrs", FilterOperator.EQ, "S001"),
							new Filter("Fase", FilterOperator.EQ, "DLB"),
							new Filter("Anno", FilterOperator.EQ, modelPosFin.getProperty("/infoSottoStrumento/AnnoSstr"))
						]
			switch (sHV) {
				case "HVCapitolo":
					//se si apre capitolo, controllare che sia stato valorizzata Amministrazione e filtrare per tale valore
					if(modelPosFin.getProperty("/detailAnagrafica/AMMINISTAZIONE")){
						aFilters.push(new Filter("Prctr", FilterOperator.EQ, modelPosFin.getProperty("/detailAnagrafica/AMMINISTAZIONE")))
						modelHana.read("/TipAmministrazioneSet",{
							filters: aFilters,
							urlParameters: {
								$expand: "TipCapitolo"
							},
							success: (oData) => {
								//debugger
								modelPosFin.setProperty("/formPosFin/capitoli", function() {
									let aCapitoli = []
									if(oData.results.length === 1) {
										for(let i = 0; i <  oData.results.length; i++){
											for(let j = 0; j < oData.results[i].TipCapitolo.results.length; j++)
												if(aCapitoli.filter(item => (item.Prctr === oData.results[i].TipCapitolo.results[j].Prctr && item.Capitolo === oData.results[i].TipCapitolo.results[j].Capitolo)).length === 0)
													aCapitoli.push(oData.results[i].TipCapitolo.results[j])
										}
									} else {
										for(let i = 0; i < oData.results.length; i++){
											for(let j = 0; j < oData.results[i].TipCapitolo.results.length; j++)
												if(aCapitoli.filter(item => (item.Prctr === oData.results[i].TipCapitolo.results[j].Prctr && item.Capitolo === oData.results[i].TipCapitolo.results[j].Capitolo)).length === 0)
													aCapitoli.push(oData.results[i].TipCapitolo.results[j])
										}
									}
									return aCapitoli
								}())
							},
							error:  (err) => {
								//debugger
							}
						})
					}
					break;
				case "HVPg":
					//se si apre capitolo, controllare che sia stato valorizzata Amministrazione e filtrare per tale valore
					if(modelPosFin.getProperty("/detailAnagrafica/AMMINISTAZIONE") && modelPosFin.getProperty("/detailAnagrafica/CAPITOLO")){
						aFilters.push(new Filter("Prctr", FilterOperator.EQ, modelPosFin.getProperty("/detailAnagrafica/AMMINISTAZIONE")))
						modelHana.read("/TipAmministrazioneSet",{
							filters: aFilters,
							urlParameters: {
								$expand: "TipCapitolo"
							},
							success: (oData) => {
								//debugger
								modelPosFin.setProperty("/formPosFin/pg", function() {
									let aCapitoli = []
									if(oData.results.length === 1) {
										for(let i = 0; i <  oData.results.length; i++){
											for(let j = 0; j < oData.results[i].TipCapitolo.results.length; j++)
												if(oData.results[i].TipCapitolo.results[j].Capitolo === modelPosFin.getProperty("/detailAnagrafica/CAPITOLO"))
													if(aCapitoli.filter(item => (item.Prctr === oData.results[i].TipCapitolo.results[j].Prctr && item.Capitolo === oData.results[i].TipCapitolo.results[j].Capitolo)).length === 0)
														aCapitoli.push(oData.results[i].TipCapitolo.results[j])
										}
									} else {
										for(let i = 0; i < oData.results.length; i++){
											for(let j = 0; j < oData.results[i].TipCapitolo.results.length; j++)
												if(aCapitoli.filter(item => (item.Prctr === oData.results[i].TipCapitolo.results[j].Prctr && item.Capitolo === oData.results[i].TipCapitolo.results[j].Capitolo)).length === 0)
													if(oData.results[i].TipCapitolo.results[j].Capitolo === modelPosFin.getProperty("/detailAnagrafica/CAPITOLO"))
														aCapitoli.push(oData.results[i].TipCapitolo.results[j])
										}
									}
									return aCapitoli
								}())
							},
							error:  (err) => {
								//debugger
							}
						})
					}
					break
					case "HVCdr":
						//se si apre help value di Cdr, controllare che sia stato valorizzata Amministrazione e filtrare per tale valore
						if(modelPosFin.getProperty("/detailAnagrafica/AMMINISTAZIONE")){
							aFilters.push(new Filter("Prctr", FilterOperator.EQ, modelPosFin.getProperty("/detailAnagrafica/AMMINISTAZIONE")))
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
						}
					break
					case "HVProgramma":
						//se si apre help value di Programma, controllare che sia stato valorizzata Missione e filtrare per tale valore
						if(modelPosFin.getProperty("/detailAnagrafica/AMMINISTAZIONE"))
							aFilters.push(new Filter("Prctr", FilterOperator.EQ, modelPosFin.getProperty("/detailAnagrafica/AMMINISTAZIONE")))
						if(modelPosFin.getProperty("/detailAnagrafica/MISSIONE"))
							aFilters.push(new Filter("Missione", FilterOperator.EQ, modelPosFin.getProperty("/detailAnagrafica/MISSIONE")))
						modelHana.read("/TipMissioneSet",{
							filters: aFilters,
							success: (oData) => {
								//debugger
								modelPosFin.setProperty("/formPosFin/programmi", function() {
									let aProgrammi = []
									for(let i = 0; i < oData.results.length; i++)
										if(aProgrammi.filter(item => (item.Missione === oData.results[i].Missione &&
											item.Programma === oData.results[i].Programma)).length === 0)
											aProgrammi.push(oData.results[i])
									
									return aProgrammi
								}())
							},
							error:  (err) => {
								//debugger
							}
						})
					break
					case "HVAzione":
						//se si apre help value di Programma, controllare che sia stato valorizzata Missione e filtrare per tale valore
						if(modelPosFin.getProperty("/detailAnagrafica/AMMINISTAZIONE"))
							aFilters.push(new Filter("Prctr", FilterOperator.EQ, modelPosFin.getProperty("/detailAnagrafica/AMMINISTAZIONE")))
						if(modelPosFin.getProperty("/detailAnagrafica/MISSIONE"))
							aFilters.push(new Filter("Missione", FilterOperator.EQ, modelPosFin.getProperty("/detailAnagrafica/MISSIONE")))
						if(modelPosFin.getProperty("/detailAnagrafica/PROGRAMMA"))
							aFilters.push(new Filter("Programma", FilterOperator.EQ, modelPosFin.getProperty("/detailAnagrafica/PROGRAMMA")))
						modelHana.read("/TipMissioneSet",{
							filters: aFilters,
							success: (oData) => {
								//debugger
								modelPosFin.setProperty("/formPosFin/azioni",oData.results)
							},
							error:  (err) => {
								//debugger
							}
						})
					break
					case "HVCategoria":
						//se si apre help value di Categoria, controllare che sia stato valorizzata Titolo e filtrare per tale valore
						if(modelPosFin.getProperty("/detailAnagrafica/TITOLO"))
							aFilters.push(new Filter("Titolo", FilterOperator.EQ, modelPosFin.getProperty("/detailAnagrafica/TITOLO")))
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
								})
							},
							error:  (err) => {
								//debugger
							}
						})
					break
					case "HVCe2":
						//se si apre help value di Categoria, controllare che sia stato valorizzata Titolo e filtrare per tale valore
						if(modelPosFin.getProperty("/detailAnagrafica/TITOLO"))
							aFilters.push(new Filter("Titolo", FilterOperator.EQ, modelPosFin.getProperty("/detailAnagrafica/TITOLO")))
						if(modelPosFin.getProperty("/detailAnagrafica/CATEGORIA"))
							aFilters.push(new Filter("Categoria", FilterOperator.EQ, modelPosFin.getProperty("/detailAnagrafica/CATEGORIA")))
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
								})
							},
							error:  (err) => {
								//debugger
							}
						})
					break
					case "HVCe3":
						//se si apre help value di Categoria, controllare che sia stato valorizzata Titolo e filtrare per tale valore
						if(modelPosFin.getProperty("/detailAnagrafica/TITOLO"))
							aFilters.push(new Filter("Titolo", FilterOperator.EQ, modelPosFin.getProperty("/detailAnagrafica/TITOLO")))
						if(modelPosFin.getProperty("/detailAnagrafica/CATEGORIA"))
							aFilters.push(new Filter("Categoria", FilterOperator.EQ, modelPosFin.getProperty("/detailAnagrafica/CATEGORIA")))
						if(modelPosFin.getProperty("/detailAnagrafica/CE2"))
							aFilters.push(new Filter("Ce2", FilterOperator.EQ, modelPosFin.getProperty("/detailAnagrafica/CE2")))
						modelHana.read("/TipTitoloSet",{
							filters: aFilters,
							success: (oData) => {
								//debugger
								modelPosFin.setProperty("/formPosFin/ce3", oData.results)
							},
							error:  (err) => {
								//debugger
							}
						})
					break
				default:
					break;
			}
		},
		__getDataHVPosFin: function () {
			let modelHana = this.getOwnerComponent().getModel("sapHanaS2")
			let modelPosFin = this.getOwnerComponent().getModel("modelPosFin")
			let filtersAmm = [new Filter("Fikrs", FilterOperator.EQ, "S001"),
									  new Filter("Fase", FilterOperator.EQ, "DLB"),
									  new Filter("Anno", FilterOperator.EQ, modelPosFin.getProperty("/infoSottoStrumento/AnnoSstr")),
									  new Filter("Reale", FilterOperator.EQ, modelPosFin.getProperty("/infoSottoStrumento/Reale"))
									]
			let filtersTitolo = [...filtersAmm]
			//Estrazione Amm, Capitolo, Pg, Azione, Cdr, Programma e Missione
			if(modelPosFin.getProperty("/infoSottoStrumento/ToAmministrazione/results").length > 0) {
				let filterComposeAmm = []
				modelPosFin.getProperty("/infoSottoStrumento/ToAmministrazione/results").map((amm) => {
					if (amm.Prctr) {
						filterComposeAmm.push(new Filter({
							path: "Prctr",
							operator: FilterOperator.EQ,
							value1: amm.Prctr
						}))
					}   
				})
				let afiltersOrAmm = 
					new Filter({
						filters: filterComposeAmm,
						and: false,
						or : true
						})
				filtersAmm.push(afiltersOrAmm)
			}
			modelHana.read("/TipAmministrazioneSet",{
				filters: filtersAmm,
				urlParameters: {
					$expand: "TipMissione,TipCapitolo,TipCdr"
				},
				success: (oData) => {
					//debugger
					modelPosFin.setProperty("/formPosFin/amministrazioni", oData.results)
					if(modelPosFin.getProperty("/infoSottoStrumento/ToAmministrazione/results").length === 1){
						modelPosFin.setProperty("/detailAnagrafica/AMMINISTAZIONE", oData.results[0].Prctr)
						modelPosFin.setProperty("/detailAnagrafica/DESC_AMMINISTAZIONE", oData.results[0].DescEstesa)
					}
					modelPosFin.setProperty("/formPosFin/capitoli", function() {
						let aCapitoli = []
						if(oData.results.length === 1) {
							for(let i = 0; i <  oData.results.length; i++){
								for(let j = 0; j < oData.results[i].TipCapitolo.results.length; j++)
									if(aCapitoli.filter(item => (item.Prctr === oData.results[i].TipCapitolo.results[j].Prctr && item.Capitolo === oData.results[i].TipCapitolo.results[j].Capitolo)).length === 0)
										aCapitoli.push(oData.results[i].TipCapitolo.results[j])
							}
						} else {
							for(let i = 0; i < oData.results.length; i++){
								for(let j = 0; j < oData.results[i].TipCapitolo.results.length; j++)
									if(aCapitoli.filter(item => (item.Prctr === oData.results[i].TipCapitolo.results[j].Prctr && item.Capitolo === oData.results[i].TipCapitolo.results[j].Capitolo)).length === 0)
										aCapitoli.push(oData.results[i].TipCapitolo.results[j])
								//aCapitoli.push(...oData.results[i].TipCapitolo.results)
							}
						}
						return aCapitoli
					}())
					modelPosFin.setProperty("/formPosFin/pg", function() {
						let aPg = []
						if(oData.results.length === 1) {
							for(let i = 0; i <  oData.results.length; i++){
								aPg.push(...oData.results[i].TipCapitolo.results)
							}
						} else {
							for(let i = 0; i < oData.results.length; i++){
								aPg.push(...oData.results[i].TipCapitolo.results)
							}
						}
						return aPg
					}())
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
					modelPosFin.setProperty("/formPosFin/missioni", function() {
						let aMissioni = []
						if(oData.results.length === 1) {
							for(let i = 0; i <  oData.results.length; i++){
								for(let j = 0; j < oData.results[i].TipMissione.results.length; j++)
									if(aMissioni.filter(item => (item.Missione === oData.results[i].TipMissione.results[j].Missione)).length === 0)
									aMissioni.push(oData.results[i].TipMissione.results[j])
							}
						} else {
							for(let i = 0; i < oData.results.length; i++){
								for(let j = 0; j < oData.results[i].TipMissione.results.length; j++)
									if(aMissioni.filter(item => ( item.Missione === oData.results[i].TipMissione.results[j].Missione)).length === 0)
										aMissioni.push(oData.results[i].TipMissione.results[j])
								//aCapitoli.push(...oData.results[i].TipCapitolo.results)
							}
						}
						return aMissioni
					}())
					modelPosFin.setProperty("/formPosFin/programmi", function() {
						let aProgrammi = []
						if(oData.results.length === 1) {
							for(let i = 0; i <  oData.results.length; i++){
								for(let j = 0; j < oData.results[i].TipMissione.results.length; j++)
									if(aProgrammi.filter(item => (
											item.Missione === oData.results[i].TipMissione.results[j].Missione &&
											item.Programma === oData.results[i].TipMissione.results[j].Programma)).length === 0)
									aProgrammi.push(oData.results[i].TipMissione.results[j])
							}
						} else {
							for(let i = 0; i < oData.results.length; i++){
								for(let j = 0; j < oData.results[i].TipMissione.results.length; j++)
									if(aProgrammi.filter(item => (item.Missione === oData.results[i].TipMissione.results[j].Missione &&
										item.Programma === oData.results[i].TipMissione.results[j].Programma)).length === 0)
										aProgrammi.push(oData.results[i].TipMissione.results[j])
							}
						}
						return aProgrammi
					}())
					modelPosFin.setProperty("/formPosFin/azioni", function() {
						let aAzioni = []
						if(oData.results.length === 1) {
							for(let i = 0; i <  oData.results.length; i++){
								for(let j = 0; j < oData.results[i].TipMissione.results.length; j++)
									aAzioni.push(oData.results[i].TipMissione.results[j])
							}
						} else {
							for(let i = 0; i < oData.results.length; i++){
								for(let j = 0; j < oData.results[i].TipMissione.results.length; j++)
									aAzioni.push(oData.results[i].TipMissione.results[j])
							}
						}
						return aAzioni
					}())
				},
				error:  (err) => {
					//debugger
				}
			})
			//Fine estrazione Amm, Capitolo, Pg, Azione, Cdr, Programma e Missione
			modelHana.read("/TipTitoloSet",{
				filters: filtersTitolo,
				success: (oData) => {
					modelPosFin.setProperty("/formPosFin/titoli", function() {
						let aTitoli = []
						for(let i = 0; i < oData.results.length; i++)
							if(aTitoli.filter(item => item.Titolo === oData.results[i].Titolo).length === 0 )
								aTitoli.push(oData.results[i])
						return aTitoli
					})
					modelPosFin.setProperty("/formPosFin/categorie", function() {
						let aCategoria = []
						for(let i = 0; i < oData.results.length; i++)
							if(aCategoria.filter(item => item.Titolo === oData.results[i].Titolo &&
													  item.Categoria === oData.results[i].Categoria).length === 0 )
								aCategoria.push(oData.results[i])
						return aCategoria
					})
					modelPosFin.setProperty("/formPosFin/ce2", function() {
						let aCe2 = []
						for(let i = 0; i < oData.results.length; i++)
							if(aCe2.filter(item => item.Titolo === oData.results[i].Titolo &&
														 item.Categoria === oData.results[i].Categoria &&
														 item.Ce2 === oData.results[i].Ce2).length === 0 )
								aCe2.push(oData.results[i])
						return aCe2
					})
					modelPosFin.setProperty("/formPosFin/ce3", oData.results)
				}
			})
			//Inizio estrazione Titolo, Categoria, Ce2 e Ce3

			//Inizio Estrazione Ragioneria
			modelHana.read("/TipRagioneriaSet", {
				filters: filtersTitolo,
				success: (oData) => {
					//debugger
					modelPosFin.setProperty("/formPosFin/ragionerie", oData.results)
				}
			})
			//Fine Estrazione Ragioneria

			//Inizio Estrazione Mac
			modelHana.read("/MacSet", {
				success: (oData) => {
					//debugger
					modelPosFin.setProperty("/formPosFin/mac", oData.results)
				}
			})
			//Fine Estrazione Mac

		},
		getAmmDescEstesa: function (Prctr) {
			let modelPosFin = this.getOwnerComponent().getModel("modelPosFin")
			let aAmministrazioni = modelPosFin.getProperty("/formPosFin/amministrazioni")
			return aAmministrazioni.filter(amm => amm.Prctr === Prctr)[0].DescEstesa
		},
		onCloseHVPosFin: function (oEvent) {
			oEvent.getSource().getParent().close()
		},
		onConfirmSelectionPosFin: function (oEvent) {
			let {_, value} = oEvent.getSource().getCustomData()[0].mProperties
			let modelPosFin = this.getOwnerComponent().getModel("modelPosFin")
			let sPath, aAmministrazioni
			switch (value) {
				case "Amministrazione":
					sPath = oEvent.getSource().getParent().getContent()[0].getSelectedContextPaths()
					//check se sono stati selezionati figli; in caso di amministrazione non combaciante, resettare input
					if(modelPosFin.getProperty(sPath + "/Prctr") !== modelPosFin.getProperty("/detailAnagrafica/AMMINISTAZIONE")) {
						modelPosFin.setProperty("/detailAnagrafica/CAPITOLO", null)
						modelPosFin.setProperty("/detailAnagrafica/pg", null)
						modelPosFin.setProperty("/detailAnagrafica/CDR", null)
						modelPosFin.setProperty("/detailAnagrafica/CDR_DESCR", null)
					}
					modelPosFin.setProperty("/detailAnagrafica/AMMINISTAZIONE", modelPosFin.getProperty(sPath + "/Prctr"))
					modelPosFin.setProperty("/detailAnagrafica/DESC_AMMINISTAZIONE", modelPosFin.getProperty(sPath + "/DescEstesa"))

					break;
				case "Capitolo":
					sPath = oEvent.getSource().getParent().getContent()[0].getSelectedContextPaths()
					//check se sono stati selezionati figli; in caso di capitolo non combaciante, resettare input
					if(modelPosFin.getProperty(sPath[0] + "/Capitolo") !== modelPosFin.getProperty("/detailAnagrafica/CAPITOLO")) {
						modelPosFin.setProperty("/detailAnagrafica/pg", null)
					}
					aAmministrazioni = modelPosFin.getProperty("/formPosFin/amministrazioni")
					let oCapitolo = modelPosFin.getProperty(sPath[0])
					modelPosFin.setProperty("/detailAnagrafica/CAPITOLO", modelPosFin.getProperty(sPath[0] + "/Capitolo"))
					modelPosFin.setProperty("/detailAnagrafica/AMMINISTAZIONE", aAmministrazioni.filter(amm => amm.Prctr === oCapitolo.Prctr)[0].Prctr)
					modelPosFin.setProperty("/detailAnagrafica/DESC_AMMINISTAZIONE",aAmministrazioni.filter(amm => amm.Prctr === oCapitolo.Prctr)[0].DescEstesa)
					break
				case "Pg":
					sPath = oEvent.getSource().getParent().getContent()[0].getSelectedContextPaths()
					aAmministrazioni = modelPosFin.getProperty("/formPosFin/amministrazioni")
					let oPg = modelPosFin.getProperty(sPath[0])
					modelPosFin.setProperty("/detailAnagrafica/pg", modelPosFin.getProperty(sPath[0] + "/Pg"))
					modelPosFin.setProperty("/detailAnagrafica/CAPITOLO", modelPosFin.getProperty(sPath[0] + "/Capitolo"))
					modelPosFin.setProperty("/detailAnagrafica/AMMINISTAZIONE", aAmministrazioni.filter(amm => amm.Prctr === oPg.Prctr)[0].Prctr)
					modelPosFin.setProperty("/detailAnagrafica/DESC_AMMINISTAZIONE",aAmministrazioni.filter(amm => amm.Prctr === oPg.Prctr)[0].DescEstesa)
					break
				case "Cdr":
					sPath = oEvent.getSource().getParent().getContent()[0].getSelectedContextPaths()
					aAmministrazioni = modelPosFin.getProperty("/formPosFin/amministrazioni")
					let oCdr = modelPosFin.getProperty(sPath[0])
					modelPosFin.setProperty("/detailAnagrafica/CDR", modelPosFin.getProperty(sPath[0] + "/Cdr"))
					modelPosFin.setProperty("/detailAnagrafica/CDR_DESCR", modelPosFin.getProperty(sPath[0] + "/DescEstesaCdr"))
					modelPosFin.setProperty("/detailAnagrafica/AMMINISTAZIONE", aAmministrazioni.filter(amm => amm.Prctr === oCdr.Prctr)[0].Prctr)
					modelPosFin.setProperty("/detailAnagrafica/DESC_AMMINISTAZIONE",aAmministrazioni.filter(amm => amm.Prctr === oCdr.Prctr)[0].DescEstesa)
					break
				case "Missione":
					sPath = oEvent.getSource().getParent().getContent()[0].getSelectedContextPaths()
					//check se sono stati selezionati figli; in caso di Missione non combaciante, resettare input
					if(modelPosFin.getProperty(sPath + "/Missione") !== modelPosFin.getProperty("/detailAnagrafica/MISSIONE")) {
						modelPosFin.setProperty("/detailAnagrafica/PROGRAMMA", null)
						modelPosFin.setProperty("/detailAnagrafica/DESC_PROGRAMMA",null)
						modelPosFin.setProperty("/detailAnagrafica/AZIONE", null)
						modelPosFin.setProperty("/detailAnagrafica/DESC_AZIONE",null)
					}
					modelPosFin.setProperty("/detailAnagrafica/MISSIONE", modelPosFin.getProperty(sPath + "/Missione"))
					modelPosFin.setProperty("/detailAnagrafica/DESC_MISSIONE", modelPosFin.getProperty(sPath + "/DescEstesaMissione"))

					break;
				case "Programma":
					sPath = oEvent.getSource().getParent().getContent()[0].getSelectedContextPaths()
					//check se sono stati selezionati figli; in caso di amministrazione non combaciante, resettare input
					if(modelPosFin.getProperty(sPath + "/Programma") !== modelPosFin.getProperty("/detailAnagrafica/PROGRAMMA")) {
						modelPosFin.setProperty("/detailAnagrafica/AZIONE", null)
						modelPosFin.setProperty("/detailAnagrafica/DESC_AZIONE",null)
					}
					modelPosFin.setProperty("/detailAnagrafica/MISSIONE", modelPosFin.getProperty(sPath[0] + "/Missione"))
					modelPosFin.setProperty("/detailAnagrafica/DESC_MISSIONE", modelPosFin.getProperty(sPath[0] + "/DescEstesaMissione"))
					modelPosFin.setProperty("/detailAnagrafica/PROGRAMMA", modelPosFin.getProperty(sPath[0] + "/Programma"))
					modelPosFin.setProperty("/detailAnagrafica/DESC_PROGRAMMA", modelPosFin.getProperty(sPath[0] + "/DescEstesaProgramma"))

					break;
				case "Azione":
					sPath = oEvent.getSource().getParent().getContent()[0].getSelectedContextPaths()
					modelPosFin.setProperty("/detailAnagrafica/AMMINISTAZIONE", modelPosFin.getProperty(sPath[0] + "/Prctr"))
					modelPosFin.setProperty("/detailAnagrafica/DESC_AMMINISTAZIONE",modelPosFin.getProperty(sPath[0] + "/DescEstesaPrctr"))
					modelPosFin.setProperty("/detailAnagrafica/MISSIONE", modelPosFin.getProperty(sPath[0] + "/Missione"))
					modelPosFin.setProperty("/detailAnagrafica/DESC_MISSIONE", modelPosFin.getProperty(sPath[0] + "/DescEstesaMissione"))
					modelPosFin.setProperty("/detailAnagrafica/PROGRAMMA", modelPosFin.getProperty(sPath[0] + "/Programma"))
					modelPosFin.setProperty("/detailAnagrafica/DESC_PROGRAMMA", modelPosFin.getProperty(sPath[0] + "/DescEstesaProgramma"))
					modelPosFin.setProperty("/detailAnagrafica/AZIONE", modelPosFin.getProperty(sPath[0] + "/Azione"))
					modelPosFin.setProperty("/detailAnagrafica/DESC_AZIONE", modelPosFin.getProperty(sPath[0] + "/DescEstesaAzione"))

					break;
				case "Titolo":
					sPath = oEvent.getSource().getParent().getContent()[0].getSelectedContextPaths()
					//check se sono stati selezionati figli; in caso di Missione non combaciante, resettare input
					if(modelPosFin.getProperty(sPath + "/Titolo") !== modelPosFin.getProperty("/detailAnagrafica/TITOLO")) {
						modelPosFin.setProperty("/detailAnagrafica/CATEGORIA", null)
						modelPosFin.setProperty("/detailAnagrafica/DESC_CATEGORIA",null)
						modelPosFin.setProperty("/detailAnagrafica/CE2", null)
						modelPosFin.setProperty("/detailAnagrafica/DESC_CE2",null)
						modelPosFin.setProperty("/detailAnagrafica/CE3", null)
						modelPosFin.setProperty("/detailAnagrafica/DESC_CE3",null)
					}
					modelPosFin.setProperty("/detailAnagrafica/TITOLO", modelPosFin.getProperty(sPath + "/Titolo"))
					modelPosFin.setProperty("/detailAnagrafica/DESC_TITOLO", modelPosFin.getProperty(sPath + "/DescEstesaTitolo"))

					break;
				case "Categoria":
					sPath = oEvent.getSource().getParent().getContent()[0].getSelectedContextPaths()
					//check se sono stati selezionati figli; in caso di Missione non combaciante, resettare input
					if(modelPosFin.getProperty(sPath[0] + "/Categoria") !== modelPosFin.getProperty("/detailAnagrafica/CATEGORIA")) {
						modelPosFin.setProperty("/detailAnagrafica/CE2", null)
						modelPosFin.setProperty("/detailAnagrafica/DESC_CE2",null)
						modelPosFin.setProperty("/detailAnagrafica/CE3", null)
						modelPosFin.setProperty("/detailAnagrafica/DESC_CE3",null)
					}
					modelPosFin.setProperty("/detailAnagrafica/TITOLO", modelPosFin.getProperty(sPath[0] + "/Titolo"))
					modelPosFin.setProperty("/detailAnagrafica/DESC_TITOLO", modelPosFin.getProperty(sPath[0]  + "/DescEstesaTitolo"))
					modelPosFin.setProperty("/detailAnagrafica/CATEGORIA", modelPosFin.getProperty(sPath[0]  + "/Categoria"))
					modelPosFin.setProperty("/detailAnagrafica/DESC_CATEGORIA", modelPosFin.getProperty(sPath[0] + "/DescEstesaCategoria"))

					break;
				case "Ce2":
					sPath = oEvent.getSource().getParent().getContent()[0].getSelectedContextPaths()
					//check se sono stati selezionati figli; in caso di Missione non combaciante, resettare input
					if(modelPosFin.getProperty(sPath[0] + "/Ce2") !== modelPosFin.getProperty("/detailAnagrafica/CE2")) {
						modelPosFin.setProperty("/detailAnagrafica/CE3", null)
						modelPosFin.setProperty("/detailAnagrafica/DESC_CE3",null)
					}
					modelPosFin.setProperty("/detailAnagrafica/TITOLO", modelPosFin.getProperty(sPath[0] + "/Titolo"))
					modelPosFin.setProperty("/detailAnagrafica/DESC_TITOLO", modelPosFin.getProperty(sPath[0]  + "/DescEstesaTitolo"))
					modelPosFin.setProperty("/detailAnagrafica/CATEGORIA", modelPosFin.getProperty(sPath[0]  + "/Categoria"))
					modelPosFin.setProperty("/detailAnagrafica/DESC_CATEGORIA", modelPosFin.getProperty(sPath[0] + "/DescEstesaCategoria"))
					modelPosFin.setProperty("/detailAnagrafica/CE2", modelPosFin.getProperty(sPath[0]  + "/Ce2"))
					modelPosFin.setProperty("/detailAnagrafica/DESC_CE2", modelPosFin.getProperty(sPath[0] + "/DescEstesaCe2"))

					break;
				case "Ce2":
					sPath = oEvent.getSource().getParent().getContent()[0].getSelectedContextPaths()
					modelPosFin.setProperty("/detailAnagrafica/TITOLO", modelPosFin.getProperty(sPath[0] + "/Titolo"))
					modelPosFin.setProperty("/detailAnagrafica/DESC_TITOLO", modelPosFin.getProperty(sPath[0]  + "/DescEstesaTitolo"))
					modelPosFin.setProperty("/detailAnagrafica/CATEGORIA", modelPosFin.getProperty(sPath[0]  + "/Categoria"))
					modelPosFin.setProperty("/detailAnagrafica/DESC_CATEGORIA", modelPosFin.getProperty(sPath[0] + "/DescEstesaCategoria"))
					modelPosFin.setProperty("/detailAnagrafica/CE2", modelPosFin.getProperty(sPath[0]  + "/Ce2"))
					modelPosFin.setProperty("/detailAnagrafica/DESC_CE2", modelPosFin.getProperty(sPath[0] + "/DescEstesaCe2"))
					modelPosFin.setProperty("/detailAnagrafica/CE3", modelPosFin.getProperty(sPath[0]  + "/Ce3"))
					modelPosFin.setProperty("/detailAnagrafica/DESC_CE3", modelPosFin.getProperty(sPath[0] + "/DescEstesaCe3"))

					break;
				case "Ragioneria":
					sPath = oEvent.getSource().getParent().getContent()[0].getSelectedContextPaths()
					modelPosFin.setProperty("/detailAnagrafica/DESC_RAG", modelPosFin.getProperty(sPath  + "/DescEstesaRagioneria"))
					modelPosFin.setProperty("/detailAnagrafica/RAG", modelPosFin.getProperty(sPath  + "/Ragioneria"))
					break;
				case "Mac":
					sPath = oEvent.getSource().getParent().getContent()[0].getSelectedContextPaths()
					modelPosFin.setProperty("/detailAnagrafica/DESC_MAC", modelPosFin.getProperty(sPath  + "/DescEstesa"))
					modelPosFin.setProperty("/detailAnagrafica/MAC", modelPosFin.getProperty(sPath  + "/NumeCodDett"))
					break;
				default:
					break;
			}
			oEvent.getSource().getParent().close()
		},
		onSottostrumento: function () {
			var oModel = this.getOwnerComponent().getModel("sapHanaS2");
			var Dateto = new Date(new Date().getFullYear(), 11, 31);
			Dateto.setHours(2);
			var sottostrumentiModel = new JSONModel();
			var oView = this.getView();
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
				})
			];
			oModel.read("/Gest_PosFin_SottostrumentoSet", {
				filters: _filters,
				success: function(oData, response) {
					oData.results = oData.results.map((item) => {
						item.FkEseStrAnnoEse = Number(item.FkEseStrAnnoEse) + 1
						item.EseAnnoEse = Number(item.EseAnnoEse) + 1
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
					"zsap.com.r3.cobi.s4.comaccigb.view.fragment.Sottostrumento",
					this);
				this._oDialog.setModel("sottostrumentiModel");
				this.getView().addDependent(this._oDialog);
				this._oDialog.open();
			} else {
				this._oDialog.open();
			}
		},
		onClose: function (oEvent) {
			oEvent.getSource().getParent().close()
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
			oEvent.getSource().getParent().close()
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
			let homeModel = this.getOwnerComponent().getModel("modelHome")
			const {key, value} = oEvent.getSource().getCustomData()[0].mProperties 
			homeModel.setProperty("/form/" + key, oEvent.getParameter("selectedItem").getProperty("title"))
			homeModel.setProperty("/form/" + value, oEvent.getParameter("selectedItem").getProperty("description"))
		},
		onPressChoiceTableProgramma: function (oEvent) {
			let homeModel = this.getOwnerComponent().getModel("modelHome")
			const {key, value} = oEvent.getSource().getCustomData()[0].mProperties 
			let item = homeModel.getProperty(oEvent.getParameter("selectedItem").getBindingContextPath())
			homeModel.setProperty("/form/" + key,  item.VALORE)
			homeModel.setProperty("/form/" + value, item.DESCRIZIONE)
			homeModel.setProperty("/form/MISSIONE",  item.MISSIONE)
			homeModel.setProperty("/form/DESCRIZIONE_MISSIONE", item.DESCR_MISSIONE)
		},
		  onPressChoiceTableAzione: function (oEvent) {
			let homeModel = this.getOwnerComponent().getModel("modelHome")
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
			let homeModel = this.getOwnerComponent().getModel("modelHome")
			const {key, value} = oEvent.getSource().getCustomData()[0].mProperties 
			let item = homeModel.getProperty(oEvent.getParameter("selectedItem").getBindingContextPath())
			homeModel.setProperty("/form/" + key,  item.CAPITOLO)
			homeModel.setProperty("/form/" + value, item.DESCR_CAPITOLO)
			homeModel.setProperty("/form/AMMINISTRAZIONE",  item.AMMINISTRAZIONE)
			homeModel.setProperty("/form/DESCRIZIONE_AMM", item.DESCR_AMMINISTRAZIONE)
		},
		  onPressChoiceTablePG: function (oEvent) {
			let homeModel = this.getOwnerComponent().getModel("modelHome")
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
			let homeModel = this.getOwnerComponent().getModel("modelHome")
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
		handleCloseFinan: function (oEvent) {
			let homeModel = this.getOwnerComponent().getModel("modelHome")

			if(!oEvent.getParameter("selectedItem")){
				return;
			}
			
			let oSelectedItem = homeModel.getProperty(oEvent.getParameter("selectedItem").getBindingContextPath())
			homeModel.setProperty("/posFin", oSelectedItem.POSIZIONE_FINANZIARIA)
			homeModel.setProperty("/selectedPosFin", oSelectedItem)
			this.oDialogPosFin.close()
		},
		onGestisciPosFin: function (oEvent) {
			let homeModel = this.getOwnerComponent().getModel("modelHome")
			this.getView().byId("DetailInitial").setVisible(false)
			homeModel.setProperty("/onAvvio", true)
			homeModel.setProperty("/tabAnagrafica", true)
			homeModel.setProperty("/faseRicerca", false)
			homeModel.setProperty("/onModify", true)
			homeModel.setProperty("/onCreate", false)
			homeModel.setProperty("/detailAnagrafica", homeModel.getProperty("/selectedPosFin"))
			homeModel.setProperty("/PosFin", homeModel.getProperty("/selectedPosFin"))
			this.getView().byId("idCompetenzaTab").setVisible(true)
			this.getView().byId("idCassTab").setVisible(true)

			//lt chiudo il popup
			this.handlecloseInizialFilter();

		},
		onCreaPosFin: function(oEvent){
			let homeModel = this.getOwnerComponent().getModel("modelHome")
			this.getView().byId("DetailInitial").setVisible(false)
			homeModel.setProperty("/onAvvio", true)
			homeModel.setProperty("/tabAnagrafica", true)
			homeModel.setProperty("/onModify", false)
			homeModel.setProperty("/onCreate", true)
			homeModel.setProperty("/detailAnagrafica", {})
			this.getView().byId("idCompetenzaTab").setVisible(false)
			this.getView().byId("idCassTab").setVisible(false)

			//lt chiudo il popup
			this.handlecloseInizialFilter();
		},
		onExpandPopOverPosFin: function (oEvent) {
			var oButton = oEvent.getSource(),
			oView = this.getView();

			// create popover
			if (!this._pPopover) {
				this._pPopover = Fragment.load({
					id: oView.getId(),
					name: "zsap.com.r3.cobi.s4.comaccigb.view.fragment.PopOverPosizioneFinanziaria",
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
		onExpandPopOverDettStruttCentr: function (oEvent) {
			var oButton = oEvent.getSource(),
			oView = this.getView();

			if (!this._pPopoverStruttAmmCentr) {
				this._pPopoverStruttAmmCentr = Fragment.load({
					id: oView.getId(),
					name: "zsap.com.r3.cobi.s4.comaccigb.view.fragment.HVPosFin.PopOverStruttAmmCentrale",
					controller: this
				}).then(function(oPopover) {
					oView.addDependent(oPopover);
					return oPopover;
				});
			}
			this._pPopoverStruttAmmCentr.then(function(oPopover) {
				oPopover.openBy(oButton);
			});
		},
		__getStrutturaAmminCentrale: function (oPosFin) {
			let modelPosFin = this.getOwnerComponent().getModel("modelPosFin")
			let modelHana = this.getOwnerComponent().getModel("sapHanaS2")
			return new Promise( (resolve, reject) => {
				modelHana.read("/StrutturaAmministrativaCentraleSet", {
					filters: [	new Filter("Fikrs", FilterOperator.EQ, oPosFin.Fikrs),
								new Filter("Fase", FilterOperator.EQ, oPosFin.Fase),
								new Filter("Anno", FilterOperator.EQ, modelPosFin.getProperty("/infoSottoStrumento/AnnoSstr")),
								new Filter("Reale", FilterOperator.EQ, modelPosFin.getProperty("/infoSottoStrumento/Reale")),
								new Filter("Eos", FilterOperator.EQ, oPosFin.Eos),
								new Filter("Datbis", FilterOperator.GE,  new Date()),
								new Filter("Prctr", FilterOperator.EQ, oPosFin.Prctr),
								new Filter("CodiceCdr", FilterOperator.EQ, oPosFin.Cdr),
								new Filter("CodiceRagioneria", FilterOperator.EQ, oPosFin.Ragioneria),
								new Filter("CodiceUfficio", FilterOperator.EQ, '0000'),
					],
					success: (oData) =>  {
						modelPosFin.setProperty("/strutturaAmminCentrale", oData.results[0])
						resolve()
					}
				})
			})
		},
		onPressRipristinaRicerca: function (oEvent) {
			let homeModel = this.getOwnerComponent().getModel("modelHome")
			homeModel.setProperty("/faseRicerca", true)
			this.getView().byId("DetailInitial").setVisible(true)
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
					
			this.getOwnerComponent().getModel("modelHome").setProperty("/InfoPopoverTitle", customData.title); 
			this.getOwnerComponent().getModel("modelHome").setProperty("/InfoPopover", descrizione); 

			// create popover general	
			if (!this._pPopoverAction) {
				this._pPopoverAction = Fragment.load({
					id: oView.getId(),
					name: "zsap.com.r3.cobi.s4.comaccigb.view.fragment.PopOverInfoGeneral",
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
					name: "zsap.com.r3.cobi.s4.comaccigb.view.fragment.PopOverSottostrumento",
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
		__onGetTipoEsposizione: function (esp) {
			return 'NORMALE'
		},
		onExpandPopOverMiss: function (oEvent) {
			var oButton = oEvent.getSource(),
			oView = this.getView();

			// create popover
			if (!this._pPopoverMiss) {
				this._pPopoverMiss = Fragment.load({
					id: oView.getId(),
					name: "zsap.com.r3.cobi.s4.comaccigb.view.fragment.PopOverMissione",
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
					name: "zsap.com.r3.cobi.s4.comaccigb.view.fragment.PopOverProgramma",
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
					name: "zsap.com.r3.cobi.s4.comaccigb.view.fragment.PopOverAzione",
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
			let homeModel = this.getOwnerComponent().getModel("modelHome")
			 if(oEvent.getParameter("key") === "info"){
				homeModel.setProperty("/tabAnagrafica", true)
			} else if (oEvent.getParameter("key") === "attachments"){				
				
				//homeModel.setProperty("/tabAnagrafica", false)
			} else {
				this.showCassaSAC(oEvent);
				//this.loadIframe("cassaSac");
				//homeModel.setProperty("/tabAnagrafica", false)
			}

			
		},

		/* showCompetenzaSAC: function (oEvent) {
			this.loadIframe("competenzaSac");
		}, */

		showCassaSAC: async function (oEvent) {
			let that = this;
			await this.loadIframe("cassaSac");
			var url = that.getOwnerComponent().getModel("iframe").getProperty("/cassaSac");
			that.urlSac = url;

			let oCassaSac = this.getView().byId("cassaSac");
			document.getElementById(oCassaSac.getId()).setAttribute("src", that.urlSac);
			window.frames[0].location = that.urlSac + (new Date());
		},
		showCompetenzaSAC: async function (oEvent) {
			let that = this;
			//lt controllo prima che l'autorizzazione ci sia
			let oModelPosFin = this.getOwnerComponent().getModel("modelPosFin");
			let oAut = oModelPosFin.getProperty("/CompetenzaAuth");
			// LT DECOMMENTARE QUANDO LA SI VUOLE USARE
			 if(!oAut || !oAut.Auth || oAut.Auth === ""){
				this.openMessageBox("Error", "Errore campo Obbligatorio", "Manca l'autorizzazione per la competenza");
				return;
			}  
			await this.loadIframe("competenzaSac");
			// var oFrame = that.getView().byId(typeSac);
			var url = that.getOwnerComponent().getModel("iframe").getProperty("/competenzaSac");
			that.urlSac = url;
			// var oFrameContent = oFrame.$()[0];
			// oFrameContent.setAttribute("src", that.urlSac);
			// that._refresh();

			let oCompetenzaSac = this.getView().byId("competenzaSac");
			document.getElementById(oCompetenzaSac.getId()).setAttribute("src", that.urlSac);
			window.frames[0].location = that.urlSac + (new Date());
			// document.getElementById(oCompetenzaSac.getId()).setAttribute("src", 'https://initsac-svil.eu10.hcs.cloud.sap/sap/fpa/ui/app.html#/analyticapp&/aa/7AF01283AE3E6C449CAACA2C308F98EF')
			// window.frames[0].location = 'https://initsac-svil.eu10.hcs.cloud.sap/sap/fpa/ui/app.html#/analyticapp&/aa/7AF01283AE3E6C449CAACA2C308F98EF' + (new Date());
		},

		//lt inserisco popup iniziale.
		handleCreateInizialFilter: function (oEvent) {

			this.getOwnerComponent().getModel("modelHome").setProperty("/Filter",{
				nome 		: "",
				esercizio 	: "2023",
				descrizione : "",
				statoWf		: "Iniziato"
			})
			if (!this._handleAddFilter) {
				this._handleAddFilter = sap.ui.xmlfragment("zsap.com.r3.cobi.s4.comaccigb.view.fragment.FiltriIniziali", this);
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

			/* this.getOwnerComponent().getModel("generalModel").setProperty("/ValueNpshNew", {}); */
			this.getOwnerComponent().getModel("modelHome").setProperty("/Elenco",{
				nome 		: "",
				esercizio 	: "",
				descrizione : "",
				statoWf		: "Iniziato"
			})
			if (!this._handleAddElenco) {
				this._handleAddElenco = sap.ui.xmlfragment("zsap.com.r3.cobi.s4.comaccigb.view.fragment.AddElenco", this);
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

			/* this.getOwnerComponent().getModel("generalModel").setProperty("/ValueNpshNew", {}); */
			this.getOwnerComponent().getModel("modelHome").setProperty("/COFOG",{
				nome 		: "",
				esercizio 	: "",
				descrizione : "",
				statoWf		: "Iniziato"
			})
			if (!this._handleAddCOFOG) {
				this._handleAddCOFOG = sap.ui.xmlfragment("zsap.com.r3.cobi.s4.comaccigb.view.fragment.AddCOFOG", this);
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
				this._handleAddCOFOG = sap.ui.xmlfragment("zsap.com.r3.cobi.s4.comaccigb.view.fragment.AddCOFOG", this);
				this.getView().addDependent(this._handleAddCOFOG);
			}
			this._handleAddCOFOG.open();
		},


		initData: function () {

			//sap.ui.core.BusyIndicator.show();		
			var sapHanaS2Tipologiche = this.getOwnerComponent().getModel("sapHanaS2Tipologiche");

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
				"/ZES_ECONOMICA3_SET"/* ,
				"/ZES_PG_SET",
				"/ZES_CAPITOLO_SET"	 */			
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
							that.getOwnerComponent().getModel("modelHome").setProperty(propertyToSave, batchCallRel.__batchResponses[j].data.results);
							
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
		onNavBack: function () {		
			var oHistory = History.getInstance();
			var sPreviousHash = oHistory.getPreviousHash();

			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				var oRouter = this.getOwnerComponent().getRouter();
				oRouter.navTo("", {}, true);
			}
					
		},
		onAuth: async function (oEvent) {
			const modelPosFin = this.getView().getModel("modelPosFin")
			await this.__getLabels()
			modelPosFin.setProperty("/busyAuth", true)
			this.__getAuthorizzazioni()
			if(!this.oDialogAutorizzazioni) {
				Fragment.load({
					name:"zsap.com.r3.cobi.s4.comaccigb.view.fragment.HVAutorizzazioni",
					controller: this
				}).then(oDialog => {
					this.oDialogAutorizzazioni = oDialog;
					this.getView().addDependent(oDialog);
					this.oDialogAutorizzazioni.open();
				})
			} else {
				this.oDialogAutorizzazioni.open();
			}
		},
		__getAuthorizzazioni: function () {
			let modelHana = this.getOwnerComponent().getModel("sapHanaS2")
			let modelPosFin = this.getOwnerComponent().getModel("modelPosFin")
			let aFilters = [
				new Filter("Fikrs", FilterOperator.EQ, modelPosFin.getProperty("/PosFin/Fikrs")),
				new Filter("Anno", FilterOperator.EQ, modelPosFin.getProperty("/PosFin/Anno")),
				new Filter("Fase", FilterOperator.EQ,modelPosFin.getProperty("/PosFin/Fase")),
				new Filter("Reale", FilterOperator.EQ,modelPosFin.getProperty("/PosFin/Reale")),
				//new Filter("Versione", FilterOperator.EQ,modelPosFin.getProperty("/PosFin/Versione")),
				new Filter("Fipex", FilterOperator.EQ,modelPosFin.getProperty("/PosFin/Fipex"))
			]
			modelHana.read("/AutorizzazioniSet",{
				filters: aFilters,
				success: (oData) =>{
					debugger
					modelPosFin.setProperty("/busyAuth", false)
					modelPosFin.setProperty("/elencoAuth", oData.results)
				},
				error: (res) => {
					debugger
					modelPosFin.setProperty("/busyAuth", false)
				}
			})
		},
		onAuthCollegata: function (oEvent) {
			if(!this.oDialogAutorizzazioniCollegate) {
				Fragment.load({
					name:"zsap.com.r3.cobi.s4.comaccigb.view.fragment.HVAuthCollegata",
					controller: this
				}).then(oDialog => {
					this.oDialogAutorizzazioniCollegate = oDialog;
					this.getView().addDependent(oDialog);
					this.oDialogAutorizzazioniCollegate.open();
				})
			} else {
				this.oDialogAutorizzazioniCollegate.open();
			}
		},
		__getLabels: function () {
			let modelHana = this.getOwnerComponent().getModel("sapHanaS2")
			let modelPosFin = this.getOwnerComponent().getModel("modelPosFin")

			return new Promise((resolve, reject) => {
				modelHana.read("/TriennioCalendarioFinSet",{
					filters: [
							new Filter("FaseCal", FilterOperator.EQ, "DLB")
							],
					success: (oData) =>{
						modelPosFin.setProperty("/dispAnnoFaseLabel", oData.results[0].DispAnnoFase)
						modelPosFin.setProperty("/dispAnnoPlusOneLabel", oData.results[0].DispAnnoPlusOne)
						modelPosFin.setProperty("/dispAnnoPlusTwoLabel", oData.results[0].DispAnnoPlusTwo)
						resolve()
					},
					error: (res) => {
						resolve()
					}
				})
			})
		},
		handleConfirmAuth: function (oEvent) {
			let modelHome = this.getView().getModel("modelHome")
			let modelPosFin = this.getView().getModel("modelPosFin")
			let selectedItem = modelPosFin.getProperty(oEvent.getParameter("selectedItem").getBindingContextPath());
			if(modelPosFin.getProperty("/formCodingBlock/nuovaAuth"))
				modelPosFin.setProperty("/formCodingBlock/Auth", selectedItem.desc)
			else
				modelPosFin.setProperty("/CompetenzaAuth/Auth",selectedItem)
		},
		handleConfirmAuthCollegata: function (oEvent) {
			let modelHome = this.getOwnerComponent().getModel("modelHome")
			let selectedItem = modelHome.getProperty(oEvent.getParameter("selectedItem").getBindingContextPath());
			modelHome.setProperty("/CompetenzaAuth/AuthAssociata", selectedItem)
		},
		onResetAuth: function() {
			let modelPosFin = this.getOwnerComponent().getModel("modelPosFin")
			modelPosFin.setProperty("/CompetenzaAuth/AuthAssociata", null)
			modelPosFin.setProperty("/CompetenzaAuth/Auth", null)
		},
		onNuovaAuth: function() {
			let modelPosFin = this.getView().getModel("modelPosFin")
			modelPosFin.setProperty("/formCodingBlock/nuovaAuth", true)
			this.onGestisciCodingBlock()
		},
		onChooseNuovaAuth: function(oEvent) {
			let modelHome = this.getOwnerComponent().getModel("modelHome")
			let selectedItem = modelHome.getProperty(oEvent.getParameter("selectedItem").getBindingContextPath());
			modelHome.setProperty("/CompetenzaAuth/Auth", selectedItem.desc)
		},
		onGestisciCodingBlock:function () {
			let modelPosFin = this.getView().getModel("modelPosFin")
			modelPosFin.setProperty("/formCodingBlock/Auth", modelPosFin.getProperty("/CompetenzaAuth/Auth"))
			if(!this.FormCodingBlock) {
				Fragment.load({
					name:"zsap.com.r3.cobi.s4.comaccigb.view.fragment.FormCodingBlock",
					controller: this
				}).then(oDialog => {
					this.FormCodingBlock = oDialog;
					this.getView().addDependent(oDialog);
					this.FormCodingBlock.open();
				})
			} else {
				this.FormCodingBlock.open();
			}
		},
		resetFiltriCodingBlock: function(){
			let modelPosFin = this.getView().getModel("modelPosFin")
			modelPosFin.setProperty("/formCodingBlock/checkedPercentAps", false)
			modelPosFin.setProperty("/formCodingBlock/APS", null)
			modelPosFin.setProperty("/formCodingBlock/TcrC", null)
			modelPosFin.setProperty("/formCodingBlock/TcrF", null)
			modelPosFin.setProperty("/formCodingBlock/percentQuotaAggredibilita", null)
			if(modelPosFin.getProperty("/formCodingBlock/nuovaAuth")){
				modelPosFin.setProperty("/formCodingBlock/Auth", null)
			}
		},
		checkModifiableValue: function () {
			/* let bCheck = true
			const modelPosFin = this.getOwnerComponent().getModel("modelPosFin")
			if(modelPosFin.getProperty("/onModify")){
				if(modelPosFin.getProperty("/infoSottoStrumento/TipoEsposizione") === '2'){
					bCheck = false
				}
			}
			return bCheck; */
			//lt rendo non modificabile i campi
			return false
		}
	});
});