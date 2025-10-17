# EcommerceGo Admin SRS (Original Analysis)

**Project**: StormCom - Multi-Tenant E-commerce SaaS Platform  
**Source**: Demo crawl from https://ecom-demo.workdo.io/  
**Regenerated**: 2025-10-16T21:26:35  
**Status**: Reference Document (Historical)

---

> **📌 Note**: This document contains the original analysis from crawling the demo site. For implementation specifications, see:
> - **Complete SRS**: [docs/analysis/ecommerce_complete_srs.md](analysis/ecommerce_complete_srs.md)
> - **Feature Spec Template**: [docs/specifications/stormcom-platform/example_spec.md](specifications/stormcom-platform/example_spec.md)
> - **Implementation Plan Template**: [docs/specifications/stormcom-platform/example_plan.md](specifications/stormcom-platform/example_plan.md)  
> - **Project Standards**: [.specify/memory/constitution.md](../.specify/memory/constitution.md)
> - **Documentation Index**: [docs/README.md](README.md)

---

## Overview
This document captures pages, data attributes, and actions discovered by crawling the authenticated dashboard at https://ecom-demo.workdo.io/ using credentials (admin@example.com / 1234). The platform analyzed is an e-commerce SaaS system with 148 pages, 338 forms, and 356 actions.

## Sitemap
- https://ecom-demo.workdo.io/abandon-carts-handled — eCommerceGo SaaS - Abandon Cart
- https://ecom-demo.workdo.io/app-setting — eCommerceGo SaaS - Store Settings
- https://ecom-demo.workdo.io/blog — eCommerceGo SaaS - Blogs
- https://ecom-demo.workdo.io/blog-category — eCommerceGo SaaS - Blog Category
- https://ecom-demo.workdo.io/Brand-order-sale-reports — eCommerceGo SaaS - Sales Brand Report
- https://ecom-demo.workdo.io/category — eCommerceGo SaaS - Category
- https://ecom-demo.workdo.io/category-order-sale-reports — eCommerceGo SaaS - Sales Category Report
- https://ecom-demo.workdo.io/contacts — eCommerceGo SaaS - 联系我们
- https://ecom-demo.workdo.io/coupon — eCommerceGo SaaS - 优惠券
- https://ecom-demo.workdo.io/coupon/export — 
- https://ecom-demo.workdo.io/customer — eCommerceGo SaaS - 客户
- https://ecom-demo.workdo.io/customer-grid — eCommerceGo SaaS - 客户
- https://ecom-demo.workdo.io/dashboard — eCommerceGo SaaS - 控制台
- https://ecom-demo.workdo.io/deliveryboy — eCommerceGo SaaS - 送货员
- https://ecom-demo.workdo.io/deliveryboy-list — eCommerceGo SaaS - 送货员
- https://ecom-demo.workdo.io/faqs — eCommerceGo SaaS - 常见问题
- https://ecom-demo.workdo.io/flash-sale — eCommerceGo SaaS - 快速销售
- https://ecom-demo.workdo.io/greentic/home — 首页
- https://ecom-demo.workdo.io/menus — eCommerceGo SaaS - 菜单
- https://ecom-demo.workdo.io/modules/add — eCommerceGo SaaS - 控制台
- https://ecom-demo.workdo.io/modules/list — eCommerceGo SaaS - 添加程序管理器
- https://ecom-demo.workdo.io/newsletter — eCommerceGo SaaS - 关于新闻通讯
- https://ecom-demo.workdo.io/order — eCommerceGo SaaS - 顺序
- https://ecom-demo.workdo.io/order/export — 
- https://ecom-demo.workdo.io/order-country-reports — eCommerceGo SaaS - 订单国家报告
- https://ecom-demo.workdo.io/order-downloadable-reports — eCommerceGo SaaS - 销售 下载产品
- https://ecom-demo.workdo.io/order-grid — eCommerceGo SaaS - 顺序
- https://ecom-demo.workdo.io/order-receipt/eyJpdiI6IjJjbCtrUjRRM1E5cFlqenhOZUpjR1E9PSIsInZhbHVlIjoieFV3UmJubXNSZnd6cXc4VFdjMXJUZz09IiwibWFjIjoiNjViYWM5NTNhNzkyMGQ2MzU1NzEyMmViNGVhMWU5NDVkYTRmMDQ3ZGE5M2UxZmM0ZWRmNDA2YTQxMjA4MWU1YiIsInRhZyI6IiJ9 — EcommerceGo SaaS
- https://ecom-demo.workdo.io/order-receipt/eyJpdiI6ImJrWXFINWtXRVFRKzkyejJ6L0FJOHc9PSIsInZhbHVlIjoiNW1ab1IvaXp0bVNHd2QzQ1ZBUjlRQT09IiwibWFjIjoiZDRiZjVlZjA1NWE5YThkMDVhYzBkOTBkZmJiMDMzZmRiMGMzMzA0NWYwMGQ3MWQxYmQ0Mzc4ZWM0ZmQxMmI2NyIsInRhZyI6IiJ9 — EcommerceGo SaaS
- https://ecom-demo.workdo.io/order-receipt/eyJpdiI6ImNSVG4vcHc5cnBXR2NFdXpGVlZra1E9PSIsInZhbHVlIjoiN091enVJTkphUEQ5YnNWQ3IrTmYwZz09IiwibWFjIjoiZGViMzgzMTRiYjU0ODg4MzA3NDI3OWRlYTMzODA0NWUzNzFjODU1YjUyZTgzZWZlMjkxZmM2ZTRhNzdmNTg4OCIsInRhZyI6IiJ9 — EcommerceGo SaaS
- https://ecom-demo.workdo.io/order-receipt/eyJpdiI6InAvK3h5YUc4VkNZOUh1R1FWY3ZiNnc9PSIsInZhbHVlIjoiMGliUy9DTFR0QkRZM251bnd6MzZMUT09IiwibWFjIjoiZWNmZTczYzliMGFhNDZlM2JkOTg0YjVjMzRhZmJhZTNiYzljZWExNjg1NjkzNjY1NzlhNzkzYzE0OWEwYzViMCIsInRhZyI6IiJ9 — EcommerceGo SaaS
- https://ecom-demo.workdo.io/order-reports — eCommerceGo SaaS - 销售报告
- https://ecom-demo.workdo.io/order-reports-data — eCommerceGo SaaS - 销售报告
- https://ecom-demo.workdo.io/order-view/eyJpdiI6Ii8xV3pmbFp6aHZBQ3F1bEsxU1dmZkE9PSIsInZhbHVlIjoiWFJCZVJEeDVMWUREN1lURTNUbjl1Zz09IiwibWFjIjoiMDBkNjNjMjEyODI2YWYyNTVkNTkzOTA1ZDg5ZWY4ODk4NGVhNjc5YzJkYjNhOWY5ZTAxM2Y0MGQ4ZGY0MDExMiIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6Ii9tZkV3NTc0YlVsTnZsMWdPdTdGYXc9PSIsInZhbHVlIjoiSTVObjUvdWF3cXRST1Vkc1FFdGJOZz09IiwibWFjIjoiZGI3ODJhNjI5OWQ1MjJhMTIxNjM1ZGNhNTFiY2ExMzI1Mzc0MjFhMjI1MmYwMWQ3YWJmMjc4MjgyMWI5MzMwYyIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6IjdnMHpBcUtDaDR1RVloOGxjRlZiNmc9PSIsInZhbHVlIjoiK2dZcHMvbXI4NWtDL0pwcGcxTE4vZz09IiwibWFjIjoiZDJlOWU3YWEyODU4YTc1ZTUwN2Q4Y2U5ODFjN2M5OWRiYzI3ODRjNGIzYjExNzYxMGZmMzQxZDIxZWI0MTU3MiIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6IjF2VTY0c3NMUXF6WHJXamVvRngyTUE9PSIsInZhbHVlIjoib1dEKzFUbUJoZVg3azdUN013VlNuQT09IiwibWFjIjoiYjM4NDY3ZDIyNWY4Y2I4MjQ1ZTVhMGEwZmU4NzdjMjA4NDdlMWIwOGMxNjQzNjAxYWU1MjZmMjU5YjZhMmRmYyIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6IjFPb0Y0bDJCQmlWbkE0WEp6SDc2cnc9PSIsInZhbHVlIjoicjMyNWpyN0FlSnduUEhTYWlSTEpTUT09IiwibWFjIjoiYTFiMGM2Njk3MDMxYzQ3NWE3YzJiOWE4N2JkMjM0NjhmOThiYzhiMjE2MGE4MjJiOTYyNjMxY2Y1ZTJmNmM4OSIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6IjFPQmRJcUFzTUZsQ0Iyb1ZKVE5od0E9PSIsInZhbHVlIjoiTUtrc3lPdXYzRkU5OVZxOEhhdWUxQT09IiwibWFjIjoiYTY0YTE1YTc1YjMyOWNlOWYwZTFmYzUxYmViMTUwZTQ1NDhjNDAyMTI3M2U1ZDdkNzY5ZDUxNTIwZmQzY2NjNSIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6IjhWYkswTzhPdGpPRzdhdFVDWkFQSUE9PSIsInZhbHVlIjoiYmR1UUpONkdCMXl2RGtDVCtvQ0d1dz09IiwibWFjIjoiOTI2Nzg4NWM0NDZhZDAwZDc2YjYxOGYyMzY2NWZjNDcyMTJkZGE0ZjljOGZiNjIzZDFiNjBjNWRlYWUxYWRlYSIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6IjJ5QXYxNW1CcXIxVDRybEFORVZXcGc9PSIsInZhbHVlIjoicm9Bb1dlemlXRjU1Mm00UGcxNFYyQT09IiwibWFjIjoiMGVhYTBjMDdmODRiNDVhYThhNmE2MWFmOWExZTE1Zjk5NDRiYjVmMTM5YjU4OTNmNDNlYTNhYTM1YTg3ZDVkYSIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6IjJBY01oTENaZ2dTaEFyN2FhM3pkckE9PSIsInZhbHVlIjoiREp2MEd3SUczUGc5VWJuOCtjMWM2Zz09IiwibWFjIjoiYzA2YzAxZTc3ZmJjNmYwNGZmM2FjYTQxNDJiNzQ1NGM4MGZlMzc3ODI4Y2Q0MjA1NjEwMDc5OGZhZGY5ZmE0NyIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6IjlRNk5GTHZoWmN6YWd0N1JYcGZDYUE9PSIsInZhbHVlIjoiSTdTekdjNnpYSDF2T044QWlwT0hOQT09IiwibWFjIjoiMzY4MDZlMjFhMWQ0Y2QxMzllMTY4MTM1MGYzM2UwOTc0NWFiMTJmMDQ3NTE3Yzg5MmViZDA2NTA1ZWM4YzkxOSIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6IjltcmVaa2YrZGFGOUxqRy94ZzlJSGc9PSIsInZhbHVlIjoiZGhwSERJakRDUlYrYXI0UkFHUXdqdz09IiwibWFjIjoiNDkxMGQ1N2Y1NjcyNmUyMjRhYmE2ODkzZTBmYTI4ZGY5OWRmMTg2NGQ5N2M3ZTJjMTgxOTExOGNjMjQ5NTE2NiIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6IjNIbVZpd2JSZVlHMmJNZFNkakluOHc9PSIsInZhbHVlIjoiUzRIM1l6OE45TG5ONXViY29DemxSdz09IiwibWFjIjoiNjEyMThkMTBlM2E4NWVhNmY3YWY5ZDA5MWQxNTZhYTkzNjQ5ZWQxMTkwMjE2OTg2OWI2NTk1ZjI0MDEyYzY5ZiIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6IjRSeE5VYzh0Z01CdEx4Q3pxd0ZUMkE9PSIsInZhbHVlIjoic1kzQ2ptNkxMdjlhbHJjQVVRK2tqZz09IiwibWFjIjoiOTU4Njk3YWNkMjVlMzM3MmE2M2QzMmE1NWY2YzFlOWI2YjhlYTU4ZTczY2ZmNGFhYzg3Mjg1YzYxZmMyMDUxYSIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6IjVVeUdPcFNyR2F3RzBIQXJ6VkhRMEE9PSIsInZhbHVlIjoiaXN5TkN0TkN1bHhEb2tQeDRNNFpPUT09IiwibWFjIjoiNjkzYzBiYjRhOTMwYTZiOWFhM2RkNWI1MTA3ZjI5MDBjYzlhZGUxZjJiMmJjMjZmMDM1Y2M2YmM5MTU2MDQxYyIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6IjZmamlaaldCeGR4eGo5ZjRpQnJ0Mmc9PSIsInZhbHVlIjoiaHRpMmhzNGtEdDBWTGE2VWJlbjRaZz09IiwibWFjIjoiY2QwNWM1NDI4M2NkNGNjYzViM2U2MTBlMGY3ZWVkNWMwNTE0ZDAwMDk3NTlmNTk2OGY2OWQ0MGNiNWJlZTJhNSIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6Ik01QVd5Qk5pWEJhZmg3RXNxVlphd0E9PSIsInZhbHVlIjoiOU5HNUNlTklxb2liYUpWc2NXcEcvQT09IiwibWFjIjoiYWRiMWI5ZGJhZDkxMmZmZjgxNmZkNWRhYTZiNzk1Yjg3YmNkOGMyZTIwMTYwYWQ4ZWY1NzMxODkzODU2N2M1ZiIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6Ik05OW0zWTdJb1dMWmpMcTY4d1FNNGc9PSIsInZhbHVlIjoiNzJNQTdBcWJub2txcEJ1NVZzR3pWUT09IiwibWFjIjoiZGJhNWYzMTJiNDgxNjkxOTM5ZTk1NWQ3ODEzODE0MmJmN2Q5N2RhNWRiZGNkNWFlYjQwNWRiOTFjM2M1NDkzOSIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6Ik1JVVBDcEZUcHZrUlVsTks2TkZvaHc9PSIsInZhbHVlIjoiaWFFNk5aeGYxNTh5TS9XV0RNYVpHdz09IiwibWFjIjoiY2MxOTkzOGQ4NmIyOTI2YTc3MmFiNDRjZDNhNThhMDkwYzI1NjJiMzA1ZDBkYjc3N2JhYzkwNWIxNDA3MzJhNCIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6Ik1oOFVUbGlFN0s0b2hOaW9zZ1Ribmc9PSIsInZhbHVlIjoiV1I3UWRGRTBqOG94dzNnY1BvSWkyQT09IiwibWFjIjoiZjdiOTI3ZTk4Njk3MzY0ZWUyOTE0MWVhYWM1ZmYxZGYzZTE4Mjg0ZTIxOGEwNDJiNDYyNzQyNjVlNWEzNjkzYSIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6Ik4zTGpZUE1YMjZPcG50VkhuS2VkbEE9PSIsInZhbHVlIjoidWFBSGVEN20ydUtIaHdWMkQxRXRUdz09IiwibWFjIjoiMGY5YmExMjdhYzUzZjY5N2E3ZjUzNzZiOTBjN2YyNjYzMGQ5MzNlZGYxODFjOTYzMTY4OTA1MmEyZWUwYzExNCIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6Ik5EM1Q3TzJDeXpGa0Y3Mmd6Nm9lcUE9PSIsInZhbHVlIjoieC8yNmpEc3BqbFZSNklhODFaeHNuZz09IiwibWFjIjoiNTAwNWUxNGI2ODY3NzNjMWQxOGFiNzA2YjU2NTk3YmEzM2YxYmU2MmUxYmQwY2FhZjhhMjAyODAwY2FjODFmMCIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6Ik5sQmJlL1JqRzRHelpBT3NjQWF2clE9PSIsInZhbHVlIjoiM3Z1MFI5WnlGcUszekJCYks2QjV4Zz09IiwibWFjIjoiOGQ1MmU5OTJkMzdjZDViODEyNzEzOTcwYzljMWExMWM2YjIxODVkZjEyMWMwMzI1MmMzYzUxMjM2ODJlNWM5NSIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6Ik95Z0RoQmZicVowTHNPYlRQbUo4ZUE9PSIsInZhbHVlIjoiWlYzMWdVc1Evb2xxTWdZcnNwYndxZz09IiwibWFjIjoiYzU2MWQ5ZWQ3MjhhZDk3YjYxMzA2ZjUzMjA2OTNjNTk3Y2I5YWJjOTMwMGE5ZjE2Y2Q0MTFmODEzOGJlNTY2MyIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6Ik9CVHh4TlNrWmsrcUVZM2NYYXJNeHc9PSIsInZhbHVlIjoiMG1PQUF1YmxwRlAvVnRYYjhJcXBCQT09IiwibWFjIjoiOTMwYTg0ZDVmNTBlNGNiZWZmMjkxZGE0M2ZlZGE1NDIzYWJkMzM0YWU3MDM4NWU0N2FhMWRmMzg4YTM4MTU2NCIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6IkdmWXliZUFvRVM2dy9PUUovN3huNVE9PSIsInZhbHVlIjoiK2NRcm9JSnNtc2NKQ2FDbldrNnV4UT09IiwibWFjIjoiZDc1ZjA5MjY0MzFmNGM4YWJmODQ3Nzk3NGViNGE2MDQ4OTEwNTMyMWQ5OTc5M2RiY2MwMDc4NTQyNTlmNWNkNyIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6IkdzRmJYeHNjemhuTXJmTkUyaGlvM0E9PSIsInZhbHVlIjoiNDY1SW9QU3RtWkNRWTQwSzNXN2tSZz09IiwibWFjIjoiZmY1NDYxNGRmOTQzN2QxYWM2MTNkODMxNjY4MDk5OTA4NzU1ZTk3NWYwMDI4YTIwYzExMjE1ZGM4ZWU3MjQyMCIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6IkMwN1BSRmFLMHdzNUlOdDBST3c3K0E9PSIsInZhbHVlIjoiMFpxT2EwelBmajFJR0pHN0E0QjJFdz09IiwibWFjIjoiNWU0ZTQ0NzZhNDkzNGJkN2E0ZmIyNDA4MTEyN2Y4Njg5MWE3ZGM2ODVjZjQ5ZGI1MjZhYTU3NTYwM2NjZDMyYSIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6IkNPdDFmMkQxTHRzVGh1bGF2bmxZTmc9PSIsInZhbHVlIjoiaXJFWEV3cktSRUZqYUJkL3BhSGFYdz09IiwibWFjIjoiMWYzYmVlYWYzNTViZDE2OWI4MTE1OWRmNDkwNjk0OTZjN2ViYmFhMTNmYzUwN2Y0MDljYmM2NTc5ZjRkZWI2YiIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6IkpEY0VZY1Z4bi9oOEJIYy91bVFmUFE9PSIsInZhbHVlIjoieUNyVHBxNGw0UVN6ZG5CWVBsa1hFUT09IiwibWFjIjoiMmExNTQxNzg2MzNmZDRhOTJjMmE2M2JlMGI3N2IwN2RmYjMyMjIwNjRjM2E2ZjM5NWM2ZWMzZmQyODc2ODdmNiIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6IkpLcDJMOFJwOFpCaDBHVFNGK0k0Zmc9PSIsInZhbHVlIjoiMFEyOVFlbmZoM1BFSzRoZVNzdnl0Zz09IiwibWFjIjoiM2QyNzZjZWJmYzdhZWM3NzkzODA4MGE0N2Q0NTViYTRiYWEwMTI5MWM5OTRjYTVjNWYxYzliMzhkODNiZGNkMyIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6IkppN0oxZVByNXVCeW9IYy9UbXlYQ1E9PSIsInZhbHVlIjoiWnIrSERFUXhjOTE0cjB6bkFlZEU1UT09IiwibWFjIjoiNWFhYTk1NTk5NDllNmY5NzZlNTE1NGU1ZWNmN2VlMDcwNDJhYmE0MTJmZDFjZjUzMDdjZGM1ZWQyOTNjYWQ5ZCIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6IktBWEhuUWlsaC9XTUR6NnV6RlVLOEE9PSIsInZhbHVlIjoiaGd5TUxaR2JXWWhPMVdRMmhpTVloZz09IiwibWFjIjoiYzI2ZDg3MWQ0NWUyOTczNjMxM2E0NzI1N2Y5MTRmNWY1Mzc1MGQ2MDE0NzFkNGI0OTQ2MTRmZjM0ZmY3NzNlNiIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6IkVOVWM0MjU0TmVLN0d5SzIwL3BEanc9PSIsInZhbHVlIjoiOE9wdFptd05qT3kwb2hPdDJpc0g4QT09IiwibWFjIjoiYjliZjZlNWFkOTZlNmJhY2E1MzE5ZmJjNWYyZTE3NGI1NjY3ZTNkOTI5OWNhMzRhMjg4OTE2YTA3OGM5N2ZlOSIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6IkxIZ0NtdklCTVlmZUlST285NG9ZOUE9PSIsInZhbHVlIjoicEZUazhHcVhWZ2pOZHlQaUlsUndCZz09IiwibWFjIjoiYzg3NjFmOGUwYzFhMDk2NDYyMzFhOWU5MDBiZWUzMGM0ZTRhZWE1MGU0OWZhMjcyOTMxYzVjOTE4ZDA2ZDM3NiIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6IkxsL2IrZFMzUjBvZG9rMjB6dktwMmc9PSIsInZhbHVlIjoiU3pMdjBQUWdocXp2dHhoalFCOWpLZz09IiwibWFjIjoiNTI1OGE4NjRiYmYzMTcyMWM4MzczMGVmNTVlZjY2MTI5NDlkNzhlNDBkZDk5YjMyODc0ZjNmYzA5NWIyMTZjNiIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6IlBiZEtuSWVXL3ltb1hHeWhxeEN4N2c9PSIsInZhbHVlIjoiZEszT2RSNnBCOXNBQXdrRVA3eVJWUT09IiwibWFjIjoiYTI0ZDc3N2IzZjY3NDAwOGUzMjJlM2VhNmQzNWVjMGM2MWQ4OWQ5ZDAzYTJiZDEzNmFmZDFhNjJlY2IxMzJlYSIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6IlBUZ2NZNlYxNWlWekJnQnF1UEhIYUE9PSIsInZhbHVlIjoiQzNCa2NIbTc0c3FvNnduZUxjWjV1UT09IiwibWFjIjoiYTU1NmVkYzcwN2M4YmZlYjllN2E4NmVmYmRhYzgwMDg3N2ZhNTZmZmU2MDY5MDA3OWFiNTM1ZDcyMWZjNjU0NSIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6Ild1R3lIRTRESnluZHZkVHZzU2hOM1E9PSIsInZhbHVlIjoiYXVZdVlsNTgwakNYR2tLb21BVytMUT09IiwibWFjIjoiZjI3Yzg0OGFlOWZjZjFhYzlmZmMyY2Y4NWNmZmZhZDdhNmE3NmQ5NjM0ZDk1ODY1Zjg5ZWI3YjlkOTgyY2FlOCIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6IlFOL3UzbEx5L2pFb2tWaFMrclozdUE9PSIsInZhbHVlIjoiUDh2elpmY2V3amZXNGx6ZkxQTUYxUT09IiwibWFjIjoiNTZmMDY4YzFhYzFiZmQxNWYxYzQ1OTc4ZDAwYTY1MmJjYTg0YzQ3ZDM3Yzk1OTA0MGJlYmU1YzY3YThlNGVmZSIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6IlN4cDdVbjE1Z3dDeDFWc3Q2a0wyN0E9PSIsInZhbHVlIjoiUUR1dllEZ3dMeHpFbGMxbHMwMC96UT09IiwibWFjIjoiMjFkMzBiMDI3YTFlODUxZGFmZjA3OGM0ZDdiYmU2NzM3ODU2MTQwMzhmOTM0OTIwYzg0NWE5ZTRmOTg4ZjlhZSIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6IlNoOUY4Y2YzbGErVDR4blA0N1VsWWc9PSIsInZhbHVlIjoibk5UVk5iV0grRzJ1aE1XbEpObWJ3Zz09IiwibWFjIjoiYmRiN2ExZTlhODhhODk0NjQ5MGM3ZjI1NGMyYjJkNDc4MTY0Mjg1ZDA4NzI2OGJhNjljMTFmZTFjMDk4MGExMCIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6IlpBODJlZlQyV1pJSTRlVzh3aWdNUXc9PSIsInZhbHVlIjoiWlI2WWtLM2c0clVaRVJ6bkRtREJlZz09IiwibWFjIjoiNzE1MTJhODUwNTIzMDhmZTM4NTE4MzNhMGQ1OTEwMWFhYjk4Y2QzODExZDllOWRiZjEwY2M3ZDI4YmJlMDdlNyIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6IlUyRDdSUlhLaEZsaDFvaURrbnJqS3c9PSIsInZhbHVlIjoianFjbklNZVdNYkVsZlViSkFIVVZ3QT09IiwibWFjIjoiZmJjM2M5MTUyYjc2MDI0Zjg0NTcxYTRlMDY2OWFmMWE5NGUwN2Y3MDUwM2U4OGNjNGM0NmU4ZmFkNTYzNDQxOSIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6IlVGTmlqTkJ5eUx6L2FTYzlZdU44UVE9PSIsInZhbHVlIjoiMTZRMHl1TE5TTFNWVzk1YVgvSm12Zz09IiwibWFjIjoiOTNkNDdkZDY0MmVhYzhmZDEyMDViZGNkZDM5YTEwOGNmMTRkMjU4Y2I5NjAzYTJiODhhODE2MTYzNWI0MTMyYiIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6IlZCOHEwT1NIcEp1UDhvRXZUbjRKUFE9PSIsInZhbHVlIjoibkhZMG02ZE1pWUZkU25TWFdzcEtSQT09IiwibWFjIjoiMmNjNTM4Njk4YTQ1NTg0MTNmNzIxMzM0MWZkMTM5NmQ2ZjgxY2Y2N2YzMWJmMTA2OWY3MjkxMWNjMTMwMWFmZCIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6IlZHdFN2ZVlXOXdBR2lBYnl5Rm5rYUE9PSIsInZhbHVlIjoiOUYvMEpMV25ZakFWN2VyclBGcndHZz09IiwibWFjIjoiMDg3Yjk3MjUwYzg3MzcxNDgyZmIyMmYwMTA1ODRjM2I5OWQ1ODE0NWQxZDk3MWM4NmNkNGEzZGM5MmQ2M2I0YyIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6IlZQNXdmRlNldDNwT2drNWlIQUNncEE9PSIsInZhbHVlIjoicjFQMDNLTGxYV3drQWl2cW5JdFNoUT09IiwibWFjIjoiYjliMGZkYTQxMWY1OWNhNzk0NWM4NWY2M2EwMjAzYWQyZjQ1MjFkYzcwNDc2NWE3NjJkMWM3ZmM0NmYyYzE4MCIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6Im04dDZhTlZubXR0UThUUlVpUEpBVFE9PSIsInZhbHVlIjoiVkdGV0gwNUtsY3dsaFIzNlJsclBrUT09IiwibWFjIjoiNzc4OWVmZTFlZWI4YWVmNTY5NTMzMjFiY2FkMDNjMzA1MjcxZDY0ZjM3YjA4NDhkNmUxOThkNTBhMGZhN2NjOSIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6Im5wQzN4RzZrNUxHKzV0eDJaSGpsUWc9PSIsInZhbHVlIjoiL2hDem05TEVQRFowaE1MNGRxdTRMZz09IiwibWFjIjoiMjQ0MzYxZjk0NzNiYmI0MjgxY2ZlZGUzYTQ2NTE2MDg5NTE0NDQ2ZmYzMjU2OTgyMjUwZTBhYmE3ZTg1MjBiZCIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6Im8yZFpZR0t4M3hpb0ZGQ01BUGdoYnc9PSIsInZhbHVlIjoiNVJQUXJGemt6UjRvYUdIeVhUUDBpUT09IiwibWFjIjoiMzNhOGNiZGNiODA4YmQ3MmJiZGUwOGU4NjcyYWRmOGE0MzZjMTg5ZmE1ZDQxZmZlMDE2MmE4YTM1YTRmNTIzNyIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6ImFaZWxnbVErdnZySU9ucVorRmk5UVE9PSIsInZhbHVlIjoiWm5QdmxKZkYvVnpPdzJwSFJnWW9Gdz09IiwibWFjIjoiMjUzNjgwYWE5MDdmY2M4MDdmMTliNjEyYzkzODY1MTgyZDIzZjMxMTUzYTdmNWVkODQ5MGExM2M2MWZhYzIyMyIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6ImFiaVNMSkQ5VS9OSVZjSi9CMDhJUXc9PSIsInZhbHVlIjoiNHVMMUFUUFpvT29kOXNXOHYwUVBKZz09IiwibWFjIjoiOWI0ZWFkYTU0MjZmYjg0MTA4YTBlNmU2NzY2YmU3ZjMyNTUzNjA1OTMyMmQzMjljYjk2NjQ0YWFjN2RmYzlmOSIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6ImhseU5JWG1yL1VnVzlSUUlDeVZ1UGc9PSIsInZhbHVlIjoidTdNRE53dGhzRTZIZFhXbXBBd0dYQT09IiwibWFjIjoiNmI4ZTRlMTc5OTY1MjU2YzZhMGVlYjA1ZDY4OWMxOTZkN2VjODMyNDEyYzNkODUzYjIyNTM3MmNmMTViOGE4ZSIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6ImJCZTlqQk9nWlJXNnVlMnZyVVRWUUE9PSIsInZhbHVlIjoiQ3pST1JLNG1wM2VBMnZGZklhN3ZIUT09IiwibWFjIjoiZDViNzNjYzMwMTBhNGE2NzgyMDM5ZmE1NDgxZTM0ZWQ3YWFlMTBiNDc5OWFjNThmY2FkMTI2MWIxMmZiNTk1YiIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6ImJndnMrUDZrM21pb0JqVk1nKzFGaHc9PSIsInZhbHVlIjoiK3NSU0k2QkpjUWVlNmc3NjJGVk1VUT09IiwibWFjIjoiYmRmZmViMGYyNDczMWQxMTgzOWZmMDkzNmRiYmEzZjc0ZTZiMjY3ZTAwN2RiNDFmMTYxOGU3MjIyOGEyMjE0NSIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6ImJUWlY1WUVOWkhzbkozSmpTT2w5RUE9PSIsInZhbHVlIjoidVFKTU1yU085RDlMcVZSQTBzQlVkQT09IiwibWFjIjoiZWI1ODU2ZjA0MTAxMjI0NWQyNTg5MDJlMzI2Njc5NDFjOGVlZmQ3OTM0OTVlNWJkMzhlNWJhYTQ0YTM2ZmE2MyIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6ImlGaHU3M0E3REFndEUvRldrZXRsMXc9PSIsInZhbHVlIjoiN2xMUzVuY05LS1B0R0FZYWFEM1NwUT09IiwibWFjIjoiNDdiYWZjMGFmMWQ0YTM0NTBkNzZjMWExNGUxYzM0ZmE5MTM4NzViZWU2OGRhZjZhZjU1M2UwZWY3YTIwOGMxMSIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6ImNKbE1xRHNvcWhoRnJiWlpXeEJjdEE9PSIsInZhbHVlIjoiSVNFb2t5NEhmN2I1L1hYcVNXYy9QZz09IiwibWFjIjoiM2Q1ZjIxMTMwMmQzZThhMjBmYzQ2ZGFjYWU0OGYwYTNmNWEwNDM0Yzc4Mjc2OGNkNjhlYjE3ZGE2MjUzNGE2OCIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6ImRvMVgrY0pqd0N0NzFpeHN5M0NUb1E9PSIsInZhbHVlIjoiVHIxNVdHR3lXdDBMR3JLeDVKOXdHdz09IiwibWFjIjoiZWU3YjZlYjQzMTgyNjE0ZGQxNzg4MTJmMGU4M2I5ZDQ3ZDZiN2E3YWE5OWRlOTJmZTczMGE5YWRiMzhjZTg4MyIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6ImsvTU5HMW1oZFhQY0VjMG9mRHFLN1E9PSIsInZhbHVlIjoiWWUvOHl1dVNveTdSWmhIb3lzS1hJUT09IiwibWFjIjoiNWYzMWU1MzYzMDQwNDZiOGNjMTQ4ZmUzYmI3NWFiYTgxNmFhYzEyZmJlNGYxODA2Y2M4MTk4NGJhYmRlY2Y1NiIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6ImtQUmlySkkwWU44b0hORmErdDIyU0E9PSIsInZhbHVlIjoiS0dneEpQQnI3Qk5tUUU1NE1FOUNodz09IiwibWFjIjoiODg3MWQ2MWM3MTRmM2EzZDFkZTRjNGU4Zjg3Y2YwY2ZkMDVkZmNjMDZkYTNjMTU4YzBiZGFlMTc2ZWE5ZjA3NiIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6ImVnVyszVUlWb2k0SkZFZ1hYejZvWEE9PSIsInZhbHVlIjoiUEJKU3VtMitURVVLZFlPSzV1cE9EUT09IiwibWFjIjoiZDdmOGQ5MTgwM2VkOWZkZDhjMDY1YTU3ZWVhZWVmZGIwZmNlNzQzZjQ3ZTNjY2JmNjA4NDcwYjcwOTJjYzk2NiIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6ImVzdi9oekJGSUVJNEI5TXYyWkFkU0E9PSIsInZhbHVlIjoiMmRIeFV3OUhMa3hoSkt2NE5wZnJaQT09IiwibWFjIjoiY2FiMTZlYjJlMzQyNTU0MzNlMTc0ODIxNmFhY2FlYjdmZDE2ZjQ5YmI0YTc2ZGQzMjA3YWZmZmNmNjhjMzA5NyIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6ImY5b3p2TytZMmJPWW10RUd5L3VkL3c9PSIsInZhbHVlIjoidllHVjhob0lzZDVnU2hxTGlpY3k3UT09IiwibWFjIjoiM2RlYjA2ZTI0OTVlOTkxNDA0MWEyNzdjOWJhZWJkMjA3N2I2MWRhNzAyZTYxZjg5MTFmMDk0YzU1YTZkZDlkMSIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6InA4WDRxNnZvSFo0NWNlRWJDalNsNkE9PSIsInZhbHVlIjoiaDExa0RyYUkzeDZZSWEvWUdEbldldz09IiwibWFjIjoiOTUxNGUzZjM1MTViMjdkNTI1NDcwNTZkOGRlZTBkOTJhMzdjNTFiZGRmNGViMDI4MDc0NTE0NWE1NmYxNmQ3NyIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6InEyZVN1T0hPQXdxTlAxWG1lMmhJMFE9PSIsInZhbHVlIjoiS2xCMW1kWkd2TFROQjZOelJzYnd6UT09IiwibWFjIjoiYzA2NTU1ZTVmZDc5NDBjNjliODg5NTc5MzJmZjU4ODU2ZGZiOTg3NjRkMDg1YzU2M2E5MTU2ZGFiYmZjMjU3MiIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6InFXeUQ3TFhISWxFWEpPWXVuaHRpa3c9PSIsInZhbHVlIjoiNXNWQnhibm9RUWtCck5nWStEMEw3QT09IiwibWFjIjoiMjgxNWI0OGU5ZjE3MmUxMzcxYjk3NWI0ZDEzNWNiNWQ1NTc0ODdjMTQwMzJjYjU2MWNmNDUyZTFlY2E2MWE3NCIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6IngrZG5xT0NXNEYxK1FkSStEN1JnL3c9PSIsInZhbHVlIjoiQVBib1hOanE3Vy92MmwzREVLeGpDQT09IiwibWFjIjoiZjU5MWQ4YmUyZjU4ZDU3ZDZlMDQ3NDZhY2YyYTlhN2M4NWU4YTgwNTQ0NzI3ZjA1NGVlMWY5NTk4Y2NjMjNkNCIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6InhGMjIzaUZQRzhaeldXaWFXcWFkVWc9PSIsInZhbHVlIjoiSHZqbkZySjUrQ1RLSlJJWjFobGxXUT09IiwibWFjIjoiNmFlZTRmZGE4YmMyYWFkZDI5NzRkYjA0YWM5MjNjNzJlODM1ZDc5NTU1YTBkZGNiMzBkYmJkNjgyMzEyODU3MyIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6InJpLzF2Z1pqcjM5eWVVRndmWXdza2c9PSIsInZhbHVlIjoiNnJkZTdlR1djVkt5L2Zla1FIdFBzZz09IiwibWFjIjoiODc4NDllMTQ4MDdhYjAwOGYyODYzNjA0NTI0N2VlNWI4M2U1Nzk4NTdkNmMzNjJiZjEwMjZhNmJmNjFhYzY2MyIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6InlvcTRuM0Voa3ZZU0JWWCtpcDBZY3c9PSIsInZhbHVlIjoiWUsxRUhhTDkvYkg2NVl6eURzMThuUT09IiwibWFjIjoiM2ViMjg4MWVlMTg1NmU2ZWE3MjA4ZWQxYWUxY2M5YWVmMmVjMzE3NGU4ODVjOGY4ODhhZWVkNzlkNzk4OGYyOCIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6InNmTEJsM1JaUng3TGZsUW9wVklleUE9PSIsInZhbHVlIjoiL0FhSjVGWnBQdmZWSHVpb3ZDV2Zmdz09IiwibWFjIjoiOGRkNjQzY2M5NTllMmRkZGEzMTVmNzMwYTk5ODAwYWViZmJjMDcxMzYwNzA5NmQ2OGRlNGYyZDZiM2VjYjQ1ZiIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6InRvT3A2cFNlRXdVcW8vVWNPTFRhRGc9PSIsInZhbHVlIjoiZ2VBcjE3OXRtR3dBY1o1aDlwbUpTQT09IiwibWFjIjoiNmI0Mjg2MjhhZDY3NWM4MmI0YzJjNTgwZDI2MGIzNWM3NDE1YjQxOTNlMGZjOWFiMTc4OWExZDkyM2U1MjA0ZCIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6InVIM3J2a1EzYWM1Q1JlV2dwcEU4cUE9PSIsInZhbHVlIjoiWXQrR0QrbHNmK1lwcSt0RWFIMGVpUT09IiwibWFjIjoiMDkwMWVhZmUxMzdlMmVkZGExODQ5ZGI1YjM5ZTVlMWFiNDMxMTkwMWRiYmY3Y2YzNzM3YjhkNDhhNzVhZDVlYSIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/order-view/eyJpdiI6InZMaXRkcE51cDMrWHhIOHQyKzBiQlE9PSIsInZhbHVlIjoiRVM2Q1FSdm5tWjgyUHVaR01LcFVlZz09IiwibWFjIjoiMzNlZmYxMjNjNjY2ZDZmNGYwZTgwMDM0ZDNhZDE5YTZjZGU2ZDMxMTI1NmI3NjlhYTZlZjIyMzllNjAxMWNjYyIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单详情
- https://ecom-demo.workdo.io/pages — eCommerceGo SaaS - 页面
- https://ecom-demo.workdo.io/plan — eCommerceGo SaaS - 计划
- https://ecom-demo.workdo.io/plan-stripe/eyJpdiI6InJJZHpCU2tGVlVBZTVsUG9VV0RrWWc9PSIsInZhbHVlIjoiU2xrNWtiQkpFektqRUR0cExQQWdEQT09IiwibWFjIjoiNTZiODNmMGFjNWExZTkwMjY5MTU3NjIzOTI2ZGQ4NzY3ZmExMTEyZjM4Mjc3ZmFiYmRjNzg3OGQxZDJkOTRmZCIsInRhZyI6IiJ9 — eCommerceGo SaaS - 订单总结
- https://ecom-demo.workdo.io/pos — eCommerceGo SaaS - 没有
- https://ecom-demo.workdo.io/product — eCommerceGo SaaS - 产品
- https://ecom-demo.workdo.io/product/create — eCommerceGo SaaS - 产品
- https://ecom-demo.workdo.io/product-attributes — eCommerceGo SaaS - 属性
- https://ecom-demo.workdo.io/product-brand — eCommerceGo SaaS - 产品品牌
- https://ecom-demo.workdo.io/product-label — eCommerceGo SaaS - 产品标签
- https://ecom-demo.workdo.io/product-list — eCommerceGo SaaS - 产品
- https://ecom-demo.workdo.io/product-order-sale-reports — eCommerceGo SaaS - 销售产品报告
- https://ecom-demo.workdo.io/product-question — eCommerceGo SaaS - 产品问题
- https://ecom-demo.workdo.io/profile — eCommerceGo SaaS - 个人资料
- https://ecom-demo.workdo.io/refund-request — eCommerceGo SaaS - 订单退款要求
- https://ecom-demo.workdo.io/reports — eCommerceGo SaaS - 客户报告
- https://ecom-demo.workdo.io/request-cancel/2 — eCommerceGo SaaS - 控制台
- https://ecom-demo.workdo.io/roles — eCommerceGo SaaS - 角色
- https://ecom-demo.workdo.io/setting — eCommerceGo SaaS - 设置
- https://ecom-demo.workdo.io/shipping — eCommerceGo SaaS - 航行类别
- https://ecom-demo.workdo.io/shippinglabel/pdf/eyJpdiI6IjBrL0NUbUYydEZjc2M2Vm9IOUVoZUE9PSIsInZhbHVlIjoiN0FvRlFjTlY1VEV5OVg2anhiVm5Fdz09IiwibWFjIjoiODkyNzIwNjI3YWE4YTM0MjA2MjgzZjIwMjFjZTg3ODhhZjc0NTY0Y2FjYTQ1MTFlNjViOTc5NTE0YzExNjgyOSIsInRhZyI6IiJ9 — 
- https://ecom-demo.workdo.io/shippinglabel/pdf/eyJpdiI6IjNwUnlmYkNwNWZFZTROT0FRTXdXM1E9PSIsInZhbHVlIjoiTm1SMkNXQVRJYXhzNDI4ZmloRDBkZz09IiwibWFjIjoiZWExZTc2ZjE4NmY3YzRkNjdlZmRmMzg5OGMyYzAyNzNmMGViMzAwNzhkYmY1YWIwZWY4OGZhMGU5NmU2MjdhZCIsInRhZyI6IiJ9 — 
- https://ecom-demo.workdo.io/shippinglabel/pdf/eyJpdiI6ImlVRi9RZS9LeFNjanE4Tk00d2xiVmc9PSIsInZhbHVlIjoiWXZoZko4ajM3OVFsU2c2dEMxeTkwUT09IiwibWFjIjoiNmYxMjQxZjdhNzk3MGRjZWVmNzg2Y2QwNTJkZDgwZDExZWRkNmJiMmIzMTM4NmYzNTE0ODNlYjBkYTliMTU4YSIsInRhZyI6IiJ9 — 
- https://ecom-demo.workdo.io/shippinglabel/pdf/eyJpdiI6ImZuTzFrNkNJRlhGSTB3TExjazlvenc9PSIsInZhbHVlIjoiMXhTS3lhZ3VjdXBoWjNGdXIrSXFoQT09IiwibWFjIjoiOTRhZDYzMGEwZjQ5NzBkZDU4ZWFiNmRkZDA2ZjIxZTY5NTZkNDAwODEyNmU5NzI4ODU0MWExNDAyMmQ3ZmZjNSIsInRhZyI6IiJ9 — 
- https://ecom-demo.workdo.io/shipping-zone — eCommerceGo SaaS - 航运区
- https://ecom-demo.workdo.io/Status-reports — eCommerceGo SaaS - 订单状态报告
- https://ecom-demo.workdo.io/stock-reports — eCommerceGo SaaS - 库存报告
- https://ecom-demo.workdo.io/stores/create — eCommerceGo SaaS - 创建存储
- https://ecom-demo.workdo.io/stylique/home — 首页
- https://ecom-demo.workdo.io/support_ticket — eCommerceGo SaaS - 支持票
- https://ecom-demo.workdo.io/tag — eCommerceGo SaaS - 标记
- https://ecom-demo.workdo.io/techzonix/home — 首页
- https://ecom-demo.workdo.io/testimonial — eCommerceGo SaaS - 证词
- https://ecom-demo.workdo.io/themean-alytic — eCommerceGo SaaS - 存储分析
- https://ecom-demo.workdo.io/theme-customize — eCommerceGo SaaS - 其他主题
- https://ecom-demo.workdo.io/theme-customize/greentic/pages — eCommerceGo SaaS - 定制主题
- https://ecom-demo.workdo.io/theme-customize/stylique/pages — eCommerceGo SaaS - 定制主题
- https://ecom-demo.workdo.io/theme-customize/techzonix/pages — eCommerceGo SaaS - 定制主题
- https://ecom-demo.workdo.io/top-all-reports — eCommerceGo SaaS - 销售额最高的报告
- https://ecom-demo.workdo.io/users — eCommerceGo SaaS - 用户
- https://ecom-demo.workdo.io/wishlist — eCommerceGo SaaS - 愿望清单

## Pages
### eCommerceGo SaaS - Abandon Cart
- URL: https://ecom-demo.workdo.io/abandon-carts-handled
- Actions:
  - link: ' + ' Add Attribute Option (#)
  - link: Add New Category (#)
  - link: Add New Coupon (#)
  - link: Add New Product (https://ecom-demo.workdo.io/product/create)
  - link: Add New Tax (#)
  - link: Add-on Manager Premium (https://ecom-demo.workdo.io/modules/list)
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - link: Create New Store (https://ecom-demo.workdo.io/stores/create)
  - link: Order Refund Request (https://ecom-demo.workdo.io/refund-request)
  - link: Quick Add (#)
  - button: Save changes ()

### eCommerceGo SaaS - Store Settings
- URL: https://ecom-demo.workdo.io/app-setting
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/theme-settings Method: POST
    - [hidden] _token — 
    - [hidden] app_setting_tab — 
    - [text] theme_name — Store Name
    - [text] email — Store Email
    - [text] store_slug — Store Slug
    - [file] invoice_logo — Choose File Here
    - [file] theme_image — Choose File Here
    - [submit]  — 
    - [select] default_language — options: Arabic, Danish, German, English, Spanish, French, Italian, Japanese, Dutch, Polish, Portuguese, Russian, Turkish, Chinese, Hebrew, Portuguese(Brazil)
  - Action: https://ecom-demo.workdo.io/ownerstore-remove/2 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/seo-setting Method: POST
    - [hidden] _token — 
    - [hidden] app_setting_tab — 
    - [text] google_analytic — Google Analytic
    - [text] fbpixel_code — Google Analytic
    - [file] metaimage — Choose File Here
    - [submit]  — Google Analytic
    - [textarea] metakeyword
    - [textarea] metadesc
  - Action: https://ecom-demo.workdo.io/theme-settings Method: POST
    - [hidden] _token — 
    - [hidden] app_setting_tab — 
    - [radio] enable_domain — Store Link
    - [radio] enable_domain — Store Link
    - [radio] enable_domain — Store Link
    - [text]  — Store Link
    - [text] domains — Store Link
    - [text] subdomain — Store Link
    - [submit]  — 
    - [textarea] storejs
    - [textarea] storecss
  - Action: https://ecom-demo.workdo.io/theme-settings Method: POST
    - [hidden] _token — 
    - [hidden] app_setting_tab — 
    - [hidden] additional_notes — Additional Notes
    - [checkbox] additional_notes — Additional Notes
    - [hidden] is_checkout_login_required — Additional Notes
    - [checkbox] is_checkout_login_required — Is Checkout Login Required
    - [submit]  — 
- Actions:
  - link: ' + ' Add Attribute Option (#)
  - link: Add New Category (#)
  - link: Add New Coupon (#)
  - link: Add New Product (https://ecom-demo.workdo.io/product/create)
  - link: Add New Tax (#)
  - link: Add-on Manager Premium (https://ecom-demo.workdo.io/modules/list)
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - link: Create New Store (https://ecom-demo.workdo.io/stores/create)
  - button: Delete Store ()
  - link: Order Refund Request (https://ecom-demo.workdo.io/refund-request)
  - link: Quick Add (#)
  - button: Save changes ()

### eCommerceGo SaaS - Blogs
- URL: https://ecom-demo.workdo.io/blog
- Actions:
  - link: ' + ' Add Attribute Option (#)
  - link: Add New Category (#)
  - link: Add New Coupon (#)
  - link: Add New Product (https://ecom-demo.workdo.io/product/create)
  - link: Add New Tax (#)
  - link: Add-on Manager Premium (https://ecom-demo.workdo.io/modules/list)
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - link: Create New Store (https://ecom-demo.workdo.io/stores/create)
  - link: Order Refund Request (https://ecom-demo.workdo.io/refund-request)
  - link: Quick Add (#)
  - button: Save changes ()

### eCommerceGo SaaS - Blog Category
- URL: https://ecom-demo.workdo.io/blog-category
- Actions:
  - link: ' + ' Add Attribute Option (#)
  - link: Add New Category (#)
  - link: Add New Coupon (#)
  - link: Add New Product (https://ecom-demo.workdo.io/product/create)
  - link: Add New Tax (#)
  - link: Add-on Manager Premium (https://ecom-demo.workdo.io/modules/list)
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - link: Create New Store (https://ecom-demo.workdo.io/stores/create)
  - link: Order Refund Request (https://ecom-demo.workdo.io/refund-request)
  - link: Quick Add (#)
  - button: Save changes ()

### eCommerceGo SaaS - Sales Brand Report
- URL: https://ecom-demo.workdo.io/Brand-order-sale-reports
- Actions:
  - link: ' + ' Add Attribute Option (#)
  - link: Add New Category (#)
  - link: Add New Coupon (#)
  - link: Add New Product (https://ecom-demo.workdo.io/product/create)
  - link: Add New Tax (#)
  - link: Add-on Manager Premium (https://ecom-demo.workdo.io/modules/list)
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - link: Create New Store (https://ecom-demo.workdo.io/stores/create)
  - link: Order Refund Request (https://ecom-demo.workdo.io/refund-request)
  - link: Quick Add (#)
  - button: Save changes ()

### eCommerceGo SaaS - Category
- URL: https://ecom-demo.workdo.io/category
- Actions:
  - link: ' + ' Add Attribute Option (#)
  - link: Add New Category (#)
  - link: Add New Coupon (#)
  - link: Add New Product (https://ecom-demo.workdo.io/product/create)
  - link: Add New Tax (#)
  - link: Add-on Manager Premium (https://ecom-demo.workdo.io/modules/list)
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - link: Create New Store (https://ecom-demo.workdo.io/stores/create)
  - link: Order Refund Request (https://ecom-demo.workdo.io/refund-request)
  - link: Quick Add (#)
  - button: Save changes ()

### eCommerceGo SaaS - Sales Category Report
- URL: https://ecom-demo.workdo.io/category-order-sale-reports
- Actions:
  - link: ' + ' Add Attribute Option (#)
  - link: Add New Category (#)
  - link: Add New Coupon (#)
  - link: Add New Product (https://ecom-demo.workdo.io/product/create)
  - link: Add New Tax (#)
  - link: Add-on Manager Premium (https://ecom-demo.workdo.io/modules/list)
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - link: Create New Store (https://ecom-demo.workdo.io/stores/create)
  - link: Order Refund Request (https://ecom-demo.workdo.io/refund-request)
  - link: Quick Add (#)
  - button: Save changes ()

### eCommerceGo SaaS - 联系我们
- URL: https://ecom-demo.workdo.io/contacts
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 优惠券
- URL: https://ecom-demo.workdo.io/coupon
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### 
- URL: https://ecom-demo.workdo.io/coupon/export

### eCommerceGo SaaS - 客户
- URL: https://ecom-demo.workdo.io/customer
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 客户
- URL: https://ecom-demo.workdo.io/customer-grid
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 控制台
- URL: https://ecom-demo.workdo.io/dashboard
- Tables:
  - Table 1 headers: 图像, 产品, 价格
  - Table 2 headers: 命令, 时间, 情况
- Actions:
  - link: Add New Main Category (#)
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 送货员
- URL: https://ecom-demo.workdo.io/deliveryboy
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/deliveryboy/17 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/deliveryboy/18 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/deliveryboy/19 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/deliveryboy/20 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/deliveryboy/21 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/deliveryboy/22 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/deliveryboy/23 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/deliveryboy/24 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 送货员
- URL: https://ecom-demo.workdo.io/deliveryboy-list
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 常见问题
- URL: https://ecom-demo.workdo.io/faqs
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 快速销售
- URL: https://ecom-demo.workdo.io/flash-sale
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### 首页
- URL: https://ecom-demo.workdo.io/greentic/home
- Forms:
  - Action:  Method: GET
    - [text] search_product — 
  - Action: https://ecom-demo.workdo.io/newsletter?greentic Method: POST
    - [hidden] _token — 
    - [email]  — 
  - Action:  Method: GET
    - [text]  — 
- Actions:
  - link: View All blog (https://ecom-demo.workdo.io/greentic/blog)
  - link: View All Categories (https://ecom-demo.workdo.io/greentic/collections)
  - link: View All products (https://ecom-demo.workdo.io/greentic/product-list)

### eCommerceGo SaaS - 菜单
- URL: https://ecom-demo.workdo.io/menus
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 控制台
- URL: https://ecom-demo.workdo.io/modules/add
- Tables:
  - Table 1 headers: 图像, 产品, 价格
  - Table 2 headers: 命令, 时间, 情况
- Actions:
  - link: Add New Main Category (#)
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 添加程序管理器
- URL: https://ecom-demo.workdo.io/modules/list
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/theme-enable Method: POST
    - [hidden] _token — 
    - [hidden] name — 
  - Action: https://ecom-demo.workdo.io/theme-enable Method: POST
    - [hidden] _token — 
    - [hidden] name — 
  - Action: https://ecom-demo.workdo.io/theme-enable Method: POST
    - [hidden] _token — 
    - [hidden] name — 
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 关于新闻通讯
- URL: https://ecom-demo.workdo.io/newsletter
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 顺序
- URL: https://ecom-demo.workdo.io/order
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### 
- URL: https://ecom-demo.workdo.io/order/export

### eCommerceGo SaaS - 订单国家报告
- URL: https://ecom-demo.workdo.io/order-country-reports
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 销售 下载产品
- URL: https://ecom-demo.workdo.io/order-downloadable-reports
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 顺序
- URL: https://ecom-demo.workdo.io/order-grid
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order/51 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order/50 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order/49 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order/48 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order/47 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order/38 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order/37 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order/13 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order/12 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order/11 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order/10 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order/9 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order/8 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order/7 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order/6 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order/5 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### EcommerceGo SaaS
- URL: https://ecom-demo.workdo.io/order-receipt/eyJpdiI6IjJjbCtrUjRRM1E5cFlqenhOZUpjR1E9PSIsInZhbHVlIjoieFV3UmJubXNSZnd6cXc4VFdjMXJUZz09IiwibWFjIjoiNjViYWM5NTNhNzkyMGQ2MzU1NzEyMmViNGVhMWU5NDVkYTRmMDQ3ZGE5M2UxZmM0ZWRmNDA2YTQxMjA4MWU1YiIsInRhZyI6IiJ9

### EcommerceGo SaaS
- URL: https://ecom-demo.workdo.io/order-receipt/eyJpdiI6ImJrWXFINWtXRVFRKzkyejJ6L0FJOHc9PSIsInZhbHVlIjoiNW1ab1IvaXp0bVNHd2QzQ1ZBUjlRQT09IiwibWFjIjoiZDRiZjVlZjA1NWE5YThkMDVhYzBkOTBkZmJiMDMzZmRiMGMzMzA0NWYwMGQ3MWQxYmQ0Mzc4ZWM0ZmQxMmI2NyIsInRhZyI6IiJ9

### EcommerceGo SaaS
- URL: https://ecom-demo.workdo.io/order-receipt/eyJpdiI6ImNSVG4vcHc5cnBXR2NFdXpGVlZra1E9PSIsInZhbHVlIjoiN091enVJTkphUEQ5YnNWQ3IrTmYwZz09IiwibWFjIjoiZGViMzgzMTRiYjU0ODg4MzA3NDI3OWRlYTMzODA0NWUzNzFjODU1YjUyZTgzZWZlMjkxZmM2ZTRhNzdmNTg4OCIsInRhZyI6IiJ9

### EcommerceGo SaaS
- URL: https://ecom-demo.workdo.io/order-receipt/eyJpdiI6InAvK3h5YUc4VkNZOUh1R1FWY3ZiNnc9PSIsInZhbHVlIjoiMGliUy9DTFR0QkRZM251bnd6MzZMUT09IiwibWFjIjoiZWNmZTczYzliMGFhNDZlM2JkOTg0YjVjMzRhZmJhZTNiYzljZWExNjg1NjkzNjY1NzlhNzkzYzE0OWEwYzViMCIsInRhZyI6IiJ9

### eCommerceGo SaaS - 销售报告
- URL: https://ecom-demo.workdo.io/order-reports
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 销售报告
- URL: https://ecom-demo.workdo.io/order-reports-data
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6Ii8xV3pmbFp6aHZBQ3F1bEsxU1dmZkE9PSIsInZhbHVlIjoiWFJCZVJEeDVMWUREN1lURTNUbjl1Zz09IiwibWFjIjoiMDBkNjNjMjEyODI2YWYyNTVkNTkzOTA1ZDg5ZWY4ODk4NGVhNjc5YzJkYjNhOWY5ZTAxM2Y0MGQ4ZGY0MDExMiIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6Ii9tZkV3NTc0YlVsTnZsMWdPdTdGYXc9PSIsInZhbHVlIjoiSTVObjUvdWF3cXRST1Vkc1FFdGJOZz09IiwibWFjIjoiZGI3ODJhNjI5OWQ1MjJhMTIxNjM1ZGNhNTFiY2ExMzI1Mzc0MjFhMjI1MmYwMWQ3YWJmMjc4MjgyMWI5MzMwYyIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6IjdnMHpBcUtDaDR1RVloOGxjRlZiNmc9PSIsInZhbHVlIjoiK2dZcHMvbXI4NWtDL0pwcGcxTE4vZz09IiwibWFjIjoiZDJlOWU3YWEyODU4YTc1ZTUwN2Q4Y2U5ODFjN2M5OWRiYzI3ODRjNGIzYjExNzYxMGZmMzQxZDIxZWI0MTU3MiIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6IjF2VTY0c3NMUXF6WHJXamVvRngyTUE9PSIsInZhbHVlIjoib1dEKzFUbUJoZVg3azdUN013VlNuQT09IiwibWFjIjoiYjM4NDY3ZDIyNWY4Y2I4MjQ1ZTVhMGEwZmU4NzdjMjA4NDdlMWIwOGMxNjQzNjAxYWU1MjZmMjU5YjZhMmRmYyIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6IjFPb0Y0bDJCQmlWbkE0WEp6SDc2cnc9PSIsInZhbHVlIjoicjMyNWpyN0FlSnduUEhTYWlSTEpTUT09IiwibWFjIjoiYTFiMGM2Njk3MDMxYzQ3NWE3YzJiOWE4N2JkMjM0NjhmOThiYzhiMjE2MGE4MjJiOTYyNjMxY2Y1ZTJmNmM4OSIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6IjFPQmRJcUFzTUZsQ0Iyb1ZKVE5od0E9PSIsInZhbHVlIjoiTUtrc3lPdXYzRkU5OVZxOEhhdWUxQT09IiwibWFjIjoiYTY0YTE1YTc1YjMyOWNlOWYwZTFmYzUxYmViMTUwZTQ1NDhjNDAyMTI3M2U1ZDdkNzY5ZDUxNTIwZmQzY2NjNSIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note/95 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note/100 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6IjhWYkswTzhPdGpPRzdhdFVDWkFQSUE9PSIsInZhbHVlIjoiYmR1UUpONkdCMXl2RGtDVCtvQ0d1dz09IiwibWFjIjoiOTI2Nzg4NWM0NDZhZDAwZDc2YjYxOGYyMzY2NWZjNDcyMTJkZGE0ZjljOGZiNjIzZDFiNjBjNWRlYWUxYWRlYSIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6IjJ5QXYxNW1CcXIxVDRybEFORVZXcGc9PSIsInZhbHVlIjoicm9Bb1dlemlXRjU1Mm00UGcxNFYyQT09IiwibWFjIjoiMGVhYTBjMDdmODRiNDVhYThhNmE2MWFmOWExZTE1Zjk5NDRiYjVmMTM5YjU4OTNmNDNlYTNhYTM1YTg3ZDVkYSIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6IjJBY01oTENaZ2dTaEFyN2FhM3pkckE9PSIsInZhbHVlIjoiREp2MEd3SUczUGc5VWJuOCtjMWM2Zz09IiwibWFjIjoiYzA2YzAxZTc3ZmJjNmYwNGZmM2FjYTQxNDJiNzQ1NGM4MGZlMzc3ODI4Y2Q0MjA1NjEwMDc5OGZhZGY5ZmE0NyIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6IjlRNk5GTHZoWmN6YWd0N1JYcGZDYUE9PSIsInZhbHVlIjoiSTdTekdjNnpYSDF2T044QWlwT0hOQT09IiwibWFjIjoiMzY4MDZlMjFhMWQ0Y2QxMzllMTY4MTM1MGYzM2UwOTc0NWFiMTJmMDQ3NTE3Yzg5MmViZDA2NTA1ZWM4YzkxOSIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6IjltcmVaa2YrZGFGOUxqRy94ZzlJSGc9PSIsInZhbHVlIjoiZGhwSERJakRDUlYrYXI0UkFHUXdqdz09IiwibWFjIjoiNDkxMGQ1N2Y1NjcyNmUyMjRhYmE2ODkzZTBmYTI4ZGY5OWRmMTg2NGQ5N2M3ZTJjMTgxOTExOGNjMjQ5NTE2NiIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6IjNIbVZpd2JSZVlHMmJNZFNkakluOHc9PSIsInZhbHVlIjoiUzRIM1l6OE45TG5ONXViY29DemxSdz09IiwibWFjIjoiNjEyMThkMTBlM2E4NWVhNmY3YWY5ZDA5MWQxNTZhYTkzNjQ5ZWQxMTkwMjE2OTg2OWI2NTk1ZjI0MDEyYzY5ZiIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6IjRSeE5VYzh0Z01CdEx4Q3pxd0ZUMkE9PSIsInZhbHVlIjoic1kzQ2ptNkxMdjlhbHJjQVVRK2tqZz09IiwibWFjIjoiOTU4Njk3YWNkMjVlMzM3MmE2M2QzMmE1NWY2YzFlOWI2YjhlYTU4ZTczY2ZmNGFhYzg3Mjg1YzYxZmMyMDUxYSIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6IjVVeUdPcFNyR2F3RzBIQXJ6VkhRMEE9PSIsInZhbHVlIjoiaXN5TkN0TkN1bHhEb2tQeDRNNFpPUT09IiwibWFjIjoiNjkzYzBiYjRhOTMwYTZiOWFhM2RkNWI1MTA3ZjI5MDBjYzlhZGUxZjJiMmJjMjZmMDM1Y2M2YmM5MTU2MDQxYyIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6IjZmamlaaldCeGR4eGo5ZjRpQnJ0Mmc9PSIsInZhbHVlIjoiaHRpMmhzNGtEdDBWTGE2VWJlbjRaZz09IiwibWFjIjoiY2QwNWM1NDI4M2NkNGNjYzViM2U2MTBlMGY3ZWVkNWMwNTE0ZDAwMDk3NTlmNTk2OGY2OWQ0MGNiNWJlZTJhNSIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6Ik01QVd5Qk5pWEJhZmg3RXNxVlphd0E9PSIsInZhbHVlIjoiOU5HNUNlTklxb2liYUpWc2NXcEcvQT09IiwibWFjIjoiYWRiMWI5ZGJhZDkxMmZmZjgxNmZkNWRhYTZiNzk1Yjg3YmNkOGMyZTIwMTYwYWQ4ZWY1NzMxODkzODU2N2M1ZiIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6Ik05OW0zWTdJb1dMWmpMcTY4d1FNNGc9PSIsInZhbHVlIjoiNzJNQTdBcWJub2txcEJ1NVZzR3pWUT09IiwibWFjIjoiZGJhNWYzMTJiNDgxNjkxOTM5ZTk1NWQ3ODEzODE0MmJmN2Q5N2RhNWRiZGNkNWFlYjQwNWRiOTFjM2M1NDkzOSIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6Ik1JVVBDcEZUcHZrUlVsTks2TkZvaHc9PSIsInZhbHVlIjoiaWFFNk5aeGYxNTh5TS9XV0RNYVpHdz09IiwibWFjIjoiY2MxOTkzOGQ4NmIyOTI2YTc3MmFiNDRjZDNhNThhMDkwYzI1NjJiMzA1ZDBkYjc3N2JhYzkwNWIxNDA3MzJhNCIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6Ik1oOFVUbGlFN0s0b2hOaW9zZ1Ribmc9PSIsInZhbHVlIjoiV1I3UWRGRTBqOG94dzNnY1BvSWkyQT09IiwibWFjIjoiZjdiOTI3ZTk4Njk3MzY0ZWUyOTE0MWVhYWM1ZmYxZGYzZTE4Mjg0ZTIxOGEwNDJiNDYyNzQyNjVlNWEzNjkzYSIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6Ik4zTGpZUE1YMjZPcG50VkhuS2VkbEE9PSIsInZhbHVlIjoidWFBSGVEN20ydUtIaHdWMkQxRXRUdz09IiwibWFjIjoiMGY5YmExMjdhYzUzZjY5N2E3ZjUzNzZiOTBjN2YyNjYzMGQ5MzNlZGYxODFjOTYzMTY4OTA1MmEyZWUwYzExNCIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note/96 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6Ik5EM1Q3TzJDeXpGa0Y3Mmd6Nm9lcUE9PSIsInZhbHVlIjoieC8yNmpEc3BqbFZSNklhODFaeHNuZz09IiwibWFjIjoiNTAwNWUxNGI2ODY3NzNjMWQxOGFiNzA2YjU2NTk3YmEzM2YxYmU2MmUxYmQwY2FhZjhhMjAyODAwY2FjODFmMCIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6Ik5sQmJlL1JqRzRHelpBT3NjQWF2clE9PSIsInZhbHVlIjoiM3Z1MFI5WnlGcUszekJCYks2QjV4Zz09IiwibWFjIjoiOGQ1MmU5OTJkMzdjZDViODEyNzEzOTcwYzljMWExMWM2YjIxODVkZjEyMWMwMzI1MmMzYzUxMjM2ODJlNWM5NSIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6Ik95Z0RoQmZicVowTHNPYlRQbUo4ZUE9PSIsInZhbHVlIjoiWlYzMWdVc1Evb2xxTWdZcnNwYndxZz09IiwibWFjIjoiYzU2MWQ5ZWQ3MjhhZDk3YjYxMzA2ZjUzMjA2OTNjNTk3Y2I5YWJjOTMwMGE5ZjE2Y2Q0MTFmODEzOGJlNTY2MyIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6Ik9CVHh4TlNrWmsrcUVZM2NYYXJNeHc9PSIsInZhbHVlIjoiMG1PQUF1YmxwRlAvVnRYYjhJcXBCQT09IiwibWFjIjoiOTMwYTg0ZDVmNTBlNGNiZWZmMjkxZGE0M2ZlZGE1NDIzYWJkMzM0YWU3MDM4NWU0N2FhMWRmMzg4YTM4MTU2NCIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6IkdmWXliZUFvRVM2dy9PUUovN3huNVE9PSIsInZhbHVlIjoiK2NRcm9JSnNtc2NKQ2FDbldrNnV4UT09IiwibWFjIjoiZDc1ZjA5MjY0MzFmNGM4YWJmODQ3Nzk3NGViNGE2MDQ4OTEwNTMyMWQ5OTc5M2RiY2MwMDc4NTQyNTlmNWNkNyIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6IkdzRmJYeHNjemhuTXJmTkUyaGlvM0E9PSIsInZhbHVlIjoiNDY1SW9QU3RtWkNRWTQwSzNXN2tSZz09IiwibWFjIjoiZmY1NDYxNGRmOTQzN2QxYWM2MTNkODMxNjY4MDk5OTA4NzU1ZTk3NWYwMDI4YTIwYzExMjE1ZGM4ZWU3MjQyMCIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6IkMwN1BSRmFLMHdzNUlOdDBST3c3K0E9PSIsInZhbHVlIjoiMFpxT2EwelBmajFJR0pHN0E0QjJFdz09IiwibWFjIjoiNWU0ZTQ0NzZhNDkzNGJkN2E0ZmIyNDA4MTEyN2Y4Njg5MWE3ZGM2ODVjZjQ5ZGI1MjZhYTU3NTYwM2NjZDMyYSIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6IkNPdDFmMkQxTHRzVGh1bGF2bmxZTmc9PSIsInZhbHVlIjoiaXJFWEV3cktSRUZqYUJkL3BhSGFYdz09IiwibWFjIjoiMWYzYmVlYWYzNTViZDE2OWI4MTE1OWRmNDkwNjk0OTZjN2ViYmFhMTNmYzUwN2Y0MDljYmM2NTc5ZjRkZWI2YiIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6IkpEY0VZY1Z4bi9oOEJIYy91bVFmUFE9PSIsInZhbHVlIjoieUNyVHBxNGw0UVN6ZG5CWVBsa1hFUT09IiwibWFjIjoiMmExNTQxNzg2MzNmZDRhOTJjMmE2M2JlMGI3N2IwN2RmYjMyMjIwNjRjM2E2ZjM5NWM2ZWMzZmQyODc2ODdmNiIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6IkpLcDJMOFJwOFpCaDBHVFNGK0k0Zmc9PSIsInZhbHVlIjoiMFEyOVFlbmZoM1BFSzRoZVNzdnl0Zz09IiwibWFjIjoiM2QyNzZjZWJmYzdhZWM3NzkzODA4MGE0N2Q0NTViYTRiYWEwMTI5MWM5OTRjYTVjNWYxYzliMzhkODNiZGNkMyIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6IkppN0oxZVByNXVCeW9IYy9UbXlYQ1E9PSIsInZhbHVlIjoiWnIrSERFUXhjOTE0cjB6bkFlZEU1UT09IiwibWFjIjoiNWFhYTk1NTk5NDllNmY5NzZlNTE1NGU1ZWNmN2VlMDcwNDJhYmE0MTJmZDFjZjUzMDdjZGM1ZWQyOTNjYWQ5ZCIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6IktBWEhuUWlsaC9XTUR6NnV6RlVLOEE9PSIsInZhbHVlIjoiaGd5TUxaR2JXWWhPMVdRMmhpTVloZz09IiwibWFjIjoiYzI2ZDg3MWQ0NWUyOTczNjMxM2E0NzI1N2Y5MTRmNWY1Mzc1MGQ2MDE0NzFkNGI0OTQ2MTRmZjM0ZmY3NzNlNiIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note/94 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note/99 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6IkVOVWM0MjU0TmVLN0d5SzIwL3BEanc9PSIsInZhbHVlIjoiOE9wdFptd05qT3kwb2hPdDJpc0g4QT09IiwibWFjIjoiYjliZjZlNWFkOTZlNmJhY2E1MzE5ZmJjNWYyZTE3NGI1NjY3ZTNkOTI5OWNhMzRhMjg4OTE2YTA3OGM5N2ZlOSIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6IkxIZ0NtdklCTVlmZUlST285NG9ZOUE9PSIsInZhbHVlIjoicEZUazhHcVhWZ2pOZHlQaUlsUndCZz09IiwibWFjIjoiYzg3NjFmOGUwYzFhMDk2NDYyMzFhOWU5MDBiZWUzMGM0ZTRhZWE1MGU0OWZhMjcyOTMxYzVjOTE4ZDA2ZDM3NiIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6IkxsL2IrZFMzUjBvZG9rMjB6dktwMmc9PSIsInZhbHVlIjoiU3pMdjBQUWdocXp2dHhoalFCOWpLZz09IiwibWFjIjoiNTI1OGE4NjRiYmYzMTcyMWM4MzczMGVmNTVlZjY2MTI5NDlkNzhlNDBkZDk5YjMyODc0ZjNmYzA5NWIyMTZjNiIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6IlBiZEtuSWVXL3ltb1hHeWhxeEN4N2c9PSIsInZhbHVlIjoiZEszT2RSNnBCOXNBQXdrRVA3eVJWUT09IiwibWFjIjoiYTI0ZDc3N2IzZjY3NDAwOGUzMjJlM2VhNmQzNWVjMGM2MWQ4OWQ5ZDAzYTJiZDEzNmFmZDFhNjJlY2IxMzJlYSIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6IlBUZ2NZNlYxNWlWekJnQnF1UEhIYUE9PSIsInZhbHVlIjoiQzNCa2NIbTc0c3FvNnduZUxjWjV1UT09IiwibWFjIjoiYTU1NmVkYzcwN2M4YmZlYjllN2E4NmVmYmRhYzgwMDg3N2ZhNTZmZmU2MDY5MDA3OWFiNTM1ZDcyMWZjNjU0NSIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6Ild1R3lIRTRESnluZHZkVHZzU2hOM1E9PSIsInZhbHVlIjoiYXVZdVlsNTgwakNYR2tLb21BVytMUT09IiwibWFjIjoiZjI3Yzg0OGFlOWZjZjFhYzlmZmMyY2Y4NWNmZmZhZDdhNmE3NmQ5NjM0ZDk1ODY1Zjg5ZWI3YjlkOTgyY2FlOCIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6IlFOL3UzbEx5L2pFb2tWaFMrclozdUE9PSIsInZhbHVlIjoiUDh2elpmY2V3amZXNGx6ZkxQTUYxUT09IiwibWFjIjoiNTZmMDY4YzFhYzFiZmQxNWYxYzQ1OTc4ZDAwYTY1MmJjYTg0YzQ3ZDM3Yzk1OTA0MGJlYmU1YzY3YThlNGVmZSIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6IlN4cDdVbjE1Z3dDeDFWc3Q2a0wyN0E9PSIsInZhbHVlIjoiUUR1dllEZ3dMeHpFbGMxbHMwMC96UT09IiwibWFjIjoiMjFkMzBiMDI3YTFlODUxZGFmZjA3OGM0ZDdiYmU2NzM3ODU2MTQwMzhmOTM0OTIwYzg0NWE5ZTRmOTg4ZjlhZSIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6IlNoOUY4Y2YzbGErVDR4blA0N1VsWWc9PSIsInZhbHVlIjoibk5UVk5iV0grRzJ1aE1XbEpObWJ3Zz09IiwibWFjIjoiYmRiN2ExZTlhODhhODk0NjQ5MGM3ZjI1NGMyYjJkNDc4MTY0Mjg1ZDA4NzI2OGJhNjljMTFmZTFjMDk4MGExMCIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6IlpBODJlZlQyV1pJSTRlVzh3aWdNUXc9PSIsInZhbHVlIjoiWlI2WWtLM2c0clVaRVJ6bkRtREJlZz09IiwibWFjIjoiNzE1MTJhODUwNTIzMDhmZTM4NTE4MzNhMGQ1OTEwMWFhYjk4Y2QzODExZDllOWRiZjEwY2M3ZDI4YmJlMDdlNyIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6IlUyRDdSUlhLaEZsaDFvaURrbnJqS3c9PSIsInZhbHVlIjoianFjbklNZVdNYkVsZlViSkFIVVZ3QT09IiwibWFjIjoiZmJjM2M5MTUyYjc2MDI0Zjg0NTcxYTRlMDY2OWFmMWE5NGUwN2Y3MDUwM2U4OGNjNGM0NmU4ZmFkNTYzNDQxOSIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6IlVGTmlqTkJ5eUx6L2FTYzlZdU44UVE9PSIsInZhbHVlIjoiMTZRMHl1TE5TTFNWVzk1YVgvSm12Zz09IiwibWFjIjoiOTNkNDdkZDY0MmVhYzhmZDEyMDViZGNkZDM5YTEwOGNmMTRkMjU4Y2I5NjAzYTJiODhhODE2MTYzNWI0MTMyYiIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6IlZCOHEwT1NIcEp1UDhvRXZUbjRKUFE9PSIsInZhbHVlIjoibkhZMG02ZE1pWUZkU25TWFdzcEtSQT09IiwibWFjIjoiMmNjNTM4Njk4YTQ1NTg0MTNmNzIxMzM0MWZkMTM5NmQ2ZjgxY2Y2N2YzMWJmMTA2OWY3MjkxMWNjMTMwMWFmZCIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6IlZHdFN2ZVlXOXdBR2lBYnl5Rm5rYUE9PSIsInZhbHVlIjoiOUYvMEpMV25ZakFWN2VyclBGcndHZz09IiwibWFjIjoiMDg3Yjk3MjUwYzg3MzcxNDgyZmIyMmYwMTA1ODRjM2I5OWQ1ODE0NWQxZDk3MWM4NmNkNGEzZGM5MmQ2M2I0YyIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6IlZQNXdmRlNldDNwT2drNWlIQUNncEE9PSIsInZhbHVlIjoicjFQMDNLTGxYV3drQWl2cW5JdFNoUT09IiwibWFjIjoiYjliMGZkYTQxMWY1OWNhNzk0NWM4NWY2M2EwMjAzYWQyZjQ1MjFkYzcwNDc2NWE3NjJkMWM3ZmM0NmYyYzE4MCIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6Im04dDZhTlZubXR0UThUUlVpUEpBVFE9PSIsInZhbHVlIjoiVkdGV0gwNUtsY3dsaFIzNlJsclBrUT09IiwibWFjIjoiNzc4OWVmZTFlZWI4YWVmNTY5NTMzMjFiY2FkMDNjMzA1MjcxZDY0ZjM3YjA4NDhkNmUxOThkNTBhMGZhN2NjOSIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6Im5wQzN4RzZrNUxHKzV0eDJaSGpsUWc9PSIsInZhbHVlIjoiL2hDem05TEVQRFowaE1MNGRxdTRMZz09IiwibWFjIjoiMjQ0MzYxZjk0NzNiYmI0MjgxY2ZlZGUzYTQ2NTE2MDg5NTE0NDQ2ZmYzMjU2OTgyMjUwZTBhYmE3ZTg1MjBiZCIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6Im8yZFpZR0t4M3hpb0ZGQ01BUGdoYnc9PSIsInZhbHVlIjoiNVJQUXJGemt6UjRvYUdIeVhUUDBpUT09IiwibWFjIjoiMzNhOGNiZGNiODA4YmQ3MmJiZGUwOGU4NjcyYWRmOGE0MzZjMTg5ZmE1ZDQxZmZlMDE2MmE4YTM1YTRmNTIzNyIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6ImFaZWxnbVErdnZySU9ucVorRmk5UVE9PSIsInZhbHVlIjoiWm5QdmxKZkYvVnpPdzJwSFJnWW9Gdz09IiwibWFjIjoiMjUzNjgwYWE5MDdmY2M4MDdmMTliNjEyYzkzODY1MTgyZDIzZjMxMTUzYTdmNWVkODQ5MGExM2M2MWZhYzIyMyIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6ImFiaVNMSkQ5VS9OSVZjSi9CMDhJUXc9PSIsInZhbHVlIjoiNHVMMUFUUFpvT29kOXNXOHYwUVBKZz09IiwibWFjIjoiOWI0ZWFkYTU0MjZmYjg0MTA4YTBlNmU2NzY2YmU3ZjMyNTUzNjA1OTMyMmQzMjljYjk2NjQ0YWFjN2RmYzlmOSIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note/94 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note/99 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6ImhseU5JWG1yL1VnVzlSUUlDeVZ1UGc9PSIsInZhbHVlIjoidTdNRE53dGhzRTZIZFhXbXBBd0dYQT09IiwibWFjIjoiNmI4ZTRlMTc5OTY1MjU2YzZhMGVlYjA1ZDY4OWMxOTZkN2VjODMyNDEyYzNkODUzYjIyNTM3MmNmMTViOGE4ZSIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6ImJCZTlqQk9nWlJXNnVlMnZyVVRWUUE9PSIsInZhbHVlIjoiQ3pST1JLNG1wM2VBMnZGZklhN3ZIUT09IiwibWFjIjoiZDViNzNjYzMwMTBhNGE2NzgyMDM5ZmE1NDgxZTM0ZWQ3YWFlMTBiNDc5OWFjNThmY2FkMTI2MWIxMmZiNTk1YiIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6ImJndnMrUDZrM21pb0JqVk1nKzFGaHc9PSIsInZhbHVlIjoiK3NSU0k2QkpjUWVlNmc3NjJGVk1VUT09IiwibWFjIjoiYmRmZmViMGYyNDczMWQxMTgzOWZmMDkzNmRiYmEzZjc0ZTZiMjY3ZTAwN2RiNDFmMTYxOGU3MjIyOGEyMjE0NSIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6ImJUWlY1WUVOWkhzbkozSmpTT2w5RUE9PSIsInZhbHVlIjoidVFKTU1yU085RDlMcVZSQTBzQlVkQT09IiwibWFjIjoiZWI1ODU2ZjA0MTAxMjI0NWQyNTg5MDJlMzI2Njc5NDFjOGVlZmQ3OTM0OTVlNWJkMzhlNWJhYTQ0YTM2ZmE2MyIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6ImlGaHU3M0E3REFndEUvRldrZXRsMXc9PSIsInZhbHVlIjoiN2xMUzVuY05LS1B0R0FZYWFEM1NwUT09IiwibWFjIjoiNDdiYWZjMGFmMWQ0YTM0NTBkNzZjMWExNGUxYzM0ZmE5MTM4NzViZWU2OGRhZjZhZjU1M2UwZWY3YTIwOGMxMSIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note/96 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6ImNKbE1xRHNvcWhoRnJiWlpXeEJjdEE9PSIsInZhbHVlIjoiSVNFb2t5NEhmN2I1L1hYcVNXYy9QZz09IiwibWFjIjoiM2Q1ZjIxMTMwMmQzZThhMjBmYzQ2ZGFjYWU0OGYwYTNmNWEwNDM0Yzc4Mjc2OGNkNjhlYjE3ZGE2MjUzNGE2OCIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note/95 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note/100 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6ImRvMVgrY0pqd0N0NzFpeHN5M0NUb1E9PSIsInZhbHVlIjoiVHIxNVdHR3lXdDBMR3JLeDVKOXdHdz09IiwibWFjIjoiZWU3YjZlYjQzMTgyNjE0ZGQxNzg4MTJmMGU4M2I5ZDQ3ZDZiN2E3YWE5OWRlOTJmZTczMGE5YWRiMzhjZTg4MyIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6ImsvTU5HMW1oZFhQY0VjMG9mRHFLN1E9PSIsInZhbHVlIjoiWWUvOHl1dVNveTdSWmhIb3lzS1hJUT09IiwibWFjIjoiNWYzMWU1MzYzMDQwNDZiOGNjMTQ4ZmUzYmI3NWFiYTgxNmFhYzEyZmJlNGYxODA2Y2M4MTk4NGJhYmRlY2Y1NiIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6ImtQUmlySkkwWU44b0hORmErdDIyU0E9PSIsInZhbHVlIjoiS0dneEpQQnI3Qk5tUUU1NE1FOUNodz09IiwibWFjIjoiODg3MWQ2MWM3MTRmM2EzZDFkZTRjNGU4Zjg3Y2YwY2ZkMDVkZmNjMDZkYTNjMTU4YzBiZGFlMTc2ZWE5ZjA3NiIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6ImVnVyszVUlWb2k0SkZFZ1hYejZvWEE9PSIsInZhbHVlIjoiUEJKU3VtMitURVVLZFlPSzV1cE9EUT09IiwibWFjIjoiZDdmOGQ5MTgwM2VkOWZkZDhjMDY1YTU3ZWVhZWVmZGIwZmNlNzQzZjQ3ZTNjY2JmNjA4NDcwYjcwOTJjYzk2NiIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6ImVzdi9oekJGSUVJNEI5TXYyWkFkU0E9PSIsInZhbHVlIjoiMmRIeFV3OUhMa3hoSkt2NE5wZnJaQT09IiwibWFjIjoiY2FiMTZlYjJlMzQyNTU0MzNlMTc0ODIxNmFhY2FlYjdmZDE2ZjQ5YmI0YTc2ZGQzMjA3YWZmZmNmNjhjMzA5NyIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6ImY5b3p2TytZMmJPWW10RUd5L3VkL3c9PSIsInZhbHVlIjoidllHVjhob0lzZDVnU2hxTGlpY3k3UT09IiwibWFjIjoiM2RlYjA2ZTI0OTVlOTkxNDA0MWEyNzdjOWJhZWJkMjA3N2I2MWRhNzAyZTYxZjg5MTFmMDk0YzU1YTZkZDlkMSIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6InA4WDRxNnZvSFo0NWNlRWJDalNsNkE9PSIsInZhbHVlIjoiaDExa0RyYUkzeDZZSWEvWUdEbldldz09IiwibWFjIjoiOTUxNGUzZjM1MTViMjdkNTI1NDcwNTZkOGRlZTBkOTJhMzdjNTFiZGRmNGViMDI4MDc0NTE0NWE1NmYxNmQ3NyIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6InEyZVN1T0hPQXdxTlAxWG1lMmhJMFE9PSIsInZhbHVlIjoiS2xCMW1kWkd2TFROQjZOelJzYnd6UT09IiwibWFjIjoiYzA2NTU1ZTVmZDc5NDBjNjliODg5NTc5MzJmZjU4ODU2ZGZiOTg3NjRkMDg1YzU2M2E5MTU2ZGFiYmZjMjU3MiIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note/93 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note/98 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6InFXeUQ3TFhISWxFWEpPWXVuaHRpa3c9PSIsInZhbHVlIjoiNXNWQnhibm9RUWtCck5nWStEMEw3QT09IiwibWFjIjoiMjgxNWI0OGU5ZjE3MmUxMzcxYjk3NWI0ZDEzNWNiNWQ1NTc0ODdjMTQwMzJjYjU2MWNmNDUyZTFlY2E2MWE3NCIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6IngrZG5xT0NXNEYxK1FkSStEN1JnL3c9PSIsInZhbHVlIjoiQVBib1hOanE3Vy92MmwzREVLeGpDQT09IiwibWFjIjoiZjU5MWQ4YmUyZjU4ZDU3ZDZlMDQ3NDZhY2YyYTlhN2M4NWU4YTgwNTQ0NzI3ZjA1NGVlMWY5NTk4Y2NjMjNkNCIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note/93 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note/98 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6InhGMjIzaUZQRzhaeldXaWFXcWFkVWc9PSIsInZhbHVlIjoiSHZqbkZySjUrQ1RLSlJJWjFobGxXUT09IiwibWFjIjoiNmFlZTRmZGE4YmMyYWFkZDI5NzRkYjA0YWM5MjNjNzJlODM1ZDc5NTU1YTBkZGNiMzBkYmJkNjgyMzEyODU3MyIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6InJpLzF2Z1pqcjM5eWVVRndmWXdza2c9PSIsInZhbHVlIjoiNnJkZTdlR1djVkt5L2Zla1FIdFBzZz09IiwibWFjIjoiODc4NDllMTQ4MDdhYjAwOGYyODYzNjA0NTI0N2VlNWI4M2U1Nzk4NTdkNmMzNjJiZjEwMjZhNmJmNjFhYzY2MyIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6InlvcTRuM0Voa3ZZU0JWWCtpcDBZY3c9PSIsInZhbHVlIjoiWUsxRUhhTDkvYkg2NVl6eURzMThuUT09IiwibWFjIjoiM2ViMjg4MWVlMTg1NmU2ZWE3MjA4ZWQxYWUxY2M5YWVmMmVjMzE3NGU4ODVjOGY4ODhhZWVkNzlkNzk4OGYyOCIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6InNmTEJsM1JaUng3TGZsUW9wVklleUE9PSIsInZhbHVlIjoiL0FhSjVGWnBQdmZWSHVpb3ZDV2Zmdz09IiwibWFjIjoiOGRkNjQzY2M5NTllMmRkZGEzMTVmNzMwYTk5ODAwYWViZmJjMDcxMzYwNzA5NmQ2OGRlNGYyZDZiM2VjYjQ1ZiIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6InRvT3A2cFNlRXdVcW8vVWNPTFRhRGc9PSIsInZhbHVlIjoiZ2VBcjE3OXRtR3dBY1o1aDlwbUpTQT09IiwibWFjIjoiNmI0Mjg2MjhhZDY3NWM4MmI0YzJjNTgwZDI2MGIzNWM3NDE1YjQxOTNlMGZjOWFiMTc4OWExZDkyM2U1MjA0ZCIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6InVIM3J2a1EzYWM1Q1JlV2dwcEU4cUE9PSIsInZhbHVlIjoiWXQrR0QrbHNmK1lwcSt0RWFIMGVpUT09IiwibWFjIjoiMDkwMWVhZmUxMzdlMmVkZGExODQ5ZGI1YjM5ZTVlMWFiNDMxMTkwMWRiYmY3Y2YzNzM3YjhkNDhhNzVhZDVlYSIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单详情
- URL: https://ecom-demo.workdo.io/order-view/eyJpdiI6InZMaXRkcE51cDMrWHhIOHQyKzBiQlE9PSIsInZhbHVlIjoiRVM2Q1FSdm5tWjgyUHVaR01LcFVlZz09IiwibWFjIjoiMzNlZmYxMjNjNjY2ZDZmNGYwZTgwMDM0ZDNhZDE5YTZjZGU2ZDMxMTI1NmI3NjlhYTZlZjIyMzllNjAxMWNjYyIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/order-note Method: POST
    - [hidden] _token — 
    - [hidden] order_id — 
    - [submit]  — 标记
    - [select] note_type — options: Private Note, To Customer
    - [textarea] note
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 页面
- URL: https://ecom-demo.workdo.io/pages
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 计划
- URL: https://ecom-demo.workdo.io/plan
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单总结
- URL: https://ecom-demo.workdo.io/plan-stripe/eyJpdiI6InJJZHpCU2tGVlVBZTVsUG9VV0RrWWc9PSIsInZhbHVlIjoiU2xrNWtiQkpFektqRUR0cExQQWdEQT09IiwibWFjIjoiNTZiODNmMGFjNWExZTkwMjY5MTU3NjIzOTI2ZGQ4NzY3ZmExMTEyZjM4Mjc3ZmFiYmRjNzg3OGQxZDJkOTRmZCIsInRhZyI6IiJ9
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/plan-stripe-payment Method: POST
    - [hidden] _token — 
    - [hidden] total_price — 
    - [text] name — 卡上的姓名
    - [text] coupon — 卡上的姓名
    - [hidden] plan_id — 卡上的姓名
    - [submit]  — 卡上的姓名
  - Action: https://ecom-demo.workdo.io/plan-pay-with-paystack Method: POST
    - [hidden] _token — 
    - [hidden] plan_id — 
    - [text] coupon — 优惠券
    - [button]  — 优惠券
  - Action: https://ecom-demo.workdo.io/plan-pay-with-razorpay Method: POST
    - [hidden] _token — 
    - [hidden] plan_id — 
    - [hidden] total_price — 
    - [text] coupon — 优惠券
    - [button]  — 优惠券
  - Action: https://ecom-demo.workdo.io/plan-pay-with-mercado Method: POST
    - [hidden] _token — 
    - [hidden] plan_id — 
    - [hidden] total_price — 
    - [text] coupon — 优惠券
    - [submit]  — 优惠券
  - Action: https://ecom-demo.workdo.io/plan-pay-with-skrill Method: POST
    - [hidden] _token — 
    - [hidden] plan_id — 
    - [hidden] total_price — 
    - [text] coupon — 优惠券
    - [submit]  — 优惠券
  - Action: https://ecom-demo.workdo.io/plan-pay-with-paypal Method: POST
    - [hidden] _token — 
    - [hidden] total_price — 
    - [text] coupon — 优惠券
    - [hidden] plan_id — 优惠券
    - [submit]  — 优惠券
  - Action: https://ecom-demo.workdo.io/plan-pay-with-flutterwave Method: POST
    - [hidden] _token — 
    - [text] coupon — 优惠券
    - [hidden] plan_id — 优惠券
    - [button]  — 优惠券
  - Action: https://ecom-demo.workdo.io/plan-pay-with-paytm Method: POST
    - [hidden] _token — 
    - [hidden] total_price — 
    - [text] mobile_number — 移动号码
    - [text] coupon — 优惠券
    - [hidden] plan_id — 移动号码
    - [submit]  — 移动号码
  - Action: https://ecom-demo.workdo.io/plan-pay-with-mollie Method: POST
    - [hidden] _token — 
    - [hidden] total_price — 
    - [text] coupon — 优惠券
    - [hidden] plan_id — 优惠券
    - [submit]  — 优惠券
  - Action: https://ecom-demo.workdo.io/plan-pay-with-coingate Method: POST
    - [hidden] _token — 
    - [hidden] total_price — 
    - [text] coupon — 优惠券
    - [hidden] plan_id — 优惠券
    - [submit]  — 优惠券
  - Action: https://ecom-demo.workdo.io/plan-pay-with-toyyibpay Method: POST
    - [hidden] _token — 
    - [text] coupon — 优惠券
    - [hidden] plan_id — 优惠券
    - [hidden] total_price — 优惠券
  - Action: https://ecom-demo.workdo.io/plan-pay-with-bank Method: POST
    - [hidden] _token — 
    - [file] payment_receipt — 支付收据
    - [text] coupon — 优惠券
    - [hidden] plan_id — 支付收据
    - [hidden] total_price — 支付收据
  - Action: https://ecom-demo.workdo.io/plan-pay-with-paytabs Method: POST
    - [hidden] _token — 
    - [text] coupon — 优惠券
    - [hidden] plan_id — 优惠券
    - [hidden] total_price — 优惠券
  - Action: https://ecom-demo.workdo.io/plan-pay-with-iyzipay Method: POST
    - [hidden] _token — 
    - [hidden] plan_id — 
    - [text] coupon — 优惠券
    - [submit]  — 优惠券
  - Action:  Method: POST
    - [hidden] _token — 
    - [text] coupon — 优惠券
    - [hidden] plan_id — 优惠券
    - [submit]  — 优惠券
  - Action: https://ecom-demo.workdo.io/plan-pay-with-Benefit Method: POST
    - [hidden] _token — 
    - [hidden] plan_id — 
    - [text] coupon — 优惠券
    - [submit]  — 优惠券
  - Action: https://ecom-demo.workdo.io/plan-pay-with-cashfree Method: POST
    - [hidden] _token — 
    - [hidden] plan_id — 
    - [text] coupon — 优惠券
    - [submit]  — 优惠券
  - Action: https://ecom-demo.workdo.io/aamarpay/payment Method: POST
    - [hidden] _token — 
    - [hidden] plan_id — 
    - [text] coupon — 优惠券
    - [submit]  — 优惠券
  - Action: https://ecom-demo.workdo.io/plan-pay-with-paytr Method: POST
    - [hidden] _token — 
    - [hidden] plan_id — 
    - [text] coupon — 优惠券
    - [submit]  — 优惠券
  - Action: https://ecom-demo.workdo.io/plan-pay-with-yookassa Method: POST
    - [hidden] _token — 
    - [hidden] plan_id — 
    - [text] coupon — 优惠券
    - [submit]  — 优惠券
  - Action: https://ecom-demo.workdo.io/plan-pay-with-Xendit Method: GET
    - [hidden] _token — 
    - [hidden] plan_id — 
    - [text] coupon — 优惠券
    - [submit]  — 优惠券
  - Action: https://ecom-demo.workdo.io/plan-pay-with-midtrans Method: POST
    - [hidden] _token — 
    - [hidden] plan_id — 
    - [text] coupon — 优惠券
    - [submit]  — 优惠券
  - Action: https://ecom-demo.workdo.io/plan-pay-with-nepalste Method: POST
    - [hidden] _token — 
    - [hidden] plan_id — 
    - [text] coupon — 优惠券
    - [submit]  — 优惠券
  - Action: https://ecom-demo.workdo.io/plan-pay-with-payhere Method: POST
    - [hidden] _token — 
    - [hidden] plan_id — 
    - [text] coupon — 优惠券
    - [submit]  — 优惠券
  - Action: https://ecom-demo.workdo.io/plan-pay-with-khalti Method: POST
    - [hidden] _token — 
    - [hidden] plan_id — 
    - [text] coupon — 优惠券
    - [submit]  — 优惠券
  - Action: https://ecom-demo.workdo.io/plan-pay-with-authorizenet Method: POST
    - [hidden] _token — 
    - [hidden] plan_id — 
    - [text] coupon — 优惠券
    - [submit]  — 优惠券
  - Action: https://ecom-demo.workdo.io/plan-pay-with-phonepe Method: POST
    - [hidden] _token — 
    - [hidden] plan_id — 
    - [text] coupon — 优惠券
    - [submit]  — 优惠券
  - Action: https://ecom-demo.workdo.io/plan-pay-with-paddle Method: POST
    - [hidden] _token — 
    - [hidden] plan_id — 
    - [text] coupon — 优惠券
    - [submit]  — 优惠券
  - Action: https://ecom-demo.workdo.io/plan-pay-with-fedpay Method: POST
    - [hidden] _token — 
    - [hidden] plan_id — 
    - [text] coupon — 优惠券
    - [submit]  — 优惠券
  - Action: https://ecom-demo.workdo.io/plan/company/senangpay Method: POST
    - [hidden] _token — 
    - [hidden] plan_id — 
    - [hidden] total_price — 
    - [text] coupon — 优惠券
    - [submit]  — 优惠券
  - Action: https://ecom-demo.workdo.io/plan-pay-with-cybersource Method: POST
    - [hidden] _token — 
    - [hidden] plan_id — 
    - [hidden] total_price — 
    - [text] coupon — 优惠券
    - [submit]  — 优惠券
  - Action: https://ecom-demo.workdo.io/plan-pay-with/ozow Method: POST
    - [hidden] _token — 
    - [hidden] plan_id — 
    - [hidden] total_price — 
    - [text] coupon — 优惠券
    - [submit]  — 优惠券
  - Action: https://ecom-demo.workdo.io/plan/company/myfatoorah Method: POST
    - [hidden] _token — 
    - [hidden] plan_id — 
    - [hidden] total_price — 
    - [text] coupon — 优惠券
    - [submit]  — 优惠券
  - Action: https://ecom-demo.workdo.io/plan-pay-with-easebuzz Method: POST
    - [hidden] _token — 
    - [hidden] plan_id — 
    - [hidden] total_price — 
    - [text] coupon — 优惠券
    - [submit]  — 优惠券
  - Action: https://ecom-demo.workdo.io/plan/company/nmi/payment/3 Method: POST
    - [hidden] _token — 
    - [hidden] plan_id — 
    - [hidden] total_price — 
    - [text] coupon — 优惠券
  - Action: https://ecom-demo.workdo.io/plan-pay-with-payu Method: POST
    - [hidden] _token — 
    - [hidden] total_price — 
    - [text] coupon — 优惠券
    - [hidden] plan_id — 优惠券
    - [submit]  — 优惠券
  - Action: https://ecom-demo.workdo.io/plan-esewa-payment Method: POST
    - [hidden] _token — 
    - [hidden] total_price — 
    - [text] coupon — 优惠券
    - [hidden] plan_id — 优惠券
    - [submit]  — 优惠券
  - Action: https://ecom-demo.workdo.io/plan/payment Method: POST
    - [hidden] _token — 
    - [hidden] plan_id — 
    - [hidden] total_price — 
    - [text] coupon — 优惠券
    - [submit]  — 优惠券
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 没有
- URL: https://ecom-demo.workdo.io/pos
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action:  Method: GET
    - [text]  — 
    - [text]  — 
  - Action: https://ecom-demo.workdo.io/empty-cart Method: POST
    - [hidden] _token — 
    - [hidden] session_key — 
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 产品
- URL: https://ecom-demo.workdo.io/product
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 产品
- URL: https://ecom-demo.workdo.io/product/create
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/product Method: POST
    - [hidden] _token — 
    - [text] name — 
    - [text]  — 
    - [text] slug — 
    - [number] product_weight — 
    - [number] price — 
    - [number] sale_price — 
    - [hidden] track_stock — 
    - [checkbox] track_stock — 
    - [radio] stock_status — 
    - [radio] stock_status — 已售出
    - [radio] stock_status — 在后台订单
    - [number] product_stock — 
    - [number] low_stock_threshold — 
    - [radio] stock_order_status — 没有
    - [radio] stock_order_status — 允许,但通知客户
    - [radio] stock_order_status — 允许
    - [hidden] variant_product — 
    - [checkbox] variant_product — 
    - [hidden] trending — 
    - [checkbox] trending — 
    - [hidden] status — 
    - [checkbox] status — 
    - [hidden] custom_field_status — 
    - [checkbox] custom_field_status — 
    - [file] file — 
    - [file] cover_image — 添加封面图片
    - [file] downloadable_product — 可下载的产品
    - [file] preview_video — 视频预览
    - [text] video_url — 视频的网址
    - [text] custom_field — 
    - [text] custom_value — 
    - [select] category_id — options: 选择一个类别, Watch, Mobile Phone, Laptop, Headphone, Earbuds
    - [select] tax_id[] — options: 
    - [select] tax_status — options: Taxable, Shipping Only, None
    - [select] brand_id — options: Select Brand, VIVO, Apple, SAMSUNG, SONY, Panasonic, Lenovo
    - [select] label_id — options: Select Label, Special Offers, Collection, Tranding
    - [select] shipping_id — options: Select Shipping, Delhivery Courier, Blue Dart Courier, FedEx Courier, DTDC Courier
    - [select] preview_type — options: Video File, Video Url, iFrame
    - [select] attribute_id[] — options: Color
    - [textarea] preview_iframe
    - [textarea] description
    - [textarea] specification
    - [textarea] detail
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 属性
- URL: https://ecom-demo.workdo.io/product-attributes
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 产品品牌
- URL: https://ecom-demo.workdo.io/product-brand
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 产品标签
- URL: https://ecom-demo.workdo.io/product-label
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 产品
- URL: https://ecom-demo.workdo.io/product-list
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/product/27 Method: POST
    - [hidden] _token — 
    - [hidden] _method — 
  - Action: https://ecom-demo.workdo.io/product/26 Method: POST
    - [hidden] _token — 
    - [hidden] _method — 
  - Action: https://ecom-demo.workdo.io/product/25 Method: POST
    - [hidden] _token — 
    - [hidden] _method — 
  - Action: https://ecom-demo.workdo.io/product/24 Method: POST
    - [hidden] _token — 
    - [hidden] _method — 
  - Action: https://ecom-demo.workdo.io/product/23 Method: POST
    - [hidden] _token — 
    - [hidden] _method — 
  - Action: https://ecom-demo.workdo.io/product/22 Method: POST
    - [hidden] _token — 
    - [hidden] _method — 
  - Action: https://ecom-demo.workdo.io/product/21 Method: POST
    - [hidden] _token — 
    - [hidden] _method — 
  - Action: https://ecom-demo.workdo.io/product/20 Method: POST
    - [hidden] _token — 
    - [hidden] _method — 
  - Action: https://ecom-demo.workdo.io/product/19 Method: POST
    - [hidden] _token — 
    - [hidden] _method — 
  - Action: https://ecom-demo.workdo.io/product/18 Method: POST
    - [hidden] _token — 
    - [hidden] _method — 
  - Action: https://ecom-demo.workdo.io/product/17 Method: POST
    - [hidden] _token — 
    - [hidden] _method — 
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 销售产品报告
- URL: https://ecom-demo.workdo.io/product-order-sale-reports
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 产品问题
- URL: https://ecom-demo.workdo.io/product-question
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 个人资料
- URL: https://ecom-demo.workdo.io/profile
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/edit-profile Method: POST
    - [hidden] _token — 
    - [hidden] _token — 
    - [file] profile_image — 在此选择文件
    - [text] name — 名称
    - [text] email — 电子邮件
    - [text] mobile — 没有手机.
    - [submit]  — 名称
  - Action: https://ecom-demo.workdo.io/user-password-update Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
    - [hidden] _token — 
    - [password] old_password — 当前的密码
    - [password] new_password — 新的密码
    - [password] new_password_confirmation — 重新输入新密码
    - [hidden] type — 当前的密码
    - [submit]  — 当前的密码
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单退款要求
- URL: https://ecom-demo.workdo.io/refund-request
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 客户报告
- URL: https://ecom-demo.workdo.io/reports
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 控制台
- URL: https://ecom-demo.workdo.io/request-cancel/2
- Tables:
  - Table 1 headers: 图像, 产品, 价格
  - Table 2 headers: 命令, 时间, 情况
- Actions:
  - link: Add New Main Category (#)
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 角色
- URL: https://ecom-demo.workdo.io/roles
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 设置
- URL: https://ecom-demo.workdo.io/setting
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 航行类别
- URL: https://ecom-demo.workdo.io/shipping
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### 
- URL: https://ecom-demo.workdo.io/shippinglabel/pdf/eyJpdiI6IjBrL0NUbUYydEZjc2M2Vm9IOUVoZUE9PSIsInZhbHVlIjoiN0FvRlFjTlY1VEV5OVg2anhiVm5Fdz09IiwibWFjIjoiODkyNzIwNjI3YWE4YTM0MjA2MjgzZjIwMjFjZTg3ODhhZjc0NTY0Y2FjYTQ1MTFlNjViOTc5NTE0YzExNjgyOSIsInRhZyI6IiJ9
- Tables:
  - Table 1 headers: 其他, 时间:, 总数:
  - Table 2 headers: 顺序号:, 其他:

### 
- URL: https://ecom-demo.workdo.io/shippinglabel/pdf/eyJpdiI6IjNwUnlmYkNwNWZFZTROT0FRTXdXM1E9PSIsInZhbHVlIjoiTm1SMkNXQVRJYXhzNDI4ZmloRDBkZz09IiwibWFjIjoiZWExZTc2ZjE4NmY3YzRkNjdlZmRmMzg5OGMyYzAyNzNmMGViMzAwNzhkYmY1YWIwZWY4OGZhMGU5NmU2MjdhZCIsInRhZyI6IiJ9
- Tables:
  - Table 1 headers: 其他, 时间:, 总数:
  - Table 2 headers: 顺序号:, 其他:

### 
- URL: https://ecom-demo.workdo.io/shippinglabel/pdf/eyJpdiI6ImlVRi9RZS9LeFNjanE4Tk00d2xiVmc9PSIsInZhbHVlIjoiWXZoZko4ajM3OVFsU2c2dEMxeTkwUT09IiwibWFjIjoiNmYxMjQxZjdhNzk3MGRjZWVmNzg2Y2QwNTJkZDgwZDExZWRkNmJiMmIzMTM4NmYzNTE0ODNlYjBkYTliMTU4YSIsInRhZyI6IiJ9
- Tables:
  - Table 1 headers: 其他, 时间:, 总数:
  - Table 2 headers: 顺序号:, 其他:

### 
- URL: https://ecom-demo.workdo.io/shippinglabel/pdf/eyJpdiI6ImZuTzFrNkNJRlhGSTB3TExjazlvenc9PSIsInZhbHVlIjoiMXhTS3lhZ3VjdXBoWjNGdXIrSXFoQT09IiwibWFjIjoiOTRhZDYzMGEwZjQ5NzBkZDU4ZWFiNmRkZDA2ZjIxZTY5NTZkNDAwODEyNmU5NzI4ODU0MWExNDAyMmQ3ZmZjNSIsInRhZyI6IiJ9
- Tables:
  - Table 1 headers: 其他, 时间:, 总数:
  - Table 2 headers: 顺序号:, 其他:

### eCommerceGo SaaS - 航运区
- URL: https://ecom-demo.workdo.io/shipping-zone
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 订单状态报告
- URL: https://ecom-demo.workdo.io/Status-reports
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 库存报告
- URL: https://ecom-demo.workdo.io/stock-reports
- Tables:
  - Table 1 headers: 产品名称, 类别, 库存情况, 库存量, 行动
  - Table 2 headers: 产品名称, 类别, 库存情况, 库存量, 行动
  - Table 3 headers: 产品名称, 类别, 库存情况, 库存量, 行动
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 创建存储
- URL: https://ecom-demo.workdo.io/stores/create
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/stores Method: POST
    - [hidden] _token — 
    - [text] storename — 商店名称
    - [text]  — 商店名称
    - [radio] theme_id — Stylique
    - [radio] theme_id — Greentic
    - [radio] theme_id — Techzonix
    - [submit]  — 商店名称
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### 首页
- URL: https://ecom-demo.workdo.io/stylique/home
- Forms:
  - Action:  Method: GET
    - [text] search_product — 
  - Action: https://ecom-demo.workdo.io/newsletter?stylique Method: POST
    - [hidden] _token — 
    - [email]  — 
  - Action:  Method: GET
    - [text]  — 

### eCommerceGo SaaS - 支持票
- URL: https://ecom-demo.workdo.io/support_ticket
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 标记
- URL: https://ecom-demo.workdo.io/tag
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### 首页
- URL: https://ecom-demo.workdo.io/techzonix/home
- Forms:
  - Action: https://ecom-demo.workdo.io/newsletter?techzonix Method: POST
    - [hidden] _token — 
    - [email] email — 
  - Action:  Method: GET
    - [text]  — 
- Actions:
  - link: View All Blogs (https://ecom-demo.workdo.io/techzonix/blog)
  - link: View All Categories (https://ecom-demo.workdo.io/techzonix/product-list)
  - link: View All Collections (https://ecom-demo.workdo.io/techzonix/product-list)
  - link: View All Product (https://ecom-demo.workdo.io/techzonix/product-list)

### eCommerceGo SaaS - 证词
- URL: https://ecom-demo.workdo.io/testimonial
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 存储分析
- URL: https://ecom-demo.workdo.io/themean-alytic
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 其他主题
- URL: https://ecom-demo.workdo.io/theme-customize
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/theme-preview/make-active Method: POST
    - [hidden] _token — 
    - [hidden] _token — 
    - [hidden] theme_id — 
  - Action: https://ecom-demo.workdo.io/theme-preview/make-active Method: POST
    - [hidden] _token — 
    - [hidden] _token — 
    - [hidden] theme_id — 
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 定制主题
- URL: https://ecom-demo.workdo.io/theme-customize/greentic/pages
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 定制主题
- URL: https://ecom-demo.workdo.io/theme-customize/stylique/pages
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 定制主题
- URL: https://ecom-demo.workdo.io/theme-customize/techzonix/pages
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 销售额最高的报告
- URL: https://ecom-demo.workdo.io/top-all-reports
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 用户
- URL: https://ecom-demo.workdo.io/users
- Forms:
  - Action: https://ecom-demo.workdo.io/logout Method: POST
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/users/22 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/users/23 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/users/24 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/users/25 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/users/26 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/users/27 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
  - Action: https://ecom-demo.workdo.io/users/28 Method: POST
    - [hidden] _method — 
    - [hidden] _token — 
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

### eCommerceGo SaaS - 愿望清单
- URL: https://ecom-demo.workdo.io/wishlist
- Actions:
  - link: Boost your e-commerce Business with Premium Add-Ons (https://workdo.io/product-category/ecommercego-saas-add-ons/ecommercego-add-ons/?utm_source=demo&utm_medium=ecommercego&utm_campaign=topbar)
  - button: Save changes ()

## Business Logic (Inferred)
- Product catalog management: brands, labels, categories, attributes, products.
- Order lifecycle: manage orders, refunds, shipping.
- Customers: management, reports, wishlist.
- Marketing: coupons, flash sales, newsletter, blog, pages, menus.
- Shipping: classes and zones.
- Access control: roles and users.
- Reporting: sales, stock, status, top sales.

## User Stories
- As a Store Admin, I manage the product catalog to sell items.
- As Staff, I process orders and refunds to resolve issues.
- As a Store Admin, I configure shipping to control delivery costs.
- As a Marketer, I run campaigns via coupons and flash sales.
- As a Content Manager, I maintain blog, pages, menus, FAQs.
- As an Owner, I manage roles and users to grant permissions.
- As a Delivery Boy, I view and fulfill assigned deliveries.

## ERD (Inferred)
```mermaid
erDiagram
  USER ||--o{ ROLE_USER : assigns
  ROLE ||--o{ ROLE_USER : contains
  USER { int id string name string email string password }
  ROLE { int id string name }
  CUSTOMER { int id string name string email string phone }
  BRAND { int id string name }
  LABEL { int id string name color }
  CATEGORY { int id string name int parent_id }
  PRODUCT ||--o{ PRODUCT_ATTRIBUTE_VALUE : has
  PRODUCT ||--o{ PRODUCT_IMAGE : has
  PRODUCT ||--o{ ORDER_ITEM : sold_in
  CATEGORY ||--o{ PRODUCT : classifies
  BRAND ||--o{ PRODUCT : brands
  LABEL ||--o{ PRODUCT : labels
  PRODUCT { int id string name text description decimal price int brand_id int category_id }
  PRODUCT_ATTRIBUTE { int id string name }
  PRODUCT_ATTRIBUTE_VALUE { int id int product_id int attribute_id string value }
  PRODUCT_IMAGE { int id int product_id string path }
  ORDER ||--o{ ORDER_ITEM : contains
  CUSTOMER ||--o{ ORDER : places
  ORDER { int id int customer_id decimal total string status int shipping_address_id }
  ORDER_ITEM { int id int order_id int product_id int qty decimal price }
  SHIPPING_CLASS { int id string name }
  SHIPPING_ZONE { int id string name }
  COUPON { int id string code decimal discount string type datetime valid_from datetime valid_to }
  WISHLIST { int id int customer_id int product_id }
  REFUND_REQUEST { int id int order_id int order_item_id string reason string status }
  BLOG_POST { int id string title text content int category_id datetime published_at }
  BLOG_CATEGORY { int id string name }
  PAGE { int id string title text content }
  MENU { int id string name }
  TESTIMONIAL { int id string author text content int rating }
  SUPPORT_TICKET { int id int customer_id string subject text message string status }
```


## ERD Image
![](erd.png)

