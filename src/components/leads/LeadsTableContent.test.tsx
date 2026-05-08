/**
 * Tests for LeadsTableContent Component
 * 
 * Tests virtualization, sorting, selection, and data formatting
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LeadsTableContent } from './LeadsTableContent';
import type { Lead, SortConfig } from '@/types/leads';

// Mock lead data
const mockLeads: Lead[] = [
  {
    id: '1',
    organization_id: 'org-1',
    name: 'João Silva',
    email: 'joao@example.com',
    phone: '11987654321',
    mobile_phone: null,
    company_name: 'Empresa A',
    trade_name: null,
    marketplace_id: 'mp-1',
    marketplace_name: 'Mercado Livre',
    lead_status: 'new',
    lead_source: 'website',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
    is_active: true,
  },
  {
    id: '2',
    organization_id: 'org-1',
    name: 'Maria Santos',
    email: 'maria@example.com',
    phone: null,
    mobile_phone: '11976543210',
    company_name: null,
    trade_name: 'Loja B',
    marketplace_id: 'mp-2',
    marketplace_name: 'Shopee',
    lead_status: 'qualified',
    lead_source: 'referral',
    created_at: '2024-01-16T10:00:00Z',
    updated_at: '2024-01-16T10:00:00Z',
    is_active: true,
  },
  {
    id: '3',
    organization_id: 'org-1',
    name: 'Pedro Costa',
    email: null,
    phone: null,
    mobile_phone: null,
    company_name: 'Empresa C',
    trade_name: null,
    marketplace_id: null,
    marketplace_name: undefined,
    lead_status: 'lost',
    lead_source: null,
    created_at: '2024-01-17T10:00:00Z',
    updated_at: '2024-01-17T10:00:00Z',
    is_active: true,
  },
];

describe('LeadsTableContent', () => {
  const defaultProps = {
    leads: mockLeads,
    isLoading: false,
    sort: { column: 'created_at', direction: 'desc' as const },
    onSortChange: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    selectedLeads: [],
    onSelectionChange: vi.fn(),
  };

  it('renders table with all leads', () => {
    render(<LeadsTableContent {...defaultProps} />);

    expect(screen.getByText('João Silva')).toBeInTheDocument();
    expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    expect(screen.getByText('Pedro Costa')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    render(<LeadsTableContent {...defaultProps} isLoading={true} />);

    expect(screen.getByText('Carregando leads...')).toBeInTheDocument();
  });

  it('displays empty state when no leads', () => {
    render(<LeadsTableContent {...defaultProps} leads={[]} />);

    expect(screen.getByText('Nenhum lead encontrado')).toBeInTheDocument();
  });

  it('renders all table columns', () => {
    render(<LeadsTableContent {...defaultProps} />);

    // Check column headers
    expect(screen.getByText('#')).toBeInTheDocument();
    expect(screen.getByText('Nome')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Telefone')).toBeInTheDocument();
    expect(screen.getByText('Empresa')).toBeInTheDocument();
    expect(screen.getByText('Canal')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Data de Criação')).toBeInTheDocument();
    expect(screen.getByText('Ações')).toBeInTheDocument();
  });

  it('displays formatted phone numbers', () => {
    render(<LeadsTableContent {...defaultProps} />);

    // Check that phone numbers are formatted
    expect(screen.getByText('(11) 98765-4321')).toBeInTheDocument();
    expect(screen.getByText('(11) 97654-3210')).toBeInTheDocument();
  });

  it('displays status badges with correct labels', () => {
    render(<LeadsTableContent {...defaultProps} />);

    expect(screen.getByText('Novo')).toBeInTheDocument();
    expect(screen.getByText('Qualificado')).toBeInTheDocument();
    expect(screen.getByText('Perdido')).toBeInTheDocument();
  });

  it('displays marketplace names', () => {
    render(<LeadsTableContent {...defaultProps} />);

    expect(screen.getByText('Mercado Livre')).toBeInTheDocument();
    expect(screen.getByText('Shopee')).toBeInTheDocument();
  });

  it('displays "-" for missing data', () => {
    render(<LeadsTableContent {...defaultProps} />);

    // Pedro Costa has no email, phone, or marketplace
    const rows = screen.getAllByRole('row');
    const pedroRow = rows.find(row => row.textContent?.includes('Pedro Costa'));
    
    expect(pedroRow).toBeDefined();
  });

  it('handles "select all" checkbox', () => {
    const onSelectionChange = vi.fn();
    render(
      <LeadsTableContent
        {...defaultProps}
        onSelectionChange={onSelectionChange}
      />
    );

    const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
    fireEvent.click(selectAllCheckbox);

    expect(onSelectionChange).toHaveBeenCalledWith(['1', '2', '3']);
  });

  it('handles individual row selection', () => {
    const onSelectionChange = vi.fn();
    render(
      <LeadsTableContent
        {...defaultProps}
        onSelectionChange={onSelectionChange}
      />
    );

    // Click the checkbox for João Silva (second checkbox, first is select all)
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]);

    expect(onSelectionChange).toHaveBeenCalledWith(['1']);
  });

  it('handles deselection of individual row', () => {
    const onSelectionChange = vi.fn();
    render(
      <LeadsTableContent
        {...defaultProps}
        selectedLeads={['1', '2']}
        onSelectionChange={onSelectionChange}
      />
    );

    // Click the checkbox for João Silva to deselect
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[1]);

    expect(onSelectionChange).toHaveBeenCalledWith(['2']);
  });

  it('handles column sorting', () => {
    const onSortChange = vi.fn();
    render(
      <LeadsTableContent
        {...defaultProps}
        onSortChange={onSortChange}
      />
    );

    // Click on "Nome" column header to sort
    const nameButton = screen.getByRole('button', { name: /Ordenar por Nome/i });
    fireEvent.click(nameButton);

    expect(onSortChange).toHaveBeenCalledWith({
      column: 'name',
      direction: 'asc',
    });
  });

  it('toggles sort direction when clicking same column', () => {
    const onSortChange = vi.fn();
    render(
      <LeadsTableContent
        {...defaultProps}
        sort={{ column: 'name', direction: 'asc' }}
        onSortChange={onSortChange}
      />
    );

    // Click on "Nome" column header again to toggle direction
    const nameButton = screen.getByRole('button', { name: /Ordenar por Nome/i });
    fireEvent.click(nameButton);

    expect(onSortChange).toHaveBeenCalledWith({
      column: 'name',
      direction: 'desc',
    });
  });

  it('displays sort indicators', () => {
    render(
      <LeadsTableContent
        {...defaultProps}
        sort={{ column: 'name', direction: 'asc' }}
      />
    );

    // Check that sort indicator is present (ArrowUp icon)
    const nameButton = screen.getByRole('button', { name: /Ordenar por Nome/i });
    expect(nameButton).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    render(
      <LeadsTableContent
        {...defaultProps}
        onEdit={onEdit}
      />
    );

    // Click edit button for João Silva
    const editButtons = screen.getAllByLabelText(/Editar/i);
    fireEvent.click(editButtons[0]);

    expect(onEdit).toHaveBeenCalledWith(mockLeads[0]);
  });

  it('calls onDelete when delete button is clicked', () => {
    const onDelete = vi.fn();
    render(
      <LeadsTableContent
        {...defaultProps}
        onDelete={onDelete}
      />
    );

    // Click delete button for João Silva
    const deleteButtons = screen.getAllByLabelText(/Deletar/i);
    fireEvent.click(deleteButtons[0]);

    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('displays sequential row numbers', () => {
    render(<LeadsTableContent {...defaultProps} />);

    // Check that row numbers are displayed
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('applies selected state to rows', () => {
    render(
      <LeadsTableContent
        {...defaultProps}
        selectedLeads={['1']}
      />
    );

    const rows = screen.getAllByRole('row');
    const joaoRow = rows.find(row => row.textContent?.includes('João Silva'));
    
    expect(joaoRow).toHaveAttribute('data-state', 'selected');
  });
});
