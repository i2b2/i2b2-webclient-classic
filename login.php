<?php

$hostname = filter_input(INPUT_SERVER, 'SERVER_NAME', FILTER_SANITIZE_STRING);
$shib_handler = filter_input(INPUT_SERVER, 'AJP_Shib-Handler', FILTER_SANITIZE_STRING);

$url = "${shib_handler}/Login?target=https://${hostname}/webclient/";

header("Location: ${url}");
