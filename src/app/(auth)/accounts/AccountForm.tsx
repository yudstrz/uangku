"use client";

import { useState } from 'react';
import Button from '@/components/Button';
import { Input, Select, FormGroup } from '@/components/form';
import { Account } from '@/types';
import { BanknotesIcon } from '@heroicons/react/24/outline';

interface AccountFormProps {
  onSubmit: (data: Partial<Account>) => void;
  onCancel: () => void;
  initialData?: Partial<Account> | null;
}

export default function AccountForm({
  onSubmit,
  onCancel,
  initialData
}: AccountFormProps) {
  const [formData, setFormData] = useState<any>({
    name: '',
    type: 'bank',
    ...initialData,
    balance: initialData?.balance !== undefined ? String(initialData.balance) : '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const accountTypes = [
    { value: 'bank', label: 'Bank Account' },
    { value: 'cash', label: 'Cash & Wallet' },
    { value: 'credit', label: 'Credit Card' },
    { value: 'investment', label: 'Investment Account' },
    { value: 'other', label: 'Other' },
  ];

  const handleChange = (name: string, value: any) => {
    if (name === 'balance') {
      let cleanValue = value;
      if (cleanValue.startsWith('0') && cleanValue.length > 1 && cleanValue[1] !== '.') {
        cleanValue = cleanValue.replace(/^0+/, '');
        if (cleanValue === '') cleanValue = '0';
      }
      setFormData((prev: any) => ({
        ...prev,
        balance: cleanValue
      }));
    } else {
      setFormData((prev: any) => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = 'Account name is required';
    }

    if (formData.balance === undefined || formData.balance === '') {
      newErrors.balance = 'Balance is required';
    } else {
      const balanceNum = parseFloat(formData.balance as unknown as string);
      if (isNaN(balanceNum)) {
        newErrors.balance = 'Balance must be a valid number';
      }
    }

    if (!formData.type) {
      newErrors.type = 'Account type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit({
        ...formData,
        balance: parseFloat(formData.balance as unknown as string) || 0
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 mt-4">
      <FormGroup>
        {/* Account Name */}
        <Input
          id="name"
          name="name"
          type="text"
          label="Account Name"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={errors.name}
          placeholder="e.g., Checking Account, Cash Wallet"
        />

        {/* Account Type */}
        <Select
          id="type"
          name="type"
          label="Account Type"
          value={formData.type}
          options={accountTypes}
          onChange={(value) => handleChange('type', value)}
          error={errors.type}
        />

        {/* Balance */}
        <Input
          id="balance"
          name="balance"
          type="number"
          step="0.01"
          label="Current Balance"
          value={formData.balance === undefined ? '' : formData.balance}
          onChange={(e) => handleChange('balance', e.target.value)}
          error={errors.balance}
          icon={<BanknotesIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />}
          placeholder="0.00"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          For credit cards, enter a negative balance if you owe money.
        </p>
      </FormGroup>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {initialData ? 'Update' : 'Add'} Account
        </Button>
      </div>
    </form>
  );
} 