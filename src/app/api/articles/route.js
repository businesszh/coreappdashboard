import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import matter from 'gray-matter';
import fs from 'fs';
import path from 'path';

// 检查环境变量
if (!process.env.GITHUB_TOKEN) {
  console.error('GITHUB_TOKEN is not set');
}
if (!process.env.GITHUB_OWNER) {
  console.error('GITHUB_OWNER is not set');
}
if (!process.env.GITHUB_REPO) {
  console.error('GITHUB_REPO is not set');
}

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

const owner = process.env.GITHUB_OWNER || 'businesszh';
const repo = process.env.GITHUB_REPO || 'coreappdashboard';
const articlesJsonPath = 'data/json/articles.json';
const mdFolderPath = 'data/md';
const localArticlesJsonPath = path.join(process.cwd(), 'data', 'json', 'articles.json');
const localMdFolderPath = path.join(process.cwd(), 'data', 'md');

// 确保本地目录存在
try {
  if (!fs.existsSync(path.dirname(localArticlesJsonPath))) {
    fs.mkdirSync(path.dirname(localArticlesJsonPath), { recursive: true });
  }
  if (!fs.existsSync(localMdFolderPath)) {
    fs.mkdirSync(localMdFolderPath, { recursive: true });
  }
} catch (error) {
  console.error('Error creating directories:', error);
}

async function getArticlesFromGitHub() {
  try {
    console.log('Fetching articles from GitHub...');
    const { data } = await octokit.repos.getContent({
      owner,
      repo,
      path: articlesJsonPath,
    });

    const content = Buffer.from(data.content, 'base64').toString('utf8');
    const articles = JSON.parse(content);
    console.log('Successfully fetched articles from GitHub');
    return articles;
  } catch (error) {
    console.error('Error fetching articles from GitHub:', error.message);
    if (error.status === 404) {
      console.error('Articles.json not found in GitHub repository');
    }
    throw error;
  }
}

function getLocalArticles() {
  try {
    console.log('Reading articles from local file...');
    if (!fs.existsSync(localArticlesJsonPath)) {
      console.log('Local articles.json not found, returning empty array');
      return [];
    }
    const articles = JSON.parse(fs.readFileSync(localArticlesJsonPath, 'utf8'));
    console.log('Successfully read articles from local file');
    return articles;
  } catch (error) {
    console.error('Error reading local articles:', error.message);
    return [];
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sync = searchParams.get('sync');
  const articlePath = searchParams.get('path');

  try {
    if (articlePath) {
      // Fetch single article
      try {
        console.log('Fetching single article from GitHub:', articlePath);
        const { data } = await octokit.repos.getContent({
          owner,
          repo,
          path: decodeURIComponent(articlePath),
        });

        const content = Buffer.from(data.content, 'base64').toString('utf8');
        const { data: frontMatter, content: articleContent } = matter(content);

        return NextResponse.json({
          ...frontMatter,
          content: articleContent,
          path: data.path,
        });
      } catch (error) {
        console.error('Error fetching article from GitHub:', error.message);
        // Try to get from local file
        try {
          console.log('Trying to fetch article from local file:', articlePath);
          const localPath = path.join(process.cwd(), decodeURIComponent(articlePath));
          if (!fs.existsSync(localPath)) {
            console.error('Local article file not found:', localPath);
            throw new Error('Article not found');
          }
          const content = fs.readFileSync(localPath, 'utf8');
          const { data: frontMatter, content: articleContent } = matter(content);
          return NextResponse.json({
            ...frontMatter,
            content: articleContent,
            path: articlePath,
          });
        } catch (localError) {
          console.error('Error fetching article from local:', localError.message);
          return NextResponse.json({ error: 'Failed to fetch article' }, { status: 500 });
        }
      }
    } else if (sync === 'true') {
      console.log('Syncing articles...');
      await syncArticles();
    }

    try {
      const articles = await getArticlesFromGitHub();
      return NextResponse.json(articles);
    } catch (error) {
      console.error('GitHub API error:', error.message);
      console.log('Falling back to local articles...');
      const localArticles = getLocalArticles();
      return NextResponse.json(localArticles);
    }
  } catch (error) {
    console.error('Error in GET handler:', error.message);
    return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { article } = await request.json();

    if (!article || !article.path) {
      return NextResponse.json({ error: 'Invalid article data' }, { status: 400 });
    }

    console.log('Updating article:', article.title);
    
    // 检查本地文件是否存在
    const localPath = path.join(process.cwd(), article.path);
    if (!fs.existsSync(localPath)) {
      return NextResponse.json({ error: 'Article file not found' }, { status: 404 });
    }

    // 更新本地文件
    try {
      const currentContent = fs.readFileSync(localPath, 'utf8');
      const { data: frontMatter } = matter(currentContent);

      const updatedFrontMatter = {
        ...frontMatter,
        title: article.title,
        description: article.description,
        lastModified: new Date().toISOString(),
      };

      const updatedContent = matter.stringify(article.content, updatedFrontMatter);
      fs.writeFileSync(localPath, updatedContent);
      console.log('Successfully updated local MD file');
    } catch (error) {
      console.error('Error updating local file:', error);
      return NextResponse.json({ error: 'Failed to update local file' }, { status: 500 });
    }

    // 如果设置了 GitHub Token，则同步到 GitHub
    if (process.env.GITHUB_TOKEN) {
      try {
        await updateMdFile(article);
        await syncArticles();
      } catch (error) {
        console.error('Error syncing with GitHub:', error);
        // 不返回错误，因为本地文件已经更新成功
      }
    }

    return NextResponse.json({ message: 'Article updated successfully' });
  } catch (error) {
    console.error('Error updating article:', error.message);
    return NextResponse.json({ error: 'Failed to update article' }, { status: 500 });
  }
}

async function syncArticles() {
  try {
    console.log('Starting article sync...');
    // Fetch all MD files
    const { data: files } = await octokit.repos.getContent({
      owner,
      repo,
      path: mdFolderPath,
    });

    const mdFiles = files.filter(file => file.name.endsWith('.md'));
    console.log(`Found ${mdFiles.length} markdown files`);

    const articles = await Promise.all(mdFiles.map(async file => {
      try {
        const { data } = await octokit.repos.getContent({
          owner,
          repo,
          path: file.path,
        });

        const content = Buffer.from(data.content, 'base64').toString('utf8');
        const { data: frontMatter, content: articleContent } = matter(content);

        // Fetch the last commit for this file
        const { data: commits } = await octokit.repos.listCommits({
          owner,
          repo,
          path: file.path,
          per_page: 1
        });

        const lastModified = commits[0]?.commit.committer.date || data.sha;

        return {
          title: frontMatter.title,
          description: frontMatter.description,
          date: frontMatter.date,
          lastModified: lastModified,
          path: file.path,
        };
      } catch (error) {
        console.error(`Error processing file ${file.path}:`, error.message);
        return null;
      }
    }));

    const validArticles = articles.filter(article => article !== null);
    console.log(`Successfully processed ${validArticles.length} articles`);

    // Update articles.json
    const { data: currentFile } = await octokit.repos.getContent({
      owner,
      repo,
      path: articlesJsonPath,
    });

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: articlesJsonPath,
      message: 'Sync articles',
      content: Buffer.from(JSON.stringify(validArticles, null, 2)).toString('base64'),
      sha: currentFile.sha,
    });

    // Also update local file
    fs.writeFileSync(localArticlesJsonPath, JSON.stringify(validArticles, null, 2));
    console.log('Successfully synced articles');

  } catch (error) {
    console.error('Error syncing articles:', error.message);
    throw error;
  }
}

async function updateMdFile(article) {
  try {
    console.log('Updating MD file:', article.path);
    const { data: currentFile } = await octokit.repos.getContent({
      owner,
      repo,
      path: article.path,
    });

    const currentContent = Buffer.from(currentFile.content, 'base64').toString('utf8');
    const { data: frontMatter, content: articleContent } = matter(currentContent);

    const updatedFrontMatter = {
      ...frontMatter,
      title: article.title,
      description: article.description,
      lastModified: new Date().toISOString(),
    };

    const updatedContent = matter.stringify(article.content, updatedFrontMatter);

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: article.path,
      message: `Update article: ${article.title}`,
      content: Buffer.from(updatedContent).toString('base64'),
      sha: currentFile.sha,
    });

    // Also update local file
    const localPath = path.join(process.cwd(), article.path);
    fs.writeFileSync(localPath, updatedContent);
    console.log('Successfully updated MD file');

  } catch (error) {
    console.error('Error updating MD file:', error.message);
    throw error;
  }
}