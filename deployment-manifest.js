/**
 * Deployment Manifest Generator
 * สร้างรายการไฟล์ของโปรเจ็คที่ Deploy
 * Generates a comprehensive list of deployed project files
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname, relative } from 'path';

// Configuration for deployed components
const DEPLOYED_COMPONENTS = {
  workers: [
    'api_worker_complete.js',
    'banking_worker_complete.js', 
    'frontend_worker.js',
    'main_bot_worker_complete.js',
    'security_worker_complete.js',
    'ocr_commission_systems.js'
  ],
  configurations: [
    'wrangler.toml',
    'api/wrangler.toml',
    'api/banking-worker/wrangler.toml',
    'api/monitoring-worker/wrangler.toml'
  ],
  deploymentFiles: [
    '.github/workflows/chatops-deploy.yml',
    '.github/workflows/migrate.yml',
    'setup-chatops.ps1',
    'api/wrangler-setup.ps1'
  ],
  apiFiles: [
    'api/src/index.js',
    'api/integration_functions.js'
  ],
  documentation: [
    'README.md',
    '.env.example'
  ]
};

class DeploymentManifest {
  constructor(rootPath = '.') {
    this.rootPath = rootPath;
    this.manifest = {
      generated: new Date().toISOString(),
      version: '1.0.0',
      project: 'DGWALL - Digital Wallet Logic System',
      components: {},
      summary: {
        totalFiles: 0,
        totalSize: 0,
        lastDeployment: null
      }
    };
  }

  // Get file information
  getFileInfo(filePath) {
    try {
      const fullPath = join(this.rootPath, filePath);
      const stats = statSync(fullPath);
      const content = readFileSync(fullPath, 'utf8');
      
      return {
        path: filePath,
        size: stats.size,
        modified: stats.mtime.toISOString(),
        lines: content.split('\n').length,
        type: extname(filePath) || 'file',
        exists: true
      };
    } catch (error) {
      return {
        path: filePath,
        exists: false,
        error: error.message
      };
    }
  }

  // Get deployment history
  getDeploymentHistory() {
    try {
      const deploymentFile = join(this.rootPath, 'api/current_deployments.txt');
      const content = readFileSync(deploymentFile, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      
      // Parse deployment entries
      const deployments = [];
      let currentDeployment = {};
      
      for (const line of lines) {
        if (line.startsWith('Created:')) {
          if (currentDeployment.created) {
            deployments.push({ ...currentDeployment });
          }
          currentDeployment = { created: line.replace('Created:', '').trim() };
        } else if (line.startsWith('Author:')) {
          currentDeployment.author = line.replace('Author:', '').trim();
        } else if (line.startsWith('Source:')) {
          currentDeployment.source = line.replace('Source:', '').trim();
        } else if (line.startsWith('Version(s):')) {
          const versionMatch = line.match(/\(100%\)\s+([a-f0-9-]+)/);
          if (versionMatch) {
            currentDeployment.version = versionMatch[1];
          }
        }
      }
      
      if (currentDeployment.created) {
        deployments.push(currentDeployment);
      }
      
      return deployments.slice(0, 5); // Return latest 5 deployments
    } catch (error) {
      return [{ error: 'Unable to read deployment history: ' + error.message }];
    }
  }

  // Generate complete manifest
  generate() {
    console.log('🚀 Generating deployment manifest...');
    
    // Process each component category
    for (const [category, files] of Object.entries(DEPLOYED_COMPONENTS)) {
      console.log(`📁 Processing ${category}...`);
      this.manifest.components[category] = {
        description: this.getCategoryDescription(category),
        files: files.map(file => this.getFileInfo(file))
      };
    }

    // Add deployment history
    this.manifest.deploymentHistory = this.getDeploymentHistory();
    
    // Calculate summary
    let totalFiles = 0;
    let totalSize = 0;
    
    for (const component of Object.values(this.manifest.components)) {
      for (const file of component.files) {
        if (file.exists) {
          totalFiles++;
          totalSize += file.size || 0;
        }
      }
    }
    
    this.manifest.summary = {
      totalFiles,
      totalSize,
      totalSizeFormatted: this.formatFileSize(totalSize),
      lastDeployment: this.manifest.deploymentHistory[0]?.created || null
    };

    return this.manifest;
  }

  // Get category descriptions
  getCategoryDescription(category) {
    const descriptions = {
      workers: 'Cloudflare Workers - Core application logic',
      configurations: 'Wrangler configuration files for deployment',
      deploymentFiles: 'GitHub Actions workflows and deployment scripts',
      apiFiles: 'API implementation and integration functions',
      documentation: 'Project documentation and configuration templates'
    };
    return descriptions[category] || 'Application files';
  }

  // Format file size
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Save manifest to file
  save(filename = 'deployment-manifest.json') {
    const manifestContent = JSON.stringify(this.manifest, null, 2);
    writeFileSync(filename, manifestContent, 'utf8');
    console.log(`✅ Manifest saved to ${filename}`);
    return filename;
  }

  // Generate HTML report
  generateHTMLReport() {
    const html = `<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DGWALL - Deployment Manifest</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        .summary { background: #ecf0f1; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .summary-item { display: inline-block; margin-right: 30px; }
        .summary-item strong { color: #2980b9; }
        .component { margin-bottom: 30px; }
        .file-list { background: #fafafa; border: 1px solid #ddd; border-radius: 5px; }
        .file-item { padding: 10px 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; }
        .file-item:last-child { border-bottom: none; }
        .file-path { font-family: 'Courier New', monospace; color: #2c3e50; }
        .file-meta { color: #7f8c8d; font-size: 12px; }
        .exists { color: #27ae60; }
        .missing { color: #e74c3c; }
        .deployment-history { background: #f8f9fa; border-left: 4px solid #3498db; padding: 15px; margin: 20px 0; }
        .deployment-item { margin-bottom: 10px; font-size: 14px; }
        .tag { background: #3498db; color: white; padding: 2px 8px; border-radius: 3px; font-size: 11px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 DGWALL - Digital Wallet Deployment Manifest</h1>
        
        <div class="summary">
            <div class="summary-item"><strong>Generated:</strong> ${this.manifest.generated}</div>
            <div class="summary-item"><strong>Total Files:</strong> ${this.manifest.summary.totalFiles}</div>
            <div class="summary-item"><strong>Total Size:</strong> ${this.manifest.summary.totalSizeFormatted}</div>
            <div class="summary-item"><strong>Last Deployment:</strong> ${this.manifest.summary.lastDeployment || 'Unknown'}</div>
        </div>

        ${Object.entries(this.manifest.components).map(([category, component]) => `
        <div class="component">
            <h2>📁 ${category.charAt(0).toUpperCase() + category.slice(1)}</h2>
            <p>${component.description}</p>
            <div class="file-list">
                ${component.files.map(file => `
                <div class="file-item">
                    <div>
                        <div class="file-path">${file.path}</div>
                        <div class="file-meta">
                            ${file.exists ? 
                              `<span class="exists">✓ ${file.lines} lines, ${this.formatFileSize(file.size)}, modified: ${new Date(file.modified).toLocaleString('th-TH')}</span>` :
                              `<span class="missing">✗ Missing: ${file.error}</span>`
                            }
                        </div>
                    </div>
                    <div>
                        ${file.exists ? '<span class="tag">DEPLOYED</span>' : '<span class="tag" style="background:#e74c3c">MISSING</span>'}
                    </div>
                </div>
                `).join('')}
            </div>
        </div>
        `).join('')}

        <div class="deployment-history">
            <h2>📈 Recent Deployment History</h2>
            ${this.manifest.deploymentHistory.map(deployment => `
            <div class="deployment-item">
                <strong>${deployment.created || 'Unknown'}</strong> - 
                ${deployment.author || 'Unknown'} - 
                ${deployment.source || 'Unknown'} 
                ${deployment.version ? `(${deployment.version.substring(0, 8)}...)` : ''}
            </div>
            `).join('')}
        </div>
    </div>
</body>
</html>`;

    writeFileSync('deployment-manifest.html', html, 'utf8');
    console.log('✅ HTML report saved to deployment-manifest.html');
    return 'deployment-manifest.html';
  }
}

// CLI functionality
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚀 DGWALL Deployment Manifest Generator');
  console.log('สร้างรายการไฟล์ของโปรเจ็คที่ Deploy\n');
  
  const manifest = new DeploymentManifest();
  manifest.generate();
  
  // Save both JSON and HTML reports
  manifest.save();
  manifest.generateHTMLReport();
  
  console.log('\n📊 Summary:');
  console.log(`Total Files: ${manifest.manifest.summary.totalFiles}`);
  console.log(`Total Size: ${manifest.manifest.summary.totalSizeFormatted}`);
  console.log(`Last Deployment: ${manifest.manifest.summary.lastDeployment || 'Unknown'}`);
}

export default DeploymentManifest;