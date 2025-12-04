# Code Signing Quick Start Guide

## Quick Setup (5 Steps)

### Step 1: Get a Code Signing Certificate

**Option A: Buy a Certificate (Recommended)**
- Purchase from: DigiCert, Sectigo, GlobalSign, or Certum
- Cost: $100-500/year
- Time: 1-5 business days

**Option B: Create Self-Signed (Testing Only)**
```powershell
# Run in PowerShell as Administrator
$cert = New-SelfSignedCertificate -Type CodeSigningCert -Subject "CN=PrintMyFile" -CertStoreLocation Cert:\CurrentUser\My
$password = ConvertTo-SecureString -String "YourPassword123!" -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath "certificate.pfx" -Password $password
```

### Step 2: Configure Environment Variables

Create or update `.env` file (already in `.gitignore`):

```env
WIN_CERT_FILE=C:\path\to\certificate.pfx
WIN_CERT_PASSWORD=YourPassword123!
```

### Step 3: Update package.json

Change line 143 in `package.json`:

**Before:**
```json
"sign": null
```

**After:**
```json
"sign": "scripts/sign.js"
```

### Step 4: Update Build Scripts

Remove `CSC_IDENTITY_AUTO_DISCOVERY=false` from scripts in `package.json`:

**Before:**
```json
"package": "npm run build && cross-env CSC_IDENTITY_AUTO_DISCOVERY=false electron-builder --win"
```

**After:**
```json
"package": "npm run build && electron-builder --win"
```

Do the same for `package:win`, `publish`, and `publish:win` scripts.

### Step 5: Build and Test

```bash
npm run package:win
```

Verify the signature:
```powershell
Get-AuthenticodeSignature "release\1.1.16\PrintMyFile Agent Setup 1.1.16.exe"
```

## What Files Were Created?

1. **`CODE_SIGNING_SETUP.md`** - Complete detailed guide
2. **`scripts/sign.js`** - Signing script (already created)
3. **`env.signing.example`** - Example environment file
4. **`.gitignore`** - Updated to exclude certificate files

## Next Steps

1. Purchase a code signing certificate (or create self-signed for testing)
2. Follow the 5 steps above
3. Test the signing process
4. Update your CI/CD pipeline if using automated builds

## Troubleshooting

**"No valid signing certificate found"**
- Check `WIN_CERT_FILE` path is correct
- Verify certificate password is correct
- Ensure certificate has code signing capabilities

**"Certificate password is incorrect"**
- Double-check `WIN_CERT_PASSWORD` in `.env`
- Make sure there are no extra spaces or quotes

**Windows still shows warning**
- Self-signed certificates will always show warnings
- Standard certificates need time to build reputation (days/weeks)
- EV certificates provide immediate trust

For more details, see `CODE_SIGNING_SETUP.md`.

