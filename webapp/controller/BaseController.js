sap.ui.define([
	"sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function(
	Controller, JSONModel, Filter, FilterOperator
) {
	"use strict";

	return Controller.extend("zsap.com.r3.cobi.s4.comaccigb.controller.BaseController", {
        getRouter : function () {
            return this.getOwnerComponent().getRouter();
        },

        getText: function(text){
            return this.getOwnerComponent().getModel("i18n").getResourceBundle().getText(text);
        },

        __getAnnoFase: function () {
            let modelTopologiche = this.getOwnerComponent().getModel("sapHanaS2Tipologiche")  
            return new Promise((resolve, reject) => {
              modelTopologiche.read("/ZES_CAL_FIN_SET",{
                  filters: [new Filter("FASE", FilterOperator.EQ, "F")],
                  success: (oData) => {
                      resolve(oData.results[0].ANNO)
                  }
              })
            })
          },

        //lt -> ancora da tenere in standby
        writeAndRetrive: async function(item){

			var accantonamentoSelected = this.getOwnerComponent().getModel("modelHome").getProperty("/AccantonamentoSelected");
			var payload = {
				"SchedaSac" : "GESTIONE",
				"Zuser": "L.TARTAGGIA",
				"Esercizio": item.Esercizio,
				"Stato": parseInt(accantonamentoSelected.Stato),
				"ProgSessLavoro" : parseInt(item.ProgSessLavoro),
				"NomeSessione" : item.NomeSessione,
				"SemObj" : "ACCMASS"
				};

			return new Promise((resolve, reject) => {
			//lt creo il payload
				var oModel = this.getOwnerComponent().getModel("accantonamenti");
				var that = this;
				oModel.create("/UrlSacSet", payload, {
					success: function(oData, response) {

						//salvo il link che mi ritorna dalla funzione
						that.creaModelloLinkSAC(oData.Url);
						resolve();
					},
					error: function(error) {
						console.log(error);	
						reject(error);
					}
				});
			});
		},

        openMessageBox: function(sType, sTitle, sMessage, onYesAction, onNoAction){                
            let that = this;
            
            if(!this._oDialog){
                let bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
                let oSettings = {
                    type: sap.m.DialogType.Message,
                    styleClass: bCompact ? "sapUiSizeCompact" : "",
                };
            
                this._oDialog = new sap.m.Dialog(oSettings);
                this.getView().addDependent(this._oDialog);
            }                
            
            this._oDialog.destroyContent();
            this._oDialog.destroyButtons();
            
            this._oDialog.setState(sap.ui.core.ValueState[sType]);
            this._oDialog.setTitle(sTitle);
            this._oDialog.addContent( 
                new sap.m.Text({
                    text: sMessage
                }) 
            );
            
            that._oDialog.addButton(					
                new sap.m.Button({
                    text:"{i18n>Ok}",
                    type: sap.m.ButtonType.Emphasized,
                    press: (oEvent) => {
                        if(onYesAction)
                            onYesAction(oEvent);
                        that._oDialog.close();
                    },
                })
            );
            if(["Warning"].includes(sType)){
                that._oDialog.addButton(
                    new sap.m.Button({
                        text:"{i18n>Annulla}",
                        type: sap.m.ButtonType.Emphasized,
                        press: (oEvent) => {
                            if(onNoAction) 
                                onNoAction(oEvent);
                            that._oDialog.close();
                        }
                    })
                );
            }
            
            that._oDialog.open();    
        },

        __getHVAmministrazione: function (modelHana, modelPosFin, aDomAmministrazione) {
            let filtersAmm = [new Filter("Fikrs", FilterOperator.EQ, "S001"),
							new Filter("Fase", FilterOperator.EQ, "DLB"),
							new Filter("Anno", FilterOperator.EQ, modelPosFin.getProperty("/infoSottoStrumento/AnnoSstr")),
							new Filter("Reale", FilterOperator.EQ, modelPosFin.getProperty("/infoSottoStrumento/Reale"))
							]
            if(aDomAmministrazione.results.length > 0)
                filtersAmm.push(this.__getFiltersOR(aDomAmministrazione.results, "Prctr"))

			return new Promise((resolve, reject) => {
				modelHana.read("/TipAmministrazioneSet",{
					filters: filtersAmm,
					success: (oData) => {
						//debugger
						modelPosFin.setProperty("/formPosFin/amministrazioni", oData.results)
						resolve()
					},
					error:  (err) => {
						//debugger
						resolve(err)
					}
				})
			})
		},

        sorterHVDomSStr: function (a, b) {
			return Number(a) - Number(b)
		},
        sorterAmmByNumericCode: function (a,b) {
			const subStrAmm1 = Number(a.substring(1, a.length))
			const subStrAmm2 = Number(b.substring(1, a.length))
			return subStrAmm1 - subStrAmm2;
		},

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
            
        },
        getPosFin: function() {
            return {
                "helpValueAmministrazioni": [{
                        "VALORE": "A020",
                        "DESCRIZIONE": "MINISTERO DELL'ECONOMIA E DELLE FINANZE"
                    }, {
                        "VALORE": "B030",
                        "DESCRIZIONE": "MINISTERO DELLO SVILUPPO ECONOMICO"
                    }, {
                        "VALORE": "C040",
                        "DESCRIZIONE": "MINISTERO DEL LAVORO E DELLE POLITICHE SOCIALI"
                    }, {
                        "VALORE": "D050",
                        "DESCRIZIONE": "MINISTERO DELLA GIUSTIZIA"
                    }, {
                        "VALORE": "H090",
                        "DESCRIZIONE": "MINISTERO DELL'AMBIENTE E DELLA TUTELA DEL TORRITORIO"
                    }, {
                        "VALORE": "N150",
                        "DESCRIZIONE": "MINISTERO DELLA SALUTE"
                    }
                ],
                "helpValueMissioni": [{
                    "VALORE": "06",
                    "DESCRIZIONE": "Giustizia"
                }, {
                    "VALORE": "10",
                    "DESCRIZIONE": "Energia e diversificazione delle fonti energetiche"
                }, {
                    "VALORE": "11",
                    "DESCRIZIONE": "Competitivit?? e sviluppo delle imprese"
                }, {
                    "VALORE": "12",
                    "DESCRIZIONE": "Regolazione dei mercati"
                }, {
                    "VALORE": "15",
                    "DESCRIZIONE": "Comunicazioni"
                }, {
                    "VALORE": "17",
                    "DESCRIZIONE": "Ricerca e innovazione"
                }, {
                    "VALORE": "18",
                    "DESCRIZIONE": "Sviluppo sostenibile e tutela del territorio"
                }, {
                    "VALORE": "20",
                    "DESCRIZIONE": "Tutela della salute"
                }, {
                    "VALORE": "24",
                    "DESCRIZIONE": "Dirtti sociali"
                }, {
                    "VALORE": "25",
                    "DESCRIZIONE": "Politiche previdenziali"
                }, {
                    "VALORE": "26",
                    "DESCRIZIONE": "Politiche per il lavoro"
                }, {
                    "VALORE": "27",
                    "DESCRIZIONE": "Immigrazione, accoglienza e garanzia dei diritti"
                }, {
                    "VALORE": "32",
                    "DESCRIZIONE": "Servizi istituzionali e generali delle amministrazioni"
                }],
                "helpValueProgramma": [{
                    "VALORE": "01",
                    "DESCRIZIONE": "Amministrazione penitenziaria",
                    "MISSIONE": "06",
                    "DESCR_MISSIONE": "Giustizia"
                }, {
                    "VALORE": "02",
                    "DESCRIZIONE": "Giustizia civile e penale",
                    "MISSIONE": "06",
                    "DESCR_MISSIONE": "Giustizia"
                }, {
                    "VALORE": "03",
                    "DESCRIZIONE": "Giustizia minorile e di comunit??",
                    "MISSIONE": "06",
                    "DESCR_MISSIONE": "Giustizia"
                }, {
                    "VALORE": "06",
                    "DESCRIZIONE": "Servizi di gestione amministrativa per l'attivit??",
                    "MISSIONE": "06",
                    "DESCR_MISSIONE": "Giustizia"
                }, {
                    "VALORE": "07",
                    "DESCRIZIONE": "Promozione dell'efficienza energetica",
                    "MISSIONE": "10",
                    "DESCR_MISSIONE": "Energe e diversificazione delle fonti energetiche"
                }, {
                    "VALORE": "08",
                    "DESCRIZIONE": "Innovazione, reti energetiche, sicurezza in ambito",
                    "MISSIONE": "10",
                    "DESCR_MISSIONE": "Energe e diversificazione delle fonti energetiche"
                }, {
                    "VALORE": "05",
                    "DESCRIZIONE": "Promozione e attuazione di politiche di sviluppo",
                    "MISSIONE": "11",
                    "DESCR_MISSIONE": "Competitivit?? e sviluppo delle imprese"
                }, {
                    "VALORE": "06",
                    "DESCRIZIONE": "Vigilanza sul sistema operativo, sulla societ??",
                    "MISSIONE": "11",
                    "DESCR_MISSIONE": "Competitivit?? e sviluppo delle imprese"
                }, {
                    "VALORE": "04",
                    "DESCRIZIONE": "Vigilanza sui mercati e sui prodotti, promozione d",
                    "MISSIONE": "12",
                    "DESCR_MISSIONE": "Regolazione dei mercati"
                }, {
                    "VALORE": "05",
                    "DESCRIZIONE": "Pianificazione, regolamentazione tecnica",
                    "MISSIONE": "15",
                    "DESCR_MISSIONE": "Comunicazione"
                }, {
                    "VALORE": "18",
                    "DESCRIZIONE": "Ricerca, innovazione, tecnologie e servizi per lo",
                    "MISSIONE": "17",
                    "DESCR_MISSIONE": "Ricerca e innovazione"
                }, {
                    "VALORE": "05",
                    "DESCRIZIONE": "Promozione e valutazione dello sviluppo sostenibile",
                    "MISSIONE": "18",
                    "DESCR_MISSIONE": "Sviluppo sostenibile e tutela del territorio"
                }
            ],
            "helpValueAzione": [{
                    "VALORE": "01",
                    "DESCRIZIONE": "Ministro e Sottosegretari di Stato",
                    "AMMINISTRAZIONE": "A020",
                    "DESCR_AMMINISTRAZIONE": "MINISTERO DELL'ECONOMIA E DELLE FINANZE DEL MINISTERO",
                    "MISSIONE": "32",
                    "DESCR_MISSIONE": "Servizi istituzionali e generali delle amministrazioni",
                    "PROGRAMMA": "02",
                    "DESCR_PROGRAMMA": "Indirizzo politico"
                }, {
                    "VALORE": "01",
                    "DESCRIZIONE": "Spese di personale per il programma",
                    "AMMINISTRAZIONE": "B030",
                    "DESCR_AMMINISTRAZIONE": "MINISTERO DELLO SVILUPPO ECONOMICO",
                    "MISSIONE": "10",
                    "DESCR_MISSIONE": "Energia e diversificazione delel fonti energetiche",
                    "PROGRAMMA": "07",
                    "DESCR_PROGRAMMA": "Promozione delle'efficienza e dell'energia"
                }, {
                    "VALORE": "01",
                    "DESCRIZIONE": "Spese di personale per il programma",
                    "AMMINISTRAZIONE": "B030",
                    "DESCR_AMMINISTRAZIONE": "MINISTERO DELLO SVILUPPO ECONOMICO",
                    "MISSIONE": "10",
                    "DESCR_MISSIONE": "Energia e diversificazione delel fonti energetiche",
                    "PROGRAMMA": "08",
                    "DESCR_PROGRAMMA": "Innovazione, reti energetiche, sicurezza in ambito"
                }
                ],
                "helpValueCapitoli": [{
                    "AMMINISTRAZIONE": "A020",
                    "DESCR_AMMINISTRAZIONE": "MINISTERO DELL'ECONOMIA E DELLE FINANZE",
                    "CAPITOLO": "1001",
                    "DESCR_CAPITOLO": "SPESE PER ACQUISTO DI BENI E SERVIZI"
                }, {
                    "AMMINISTRAZIONE": "A020",
                    "DESCR_AMMINISTRAZIONE": "MINISTERO DELL'ECONOMIA E DELLE FINANZE",
                    "CAPITOLO": "1060",
                    "DESCR_CAPITOLO": "SPESE PER LA GESTIONE ED IL FUNZIONAMENTO DEL SIST"
                }, {
                    "AMMINISTRAZIONE": "A020",
                    "DESCR_AMMINISTRAZIONE": "MINISTERO DELL'ECONOMIA E DELLE FINANZE",
                    "CAPITOLO": "1248",
                    "DESCR_CAPITOLO": "SPESE PER ACQUISTO DI BENI E SERVIZI"
                }, {
                    "AMMINISTRAZIONE": "A020",
                    "DESCR_AMMINISTRAZIONE": "MINISTERO DELL'ECONOMIA E DELLE FINANZE",
                    "CAPITOLO": "1312",
                    "DESCR_CAPITOLO": "SOMME DA CORRISPONDERE A TITOLO DI EQUA RIPARAZION"
                }, {
                    "AMMINISTRAZIONE": "A020",
                    "DESCR_AMMINISTRAZIONE": "MINISTERO DELL'ECONOMIA E DELLE FINANZE",
                    "CAPITOLO": "1316",
                    "DESCR_CAPITOLO": "PENSIONI ED ASSEGNI DI GUERRA, ASSEGNI DI MEDAGLIA"
                }, {
                    "AMMINISTRAZIONE": "A020",
                    "DESCR_AMMINISTRAZIONE": "MINISTERO DELL'ECONOMIA E DELLE FINANZE",
                    "CAPITOLO": "1032",
                    "DESCR_CAPITOLO": "SPESE DI FUNZIONAMENTO DELL'ORGANISMO INDIPENDENTE"
                }, {
                    "AMMINISTRAZIONE": "A020",
                    "DESCR_AMMINISTRAZIONE": "MINISTERO DELL'ECONOMIA E DELLE FINANZE",
                    "CAPITOLO": "1037",
                    "DESCR_CAPITOLO": "SPESE PER LA GESTIONE ED IL FUNZIONAMENTO DEL SIST"
                }, {
                    "AMMINISTRAZIONE": "A020",
                    "DESCR_AMMINISTRAZIONE": "MINISTERO DELL'ECONOMIA E DELLE FINANZE",
                    "CAPITOLO": "1304",
                    "DESCR_CAPITOLO": "SPESE PER LE ESIGENZE CONNESSE ALLE ATTIVITA' DI A"
                }],
                "helpValuePg": [{
                    "AMMINISTRAZIONE": "A020",
                    "DESCR_AMMINISTRAZIONE": "MINISTERO DELL'ECONOMIA E DELLE FINANZE",
                    "PG": "01",
                    "DESCR_PG": "COMPONENTE NETTA",
                    "CAPITOLO": "1001",
                    "DESCR_CAPITOLO": "SOMME PER LE SPESE AMMINISTRATIVE E DI COMUNICAZIO"
                }, {
                    "AMMINISTRAZIONE": "A020",
                    "DESCR_AMMINISTRAZIONE": "MINISTERO DELL'ECONOMIA E DELLE FINANZE ",
                    "PG": "02",
                    "DESCR_PG": "GESTIONE PREGRESSA:",
                    "CAPITOLO": "1313",
                    "DESCR_CAPITOLO": "SOMMA DA CORRISPONDERE A TITOLO DI EQUA RIPARAZION"
                }, {
                    "AMMINISTRAZIONE": "A020",
                    "DESCR_AMMINISTRAZIONE": "MINISTERO DELL'ECONOMIA E DELLE FINANZE ",
                    "PG": "03",
                    "DESCR_PG": "RETI",
                    "CAPITOLO": "1060",
                    "DESCR_CAPITOLO": "SPESE PER LA GESTIONE ED IL FUNZIONAMENTO DEL SIST"
                }, {
                    "AMMINISTRAZIONE": "A020",
                    "DESCR_AMMINISTRAZIONE": "MINISTERO DELL'ECONOMIA E DELLE FINANZE ",
                    "PG": "07",
                    "DESCR_PG": "FITTO PER I LOCALI IN USO AL DIPARTIMENTO DELL'AMM",
                    "CAPITOLO": "1257",
                    "DESCR_CAPITOLO": "SPESE PER ACQUISTO DI BENI E SERVIZI"
                }, {
                    "AMMINISTRAZIONE": "A020",
                    "DESCR_AMMINISTRAZIONE": "MINISTERO DELL'ECONOMIA E DELLE FINANZE ",
                    "PG": "30",
                    "DESCR_PG": "ONERI DIVERSI, SERVIZI AUSILIARI E TASSE PER I MEZ",
                    "CAPITOLO": "1031",
                    "DESCR_CAPITOLO": "SPESE PER ACQUISTO DI BENI E SERVIZI"
                }, {
                    "AMMINISTRAZIONE": "A020",
                    "DESCR_AMMINISTRAZIONE": "MINISTERO DELL'ECONOMIA E DELLE FINANZE ",
                    "PG": "13",
                    "DESCR_PG": "SPESE POSTALI E TELEGRAFICHE",
                    "CAPITOLO": "1031",
                    "DESCR_CAPITOLO": "SPESE PER ACQUISTO DI BENI E SERVIZI"
                }
            ],
            "helpValueCategoria":[{
                "VALORE": "01",
                "DESCRIZIONE": "REDDITI DA LAVORO DIPENDENTE",
                "AMMINISTRAZIONE": "D050",
                "DESCR_AMMINISTRAZIONE": "MINISTERO DELLA GIUSTIZIA"
            }, {
                "VALORE": "02",
                "DESCRIZIONE": "CONSUMI INTERMEDI",
                "AMMINISTRAZIONE": "D050",
                "DESCR_AMMINISTRAZIONE": "MINISTERO DELLA GIUSTIZIA"
            }, {
                "VALORE": "03",
                "DESCRIZIONE": "IMPOSTE PAGATE SULLA PRODUZIONE",
                "AMMINISTRAZIONE": "B030",
                "DESCR_AMMINISTRAZIONE": "MINISTERO DELLO SVILUPPO ECONOMICO"
            }, {
                "VALORE": "04",
                "DESCRIZIONE": "TRASFERIMENTI CORRENTI AD AMMINISTRAZIONI PUBBLICHE",
                "AMMINISTRAZIONE": "N150",
                "DESCR_AMMINISTRAZIONE": "MINISTERO DELLA SALUTE"
            }, {
                "VALORE": "05",
                "DESCRIZIONE": "STRASFERIMENTI CORRENTI A FAMIGLIE E ISTRUZIONI",
                "AMMINISTRAZIONE": "N150",
                "DESCR_AMMINISTRAZIONE": "MINISTERO DELLA SALUTE"
            }, {
                "VALORE": "06",
                "DESCRIZIONE": "TRASFERIMENTI CORRENTI A IMPRESE",
                "AMMINISTRAZIONE": "B030",
                "DESCR_AMMINISTRAZIONE": "MINISTERO DELLO SVILUPPO ECONOMICO"
            }, {
                "VALORE": "07",
                "DESCRIZIONE": "STRASFERIMENTI CORRENTI A ESTERO",
                "AMMINISTRAZIONE": "B030",
                "DESCR_AMMINISTRAZIONE": "MINISTERO DELLO SVILUPPO ECONOMICO"
            }
            
            ],
            "helpValueGestioneContratto": [{
                "VALORE": "0",
                "DESCRIZIONE": "Contratto obbligatorio"
            }, {
                "VALORE": "1",
                "DESCRIZIONE": "Contratto non obbligatorio"
            }],
             "elencoPosFin": [{
                "POSIZIONE_FINANZIARIA": "S020100101.320201.010101",
                "AMMINISTAZIONE": "A020",
                "DESC_AMMINISTAZIONE": "MINISTERO DELL'ECONOMIA E DELLE FINANZE",
                "MISSIONE": "32",
                "DESC_MISSIONE": "Servizi istituzionali e generali delle amministrazioni pubbliche",
                "PROGRAMMA": "02",
                "DESC_PROGRAMMA": "Indirizzo pubblico",
                "AZIONE": "01",
                "DESC_AZIONE": "Ministro e Sottosegretari di Stato",
                "CAPITOLO": "1001",
                "DESC_CAPITOLO": "STIPENDI ED ALTRI ASSEGNI FISSI AL MINISTRO E AI SOTTOSEGRETARI DI STATO AL NETTO DELL'IMPOSTA REGIO",
                "PG": "01",
                "DESC_PG_ESTESA": "COMPONENTE NETTA.",
                "CATEGORIA": "01",
                "DESC_CATEGORIA": "REDDITI DI LAVORO DIPENDENTE",
                "CE2": "01",
                "DESC_CE2": "RETRIBUZIONI LORDE DI DENARO",
                "CE3": "01",
                "DESC_CE3": "STIPENDI"
            }],
             "elencoAuth": [
                {"desc": "LF n. 550/1995 art. 2, comma 11", "attivazione": "1996", "scadenza": "9999", "classificazione": "OL", "natura": "ORG", "DISP1": "250.623,00", "DISP2": "250.623,00", "DISP3": "250.623,00", "BASE": "Base"}
             ],
             "elencoAuthCollegata": [
                {"desc": "LF n. 550/1995 art. 2, comma 11", "tipo": "Definanziante", "codeCls": "Ol"},
                {"desc": "LF n. 289/2002 art. 33", "tipo": "Rifinanziante", "codeCls": "Ol"},
                {"desc": "LB n. 160/2019 art. 1, comma 154", "tipo": "Ridinanziante", "codeCls": "Ol"},
                {"desc": "LB n. 160/2019 art. 1, comma 422", "tipo": "Rifinanziante", "codeCls": "Ol"},
                {"desc": "LB n. 160/2019 art. 1, comma 422", "tipo": "Rifinanziante", "codeCls": "Ol"},
                {"desc": "LB n. 178/2020 art. 1, comma 866", "tipo": "Rifinanziante", "codeCls": "Ol"}
             ],
             "nuoveAuth": [
                {"desc": "LF n. 550/1995 art. 2, comma 11", "tipo": "Definanziante"},
                {"desc": "LF n. 550/1995 art. 2, comma 11", "tipo": "Definanziante"},
                {"desc": "LF n. 550/1995 art. 2, comma 11", "tipo": "Definanziante"}
             ]
            }

        }
	});
});