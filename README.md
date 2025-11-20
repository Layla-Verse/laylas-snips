<p align="center"> <img src="logo.png" width="180" alt="Laylaverse Logo"> </p>
Layla’s Snips
A lightweight Chrome extension for fast, reliable text snippet expansion.

Layla’s Snips provides a simple, consistent way to generate and use text snippets across nearly all text fields on the web. The extension detects whether you’re typing in a plain-text field or a rich-text editor and inserts your saved snippets with clean, predictable formatting.

Built as part of the Laylaverse, this tool is designed for clarity, efficiency, and full local privacy.

✨ Key Features
Universal Trigger Expansion

Type \your-trigger anywhere to expand a saved snippet instantly.

Works in both single-line and multi-line input environments.

Intelligent Field Detection

Automatically adapts to:

Plain-text fields (forms, lab systems, documentation systems, LMS platforms)

Rich-text editors (Gmail, CRMs, contentEditable surfaces)

Nested editor and iframe environments used by platforms like Salesforce, ServiceNow, and HubSpot

Clean Formatting Engine

Strips HTML when inserting into plain-text inputs

Preserves formatting (bold, italic, underline) in rich editors

Normalizes line breaks and avoids unwanted <div> / <span> artifacts

Produces consistent formatting across heterogeneous platforms

Smart Suggestion Menu

Appears as soon as you begin typing a trigger

Keyboard navigation: ↑ ↓ Enter Esc

Displays trigger, label, and a body preview

Works inside iframes and complex editing contexts

Local, Unlimited Storage

Stores all snippets using chrome.storage.local

No upload, sync, or external server contact

Unlimited snippet capacity

🚀 Installation (Pre–Chrome Web Store)

Download or clone this repository

Open chrome://extensions/

Enable Developer Mode

Click Load unpacked

Select the laylas-snips/ directory

Once loaded, the extension is active immediately.

🛠 How to Use

Open the Options page from the extension menu

Create a new snippet:

Trigger: The text after the backslash (e.g., greeting-email)

Handle: Optional display name

Body: The snippet content (plain or formatted)

Type your trigger anywhere on the web using:

\greeting-email


Layla inserts the stored content into the field automatically.

Works reliably with:

Gmail & webmail

CRMs (Salesforce, HubSpot, Zoho)

Lab Management Systems

EHR / documentation platforms

Textareas & standard HTML inputs

contentEditable editors

Web-based note-taking tools

🌌 Formatting Behavior

Layla’s formatting engine converts content as needed:

<div>, <p> → Line breaks

<br> → Line breaks

Raw HTML removed in plain-text fields

Styling preserved in supported rich-text editors

Outputs consistent, clean text without markup clutter

📄 Privacy & Security

Layla’s Snips collects no data.

Stored locally:

Snippets

Handles

Rich-text content

Settings

The extension:

Does not transmit keystrokes

Does not log activity

Does not use cookies, analytics, or external servers

Full Privacy Policy:
https://layla-verse.github.io/laylas-snips/privacy-policy.html

🪐 About the Laylaverse

The Laylaverse is an independent software identity focused on building lightweight, efficient tools that improve workflow quality. Layla’s Snips is the first public utility in this ecosystem, with additional extensions and tools planned.

📬 Contact

For support, contributions, or collaboration inquiries:
laylaverse.dev@gmail.com

⭐ Roadmap

Future planned improvements include:

Snippet import & export

Optional cloud sync

Public snippet template libraries

Chrome Web Store availability

Firefox compatibility

Additional Laylaverse productivity tools
