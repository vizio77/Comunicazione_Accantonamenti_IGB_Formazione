/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"zsap.com.r3.cobi.s4.comaccigb/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
