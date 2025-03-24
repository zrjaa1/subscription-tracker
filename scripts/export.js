import { Octokit } from '@octokit/rest';
import JSZip from 'jszip';
import { config } from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// Ignore patterns for files we don't want to export
const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  '.env',
  '.DS_Store',
  'package-lock.json'
];

async function getAllFiles(dir) {
  const files = await fs.readdir(dir);
  const filelist = [];

  for (const file of files) {
    // Skip ignored files and directories
    if (IGNORE_PATTERNS.some(pattern => file.includes(pattern))) {
      continue;
    }

    const filepath = path.join(dir, file);
    const stat = await fs.stat(filepath);

    if (stat.isDirectory()) {
      filelist.push(...(await getAllFiles(filepath)));
    } else {
      filelist.push(filepath);
    }
  }

  return filelist;
}

async function createGitHubRepo() {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error('GitHub token not found. Please set GITHUB_TOKEN in your .env file');
  }

  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
  });

  const packageJson = JSON.parse(
    await fs.readFile(path.join(projectRoot, 'package.json'), 'utf-8')
  );

  try {
    const { data: repo } = await octokit.repos.createForAuthenticatedUser({
      name: packageJson.name,
      description: 'Subscription tracking application built with React and Supabase',
      private: false,
      auto_init: true
    });

    return repo;
  } catch (error) {
    if (error.status === 422) {
      // Repository already exists
      const { data: user } = await octokit.users.getAuthenticated();
      return { full_name: `${user.login}/${packageJson.name}` };
    }
    throw error;
  }
}

async function createTreeRecursive(octokit, owner, repo, files, parentPath = '') {
  const tree = [];
  const directories = new Map();

  // Group files by directory
  for (const [path, content] of files) {
    const parts = path.split('/');
    const fileName = parts.pop();
    const dirPath = parts.join('/');

    if (!directories.has(dirPath)) {
      directories.set(dirPath, []);
    }
    directories.get(dirPath).push({ fileName, content });
  }

  // Create blobs and tree entries
  for (const [dirPath, files] of directories) {
    for (const { fileName, content } of files) {
      const { data: blob } = await octokit.git.createBlob({
        owner,
        repo,
        content: content.toString('base64'),
        encoding: 'base64'
      });

      const fullPath = dirPath ? `${dirPath}/${fileName}` : fileName;
      tree.push({
        path: fullPath,
        mode: '100644',
        type: 'blob',
        sha: blob.sha
      });
    }
  }

  return tree;
}

async function uploadToGitHub(repoFullName) {
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
  });

  const [owner, repo] = repoFullName.split('/');
  const files = await getAllFiles(projectRoot);

  // Read all files and store them in a Map
  const fileContents = new Map();
  for (const file of files) {
    const content = await fs.readFile(file);
    const relativePath = path.relative(projectRoot, file);
    fileContents.set(relativePath, content);
  }

  // Get current commit SHA
  const { data: ref } = await octokit.git.getRef({
    owner,
    repo,
    ref: 'heads/main'
  });

  const { data: commit } = await octokit.git.getCommit({
    owner,
    repo,
    commit_sha: ref.object.sha
  });

  // Create tree with all files
  const tree = await createTreeRecursive(octokit, owner, repo, fileContents);

  // Create new tree
  const { data: newTree } = await octokit.git.createTree({
    owner,
    repo,
    base_tree: commit.tree.sha,
    tree
  });

  // Create commit
  const { data: newCommit } = await octokit.git.createCommit({
    owner,
    repo,
    message: `Update from WebContainer v${process.env.npm_package_version}`,
    tree: newTree.sha,
    parents: [ref.object.sha]
  });

  // Update reference
  await octokit.git.updateRef({
    owner,
    repo,
    ref: 'heads/main',
    sha: newCommit.sha
  });

  return `https://github.com/${repoFullName}`;
}

async function main() {
  try {
    console.log('Creating GitHub repository...');
    const repo = await createGitHubRepo();
    
    console.log('Uploading files...');
    const repoUrl = await uploadToGitHub(repo.full_name);
    
    console.log(`\nSuccess! Your project has been exported to GitHub:`);
    console.log(`${repoUrl}\n`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();