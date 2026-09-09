import { useState }
    from "react";

import {
    MailCheck,
    MailWarning,
    Send
} from "lucide-react";


function EmailVerificationSettings({
    user
}) {

    // -----------------------------
    // TEMPORARY VERIFICATION STATE
    // -----------------------------
    // This will eventually come from:
    // currentUser.emailVerified
    //
    // Verification itself will happen
    // through a secure email link.

    const emailVerified =
        true;


    const [
        verificationRequested,
        setVerificationRequested
    ] = useState(false);


    // -----------------------------
    // SEND / RESEND VERIFICATION
    // -----------------------------

    function handleSendVerification() {

        if (
            emailVerified ||
            verificationRequested
        ) {
            return;
        }


        // Frontend shell only.
        //
        // Spring Boot will later:
        // 1. Generate a secure verification token
        // 2. Associate it with this account
        // 3. Send a verification link
        //    to the registered email
        // 4. Validate the token when clicked
        // 5. Mark emailVerified = true

        setVerificationRequested(
            true
        );
    }


    return (
        <section className="page-content">

            {/* =========================
                HEADER
            ========================== */}
            <div className="workspace-section-header">

                <div>

                    <h3>
                        Email Verification
                    </h3>

                    <p className="workspace-section-description">
                        Verify your registered email
                        for account recovery and
                        security notifications.
                    </p>

                </div>

            </div>


            {/* =========================
                VERIFICATION STATUS
            ========================== */}
            <div className="email-verification-card">

                <div className="email-verification-icon">

                    {emailVerified
                        ? (
                            <MailCheck
                                size={28}
                            />
                        )
                        : (
                            <MailWarning
                                size={28}
                            />
                        )
                    }

                </div>


                <div className="email-verification-details">

                    <span>
                        Registered Email
                    </span>

                    <strong>
                        {user.email}
                    </strong>


                    <div className="email-verification-status">

                        <span
                            className={
                                emailVerified
                                    ? "verified"
                                    : "unverified"
                            }
                        >
                            {emailVerified
                                ? "Verified"
                                : "Unverified"
                            }
                        </span>

                    </div>


                    <p>

                        {emailVerified
                            ? (
                                "This email can be used for " +
                                "account recovery and security notifications."
                            )
                            : (
                                "Open the verification link sent " +
                                "to this email address to verify it."
                            )
                        }

                    </p>

                </div>


                {!emailVerified && (

                    <button
                        className="secondary-repair-button"
                        type="button"
                        onClick={
                            handleSendVerification
                        }
                        disabled={
                            verificationRequested
                        }
                    >

                        <Send
                            size={18}
                        />

                        <span>
                            {verificationRequested
                                ? "Verification Sent"
                                : "Resend Verification"
                            }
                        </span>

                    </button>

                )}

            </div>


            {/* =========================
                VERIFICATION MESSAGE
            ========================== */}
            {verificationRequested && (

                <p className="account-form-message">

                    Verification instructions
                    have been sent to your
                    registered email address.

                </p>

            )}

        </section>
    );
}


export default EmailVerificationSettings;