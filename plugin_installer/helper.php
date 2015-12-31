<?php
 
#-------------------------------------------------------------------------------------------------------------------------
# i2b2 Automatic Webclient Plugins Manager (helper.php)
#-------------------------------------------------------------------------------------------------------------------------
# 2015-12-17 1.0.004 S.W.Chan      initialized.
#-------------------------------------------------------------------------------------------------------------------------

function checkAuth($r, $d, $u, $k, $v, $dbg) {
    $uDC = base64_decode(substr($u, 0, strpos($u, "%%enCryptEd%%") - 1));
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
         '			<username>' . $uDC . '</username>' .
         '			' . base64_decode(base64_decode($k)) .
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

function get_plugin_quick($manifest_url) {
	$manifest_file = file_get_contents($manifest_url);
	$manifest = json_decode($manifest_file);
	return $manifest;
}

function get_plugin($manifest_url) {
  $manifest = get_plugin_quick($manifest_url);
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

function dir_exist($dir, $webclient_path, $blue_phrase, $red_msg_start) {
    $path = $dir; 
    $path_phrase = sprintf($blue_phrase, $path);
    $err_path_phrase = sprintf("<li>%sFolder</font> %s%s", $red_msg_start, $path_phrase, $red_msg_start);
    if (file_exists($path)) {
        if (is_dir($path)) {
            print sprintf("<li>Folder %s already exists.<br/><br/></li>", $path_phrase);
            return true;
        } else {
            print sprintf("%s already exists as a file, please fix and retry!</font></li>", $err_path_phrase);
            return false;
        }
    } else if (mkdir($path)) {
        print sprintf("<li>Folder %s has been created successfully<br/><br/><li>", $path_phrase);
        return true;
    } else {
        $msg = sprintf($blue_phrase, str_replace("//", "/", $webclient_path . "js-i2b2/cells/plugins/"));
        print sprintf("%s could not be created, please check access right to %s and retry!</font></li>", $err_path_phrase, $msg);
        return false;
    }
}

function genJsPostNextPageFunc($url, $domain, $user, $key, $vers) {
    $s = "<script type='text/javascript'>function postNextPage(nextPage,pluginFolder,pluginManifest){" . 
         "var mapForm=document.createElement('form');mapForm.target='_self';mapForm.method='POST';mapForm.action=nextPage;" .
         "var mapInput1=document.createElement('input');mapInput1.type='hidden';" . 
         "mapInput1.name='rul';mapInput1.value='".$url."';mapForm.appendChild(mapInput1);" .
         "var mapInput2=document.createElement('input');mapInput2.type='hidden';" . 
         "mapInput2.name='noisreVcw';mapInput2.value='".$vers."';mapForm.appendChild(mapInput2);" .
         "var mapInput3=document.createElement('input');mapInput3.type='hidden';" .
         "mapInput3.name='niamod';mapInput3.value='".$domain."';mapForm.appendChild(mapInput3);" .
         "var mapInput4=document.createElement('input');mapInput4.type='hidden';" . 
         "mapInput4.name='esur';mapInput4.value='".$user."';mapForm.appendChild(mapInput4);" .
         "var mapInput5=document.createElement('input');mapInput5.type='hidden';" . 
         "mapInput5.name='yek';mapInput5.value='".$key."';mapForm.appendChild(mapInput5);" .
         "var mapInput6=document.createElement('input');mapInput6.type='hidden';" . 
         "mapInput6.name='dir';mapInput6.value=pluginFolder;mapForm.appendChild(mapInput6);" .
         "var mapInput7=document.createElement('input');mapInput7.type='hidden';" . 
         "mapInput7.name='pkg';mapInput7.value=pluginManifest;mapForm.appendChild(mapInput7);mapForm.submit();}</script>";
    print $s;
}

?>

