# Lottie Converter Extension

A Chrome extension that allows you to easily download Lottie animations from any webpage that uses `<dotlottie-player>` elements. Convert .lottie files to JSON format and download animations with a single click.

## Features

- Automatically detects Lottie animations on webpages
- Provides an intuitive hover interface over Lottie animations
- Download options:
  - Download as JSON format
  - Download as GIF format
- Supports multiple animations on a single page
- Works with dynamic content loading
- High-quality GIF conversion with customizable settings

## Installation

1. Clone this repository or download the source code
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension directory

## Usage

1. Visit any webpage that contains Lottie animations using `<dotlottie-player>`
2. Hover over a Lottie animation to reveal the download buttons
3. Choose your preferred download format:
   - Click "Download JSON" to get the raw Lottie animation data
   - Click "Download GIF" to convert and download as an animated GIF

## Technical Details

The extension works by:
- Injecting a content script that monitors the page for Lottie animations
- Creating an overlay UI for each detected animation
- Processing .lottie files through JSZip for JSON extraction
- Converting animations to GIF using a custom worker implementation

## Browser Compatibility

Currently supports:
- Google Chrome
- Chromium-based browsers (Edge, Brave, etc.)

## Development

### Project Structure 