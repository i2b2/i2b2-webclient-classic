<?php

$hostname = filter_input(INPUT_SERVER, 'SERVER_NAME', FILTER_SANITIZE_STRING);
$shib_handler = filter_input(INPUT_SERVER, 'AJP_Shib-Handler', FILTER_SANITIZE_STRING);

$url = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http") . "://$_SERVER[HTTP_HOST]$_SERVER[REQUEST_URI]";

header("Location: ${shib_handler}/Login?target=${url}/../../..");
