#!/usr/bin/env node
/**
 * Export Deployed Files Script
 * สคริปต์สำหรับส่งออกไฟล์ที่ Deploy
 * Script to package and export all deployed project files
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'fs';
import { join, dirname, basename } from 'path';
import { execSync } from 'child_process';
import DeploymentManifest from './deployment-manifest.js';

class DeployedFilesExporter {
  constructor(outputDir = 'deployed-files-export') {
    this.outputDir = outputDir;
    this.manifest = new DeploymentManifest();
  }

  // Create export directory structure
  createExportStructure() {
    console.log(`📁 Creating export directory: ${this.outputDir}`);
    
    if (existsSync(this.outputDir)) {
      console.log('⚠️  Export directory already exists, cleaning...');
      execSync(`rm -rf ${this.outputDir}`);
    }
    
    mkdirSync(this.outputDir, { recursive: true });
    
    // Create subdirectories
    const subdirs = ['workers', 'config', 'api', 'docs', 'deployment'];
    subdirs.forEach(dir => {
      mkdirSync(join(this.outputDir, dir), { recursive: true });
    });
  }

  // Copy files with directory structure preservation
  copyFileWithStructure(sourcePath, targetDir) {
    try {
      if (!existsSync(sourcePath)) {
        console.log(`⚠️  File not found: ${sourcePath}`);
        return false;
      }

      const targetPath = join(this.outputDir, targetDir, basename(sourcePath));
      const targetDirPath = dirname(targetPath);
      
      if (!existsSync(targetDirPath)) {
        mkdirSync(targetDirPath, { recursive: true });
      }
      
      copyFileSync(sourcePath, targetPath);
      console.log(`✅ Copied: ${sourcePath} → ${targetPath}`);
      return true;
    } catch (error) {
      console.log(`❌ Error copying ${sourcePath}: ${error.message}`);
      return false;
    }
  }

  // Copy files maintaining original directory structure
  copyFilePreservingStructure(sourcePath) {
    try {
      if (!existsSync(sourcePath)) {
        console.log(`⚠️  File not found: ${sourcePath}`);
        return false;
      }

      const targetPath = join(this.outputDir, 'full-structure', sourcePath);
      const targetDirPath = dirname(targetPath);
      
      if (!existsSync(targetDirPath)) {
        mkdirSync(targetDirPath, { recursive: true });
      }
      
      copyFileSync(sourcePath, targetPath);
      return true;
    } catch (error) {
      console.log(`❌ Error copying ${sourcePath}: ${error.message}`);
      return false;
    }
  }

  // Export all deployed files
  async exportFiles() {
    console.log('🚀 Starting deployed files export...\n');
    
    this.createExportStructure();
    
    // Generate manifest
    console.log('📋 Generating deployment manifest...');
    const manifestData = this.manifest.generate();
    
    // Create full structure directory
    mkdirSync(join(this.outputDir, 'full-structure'), { recursive: true });
    
    let exportedCount = 0;
    let totalCount = 0;
    
    // Process each component category
    for (const [category, component] of Object.entries(manifestData.components)) {
      console.log(`\n📁 Processing ${category}...`);
      
      for (const file of component.files) {
        totalCount++;
        
        if (file.exists) {
          // Copy to categorized folders
          let targetDir;
          switch (category) {
            case 'workers':
              targetDir = 'workers';
              break;
            case 'configurations':
              targetDir = 'config';
              break;
            case 'apiFiles':
              targetDir = 'api';
              break;
            case 'documentation':
              targetDir = 'docs';
              break;
            case 'deploymentFiles':
              targetDir = 'deployment';
              break;
            default:
              targetDir = 'misc';
          }
          
          if (this.copyFileWithStructure(file.path, targetDir)) {
            exportedCount++;
          }
          
          // Also copy to full structure
          this.copyFilePreservingStructure(file.path);
        }
      }
    }
    
    // Save manifest files
    console.log('\n📄 Saving manifest files...');
    writeFileSync(
      join(this.outputDir, 'deployment-manifest.json'), 
      JSON.stringify(manifestData, null, 2), 
      'utf8'
    );
    
    // Generate HTML report
    this.manifest.generateHTMLReport();
    copyFileSync('deployment-manifest.html', join(this.outputDir, 'deployment-manifest.html'));
    
    // Create README for export
    this.createExportReadme(exportedCount, totalCount, manifestData);
    
    // Create deployment info
    this.createDeploymentInfo(manifestData);
    
    console.log('\n✅ Export completed!');
    console.log(`📊 Exported ${exportedCount}/${totalCount} files`);
    console.log(`📁 Export location: ${this.outputDir}`);
    
    return {
      success: true,
      exportedFiles: exportedCount,
      totalFiles: totalCount,
      outputDir: this.outputDir
    };
  }

  // Create README for the export
  createExportReadme(exportedCount, totalCount, manifestData) {
    const readme = `# DGWALL - Deployed Files Export
สำรองไฟล์ของโปรเจ็คที่ Deploy

## Export Information
- **Generated:** ${new Date().toISOString()}
- **Files Exported:** ${exportedCount}/${totalCount}
- **Total Size:** ${manifestData.summary.totalSizeFormatted}
- **Last Deployment:** ${manifestData.summary.lastDeployment || 'Unknown'}

## Directory Structure

### \`workers/\`
Cloudflare Workers - Core application logic
${Object.entries(manifestData.components.workers?.files || {}).map(([_, file]) => 
  file.exists ? `- ${basename(file.path)} (${this.manifest.formatFileSize(file.size)})` : ''
).filter(Boolean).join('\n')}

### \`config/\`
Wrangler configuration files for deployment
${Object.entries(manifestData.components.configurations?.files || {}).map(([_, file]) => 
  file.exists ? `- ${file.path}` : ''
).filter(Boolean).join('\n')}

### \`api/\`
API implementation and integration functions
${Object.entries(manifestData.components.apiFiles?.files || {}).map(([_, file]) => 
  file.exists ? `- ${file.path}` : ''
).filter(Boolean).join('\n')}

### \`docs/\`
Project documentation and configuration templates
${Object.entries(manifestData.components.documentation?.files || {}).map(([_, file]) => 
  file.exists ? `- ${file.path}` : ''
).filter(Boolean).join('\n')}

### \`deployment/\`
GitHub Actions workflows and deployment scripts
${Object.entries(manifestData.components.deploymentFiles?.files || {}).map(([_, file]) => 
  file.exists ? `- ${file.path}` : ''
).filter(Boolean).join('\n')}

### \`full-structure/\`
Complete directory structure preserving original paths

## Files Overview

| Component | Files | Status |
|-----------|-------|--------|
${Object.entries(manifestData.components).map(([category, component]) => {
  const existingFiles = component.files.filter(f => f.exists).length;
  const totalFiles = component.files.length;
  return `| ${category} | ${existingFiles}/${totalFiles} | ${existingFiles === totalFiles ? '✅' : '⚠️'} |`;
}).join('\n')}

## Recent Deployments
${manifestData.deploymentHistory.slice(0, 3).map(deployment => 
  `- **${deployment.created}** by ${deployment.author} (${deployment.source})`
).join('\n')}

## Usage
These files represent the current state of the deployed DGWALL Digital Wallet system.
Each file is a working component of the production deployment.

For deployment instructions, see the files in the \`deployment/\` directory.

---
Generated by DGWALL Deployment Manifest Generator
`;

    writeFileSync(join(this.outputDir, 'README.md'), readme, 'utf8');
    console.log('✅ Export README created');
  }

  // Create deployment information file
  createDeploymentInfo(manifestData) {
    const deploymentInfo = {
      export: {
        timestamp: new Date().toISOString(),
        generator: 'DGWALL Deployment Manifest Generator',
        version: '1.0.0'
      },
      project: {
        name: 'DGWALL - Digital Wallet Logic System',
        repository: 'Chaiya88/logic-digital-wallet',
        cloudflareAccountId: '85bcd386f06541844632ecb984afa9fb',
        domain: 'teenoi96.org'
      },
      deployment: {
        lastDeployment: manifestData.summary.lastDeployment,
        totalFiles: manifestData.summary.totalFiles,
        totalSize: manifestData.summary.totalSize,
        totalSizeFormatted: manifestData.summary.totalSizeFormatted
      },
      workers: manifestData.components.workers?.files.filter(f => f.exists).map(f => ({
        name: basename(f.path),
        path: f.path,
        size: f.size,
        lines: f.lines,
        modified: f.modified
      })) || [],
      recentDeployments: manifestData.deploymentHistory
    };

    writeFileSync(
      join(this.outputDir, 'deployment-info.json'), 
      JSON.stringify(deploymentInfo, null, 2), 
      'utf8'
    );
    console.log('✅ Deployment info created');
  }
}

// CLI functionality
if (import.meta.url === `file://${process.argv[1]}`) {
  const outputDir = process.argv[2] || 'deployed-files-export';
  
  console.log('🚀 DGWALL Deployed Files Exporter');
  console.log('สคริปต์สำหรับส่งออกไฟล์ที่ Deploy\n');
  
  const exporter = new DeployedFilesExporter(outputDir);
  
  exporter.exportFiles()
    .then(result => {
      console.log('\n🎉 Export Summary:');
      console.log(`   Exported Files: ${result.exportedFiles}`);
      console.log(`   Output Directory: ${result.outputDir}`);
      console.log('\n📝 Next Steps:');
      console.log(`   1. Review exported files in: ${result.outputDir}`);
      console.log(`   2. Open deployment-manifest.html for detailed report`);
      console.log(`   3. Use files from 'workers/' directory for deployment`);
    })
    .catch(error => {
      console.error('❌ Export failed:', error.message);
      process.exit(1);
    });
}

export default DeployedFilesExporter;