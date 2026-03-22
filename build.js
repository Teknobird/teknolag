#!/usr/bin/env node
/**
 * build.js — Cloudflare Pages Build Script
 * Her çalıştığında:
 * 1. /blog/*.md dosyalarını okur
 * 2. Her biri için /blog/[slug].html üretir
 * 3. /public/posts-index.json günceller
 */

const fs = require('fs');
const path = require('path');

// Minimal markdown → HTML dönüştürücü (marked yerine sıfır bağımlılık)
function mdToHtml(md) {
  return md
    // Kod blokları (önce işle)
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) =>
      `<pre><code class="language-${lang}">${escHtml(code.trim())}</code></pre>`)
    // İnline kod
    .replace(/`([^`]+)`/g, (_, c) => `<code>${escHtml(c)}</code>`)
    // Başlıklar
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold & italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Blockquote
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // HR
    .replace(/^---$/gm, '<hr>')
    // Listeler
    .replace(/^[\*\-] (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>[\s\S]+?<\/li>)(\n(?!<li>))/g, '<ul>$1</ul>\n')
    // Linkler & görseller
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    // Paragraflar
    .split(/\n\n+/)
    .map(block => {
      block = block.trim();
      if (!block) return '';
      if (/^<(h[1-6]|ul|ol|blockquote|pre|hr)/.test(block)) return block;
      return `<p>${block.replace(/\n/g, ' ')}</p>`;
    })
    .join('\n');
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Front-matter ayrıştırıcı (YAML benzeri: key: value)
function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]+?)\n---\n([\s\S]*)$/);
  if (!match) return { data: {}, content: raw };
  const data = {};
  match[1].split('\n').forEach(line => {
    const [k, ...v] = line.split(':');
    if (k) data[k.trim()] = v.join(':').trim().replace(/^["']|["']$/g, '');
  });
  return { data, content: match[2] };
}

// Okuma süresi tahmini (kelime sayısı / 200)
function readTime(text) {
  return Math.max(1, Math.round(text.split(/\s+/).length / 200));
}

// Post HTML şablonu
function postTemplate({ title, date, category, excerpt, image, readtime, tags, content, slug }) {
  const tagsHtml = tags ? tags.split(',').map(t =>
    `<span class="tag">${t.trim()}</span>`).join('') : '';
  const coverHtml = image
    ? `<div class="post-cover"><img src="${image}" alt="${title}"></div>` : '';
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title} — Ad Soyad</title>
  <meta name="description" content="${excerpt || ''}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${excerpt || ''}">
  ${image ? `<meta property="og:image" content="${image}">` : ''}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/public/style.css">
</head>
<body>
  <nav>
    <a href="/" class="nav-logo">Ad <span>Soyad</span></a>
    <ul class="nav-links">
      <li><a href="/#uygulamalar">Uygulamalar</a></li>
      <li><a href="/blog.html">Blog</a></li>
      <li><a href="/#hakkimda">Hakkımda</a></li>
      <li><a href="/#iletisim">İletişim</a></li>
    </ul>
    <a href="/#iletisim" class="nav-cta">İletişime Geç</a>
  </nav>

  <div class="post-container">
    <a href="/blog.html" class="post-back">← Tüm Yazılar</a>
    <div class="post-header">
      <span class="blog-tag">${category || 'Genel'}</span>
      <h1>${title}</h1>
      <div class="post-meta">
        <span>📅 ${date}</span>
        <span>⏱ ${readtime} dk okuma</span>
        ${category ? `<span>📁 ${category}</span>` : ''}
      </div>
    </div>
    ${coverHtml}
    <div class="post-content">
      ${content}
    </div>
    ${tagsHtml ? `<div class="post-tags">${tagsHtml}</div>` : ''}
  </div>

  <footer>
    <div class="footer-logo">Ad <span>Soyad</span></div>
    <ul class="footer-links">
      <li><a href="/blog.html">Blog</a></li>
      <li><a href="/#hakkimda">Hakkımda</a></li>
      <li><a href="/#iletisim">İletişim</a></li>
    </ul>
    <p class="footer-copy">© 2025 Ad Soyad.</p>
  </footer>
  <script src="/public/main.js"></script>
</body>
</html>`;
}

// Ana build
function build() {
  const blogDir = path.join(__dirname, 'blog');
  const outDir = path.join(__dirname, 'blog');
  const publicDir = path.join(__dirname, 'public');

  if (!fs.existsSync(blogDir)) fs.mkdirSync(blogDir, { recursive: true });
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  const mdFiles = fs.readdirSync(blogDir).filter(f => f.endsWith('.md'));
  const index = [];

  for (const file of mdFiles) {
    const slug = file.replace('.md', '');
    const raw = fs.readFileSync(path.join(blogDir, file), 'utf8');
    const { data, content: mdContent } = parseFrontmatter(raw);

    const rt = data.readtime || String(readTime(mdContent));
    const htmlContent = mdToHtml(mdContent);

    const post = {
      slug,
      title: data.title || slug,
      date: data.date || '',
      category: data.category || '',
      excerpt: data.excerpt || '',
      image: data.image || '',
      readtime: rt,
      tags: data.tags || ''
    };

    // Her post için HTML oluştur
    const html = postTemplate({ ...post, content: htmlContent });
    fs.writeFileSync(path.join(outDir, `${slug}.html`), html, 'utf8');
    console.log(`✓ blog/${slug}.html`);

    index.push(post);
  }

  // Tarihe göre sırala (en yeni önce)
  index.sort((a, b) => new Date(b.date) - new Date(a.date));

  // posts-index.json yaz
  fs.writeFileSync(
    path.join(publicDir, 'posts-index.json'),
    JSON.stringify(index, null, 2),
    'utf8'
  );
  console.log(`✓ public/posts-index.json (${index.length} yazı)`);
  console.log('Build tamamlandı!');
}

build();
