<?php

$script = filter_input(INPUT_SERVER, 'SCRIPT_FILENAME', FILTER_SANITIZE_STRING);
$https = filter_input(INPUT_SERVER, 'HTTPS', FILTER_SANITIZE_STRING);
$hostname = filter_input(INPUT_SERVER, 'SERVER_NAME', FILTER_SANITIZE_STRING);
$requestUri = filter_input(INPUT_SERVER, 'REQUEST_URI', FILTER_SANITIZE_STRING);
$shib_handler = filter_input(INPUT_SERVER, 'AJP_Shib-Handler', FILTER_SANITIZE_STRING);

$scriptFilename = basename($script);
$path = str_replace($scriptFilename, '', $requestUri);
$url = (isset($https) && $https === 'on' ? "https" : "http") . "://${hostname}${path}";
$redir_url = rtrim($url, '/');

header("Location: ${shib_handler}/Login?target=${redir_url}");
