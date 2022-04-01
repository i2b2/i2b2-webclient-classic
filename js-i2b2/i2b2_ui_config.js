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
    titleLogoSrc: "assets/images/title.gif", /* [Default: "assets/images/title.gif"] 246x26 pixel logo */
    loginHeaderText: "i2b2 Login", /* [Default: "i2b2 Login"] Text in the header bar of the login box */
    loginUsernameText: "Username:", /* [Default: "Username:"] Text for the username input of the login box */
    loginDefaultUsername: "demo", /* [Default: "demo"] Default text inside the username input */
    loginPasswordText: "Password:", /* [Default: "Password:"] Text for the password input of the login box */
    loginDefaultPassword: "demouser", /* [Default: "demouser"] Default text inside the password input */
    loginHostText: "i2b2 Host:", /* [Default: "i2b2 Host:"] Text for the PM cell dropdown of the login box */
    loginIdp: "SimpleSAMLphp", /* Text for federated login button */
    loginIdpIcon: "assets/img/ssplogo-fish-2.svg", /* Location of the 16x16 icon */
    obfuscatedDisplayNumber: 3, /* [Default: 3] Display number after plus/minus for obfuscated results.
     Control the real obfuscation value from server in CRC properties. */
    useFloorThreshold: false, /* [Default: false] If true, any result below floorThresholdNumber shows as 'Less Than {floorThresholdNumber}' */
    floorThresholdNumber: 10, /* [Default: 10] Threshold for low number of results */
    floorThresholdText: "Less Than ", // [Default: "Less Than "] Text that is prefixed before floorThresholdNumber (include trailing space)
    useExpandedLabFlags: false,
    termsCondition: "Terms & Conditions\n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. Ut nec volutpat lorem. Donec augue lacus, vulputate nec arcu a, iaculis viverra felis. Integer sed suscipit risus. Donec ut mauris efficitur, dignissim sapien eget, accumsan libero. Quisque pretium auctor feugiat. Duis eu vulputate odio, eu aliquam velit. Integer sem leo, sagittis sit amet nibh a, auctor elementum ex. Pellentesque ut massa dapibus, sollicitudin turpis sed, pharetra est. Cras sodales blandit lorem a finibus. Sed nibh mi, euismod ut libero et, hendrerit maximus enim. Cras dignissim feugiat nunc, non fringilla sapien porttitor vel. Nullam lobortis sed sem sed laoreet. Praesent lorem leo, efficitur id viverra in, luctus et lectus. Nunc eros risus, tempus ac iaculis eu, aliquam ac mauris. Donec id risus nisi. Maecenas neque dui, porttitor non porttitor non, tincidunt nec ligula."
};
/* End Configuration */

function initI2B2_UI() {
    if (i2b2.UI.cfg.hasOwnProperty('titleLogoSrc')) {
        document.getElementById('topBarTitle').src = i2b2.UI.cfg.titleLogoSrc;
    }
}
