# 📦 Publishing Guide for Slack Browser MCP Server

## 📋 Pre-publish Checklist

✅ **Package.json Updated** - Added bin, keywords, proper description, MIT license
✅ **Build Artifacts Ready** - TypeScript compiled to dist/
✅ **Shebang Line Present** - dist/index.js has #!/usr/bin/env node
✅ **.npmignore Created** - Excludes dev files, only includes necessary files
✅ **Package Size Optimized** - 117.2 kB (down from 933.4 kB)

## 🚀 Steps to Publish to NPM

### Step 1: Create NPM Account (if needed)

```bash
# Visit https://www.npmjs.com/signup
# Create account with username: phuc-nt (or your preferred username)
```

### Step 2: Login to NPM

```bash
npm login
# Enter your npmjs.com credentials
```

### Step 3: Check Package Name Availability

```bash
# Check if package name is available
npm view slack-browser-mcp-server

# If name is taken, you can use scoped package:
# Change package.json name to: "@phuc-nt/slack-browser-mcp-server"
```

### Step 4: Test Package Locally (DONE)

```bash
# ✅ Already completed
npm pack
# Creates: slack-browser-mcp-server-1.0.0.tgz
```

### Step 5: Publish to NPM

```bash
# For unscoped package (if name is available)
npm publish

# OR for scoped package (if name is taken)
# First update package.json name to "@phuc-nt/slack-browser-mcp-server"
npm publish --access public
```

### Step 6: Verify Publication

```bash
# Check if package is published
npm view slack-browser-mcp-server
# OR
npm view @phuc-nt/slack-browser-mcp-server
```

## 📝 Installation Instructions for Users

After publishing, users can install your package:

### For Unscoped Package:

```bash
npm install -g slack-browser-mcp-server

# Then use in your MCP client config (Claude Desktop, Cline, Cursor, etc.):
# "command": "node",
# "args": ["slack-browser-mcp-server"]
```

### For Scoped Package:

````bash
npm install -g @phuc-nt/slack-browser-mcp-server

# Then use in your MCP client config (Claude Desktop, Cline, Cursor, etc.):
# "command": "node",
# "args": ["@phuc-nt/slack-browser-mcp-server"]
```## 🔄 Updating the Package

For future updates:

1. **Update version in package.json:**

   ```bash
   npm version patch   # 1.0.0 -> 1.0.1
   npm version minor   # 1.0.0 -> 1.1.0
   npm version major   # 1.0.0 -> 2.0.0
````

2. **Rebuild and publish:**
   ```bash
   npm run build
   npm publish
   ```

## 🎯 Next Steps

1. **Execute publish command** (npm publish)
2. **Update INSTALL.md** with npm installation instructions
3. **Update README.md** with npm installation method
4. **Test installation** on a clean system
5. **Create GitHub release** to match npm version

## 🚨 Important Notes

- **Make sure you're logged into npm** before publishing
- **Package name must be unique** unless using scoped packages
- **Version number will be locked** once published (can't republish same version)
- **Consider using npm version commands** to automatically update version and create git tags

Ready to publish! 🚀
