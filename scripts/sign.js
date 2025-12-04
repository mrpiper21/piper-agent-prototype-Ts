/**
 * Code Signing Script for Windows
 * 
 * This script handles code signing for Windows installers.
 * 
 * Setup:
 * 1. For PFX file: Set WIN_CERT_FILE and WIN_CERT_PASSWORD environment variables
 * 2. For Windows Certificate Store: Install certificate in Personal store
 * 
 * Usage:
 * - The script is automatically called by electron-builder during build
 */

const { sign } = require('electron-builder/out/codeSign/windowsCodeSign');

exports.default = async function(configuration) {
  const { path, hash, isNest } = configuration;
  
  try {
    // Check if using PFX file (from environment variables)
    const certFile = process.env.WIN_CERT_FILE;
    const certPassword = process.env.WIN_CERT_PASSWORD;

    if (certFile && certPassword) {
      // Method 1: Sign using PFX file
      console.log(`Signing ${path} using PFX certificate...`);
      await sign({
        path,
        hash,
        isNest,
        certFile: certFile,
        certPassword: certPassword,
      });
      console.log(`Successfully signed: ${path}`);
    } else {
      // Method 2: Sign using Windows Certificate Store (auto-discovery)
      // This works if you have an EV certificate installed
      console.log(`Signing ${path} using Windows Certificate Store...`);
      await sign({
        path,
        hash,
        isNest,
        // Certificate will be auto-discovered from Windows Certificate Store
      });
      console.log(`Successfully signed: ${path}`);
    }
  } catch (error) {
    console.error(`Failed to sign ${path}:`, error.message);
    
    // If signing fails, you can choose to:
    // 1. Throw error to stop the build (recommended for production)
    throw error;
    
    // 2. Continue without signing (only for testing)
    // console.warn('Continuing build without code signing...');
  }
};

