import React from "react";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { TailChase } from "ldrs/react";
import "ldrs/react/TailChase.css";
import styles from "./LoginPage.module.css";
import { AuthService } from "../../Utils/Auth";
import useNotification from "../../Hooks/useNotification";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// "login" -> "register", or "login" -> "forgot" -> "verify" -> "reset"
const SCREENS = {
    login: { title: "Log In", subtitle: "Welcome back.", submit: "Log In" },
    register: { title: "Create Account", subtitle: "Make an account to start joining rooms.", submit: "Create Account" },
    forgot: { title: "Forgot Password", subtitle: "We'll email you a 6 digit reset code.", submit: "Send Code" },
    verify: { title: "Enter Code", subtitle: "Check your email for the reset code.", submit: "Verify Code" },
    reset: { title: "New Password", subtitle: "Choose a new password for your account.", submit: "Save Password" },
};

// pulls a readable message out of an axios error (non-2xx responses and network failures)
const getErrorMessage = (error) => {
    if (!error.response) {
        return "Can't reach the server.";
    }
    const detail = error.response.data?.detail;
    return typeof detail === "string" ? detail : "Something went wrong.";
};

const Field = ({ id, label, error, children }) => (
    <div className={styles.formControl}>
        <label htmlFor={id}>{label}</label>
        {children}
        {error && <span className={styles.fieldError}>{error.message}</span>}
    </div>
);

//the screen shown in the main menu until the user is logged in. handles login, sign up and the forgot password flow
const LoginPage = () => {
    const [screen, setScreen] = useState("login");
    const [checkingSession, setCheckingSession] = useState(true);
    const [resetEmail, setResetEmail] = useState(""); //email carried through forgot -> verify -> reset
    const notify = useNotification((state) => state.notify);

    const {
        register,
        handleSubmit,
        reset: resetForm,
        formState: { errors, isSubmitting },
    } = useForm({ shouldUnregister: true });

    //log back in automatically if a valid token was saved last session
    useEffect(() => {
        AuthService.verifyToken()
            .catch(() => {})
            .finally(() => setCheckingSession(false));
    }, []);

    const goTo = (nextScreen) => {
        resetForm();
        setScreen(nextScreen);
    };

    const onSubmit = async (data) => {
        try {
            if (screen === "login") {
                const response = await AuthService.login(data.email, data.password);
                if (response.error) {
                    return notify("error", response.error);
                }
                notify("success", `Welcome back, ${response.username}.`);
            }

            if (screen === "register") {
                const response = await AuthService.register(data.username, data.email, data.password);
                if (response.error) {
                    return notify("error", response.error);
                }
                notify("success", `Welcome, ${response.username}.`);
            }

            if (screen === "forgot") {
                await AuthService.requestPasswordReset(data.email);
                setResetEmail(data.email);
                notify("success", "Reset code sent if that email has an account.");
                goTo("verify");
            }

            if (screen === "verify") {
                const response = await AuthService.verifyResetToken(resetEmail, data.code);
                if (response.error) {
                    return notify("error", response.error);
                }
                goTo("reset");
            }

            if (screen === "reset") {
                await AuthService.resetPassword(resetEmail, data.password);
                notify("success", "Password updated.");
            }
        } catch (error) {
            notify("error", getErrorMessage(error));
        }
    };

    const resendCode = async () => {
        try {
            await AuthService.requestPasswordReset(resetEmail);
            notify("success", "Code resent.");
        } catch (error) {
            notify("error", getErrorMessage(error));
        }
    };

    if (checkingSession) {
        return (
            <section className={styles.loadingSection}>
                <TailChase size="40" speed="1.75" color="white" />
            </section>
        );
    }

    const logInWithDiscordButtonHandler = () => {
        AuthService.loginWithDiscord();
    }

    const { title, subtitle, submit } = SCREENS[screen];

    return (
        <section className={styles.loginPage}>
            <header className={styles.header}>
                <h1 className={styles.title}>{title}</h1>
                <p className={styles.subtitle}>{subtitle}</p>
            </header>

            <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
                {screen === "register" &&
                    <Field id="username" label="Username" error={errors.username}>
                        <input id="username" type="text" autoComplete="username" aria-invalid={!!errors.username}
                            {...register("username", {
                                required: "Username is required.",
                                minLength: { value: 2, message: "Username must be at least 2 characters." },
                                maxLength: { value: 30, message: "Username must be 30 characters or less." },
                            })}
                        />
                    </Field>
                }

                {(screen === "login" || screen === "register" || screen === "forgot") &&
                    <Field id="email" label="Email" error={errors.email}>
                        <input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email}
                            {...register("email", {
                                required: "Email is required.",
                                pattern: { value: EMAIL_PATTERN, message: "Enter a valid email." },
                            })}
                        />
                    </Field>
                }

                {screen === "login" &&
                    <Field id="password" label="Password" error={errors.password}>
                        <input id="password" type="password" autoComplete="current-password" aria-invalid={!!errors.password}
                            {...register("password", { required: "Password is required." })}
                        />
                    </Field>
                }

                {(screen === "register" || screen === "reset") &&
                    <>
                        <Field id="password" label={screen === "reset" ? "New Password" : "Password"} error={errors.password}>
                            <input id="password" type="password" autoComplete="new-password" aria-invalid={!!errors.password}
                                {...register("password", {
                                    required: "Password is required.",
                                    minLength: { value: 8, message: "Password must be at least 8 characters." },
                                })}
                            />
                        </Field>
                        <Field id="confirmPassword" label="Confirm Password" error={errors.confirmPassword}>
                            <input id="confirmPassword" type="password" autoComplete="new-password" aria-invalid={!!errors.confirmPassword}
                                {...register("confirmPassword", {
                                    required: "Confirm your password.",
                                    validate: (value, values) => value === values.password || "Passwords don't match.",
                                })}
                            />
                        </Field>
                    </>
                }

                {screen === "verify" &&
                    <Field id="code" label={`Code sent to ${resetEmail}`} error={errors.code}>
                        <input id="code" type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                            className={styles.codeInput} aria-invalid={!!errors.code}
                            {...register("code", {
                                required: "Code is required.",
                                pattern: { value: /^\d{6}$/, message: "Code is 6 digits." },
                            })}
                        />
                    </Field>
                }

                {screen === "login" &&
                    <button type="button" className={styles.inlineLink} onClick={() => goTo("forgot")}>
                        Forgot password?
                    </button>
                }

                <button className={styles.submitButton} type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <TailChase size="16" speed="1.75" color="white" /> : submit}
                </button>

                {screen === "login" &&
                    <button type="button" className={styles.oauthButton} onClick={logInWithDiscordButtonHandler} aria-label="Log In with Discord">
                        <svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg">
                            <path fill="currentColor" d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                        </svg>
                    </button>
                }
            </form>

            <footer className={styles.footer}>
                {screen === "login" &&
                    <>
                        <span>Don't have an account?</span>
                        <button type="button" className={styles.link} onClick={() => goTo("register")}>Create one</button>
                    </>
                }
                {screen === "register" &&
                    <>
                        <span>Already have an account?</span>
                        <button type="button" className={styles.link} onClick={() => goTo("login")}>Log in</button>
                    </>
                }
                {screen === "verify" &&
                    <>
                        <button type="button" className={styles.link} onClick={resendCode}>Resend code</button>
                        <span className={styles.dot}>·</span>
                        <button type="button" className={styles.link} onClick={() => goTo("login")}>Back to log in</button>
                    </>
                }
                {(screen === "forgot" || screen === "reset") &&
                    <button type="button" className={styles.link} onClick={() => goTo("login")}>Back to log in</button>
                }
            </footer>
        </section>
    );
};

export default LoginPage;
