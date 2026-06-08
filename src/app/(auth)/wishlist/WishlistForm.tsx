"use client";

import { useForm } from "react-hook-form";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { useEffect } from "react";

type WishlistFormData = {
  name: string;
  price: number;
  link?: string;
};

type WishlistFormProps = {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  initialData?: any | null;
};

export default function WishlistForm({ onSubmit, onCancel, initialData }: WishlistFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WishlistFormData>();

  useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name,
        price: initialData.price,
        link: initialData.link || "",
      });
    } else {
      reset({
        name: "",
        price: 0,
        link: "",
      });
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Name <span className="text-red-500">*</span>
        </label>
        <Input
          {...register("name", { required: "Name is required" })}
          placeholder="E.g., New Laptop"
          className="mt-1"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Price <span className="text-red-500">*</span>
        </label>
        <Input
          type="number"
          step="0.01"
          {...register("price", {
            required: "Price is required",
            min: { value: 0, message: "Price must be positive" },
            valueAsNumber: true,
          })}
          placeholder="0.00"
          className="mt-1"
        />
        {errors.price && (
          <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Link (Optional)
        </label>
        <Input
          type="url"
          {...register("link")}
          placeholder="https://example.com/product"
          className="mt-1"
        />
        {errors.link && (
          <p className="mt-1 text-sm text-red-600">{errors.link.message}</p>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {initialData ? "Save Changes" : "Add to Wishlist"}
        </Button>
      </div>
    </form>
  );
}
