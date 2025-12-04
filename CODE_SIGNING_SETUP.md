# Code Signing Setup Guide for Windows

This guide explains how to digitally sign your Windows installer so users can install updates without security warnings.

## Why Code Signing?

- **User Trust**: Signed installers show your publisher name instead of "Unknown Publisher"
- **No Security Warnings**: Windows won't block unsigned installers
- **Automatic Updates**: Signed installers can be installed automatically without user intervention
- **Professional Appearance**: Builds trust with enterprise customers

## Option 1: Extended Validation (EV) Certificate (Recommended for Production)

EV certificates provide the highest level of trust and are recognized immediately by Windows.

### Where to Buy:
- **DigiCert**: https://www.digicert.com/ev-code-signing-certificates/
- **Sectigo (formerly Comodo)**: https://sectigo.com/ssl-certificates-tls/code-signing
- **GlobalSign**: https://www.globalsign.com/en/code-signing-certificate
- **Certum**: https://www.certum.eu/en/code-signing-certificates/

**Cost**: Typically $200-500/year

### Requirements:
- USB token or hardware security module (HSM)
- Business verification documents
- 1-5 business days for approval

### Setup Steps:

1. **Purchase the certificate** and complete the validation process
2. **Install the certificate** on your build machine (usually comes on a USB token)
3. **Configure electron-builder** (see Configuration section below)

## Option 2: Standard Code Signing Certificate

Standard certificates are cheaper but may require reputation building.

### Where to Buy:
- Same providers as EV certificates
- **K Software**: https://codesigning.ksoftware.net/ (budget option)

**Cost**: Typically $100-300/year

### Requirements:
- Software-based certificate (can be exported to PFX)
- Business verification
- May take a few days for Windows to recognize (reputation building)

## Option 3: Self-Signed Certificate (For Testing Only)

⚠️ **Warning**: Self-signed certificates are NOT trusted by Windows and will still show warnings. Only use for internal testing.

### Create Self-Signed Certificate:

```powershell
# Open PowerShell as Administrator
$cert = New-SelfSignedCertificate -Type CodeSigningCert -Subject "CN=PrintMyFile" -CertStoreLocation Cert:\CurrentUser\My -KeyUsage DigitalSignature

# Export to PFX (you'll be prompted for a password)
$password = ConvertTo-SecureString -String "YourPassword123!" -Force -AsPlainText
Export-PfxCertificate -Cert $cert -FilePath "C:\path\to\certificate.pfx" -Password $password
```

## Configuration

### Step 1: Update package.json

Update the Windows build configuration in `package.json`:

```json
{
  "build": {
    "win": {
      "publisherName": "PrintMyFile",
      "sign": "scripts/sign.js",
      "signingHashAlgorithms": ["sha256"],
      "signDlls": true
    }
  }
}
```

### Step 2: Create Signing Script

Create `scripts/sign.js`:

```javascript
const { sign } = require('electron-builder/out/codeSign/windowsCodeSign');

exports.default = async function(configuration) {
  const { path, hash, isNest } = configuration;
  
  // Method 1: Use certificate from Windows Certificate Store (recommended)
  // The certificate must be installed in the "Personal" store
  await sign({
    path,
    hash,
    isNest,
    // Certificate will be auto-discovered from Windows Certificate Store
    // Make sure your certificate is installed and accessible
  });

  // Method 2: Use PFX file (alternative)
  // Uncomment and configure if using a PFX file instead
  /*
  await sign({
    path,
    hash,
    isNest,
    certFile: process.env.WIN_CERT_FILE, // Path to .pfx file
    certPassword: process.env.WIN_CERT_PASSWORD, // Certificate password
  });
  */
};
```

### Step 3: Environment Variables

For security, store certificate credentials in environment variables:

**Option A: Using PFX File (Standard Certificate)**

Create a `.env` file (add to `.gitignore`):

```env
WIN_CERT_FILE=C:\path\to\your\certificate.pfx
WIN_CERT_PASSWORD=YourSecurePassword
```

**Option B: Using Windows Certificate Store (EV Certificate)**

The certificate should be installed in the Windows Certificate Store. Electron-builder will automatically discover it if:
- It's in the "Personal" certificate store
- It has code signing capabilities
- It's accessible to the build process

### Step 4: Update Build Scripts

Update your `package.json` scripts to enable code signing:

```json
{
  "scripts": {
    "package": "npm run build && electron-builder --win",
    "package:win": "npm run build && electron-builder --win",
    "publish": "npm run build && electron-builder --publish always",
    "publish:win": "npm run build && electron-builder --win --publish always"
  }
}
```

Remove `CSC_IDENTITY_AUTO_DISCOVERY=false` from scripts to enable automatic certificate discovery.

### Step 5: Test the Signing

1. Build your app:
   ```bash
   npm run package:win
   ```

2. Verify the signature:
   ```powershell
   Get-AuthenticodeSignature "release\1.1.16\PrintMyFile Agent Setup 1.1.16.exe"
   ```

   You should see:
   - `Status: Valid`
   - `SignerCertificate` with your certificate details
   - `StatusMessage: Signature verified.`

## Alternative: Simple Configuration (Using PFX File)

If you prefer a simpler setup without a custom script, you can configure electron-builder directly:

### Update package.json:

```json
{
  "build": {
    "win": {
      "publisherName": "PrintMyFile",
      "sign": null, // Remove this line
      "certificateFile": "${env.WIN_CERT_FILE}",
      "certificatePassword": "${env.WIN_CERT_PASSWORD}",
      "signingHashAlgorithms": ["sha256"],
      "signDlls": true
    }
  }
}
```

Then set environment variables:
```bash
# Windows PowerShell
$env:WIN_CERT_FILE="C:\path\to\certificate.pfx"
$env:WIN_CERT_PASSWORD="YourPassword"

# Or create .env file (make sure it's in .gitignore)
```

## CI/CD Setup (GitHub Actions)

For automated signing in CI/CD:

### 1. Store Certificate as GitHub Secret

1. Go to your repository → Settings → Secrets and variables → Actions
2. Add secrets:
   - `WIN_CERT_FILE`: Base64-encoded PFX file content
   - `WIN_CERT_PASSWORD`: Certificate password

### 2. Update GitHub Actions Workflow

Add to your workflow file (e.g., `.github/workflows/release.yml`):

```yaml
- name: Setup Code Signing
  if: runner.os == 'Windows'
  run: |
    # Decode and save certificate
    $certContent = [System.Convert]::FromBase64String("${{ secrets.WIN_CERT_FILE }}")
    [System.IO.File]::WriteAllBytes("certificate.pfx", $certContent)
    
    # Set environment variables
    echo "WIN_CERT_FILE=certificate.pfx" >> $env:GITHUB_ENV
    echo "WIN_CERT_PASSWORD=${{ secrets.WIN_CERT_PASSWORD }}" >> $env:GITHUB_ENV

- name: Build and Sign
  run: npm run publish:win
```

## Troubleshooting

### Error: "No valid signing certificate found"

**Solution**: 
- Verify the certificate is installed in Windows Certificate Store (for EV certs)
- Check that `WIN_CERT_FILE` points to a valid PFX file
- Ensure the certificate has code signing capabilities

### Error: "The certificate password is incorrect"

**Solution**:
- Double-check `WIN_CERT_PASSWORD` environment variable
- Verify the PFX file wasn't corrupted

### Error: "The certificate has expired"

**Solution**:
- Renew your code signing certificate
- Update the certificate file/password

### Windows Still Shows Warning After Signing

**Possible Causes**:
1. **Reputation Building**: New certificates need time to build reputation (can take days/weeks)
2. **EV Certificate Required**: For immediate trust, use an EV certificate
3. **Certificate Chain**: Ensure the full certificate chain is included

### Check Certificate Status

```powershell
# Check if certificate is valid
Get-AuthenticodeSignature "path\to\installer.exe" | Format-List

# View certificate details
certutil -dump "path\to\installer.exe"
```

## Cost Comparison

| Option | Cost/Year | Trust Level | Setup Time |
|-------|-----------|-------------|------------|
| EV Certificate | $200-500 | Highest | 1-5 days |
| Standard Certificate | $100-300 | Medium | 1-3 days |
| Self-Signed | Free | None (testing only) | Immediate |

## Recommended Approach

1. **For Production**: Purchase an EV Code Signing Certificate
2. **For Development/Testing**: Use a standard certificate or self-signed (with warnings)
3. **For CI/CD**: Store certificate securely in GitHub Secrets

## Additional Resources

- [Electron Builder Code Signing Docs](https://www.electron.build/code-signing)
- [Microsoft Code Signing Best Practices](https://docs.microsoft.com/en-us/windows/win32/win_cert/code-signing-best-practices)
- [Windows Defender SmartScreen](https://docs.microsoft.com/en-us/windows/security/threat-protection/microsoft-defender-smartscreen/microsoft-defender-smartscreen-overview)

