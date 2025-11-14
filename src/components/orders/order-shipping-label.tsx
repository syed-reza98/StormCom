'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, Printer, Loader2, Package } from 'lucide-react';

const shippingLabelSchema = z.object({
  carrier: z.enum(['ups', 'fedex', 'usps', 'dhl']),
  labelFormat: z.enum(['4x6', 'a4', 'letter']),
});

type ShippingLabelFormData = z.infer<typeof shippingLabelSchema>;

interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface OrderShippingLabelProps {
  orderId?: string;
  orderNumber: string;
  shippingAddress: ShippingAddress;
  trackingNumber?: string;
  onGenerate?: (data: ShippingLabelFormData) => Promise<void>;
}

const carriers = [
  { value: 'ups', label: 'UPS' },
  { value: 'fedex', label: 'FedEx' },
  { value: 'usps', label: 'USPS' },
  { value: 'dhl', label: 'DHL' },
];

const labelFormats = [
  { value: '4x6', label: '4x6 inches (Standard)' },
  { value: 'a4', label: 'A4' },
  { value: 'letter', label: 'Letter (8.5x11)' },
];

export function OrderShippingLabel({
  orderNumber,
  shippingAddress,
  trackingNumber,
  onGenerate,
}: OrderShippingLabelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [labelGenerated, setLabelGenerated] = useState(false);

  const form = useForm<ShippingLabelFormData>({
    resolver: zodResolver(shippingLabelSchema),
    defaultValues: {
      carrier: 'ups',
      labelFormat: '4x6',
    },
  });

  const onSubmit = async (data: ShippingLabelFormData) => {
    setIsGenerating(true);
    try {
      await onGenerate?.(data);
      setLabelGenerated(true);
    } catch (error) {
      console.error('Label generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    // In real implementation, this would download the label PDF
    console.log('Downloading label...');
  };

  const handlePrint = () => {
    // In real implementation, this would print the label
    window.print();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Shipping Label
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm">
            <span className="font-medium">Order:</span> {orderNumber}
          </div>
          {trackingNumber && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Tracking:</span>
              <Badge variant="secondary">{trackingNumber}</Badge>
            </div>
          )}
        </div>

        <div className="rounded-lg border p-3 text-sm">
          <div className="font-medium mb-2">Shipping Address</div>
          <div className="text-muted-foreground space-y-1">
            <div>{shippingAddress.name}</div>
            <div>{shippingAddress.line1}</div>
            {shippingAddress.line2 && <div>{shippingAddress.line2}</div>}
            <div>
              {shippingAddress.city}, {shippingAddress.state}{' '}
              {shippingAddress.postalCode}
            </div>
            <div>{shippingAddress.country}</div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="carrier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Carrier</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select carrier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {carriers.map((carrier) => (
                        <SelectItem key={carrier.value} value={carrier.value}>
                          {carrier.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="labelFormat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label Format</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select format" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {labelFormats.map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!labelGenerated ? (
              <Button
                type="submit"
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Label'
                )}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDownload}
                  className="flex-1"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrint}
                  className="flex-1"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
