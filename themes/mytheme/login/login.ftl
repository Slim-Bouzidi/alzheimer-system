<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${msg("loginTitle",(realm.displayName!''))}</title>
    <link rel="stylesheet" href="${url.resourcesPath}/css/styles.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
</head>
<body>
    <div class="split-view">
        <!-- Left Section: Form -->
        <main class="form-section">
            <div class="form-container">
                <header class="form-header">
                    <div class="logo-box">
                        <i class="fas fa-heart"></i>
                    </div>
                    <h1>Get Started</h1>
                    <p>Welcome to AlzheimerSupport - Access your secure dashboard.</p>
                </header>
                
                <#if message?has_content>
                    <div class="alert alert-${message.type}">
                        <i class="fas fa-${message.type == 'error'?then('exclamation-circle', 'check-circle')}"></i>
                        <span>${kcSanitize(message.summary)?no_esc}</span>
                    </div>
                </#if>
                
                <form action="${url.loginAction}" method="post" class="login-form">
                    <div class="input-group">
                        <label for="username">Email Address</label>
                        <input type="text" id="username" name="username" 
                               value="${(login.username!'')}" 
                               placeholder="hi@example.com"
                               autocomplete="username" required>
                    </div>
                    
                    <div class="input-group">
                        <div class="label-row">
                            <label for="password">Password</label>
                            <#if realm.resetPasswordAllowed>
                                <a href="${url.loginResetCredentialsUrl}" class="link-label">Forgot?</a>
                            </#if>
                        </div>
                        <input type="password" id="password" name="password" 
                               placeholder="Enter your password"
                               autocomplete="current-password" required>
                    </div>
                    
                    <#if realm.rememberMe && !usernameEditDisabled??>
                        <div class="checkbox-group">
                            <input type="checkbox" id="rememberMe" name="rememberMe" 
                                   <#if login.rememberMe??>checked</#if>>
                            <label for="rememberMe">Stay signed in for 30 days</label>
                        </div>
                    </#if>
                    
                    <button type="submit" class="btn-primary">
                        Sign In
                    </button>
                </form>
                
                <footer class="form-footer">
                    <p>Don't have an account? <a href="${url.registrationUrl}">Create Account</a></p>
                </footer>
            </div>
            <div class="footer-legal">
                &copy; 2026 Alzheimer Support. All rights reserved.
            </div>
        </main>

        <!-- Right Section: Promo -->
        <aside class="promo-section">
            <div class="promo-content">
                <h2 class="promo-title">
                    Enter the <span class="italic">Future</span> <br/>
                    of Patient <br/>
                    <span class="highlight">Safety, today.</span>
                </h2>
                
                <div class="glass-hud">
                    <div class="hud-item">
                        <div class="hud-icon"><i class="fas fa-user-check"></i></div>
                        <div class="hud-data">
                            <span class="val">2,481</span>
                            <span class="lbl">Monitoring Active</span>
                        </div>
                    </div>
                    <div class="hud-divider"></div>
                    <div class="hud-item">
                        <div class="hud-icon"><i class="fas fa-shield-alt"></i></div>
                        <div class="hud-data">
                            <span class="val">Secure</span>
                            <span class="lbl">End-to-End Vault</span>
                        </div>
                    </div>
                    <div class="hud-divider"></div>
                    <div class="hud-item emergency">
                        <div class="hud-icon"><i class="fas fa-broadcast-tower"></i></div>
                        <div class="hud-data">
                            <span class="val">Real-time</span>
                            <span class="lbl">Global Alerting</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="promo-bg-layers">
                <div class="gradient-layer"></div>
                <div class="texture-layer"></div>
            </div>
        </aside>
    </div>
</body>
</html>
