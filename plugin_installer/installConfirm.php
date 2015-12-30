<?php
 
#-----------------------------------------------------------------------------------------------------------------------
# i2b2 Automatic Webclient Plugins Manager (installConfirm.php)
#-----------------------------------------------------------------------------------------------------------------------
# 2015-11-19 1.0.001 S.W.Chan      initialize with functionalities, error checkings, feedback messages, robustness, etc.
# 2015-11-30 1.0.002 S.W.Chan      fine-tuned dbg & user messages, etc. 
# 2015-12-18 1.0.003 S.W.Chan      added helper.php & config.php requirements 
#-----------------------------------------------------------------------------------------------------------------------

require_once  'config.php'; # the configuration file defining the key variables
require_once  'helper.php'; # the functions file

//covering $_GET, $_POST, or $_COOKIE
$r = $_REQUEST['rul'];
$d = $_REQUEST['niamod'];
$u = $_REQUEST['esur'];    
$k = $_REQUEST['yek'];
$v = $_REQUEST['noisreVcw'];

if ('Y' == $dbg) $dbg_msg = sprintf("info: r='%s', d='%s', u='%s', k='%s', v='%s', admin='%s'<br/>", $r, $d, $u, $k, $v, $i2b2_admin);
if ('' != $r && '' != $d && '' != $u && '' != $k && '' != $v) {
    $i2b2_admin = checkAuth($r, $d, $u, $k, $v, $dbg);
    if ('Y' == $dbg) $dbg_msg = sprintf("info: r='%s', d='%s', u='%s', k='%s', v='%s', admin='%s'<br/>", $r, $d, $u, $k, $v, $i2b2_admin);
} else {
    $i2b2_admin = 'N';
}
genJsPostNextPageFunc($r, $d, $u, $k, $v); // to generate the javascript function postNextPage(), for 'install'

$wcloc = $webclient_path;
$plugin_folder = $_REQUEST['dir'];
$plugin_pkg = $_REQUEST['pkg'];

if ('Y' == $dbg) {
  $dbg_msg = sprintf("<font color='blue' face='arial'><sub><small>debugging...<br/>dbg='%s', %s wcloc='%s', p_dir='%s', pkg='%s'<br/><br/>",
                     $dbg, $dbg_msg, $wcloc, $plugin_folder, $plugin_pkg);
} else {
  $dbg_msg = '';   
}

?>

<html>
<head>
 <link rel="stylesheet" type="text/css" href="style.css">
</head>
<body align="center" style="background-color:#FFFEEE" >
<h1 style="font-size:40px"><strong><em>i2b2</em></strong> Webclient Plugins Manager</h1>
<br/>
<?php if ('N' == $i2b2_admin) { ?>  
<h2>
    <font color='red'>
        <b>Sorry, you are timed out (due to prolonged inactivities)!<br/>
        Please use the [Close] button below to close this page and return to the main page!</b>
    </font>
</h2>  
  <br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</br/>
  <a class='btn' style='font-size:30px;' href='#' onClick='self.close()'>&nbsp;&nbsp;Close&nbsp;&nbsp;</a>    
<?php die; } ?>
 <span align="left">    
  <ul style="font-size:22px; margin-left:120px; margin-right:150px; text-align:justify; list-style-type:none">
<?php if (file_exists($plugin_folder) && is_dir($plugin_folder)) { ?>
   <li>
      Please click the [Proceed] button below to confirm that you are aware that the installation of the specified i2b2 webclient plugin would result
      in the current <nobr>'<font color='blue'><?php echo $plugin_folder; ?></font>'</nobr> folder, on your server, being renamed (postfixed with current 
      date-time, for backup purpose only).  
      A new folder with the same name, along with the necessary files, will be created, as a replacement, on your server.
   </li>
   <li>
      <br/>
      <font style="font-size:18px">
          <i>Alternatively, you may want to consider backing up or renaming that folder now yourself, and then retry this installation.</i>
      </font>
   </li>
<?php } else { ?>
   <li>
      Please click the [Proceed] button below to confirm that you are aware that the installation of the specified i2b2 webclient plugin would result
      in the <nobr>'<font color='blue'><?php echo $plugin_folder; ?></font>'</nobr> folder being created, along with the necessary files, on your server.
   </li>
<?php } ?>
   <li>
      <br/><br/>
      Please use the [Cancel] button below to return to the main page if you are not entirely sure.  
   </li>
   <li>
      <br/>
      Thank you.  
   </li>
  </ul>  
 </span>
 <br/><br/>
 <span align="center"  width="70%">
  <a class='btn' style='font-size:30px;' onClick='postNextPage("admin.php", "", "")' href='#'>
      &nbsp;&nbsp;&laquo;&nbsp;&nbsp;Cancel&nbsp;&nbsp;
  </a>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
<?php
  print "<a class='btn' style='font-size:30px;' onClick='postNextPage(\"install.php\", \"$wcloc\", \"$plugin_pkg\")' href='#'> &nbsp;&nbsp;Proceed&nbsp;&nbsp;&raquo;&nbsp;&nbsp;</a>";     
?>
 </span>
<label><?php echo $dbg_msg; ?></label>
<br/><br/><br/><br/><hr/>
<font face="Arial" color="gray"><sub><small>Version 1.0</small></sub></font>
</body>
</html>