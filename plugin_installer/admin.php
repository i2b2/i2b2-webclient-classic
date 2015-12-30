<?php
 
#-------------------------------------------------------------------------------------------------------------------------
# i2b2 Automatic Webclient Plugins Manager (admin.php)
#-------------------------------------------------------------------------------------------------------------------------
# 2015-06-23 1.0.001 N.Wattanasin  initial prototype as proof of concept and layout of framework
# 2015-11-19 1.0.002 S.W.Chan      added attributes, functionalities, error checkings, feedback messages, robustness, etc.
# 2015-11-25 1.0.003 S.W.Chan      added options to launch under 'admin', 'user', or standalone (from i2b2 website), etc.
# 2015-12-07 1.0.004 S.W.Chan      added extra security check for user authority, etc.
# 2015-12-11 1.0.005 S.W.Chan      fine-tuned for QA-ready.
# 2015-12-18 1.0.006 S.W.Chan      moved all functions to helper.php, moved input field vars to config.php  
#-------------------------------------------------------------------------------------------------------------------------

require_once  'config.php'; # the configuration file defining the key variables
require_once  'helper.php'; # the functions file

$repo_name = '';
$plugins_topfolder = '';
$plugins = array();
$err_msg = '';
$dbg_msg = '';
if (!isset($webclient_path) || 0 == strlen(trim($webclient_path))) {
    $err_msg =  "<h2><font color='red'><b>Please retry after specifying the path of your webclient<br/> (e.g. '/var/www/html/webclient/', 'c:\inetpub\webclient\', etc.)<br/> in your config.php!</b></font></h2>";
    $go = false;
} else if (!isset($repo_url) || 0 == strlen(trim($repo_url))) {
    $err_msg =   "<h2><font color='red'><b>Please retry after specifying the URL of the repository of i2b2 webclient plugins<br/> (e.g. 'https://raw.githubusercontent.com/i2b2/PLUGIN-i2b2-catalogs/master/i2b2-wc.repo')<br/> in your config.php!</b></font></h2>";
    $go = false;
} else {
    $go = true;
}
$wc_loc = $webclient_path;
if (!file_exists($wc_loc) && 'Y' == $i2b2_admin) { #doesn't matter if it's a regular user, who can't install any way
    $err_msg = sprintf("Folder '%s' does not exist!", $wc_loc);
}
$plugins_topfolder = str_replace("//", "/", $wc_loc . "/js-i2b2/cells/plugins/");
if (!isset($dbg)) $dbg = 'N';
if (isset($dbg) && 'Y' == $dbg) {
    $dbg_msg = sprintf("debugging...debug='%s', i2b2Admin='%s', plugins_topfolder ='%s'<br/>", $dbg, $i2b2_admin, $plugins_topfolder);
}
get_repository($repo_url);
foreach($plugins as $plugin) {
    $dbg_msg .= check_installed_plugin_versions($plugin, $plugins_topfolder);
}
if ('Y' != $dbg) {
    $dbg_msg = "";
}

//covering $_GET, $_POST, or $_COOKIE
$r = $_REQUEST['rul'];
$d = $_REQUEST['niamod'];
$u = $_REQUEST['esur'];
$k = $_REQUEST['yek'];
$v = $_REQUEST['noisreVcw'];
if ('Y' == $dbg) $dbg_msg = sprintf("info: r='%s', d='%s', u='%s', k='%s', v='%s', admin='%s'<br/>", $r, $d, $u, htmlspecialchars($k), $v, $i2b2_admin);
if (false !== stripos($k, "password")) { $k = base64_encode(base64_encode($k)); }
if (false === stripos($u, "%%enCryptEd%%")) { $u = base64_encode($u) . "%%enCryptEd%%"; }

if ('' != $r && '' != $d && '' != $u && '' != $k && '' != $v){
    if (false === stripos($r, "getServices")) { $r .= "getServices"; }
    $i2b2_admin = checkAuth($r, $d, $u, $k, $v, $dbg);
} else {
    $i2b2_admin = 'N';
}
genJsPostNextPageFunc($r, $d, $u, $k, $v); // to generate the javascript function postNextPage(), for 'install'

if ('Y' == $dbg) {
  $dbg_msg .= sprintf("info: debug='%s', i2b2_Admin='%s', curDir-parent='%s', wc_loc='%s'", $dbg, $i2b2_admin, dirname(__DIR__), $wc_loc);
  $dbg_msg .= sprintf("<br/>      u='%s', uDC='%s', k=%s", $u, base64_decode(substr($u, 0, strpos($u, "%%enCryptEd%%") - 1)), $k);
}

?>

<html>
<head>
 <link rel="stylesheet" type="text/css" href="style.css">
</head>
<body align="center" style="background-color:#FFFEEE">
<h1 style="font-size:40px"><strong><em>i2b2</em></strong> Webclient Plugins Manager</h1>
<br/>
<?php if ('Y' == $dbg) { ?>
<font color='red' face='arial'><b><label><?php echo $err_msg; ?></label></b></font>
<br/>
<font color='blue' face='arial'><sub><small><label><?php echo $dbg_msg; ?></label></small></sub></font>
<br/><br/>
<?php } ?>
<?php if ($go) { ?>
<h2>Gallery: 
    <span style="font-size:24px;padding:10px;color:#fff;background:#642EFE;"><!--was background:#4264C8;-->
        <strong><?php echo $repo_name; ?></strong>
    </span>
<?php if ('N' == $i2b2_admin) { ?>
    <br/><br/><b>Please contact your i2b2 Administrator to request adding any available plugins.</b><br/>
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
  if ('' == trim($plugin->name) || '' == trim($plugin->id) || '' == trim($plugin->package)) { 
      continue; // skip the ones corresponding to manifest that cannot be accessed, or missing folder name, or no zip 
  } 
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
  if (isset($plugin->wikiSite) && '' != trim($plugin->wikiSite)) {
    $docs .= "<a class='btn' href='$plugin->wikiSite' target='_blank' title='i2b2 Community wiki for this plugin'>Wiki</a><br/>";
  }
  if (isset($plugin->userManual) && '' != trim($plugin->userManual)) {
    $docs .= "<br/><a class='btn' href='$plugin->userManual' target='_blank' title='User Manual for this plugin'><nobr>User Manual</nobr></a><br/>";
  }
if ('Y' == $i2b2_admin) { 
  if (isset($plugin->installGuide) && '' != trim($plugin->installGuide)) {
    $docs .= "<br/><a class='btn' href='$plugin->installGuide' target='_blank' title='Installation Guide for this plugin'><nobr>Installation Guide</nobr></a>";
  }
}
  print ($docs . "<br/>&nbsp;</td>");
if ('Y' == $i2b2_admin) { 
  print "\n<td style='text-align:center'>$plugin->id</td>";
  print "\n<td style='text-align:center'>" . str_replace("'", "\"", str_replace("]", "", str_replace("[", "", $plugin->roles))) . "</td>";
  print "\n<td style='text-align:center'>&nbsp;<br/><a class='btn' onClick='postNextPage(\"installConfirm.php\", \"$plugin->folder\", \"$plugin->manifest\")' href='#'>Install</a><br/> ";
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
 <br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;c) The '<i>community</i>' group contains all popular plugins not distributed with the i2b2 webclient; 
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
