<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Create Account - ${realm.displayName!''}</title>
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
                    <h1>Create Account</h1>
                    <p>Join the secure monitoring network for specialized care.</p>
                </header>
                
                <#if message?has_content>
                    <div class="alert alert-${message.type}">
                        <i class="fas fa-${message.type == 'error'?then('exclamation-circle', 'check-circle')}"></i>
                        <span>${kcSanitize(message.summary)?no_esc}</span>
                    </div>
                </#if>
                
                <form action="${url.registrationAction}" method="post" class="login-form">
                    <div class="input-row">
                        <div class="input-group">
                            <label for="firstName">First Name</label>
                            <input type="text" id="firstName" name="firstName" 
                                   value="${(register.formData.firstName!'')}" 
                                   placeholder="John" required>
                        </div>
                        <div class="input-group">
                            <label for="lastName">Last Name</label>
                            <input type="text" id="lastName" name="lastName" 
                                   value="${(register.formData.lastName!'')}" 
                                   placeholder="Doe" required>
                        </div>
                    </div>

                    <div class="input-group">
                        <label for="email">Email Address</label>
                        <input type="email" id="email" name="email" 
                               value="${(register.formData.email!'')}" 
                               placeholder="john@example.com" 
                               autocomplete="email" required>
                    </div>
                    
                    <div class="input-group">
                        <label for="role">User Role</label>
                        <select id="role" name="user.attributes.role" class="custom-select" required>
                            <option value="" disabled selected>Select your role</option>
                            <option value="DOCTOR">Doctor / Specialist</option>
                            <option value="CAREGIVER">Caregiver</option>
                            <option value="FAMILY">Family Member</option>
                            <option value="ADMIN">Administrator</option>
                        </select>
                    </div>

                    <div class="input-row">
                        <div class="input-group">
                            <label for="password">Password</label>
                            <input type="password" id="password" name="password" 
                                   placeholder="••••••••" 
                                   autocomplete="new-password" required>
                        </div>
                        <div class="input-group">
                            <label for="password-confirm">Confirm</label>
                            <input type="password" id="password-confirm" name="password-confirm" 
                                   placeholder="••••••••" 
                                   autocomplete="new-password" required>
                        </div>
                    </div>
                    
                    <button type="submit" class="btn-primary">
                        Register Account
                    </button>
                </form>
                
                <footer class="form-footer">
                    <p>Already have an account? <a href="${url.loginUrl}">Sign In</a></p>
                </footer>
            </div>
            <div class="footer-legal">
                &copy; 2026 Alzheimer Support. Precision care infrastructure.
            </div>
        </main>

        <!-- Right Section: Promo (Consistent with Login) -->
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
