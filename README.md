<p align="center">
  <img src="logo.png" width="180" alt="Laylaverse Logo">
</p>

<h1 align="center"><strong>Layla’s Snips</strong></h1>
<h3 align="center"><em>A lightweight Chrome extension for fast, reliable text snippet expansion.</em></h3>

<p>
Layla’s Snips provides a clean and efficient way to create text snippets and expand them anywhere you type across the web. 
The extension intelligently detects the type of field you're typing in—plain text or rich text—and inserts your saved content with consistent, predictable formatting. 
Built as part of the Laylaverse, this tool emphasizes clarity, efficiency, and complete local privacy.
</p>

<hr>

<h2><strong>✨ Key Features</strong></h2>

<h3><strong>Universal Trigger Expansion</strong></h3>
<ul>
  <li>Type <code>\your-trigger</code> to expand a saved snippet instantly.</li>
  <li>Works in both single-line and multi-line input environments.</li>
</ul>

<h3><strong>Intelligent Field Detection</strong></h3>
<p>Automatically adapts to:</p>
<ul>
  <li><strong>Plain-text fields</strong> (forms, documentation systems, LMS platforms)</li>
  <li><strong>Rich-text editors</strong> (Gmail, CRMs, contentEditable surfaces)</li>
  <li><strong>Nested editor / iframe environments</strong> such as Salesforce, ServiceNow, and HubSpot</li>
</ul>

<h3><strong>Clean Formatting Engine</strong></h3>
<ul>
  <li>Strips HTML when inserting into plain-text inputs</li>
  <li>Preserves formatting (bold, italic, underline) in rich editors</li>
  <li>Normalizes line breaks</li>
  <li>Eliminates unwanted <code>&lt;div&gt;</code>, <code>&lt;span&gt;</code>, or editor-specific artifacts</li>
  <li>Produces consistent output across heterogeneous platforms</li>
</ul>

<h3><strong>Smart Suggestion Menu</strong></h3>
<ul>
  <li>Appears automatically as soon as you begin typing a trigger</li>
  <li>Keyboard navigation: <strong>↑ ↓ Enter Esc</strong></li>
  <li>Displays trigger, handle, and snippet preview</li>
  <li>Works inside iframes and complex editor contexts</li>
</ul>

<h3><strong>Local, Unlimited Storage</strong></h3>
<ul>
  <li>Saves all snippets using <code>chrome.storage.local</code></li>
  <li>No upload, sync, cloud storage, or external servers</li>
  <li>Unlimited snippet capacity</li>
</ul>

<hr>

<h2><strong>🚀 Installation (Before Chrome Web Store Release)</strong></h2>

<ol>
  <li>Download or clone this repository.</li>
  <li>Open <code>chrome://extensions/</code></li>
  <li>Enable <strong>Developer Mode</strong></li>
  <li>Select <strong>Load unpacked</strong></li>
  <li>Choose the <code>laylas-snips/</code> directory</li>
</ol>

<p>The extension activates instantly—no build step required.</p>

<hr>

<h2><strong>🛠 How to Use</strong></h2>

<ol>
  <li>Open the extension’s <strong>Options</strong> page.</li>
  <li>Create a new snippet:
    <ul>
      <li><strong>Trigger:</strong> the keyword after the backslash (ex: <code>greeting-email</code>)</li>
      <li><strong>Handle:</strong> a readable display name (optional)</li>
      <li><strong>Body:</strong> the snippet content (plain or rich text)</li>
    </ul>
  </li>
  <li>Type your trigger anywhere using:
    <pre><code>\greeting-email</code></pre>
  </li>
</ol>

<h3>Compatible with:</h3>
<ul>
  <li>Gmail & major webmail platforms</li>
  <li>Customer relationship systems</li>
  <li>Documentation tools</li>
  <li>Web forms and textareas</li>
  <li>contentEditable editors</li>
  <li>Most modern web applications</li>
</ul>

<hr>

<h2><strong>🌌 Formatting Engine Details</strong></h2>
<ul>
  <li><code>&lt;div&gt;</code> and <code>&lt;p&gt;</code> → converted into clean line breaks</li>
  <li><code>&lt;br&gt;</code> → preserved as expected</li>
  <li>HTML stripped automatically in plain-text fields</li>
  <li>Styling preserved in rich-text editors</li>
  <li>Ensures predictable output across different websites and editors</li>
</ul>

<hr>

<h2><strong>📄 Privacy & Security</strong></h2>
<p><strong>Layla’s Snips collects no data.</strong> All information is stored locally on your device via Chrome’s storage system.</p>

<ul>
  <li>No keystroke collection</li>
  <li>No analytics, tracking, or logging</li>
  <li>No external server contact</li>
  <li>No cookies or third-party scripts</li>
</ul>

<p>Full privacy policy:<br>
<a href="https://layla-verse.github.io/laylas-snips/privacy-policy.html">https://layla-verse.github.io/laylas-snips/privacy-policy.html</a></p>

<hr>

<h2><strong>🪐 About the Laylaverse</strong></h2>
<p>
The Laylaverse is an independent software identity focused on creating lightweight, reliable tools that streamline digital workflows. 
Layla’s Snips is the first public utility in this expanding ecosystem.
</p>

<hr>

<h2><strong>📬 Contact</strong></h2>
<p>Email: <strong>laylaverse.dev@gmail.com</strong></p>

<hr>

<h2><strong>⭐ Roadmap</strong></h2>
<ul>
  <li>Optional cloud sync</li>
  <li>Public snippet libraries</li>
  <li>Chrome Web Store release</li>
  <li>Firefox compatibility</li>
  <li>Additional Laylaverse productivity tools</li>
</ul>
