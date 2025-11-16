<p align="center">
  <img src="logo.png" width="180" alt="Laylaverse Logo">
</p>

# **Layla’s Snips**
### *Smart, fast text snippets that work anywhere you type.*

Layla’s Snips is a lightweight Chrome extension that lets you create **custom text triggers** (snippets) that automatically expand as you type.  
It works across plain-text fields, rich-text editors, emails, documentation systems, Lab Management Systems, CRMs, and almost every text surface on the web.

Built inside the **Laylaverse**, this tool was designed to make your workflow faster, cleaner, and beautifully consistent.

---

## ✨ Features

- **Universal Trigger System**  
  Type `\your-snippet` anywhere, and Layla’s Snips expands it instantly.

- **Smart Field Detection**  
  Automatically switches between:
  - **Plain text mode** for forms, Lab Management Systems, and input boxes  
  - **Rich text mode** for Gmail, CRMs, and contentEditable editors  

- **Perfect Formatting**  
  - Removes HTML in plain-text fields  
  - Preserves rich styling (bold, italic, underline) where appropriate  
  - Handles line breaks cleanly and consistently  

- **Elegant Suggestion Menu**  
  - Appears as you type  
  - Navigate with ↑ ↓ Enter  
  - Displays snippet preview and trigger  

- **Unlimited Snippets**  
  All data saved locally via `chrome.storage.local`.

---

## 🚀 Installation (Developer Mode)

Until the Chrome Web Store listing is published:

1. Download or clone this repository  
2. Visit: `chrome://extensions/`  
3. Enable **Developer mode** (top-right corner)  
4. Click **Load unpacked**  
5. Select the project folder (`laylas-snips/`)  

Layla will take it from here.

---

## 🛠 How to Use

1. Open the **Layla’s Snips Options** page  
2. Create a snippet:
   - **Trigger:** `email-template`  
   - **Handle:** “Clinic Email Template” (optional)  
   - **Body:** The text you want inserted  

3. Anywhere you type, enter:

   `\email-template`

…and Layla expands it instantly.

Works beautifully with:

- Gmail & webmail  
- CRMs  
- Documentation systems  
- Lab Management Systems  
- Web forms  
- Input boxes  
- Textareas  
- Most websites with typing fields  

---

## 🌌 Smart Formatting Engine

Layla’s Snips includes an intelligent formatting system:

- `<div>` → becomes line breaks  
- `<br>` → becomes line breaks  
- HTML → stripped in plain-text fields  
- Styling → preserved in rich-text editors  

This ensures:

- No messy `<div>` or `<span>` tags  
- Clean, readable notes  
- Professional formatting everywhere  

---

## 📄 Privacy

Layla’s Snips collects **no data** of any kind.  
All snippet content and settings are stored **locally** using Chrome’s built-in storage.

- No keystrokes transmitted  
- No logs or usage analytics  
- No external servers contacted  

Full policy:  
**https://layla-verse.github.io/laylas-snips/privacy-policy.html**

---

## 🪐 About the Laylaverse

The **Laylaverse** is an independent software identity dedicated to building elegant tools that reduce friction in everyday workflows.  
Layla’s Snips is the first verse — a small star in a growing constellation of utilities designed to make your world smoother, faster, and a little more magical.

---

## ?? Contact

For support, ideas, or contribution discussions:  
**laylaverse.dev@gmail.com**

---

## ⭐ Roadmap

- Snippet pack import/export  
- Cloud sync options  
- Community snippet libraries  
- Chrome Web Store release  
- Firefox port  
- Additional Laylaverse tools  

---
