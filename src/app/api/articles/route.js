import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import matter from 'gray-matter';
import fs from 'fs';
import path from 'path';

// 检查环境变量
const isDevelopment = process.env.NODE_ENV === 'development';
const githubToken = process.env.GITHUB_TOKEN;
const githubOwner = process.env.GITHUB_OWNER || 'businesszh';
const githubRepo = process.env.GITHUB_REPO || 'coreappdashboard';

// 初始化 Octokit（仅在设置了 token 时）
const octokit = githubToken ? new Octokit({ auth: githubToken }) : null;

const articlesJsonPath = 'data/json/articles.json';
const mdFolderPath = 'data/md';
const localArticlesJsonPath = path.join(process.cwd(), 'data', 'json', 'articles.json');
const localMdFolderPath = path.join(process.cwd(), 'data', 'md');

// 确保本地目录存在（仅在开发环境中）
if (isDevelopment) {
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
}

async function getArticlesFromGitHub() {
  if (!octokit) {
    console.log('GitHub token not configured, skipping GitHub fetch');
    return [];
  }

  try {
    console.log('Fetching articles from GitHub...');
    const { data } = await octokit.repos.getContent({
      owner: githubOwner,
      repo: githubRepo,
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
      // 首先尝试从本地文件获取
      if (isDevelopment) {
        try {
          console.log('Trying to fetch article from local file:', articlePath);
          const localPath = path.join(process.cwd(), decodeURIComponent(articlePath));
          if (fs.existsSync(localPath)) {
            const content = fs.readFileSync(localPath, 'utf8');
            const { data: frontMatter, content: articleContent } = matter(content);
            return NextResponse.json({
              ...frontMatter,
              content: articleContent,
              path: articlePath,
            });
          }
        } catch (localError) {
          console.error('Error fetching article from local:', localError.message);
        }
      }

      // 如果本地获取失败或不在开发环境，尝试从 GitHub 获取
      if (octokit) {
        try {
          console.log('Fetching single article from GitHub:', articlePath);
          const { data } = await octokit.repos.getContent({
            owner: githubOwner,
            repo: githubRepo,
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
        }
      }

      return NextResponse.json({ error: 'Failed to fetch article' }, { status: 500 });
    } else if (sync === 'true') {
      console.log('Syncing articles...');
      await syncArticles();
    }

    // 获取文章列表
    try {
      if (octokit) {
        const articles = await getArticlesFromGitHub();
        return NextResponse.json(articles);
      } else {
        const localArticles = getLocalArticles();
        return NextResponse.json(localArticles);
      }
    } catch (error) {
      console.error('Error fetching articles:', error.message);
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
    
    // 在开发环境中更新本地文件
    if (isDevelopment) {
      const localPath = path.join(process.cwd(), article.path);
      if (!fs.existsSync(localPath)) {
        return NextResponse.json({ error: 'Article file not found' }, { status: 404 });
      }

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
    }

    // 如果配置了 GitHub Token，则更新 GitHub 文件
    if (octokit) {
      try {
        await updateMdFile(article);
        await syncArticles();
        return NextResponse.json({ message: 'Article updated successfully' });
      } catch (error) {
        console.error('Error updating GitHub file:', error);
        if (isDevelopment) {
          // 在开发环境中，如果本地更新成功但 GitHub 更新失败，仍然返回成功
          return NextResponse.json({ message: 'Article updated locally successfully' });
        }
        return NextResponse.json({ error: 'Failed to update article on GitHub' }, { status: 500 });
      }
    } else if (isDevelopment) {
      // 在开发环境中，如果没有配置 GitHub Token，只更新本地文件
      return NextResponse.json({ message: 'Article updated locally successfully' });
    } else {
      return NextResponse.json({ error: 'GitHub token not configured' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error updating article:', error.message);
    return NextResponse.json({ error: 'Failed to update article' }, { status: 500 });
  }
}

async function syncArticles() {
  if (!octokit) {
    console.log('GitHub token not configured, skipping sync');
    return;
  }

  try {
    console.log('Starting article sync...');
    // Fetch all MD files
    const { data: files } = await octokit.repos.getContent({
      owner: githubOwner,
      repo: githubRepo,
      path: mdFolderPath,
    });

    const mdFiles = files.filter(file => file.name.endsWith('.md'));
    console.log(`Found ${mdFiles.length} markdown files`);

    const articles = await Promise.all(mdFiles.map(async file => {
      try {
        const { data } = await octokit.repos.getContent({
          owner: githubOwner,
          repo: githubRepo,
          path: file.path,
        });

        const content = Buffer.from(data.content, 'base64').toString('utf8');
        const { data: frontMatter, content: articleContent } = matter(content);

        // Fetch the last commit for this file
        const { data: commits } = await octokit.repos.listCommits({
          owner: githubOwner,
          repo: githubRepo,
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
      owner: githubOwner,
      repo: githubRepo,
      path: articlesJsonPath,
    });

    await octokit.repos.createOrUpdateFileContents({
      owner: githubOwner,
      repo: githubRepo,
      path: articlesJsonPath,
      message: 'Sync articles',
      content: Buffer.from(JSON.stringify(validArticles, null, 2)).toString('base64'),
      sha: currentFile.sha,
    });

    // Also update local file in development
    if (isDevelopment) {
      fs.writeFileSync(localArticlesJsonPath, JSON.stringify(validArticles, null, 2));
      console.log('Successfully synced articles locally');
    }

    console.log('Successfully synced articles to GitHub');

  } catch (error) {
    console.error('Error syncing articles:', error.message);
    throw error;
  }
}

async function updateMdFile(article) {
  if (!octokit) {
    console.log('GitHub token not configured, skipping GitHub update');
    return;
  }

  try {
    console.log('Updating MD file:', article.path);
    const { data: currentFile } = await octokit.repos.getContent({
      owner: githubOwner,
      repo: githubRepo,
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
      owner: githubOwner,
      repo: githubRepo,
      path: article.path,
      message: `Update article: ${article.title}`,
      content: Buffer.from(updatedContent).toString('base64'),
      sha: currentFile.sha,
    });

    console.log('Successfully updated MD file on GitHub');

  } catch (error) {
    console.error('Error updating MD file:', error.message);
    throw error;
  }
}
