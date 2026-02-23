

## Fix: Article links returning 404 when opened directly

### The Problem
When someone shares a link like `https://www.dominicanews.dm/news/some-article` or opens it in a new tab, the server looks for an actual file at that path. Since no such file exists (it's a route handled by React in the browser), the server returns a 404 error.

Links work when clicked inside the site because navigation happens entirely in the browser without a server request.

### The Fix
Add a single file (`public/_redirects`) that tells the server: "For any URL you don't recognize, just serve the main page and let the app handle it."

### What will be created

**File: `public/_redirects`**
```
/*  /index.html  200
```

This one-line file ensures that every URL — including `/news/some-article-slug` — loads the app, which then displays the correct article.

### After implementation
- Publish the updated site to your custom domain
- All shared article links will work correctly in new tabs and when shared with others
