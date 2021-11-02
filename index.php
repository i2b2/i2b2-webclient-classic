<?php
session_start();

$_SESSION["shib-session-id"] = filter_input(INPUT_SERVER, 'AJP_Shib-Session-ID', FILTER_SANITIZE_STRING);
$_SESSION["eppn"] = filter_input(INPUT_SERVER, 'AJP_eduPersonPrincipalName', FILTER_SANITIZE_STRING);

$error_msg;
if (isset($_SESSION['error_msg'])) {
    $error_msg = $_SESSION['error_msg'];
    unset($_SESSION['error_msg']);
}

$success_msg;
if (isset($_SESSION['success_msg'])) {
    $success_msg = $_SESSION['success_msg'];
    unset($_SESSION['success_msg']);
}

/* * **************************************************************

  PHP-BASED I2B2 PROXY "CELL"

  (does not use SimpleXML library)

  Author: Nick Benik
  Contributors: Nich Wattanasin
  Mike Mendis
  Last Revised: 03-06-19

 * ****************************************************************

  This file acts as a simple i2b2 proxy cell.  If no variables have been sent it is assumed that the request is from a
  user's Web browser requesting the default page for the current directory.  In this case, this file will read the
  contents of the default.htm file and return its contents to the browser via the current HTTP connection.

  New Feature: 01-27-16 (nw096):
  - the $WHITELIST has been reworked to read i2b2_config_data.js and detect the hostname of where i2b2 lives
  - the hostname that the web client is running on is also added to the $WHITELIST, in case i2b2 lives there

 * * If there are other cells/URLs that you connect to that is not where your PM Cell lives, you will need
  to add that server's hostname to the $WHITELIST array below.

  Update: 05-03-17 (nw096):
  - the automatic detection of $WHITELIST URLs from i2b2_config_data.js now supports ports (bug fix)

 */

$pmURL = "http://127.0.0.1:8080/i2b2/rest/PMService/getServices";
$pmCheckAllRequests = false;

$WHITELIST = array(
    "http" . (($_SERVER['SERVER_PORT'] == '443') ? 's' : '' ) . "://" . $_SERVER['HTTP_HOST'],
    "http://services.i2b2.org",
    "http://127.0.0.1:9090",
    "http://127.0.0.1:8080",
    "http://127.0.0.1",
    "http://localhost:8080",
    "http://localhost:9090",
    "http://localhost",
    "http://i2b2-core-server-saml-demo:8080",
    "http://i2b2-core-server-saml-demo:9090",
    "http://i2b2-core-server-saml-demo"
);

$BLACKLIST = array(
    "http://127.0.0.1:9090/test",
    "http://localhost:9090/test",
    "http://i2b2-core-server-saml-demo:9090/test"
);

// There is nothing to configure below this line

$matches = array();
//$config_file = fopen("i2b2_config_data.js", "r");
//if ($config_file) {
//    while (($line = fgets($config_file)) !== false) {
//        if (strpos($line, "urlCellPM:") !== false)
//            $matches[] = $line;
//    }
//    fclose($config_file);
//}
$i2b2_config_data = json_decode(file_get_contents("i2b2_config_data.json"), true);
if ($i2b2_config_data) {
    foreach ($i2b2_config_data['lstDomains'] as $domain) {
        $matches[] = $domain['urlCellPM'];
    }
}

foreach ($matches as $match) {
    $match = preg_replace('/\s+/', '', $match); // remove all whitespace
    $match = rtrim($match, ','); // remove trailing comma, if any
    $regex = "/(http|https)\:\/\/[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,5}(\:[0-9]{2,5})*\/?/";
    if (preg_match($regex, $match, $url)) { // match hostname
        array_push($WHITELIST, $url[0]);
    }
}

$PostBody = file_get_contents("php://input");
if (!empty($PostBody)) {
    // Process the POST for proxy redirection
    // Validate that POST data is XML and extract <proxy> tag
    $startPos = strpos($PostBody, "<redirect_url>") + 14;
    $endPos = strpos($PostBody, "</redirect_url>", $startPos);
    $proxyURL = substr($PostBody, $startPos, ($endPos - $startPos));
    $newXML = $PostBody;

    // Do not allow DOCTYPE declarations
    $replace_match = '/^.*(?:!DOCTYPE).*$(?:\r\n|\n)?/m';
    if (preg_match($replace_match, $newXML)) {
        exit('DOCTYPE not allowed to be proxied');
    }

    if ($pmCheckAllRequests) {
        error_log("Searhing for Security in " . $PostBody);
        //Validate that user is valid against known PM

        preg_match("/<security(.*)?>(.*)?<\/security>/", $PostBody, $proxySecurity);

        error_log("My Security is " . $proxySecurity[1]);
        preg_match("/<domain(.*)?>(.*)?<\/domain>/", $proxySecurity[0], $proxyDomain);
        preg_match("/<username(.*)?>(.*)?<\/username>/", $proxySecurity[0], $proxyUsername);
        preg_match("/<password(.*)?>(.*)?<\/password>/", $proxySecurity[0], $proxyPassword);

        $checkPMXML = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?><i2b2:request xmlns:i2b2=\"http://www.i2b2.org/xsd/hive/msg/1.1/\" xmlns:pm=\"http://www.i2b2.org/xsd/cell/pm/1.1/\"> <message_header> <i2b2_version_compatible>1.1</i2b2_version_compatible> <hl7_version_compatible>2.4</hl7_version_compatible> <sending_application> <application_name>i2b2 Project Management</application_name> <application_version>1.1</application_version> </sending_application> <sending_facility> <facility_name>i2b2 Hive</facility_name> </sending_facility> <receiving_application> <application_name>Project Management Cell</application_name> <application_version>1.1</application_version> </receiving_application> <receiving_facility> <facility_name>i2b2 Hive</facility_name> </receiving_facility> <datetime_of_message>2007-04-09T15:19:18.906-04:00</datetime_of_message> <security> " . $proxyDomain[0] . $proxyUsername[0] . $proxyPassword[0] . " </security> <message_control_id> <message_num>0qazI4rX6SDlQlk46wqQ3</message_num> <instance_num>0</instance_num> </message_control_id> <processing_id> <processing_id>P</processing_id> <processing_mode>I</processing_mode> </processing_id> <accept_acknowledgement_type>AL</accept_acknowledgement_type> <application_acknowledgement_type>AL</application_acknowledgement_type> <country_code>US</country_code> <project_id>undefined</project_id> </message_header> <request_header> <result_waittime_ms>180000</result_waittime_ms> </request_header> <message_body> <pm:get_user_configuration> <project>undefined</project> </pm:get_user_configuration> </message_body></i2b2:request>";
        // Process the POST for proxy redirection



        error_log($checkPMXML, 0);
        error_log("My proxy: " . $proxyURL, 0);
    }

    // ---------------------------------------------------
    //   white-list processing on the URL
    // ---------------------------------------------------
    $isAllowed = false;
    $requestedURL = strtoupper($proxyURL);
    foreach ($WHITELIST as $entryValue) {
        $checkValue = strtoupper(substr($requestedURL, 0, strlen($entryValue)));
        if ($checkValue == strtoupper($entryValue)) {
            $isAllowed = true;
            break;
        }
    }
    if (!$isAllowed) {
        // security as failed - exit here and don't allow one more line of execution the opportunity to reverse this
        die("The proxy has refused to relay your request.");
    }
    // ---------------------------------------------------
    //   black-list processing on the URL
    // ---------------------------------------------------
    foreach ($BLACKLIST as $entryValue) {
        $checkValue = strtoupper(substr($requestedURL, 0, strlen($entryValue)));
        if ($checkValue == strtoupper($entryValue)) {
            // security as failed - exit here and don't allow one more line of execution the opportunity to reverse this
            die("The proxy has refused to relay your request.");
        }
    }

    if ($pmCheckAllRequests) {
        // open the URL and forward the new XML in the POST body
        $proxyRequest = curl_init($pmURL);

        // these options are set for hyper-vigilance purposes
        curl_setopt($proxyRequest, CURLOPT_COOKIESESSION, 0);
        curl_setopt($proxyRequest, CURLOPT_FORBID_REUSE, 1);
        curl_setopt($proxyRequest, CURLOPT_FRESH_CONNECT, 0);
        // Specify NIC to use for outgoing connection, fixes firewall+DMZ headaches
        // curl_setopt($proxyRequest, CURLOPT_INTERFACE, "XXX.XXX.XXX.XXX");
        // other options
        curl_setopt($proxyRequest, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($proxyRequest, CURLOPT_CONNECTTIMEOUT, 900);        // wait 15 minutes
        // data to proxy thru
        curl_setopt($proxyRequest, CURLOPT_POST, 1);
        curl_setopt($proxyRequest, CURLOPT_POSTFIELDS, $checkPMXML);
        // SEND REQUEST!!!
        curl_setopt($proxyRequest, CURLOPT_HTTPHEADER, array('Expect:', 'Content-Type: text/xml'));
        $proxyResult = curl_exec($proxyRequest);
        // cleanup cURL connection
        curl_close($proxyRequest);
        error_log("My PM Result " . $proxyResult);

        $pattern = "/<status type=\"ERROR\">/i";
        //Check if request is valid
        if (preg_match($pattern, $proxyResult)) {
            error_log("Local PM denied request");
            die("Local PM server could not validate the request.");
        }
    }

    // open the URL and forward the new XML in the POST body
    $proxyRequest = curl_init($proxyURL);

    curl_setopt($proxyRequest, CURLOPT_SSL_VERIFYPEER, FALSE);
    // these options are set for hyper-vigilance purposes
    curl_setopt($proxyRequest, CURLOPT_COOKIESESSION, 0);
    curl_setopt($proxyRequest, CURLOPT_FORBID_REUSE, 1);
    curl_setopt($proxyRequest, CURLOPT_FRESH_CONNECT, 0);
    // Specify NIC to use for outgoing connection, fixes firewall+DMZ headaches
    // curl_setopt($proxyRequest, CURLOPT_INTERFACE, "XXX.XXX.XXX.XXX");  
    // other options
    curl_setopt($proxyRequest, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($proxyRequest, CURLOPT_CONNECTTIMEOUT, 900);  // wait 15 minutes
    // data to proxy thru
    curl_setopt($proxyRequest, CURLOPT_POST, 1);
    curl_setopt($proxyRequest, CURLOPT_POSTFIELDS, $newXML);
    // SEND REQUEST!!!
    $headers = array('Expect:', 'Content-Type: text/xml');
    foreach ($_SERVER as $key => $value) {
        if (substr($key, 0, 4) === "AJP_") {
            $header = str_replace('AJP_', 'X-', $key) . ": " . $value;
            array_push($headers, $header);
        }
    }

    curl_setopt($proxyRequest, CURLOPT_HTTPHEADER, $headers);
//    curl_setopt($proxyRequest, CURLOPT_HTTPHEADER, array('Expect:', 'Content-Type: text/xml'));
    $proxyResult = curl_exec($proxyRequest);
    // cleanup cURL connection
    curl_close($proxyRequest);

    // perform any analysis or processing on the returned result here
    header("Content-Type: text/xml", true);
    print($proxyResult);
} else {
    ?>
    <!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN">
    <html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
        <head>
            <meta http-equiv="X-UA-Compatible" content="IE=8,11"/>
            <title>i2b2 Web Client</title>
            <!--
             *  *************************
             *       i2b2 Web Client
             *           v1.7.12a
             *  ************************* 
             *  @modified: 5/1/20
             *  Contributors:
             *     Nick Benik
             *     Griffin Weber, MD, PhD
             *     Mike Mendis
             *     Shawn Murphy MD, PhD
             *     David Wang
             *     Hannah Murphy
             *     Nich Wattanasin
             *     Bhaswati Ghosh
             *	   Jeffrey Klann, PhD
             *
             */-->

            <link rel="stylesheet" href="assets/bootstrap/css/bootstrap.min.css" />

            <script type="text/javascript">
                var i2b2build = "1.7.12a   [5/1/20 12:00 PM] ";

                function handleAgreeChbx(chbx) {
                    let selectOpt = document.getElementById("logindomain");
                    let domain = i2b2.PM.model.Domains[selectOpt.value];
                    let authMethod = domain.authenticationMethod.toLowerCase();
                    if (authMethod === 'saml') {
                        [].forEach.call(document.getElementsByClassName('register_btn'), e => e.disabled = false);
                    } else {
                        [].forEach.call(document.getElementsByClassName('register_btn'), e => e.disabled = !chbx.checked);
                    }
                }

                function showAlert(msg) {
                    if (msg.length > 0) {
                        alert(msg);
                    }
                }
            </script>

            <!-- This turns off debugging messages. Developers - comment this out to turn them back on! -->
            <script type="text/javascript" src="js-ext/firebug/firebugx.js"></script>

            <!-- LOAD YUI FROM Yahoo's CDN
            <script type="text/javascript" src="http://yui.yahooapis.com/2.5.2/build/yahoo/yahoo.js" ></script>
            <script type="text/javascript" src="http://yui.yahooapis.com/2.5.2/build/event/event.js" ></script>
            <script type="text/javascript" src="http://yui.yahooapis.com/2.5.2/build/dom/dom.js"></script>
            ... etc ...
            -->

            <!-- LOAD YUI FROM local server -->
            <script type="text/javascript" src="js-ext/yui/build/yahoo/yahoo.js" ></script>
            <script type="text/javascript" src="js-ext/yui/build/event/event.js" ></script>
            <script type="text/javascript" src="js-ext/yui/build/dom/dom.js"></script>
            <script type="text/javascript" src="js-ext/yui/build/yuiloader/yuiloader.js"></script>
            <script type="text/javascript" src="js-ext/yui/build/dragdrop/dragdrop.js" ></script>
            <script type="text/javascript" src="js-ext/yui/build/element/element.js"></script>
            <script type="text/javascript" src="js-ext/yui/build/container/container_core.js"></script>
            <script type="text/javascript" src="js-ext/yui/build/container/container.js"></script>
            <script type="text/javascript" src="js-ext/yui/build/resize/resize.js"></script>
            <script type="text/javascript" src="js-ext/yui/build/utilities/utilities.js"></script>
            <script type="text/javascript" src="js-ext/yui/build/menu/menu.js" ></script>
            <script type="text/javascript" src="js-ext/yui/build/calendar/calendar.js"></script>
            <script type="text/javascript" src="js-ext/yui/build/treeview/treeview.js" ></script>
            <script type="text/javascript" src="js-ext/yui/build/tabview/tabview.js"></script>
            <script type="text/javascript" src="js-ext/yui/build/animation/animation.js"></script>
            <script type="text/javascript" src="js-ext/yui/build/datasource/datasource.js"></script>
            <script type="text/javascript" src="js-ext/yui/build/yahoo-dom-event/yahoo-dom-event.js"></script>
            <script type="text/javascript" src="js-ext/yui/build/json/json-min.js"></script>
            <script type="text/javascript" src="js-ext/yui/build/datatable/datatable.js"></script>
            <script type="text/javascript" src="js-ext/yui/build/button/button.js"></script>
            <script type="text/javascript" src="js-ext/yui/build/paginator/paginator-min.js"></script>
            <script type="text/javascript" src="js-ext/yui/build/slider/slider-min.js"></script>
            <!--
                            <link rel="stylesheet" type="text/css" href="http://yui.yahooapis.com/combo?2.6.0/build/assets/skins/sam/skin.css"> 
            -->
            <link rel="stylesheet" type="text/css" href="js-ext/yui/build/assets/skins/sam/skin.css">
            <link rel="stylesheet" type="text/css" href="js-i2b2/ui.styles/ui.styles.css">

            <!-- Load Moment.js for parsing and formatting date/time -->
            <script type="text/javascript" src="js-ext/moment.min.js"></script>
            <link type="text/css" href="js-i2b2/cells/CRC/assets/query_report.css" rel="stylesheet" />

            <!-- Bug in IE - use MINIMUM number of LINK and STYLE tags in the DOM as possible: http://support.microsoft.com/kb/262161 -->
            <style>
                @import url(js-ext/yui/build/fonts/fonts-min.css);
                @import url(js-ext/yui/build/tabview/assets/skins/sam/tabview.css);
                @import url(js-ext/yui/build/menu/assets/skins/sam/menu.css);
                @import url(js-ext/yui/build/button/assets/skins/sam/button.css);
                @import url(js-ext/yui/build/container/assets/skins/sam/container.css);
                @import url(js-ext/yui/build/container/assets/container.css);
                @import url(js-ext/yui/build/calendar/assets/calendar.css);
                @import url(js-ext/yui/build/treeview/assets/treeview-core.css);
                @import url(js-ext/yui/build/resize/assets/skins/sam/resize.css);
                @import url(assets/mod-treeview.css);
                @import url(assets/help_viewer.css);
                @import url(assets/msg_sniffer.css);

                *,
                *::before,
                *::after {
                    box-sizing: content-box;
                }

                #i2b2_login_modal_dialog *,#signup * {
                    box-sizing: border-box;
                }

                textarea#terms {
                    width:100%!important;
                    border: 1px solid #000;
                    background: #f2f2f2;
                    font: normal arial;
                    color: #333;
                    resize: none;
                }

                .btn-local {
                    color: #fff;
                    background-color: #6887aa;
                    border-color: #6887aa;
                }
                .btn-local:hover {
                    color: #fff;
                    background-color: #677cab;
                    border-color: #6887aa;
                }
                .btn-idp {
                    color: #fff;
                    background-color: #d54736;
                    border-color: #d54736;
                }
                .btn-idp:hover {
                    color: #fff;
                    background-color: #bb3c2e;
                    border-color: #d54736;
                }
            </style>
            <script type="text/javascript" src="js-ext/idle-timer.js"></script>
            <script type="text/javascript" src="js-ext/YUI_DataTable_PasswordCellEditor.js"></script>
            <script type="text/javascript" src="js-ext/YUI_DataTable_MD5CellEditor.js"></script>

            <!--  External libraries -->
            <script type="text/javascript" src="js-ext/prototype.js"></script>
            <script type="text/javascript" src="js-ext/excanvas.js"></script>
            <script type="text/javascript" src="js-ext/bubbling-min.js"></script>
            <script type="text/javascript" src="js-ext/accordion-min.js"></script>
            <style type="text/css">
                .myAccordion {
                    float: left;
                    width: 260px;
                    float: left;
                }
                .myAccordion .yui-cms-accordion {
                    width: 230px;
                    position: relative;
                    z-index: 10000;
                }
                .myAccordion .moreinfo {
                    padding-left: 30px;
                }
                .myAccordion .yui-cms-accordion .yui-cms-item {
                    list-style-type: none;
                    float: left;
                    display: inline;
                    width: auto;
                }
                .myAccordion .yui-cms-accordion .yui-cms-item .accordionToggleItem {
                    width: 1px;
                    height: 1px;
                    display: block;
                    background: url(assets/images/accordion.gif) no-repeat 0px -200px;
                    text-decoration: none;
                    float: left;
                }
                .myAccordion .yui-cms-accordion .yui-cms-item.selected .accordionToggleItem {
                    background: url(assets/images/accordion.gif) no-repeat 0px -300px;
                }
                .myAccordion .yui-cms-accordion .yui-cms-item .bd {
                    width: 0px;
                    overflow: hidden;
                }
                .myAccordion .yui-cms-accordion .yui-cms-item .bd .fixed {
                    background: none repeat scroll 0 50% #BBCCEE;
                    padding: 5px;
                    border: 1px solid #667788;
                    overflow: hidden;
                    width: 200px;
                    height: 250px;
                }
                .myAccordion .yui-cms-accordion .yui-cms-item .bd .fixedbody {
                    background: none repeat scroll 0 0 #FFFFFF;
                    border: 1px solid #667788;
                    padding: 1px 5px;
                    height: 245px;
                }
            </style>

            <!-- Graphics Libraries (only work in IE9 and above) -->
            <!-- Load d3.js -->
            <script type="text/javascript" src="js-ext/d3code/d3.v3.js"></script>
            <!-- Load c3.js and stylesheet -->
            <link href="js-ext/c3code/c3.css" rel="stylesheet" type="text/css" />
            <script src="js-ext/c3code/c3.js"></script>
            <!-- Load jquery code and turn off $ -->
            <link rel="stylesheet" type="text/css" href="assets/jquery.qtip.min.css" />

            <script type="text/javascript" src="js-ext/jquerycode/jquery-1.11.3.min.js"></script>
            <script type="text/javascript" src="js-ext/jquery.qtip.min.js"></script>
            <script type="text/javascript" src="js-ext/jquerycode/jquery-ui.min.js"></script>
            <script type="text/javascript" src="js-ext/jquerycode/multiple-select.js"></script>
            <link type="text/css" href="js-ext/jquerycode/multiple-select.css" rel="stylesheet" />
            <script>
                var $j = $.noConflict();
                // Code that uses other library's $ can follow here.
            </script>

            <!-- load i2b2 framework -->
            <script type="text/javascript" src="js-i2b2/i2b2_loader.js"></script>
            <script type="text/javascript" src="js-i2b2/i2b2_ui_config.js"></script>
            <link type="text/css" href="assets/i2b2.css" rel="stylesheet" />
            <link type="text/css" href="assets/i2b2-NEW.css" rel="stylesheet" />

            <!-- other auxiliary javascript source files -->
            <script type="text/javascript" src="js-i2b2/hive/hive.ui.js"></script>
            <script type="text/javascript">
                /****************************************************/
                /******************** INITIALIZE ********************/
                /****************************************************/

                // declare and obtain the dimension of the initial browser viewport and initialize screen width division
                var rightSideProportion = 0.65;
                var leftSideMinimum = 510;
                var initBrowserViewPortDim = document.viewport.getDimensions();
                var rightSideWidth = initBrowserViewPortDim.width * rightSideProportion; 	// this component will take up 65% of the screen
                if (initBrowserViewPortDim.width - rightSideWidth < leftSideMinimum)
                    rightSideWidth = initBrowserViewPortDim.width - leftSideMinimum; // Correction if not enough screen is available

                // following added to support webclient plugin manager / installer only
                var i2b2Admin = "";
                function invokeWCPinstaller() {
                    var mapForm = document.createElement("form");
                    mapForm.target = "_blank";
                    mapForm.method = "POST";
                    mapForm.action = i2b2.PM.model.installer_path + "admin.php";
                    var mapInput1 = document.createElement("input");
                    mapInput1.type = "hidden";
                    mapInput1.name = "rul";
                    mapInput1.value = i2b2.PM.model.url;
                    mapForm.appendChild(mapInput1); // Add it to the form
                    var mapInput2 = document.createElement("input");
                    mapInput2.type = "hidden";
                    mapInput2.name = "noisreVcw";
                    mapInput2.value = i2b2.ClientVersion;
                    mapForm.appendChild(mapInput2); // Add it to the form
                    var mapInput3 = document.createElement("input");
                    mapInput3.type = "hidden";
                    mapInput3.name = "niamod";
                    mapInput3.value = i2b2.PM.model.login_domain;
                    mapForm.appendChild(mapInput3); // Add it to the form
                    var mapInput4 = document.createElement("input");
                    mapInput4.type = "hidden";
                    mapInput4.name = "esur";
                    mapInput4.value = i2b2.PM.model.login_username;
                    mapForm.appendChild(mapInput4); // Add it to the form
                    var mapInput5 = document.createElement("input");
                    mapInput5.type = "hidden";
                    mapInput5.name = "yek";
                    mapInput5.value = i2b2.PM.model.login_password;
                    mapForm.appendChild(mapInput5); // Add it to the form    
                    document.body.appendChild(mapForm);
                    mapForm.submit();
                }

                // polyfill for Object.entries in IE11
                if (!Object.entries)
                    Object.entries = function (obj) {
                        var ownProps = Object.keys(obj),
                                i = ownProps.length,
                                resArray = new Array(i); // preallocate the Array
                        while (i--)
                            resArray[i] = [ownProps[i], obj[ownProps[i]]];

                        return resArray;
                    };

                function initI2B2()
                {
                    //debugOnScreen("default.htm.initI2B2: browserViewPort = " + initBrowserViewPortDim.width + " " + initBrowserViewPortDim.height );
                    i2b2.events.afterCellInit.subscribe(
                            (function (en, co, a) {
                                var cellObj = co[0];
                                var cellCode = cellObj.cellCode;
                                switch (cellCode) {
                                    case "PM":
                                        // This i2b2 design implementation uses a prebuild login DIV we connect the Project Management cell to
                                        // handle this method of login, the other method used for login is the PM Cell's built in floating
                                        // modal dialog box to prompt for login credentials.  You can edit the look and feel of this dialog box
                                        // by editing the CSS file.  You can remark out the lines below with no ill effect.  Use the following
                                        // javascript function to display the modal login form: i2b2.hive.PM.doLoginDialog();
                                        //cellObj.doConnectForm($('loginusr'),$('loginpass'),$('logindomain'), $('loginsubmit'));
    <?php
    if (empty($_SESSION["shib-session-id"])) {
        ?>
                                            i2b2.PM.doLoginDialog();
                                            showAlert("<?php echo isset($success_msg) ? $success_msg : ''; ?>");
                                            showAlert("<?php echo isset($error_msg) ? $error_msg : ''; ?>");

                                            document.getElementById('terms').innerHTML = `${i2b2.UI.cfg.termsCondition}`;
                                            document.getElementById('loginIdp').innerHTML = `${i2b2.UI.cfg.loginIdp}`;
                                            document.getElementById('loginIdpIcon').src = `${i2b2.UI.cfg.loginIdpIcon}`;
                                            document.getElementById('loginIdpIcon').alt = `${i2b2.UI.cfg.loginIdp}`;
                                            document.getElementById('logindomain').onchange();
        <?php
    } else {
        ?>
                                            i2b2.PM.isSaml = true;
                                            i2b2.PM.doLoginDialog();
                                            $('i2b2_login_modal_dialog').hide();
                                            $('loginusr').value = '<?php echo $_SESSION["eppn"]; ?>';
                                            $('loginpass').value = '<?php echo $_SESSION["shib-session-id"]; ?>';
                                            $('loginButton').click();
        <?php
    }
    ?>
                                        break;
                                }
                            })
                            );


                    i2b2.events.afterHiveInit.subscribe(
                            (function (ename) {
                                // Misc GUI actions that need to be done after loading
                                $('QPD1').style.background = '#FFFFFF';
                                $('queryBalloon1').style.display = 'block';
                            })
                            );

                    i2b2.events.afterLogin.subscribe(
                            (function ()
                            {
                                // after successful login hide the login box and display the application GUI
                                $('menuLogin').style.display = 'none';
                                $('menuMain').style.display = 'block';
                                $('topBar').style.display = 'block';
                                $('screenQueryData').style.display = 'block';
                                var splitterName = 'main.splitter';

                                // update dimension values
                                initBrowserViewPortDim = document.viewport.getDimensions();
                                rightSideWidth = initBrowserViewPortDim.width * rightSideProportion; 	// this component will take up 60% of the screen
                                if (initBrowserViewPortDim.width - rightSideWidth < leftSideMinimum)
                                    rightSideWidth = initBrowserViewPortDim.width - leftSideMinimum; // Correction if not enough screen is available

                                if (i2b2.PM.model.admin_only)
                                {
                                    i2b2.hive.MasterView.setViewMode('Admin');
                                    $('viewMode-Patients').style.display = 'none';
                                    $('viewMode-Analysis').style.display = 'none';
                                    if (typeof i2b2.PM.model.installer_path !== "undefined") {
                                        $('adminPlugins').show();
                                    }
                                    // hide the splitter from view since we don't need it in admin-only mode
                                    var splitter = $(splitterName);
                                    splitter.style.visibility = "hidden";
                                } else
                                {
                                    // create the splitter object only after login and not in admin-only mode
                                    i2b2.hive.mySplitter = new Splitter(splitterName, {cont: 'screenQueryData'});
                                    i2b2.hive.MasterView.initViewMode(); //tdw9

                                    jQuery('#pluginsMenu').qtip({
                                        content: {
                                            text: jQuery('#PluginListBox')
                                        },
                                        style: {
                                            width: 500
                                        },
                                        show: 'click',
                                        position: {
                                            my: 'top right', // Position my top left...
                                            at: 'bottom left', // at the bottom right of...
                                        },
                                        hide: 'unfocus click'

                                    });
                                    i2b2.PLUGINMGR.view.list.BuildCategories();
                                    i2b2.PLUGINMGR.view.list.Render();

                                    // Drag the splitter to get the right labels on the left panel (jgk 12/19)
                                    i2b2.ONT.view.main.splitterDragged();
                                    i2b2.WORK.view.main.splitterDragged();
                                    i2b2.CRC.view.history.splitterDragged();

                                }
                                $('viewMode-Project').innerHTML = "Project: " + i2b2.PM.model.login_projectname;
                                $('viewMode-User').innerHTML = "User: " + i2b2.PM.model.login_fullname;
                                $('viewMode-User').title = i2b2.PM.model.userRoles;
                                if (i2b2.PM.model.otherAuthMethod) {
                                    $('changePasswordLink').hide();
                                }
                                if (i2b2.PM.model.login_debugging) {
                                    $('debugMsgSniffer').show();
                                }
                                if (typeof i2b2.PM.model.installer_path !== "undefined") {
                                    $('PluginGalleryFooter').show();
                                }
                                if (i2b2.PM.model.isAdmin) {
                                    $('PluginsGalleryLink').innerHTML = "Click here to install plugins from i2b2 Gallery...";
                                }
                            }), i2b2
                            );

                    // start the i2b2 framework
                    i2b2.Init();
                }

                function init() {
                    // ------------------------------------------------------
                    // put any pre-i2b2 initialization code here
                    // ------------------------------------------------------

                    // initialize the i2b2 framework
                    initI2B2();
                    initI2B2_UI();

                }
                YAHOO.util.Event.addListener(window, "load", init);

                /********************************************************/
                /******************** JAVASCRIPT END ********************/
                /********************************************************/

                function handleHostSelectChange(selectOpt) {
                    let domain = i2b2.PM.model.Domains[selectOpt.value];
                    let authMethod = domain.authenticationMethod.toLowerCase();
                    let hostName = domain.name;
                    let loginType = domain.loginType;
                    let showUserReg = domain.showRegistration;

                    let isLocal = loginType === 'local';
                    let isFederated = loginType === 'federated';
                    let isSamlSignUp = authMethod === 'saml';

                    [].forEach.call(document.getElementsByClassName('local_login'), e => e.style.display = isLocal ? 'block' : 'none');
                    [].forEach.call(document.getElementsByClassName('federated_login'), e => e.style.display = isFederated ? 'block' : 'none');
                    [].forEach.call(document.getElementsByClassName('local_signup'), e => e.style.display = isSamlSignUp ? 'none' : 'block');
                    [].forEach.call(document.getElementsByClassName('saml_signup'), e => e.style.display = isSamlSignUp ? 'block' : 'none');
                    [].forEach.call(document.getElementsByClassName('user_reg'), e => e.style.display = showUserReg ? 'block' : 'none');

                    document.getElementById("term_conditions").style.display = isSamlSignUp ? 'none' : 'block';

                    document.getElementById("hostName").value = hostName;

                    if (isSamlSignUp) {
                        document.getElementById("signup-dialog").classList.remove("modal-lg");

                        document.getElementById("terms-registration").classList.remove("col-6");
                        document.getElementById("terms-registration").classList.add("col-12");

                        [].forEach.call(document.getElementsByClassName('register_btn'), e => e.disabled = false);
                    } else {
                        document.getElementById("signup-dialog").classList.add("modal-lg");

                        document.getElementById("terms-registration").classList.remove("col-12");
                        document.getElementById("terms-registration").classList.add("col-6");

                        let chbx = document.getElementById("agree-local");
                        [].forEach.call(document.getElementsByClassName('register_btn'), e => e.disabled = !chbx.checked);
                    }

                    // hide password field for LDAP, NTLM, OKTA
                    if (authMethod) {
                        document.getElementById("password").value = 'demouser';
                        document.getElementById("confirmPassword").value = 'demouser';
                        document.getElementById("terms").rows = isSamlSignUp ? "16" : "8";

                        [].forEach.call(document.getElementsByClassName('password_field'), e => e.style.display = 'none');
                    } else {
                        document.getElementById("password").value = '';
                        document.getElementById("confirmPassword").value = '';
                        document.getElementById("terms").rows = "16";

                        [].forEach.call(document.getElementsByClassName('password_field'), e => e.style.display = 'block');
                    }
                }
                jQuery(document).ready(function ($) {
                    $("#registration").validate({
                        rules: {
                            firstName: "required",
                            lastName: "required",
                            email: {
                                required: true,
                                email: true
                            },
                            username: {
                                required: true,
                                minlength: 2
                            },
                            password: {
                                required: true,
                                minlength: 5
                            },
                            confirmPassword: {
                                required: true,
                                minlength: 5,
                                equalTo: "#password"
                            },
                            agree: "required"
                        },
                        messages: {
                            firstName: "Please provide your first name.",
                            lastName: "Please provide your last name.",
                            email: "Please provide a valid email.",
                            username: {
                                required: "Please provide your username.",
                                minlength: "Your username must consist of at least 4 characters."
                            },
                            password: {
                                required: "Please provide a password.",
                                minlength: "Your password must be at least 5 characters long."
                            },
                            confirmPassword: {
                                required: "Please reenter your password.",
                                minlength: "Your password must be at least 5 characters long.",
                                equalTo: "Please enter the same password as above."
                            },
                            agree: "You must agree to the terms and conditions.",
                        },
                        errorPlacement: function (error, element) {
                            error.addClass("invalid-feedback");

                            if (element.prop("type") === "checkbox") {
                                error.insertAfter(element.parent("label"));
                            } else {
                                error.insertAfter(element);
                            }
                        },
                        highlight: function (element, errorClass, validClass) {
                            $(element).addClass("is-invalid").removeClass("is-valid");
                        },
                        unhighlight: function (element, errorClass, validClass) {
                            $(element).addClass("is-valid").removeClass("is-invalid");
                        }
                    });
                });
            </script>
        </head>
        <body class="yui-skin-sam">
            <div id="title-back"></div>
            <div class="pageMask" id="topMask" style="display:none;">&nbsp;</div>
            <div id="project-request-viewer-panel" style="display:none;">
                <div class="hd">i2b2 Web Client Project Request</div>
                <div class="bd" id="project-request-viewer-body">
                    <p>Lorem Ipsum...</p>
                </div>
                <div class="ft"></div>
            </div>
            <?php if (empty($_SESSION["shib-session-id"])) { ?>
                <div id="changepassword-viewer-panel" style="display:none;">
                    <div class="hd">i2b2 Change Password</div>
                    <div class="bd" id="modifier-viewer-body">
                        <table>
                            <tr>
                                <td>Current Password</td>
                                <td><input type="password" name="curpass" id="curpass"></td>
                            </tr>
                            <tr>
                                <td>New Password</td>
                                <td><input type="password" name="newpass" id="newpass"></td>
                            </tr>
                            <tr>
                                <td>Confirm New Password</td>
                                <td><input type="password" name="retypepass" id="retypepass"></td>
                            </tr>
                        </table>
                        <center>
                            <input type="submit" id="changePassword" name="changePassword" value="OK" onClick="i2b2.PM.changePassword.run();">
                            <input type="submit" id="changePassword" name="changePassword" value="Cancel" onClick="i2b2.PM.changePassword.hide();">
                        </center>
                    </div>
                    <div class="ft"></div>
                </div>
            <?php } ?>
            <div id="modifier-viewer-panel" style="display:none;">
                <div class="hd">i2b2 Web Client Modifier</div>
                <div class="bd" id="modifier-viewer-body">
                    <p>Lorem Ipsum...</p>
                </div>
                <div class="ft"></div>
            </div>
            <div id="help-viewer-panel" style="display:none;">
                <div class="hd">i2b2 Web Client Help</div>
                <div class="bd" id="help-viewer-body">
                    <iframe width="23%" frameborder="0"  height="98%" src="help/toc.html" name="left"></iframe>
                    <iframe width="75%" frameborder="0" height="98%" src="help/content.html" style="overflow-x:hidden;" name="right"></iframe>
                </div>
                <div class="ft"></div>
            </div>
            <div id="queryReport-viewer-panel" style="display:none;">
                <div class="hd">Query Report</div>
                <div class="bd" id="queryReport-viewer-body">
                </div>
                <div class="ft"></div>
            </div>
            <div id="commViewerSingleMsg-panel" style="display:none;">
                <div class="hd">XML Message</div>
                <div class="bd" id="commViewerSingleMsg-body">
                    <div class="xmlMsg"></div>
                </div>
                <div class="ft"></div>
            </div>
            <div id="PM-announcement-panel" style="display:none;">
                <div class="hd" id="PM-announcement-title">Announcements</div>
                <div class="bd" id="PM-announcement-body">
                    <p>Lorem Ipsum...</p>
                </div>
                <div class="ft"></div>
            </div>
            <div id="SHRINE-info-panel" style="display:none;">
                <div class="hd" id="SHRINE-info-title">Topic</div>
                <div class="bd" id="SHRINE-info-body">
                    <p>Lorem Ipsum...</p>
                </div>
                <div class="ft"></div>
            </div>
            <table border="0" cellspacing="0" cellpadding="0" width="100%" id="topBarTable">
                <tr>
                    <td align="left" valign="middle"><img id="topBarTitle" border="0" alt="" /></td>
                    <td align="left" valign="middle"><div id="viewMode-Project"></div></td>
                    <td align="right" valign="middle"><div id="viewMode-User"></div></td>
                    <td align="right" valign="middle">
                        <div id="topBar"> 
                            <span id="menuLogin">
                                WebClient v1.7.12a &nbsp;|&nbsp; <a id="helpLink" href="Javascript:void(0)" onClick="i2b2.hive.HelpViewer.show();">Help</a>
                            </span>
                            <!--        <form name="projectsForm" style="margin: 0pt; padding: 0pt;" onSubmit="i2b2.PM.selectProject(); return false;">
                                    <select style="font-size:11px;float:left;" onChange="i2b2.PM.view.modal.projectDialog.loadProject()" name="projects" id="loginProjs2"></select>
                            <input type="hidden" value="" name="i2b2_projects_modal_dialog"/>
                        </form>
                            --> 
                            <span id="menuMain" style="display:none;">
                                <span id="viewMode-Patients"> <a href="Javascript:void(0)" onClick="i2b2.hive.MasterView.setViewMode('Patients');">Find Patients</a> &nbsp;|&nbsp; </span> 
                                <!--         <span id="viewMode-Admin">
                                                <a href="Javascript:void(0)" onClick="i2b2.hive.MasterView.setViewMode('Admin');">Admin</a>
                                                &nbsp;|&nbsp;
                                        </span>
                                --> 
                                <span id="viewMode-Analysis">
                                    <a href="Javascript:void(0)" onClick="i2b2.hive.MasterView.setViewMode('Analysis');">Analysis Tools</a>
                                    <a href="#" onclick="return false;" id="pluginsMenu"><img src="assets/images/p_dropdown.png" align="absbottom" border="0"/></a>&nbsp;|&nbsp;
                                </span>
                                <span id="adminPlugins" style="display:none">
                                    <a href="#" onClick="invokeWCPinstaller();
                                                return false;" target="_blank">Install Plugins from i2b2 Gallery</a> &nbsp;|&nbsp;
                                </span>
                                <span id="debugMsgSniffer" style="display:none">
                                    <a href="Javascript:void(0)" onClick="i2b2.hive.MsgSniffer.show();">Message Log</a> &nbsp;|&nbsp;
                                </span>
                                <a id="helpLink" href="Javascript:void(0)" onClick="i2b2.hive.HelpViewer.show();">Help</a> &nbsp;|&nbsp;
                                <?php if (empty($_SESSION["shib-session-id"])) { ?>
                                    <span id="changePasswordLink">
                                        <a id="helpLink" href="Javascript:void(0)" onClick="i2b2.PM.changePassword.show();">Change Password</a> &nbsp;|&nbsp;
                                    </span>
                                <?php } ?>
                                <a href="Javascript:void(0);" onClick="i2b2.PM.doLogout();">Logout</a>
                        </div>
                    </td>
                    </span>
                </tr>
            </table>
            <div id="screenQueryData" style="display:none"> 


                <!-- ############### <ONT View> ############### -->
                <div id="ontMainBox" style="display:none">
                    <div id="ontTopTabs">
                        <div style="z-index:200;">
                            <div id="tabNavigate" class="tabBox active" onClick="i2b2.ONT.view.main.selectTab('nav')">
                                <div>Terms</div>
                            </div>
                            <div id="tabFind" class="tabBox" onClick="i2b2.ONT.view.main.selectTab('find')">
                                <div>Find Trm</div>
                            </div>
                            <div id="tabInfo" class="tabBox" onClick="i2b2.ONT.view.main.selectTab('info')">
                                <div>Info</div>
                            </div>
                            <div id="guestTabWorkplace" class="tabBox" style="display:None" onClick="i2b2.ONT.view.main.ZoomView();
                                        i2b2.WORK.view.main.ZoomView()">
                                <div>Workplace</div>
                            </div>
                            <div id="guestTabQueries" class="tabBox" style="display:None" onClick="i2b2.ONT.view.main.ZoomView();
                                        i2b2.CRC.view.history.ZoomView();
                                        i2b2.CRC.view.history.selectTab('nav')"; >
                                <div>Queries</div>
                            </div>   
                            <div id="guestTabQuerySearch" class="tabBox" style="display:None" onClick="i2b2.ONT.view.main.ZoomView();
                                        i2b2.CRC.view.history.ZoomView();
                                        i2b2.CRC.view.history.selectTab('find')"; >
                                <div>Find Qry</div>
                            </div>     
                        </div>
                        <div class="opXML"> 
                            <!--				<a href="JavaScript:showXML('ONT',i2b2.ONT.view.main.currentTab,'Request');" class="debug"><img src="assets/images/msg_request.gif" border="0" width="16" height="16" alt="Show XML Request" title="Show XML Request" /></a> --> 
                            <!--				<a href="JavaScript:showXML('ONT',i2b2.ONT.view.main.currentTab,'Response');" class="debug"><img src="assets/images/msg_response.gif" border="0" width="16" height="16"  alt="Show XML Response" title="Show XML Response" /></a> --> 
                            <a href="JavaScript:showXML('ONT',i2b2.ONT.view.main.currentTab,'Stack');" class="debug"><img src="assets/images/msg_stack.gif" border="0" width="16" height="16"  alt="Show XML Message Stack" title="Show XML Message Stack" /></a> <a href="JavaScript:i2b2.ONT.view.main.showOptions();"><img src="assets/images/options.gif" border="0" width="16" height="16" alt="Show Options" title="Show Options" /></a> <a href="JavaScript:i2b2.ONT.view.main.ZoomView();"><img id="ontZoomImg" width="16" height="16" border="0" src="js-i2b2/cells/ONT/assets/zoom_icon.gif" alt="Resize Workspace" title="Resize Workspace" /></a> </div>
                    </div>
                    <div id="ontMainDisp">
                        <div id="ontNavDisp"> 
                            <!--<div id="standardQuery">Standard Query Items</div>-->
                            <div id="ontNavResults"></div>
                        </div>
                        <div id="ontFindDisp" style="display:none"> <a id="ontFindTabName" href="Javascript:i2b2.ONT.view.find.selectSubTab('names')" class="findSubTabSelected" >Search by Names</a> <a id="ontFindTabCode" href="Javascript:i2b2.ONT.view.find.selectSubTab('codes')" class="findSubTab" >Search by Codes</a>
                            <div id="ontFindFrameName" class="findSubFrame">
                                <form id="ontFormFindName" method="post" action="JavaScript:i2b2.ONT.ctrlr.FindBy.clickSearchName();" style="margin:0px; padding:0px;">
                                    <table border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;">
                                        <tr>
                                            <td style="width:100px;" valign="middle"><select name="ontFindStrategy" style="width:90px;overflow:hidden;font-size:11px;">
                                                    <option value="contains">Containing</option>
                                                    <option value="exact">Exact</option>
                                                    <option value="left">Starting with</option>
                                                    <option value="right">Ending with</option>
                                                </select></td>
                                            <td valign="middle"><input name="ontFindNameMatch" type="text" maxlength="100" style="border:1px solid #7c9cba;width:100%;font-size:11px;" /></td>
                                        </tr>
                                        <tr>
                                            <td colspan="2" style="height:5px;overflow:hidden;"></td>
                                        </tr>
                                        <tr>
                                            <td valign="middle" style="width:135px;"><div class="ontFindButton"><a href="JavaScript:i2b2.ONT.ctrlr.FindBy.clickSearchName();">Find</a></div>
                                                <div id="ontFindNameButtonWorking" style="display:none">Searching...</div></td>
                                            <td valign="middle"><select id="ontFindCategory" name="ontFindCategory" style="font-size:11px;">
                                                    <option value="i2b2">Any Category</option>
                                                </select></td>
                                        </tr>
                                    </table>
                                </form>
                            </div>
                            <div id="ontSearchNamesResults" oncontextmenu="return false"></div>
                            <div id="ontFindFrameCode" class="findSubFrame" style="display:none">
                                <form id="ontFormFindCode" method="post" action="JavaScript:i2b2.ONT.ctrlr.FindBy.clickSearchCode();" style="margin:1px; padding:0px;">
                                    <div>
                                        <input id="ontFindCodeMatch" type="text" maxlength="100" style="border:1px solid #7c9cba;width:95%;font-size:11px;" />
                                    </div>
                                    <table border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%; margin-top:5px;">
                                        <tr>
                                            <td style="width:100px;" valign="middle"><div class="ontFindButton" style=""><a href="JavaScript:i2b2.ONT.ctrlr.FindBy.clickSearchCode();">Find</a></div>
                                                <div id="ontFindCodeButtonWorking" style="display:none;"><img src="js-i2b2/cells/ONT/assets/loadera16.gif"/></div></td>
                                            <td style="width:280px;" valign="middle"><select id="ontFindCoding" name="ontFindCoding" style="font-size:11px;">
                                                    <option value="">Loading...</option>
                                                </select></td>
                                        </tr>
                                    </table>
                                </form>
                            </div>
                            <div id="ontSearchCodesResults" oncontextmenu="return false"></div>
                            <div id="ontFindFrameModifier"  style="display:none" class="findSubFrame">
                                <div id="ontFindFrameModifierTitle"></div>
                                <form id="ontFormFindModifier" method="post" action="JavaScript:i2b2.ONT.ctrlr.FindBy.clickSearchModifier();" style="margin:0px; padding:0px;">
                                    <table border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                                        <tr>
                                            <td style="width:100px;" valign="middle"><select name="ontFindStrategy" style="width:90px;overflow:hidden;font-size:11px;">
                                                    <option value="contains">Containing</option>
                                                    <option value="exact">Exact</option>
                                                    <option value="left">Starting with</option>
                                                    <option value="right">Ending with</option>
                                                </select></td>
                                            <td colspan="2" valign="middle"><input name="ontFindModifierMatch" type="text" maxlength="100" style="border:1px solid #7c9cba;width:100%;font-size:11px;" /></td>
                                            <td><div id="ontFindModiferButtonWorking"></div></td>
                                        </tr>
                                        <tr>
                                            <td colspan="3" style="height:5px;overflow:hidden;"></td>
                                        </tr>
                                        <tr>
                                            <td valign="middle"><div class="ontFindButton" style="width:75px;"><a href="JavaScript:i2b2.ONT.ctrlr.FindBy.clickSearchModifier('name');">Find Name</a></div>
                                                <div id="ontFindNameButtonWorking" style="display:none;"><img src="js-i2b2/cells/ONT/assets/loadera16.gif"/></div></td>
                                            <td valign="middle"><div class="ontFindButton" style="width:75px;"><a href="JavaScript:i2b2.ONT.ctrlr.FindBy.clickSearchModifier('code');">Find Code</a></div>
                                                <div id="ontFindNameButtonWorking" style="display:none;"><img src="js-i2b2/cells/ONT/assets/loadera16.gif"/></div></td>
                                            <td valign="middle"><div class="ontFindButton" style="width:75px;"><a href="JavaScript:i2b2.ONT.ctrlr.FindBy.clickSearchModifier('all');">Get All</a></div>
                                                <div id="ontFindNameButtonWorking" style="display:none;"><img src="js-i2b2/cells/ONT/assets/loadera16.gif"/></div></td>
                                        </tr>
                                    </table>
                                </form>
                            </div>
                            <div id="ontSearchModifiersResults" oncontextmenu="return false"></div>
                        </div>
                        <div id="ontInfoDisp" style="display:none">
                            <div style="font-size:11px;background: #dadada;color: #585858; padding-left:5px">Detailed Information for Term:</div>
                            <div id="ontInfoName" style="font-size:13px;color:#333;font-weight:bold;padding:5px;"><img src="js-i2b2/cells/ONT/assets/sdx_ONT_SEARCH_root.png" align="absbottom"> Please select a term in Navigate Terms or Find Terms</div>
                            <div style="padding:5px;">
                                <span style="font-size:11px;color: #667788; border-bottom: 1px solid #667788;">Description</span><br/>
                                <span id="ontInfoDescription" style=""></span>
                            </div>
                            <div style="padding:5px;">
                                <span style="font-size:11px;color: #667788; border-bottom: 1px solid #667788;">Hierarchy</span><br/>
                                <span id="ontInfoTooltip" style=""></span>
                            </div>
                            <div style="padding:5px;">
                                <span style="font-size:11px;color: #667788; border-bottom: 1px solid #667788;">Concept Path</span><br/>
                                <span id="ontInfoKey" style="font-family:'Courier New'"></span>
                            </div>
                            <div style="padding:5px;">
                                <span style="font-size:11px;color: #667788; border-bottom: 1px solid #667788;">SQL Code (to retrieve children)</span><br/>
                                <span id="ontInfoSQL" style="font-family:'Courier New'"></span>
                            </div>
                            <div style="padding:5px;">
                                <span style="font-size:11px;color: #667788; border-bottom: 1px solid #667788;">Values</span><br/>
                                <span id="ontMetadataXml"></span>
                            </div>
                            <div style="padding:5px;">
                                <span style="font-size:11px;color: #667788; border-bottom: 1px solid #667788;">Children of Term</span><br/>
                                <span id="ontInfoChildren" style=""></span>
                            </div>

                        </div>
                        <div id="ontBalloonBox" xonmouseover="i2b2.ONT.view.main.hballoon.hideBalloons()"> 
                            <!--
                                                    <table border="0" cellspacing="0" cellpadding="0" width="100%"><tr><td align="center">
                                                    <div id="ontBalloon">drag an<br />item<br />from here</div>
                                                    </td></tr></table>
                            --> 
                        </div>
                    </div>
                    <!--
                                  <div class="myAccordion">
                                    <div class="yui-cms-accordion vertical fast">
                                        <div class="yui-cms-item">
                                
                                            <a href="#" class="accordionToggleItem" title="click to expand">&nbsp;</a>
                                            <div class="bd">
                                              <div class="fixed" id="ontModifier">
                                                Modifier Info
                                              </div>
                                            </div>
                                        </div>
                                    </div>
                              </div>
                    -->
                    <div style="clear:both;"></div>
                </div>
                <!-- ############### </ONT View> ############### --> 

                <!-- ############### <PM Navigation View> ############### -->
                <div id="pmNav" style="display:none;">
                    <div class="TopTabs">
                        <div class="tabBox active">
                            <div>PM Navigation</div>
                        </div>
                    </div>
                    <div class="bodyBox">
                        <div id="pmNavTreeview" class="StatusBoxText"></div>
                    </div>
                </div>
                <!-- ############### </PM Navigation View> ############### --> 

                <!-- ############### <PM Main Table View> ############### -->
                <div id="pmMain" style="display:none;">
                    <div class="TopTabs">
                        <div class="tabBox active">
                            <div id="pmMainTitle">Primary Table</div>
                        </div>
                        <div class="opXML"> <a href="JavaScript:showXML('PM','Admin','Stack');" class="debug"><img src="assets/images/msg_stack.gif" border="0" width="16" height="16"  alt="Show XML Message Stack" title="Show XML Message Stack" /></a> </div>
                    </div>
                    <div class="bodyBox">
                        <div id="pmAdminMainView" class="StatusBoxText" style="overflow:auto">
                            <div id="pmAdminHelp" style="margin-bottom:20px">Intro to PM Administration interface</div>
                            <div id="pmAdminMainTableview" style="display:none"></div>
                            <div id="pmAdminTableviewButtons" style="display:none; margin-bottom:25px">testing</div>
                            <div id="pmAdminParamTableview" style="display:none;"></div>
                            <div id="pmAdminParamTableviewButtons" style="display:none; margin-bottom:25px">testing</div>
                        </div>
                    </div>
                </div>
                <!-- ############### </PM Main Table View> ############### --> 

                <!-- ############### <PM Parmeter View> ############### -->
                <div id="pmParam" style="display:none;">
                    <div class="TopTabs">
                        <div class="tabBox active">
                            <div>Parameter</div>
                        </div>
                        <div class="opXML"> <a href="JavaScript:showXML('PM','main','Stack');" class="debug"><img src="assets/images/msg_stack.gif" border="0" width="16" height="16"  alt="Show XML Message Stack" title="Show XML Message Stack" /></a> <a href="JavaScript:i2b2.WORK.view.main.ZoomView();"><img id="wrkZoomImg" width="16" height="16" border="0" src="js-i2b2/cells/WORK/assets/zoom_icon.gif" alt="Resize Workspace" title="Resize Workspace" /></a> </div>
                    </div>
                    <div class="bodyBox"> <span id="goParam" class="yui-button yui-push-button" style="float:right;"> <span class="first-child">
                                <button type="button">Add</button>
                            </span> </span> <br clear="all"/>
                        <!--	<div id="wrkTreeview" class="StatusBoxText"></div> -->
                        <div id="pmParamTableview" class="StatusBoxText"></div>
                    </div>
                </div>
                <!-- ############### </PM Parmeter View> ############### --> 

                <!-- ############### <WRK View> ############### -->
                <div id="wrkWorkplace" style="display:none;">
                    <div class="TopTabs">
                        <div id="WRKguestTabNavigate" class="tabBox" style="display:None" onClick="i2b2.WORK.view.main.ZoomView();
                                    i2b2.ONT.view.main.ZoomView();
                                    i2b2.ONT.view.main.selectTab('nav')">
                            <div>Terms</div>
                        </div>
                        <div id="WRKguestTabFind" class="tabBox" style="display:None" onClick="i2b2.WORK.view.main.ZoomView();
                                    i2b2.ONT.view.main.ZoomView();
                                    i2b2.ONT.view.main.selectTab('find');">
                            <div>Find Trm</div>
                        </div>
                        <div id="WRKguestTabInfo" class="tabBox" style="display:None" onClick="i2b2.WORK.view.main.ZoomView();
                                    i2b2.ONT.view.main.ZoomView();
                                    i2b2.ONT.view.main.selectTab('info');">
                            <div>Info</div>
                        </div>
                        <div class="tabBox active">
                            <div>Workplace</div>
                        </div>
                        <div id="WRKguestTabQueries" class="tabBox" style="display:None" onClick="i2b2.WORK.view.main.ZoomView();
                                    i2b2.CRC.view.history.ZoomView();
                                    i2b2.CRC.view.history.selectTab('nav')">
                            <div>Queries</div>
                        </div>
                        <div id="WRKguestTabFindQueries" class="tabBox" style="display:None" onClick="i2b2.WORK.view.main.ZoomView();
                                    i2b2.CRC.view.history.ZoomView();
                                    i2b2.CRC.view.history.selectTab('find')">
                            <div>Find Qry</div>
                        </div>
                        <div class="opXML"> 
                            <!--				<a href="JavaScript:showXML('WORK','main','Request');" class="debug"><img src="assets/images/msg_request.gif" border="0" width="16" height="16" alt="Show XML Request" title="Show XML Request" /></a> --> 
                            <!--				<a href="JavaScript:showXML('WORK','main','Response');" class="debug"><img src="assets/images/msg_response.gif" border="0" width="16" height="16" alt="Show XML Response" title="Show XML Response" /></a> --> 
                            <a href="JavaScript:showXML('WORK','main','Stack');" class="debug"><img src="assets/images/msg_stack.gif" border="0" width="16" height="16"  alt="Show XML Message Stack" title="Show XML Message Stack" /></a> 
                            <a href="JavaScript:i2b2.WORK.view.main.refreshTree();"><div style="display: inline;" id="refWorkQS"><img width="16" id="refreshWorkImg" border="0" height="16" src="assets/images/refreshButton.gif" alt="Refresh Workplace" title="Refresh Workplace"></div><div style="display: none;" id="refWork2QS"><img width="16" border="0" height="16" src="assets/images/loadera16.gif" alt="Refresh Workplace" title="Refresh Workplace"></div></a> 

                                                                                                                                                                                                                                                                                                                                                            <!--				<a href="JavaScript:i2b2.WORK.view.main.showOptions();"><img src="assets/images/options.gif" border="0" width="16" height="16" alt="Show Options" title="Show Options" /></a> --> 
                            <a href="JavaScript:i2b2.WORK.view.main.ZoomView();"><img id="wrkZoomImg" width="16" height="16" border="0" src="js-i2b2/cells/WORK/assets/zoom_icon.gif" alt="Resize Workspace" title="Resize Workspace" /></a> </div>
                    </div>
                    <div class="bodyBox">
                        <div id="wrkTreeview" class="StatusBoxText"></div>
                    </div>
                </div>
                <!-- ############### </WRK View> ############### --> 

                <!-- ############### <CRC History View> ############### -->
                <div id="crcHistoryBox" style="display:none;">
                    <div class="TopTabs">
                        <div style="position:absolute;z-index:200;">
                            <div id="CRCguestTabNavigate" class="tabBox" style="display:None" onClick="i2b2.CRC.view.history.ZoomView();
                                        i2b2.ONT.view.main.ZoomView();
                                        i2b2.ONT.view.main.selectTab('nav')">
                                <div>Terms</div>
                            </div>
                            <div id="CRCguestTabFind" class="tabBox" style="display:None" onClick="i2b2.CRC.view.history.ZoomView();
                                        i2b2.ONT.view.main.ZoomView();
                                        i2b2.ONT.view.main.selectTab('find');">
                                <div>Find Trm</div>
                            </div>
                            <div id="CRCguestTabInfo" class="tabBox" style="display:None" onClick="i2b2.CRC.view.history.ZoomView();
                                        i2b2.ONT.view.main.ZoomView();
                                        i2b2.ONT.view.main.selectTab('info');">
                                <div>Info</div>
                            </div>
                            <div id="CRCguestTabWorkplace" class="tabBox" style="display:None" onClick="i2b2.CRC.view.history.ZoomView();
                                        i2b2.WORK.view.main.ZoomView()">
                                <div>Workplace</div>
                            </div>
                            <div id="crctabNavigate" class="tabBox active" onClick="i2b2.CRC.view.history.selectTab('nav')">
                                <div>Queries</div>
                            </div>
                            <div id="crctabFind" class="tabBox" onClick="i2b2.CRC.view.history.selectTab('find')">
                                <div>Find Qry</div>
                            </div>
                        </div>
                        <div class="opXML"> 
                            <!--				<a href="JavaScript:showXML('CRC','history','Request');" class="debug"><img src="assets/images/msg_request.gif" border="0" width="16" height="16" alt="Show XML Request" title="Show XML Request" /></a> --> 
                            <!--				<a href="JavaScript:showXML('CRC','history','Response');" class="debug"><img src="assets/images/msg_response.gif" border="0" width="16" height="16" alt="Show XML Response" title="Show XML Response" /></a> --> 
                            <a href="JavaScript:showXML('CRC','history','Stack');" class="debug"><img src="assets/images/msg_stack.gif" border="0" width="16" height="16"  alt="Show XML Message Stack" title="Show XML Message Stack" /></a> 
                            <a href="JavaScript:i2b2.CRC.ctrlr.history.Refresh();"><div style="display: inline;" id="refPrevQS"><img id="refreshPQImg" width="16" border="0" height="16" src="assets/images/refreshButton.gif" alt="Refresh Previous Queries" title="Refresh Previous Queries"></div><div style="display: none;" id="refPrev2QS"> <img width="16" border="0" height="16" src="assets/images/loadera16.gif" alt="Refresh Previous Queries" title="Refresh Previous Queries"></div></a> <a href="JavaScript:i2b2.CRC.view.history.showOptions();"><img src="assets/images/options.gif" border="0" width="16" height="16" alt="Show Options" title="Show Options" /></a> <a href="JavaScript:i2b2.CRC.view.history.ZoomView();"><img id="histZoomImg" width="16" height="16" border="0" src="js-i2b2/cells/WORK/assets/zoom_icon.gif" alt="Resize Workspace" title="Resize Workspace" /></a> </div>
                    </div>
                    <div class="bodyBox">
                        <div id="crcNavDisp">
                            <div id="crcHistoryData" oncontextmenu="return false"></div>
                            <div>
                                <table border="0" cellspacing="0" cellpadding="0" style="width:100%;margin-top:5px;">
                                    <tr>
                                        <td>Begin: <input id="crcHistoryBegins" name="crcHistoryBegins" type="text" maxlength="100" style="border:1px solid #7c9cba;width:90%;font-size:11px;" /></td>
                                        <td style="width:115px;"><div class="crcFindButton"><a href="JavaScript:i2b2.CRC.ctrlr.history.begins('BEFORE');">&lt;</a></div> <div class="crcFindButton"><a href="JavaScript:i2b2.CRC.ctrlr.history.begins('AFTER');">&gt;</a></div></td>
                                    </tr>
                                </table>
                            </div>

                        </div>
                        <div id="crcFindDisp" style="display:none">
                            <div id="crcFindFrameName" class="findSubFrame">
                                <form id="crcFormFindName" method="post" action="JavaScript:i2b2.CRC.ctrlr.find.clickSearchName();" style="margin:0px; padding:0px;">
                                    <table border="0" cellspacing="0" cellpadding="0" style="border-collapse:collapse;width:100%;">
                                        <tr>
                                            <td style="padding:5px;" valign="middle"><select id="crcFindCategory" name="crcFindCategory" style="min-width:105px;overflow:hidden; font-size:11px;">
                                                    <option value="@">Any Category</option>
                                                    <option value="top">Previous Query Name</option>
                                                    <option value="results">Previous Result Type</option>
                                                    <option value="pdo">Patient Number</option>
                                                </select></td>
                                            <td style="padding:5px;" valign="middle"><select id="crcFindStrategy" name="crcFindStrategy" style="width:90px;overflow:hidden;font-size:11px;">
                                                    <option value="contains">Containing</option>
                                                    <option value="exact">Exact</option>
                                                    <option value="left">Starting with</option>
                                                    <option value="right">Ending with</option>
                                                </select></td>
                                            <td style="padding:5px;"  valign="middle"><input id="crcFindNameMatch" name="crcFindNameMatch" type="text" maxlength="100" style="border:1px solid #7c9cba;width:100%;font-size:11px;" />
                                            <td style="padding:5px;" valign="middle" style="width:135px;">
                                                <div id="crcFindButton" class="crcFindButton"><a href="JavaScript:i2b2.CRC.ctrlr.find.clickSearchName();">Find</a></div>
                                                <div id="crcFindNameButtonWorking" style="display:none"><img width="20px" src="assets/images/spin.gif"></div></td>
                                        </tr>
                                    </table>
                                </form>
                            </div>
                            <div id="crcSearchNamesResults" oncontextmenu="return false"></div>
                        </div>
                    </div>
                </div>
                <!-- ############### </CRC History View> ############### --> 

                <!-- ############### <CRC QueryTool View> ############### -->
                <div id="crcQueryToolBox">
                    <div class="TopTabs">
                        <div class="tabBox active">
                            <div>Query Tool</div>
                        </div>
                        <div class="opXML"> 
                            <!--				<a href="JavaScript:showXML('CRC','QT','Request');" class="debug"><img src="assets/images/msg_request.gif" border="0" width="16" height="16" alt="Show XML Request" title="Show XML Request" /></a> --> 
                            <!--				<a href="JavaScript:showXML('CRC','QT','Response');" class="debug"><img src="assets/images/msg_response.gif" border="0" width="16" height="16" alt="Show XML Response" title="Show XML Response" /></a> --> 
                            <a href="JavaScript:showXML('CRC','QT','Stack');" class="debug"><img src="assets/images/msg_stack.gif" border="0" width="16" height="16"  alt="Show XML Message Stack" title="Show XML Message Stack" /></a> <a href="JavaScript:i2b2.CRC.view.QT.showOptions();"><img src="assets/images/options.gif" border="0" width="16" height="16" alt="Show Options" title="Show Options" /></a> <a href="JavaScript:i2b2.CRC.view.QT.ZoomView();"><img id="qtZoomImg" width="16" height="16" border="0" src="js-i2b2/cells/CRC/assets/zoom_icon.gif" alt="Resize Workspace" title="Resize Workspace" /></a> </div>
                    </div>
                    <div class="bodyBox" id="crcQueryToolBox.bodyBox">
                        <div class="queryNameBar" id="queryNameBar" style="width:512px;">
                            <div class="queryLabel">Query Name:&nbsp;</div>
                            <div id="queryName"></div>
                        </div>
                        <div class="queryNameBar" id="temporalConstraintBar" style="width:512px;">
                            <div class="queryLabel" id="temporalConstraintLabel" style="width:80px">Query Timing:&nbsp;</div> <!-- tdw9 (1707c): Changed label to refelct that this is a query timing selection. Changed label size from 120px to 80px-->
                            <div class="qryTemporalConstraint" id="temporalConstraintDiv" style="float:left;overflow:hidden">
                                <input type="submit" id="queryTiming" name="queryTiming" value="Treat all groups independently">
                                <select id="menubutton1select" name="menubutton1select">
                                    <option value="ANY">Non-Temporal Query: Treat all groups independently</option>
                                    <option value="SAMEVISIT">Non-Temporal Query: Selected groups occur in the same financial encounter</option>
                                    <option value="TEMPORAL">Temporal Query: Define sequence of Events</option>
                                    <!--   <option value="ENCOUNTER">Selected groups occur in financial encounters in the specified order</option>
                                                    <option value="SAMEINSTANCENUM">Items Instance will be the same</option>  -->
                                </select>
                            </div>
                            <div id="temporalUIToggleDiv">
                                <a href="#" id="temporalUIToggleLink" onclick=i2b2.CRC.view.QT.toggleTemporalQueryMode(); return false;"> <span id="toggleTemporalQueryModeSpan"> Swtich to Advanced Temporal Query </span> </a>
                            </div>
                        </div>
                        <div class="queryNameBar" id="defineTemporalBar" style="width:512px;display:none;">
                            <div class="qryTemporalConstraint" id="temporalConstraintDiv" style="float:left;overflow:hidden">
                                <input type="submit" id="defineTemporal" name="defineTemporal" value="Population in which events occur">
                                <select id="menubutton2select" name="menubutton2select">
                                    <option value="0">Population in which events occur</option>
                                    <option value="1">Event 1</option>
                                    <option value="2">Event 2</option>
                                    <option value="BUILDER">Define order of events</option>
                                    <!--   <option value="ENCOUNTER">Selected groups occur in financial encounters in the specified order</option>
                                                    <option value="SAMEINSTANCENUM">Items Instance will be the same</option>  -->
                                </select>
                                <button id="addDefineGroup">New Event</button>
                                <button id="removeDefineGroup">Remove Last Event</button>
                            </div>
                        </div>
                        <div id="crcQryToolPanels" style="width:512px;overflow:hidden;">
                            <div id="crc.innerQueryPanel" style="width:550px;">
                                <div id="outerTemporalSequenceUI" style="display:none">
                                    <div id="tutorialDiv" class="tutorialClass"> 
                                        <a href="#" onclick="i2b2.CRC.view.QT.toggleTutorial();
                                                    return false;"> <span id="tutorialOnOffSpan"> Turn on Tutorial </span> </a> <span id="tutorialText" class="tutorialComponent"></span> <a href="#" id="tutorialShowMeLink" class="tutorialComponent"  onclick="i2b2.CRC.view.QT.runTutorialAtState();
                                                            return false;"> <span id="tutorShowMeText"> Show Me </span> </a>
                                    </div>
                                    <p id="temporalSequenceHeaderMessage" class="temporalSequenceMsgHeader">Drop a Concept into the Box to Start Building a Temporal Sequence</p>
                                    <!--<p id="temporalSequenceMessage" class="temporalSequenceMsg"><a href="#" onclick="i2b2.CRC.view.QT.runTutorial(1); return false;">(Show me)</a></p> -->
                                    <div id="tqDropBox" class="tqDropBoxClass"></div>
                                    <div id="startDrop" class="tqDrop">
                                        <img src="js-i2b2/cells/CRC/assets/tutorial/1.01.move-MI.gif" border="0">
                                    </div>
                                    <div id="tutorMainDialog" title="Tutorial"><span id="dialogText"></span></div>

                                    <div id="highlightRegion"><hr></div>
                                    <div id="highlightArrow">&#x2192;</div>

                                    <div id="innerTemporalSequenceUI">
                                        <div id="temporalSequence_0" class="temporalSequence">
                                            <div id="temporalEvent_0" class="temporalEvent">
                                                <div class="temporalEventHeader">
                                                    <div class="temporalEventDeleteDiv" style="float:right"><a href="#" onclick="i2b2.CRC.view.QT.deleteEventPressed(this);
                                                                return false;"><img src="js-i2b2/cells/CRC/assets/QryTool_b_clear.gif" border="0" alt="Remove this Observation" title="Remove this Observation"></a></div>
                                                    Observation A
                                                </div>
                                                <div id="temporalEvent_0_P0" class="temporalPanel">
                                                    <div class="temporalPanelConstraintsDiv">
                                                        <div class="temporalPanelDatesDiv temporalPanelButton">Dates</div>
                                                        <div class="temporalPanelExcludeDiv temporalPanelButton">Exclude</div>
                                                        <div class="temporalPanelDeleteDiv">
                                                            <div class="temporalPanelDeleteButton"><a href="#" onclick="i2b2.CRC.view.QT.deletePanelPressed(this);
                                                                        return false;"><img src="js-i2b2/cells/CRC/assets/TQryPanel_clear.gif" border="0" alt="Remove this Panel" title="Remove this Panel"></a></div>
                                                        </div>
                                                    </div>
                                                    <div id="temporalEvent_0_P0_content" class="temporalPanelContentDiv"></div>
                                                    <div class="temporalPanelAddDiv">
                                                        <div class="addPanelButton"><a href="#" onclick="i2b2.CRC.view.QT.addPanelPressed(this);
                                                                    return false;"><img src="js-i2b2/cells/CRC/assets/TQryPanel_add.gif" border="0" alt="Add a New Panel" title="Add a New Panel"></a></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="arrow immovable">
                                                <div class="arrowImage">
                                                    <img src="js-i2b2/cells/CRC/assets/temporalQueryUIArrow.gif" alt="->" />
                                                </div>
                                                <div class="arrowText">
                                                    <a class="orderingText" href="#" onclick="i2b2.CRC.view.QT.relationshipLinkPressed(this);">Start of first ever Observation A occurs before start of first ever Observation B</a>
                                                </div>
                                            </div>
                                            <div id="temporalEvent_1" class="temporalEvent">
                                                <div class="temporalEventHeader">
                                                    <div class="temporalEventDeleteDiv" style="float:right"><a href="#" onclick="i2b2.CRC.view.QT.deleteEventPressed(this);
                                                                return false;"><img src="js-i2b2/cells/CRC/assets/QryTool_b_clear.gif" border="0" alt="Remove this Observation" title="Remove this Observation"></a></div>
                                                    Observation B
                                                </div>
                                                <div id="temporalEvent_1_P0" class="temporalPanel">
                                                    <div class="temporalPanelConstraintsDiv">
                                                        <div class="temporalPanelDatesDiv temporalPanelButton">Dates</div>
                                                        <div class="temporalPanelExcludeDiv temporalPanelButton">Exclude</div>
                                                        <div class="temporalPanelDeleteDiv">
                                                            <div class="temporalPanelDeleteButton"><a href="#" onclick="i2b2.CRC.view.QT.deletePanelPressed(this);
                                                                        return false;"><img src="js-i2b2/cells/CRC/assets/TQryPanel_clear.gif" border="0" alt="Remove this Panel" title="Remove this Panel"></a></div>
                                                        </div>
                                                    </div>
                                                    <div id="temporalEvent_1_P0_content" class="temporalPanelContentDiv"></div>
                                                    <div class="temporalPanelAddDiv">
                                                        <div class="addPanelButton"><a href="#" onclick="i2b2.CRC.view.QT.addPanelPressed(this);
                                                                    return false;"><img src="js-i2b2/cells/CRC/assets/TQryPanel_add.gif" border="0" alt="Add a New Panel" title="Add a New Panel"></a></div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="arrow_inactive immovable">
                                                <div class="arrowImage">
                                                    <img src="js-i2b2/cells/CRC/assets/temporalQueryUIAddEvent.gif" alt="->" />
                                                </div>
                                                <div class="inactiveArrowText">
                                                    <a class="orderingText" href="javascript:void(0);">Add a new Observation</a>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div id="populationLabel"><a href="javascript:i2b2.CRC.view.QT.togglePopulationPanels()"><span>&#x25B2; Click here to define a constraining Population</span></a></div>
                                <!-- Query Panels-->
                                <div class="qryPanel">
                                    <div class="qryPanelTitle">
                                        <div class="qryPanelClear" style="float:right"><a href="JavaScript:i2b2.CRC.ctrlr.QT.panelControllers[0].doDelete();"><img src="js-i2b2/cells/CRC/assets/QryTool_b_clear.gif" border="0" alt="Clear" /></a></div>
                                        <div id="queryPanelTitle1">Group 1</div>
                                    </div>
                                    <div class="qryPanelButtonBar">
                                        <div class="qryButtonDate" style="float:left"><a id="queryPanelDatesB1" class="queryPanelButton" href="JavaScript:i2b2.CRC.ctrlr.dateConstraint.showDates(0)" title="Select the date range for this group's criterion to have occured within...">Dates</a></div>
                                        <div class="qryButtonOccurs" style="float:left"><a id="queryPanelOccursB1" class="queryPanelButton" href="JavaScript:i2b2.CRC.ctrlr.QT.panelControllers[0].showOccurs()" title="Select the minimum number of times this group's criterion has occured...">Occurs &gt; <span id="QP1Occurs">0</span>x</a></div>
                                        <div class="qryButtonExclude" style="float:left"><a id="queryPanelExcludeB1" class="queryPanelButton" href="JavaScript:i2b2.CRC.ctrlr.QT.panelControllers[0].doExclude()" title="Exclude records matching this group's criteria...">Exclude</a></div>
                                    </div>
                                    <div class="qryPanelTiming">
                                        <div id="queryPanelTimingText" style="float:left">
                                            <input type="submit" id="queryPanelTimingB1" name="queryPanelTiming" value="Treat Independently">
                                            <select id="menubutton1select" name="menubutton1select">
                                                <option value="ANY">Treat Independently</option>
                                                <option value="SAMEVISIT">Occurs in Same Encounter</option>
                                            </select>
                                        </div>
                                        <div class="qryButtonLimitB1" id="qryButtonLimitB1" style="display:none; float:right;"><a id="queryPanelLimitB1" class="queryPanelButton" href="JavaScript:i2b2.CRC.ctrlr.QT.panelControllers[0].showLimit()" title="Select the minimum number of times this group's criterion has occured...">Limit</a></div>

                                        <!--	<div class="qryPanelButtonBar2">
                                                  <div class="qryPanelTiming" id="queryPanelTimingB1" style="float:left"></div> -->

                                    </div>
                                    <div id="QPD1" style="clear:both" oncontextmenu="return false" class="queryPanel"></div>
                                </div>
                                <div class="qryPanel" style="margin-left:2px;">
                                    <div class="qryPanelTitle">
                                        <div class="qryPanelClear" style="float:right"><a href="JavaScript:i2b2.CRC.ctrlr.QT.panelControllers[1].doDelete();"><img src="js-i2b2/cells/CRC/assets/QryTool_b_clear.gif" border="0" alt="Clear" /></a></div>
                                        <div id="queryPanelTitle2">Group 2</div>
                                    </div>
                                    <div class="qryPanelButtonBar">
                                        <div class="qryButtonDate" style="float:left"><a id="queryPanelDatesB2" class="queryPanelButton" href="JavaScript:i2b2.CRC.ctrlr.dateConstraint.showDates(1)" title="Select the date range for this group's criterion to have occured within...">Dates</a></div>
                                        <div class="qryButtonOccurs" style="float:left"><a id="queryPanelOccursB2" class="queryPanelButton" href="JavaScript:i2b2.CRC.ctrlr.QT.panelControllers[1].showOccurs()" title="Select the minimum number of times this group's criterion has occured...">Occurs &gt; <span id="QP2Occurs">0</span>x</a></div>
                                        <div class="qryButtonExclude" style="float:left"><a id="queryPanelExcludeB2" class="queryPanelButton" href="JavaScript:i2b2.CRC.ctrlr.QT.panelControllers[1].doExclude()" title="Exclude records matching this group's criteria...">Exclude</a></div>
                                    </div>
                                    <div class="qryPanelTiming" style="float:left">
                                        <input type="submit" id="queryPanelTimingB2" name="queryPanelTiming" value="Treat Independently">
                                        <select id="menubutton1select" name="menubutton1select">
                                            <option value="ANY">Treat Independently</option>
                                            <option value="SAMEVISIT">Occurs in Same Encounter</option>
                                        </select>
                                    </div>
                                    <div id="QPD2" style="clear:both" oncontextmenu="return false" class="queryPanel"></div>
                                </div>
                                <div class="qryPanel" style="margin-left:2px;">
                                    <div class="qryPanelTitle">
                                        <div class="qryPanelClear" style="float:right"><a href="JavaScript:i2b2.CRC.ctrlr.QT.panelControllers[2].doDelete();"><img src="js-i2b2/cells/CRC/assets/QryTool_b_clear.gif" border="0" alt="Clear" /></a></div>
                                        <div id="queryPanelTitle3">Group 3</div>
                                    </div>
                                    <div class="qryPanelButtonBar">
                                        <div class="qryButtonDate" style="float:left"><a id="queryPanelDatesB3" class="queryPanelButton" href="JavaScript:i2b2.CRC.ctrlr.dateConstraint.showDates(2)" title="Select the date range for this group's criterion to have occured within...">Dates</a></div>
                                        <div class="qryButtonOccurs" style="float:left"><a id="queryPanelOccursB3" class="queryPanelButton" href="JavaScript:i2b2.CRC.ctrlr.QT.panelControllers[2].showOccurs()" title="Select the minimum number of times this group's criterion has occured...">Occurs &gt; <span id="QP3Occurs">0</span>x</a></div>
                                        <div class="qryButtonExclude" style="float:left"><a id="queryPanelExcludeB3" class="queryPanelButton" href="JavaScript:i2b2.CRC.ctrlr.QT.panelControllers[2].doExclude()" title="Exclude records matching this group's criteria...">Exclude</a></div>
                                    </div>
                                    <div class="qryPanelTiming" style="float:left">
                                        <input type="submit" id="queryPanelTimingB3" name="queryPanelTiming" value="Treat Independently">
                                        <select id="menubutton1select" name="menubutton1select">
                                            <option value="ANY">Treat Independently</option>
                                            <option value="SAMEVISIT">Occurs in Same Encounter</option>
                                        </select>
                                    </div>
                                    <div id="QPD3" style="clear:both" oncontextmenu="return false" class="queryPanel"></div>
                                </div>
                                <div style="clear:both; width:100%; height:5px; overflow:hidden;"></div>
                                <div id="queryBalloonBox" onMouseOver="i2b2.CRC.view.QT.hballoon.hideBalloons()">
                                    <div class="queryBalloon" id="queryBalloon1">drop a<br />
                                        term<br />
                                        on here</div>
                                    <div class="queryBalloonAnd" id="queryBalloonAnd1">AND</div>
                                    <div class="queryBalloon" id="queryBalloon2">drop a<br />
                                        term<br />
                                        on here</div>
                                    <div class="queryBalloonAnd" id="queryBalloonAnd2">AND</div>
                                    <div class="queryBalloon" id="queryBalloon3">drop a<br />
                                        term<br />
                                        on here</div>
                                </div>
                            </div>
                            <!-- a dialog for query tool -->
                            <div id="QTDialog" title="Download complete">
                                <p>
                                    <span id="QTDialogImage" class="ui-icon ui-icon-circle-check" style="float:left; margin:0 7px 50px 0;"></span>
                                    <span id="QTDialogMainMsg"></span>
                                </p>
                                <p>
                                    <span id="QTDialogSubMsg"></span>
                                </p>
                                <div id="QTDialogProgressBar"></div>
                            </div>
                            <div id = "crc.temoralBuilder" style="width:550px;display:none;">
                                <div  id="temporalbuilders" style="overflow:auto;">
                                    <div class="relationshipAmongEvents" id="temporalbuilder_0">
                                        <select id="preloc1[0]" name="preloc1[0]" style="width:100px;">
                                            <option value="STARTDATE">Start of</option>
                                            <option  value="ENDDATE">End of</option>
                                        </select>
                                        <select id="instanceopf1[0]" name="instanceopf1[0]" style="width:150px;">
                                            <option  value="FIRST">the First Ever</option>
                                            <option  value="LAST">the Last Ever</option>
                                            <option value="ANY">any</option>
                                        </select>
                                        <select id="instancevent1[0]" name="instancevent1[0]" style="width:100px;">
                                            <option value="Event 1"  selected>Event 1</option>
                                            <option value="Event 2">Event 2</option>
                                        </select>
                                        <br/>
                                        <select id="postloc[0]" name="postloc[0]"  style="width:150px;">
                                            <option value="LESS">Occurs Before</option>
                                            <option value="LESSEQUAL">Occurs On or Before</option>
                                            <option value="EQUAL">Occurs Simultaneously With</option>
                                            <option value="GREATER">Occurs After</option>
                                            <option value="GREATEREQUAL">Occurs On or After</option>
                                        </select>
                                        <br/>
                                        <select id="preloc2[0]" name="preloc2[0]" style="width:100px;">
                                            <option value="STARTDATE">Start of</option>
                                            <option  value="ENDDATE">End of</option>
                                        </select>
                                        <select id="instanceopf2[0]" name="instanceopf2[0]"  style="width:150px;">
                                            <option  value="FIRST">the First Ever</option>
                                            <option  value="LAST">the Last Ever</option>
                                            <option value="ANY">any</option>
                                        </select>
                                        <select id="instancevent2[0]" name="instancevent2[0]" style="width:100px;">
                                            <option value="Event 1">Event 1</option>
                                            <option value="Event 2" selected>Event 2</option>
                                        </select>
                                        <br/>
                                        <input  id="bytime1[0]" name="bytime1[0]" type="checkbox">
                                        By
                                        <select id="byspan1[0]" name="byspan1[0]"  style="width:50px;">
                                            <option value="GREATER">&gt;</option>
                                            <option value="GREATEREQUAL" selected>&ge;</option>
                                            <option value="EQUAL">=</option>
                                            <option value="LESSEQUAL">&le;</option>
                                            <option value="LESS">&lt;</option>
                                        </select>
                                        <input   id="bytimevalue1[0]" name="bytimevalue1[0]" style="width:50px;" type="text" value="1">
                                        <select   id="bytimeunit1[0]" name="bytimeunit1[0]" style="width:100px;">
                                            <option  value="HOUR">hour(s)</option>
                                            <option   value="DAY" selected>day(s)</option>
                                            <option  value="MONTH">month(s)</option>
                                            <option  value="YEAR">year(s)</option>
                                        </select>
                                        <br/>
                                        <input id="bytime2[0]" name="bytime2[0]" type="checkbox">
                                        And
                                        <select  id="byspan2[0]" name="byspan2[0]"  style="width:50px;">
                                            <option value="GREATER">&gt;</option>
                                            <option value="GREATEREQUAL">&ge;</option>
                                            <option value="EQUAL">=</option>
                                            <option value="LESSEQUAL" selected>&le;</option>
                                            <option value="LESS">&lt;</option>
                                        </select>
                                        <input id="bytimevalue2[0]" name="bytimevalue2[0]"  style="width:50px;" type="text" value="1">
                                        <select  id="bytimeunit2[0]" name="bytimeunit2[0]" style="width:100px;">
                                            <option  value="HOUR">hour(s)</option>
                                            <option   value="DAY" selected>day(s)</option>
                                            <option  value="MONTH">month(s)</option>
                                            <option  value="YEAR">year(s)</option>
                                        </select>
                                    </div>
                                </div>
                                <center>
                                    <div class="temporalControl"><a href="JavaScript:i2b2.CRC.ctrlr.QT.doAddTemporal()">Add Temporal Relationship</a></div>&nbsp;<div class="temporalControl"><a href="JavaScript:i2b2.CRC.ctrlr.QT.doRemoveTemporal()">Remove Last Temporal Relationship</a></div>
                                </center>
                            </div>
                        </div>
                        <div id="qryToolFooter" style="width:512px; overflow:hidden">
                            <div id="runBox"><a href="JavaScript:i2b2.CRC.ctrlr.QT.doQueryRun()"><span id="runBoxText">Run Query</span></a></div>
                            <div id="newBox"><a href="JavaScript:i2b2.CRC.ctrlr.QT.doQueryClear();">Clear</a></div>
                            <div id="printQueryBox" style="visibility:hidden;"><a href="JavaScript:i2b2.CRC.ctrlr.QT.doPrintQuery();">Print Query</a></div>
                            <div id="groupCount" style="width:75px;float:left;height:16px;overflow:hidden;"></div>
                            <!--  
                                    <div id="scrollBox"> 
                            -->
                            <div id="scrollBox" style="width:174; height:22"><!-- swc20170905 to fix clipping of the right-most edge --> 
                                <a href="JavaScript:i2b2.CRC.ctrlr.QT.doScrollFirst();"><img id="panelScrollFirst" src="js-i2b2/cells/CRC/assets/QryTool_b_first_hide.gif" border="0" alt="Go First" /></a> 
                                <a href="JavaScript:i2b2.CRC.ctrlr.QT.doScrollPrev();"><img id="panelScrollPrev" src="js-i2b2/cells/CRC/assets/QryTool_b_prev_hide.gif" border="0" alt="Go Previous" /></a> 
                                <a href="JavaScript:i2b2.CRC.ctrlr.QT.doScrollNew();"><img src="js-i2b2/cells/CRC/assets/QryTool_b_newgroup.gif" border="0" alt="Add New" /></a> 
                                <a href="JavaScript:i2b2.CRC.ctrlr.QT.doScrollNext();"><img id="panelScrollNext" src="js-i2b2/cells/CRC/assets/QryTool_b_next_hide.gif" border="0" alt="Go Next" /></a> 
                                <a href="JavaScript:i2b2.CRC.ctrlr.QT.doScrollLast();"><img id="panelScrollLast" src="js-i2b2/cells/CRC/assets/QryTool_b_last_hide.gif" border="0" alt="Go Last" /></a> 
                            </div>
                        </div>
                    </div>

                    <!-- tdw9: 1.707c pointy arrow for tutorial -->
                    <div id="simpleTemporalQueryPointyArrow">
                        <img id="pointyArrow" src="js-i2b2/cells/CRC/assets/tutorial/pointyArrow.png" border="0" alt="Here!" />
                    </div>
                </div>

                <!-- ############### <CRC Status View> ############### -->
                <div id="crcStatusBox" style="display:none">
                    <div class="TopTabs">
                        <div class="opXML"><!-- <a href="JavaScript:i2b2.CRC.ctrlr.QT.doPrintQuery();"><img id="qtPrintImg" width="16" height="16" border="0" src="js-i2b2/cells/CRC/assets/printer_img.gif" alt="Print Query" title="Print Query" /></a>&nbsp;--><a href="JavaScript:i2b2.CRC.view.status.ZoomView();"><img width="16" height="16" border="0" src="js-i2b2/cells/CRC/assets/zoom_icon.gif" alt="Resize Workspace" /></a></div>
                        <div class="tabBox tabQueryStatus active" onClick="i2b2.CRC.view.status.selectTab('status')">
                            <div>Show Query Status</div>
                        </div>
                        <div class="tabBox tabQueryGraphs" onClick="i2b2.CRC.view.status.selectTab('graphs')">
                            <div>Graph Results</div>
                        </div>
                        <div class="tabBox tabQueryReport" onClick="i2b2.CRC.view.status.selectTab('queryReport')">
                            <div>Query Report</div>
                        </div>
                    </div>
                    <div class="StatusBox">
                        <div id="infoQueryStatusText" class="StatusBoxText" oncontextmenu="return false"></div>
                        <div id="infoQueryStatusChart" class="StatusBoxChart" oncontextmenu="return false" style="display:none"></div>
                        <div id="infoQueryStatusReport" class="StatusBoxReport" oncontextmenu="return false" style="display:none"></div>
                    </div>
                </div>
                <!-- ############### <Workplace> ############### -->
                <div class="PluginListBox" style="display:none;overflow-y:scroll;"></div>
                <!-- ############### </Workplace> ############### --> 
                <!-- ############### <PluginMgr List View> ############### -->
                <div id="anaPluginListBox" style="display:none">
                    <div class="TopTabs">
                        <div class="tabBox tabPluginList active" >
                            <div>Plugins</div>
                        </div>
                        <div class="opXML"> 
                            <!--			<a href="JavaScript:i2b2.PLUGINMGR.view.list.showOptions();"><img src="assets/images/options.gif" border="0" width="16" height="16"></a> --> 
                            <a href="JavaScript:i2b2.PLUGINMGR.view.list.ZoomView();"><img id="pluglstZoomImg" width="16" height="16" border="0" src="js-i2b2/cells/CRC/assets/zoom_icon.gif" alt="Resize Workspace" /></a></div>
                    </div>
                    <a id="plugListRecDETAIL-CLONE" class="pluginRecordBox DETAIL" style="display:none">
                        <div class="Icon"><img src="js-i2b2/cells/PLUGINMGR/assets/DEFAULTLIST_icon_32x32.gif" alt="" /></div>
                        <div class="txtBoundBox">
                            <div class="Name">Plugin Name</div>
                            <div class="Descript">Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</div>
                        </div>
                        <div style="clear:both"></div>
                    </a> <a id="plugListRecSUMMARY-CLONE" class="pluginRecordBox SUMMARY" style="display:none">
                        <div class="Icon"><img src="js-i2b2/cells/PLUGINMGR/assets/DEFAULTLIST_icon_16x16.gif" alt="" /></div>
                        <div class="txtBoundBox Name">Plugin Name</div>
                        <div style="clear:both"></div>
                    </a>
                    <div id="PluginListBox" class="PluginListBox">
                        <div class="topmenu" oncontextmenu="return false">
                            <form style="margin-top:1px;" action="javascript:void(0)">
                                <div style="float:left;">
                                    <select id="anaPluginView" style="width:160px" onChange="i2b2.PLUGINMGR.view.list.Render()">
                                        <option value="DETAIL">Detailed List View</option>
                                        <option value="SUMMARY">Summary List View</option>
                                    </select>
                                </div>
                                Category:
                                <select id="anaPluginCats" style="width:200px" onChange="i2b2.PLUGINMGR.view.list.Render();">
                                    <option value="">Loading...</option>
                                </select>
                            </form>
                        </div>
                        <div id="anaPluginList" oncontextmenu="return false"></div>
                        <div style="background:#667788;height:22px;padding-left:4px;"><span id="PluginGalleryFooter" style="display:none;float:left"><img src="assets/images/p_gallery.png" align="absbottom" style="margin-top:2px;" /> <a href="#" onClick="invokeWCPinstaller();
                                    return false;" target="_blank" id="PluginsGalleryLink" style="text-decoration:none;font-size:13px;color:#FFF;" >Click here to view more plugins in i2b2 Gallery...</a></span><span style="float:right;margin-right:5px"><a href="#" onClick="jQuery('#pluginsMenu').qtip('hide');
                                            return false;" style="text-decoration:none;font-size:13px;color:#FFF;" ><img src="assets/images/p_close.png" align="absbottom" border="0" style="margin-top:2px;" /></a> <a href="#" onClick="jQuery('#pluginsMenu').qtip('hide');
                                                    return false;" style="text-decoration:none;font-size:13px;color:#FFF;">Close</a></span></div>
                    </div>
                    <div style="clear:both;"></div>
                </div>
                <!-- ############### </PluginMgr List View> ############### --> 
                <!-- ############### <Plugin Viewer> ############### -->
                <div id="anaPluginViewBox" style="display:none">
                    <div class="TopTabs">
                        <div class="tabBox active">
                            <div>Plugin Viewer</div>
                        </div>
                        <div class="opXML"> 
                            <!--				<a href="JavaScript:showXML('PLUGINMGR','PlugView','Request');" class="debug"><img src="assets/images/msg_request.gif" border="0" width="16" height="16" alt="Show XML Request" title="Show XML Request" /></a> --> 
                            <!--				<a href="JavaScript:showXML('PLUGINMGR','PlugView','Response');" class="debug"><img src="assets/images/msg_response.gif" border="0" width="16" height="16" alt="Show XML Response" title="Show XML Response" /></a> --> 
                            <a href="JavaScript:showXML('PLUGINMGR','PlugView','Stack');" class="debug"><img src="assets/images/msg_stack.gif" border="0" width="16" height="16"  alt="Show XML Message Stack" title="Show XML Message Stack" /></a> <a href="JavaScript:i2b2.PLUGINMGR.view.PlugView.showOptions();"><img src="assets/images/options.gif" border="0" width="16" height="16" alt="Show Options" title="Show Options" /></a> <a href="JavaScript:i2b2.PLUGINMGR.ctrlr.main.ZoomView();"><img id="plugviewZoomImg" width="16" height="16" border="0" src="js-i2b2/cells/PLUGINMGR/assets/zoom_icon.gif" alt="Resize Workspace" title="Resize Workspace" /></a></div>
                    </div>
                    <div class="PluginViewBox">
                        <div id="anaPluginViewFrame" oncontextmenu="return false">
                            <div class="initialMsg"><a href="#" style="color:#6677aa" onclick="jQuery('#pluginsMenu').qtip('show');
                                        return false;">Select a plugin to load</a></div>
                        </div>
                        <iframe id="anaPluginIFRAME" src="assets/blank.html" style="display:none"></iframe>
                    </div>
                    <div style="clear:both;"></div>
                </div>
                <!-- ############### </Plugin Viewer> ############### -->
                <div class="pageMask" id="itemOptionsMask" style="display:none" onClick="hidePopMenu();" onMouseDown="hidePopMenu();"></div>
                <div class="pageMask" id="itemConstraintsMask" style="background-color: #000; filter:alpha(opacity=25); -moz-opacity:0.25;opacity: 0.25; display:none">&nbsp;</div>
                <div id="itemOptions" style="display:none"></div>
                <div id="itemConstraints" style=""></div>
                <!-- ############### <Option Screens> ############### -->
                <div id="optionsQT" style="display:none;">
                    <div class="hd" style="background:#6677AA;">Query Tool Options</div>
                    <div class="bd">
                        <center>
                            <table style="font-size:12px">
                                <!--				<tr><td>Maximum Number of Children to Display:</td><td><input id="MaxChldDisp" style="width:35px" /></td></tr> -->
                                <tr>
                                    <td>Maximum Time to Wait for XML Response (in seconds):</td>
                                    <td><input id="QryTimeout" style="width:35px" /></td>
                                </tr>
                            </table>
                        </center>
                    </div>
                </div>
                <div id="optionsHistory" style="display:none;">
                    <div class="hd" style="background:#6677AA;">Options for "Previous Queries" Window</div>
                    <div class="bd">
                        <center>
                            <br />
                            <table style="font-size:12px;width:90%;">
                                <tr>
                                    <td>Number of queries to display: </td>
                                    <td><input id="HISTMaxQryDisp" style="width:35px" /></td>
                                </tr>
                                <tr>
                                    <td colspan="2">Sort Queries:</td>
                                </tr>
                                <tr>
                                    <td colspan="2" class="dateBorder" align="center"><table id="HISToptSortBox" style="font-size:12px; text-align:left;">
                                            <tr>
                                                <td><input type="radio" name="HISTsortBy" id="HISTsortByNAME" value="NAME" checked="checked" />
                                                    By Name</td>
                                            </tr>
                                            <tr>
                                                <td><input type="radio" name="HISTsortBy" id="HISTsortByDATE" value="DATE" />
                                                    By Create Date</td>
                                            </tr>
                                            <tr>
                                                <td colspan="2"><hr width="75%" /></td>
                                            </tr>
                                            <tr>
                                                <td><input type="radio" name="HISTsortOrder" id="HISTsortOrderASC" value="ASC" checked="checked" />
                                                    Ascending</td>
                                                <td><input type="radio" name="HISTsortOrder" id="HISTsortOrderDESC" value="DESC" />
                                                    Descending</td>
                                            </tr>
                                        </table><br/> </td>
                                </tr>
                                <tr>
                                    <td><span id="HISTUserLabel">Get previous queries for: </a></td>
                                    <td><select id="HISTUser" style="font-size:11px;"><option value="@">All Users</option></select></td>
                                </tr>
                                <tr>
                                    <td>Auto refresh previous queries: </td>
                                    <td><select id="HISTAuto"><option value="0" selected="selected">Off</option><option value="10">10 seconds</option><option value="30">30 seconds</option><option value="60">60 seconds</option></select></td>
                                </tr>
                            </table>
                        </center>
                    </div>
                </div>
                <div id="optionsOntNav" style="display:none;">
                    <div class="hd" style="background:#6677AA;">Options for Navigating Terms</div>
                    <div class="bd"> <br />
                        <div style="font-size:12px; margin-left:50px" >Maximum Number of Children to Display:
                            <input id="ONTNAVMaxQryDisp" style="width:35px" value="200" />
                        </div>
                        <div style="margin-left:50px">
                            <input type="checkbox" id="ONTNAVshowHiddens" />
                            Show Hidden Terms</div>
                        <div style="margin-left:50px">
                            <input type="checkbox" id="ONTNAVshowSynonyms" />
                            Show Synonymous Terms</div>
                        <div style="margin-left:50px">
                            <input type="checkbox" checked id="ONTNAVshowPatientCounts" />
                            Enable Patient Counts</div>
                        <div style="margin-left:50px">
                            <input type="checkbox" id="ONTNAVshowShortTooltips" />
                            Use Short Tooltips</div>
                        <div style="margin-left:50px">
                            <input type="checkbox" id="ONTNAVshowCodeTooltips" onclick="$('ONTFINDshowCodeTooltips').checked = $('ONTNAVshowCodeTooltips').checked" />
                            Show Concept Codes in Tooltips</div>
                        <div style="margin-left:50px">
                            <input type="checkbox" id="ONTNAVdisableModifiers" />
                            Disable Modifiers</div>
                    </div>
                </div>
                <div id="optionsOntFind" style="display:none;">
                    <div class="hd" style="background:#6677AA;">Options for Finding Terms</div>
                    <div class="bd"> <br />
                        <div style="font-size:12px; margin-left:50px" >Maximum Number of Children to Display:
                            <input id="ONTFINDMaxQryDisp" style="width:35px" value="200" />
                        </div>
                        <div style="margin-left:50px">
                            <input type="checkbox" id="ONTFINDshowHiddens" />
                            Show Hidden Terms</div>
                        <div style="margin-left:50px">
                            <input type="checkbox" checked id="ONTFINDshowSynonyms" />
                            Show Synonymous Terms</div>
                        <div style="margin-left:50px">
                            <input type="checkbox" checked id="ONTFINDhierarchy" />
                            Show Hierarchy in Results</div>
                        <div style="margin-left:50px">
                            <input type="checkbox" id="ONTFINDreduceResults" />
                            Show Individual Items in Folders</div>
                        <div style="margin-left:50px">
                            <input type="checkbox" id="ONTFINDshowPatientCounts" />
                            Enable Patient Counts</div>
                        <div style="margin-left:50px">
                            <input type="checkbox" id="ONTFINDshowShortTooltips" />
                            Use Short Tooltips</div>
                        <div style="margin-left:50px">
                            <input type="checkbox" id="ONTFINDshowCodeTooltips" onclick="$('ONTNAVshowCodeTooltips').checked = $('ONTFINDshowCodeTooltips').checked"/>
                            Show Concept Codes in Tooltips</div>
                        <div style="margin-left:50px">
                            <input type="checkbox" id="ONTFINDdisableModifiers" />
                            Disable Modifiers</div>
                    </div>
                </div>
                <div id="optionsOntInfo" style="display:none;">
                    <div class="hd" style="background:#6677AA;">Options for Term Info</div>
                    <div class="bd"> <br />No Options
                    </div>
                </div>
                <!-- ############### </Option Screens> ############### -->
                <div id="calendarDiv" style="z-index:1520; display:none;"></div>
                <!-- DO NOT MOVE calendarDivMask IE 5/6/7 has major z-index bug -->
                <div id="calendarDivMask" style="display:none; z-index:1510; position:absolute;" onClick="i2b2.CRC.ctrlr.dateConstraint.hideCalendar()"></div>
                <div id="constraintDates" style="display:none;">
                    <div class="hd" style="background:#6677AA;">Constrain Group by Date Range</div>
                    <div class="bd"> <br />
                        <center>
                            <table style="font-size:12px">
                                <tr>
                                    <td>From:</td>
                                    <td></td>
                                    <td>To:</td>
                                </tr>
                                <tr>
                                    <td class="dateBorder"><table>
                                            <tr>
                                                <td valign="middle"><input id="checkboxDateStart" type="checkbox" onChange="i2b2.CRC.ctrlr.dateConstraint.toggleDate()" /></td>
                                                <td valign="middle"><input id="constraintDateStart" value="01/31/2008" style="width:75px;" disabled="disabled" /></td>
                                                <td valign="middle"><a href="Javascript:i2b2.CRC.ctrlr.dateConstraint.doShowCalendar('S')"><img id="dropDateStart" style="position:relative; top:1px; border:none;" class="calendarDropdown" src="assets/images/b_dropdown.gif" alt="" /></a>&nbsp;</td>
                                            </tr>
                                        </table></td>
                                    <td>&nbsp;&nbsp;&nbsp;</td>
                                    <td class="dateBorder"><table>
                                            <tr>
                                                <td valign="middle"><input id="checkboxDateEnd" type="checkbox" onChange="i2b2.CRC.ctrlr.dateConstraint.toggleDate()" /></td>
                                                <td valign="middle"><input id="constraintDateEnd" value="12/31/2008" style="width:75px;" disabled="disabled" /></td>
                                                <td valign="middle"><a href="Javascript:i2b2.CRC.ctrlr.dateConstraint.doShowCalendar('E');"><img id="dropDateEnd" style="position:relative; top:1px" class="calendarDropdown" border="0" src="assets/images/b_dropdown.gif" alt=""/></a>&nbsp;</td>
                                            </tr>
                                        </table></td>
                                </tr>
                            </table>
                            <span><br/>Setting this will apply the date constraint to the entire panel.<br/><br/>Any item-level date constraints will be overwritten.<br/><br/>Date constraints do not apply on Demographics data, Patient Sets and Previous Queries</span>
                        </center>
                        <br />
                        <br />
                    </div>
                </div>
                <div id="item_calendarDiv" style="z-index:1520; display:none;"></div>
                <!-- DO NOT MOVE calendarDivMask IE 5/6/7 has major z-index bug -->
                <div id="item_calendarDivMask" style="display:none; z-index:1510; position:absolute;" onClick="i2b2.CRC.ctrlr.dateConstraint.hideItemCalendar()"></div>
                <div id="constraintDate" style="display:none;">
                    <div class="hd" style="background:#6677AA;">Constrain Item by Date Range</div>
                    <div class="bd"> <br />
                        <center>
                            <table style="font-size:12px">
                                <tr>
                                    <td>From:</td>
                                    <td></td>
                                    <td>To:</td>
                                </tr>
                                <tr>
                                    <td class="dateBorder"><table>
                                            <tr>
                                                <td valign="middle"><input id="item_checkboxDateStart" type="checkbox" onChange="i2b2.CRC.ctrlr.dateConstraint.toggleItemDate()" /></td>
                                                <td valign="middle"><input id="item_constraintDateStart" value="01/31/2008" style="width:75px;" disabled="disabled" /></td>
                                                <td valign="middle"><a href="Javascript:i2b2.CRC.ctrlr.dateConstraint.doShowItemCalendar('S')"><img id="item_dropDateStart" style="position:relative; top:1px; border:none;" class="calendarDropdown" src="assets/images/b_dropdown.gif" alt="" /></a>&nbsp;</td>
                                            </tr>
                                        </table></td>
                                    <td>&nbsp;&nbsp;&nbsp;</td>
                                    <td class="dateBorder"><table>
                                            <tr>
                                                <td valign="middle"><input id="item_checkboxDateEnd" type="checkbox" onChange="i2b2.CRC.ctrlr.dateConstraint.toggleItemDate()" /></td>
                                                <td valign="middle"><input id="item_constraintDateEnd" value="12/31/2008" style="width:75px;" disabled="disabled" /></td>
                                                <td valign="middle"><a href="Javascript:i2b2.CRC.ctrlr.dateConstraint.doShowItemCalendar('E');"><img id="item_dropDateEnd" style="position:relative; top:1px" class="calendarDropdown" border="0" src="assets/images/b_dropdown.gif" alt=""/></a>&nbsp;</td>
                                            </tr>
                                        </table></td>
                                </tr>
                            </table>
                            <span>
                                <br>Date constraints do not apply on Demographics data, Patient Sets and Previous Queries
                            </span>
                        </center>
                        <br />
                        <br />
                    </div>
                </div>

                <div id="tqCalendarDiv" style="z-index:1520; display:none;"></div>
                <!-- DO NOT MOVE calendarDivMask IE 5/6/7 has major z-index bug -->
                <div id="tqCalendarDivMask" style="display:none; z-index:1510; position:absolute;" onclick="i2b2.CRC.ctrlr.dateConstraint.tqHideCalendar()"></div>
                <div id="tqConstraintDates" style="display:none;">
                    <div class="hd" style="background:#6677AA;">Constrain Panel by Date Range</div>
                    <div class="bd">
                        <br />
                        <center>
                            <table style="font-size:12px">
                                <tr>
                                    <td>From:</td>
                                    <td></td>
                                    <td>To:</td>
                                </tr>
                                <tr>
                                    <td class="dateBorder">
                                        <table>
                                            <tr>
                                                <td valign="middle"><input id="tqCheckboxDateStart" type="checkbox" onchange="i2b2.CRC.ctrlr.dateConstraint.tqToggleDate()" /></td>
                                                <td valign="middle"><input id="tqConstraintDateStart" value="01/31/2008" style="width:75px;" disabled="disabled" /></td>
                                                <td valign="middle"><a href="Javascript:i2b2.CRC.ctrlr.dateConstraint.tqDoShowCalendar('S')"><img id="tqDropDateStart" style="position:relative; top:1px; border:none;" class="calendarDropdown" src="assets/images/b_dropdown.gif" alt="" /></a>&nbsp;</td>
                                            </tr>
                                        </table>
                                    </td>
                                    <td>&nbsp;&nbsp;&nbsp;</td>
                                    <td class="dateBorder">
                                        <table>
                                            <tr>
                                                <td valign="middle"><input id="tqCheckboxDateEnd" type="checkbox" onchange="i2b2.CRC.ctrlr.dateConstraint.tqToggleDate()" /></td>
                                                <td valign="middle"><input id="tqConstraintDateEnd" value="12/31/2008" style="width:75px;" disabled="disabled" /></td>
                                                <td valign="middle"><a href="Javascript:i2b2.CRC.ctrlr.dateConstraint.tqDoShowCalendar('E');"><img id="tqDropDateEnd" style="position:relative; top:1px" class="calendarDropdown" border="0" src="assets/images/b_dropdown.gif" alt="" /></a>&nbsp;</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                            <span><br />Setting this will apply the date constraint to the entire panel.<br /><br />Any item-level date constraints will be overwritten.</span>
                        </center>
                        <br />
                        <br />
                    </div>
                </div>

                <div id="constraintOccurs" style="display:none;">
                    <div class="hd" style="background:#6677AA;">Constrain Group by Number of Occurrences</div>
                    <div class="bd"> <br />
                        Event(s) within the group occur more than
                        <select style="width: 46px;" id="constraintOccursInput" name="constraintOccursInput">
                            <option value="0">0</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                            <option value="6">6</option>
                            <option value="7">7</option>
                            <option value="8">8</option>
                            <option value="9">9</option>
                            <option value="10">10</option>
                            <option value="11">11</option>
                            <option value="12">12</option>
                            <option value="13">13</option>
                            <option value="14">14</option>
                            <option value="15">15</option>
                            <option value="16">16</option>
                            <option value="17">17</option>
                            <option value="18">18</option>
                            <option value="19">19</option>
                        </select>
                        times.<br/>
                        <br/>
                        <div id="constraintEncounterBased" style="display:none;">
                            <input type="checkbox" id="constraintEncounterFirst"  name="constraintEncounterBefore">
                            Only use FIRST financial encounter in which the event(s) occur.<br/>
                            <input type="checkbox" id="constraintEncounterLast"  name="constraintEncounterLast">
                            Only use LAST financial encounter in which the event(s) occur. </div>
                        <div id="constraintTextBased" style="display:none;">
                            <p>Application of relevance for text searches only</p>
                            Percent of the matching documents which should be returned where documents with the highest relevance will be returned first.
                            <div id="slider-bg" class="yui-h-slider" tabindex="-1" title="Slider" style="float:left;">
                                <div id="slider-thumb" class="yui-slider-thumb"><img src="assets/images/thumb-n.gif"></div>
                            </div>
                            <div style="float:left;padding:5px 0 0 5px;"> <span id="slider-value">100</span>% </div>
                            <br  clear="all"/>
                        </div>
                    </div>
                </div>
                <!-- ############### Temporal Interval Limits ############### -->
                <div id="constraintLimits" style="display:none;">
                    <div class="hd" style="background:#6677AA;">Temporal Interval Limits</div>
                    <div class="bd"> This group must occur<br/>
                        <input type="checkbox" id="aaa"  name="aaa">
                        At least
                        <select style="width: 46px;" id="bbb" name="bbb">
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                            <option value="6">6</option>
                            <option value="7">7</option>
                            <option value="8">8</option>
                            <option value="9">9</option>
                        </select>
                        <select style="width: 100px; margin-bottom:5px;" id="ccc" name="ccc">
                            <option value="1">Days(s)</option>
                            <option value="2">Month(s)</option>
                            <option value="3">Year(s)</option>
                        </select>
                        after the previous group. <br/>
                        <input type="checkbox" id="ddd"  name="ddd">
                        No more than
                        <select style="width: 46px;" id="bbb" name="bbb">
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                            <option value="6">6</option>
                            <option value="7">7</option>
                            <option value="8">8</option>
                            <option value="9">9</option>
                        </select>
                        <select style="width: 100px; margin-bottom:5px;" id="ccc" name="ccc">
                            <option value="1">Days(s)</option>
                            <option value="2">Month(s)</option>
                            <option value="3">Year(s)</option>
                        </select>
                        after the previous group. <br/>
                        <input type="checkbox" id="ddd"  name="ddd">
                        At least
                        <select style="width: 46px;" id="bbb" name="bbb">
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                            <option value="6">6</option>
                            <option value="7">7</option>
                            <option value="8">8</option>
                            <option value="9">9</option>
                        </select>
                        <select style="width: 100px; margin-bottom:5px;" id="ccc" name="ccc">
                            <option value="1">Days(s)</option>
                            <option value="2">Month(s)</option>
                            <option value="3">Year(s)</option>
                        </select>
                        before the next group. <br/>
                        <input type="checkbox" id="ddd"  name="ddd">
                        No more than
                        <select style="width: 46px;" id="bbb" name="bbb">
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3">3</option>
                            <option value="4">4</option>
                            <option value="5">5</option>
                            <option value="6">6</option>
                            <option value="7">7</option>
                            <option value="8">8</option>
                            <option value="9">9</option>
                        </select>
                        <select style="width: 100px; margin-bottom:5px;" id="ccc" name="ccc">
                            <option value="1">Days(s)</option>
                            <option value="2">Month(s)</option>
                            <option value="3">Year(s)</option>
                        </select>
                        before the next group. <br/>
                    </div>
                </div>
                <!-- ############### <LabRange> ############### -->
                <div id="itemLabRangeDynamic" style="display:none;">
                </div>

                <div id="itemLabRange" style="display:none;">
                    <div class="hd" style="background:#6677AA;">Lab Range Constraint</div>
                    <div class="bd modLabValues">
                        <div style="margin: 0px 5% 12px; text-align: center;" id="valueContraintText"></div>
                        <div class="mlvBody">
                            <div class="mlvtop">
                                <div class="mlvModesGroup">
                                    <div class="mlvMode">
                                        <input name="mlvfrmType" id="mlvfrmTypeNONE" value="NO_VALUE" type="radio" checked="checked" />
                                        No value</div>
                                    <div class="mlvMode">
                                        <input name="mlvfrmType" id="mlvfrmTypeFLAG" value="BY_FLAG" type="radio" />
                                        By flag</div>
                                    <div class="mlvMode">
                                        <input name="mlvfrmType" id="mlvfrmTypeVALUE" value="BY_VALUE" type="radio" />
                                        By value</div>
                                </div>
                                <div class="mlvInputGroup">
                                    <div id="mlvfrmFLAG" style="display:none"> Please select a range:<br />
                                        <select id='mlvfrmFlagValue'>
                                            <option value="">Loading...</option>
                                        </select>
                                    </div>
                                    <div id="mlvfrmVALUE" style="display:none">
                                        <p id="mlvfrmEnterOperator"> Please select operator:<br />
                                            <select id='mlvfrmOperator'>
                                                <option value="LT">LESS THAN (&lt;)</option>
                                                <option value="LE">LESS THAN OR EQUAL TO (&lt;=)</option>
                                                <option value="EQ">EQUAL (=)</option>
                                                <option value="BETWEEN">BETWEEN</option>
                                                <option value="GT">GREATER THAN (&gt;)</option>
                                                <option value="GE">GREATER THAN OR EQUAL (&gt;=)</option>
                                            </select>
                                        </p>
                                        <p id="mlvfrmEnterStringOperator"> Please select operator:<br />
                                            <select id='mlvfrmStringOperator'>
                                                <option value="LIKE[contains]">Contains</option>
                                                <option value="LIKE[exact]">Exact</option>
                                                <option value="LIKE[begin]">Starts With</option>
                                                <option value="LIKE[end]">Ends With</option>
                                            </select>
                                        </p>
                                        <p id="mlvfrmEnterVal"> Please enter a value:<br />
                                            <input id="mlvfrmNumericValue" class="numInput" />
                                        </p>
                                        <p id="mlvfrmEnterVals" style="display:none">Please enter values:<br />
                                            <input id="mlvfrmNumericValueLow" class="numInput" />
                                            &nbsp;-&nbsp;
                                            <input id="mlvfrmNumericValueHigh" class="numInput" />
                                        </p>
                                        <p id="mlvfrmEnterStr">Enter Search Text:<br />
                                            <input id="mlvfrmStrValue" class="strInput" />
                                        </p>
                                        <p id="mlvfrmEnterDbOperator">
                                            <input id="mlvfrmDbOperator" type="checkbox"/>
                                            Use Database Operators <i>(Advanced Searching)</i><br/>
                                        </p>
                                        <p id="mlvfrmEnterEnum">Please select a value:<br />
                                            <select id="mlvfrmEnumValue" class="enumInput" multiple="multiple" size="5" style="overflow: scroll; width: 562px;">
                                                <option value="">Loading...</option>
                                            </select>
                                        </p>
                                    </div>
                                </div>
                                <div style="clear:both;height:1px;overflow:hidden;"></div>
                                <!-- BEGIN snm0 --> 
                                <!-- Lab value bars display section -->
                                <div id="mlvfrmBarContainer" style="margin: 10px; padding: 10px; text-align: center; border: 1px solid #000080; height: auto; display:none"> 
                                    <!-- <div id="mlvfrmBarContainer" class="barContainer" style="white-space:nowrap; display:none"> -->
                                    <div style="height: 55px"> 
                                        <!-- top text -->
                                        <div>Click on a bar segment to help specify a value or range:</div>
                                        <div>Range in <span id="mlvfrmLblUnits" style="font-decoration:italic bold">(not specified)</span></div>
                                        <!-- bars are drawn -->
                                        <div id="barToxL" style="float:left; background: none repeat scroll 0% 0% rgb(0, 0, 0); height: 15px; width: 72px;"> <a href="#lblToxL" onclick="i2b2.CRC.view.modalLabValues.updateValue(event)" title="Toxic low value" class="barlink">&nbsp;</a></div>
                                        <div id="barLofL" style="float:left; background: none repeat scroll 0% 0% rgb(255, 0, 0); height: 15px; width: 72px;"> <a href="#lblLofL" onclick="i2b2.CRC.view.modalLabValues.updateValue(event)" title="Abnormal low value" class="barlink">&nbsp;</a></div>
                                        <div id="barHofL" style="float:left; background: none repeat scroll 0% 0% rgb(255, 255, 0); height: 15px; width: 72px;"> <a href="#lblHofL" onclick="i2b2.CRC.view.modalLabValues.updateValue(event)" title="Indeterminant low value" class="barlink">&nbsp;</a></div>
                                        <div id="barNorm" style="float:left; background: none repeat scroll 0% 0% rgb(0, 255, 0); height: 15px; width: 72px;"> <a href="#" onclick="i2b2.CRC.view.modalLabValues.updateValue(event)"  title="Normal" class="barlink">&nbsp;</a></div>
                                        <div id="barLofH" style="float:left; background: none repeat scroll 0% 0% rgb(255, 255, 0); height: 15px; width: 72px;"> <a href="#lblLofH" onclick="i2b2.CRC.view.modalLabValues.updateValue(event)" title="Indeterminant high value" class="barlink">&nbsp;</a></div>
                                        <div id="barHofH" style="float:left; background: none repeat scroll 0% 0% rgb(255, 0, 0); height: 15px; width: 72px;"> <a href="#lblHofH" onclick="i2b2.CRC.view.modalLabValues.updateValue(event)" title="Abnormal high value" class="barlink">&nbsp;</a></div>
                                        <div id="barToxH" style="float:left; background: none repeat scroll 0% 0% rgb(0, 0, 0); height: 15px; width: 72px;"> <a href="#lblToxH" onclick="i2b2.CRC.view.modalLabValues.updateValue(event)" title="Toxic high value" class="barlink">&nbsp;</a></div>
                                        <!-- labels are drawn -->
                                        <div id="lblToxL" style="float: left; text-align: right; width: 72px;">&nbsp;</div>
                                        <div id="lblLofL" style="float: left; text-align: right; width: 72px;">&nbsp;</div>
                                        <div id="lblHofL" style="float: left; text-align: right; width: 72px;">&nbsp;</div>
                                        <div id="lblNorm" style="float: left; text-align: left; width: 72px;">&nbsp;</div>
                                        <div id="lblLofH" style="float: left; text-align: left; width: 72px;">&nbsp;</div>
                                        <div id="lblHofH" style="float: left; text-align: left; width: 72px;">&nbsp;</div>
                                        <div id="lblToxH" style="float: left; text-align: left; width: 72px;">&nbsp;</div>
                                    </div>
                                </div>
                                <!-- Units display section -->
                                <div id="mlvfrmUnitsContainer" style="margin: 10px 0px 0px 15px; display:none">
                                    <div style="float:left; text-align:left; bottom: 0">Units = &nbsp;</div>
                                    <span>
                                        <select id='mlvfrmUnits' class="units" style="width: 500px; float:left;">
                                            <option value="0">Loading...</option>
                                        </select>
                                    </span> <span id="mlvUnitExcluded" style="color:#900; margin-left: 20px">A value cannot be specified for these units.</span> </div>
                                <!-- END snm0 --> 
                            </div>
                        </div>
                    </div>
                </div>
                <!-- ############### </LabRange> ############### --> 
                <!-- ############### <Query Rename Dialog> ############### -->
                <div id="dialogQmName" style="display:none;">
                    <div class="hd" style="background:#6677AA;">Query Name</div>
                    <div class="bd"> <br />
                        <div style="font-size:12px; margin-left:50px" >Please type a name for the query:</div>
                        <div style="margin-left:50px">
                            <input id="inputQueryName" style="width:275px" maxlength="250" />
                        </div>
                    </div>
                </div>
                <!-- ############### </Query Rename Dialog> ############### --> 
                <!-- ############### <Query Run Dialog> ############### -->
                <div id="dialogQryRun" style="display:none;">
                    <div class="hd" style="background:#6677AA;">Run Query</div>
                    <div class="bd"> <br />
                        <div style="font-size:12px; margin-left:50px" >Please type a name for the query:</div>
                        <div style="margin-left:50px; margin-bottom:20px;">
                            <input class="inputQueryName" style="width:275px" maxlength="164" />
                        </div>
                        <div id="CRC_QUERY_OPTIONS_UI" style="margin-left:50px; margin-bottom:20px;">
                            <div style="font-size:12px">Please select a query method:</div>
                            <div style="font-size:12px">
                                <select id="CRC_QUERY_TYPE" name="CRC_QUERY_TYPE" style="width:275px">
                                </select>
                            </div>
                        </div>
                        <div style="font-size:12px; margin-left:50px" >Please check the query result type(s):</div>
                        <div style="border: 1px solid rgb(171, 173, 179); height:100px; overflow:auto; margin-left: 50px; width: 275px; padding: 4px" id="dialogQryRunResultType">
                            <div id="crcDlgResultOutputPRC">
                                <input type="checkbox" class="chkQueryType" name="queryType" value="PRC" checked="checked" />
                                Patient Count (aggregate number only)</div>
                            <div id="crcDlgResultOutputPRS">
                                <input type="checkbox" class="chkQueryType" name="queryType" value="PRS" />
                                Patient Set (list of matching patients)</div>
                            <div id="crcDlgResultOutputENS">
                                <input type="checkbox" class="chkQueryType" name="queryType" value="ENS" />
                                Encounter Set (list of matching encounters)</div>
                        </div>
                    </div>
                </div>
                <!-- ############### </Query Run Dialog> ############### --> 
                <!-- ############### <Timeout Dialog> ############### -->
                <div id="dialogTimeout" style="display:none;">
                    <div class="hd" style="background:#6677AA;">Session Timing Out</div>
                    <div class="bd"> <br />
                        <div style="font-size:12px; margin-left:10px" >Your session will automatically time out in 5 minutes due to inactivity.  Please click "OK" to continue your session, or click "Logout" to log out.</div>
                        <div style="height:15px;"></div>
                    </div>
                </div>
                <!-- ############### </Timeout Dialog> ############### --> 
                <!-- ############### <Draggable Splitter> ############### -->
                <div id="main.splitter" class="vertical_splitter" style="top:33px"></div>

                <!-- ############### tdw9 1707c: <Popup Editor for Temporal Relationships (for temporal query UI)> ############### -->
                <div id="temporalRelationshipEditor" style="display:none;">
                    <div class="hd" style="background:#6677AA;">Edit Temporal Relationship</div>
                    <div id="relationshipEditorDiv" style="overflow:auto;">
                        <div class="relationshipAmongEvents" id="temporalbuilder_0">
                            <select id="refDate1" name="refDate1" style="width:100px;">
                                <option value="STARTDATE">Start of</option>
                                <option value="ENDDATE">End of</option>
                            </select>
                            <select id="aggregationOp1" name="aggregationOp1" style="width:150px;">
                                <option value="FIRST">the First Ever</option>
                                <option value="LAST">the Last Ever</option>
                                <option value="ANY">any</option>
                            </select>
                            <span id="leadingEventNameSpan" class="eventName">Event 1</span>
                            <br />
                            <select id="operator" name="operator" style="width:150px;">
                                <option value="LESS">Occurs Before</option>
                                <option value="LESSEQUAL">Occurs On or Before</option>
                                <option value="EQUAL">Occurs Simultaneously With</option>
                            </select>
                            <br />
                            <select id="refDate2" name="refDate2" style="width:100px;">
                                <option value="STARTDATE">Start of</option>
                                <option value="ENDDATE">End of</option>
                            </select>
                            <select id="aggregationOp2" name="aggregationOp2" style="width:150px;">
                                <option value="FIRST">the First Ever</option>
                                <option value="LAST">the Last Ever</option>
                                <option value="ANY">any</option>
                            </select>
                            <span id="trailingEventNameSpan" class="eventName">Event 2</span>
                            <br />
                            <input id="spanCheck1" name="spanCheck1" type="checkbox">
                            By
                            <select id="spanOp1" name="spanOp1" style="width:50px;">
                                <option value="GREATER">&gt;</option>
                                <option value="GREATEREQUAL" selected>&ge;</option>
                                <option value="EQUAL">=</option>
                                <option value="LESSEQUAL">&le;</option>
                                <option value="LESS">&lt;</option>
                            </select>
                            <input id="spanValue1" name="spanValue1" style="width:50px;" type="text" value="1">
                            <select id="spanUnits1" name="spanUnits1" style="width:100px;">
                                <option value="HOUR">hour(s)</option>
                                <option value="DAY" selected>day(s)</option>
                                <option value="MONTH">month(s)</option>
                                <option value="YEAR">year(s)</option>
                            </select>
                            <br />
                            <input id="spanCheck2" name="spanCheck2" type="checkbox">
                            And
                            <select id="spanOp2" name="spanOp2" style="width:50px;">
                                <option value="GREATER">&gt;</option>
                                <option value="GREATEREQUAL">&ge;</option>
                                <option value="EQUAL">=</option>
                                <option value="LESSEQUAL" selected>&le;</option>
                                <option value="LESS">&lt;</option>
                            </select>
                            <input id="spanValue2" name="spanValue2" style="width:50px;" type="text" value="1">
                            <select id="spanUnits2" name="spanUnits2" style="width:100px;">
                                <option value="HOUR">hour(s)</option>
                                <option value="DAY" selected>day(s)</option>
                                <option value="MONTH">month(s)</option>
                                <option value="YEAR">year(s)</option>
                            </select>
                        </div>
                    </div>
                </div>
                <!-- Overwriting the default top position --> 
                <!-- Debug output --> 
                <!-- <div id="main.debug" style="position: absolute; top: 300px; left: 300px; color: red"> <p></p><br> </div> --> 
                <!-- ############### <Draggable Splitter> ############### --> 
            </div>
            <!-- Modal -->
            <div class="modal fade" id="signup" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="signUpLabel" aria-hidden="true">
                <div class="modal-dialog" id="signup-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="signUpLabel">Sign Up</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div class="card border-0">
                                <div class="card-body">
                                    <form id="registration" action="registration/user/local/" method="post">
                                        <div class="row">
                                            <div class="col-6 local_signup">
                                                <div class="card bg-light h-100">
                                                    <div class="card-body">
                                                        <input type="hidden" id="hostName" name="hostName" value="" />
                                                        <div class="row g-2">
                                                            <div class="col-sm-6">
                                                                <label for="firstName" class="form-label">First name:</label>
                                                                <input type="text" class="form-control form-control-sm" id="firstName" name="firstName" value="" required="required" />
                                                            </div>
                                                            <div class="col-sm-6">
                                                                <label for="lastName" class="form-label">Last name:</label>
                                                                <input type="text" class="form-control form-control-sm" id="lastName" name="lastName" value="" required="required" />
                                                            </div>
                                                            <div class="col-12">
                                                                <label for="email" class="form-label">Email:</label>
                                                                <input type="email" class="form-control form-control-sm" id="email" name="email" value="" required="required" />
                                                            </div>
                                                            <div class="col-12">
                                                                <label for="username" class="form-label">Username:</label>
                                                                <input type="text" class="form-control form-control-sm" id="username" name="username" value="" required="required" />
                                                            </div>
                                                            <div class="col-12 password_field">
                                                                <label for="password" class="form-label">Password:</label>
                                                                <input type="password" class="form-control form-control-sm mb-0" id="password" name="password" value="" required="required" />
                                                            </div>
                                                            <div class="col-12 password_field">
                                                                <label for="confirmPassword" class="form-label">Confirm Password:</label>
                                                                <input type="password" class="form-control form-control-sm mb-0" id="confirmPassword" name="confirmPassword" value="" required="required" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-6" id="terms-registration">
                                                <div id="term_conditions">
                                                    <div class="mb-3">
                                                        <textarea class="w-100" id="terms" rows="16" readonly="readonly" style="resize: none;"></textarea>
                                                    </div>
                                                    <div class="form-check">
                                                        <label class="form-check-label" for="agree-local">
                                                            <input class="form-check-input" type="checkbox" id="agree-local" name="agree" onchange="handleAgreeChbx(this);" /> I accept the Terms & Conditions
                                                        </label>
                                                    </div>
                                                </div>
                                                <div class="col-12 local_signup">
                                                    <button class="w-100 btn btn-sm btn-primary mt-4 register_btn" type="submit" disabled="disabled">Sign Up</button>
                                                </div>
                                                <div class="d-grid col-12 mx-auto saml_signup">
                                                    <button class="btn btn-sm btn-idp saml_signup register_btn mt-3" type="button" onclick="location.href = 'registration/user/federated/';" disabled="disabled">
                                                        <img role="img" id="loginIdpIcon" src="#" alt="" width="16" height="16" />Register via <span id="loginIdp"></span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <script src="assets/bootstrap/js/bootstrap.bundle.min.js"></script>
            <script src="assets/jquery-validation/jquery.validate.min.js"></script>
        </body>
    </html>
    <?php
}
