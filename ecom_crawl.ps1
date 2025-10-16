param(
  [string]$Base = 'https://ecom-demo.workdo.io'
)
$ProgressPreference='SilentlyContinue'
$ErrorActionPreference='Stop'

function Get-HtmlContent {
  param([string]$Url, [Microsoft.PowerShell.Commands.WebRequestSession]$Session)
  try {
    $resp = Invoke-WebRequest -Uri $Url -WebSession $Session -UseBasicParsing -ErrorAction Stop
    return $resp.Content
  } catch {
    try {
      Start-Sleep -Milliseconds 300
      $resp = Invoke-WebRequest -Uri $Url -WebSession $Session -UseBasicParsing -ErrorAction Stop
      return $resp.Content
    } catch {
      return $null
    }
  }
}

function Get-Text {
  param([string]$Html)
  if (-not $Html) { return '' }
  $t = [regex]::Replace($Html, '<script[\s\S]*?</script>', '', 'IgnoreCase')
  $t = [regex]::Replace($t, '<style[\s\S]*?</style>', '', 'IgnoreCase')
  $t = [regex]::Replace($t, '<[^>]+>', ' ')
  try { $t = [System.Net.WebUtility]::HtmlDecode($t) } catch { }
  return ($t -replace '\s+', ' ').Trim()
}

function Parse-Title {
  param([string]$Html)
  if (-not $Html) { return $null }
  $m = [regex]::Match($Html, '<title[^>]*>([\s\S]*?)</title>', 'IgnoreCase')
  if ($m.Success) { return (Get-Text $m.Groups[1].Value) }
  $m = [regex]::Match($Html, '<h1[^>]*>([\s\S]*?)</h1>', 'IgnoreCase')
  if ($m.Success) { return (Get-Text $m.Groups[1].Value) }
  $m = [regex]::Match($Html, '<h2[^>]*>([\s\S]*?)</h2>', 'IgnoreCase')
  if ($m.Success) { return (Get-Text $m.Groups[1].Value) }
  return $null
}

function Parse-Tables {
  param([string]$Html)
  $tables = @()
  if (-not $Html) { return $tables }
  $tMatches = [regex]::Matches($Html, '<table[\s\S]*?</table>', 'IgnoreCase')
  foreach ($tm in $tMatches) {
    $tableHtml = $tm.Value
    $ths = [regex]::Matches($tableHtml, '<th[^>]*>([\s\S]*?)</th>', 'IgnoreCase') | ForEach-Object { (Get-Text $_.Groups[1].Value) } | Where-Object { $_ }
    if (-not $ths -or $ths.Count -eq 0) {
      $firstRow = [regex]::Match($tableHtml, '<tr[^>]*>([\s\S]*?)</tr>', 'IgnoreCase')
      if ($firstRow.Success) {
        $ths = [regex]::Matches($firstRow.Groups[1].Value, '<t[dh][^>]*>([\s\S]*?)</t[dh]>', 'IgnoreCase') | ForEach-Object { (Get-Text $_.Groups[1].Value) } | Where-Object { $_ }
      }
    }
    $tables += [PSCustomObject]@{ Headers = ($ths | Select-Object -Unique) }
  }
  return $tables
}

function Parse-Forms {
  param([string]$Html)
  $forms = @()
  if (-not $Html) { return $forms }
  $fMatches = [regex]::Matches($Html, '<form[\s\S]*?</form>', 'IgnoreCase')
  foreach ($fm in $fMatches) {
    $fHtml = $fm.Value
    $action = ([regex]::Match($fHtml, 'action=\"([^\"]*)\"', 'IgnoreCase').Groups[1].Value)
    $method = ([regex]::Match($fHtml, 'method=\"([^\"]*)\"', 'IgnoreCase').Groups[1].Value)
    if (-not $method) { $method = 'GET' }
    $inputs = @()
    $iMatches = [regex]::Matches($fHtml, '<input[^>]*>', 'IgnoreCase')
    foreach ($im in $iMatches) {
      $iHtml = $im.Value
      $name = ([regex]::Match($iHtml, 'name=\"([^\"]*)\"', 'IgnoreCase').Groups[1].Value)
      $id = ([regex]::Match($iHtml, 'id=\"([^\"]*)\"', 'IgnoreCase').Groups[1].Value)
      $type = ([regex]::Match($iHtml, 'type=\"([^\"]*)\"', 'IgnoreCase').Groups[1].Value)
      if (-not $type) { $type = 'text' }
      $label = ''
      if ($id) {
        $lm = [regex]::Match($fHtml, '<label[^>]*for=\"' + [regex]::Escape($id) + '\"[^>]*>([\s\S]*?)</label>', 'IgnoreCase')
        if ($lm.Success) { $label = (Get-Text $lm.Groups[1].Value) }
      }
      if (-not $label) {
        $group = [regex]::Match($fHtml, '(<div[^>]*class=\"[^\"]*form-group[^\"]*\"[^>]*>[\s\S]*?' + [regex]::Escape($iHtml) + '[\s\S]*?</div>)', 'IgnoreCase')
        if ($group.Success) {
          $lm2 = [regex]::Match($group.Groups[1].Value, '<label[^>]*>([\s\S]*?)</label>', 'IgnoreCase')
          if ($lm2.Success) { $label = (Get-Text $lm2.Groups[1].Value) }
        }
      }
      $inputs += [PSCustomObject]@{ Name=$name; Id=$id; Type=$type; Label=$label }
    }
    $selects = @()
    $sMatches = [regex]::Matches($fHtml, '<select[^>]*name=\"([^\"]*)\"[^>]*>([\s\S]*?)</select>', 'IgnoreCase')
    foreach ($sm in $sMatches) {
      $sname = $sm.Groups[1].Value
      $optMatches = [regex]::Matches($sm.Groups[2].Value, '<option[^>]*value=\"([^\"]*)\"[^>]*>([\s\S]*?)</option>', 'IgnoreCase')
      $opts = @()
      foreach ($om in $optMatches) { $opts += (Get-Text $om.Groups[2].Value) }
      $selects += [PSCustomObject]@{ Name=$sname; Options=($opts | Select-Object -Unique) }
    }
    $textareas = @()
    $tMatches = [regex]::Matches($fHtml, '<textarea[^>]*name=\"([^\"]*)\"[^>]*>([\s\S]*?)</textarea>', 'IgnoreCase')
    foreach ($tm in $tMatches) {
      $textareas += [PSCustomObject]@{ Name=$tm.Groups[1].Value; Label=''; }
    }
    $forms += [PSCustomObject]@{ Action=$action; Method=$method.ToUpper(); Inputs=$inputs; Selects=$selects; Textareas=$textareas }
  }
  return $forms
}

function Parse-Actions {
  param([string]$Html)
  $acts = @()
  if (-not $Html) { return $acts }
  $aMatches = [regex]::Matches($Html, '<a[^>]*href=\"([^\"]*)\"[^>]*>([\s\S]*?)</a>', 'IgnoreCase')
  foreach ($am in $aMatches) {
    $href=$am.Groups[1].Value.Trim(); $txt=(Get-Text $am.Groups[2].Value)
    if ($txt -match '(?i)\b(create|add|edit|delete|remove|update|save|export|import|view|assign|refund|approve|reject)\b') {
      $acts += [PSCustomObject]@{ Type='link'; Text=$txt; Href=$href }
    }
  }
  $bMatches = [regex]::Matches($Html, '<button[^>]*>([\s\S]*?)</button>', 'IgnoreCase')
  foreach ($bm in $bMatches) {
    $txt=(Get-Text $bm.Groups[1].Value)
    if ($txt -match '(?i)\b(create|add|edit|delete|remove|update|save|export|import|view|assign|refund|approve|reject|login|submit)\b') {
      $acts += [PSCustomObject]@{ Type='button'; Text=$txt; Href='' }
    }
  }
  return $acts
}

function Normalize-Url {
  param([string]$Url, [string]$Base)
  if (-not $Url) { return $null }
  $u = $Url.Trim()
  if ($u -match '^#?$') { return $null }
  if ($u.StartsWith(' ')) { $u = $u.Trim() }
  if ($u.StartsWith('/')) { return $Base + $u }
  if ($u -notmatch '^https?://') { return $Base.TrimEnd('/') + '/' + $u.TrimStart('/') }
  return $u
}

function Is-AssetUrl {
  param([string]$Url)
  return $Url -match '\\.(png|jpg|jpeg|gif|svg|css|js|ico|woff|woff2|ttf)(\\?|$)'
}

# 1) Login session
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$loginHtml = (Invoke-WebRequest -Uri "$Base/login" -WebSession $session -UseBasicParsing).Content
$csrf = ([regex]::Match($loginHtml, 'name=\"_token\"\s+value=\"([^\"]+)', 'IgnoreCase').Groups[1].Value)
if (-not $csrf) { $csrf = ([regex]::Match($loginHtml, 'meta name=\"csrf-token\"\s+content=\"([^\"]+)', 'IgnoreCase').Groups[1].Value) }
$body = @{ email='admin@example.com'; password='1234'; _token=$csrf }
$headers = @{ 'Content-Type'='application/x-www-form-urlencoded'; 'Referer'="$Base/login" }
Invoke-WebRequest -Uri "$Base/login" -Method Post -WebSession $session -Headers $headers -Body $body -UseBasicParsing | Out-Null

# 2) Seed URLs
$seed = @()
if (Test-Path tmp_dashboard_pages.txt) { $seed += Get-Content tmp_dashboard_pages.txt }
$seed += "$Base/dashboard"
$seed = $seed | Where-Object { $_ -and ($_ -match "^$([regex]::Escape($Base))") } | Sort-Object -Unique

# 3) Crawl
$visited = New-Object System.Collections.Generic.HashSet[string]
$queue = New-Object System.Collections.Generic.Queue[string]
foreach ($u in $seed) { if (-not $visited.Contains($u)) { $queue.Enqueue($u) } }

$results = @()
$maxPages = 200
while ($queue.Count -gt 0 -and $visited.Count -lt $maxPages) {
  $url = $queue.Dequeue()
  if ($visited.Contains($url)) { continue }
  $visited.Add($url) | Out-Null
  Write-Host "Fetching $url"
  $html = Get-HtmlContent -Url $url -Session $session
  if (-not $html) { continue }
  $pathSafe = ($url -replace '[^a-zA-Z0-9\-]+', '_').Trim('_')
  $htmlPath = Join-Path 'audit' ("$pathSafe.html")
  $html | Set-Content -Encoding UTF8 $htmlPath
  $title = Parse-Title $html
  $tables = Parse-Tables $html
  $forms = Parse-Forms $html
  $actions = Parse-Actions $html

  # discover links
  $links = [regex]::Matches($html, '<a[^>]+href=\"([^\"]+)\"', 'IgnoreCase') | ForEach-Object { $_.Groups[1].Value }
  foreach ($lnk in $links) {
    $n = Normalize-Url $lnk $Base
    if (-not $n) { continue }
    if ($n -notmatch "^$([regex]::Escape($Base))") { continue }
    if (Is-AssetUrl $n) { continue }
    if ($n -match '/logout|/change-language|/change-store|/uploads/') { continue }
    if (-not $visited.Contains($n) -and ($queue -notcontains $n)) { $queue.Enqueue($n) }
  }

  $results += [PSCustomObject]@{
    Url=$url; Title=$title; Html=$htmlPath; Tables=$tables; Forms=$forms; Actions=$actions
  }
}

# 4) Save JSON summary
$summaryPath = 'audit/summary.json'
$results | ConvertTo-Json -Depth 6 | Set-Content -Encoding UTF8 $summaryPath

# 5) Build SRS Markdown
$srs = @()
$srs += "# EcommerceGo Admin SRS"
$srs += "Generated: $(Get-Date -Format s)"
$srs += ""
$srs += "## Overview"
$srs += "This document captures pages, data attributes, and actions discovered by crawling the authenticated dashboard."
$srs += ""
$srs += "## Actors"
$srs += "- Super Admin (platform)"
$srs += "- Store Admin"
$srs += "- Staff (Roles/Users)"
$srs += "- Delivery Boy"
$srs += "- Customer (referenced in admin)"
$srs += ""
$srs += "## Sitemap"
foreach ($r in $results | Sort-Object Url) { $srs += "- $($r.Url) — $($r.Title)" }
$srs += ""
$srs += "## Pages"
foreach ($r in $results | Sort-Object Url) {
  $srs += "### $($r.Title)"
  $srs += "- URL: $($r.Url)"
  # Tables
  if ($r.Tables -and $r.Tables.Count -gt 0) {
    $srs += "- Tables:"
    $i=1
    foreach ($t in $r.Tables) {
      if ($t.Headers -and $t.Headers.Count -gt 0) {
        $srs += "  - Table $i headers: $(($t.Headers -join ', '))"
      }
      $i++
    }
  }
  # Forms
  if ($r.Forms -and $r.Forms.Count -gt 0) {
    $srs += "- Forms:"
    foreach ($f in $r.Forms) {
      $srs += "  - Action: $($f.Action) Method: $($f.Method)"
      if ($f.Inputs.Count -gt 0) {
        foreach ($inp in $f.Inputs) { $srs += "    - [$($inp.Type)] $($inp.Name) — $($inp.Label)" }
      }
      if ($f.Selects.Count -gt 0) {
        foreach ($sel in $f.Selects) { $srs += "    - [select] $($sel.Name) — options: $(($sel.Options -join ', '))" }
      }
      if ($f.Textareas.Count -gt 0) {
        foreach ($ta in $f.Textareas) { $srs += "    - [textarea] $($ta.Name)" }
      }
    }
  }
  # Actions
  if ($r.Actions -and $r.Actions.Count -gt 0) {
    $srs += "- Actions:"
    foreach ($a in $r.Actions | Sort-Object Text -Unique) { $srs += "  - $($a.Type): $($a.Text) ($($a.Href))" }
  }
  $srs += ""
}

$srs += "## Business Logic (Inferred)"
$srs += "- Product catalog management: brands, labels, categories, attributes, products."
$srs += "- Order lifecycle: create order (front), manage order, refunds, status updates, shipping."
$srs += "- Customer management: profiles, reports, wishlist."
$srs += "- Marketing: coupons, flash sales, newsletters, blog, pages, menus, testimonials, FAQs."
$srs += "- Shipping: classes and zones."
$srs += "- Access control: roles and users."
$srs += "- Reports: sales by product/category/brand/country/status, top sales, stock."
$srs += "- POS interface for in-store sales."
$srs += ""
$srs += "## User Stories"
$srs += "- As a Store Admin, I can create and manage products (with brands, labels, attributes) so customers can purchase them."
$srs += "- As a Store Admin, I can configure shipping classes and zones to calculate delivery costs."
$srs += "- As Staff, I can manage orders and process refunds to handle post-purchase changes."
$srs += "- As a Store Admin, I can manage customers and view customer reports to analyze behavior."
$srs += "- As a Marketer, I can set coupons, flash sales, and manage content (blog, pages, menus) to drive engagement."
$srs += "- As an Auditor, I can access reports (sales, stock, status) to understand performance."
$srs += "- As an Owner, I can manage roles and users to control permissions."
$srs += "- As a Delivery Boy, I can view assigned deliveries (via Delivery Boy module)."
$srs += ""
$srs += "## Database Schema (Inferred)"
$srs += "Note: Based on UI pages and forms; actual schema may differ."
$srs += ""
$srs += "```mermaid"
$srs += "erDiagram"
$srs += "  USER ||--o{ ROLE_USER : assigns"
$srs += "  ROLE ||--o{ ROLE_USER : contains"
$srs += "  USER { int id string name string email string password }"
$srs += "  ROLE { int id string name }"
$srs += "  CUSTOMER { int id string name string email string phone }"
$srs += "  BRAND { int id string name }"
$srs += "  LABEL { int id string name color }"
$srs += "  CATEGORY { int id string name int parent_id }"
$srs += "  PRODUCT ||--o{ PRODUCT_ATTRIBUTE_VALUE : has"
$srs += "  PRODUCT ||--o{ PRODUCT_IMAGE : has"
$srs += "  PRODUCT ||--o{ ORDER_ITEM : sold_in"
$srs += "  CATEGORY ||--o{ PRODUCT : classifies"
$srs += "  BRAND ||--o{ PRODUCT : brands"
$srs += "  LABEL ||--o{ PRODUCT : labels"
$srs += "  PRODUCT { int id string name text description decimal price int brand_id int category_id }"
$srs += "  PRODUCT_ATTRIBUTE { int id string name }"
$srs += "  PRODUCT_ATTRIBUTE_VALUE { int id int product_id int attribute_id string value }"
$srs += "  PRODUCT_IMAGE { int id int product_id string path }"
$srs += "  ORDER ||--o{ ORDER_ITEM : contains"
$srs += "  CUSTOMER ||--o{ ORDER : places"
$srs += "  ORDER { int id int customer_id decimal total string status int shipping_address_id }"
$srs += "  ORDER_ITEM { int id int order_id int product_id int qty decimal price }"
$srs += "  SHIPPING_CLASS { int id string name }"
$srs += "  SHIPPING_ZONE { int id string name }"
$srs += "  COUPON { int id string code decimal discount string type datetime valid_from datetime valid_to }"
$srs += "  WISHLIST { int id int customer_id int product_id }"
$srs += "  REFUND_REQUEST { int id int order_id int order_item_id string reason string status }"
$srs += "  BLOG_POST { int id string title text content int category_id datetime published_at }"
$srs += "  BLOG_CATEGORY { int id string name }"
$srs += "  PAGE { int id string title text content }"
$srs += "  MENU { int id string name }"
$srs += "  TESTIMONIAL { int id string author text content int rating }"
$srs += "  SUPPORT_TICKET { int id int customer_id string subject text message string status }"
$srs += "```
"
$srs += ""
$srs += "## Non-Functional Requirements"
$srs += "- Security: CSRF protection, role-based access control, secure session cookies."
$srs += "- Localization: language switcher indicates multi-language support."
$srs += "- Performance: reporting and list pages should paginate."
$srs += "- Availability: SaaS multi-store support; store switcher present."
$srs += ""
$srs += "## Notes & Caveats"
$srs += "- Attributes and schema are inferred from visible forms/tables and may not reflect the complete backend."
$srs += "- Some pages require specific context or IDs (e.g., order view) and were captured as examples only."

$srsPath = 'docs/EcommerceGo_SRS.md'
$srs | Set-Content -Encoding UTF8 $srsPath
"Wrote: $srsPath and $summaryPath" | Write-Host
