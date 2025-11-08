/**
 * Invoice PDF Generation API Route
 * GET /api/orders/:id/invoice
 * 
 * @description Generates and returns a PDF invoice for a specific order
 * @access Store Admin, Super Admin
 * 
 * TODO: Install PDF generation library (options):
 *   - puppeteer: HTML→PDF (most flexible, best formatting)
 *   - @react-pdf/renderer: React components → PDF
 *   - jspdf: JavaScript PDF generation
 *   - pdfkit: Low-level PDF creation
 * 
 * Current implementation uses placeholder PDF with metadata structure.
 * Replace generatePDFBuffer() with actual PDF library implementation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getInvoiceData } from '@/services/order-service';
import { apiResponse } from '@/lib/api-response';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Extract params
    const { id: orderId } = await context.params;

    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return apiResponse.unauthorized('Authentication required');
    }

    // 2. Authorization - Only Store Admin and Super Admin can generate invoices
    const allowedRoles = ['SUPER_ADMIN', 'STORE_ADMIN'];
    if (!session.user.role || !allowedRoles.includes(session.user.role)) {
      return apiResponse.forbidden(
        'Access denied. Only Store Admin and Super Admin can generate invoices.'
      );
    }

    // 3. Multi-tenant isolation
    const storeId = session.user.role === 'SUPER_ADMIN' 
      ? undefined 
      : session.user.storeId ?? undefined;

    // 4. Get invoice data
    const invoiceData = await getInvoiceData(orderId, storeId);

    if (!invoiceData) {
      return apiResponse.notFound('Order not found or access denied');
    }

    // 5. Generate PDF
    // TODO: Replace with actual PDF generation library
    const pdfBuffer = await generatePDFBuffer(invoiceData);

    // 6. Return PDF with proper headers
    const filename = `invoice-${invoiceData.orderNumber}-${new Date().toISOString().split('T')[0]}.pdf`;
    
    // Convert Buffer to Uint8Array for NextResponse compatibility
    const pdfUint8Array = new Uint8Array(pdfBuffer);

    return new NextResponse(pdfUint8Array, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfUint8Array.length.toString(),
        'Cache-Control': 'private, max-age=0, must-revalidate',
      },
    });

  } catch (error) {
    console.error('Invoice generation error:', error);
    return apiResponse.internalServerError(
      'Failed to generate invoice',
      { originalError: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

/**
 * Generate PDF buffer from invoice data
 * 
 * TODO: Replace this placeholder implementation with actual PDF generation
 * 
 * Recommended approach for StormCom:
 * 1. Create HTML invoice template in src/components/invoices/invoice-template.tsx
 * 2. Use puppeteer to render HTML → PDF server-side
 * 3. Benefits: Full CSS styling, print-optimized layouts, easy to maintain
 * 
 * Example with puppeteer:
 * ```typescript
 * import puppeteer from 'puppeteer';
 * import { renderToString } from 'react-dom/server';
 * import InvoiceTemplate from '@/components/invoices/invoice-template';
 * 
 * const browser = await puppeteer.launch();
 * const page = await browser.newPage();
 * const html = renderToString(<InvoiceTemplate data={invoiceData} />);
 * await page.setContent(html);
 * const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
 * await browser.close();
 * return Buffer.from(pdfBuffer);
 * ```
 */
async function generatePDFBuffer(invoiceData: any): Promise<Buffer> {
  // Placeholder PDF with metadata structure
  // This demonstrates the data structure for the actual PDF implementation

  // Invoice structure that should be rendered in actual PDF:
  // (For reference only - implement with actual PDF library)
  /*
  const invoiceStructure = {
    // Header Section
    header: {
      storeLogo: invoiceData.store.logo,
      storeName: invoiceData.store.name,
      invoiceTitle: 'INVOICE',
      invoiceNumber: invoiceData.orderNumber,
      invoiceDate: invoiceData.createdAt,
      dueDate: invoiceData.createdAt, // Same as order date for paid invoices
    },

    // Seller Information (Store)
    seller: {
      name: invoiceData.store.name,
      address: invoiceData.store.address || 'N/A',
      phone: invoiceData.store.phone || 'N/A',
      email: invoiceData.store.email || 'N/A',
      website: invoiceData.store.domain || 'N/A',
      taxId: invoiceData.store.taxId || 'N/A',
    },

    // Buyer Information (Customer)
    buyer: {
      name: invoiceData.customer.name,
      email: invoiceData.customer.email,
      phone: invoiceData.customer.phone || 'N/A',
      billingAddress: invoiceData.billingAddress,
      shippingAddress: invoiceData.shippingAddress,
    },

    // Line Items Table
    lineItems: invoiceData.items.map((item: any) => ({
      description: `${item.productName}${item.variantName ? ` - ${item.variantName}` : ''}`,
      sku: item.sku || 'N/A',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
    })),

    // Totals Section
    totals: {
      subtotal: invoiceData.subtotal,
      tax: invoiceData.taxAmount,
      shipping: invoiceData.shippingAmount,
      discount: invoiceData.discountAmount,
      total: invoiceData.totalAmount,
    },

    // Payment Information
    payment: {
      method: invoiceData.paymentMethod,
      status: invoiceData.paymentStatus,
      transactionId: invoiceData.transactionId,
    },

    // Shipping Information
    shipping: {
      method: invoiceData.shippingMethod,
      trackingNumber: invoiceData.trackingNumber || 'N/A',
      trackingUrl: invoiceData.trackingUrl || null,
    },

    // Footer Section
    footer: {
      notes: 'Thank you for your business!',
      termsAndConditions: 'All sales are final. Returns accepted within 30 days.',
      contactInfo: `For questions, contact ${invoiceData.store.email || 'support@stormcom.io'}`,
    },

    // Metadata
    metadata,
  };
  */

  // TODO: Replace this with actual PDF generation
  // For now, return a minimal PDF structure as a placeholder
  const placeholderPDF = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >>
endobj
5 0 obj
<< /Length 200 >>
stream
BT
/F1 24 Tf
50 750 Td
(INVOICE - ${invoiceData.orderNumber}) Tj
/F1 12 Tf
50 720 Td
(Store: ${invoiceData.store.name}) Tj
50 700 Td
(Customer: ${invoiceData.customer.name}) Tj
50 680 Td
(Total: $${invoiceData.totalAmount.toFixed(2)}) Tj
50 660 Td
(Status: ${invoiceData.paymentStatus}) Tj
50 640 Td
(Date: ${new Date(invoiceData.createdAt).toLocaleDateString()}) Tj
50 600 Td
(This is a placeholder PDF. Implement with puppeteer or @react-pdf/renderer.) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000214 00000 n
0000000308 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
558
%%EOF`;

  return Buffer.from(placeholderPDF, 'utf-8');
}
