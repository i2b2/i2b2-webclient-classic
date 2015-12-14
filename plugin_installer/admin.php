<?php
 
#-------------------------------------------------------------------------------------------------------------------------
# i2b2 Automatic Webclient Plugins Manager (admin.php)
#-------------------------------------------------------------------------------------------------------------------------
# 2015-06-23 1.0.001 N.Wattanasin  initial prototype as proof of concept and layout of framework
# 2015-11-19 1.0.002 S.W.Chan      added attributes, functionalities, error checkings, feedback messages, robustness, etc.
# 2015-11-25 1.0.003 S.W.Chan      added options to launch under 'admin', 'user', or standalone (from i2b2 website), etc.
# 2015-12-07 1.0.004 S.W.Chan      added extra security check for user authority, etc.
# 2015-12-11 1.0.005 S.W.Chan      fine-tuned for QA-ready.
#-------------------------------------------------------------------------------------------------------------------------

#-- for php debug only (don't uncomment unless necessary, don't release when uncommented)
#ini_set('display_errors', 'On');   
#error_reporting(E_ALL | E_STRICT); 
#--

function checkAuth($r, $d, $u, $k, $v, $dbg) {
    $s = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' .
         '<i2b2:request xmlns:i2b2="http://www.i2b2.org/xsd/hive/msg/1.1/" xmlns:pm="http://www.i2b2.org/xsd/cell/pm/1.1/">' .
         '    <message_header>' .
         '      <proxy>' .
         '        <redirect_url>' . $r . '</redirect_url>' .
         '      </proxy>' .
         '        <i2b2_version_compatible>1.1</i2b2_version_compatible>' .
         '        <hl7_version_compatible>2.4</hl7_version_compatible>' .
         '        <sending_application>' .
         '            <application_name>i2b2 Project Management</application_name>' .
         '            <application_version>' . $v . '</application_version>' .
         '        </sending_application>' .
         '        <sending_facility>' .
         '            <facility_name>i2b2 Hive</facility_name>' .
         '        </sending_facility>' .
         '        <receiving_application>' .
         '            <application_name>Project Management Cell</application_name>' .
         '            <application_version>' . $v . '</application_version>' .
         '        </receiving_application>' .
         '        <receiving_facility>' .
         '            <facility_name>i2b2 Hive</facility_name>' .
         '        </receiving_facility>' .
         '        <datetime_of_message>' . date('c') . '</datetime_of_message>' .
         '		<security>' .
         '			<domain>' . $d . '</domain>' .
         '			<username>' . $u . '</username>' .
         '			' . $k .
         '		</security>' .
         '        <message_control_id>' .
         '            <message_num>RG6ZhK0bR3k51Fr7CE31e</message_num>' .
         '            <instance_num>0</instance_num>' .
         '        </message_control_id>' .
         '        <processing_id>' .
         '            <processing_id>P</processing_id>' .
         '            <processing_mode>I</processing_mode>' .
         '        </processing_id>' .
         '        <accept_acknowledgement_type>AL</accept_acknowledgement_type>' .
         '        <application_acknowledgement_type>AL</application_acknowledgement_type>' .
         '        <country_code>US</country_code>' .
         '        <project_id>undefined</project_id>' .
         '    </message_header>' .
         '    <request_header>' .
         '        <result_waittime_ms>180000</result_waittime_ms>' .
         '    </request_header>' .
         '    <message_body>' .
         '        <pm:get_user_configuration>' .
         '            <project>undefined</project>' .
         '        </pm:get_user_configuration>' .
         '    </message_body>' .
         '</i2b2:request>';
    if ('Y' == $dbg) {
        echo "<br/><hr/><div align='left'><code>" . htmlentities($s) . "</code></div><br/><hr/>" . $r;
    }
    $ch = curl_init($r);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array('Content-Type: text/xml'));
    curl_setopt($ch, CURLOPT_POSTFIELDS, "$s");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $curl_response = curl_exec($ch);
    if (!$curl_response) {
        echo curl_error($ch);
    }
    curl_close($ch);   
    $isAdmin = get_isAdmin($curl_response);
    if ('Y' == $dbg) {
        echo "<br/><hr/><div align='left'><code>" . htmlentities($curl_response) . "</code></div><br/><hr/><b>isAdmin='" . $isAdmin . "'</b><br/><hr/>";
    }
    return $isAdmin;
}

function get_isAdmin($xml) {
# note that the response to this 'getUserAuth using the sessionKey' somehow always states '<is_admin>false</is_admin>' for un-associated (with any proj) 'admin'
# however, associated common users will always have '<role>' elements even though they also have '<is_admin>false</is_admin>' in response, 
# whereas un-associated common users cannot log into either admin or webclient, and therefore cannot launch this installer
# furthermore, if this invocation using mis-appropriated user name & session key would result in 'Session invalid'   
    if (false === stripos($xml, '<is_admin>true</is_admin>')) {
        if (false === stripos($xml, '<status type="ERROR">Session invalid</status>')  && 
            false === stripos($xml, '<user_name>demo</user_name>') && #in case of hijacked, un-removed & un-assoxiated built-in 'demo' user 
            false !== stripos($xml, '<user>') &&
            false === stripos($xml, '<role>')) {
            return 'Y';
        } else {
            return 'N';
        }
    } else {
        return 'Y';
    }
}

function get_repository($repo_url) {
  global $repo_name, $plugins;
  $repo_file = file_get_contents($repo_url);
  $repo = json_decode($repo_file);
  $repo_name = $repo->name;
  foreach($repo->plugins as $plugin) {
    array_push($plugins, get_plugin($plugin->manifest));
  }
}

function get_plugin($manifest_url) {
  $manifest_file = file_get_contents($manifest_url);
  $manifest = json_decode($manifest_file);
  $manifest->manifest = $manifest_url;
  $manifest->installed = "";
  $manifest->installedVersion = "";
  $manifest->folder = "";
  if ("" == $manifest->configuration) {
      $manifest->configuration = "None required.";
  }
  return $manifest;
}

function check_installed_plugin_versions($plugin, $wcp_top) {
  $plugin_manifest = '';  
  #$plugin->folder = realpath($wcp_top . $plugin->group . "/" . $plugin->id); // realpath() becomes "" if that path doesn't exist!
  $plugin->folder = $wcp_top . $plugin->group . "/" . $plugin->id;
  $dbg_msg = sprintf("%s: group='%s', folder='%s', manifest='", $plugin->id, $plugin->group, $plugin->folder);
  if (file_exists($plugin->folder) && is_dir($plugin->folder)) {
    $plugin->installed = "YES";
    $plugin_manifest = $plugin->folder . "/" . $plugin->id . ".manifest";    
    if (file_exists($plugin_manifest) && !is_dir($plugin_manifest)) {
      $installed_plugin = get_plugin($plugin_manifest);
      $plugin->installedVersion = $installed_plugin->plugin_version;
    } else {
      $plugin->installedVersion = "unknown";
    }
  }
  $dbg_msg .= sprintf("%s', installed='%s', installedVers='%s'<br/>", $plugin_manifest, $plugin->installed, $plugin->installedVersion); 
  return $dbg_msg;
}

$wc_loc = '';
#$repo_url = 'http://localhost/webclient/plugin_installer/i2b2.repo';
$repo_url = 'https://raw.githubusercontent.com/i2b2/PLUGIN-i2b2-catalogs/master/i2b2-wc.repo';
$repo_name = '';
$plugins_topfolder = '';
$plugins = array();
$err_msg = '';
$dbg_msg = '';
$dbg = '';
$dbg_trigger = "/Users/swc21/git/";

if (isset($_POST['wcloc']) && isset($_POST['repo'])) {
  if ('' == $_POST['wcloc'] || '' == $_POST['repo']) {
    $err_msg = "Please provide relevant information to fields";
  } else {
    $i2b2_admin = $_POST['imdan']; #retrieves reposted info
    $wc_loc = $_POST['wcloc'];
    if (!file_exists($wc_loc) && 'Y' == $i2b2_admin) { #doesn't matter if it's a regular user, who can't install any way
      $err_msg = sprintf("Folder '%s' does not exist!", $wc_loc);
    }
    $plugins_topfolder = $wc_loc . "/js-i2b2/cells/plugins/";
    $dbg = $_POST['debug']; #retrieves reposted info
    if ('Y' == $dbg) {
      $dbg_msg = sprintf("debugging...debug='%s', i2b2Admin='%s', plugins_topfolder ='%s'<br/>", $dbg, $i2b2_admin, $plugins_topfolder);
    }
    $repo_url = $_POST['repo'];
    get_repository($repo_url);
    foreach($plugins as $plugin) {
      $dbg_msg .= check_installed_plugin_versions($plugin, $plugins_topfolder);
    }
    if ('Y' != $dbg) {
      $dbg_msg = "";
    }
  }
} else {
  if ((isset($_GET['debug']) && 'Y' == $_GET['debug']) || (isset($_GET['sett']) && 'Y' == $_GET['sett'])) {
    $dbg = 'Y';
  }
 #$cwd = getcwd();
  $cwd_parent = dirname(__DIR__);
  $r = $_GET['rul'];
  $d = $_GET['niamod'];
  $u = $_GET['esur'];    
  $k = $_GET['yek'];
  $v = $_GET['noisreVcw'];
  if ('' != $r && '' != $d && '' != $u && '' != $k && '' != $v){
      $r .= "getServices";
      if ('Y' == $dbg) $dbg_msg = sprintf("info: r='%s', d='%s', u='%s', k='%s', v='%s', dbg='%s'<br/>", $r, $d, $u, $k, $v, $dbg);
      $i2b2_admin = checkAuth($r, $d, $u, $k, $v, $dbg);
  } else {
      $i2b2_admin = 'N';
  }
    
  if (-1 < strpos($cwd_parent, $dbg_trigger) && 'Y' == $dbg) {
    $wc_loc = "/users/swc21/test/"; #for swc's testing & debug purposes only      
  } else if ('Y' == $i2b2_admin) {
    $wc_loc = dirname($cwd_parent) . "/webclient/";
  } else { // if ('N' == $i2b2_admin)
    $wc_loc = $cwd_parent;
  }
}
if ('Y' == $dbg) {
  $dbg_msg .= sprintf("info: debug='%s', i2b2_Admin='%s', curDir-parent='%s', wc_loc='%s'", $dbg, $i2b2_admin, $cwd_parent, $wc_loc);
}

?>

<html>
<head>
 <link rel="stylesheet" type="text/css" href="style.css">
</head>
<body align="center" style="background-color:#FFFEEE">
<h1 style="font-size:40px"><strong><em>i2b2</em></strong> Webclient Plugins Manager</h1>
<!--
<img src="i2b2-wcp2.png" alt="" width=480 height=280>
-->    
<img src="i2b2_hive.png" alt="" ><br/><br/>
<span>
 <form action="admin.php" method="POST" id="adminform">
  <input type="hidden" name="debug" value="<?php echo $dbg; ?>" />
  <input type="hidden" name="imdan" value="<?php echo $i2b2_admin; ?>" />
<?php if ('Y' == $i2b2_admin) { ?>
  <span style="font-size:20px;"><strong>Location of your i2b2 webcient:</strong></span>
  <input type="text" name="wcloc" style="width:500px;" value="<?php echo $wc_loc; ?>" />
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <br/><br/>
<?php } else { ?>
  <input type="hidden" name="wcloc" value="<?php echo $wc_loc; ?>" />
<?php } ?>
  <span style="font-size:20px;"><strong>Repository URL:</strong></span>
  <input type="text" name="repo" style="width:720px;" value="<?php echo $repo_url; ?>" readonly="readonly" /> 
  <a class="btn" style="font-size: 20px;" href="#" onclick="document.getElementById('adminform').submit();">Open &rarr;</a>     
 </form>
</span>
<font color='red' face='arial'><b><label><?php echo $err_msg; ?></label></b></font>
<br/>
<font color='blue' face='arial'><sub><small><label><?php echo $dbg_msg; ?></label></small></sub></font>
<br/>
<?php if(isset($_POST['wcloc']) && isset($_POST['repo']) && "" == $err_msg) { ?>
<h2>Gallery: 
    <span style="font-size:24px;padding:10px;color:#fff;background:#642EFE;"><!--was background:#4264C8;-->
        <strong><?php echo $repo_name; ?></strong>
    </span>
<?php if ('N' == $i2b2_admin) { ?>
    <br/><br/><b>Please contact your i2b2 Administrator to request (with justifications) adding any available plugins.</b><br/>
<?php } else { ?>
    <sup><small><font face="Helvetica" color="blue">[1][2][3]</font></small></sup>
<?php } ?>
</h2>
<table cellspacing="0" border="1" style="font-size:14px; border-collapse:collapse; " width="100%">
 <thead style="background-color:#A9E2F3">
  <tr>
    <th>Plugin Name</th>
    <th>Plugin Description</th>
    <th style='text-align:center'>Plugin Group<?php if ('Y' == $i2b2_admin) { ?><sup><small>[4]</small></sup><?php } ?></th>
    <th style='text-align:center'>Currently Installed?</th>
    <th style='text-align:center'>Installed Version</th>
    <th style='text-align:center'>Latest Version</th>
    <th>Updates in this Version</th>
    <th style='text-align:center'>Certified for i2b2 Version</th>
    <th style='text-align:center'>Historical Community Contributors</th>
    <th style='text-align:center'><nobr>More Information</nobr></th>
<?php if ('Y' == $i2b2_admin) { ?>
    <th style='text-align:center'>Folder Name<sup><small>[5]</small></sup></th>
    <th style='text-align:center'>User Roles</th>
    <th style='text-align:center'>Action</th>
    <th style='text-align:center'>Configuration After Installation</th>
<?php } ?>
  </tr>
 </thead>
 <tbody>

<?php
foreach($plugins as $plugin){
  if ('' == trim($plugin->name)) { continue; } // skip the ones corresponding to manifest that cannot be accessed 
  print "\n<tr>";
  print "\n<td>$plugin->name</td>";
  print "\n<td style='text-align:left'>$plugin->description</td>";
  print "\n<td style='text-align:center'>$plugin->group</td>";
  print "\n<td style='text-align:center'>$plugin->installed</td>";
  print "\n<td style='text-align:center'>$plugin->installedVersion</td>";
  print "\n<td style='text-align:center'>$plugin->plugin_version</td>";
  print "\n<td style='text-align:left'>$plugin->changes</td>";
  print "\n<td style='text-align:center'>$plugin->i2b2_version</td>";
  if (isset($plugin->contributors)) {
    print "\n<td style='text-align:center'><small>$plugin->contributors</small></td>";
  } else { 
    print "\n<td></td>";
  }
  $docs = "\n<td style='text-align:center'>&nbsp;<br/>";                             
  if (isset($plugin->wikiSite)) {
    $docs .= "<a class='btn' href='$plugin->wikiSite' target='_blank' title='i2b2 Community wiki for this plugin'>Wiki</a><br/>";
  }
  if (isset($plugin->userManual)) {
    $docs .= "<br/><a class='btn' href='$plugin->userManual' target='_blank' title='User Manual for this plugin'><nobr>User Manual</nobr></a><br/>";
  }
if ('Y' == $i2b2_admin) { 
  if (isset($plugin->installGuide)) {
    $docs .= "<br/><a class='btn' href='$plugin->installGuide' target='_blank' title='Installation Guide for this plugin'><nobr>Installation Guide</nobr></a>";
  }
}
  print ($docs . "<br/>&nbsp;</td>");
if ('Y' == $i2b2_admin) { 
  print "\n<td style='text-align:center'>$plugin->id</td>";
  print "\n<td style='text-align:center'>" . str_replace("'", "\"", str_replace("]", "", str_replace("[", "", $plugin->roles))) . "</td>";
  print "\n<td style='text-align:center'>&nbsp;<br/><a class='btn' href='installConfirm.php?dbg=$dbg&wc_loc=$wc_loc&dir=$plugin->folder&pkg=$plugin->manifest' target='_blank'>Install</a><br/> ";
  print "<br/><a class='btn' href='$plugin->package' title='download the package of this plugin only'>Download</a><br/>&nbsp;</td>";
  print "\n<td style='text-align:center'>$plugin->configuration</td>";
}
  print "\n</tr>";
}

?>

 </tbody>
</table>

<?php if ('Y' == $i2b2_admin) { ?>
<p align="left" style="font-size:12px; font-family:Helvetica; padding:4px;">
 NOTE:<br/>
 <br/>[1] Only "standalone" (i.e. NOT accompanying new or modified cells) webclient plugins are eligible for automated installation.
 <br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;a) Please ensure that your i2b2 webclient folder write access has been set properly to enable 
                                             installations.<br/>
 <br/>[2] Please contact us to submit your plugin to our repository for automated installation, with the following information:
 <br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;a) any dependent standard javascript libraries to be included;
 <br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;b) any installation guide, readme, or user's manual to be included.<br/>
 <br/>[3] Please check the resulting display to see if a plugin requires additional installation steps beyond the basic ones automated.<br/>
 <br/>[4] '<b>Plugin Group</b>' refers to the name of the webclient intermediary subdirectory 
          ('<i>examples</i>', '<i>standard</i>', '<i>community</i>') that houses the codes for this plugin.
 <br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;a) The '<i>examples</i>' group houses all plugins that are of example nature 
                                             (e.g. '<i>ExampHello</i>', etc.);
 <br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;b) All the "standard issue" plugins that ship with the i2b2 webclient are under the '<i>standard</i>'
                                             group (e.g. '<i>Dem1Set</i>', etc.);
 <br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;c) The '<i>community</i>' group conatains all popular plugins not distributed with the i2b2 webclient; 
                                             they are usually developed and shared by community institutions (e.g. '<i>ExportXLS</i>', etc.).
 <br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>***** NOTICE that if a popular plugin has its previous version installed under the '<i>standard</i>' group, 
                                          then it won't be detected (as it is expected under the '<i>community</i>' group only). *****</b><br/> 
 <br/>[5] '<b>Folder Name</b>' refers to the name of the subdirectory within the webclient directory that houses the codes for this plugin.
 <br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;We included this information here to facilitate your finding out if you already have
          the corresponding plugin installed.
</p>
<?php } ?>
<?php } ?>
<br/><br/><br/><br/><hr/>
<font face="Arial" color="gray"><sub><small>Version 1.0</small></sub></font>
</body>
</html>
