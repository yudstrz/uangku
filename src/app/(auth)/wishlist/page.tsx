"use client";

import { useEffect, useState } from 'react';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { showToast } from 'nextjs-toast-notify';
import { PlusIcon, PencilIcon, TrashIcon, LinkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import WishlistForm from './WishlistForm';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

type WishlistItem = {
  id: string;
  name: string;
  price: number;
  link?: string;
  userId: string;
  createdAt: string;
};

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WishlistItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchWishlist = async () => {
    await fetch('/api/wishlist', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          showToast.error(`Error fetching wishlist`, {
            duration: 3000,
            progress: true,
            position: "top-right",
            transition: "bounceIn",
            icon: '',
            sound: true,
          });
          console.error('Error fetching wishlist:', data.error);
        } else {
          setWishlist(data);
        }
      })
      .catch(error => {
        showToast.error(`Error fetching wishlist`, {
          duration: 3000,
          progress: true,
          position: "top-right",
          transition: "bounceIn",
          icon: '',
          sound: true,
        });
        console.error('Error fetching wishlist:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleAddOrEdit = async (data: any) => {
    if (editingItem) {
      await fetch('/api/wishlist/edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...data, id: editingItem.id }),
      })
        .then(res => res.json())
        .then(resData => {
          if (resData.error) {
            showToast.error(`Error updating wishlist`, {
              duration: 3000,
              progress: true,
              position: "top-right",
              transition: "bounceIn",
              icon: '',
              sound: true,
            });
            console.error('Error updating wishlist:', resData.error);
          } else {
            const updatedItems = wishlist.map(c =>
              c.id === editingItem.id ? { ...data, id: editingItem.id } as WishlistItem : c
            );
            setWishlist(updatedItems);
            showToast.success(`Wishlist updated successfully`, {
              duration: 3000,
              progress: true,
              position: "top-right",
              transition: "bounceIn",
              icon: '',
              sound: true,
            });
          }
        });
    } else {
      await fetch('/api/wishlist/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
        .then(res => res.json())
        .then(resData => {
          if (resData.error) {
            showToast.error(`Error adding wishlist`, {
              duration: 3000,
              progress: true,
              position: "top-right",
              transition: "bounceIn",
              icon: '',
              sound: true,
            });
            console.error('Error adding wishlist:', resData.error);
          } else {
            setWishlist([{ ...data, id: resData.id, createdAt: new Date().toISOString() }, ...wishlist]);
            showToast.success(`Wishlist added successfully`, {
              duration: 3000,
              progress: true,
              position: "top-right",
              transition: "bounceIn",
              icon: '',
              sound: true,
            });
          }
        })
        .catch(error => {
          console.error('Error adding wishlist:', error);
          showToast.error(`Error adding wishlist`, {
            duration: 3000,
            progress: true,
            position: "top-right",
            transition: "bounceIn",
            icon: '',
            sound: true,
          });
        });
    }
    setIsFormOpen(false);
    setEditingItem(null);
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/wishlist/delete?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          console.error('Error deleting wishlist item:', data.error);
          showToast.error(`Error deleting item`, {
            duration: 3000,
            progress: true,
            position: "top-right",
            transition: "bounceIn",
            icon: '',
            sound: true,
          });
        } else {
          showToast.success(`Item deleted successfully`, {
            duration: 3000,
            progress: true,
            position: "top-right",
            transition: "bounceIn",
            icon: '',
            sound: true,
          });
          setWishlist(wishlist.filter(c => c.id !== id));
        }
      })
      .catch(error =>
        showToast.error(`Error deleting item`, {
          duration: 3000,
          progress: true,
          position: "top-right",
          transition: "bounceIn",
          icon: '',
          sound: true,
        })
      );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredWishlist = wishlist.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Wishlist</h1>
        <Button
          onClick={() => {
            setEditingItem(null);
            setIsFormOpen(true);
          }}
          className="flex items-center w-full sm:w-auto justify-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Item
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search wishlist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(3).fill(0).map((_, i) => (
            <Card key={i} className="flex flex-col p-4">
              <div className="flex items-center justify-between mb-2">
                <Skeleton width={120} height={24} />
                <div className="flex space-x-2">
                  <Skeleton circle width={20} height={20} />
                  <Skeleton circle width={20} height={20} />
                </div>
              </div>
              <Skeleton width={100} height={20} className="mb-4" />
              <Skeleton width={80} height={16} />
            </Card>
          ))
        ) : (
          <>
            {filteredWishlist.map(item => (
              <Card key={item.id} className="flex flex-col relative overflow-hidden group">
                <div className="flex items-start justify-between mb-2 relative z-10">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white flex-1 pr-2 line-clamp-2">
                    {item.name}
                  </h3>
                  <div className="flex space-x-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => {
                        setEditingItem(item);
                        setIsFormOpen(true);
                      }}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                <div className="text-xl font-bold text-green-600 dark:text-green-400 mb-4 relative z-10">
                  {formatCurrency(item.price)}
                </div>

                {item.link && (
                  <div className="mt-auto pt-2 border-t border-gray-100 dark:border-gray-700 relative z-10">
                    <a 
                      href={item.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      <LinkIcon className="h-4 w-4 mr-1" />
                      View Product
                    </a>
                  </div>
                )}
                
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-green-500 dark:bg-green-600 rounded-full opacity-5 pointer-events-none transition-transform group-hover:scale-150 duration-500 ease-in-out"></div>
              </Card>
            ))}

            {filteredWishlist.length === 0 && wishlist.length > 0 && (
              <Card className="col-span-full py-16 flex flex-col items-center justify-center border-dashed border-2 bg-gray-50 dark:bg-gray-800/50">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <MagnifyingGlassIcon className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No matches found
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
                  We couldn&apos;t find any wishlist items matching &quot;{searchQuery}&quot;.
                </p>
              </Card>
            )}

            {wishlist.length === 0 && (
              <Card className="col-span-full py-16 flex flex-col items-center justify-center border-dashed border-2 bg-gray-50 dark:bg-gray-800/50">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                  <PlusIcon className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Your Wishlist is Empty
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm mb-6">
                  Keep track of things you want to buy. Add your first item to the wishlist to get started.
                </p>
                <Button
                  onClick={() => {
                    setEditingItem(null);
                    setIsFormOpen(true);
                  }}
                >
                  <PlusIcon className="h-5 w-5 mr-2 -ml-1" />
                  Add First Item
                </Button>
              </Card>
            )}
          </>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto transform transition-all">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {editingItem ? 'Edit Wishlist Item' : 'Add to Wishlist'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {editingItem ? 'Update the details of your desired item.' : 'Add a new item you are planning to purchase.'}
              </p>
              <WishlistForm
                onSubmit={handleAddOrEdit}
                onCancel={() => {
                  setIsFormOpen(false);
                  setEditingItem(null);
                }}
                initialData={editingItem}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
