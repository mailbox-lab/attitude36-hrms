'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Loader2 } from 'lucide-react'

// ===== Types =====

type ClientFormData = {
  name: string
  industry: string
  website: string
  address: string
  city: string
  state: string
  country: string
  description: string
  contactName: string
  contactEmail: string
  contactPhone: string
  status: string
}

type EditClientData = {
  id: string
  name: string
  industry: string | null
  website: string | null
  address: string | null
  city: string | null
  state: string | null
  country: string
  description: string | null
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  status: string
}

type AddClientDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  editClient?: EditClientData | null
}

// ===== Schema =====

const clientSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  industry: z.string().default(''),
  website: z.string().default(''),
  address: z.string().default(''),
  city: z.string().default(''),
  state: z.string().default(''),
  country: z.string().default('India'),
  description: z.string().default(''),
  contactName: z.string().default(''),
  contactEmail: z.string().email('Invalid email').or(z.literal('')).default(''),
  contactPhone: z.string().default(''),
  status: z.string().default('Active'),
})

// ===== Industry Options =====

const INDUSTRY_OPTIONS = [
  'Information Technology',
  'Healthcare',
  'Finance & Banking',
  'Education',
  'Manufacturing',
  'Retail & E-commerce',
  'Real Estate',
  'Telecommunications',
  'Media & Entertainment',
  'Consulting',
  'Logistics & Supply Chain',
  'Automotive',
  'Pharmaceuticals',
  'Energy & Utilities',
  'Other',
]

const STATUS_OPTIONS = ['Active', 'Inactive', 'Prospect']

// ===== Default Values =====

const DEFAULT_VALUES: ClientFormData = {
  name: '',
  industry: '',
  website: '',
  address: '',
  city: '',
  state: '',
  country: 'India',
  description: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  status: 'Active',
}

// ===== Component =====

export function AddClientDialog({
  open,
  onOpenChange,
  editClient,
}: AddClientDialogProps) {
  const queryClient = useQueryClient()

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: DEFAULT_VALUES,
  })

  // Populate form when editing
  useEffect(() => {
    if (editClient && open) {
      form.reset({
        name: editClient.name || '',
        industry: editClient.industry || '',
        website: editClient.website || '',
        address: editClient.address || '',
        city: editClient.city || '',
        state: editClient.state || '',
        country: editClient.country || 'India',
        description: editClient.description || '',
        contactName: editClient.contactName || '',
        contactEmail: editClient.contactEmail || '',
        contactPhone: editClient.contactPhone || '',
        status: editClient.status || 'Active',
      })
    } else if (!editClient && open) {
      form.reset(DEFAULT_VALUES)
    }
  }, [editClient, open, form])

  const isEditing = !!editClient

  const mutation = useMutation({
    mutationFn: async (data: ClientFormData) => {
      const payload = {
        ...data,
        industry: data.industry || null,
        website: data.website || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        description: data.description || null,
        contactName: data.contactName || null,
        contactEmail: data.contactEmail || null,
        contactPhone: data.contactPhone || null,
      }
      if (isEditing) {
        const res = await fetch(`/api/clients/${editClient.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed to update client')
        return res.json()
      } else {
        const res = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) throw new Error('Failed to create client')
        return res.json()
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['client'] })
      toast.success(
        isEditing ? 'Client updated successfully' : 'Client added successfully'
      )
      onOpenChange(false)
      form.reset(DEFAULT_VALUES)
    },
    onError: () => {
      toast.error(isEditing ? 'Failed to update client' : 'Failed to add client')
    },
  })

  function onSubmit(data: ClientFormData) {
    mutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Client' : 'Add New Client'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update client information below.'
              : 'Fill in the details to add a new hiring company.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Company Name & Status */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Technologies Pvt. Ltd." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Industry & Website */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDUSTRY_OPTIONS.map((industry) => (
                            <SelectItem key={industry} value={industry}>
                              {industry}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://www.example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Business Park, Sector 5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* City, State, Country */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="Mumbai" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="Maharashtra" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="India" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Contact Person Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Contact Person</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="contactName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="john@company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+91 98765 43210" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Brief description about the company..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Update Client' : 'Add Client'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
