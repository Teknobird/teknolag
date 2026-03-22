# Kişisel Site — Cloudflare Pages + Decap CMS Blog Sistemi

## Dosya Yapısı

```
/
├── index.html              ← Ana sayfa
├── blog.html               ← Blog listesi
├── blog/
│   ├── *.md                ← Blog yazılarınız (Decap CMS buraya yazar)
│   └── *.html              ← Build sonrası otomatik üretilir
├── admin/
│   ├── index.html          ← Decap CMS paneli (/admin adresinde açılır)
│   └── config.yml          ← CMS yapılandırması ← BURAYI DÜZENLEYİN
├── public/
│   ├── style.css           ← Tüm sitede ortak CSS
│   ├── main.js             ← Ortak JS
│   ├── posts-index.json    ← Build sonrası otomatik üretilir
│   └── images/             ← Yüklediğiniz görseller
├── build.js                ← Markdown → HTML dönüştürücü
├── package.json
├── _headers                ← Cloudflare güvenlik başlıkları
└── _redirects
```

---

## Kurulum (Adım Adım)

### 1. GitHub Repository Oluşturun

1. https://github.com/new adresine gidin
2. Repository adı: `kisisel-site` (veya istediğiniz bir ad)
3. **Public** seçin (Decap CMS ücretsiz OAuth için gerekli)
4. "Create repository" tıklayın

### 2. Dosyaları GitHub'a Yükleyin

GitHub'da "uploading an existing file" linkine tıklayın ve tüm dosyaları sürükleyin.
Veya git ile:
```bash
git init
git add .
git commit -m "İlk yükleme"
git remote add origin https://github.com/KULLANICI/kisisel-site.git
git push -u origin main
```

### 3. admin/config.yml Düzenleyin

```yaml
backend:
  repo: KULLANICI_ADINIZ/kisisel-site   # ← buraya yazın
```

### 4. Cloudflare Pages'e Bağlayın

1. https://dash.cloudflare.com → Workers & Pages → Create → Pages
2. **Connect to Git** → GitHub hesabınızı bağlayın
3. Repository seçin: `kisisel-site`
4. Build ayarları:
   - **Build command:** `node build.js`
   - **Build output directory:** `/` (kök dizin)
5. **Save and Deploy**

### 5. Decap CMS OAuth Kurulumu (bir kez yapılır)

Blog paneline girebilmek için GitHub OAuth gerekiyor:

1. https://github.com/settings/developers → "New OAuth App"
2. Doldurun:
   - Application name: `Kisisel Site CMS`
   - Homepage URL: `https://SITENIZ.pages.dev`
   - Authorization callback URL: `https://api.netlify.com/auth/done`
3. "Register application" → **Client ID** ve **Client Secret** kopyalayın
4. https://app.netlify.com → yeni site oluşturun (deploy etmenize gerek yok)
5. Site Settings → Access control → OAuth → GitHub → Client ID ve Secret'ı girin

---

## Blog Yazısı Nasıl Yazılır?

### Panel Üzerinden (Önerilen)
1. `https://SITENIZ.pages.dev/admin` adresine gidin
2. GitHub ile giriş yapın
3. "Blog Yazıları" → "New Blog Yazıları"
4. Başlık, kategori, içerik doldurun → **Publish**
5. Cloudflare Pages otomatik build başlatır (~1 dk) → yayında!

### Manuel (Markdown)
`blog/` klasörüne `.md` dosyası ekleyin:

```markdown
---
title: "Yazı Başlığı"
date: "20 Mart 2025"
category: "Yapay Zeka"
excerpt: "Kısa açıklama."
image: "https://..."
readtime: 7
tags: "etiket1, etiket2"
---

## Başlık

İçerik buraya...
```

---

## Özelleştirme

- **Ad/Soyad**: Tüm HTML dosyalarında "Ad Soyad" yerine kendi adınızı yazın
- **E-posta**: index.html içinde güncelleyin
- **Renkler**: `public/style.css` → `:root` değişkenleri
- **Kategoriler**: `admin/config.yml` → options listesi
- **Profil fotoğrafı**: `index.html` içinde `about-photo` div'ine `<img>` ekleyin

---

## Yeni Yazı Yayınlama Akışı (Kurulum Sonrası)

```
/admin paneli → Yaz → Publish
       ↓
    GitHub'a .md dosyası commit edilir
       ↓
    Cloudflare Pages build tetiklenir (node build.js)
       ↓
    .html dosyaları üretilir
       ↓
    Siteniz ~60 saniyede güncellenir ✓
```
