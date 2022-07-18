sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/core/Fragment",
	"sap/m/MessageBox"
], function(Controller, JSONModel, Filter, FilterOperator, Fragment, MessageBox) {
	"use strict";

	return Controller.extend("zsap.com.r3.cobi.s4.gestposfin.controller.DetailPosFin", {
		/**
		 * @override
		 */
		onInit: async function() {
			/* this.getOwnerComponent().setModel(new JSONModel({faseRicerca: true, infoSottoStrumento: {}}),"modelHome")
			let itemsMock = await this.loadJSONTest("/webapp/model/data_mock.json");
			// this.getOwnerComponent().getModel("modelHome").setProperty("/onAvvio",false)
			 this.getOwnerComponent().getModel("modelHome").setProperty("/initialDetail",true)
			this.getOwnerComponent().getModel("modelHome").setProperty("/",itemsMock)
			this.getOwnerComponent().getModel("modelHome").setProperty("/form",{})
			

			this.handleCreateInizialFilter();
			this.initData(); */
			let modelHome = this.getOwnerComponent().getModel("modelHome")
			modelHome.setProperty("/CompetenzaAuth", {})
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
					"zgestposfinzgestposfin.view.fragment.Sottostrumento",
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
					name:"zgestposfinzgestposfin.view.fragment.PosFinHelp",
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
					name:"zgestposfinzgestposfin.view.fragment." + value,
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
					name:"zgestposfinzgestposfin.view.fragment.TablePosizioneFinanziaria",
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
					name: "zgestposfinzgestposfin.view.fragment.PopOverPosizioneFinanziaria",
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
					name: "zgestposfinzgestposfin.view.fragment.PopOverInfoGeneral",
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
					name: "zgestposfinzgestposfin.view.fragment.PopOverSottostrumento",
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
					name: "zgestposfinzgestposfin.view.fragment.PopOverMissione",
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
					name: "zgestposfinzgestposfin.view.fragment.PopOverProgramma",
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
					name: "zgestposfinzgestposfin.view.fragment.PopOverAzione",
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
			} else {
				homeModel.setProperty("/tabAnagrafica", false)
			}
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
				this._handleAddFilter = sap.ui.xmlfragment("zgestposfinzgestposfin.view.fragment.FiltriIniziali", this);
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
				this._handleAddElenco = sap.ui.xmlfragment("zgestposfinzgestposfin.view.fragment.AddElenco", this);
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
				this._handleAddCOFOG = sap.ui.xmlfragment("zgestposfinzgestposfin.view.fragment.AddCOFOG", this);
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
				this._handleAddCOFOG = sap.ui.xmlfragment("zgestposfinzgestposfin.view.fragment.AddCOFOG", this);
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
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("RouteView");
					
		},
		onAuth: function (oEvent) {
			if(!this.oDialogAutorizzazioni) {
				Fragment.load({
					name:"zgestposfinzgestposfin.view.fragment.HVAutorizzazioni",
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
		onAuthCollegata: function (oEvent) {
			if(!this.oDialogAutorizzazioniCollegate) {
				Fragment.load({
					name:"zgestposfinzgestposfin.view.fragment.HVAuthCollegata",
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
		handleConfirmAuth: function (oEvent) {
			let modelHome = this.getOwnerComponent().getModel("modelHome")
			let selectedItem = modelHome.getProperty(oEvent.getParameter("selectedItem").getBindingContextPath());
			modelHome.setProperty("/CompetenzaAuth/Auth", selectedItem.desc)
		},
		handleConfirmAuthCollegata: function (oEvent) {
			let modelHome = this.getOwnerComponent().getModel("modelHome")
			let selectedItem = modelHome.getProperty(oEvent.getParameter("selectedItem").getBindingContextPath());
			modelHome.setProperty("/CompetenzaAuth/AuthAssociata", selectedItem.desc)
		},
		onResetAuth: function() {
			let modelHome = this.getOwnerComponent().getModel("modelHome")
			modelHome.setProperty("/CompetenzaAuth/AuthAssociata", null)
			modelHome.setProperty("/CompetenzaAuth/Auth", null)
		},
		onNuovaAuth: function() {
			if(!this.oDialogAssNuovaAuth) {
				Fragment.load({
					name:"zgestposfinzgestposfin.view.fragment.HVAssNuovaAuth",
					controller: this
				}).then(oDialog => {
					this.oDialogAssNuovaAuth = oDialog;
					this.getView().addDependent(oDialog);
					this.oDialogAssNuovaAuth.open();
				})
			} else {
				this.oDialogAssNuovaAuth.open();
			}
		},
		onChooseNuovaAuth: function(oEvent) {
			let modelHome = this.getOwnerComponent().getModel("modelHome")
			let selectedItem = modelHome.getProperty(oEvent.getParameter("selectedItem").getBindingContextPath());
			modelHome.setProperty("/CompetenzaAuth/Auth", selectedItem.desc)
		}
	});
});