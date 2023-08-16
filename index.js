#! /usr/bin/env node
import { program } from 'commander';
import { fetchLicense } from './src/scraper.js';
import fs from 'fs';
import chalk from 'chalk';

program
    .name('genlicenses')
    .description('CLI to generate open source licenses from a project\'s dependencies')
    .version('1.0.0');

program
    .option('--devonly', 'Only generates licences for the devDependencies of the project')
    .option('--prodonly', 'Only generates licences for the dependencies of the project')

program.parse();

const options = program.opts();
let prod = !!options.prodonly;
let dev = !!options.devonly;

if(!options.prodonly && !options.devonly) {
    prod = true;
    dev = true;
}

const generateLicenses = async () => {
    const wd = process.cwd();
    const packageJSON = JSON.parse(fs.readFileSync(wd + "\\package.json"));
    const name = packageJSON.name;
    const deps = packageJSON.dependencies;
    const devDeps = packageJSON.devDependencies == undefined ? [] : packageJSON.devDependencies;
    
    let data = `${name} uses the following open source projects:\n\n`
    
    if(prod) {
        for (let dep in deps) {
            const lic = await fetchLicense(dep);
            data += `# [${lic.name}](${lic.url})\n\n`;
            data += `\`\`\`\n${lic.text}\n\`\`\`\n\n`;
        }
    }

    if(dev) {
        for (let dep in devDeps) {
            const lic = await fetchLicense(dep);
            data += `# [${lic.name}](${lic.url})\n\n`;
            data += `\`\`\`\n${lic.text}\n\`\`\`\n\n`;
        }
    }
    
    if(!fs.existsSync(wd + "\\docs")) {
        fs.mkdirSync(wd + "\\docs");
    }
    
    const licenses_path = wd + "\\docs\\LICENSES.md";
    fs.writeFileSync(licenses_path, data);
    console.log(
        chalk.greenBright(
            `Generated open source licenses for ${
                (prod ? Object.keys(deps).length : 0) + (dev ? Object.keys(devDeps).length : 0)
            } dependencies at ${licenses_path}`
        )
    );
}

generateLicenses();