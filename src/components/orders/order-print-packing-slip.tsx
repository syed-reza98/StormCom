'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Printer, Loader2 } from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  image?: string;
}

interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
}

interface OrderPrintPackingSlipProps {
  orderId: string;
  orderNumber: string;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  notes?: string;
  onPrint?: () => void;
}

export function OrderPrintPackingSlip({
  orderId,
  orderNumber,
  items,
  shippingAddress,
  notes,
  onPrint,
}: OrderPrintPackingSlipProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = async () => {
    setIsPrinting(true);
    try {
      // Generate print preview
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Packing Slip - ${orderNumber}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { font-size: 24px; margin-bottom: 20px; }
                .section { margin-bottom: 20px; }
                .label { font-weight: bold; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f4f4f4; }
                @media print {
                  button { display: none; }
                }
              </style>
            </head>
            <body>
              <h1>Packing Slip</h1>
              <div class="section">
                <p><span class="label">Order Number:</span> ${orderNumber}</p>
                <p><span class="label">Order ID:</span> ${orderId}</p>
              </div>
              <div class="section">
                <h2>Shipping Address</h2>
                <p>${shippingAddress.name}</p>
                <p>${shippingAddress.line1}</p>
                ${shippingAddress.line2 ? `<p>${shippingAddress.line2}</p>` : ''}
                <p>${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}</p>
                <p>${shippingAddress.country}</p>
                ${shippingAddress.phone ? `<p>Phone: ${shippingAddress.phone}</p>` : ''}
              </div>
              <div class="section">
                <h2>Items</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>SKU</th>
                      <th>Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${items.map(item => `
                      <tr>
                        <td>${item.name}</td>
                        <td>${item.sku}</td>
                        <td>${item.quantity}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              ${notes ? `
                <div class="section">
                  <h2>Notes</h2>
                  <p>${notes}</p>
                </div>
              ` : ''}
              <button onclick="window.print()">Print</button>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
      
      onPrint?.();
    } catch (error) {
      console.error('Print error:', error);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Packing Slip</CardTitle>
      </CardHeader>
      <CardContent>
        <Button
          onClick={handlePrint}
          disabled={isPrinting}
          className="w-full"
        >
          {isPrinting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Preparing...
            </>
          ) : (
            <>
              <Printer className="mr-2 h-4 w-4" />
              Print Packing Slip
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
