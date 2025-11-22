# Content Quality Assurance Workflow

## Overview
This workflow provides a systematic, efficient approach to auditing and fixing content quality issues across multiple articles. It uses Python scripts for issue detection, categorizes problems by severity, and fixes them systematically.

## Workflow Steps

### 1. Issue Discovery & Categorization

**Create a Python script to scan all articles and identify issues:**

```python
import glob
import re

files = glob.glob('*.mdx')
critical = []
high = []
medium = []

for f in sorted(files):
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Check meta description length
    meta_match = re.search(r'metaDescription:\s*\"([^\"]+)\"', content)
    meta_len = len(meta_match.group(1)) if meta_match else 0
    
    # Count images
    images = len(re.findall(r'!\[.*\]\(https://images\.pexels\.com', content))
    
    # Count components
    total_components = len(re.findall(r'<HotelGrid|<ArticleBookingWidget', content))
    
    # Count internal links
    internal_links = len(re.findall(r'\[.*\]\(/blog/|\[.*\]\(/lodging|\[.*\]\(/places-to-stay', content))
    
    # Check for hardcoded dates
    hardcoded_dates = len(re.findall(r'checkIn=\"2025-|checkOut=\"2025-', content))
    
    # Check for end widget
    has_end_widget = '<ArticleBookingWidget' in content[-500:]
    
    # Categorize issues
    if meta_len > 150:
        critical.append(f'{f}: Meta {meta_len} chars')
    if hardcoded_dates > 0:
        critical.append(f'{f}: {hardcoded_dates} hardcoded dates')
    if total_components < 3:
        high.append(f'{f}: {total_components} components')
    if images < 5:
        high.append(f'{f}: {images} images')
    if not has_end_widget and '<ArticleBookingWidget' not in content:
        high.append(f'{f}: Missing end widget')
    if internal_links < 5:
        medium.append(f'{f}: {internal_links} links')
```

**Key Principles:**
- Use regex patterns to find specific issues
- Categorize by severity (Critical = build blockers, High = quality standards, Medium = enhancements)
- Output clear, actionable issue lists

### 2. Priority-Based Fixing

**Fix in order:**
1. **Critical** - Issues that break builds or violate hard requirements
   - Meta descriptions >150 chars (build failures)
   - Hardcoded dates (maintenance issues)
   - Missing required components

2. **High** - Quality standards that affect user experience
   - Missing ArticleBookingWidget at end
   - Insufficient images (<5)
   - Insufficient components (<3)

3. **Medium** - SEO and content enhancements
   - Internal links (<5)
   - Additional optimization opportunities

### 3. Batch Fixing Strategy

**For similar issues across multiple files:**

1. **Use grep to find all instances:**
   ```bash
   grep -r "pattern" path/
   ```

2. **Read representative files to understand context**

3. **Create search_replace operations** that:
   - Include enough context to make replacements unique
   - Preserve existing formatting
   - Follow existing patterns in the codebase

4. **Apply fixes systematically** - one pattern at a time

### 4. Verification Loops

**After each batch of fixes, run verification:**

```python
# Quick status check
python -c "
import glob
import re
files = glob.glob('*.mdx')
critical = []
high = []
for f in files:
    # ... check logic ...
print(f'CRITICAL: {len(critical)}')
print(f'HIGH: {len(high)}')
"
```

**Benefits:**
- Immediate feedback on progress
- Catch regressions early
- Know when to stop

### 5. Pattern Recognition

**Common patterns to fix:**

- **Hardcoded dates:** `checkIn="2025-XX-XX"` → Remove, use dynamic defaults
- **Missing widgets:** Add `<ArticleBookingWidget>` at end of articles
- **Missing images:** Add landscape images (5-8 per article) with proper alt text
- **Missing links:** Add internal links to related articles using `/blog/[category]/[slug]` format

### 6. Quality Standards Checklist

**For each article, verify:**
- [ ] Meta description ≤150 characters
- [ ] 3+ components (HotelGrid/ArticleBookingWidget)
- [ ] 5-8 landscape images with alt text
- [ ] ArticleBookingWidget at end
- [ ] No hardcoded dates
- [ ] 5-10 internal links (medium priority)
- [ ] Proper frontmatter structure
- [ ] No linter errors

## Tools & Commands

### Python Scripts
- Issue detection and categorization
- Progress tracking
- Final verification

### grep
- Find patterns across files
- Count occurrences
- Identify files needing fixes

### search_replace
- Batch fixes with context
- Preserve formatting
- Ensure uniqueness

### read_file
- Understand context before fixing
- Verify existing patterns
- Check file structure

## Best Practices

1. **Read before writing** - Understand existing patterns
2. **Fix systematically** - One issue type at a time
3. **Verify frequently** - Run checks after each batch
4. **Preserve formatting** - Match existing code style
5. **Use context** - Include enough surrounding text for unique matches
6. **Test incrementally** - Fix a few files, verify, then continue

## Example Workflow Session

```bash
# 1. Discover issues
python audit_script.py > issues.txt

# 2. Fix critical issues first
# (Use search_replace for each critical issue)

# 3. Verify critical fixes
python verify_script.py

# 4. Fix high priority issues
# (Batch similar fixes together)

# 5. Verify high priority fixes
python verify_script.py

# 6. Fix medium priority (optional)
# (Enhancements, not blockers)

# 7. Final verification
python final_check.py

# 8. Commit and push
git add .
git commit -m "QA: Fix all critical and high priority issues"
git push
```

## Success Criteria

**Workflow is complete when:**
- ✅ All critical issues resolved (0)
- ✅ All high priority issues resolved (0)
- ✅ No linter errors
- ✅ All articles meet quality standards
- ✅ Changes committed and pushed

## Notes

- This workflow scales well to large numbers of files
- Python scripts provide fast, accurate issue detection
- Systematic fixing prevents missing issues
- Verification loops catch problems early
- Can be adapted for different content types and standards

