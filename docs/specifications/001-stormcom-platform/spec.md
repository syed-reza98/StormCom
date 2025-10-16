# Feature Specification: StormCom E-commerce SaaS Platform

**Feature Branch**: `001-stormcom-platform`  
**Created**: 2025-10-16  
**Updated**: 2025-10-16  
**Status**: Active Development  
**Project**: StormCom - Multi-Tenant E-commerce Management System

---

## Executive Summary

StormCom is a comprehensive multi-tenant e-commerce SaaS platform enabling businesses to manage online stores, process orders, track inventory, analyze customer behavior, and execute marketing campaigns. Built with Next.js 15, TypeScript 5.9, and Prisma ORM following Spec-Driven Development principles.

### Platform Overview
- **Multi-Tenant Architecture**: Secure data isolation per store
- **148 Pages Analyzed**: Complete feature mapping from demo instance
- **338 Forms**: Comprehensive data entry capabilities  
- **356 Actions**: Full CRUD operations across all modules
- **40+ Database Tables**: Relational schema with referential integrity

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Store Owner Dashboard & Analytics (Priority: P1)

A store owner logs into the admin dashboard to monitor business performance, view real-time metrics, and track key indicators.

**Why this priority**: Core MVP - Store owners need immediate visibility into business operations.

**Independent Test**: Login → View dashboard → Verify metrics display (orders, revenue, customers) → Navigate to Store Analytics → Confirm visitor tracking.

**Acceptance Scenarios**:

1. **Given** I am a logged-in store owner, **When** I access the dashboard, **Then** I see:
   - Current order statistics by status (Pending: X, Confirmed: Y, Shipped: Z, Delivered: W, Cancelled: V)
   - Total revenue for current month
   - Total customers count
   - Total orders count
   - Recent orders list (last 10 orders)

2. **Given** I am on the dashboard, **When** the page loads, **Then** the system:
   - Displays data within 2 seconds (LCP)
   - Shows loading skeletons for async data
   - Updates metrics in real-time

3. **Given** I navigate to Store Analytics, **When** the analytics page loads, **Then** I see:
   - Visitor metrics with chart (last 30 days)
   - Top URLs by pageviews
   - Device breakdown (desktop, mobile, tablet) with percentages
   - Platform statistics (browsers, operating systems)
   - Geographic distribution map

**Business Rules**:
- Dashboard metrics refresh every 5 minutes
- Charts display data for configurable time periods (7 days, 30 days, 90 days, 1 year)
- Analytics data collected only with user consent (GDPR compliant)

---

### User Story 2 - Product Catalog Management (Priority: P1)

A product manager creates, organizes, and maintains the product catalog including variants, categories, brands, attributes, and inventory.

**Why this priority**: Core e-commerce - No products = No sales.

**Independent Test**: Create product → Add variants → Assign categories/brands → Upload images → Set inventory → Publish.

**Acceptance Scenarios**:

1. **Given** I am in Products section, **When** I create a new product, **Then** I provide:
   - Name (required, max 255 characters)
   - Slug (auto-generated from name, unique per store)
   - Description (rich text editor)
   - Price (required, decimal with 2 precision)
   - Sale Price (optional, must be less than regular price)
   - SKU (required, unique per store, alphanumeric)
   - Stock Quantity (required, integer ≥ 0)
   - Stock Status (auto-calculated: In Stock, Out of Stock, Low Stock <10)
   - Category (dropdown, hierarchical selection)
   - Brand (dropdown, with quick-add option)
   - Labels (multi-select: New, Sale, Featured, Best Seller, Limited Edition)
   - Tax Status (Taxable, Non-Taxable)
   - Weight and Dimensions (for shipping calculation)

2. **Given** I have a product, **When** I add product variants, **Then**:
   - I define variant attributes (Size: S/M/L/XL, Color: Red/Blue/Green)
   - Each variant has unique SKU, price, sale price, stock quantity
   - Variant combinations are automatically generated
   - I can enable/disable specific variant combinations
   - Images can be assigned to specific variants

3. **Given** I manage categories, **When** I create category hierarchy, **Then**:
   - I can create parent categories (e.g., "Electronics")
   - I can create child categories (e.g., "Electronics > Phones")
   - Categories have slug, description, icon, sort order
   - I can assign multiple categories to one product
   - System supports unlimited nesting levels

4. **Given** I manage brands, **When** I create a brand, **Then**:
   - Brand has name, slug, logo image, description
   - Logo supports PNG, JPG, WebP formats (max 2MB)
   - Brand can be marked as "Popular" for homepage display
   - Products can filter by brand

5. **Given** I have products, **When** I add product attributes, **Then**:
   - I define attribute types (Select, Multi-select, Text, Color, Image)
   - Examples: Material (Cotton, Polyester), Size Chart URL, Care Instructions
   - Attributes are used for filtering on storefront
   - Attributes are stored as JSON for flexibility

6. **Given** I manage product images, **When** I upload images, **Then**:
   - I can upload multiple images (max 10 per product)
   - Supported formats: JPG, PNG, WebP
   - Max file size: 5MB per image
   - Images are automatically optimized and resized
   - I can set one image as primary (thumbnail)
   - I can reorder images via drag-and-drop
   - Images are stored in CDN for fast delivery

**Business Rules**:
- SKU must be unique within store
- Slug must be URL-safe and unique within store
- Price must be positive number
- Sale price must be less than regular price
- Stock quantity cannot be negative
- Product deletion is soft delete (sets deleted_at)
- Low stock threshold is 10 units (configurable in settings)

**Edge Cases**:
- What happens when creating product with duplicate SKU? → Error message, prevent save
- What happens when stock reaches zero during checkout? → Prevent purchase, show "Out of Stock"
- Can product have no category? → Yes, but must have at least one category for storefront
- What happens when category is deleted with products? → Products retain category reference (soft delete)

---

### User Story 3 - Order Management & Fulfillment (Priority: P1)

A staff member processes orders through their complete lifecycle: placement → confirmation → shipment → delivery, including refunds.

**Why this priority**: Core operational requirement - Order fulfillment is the business purpose.

**Independent Test**: View order → Update status → Generate invoice → Process refund.

**Acceptance Scenarios**:

1. **Given** I am in Orders section, **When** I view the orders list, **Then** I see:
   - Order Number (e.g., ORD-2025-00001)
   - Order Date
   - Customer Name (clickable to profile)
   - Total Amount
   - Payment Status (Pending, Paid, Failed, Refunded)
   - Order Status (Pending, Confirmed, Shipped, Delivered, Cancelled)
   - Actions (View, Edit, Print Invoice, Track)
   - Filters: By Status, Date Range, Customer, Payment Status
   - Search: By Order Number, Customer Email, Customer Name
   - Pagination: 10/25/50/100 orders per page

2. **Given** I view an order, **When** the order details page loads, **Then** I see:
   - **Customer Information**: Name, Email, Phone, Billing Address, Shipping Address
   - **Order Items**: Product name/image, SKU, Variant, Quantity, Unit Price, Total
   - **Order Totals**: Subtotal, Tax, Shipping Cost, Discount (if coupon applied), Grand Total
   - **Order Timeline**: Order Placed, Payment Received, Confirmed, Shipped, Delivered (with timestamps)
   - **Payment Information**: Method, Transaction ID, Status
   - **Shipping Information**: Method, Tracking Number, Carrier, Estimated Delivery
   - **Internal Notes**: Private notes for staff (not visible to customer)
   - **Status Change History**: Who changed status, when, and any notes

3. **Given** I have a pending order, **When** I update status to Confirmed, **Then**:
   - Inventory is automatically deducted for each item
   - Customer receives email confirmation with order details
   - Order moves to "Confirmed" section in dashboard
   - Payment status is verified before confirmation
   - If payment pending, show warning before confirming

4. **Given** I have a confirmed order, **When** I update status to Shipped, **Then**:
   - I enter shipping details: Carrier, Tracking Number, Shipping Date
   - Customer receives email with tracking information
   - Order status changes to "Shipped"
   - Estimated delivery date is calculated (configurable per carrier)
   - System generates packing slip PDF

5. **Given** I have a shipped order, **When** I update status to Delivered, **Then**:
   - Order status changes to "Delivered"
   - Delivery date is recorded
   - Customer receives delivery confirmation email
   - Order is marked as complete
   - Review request email sent after 3 days (configurable)

6. **Given** I have a customer refund request, **When** I review the request, **Then** I see:
   - Refund Request ID
   - Order Number and Items requested for refund
   - Reason for refund (dropdown: Defective, Wrong Item, No Longer Needed, Other)
   - Customer notes/explanation
   - Refund amount requested
   - Request date
   - Actions: Approve, Reject, Request More Info

7. **Given** I approve a refund, **When** I process it, **Then**:
   - Refund amount is credited to customer's original payment method
   - Inventory is restored if product is returned
   - Order status updated to "Refunded" (full) or "Partially Refunded"
   - Customer receives refund confirmation email
   - Finance team is notified
   - Refund appears in accounting reports

**Business Rules**:
- Orders cannot be deleted, only cancelled
- Once shipped, order cannot be cancelled (must process refund)
- Inventory deducted only on "Confirmed" status
- Email notifications sent at each status change
- Order numbers are sequential per store: ORD-{YEAR}-{5-digit-number}
- Refunds must be approved within 7 days (configurable)
- Partial refunds allowed (specific items or custom amount)

**Edge Cases**:
- What if inventory is insufficient when confirming? → Error message, prevent confirmation
- What if payment fails after order placed? → Order stays "Pending", customer notified, auto-cancel after 24 hours
- Can order status go backwards (e.g., Delivered → Shipped)? → No, only forward progression
- What if refund fails? → Mark as "Refund Failed", admin notified, manual intervention required

---

### User Story 4 - Customer Management & CRM (Priority: P2)

A customer service representative manages customer profiles, views purchase history, analyzes behavior, and provides support.

**Why this priority**: Important for retention but can function with basic customer data initially.

**Independent Test**: View customer list → Open profile → See order history → Generate customer report.

**Acceptance Scenarios**:

1. **Given** I am in Customers section, **When** I view the customer list, **Then** I see:
   - Customer ID, Name, Email, Phone
   - Registration Date
   - Total Orders count
   - Total Spent (lifetime value)
   - Last Order Date
   - Status (Active, Inactive)
   - Tags (VIP, Wholesale, Frequent Buyer)
   - Actions (View Profile, Send Email, Add Note)
   - Filters: By Status, Registration Date, Total Spent Range, Tags
   - Search: By Name, Email, Phone
   - Export: CSV, Excel

2. **Given** I view a customer profile, **When** the page loads, **Then** I see:
   - **Personal Information**: Name, Email, Phone, Date of Birth, Gender
   - **Addresses**: List of saved addresses (billing/shipping), with default marked
   - **Order History**: List of all orders (clickable to order details)
   - **Purchase Stats**: Total Orders, Total Spent, Average Order Value, Lifetime Value
   - **Wishlist**: Products in customer's wishlist
   - **Activity Timeline**: Recent activities (orders placed, reviews written, support tickets)
   - **Customer Notes**: Internal notes from staff
   - **Communication History**: Emails sent to customer
   - **Account Status**: Active, Suspended (with reason)
   - **Preferences**: Marketing opt-in status, newsletter subscription

3. **Given** I search for customers, **When** I use filters, **Then** I can filter by:
   - Name (partial match)
   - Email (partial match)
   - Phone (partial match)
   - Registration date range
   - Total spent range
   - Order count range
   - Last order date range
   - Status (Active/Inactive)
   - Tags
   - City, State, Country

4. **Given** I generate customer reports, **When** I select report type, **Then** I see:
   - **Customer Acquisition Report**: New customers per period (daily, weekly, monthly)
   - **Customer Retention Report**: Repeat purchase rate, customer churn
   - **Customer Lifetime Value Report**: Average LTV, LTV by segment
   - **Customer Segmentation Report**: By purchase frequency, by value, by location
   - **Top Customers Report**: Top 10/50/100 by total spent
   - All reports exportable to CSV/Excel/PDF

**Business Rules**:
- Customer email must be unique per store
- Customer deletion is soft delete (GDPR compliance - data retained for legal period)
- Customer can have multiple addresses (one default billing, one default shipping)
- Wishlist items persist across sessions
- Marketing emails only sent if customer opted-in
- Customer account can be suspended (prevents orders but retains data)

---

### User Story 5 - Marketing Campaigns & Promotions (Priority: P2)

A marketing manager creates and manages promotional campaigns including coupons, flash sales, newsletters, and abandoned cart recovery.

**Why this priority**: Important for driving sales but not essential for basic operations.

**Independent Test**: Create coupon → Set up flash sale → Send newsletter → Configure abandoned cart email.

**Acceptance Scenarios**:

1. **Given** I am in Marketing section, **When** I create a coupon, **Then** I provide:
   - Coupon Code (unique, alphanumeric, uppercase)
   - Discount Type (Percentage, Fixed Amount, Free Shipping)
   - Discount Value (numeric)
   - Minimum Purchase Amount (optional, to qualify for coupon)
   - Maximum Discount Amount (for percentage coupons, optional)
   - Valid From date/time
   - Valid To date/time (expiration)
   - Usage Limit per Coupon (total uses, optional)
   - Usage Limit per Customer (how many times one customer can use)
   - Applicable Products (All Products, Specific Products, Specific Categories, Specific Brands)
   - Exclusions (products/categories that cannot use coupon)
   - Auto-apply (checkbox, applies automatically if conditions met)
   - Status (Active, Inactive, Scheduled)

2. **Given** I create a coupon, **When** a customer uses it, **Then**:
   - System validates coupon code
   - System checks if valid date range
   - System checks if usage limit not exceeded
   - System checks if minimum purchase met
   - System checks if applicable to cart items
   - System applies discount to cart total
   - System increments usage count
   - System records usage per customer

3. **Given** I set up a flash sale, **When** I configure it, **Then** I provide:
   - Flash Sale Name
   - Start Date/Time
   - End Date/Time
   - Discount Percentage (applies to selected products)
   - Selected Products (multi-select from product list)
   - Badge Text (e.g., "FLASH SALE", "50% OFF")
   - Badge Color
   - Display Countdown Timer (yes/no)
   - Auto-revert Price (after sale ends, price reverts)
   - Notify Customers (send email to subscribers)

4. **Given** flash sale is active, **When** it's live, **Then**:
   - Selected products show sale price on storefront
   - Original price is crossed out
   - Flash sale badge displayed
   - Countdown timer shows time remaining
   - After end time, prices automatically revert
   - Sale products highlighted on homepage

5. **Given** I have newsletter subscribers, **When** I create a newsletter, **Then**:
   - I write subject line (max 100 characters)
   - I compose content (rich text editor)
   - I select recipients (All Subscribers, Specific Segment, Custom List)
   - I can add product recommendations
   - I can add coupon codes
   - I preview email before sending
   - I can schedule send time or send immediately
   - I can track opens and clicks

6. **Given** I configure abandoned cart recovery, **When** a cart is abandoned, **Then**:
   - System detects cart abandoned after 1 hour (configurable)
   - First email sent after 1 hour (configurable)
   - Second email sent after 24 hours (configurable) with 10% discount
   - Third email sent after 48 hours (configurable) with 15% discount
   - Emails include cart contents with product images
   - One-click cart recovery link
   - Track recovery rate and revenue

**Business Rules**:
- Coupon codes are case-insensitive
- Only one coupon can be applied per order (unless stacking enabled)
- Flash sales cannot overlap for same product
- Newsletter unsubscribe link required in every email (CAN-SPAM compliance)
- Abandoned cart emails only sent if customer is registered or provided email
- Marketing emails respect opt-out preferences

---

### User Story 6 - Comprehensive Reporting & Analytics (Priority: P2)

A business analyst generates reports to understand sales performance, inventory levels, customer behavior, and business trends.

**Why this priority**: Important for business intelligence but operations can function without detailed reports initially.

**Independent Test**: Navigate to Reports → Select report type → Apply filters → Generate → Export.

**Acceptance Scenarios**:

1. **Given** I am in Reports section, **When** I view available reports, **Then** I see:
   - Sales Reports (Product, Category, Brand, Time-based)
   - Inventory Reports (Stock levels, Low stock, Out of stock)
   - Customer Reports (Acquisition, Retention, Lifetime Value)
   - Order Reports (By status, By location, By payment method)
   - Top Sellers Reports (Products, Categories, Brands)
   - Financial Reports (Revenue, Tax, Shipping)

2. **Given** I generate a Sales Report by Product, **When** I apply filters, **Then**:
   - Date Range (Today, Yesterday, This Week, Last Week, This Month, Last Month, Custom)
   - Product (single or multiple selection)
   - Category filter
   - Brand filter
   - Store filter (for multi-store)
   - **Report Shows**: Product Name, SKU, Units Sold, Gross Sales, Returns, Net Sales, Profit Margin
   - Data can be sorted by any column
   - Data can be exported to CSV, Excel, PDF
   - Visual chart showing sales trend over time

3. **Given** I view Stock Reports, **When** the report loads, **Then** I see:
   - Product Name, SKU, Current Stock, Stock Status, Last Restocked Date
   - Low Stock Alert (products with stock < threshold)
   - Out of Stock products
   - Overstocked products (stock > threshold)
   - Stock Value (quantity × cost price)
   - Reorder suggestions based on sales velocity
   - Filters: By Category, Brand, Stock Status
   - Export options

4. **Given** I generate Customer Reports, **When** I analyze customers, **Then** I see:
   - New Customers by period
   - Returning Customers vs New Customers ratio
   - Customer Retention Rate
   - Average Order Value by customer segment
   - Customer Lifetime Value distribution
   - Top Customers by total spent
   - Customer Geographic Distribution
   - Customer Acquisition Cost (if marketing spend tracked)

5. **Given** I view Top Sales Reports, **When** I see rankings, **Then**:
   - Top 10/50/100 Products by revenue
   - Top 10/50/100 Products by units sold
   - Top Categories by revenue
   - Top Brands by revenue
   - Best-selling product combinations (frequently bought together)
   - Trending products (sales increasing)

6. **Given** I view Country-based Order Reports, **When** I analyze geography, **Then** I see:
   - Orders count by country
   - Revenue by country
   - Average order value by country
   - Map visualization
   - Top cities within countries
   - Export to analyze international markets

**Business Rules**:
- Reports generated on-demand (not real-time, may have 5-min delay)
- Large reports (>10,000 rows) exported via async job (email when ready)
- Reports accessible only to users with "View Reports" permission
- Reports show only data from user's assigned store (multi-tenant)
- Historical data retained for minimum 2 years (configurable)

---

### User Story 7 - Content Management (CMS) (Priority: P3)

A content manager creates and maintains website content including pages, blog posts, navigation menus, and FAQs.

**Why this priority**: Important for customer engagement but not critical for core e-commerce operations.

**Independent Test**: Create page → Publish blog post → Build menu → Add FAQ.

**Acceptance Scenarios**:

1. **Given** I am in CMS section, **When** I create a custom page, **Then**:
   - I provide Page Title
   - I provide Slug (auto-generated, editable)
   - I write content in rich text editor (with image upload, tables, links)
   - I set Meta Title (SEO)
   - I set Meta Description (SEO)
   - I set Page Template (Full Width, Sidebar Left, Sidebar Right, Custom)
   - I set Status (Published, Draft, Scheduled)
   - I set Publish Date/Time (for scheduled)
   - I preview before publishing
   - Page appears at /pages/{slug}

2. **Given** I manage blog, **When** I create a blog post, **Then**:
   - I provide Title
   - I provide Slug
   - I write content (rich text with code blocks, embeds)
   - I select Category
   - I add Tags (multi-select, create new tags)
   - I upload Featured Image
   - I set Excerpt (brief summary)
   - I set Author (dropdown of staff users)
   - I enable/disable Comments
   - I set SEO metadata
   - I set Status and Publish Date
   - Post appears at /blog/{slug}

3. **Given** I manage navigation menus, **When** I create/edit a menu, **Then**:
   - I select Menu Location (Header, Footer, Sidebar, Mobile)
   - I add Menu Items:
     - Link Type (Page, Category, Product, Custom URL, Blog)
     - Link Text
     - Parent Item (for dropdowns)
     - CSS Class (for styling)
     - Open in New Tab (checkbox)
     - Icon (optional)
   - I reorder items via drag-and-drop
   - I create nested menus (unlimited levels)
   - Menu reflects immediately on storefront

4. **Given** I manage FAQs, **When** I add questions, **Then**:
   - I provide Question text
   - I provide Answer (rich text)
   - I set Sort Order (for display sequence)
   - I set Category (General, Shipping, Returns, Payments, Products)
   - I set Status (Active/Inactive)
   - FAQs display on /faqs page grouped by category
   - Search functionality on FAQ page

5. **Given** I handle contact form submissions, **When** I view contacts, **Then** I see:
   - Submission Date/Time
   - Name, Email, Subject, Message
   - Status (New, Read, Replied, Closed)
   - Actions (Reply, Mark as Read, Archive)
   - When I reply, email sent from store email address
   - Submission marked as Replied

**Business Rules**:
- Page slugs must be unique per store
- Draft content not visible on storefront
- Scheduled content publishes automatically at set time
- Deleted pages return 404 (soft delete in database)
- Blog comments require approval before displaying (optional setting)
- Contact form submissions trigger email notification to admin

---

### User Story 8 - Shipping Configuration (Priority: P3)

A logistics manager configures shipping options including classes, zones, and rates for accurate shipping cost calculation.

**Why this priority**: Important for accurate pricing but can use simple flat-rate initially.

**Independent Test**: Create shipping class → Define zone → Set rates → Test calculation.

**Acceptance Scenarios**:

1. **Given** I am in Shipping section, **When** I create shipping classes, **Then**:
   - I define Class Name (e.g., "Standard", "Expedited", "Overnight")
   - I provide Description
   - I assign products to classes
   - Class used for rate calculation

2. **Given** I configure shipping zones, **When** I create a zone, **Then**:
   - I provide Zone Name (e.g., "Domestic", "Europe", "Asia")
   - I select Countries/Regions included in zone
   - I can select specific states/provinces
   - I can define postal code ranges

3. **Given** I have zones and classes, **When** I set rates, **Then**:
   - I select Zone and Class combination
   - I set Rate Type (Flat Rate, Per Item, Weight-Based, Price-Based)
   - I set Rate Amount
   - I set Free Shipping Minimum (optional)
   - I enable/disable the rate
   - Multiple rates can exist per zone (customer chooses at checkout)

4. **Given** customer checks out, **When** shipping is calculated, **Then**:
   - System determines customer's zone from shipping address
   - System determines products' shipping classes
   - System calculates cost based on applicable rates
   - System presents available shipping methods
   - System applies free shipping if minimum met

**Business Rules**:
- At least one shipping zone must be configured
- Default "Rest of World" zone for unmatched addresses
- Shipping cost appears before final checkout step
- Store can offer "Free Shipping" globally (rate = $0)

---

### User Story 9 - Point of Sale (POS) (Priority: P3)

A cashier processes in-store sales through the POS interface with quick product lookup and checkout.

**Why this priority**: Nice to have for omnichannel operations but online sales are primary focus.

**Independent Test**: Open POS → Search products → Add to cart → Apply discount → Process payment.

**Acceptance Scenarios**:

1. **Given** I am at POS terminal, **When** I start a sale, **Then**:
   - I see empty cart
   - I see product search bar
   - I see quick-access product grid (best sellers)
   - I see customer lookup field

2. **Given** I search for products, **When** I type in search, **Then**:
   - Real-time search results (name, SKU)
   - Product thumbnail, name, price, stock
   - Click to add to cart
   - Scan barcode to add (if barcode scanner connected)

3. **Given** I have items in cart, **When** I proceed, **Then**:
   - I see cart summary: product, quantity, price, total
   - I can adjust quantities
   - I can remove items
   - I can apply discount (percentage or fixed)
   - I can apply coupon code
   - I see subtotal, discount, tax, grand total

4. **Given** I complete sale, **When** I process payment, **Then**:
   - I select payment method (Cash, Card, Other)
   - For cash: I enter amount tendered, system calculates change
   - For card: I process card payment (integrated terminal)
   - I print receipt (optional)
   - Order is recorded in system
   - Inventory automatically updated
   - Customer can receive receipt via email

**Business Rules**:
- POS requires "POS Operator" permission
- POS orders marked with source = "POS"
- Cash drawer balance tracked (cash in/out)
- End-of-day report shows cash drawer reconciliation

---

### User Story 10 - Staff & Permissions Management (Priority: P3)

An administrator manages user accounts, roles, and permissions for granular access control.

**Why this priority**: Important for team operations but single admin can operate initially.

**Independent Test**: Create role with permissions → Create user → Assign role → Test access.

**Acceptance Scenarios**:

1. **Given** I am an admin, **When** I create a user role, **Then**:
   - I provide Role Name (e.g., "Sales Manager", "Inventory Clerk")
   - I define permissions per module:
     - Dashboard (View)
     - Products (View, Create, Edit, Delete, Import, Export)
     - Orders (View, Create, Edit, Cancel, Refund)
     - Customers (View, Create, Edit, Delete, Export)
     - Marketing (View, Create, Edit, Delete)
     - Reports (View, Export)
     - CMS (View, Create, Edit, Delete)
     - Settings (View, Edit)
     - Staff (View, Create, Edit, Delete)
   - I save role
   - Role available for assignment

2. **Given** I create user accounts, **When** I add a user, **Then**:
   - I provide Name, Email, Password
   - I assign one or more roles
   - I set Status (Active, Inactive)
   - I assign to specific store (multi-tenant)
   - I save user
   - User receives welcome email with credentials

3. **Given** I have roles defined, **When** users log in, **Then**:
   - Users see only authorized menu items
   - Users can perform only authorized actions
   - Unauthorized access attempts logged
   - API requests also check permissions

4. **Given** I manage delivery personnel, **When** I add delivery boys, **Then**:
   - I provide Name, Phone, Email
   - I provide Vehicle Type, License Plate
   - I set Status (Available, Busy, Offline)
   - I can assign orders to delivery boys
   - Delivery boys get notifications on mobile

**Business Rules**:
- Super Admin role cannot be edited or deleted
- Users must have at least one role
- Password must meet complexity requirements
- Users locked after 5 failed login attempts (unlock by admin or after 30 minutes)
- User deletion is soft delete (retain for audit trail)

---

### User Story 11 - Multi-Store & Theme Management (Priority: P3)

A super admin manages multiple stores with different themes and configurations from a single platform.

**Why this priority**: Advanced feature for scaling but single store works for MVP.

**Independent Test**: Create store → Switch between stores → Customize theme → Activate module.

**Acceptance Scenarios**:

1. **Given** I am a super admin, **When** I create a store, **Then**:
   - I provide Store Name
   - I provide Subdomain (e.g., mystorename.stormcom.com)
   - I assign Owner (user who manages this store)
   - I set Base Currency, Timezone, Country
   - I upload Store Logo
   - I set Default Language
   - Store is created with isolated database context (storeId)

2. **Given** I have multiple stores, **When** I switch stores, **Then**:
   - I see store switcher dropdown in header
   - I select different store
   - Dashboard shows that store's data only
   - All queries filtered by selected storeId
   - Session remembers last selected store

3. **Given** I customize themes, **When** I access theme settings, **Then**:
   - I see available themes (list with previews)
   - I select a theme
   - I customize:
     - Colors (primary, secondary, accent)
     - Typography (fonts)
     - Layout (header style, footer layout)
     - Homepage sections (hero, featured products, categories)
   - I preview changes in real-time
   - I save and publish
   - Storefront reflects changes immediately

4. **Given** I manage add-ons/modules, **When** I activate modules, **Then**:
   - I see available modules (WooCommerce Sync, Shopify Sync, Advanced Analytics, Email Marketing, etc.)
   - I can activate/deactivate per store
   - Module-specific settings appear in Settings section
   - Activated modules add menu items and features

**Business Rules**:
- Each store has isolated data (cannot see other stores' data)
- Super admin can access all stores
- Store owners can only access their assigned store(s)
- Store subdomain must be unique
- Theme changes do not affect other stores
- Modules can have per-store or global configuration

---

## Edge Cases & Error Handling

### Inventory Management
- **Concurrent orders for last item**: Implement optimistic locking, first confirmed order gets item, others notified
- **Negative inventory**: Prevent negative values in DB, show error if stock insufficient
- **Inventory sync delays**: Accept order if sync pending, admin notified if oversold

### Payment Processing
- **Payment gateway timeout**: Retry 3 times, then fail order, notify customer
- **Payment success but order failed**: Refund automatically, log for manual review
- **Partial payments**: Not supported in v1, full payment required

### Multi-Tenancy
- **Cross-store data leak**: All queries MUST include storeId filter (enforced by Prisma middleware)
- **Store deletion**: Archive store, soft delete data, retain for 90 days, then hard delete
- **User belongs to multiple stores**: Session tracks current active store

### Performance
- **Large catalog (100k+ products)**: Implement pagination, search index, lazy loading
- **Slow report generation**: Queue system for heavy reports, email when ready
- **High traffic (1000+ concurrent users)**: Horizontal scaling, CDN, database read replicas

### Data Integrity
- **Orphaned records**: Cascade deletes or set null (depending on relationship)
- **Database migration failure**: Rollback mechanism, test migrations on staging first
- **Data export corruption**: Validate exports, provide retry mechanism

---

## Requirements *(mandatory)*

### Functional Requirements

#### Authentication & Authorization (FR-001 to FR-010)
- **FR-001**: System MUST allow admin login with email and password
- **FR-002**: System MUST implement role-based access control (RBAC) with granular permissions
- **FR-003**: System MUST support secure session management with HTTP-only cookies
- **FR-004**: System MUST provide password reset functionality via email
- **FR-005**: System MUST enforce password complexity (min 8 chars, uppercase, lowercase, number, special char)
- **FR-006**: System MUST lock accounts after 5 failed login attempts
- **FR-007**: System MUST log all authentication events for security audit
- **FR-008**: System MUST support multi-factor authentication (optional)
- **FR-009**: System MUST maintain user session for 24 hours with sliding window
- **FR-010**: System MUST allow single sign-on (SSO) integration for enterprise customers

#### Product Management (FR-011 to FR-030)
- **FR-011**: System MUST allow creation of products with name, description, price, SKU, and inventory
- **FR-012**: System MUST support product variants with individual SKUs, prices, and inventory
- **FR-013**: System MUST allow organizing products into hierarchical categories (unlimited nesting)
- **FR-014**: System MUST support product brands with logos
- **FR-015**: System MUST allow defining product attributes for filtering (size, color, material, etc.)
- **FR-016**: System MUST support product labels (New, Sale, Featured, Best Seller, Limited Edition)
- **FR-017**: System MUST allow uploading multiple product images (max 10, formats: JPG/PNG/WebP, max 5MB each)
- **FR-018**: System MUST support product testimonials and ratings (1-5 stars)
- **FR-019**: System MUST allow product questions and answers (public Q&A)
- **FR-020**: System MUST validate SKU uniqueness within store
- **FR-021**: System MUST validate slug uniqueness within store
- **FR-022**: System MUST auto-generate slug from product name if not provided
- **FR-023**: System MUST support rich text editor for product descriptions
- **FR-024**: System MUST allow bulk product import via CSV
- **FR-025**: System MUST allow bulk product export to CSV
- **FR-026**: System MUST support product duplication for quick creation
- **FR-027**: System MUST optimize and resize product images automatically
- **FR-028**: System MUST support product search by name, SKU, category, brand
- **FR-029**: System MUST display low-stock alerts (threshold: 10 units, configurable)
- **FR-030**: System MUST implement soft delete for products (retain for audit)

#### Inventory Management (FR-031 to FR-040)
- **FR-031**: System MUST track inventory levels per product/variant
- **FR-032**: System MUST automatically deduct inventory on order confirmation
- **FR-033**: System MUST restore inventory on order cancellation
- **FR-034**: System MUST restore inventory on refund (if product returned)
- **FR-035**: System MUST prevent negative inventory
- **FR-036**: System MUST provide low-stock alerts in dashboard
- **FR-037**: System MUST calculate stock status automatically (In Stock/Out of Stock/Low Stock)
- **FR-038**: System MUST prevent order confirmation if insufficient stock
- **FR-039**: System MUST support manual inventory adjustment with reason notes
- **FR-040**: System MUST log all inventory changes with timestamp, user, and reason

#### Order Management (FR-041 to FR-065)
- **FR-041**: System MUST allow viewing all orders with filtering and search
- **FR-042**: System MUST support order status workflow (Pending → Confirmed → Shipped → Delivered)
- **FR-043**: System MUST allow manual order creation by admins
- **FR-044**: System MUST record order history with status changes, user, and timestamp
- **FR-045**: System MUST generate unique order numbers per store (format: ORD-{YEAR}-{5-digit})
- **FR-046**: System MUST calculate order totals (subtotal, tax, shipping, discount)
- **FR-047**: System MUST validate payment status before order confirmation
- **FR-048**: System MUST send email notifications on each status change
- **FR-049**: System MUST generate invoice PDF
- **FR-050**: System MUST generate packing slip PDF
- **FR-051**: System MUST support order cancellation with inventory restoration
- **FR-052**: System MUST handle refund requests with approval workflow
- **FR-053**: System MUST support partial refunds (specific items or custom amount)
- **FR-054**: System MUST validate refund amount ≤ original payment
- **FR-055**: System MUST record refund transactions in accounting
- **FR-056**: System MUST allow internal notes on orders (not visible to customers)
- **FR-057**: System MUST display order timeline with all status changes
- **FR-058**: System MUST support order search by order number, customer name, customer email
- **FR-059**: System MUST support order filtering by status, date range, payment status
- **FR-060**: System MUST support order export to CSV/Excel
- **FR-061**: System MUST prevent order deletion (only cancellation allowed)
- **FR-062**: System MUST support tracking number entry for shipped orders
- **FR-063**: System MUST send tracking email to customers when order shipped
- **FR-064**: System MUST auto-cancel pending orders after 24 hours if payment not received
- **FR-065**: System MUST support multiple payment methods (Cash, Card, PayPal, Stripe, etc.)

#### Customer Management (FR-066 to FR-080)
- **FR-066**: System MUST maintain customer profiles with contact information
- **FR-067**: System MUST track customer order history and total spent
- **FR-068**: System MUST support customer addresses (billing and shipping, multiple addresses)
- **FR-069**: System MUST allow customer wishlist management
- **FR-070**: System MUST generate customer analytics and reports
- **FR-071**: System MUST validate customer email uniqueness within store
- **FR-072**: System MUST support customer search by name, email, phone
- **FR-073**: System MUST support customer filtering by registration date, total spent, order count
- **FR-074**: System MUST calculate customer lifetime value (CLV)
- **FR-075**: System MUST track customer activity timeline
- **FR-076**: System MUST allow internal notes on customer profiles
- **FR-077**: System MUST support customer account status (Active, Suspended)
- **FR-078**: System MUST respect customer marketing preferences
- **FR-079**: System MUST implement customer data export (GDPR compliance)
- **FR-080**: System MUST implement customer data deletion (right to be forgotten)

#### Marketing (FR-081 to FR-095)
- **FR-081**: System MUST support coupon codes with percentage or fixed amount discounts
- **FR-082**: System MUST enforce coupon usage limits and validity periods
- **FR-083**: System MUST validate coupon conditions (minimum purchase, applicable products)
- **FR-084**: System MUST track coupon usage per customer
- **FR-085**: System MUST support flash sales with time-limited discounts
- **FR-086**: System MUST auto-revert prices after flash sale ends
- **FR-087**: System MUST display countdown timers for flash sales
- **FR-088**: System MUST allow newsletter creation and distribution
- **FR-089**: System MUST track newsletter open rates and click rates
- **FR-090**: System MUST respect newsletter unsubscribe preferences
- **FR-091**: System MUST detect abandoned carts after 1 hour
- **FR-092**: System MUST send abandoned cart recovery emails (3-tier sequence)
- **FR-093**: System MUST provide one-click cart recovery links
- **FR-094**: System MUST track marketing campaign performance
- **FR-095**: System MUST support customer segmentation for targeted campaigns

#### Shipping (FR-096 to FR-105)
- **FR-096**: System MUST allow configuration of shipping classes
- **FR-097**: System MUST support shipping zones with geographic boundaries
- **FR-098**: System MUST calculate shipping costs based on zone and product class
- **FR-099**: System MUST support multiple rate types (flat, per-item, weight-based, price-based)
- **FR-100**: System MUST support free shipping thresholds
- **FR-101**: System MUST present available shipping methods at checkout
- **FR-102**: System MUST integrate with shipping carriers for real-time rates (future)
- **FR-103**: System MUST support international shipping with customs info
- **FR-104**: System MUST validate shipping address format
- **FR-105**: System MUST provide default "Rest of World" zone for unmatched addresses

#### Reporting (FR-106 to FR-120)
- **FR-106**: System MUST generate sales reports (by product, category, brand, time period)
- **FR-107**: System MUST provide inventory/stock reports
- **FR-108**: System MUST generate customer analytics reports
- **FR-109**: System MUST support order status reports
- **FR-110**: System MUST provide country-based order reports
- **FR-111**: System MUST generate top-selling products reports
- **FR-112**: System MUST generate financial reports (revenue, tax, shipping)
- **FR-113**: System MUST support report filtering by date range, store, category, etc.
- **FR-114**: System MUST support report export to CSV, Excel, PDF
- **FR-115**: System MUST display reports with visual charts (line, bar, pie)
- **FR-116**: System MUST support report scheduling (daily, weekly, monthly email)
- **FR-117**: System MUST generate reports asynchronously for large datasets (email when ready)
- **FR-118**: System MUST respect user permissions when displaying reports
- **FR-119**: System MUST show only current store's data in reports (multi-tenant)
- **FR-120**: System MUST retain historical data for minimum 2 years

#### Content Management (FR-121 to FR-135)
- **FR-121**: System MUST allow creation of custom pages with rich text editor
- **FR-122**: System MUST support blog posts with categories and tags
- **FR-123**: System MUST allow navigation menu management with nested structure
- **FR-124**: System MUST support FAQ management with categories
- **FR-125**: System MUST handle contact form submissions with email notifications
- **FR-126**: System MUST validate page slug uniqueness within store
- **FR-127**: System MUST support content scheduling (publish at future date/time)
- **FR-128**: System MUST support content status (Published, Draft, Scheduled)
- **FR-129**: System MUST implement SEO metadata fields (title, description, keywords)
- **FR-130**: System MUST support multiple page templates
- **FR-131**: System MUST allow blog comments with approval moderation
- **FR-132**: System MUST support blog post author attribution
- **FR-133**: System MUST implement blog post search and filtering
- **FR-134**: System MUST support content preview before publishing
- **FR-135**: System MUST implement soft delete for content (404 on deleted pages)

#### POS (FR-136 to FR-145)
- **FR-136**: System MUST provide point-of-sale interface for in-store sales
- **FR-137**: System MUST support quick product search in POS by name or SKU
- **FR-138**: System MUST support barcode scanning for product lookup
- **FR-139**: System MUST allow discount application in POS (percentage or fixed)
- **FR-140**: System MUST support coupon code entry in POS
- **FR-141**: System MUST sync POS sales with inventory immediately
- **FR-142**: System MUST support multiple payment methods in POS
- **FR-143**: System MUST calculate change for cash payments
- **FR-144**: System MUST print receipts (optional)
- **FR-145**: System MUST track cash drawer balance with cash in/out logs

#### Multi-Tenancy (FR-146 to FR-155)
- **FR-146**: System MUST support multiple stores with data isolation
- **FR-147**: System MUST allow store switching in admin interface
- **FR-148**: System MUST filter all queries by current storeId
- **FR-149**: System MUST support per-store theme customization
- **FR-150**: System MUST allow module/add-on activation per store
- **FR-151**: System MUST validate subdomain uniqueness across platform
- **FR-152**: System MUST support store owner assignment (one owner per store)
- **FR-153**: System MUST allow super admin access to all stores
- **FR-154**: System MUST restrict store owners to their assigned stores only
- **FR-155**: System MUST maintain store-level settings (currency, timezone, language)

#### Support (FR-156 to FR-160)
- **FR-156**: System MUST provide support ticket system
- **FR-157**: System MUST allow ticket assignment to staff members
- **FR-158**: System MUST support ticket status tracking (Open, In Progress, Resolved, Closed)
- **FR-159**: System MUST allow ticket replies with email notifications
- **FR-160**: System MUST support ticket priority levels (Low, Medium, High, Critical)

---

### Key Entities *(Database Schema)*

#### Authentication & Users
- **User** (id, name, email, password, emailVerified, image, roleId, storeId, createdAt, updatedAt)
- **Role** (id, name, permissions_json, storeId, createdAt, updatedAt)
- **Session** (id, sessionToken, userId, expires)
- **PasswordReset** (id, email, token, expires, createdAt)

#### Multi-Tenancy
- **Store** (id, name, slug, domain, logo, settings_json, ownerId, status, createdAt, updatedAt)

#### Products
- **Product** (id, name, slug, description, price, salePrice, sku, stockQuantity, stockStatus, categoryId, brandId, storeId, taxStatus, weight, dimensions_json, createdAt, updatedAt, deletedAt)
- **ProductVariant** (id, productId, variantName, sku, price, salePrice, stockQuantity, attributes_json, createdAt, updatedAt)
- **ProductImage** (id, productId, variantId, imagePath, isPrimary, sortOrder, createdAt)
- **ProductAttribute** (id, name, type, options_json, storeId, createdAt)
- **ProductAttributeValue** (id, productId, attributeId, value)
- **Category** (id, name, slug, parentId, description, icon, sortOrder, storeId, createdAt, updatedAt, deletedAt)
- **Brand** (id, name, slug, logo, description, isPopular, storeId, createdAt, updatedAt, deletedAt)
- **Label** (id, name, color, badgeText, storeId, createdAt, updatedAt)
- **ProductLabel** (productId, labelId)
- **Testimonial** (id, productId, customerId, rating, reviewText, status, createdAt, updatedAt)
- **ProductQuestion** (id, productId, customerId, question, answer, status, createdAt, updatedAt)

#### Orders
- **Order** (id, orderNumber, customerId, subtotal, taxAmount, shippingCost, discountAmount, totalAmount, status, paymentStatus, paymentMethod, billingAddressId, shippingAddressId, notes, storeId, createdAt, updatedAt)
- **OrderItem** (id, orderId, productId, variantId, productName, sku, quantity, unitPrice, totalPrice, taxAmount)
- **OrderStatusHistory** (id, orderId, status, notes, changedBy, createdAt)
- **RefundRequest** (id, orderId, orderItemId, customerId, reason, refundAmount, status, processedBy, notes, createdAt, updatedAt)

#### Customers
- **Customer** (id, name, email, phone, dateOfBirth, gender, storeId, status, tags_json, createdAt, updatedAt, deletedAt)
- **CustomerAddress** (id, customerId, addressType, street, city, state, country, postalCode, isDefault, createdAt, updatedAt)
- **Wishlist** (id, customerId, createdAt)
- **WishlistItem** (id, wishlistId, productId, addedAt)
- **CustomerNote** (id, customerId, userId, note, createdAt)

#### Shipping
- **ShippingClass** (id, name, description, storeId, createdAt, updatedAt)
- **ShippingZone** (id, name, countries_json, states_json, postalCodes_json, storeId, createdAt, updatedAt)
- **ShippingRate** (id, zoneId, classId, rateType, rateAmount, freeShippingMin, isActive, storeId, createdAt, updatedAt)

#### Marketing
- **Coupon** (id, code, discountType, discountValue, minPurchase, maxDiscount, validFrom, validTo, usageLimit, usageLimitPerCustomer, applicableProducts_json, exclusions_json, autoApply, status, storeId, usageCount, createdAt, updatedAt)
- **CouponUsage** (id, couponId, orderId, customerId, discountApplied, usedAt)
- **FlashSale** (id, name, startDateTime, endDateTime, discountPercentage, products_json, badgeText, badgeColor, showCountdown, status, storeId, createdAt, updatedAt)
- **Newsletter** (id, subject, content, recipientType, recipientList_json, sentAt, openCount, clickCount, storeId, createdAt)
- **NewsletterSubscriber** (id, email, status, subscribedAt, unsubscribedAt, storeId)
- **AbandonedCart** (id, customerId, sessionId, cartData_json, abandonedAt, recoveredAt, storeId)

#### CMS
- **Page** (id, title, slug, content, metaTitle, metaDescription, template, status, publishedAt, storeId, createdAt, updatedAt, deletedAt)
- **Blog** (id, title, slug, content, excerpt, featuredImage, categoryId, authorId, tags_json, commentsEnabled, status, publishedAt, storeId, createdAt, updatedAt, deletedAt)
- **BlogCategory** (id, name, slug, storeId, createdAt, updatedAt)
- **BlogComment** (id, blogId, customerId, comment, status, createdAt, updatedAt)
- **Menu** (id, name, slug, location, storeId, createdAt, updatedAt)
- **MenuItem** (id, menuId, parentId, title, url, linkType, target, cssClass, icon, sortOrder, createdAt, updatedAt)
- **FAQ** (id, question, answer, categoryId, sortOrder, status, storeId, createdAt, updatedAt)
- **FAQCategory** (id, name, sortOrder, storeId)
- **Contact** (id, name, email, subject, message, status, repliedAt, storeId, createdAt)
- **Tag** (id, name, slug, storeId, createdAt)

#### Support
- **SupportTicket** (id, ticketNumber, customerId, subject, message, status, priority, assignedTo, storeId, createdAt, updatedAt)
- **TicketReply** (id, ticketId, userId, message, isInternalNote, createdAt)

#### Configuration
- **Setting** (id, storeId, key, value_json, createdAt, updatedAt, UNIQUE(storeId, key))
- **Theme** (id, name, slug, previewImage, configuration_json, isActive, storeId, createdAt, updatedAt)
- **Module** (id, name, slug, description, version, configuration_json, isActive, storeId, createdAt, updatedAt)
- **DeliveryBoy** (id, userId, name, phone, vehicleType, licensePlate, status, storeId, createdAt, updatedAt)
- **DeliveryAssignment** (id, orderId, deliveryBoyId, assignedAt, deliveredAt, status, notes)

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

#### Performance Metrics
- **SC-001**: Page load time (LCP) < 2 seconds for 95% of requests
- **SC-002**: First Input Delay (FID) < 100ms for 95% of interactions
- **SC-003**: Cumulative Layout Shift (CLS) < 0.1
- **SC-004**: API response time (p95) < 500ms for all endpoints
- **SC-005**: Database query time (p95) < 100ms
- **SC-006**: Dashboard loads with key metrics in < 2 seconds
- **SC-007**: Report generation completes in < 5 seconds for standard date ranges
- **SC-008**: Search results return in < 300ms for product catalog up to 10,000 items

#### Scalability Targets
- **SC-009**: System handles 100 concurrent admin users without performance degradation
- **SC-010**: Product catalog supports 10,000+ products per store
- **SC-011**: Order processing (status update) completes in < 1 second
- **SC-012**: System supports 10+ concurrent stores per instance
- **SC-013**: System handles 1,000 orders per hour during peak times

#### Reliability & Availability
- **SC-014**: System maintains 99.9% uptime (< 43.2 min downtime/month)
- **SC-015**: Zero data loss in case of system failures (database backups every 6 hours)
- **SC-016**: Disaster recovery: RTO < 4 hours, RPO < 1 hour

#### Usability & UX
- **SC-017**: All admin pages are responsive (desktop, tablet, mobile)
- **SC-018**: 95% of admin users successfully complete primary tasks without support
- **SC-019**: All forms include proper validation with helpful error messages
- **SC-020**: All actions provide immediate feedback (loading states, success/error messages)
- **SC-021**: Accessibility: WCAG 2.1 Level AA compliance (Lighthouse accessibility score > 90)

#### Data Integrity & Security
- **SC-022**: Data is isolated between stores with zero cross-contamination (multi-tenant security audit passes)
- **SC-023**: Inventory accuracy maintained at 99.9% (no overselling)
- **SC-024**: All sensitive data encrypted at rest and in transit
- **SC-025**: All API endpoints protected with proper authentication and authorization
- **SC-026**: All user inputs validated on both client and server
- **SC-027**: All critical operations logged for audit trail

#### Testing & Quality
- **SC-028**: Unit test coverage ≥ 80% for business logic (services layer)
- **SC-029**: 100% test coverage for utility functions
- **SC-030**: E2E tests cover all critical paths (auth, product creation, order processing, checkout)
- **SC-031**: Zero TypeScript compilation errors
- **SC-032**: Zero ESLint warnings in production builds
- **SC-033**: Lighthouse score > 90 for Performance, Accessibility, Best Practices, SEO

#### Business Outcomes
- **SC-034**: Admin users can complete common tasks (view orders, update product, generate report) in < 30 seconds
- **SC-035**: Order fulfillment time (Pending → Shipped) averages < 24 hours
- **SC-036**: Inventory sync accuracy: 99.9% (orders match inventory deductions)
- **SC-037**: Support ticket response time averages < 2 hours during business hours
- **SC-038**: System supports 500+ active stores per platform instance

---

## Non-Functional Requirements

### Security Requirements
- HTTPS only (TLS 1.2+)
- HTTP Strict Transport Security (HSTS) enabled
- Content Security Policy (CSP) headers configured
- XSS protection via React escaping and input sanitization
- CSRF protection on all state-changing operations
- SQL injection prevention via Prisma ORM
- Password hashing with bcrypt (salt rounds: 12)
- Session cookies: HTTP-only, Secure, SameSite=Lax
- Rate limiting: 100 requests/minute per IP for API endpoints
- File upload validation: Type, size, virus scanning
- Regular security audits and penetration testing

### Compliance Requirements
- **GDPR**: Customer data export, right to be forgotten, consent management
- **PCI DSS**: If handling card data directly (recommend using payment processor)
- **CAN-SPAM**: Unsubscribe links in all marketing emails
- **WCAG 2.1 Level AA**: Accessibility standards
- **Data Retention**: 2 years minimum, 7 years for financial records

### Monitoring & Logging
- Error tracking (Sentry or similar)
- Performance monitoring (Vercel Analytics)
- Database query performance logging
- API endpoint latency tracking
- User activity logging (audit trail)
- System health checks every 5 minutes
- Alerts: Error rate > 1%, API response time > 2s, Database connection pool > 80%

---

## Technology Constraints

### Required Technologies
- **Next.js**: 15.5.5 or later (App Router mandatory)
- **TypeScript**: 5.9.3 or later (strict mode)
- **Prisma**: Latest stable version
- **Tailwind CSS**: 4.1.14 or later
- **Radix UI**: Latest stable version
- **Vitest**: 3.2.4 or later
- **Playwright**: 1.56.0 or later

### Prohibited Technologies
- No class components (functional components only)
- No Redux, MobX, or other global state libraries (use React Server Components + hooks)
- No CSS-in-JS libraries (Tailwind only)
- No GraphQL (REST API via Route Handlers)
- No MongoDB or NoSQL databases (PostgreSQL only for production)
- No Pages Router (App Router only)

---

## Deployment & Infrastructure

### Deployment Platform
- **Primary**: Vercel (recommended for Next.js)
- **Alternative**: Docker + AWS/GCP/Azure

### Environment Strategy
- **Local**: SQLite database, mock email service, debug logging
- **Staging**: Vercel preview deployments, PostgreSQL (Vercel Postgres), real email (test domain), verbose logging
- **Production**: Vercel production, PostgreSQL (Vercel Postgres or Neon), real email (Resend), error logging only

### Environment Variables
```env
# Database
DATABASE_URL="file:./dev.db"  # SQLite for local
# DATABASE_URL="postgresql://user:password@host:5432/db"  # PostgreSQL for production

# Authentication
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"  # Production: https://your-domain.com

# Email
RESEND_API_KEY="re_xxxxxxxxxxxx"
EMAIL_FROM="noreply@your-domain.com"

# File Storage (Production)
BLOB_READ_WRITE_TOKEN="vercel_blob_xxxxxxxxxxxx"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="StormCom"

# Analytics (Optional)
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"

# Monitoring (Optional)
SENTRY_DSN="https://xxxx@sentry.io/xxxxx"
```

---

## Documentation References

### Specifications (This Document)
- Feature specifications with user stories, acceptance criteria, business rules
- Comprehensive functional requirements (160+ requirements)
- Complete database schema (40+ tables)
- Success criteria and non-functional requirements

### Implementation Plan
- See: `docs/specifications/001-stormcom-platform/plan.md`
- Technical architecture details
- Next.js App Router structure
- Prisma schema definitions
- API route patterns
- Deployment strategies

### Project Constitution
- See: `docs/specifications/.speckit/constitution.md`
- Code quality standards
- Testing requirements
- Development workflow
- Security guidelines

### Analysis Documentation
- See: `docs/analysis/ecommerce_complete_srs.md`
- Original comprehensive SRS from demo analysis (148 pages, 338 forms, 356 actions analyzed)
- Business logic flows
- ERD diagrams
- API endpoints reference

---

**Document Version**: 2.0  
**Last Updated**: 2025-10-16  
**Next Review**: As needed when requirements change  
**Status**: ✅ Approved for Implementation
