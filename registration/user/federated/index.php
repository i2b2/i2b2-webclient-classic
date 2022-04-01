<?php
/**
 * index.php
 * 
 * Processing user registration for SAML accounts.
 * 
 * @author Kevin V. Bui
 */
session_start();

require_once('../i2b2.php');

date_default_timezone_set('America/New_York');

function isValid() {
    return filter_input(INPUT_POST, 'agree', FILTER_SANITIZE_STRING);
}

$username = filter_input(INPUT_SERVER, 'AJP_eduPersonPrincipalName', FILTER_SANITIZE_STRING);
if ($username) {
    $user_exists = userExists($username, getUser($username));
    if ($user_exists) {
        $_SESSION['error_msg'] = "You have already registered.";

        $hostname = filter_input(INPUT_SERVER, 'SERVER_NAME', FILTER_SANITIZE_STRING);
        $url = "https://${hostname}/webclient/logout.php";
        header("Location: ${url}");
    } else {
        $first_name = filter_input(INPUT_SERVER, 'AJP_givenName', FILTER_SANITIZE_STRING);
        $last_name = filter_input(INPUT_SERVER, 'AJP_sn', FILTER_SANITIZE_STRING);
        $email = filter_input(INPUT_SERVER, 'AJP_mail', FILTER_SANITIZE_STRING);

        $full_name = trim($first_name . ' ' . $last_name);

        // set full name to username if first name and last name don't exists
        if (strlen($full_name) == 0) {
            $full_name = $username;
        }

        $postData = file_get_contents("php://input");
        if (!empty($postData) && isValid()) {
            // generate secured, random password of lenght 256*2=512
            $password = bin2hex(openssl_random_pseudo_bytes(256));

            $result_status_error = hasErrorStatus(setUser($full_name, $email, $username, $password));
            if ($result_status_error) {
                $_SESSION['error_msg'] = "Sorry.  We are unable to sign you up at this time.  Please contact the admin.";
            } else {
                addLoginAuthenticationMethod($username, 'SAML');

                $_SESSION['success_msg'] = "Thank you for signing up!  We will contact you after your registration has been reviewed.";
            }

            $hostname = filter_input(INPUT_SERVER, 'SERVER_NAME', FILTER_SANITIZE_STRING);
            $url = "https://${hostname}/webclient/logout.php";
            header("Location: ${url}");
        } else {
            ?>
            <!doctype html>
            <html lang="en">
                <head>
                    <meta charset="utf-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                    <link rel="stylesheet" href="../../../assets/bootstrap/css/bootstrap.min.css" />
                    <title>User Registration</title>
                    <style>
                        html,
                        body {
                            /*height: 100%;*/
                        }
                        body {
                            display: flex;
                            align-items: center;
                            padding-top: 40px;
                            background-color: #daedf0;
                        }
                        .fed-user-reg {
                            width: 100%;
                            max-width: 630px;
                            padding: 15px;
                            margin: auto;
                        }
                        textarea#terms {
                            width:100%!important;
                            border: 1px solid #000;
                            background: #f2f2f2;
                            font: normal arial;
                            color: #333;
                            resize: none;
                        }
                    </style>
                    <script>
                        var i2b2 = {};
                    </script>
                    <script type="text/javascript" src="../../../js-i2b2/i2b2_ui_config.js"></script>
                </head>
                <body>
                    <main class="fed-user-reg">
                        <div class="card mb-4 rounded-3 shadow-sm">
                            <div class="card-body">
                                <form id="registration" action="" method="post">
                                    <div class="row">
                                        <div class="col-12">
                                            <div class="mb-3">
                                                <textarea class="w-100" id="terms" rows="14" readonly="readonly" style="resize: none;"></textarea>
                                            </div>
                                            <div class="form-check">
                                                <label class="form-check-label" for="agree-local">
                                                    <input class="form-check-input" type="checkbox" id="agree-local" name="agree" onchange="handleAgreeChbx(this);" /> I accept the Terms & Conditions
                                                </label>
                                                <div id="invalidCheck3Feedback" class="invalid-feedback"><?php echo $error_msg; ?></div>
                                            </div>
                                        </div>
                                        <div class="col-12">
                                            <div class="mt-3">
                                                <button class="w-100 btn btn-sm btn-primary register_btn" type="submit" disabled="disabled">Sign Up</button>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </main>

                    <script>
                        document.getElementById("terms").innerHTML = `${i2b2.UI.cfg.termsCondition}`;

                        function handleAgreeChbx(chbx) {
                            [].forEach.call(document.getElementsByClassName('register_btn'), e => e.disabled = !chbx.checked);
                        }
                    </script>
                </body>
            </html>
            <?php
        }
    }
} else {
    $hostname = filter_input(INPUT_SERVER, 'SERVER_NAME', FILTER_SANITIZE_STRING);
    $shib_handler = filter_input(INPUT_SERVER, 'AJP_Shib-Handler', FILTER_SANITIZE_STRING);
    $url = "${shib_handler}/Login?target=https://${hostname}/webclient/registration/user/federated";
    header("Location: ${url}");
}
