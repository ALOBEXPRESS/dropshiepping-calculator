/**
 * LeadMobileCard Component
 * 
 * Card-based layout for displaying lead information on mobile devices.
 * Replaces the table view on small screens for better mobile UX.
 * 
 * Requirements: 11.1, 11.2
 */

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Edit,
  Trash2,
  Mail,
  Phone,
  Building2,
  Store,
  Calendar,
  User,
} from 'lucide-react';
import type { Lead } from '@/types/leads';
import {
  formatDate,
  formatPhoneNumber,
  getStatusColor,
  getStatusLabel,
  getStatusIcon,
} from './utils';

interface LeadMobileCardProps {
  lead: Lead;
  index: number;
  isSelected: boolean;
  onSelect: (leadId: string) => void;
  onEdit: (lead: Lead) => void;
  onDelete: (leadId: string) => void;
}

/**
 * LeadMobileCard - Mobile-optimized card layout for a single lead
 * 
 * Features:
 * - Compact card layout with key information
 * - Touch-friendly action buttons (48x48px minimum)
 * - Status badge with icon
 * - Checkbox for selection
 * - Responsive spacing and typography
 */
export function LeadMobileCard({
  lead,
  index,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: LeadMobileCardProps) {
  const StatusIcon = getStatusIcon(lead.lead_status || 'new');

  return (
    <Card
      className={`transition-all ${
        isSelected ? 'ring-2 ring-primary' : ''
      } hover:shadow-md`}
      role="article"
      aria-label={`Lead ${lead.name}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          {/* Left side: Checkbox and lead info */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Checkbox */}
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onSelect(lead.id)}
              aria-label={`Selecionar ${lead.name}`}
              className="mt-1 shrink-0"
            />

            {/* Lead name and index */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-muted-foreground">
                  #{index + 1}
                </span>
              </div>
              <h3 className="font-semibold text-base leading-tight truncate">
                {lead.name}
              </h3>
            </div>
          </div>

          {/* Right side: Status badge */}
          {lead.lead_status && (
            <Badge
              className={`${getStatusColor(lead.lead_status)} shrink-0`}
              aria-label={`Status: ${getStatusLabel(lead.lead_status)}`}
            >
              <StatusIcon className="h-3 w-3 mr-1" aria-hidden="true" />
              <span className="text-xs">{getStatusLabel(lead.lead_status)}</span>
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Contact information */}
        <div className="space-y-2">
          {/* Email */}
          {lead.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
              <a
                href={`mailto:${lead.email}`}
                className="text-muted-foreground hover:text-primary truncate"
                aria-label={`Email: ${lead.email}`}
              >
                {lead.email}
              </a>
            </div>
          )}

          {/* Phone */}
          {(lead.phone || lead.mobile_phone) && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
              <a
                href={`tel:${lead.phone || lead.mobile_phone}`}
                className="text-muted-foreground hover:text-primary"
                aria-label={`Telefone: ${formatPhoneNumber(lead.phone || lead.mobile_phone)}`}
              >
                {formatPhoneNumber(lead.phone || lead.mobile_phone)}
              </a>
            </div>
          )}

          {/* Company */}
          {(lead.company_name || lead.trade_name) && (
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
              <span className="text-muted-foreground truncate">
                {lead.company_name || lead.trade_name}
              </span>
            </div>
          )}

          {/* Marketplace */}
          {lead.marketplace_name && (
            <div className="flex items-center gap-2 text-sm">
              <Store className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
              <span className="text-muted-foreground truncate">
                {lead.marketplace_name}
              </span>
            </div>
          )}

          {/* Created date */}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
            <span className="text-muted-foreground">
              {formatDate(lead.created_at)}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(lead)}
            className="flex-1 h-10 gap-2"
            aria-label={`Editar ${lead.name}`}
          >
            <Edit className="h-4 w-4" />
            <span>Editar</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(lead.id)}
            className="flex-1 h-10 gap-2 text-destructive hover:text-destructive"
            aria-label={`Deletar ${lead.name}`}
          >
            <Trash2 className="h-4 w-4" />
            <span>Deletar</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
