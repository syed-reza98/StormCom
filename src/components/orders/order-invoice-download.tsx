'use client';

import { useState } from 'react';
import { Download, FileText, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface OrderInvoiceDownloadProps {
  invoiceNumber: string;
  onDownload?: (format: 'pdf' | 'html') => Promise<void>;
  onPrint?: () => Promise<void>;
}

export default function OrderInvoiceDownload({
  invoiceNumber,
  onDownload,
  onPrint,
}: OrderInvoiceDownloadProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const handleDownload = async (format: 'pdf' | 'html') => {
    if (!onDownload) return;
    
    setIsDownloading(true);
    try {
      await onDownload(format);
    } catch (error) {
      console.error('Failed to download invoice:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = async () => {
    if (!onPrint) return;
    
    setIsPrinting(true);
    try {
      await onPrint();
    } catch (error) {
      console.error('Failed to print invoice:', error);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isDownloading || isPrinting}
          >
            <Download className="mr-2 h-4 w-4" />
            {isDownloading ? 'Downloading...' : 'Download Invoice'}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Invoice {invoiceNumber}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleDownload('pdf')}>
            <FileText className="mr-2 h-4 w-4" />
            Download as PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleDownload('html')}>
            <FileText className="mr-2 h-4 w-4" />
            Download as HTML
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="outline"
        size="sm"
        onClick={handlePrint}
        disabled={isDownloading || isPrinting}
      >
        <Printer className="mr-2 h-4 w-4" />
        {isPrinting ? 'Printing...' : 'Print'}
      </Button>
    </div>
  );
}
