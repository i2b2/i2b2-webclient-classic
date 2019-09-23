/**
 * @projectDescription	i2b2 web client UI configuration information & display functions
 * @inherits 	i2b2
 * @namespace	i2b2.UI
 * @author		Nich Wattanasin
 * @version 	1.7.08
 * ----------------------------------------------------------------------------------------
 * updated 9-7-16: Initial Launch
 */
 
 
i2b2.UI = {};
/* Start Configuration. Note: be careful to keep trailing commas after each parameter */
i2b2.UI.cfg = {
	
	titleLogoSrc : "assets/images/title.gif", /* [Default: "assets/images/title.gif"] 246x26 pixel logo */
	loginHeaderText : "i2b2 Login",  /* [Default: "i2b2 Login"] Text in the header bar of the login box */
	loginUsernameText : "Username:", /* [Default: "Username:"] Text for the username input of the login box */
	loginDefaultUsername : "demo", /* [Default: "demo"] Default text inside the username input */
	loginPasswordText : "Password:", /* [Default: "Password:"] Text for the password input of the login box */
	loginDefaultPassword : "demouser", /* [Default: "demouser"] Default text inside the password input */
	loginHostText : "i2b2 Host:", /* [Default: "i2b2 Host:"] Text for the PM cell dropdown of the login box */
	obfuscatedDisplayNumber: 3, /* [Default: 3] Display number after plus/minus for obfuscated results.
								  Control the real obfuscation value from server in CRC properties. */
	useFloorThreshold: false, /* [Default: false] If true, any result below floorThresholdNumber shows as 'Less Than {floorThresholdNumber}' */	  
	floorThresholdNumber: 10, /* [Default: 10] Threshold for low number of results */
	floorThresholdText: "Less Than ", // [Default: "Less Than "] Text that is prefixed before floorThresholdNumber (include trailing space)
	useExpandedLabFlags: false
};
/* End Configuration */

function initI2B2_UI() {
	if(i2b2.UI.cfg.hasOwnProperty('titleLogoSrc')){
		document.getElementById('topBarTitle').src = i2b2.UI.cfg.titleLogoSrc;
	}
}