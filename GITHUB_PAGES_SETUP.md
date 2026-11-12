# GitHub Pages Setup Guide

## 📚 What is GitHub Pages?

GitHub Pages is a **free static site hosting service** that turns your GitHub repository into a live website. It's perfect for:

- 🌐 Project websites and documentation
- 📱 Single-page applications (SPAs)
- 📊 Portfolio sites
- 📖 Blogs (with Jekyll)
- 🎨 HTML/CSS/JS demos
- 📝 Technical documentation

### Key Features
- ✅ **Free hosting** with HTTPS
- ✅ **Custom domains** supported
- ✅ **Automatic deployment** on push
- ✅ **300MB** soft limit per site
- ✅ **100GB** monthly bandwidth
- ✅ **10 builds per hour**

---

## 🚀 Setup Methods

### Method 1: Quick Setup (Main Branch)

**Best for:** Simple projects with HTML in root directory

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Enable GitHub Pages**
   - Go to your repository on GitHub
   - Click **Settings** → **Pages** (left sidebar)
   - Under **Source**, select:
     - Branch: `main`
     - Folder: `/ (root)` or `/docs`
   - Click **Save**

3. **Access your site**
   - Your site will be live at: `https://<username>.github.io/<repository-name>/`
   - Usually takes 1-3 minutes to deploy

### Method 2: gh-pages Branch

**Best for:** Keeping deployment separate from source code

1. **Create and publish gh-pages branch**
   ```bash
   # Create orphan branch (no history)
   git checkout --orphan gh-pages
   
   # Remove files you don't want published
   git rm -rf .
   
   # Add only your website files
   git add index.html assets/ *.html *.css *.js
   git commit -m "Deploy to GitHub Pages"
   git push origin gh-pages
   
   # Switch back to main
   git checkout main
   ```

2. **Configure in GitHub**
   - Settings → Pages
   - Source: `gh-pages` branch, `/ (root)`

### Method 3: GitHub Actions (Automated)

**Best for:** Build processes, multiple environments, advanced workflows

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
      
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

Then in Settings → Pages, set Source to **GitHub Actions**.

---

## 🎯 What You Can Do with GitHub Pages

### ✅ Supported

#### 1. **Static HTML/CSS/JS**
- Single-page applications (React, Vue, Angular after build)
- Vanilla JavaScript applications
- CSS frameworks (Bootstrap, Tailwind, etc.)
- Progressive Web Apps (PWAs)

#### 2. **Jekyll Sites** (Built-in)
- Automatic Jekyll build process
- Blog-aware static site generator
- Markdown to HTML conversion
- Themes and plugins

#### 3. **Custom Domains**
- Use your own domain name (e.g., `www.nox.fund`)
- Automatic HTTPS with Let's Encrypt
- CNAME file configuration

#### 4. **Assets & Media**
- Images, videos, fonts
- CSS and JavaScript files
- PDF documents
- SVG graphics

#### 5. **Frontend Frameworks** (after build)
- React → `npm run build`
- Vue → `npm run build`
- Angular → `ng build`
- Next.js → `next export` (static export)
- Svelte → `npm run build`

### ❌ NOT Supported

- ❌ Server-side code (PHP, Python, Ruby, Node.js backends)
- ❌ Databases (MySQL, PostgreSQL, MongoDB)
- ❌ Server-side rendering (SSR) at runtime
- ❌ Environment variables (use build-time config)
- ❌ File uploads or form processing (needs external service)
- ❌ API endpoints (use external APIs)

---

## 🔧 Configuration for Your NOX FUND Project

### Option A: Deploy from Main Branch (Simplest)

Your project is already ready! Just:

```bash
# In your repository
git add .
git commit -m "Prepare for GitHub Pages deployment"
git push origin main
```

Then:
1. Go to **Settings → Pages**
2. Source: `main` branch, `/ (root)`
3. Save

Your site will be live at `https://<username>.github.io/nf/`

### Option B: Custom Domain Setup

If you own `nox.fund` domain:

1. **Create CNAME file in root:**
   ```bash
   echo "nox.fund" > CNAME
   git add CNAME
   git commit -m "Add custom domain"
   git push
   ```

2. **Configure DNS records** (at your domain registrar):
   ```
   Type    Name    Value
   ─────────────────────────────────────────────────
   A       @       185.199.108.153
   A       @       185.199.109.153
   A       @       185.199.110.153
   A       @       185.199.111.153
   CNAME   www     <username>.github.io
   ```

3. **In GitHub Settings → Pages:**
   - Custom domain: `nox.fund`
   - Check "Enforce HTTPS"

### URL Path Considerations

If deploying to `https://<username>.github.io/nf/`, update any absolute paths:

**Before:**
```html
<link rel="stylesheet" href="/assets/css/app.css" />
<img src="/assets/img/logo.png" />
```

**After (for subdirectory deployment):**
```html
<link rel="stylesheet" href="./assets/css/app.css" />
<img src="./assets/img/logo.png" />
```

Or use a custom domain (then absolute paths work).

---

## 🎨 Advanced Features

### 1. 404 Page
Create `404.html` in root:
```html
<!DOCTYPE html>
<html>
<head>
    <title>404 - Page Not Found</title>
</head>
<body>
    <h1>Page Not Found</h1>
    <a href="/">Go Home</a>
</body>
</html>
```

### 2. Jekyll Configuration
Create `_config.yml`:
```yaml
title: NOX FUND
description: Trustless Passive Income Protocol
theme: minima
plugins:
  - jekyll-seo-tag
```

### 3. Ignore Files from Build
Add to `.gitignore` or create `.nojekyll` to skip Jekyll processing:
```bash
echo "" > .nojekyll
```

### 4. Environment-Specific Config

For different environments, use build-time replacement:

**config.js:**
```javascript
const config = {
  apiUrl: '{{API_URL}}',
  chainId: '{{CHAIN_ID}}'
};
```

**Build script:**
```bash
sed 's/{{API_URL}}/https:\/\/api.nox.fund/g' config.js.template > config.js
```

### 5. GitHub Actions for Build

For projects requiring build steps:

```yaml
name: Build and Deploy

on:
  push:
    branches: [ main ]

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      # If you had a Node.js build process
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## 🔍 Monitoring & Analytics

### 1. Google Analytics
Add to `<head>` in [`index.html`](index.html:1):
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### 2. Check Build Status
- Go to repository **Actions** tab
- View deployment logs
- Check for errors

### 3. View Deployment History
- Settings → Pages shows latest deployment
- Actions tab shows all builds

---

## 🐛 Troubleshooting

### Site not updating?
```bash
# Force cache clear
# Add query parameter: https://username.github.io/repo?v=2
# Or hard refresh: Cmd+Shift+R (Mac) / Ctrl+F5 (Windows)
```

### 404 on paths?
- Ensure paths are relative: `./assets/` not `/assets/`
- Or use custom domain for absolute paths

### Build failing?
- Check Actions tab for logs
- Verify file permissions
- Check for syntax errors in HTML/CSS/JS

### Styles not loading?
- Check console for 404 errors
- Verify CSS paths
- Clear browser cache

### Jekyll issues?
- Create `.nojekyll` file to disable Jekyll
- Or configure `_config.yml` properly

---

## 📊 Best Practices

1. **✅ Use relative paths** or custom domain
2. **✅ Minify CSS/JS** for faster loading
3. **✅ Optimize images** (compress, use WebP)
4. **✅ Enable HTTPS** (automatic with custom domain)
5. **✅ Add meta tags** for SEO (you already have these!)
6. **✅ Create 404.html** for better UX
7. **✅ Use .nojekyll** if you don't need Jekyll
8. **✅ Version assets** with query strings (`app.css?v=123`)
9. **✅ Test locally** before pushing
10. **✅ Keep under 1GB** total repository size

---

## 🚀 Quick Start for Your Project

```bash
# 1. Ensure you're on main branch
git checkout main

# 2. Create .nojekyll to skip Jekyll processing
echo "" > .nojekyll

# 3. Add, commit, and push
git add .
git commit -m "Setup for GitHub Pages"
git push origin main

# 4. Go to GitHub.com → Your Repo → Settings → Pages
#    - Source: main branch, / (root)
#    - Save

# 5. Wait 2-3 minutes, then visit:
#    https://<your-username>.github.io/nf/
```

---

## 📚 Additional Resources

- [GitHub Pages Documentation](https://docs.github.com/pages)
- [Custom Domain Setup](https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site)
- [GitHub Actions for Pages](https://github.com/actions/deploy-pages)
- [Jekyll Documentation](https://jekyllrb.com/)

---

## 💡 Summary

**GitHub Pages is perfect for your NOX FUND project because:**
- ✅ It's purely frontend (HTML/CSS/JS)
- ✅ Web3 interactions happen client-side
- ✅ No backend server needed
- ✅ Free hosting with custom domain support
- ✅ Automatic HTTPS
- ✅ Integrates with your existing GitHub workflow

**Your site will work perfectly** as-is since you're using client-side Web3 (WalletConnect/Web3Modal) and all blockchain interactions happen through user wallets. No server-side processing required!
